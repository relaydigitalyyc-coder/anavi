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

For current execution tracking, see:
- `anavi/docs/ops/TODO_BOARD.md`
- `anavi/docs/ops/ENGINEERING_MEMORY.md`

## Tech Stack
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- Backend: Express, tRPC v11
- Database: MySQL/TiDB via Drizzle ORM
- AI: Anthropic Claude integration
- Tooling: pnpm, Vitest, TypeScript

## Quick Start (Fresh Clone)

Prerequisites: **Node.js >= 20** (20.19+ or 22.12+ recommended), **pnpm**

```bash
# Option A: activate pnpm via corepack
corepack enable
# If corepack fails with a key verification error (Node 20.18), use:
#   COREPACK_INTEGRITY_KEYS=0 corepack enable
# Option B: install pnpm directly
#   npm install -g pnpm

cd anavi
pnpm install
cp .env.example .env.local   # edit if you want DB/AI features
pnpm dev                 # starts Express + Vite HMR on http://localhost:3000
```

The default runtime mode is `demo` — no database or API keys required. All pages render with demo fixtures.

### Verify

```bash
pnpm check   # TypeScript type-check
pnpm test    # 67 tests (no DB required)
pnpm build   # production build
```

### Production

```bash
pnpm build
pnpm start   # serves from dist/ on port 3000
```

## Environment Variables
At minimum, configure these for realistic behavior:

- `DATABASE_URL` (required for DB-backed features)
- `APP_RUNTIME_MODE` (`demo`, `hybrid`, or `live`)
- `VITE_APP_RUNTIME_MODE` (optional frontend override; should normally match `APP_RUNTIME_MODE`)
- `JWT_SECRET`
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `OWNER_OPEN_ID`
- `BUILT_IN_FORGE_API_URL` (for storage proxy)
- `BUILT_IN_FORGE_API_KEY` (for storage proxy)
- `ANTHROPIC_API_KEY` (for Claude-backed AI endpoints)
- `DOCUSIGN_ENV` (`demo` or `prod`)
- `DOCUSIGN_INTEGRATION_KEY`
- `DOCUSIGN_ACCOUNT_ID`
- `DOCUSIGN_BASE_URI`
- `DOCUSIGN_IMPERSONATED_USER_ID`
- `DOCUSIGN_RSA_PRIVATE_KEY`
- `DOCUSIGN_CONNECT_HMAC_SECRET`
- `DOCUSIGN_EXECUTION_MODE` (`api` or `mcp`)
- `DOCUSIGN_MCP_URL` (for remote MCP server, e.g. `https://mcp-d.docusign.com/mcp`)
- `DOCUSIGN_MCP_CLIENT_ID` (DocuSign Integration Key)
- `DOCUSIGN_MCP_CLIENT_SECRET` (DocuSign Secret Key)
- `DOCUSIGN_OAUTH_CLIENT_SECRET` (for Authorization Code Grant)
- `DOCUSIGN_OAUTH_REDIRECT_URI` (e.g. `http://localhost:3000/api/integrations/docusign/oauth/callback`)

Runtime mode semantics:
- `demo`: synthetic auth + demo fixtures enabled.
- `hybrid`: prelaunch behavior (synthetic fallback in non-production; demo fixtures enabled).
- `live`: no synthetic auth and no demo fixtures; auth redirect required.

## Deployment
This repo is configured for Vercel static frontend output from the app directory:
- Config file: `anavi/vercel.json`
- Output directory: `dist/public`

## Ralph Wiggum (Autonomous Spec Loop)

This repository is set up for Ralph Wiggum loop execution at the repo root.

- Constitution: `.specify/memory/constitution.md`
- Specs folder: `specs/`
- Loop scripts: `scripts/ralph-loop.sh`, `scripts/ralph-loop-codex.sh`, `scripts/ralph-loop-gemini.sh`, `scripts/ralph-loop-copilot.sh`
- Command helpers: `.claude/commands/ralph-loop.md`, `.cursor/commands/speckit.specify.md`, `.cursor/commands/speckit.implement.md`

Run from repository root:

```bash
./scripts/ralph-loop-codex.sh
./scripts/ralph-loop.sh
```

Codex loop defaults to Collaboration **Plan mode** (plan-first execution).  
Override when needed:

```bash
./scripts/ralph-loop-codex.sh --collab-mode default
./scripts/ralph-loop-codex.sh --collab-mode plan
```

## Known Gaps
- Several advanced pages currently rely on static/demo data
- Compliance checks are not yet integrated with external providers
- Authz and audit guarantees are not yet production-hardened
- CI and integration test coverage are currently limited

## Documentation Notes
- Top-level docs index: `docs/README.md`
- App docs index: `anavi/docs/README.md`
- Legacy checklist retained at `anavi/docs/todo_legacy_2026-02-15.md`
