import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const matchRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getMatchesByUser(ctx.user.id);
  }),

  expressInterest: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const matches = await db.getMatchesByUser(ctx.user.id);
      const match = matches.find(m => m.id === input.matchId);
      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const isUser1 = match.user1Id === ctx.user.id;
      const updateData = isUser1
        ? { user1Consent: true, user1ConsentAt: new Date() }
        : { user2Consent: true, user2ConsentAt: new Date() };

      const otherConsent = isUser1 ? match.user2Consent : match.user1Consent;
      if (otherConsent) {
        Object.assign(updateData, { status: 'mutual_interest' as const });
      } else {
        Object.assign(updateData, { status: isUser1 ? 'user1_interested' as const : 'user2_interested' as const });
      }

      await db.updateMatch(input.matchId, updateData);

      const otherUserId = isUser1 ? match.user2Id : match.user1Id;
      await db.createNotification({
        userId: otherUserId,
        type: 'match_found',
        title: 'New Match Interest',
        message: 'Someone has expressed interest in your intent match.',
        relatedEntityType: 'match',
        relatedEntityId: input.matchId,
      });

      return { success: true, mutualInterest: otherConsent };
    }),

  decline: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const matches = await db.getMatchesByUser(ctx.user.id);
      const match = matches.find(m => m.id === input.matchId);
      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      await db.updateMatch(input.matchId, { status: 'declined' as const });
      return { success: true };
    }),

  createDealRoom: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const matches = await db.getMatchesByUser(ctx.user.id);
      const match = matches.find(m => m.id === input.matchId);
      if (!match || match.status !== 'mutual_interest') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Mutual interest required' });
      }

      const dealRoomId = await db.createDealRoom({
        matchId: input.matchId,
        name: `Deal Room - Match #${input.matchId}`,
        createdBy: ctx.user.id,
        settings: {
          allowDownloads: false,
          watermarkDocuments: true,
          requireNda: true,
          autoExpireAccess: true,
          expiryDays: 30,
        },
      });

      await db.grantDealRoomAccess({ dealRoomId, userId: match.user1Id, accessLevel: 'edit' });
      await db.grantDealRoomAccess({ dealRoomId, userId: match.user2Id, accessLevel: 'edit' });
      await db.updateMatch(input.matchId, { dealRoomId, status: 'deal_room_created' });

      return { dealRoomId };
    }),
});
