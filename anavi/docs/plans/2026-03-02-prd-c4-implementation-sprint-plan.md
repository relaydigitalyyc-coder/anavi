# PRD C4: Implementation Sprint Plan (Flow Elegance)
**Date:** 2026-03-02  
**Status:** Ready  
**Duration:** 2 sprints

## Sprint 1: System + High-Impact Surfaces

### Goals
- Ship shared flow primitives.
- Upgrade dashboard + one exclusive page per persona.

### Build Scope
1. Shared:
- `Flow Ribbon`
- `Decision Card`
- `Inline Proof Chip`
- `Micro-KPI Rail`

2. Originator:
- `Dashboard`
- `Custody Register`

3. Investor:
- `Dashboard`
- `Deal Flow`

4. Principal:
- `Dashboard`
- `Asset Register`

### QA Gates
- `pnpm check`
- mobile/desktop visual pass
- contrast and reduced-motion checks

## Sprint 2: Full Journey Continuity

### Goals
- Complete story beats end-to-end per persona.
- Add instrumentation and polish.

### Build Scope
1. Originator:
- `Introduction Pipeline`
- `Attribution Ledger`

2. Investor:
- `Counterparty Intelligence`
- `Portfolio`

3. Principal:
- `Demand Room`
- `Close Tracker`

4. Shared:
- event instrumentation for action clarity and flow completion
- empty/loading/error state standardization

### QA Gates
- all story beats pass without facilitator prompts
- no missing verification/proof cues in primary widgets

## Instrumentation Plan

Track these events:
- `flow_primary_action_clicked`
- `flow_secondary_action_clicked`
- `flow_step_completed`
- `flow_dropoff`
- `proof_detail_opened`

Dimensions:
- `persona`
- `page`
- `industry`
- `scenario`
- `mode` (demo/hybrid/live)

## Risks and Mitigation

1. Risk: Visual churn across pages.
- Mitigation: enforce shared primitives before page-level customization.

2. Risk: Persona drift.
- Mitigation: accept/reject checklist by persona journey beats.

3. Risk: Over-animation.
- Mitigation: reduced-motion + strict animation budget.

## Done Criteria

- All three personas have complete beat continuity.
- First-action clarity and flow completion metrics are captured.
- Demo walkthrough feels coherent and institutionally credible.
