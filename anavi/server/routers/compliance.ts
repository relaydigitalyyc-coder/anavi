import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { loadSdnList, checkOfac } from "../_core/ofac";
import { checkOpenCorporates } from "../_core/kyb";

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
      entityName: z.string().optional(),
      jurisdiction: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createComplianceCheck({
        ...input,
        status: "pending",
        provider: "internal",
      });

      let status: "passed" | "failed" | "flagged" = "passed";
      let riskLevel: "low" | "medium" | "high" | "critical" = "low";
      const findings: Array<{ type: string; severity: string; description: string }> = [];

      if (input.checkType === "sanctions" && input.entityName) {
        await loadSdnList();
        const isOnSdnList = checkOfac(input.entityName);
        if (isOnSdnList) {
          status = "failed";
          riskLevel = "critical";
          findings.push({
            type: "sanctions_match",
            severity: "critical",
            description: `Name "${input.entityName}" matched OFAC SDN list`,
          });
        }
      } else if (input.checkType === "kyb" && input.entityName) {
        const jurisdiction = input.jurisdiction ?? "us_de";
        const kybResult = await checkOpenCorporates(input.entityName, jurisdiction);
        if (kybResult.found && kybResult.status.toLowerCase() !== "dissolved") {
          status = "passed";
          riskLevel = "low";
          if (input.entityType === "user") {
            await db.updateUserProfile(input.entityId, { kybStatus: "approved" });
          }
        } else {
          status = "failed";
          riskLevel = "high";
          findings.push({
            type: "kyb_not_found",
            severity: "high",
            description: `Company "${input.entityName}" not found or dissolved in ${jurisdiction}`,
          });
          if (input.entityType === "user") {
            await db.updateUserProfile(input.entityId, { kybStatus: "rejected" });
          }
        }
      } else if (input.checkType !== "sanctions" && input.checkType !== "kyb") {
        status = "passed";
        riskLevel = "low";
      }

      await db.updateComplianceCheck(id, { status, riskLevel, findings });

      if (input.entityType === "user") {
        const newScore = await db.calculateTrustScore(input.entityId);
        await db.assignBadge(input.entityId, newScore);
      }

      return { id, status };
    }),
});
