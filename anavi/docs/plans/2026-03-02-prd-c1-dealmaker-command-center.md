# PRD C1: Dealmaker Command Center (Competitive Upgrade)

**Date:** March 2, 2026  
**Owner:** Product + Engineering  
**Status:** Draft for implementation  
**Primary personas:** Originator, Investor  
**Objective:** Increase qualified deal throughput and decision speed by making relationship intelligence, match quality, and execution readiness visible in one operating surface.

## 1) Competitor Signals Used

- **Affinity** emphasizes automatic activity capture, relationship intelligence, and analytics dashboards for pipeline/funnel/team activity.  
  Source: https://www.affinity.co/  
  Source: https://www.affinity.co/product/crm  
  Source: https://www.affinity.co/product/analytics  
  Source: https://www.affinity.co/guides/affinity-analytics-for-private-capital-getting-started  
  Source: https://www.affinity.co/guides/affinity-analytics-for-private-capital-going-deeper

- **Intapp DealCloud** emphasizes relationship scoring, automated activity capture, and highly customizable dashboards/views per user and team.  
  Source: https://www.intapp.com/dealcloud/relationship-intelligence/  
  Source: https://www.intapp.com/private-capital/venture-capital/

## 2) Product Hypothesis

If ANAVI makes relationship strength, match quality, and progression bottlenecks visible in real time with role-specific actions, users will move from discovery to deal room faster and with less manual coordination.

## 3) Success Metrics

- `T_match_to_dealroom`: median hours from first qualified match to deal room open (target: -30%).
- `Triage_rate`: % of new matches triaged within 24h (target: +40%).
- `Warm_path_usage`: % of deals opened via identified relationship path (target: +25%).
- `Pipeline_stall_rate`: % of opportunities stalled > 7 days (target: -35%).

## 4) Scope

### In Scope

- Dashboard-level command center tiles for:
  - Match quality distribution
  - Relationship path confidence
  - Stage bottleneck alerts
  - Team activity velocity
- User-customizable module ordering and compact/expanded views.
- Action-first workflow cards (single dominant CTA per module).
- Drill-through from KPI -> list -> item detail.

### Out of Scope (for this PRD)

- Backend AI model changes for scoring logic.
- New identity providers or external compliance integrations.
- Database-level architecture changes.

## 5) UX Requirements

- No marketing hero blocks. Value must be shown through state and outcomes.
- Every primary card must include:
  - Current state (`what is true now`)
  - Confidence/risk cue (`how safe/strong this is`)
  - Next action (`what to do next`)
- Maintain ANAVI terms: Relationship Custody, Trust Score, Blind Matching, Deal Room, Attribution.

## 6) Implementation Plan

### Phase 1: Command Center Modules

**Files**
- `client/src/pages/Dashboard.tsx`
- `client/src/components/PersonaSurface.tsx`
- `client/src/lib/demoFixtures.ts`

**Tasks**
1. Add `Match Quality Distribution` module with bands (`90-100`, `80-89`, `<80`).
2. Add `Relationship Path Confidence` module with top 3 warm paths.
3. Add `Pipeline Stall Alerts` module with auto-priority sorting.
4. Add `Activity Velocity` module (24h/7d deltas).
5. Ensure every module has one primary CTA and optional secondary CTA.

**Verification**
- `pnpm check`
- Manual UI pass on desktop and mobile widths.

### Phase 2: Drill-through and Operator Flow

**Files**
- `client/src/pages/DealFlow.tsx`
- `client/src/pages/IntroductionPipeline.tsx`
- `client/src/pages/CustodyRegister.tsx`

**Tasks**
1. Add drill-through links from dashboard cards into filtered list views.
2. Persist filter context (stage, confidence, persona) in URL query params.
3. Add inline action outcomes (`opened room`, `queued NDA`, `escalated`) with optimistic UI.

**Verification**
- `pnpm check`
- Validate query param-based navigation preserves context.

### Phase 3: Personalization and Adoption

**Files**
- `client/src/components/DashboardLayout.tsx`
- `client/src/contexts/DemoContext.tsx`

**Tasks**
1. Add module order preferences per persona (localStorage for demo mode).
2. Add compact/expanded toggle for dense operating views.
3. Add first-run module hints (dismissible).

**Verification**
- `pnpm check`
- Validate preferences persist across refresh.

## 7) Risks and Mitigations

- **Risk:** Too many widgets reduce clarity.  
  **Mitigation:** enforce max 6 core modules per persona and hide secondary modules behind “More Ops”.

- **Risk:** Demo data can look synthetic.  
  **Mitigation:** add realistic timestamp distributions and mixed confidence ranges.

## 8) Release Criteria

- All Phase 1 modules shipping with primary CTA and drill paths.
- No TypeScript regressions.
- Demo walkthrough can answer in < 10 seconds:
  - What is highest-value opportunity now?
  - Where is pipeline blocked?
  - What is the next action?
