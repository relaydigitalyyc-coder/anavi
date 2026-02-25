import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const feesRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getFeeCollections();
  }),
});
