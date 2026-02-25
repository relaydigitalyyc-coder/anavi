import { eq, desc, and } from "drizzle-orm";
import { complianceChecks } from "../../drizzle/schema";
import { getDb } from "./connection";

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
