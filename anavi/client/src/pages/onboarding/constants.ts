import {
  Handshake,
  TrendingUp,
  Building2,
  Landmark,
  Target,
} from "lucide-react";
import type { Persona, PersonaTile, StepDef } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "anavi_onboarding";

const PERSONAS: PersonaTile[] = [
  {
    id: "originator",
    label: "Deal Originator / Broker",
    icon: Handshake,
    description:
      "I source deals and introduce buyers to sellers. I want my relationships protected.",
  },
  {
    id: "investor",
    label: "Investor / Family Office",
    icon: TrendingUp,
    description:
      "I deploy capital into private deals. I want verified deal flow without public exposure.",
  },
  {
    id: "developer",
    label: "Project Developer",
    icon: Building2,
    description:
      "I develop projects and need qualified capital without tipping off competitors.",
  },
  {
    id: "allocator",
    label: "Institutional Allocator",
    icon: Landmark,
    description: "I manage a fund and deploy capital systematically at scale.",
  },
  {
    id: "acquirer",
    label: "Strategic Acquirer",
    icon: Target,
    description:
      "I'm a corporate acquirer seeking acquisition targets confidentially.",
  },
];

const STEPS: Record<Persona, StepDef[]> = {
  originator: [
    {
      name: "Identity",
      minutes: 3,
      benefit:
        "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims.",
    },
    {
      name: "Business Profile",
      minutes: 2,
      benefit:
        "Your deal profile enables AI matching against $13T in private market deal flow.",
    },
    {
      name: "First Relationship",
      minutes: 3,
      benefit:
        "Upload your first relationship. Receive a custody receipt — your timestamped, signed attribution claim.",
    },
    {
      name: "Upgrade Prompt",
      minutes: 2,
      benefit:
        "Tier 2 unlocks whitelist status: enhanced verification, priority matching, and institutional counterparty access.",
    },
    {
      name: "Dashboard Intro",
      minutes: 1,
      benefit:
        "Your operating system is ready. Every introduction you make from here is custodied.",
    },
  ],
  investor: [
    {
      name: "Identity",
      minutes: 3,
      benefit:
        "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims.",
    },
    {
      name: "Investment Profile",
      minutes: 4,
      benefit:
        "Defines your investment thesis. ANAVI's matching engine runs on this intent — anonymized, sealed, and matched against verified counterparties only.",
    },
    {
      name: "KYB / KYC",
      minutes: 4,
      benefit:
        "Your compliance passport. It travels with every deal you touch — so counterparties never have to run their own check on you.",
    },
    {
      name: "First Intent",
      minutes: 2,
      benefit:
        "Broadcast your investment intent to verified counterparties — anonymized until mutual consent.",
    },
    {
      name: "Market Depth",
      minutes: 1,
      benefit: "See the depth of opportunities waiting for your capital.",
    },
  ],
  developer: [
    {
      name: "Identity",
      minutes: 3,
      benefit:
        "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims.",
    },
    {
      name: "Project Profile",
      minutes: 4,
      benefit:
        "Your raise profile, sealed. Matched to qualified capital without disclosing your identity until you consent.",
    },
    {
      name: "Verification",
      minutes: 3,
      benefit:
        "KYB verified, OFAC clean, accredited confirmed — your compliance passport travels with every transaction.",
    },
    {
      name: "Capital Intent",
      minutes: 2,
      benefit:
        "Signal your raise to qualified investors — anonymous until you authorize disclosure.",
    },
    {
      name: "Blind Matching",
      minutes: 1,
      benefit:
        "Your thesis, protected until the moment you choose to disclose it.",
    },
  ],
  allocator: [
    {
      name: "Identity",
      minutes: 3,
      benefit:
        "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims.",
    },
    {
      name: "Fund Profile",
      minutes: 4,
      benefit:
        "Your fund mandate drives systematic deal matching against verified counterparties only.",
    },
    {
      name: "Compliance",
      minutes: 4,
      benefit:
        "Your compliance passport enables institutional-grade deal flow without duplicated due diligence.",
    },
    {
      name: "First Allocation",
      minutes: 2,
      benefit:
        "Define your first allocation target — matched against verified operators, blind until consent.",
    },
    {
      name: "Pipeline Preview",
      minutes: 1,
      benefit: "See the institutional pipeline awaiting your capital.",
    },
  ],
  acquirer: [
    {
      name: "Identity",
      minutes: 3,
      benefit:
        "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims.",
    },
    {
      name: "Acquisition Profile",
      minutes: 4,
      benefit:
        "Define your acquisition thesis for confidential matching — your intent stays sealed until mutual consent.",
    },
    {
      name: "Due Diligence",
      minutes: 3,
      benefit:
        "Pre-configure your compliance requirements. Share them once — access them everywhere on ANAVI.",
    },
    {
      name: "First Target Intent",
      minutes: 2,
      benefit:
        "Signal your acquisition interest to verified sellers — anonymized until both parties consent.",
    },
    {
      name: "Target Pipeline",
      minutes: 1,
      benefit:
        "Preview acquisition targets matching your criteria — every counterparty pre-verified.",
    },
  ],
};

