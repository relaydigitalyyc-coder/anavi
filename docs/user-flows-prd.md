# ANAVI User Flows PRD

**Date**: 2026-03-14
**Owner**: Hydra Agent (User Flow Documentation)
**Status**: Active

## Platform Overview

ANAVI is a private-market operating system with five core pillars:

1. **Verified identity and trust scoring** – Authenticate and score counterparties.
2. **Relationship custody and attribution** – Timestamp introductions, attribute deals.
3. **AI‑assisted blind matching** – Match parties anonymously before disclosure.
4. **Embedded deal infrastructure** – Deal rooms, compliance, NDAs, execution.
5. **Transparent economics and payouts** – Attribution‑based payouts, audit trails.

**Runtime Modes**: `demo` (synthetic auth + fixtures), `hybrid` (pre‑launch), `live` (full production).

## User Personas

| Persona | Label | Role | Core Problem | Value Proposition |
|---------|-------|------|--------------|-------------------|
| **Originator** | Deal Originator / Broker | Relationship Holder | “My introductions close deals I never get credit for.” | Custody your relationships. Timestamp your introductions. Collect your attribution. |
| **Investor** | Investor / Family Office | Capital Deployer | “I can’t tell which deals are real or who’s already seen them.” | Verified counterparties. Blind matching. Mutual consent before any disclosure. |
| **Principal** | Principal / Asset Owner | Supply Side | “Raising capital means exposing my thesis before anyone commits.” | Seal your asset. Match anonymously. Disclose only on consent. |

**Persona‑Biased Surfaces**:
- **Originator**: custody / attribution / pipeline
- **Investor**: deal‑flow / portfolio / counterparty intelligence
- **Principal**: assets / demand / close

## Primary User Flows

### 1. Onboarding Flow
**Path**: `/welcome` → `/onboarding` → dashboard
**Key Steps**:
1. Persona selection (Originator, Investor, Principal)
2. Profile completion (verification, preferences)
3. Dashboard entry with personalized welcome banner
4. Persona assumptions stored and synchronized with downstream navigation

**Critical Invariants**:
- Onboarding completion aligns with user‑model and navigation assumptions.
- Persona set during onboarding remains consistent in dashboard state.
- Demo‑mode onboarding uses synthetic auth; live‑mode requires full verification.

### 2. Authentication & Session Flows
**Advanced Paths (AF‑013 – AF‑022)**:
- Session expiry during mutation → canonical re‑auth + retry semantics.
- Expired session during route transition avoids ambiguous partial render.
- Token‑refresh failure yields deterministic forced‑auth flow.
- Concurrent‑tab auth changes reconcile without contradictory UI state.
- Invalid session cookie cannot bootstrap protected data fetch.
- Unauthorized API response taxonomy consistent across routers.
- Post‑auth redirect returns to intended safe destination.
- Onboarding‑required users gated before full app‑shell access.
- Onboarding completion updates downstream persona assumptions deterministically.
- Auth‑recovery flow (`forgot‑password`) does not leak mode‑specific paradoxes.

### 3. Persona‑Specific Journey Rails

#### Originator Flow
`Dashboard → Custody / Attribution → Pipeline → Deal Matching → Deal Room → Payouts`

**Primary Actions**:
- Register a relationship (custody)
- Track introduction attribution
- View pipeline of matched deals
- Enter deal rooms for active matches
- Monitor attribution‑based payouts

**Required Widgets**: Relationship ledger, attribution timeline, pipeline heatmap.

#### Investor Flow
`Dashboard → Counterparty Intelligence / Deal Flow → Deal Matching → Deal Room → Portfolio / Payouts`

**Primary Actions**:
- Browse verified counterparties
- Review deal‑flow with trust‑score indicators
- Express interest in blind‑matched deals
- Enter deal rooms after mutual consent
- Track portfolio performance and payouts

**Required Widgets**: Trust‑score cards, deal‑flow table, portfolio dashboard.

#### Principal Flow
`Dashboard → Asset Register / Demand Room → Deal Matching → Deal Room → Close Tracker`

**Primary Actions**:
- List assets / demand signals
- Match anonymously with investors
- Enter deal rooms after NDA
- Monitor close progress
- Review settlement status

**Required Widgets**: Asset register, demand‑room board, close‑tracker.

### 4. Deal Matching Flow
**Path**: `/deal‑matching` (blind‑matching surface)
**Key Steps**:
1. View anonymized deal cards (filter by sector, size, trust score)
2. Express interest (non‑binding)
3. Receive mutual‑interest notification
4. Unlock counterparty identity after mutual consent
5. Proceed to deal‑room creation

