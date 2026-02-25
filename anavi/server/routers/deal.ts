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
    }))
    .mutation(async ({ ctx, input }) => {
      const dealId = await db.createDeal({
        ...input,
        originatorId: ctx.user.id,
        milestones: [
          { id: '1', name: 'Initial Contact', status: 'completed', completedAt: new Date().toISOString() },
          { id: '2', name: 'NDA Signed', status: 'pending', payoutTrigger: false },
          { id: '3', name: 'Due Diligence', status: 'pending', payoutTrigger: false },
          { id: '4', name: 'Term Sheet', status: 'pending', payoutTrigger: true },
          { id: '5', name: 'Documentation', status: 'pending', payoutTrigger: false },
          { id: '6', name: 'Closing', status: 'pending', payoutTrigger: true },
        ],
      });

      await db.addDealParticipant({
        dealId,
        userId: ctx.user.id,
        role: 'originator',
        attributionPercentage: '50.00',
      });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'deal_created',
        entityType: 'deal',
        entityId: dealId,
        newState: input,
      });

      return { id: dealId };
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
            await db.recalculateTrustScore(p.userId, 'deal_completion', input.id, 'deal');
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
      return { status: "not_configured", provider: null, fundedAmount: 0 };
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
