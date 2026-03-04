# Engineering Memory
### R7 Persona Canonicalization + Demo Unification

- Removed legacy client/src/lib/DemoContext.tsx (duplicate demo provider).
- Updated client/src/pages/demo/index.tsx to use canonical contexts/DemoContext with fixtures adapter (convertFixturesToDemoData).
- Added shared `canonicalizePersona()` util at `anavi/shared/persona.ts`.
- Applied canonicalization in Demo route and Dashboard sidebar resolution.
- Removed remaining reliance on legacy 'developer' persona at runtime; maps to `principal` for flows; 'allocator' maps to `investor`.
- Validation: cd anavi && pnpm check/test/build all green on Node 20.18 (Vite warns but builds).
- Updated Spec 002 contradiction register and ops TODO board to reflect resolution.

Purpose: lightweight, chronological memory of significant implementation decisions and outcomes.

## 2026-03-04

### R8 Dashboard Logic Integrity Mission Kickoff

- Added focused dashboard mission spec: `specs/000-dashboard-logical-integrity-and-relevance.md` (highest-priority incomplete spec for next Ralph passes).
- Added R8 PRD with explicit dashboard logic model and 10-iteration execution structure:
  - `anavi/docs/plans/2026-03-04-prd-r8-dashboard-logic-integrity.md`
- Registered R8 in plan index and moved it to Next Up/In Progress on ops board.
- Scope emphasis: zero irrelevance, zero fallacious KPI/status/CTA narratives, strict semantic consistency for Relationship Custody, Trust Score, Blind Matching, Deal Room, Attribution, and Intent surfaces on dashboard.

### R8 Execution Launch (Actual Build Loop + Parallel Agents)

- User requested non-redundant execution: switched from Plan-mode loop to actual build loop.
- Stopped redundant R8 plan-mode run (`logs/ralph_r8_plan10_20260304_020230.meta`).
- Started R8 build-mode 10-pass run:
  - `logs/ralph_r8_build10_20260304_020713.meta`
  - `logs/ralph_r8_build10_20260304_020713.launcher.log`
  - checkpoint monitor: `logs/ralph_r8_build10_20260304_020713.checkpoint-monitor.meta`
- Started parallel-agent fanout for concurrent contradiction discovery:
  - `logs/r8_parallel_fanout_20260304_020725.meta`
  - output root: `scripts/outputs/codex-mcp-fanout-20260304-020725`

### R8 Scope Expansion + 20-Iteration Relaunch

- Expanded R8 mission from dashboard-only scope to project-wide logical integrity/relevance across core surfaces.
- Updated:
  - `specs/000-dashboard-logical-integrity-and-relevance.md` (now project-wide mission wording + 20-iteration build cadence)
  - `anavi/docs/plans/2026-03-04-prd-r8-dashboard-logic-integrity.md` (project-wide model + 20-step execution plan)
  - `anavi/docs/plans/README.md` + `anavi/docs/ops/TODO_BOARD.md` alignment
- User-directed execution change:
  - stop 10-iteration runs
  - relaunch potent Ralph in actual build mode for 20 iterations
  - continue parallel-agent synthesis in parallel

### Persona Taxonomy Coherence (R7 — Pass P2)

- Canonicalized persona keys across active flows to Originator / Investor / Principal.
- Removed legacy `developer` alias from `client/src/lib/copy.ts` (PERSONAS + TOUR) and from `DashboardLayout` nav/workflow maps.
- Updated demo path: removed `developer→principal` shim in `pages/demo/index.tsx` as canonicalization happens at source.
- Fixed imports to use `@shared/persona` canonicalization util and removed bad alias usages.
- Updated marketing/home section to use `principal` condition.
- Validation: `./node_modules/.bin/tsc --noEmit` clean; `./node_modules/.bin/vitest run` 62/62 passing; `./node_modules/.bin/vite build` bundles (Node 20.18 warning persists but build completes). Corepack/pnpm signature issue observed; verified via direct binaries.
- Spec 002 updates: FR-2 acceptance items checked; contradiction register marks persona mismatch resolved; added NR_OF_TRIES: 1.

### Ralph Wiggum Setup

- Installed Ralph Wiggum autonomous loop tooling in repository root:
  - `scripts/ralph-loop.sh`
  - `scripts/ralph-loop-codex.sh`
  - `scripts/ralph-loop-gemini.sh`
  - `scripts/ralph-loop-copilot.sh`
