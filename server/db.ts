import { eq, desc, and, or, sql, gte, lte, like, inArray, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  relationships, contactHandles, intents, matches, deals,
  dealParticipants, dealRooms, dealRoomAccess, documents, documentSignatures,
  complianceChecks, payouts, auditLog, notifications, verificationDocuments,
  trustScoreHistory, peerReviews, enrichmentJobs,
  calendarConnections, calendarEvents, followUpReminders,
  dealAnalytics, conversionFunnels
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { createHash } from 'crypto';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateUserTrustScore(userId: number, newScore: string, reason: string, source: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  
  await db.insert(trustScoreHistory).values({
    userId,
    previousScore: user.trustScore,
    newScore,
    changeReason: reason,
    changeSource: source as any,
  });
  
  await db.update(users).set({ trustScore: newScore, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ============================================================================
// RELATIONSHIP OPERATIONS
// ============================================================================

export function generateTimestampHash(ownerId: number, contactId: number, timestamp: Date): string {
  const data = `${ownerId}:${contactId}:${timestamp.toISOString()}`;
  return createHash('sha256').update(data).digest('hex');
}

export async function createRelationship(data: {
  ownerId: number;
  contactId: number;
  relationshipType?: string;
  introducedBy?: number;
  notes?: string;
  tags?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const establishedAt = new Date();
  const timestampHash = generateTimestampHash(data.ownerId, data.contactId, establishedAt);
  
  const result = await db.insert(relationships).values({
    ownerId: data.ownerId,
    contactId: data.contactId,
    timestampHash,
    establishedAt,
    relationshipType: (data.relationshipType as any) || 'direct',
    introducedBy: data.introducedBy,
    notes: data.notes,
    tags: data.tags,
    attributionChain: data.introducedBy ? [data.introducedBy] : [],
  });
  
  return { id: result[0].insertId, timestampHash, establishedAt };
}

export async function getRelationshipsByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(relationships).where(eq(relationships.ownerId, ownerId)).orderBy(desc(relationships.createdAt));
}

export async function getRelationshipById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(relationships).where(eq(relationships.id, id)).limit(1);
  return result[0];
}

export async function updateRelationship(id: number, data: Partial<typeof relationships.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(relationships).set({ ...data, updatedAt: new Date() }).where(eq(relationships.id, id));
}

export async function getRelationshipNetwork(userId: number) {
  const db = await getDb();
  if (!db) return { nodes: [], edges: [] };
  
  const rels = await db.select().from(relationships)
    .where(or(eq(relationships.ownerId, userId), eq(relationships.contactId, userId)));
  
  const userIds = new Set<number>();
  rels.forEach(r => {
    userIds.add(r.ownerId);
    userIds.add(r.contactId);
    if (r.introducedBy) userIds.add(r.introducedBy);
  });
  
  const usersData = userIds.size > 0 
    ? await db.select().from(users).where(inArray(users.id, Array.from(userIds)))
    : [];
  
  const nodes = usersData.map(u => ({
    id: u.id,
    name: u.name || 'Unknown',
    company: u.company,
    trustScore: u.trustScore,
    verificationTier: u.verificationTier,
  }));
  
  const edges = rels.map(r => ({
    id: r.id,
    source: r.ownerId,
    target: r.contactId,
    strength: r.strengthScore,
    type: r.relationshipType,
    introducedBy: r.introducedBy,
  }));
  
  return { nodes, edges };
}

// ============================================================================
// CONTACT HANDLES
// ============================================================================

export async function addContactHandle(data: typeof contactHandles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactHandles).values(data);
  return result[0].insertId;
}

export async function getContactHandles(userId?: number, relationshipId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return db.select().from(contactHandles).where(eq(contactHandles.userId, userId));
  }
  if (relationshipId) {
    return db.select().from(contactHandles).where(eq(contactHandles.relationshipId, relationshipId));
  }
  return [];
}

// ============================================================================
// INTENT OPERATIONS
// ============================================================================

export async function createIntent(data: typeof intents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(intents).values(data);
  return result[0].insertId;
}

export async function getIntentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(intents).where(eq(intents.userId, userId)).orderBy(desc(intents.createdAt));
}

