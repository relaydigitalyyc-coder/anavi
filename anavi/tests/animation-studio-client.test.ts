import { describe, expect, it } from "vitest";
import { getRenderGateState } from "../client/src/lib/api/animation-studio";

describe("animation studio client gate helper", () => {
  it("blocks render when diff is below threshold", () => {
    const state = getRenderGateState({
      diffScore: 0.2,
      rerenderThreshold: 50,
      previewMode: false,
      overrideGate: false,
    });

    expect(state.status).toBe("blocked");
    expect(state.canRender).toBe(false);
    expect(state.blockedByGate).toBe(true);
  });

  it("allows render in preview mode", () => {
    const state = getRenderGateState({
      diffScore: 0.1,
      rerenderThreshold: 90,
      previewMode: true,
      overrideGate: false,
    });

    expect(state.status).toBe("preview");
    expect(state.canRender).toBe(true);
    expect(state.blockedByGate).toBe(false);
  });

  it("allows render when override is enabled", () => {
    const state = getRenderGateState({
      diffScore: 0.05,
      rerenderThreshold: 85,
      previewMode: false,
      overrideGate: true,
    });

    expect(state.status).toBe("override");
    expect(state.canRender).toBe(true);
  });

  it("normalizes invalid thresholds safely", () => {
    const state = getRenderGateState({
      diffScore: 1,
      rerenderThreshold: Number.NaN as any,
      previewMode: false,
      overrideGate: false,
    });
    expect(state.canRender).toBe(true);
  });
});
