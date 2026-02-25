import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const lpPortalRouter = router({
  getData: protectedProcedure.query(async ({ ctx }) => {
    return db.getLPPortalData(ctx.user.id);
  }),
});
