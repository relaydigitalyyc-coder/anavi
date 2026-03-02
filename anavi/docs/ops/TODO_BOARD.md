# TODO Board

Last updated: 2026-03-02

## Next Up

- Wire optimistic UI action outcomes (`opened room`, `queued NDA`, `escalated`) to real backend mutations.
- Add principal `what changed in 24h` events from real activity/audit APIs.
- Add investor export/publish actions to real endpoints.
- Add DocuSign UI actions in Deal Room pages to call new endpoints (`createNdaEnvelope`, `sendNdaEnvelope`, `getNdaSignUrl`).
- Add migration generation/apply for new DocuSign schema tables.
- Set remaining DocuSign env vars (`DOCUSIGN_IMPERSONATED_USER_ID`, `DOCUSIGN_RSA_PRIVATE_KEY`, `DOCUSIGN_CONNECT_HMAC_SECRET`) and run live envelope test.

## In Progress

- Documentation organization and agent workflow normalization.
- DocuSign backend integration wiring (provider + webhook + deal room endpoint integration).

## Done

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

## Backlog

- Backend data model extension for scenario-aware telemetry and event streams.
- Full LP document/report generation flow.
- Escrow provider and legal workflow integration.
- DocuSign Phases C-E (webhooks, UX wiring, hardening) per `DOCUSIGN_INTEGRATION_BLUEPRINT.md`.

## Legacy

- Historical checklist retained at `../todo_legacy_2026-02-15.md`.
