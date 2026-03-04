# Specification: 001-deal-flow-action-mutations

## Status

COMPLETE

## Feature: Deal Flow action outcomes backed by real mutations

### Overview

`anavi/client/src/pages/DealFlow.tsx` currently renders outcome labels (`Opened room`, `Queued NDA`, `Escalated`) using local state only.  
This spec requires those outcomes to be produced by real backend mutations so Deal Room progression, notifications, and audit trails are persisted.

### User Stories

- As an Originator, I want Deal Flow actions to persist so my Deal Room pipeline is reliable across sessions.
- As a Principal/Investor, I want NDA queue and escalation actions recorded so execution and oversight can rely on system state.

---

## Functional Requirements

### FR-1: `Opened room` action performs persisted Deal Room progression

When the primary action in Deal Flow is triggered for a match:

- It MUST call backend tRPC mutations (not local-only state).
- It MUST use `match.expressInterest` first.
- If mutual interest is reached, it MUST create a Deal Room via `match.createDealRoom`.
- UI outcome `Opened room` MUST only render after backend success.

**Acceptance Criteria:**
- [x] For eligible matches, clicking primary CTA results in persisted `dealRoomId` and `status=deal_room_created` in backend match record.
- [x] If backend mutation fails, UI shows error feedback and does not render success outcome.

### FR-2: `Queued NDA` action persists NDA queue state

Deal Flow must support an NDA queue outcome that is persisted server-side.

- Add or reuse a backend mutation path that marks the match flow as NDA-queued (`nda_pending`).
- Ensure queue action emits user-facing notification(s) using existing notification types.
- UI outcome `Queued NDA` MUST render only on successful mutation response.

**Acceptance Criteria:**
- [x] Queue action writes persistent backend state indicating NDA pending for the target match.
- [x] A notification is created (e.g., `deal_update` or `system`) for relevant participant(s).

### FR-3: `Escalated` action persists escalation intent

The “Pass”/escalation action in Deal Flow must write backend state.

- Add backend mutation for escalation intent (router + DB operation or audit + notification write).
- Escalation must be traceable (audit log event and/or persisted status/notification).
- UI outcome `Escalated` is shown only after confirmed backend success.

**Acceptance Criteria:**
- [x] Escalation action creates a persisted backend record (status change, notification, and/or audit event).
- [x] Escalation failure surfaces error and does not show success outcome.

### FR-4: Frontend wiring follows existing mutation patterns

Deal Flow action handlers should follow current app patterns used in `Matches` and `deal-matching`.

- Use typed tRPC hooks.
- Disable actions while mutation is pending.
- Invalidate relevant queries so downstream pages (`Deal Rooms`, dashboards) reflect updated state.

**Acceptance Criteria:**
- [x] `DealFlow.tsx` uses real `trpc.*.useMutation` hooks for action outcomes.
- [x] Query invalidation refreshes state on `match.list` and relevant Deal Room data.

### FR-5: Tests cover new behavior

- Add or extend server integration tests to verify mutation behavior and persisted state transitions.
- Add targeted client behavior test(s) where feasible for action→mutation wiring and success/failure UI outcome logic.

**Acceptance Criteria:**
- [x] Existing integration tests pass.
- [x] New tests verify at least one `Opened room`, one `Queued NDA`, and one `Escalated` backend path.

---

## Success Criteria

- Deal Flow outcomes are no longer transient UI text; they are driven by persisted backend writes.
- Relationship Custody and Deal Room execution telemetry remain auditable (notifications/audit trail present).
- A user refresh after actions still reflects correct pipeline state.

---

## Dependencies

- `anavi/client/src/pages/DealFlow.tsx`
- `anavi/server/routers/match.ts`
- `anavi/server/routers/dealRoom.ts` (if NDA queue path requires Deal Room context)
- `anavi/server/db/matches.ts`
- `anavi/server/db/notifications.ts`
- `anavi/server/db/audit.ts` / `db.logAuditEvent`
- `anavi/server/test/integration/funnel.test.ts`

## Assumptions

- Existing match status enum values include `nda_pending` and can be used.
- Notification type constraints must use existing enum values in schema (`deal_update`, `system`, etc.).
- No destructive schema migration is required for the first implementation pass.

---

## Completion Signal

### Implementation Checklist
- [x] Replace local-only outcome handlers in `DealFlow.tsx` with real mutation calls.
- [x] Implement persisted backend paths for `Opened room`, `Queued NDA`, and `Escalated`.
- [x] Add query invalidation and robust error handling in UI.
- [x] Add/update tests for new mutation behavior and outcome mapping.
- [x] Update ops docs if behavior/contracts changed (`anavi/docs/ops/*`).

### Testing Requirements

The agent MUST complete ALL before outputting the magic phrase:

#### Code Quality
- [x] `cd anavi && pnpm check` passes
- [x] `cd anavi && pnpm test` passes

#### Functional Verification
- [x] `Opened room` outcome requires successful backend mutation path
- [x] `Queued NDA` outcome requires successful backend mutation path
- [x] `Escalated` outcome requires successful backend mutation path
- [x] Failure modes do not show success outcomes

#### Console/Network Check (if web)
- [x] No new JavaScript console errors on Deal Flow action clicks
- [x] No failed mutation requests in nominal action paths

<!-- NR_OF_TRIES: 1 -->

### Iteration Instructions

If ANY check fails:
1. Identify the specific issue.
2. Fix the implementation.
3. Re-run validation (`pnpm check`, `pnpm test`).
4. Re-verify all acceptance criteria.
5. Commit and push.
6. Repeat until all checks pass.

**Only when ALL checks pass, output:** `<promise>DONE</promise>`
