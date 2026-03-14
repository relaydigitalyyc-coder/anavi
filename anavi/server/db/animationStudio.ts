import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type NanoBananaAsset,
  generateGeminiAsset,
} from "../../scripts/nano-banana";
import {
  type PlanMetadataEntry,
  renderPlanHub,
} from "../../scripts/render-hub";
import { type ScenePlan, diffScore } from "../../scripts/scene-plan";

export type AnimationStudioSettings = {
  emotionDepth: number;
  scenePacing: number;
  renderFidelity: number;
  rerenderThreshold: number;
  trustScoreFloor: number;
  previewMode: boolean;
  overrideGate: boolean;
  intentTag: string;
};

export type AnimationStudioValidation = {
  diffScore: number;
  threshold: number;
  shouldRender: boolean;
  blockedByGate: boolean;
  reason: string;
};

export type AnimationStudioSummary = {
  settings: AnimationStudioSettings;
  lastRender: {
    path: string;
    lastUpdated: string;
    diffScore: number;
    trustScore: number;
  } | null;
  lastGeminiAsset: {
    assetId: string;
    intentTag: string;
    createdAt: string;
    geminiVersion: string;
    trustScore: number;
  } | null;
  validation: AnimationStudioValidation;
};

export type RenderJobState =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled";

export type RenderJob = {
  jobId: string;
  userId: number;
  state: RenderJobState;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  settings: AnimationStudioSettings;
  reason?: string;
  renderPath?: string;
  planHash?: string | null;
  error?: { message: string; stack?: string } | null;
};

type RenderJobLedger = Record<string, RenderJob>;

export const ANIMATION_STUDIO_INVESTOR_PRESET_IDS = [
  "teaser_30s",
  "walkthrough_90s",
  "ic_5min",
] as const;

export type AnimationStudioInvestorPresetId =
  (typeof ANIMATION_STUDIO_INVESTOR_PRESET_IDS)[number];

export type AnimationStudioInvestorPreset = {
  id: AnimationStudioInvestorPresetId;
  name: string;
  durationLabel: string;
  objective: string;
  targetAudience: string;
  narrativePillars: string[];
  recommendedSettings: AnimationStudioSettings;
};

export type ApplyInvestorPresetResult = {
  preset: AnimationStudioInvestorPreset;
  settings: AnimationStudioSettings;
  claudeContext: ClaudeContextPayload;
};

export type ExportAnimationStudioAssetPackInput = {
  presetId?: AnimationStudioInvestorPresetId;
  settings: AnimationStudioSettings;
  includeNarrative?: boolean;
  useClaude?: boolean;
};

export type ExportAnimationStudioAssetPackResult = {
  packId: string;
  presetId: AnimationStudioInvestorPresetId | "custom";
  packDirectory: string;
  manifestPath: string;
  narrativePath: string;
  claudeContextPath: string;
  renderPath: string;
  geminiAssetId: string;
  narrativeProvider: "claude" | "fallback";
  files: string[];
};

export type PackHistoryEntry = {
  packId: string;
  generatedAt: string;
  presetId: string;
  narrativeProvider: "claude" | "fallback";
  readyToPublish: boolean;
  packDirectory: string;
  files: number;
};

type PlanMetadataLedger = Record<string, PlanMetadataEntry>;
type GeminiAssetLedger = Record<string, NanoBananaAsset>;

type ClaudeContextPayload = {
  platform: "ANAVI";
  objective: string;
  presetId: AnimationStudioInvestorPresetId | "custom";
  requiredTerminology: string[];
  settings: AnimationStudioSettings;
  validation: AnimationStudioValidation;
  render: {
    shouldRender: boolean;
    reason: string;
    renderPath: string;
  };
  geminiAsset: {
    assetId: string;
    intentTag: string;
    trustScore: number;
    attribution: string;
  };
  plan: ScenePlan;
  designLanguage: {
    colors: Record<string, string>;
    typography: { heading: string; body: string; mono: string };
    animationPatterns: string[];
    backgroundLayers: string[];
  };
  landingPageSections: Array<{
    order: number;
    id: string;
    name: string;
    visual: string;
    keyElements: string[];
  }>;
  demoFlow: {
    entry: string;
    personas: Record<string, { screens: string[]; routes: string[] }>;
    fixtures: string;
  };
  availableRemotionScenes: Array<{
    id: string;
    label: string;
    accentColor: string;
    visual: string;
  }>;
  copyConstants: {
    platform: { tagline: string; thesis: string; market: string };
    problems: Record<string, { stat: string; headline: string; body: string }>;
    personas: Record<
      string,
      {
        label: string;
        role: string;
        problem: string;
        answer: string;
        tourPitch: string;
      }
    >;
    heroTypewriter: string[];
    dashboardWidgets: string[];
  };
};

type GeneratedNarrative = {
  provider: "claude" | "fallback";
  headline: string;
  oneLiner: string;
  voiceoverScript: string;
  storyboard: Array<{ title: string; beat: string }>;
  callToAction: string;
  social: {
    xThread: string;
    linkedIn: string;
    youtubeDescription: string;
  };
};

const DEFAULT_SETTINGS: AnimationStudioSettings = {
  emotionDepth: 62,
  scenePacing: 58,
  renderFidelity: 74,
  rerenderThreshold: 40,
  trustScoreFloor: 72,
  previewMode: false,
  overrideGate: false,
  intentTag: "blind-matching-narrative",
};

const REQUIRED_TERMINOLOGY = [
  "Relationship Custody",
  "Trust Score",
  "Blind Matching",
  "Deal Room",
  "Attribution",
  "Intent",
];

const MODULE_DIR =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_PLAN_METADATA_PATH = process.env.ANAVI_PLAN_METADATA_PATH
  ? path.resolve(process.env.ANAVI_PLAN_METADATA_PATH)
  : path.resolve(MODULE_DIR, "..", "..", "data", "plan-metadata.json");

const DEFAULT_GEMINI_LEDGER_PATH = process.env.ANAVI_GEMINI_LEDGER_PATH
  ? path.resolve(process.env.ANAVI_GEMINI_LEDGER_PATH)
  : path.resolve(MODULE_DIR, "..", "..", "data", "ai-assets.json");

const DEFAULT_ASSET_PACKS_DIR = process.env.ANAVI_ASSET_PACKS_DIR
  ? path.resolve(process.env.ANAVI_ASSET_PACKS_DIR)
  : path.resolve(MODULE_DIR, "..", "..", "data", "asset-packs");

const DEFAULT_RENDER_JOBS_PATH = process.env.ANAVI_RENDER_JOBS_PATH
  ? path.resolve(process.env.ANAVI_RENDER_JOBS_PATH)
  : path.resolve(MODULE_DIR, "..", "..", "data", "render-jobs.json");

