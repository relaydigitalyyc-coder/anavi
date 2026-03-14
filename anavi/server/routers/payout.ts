import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { deals, dealParticipants } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  calculatePayoutSplits,
  type FollowOnAttribution,
} from "../_core/payoutCalc";

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getIdempotencyMeta = (
  row: Awaited<ReturnType<typeof db.getAuditLog>>[number],
) => (row.metadata ?? {}) as Record<string, unknown>;

const buildArtifactId = () =>
  Number(`${Date.now()}`.slice(-9)) + Math.floor(Math.random() * 1000);

export const payoutRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getPayoutsByUser(ctx.user.id);
  }),

  getStatement: protectedProcedure
    .input(
      z.object({
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const payouts = await db.getPayoutsByUser(ctx.user.id);
      const start = new Date(input.periodStart);
      const end = new Date(input.periodEnd);
      const items = payouts.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= start && d <= end;
      });
      const total = items.reduce((s, p) => s + Number(p.amount ?? 0), 0);
      return {
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        items,
        total,
      };
    }),

  getByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      return db.getPayoutsByDeal(input.dealId);
    }),

  publishSnapshot: protectedProcedure
    .input(
      z.object({
        idempotencyKey: z.string().min(8).max(128).optional(),
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),
        filters: z.record(z.string(), z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingRows = await db.getAuditLog(
        "portfolio_snapshot",
        ctx.user.id,
        200
      );
      if (input.idempotencyKey) {
        const existing = existingRows.find((row) => {
          const meta = getIdempotencyMeta(row);
          return (
            row.action === "portfolio_snapshot_published" &&
            meta.idempotencyKey === input.idempotencyKey
          );
        });
        if (existing) {
          const meta = getIdempotencyMeta(existing);
          return {
            snapshotId: Number(meta.snapshotId ?? 0),
            publishedAt:
              typeof meta.publishedAt === "string"
                ? meta.publishedAt
                : existing.createdAt.toISOString(),
            url:
              typeof meta.url === "string"
                ? meta.url
                : `/portfolio/snapshots/${meta.snapshotId ?? existing.id}`,
            idempotent: true,
          };
        }
      }

      const payouts = await db.getPayoutsByUser(ctx.user.id);
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);
      const items = payouts.filter((payout) => {
        const ts = payout.createdAt.getTime();
        return ts >= periodStart.getTime() && ts <= periodEnd.getTime();
      });
      const total = items.reduce((sum, payout) => sum + toNumber(payout.amount), 0);
      const snapshotId = buildArtifactId();
      const publishedAt = new Date().toISOString();
      const url = `/portfolio/snapshots/${snapshotId}`;

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "portfolio_snapshot_published",
        entityType: "portfolio_snapshot",
        entityId: ctx.user.id,
        metadata: {
          idempotencyKey: input.idempotencyKey ?? null,
          snapshotId,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          itemCount: items.length,
          total,
          filters: input.filters ?? null,
          publishedAt,
          url,
        },
      });

      return {
        snapshotId,
        publishedAt,
        url,
        itemCount: items.length,
        total,
        idempotent: false,
      };
    }),

  exportStatement: protectedProcedure
    .input(
      z.object({
        idempotencyKey: z.string().min(8).max(128).optional(),
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),
        filters: z.record(z.string(), z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingRows = await db.getAuditLog(
        "portfolio_statement_export",
        ctx.user.id,
        200
      );
      if (input.idempotencyKey) {
        const existing = existingRows.find((row) => {
          const meta = getIdempotencyMeta(row);
          return (
            row.action === "portfolio_statement_exported" &&
            meta.idempotencyKey === input.idempotencyKey
          );
        });
        if (existing) {
          const meta = getIdempotencyMeta(existing);
          return {
            statementId: Number(meta.statementId ?? 0),
            exportedAt:
              typeof meta.exportedAt === "string"
                ? meta.exportedAt
                : existing.createdAt.toISOString(),
            url:
              typeof meta.url === "string"
                ? meta.url
                : `/portfolio/statements/${meta.statementId ?? existing.id}.json`,
            total: toNumber(meta.total),
            itemCount: Number(meta.itemCount ?? 0),
            idempotent: true,
          };
        }
      }

      const payouts = await db.getPayoutsByUser(ctx.user.id);
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);
      const items = payouts.filter((payout) => {
        const ts = payout.createdAt.getTime();
        return ts >= periodStart.getTime() && ts <= periodEnd.getTime();
      });
      const total = items.reduce((sum, payout) => sum + toNumber(payout.amount), 0);
      const statementId = buildArtifactId();
      const exportedAt = new Date().toISOString();
      const url = `/portfolio/statements/${statementId}.json`;

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "portfolio_statement_exported",
        entityType: "portfolio_statement_export",
        entityId: ctx.user.id,
        metadata: {
          idempotencyKey: input.idempotencyKey ?? null,
          statementId,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          itemCount: items.length,
          total,
          filters: input.filters ?? null,
          exportedAt,
          url,
        },
      });

      return {
        statementId,
        exportedAt,
        url,
        total,
        itemCount: items.length,
        idempotent: false,
      };
    }),

  /** Preview payout splits for a deal without writing to DB. */
  calculate: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      const conn = await db.getDb();
      if (!conn)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const deal = await conn
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);
      if (deal.length === 0)
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });

      const d = deal[0];
      const dealValue = Number(d.dealValue ?? 0);

      const participants = await conn
        .select()
        .from(dealParticipants)
        .where(eq(dealParticipants.dealId, input.dealId));

      const followOns: FollowOnAttribution[] = [];
      if (d.isFollowOn && d.originalDealId) {
        const origParticipants = await conn
          .select()
          .from(dealParticipants)
          .where(
            and(
              eq(dealParticipants.dealId, d.originalDealId),
              eq(dealParticipants.role, "originator"),
            ),
          );
        for (const op of origParticipants) {
          if (op.relationshipId) {
            followOns.push({
              userId: op.userId,
              relationshipId: op.relationshipId,
              attributionPercentage: 10,
            });
          }
        }
      }

      const feeRate = 0.02;
      const splits = calculatePayoutSplits(
        dealValue,
        feeRate,
        participants,
        followOns,
      );

      return {
        dealId: input.dealId,
        dealValue,
        totalFees: dealValue * feeRate,
        splits,
      };
    }),

  /** Admin: approve a pending payout. */
  approve: adminProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ input }) => {
      const payout = await db.getPayoutById(input.payoutId);
      if (!payout)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payout not found",
        });
      if (payout.status !== "pending")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot approve payout in '${payout.status}' status`,
        });

      await db.updatePayout(input.payoutId, { status: "approved" });
      return { payoutId: input.payoutId, status: "approved" as const };
    }),

  /** Admin: execute an approved payout. Attempts Stripe transfer; falls back to mock completion. */
  execute: adminProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ input }) => {
      const payout = await db.getPayoutById(input.payoutId);
      if (!payout)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payout not found",
        });
      if (payout.status !== "approved")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot execute payout in '${payout.status}' status`,
        });

      // Stripe integration placeholder — in production this calls stripe.transfers.create
      const stripeEnabled = false;
      if (stripeEnabled) {
        await db.updatePayout(input.payoutId, { status: "processing" });
        return {
          payoutId: input.payoutId,
          status: "processing" as const,
        };
      }

      await db.updatePayout(input.payoutId, {
        status: "completed",
        paidAt: new Date(),
      });
      return { payoutId: input.payoutId, status: "completed" as const };
    }),
});
