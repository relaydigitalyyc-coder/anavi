import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
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

type CompositionProfile = {
  id: string;
  durationSeconds: number;
  fps: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
};

type RenderArtifactDetails = {
  renderer: "remotion" | "copy";
  compositionId: string;
  technical: {
    fps: number;
    width: number;
    height: number;
    durationSeconds: number;
    sizeBytes: number;
  };
};

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
const REMOTION_ENTRYPOINT = path.resolve(
  MODULE_DIR,
  "..",
  "remotion-studio",
  "index.ts"
);
const REMOTION_BROWSER_CANDIDATES = [
  process.env.ANAVI_REMOTION_BROWSER_PATH,
  "/snap/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
].filter(Boolean) as string[];

const COMPOSITION_PROFILES: Record<string, CompositionProfile> = {
  "anavi-whitepaper-pitch-90s": {
    id: "anavi-whitepaper-pitch-90s",
    durationSeconds: 90,
    fps: 30,
    width: 1920,
    height: 1080,
    title: "ANAVI — The Private Market OS",
    subtitle:
      "Comprehensive whitepaper pitch · 7 core innovations · $13T opportunity",
  },
  "anavi-teaser-30s": {
    id: "anavi-teaser-30s",
    durationSeconds: 30,
    fps: 30,
    width: 1920,
    height: 1080,
    title: "ANAVI — VC Punch",
    subtitle: "Attention-first hook, platform proof, and clear direction",
  },
  "anavi-walkthrough-90s": {
    id: "anavi-walkthrough-90s",
    durationSeconds: 90,
    fps: 30,
    width: 1920,
    height: 1080,
    title: "ANAVI — Mini IC Brief",
    subtitle: "Cinematic private-markets thesis with Trust Score evidence",
  },
  "anavi-ic-5min": {
    id: "anavi-ic-5min",
    durationSeconds: 300,
    fps: 30,
    width: 1920,
    height: 1080,
    title: "ANAVI IC Narrative 5min",
    subtitle: "Investment committee narrative with Attribution",
  },
  "anavi-default-60s": {
    id: "anavi-default-60s",
    durationSeconds: 60,
    fps: 30,
    width: 1920,
    height: 1080,
    title: "ANAVI — Investor Narrative",
    subtitle: "Attention, Branding, Connection, Direction across a $13T market",
  },
  "anavi-product-showcase-28s": {
    id: "anavi-product-showcase-28s",
    durationSeconds: 28,
    fps: 30,
    width: 1920,
    height: 1080,
    title: "ANAVI — Product Showcase",
    subtitle:
      "Real UI showcase: Brand → Problem → Verification Banner → Trust Dashboard → Passport → Match/Deal → CTA",
  },
};

let remotionBundlePromise: Promise<string> | null = null;
let networkInterfacePatchApplied = false;

const FALLBACK_LOOPBACK_INTERFACES: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {
  lo: [
    {
      address: "127.0.0.1",
      netmask: "255.0.0.0",
      family: "IPv4",
      mac: "00:00:00:00:00:00",
      internal: true,
      cidr: "127.0.0.1/8",
    },
  ],
};

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
  try {
    fs.writeFileSync(
      metadataPath,
      `${JSON.stringify(ledger, null, 2)}\n`,
      "utf8"
    );
  } catch (err) {
    console.error("[render-hub] Failed to write metadata ledger:", err);
  }
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

function getProfileForPlan(plan: ScenePlan): CompositionProfile {
  const intent = plan.metadata.intent.toLowerCase();
  // IC/committee check must precede "pitch" check — "ic-committee-pitch" must not
  // fall through to the whitepaper-pitch profile.
  if (intent.includes("committee") || intent.includes("ic-5min")) {
    return COMPOSITION_PROFILES["anavi-ic-5min"];
  }
  if (intent.includes("teaser") || intent.includes("punch")) {
    return COMPOSITION_PROFILES["anavi-teaser-30s"];
  }
  if (
    intent.includes("mini-ic") ||
    intent.includes("ic-brief") ||
    intent.includes("walkthrough")
  ) {
    return COMPOSITION_PROFILES["anavi-walkthrough-90s"];
  }
  if (intent.includes("whitepaper") || intent.includes("pitch")) {
    return COMPOSITION_PROFILES["anavi-whitepaper-pitch-90s"];
  }
  if (
    intent.includes("showcase") ||
    intent.includes("product-showcase") ||
    intent.includes("landing")
  ) {
    return COMPOSITION_PROFILES["anavi-product-showcase-28s"];
  }
  if (intent.includes("narrative") || intent.includes("default")) {
    return COMPOSITION_PROFILES["anavi-default-60s"];
  }
  return COMPOSITION_PROFILES["anavi-default-60s"];
}

function shouldUseCopyBackend(previewMode = false) {
  if (previewMode) {
    return true;
  }
  const requestedBackend = (
    process.env.ANAVI_RENDER_BACKEND || ""
  ).toLowerCase();
  if (requestedBackend === "copy") {
    return true;
  }
  if (requestedBackend === "remotion") {
    return false;
  }
  return process.env.VITEST === "true" || process.env.NODE_ENV === "test";
}

