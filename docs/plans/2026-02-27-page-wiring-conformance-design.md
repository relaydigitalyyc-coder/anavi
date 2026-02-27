# Page Wiring & Vision Conformance Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to implement this plan task-by-task.

**Goal:** Ensure all primary user-journey pages are functionally correct and visually aligned with the ANAVI whitepaper vision.

**Architecture:** Two-phase approach — (1) apply 3 direct functional fixes, (2) run a 6+1 Gemini agent swarm to upgrade each page for visual/UX conformance.

**Tech Stack:** React 19, Vite, tRPC v11, Tailwind 4, framer-motion, copy.ts token system, Gemini 2.5 Flash API

---

## Audit Findings

### Functional Issues (Phase 1 — direct fixes)

| Issue | File | Fix |
|-------|------|-----|
| Broken link `/deal-room` | `Onboarding.tsx:252` | → `/deal-rooms` |
| Mobile nav outdated (5 items) | `DashboardLayout.tsx:123–129` | Expand to 6, rename "Matches" → "Blind Matching" |
| FeeManagement hybrid data | `FeeManagement.tsx` | Clean boundary between demo stats and live `trpc.fees.list` |

### Visual/UX Conformance Issues (Phase 2 — agent swarm)

| Page | Issues |
|------|--------|
| `Intents.tsx` | Header says "AI Blind Matching" but intents not labeled as "Blind Intents"; copy.ts tokens not used |
| `Matches.tsx` | Header "AI Matches" should be "Blind Matches"; missing sealed-brief aesthetic; `isUser1 = true` hardcoded |
| `Relationships.tsx` | "Protected/Visible" should be "Custodied/Open"; "Relationship Custody" not prominent; custody hash display weak |
| `Verification.tsx` | Radar chart has duplicate "verification" label; component names generic (not whitepaper-aligned); hardcoded partner count |
| `Payouts.tsx` | Good alignment; missing "Attribution Chain" section; DASHBOARD.payouts copy tokens not wired |
| `DealRooms.tsx` | "Diligence" and "Closing" status filters never match (dead code); fake total value `stats.total * 2.5`; missing whitepaper language |

---

## Phase 1: Direct Functional Fixes

### Fix 1 — Onboarding.tsx broken link
- `client/src/pages/Onboarding.tsx:252` — change `/deal-room` to `/deal-rooms`

### Fix 2 — Mobile nav
- `client/src/components/DashboardLayout.tsx:123–129`
- Replace 5-item array with 6-item array:
  - Dashboard `/dashboard`
  - Blind Matching `/deal-matching`
  - Relationships `/relationships`
  - Payouts `/payouts`
  - Verification `/verification`
  - Settings `/settings`

### Fix 3 — FeeManagement data boundary
- `client/src/pages/FeeManagement.tsx`
- Wrap hardcoded demo stats in a clear `DEMO_STATS` const at top of file
- Gate demo display on absence of live `fees` data from tRPC
- No schema changes needed

---

## Phase 2: 6+1 Agent Swarm

### Agent Architecture

Same pattern as `scripts/build-agent-prompts.py` (round 1). New file: `scripts/build-page-agent-prompts.py`.

Each agent receives:
- Full source of its target page
- `client/src/lib/copy.ts` (copy tokens)
- `client/src/pages/Dashboard.tsx` lines 1–60 (import/style reference)
- Whitepaper context (key module description)
- Specific output JSON schema: `{ "upgraded_tsx": "...", "changes_summary": [...] }`

### Agent Assignments

| Agent | File | Whitepaper Module | Key Changes |
|-------|------|-------------------|-------------|
| 1 | `Intents.tsx` | Blind Matching | Header → "Blind Matching — Your Intents"; intent cards → "Blind Intent" label; use TOUR.blindMatch copy |
| 2 | `Matches.tsx` | Blind Matching | Header → "Blind Matches"; sealed-brief card aesthetic (navy gradient, lock icon); fix `isUser1 = true`; counterparty tier label; use TOUR.blindMatch copy |
| 3 | `Relationships.tsx` | Relationship Custody | Header → "Relationship Custody"; "Protected" → "Custodied", "Visible" → "Open"; custody hash prominent; use CUSTODY_RECEIPT copy |
| 4 | `Verification.tsx` | Trust Score / Identity | Fix duplicate radar label; whitepaper component names; remove hardcoded partner count |
| 5 | `Payouts.tsx` | Economics Engine | "Attribution Chain" section; originator share %; DASHBOARD.payouts copy tokens |
| 6 | `DealRooms.tsx` | Deal Rooms | Fix status filter mapping; remove fake total value; NDA/audit-trail language |
| 7 (synthesis) | All 6 | Cross-page | Terminology consistency, empty states, animation patterns |

### Output Files

```
scripts/outputs/page-agent1-intents.json
scripts/outputs/page-agent2-matches.json
scripts/outputs/page-agent3-relationships.json
scripts/outputs/page-agent4-verification.json
scripts/outputs/page-agent5-payouts.json
scripts/outputs/page-agent6-dealrooms.json
scripts/outputs/page-agent7-synthesis.json
```

### Patch Application Order

1. Apply Agent 3 (Relationships) — no deps
2. Apply Agent 4 (Verification) — no deps
3. Apply Agent 5 (Payouts) — no deps
4. Apply Agent 6 (DealRooms) — no deps
5. Apply Agent 1 (Intents) — no deps
6. Apply Agent 2 (Matches) — no deps
7. Apply synthesis corrections from Agent 7
8. `pnpm check && pnpm test`
9. Commit

---

## Success Criteria

- `pnpm check` — 0 errors
- `pnpm test` — 60/60 pass
- All 6 pages use whitepaper module terminology consistently
- No hardcoded mock data in live tRPC-backed pages
- Status filters in DealRooms.tsx all match real data
- Mobile nav reflects 6-module structure
- No broken links
