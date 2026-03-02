# PRD C1+C2 Unified Sprint Plan (Dashboard Upgrade)

**Date:** March 2, 2026  
**Scope:** Combine C1 (Dealmaker Command Center) and C2 (Owner-Operator Execution) into one execution sprint with shared components and persona-specific delivery.

## Sprint Goal

Ship one coherent dashboard upgrade where both dealmakers and principals can answer, in one screen: current risk, current opportunity, and next action.

## Workstreams

1. **Shared primitives (Week 1)**
- Build and stabilize shared dashboard surface components (`KpiRibbon`, `StoryBeats`, `LiveProofStrip`, action hierarchy).
- Add compact/comfortable mode and persist per persona.
- Add permissioning cues standard (`View`, `Restricted`, `Requires Consent`).

2. **Dealmaker command center (Week 1-2)**
- Relationship path confidence module.
- Match quality distribution module.
- Pipeline bottleneck alert module.
- Drill-through links from KPIs to filtered operational pages.

3. **Principal execution cockpit (Week 2)**
- Close risk micro-panels.
- Escrow certainty sub-metrics.
- Disclosure safety and incident panel.
- Blocker queue with primary CTA.

## Shared Success Criteria

- `pnpm check` clean.
- No demo dead-end flows.
- Every top-level card includes:
  - state
  - confidence/risk
  - primary action

## Exit Criteria

- Originator/investor/principal personas all have complete operational story beats.
- At least one live proof strip per core workflow.
- CTA hierarchy is consistent and intentional across all upgraded pages.
