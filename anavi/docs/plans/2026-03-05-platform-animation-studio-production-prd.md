# PRD — Animation Studio Production Readiness (R9)

**Date:** March 5, 2026  
**Owner:** Product + Engineering  
**Status:** Active  
**Supersedes:** `2026-03-05-animation-studio-dashboard-implementation-plan.md` (for production-completion scope)

## 1) Objective

Ship Animation Studio from “demo-capable control surface” to “usable production workflow” that can reliably create investor-grade animated sales and marketing assets with repeatable quality.

This PRD keeps ANAVI-first language explicit in outputs:
- Relationship Custody
- Trust Score
- Blind Matching
- Deal Room
- Attribution
- Intent

## 2) Current State Snapshot (as of March 5, 2026)

### What is already working
- `/animation-studio` page is live and integrated into app navigation.
- Studio controls support Trust Score-aware render gating.
- Backend routes exist for validation, render invocation, Gemini asset request, investor presets, and asset-pack export.
- Folder bundle export exists and produces:
  - `manifest.json`
  - `scene-plan.json`
  - `claude-context.json`
  - `narrative.md`
  - `storyboard.md`
  - `captions.srt`
  - social copy files
  - copied render artifact + sidecar

### What is not yet production-ready
- Render artifacts are placeholder media, not final Remotion-produced videos.
- No persistent render job queue with retries/cancellation/priority.
- No explicit composition registry + shot timeline architecture for multiple output formats.
- No publish pipeline from bundle output to destination channels/workflows.
- No operator runbook for failure recovery and quality controls.

## 3) Success Criteria

Animation Studio is “usable and making animations” when all are true:

1. Studio outputs real MP4 renders from Remotion compositions (not placeholders).
2. At least three investor presets consistently generate usable assets:
   - 30s teaser
   - 90s walkthrough
   - 5m investment committee cut
3. End-to-end path is deterministic:
   - configure → validate → render → package → review → publish.
4. A non-engineer can produce a complete asset pack from UI in under 20 minutes.
5. `pnpm check`, `pnpm test`, and `pnpm build` are green at each release gate.

## 4) User Jobs

### Primary user: Founder / Operator
- Needs investor-grade animated demo assets for fundraising and sales.
- Needs one-click reusable presets for speed.
- Needs confidence that messaging is consistent and defensible.

### Secondary user: Growth / Content operator
- Needs channel-ready artifacts from one source.
- Needs predictable output structure for distribution.

### Tertiary user: Technical operator
- Needs observability, deterministic retries, and low-friction debugging.

## 5) Functional Requirements

### FR-1: Real Render Engine
- Replace placeholder artifact generation with actual Remotion render pipeline.
- Support composition selection by preset/output type.
- Persist render metadata (duration, fps, composition, runtime, output size).

**Acceptance criteria**
- Rendering creates valid playable MP4 output.
- Render metadata sidecar captures composition + technical parameters.

### FR-2: Composition + Timeline System
- Define composition registry for each investor preset.
- Ensure scene-plan mapping to composition props is stable.
- Add deterministic shot sequencing with timestamps.

**Acceptance criteria**
- Same preset + same settings produce same timeline structure.
- Timeline can be inspected in bundle outputs.

### FR-3: Render Job Orchestration
- Add job queue state model (`queued`, `running`, `succeeded`, `failed`, `canceled`).
- Add retry behavior with capped attempts and explicit failure reasons.
- Add cancel endpoint.

**Acceptance criteria**
- UI reflects live job state transitions.
- Failed jobs capture actionable error diagnostics.

### FR-4: Asset and Prompt Pipeline
- Keep Gemini (Nano Banana) asset requests versioned and attributable.
- Persist prompt lineage across rerenders.
- Reuse cached assets when intent/settings unchanged.

**Acceptance criteria**
- Each render references concrete asset IDs and prompt lineage.
- Re-render without changes reuses previous assets by default.

### FR-5: Narrative Pipeline (Claude + fallback)
- Preserve deterministic fallback narrative behavior when AI provider unavailable.
- Store narrative provider and context payload in every bundle.
- Keep required terminology consistent in generated scripts.

