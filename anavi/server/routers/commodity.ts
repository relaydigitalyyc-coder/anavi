import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const commodityRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getCommodityListings();
  }),

  create: protectedProcedure
    .input(
      z.object({
        commodityType: z.enum([
          "gold", "silver", "platinum", "palladium", "copper", "iron_ore",
          "crude_oil", "natural_gas", "lng", "refined_products",
          "wheat", "corn", "soybeans", "coffee", "sugar",
          "other_mineral", "other_commodity",
        ]),
        title: z.string().min(1),
        quantity: z.string(),
        unit: z.enum([
          "metric_tonnes", "troy_ounces", "kilograms", "grams",
          "barrels", "gallons", "cubic_meters", "mmbtu",
          "bushels", "pounds", "bags",
        ]),
        pricePerUnit: z.string().optional(),
        originCountry: z.string().optional(),
        currentLocation: z.string().optional(),
        deliveryLocation: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await db.createCommodityListing({
        ...input,
        sellerId: ctx.user.id,
      });
      return { id };
    }),
});
