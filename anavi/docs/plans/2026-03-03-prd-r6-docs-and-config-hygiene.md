# R6 — Docs & Config Hygiene

**Version:** 1.1
**Status:** Active
**Date:** 2026-03-03
**Context:** Demo skeleton → MVP. Fix things that cause agents and Codex to generate wrong code. Ignore cosmetic doc issues.
**Estimated effort:** 1 hour

---

## Why This Matters for MVP

`CLAUDE.md` says there are 25 routers — there are 40. It says the schema is at `drizzle/schema.ts` — that file doesn't exist. When AI agents (Claude, Codex, Gemini) read these docs, they generate code targeting the wrong files and wrong APIs. This wastes cycles on every single task.

---

## H1. Fix `CLAUDE.md` (Agents Read This Every Session)

| Field | Wrong | Correct |
|-------|-------|---------|
| Test count | "37 tests" | "60 tests" |
| Router count | "25 router files" | "40 router files" |
| DB module count | "16 domain DB files" | "31 DB files" |
| Schema path | `drizzle/schema.ts` | `drizzle/schema/*.ts` (6 modules) |
| Table count | "48 tables" | "~63 tables" |
| Route count | "39 routes" | "~47 routes" |

Also add `api/index.ts` to the key paths table — agents need to know this is the Vercel entry point.

---

## H2. Fix `CONTRIBUTING.md`

Update "37 tests" → "60 tests". That's the only stale line.

---

## H3. Sync Plan Registries

Add the 3 missing C4 plans to `PLAN_MANIFEST.md`. Add the R-series PRDs to both registries. (Already done in the previous commit — verify.)

---

## H4. Remove Irrelevant Agent Definitions

| Agent | Why Remove |
|-------|-----------|
| `go-reviewer.md` | No Go code in this project |
| `go-build-resolver.md` | No Go code |
| `python-reviewer.md` | Only Python is 2 utility scripts — doesn't need a code reviewer agent |

These agents confuse multi-agent orchestration tools that scan the agents directory to decide which specialist to invoke.

---

## H5. Fix `package.json`

- Move `@types/bcryptjs`, `@types/express`, `@types/d3` from `dependencies` to `devDependencies`
- Remove `"add": "^2.0.6"` from devDependencies (accidental)

---

## H6. Skip Everything Else

These are fine for a demo skeleton:
- `.gitignore` having unused framework ignores (harmless)
- `styling_notes.md` being undated (low impact)
- `docs/plans/` having 54 historical files (they're organized)
- `.claude/settings.local.json` having 128 commands (works as-is after credential removal in R1)
- Archive directories existing (reference material)

---

## Verification

After `CLAUDE.md` update, ask an AI agent: "How many routers does ANAVI have?" and "Where is the database schema?" — it should answer correctly.
