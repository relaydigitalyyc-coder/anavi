# PRD R7 — Platform Logic Consistency + Flow Synchronization

Date: 2026-03-04  
Owner: Engineering  
Status: Active

## Goal

Eliminate systemic logical inconsistencies across the ANAVI product so Relationship Custody, Trust Score, Blind Matching, Deal Room, Attribution, and Intent flows operate as one coherent system in `demo`, `hybrid`, and `live` modes.

---

## Scope Summary

This R7 pass is a full-system consistency hardening initiative:

- Full route and navigation coherence
- Persona-flow coherence (Originator / Investor / Principal)
- Demo flow and live flow contract parity
- Runtime mode and auth guard coherence
- State-machine and lifecycle coherence (Match → Deal Room → NDA → Attribution/Payout)
- Docs + operational memory synchronization

---

## Canonical User Flow Map (Detailed)

### 1) Public Entry + Access Control

1. User lands on `/` and receives platform framing.
2. User selects one of:
   - `/login`
   - `/register`
   - `/forgot-password`
   - `/demo` (if demo runtime capability enabled)
3. If unauthenticated and route is protected:
   - In `live`: redirect path is enforced.
   - In `demo`/`hybrid`: synthetic/demo behavior must match capability flags only.

### 2) Onboarding Entry

1. `/welcome` and `/onboarding` are full-screen gated flows.
2. Onboarding completion must align with user model + downstream navigation assumptions.
3. Persona assumptions set during onboarding must remain consistent in dashboard state.

### 3) Authenticated Operating Core

1. `/dashboard` is command center.
2. Trust + custody core:
   - `/custody` (Relationship Custody)
   - `/attribution` (Attribution Ledger)
   - `/verification` (Trust Score proofing)
3. Match pipeline:
   - `/pipeline` (intro pipeline)
   - `/deal-flow` (investor flow)
   - `/deal-matching` + `/matches`
4. Transaction execution:
   - `/deal-rooms`
   - `/deal-rooms/:id`
   - `/deals`
   - `/compliance`
   - `/payouts`

### 4) Persona Journey Rails (from nav + workflow design)

#### Originator

`Dashboard → Custody Register → Introduction Pipeline / Deal Matching → Deal Room → Attribution/Payouts`

Critical invariants:
- Relationship Custody evidence remains linked to Attribution triggers.
- Blind Matching interactions only unseal identity on explicit mutual-consent milestones.

#### Investor

`Dashboard → Counterparty Intelligence / Deal Flow → Deal Matching → Deal Room → Portfolio/Payouts`

Critical invariants:
- Trust Score and verification indicators are coherent between list cards, detail pages, and action outcomes.
- Deal Flow actions map to persisted lifecycle transitions.

#### Principal

`Dashboard → Asset Register / Demand Room → Deal Matching → Deal Room → Close Tracker`

Critical invariants:
- Demand and close signals are consistent with room/document/compliance status.
- “What changed” telemetry reflects actual audit/activity events.

### 5) Adjacent Feature Surfaces (Must Not Break Core Flows)

- `/network`, `/analytics`, `/calendar`, `/family-offices`, `/targeting`, `/lp-portal`, `/capital-management`, `/real-estate`, `/commodities`, `/crypto-assets`, `/trading`, `/fee-management`, `/operator-intake`, `/knowledge-graph`, `/ai-brain`.

These must remain semantically consistent with core domain language and not introduce contradictory state semantics.

---

## Demo Flow Map (Meticulous)

### A) Runtime Preconditions

1. `useAppMode()` determines capabilities from runtime mode.
2. Demo surfaces are allowed only when `allowDemoFixtures` is true.
3. In `live`, demo is blocked with explicit UI messaging.

### B) Demo Experience Path

1. Enter `/demo`
2. Persona selection (and demo user naming)
3. Demo shell loads:
   - left nav sections
   - top bar with Trust Score chip + notifications
   - guided tour hooks with deterministic step-page mapping
4. Content pages traversed:
   - Dashboard
   - Relationships
   - Matches
   - Deal Rooms
   - Verification
   - Payouts
5. Deal room interior modal verifies end-to-end narrative continuity.

### C) Demo Contract Surface

There are two demo data pipelines in codebase:

1. `contexts/DemoContext.tsx` + `lib/demoFixtures.ts` (fixture scenarios)
2. `lib/DemoContext.tsx` + `lib/demoData.ts` (rich legacy demo model)

R7 objective:
- Canonicalize one path, bridge/retire the other, and enforce contract parity with live router expectations.

### D) Demo Parity Verification Checkpoints

