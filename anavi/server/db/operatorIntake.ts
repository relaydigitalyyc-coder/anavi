import { eq, desc } from "drizzle-orm";
import { operatorIntakes } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createOperatorIntake(data: typeof operatorIntakes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(operatorIntakes).values(data);
  return result[0].insertId;
}

export async function getOperatorIntakes(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(operatorIntakes).orderBy(desc(operatorIntakes.createdAt)).limit(limit);
}

export async function getOperatorIntakeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(operatorIntakes).where(eq(operatorIntakes.id, id)).limit(1);
  return rows[0];
}