export async function getActiveIntents(excludeUserId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(intents.status, 'active')];
  if (excludeUserId) {
    conditions.push(sql`${intents.userId} != ${excludeUserId}`);
  }
  
  return db.select().from(intents).where(and(...conditions)).orderBy(desc(intents.createdAt));
}

export async function updateIntent(id: number, data: Partial<typeof intents.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(intents).set({ ...data, updatedAt: new Date() }).where(eq(intents.id, id));
}

// ============================================================================
// MATCH OPERATIONS
// ============================================================================

export async function createMatch(data: typeof matches.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(matches).values(data);
  return result[0].insertId;
}

export async function getMatchesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matches)
    .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
    .orderBy(desc(matches.createdAt));
}

export async function updateMatch(id: number, data: Partial<typeof matches.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(matches).set({ ...data, updatedAt: new Date() }).where(eq(matches.id, id));
}

// ============================================================================
// DEAL OPERATIONS
// ============================================================================

export async function createDeal(data: typeof deals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deals).values(data);
  return result[0].insertId;
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

// ============================================================================
// COMPLIANCE OPERATIONS
// ============================================================================

export async function createComplianceCheck(data: typeof complianceChecks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(complianceChecks).values(data);
  return result[0].insertId;
}

export async function getComplianceChecks(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complianceChecks)
    .where(and(eq(complianceChecks.entityType, entityType as any), eq(complianceChecks.entityId, entityId)))
    .orderBy(desc(complianceChecks.createdAt));
}

export async function updateComplianceCheck(id: number, data: Partial<typeof complianceChecks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(complianceChecks).set(data).where(eq(complianceChecks.id, id));
}

// ============================================================================
// PAYOUT OPERATIONS
// ============================================================================

export async function createPayout(data: typeof payouts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payouts).values(data);
  return result[0].insertId;
}

export async function getPayoutsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payouts).where(eq(payouts.userId, userId)).orderBy(desc(payouts.createdAt));
}

export async function getPayoutsByDeal(dealId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payouts).where(eq(payouts.dealId, dealId)).orderBy(desc(payouts.createdAt));
}

export async function updatePayout(id: number, data: Partial<typeof payouts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payouts).set({ ...data, updatedAt: new Date() }).where(eq(payouts.id, id));
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export async function logAuditEvent(data: typeof auditLog.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values(data);
}

export async function getAuditLog(entityType?: string, entityId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (entityType) conditions.push(eq(auditLog.entityType, entityType));
  if (entityId) conditions.push(eq(auditLog.entityId, entityId));
  
  const query = db.select().from(auditLog);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(auditLog.createdAt)).limit(limit);
  }
  return query.orderBy(desc(auditLog.createdAt)).limit(limit);
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
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

// ============================================================================
// FAMILY OFFICE OPERATIONS
// ============================================================================

import { 
  familyOffices, institutionalInvestors, brokerContacts,
  familyOfficeTargets, targetActivities, socialProfiles, newsItems,
  dataEnrichmentLogs
} from "../drizzle/schema";

export async function getFamilyOffices(filters?: {
  type?: string;
  aumRange?: string;
  region?: string;
  state?: string;
  investmentFocus?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  
  const conditions = [eq(familyOffices.isActive, true)];
  
  if (filters?.type) {
    conditions.push(eq(familyOffices.type, filters.type as any));
  }
  if (filters?.aumRange) {
    conditions.push(eq(familyOffices.aumRange, filters.aumRange as any));
  }
  if (filters?.region) {
    conditions.push(eq(familyOffices.region, filters.region as any));
  }
  if (filters?.state) {
    conditions.push(eq(familyOffices.state, filters.state));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(familyOffices.name, `%${filters.search}%`),
        like(familyOffices.foundingFamily, `%${filters.search}%`),
        like(familyOffices.city, `%${filters.search}%`)
      ) as any
    );
  }
  
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  
  const data = await db.select()
    .from(familyOffices)
    .where(and(...conditions))
    .orderBy(desc(familyOffices.aum))
    .limit(limit)
    .offset(offset);
  
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(familyOffices)
    .where(and(...conditions));
  
  return { data, total: countResult[0]?.count || 0 };
}

