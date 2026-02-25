# PRD-W2: Cryptographic Relationship Custody Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement real SHA-256 hash chains for relationship timestamps, enforce blind exposure, calculate deal attribution chains, and detect follow-on deals.

**Architecture:** Node.js built-in `crypto` module for SHA-256 hashing (no new dependencies). Hash chain links each relationship to the user's prior relationship hash — same pattern as auditLog. Attribution chain calculated at deal creation time by walking the relationships table. Public verification endpoint added as a plain Express route (not tRPC) so it's accessible without auth.

**Tech Stack:** Node.js crypto (built-in), Drizzle ORM (mysql2), Vitest, tRPC v11, Express.

---

## Codebase Reality Check

Before writing any code, understand the actual schema and file structure:

**Schema facts (from `/home/ariel/Documents/anavi-main/anavi/drizzle/schema.ts`):**
- `relationships` table has: `id`, `ownerId`, `contactId`, `timestampHash` (varchar 128), `timestampProof` (text), `establishedAt`, `isBlind` (boolean, default true), `consentGiven` (boolean, default false), `exposureLevel`, `attributionChain` (json, `number[]`), `introducedBy`
- `deals` table does NOT have `attributionChain`, `isFollowOn`, or `originalDealId` — these fields are on `payouts` (lines 535-536) and `relationships` (line 154) respectively
- `payouts` table has: `isFollowOn` (boolean), `originalDealId` (int), `payoutType` enum (`originator_fee`, `introducer_fee`, `advisor_fee`, `milestone_bonus`, `success_fee`)
- `dealParticipants` table has: `relationshipId` (int), `attributionPercentage` (decimal), `introducedBy` (int)
- `auditLog` table has: `prevHash` (varchar 64), `hash` (varchar 64) — the chain pattern to replicate

**Key file structure:**
- DB functions split by domain: `anavi/server/db/relationships.ts`, `anavi/server/db/deals.ts`, `anavi/server/db/audit.ts`, etc., all re-exported via `anavi/server/db/index.ts`
- The existing `generateTimestampHash` in `anavi/server/db/relationships.ts` uses a simple `${ownerId}:${contactId}:${timestamp}` string — NOT a chain. Replace this entirely.
- The auditLog hash chain pattern lives in `anavi/server/db/audit.ts` — study it carefully

**Gap summary:**
- `createRelationship` in `anavi/server/db/relationships.ts` calls `generateTimestampHash(ownerId, contactId, establishedAt)` which hashes a plain string, ignores `prevHash`, and never writes `timestampProof`
- `relationship.list` (router) calls `getRelationshipsByOwner(ownerId)` which has no blind enforcement
- `relationship.get` (router) checks `ownerId` but not `isBlind` for the caller's perspective
- `deal.create` (router) never calls any attribution chain logic
- No follow-on detection exists anywhere
- No public verification endpoint exists

---

## Task 1: SHA-256 Hash Chain Utility

**Files:**
- Create: `anavi/server/_core/hashchain.ts`
- Create: `anavi/server/hashchain.test.ts`

### Step 1: Write the failing test

Create `/home/ariel/Documents/anavi-main/anavi/server/hashchain.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  generateRelationshipHash,
  verifyRelationshipHash,
  getLastRelationshipHash,
} from "./_core/hashchain";

// Mock the db module so getLastRelationshipHash can be tested without a real DB
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

describe("generateRelationshipHash", () => {
  it("produces a 64-character lowercase hex SHA-256 hash", () => {
    const { hash, proof } = generateRelationshipHash({
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
      prevHash: "0".repeat(64),
    });

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(proof).toBeTruthy();
    expect(proof.length).toBeGreaterThan(0);
  });

  it("produces different hashes for different prevHash values", () => {
    const base = {
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
    };
    const { hash: hash1 } = generateRelationshipHash({
      ...base,
      prevHash: "0".repeat(64),
    });
    const { hash: hash2 } = generateRelationshipHash({
      ...base,
      prevHash: "a".repeat(64),
    });

    expect(hash1).not.toBe(hash2);
  });

  it("produces deterministic output for the same input", () => {
    const input = {
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
      prevHash: "0".repeat(64),
    };
    const { hash: hash1 } = generateRelationshipHash(input);
    const { hash: hash2 } = generateRelationshipHash(input);

    expect(hash1).toBe(hash2);
  });
});

describe("verifyRelationshipHash", () => {
  it("returns true for a valid hash/proof pair", () => {
    const { hash, proof } = generateRelationshipHash({
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
      prevHash: "0".repeat(64),
    });

    expect(verifyRelationshipHash(hash, proof)).toBe(true);
  });

  it("returns false when hash is tampered", () => {
    const { proof } = generateRelationshipHash({
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
      prevHash: "0".repeat(64),
    });

    const tamperedHash = "deadbeef" + "0".repeat(56);
    expect(verifyRelationshipHash(tamperedHash, proof)).toBe(false);
  });

  it("returns false when proof is tampered", () => {
    const { hash } = generateRelationshipHash({
      ownerId: 1,
      contactId: 2,
      establishedAt: "2026-01-01T00:00:00.000Z",
      prevHash: "0".repeat(64),
    });

    const tamperedProof = Buffer.from(
      JSON.stringify({ ownerId: 99, contactId: 99, establishedAt: "tampered", prevHash: "0".repeat(64) })
    ).toString("base64");

    expect(verifyRelationshipHash(hash, tamperedProof)).toBe(false);
  });
});

describe("getLastRelationshipHash", () => {
  it("returns genesis hash (64 zeros) when DB is unavailable", async () => {
    const result = await getLastRelationshipHash(1);
    expect(result).toBe("0".repeat(64));
    expect(result).toHaveLength(64);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test hashchain
```

Expected error:
```
Cannot find module './_core/hashchain'
```

### Step 3: Write minimal implementation

Create `/home/ariel/Documents/anavi-main/anavi/server/_core/hashchain.ts`:

