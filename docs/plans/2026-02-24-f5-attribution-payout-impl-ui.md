# F5: Attribution Payout Automation — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Attribution Payout Automation  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.2  
**Overlap:** PRD-6 (Compliance, Attribution & Payout) covers deal milestones + auto-trigger

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Milestone definitions per deal; triggers on stage→closed or paidAt set; attribution % from `deal_participants`; create `payouts` rows; notify originators. Idempotent; audit every payout creation.

### Architecture

`deal_milestones` table (PRD-6); trigger on `deal.updateStage` when stage=completed. Payout creation from attribution % in `deal_participants`. `payouts` table. Email notification.

### Tech Stack

Drizzle ORM, tRPC v11, Resend/SendGrid, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | `payouts`, `deal_milestones`, `deal_participants` |
| `anavi/server/routers.ts` | `deal.updateStage`, `payoutRouter` |
| PRD-6 impl | Deal milestones + attribution events |

### Phase 1: Milestone → Payout Trigger

**Task 1 — Trigger on deal close**  
- In `deal.updateStage`: when newStage=completed, call `triggerMilestonePayouts(dealId)`  
- Fetch `deal_milestones` with status=pending, triggerStage=completed  
- For each: compute payout amount from `deal_participants.attributionPct` and deal value  
- Create `payouts` row (status=pending); link milestoneId  
- Mark milestone status=triggered  
- Idempotent: skip if payout already exists for milestone

**Task 2 — Attribution % resolution**  
- `deal_participants` has `attributionPct` or equivalent  
- If missing, use default split or require config before close  
- Support multi-originator splits (sum to 100%)

**Task 3 — Notification**  
- On payout create: email originator "Payout triggered: $X for [Deal]"

### Phase 2: Edge Cases

**Task 4 — Partial milestones**  
- Milestones may have partial amounts (e.g., 50% on term sheet, 50% on close)  
- Schema: `milestonePct` or split milestones  
- Handle follow-on deals (separate deal record)

**Task 5 — Disputes**  
- `payouts.status=disputed`; pause processing  
- Manual review flow (admin)

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 1 → Task 4
Task 5 (admin flow)
```

### Verification

- [ ] Deal close creates payout for originator with correct %
- [ ] Duplicate close does not double-create
- [ ] Email sent

---

## UI PRD

### User Story

As an originator, I want payouts to trigger automatically when milestones close so I don't chase commissions.

### Entry Points

- Payouts page: new payout appears in list (status=pending)  
- Deal room: Payouts tab shows linked payouts  
- Email: "Payout triggered" notification  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `PayoutRow` | Single payout: amount, deal, status, date | — |
| `PayoutStatusBadge` | pending/approved/processing/completed/failed | — |
| `AttributionBreakdown` | Deal room: who gets what % | — |

### Design Tokens

- Amount: `font-data-hud font-semibold`
- Pending: `bg-[#F59E0B]/15 text-[#F59E0B]`
- Completed: `bg-[#059669]/15 text-[#059669]`
- Card: `card-elevated`

### Empty States

- No payouts: "Payouts will appear when deals close and milestones are met."

### Trust Signals

- "Attribution: X% — verified from deal participants"

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/db.ts` | triggerMilestonePayouts |
| `anavi/server/routers.ts` | deal.updateStage (call trigger) |
| `anavi/client/src/pages/Payouts.tsx` | List; extend for new payouts |
