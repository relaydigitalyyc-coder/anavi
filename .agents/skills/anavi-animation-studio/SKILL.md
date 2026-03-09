---
name: anavi-animation-studio
description: Use when running, debugging, or extending ANAVI's `/animation-studio` workflow, including render execution, asset-pack export, and render job diagnostics.
---

# ANAVI Animation Studio

Operate the ANAVI Animation Studio end-to-end: launch UI, run render workflows, verify job lifecycle states, and validate investor asset-pack output.

## When to Use
- User asks to open/run the Animation Studio.
- User asks to debug render behavior or job lifecycle states.
- User asks to export/verify investor asset packs from the Studio flow.

## Core Surfaces
- Page: `anavi/client/src/pages/AnimationStudioPage.tsx`
- Controls: `anavi/client/src/components/AnimationStudioControls.tsx`
- Router: `anavi/server/routers/animationStudio.ts`
- Service: `anavi/server/db/animationStudio.ts`
- Remotion compositions: `anavi/remotion-studio/Root.tsx`, `anavi/remotion-studio/AnaviInvestorComposition.tsx`
- Render scripts: `anavi/scripts/render-hub.ts`, `anavi/scripts/scene-plan.ts`, `anavi/scripts/nano-banana.ts`

## Runbook

### 1) Boot Studio
Run from repo root:

```bash
cd anavi
pnpm dev
```

Open: `http://localhost:3001/animation-studio` (or the port shown in logs).

### 2) Validate Pipeline
Run from `anavi/`:

```bash
pnpm check
pnpm vitest run tests/scene-plan.test.ts tests/render-hub.test.ts tests/nano-banana.test.ts tests/animation-studio-router.test.ts tests/animation-studio-client.test.ts
pnpm build
```

### 3) Studio Operations
- **Validate Plan**: checks diff gate + Trust Score thresholds.
- **Preview / Render**: runs lifecycle flow (`queueRenderJob` → `startRenderJob`).
- **Export Folder Bundle**: creates investor asset pack with manifest, narrative, storyboard, captions, social files, render + sidecar.

### 4) Job Diagnostics
Check the Studio telemetry card for:
- job state (`queued`, `running`, `succeeded`, `failed`, `canceled`)
- retry count
- reason + error message
- render path

If jobs fail:
- inspect router/service code paths above
- verify ledger paths/env overrides:
  - `ANAVI_PLAN_METADATA_PATH`
  - `ANAVI_GEMINI_LEDGER_PATH`
  - `ANAVI_ASSET_PACKS_DIR`
  - `ANAVI_RENDER_JOBS_PATH`

## Guardrails
- Keep ANAVI-first terminology in generated user-facing content:
  - Relationship Custody, Trust Score, Blind Matching, Deal Room, Attribution, Intent.
- Do not claim completion without `pnpm check`, targeted animation tests, and `pnpm build`.
