import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const notificationRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          unreadOnly: z.boolean().optional(),
          limit: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const notifications = await db.getNotificationsByUser(
        ctx.user.id,
        input?.unreadOnly
      );
      if (input?.limit) {
        return notifications.slice(0, input.limit);
      }
      return notifications;
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationRead(input.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const notifications = await db.getNotificationsByUser(ctx.user.id, true);
    for (const n of notifications) {
      await db.markNotificationRead(n.id);
    }
    return { success: true };
  }),

  pendingActions: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(10).default(3),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 3;
      const [user, docs, unreadNotifications, matches, intents] =
        await Promise.all([
          db.getUserById(ctx.user.id),
          db.getVerificationDocuments(ctx.user.id),
          db.getNotificationsByUser(ctx.user.id, true),
          db.getMatchesByUser(ctx.user.id),
          db.getIntentsByUser(ctx.user.id),
        ]);

      const actions: Array<{
        id: string;
        text: string;
        source: "verification" | "match" | "notification" | "intent";
        priority: number;
        createdAt: string;
        link: string;
        badge?: string;
      }> = [];

      const nowIso = new Date().toISOString();
      const verificationPendingCount = docs.filter(
        (doc) => doc.status === "pending"
      ).length;

      if (!user || user.verificationTier === "none") {
        actions.push({
          id: "verification-tier-upgrade",
          text: "Complete verification to unlock protected workflows",
          source: "verification",
          priority: 10,
          createdAt: nowIso,
          link: "/verification",
          badge: "Required",
        });
      }

      if (verificationPendingCount > 0) {
        actions.push({
          id: "verification-doc-review",
          text: `Resolve ${verificationPendingCount} verification document review item${verificationPendingCount > 1 ? "s" : ""}`,
          source: "verification",
          priority: 9,
          createdAt: nowIso,
          link: "/verification",
          badge: "Required",
        });
      }

      const consentStageCount = matches.filter((match) =>
        ["pending", "user1_interested", "user2_interested"].includes(
          match.status ?? "pending"
        )
      ).length;
      if (consentStageCount > 0) {
        actions.push({
          id: "review-consent-stage-matches",
          text: `Review ${consentStageCount} consent-stage match${consentStageCount > 1 ? "es" : ""}`,
          source: "match",
          priority: 8,
          createdAt: nowIso,
          link: "/pipeline?status=pending",
          badge: "Action",
        });
      }

      const ndaPendingCount = matches.filter(
        (match) => match.status === "nda_pending"
      ).length;
      if (ndaPendingCount > 0) {
        actions.push({
          id: "advance-nda-pipeline",
          text: `Advance ${ndaPendingCount} NDA-stage deal${ndaPendingCount > 1 ? "s" : ""}`,
          source: "match",
          priority: 7,
          createdAt: nowIso,
          link: "/pipeline?status=nda_pending",
          badge: "Action",
        });
      }

      if (unreadNotifications.length > 0) {
        actions.push({
          id: "clear-unread-notifications",
          text: `Clear ${unreadNotifications.length} unread notification${unreadNotifications.length > 1 ? "s" : ""}`,
          source: "notification",
          priority: 6,
          createdAt:
            unreadNotifications[0]?.createdAt?.toISOString?.() ?? nowIso,
          link: "/dashboard",
          badge: "Triage",
        });
      }

      const activeIntentCount = intents.filter(
        (intent) => intent.status === "active"
      ).length;
      if (activeIntentCount === 0) {
        actions.push({
          id: "create-or-refresh-intent",
          text: "Create or refresh an intent to restore match flow",
          source: "intent",
          priority: 5,
          createdAt: nowIso,
          link: "/deal-matching",
          badge: "Pipeline",
        });
      }

      return actions
        .sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        })
        .slice(0, limit);
    }),
});
