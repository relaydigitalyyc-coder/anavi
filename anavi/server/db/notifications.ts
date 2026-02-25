import { eq, desc, and, or, sql, inArray } from "drizzle-orm";
import {
  notifications, verificationDocuments, peerReviews,
  relationships, intents, matches, deals, dealParticipants, payouts,
} from "../../drizzle/schema";
import { getDb } from "./connection";
import { getUserById } from "./users";

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

/** F9: Notify both users when a new match is created. */
export async function notifyNewMatch(matchId: number, user1Id: number, user2Id: number, matchReason?: string) {
  const msg = matchReason ? `Match: ${matchReason.slice(0, 80)}${matchReason.length > 80 ? "…" : ""}` : "A new compatible match was found for your intent.";
  const title = "New match found";
  await createNotification({ userId: user1Id, type: "match_found", title, message: msg, relatedEntityType: "match", relatedEntityId: matchId, actionUrl: "/deal-matching" });
  await createNotification({ userId: user2Id, type: "match_found", title, message: msg, relatedEntityType: "match", relatedEntityId: matchId, actionUrl: "/deal-matching" });
}

export async function getNotificationsByUser(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));
  
  return db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, id));
}

// ============================================================================
// VERIFICATION DOCUMENTS
// ============================================================================

export async function createVerificationDocument(data: typeof verificationDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(verificationDocuments).values(data);
  return result[0].insertId;
}

export async function getVerificationDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(verificationDocuments)
    .where(eq(verificationDocuments.userId, userId))
    .orderBy(desc(verificationDocuments.createdAt));
}

// ============================================================================
// PEER REVIEWS
// ============================================================================

export async function createPeerReview(data: typeof peerReviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(peerReviews).values(data);
  return result[0].insertId;
}

export async function getPeerReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(peerReviews)
    .where(eq(peerReviews.revieweeId, userId))
    .orderBy(desc(peerReviews.createdAt));
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const user = await getUserById(userId);
  const relationshipsCount = await db.select({ count: sql<number>`count(*)` })
    .from(relationships)
    .where(eq(relationships.ownerId, userId));
  
  const activeIntentsCount = await db.select({ count: sql<number>`count(*)` })
    .from(intents)
    .where(and(eq(intents.userId, userId), eq(intents.status, 'active')));
  
  const pendingMatchesCount = await db.select({ count: sql<number>`count(*)` })
    .from(matches)
    .where(and(
      or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
      eq(matches.status, 'pending')
    ));
  
  const activeDealsCount = await db.select({ count: sql<number>`count(*)` })
    .from(dealParticipants)
    .innerJoin(deals, eq(deals.id, dealParticipants.dealId))
    .where(and(
      eq(dealParticipants.userId, userId),
      inArray(deals.stage, ['lead', 'qualification', 'due_diligence', 'negotiation', 'documentation', 'closing'])
    ));
  
  const pendingPayoutsSum = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(payouts)
    .where(and(eq(payouts.userId, userId), eq(payouts.status, 'pending')));
  
  return {
    user,
    relationships: relationshipsCount[0]?.count || 0,
    relationshipCount: relationshipsCount[0]?.count || 0,
    activeIntents: activeIntentsCount[0]?.count || 0,
    intentCount: activeIntentsCount[0]?.count || 0,
    pendingMatches: pendingMatchesCount[0]?.count || 0,
    matchCount: pendingMatchesCount[0]?.count || 0,
    activeDeals: activeDealsCount[0]?.count || 0,
    dealCount: activeDealsCount[0]?.count || 0,
    pendingPayouts: pendingPayoutsSum[0]?.total || '0',
    totalDealValue: 0,
    totalEarnings: 0,
    trustScore: user?.trustScore || 0,
    verificationLevel: user?.verificationTier || 'none',
  };
}
