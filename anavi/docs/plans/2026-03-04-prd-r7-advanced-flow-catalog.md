# PRD R7 — Exhaustive Advanced Flow Catalog

Date: 2026-03-04  
Owner: Engineering  
Status: Active

## Purpose

Define the canonical, exhaustive advanced-flow checklist for ANAVI R7.  
All items here are considered mandatory consistency scope for:

- Relationship Custody
- Trust Score
- Blind Matching
- Deal Room
- Attribution
- Intent

If a flow is discovered that is not listed, it must be immediately added as a new `AF-*` item before implementation proceeds.

## Completion Rule

R7 cannot be marked complete until every applicable `AF-*` flow is either:

- implemented and verified, or
- explicitly marked not-applicable with evidence.

## Flow Matrix (Exhaustive)

Legend:
- `[ ]` unresolved
- `[~]` in progress
- `[x]` resolved

---

## A. Runtime Mode + Access Boundaries

- [ ] AF-001 — `live` mode blocks demo fixture bootstrapping at app init.
- [ ] AF-002 — `live` mode blocks `/demo` route with explicit deterministic UX.
- [ ] AF-003 — `hybrid` mode permits demo only when capability flag is true.
- [ ] AF-004 — `demo` mode bypass behavior never leaks into protected live routes.
- [ ] AF-005 — runtime mode switch preserves current route safety guarantees.
- [ ] AF-006 — unauthorized protected-route access redirects deterministically in `live`.
- [ ] AF-007 — protected-route access in non-live modes follows documented fallback only.
- [ ] AF-008 — direct deep-link entry respects runtime mode guard logic.
- [ ] AF-009 — runtime mode is visible from `system.runtime` and matches frontend assumptions.
- [ ] AF-010 — runtime env parsing rejects invalid mode with explicit fallback.
- [ ] AF-011 — synthetic user context cannot activate in production live mode.
- [ ] AF-012 — logout/login transitions never re-enable stale demo allowances.

## B. Authentication + Session Advanced Paths

- [ ] AF-013 — session expiry during mutation returns canonical re-auth + retry semantics.
- [ ] AF-014 — expired session during route transition avoids ambiguous partial render.
- [ ] AF-015 — token refresh failure yields deterministic forced-auth flow.
- [ ] AF-016 — concurrent tabs auth change reconciles without contradictory UI state.
- [ ] AF-017 — invalid session cookie cannot bootstrap protected data fetch.
- [ ] AF-018 — unauthorized API response taxonomy is consistent across routers.
- [ ] AF-019 — post-auth redirect returns to intended safe destination route.
- [ ] AF-020 — onboarding-required users are gated before full app shell access.
- [ ] AF-021 — onboarding completion updates downstream persona assumptions deterministically.
- [ ] AF-022 — auth recovery flow (`forgot-password`) does not leak mode-specific paradoxes.

## C. Persona + Navigation Advanced Paths

- [ ] AF-023 — invalid stored persona value migrates to canonical fallback.
- [ ] AF-024 — persona switch preserves route legality and wrapper semantics.
- [ ] AF-025 — persona switch updates nav, tool rails, and contextual CTAs coherently.
- [ ] AF-026 — legacy persona aliases map deterministically to canonical personas.
- [ ] AF-027 — persona-biased dashboards preserve Trust Score narrative consistency.
- [ ] AF-028 — persona-specific action visibility respects capability constraints.
- [ ] AF-029 — deep links into persona pages do not bypass persona gating assumptions.
- [ ] AF-030 — nav ordering persistence cannot produce unreachable page combinations.
- [ ] AF-031 — page copy remains ANAVI-first when persona changes.
- [ ] AF-032 — persona context remains synchronized with demo scenario context.

## D. Demo Experience + Scenario Advanced Paths

- [ ] AF-033 — canonical demo context is single-source for active demo pages.
- [ ] AF-034 — non-canonical demo model access is adapter-backed or retired.
- [ ] AF-035 — persona select in demo maps to canonical app persona rail.
- [ ] AF-036 — guided tour step-page mapping is deterministic for all personas.
- [ ] AF-037 — scenario switch (`baseline/momentum/closing`) updates all affected stats coherently.
- [ ] AF-038 — scenario switch while on deep page maintains stable component contracts.
- [ ] AF-039 — demo notifications mirror expected lifecycle semantics.
- [ ] AF-040 — demo Trust Score representation aligns with verification narrative.
- [ ] AF-041 — demo CTA outcomes map to canonical lifecycle labels.
- [ ] AF-042 — demo Deal Room interaction preserves NDA/access state consistency.
- [ ] AF-043 — demo-disabled runtime shows explicit non-ambiguous messaging.
- [ ] AF-044 — demo data contract remains shape-compatible with live tRPC consumers.