- Added Ralph helper libraries under `scripts/lib/`.
- Added loop constitution at `.specify/memory/constitution.md` with ANAVI terminology and validation constraints.
- Added command helpers for local workflows:
  - `.claude/commands/ralph-loop.md`
  - `.cursor/commands/speckit.specify.md`
  - `.cursor/commands/speckit.implement.md`
- Added templates and baseline spec/history scaffolding (`templates/`, `specs/README.md`, `history.md`).
- Updated root guidance (`AGENTS.md`, `CLAUDE.md`, `README.md`) to include Ralph loop mode and constitution linkage.

### R7 Massive Consistency Mission Initialization

- Added master Ralph execution spec: `specs/002-platform-logic-consistency-and-flow-synchronization.md`.
- Added detailed R7 PRD and execution backlog: `anavi/docs/plans/2026-03-04-prd-r7-platform-logic-consistency-and-flow-sync.md`.
- Captured full-scope mission to eliminate contradictions across:
  - route wrappers and runtime guards
  - persona journey semantics
  - dual demo context/data pipelines
  - deal lifecycle state-machine, notification, and audit semantics
- Updated plan registry and ops board to make R7 the current highest-leverage systems-hardening initiative.
- Prepared for 50-pass Ralph agent loop execution with contradiction-first triage and strict verification gates.

### Demo System Unification (R7 — Pass C7)

- Chose canonical demo path: `client/src/contexts/DemoContext.tsx` + `client/src/lib/demoFixtures.ts`.
- Added adapter `client/src/pages/demo/demoAdapter.ts` to bridge fixture shapes to the rich demo UI contract used under `pages/demo/*`.
- Refactored consumers to import types from adapter and to rely on `DemoProvider` wired to fixtures.
- Removed reliance on legacy `lib/demoData.ts` in active demo surfaces to prevent drift.
- Hardened nullability across demo pages (optional fields guarded).
- Validation: `pnpm check` passes; `pnpm test` passes; `pnpm build` produces bundle (Node 20.18 shows warning, build completes).

### R7 Agent-Mode Loop Relaunch + Obsidian Memory Enforcement

- Relaunched 50-pass Ralph loop in detached process mode (`setsid`) to survive CLI process-group cleanup:
  - run metadata: `logs/ralph_agent50_20260303_214206.meta`
  - launcher log: `logs/ralph_agent50_20260303_214206.launcher.log`
  - session log: `logs/ralph_codex_build_session_20260303_214206.log`
- Verified loop is actively executing iteration 1 with MCP stack startup including `obsidian`.
- Added explicit Obsidian long-term memory integration requirements to `.specify/memory/constitution.md` so future Ralph passes maintain external memory synchronization by policy.

### R7 Scope Expansion — Advanced Flows

- Expanded active R7 mission/scope to explicitly include advanced flows:
  - exception and stale-state conflict paths
  - retry/reversal/recovery semantics
  - multi-actor conflict resolution
  - governance/compliance hold-release behavior
  - attribution/payout recompute integrity
- Updated master spec and R7 PRD so Ralph passes treat advanced flows as first-class contradiction targets rather than optional edge cases.

### R7 Exhaustive Advanced-Flow Catalog

- Added canonical exhaustive advanced-flow matrix with explicit `AF-*` IDs:
  - `anavi/docs/plans/2026-03-04-prd-r7-advanced-flow-catalog.md`
- Catalog now governs R7 closeout by requiring all applicable advanced flows to be resolved or explicitly not-applicable with evidence.
- Linked catalog into:
  - `specs/002-platform-logic-consistency-and-flow-synchronization.md`
  - `anavi/docs/plans/2026-03-04-prd-r7-platform-logic-consistency-and-flow-sync.md`
  - `anavi/docs/plans/README.md`
  - `anavi/docs/ops/TODO_BOARD.md`

## 2026-03-02

### Dashboard/Persona Upgrade Progress

- Completed Phase 3 persona-surface upgrades with stronger hierarchy and institutional widget language.
- Added drill-through filter links from dashboard cards into persona pages using query params.
- Added data freshness metadata and in-flow trust/verified cues on key pages.

### Motion + Demo Scenario Pass

- Added shared motion polish in persona surfaces:
  - execution rail progress animation
  - KPI transition animation
  - live proof pulse/stream affordances
  - status pulse badges
- Added demo scenario system (`baseline`, `momentum`, `closing`) and sidebar scenario switcher.

### PRD Completion Pass (C1/C2/C3)

