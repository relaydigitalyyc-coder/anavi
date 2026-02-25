import { eq, desc, and, or, like, inArray, isNull } from "drizzle-orm";
import {
  deals, dealParticipants, dealRooms, dealRoomAccess,
  documents, documentSignatures,
  intents, relationships, matches,
} from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createDeal(data: typeof deals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deals).values(data);
  return result[0].insertId;
}

export async function findCompletedDealWithCounterparty(
  originatorId: number,
  counterpartyId: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const participants = await db
    .select({ dealId: dealParticipants.dealId })
    .from(dealParticipants)
    .where(eq(dealParticipants.userId, counterpartyId));
  const dealIds = participants.map((p) => p.dealId);

  if (dealIds.length === 0) return undefined;

  const result = await db
    .select()
    .from(deals)
    .where(
      and(
        eq(deals.originatorId, originatorId),
        eq(deals.stage, "completed"),
        inArray(deals.id, dealIds)
      )
    )
    .limit(1);
  return result[0];
}

export async function getDealsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const participantDeals = await db.select({ dealId: dealParticipants.dealId })
    .from(dealParticipants)
    .where(eq(dealParticipants.userId, userId));
  
  const dealIds = participantDeals.map(p => p.dealId);
  if (dealIds.length === 0) return [];
  
  return db.select().from(deals).where(inArray(deals.id, dealIds)).orderBy(desc(deals.createdAt));
}

export type GlobalSearchResult = {
  type: "intent" | "deal" | "relationship" | "match";
  id: number;
  title: string;
  subtitle: string;
  url: string;
};

export async function globalSearch(userId: number, query: string, limit = 20): Promise<GlobalSearchResult[]> {
  const db = await getDb();
  if (!db || !query.trim()) return [];

  const q = `%${query.trim().replace(/[%_\\]/g, "\\$&")}%`;
  const results: GlobalSearchResult[] = [];

  const intentRows = await db.select({ id: intents.id, title: intents.title, description: intents.description })
    .from(intents)
    .where(and(eq(intents.userId, userId), or(like(intents.title, q), like(intents.description, q))))
    .limit(5);
  for (const r of intentRows) {
    results.push({
      type: "intent",
      id: r.id,
      title: r.title,
      subtitle: (r.description ?? "").slice(0, 60) + ((r.description?.length ?? 0) > 60 ? "…" : ""),
      url: "/deal-matching",
    });
  }

  const dealPart = await db.select({ dealId: dealParticipants.dealId }).from(dealParticipants).where(eq(dealParticipants.userId, userId));
  const dealIds = dealPart.map(p => p.dealId);
  if (dealIds.length > 0) {
    const dealRows = await db.select({ id: deals.id, title: deals.title })
      .from(deals)
      .where(and(inArray(deals.id, dealIds), like(deals.title, q)))
      .limit(5);
    for (const r of dealRows) {
      results.push({ type: "deal", id: r.id, title: r.title, subtitle: "Deal", url: `/deals` });
    }
  }

  const relRows = await db.select({ id: relationships.id, notes: relationships.notes })
    .from(relationships)
    .where(and(eq(relationships.ownerId, userId), like(relationships.notes, q)))
    .limit(5);
  for (const r of relRows) {
    results.push({
      type: "relationship",
      id: r.id,
      title: `Relationship #${r.id}`,
      subtitle: (r.notes ?? "").slice(0, 60) + ((r.notes?.length ?? 0) > 60 ? "…" : ""),
      url: "/relationships",
    });
  }

  const matchRows = await db.select({ id: matches.id, matchReason: matches.matchReason })
    .from(matches)
    .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
    .limit(20);
  const filteredMatches = matchRows.filter(m => (m.matchReason ?? "").toLowerCase().includes(query.trim().toLowerCase()));
  for (const r of filteredMatches.slice(0, 5)) {
    results.push({
      type: "match",
      id: r.id,
      title: `Match #${r.id}`,
      subtitle: (r.matchReason ?? "").slice(0, 60),
      url: "/deal-matching",
    });
  }

  return results.slice(0, limit);
}

export async function getDealById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  return result[0];
}

export async function updateDeal(id: number, data: Partial<typeof deals.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deals).set({ ...data, updatedAt: new Date() }).where(eq(deals.id, id));
}

export async function getDealParticipants(dealId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealParticipants).where(eq(dealParticipants.dealId, dealId));
}

export async function addDealParticipant(data: typeof dealParticipants.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dealParticipants).values(data);
  return result[0].insertId;
}

// ============================================================================
// DEAL ROOM OPERATIONS
// ============================================================================

export async function createDealRoom(data: typeof dealRooms.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dealRooms).values(data);
  return result[0].insertId;
}

export async function getDealRoomById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dealRooms).where(eq(dealRooms.id, id)).limit(1);
  return result[0];
}

export async function getDealRoomsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const accessList = await db.select({ dealRoomId: dealRoomAccess.dealRoomId })
    .from(dealRoomAccess)
    .where(eq(dealRoomAccess.userId, userId));
  
  const roomIds = accessList.map(a => a.dealRoomId);
  if (roomIds.length === 0) return [];
  
  return db.select().from(dealRooms).where(inArray(dealRooms.id, roomIds));
}

export async function grantDealRoomAccess(data: typeof dealRoomAccess.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dealRoomAccess).values(data);
  return result[0].insertId;
}

export async function getDealRoomAccessByUserAndRoom(dealRoomId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(dealRoomAccess)
    .where(
      and(
        eq(dealRoomAccess.dealRoomId, dealRoomId),
        eq(dealRoomAccess.userId, userId),
        isNull(dealRoomAccess.revokedAt)
      )
    )
    .limit(1);
  return result[0];
}

export async function getDealRoomAccessByRoom(dealRoomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(dealRoomAccess)
    .where(
      and(
        eq(dealRoomAccess.dealRoomId, dealRoomId),
        isNull(dealRoomAccess.revokedAt)
      )
    );
}

export async function updateDealRoomAccess(
  dealRoomId: number,
  userId: number,
  data: Partial<typeof dealRoomAccess.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(dealRoomAccess)
    .set(data)
    .where(
      and(
        eq(dealRoomAccess.dealRoomId, dealRoomId),
        eq(dealRoomAccess.userId, userId)
      )
    );
}

// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================

export async function createDocument(data: typeof documents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(data);
  return result[0].insertId;
}

export async function getDocumentsByDealRoom(dealRoomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents)
    .where(and(eq(documents.dealRoomId, dealRoomId), eq(documents.isLatest, true)))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0];
}

export async function updateDocument(id: number, data: Partial<typeof documents.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documents).set({ ...data, updatedAt: new Date() }).where(eq(documents.id, id));
}

// ============================================================================
// MILESTONE OPERATIONS
// ============================================================================

export async function getDealMilestones(dealId: number) {
  const deal = await getDealById(dealId);
  if (!deal) return [];
  return (deal.milestones as any[]) ?? [];
}

export async function completeMilestone(dealId: number, milestoneId: string) {
  const deal = await getDealById(dealId);
  if (!deal) throw new Error("Deal not found");

  const milestones = (deal.milestones as any[]) ?? [];
  const milestone = milestones.find((m: any) => m.id === milestoneId);
  if (!milestone) throw new Error("Milestone not found");

  milestone.status = "completed";
  milestone.completedAt = new Date().toISOString();

  await updateDeal(dealId, { milestones } as any);
  return { milestones, milestone };
}
