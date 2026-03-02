# PRD C3: LP Reporting and Investor Experience Surface (Competitive Upgrade)

**Date:** March 2, 2026  
**Owner:** Product + Engineering  
**Status:** Draft for implementation  
**Primary personas:** Investor, LP-facing operators  
**Objective:** Deliver a reporting and portal-grade experience that feels production-ready for institutional allocators on first use.

## 1) Competitor Signals Used

- **Carta** highlights unified fund operations, real-time performance metrics (IRR/TVPI/DPI/RVPI), and LP self-service visibility.  
  Source: https://carta.com/fund-management/fund-administration/

- **Juniper Square** highlights one portal for fundraising/onboarding/reporting, strong permissioning, and self-service profile/payment/KYC updates.  
  Source: https://www.junipersquare.com/platform/investor-portal  
  Source: https://www.junipersquare.com/platform/insights

- **Addepar** highlights flexible reporting and API-enabled workflow integration for stakeholder-specific outputs.  
  Source: https://addepar.com/why-addepar/

## 2) Product Hypothesis

If ANAVI gives LP-grade performance clarity, document certainty, and self-service controls directly in the investor flow, perceived platform credibility and conversion to deeper engagement will increase.

## 3) Success Metrics

- `LP_self_service_rate`: % requests completed without operator intervention (target: +35%).
- `T_report_turnaround`: time to produce/update investor report package (target: -50%).
- `Dashboard_trust_signal`: qualitative rating in demos (target: 8+/10 from target users).
- `Portal_revisit_rate`: 7-day return rate after first investor session (target: +25%).

## 4) Scope

### In Scope

- Investor dashboard and investor-exclusive pages:
  - `DealFlow`
  - `Portfolio`
  - `CounterpartyIntelligence`
- LP-relevant summary surfaces in dashboard widgets.
- Self-service action framing and reporting clarity upgrades.

### Out of Scope

- Full production LP document workflow backend.
- Tax statement generation.

## 5) UX Requirements

- Replace generic status chips with institutional terms where relevant.
- Make performance + risk + compliance visible at the same decision level.
- Support “operator glance” mode: clear answer in < 10 seconds.

## 6) Implementation Plan

### Phase 1: LP-Grade Metrics and Reporting Language

**Files**
- `client/src/pages/Portfolio.tsx`
- `client/src/pages/Dashboard.tsx`
- `client/src/lib/copy.ts`

**Tasks**
1. Add optional metrics row for IRR/TVPI/DPI/RVPI in investor views (demo values acceptable).
2. Add report-period context (`MTD`, `QTD`, `YTD`) in key cards.
3. Standardize labels for institutional readability.

**Verification**
- `pnpm check`
- Copy review against white paper terminology.

### Phase 2: Self-Service and Permissioning Cues

**Files**
- `client/src/pages/CounterpartyIntelligence.tsx`
- `client/src/pages/DealFlow.tsx`
- `client/src/components/PersonaSurface.tsx`

**Tasks**
1. Add self-service action cluster (request docs, update profile intent, confirm settlement details).
2. Add permissioning cues (`view`, `restricted`, `requires consent`) to relevant modules.
3. Add investor-ready “publish snapshot” and “export statement” actions in visible UI.

**Verification**
- `pnpm check`
- Manual interaction pass for action consistency.

### Phase 3: Demo-Ready Investor Portal Narrative

**Files**
- `client/src/pages/Dashboard.tsx`
- `client/src/lib/demoFixtures.ts`

**Tasks**
1. Add “last updated” proof metadata and data freshness indicators.
2. Add 24h/7d live proof strip values tied to fixtures.
3. Add concise institutional explainer text for each primary investor widget.

**Verification**
- `pnpm check`
- Demo walkthrough dry run with investor persona.

## 7) Risks and Mitigations

- **Risk:** Surface promises exceed backend support.  
  **Mitigation:** clearly mark demo-only actions and keep copy factual.

- **Risk:** Metric overload on investor pages.  
  **Mitigation:** hard cap on top-level KPIs; move deep metrics into drill-down.

## 8) Release Criteria

- Investor and LP-facing screens demonstrate:
  - Performance clarity
  - Compliance confidence
  - Self-service readiness
- All top-level modules include one clear primary action and one risk/confidence signal.
