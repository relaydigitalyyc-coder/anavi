# F14: CI Gates — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** CI Gates  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.4

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [x] Implementation complete
- [ ] UI complete (N/A — CI only)
- [x] Verified (check, test, build pass)

---

## Implementation PRD

### Goal

GitHub Actions: `pnpm check` (tsc); `pnpm test`; `pnpm build`. Run on PR. Block merge on failure. Status badge. CI time <10min; cache deps; parallel jobs where possible.

### Architecture

`.github/workflows/ci.yml`. Jobs: lint/check, test, build. Require all pass for merge. Dependabot or manual dependency updates.

### Tech Stack

GitHub Actions, pnpm, Node.js

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/package.json` | Scripts: check, test, build |
| `.github/workflows/` | Existing workflows if any |
| `anavi/` | Monorepo or single app |

### Phase 1: Workflow

**Task 1 — Create CI workflow**  
- `.github/workflows/ci.yml`  
- On: push to main; pull_request  
- Jobs:  
  - `check`: `pnpm check` (or `npm run check`)  
  - `test`: `pnpm test`  
  - `build`: `pnpm build`  
- Node: 20 or 22  
- pnpm: `pnpm/action-setup`; cache `~/.pnpm-store`  

**Task 2 — Branch protection**  
- GitHub repo settings: Require status checks before merge  
- Require `check`, `test`, `build` to pass  
- (Manual config; document in PRD)  

**Task 3 — Status badge**  
- README: `![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)`  
- Update OWNER/REPO  

### Phase 2: Optimization

**Task 4 — Caching**  
- `pnpm store` cache key: `pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}`  
- Node modules cache  
- Target <10min  

**Task 5 — Parallelization**  
- Run check + test in parallel if independent  
- Build after both pass  
- Or: single job if simpler (still <10min)  

### Phase 3: Edge Cases

**Task 6 — Flaky tests**  
- Retry once on failure (optional)  
- Track flakiness; fix or quarantine  

**Task 7 — Env-dependent tests**  
- Mock external deps; no secrets in CI  
- Use `vitest` mocks for db, APIs  

### Dependency Map

```
Task 1 → Task 2, 3
Task 4, 5 (optimization)
Task 6, 7 (hardening)
```

### Verification

- [ ] Push triggers CI
- [ ] Failing check blocks merge
- [ ] Badge shows status

---

## UI PRD

### User Story

As an engineer, I want CI to block merges when typecheck/tests/build fail so we don't ship broken code.

### Entry Points

- GitHub PR: status checks visible  
- PR merge button: disabled until green  
- Repo README: badge  

### Component Specs

- No in-app UI. This is GitHub/CI only.  
- Badge: standard GitHub Actions badge.  
- PR checks: native GitHub UI.  

### Documentation

- Contributing.md: "All PRs must pass CI (check, test, build)."
- Document how to run locally: `pnpm check && pnpm test && pnpm build`

---

## File Index

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI workflow |
| `README.md` | Status badge |
| `CONTRIBUTING.md` | Document CI (optional) |
