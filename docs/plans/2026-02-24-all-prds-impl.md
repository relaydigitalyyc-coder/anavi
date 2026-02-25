# ANAVI 23 PRDs — Master Implementation Plan

> **For Claude:** Use superpowers:executing-plans or subagent-driven-development. Implement in dependency order. Update checkboxes in index + individual PRDs when complete.

**Goal:** Intelligent, elegant implementation of all 22 remaining PRDs (F4 excluded, F14 done).

**Execution order:** Foundation → Audit → Infrastructure → Domain features (parallel where independent).

---

## Phase 1: Foundation (Security & Audit)

| Order | PRD | Rationale |
|-------|-----|-----------|
| 1 | **F12** Route-Level Auth | Protects all routes; no dependencies; high leverage |
| 2 | **F13** Immutable Audit Trail | Foundation for F22; hash chain, schema migration |
| 3 | **F22** Audit Logs Backend | Depends on F13; wires real data to existing AuditLogs page |

---

## Phase 2: Infrastructure

| Order | PRD | Rationale |
|-------|-----|-----------|
| 4 | **F20** Integration Tests | Validates funnel; CI already runs (F14) |

---

## Phase 3: Domain Features (Batch by Domain)

| Batch | PRDs | Domain |
|-------|------|--------|
| A | F1, F2, F3 | Identity (KYB, sanctions, trust score) |
| B | F5, F6, F7 | Custody (attribution, proofs, statements) |
| C | F8, F9, F10 | Matching (embeddings, notifications, LP portal) |
| D | F11 | Deal Flow (e-signature) |
| E | F15, F16, F17 | Activation (search, tour, intelligence) |
| F | F18 | UX (mobile dashboard) |
| G | F19, F21 | Operations (escrow, observability) |
| H | F23, F24 | Polish (real estate, deal intelligence) |

---

## Dependency Map

```
F12 ──────────────────────────────────────── (no deps)
F13 ────────────────────┬─────────────────── (no deps)
                        └──► F22
F20 ──────────────────────────────────────── (uses F14 CI)
F1,F2,F3 | F5,F6,F7 | F8,F9,F10 | F11 | F15,F16,F17 | F18 | F19,F21 | F23,F24
         (mostly independent; check PRD cross-refs)
```

---

## File Landmarks

| Area | Path |
|------|------|
| tRPC / auth | `anavi/server/_core/trpc.ts`, `anavi/server/routers.ts` |
| Client auth | `anavi/client/src/_core/hooks/useAuth.ts` |
| Routes | `anavi/client/src/App.tsx` |
| Schema | `anavi/drizzle/schema.ts` |
| Audit | `anavi/server/db.ts` (logAuditEvent, getAuditLog) |
| Index | `docs/plans/2026-02-24-23-improvements-index.md` |

---

## Per-PRD Plan References

Each PRD has its own implementation + UI plan: `docs/plans/2026-02-24-f{N}-{name}-impl-ui.md`.
