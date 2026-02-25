import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const tradingRouter = router({
  positions: protectedProcedure.query(async ({ ctx }) => {
    return db.getTradingPositions(ctx.user.id);
  }),
});
