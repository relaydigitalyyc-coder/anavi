import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const dealRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getDealsByUser(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.id);
      if (!deal) throw new TRPCError({ code: 'NOT_FOUND' });

      const participants = await db.getDealParticipants(input.id);
      const isParticipant = participants.some(p => p.userId === ctx.user.id);
      if (!isParticipant) throw new TRPCError({ code: 'FORBIDDEN' });

      return { deal, participants };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      dealType: z.enum(['commodity_trade', 'real_estate', 'equity_investment', 'debt_financing', 'joint_venture', 'acquisition', 'partnership', 'other']),
      dealValue: z.string().optional(),
      currency: z.string().optional(),
      counterpartyId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { counterpartyId, ...dealData } = input;

      let isFollowOn = false;
      let originalDealId: number | undefined;
      if (counterpartyId) {
        const priorDeal = await db.findCompletedDealWithCounterparty(ctx.user.id, counterpartyId);
        if (priorDeal) {
          isFollowOn = true;
          originalDealId = priorDeal.id;
        }
      }

      const dealId = await db.createDeal({
        ...dealData,
        originatorId: ctx.user.id,
        isFollowOn,
        originalDealId,
        milestones: [
          { id: '1', name: 'Initial Contact', status: 'completed', completedAt: new Date().toISOString() },
          { id: '2', name: 'NDA Signed', status: 'pending', payoutTrigger: false },
          { id: '3', name: 'Due Diligence', status: 'pending', payoutTrigger: false },
          { id: '4', name: 'Term Sheet', status: 'pending', payoutTrigger: true },
          { id: '5', name: 'Documentation', status: 'pending', payoutTrigger: false },
          { id: '6', name: 'Closing', status: 'pending', payoutTrigger: true },
        ],
      } as any);

      let relationshipId: number | undefined;
      if (counterpartyId) {
        const rel = await db.getRelationshipForAttribution(ctx.user.id, counterpartyId);
        if (rel) relationshipId = rel.id;
      }

      await db.addDealParticipant({
        dealId,
        userId: ctx.user.id,
        role: 'originator',
        attributionPercentage: '50.00',
        relationshipId,
      } as any);

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'deal_created',
        entityType: 'deal',
        entityId: dealId,
        newState: { ...dealData, counterpartyId, isFollowOn, originalDealId },
      });

      return { id: dealId, isFollowOn, originalDealId };
    }),

  updateStage: protectedProcedure
    .input(z.object({
      id: z.number(),
      stage: z.enum(['lead', 'qualification', 'due_diligence', 'negotiation', 'documentation', 'closing', 'completed', 'cancelled']),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.id);
      if (!deal) throw new TRPCError({ code: 'NOT_FOUND' });

      await db.updateDeal(input.id, { stage: input.stage });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'deal_stage_updated',
        entityType: 'deal',
        entityId: input.id,
        previousState: { stage: deal.stage },
        newState: { stage: input.stage },
      });

      if (input.stage === 'completed') {
        await db.triggerPayoutsOnDealClose(input.id);
        const participants = await db.getDealParticipants(input.id);
        for (const p of participants) {
          if (p.role === 'originator') {
            const newScore = await db.calculateTrustScore(p.userId);
            await db.assignBadge(p.userId, newScore);
          }
        }
      }

      const participants = await db.getDealParticipants(input.id);
      for (const p of participants) {
        if (p.userId !== ctx.user.id) {
          await db.createNotification({
            userId: p.userId,
            type: 'deal_update',
            title: 'Deal Stage Updated',
            message: `Deal "${deal.title}" moved to ${input.stage}`,
            relatedEntityType: 'deal',
            relatedEntityId: input.id,
          });
        }
      }

      return { success: true };
    }),

  getEscrowStatus: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });
      const escrow = await db.getEscrowAccountByDeal(input.dealId);
      if (!escrow) {
        return { status: "not_configured" as const, provider: null, fundedAmount: 0, releasedAmount: 0 };
      }
      return {
        status: escrow.status,
        provider: "stripe",
        fundedAmount: Number(escrow.fundedAmount ?? 0),
        releasedAmount: Number(escrow.releasedAmount ?? 0),
        stripeAccountId: escrow.stripeAccountId,
      };
    }),

  completeMilestone: protectedProcedure
    .input(z.object({ dealId: z.number(), milestoneId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      const milestones = (deal.milestones as any[]) ?? [];
      const milestone = milestones.find((m: any) => m.id === input.milestoneId);
      if (!milestone) throw new TRPCError({ code: "NOT_FOUND", message: "Milestone not found" });

      milestone.status = "completed";
      milestone.completedAt = new Date().toISOString();

      await db.updateDeal(input.dealId, { milestones } as any);

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "milestone_completed",
        entityType: "deal",
        entityId: input.dealId,
        newState: { milestoneId: input.milestoneId, milestoneName: milestone.name },
      });

      if (milestone.payoutTrigger) {
        const participants = await db.getDealParticipants(input.dealId);
        const dealValue = Number(deal.dealValue ?? 0);
        if (dealValue > 0) {
          const triggerCount = milestones.filter((m: any) => m.payoutTrigger).length;
          for (const p of participants) {
            if (p.role === "originator" || p.role === "introducer") {
              const pct = Number(p.attributionPercentage ?? 0);
              if (pct <= 0) continue;
              const amount = (dealValue * pct) / 100 / triggerCount;
              await db.createPayout({
                dealId: input.dealId,
                userId: p.userId,
                amount: String(amount.toFixed(2)),
                currency: deal.currency ?? "USD",
                payoutType: "milestone_bonus",
                attributionPercentage: String(pct),
                relationshipId: p.relationshipId,
                status: "pending",
                milestoneId: input.milestoneId,
                milestoneName: milestone.name,
              });
            }
          }
        }
      }

      const allCompleted = milestones.every((m: any) => m.status === "completed");
      if (allCompleted) {
        await db.updateDeal(input.dealId, { stage: "completed" } as any);
      }

      return { success: true, allCompleted };
    }),

  addParticipant: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      userId: z.number(),
      role: z.enum(['originator', 'buyer', 'seller', 'introducer', 'advisor', 'legal', 'escrow', 'observer']),
      attributionPercentage: z.string().optional(),
      introducedBy: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.addDealParticipant(input);
      return { id };
    }),

  getParticipants: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      return db.getDealParticipants(input.dealId);
    }),
});
