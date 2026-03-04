# Specification: 002-platform-logic-consistency-and-flow-synchronization

## Status

INCOMPLETE

## Mission Prompt (Ralph 50-Pass Agent Mode)

You are executing a platform-wide consistency hardening mission for ANAVI.

Your job is to remove every logical inconsistency across:

- User-facing routes and navigation
- Runtime mode behavior (`demo` / `hybrid` / `live`)
- Persona semantics (`originator`, `investor`, `principal`)
- Relationship Custody, Trust Score, Blind Matching, Deal Room, Attribution, and Intent flows
- Demo data pipelines and live API contract parity
- Backend status machines, notifications, and audit event semantics
- Documentation and execution memory synchronization

### Non-Negotiable Execution Rules

1. Root-cause fixes only. No cosmetic-only “green check” patches.
2. If two implementations conflict, define one canonical path and deprecate the other.
3. Every fix must preserve or improve ANAVI-first terminology consistency.
4. Any UI action implying persisted state must be backed by server mutation + audit intent.
5. Keep docs and ops memory synchronized every substantive batch.

### 50-Pass Operational Cadence

- Passes 1–5: Global inventory, contradiction register, dependency map.
- Passes 6–15: Runtime mode and auth/guard coherence.
- Passes 16–25: Persona and navigation flow coherence.
- Passes 26–35: Demo vs live contract unification.
- Passes 36–42: Deal lifecycle and status machine hardening.
- Passes 43–47: Regression test and build hardening.
- Passes 48–50: Final contradiction sweep, docs sync, closeout.

Do not prematurely claim all done. Continue sweeping for edge-case drift until no critical contradictions remain.

---

## Canonical User Flow Scope

### Public Entry

- `/` (Home) → `/login` or `/register`
- `/forgot-password` recovery path
- `/demo` demo-only exploration path

### Authenticated Core (Protected)

- Dashboard: `/dashboard`
- Relationship Custody + Attribution:
  - `/custody`
  - `/attribution`
  - `/relationships`
- Blind Matching + Intent:
  - `/pipeline`
  - `/deal-flow`
  - `/deal-matching`
  - `/matches`
  - `/intents`
- Deal Room Execution:
  - `/deal-rooms`
  - `/deal-rooms/:id`
  - `/deals`
  - `/compliance`
  - `/payouts`

### Persona-Specific Surfaces

- Originator-biased: custody/attribution/pipeline
- Investor-biased: deal-flow/portfolio/counterparty intelligence
- Principal-biased: assets/demand/close

### System/Adjacency Surfaces

- `/verification`, `/audit-logs`, `/network`, `/settings`
- Vertical/adjacent modules (`/real-estate`, `/commodities`, `/crypto-assets`, `/trading`, etc.)

---

## Demo Flow Scope

### Runtime Gating

- Demo surfaces must be available only when `allowDemoFixtures` is true.
- `live` mode must reliably prevent demo fixtures and synthetic bypass assumptions.

### Demo Journey

- Persona selection → dashboard shell → nav walkthrough
- Relationship review → match exploration → deal room entry
- Verification narrative → payout narrative
- Guided tour step-to-page mapping remains deterministic and valid

### Demo/Live Parity

- Demo models should be shape-compatible with tRPC response contracts.
- No duplicate incompatible demo contexts in active usage paths.

---

## Functional Requirements

### FR-1: Route and Guard Coherence

- Every route in `App.tsx` must map to an intentional, reachable flow.
- Runtime/auth guards must not allow contradictory behavior across `demo`, `hybrid`, and `live`.

**Acceptance Criteria**
- [ ] No orphaned or contradictory route wrappers (`ShellRoute` vs `ProtectedPage`) for intended behavior.
- [ ] Auth guard behavior is deterministic and documented for all runtime modes.

### FR-2: Persona Flow Coherence

- Persona primary nav, workflow rail, and page-level semantics must align.
- Persona labels and capabilities must not conflict with domain language.

