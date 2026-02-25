import { adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const adminRouter = router({
  flagUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      flagType: z.enum(["whitelist", "blacklist", "watchlist"]),
      reason: z.string().min(1),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createUserFlag({
        userId: input.userId,
        flagType: input.flagType,
        reason: input.reason,
        flaggedBy: ctx.user.id,
        expiresAt: input.expiresAt ?? null,
      });
      return { id };
    }),

  listFlags: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      return db.listUserFlags(input.page, input.limit);
    }),

  removeFlag: adminProcedure
    .input(z.object({ flagId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteUserFlag(input.flagId);
      return { success: true };
    }),
});
