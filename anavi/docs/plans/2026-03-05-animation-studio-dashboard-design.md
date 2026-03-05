# Animation Studio Dashboard Design

## Goal
Deliver a balanced-hybrid Animation Studio command center for Remotion workflows that feels premium, uses existing ANAVI UI primitives, and gates renders with Trust Score-aware plan validation.

## Scope
- Add a new authenticated studio page at `/animation-studio`.
- Add server endpoints for plan summary, validation, render execution, and Gemini asset requests.
- Reuse existing script modules (`scene-plan`, `render-hub`, `nano-banana`) and ledger files.
- Integrate in-repo cool UI components that make product sense (`InteractiveGlobe`, `EvervaultCard`).
- Package the workflow as a reusable global Codex skill.

## Non-Goals
- Do not add external 21st registry pulls in this pass.
- Do not introduce a new database schema.
- Do not replace existing dashboard personas or navigation architecture.

## UX Direction (Balanced Hybrid)
- Institutional information density with selective cinematic accents.
- Primary utility surfaces remain readable and stateful (metrics, gates, controls).
- Visual accents communicate ANAVI concepts:
  - `InteractiveGlobe` for networked render distribution.
  - `EvervaultCard` for sealed/Blind Matching-safe render handling.

## Information Architecture
- **Header strip**: studio title, plan status, Trust Score gate, last render freshness.
- **Control rail**: sliders and toggles for pacing, emotion depth, fidelity, rerender threshold, preview mode, override gate.
- **Action rail**: `Validate Plan`, `Preview`, `Kick Remotion Render`, `Request Gemini Asset`.
- **Telemetry rail**: render decision details, diff score, cache hit status, last Gemini asset metadata.

## Technical Architecture
### Frontend
- `AnimationStudioPage` orchestrates data + mutation hooks.
- `AnimationStudioControls` handles visual controls and action interactions.
- Route mounted via `ShellRoute` in `App.tsx`.
- New typed helper in `client/src/lib/api/animation-studio.ts` for gate-state logic.

### Backend
- New `animationStudioRouter` under `server/routers/` with protected procedures:
  - `getPlanSummary`
  - `validatePlan`
  - `runRender`
  - `requestGeminiAsset`
- Router delegates file/ledger logic to new `server/db/animationStudio.ts` module to respect repository structure.

### Script Interop
- `render-hub.ts` and `nano-banana.ts` default ledger paths are normalized to module-relative paths to avoid cwd drift.
- Studio API reads/writes the same ledgers for deterministic behavior.

## Data Flow
1. User changes sliders in UI.
2. `validatePlan` computes diff against latest stored plan and returns gate decision.
3. `runRender` executes render decisioning via render hub and returns path/metadata.
4. `requestGeminiAsset` writes or returns deterministic asset metadata from ledger.
5. `getPlanSummary` provides startup state and recent outcomes.

## Error Handling
- All studio procedures are authenticated (`protectedProcedure`).
- File IO and JSON parse failures return normalized tRPC errors with actionable messages.
- UI surfaces pending + blocked states and concise toasts.

## Testing Strategy
- Router tests using `appRouter.createCaller` for all new procedures.
- Pure helper tests for frontend gate-state logic.
- Keep existing script tests as regression baseline.

## Documentation + Ops Hygiene
- Register this design + plan in `anavi/docs/plans/README.md`.
- Append dated entry in `anavi/docs/ops/ENGINEERING_MEMORY.md`.
- Update `anavi/docs/ops/TODO_BOARD.md` with completed animation-studio batch.