1. Core entities represented consistently:
   - user profile
   - relationships
   - intents
   - matches
   - deal rooms
   - notifications
   - payouts
2. Trust Score and verification badges align with page copy.
3. Demo CTA semantics align with live action outcomes where applicable.
4. No route/page mismatch between demo nav labels and actual state transitions.

---

## Current Inconsistency Hypotheses (To Resolve)

1. Duplicate demo context/data pipelines can drift and create semantic mismatch.
2. Persona remnants (`developer`, `institutional`) can conflict with canonical app persona (`principal`) narrative.
3. Route and page labels can diverge from workflow rails.
4. Runtime capability flags may not be enforced consistently in all client/server paths.
5. Status taxonomies across match/deal/deal-room surfaces may be semantically inconsistent.
6. UX outcomes can present confidence that is not backed by persisted state in some modules.
7. Ops documentation may lag implementation truth.

---

## Massive Execution TODO (Humongous Backlog)

Legend:
- `[ ]` pending
- `[~]` in progress
- `[x]` done

### Epic A — Route + Wrapper + Guard Coherence

- [ ] A1. Build full route inventory from `App.tsx` including wrapper type.
- [ ] A2. Tag each route as public, shell-protected, or full-screen protected.
- [ ] A3. Verify each route has an intentional entry path from nav or CTA.
- [ ] A4. Identify orphan routes with no discoverable navigation path.
- [ ] A5. Verify `ShellRoute` usage matches dashboard shell expectations.
- [ ] A6. Verify `ProtectedPage` usage matches full-screen flow expectations.
- [ ] A7. Validate NotFound handling for unknown route in all runtime modes.
- [ ] A8. Validate redirect behavior for unauthenticated access in `live`.
- [ ] A9. Validate non-redirect behavior in `demo` where expected.
- [ ] A10. Validate `hybrid` behavior is explicit and deterministic.
- [ ] A11. Remove or refactor contradictory wrapper usage.
- [ ] A12. Document canonical route-wrapper policy in engineering docs.

### Epic B — Persona Model Coherence

- [ ] B1. Build canonical persona enum usage map across client/server.
- [ ] B2. Locate legacy persona aliases (`developer`, `institutional`) in active paths.
- [ ] B3. Decide canonical mapping strategy for legacy aliases.
- [ ] B4. Refactor nav configs to canonical persona semantics.
- [ ] B5. Refactor workflow rail logic to canonical persona semantics.
- [ ] B6. Verify persona-specific page labels and CTA copy alignment.
- [ ] B7. Verify localStorage persona persistence keys and migration behavior.
- [ ] B8. Add deterministic persona fallback behavior for invalid stored values.
- [ ] B9. Ensure demo persona selection maps cleanly to app persona rail.
- [ ] B10. Remove contradictory persona-specific dead branches.
- [ ] B11. Add tests for persona mapping invariants.
- [ ] B12. Update docs to define canonical persona taxonomy.

### Epic C — Demo System Unification

- [ ] C1. Inventory all imports of `contexts/DemoContext`.
- [ ] C2. Inventory all imports of `lib/DemoContext`.
- [ ] C3. Inventory all imports of `lib/demoFixtures`.
- [ ] C4. Inventory all imports of `lib/demoData`.
- [ ] C5. Build side-by-side schema diff of both demo data models.
- [ ] C6. Choose canonical demo contract path.
- [ ] C7. Implement migration/adapter for non-canonical consumers.
- [ ] C8. Remove or archive duplicate demo context where safe.
- [ ] C9. Ensure scenario model (`baseline/momentum/closing`) continuity.
- [ ] C10. Ensure guided tour step mapping remains valid post-refactor.
- [ ] C11. Ensure demo nav content parity with canonical product narratives.
- [ ] C12. Verify demo top-bar Trust Score + notifications semantics.
- [ ] C13. Verify demo Deal Room interactions reflect canonical lifecycle language.
- [ ] C14. Add contract tests for demo fixture shapes vs page consumers.
- [ ] C15. Add regression tests for demo flow route progression.
- [ ] C16. Validate demo-disabled UX in `live`.
- [ ] C17. Add docs section explaining canonical demo architecture.
- [ ] C18. Remove stale demo-only dead code branches.

### Epic D — Runtime Mode + Server Context Coherence

