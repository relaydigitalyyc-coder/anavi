# High-IQ Animation Studio Design

## Overview
This studio orchestrates deterministic Remotion renders, Motion Canvas/ML previews, and Gemini-assisted asset synthesis so the savant persona can script entire demo films without wasting LLM tokens re-rendering. The system is modular (render hub, behavior engine, nano banana Gemini suite, and dashboard) and all inputs flow through a shared `scene-plan` model.

## Goals
1. Enable repeatable, parameter-driven demo render pipelines that track intent, trust score, and attribution metadata.
2. Provide live previews (Motion Canvas / ML sketches) and Gemini-powered asset creation ("Nano Banana 2") to surface candidate visuals before committing a render.
3. Expose a studio dashboard with slider controls for pacing, emotion, render confidence, asset reuse, rerender gating, and Trust Score safety rules.
4. Prevent redundant renders by scoring plan changes and only rerunning when thresholds are exceeded, logging both plan diffs and Gemini prompt/asset usage.

## Key Components
- **Scene Plan Engine** (TypeScript library in `anavi/scripts/ai-animate.ts`): normalizes prompts/emotions/assets into a JSON plan with timestamps, durations, render quality options, and metadata tags (Trust Score, Attribution, Intent). Provides plan diff + confidence scoring helpers.
- **Render Hub** (Remotion + Motion Canvas orchestrator): consumes scene plans, routes scenes to Remotion compositions or Motion Canvas drivers, caches renders, and exposes `renderMedia` wrappers with pre-checks (dry-run, confidence gating). Also integrates `Nano Banana 2` (Gemini image gen) to refresh asset textures in plan creation stage.
- **Nano Banana 2** (Gemini image suite wrapper): high-level service that fabricates contextual assets (backgrounds, textures, character proxies) and returns metadata (prompt, version) to incorporate into plans/promise block. Exposes CLI and API to request gemini generations, caches them in the asset library.
- **Studio Dashboard** (React page): slider controls for `emotion depth`, `scene pacing`, `render fidelity`, `trust rerender threshold`, `attribution detail`, plus toggles for Gemini asset refresh, Motion Canvas preview, playback speed, and render target. Dashboard queries the plan engine, shows diff warnings, and only enables `Kick Render` when plan is safe.

## Data Flow
1. User updates sliders or writes high-level script; dashboard serializes values into `scene-plan.yaml` via Scene Plan Engine.
2. Plan Engine diff-checks existing plan; if change score below rerender threshold, it marks plan as `dry run` and updates preview state only (Motion Canvas + Gemini samples). Otherwise, it pushes plan to Render Hub.
3. Render Hub ensures cached renders are reused or re-rendered based on plan hash; writes render metadata to the `anavi/data/ai-render-metadata.json` ledger.
4. Gemini / Nano Banana 2 runs asynchronously for asset requests keyed by plan IDs; updates plan asset references and rerender gating.
5. Dashboard surfaces plan and render history, plus a slider-driven `Render Confidence` meter that references trust score heuristics.

## Dashboard UX
- Primary Canvas: shows plan timeline + Motion Canvas preview, with autop-run toggles for `Gemini refresh` and `LLM reuse guardrail`.
- Slider Cluster (`emotion depth`, `scene pacing`, `render fidelity`, `trust rerender threshold`) feed plan controller hooks.
- Render Controls: `Validate Plan`, `Preview (Motion Canvas)`, `Request Gemini Asset`, `Kick Remotion Render`, and `Push to Deal Room` steps.
- Meta Sidebar: lists last Gemini prompt (Nano Banana 2), plan hash, Trust Score, asset attribution, and rerender gate status.

## Safety and Intelligence
- Every slider change computes a diff score via Scene Plan Engine; if the score is below the rerender threshold slider, the dashboard warns but disables `Kick Render` unless overridden.
- Gemini asset requests are labeled in metadata so future renders re-use cached assets instead of re-generating, avoiding token waste.
- Render history stores the Trust Score (auto-calculated from plan complexity and reunion) so the savant can see which scenes are safe to rerender.

## Next Steps
1. Confirm design and document acceptance.
2. Use `writing-plans` skill to craft an implementation plan covering CLI, dashboard, Gemini integration, and metadata tracking.
3. Execute plan incrementally, verifying renders/diffs with the new dashboard.
