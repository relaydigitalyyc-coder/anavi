import { eq, desc, and, or, like, sql, isNotNull } from "drizzle-orm";
import {
  familyOffices, institutionalInvestors, brokerContacts,
  familyOfficeTargets, targetActivities, socialProfiles, newsItems,
} from "../../drizzle/schema";
import { getDb } from "./connection";

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
  
  const fo = await getFamilyOfficeById(familyOfficeId);
  if (!fo) throw new Error("Family office not found");
  
  const nameParts = contactData.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';
  
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
