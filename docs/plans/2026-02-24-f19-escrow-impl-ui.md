# F19: Escrow/Payment Integrations — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Escrow/Payment Integrations  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.6

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Integrate escrow provider (Escrow.com, bank API, or crypto). Create escrow on milestone. Release on completion. Webhook for status. Record in `payouts`. Idempotent; audit; reconciliation reports.

### Architecture

Provider API client. `payouts` table: add `escrowId`, `escrowStatus`. Flow: milestone triggered → create escrow via provider → store ref → on completion webhook → release escrow → update payout status. Fallback: manual release.

### Tech Stack

Drizzle ORM, tRPC v11, Escrow.com API or equivalent, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | payouts; add escrowId, escrowStatus |
| `anavi/server/routers.ts` | payout flow |
| F5/F5 PRD | Payout automation trigger |
| `anavi/server/_core/env.ts` | ESCROW_API_KEY |

### Phase 1: Provider Integration

**Task 1 — Escrow client**  
- `anavi/server/escrow-provider.ts`  
- `createEscrow(amount, currency, buyerId, sellerId, milestoneRef)`  
- `releaseEscrow(escrowId)`  
- `getStatus(escrowId)`  
- Handle provider-specific API; abstract interface  
- TDD: mock provider  

**Task 2 — Create on milestone**  
- When payout created (F5 trigger): call `createEscrow`  
- Store escrowId in payouts  
- Update escrowStatus = pending  
- If provider fails: payout status = failed; alert; manual fallback  

**Task 3 — Release on completion**  
- Manual: admin or deal owner clicks "Release"  
- Or: webhook when milestone confirmed  
- Call `releaseEscrow`; update payout status = processing → completed  
- Webhook handler: verify signature; update status  

### Phase 2: Edge Cases

**Task 4 — Partial release**  
- Some milestones allow partial (e.g., 50% now, 50% later)  
- Provider supports split? Or multiple escrow transactions  
- Schema: partial amounts in deal_milestones  

**Task 5 — Disputes**  
- Escrow holds; dispute resolution flow (manual)  
- Status = disputed; no release until resolved  
- Provider dispute API if available  

**Task 6 — Refunds**  
- If deal cancelled: refund escrow  
- Provider refund flow  
- Update payout status = refunded / cancelled  

### Phase 3: Reconciliation

**Task 7 — Reconciliation report**  
- List payouts with escrow; status; amount; dates  
- Export for finance team  
- Match provider balance to internal records  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4, 5, 6 (edge cases)
Task 7 (reporting)
```

### Verification

- [ ] Milestone triggers escrow creation
- [ ] Release updates payout
- [ ] Webhook verified
- [ ] Manual fallback works

---

## UI PRD

### User Story

As a deal participant, I want escrow for milestone payments so counterparties are protected.

### Entry Points

- Deal room: Payouts/Escrow tab  
- Payout row: escrow status; "Release" button (if authorized)  
- Admin: Escrow reconciliation view  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `EscrowStatusBadge` | pending, funded, released, disputed | — |
| `ReleaseEscrowButton` | Triggers release | loading, disabled |
| `EscrowTimeline` | Created → Funded → Released | — |

### Design Tokens

- Pending: `bg-[#F59E0B]/15 text-[#F59E0B]`  
- Funded: `bg-[#2563EB]/10 text-[#2563EB]`  
- Released: `bg-[#059669]/15 text-[#059669]`  
- Disputed: `bg-red-500/15 text-red-600`  

### Trust Signals

- "Escrowed via [Provider]"  
- Amount, date, status visible  
- Release requires confirmation  

### Empty States

- No escrow: "Escrow will be created when milestones are triggered."  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/escrow-provider.ts` | Provider client |
| `anavi/drizzle/schema.ts` | payouts escrow columns |
| `anavi/server/routers.ts` | payout release; escrow webhook |
| `anavi/client/src/pages/DealRoom.tsx` | Escrow tab |
| `anavi/client/src/components/EscrowStatusBadge.tsx` | — |
