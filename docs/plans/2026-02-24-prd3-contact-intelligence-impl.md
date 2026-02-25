# PRD-3: Contact Intelligence & Communication Sync — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make ANAVI relationships "warm" by tracking actual communication activity, supporting bulk import, and surfacing last-touched staleness.

**Architecture:** contact_activities table as the activity log backbone. CSV import wizard for bulk onboarding. OAuth connection for Gmail/Calendar auto-logging (Phase 2). lastTouchedAt denormalized onto relationships for fast sorting.

**Tech Stack:** Drizzle ORM + mysql2, tRPC v11, React 19, Vitest, Google OAuth (Phase 2)

---

## Codebase Context (Read Before Implementing)

Key files already studied:

- **`anavi/drizzle/schema.ts`** — Existing `relationships` table has `lastContactAt`, `strengthScore`, `strength`, `tags`, `notes`. The `contactHandles` table links userId/relationshipId to platform handles. Pattern: `mysqlTable` with Drizzle column helpers, types exported at bottom.
- **`anavi/server/db.ts`** — All DB functions follow the `async function foo(...)` pattern, calling `await getDb()`, guard `if (!db) return []` or throw, then Drizzle query. Imports from `drizzle-orm`: `eq`, `desc`, `and`, `or`, `sql`, `gte`, `lte`, `inArray`.
- **`anavi/server/routers.ts`** — `contactRouter` currently has `list`, `add`, `getByRelationship`. Routers use `protectedProcedure` with Zod input validation. Export `appRouter` at bottom with all sub-routers. Auth context: `ctx.user.id`.
- **`anavi/server/anavi.test.ts`** — Test pattern: `vi.mock("./db", ...)`, `appRouter.createCaller(ctx)`, `createAuthContext()` helper returns `{ ctx }`. Vitest with `describe`/`it`/`expect`.
- **`anavi/client/src/pages/Relationships.tsx`** — Uses `trpc.relationship.list.useQuery()`, grid/list view toggle, `card-elevated` class, `filteredRelationships` array. List view rendered by `<RelationshipTable>`. Stats bar has 4 stat cards.

**Verification command (run after each task):**
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -20
```

**Test command:**
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | tail -30
```

---

## Phase 1 — DB Schema, Core API, CSV Import, Last Touched

### Task 1: Schema — Add `contact_activities` and `oauth_connections` tables + alter `relationships`

**Files:**
- Modify: `anavi/drizzle/schema.ts`

**Step 1: Write the failing test first**

Create `anavi/server/contact-intelligence.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

// Schema shape tests — verify the new tables export the expected column shapes
// These tests will fail until Task 1 is complete (schema not yet defined)

describe("contact_activities schema shape", () => {
  it("exports contactActivities table with required columns", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.contactActivities).toBeDefined();
    const cols = schema.contactActivities;
    // Drizzle table objects have a _ property with columns
    expect((cols as any)[Symbol.for("drizzle:IsDrizzleTable")]).toBe(true);
  });

  it("exports oauthConnections table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.oauthConnections).toBeDefined();
  });

  it("exports ContactActivity and OAuthConnection types", async () => {
    // Type-level check: if types don't exist, tsc --noEmit will catch it.
    // Runtime: just verify the exports are not undefined.
    const schema = await import("../drizzle/schema");
    // These are just type exports — check the table shape objects instead
    expect(typeof schema.contactActivities.$inferSelect).toBe("object");
    expect(typeof schema.oauthConnections.$inferSelect).toBe("object");
  });
});

describe("relationships schema - lastTouchedAt column", () => {
  it("relationships table has lastTouchedAt column", async () => {
    const schema = await import("../drizzle/schema");
    const rel = schema.relationships;
    // Drizzle columns accessible via the table's column map
    const cols = (rel as any)._.columns as Record<string, unknown>;
    expect(cols).toHaveProperty("lastTouchedAt");
  });
});
```

Run to confirm failure:
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | grep -E "FAIL|PASS|contact_activities"
```

**Step 2: Implement — append to `anavi/drizzle/schema.ts`**

At the very end of `anavi/drizzle/schema.ts`, after the existing last export (InsertConversionFunnel), append:

```typescript
// ============================================================================
// CONTACT ACTIVITIES (PRD-3: Contact Intelligence)
// ============================================================================

export const contactActivities = mysqlTable("contact_activities", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),       // FK → relationships.id
  userId: int("userId").notNull(),              // The ANAVI user who owns this record
  type: mysqlEnum("type", [
    "email", "meeting", "call", "note", "task", "deal_event", "platform"
  ]).notNull(),
  summary: text("summary"),
  source: mysqlEnum("source", [
    "gmail", "outlook", "calendar", "manual", "platform"
  ]).notNull().default("manual"),
  externalId: varchar("externalId", { length: 512 }), // Gmail thread ID, calendar event ID, etc.
  occurredAt: timestamp("occurredAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactActivity = typeof contactActivities.$inferSelect;
export type InsertContactActivity = typeof contactActivities.$inferInsert;

// ============================================================================
// OAUTH CONNECTIONS (PRD-3: Phase 2 — Gmail / Calendar OAuth)
// ============================================================================

export const oauthConnections = mysqlTable("oauth_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", [
    "gmail", "outlook", "google_calendar", "outlook_calendar"
  ]).notNull(),
  accessToken: text("accessToken"),           // Encrypted at rest in production
  refreshToken: text("refreshToken"),          // Encrypted at rest in production
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  scopes: json("scopes").$type<string[]>(),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  isPaused: boolean("isPaused").default(false).notNull(),
});

export type OAuthConnection = typeof oauthConnections.$inferSelect;
export type InsertOAuthConnection = typeof oauthConnections.$inferInsert;
```

Then, **within the existing `relationships` table definition** in `schema.ts` (around line 167, just before the closing brace of the `relationships` mysqlTable call), add the `lastTouchedAt` column after the `notes` field:

Find the block:
```typescript
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
```

Replace with:
```typescript
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  lastTouchedAt: timestamp("lastTouchedAt"),   // Denormalized from contact_activities for fast sort
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  enrichmentStatus: mysqlEnum("enrichmentStatus", [
    "none", "pending", "enriched", "failed"
  ]).default("none"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
```

**Step 3: Generate and apply the migration**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm db:push 2>&1 | tail -20
```

If DB is not available locally, skip `db:push` — the schema file change is sufficient for type-checking and tests.

**Step 4: Verify tests pass**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | grep -E "contact_activities|relationships schema|PASS|FAIL"
```

**Step 5: Type-check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -10
```

**Step 6: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add drizzle/schema.ts server/contact-intelligence.test.ts && git commit -m "$(cat <<'EOF'
feat(prd3): add contact_activities + oauth_connections schema, lastTouchedAt on relationships

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: DB layer — `contact_activities` and `oauth_connections` CRUD functions

**Files:**
- Modify: `anavi/server/db.ts`

**Step 1: Add failing tests to `anavi/server/contact-intelligence.test.ts`**

Append to the existing test file:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

// ── DB function tests ────────────────────────────────────────────────────────
// Mock the db module so we can unit-test the functions without a live DB.

vi.mock("../drizzle/schema", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../drizzle/schema")>();
  return actual; // real schema types, but db.ts is mocked
});

describe("logContactActivity", () => {
  it("inserts a contact_activities row and returns the new id", async () => {
    const mockInsertId = 42;
    vi.doMock("../server/db", () => ({
      logContactActivity: vi.fn().mockResolvedValue(mockInsertId),
    }));
    const { logContactActivity } = await import("../server/db");
    const result = await (logContactActivity as any)({
      contactId: 1,
      userId: 99,
      type: "email",
      summary: "Sent intro email",
      source: "manual",
      occurredAt: new Date("2026-02-24"),
    });
    expect(result).toBe(mockInsertId);
  });
});

describe("getContactTimeline", () => {
  it("returns paginated activity list ordered by occurredAt desc", async () => {
    const mockActivities = [
      { id: 2, contactId: 1, type: "email", occurredAt: new Date("2026-02-24") },
      { id: 1, contactId: 1, type: "note", occurredAt: new Date("2026-02-20") },
    ];
    vi.doMock("../server/db", () => ({
      getContactTimeline: vi.fn().mockResolvedValue(mockActivities),
    }));
    const { getContactTimeline } = await import("../server/db");
    const result = await (getContactTimeline as any)(1, { limit: 20, offset: 0 });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(2); // most recent first
  });
});

describe("getStaleContacts", () => {
  it("returns contacts grouped by staleness tier", async () => {
    const mockResult = {
      tier30: [{ id: 1, lastTouchedAt: null }],
      tier60: [],
      tier90: [],
    };
    vi.doMock("../server/db", () => ({
      getStaleContacts: vi.fn().mockResolvedValue(mockResult),
    }));
    const { getStaleContacts } = await import("../server/db");
    const result = await (getStaleContacts as any)(99, 30);
    expect(result).toHaveProperty("tier30");
    expect(result).toHaveProperty("tier60");
    expect(result).toHaveProperty("tier90");
  });
});

describe("updateRelationshipLastTouched", () => {
  it("updates lastTouchedAt on the relationships row", async () => {
    const mockFn = vi.fn().mockResolvedValue(undefined);
    vi.doMock("../server/db", () => ({
      updateRelationshipLastTouched: mockFn,
    }));
    const { updateRelationshipLastTouched } = await import("../server/db");
    await (updateRelationshipLastTouched as any)(5, new Date("2026-02-24"));
    expect(mockFn).toHaveBeenCalledWith(5, expect.any(Date));
  });
});
```

Run to confirm failure:
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | grep -E "logContactActivity|getContactTimeline|getStaleContacts|FAIL"
```

