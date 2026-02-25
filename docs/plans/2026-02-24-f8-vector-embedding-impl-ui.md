# F8: Vector Embedding Pipeline — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Vector Embedding Pipeline  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.3

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Embed intent text (title, description) via Claude or dedicated embedding model. Store in vector DB (Pgvector, Pinecone, or similar). Similarity search on new intents. Configurable threshold. Embedding latency <2s; index refresh on intent create/update; batch backfill.

### Architecture

Embedding service (OpenAI embeddings, Cohere, or Claude). Vector store. `intent_embeddings` table or external store. Pipeline: intent create/update → embed → upsert. `match.findMatches` uses vector path when available.

### Tech Stack

Drizzle ORM, tRPC v11, Pgvector or Pinecone, OpenAI/Cohere embedding API, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | `intents` table |
| `anavi/server/routers.ts` | `match.findMatches`, `intent.create` |
| `anavi/server/_core/llm.ts` | Claude; add embedding call or separate client |

### Phase 1: Embedding Pipeline

**Task 1 — Embedding client**  
- `anavi/server/embeddings.ts`  
- `embedText(text: string)` → float[]  
- Use OpenAI `text-embedding-3-small` or Cohere `embed-english-v3`  
- Truncate to model max tokens; handle empty/long text  
- TDD: mock API; assert vector length

**Task 2 — Vector store**  
- Option A: Pgvector in MySQL/TiDB — add vector column to `intents` or `intent_embeddings`  
- Option B: Pinecone — index: anavi-intents; namespace by userId; metadata: intentId  
- Upsert on intent create/update; delete on intent delete  
- Batch backfill script for existing intents

**Task 3 — Similarity search**  
- `findSimilarIntents(embedding, limit, threshold)`  
- Returns intent IDs + scores  
- Filter by user scope (blind matching: exclude own intents)

### Phase 2: Match Integration

**Task 4 — Wire into match flow**  
- `match.findMatches` or `match.semanticMatch`:  
  - If vector store available: embed query → similarity search → return candidates  
  - Fallback: existing keyword/LLM path  
- Configurable: use_vector (bool); threshold (float)

**Task 5 — Index refresh**  
- On `intent.create`, `intent.update`: async embed + upsert  
- Queue (Bull) or inline with timeout  
- Backfill: one-time migration for existing intents

### Phase 3: Edge Cases

**Task 6 — Empty descriptions**  
- Use title only; or skip embedding; mark intent as unindexed  
- Match fallback to keyword

**Task 7 — Non-English, long text**  
- Truncate; embedding models handle multilingual  
- Log if truncated for analytics

### Dependency Map

```
Task 1 → Task 2 → Task 3 → Task 4
Task 2 → Task 5
Task 6, 7 (handling)
```

### Verification

- [ ] New intent gets embedded and indexed
- [ ] Similarity search returns relevant intents
- [ ] Match flow uses vector when enabled

---

## UI PRD

### User Story

As a user, I want intent matching to use semantic similarity so I get better matches than keyword search.

### Entry Points

- Deal Matching page: matches now powered by vector (transparent)  
- Intent create/edit: no UI change; backend improves matching  
- Admin: "Vector index status" (optional)  

### Component Specs

- No new user-facing components; matching results improve.
- Optional: "Why this match?" — surface top contributing factors (semantic similarity score).
- Match card: add subtle "High similarity" badge when score > threshold.

### Design Tokens

- Similarity badge: `bg-[#22D4F5]/10 text-[#22D4F5]`
- Tooltip: "Matched by semantic similarity to your intent"

### Metrics (Backend)

- Match recall@k; embedding latency; index size

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/embeddings.ts` | Embedding client |
| `anavi/server/vector-store.ts` | Pinecone/Pgvector adapter |
| `anavi/server/db.ts` | intent embedding upsert |
| `anavi/server/routers.ts` | match.findMatches (vector path) |
| `anavi/scripts/backfill-embeddings.ts` | Backfill |
