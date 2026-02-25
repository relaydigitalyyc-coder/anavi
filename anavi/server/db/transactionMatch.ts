import { eq, desc } from "drizzle-orm";
import { transactionMatches } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getTransactionMatches(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactionMatches).orderBy(desc(transactionMatches.createdAt)).limit(limit);
}

export async function getTransactionMatchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(transactionMatches).where(eq(transactionMatches.id, id)).limit(1);
  return rows[0];
}
