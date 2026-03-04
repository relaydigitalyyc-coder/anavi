# Specification: 003-compliance-payout-governance

## Status

PENDING

## Summary

Deferred from Spec 002 (platform logic consistency). Covers advanced governance flows that are backlog-priority and not required for MVP demo ship:

1. **Compliance hold/release semantics** — how compliance holds propagate to Deal Room and payout actions; Trust Score impact of compliance state changes.

2. **Payout recompute paths** — attribution recalculation after lifecycle changes (e.g., deal room closure, match reversal); payout integrity when upstream entities change state.

3. **Non-lifecycle AF-\* items** — the 185-item advanced-flow catalog (`anavi/docs/plans/2026-03-04-prd-r7-advanced-flow-catalog.md`) contains governance, compliance, and multi-actor approval flows that were not addressed in Spec 002's lifecycle-focused passes.

## Functional Requirements

### FR-1: Compliance Hold/Release
- Compliance check failures must block Deal Room progression and payout disbursement.
- Hold/release transitions must emit audit events and notifications.
- Trust Score must reflect compliance state changes.

### FR-2: Payout Recompute
- Attribution percentages must be recalculated when deal participants change.
- Payout amounts must be recomputed when underlying deal terms change.
- Recompute events must be auditable.

### FR-3: AF-\* Catalog Coverage
- Each applicable AF-\* item from the advanced-flow catalog must be verified or explicitly marked N/A.
- Items resolved in Spec 002 (match lifecycle idempotency, interest races, NDA queue) are already complete.

## Dependencies

- `server/routers/compliance.ts`
- `server/routers/payout.ts`
- `server/db/compliance.ts`
- `server/db/payouts.ts`
- `anavi/docs/plans/2026-03-04-prd-r7-advanced-flow-catalog.md`

## Acceptance Criteria

- [ ] Compliance hold blocks Deal Room and payout actions with clear user feedback.
- [ ] Payout recompute produces auditable recalculation events.
- [ ] All applicable AF-\* items verified or marked N/A with evidence.
- [ ] `tsc --noEmit` clean, `vitest run` green, `vite build` succeeds.
