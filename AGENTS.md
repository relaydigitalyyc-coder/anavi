# Agent Quick Reference

For AI agents working on this codebase. See `.cursor/rules/` for detailed conventions.

## White Paper Alignment

ANAVI implements the vision from the Strategic White Paper (Jan 2026). Use consistent terminology: **Relationship Custody**, **Trust Score**, **Originator**, **Attribution**, **Blind Matching**, **Deal Room**, **Intent**. Full concept → code mapping: `docs/white-paper-alignment.md`.

## Where to Add Things

| To add… | Location |
|---------|----------|
| API endpoint | `anavi/server/routers/<domain>.ts` + merge in `routers/index.ts` |
| DB operation | `anavi/server/db/<domain>.ts` (add to matching module) |
| Schema table | `anavi/drizzle/schema.ts` + relation in `relations.ts` + `pnpm drizzle-kit generate` |
| Page | `anavi/client/src/pages/*.tsx` + route in `App.tsx` (ShellRoute) |
| Sidebar link | `navSections` array in `DashboardLayout.tsx` |
| Component | `anavi/client/src/components/` |
| Hook | `anavi/client/src/hooks/` |
| Shared types | `anavi/shared/types.ts` or schema |
| Large page decomposition | `anavi/client/src/pages/<page-name>/` (see `deal-room/` as example) |

## Commands (run from `anavi/`)

```bash
pnpm check   # TypeScript type-check
pnpm test    # 37 tests (unit + integration)
pnpm build   # Client + server production build
```

## Route Pattern

- **ShellRoute** = auth + DashboardLayout + PageTransition (all main pages; pages do NOT render DashboardLayout)
- **ProtectedPage** = auth only (full-screen flows: Onboarding, OnboardingFlow)
- Register in `App.tsx`; never expose protected content without a wrapper

## End-to-End Feature Checklist

1. Schema change? → `drizzle/schema.ts` + relation in `relations.ts` + migration
2. DB function → `server/db/<domain>.ts`
3. Router procedure → `server/routers/<domain>.ts` + merge in index
4. Client page → `client/src/pages/X.tsx`, no DashboardLayout wrapper
5. Route → `App.tsx` with ShellRoute
6. Sidebar? → `navSections` in `DashboardLayout.tsx`
7. Verify → `pnpm check && pnpm test`

## Conventions

- DB modules are in `server/db/` (16 domain files + barrel). Add functions to matching module.
- Routers are thin: call `db.*`, return. 25 individual router files.
- `protectedProcedure` for user-scoped data. Zod for all inputs.
- Client: `trpc.router.proc.useQuery` / `useMutation`
- UI: shadcn/ui from `@/components/ui/*`, lucide-react, framer-motion
- Decompose large pages: extract tab/section components into `pages/<name>/` subdirectory

## Sidebar Navigation (navSections)

7 grouped sections with 20 items:
- Overview: Dashboard, Analytics
- Deals: Deal Matching, Deal Rooms, Deals, Deal Intelligence
- Network: Relationships, Family Offices, Targeting, Network Graph
- Compliance: Verification, Audit Logs, Compliance
- Finance: Payouts, LP Portal
- AI & Intel: AI Brain, Intelligence
- Settings: Calendar, Settings
