import { desc } from "drizzle-orm";
import { cryptoAssets } from "../../drizzle/schema";
import { getDb } from "./connection";

function toNum(v: string | null | undefined): number {
  if (v == null) return 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

export async function getCryptoAssets(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(cryptoAssets).orderBy(desc(cryptoAssets.createdAt)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    name: r.name,
    balance: toNum(r.balance),
    value: toNum(r.value),
    avgCost: r.avgCost ? String(r.avgCost) : undefined,
    currentPrice: r.currentPrice ?? undefined,
    pnl: r.pnl ?? undefined,
    pnlValue: r.pnlValue ?? undefined,
    allocation: r.allocation ?? undefined,
    type: r.type ?? "crypto",
  }));
}

export async function createCryptoAsset(data: {
  symbol: string;
  name: string;
  balance?: number;
  value?: number;
  avgCost?: number;
  currentPrice?: string;
  pnl?: string;
  pnlValue?: string;
  allocation?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cryptoAssets).values({
    symbol: data.symbol,
    name: data.name,
    balance: data.balance != null ? String(data.balance) : "0",
    value: data.value != null ? String(data.value) : "0",
    avgCost: data.avgCost != null ? String(data.avgCost) : null,
    currentPrice: data.currentPrice ?? null,
    pnl: data.pnl ?? null,
    pnlValue: data.pnlValue ?? null,
    allocation: data.allocation ?? null,
  });
  return result[0].insertId;
}
