# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `anavi/`:

```bash
pnpm dev          # Dev server (Express + Vite HMR)
pnpm build        # Client (Vite) + server (esbuild) production build
pnpm start        # Run production build
pnpm check        # TypeScript type-check (tsc --noEmit)
pnpm test         # 37 tests: unit + integration (no DB required, uses mocks)
pnpm db:push      # Generate + run Drizzle migrations
pnpm db:seed      # Seed demo user
```

Always verify with `pnpm check && pnpm test` after changes.

## Architecture

### Stack
- **Client**: React 19, Vite, wouter, tRPC React Query, Tailwind 4, shadcn/ui, framer-motion
- **Server**: Node, Express, tRPC v11, Drizzle ORM (MySQL/TiDB), superjson
- **AI**: Claude API via `server/_core/llm.ts` + `server/claude.ts`
- **Shared**: `anavi/shared/` — types, constants, errors

### Data Flow
```
Page → trpc.router.proc.useQuery → Router procedure → db.* → Drizzle → MySQL
Types: drizzle/schema → shared/types → client + server
```

### Key Paths
| Concern | Path |
|---------|------|
| API entry | `anavi/api/index.ts` |
| Router modules | `server/routers/*.ts` (25 files) → merged in `routers/index.ts` |
| Router re-export | `server/routers.ts` (thin barrel) |
| DB modules | `server/db/*.ts` (16 domain files) → re-exported via `db/index.ts` |
| DB re-export | `server/db.ts` (thin barrel) |
| Schema (48 tables) | `anavi/drizzle/schema.ts` |
| Relations | `anavi/drizzle/relations.ts` |
| Shared types | `anavi/shared/types.ts` |
| tRPC client | `client/src/lib/trpc.ts` |
| Routes (39) | `client/src/App.tsx` |
| Sidebar nav | `DashboardLayout.tsx` → `navSections` array |
| UI primitives | `client/src/components/ui/*` (53 shadcn components) |

### Route Wrappers (App.tsx)
- **ShellRoute** = `ProtectedRoute` + `DashboardLayout` + `PageTransition` — all main app pages; pages **must NOT** render DashboardLayout themselves
- **ProtectedPage** = `ProtectedRoute` only — full-screen flows (Onboarding, OnboardingFlow)
- **Bare** = public routes (Home, Login, Register, Demo, NotFound)

## End-to-End Feature Checklist

1. Schema change → `drizzle/schema.ts` + relation in `relations.ts` + `pnpm drizzle-kit generate`
2. DB function → `server/db/<domain>.ts`
3. Router procedure → `server/routers/<domain>.ts` + merge in `routers/index.ts` if new file
4. Client page → `client/src/pages/X.tsx` (no DashboardLayout wrapper)
5. Route → `App.tsx` with ShellRoute
6. Sidebar → `navSections` in `DashboardLayout.tsx`
7. Verify → `pnpm check && pnpm test`

## Server Conventions

- **Routers are thin**: call `db.*`, return. No business logic in routers.
- Auth levels: `publicProcedure` / `protectedProcedure` (requires `ctx.user`) / `adminProcedure` (requires `role === 'admin'`)
- Use Zod for all `.input()` validation
- `db.logAuditEvent(...)` after sensitive mutations
- `db.createNotification(...)` for user-facing events

## Client Conventions

```tsx
import { trpc } from "@/lib/trpc";
const { data, isLoading } = trpc.router.proc.useQuery(...);
const utils = trpc.useUtils();
const mutation = trpc.router.proc.useMutation({ onSuccess: () => utils.router.proc.invalidate() });
// Convenience wrapper:
const { data, isLoading, isError, isEmpty, isReady } = useQueryPage(trpc.x.useQuery(...));
```

UI toolkit: `@/components/ui/*` (primitives), `lucide-react` (icons), `framer-motion` (animation), `sonner` (toasts), `date-fns` (dates).

Decompose large pages into `pages/<name>/` subdirectory (see `deal-room/` as example).

## Schema & Types

- DB shapes: Drizzle inferred types (`$inferSelect`, `$inferInsert`)
- API-specific shapes: define in router file or `shared/types.ts`
- When adding schema for trust, custody, or attribution use whitepaper terms: `trustScore`, `originatorId`, `attributionPercentage`, `attributionChain`, `isBlind`

## Terminology

ANAVI uses consistent whitepaper terminology. Key concepts:
- **Relationship Custody** — timestamped, attributed relationships
- **Trust Score** — verification + transaction history + peer reviews
- **Blind Matching** — intent-based, anonymized until consent
- **Lifetime Attribution** — originators earn 40–60% of fees; follow-on deals compound
- **Deal Room** — embedded deal infrastructure with compliance

See `docs/white-paper-alignment.md` for concept → code mapping.

## PRDs & Plans

- Feature PRDs: `docs/plans/2026-02-24-f*-*.md` (F1–F24 improvements)
- Platform PRDs: `docs/plans/2026-02-24-prd*-*.md`
- Master index: `docs/plans/2026-02-24-23-improvements-index.md`
- PRD paths are relative to `anavi/` (e.g., `server/routers/foo.ts` = `anavi/server/routers/foo.ts`)

## Pages: tRPC-backed vs Demo

**tRPC-backed**: Dashboard, Relationships, Intents, Matches, Deals, DealRooms, Payouts, Verification, FamilyOffices, Targeting, Calendar, Analytics, AuditLogs, Intelligence, RealEstate, LPPortal, AIBrain.

**Demo/mock (wire to tRPC when adding real features)**: Commodities, TransactionMatching, CapitalManagement, TradingPlatform, CryptoAssets, MemberOnboarding, FeeManagement.

## Environment Variables

```
DATABASE_URL          # Required for DB-backed features
JWT_SECRET
VITE_APP_ID
OAUTH_SERVER_URL
OWNER_OPEN_ID
BUILT_IN_FORGE_API_URL  # Storage proxy
BUILT_IN_FORGE_API_KEY  # Storage proxy
ANTHROPIC_API_KEY       # Claude AI endpoints
```

## Deployment

Configured for Vercel: config at `anavi/vercel.json`, output dir `dist/public`.
