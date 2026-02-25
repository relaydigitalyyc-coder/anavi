# F10: LP Portal Data-Backing — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.
>
> **Full implementation plan:** [2026-02-24-prd5-lp-portal-impl.md](2026-02-24-prd5-lp-portal-impl.md) — PRD-5 covers fund setup, capital calls, distributions, LP portal in full.

**Feature:** LP Portal Data-Backing  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.3

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD (Summary)

F10 is fully specified in **PRD-5: LP Portal & Fund Communications**. Implement per [2026-02-24-prd5-lp-portal-impl.md](2026-02-24-prd5-lp-portal-impl.md).

Key deliverables:
- `fund` router: getCommitments, getDistributions, getDocuments (or getCapitalAccountStatement)
- LP Portal page: data-backed from `fund.*` instead of mocks
- NAV/IRR calculations (simplified in P1; full in P3)

---

## UI PRD

### User Story

As an LP, I want to see my actual commitments, distributions, and documents so I manage my portfolio.

### Entry Points

- `/lp-portal/:fundId` — LP view (PRD-5)  
- Sidebar: "LP Portal" when user is LP of ≥1 fund  
- Fund manager invites LP → LP gets email → lands on LP portal  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `LPPortalSummary` | Header: committed, called, distributed, NAV | — |
| `LPCapitalAccountTable` | Running ledger: calls, distributions, fees | loading, rows, empty |
| `LPDocumentInbox` | Communications; filter by type, date | — |
| `LPFundSelector` | When user has multiple funds; dropdown | — |

### Design Tokens

- Summary numbers: `font-data-hud text-2xl font-bold`  
- Table: `card-elevated`; `data-label` headers  
- Status badges: committed `bg-[#22D4F5]/10`, distributed `bg-[#059669]/15`  
- Minimal nav: LP view uses restricted layout (sidebar hidden or simplified)  

### Empty States

- No commitments: "You have no fund commitments yet. Your fund manager will invite you."
- No documents: "No communications this period."  

### Trust Signals

- "Capital Account Statement" — official wording  
- Timestamp on each entry  
- Export/download for records  

### Data Scoping

- All data scoped by user + fundId  
- LP sees only their share; no other LPs' data  

---

## File Index

See [2026-02-24-prd5-lp-portal-impl.md](2026-02-24-prd5-lp-portal-impl.md) File Index.
