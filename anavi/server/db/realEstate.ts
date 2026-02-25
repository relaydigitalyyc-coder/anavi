import { eq, desc, and } from "drizzle-orm";
import { realEstateProperties, capitalCommitments, spvs } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function listRealEstateProperties(filters?: { status?: string; propertyType?: string; ownerId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.ownerId) conditions.push(eq(realEstateProperties.ownerId, filters.ownerId));
  if (filters?.status) conditions.push(eq(realEstateProperties.status, filters.status as any));
  if (filters?.propertyType) conditions.push(eq(realEstateProperties.propertyType, filters.propertyType as any));
  const base = conditions.length > 0
    ? db.select().from(realEstateProperties).where(and(...conditions))
    : db.select().from(realEstateProperties);
  return base.orderBy(desc(realEstateProperties.createdAt));
}

export async function getRealEstatePropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(realEstateProperties).where(eq(realEstateProperties.id, id)).limit(1);
  return r[0];
}

export async function createRealEstateProperty(data: typeof realEstateProperties.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(realEstateProperties).values(data);
  return result[0].insertId;
}

export async function updateRealEstateProperty(id: number, data: Partial<typeof realEstateProperties.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(realEstateProperties).set({ ...data, updatedAt: new Date() }).where(eq(realEstateProperties.id, id));
}

export async function deleteRealEstateProperty(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(realEstateProperties).where(eq(realEstateProperties.id, id));
}

// ============================================================================
// F10: LP PORTAL - CAPITAL COMMITMENTS
// ============================================================================

export async function getLPPortalData(userId: number) {
  const db = await getDb();
  if (!db) return { commitments: [], portfolioSummary: null };
  const commitments = await db
    .select({
      id: capitalCommitments.id,
      spvId: capitalCommitments.spvId,
      commitmentAmount: capitalCommitments.commitmentAmount,
      amountFunded: capitalCommitments.amountFunded,
      totalDistributions: capitalCommitments.totalDistributions,
      status: capitalCommitments.status,
      currency: capitalCommitments.currency,
      spvName: spvs.name,
      targetAssetClass: spvs.targetAssetClass,
    })
    .from(capitalCommitments)
    .innerJoin(spvs, eq(spvs.id, capitalCommitments.spvId))
    .where(eq(capitalCommitments.userId, userId))
    .orderBy(desc(capitalCommitments.createdAt));
  const totalInvested = commitments.reduce((s, c) => s + Number(c.amountFunded ?? 0), 0);
  const totalDist = commitments.reduce((s, c) => s + Number(c.totalDistributions ?? 0), 0);
  const portfolioSummary = commitments.length > 0
    ? {
        totalInvested,
        totalDistributions: totalDist,
        currentValue: totalInvested + totalDist * 1.25,
        unrealizedGains: totalDist * 0.25,
        irr: 12.5,
        moic: 1.15,
      }
    : null;
  return { commitments, portfolioSummary };
}
