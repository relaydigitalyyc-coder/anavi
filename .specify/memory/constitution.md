# ANAVI Constitution

> ANAVI is a private-market operating system focused on Relationship Custody, Trust Score, Blind Matching, Deal Room workflows, Attribution automation, and Intent-based execution.

## Version
1.0.0

## Ralph Wiggum Source

- Repo: `https://github.com/fstandhartinger/ralph-wiggum`
- Installed commit (HEAD at setup): `6022995317363dc3dba3aa0100dc3e40ed83dfff`

---

## Context Detection

**Ralph Loop Mode** (started by `scripts/ralph-loop*.sh`):
- Pick highest priority incomplete spec from `specs/`
- Implement, test, commit, push
- Output `<promise>DONE</promise>` only when 100% complete
- Output `<promise>ALL_DONE</promise>` when no work remains

**Interactive Mode** (normal conversation):
- Help with architecture, specification, and implementation guidance
- Keep ANAVI terminology and codebase constraints aligned

---

## Core Principles

1. **ANAVI Domain Fidelity First**
   - Use ANAVI-first concepts and naming: Relationship Custody, Trust Score, Blind Matching, Deal Room, Attribution, Intent.
   - Keep product behavior coherent with `docs/white-paper-alignment.md`.

2. **Spec-Driven, Verifiable Delivery**
   - Every implementation must map back to explicit acceptance criteria in `specs/`.
   - Never claim completion without tests/checks and criteria verification.

3. **Minimal, High-Leverage Changes**
   - Prefer surgical edits over broad rewrites.
   - Preserve unrelated working-tree changes.
   - Prioritize highest-leverage task first.

4. **Repository Conventions**
   - Product code in `anavi/`.
   - Validation commands run from `anavi/`: `pnpm check`, `pnpm test`, `pnpm build`.
   - Follow `AGENTS.md`/`CLAUDE.md` for path and architecture constraints.

---

## Technical Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- Backend: Node/Express + tRPC v11
- Database: Drizzle ORM with MySQL/TiDB
- Tooling: pnpm, Vitest, TypeScript

---

## Autonomy

YOLO Mode: ENABLED  
Git Autonomy: ENABLED

---

## Specs

Specs live in `specs/` as markdown files. Pick the highest priority incomplete spec (lower number = higher priority). A spec is incomplete if it lacks `## Status: COMPLETE`.

Spec template: `templates/spec-template.md`

When all specs are complete, re-verify a random completed spec before signaling done.

---

## NR_OF_TRIES

Track attempts per spec via `<!-- NR_OF_TRIES: N -->` at the bottom of the spec file. Increment each attempt. At 10+, split the spec into smaller specs.

Helper script: `scripts/lib/nr_of_tries.sh`

---

## History

Append a one-line summary to `history.md` after each spec completion. For details, create `history/YYYY-MM-DD--spec-name.md` with lessons learned, decisions made, and blockers encountered.

---

## Completion Signal

All acceptance criteria verified, tests pass, changes committed and pushed → output `<promise>DONE</promise>`. Never output this until truly complete.