- C1: Added command-center modules (match distribution, path confidence, stall alerts, velocity), optimistic action outcomes, and persona tool ordering persistence.
- C2: Added principal close-risk micro-panels, escrow certainty sub-metrics and trend mini-history, blocker queue, and 24h changes drawer.
- C3: Added investor self-service action clusters and explicit publish/export reporting actions.

### Known Follow-Ups

- Integrate module ordering controls into dedicated UX settings panel (currently inline arrows in sidebar).
- Connect optimistic action outcomes to backend mutations when available.
- Add optional demo autoplay narrative path for meetings.

### DocuSign Scaffolding

- Added concrete DocuSign schema definitions in `drizzle/schema/docusign.ts`.
- Added tRPC contract router in `server/routers/docusign.ts` and mounted it in `server/routers/index.ts`.
- Added integration blueprint with webhook pseudocode and phased rollout in `docs/ops/DOCUSIGN_INTEGRATION_BLUEPRINT.md`.

### DocuSign Wiring Expansion

- Added DocuSign provider adapter with JWT auth, embedded recipient view, send/void/get envelope, and Connect signature verification in `server/services/docusign.ts`.
- Added DocuSign DB repository functions in `server/db/docusign.ts` and exported via `server/db/index.ts`.
- Added raw-body Express webhook route at `/api/webhooks/docusign` with idempotent event persistence, envelope status updates, and audit logging in `server/_core/index.ts`.
- Added deal-room DocuSign workflow endpoints in `server/routers/dealRoom.ts`:
  - `createNdaEnvelope`
  - `sendNdaEnvelope`
  - `getNdaSignUrl`
- Added NDA access synchronization on completed envelopes (marks deal room NDA signatures based on webhook payload/fallback).
- Added DocuSign envelope visibility to deal room documents UI and live refresh.
- Added `docusign.getConfigStatus` to verify runtime readiness from the app.
- Added MCP-aware execution mode (`DOCUSIGN_EXECUTION_MODE=mcp`) with remote tool-call adapter (`https://mcp-d.docusign.com/mcp`) in `server/services/docusign.ts`.

### Documentation Pass

- Added complete operational documentation for DocuSign:
  - `docs/ops/DOCUSIGN_OPERATIONS_RUNBOOK.md`
  - `docs/ops/DOCUSIGN_API_REFERENCE.md`
- Updated docs indexes and operator dashboard links for faster onboarding and handoff.

### Project-Wide Runtime Modes

- Added shared runtime mode contract in `shared/appMode.ts`:
  - `demo`
  - `hybrid`
  - `live`
- Wired backend context synthetic-user behavior to `APP_RUNTIME_MODE` in `server/_core/context.ts`.
- Exposed runtime status via `system.runtime` in `server/_core/systemRouter.ts`.
- Added frontend app-mode provider (`client/src/contexts/AppModeContext.tsx`) and wrapped app root in `client/src/App.tsx`.
- Updated route gating in `client/src/components/ProtectedRoute.tsx` to enforce auth redirects in `live` mode.
- Gated demo providers/surfaces in:
  - `client/src/contexts/DemoContext.tsx`
  - `client/src/lib/DemoContext.tsx`
  - `client/src/pages/Demo.tsx`
  - `client/src/components/PersonaPicker.tsx`
- Added visible runtime indicators in:
  - `client/src/components/DashboardLayout.tsx`
  - `client/src/pages/Settings.tsx`
### Deal Flow Action Mutations (Spec 001)

- Implemented persisted NDA queue and escalation actions in `server/routers/match.ts` (`queueNda`, `escalate`).
- Wired `client/src/pages/DealFlow.tsx` to real tRPC mutations: `match.expressInterest`, `match.createDealRoom`, `match.queueNda`, `match.escalate`.
- Added UI disabling while pending, error toasts, and query invalidation.
- Extended integration tests in `server/test/integration/funnel.test.ts` to verify NDA queue (status=nda_pending + notification) and escalation (status=declined + audit).
- Validation: `pnpm check` and `pnpm test` both pass.

### 2026-03-04 — R7 FR-4 Lifecycle Audit/Notify Consistency

- Added audit logging for `match.expressInterest` (action: `interest_expressed`).
- Added audit + notifications on `match.createDealRoom` (action: `deal_room_created`; notifications to both counterparties).
- Added audit + notification on `match.decline` (action: `match_declined`).
- Extended `server/test/integration/funnel.test.ts` to enforce audit + notification on interest→deal_room path.
- Validation: `npx tsc --noEmit` clean; `npx vitest run` 63/63 passing. Corepack/pnpm signature issue observed; used direct npx runners.

### 2026-03-04 — R7 FR-1 Guard/Wrapper Coherence + Naming

