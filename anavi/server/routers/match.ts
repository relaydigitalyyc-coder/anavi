import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { generateNdaPdf } from "../_core/ndaPdf";
import { storagePut } from "../storage";

export const matchRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.getMatchesWithCounterpartyByUser(ctx.user.id);
    return rows.map((m) => {
      const base = {
        id: m.id,
        intent1Id: m.intent1Id,
        intent2Id: m.intent2Id,
        user1Id: m.user1Id,
        user2Id: m.user2Id,
        compatibilityScore: m.compatibilityScore,
        matchReason: m.matchReason,
        aiAnalysis: m.aiAnalysis,
        status: m.status,
        user1Consent: m.user1Consent,
        user2Consent: m.user2Consent,
        user1ConsentAt: m.user1ConsentAt,
        user2ConsentAt: m.user2ConsentAt,
        dealRoomId: m.dealRoomId,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        counterpartyVerificationTier: m.counterpartyVerificationTier,
        counterpartyDealCount: m.counterpartyDealCount,
      };
      if (m.mutualConsent) {
        return {
          ...base,
          counterpartyName: m.counterpartyName,
          counterpartyCompany: m.counterpartyCompany,
          counterpartyHandle: m.counterpartyHandle,
        };
      }
      return {
        ...base,
        counterpartyName: undefined,
        counterpartyCompany: undefined,
        counterpartyHandle: undefined,
      };
    });
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

      const template = await db.getDefaultNdaTemplate();
      const user1 = await db.getUserById(match.user1Id);
      const user2 = await db.getUserById(match.user2Id);
      const partyAName = user1?.name ?? `Party 1 (User #${match.user1Id})`;
      const partyBName = user2?.name ?? `Party 2 (User #${match.user2Id})`;

      const dealRoomId = await db.createDealRoom({
        matchId: input.matchId,
        name: `Deal Room - Match #${input.matchId}`,
        createdBy: ctx.user.id,
        ndaRequired: true,
        ndaTemplateId: template?.id ?? null,
        settings: {
          allowDownloads: false,
          watermarkDocuments: true,
          requireNda: true,
          autoExpireAccess: true,
          expiryDays: 30,
        },
      });

      let ndaDocumentId: number | null = null;
      if (template) {
        try {
          const pdfBytes = await generateNdaPdf({
            partyAName,
            partyBName,
            jurisdiction: template.jurisdiction ?? undefined,
            templateContent: template.content,
          });
          const key = `deal-rooms/${dealRoomId}/nda-${Date.now()}.pdf`;
          const { url } = await storagePut(key, new Uint8Array(pdfBytes), "application/pdf");
          ndaDocumentId = await db.createDocument({
            dealRoomId,
            name: "Mutual NDA",
            fileUrl: url,
            fileKey: key,
            mimeType: "application/pdf",
            category: "nda",
            uploadedBy: ctx.user.id,
          });
        } catch (e) {
          console.warn("NDA PDF creation skipped:", e);
        }
      }

      await db.grantDealRoomAccess({
        dealRoomId,
        userId: match.user1Id,
        accessLevel: 'edit',
        ndaSigned: false,
        ndaDocumentId,
      });
      await db.grantDealRoomAccess({
        dealRoomId,
        userId: match.user2Id,
        accessLevel: 'edit',
        ndaSigned: false,
        ndaDocumentId,
      });
      await db.updateMatch(input.matchId, { dealRoomId, status: 'deal_room_created' });

      return { dealRoomId };
    }),
});