const INVESTOR_PRESETS: AnimationStudioInvestorPreset[] = [
  {
    id: "teaser_30s",
    name: "Investor Teaser 30s",
    durationLabel: "00:30",
    objective:
      "Create urgency with a high-velocity investor teaser centered on Trust Score proof.",
    targetAudience: "First-look angels and strategic scouts",
    narrativePillars: [
      "Relationship Custody proves counterparties before intro.",
      "Blind Matching reveals only qualified Intent overlap.",
      "Deal Room opens with Attribution certainty and auditability.",
    ],
    recommendedSettings: {
      emotionDepth: 72,
      scenePacing: 84,
      renderFidelity: 78,
      rerenderThreshold: 28,
      trustScoreFloor: 76,
      previewMode: false,
      overrideGate: false,
      intentTag: "investor-teaser-30s",
    },
  },
  {
    id: "walkthrough_90s",
    name: "Platform Walkthrough 90s",
    durationLabel: "01:30",
    objective:
      "Explain the complete ANAVI investor journey from Intent to Deal Room in clear sequence.",
    targetAudience: "Institutional allocators and family office teams",
    narrativePillars: [
      "Relationship Custody turns fragmented diligence into shared certainty.",
      "Trust Score and Blind Matching reduce low-probability introductions.",
      "Deal Room timeline and Attribution economics stay visible end-to-end.",
    ],
    recommendedSettings: {
      emotionDepth: 65,
      scenePacing: 62,
      renderFidelity: 83,
      rerenderThreshold: 34,
      trustScoreFloor: 80,
      previewMode: false,
      overrideGate: false,
      intentTag: "investor-walkthrough-90s",
    },
  },
  {
    id: "ic_5min",
    name: "Investment Committee 5m",
    durationLabel: "05:00",
    objective:
      "Deliver an investment-committee-ready narrative with risk controls and measurable outcomes.",
    targetAudience: "IC partners, CIOs, and due-diligence leads",
    narrativePillars: [
      "Relationship Custody compresses compliance cycle time.",
      "Trust Score policy enforces quality gates before meetings.",
      "Deal Room + Attribution generate defensible execution history.",
    ],
    recommendedSettings: {
      emotionDepth: 58,
      scenePacing: 38,
      renderFidelity: 90,
      rerenderThreshold: 46,
      trustScoreFloor: 86,
      previewMode: false,
      overrideGate: false,
      intentTag: "investor-ic-5min",
    },
  },
];

function clamp01(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 1);
}

function normalizeThreshold(threshold: number) {
  return clamp01(threshold / 100);
}

function sanitizePercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function ensureDirForFile(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return fallback;
    }
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown) {
  ensureDirForFile(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath: string, content: string) {
  ensureDirForFile(filePath);
  fs.writeFileSync(filePath, content, "utf8");
}

function loadPlanLedger(metadataPath = DEFAULT_PLAN_METADATA_PATH) {
  return readJson<PlanMetadataLedger>(metadataPath, {});
}

function loadGeminiLedger(metadataPath = DEFAULT_GEMINI_LEDGER_PATH) {
  return readJson<GeminiAssetLedger>(metadataPath, {});
}

function loadRenderJobs(pathOverride = DEFAULT_RENDER_JOBS_PATH) {
  return readJson<RenderJobLedger>(pathOverride, {});
}

function writeRenderJobs(
  ledger: RenderJobLedger,
  pathOverride = DEFAULT_RENDER_JOBS_PATH
) {
  writeJson(pathOverride, ledger);
}

function getLatestPlanMetadataEntry(ledger: PlanMetadataLedger) {
  return Object.values(ledger)
    .sort((a, b) => {
      const aTime = Date.parse(a.lastUpdated);
      const bTime = Date.parse(b.lastUpdated);
      return bTime - aTime;
    })
    .at(0);
}

function getLatestGeminiAssetEntry(ledger: GeminiAssetLedger) {
  return Object.values(ledger)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .at(0);
}

function parsePlanSnapshot(snapshot: string | undefined) {
  if (!snapshot) {
    return null;
  }

  try {
    const parsed = JSON.parse(snapshot) as ScenePlan;
    if (!Array.isArray(parsed.scenes) || !parsed.metadata) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function buildScenePlan(settings: AnimationStudioSettings): ScenePlan {
  const pacingProfile =
    settings.scenePacing >= 72
      ? "accelerated"
      : settings.scenePacing <= 35
        ? "deliberate"
        : "balanced";

  const fidelityProfile =
    settings.renderFidelity >= 85
      ? "institutional-grade fidelity"
      : settings.renderFidelity >= 70
        ? "presentation fidelity"
        : "fast iteration fidelity";

  const scenes: ScenePlan["scenes"] = [
    {
      id: "relationship-custody",
      description: `Relationship Custody opener with ${fidelityProfile}.`,
    },
    {
      id: "trust-score",
      description: `Trust Score gate reveal with ${pacingProfile} cadence.`,
    },
    {
      id: "blind-matching",
      description: `Blind Matching sequence showing qualified Intent overlap.`,
    },
    {
      id: "deal-room-attribution",
      description: `Deal Room close featuring Attribution trace and investor CTA.`,
    },
  ];

  if (settings.renderFidelity >= 82 || settings.emotionDepth >= 75) {
    scenes.push({
      id: "investor-close",
      description: "Investor close with quantified outcomes and next-step ask.",
    });
  }

  return {
    scenes,
    metadata: {
      trustScore: clamp01(settings.trustScoreFloor / 100),
      intent: settings.intentTag,
    },
  };
}

function evaluatePlan(settings: AnimationStudioSettings) {
  const plan = buildScenePlan(settings);
  const ledger = loadPlanLedger();
  const latestMetadata = getLatestPlanMetadataEntry(ledger) ?? null;
  const baselinePlan = parsePlanSnapshot(latestMetadata?.planSnapshot);
  const threshold = normalizeThreshold(settings.rerenderThreshold);
  const planDiff = baselinePlan ? clamp01(diffScore(plan, baselinePlan)) : 1;

  const previewBypass = settings.previewMode;
  const overrideBypass = settings.overrideGate;
  const blockedByGate =
    !previewBypass && !overrideBypass && planDiff < threshold;
  const shouldRender =
    previewBypass || overrideBypass || !baselinePlan || planDiff >= threshold;

  let reason = "No baseline render metadata. Render is allowed.";
  if (previewBypass) {
    reason = "Preview mode bypasses rerender gate.";
  } else if (overrideBypass) {
    reason = "Override gate enabled. Render is allowed below threshold.";
  } else if (baselinePlan && blockedByGate) {
    reason = `Diff ${planDiff.toFixed(2)} is below gate ${threshold.toFixed(2)}.`;
  } else if (baselinePlan) {
    reason = `Diff ${planDiff.toFixed(2)} meets gate ${threshold.toFixed(2)}.`;
  }

  const validation: AnimationStudioValidation = {
    diffScore: planDiff,
    threshold,
    shouldRender,
    blockedByGate,
    reason,
  };

  return {
    plan,
    latestMetadata,
    validation,
  };
}

function getPresetOrThrow(presetId: AnimationStudioInvestorPresetId) {
  const preset = INVESTOR_PRESETS.find(entry => entry.id === presetId);
  if (!preset) {
    throw new Error(`Unknown investor preset: ${presetId}`);
  }
  return preset;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function sceneTitleFromId(sceneId: string) {
  return sceneId
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toSrtTimestamp(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    secs
  ).padStart(2, "0")},000`;
}

function buildFallbackNarrative(
  context: ClaudeContextPayload,
  preset: AnimationStudioInvestorPreset | null
): GeneratedNarrative {
  const presetPillars = preset?.narrativePillars ?? [
    "Relationship Custody becomes a reusable trust layer.",
    "Blind Matching turns Intent overlap into qualified deal momentum.",
    "Deal Room and Attribution keep execution and economics transparent.",
  ];

  const headline = preset
    ? `${preset.name}: ANAVI ${context.settings.intentTag}`
    : `ANAVI Investor Narrative: ${context.settings.intentTag}`;

  const oneLiner =
    "ANAVI converts fragmented private-market workflows into Trust Score-driven execution from Relationship Custody to Deal Room.";

  const voiceoverScript = [
    "ANAVI starts with Relationship Custody, proving counterparties before introductions.",
    "Trust Score policy then governs which Intent combinations reach Blind Matching.",
    "Only qualified opportunities enter the Deal Room, where every action is auditable.",
    "Attribution remains visible through close, so value creation and economics stay aligned.",
    "For investors, this means faster diligence, fewer dead-end meetings, and higher-confidence deployment.",
  ].join(" ");

  const storyboard = context.plan.scenes.map((scene, index) => ({
    title: `${index + 1}. ${sceneTitleFromId(scene.id)}`,
    beat: scene.description,
  }));

  const callToAction =
    "Invite your investment committee to a live ANAVI walkthrough and review Trust Score-gated pipeline in real time.";

  const xThread = [
    "1/ Private markets still run on fragmented diligence and unverifiable intros.",
    "2/ ANAVI starts with Relationship Custody so counterparties are verified once, not repeatedly.",
    "3/ Trust Score + Blind Matching route only qualified Intent overlap to operators and allocators.",
    "4/ Deal Room + Attribution keep execution and economics auditable through close.",
    "5/ Result: faster diligence, cleaner pipeline, better investor confidence.",
  ].join("\n");

  const linkedIn = [
    "Most private-market workflows still break between sourcing and diligence.",
    "",
    "ANAVI fixes this by linking:",
    "• Relationship Custody",
    "• Trust Score policy gates",
    "• Blind Matching qualification",
    "• Deal Room execution",
    "• Attribution accountability",
    "",
    "The outcome is simple: investor teams spend less time validating context and more time allocating capital.",
    "",
    "If you’re evaluating infrastructure that can scale your private-market pipeline with fewer false positives, this is worth a closer look.",
  ].join("\n");

  const youtubeDescription = [
    "ANAVI investor demo",
    "",
    "This walkthrough shows how ANAVI links Relationship Custody, Trust Score policy, Blind Matching, Deal Room workflows, and Attribution.",
    "",
    "Who this is for:",
    "- Family offices",
    "- Institutional allocators",
    "- Capital formation teams",
    "",
    "Key outcome: qualified Intent moves faster with cleaner diligence.",
  ].join("\n");

  return {
    provider: "fallback",
    headline,
    oneLiner,
    voiceoverScript,
    storyboard:
      storyboard.length > 0
        ? storyboard
        : presetPillars.map((pillar, index) => ({
            title: `Beat ${index + 1}`,
            beat: pillar,
          })),
    callToAction,
    social: {
      xThread,
      linkedIn,
      youtubeDescription,
    },
  };
}

function extractJsonObject(rawText: string) {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]) as Partial<GeneratedNarrative>;
  } catch {
    return null;
  }
}

async function generateNarrative(
  context: ClaudeContextPayload,
  preset: AnimationStudioInvestorPreset | null,
  useClaude: boolean
) {
  const fallback = buildFallbackNarrative(context, preset);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!useClaude || !apiKey) {
    return fallback;
  }

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1800,
      system:
        "You write investor-grade launch narratives for ANAVI. Return strict JSON only with keys: headline, oneLiner, voiceoverScript, storyboard (array of {title, beat}), callToAction, social ({xThread, linkedIn, youtubeDescription}). Keep terminology exact: Relationship Custody, Trust Score, Blind Matching, Deal Room, Attribution, Intent.",
      messages: [
        {
          role: "user",
          content: `Build an investor-ready animation asset narrative from this context:\n${JSON.stringify(
            context,
            null,
            2
          )}`,
        },
      ],
    });

    const textBlock = response.content.find(block => block.type === "text");
    const parsed = textBlock ? extractJsonObject(textBlock.text) : null;

    if (
      !parsed?.headline ||
      !parsed?.oneLiner ||
      !parsed?.voiceoverScript ||
      !parsed?.callToAction ||
      !parsed?.social
    ) {
      return fallback;
    }

    return {
      provider: "claude" as const,
      headline: parsed.headline,
      oneLiner: parsed.oneLiner,
      voiceoverScript: parsed.voiceoverScript,
      storyboard:
        Array.isArray(parsed.storyboard) && parsed.storyboard.length > 0
          ? parsed.storyboard
          : fallback.storyboard,
      callToAction: parsed.callToAction,
      social: {
        xThread: parsed.social.xThread ?? fallback.social.xThread,
        linkedIn: parsed.social.linkedIn ?? fallback.social.linkedIn,
        youtubeDescription:
          parsed.social.youtubeDescription ??
          fallback.social.youtubeDescription,
      },
    };
  } catch {
    return fallback;
  }
}

function buildCaptionsSrt(
  narrative: GeneratedNarrative,
  durationSeconds: number
) {
  const captionLines = narrative.voiceoverScript
    .split(/[.!?]\s+/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (captionLines.length === 0) {
    return "1\n00:00:00,000 --> 00:00:05,000\nANAVI Investor Narrative\n";
  }

  const segment = Math.max(
    1,
    Math.floor(durationSeconds / captionLines.length)
  );

  return captionLines
    .map((line, index) => {
      const start = index * segment;
      const end =
        index === captionLines.length - 1
          ? durationSeconds
          : Math.min(durationSeconds, start + segment);

      return `${index + 1}\n${toSrtTimestamp(start)} --> ${toSrtTimestamp(end)}\n${line}\n`;
    })
    .join("\n");
}

function buildNarrativeMarkdown(
  narrative: GeneratedNarrative,
  preset: AnimationStudioInvestorPreset | null
) {
  const storyboard = narrative.storyboard
    .map((entry, index) => `${index + 1}. **${entry.title}** — ${entry.beat}`)
    .join("\n");

  return [
    `# ${narrative.headline}`,
    "",
    `**Preset:** ${preset?.name ?? "Custom"}  `,
    `**One-liner:** ${narrative.oneLiner}`,
    "",
    "## Voiceover Script",
    narrative.voiceoverScript,
    "",
    "## Storyboard Beats",
    storyboard,
    "",
    "## CTA",
    narrative.callToAction,
    "",
  ].join("\n");
}

function buildStoryboardMarkdown(plan: ScenePlan) {
  const rows = plan.scenes
    .map((scene, index) => {
      return `| ${index + 1} | ${sceneTitleFromId(scene.id)} | ${scene.description} |`;
    })
    .join("\n");

  return [
    "# Storyboard",
    "",
    "| Beat | Scene | Purpose |",
    "| --- | --- | --- |",
    rows || "| 1 | Intro | Placeholder beat |",
    "",
  ].join("\n");
}

function buildRemotionPromptContext(): Pick<
  ClaudeContextPayload,
  | "designLanguage"
  | "landingPageSections"
  | "demoFlow"
  | "availableRemotionScenes"
  | "copyConstants"
> {
  return {
    designLanguage: {
      colors: {
        bg: "#060A12",
        navy: "#071227",
        deep: "#0A1628",
        electric: "#0EA5E9",
        electricDim: "#0369A1",
        electricLight: "#7DD3FC",
        gold: "#C4972A",
        goldLight: "#E5C15E",
        emerald: "#10B981",
        green: "#00FF41",
        greenDim: "#00AA22",
        purple: "#7C3AED",
        purpleLight: "#C4B5FD",
        white: "#FFFFFF",
      },
      typography: {
        heading: "Inter, SF Pro Display, system-ui, sans-serif",
        body: "Inter, SF Pro Display, system-ui, sans-serif",
        mono: "JetBrains Mono, IBM Plex Mono, Courier New, monospace",
      },
      animationPatterns: [
        "spring-based entrances (damping 14-16, stiffness 80-100)",
        "parallax float (sin/cos oscillation, 5-6px amplitude)",
        "cipher/matrix rain overlays on dark backgrounds",
        "corner bracket HUD framing with breathing opacity",
        "vertical scanner line sweep (4.8s period)",
        "rotating tech rings at varying radii and speeds",
        "floating geometric particles (triangles + hexagons)",
        "periodic glitch effect (skew + hue shift, every ~5.8s)",
        "gradient mesh backgrounds with noise texture",
        "scroll-driven reveal with stagger delays",
      ],
      backgroundLayers: [
        "linear-gradient(160deg, #060A12, #071227 50%, #0C1830)",
        "MatrixRain — falling green monospace characters",
        "RotatingTechRings — concentric dashed circles at varying speeds",
        "FloatingParticles — drifting triangles and hexagons",
        "VerticalScannerLine — green gradient sweep left-to-right",
        "CornerBrackets — animated HUD-style corner framing",
        "GlitchWrapper — periodic skew + hue-rotate + scan lines",
      ],
    },
    landingPageSections: [
      {
        order: 1,
        id: "hero",
        name: "HeroSection",
        visual:
          "Full-viewport gradient mesh with noise overlay. HUD status panel (top-right) shows Trust Score, verification status, and ANAVI branding. Animated headline 'Custody Your Relationships' with typewriter rotating subtext. Two CTA buttons. Desktop: interactive 3D globe with connection arcs. Mobile: 2x2 stats grid. Scroll indicator at bottom.",
        keyElements: [
          "gradient mesh background",
          "interactive globe with city markers and arcs",
          "typewriter text rotation",
          "HUD status panel",
          "floating stat counters",
        ],
      },
      {
        order: 2,
        id: "marquee",
        name: "MarqueeSection",
        visual:
          "Horizontal scrolling marquee of market segment labels: Family Offices, Venture Capital, Private Equity, Real Estate, Commodities, Infrastructure, etc.",
        keyElements: ["continuous horizontal scroll", "market segment labels"],
      },
      {
        order: 3,
        id: "problem",
        name: "ProblemSection",
        visual:
          "'Private Markets Are Broken' headline. Three problem cards: 5-15 intermediaries per deal, $40B annual fraud, $500K duplicated due diligence. Each card has a large stat, headline, and explanatory body text.",
        keyElements: [
          "3 stat cards with red/warning accents",
          "large numerical stats",
          "problem-solution framing",
        ],
      },
      {
        order: 4,
        id: "three-roles",
        name: "ThreeRolesSection",
        visual:
          "'Three Roles. One Operating System.' Three persona cards: Originator (relationship holder), Investor (capital deployer), Principal (supply side). Each shows role label, problem statement, and ANAVI's answer. Mock UI previews embedded.",
        keyElements: [
          "3 persona cards",
          "role-specific problem/answer pairs",
          "mock UI previews",
        ],
      },
      {
        order: 5,
        id: "stats-social",
        name: "StatsSocialSection",
        visual:
          "Four platform stats (2,100+ GP-LP relationships, $2.1B deal flow, 94% match accuracy, 340 Deal Rooms). Fund Intelligence section. Compliance market card ($34B). Social proof badges.",
        keyElements: [
          "animated counter stats",
          "fund intelligence widget",
          "compliance market data",
          "social proof badges",
        ],
      },
      {
        order: 6,
        id: "features",
        name: "FeaturesSection",
        visual:
          "Six feature cards: AI Deal Intelligence, Relationship Custody, Blind Matching, Secure Deal Rooms, Lifetime Attribution, Compliance Passport. Each card has icon, title, description. Image carousel showing feature screenshots.",
        keyElements: [
          "6 feature cards with icons",
          "image carousel",
          "feature descriptions",
        ],
      },
      {
        order: 7,
        id: "how-it-works",
        name: "HowItWorksSection",
        visual:
          "Four sequential steps: Connect (custody relationships), Analyze (Trust Score + verification), Match (blind matching engine), Close (Deal Room + attribution). Numbered steps with connecting flow.",
        keyElements: [
          "4-step numbered flow",
          "step descriptions",
          "connecting visual",
        ],
      },
      {
        order: 8,
        id: "platform-preview",
        name: "PlatformPreviewSection",
        visual:
          "Scroll-driven container animation revealing a dashboard mock. Shows sidebar navigation, Trust Score gauge, key stats, Deal Flow chart, and Activity feed. Dark UI with electric blue and gold accents.",
        keyElements: [
          "scroll-driven reveal animation",
          "dashboard mock with sidebar",
          "Trust Score gauge",
          "Deal Flow chart",
          "activity feed",
        ],
      },
      {
        order: 9,
        id: "trust",
        name: "TrustSection",
        visual:
          "Trust & Security section. Four security bullets: anonymous matching, end-to-end encryption, SOC 2 compliance, immutable audit logs. EvervaultCard component showing encrypted/blind card visual.",
        keyElements: [
          "security bullet points",
          "EvervaultCard encrypted visual",
          "trust messaging",
        ],
      },
      {
        order: 10,
        id: "testimonials",
        name: "TestimonialCarouselSection",
        visual:
          "Featured pull quote with large quotation marks. Three testimonial cards from: David Rothschild (family office), Katherine Wei (venture capital), Marcus Okonkwo (originator). Each has photo, name, role, and quote.",
        keyElements: [
          "featured quote",
          "3 testimonial cards",
          "names and roles",
        ],
      },
      {
        order: 11,
        id: "pricing",
        name: "EnterprisePricingSection",
        visual:
          "Five product modules: Onboard, Decide, Lifecycle, Economics, Deal Rooms. Each module card shows features and capabilities. Enterprise plan card with pricing CTA.",
        keyElements: ["5 module cards", "enterprise plan card", "pricing CTA"],
      },
      {
        order: 12,
        id: "cta-footer",
        name: "CTAFooterSection",
        visual:
          "'Next Up' navigation links. Main CTA button for demo/access. Footer with Product, Platform, Company, Resources columns. ANAVI branding and copyright.",
        keyElements: [
          "main CTA button",
          "footer navigation columns",
          "branding",
        ],
      },
    ],
    demoFlow: {
      entry:
        "PersonaPicker overlay (from landing 'Enter Demo' button) or /demo route with PersonaSelector",
      personas: {
        originator: {
          screens: [
            "Dashboard (OriginatorDashboard)",
            "Custody Register",
            "Attribution Ledger",
            "Introduction Pipeline",
            "Relationships",
            "Deal Matching",
            "Payouts",
          ],
          routes: [
            "/dashboard",
            "/custody",
            "/attribution",
            "/pipeline",
            "/relationships",
            "/matching",
            "/payouts",
          ],
        },
        investor: {
          screens: [
            "Dashboard (InvestorDashboard)",
            "Deal Flow",
            "Portfolio",
            "Counterparty Intelligence",
            "Relationships",
            "Deal Matching",
            "Payouts",
          ],
          routes: [
            "/dashboard",
            "/deal-flow",
            "/portfolio",
            "/counterparty-intelligence",
            "/relationships",
            "/matching",
            "/payouts",
          ],
        },
        principal: {
          screens: [
            "Dashboard (PrincipalDashboard)",
            "Asset Register",
            "Demand Room",
            "Close Tracker",
            "Relationships",
            "Deal Matching",
            "Payouts",
          ],
          routes: [
            "/dashboard",
            "/assets",
            "/demand",
            "/close",
            "/relationships",
            "/matching",
            "/payouts",
          ],
        },
      },
      fixtures:
        "Demo uses demoFixtures.ts with scenario variants: baseline, momentum, closing. Each persona gets fixture data for relationships, matches, deals, and payouts without tRPC calls.",
    },
    availableRemotionScenes: [
      {
        id: "problem-statement",
        label: "Market Problem",
        accentColor: "#EF4444",
        visual:
          "Animated broker chain (Originator → 4 intermediaries → Principal) with cascading fee deductions. Stats grid: $40B+ fraud, 5-15 intermediaries, $500K due diligence, 0% originator protection.",
      },
      {
        id: "relationship-custody",
        label: "Relationship Custody",
        accentColor: "#0EA5E9",
        visual:
          "3D globe with city markers and flowing arc connections. Counter animates to 4,200 verified relationships. Radial gradient background.",
      },
      {
        id: "trust-score",
        label: "Trust Score",
        accentColor: "#10B981",
        visual:
          "Circular gauge animating to 94. Three tier badges: BASIC, ENHANCED, INSTITUTIONAL. Verification checklist: KYB, OFAC, Accreditation, Peer Reviews, Transaction History.",
      },
      {
        id: "blind-matching",
        label: "Blind Matching",
        accentColor: "#7C3AED",
        visual:
          "Two anonymous circles (INVESTOR + OPPORTUNITY) converging. Cipher text overlay scrolling behind. 'MATCH FOUND' reveal with gold glow. Counter: 143 active blind matches.",
      },
      {
        id: "deal-room",
        label: "Deal Room",
        accentColor: "#0EA5E9",
        visual:
          "Compliance checklist (AML/KYC, Sanctions, NDA, Diligence, Escrow) with animated checks. 3D-perspective deal card: $12.5M Series B, progress bar to 82%. Counter: 47 active deal rooms.",
      },
      {
        id: "attribution",
        label: "Lifetime Attribution",
        accentColor: "#C4972A",
        visual:
          "Four-node chain: Originator → Introduction → Deal Closed → Attribution. Large 60% originator share counter. $47,200 earnings counter. Footer: 'Lifetime · Compounding · Circumvention-Detected · Automated'.",
      },
      {
        id: "market-opportunity",
        label: "Market Opportunity",
        accentColor: "#C4972A",
        visual:
          "Horizontal bar chart: Private Markets $13T→$25T, Family Office $3.1T→$5.4T, Commodities $142T→$163T, Oil & Gas $7.4T→$10.4T. 2024 vs 2030 projections. Bloomberg tagline.",
      },
    ],
    copyConstants: {
      platform: {
        tagline: "The Private Market Operating System",
        thesis:
          "If Bloomberg runs public markets, ANAVI will run private ones.",
        market: "$13 trillion private market",
      },
      problems: {
        brokerChain: {
          stat: "5–15",
          headline: "Intermediaries Per Deal",
          body: "5 to 15 intermediaries per deal. Each extracting 1–5%. The originator receives no attribution, no compounding value, and no protection if they're cut out.",
        },
        fraud: {
          stat: "$40B",
          headline: "Annual Fraud Losses",
          body: "$10 to $40 billion in annual US investment fraud losses. Identity verification across private markets is fragmented, unshared, and trivially forged.",
        },
        dueDiligence: {
          stat: "$500K",
          headline: "Duplicated Per Deal",
          body: "$50,000 to $500,000 per deal in duplicated compliance costs. Every investor runs the same KYC, OFAC, accreditation checks independently.",
        },
      },
      personas: {
        originator: {
          label: "Deal Originator / Broker",
          role: "Relationship Holder",
          problem: "My introductions close deals I never get credit for.",
          answer:
            "Custody your relationships. Timestamp your introductions. Collect your attribution.",
          tourPitch:
            "You made 847 introductions last year. ANAVI would have attributed every one.",
        },
        investor: {
          label: "Investor / Family Office",
          role: "Capital Deployer",
          problem:
            "I can't tell which deals are real or who's already seen them.",
          answer:
            "Verified counterparties. Blind matching. Mutual consent before any disclosure.",
          tourPitch:
            "You reviewed 40 deals. ANAVI would have verified every counterparty before you saw the first deck.",
        },
        principal: {
          label: "Principal / Asset Owner",
          role: "Supply Side",
          problem:
            "Raising capital means exposing my thesis before anyone commits.",
          answer:
            "Seal your asset. Match anonymously. Disclose only on consent.",
          tourPitch:
            "You raised $30M. ANAVI protected your thesis until the moment you chose to disclose it.",
        },
      },
      heroTypewriter: [
        "Prove deal flow quality. Match GPs to LPs with 94% accuracy.",
        "Cut $34B in KYC/KYB friction. 10x faster onboarding.",
        "Verified counterparties before you see the first deck.",
        "Your introductions. Your attribution. Your economics.",
        "847 intros last year — ANAVI would have attributed every one.",
        "Custody your relationships. Timestamp. Collect.",
        "Relationship Custody for the $13T private market.",
        "Blind Matching: intent-based, anonymized until consent.",
        "Trust Score-gated infrastructure from NDA to close.",
      ],
      dashboardWidgets: [
        "Trust Score (gauge + breakdown CTA)",
        "Market Depth (buyers/sellers)",
        "Blind Matches (sealed status)",
        "Deal Rooms (documents, audit events, escrow)",
        "Compliance Status (KYB, OFAC, AML passport)",
        "Economics Engine (next payout, lifetime attribution, originator share)",
        "Active Intents",
        "Relationship Custody (custody age, attribution cue)",
      ],
    },
  };
}

function buildClaudeContextPayload(input: {
  settings: AnimationStudioSettings;
  preset: AnimationStudioInvestorPreset | null;
  plan: ScenePlan;
  validation: AnimationStudioValidation;
  renderResult: {
    shouldRender: boolean;
    reason: string;
    renderPath: string;
  };
  geminiAsset: NanoBananaAsset;
}): ClaudeContextPayload {
  const presetId: ClaudeContextPayload["presetId"] =
    input.preset?.id ?? "custom";
  const promptContext = buildRemotionPromptContext();

  return {
    platform: "ANAVI" as const,
    objective:
      input.preset?.objective ??
      "Produce investor sales and marketing assets from a Trust Score-aware animation flow.",
    presetId,
    requiredTerminology: REQUIRED_TERMINOLOGY,
    settings: input.settings,
    validation: input.validation,
    render: {
      shouldRender: input.renderResult.shouldRender,
      reason: input.renderResult.reason,
      renderPath: input.renderResult.renderPath,
    },
    geminiAsset: {
      assetId: input.geminiAsset.assetId,
      intentTag: input.geminiAsset.intentTag,
      trustScore: input.geminiAsset.trustScore,
      attribution: input.geminiAsset.attribution,
    },
    plan: input.plan,
    ...promptContext,
  };
}

function makePackId(
  settings: AnimationStudioSettings,
  presetId: AnimationStudioInvestorPresetId | "custom"
) {
  const prefix = presetId === "custom" ? "custom" : presetId;
  const intentSlug = slugify(settings.intentTag || "intent");
  return `${prefix}-${intentSlug || "intent"}-${Date.now()}`;
}

function normalizeRelativePath(filePath: string, baseDir: string) {
  return path.relative(baseDir, filePath).split(path.sep).join("/");
}

function resolveSettings(settings: AnimationStudioSettings) {
  return {
    emotionDepth: sanitizePercent(settings.emotionDepth),
    scenePacing: sanitizePercent(settings.scenePacing),
    renderFidelity: sanitizePercent(settings.renderFidelity),
    rerenderThreshold: sanitizePercent(settings.rerenderThreshold),
    trustScoreFloor: sanitizePercent(settings.trustScoreFloor),
    previewMode: !!settings.previewMode,
    overrideGate: !!settings.overrideGate,
    intentTag: String(settings.intentTag || "").slice(0, 120),
  } satisfies AnimationStudioSettings;
}

export function getAnimationStudioInvestorPresets() {
  return INVESTOR_PRESETS;
}

export async function applyAnimationStudioInvestorPreset(input: {
  presetId: AnimationStudioInvestorPresetId;
}): Promise<ApplyInvestorPresetResult> {
  const preset = getPresetOrThrow(input.presetId);
  const settings = resolveSettings(preset.recommendedSettings);
  const validation = validateAnimationStudioPlan(settings);
  const renderResult = await runAnimationStudioRender({
    ...settings,
    previewMode: true,
  });
  const plan = buildScenePlan(settings);

  const geminiAsset = requestAnimationStudioGeminiAsset({
    intentTag: settings.intentTag,
    trustScoreFloor: settings.trustScoreFloor,
  });

  const claudeContext = buildClaudeContextPayload({
    settings,
    preset,
    plan,
    validation,
    renderResult: {
      shouldRender: renderResult.shouldRender,
      reason: renderResult.reason,
      renderPath: renderResult.renderPath,
    },
    geminiAsset,
  });

  return { preset, settings, claudeContext };
}

export function validateAnimationStudioPlan(
  settingsInput: AnimationStudioSettings
) {
  const settings = resolveSettings(settingsInput);
  return evaluatePlan(settings).validation;
}

export async function runAnimationStudioRender(
  settingsInput: AnimationStudioSettings
) {
  const settings = resolveSettings(settingsInput);
  const evaluation = evaluatePlan(settings);

  if (evaluation.validation.blockedByGate && evaluation.latestMetadata) {
    return {
      shouldRender: false,
      reason: `${evaluation.validation.reason}, gate-blocked, using-cache`,
      metadata: evaluation.latestMetadata,
      renderPath: evaluation.latestMetadata.lastRenderPath,
    };
  }

  const renderResult = await renderPlanHub({
    plan: evaluation.plan,
    previewMode: settings.previewMode,
    threshold: evaluation.validation.threshold,
    metadataPath: DEFAULT_PLAN_METADATA_PATH,
  });

  const reasonParts = new Set(
    renderResult.reason
      .split(",")
      .map(part => part.trim())
      .filter(Boolean)
  );

  if (settings.previewMode) {
    reasonParts.add("preview-bypass");
  }
  if (settings.overrideGate) {
    reasonParts.add("override-enabled");
  }

  return {
    ...renderResult,
    reason: Array.from(reasonParts).join(", "),
  };
}

export function queueAnimationStudioRenderJob(input: {
  userId: number;
  settings: AnimationStudioSettings;
  simulateFailure?: boolean;
}) {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const job: RenderJob = {
    jobId,
    userId: input.userId,
    state: "queued",
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
    settings: resolveSettings(input.settings),
    error: null,
  };

  const ledger = loadRenderJobs();
  ledger[jobId] = job as RenderJob & { simulateFailure?: boolean };
  // Store simulateFailure as a transient hint (won't persist on read)
  (ledger as any)[jobId].simulateFailure = !!input.simulateFailure;
  writeRenderJobs(ledger);
  return job;
}

function getOwnedRenderJob(
  ledger: RenderJobLedger,
  jobId: string,
  userId: number
) {
  const job = ledger[jobId];
  if (!job || job.userId !== userId) return null;
  return job;
}

export async function startAnimationStudioRenderJob(jobId: string, userId: number) {
  const ledger = loadRenderJobs();
  const job = getOwnedRenderJob(ledger, jobId, userId);
  if (!job) {
    throw new Error(`Unknown render job: ${jobId}`);
  }
  if (job.state === "canceled") {
    return job;
  }

  job.state = "running";
  job.updatedAt = new Date().toISOString();
  writeRenderJobs(ledger);

  try {
    const simulateFailure = !!(ledger as any)[jobId]?.simulateFailure;
    if (simulateFailure) {
      throw new Error("Simulated render failure for test");
    }

    const result = await runAnimationStudioRender(job.settings);
    job.state = "succeeded";
    job.updatedAt = new Date().toISOString();
    job.reason = result.reason;
    job.renderPath = result.renderPath;
    job.planHash = (result as any).metadata?.planHash ?? null;
    job.error = null;
    writeRenderJobs(ledger);
    return job;
  } catch (error: any) {
    job.state = "failed";
    job.updatedAt = new Date().toISOString();
    job.retryCount += 1;
    job.error = {
      message: String(error?.message ?? error),
      stack: String(error?.stack ?? ""),
    };
    writeRenderJobs(ledger);
    return job;
  }
}

export function cancelAnimationStudioRenderJob(jobId: string, userId: number) {
  const ledger = loadRenderJobs();
  const job = getOwnedRenderJob(ledger, jobId, userId);
  if (!job) throw new Error(`Unknown render job: ${jobId}`);
  if (job.state === "succeeded" || job.state === "failed") return job;
  job.state = "canceled";
  job.updatedAt = new Date().toISOString();
  writeRenderJobs(ledger);
  return job;
}

export function getAnimationStudioRenderJob(jobId: string, userId: number) {
  const ledger = loadRenderJobs();
  return getOwnedRenderJob(ledger, jobId, userId);
}

export function listAnimationStudioRenderJobs(userId: number, limit = 10) {
  const ledger = loadRenderJobs();
  return Object.values(ledger)
    .filter((job) => job.userId === userId)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, Math.max(0, limit));
}

export function requestAnimationStudioGeminiAsset(input: {
  intentTag: string;
  trustScoreFloor: number;
}) {
  const trustScore = clamp01(input.trustScoreFloor / 100);
  return generateGeminiAsset(input.intentTag, {
    metadataPath: DEFAULT_GEMINI_LEDGER_PATH,
    trustScore,
    attribution: "ANAVI Attribution · Nano Banana 2",
  });
}

export function getAnimationStudioSummary(): AnimationStudioSummary {
  const planLedger = loadPlanLedger();
  const latestPlan = getLatestPlanMetadataEntry(planLedger) ?? null;
  const latestPlanSnapshot = parsePlanSnapshot(latestPlan?.planSnapshot);

  const settings: AnimationStudioSettings = {
    ...DEFAULT_SETTINGS,
    intentTag:
      latestPlanSnapshot?.metadata.intent ?? DEFAULT_SETTINGS.intentTag,
    trustScoreFloor: latestPlanSnapshot
      ? sanitizePercent(clamp01(latestPlanSnapshot.metadata.trustScore) * 100)
      : DEFAULT_SETTINGS.trustScoreFloor,
  };

  const validation = validateAnimationStudioPlan(settings);
  const geminiLedger = loadGeminiLedger();
  const latestAsset = getLatestGeminiAssetEntry(geminiLedger) ?? null;

  return {
    settings,
    lastRender: latestPlan
      ? {
          path: latestPlan.lastRenderPath,
          lastUpdated: latestPlan.lastUpdated,
          diffScore: latestPlan.diffScore,
          trustScore: latestPlan.trustScore,
        }
      : null,
    lastGeminiAsset: latestAsset
      ? {
          assetId: latestAsset.assetId,
          intentTag: latestAsset.intentTag,
          createdAt: latestAsset.createdAt,
          geminiVersion: latestAsset.geminiVersion,
          trustScore: latestAsset.trustScore,
        }
      : null,
    validation,
  };
}

function buildTerminologyCheck(narrative: GeneratedNarrative) {
  const haystack = [
    narrative.headline,
    narrative.oneLiner,
    narrative.voiceoverScript,
    narrative.storyboard.map(s => `${s.title} ${s.beat}`).join(" "),
    narrative.callToAction,
    narrative.social.xThread,
    narrative.social.linkedIn,
    narrative.social.youtubeDescription,
  ]
    .join(" \n ")
    .toLowerCase();

  const missing: string[] = [];
  const present: string[] = [];
  for (const term of REQUIRED_TERMINOLOGY) {
    if (haystack.includes(term.toLowerCase())) present.push(term);
    else missing.push(term);
  }
  return {
    required: REQUIRED_TERMINOLOGY,
    present,
    missing,
    passed: missing.length === 0,
  };
}

export async function exportAnimationStudioAssetPack(
  input: ExportAnimationStudioAssetPackInput
): Promise<ExportAnimationStudioAssetPackResult> {
  const settings = resolveSettings(input.settings);
  const preset = input.presetId ? getPresetOrThrow(input.presetId) : null;
  const presetId = preset?.id ?? "custom";
  const includeNarrative = input.includeNarrative ?? true;
  const useClaude = input.useClaude ?? true;

  const validation = validateAnimationStudioPlan(settings);
  const renderResult = await runAnimationStudioRender({
    ...settings,
    previewMode: false,
  });
  const geminiAsset = requestAnimationStudioGeminiAsset({
    intentTag: settings.intentTag,
    trustScoreFloor: settings.trustScoreFloor,
  });
  const plan = buildScenePlan(settings);

  const claudeContext = buildClaudeContextPayload({
    settings,
    preset,
    plan,
    validation,
    renderResult: {
      shouldRender: renderResult.shouldRender,
      reason: renderResult.reason,
      renderPath: renderResult.renderPath,
    },
    geminiAsset,
  });

  const narrative = includeNarrative
    ? await generateNarrative(claudeContext, preset, useClaude)
    : buildFallbackNarrative(claudeContext, preset);

  const packId = makePackId(settings, presetId);
  const packDirectory = path.resolve(DEFAULT_ASSET_PACKS_DIR, packId);
  ensureDirectory(packDirectory);

  const files: string[] = [];
  const writePackJson = (relativePath: string, data: unknown) => {
    const absolutePath = path.resolve(packDirectory, relativePath);
    writeJson(absolutePath, data);
    files.push(normalizeRelativePath(absolutePath, packDirectory));
    return absolutePath;
  };

  const writePackText = (relativePath: string, content: string) => {
    const absolutePath = path.resolve(packDirectory, relativePath);
    writeText(absolutePath, content);
    files.push(normalizeRelativePath(absolutePath, packDirectory));
    return absolutePath;
  };

  writePackJson("scene-plan.json", plan);
  const claudeContextPath = writePackJson("claude-context.json", claudeContext);
  writePackJson("gemini-asset.json", geminiAsset);

  const narrativePath = writePackText(
    "narrative.md",
    buildNarrativeMarkdown(narrative, preset)
  );
  writePackText("storyboard.md", buildStoryboardMarkdown(plan));

  const durationSeconds = preset
    ? Number.parseInt(preset.durationLabel.split(":").join(""), 10) > 130
      ? 300
      : preset.id === "walkthrough_90s"
        ? 90
        : 30
    : 90;

  const captionsPath = writePackText(
    "captions.srt",
    buildCaptionsSrt(narrative, durationSeconds)
  );
  writePackText("social/x-thread.txt", narrative.social.xThread);
  writePackText("social/linkedin.txt", narrative.social.linkedIn);
  writePackText(
    "social/youtube-description.txt",
    narrative.social.youtubeDescription
  );

  let copiedRenderPath = "";
  if (renderResult.renderPath && fs.existsSync(renderResult.renderPath)) {
    const renderFileName = path.basename(renderResult.renderPath);
    const mediaTarget = path.resolve(packDirectory, "media", renderFileName);
    ensureDirForFile(mediaTarget);
    fs.copyFileSync(renderResult.renderPath, mediaTarget);
    files.push(normalizeRelativePath(mediaTarget, packDirectory));
    copiedRenderPath = mediaTarget;
  }

  const sidecarPath = `${renderResult.renderPath}.json`;
  let sidecarTech: any = null;
  if (fs.existsSync(sidecarPath)) {
    const sidecarTarget = path.resolve(
      packDirectory,
      "media",
      path.basename(sidecarPath)
    );
    ensureDirForFile(sidecarTarget);
    fs.copyFileSync(sidecarPath, sidecarTarget);
    files.push(normalizeRelativePath(sidecarTarget, packDirectory));
    try {
      sidecarTech =
        JSON.parse(fs.readFileSync(sidecarTarget, "utf8")).technical ?? null;
    } catch {}
  }

  // Quality gates and readiness
  const terminology = buildTerminologyCheck(narrative);
  const ctaOk = (narrative.callToAction || "").trim().length > 8;
  const captionsOk =
    fs.existsSync(captionsPath) &&
    fs.readFileSync(captionsPath, "utf8").trim().length > 0;
  const renderOk = copiedRenderPath
    ? fs.statSync(copiedRenderPath).size > 0
    : false;
  const trustPolicyOk =
    geminiAsset.trustScore >= clamp01(settings.trustScoreFloor / 100);
  const gateOverrideUsed = /override-enabled|preview-bypass/.test(
    renderResult.reason
  );

  const qualityGates = {
    terminology,
    callToAction: { passed: ctaOk },
    captions: { passed: captionsOk },
    renderArtifact: { passed: renderOk, technical: sidecarTech },
    trustPolicy: {
      passed: trustPolicyOk,
      floor: settings.trustScoreFloor,
      actual: Math.round(geminiAsset.trustScore * 100),
    },
    policy: { gateOverrideUsed },
  } as const;

  const readyToPublish =
    qualityGates.terminology.passed &&
    qualityGates.callToAction.passed &&
    qualityGates.captions.passed &&
    qualityGates.renderArtifact.passed &&
    qualityGates.trustPolicy.passed;

  const manifest = {
    packId,
    generatedAt: new Date().toISOString(),
    presetId,
    objective:
      preset?.objective ??
      "Custom investor asset pack for ANAVI animation studio workflows.",
    settings,
    validation,
    render: {
      shouldRender: renderResult.shouldRender,
      reason: renderResult.reason,
      renderPath: renderResult.renderPath,
      planHash: (renderResult as any).metadata?.planHash ?? null,
    },
    geminiAsset: {
      assetId: geminiAsset.assetId,
      prompt: geminiAsset.prompt,
      intentTag: geminiAsset.intentTag,
      createdAt: geminiAsset.createdAt,
      attribution: geminiAsset.attribution,
    },
    narrativeProvider: narrative.provider,
    requiredTerminology: REQUIRED_TERMINOLOGY,
    readiness: {
      readyToPublish,
      qualityGates,
      lineage: {
        planHash: (renderResult as any).metadata?.planHash ?? null,
        geminiAssetId: geminiAsset.assetId,
        claudeContextPath: normalizeRelativePath(
          claudeContextPath,
          packDirectory
        ),
      },
    },
    files,
  };

  const manifestPath = writePackJson("manifest.json", manifest);

  return {
    packId,
    presetId,
    packDirectory,
    manifestPath,
    narrativePath,
    claudeContextPath,
    renderPath: renderResult.renderPath,
    geminiAssetId: geminiAsset.assetId,
    narrativeProvider: narrative.provider,
    files,
  };
}

export function getAnimationStudioPackHistory(limit = 5): PackHistoryEntry[] {
  const dir = DEFAULT_ASSET_PACKS_DIR;
  if (!fs.existsSync(dir)) return [];
  const entries: PackHistoryEntry[] = [];
  for (const name of fs.readdirSync(dir)) {
    const packDir = path.resolve(dir, name);
    const manifestPath = path.resolve(packDir, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      try {
        const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        entries.push({
          packId: m.packId ?? name,
          generatedAt: m.generatedAt ?? new Date(0).toISOString(),
          presetId: m.presetId ?? "custom",
          narrativeProvider: (m.narrativeProvider === "claude"
            ? "claude"
            : "fallback") as "claude" | "fallback",
          readyToPublish: !!m.readiness?.readyToPublish,
          packDirectory: packDir,
          files: Array.isArray(m.files) ? m.files.length : 0,
        });
      } catch {}
    }
  }
  return entries
    .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))
    .slice(0, Math.max(0, limit));
}

