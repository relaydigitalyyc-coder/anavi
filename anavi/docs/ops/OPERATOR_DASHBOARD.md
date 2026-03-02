# Operator Dashboard

Last updated: 2026-03-02

## Quick Links

- Active TODO board: `TODO_BOARD.md`
- Engineering memory: `ENGINEERING_MEMORY.md`
- DocuSign blueprint: `DOCUSIGN_INTEGRATION_BLUEPRINT.md`
- DocuSign runbook: `DOCUSIGN_OPERATIONS_RUNBOOK.md`
- DocuSign API reference: `DOCUSIGN_API_REFERENCE.md`
- Dated handoff packet: `HANDOFF-2026-03-02-DOCUSIGN.md`
- App plan registry: `../plans/README.md`
- Plan manifest and naming standard: `../../../docs/plans/PLAN_MANIFEST.md`, `../../../docs/plans/NAMING_CONVENTIONS.md`

## Current Sprint Focus

- Finalize C1/C2/C3 dashboard execution quality.
- Convert optimistic UI outcomes into real backend mutations.
- Tighten investor export/publish and principal risk event plumbing.

## Top Risks

- Action outcomes still UI-only in some paths (backend coupling pending).
- Principal 24h change feed is fixture-backed, not live event-backed.
- Reporting/export actions are visible but not fully integrated.

## Acceptance Snapshot

- `pnpm check`: passing.
- Persona surfaces: Originator, Investor, Principal upgraded.
- Demo story: scenario-driven (`baseline`, `momentum`, `closing`) enabled.

## Decision Log (current)

- Chose additive organization (indexes/manifests) over moving historical files.
- Established canonical operational docs under `anavi/docs/ops`.
- Established naming standard for future plan docs.
