import { Composition } from "remotion";
import type { ScenePlan } from "../scripts/scene-plan";
import {
  AnaviInvestorComposition,
  type StudioVideoProps,
} from "./AnaviInvestorComposition";
import { AnaviProductShowcase } from "./AnaviProductShowcase";

// ─── Plans ────────────────────────────────────────────────────────────────────

const WHITEPAPER_PITCH_PLAN: ScenePlan = {
  scenes: [
    {
      id: "problem-statement",
      description:
        "5—15 broker intermediaries drain value per deal; $10—40B annual fraud; zero originator protection across a $13T market",
    },
    {
      id: "relationship-custody",
      description:
        "RFC 3161-compliant timestamping establishes legally defensible cryptographic priority claims on every introduction",
    },
    {
      id: "trust-score",
      description:
        "Dynamic 0—100 Trust Score aggregates KYB depth, transaction history, dispute resolution, and peer reviews",
    },
    {
      id: "blind-matching",
      description:
        "AI intent matching on anonymized attributes — identity sealed until verified mutual consent triggers NDA-gated deal room",
    },
    {
      id: "deal-room",
      description:
        "AML/KYC automation, shared due diligence repository ($500K saved per deal), e-signature, escrow, and full audit trail",
    },
    {
      id: "attribution",
      description:
        "40—60% originator share on every transaction — lifetime attribution compounds automatically across follow-on deals",
    },
    {
      id: "market-opportunity",
      description:
        "$13T+ private markets AUM growing to $25T by 2030. If Bloomberg runs public markets, ANAVI runs private ones.",
    },
  ],
  metadata: { trustScore: 0.92, intent: "whitepaper-walkthrough-pitch" },
};

const TEASER_PLAN: ScenePlan = {
  scenes: [
    {
      id: "relationship-custody",
      description:
        "Cryptographic custody turns every intro into an owned, compounding relationship asset",
    },
    {
      id: "blind-matching",
      description:
        "Intent-based matching surfaces verified counterparties while identities stay sealed",
    },
    {
      id: "attribution",
      description:
        "40—60% originator share, lifetime — ANAVI computes attribution on every follow-on deal automatically",
    },
  ],
  metadata: { trustScore: 0.88, intent: "vc-punch-teaser" },
};

const WALKTHROUGH_PLAN: ScenePlan = {
  scenes: [
    {
      id: "problem-statement",
      description:
        "5—15 broker intermediaries obscure principals; zero provenance protection across private markets",
    },
    {
      id: "relationship-custody",
      description:
        "RFC 3161 timestamps + zero-knowledge custody establish ownership of the relationship graph",
    },
    {
      id: "deal-room",
      description:
        "KYB, accreditation, NDA, and shared diligence automated in a single NDA-gated deal room",
    },
    {
      id: "attribution",
      description:
        "Lifetime attribution compounds across follow-on transactions — Trust Score evidence powers IC decisioning",
    },
  ],
  metadata: { trustScore: 0.85, intent: "mini-ic-walkthrough-90s" },
};

const IC_PLAN: ScenePlan = {
  scenes: [
    {
      id: "problem-statement",
      description:
        "Broker chains with 5—15 intermediaries obscure principals and destroy originator economics",
    },
    {
      id: "relationship-custody",
      description:
        "Cryptographic relationship provenance with RFC 3161 immutable audit trail",
    },
    {
      id: "trust-score",
      description:
        "Zero-trust identity infrastructure — dynamic Trust Score from KYB, sanctions, peer reviews",
    },
    {
      id: "blind-matching",
      description:
        "Intent-based discovery across verified participants — identity sealed until mutual consent",
    },
    {
      id: "deal-room",
      description:
        "Embedded compliance: AML/KYC, accreditation, NDA automation, shared diligence repository",
    },
    {
      id: "attribution",
      description:
        "Lifetime attribution compounds across follow-on transactions at 40—60% originator share",
    },
    {
      id: "market-opportunity",
      description:
        "The Bloomberg of private capital — $13T AUM growing to $25T by 2030",
    },
  ],
  metadata: { trustScore: 0.92, intent: "ic-committee-5min" },
};

const DEFAULT_PLAN: ScenePlan = {
  scenes: [
    {
      id: "relationship-custody",
      description:
        "Relationship Custody converts fragmented access into platform-owned, compounding leverage",
    },
    {
      id: "blind-matching",
      description:
        "Blind Matching unlocks verified deal flow without cold outreach or identity exposure",
    },
    {
      id: "deal-room",
      description:
        "Deal Room compresses NDA-to-close cycles with policy-checked Trust Score enforcement",
    },
    {
      id: "attribution",
      description:
        "Attribution compounds economics across follow-on transactions in a $13T private market",
    },
  ],
  metadata: { trustScore: 0.82, intent: "investor-narrative-60s" },
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const withDefaults = (
  overrides: Partial<StudioVideoProps>
): StudioVideoProps => ({
  title: "ANAVI — Private Market OS",
  subtitle: "Relationship Custody Intelligence for the $13T+ private markets",
  plan: DEFAULT_PLAN,
  trustScore: DEFAULT_PLAN.metadata.trustScore,
  ...overrides,
});

export const RemotionRoot = () => (
  <>
    <Composition
      id="anavi-whitepaper-pitch-90s"
      component={AnaviInvestorComposition}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={90 * 30}
      defaultProps={withDefaults({
        title: "ANAVI — The Private Market OS",
        subtitle:
          "Comprehensive whitepaper pitch · 7 core innovations · $13T opportunity",
        plan: WHITEPAPER_PITCH_PLAN,
        trustScore: WHITEPAPER_PITCH_PLAN.metadata.trustScore,
      })}
    />
    <Composition
      id="anavi-teaser-30s"
      component={AnaviInvestorComposition}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={30 * 30}
      defaultProps={withDefaults({
        title: "ANAVI — VC Punch",
        subtitle:
          "Relationship Custody + Blind Matching + Attribution for the $13T private markets",
        plan: TEASER_PLAN,
        trustScore: TEASER_PLAN.metadata.trustScore,
      })}
    />
    <Composition
      id="anavi-walkthrough-90s"
      component={AnaviInvestorComposition}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={90 * 30}
      defaultProps={withDefaults({
        title: "ANAVI — Mini IC Brief",
        subtitle:
          "Trust Score evidence from Relationship Custody through Attribution",
        plan: WALKTHROUGH_PLAN,
        trustScore: WALKTHROUGH_PLAN.metadata.trustScore,
      })}
    />
    <Composition
      id="anavi-ic-5min"
      component={AnaviInvestorComposition}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={300 * 30}
      defaultProps={withDefaults({
        title: "ANAVI — Investment Committee Brief",
        subtitle:
          "Relationship Custody Intelligence for the $13T+ private markets",
        plan: IC_PLAN,
        trustScore: IC_PLAN.metadata.trustScore,
      })}
    />
    <Composition
      id="anavi-default-60s"
      component={AnaviInvestorComposition}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={60 * 30}
      defaultProps={withDefaults({
        title: "ANAVI — Investor Narrative",
        subtitle: "Platform narrative for the $13T private markets opportunity",
        plan: DEFAULT_PLAN,
        trustScore: DEFAULT_PLAN.metadata.trustScore,
      })}
    />
    <Composition
      id="anavi-product-showcase-28s"
      component={AnaviProductShowcase}
      fps={30}
      width={1920}
      height={1080}
      durationInFrames={28 * 30}
      defaultProps={{ trustScore: 0.94 }}
    />
  </>
);

export default RemotionRoot;
