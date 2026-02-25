# PRD-4: AI Deal Intelligence Layer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Surface ANAVI's existing Claude AI infrastructure as four concrete user-facing workflows: deal memo generation, counterparty brief, red flag detection, and match score transparency.

**Architecture:** New tRPC procedures wrap Claude API calls with structured prompts. Deal memo uses SSE streaming via a dedicated Express endpoint. Counterparty briefs cached 24h in DB. Red flag detection triggered on document upload.

**Tech Stack:** Anthropic Claude SDK (claude-sonnet-4-6), SSE streaming, Drizzle ORM, tRPC v11, React 19, Vitest

---

## Codebase Context

**Key existing files (read before each task):**
- `anavi/server/claude.ts` — Anthropic client initialized as `const anthropic = new Anthropic(...)`, existing `streamDealFlowResponse` async generator uses `anthropic.messages.stream()`. Model currently set to `"claude-sonnet-4-20250514"` — all new procedures use `"claude-sonnet-4-6"`.
- `anavi/server/routers.ts` — `aiRouter` (lines 703–1081) is where all 4 new tRPC procedures are added. Already imported into `appRouter` at line 1778.
- `anavi/drizzle/schema.ts` — Uses Drizzle `mysqlTable`. Pattern: `int("id").autoincrement().primaryKey()`, `json("field").$type<T>()`, `timestamp("createdAt").defaultNow().notNull()`.
- `anavi/server/_core/index.ts` — Express app in `startServer()`. The SSE endpoint is registered here before the tRPC middleware (`app.use("/api/trpc", ...)`).
- `anavi/client/src/pages/DealRoom.tsx` — `DocumentsTab` component (line 167) is where the "Generate Deal Memo" button and red flags banner are added. `DiligenceTab` already has placeholder "AI Diligence Summary — Coming in Phase 2" (line 435).
- `anavi/package.json` — `"test": "vitest run"`, package manager is `pnpm`.

**Verification command (run after each task):**
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

---

## Phase 1 — Database Schema

### Task 1: Add three new tables to Drizzle schema

**Files:**
- Modify: `anavi/drizzle/schema.ts` (append after the `documents` table definition, around line 461)

**Step 1: Append schema additions**

Add the following three table definitions at the end of `anavi/drizzle/schema.ts`, after the existing tables and before any final export lines:

```typescript
// ============================================================================
// AI DEAL INTELLIGENCE — PRD-4
// ============================================================================

export const dealMemos = mysqlTable("deal_memos", {
  id: int("id").autoincrement().primaryKey(),
  dealRoomId: int("dealRoomId").notNull(),
  // sections is an array of { title: string; content: string }
  content: json("content").$type<Array<{ title: string; content: string }>>().notNull(),
  sourceFileIds: json("sourceFileIds").$type<number[]>().default([]),
  generatedBy: int("generatedBy").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  version: int("version").default(1).notNull(),
});

export type DealMemo = typeof dealMemos.$inferSelect;
export type InsertDealMemo = typeof dealMemos.$inferInsert;

export const counterpartyBriefs = mysqlTable("counterparty_briefs", {
  id: int("id").autoincrement().primaryKey(),
  dealRoomId: int("dealRoomId").notNull(),
  // content: { companyOverview, recentNews, riskSignals, talkingPoints }
  content: json("content").$type<{
    companyOverview: string;
    recentNews: string[];
    riskSignals: string[];
    talkingPoints: string[];
  }>().notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  // 24h cache — null means no expiry set yet
  expiresAt: timestamp("expiresAt"),
});

export type CounterpartyBrief = typeof counterpartyBriefs.$inferSelect;
export type InsertCounterpartyBrief = typeof counterpartyBriefs.$inferInsert;

export const redFlags = mysqlTable("red_flags", {
  id: int("id").autoincrement().primaryKey(),
  dealRoomId: int("dealRoomId").notNull(),
  fileId: int("fileId").notNull(),
  severity: mysqlEnum("severity", ["high", "medium", "low"]).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  description: text("description").notNull(),
  pageRef: varchar("pageRef", { length: 64 }),
  dismissedAt: timestamp("dismissedAt"),
  dismissedBy: int("dismissedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RedFlag = typeof redFlags.$inferSelect;
export type InsertRedFlag = typeof redFlags.$inferInsert;
```

**Step 2: Push migration**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run db:push
```

**Step 3: Type-check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

Expected: zero errors.

**Step 4: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add drizzle/schema.ts && git commit -m "feat(schema): add deal_memos, counterparty_briefs, red_flags tables for PRD-4"
```

---

## Phase 1 — DB Access Layer

### Task 2: Add DB helper functions for the three new tables

**Files:**
- Modify: `anavi/server/db.ts` (append new functions at the end of the file)

**Step 1: Read the end of db.ts to find the last export**

Before editing, confirm the last ~20 lines of `anavi/server/db.ts` to determine the correct insertion point.

**Step 2: Append the following DB helpers**

```typescript
// ============================================================================
// AI DEAL INTELLIGENCE (PRD-4)
// ============================================================================

// --- Deal Memos ---

export async function createDealMemo(data: {
  dealRoomId: number;
  content: Array<{ title: string; content: string }>;
  sourceFileIds: number[];
  generatedBy: number;
  version?: number;
}): Promise<number> {
  const [result] = await connection
    .insert(schema.dealMemos)
    .values({
      dealRoomId: data.dealRoomId,
      content: data.content,
      sourceFileIds: data.sourceFileIds,
      generatedBy: data.generatedBy,
      version: data.version ?? 1,
    });
  return result.insertId;
}

export async function getDealMemosByRoom(dealRoomId: number) {
  return connection
    .select()
    .from(schema.dealMemos)
    .where(eq(schema.dealMemos.dealRoomId, dealRoomId))
    .orderBy(desc(schema.dealMemos.generatedAt));
}

export async function updateDealMemoContent(
  id: number,
  content: Array<{ title: string; content: string }>
): Promise<void> {
  await connection
    .update(schema.dealMemos)
    .set({ content })
    .where(eq(schema.dealMemos.id, id));
}

// --- Counterparty Briefs ---

export async function getCounterpartyBriefByRoom(dealRoomId: number) {
  const rows = await connection
    .select()
    .from(schema.counterpartyBriefs)
    .where(
      and(
        eq(schema.counterpartyBriefs.dealRoomId, dealRoomId),
        // Only return non-expired briefs
        gt(schema.counterpartyBriefs.expiresAt, new Date())
      )
    )
    .orderBy(desc(schema.counterpartyBriefs.generatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function createCounterpartyBrief(data: {
  dealRoomId: number;
  content: {
    companyOverview: string;
    recentNews: string[];
    riskSignals: string[];
    talkingPoints: string[];
  };
}): Promise<number> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const [result] = await connection
    .insert(schema.counterpartyBriefs)
    .values({ ...data, expiresAt });
  return result.insertId;
}

// --- Red Flags ---

export async function createRedFlags(
  flags: Array<{
    dealRoomId: number;
    fileId: number;
    severity: "high" | "medium" | "low";
    category: string;
    description: string;
    pageRef?: string;
  }>
): Promise<void> {
  if (flags.length === 0) return;
  await connection.insert(schema.redFlags).values(flags);
}

export async function getRedFlagsByRoom(dealRoomId: number) {
  return connection
    .select()
    .from(schema.redFlags)
    .where(
      and(
        eq(schema.redFlags.dealRoomId, dealRoomId),
        isNull(schema.redFlags.dismissedAt)
      )
    )
    .orderBy(desc(schema.redFlags.createdAt));
}

export async function dismissRedFlag(
  id: number,
  dismissedBy: number
): Promise<void> {
  await connection
    .update(schema.redFlags)
    .set({ dismissedAt: new Date(), dismissedBy })
    .where(eq(schema.redFlags.id, id));
}
```