export type PublishAnimationStudioAssetPackInput = {
  packId: string;
  channels: ("youtube" | "linkedin" | "x")[];
};

export type PublishAnimationStudioAssetPackResult = {
  packId: string;
  success: boolean;
  publishedTo: { channel: string; url: string }[];
  errors?: string[];
};

export async function publishAnimationStudioAssetPack(
  input: PublishAnimationStudioAssetPackInput
): Promise<PublishAnimationStudioAssetPackResult> {
  const packDir = path.resolve(DEFAULT_ASSET_PACKS_DIR, input.packId);
  if (!fs.existsSync(packDir)) {
    throw new Error(`Asset pack not found: ${input.packId}`);
  }

  const manifestPath = path.resolve(packDir, "manifest.json");
  let manifest: any;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    throw new Error(`Failed to read manifest for pack: ${input.packId}`);
  }

  const publishedTo = [];
  const errors: string[] = [];

  for (const channel of input.channels) {
    try {
      // Simulate pushing to external channel
      const url = `https://${channel}.com/post/${input.packId.slice(0, 8)}-${Date.now()}`;
      publishedTo.push({ channel, url });
    } catch (err: any) {
      errors.push(`Failed to publish to ${channel}: ${err.message}`);
    }
  }

  manifest.readiness = {
    ...manifest.readiness,
    publishedAt: new Date().toISOString(),
    publishedChannels: publishedTo.map(p => p.channel),
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return {
    packId: input.packId,
    success: errors.length === 0,
    publishedTo,
    errors: errors.length > 0 ? errors : undefined,
  };
}

