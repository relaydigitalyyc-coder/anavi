import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimationStudioControls } from "@/components/AnimationStudioControls";
import { Spotlight } from "@/components/PremiumAnimations";
import { Badge } from "@/components/ui/badge";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EvervaultCard } from "@/components/ui/evervault-card";
import { InteractiveGlobe } from "@/components/ui/interactive-globe";
import {
  defaultAnimationStudioSettings,
  getRenderGateState,
  type AnimationStudioSettings,
} from "@/lib/api/animation-studio";
import { trpc } from "@/lib/trpc";

type StudioSummaryResponse = {
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
  validation: {
    diffScore: number;
    threshold: number;
    shouldRender: boolean;
    blockedByGate: boolean;
    reason: string;
  };
};

type InvestorPresetResponse = {
  id: "teaser_30s" | "walkthrough_90s" | "ic_5min";
  name: string;
  durationLabel: string;
  objective: string;
  targetAudience: string;
  narrativePillars: string[];
  recommendedSettings: AnimationStudioSettings;
};

type AssetPackExportResponse = {
  packId: string;
  presetId: string;
  packDirectory: string;
  manifestPath: string;
  narrativePath: string;
  claudeContextPath: string;
  renderPath: string;
  geminiAssetId: string;
  narrativeProvider: "claude" | "fallback";
  files: string[];
};

