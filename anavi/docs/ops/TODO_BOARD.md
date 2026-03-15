# TODO Board

Last updated: 2026-03-15

## Next Up

- R8 Project Logic Integrity Mission: extend dashboard integrity/relevance discipline across all core project surfaces (`specs/000-dashboard-logical-integrity-and-relevance.md`).
- Run potent Ralph in actual BUILD mode for R8 with a 20-iteration execution window.
- Use parallel-agent fanout for project-wide contradiction discovery and synthesis before/alongside R8 implementation.
- R7 Master Consistency Mission: resolve all logical contradictions across route/runtime/persona/demo/lifecycle systems (`specs/002-platform-logic-consistency-and-flow-synchronization.md`).
- Execute 50-pass Ralph hardening loop in agent mode with contradiction-first triage and strict verification gates.
- Expand R7 execution to advanced flows: exception, retry, reversal, multi-actor conflict, governance hold/release, and recovery semantics.
- Execute exhaustive `AF-*` advanced-flow catalog and keep unresolved critical items as closeout blockers (`anavi/docs/plans/2026-03-04-prd-r7-advanced-flow-catalog.md`).
  - Initial AF pass complete for match lifecycle idempotency/conflicts (interest/deal-room/NDA/escalate) with tests.
- Add principal `what changed in 24h` events from real activity/audit APIs.
- Harden `match.createDealRoom` with transaction/compensation safety to prevent partial write drift on mid-sequence failures.
- Add DocuSign UI actions in Deal Room pages to call new endpoints (`createNdaEnvelope`, `sendNdaEnvelope`, `getNdaSignUrl`).
- Add migration generation/apply for new DocuSign schema tables.
- Set remaining DocuSign env vars (`DOCUSIGN_IMPERSONATED_USER_ID`, `DOCUSIGN_RSA_PRIVATE_KEY`, `DOCUSIGN_CONNECT_HMAC_SECRET`) and run live envelope test.
- Add asset-pack publishing workflow from Animation Studio folder bundles to external distribution channels.

## In Progress

- R8 project logic integrity hardening (actual BUILD-mode 20-pass Ralph run + parallel-agent synthesis).
- DocuSign backend integration wiring (provider + webhook + deal room endpoint integration).

## Done

- 2026-03-14 — R8 wave delivery: live dashboard data integrity wiring and action execution complete.
  - Added real endpoint integrations for `match.marketDepth`, `notification.pendingActions`, and `analytics.liveProof`.
  - Wired investor publish/export actions to `payout.publishSnapshot` and `payout.exportStatement` with idempotent audit-backed server behavior.
  - Added targeted tests for `match.liveStats` + Deal Flow status filter helper; verification gates green (`pnpm check`, targeted `pnpm test`, `pnpm build`) with command evidence logged in `docs/ops/ENGINEERING_MEMORY.md` (2026-03-14 entry).
- Visual intensity second pass for VC ad pack — COMPLETE: integrated landing motif animations (globe arcs, encrypted matrix, perspective card motion) and rerendered 30s/60s/90s outputs.
- VC prompt-pack rerender pass — COMPLETE: cleared `anavi/data/renders`, applied prompt-driven VC narrative structure, and regenerated 30s/60s/90s Remotion outputs.
- VC Remotion ad cuts for ANAVI private markets messaging — COMPLETE: delivered 30s punch, 60s narrative, and 90s mini IC tracks with Trust Score, Blind Matching, Deal Room, Attribution, and Intent framing.
- Spec 005 (Animation Studio productionization) — COMPLETE: render job lifecycle APIs, diagnostics UI, and verification gates (`specs/005-animation-studio-productionization.md`).
- Animation Studio investor asset production pass: preset catalog, Claude-context narrative generation, and one-click folder bundle export (`/animation-studio`).
- Animation Studio dashboard slice: `/animation-studio` shell page, studio controls, animationStudio router, IO layer, and test coverage.
- **SHIP PASS (2026-03-04)**: tsc clean, 67/67 tests, build green, .env.example, README accurate, zero TODO/FIXME in core paths. Report: `docs/ops/SHIP_REPORT.md`.
- Spec 002 (Platform Logic Consistency) — COMPLETE. Compliance/payout governance deferred to `specs/003-compliance-payout-governance.md`.
- Spec 001 (Deal Flow Action Mutations) — COMPLETE.
- Spec 000 (Dashboard Logical Integrity) — COMPLETE.
- Platform-wide logic consistency and flow synchronization hardening (R7) — lifecycle items COMPLETE; governance items deferred.
 - 2026-03-15 — Spec 003 (Compliance/Payout Governance) — COMPLETE: compliance gates for Deal Room and Payout execution, admin setDealStatus, payout recompute preview, tests added.
- Demo system unification — removed duplicate DemoContext; demo route uses canonical contexts/DemoContext + fixtures adapter. Persona canonicalization wired.
- Ralph Wiggum autonomous loop setup completed (scripts, constitution, templates, Claude/Cursor command helpers).
- R7 FR-1: Route/wrapper coherence verified; added runtime guard matrix (demo/hybrid/live) to R7 plan; Blind Matching naming aligned (page title + h1).
- Persona-specific dashboard and page upgrades for Originator, Investor, Principal.
- Shared `PersonaSurface` institutional component system (KPI ribbon, story beats, live proof, action cards).
- Dashboard drill-through filtering and freshness metadata across persona flows.
- Motion/state polish and status pulse implementation.
- Demo scenario framework (`baseline`, `momentum`, `closing`) and switcher integration.
- C1/C2/C3 PRD pass for missing UI-level modules and workflow depth.
- DocuSign data model and tRPC endpoint contracts scaffolded.
- DocuSign provider service + webhook processing + deal-room NDA workflow endpoints wired.
- DocuSign runbook and API reference docs added for implementation and operations handoff.
- Project-wide runtime mode contract (`demo` / `hybrid` / `live`) wired across backend context/auth and frontend routing/demo surfaces.
- Demo system canon selected; adapter implemented; pages updated; checks/build green.
- R7 Demo unification (duplicate DemoContext removed; demo route updated); checks/tests/build pass.
- Persona taxonomy coherence: removed `developer` alias in active flows, unified on `principal`; updated nav/workflow maps and demo path; spec 002 FR-2 acceptance satisfied.

## Backlog

- Backend data model extension for scenario-aware telemetry and event streams.
- Full LP document/report generation flow.
- Escrow provider and legal workflow integration.
- DocuSign Phases C-E (webhooks, UX wiring, hardening) per `DOCUSIGN_INTEGRATION_BLUEPRINT.md`.

## Legacy

- Historical checklist retained at `../todo_legacy_2026-02-15.md`.
- Deal Flow action outcomes now backed by persisted mutations (Spec 001): NDA queue, escalation, and open room flows wired end-to-end with tests.
- Massive consistency execution queue tracked in `anavi/docs/plans/2026-03-04-prd-r7-platform-logic-consistency-and-flow-sync.md`.

<!-- continuous-learning-v2:start -->
### Continuous Learning v2 Backlink Actions (2026-03-11T16:22:36Z)

- No queued actions.

<!-- continuous-learning-v2:end -->
