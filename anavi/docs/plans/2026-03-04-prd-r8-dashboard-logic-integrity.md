# PRD R8 — Project Logic Integrity (Zero Irrelevance / Zero Fallacy)

Date: 2026-03-04  
Owner: Engineering  
Status: Active

## Goal

Make ANAVI project behavior fully logical:

- every core element is relevant to execution flow
- every KPI/status signal is semantically defensible
- every CTA outcome matches persisted system truth

Core terminology remains ANAVI-first:
- Relationship Custody
- Trust Score
- Blind Matching
- Deal Room
- Attribution
- Intent

---

## Canonical Project Logic Model

### 1) Command Center Layer

Core surfaces are not static views; they are flow routers:
- “what changed”
- “what needs action”
- “what can be executed now”

Every major block must map to one of those intents.

### 2) Signal Layer

Dashboard signals must follow:
- verifiable source
- deterministic meaning
- explicit next action

No decorative metric without execution consequence.

### 3) Action Layer

All core CTAs must map to:
- valid route path
- valid backend precondition
- valid transition outcome
- valid audit + notification semantics where applicable

### 4) Persona + Runtime Layer

Persona-specific priorities:
- Originator: Relationship Custody / Attribution / Blind Matching pipeline readiness
- Investor: opportunity quality / Trust Score confidence / Deal Room progression
- Principal: asset-demand fit / close readiness / blocker resolution

Runtime-specific expectations:
- `demo`: explicit fixture behavior, no implied production persistence
- `hybrid`: bounded demo allowances with deterministic signaling
- `live`: no demo leakage, production-auth semantics only

---

## Project Flow Map

### A. Entry + Navigation

1. User enters public/authenticated surfaces.
2. Runtime mode and persona context are resolved.
3. Rendered surfaces expose only relevant signals for that mode/persona.

### B. Action Execution

1. User triggers CTA from dashboard or core linked surfaces.
2. CTA precondition is validated (front + server).
3. Mutation succeeds/fails/conflicts deterministically.
4. UI reflects canonical state; no false-positive success narrative.

### C. Cross-Surface Consistency

1. Dashboard status aligns with detail pages (`deal-flow`, `matches`, `deal-rooms`, etc.).
2. Trust Score / verification cues stay coherent.
3. Notifications and audit traces reconcile with dashboard surface claims.

---

## Contradiction Targets

1. Irrelevant blocks without flow leverage.
2. KPI/stat narratives that overstate confidence.
3. CTA labels not matching backend transition truth.
4. Persona-specific drift across routes/surfaces.
5. Runtime mode ambiguity leaking demo assumptions into live expectations.

---

## 20-Iteration Execution Plan (Build Mode)

1. Inventory dashboard blocks + purpose map.
2. Expand contradiction matrix project-wide (widget, KPI, CTA, persona, mode, route).
3. Fix highest-risk dashboard semantic conflicts.
4. Fix CTA precondition/outcome mismatches in dashboard-linked flows.
5. Reconcile persona priorities across dashboard + core pages.
6. Reconcile runtime mode behavior across core pages.
7. Validate lifecycle status parity between UI and backend transitions.
8. Add/extend tests for contradiction-prone transitions.
9. Verify route/detail parity for all major user-driven actions.
10. Remove or rework irrelevant low-signal modules.
11. Validate Trust Score/verification consistency across surfaces.
12. Validate Blind Matching/Deal Room/Attribution signal coherence.
13. Audit notification taxonomy for user-visible lifecycle claims.
14. Audit audit-event taxonomy for transition traceability.
15. Resolve remaining high-severity contradiction register items.
16. Re-run verification matrix and targeted regressions.
17. Sync plans/ops memory with resolved vs deferred contradictions.
18. Update Obsidian long-term mission record with evidence.
19. Final contradiction sweep with explicit residual-risk list.
20. Closeout report and next-wave backlog extraction.

---

## Success Definition

R8 success is achieved when:

1. No unresolved high-severity contradiction remains on core project surfaces.
2. Dashboard and linked core signals are semantically consistent and actionable.
3. CTAs are truth-aligned with system transitions.
4. Persona and runtime mode behavior remains deterministic.
5. Documentation and memory layers reflect implementation truth.


## Block→Flow Mapping (Pass 1)

- Investor → Compliance Passport → /verification, /compliance (live/hybrid); demo shows KYB/OFAC/AML chips.
- Principal → Compliance Passport → /verification, /compliance (live/hybrid); demo shows KYB/OFAC/AML chips.
- Top Bar → Trust Score chip → /verification for upgrade path (via Verification page actions).
- Mode chip displays ; live mode hides demo-only content.

Verification: tsc clean; vitest 67/67; production build OK (Node 20.18 warning).
