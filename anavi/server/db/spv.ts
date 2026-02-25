import { eq, desc } from "drizzle-orm";
import { spvs } from "../../drizzle/schema";
import { getDb } from "./connection";

export type CreateSPVInput = {
  name: string;
  legalName?: string;
  description?: string;
  entityType?: string;
  jurisdiction: string;
  investmentPurpose?: string;
  targetAssetClass?: string;
  targetIndustry?: string;
  targetRaise?: string;
  minimumInvestment?: string;
  maximumInvestment?: string;
  currency?: string;
  managementFee?: string;
  carriedInterest?: string;
  preferredReturn?: string;
  fundingDeadline?: string;
  investmentPeriodEnd?: string;
  termEndDate?: string;
  sponsorId: number;
};

const VALID_ENTITY = ["llc", "lp", "gp", "corp", "series_llc", "trust", "offshore"] as const;
const VALID_ASSET = ["real_estate", "private_equity", "venture_capital", "hedge_fund", "commodities", "infrastructure", "debt", "mixed", "other"] as const;

export async function createSPV(data: CreateSPVInput): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const entityType = VALID_ENTITY.includes((data.entityType ?? "llc") as typeof VALID_ENTITY[number])
    ? (data.entityType as typeof VALID_ENTITY[number])
    : "llc";
  const targetAssetClass = data.targetAssetClass && VALID_ASSET.includes(data.targetAssetClass as typeof VALID_ASSET[number])
    ? (data.targetAssetClass as typeof VALID_ASSET[number])
    : null;
  const result = await db.insert(spvs).values({
    name: data.name,
    legalName: data.legalName ?? data.name,
    description: data.description ?? null,
    entityType,
    jurisdiction: data.jurisdiction,
    investmentPurpose: data.investmentPurpose ?? null,
    targetAssetClass,
    targetIndustry: data.targetIndustry ?? null,
    targetRaise: data.targetRaise ? String(data.targetRaise) : null,
    minimumInvestment: data.minimumInvestment ? String(data.minimumInvestment) : null,
    maximumInvestment: data.maximumInvestment ? String(data.maximumInvestment) : null,
    currency: data.currency ?? "USD",
    managementFee: data.managementFee ? String(data.managementFee) : null,
    carriedInterest: data.carriedInterest ? String(data.carriedInterest) : null,
    preferredReturn: data.preferredReturn ? String(data.preferredReturn) : null,
    fundingDeadline: data.fundingDeadline ? new Date(data.fundingDeadline) : null,
    investmentPeriodEnd: data.investmentPeriodEnd ? new Date(data.investmentPeriodEnd) : null,
    termEndDate: data.termEndDate ? new Date(data.termEndDate) : null,
    sponsorId: data.sponsorId,
    status: "formation",
  });
  return result[0].insertId;
}

export async function getSPVsBySponsor(sponsorId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(spvs)
    .where(eq(spvs.sponsorId, sponsorId))
    .orderBy(desc(spvs.createdAt))
    .limit(limit);
}

export async function getAllSPVs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(spvs).orderBy(desc(spvs.createdAt)).limit(limit);
}
