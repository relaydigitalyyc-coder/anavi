# PRD C4: Dashboard Flow Elegance System
**Date:** 2026-03-02  
**Status:** Approved for implementation  
**Owner:** Product + Engineering + Design  
**Scope:** Originator, Investor, Principal dashboard and persona-exclusive pages

## 1. Objective

Make the product feel more elegant by improving decision flow quality, interaction rhythm, and visual hierarchy, without adding banner-heavy marketing UI.

This PRD upgrades:
- Information sequencing (what appears first, second, and third)
- Action adjacency (important actions next to the data that justifies them)
- Story continuity across surfaces (custody -> match -> deal room -> economics)
- Institutional polish (clarity, confidence, low-noise visual language)

## 2. Product Constraints

- Preserve whitepaper framing: trust, custody, attribution, compliance, transparent economics.
- Preserve persona boundaries: no cross-persona data blur.
- Demo must remain fully narratable for all three personas.
- No decorative modules without operational value.

## 3. Design Intelligence Inputs (via `ui-ux-pro-max`)

Applied guidance:
- `product`: financial/data dashboard -> data-dense + drill-down analytics
- `style`: data-dense dashboard, drill-down analytics, real-time monitoring
- `typography`: corporate trust pairings suitable for finance
- `color`: trust-led blue/teal + strict contrast and border discipline
- `chart`: funnel for conversion flow, line for trend, bar for category comparison
- `ux`: strong contrast, error announcements, reduced motion, avoid infinite decorative motion
- `stack/react`: avoid unnecessary state, profile before optimization, preserve shared state at correct level

## 4. Elegance Definition (ANAVI-specific)

“Elegant” means:
- A user can identify the next best action in under 5 seconds.
- A user can explain “why this matters” in one sentence from each key panel.
- Every major panel has one explicit “act now” path and one “inspect details” path.
- Flows feel progressive, not fragmented.

## 5. Core UX Framework

Each persona surface must follow the same frame:
1. Signal: What changed, with confidence/verification context.
2. Decision: What this implies now.
3. Action: Highest-value action in place.
4. Proof: Audit/attribution/evidence link in-context.

## 6. Shared Component Upgrades

1. `Flow Ribbon` (top of each persona page):
- `Now`, `Next`, `Risk`, `Value at Stake`.

2. `Decision Cards`:
- one primary CTA + one secondary investigate CTA
- one confidence line and one freshness line.

3. `Inline Proof Chips`:
- `Verified`, `Sealed`, `Attribution Locked`, `Audit Trail`.

4. `Flow Stepper`:
- consistent step model per persona journey.

5. `Micro-KPI Rails`:
- compact trend + threshold + status.

## 7. Interaction Rules

- Use transitions for comprehension, not decoration.
- Default transition duration: 180-260ms, ease-out entry / ease-in exit.
- Respect `prefers-reduced-motion`.
- No continuous pulsing unless tied to live state or unresolved risk.

## 8. Metrics (Success Criteria)

- `Action Clarity`: +20% increase in first-click on primary action per page.
- `Flow Completion`: +15% completion from initial dashboard action to deal-room action.
- `Narrative Coherence`: 90% of demo runs complete without manual explanation of “what next.”
- `Visual Trust`: reduce support comments about “where to click” and “what status means.”

## 9. Delivery Phases

1. Phase C4-A: Shared flow system primitives.
2. Phase C4-B: Persona journey flow upgrades.
3. Phase C4-C: Metrics instrumentation and polish pass.

## 10. Definition of Done

- All persona dashboards and exclusive pages use the same flow framework.
- All primary widgets include action + proof + freshness states.
- Flows are demonstrably coherent from dashboard entry to economics outcomes.
- Demo narrative passes for Originator, Investor, Principal without ad-hoc explanation.
