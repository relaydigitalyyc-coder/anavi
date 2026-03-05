# Animation Studio Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a route-accessible Animation Studio dashboard with Trust Score-aware render gating, render execution controls, Gemini asset requests, and polished ANAVI-native visuals.

**Architecture:** Build a new shell page and controls component on the frontend, backed by a dedicated `animationStudio` tRPC router and a `server/db/animationStudio.ts` IO layer that reuses existing scene-plan/render-hub/nano-banana scripts and ledger files.

**Tech Stack:** React + wouter + tRPC + Tailwind/shadcn UI + existing 21st-style components (`InteractiveGlobe`, `EvervaultCard`) + Vitest.

---

### Task 1: Register docs + route surface

**Files:**
- Modify: `anavi/docs/plans/README.md`
- Modify: `anavi/client/src/App.tsx`
- Modify: `anavi/client/src/components/DashboardLayout.tsx`

**Step 1: Add plan/design entries to plan registry**
- Add both `2026-03-05-animation-studio-dashboard-design.md` and `2026-03-05-animation-studio-dashboard-implementation-plan.md`.

**Step 2: Add route**
- Register `/animation-studio` in `App.tsx` with `ShellRoute`.

**Step 3: Add navigation access**
- Add sidebar nav item for Animation Studio in `DashboardLayout.tsx`.

**Step 4: Verify type-check for route/nav wiring**
- Run: `pnpm check`

### Task 2: Frontend studio UI

**Files:**
- Create: `anavi/client/src/pages/AnimationStudioPage.tsx`
- Create: `anavi/client/src/components/AnimationStudioControls.tsx`
- Create: `anavi/client/src/lib/api/animation-studio.ts`

**Step 1: Add pure gate-state helper + types**
- Create frontend helper to derive blocked/allowed state from diff score, threshold, and override.

**Step 2: Build controls component**
- Implement sliders, toggles, and action buttons with pending/blocked states.

**Step 3: Build studio page orchestration**
- Wire tRPC query/mutations and telemetry cards.
- Integrate `InteractiveGlobe` + `EvervaultCard` as meaningful visual surfaces.

**Step 4: Verify compile**
- Run: `pnpm check`

### Task 3: Backend animation studio API + IO layer

**Files:**
- Create: `anavi/server/db/animationStudio.ts`
- Create: `anavi/server/routers/animationStudio.ts`
- Modify: `anavi/server/db/index.ts`
- Modify: `anavi/server/routers/index.ts`
- Modify: `anavi/scripts/render-hub.ts`
- Modify: `anavi/scripts/nano-banana.ts`

**Step 1: Add DB/IO helper module**
- Implement summary read, plan validation, render run, and Gemini request wrappers.

**Step 2: Add tRPC router**
- Implement `getPlanSummary`, `validatePlan`, `runRender`, `requestGeminiAsset`.

**Step 3: Register exports and router merge**
- Wire db index and app router index.

**Step 4: Normalize script default paths**
- Use module-relative paths for ledger defaults to avoid cwd/path drift.

**Step 5: Verify compile**
- Run: `pnpm check`

### Task 4: Tests + verification

**Files:**
- Create: `anavi/tests/animation-studio-router.test.ts`
- Create: `anavi/tests/animation-studio-client.test.ts`

**Step 1: Add router tests**
- Use `appRouter.createCaller` and authenticated context to test all four procedures.

**Step 2: Add client helper tests**
- Validate gate-state helper behavior for blocked/override/allowed cases.

**Step 3: Run targeted tests**
- Run: `pnpm vitest run tests/animation-studio-router.test.ts tests/animation-studio-client.test.ts`

**Step 4: Run broader checks**
- Run: `pnpm check`

### Task 5: Ops docs + global skill packaging

**Files:**
- Modify: `anavi/docs/ops/ENGINEERING_MEMORY.md`
- Modify: `anavi/docs/ops/TODO_BOARD.md`
- Create: `/home/ariel/.codex/skills/animation-studio-dashboard/SKILL.md`

**Step 1: Log engineering memory entry**
- Append dated summary with files and validation evidence.

**Step 2: Update TODO board**
- Move animation-studio batch to Done and keep Next Up focused.

**Step 3: Create global skill**
- Add concise trigger/usage/runbook referencing studio page, router, scripts, and tests.

**Step 4: Final verification snapshot**
- Run: `pnpm vitest run tests/scene-plan.test.ts tests/render-hub.test.ts tests/nano-banana.test.ts tests/animation-studio-router.test.ts tests/animation-studio-client.test.ts`
- Run: `pnpm check`
