import { beforeEach, afterEach, test, expect, describe } from "vitest";
import { renderPlanHub } from "../scripts/render-hub";
import { diffScore, ScenePlan } from "../scripts/scene-plan";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "anavi-render-hub-"));
const metadataPath = path.join(tempDir, "plan-metadata.json");

function cleanup() {
  if (fs.existsSync(metadataPath)) {
    fs.unlinkSync(metadataPath);
  }
}

const planA: ScenePlan = {
  scenes: [{ id: "1", description: "intro" }],
  metadata: { trustScore: 0.5, intent: "launch" },
};

const planB: ScenePlan = {
  scenes: [{ id: "1", description: "intro" }],
  metadata: { trustScore: 0.5, intent: "launch" },
};

const planIdentical: ScenePlan = {
  scenes: [{ id: "1", description: "intro" }],
  metadata: { trustScore: 0.5, intent: "launch" },
};

const planSlightTrustChange: ScenePlan = {
  scenes: [{ id: "1", description: "intro" }],
  metadata: { trustScore: 0.55, intent: "launch" },
};

const planIntentChanged: ScenePlan = {
  scenes: [{ id: "1", description: "intro" }],
  metadata: { trustScore: 0.5, intent: "walkthrough" },
};

const planMajorChange: ScenePlan = {
  scenes: [
    { id: "1", description: "intro" },
    { id: "2", description: "matching" },
    { id: "3", description: "deal-room" },
  ],
  metadata: { trustScore: 0.5, intent: "ic-narrative" },
};

const planTrustAtZero: ScenePlan = {
  scenes: [{ id: "1", description: "intro" }],
  metadata: { trustScore: 0.0, intent: "launch" },
};

const planTrustAtOne: ScenePlan = {
  scenes: [{ id: "1", description: "intro" }],
  metadata: { trustScore: 1.0, intent: "launch" },
};

const planTeaser: ScenePlan = {
  scenes: [{ id: "scene-1", description: "trust intro" }],
  metadata: { trustScore: 0.72, intent: "teaser-vc-outreach" },
};

const planWalkthrough: ScenePlan = {
  scenes: [
    { id: "scene-1", description: "custody" },
    { id: "scene-2", description: "blind matching" },
  ],
  metadata: { trustScore: 0.8, intent: "walkthrough-demo" },
};

const planIC: ScenePlan = {
  scenes: [{ id: "scene-1", description: "ic narrative" }],
  metadata: { trustScore: 0.9, intent: "ic-committee-pitch" },
};

beforeEach(cleanup);
afterEach(cleanup);

// ─── Original passing tests (preserved) ─────────────────────────────────────

test("should rerender when metadata missing", async () => {
  const result = await renderPlanHub({ plan: planA, metadataPath });
  expect(result.shouldRender).toBe(true);
});

test("should reuse cache when diff below threshold", async () => {
  await renderPlanHub({ plan: planA, metadataPath });
  const result = await renderPlanHub({ plan: planB, metadataPath });
  expect(result.shouldRender).toBe(false);
  expect(result.reason).toContain("diff below threshold");
});

// ─── diffScore unit tests ────────────────────────────────────────────────────

describe("diffScore formula", () => {
  test("identical plans score 0", () => {
    expect(diffScore(planA, planIdentical)).toBe(0);
  });

  test("slight trust change (0.05 delta) scores 0.025", () => {
    const score = diffScore(planA, planSlightTrustChange);
    // trustDiff=0.05 * 0.5 = 0.025; sceneCountDiff=0; intentChanged=0
    expect(score).toBeCloseTo(0.025, 5);
  });

  test("intent change alone contributes 0.2", () => {
    const score = diffScore(planA, planIntentChanged);
    // intentChanged=1 * 0.2; sceneCountDiff=0; trustDiff=0
    expect(score).toBeCloseTo(0.2, 5);
  });

  test("trust extremes (0 vs 1) produces score 0.5", () => {
    const score = diffScore(planTrustAtZero, planTrustAtOne);
    // trustDiff=1 * 0.5 = 0.5
    expect(score).toBeCloseTo(0.5, 5);
  });

  test("two extra scenes + intent change scores 0.8", () => {
    const score = diffScore(planA, planMajorChange);
    // sceneCountDiff=2 * 0.3=0.6; intentChanged=1 * 0.2=0.2; total=0.8
    expect(score).toBeCloseTo(0.8, 5);
  });

  test("scene count diff is symmetric", () => {
    const ab = diffScore(planA, planMajorChange);
    const ba = diffScore(planMajorChange, planA);
    expect(ab).toBeCloseTo(ba, 10);
  });
});

