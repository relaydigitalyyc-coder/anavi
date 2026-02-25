import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const spvRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        legalName: z.string().optional(),
        description: z.string().optional(),
        entityType: z.string().optional(),
        jurisdiction: z.string().min(1),
        investmentPurpose: z.string().optional(),
        targetAssetClass: z.string().optional(),
        targetIndustry: z.string().optional(),
        targetRaise: z.string().optional(),
        minimumInvestment: z.string().optional(),
        maximumInvestment: z.string().optional(),
        currency: z.string().optional(),
        managementFee: z.string().optional(),
        carriedInterest: z.string().optional(),
        preferredReturn: z.string().optional(),
        fundingDeadline: z.string().optional(),
        investmentPeriodEnd: z.string().optional(),
        termEndDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await db.createSPV({
        ...input,
        sponsorId: ctx.user.id,
      });
      return { id, status: "formation" as const };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getSPVsBySponsor(ctx.user.id);
  }),

  listAll: protectedProcedure.query(async () => {
    return db.getAllSPVs();
  }),
});
