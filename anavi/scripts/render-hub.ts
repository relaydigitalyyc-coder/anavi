import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ScenePlan, diffScore } from "./scene-plan";

export type PlanMetadataEntry = {
  planHash: string;
  planSnapshot: string;
  trustScore: number;
  diffScore: number;
  lastRenderPath: string;
  lastUpdated: string;
};

export type RenderHubResult = {
  shouldRender: boolean;
  reason: string;
  metadata: PlanMetadataEntry;
  renderPath: string;
};

export type RenderHubOptions = {
  plan: ScenePlan;
  previewMode?: boolean;
  threshold?: number;
  metadataPath?: string;
};

type MetadataLedger = Record<string, PlanMetadataEntry>;

const DEFAULT_THRESHOLD = 0.4;
const MODULE_DIR =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_METADATA_PATH = process.env.ANAVI_PLAN_METADATA_PATH
  ? path.resolve(process.env.ANAVI_PLAN_METADATA_PATH)
  : path.resolve(MODULE_DIR, "..", "data", "plan-metadata.json");
const DEFAULT_RENDER_OUTPUT_DIR = process.env.ANAVI_RENDER_OUTPUT_DIR
  ? path.resolve(process.env.ANAVI_RENDER_OUTPUT_DIR)
  : path.resolve(MODULE_DIR, "..", "data", "renders");

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function ensureDirectoryPath(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function loadMetadata(metadataPath: string): MetadataLedger {
  try {
    const raw = fs.readFileSync(metadataPath, "utf8");
    return JSON.parse(raw) as MetadataLedger;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

function writeMetadata(metadataPath: string, ledger: MetadataLedger) {
  ensureDir(metadataPath);
  fs.writeFileSync(metadataPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
}

function pseudoCompositionId(intent: string) {
  const lower = (intent || "").toLowerCase();
  if (lower.includes("teaser")) return "anavi/teaser_30s";
  if (lower.includes("walkthrough")) return "anavi/walkthrough_90s";
  if (lower.includes("ic") || lower.includes("committee")) return "anavi/ic_5min";
  return "anavi/default";
}

function estimatedDurationSeconds(intent: string, sceneCount: number) {
  const lower = (intent || "").toLowerCase();
  if (lower.includes("teaser")) return 30;
  if (lower.includes("walkthrough")) return 90;
  if (lower.includes("ic") || lower.includes("committee")) return 300;
  return Math.max(30, Math.min(180, sceneCount * 7));
}

function computePlanHash(plan: ScenePlan) {
  const serialized = JSON.stringify(plan);
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

function clamp(value: number) {
  if (Number.isFinite(value)) {
    return Math.min(Math.max(value, 0), 1);
    }
  return 0;
}

function writeRenderArtifacts(
  renderPath: string,
  plan: ScenePlan,
  trustScore: number
) {
  ensureDir(renderPath);

  const envSource = process.env.ANAVI_RENDER_SOURCE_MP4;
  const demoSource = path.resolve(MODULE_DIR, "..", "demo-video.mp4");
  const sourcePath =
    envSource && fs.existsSync(envSource)
      ? envSource
      : fs.existsSync(demoSource)
        ? demoSource
        : null;

  if (sourcePath) {
    fs.copyFileSync(sourcePath, renderPath);
  } else if (!fs.existsSync(renderPath)) {
    // Fall back to a tiny valid MP4 header if no source exists. Keeps artifacts playable.
    // This avoids placeholder text files which are not valid media.
    fs.writeFileSync(renderPath, Buffer.from("000000186674797069736F6D0000020069736F6D69736F32617663316D703432", "hex"));
  }

  // Technical sidecar details (pseudo-composition while Remotion integration lands).
  const sidecarPath = `${renderPath}.json`;
  const compId = pseudoCompositionId(plan.metadata.intent);
  const duration = estimatedDurationSeconds(plan.metadata.intent, plan.scenes.length);
  const fps = 30;
  const width = 1920;
  const height = 1080;
  const sizeBytes = fs.existsSync(renderPath) ? fs.statSync(renderPath).size : 0;

  fs.writeFileSync(
    sidecarPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        renderer: sourcePath ? "copy" : "generated-minimal",
        compositionId: compId,
        technical: { fps, width, height, durationSeconds: duration, sizeBytes },
        trustScore,
        plan,
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

export function renderPlanHub({
  plan,
  previewMode = false,
  threshold = DEFAULT_THRESHOLD,
  metadataPath = DEFAULT_METADATA_PATH,
}: RenderHubOptions): RenderHubResult {
  const ledger = loadMetadata(metadataPath);
  const planHash = computePlanHash(plan);
  const cached = ledger[planHash];
  const previousPlan = cached
    ? (JSON.parse(cached.planSnapshot) as ScenePlan)
    : undefined;
  const diff = previousPlan ? clamp(diffScore(plan, previousPlan)) : 1;
  const trustScore = plan.metadata.trustScore ?? 0;
  ensureDirectoryPath(DEFAULT_RENDER_OUTPUT_DIR);
  const renderPath = path.resolve(
    DEFAULT_RENDER_OUTPUT_DIR,
    `${planHash}-${Date.now()}.mp4`
  );

  const entry: PlanMetadataEntry = {
    planHash,
    planSnapshot: JSON.stringify(plan),
    trustScore,
    diffScore: diff,
    lastRenderPath: cached?.lastRenderPath ?? renderPath,
    lastUpdated: new Date().toISOString(),
  };

  let shouldRender = previewMode || !cached || diff >= threshold;
  const reasons: string[] = [];

  if (previewMode) {
    reasons.push("preview-bypass");
  }
  if (!cached) {
    reasons.push("no cached metadata");
  }
  if (!previewMode && cached && diff < threshold) {
    shouldRender = false;
    reasons.push("diff below threshold");
  }

  if (shouldRender) {
    reasons.push("rendering");
    entry.lastRenderPath = renderPath;
    writeRenderArtifacts(entry.lastRenderPath, plan, trustScore);
  } else {
    reasons.push("using cache");
    entry.lastRenderPath = cached?.lastRenderPath ?? renderPath;
    if (!fs.existsSync(entry.lastRenderPath)) {
      writeRenderArtifacts(entry.lastRenderPath, plan, trustScore);
    }
  }

  entry.lastUpdated = new Date().toISOString();
  ledger[planHash] = entry;
  writeMetadata(metadataPath, ledger);

  return {
    shouldRender,
    reason: reasons.join(", "),
    metadata: entry,
    renderPath: entry.lastRenderPath,
  };
}

if (import.meta.main) {
  const previewMode = process.argv.includes("--preview");
  const plan: ScenePlan = {
    scenes: [
      { id: "relationship-custody", description: "Custody setup" },
      { id: "blind-matching", description: "Blind matching handoff" },
      { id: "deal-room", description: "Deal room progression" },
      { id: "attribution", description: "Attribution close-out" },
    ],
    metadata: {
      trustScore: 0.75,
      intent: "studio-cli-run",
    },
  };
  const result = renderPlanHub({ plan, previewMode });
  console.log(JSON.stringify(result, null, 2));
}
