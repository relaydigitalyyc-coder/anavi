# Ralph Wiggum Autonomy Setup (Repository Tooling)

Date: 2026-03-04
Owner: Platform Engineering
Status: Complete

## Goal

Install Ralph Wiggum autonomous loop tooling in this repository so spec-driven execution can run consistently with ANAVI architecture constraints and terminology (Relationship Custody, Trust Score, Blind Matching, Deal Room, Attribution, Intent).

## Scope

- Install Ralph loop scripts at repository root.
- Establish `.specify/memory/constitution.md` as loop source-of-truth.
- Add command helpers for Claude/Cursor workflows.
- Preserve existing `AGENTS.md` and `CLAUDE.md` conventions while linking Ralph mode.

## Implementation Summary

1. Added loop runners:
   - `scripts/ralph-loop.sh`
   - `scripts/ralph-loop-codex.sh`
   - `scripts/ralph-loop-gemini.sh`
   - `scripts/ralph-loop-copilot.sh`
2. Added Ralph support libs under `scripts/lib/`.
3. Added templates used by spec commands under `templates/`.
4. Added command helpers:
   - `.claude/commands/ralph-loop.md`
   - `.cursor/commands/speckit.specify.md`
   - `.cursor/commands/speckit.implement.md`
5. Added constitution and baseline spec/history scaffolding:
   - `.specify/memory/constitution.md`
   - `specs/README.md`
   - `history.md`
6. Updated root `AGENTS.md`, `CLAUDE.md`, and `README.md` for discoverability.

## Verification

- Scripts are executable (`chmod +x scripts/ralph-loop*.sh scripts/lib/*.sh`).
- `bash -n` checks pass for Ralph scripts.
- `./scripts/ralph-loop-codex.sh --help` renders expected usage.

## Follow-Up

- Add first numbered spec under `specs/` for highest-leverage backlog item.
- Optionally tune constitution autonomy settings if stricter human approval is needed.
