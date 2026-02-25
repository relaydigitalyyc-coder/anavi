import { eq, desc } from "drizzle-orm";
import { networkMembers } from "../../drizzle/schema";
import { getDb } from "./connection";

function toNum(v: string | null | undefined): number {
  if (v == null) return 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

export async function getNetworkMembers(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(networkMembers).orderBy(desc(networkMembers.createdAt)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    status: r.status ?? "pending",
    tier: r.tier ?? "basic",
    allocatedCapital: toNum(r.allocatedCapital),
    deployedCapital: toNum(r.deployedCapital),
    totalReturns: toNum(r.totalReturns),
    returnPercent: toNum(r.returnPercent),
    joinDate: r.joinDate ?? "",
    industry: r.industry ?? "",
    expertise: (r.expertise as string[]) ?? [],
    connections: (r.connections as string[]) ?? [],
    contributionScore: r.contributionScore ?? 0,
    referrals: r.referrals ?? 0,
    verified: r.verified ?? false,
  }));
}

export async function createNetworkMember(data: {
  name: string;
  email: string;
  status?: "pending" | "active";
  tier?: "basic" | "premium" | "partner";
  industry?: string;
  allocatedCapital?: number;
  expertise?: string[];
  connections?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(networkMembers).values({
    name: data.name,
    email: data.email,
    status: data.status ?? "pending",
    tier: data.tier ?? "basic",
    industry: data.industry ?? null,
    allocatedCapital: data.allocatedCapital != null ? String(data.allocatedCapital) : "0",
    expertise: data.expertise ?? null,
    connections: data.connections ?? null,
    joinDate: new Date().toISOString().slice(0, 10),
  });
  return result[0].insertId;
}