**Critical Invariants**:
- Trust‑score and verification indicators coherent across list cards, detail pages, and action outcomes.
- Deal‑flow actions map to persisted lifecycle transitions.

### 5. Deal Room & NDA Flow
**Path**: `/deal‑rooms` → `/deal‑rooms/:id`
**Key Steps**:
1. Create deal room (auto‑generates NDA envelope via DocuSign)
2. Send NDA to counterparty
3. Counterparty signs via embedded signing URL
4. Room unlocks full document exchange, compliance checks, and collaboration
5. Room closure triggers attribution and payout calculations

**Advanced Paths (AF‑073 – AF‑092)**:
- NDA envelope creation idempotent for same room.
- NDA signing status synchronized across all UI surfaces.
- Room access revoked on compliance hold.
- Room‑state transitions audit‑logged and reversible.
- Multi‑actor conflict resolution (e.g., simultaneous edits) deterministic.

### 6. Compliance & Risk Flow
**Path**: `/compliance` (dedicated surface) + embedded in deal rooms
**Key Steps**:
1. Automated OFAC / sanctions screening
2. Compliance‑hold placement (blocks payouts, room access)
3. Hold‑release workflow (requires audit‑trail)
4. Trust‑score impact updates

**Advanced Paths (AF‑093 – AF‑100)**:
- Verification downgrade updates trust‑score narratives coherently.
- Verification upgrade re‑enables gated actions deterministically.
- Sanctions/compliance fail‑state blocks prohibited transitions.
- Compliance‑override action audit‑required and role‑restricted.
- Compliance state propagates across dashboard and detail surfaces.
- Risk flags include clear reason taxonomy and resolution pathway.
- Conflicting compliance/risk signals resolve by canonical precedence rules.
- Compliance release recomputes dependent CTA enablement.

### 7. Attribution & Payout Flow
**Path**: `/payouts` (attribution ledger)
**Key Steps**:
1. Attribution triggers on deal‑room closure
2. Payout schedule generated (based on attribution rules)
3. Payout execution (via integrated payment providers)
4. Payout hold/release based on compliance status
5. Payout cancellation/reversal with audit trail

**Advanced Paths (AF‑115 – AF‑128)**:
- Attribution trigger creation idempotent for same qualifying event.
- Attribution recalculation after reversal produces deterministic outputs.
- Payout schedule updates when upstream lifecycle state changes.
- Payout hold on compliance state enforced consistently.
- Payout release after compliance resolution recomputes correctly.
- Payout cancellation path emits canonical reversal/audit events.
- Payout retries on transient provider failure idempotent.
- Attribution ledger entries immutable with corrective‑append model.
- Partial‑payout states represented consistently across UI/API.
- Payout‑status chips map 1:1 to backend enums.
- Trust/verification changes affecting payout eligibility propagated.
- Attribution and payout totals reconcile after backfill/recompute.
- Payout‑notification taxonomy aligns with settlement lifecycle.
- Attribution/payout integration tests cover hold/release/reversal/retry.

### 8. Dashboard & Navigation Flow
**Core UX Framework** (per persona surface):
1. **Signal**: What changed, with confidence/verification context.
2. **Decision**: What this implies now.
3. **Action**: Highest‑value action in place.
4. **Proof**: Audit/attribution/evidence link in‑context.

**Navigation Guard Matrix**:
- `demo` mode: allows synthetic user, demo fixtures, no auth redirect.
- `hybrid` mode: allows synthetic fallback, demo fixtures enabled.
- `live` mode: no synthetic auth, no demo fixtures; auth redirect required.

**Persona‑Switch Semantics**:
- Persona switch updates nav, tool rails, and contextual CTAs coherently.
- Legacy persona aliases map deterministically to canonical personas.
- Persona‑biased dashboards preserve trust‑score narrative consistency.
- Persona‑specific action visibility respects capability constraints.

### 9. Demo Experience Flow
**Path**: Persona selection → dashboard shell → nav walkthrough → relationship review → match exploration → deal‑room entry → verification narrative → payout narrative.

**Critical Invariants**:
- Canonical demo context is single‑source for active demo pages.
- Non‑canonical demo‑model access is adapter‑backed or retired.
- Persona select in demo maps to canonical app‑persona rail.
- Guided‑tour step‑page mapping deterministic for all personas.
- Scenario switch (`baseline` / `momentum` / `closing`) updates all affected stats coherently.
- Demo notifications mirror expected lifecycle semantics.
- Demo trust‑score representation aligns with verification narrative.
- Demo CTA outcomes map to canonical lifecycle labels.
- Demo deal‑room interaction preserves NDA/access state consistency.
- Demo‑disabled runtime shows explicit non‑ambiguous messaging.
- Demo data contract remains shape‑compatible with live tRPC consumers.

