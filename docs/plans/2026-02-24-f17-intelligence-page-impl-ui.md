# F17: Intelligence Page Launch — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Intelligence Page Launch  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.5  
**Overlap:** PRD-4 AI Deal Intelligence; market/sector data may exist

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [x] Implementation complete
- [x] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Remove "coming soon". Deliver sector intelligence, market depth, deal flow analytics. Use existing `marketQuery`, `sectorIntelligence` tRPC if present; or aggregate from dashboard stats. Page load <3s; cache aggressive reads.

### Architecture

`/intelligence` route. Fetch from `intelligence.*` or `analytics.*` or `market.*` tRPC. Server: aggregate intents, deals, matches by sector; compute market depth (buyers vs sellers); optional AI summary. Cache: 5–15min TTL for heavy queries.

### Tech Stack

Drizzle ORM, tRPC v11, React 19, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/client/src/pages` | Intelligence.tsx if exists |
| `anavi/server/routers.ts` | market, analytics, intelligence |
| `anavi/drizzle/schema.ts` | intents, deals, matches (sector, etc.) |

### Phase 1: Data Layer

**Task 1 — Intelligence aggregation**  
- `intelligence.getSectorOverview()` — counts by sector (intents, deals)  
- `intelligence.getMarketDepth()` — buyers vs sellers by sector (from intents)  
- `intelligence.getDealFlowTrends()` — deals created per week; optional  
- Scope: platform-wide (anonymized) or user's network  
- Use existing tables; no new schema if possible  

**Task 2 — Caching**  
- In-memory cache or Redis: TTL 5–15min  
- Cache key: intelligence:sector, intelligence:depth  
- Invalidate on configurable schedule  

**Task 3 — Fallback**  
- If no data: return empty arrays; UI shows empty state  
- No 500 on missing data  

### Phase 2: Page Build

**Task 4 — Intelligence page**  
- Route: `/intelligence`  
- Sections: Sector Intelligence, Market Depth, Deal Flow (if data)  
- Charts: Recharts bar/line; cards for key metrics  
- Remove "Coming soon" placeholder  
- Loading: skeletons  

**Task 5 — Sector cards**  
- Card per sector: count, trend, top subcategory  
- Click → filter or drill-down (optional)  

**Task 6 — Market depth viz**  
- Bar chart: buyers vs sellers by sector  
- Same pattern as Dashboard market depth  
- Data from intents (buyer/seller flag)  

### Phase 3: AI Summary (Optional)

**Task 7 — AI summary**  
- `intelligence.getSummary()` — Claude generates 2–3 sentence market insight from aggregated data  
- Cache 1h  
- Defer if costly  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4 → Task 5 → Task 6
Task 7 (optional)
```

### Verification

- [ ] /intelligence loads without "coming soon"
- [ ] Sector data displays
- [ ] Market depth displays
- [ ] Page load <3s

---

## UI PRD

### User Story

As a user, I want an Intelligence page with market insights so I make better decisions.

### Entry Points

- Nav: "Intelligence" link  
- Dashboard: "View market intelligence" CTA  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `SectorOverview` | Cards or table: sector, count, trend | loading, data, empty |
| `MarketDepthChart` | Bar chart: buyers vs sellers | — |
| `DealFlowTrend` | Line chart: deals over time | — |
| `IntelligenceSummary` | AI summary block | loading, text, empty |

### Design Tokens

- Page: `dash-heading` for title; `card-elevated` for sections  
- Chart colors: buyers `#2563EB`, sellers `#C4972A`  
- Cards: `data-label` for sector names; `font-data-hud` for numbers  

### Empty States

- No data: "Market intelligence will appear as more activity flows through ANAVI."  
- No AI: "Summary unavailable." (graceful)  

### Trust Signals

- "Based on ANAVI platform data"  
- "Updated [time ago]"  
- Anonymized; no PII  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/routers.ts` | intelligence router |
| `anavi/server/db.ts` | aggregation queries |
| `anavi/client/src/pages/Intelligence.tsx` | Page |
| `anavi/client/src/components/SectorOverview.tsx` | — |
| `anavi/client/src/components/MarketDepthChart.tsx` | — |
| `anavi/client/src/App.tsx` | Route /intelligence |
