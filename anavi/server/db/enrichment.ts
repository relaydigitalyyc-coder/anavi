import { eq, desc, and } from "drizzle-orm";
import { dataEnrichmentLogs, enrichmentJobs, familyOffices } from "../../drizzle/schema";
import { getDb } from "./connection";
import { getFamilyOfficeById } from "./familyOffices";

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

export async function enrichFamilyOffice(id: number, data: Partial<typeof familyOffices.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const current = await getFamilyOfficeById(id);
  if (!current) throw new Error("Family office not found");
  
  await db.update(familyOffices)
    .set({ ...data, updatedAt: new Date(), lastVerified: new Date() })
    .where(eq(familyOffices.id, id));
  
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
