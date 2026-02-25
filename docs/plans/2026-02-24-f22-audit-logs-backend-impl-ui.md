# F22: Audit Logs Backend Wiring — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Audit Logs Backend Wiring  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.7  
**Overlap:** F13 Immutable Audit Trail; this focuses on wiring UI to real data

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [x] Implementation complete (audit.query, audit.export)
- [x] UI complete (real data, filters, export CSV)
- [x] Verified

---

## Implementation PRD

### Goal

Audit Logs page calls `audit.query` with filters (user, entity, date range). Pagination. Export CSV. Real data from `audit_log`. Query <2s; index on actor, entityType, createdAt.

### Architecture

`audit_log` table (from F13 or existing). `audit.list` or `auditLog.query` tRPC. Filters: userId, entityType, entityId, startDate, endDate. Pagination: cursor or offset. Export: same query; stream CSV. Admin or own-user scope.

### Tech Stack

Drizzle ORM, tRPC v11, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | auditLog |
| `anavi/server/db.ts` | logAuditEvent, getAuditLog |
| F13 | Immutable audit schema |
| `anavi/client/src/pages` | AuditLogs.tsx if exists |

### Phase 1: Query API

**Task 1 — audit.query procedure**  
- Input: userId?, entityType?, entityId?, startDate?, endDate?, limit?, cursor?  
- Query audit_log with filters  
- Index: (userId, createdAt), (entityType, entityId), (createdAt)  
- Return: { items, nextCursor }  
- Scope: admin sees all; user sees own (userId filter)  

**Task 2 — Pagination**  
- Cursor-based: createdAt + id  
- Limit 100 default; max 500  
- nextCursor = last item's (createdAt, id) for "next page"  

**Task 3 — Export**  
- `audit.export(filters)` — same filters  
- Stream or collect; format CSV  
- Columns: timestamp, userId, action, entityType, entityId, oldState (truncated), newState (truncated), hash  
- Download as file; admin only  

### Phase 2: UI Wiring

**Task 4 — Audit Logs page**  
- Route: /audit-logs or /settings/audit (admin)  
- Filters: user dropdown (admin), entity type, date range  
- Table: timestamp, actor, action, entity, link  
- Pagination: Load more or page numbers  
- Remove any mock data; wire to audit.query  

**Task 5 — Export button**  
- "Export CSV" — calls audit.export  
- Download blob; filename with date range  
- Loading state  

### Phase 3: Performance

**Task 6 — Query optimization**  
- Ensure indexes exist  
- Large result sets: streaming export  
- Target <2s for typical query  

**Task 7 — Retention**  
- Older data: archive or exclude from default range  
- Config: retention years  
- Export may have cutoff  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4 → Task 5
Task 6, 7 (optimization)
```

### Verification

- [ ] Audit page shows real data
- [ ] Filters work
- [ ] Export produces valid CSV
- [ ] Query <2s for 10k rows

---

## UI PRD

### User Story

As an admin, I want to query the real audit log so I investigate incidents.

### Entry Points

- Settings → Audit Logs (or Admin → Audit)  
- Deal room: Activity tab (filtered by deal) — optional  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `AuditLogFilters` | User, entity type, date range | — |
| `AuditLogTable` | Rows with pagination | loading, rows, empty |
| `AuditLogExportButton` | Export CSV | loading, done |

### Design Tokens

- Table: `card-elevated`  
- Mono: `font-data-hud` for hashes, IDs  
- Entity link: primary color  
- Timestamp: relative + absolute on hover  

### Empty States

- No results: "No audit events match your filters."  

### Trust Signals

- "Immutable log"  
- Hash column in export for verification  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/db.ts` | getAuditLog (paginated) |
| `anavi/server/routers.ts` | audit.query, audit.export |
| `anavi/client/src/pages/AuditLogs.tsx` | Page |
| `anavi/client/src/components/AuditLogTable.tsx` | — |
| `anavi/client/src/components/AuditLogFilters.tsx` | — |
| `anavi/drizzle/schema.ts` | Indexes |
