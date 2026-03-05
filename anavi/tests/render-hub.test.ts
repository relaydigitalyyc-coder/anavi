import { beforeEach, afterEach, test, expect } from "vitest";
import { renderPlanHub } from "../scripts/render-hub";
import { ScenePlan } from "../scripts/scene-plan";
import fs from "node:fs";
import path from "node:path";

const metadataPath = path.resolve("tmp-plan-metadata.json");

function cleanup() {
  if (fs.existsSync(metadataPath)) {
    fs.unlinkSync(metadataPath);
  }
}

const planA: ScenePlan = {
  scenes: [{ id: "1", description: "intro" }],
  metadata: {
    trustScore: 0.5,
    intent: "launch",
  },
};

const planB: ScenePlan = {
  scenes: [{ id: "1", description: "intro" }],
  metadata: {
    trustScore: 0.5,
    intent: "launch",
  },
};

beforeEach(cleanup);
afterEach(cleanup);

test("should rerender when metadata missing", () => {
  const result = renderPlanHub({ plan: planA, metadataPath });
  expect(result.shouldRender).toBe(true);
});

test("should reuse cache when diff below threshold", () => {
  renderPlanHub({ plan: planA, metadataPath });
  const result = renderPlanHub({ plan: planB, metadataPath });
  expect(result.shouldRender).toBe(false);
  expect(result.reason).toContain("diff below threshold");
});