```typescript
import { createHash } from "crypto";
import { eq, desc } from "drizzle-orm";
import { relationships } from "../../drizzle/schema";
import { getDb } from "../db";

export const GENESIS_HASH = "0".repeat(64);

export interface RelationshipHashPayload {
  ownerId: number;
  contactId: number;
  establishedAt: string;
  prevHash: string;
}

/**
 * Returns the most recent timestampHash for a given owner, or the genesis
 * hash (64 zeros) if the user has no prior relationships or DB is unavailable.
 * Mirrors the pattern in db/audit.ts: `logAuditEvent` reads last row's hash.
 */
export async function getLastRelationshipHash(ownerId: number): Promise<string> {
  const db = await getDb();
  if (!db) return GENESIS_HASH;

  const last = await db
    .select({ timestampHash: relationships.timestampHash })
    .from(relationships)
    .where(eq(relationships.ownerId, ownerId))
    .orderBy(desc(relationships.establishedAt))
    .limit(1);

  return last[0]?.timestampHash ?? GENESIS_HASH;
}

/**
 * Generates a SHA-256 hash and base64 proof for a relationship.
 * Payload is JSON-serialised deterministically and hashed.
 * Proof is the base64 encoding of the raw JSON so it can be re-hashed on
 * verification without storing the raw inputs separately.
 */
export function generateRelationshipHash(payload: RelationshipHashPayload): {
  hash: string;
  proof: string;
} {
  const canonical = JSON.stringify({
    ownerId: payload.ownerId,
    contactId: payload.contactId,
    establishedAt: payload.establishedAt,
    prevHash: payload.prevHash,
  });

  const hash = createHash("sha256").update(canonical).digest("hex");
  const proof = Buffer.from(canonical).toString("base64");

  return { hash, proof };
}

/**
 * Verifies that a stored hash matches the stored proof.
 * Decodes the proof (base64 → JSON), re-hashes it, and compares.
 * Returns false on any decoding or hashing error.
 */
export function verifyRelationshipHash(hash: string, proof: string): boolean {
  try {
    const canonical = Buffer.from(proof, "base64").toString("utf8");
    const recomputed = createHash("sha256").update(canonical).digest("hex");
    return recomputed === hash;
  } catch {
    return false;
  }
}
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test hashchain
```

Expected output:
```
✓ anavi/server/hashchain.test.ts (7)
  ✓ generateRelationshipHash > produces a 64-character lowercase hex SHA-256 hash
  ✓ generateRelationshipHash > produces different hashes for different prevHash values
  ✓ generateRelationshipHash > produces deterministic output for the same input
  ✓ verifyRelationshipHash > returns true for a valid hash/proof pair
  ✓ verifyRelationshipHash > returns false when hash is tampered
  ✓ verifyRelationshipHash > returns false when proof is tampered
  ✓ getLastRelationshipHash > returns genesis hash (64 zeros) when DB is unavailable
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main/anavi && \
  git add server/_core/hashchain.ts server/hashchain.test.ts && \
  git commit -m "feat: SHA-256 relationship hash chain utility"
```

---

## Task 2: Wire Hash Generation into relationship.create

**Files:**
- Modify: `anavi/server/db/relationships.ts`
- Test: add to `anavi/server/hashchain.test.ts` (or `anavi/server/anavi.test.ts`)

### Step 1: Write the failing test

Add this describe block to `/home/ariel/Documents/anavi-main/anavi/server/hashchain.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// NOTE: This block is appended to hashchain.test.ts below the existing tests.
// It needs the same vi.mock("./db") block — put it in the same file,
// extending the existing mock to include relationship functions.

// Override the db mock at the top of the file to include relationship stubs:
// vi.mock("./db", () => ({
//   getDb: vi.fn().mockResolvedValue(null),
//   createRelationship: vi.fn(),         // <-- will be set per-test
//   logAuditEvent: vi.fn().mockResolvedValue(undefined),
// }));

describe("relationship.create produces real SHA-256 hash", () => {
  it("returns a 64-char timestampHash and non-empty timestampProof", async () => {
    const { createRelationship } = await import("./db");

    // Arrange: mock createRelationship to simulate DB insert returning hash data
    vi.mocked(createRelationship).mockResolvedValueOnce({
      id: 1,
      timestampHash: "a".repeat(64), // placeholder — real impl will set this
      timestampProof: "someproof",
      establishedAt: new Date(),
    });

    const user: NonNullable<TrpcContext["user"]> = {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx: TrpcContext = {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.relationship.create({ contactId: 2 });

    expect(result.timestampHash).toHaveLength(64);
    expect(result.timestampHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.timestampProof).toBeTruthy();
  });
});
```

**Actual test strategy for this task:** Since `createRelationship` is the DB layer function doing the hashing, the real test is at the DB layer. The integration test above validates the router passes through the hash. The critical unit test is: call `createRelationship(...)` with a mocked DB and verify the returned `timestampHash` is 64 hex chars and `timestampProof` is non-empty base64.

A cleaner test (add to `hashchain.test.ts`):

```typescript
describe("createRelationship sets real hash chain fields", () => {
  it("calls generateRelationshipHash and stores hash + proof", async () => {
    // Import the function under test directly to test the DB layer in isolation
    // Since createRelationship calls getDb() which returns null in test env,
    // we need to mock getDb to return a mock DB object.

    const mockInsertResult = [{ insertId: 42 }];
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // no prior relationship → genesis hash
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(mockInsertResult),
    };

    const { getDb } = await import("./db");
    vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);
    // Second call for getLastRelationshipHash (inside createRelationship):
    vi.mocked(getDb).mockResolvedValueOnce(mockDb as any);

    // Import after mocking
    const { createRelationship } = await import("./db/relationships");

    const result = await createRelationship({
      ownerId: 1,
      contactId: 2,
    });

    expect(result.id).toBe(42);
    expect(result.timestampHash).toHaveLength(64);
    expect(result.timestampHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.timestampProof).toBeTruthy();
    expect(typeof result.timestampProof).toBe("string");

    // Verify the DB insert was called with hash and proof
    const insertedValues = mockDb.values.mock.calls[0][0];
    expect(insertedValues.timestampHash).toHaveLength(64);
    expect(insertedValues.timestampProof).toBeTruthy();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test hashchain
```

