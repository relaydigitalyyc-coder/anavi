// pages/demo/demoAdapter.ts
// Canonical demo adapter: bridges whitepaper-aligned Demo Fixtures to the
// demo experience types used by pages under `pages/demo/*`.
// This removes the duplicate demo context/data pipeline and unifies on
// `contexts/DemoContext` + `lib/demoFixtures` as the single source of truth.

import type { PersonaKey } from "@/lib/copy";
import type { DemoFixtures, DemoScenarioKey } from "@/lib/demoFixtures";

export type DemoPersona = Extract<PersonaKey, "originator" | "investor" | "principal">;

export interface DemoRelationship {
  id: string;
  name: string;
  company: string;
  type: string;
  sector: string;
  region?: string;
  dealRange?: string;
  verificationLevel?: number;
  custodyHash: string;
  registeredAt?: string;
  lastActivity?: string;
  earnings?: number;
  matchCount?: number;
  status: "active" | "pending" | "verified";
}

export interface DemoIntent {
  id: string | number;
  title?: string;
  type: "buy" | "sell" | "invest" | "raise";
  sector: string;
  dealSize: string;
  status?: "active" | "paused" | "matched";
  matchCount?: number;
  createdAt?: string;
  confidentiality?: "full" | "partial";
}

export interface DemoMatch {
  id: string | number;
  counterpartyAlias: string;
  intentTitle: string;
  compatibilityScore: number;
  sector: string;
  dealSize: string;
  status: "pending" | "interested" | "mutual_interest" | "deal_room_created" | string;
  matchedAt?: string;
  highlights?: string[];
}

export interface DemoDealRoom {
  id: string | number;
  title: string;
  counterparty: string;
  status: "nda_pending" | "active" | "diligence" | "completed" | string;
  dealValue?: string;
  documentsCount?: number;
  lastActivity?: string;
  createdAt?: string;
  participants?: number;
}