- [ ] D1. Validate `APP_RUNTIME_MODE` parsing behavior in backend env context.
- [ ] D2. Validate frontend mode parsing behavior (`VITE_APP_RUNTIME_MODE` fallback logic).
- [ ] D3. Verify synthetic user behavior in server context for non-production only.
- [ ] D4. Verify synthetic user is impossible in production `live`.
- [ ] D5. Verify `system.runtime` reflects true backend mode/capabilities.
- [ ] D6. Add runtime-mode diagnostics surface for easier contradiction triage.
- [ ] D7. Verify auth cookie path doesn’t produce mode-dependent paradoxes.
- [ ] D8. Confirm route-guard and backend synthetic-user assumptions match.
- [ ] D9. Add tests for mode capability boundaries.
- [ ] D10. Document exact runtime matrix (demo/hybrid/live).

### Epic E — Match/Deal/Deal Room State Machine Integrity

- [ ] E1. Document canonical match status transitions end-to-end.
- [ ] E2. Validate all match mutations against allowed transitions.
- [ ] E3. Validate `queueNda` behavior for race conditions and stale states.
- [ ] E4. Validate escalation semantics (`declined` + audit + notifications).
- [ ] E5. Validate `createDealRoom` preconditions (`mutual_interest`) in UI and server.
- [ ] E6. Validate NDA document generation fallback behavior and observability.
- [ ] E7. Validate deal-room access grant integrity for both counterparties.
- [ ] E8. Validate `getDocuments` NDA gating semantics.
- [ ] E9. Validate DocuSign envelope lifecycle semantics and statuses.
- [ ] E10. Ensure notifications use coherent type taxonomy across flows.
- [ ] E11. Ensure audit events use coherent action taxonomy across flows.
- [ ] E12. Add/expand integration tests for negative and edge transitions.
- [ ] E13. Add/expand notification/audit assertion coverage.
- [ ] E14. Align client status labels with backend enum truth.

### Epic F — UI/UX Contradiction Sweep

- [ ] F1. Build page-level copy consistency checklist for ANAVI terminology.
- [ ] F2. Remove “demo-looking” placeholders from production-intended surfaces.
- [ ] F3. Ensure CTA labels imply actual behavior (no fake-action semantics).
- [ ] F4. Ensure KPI cards reference real or clearly labeled simulated data.
- [ ] F5. Ensure status chips use consistent color + wording semantics.
- [ ] F6. Ensure Trust Score representation is consistent across pages.
- [ ] F7. Ensure Blind Matching sealing language is consistent.
- [ ] F8. Ensure Deal Room audit/custody language is consistent.
- [ ] F9. Ensure onboarding and runtime banners are non-contradictory.
- [ ] F10. Add screenshot QA checklist for key journey pages.

### Epic G — Testing + Verification Hardening

- [ ] G1. Add route inventory snapshot test.
- [ ] G2. Add persona mapping unit tests.
- [ ] G3. Add runtime capability matrix tests.
- [ ] G4. Add demo contract shape tests.
- [ ] G5. Add match lifecycle transition tests.
- [ ] G6. Add deal-room NDA gating tests.
- [ ] G7. Add notification/audit consistency tests.
- [ ] G8. Ensure `pnpm check` passes.
- [ ] G9. Ensure `pnpm test` passes.
- [ ] G10. Ensure `pnpm build` passes.
- [ ] G11. Add regression checklist execution evidence in PR/notes.

### Epic H — Documentation + Memory Sync

- [ ] H1. Update plan registry with R7 tracking.
- [ ] H2. Keep TODO board “Next Up” focused on highest leverage unresolved contradictions.
- [ ] H3. Append dated ENGINEERING_MEMORY notes after each major batch.
- [ ] H4. Keep `specs/` status fields synchronized with truth.
- [ ] H5. Ensure historical notes are archived, not deleted.
- [ ] H6. Sync R7 mission checkpoints into Obsidian memory vault.
- [ ] H7. Ensure no contradictions between README, AGENTS, and actual behavior.
- [ ] H8. Final closeout memo with resolved vs deferred contradiction register.

---

## Execution Strategy for Ralph (50 Passes)

1. Keep `specs/002-...` as highest-priority active spec.
2. Drive each pass with contradiction-first triage:
   - identify
   - fix
   - verify
   - sync docs
3. Require evidence in each pass:
   - changed files
   - commands run
   - contradiction resolved
4. Never mark complete while critical contradictions remain.

---

## Success Definition

R7 is successful when:

1. There are no unresolved critical contradictions in route/runtime/persona/demo/deal lifecycle behavior.
2. Demo and live pathways are coherent and explicitly bounded by mode capabilities.
3. ANAVI domain terms are consistently represented in UX and backend semantics.
4. Testing/build gates pass and docs/ops memory reflect reality.
