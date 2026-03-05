import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AnimationStudioSettings,
  type RenderGateState,
} from "@/lib/api/animation-studio";

type AnimationStudioControlsProps = {
  settings: AnimationStudioSettings;
  onSettingsChange: (patch: Partial<AnimationStudioSettings>) => void;
  gateState: RenderGateState;
  diffScore: number;
  isValidating: boolean;
  isRendering: boolean;
  isRequestingAsset: boolean;
  onValidate: () => void;
  onPreview: () => void;
  onRender: () => void;
  onRequestAsset: () => void;
};

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#0A1628]/80">{label}</span>
        <span className="rounded-md bg-[#0A1628]/5 px-2 py-1 font-mono text-xs text-[#0A1628]/80">
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={100}
        step={1}
        onValueChange={next => onChange(next[0] ?? value)}
      />
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#0A1628]/10 px-3 py-2">
      <span className="text-sm text-[#0A1628]/80">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function AnimationStudioControls({
  settings,
  onSettingsChange,
  gateState,
  diffScore,
  isValidating,
  isRendering,
  isRequestingAsset,
  onValidate,
  onPreview,
  onRender,
  onRequestAsset,
}: AnimationStudioControlsProps) {
  const gateTone =
    gateState.status === "blocked"
      ? "bg-red-500/10 text-red-700"
      : gateState.status === "override"
        ? "bg-orange-500/10 text-orange-700"
        : gateState.status === "preview"
          ? "bg-blue-500/10 text-blue-700"
          : "bg-emerald-500/10 text-emerald-700";

  return (
    <Card className="card-elevated border-[#0A1628]/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg text-[#0A1628]">Studio Controls</CardTitle>
          <Badge className={gateTone}>{gateState.status.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="render" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="render">Render</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
          </TabsList>
          <TabsContent value="render" className="space-y-5 pt-4">
            <SliderRow
              label="Emotion Depth"
              value={settings.emotionDepth}
              onChange={emotionDepth => onSettingsChange({ emotionDepth })}
            />
            <SliderRow
              label="Scene Pacing"
              value={settings.scenePacing}
              onChange={scenePacing => onSettingsChange({ scenePacing })}
            />
            <SliderRow
              label="Render Fidelity"
              value={settings.renderFidelity}
              onChange={renderFidelity => onSettingsChange({ renderFidelity })}
            />
          </TabsContent>
          <TabsContent value="safety" className="space-y-5 pt-4">
            <SliderRow
              label="Rerender Threshold"
              value={settings.rerenderThreshold}
              onChange={rerenderThreshold => onSettingsChange({ rerenderThreshold })}
            />
            <SliderRow
              label="Trust Score Floor"
              value={settings.trustScoreFloor}
              onChange={trustScoreFloor => onSettingsChange({ trustScoreFloor })}
            />
            <SwitchRow
              label="Preview Mode"
              checked={settings.previewMode}
              onChange={previewMode => onSettingsChange({ previewMode })}
            />
            <SwitchRow
              label="Override Gate"
              checked={settings.overrideGate}
              onChange={overrideGate => onSettingsChange({ overrideGate })}
            />
          </TabsContent>
        </Tabs>

        <div className="space-y-3 rounded-lg border border-[#0A1628]/10 bg-white/70 p-3">
          <div className="flex items-center justify-between text-xs text-[#0A1628]/70">
            <span>Diff Score</span>
            <span className="font-mono">{Math.round(diffScore * 100)}%</span>
          </div>
          <Progress value={Math.round(diffScore * 100)} />
          <p className="text-xs text-[#0A1628]/70">{gateState.reason}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={onValidate}
            disabled={isValidating || isRendering}
          >
            {isValidating ? "Validating..." : "Validate Plan"}
          </Button>
          <Button
            variant="outline"
            onClick={onPreview}
            disabled={isValidating || isRendering}
          >
            Preview
          </Button>
          <Button
            className="btn-gold"
            onClick={onRender}
            disabled={isRendering || !gateState.canRender}
          >
            {isRendering ? "Rendering..." : "Kick Remotion Render"}
          </Button>
          <Button
            onClick={onRequestAsset}
            disabled={isRequestingAsset || isRendering}
            variant="secondary"
          >
            {isRequestingAsset ? "Requesting..." : "Request Gemini Asset"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