Expected error: The test for `createRelationship sets real hash chain fields` will fail because `createRelationship` currently uses `generateTimestampHash` (a plain string hash with no chain), never calls `getLastRelationshipHash`, and never sets `timestampProof`.

### Step 3: Write minimal implementation

Modify `/home/ariel/Documents/anavi-main/anavi/server/db/relationships.ts`.

Replace the `generateTimestampHash` function and update `createRelationship`:

**Remove** the existing `generateTimestampHash` function (lines 6-9) and update `createRelationship` to use the new chain utility:

```typescript
import { eq, desc, or, inArray } from "drizzle-orm";
import { relationships, contactHandles, users } from "../../drizzle/schema";
import { getDb } from "./connection";
import {
  getLastRelationshipHash,
  generateRelationshipHash,
} from "../_core/hashchain";

export async function createRelationship(data: {
  ownerId: number;
  contactId: number;
  relationshipType?: string;
  introducedBy?: number;
  notes?: string;
  tags?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const establishedAt = new Date();

  // Hash chain: get the previous hash for this owner, then generate new hash
  const prevHash = await getLastRelationshipHash(data.ownerId);
  const { hash: timestampHash, proof: timestampProof } = generateRelationshipHash({
    ownerId: data.ownerId,
    contactId: data.contactId,
    establishedAt: establishedAt.toISOString(),
    prevHash,
  });

  const result = await db.insert(relationships).values({
    ownerId: data.ownerId,
    contactId: data.contactId,
    timestampHash,
    timestampProof,
    establishedAt,
    relationshipType: (data.relationshipType as any) || "direct",
    introducedBy: data.introducedBy,
    notes: data.notes,
    tags: data.tags,
    attributionChain: data.introducedBy ? [data.introducedBy] : [],
  });

  return { id: result[0].insertId, timestampHash, timestampProof, establishedAt };
}
```

The rest of `relationships.ts` (lines 40 onward — `getRelationshipsByOwner`, `getRelationshipById`, etc.) remains unchanged.

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test hashchain
```

Expected output: all hash chain tests pass, including the `createRelationship sets real hash chain fields` test.

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main/anavi && \
  git add server/db/relationships.ts server/hashchain.test.ts && \
  git commit -m "feat: wire real SHA-256 hashing into relationship.create"
```

---

## Task 3: Public Verification Express Endpoint

**Files:**
- Modify: `anavi/server/_core/index.ts`
- Create: `anavi/server/verify.test.ts`

### Step 1: Write the failing test

Create `/home/ariel/Documents/anavi-main/anavi/server/verify.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// NOTE: supertest is not in package.json. Install first:
// cd /home/ariel/Documents/anavi-main/anavi && pnpm add -D supertest @types/supertest

// Mock the DB so we can inject test data
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getRelationshipByHash: vi.fn(),
}));

vi.mock("./_core/hashchain", () => ({
  verifyRelationshipHash: vi.fn(),
}));

// Import the route registration helper after mocks
// The verification route is extracted to a helper so it can be tested standalone
import { registerVerificationRoutes } from "./_core/verify";
import { getRelationshipByHash } from "./db";
import { verifyRelationshipHash } from "./_core/hashchain";

function buildTestApp() {
  const app = express();
  app.use(express.json());
  registerVerificationRoutes(app);
  return app;
}

describe("GET /api/verify/relationship/:hash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { valid: false } when hash is not found in DB", async () => {
    vi.mocked(getRelationshipByHash).mockResolvedValueOnce(undefined);

    const app = buildTestApp();
    const res = await request(app).get(
      "/api/verify/relationship/" + "a".repeat(64)
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: false });
  });

  it("returns valid:true with metadata when hash is found and verifies", async () => {
    const fakeRel = {
      id: 1,
      timestampHash: "a".repeat(64),
      timestampProof: "c29tZXByb29m", // base64("someproof")
      establishedAt: new Date("2026-01-01T00:00:00.000Z"),
      ownerId: 1,
    };
    vi.mocked(getRelationshipByHash).mockResolvedValueOnce(fakeRel as any);
    vi.mocked(verifyRelationshipHash).mockReturnValueOnce(true);

    const app = buildTestApp();
    const res = await request(app).get(
      "/api/verify/relationship/" + "a".repeat(64)
    );

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.establishedAt).toBeDefined();
    // Must NOT include name or handle
    expect(res.body.name).toBeUndefined();
    expect(res.body.handle).toBeUndefined();
    expect(res.body.email).toBeUndefined();
  });

  it("returns valid:false when hash found but proof is tampered", async () => {
    const fakeRel = {
      id: 1,
      timestampHash: "a".repeat(64),
      timestampProof: "tampered_proof",
      establishedAt: new Date("2026-01-01T00:00:00.000Z"),
      ownerId: 1,
    };
    vi.mocked(getRelationshipByHash).mockResolvedValueOnce(fakeRel as any);
    vi.mocked(verifyRelationshipHash).mockReturnValueOnce(false);

    const app = buildTestApp();
    const res = await request(app).get(
      "/api/verify/relationship/" + "a".repeat(64)
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: false });
  });
});
```

### Step 2: Run test to verify it fails

First install supertest if not present:
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm add -D supertest @types/supertest
```

Then run:
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test verify
```

Expected error:
```
Cannot find module './_core/verify'
```

### Step 3: Write minimal implementation

**Step 3a:** Add `getRelationshipByHash` to `anavi/server/db/relationships.ts`:

```typescript
export async function getRelationshipByHash(hash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(relationships)
    .where(eq(relationships.timestampHash, hash))
    .limit(1);
  return result[0];
}
```