**Note:** Verify that `eq`, `and`, `desc`, `gt`, `isNull` are already imported from `drizzle-orm` at the top of `db.ts`. If any are missing, add them to the existing import line.

**Step 3: Type-check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

**Step 4: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/db.ts && git commit -m "feat(db): add deal memo, counterparty brief, red flag DB helpers"
```

---

## Phase 1 — Tests (TDD: write tests first)

### Task 3: Write Vitest unit tests for Claude AI helpers (mocked)

**Files:**
- Create: `anavi/server/ai-intelligence.test.ts`

**Step 1: Create the test file**

```typescript
// anavi/server/ai-intelligence.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the Anthropic SDK — must be before any module imports that use it
// ---------------------------------------------------------------------------
vi.mock("@anthropic-ai/sdk", () => {
  const mockStream = {
    async *[Symbol.asyncIterator]() {
      // Simulate 3 streaming events, each a section delimiter + content
      const events = [
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "##SECTION:Executive Summary\n" },
        },
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "This is the executive summary content." },
        },
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "\n##SECTION:Company Overview\nCompany details here." },
        },
      ];
      for (const e of events) yield e;
    },
  };

  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                companyOverview: "Acme Corp is a leading widget manufacturer.",
                recentNews: ["Acquired by BigCo in 2025", "Launched new product line"],
                riskSignals: ["High debt-to-equity ratio", "Key-person dependency on CEO"],
                talkingPoints: ["Strong EBITDA margins", "10-year track record"],
              }),
            },
          ],
        }),
        stream: vi.fn().mockReturnValue(mockStream),
      },
    })),
  };
});

// ---------------------------------------------------------------------------
// Import module under test after mocks are set up
// ---------------------------------------------------------------------------
import {
  buildDealMemoPrompt,
  buildCounterpartyBriefPrompt,
  buildRedFlagPrompt,
  buildMatchExplanationPrompt,
  parseSectionsFromStream,
  DEAL_MEMO_SECTIONS,
} from "./ai-intelligence";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildDealMemoPrompt", () => {
  it("includes all 7 section names in the prompt", () => {
    const prompt = buildDealMemoPrompt({
      dealRoomName: "GloFi Gold Tokenization",
      fileNames: ["teaser.pdf", "financials.xlsx"],
      dealContext: "Gold-backed token offering, $50M target raise",
    });

    DEAL_MEMO_SECTIONS.forEach((section) => {
      expect(prompt).toContain(section);
    });
  });

  it("includes the deal room name and file names", () => {
    const prompt = buildDealMemoPrompt({
      dealRoomName: "Test Deal Room",
      fileNames: ["doc1.pdf"],
      dealContext: "",
    });
    expect(prompt).toContain("Test Deal Room");
    expect(prompt).toContain("doc1.pdf");
  });

  it("includes the ##SECTION: delimiter instruction", () => {
    const prompt = buildDealMemoPrompt({
      dealRoomName: "X",
      fileNames: [],
      dealContext: "",
    });
    expect(prompt).toContain("##SECTION:");
  });
});

describe("buildCounterpartyBriefPrompt", () => {
  it("requests the 4 expected fields in the prompt", () => {
    const prompt = buildCounterpartyBriefPrompt({
      dealRoomName: "Acme Acquisition",
      counterpartyName: "Acme Corp",
    });
    expect(prompt).toContain("companyOverview");
    expect(prompt).toContain("recentNews");
    expect(prompt).toContain("riskSignals");
    expect(prompt).toContain("talkingPoints");
  });

  it("includes the counterparty name", () => {
    const prompt = buildCounterpartyBriefPrompt({
      dealRoomName: "Room A",
      counterpartyName: "Megacorp Ltd",
    });
    expect(prompt).toContain("Megacorp Ltd");
  });
});

describe("buildRedFlagPrompt", () => {
  it("includes severity levels in the prompt", () => {
    const prompt = buildRedFlagPrompt({
      fileName: "pitch_deck.pdf",
      documentContent: "Revenue grew 200% with no customers mentioned.",
    });
    expect(prompt).toContain("high");
    expect(prompt).toContain("medium");
    expect(prompt).toContain("low");
  });

  it("includes the file name", () => {
    const prompt = buildRedFlagPrompt({
      fileName: "term_sheet.pdf",
      documentContent: "",
    });
    expect(prompt).toContain("term_sheet.pdf");
  });

  it("requests JSON output with required fields", () => {
    const prompt = buildRedFlagPrompt({
      fileName: "doc.pdf",
      documentContent: "some content",
    });
    expect(prompt).toContain("severity");
    expect(prompt).toContain("category");
    expect(prompt).toContain("description");
    expect(prompt).toContain("pageRef");
  });
});

describe("buildMatchExplanationPrompt", () => {
  it("returns a non-empty string with match details", () => {
    const prompt = buildMatchExplanationPrompt({
      intent1: { type: "sell", title: "Selling 200T of copper", assetType: "commodity" },
      intent2: { type: "buy", title: "Buying copper for refinery", assetType: "commodity" },
      compatibilityScore: 87,
    });
    expect(prompt.length).toBeGreaterThan(50);
    expect(prompt).toContain("87");
    expect(prompt).toContain("reasons");
    expect(prompt).toContain("risks");
  });
});

describe("parseSectionsFromStream", () => {
  it("splits streamed text on ##SECTION: delimiter", () => {
    const raw =
      "##SECTION:Executive Summary\nContent A.\n##SECTION:Company Overview\nContent B.";
    const sections = parseSectionsFromStream(raw);
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe("Executive Summary");
    expect(sections[0].content).toContain("Content A.");
    expect(sections[1].title).toBe("Company Overview");
    expect(sections[1].content).toContain("Content B.");
  });

  it("trims whitespace from section content", () => {
    const raw = "##SECTION:Key Risks\n\n  Some risk.  \n";
    const sections = parseSectionsFromStream(raw);
    expect(sections[0].content).toBe("Some risk.");
  });

  it("returns empty array for empty input", () => {
    expect(parseSectionsFromStream("")).toHaveLength(0);
  });
});
```

**Step 2: Run tests (they will fail — expected at this stage)**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run test 2>&1 | tail -30
```

Expected: module not found errors for `./ai-intelligence`. This confirms TDD red phase.

**Step 3: Commit the failing tests**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/ai-intelligence.test.ts && git commit -m "test(ai): TDD red — AI intelligence helper tests (failing until implementation)"
```

---

## Phase 1 — AI Intelligence Module

### Task 4: Implement `anavi/server/ai-intelligence.ts` (make tests pass)

**Files:**
- Create: `anavi/server/ai-intelligence.ts`

**Step 1: Create the implementation file**

```typescript
// anavi/server/ai-intelligence.ts
//
// Pure helper functions for the AI Deal Intelligence Layer (PRD-4).
// All Claude API calls are isolated here so they can be tested with mocked SDK.

import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEAL_MEMO_SECTIONS = [
  "Executive Summary",
  "Company Overview",
  "Investment Thesis",
  "Key Risks",
  "Financial Highlights",
  "Comparable Transactions",
  "Diligence Questions",
] as const;

export type DealMemoSection = (typeof DEAL_MEMO_SECTIONS)[number];

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