export async function getFamilyOfficeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(familyOffices).where(eq(familyOffices.id, id)).limit(1);
  return result[0];
}

export async function getFamilyOfficeBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(familyOffices).where(eq(familyOffices.slug, slug)).limit(1);
  return result[0];
}

export async function getFamilyOfficeStats() {
  const db = await getDb();
  if (!db) return null;
  
  const totalCount = await db.select({ count: sql<number>`count(*)` }).from(familyOffices).where(eq(familyOffices.isActive, true));
  const totalAum = await db.select({ total: sql<string>`COALESCE(SUM(aum), 0)` }).from(familyOffices).where(eq(familyOffices.isActive, true));
  
  const byType = await db.select({
    type: familyOffices.type,
    count: sql<number>`count(*)`
  }).from(familyOffices).where(eq(familyOffices.isActive, true)).groupBy(familyOffices.type);
  
  const byAumRange = await db.select({
    range: familyOffices.aumRange,
    count: sql<number>`count(*)`
  }).from(familyOffices).where(and(eq(familyOffices.isActive, true), isNotNull(familyOffices.aumRange))).groupBy(familyOffices.aumRange);
  
  const byState = await db.select({
    state: familyOffices.state,
    count: sql<number>`count(*)`
  }).from(familyOffices).where(eq(familyOffices.isActive, true)).groupBy(familyOffices.state).orderBy(desc(sql`count(*)`)).limit(10);
  
  return {
    total: totalCount[0]?.count || 0,
    totalAum: totalAum[0]?.total || '0',
    byType,
    byAumRange,
    topStates: byState
  };
}

export async function searchFamilyOffices(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(familyOffices)
    .where(and(
      eq(familyOffices.isActive, true),
      or(
        like(familyOffices.name, `%${query}%`),
        like(familyOffices.foundingFamily, `%${query}%`),
        like(familyOffices.city, `%${query}%`),
        like(familyOffices.wealthSource, `%${query}%`)
      )
    ))
    .orderBy(desc(familyOffices.aum))
    .limit(limit);
}

// ============================================================================
// INSTITUTIONAL INVESTOR OPERATIONS
// ============================================================================