**Step 3b:** Create `/home/ariel/Documents/anavi-main/anavi/server/_core/verify.ts`:

```typescript
import type { Express, Request, Response } from "express";
import { getRelationshipByHash } from "../db";
import { verifyRelationshipHash } from "./hashchain";

/**
 * Registers the public (no-auth) relationship hash verification endpoint.
 * Called from startServer() in index.ts, before the tRPC middleware.
 *
 * Response schema:
 *   { valid: false }                                  — hash not found or proof invalid
 *   { valid: true, establishedAt: string }            — hash found and proof verified
 *
 * Deliberately never returns name, handle, email, or any PII.
 */
export function registerVerificationRoutes(app: Express): void {
  app.get(
    "/api/verify/relationship/:hash",
    async (req: Request, res: Response) => {
      const { hash } = req.params;

      // Basic sanity check — SHA-256 hex is exactly 64 chars
      if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
        return res.status(200).json({ valid: false });
      }

      const rel = await getRelationshipByHash(hash);
      if (!rel) {
        return res.status(200).json({ valid: false });
      }

      const isValid = verifyRelationshipHash(
        rel.timestampHash,
        rel.timestampProof ?? ""
      );

      if (!isValid) {
        return res.status(200).json({ valid: false });
      }

      return res.status(200).json({
        valid: true,
        establishedAt: rel.establishedAt instanceof Date
          ? rel.establishedAt.toISOString()
          : rel.establishedAt,
      });
    }
  );
}
```

**Step 3c:** Wire into `anavi/server/_core/index.ts`.

In `startServer()`, after `registerAuthRoutes(app)` and before the tRPC middleware, add:

```typescript
import { registerVerificationRoutes } from "./verify";

// inside startServer(), after registerAuthRoutes(app):
registerVerificationRoutes(app);
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test verify
```

Expected output:
```
✓ anavi/server/verify.test.ts (3)
  ✓ GET /api/verify/relationship/:hash > returns { valid: false } when hash is not found in DB
  ✓ GET /api/verify/relationship/:hash > returns valid:true with metadata when hash is found and verifies
  ✓ GET /api/verify/relationship/:hash > returns valid:false when hash found but proof is tampered
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main/anavi && \
  git add server/_core/verify.ts server/_core/index.ts server/db/relationships.ts server/verify.test.ts && \
  git commit -m "feat: public relationship hash verification endpoint"
```

---

## Task 4: Blind Exposure Enforcement in relationship.list and relationship.get

**Files:**
- Modify: `anavi/server/db/relationships.ts` — `getRelationshipsByOwner`
- Modify: `anavi/server/routers/relationship.ts` — `get` procedure
- Test: add to `anavi/server/anavi.test.ts`

### Step 1: Write the failing test

Add this describe block to `/home/ariel/Documents/anavi-main/anavi/server/anavi.test.ts`.

Note: The existing `vi.mock("./db", ...)` at the top of `anavi.test.ts` needs to be extended to include the relationship functions used by the tests. Update the mock block at the top of the file:

```typescript
// In the existing vi.mock("./db", ...) factory, add these entries:
//   getRelationshipsByOwner: vi.fn(),
//   getRelationshipById: vi.fn(),
//   logAuditEvent: vi.fn().mockResolvedValue(undefined),
//   createRelationship: vi.fn(),
```

Then add the test describe block:

```typescript
describe("Blind Exposure Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("relationship.list", () => {
    it("does not return blind relationships belonging to another user", async () => {
      const { getRelationshipsByOwner } = await import("./db");

      // Simulate two relationships: one blind (owned by user 2), one visible
      vi.mocked(getRelationshipsByOwner).mockResolvedValueOnce([
        {
          id: 1,
          ownerId: 1,  // caller's own relationship
          contactId: 3,
          isBlind: false,
          consentGiven: true,
          timestampHash: "a".repeat(64),
          establishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          ownerId: 2,  // another user's blind relationship — should be filtered
          contactId: 4,
          isBlind: true,
          consentGiven: false,
          timestampHash: "b".repeat(64),
          establishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const { ctx } = createAuthContext(); // ctx.user.id === 1
      const caller = appRouter.createCaller(ctx);
      const result = await caller.relationship.list();

      // Only the non-blind, own relationship should be returned
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("returns caller's own blind relationship in their own list", async () => {
      const { getRelationshipsByOwner } = await import("./db");

      vi.mocked(getRelationshipsByOwner).mockResolvedValueOnce([
        {
          id: 1,
          ownerId: 1,  // caller's own blind relationship
          contactId: 3,
          isBlind: true,
          consentGiven: false,
          timestampHash: "a".repeat(64),
          establishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const { ctx } = createAuthContext(); // ctx.user.id === 1
      const caller = appRouter.createCaller(ctx);
      const result = await caller.relationship.list();

      // Owner can always see their own blind relationships
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe("relationship.get", () => {
    it("throws NOT_FOUND when caller requests another user's blind relationship", async () => {
      const { getRelationshipById } = await import("./db");

      vi.mocked(getRelationshipById).mockResolvedValueOnce({
        id: 5,
        ownerId: 2,  // owned by user 2
        contactId: 3,
        isBlind: true,
        consentGiven: false,
        timestampHash: "c".repeat(64),
        establishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const { ctx } = createAuthContext(); // ctx.user.id === 1
      const caller = appRouter.createCaller(ctx);

      await expect(caller.relationship.get({ id: 5 })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("returns relationship when caller is the owner, even if blind", async () => {
      const { getRelationshipById } = await import("./db");

      vi.mocked(getRelationshipById).mockResolvedValueOnce({
        id: 6,
        ownerId: 1,  // caller is the owner
        contactId: 3,
        isBlind: true,
        consentGiven: false,
        timestampHash: "d".repeat(64),
        establishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const { ctx } = createAuthContext(); // ctx.user.id === 1
      const caller = appRouter.createCaller(ctx);
      const result = await caller.relationship.get({ id: 6 });

      expect(result).toBeDefined();
      expect(result.id).toBe(6);
    });
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test anavi
```

