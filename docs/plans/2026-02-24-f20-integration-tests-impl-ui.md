# F20: Integration Tests — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Integration Tests  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.6

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [x] Implementation complete (funnel tests, fixtures, setup)
- [ ] UI complete (N/A)
- [x] Verified (33 tests pass, CI runs)

---

## Implementation PRD

### Goal

Test: onboarding → identity → create intent → find matches → mutual interest → create deal room. Use test DB or mocks. Assert state transitions. Run in CI; <5min; isolated.

### Architecture

Vitest + test DB (or SQLite in-memory). Test fixtures: seed users, intents. tRPC caller with test context. E2E optionally with Playwright; focus on integration (API-level) first.

### Tech Stack

Vitest, Drizzle, test DB or mocks, optionally Playwright

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/server/anavi.test.ts` | Existing test pattern |
| `anavi/server/db.ts` | getDb; test DB URL from env |
| `anavi/package.json` | test script |
| `.github/workflows/ci.yml` | Run tests (F14) |

### Phase 1: Test Setup

**Task 1 — Test DB**  
- `DATABASE_URL_TEST` or `TEST_DB` env  
- Vitest setup: beforeAll create DB or use SQLite :memory:  
- Or: use main DB with `test_` prefix; truncate between runs  
- Isolation: each test file or each test gets clean state  

**Task 2 — Fixtures**  
- `fixtures/users.ts`: create test users (originator, investor)  
- `fixtures/intents.ts`: create test intents  
- `fixtures/relationships.ts`: create test relationships  
- Reusable; cleanup in afterEach/afterAll  

**Task 3 — Test context**  
- `createTestCaller(userId)` — tRPC caller with auth context  
- Simulate logged-in user  

### Phase 2: Funnel Tests

**Task 4 — Onboarding flow**  
- Create user; complete onboarding steps  
- Assert: onboardingCompleted = true; participantType set  
- Optional: hit onboarding endpoints if they exist  

**Task 5 — Intent → Match flow**  
- Create intent (buyer and seller)  
- Call match.findMatches or equivalent  
- Assert: match returned  
- Express mutual interest  
- Assert: match status updated  

**Task 6 — Deal room creation**  
- From match: create deal  
- Assert: deal_rooms row; participants added  
- Optional: add document, advance stage  

**Task 7 — Payout trigger**  
- Close deal; assert payout created (if F5 wired)  
- Or: assert milestone triggered  

### Phase 3: CI Integration

**Task 8 — CI config**  
- F14 CI: `pnpm test` already runs  
- Ensure integration tests in same run or separate job  
- Total <5min  
- Env: TEST_DB or similar  

**Task 9 — Flakiness**  
- No shared state between tests  
- Deterministic; no sleep() if avoidable  
- Retry flaky tests once (optional)  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4, 5, 6, 7 (flows)
Task 8 (CI)
Task 9 (hardening)
```

### Verification

- [ ] All integration tests pass
- [ ] CI runs them
- [ ] No flakiness in 10 consecutive runs

---

## UI PRD

### User Story

As an engineer, I want integration tests for the core funnel so we catch regressions.

### Entry Points

- None (this is engineering tooling)  
- CI runs tests automatically  

### Component Specs

- N/A  

### Documentation

- CONTRIBUTING.md: how to run integration tests locally  
- README: `pnpm test` includes integration tests  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/test/setup.ts` | DB setup, fixtures |
| `anavi/server/test/fixtures/*.ts` | Users, intents, etc. |
| `anavi/server/test/integration/funnel.test.ts` | Full funnel |
| `anavi/server/test/integration/payout.test.ts` | Payout flow |
| `vitest.config.ts` | Test DB, setup |
| `.github/workflows/ci.yml` | Run tests |
