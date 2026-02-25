# F15: Global Search — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Global Search  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.5

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [x] Implementation complete (search.global, db.globalSearch)
- [x] UI complete (Cmd+K modal, debounce, recent searches)
- [x] Verified (build passes)

---

## Implementation PRD

### Goal

Cmd+K or header search. Query backend. Search intents (title, description), deals (title), relationships (alias), matches (counterparty alias). Typeahead. Recent searches. Response <500ms; debounce 300ms; limit 20 results.

### Architecture

`search.global(query, limit)` tRPC. Backend: full-text or LIKE across intents, deals, relationships, matches. Scope by userId. Aggregate results by type; return unified list. Client: Cmd+K modal; debounced input; recent searches in localStorage.

### Tech Stack

Drizzle ORM, tRPC v11, MySQL FULLTEXT or LIKE, React 19, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | intents, deals, relationships, matches |
| `anavi/client/src` | Header, layout |
| `cmdk` or `kbar` — check if installed; or build custom modal |

### Phase 1: Backend

**Task 1 — Search procedure**  
- `search.global(input: { query, limit? })`  
- Query intents (title, description) WHERE userId = ctx.user.id  
- Query deals (title) WHERE user in participants  
- Query relationships (alias) WHERE ownerId = ctx.user.id  
- Query matches (counterparty info) WHERE user in match  
- Use LIKE `%query%` or FULLTEXT if available  
- Combine; sort by relevance (simple: order by match strength)  
- Return: { results: [{ type, id, title, subtitle, url }] }  
- Limit 20 total  

**Task 2 — Indexing**  
- Add FULLTEXT index on intents(title, description) if MySQL supports  
- Index on deals.title, relationships alias  
- Or: accept LIKE performance for MVP  

**Task 3 — Permissions**  
- Filter all results by user access  
- No cross-user leakage  

### Phase 2: Client

**Task 4 — Search modal**  
- Cmd+K (Mac) / Ctrl+K (Win) opens modal  
- Input; debounce 300ms  
- Call `search.global` on input  
- Display results grouped by type (Intents, Deals, Relationships, Matches)  
- Click → navigate to entity  
- Escape to close  

**Task 5 — Recent searches**  
- localStorage: anavi_recent_searches (last 5 queries)  
- Show when input empty  
- Click recent → run search  

**Task 6 — Empty / loading**  
- Loading: skeleton rows  
- Empty: "No results for [query]"  
- Zero chars: show recent or "Search intents, deals, relationships..."  

### Phase 3: Edge Cases

**Task 7 — Empty query**  
- Don't call backend; show recent or placeholder  
- Avoid abuse (no search on every keystroke before debounce)  

**Task 8 — Permission filtering**  
- Ensure deleted/archived entities excluded  
- Blind match: don't reveal counterparty identity in match result if policy says so  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4 → Task 5 → Task 6
Task 7, 8 (handling)
```

### Verification

- [ ] Cmd+K opens modal
- [ ] Search returns results in <500ms
- [ ] Click navigates correctly
- [ ] Recent searches persist

---

## UI PRD

### User Story

As a user, I want to search across intents, deals, relationships, and matches so I find things quickly.

### Entry Points

- Cmd+K / Ctrl+K  
- Header: search icon; click opens same modal  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `GlobalSearchModal` | Overlay; input; results | idle, loading, results, empty |
| `SearchResultGroup` | Section: Intents, Deals, etc. | — |
| `SearchResultItem` | Single row: icon, title, subtitle | — |
| `RecentSearches` | List of recent queries | — |

### Design Tokens

- Modal: `glass-dark` or `card-elevated`; blur backdrop  
- Input: focus ring `border-[#22D4F5]`  
- Result hover: `bg-[#0A1628]/5`  
- Group label: `data-label`  
- Keyboard nav: highlight current with `bg-[#22D4F5]/10`  

### Empty States

- No results: "No results for [query]. Try a different search."  
- No recent: "Your recent searches will appear here."  

### Accessibility

- aria-label on input  
- Arrow keys to navigate results  
- Enter to select  
- Escape to close  

### Reference

- Linear, Raycast, VSCode command palette patterns  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/routers.ts` | search.global |
| `anavi/server/db.ts` | searchIntents, searchDeals, etc. |
| `anavi/client/src/components/GlobalSearchModal.tsx` | Modal |
| `anavi/client/src/App.tsx` | Cmd+K listener; render modal |
| `anavi/client/src/hooks/useGlobalSearch.ts` | Debounce, recent |