Expected failures:
- `does not return blind relationships belonging to another user` — currently `list` returns all rows from `getRelationshipsByOwner` without blind filtering
- `throws NOT_FOUND when caller requests another user's blind relationship` — currently `get` only checks `ownerId`, does not enforce blind exposure for third-party callers

### Step 3: Write minimal implementation

**Step 3a:** Update `relationship.list` in `anavi/server/routers/relationship.ts`:

The current implementation:
```typescript
list: protectedProcedure.query(async ({ ctx }) => {
  return db.getRelationshipsByOwner(ctx.user.id);
}),
```

Replace with:
```typescript
list: protectedProcedure.query(async ({ ctx }) => {
  const all = await db.getRelationshipsByOwner(ctx.user.id);
  // Blind enforcement: only return rows where:
  //   - caller IS the owner (always visible to owner), OR
  //   - isBlind is false AND consentGiven is true (mutually consented)
  return all.filter(
    (rel) =>
      rel.ownerId === ctx.user.id ||
      (rel.isBlind === false && rel.consentGiven === true)
  );
}),
```

**Step 3b:** Update `relationship.get` in `anavi/server/routers/relationship.ts`:

The current implementation checks only `ownerId`. Update to also enforce blind exposure:

```typescript
get: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ ctx, input }) => {
    const rel = await db.getRelationshipById(input.id);
    if (!rel) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    // Owner can always see their own relationships
    if (rel.ownerId === ctx.user.id) {
      return rel;
    }
    // Non-owner: only visible if not blind AND consent is given
    if (rel.isBlind || !rel.consentGiven) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return rel;
  }),
```

Note: The existing `getProof` procedure should apply the same ownership check — it already does (`rel.ownerId !== ctx.user.id`), so no change needed there.

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test anavi
```

Expected output: all blind exposure tests pass, and existing tests remain green.

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main/anavi && \
  git add server/routers/relationship.ts && \
  git commit -m "feat: enforce blind exposure in relationship queries"
```

---

## Task 5: Attribution Chain Calculator

**Files:**
- Modify: `anavi/server/db/relationships.ts` — add `getRelationshipByOwnerAndContact`
- Modify: `anavi/server/db/deals.ts` — add `calculateAttributionChain`
- Modify: `anavi/server/routers/deal.ts` — call `calculateAttributionChain` in `create`
- Test: add to `anavi/server/anavi.test.ts`

### Prerequisite: Schema Reality Check

