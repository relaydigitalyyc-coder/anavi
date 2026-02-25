import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const intelligenceRouter = router({
  sectorOverview: protectedProcedure.query(async () => {
    return db.getIntelligenceSectorOverview();
  }),
  marketDepth: protectedProcedure.query(async () => {
    return db.getIntelligenceMarketDepth();
  }),
});
