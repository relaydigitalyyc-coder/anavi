import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { stripe } from "../_core/stripe";

export const escrowRouter = router({
  create: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      const existing = await db.getEscrowAccountByDeal(input.dealId);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Escrow already configured" });

      const account = await stripe.accounts.create({
        type: "express",
        metadata: { dealId: String(input.dealId) },
      });

      const id = await db.createEscrowAccount({
        dealId: input.dealId,
        stripeAccountId: account.id,
        status: "unfunded",
      });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "escrow_created",
        entityType: "deal",
        entityId: input.dealId,
        newState: { escrowId: id, stripeAccountId: account.id },
      });

      return { id, stripeAccountId: account.id };
    }),

  fund: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      amount: z.number().positive(),
      currency: z.string().default("usd"),
    }))
    .mutation(async ({ ctx, input }) => {
      const escrow = await db.getEscrowAccountByDeal(input.dealId);
      if (!escrow) throw new TRPCError({ code: "NOT_FOUND", message: "Escrow not configured" });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(input.amount * 100),
        currency: input.currency,
        capture_method: "manual",
        metadata: {
          dealId: String(input.dealId),
          escrowId: String(escrow.id),
        },
      });

      await db.updateEscrowAccount(escrow.id, {
        stripePaymentIntentId: paymentIntent.id,
        fundedAmount: String(input.amount),
        status: "funded",
      });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "escrow_funded",
        entityType: "deal",
        entityId: input.dealId,
        newState: { amount: input.amount, paymentIntentId: paymentIntent.id },
      });

      return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
    }),

  releaseMilestone: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      amount: z.number().positive(),
      milestoneId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const escrow = await db.getEscrowAccountByDeal(input.dealId);
      if (!escrow) throw new TRPCError({ code: "NOT_FOUND", message: "Escrow not configured" });

      const funded = Number(escrow.fundedAmount ?? 0);
      const released = Number(escrow.releasedAmount ?? 0);
      const available = funded - released;

      if (input.amount > available) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient escrow funds" });
      }

      const newReleased = released + input.amount;
      const newStatus = newReleased >= funded ? "released" : "partially_released";

      await db.updateEscrowAccount(escrow.id, {
        releasedAmount: String(newReleased.toFixed(2)),
        status: newStatus,
      });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "escrow_milestone_released",
        entityType: "deal",
        entityId: input.dealId,
        newState: { milestoneId: input.milestoneId, amount: input.amount, newReleased },
      });

      return { success: true, releasedAmount: newReleased, status: newStatus };
    }),

  getStatus: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      const escrow = await db.getEscrowAccountByDeal(input.dealId);
      if (!escrow) {
        return { status: "not_configured" as const, provider: null, fundedAmount: 0, releasedAmount: 0 };
      }
      return {
        status: escrow.status,
        provider: "stripe" as const,
        fundedAmount: Number(escrow.fundedAmount ?? 0),
        releasedAmount: Number(escrow.releasedAmount ?? 0),
        stripeAccountId: escrow.stripeAccountId,
      };
    }),

  refund: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const escrow = await db.getEscrowAccountByDeal(input.dealId);
      if (!escrow) throw new TRPCError({ code: "NOT_FOUND", message: "Escrow not configured" });

      if (!escrow.stripePaymentIntentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No payment to refund" });
      }

      const funded = Number(escrow.fundedAmount ?? 0);
      const released = Number(escrow.releasedAmount ?? 0);
      const refundable = funded - released;

      if (refundable <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No funds available to refund" });
      }

      await stripe.refunds.create({
        payment_intent: escrow.stripePaymentIntentId,
        amount: Math.round(refundable * 100),
      });

      await db.updateEscrowAccount(escrow.id, { status: "refunded" });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "escrow_refunded",
        entityType: "deal",
        entityId: input.dealId,
        newState: { refundedAmount: refundable },
      });

      return { success: true, refundedAmount: refundable };
    }),
});
