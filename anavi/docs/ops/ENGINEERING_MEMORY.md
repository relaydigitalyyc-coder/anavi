# Engineering Memory
### R7 Demo Unification — Duplicate DemoContext Removed

- Removed legacy client/src/lib/DemoContext.tsx (duplicate demo provider).
- Updated client/src/pages/demo/index.tsx to use canonical contexts/DemoContext with fixtures adapter (convertFixturesToDemoData).
- Mapped stray persona alias 'developer' to canonical 'principal' in demo route to enforce taxonomy consistency.
- Validation: cd anavi && pnpm check/test/build all green on Node 20.18 (Vite warns but builds).
- Updated Spec 002 contradiction register and ops TODO board to reflect resolution.

Purpose: lightweight, chronological memory of significant implementation decisions and outcomes.

## 2026-03-04

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
