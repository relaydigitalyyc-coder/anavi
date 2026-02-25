import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { deals, dealParticipants } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  calculatePayoutSplits,
  type FollowOnAttribution,
} from "../_core/payoutCalc";

export const payoutRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getPayoutsByUser(ctx.user.id);
  }),

  getStatement: protectedProcedure
    .input(
      z.object({
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const payouts = await db.getPayoutsByUser(ctx.user.id);
      const start = new Date(input.periodStart);
      const end = new Date(input.periodEnd);
      const items = payouts.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= start && d <= end;
      });
      const total = items.reduce((s, p) => s + Number(p.amount ?? 0), 0);
      return {
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        items,
        total,
      };
    }),

  getByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      return db.getPayoutsByDeal(input.dealId);
    }),

  /** Preview payout splits for a deal without writing to DB. */
  calculate: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      const conn = await db.getDb();
      if (!conn)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const deal = await conn
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);
      if (deal.length === 0)
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });

      const d = deal[0];
      const dealValue = Number(d.dealValue ?? 0);

      const participants = await conn
        .select()
        .from(dealParticipants)
        .where(eq(dealParticipants.dealId, input.dealId));

      const followOns: FollowOnAttribution[] = [];
      if (d.isFollowOn && d.originalDealId) {
        const origParticipants = await conn
          .select()
          .from(dealParticipants)
          .where(
            and(
              eq(dealParticipants.dealId, d.originalDealId),
              eq(dealParticipants.role, "originator"),
            ),
          );
        for (const op of origParticipants) {
          if (op.relationshipId) {
            followOns.push({
              userId: op.userId,
              relationshipId: op.relationshipId,
              attributionPercentage: 10,
            });
          }
        }
      }

      const feeRate = 0.02;
      const splits = calculatePayoutSplits(
        dealValue,
        feeRate,
        participants,
        followOns,
      );

      return {
        dealId: input.dealId,
        dealValue,
        totalFees: dealValue * feeRate,
        splits,
      };
    }),

  /** Admin: approve a pending payout. */
  approve: adminProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ input }) => {
      const payout = await db.getPayoutById(input.payoutId);
      if (!payout)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payout not found",
        });
      if (payout.status !== "pending")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot approve payout in '${payout.status}' status`,
        });

      await db.updatePayout(input.payoutId, { status: "approved" });
      return { payoutId: input.payoutId, status: "approved" as const };
    }),

  /** Admin: execute an approved payout. Attempts Stripe transfer; falls back to mock completion. */
  execute: adminProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ input }) => {
      const payout = await db.getPayoutById(input.payoutId);
      if (!payout)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payout not found",
        });
      if (payout.status !== "approved")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot execute payout in '${payout.status}' status`,
        });

      // Stripe integration placeholder — in production this calls stripe.transfers.create
      const stripeEnabled = false;
      if (stripeEnabled) {
        await db.updatePayout(input.payoutId, { status: "processing" });
        return {
          payoutId: input.payoutId,
          status: "processing" as const,
        };
      }

      await db.updatePayout(input.payoutId, {
        status: "completed",
        paidAt: new Date(),
      });
      return { payoutId: input.payoutId, status: "completed" as const };
    }),
});
