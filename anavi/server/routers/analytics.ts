import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { eq } from "drizzle-orm";
import { capitalCallResponses, capitalCalls } from "../../drizzle/schema";

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const computeDeltaLabel = (current: number, previous: number, suffix = "") => {
  if (previous <= 0) {
    if (current > 0) return `New${suffix ? ` ${suffix}` : ""}`;
    return "Flat";
  }
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%${suffix ? ` ${suffix}` : ""}`;
};

export const analyticsRouter = router({
  // Get deal analytics
  dealAnalytics: protectedProcedure
    .input(z.object({
      periodType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(12),
    }))
    .query(async ({ ctx, input }) => {
      return db.getDealAnalytics(ctx.user.id, {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      });
    }),

  // Calculate real-time analytics
  calculate: protectedProcedure.query(async ({ ctx }) => {
    return db.calculateDealAnalytics(ctx.user.id);
  }),

  // Get conversion funnels
  funnels: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getConversionFunnels(
        ctx.user.id,
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),

  // Get dashboard summary
  dashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const analytics = await db.calculateDealAnalytics(ctx.user.id);
    const reminders = await db.getFollowUpReminders(ctx.user.id, { status: 'pending', limit: 5 });
    const upcomingEvents = await db.getCalendarEvents(ctx.user.id, {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      limit: 5,
    });
    
    return {
      analytics,
      pendingReminders: reminders,
      upcomingEvents,
    };
  }),

  liveProof: protectedProcedure
    .input(
      z
        .object({
          asOf: z.string().datetime().optional(),
          lookbackHours: z.number().min(1).max(168).default(24),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const asOf = input?.asOf ? new Date(input.asOf) : new Date();
      const lookbackHours = input?.lookbackHours ?? 24;
      const windowMs = lookbackHours * 60 * 60 * 1000;
      const currentStart = new Date(asOf.getTime() - windowMs);
      const previousStart = new Date(asOf.getTime() - windowMs * 2);

      const [payouts, conn] = await Promise.all([
        db.getPayoutsByUser(ctx.user.id),
        db.getDb(),
      ]);

      const getEventTime = (payout: (typeof payouts)[number]) =>
        payout.paidAt ?? payout.updatedAt ?? payout.createdAt;

      const completedPayouts = payouts.filter(
        (payout) =>
          payout.status === "completed" || payout.status === "processing"
      );
      const currentPayoutValue = completedPayouts
        .filter((payout) => {
          const ts = getEventTime(payout).getTime();
          return ts >= currentStart.getTime() && ts <= asOf.getTime();
        })
        .reduce((sum, payout) => sum + toNumber(payout.amount), 0);
      const previousPayoutValue = completedPayouts
        .filter((payout) => {
          const ts = getEventTime(payout).getTime();
          return ts >= previousStart.getTime() && ts < currentStart.getTime();
        })
        .reduce((sum, payout) => sum + toNumber(payout.amount), 0);

      const attributedPayoutCount = payouts.filter(
        (payout) => payout.relationshipId != null
      ).length;
      const attributionCoverage =
        payouts.length > 0
          ? Math.round((attributedPayoutCount / payouts.length) * 100)
          : 0;

      const capitalCallRows =
        conn != null
          ? await conn
              .select({
                responseId: capitalCallResponses.id,
                status: capitalCallResponses.status,
                amountPaid: capitalCallResponses.amountPaid,
                paidAt: capitalCallResponses.paidAt,
                updatedAt: capitalCallResponses.updatedAt,
              })
              .from(capitalCallResponses)
              .innerJoin(
                capitalCalls,
                eq(capitalCallResponses.capitalCallId, capitalCalls.id)
              )
              .where(eq(capitalCalls.createdBy, ctx.user.id))
          : [];

      const settledCurrent = capitalCallRows.filter((row) => {
        if (row.status !== "paid") return false;
        const ts = (row.paidAt ?? row.updatedAt)?.getTime?.() ?? 0;
        return ts >= currentStart.getTime() && ts <= asOf.getTime();
      });
      const settledPrevious = capitalCallRows.filter((row) => {
        if (row.status !== "paid") return false;
        const ts = (row.paidAt ?? row.updatedAt)?.getTime?.() ?? 0;
        return ts >= previousStart.getTime() && ts < currentStart.getTime();
      });

      const freshnessTs = Math.max(
        0,
        ...payouts.map((payout) => getEventTime(payout).getTime()),
        ...capitalCallRows.map(
          (row) => (row.paidAt ?? row.updatedAt)?.getTime?.() ?? 0
        )
      );

      return {
        performanceUplift24h: {
          value: `${currentPayoutValue >= 0 ? "+" : ""}${(
            (currentPayoutValue / 1_000_000) *
            100
          ).toFixed(1)} bps blended`,
          deltaLabel: computeDeltaLabel(
            currentPayoutValue,
            previousPayoutValue,
            "vs prior window"
          ),
        },
        capitalCallsSettled: {
          count: settledCurrent.length,
          deltaLabel: computeDeltaLabel(
            settledCurrent.length,
            settledPrevious.length,
            "vs prior window"
          ),
        },
        attributionCoverage: {
          percent: attributionCoverage,
          traceability: `${attributedPayoutCount}/${payouts.length} payouts linked`,
        },
        freshness:
          freshnessTs > 0 ? new Date(freshnessTs).toISOString() : null,
        generatedAt: asOf.toISOString(),
      };
    }),
});
