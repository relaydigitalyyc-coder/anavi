import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const relationshipRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getRelationshipsByOwner(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const rel = await db.getRelationshipById(input.id);
      if (!rel || rel.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return rel;
    }),

  getProof: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const rel = await db.getRelationshipById(input.id);
      if (!rel || rel.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return {
        relationshipId: rel.id,
        timestampHash: rel.timestampHash,
        establishedAt: rel.establishedAt,
      };
    }),

  create: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      relationshipType: z
        .enum(["direct", "introduction", "referral", "network", "professional", "personal"])
        .optional(),
      introducedBy: z.number().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createRelationship({
        ownerId: ctx.user.id,
        ...input,
      });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "relationship_created",
        entityType: "relationship",
        entityId: result.id,
        newState: { ...input, timestampHash: result.timestampHash },
      });

      return result;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      strength: z.enum(["weak", "moderate", "strong", "very_strong"]).optional(),
      exposureLevel: z.enum(["hidden", "partial", "full"]).optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const rel = await db.getRelationshipById(input.id);
      if (!rel || rel.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { id, ...data } = input;
      await db.updateRelationship(id, data);

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "relationship_updated",
        entityType: "relationship",
        entityId: id,
        previousState: rel,
        newState: data,
      });

      return { success: true };
    }),

  getNetwork: protectedProcedure.query(async ({ ctx }) => {
    return db.getRelationshipNetwork(ctx.user.id);
  }),

  grantConsent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const rel = await db.getRelationshipById(input.id);
      if (!rel || rel.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db.updateRelationship(input.id, {
        consentGiven: true,
        consentGivenAt: new Date(),
        exposureLevel: "full",
        isBlind: false,
      });

      return { success: true };
    }),
});