const VERTICALS = [
  "Oil & Gas",
  "Gold / Mining",
  "Solar / Renewable",
  "Real Estate",
  "M&A",
  "Infrastructure",
  "Other",
];
const ASSET_TYPES = [
  "Real Estate",
  "Private Equity",
  "Private Credit",
  "Commodities",
  "Infrastructure",
  "Venture Capital",
  "Digital Assets",
];
const GEOGRAPHIES = [
  "North America",
  "Europe",
  "Middle East",
  "Asia Pacific",
  "Latin America",
  "Africa",
];
const DEAL_STAGES = ["RTB (Ready to Build)", "Development", "Operating"];
const DEAL_SIZES = [
  "< $1M",
  "$1M - $5M",
  "$5M - $25M",
  "$25M - $100M",
  "$100M - $500M",
  "$500M+",
];
const BUSINESS_STRUCTURES = [
  "Sole Proprietor",
  "LLC",
  "Corporation",
  "Partnership",
  "Trust",
  "Other",
];
const PROJECT_TYPES = [
  "Solar Farm",
  "Wind Farm",
  "Real Estate Development",
  "Mining Operation",
  "Infrastructure",
  "Mixed Use",
  "Other",
];
const DEV_STAGES = [
  "Pre-Permit",
  "Permitted",
  "Shovel-Ready",
  "Under Construction",
  "Operational",
];
const DEAL_STRUCTURES = ["Equity", "Debt", "Joint Venture", "Hybrid"];
const TIMELINES = [
  "< 6 months",
  "6-12 months",
  "1-2 years",
  "2-5 years",
  "5+ years",
];
const FUND_STRATEGIES = [
  "Value",
  "Growth",
  "Income",
  "Opportunistic",
  "Core",
  "Core-Plus",
];
const REVENUE_RANGES = [
  "< $5M",
  "$5M - $25M",
  "$25M - $100M",
  "$100M - $500M",
  "$500M+",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadProgress(): {
  persona: Persona | null;
  step: number;
  formData: Record<string, unknown>;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { persona: null, step: 0, formData: {} };
}

function saveProgress(
  persona: Persona | null,
  step: number,
  formData: Record<string, unknown>
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ persona, step, formData })
  );
}

export {
  STORAGE_KEY,
  PERSONAS,
  STEPS,
  VERTICALS,
  ASSET_TYPES,
  GEOGRAPHIES,
  DEAL_STAGES,
  DEAL_SIZES,
  BUSINESS_STRUCTURES,
  PROJECT_TYPES,
  DEV_STAGES,
  DEAL_STRUCTURES,
  TIMELINES,
  FUND_STRATEGIES,
  REVENUE_RANGES,
  loadProgress,
  saveProgress,
};