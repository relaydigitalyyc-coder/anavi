import { eq, desc, and } from "drizzle-orm";
import { complianceChecks, deals } from "../../drizzle/schema";
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

/** Returns true if user has an active compliance block based on failed/flagged checks. */
export async function isUserComplianceBlocked(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(complianceChecks)
    .where(
      and(
        eq(complianceChecks.entityType, "user" as any),
        eq(complianceChecks.entityId, userId)
      )
    )
    .orderBy(desc(complianceChecks.createdAt));

  const now = Date.now();
  for (const r of rows) {
    const notExpired = !r.expiresAt || r.expiresAt.getTime() > now;
    if (!notExpired) continue;
    if (r.status === "failed") return true;
    if (r.status === "flagged" && (r.riskLevel === "high" || r.riskLevel === "critical")) return true;
  }
  return false;
}

/** Quick deal-level block check from deals.complianceStatus. */
export async function isDealComplianceBlocked(dealId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const row = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
  const d = row[0];
  return !!d && d.complianceStatus === "blocked";
}
