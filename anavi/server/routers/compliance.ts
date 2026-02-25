import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const complianceRouter = router({
  getChecks: protectedProcedure
    .input(z.object({
      entityType: z.enum(["user", "deal", "relationship"]),
      entityId: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getComplianceChecks(input.entityType, input.entityId);
    }),

  runCheck: protectedProcedure
    .input(z.object({
      entityType: z.enum(["user", "deal", "relationship"]),
      entityId: z.number(),
      checkType: z.enum([
        "sanctions",
        "pep",
        "adverse_media",
        "aml",
        "kyc",
        "kyb",
        "jurisdiction",
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createComplianceCheck({
        ...input,
        status: "pending",
        provider: "internal",
      });

      setTimeout(async () => {
        await db.updateComplianceCheck(id, {
          status: "passed",
          riskLevel: "low",
          findings: [],
        });
      }, 2000);

      return { id, status: "pending" };
    }),
});
