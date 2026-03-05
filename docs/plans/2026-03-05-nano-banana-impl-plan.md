# Nano Banana 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide a deterministic Gemini asset stub generator that serves placeholder metadata keyed by `intentTag` and a ledger file.

**Architecture:** `generateGeminiAsset` loads the intent-ledger from `anavi/data/ai-assets.json`, validates the requested intent, and mirrors the stored fields while stamping `createdAt` with `Date.now()` to keep tests reproducible. The test suite resides in `anavi/tests/nano-banana.test.ts` and validates the ledger alignment via vitest.

**Tech Stack:** TypeScript (Node scripts under `anavi/scripts`), JSON ledger, `pnpm vitest` for tests.

---

### Task 1: Write failing vitest for `generateGeminiAsset`

**Files:**
- Create: `anavi/tests/nano-banana.test.ts`

**Step 1: Write the failing test**
```ts
import { describe, it, expect } from 'vitest';
import { generateGeminiAsset } from '../scripts/nano-banana';

describe('generateGeminiAsset', () => {
  it('returns the ledger entry for a known intent with deterministic createdAt', async () => {
    const asset = await generateGeminiAsset({ intentTag: 'demo-intent' });
    expect(asset.intentTag).toBe('demo-intent');
    expect(asset.prompt).toBe('placeholder prompt');
    expect(asset.createdAt).toBe('2026-03-05T10:00:00.000Z');
    expect(asset.assetId).toBe('demo-asset-1');
  });
});
```
(The `createdAt` value will match the mocked `Date.now()` once implementation exists.)

**Step 2: Run it to verify failure**
- Run: `pnpm vitest tests/nano-banana.test.ts -t generateGeminiAsset`
- Expected: `generateGeminiAsset` throws `Error('generateGeminiAsset not implemented yet')`, so vitest reports failure.

**Step 3: Observe the failure message**
- Capture the error output for the report/log requested later.

### Task 2: Seed the intent ledger

**Files:**
- Modify: `anavi/data/ai-assets.json`

**Step 1: Add a deterministic stub**
```json
"demo-intent": {
  "assetId": "demo-asset-1",
  "prompt": "placeholder prompt",
  "intentTag": "demo-intent",
  "geminiVersion": "2.0",
  "attribution": "Nano Banana 2",
  "trustScore": 0.75
}
```
Ensure the JSON file remains valid by inserting/composing within the top-level object (or creating the object if empty).

**Step 2: Save the ledger for subsequent script lookups.**

### Task 3: Implement `generateGeminiAsset`

**Files:**
- Modify: `anavi/scripts/nano-banana.ts`

**Step 1: Load the ledger once**
```ts
import fs from 'node:fs';
const resolver = new URL('../data/ai-assets.json', import.meta.url);
const ledger: Record<string, Omit<GeminiAssetMetadata, 'createdAt'>> = JSON.parse(
  fs.readFileSync(resolver, 'utf8')
);
```

**Step 2: Implement the function**
```ts
export async function generateGeminiAsset({ intentTag }: GenerateGeminiAssetParams): Promise<GeminiAssetMetadata> {
  const entry = ledger[intentTag];
  if (!entry) throw new Error(`Intent ${intentTag} not found`);
  return {
    ...entry,
    createdAt: new Date(Date.now()).toISOString(),
  };
}
```

**Step 3: Keep placeholder metadata intact and deterministic when `Date.now()` is mocked in tests.

### Task 4: Re-run the targeted test and confirm success

**Step 1: Run** `pnpm vitest tests/nano-banana.test.ts -t generateGeminiAsset`
- Expect: PASS after implementation.

**Step 2: Note command output** to report as requested.

### Task 5: (Optional) Document the change log

**Files:**
- Modify: `anavi/docs/ops/ENGINEERING_MEMORY.md` (if practical) to note the Nano Banana 2 stub addition.
- Step: Append a dated entry describing the deterministic ledger + test addition.

---

Plan complete and saved to `docs/plans/2026-03-05-nano-banana-impl-plan.md`. Two execution options:

1. Subagent-Driven (this session) – continue here with superpowers:subagent-driven-development.
2. Parallel Session (new worktree) – spawn a new session using superpowers:executing-plans.

Which approach do you prefer?
