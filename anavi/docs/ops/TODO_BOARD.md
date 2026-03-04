# TODO Board

Last updated: 2026-03-04

## Next Up

- R7 Master Consistency Mission: resolve all logical contradictions across route/runtime/persona/demo/lifecycle systems (`specs/002-platform-logic-consistency-and-flow-synchronization.md`).
- Execute 50-pass Ralph hardening loop in agent mode with contradiction-first triage and strict verification gates.
- (Done via Spec 001) Wire optimistic UI action outcomes (`opened room`, `queued NDA`, `escalated`) to real backend mutations.
- Add principal `what changed in 24h` events from real activity/audit APIs.
- Add investor export/publish actions to real endpoints.
- Add DocuSign UI actions in Deal Room pages to call new endpoints (`createNdaEnvelope`, `sendNdaEnvelope`, `getNdaSignUrl`).
- Add migration generation/apply for new DocuSign schema tables.
- Set remaining DocuSign env vars (`DOCUSIGN_IMPERSONATED_USER_ID`, `DOCUSIGN_RSA_PRIVATE_KEY`, `DOCUSIGN_CONNECT_HMAC_SECRET`) and run live envelope test.

## In Progress

- Documentation organization and agent workflow normalization.
- DocuSign backend integration wiring (provider + webhook + deal room endpoint integration).
- Platform-wide logic consistency and flow synchronization hardening (R7).
- Demo system unification: fixtures canonical + adapter bridge (active).
- R7 50-pass Ralph agent-mode run active (`logs/ralph_agent50_20260303_214206.meta`).

## Done

- Ralph Wiggum autonomous loop setup completed (scripts, constitution, templates, Claude/Cursor command helpers).
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

## Backlog

- Backend data model extension for scenario-aware telemetry and event streams.
- Full LP document/report generation flow.
- Escrow provider and legal workflow integration.
- DocuSign Phases C-E (webhooks, UX wiring, hardening) per `DOCUSIGN_INTEGRATION_BLUEPRINT.md`.

## Legacy

- Historical checklist retained at `../todo_legacy_2026-02-15.md`.
- Deal Flow action outcomes now backed by persisted mutations (Spec 001): NDA queue, escalation, and open room flows wired end-to-end with tests.
- Massive consistency execution queue tracked in `anavi/docs/plans/2026-03-04-prd-r7-platform-logic-consistency-and-flow-sync.md`.
