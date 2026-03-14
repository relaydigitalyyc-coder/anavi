import type { ScenePlan } from "./scene-plan";
import { renderPlanHub } from "./render-hub";

const teaserPlan: ScenePlan = {
  scenes: [
    {
      id: "relationship-custody",
      description: "Verify every counterparty before first contact",
    },
    {
      id: "blind-matching",
      description: "Match on intent — reveal only with mutual consent",
    },
    {
      id: "deal-room",
      description: "Execute with embedded compliance and audit trail",
    },
  ],
  metadata: { trustScore: 0.88, intent: "teaser" },
};

const walkthroughPlan: ScenePlan = {
  scenes: [
    {
      id: "relationship-custody",
      description: "Timestamped, attributed relationships you actually own",
    },
    {
      id: "blind-matching",
      description: "Anonymized intent overlap eliminates cold outreach",
    },
    {
      id: "deal-room",
      description: "Policy-checked infrastructure from NDA to close",
    },
    {
      id: "attribution",
      description: "Originators earn 40-60% of fees across follow-on deals",
    },
  ],
  metadata: { trustScore: 0.85, intent: "walkthrough" },
};

const plan = process.argv.includes("--walkthrough")
  ? walkthroughPlan
  : teaserPlan;
const label = process.argv.includes("--walkthrough")
  ? "walkthrough-90s"
  : "teaser-30s";

renderPlanHub({ plan, previewMode: true })
  .then(result => {
    console.log(`\n${label} render complete:`);
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
