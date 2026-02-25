# Agent Quick Reference

For AI agents working on this codebase. See `.cursor/rules/` for detailed conventions.

## Where to Add Things

| To add… | Location |
|---------|----------|
| API endpoint | `anavi/server/routers/<domain>.ts` → add to existing or create new + merge in `routers/index.ts` |
| DB operation | `anavi/server/db.ts` — `export async function ...` |
| Schema table | `anavi/drizzle/schema.ts` + `pnpm drizzle-kit generate` |
| Page | `anavi/client/src/pages/*.tsx` + route in `App.tsx` (ShellRoute) |
| Sidebar link | `navItems` array in `DashboardLayout.tsx` |
| Component | `anavi/client/src/components/` |
| Hook | `anavi/client/src/hooks/` |
| Shared types | `anavi/shared/types.ts` or schema |

## Commands (run from `anavi/`)

```bash
pnpm check   # TypeScript type-check
pnpm test    # Unit + integration (37 tests)
pnpm build   # Client + server production build
```

## Route Pattern

- **ShellRoute** = auth + DashboardLayout + PageTransition (all main pages; pages do NOT render DashboardLayout)
- **ProtectedPage** = auth only (full-screen flows: Onboarding, OnboardingFlow)
- Register in `App.tsx`; never expose protected content without a wrapper

## End-to-End Feature Checklist

1. Schema change? → `drizzle/schema.ts` + migration
2. DB function → `server/db.ts`
3. Router procedure → `server/routers/<domain>.ts` + merge in index
4. Client page → `client/src/pages/X.tsx`, no DashboardLayout wrapper
5. Route → `App.tsx` with ShellRoute
6. Sidebar? → `navItems` in `DashboardLayout.tsx`
7. Verify → `pnpm check && pnpm test`

## Conventions

- Routers are thin: call `db.*`, return. No business logic in routers.
- `protectedProcedure` for user-scoped data. Zod for all inputs.
- Client: `trpc.router.proc.useQuery` / `useMutation`
- Audit: `db.logAuditEvent(...)` after sensitive writes
- UI: shadcn/ui primitives from `@/components/ui/*`, lucide-react icons, framer-motion

## Current Router Domains

auth, user, verification, relationship, contact, intent, match, deal, dealRoom, compliance, payout, notification, audit, search, intelligence, lpPortal, realEstate — individual files.
ai, familyOffice, targeting, brokerContact, enrichment, calendar, analytics — in `_legacy.ts`.

## Sidebar Navigation (navItems)

Dashboard, Relationships, Deal Matching, Deal Rooms, Verification, Intelligence, Payouts, Settings.
Many pages exist but are not in sidebar — access via direct URL or cross-links.
