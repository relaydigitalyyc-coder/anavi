import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const searchRouter = router({
  global: protectedProcedure
    .input(z.object({ query: z.string(), limit: z.number().min(1).max(50).optional() }))
    .query(async ({ ctx, input }) => {
      return db.globalSearch(ctx.user.id, input.query, input.limit ?? 20);
    }),
});
