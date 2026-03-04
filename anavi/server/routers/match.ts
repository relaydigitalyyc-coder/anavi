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

      // Reject interest on terminal states
      if (match.status === 'declined' || match.status === 'expired') {
        await db.logAuditEvent({
          userId: ctx.user.id,
          action: 'interest_rejected',
          entityType: 'match',
          entityId: input.matchId,
          previousState: { status: match.status },
          newState: { status: match.status },
          metadata: { reason: 'terminal_status' },
        });
        throw new TRPCError({ code: 'CONFLICT', message: 'Cannot express interest on a declined or expired match.' });
      }

      const isUser1 = match.user1Id === ctx.user.id;
      const userAlreadyConsented = isUser1 ? !!match.user1Consent : !!match.user2Consent;
      const otherConsent = isUser1 ? match.user2Consent : match.user1Consent;

      // Compute next status without forcing change on idempotent calls
      const nextStatus = otherConsent
        ? ('mutual_interest' as const)
        : (!userAlreadyConsented
            ? (isUser1 ? ('user1_interested' as const) : ('user2_interested' as const))
            : (match.status as typeof match.status));

      const updateData: Record<string, unknown> = isUser1
        ? { user1Consent: true }
        : { user2Consent: true };
      if (!userAlreadyConsented) {
        // Only stamp consentAt on first consent from this actor
        if (isUser1) Object.assign(updateData, { user1ConsentAt: new Date() });
        else Object.assign(updateData, { user2ConsentAt: new Date() });
      }
      if (nextStatus !== match.status) Object.assign(updateData, { status: nextStatus });

      // Idempotency: no DB write if nothing actually changes
      const willChange = !userAlreadyConsented || nextStatus !== match.status;
      if (willChange) {
        await db.updateMatch(input.matchId, updateData);
      }

      // Audit interest expression for lifecycle traceability
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: willChange ? 'interest_expressed' : 'interest_expressed_noop',
        entityType: 'match',
        entityId: input.matchId,
        previousState: { status: match.status },
        newState: { status: nextStatus },
        metadata: { actor: isUser1 ? 'user1' : 'user2' },
      });

      const otherUserId = isUser1 ? match.user2Id : match.user1Id;
      // Only notify on actual change to avoid duplicate spam from retries
      if (willChange) {
        await db.createNotification({
          userId: otherUserId,
          type: 'match_found',
          title: 'New Match Interest',
          message: 'Someone has expressed interest in your intent match.',
          relatedEntityType: 'match',
          relatedEntityId: input.matchId,
        });
      }

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

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'match_declined',
        entityType: 'match',
        entityId: input.matchId,
        previousState: { status: match.status },
        newState: { status: 'declined' },
      });

      const otherUserId = match.user1Id === ctx.user.id ? match.user2Id : match.user1Id;
      await db.createNotification({
        userId: otherUserId,
        type: 'system',
        title: 'Match Declined',
        message: 'The counterparty has declined this match.',
        relatedEntityType: 'match',
        relatedEntityId: input.matchId,
      });
      return { success: true };
    }),

  createDealRoom: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const matches = await db.getMatchesByUser(ctx.user.id);
      const match = matches.find(m => m.id === input.matchId);
      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (match.status === 'declined' || match.status === 'expired') {
        await db.logAuditEvent({
          userId: ctx.user.id,
          action: 'deal_room_rejected',
          entityType: 'match',
          entityId: input.matchId,
          previousState: { status: match.status },
          newState: { status: match.status },
          metadata: { reason: 'terminal_status' },
        });
        throw new TRPCError({ code: 'CONFLICT', message: 'Cannot create a deal room for a declined/expired match.' });
      }

      if (match.dealRoomId) {
        // Idempotent: return existing room id
        await db.logAuditEvent({
          userId: ctx.user.id,
          action: 'deal_room_created_noop',
          entityType: 'match',
          entityId: input.matchId,
          previousState: { status: match.status, dealRoomId: match.dealRoomId },
          newState: { status: match.status, dealRoomId: match.dealRoomId },
        });
        return { dealRoomId: match.dealRoomId };
      }

      if (match.status !== 'mutual_interest') {
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

      // Audit + notify on deal room creation for lifecycle consistency
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: 'deal_room_created',
        entityType: 'match',
        entityId: input.matchId,
        previousState: { status: match.status },
        newState: { status: 'deal_room_created', dealRoomId },
      });

      // Notify both counterparties that a room is available
      await db.createNotification({
        userId: match.user1Id,
        type: 'deal_update',
        title: 'Deal Room Created',
        message: `A deal room was created for Match #${input.matchId}.`,
        relatedEntityType: 'match',
        relatedEntityId: input.matchId,
      });
      await db.createNotification({
        userId: match.user2Id,
        type: 'deal_update',
        title: 'Deal Room Created',
        message: `A deal room was created for Match #${input.matchId}.`,
        relatedEntityType: 'match',
        relatedEntityId: input.matchId,
      });

      return { dealRoomId };
    }),

  // Mark a match as queued for NDA processing
  queueNda: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const matches = await db.getMatchesByUser(ctx.user.id);
      const match = matches.find(m => m.id === input.matchId);
      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (match.status === 'declined' || match.status === 'expired') {
        await db.logAuditEvent({
          userId: ctx.user.id,
          action: 'nda_queue_rejected',
          entityType: 'match',
          entityId: input.matchId,
          previousState: { status: match.status },
          newState: { status: match.status },
          metadata: { reason: 'terminal_status' },
        });
        throw new TRPCError({ code: 'CONFLICT', message: 'Cannot queue NDA for declined/expired match.' });
      }

      if (match.status === 'deal_room_created') {
        // Conflict: NDA queue after room creation is not allowed in this pass
        await db.logAuditEvent({
          userId: ctx.user.id,
          action: 'nda_queue_rejected',
          entityType: 'match',
          entityId: input.matchId,
          previousState: { status: match.status },
          newState: { status: match.status },
          metadata: { reason: 'room_already_created' },
        });
        throw new TRPCError({ code: 'CONFLICT', message: 'NDA queue not allowed after deal room creation.' });
      }

      const willChange = match.status !== 'nda_pending';
      if (willChange) {
        await db.updateMatch(input.matchId, { status: 'nda_pending' as const });
      }

      // Audit + notify counterparties
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: willChange ? 'nda_queue' : 'nda_queue_noop',
        entityType: 'match',
        entityId: input.matchId,
        previousState: { status: match.status },
        newState: { status: 'nda_pending' },
        metadata: { reason: 'User queued NDA from Deal Flow' },
      });

      const otherUserId = match.user1Id === ctx.user.id ? match.user2Id : match.user1Id;
      if (willChange) {
        await db.createNotification({
          userId: otherUserId,
          type: 'deal_update',
          title: 'NDA Requested',
          message: 'Your match has been queued for NDA execution.',
          relatedEntityType: 'match',
          relatedEntityId: input.matchId,
        });
      }

      return { success: true };
    }),

  // Persist an escalation/pass intent with audit + notification
  escalate: protectedProcedure
    .input(z.object({ matchId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const matches = await db.getMatchesByUser(ctx.user.id);
      const match = matches.find(m => m.id === input.matchId);
      if (!match) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (match.status === 'deal_room_created') {
        await db.logAuditEvent({
          userId: ctx.user.id,
          action: 'escalation_rejected',
          entityType: 'match',
          entityId: input.matchId,
          previousState: { status: match.status },
          newState: { status: match.status },
          metadata: { reason: 'room_already_created' },
        });
        throw new TRPCError({ code: 'CONFLICT', message: 'Cannot escalate after a deal room is created.' });
      }

      const willChange = match.status !== 'declined';
      if (willChange) {
        await db.updateMatch(input.matchId, { status: 'declined' as const });
      }

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: willChange ? 'escalation_requested' : 'escalation_requested_noop',
        entityType: 'match',
        entityId: input.matchId,
        previousState: { status: match.status },
        newState: { status: 'declined' },
        metadata: input.reason ? { reason: input.reason } : undefined,
      });

      const otherUserId = match.user1Id === ctx.user.id ? match.user2Id : match.user1Id;
      if (willChange) {
        await db.createNotification({
          userId: otherUserId,
          type: 'system',
          title: 'Match Escalated',
          message: 'Counterparty has escalated/declined this match.',
          relatedEntityType: 'match',
          relatedEntityId: input.matchId,
        });
      }

      return { success: true };
    }),
});
