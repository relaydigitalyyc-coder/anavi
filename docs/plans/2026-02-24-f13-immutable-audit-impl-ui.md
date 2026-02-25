# F13: Immutable Audit Trail — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Immutable Audit Trail  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.4  
**Overlap:** PRD-6 covers attribution hash chain; this extends to full audit log

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [x] Implementation complete (hash chain, query, export)
- [x] UI complete (F22 wires AuditLogs page)
- [x] Verified

---

## Implementation PRD

### Goal

Append-only audit log. Hash chain or Merkle tree. Write-once; no update/delete. Retention policy. Export for regulators. Write latency <50ms; query by actor, entity, date.

### Architecture

`audit_log` table (append-only). DB triggers prevent UPDATE/DELETE. Hash chain: each row includes `prevHash`; `hash = H(prevHash + rowData)`. `audit.log` internal; `audit.query`, `audit.export` for admins.

### Tech Stack

Drizzle ORM, Node crypto (SHA-256), tRPC v11, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | `auditLog` table |
| `anavi/server/db.ts` | `logAuditEvent` |
| PRD-6 | Attribution hash chain pattern |

### Phase 1: Schema + Immutability

**Task 1 — Audit log schema**  
- `audit_log`: id, userId, action, entityType, entityId, oldState (JSON), newState (JSON), hash, prevHash, createdAt  
- Index: (userId, createdAt), (entityType, entityId), (createdAt)  
- TDD: assert insert works; assert update/delete fail  

**Task 2 — Immutability triggers**  
- MySQL: BEFORE UPDATE/DELETE triggers → SIGNAL error  
- Or: application-level only (no direct DB access); Drizzle never calls update/delete on audit_log  

**Task 3 — Hash chain**  
- On insert: fetch prevHash = last row's hash for chain (or per-entity chain)  
- Compute hash = SHA256(prevHash + JSON.stringify(rowData))  
- Store hash in row  

### Phase 2: Write Path

**Task 4 — Centralized log**  
- `logAuditEvent({ userId, action, entityType, entityId, oldState, newState })`  
- Compute hash; insert  
- All mutations call this (already partially done)  
- Audit: deal update, payout create, verification review, relationship create, etc.  

**Task 5 — Performance**  
- Async write if needed (queue) to meet <50ms; ensure no loss  
- Or: sync write; <50ms achievable with indexed inserts  
- Batch not recommended (breaks chain order)  

### Phase 3: Query + Export

**Task 6 — Query API**  
- `audit.query(filters)` — userId?, entityType?, entityId?, startDate?, endDate?  
- Paginated; limit 100  
- Admin or own-user only  

**Task 7 — Export**  
- `audit.export(filters)` → CSV or JSON  
- For regulators; admin only  
- Retention: configurable (e.g., 7 years); archive old to cold storage  

### Dependency Map

```
Task 1 → Task 2 → Task 3 → Task 4
Task 4 → Task 5
Task 4 → Task 6 → Task 7
```

### Verification

- [ ] Update/delete on audit_log fails
- [ ] Hash chain verifiable (each hash matches recompute)
- [ ] Query returns correct rows

---

## UI PRD

### User Story

As a compliance officer, I want an immutable audit trail so we can prove actions for regulators.

### Entry Points

- Audit Logs page: query, view, export  
- Deal room: Activity / Audit tab (filtered by deal)  
- Admin: full audit log  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `AuditLogTable` | Rows: actor, action, entity, date, details | loading, rows, empty |
| `AuditLogFilters` | User, entity type, date range | — |
| `AuditLogExportButton` | Trigger export; download | loading, done |

### Design Tokens

- Table: `card-elevated`  
- Monospace for hashes: `font-data-hud text-[10px]`  
- Entity link: click → navigate to entity  
- Timestamp: `font-data-hud`  

### Empty States

- No results: "No audit events match your filters."  

### Trust Signals

- "Immutable • Hash-chained"  
- Export includes hash column for verification  
- Read-only UI (no edit/delete)  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/drizzle/schema.ts` | audit_log + triggers |
| `anavi/server/db.ts` | logAuditEvent (hash chain) |
| `anavi/server/routers.ts` | audit.query, audit.export |
| `anavi/client/src/pages/AuditLogs.tsx` | Query UI |
| `anavi/client/src/components/AuditLogTable.tsx` | — |
