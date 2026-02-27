// client/src/lib/demoFixtures.ts
// Whitepaper-aligned fixture data for the three demo personas.
// These mirror the tRPC response shapes used by each page.
// Keep in sync if real router output types change.

import type { PersonaKey } from "@/lib/copy";

export const DEMO_FIXTURES = {
  originator: {
    intents: [
      { id: 1, type: "sell" as const, assetClass: "Commodities", size: "$10M – $15M" },
      { id: 2, type: "sell" as const, assetClass: "Infrastructure", size: "$40M – $50M" },
    ],
    user: {
      id: "demo-originator",
      name: "Alex Mercer",
      email: "alex@mercercapital.com",
      trustScore: 78,
      tier: "enhanced" as const,
      kybStatus: "verified" as const,
      onboardingCompleted: true,
      relationshipCount: 4,
    },
    relationships: [
      { id: 1, name: "Ahmad Al-Rashid", company: "Gulf Sovereign Wealth Fund", trustScore: 91, custodyAge: "14 months", attributionStatus: "active", hash: "0x7f3a...c12e", assetClass: "Infrastructure" },
      { id: 2, name: "Sarah Chen", company: "Pacific Family Office", trustScore: 88, custodyAge: "8 months", attributionStatus: "active", hash: "0x2b9d...4f7a", assetClass: "Private Equity" },
      { id: 3, name: "Meridian Group", company: "Private Equity", trustScore: 76, custodyAge: "3 months", attributionStatus: "pending", hash: "0x9e1c...8b3d", assetClass: "Real Estate" },
      { id: 4, name: "Delta Capital", company: "Hedge Fund", trustScore: 62, custodyAge: "1 month", attributionStatus: "pending", hash: "0x4a7f...2e9c", assetClass: "Commodities" },
    ],
    matches: [
      { id: 1, tag: "Qualified buyer for Gulf Coast refinery (EN590, 50,000 MT)", compatibilityScore: 94, sealed: true, assetClass: "Commodities", dealSize: "$12M", status: "pending_consent" },
      { id: 2, tag: "Investor match for Riyadh Solar JV ($47M, Stage 2)", compatibilityScore: 88, sealed: true, assetClass: "Infrastructure", dealSize: "$47M", status: "pending_consent" },
    ],
    dealRooms: [
      { id: 1, name: "Riyadh Solar JV", stage: "diligence", ndaStatus: "executed", escrowProgress: 40, escrowCurrent: 12000000, escrowTarget: 30000000, auditEvents: 47, documentCount: 3, counterparty: "Sealed — Institutional Allocator, Trust 91" },
    ],
    notifications: [
      { id: 1, type: "match_found", message: "Match found: Ahmad Al-Rashid introduction has a qualified counterparty", time: "2 hours ago" },
      { id: 2, type: "payout_received", message: "Attribution credit: $1.175M origination fee triggered on Riyadh Solar close", time: "Yesterday" },
      { id: 3, type: "compliance_alert", message: "KYB verification upgrade available — unlock Tier 3 access", time: "3 days ago" },
    ],
    payouts: [
      { id: 1, deal: "Riyadh Solar JV", amount: 1175000, status: "triggered", originatorShare: 2.5, closingDate: "2026-02-18" },
      { id: 2, deal: "Gulf Coast Refinery", amount: 240000, status: "pending", originatorShare: 2.0, closingDate: null },
    ],
  },

  investor: {
    intents: [
      { id: 1, type: "buy" as const, assetClass: "Infrastructure", size: "$30M – $100M" },
      { id: 2, type: "buy" as const, assetClass: "Commodities", size: "$10M – $20M" },
    ],
    user: {
      id: "demo-investor",
      name: "Pacific Capital Partners",
      email: "invest@pacificcapital.com",
      trustScore: 91,
      tier: "institutional" as const,
      kybStatus: "verified" as const,
      onboardingCompleted: true,
      aum: "$340M",
    },
    relationships: [
      { id: 1, name: "Verified Operator A", company: "[Sealed — Solar Infrastructure]", trustScore: 88, custodyAge: "Active", attributionStatus: "active", hash: "0x1a2b...3c4d", assetClass: "Infrastructure" },
      { id: 2, name: "Verified Operator B", company: "[Sealed — Gulf Coast Commodity]", trustScore: 82, custodyAge: "Active", attributionStatus: "active", hash: "0x5e6f...7g8h", assetClass: "Commodities" },
    ],
    matches: [
      { id: 1, tag: "Solar Infrastructure — $30M+ raise, Stage 2 ready", compatibilityScore: 96, sealed: true, assetClass: "Infrastructure", dealSize: "$47M", status: "pending_consent" },
      { id: 2, tag: "Gulf Coast Commodity Play — EN590, 50,000 MT", compatibilityScore: 91, sealed: true, assetClass: "Commodities", dealSize: "$12M", status: "pending_consent" },
      { id: 3, tag: "PropTech Series B — Enterprise SaaS", compatibilityScore: 84, sealed: true, assetClass: "Private Equity", dealSize: "$8M", status: "pending_consent" },
      { id: 4, tag: "Infrastructure Debt — 7% yield, 5-year", compatibilityScore: 79, sealed: true, assetClass: "Infrastructure", dealSize: "$20M", status: "pending_consent" },
    ],
    dealRooms: [
      { id: 1, name: "Solar Infrastructure SPV", stage: "closing", ndaStatus: "executed", escrowProgress: 65, escrowCurrent: 2100000, escrowTarget: 3000000, auditEvents: 31, documentCount: 8, counterparty: "Meridian Renewables · Trust 91" },
    ],
    notifications: [
      { id: 1, type: "match_found", message: "4 new blind matches generated from your investment intent", time: "1 hour ago" },
      { id: 2, type: "deal_update", message: "NDA consent required: Solar Infrastructure SPV — deal room ready", time: "4 hours ago" },
      { id: 3, type: "payout_received", message: "Capital call: $450K due — Solar Infrastructure SPV", time: "2 days ago" },
    ],
    payouts: [
      { id: 1, deal: "Infrastructure Alpha SPV", amount: 2100000, status: "deployed", irr: 18.5, vintage: "2025" },
      { id: 2, deal: "Meridian Real Estate II", amount: 750000, status: "deployed", irr: 14.2, vintage: "2025" },
    ],
  },

  developer: {
    intents: [
      { id: 1, type: "sell" as const, assetClass: "Infrastructure", size: "$30M raise" },
    ],
    user: {
      id: "demo-developer",
      name: "Meridian Renewables",
      email: "raise@meridianrenewables.com",
      trustScore: 65,
      tier: "basic" as const,
      kybStatus: "verified" as const,
      onboardingCompleted: true,
      upgradePromptActive: true,
    },
    relationships: [
      { id: 1, name: "[Sealed — Institutional Allocator]", company: "Identity Protected", trustScore: 91, custodyAge: "Pending consent", attributionStatus: "pending", hash: "0x3f4g...5h6i", assetClass: "Infrastructure" },
      { id: 2, name: "[Sealed — Family Office]", company: "Identity Protected", trustScore: 85, custodyAge: "Pending consent", attributionStatus: "pending", hash: "0x7j8k...9l0m", assetClass: "Infrastructure" },
    ],
    matches: [
      { id: 1, tag: "Institutional Allocator — $100M+ deployment mandate, solar focus", compatibilityScore: 94, sealed: true, assetClass: "Infrastructure", dealSize: "$47M", status: "pending_consent" },
      { id: 2, tag: "Family Office — Direct deal mandate, renewable energy", compatibilityScore: 87, sealed: true, assetClass: "Infrastructure", dealSize: "$30M", status: "pending_consent" },
      { id: 3, tag: "PE Fund — Infrastructure debt + equity hybrid", compatibilityScore: 78, sealed: true, assetClass: "Infrastructure", dealSize: "$15M", status: "pending_consent" },
    ],
    dealRooms: [
      { id: 1, name: "Riyadh Solar JV — $30M Raise", stage: "fundraising", ndaStatus: "executed", escrowProgress: 40, escrowCurrent: 12000000, escrowTarget: 30000000, auditEvents: 47, documentCount: 5, counterparty: "3 qualified investors — identities sealed" },
    ],
    notifications: [
      { id: 1, type: "match_found", message: "3 qualified investors matched to your Riyadh Solar JV raise", time: "30 minutes ago" },
      { id: 2, type: "deal_update", message: "Escrow milestone reached: $12M of $30M committed", time: "Yesterday" },
      { id: 3, type: "compliance_alert", message: "Upgrade to Tier 2 to unlock direct investor introductions", time: "3 days ago" },
    ],
    payouts: [
      { id: 1, deal: "Riyadh Solar JV", amount: 30000000, status: "fundraising", escrowMilestone: 40, nextTrigger: "$18M committed" },
    ],
  },
} as const;

export type DemoFixtures = typeof DEMO_FIXTURES;
export type PersonaFixtures = DemoFixtures[PersonaKey];
