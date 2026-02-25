import { eq } from "drizzle-orm";
import { escrowAccounts } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createEscrowAccount(data: typeof escrowAccounts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(escrowAccounts).values(data);
  return result[0].insertId;
}

export async function getEscrowAccountByDeal(dealId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(escrowAccounts)
    .where(eq(escrowAccounts.dealId, dealId))
    .limit(1);
  return result[0];
}

export async function updateEscrowAccount(id: number, data: Partial<typeof escrowAccounts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(escrowAccounts).set({ ...data, updatedAt: new Date() }).where(eq(escrowAccounts.id, id));
}