export async function getInstitutionalInvestors(filters?: {
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  
  const conditions = [eq(institutionalInvestors.isActive, true)];
  
  if (filters?.type) {
    conditions.push(eq(institutionalInvestors.type, filters.type as any));
  }
  if (filters?.search) {
    conditions.push(
      like(institutionalInvestors.name, `%${filters.search}%`)
    );
  }
  
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  
  const data = await db.select()
    .from(institutionalInvestors)
    .where(and(...conditions))
    .orderBy(desc(institutionalInvestors.aum))
    .limit(limit)
    .offset(offset);
  
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(institutionalInvestors)
    .where(and(...conditions));
  
  return { data, total: countResult[0]?.count || 0 };
}


// ============================================================================
// FAMILY OFFICE TARGETING OPERATIONS
// ============================================================================

export async function createTarget(data: typeof familyOfficeTargets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(familyOfficeTargets).values(data);
  return result[0].insertId;
}

export async function getTargetsByUser(userId: number, filters?: {
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  
  const conditions = [eq(familyOfficeTargets.userId, userId)];
  
  if (filters?.status) {
    conditions.push(eq(familyOfficeTargets.status, filters.status as any));
  }
  if (filters?.priority) {
    conditions.push(eq(familyOfficeTargets.priority, filters.priority as any));
  }
  
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  
  const data = await db.select({
    target: familyOfficeTargets,
    familyOffice: familyOffices
  })
    .from(familyOfficeTargets)
    .leftJoin(familyOffices, eq(familyOfficeTargets.familyOfficeId, familyOffices.id))
    .where(and(...conditions))
    .orderBy(desc(familyOfficeTargets.updatedAt))
    .limit(limit)
    .offset(offset);
  
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(familyOfficeTargets)
    .where(and(...conditions));
  
  return { data, total: countResult[0]?.count || 0 };
}

export async function getTargetById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select({
    target: familyOfficeTargets,
    familyOffice: familyOffices
  })
    .from(familyOfficeTargets)
    .leftJoin(familyOffices, eq(familyOfficeTargets.familyOfficeId, familyOffices.id))
    .where(eq(familyOfficeTargets.id, id))
    .limit(1);
  
  return result[0];
}

export async function updateTarget(id: number, data: Partial<typeof familyOfficeTargets.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(familyOfficeTargets).set({ ...data, updatedAt: new Date() }).where(eq(familyOfficeTargets.id, id));
}

export async function deleteTarget(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(familyOfficeTargets).where(eq(familyOfficeTargets.id, id));
}

export async function getTargetStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const byStatus = await db.select({
    status: familyOfficeTargets.status,
    count: sql<number>`count(*)`
  })
    .from(familyOfficeTargets)
    .where(eq(familyOfficeTargets.userId, userId))
    .groupBy(familyOfficeTargets.status);
  
  const byPriority = await db.select({
    priority: familyOfficeTargets.priority,
    count: sql<number>`count(*)`
  })
    .from(familyOfficeTargets)
    .where(eq(familyOfficeTargets.userId, userId))
    .groupBy(familyOfficeTargets.priority);
  
  const totalEstimatedValue = await db.select({
    total: sql<string>`COALESCE(SUM(estimatedDealSize), 0)`
  })
    .from(familyOfficeTargets)
    .where(eq(familyOfficeTargets.userId, userId));
  
  return {
    byStatus,
    byPriority,
    totalEstimatedValue: totalEstimatedValue[0]?.total || '0'
  };
}

// ============================================================================
// TARGET ACTIVITIES
// ============================================================================

export async function createTargetActivity(data: typeof targetActivities.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(targetActivities).values(data);
  
  // Update target's touchpoint count and last contact date
  await db.update(familyOfficeTargets)
    .set({
      totalTouchpoints: sql`totalTouchpoints + 1`,
      lastContactDate: new Date(),
      updatedAt: new Date()
    })
    .where(eq(familyOfficeTargets.id, data.targetId));
  
  return result[0].insertId;
}

export async function getTargetActivities(targetId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(targetActivities)
    .where(eq(targetActivities.targetId, targetId))
    .orderBy(desc(targetActivities.createdAt))
    .limit(limit);
}

// ============================================================================
// SOCIAL PROFILES
// ============================================================================

export async function createSocialProfile(data: typeof socialProfiles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(socialProfiles).values(data);
  return result[0].insertId;
}

export async function getSocialProfiles(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(socialProfiles)
    .where(and(
      eq(socialProfiles.entityType, entityType as any),
      eq(socialProfiles.entityId, entityId)
    ))
    .orderBy(socialProfiles.platform);
}

export async function updateSocialProfile(id: number, data: Partial<typeof socialProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(socialProfiles).set({ ...data, updatedAt: new Date() }).where(eq(socialProfiles.id, id));
}

export async function deleteSocialProfile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(socialProfiles).where(eq(socialProfiles.id, id));
}

// ============================================================================
// BROKER CONTACTS
// ============================================================================

export async function createBrokerContact(data: typeof brokerContacts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(brokerContacts).values(data);
  return result[0].insertId;
}

