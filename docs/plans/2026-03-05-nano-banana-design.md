# Nano Banana 2 design

## Goal
- provide a deterministic Gemini asset stub generator keyed by `intentTag` and observable timestamp so tests can assert fixed outputs while keeping ligand placeholder metadata pluggable.

## Data flow
1. `anavi/data/ai-assets.json` stores placeholder metadata entries indexed by `intentTag`. Each entry includes ready values for `prompt`, `assetId`, `intentTag`, `geminiVersion`, `attribution`, and `trustScore`.
2. `generateGeminiAsset` looks up the requested intent and combines ledger data with the current timestamp (default `Date.now()`) to produce `createdAt`. The ledger entry is returned as-is unless the intent is missing, in which case an error is thrown.
3. Additional fields (e.g., `trustScore`) remain ledger-driven, so switching to real Gemini data later only requires updating the JSON file or migrating to a real store.

## Testing strategy
- a vitest file exercises `generateGeminiAsset` with a mocked `Date.now` so it observes a fixed `createdAt` while still ensuring `trustScore`, `prompt`, and other fields match the ledger.
- The first test is intentionally failing (no implementation) to keep with TDD, then replaced by the actual behavior once the ledger and script are implemented.

## Next steps
- Implement the generator hook referencing the ledger and ensuring deterministic outputs.
- Add ledger stub entry in `anavi/data/ai-assets.json` with placeholder values for `intentTag` used in tests.
- Author the vitest suite that runs `pnpm vitest tests/nano-banana.test.ts -t generateGeminiAsset` with an expectation that fails until the implementation exists.
