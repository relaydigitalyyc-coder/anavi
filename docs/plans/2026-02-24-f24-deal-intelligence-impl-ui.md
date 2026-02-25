# F24: Deal Intelligence Pipeline — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Deal Intelligence Pipeline  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.7  
**Overlap:** PRD-4 AI Deal Intelligence (deal memo, counterparty brief, red flags)

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Pipeline: ingest Fireflies transcripts or similar; extract entities, deals, relationships; populate Knowledge Graph; surface in Deal Intelligence page. Async processing; idempotent; privacy (user-scoped).

### Architecture

Ingestion worker: fetch transcripts (or other sources); parse; extract entities via Claude. Knowledge Graph tables: entities, relationships, source_refs. `dealIntelligence.analyze` or batch job. Deal Intelligence page: query KG; display graph + insights. User-scoped: only user's data.

### Tech Stack

Drizzle ORM, tRPC v11, Claude API, queue (Bull or inline), Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | enrichment_jobs; add kg tables if needed |
| PRD-4 | AI procedures, deal memo, etc. |
| `anavi/server/_core/llm.ts` | Claude |
| Fireflies or similar | API for transcripts (optional) |

### Phase 1: Knowledge Graph Schema

**Task 1 — KG tables**  
- `kg_entities`: id, userId, type (person/company/deal), name, metadata (JSON), sourceRef, createdAt  
- `kg_relationships`: id, fromEntityId, toEntityId, type, metadata, sourceRef, createdAt  
- `kg_sources`: id, userId, type (transcript, document), externalId, rawRef, processedAt  
- Index: userId, type  
- TDD: schema test  

**Task 2 — Entity extraction**  
- `extractEntitiesFromText(text, userId)` — call Claude with prompt: extract people, companies, deals, relationships  
- Return structured JSON  
- Idempotent: hash of text → skip if already processed  

**Task 3 — Ingestion job**  
- `ingestTranscript(sourceId, transcriptUrlOrText)`  
- Fetch transcript (if URL); extract entities  
- Upsert entities, relationships; link to source  
- Queue or cron  

### Phase 2: Deal Intelligence API

**Task 4 — dealIntelligence procedures**  
- `dealIntelligence.getGraph(userId)` — entities + relationships for user  
- `dealIntelligence.getInsights(userId)` — AI summary of graph (optional)  
- `dealIntelligence.analyze(documentId)` — extract from document; add to KG  
- Scope: user's data only  

**Task 5 — Data source integration**  
- Fireflies API: fetch transcripts (OAuth or API key)  
- Or: manual upload of transcript text  
- Webhook: new transcript → queue ingestion  
- Config: which sources enabled  

### Phase 3: Deal Intelligence Page

**Task 6 — Deal Intelligence page**  
- /deal-intelligence route  
- Graph visualization: nodes (entities), edges (relationships)  
- Library: Cytoscape, vis.js, or React Flow  
- Or: list view of entities + relationships  
- Filters: type, date range  

**Task 7 — Insights block**  
- AI-generated summary: "You have N entities, M relationships. Key themes: ..."  
- Refresh button  
- Cache 1h  

### Phase 4: Edge Cases

**Task 8 — Duplicates**  
- Merge similar entities (fuzzy match name + type)  
- Or: display with "possible duplicate" flag  

**Task 9 — Low quality**  
- Confidence score on extraction  
- Filter low-confidence in UI  
- Log for improvement  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4 → Task 5
Task 6 → Task 7
Task 8, 9 (handling)
```

### Verification

- [ ] Transcript ingestion adds entities
- [ ] Graph displays
- [ ] User-scoped only
- [ ] Async job completes

---

## UI PRD

### User Story

As a user, I want deal intelligence extracted from my data so I get AI insights.

### Entry Points

- Nav: "Deal Intelligence"  
- Documents: "Analyze for intelligence" action  
- Onboarding: "Connect Fireflies" (if integrated)  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `KnowledgeGraph` | Graph viz: nodes, edges | loading, rendered, empty |
| `EntityCard` | Node popover: name, type, links | — |
| `InsightsBlock` | AI summary | loading, text, empty |
| `DataSourceManager` | Connect Fireflies, upload transcript | — |

### Design Tokens

- Graph: dark background; nodes color by type (person=blue, company=gold, deal=green)  
- Edges: subtle line  
- Card: `card-elevated`  
- Empty: "Connect a data source or upload a transcript to build your knowledge graph."  

### Empty States

- No data: "No intelligence yet. Connect Fireflies or upload a transcript."  
- No insights: "Run analysis to generate insights."  

### Trust Signals

- "Extracted from your data"  
- Source attribution: "From [transcript name]"  
- Privacy: "Only visible to you"  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/drizzle/schema.ts` | kg_entities, kg_relationships, kg_sources |
| `anavi/server/kg-extraction.ts` | Claude extraction |
| `anavi/server/kg-ingestion.ts` | Ingest job |
| `anavi/server/routers.ts` | dealIntelligence router |
| `anavi/client/src/pages/DealIntelligence.tsx` | Page |
| `anavi/client/src/components/KnowledgeGraph.tsx` | Graph viz |
| `anavi/client/src/components/InsightsBlock.tsx` | — |
| `anavi/server/jobs/ingest-transcripts.ts` | Worker |
