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
});
