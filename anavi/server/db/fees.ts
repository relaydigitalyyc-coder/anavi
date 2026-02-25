import { desc } from "drizzle-orm";
import { feeCollections } from "../../drizzle/schema";
import { getDb } from "./connection";

function toNum(v: string | null | undefined): number {
  if (v == null) return 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

export async function getFeeCollections(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(feeCollections)
    .orderBy(desc(feeCollections.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    source: r.source ?? "",
    amount: toNum(r.amount),
    date: r.date ?? "",
    status: r.status ?? "pending",
  }));
}

export async function createFeeCollection(data: {
  type: string;
  source?: string;
  amount: number;
  date?: string;
  status?: "pending" | "collected";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(feeCollections).values({
    type: data.type,
    source: data.source ?? null,
    amount: String(data.amount),
    date: data.date ?? null,
    status: data.status ?? "pending",
  });
  return result[0].insertId;
}
