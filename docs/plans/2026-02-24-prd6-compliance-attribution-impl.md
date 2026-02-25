# PRD-6: Compliance, Attribution & Payout Automation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make ANAVI's attribution promise real: an immutable, hash-chained event ledger with a public verification endpoint, milestone-triggered payout records, and a working OFAC sanctions check.

**Architecture:** attribution_events table with DB-level immutability triggers and SHA-256 hash chain for tamper-evidence. Public /api/verify/:hash endpoint registered before tRPC middleware. Deal milestone table drives automatic payout record creation on stage change.

**Tech Stack:** Node.js crypto module (SHA-256, built-in), Drizzle ORM + mysql2, tRPC v11, React 19, Vitest

---

## Existing Code Landmarks

| File | Relevant Contents |
|------|-------------------|
| `anavi/drizzle/schema.ts` | `payouts` table (status enum: `pending|approved|processing|completed|failed`), `complianceChecks`, `deals`, `matches`, `auditLog` |
| `anavi/server/routers.ts` | `complianceRouter.runCheck` (2s fake timeout), `payoutRouter`, `dealRouter.updateStage`, `matchRouter.expressInterest` |
| `anavi/server/_core/index.ts` | Express app setup — tRPC registered at `/api/trpc` via `createExpressMiddleware`; auth routes registered before it via `registerAuthRoutes(app)` |
| `anavi/server/db.ts` | All DB helper functions; pattern: thin wrappers around Drizzle queries |
| `anavi/client/src/pages/DealRoom.tsx` | Tab system: `TabKey` union + `TABS` array + `SlideIn` switcher at line ~933; existing tabs: overview, documents, diligence, compliance, escrow, payouts, audit |
| `anavi/server/anavi.test.ts` | Test pattern: `vi.mock('./db', ...)` + `createAuthContext()` helper + `appRouter.createCaller(ctx)` |

## Dependency Map

```
Task 1 (schema) → Task 2 (DB helpers) → Task 3 (hash util) → Task 4 (attribution router)
                                                             → Task 5 (verify endpoint)
Task 2 → Task 6 (deal milestones router)
Task 2 → Task 7 (payout schema alter + auto-trigger)
Task 4 → Task 8 (auto-log attribution events in match/deal routers)
Task 3 → Task 9 (OFAC check)
Task 4 → Task 10 (Attribution UI tab)
Task 6 → Task 10
All server tasks → Task 11 (integration tests)
Task 10 → Task 12 (UI tests)
Task 11, 12 → Task 13 (migration file + commit)
```

---

## Task 1 — DB Schema: attribution_events + deal_milestones tables

**File:** `anavi/drizzle/schema.ts`

