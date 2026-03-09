// client/src/lib/copy.ts
// Single source of truth for all whitepaper-aligned platform language.
// Import from here — never write custody/attribution/trust copy inline.

export const PLATFORM = {
  tagline: "The Private Market Operating System",
  thesis: "If Bloomberg runs public markets, ANAVI will run private ones.",
  market: "$13 trillion private market",
} as const;

export const PROBLEMS = {
  brokerChain: {
    stat: "5–15",
    headline: "Intermediaries Per Deal",
    body: "5 to 15 intermediaries per deal. Each extracting 1–5%. The originator — the person whose relationship made the deal possible — receives no attribution, no compounding value, and no protection if they're cut out.",
  },
  fraud: {
    stat: "$40B",
    headline: "Annual Fraud Losses",
    body: "$10 to $40 billion in annual US investment fraud losses. Because identity verification across private markets is fragmented, unshared, and trivially forged. Everyone runs their own checks. No one shares the results.",
  },
  dueDiligence: {
    stat: "$500K",
    headline: "Duplicated Per Deal",
    body: "$50,000 to $500,000 per deal in duplicated compliance costs. Every investor in the chain runs the same KYC, the same OFAC screen, the same accreditation check — independently, expensively, and without coordination.",
  },
} as const;

export const PERSONAS = {
  originator: {
    label: "Deal Originator / Broker",
    role: "Relationship Holder",
    problem: "My introductions close deals I never get credit for.",
    answer:
      "Custody your relationships. Timestamp your introductions. Collect your attribution.",
    tourPitch:
      "You made 847 introductions last year. ANAVI would have attributed every one.",
  },
  investor: {
    label: "Investor / Family Office",
    role: "Capital Deployer",
    problem: "I can't tell which deals are real or who's already seen them.",
    answer:
      "Verified counterparties. Blind matching. Mutual consent before any disclosure.",
    tourPitch:
      "You reviewed 40 deals. ANAVI would have verified every counterparty before you saw the first deck.",
  },
  principal: {
    label: "Principal / Asset Owner",
    role: "Supply Side",
    problem: "Raising capital means exposing my thesis before anyone commits.",
    answer: "Seal your asset. Match anonymously. Disclose only on consent.",
    tourPitch:
      "You raised $30M. ANAVI protected your thesis until the moment you chose to disclose it.",
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

export const TOUR = {
  trustScore: {
    title: "Your Trust Score",
    body: "A dynamic credential built from KYB verification depth, transaction history, dispute resolution outcomes, and peer attestations. It determines your access tier, your whitelist status, and whether counterparties transact with you.",
  },
  relationships: {
    originator: {
      title: "Custody Your Relationship",
      body: "Click to timestamp this introduction with a cryptographic custody hash — immutable proof of when you made it. If this relationship produces a deal in three years, this record is your attribution claim.",
    },
    investor: {
      title: "Protect Your Counterparty",
      body: "Click to custody a counterparty relationship. Every counterparty you protect has passed KYB verification, OFAC screening, and accreditation confirmation — and every disclosure is logged permanently.",
    },
    principal: {
      title: "Seal Your Register",
      body: "Click to seal this relationship. Counterparties know a qualified party exists — nothing is disclosed until mutual consent is established, and every disclosure is cryptographically logged.",
    },
  },
  blindMatch: {
    title: "Blind Match",
    body: "A qualified counterparty has been matched to your intent. Their identity, firm, and terms remain sealed. ANAVI's matching engine operates on anonymized attributes — the platform cannot see unencrypted details until both parties authorize disclosure.",
  },
  dealRoom: {
    title: "Deal Room",
    body: "NDA executed. Immutable audit trail initiated. Every document access, version change, and signature event is cryptographically logged. This record is the basis for originator attribution, payout calculation, and regulatory compliance.",
  },
  attribution: {
    originator: {
      title: "Attribution & Payout",
      body: "Your introduction. $47M Riyadh Solar JV. Originator share: 2.5% — $1.175M — calculated automatically from the closing ledger. Triggered on milestone. No negotiation. No intermediary.",
    },
    investor: {
      title: "Attribution & Payout",
      body: "Your capital deployed across 3 verified SPVs. Every subsequent deal from this relationship credits your participation — compounding attribution over time.",
    },
    principal: {
      title: "Escrow Milestone",
      body: "Milestone reached: $12M of $30M committed. Funds release triggered automatically. Your operator economics, protected and automated.",
    },
  },
  compliance: {
    title: "Compliance Passport",
    body: "This counterparty's compliance passport — KYB verified, OFAC clean, accredited status confirmed — travels with every transaction they execute on ANAVI. You access their verification record. You don't duplicate it. $500,000 in due diligence costs, shared.",
  },
  close: {
    headline: "The Private Market Operating System.",
    subhead:
      "Every relationship custodied. Every introduction attributed. Every deal closed on infrastructure purpose-built for the $13 trillion private market.",
    cta: {
      title: "Apply for Access",
      body: "You have seen the full picture: relationships protected, matches found, deal rooms secured, payouts automated. What would your relationships be worth if they were protected like this?",
    },
  },
} as const;

export const CUSTODY_RECEIPT = {
  title: "Introduction Custodied.",
  body: "This introduction is now timestamped, cryptographically signed, and permanently attributed to you. If this relationship produces a deal — today or in five years — this record is your claim.",
  cta: "View Your Custody Register",
} as const;

/** Six-module navigation section labels. */
export const MODULES = {
  overview: "OVERVIEW",
  trustIdentity: "TRUST & IDENTITY",
  relationships: "RELATIONSHIPS",
  deals: "DEALS",
  economics: "ECONOMICS",
  intelligence: "INTELLIGENCE",
  settings: "SETTINGS",
} as const;

export const PERSONA_NAV = {
  originator: {
    exclusive: [
      "Custody Register",
      "Attribution Ledger",
      "Introduction Pipeline",
    ],
    routes: ["/custody", "/attribution", "/pipeline"],
  },
  investor: {
    exclusive: ["Deal Flow", "Portfolio", "Counterparty Intelligence"],
    routes: ["/deal-flow", "/portfolio", "/counterparty-intelligence"],
  },
  principal: {
    exclusive: ["Asset Register", "Demand Room", "Close Tracker"],
    routes: ["/assets", "/demand", "/close"],
  },
} as const;

/** Notification type labels shown on activity feed badges. */
export const NOTIFICATIONS = {
  matchFound: { label: "MATCH" },
  dealUpdate: { label: "DEAL ROOM" },
  payoutReceived: { label: "ATTRIBUTION" },
  complianceAlert: { label: "VERIFICATION" },
  system: { label: "SYSTEM" },
} as const;

/** Toast messages triggered by dashboard CTA clicks. */
export const TOASTS = {
  navigatingRelationships: "Opening Relationship Custody",
  navigatingDealMatching: "Opening Blind Matching",
} as const;

/**
 * KYB / Compliance market data — sourced stats for UI copy.
 * Sources: PwC, LSEG Risk Intelligence, PYMNTS, BrightDefense, Gitnux, ComplyCube, FigsFlow (2025–2026).
 */
export const COMPLIANCE_MARKET = {
  globalComplianceSpend: {
    value: "$271B",
    label: "Global Compliance Spend",
    detail: "Annual compliance costs across financial institutions worldwide",
    source: "Gitnux Compliance Statistics 2026",
  },
  identityVerificationLoss: {
    value: "$34B",
    label: "Lost to Inefficient KYC/KYB",
    detail:
      "Annual losses from legacy identity verification — friction, false positives, and missed conversions",
    source: "PYMNTS 2026",
  },
  duplicatedDueDiligence: {
    value: "$500K",
    label: "Duplicated Per Deal",
    detail:
      "Every investor in the chain runs the same KYC, OFAC, and accreditation checks — independently and without coordination",
    source: "ANAVI White Paper",
  },
  costPerCheck: {
    value: "$3–$19",
    label: "Per Compliance Check",
    detail: "Range per KYC/KYB check depending on provider and service tier",
    source: "FigsFlow 2026",
  },
  budgetIncreasing: {
    value: "87%",
    label: "Expect Budget Increases",
    detail:
      "Of organizations anticipate enhanced due diligence budget increases, averaging 5.2% YoY growth",
    source: "LSEG Risk Intelligence",
  },
  techSpendGrowing: {
    value: "82%",
    label: "Increasing Compliance Tech Spend",
    detail:
      "Of financial firms plan to increase investment in compliance technology",
    source: "BrightDefense 2026",
  },
  processComplexity: {
    value: "85%",
    label: "Say Compliance Is More Complex",
    detail:
      "Of compliance teams report processes have become more complex over the past three years",
    source: "PwC via ComplyCube",
  },
  subscriptionWaste: {
    value: "30–60%",
    label: "Subscription Capacity Wasted",
    detail:
      "Of paid compliance capacity wasted when onboarding volume fluctuates",
    source: "FigsFlow 2026",
  },
} as const;

/** Duna-inspired KYB value propositions mapped to ANAVI's Compliance Passport. */
export const KYB_VALUE = {
  headline: "Compliance that compounds, not duplicates.",
  subhead:
    "Every counterparty on ANAVI carries a Compliance Passport — KYB verified, sanctions screened, accredited. You access the result. You don't repeat the work.",
  pillars: [
    {
      metric: "10x",
      label: "Faster Onboarding",
      detail:
        "Pre-verified counterparties eliminate weeks of back-and-forth. Match, verify once, transact repeatedly.",
    },
    {
      metric: "87%",
      label: "Cost Reduction",
      detail:
        "Shared compliance passports eliminate $50K–$500K in duplicated due diligence per deal.",
    },
    {
      metric: "100%",
      label: "Audit Trail Coverage",
      detail:
        "Every check, every decision, every policy change — cryptographically logged and immutable.",
    },
  ],
  modules: [
    {
      id: "kyb",
      label: "KYB Verification",
      desc: "Entity verification, UBO discovery, corporate structure mapping",
    },
    {
      id: "sanctions",
      label: "Sanctions Screening",
      desc: "OFAC, EU, UN — daily perpetual monitoring",
    },
    {
      id: "pep",
      label: "PEP & Adverse Media",
      desc: "Politically exposed persons and negative news monitoring",
    },
    {
      id: "aml",
      label: "AML Screening",
      desc: "Anti-money laundering transaction pattern analysis",
    },
    {
      id: "accreditation",
      label: "Accreditation",
      desc: "Investor accreditation status and qualified purchaser confirmation",
    },
    {
      id: "jurisdiction",
      label: "Jurisdiction Check",
      desc: "Regulatory compliance by region and cross-border eligibility",
    },
    {
      id: "idv",
      label: "ID Verification",
      desc: "Document verification and biometric confirmation for representatives",
    },
    {
      id: "legal",
      label: "Legal & Contracting",
      desc: "NDA execution, terms acceptance, electronic signature",
    },
  ],
} as const;

/** Dashboard widget titles, labels, and CTAs. */
export const DASHBOARD = {
  trustScore: {
    title: "Trust Score",
    scoreChange: (delta: number) =>
      `${delta > 0 ? "+" : ""}${delta} this month`,
    whitelistStatus: "Whitelist",
    compoundNature:
      "Your score compounds with every verified transaction and peer attestation.",
    breakdownCta: "Click to view breakdown →",
  },
  marketDepth: {
    title: "Market Depth",
    buyersLabel: "Buyers",
    sellersLabel: "Sellers",
  },
  blindMatches: {
    title: "Blind Matches",
    sealedStatus: "Sealed",
    noMatches: "No matches yet. Express an intent to activate matching.",
  },
  dealRooms: {
    title: "Deal Rooms",
    documents: "Documents:",
    auditEvents: "Audit Events:",
    immutableAuditTrail: "Immutable audit trail & document versioning active",
    escrowLabel: "Escrow",
    enterCta: "Enter Deal Room →",
    noDealRooms: "No deal rooms yet. Accept a match to open a deal room.",
  },
  complianceStatus: {
    title: "Compliance Status",
    passportSummary: "Compliance Passport",
    kybStatus: "KYB",
    ofacStatus: "OFAC",
    amlStatus: "AML",
    viewPassportCta: "View Passport",
    badgeRequired: "Required",
    noPendingActions: "All compliance requirements met.",
  },
  payouts: {
    title: "Economics Engine",
    nextPayoutLabel: "Next Payout:",
    lifetimeAttribution: "Lifetime Attribution Value:",
    originationShare: "Originator Share:",
    noPayouts: "No payouts yet. Close a deal to trigger attribution.",
  },
  activeIntents: {
    title: "Your Active Intents",
    manageCta: "Manage Intents",
    noIntents: "No active intents. Visit Blind Matching to express an intent.",
  },
  custodiedRelationships: {
    title: "Relationship Custody",
    custodyAge: "Custodied:",
    attributionCue: "Cryptographic timestamps ensure forever attribution",
    protectCta: "Protect a Relationship",
    viewRegisterCta: "View Custody Register",
    noRelationships:
      "No custodied relationships yet. Protect your first introduction.",
  },
} as const;

/**
 * Hero typewriter copy — cycles investor -> broker -> whitepaper language.
 * Derived from PERSONAS, PLATFORM, and TOUR constants above.
 */
export const HERO_TYPEWRITER = [
  "Prove deal flow quality. Match GPs to LPs with 94% accuracy.",
  "Cut $34B in KYC/KYB friction. 10x faster onboarding.",
  "Verified counterparties before you see the first deck.",
  "Your introductions. Your attribution. Your economics.",
  "847 intros last year — ANAVI would have attributed every one.",
  "Custody your relationships. Timestamp. Collect.",
  "Relationship Custody for the $13T private market.",
  "Blind Matching: intent-based, anonymized until consent.",
  "Trust Score-gated infrastructure from NDA to close.",
] as const;
