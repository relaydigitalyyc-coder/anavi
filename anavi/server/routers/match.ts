import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { generateNdaPdf } from "../_core/ndaPdf";
import { storagePut } from "../storage";
import { intents } from "../../drizzle/schema";
import { inArray } from "drizzle-orm";

const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVE_DEAL_STAGES = new Set([
  "lead",
  "qualification",
  "due_diligence",
  "negotiation",
  "documentation",
  "closing",
]);

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const average = (values: number[]) =>
  values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const MARKET_DEPTH_BUYER_STATUSES = new Set([
  "mutual_interest",
  "nda_pending",
  "deal_room_created",
]);

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

  liveStats: protectedProcedure.query(async ({ ctx }) => {
    const [rows, deals, payouts] = await Promise.all([
      db.getMatchesWithCounterpartyByUser(ctx.user.id),
      db.getDealsByUser(ctx.user.id),
      db.getPayoutsByUser(ctx.user.id),
    ]);

    const now = Date.now();
    const activeMatches = rows.filter(
      (row) => row.status !== "declined" && row.status !== "expired"
    );

    const pipeline = activeMatches.reduce(
      (acc, row) => {
        switch (row.status) {
          case "pending":
            acc.sourcing += 1;
            break;
          case "user1_interested":
          case "user2_interested":
          case "nda_pending":
            acc.dueDiligence += 1;
            break;
          case "mutual_interest":
            acc.termSheet += 1;
            break;
          case "deal_room_created":
            acc.closing += 1;
            break;
          default:
            break;
        }
        return acc;
      },
      { sourcing: 0, dueDiligence: 0, termSheet: 0, closing: 0 }
    );

    const totalPipeline =
      pipeline.sourcing +
      pipeline.dueDiligence +
      pipeline.termSheet +
      pipeline.closing;

    const newVerifiedMatches24h = activeMatches.filter((row) => {
      const createdAt = row.createdAt ? new Date(row.createdAt).getTime() : 0;
      const isRecent = createdAt > 0 && now - createdAt <= DAY_MS;
      const isVerifiedCounterparty =
        row.counterpartyVerificationTier &&
        row.counterpartyVerificationTier !== "none";
      return isRecent && isVerifiedCounterparty;
    }).length;

    const diligenceAges = deals
      .filter((deal) => deal.stage === "due_diligence" && deal.createdAt)
      .map((deal) => (now - new Date(deal.createdAt as Date).getTime()) / DAY_MS)
      .filter((value) => Number.isFinite(value) && value >= 0);

    const avgCloseDurations = deals
      .filter((deal) => deal.stage === "completed")
      .map((deal) => {
        const start = deal.createdAt ? new Date(deal.createdAt as Date).getTime() : NaN;
        const endCandidate = deal.actualCloseDate ?? deal.updatedAt;
        const end = endCandidate ? new Date(endCandidate as Date).getTime() : NaN;
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
          return null;
        }
        return (end - start) / DAY_MS;
      })
      .filter((value): value is number => value !== null);

    const activeDeals = deals.filter(
      (deal) => deal.stage && ACTIVE_DEAL_STAGES.has(deal.stage)
    );
    const committedCapital = activeDeals.reduce(
      (sum, deal) => sum + toNumber(deal.dealValue),
      0
    );
    const deployedCapital = payouts
      .filter((payout) =>
        payout.status === "processing" || payout.status === "completed"
      )
      .reduce((sum, payout) => sum + toNumber(payout.amount), 0);
    const pendingPayouts = payouts
      .filter((payout) => payout.status === "pending")
      .reduce((sum, payout) => sum + toNumber(payout.amount), 0);
    const availableCapital = Math.max(0, committedCapital - deployedCapital);
    const totalCapital = Math.max(committedCapital, availableCapital + deployedCapital);

    const weightedTrustScore = Math.round(
      average(activeMatches.map((row) => toNumber(row.compatibilityScore)))
    );
    const avgTimeToCloseDays =
      avgCloseDurations.length > 0
        ? Math.round(average(avgCloseDurations))
        : null;
    const diligenceMedianDays =
      diligenceAges.length > 0
        ? Number((median(diligenceAges) ?? 0).toFixed(1))
        : null;

    const freshnessCandidates = [
      ...rows.map((row) => (row.updatedAt ? new Date(row.updatedAt).getTime() : 0)),
      ...deals.map((deal) => (deal.updatedAt ? new Date(deal.updatedAt as Date).getTime() : 0)),
    ];
    const newestTs = Math.max(0, ...freshnessCandidates);

    return {
      generatedAt: new Date().toISOString(),
      lastUpdatedAt: newestTs > 0 ? new Date(newestTs).toISOString() : null,
      liveProof: {
        newVerifiedMatches24h,
        diligenceMedianDays,
        capitalAllocationReady: availableCapital,
      },
      pipeline: {
        ...pipeline,
        total: totalPipeline,
      },
      summary: {
        activePipeline: totalPipeline,
        committedCapital,
        weightedTrustScore,
        avgTimeToCloseDays,
      },
      capital: {
        available: availableCapital,
        committed: committedCapital,
        deployed: deployedCapital,
        pendingPayouts,
        total: totalCapital,
      },
    };
  }),

  marketDepth: protectedProcedure
    .input(
      z
        .object({
          periodStart: z.string().datetime().optional(),
          periodEnd: z.string().datetime().optional(),
          sector: z.string().optional(),
          includeStatuses: z.array(z.string()).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const rows = await db.getMatchesWithCounterpartyByUser(ctx.user.id);
      const conn = await db.getDb();
      const intentIds = Array.from(
        new Set(
          rows.flatMap((row) => [row.intent1Id, row.intent2Id]).filter(Boolean)
        )
      );
      const intentRows =
        conn && intentIds.length > 0
          ? await conn
              .select({
                id: intents.id,
                assetType: intents.assetType,
                title: intents.title,
              })
              .from(intents)
              .where(inArray(intents.id, intentIds))
          : [];
      const intentMap = new Map(intentRows.map((row) => [row.id, row]));

      const fromTs = input?.periodStart
        ? new Date(input.periodStart).getTime()
        : null;
      const toTs = input?.periodEnd ? new Date(input.periodEnd).getTime() : null;
      const includeStatuses = input?.includeStatuses
        ? new Set(input.includeStatuses)
        : null;

      const resolveSector = (row: (typeof rows)[number]) => {
        const intentA = intentMap.get(row.intent1Id);
        const intentB = intentMap.get(row.intent2Id);
        const raw =
          intentA?.assetType ??
          intentB?.assetType ??
          (intentA?.title ? intentA.title.split(" ").slice(0, 2).join(" ") : null) ??
          (intentB?.title ? intentB.title.split(" ").slice(0, 2).join(" ") : null);
        if (!raw) return "Private Markets";
        const cleaned = String(raw).replace(/_/g, " ").trim();
        return cleaned.length > 0
          ? cleaned
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          : "Private Markets";
      };

      const filteredRows = rows.filter((row) => {
        const updatedTs = row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
        if (fromTs != null && updatedTs > 0 && updatedTs < fromTs) return false;
        if (toTs != null && updatedTs > 0 && updatedTs > toTs) return false;
        if (includeStatuses && !includeStatuses.has(String(row.status))) return false;
        return true;
      });

      const buckets = new Map<
        string,
        { buyers: number; sellers: number; total: number; lastUpdatedAt: number }
      >();

      for (const row of filteredRows) {
        const sector = resolveSector(row);
        if (input?.sector && sector.toLowerCase() !== input.sector.toLowerCase()) {
          continue;
        }
        const current = buckets.get(sector) ?? {
          buyers: 0,
          sellers: 0,
          total: 0,
          lastUpdatedAt: 0,
        };
        const status = String(row.status ?? "pending");
        if (MARKET_DEPTH_BUYER_STATUSES.has(status)) current.buyers += 1;
        else current.sellers += 1;
        current.total += 1;
        const updatedTs = row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
        if (updatedTs > current.lastUpdatedAt) current.lastUpdatedAt = updatedTs;
        buckets.set(sector, current);
      }

      return Array.from(buckets.entries())
        .map(([sector, value]) => ({
          sector,
          buyers: value.buyers,
          sellers: value.sellers,
          total: value.total,
          lastUpdatedAt:
            value.lastUpdatedAt > 0
              ? new Date(value.lastUpdatedAt).toISOString()
              : null,
        }))
        .sort((a, b) => b.total - a.total);
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

      // Compliance gating: block deal room creation if either party is under hold
      const isBlockedFn: undefined | ((id: number) => Promise<boolean>) =
        (db as unknown as { isUserComplianceBlocked?: (id: number) => Promise<boolean> }).isUserComplianceBlocked;
      const user1Blocked = isBlockedFn ? await isBlockedFn(match.user1Id) : false;
      const user2Blocked = isBlockedFn ? await isBlockedFn(match.user2Id) : false;
      if (user1Blocked || user2Blocked) {
        await db.logAuditEvent({
          userId: ctx.user.id,
          action: 'deal_room_rejected',
          entityType: 'match',
          entityId: input.matchId,
          previousState: { status: match.status },
          newState: { status: match.status },
          metadata: { reason: 'compliance_block', user1Blocked, user2Blocked },
        });
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Compliance hold prevents Deal Room creation.' });
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