function patchNetworkInterfacesForRestrictedRuntimes() {
  if (networkInterfacePatchApplied) {
    return;
  }

  const original = os.networkInterfaces.bind(os);
  const patched = () => {
    try {
      return original();
    } catch {
      return FALLBACK_LOOPBACK_INTERFACES;
    }
  };

  (os as typeof os & { networkInterfaces: typeof patched }).networkInterfaces =
    patched;
  networkInterfacePatchApplied = true;
}

function resolveBrowserExecutable() {
  for (const candidate of REMOTION_BROWSER_CANDIDATES) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  console.warn(
    "[render-hub] No local browser found — Remotion will attempt to download Chromium"
  );
  return null;
}

async function getRemotionServeUrl() {
  if (!remotionBundlePromise) {
    remotionBundlePromise = bundle({
      entryPoint: REMOTION_ENTRYPOINT,
      onProgress: () => undefined,
    });
  }
  return remotionBundlePromise;
}

function copyRenderArtifact(
  renderPath: string,
  profile: CompositionProfile
): RenderArtifactDetails {
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
  } else {
    fs.writeFileSync(
      renderPath,
      Buffer.from(
        "000000186674797069736F6D0000020069736F6D69736F32617663316D703432",
        "hex"
      )
    );
  }

  const sizeBytes = fs.existsSync(renderPath)
    ? fs.statSync(renderPath).size
    : 0;
  return {
    renderer: "copy",
    compositionId: profile.id,
    technical: {
      fps: profile.fps,
      width: profile.width,
      height: profile.height,
      durationSeconds: profile.durationSeconds,
      sizeBytes,
    },
  };
}

async function renderWithRemotion(
  renderPath: string,
  plan: ScenePlan,
  trustScore: number,
  profile: CompositionProfile
): Promise<RenderArtifactDetails> {
  patchNetworkInterfacesForRestrictedRuntimes();

  const serveUrl = await getRemotionServeUrl();
  const browserExecutable = resolveBrowserExecutable();
  const inputProps = {
    plan,
    trustScore,
    title: profile.title,
    subtitle: profile.subtitle,
  };

  const composition = await selectComposition({
    serveUrl,
    id: profile.id,
    inputProps,
    browserExecutable,
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: renderPath,
    inputProps,
    imageFormat: "jpeg",
    browserExecutable,
  });

  const sizeBytes = fs.existsSync(renderPath)
    ? fs.statSync(renderPath).size
    : 0;
  return {
    renderer: "remotion",
    compositionId: composition.id,
    technical: {
      fps: composition.fps,
      width: composition.width,
      height: composition.height,
      durationSeconds: composition.durationInFrames / composition.fps,
      sizeBytes,
    },
  };
}

function writeSidecar(
  renderPath: string,
  details: RenderArtifactDetails,
  plan: ScenePlan,
  trustScore: number
) {
  const sidecarPath = `${renderPath}.json`;
  try {
    fs.writeFileSync(
      sidecarPath,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          renderer: details.renderer,
          compositionId: details.compositionId,
          technical: details.technical,
          trustScore,
          plan,
        },
        null,
        2
      )}\n`,
      "utf8"
    );
  } catch (err) {
    console.error("[render-hub] Failed to write sidecar JSON:", err);
  }
}

async function writeRenderArtifacts(
  renderPath: string,
  plan: ScenePlan,
  trustScore: number,
  previewMode = false
) {
  ensureDir(renderPath);
  const profile = getProfileForPlan(plan);
  const details = shouldUseCopyBackend(previewMode)
    ? copyRenderArtifact(renderPath, profile)
    : await renderWithRemotion(renderPath, plan, trustScore, profile);
  writeSidecar(renderPath, details, plan, trustScore);
}

export async function renderPlanHub({
  plan,
  previewMode = false,
  threshold = DEFAULT_THRESHOLD,
  metadataPath = DEFAULT_METADATA_PATH,
}: RenderHubOptions): Promise<RenderHubResult> {
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
    await writeRenderArtifacts(
      entry.lastRenderPath,
      plan,
      trustScore,
      previewMode
    );
  } else {
    reasons.push("using cache");
    entry.lastRenderPath = cached?.lastRenderPath ?? renderPath;
    if (!fs.existsSync(entry.lastRenderPath)) {
      await writeRenderArtifacts(entry.lastRenderPath, plan, trustScore);
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

function isDirectRun() {
  const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return fileURLToPath(import.meta.url) === invokedPath;
}

if (isDirectRun()) {
  const previewMode = process.argv.includes("--preview");
  const plan: ScenePlan = {
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
    metadata: {
      trustScore: 0.92,
      intent: "whitepaper-pitch",
    },
  };

  renderPlanHub({ plan, previewMode })
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}
