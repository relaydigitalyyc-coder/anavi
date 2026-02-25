import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const filtersSchema = z.object({
  userId: z.number().optional(),
  entityType: z.string().optional(),
  entityId: z.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(500).optional(),
  cursor: z.object({ createdAt: z.string().datetime(), id: z.number() }).optional(),
});

export const auditRouter = router({
  list: protectedProcedure
    .input(z.object({
      entityType: z.string().optional(),
      entityId: z.number().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getAuditLog(input?.entityType, input?.entityId, input?.limit);
    }),
  query: protectedProcedure
    .input(filtersSchema)
    .query(async ({ ctx, input }) => {
      const filters = {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        cursor: input.cursor ? { createdAt: new Date(input.cursor.createdAt), id: input.cursor.id } : undefined,
      };
      const isAdmin = ctx.user.role === "admin";
      return db.queryAuditLog(filters, ctx.user.id, isAdmin);
    }),
  export: adminProcedure
    .input(filtersSchema.omit({ cursor: true }))
    .mutation(async ({ ctx, input }) => {
      const filters = {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      };
      return db.exportAuditLogCSV(filters, ctx.user.id, true);
    }),
});