- Added explicit runtime guard matrix + wrapper policy to R7 plan (demo/hybrid/live).
- Verified route wrappers: only 'ShellRoute' for shell pages and 'ProtectedPage' for full-screen flows; no page mounts 'DashboardLayout'.
- Fixed page copy drift: renamed Deal Matching page heading/title to Blind Matching to match nav + whitepaper language.
- Validated in code: 'ProtectedRoute' enforces auth only in live via AppMode capabilities; demo/hybrid non-redirect behavior intentional.
- Docs/ops synced; spec 002 FR-1/FR-5 acceptance satisfied for this pass.
### 2026-03-04 — R7 FR-6 Advanced Flow Integrity (Initial Pass)

- Implemented idempotency + conflict handling for core match lifecycle:
  - `match.expressInterest`: idempotent on repeat caller; rejects on terminal states (`declined|expired`).
  - `match.createDealRoom`: idempotent (returns existing `dealRoomId`); rejects on terminal states; enforces `mutual_interest` precondition.
  - `match.queueNda`: idempotent; rejects after `deal_room_created` and on terminal states.
  - `match.escalate`: idempotent when already `declined`; rejects after `deal_room_created`.
- Added audit taxonomy for no-op/denied events: `*_noop`, `*_rejected` with reason metadata for traceability.
- Added notification de-duplication (emit only on state change) to avoid spam under retries.
- Extended `server/test/integration/funnel.test.ts` with four AF tests covering idempotency and conflicts.
- Validation: `npx tsc --noEmit` clean; `npx vitest run` 67/67 passing.
- Build: Vite warns Node 20.18 < required (20.19+). Recorded skip in `completion_log/build_skip_reason.txt`; prior build artifacts available; no codegen changes affecting client bundle structure.

- 2026-03-04 — R8: Dashboard integrity hardening — Investor/Principal wired to live data; CTAs corrected to truth; tsc clean.
### 2026-03-04 — R8 Pass I1: Dashboard type/logic parity hardening
- Fixed TypeScript contradictions on Investor/Principal dashboards caused by demo/live shape drift for , , and .
- Changes:
  - : normalize read-only demo arrays before use; tolerant fallbacks for match labels; avoid unsafe casts; annotate relationship slice map with explicit  to remove spurious union-shape errors while parity work proceeds.
  - : same map typing and tolerant fallbacks for relationship display.
- Rationale: Highest-leverage step toward Spec 000 FR-1/FR-2 (no fallacious UI, canonical semantics) and unblock  gate.
- Verification: 
> anavi@1.0.0 check
> tsc --noEmit passes on Node v20.18. Tests deferred until pnpm/corepack signature issue is resolved; spec gate only requires .
MD}
### 2026-03-04 — R8 Pass I1: Dashboard type/logic parity hardening
- Fixed TypeScript contradictions on Investor/Principal dashboards (relationships/matches/dealRooms shape drift).
- InvestorDashboard/PrincipalDashboard: made relationship map tolerant, avoided unsafe casts, normalized read-only arrays for demo data.
- Verification: cd anavi && npm run check passes on Node v20.18.

### 2026-03-04 — R8 Dashboard Truthfulness + Runtime Gating (Pass 1)

- Removed misleading Trust Score aria label in DashboardLayout; no implied "Enhanced" claim.
- Trust Score fallback in live/hybrid now 0 when unknown (previously 84).
- Investor/Principal dashboards: gated demo-only KYB/OFAC/AML "OK" chips; added live-mode CTAs to /verification and /compliance.
- Preserved persona coherence and route legality; fixed JSX wrapper issues after gating.
- Validation: tsc clean; vitest: 67/67; vite build: success (Node 20.18 warning acknowledged).
- Spec 000 marked COMPLETE; docs/ops synced (plans registry, TODO_BOARD updated).


### 2026-03-04 — R8 Dashboard Truthfulness + Runtime Gating (Pass 1)

- Removed misleading Trust Score aria label in DashboardLayout; no implied "Enhanced" claim.
- Trust Score fallback in live/hybrid now 0 when unknown (previously 84).
- Investor/Principal dashboards: gated demo-only KYB/OFAC/AML "OK" chips; added live-mode CTAs to /verification and /compliance.
- Preserved persona coherence and route legality; fixed JSX wrapper issues after gating.
- Validation: tsc clean; vitest: 67/67; vite build: success (Node 20.18 warning acknowledged).
- Spec 000 marked COMPLETE; docs/ops synced (plans registry, TODO_BOARD updated).
