import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createAuthContext } from "../server/test/setup";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "anavi-studio-"));
const planMetadataPath = path.join(tempDir, "plan-metadata.json");
const geminiLedgerPath = path.join(tempDir, "ai-assets.json");
const assetPacksPath = path.join(tempDir, "asset-packs");
const renderJobsPath = path.join(tempDir, "render-jobs.json");

process.env.ANAVI_PLAN_METADATA_PATH = planMetadataPath;
process.env.ANAVI_GEMINI_LEDGER_PATH = geminiLedgerPath;
process.env.ANAVI_ASSET_PACKS_DIR = assetPacksPath;
process.env.ANAVI_RENDER_JOBS_PATH = renderJobsPath;

const { appRouter } = await import("../server/routers");

const defaultSettings = {
  emotionDepth: 62,
  scenePacing: 58,
  renderFidelity: 74,
  rerenderThreshold: 40,
  trustScoreFloor: 72,
  previewMode: false,
  overrideGate: false,
  intentTag: "router-test-intent",
};

describe("animationStudio router", () => {
  beforeEach(() => {
    if (fs.existsSync(planMetadataPath)) {
      fs.unlinkSync(planMetadataPath);
    }
    if (fs.existsSync(geminiLedgerPath)) {
      fs.unlinkSync(geminiLedgerPath);
    }
    if (fs.existsSync(renderJobsPath)) {
      fs.unlinkSync(renderJobsPath);
    }
    fs.rmSync(assetPacksPath, { recursive: true, force: true });
  });

  afterAll(() => {
    delete process.env.ANAVI_PLAN_METADATA_PATH;
    delete process.env.ANAVI_GEMINI_LEDGER_PATH;
    delete process.env.ANAVI_ASSET_PACKS_DIR;
    delete process.env.ANAVI_RENDER_JOBS_PATH;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns summary with validation payload", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.animationStudio.getPlanSummary();

    expect(result.settings.intentTag).toBeDefined();
    expect(result.validation.reason.length).toBeGreaterThan(0);
    expect(result.lastRender).toBeNull();
  });

  it("validates plan and returns diff score", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.animationStudio.validatePlan(defaultSettings);

    expect(result.diffScore).toBeGreaterThanOrEqual(0);
    expect(result.diffScore).toBeLessThanOrEqual(1);
    expect(result.threshold).toBeCloseTo(0.4, 4);
  });

  it("runs preview render without gate blocking", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.animationStudio.runRender({
      ...defaultSettings,
      previewMode: true,
    });

    expect(result.shouldRender).toBe(true);
    expect(result.reason).toContain("preview-bypass");
    expect(result.renderPath).toContain("renders/");
  });

  it("queues, starts, cancels, and lists render jobs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const queuedSuccess = await caller.animationStudio.queueRenderJob({
      settings: { ...defaultSettings, previewMode: true, intentTag: "router-job-success" },
    });
    const queuedFailure = await caller.animationStudio.queueRenderJob({
      settings: { ...defaultSettings, previewMode: true, intentTag: "router-job-failure" },
      simulateFailure: true,
    });
    const queuedCanceled = await caller.animationStudio.queueRenderJob({
      settings: { ...defaultSettings, previewMode: true, intentTag: "router-job-cancel" },
    });

    const loadedQueued = await caller.animationStudio.getRenderJob({
      jobId: queuedSuccess.jobId,
    });
    expect(loadedQueued?.state).toBe("queued");

    const startedSuccess = await caller.animationStudio.startRenderJob({
      jobId: queuedSuccess.jobId,
    });
    expect(startedSuccess.state).toBe("succeeded");
    expect(startedSuccess.reason).toContain("preview-bypass");
    expect(startedSuccess.renderPath).toContain("renders/");

    const startedFailure = await caller.animationStudio.startRenderJob({
      jobId: queuedFailure.jobId,
    });
    expect(startedFailure.state).toBe("failed");
    expect(startedFailure.retryCount).toBe(1);
    expect(startedFailure.error?.message).toContain("Simulated render failure");
    expect(startedFailure.error?.stack?.length ?? 0).toBeGreaterThan(0);

    const canceled = await caller.animationStudio.cancelRenderJob({
      jobId: queuedCanceled.jobId,
    });
    expect(canceled.state).toBe("canceled");

    const listed = await caller.animationStudio.listRenderJobs({ limit: 10 });
    const listedIds = listed.map(job => job.jobId);
    expect(listedIds).toContain(queuedSuccess.jobId);
    expect(listedIds).toContain(queuedFailure.jobId);
    expect(listedIds).toContain(queuedCanceled.jobId);

    const listedLimited = await caller.animationStudio.listRenderJobs({ limit: 2 });
    expect(listedLimited.length).toBe(2);
  });

  it("requests gemini asset and returns ledger-backed metadata", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.animationStudio.requestGeminiAsset({
      intentTag: "router-test-intent",
      trustScoreFloor: 80,
    });

    expect(result.assetId.length).toBeGreaterThan(10);
    expect(result.intentTag).toBe("router-test-intent");
    expect(result.trustScore).toBeCloseTo(0.8, 4);
  });

  it("returns investor presets and applies one", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const presets = await caller.animationStudio.getInvestorPresets();
    expect(presets.length).toBeGreaterThanOrEqual(3);
    expect(presets.some(preset => preset.id === "teaser_30s")).toBe(true);

    const applied = await caller.animationStudio.applyInvestorPreset({
      presetId: "teaser_30s",
    });
    expect(applied.settings.intentTag).toContain("teaser");
    expect(applied.claudeContext.requiredTerminology).toContain("Trust Score");
  });

  it("exports investor asset pack as folder bundle", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.animationStudio.exportAssetPack({
      presetId: "walkthrough_90s",
      settings: {
        ...defaultSettings,
        intentTag: "router-export-pack",
      },
      useClaude: false,
    });

    expect(result.packDirectory).toContain("asset-packs");
    expect(fs.existsSync(result.packDirectory)).toBe(true);
    expect(result.files).toContain("manifest.json");
    expect(result.files).toContain("narrative.md");
    expect(result.files.some(file => file.startsWith("social/"))).toBe(true);
    expect(result.narrativeProvider).toBe("fallback");

    // Verify manifest readiness gates and lineage entries
    const manifest = JSON.parse(
      fs.readFileSync(path.join(result.packDirectory, 'manifest.json'), 'utf8')
    );
    expect(manifest.readiness).toBeDefined();
    expect(manifest.readiness.qualityGates.terminology.required).toContain('Trust Score');
    expect(typeof manifest.readiness.readyToPublish).toBe('boolean');
  });
});