export async function getBrokerContacts(userId: number, filters?: {
  contactType?: string;
  relationshipStrength?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };
  
  const conditions = [eq(brokerContacts.ownerId, userId)];
  
  if (filters?.contactType) {
    conditions.push(eq(brokerContacts.contactType, filters.contactType as any));
  }
  if (filters?.relationshipStrength) {
    conditions.push(eq(brokerContacts.relationshipStrength, filters.relationshipStrength as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(brokerContacts.fullName, `%${filters.search}%`),
        like(brokerContacts.company, `%${filters.search}%`),
        like(brokerContacts.email, `%${filters.search}%`)
      ) as any
    );
  }
  
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  
  const data = await db.select()
    .from(brokerContacts)
    .where(and(...conditions))
    .orderBy(desc(brokerContacts.updatedAt))
    .limit(limit)
    .offset(offset);
  
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(brokerContacts)
    .where(and(...conditions));
  
  return { data, total: countResult[0]?.count || 0 };
}

export async function getBrokerContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(brokerContacts).where(eq(brokerContacts.id, id)).limit(1);
  return result[0];
}

export async function updateBrokerContact(id: number, data: Partial<typeof brokerContacts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(brokerContacts).set({ ...data, updatedAt: new Date() }).where(eq(brokerContacts.id, id));
}

export async function deleteBrokerContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(brokerContacts).where(eq(brokerContacts.id, id));
}

// Import family office contact to broker contacts
export async function importFamilyOfficeContact(
  userId: number,
  familyOfficeId: number,
  contactData: {
    name: string;
    title?: string;
    email?: string;
    linkedin?: string;
    phone?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get family office details
  const fo = await getFamilyOfficeById(familyOfficeId);
  if (!fo) throw new Error("Family office not found");
  
  // Parse name into first/last
  const nameParts = contactData.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Create broker contact
  const result = await db.insert(brokerContacts).values({
    ownerId: userId,
    firstName,
    lastName,
    fullName: contactData.name,
    company: fo.name,
    title: contactData.title,
    contactType: 'family_office',
    familyOfficeId: familyOfficeId,
    email: contactData.email,
    linkedinUrl: contactData.linkedin,
    phone: contactData.phone,
    city: fo.city || undefined,
    state: fo.state || undefined,
    country: fo.country || undefined,
    investmentFocus: fo.investmentFocus,
    relationshipStrength: 'cold',
    dataSource: 'family_office_import',
  });
  
  // Create LinkedIn social profile if provided
  if (contactData.linkedin) {
    await createSocialProfile({
      entityType: 'contact',
      entityId: result[0].insertId,
      platform: 'linkedin',
      profileUrl: contactData.linkedin,
      displayName: contactData.name,
    });
  }
  
  return result[0].insertId;
}

// ============================================================================
// NEWS ITEMS
// ============================================================================

export async function getNewsItems(entityType: string, entityId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(newsItems)
    .where(and(
      eq(newsItems.entityType, entityType as any),
      eq(newsItems.entityId, entityId)
    ))
    .orderBy(desc(newsItems.publishedAt))
    .limit(limit);
}

export async function createNewsItem(data: typeof newsItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(newsItems).values(data);
  return result[0].insertId;
}

// ============================================================================
// DATA ENRICHMENT
// ============================================================================

export async function logEnrichment(data: typeof dataEnrichmentLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dataEnrichmentLogs).values(data);
  return result[0].insertId;
}

export async function getEnrichmentLogs(entityType: string, entityId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(dataEnrichmentLogs)
    .where(and(
      eq(dataEnrichmentLogs.entityType, entityType as any),
      eq(dataEnrichmentLogs.entityId, entityId)
    ))
    .orderBy(desc(dataEnrichmentLogs.createdAt))
    .limit(limit);
}

// Update family office with enriched data
export async function enrichFamilyOffice(id: number, data: Partial<typeof familyOffices.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current data for comparison
  const current = await getFamilyOfficeById(id);
  if (!current) throw new Error("Family office not found");
  
  // Update the family office
  await db.update(familyOffices)
    .set({ ...data, updatedAt: new Date(), lastVerified: new Date() })
    .where(eq(familyOffices.id, id));
  
  // Log the enrichment
  const fieldsUpdated = Object.keys(data);
  await logEnrichment({
    entityType: 'family_office',
    entityId: id,
    provider: 'manual',
    enrichmentType: 'full_refresh',
    status: 'success',
    previousData: current as any,
    newData: data as any,
    fieldsUpdated,
  });
  
  return true;
}

