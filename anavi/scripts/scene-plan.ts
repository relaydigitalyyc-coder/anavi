export type ScenePlan = {
  scenes: { id: string; description: string }[];
  metadata: {
    trustScore: number;
    intent: string;
  };
};

export function diffScore(a: ScenePlan, b: ScenePlan) {
  const sceneCountDiff = Math.abs(a.scenes.length - b.scenes.length);
  const trustDiff = Math.abs(a.metadata.trustScore - b.metadata.trustScore);
  const intentChanged = a.metadata.intent !== b.metadata.intent ? 1 : 0;

  return sceneCountDiff * 0.3 + trustDiff * 0.5 + intentChanged * 0.2;
}

if (import.meta.main) {
  const baseline: ScenePlan = {
    scenes: [{ id: "relationship-custody", description: "Baseline intent" }],
    metadata: { trustScore: 0.72, intent: "baseline" },
  };
  const candidate: ScenePlan = {
    scenes: [
      { id: "relationship-custody", description: "Baseline intent" },
      { id: "blind-matching", description: "Introduce blind matching frame" },
    ],
    metadata: { trustScore: 0.78, intent: "blind-matching-narrative" },
  };
  console.log(
    JSON.stringify(
      {
        baseline,
        candidate,
        diffScore: diffScore(baseline, candidate),
      },
      null,
      2
    )
  );
}
