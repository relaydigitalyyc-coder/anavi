# Specification: 000-project-logical-integrity-and-relevance

## Status

INCOMPLETE

## Mission Prompt (Ralph Build-Mode, 20 Iterations)

You are executing a precision hardening mission for the ANAVI project end-to-end.

Objective: make platform logic fully coherent with zero irrelevant modules, zero contradictory CTAs, and zero fallacious state narratives.

Core domain anchors:
- Relationship Custody
- Trust Score
- Blind Matching
- Deal Room
- Attribution
- Intent

### Non-Negotiable Rules

1. Remove irrelevance: every dashboard element must map to an actionable user flow.
2. Remove fallacies: no KPI, status chip, or CTA may imply behavior not backed by real state/mutation.
3. Canonical semantics only: one status meaning per lifecycle phase across cards, lists, and detail views.
4. Build-first execution: each iteration must deliver concrete contradiction reduction with verification evidence.
5. Contradiction-first triage: fix highest-leverage logical conflicts before polish.

### 20-Iteration Cadence

- Iterations 1–4: global inventory + contradiction register.
- Iterations 5–8: dashboard and navigation semantic integrity.
- Iterations 9–12: CTA/action-state/backend parity across major user flows.
- Iterations 13–16: persona/runtime/demo/live coherence across all core modules.
- Iterations 17–20: regression verification + docs/memory synchronization.

---

## Scope

### Project Surfaces (Core)

- `anavi/client/src/pages/Dashboard.tsx`
- `anavi/client/src/components/DashboardLayout.tsx`
- persona dashboard variants and dashboard-linked modules
- `anavi/client/src/App.tsx` and route wrapper composition
- core flow pages (`deal-flow`, `matches`, `deal-rooms`, `relationships`, `verification`, `payouts`)
- supporting contexts (`AppModeContext`, `DemoContext`) and shared persona/runtime contracts
- core backend routers driving lifecycle transitions and user-facing outcomes

### Project-Wide Linked Flow Surfaces

- matches/deal-flow/deal-room entry actions
- verification and trust indicators
- attribution and payout summaries
- scenario/runtime mode badges and labels
- audit + notification semantics for user-visible transitions

---

## Functional Requirements

### FR-1: System-Wide Information Relevance

- All production-intended modules, cards, and widgets must have explicit user-flow purpose.
- No dead/placeholder/ambiguous content in active user journeys.

**Acceptance Criteria**
- [ ] Every major surface block is mapped to a documented user-flow purpose.
- [ ] No orphan or low-signal UI block remains without an actionable next step.

### FR-2: KPI and Status Logic Integrity

- KPI values, trends, and status chips must align with canonical lifecycle semantics.
- Trust Score messaging must remain coherent with verification/compliance states.

**Acceptance Criteria**
- [ ] KPI labels and calculations are semantically consistent with backing data.
- [ ] Status chip text/color semantics are consistent across dashboard and related detail pages.

### FR-3: CTA Truthfulness and Mutation Consistency (Project-Wide)

- CTAs across all core flows must reflect real behavior and backend transition outcomes.
- No CTA may present optimistic success that diverges from persisted state.

**Acceptance Criteria**
- [ ] CTA outcomes are backed by mutation/audit/notification consistency.
- [ ] Retry/error/conflict states surface deterministic user guidance.

### FR-4: Persona Coherence Across Project

- Originator, Investor, and Principal variants must preserve role-true priorities across routes.
- Persona state switching must not create contradictory semantics on any core surface.

**Acceptance Criteria**
- [ ] Persona priorities align with canonical journey rails across key surfaces.
- [ ] Persona switching preserves route legality and logic consistency.

### FR-5: Runtime Mode Integrity Across Project

- Behavior in `demo`, `hybrid`, and `live` must be explicit and deterministic.
- Demo signals must never leak into live behavior assumptions.

**Acceptance Criteria**
- [ ] Runtime mode signals and behavior match capability rules.
- [ ] Live mode does not depend on demo-only assumptions.

### FR-6: Documentation and Memory Synchronization (Execution Integrity)

- All logical integrity hardening actions must be reflected in plans/ops/docs/Obsidian.

**Acceptance Criteria**
- [ ] `anavi/docs/plans/README.md` references active R8 project-integrity mission.
- [ ] `anavi/docs/ops/ENGINEERING_MEMORY.md` and `TODO_BOARD.md` reflect current truth.
- [ ] Obsidian mission note includes latest contradiction/resolution deltas.

---

## Contradiction Register (Initial)

- [ ] Surface-level relevance gaps (visual block without flow leverage).
- [ ] CTA/action outcomes that can desync from persisted lifecycle truth.
- [ ] KPI narratives that may overstate certainty versus underlying states.
- [ ] Persona priority drift and role-semantic mismatch across routes.
- [ ] Runtime mode messaging drift between surfaces and capability boundaries.

---

## Dependencies

- `anavi/client/src/pages/Dashboard.tsx`
- `anavi/client/src/components/DashboardLayout.tsx`
- `anavi/client/src/App.tsx`
- `anavi/client/src/contexts/AppModeContext.tsx`
- `anavi/client/src/contexts/DemoContext.tsx`
- `anavi/server/routers/match.ts`
- `anavi/server/routers/dealRoom.ts`
- `anavi/server/test/integration/funnel.test.ts`
- `anavi/docs/ops/*`
- `anavi/docs/plans/*`

---

## Completion Signal

Only when all acceptance criteria for this spec are verified and synchronized, output:

`<promise>DONE</promise>`

<!-- NR_OF_TRIES: 0 -->
