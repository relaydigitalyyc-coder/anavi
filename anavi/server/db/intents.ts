import { eq, desc, and, sql } from "drizzle-orm";
import { intents } from "../../drizzle/schema";
import { getDb } from "./connection";

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

/** F17: Sector overview and market depth for Intelligence page. */
export async function getIntelligenceSectorOverview() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ assetType: intents.assetType, count: sql<number>`count(*)` })
    .from(intents)
    .where(eq(intents.status, "active"))
    .groupBy(intents.assetType);
  return rows
    .filter((r) => r.assetType)
    .map((r) => ({ sector: r.assetType!, count: Number(r.count) }))
    .sort((a, b) => b.count - a.count);
}

export async function getIntelligenceMarketDepth() {
  const db = await getDb();
  if (!db) return [];
  const all = await db.select({ intentType: intents.intentType, assetType: intents.assetType }).from(intents).where(eq(intents.status, "active"));
  const bySector: Record<string, { buyers: number; sellers: number }> = {};
  for (const r of all) {
    if (!r.assetType) continue;
    if (!bySector[r.assetType]) bySector[r.assetType] = { buyers: 0, sellers: 0 };
    if (r.intentType === "buy" || r.intentType === "invest") bySector[r.assetType].buyers += 1;
    else if (r.intentType === "sell") bySector[r.assetType].sellers += 1;
  }
  return Object.entries(bySector).map(([sector, v]) => ({ sector, ...v }));
}

export async function updateIntent(id: number, data: Partial<typeof intents.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(intents).set({ ...data, updatedAt: new Date() }).where(eq(intents.id, id));
}
