import { renderPlanHub } from "./render-hub";
import type { ScenePlan } from "./scene-plan";

type PromptRenderSpec = {
  key: string;
  plan: ScenePlan;
};

const promptSpecs: PromptRenderSpec[] = [
  {
    key: "vc-punch-30s",
    plan: {
      scenes: [
        {
          id: "relationship-custody",
          description:
            "Attention: $13T private markets still run on fragmented trust and cold intros",
        },
        {
          id: "blind-matching",
          description:
            "Branding + Connection: ANAVI Blind Matching activates only on verified Intent overlap",
        },
        {
          id: "deal-room",
          description:
            "Direction: launch Deal Room execution with Trust Score controls and faster closes",
        },
      ],
      metadata: { trustScore: 0.89, intent: "vc-punch-30s" },
    },
  },
  {
    key: "investor-narrative-60s",
    plan: {
      scenes: [
        {
          id: "relationship-custody",
          description:
            "Attention: private deal velocity dies when relationship provenance is missing",
        },
        {
          id: "relationship-custody",
          description:
            "Branding: ANAVI Relationship Custody converts every qualified intro into owned advantage",
        },
        {
          id: "blind-matching",
          description:
            "Connection: Blind Matching removes noise and surfaces counterparties by Intent fit",
        },
        {
          id: "deal-room",
          description:
            "Direction: Deal Room compresses NDA-to-close cycles under policy-checked Trust Score",
        },
        {
          id: "attribution",
          description:
            "Direction: Attribution compounds economics as private-market activity scales",
        },
      ],
      metadata: { trustScore: 0.85, intent: "investor-narrative-60s" },
    },
  },
  {
    key: "mini-ic-90s",
    plan: {
      scenes: [
        {
          id: "relationship-custody",
          description:
            "IC Hook: fragmented relationship data blocks repeatable performance",
        },
        {
          id: "relationship-custody",
          description:
            "Platform Moat: Relationship Custody creates auditable provenance across the $13T market",
        },
        {
          id: "blind-matching",
          description:
            "Execution Edge: Blind Matching reveals only verified Intent overlap and filters noise",
        },
        {
          id: "deal-room",
          description:
            "Governance: Deal Room enforces KYB, accreditation, NDA, and lifecycle policy",
        },
        {
          id: "attribution",
          description:
            "Outcome: Attribution + Trust Score quantify compounding platform leverage",
        },
      ],
      metadata: { trustScore: 0.9, intent: "mini-ic-90s" },
    },
  },
];

async function run() {
  for (const spec of promptSpecs) {
    const result = await renderPlanHub({
      plan: spec.plan,
      previewMode: false,
      threshold: 0,
    });
    console.log(
      JSON.stringify(
        {
          key: spec.key,
          renderPath: result.renderPath,
          reason: result.reason,
          shouldRender: result.shouldRender,
        },
        null,
        2
      )
    );
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