// ─── Threshold variations ────────────────────────────────────────────────────

describe("threshold behavior", () => {
  test("renders when diff equals threshold exactly (diff >= threshold)", async () => {
    // planTrustAtOne rendered for first time: diff=1 >= threshold=0.5
    await renderPlanHub({ plan: planTrustAtOne, metadataPath });
    // Same plan rendered again: diff=0 < 0.5, no re-render
    // To test diff==threshold, we use threshold=0: 0>=0 triggers render
    const result = await renderPlanHub({
      plan: planTrustAtOne,
      metadataPath,
      threshold: 0,
    });
    expect(result.shouldRender).toBe(true);
  });

  test("does not render when same plan rendered twice (diff=0 < any positive threshold)", async () => {
    // Cache is keyed by plan hash — same plan always has diff=0 vs itself
    await renderPlanHub({ plan: planSlightTrustChange, metadataPath });
    const result = await renderPlanHub({
      plan: planSlightTrustChange,
      metadataPath,
      threshold: 0.026,
    });
    expect(result.shouldRender).toBe(false);
    expect(result.reason).toContain("diff below threshold");
  });

  test("threshold=0 always triggers rerender after first render", async () => {
    await renderPlanHub({ plan: planA, metadataPath });
    const result = await renderPlanHub({
      plan: planIdentical,
      metadataPath,
      threshold: 0,
    });
    expect(result.shouldRender).toBe(true);
  });

  test("threshold=1 never rerenders same plan on second call (diff=0 < 1)", async () => {
    // Same plan hash → diff=0 on second render, always below threshold=1
    await renderPlanHub({ plan: planMajorChange, metadataPath });
    const result = await renderPlanHub({
      plan: planMajorChange,
      metadataPath,
      threshold: 1,
    });
    expect(result.shouldRender).toBe(false);
  });

  test("above-threshold diff score forces rerender", async () => {
    // planA never seen before → diff=1 >= default threshold 0.4 → renders
    const result = await renderPlanHub({ plan: planA, metadataPath });
    expect(result.shouldRender).toBe(true);
    expect(result.reason).not.toContain("diff below threshold");
  });
});

// ─── Preview mode ────────────────────────────────────────────────────────────

describe("preview mode", () => {
  test("preview mode always renders even when cache is fresh", async () => {
    await renderPlanHub({ plan: planA, metadataPath });
    const result = await renderPlanHub({ plan: planB, previewMode: true, metadataPath });
    expect(result.shouldRender).toBe(true);
    expect(result.reason).toContain("preview-bypass");
  });

  test("preview mode renders on first call (no cache)", async () => {
    const result = await renderPlanHub({ plan: planA, previewMode: true, metadataPath });
    expect(result.shouldRender).toBe(true);
    expect(result.reason).toContain("preview-bypass");
  });

  test("non-preview second identical call uses cache", async () => {
    await renderPlanHub({ plan: planA, previewMode: false, metadataPath });
    const result = await renderPlanHub({ plan: planB, previewMode: false, metadataPath });
    expect(result.shouldRender).toBe(false);
    expect(result.reason).not.toContain("preview-bypass");
  });
});

// ─── Sidecar JSON output ─────────────────────────────────────────────────────

describe("sidecar JSON output", () => {
  test("sidecar .json file is written alongside the render", async () => {
    const result = await renderPlanHub({ plan: planA, metadataPath });
    expect(fs.existsSync(`${result.renderPath}.json`)).toBe(true);
  });

  test("sidecar contains renderer, compositionId, technical, trustScore, plan, generatedAt", async () => {
    const result = await renderPlanHub({ plan: planA, metadataPath });
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(sidecar).toHaveProperty("renderer");
    expect(sidecar).toHaveProperty("compositionId");
    expect(sidecar).toHaveProperty("technical");
    expect(sidecar).toHaveProperty("trustScore");
    expect(sidecar).toHaveProperty("plan");
    expect(sidecar).toHaveProperty("generatedAt");
  });

  test("sidecar technical block has fps, width, height, durationSeconds, sizeBytes", async () => {
    const result = await renderPlanHub({ plan: planA, metadataPath });
    const { technical } = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(typeof technical.fps).toBe("number");
    expect(typeof technical.width).toBe("number");
    expect(typeof technical.height).toBe("number");
    expect(typeof technical.durationSeconds).toBe("number");
    expect(typeof technical.sizeBytes).toBe("number");
    expect(technical.sizeBytes).toBeGreaterThan(0);
  });

  test("sidecar trustScore matches plan.metadata.trustScore", async () => {
    const result = await renderPlanHub({ plan: planTeaser, metadataPath });
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(sidecar.trustScore).toBe(planTeaser.metadata.trustScore);
  });

  test("sidecar plan field matches input plan", async () => {
    const result = await renderPlanHub({ plan: planWalkthrough, metadataPath });
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(sidecar.plan.metadata.intent).toBe(planWalkthrough.metadata.intent);
    expect(sidecar.plan.scenes.length).toBe(planWalkthrough.scenes.length);
  });

  test("sidecar generatedAt is a valid ISO timestamp", async () => {
    const result = await renderPlanHub({ plan: planA, metadataPath });
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(Number.isNaN(Date.parse(sidecar.generatedAt))).toBe(false);
  });
});