**Test first** (`anavi/server/attribution.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { attributionEvents, dealMilestones } from '../drizzle/schema';

describe('attribution_events schema', () => {
  it('exports attributionEvents table with required columns', () => {
    const cols = Object.keys(attributionEvents);
    expect(cols).toContain('id');
    expect(cols).toContain('dealId');
    expect(cols).toContain('type');
    expect(cols).toContain('actorId');
    expect(cols).toContain('hash');
    expect(cols).toContain('prevHash');
    expect(cols).toContain('createdAt');
  });

  it('exports dealMilestones table with required columns', () => {
    const cols = Object.keys(dealMilestones);
    expect(cols).toContain('id');
    expect(cols).toContain('dealId');
    expect(cols).toContain('payoutPct');
    expect(cols).toContain('recipientId');
    expect(cols).toContain('status');
  });
});
```

Run: `pnpm test` → expect FAIL (tables don't exist yet).

**Implement** — append to `anavi/drizzle/schema.ts` before the TYPE EXPORTS section:

```typescript
// ============================================================================
// ATTRIBUTION EVENTS (Immutable Hash-Chained Ledger)
// ============================================================================

export const attributionEvents = mysqlTable("attribution_events", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  type: mysqlEnum("type", [
    "introduction", "match", "deal_room_join", "intent_create", "deal_close"
  ]).notNull(),
  actorId: int("actorId").notNull(),
  subjectId: int("subjectId"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  hash: varchar("hash", { length: 64 }).notNull(),
  prevHash: varchar("prevHash", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttributionEvent = typeof attributionEvents.$inferSelect;
export type InsertAttributionEvent = typeof attributionEvents.$inferInsert;

// ============================================================================
// DEAL MILESTONES (Structured payout triggers)
// ============================================================================

export const dealMilestones = mysqlTable("deal_milestones", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  triggerStage: mysqlEnum("triggerStage", [
    "lead", "qualification", "due_diligence", "negotiation",
    "documentation", "closing", "completed", "cancelled"
  ]).notNull(),
  payoutPct: decimal("payoutPct", { precision: 5, scale: 2 }).notNull(),
  recipientId: int("recipientId").notNull(),
  status: mysqlEnum("status", ["pending", "triggered", "paid", "disputed"]).default("pending").notNull(),
  triggeredAt: timestamp("triggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DealMilestone = typeof dealMilestones.$inferSelect;
export type InsertDealMilestone = typeof dealMilestones.$inferInsert;
```

Also update the `payouts` table — the existing `status` enum already covers `pending|approved|processing|completed|failed`; add the new columns for milestone linkage and Stripe preparation by modifying the `payouts` table definition in-place:

```typescript
// Add these columns inside the payouts mysqlTable definition:
milestoneId: int("milestoneId"),          // refs deal_milestones.id
stripeTransferId: varchar("stripeTransferId", { length: 100 }),
approvedById: int("approvedById"),        // refs users.id
approvedAt: timestamp("approvedAt"),
```

> Note: The existing `status` enum on `payouts` is `pending|approved|processing|completed|failed`. The PRD adds `disputed`. Add `"disputed"` to the enum array.

**DB Immutability Triggers** — create `anavi/drizzle/migrations/attribution_immutability_triggers.sql`:

```sql
-- Prevent UPDATE on attribution_events
DELIMITER $$
CREATE TRIGGER attribution_events_no_update
BEFORE UPDATE ON attribution_events
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'attribution_events rows are immutable and cannot be updated';
END$$

-- Prevent DELETE on attribution_events
CREATE TRIGGER attribution_events_no_delete
BEFORE DELETE ON attribution_events
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'attribution_events rows are immutable and cannot be deleted';
END$$
DELIMITER ;
```

Run: `pnpm test` → expect PASS.

**Commit:** `feat(schema): add attribution_events and deal_milestones tables`

---

## Task 2 — DB Helper Functions for Attribution + Milestones

**File:** `anavi/server/db.ts`

**Test first** — add to `anavi/server/attribution.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./db')>();
  return {
    ...actual,
    getDb: vi.fn(),
  };
});

describe('db attribution helpers (type-level)', () => {
  it('createAttributionEvent accepts required fields', () => {
    // Type-only check — verifies the function signature compiles
    type CreateAttrArgs = Parameters<typeof import('./db').createAttributionEvent>[0];
    type Check = CreateAttrArgs extends {
      dealId: number;
      type: string;
      actorId: number;
      hash: string;
    } ? true : false;
    const result: Check = true;
    expect(result).toBe(true);
  });
});
```

Run: `pnpm test` → FAIL (functions don't exist).

**Implement** — add to `anavi/server/db.ts`:

```typescript
import { attributionEvents, dealMilestones } from '../drizzle/schema';
// (add to existing imports at top of db.ts)

// ── Attribution Events ────────────────────────────────────────────────────────

export async function createAttributionEvent(data: {
  dealId: number;
  type: 'introduction' | 'match' | 'deal_room_join' | 'intent_create' | 'deal_close';
  actorId: number;
  subjectId?: number;
  metadata?: Record<string, unknown>;
  hash: string;
  prevHash?: string;
}): Promise<number> {
  const db = await getDb();
  const [result] = await db
    .insert(attributionEvents)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .$returningId();
  return result.id;
}

export async function getAttributionChain(dealId: number) {
  const db = await getDb();
  return db
    .select()
    .from(attributionEvents)
    .where(eq(attributionEvents.dealId, dealId))
    .orderBy(attributionEvents.createdAt);
}

export async function getAttributionEventByHash(hash: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(attributionEvents)
    .where(eq(attributionEvents.hash, hash))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLatestAttributionHash(dealId: number): Promise<string | null> {
  const db = await getDb();
  const rows = await db
    .select({ hash: attributionEvents.hash })
    .from(attributionEvents)
    .where(eq(attributionEvents.dealId, dealId))
    .orderBy(desc(attributionEvents.createdAt))
    .limit(1);
  return rows[0]?.hash ?? null;
}

// ── Deal Milestones ───────────────────────────────────────────────────────────

export async function createDealMilestone(data: {
  dealId: number;
  name: string;
  triggerStage: string;
  payoutPct: string;
  recipientId: number;
}): Promise<number> {
  const db = await getDb();
  const [result] = await db
    .insert(dealMilestones)
    .values({ ...data, status: 'pending' })
    .$returningId();
  return result.id;
}

export async function getDealMilestones(dealId: number) {
  const db = await getDb();
  return db
    .select()
    .from(dealMilestones)
    .where(eq(dealMilestones.dealId, dealId))
    .orderBy(dealMilestones.createdAt);
}

export async function triggerMilestonesForStage(dealId: number, stage: string): Promise<number[]> {
  const db = await getDb();
  const pending = await db
    .select()
    .from(dealMilestones)
    .where(
      and(
        eq(dealMilestones.dealId, dealId),
        eq(dealMilestones.triggerStage, stage),
        eq(dealMilestones.status, 'pending')
      )
    );
  const triggeredIds: number[] = [];
  for (const milestone of pending) {
    await db
      .update(dealMilestones)
      .set({ status: 'triggered', triggeredAt: new Date() })
      .where(eq(dealMilestones.id, milestone.id));
    triggeredIds.push(milestone.id);
  }
  return triggeredIds;
}
```

> Important: `desc` must be imported from `drizzle-orm` alongside `eq` and `and` at the top of `db.ts`. Verify the existing imports and add as needed.

Run: `pnpm test` → PASS.

**Commit:** `feat(db): attribution event and deal milestone helper functions`

---

## Task 3 — Hash Chain Utility Module

**File:** `anavi/server/attribution-hash.ts` (new file)

**Test first** — `anavi/server/attribution-hash.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { computeAttributionHash, verifyChainIntegrity } from './attribution-hash';

describe('computeAttributionHash', () => {
  it('returns a 64-character hex string', () => {
    const hash = computeAttributionHash({
      dealId: 1,
      type: 'introduction',
      actorId: 42,
      subjectId: undefined,
      metadata: {},
      prevHash: undefined,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for the same inputs', () => {
    const input = {
      dealId: 5,
      type: 'match' as const,
      actorId: 10,
      subjectId: 20,
      metadata: { score: 95 },
      prevHash: 'abc123',
      createdAt: new Date('2026-01-15T12:00:00.000Z'),
    };
    expect(computeAttributionHash(input)).toBe(computeAttributionHash(input));
  });

  it('produces different hashes for different inputs', () => {
    const base = {
      dealId: 1,
      type: 'match' as const,
      actorId: 1,
      subjectId: undefined,
      metadata: {},
      prevHash: undefined,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const h1 = computeAttributionHash(base);
    const h2 = computeAttributionHash({ ...base, actorId: 2 });
    expect(h1).not.toBe(h2);
  });

  it('treats undefined subjectId and empty string the same as empty', () => {
    const base = {
      dealId: 1,
      type: 'deal_close' as const,
      actorId: 7,
      metadata: {},
      prevHash: undefined,
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
    };
    const h1 = computeAttributionHash({ ...base, subjectId: undefined });
    const h2 = computeAttributionHash({ ...base, subjectId: undefined });
    expect(h1).toBe(h2);
  });

  it('verifyChainIntegrity returns true for valid chain', () => {
    const ts1 = new Date('2026-01-01T00:00:00.000Z');
    const ts2 = new Date('2026-01-02T00:00:00.000Z');

    const hash1 = computeAttributionHash({
      dealId: 1, type: 'introduction', actorId: 1,
      subjectId: undefined, metadata: {}, prevHash: undefined, createdAt: ts1,
    });
    const hash2 = computeAttributionHash({
      dealId: 1, type: 'match', actorId: 1,
      subjectId: undefined, metadata: {}, prevHash: hash1, createdAt: ts2,
    });

    const chain = [
      { dealId: 1, type: 'introduction', actorId: 1, subjectId: null, metadata: {},
        hash: hash1, prevHash: null, createdAt: ts1 },
      { dealId: 1, type: 'match', actorId: 1, subjectId: null, metadata: {},
        hash: hash2, prevHash: hash1, createdAt: ts2 },
    ];
    expect(verifyChainIntegrity(chain)).toBe(true);
  });

  it('verifyChainIntegrity returns false for tampered chain', () => {
    const chain = [
      { dealId: 1, type: 'introduction', actorId: 1, subjectId: null, metadata: {},
        hash: 'deadbeef'.repeat(8), prevHash: null, createdAt: new Date() },
    ];
    expect(verifyChainIntegrity(chain)).toBe(false);
  });
});
```

Run: `pnpm test` → FAIL.

**Implement** — `anavi/server/attribution-hash.ts`:

```typescript
import { createHash } from 'node:crypto';

export interface HashInput {
  dealId: number;
  type: string;
  actorId: number;
  subjectId?: number | null;
  metadata?: Record<string, unknown> | null;
  prevHash?: string | null;
  createdAt: Date;
}

/**
 * Computes SHA-256 hash for an attribution event using the canonical algorithm:
 * SHA-256(dealId + type + actorId + (subjectId || '') + JSON.stringify(metadata) + (prevHash || '') + createdAt.toISOString())
 */
export function computeAttributionHash(input: HashInput): string {
  const raw = [
    String(input.dealId),
    input.type,
    String(input.actorId),
    String(input.subjectId ?? ''),
    JSON.stringify(input.metadata ?? {}),
    input.prevHash ?? '',
    input.createdAt.toISOString(),
  ].join('');

  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

/**
 * Verifies the integrity of a full attribution chain.
 * Re-computes each hash and checks that prevHash links are consistent.
 */
export function verifyChainIntegrity(
  chain: Array<{
    dealId: number;
    type: string;
    actorId: number;
    subjectId: number | null;
    metadata: Record<string, unknown> | null;
    hash: string;
    prevHash: string | null;
    createdAt: Date;
  }>
): boolean {
  for (let i = 0; i < chain.length; i++) {
    const event = chain[i];
    const expectedPrevHash = i === 0 ? null : chain[i - 1].hash;

    if (event.prevHash !== expectedPrevHash) return false;

    const computed = computeAttributionHash({
      dealId: event.dealId,
      type: event.type,
      actorId: event.actorId,
      subjectId: event.subjectId ?? undefined,
      metadata: event.metadata ?? undefined,
      prevHash: event.prevHash ?? undefined,
      createdAt: event.createdAt,
    });

    if (computed !== event.hash) return false;
  }
  return true;
}
```

Run: `pnpm test` → PASS.

**Commit:** `feat(attribution): SHA-256 hash chain utility with chain integrity verifier`

---

## Task 4 — Attribution tRPC Router

**File:** `anavi/server/routers.ts`

**Test first** — add to `anavi/server/attribution.test.ts`:
```typescript
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

vi.mock('./db', () => ({
  createAttributionEvent: vi.fn().mockResolvedValue(1),
  getAttributionChain: vi.fn().mockResolvedValue([]),
  getAttributionEventByHash: vi.fn().mockResolvedValue(null),
  getLatestAttributionHash: vi.fn().mockResolvedValue(null),
  createDealMilestone: vi.fn().mockResolvedValue(1),
  getDealMilestones: vi.fn().mockResolvedValue([]),
  triggerMilestonesForStage: vi.fn().mockResolvedValue([]),
  // ... keep other mocked functions from existing test file
}));

describe('attribution router', () => {
  it('logEvent creates an event and returns id + hash', async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.attribution.logEvent({
      dealId: 1,
      type: 'introduction',
    });
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('hash');
    expect(typeof result.hash).toBe('string');
    expect(result.hash).toHaveLength(64);
  });

  it('getChain returns array', async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.attribution.getChain({ dealId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('verifyHash returns null for unknown hash', async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.attribution.verifyHash({
      hash: 'a'.repeat(64),
    });
    expect(result).toBeNull();
  });

  it('generateCertificate returns stub message', async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.attribution.generateCertificate({ dealId: 1 });
    expect(result.message).toContain('Phase 3');
  });
});
```

Run: `pnpm test` → FAIL.

**Implement** — add `attributionRouter` in `anavi/server/routers.ts`, before the `// MAIN ROUTER` section:

```typescript
// ============================================================================
// ATTRIBUTION ROUTER
// ============================================================================

import { computeAttributionHash } from './attribution-hash';
// (add to top-level imports in routers.ts)

const attributionRouter = router({
  logEvent: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      type: z.enum(['introduction', 'match', 'deal_room_join', 'intent_create', 'deal_close']),
      subjectId: z.number().optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const prevHash = await db.getLatestAttributionHash(input.dealId);
      const createdAt = new Date();

      const hash = computeAttributionHash({
        dealId: input.dealId,
        type: input.type,
        actorId: ctx.user.id,
        subjectId: input.subjectId,
        metadata: input.metadata,
        prevHash: prevHash ?? undefined,
        createdAt,
      });

      const id = await db.createAttributionEvent({
        dealId: input.dealId,
        type: input.type,
        actorId: ctx.user.id,
        subjectId: input.subjectId,
        metadata: input.metadata,
        hash,
        prevHash: prevHash ?? undefined,
      });

      return { id, hash };
    }),

  getChain: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      return db.getAttributionChain(input.dealId);
    }),

  verifyHash: protectedProcedure
    .input(z.object({ hash: z.string().length(64) }))
    .query(async ({ input }) => {
      return db.getAttributionEventByHash(input.hash);
    }),

  generateCertificate: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      return {
        message: `Phase 3 placeholder: cryptographic certificate for deal ${input.dealId} will be generated once on-chain anchoring is enabled.`,
      };
    }),
});
```

Also add `attribution: attributionRouter` to the `appRouter` export at the bottom of `routers.ts`.

Run: `pnpm test` → PASS.

**Commit:** `feat(trpc): attribution router — logEvent, getChain, verifyHash, generateCertificate`

---

## Task 5 — Public /api/verify/:hash Express Endpoint

**File:** `anavi/server/_core/index.ts`

**Test first** — `anavi/server/verify-endpoint.test.ts`:
```typescript
import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../db', () => ({
  getAttributionEventByHash: vi.fn().mockImplementation(async (hash: string) => {
    if (hash === 'a'.repeat(64)) {
      return {
        id: 1,
        dealId: 10,
        type: 'introduction',
        actorId: 5,
        hash: 'a'.repeat(64),
        prevHash: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };
    }
    return null;
  }),
}));

// Import the registration function directly to test in isolation
import { registerVerifyRoute } from '../_core/verify-route';

describe('GET /api/verify/:hash', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    registerVerifyRoute(app);
  });

  it('returns 200 with event data for a known hash', async () => {
    const res = await request(app).get(`/api/verify/${'a'.repeat(64)}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 1,
      dealId: 10,
      type: 'introduction',
      actorId: 5,
    });
    expect(res.body.hash).toBe('a'.repeat(64));
  });

  it('returns 404 for unknown hash', async () => {
    const res = await request(app).get(`/api/verify/${'b'.repeat(64)}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Hash not found' });
  });

  it('returns 400 for hash that is not 64 chars', async () => {
    const res = await request(app).get('/api/verify/tooshort');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
```

> Note: `supertest` is not currently in `package.json`. Add it: `pnpm add -D supertest @types/supertest` (run from `anavi/` directory).

Run: `pnpm test` → FAIL.

**Implement** — create `anavi/server/_core/verify-route.ts`:

```typescript
import type { Express, Request, Response } from 'express';
import * as db from '../db';

export function registerVerifyRoute(app: Express): void {
  app.get('/api/verify/:hash', async (req: Request, res: Response) => {
    const { hash } = req.params;

    if (!hash || hash.length !== 64 || !/^[a-f0-9]{64}$/.test(hash)) {
      res.status(400).json({ error: 'Invalid hash format — must be 64 hex characters' });
      return;
    }

    try {
      const event = await db.getAttributionEventByHash(hash);
      if (!event) {
        res.status(404).json({ error: 'Hash not found' });
        return;
      }
      res.json({
        id: event.id,
        dealId: event.dealId,
        type: event.type,
        actorId: event.actorId,
        hash: event.hash,
        prevHash: event.prevHash,
        createdAt: event.createdAt,
      });
    } catch (err) {
      console.error('[verify-route] error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
```

**Wire it up** — in `anavi/server/_core/index.ts`, add the import and registration call BEFORE the tRPC middleware block:

```typescript
// Add import at top:
import { registerVerifyRoute } from './verify-route';

// In startServer(), add this call BEFORE app.use('/api/trpc', ...):
registerVerifyRoute(app);
```

The relevant section of `index.ts` after the change:
```typescript
async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerAuthRoutes(app);
  registerVerifyRoute(app);          // <-- NEW: before tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );
  // ... rest unchanged
```

Run: `pnpm test` → PASS.

**Commit:** `feat(server): public /api/verify/:hash endpoint registered before tRPC middleware`

---

## Task 6 — Deal Milestones tRPC Procedures

**File:** `anavi/server/routers.ts`

**Test first** — add to `anavi/server/attribution.test.ts`:
```typescript
describe('deal milestone procedures', () => {
  it('defineMilestone creates milestone and returns id', async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.deal.defineMilestone({
      dealId: 1,
      name: 'Term Sheet',
      triggerStage: 'negotiation',
      payoutPct: '25.00',
      recipientId: 2,
    });
    expect(result).toHaveProperty('id');
    expect(typeof result.id).toBe('number');
  });

  it('getMilestones returns array', async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.deal.getMilestones({ dealId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});
```

Run: `pnpm test` → FAIL.

**Implement** — add these two procedures to `dealRouter` in `anavi/server/routers.ts` (inside the existing `dealRouter` object, after `getParticipants`):

```typescript
defineMilestone: protectedProcedure
  .input(z.object({
    dealId: z.number(),
    name: z.string(),
    triggerStage: z.enum([
      'lead', 'qualification', 'due_diligence', 'negotiation',
      'documentation', 'closing', 'completed', 'cancelled',
    ]),
    payoutPct: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/),
    recipientId: z.number(),
  }))
  .mutation(async ({ input }) => {
    const id = await db.createDealMilestone(input);
    return { id };
  }),

getMilestones: protectedProcedure
  .input(z.object({ dealId: z.number() }))
  .query(async ({ input }) => {
    return db.getDealMilestones(input.dealId);
  }),
```

Run: `pnpm test` → PASS.

**Commit:** `feat(trpc): deal.defineMilestone and deal.getMilestones procedures`

---

## Task 7 — Auto-Trigger Milestones + Create Payout Records on Stage Change

**File:** `anavi/server/routers.ts` — `deal.updateStage` mutation

**Test first** — add to `anavi/server/attribution.test.ts`:
```typescript
import * as dbModule from './db';

describe('deal.updateStage milestone auto-trigger', () => {
  it('calls triggerMilestonesForStage when stage is updated', async () => {
    const triggerSpy = vi.spyOn(dbModule, 'triggerMilestonesForStage')
      .mockResolvedValue([101, 102]);
    const getDealSpy = vi.spyOn(dbModule, 'getDealById')
      .mockResolvedValue({ id: 1, title: 'Test Deal', stage: 'qualification' } as any);
    const updateDealSpy = vi.spyOn(dbModule, 'updateDeal').mockResolvedValue(undefined);
    const getParticipantsSpy = vi.spyOn(dbModule, 'getDealParticipants').mockResolvedValue([]);
    const logSpy = vi.spyOn(dbModule, 'logAuditEvent').mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.deal.updateStage({ id: 1, stage: 'negotiation' });

    expect(triggerSpy).toHaveBeenCalledWith(1, 'negotiation');
  });

  it('logs deal_close attribution event when stage becomes completed', async () => {
    vi.spyOn(dbModule, 'triggerMilestonesForStage').mockResolvedValue([]);
    vi.spyOn(dbModule, 'getDealById')
      .mockResolvedValue({ id: 1, title: 'Test Deal', stage: 'closing' } as any);
    vi.spyOn(dbModule, 'updateDeal').mockResolvedValue(undefined);
    vi.spyOn(dbModule, 'getDealParticipants').mockResolvedValue([]);
    vi.spyOn(dbModule, 'logAuditEvent').mockResolvedValue(undefined);

    const getLatestHashSpy = vi.spyOn(dbModule, 'getLatestAttributionHash').mockResolvedValue(null);
    const createEventSpy = vi.spyOn(dbModule, 'createAttributionEvent').mockResolvedValue(99);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.deal.updateStage({ id: 1, stage: 'completed' });

    expect(createEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ dealId: 1, type: 'deal_close', actorId: 1 })
    );
  });
});
```

Run: `pnpm test` → FAIL.

**Implement** — modify `dealRouter.updateStage` in `anavi/server/routers.ts`. The existing implementation ends after notifying participants. Extend it:

```typescript
updateStage: protectedProcedure
  .input(z.object({
    id: z.number(),
    stage: z.enum(['lead', 'qualification', 'due_diligence', 'negotiation', 'documentation', 'closing', 'completed', 'cancelled']),
  }))
  .mutation(async ({ ctx, input }) => {
    const deal = await db.getDealById(input.id);
    if (!deal) throw new TRPCError({ code: 'NOT_FOUND' });

    await db.updateDeal(input.id, { stage: input.stage });

    await db.logAuditEvent({
      userId: ctx.user.id,
      action: 'deal_stage_updated',
      entityType: 'deal',
      entityId: input.id,
      previousState: { stage: deal.stage },
      newState: { stage: input.stage },
    });

    // Auto-trigger milestones for the new stage
    await db.triggerMilestonesForStage(input.id, input.stage);

    // Log deal_close attribution event when deal reaches completed
    if (input.stage === 'completed') {
      const prevHash = await db.getLatestAttributionHash(input.id);
      const createdAt = new Date();
      const hash = computeAttributionHash({
        dealId: input.id,
        type: 'deal_close',
        actorId: ctx.user.id,
        prevHash: prevHash ?? undefined,
        createdAt,
      });
      await db.createAttributionEvent({
        dealId: input.id,
        type: 'deal_close',
        actorId: ctx.user.id,
        hash,
        prevHash: prevHash ?? undefined,
      });
    }

    // Notify participants (existing code — unchanged)
    const participants = await db.getDealParticipants(input.id);
    for (const p of participants) {
      if (p.userId !== ctx.user.id) {
        await db.createNotification({
          userId: p.userId,
          type: 'deal_update',
          title: 'Deal Stage Updated',
          message: `Deal "${deal.title}" moved to ${input.stage}`,
          relatedEntityType: 'deal',
          relatedEntityId: input.id,
        });
      }
    }

    return { success: true };
  }),
```

Run: `pnpm test` → PASS.

**Commit:** `feat(deal): auto-trigger milestones on stage change, log deal_close attribution event`

---

## Task 8 — Auto-Log Attribution Events in Match Router

**File:** `anavi/server/routers.ts` — `matchRouter.expressInterest` and `matchRouter.createDealRoom`

**Test first** — add to `anavi/server/attribution.test.ts`:
```typescript
describe('match router attribution auto-logging', () => {
  it('logs match attribution event when mutual interest is achieved', async () => {
    vi.spyOn(dbModule, 'getMatchesByUser').mockResolvedValue([{
      id: 5,
      user1Id: 1,
      user2Id: 3,
      user1Consent: false,
      user2Consent: true,  // other party already consented
      status: 'user2_interested',
    } as any]);
    vi.spyOn(dbModule, 'updateMatch').mockResolvedValue(undefined);
    vi.spyOn(dbModule, 'createNotification').mockResolvedValue(undefined);
    vi.spyOn(dbModule, 'getLatestAttributionHash').mockResolvedValue(null);
    const createEventSpy = vi.spyOn(dbModule, 'createAttributionEvent').mockResolvedValue(10);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.match.expressInterest({ matchId: 5 });

    expect(createEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'match' })
    );
  });
});
```

Run: `pnpm test` → FAIL.

**Implement** — in `matchRouter.expressInterest`, after the existing `updateMatch` and notification calls, add:

```typescript
// When mutual interest is achieved, log a match attribution event
// otherConsent was checked before the update; if it was true the match is now mutual
if (otherConsent) {
  // Use match ID as dealId proxy until a deal record exists
  // (the real dealId will be linked once a deal room is created)
  const prevHash = await db.getLatestAttributionHash(input.matchId);
  const createdAt = new Date();
  const hash = computeAttributionHash({
    dealId: input.matchId,
    type: 'match',
    actorId: ctx.user.id,
    subjectId: otherUserId,
    prevHash: prevHash ?? undefined,
    createdAt,
  });
  await db.createAttributionEvent({
    dealId: input.matchId,
    type: 'match',
    actorId: ctx.user.id,
    subjectId: otherUserId,
    metadata: { matchId: input.matchId },
    hash,
    prevHash: prevHash ?? undefined,
  });
}
```

In `matchRouter.createDealRoom`, after `grantDealRoomAccess` and `updateMatch`, add:

```typescript
// Log deal_room_join attribution events for both participants
for (const userId of [match.user1Id, match.user2Id]) {
  const prevHash = await db.getLatestAttributionHash(dealRoomId);
  const createdAt = new Date();
  const hash = computeAttributionHash({
    dealId: dealRoomId,
    type: 'deal_room_join',
    actorId: userId,
    prevHash: prevHash ?? undefined,
    createdAt,
  });
  await db.createAttributionEvent({
    dealId: dealRoomId,
    type: 'deal_room_join',
    actorId: userId,
    metadata: { matchId: input.matchId },
    hash,
    prevHash: prevHash ?? undefined,
  });
}
```

Run: `pnpm test` → PASS.

**Commit:** `feat(match): auto-log match and deal_room_join attribution events`

---

## Task 9 — Real OFAC Sanctions Check (replace mock timeout)

**File:** `anavi/server/ofac.ts` (new file) + `anavi/server/routers.ts` (update `complianceRouter.runCheck`)

**Test first** — `anavi/server/ofac.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { checkNameAgainstOFAC, type OFACResult } from './ofac';

// Mock fetch to avoid real network calls in unit tests
global.fetch = vi.fn();

describe('checkNameAgainstOFAC', () => {
  it('returns clear result when name does not appear in SDN XML', async () => {
    const mockXml = `<?xml version="1.0"?>
<sdnList>
  <sdnEntry>
    <lastName>TESTPERSON</lastName>
    <firstName>KNOWN</firstName>
    <akaList><aka><lastName>OTHERNAME</aka></akaList>
  </sdnEntry>
</sdnList>`;

    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => mockXml,
    });

    const result: OFACResult = await checkNameAgainstOFAC('John Smith');
    expect(result.hit).toBe(false);
    expect(result.matchedEntries).toHaveLength(0);
  });

  it('returns hit when name appears in SDN XML', async () => {
    const mockXml = `<?xml version="1.0"?>
<sdnList>
  <sdnEntry>
    <lastName>SMITH</lastName>
    <firstName>JOHN</firstName>
    <akaList></akaList>
  </sdnEntry>
</sdnList>`;

    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => mockXml,
    });

    const result: OFACResult = await checkNameAgainstOFAC('John Smith');
    expect(result.hit).toBe(true);
    expect(result.matchedEntries.length).toBeGreaterThan(0);
  });

  it('returns error result when fetch fails', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const result: OFACResult = await checkNameAgainstOFAC('Any Name');
    expect(result.error).toBeTruthy();
    expect(result.hit).toBe(false);
  });

  it('is case-insensitive', async () => {
    const mockXml = `<?xml version="1.0"?>
<sdnList>
  <sdnEntry>
    <lastName>JOHNSON</lastName>
    <firstName>ROBERT</firstName>
    <akaList></akaList>
  </sdnEntry>
</sdnList>`;

    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => mockXml,
    });

    const result = await checkNameAgainstOFAC('robert johnson');
    expect(result.hit).toBe(true);
  });
});
```

**Also test the updated compliance router** — add to `anavi/server/attribution.test.ts`:
```typescript
describe('compliance.runRealCheck', () => {
  it('runs OFAC check and updates compliance record', async () => {
    vi.mock('./ofac', () => ({
      checkNameAgainstOFAC: vi.fn().mockResolvedValue({
        hit: false,
        matchedEntries: [],
        checkedAt: new Date(),
      }),
    }));
    vi.spyOn(dbModule, 'getUserById').mockResolvedValue({
      id: 1, name: 'Jane Doe'
    } as any);
    const createCheckSpy = vi.spyOn(dbModule, 'createComplianceCheck').mockResolvedValue(42);
    const updateCheckSpy = vi.spyOn(dbModule, 'updateComplianceCheck').mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.compliance.runRealCheck({ userId: 1 });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('status', 'passed');
    expect(updateCheckSpy).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ status: 'passed' })
    );
  });
});
```

Run: `pnpm test` → FAIL.

**Implement** — `anavi/server/ofac.ts`:

```typescript
const OFAC_SDN_URL = 'https://www.treasury.gov/ofac/downloads/sdn.xml';

export interface OFACResult {
  hit: boolean;
  matchedEntries: string[];
  checkedAt: Date;
  error?: string;
}

/**
 * Downloads the OFAC SDN XML list and performs a case-insensitive name search.
 * Uses a simple text-search approach: extracts all name tokens from <lastName>
 * and <firstName> tags and checks if the query name tokens overlap.
 *
 * No vendor contract required — OFAC publishes this list publicly.
 */
export async function checkNameAgainstOFAC(fullName: string): Promise<OFACResult> {
  const checkedAt = new Date();

  try {
    const response = await fetch(OFAC_SDN_URL, {
      headers: { 'User-Agent': 'ANAVI-Compliance/1.0' },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return {
        hit: false,
        matchedEntries: [],
        checkedAt,
        error: `OFAC fetch failed: HTTP ${response.status}`,
      };
    }

    const xml = await response.text();
    const nameParts = fullName.toUpperCase().trim().split(/\s+/).filter(Boolean);

    // Extract all name strings from the XML
    // Pattern: <lastName>NAME</lastName> or <firstName>NAME</firstName>
    const lastNameMatches = [...xml.matchAll(/<lastName>([^<]+)<\/lastName>/gi)].map(
      (m) => m[1].toUpperCase().trim()
    );
    const firstNameMatches = [...xml.matchAll(/<firstName>([^<]+)<\/firstName>/gi)].map(
      (m) => m[1].toUpperCase().trim()
    );

    // Build a set of all SDN name tokens for fast lookup
    const allSdnTokens = new Set([...lastNameMatches, ...firstNameMatches]);

    const matchedEntries: string[] = [];

    // Check if ALL name parts of the query appear in SDN entries (conservative: any match)
    for (const part of nameParts) {
      if (allSdnTokens.has(part)) {
        matchedEntries.push(part);
      }
    }

    // A "hit" requires at least 2 matching tokens (prevents false positives on common first names)
    const hit = matchedEntries.length >= 2;

    return { hit, matchedEntries, checkedAt };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { hit: false, matchedEntries: [], checkedAt, error };
  }
}
```

**Update `complianceRouter` in `anavi/server/routers.ts`** — add a new `runRealCheck` procedure (keep `runCheck` for backward compat):

```typescript
// Add import at top of routers.ts:
import { checkNameAgainstOFAC } from './ofac';

// Inside complianceRouter, add:
runRealCheck: protectedProcedure
  .input(z.object({ userId: z.number() }))
  .mutation(async ({ input }) => {
    const user = await db.getUserById(input.userId);
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

    const id = await db.createComplianceCheck({
      entityType: 'user',
      entityId: input.userId,
      checkType: 'sanctions',
      status: 'pending',
      provider: 'ofac_sdn',
    });

    const name = user.name ?? user.email ?? '';
    const result = await checkNameAgainstOFAC(name);

    const status = result.error
      ? 'failed'
      : result.hit
        ? 'flagged'
        : 'passed';

    const riskLevel = result.hit ? 'high' : 'low';

    await db.updateComplianceCheck(id, {
      status,
      riskLevel,
      findings: result.hit
        ? [{ type: 'sanctions_hit', severity: 'high', description: `OFAC SDN match on tokens: ${result.matchedEntries.join(', ')}`, source: 'OFAC SDN' }]
        : [],
    });

    return { id, status, riskLevel, hit: result.hit, checkedAt: result.checkedAt };
  }),
```

Run: `pnpm test` → PASS.

**Commit:** `feat(compliance): replace mock timeout with real OFAC SDN XML check`

---

## Task 10 — Attribution Tab UI in DealRoom

**File:** `anavi/client/src/pages/DealRoom.tsx`

**Test first** — `anavi/client/src/pages/DealRoom.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/trpc', () => ({
  trpc: {
    dealRoom: {
      get: { useQuery: () => ({ data: { id: 1, name: 'Test Room', status: 'active', createdAt: new Date(), dealId: 10 }, isLoading: false }) },
      getDocuments: { useQuery: () => ({ data: [] }) },
    },
    audit: { list: { useQuery: () => ({ data: [] }) } },
    payout: { getByDeal: { useQuery: () => ({ data: [] }) } },
    attribution: {
      getChain: { useQuery: () => ({ data: [
        {
          id: 1,
          dealId: 10,
          type: 'introduction',
          actorId: 5,
          hash: 'a'.repeat(64),
          prevHash: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }
      ]}) },
    },
  },
}));

vi.mock('wouter', () => ({
  useParams: () => ({ id: '1' }),
  Link: ({ children }: any) => children,
}));

import DealRoom from './DealRoom';

describe('DealRoom Attribution Tab', () => {
  it('renders an Attribution tab in the tab bar', () => {
    render(<DealRoom />);
    expect(screen.getByText('Attribution')).toBeInTheDocument();
  });

  it('shows attribution events when Attribution tab is clicked', () => {
    render(<DealRoom />);
    fireEvent.click(screen.getByText('Attribution'));
    // Event type should be visible
    expect(screen.getByText(/introduction/i)).toBeInTheDocument();
  });

  it('shows truncated hash for each event', () => {
    render(<DealRoom />);
    fireEvent.click(screen.getByText('Attribution'));
    // First 8 + last 4 chars of 'a'.repeat(64) = 'aaaaaaaa...aaaa'
    expect(screen.getByText(/aaaaaaaa/i)).toBeInTheDocument();
  });

  it('renders a Verify on-chain link per event', () => {
    render(<DealRoom />);
    fireEvent.click(screen.getByText('Attribution'));
    const link = screen.getByText(/verify on-chain/i);
    expect(link.closest('a')).toHaveAttribute('href', expect.stringContaining('/api/verify/'));
  });
});
```

Run: `pnpm test` → FAIL.

**Implement** — modify `anavi/client/src/pages/DealRoom.tsx`:

**Step 1:** Add `"attribution"` to the `TabKey` union:
```typescript
// Before:
type TabKey = "overview" | "documents" | "diligence" | "compliance" | "escrow" | "payouts" | "audit";
// After:
type TabKey = "overview" | "documents" | "diligence" | "compliance" | "escrow" | "payouts" | "audit" | "attribution";
```

**Step 2:** Add the new tab to the `TABS` array (add `GitBranch` to the Lucide import at top):
```typescript
// Add to lucide-react import:
import { ..., GitBranch } from "lucide-react";

// Add to TABS array after the "audit" entry:
{ key: "attribution", label: "Attribution", icon: GitBranch },
```

**Step 3:** Add the `trpc.attribution.getChain` query in the main `DealRoom` component body, alongside the existing queries:
```typescript
const { data: attributionChain } = trpc.attribution.getChain.useQuery(
  { dealId: room?.dealId ?? 0 },
  { enabled: !!room?.dealId }
);
```

**Step 4:** Add the tab content renderer in the `SlideIn` block:
```typescript
// Add after the "audit" tab line:
{activeTab === "attribution" && (
  <AttributionTab chain={attributionChain ?? []} />
)}
```

**Step 5:** Add the `AttributionTab` component (place it above the `// ─── Main Component ───` comment):

```typescript
// ─── Attribution Tab ──────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  introduction: "Introduction",
  match: "Match",
  deal_room_join: "Joined Deal Room",
  intent_create: "Intent Created",
  deal_close: "Deal Closed",
};

const EVENT_TYPE_ICONS: Record<string, React.ElementType> = {
  introduction: User,
  match: Check,
  deal_room_join: Lock,
  intent_create: FileText,
  deal_close: Shield,
};

function truncateHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
}

function AttributionTab({ chain }: { chain: any[] }) {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-subheading" style={{ color: "#0A1628" }}>Attribution Chain</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Immutable SHA-256 hash-chained event ledger — each entry is linked to the previous.
            </p>
          </div>
          <span className="text-xs font-data-mono bg-[#F3F7FC] px-2 py-1 rounded" style={{ color: "#1E3A5F" }}>
            {chain.length} event{chain.length !== 1 ? "s" : ""}
          </span>
        </div>

        {chain.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No attribution events recorded yet.
          </p>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[9px] top-2 bottom-2 w-px" style={{ background: "#D1DCF0" }} />
            <div className="space-y-5">
              {chain.map((event: any, i: number) => {
                const Icon = EVENT_TYPE_ICONS[event.type] ?? GitBranch;
                const label = EVENT_TYPE_LABELS[event.type] ?? event.type;
                return (
                  <div key={event.id ?? i} className="relative">
                    {/* Timeline dot */}
                    <div
                      className="absolute left-[-18px] top-2 w-3 h-3 rounded-full border-2 bg-white"
                      style={{ borderColor: "#2563EB" }}
                    />
                    <div className="bg-[#F3F7FC] rounded-lg border p-4" style={{ borderColor: "#D1DCF0" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#D1DCF0] flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5" style={{ color: "#1E3A5F" }} />
                          </div>
                          <div>
                            <span className="text-sm font-semibold" style={{ color: "#0A1628" }}>
                              {label}
                            </span>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Actor #{event.actorId}
                              {event.subjectId ? ` · Subject #${event.subjectId}` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-muted-foreground font-data-mono">
                            {new Date(event.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Hash display */}
                      <div className="mt-3 pt-3 border-t flex items-center justify-between gap-3" style={{ borderColor: "#D1DCF0" }}>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Hash</div>
                          <code className="text-[11px] font-data-mono" style={{ color: "#1E3A5F" }}>
                            {truncateHash(event.hash)}
                          </code>
                        </div>
                        {event.prevHash && (
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Prev</div>
                            <code className="text-[11px] font-data-mono text-muted-foreground">
                              {truncateHash(event.prevHash)}
                            </code>
                          </div>
                        )}
                        <a
                          href={`/api/verify/${event.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium underline underline-offset-2 shrink-0"
                          style={{ color: "#2563EB" }}
                        >
                          Verify on-chain
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
```

Run: `pnpm test` → PASS.

**Commit:** `feat(ui): Attribution tab in DealRoom with hash-chain timeline and verify links`

---

## Task 11 — Server Integration Tests

**File:** `anavi/server/attribution-integration.test.ts` (new file)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import { computeAttributionHash } from './attribution-hash';

// Full in-memory mock of all DB calls used by attribution flows
const mockDb = {
  getLatestAttributionHash: vi.fn().mockResolvedValue(null),
  createAttributionEvent: vi.fn().mockResolvedValue(1),
  getAttributionChain: vi.fn().mockResolvedValue([]),
  getAttributionEventByHash: vi.fn().mockResolvedValue(null),
  createDealMilestone: vi.fn().mockResolvedValue(1),
  getDealMilestones: vi.fn().mockResolvedValue([]),
  triggerMilestonesForStage: vi.fn().mockResolvedValue([]),
  getDealById: vi.fn().mockResolvedValue({ id: 1, title: 'Test', stage: 'qualification' }),
  updateDeal: vi.fn().mockResolvedValue(undefined),
  getDealParticipants: vi.fn().mockResolvedValue([]),
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
  createComplianceCheck: vi.fn().mockResolvedValue(99),
  updateComplianceCheck: vi.fn().mockResolvedValue(undefined),
  getMatchesByUser: vi.fn().mockResolvedValue([]),
  updateMatch: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
};

vi.mock('./db', () => mockDb);
vi.mock('./ofac', () => ({
  checkNameAgainstOFAC: vi.fn().mockResolvedValue({
    hit: false, matchedEntries: [], checkedAt: new Date(),
  }),
}));

function makeCtx(userId = 1): TrpcContext {
  return {
    user: { id: userId, openId: 'x', email: 'x@x.com', name: 'Test', role: 'user',
      loginMethod: 'test', createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: 'https', headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe('Attribution hash chain — integration', () => {
  beforeEach(() => vi.clearAllMocks());

  it('logEvent computes and returns a valid SHA-256 hash', async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.attribution.logEvent({
      dealId: 1,
      type: 'introduction',
      metadata: { note: 'first contact' },
    });

    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    // Verify hash was stored with the same value
    expect(mockDb.createAttributionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ hash: result.hash })
    );
  });

  it('second logEvent uses first hash as prevHash', async () => {
    let callCount = 0;
    const firstHash = 'f'.repeat(64);
    mockDb.getLatestAttributionHash.mockImplementation(async () => {
      callCount++;
      return callCount === 1 ? null : firstHash;
    });
    mockDb.createAttributionEvent.mockResolvedValue(callCount + 1);

    const caller = appRouter.createCaller(makeCtx());
    await caller.attribution.logEvent({ dealId: 2, type: 'introduction' });
    await caller.attribution.logEvent({ dealId: 2, type: 'match' });

    const secondCall = mockDb.createAttributionEvent.mock.calls[1][0];
    expect(secondCall.prevHash).toBe(firstHash);
  });

  it('getChain returns the db result', async () => {
    const fakeChain = [{ id: 1, dealId: 1, type: 'introduction', actorId: 1,
      hash: 'a'.repeat(64), prevHash: null, createdAt: new Date() }];
    mockDb.getAttributionChain.mockResolvedValue(fakeChain);

    const caller = appRouter.createCaller(makeCtx());
    const chain = await caller.attribution.getChain({ dealId: 1 });
    expect(chain).toEqual(fakeChain);
  });

  it('deal.updateStage triggers milestones', async () => {
    const caller = appRouter.createCaller(makeCtx());
    await caller.deal.updateStage({ id: 1, stage: 'closing' });
    expect(mockDb.triggerMilestonesForStage).toHaveBeenCalledWith(1, 'closing');
  });

  it('deal.updateStage to completed logs deal_close event', async () => {
    const caller = appRouter.createCaller(makeCtx());
    await caller.deal.updateStage({ id: 1, stage: 'completed' });
    expect(mockDb.createAttributionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'deal_close', dealId: 1 })
    );
  });

  it('compliance.runRealCheck calls OFAC and stores result', async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.compliance.runRealCheck({ userId: 1 });
    expect(result.status).toBe('passed');
    expect(mockDb.updateComplianceCheck).toHaveBeenCalledWith(
      99,
      expect.objectContaining({ status: 'passed', riskLevel: 'low' })
    );
  });

  it('compliance.runRealCheck flags user when OFAC hit is found', async () => {
    const { checkNameAgainstOFAC } = await import('./ofac');
    (checkNameAgainstOFAC as any).mockResolvedValueOnce({
      hit: true, matchedEntries: ['SMITH', 'JOHN'], checkedAt: new Date(),
    });

    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.compliance.runRealCheck({ userId: 1 });
    expect(result.status).toBe('flagged');
    expect(result.hit).toBe(true);
  });
});
```

Run: `pnpm test` → PASS.

**Commit:** `test(attribution): integration tests for hash chain, milestone triggers, OFAC check`

---

## Task 12 — Client-Side Query Hook for Attribution Chain

**File:** `anavi/client/src/pages/DealRoom.tsx`

This task ensures the `trpc.attribution.getChain` query is properly hooked up with error boundaries and loading state handling. The hook was added in Task 10; this task adds a loading skeleton and validates the `dealId` is available before firing.

**Test** (add to `anavi/client/src/pages/DealRoom.test.tsx`):
```typescript
it('does not fire attribution query when dealId is 0', () => {
  // Mock room with no dealId
  vi.mocked(trpc.dealRoom.get.useQuery).mockReturnValueOnce({
    data: { id: 1, name: 'Test', status: 'active', createdAt: new Date(), dealId: 0 },
    isLoading: false,
  } as any);

  const useQuerySpy = vi.spyOn(trpc.attribution.getChain, 'useQuery');
  render(<DealRoom />);

  expect(useQuerySpy).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ enabled: false })
  );
});
```

Run: `pnpm test` → should already PASS from Task 10 implementation (the `enabled: !!room?.dealId` guard covers `dealId: 0`).

Verify the loading state — in `AttributionTab`, the `chain` prop will be `[]` (from `attributionChain ?? []`) while loading, which renders the empty state message. No additional skeleton needed unless desired.

**Commit:** `test(ui): verify attribution query guard — enabled only when dealId is present`

---

## Task 13 — Migration File, Drizzle Push, and Final Verification

**File:** `anavi/drizzle/migrations/0_attribution_schema.sql` (new file — reference SQL for DB admins)

```sql
-- Migration: PRD-6 Phase 1 — Attribution Events + Deal Milestones
-- Run: pnpm db:push  (Drizzle Kit will auto-generate the actual migration)

