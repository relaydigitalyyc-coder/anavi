import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const intelligenceRouter = router({
  sectorOverview: protectedProcedure.query(async () => {
    return db.getIntelligenceSectorOverview();
  }),
  marketDepth: protectedProcedure.query(async () => {
    return db.getIntelligenceMarketDepth();
  }),
  dealIntelligence: protectedProcedure.query(async ({ ctx }) => {
    const deals = await db.getDealsByUser(ctx.user.id);
    return {
      totalDeals: deals.length,
      deals: deals.slice(0, 20).map((d) => ({
        id: d.id,
        title: d.title,
        stage: d.stage,
        value: d.dealValue,
        currency: d.currency,
      })),
    };
  }),
});