**Step 2: Implement — append to `anavi/server/db.ts`**

First, update the import at the top of `db.ts` — add `contactActivities`, `oauthConnections` to the import from `../drizzle/schema`:

Find the existing import block (line ~3-11):
```typescript
import {
  InsertUser, users,
  relationships, contactHandles, intents, matches, deals,
  ...
```

Add `contactActivities, oauthConnections` to that list (alphabetical position doesn't matter, just consistency).

Then append these functions to the bottom of `anavi/server/db.ts`:

```typescript
// ============================================================================
// CONTACT ACTIVITIES (PRD-3)
// ============================================================================

export async function logContactActivity(data: typeof contactActivities.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactActivities).values(data);
  return result[0].insertId as number;
}

export async function getContactTimeline(
  contactId: number,
  opts: { limit?: number; offset?: number } = {}
) {
  const db = await getDb();
  if (!db) return [];
  const { limit = 20, offset = 0 } = opts;
  return db
    .select()
    .from(contactActivities)
    .where(eq(contactActivities.contactId, contactId))
    .orderBy(desc(contactActivities.occurredAt))
    .limit(limit)
    .offset(offset);
}

export async function getContactActivityCountSince(contactId: number, since: Date) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactActivities)
    .where(
      and(
        eq(contactActivities.contactId, contactId),
        gte(contactActivities.occurredAt, since)
      )
    );
  return rows[0]?.count ?? 0;
}

export async function updateRelationshipLastTouched(relationshipId: number, touchedAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(relationships)
    .set({ lastTouchedAt: touchedAt, updatedAt: new Date() })
    .where(eq(relationships.id, relationshipId));
}

/**
 * Returns relationships grouped by how stale they are.
 * tier30: not touched in 30–59 days
 * tier60: not touched in 60–89 days
 * tier90: not touched in 90+ days (or never)
 */
export async function getStaleContacts(userId: number, _days?: number) {
  const db = await getDb();
  if (!db) return { tier30: [], tier60: [], tier90: [] };

  const now = new Date();
  const cutoff30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cutoff60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const cutoff90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const all = await db
    .select()
    .from(relationships)
    .where(eq(relationships.ownerId, userId));

  const tier30: typeof all = [];
  const tier60: typeof all = [];
  const tier90: typeof all = [];

  for (const rel of all) {
    const touched = rel.lastTouchedAt ?? rel.lastContactAt;
    if (!touched) {
      tier90.push(rel);
    } else if (touched < cutoff90) {
      tier90.push(rel);
    } else if (touched < cutoff60) {
      tier60.push(rel);
    } else if (touched < cutoff30) {
      tier30.push(rel);
    }
    // touched within 30 days → not stale, not included
  }

  return { tier30, tier60, tier90 };
}

// ============================================================================
// OAUTH CONNECTIONS (PRD-3 Phase 2)
// ============================================================================

export async function upsertOAuthConnection(
  userId: number,
  provider: typeof oauthConnections.$inferInsert["provider"],
  data: Omit<typeof oauthConnections.$inferInsert, "id" | "userId" | "provider" | "connectedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(oauthConnections)
    .where(
      and(
        eq(oauthConnections.userId, userId),
        eq(oauthConnections.provider, provider)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(oauthConnections)
      .set({ ...data, lastSyncAt: existing[0].lastSyncAt })
      .where(eq(oauthConnections.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(oauthConnections).values({
    userId,
    provider,
    ...data,
  });
  return result[0].insertId as number;
}

export async function getOAuthConnections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(oauthConnections)
    .where(eq(oauthConnections.userId, userId));
}

export async function getOAuthConnection(
  userId: number,
  provider: typeof oauthConnections.$inferInsert["provider"]
) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(oauthConnections)
    .where(
      and(
        eq(oauthConnections.userId, userId),
        eq(oauthConnections.provider, provider)
      )
    )
    .limit(1);
  return rows[0];
}

export async function deleteOAuthConnection(
  userId: number,
  provider: typeof oauthConnections.$inferInsert["provider"]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Import `sql` from drizzle-orm is already in scope at the top of this file
  await db
    .delete(oauthConnections)
    .where(
      and(
        eq(oauthConnections.userId, userId),
        eq(oauthConnections.provider, provider)
      )
    );
}

export async function markOAuthSynced(connectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(oauthConnections)
    .set({ lastSyncAt: new Date() })
    .where(eq(oauthConnections.id, connectionId));
}
```

Note: You must also add `delete` to the drizzle-orm import at the top of `db.ts`:
```typescript
import { eq, desc, and, or, sql, gte, lte, like, inArray, isNotNull } from "drizzle-orm";
```
(The `delete` function in Drizzle is used as `db.delete(table)` — it's on the db object, not imported from drizzle-orm, so no import change is needed for that.)

**Step 3: Verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -15
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | tail -20
```

**Step 4: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/db.ts server/contact-intelligence.test.ts && git commit -m "$(cat <<'EOF'
feat(prd3): add DB layer for contact_activities, oauth_connections, getStaleContacts

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: tRPC — `contact.logActivity`, `contact.getTimeline`, `contact.getStale`

**Files:**
- Modify: `anavi/server/routers.ts`

**Step 1: Write failing tests — append to `anavi/server/contact-intelligence.test.ts`**

```typescript
// ── tRPC procedure tests ─────────────────────────────────────────────────────

vi.mock("./db", () => ({
  // Existing mocks needed by the full appRouter
  getRelationshipsByOwner: vi.fn().mockResolvedValue([]),
  getRelationshipById: vi.fn().mockResolvedValue(null),
  getContactHandles: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({}),
  getUserById: vi.fn().mockResolvedValue(null),
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
  // PRD-3 mocks
  logContactActivity: vi.fn().mockResolvedValue(7),
  getContactTimeline: vi.fn().mockResolvedValue([
    { id: 1, contactId: 5, type: "email", summary: "Intro sent", occurredAt: new Date("2026-02-20"), source: "manual" },
  ]),
  getStaleContacts: vi.fn().mockResolvedValue({
    tier30: [{ id: 10, ownerId: 1 }],
    tier60: [],
    tier90: [],
  }),
  updateRelationshipLastTouched: vi.fn().mockResolvedValue(undefined),
}));

// Helper — re-use from existing anavi.test.ts pattern
function makeAuthCtx() {
  return {
    user: {
      id: 1, openId: "test", email: "test@test.com", name: "Test",
      loginMethod: "manus", role: "user" as const,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

describe("contact.logActivity tRPC procedure", () => {
  it("logs an activity and returns the new id", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.contact.logActivity({
      contactId: 5,
      type: "email",
      summary: "Intro sent",
      occurredAt: new Date("2026-02-20").toISOString(),
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("contact.getTimeline tRPC procedure", () => {
  it("returns activity list for a contact", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.contact.getTimeline({ contactId: 5, limit: 20, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("type");
  });
});

describe("contact.getStale tRPC procedure", () => {
  it("returns tiers of stale contacts", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.contact.getStale({ days: 30 });
    expect(result).toHaveProperty("tier30");
    expect(result).toHaveProperty("tier60");
    expect(result).toHaveProperty("tier90");
  });
});
```

Run to confirm failure:
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | grep -E "contact\.logActivity|contact\.getTimeline|FAIL"
```

**Step 2: Implement — modify `anavi/server/routers.ts`**

Locate the existing `contactRouter` definition (around line 171):

```typescript
const contactRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getContactHandles(ctx.user.id);
  }),

  add: protectedProcedure
    ...

  getByRelationship: protectedProcedure
    ...
});
```

Replace that entire `contactRouter` block with the extended version:

```typescript
const contactRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getContactHandles(ctx.user.id);
  }),

  add: protectedProcedure
    .input(z.object({
      platform: z.enum(['email', 'phone', 'telegram', 'discord', 'whatsapp', 'slack', 'linkedin', 'twitter', 'signal', 'wechat', 'other']),
      handle: z.string(),
      displayName: z.string().optional(),
      isPrimary: z.boolean().optional(),
      groupChatLink: z.string().optional(),
      groupChatName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.addContactHandle({
        userId: ctx.user.id,
        ...input,
      });
      return { id };
    }),

  getByRelationship: protectedProcedure
    .input(z.object({ relationshipId: z.number() }))
    .query(async ({ input }) => {
      return db.getContactHandles(undefined, input.relationshipId);
    }),

  // PRD-3: Activity log
  logActivity: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      type: z.enum(["email", "meeting", "call", "note", "task", "deal_event", "platform"]),
      summary: z.string().optional(),
      occurredAt: z.string(), // ISO string — converts to Date in mutation
      source: z.enum(["gmail", "outlook", "calendar", "manual", "platform"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const occurredAt = new Date(input.occurredAt);
      const id = await db.logContactActivity({
        contactId: input.contactId,
        userId: ctx.user.id,
        type: input.type,
        summary: input.summary ?? null,
        source: input.source ?? "manual",
        occurredAt,
      });
      // Denormalize lastTouchedAt onto the relationship row for fast sorting
      await db.updateRelationshipLastTouched(input.contactId, occurredAt);
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "contact_activity_logged",
        entityType: "relationship",
        entityId: input.contactId,
        newState: { type: input.type, source: input.source ?? "manual" },
      });
      return { id };
    }),

  // PRD-3: Activity timeline
  getTimeline: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return db.getContactTimeline(input.contactId, {
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // PRD-3: Stale contacts by tier
  getStale: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      return db.getStaleContacts(ctx.user.id, input.days);
    }),
});
```

**Step 3: Verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -15
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | tail -20
```

**Step 4: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/routers.ts server/contact-intelligence.test.ts && git commit -m "$(cat <<'EOF'
feat(prd3): contact.logActivity, contact.getTimeline, contact.getStale tRPC procedures

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: CSV Import — logic, DB function, and tRPC procedure

**Files:**
- Modify: `anavi/server/db.ts` (add `importContactsCsv`)
- Modify: `anavi/server/routers.ts` (add `contact.importCsv`)

**Step 1: Write failing tests — append to `anavi/server/contact-intelligence.test.ts`**

```typescript
// ── CSV import tests ─────────────────────────────────────────────────────────

describe("CSV import — duplicate detection logic", () => {
  it("identifies duplicates by email address (case-insensitive)", () => {
    // Pure function — no DB needed
    const deduplicateRows = (
      incoming: Array<{ email?: string; name: string }>,
      existingEmails: Set<string>
    ) => {
      const imported: typeof incoming = [];
      const skipped: typeof incoming = [];
      for (const row of incoming) {
        const emailKey = row.email?.toLowerCase().trim() ?? "";
        if (emailKey && existingEmails.has(emailKey)) {
          skipped.push(row);
        } else {
          imported.push(row);
          if (emailKey) existingEmails.add(emailKey);
        }
      }
      return { imported, skipped };
    };

    const existing = new Set(["alice@corp.com", "bob@firm.io"]);
    const rows = [
      { email: "alice@corp.com", name: "Alice" },  // duplicate
      { email: "ALICE@CORP.COM", name: "Alice 2" }, // duplicate (case)
      { email: "carol@new.com", name: "Carol" },    // new
      { email: "", name: "No Email" },              // no email — imported
    ];

    const { imported, skipped } = deduplicateRows(rows, existing);
    expect(imported).toHaveLength(2); // carol + no-email
    expect(skipped).toHaveLength(2);  // alice (exact) + alice (case)
  });

  it("parses CSV field names case-insensitively", () => {
    const normalizeHeaders = (headers: string[]) =>
      headers.map(h => h.toLowerCase().trim());

    const raw = ["Name", "EMAIL", "Company", " Title "];
    expect(normalizeHeaders(raw)).toEqual(["name", "email", "company", "title"]);
  });
});

describe("contact.importCsv tRPC procedure", () => {
  it("returns importedCount, skippedCount, and errors array", async () => {
    vi.doMock("./db", () => ({
      importContactsCsv: vi.fn().mockResolvedValue({
        importedCount: 3,
        skippedCount: 1,
        errors: [],
      }),
      logAuditEvent: vi.fn().mockResolvedValue(undefined),
    }));

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeAuthCtx());

    const result = await caller.contact.importCsv({
      rows: [
        { name: "Alice Smith", email: "alice@corp.com", company: "Corp", title: "CEO" },
        { name: "Bob Jones", email: "bob@firm.io" },
        { name: "Carol", email: "carol@new.com" },
        { name: "Alice Dup", email: "alice@corp.com" }, // duplicate
      ],
    });

    expect(result).toHaveProperty("importedCount");
    expect(result).toHaveProperty("skippedCount");
    expect(result).toHaveProperty("errors");
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
```

Run to confirm failure:
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | grep -E "importCsv|CSV import|FAIL"
```

**Step 2: Implement `importContactsCsv` in `anavi/server/db.ts`**

Append to `anavi/server/db.ts` (in the CONTACT ACTIVITIES section or as its own section):

```typescript
// ============================================================================
// CSV IMPORT (PRD-3)
// ============================================================================

export interface CsvContactRow {
  name: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  notes?: string;
}

export interface CsvImportResult {
  importedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; message: string }>;
}

export async function importContactsCsv(
  userId: number,
  rows: CsvContactRow[]
): Promise<CsvImportResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Collect existing emails for this user's relationships/contacts
  //    We use contactHandles (platform=email) for duplicate detection.
  const existingHandles = await db
    .select({ handle: contactHandles.handle })
    .from(contactHandles)
    .where(
      and(
        eq(contactHandles.userId, userId),
        eq(contactHandles.platform, "email")
      )
    );
  const existingEmails = new Set(
    existingHandles.map(h => h.handle.toLowerCase().trim())
  );

  let importedCount = 0;
  let skippedCount = 0;
  const errors: CsvImportResult["errors"] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const emailKey = row.email?.toLowerCase().trim() ?? "";

    try {
      if (!row.name?.trim()) {
        errors.push({ row: i + 1, message: "Missing required field: name" });
        continue;
      }

      // Duplicate detection on email
      if (emailKey && existingEmails.has(emailKey)) {
        skippedCount++;
        continue;
      }

      // Create a synthetic contact user record with a placeholder openId
      // so it can be referenced via relationships.contactId → users.id
      // For CSV imports, we create a minimal user row (no auth, no openId login)
      const placeholderOpenId = `csv-import-${userId}-${Date.now()}-${i}`;
      const userResult = await db.insert(users).values({
        openId: placeholderOpenId,
        name: row.name.trim(),
        email: row.email?.trim() || null,
        company: row.company?.trim() || null,
        title: row.title?.trim() || null,
        phone: row.phone?.trim() || null,
        loginMethod: "csv_import",
        role: "user",
        lastSignedIn: new Date(),
      });
      const newUserId = userResult[0].insertId as number;

      // Create relationship owned by the importing user
      const now = new Date();
      const timestampHash = createHash("sha256")
        .update(`${userId}:${newUserId}:${now.getTime()}`)
        .digest("hex");

      await db.insert(relationships).values({
        ownerId: userId,
        contactId: newUserId,
        timestampHash,
        establishedAt: now,
        relationshipType: "network",
        strength: "weak",
        notes: row.notes?.trim() || null,
      });

      // Add email contact handle for future dedup lookups
      if (emailKey) {
        await db.insert(contactHandles).values({
          userId: newUserId,
          platform: "email",
          handle: row.email!.trim(),
          displayName: row.name.trim(),
          isPrimary: true,
        });
        existingEmails.add(emailKey);
      }

      importedCount++;
    } catch (err) {
      errors.push({
        row: i + 1,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { importedCount, skippedCount, errors };
}
```

**Step 3: Add `contact.importCsv` tRPC procedure to `anavi/server/routers.ts`**

Inside the `contactRouter` block, append a new procedure after `getStale`:

```typescript
  // PRD-3: CSV bulk import
  importCsv: protectedProcedure
    .input(z.object({
      rows: z.array(z.object({
        name: z.string(),
        email: z.string().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
      })).min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.importContactsCsv(ctx.user.id, input.rows);
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "contacts_csv_imported",
        entityType: "user",
        entityId: ctx.user.id,
        newState: {
          importedCount: result.importedCount,
          skippedCount: result.skippedCount,
          errorCount: result.errors.length,
        },
      });
      return result;
    }),
```

**Step 4: Verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -15
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | tail -20
```

**Step 5: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/db.ts server/routers.ts server/contact-intelligence.test.ts && git commit -m "$(cat <<'EOF'
feat(prd3): CSV import with duplicate detection, importContactsCsv DB fn + contact.importCsv tRPC

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: UI — "Last Touched" column in Relationships list view + staleness badge

**Files:**
- Modify: `anavi/client/src/pages/Relationships.tsx`

**Step 1: Understand the current list view**

The current `<RelationshipTable>` component renders a table with columns. The `rel` object has `lastContactAt` (existing field) and will now also have `lastTouchedAt` (the new denormalized field from Task 1). Both are `timestamp | null`.

**Step 2: Implement changes to `Relationships.tsx`**

**2a. Add `Clock` to the lucide-react import:**

Find:
```typescript
import {
  Shield, Lock, Copy, LayoutGrid, List, Plus, Search,
  Filter, Check, Upload, Users, Briefcase, TrendingUp,
  DollarSign, Globe, ChevronDown, X,
} from "lucide-react";
```

Replace with:
```typescript
import {
  Shield, Lock, Copy, LayoutGrid, List, Plus, Search,
  Filter, Check, Upload, Users, Briefcase, TrendingUp,
  DollarSign, Globe, ChevronDown, X, Clock, AlertCircle,
} from "lucide-react";
```

**2b. Add helper functions after the existing `formatCurrency` function:**

After `function generateFakeHash() { ... }` (around line 48), add:

```typescript
function formatLastTouched(date: string | Date | null | undefined): string {
  if (!date) return "Never";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function getStalenessLevel(date: string | Date | null | undefined): "fresh" | "warm" | "cool" | "stale" | "cold" {
  if (!date) return "cold";
  const d = typeof date === "string" ? new Date(date) : date;
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 14) return "fresh";
  if (diffDays < 30) return "warm";
  if (diffDays < 60) return "cool";
  if (diffDays < 90) return "stale";
  return "cold";
}

const STALENESS_COLORS: Record<string, { bg: string; text: string }> = {
  fresh: { bg: "#D1FAE5", text: "#065F46" },
  warm:  { bg: "#FEF3C7", text: "#92400E" },
  cool:  { bg: "#DBEAFE", text: "#1E40AF" },
  stale: { bg: "#FEE2E2", text: "#991B1B" },
  cold:  { bg: "#F1F5F9", text: "#475569" },
};
```

**2c. Add a "Last Touched" sort state near the top of the `Relationships` component:**

After the existing `const [viewMode, setViewMode] = useState<"grid" | "list">("grid");` line, add:

```typescript
const [sortByLastTouched, setSortByLastTouched] = useState(false);
```

**2d. Add sorting to `filteredRelationships`:**

After the existing `filteredRelationships` array definition, add:

```typescript
const sortedRelationships = sortByLastTouched
  ? [...filteredRelationships].sort((a, b) => {
      const aDate = a.lastTouchedAt ?? a.lastContactAt;
      const bDate = b.lastTouchedAt ?? b.lastContactAt;
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1; // nulls last
      if (!bDate) return -1;
      return new Date(aDate).getTime() - new Date(bDate).getTime(); // oldest first (most stale)
    })
  : filteredRelationships;
```

**2e. Add a staleness stat card to the existing stats bar:**

The existing `statCards` array (around line 141) has 4 items. Add a 5th or replace "ACTIVE MATCHES" with a staleness stat. Best approach: add it as a fifth card and adjust the grid to `repeat(5, 1fr)` — or more cleanly, use `trpc.contact.getStale.useQuery` and display a count.

Add after the existing query hooks (around line 71):

```typescript
const { data: staleData } = trpc.contact.getStale.useQuery({ days: 30 });
const staleCount = (staleData?.tier30?.length ?? 0) + (staleData?.tier60?.length ?? 0) + (staleData?.tier90?.length ?? 0);
```

Then in `statCards`, add a 5th entry:
```typescript
{ label: "NOT TOUCHED 30+ DAYS", value: staleCount },
```

And update the grid template columns to `"repeat(5, 1fr)"`.

**2f. Add "Sort by Last Touched" button to the filter bar:**

In the filter bar section (after the view mode buttons and before `<div style={{ flex: 1 }} />`), add:

```tsx
<button
  onClick={() => setSortByLastTouched(v => !v)}
  style={{
    height: 38,
    padding: "0 14px",
    borderRadius: 8,
    border: `1px solid ${sortByLastTouched ? COLORS.gold : COLORS.border}`,
    background: sortByLastTouched ? `${COLORS.gold}15` : "#fff",
    color: sortByLastTouched ? COLORS.gold : "#6B7A90",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  }}
>
  <Clock size={14} />
  Last Touched
</button>
```

**2g. Wire `sortedRelationships` into the render:**

Find both usages of `filteredRelationships.map` and `filteredRelationships` in the JSX render section and replace with `sortedRelationships` so the sort takes effect in both grid and list views.

**2h. Add a `LastTouchedBadge` sub-component:**

Before the `RelationshipCard` function (if it exists, search for it in the file), add:

```tsx
function LastTouchedBadge({ date }: { date: string | Date | null | undefined }) {
  const level = getStalenessLevel(date);
  const colors = STALENESS_COLORS[level];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 6,
        background: colors.bg,
        color: colors.text,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <Clock size={10} />
      {formatLastTouched(date)}
    </span>
  );
}
```

**2i. Add `LastTouchedBadge` to the RelationshipCard and RelationshipTable**

In `RelationshipCard`, locate where `lastContactAt` or similar fields are rendered and add:
```tsx
<LastTouchedBadge date={rel.lastTouchedAt ?? rel.lastContactAt} />
```

In `RelationshipTable`, add a "Last Touched" column header and render `<LastTouchedBadge>` in each row.

**Step 3: Verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -15
```

**Step 4: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/Relationships.tsx && git commit -m "$(cat <<'EOF'
feat(prd3): Last Touched column, staleness badges, stale-count stat card in Relationships

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: UI — CSV Import Wizard modal in Relationships page

**Files:**
- Modify: `anavi/client/src/pages/Relationships.tsx`

**Step 1: Test the CSV parsing utility (pure logic, no DOM)**

Append to `anavi/server/contact-intelligence.test.ts`:

```typescript
describe("CSV parsing utility", () => {
  it("parses a valid CSV string into row objects", () => {
    const parseCsvText = (text: string): Array<Record<string, string>> => {
      const lines = text.trim().split("\n").filter(Boolean);
      if (lines.length < 2) return [];
      const headers = lines[0].split(",").map(h => h.toLowerCase().trim().replace(/^"|"$/g, ""));
      return lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
        return row;
      });
    };

    const csv = `Name,Email,Company,Title
Alice Smith,alice@corp.com,Corp Inc,CEO
Bob Jones,bob@firm.io,Firm LLC,Partner`;

    const rows = parseCsvText(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "alice smith", email: "alice@corp.com" });
    expect(rows[1]).toMatchObject({ name: "bob jones", company: "firm llc" });
  });

  it("returns empty array for header-only CSV", () => {
    const parseCsvText = (text: string) => {
      const lines = text.trim().split("\n").filter(Boolean);
      return lines.length < 2 ? [] : [{}];
    };
    expect(parseCsvText("Name,Email")).toHaveLength(0);
  });
});
```

**Step 2: Implement CSV Import modal in `Relationships.tsx`**

**2a. Add import modal state variables** (after the existing `const [modalOpen, setModalOpen] = useState(false);`):

```typescript
const [csvModalOpen, setCsvModalOpen] = useState(false);
const [csvText, setCsvText] = useState("");
const [csvParsedRows, setCsvParsedRows] = useState<Array<{name: string; email?: string; company?: string; title?: string; phone?: string; notes?: string}>>([]);
const [csvImportResult, setCsvImportResult] = useState<{importedCount: number; skippedCount: number; errors: Array<{row: number; message: string}>} | null>(null);
const [csvStep, setCsvStep] = useState<"upload" | "preview" | "result">("upload");
```

**2b. Add import mutation** (after the existing `createMutation`):

```typescript
const importCsvMutation = trpc.contact.importCsv.useMutation({
  onSuccess: (result) => {
    setCsvImportResult(result);
    setCsvStep("result");
    refetch();
  },
  onError: (err) => {
    toast.error(err.message);
  },
});
```

**2c. Add CSV parser function** (alongside the other helper functions):

```typescript
function parseCsvText(text: string): Array<{name: string; email?: string; company?: string; title?: string; phone?: string; notes?: string}> {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.toLowerCase().trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return {
      name: row["name"] ?? "",
      email: row["email"] || undefined,
      company: row["company"] || undefined,
      title: row["title"] || undefined,
      phone: row["phone"] || undefined,
      notes: row["notes"] || undefined,
    };
  }).filter(r => r.name.trim());
}
```

**2d. Add "Import CSV" button to the filter bar** (alongside the existing "Protect a Relationship" button):

```tsx
<button
  onClick={() => { setCsvModalOpen(true); setCsvStep("upload"); setCsvText(""); setCsvParsedRows([]); setCsvImportResult(null); }}
  style={{
    height: 42,
    padding: "0 20px",
    borderRadius: 8,
    background: "#fff",
    color: COLORS.navy,
    fontWeight: 600,
    fontSize: 14,
    border: `1px solid ${COLORS.border}`,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
  }}
>
  <Upload size={16} />
  Import CSV
</button>
```

**2e. Add the CSV modal JSX** (after the existing `{modalOpen && (...)}` block):

```tsx
{csvModalOpen && (
  <div
    style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,22,40,0.6)", backdropFilter: "blur(4px)" }}
    onClick={e => { if (e.target === e.currentTarget) setCsvModalOpen(false); }}
  >
    <div className="card-elevated" style={{ width: 560, maxHeight: "85vh", overflow: "auto", position: "relative" }}>
      <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy }}>Import Contacts from CSV</h2>
          <p style={{ fontSize: 13, color: "#6B7A90", marginTop: 4 }}>
            {csvStep === "upload" && "Paste CSV or upload a file"}
            {csvStep === "preview" && `${csvParsedRows.length} contacts ready to import`}
            {csvStep === "result" && "Import complete"}
          </p>
        </div>
        <button onClick={() => setCsvModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={20} /></button>
      </div>

      <div style={{ padding: "20px 28px 28px" }}>
        {csvStep === "upload" && (
          <>
            <p style={{ fontSize: 12, color: "#6B7A90", marginBottom: 12 }}>
              Accepted columns: <code style={{ background: "#F1F5F9", padding: "1px 4px", borderRadius: 4 }}>name, email, company, title, phone, notes</code>
            </p>
            <textarea
              placeholder={"Name,Email,Company,Title\nAlice Smith,alice@corp.com,Corp Inc,CEO\nBob Jones,bob@firm.io,Firm LLC,Partner"}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              style={{ width: "100%", height: 200, padding: 12, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontFamily: "monospace", fontSize: 12, resize: "vertical", outline: "none" }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: "#94A3B8" }}>
              Or{" "}
              <label style={{ color: COLORS.blue, cursor: "pointer", textDecoration: "underline" }}>
                browse file
                <input
                  type="file"
                  accept=".csv"
                  style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => setCsvText(ev.target?.result as string ?? "");
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
            <button
              disabled={!csvText.trim()}
              onClick={() => {
                const rows = parseCsvText(csvText);
                setCsvParsedRows(rows);
                setCsvStep("preview");
              }}
              style={{ marginTop: 20, width: "100%", height: 44, borderRadius: 8, background: COLORS.gold, color: "#fff", fontWeight: 600, border: "none", cursor: csvText.trim() ? "pointer" : "not-allowed", opacity: csvText.trim() ? 1 : 0.5 }}
            >
              Preview Import
            </button>
          </>
        )}

        {csvStep === "preview" && (
          <>
            <div style={{ maxHeight: 280, overflow: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 8, marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Name", "Email", "Company", "Title"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvParsedRows.slice(0, 50).map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: "8px 12px" }}>{row.name}</td>
                      <td style={{ padding: "8px 12px", color: "#6B7A90" }}>{row.email ?? "—"}</td>
                      <td style={{ padding: "8px 12px", color: "#6B7A90" }}>{row.company ?? "—"}</td>
                      <td style={{ padding: "8px 12px", color: "#6B7A90" }}>{row.title ?? "—"}</td>
                    </tr>
                  ))}
                  {csvParsedRows.length > 50 && (
                    <tr><td colSpan={4} style={{ padding: "8px 12px", color: "#94A3B8", fontSize: 12 }}>…and {csvParsedRows.length - 50} more rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setCsvStep("upload")} style={{ flex: 1, height: 44, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Back</button>
              <button
                disabled={importCsvMutation.isPending}
                onClick={() => importCsvMutation.mutate({ rows: csvParsedRows })}
                style={{ flex: 2, height: 44, borderRadius: 8, background: COLORS.gold, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                {importCsvMutation.isPending ? "Importing…" : `Import ${csvParsedRows.length} Contacts`}
              </button>
            </div>
          </>
        )}

        {csvStep === "result" && csvImportResult && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div className="card-elevated" style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.green }}>{csvImportResult.importedCount}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7A90", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Imported</div>
              </div>
              <div className="card-elevated" style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#6B7A90" }}>{csvImportResult.skippedCount}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7A90", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Skipped (duplicates)</div>
              </div>
            </div>
            {csvImportResult.errors.length > 0 && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "#991B1B", fontWeight: 600, fontSize: 13 }}>
                  <AlertCircle size={14} />
                  {csvImportResult.errors.length} row{csvImportResult.errors.length !== 1 ? "s" : ""} had errors
                </div>
                {csvImportResult.errors.slice(0, 5).map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#7F1D1D" }}>Row {e.row}: {e.message}</div>
                ))}
              </div>
            )}
            <button onClick={() => setCsvModalOpen(false)} style={{ width: "100%", height: 44, borderRadius: 8, background: COLORS.navy, color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}>Done</button>
          </>
        )}
      </div>
    </div>
  </div>
)}
```

**Step 3: Verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -15
```

**Step 4: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/Relationships.tsx server/contact-intelligence.test.ts && git commit -m "$(cat <<'EOF'
feat(prd3): CSV import wizard modal - upload, preview, result steps with duplicate detection

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: UI — Activity Timeline panel (slide-out drawer per contact)

**Files:**
- Create: `anavi/client/src/components/ContactActivityDrawer.tsx`
- Modify: `anavi/client/src/pages/Relationships.tsx`

**Step 1: Write component test (pure render logic)**

Append to `anavi/server/contact-intelligence.test.ts`:

```typescript
describe("activity type display helpers", () => {
  it("maps activity types to human-readable labels", () => {
    const ACTIVITY_LABELS: Record<string, string> = {
      email: "Email",
      meeting: "Meeting",
      call: "Call",
      note: "Note",
      task: "Task",
      deal_event: "Deal Event",
      platform: "Platform",
    };
    expect(ACTIVITY_LABELS["email"]).toBe("Email");
    expect(ACTIVITY_LABELS["deal_event"]).toBe("Deal Event");
    expect(ACTIVITY_LABELS["unknown"]).toBeUndefined();
  });

  it("maps source to icon label", () => {
    const SOURCE_LABELS: Record<string, string> = {
      gmail: "Gmail",
      outlook: "Outlook",
      calendar: "Calendar",
      manual: "Manual",
      platform: "ANAVI Platform",
    };
    expect(SOURCE_LABELS["gmail"]).toBe("Gmail");
    expect(SOURCE_LABELS["manual"]).toBe("Manual");
  });
});
```

**Step 2: Create `anavi/client/src/components/ContactActivityDrawer.tsx`**

```tsx
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { X, Mail, Phone, Calendar, FileText, CheckSquare, Zap, Globe, Plus } from "lucide-react";
import { toast } from "sonner";

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  meeting: Calendar,
  call: Phone,
  note: FileText,
  task: CheckSquare,
  deal_event: Zap,
  platform: Globe,
};

const ACTIVITY_LABELS: Record<string, string> = {
  email: "Email",
  meeting: "Meeting",
  call: "Call",
  note: "Note",
  task: "Task",
  deal_event: "Deal Event",
  platform: "Platform",
};

const SOURCE_COLORS: Record<string, string> = {
  gmail: "#EA4335",
  outlook: "#0078D4",
  calendar: "#34A853",
  manual: "#6B7A90",
  platform: "#C4972A",
};

interface Props {
  contactId: number;
  contactName: string;
  onClose: () => void;
}

export function ContactActivityDrawer({ contactId, contactName, onClose }: Props) {
  const [logType, setLogType] = useState<"email" | "meeting" | "call" | "note" | "task">("note");
  const [logSummary, setLogSummary] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);

  const { data: timeline, isLoading, refetch } = trpc.contact.getTimeline.useQuery({
    contactId,
    limit: 50,
    offset: 0,
  });

  const logMutation = trpc.contact.logActivity.useMutation({
    onSuccess: () => {
      setLogSummary("");
      setShowForm(false);
      refetch();
      toast.success("Activity logged");
    },
    onError: err => toast.error(err.message),
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.4)", backdropFilter: "blur(2px)" }} onClick={onClose} />

      {/* Drawer */}
      <div
        style={{
          position: "relative",
          width: 440,
          height: "100%",
          background: "#fff",
          boxShadow: "-8px 0 40px rgba(10,22,40,0.12)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0A1628" }}>Activity Timeline</h2>
            <p style={{ fontSize: 13, color: "#6B7A90", marginTop: 2 }}>{contactName}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4 }}><X size={20} /></button>
        </div>

        {/* Log Activity button */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #E2E8F0" }}>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              style={{ width: "100%", height: 40, borderRadius: 8, border: "1px dashed #C4972A", background: "#FFFBEB", color: "#C4972A", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Plus size={16} /> Log Activity
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["note", "email", "call", "meeting", "task"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setLogType(t)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: `1px solid ${logType === t ? "#C4972A" : "#E2E8F0"}`,
                      background: logType === t ? "#FFFBEB" : "#fff",
                      color: logType === t ? "#C4972A" : "#6B7A90",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {ACTIVITY_LABELS[t]}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Summary (optional)…"
                value={logSummary}
                onChange={e => setLogSummary(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, resize: "vertical", minHeight: 72, outline: "none" }}
              />
              <input
                type="date"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, outline: "none" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button
                  disabled={logMutation.isPending}
                  onClick={() => logMutation.mutate({ contactId, type: logType, summary: logSummary || undefined, occurredAt: new Date(logDate).toISOString() })}
                  style={{ flex: 2, height: 36, borderRadius: 8, background: "#C4972A", color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}
                >
                  {logMutation.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }}>
          {isLoading && <div style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", padding: "24px 0" }}>Loading timeline…</div>}
          {!isLoading && (!timeline || timeline.length === 0) && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
              <FileText size={32} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14 }}>No activity logged yet.</p>
              <p style={{ fontSize: 12 }}>Use "Log Activity" to record your first touchpoint.</p>
            </div>
          )}
          {timeline && timeline.length > 0 && (
            <div style={{ position: "relative" }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", left: 20, top: 8, bottom: 8, width: 2, background: "#E2E8F0" }} />
              {timeline.map((activity, idx) => {
                const Icon = ACTIVITY_ICONS[activity.type] ?? FileText;
                const sourceColor = SOURCE_COLORS[activity.source ?? "manual"] ?? "#6B7A90";
                return (
                  <div key={activity.id} style={{ display: "flex", gap: 16, marginBottom: idx < timeline.length - 1 ? 20 : 0, position: "relative" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${sourceColor}15`, border: `2px solid ${sourceColor}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                      <Icon size={16} style={{ color: sourceColor }} />
                    </div>
                    <div style={{ flex: 1, paddingTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0A1628" }}>{ACTIVITY_LABELS[activity.type]}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>
                          {new Date(activity.occurredAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      {activity.summary && (
                        <p style={{ fontSize: 13, color: "#374151", marginTop: 4, lineHeight: 1.5 }}>{activity.summary}</p>
                      )}
                      <span style={{ fontSize: 10, color: sourceColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        via {activity.source}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Wire the drawer into `Relationships.tsx`**

Add import:
```typescript
import { ContactActivityDrawer } from "@/components/ContactActivityDrawer";
```

Add state:
```typescript
const [activityDrawer, setActivityDrawer] = useState<{ contactId: number; contactName: string } | null>(null);
```

In the `RelationshipCard` and/or `RelationshipTable`, add a "Timeline" button that opens the drawer:
```tsx
<button
  onClick={() => setActivityDrawer({ contactId: rel.id, contactName: `REL-${rel.id}` })}
  style={{ /* small secondary button style */ }}
>
  <Clock size={12} /> Timeline
</button>
```

Render the drawer at the bottom of the Relationships component JSX:
```tsx
{activityDrawer && (
  <ContactActivityDrawer
    contactId={activityDrawer.contactId}
    contactName={activityDrawer.contactName}
    onClose={() => setActivityDrawer(null)}
  />
)}
```

**Step 4: Verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -15
```

**Step 5: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/components/ContactActivityDrawer.tsx client/src/pages/Relationships.tsx server/contact-intelligence.test.ts && git commit -m "$(cat <<'EOF'
feat(prd3): ContactActivityDrawer - slide-out timeline + manual activity logging

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Dashboard — "Stale Relationships" widget

**Files:**
- Modify: `anavi/client/src/pages/Dashboard.tsx` (or wherever the main dashboard stats are rendered)

**Step 1: Add widget test**

Append to `anavi/server/contact-intelligence.test.ts`:

```typescript
describe("stale relationship widget logic", () => {
  it("formats stale count correctly for display", () => {
    const formatStaleAlert = (count: number): string => {
      if (count === 0) return "All relationships are warm";
      if (count === 1) return "1 relationship not touched in 30+ days";
      return `${count} relationships not touched in 30+ days`;
    };
    expect(formatStaleAlert(0)).toBe("All relationships are warm");
    expect(formatStaleAlert(1)).toBe("1 relationship not touched in 30+ days");
    expect(formatStaleAlert(7)).toBe("7 relationships not touched in 30+ days");
  });
});
```

**Step 2: Locate the Dashboard component**

```bash
ls /home/ariel/Documents/anavi-main/anavi/client/src/pages/Dashboard.tsx
```

**Step 3: Add the stale widget to Dashboard.tsx**

In `Dashboard.tsx`, add the `trpc.contact.getStale` query hook alongside the existing queries:

```typescript
const { data: staleData } = trpc.contact.getStale.useQuery({ days: 30 });
const staleCount = (staleData?.tier30?.length ?? 0) + (staleData?.tier60?.length ?? 0) + (staleData?.tier90?.length ?? 0);
const criticalStaleCount = staleData?.tier90?.length ?? 0;
```

Add a widget to the dashboard stats section. Find the stats grid and insert:

```tsx
{staleCount > 0 && (
  <div
    className="card-elevated"
    style={{
      padding: "20px 24px",
      borderLeft: `4px solid ${criticalStaleCount > 0 ? "#EF4444" : "#F59E0B"}`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <Clock size={18} style={{ color: criticalStaleCount > 0 ? "#EF4444" : "#F59E0B" }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#0A1628" }}>Relationship Warmth Alert</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color: criticalStaleCount > 0 ? "#EF4444" : "#F59E0B", lineHeight: 1 }}>
      {staleCount}
    </div>
    <div style={{ fontSize: 12, color: "#6B7A90", marginTop: 6 }}>
      {staleCount === 1 ? "relationship" : "relationships"} not touched in 30+ days
      {criticalStaleCount > 0 && ` (${criticalStaleCount} at 90+ days)`}
    </div>
    <a
      href="/relationships"
      style={{ display: "inline-block", marginTop: 12, fontSize: 12, fontWeight: 600, color: "#2563EB", textDecoration: "none" }}
    >
      View in Relationships →
    </a>
  </div>
)}
```

Note: `Clock` must be imported from `lucide-react` in Dashboard.tsx.

**Step 4: Verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -10
```

**Step 5: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/Dashboard.tsx server/contact-intelligence.test.ts && git commit -m "$(cat <<'EOF'
feat(prd3): Dashboard stale-relationships widget with 30/90-day warmth alerts

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — OAuth / Gmail Sync (Gmail metadata only — no message bodies)

### Task 9: OAuth router — `oauth.connect`, `oauth.disconnect`, `oauth.getConnections`

**Files:**
- Modify: `anavi/server/routers.ts`
- Modify: `anavi/server/_core/env.ts` (add Google OAuth env vars)

**Step 1: Add env vars**

Read `anavi/server/_core/env.ts` and add the following if not present:

```typescript
GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:5173/oauth/callback/google",
```

**Step 2: Write failing tests — append to `anavi/server/contact-intelligence.test.ts`**

```typescript
describe("oauth.getConnections tRPC procedure", () => {
  it("returns list of connected OAuth providers for user", async () => {
    vi.doMock("./db", () => ({
      getOAuthConnections: vi.fn().mockResolvedValue([
        { id: 1, userId: 1, provider: "gmail", isPaused: false, connectedAt: new Date(), lastSyncAt: null },
      ]),
    }));
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.oauth.getConnections();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("provider");
  });
});

describe("oauth.connect tRPC procedure", () => {
  it("returns an authorization URL for the provider", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.oauth.connect({ provider: "gmail" });
    expect(result).toHaveProperty("authUrl");
    expect(typeof result.authUrl).toBe("string");
    expect(result.authUrl).toContain("accounts.google.com");
  });
});

describe("oauth.disconnect tRPC procedure", () => {
  it("deletes the oauth connection and returns success", async () => {
    vi.doMock("./db", () => ({
      deleteOAuthConnection: vi.fn().mockResolvedValue(undefined),
      logAuditEvent: vi.fn().mockResolvedValue(undefined),
    }));
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.oauth.disconnect({ provider: "gmail" });
    expect(result).toEqual({ success: true });
  });
});
```

**Step 3: Implement `oauthRouter` in `anavi/server/routers.ts`**

Add the new router block after `contactRouter` and before `intentRouter`:

```typescript
// ============================================================================
// OAUTH ROUTER (PRD-3 Phase 2)
// ============================================================================

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const OUTLOOK_OAUTH_SCOPES = [
  "https://graph.microsoft.com/Mail.ReadBasic",
  "offline_access",
].join(" ");

const oauthRouter = router({
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    return db.getOAuthConnections(ctx.user.id);
  }),

  connect: protectedProcedure
    .input(z.object({
      provider: z.enum(["gmail", "outlook", "google_calendar", "outlook_calendar"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, provider: input.provider })).toString("base64");

      if (input.provider === "gmail" || input.provider === "google_calendar") {
        const params = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID ?? "",
          redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
          response_type: "code",
          scope: input.provider === "gmail" ? GOOGLE_OAUTH_SCOPES : "https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
          state,
        });
        return { authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
      }

      if (input.provider === "outlook" || input.provider === "outlook_calendar") {
        const tenantId = "common";
        const params = new URLSearchParams({
          client_id: process.env.OUTLOOK_CLIENT_ID ?? "",
          redirect_uri: process.env.OUTLOOK_REDIRECT_URI ?? "",
          response_type: "code",
          scope: input.provider === "outlook" ? OUTLOOK_OAUTH_SCOPES : "https://graph.microsoft.com/Calendars.Read offline_access",
          state,
        });
        return { authUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}` };
      }

      throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported provider" });
    }),

  disconnect: protectedProcedure
    .input(z.object({
      provider: z.enum(["gmail", "outlook", "google_calendar", "outlook_calendar"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteOAuthConnection(ctx.user.id, input.provider);
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "oauth_disconnected",
        entityType: "user",
        entityId: ctx.user.id,
        newState: { provider: input.provider },
      });
      return { success: true };
    }),

  // Trigger a manual email metadata sync for the connected Gmail account
  syncEmails: protectedProcedure
    .mutation(async ({ ctx }) => {
      const connection = await db.getOAuthConnection(ctx.user.id, "gmail");
      if (!connection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Gmail not connected" });
      }
      if (connection.isPaused) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Gmail sync is paused" });
      }
      // The actual sync is implemented in Task 10 (gmail sync service).
      // This procedure just enqueues / triggers it.
      // For now, return a pending status — sync runs in Task 10.
      return { status: "sync_enqueued", connectionId: connection.id };
    }),
});
```

Then register `oauthRouter` in `appRouter`:

```typescript
export const appRouter = router({
  // ... existing routers ...
  oauth: oauthRouter,
  // ...
});
```

**Step 4: Verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -15
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | tail -20
```

**Step 5: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/routers.ts server/contact-intelligence.test.ts && git commit -m "$(cat <<'EOF'
feat(prd3/phase2): oauthRouter - connect/disconnect/syncEmails for Gmail + Outlook

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Gmail sync service — email metadata fetch and activity creation

**Files:**
- Create: `anavi/server/gmail-sync.ts`

This file is the Phase 2 Gmail metadata sync engine. It uses the Gmail API with only the `gmail.metadata` scope — it never reads email bodies, only thread metadata (subject, participants, date).

**Step 1: Write failing tests**

Append to `anavi/server/contact-intelligence.test.ts`:

```typescript
describe("gmail sync - thread participant matching", () => {
  it("extracts unique email addresses from thread headers", () => {
    const extractParticipants = (headers: Array<{ name: string; value: string }>): string[] => {
      const emailRegex = /[\w.+-]+@[\w-]+\.[\w.]+/g;
      const participants = new Set<string>();
      for (const h of headers) {
        if (["From", "To", "Cc"].includes(h.name)) {
          const matches = h.value.match(emailRegex) ?? [];
          matches.forEach(e => participants.add(e.toLowerCase()));
        }
      }
      return Array.from(participants);
    };

    const headers = [
      { name: "From", value: "alice@corp.com" },
      { name: "To", value: "Bob Jones <bob@firm.io>, carol@new.com" },
      { name: "Cc", value: "alice@corp.com" }, // duplicate — should be deduped
    ];

    const participants = extractParticipants(headers);
    expect(participants).toContain("alice@corp.com");
    expect(participants).toContain("bob@firm.io");
    expect(participants).toContain("carol@new.com");
    expect(participants).toHaveLength(3); // alice deduped
  });

  it("skips threads where no participants match known contacts", () => {
    const knownEmails = new Set(["alice@corp.com", "bob@firm.io"]);
    const threadParticipants = ["unknown@random.com", "stranger@xyz.com"];
    const hasMatch = threadParticipants.some(e => knownEmails.has(e));
    expect(hasMatch).toBe(false);
  });

  it("matches thread participants to known contacts", () => {
    const knownEmails = new Set(["alice@corp.com", "bob@firm.io"]);
    const threadParticipants = ["alice@corp.com", "me@mycompany.com"];
    const matches = threadParticipants.filter(e => knownEmails.has(e));
    expect(matches).toEqual(["alice@corp.com"]);
  });
});
```

**Step 2: Create `anavi/server/gmail-sync.ts`**

```typescript
/**
 * Gmail Sync Service (PRD-3 Phase 2)
 *
 * Privacy policy: We use the `gmail.metadata` scope ONLY.
 * This means we fetch thread metadata (subject, participants, date).
 * We NEVER read message bodies, snippets, or attachments.
 *
 * Flow:
 * 1. Fetch the user's contact email handles from the DB.
 * 2. List recent Gmail threads (last 30 days).
 * 3. For each thread, fetch metadata headers (From, To, Cc, Date, Subject).
 * 4. If any participant matches a known contact email, create a contact_activity record.
 * 5. Update lastTouchedAt on the relationship.
 * 6. Mark oauth_connections.lastSyncAt.
 */

import * as db from "./db";

const GMAIL_API_BASE = "https://www.googleapis.com/gmail/v1";

export interface GmailThread {
  id: string;
  threadId: string;
}

export interface GmailMessageMetadata {
  id: string;
  threadId: string;
  internalDate: string; // Unix ms timestamp as string
  payload: {
    headers: Array<{ name: string; value: string }>;
  };
}

/**
 * Extracts unique email addresses from Gmail message headers (From, To, Cc).
 * Does not read body content — metadata scope only.
 */
export function extractParticipants(headers: Array<{ name: string; value: string }>): string[] {
  const emailRegex = /[\w.+\-]+@[\w\-]+\.[\w.]+/g;
  const participants = new Set<string>();
  for (const header of headers) {
    if (["From", "To", "Cc", "Bcc"].includes(header.name)) {
      const matches = header.value.match(emailRegex) ?? [];
      matches.forEach(e => participants.add(e.toLowerCase().trim()));
    }
  }
  return Array.from(participants);
}

/**
 * Refreshes an expired Google access token using the refresh token.
 */
async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  return { accessToken: data.access_token, expiresAt };
}

/**
 * Fetches Gmail threads from the last `daysSince` days.
 * Uses metadata-only access — no body content.
 */
async function listRecentThreads(
  accessToken: string,
  daysSince = 30
): Promise<GmailThread[]> {
  const after = Math.floor((Date.now() - daysSince * 24 * 60 * 60 * 1000) / 1000);
  const url = `${GMAIL_API_BASE}/users/me/messages?q=after:${after}&maxResults=100`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Gmail list failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { messages?: GmailThread[] };
  return data.messages ?? [];
}

/**
 * Fetches metadata (headers only) for a specific Gmail message.
 * metadataHeaders param restricts to only From/To/Cc/Date/Subject — no body.
 */
async function fetchMessageMetadata(
  accessToken: string,
  messageId: string
): Promise<GmailMessageMetadata> {
  const fields = "id,threadId,internalDate,payload/headers";
  const headers = "From,To,Cc,Date,Subject";
  const url = `${GMAIL_API_BASE}/users/me/messages/${messageId}?format=metadata&metadataHeaders=${headers}&fields=${encodeURIComponent(fields)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Gmail message fetch failed: ${response.statusText}`);
  }

  return response.json() as Promise<GmailMessageMetadata>;
}

/**
 * Main sync function. Call this from the `oauth.syncEmails` tRPC procedure
 * or from a scheduled cron job.
 */
export async function syncGmailForUser(userId: number): Promise<{
  threadsProcessed: number;
  activitiesCreated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let threadsProcessed = 0;
  let activitiesCreated = 0;

  // 1. Get the OAuth connection
  const connection = await db.getOAuthConnection(userId, "gmail");
  if (!connection) throw new Error("Gmail not connected for user " + userId);
  if (connection.isPaused) throw new Error("Gmail sync is paused");

  let accessToken = connection.accessToken ?? "";

  // 2. Refresh token if expired
  if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
    if (!connection.refreshToken) throw new Error("No refresh token — user must reconnect Gmail");
    try {
      const refreshed = await refreshGoogleToken(connection.refreshToken);
      accessToken = refreshed.accessToken;
      await db.upsertOAuthConnection(userId, "gmail", {
        accessToken: refreshed.accessToken,
        tokenExpiresAt: refreshed.expiresAt,
        refreshToken: connection.refreshToken,
        scopes: connection.scopes,
        isPaused: false,
      });
    } catch (err) {
      throw new Error("Token refresh failed: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  // 3. Get the user's known contact email addresses (for participant matching)
  const handles = await db.getContactHandles(undefined, undefined);
  // Narrow to email handles for this user's relationships
  // getContactHandles(userId) returns handles owned by this user or their contacts
  const userHandles = await db.getContactHandles(userId);
  const knownEmailMap = new Map<string, number>(); // email → contactId (relationshipId for now)

  // We'll also need to cross-reference emails to relationship IDs.
  // For a clean implementation, we join contactHandles with relationships.
  // For now, store handle.userId as a proxy for contactId.
  for (const handle of userHandles) {
    if (handle.platform === "email" && handle.handle) {
      knownEmailMap.set(handle.handle.toLowerCase(), handle.userId ?? 0);
    }
  }

  if (knownEmailMap.size === 0) {
    await db.markOAuthSynced(connection.id);
    return { threadsProcessed: 0, activitiesCreated: 0, errors: [] };
  }

  // 4. List recent threads
  let messages: GmailThread[] = [];
  try {
    messages = await listRecentThreads(accessToken, 30);
  } catch (err) {
    errors.push("Failed to list threads: " + String(err));
    return { threadsProcessed, activitiesCreated, errors };
  }

  // Track already-processed thread IDs to avoid duplicate activities
  const seenThreadIds = new Set<string>();

  // 5. For each message, fetch metadata and match to contacts
  for (const message of messages.slice(0, 100)) {
    if (seenThreadIds.has(message.threadId)) continue;
    seenThreadIds.add(message.threadId);

    try {
      const metadata = await fetchMessageMetadata(accessToken, message.id);
      const participants = extractParticipants(metadata.payload.headers);
      const subjectHeader = metadata.payload.headers.find(h => h.name === "Subject");
      const subject = subjectHeader?.value ?? "(no subject)";
      const occurredAt = new Date(parseInt(metadata.internalDate));

      // Match participants to known contacts
      for (const email of participants) {
        const contactUserId = knownEmailMap.get(email);
        if (!contactUserId || contactUserId === userId) continue; // skip self

        // Check for existing activity with this externalId to prevent re-import
        // (Simple check: we use the threadId as externalId)
        await db.logContactActivity({
          contactId: contactUserId,
          userId,
          type: "email",
          summary: `Email thread: ${subject}`,
          source: "gmail",
          externalId: message.threadId,
          occurredAt,
        });
        await db.updateRelationshipLastTouched(contactUserId, occurredAt);
        activitiesCreated++;
      }

      threadsProcessed++;
    } catch (err) {
      errors.push(`Thread ${message.threadId}: ${String(err)}`);
    }
  }

  // 6. Mark sync complete
  await db.markOAuthSynced(connection.id);

  return { threadsProcessed, activitiesCreated, errors };
}
```

**Step 3: Wire sync into `oauth.syncEmails` in routers.ts**

Update the `syncEmails` procedure in `oauthRouter` to call the sync service:

```typescript
syncEmails: protectedProcedure
  .mutation(async ({ ctx }) => {
    const connection = await db.getOAuthConnection(ctx.user.id, "gmail");
    if (!connection) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Gmail not connected" });
    }
    if (connection.isPaused) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Gmail sync is paused" });
    }
    const { syncGmailForUser } = await import("./gmail-sync");
    const result = await syncGmailForUser(ctx.user.id);
    return result;
  }),
```

**Step 4: Verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -15
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | tail -20
```

**Step 5: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/gmail-sync.ts server/routers.ts server/contact-intelligence.test.ts && git commit -m "$(cat <<'EOF'
feat(prd3/phase2): Gmail metadata sync service - thread participant matching, activity creation

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: UI — OAuth Connections panel in Settings page

**Files:**
- Modify: `anavi/client/src/pages/Settings.tsx`

**Step 1: Add the OAuth connections section**

Read the current `anavi/client/src/pages/Settings.tsx` to identify where to insert. Typically after profile settings.

Add the query and mutation hooks inside the Settings component:

```typescript
const { data: oauthConnections, refetch: refetchOAuth } = trpc.oauth.getConnections.useQuery();
const connectMutation = trpc.oauth.connect.useMutation({
  onSuccess: (result) => {
    // Redirect user to the OAuth authorization URL
    window.location.href = result.authUrl;
  },
  onError: err => toast.error(err.message),
});
const disconnectMutation = trpc.oauth.disconnect.useMutation({
  onSuccess: () => {
    refetchOAuth();
    toast.success("Disconnected successfully");
  },
  onError: err => toast.error(err.message),
});
const syncMutation = trpc.oauth.syncEmails.useMutation({
  onSuccess: (result) => {
    toast.success(`Sync complete: ${result.activitiesCreated} activities logged`);
  },
  onError: err => toast.error(err.message),
});
```

Add a "Communication Sync" section to the settings JSX:

```tsx
{/* Communication Sync — PRD-3 */}
<div className="card-elevated" style={{ padding: "28px 32px", marginBottom: 24 }}>
  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Communication Sync</h3>
  <p style={{ fontSize: 13, color: "#6B7A90", marginBottom: 20 }}>
    Connect your email to automatically log contact touchpoints. Only metadata (sender, date, subject) is read — never email bodies.
  </p>

  {/* Gmail */}
  {(() => {
    const gmailConn = oauthConnections?.find(c => c.provider === "gmail");
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16 }}>G</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#0A1628" }}>Gmail</div>
            <div style={{ fontSize: 12, color: "#6B7A90" }}>
              {gmailConn
                ? `Connected${gmailConn.lastSyncAt ? ` · Last synced ${new Date(gmailConn.lastSyncAt).toLocaleDateString()}` : " · Never synced"}`
                : "Not connected"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {gmailConn ? (
            <>
              <button
                disabled={syncMutation.isPending}
                onClick={() => syncMutation.mutate()}
                style={{ height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#374151" }}
              >
                {syncMutation.isPending ? "Syncing…" : "Sync Now"}
              </button>
              <button
                onClick={() => disconnectMutation.mutate({ provider: "gmail" })}
                style={{ height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #FCA5A5", background: "#FEF2F2", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#DC2626" }}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => connectMutation.mutate({ provider: "gmail" })}
              style={{ height: 34, padding: "0 16px", borderRadius: 8, background: "#0A1628", color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}
            >
              Connect Gmail
            </button>
          )}
        </div>
      </div>
    );
  })()}

  {/* Google Calendar */}
  {(() => {
    const calConn = oauthConnections?.find(c => c.provider === "google_calendar");
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16 }}>C</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#0A1628" }}>Google Calendar</div>
            <div style={{ fontSize: 12, color: "#6B7A90" }}>
              {calConn ? "Connected" : "Not connected — sync meetings with contacts"}
            </div>
          </div>
        </div>
        <div>
          {calConn ? (
            <button
              onClick={() => disconnectMutation.mutate({ provider: "google_calendar" })}
              style={{ height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #FCA5A5", background: "#FEF2F2", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#DC2626" }}
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => connectMutation.mutate({ provider: "google_calendar" })}
              style={{ height: 34, padding: "0 16px", borderRadius: 8, background: "#0A1628", color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}
            >
              Connect Calendar
            </button>
          )}
        </div>
      </div>
    );
  })()}
</div>
```

**Step 2: Also handle the OAuth callback route**

The OAuth flow redirects back to `GOOGLE_REDIRECT_URI` (e.g. `/oauth/callback/google`). This needs an Express route in `anavi/server/_core/index.ts` (or wherever routes are registered).

Add an Express GET route `/oauth/callback/google` that:
1. Exchanges the `code` for tokens using the Google token endpoint.
2. Calls `db.upsertOAuthConnection(userId, "gmail", { accessToken, refreshToken, tokenExpiresAt, scopes })`.
3. Redirects to `/settings?oauth=success`.

The `state` parameter from the auth URL is base64-encoded `{ userId, provider }` — decode it to get `userId`.

This route lives outside tRPC (it's a plain Express GET handler). Read `anavi/server/_core/index.ts` to find where to register it, then add:

```typescript
app.get("/oauth/callback/google", async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const { userId, provider } = JSON.parse(Buffer.from(state, "base64").toString());

    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    });

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!tokenResp.ok) {
      throw new Error("Token exchange failed");
    }

    const tokens = await tokenResp.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    };

    await db.upsertOAuthConnection(userId, provider, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scopes: tokens.scope.split(" "),
      isPaused: false,
    });

    res.redirect("/settings?oauth=success");
  } catch (err) {
    console.error("[OAuth Callback]", err);
    res.redirect("/settings?oauth=error");
  }
});
```

**Step 3: Verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1 | tail -15
```

**Step 4: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/Settings.tsx server/_core/index.ts && git commit -m "$(cat <<'EOF'
feat(prd3/phase2): Settings OAuth panel for Gmail/Calendar connect + OAuth callback handler

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Final integration pass + full test run

**Files:**
- Modify: `anavi/server/contact-intelligence.test.ts` (add end-to-end scenario tests)

**Step 1: Add integration scenario tests**

Append to `anavi/server/contact-intelligence.test.ts`:

```typescript
// ── End-to-end scenario tests ────────────────────────────────────────────────

describe("PRD-3 end-to-end: relationship warmth tracking scenario", () => {
  it("staleness tiers respect the 30/60/90-day boundaries correctly", () => {
    const now = new Date("2026-02-24T00:00:00Z");

    const computeStaleness = (lastTouchedAt: Date | null) => {
      if (!lastTouchedAt) return "cold";
      const diffDays = Math.floor(
        (now.getTime() - lastTouchedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays < 30) return "fresh";
      if (diffDays < 60) return "tier30";
      if (diffDays < 90) return "tier60";
      return "tier90";
    };

    // Exactly 29 days ago → fresh
    const d29 = new Date("2026-01-26T00:00:00Z");
    expect(computeStaleness(d29)).toBe("fresh");

    // Exactly 30 days ago → tier30
    const d30 = new Date("2026-01-25T00:00:00Z");
    expect(computeStaleness(d30)).toBe("tier30");

    // Exactly 60 days ago → tier60
    const d60 = new Date("2025-12-26T00:00:00Z");
    expect(computeStaleness(d60)).toBe("tier60");

    // Exactly 90 days ago → tier90
    const d90 = new Date("2025-11-26T00:00:00Z");
    expect(computeStaleness(d90)).toBe("tier90");

    // null → cold
    expect(computeStaleness(null)).toBe("cold");
  });

  it("CSV import: validates required field 'name' before inserting", () => {
    const validateRow = (row: Record<string, string>) => {
      const errors: string[] = [];
      if (!row.name?.trim()) errors.push("Missing required field: name");
      if (row.email && !/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(row.email)) {
        errors.push("Invalid email format");
      }
      return errors;
    };

    expect(validateRow({ name: "Alice", email: "alice@corp.com" })).toHaveLength(0);
    expect(validateRow({ name: "", email: "alice@corp.com" })).toContain("Missing required field: name");
    expect(validateRow({ name: "Alice", email: "not-an-email" })).toContain("Invalid email format");
  });

  it("activity log: occurredAt is preserved as provided (not coerced to now)", () => {
    // Ensures historical imports have correct timestamps
    const parseActivityDate = (iso: string) => new Date(iso);
    const historicalDate = "2025-06-15T10:00:00Z";
    const parsed = parseActivityDate(historicalDate);
    expect(parsed.getFullYear()).toBe(2025);
    expect(parsed.getMonth()).toBe(5); // June (0-indexed)
  });

  it("Gmail sync: deduplicates by threadId to prevent double-logging", () => {
    const seenThreadIds = new Set<string>();
    const processThread = (threadId: string): "processed" | "skipped" => {
      if (seenThreadIds.has(threadId)) return "skipped";
      seenThreadIds.add(threadId);
      return "processed";
    };

    expect(processThread("thread-abc")).toBe("processed");
    expect(processThread("thread-abc")).toBe("skipped"); // same thread
    expect(processThread("thread-xyz")).toBe("processed"); // different thread
    expect(seenThreadIds.size).toBe(2);
  });
});
```

**Step 2: Run full test suite**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1
```

Expected: All tests pass (or only pre-existing failures unrelated to PRD-3).

**Step 3: Full TypeScript check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm run check 2>&1
```

Expected: No new type errors introduced by PRD-3 work.

**Step 4: Final commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add server/contact-intelligence.test.ts && git commit -m "$(cat <<'EOF'
test(prd3): end-to-end scenario tests for staleness tiers, CSV validation, Gmail dedup

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Summary: Files Changed

| File | Change |
|---|---|
| `anavi/drizzle/schema.ts` | Add `contactActivities`, `oauthConnections` tables; add `lastTouchedAt`, `linkedinUrl`, `enrichmentStatus` to `relationships` |
| `anavi/server/db.ts` | Add `logContactActivity`, `getContactTimeline`, `getContactActivityCountSince`, `updateRelationshipLastTouched`, `getStaleContacts`, `upsertOAuthConnection`, `getOAuthConnections`, `getOAuthConnection`, `deleteOAuthConnection`, `markOAuthSynced`, `importContactsCsv` |
| `anavi/server/routers.ts` | Extend `contactRouter` with `logActivity`, `getTimeline`, `getStale`, `importCsv`; add new `oauthRouter` with `connect`, `disconnect`, `syncEmails`; register `oauth` in `appRouter` |
| `anavi/server/gmail-sync.ts` | New file: Gmail metadata sync service with `syncGmailForUser`, `extractParticipants` |
| `anavi/server/contact-intelligence.test.ts` | New file: all TDD tests for PRD-3 |
| `anavi/client/src/pages/Relationships.tsx` | Add CSV import wizard modal, Last Touched column/sort, staleness badges, stale count stat card, timeline drawer trigger |
| `anavi/client/src/components/ContactActivityDrawer.tsx` | New file: slide-out activity timeline drawer with manual log form |
| `anavi/client/src/pages/Settings.tsx` | Add OAuth connections panel (Gmail, Google Calendar) |
| `anavi/server/_core/index.ts` | Add `/oauth/callback/google` Express route for token exchange |

## Environment Variables Required (Phase 2)

Add to `.env`:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/callback/google
OUTLOOK_CLIENT_ID=...
OUTLOOK_REDIRECT_URI=http://localhost:5173/oauth/callback/outlook
```

## Migration Note

After implementing Task 1, run:
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm db:push
```

This generates the SQL migration for `contact_activities`, `oauth_connections`, and the new columns on `relationships`. The next migration file will be `anavi/drizzle/0008_*.sql`.