**Acceptance Criteria**
- [ ] Originator/Investor/Principal flows have consistent journey definitions across navigation and page logic.
- [ ] No mixed persona aliases that cause ambiguous product behavior.

### FR-3: Demo System Unification

- Demo context and fixture pipelines must be canonicalized.
- If duplicate demo systems exist, one must be designated canonical and the other retired or bridged.

**Acceptance Criteria**
- [x] One canonical demo data contract path is used for active demo experiences.
- [x] Demo path does not silently diverge from live API contract expectations.

### FR-4: Deal Lifecycle State Machine Integrity

- Match lifecycle transitions must be explicit and non-contradictory.
- Deal Room/NDA/escalation transitions must be auditable and user-visible.

**Acceptance Criteria**
- [ ] Status transitions are coherent between client intent and server persistence.
- [ ] Notifications and audit events are emitted consistently for lifecycle actions.

### FR-5: Documentation and Ops Synchronization

- Plans, engineering memory, and TODO board must stay current with implementation truth.

**Acceptance Criteria**
- [ ] `anavi/docs/plans/README.md` references active consistency work.
- [ ] `anavi/docs/ops/ENGINEERING_MEMORY.md` and `TODO_BOARD.md` reflect true execution status.

---

## Systemic Contradiction Register (Initial)

The agent must validate and resolve these high-risk areas:

- [ ] Multiple demo-context implementations (`contexts/DemoContext.tsx` vs `lib/DemoContext.tsx`) and potential drift.
- [ ] Persona taxonomy mismatch (`developer`/`institutional` remnants vs canonical `principal` semantics).
- [ ] Route/page naming drift and module inconsistency across nav labels and actual page content.
- [ ] Runtime gating edge cases where demo behaviors leak into `live` expectations.
- [ ] Status/notification semantics that do not fully align with UI outcomes and Trust Score narratives.

---

## Dependencies

- `anavi/client/src/App.tsx`
- `anavi/client/src/components/DashboardLayout.tsx`
- `anavi/client/src/components/ProtectedRoute.tsx`
- `anavi/client/src/contexts/DemoContext.tsx`
- `anavi/client/src/lib/DemoContext.tsx`
- `anavi/client/src/lib/demoFixtures.ts`
- `anavi/client/src/lib/demoData.ts`
- `anavi/server/_core/context.ts`
- `anavi/server/_core/systemRouter.ts`
- `anavi/server/routers/index.ts`
- `anavi/server/routers/match.ts`
- `anavi/server/routers/dealRoom.ts`
- `anavi/docs/ops/*`
- `anavi/docs/plans/*`

---

## Completion Signal

### Implementation Checklist

- [~] Full contradiction inventory completed and tracked.
- [x] High/critical contradictions resolved with root-cause fixes (duplicate demo systems unified onto fixtures + adapter).
- [~] User flow map and demo flow map validated against current code.
- [x] Regression checks green (`pnpm check`, `pnpm test`, `pnpm build`).
- [x] Ops docs synchronized with final state.

### Testing Requirements

The agent MUST complete ALL before outputting the magic phrase:

#### Code Quality
- [ ] `cd anavi && pnpm check` passes
- [ ] `cd anavi && pnpm test` passes
- [ ] `cd anavi && pnpm build` passes

#### Flow Integrity
- [ ] Public/authenticated route transitions verified against runtime mode rules.
- [ ] Persona navigation/workflow coherence verified.
- [ ] Demo flow path verified end-to-end (persona select → workflow → deal room interaction).
- [ ] Deal lifecycle action outcomes verified against persisted backend state.

#### Sync Integrity
- [ ] Plan registry, engineering memory, and TODO board all updated with no contradictions.

<!-- NR_OF_TRIES: 2 -->

### Iteration Instructions

If ANY check fails:
1. Capture contradiction precisely (file + behavior + expected canonical behavior).
2. Fix root cause.
3. Re-run the relevant validation command(s).
4. Re-validate impacted flows.
5. Update docs/ops memory.
6. Continue until all criteria are satisfied.

**Only when ALL checks pass, output:** `<promise>DONE</promise>`
