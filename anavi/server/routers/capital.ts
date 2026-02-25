import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const capitalRouter = router({
  spvs: protectedProcedure.query(async () => {
    return db.getSPVsWithSummary();
  }),

  capitalCalls: protectedProcedure.query(async () => {
    return db.getCapitalCallsWithSPV();
  }),

  commitments: protectedProcedure.query(async () => {
    return db.getCommitmentsWithDetails();
  }),

  createCapitalCall: protectedProcedure
    .input(
      z.object({
        spvId: z.number(),
        callNumber: z.number(),
        callAmount: z.number(),
        callPercentage: z.number().optional(),
        purpose: z.string().optional(),
        dueDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db/connection");
      const { capitalCalls } = await import("../../drizzle/schema");
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const result = await database.insert(capitalCalls).values({
        spvId: input.spvId,
        callNumber: input.callNumber,
        callAmount: String(input.callAmount),
        callPercentage: input.callPercentage ? String(input.callPercentage) : null,
        purpose: input.purpose ?? null,
        dueDate: new Date(input.dueDate),
        status: "sent",
        totalCalled: String(input.callAmount),
        totalReceived: "0",
        createdBy: ctx.user.id,
      });
      return { id: result[0].insertId };
    }),
});