**Acceptance criteria**
- Every pack includes `claude-context.json`.
- Pack reports provider (`claude` vs `fallback`) in manifest.

### FR-6: Review UX + Approvals
- Add pack history panel in studio UI.
- Add “review checklist” before publish (terminology, CTA, proof points, captions).
- Add open-folder and copy-path convenience actions.

**Acceptance criteria**
- User can find and reopen last N bundles from UI.
- Publish remains blocked until checklist is complete.

### FR-7: Publish/Distribution Pipeline
- Add explicit destination adapters (initially file-system + manual share target metadata).
- Support export variants by channel (X, LinkedIn, YouTube short/long metadata).
- Track publish attempts and outcomes.

**Acceptance criteria**
- Bundle contains destination-ready variants and publish ledger entry.
- Publish actions are auditable and reversible where applicable.

### FR-8: Quality Gates
- Add automated content checks (required terminology presence, no missing CTA).
- Add technical checks (duration bounds, resolution target, caption file integrity).
- Add policy check for Trust Score floor and gate override logging.

**Acceptance criteria**
- Pack marked `ready_to_publish` only after all gates pass.
- Override actions are explicitly logged in manifest and audit stream.

### FR-9: Storage and Retention
- Configure canonical output directories and retention policy.
- Ensure relative/absolute path stability across environments.
- Add optional cleanup command for expired packs.

**Acceptance criteria**
- Output pathing is deterministic and environment-safe.
- Cleanup never removes active/latest artifacts.

### FR-10: Observability + Cost Controls
- Track render latency, failure rates, and AI generation counts.
- Track estimated cost per pack.
- Emit structured logs for bundle ID and render ID correlation.

**Acceptance criteria**
- Ops can trace one pack from settings to publish event.
- Failure triage can be done without rerunning blindly.

## 6) Non-Functional Requirements

- Reliability: <5% failed render rate for supported presets under normal local environment.
- Determinism: identical settings produce equivalent scene structures and predictable file sets.
- Performance: first usable preview in <90 seconds for standard 30s/90s outputs.
- Security: no API keys or secret-bearing payloads written into bundles.

## 7) Phased Delivery Plan

### Phase A — Render Core Hardening
- Real Remotion render integration.
- Composition registry + scene mapping.
- Job status model and retry/cancel support.

### Phase B — Content System Completion
- Narrative quality gates and checklist.
- Pack history + UI review flow.
- Stronger prompt/asset lineage.

### Phase C — Publish and Operations
- Destination adapters and publish ledger.
- Runbooks, retention controls, and metrics dashboards.
- Final production-readiness verification report.

## 8) Ralph Methodology (Execution Contract)

Use spec-driven iteration until completion with contradiction-first triage:

1. Pick active spec for this mission (`specs/005-animation-studio-productionization.md`).
2. Execute in short passes with explicit evidence after each pass.
3. After each substantive batch:
   - update `anavi/docs/ops/ENGINEERING_MEMORY.md`
   - update `anavi/docs/ops/TODO_BOARD.md`
4. Never claim done without:
   - criteria verification
   - passing checks/tests/build
   - unresolved contradictions explicitly listed

## 9) Verification Gates (per pass)

Run from `anavi/`:

```bash
pnpm check
pnpm test
pnpm build
```

Targeted suites should run first for fast signal, then full gate.

## 10) Risks and Mitigations

- **Risk:** Real render integration introduces flaky environments.  
  **Mitigation:** deterministic composition contract + fallback smoke renders + clear diagnostics.

- **Risk:** Narrative quality drifts across AI providers.  
  **Mitigation:** hard terminology checks + provider-tagged outputs + fallback baseline copy.

- **Risk:** Bundle sprawl and storage growth.  
  **Mitigation:** retention policy + pack indexing + cleanup command.

## 11) Definition of Done

This PRD is complete when:
- all FR acceptance criteria are met,
- the spec in `specs/005-animation-studio-productionization.md` is marked `COMPLETE`,
- all verification gates pass with evidence logged,
- and the studio is reliably producing real investor-ready animation bundles end-to-end.