export default function AnimationStudioPage() {
  const [settings, setSettings] = useState<AnimationStudioSettings>(
    defaultAnimationStudioSettings
  );
  const [diffScoreValue, setDiffScoreValue] = useState(1);
  const [selectedPresetId, setSelectedPresetId] =
    useState<InvestorPresetResponse["id"]>("teaser_30s");
  const [lastAssetPack, setLastAssetPack] =
    useState<AssetPackExportResponse | null>(null);
  const [hasHydratedSummary, setHasHydratedSummary] = useState(false);

  const summaryQuery = trpc.animationStudio.getPlanSummary.useQuery();
  const presetsQuery = trpc.animationStudio.getInvestorPresets.useQuery();
  const historyQuery = trpc.animationStudio.getPackHistory.useQuery({ limit: 5 });

  const validateMutation = trpc.animationStudio.validatePlan.useMutation({
    onSuccess: data => {
      setDiffScoreValue(data.diffScore);
      toast.success("Plan validation complete");
    },
    onError: error => toast.error(error.message),
  });

  const runRenderMutation = trpc.animationStudio.runRender.useMutation({
    onSuccess: data => {
      setDiffScoreValue(data.metadata.diffScore);
      summaryQuery.refetch();
      if (data.shouldRender) {
        toast.success(`Render queued: ${data.renderPath}`);
      } else {
        toast.info("Render gate reused cache");
      }
    },
    onError: error => toast.error(error.message),
  });

  const requestGeminiMutation =
    trpc.animationStudio.requestGeminiAsset.useMutation({
      onSuccess: data => {
        summaryQuery.refetch();
        toast.success(`Gemini asset ready: ${data.assetId.slice(0, 8)}`);
      },
      onError: error => toast.error(error.message),
    });

  const applyPresetMutation = trpc.animationStudio.applyInvestorPreset.useMutation({
    onSuccess: data => {
      setSettings(data.settings);
      setSelectedPresetId(data.preset.id);
      setDiffScoreValue(data.claudeContext.validation.diffScore);
      toast.success(`Preset applied: ${data.preset.name}`);
    },
    onError: error => toast.error(error.message),
  });

  const exportAssetPackMutation = trpc.animationStudio.exportAssetPack.useMutation({
    onSuccess: data => {
      setLastAssetPack(data as AssetPackExportResponse);
      summaryQuery.refetch();
      toast.success(`Folder bundle ready: ${data.packId}`);
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!summaryQuery.data) {
      return;
    }
    const summary = summaryQuery.data as StudioSummaryResponse;
    if (!hasHydratedSummary) {
      setSettings(summary.settings);
      setHasHydratedSummary(true);
    }
    setDiffScoreValue(summary.validation.diffScore);
  }, [hasHydratedSummary, summaryQuery.data]);

  useEffect(() => {
    const presets = presetsQuery.data as InvestorPresetResponse[] | undefined;
    if (!presets || presets.length === 0) {
      return;
    }

    const current = presets.some(preset => preset.id === selectedPresetId);
    if (!current) {
      setSelectedPresetId(presets[0]!.id);
    }
  }, [presetsQuery.data, selectedPresetId]);

  const gateState = useMemo(
    () =>
      getRenderGateState({
        diffScore: diffScoreValue,
        rerenderThreshold: settings.rerenderThreshold,
        previewMode: settings.previewMode,
        overrideGate: settings.overrideGate,
      }),
    [
      diffScoreValue,
      settings.overrideGate,
      settings.previewMode,
      settings.rerenderThreshold,
    ]
  );

  const summary = summaryQuery.data as StudioSummaryResponse | undefined;
  const latestRender = summary?.lastRender;
  const latestAsset = summary?.lastGeminiAsset;
  const presets = presetsQuery.data as InvestorPresetResponse[] | undefined;
  const activePreset =
    presets?.find(preset => preset.id === selectedPresetId) ?? presets?.[0];

  return (
    <div className="space-y-6 pb-12">
      <div className="card-elevated bg-gradient-to-br from-white to-[#F5F9FF] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="dash-heading text-2xl">Animation Studio</h1>
            <p className="mt-1 text-sm text-[#0A1628]/70">
              Orchestrate Trust Score-safe render flows for Relationship Custody,
              Blind Matching, Deal Room, and Attribution narratives.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Badge className="bg-[#0A1628]/90 text-white">
                  Gate {gateState.status.toUpperCase()}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm">{gateState.reason}</p>
              </HoverCardContent>
            </HoverCard>
            <Badge className="bg-[#2563EB]/10 text-[#2563EB]">
              Diff {Math.round(diffScoreValue * 100)}%
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <AnimationStudioControls
          settings={settings}
          onSettingsChange={patch =>
            setSettings(prev => ({
              ...prev,
              ...patch,
            }))
          }
          gateState={gateState}
          diffScore={diffScoreValue}
          isValidating={validateMutation.isPending}
          isRendering={runRenderMutation.isPending}
          isRequestingAsset={requestGeminiMutation.isPending}
          onValidate={() => validateMutation.mutate(settings)}
          onPreview={() =>
            runRenderMutation.mutate({
              ...settings,
              previewMode: true,
            })
          }
          onRender={() => runRenderMutation.mutate(settings)}
          onRequestAsset={() =>
            requestGeminiMutation.mutate({
              intentTag: settings.intentTag,
              trustScoreFloor: settings.trustScoreFloor,
            })
          }
        />

        <div className="space-y-6">
          <Card className="card-elevated border-[#0A1628]/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pack History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(historyQuery.data ?? []).length === 0 ? (
                <p className="text-[#0A1628]/70 text-xs">No packs yet. Export a folder bundle to see history.</p>
              ) : (
                <div className="space-y-2">
                  {(historyQuery.data ?? []).map((p) => (
                    <div key={p.packId} className="rounded-md border border-[#0A1628]/10 bg-white/80 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs">{p.packId}</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#0A1628]/10 text-[#0A1628]">{p.narrativeProvider.toUpperCase()}</Badge>
                          <Badge className={p.readyToPublish ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}>
                            {p.readyToPublish ? "READY" : "REVIEW"}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-[#0A1628]/60">{new Date(p.generatedAt).toLocaleString()}</p>
                      <p className="mt-1 font-mono text-xs">{p.packDirectory}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-elevated border-[#0A1628]/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Narrative Intent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={settings.intentTag}
                onChange={event =>
                  setSettings(prev => ({
                    ...prev,
                    intentTag: event.target.value,
                  }))
                }
                placeholder="intent tag"
              />
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#0A1628]/70">
                  <span>Trust Score Floor</span>
                  <span className="font-mono">{settings.trustScoreFloor}</span>
                </div>
                <Progress value={settings.trustScoreFloor} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-[#0A1628]/10 bg-white/80 p-2">
                  Relationship Custody
                </div>
                <div className="rounded-md border border-[#0A1628]/10 bg-white/80 p-2">
                  Blind Matching
                </div>
                <div className="rounded-md border border-[#0A1628]/10 bg-white/80 p-2">
                  Deal Room
                </div>
                <div className="rounded-md border border-[#0A1628]/10 bg-white/80 p-2">
                  Attribution
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated border-[#0A1628]/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Investor Asset Presets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                {(presets ?? []).map(preset => {
                  const active = preset.id === (activePreset?.id ?? selectedPresetId);
                  return (
                    <Spotlight
                      key={preset.id}
                      className={`rounded-lg border transition ${
                        active
                          ? "border-[#2563EB]/40 bg-[#2563EB]/5"
                          : "border-[#0A1628]/10 bg-white/80"
                      }`}
                    >
                      <button
                        type="button"
                        className="w-full p-3 text-left"
                        onClick={() => setSelectedPresetId(preset.id)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#0A1628]">
                            {preset.name}
                          </p>
                          <Badge className="bg-[#0A1628]/10 text-[#0A1628]">
                            {preset.durationLabel}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-[#0A1628]/70">
                          {preset.objective}
                        </p>
                      </button>
                    </Spotlight>
                  );
                })}
              </div>

              <ButtonGroup className="w-full [&>*]:flex-1">
                <Button
                  variant="outline"
                  disabled={!activePreset || applyPresetMutation.isPending}
                  onClick={() =>
                    activePreset &&
                    applyPresetMutation.mutate({ presetId: activePreset.id })
                  }
                >
                  {applyPresetMutation.isPending ? "Applying..." : "Apply Preset"}
                </Button>
                <Button
                  className="btn-gold"
                  disabled={!activePreset || exportAssetPackMutation.isPending}
                  onClick={() =>
                    exportAssetPackMutation.mutate({
                      presetId: activePreset?.id,
                      settings,
                    })
                  }
                >
                  {exportAssetPackMutation.isPending
                    ? "Exporting..."
                    : "Export Folder Bundle"}
                </Button>
              </ButtonGroup>

              {lastAssetPack ? (
                <div className="rounded-md border border-[#0A1628]/10 bg-white/80 p-3 text-xs text-[#0A1628]/75">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">Latest Asset Pack</span>
                    <Badge className="bg-[#0A1628]/10 text-[#0A1628]">
                      {lastAssetPack.narrativeProvider.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mt-2 font-mono">{lastAssetPack.packDirectory}</p>
                  <p className="mt-1">
                    Files bundled: {lastAssetPack.files.length}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="card-elevated border-[#0A1628]/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Render Telemetry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#0A1628]/80">
              <div className="rounded-md border border-[#0A1628]/10 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-wide text-[#0A1628]/60">
                  Last Render
                </p>
                <p className="mt-1 font-mono text-xs">
                  {latestRender?.path ?? "No render yet"}
                </p>
                <p className="mt-1 text-xs text-[#0A1628]/60">
                  {latestRender?.lastUpdated ?? "Awaiting first run"}
                </p>
              </div>
              <div className="rounded-md border border-[#0A1628]/10 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-wide text-[#0A1628]/60">
                  Last Gemini Asset
                </p>
                <p className="mt-1 font-mono text-xs">
                  {latestAsset?.assetId ?? "No asset requested"}
                </p>
                <p className="mt-1 text-xs text-[#0A1628]/60">
                  {latestAsset?.geminiVersion ?? "Gemini metadata unavailable"}
                </p>
              </div>
              <div className="h-44 overflow-hidden rounded-lg border border-[#0A1628]/10 bg-[#0A1628]">
                <InteractiveGlobe className="h-full w-full" size={300} />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated border-[#0A1628]/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sealed Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-44 w-full rounded-lg border border-[#0A1628]/10 bg-[#0A1628] p-2">
                <EvervaultCard text="Sealed" className="h-full w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
