import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const brokerContactRouter = router({
  list: protectedProcedure
    .input(z.object({
      contactType: z.string().optional(),
      relationshipStrength: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return db.getBrokerContacts(ctx.user.id, input || {});
    }),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const contact = await db.getBrokerContactById(input.id);
      if (!contact || contact.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return contact;
    }),
  
  create: protectedProcedure
    .input(z.object({
      fullName: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      contactType: z.enum(['investor', 'family_office', 'fund_manager', 'broker', 'advisor', 'principal', 'operator', 'service_provider', 'other']).optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      linkedinUrl: z.string().optional(),
      instagramHandle: z.string().optional(),
      twitterHandle: z.string().optional(),
      telegramHandle: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createBrokerContact({
        ownerId: ctx.user.id,
        ...input,
      });
      
      if (input.linkedinUrl) {
        await db.createSocialProfile({
          entityType: 'contact',
          entityId: id,
          platform: 'linkedin',
          profileUrl: input.linkedinUrl,
        });
      }
      if (input.instagramHandle) {
        await db.createSocialProfile({
          entityType: 'contact',
          entityId: id,
          platform: 'instagram',
          profileUrl: `https://instagram.com/${input.instagramHandle}`,
          username: input.instagramHandle,
        });
      }
      
      return { id };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      fullName: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      linkedinUrl: z.string().optional(),
      relationshipStrength: z.enum(['cold', 'warm', 'hot', 'close', 'inner_circle']).optional(),
      notes: z.string().optional(),
      nextFollowUp: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contact = await db.getBrokerContactById(input.id);
      if (!contact || contact.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const { id, ...data } = input;
      await db.updateBrokerContact(id, data as any);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const contact = await db.getBrokerContactById(input.id);
      if (!contact || contact.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await db.deleteBrokerContact(input.id);
      return { success: true };
    }),
  
  // Get social profiles for contact
  getSocialProfiles: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const contact = await db.getBrokerContactById(input.id);
      if (!contact || contact.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return db.getSocialProfiles('contact', input.id);
    }),
  
  // Add social profile to contact
  addSocialProfile: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      platform: z.enum(['linkedin', 'instagram', 'twitter', 'facebook', 'youtube', 'tiktok', 'crunchbase', 'pitchbook', 'angellist', 'other']),
      profileUrl: z.string(),
      username: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const contact = await db.getBrokerContactById(input.contactId);
      if (!contact || contact.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      const id = await db.createSocialProfile({
        entityType: 'contact',
        entityId: input.contactId,
        platform: input.platform,
        profileUrl: input.profileUrl,
        username: input.username,
      });
      return { id };
    }),
});
