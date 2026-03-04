# R1 — Dead Code & Credential Cleanup

**Version:** 1.1
**Status:** Active
**Date:** 2026-03-03
**Context:** ANAVI is a demo skeleton pushing toward MVP. This cleanup removes things that actively hurt the demo or pose real security risks — not perfectionism.
**Estimated effort:** 1–2 hours

---

## Why This Matters for MVP

Dead code doesn't just add lines — it confuses every AI agent and human that touches the codebase. When Codex, Claude, or a new dev reads `claude-ai.ts` and `claude.ts` side by side, they don't know which one to use. When `services/matching.ts` imports a nonexistent file, it's a ticking crash. When API keys sit in config files, it's a liability if this repo is ever shared with investors or partners.

This PRD is scoped to things that **actively cause harm**. Cosmetic dead code (unused CSS classes, extra shadcn components) is fine for now.

---

## CRITICAL: Credential Cleanup (Do First)

| File | Issue | Action |
|------|-------|--------|
| `.claude/settings.local.json` | Plaintext `DEEPSEEK_API_KEY` in allowed commands | Remove key, use `$DEEPSEEK_API_KEY` reference. Add file to root `.gitignore`. |
| `testsprite_tests/tmp/config.json` | Proxy credentials committed | `git rm -r --cached anavi/testsprite_tests/tmp/`. Add to `.gitignore`. |
| `fireflies_data.txt` | Meeting transcripts in repo | Add to `.gitignore`. `git rm --cached`. |

---

## Files to Delete (Break Things or Confuse Agents)

| File | Lines | Why It Hurts |
|------|-------|-------------|
| `server/claude-ai.ts` | 404 | Duplicate of `claude.ts`. Agents pick the wrong one. Different env var (`CLAUDE_API_KEY` vs `ANTHROPIC_API_KEY`). |
| `server/services/matching.ts` | 46 | Imports `../db/pinecone` which **doesn't exist**. Will crash if anything touches it. |
| `server/services/polygon.ts` | 30 | Mock that returns random hashes. Not imported. Confuses "what's real." |
| `server/services/stripe.ts` | 26 | Mock. Not imported. Real Stripe init is `_core/stripe.ts`. |
| `server/webhooks/compliance.ts` | 56 | Not mounted. Hardcoded `mockUserId = 1`. |
| `server/webhooks/docusign.ts` | 31 | Not mounted. The real handler is in `_core/index.ts`. |
| `server/webhooks/stripe.ts` | 31 | Not mounted. The real handler is in `_core/index.ts`. |
| `client/src/components/ManusDialog.tsx` | 3 | Duplicate re-export (already in `AuthDialog.tsx`). |
| `client/src/pages/ComponentShowcase.tsx` | 1,439 | 1,400 lines of unrouted design system showcase. Biggest file in the project. Not in `App.tsx`. |

**Skip for now:** `_core/kyb.ts`, `_core/ofac.ts`, `_core/map.ts`, `_core/voiceTranscription.ts`, `_core/llmFactory.ts` — these are unreferenced but they're aspirational features that may get wired up later. They don't confuse agents because they're clearly infrastructure modules.

---

## Code to Fix (Active Bugs)

| File | Bug | Fix |
|------|-----|-----|
| `AddRelationshipModal.tsx:960-961` | `confirmationId` and `confirmationHash` regenerate on **every render** via `Math.random()` | Wrap in `useMemo(() => ..., [])` or compute in mutation `onSuccess` |
| `server/routers/stubs.ts` | Stub procedures shadow real routers (`spv`, `capital`, etc.) | Remove from `routers/index.ts` appRouter merge |
| `drizzle/relations.ts` | `matchesRelations` references `matches.userId` which doesn't exist (matches have `user1Id`/`user2Id`) | Fix the relation definition |

---

## Verification

```bash
cd anavi && pnpm build && pnpm test
rg "claude-ai|ManusDialog|ComponentShowcase|services/matching|services/polygon|webhooks/(compliance|docusign|stripe)" --type ts
```

---

## NOT in Scope

- Splitting large files (separate effort, not blocking MVP)
- Removing inline mock data (it IS the demo)
- Refactoring animation libraries (they work)
- Cleaning up docs (nice to have)
