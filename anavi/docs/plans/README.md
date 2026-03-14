# Plan Registry (`anavi/docs/plans`)

Global standards:
- `../../../docs/plans/PLAN_MANIFEST.md`
- `../../../docs/plans/NAMING_CONVENTIONS.md`

## Active / Current

### Feature PRDs
- `2026-02-28-persona-industry-architecture-design.md`
- `2026-02-28-persona-industry-implementation.md`
- `2026-03-02-prd-c1-dealmaker-command-center.md`
- `2026-03-02-prd-c2-owner-operator-execution.md`
- `2026-03-02-prd-c3-lp-reporting-investor-experience.md`
- `2026-03-02-prd-c1-c2-sprint-plan.md`
- `2026-03-02-prd-dashboard-master-rollout.md`
- `2026-03-02-prd-c4-dashboard-flow-elegance-system.md`
- `2026-03-02-prd-c4-persona-journey-flows.md`
- `2026-03-02-prd-c4-implementation-sprint-plan.md`

### Refactoring PRDs (R-series — codebase cleanup)
- `2026-03-03-prd-r1-dead-code-removal.md` — Delete 3,000+ lines of dead/unreachable code
- `2026-03-03-prd-r2-consolidation.md` — Merge 5 duplicate systems (demo, tour, animations, persona, constants)
- `2026-03-03-prd-r3-data-architecture.md` — Centralize scattered mock data, fix hardcoded values
- `2026-03-03-prd-r4-vercel-parity.md` — Fix missing routes in Vercel deployment, TS errors, security
- `2026-03-03-prd-r5-file-splitting.md` — Split 27 oversized files (5 over 1,000 lines)
- `2026-03-03-prd-r6-docs-and-config-hygiene.md` — Fix stale docs, rotate credentials, clean config
- `2026-03-04-prd-r7-platform-logic-consistency-and-flow-sync.md` — System-wide userflow/demo-flow consistency, contradiction removal, and synchronization hardening.
- `2026-03-04-prd-r7-advanced-flow-catalog.md` — Exhaustive advanced-flow matrix (`AF-*`) for exception/retry/reversal/conflict/recovery hardening.
- `2026-03-04-prd-r8-dashboard-logic-integrity.md` — Project-wide logical integrity hardening (dashboard-first, then full-core-surface coherence).

### Workflow / Tooling
- `2026-03-04-ralph-wiggum-autonomy-setup.md` — Install Ralph Wiggum autonomous spec loop tooling and constitution.
- `2026-03-05-animation-studio-dashboard-design.md` — Balanced-hybrid Remotion studio dashboard design with Trust Score render gating.
- `2026-03-05-animation-studio-dashboard-implementation-plan.md` — Execution plan for studio UI, router, tests, ops docs, skill packaging, investor presets, and asset-pack bundle export.
- `2026-03-05-platform-animation-studio-production-prd.md` — Production-readiness PRD for real animation output, job lifecycle integrity, asset-pack publishing, and Ralph loop completion criteria.
- `2026-03-07-vc-remotion-ad-cuts-implementation-batch` — Delivered three VC Remotion ad cuts (30s punch, 60s narrative, 90s mini IC) for ANAVI private markets messaging.
- `2026-03-07-vc-prompt-pack-refresh` — Prompt-driven rerender pass after clearing stale outputs; regenerated 30s/60s/90s VC cuts.
- `2026-03-07-vc-visual-intensity-pass` — Landing-motif animation pass (InteractiveGlobe + Evervault + ContainerScroll language) with rerendered VC cuts.
- `2026-03-14-frontend-flow-wiring-squad.md` — Product-informed parallel engineer plan for principal activity feed, DocuSign deal-room actions, and deal-flow signal/action wiring.

### Autonomous Development System
- `2026-03-13-autonomous-dev-system-design.md` — Architecture design for synthesizing Ralph spec system, DeepSeek swarm, AgenticSeek research, and ANAVI validation rules.
- `2026-03-13-autonomous-dev-system-implementation.md` — Complete 11-task implementation plan for layered orchestrator with wave patterns, agent dispatcher, PRD generator, and CLI.

## Superseded or Historical

- Older files in this folder remain for traceability.
- If you supersede a plan, append a line in this file noting the replacement.

## Implementation Linkage

- Keep this registry aligned with `../ops/TODO_BOARD.md`.
- Use `../ops/ENGINEERING_MEMORY.md` for dated execution logs.