## E. Match + Intent Lifecycle Advanced Paths

- [ ] AF-045 — duplicate `expressInterest` requests are idempotent and auditable.
- [ ] AF-046 — stale-status `expressInterest` returns deterministic conflict response.
- [ ] AF-047 — `createDealRoom` requires canonical precondition (`mutual_interest`) always.
- [ ] AF-048 — `createDealRoom` race condition cannot produce duplicate active rooms.
- [ ] AF-049 — `queueNda` on invalid status is rejected with canonical reason taxonomy.
- [ ] AF-050 — `queueNda` repeat calls are idempotent and state-safe.
- [ ] AF-051 — `escalate` transition always emits aligned status + notification + audit.
- [ ] AF-052 — escalation reversal path (if supported) follows explicit invariants.
- [ ] AF-053 — declined/superseded match is excluded consistently from actionable queues.
- [ ] AF-054 — match list chips reflect true backend enum status with no alias drift.
- [ ] AF-055 — intent withdrawal updates dependent match opportunities coherently.
- [ ] AF-056 — intent edits propagate to matching and recommendation surfaces deterministically.
- [ ] AF-057 — blind-match unsealing event requires explicit mutual milestone semantics.
- [ ] AF-058 — contradictory parallel actions resolve via canonical transition precedence.
- [ ] AF-059 — multi-actor conflicting actions emit superseded event taxonomy.
- [ ] AF-060 — match lifecycle tests cover negative/retry/conflict transitions.

## F. Deal Room Governance + Access Advanced Paths

- [ ] AF-061 — Deal Room access grant validates both counterparties deterministically.
- [ ] AF-062 — access revocation immediately gates documents and actions.
- [ ] AF-063 — revoked user deep-link to room shows canonical blocked UX.
- [ ] AF-064 — room state changes propagate to list and detail views consistently.
- [ ] AF-065 — compliance hold blocks restricted Deal Room actions.
- [ ] AF-066 — compliance release restores only permitted transitions.
- [ ] AF-067 — room close/archive path prevents further mutation actions.
- [ ] AF-068 — room reopen path (if supported) revalidates prerequisites.
- [ ] AF-069 — room document visibility respects NDA signature state.
- [ ] AF-070 — room timeline order remains deterministic under concurrent events.
- [ ] AF-071 — room participants list aligns with permission model.
- [ ] AF-072 — blocked action UX explains hold/restriction reason and next step.
- [ ] AF-073 — room-level attribution visibility matches custody and consent rules.
- [ ] AF-074 — room-level Trust Score cues remain coherent across role views.
- [ ] AF-075 — room action retries preserve idempotency and audit continuity.
- [ ] AF-076 — Deal Room advanced-state tests validate hold/release/revoke flows.

## G. NDA + DocuSign Advanced Paths

- [ ] AF-077 — NDA envelope creation failure is surfaced with canonical retry path.
- [ ] AF-078 — envelope send failure preserves local pending state safely.
- [ ] AF-079 — duplicate send requests are idempotent and non-destructive.
- [ ] AF-080 — webhook signature verification failure is logged and safely rejected.
- [ ] AF-081 — webhook idempotency key prevents duplicate state transitions.
- [ ] AF-082 — out-of-order webhook events resolve to canonical final status.
- [ ] AF-083 — signer view URL generation failure has deterministic fallback UX.
- [ ] AF-084 — completed envelope consistently unlocks NDA-gated documents.
- [ ] AF-085 — voided envelope re-locks dependent gated actions where required.
- [ ] AF-086 — Connect delivery failure supports replay-safe recovery.
- [ ] AF-087 — JWT auth failure for provider produces explicit operator diagnostics.
- [ ] AF-088 — missing DocuSign env vars fail fast with actionable config feedback.
- [ ] AF-089 — provider timeout enters degraded mode with retry hooks.
- [ ] AF-090 — local status labels map 1:1 with provider lifecycle states.
- [ ] AF-091 — NDA action events emit notification + audit taxonomy consistently.
- [ ] AF-092 — DocuSign integration tests cover send/complete/void/retry/error paths.