### 10. Advanced Flows (Exception, Recovery, Conflict, Degradation)

**A. Exception & Recovery Journey**:
- Failed mutation retries with clear UI semantics and audit continuity.
- Cross‑page state reconciliation after backend transition updates.
- Demo‑to‑live semantic parity for advanced‑state labels and CTA outcomes.

**B. Deal Room Governance & Reversal Journey**:
- Room‑state rollback (e.g., after mistaken closure) with compensation safety.
- Multi‑actor conflict resolution (simultaneous edits, contradictory actions).
- Governance‑hold placement and release workflows.

**C. Multi‑Actor Conflict Journey**:
- Concurrent interest expressions produce deterministic match outcome.
- Conflicting NDA signatures resolved by precedence rules.
- Simultaneous payout‑trigger events deduplicated.

**D. Runtime Degradation Journey**:
- Partial‑service failure (e.g., DocuSign API down) → graceful degradation.
- Database‑connection loss → read‑only mode with clear user messaging.
- Cache‑incoherence detection and recovery.

## Flow Diagrams (Descriptions)

*Note: Diagrams are maintained in `anavi/docs/plans/2026-03-04-prd-r7-advanced-flow-catalog.md` and related design documents. Below are textual summaries.*

### Onboarding Flow Diagram
```
Public Entry → Welcome Screen → Persona Selection → Profile Setup → Verification → Dashboard Entry
```

### Deal Matching Flow Diagram
```
Dashboard → Deal Matching Page → Filter/Scroll → Express Interest → Mutual Interest? → Yes → Unlock Identity → Create Deal Room
                                                                  → No → Continue Browsing
```

### Deal Room Lifecycle Diagram
```
Deal Room Created → NDA Sent → NDA Signed → Room Active → Document Exchange → Compliance Checks → Room Closed → Attribution Triggered → Payout Scheduled
```

### Compliance Hold/Release Diagram
```
Compliance Check → Fail → Hold Placed → Notify Users → Remediation → Audit Review → Hold Released → Recompute Payout Eligibility
```

### Attribution/Payout Diagram
```
Deal Room Closed → Attribution Event → Payout Schedule Generated → Compliance Check → Hold? → Yes → Wait
                                                                  → No → Execute Payout → Notification → Ledger Updated
```

## Missing / Incomplete Flows (Gaps)

Based on the `AF‑*` advanced‑flow catalog and spec analysis, the following flows are **incomplete or not yet implemented**:

1. **Compliance Hold/Release Semantics** (Spec 003) – How compliance holds propagate to deal rooms and payouts; trust‑score impact of compliance‑state changes.
2. **Payout Recompute Paths** – Attribution recalculation after lifecycle changes (deal‑room closure, match reversal); payout integrity when upstream entities change state.
3. **Multi‑Actor Approval Flows** – Governance, compliance, and multi‑actor approval flows listed in the advanced‑flow catalog (AF‑093–AF‑100, AF‑115–AF‑128) but not yet addressed.
4. **Runtime‑Degradation Recovery** – Graceful degradation when external services (DocuSign, payment providers) are unavailable.
5. **Advanced Conflict Resolution** – Simultaneous edits, contradictory actions across multiple users.
6. **Full Demo‑to‑Live Parity** – Some demo CTA outcomes may not yet map exactly to live‑mode behavior.
7. **Exhaustive Integration Tests** – Coverage for hold/release/reversal/retry scenarios across attribution, payout, and compliance.

## Recommendations

1. **Prioritize Spec 003 (Compliance/Payout Governance)** – Complete the deferred advanced‑governance flows to enable production‑ready compliance and payout operations.
2. **Execute Remaining AF‑* Items** – Use the Ralph 50‑pass agent mode to systematically close the 185 advanced‑flow items.
3. **Enhance Testing Matrix** – Develop integration tests for all advanced flows, especially exception, retry, reversal, multi‑actor conflict, governance hold/release, and recovery semantics.
4. **Update Documentation** – Keep the advanced‑flow catalog synchronized with implementation progress; archive superseded assumptions with forward links.
5. **Validate Demo‑Live Parity** – Run side‑by‑side validation of demo and live modes for all primary user journeys.

---
*This PRD synthesizes information from `specs/`, `anavi/docs/plans/`, `anavi/client/src/lib/copy.ts`, and the advanced‑flow catalog. Last updated 2026‑03‑14.*