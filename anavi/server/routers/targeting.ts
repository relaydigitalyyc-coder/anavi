import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const targetingRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return db.getTargetsByUser(ctx.user.id, input || {});
    }),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const target = await db.getTargetById(input.id);
      if (!target || target.target.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return target;
    }),
  
  create: protectedProcedure
    .input(z.object({
      familyOfficeId: z.number(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      notes: z.string().optional(),
      primaryContactName: z.string().optional(),
      primaryContactTitle: z.string().optional(),
      primaryContactEmail: z.string().optional(),
      primaryContactLinkedIn: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createTarget({
        userId: ctx.user.id,
        ...input,
      });
      return { id };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum([
        'identified', 'researching', 'outreach_planned', 'contacted',
        'in_conversation', 'meeting_scheduled', 'proposal_sent',
        'negotiating', 'converted', 'declined', 'on_hold'
      ]).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      notes: z.string().optional(),
      nextFollowUpDate: z.date().optional(),
      primaryContactName: z.string().optional(),
      primaryContactTitle: z.string().optional(),
      primaryContactEmail: z.string().optional(),
      primaryContactLinkedIn: z.string().optional(),
      primaryContactPhone: z.string().optional(),
      estimatedDealSize: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const target = await db.getTargetById(input.id);
      if (!target || target.target.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const { id, ...data } = input;
      await db.updateTarget(id, data as any);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const target = await db.getTargetById(input.id);
      if (!target || target.target.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await db.deleteTarget(input.id);
      return { success: true };
    }),
  
  stats: protectedProcedure.query(async ({ ctx }) => {
    return db.getTargetStats(ctx.user.id);
  }),
  
  // Activity tracking
  addActivity: protectedProcedure
    .input(z.object({
      targetId: z.number(),
      activityType: z.enum([
        'email_sent', 'email_received', 'call_made', 'call_received',
        'linkedin_connection', 'linkedin_message', 'meeting', 'video_call',
        'introduction_made', 'introduction_received', 'document_shared',
        'proposal_sent', 'follow_up', 'note_added', 'status_change'
      ]),
      subject: z.string().optional(),
      description: z.string().optional(),
      outcome: z.string().optional(),
      contactPerson: z.string().optional(),
      requiresFollowUp: z.boolean().optional(),
      followUpDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const target = await db.getTargetById(input.targetId);
      if (!target || target.target.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const id = await db.createTargetActivity({
        ...input,
        userId: ctx.user.id,
      });
      return { id };
    }),
  
  getActivities: protectedProcedure
    .input(z.object({ targetId: z.number(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const target = await db.getTargetById(input.targetId);
      if (!target || target.target.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return db.getTargetActivities(input.targetId, input.limit);
    }),
});
