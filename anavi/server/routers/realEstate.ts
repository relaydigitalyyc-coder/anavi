import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const realEstateRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), propertyType: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return db.listRealEstateProperties({
        ...input,
        ownerId: ctx.user.id,
      });
    }),
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const p = await db.getRealEstatePropertyById(input.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      return p;
    }),
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      address: z.string(),
      propertyType: z.enum(["office", "retail", "industrial", "multifamily", "hotel", "mixed_use", "land", "single_family", "condo", "warehouse", "data_center", "self_storage", "medical", "senior_living"]),
      askingPrice: z.string().optional(),
      totalSqFt: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createRealEstateProperty({
        ownerId: ctx.user.id,
        title: input.title,
        address: input.address,
        propertyType: input.propertyType,
        askingPrice: input.askingPrice ?? null,
        totalSqFt: input.totalSqFt ?? null,
        status: (input.status as any) ?? "draft",
      });
    }),
});
