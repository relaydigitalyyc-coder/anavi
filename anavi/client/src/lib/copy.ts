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
    answer: "Custody your relationships. Timestamp your introductions. Collect your attribution.",
    tourPitch: "You made 847 introductions last year. ANAVI would have attributed every one.",
  },
  investor: {
    label: "Investor / Family Office",
    role: "Capital Deployer",
    problem: "I can't tell which deals are real or who's already seen them.",
    answer: "Verified counterparties. Blind matching. Mutual consent before any disclosure.",
    tourPitch: "You reviewed 40 deals. ANAVI would have verified every counterparty before you saw the first deck.",
  },
  developer: {
    label: "Developer / Asset Owner",
    role: "Capital Seeker",
    problem: "Raising capital means exposing my thesis before anyone commits.",
    answer: "Anonymous until you consent. NDA-gated rooms. Escrow-backed milestones.",
    tourPitch: "You raised $30M. ANAVI would have protected your thesis until the moment you chose to disclose it.",
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
      title: "Your Custody Register",
      body: "Each entry carries a cryptographic timestamp — immutable proof of when you made this introduction. If this relationship produces a deal in three years, this record is your attribution claim.",
    },
    investor: {
      title: "Verified Counterparties",
      body: "Every counterparty here has passed KYB verification, OFAC screening, and accreditation confirmation. You see their trust score before you see their name.",
    },
    developer: {
      title: "Your Sealed Register",
      body: "Counterparties know a qualified party exists. Nothing is disclosed until mutual consent — and every disclosure is logged.",
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
    developer: {
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
    subhead: "Every relationship custodied. Every introduction attributed. Every deal closed on infrastructure purpose-built for the $13 trillion private market.",
  },
} as const;

export const CUSTODY_RECEIPT = {
  title: "Introduction Custodied.",
  body: "This introduction is now timestamped, cryptographically signed, and permanently attributed to you. If this relationship produces a deal — today or in five years — this record is your claim.",
  cta: "View Your Custody Register",
} as const;
