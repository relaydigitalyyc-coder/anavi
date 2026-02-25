import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const contactRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getContactHandles(ctx.user.id);
  }),

  add: protectedProcedure
    .input(z.object({
      platform: z.enum([
        "email",
        "phone",
        "telegram",
        "discord",
        "whatsapp",
        "slack",
        "linkedin",
        "twitter",
        "signal",
        "wechat",
        "other",
      ]),
      handle: z.string(),
      displayName: z.string().optional(),
      isPrimary: z.boolean().optional(),
      groupChatLink: z.string().optional(),
      groupChatName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.addContactHandle({
        userId: ctx.user.id,
        ...input,
      });
      return { id };
    }),

  getByRelationship: protectedProcedure
    .input(z.object({ relationshipId: z.number() }))
    .query(async ({ input }) => {
      return db.getContactHandles(undefined, input.relationshipId);
    }),
});
