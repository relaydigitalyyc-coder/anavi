import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const payoutRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getPayoutsByUser(ctx.user.id);
  }),

  getStatement: protectedProcedure
    .input(z.object({
      periodStart: z.string().datetime(),
      periodEnd: z.string().datetime(),
    }))
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
});