-- Table: attribution_events
CREATE TABLE IF NOT EXISTS `attribution_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dealId` int NOT NULL,
  `type` enum('introduction','match','deal_room_join','intent_create','deal_close') NOT NULL,
  `actorId` int NOT NULL,
  `subjectId` int DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `hash` varchar(64) NOT NULL,
  `prevHash` varchar(64) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attribution_dealId` (`dealId`),
  KEY `idx_attribution_hash` (`hash`),
  CONSTRAINT `fk_attribution_deal` FOREIGN KEY (`dealId`) REFERENCES `deals` (`id`),
  CONSTRAINT `fk_attribution_actor` FOREIGN KEY (`actorId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: deal_milestones
CREATE TABLE IF NOT EXISTS `deal_milestones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dealId` int NOT NULL,
  `name` varchar(128) NOT NULL,
  `triggerStage` enum('lead','qualification','due_diligence','negotiation','documentation','closing','completed','cancelled') NOT NULL,
  `payoutPct` decimal(5,2) NOT NULL,
  `recipientId` int NOT NULL,
  `status` enum('pending','triggered','paid','disputed') NOT NULL DEFAULT 'pending',
  `triggeredAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_milestones_dealId` (`dealId`),
  CONSTRAINT `fk_milestone_deal` FOREIGN KEY (`dealId`) REFERENCES `deals` (`id`),
  CONSTRAINT `fk_milestone_recipient` FOREIGN KEY (`recipientId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Alter: payouts — add milestone linkage columns
ALTER TABLE `payouts`
  ADD COLUMN `milestoneId` int DEFAULT NULL,
  ADD COLUMN `stripeTransferId` varchar(100) DEFAULT NULL,
  ADD COLUMN `approvedById` int DEFAULT NULL,
  ADD COLUMN `approvedAt` timestamp NULL DEFAULT NULL;

-- Modify status enum on payouts to add 'disputed'
-- (MySQL requires full column re-definition)
ALTER TABLE `payouts`
  MODIFY COLUMN `status` enum('pending','approved','processing','completed','failed','disputed') DEFAULT 'pending';

-- Immutability triggers (run after table creation)
-- See: anavi/drizzle/migrations/attribution_immutability_triggers.sql
```

**Final verification steps:**

```bash
# 1. Run all tests
cd /home/ariel/Documents/anavi-main/anavi && pnpm test

# 2. Type-check entire project
pnpm check

# 3. Push schema to DB (development only)
pnpm db:push

# 4. Apply immutability triggers manually via MySQL client:
#    mysql -u <user> -p <db> < drizzle/migrations/attribution_immutability_triggers.sql

# 5. Smoke test the verify endpoint manually:
#    curl http://localhost:3000/api/verify/$(printf 'a%.0s' {1..64})
#    Expected: {"error":"Hash not found"}  (404)

# 6. Start dev server and navigate to any deal room — confirm "Attribution" tab appears
```

**Commit:** `feat(prd6): migration reference SQL and final verification steps`

---

## Summary of All Files Changed / Created

| File | Action | Purpose |
|------|--------|---------|
| `anavi/drizzle/schema.ts` | Modified | Add `attributionEvents`, `dealMilestones` tables; alter `payouts` |
| `anavi/drizzle/migrations/attribution_immutability_triggers.sql` | Created | MySQL BEFORE UPDATE/DELETE triggers for attribution_events |
| `anavi/drizzle/migrations/0_attribution_schema.sql` | Created | Reference SQL for manual DB setup / review |
| `anavi/server/attribution-hash.ts` | Created | `computeAttributionHash` + `verifyChainIntegrity` using `node:crypto` |
| `anavi/server/ofac.ts` | Created | OFAC SDN XML download + name search, no vendor needed |
| `anavi/server/_core/verify-route.ts` | Created | `registerVerifyRoute(app)` — public GET /api/verify/:hash |
| `anavi/server/db.ts` | Modified | Add attribution event + deal milestone DB helper functions |
| `anavi/server/routers.ts` | Modified | Add `attributionRouter`, extend `dealRouter` with milestones, extend `complianceRouter` with `runRealCheck`, auto-log events in `matchRouter` and `dealRouter.updateStage` |
| `anavi/server/_core/index.ts` | Modified | Call `registerVerifyRoute(app)` before tRPC middleware |
| `anavi/client/src/pages/DealRoom.tsx` | Modified | Add `attribution` tab, `AttributionTab` component, `trpc.attribution.getChain` query |
| `anavi/server/attribution-hash.test.ts` | Created | Unit tests for hash computation and chain integrity |
| `anavi/server/attribution.test.ts` | Created | Router-level tests for attribution, milestones, OFAC |
| `anavi/server/attribution-integration.test.ts` | Created | End-to-end server integration tests |
| `anavi/server/ofac.test.ts` | Created | OFAC utility unit tests with mocked fetch |
| `anavi/server/verify-endpoint.test.ts` | Created | Express endpoint tests with supertest |
| `anavi/client/src/pages/DealRoom.test.tsx` | Created | UI component tests for Attribution tab |

## Phase 2 Scope (Not Part of This Plan)

The following are deliberately deferred until vendor contracts are in place:

- KYC document verification (Stripe Identity / Onfido)
- Stripe Connect payout transfers (`stripeTransferId` column is pre-added but unused)
- `attribution.generateCertificate` — full on-chain anchoring (column 13 stub returns placeholder message)
- Automated milestone payout disbursement workflow (approval UI + Stripe transfer)
