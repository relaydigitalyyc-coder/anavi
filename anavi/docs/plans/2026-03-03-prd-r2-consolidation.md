# R2 — System Consolidation

**Version:** 1.1
**Status:** Active
**Date:** 2026-03-03
**Context:** Demo skeleton → MVP. Only consolidate things that cause active confusion or bugs. If two systems coexist peacefully, leave them.
**Estimated effort:** 2–3 hours

---

## Why This Matters for MVP

When an AI agent or dev needs to add a demo fixture, they find TWO demo systems. When they need to modify the tour, they find TWO tour implementations. This isn't a code quality concern — it's a velocity concern. Every hour spent figuring out "which one do I use?" is an hour not spent building features.

---

## C1. Demo Data System (2 → 1)

**The problem:** `Demo.tsx` (the main demo entry point, the thing investors see) uses `lib/DemoContext.tsx` + `lib/demoData.ts`. Every other page uses `contexts/DemoContext.tsx` + `lib/demoFixtures.ts`. Two different data shapes, two different providers.

**What to do:**
1. Migrate `Demo.tsx` to use `contexts/DemoContext.tsx` + `demoFixtures.ts`
2. Move any fixture data unique to `demoData.ts` (detailed match objects, deal room mock data) into `demoFixtures.ts`
3. Delete `lib/DemoContext.tsx` and `lib/demoData.ts`
4. Fix: `developer` and `principal` fixtures in `demoFixtures.ts` are literally identical (copy-paste). Give `principal` distinct values.

**Why now:** Every new page or feature needs demo data. One system means one place to add it.

---

## C2. Tour System — Leave As-Is

The demo tour (`GuidedTour`) and the app tour (`TourOverlay`) serve different purposes:
- Demo tour: walks investors through a curated narrative with interactive steps
- App tour: introduces new users to the UI

They look like duplication but they're two different user journeys. **Leave both.** Consolidating them would risk breaking the demo flow, which is the single most important user-facing feature.

---

## C3. Animation System — Leave As-Is

Three animation files (Awwwards, Premium, PageTransition) total ~1,900 lines. They overlap but they work. The demo looks premium because of them. Consolidating risks visual regressions for zero user-facing benefit.

**Leave them.** If a new animation is needed, add it to whichever file feels right. Consolidate later when the product is stable.

---

## C4. Constants Duplication — Quick Fix

`COLORS` and `formatCurrency` are duplicated in `relationships/constants.ts` and `deal-matching/constants.ts`.

**Fix:** Create `lib/constants.ts` with the shared pieces. 10-minute job, prevents future drift.

---

## C5. Trust Score Hardcoded to 84

`DashboardLayout.tsx:419`:
```tsx
<TrustScoreChip score={isDemo ? (demoFixtures?.user.trustScore ?? 84) : 84} />
```

In live mode, the trust score is **always 84**. The backend has a full trust score calculation engine in `db/users.ts` (`recalculateTrustScore`).

**Fix:** In non-demo mode, fetch from `trpc.user.me` and use `user.trustScore`. Fallback to 84 during loading. This makes the dashboard feel real.

---

## NOT in Scope

- Merging persona/industry switcher components (they work fine as-is)
- Refactoring DashboardLayout (it's big but functional)
- Changing the tour system
- Touching the animation system