The `deals` table in `schema.ts` does NOT have an `attributionChain` column. The `attributionChain` JSON field exists on `relationships` (line 154 of schema.ts — it's an array of introducer user IDs). For deals, attribution is tracked via the `dealParticipants` table (which has `relationshipId`, `attributionPercentage`, `introducedBy`).

Therefore, `calculateAttributionChain` should:
1. Find the relationship between the deal originator and the counterparty
2. Add participants to `dealParticipants` with `relationshipId` set
3. Return the attribution chain as an array of `AttributionNode` objects for use in the router logic

There is no `attributionChain` column to update on the `deals` table itself. The plan must store attribution in `dealParticipants.relationshipId`.

### Step 1: Write the failing test

Add to `/home/ariel/Documents/anavi-main/anavi/server/anavi.test.ts`:

```typescript
describe("Deal Attribution Chain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deal.create adds originator dealParticipant with relationshipId when relationship exists", async () => {
    const { createDeal, addDealParticipant, logAuditEvent, getRelationshipForAttribution } = await import("./db");

    // Mock createDeal to return a deal ID
    vi.mocked(createDeal).mockResolvedValueOnce(10);

    // Mock getRelationshipForAttribution to return a matching relationship
    vi.mocked(getRelationshipForAttribution).mockResolvedValueOnce({
      id: 7,
      ownerId: 1,
      contactId: 99,
      timestampHash: "e".repeat(64),
      attributionChain: [],
      establishedAt: new Date("2025-01-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    // Mock addDealParticipant
    vi.mocked(addDealParticipant).mockResolvedValue(1);
    vi.mocked(logAuditEvent).mockResolvedValue(undefined);

    const { ctx } = createAuthContext(); // ctx.user.id === 1
    const caller = appRouter.createCaller(ctx);

    const result = await caller.deal.create({
      title: "Test Deal",
      dealType: "other",
      counterpartyId: 99,
    });

    expect(result.id).toBe(10);

    // addDealParticipant should have been called with a relationshipId
    const calls = vi.mocked(addDealParticipant).mock.calls;
    const originatorCall = calls.find((c) => c[0].role === "originator");
    expect(originatorCall).toBeDefined();
    expect(originatorCall?.[0].relationshipId).toBe(7);
  });

  it("deal.create adds originator participant without relationshipId when no relationship exists", async () => {
    const { createDeal, addDealParticipant, logAuditEvent, getRelationshipForAttribution } = await import("./db");

    vi.mocked(createDeal).mockResolvedValueOnce(11);
    vi.mocked(getRelationshipForAttribution).mockResolvedValueOnce(undefined);
    vi.mocked(addDealParticipant).mockResolvedValue(1);
    vi.mocked(logAuditEvent).mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.deal.create({
      title: "Test Deal 2",
      dealType: "other",
      counterpartyId: 55,
    });

    const calls = vi.mocked(addDealParticipant).mock.calls;
    const originatorCall = calls.find((c) => c[0].role === "originator");
    expect(originatorCall).toBeDefined();
    // No relationship found, so no relationshipId
    expect(originatorCall?.[0].relationshipId).toBeUndefined();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test anavi
```

Expected errors:
- `getRelationshipForAttribution` does not exist in `./db`
- `deal.create` does not accept `counterpartyId`
- Attribution logic is absent from `deal.create`

### Step 3: Write minimal implementation

**Step 3a:** Add `getRelationshipForAttribution` to `anavi/server/db/relationships.ts`:

```typescript
/**
 * Finds the most recent relationship where ownerId owns a relationship with contactId.
 * Used by deal attribution to link a deal to the underlying relationship.
 */
export async function getRelationshipForAttribution(
  ownerId: number,
  contactId: number
) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(relationships)
    .where(
      and(
        eq(relationships.ownerId, ownerId),
        eq(relationships.contactId, contactId)
      )
    )
    .orderBy(desc(relationships.establishedAt))
    .limit(1);
  return result[0];
}
```

Note: this requires adding `and` to the existing import from `drizzle-orm` in `relationships.ts`.

**Step 3b:** Update `deal.create` in `anavi/server/routers/deal.ts`:

Add `counterpartyId` to the input schema and wire up attribution:

```typescript
create: protectedProcedure
  .input(z.object({
    title: z.string(),
    description: z.string().optional(),
    dealType: z.enum(['commodity_trade', 'real_estate', 'equity_investment', 'debt_financing', 'joint_venture', 'acquisition', 'partnership', 'other']),
    dealValue: z.string().optional(),
    currency: z.string().optional(),
    counterpartyId: z.number().optional(), // New: used for attribution lookup
  }))
  .mutation(async ({ ctx, input }) => {
    const { counterpartyId, ...dealData } = input;

    const dealId = await db.createDeal({
      ...dealData,
      originatorId: ctx.user.id,
      milestones: [
        { id: '1', name: 'Initial Contact', status: 'completed', completedAt: new Date().toISOString() },
        { id: '2', name: 'NDA Signed', status: 'pending', payoutTrigger: false },
        { id: '3', name: 'Due Diligence', status: 'pending', payoutTrigger: false },
        { id: '4', name: 'Term Sheet', status: 'pending', payoutTrigger: true },
        { id: '5', name: 'Documentation', status: 'pending', payoutTrigger: false },
        { id: '6', name: 'Closing', status: 'pending', payoutTrigger: true },
      ],
    });

    // Attribution chain: look up whether originator has a relationship with the counterparty
    let relationshipId: number | undefined;
    if (counterpartyId) {
      const rel = await db.getRelationshipForAttribution(ctx.user.id, counterpartyId);
      if (rel) {
        relationshipId = rel.id;
      }
    }

    await db.addDealParticipant({
      dealId,
      userId: ctx.user.id,
      role: 'originator',
      attributionPercentage: '50.00',
      relationshipId,
    });

    await db.logAuditEvent({
      userId: ctx.user.id,
      action: 'deal_created',
      entityType: 'deal',
      entityId: dealId,
      newState: { ...dealData, counterpartyId, relationshipId },
    });

    return { id: dealId };
  }),
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test anavi
```

Expected output: all attribution chain tests pass.

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main/anavi && \
  git add server/db/relationships.ts server/routers/deal.ts && \
  git commit -m "feat: calculate attribution chain on deal creation"
```

---

## Task 6: Follow-On Deal Detection

**Files:**
- Modify: `anavi/server/routers/deal.ts` — pre-insert follow-on check in `create`
- Modify: `anavi/server/db/deals.ts` — add `findCompletedDealWithCounterparty`
- Test: add to `anavi/server/anavi.test.ts`

### Schema Reality Check

`isFollowOn` and `originalDealId` exist on the `payouts` table (schema.ts lines 535-536), NOT on the `deals` table. To track follow-on status at the deal level, either:
- **Option A:** Add `isFollowOn` and `originalDealId` columns to the `deals` table (requires schema migration)
- **Option B:** Record follow-on status via the `payouts` table when the deal closes, creating a `payoutType: 'originator_fee'` payout with `isFollowOn: true`

**Recommended approach (Option B — no schema migration):** Detect follow-on at `deal.create` time, store the `originalDealId` reference in a deal metadata field or in the audit log's `metadata`, and when the deal closes (in `updateStage` → `triggerPayoutsOnDealClose`), create the lifetime attribution payout with `isFollowOn: true`. This avoids needing a schema migration.

However, if the PRD intent is to flag deals as follow-on at creation time, the cleanest path is Option A. The plan below implements Option A and includes the schema migration step.

### Step 1: Write the failing test

Add to `/home/ariel/Documents/anavi-main/anavi/server/anavi.test.ts`:

```typescript
describe("Follow-On Deal Detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets isFollowOn=true and originalDealId when a completed deal exists with counterparty", async () => {
    const { createDeal, addDealParticipant, logAuditEvent, getRelationshipForAttribution, findCompletedDealWithCounterparty } = await import("./db");

    // Prior completed deal with same counterparty
    vi.mocked(findCompletedDealWithCounterparty).mockResolvedValueOnce({
      id: 5,
      originatorId: 1,
      stage: "completed",
      title: "Old Deal",
    } as any);

    vi.mocked(getRelationshipForAttribution).mockResolvedValueOnce(undefined);
    vi.mocked(createDeal).mockResolvedValueOnce(20);
    vi.mocked(addDealParticipant).mockResolvedValue(1);
    vi.mocked(logAuditEvent).mockResolvedValue(undefined);

    const { ctx } = createAuthContext(); // ctx.user.id === 1
    const caller = appRouter.createCaller(ctx);

    const result = await caller.deal.create({
      title: "Follow-On Deal",
      dealType: "other",
      counterpartyId: 99,
    });

    expect(result.id).toBe(20);
    expect(result.isFollowOn).toBe(true);
    expect(result.originalDealId).toBe(5);
  });

  it("does not set isFollowOn when no prior completed deal exists", async () => {
    const { createDeal, addDealParticipant, logAuditEvent, getRelationshipForAttribution, findCompletedDealWithCounterparty } = await import("./db");

    vi.mocked(findCompletedDealWithCounterparty).mockResolvedValueOnce(undefined);
    vi.mocked(getRelationshipForAttribution).mockResolvedValueOnce(undefined);
    vi.mocked(createDeal).mockResolvedValueOnce(21);
    vi.mocked(addDealParticipant).mockResolvedValue(1);
    vi.mocked(logAuditEvent).mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.deal.create({
      title: "New Deal",
      dealType: "other",
      counterpartyId: 99,
    });

    expect(result.isFollowOn).toBeFalsy();
    expect(result.originalDealId).toBeUndefined();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test anavi
```

Expected errors:
- `findCompletedDealWithCounterparty` does not exist
- `deal.create` does not return `isFollowOn` or `originalDealId`
- The `deals` table does not have `isFollowOn` column (no schema migration yet)

### Step 3: Write minimal implementation

**Step 3a:** Add `isFollowOn` and `originalDealId` columns to the `deals` table in schema.ts. Add after `complianceNotes`:

```typescript
// Follow-on tracking
isFollowOn: boolean("isFollowOn").default(false),
originalDealId: int("originalDealId"),
```

Run migration:
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm db:push
```

**Step 3b:** Add `findCompletedDealWithCounterparty` to `anavi/server/db/deals.ts`:

```typescript
/**
 * Finds a completed deal where the given counterpartyId was buyer or seller
 * and the given originatorId was the originator.
 * Used for follow-on deal detection.
 */
export async function findCompletedDealWithCounterparty(
  originatorId: number,
  counterpartyId: number
) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(deals)
    .where(
      and(
        eq(deals.originatorId, originatorId),
        eq(deals.stage, "completed"),
        or(
          eq(deals.buyerId, counterpartyId),
          eq(deals.sellerId, counterpartyId)
        )
      )
    )
    .limit(1);
  return result[0];
}
```

**Step 3c:** Update `deal.create` in `anavi/server/routers/deal.ts` to detect follow-on before inserting:

```typescript
create: protectedProcedure
  .input(z.object({
    title: z.string(),
    description: z.string().optional(),
    dealType: z.enum(['commodity_trade', 'real_estate', 'equity_investment', 'debt_financing', 'joint_venture', 'acquisition', 'partnership', 'other']),
    dealValue: z.string().optional(),
    currency: z.string().optional(),
    counterpartyId: z.number().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { counterpartyId, ...dealData } = input;

    // Follow-on detection: check for prior completed deals with this counterparty
    let isFollowOn = false;
    let originalDealId: number | undefined;
    if (counterpartyId) {
      const priorDeal = await db.findCompletedDealWithCounterparty(
        ctx.user.id,
        counterpartyId
      );
      if (priorDeal) {
        isFollowOn = true;
        originalDealId = priorDeal.id;
      }
    }

    const dealId = await db.createDeal({
      ...dealData,
      originatorId: ctx.user.id,
      isFollowOn,
      originalDealId,
      milestones: [
        { id: '1', name: 'Initial Contact', status: 'completed', completedAt: new Date().toISOString() },
        { id: '2', name: 'NDA Signed', status: 'pending', payoutTrigger: false },
        { id: '3', name: 'Due Diligence', status: 'pending', payoutTrigger: false },
        { id: '4', name: 'Term Sheet', status: 'pending', payoutTrigger: true },
        { id: '5', name: 'Documentation', status: 'pending', payoutTrigger: false },
        { id: '6', name: 'Closing', status: 'pending', payoutTrigger: true },
      ],
    });

    // Attribution chain
    let relationshipId: number | undefined;
    if (counterpartyId) {
      const rel = await db.getRelationshipForAttribution(ctx.user.id, counterpartyId);
      if (rel) {
        relationshipId = rel.id;
      }
    }

    await db.addDealParticipant({
      dealId,
      userId: ctx.user.id,
      role: 'originator',
      attributionPercentage: '50.00',
      relationshipId,
    });

    await db.logAuditEvent({
      userId: ctx.user.id,
      action: 'deal_created',
      entityType: 'deal',
      entityId: dealId,
      newState: { ...dealData, counterpartyId, isFollowOn, originalDealId },
    });

    return { id: dealId, isFollowOn, originalDealId };
  }),
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test anavi
```

Expected output: all follow-on detection tests pass.

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main/anavi && \
  git add drizzle/schema.ts server/db/deals.ts server/routers/deal.ts && \
  git commit -m "feat: follow-on deal detection and lifetime attribution"
```

---

## Task 7: Attribution Proof UI in Relationships Page

**Files:**
- Modify: `anavi/client/src/pages/Relationships.tsx`
- Install: `qrcode @types/qrcode` (not currently in package.json)

### Step 1: Install QR code dependency

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm add qrcode @types/qrcode
```

Verify `qrcode` is now in `dependencies` in `package.json` before proceeding.

### Step 2: Write the failing test

Since Relationships.tsx is a React component, this is a UI test. Add a Vitest component test or describe the manual verification steps. For this plan, the "test" is a set of assertions to verify with browser dev tools after implementation:

```
Manual test checklist:
1. Navigate to /relationships
2. Each relationship card shows a "Verify" button
3. Clicking "Verify" opens a modal dialog
4. Modal shows:
   a. Truncated timestampHash (first 8 + "..." + last 8 chars)
   b. establishedAt timestamp in human-readable format
   c. A link to /api/verify/relationship/:hash (full hash)
   d. A QR code containing the full verification URL
5. Modal has a close button
6. Link opens in new tab
```

For automated testing, add to `verify.test.ts` (already covers the backend):
- The modal relies on `relationship.getProof` tRPC procedure which already exists
- The QR code is generated client-side from the URL

### Step 3: Write minimal implementation

Modify `/home/ariel/Documents/anavi-main/anavi/client/src/pages/Relationships.tsx`.

**Step 3a:** Add imports at the top of the file:

```typescript
import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { ExternalLink, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
```

**Step 3b:** Add state and proof query near the other `useState` hooks:

```typescript
const [proofModalOpen, setProofModalOpen] = useState(false);
const [selectedProofRelId, setSelectedProofRelId] = useState<number | null>(null);

const proofQuery = trpc.relationship.getProof.useQuery(
  { id: selectedProofRelId! },
  { enabled: selectedProofRelId !== null && proofModalOpen }
);
```

**Step 3c:** Add a QR canvas component:

```typescript
function QRCanvas({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 200 }, (err) => {
        if (err) console.error("QR generation error:", err);
      });
    }
  }, [url]);

  return <canvas ref={canvasRef} />;
}
```

**Step 3d:** Add a "Verify" button to each relationship card. Find where the relationship cards render (look for where `timestampHash` or `rel.id` appears in the JSX) and add:

```tsx
<button
  onClick={() => {
    setSelectedProofRelId(rel.id);
    setProofModalOpen(true);
  }}
  style={{
    fontSize: 12,
    color: COLORS.gold,
    background: "none",
    border: `1px solid ${COLORS.gold}`,
    borderRadius: 6,
    padding: "3px 10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
  }}
>
  <QrCode size={12} />
  Verify
</button>
```

**Step 3e:** Add the proof modal before the closing `</div>` of the component:

```tsx
<Dialog open={proofModalOpen} onOpenChange={setProofModalOpen}>
  <DialogContent style={{ background: COLORS.navy, border: `1px solid ${COLORS.border}`, color: "white", maxWidth: 420 }}>
    <DialogHeader>
      <DialogTitle style={{ color: COLORS.gold }}>Relationship Proof</DialogTitle>
    </DialogHeader>
    {proofQuery.isLoading && <p style={{ color: "#aaa" }}>Loading proof...</p>}
    {proofQuery.data && (() => {
      const { timestampHash, establishedAt } = proofQuery.data;
      const truncated = timestampHash
        ? `${timestampHash.slice(0, 8)}...${timestampHash.slice(-8)}`
        : "—";
      const verifyUrl = timestampHash
        ? `${window.location.origin}/api/verify/relationship/${timestampHash}`
        : "";

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>SHA-256 Hash</p>
            <code style={{ fontSize: 13, color: COLORS.gold, wordBreak: "break-all" }}>
              {truncated}
            </code>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>Established</p>
            <p style={{ fontSize: 13 }}>
              {establishedAt instanceof Date
                ? establishedAt.toLocaleString()
                : new Date(establishedAt).toLocaleString()}
            </p>
          </div>
          {verifyUrl && (
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <QRCanvas url={verifyUrl} />
              </div>
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: COLORS.blue,
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={12} />
                Open verification URL
              </a>
            </>
          )}
        </div>
      );
    })()}
  </DialogContent>
</Dialog>
```

### Step 4: Run test to verify it passes

Start the dev server and manually verify the checklist from Step 2:

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm dev
```

Then navigate to `/relationships`, click "Verify" on a card, and confirm all checklist items are met.

Run the automated tests to confirm no regressions:

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main/anavi && \
  git add client/src/pages/Relationships.tsx package.json pnpm-lock.yaml && \
  git commit -m "feat: relationship proof verification modal in UI"
```

---

## Full Test Run

After all tasks are complete, run the full test suite to confirm zero regressions:

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test
```

Expected: all existing tests pass, plus the new tests added in Tasks 1–6.

---

## Implementation Order Summary

| Task | Files Changed | Commit Message |
|------|--------------|----------------|
| 1 | `server/_core/hashchain.ts` (new), `server/hashchain.test.ts` (new) | feat: SHA-256 relationship hash chain utility |
| 2 | `server/db/relationships.ts` | feat: wire real SHA-256 hashing into relationship.create |
| 3 | `server/_core/verify.ts` (new), `server/_core/index.ts`, `server/db/relationships.ts`, `server/verify.test.ts` (new) | feat: public relationship hash verification endpoint |
| 4 | `server/routers/relationship.ts`, `server/anavi.test.ts` | feat: enforce blind exposure in relationship queries |
| 5 | `server/db/relationships.ts`, `server/db/deals.ts`, `server/routers/deal.ts`, `server/anavi.test.ts` | feat: calculate attribution chain on deal creation |
| 6 | `drizzle/schema.ts`, `server/db/deals.ts`, `server/routers/deal.ts`, `server/anavi.test.ts` | feat: follow-on deal detection and lifetime attribution |
| 7 | `client/src/pages/Relationships.tsx`, `package.json` | feat: relationship proof verification modal in UI |

---

## Key Gotchas

1. **`attributionChain` on relationships, not deals.** The schema's `attributionChain` JSON column is on the `relationships` table (an array of introducer user IDs), not on `deals`. The deals table has no such column. Attribution for deals is tracked via `dealParticipants.relationshipId`.

2. **`isFollowOn` / `originalDealId` are on `payouts`, not `deals`.** To add follow-on tracking at the deal level, a schema migration is required (Task 6, Step 3a). Without this migration, the fields do not exist on the `deals` table and cannot be written.

3. **`getDb()` returns `null` without `DATABASE_URL`.** All DB functions guard with `if (!db) return ...`. In tests, mock `getDb` to return a mock DB object rather than null so the code under test actually executes.

4. **`getLastRelationshipHash` makes a DB call inside `createRelationship`.** In tests mocking `createRelationship`, the hash chain lookup never runs. Tests for the hash value must mock at the DB layer (mock `getDb` and the Drizzle chain) or test `createRelationship` directly.

5. **The existing `generateTimestampHash` in `relationships.ts` is replaced entirely in Task 2.** It is not called from anywhere else in the codebase, so removal is safe.

6. **`supertest` is not in `package.json`.** Install it before writing the verify endpoint tests (Task 3). Alternatively, test the Express route handler directly by calling it with mock `req`/`res` objects — no supertest needed.

7. **`pnpm test` runs from the `anavi/` directory**, not the repo root. Always `cd /home/ariel/Documents/anavi-main/anavi` first.
