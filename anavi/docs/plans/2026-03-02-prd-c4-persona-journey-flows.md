# PRD C4: Persona Journey Flows
**Date:** 2026-03-02  
**Status:** Approved for implementation  
**Depends on:** `2026-03-02-prd-c4-dashboard-flow-elegance-system.md`

## 1. Objective

Define strict, elegant journey beats for each persona so the value proposition is demonstrated by software behavior.

## 2. Canonical Story Beats

These beats must appear consistently in each persona flow:
- `Custody/Control`
- `Match/Qualification`
- `Deal Room/Execution`
- `Economics/Outcome`

## 3. Originator Flow (Broker)

### Primary Journey
1. Custody Register: new/at-risk relationship custody state
2. Introduction Pipeline: progression to mutual interest
3. Deal Room: controlled disclosure and milestone state
4. Attribution Ledger: payout trigger and earned economics

### Required Widgets
- `Custody Integrity Panel` (hash/proof/timestamp)
- `Attribution Risk Queue` (stalled, disputed, expiring)
- `Deal Velocity Funnel` (custodied -> matched -> closed)
- `Revenue Realization Rail` (pending vs triggered)

### Primary Actions
- `Seal Relationship`
- `Escalate Match`
- `Open Deal Room`
- `Initiate Attribution Claim`

## 4. Investor Flow (Family Office/Allocator)

### Primary Journey
1. Counterparty Intelligence: trust + compliance quality
2. Deal Flow: ranked opportunities with confidence
3. Deal Room: diligence + participation actions
4. Portfolio/Economics: deployment and realized performance

### Required Widgets
- `Mandate Fit Matrix` (deal fit by objective)
- `Risk-Adjusted Opportunity List`
- `Diligence Completion Grid`
- `Deployment Yield Tracker`

### Primary Actions
- `Express Interest`
- `Request Room Access`
- `Advance to IC Review`
- `Commit Capital`

## 5. Principal Flow (Asset Owner)

### Primary Journey
1. Asset Register: sealed asset readiness and trust tier effects
2. Demand Room: qualified demand and consent controls
3. Close Tracker: blockers, milestones, and close certainty
4. Economics Outcome: close status and proceeds timeline

### Required Widgets
- `Asset Readiness Ladder`
- `Qualified Demand Stack`
- `Disclosure Control Log`
- `Close Probability + Blocker Board`

### Primary Actions
- `Approve Disclosure`
- `Issue NDA`
- `Resolve Blocker`
- `Move to Close`

## 6. Shared UX Acceptance Criteria

- Every page starts with a clear “current state” sentence.
- Every page contains one recommended action and one fallback action.
- Every recommended action references the data point that justifies it.
- Every critical state is labeled with trust/proof status.
- Every page supports drill-down without losing context.

## 7. Demo Acceptance Criteria

- Each persona can complete story beats in < 4 minutes.
- No dead-end screens in beat sequence.
- Each beat has at least one visible metric change after action.