## H. Compliance + Risk Advanced Paths

- [ ] AF-093 — verification downgrade updates Trust Score narratives coherently.
- [ ] AF-094 — verification upgrade re-enables gated actions deterministically.
- [ ] AF-095 — sanctions/compliance fail state blocks prohibited transitions.
- [ ] AF-096 — compliance override action is audit-required and role-restricted.
- [ ] AF-097 — compliance state propagates across dashboard and detail surfaces.
- [ ] AF-098 — risk flags include clear reason taxonomy and resolution pathway.
- [ ] AF-099 — conflicting compliance/risk signals resolve by canonical precedence rules.
- [ ] AF-100 — compliance release recomputes dependent CTA enablement.

## I. Notification + Audit Advanced Paths

- [ ] AF-101 — every state-changing mutation emits one canonical audit action name.
- [ ] AF-102 — every user-visible lifecycle transition emits notification where policy requires.
- [ ] AF-103 — notification type taxonomy is stable and documented.
- [ ] AF-104 — audit action taxonomy is stable and documented.
- [ ] AF-105 — duplicate event emission is idempotently deduplicated.
- [ ] AF-106 — notification delivery failure retains replay-safe retry semantics.
- [ ] AF-107 — notification ordering for same entity is deterministic by timestamp/version.
- [ ] AF-108 — audit events include actor, target, previous state, next state.
- [ ] AF-109 — superseded/conflict outcomes emit explicit machine-readable reason.
- [ ] AF-110 — cross-router lifecycle events use consistent entity identifiers.
- [ ] AF-111 — read/unread notification toggles never mutate source lifecycle truth.
- [ ] AF-112 — notification UI labels map directly to canonical backend event types.
- [ ] AF-113 — audit and notification streams reconcile without missing transitions.
- [ ] AF-114 — notification/audit integration tests include conflict and retry paths.

## J. Attribution + Payout Advanced Paths

- [ ] AF-115 — attribution trigger creation is idempotent for same qualifying event.
- [ ] AF-116 — attribution recalculation after reversal produces deterministic outputs.
- [ ] AF-117 — payout schedule updates when upstream lifecycle state changes.
- [ ] AF-118 — payout hold on compliance state is enforced consistently.
- [ ] AF-119 — payout release after compliance resolution recomputes correctly.
- [ ] AF-120 — payout cancellation path emits canonical reversal/audit events.
- [ ] AF-121 — payout retries on transient provider failure are idempotent.
- [ ] AF-122 — attribution ledger entries remain immutable with corrective append model.
- [ ] AF-123 — partial payout states are represented consistently across UI/API.
- [ ] AF-124 — payout status chips map 1:1 to backend enums.
- [ ] AF-125 — trust/verification changes affecting payout eligibility are propagated.
- [ ] AF-126 — attribution and payout totals reconcile after backfill/recompute.
- [ ] AF-127 — payout notification taxonomy aligns with settlement lifecycle.
- [ ] AF-128 — attribution/payout integration tests cover hold/release/reversal/retry.

## K. Data Consistency + Concurrency Advanced Paths

- [ ] AF-129 — optimistic UI updates reconcile correctly on server reject.
- [ ] AF-130 — optimistic success messaging never persists when mutation fails.
- [ ] AF-131 — concurrent mutations on same entity resolve by canonical version semantics.
- [ ] AF-132 — stale query cache invalidation is complete after status transitions.
- [ ] AF-133 — cross-page views converge to same state after event propagation.
- [ ] AF-134 — pagination/filter views remain consistent after lifecycle changes.
- [ ] AF-135 — websocket/poll fallback (if used) does not create contradictory states.
- [ ] AF-136 — duplicate records from retries are deduplicated by stable keys.
- [ ] AF-137 — database uniqueness constraints align with intended idempotency.
- [ ] AF-138 — transaction boundaries prevent partial lifecycle writes.
- [ ] AF-139 — background jobs cannot regress entity status to older states.
- [ ] AF-140 — data repair scripts preserve attribution/audit integrity.

