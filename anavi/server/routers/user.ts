import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserById(ctx.user.id);
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      bio: z.string().optional(),
      website: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "profile_updated",
        entityType: "user",
        entityId: ctx.user.id,
        newState: input,
      });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    return db.getDashboardStats(ctx.user.id);
  }),

  getTrustScoreHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(async ({ ctx, input }) => {
      return db.getTrustScoreHistory(ctx.user.id, input.limit ?? 20);
    }),

  getVerificationDocuments: protectedProcedure.query(async ({ ctx }) => {
    return db.getVerificationDocuments(ctx.user.id);
  }),

  getPeerReviews: protectedProcedure.query(async ({ ctx }) => {
    return db.getPeerReviews(ctx.user.id);
  }),

  getTrustScore: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) return null;

    const [reviews, checks, history] = await Promise.all([
      db.getPeerReviews(ctx.user.id),
      db.getComplianceChecks("user", ctx.user.id),
      db.getTrustScoreHistory(ctx.user.id, 1),
    ]);

    const TIER_SCORES: Record<string, number> = {
      none: 0, basic: 33.33, enhanced: 66.66, institutional: 100,
    };

    const totalDeals = user.totalDeals ?? 0;
    const tierRaw = TIER_SCORES[user.verificationTier ?? "none"] ?? 0;
    const dealRaw = Math.min(totalDeals / 20, 1) * 100;

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((s: number, r: { rating?: number }) => s + (r.rating ?? 1), 0) / reviews.length
        : 1;
    const reviewRaw = reviews.length > 0 ? ((avgRating - 1) / 4) * 100 : 0;

    const passedChecks = checks.filter((c) => c.status === "passed").length;
    const complianceRaw = checks.length > 0 ? (passedChecks / checks.length) * 100 : 0;

    const monthsOld =
      (Date.now() - (user.createdAt?.getTime() ?? Date.now())) /
      (1000 * 60 * 60 * 24 * 30.44);
    const tenureRaw = Math.min(monthsOld / 24, 1) * 100;

    return {
      total: Number(user.trustScore ?? 0),
      badge: user.verificationBadge,
      tier: user.verificationTier,
      components: {
        verification: Math.round(tierRaw * 0.3),
        deals: Math.round(dealRaw * 0.25),
        peerReviews: Math.round(reviewRaw * 0.2),
        compliance: Math.round(complianceRaw * 0.15),
        tenure: Math.round(tenureRaw * 0.1),
      },
      lastUpdated: history[0]?.createdAt ?? null,
    };
  }),
});
