import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const familyOfficeRouter = router({
  list: publicProcedure
    .input(z.object({
      type: z.string().optional(),
      aumRange: z.string().optional(),
      region: z.string().optional(),
      state: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getFamilyOffices(input || {});
    }),
  
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const fo = await db.getFamilyOfficeById(input.id);
      if (!fo) throw new TRPCError({ code: 'NOT_FOUND' });
      return fo;
    }),
  
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const fo = await db.getFamilyOfficeBySlug(input.slug);
      if (!fo) throw new TRPCError({ code: 'NOT_FOUND' });
      return fo;
    }),
  
  stats: publicProcedure.query(async () => {
    return db.getFamilyOfficeStats();
  }),
  
  search: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return db.searchFamilyOffices(input.query, input.limit);
    }),
  
  // Import contact from family office to broker contacts
  importContact: protectedProcedure
    .input(z.object({
      familyOfficeId: z.number(),
      name: z.string(),
      title: z.string().optional(),
      email: z.string().optional(),
      linkedin: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contactId = await db.importFamilyOfficeContact(
        ctx.user.id,
        input.familyOfficeId,
        {
          name: input.name,
          title: input.title,
          email: input.email,
          linkedin: input.linkedin,
          phone: input.phone,
        }
      );
      
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'contact_imported',
        entityType: 'broker_contact',
        entityId: contactId,
        newState: input,
      });
      
      return { id: contactId };
    }),
  
  // Add to targets
  addToTargets: protectedProcedure
    .input(z.object({
      familyOfficeId: z.number(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const targetId = await db.createTarget({
        userId: ctx.user.id,
        familyOfficeId: input.familyOfficeId,
        priority: input.priority || 'medium',
        notes: input.notes,
      });
      
      return { id: targetId };
    }),
  
  // Get social profiles
  getSocialProfiles: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getSocialProfiles('family_office', input.id);
    }),
  
  // Add social profile
  addSocialProfile: protectedProcedure
    .input(z.object({
      familyOfficeId: z.number(),
      platform: z.enum(['linkedin', 'instagram', 'twitter', 'facebook', 'youtube', 'tiktok', 'crunchbase', 'pitchbook', 'angellist', 'other']),
      profileUrl: z.string(),
      username: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createSocialProfile({
        entityType: 'family_office',
        entityId: input.familyOfficeId,
        platform: input.platform,
        profileUrl: input.profileUrl,
        username: input.username,
      });
      return { id };
    }),
  
  // Get news for family office
  getNews: publicProcedure
    .input(z.object({ id: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return db.getNewsItems('family_office', input.id, input.limit);
    }),
});
