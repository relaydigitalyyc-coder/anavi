import { eq, desc } from "drizzle-orm";
import { tradingPositions } from "../../drizzle/schema";
import { getDb } from "./connection";

function toNum(v: string | null | undefined): number {
  if (v == null) return 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

export async function getTradingPositions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(tradingPositions)
    .where(eq(tradingPositions.userId, userId))
    .orderBy(desc(tradingPositions.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    asset: r.asset,
    type: r.type ?? "long",
    entry: toNum(r.entryPrice),
    current: toNum(r.currentPrice),
    quantity: toNum(r.quantity),
    pnl: toNum(r.pnl),
    pnlPercent: toNum(r.pnlPercent),
    status: r.status ?? "active",
  }));
}

export async function createTradingPosition(
  userId: number,
  data: {
    asset: string;
    type?: "long" | "short";
    entryPrice: number;
    currentPrice: number;
    quantity: number;
    pnl?: number;
    pnlPercent?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tradingPositions).values({
    userId,
    asset: data.asset,
    type: data.type ?? "long",
    entryPrice: String(data.entryPrice),
    currentPrice: String(data.currentPrice),
    quantity: String(data.quantity),
    pnl: data.pnl != null ? String(data.pnl) : null,
    pnlPercent: data.pnlPercent != null ? String(data.pnlPercent) : null,
    status: "active",
  });
  return result[0].insertId;
}
