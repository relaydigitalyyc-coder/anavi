# F3: Trust Score Automation — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Trust Score Automation  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.1

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Event-driven Trust Score updates: +points for completed deals, peer reviews, document approvals; −points for disputes, rejections. Configurable weights. History in `trust_score_history`. Recalc <5min after event.

### Architecture

Event sources: deal close, peer review, verification approve/reject, dispute. Worker or inline handler calls `recalculateTrustScore(userId)`. Append-only `trust_score_history`. Idempotent; no cascading locks.

### Tech Stack

Drizzle ORM, tRPC v11, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | `trustScoreHistory` table; `users.trustScore` |
| `anavi/server/db.ts` | `updateUserTrustScore`, `getTrustScoreHistory` exist |
| `anavi/server/db.ts` | Event sources: deals, verification, peerReviews |

### Phase 1: Event Weights + Recalculation

**Task 1 — Weight config**  
- `TRUST_SCORE_WEIGHTS`: deal_closed +50, peer_review_positive +20, doc_approved +15, dispute −30, rejection −10  
- Ceiling 1000; floor 0  
- Store in config or DB

**Task 2 — Recalculation function**  
- `recalculateTrustScore(userId)`  
- Fetch latest score; apply delta from event; clamp  
- Append to `trust_score_history` (eventType, delta, newScore, sourceId)  
- Update `users.trustScore`  
- Idempotent: same event + sourceId = no duplicate delta

**Task 3 — Wire event sources**  
- On deal close: call recalculate for deal participants (originators)  
- On verification approve/reject: recalculate for user  
- On peer review submit: recalculate for reviewee  
- On dispute create: recalculate for parties  
- Use existing hooks or add to mutation handlers

### Phase 2: History + API

**Task 4 — History query**  
- `user.getTrustScoreHistory(limit)` — paginated events  
- tRPC; protected; own user only (or admin)

**Task 5 — Batch backfill**  
- One-time script: for each user, recompute from scratch from event log  
- Optional: run on deploy

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 2 → Task 4
```

### Verification

- [ ] Deal close triggers score increase for originator
- [ ] Duplicate event does not double-count
- [ ] History shows delta + new score

---

## UI PRD

### User Story

As a user, I want my Trust Score to update automatically based on verified events so my reputation reflects reality.

### Entry Points

- Dashboard: TrustRing / Trust Score widget (existing)  
- Verification page: "Your Trust Score" section  
- Profile: Trust Score + history expander  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `TrustScoreRing` | Circular score display | — |
| `TrustScoreHistory` | Timeline of events | loading, items, empty |
| `TrustScoreTooltip` | Explains how score is calculated | — |

### Design Tokens

- Score colors: 0–30 red, 31–60 amber, 61–100 green (existing logic)  
- `font-data-hud` for score number  
- History item: `text-sm`, event type + delta (e.g., "+50 Deal closed")  
- Positive delta: `text-[#059669]`  
- Negative delta: `text-red-600`  

### Empty States

- No history: "Your Trust Score will update as you complete deals and receive reviews."

### Loading States

- Ring: skeleton circle  
- History: skeleton rows  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/trust-score.ts` | Weights, recalculate |
| `anavi/server/db.ts` | getTrustScoreHistory |
| `anavi/server/routers.ts` | user.getTrustScoreHistory |
| `anavi/server/routers.ts` | Wire recalculate in deal/verification/peerReview |
| `anavi/client/src/components/TrustScoreHistory.tsx` | Timeline |
