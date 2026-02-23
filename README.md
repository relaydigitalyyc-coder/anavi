# ANAVI / @navi

Private-market operating system prototype focused on relationship custody, deal flow intelligence, and trust/compliance workflows.

## Repository Layout
- `anavi/`: active application codebase (frontend + backend)
- `anavi-complete-archive/`: historical snapshot/archive
- `anavi-mega-archive/`: historical snapshot/archive and assets
- `Navi Marketplace Proposal (Webaroo).pdf`: proposal document

## What This Platform Is Building
ANAVI is intended to be a private-market operating system with five core pillars:
1. Verified identity and trust scoring
2. Relationship custody and attribution
3. AI-assisted blind matching
4. Embedded deal infrastructure (deal rooms/compliance)
5. Transparent economics and payouts

## Current Status (Reality-Based)
- Product/design surface: broad and mostly present
- Functional MVP: partial (core entities and flows exist, many advanced modules remain demo/static)
- Production readiness: early (security/compliance/provider integrations are incomplete)

For the current source-of-truth build tracker, see:
- `anavi/todo.md`

## Tech Stack
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- Backend: Express, tRPC v11
- Database: MySQL/TiDB via Drizzle ORM
- AI: Anthropic Claude integration
- Tooling: pnpm, Vitest, TypeScript

## Local Development
From the app directory:

```bash
cd anavi
pnpm install
pnpm dev
```

Build and run:

```bash
pnpm build
pnpm start
```

## Environment Variables
At minimum, configure these for realistic behavior:

- `DATABASE_URL` (required for DB-backed features)
- `JWT_SECRET`
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `BUILT_IN_FORGE_API_URL` (for storage proxy)
- `BUILT_IN_FORGE_API_KEY` (for storage proxy)
- `ANTHROPIC_API_KEY` (for Claude-backed AI endpoints)

## Deployment
This repo is configured for Vercel static frontend output from the app directory:
- Config file: `anavi/vercel.json`
- Output directory: `dist/public`

## Known Gaps
- Several advanced pages currently rely on static/demo data
- Compliance checks are not yet integrated with external providers
- Authz and audit guarantees are not yet production-hardened
- CI and integration test coverage are currently limited

## Documentation Notes
- Legacy optimistic task list is retained at `anavi/docs/todo_legacy_2026-02-15.md`
- Use `anavi/todo.md` for current delivery truth
