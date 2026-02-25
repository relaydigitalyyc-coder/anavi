import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const enrichmentRouter = router({
  // Request enrichment for an entity
  request: protectedProcedure
    .input(z.object({
      entityType: z.enum(['family_office', 'broker_contact', 'relationship']),
      entityId: z.number(),
      source: z.string().default('auto'),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createEnrichmentJob({
        ...input,
        userId: ctx.user.id,
      });
      return { success: true, jobId: result };
    }),

  // Get enrichment jobs
  list: protectedProcedure
    .input(z.object({
      entityType: z.enum(['family_office', 'broker_contact', 'relationship']).optional(),
      status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return db.getEnrichmentJobs({
        ...input,
        userId: ctx.user.id,
      });
    }),
});
