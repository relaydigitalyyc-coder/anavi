# Frontend Flow Wiring Squad Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close high-impact frontend flow wiring gaps with product-informed execution across dashboard, deal room, and deal flow surfaces.

**Architecture:** Keep backend contracts unchanged and wire existing tRPC endpoints into page-level actions and telemetry modules. Apply ANAVI product contracts as hard acceptance criteria: every surfaced signal must map to a valid next action and every action must resolve to persisted state or an explicit blocked state.

**Tech Stack:** React, TypeScript, tRPC, Sonner toasts, Wouter routing.

---

## Product Context (Mandatory For All Engineers)

- Preserve ANAVI terminology and user intent chain:
  - `Relationship Custody`
  - `Trust Score`
  - `Blind Matching`
  - `Deal Room`
  - `Attribution`
  - `Intent`
- Respect R7/R8 integrity goals:
  - No decorative CTA that implies backend progress when no state transition occurs.
  - No static “live” metric when a live endpoint already exists.
  - If action cannot proceed, show explicit blocked/next-step UX.
- Route/layout constraints from `AGENTS.md` remain unchanged.

## Squad Setup

### Engineer A: Principal 24h Change Feed Wiring

**Ownership:** `client/src/pages/dashboard/PrincipalDashboard.tsx`

**Goal:** Replace demo-only “What Changed 24h” behavior with real audit/activity-derived events in live mode.

1. Add live queries for audit/activity sources (`trpc.audit.list`, related existing endpoints).
2. Derive 24h event cards and freshness from API timestamps.
3. Keep demo scenario behavior intact for demo mode.
4. Ensure risk tiles do not claim static values when live data exists.
5. Validate no regressions in principal dashboard render path.

### Engineer B: Deal Room DocuSign Action Wiring

**Ownership:** `client/src/pages/deal-room/DocumentsTab.tsx` (+ minimal helpers in `client/src/pages/DealRoom.tsx` only if required)

**Goal:** Ensure explicit, reusable DocuSign action controls for NDA lifecycle.

1. Keep existing `createNdaEnvelope`, `sendNdaEnvelope`, `getNdaSignUrl`, and fallback `signNda` flows.
2. Add envelope-level action buttons for:
   - Send (when envelope is draft/created).
   - Open signing session (when envelope is sent/delivered and signer is incomplete).
3. Refresh envelope/document/access state after each action.
4. Display clear status and blocked messaging for terminal envelope states.
5. Preserve NDA gating for document access.

### Engineer C: Deal Flow Signal/Action Truthfulness

**Ownership:** `client/src/pages/DealFlow.tsx`

**Goal:** Replace static Live Proof and inert action patterns with endpoint-backed values and valid transitions.

1. Wire `LiveProofStrip` values from `trpc.match.liveStats` in live mode (keep demo fixtures in demo mode).
2. Ensure action cards/buttons either execute real flows or route to concrete next steps.
3. Remove/label placeholder affordances that imply backend progression when unavailable.
4. Keep existing status-filter drill-through behavior intact.

### Engineer D: Integration + Documentation Guardrail

**Ownership:** planning/ops docs and integration pass
- `anavi/docs/plans/README.md`
- `anavi/docs/ops/TODO_BOARD.md`
- `anavi/docs/ops/ENGINEERING_MEMORY.md`

**Goal:** Keep plan registry and execution memory aligned with implemented wiring work.

1. Register this plan in plan registry.
2. Update TODO board status lines for completed wiring items.
3. Log dated execution evidence and verification commands in engineering memory.

## Verification Gate

Run from `anavi/`:

1. `pnpm check`
2. `pnpm test -- --runInBand` (or targeted tests when suite runtime is prohibitive; log exact command)
3. `pnpm build`

Acceptance:
- Primary frontend pages compile and render.
- New actions produce persistent state effects or explicit blocked-state UX.
- No wrapper/route regressions.
