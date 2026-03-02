# PRD C2: Owner-Operator Execution Surface (Competitive Upgrade)

**Date:** March 2, 2026  
**Owner:** Product + Engineering  
**Status:** Draft for implementation  
**Primary persona:** Principal / Asset Owner  
**Objective:** Turn principal views into a trust-first execution cockpit where sealing, disclosure control, milestone progress, and capital certainty are immediately legible.

## 1) Competitor Signals Used

- **Addepar** focuses on unified data, real-time analysis, flexible reporting, and API-connected workflows.  
  Source: https://addepar.com/why-addepar/  
  Source: https://addepar.com/case-studies/cdr

- **BlackRock eFront/Aladdin Alternatives** emphasizes whole-portfolio transparency, risk lenses, and lifecycle visibility.  
  Source: https://www.blackrock.com/aladdin/products/aladdin-alternatives

## 2) Product Hypothesis

If principals can see disclosure safety, escrow progress, and close blockers in one place, they will trust the platform to run high-value raises without leaking thesis details.

## 3) Success Metrics

- `Disclosure_incidents`: unauthorized disclosure count (target: 0).
- `T_nda_to_commitment`: median time from NDA to first commitment (target: -25%).
- `Milestone_slippage`: missed milestone ratio (target: -30%).
- `Escrow_confidence_index`: weighted metric of committed/target + event completeness (target: +20%).

## 4) Scope

### In Scope

- Principal dashboard and principal-exclusive pages:
  - `AssetRegister`
  - `DemandRoom`
  - `CloseTracker`
- Add operational risk lenses and disclosure controls UI.
- Add live proof strip for 24h movement and blocker state.

### Out of Scope

- Legal document generation engine changes.
- New escrow provider integrations.

## 5) UX Requirements

- Sealed by default visual language: clear, consistent badges and state chips.
- Every milestone module must show:
  - Progress
  - Blocking condition
  - Next release trigger
- Escrow module must expose certainty, not just progress percentage.

## 6) Implementation Plan

### Phase 1: Principal Dashboard Hardening

**Files**
- `client/src/pages/Dashboard.tsx`

**Tasks**
1. Add `Close Risk` micro-panel group: compliance blocker, document readiness, counterparty response SLA.
2. Add `Escrow Certainty` sub-metrics: committed ratio, docs complete ratio, audit continuity.
3. Add `Disclosure Safety` panel: sealed counterparties, controlled disclosures, incident count.
4. Upgrade primary CTA hierarchy (`Request Full Access` and one page-level primary action).

**Verification**
- `pnpm check`
- Visual pass on `principal` persona in demo.

### Phase 2: Principal Page Workflow Depth

**Files**
- `client/src/pages/AssetRegister.tsx`
- `client/src/pages/DemandRoom.tsx`
- `client/src/pages/CloseTracker.tsx`
- `client/src/components/PersonaSurface.tsx`

**Tasks**
1. Add scenario cards: `Best case`, `Base case`, `Delay case` timelines.
2. Add blocker queue in `CloseTracker` sorted by impact.
3. Add controlled disclosure workflow actions in `DemandRoom`.
4. Add per-asset execution state chips in `AssetRegister`.

**Verification**
- `pnpm check`
- Manual flow: sealed asset -> demand review -> close tracker.

### Phase 3: Risk + Audit Storytelling

**Files**
- `client/src/lib/demoFixtures.ts`
- `client/src/pages/Dashboard.tsx`

**Tasks**
1. Extend fixtures with realistic event logs for milestone and disclosure events.
2. Add timeline sparkline/mini-history in principal cards.
3. Add “what changed in last 24h” detail drawer for principal ops.

**Verification**
- `pnpm check`
- Validate no empty state in principal demo narrative.

## 7) Risks and Mitigations

- **Risk:** Overemphasis on decoration vs execution.  
  **Mitigation:** each visual block must map to an action or risk decision.

- **Risk:** Ambiguous risk labels.  
  **Mitigation:** standardize risk taxonomy (`Low`, `Moderate`, `High`, `Critical`) with fixed thresholds.

## 8) Release Criteria

- Principal user can answer in one screen:
  - How safe is my thesis exposure?
  - What blocks closing right now?
  - How confident is escrow completion?
