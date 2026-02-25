import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const operatorIntakeRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        operatorName: z.string().min(1),
        companyName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        linkedIn: z.string().optional(),
        dealTitle: z.string().min(1),
        assetClass: z.string().optional(),
        geography: z.string().optional(),
        targetRaise: z.string().optional(),
        minimumInvestment: z.string().optional(),
        investmentThesis: z.string().optional(),
        trackRecord: z.string().optional(),
        skinInGame: z.string().optional(),
        timeline: z.string().optional(),
        accreditedOnly: z.boolean().optional(),
        manualReview: z.boolean().optional(),
        noAutomation: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createOperatorIntake(input);
      return { id, status: "pending" as const };
    }),

  list: protectedProcedure.query(async () => {
    return db.getOperatorIntakes();
  }),
});
