export type TooltipType = 'concept' | 'action' | 'status' | 'data' | 'empty-state';

export interface TooltipEntry {
  type: TooltipType;
  title: string;
  content: string;
  learnMoreUrl?: string;
}

export const TOOLTIP_CONTENT: Record<string, TooltipEntry> = {
  relationshipCustody: {
    type: 'concept',
    title: 'Relationship Custody',
    content:
      'Relationship Custody means your relationship introductions are protected. When you upload a contact to ANAVI, we create a cryptographic timestamp proving you were the first to register that relationship. If that person becomes part of any future deal, you automatically receive attribution — even years later. Your relationships are now assets with lifetime value.',
  },
  trustScore: {
    type: 'concept',
    title: 'Trust Score',
    content:
      "Your Trust Score (0–100) reflects how verified and reliable ANAVI's network sees you. It is calculated from 6 factors: verification depth, transaction history, behavioral signals (response time, document quality), deal completion rates, counterparty ratings, and platform tenure. A higher score increases your matching priority and unlocks higher-value deal access.",
  },
  blindMatching: {
    type: 'concept',
    title: 'Blind Matching',
    content:
      "Blind Matching means you and a potential counterparty are matched based on deal compatibility — but neither side sees the other's identity until you both consent. ANAVI's AI matches your deal intent to compatible counterparties without exposing who they are. Only after mutual consent does the identity disclosure happen, and a deal room opens.",
  },
  attribution: {
    type: 'concept',
    title: 'Attribution',
    content:
      'Attribution is how ANAVI ensures you get paid for every deal your relationships generate — forever. When a deal closes involving a relationship you custodied, ANAVI automatically calculates and pays your attribution fee based on your pre-set share structure. This applies to follow-on deals between the same parties, even years after you first made the introduction.',
  },
  compliancePassport: {
    type: 'concept',
    title: 'Compliance Passport',
    content:
      "Your Compliance Passport is a portable, continuously-updated credential summarizing your verification status, compliance history, and trust score. It is accepted by ANAVI's institutional partner network, reducing duplicated due diligence and speeding deal execution.",
  },
  // Demo-specific sales-focused content
  dealRoom: {
    type: 'concept',
    title: 'Deal Room',
    content:
      'A Deal Room is your secure, compliant workspace for closing. NDA signed, documents shared, compliance verified, escrow staged. Everything you need to close — with full audit trail and attribution protection — in one place.',
  },
  compatibilityScore: {
    type: 'data',
    title: 'Compatibility Score',
    content:
      'Our AI calculates compatibility from deal parameters, sector fit, size alignment, and behavioral signals. Scores above 85% indicate high-probability matches. Identity stays hidden until mutual consent — no exposure, no wasted time.',
  },
};