export interface DemoNotification {
  id: string | number;
  type: "match_found" | "deal_update" | "payout_received" | "compliance_alert" | "relationship_verified" | "system";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface DemoPayout {
  id: string | number;
  amount: string; // USD numeric string
  type: string;
  status: "completed" | "pending" | "processing";
  dealReference?: string;
  date?: string;
}

export interface DemoStats {
  trustScore: number;
  verificationTier: string;
  totalRelationships: number;
  activeIntents: number;
  totalMatches: number;
  activeDealRooms: number;
  lifetimeAttribution: string; // formatted currency
  pendingPayouts: string; // formatted currency
  nextPayout: string; // formatted currency
  monthlyTrend: number;
}

export interface DemoData {
  persona: DemoPersona;
  user: {
    name: string;
    email?: string;
    company?: string;
    role?: string;
    avatar?: string;
    joinedAt?: string;
  };
  relationships: DemoRelationship[];
  intents: DemoIntent[];
  matches: DemoMatch[];
  dealRooms: DemoDealRoom[];
  notifications: DemoNotification[];
  payouts: DemoPayout[];
  stats: DemoStats;
}

export const PERSONA_CARDS: {
  id: DemoPersona;
  name: string;
  role: string;
  company: string;
  icon: string;
  headline: string;
  stats: string[];
}[] = [
  {
    id: "originator",
    name: "Marcus Chen",
    role: "Deal Originator",
    company: "Chen & Partners Advisory",
    icon: "Handshake",
    headline:
      "Protects 47 relationships and has earned $3.2M in lifetime attribution across oil & gas, LNG, and refined products.",
    stats: ["Trust Score: 88", "$3.2M Attribution", "12 Active Matches"],
  },
  {
    id: "investor",
    name: "Sarah Mitchell",
    role: "Investor / Family Office",
    company: "Mitchell Family Capital",
    icon: "TrendingUp",
    headline:
      "CIO deploying $650M AUM with a focus on ready-to-build renewable energy across Europe and emerging markets.",
    stats: ["Trust Score: 76", "$650M AUM", "11 Matched Opportunities"],
  },
  {
    id: "principal",
    name: "Meridian Renewables",
    role: "Principal / Asset Owner",
    company: "Meridian Renewables",
    icon: "Building2",
    headline:
      "Raising $30M for Riyadh Solar JV — NDA executed and diligence in flight with 3 qualified investors.",
    stats: ["Trust Score: 65", "$30M Raise", "3 Active Investors"],
  },
];

function formatUSD(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function coerceAmount(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const clean = v.replace(/[$,]/g, "");
    const n = Number.parseFloat(clean);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function convertFixturesToDemoData(
  fixtures: DemoFixtures[PersonaKey],
  persona: DemoPersona,
  _scenario?: DemoScenarioKey
): DemoData {
  // Relationships
  const relationships: DemoRelationship[] = (fixtures.relationships ?? []).map((r: any) => ({
    id: String(r.id),
    name: String(r.name ?? r.company ?? "Counterparty"),
    company: String(r.company ?? ""),
    type: String(r.type ?? ""),
    sector: String(r.assetClass ?? r.sector ?? ""),
    region: (r as any).region,
    dealRange: (r as any).dealRange,
    verificationLevel: (r as any).verificationLevel,
    custodyHash: String(r.hash ?? r.custodyHash ?? ""),
    registeredAt: (r as any).registeredAt,
    lastActivity: (r as any).lastActivity,
    earnings: typeof (r as any).earnings === "number" ? (r as any).earnings : undefined,
    matchCount: typeof (r as any).matchCount === "number" ? (r as any).matchCount : undefined,
    status: (r as any).status ?? "active",
  }));

  // Intents
  const intents: DemoIntent[] = (fixtures.intents ?? []).map((i: any) => ({
    id: String(i.id),
    title: i.title ?? undefined,
    type: (i.type as any) ?? "buy",
    sector: String(i.assetClass ?? i.sector ?? ""),
    dealSize: String(i.size ?? i.dealSize ?? ""),
    status: (i as any).status,
  }));

  // Matches
  const matches: DemoMatch[] = (fixtures.matches ?? []).map((m: any) => ({
    id: String(m.id),
    counterpartyAlias: String(m.counterpartyAlias ?? m.tag ?? "Qualified Counterparty"),
    intentTitle: String(m.intentTitle ?? intents[0]?.title ?? intents[0]?.sector ?? "Intent"),
    compatibilityScore: Number(m.compatibilityScore ?? 0),
    sector: String(m.assetClass ?? m.sector ?? ""),
    dealSize: String(m.dealSize ?? m.size ?? ""),
    status: String(m.status ?? "pending"),
    matchedAt: (m as any).matchedAt,
    highlights: Array.isArray(m.highlights) ? m.highlights : undefined,
  }));

  // Deal Rooms
  const dealRooms: DemoDealRoom[] = (fixtures.dealRooms ?? []).map((d: any) => ({
    id: String(d.id),
    title: String(d.name ?? d.title ?? "Deal Room"),
    counterparty: String(d.counterparty ?? "Qualified Counterparty"),
    status: String(d.status ?? "active"),
    dealValue: (d as any).dealValue,
    documentsCount: (d as any).documentCount ?? (d as any).documentsCount,
    lastActivity: (d as any).lastActivity,
    createdAt: (d as any).createdAt,
    participants: (d as any).participants,
  }));

  // Notifications
  const notifications: DemoNotification[] = (fixtures.notifications ?? []).map((n: any, idx: number) => ({
    id: String(n.id ?? idx),
    type: (n.type as any) ?? "system",
    title: String(n.title ?? n.message ?? "Update"),
    message: String(n.message ?? n.title ?? ""),
    createdAt: String(n.createdAt ?? new Date().toISOString()),
    read: Boolean(n.read ?? false),
  }));

  // Payouts → normalize to { amount: string, status in [completed|pending|processing] }
  const payouts: DemoPayout[] = (fixtures.payouts ?? []).map((p: any, idx: number) => {
    const rawStatus = String(p.status ?? "pending");
    let status: DemoPayout["status"] = "pending";
    if (rawStatus === "completed" || rawStatus === "deployed") status = "completed";
    else if (rawStatus === "processing" || rawStatus === "closing") status = "processing";
    else status = "pending";
    return {
      id: String(p.id ?? idx),
      amount: String(coerceAmount(p.amount)),
      type: String(p.type ?? "referral_commission"),
      status,
      dealReference: (p as any).dealReference,
      date: (p as any).date,
    };
  });

  // Stats synthesis
  const trustScore = Number((fixtures as any).user?.trustScore ?? 60);
  const verificationTierRaw = String((fixtures as any).user?.tier ?? "basic");
  const verificationTier = verificationTierRaw === "institutional" ? "Tier 3 Institutional" : verificationTierRaw === "enhanced" ? "Tier 2 Enhanced" : "Tier 1 Basic";
  const totalRelationships = relationships.length;
  const activeIntents = intents.length;
  const totalMatches = matches.length;
  const activeDealRooms = dealRooms.filter((d) => d.status !== "completed").length;
  const completedSum = payouts.filter((p) => p.status === "completed").reduce((s, p) => s + coerceAmount(p.amount), 0);
  const pendingSum = payouts.filter((p) => p.status !== "completed").reduce((s, p) => s + coerceAmount(p.amount), 0);
  const nextPayout = payouts.find((p) => p.status !== "completed")?.amount ?? "0";

  const stats: DemoStats = {
    trustScore,
    verificationTier,
    totalRelationships,
    activeIntents,
    totalMatches,
    activeDealRooms,
    lifetimeAttribution: formatUSD(completedSum),
    pendingPayouts: formatUSD(pendingSum),
    nextPayout: formatUSD(coerceAmount(nextPayout)),
    monthlyTrend: 3,
  };

  return {
    persona,
    user: {
      name: String((fixtures as any).user?.name ?? "Demo User"),
      email: (fixtures as any).user?.email,
      company: (fixtures as any).user?.company,
      role: (fixtures as any).user?.role,
      avatar: (fixtures as any).user?.avatar,
      joinedAt: (fixtures as any).user?.joinedAt,
    },
    relationships,
    intents,
    matches,
    dealRooms,
    notifications,
    payouts,
    stats,
  };
}

