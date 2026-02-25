import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const notificationRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          unreadOnly: z.boolean().optional(),
          limit: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const notifications = await db.getNotificationsByUser(
        ctx.user.id,
        input?.unreadOnly
      );
      if (input?.limit) {
        return notifications.slice(0, input.limit);
      }
      return notifications;
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationRead(input.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const notifications = await db.getNotificationsByUser(ctx.user.id, true);
    for (const n of notifications) {
      await db.markNotificationRead(n.id);
    }
    return { success: true };
  }),
});
