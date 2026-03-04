I'm using the writing-plans skill to create the implementation plan.
# High-IQ Animation Studio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver an autonomous animation studio that owns the scene-plan engine, render hub, Gemini-driven Nano Banana 2 asset suite, and slider-driven studio dashboard so the savant can orchestrate high-confidence demo renders end-to-end.

**Architecture:** A set of TypeScript command-line utils normalizes prompts into diff-aware scene plans, routes them through Remotion/Motion Canvas renderers, and logs Gemini asset metadata; a React dashboard consumes the plan API, exposes trust-sliders, shows Gemini info, and gates renders by confidence thresholds.

**Tech Stack:** Node+tsx scripts (Remotion renderer, `@google/genai` Gemini), Vitest for CLI tests, and the existing React/Vite/`@radix-ui/react-slider` stack for dashboard controls.

---

### Task 1: Scene Plan Engine + Confidence Scoring

**Files:**
- Create: `scripts/scene-plan.ts`
- Modify: `package.json` scripts section to expose `pnpm scene-plan` helper if needed
- Test: `tests/scene-plan.test.ts`

**Step 1: Write the failing test**
```ts
import {diffScore} from '../../scripts/scene-plan';

test('diffScore flags substantial plan changes', () => {
  expect(() => diffScore(firstPlan, secondPlan)).not.toThrow();
});
```

**Step 2: Run test to verify it fails**
Run: `pnpm vitest tests/scene-plan.test.ts -t diffScore` Expected: FAIL because module not implemented.

**Step 3: Write minimal implementation**
```ts
export type ScenePlan = {/* normalized structure */};
export function diffScore(a: ScenePlan, b: ScenePlan) { /* compute weighted difference */ }
```

**Step 4: Run test to verify it passes**
Run: `pnpm vitest tests/scene-plan.test.ts -t diffScore` Expected: PASS with coverage of diff logic.

**Step 5: Commit**
```bash
git add scripts/scene-plan.ts tests/scene-plan.test.ts package.json
git commit -m "feat: add scene plan scoring engine"
```

### Task 2: Render Hub / Remotion + Motion Canvas Orchestration

**Files:**
- Create: `scripts/render-hub.ts`
- Modify: `package.json` scripts (add `animation-studio:render` alias), `remotion` config files if present
- Test: `tests/render-hub.test.ts`

**Step 1: Write the failing test**
```ts
import {shouldRerender} from '../../scripts/render-hub';
expect(shouldRerender(plan, cachedPlan)).toBe(true);
```

**Step 2: Run test to verify it fails**
Run: `pnpm vitest tests/render-hub.test.ts -t shouldRerender` Expected: FAIL (module missing).

**Step 3: Write minimal implementation**
Implement Remotion `renderMedia` wrapper that reads plans, checks cache metadata, and falls back to Motion Canvas preview when `previewMode` flag set. Add confident gating using diffScore.

**Step 4: Run test to verify it passes**
Run: `pnpm vitest tests/render-hub.test.ts -t shouldRerender` Expected: PASS after hooking `shouldRerender` to diffScore.

**Step 5: Commit**
```bash
git add scripts/render-hub.ts tests/render-hub.test.ts package.json
git commit -m "feat: add render hub with rerender gating"
```

### Task 3: Nano Banana 2 Gemini Asset Suite

**Files:**
- Create: `scripts/nano-banana.ts`
- Modify: `anavi/data/ai-assets.json` (new ledger), `package.json` (script entry)
- Test: `tests/nano-banana.test.ts`

**Step 1: Write the failing test**
Sketch a test that calls `generateGeminiAsset` with a mocked `@google/genai` client and expects prompt metadata recorded.

**Step 2: Run test to verify it fails**
Run: `pnpm vitest tests/nano-banana.test.ts -t generateGeminiAsset` Expected: FAIL until file exists.

**Step 3: Write minimal implementation**
Implement Gemini wrapper that accepts intent tag, caches responses in `ai-assets.json`, and returns asset metadata + hashed id.

**Step 4: Run test to verify it passes**
Run: `pnpm vitest tests/nano-banana.test.ts -t generateGeminiAsset` Expected: PASS.

**Step 5: Commit**
```bash
git add scripts/nano-banana.ts anavi/data/ai-assets.json tests/nano-banana.test.ts
git commit -m "feat: add nano banana gemini suite"
```

### Task 4: Animation Studio Dashboard & Sliders

**Files:**
- Create: `anavi/client/src/pages/AnimationStudioPage.tsx`
- Create: `anavi/client/src/components/AnimationStudioControls.tsx`
- Create: `anavi/client/src/lib/api/animation-studio.ts`
- Modify: `anavi/client/src/App.tsx` to register new route (use `ShellRoute` as per instructions)
- Test: `anavi/client/src/components/__tests__/AnimationStudioControls.test.tsx`

**Step 1: Write the failing test**
Use Vitest + Testing Library to render the sliders, expect `Render Confidence` meter to reflect props.

**Step 2: Run test to verify it fails**
Run: `pnpm vitest anavi/client/src/components/__tests__/AnimationStudioControls.test.tsx --runInBand` Expected: FAIL.

**Step 3: Write minimal implementation**
Build React page with slider controls (`@radix-ui/react-slider`), fetch plan metadata via new API hook, and provide buttons for `Validate Plan`, `Request Gemini Asset`, `Kick Render`. Connect gating logic to API responses.

**Step 4: Run test to verify it passes**
Run the same vitest command and expect PASS.

**Step 5: Commit**
```bash
git add anavi/client/src/pages/AnimationStudioPage.tsx anavi/client/src/components/AnimationStudioControls.tsx anavi/client/src/lib/api/animation-studio.ts anavi/client/src/App.tsx anavi/client/src/components/__tests__/AnimationStudioControls.test.tsx
git commit -m "feat: add animation studio dashboard"
```

### Task 5: Metadata + Gateway Integrations

**Files:**
- Create: `anavi/server/routers/animation-studio.ts`
- Modify: `anavi/server/routers/index.ts` to mount the router, `anavi/docs/ops/ENGINEERING_MEMORY.md` (add log entry post-implementation)
- Test: `anavi/tests/server/animation-studio-router.test.ts`

**Step 1: Write the failing test**
Test that the router responds to `/animation-studio/plan` with plan metadata including trust score and last Gemini prompt.

**Step 2: Run test to verify it fails**
Run: `pnpm vitest anavi/tests/server/animation-studio-router.test.ts -t plan-response` Expected: FAIL.

**Step 3: Write minimal implementation**
Implement new TRPC (or router) endpoint that exposes plan metadata plus `lastGeminiPrompt`, `rerenderGate`, `renderHistory`. Wire it to CLI metadata ledger.

**Step 4: Run test to verify it passes**
Same vitest command, expect PASS.

**Step 5: Commit**
```bash
git add anavi/server/routers/animation-studio.ts anavi/server/routers/index.ts anavi/docs/ops/ENGINEERING_MEMORY.md anavi/tests/server/animation-studio-router.test.ts
git commit -m "feat: expose animation studio router"
```

---

Plan complete and saved to `anavi/docs/plans/2026-03-04-high-iq-animation-studio-plan.md`. Two execution options:
1. **Subagent-Driven (this session)** – dispatch a fresh subagent per task via `superpowers:subagent-driven-development` and stay here for reviews.
2. **Parallel Session (separate)** – open a new session that uses `superpowers:executing-plans` to carry out the plan with checkpoints.
Which approach do you prefer?
