# AGENTS.md

Operating guide for AI/code agents in this repository.

## Scope and Canonical Paths

- Product application code lives in `anavi/`.
- Strategic + historical planning docs live in `docs/`.
- App-local implementation plans live in `anavi/docs/plans/`.
- Active execution memory and TODO tracking live in `anavi/docs/ops/`.

If something appears duplicated between `docs/` and `anavi/docs/`, prefer:
- Strategy and PRD history: `docs/`
- Current implementation status for shipped code: `anavi/docs/`

## White Paper Terminology (required)

Use ANAVI-first language consistently:
- `Relationship Custody`
- `Trust Score`
- `Blind Matching`
- `Deal Room`
- `Attribution`
- `Intent`

Reference map: `docs/white-paper-alignment.md`.

## Where Changes Go

| Change | Path |
|---|---|
| Router endpoint | `anavi/server/routers/<domain>.ts` and index merge |
| DB operation | `anavi/server/db/<domain>.ts` |
| Schema updates | `anavi/drizzle/schema/*` |
| Pages | `anavi/client/src/pages/*.tsx` |
| Components | `anavi/client/src/components/*` |
| Shared copy/tokens | `anavi/client/src/lib/copy.ts` |
| Demo fixtures | `anavi/client/src/lib/demoFixtures.ts` |
| Dashboard nav | `anavi/client/src/components/DashboardLayout.tsx` |
| App routes | `anavi/client/src/App.tsx` |

## Runtime Wrapping Rules

- Use `ShellRoute` for standard authenticated app pages.
- Use `ProtectedPage` for full-screen gated flows.
- Do not mount `DashboardLayout` inside page components.

## Validation Commands

Run from `anavi/`:

```bash
pnpm check
pnpm test
pnpm build
```

Minimum merge gate: `pnpm check` clean.

## Documentation Hygiene Rules

When implementing features:
- Add or update PRD/plan references in `anavi/docs/plans/README.md`.
- Update execution memory in `anavi/docs/ops/ENGINEERING_MEMORY.md`.
- Update work queue in `anavi/docs/ops/TODO_BOARD.md`.
- If a legacy todo is superseded, mark it as archival and link forward.

Do not delete historical plans unless explicitly requested.

## Todo + Memory Workflow

After each substantive implementation batch:
1. Append a dated entry in `anavi/docs/ops/ENGINEERING_MEMORY.md`.
2. Move completed tasks in `anavi/docs/ops/TODO_BOARD.md` to `Done`.
3. Keep `Next Up` limited to highest-leverage tasks.
4. Ensure `todo.md` points to the canonical board.

## Sidebar and Persona Notes

- Persona-exclusive tools are defined in `DashboardLayout.tsx`.
- Persona ordering preferences are localStorage-driven.
- Demo persona, industry, and scenario state are in `anavi/client/src/contexts/DemoContext.tsx`.

## Safety and Refactoring Expectations

- Avoid destructive git commands.
- Preserve unrelated working tree edits.
- Prefer additive organization (indexes, docs, ops boards) over moving large file trees unless asked.
