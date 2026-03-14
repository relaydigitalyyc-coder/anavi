# R8 Dashboard Contradictions Register

Date: 2026-03-13  
Scope: Dashboard UI + backend runtime surfaces tied to dashboard KPIs and CTA routing.

## Current Register

| ID | Severity | Contradiction | Evidence | Status |
| --- | --- | --- | --- | --- |
| R8-001 | High | Live Proof metrics shown without backend contract | Investor dashboard hardcoded 24h verified match / diligence / capital-ready tiles | In progress |
| R8-002 | High | Dashboard CTA links use unsupported `pending_consent` lifecycle status | Investor/Originator dashboard links pointed to filters not emitted by `match.status` | Fixed in this build |
| R8-003 | Medium | Pipeline visualization counts were static (`12/8/4/2`) | Investor dashboard stage bar and legend hardcoded | Fixed in this build |
| R8-004 | Medium | Summary KPIs (pipeline/capital/trust/time-to-close) were static | Investor dashboard metrics row hardcoded | Fixed in this build |
| R8-005 | Medium | Deal Flow freshness copy was speculative (`updated 2m ago`) | Deal Flow page did not bind freshness to runtime timestamps | Fixed in this build |
| R8-006 | Medium | Capital deployment card in live mode had no source | Investor dashboard only used demo deployment object | Fixed in this build |
| R8-007 | Medium | Originator “Resolve Room Blockers” and escalation shortcuts were not lifecycle-aligned | Links filtered by unsupported `pending_consent` state | Fixed in this build |
| R8-008 | Medium | Market depth widget uses static constants | Originator dashboard `MARKET_DEPTH` constant not runtime-backed | Open |
| R8-009 | Medium | Pending actions widget uses static constants | Originator dashboard `PENDING_ACTIONS` constant not runtime-backed | Open |
| R8-010 | Medium | Portfolio LiveProof strip values and publish/export actions not runtime-backed | Portfolio page uses static uplift/calls-settled values and inert CTAs | Open |

## Build Actions Completed (This Session)

1. Added `match.liveStats` runtime query to surface:
   - live proof metrics (`newVerifiedMatches24h`, `diligenceMedianDays`, `capitalAllocationReady`)
   - stage pipeline distribution (`sourcing`, `dueDiligence`, `termSheet`, `closing`, `total`)
   - KPI summary (`activePipeline`, `committedCapital`, `weightedTrustScore`, `avgTimeToCloseDays`)
   - capital snapshot (`available`, `committed`, `deployed`, `pendingPayouts`, `total`)
   - freshness timestamp (`lastUpdatedAt`)
2. Rewired investor dashboard cards/charts/KPIs to consume runtime stats instead of hardcoded values.
3. Replaced invalid dashboard links using `status=pending_consent` with valid lifecycle filters (`pending`, `nda_pending`).
4. Updated Deal Flow freshness text to reflect runtime `lastUpdatedAt`.
5. Added backward-compatible Deal Flow filter alias for legacy deep links: `pending_consent -> [pending, user1_interested, user2_interested, nda_pending]`.

## Next Build Targets

1. Runtime-backed market depth API + originator dashboard integration.
2. Runtime-backed pending actions contract from notifications/compliance/intents.
3. Portfolio LiveProof and publish/export endpoint wiring.
