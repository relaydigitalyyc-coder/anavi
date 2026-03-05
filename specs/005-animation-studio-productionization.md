# Specification: 005-animation-studio-productionization

## Status

PENDING

## Mission Prompt (Ralph Build Loop)

Make Animation Studio fully usable for real animation output and investor asset production, not placeholder media.

This spec operationalizes:
- `anavi/docs/plans/2026-03-05-platform-animation-studio-production-prd.md`

Use ANAVI-first terminology in all user-facing copy and generated content:
- Relationship Custody
- Trust Score
- Blind Matching
- Deal Room
- Attribution
- Intent

## Non-Negotiable Execution Rules

1. No completion claim without evidence (`pnpm check`, `pnpm test`, `pnpm build`).
2. No placeholder render outputs for completion criteria requiring production render.
3. No silent failures; all failed states must produce actionable metadata.
4. Keep docs and ops memory synchronized after each substantive pass.

## Functional Requirements

### FR-1: Real Media Rendering
- Render pipeline must produce playable MP4 artifacts via Remotion compositions.
- Metadata sidecar must include composition identity and technical render details.

### FR-2: Job Lifecycle Integrity
- Render job lifecycle must support queueing, running, success, failure, and cancellation.
- Failures must store deterministic diagnostics and retry count.

### FR-3: Preset Reliability
- Presets `teaser_30s`, `walkthrough_90s`, and `ic_5min` must produce complete asset packs.
- Generated outputs must include narrative, storyboard, captions, and social variants.

### FR-4: Narrative Integrity
- Claude-context payload must be included in each bundle.
- Fallback mode must remain deterministic when AI provider keys are missing.
- Required ANAVI terminology must be present in final narrative artifacts.

### FR-5: Review + Publish Readiness
- Studio UI must expose latest bundles and readiness state.
- Publish pathway must be explicit, with logged outcomes.

### FR-6: Operational Hardening
- Output directory behavior must be deterministic across environments.
- Retention/cleanup path must not remove current active artifacts.

## Acceptance Criteria

- [ ] Real MP4 render artifacts are generated in production path.
- [ ] Render jobs expose full lifecycle state and failure diagnostics.
- [ ] All three investor presets produce complete folder bundles.
- [ ] Bundle manifests include provider, terminology checks, and lineage data.
- [ ] UI exposes pack history and publish-readiness state.
- [ ] `pnpm check`, `pnpm test`, and `pnpm build` pass.

## Implementation Checklist

- [ ] Integrate real Remotion render execution (replace placeholder outputs).
- [ ] Add/complete render job state model and persistence.
- [ ] Add pack history and review checklist in Animation Studio UI.
- [ ] Add publish-ledger model and destination adapter contract.
- [ ] Add terminology and technical quality gates for bundle readiness.
- [ ] Add retention cleanup command and guardrails.
- [ ] Update docs/ops memory and plan registry references.

## Testing Requirements

### Code Quality
- `pnpm check` must pass clean.

### Functional Verification
- Targeted tests for animation studio DB/router/scripts:
  - `pnpm vitest run tests/scene-plan.test.ts tests/render-hub.test.ts tests/nano-banana.test.ts tests/animation-studio-router.test.ts tests/animation-studio-client.test.ts`
- Extend/add tests for new job lifecycle + publish behavior.

### Build Verification
- `pnpm build` must pass.

## Ralph Iteration Instructions (20-pass cadence)

1. Passes 1-4: render core replacement and composition mapping.
2. Passes 5-8: job lifecycle + diagnostics + retries/cancel.
3. Passes 9-12: preset reliability and bundle completeness.
4. Passes 13-16: review UX + publish-readiness and publish ledger.
5. Passes 17-20: ops hardening, retention, and contradiction sweep.

After each pass batch:
- append dated entry to `anavi/docs/ops/ENGINEERING_MEMORY.md`
- move completed tasks in `anavi/docs/ops/TODO_BOARD.md`
- run verification gates before advancing phase.

## Completion Signal

Mark this spec complete only when all acceptance criteria are checked and evidence is recorded in ops docs.

<!-- NR_OF_TRIES: 1 -->
