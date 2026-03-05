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

export type RenderGateInput = Pick<
  AnimationStudioSettings,
  "rerenderThreshold" | "previewMode" | "overrideGate"
> & {
  diffScore: number;
};

export type RenderGateState = {
  status: "ready" | "preview" | "blocked" | "override";
  canRender: boolean;
  blockedByGate: boolean;
  reason: string;
};

export const defaultAnimationStudioSettings: AnimationStudioSettings = {
  emotionDepth: 62,
  scenePacing: 58,
  renderFidelity: 74,
  rerenderThreshold: 40,
  trustScoreFloor: 72,
  previewMode: false,
  overrideGate: false,
  intentTag: "blind-matching-narrative",
};

function normalizeThreshold(threshold: number) {
  if (!Number.isFinite(threshold)) {
    return 0.4;
  }
  return Math.min(Math.max(threshold / 100, 0), 1);
}

export function getRenderGateState(input: RenderGateInput): RenderGateState {
  const threshold = normalizeThreshold(input.rerenderThreshold);
  const diff = Math.min(Math.max(input.diffScore, 0), 1);

  if (input.previewMode) {
    return {
      status: "preview",
      canRender: true,
      blockedByGate: false,
      reason: "Preview mode bypasses rerender gate.",
    };
  }

  if (input.overrideGate) {
    return {
      status: "override",
      canRender: true,
      blockedByGate: false,
      reason: "Override enabled. Render can proceed below threshold.",
    };
  }

  if (diff < threshold) {
    return {
      status: "blocked",
      canRender: false,
      blockedByGate: true,
      reason: `Diff ${diff.toFixed(2)} is below gate ${threshold.toFixed(2)}.`,
    };
  }

  return {
    status: "ready",
    canRender: true,
    blockedByGate: false,
    reason: `Diff ${diff.toFixed(2)} meets gate ${threshold.toFixed(2)}.`,
  };
}