// ─── Metadata ledger ─────────────────────────────────────────────────────────

describe("metadata ledger", () => {
  test("metadata file is created after first render", async () => {
    expect(fs.existsSync(metadataPath)).toBe(false);
    await renderPlanHub({ plan: planA, metadataPath });
    expect(fs.existsSync(metadataPath)).toBe(true);
  });

  test("metadata entry contains planHash, trustScore, diffScore, lastRenderPath, lastUpdated", async () => {
    const result = await renderPlanHub({ plan: planA, metadataPath });
    const { metadata } = result;
    expect(typeof metadata.planHash).toBe("string");
    expect(metadata.planHash.length).toBe(64);
    expect(typeof metadata.trustScore).toBe("number");
    expect(typeof metadata.diffScore).toBe("number");
    expect(typeof metadata.lastRenderPath).toBe("string");
    expect(typeof metadata.lastUpdated).toBe("string");
  });

  test("first render stores diffScore of 1 (no prior cache)", async () => {
    const result = await renderPlanHub({ plan: planA, metadataPath });
    expect(result.metadata.diffScore).toBe(1);
  });

  test("second render of same plan stores diffScore of 0", async () => {
    await renderPlanHub({ plan: planA, metadataPath });
    const result = await renderPlanHub({ plan: planB, metadataPath });
    expect(result.metadata.diffScore).toBe(0);
  });

  test("ledger stores multiple distinct plan hashes", async () => {
    await renderPlanHub({ plan: planA, metadataPath });
    await renderPlanHub({ plan: planTeaser, metadataPath });
    const ledger = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    expect(Object.keys(ledger).length).toBe(2);
  });

  test("renderPath in result points to a file that exists", async () => {
    const result = await renderPlanHub({ plan: planA, metadataPath });
    expect(fs.existsSync(result.renderPath)).toBe(true);
  });

  test("renderPath ends with .mp4", async () => {
    const result = await renderPlanHub({ plan: planA, metadataPath });
    expect(result.renderPath.endsWith(".mp4")).toBe(true);
  });
});

// ─── Composition profile selection ──────────────────────────────────────────

describe("composition profile selection", () => {
  test("teaser intent selects anavi-teaser-30s (30s duration)", async () => {
    const result = await renderPlanHub({ plan: planTeaser, metadataPath });
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(sidecar.compositionId).toBe("anavi-teaser-30s");
    expect(sidecar.technical.durationSeconds).toBe(30);
  });

  test("walkthrough intent selects anavi-walkthrough-90s (90s duration)", async () => {
    const result = await renderPlanHub({ plan: planWalkthrough, metadataPath });
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(sidecar.compositionId).toBe("anavi-walkthrough-90s");
    expect(sidecar.technical.durationSeconds).toBe(90);
  });

  test("ic/committee intent selects anavi-ic-5min (300s duration)", async () => {
    const result = await renderPlanHub({ plan: planIC, metadataPath });
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(sidecar.compositionId).toBe("anavi-ic-5min");
    expect(sidecar.technical.durationSeconds).toBe(300);
  });

  test("unrecognized intent falls back to anavi-default-60s (60s duration)", async () => {
    const genericPlan: ScenePlan = {
      scenes: [{ id: "1", description: "generic" }],
      metadata: { trustScore: 0.5, intent: "launch" },
    };
    const result = await renderPlanHub({ plan: genericPlan, metadataPath });
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(sidecar.compositionId).toBe("anavi-default-60s");
    expect(sidecar.technical.durationSeconds).toBe(60);
  });

  test("all profiles use 30fps and 1920x1080", async () => {
    const cases: [ScenePlan, string][] = [
      [planTeaser, "teaser"],
      [planWalkthrough, "walkthrough"],
      [planIC, "ic"],
    ];
    for (const [plan, label] of cases) {
      const mp = path.join(tempDir, `meta-${label}.json`);
      const result = await renderPlanHub({ plan, metadataPath: mp });
      const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
      expect(sidecar.technical.fps).toBe(30);
      expect(sidecar.technical.width).toBe(1920);
      expect(sidecar.technical.height).toBe(1080);
    }
  });
});

