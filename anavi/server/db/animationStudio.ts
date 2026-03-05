import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type NanoBananaAsset, generateGeminiAsset } from "../../scripts/nano-banana";
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

export type RenderJobState = "queued" | "running" | "succeeded" | "failed" | "canceled";

export type RenderJob = {
  jobId: string;
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
      description:
        "Investor close with quantified outcomes and next-step ask.",
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
  const blockedByGate = !previewBypass && !overrideBypass && planDiff < threshold;
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
  const preset = INVESTOR_PRESETS.find((entry) => entry.id === presetId);
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
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
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
  const presetPillars =
    preset?.narrativePillars ??
    [
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
    storyboard: storyboard.length > 0 ? storyboard : presetPillars.map((pillar, index) => ({
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

    const textBlock = response.content.find((block) => block.type === "text");
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
          parsed.social.youtubeDescription ?? fallback.social.youtubeDescription,
      },
    };
  } catch {
    return fallback;
  }
}

function buildCaptionsSrt(narrative: GeneratedNarrative, durationSeconds: number) {
  const captionLines = narrative.voiceoverScript
    .split(/[.!?]\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (captionLines.length === 0) {
    return "1\n00:00:00,000 --> 00:00:05,000\nANAVI Investor Narrative\n";
  }

  const segment = Math.max(1, Math.floor(durationSeconds / captionLines.length));

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
  const presetId: ClaudeContextPayload["presetId"] = input.preset?.id ?? "custom";

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

export function applyAnimationStudioInvestorPreset(input: {
  presetId: AnimationStudioInvestorPresetId;
}): ApplyInvestorPresetResult {
  const preset = getPresetOrThrow(input.presetId);
  const settings = resolveSettings(preset.recommendedSettings);
  const validation = validateAnimationStudioPlan(settings);
  const renderResult = runAnimationStudioRender({ ...settings, previewMode: true });
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

export function validateAnimationStudioPlan(settingsInput: AnimationStudioSettings) {
  const settings = resolveSettings(settingsInput);
  return evaluatePlan(settings).validation;
}

export function runAnimationStudioRender(settingsInput: AnimationStudioSettings) {
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

  const renderResult = renderPlanHub({
    plan: evaluation.plan,
    previewMode: settings.previewMode,
    threshold: evaluation.validation.threshold,
    metadataPath: DEFAULT_PLAN_METADATA_PATH,
  });

  const reasonParts = new Set(
    renderResult.reason
      .split(",")
      .map((part) => part.trim())
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
    intentTag: latestPlanSnapshot?.metadata.intent ?? DEFAULT_SETTINGS.intentTag,
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
  const haystack = (
    [
      narrative.headline,
      narrative.oneLiner,
      narrative.voiceoverScript,
      narrative.storyboard.map((s) => `${s.title} ${s.beat}`).join(" "),
      narrative.callToAction,
      narrative.social.xThread,
      narrative.social.linkedIn,
      narrative.social.youtubeDescription,
    ].join(" \n ")
  ).toLowerCase();

  const missing: string[] = [];
  const present: string[] = [];
  for (const term of REQUIRED_TERMINOLOGY) {
    if (haystack.includes(term.toLowerCase())) present.push(term);
    else missing.push(term);
  }
  return { required: REQUIRED_TERMINOLOGY, present, missing, passed: missing.length === 0 };
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
  const renderResult = runAnimationStudioRender({
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

  const captionsPath = writePackText("captions.srt", buildCaptionsSrt(narrative, durationSeconds));
  writePackText("social/x-thread.txt", narrative.social.xThread);
  writePackText("social/linkedin.txt", narrative.social.linkedIn);
  writePackText("social/youtube-description.txt", narrative.social.youtubeDescription);

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
      sidecarTech = JSON.parse(fs.readFileSync(sidecarTarget, "utf8")).technical ?? null;
    } catch {}
  }

  // Quality gates and readiness
  const terminology = buildTerminologyCheck(narrative);
  const ctaOk = (narrative.callToAction || "").trim().length > 8;
  const captionsOk = fs.existsSync(captionsPath) && fs.readFileSync(captionsPath, "utf8").trim().length > 0;
  const renderOk = copiedRenderPath ? fs.statSync(copiedRenderPath).size > 0 : false;
  const trustPolicyOk = geminiAsset.trustScore >= clamp01(settings.trustScoreFloor / 100);
  const gateOverrideUsed = /override-enabled|preview-bypass/.test(renderResult.reason);

  const qualityGates = {
    terminology,
    callToAction: { passed: ctaOk },
    captions: { passed: captionsOk },
    renderArtifact: { passed: renderOk, technical: sidecarTech },
    trustPolicy: { passed: trustPolicyOk, floor: settings.trustScoreFloor, actual: Math.round(geminiAsset.trustScore * 100) },
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
        claudeContextPath: normalizeRelativePath(claudeContextPath, packDirectory),
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
          narrativeProvider: (m.narrativeProvider === "claude" ? "claude" : "fallback") as "claude"|"fallback",
          readyToPublish: !!m.readiness?.readyToPublish,
          packDirectory: packDir,
          files: Array.isArray(m.files) ? m.files.length : 0,
        });
      } catch {}
    }
  }
  return entries.sort((a,b)=> Date.parse(b.generatedAt) - Date.parse(a.generatedAt)).slice(0, Math.max(0, limit));
}
