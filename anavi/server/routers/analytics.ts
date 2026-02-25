import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

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
});
