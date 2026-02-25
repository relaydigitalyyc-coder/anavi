import { eq, desc } from "drizzle-orm";
import { commodityListings } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getCommodityListings(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commodityListings).orderBy(desc(commodityListings.createdAt)).limit(limit);
}

export async function getCommodityListingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(commodityListings).where(eq(commodityListings.id, id)).limit(1);
  return rows[0];
}

export async function createCommodityListing(data: typeof commodityListings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(commodityListings).values(data);
  return result[0].insertId;
}
