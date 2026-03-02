# Plan Naming Conventions

## Standard Format

Use:

`YYYY-MM-DD-<track>-<scope>-<artifact>.md`

Examples:
- `2026-03-02-prd-c1-dealmaker-command-center.md`
- `2026-03-02-prd-dashboard-master-rollout.md`
- `2026-03-03-impl-investor-reporting-pass.md`

## Allowed Artifact Suffixes

- `prd`
- `design`
- `plan`
- `impl`
- `rollout`
- `index`

## Track Tokens

- `platform`
- `persona`
- `dashboard`
- `compliance`
- `matching`
- `economics`
- `investor`
- `principal`

## Rules

- Date prefix is mandatory.
- Prefer lowercase kebab-case.
- Keep filename under ~90 chars.
- Use one primary track token; avoid stacking many abbreviations.
- If a plan supersedes an earlier one, add a supersession line in `PLAN_MANIFEST.md`.

## Template Header

Every new plan should start with:

```md
# <Title>

**Date:** <Month Day, Year>
**Owner:** Product + Engineering
**Status:** Draft | Active | Completed | Superseded
**Supersedes:** <optional file>
```