// ─── Reason string composition ───────────────────────────────────────────────

describe("reason string composition", () => {
  test("first render reason includes 'no cached metadata' and 'rendering'", async () => {
    const result = await renderPlanHub({ plan: planA, metadataPath });
    expect(result.reason).toContain("no cached metadata");
    expect(result.reason).toContain("rendering");
  });

  test("cache hit reason includes 'diff below threshold' and 'using cache'", async () => {
    await renderPlanHub({ plan: planA, metadataPath });
    const result = await renderPlanHub({ plan: planB, metadataPath });
    expect(result.reason).toContain("diff below threshold");
    expect(result.reason).toContain("using cache");
  });

  test("preview mode reason includes 'preview-bypass' and 'rendering'", async () => {
    const result = await renderPlanHub({ plan: planA, previewMode: true, metadataPath });
    expect(result.reason).toContain("preview-bypass");
    expect(result.reason).toContain("rendering");
  });

  test("new plan render contains 'rendering' but not 'diff below threshold'", async () => {
    const result = await renderPlanHub({ plan: planMajorChange, metadataPath });
    expect(result.reason).toContain("rendering");
    expect(result.reason).not.toContain("diff below threshold");
  });
});

// ─── Multi-scene plans ───────────────────────────────────────────────────────

describe("plans with multiple scenes", () => {
  test("4-scene plan renders and sidecar reflects correct scene count", async () => {
    const multiScene: ScenePlan = {
      scenes: [
        { id: "custody", description: "Relationship custody setup" },
        { id: "matching", description: "Blind matching handoff" },
        { id: "deal-room", description: "Deal room progression" },
        { id: "attribution", description: "Lifetime attribution close-out" },
      ],
      metadata: { trustScore: 0.75, intent: "studio-cli-run" },
    };
    const result = await renderPlanHub({ plan: multiScene, metadataPath });
    expect(result.shouldRender).toBe(true);
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(sidecar.plan.scenes.length).toBe(4);
  });

  test("empty scenes array renders (diffScore=1 for new plan)", async () => {
    const emptyScenes: ScenePlan = {
      scenes: [],
      metadata: { trustScore: 0.5, intent: "launch" },
    };
    const result = await renderPlanHub({ plan: emptyScenes, metadataPath });
    expect(result.shouldRender).toBe(true);
    expect(result.metadata.diffScore).toBe(1);
  });
});

// ─── trustScore edge cases ───────────────────────────────────────────────────

describe("trustScore edge cases", () => {
  test("trustScore=0 stored correctly in metadata and sidecar", async () => {
    const result = await renderPlanHub({ plan: planTrustAtZero, metadataPath });
    expect(result.metadata.trustScore).toBe(0);
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(sidecar.trustScore).toBe(0);
  });

  test("trustScore=1 stored correctly in metadata and sidecar", async () => {
    const result = await renderPlanHub({ plan: planTrustAtOne, metadataPath });
    expect(result.metadata.trustScore).toBe(1);
    const sidecar = JSON.parse(fs.readFileSync(`${result.renderPath}.json`, "utf8"));
    expect(sidecar.trustScore).toBe(1);
  });
});

// ─── Return shape contract ───────────────────────────────────────────────────

describe("return shape contract", () => {
  test("result always has shouldRender, reason, metadata, renderPath", async () => {
    const result = await renderPlanHub({ plan: planA, metadataPath });
    expect(typeof result.shouldRender).toBe("boolean");
    expect(typeof result.reason).toBe("string");
    expect(result.reason.length).toBeGreaterThan(0);
    expect(typeof result.renderPath).toBe("string");
    expect(result.metadata).toBeDefined();
  });

  test("shouldRender=false result still has a valid renderPath", async () => {
    await renderPlanHub({ plan: planA, metadataPath });
    const result = await renderPlanHub({ plan: planB, metadataPath });
    expect(result.shouldRender).toBe(false);
    expect(result.renderPath.length).toBeGreaterThan(0);
  });
});
