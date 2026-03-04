# R5 — Large File Splitting (Deferred)

**Version:** 1.1
**Status:** Deferred — execute after MVP demo is stable
**Date:** 2026-03-03
**Context:** This is a demo skeleton. Splitting files is a maintenance concern, not a feature concern. The 1,000-line files work. They render. The demo doesn't care about file organization.

---

## Why This Is Deferred

27 files exceed 500 lines. 5 exceed 1,000 lines. In a production codebase, this is a red flag. In a demo skeleton:
- No merge conflicts (1–2 developers)
- No code review bottleneck (AI agents do the work)
- No onboarding confusion (no new engineers)
- No performance impact (Vite handles large files fine)

**Do this when:** A second human developer joins, or the codebase transitions from demo to production.

---

## When You Do Split, Start Here

### Priority 1: Files that are actively hard to work with
1. `AddRelationshipModal.tsx` (1,138 lines) — 7 inline sub-components. Split into step files.
2. `Demo.tsx` (1,322 lines) — after R2 migrates it to the unified demo context, split into page sections.
3. `DashboardLayout.tsx` (709 lines) — extract `SidebarNav`, `NotificationDrawer`, `MobileNav`.

### Priority 2: Everything else over 800 lines
- `KnowledgeGraphPage`, `Verification`, `OriginatorDashboard`, `DealIntelligence`
- After R3 moves mock data out, many of these will naturally shrink below 500 lines.

### Skip entirely
- Animation files (leave consolidated for now)
- shadcn `ui/sidebar.tsx` (generated, don't touch)
- Any file under 600 lines (not worth the effort)

---

## NOT in Scope for MVP

Everything in this document. This is a reference for later.
