# Contributing

## Agent Guidance

AI agents: Read `AGENTS.md` (repo root) and `.cursor/rules/` for architecture, conventions, and the end-to-end feature checklist. For white paper terminology (Relationship Custody, Trust Score, Attribution, etc.) see `docs/white-paper-alignment.md`.

## Running Tests

```bash
pnpm test       # 37 tests: unit + integration
```

Includes unit tests (db, claude, auth) and integration tests (intent → match → deal room funnel). Tests use mocks; no database required.

## Type Check & Build

```bash
pnpm check   # TypeScript (tsc --noEmit)
pnpm build   # Client + server production build
```

## Adding a Feature

See `AGENTS.md` → "End-to-End Feature Checklist" for the full workflow: schema → db → router → page → route → sidebar → verify.