// ============================================================================
// DATA ENRICHMENT HELPERS
// ============================================================================

export async function createEnrichmentJob(data: {
  entityType: "family_office" | "broker_contact" | "relationship";
  entityId: number;
  source: string;
  userId: number;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(enrichmentJobs).values({
    ...data,
    status: "pending",
    requestedAt: new Date(),
  });
  
  return result;
}

export async function getEnrichmentJobs(filters: {
  entityType?: string;
  status?: string;
  userId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(enrichmentJobs);
  const conditions = [];
  
  if (filters.entityType) {
    conditions.push(eq(enrichmentJobs.entityType, filters.entityType as any));
  }
  if (filters.status) {
    conditions.push(eq(enrichmentJobs.status, filters.status as any));
  }
  if (filters.userId) {
    conditions.push(eq(enrichmentJobs.userId, filters.userId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.limit(filters.limit || 50);
}

export async function updateEnrichmentJob(id: number, data: {
  status?: "pending" | "processing" | "completed" | "failed";
  enrichedData?: any;
  errorMessage?: string;
  completedAt?: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  
  return db.update(enrichmentJobs)
    .set(data)
    .where(eq(enrichmentJobs.id, id));
}

// Enrichment data application
export async function applyEnrichmentToFamilyOffice(familyOfficeId: number, enrichedData: {
  linkedinUrl?: string;
  website?: string;
  keyContacts?: any[];
  investmentFocus?: string[];
  recentInvestments?: any[];
  newsItems?: any[];
}) {
  const db = await getDb();
  if (!db) return null;
  
  const updateData: any = {};
  
  if (enrichedData.linkedinUrl) updateData.linkedinUrl = enrichedData.linkedinUrl;
  if (enrichedData.website) updateData.website = enrichedData.website;
  if (enrichedData.keyContacts) updateData.keyContacts = JSON.stringify(enrichedData.keyContacts);
  if (enrichedData.investmentFocus) updateData.investmentFocus = JSON.stringify(enrichedData.investmentFocus);
  if (enrichedData.recentInvestments) updateData.recentInvestments = JSON.stringify(enrichedData.recentInvestments);
  
  updateData.lastEnrichedAt = new Date();
  updateData.dataConfidence = "high";
  
  return db.update(familyOffices)
    .set(updateData)
    .where(eq(familyOffices.id, familyOfficeId));
}

// Social profile helpers
// Social profile functions defined above in SOCIAL PROFILES section


// ============================================================================
// CALENDAR INTEGRATION
// ============================================================================

export async function getCalendarConnections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(calendarConnections)
    .where(eq(calendarConnections.userId, userId))
    .orderBy(desc(calendarConnections.createdAt));
}

export async function createCalendarConnection(data: {
  userId: number;
  provider: "google" | "outlook" | "apple";
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  calendarId?: string;
  calendarName?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.insert(calendarConnections).values(data);
  return result;
}

export async function updateCalendarConnection(id: number, data: {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  syncEnabled?: boolean;
  lastSyncAt?: Date;
  syncStatus?: "active" | "paused" | "error";
}) {
  const db = await getDb();
  if (!db) return null;
  
  return db.update(calendarConnections)
    .set(data)
    .where(eq(calendarConnections.id, id));
}

export async function deleteCalendarConnection(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  return db.delete(calendarConnections)
    .where(eq(calendarConnections.id, id));
}

export async function getCalendarEvents(userId: number, filters?: {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  relatedDealId?: number;
  relatedTargetId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(calendarEvents)
    .where(eq(calendarEvents.userId, userId))
    .$dynamic();
  
  if (filters?.startDate) {
    query = query.where(gte(calendarEvents.startTime, filters.startDate));
  }
  if (filters?.endDate) {
    query = query.where(lte(calendarEvents.endTime, filters.endDate));
  }
  if (filters?.eventType) {
    query = query.where(eq(calendarEvents.eventType, filters.eventType as any));
  }
  if (filters?.relatedDealId) {
    query = query.where(eq(calendarEvents.relatedDealId, filters.relatedDealId));
  }
  if (filters?.relatedTargetId) {
    query = query.where(eq(calendarEvents.relatedTargetId, filters.relatedTargetId));
  }
  
  return query.orderBy(calendarEvents.startTime).limit(filters?.limit || 100);
}

export async function createCalendarEvent(data: {
  userId: number;
  title: string;
  description?: string;
  location?: string;
  meetingLink?: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  timezone?: string;
  eventType?: "meeting" | "call" | "follow_up" | "due_diligence" | "deal_room" | "pitch" | "closing" | "reminder" | "other";
  relatedDealId?: number;
  relatedTargetId?: number;
  relatedContactId?: number;
  attendees?: Array<{name: string, email: string, status: string}>;
  reminders?: number[];
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.insert(calendarEvents).values(data);
  return result;
}

export async function updateCalendarEvent(id: number, data: Partial<{
  title: string;
  description: string;
  location: string;
  meetingLink: string;
  startTime: Date;
  endTime: Date;
  status: "confirmed" | "tentative" | "cancelled";
  notes: string;
  outcome: string;
}>) {
  const db = await getDb();
  if (!db) return null;
  
  return db.update(calendarEvents)
    .set(data)
    .where(eq(calendarEvents.id, id));
}

export async function deleteCalendarEvent(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  return db.delete(calendarEvents)
    .where(eq(calendarEvents.id, id));
}

// Follow-up reminders
export async function getFollowUpReminders(userId: number, filters?: {
  status?: "pending" | "completed" | "snoozed" | "cancelled";
  targetType?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  priority?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(followUpReminders)
    .where(eq(followUpReminders.userId, userId))
    .$dynamic();
  
  if (filters?.status) {
    query = query.where(eq(followUpReminders.status, filters.status));
  }
  if (filters?.targetType) {
    query = query.where(eq(followUpReminders.targetType, filters.targetType as any));
  }
  if (filters?.dueBefore) {
    query = query.where(lte(followUpReminders.dueDate, filters.dueBefore));
  }
  if (filters?.dueAfter) {
    query = query.where(gte(followUpReminders.dueDate, filters.dueAfter));
  }
  if (filters?.priority) {
    query = query.where(eq(followUpReminders.priority, filters.priority as any));
  }
  
  return query.orderBy(followUpReminders.dueDate).limit(filters?.limit || 50);
}

export async function createFollowUpReminder(data: {
  userId: number;
  targetType: "family_office" | "contact" | "deal" | "relationship";
  targetId: number;
  targetName?: string;
  title: string;
  notes?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate: Date;
  reminderTime?: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.insert(followUpReminders).values(data);
  return result;
}

export async function updateFollowUpReminder(id: number, data: Partial<{
  title: string;
  notes: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: Date;
  reminderTime: Date;
  status: "pending" | "completed" | "snoozed" | "cancelled";
  completedAt: Date;
  snoozedUntil: Date;
  snoozeCount: number;
}>) {
  const db = await getDb();
  if (!db) return null;
  
  return db.update(followUpReminders)
    .set(data)
    .where(eq(followUpReminders.id, id));
}

// ============================================================================
// DEAL FLOW ANALYTICS
// ============================================================================

export async function getDealAnalytics(userId: number, filters?: {
  periodType?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(dealAnalytics)
    .where(eq(dealAnalytics.userId, userId))
    .$dynamic();
  
  if (filters?.periodType) {
    query = query.where(eq(dealAnalytics.periodType, filters.periodType));
  }
  if (filters?.startDate) {
    query = query.where(gte(dealAnalytics.periodStart, filters.startDate));
  }
  if (filters?.endDate) {
    query = query.where(lte(dealAnalytics.periodEnd, filters.endDate));
  }
  
  return query.orderBy(desc(dealAnalytics.periodStart)).limit(filters?.limit || 12);
}

export async function createDealAnalytics(data: {
  userId: number;
  periodType: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  periodStart: Date;
  periodEnd: Date;
  totalDeals?: number;
  newDeals?: number;
  closedDeals?: number;
  lostDeals?: number;
  totalPipelineValue?: string;
  closedValue?: string;
  lostValue?: string;
  conversionRate?: string;
  avgDealCycleTime?: number;
  avgDealSize?: string;
  dealsBySource?: Record<string, number>;
  valueBySource?: Record<string, number>;
  dealsByStage?: Record<string, number>;
  valueByStage?: Record<string, number>;
  dealsByFOType?: Record<string, number>;
  conversionByFOType?: Record<string, number>;
  topRelationshipSources?: Array<{id: number, name: string, deals: number, value: number}>;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const [result] = await db.insert(dealAnalytics).values(data);
  return result;
}

export async function getConversionFunnels(userId: number, periodStart: Date, periodEnd: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(conversionFunnels)
    .where(and(
      eq(conversionFunnels.userId, userId),
      gte(conversionFunnels.periodStart, periodStart),
      lte(conversionFunnels.periodEnd, periodEnd)
    ))
    .orderBy(conversionFunnels.stageOrder);
}

// Calculate real-time analytics from deals
export async function calculateDealAnalytics(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get all deals for user (where they are the originator)
  const userDeals = await db.select().from(deals)
    .where(eq(deals.originatorId, userId));
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Calculate metrics
  const totalDeals = userDeals.length;
  const closedDeals = userDeals.filter(d => d.stage === 'completed').length;
  const lostDeals = userDeals.filter(d => d.stage === 'cancelled').length;
  const activeDeals = userDeals.filter(d => !['completed', 'cancelled'].includes(d.stage || '')).length;
  
  const totalPipelineValue = userDeals
    .filter(d => !['completed', 'cancelled'].includes(d.stage || ''))
    .reduce((sum, d) => sum + Number(d.dealValue || 0), 0);
  
  const closedValue = userDeals
    .filter(d => d.stage === 'completed')
    .reduce((sum, d) => sum + Number(d.dealValue || 0), 0);
  
  const conversionRate = totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0;
  
  // Calculate average deal cycle time for closed deals
  const closedDealsWithDates = userDeals.filter(d => 
    d.stage === 'completed' && d.createdAt && d.updatedAt
  );
  const avgCycleTime = closedDealsWithDates.length > 0
    ? closedDealsWithDates.reduce((sum, d) => {
        const created = new Date(d.createdAt).getTime();
        const updated = new Date(d.updatedAt).getTime();
        return sum + (updated - created) / (1000 * 60 * 60 * 24);
      }, 0) / closedDealsWithDates.length
    : 0;
  
  // Deals by stage
  const dealsByStage: Record<string, number> = {};
  userDeals.forEach(d => {
    const stage = d.stage || 'unknown';
    dealsByStage[stage] = (dealsByStage[stage] || 0) + 1;
  });
  
  return {
    totalDeals,
    activeDeals,
    closedDeals,
    lostDeals,
    totalPipelineValue,
    closedValue,
    conversionRate: conversionRate.toFixed(1),
    avgDealCycleTime: Math.round(avgCycleTime),
    dealsByStage,
    recentDeals: userDeals.filter(d => new Date(d.createdAt) >= thirtyDaysAgo).length
  };
}

// Get meeting history with a target
export async function getMeetingHistory(userId: number, targetId: number, targetType: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(calendarEvents)
    .where(and(
      eq(calendarEvents.userId, userId),
      eq(calendarEvents.relatedTargetId, targetId)
    ))
    .orderBy(desc(calendarEvents.startTime))
    .limit(20);
}