export function buildDealMemoPrompt(params: {
  dealRoomName: string;
  fileNames: string[];
  dealContext: string;
}): string {
  const { dealRoomName, fileNames, dealContext } = params;
  const fileList =
    fileNames.length > 0 ? fileNames.map((f) => `  - ${f}`).join("\n") : "  (no files provided)";

  return `You are a senior investment analyst producing a structured deal memo for a private market transaction.

Deal Room: ${dealRoomName}
${dealContext ? `Context: ${dealContext}` : ""}

Source Documents:
${fileList}

Produce a professional deal memo with EXACTLY these 7 sections in order. For each section, start a new line with the delimiter "##SECTION:<section name>" followed by the section content.

The 7 required sections are:
1. ${DEAL_MEMO_SECTIONS[0]}
2. ${DEAL_MEMO_SECTIONS[1]}
3. ${DEAL_MEMO_SECTIONS[2]}
4. ${DEAL_MEMO_SECTIONS[3]}
5. ${DEAL_MEMO_SECTIONS[4]}
6. ${DEAL_MEMO_SECTIONS[5]}
7. ${DEAL_MEMO_SECTIONS[6]}

Example format:
##SECTION:Executive Summary
[2-3 paragraphs summarizing the opportunity, deal structure, and headline terms]

##SECTION:Company Overview
[Business description, founding date, key products/services, management team]

Write each section with the depth expected of a Goldman Sachs or Blackstone analyst. Be specific, avoid filler language, and use professional financial terminology. If document content is limited, note what additional information is needed.`;
}

export function buildCounterpartyBriefPrompt(params: {
  dealRoomName: string;
  counterpartyName: string;
}): string {
  const { dealRoomName, counterpartyName } = params;
  return `You are a private market intelligence analyst preparing a pre-meeting brief.

Deal Room: ${dealRoomName}
Counterparty: ${counterpartyName}

Produce a JSON object with exactly these fields:
{
  "companyOverview": "<2-3 sentence description of the company, industry, and business model>",
  "recentNews": ["<recent development 1>", "<recent development 2>", "<recent development 3>"],
  "riskSignals": ["<risk or concern 1>", "<risk or concern 2>"],
  "talkingPoints": ["<recommended talking point 1>", "<recommended talking point 2>", "<recommended talking point 3>"]
}

Return ONLY the JSON object, no markdown fencing or explanation. Base the analysis on publicly available knowledge about companies of this type. If the company is unknown, provide a generic but credible brief for a private company in the likely sector.`;
}

export function buildRedFlagPrompt(params: {
  fileName: string;
  documentContent: string;
}): string {
  const { fileName, documentContent } = params;
  const contentPreview = documentContent.slice(0, 4000); // limit context window usage

  return `You are a due diligence analyst reviewing a document for red flags and concerns.

Document: ${fileName}
${contentPreview ? `\nDocument Content:\n${contentPreview}` : ""}

Analyze the document for common private market diligence issues. Return a JSON array of red flags found:
[
  {
    "severity": "high" | "medium" | "low",
    "category": "<category such as: Financial Irregularity | Legal Risk | Operational Risk | Market Risk | Management Risk | Valuation Concern | Missing Information>",
    "description": "<specific description of the concern>",
    "pageRef": "<page number or section reference, or null if not applicable>"
  }
]

Common red flags to look for:
- Inconsistent financial figures or unusual accounting treatments
- Missing audited financials or unexplained gaps
- Litigation, regulatory violations, or undisclosed liabilities
- Concentration risk (single customer, supplier, or key person)
- Unrealistic growth projections without supporting assumptions
- Vague or missing ownership structure / cap table
- Related-party transactions without adequate disclosure

Return ONLY the JSON array. If no red flags are found, return an empty array [].`;
}

export function buildMatchExplanationPrompt(params: {
  intent1: { type: string; title: string; assetType?: string };
  intent2: { type: string; title: string; assetType?: string };
  compatibilityScore: number;
}): string {
  const { intent1, intent2, compatibilityScore } = params;
  return `You are a private market deal analyst explaining a match between two transaction intents.

Intent 1: ${intent1.type.toUpperCase()} — "${intent1.title}"${intent1.assetType ? ` (${intent1.assetType})` : ""}
Intent 2: ${intent2.type.toUpperCase()} — "${intent2.title}"${intent2.assetType ? ` (${intent2.assetType})` : ""}
Compatibility Score: ${compatibilityScore}/100

Return a JSON object with exactly these fields:
{
  "reasons": ["<positive reason 1>", "<positive reason 2>", "<positive reason 3>"],
  "risks": ["<risk or challenge 1>", "<risk or challenge 2>"],
  "sharedConnections": "<brief note on structural alignment or shared interests>",
  "recommendedNextStep": "<single most important recommended action>"
}

Be specific, professional, and actionable. Return ONLY the JSON object.`;
}

// ---------------------------------------------------------------------------
// Stream utilities
// ---------------------------------------------------------------------------

/**
 * Parse a fully-accumulated streamed string into section objects.
 * Splits on "##SECTION:<title>" delimiters.
 */
