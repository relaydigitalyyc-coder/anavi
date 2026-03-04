# R3 — Demo Data Architecture

**Version:** 1.1
**Status:** Active
**Date:** 2026-03-03
**Context:** This is a demo product. Mock data IS the product right now. The goal isn't to remove mock data — it's to organize it so new pages can be built fast and the demo feels consistent.
**Estimated effort:** 3–4 hours

---

## Why This Matters for MVP

13 page files have 50–543 lines of inline mock data each. When you need to add a new demo scenario or adjust fixture data for an investor pitch, you're editing 13 files instead of 1. When a new page needs demo data, the dev copies from an existing page and edits — drift accumulates.

The fix isn't "remove mock data" — it's "put it in one place."

---

## D1. Centralize Fixture Data

Create `lib/fixtures/` with domain-grouped files:

```
lib/fixtures/
├── index.ts              # useFixtures() hook + barrel export
├── intelligence.ts       # DealIntelligence, AIBrain, KnowledgeGraph
├── marketplace.ts        # Commodities, RealEstate, CryptoAssets, TradingPlatform, TransactionMatching
├── finance.ts            # LPPortal, FeeManagement, Analytics
└── types.ts              # Shared types
```

**Migration approach:** Start with the 3 biggest files:
1. `KnowledgeGraphPage.tsx` (~543 lines of data) → `fixtures/intelligence.ts`
2. `DealIntelligence.tsx` (~205 lines) → `fixtures/intelligence.ts`
3. `TransactionMatching.tsx` (~164 lines) → `fixtures/marketplace.ts`

Do the rest incrementally as those pages are touched for other reasons.

---

## D2. The `useFixtures()` Pattern

```typescript
export function usePageFixtures<T>(domain: string): T | null {
  const { isDemo } = useDemoContext();
  if (!isDemo) return null;
  return FIXTURES[domain] as T;
}
```

Pages use:
```typescript
const fixtures = usePageFixtures<IntelligenceFixtures>('intelligence');
const deals = trpcData ?? fixtures?.extractedDeals ?? [];
```

This is the same `trpcData ?? fallback` pattern most pages already use — just pulling the fallback from a shared location instead of inline.

---

## D3. Do NOT Add "Demo Data" Badges

The previous version of this PRD suggested adding "Sample Data" indicators. **Don't.** This is a demo product being shown to investors. The whole point is that the data looks real. The demo IS fake data presented convincingly. Badges undermine that.

---

## D4. Fix the Fake Custody Hash — Later

`generateFakeHash()` creates random hashes shown as "custody hashes." The backend has a real hash chain (`_core/hashchain.ts`). In a perfect world, the demo would use the real hash chain.

**For MVP:** Leave as-is. The fake hash looks real in the demo, and wiring the real hash chain requires the relationship protection flow to be fully end-to-end. That's a feature, not a cleanup.

**Track for post-MVP:** Replace `generateFakeHash` with backend-generated hash when the relationship protection mutation is fully wired.

---

## D5. The 3 Pages That Should Wire tRPC (Quick Wins)

These pages already have tRPC routers ready but use hardcoded data instead:

| Page | tRPC Router | What to Wire |
|------|------------|-------------|
| `FeeManagement.tsx` | `fees.getSchedule` | Fee structure and partner payouts |
| `MemberOnboarding.tsx` | `members.getStats` | Onboarding stats |
| `Analytics.tsx` | `analytics.getDealPipeline` | Weekly deals, revenue, funnel |

These are 30-minute wiring tasks each. The routers exist, the DB functions exist, the data types match. Just replace the hardcoded arrays with `trpc.X.useQuery()`.

---

## NOT in Scope

- Removing mock data from pages (it powers the demo)
- Building a fixture generation system
- Changing how `demoFixtures.ts` works
- Splitting large page files (separate PRD)
