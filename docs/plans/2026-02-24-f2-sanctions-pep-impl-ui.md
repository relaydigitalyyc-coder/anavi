# F2: Real Sanctions/PEP/Adverse-Media Integrations — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Real Sanctions/PEP/Adverse-Media Integrations  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.1

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Integrate Refinitiv World-Check, ComplyAdvantage, or equivalent. Screen users on registration and periodic refresh. Store results in `compliance_checks`. Block or flag per policy.

### Architecture

External provider REST API. `compliance.runCheck` mutation. Background job for periodic refresh. Policy engine (block vs flag). `compliance_checks` table.

### Tech Stack

Drizzle ORM, tRPC v11, ComplyAdvantage/Refinitiv API, Node cron or Bull, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | `complianceChecks` table exists |
| `anavi/server/routers.ts` | `complianceRouter.runCheck` (currently 2s simulated) — replace with real call |
| `anavi/server/_core/env.ts` | Add `COMPLY_ADVANTAGE_API_KEY` or equivalent |

### Phase 1: Provider Integration

**Task 1 — Provider client module**  
- `anavi/server/compliance-provider.ts`  
- `runSanctionsCheck(userId, name, dob?, country?)` → provider API call  
- Parse response; map to pass/warn/block  
- TDD: mock provider; assert response shape

**Task 2 — Store results**  
- Insert/update `compliance_checks` with provider ref, result, raw response (redacted if needed)  
- Update `users.sanctionsCleared`, `pepStatus`, `adverseMediaCleared`  
- `users.complianceLastChecked`

**Task 3 — Policy engine**  
- Config: block on high-risk; flag on medium; allow low  
- `compliance.evaluate(userId)` → block | flag | allow  
- Block: prevent login/registration; Flag: show banner, restrict features

### Phase 2: Registration + Periodic Refresh

**Task 4 — Registration hook**  
- On user create: async `runSanctionsCheck` (or queue)  
- If block: reject registration with generic message  
- If flag: allow but set flag; notify admin

**Task 5 — Periodic refresh job**  
- Nightly: all active users; batch mode if provider supports  
- Update `compliance_checks`, `users.complianceLastChecked`  
- Alert on newly blocked users

### Phase 3: Admin Visibility

**Task 6 — Admin compliance dashboard**  
- `compliance.listChecks(filters)` — paginated  
- Show: user, result, date, provider ref  
- Export CSV for audit

### Dependency Map

```
Task 1 → Task 2 → Task 3 → Task 4
Task 2 → Task 5
Task 2 → Task 6
```

### Verification

- [ ] Real provider call (or sandbox) returns expected shape
- [ ] Block policy prevents login
- [ ] Nightly job runs; complianceLastChecked updates

---

## UI PRD

### User Story

As the platform, I want to screen users against sanctions/PEP/adverse media so we comply and reduce fraud.

### Entry Points

- Registration: blocking message if check fails (no sensitive detail)  
- User profile (admin): compliance status badge  
- Compliance dashboard: queue of checks, filters, export  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `ComplianceStatusBadge` | Cleared / Flagged / Blocked | — |
| `ComplianceCheckTable` | Admin list | loading, rows, empty |
| `BlockedUserBanner` | Registration block message | — |

### Design Tokens

- **Cleared:** `bg-[#059669]/15 text-[#059669]`
- **Flagged:** `bg-[#F59E0B]/15 text-[#F59E0B]`
- **Blocked:** `bg-red-500/15 text-red-600`
- Block message: neutral, no provider detail ("Unable to complete registration. Contact support.")

### Empty States

- No checks: "No compliance checks yet. Checks run on registration and nightly."

### Security / Privacy

- Never expose provider raw response to non-admin
- Admin-only routes; audit log access

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/compliance-provider.ts` | Provider client |
| `anavi/server/db.ts` | complianceChecks CRUD |
| `anavi/server/routers.ts` | compliance.runCheck (real) |
| `anavi/server/jobs/compliance-refresh.ts` | Nightly job |
| `anavi/client/src/pages/ComplianceDashboard.tsx` | Admin (optional) |
