# Specification: 000-dashboard-logical-integrity-and-relevance

## Status

COMPLETE

## Summary

Hardened dashboard truthfulness and runtime integrity:
- Removed misleading Trust Score aria text; no false "Enhanced" claim.
- In live/hybrid, Trust Score top-bar now defaults to 0 (not 84) when unknown.
- Gated demo-only "Compliance Passport" chips (KYB/OFAC/AML OK) behind demo mode.
- Added truthful CTAs in live/hybrid to complete verification and run compliance checks.
- Preserved persona coherence and route legality; no dashboard layout mount violations.

## Changes

- anavi/client/src/components/DashboardLayout.tsx
  - TrustScoreChip aria-label simplified to `Trust score {score} out of 100`.
  - Live/hybrid fallback uses `0` when `meData?.trustScore` is absent.
- anavi/client/src/pages/dashboard/InvestorDashboard.tsx
  - Added `isDemo` and gated Compliance Passport chips to demo only.
  - Added CTAs to `/verification` and `/compliance` in non-demo.
  - Adjusted Trust Score subcopy to avoid false institutional claim in non-demo.
- anavi/client/src/pages/dashboard/PrincipalDashboard.tsx
  - Added `isDemo`, wrapped Compliance Passport in demo-only block.
  - Added CTAs to `/verification` and `/compliance` in non-demo.
  - Fixed StaggerItem wrappers to maintain valid JSX structure.

## Acceptance Criteria Verification

- [x] FR-1 Relevance: Every visible dashboard block links to an actionable flow; Compliance Passport maps to Verification/Compliance flows in live/hybrid.
- [x] FR-2 KPI/Status Integrity: Trust Score copy and defaults reflect real state; status chips remain semantically correct.
- [x] FR-3 CTA Truthfulness: Compliance/verification CTAs route to real flows; no demo-only success narratives in live.
- [x] FR-4 Persona Coherence: Existing R7 persona canonicalization retained; persona dashboards remain role-true with no contradictory semantics.
- [x] FR-5 Runtime Mode Integrity: Demo-only visuals no longer leak into live; top bar shows explicit `{mode}`; behavior matches capabilities.
- [x] FR-6 Docs/Memory Sync: Plans and ops docs updated (see below).

## Evidence

- Type-check: `node_modules/.bin/tsc --noEmit` ⇒ clean on Node v20.18.0
- Tests: `node_modules/.bin/vitest run` ⇒ 67/67 passing
- Build: `node_modules/.bin/vite build` ⇒ bundle produced (Node 20.18 warning acknowledged; build completes)

## Docs/Memory Updates

- anavi/docs/plans/2026-03-04-prd-r8-dashboard-logic-integrity.md — added block→flow mapping and runtime gating notes.
- anavi/docs/ops/ENGINEERING_MEMORY.md — appended dated entry for dashboard truthfulness/gating.
- anavi/docs/ops/TODO_BOARD.md — marked R8 dashboard semantics pass items as done; R8 remains in progress for deeper iterations.

## Completion Signal

All acceptance criteria verified and synchronized.

`<promise>DONE</promise>`

<!-- NR_OF_TRIES: 1 -->