## L. Degradation + Recovery Advanced Paths

- [ ] AF-141 — external dependency outage enters explicit degraded mode.
- [ ] AF-142 — degraded mode disables unsafe actions with explanatory UX.
- [ ] AF-143 — degraded mode allows safe read-only continuity where possible.
- [ ] AF-144 — retry backoff strategy is deterministic and observable.
- [ ] AF-145 — circuit-breaker behavior (if used) avoids rapid failure thrash.
- [ ] AF-146 — recovery from outage restores canonical state synchronization.
- [ ] AF-147 — replay/reconciliation jobs repair missed webhook/event windows.
- [ ] AF-148 — degradation banners/messages stay consistent across pages.
- [ ] AF-149 — operator diagnostics expose failing subsystem + recommended action.
- [ ] AF-150 — degraded/recovered transitions emit auditable platform events.

## M. Reporting + Export + Operator Flows

- [ ] AF-151 — investor export actions reflect true source-of-truth data state.
- [ ] AF-152 — publish/report actions fail gracefully with deterministic retry options.
- [ ] AF-153 — export generation does not bypass permission constraints.
- [ ] AF-154 — large export timeout/retry semantics preserve idempotent job identity.
- [ ] AF-155 — report status tracking is consistent between list and detail pages.
- [ ] AF-156 — generated reporting artifacts include consistent Trust Score/Attribution semantics.
- [ ] AF-157 — operator retry/requeue flows are role-gated and audited.
- [ ] AF-158 — operator manual override actions include reason capture and traceability.

## N. Security + Permission Edge Paths

- [ ] AF-159 — unauthorized role cannot trigger restricted lifecycle transitions.
- [ ] AF-160 — permission downgrade immediately removes restricted action access.
- [ ] AF-161 — permission upgrade requires refresh synchronization with route/action guards.
- [ ] AF-162 — direct API calls without UI path are still policy-enforced.
- [ ] AF-163 — cross-tenant/resource access attempts are rejected and audited.
- [ ] AF-164 — hidden UI action is also blocked server-side (no security by obscurity).
- [ ] AF-165 — policy mismatch between client assumptions and server truth is eliminated.
- [ ] AF-166 — protected file/document download checks enforce identity + role + consent.
- [ ] AF-167 — sensitive error details are redacted in user-facing messages.
- [ ] AF-168 — security-critical transitions have explicit monitoring hooks.

## O. Validation + Test Evidence Flows

- [ ] AF-169 — route-wrapper inventory test captures all active route declarations.
- [ ] AF-170 — runtime capability matrix tests cover demo/hybrid/live boundaries.
- [ ] AF-171 — persona mapping tests cover legacy alias migration.
- [ ] AF-172 — demo contract tests cover canonical fixture shape guarantees.
- [ ] AF-173 — lifecycle transition tests include invalid and conflict transitions.
- [ ] AF-174 — Deal Room governance tests include hold/release/revoke states.
- [ ] AF-175 — NDA/DocuSign tests include out-of-order webhook and retry paths.
- [ ] AF-176 — notification/audit consistency tests verify event parity.
- [ ] AF-177 — attribution/payout tests include recompute and reversal integrity.
- [ ] AF-178 — regression suite evidence is linked in engineering memory after each major batch.

## P. Documentation + Memory Synchronization Flows

- [ ] AF-179 — spec file remains synchronized with latest contradiction register.
- [ ] AF-180 — PRD backlog reflects resolved/in-progress/pending advanced flows.
- [ ] AF-181 — TODO board Next Up stays focused on highest-leverage unresolved `AF-*` items.
- [ ] AF-182 — engineering memory captures dated advanced-flow resolution deltas.
- [ ] AF-183 — Obsidian mission note mirrors canonical repo state after substantive batches.
- [ ] AF-184 — superseded assumptions are archived with forward links, not deleted.
- [ ] AF-185 — completion claims include explicit reference to validated `AF-*` coverage.

---

## Execution Requirement for Ralph Passes

Every Ralph pass must:

1. Resolve at least one unresolved high-leverage `AF-*` item or cluster.
2. Record evidence (files, commands, tests, behavior delta).
3. Update contradiction register and sync docs/memory.
4. Continue until no unresolved critical `AF-*` remains.