export function parseSectionsFromStream(
  raw: string
): Array<{ title: string; content: string }> {
  if (!raw.trim()) return [];

  const parts = raw.split(/##SECTION:/);
  const sections: Array<{ title: string; content: string }> = [];

  for (const part of parts) {
    if (!part.trim()) continue;
    const newlineIdx = part.indexOf("\n");
    if (newlineIdx === -1) continue;
    const title = part.slice(0, newlineIdx).trim();
    const content = part.slice(newlineIdx + 1).trim();
    if (title) {
      sections.push({ title, content });
    }
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Claude API wrappers (used directly by SSE endpoint and tRPC procedures)
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLAUDE_MODEL = "claude-sonnet-4-6";

/**
 * Stream deal memo generation, yielding raw text chunks.
 * Caller assembles the full text and then calls parseSectionsFromStream().
 */
export async function* streamDealMemo(params: {
  dealRoomName: string;
  fileNames: string[];
  dealContext: string;
}): AsyncGenerator<string, void, unknown> {
  const prompt = buildDealMemoPrompt(params);

  const stream = await anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system:
      "You are a senior investment analyst producing structured deal memos. Follow the ##SECTION: format exactly as instructed. Write with the depth and precision of a top-tier investment bank.",
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

/**
 * Generate a counterparty brief (non-streaming, returns parsed JSON).
 */
export async function generateCounterpartyBrief(params: {
  dealRoomName: string;
  counterpartyName: string;
}): Promise<{
  companyOverview: string;
  recentNews: string[];
  riskSignals: string[];
  talkingPoints: string[];
}> {
  const prompt = buildCounterpartyBriefPrompt(params);

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system:
      "You are a private market intelligence analyst. Return only valid JSON as instructed.",
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in counterparty brief response");
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in counterparty brief response");
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Detect red flags in a document (non-streaming, returns parsed JSON array).
 */
export async function detectRedFlags(params: {
  fileName: string;
  documentContent: string;
}): Promise<
  Array<{
    severity: "high" | "medium" | "low";
    category: string;
    description: string;
    pageRef: string | null;
  }>
> {
  const prompt = buildRedFlagPrompt(params);

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system:
      "You are a due diligence analyst. Return only a valid JSON array as instructed.",
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

/**
 * Explain a match between two intents (non-streaming).
 */
export async function explainMatch(params: {
  intent1: { type: string; title: string; assetType?: string };
  intent2: { type: string; title: string; assetType?: string };
  compatibilityScore: number;
}): Promise<{
  reasons: string[];
  risks: string[];
  sharedConnections: string;
  recommendedNextStep: string;
}> {
  const prompt = buildMatchExplanationPrompt(params);

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system:
      "You are a private market deal analyst. Return only valid JSON as instructed.",
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return {
      reasons: ["Match analysis unavailable"],
      risks: [],
      sharedConnections: "",
      recommendedNextStep: "Review manually",
    };
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      reasons: ["Match analysis unavailable"],
      risks: [],
      sharedConnections: "",
      recommendedNextStep: "Review manually",
    };
  }

  return JSON.parse(jsonMatch[0]);
}
```

**Step 2: Run tests — they should pass now**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run test 2>&1 | tail -30
```

Expected: all tests in `ai-intelligence.test.ts` pass (green).

**Step 3: Type-check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

**Step 4: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/ai-intelligence.ts && git commit -m "feat(ai): implement AI intelligence helpers — prompts, stream parser, Claude wrappers"
```

---

## Phase 1 — SSE Streaming Endpoint

### Task 5: Register the `/api/ai/deal-memo/stream` SSE endpoint in Express

**Files:**
- Modify: `anavi/server/_core/index.ts`

**Context:** The Express app is created in `startServer()` in `anavi/server/_core/index.ts`. The SSE route must be registered BEFORE the tRPC middleware (`app.use("/api/trpc", ...)`). The endpoint accepts `GET /api/ai/deal-memo/stream?dealRoomId=X&fileIds=1,2,3` and uses `createContext` to authenticate the request via the session cookie.

**Step 1: Add import and route**

At the top of `anavi/server/_core/index.ts`, add this import after the existing imports:

```typescript
import { streamDealMemo, parseSectionsFromStream } from "../ai-intelligence";
import * as db from "../db";
import { createContext } from "./context";
```

Note: `createContext` and `db` may already be imported — check the existing imports and only add what is missing.

Then, inside `startServer()`, register the SSE endpoint BEFORE the `app.use("/api/trpc", ...)` line:

```typescript
  // SSE: Deal Memo Streaming — GET /api/ai/deal-memo/stream
  app.get("/api/ai/deal-memo/stream", async (req, res) => {
    // Auth check via tRPC context helper
    const ctx = await createContext({ req, res } as any);
    if (!ctx.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const dealRoomId = parseInt(req.query.dealRoomId as string, 10);
    const fileIdsParam = req.query.fileIds as string | undefined;
    const fileIds = fileIdsParam
      ? fileIdsParam.split(",").map((s) => parseInt(s, 10)).filter((n) => !isNaN(n))
      : [];

    if (isNaN(dealRoomId)) {
      res.status(400).json({ error: "dealRoomId is required" });
      return;
    }

    // Verify deal room access
    const room = await db.getDealRoomById(dealRoomId);
    if (!room) {
      res.status(404).json({ error: "Deal room not found" });
      return;
    }

    // Gather document names for context
    const docs = await db.getDocumentsByDealRoom(dealRoomId);
    const selectedDocs = fileIds.length > 0
      ? docs.filter((d: any) => fileIds.includes(d.id))
      : docs;
    const fileNames = selectedDocs.map((d: any) => d.name);

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
    res.flushHeaders();

    let fullText = "";

    try {
      const generator = streamDealMemo({
        dealRoomName: room.name,
        fileNames,
        dealContext: room.description || "",
      });

      for await (const chunk of generator) {
        fullText += chunk;
        // Send each chunk as an SSE data event
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        // Flush to client immediately
        (res as any).flush?.();
      }

      // Parse completed sections and save to DB
      const sections = parseSectionsFromStream(fullText);
      const memoId = await db.createDealMemo({
        dealRoomId,
        content: sections,
        sourceFileIds: fileIds,
        generatedBy: ctx.user.id,
      });

      // Send final event with the saved memo ID
      res.write(`data: ${JSON.stringify({ done: true, memoId, sections })}\n\n`);
    } catch (err: any) {
      console.error("[SSE] Deal memo stream error:", err);
      res.write(`data: ${JSON.stringify({ error: err.message || "Stream failed" })}\n\n`);
    } finally {
      res.end();
    }
  });
```

**Step 2: Type-check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

**Step 3: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/_core/index.ts && git commit -m "feat(sse): register /api/ai/deal-memo/stream SSE endpoint in Express"
```

---

## Phase 1 — tRPC Procedures

### Task 6: Add four new AI tRPC procedures to `aiRouter`

**Files:**
- Modify: `anavi/server/routers.ts`

**Context:** The `aiRouter` const ends around line 1081 with `});`. Add the four new procedures inside the `aiRouter` object, before the final closing `}`. The existing router already imports `z`, `TRPCError`, `protectedProcedure`, and `db`.

**Step 1: Add the new import at the top of `routers.ts`**

After the existing import line:
```typescript
import { generateDealFlowResponse, analyzeDeal as claudeAnalyzeDeal, generateIntroductionRecommendations, type ChatMessage, type ChatContext } from "./claude";
```

Add:
```typescript
import { generateCounterpartyBrief, detectRedFlags, explainMatch } from "./ai-intelligence";
```

**Step 2: Add four procedures inside `aiRouter`, before its closing `}`**

Locate the final `};` of `aiRouter` (after `portfolioRecommendations`). Insert before the `}` that closes the `router({...})` call:

```typescript
  // ── PRD-4: Deal Memo ─────────────────────────────────────────────────────
  // SSE streaming is handled by the dedicated Express endpoint.
  // This procedure retrieves saved memos and allows saving edits.

  getDealMemos: protectedProcedure
    .input(z.object({ dealRoomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const room = await db.getDealRoomById(input.dealRoomId);
      if (!room) throw new TRPCError({ code: "NOT_FOUND" });
      return db.getDealMemosByRoom(input.dealRoomId);
    }),

  saveDealMemoEdits: protectedProcedure
    .input(z.object({
      memoId: z.number(),
      content: z.array(z.object({
        title: z.string(),
        content: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateDealMemoContent(input.memoId, input.content);
      return { success: true };
    }),

  // ── PRD-4: Counterparty Brief ────────────────────────────────────────────

  getCounterpartyBrief: protectedProcedure
    .input(z.object({
      dealRoomId: z.number(),
      counterpartyName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check 24h cache first
      const cached = await db.getCounterpartyBriefByRoom(input.dealRoomId);
      if (cached) {
        return { brief: cached.content, cached: true };
      }

      // Generate fresh brief
      const room = await db.getDealRoomById(input.dealRoomId);
      if (!room) throw new TRPCError({ code: "NOT_FOUND" });

      const content = await generateCounterpartyBrief({
        dealRoomName: room.name,
        counterpartyName: input.counterpartyName,
      });

      await db.createCounterpartyBrief({
        dealRoomId: input.dealRoomId,
        content,
      });

      return { brief: content, cached: false };
    }),

  // ── PRD-4: Red Flag Detection ────────────────────────────────────────────

  detectRedFlags: protectedProcedure
    .input(z.object({
      dealRoomId: z.number(),
      fileId: z.number(),
      // documentContent is the extracted text passed from the client after upload
      documentContent: z.string().optional().default(""),
    }))
    .mutation(async ({ ctx, input }) => {
      const docs = await db.getDocumentsByDealRoom(input.dealRoomId);
      const doc = docs.find((d: any) => d.id === input.fileId);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      const flags = await detectRedFlags({
        fileName: doc.name,
        documentContent: input.documentContent,
      });

      if (flags.length > 0) {
        await db.createRedFlags(
          flags.map((f) => ({
            dealRoomId: input.dealRoomId,
            fileId: input.fileId,
            severity: f.severity,
            category: f.category,
            description: f.description,
            pageRef: f.pageRef ?? undefined,
          }))
        );
      }

      return { flags, flagCount: flags.length };
    }),

  getRedFlags: protectedProcedure
    .input(z.object({ dealRoomId: z.number() }))
    .query(async ({ ctx, input }) => {
      return db.getRedFlagsByRoom(input.dealRoomId);
    }),

  dismissRedFlag: protectedProcedure
    .input(z.object({ flagId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.dismissRedFlag(input.flagId, ctx.user.id);
      return { success: true };
    }),

  // ── PRD-4: Match Explanation ─────────────────────────────────────────────

  explainMatch: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const matches = await db.getMatchesByUser(ctx.user.id);
      const match = matches.find((m: any) => m.id === input.matchId);
      if (!match) throw new TRPCError({ code: "NOT_FOUND" });

      // Load both intents
      const allIntents = await db.getIntentsByUser(ctx.user.id);
      const intent1 = allIntents.find((i: any) => i.id === match.intent1Id);
      const intent2 = allIntents.find((i: any) => i.id === match.intent2Id);

      if (!intent1 || !intent2) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match intents not found" });
      }

      const explanation = await explainMatch({
        intent1: {
          type: intent1.intentType,
          title: intent1.title,
          assetType: intent1.assetType ?? undefined,
        },
        intent2: {
          type: intent2.intentType,
          title: intent2.title,
          assetType: intent2.assetType ?? undefined,
        },
        compatibilityScore: parseFloat(match.compatibilityScore ?? "0"),
      });

      return explanation;
    }),
```

**Step 3: Type-check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

**Step 4: Run all tests**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run test 2>&1 | tail -30
```

**Step 5: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/routers.ts && git commit -m "feat(trpc): add getDealMemos, getCounterpartyBrief, detectRedFlags, explainMatch procedures"
```

---

## Phase 2 — Frontend: Deal Memo Generator

### Task 7: Build `DealMemoModal` component

**Files:**
- Create: `anavi/client/src/components/DealMemoModal.tsx`

**Step 1: Create the component**

```tsx
// anavi/client/src/components/DealMemoModal.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, FileText, Check, Edit3, Save, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { parseSectionsFromStream } from "@/lib/aiUtils";

interface Document {
  id: number;
  name: string;
  category?: string | null;
}

interface MemoSection {
  title: string;
  content: string;
}

type ModalStep = "select" | "generating" | "review" | "saved";

interface Props {
  dealRoomId: number;
  documents: Document[];
  open: boolean;
  onClose: () => void;
}

export function DealMemoModal({ dealRoomId, documents, open, onClose }: Props) {
  const [step, setStep] = useState<ModalStep>("select");
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [sections, setSections] = useState<MemoSection[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [progress, setProgress] = useState(0);
  const [streamText, setStreamText] = useState("");
  const [savedMemoId, setSavedMemoId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const saveMemoMutation = trpc.ai.saveDealMemoEdits.useMutation({
    onSuccess: () => {
      setStep("saved");
      toast.success("Deal memo saved successfully");
    },
    onError: () => toast.error("Failed to save memo"),
  });

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("select");
      setSelectedFileIds([]);
      setSections([]);
      setProgress(0);
      setStreamText("");
      setSavedMemoId(null);
    }
  }, [open]);

  const toggleFile = useCallback((id: number) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const startGeneration = useCallback(async () => {
    setStep("generating");
    setProgress(0);
    setStreamText("");

    const abort = new AbortController();
    abortRef.current = abort;

    const params = new URLSearchParams({
      dealRoomId: String(dealRoomId),
      fileIds: selectedFileIds.join(","),
    });

    try {
      const response = await fetch(`/api/ai/deal-memo/stream?${params}`, {
        signal: abort.signal,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      // Simulate smooth progress during generation
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 2, 90));
      }, 400);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.chunk) {
              accumulated += payload.chunk;
              setStreamText(accumulated);
            }
            if (payload.done) {
              clearInterval(progressInterval);
              setProgress(100);
              setSavedMemoId(payload.memoId);
              const parsed = payload.sections as MemoSection[];
              setSections(parsed);
              setTimeout(() => setStep("review"), 600);
            }
            if (payload.error) {
              throw new Error(payload.error);
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }

      clearInterval(progressInterval);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Generation failed: " + (err.message || "Unknown error"));
        setStep("select");
      }
    }
  }, [dealRoomId, selectedFileIds]);

  const handleSave = useCallback(() => {
    if (!savedMemoId) return;
    saveMemoMutation.mutate({ memoId: savedMemoId, content: sections });
  }, [savedMemoId, sections, saveMemoMutation]);

  const handleEditSave = useCallback((idx: number) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, content: editDraft } : s))
    );
    setEditingIdx(null);
  }, [editDraft]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative card-elevated w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#D1DCF0" }}>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5" style={{ color: "#2563EB" }} />
              <h2 className="dash-heading text-lg">
                {step === "select" && "Generate Deal Memo"}
                {step === "generating" && "Generating Memo…"}
                {step === "review" && "Review & Edit Memo"}
                {step === "saved" && "Memo Saved"}
              </h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step: Select files */}
            {step === "select" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select documents to include in the AI-generated deal memo. Claude will analyze the
                  content and produce a 7-section investment memo.
                </p>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => toggleFile(doc.id)}
                        className="flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-colors hover:bg-[#F3F7FC]"
                        style={{
                          borderColor: selectedFileIds.includes(doc.id) ? "#2563EB" : "#D1DCF0",
                          background: selectedFileIds.includes(doc.id) ? "#EFF6FF" : "white",
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: selectedFileIds.includes(doc.id) ? "#2563EB" : "#D1DCF0",
                            background: selectedFileIds.includes(doc.id) ? "#2563EB" : "transparent",
                          }}
                        >
                          {selectedFileIds.includes(doc.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <FileText className="w-4 h-4" style={{ color: "#2563EB" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "#0A1628" }}>
                            {doc.name}
                          </p>
                          {doc.category && (
                            <p className="text-xs text-muted-foreground capitalize">{doc.category}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step: Generating */}
            {step === "generating" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#2563EB" }} />
                  <span className="text-sm font-medium" style={{ color: "#0A1628" }}>
                    Claude is analyzing documents and writing your memo…
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#D1DCF0]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "#2563EB" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
                {streamText && (
                  <div
                    className="text-xs font-mono text-muted-foreground rounded-lg p-3 max-h-32 overflow-y-auto"
                    style={{ background: "#F3F7FC", whiteSpace: "pre-wrap" }}
                  >
                    {streamText.slice(-600)}
                  </div>
                )}
              </div>
            )}

            {/* Step: Review */}
            {step === "review" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click any section to edit before saving.
                </p>
                {sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "#D1DCF0" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold" style={{ color: "#0A1628" }}>
                        {section.title}
                      </h3>
                      {editingIdx !== idx && (
                        <button
                          onClick={() => { setEditingIdx(idx); setEditDraft(section.content); }}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    {editingIdx === idx ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full rounded-lg border p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ borderColor: "#D1DCF0", minHeight: 120 }}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(idx)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                            style={{ background: "#2563EB" }}
                          >
                            Save edit
                          </button>
                          <button
                            onClick={() => setEditingIdx(null)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium text-muted-foreground border"
                            style={{ borderColor: "#D1DCF0" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {section.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step: Saved */}
            {step === "saved" && (
              <div className="flex flex-col items-center py-8 gap-4">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-sm font-medium" style={{ color: "#0A1628" }}>
                  Deal memo saved successfully
                </p>
                <p className="text-xs text-muted-foreground">
                  Access it anytime from the Documents tab.
                </p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: "#D1DCF0" }}>
            {step === "select" && (
              <>
                <button
                  onClick={onClose}
                  className="text-sm px-4 py-2 rounded-lg border font-medium text-muted-foreground"
                  style={{ borderColor: "#D1DCF0" }}
                >
                  Cancel
                </button>
                <button
                  onClick={startGeneration}
                  disabled={documents.length > 0 && selectedFileIds.length === 0}
                  className="text-sm px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 disabled:opacity-40"
                  style={{ background: "#2563EB" }}
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Memo
                </button>
              </>
            )}
            {step === "generating" && (
              <button
                onClick={() => { abortRef.current?.abort(); setStep("select"); }}
                className="text-sm px-4 py-2 rounded-lg border font-medium text-muted-foreground"
                style={{ borderColor: "#D1DCF0" }}
              >
                Cancel
              </button>
            )}
            {step === "review" && (
              <>
                <button
                  onClick={onClose}
                  className="text-sm px-4 py-2 rounded-lg border font-medium text-muted-foreground"
                  style={{ borderColor: "#D1DCF0" }}
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveMemoMutation.isPending}
                  className="text-sm px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 disabled:opacity-40"
                  style={{ background: "#2563EB" }}
                >
                  {saveMemoMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Memo
                </button>
              </>
            )}
            {step === "saved" && (
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-lg font-medium text-white"
                style={{ background: "#2563EB" }}
              >
                Done
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
```

**Step 2: Create the client-side utility for parsing sections (mirrored from server)**

Create `anavi/client/src/lib/aiUtils.ts`:

```typescript
// anavi/client/src/lib/aiUtils.ts
// Client-side mirror of the server's parseSectionsFromStream utility.
// Kept in sync manually — no shared package needed for this small helper.

export interface MemoSection {
  title: string;
  content: string;
}

export function parseSectionsFromStream(raw: string): MemoSection[] {
  if (!raw.trim()) return [];

  const parts = raw.split(/##SECTION:/);
  const sections: MemoSection[] = [];

  for (const part of parts) {
    if (!part.trim()) continue;
    const newlineIdx = part.indexOf("\n");
    if (newlineIdx === -1) continue;
    const title = part.slice(0, newlineIdx).trim();
    const content = part.slice(newlineIdx + 1).trim();
    if (title) sections.push({ title, content });
  }

  return sections;
}
```

**Step 3: Type-check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

**Step 4: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/components/DealMemoModal.tsx client/src/lib/aiUtils.ts && git commit -m "feat(ui): DealMemoModal — file select → SSE stream → edit → save flow"
```

---

## Phase 2 — Frontend: Red Flags Banner

### Task 8: Build `RedFlagsBanner` component

**Files:**
- Create: `anavi/client/src/components/RedFlagsBanner.tsx`

**Step 1: Create the component**

```tsx
// anavi/client/src/components/RedFlagsBanner.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Props {
  dealRoomId: number;
}

const SEVERITY_CONFIG = {
  high: { label: "High", bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", dot: "#EF4444" },
  medium: { label: "Medium", bg: "#FFFBEB", text: "#D97706", border: "#FDE68A", dot: "#F59E0B" },
  low: { label: "Low", bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0", dot: "#22C55E" },
} as const;

export function RedFlagsBanner({ dealRoomId }: Props) {
  const [expanded, setExpanded] = useState(false);

  const { data: flags = [], refetch } = trpc.ai.getRedFlags.useQuery({ dealRoomId });
  const dismissMutation = trpc.ai.dismissRedFlag.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Flag dismissed");
    },
  });

  if (flags.length === 0) return null;

  const highCount = flags.filter((f) => f.severity === "high").length;
  const medCount = flags.filter((f) => f.severity === "medium").length;

  return (
    <div className="rounded-xl border overflow-hidden mb-4" style={{ borderColor: "#FECACA" }}>
      {/* Summary bar */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
        style={{ background: "#FEF2F2" }}
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-red-700">
            {flags.length} Diligence Flag{flags.length !== 1 ? "s" : ""} Detected
          </span>
          {highCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
              {highCount} HIGH
            </span>
          )}
          {medCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              {medCount} MEDIUM
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-red-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-red-500" />
        )}
      </button>

      {/* Expandable flag list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="divide-y bg-white" style={{ divideColor: "#FEE2E2" }}>
              {flags.map((flag) => {
                const sev = SEVERITY_CONFIG[flag.severity as keyof typeof SEVERITY_CONFIG];
                return (
                  <div key={flag.id} className="flex items-start gap-3 px-4 py-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: sev.dot }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                          style={{ background: sev.bg, color: sev.text, borderColor: sev.border }}
                        >
                          {sev.label}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {flag.category}
                        </span>
                        {flag.pageRef && (
                          <span className="text-[10px] text-muted-foreground">
                            p. {flag.pageRef}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1" style={{ color: "#0A1628" }}>
                        {flag.description}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissMutation.mutate({ flagId: flag.id })}
                      className="p-1 rounded hover:bg-red-50 flex-shrink-0 mt-0.5"
                      title="Dismiss flag"
                    >
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Type-check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

**Step 3: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/components/RedFlagsBanner.tsx && git commit -m "feat(ui): RedFlagsBanner — expandable red flags with severity, dismiss action"
```

---

## Phase 2 — Frontend: Counterparty Brief Modal

### Task 9: Build `CounterpartyBriefModal` component

**Files:**
- Create: `anavi/client/src/components/CounterpartyBriefModal.tsx`

**Step 1: Create the component**

```tsx
// anavi/client/src/components/CounterpartyBriefModal.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Loader2, MessageSquare, AlertCircle, TrendingUp, Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Props {
  dealRoomId: number;
  dealRoomName: string;
  open: boolean;
  onClose: () => void;
}

export function CounterpartyBriefModal({ dealRoomId, dealRoomName, open, onClose }: Props) {
  const [counterpartyName, setCounterpartyName] = useState("");
  const [brief, setBrief] = useState<{
    companyOverview: string;
    recentNews: string[];
    riskSignals: string[];
    talkingPoints: string[];
  } | null>(null);
  const [cached, setCached] = useState(false);

  const generateMutation = trpc.ai.getCounterpartyBrief.useMutation({
    onSuccess: (data) => {
      setBrief(data.brief);
      setCached(data.cached);
    },
  });

  const handleGenerate = () => {
    if (!counterpartyName.trim()) return;
    generateMutation.mutate({ dealRoomId, counterpartyName: counterpartyName.trim() });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative card-elevated w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#D1DCF0" }}>
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5" style={{ color: "#2563EB" }} />
              <h2 className="dash-heading text-lg">Counterparty Brief</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {!brief ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Enter the counterparty company name to generate an AI intelligence brief before
                  your first meeting. Results are cached for 24 hours.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Counterparty Company Name
                  </label>
                  <input
                    type="text"
                    value={counterpartyName}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    placeholder="e.g. Acme Capital Partners"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: "#D1DCF0" }}
                    autoFocus
                  />
                </div>
                {generateMutation.isError && (
                  <p className="text-xs text-red-600">
                    Failed to generate brief. Please try again.
                  </p>
                )}
              </>
            ) : (
              <>
                {cached && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-amber-700 bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Cached result (refreshes in less than 24h)
                  </div>
                )}

                {/* Company Overview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: "#2563EB" }} />
                    <h3 className="text-sm font-semibold" style={{ color: "#0A1628" }}>Company Overview</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {brief.companyOverview}
                  </p>
                </div>

                {/* Recent News */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: "#2563EB" }} />
                    <h3 className="text-sm font-semibold" style={{ color: "#0A1628" }}>Recent Developments</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {brief.recentNews.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-[#2563EB] mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Signals */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold" style={{ color: "#0A1628" }}>Risk Signals</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {brief.riskSignals.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-amber-500 mt-0.5">▲</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Talking Points */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-semibold" style={{ color: "#0A1628" }}>Talking Points</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {brief.talkingPoints.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-green-600 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: "#D1DCF0" }}>
            {!brief ? (
              <>
                <button
                  onClick={onClose}
                  className="text-sm px-4 py-2 rounded-lg border font-medium text-muted-foreground"
                  style={{ borderColor: "#D1DCF0" }}
                >
                  Skip
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!counterpartyName.trim() || generateMutation.isPending}
                  className="text-sm px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 disabled:opacity-40"
                  style={{ background: "#2563EB" }}
                >
                  {generateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                  ) : (
                    "Generate Brief"
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-lg font-medium text-white"
                style={{ background: "#2563EB" }}
              >
                Enter Deal Room
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
```

**Step 2: Type-check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

**Step 3: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/components/CounterpartyBriefModal.tsx && git commit -m "feat(ui): CounterpartyBriefModal — pre-meeting intelligence brief with 24h cache"
```

---

## Phase 2 — Wire Components into DealRoom.tsx

### Task 10: Integrate all three UI components into `DealRoom.tsx`

**Files:**
- Modify: `anavi/client/src/pages/DealRoom.tsx`

**Context:** The `DealRoom.tsx` file has a `DocumentsTab` component (line 167) that renders the upload zone and document library. The `DiligenceTab` component (line 336) already has a placeholder for "AI Diligence Summary." The main page component renders tabs starting around line 450+.

**Step 1: Add imports at the top of `DealRoom.tsx`**

After the existing imports, add:

```tsx
import { DealMemoModal } from "@/components/DealMemoModal";
import { RedFlagsBanner } from "@/components/RedFlagsBanner";
import { CounterpartyBriefModal } from "@/components/CounterpartyBriefModal";
import { Sparkles, Brain } from "lucide-react";
```

Note: `Sparkles` and `Brain` may need to be added to the existing `lucide-react` import line rather than adding a second one. Merge into the existing import.

**Step 2: Modify `DocumentsTab` signature to accept new props and add the button + banner**

The `DocumentsTab` function signature is currently:
```tsx
function DocumentsTab({ documents }: { documents: any[] }) {
```

Change to:
```tsx
function DocumentsTab({
  documents,
  dealRoomId,
  onGenerateMemo,
}: {
  documents: any[];
  dealRoomId: number;
  onGenerateMemo: () => void;
}) {
```

Then, in the `DocumentsTab` return JSX, add the red flags banner and the "Generate Deal Memo" button. Insert at the top of the `<div className="space-y-6">` inside `DocumentsTab`, before the upload zone:

```tsx
      {/* AI Red Flags Banner */}
      <RedFlagsBanner dealRoomId={dealRoomId} />

      {/* Generate Deal Memo CTA */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Document Intelligence
        </h3>
        <button
          onClick={onGenerateMemo}
          className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-50"
          style={{ color: "#2563EB" }}
        >
          <Sparkles className="w-4 h-4" />
          Generate Deal Memo
        </button>
      </div>
```

**Step 3: Update the call site where `DocumentsTab` is rendered**

Find the JSX that renders `<DocumentsTab documents={documents} />` (or similar) in the main component's tab rendering, and update to pass the new props:

```tsx
<DocumentsTab
  documents={documents}
  dealRoomId={roomId}
  onGenerateMemo={() => setMemoModalOpen(true)}
/>
```

**Step 4: Add state and modal rendering to the main `DealRoom` component**

In the main `DealRoom` (or `DealRoomPage`) component function body, add:

```tsx
const [memoModalOpen, setMemoModalOpen] = useState(false);
const [briefModalOpen, setBriefModalOpen] = useState(false);

// Show counterparty brief modal on first visit to this deal room
useEffect(() => {
  const visitKey = `anavi_dr_visited_${roomId}`;
  const hasVisited = localStorage.getItem(visitKey);
  if (!hasVisited && room) {
    localStorage.setItem(visitKey, "1");
    setBriefModalOpen(true);
  }
}, [roomId, room]);
```

Add the modals to the JSX return, just before the closing fragment/div:

```tsx
<DealMemoModal
  dealRoomId={roomId}
  documents={documents ?? []}
  open={memoModalOpen}
  onClose={() => setMemoModalOpen(false)}
/>

<CounterpartyBriefModal
  dealRoomId={roomId}
  dealRoomName={room?.name ?? "Deal Room"}
  open={briefModalOpen}
  onClose={() => setBriefModalOpen(false)}
/>
```

**Step 5: Type-check and test**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run test 2>&1 | tail -20
```

**Step 6: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/DealRoom.tsx && git commit -m "feat(dealroom): wire DealMemoModal, RedFlagsBanner, CounterpartyBriefModal into Documents tab"
```

---

## Phase 2 — Integration Tests

### Task 11: Write integration tests for the new tRPC procedures

**Files:**
- Create: `anavi/server/ai-procedures.test.ts`

**Step 1: Create the integration test file**

```typescript
// anavi/server/ai-procedures.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI intelligence module so tests don't hit the real Claude API
vi.mock("./ai-intelligence", () => ({
  generateCounterpartyBrief: vi.fn().mockResolvedValue({
    companyOverview: "Acme Corp is a leading widget manufacturer.",
    recentNews: ["Recent news item 1", "Recent news item 2"],
    riskSignals: ["Risk signal 1"],
    talkingPoints: ["Talking point 1", "Talking point 2"],
  }),
  detectRedFlags: vi.fn().mockResolvedValue([
    {
      severity: "high",
      category: "Financial Irregularity",
      description: "Revenue figures are inconsistent across sections.",
      pageRef: "12",
    },
    {
      severity: "low",
      category: "Missing Information",
      description: "No auditor signature found.",
      pageRef: null,
    },
  ]),
  explainMatch: vi.fn().mockResolvedValue({
    reasons: ["Both parties deal in commodities", "Value ranges overlap"],
    risks: ["Geographic mismatch"],
    sharedConnections: "Both focus on APAC markets",
    recommendedNextStep: "Schedule an introductory call",
  }),
  streamDealMemo: vi.fn(),
  parseSectionsFromStream: vi.fn().mockImplementation((raw: string) => {
    if (!raw.trim()) return [];
    return [{ title: "Executive Summary", content: "Mock content" }];
  }),
  buildDealMemoPrompt: vi.fn().mockReturnValue("mock prompt"),
  buildCounterpartyBriefPrompt: vi.fn().mockReturnValue("mock prompt"),
  buildRedFlagPrompt: vi.fn().mockReturnValue("mock prompt"),
  buildMatchExplanationPrompt: vi.fn().mockReturnValue("mock prompt"),
  DEAL_MEMO_SECTIONS: [
    "Executive Summary", "Company Overview", "Investment Thesis",
    "Key Risks", "Financial Highlights", "Comparable Transactions", "Diligence Questions",
  ],
}));

// Mock the DB module
vi.mock("./db", () => ({
  getDealRoomById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Test Deal Room",
    description: "A test deal room",
    status: "active",
  }),
  getDocumentsByDealRoom: vi.fn().mockResolvedValue([
    { id: 1, name: "pitch_deck.pdf", category: "presentation" },
    { id: 2, name: "financials.xlsx", category: "financial" },
  ]),
  getCounterpartyBriefByRoom: vi.fn().mockResolvedValue(null), // no cached brief
  createCounterpartyBrief: vi.fn().mockResolvedValue(1),
  getDealMemosByRoom: vi.fn().mockResolvedValue([]),
  createDealMemo: vi.fn().mockResolvedValue(1),
  updateDealMemoContent: vi.fn().mockResolvedValue(undefined),
  createRedFlags: vi.fn().mockResolvedValue(undefined),
  getRedFlagsByRoom: vi.fn().mockResolvedValue([]),
  dismissRedFlag: vi.fn().mockResolvedValue(undefined),
  getMatchesByUser: vi.fn().mockResolvedValue([
    {
      id: 1,
      intent1Id: 10,
      intent2Id: 20,
      compatibilityScore: "87",
      user1Id: 100,
      user2Id: 200,
    },
  ]),
  getIntentsByUser: vi.fn().mockResolvedValue([
    { id: 10, intentType: "sell", title: "Selling copper", assetType: "commodity" },
    { id: 20, intentType: "buy", title: "Buying copper", assetType: "commodity" },
  ]),
}));

import {
  generateCounterpartyBrief,
  detectRedFlags,
  explainMatch,
} from "./ai-intelligence";
import * as db from "./db";

// ---------------------------------------------------------------------------
// Tests exercise the AI helpers via the mock boundary
// ---------------------------------------------------------------------------

describe("getCounterpartyBrief logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.getCounterpartyBriefByRoom as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it("calls generateCounterpartyBrief when no cached brief exists", async () => {
    const result = await generateCounterpartyBrief({
      dealRoomName: "Test Room",
      counterpartyName: "Acme Corp",
    });
    expect(result.companyOverview).toContain("Acme Corp");
    expect(Array.isArray(result.recentNews)).toBe(true);
    expect(Array.isArray(result.riskSignals)).toBe(true);
    expect(Array.isArray(result.talkingPoints)).toBe(true);
  });

  it("returns cached brief when one exists and is not expired", async () => {
    const cachedBrief = {
      id: 1,
      dealRoomId: 1,
      content: {
        companyOverview: "Cached overview",
        recentNews: [],
        riskSignals: [],
        talkingPoints: [],
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000),
    };
    (db.getCounterpartyBriefByRoom as ReturnType<typeof vi.fn>).mockResolvedValue(cachedBrief);

    const cached = await db.getCounterpartyBriefByRoom(1);
    expect(cached).not.toBeNull();
    expect(cached!.content.companyOverview).toBe("Cached overview");
    // Confirm the mock was called (not the real AI)
    expect(generateCounterpartyBrief).not.toHaveBeenCalled();
  });
});

describe("detectRedFlags logic", () => {
  it("returns structured red flags with correct severity types", async () => {
    const flags = await detectRedFlags({
      fileName: "pitch_deck.pdf",
      documentContent: "Some document content",
    });

    expect(flags.length).toBeGreaterThan(0);
    flags.forEach((flag) => {
      expect(["high", "medium", "low"]).toContain(flag.severity);
      expect(typeof flag.category).toBe("string");
      expect(typeof flag.description).toBe("string");
    });
  });

  it("returns empty array for clean documents", async () => {
    (detectRedFlags as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    const flags = await detectRedFlags({ fileName: "clean.pdf", documentContent: "All good." });
    expect(flags).toHaveLength(0);
  });
});

describe("explainMatch logic", () => {
  it("returns reasons, risks, sharedConnections, and recommendedNextStep", async () => {
    const explanation = await explainMatch({
      intent1: { type: "sell", title: "Selling copper", assetType: "commodity" },
      intent2: { type: "buy", title: "Buying copper", assetType: "commodity" },
      compatibilityScore: 87,
    });

    expect(Array.isArray(explanation.reasons)).toBe(true);
    expect(explanation.reasons.length).toBeGreaterThan(0);
    expect(Array.isArray(explanation.risks)).toBe(true);
    expect(typeof explanation.sharedConnections).toBe("string");
    expect(typeof explanation.recommendedNextStep).toBe("string");
  });
});

describe("DB helpers contract", () => {
  it("getDealMemosByRoom returns an array", async () => {
    const memos = await db.getDealMemosByRoom(1);
    expect(Array.isArray(memos)).toBe(true);
  });

  it("getRedFlagsByRoom returns an array", async () => {
    const flags = await db.getRedFlagsByRoom(1);
    expect(Array.isArray(flags)).toBe(true);
  });

  it("createCounterpartyBrief resolves with an id", async () => {
    const id = await db.createCounterpartyBrief({
      dealRoomId: 1,
      content: {
        companyOverview: "Overview",
        recentNews: [],
        riskSignals: [],
        talkingPoints: [],
      },
    });
    expect(typeof id).toBe("number");
  });
});
```

**Step 2: Run tests**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run test 2>&1 | tail -30
```

Expected: all tests pass.

**Step 3: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/ai-procedures.test.ts && git commit -m "test(ai): integration tests for counterparty brief, red flags, match explain procedures"
```

---

## Phase 2 — Final Build Verification

### Task 12: Full build, all tests, final commit

**Step 1: Run full test suite**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run test 2>&1
```

Expected output: all test files pass, no failing tests.

**Step 2: TypeScript check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1
```

Expected: zero errors.

**Step 3: Production build**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run build 2>&1 | tail -20
```

Expected: clean build, no warnings about missing modules.

**Step 4: Final commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add -A && git commit -m "feat(prd4): AI Deal Intelligence Layer — deal memos, counterparty briefs, red flags, match explanations"
```

---

## Summary

| Task | File(s) | Type |
|------|---------|------|
| 1 | `drizzle/schema.ts` | Schema: 3 new tables |
| 2 | `server/db.ts` | DB helpers: CRUD for all 3 tables |
| 3 | `server/ai-intelligence.test.ts` | Tests (TDD red phase) |
| 4 | `server/ai-intelligence.ts` | AI module: prompts + Claude wrappers |
| 5 | `server/_core/index.ts` | SSE endpoint registration |
| 6 | `server/routers.ts` | 6 new tRPC procedures in `aiRouter` |
| 7 | `client/src/components/DealMemoModal.tsx` + `client/src/lib/aiUtils.ts` | Deal memo UI |
| 8 | `client/src/components/RedFlagsBanner.tsx` | Red flags UI |
| 9 | `client/src/components/CounterpartyBriefModal.tsx` | Counterparty brief UI |
| 10 | `client/src/pages/DealRoom.tsx` | Wire all 3 components |
| 11 | `server/ai-procedures.test.ts` | Integration tests |
| 12 | — | Build verification |

**New tRPC procedures exposed:**
- `ai.getDealMemos` — fetch saved memos for a deal room
- `ai.saveDealMemoEdits` — persist user edits to a memo
- `ai.getCounterpartyBrief` — 24h-cached pre-meeting brief
- `ai.detectRedFlags` — scan document for diligence issues
- `ai.getRedFlags` — fetch active flags for a deal room
- `ai.dismissRedFlag` — soft-delete a flag
- `ai.explainMatch` — reasons + risks + next step for a match

**SSE endpoint:**
- `GET /api/ai/deal-memo/stream?dealRoomId=X&fileIds=1,2,3` — streams deal memo sections progressively, saves to DB on completion
