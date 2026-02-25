# PRD-W1: Trust Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement dynamic trust scoring, real compliance checks, badge automation, and whitelist/blacklist enforcement.

**Architecture:** Pure `calculateTrustScore(userId)` function called from verification, deal, review, and compliance side-effects. OFAC SDN XML downloaded and cached in memory (refreshed daily). Badge assignment is a pure function called immediately after score recalculation. Blacklist enforcement added to protectedProcedure middleware.

**Tech Stack:** Node.js crypto (built-in), axios for OFAC XML fetch, fast-xml-parser for XML parsing, Drizzle ORM (mysql2), Vitest, tRPC v11.

---

## Codebase Context

Before implementing, understand these key existing patterns:

- **DB layer:** All DB functions live in `anavi/server/db/` (e.g., `users.ts`, `compliance.ts`) and are re-exported via `anavi/server/db/index.ts` which is itself re-exported from `anavi/server/db.ts`. New DB files must be added to `anavi/server/db/index.ts`.
- **Schema:** `anavi/drizzle/schema.ts` — `users` table has `verificationTier`, `trustScore`, `verificationBadge`, `kybStatus`, `totalDeals`, `createdAt`. The `trustScoreHistory` table exists. The `peerReviews` table has `revieweeId`, `rating` (1–5). The `complianceChecks` table has `entityType`, `entityId`, `checkType`, `status` ('passed'/'failed'/'flagged'/'pending').
- **Existing trust score:** `recalculateTrustScore` in `anavi/server/db/users.ts` uses a naive delta/ceiling approach (score can be 0–1000). The new `calculateTrustScore` replaces this for normalized 0–100 scoring.
- **tRPC procedures:** `protectedProcedure` lives in `anavi/server/_core/trpc.ts` as a `t.procedure.use(requireUser)`. The `requireUser` middleware checks `ctx.user`; blacklist check will be added here.
- **`adminProcedure`:** Already exists in `anavi/server/_core/trpc.ts` — use it for all admin routes.
- **Test pattern:** `anavi/server/anavi.test.ts` — mocks `./db` with `vi.mock('./db', ...)`, creates context via `createAuthContext()`, uses `appRouter.createCaller(ctx)`.
- **Package manager:** `pnpm` — run all install commands from `anavi/` directory.
- **`axios`** is already in `package.json`. **`fast-xml-parser`** is NOT — must be installed.
- **Run tests from:** `anavi/` directory with `pnpm test`.

---

## Task 1: Add `userFlags` Drizzle Schema Table

**Files:**
- Modify: `anavi/drizzle/schema.ts`
- Test: `anavi/server/trust.test.ts` (create new file)

### Step 1: Write the failing test

Create `anavi/server/trust.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("Task 1: userFlags schema", () => {
  it("exports userFlags table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.userFlags).toBeDefined();
  });

  it("exports UserFlag type (inferred from table)", async () => {
    const schema = await import("../drizzle/schema");
    // If the table is defined, the type is inferred by TypeScript at compile time.
    // We verify the table has the expected columns by checking the table's SQL name.
    expect(schema.userFlags).toHaveProperty("_", expect.objectContaining({
      name: "user_flags",
    }));
  });

  it("userFlags table has required columns", async () => {
    const schema = await import("../drizzle/schema");
    const columns = Object.keys(schema.userFlags);
    // Drizzle table object exposes column names as keys
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("flagType");
    expect(columns).toContain("reason");
    expect(columns).toContain("flaggedBy");
    expect(columns).toContain("expiresAt");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "userFlags schema"
```

Expected error:
```
AssertionError: expected undefined to be defined
```

### Step 3: Write minimal implementation

In `anavi/drizzle/schema.ts`, append after the `auditLog` table (after line ~580, before `notifications`):

```typescript
// ============================================================================
// USER FLAGS (whitelist / blacklist / watchlist)
// ============================================================================

export const userFlags = mysqlTable("user_flags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  flagType: mysqlEnum("flagType", ["whitelist", "blacklist", "watchlist"]).notNull(),
  reason: text("reason"),
  flaggedBy: int("flaggedBy"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserFlag = typeof userFlags.$inferSelect;
export type InsertUserFlag = typeof userFlags.$inferInsert;
```

### Step 4: Run test to verify it passes

```bash
cd anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "userFlags schema"
```

Expected output:
```
✓ Task 1: userFlags schema > exports userFlags table
✓ Task 1: userFlags schema > exports UserFlag type (inferred from table)
✓ Task 1: userFlags schema > userFlags table has required columns
```

### Step 5: Commit

```bash
cd anavi && git add drizzle/schema.ts server/trust.test.ts && git commit -m "feat: add userFlags schema table"
```

---

## Task 2: Add `calculateTrustScore` Function to `db/users.ts`

**Files:**
- Modify: `anavi/server/db/users.ts`
- Test: `anavi/server/trust.test.ts` (add tests)

### Algorithm

| Component | Weight | Source | Max raw value |
|---|---|---|---|
| verificationTier | 30% | `users.verificationTier` enum | none=0, basic=1, enhanced=2, institutional=3 → 0/33/66/100 |
| deals | 25% | `users.totalDeals` | capped at 20 deals → score = min(totalDeals/20, 1) * 100 |
| peerReviews | 20% | `peerReviews` avg `rating` (1–5) | (avgRating - 1) / 4 * 100 |
| compliance | 15% | `complianceChecks` pass rate | passedChecks / totalChecks * 100 (0 checks = 0) |
| tenure | 10% | months since `users.createdAt` | capped at 24 months → min(months/24, 1) * 100 |

Final score = round(tier*0.30 + deals*0.25 + reviews*0.20 + compliance*0.15 + tenure*0.10), clamped 0–100.

### Step 1: Write the failing test

Append to `anavi/server/trust.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── shared mock setup ────────────────────────────────────────────────────────
// We mock the DB layer to isolate the algorithm from the database.

const mockGetDb = vi.fn();
const mockGetUserById = vi.fn();

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDb: mockGetDb,
    getUserById: mockGetUserById,
  };
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Task 2: calculateTrustScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 for a brand-new user with no activity", async () => {
    // Arrange: stub DB calls
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
      trustScoreHistory: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    expect(score).toBe(0);
  });

  it("applies verificationTier=basic → contributes 33% of 30 weight", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "basic", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
      trustScoreHistory: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    // verificationTier=basic → tierRaw=33.3, weight=0.30 → 10 pts
    // all other components = 0
    expect(score).toBe(10);
  });

  it("applies verificationTier=enhanced → contributes 66% of 30 weight", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "enhanced", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
      trustScoreHistory: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    // verificationTier=enhanced → tierRaw=66.6, weight=0.30 → 20 pts
    expect(score).toBe(20);
  });

  it("applies verificationTier=institutional → contributes 100% of 30 weight", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "institutional", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
      trustScoreHistory: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    // tierRaw=100 * 0.30 = 30
    expect(score).toBe(30);
  });

  it("caps deal component at 20 deals (= 25 pts max)", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 30, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
      trustScoreHistory: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    // dealRaw = min(30/20,1)*100 = 100; 100*0.25 = 25
    expect(score).toBe(25);
  });

  it("computes peer review component from avg rating", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [
        { rating: 5 },
        { rating: 3 },
      ],
      complianceChecks: [],
      trustScoreHistory: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    // avgRating = 4; reviewRaw = (4-1)/4*100 = 75; 75*0.20 = 15
    expect(score).toBe(15);
  });

  it("computes compliance component from pass rate", async () => {
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [
        { status: "passed" },
        { status: "passed" },
        { status: "failed" },
        { status: "failed" },
      ],
      trustScoreHistory: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    // passRate = 2/4 = 0.50; compRaw = 50; 50*0.15 = 7.5 → 8 (rounds)
    expect(score).toBe(8);
  });

  it("computes tenure component (24-month cap)", async () => {
    // User created exactly 12 months ago
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - 12);
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 0, createdAt })],
      peerReviews: [],
      complianceChecks: [],
      trustScoreHistory: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    // tenureRaw = min(12/24,1)*100 = 50; 50*0.10 = 5
    expect(score).toBe(5);
  });

  it("full score: institutional + 20 deals + perfect reviews + all compliance passed + 24+ months tenure = 100", async () => {
    const createdAt = new Date();
    createdAt.setFullYear(createdAt.getFullYear() - 3); // 3 years = 36 months
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "institutional", totalDeals: 20, createdAt })],
      peerReviews: [{ rating: 5 }, { rating: 5 }, { rating: 5 }],
      complianceChecks: [{ status: "passed" }, { status: "passed" }],
      trustScoreHistory: [],
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    const score = await calculateTrustScore(1);
    // tier=100*0.30=30, deals=100*0.25=25, reviews=100*0.20=20, comp=100*0.15=15, tenure=100*0.10=10 → 100
    expect(score).toBe(100);
  });

  it("writes result to trustScoreHistory", async () => {
    const insertSpy = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([{ insertId: 1 }]) });
    const mockDb = buildMockDb({
      users: [makeUser({ verificationTier: "none", totalDeals: 0, createdAt: new Date() })],
      peerReviews: [],
      complianceChecks: [],
      trustScoreHistory: [],
      insertSpy,
    });
    mockGetDb.mockResolvedValue(mockDb);

    const { calculateTrustScore } = await import("./db/users");
    await calculateTrustScore(1);
    expect(insertSpy).toHaveBeenCalled();
  });
});

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<{
  verificationTier: string;
  totalDeals: number;
  createdAt: Date;
  kybStatus: string;
  trustScore: string;
}>) {
  return {
    id: 1,
    verificationTier: "none",
    totalDeals: 0,
    createdAt: new Date(),
    kybStatus: "pending",
    trustScore: "0.00",
    ...overrides,
  };
}

function buildMockDb(opts: {
  users?: any[];
  peerReviews?: any[];
  complianceChecks?: any[];
  trustScoreHistory?: any[];
  insertSpy?: vi.Mock;
}) {
  // Build a chainable mock that returns different data per table
  const selectChain = (rows: any[]) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    orderBy: vi.fn().mockReturnThis(),
    // avg() aggregate result
    then: (fn: Function) => Promise.resolve(fn(rows)),
  });

  const insertFn = opts.insertSpy ?? vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  });

  // We'll need select to be context-aware. Use a simple queue approach:
  // The implementation calls: users, peerReviews, complianceChecks, trustScoreHistory (insert)
  const selectCalls: any[][] = [
    opts.users ?? [],
    opts.peerReviews ?? [],
    opts.complianceChecks ?? [],
  ];
  let callIndex = 0;

  return {
    select: vi.fn().mockImplementation(() => {
      const rows = selectCalls[callIndex++] ?? [];
      return selectChain(rows);
    }),
    insert: insertFn,
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  };
}
```

### Step 2: Run test to verify it fails

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | head -40
```

Expected error:
```
Error: calculateTrustScore is not a function
  (or) TypeError: Cannot read properties of undefined (reading 'calculateTrustScore')
```

### Step 3: Write minimal implementation

Add to `anavi/server/db/users.ts` (append at end of file):

```typescript
import { avg, count, sql } from "drizzle-orm";
import { peerReviews, complianceChecks as complianceChecksTable } from "../../drizzle/schema";

// ─── Trust Score Component Maps ───────────────────────────────────────────────

const TIER_SCORES: Record<string, number> = {
  none: 0,
  basic: 33.33,
  enhanced: 66.66,
  institutional: 100,
};

/**
 * Calculates a normalized 0–100 trust score from live DB data.
 *
 * Weights:
 *   verificationTier  30%  (none=0, basic=33, enhanced=67, institutional=100)
 *   totalDeals        25%  (capped at 20 deals = 100 raw)
 *   peerReviews       20%  (avg rating 1–5 → 0–100 via (r-1)/4*100)
 *   compliance        15%  (passed / total checks * 100; 0 checks = 0)
 *   tenure            10%  (months since createdAt, capped at 24)
 *
 * Always writes a trustScoreHistory row and updates users.trustScore.
 */
export async function calculateTrustScore(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ── 1. Fetch user ──────────────────────────────────────────────────────────
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRows.length === 0) throw new Error(`User ${userId} not found`);
  const user = userRows[0]!;

  // ── 2. Peer reviews ────────────────────────────────────────────────────────
  const reviewRows = await db
    .select()
    .from(peerReviews)
    .where(eq(peerReviews.revieweeId, userId));

  // ── 3. Compliance checks ───────────────────────────────────────────────────
  const checkRows = await db
    .select()
    .from(complianceChecksTable)
    .where(eq(complianceChecksTable.entityId, userId));

  // ── 4. Compute components ──────────────────────────────────────────────────

  // Verification tier (0–100 raw)
  const tierRaw = TIER_SCORES[user.verificationTier ?? "none"] ?? 0;

  // Deals component: cap at 20 deals
  const totalDeals = user.totalDeals ?? 0;
  const dealRaw = Math.min(totalDeals / 20, 1) * 100;

  // Peer review component: average rating scaled to 0–100
  let reviewRaw = 0;
  if (reviewRows.length > 0) {
    const avgRating =
      reviewRows.reduce((sum, r) => sum + (r.rating ?? 1), 0) / reviewRows.length;
    reviewRaw = ((avgRating - 1) / 4) * 100;
  }

  // Compliance component: pass rate
  let complianceRaw = 0;
  if (checkRows.length > 0) {
    const passed = checkRows.filter((c) => c.status === "passed").length;
    complianceRaw = (passed / checkRows.length) * 100;
  }

  // Tenure component: months since createdAt, capped at 24
  const createdAt = user.createdAt ?? new Date();
  const monthsOld =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  const tenureRaw = Math.min(monthsOld / 24, 1) * 100;

  // ── 5. Weighted sum ────────────────────────────────────────────────────────
  const rawScore =
    tierRaw * 0.3 +
    dealRaw * 0.25 +
    reviewRaw * 0.2 +
    complianceRaw * 0.15 +
    tenureRaw * 0.1;

  const score = Math.round(Math.min(Math.max(rawScore, 0), 100));

  // ── 6. Persist ─────────────────────────────────────────────────────────────
  await db.insert(trustScoreHistory).values({
    userId,
    previousScore: user.trustScore ?? "0.00",
    newScore: String(score),
    changeReason: "trust_score_recalculation",
    changeSource: "manual_adjustment",
  });

  await db
    .update(users)
    .set({ trustScore: String(score), updatedAt: new Date() })
    .where(eq(users.id, userId));

  return score;
}
```

**Important:** Also add the import for `peerReviews` and `complianceChecks` at the top of `anavi/server/db/users.ts` — the existing import line:
```typescript
import { InsertUser, users, trustScoreHistory } from "../../drizzle/schema";
```
must become:
```typescript
import { InsertUser, users, trustScoreHistory, peerReviews, complianceChecks as complianceChecksTable } from "../../drizzle/schema";
```

### Step 4: Run test to verify it passes

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|✓|✗|Task 2)"
```

Expected output:
```
✓ Task 2: calculateTrustScore > returns 0 for a brand-new user with no activity
✓ Task 2: calculateTrustScore > applies verificationTier=basic → contributes 33% of 30 weight
✓ Task 2: calculateTrustScore > applies verificationTier=enhanced → contributes 66% of 30 weight
✓ Task 2: calculateTrustScore > applies verificationTier=institutional → contributes 100% of 30 weight
✓ Task 2: calculateTrustScore > caps deal component at 20 deals (= 25 pts max)
✓ Task 2: calculateTrustScore > computes peer review component from avg rating
✓ Task 2: calculateTrustScore > computes compliance component from pass rate
✓ Task 2: calculateTrustScore > computes tenure component (24-month cap)
✓ Task 2: calculateTrustScore > full score = 100
✓ Task 2: calculateTrustScore > writes result to trustScoreHistory
```

### Step 5: Commit

```bash
cd anavi && git add server/db/users.ts server/trust.test.ts && git commit -m "feat: add calculateTrustScore algorithm"
```

---

## Task 3: Add `assignBadge` Function to `db/users.ts`

**Files:**
- Modify: `anavi/server/db/users.ts`
- Test: `anavi/server/trust.test.ts` (add tests)

### Badge assignment rules

| Condition | badge | verificationTier |
|---|---|---|
| score < 40 | `null` | `'none'` |
| score ≥ 40 | `'basic'` | `'basic'` |
| score ≥ 70 AND `kybStatus = 'approved'` | `'enhanced'` | `'enhanced'` |
| score ≥ 90 AND all `complianceChecks` for user = `'passed'` | `'institutional'` | `'institutional'` |

Rules are evaluated top-to-bottom; the highest matching rule wins.

### Step 1: Write the failing test

Append to `anavi/server/trust.test.ts`:

```typescript
describe("Task 3: assignBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const cases: Array<{
    score: number;
    kybStatus: string;
    allCompliancePassed: boolean;
    expectedBadge: string | null;
    expectedTier: string;
  }> = [
    { score: 39, kybStatus: "pending",  allCompliancePassed: false, expectedBadge: null,           expectedTier: "none" },
    { score: 40, kybStatus: "pending",  allCompliancePassed: false, expectedBadge: "basic",         expectedTier: "basic" },
    { score: 69, kybStatus: "approved", allCompliancePassed: false, expectedBadge: "basic",         expectedTier: "basic" },
    { score: 70, kybStatus: "pending",  allCompliancePassed: false, expectedBadge: "basic",         expectedTier: "basic" },
    { score: 70, kybStatus: "approved", allCompliancePassed: false, expectedBadge: "enhanced",      expectedTier: "enhanced" },
    { score: 89, kybStatus: "approved", allCompliancePassed: true,  expectedBadge: "enhanced",      expectedTier: "enhanced" },
    { score: 90, kybStatus: "approved", allCompliancePassed: false, expectedBadge: "enhanced",      expectedTier: "enhanced" },
    { score: 90, kybStatus: "approved", allCompliancePassed: true,  expectedBadge: "institutional", expectedTier: "institutional" },
    { score: 100, kybStatus: "approved", allCompliancePassed: true, expectedBadge: "institutional", expectedTier: "institutional" },
  ];

  for (const c of cases) {
    it(`score=${c.score}, kybStatus=${c.kybStatus}, allPassed=${c.allCompliancePassed} → badge=${c.expectedBadge}`, async () => {
      const complianceChecksData = c.allCompliancePassed
        ? [{ status: "passed" }, { status: "passed" }]
        : c.score >= 90
          ? [{ status: "passed" }, { status: "failed" }]
          : [];

      const mockDb = {
        select: vi.fn().mockImplementation(() => {
          let callCount = 0;
          const chain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockImplementation(() => {
              callCount++;
              // First call = user fetch, second call = complianceChecks
              if (callCount === 1) {
                return { limit: vi.fn().mockResolvedValue([makeUser({ kybStatus: c.kybStatus })]) };
              }
              return { limit: vi.fn().mockResolvedValue(complianceChecksData) };
            }),
          };
          return chain;
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };
      mockGetDb.mockResolvedValue(mockDb);

      const { assignBadge } = await import("./db/users");
      await assignBadge(1, c.score);

      const updateSpy = mockDb.update;
      expect(updateSpy).toHaveBeenCalledTimes(1);
      const setCall = updateSpy.mock.results[0].value.set;
      expect(setCall).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationBadge: c.expectedBadge,
          verificationTier: c.expectedTier,
        })
      );
    });
  }
});
```

### Step 2: Run test to verify it fails

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 3|assignBadge)"
```

Expected error:
```
Error: assignBadge is not a function
```

### Step 3: Write minimal implementation

Append to `anavi/server/db/users.ts`:

```typescript
/**
 * Assigns a verification badge based on the computed trust score.
 * Called immediately after calculateTrustScore in any side-effect.
 *
 * Badge ladder (highest matching rule wins):
 *   score ≥ 90 AND all compliance passed → 'institutional'
 *   score ≥ 70 AND kybStatus='approved'  → 'enhanced'
 *   score ≥ 40                           → 'basic'
 *   otherwise                            → null / 'none'
 */
export async function assignBadge(userId: number, score: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Fetch user for kybStatus
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRows.length === 0) throw new Error(`User ${userId} not found`);
  const user = userRows[0]!;

  // Fetch compliance checks for this user
  const checkRows = await db
    .select()
    .from(complianceChecksTable)
    .where(eq(complianceChecksTable.entityId, userId));

  const allCompliancePassed =
    checkRows.length > 0 && checkRows.every((c) => c.status === "passed");

  // Determine badge
  let badge: string | null = null;
  let tier: "none" | "basic" | "enhanced" | "institutional" = "none";

  if (score >= 90 && user.kybStatus === "approved" && allCompliancePassed) {
    badge = "institutional";
    tier = "institutional";
  } else if (score >= 70 && user.kybStatus === "approved") {
    badge = "enhanced";
    tier = "enhanced";
  } else if (score >= 40) {
    badge = "basic";
    tier = "basic";
  }

  await db
    .update(users)
    .set({ verificationBadge: badge, verificationTier: tier, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
```

### Step 4: Run test to verify it passes

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 3|✓|✗)" | head -20
```

Expected output:
```
✓ Task 3: assignBadge > score=39 ... → badge=null
✓ Task 3: assignBadge > score=40 ... → badge=basic
✓ Task 3: assignBadge > score=69 ... → badge=basic
✓ Task 3: assignBadge > score=70, kybStatus=pending ... → badge=basic
✓ Task 3: assignBadge > score=70, kybStatus=approved ... → badge=enhanced
✓ Task 3: assignBadge > score=89 ... → badge=enhanced
✓ Task 3: assignBadge > score=90, allPassed=false → badge=enhanced
✓ Task 3: assignBadge > score=90, allPassed=true → badge=institutional
✓ Task 3: assignBadge > score=100 → badge=institutional
```

### Step 5: Commit

```bash
cd anavi && git add server/db/users.ts server/trust.test.ts && git commit -m "feat: add assignBadge automation"
```

---

## Task 4: Wire `calculateTrustScore` + `assignBadge` into Verification and Deal Routers

**Files:**
- Modify: `anavi/server/routers/verification.ts`
- Modify: `anavi/server/routers/deal.ts` (already calls `recalculateTrustScore` — replace with new fn)
- Test: `anavi/server/trust.test.ts` (add tests)

### Step 1: Write the failing test

Append to `anavi/server/trust.test.ts`:

```typescript
describe("Task 4: router wiring", () => {
  // Re-mock db to expose calculateTrustScore and assignBadge as spies
  const mockCalculateTrustScore = vi.fn().mockResolvedValue(55);
  const mockAssignBadge = vi.fn().mockResolvedValue(undefined);
  const mockCreateVerificationDocument = vi.fn().mockResolvedValue(1);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.doMock("../server/db", () => ({
      calculateTrustScore: mockCalculateTrustScore,
      assignBadge: mockAssignBadge,
      createVerificationDocument: mockCreateVerificationDocument,
      // ... add other stubs as needed
    }));
  });

  it("verification.confirmUpload calls calculateTrustScore then assignBadge", async () => {
    // We import the router AFTER mocking so it picks up the mock
    const { appRouter } = await import("../server/routers");
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.verification.confirmUpload({
      fileKey: "verification/1/test-gov_id",
      documentType: "government_id",
    });

    expect(mockCalculateTrustScore).toHaveBeenCalledWith(ctx.user!.id);
    expect(mockAssignBadge).toHaveBeenCalledWith(ctx.user!.id, 55);
  });

  it("deal.updateStage to 'completed' calls calculateTrustScore for originator", async () => {
    const mockGetDealById = vi.fn().mockResolvedValue({ id: 1, title: "Test Deal", stage: "closing", originatorId: 1 });
    const mockGetDealParticipants = vi.fn().mockResolvedValue([{ userId: 1, role: "originator" }]);
    const mockUpdateDeal = vi.fn().mockResolvedValue(undefined);
    const mockTriggerPayouts = vi.fn().mockResolvedValue(undefined);
    const mockLogAudit = vi.fn().mockResolvedValue(undefined);
    const mockCreateNotification = vi.fn().mockResolvedValue(undefined);

    vi.doMock("../server/db", () => ({
      calculateTrustScore: mockCalculateTrustScore,
      assignBadge: mockAssignBadge,
      getDealById: mockGetDealById,
      getDealParticipants: mockGetDealParticipants,
      updateDeal: mockUpdateDeal,
      triggerPayoutsOnDealClose: mockTriggerPayouts,
      logAuditEvent: mockLogAudit,
      createNotification: mockCreateNotification,
    }));

    const { appRouter } = await import("../server/routers");
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.deal.updateStage({ id: 1, stage: "completed" });

    expect(mockCalculateTrustScore).toHaveBeenCalledWith(1); // originator userId
    expect(mockAssignBadge).toHaveBeenCalledWith(1, 55);
  });
});

// helper used in task 4 tests — reference the one defined earlier or redefine:
function createAuthContext() {
  const user = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    verificationTier: "none" as const,
    trustScore: "0.00",
    verificationBadge: null,
    kybStatus: "pending" as const,
    kycStatus: "pending" as const,
    participantType: null,
    onboardingStep: 0,
    onboardingCompleted: false,
    company: null, title: null, bio: null, avatar: null,
    website: null, location: null, phone: null,
    investmentFocus: null, dealVerticals: null, typicalDealSize: null,
    geographicFocus: null, yearsExperience: null, linkedinUrl: null,
    sanctionsCleared: false, pepStatus: false, adverseMediaCleared: true,
    complianceLastChecked: null, jurisdictions: null,
    totalDeals: 0, totalDealValue: "0.00", totalEarnings: "0.00",
  };
  const ctx = {
    user,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
  return { ctx };
}
```

### Step 2: Run test to verify it fails

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 4|router wiring)"
```

Expected error:
```
AssertionError: expected calculateTrustScore to have been called
```

### Step 3: Write minimal implementation

**`anavi/server/routers/verification.ts`** — modify the `confirmUpload` mutation to call score recalc after document creation:

```typescript
// At top of file, db is already imported as: import * as db from "../db";
// No new imports needed.

confirmUpload: protectedProcedure
  .input(z.object({
    fileKey: z.string(),
    documentType: z.enum([
      "government_id", "passport", "business_license", "incorporation_docs",
      "proof_of_address", "bank_statement", "tax_document", "accreditation_letter",
    ]),
  }))
  .mutation(async ({ ctx, input }) => {
    const id = await db.createVerificationDocument({
      userId: ctx.user.id,
      documentType: input.documentType,
      fileUrl: `/api/files/${input.fileKey}`,
      fileKey: input.fileKey,
      status: "pending",
    });

    // Recalculate trust score and assign badge after new document submitted
    const newScore = await db.calculateTrustScore(ctx.user.id);
    await db.assignBadge(ctx.user.id, newScore);

    return { id };
  }),
```

**`anavi/server/routers/deal.ts`** — the `updateStage` mutation already calls `recalculateTrustScore` for originators. Replace that call with the new functions:

```typescript
// Replace the existing block inside updateStage when stage === 'completed':
if (input.stage === 'completed') {
  await db.triggerPayoutsOnDealClose(input.id);
  const participants = await db.getDealParticipants(input.id);
  for (const p of participants) {
    if (p.role === 'originator') {
      // Replace old recalculateTrustScore call with the new weighted algorithm
      const newScore = await db.calculateTrustScore(p.userId);
      await db.assignBadge(p.userId, newScore);
    }
  }
}
```

### Step 4: Run test to verify it passes

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 4|✓|✗)" | head -10
```

Expected output:
```
✓ Task 4: router wiring > verification.confirmUpload calls calculateTrustScore then assignBadge
✓ Task 4: router wiring > deal.updateStage to 'completed' calls calculateTrustScore for originator
```

### Step 5: Commit

```bash
cd anavi && git add server/routers/verification.ts server/routers/deal.ts server/trust.test.ts && git commit -m "feat: wire trust score recalculation on verification and deal close"
```

---

## Task 5: OFAC SDN XML Compliance Check

**Files:**
- Create: `anavi/server/_core/ofac.ts`
- Modify: `anavi/server/routers/compliance.ts`
- Test: `anavi/server/trust.test.ts` (add tests)

### Prerequisite: Install `fast-xml-parser`

```bash
cd anavi && pnpm add fast-xml-parser
```

Verify it appears in `package.json` dependencies.

### Step 1: Write the failing test

Append to `anavi/server/trust.test.ts`:

```typescript
describe("Task 5: OFAC SDN check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache so SDN list is fresh per test
    vi.resetModules();
  });

  it("checkOfac returns true for a name matching the SDN list", async () => {
    // Mock axios to return a minimal OFAC SDN XML
    vi.doMock("axios", () => ({
      default: {
        get: vi.fn().mockResolvedValue({
          data: `<?xml version="1.0"?>
<sdnList>
  <sdnEntry>
    <lastName>BIN LADEN</lastName>
    <firstName>OSAMA</firstName>
  </sdnEntry>
  <sdnEntry>
    <lastName>CASTRO</lastName>
    <firstName>FIDEL</firstName>
  </sdnEntry>
</sdnList>`,
        }),
      },
    }));

    const { checkOfac, loadSdnList } = await import("../_core/ofac");
    await loadSdnList(); // force load with mock

    expect(checkOfac("bin laden")).toBe(true);
    expect(checkOfac("CASTRO")).toBe(true);
  });

  it("checkOfac returns false for a name NOT on the SDN list", async () => {
    vi.doMock("axios", () => ({
      default: {
        get: vi.fn().mockResolvedValue({
          data: `<?xml version="1.0"?>
<sdnList>
  <sdnEntry><lastName>SMITH</lastName></sdnEntry>
</sdnList>`,
        }),
      },
    }));

    const { checkOfac, loadSdnList } = await import("../_core/ofac");
    await loadSdnList();

    expect(checkOfac("john doe")).toBe(false);
    expect(checkOfac("JOHNSON")).toBe(false);
  });

  it("compliance.runCheck returns status=failed when entity name is on SDN list", async () => {
    vi.doMock("../_core/ofac", () => ({
      loadSdnList: vi.fn().mockResolvedValue(undefined),
      checkOfac: vi.fn().mockReturnValue(true), // Sanctioned!
    }));

    const mockCreateCheck = vi.fn().mockResolvedValue(1);
    const mockUpdateCheck = vi.fn().mockResolvedValue(undefined);
    const mockCalcScore = vi.fn().mockResolvedValue(30);

    vi.doMock("../db", () => ({
      createComplianceCheck: mockCreateCheck,
      updateComplianceCheck: mockUpdateCheck,
      calculateTrustScore: mockCalcScore,
      assignBadge: vi.fn().mockResolvedValue(undefined),
    }));

    const { appRouter } = await import("./routers");
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.compliance.runCheck({
      entityType: "user",
      entityId: 1,
      checkType: "sanctions",
      entityName: "BIN LADEN",
    });

    expect(result.status).toBe("failed");
    expect(mockUpdateCheck).toHaveBeenCalledWith(1, expect.objectContaining({
      status: "failed",
      riskLevel: "critical",
    }));
  });

  it("compliance.runCheck returns status=passed when entity name is NOT on SDN list", async () => {
    vi.doMock("../_core/ofac", () => ({
      loadSdnList: vi.fn().mockResolvedValue(undefined),
      checkOfac: vi.fn().mockReturnValue(false), // Clean
    }));

    const mockCreateCheck = vi.fn().mockResolvedValue(1);
    const mockUpdateCheck = vi.fn().mockResolvedValue(undefined);
    const mockCalcScore = vi.fn().mockResolvedValue(45);

    vi.doMock("../db", () => ({
      createComplianceCheck: mockCreateCheck,
      updateComplianceCheck: mockUpdateCheck,
      calculateTrustScore: mockCalcScore,
      assignBadge: vi.fn().mockResolvedValue(undefined),
    }));

    const { appRouter } = await import("./routers");
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.compliance.runCheck({
      entityType: "user",
      entityId: 1,
      checkType: "sanctions",
      entityName: "JANE DOE",
    });

    expect(result.status).toBe("passed");
    expect(mockUpdateCheck).toHaveBeenCalledWith(1, expect.objectContaining({
      status: "passed",
      riskLevel: "low",
    }));
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 5|OFAC)"
```

Expected error:
```
Error: Cannot find module '../_core/ofac'
```

### Step 3: Write minimal implementation

**Create `anavi/server/_core/ofac.ts`:**

```typescript
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const OFAC_SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Module-level cache
let sdnNames: string[] = [];
let lastLoaded: number | null = null;

/**
 * Downloads the OFAC SDN XML and extracts all lastName entries.
 * Caches in memory; refreshes after 24 hours.
 */
export async function loadSdnList(): Promise<void> {
  const now = Date.now();
  if (lastLoaded !== null && now - lastLoaded < REFRESH_INTERVAL_MS) {
    return; // Cache still valid
  }

  try {
    const response = await axios.get<string>(OFAC_SDN_URL, {
      responseType: "text",
      timeout: 30_000,
    });

    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(response.data);

    const entries = parsed?.sdnList?.sdnEntry;
    if (!Array.isArray(entries)) {
      console.warn("[OFAC] Unexpected XML structure — using empty list");
      sdnNames = [];
    } else {
      sdnNames = entries
        .map((e: any) => String(e?.lastName ?? "").toUpperCase().trim())
        .filter(Boolean);
    }

    lastLoaded = now;
    console.log(`[OFAC] Loaded ${sdnNames.length} SDN entries`);
  } catch (err) {
    console.error("[OFAC] Failed to load SDN list:", err);
    // Keep existing cache if available; otherwise empty
    if (sdnNames.length === 0) {
      console.warn("[OFAC] No cached SDN data — all sanctions checks will pass (safe default)");
    }
  }
}

/**
 * Returns true if the given name fuzzy-matches any entry in the SDN list.
 * Matching is case-insensitive; checks if any SDN lastName is a substring
 * of the input or vice versa.
 */
export function checkOfac(name: string): boolean {
  if (!name || sdnNames.length === 0) return false;
  const normalized = name.toUpperCase().trim();
  return sdnNames.some(
    (sdn) => normalized.includes(sdn) || sdn.includes(normalized)
  );
}

/** Exported for testing — allows resetting the cache */
export function _resetSdnCache(): void {
  sdnNames = [];
  lastLoaded = null;
}
```

**Modify `anavi/server/routers/compliance.ts`:**

```typescript
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { loadSdnList, checkOfac } from "../_core/ofac";

export const complianceRouter = router({
  getChecks: protectedProcedure
    .input(z.object({
      entityType: z.enum(["user", "deal", "relationship"]),
      entityId: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getComplianceChecks(input.entityType, input.entityId);
    }),

  runCheck: protectedProcedure
    .input(z.object({
      entityType: z.enum(["user", "deal", "relationship"]),
      entityId: z.number(),
      checkType: z.enum([
        "sanctions", "pep", "adverse_media", "aml", "kyc", "kyb", "jurisdiction",
      ]),
      entityName: z.string().optional(), // Required for sanctions checks
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createComplianceCheck({
        ...input,
        status: "pending",
        provider: "internal",
      });

      let status: "passed" | "failed" | "flagged" = "passed";
      let riskLevel: "low" | "medium" | "high" | "critical" = "low";
      const findings: Array<{ type: string; severity: string; description: string }> = [];

      if (input.checkType === "sanctions" && input.entityName) {
        // Ensure SDN list is loaded (no-op if cached and fresh)
        await loadSdnList();

        const isOnSdnList = checkOfac(input.entityName);
        if (isOnSdnList) {
          status = "failed";
          riskLevel = "critical";
          findings.push({
            type: "sanctions_match",
            severity: "critical",
            description: `Name "${input.entityName}" matched OFAC SDN list`,
          });
        }
      }

      await db.updateComplianceCheck(id, { status, riskLevel, findings });

      // Recalculate trust score for user entities
      if (input.entityType === "user") {
        const newScore = await db.calculateTrustScore(input.entityId);
        await db.assignBadge(input.entityId, newScore);
      }

      return { id, status };
    }),
});
```

**Note:** The `runCheck` input schema now includes an optional `entityName` field. Update the Zod schema accordingly.

### Step 4: Run test to verify it passes

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 5|✓|✗)" | head -10
```

Expected output:
```
✓ Task 5: OFAC SDN check > checkOfac returns true for a name matching the SDN list
✓ Task 5: OFAC SDN check > checkOfac returns false for a name NOT on the SDN list
✓ Task 5: OFAC SDN check > compliance.runCheck returns status=failed when entity name is on SDN list
✓ Task 5: OFAC SDN check > compliance.runCheck returns status=passed when entity name is NOT on SDN list
```

### Step 5: Commit

```bash
cd anavi && git add server/_core/ofac.ts server/routers/compliance.ts server/trust.test.ts package.json pnpm-lock.yaml && git commit -m "feat: wire real OFAC sanctions screening"
```

---

## Task 6: OpenCorporates KYB Check

**Files:**
- Create: `anavi/server/_core/kyb.ts`
- Modify: `anavi/server/routers/compliance.ts`
- Test: `anavi/server/trust.test.ts` (add tests)

### Step 1: Write the failing test

Append to `anavi/server/trust.test.ts`:

```typescript
describe("Task 6: OpenCorporates KYB check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("checkOpenCorporates returns found=true for a company that exists", async () => {
    vi.doMock("axios", () => ({
      default: {
        get: vi.fn().mockResolvedValue({
          data: {
            results: {
              companies: [
                {
                  company: {
                    name: "Acme Corp",
                    current_status: "Active",
                    jurisdiction_code: "us_de",
                  },
                },
              ],
            },
          },
        }),
      },
    }));

    const { checkOpenCorporates } = await import("../_core/kyb");
    const result = await checkOpenCorporates("Acme Corp", "us_de");

    expect(result.found).toBe(true);
    expect(result.status).toBe("Active");
  });

  it("checkOpenCorporates returns found=false when no results", async () => {
    vi.doMock("axios", () => ({
      default: {
        get: vi.fn().mockResolvedValue({
          data: {
            results: {
              companies: [],
            },
          },
        }),
      },
    }));

    const { checkOpenCorporates } = await import("../_core/kyb");
    const result = await checkOpenCorporates("Nonexistent LLC", "us_ca");

    expect(result.found).toBe(false);
    expect(result.status).toBe("unknown");
  });

  it("compliance.runCheck with checkType=kyb sets kybStatus=approved when company found and active", async () => {
    vi.doMock("../_core/kyb", () => ({
      checkOpenCorporates: vi.fn().mockResolvedValue({ found: true, status: "Active" }),
    }));

    const mockUpdateUserProfile = vi.fn().mockResolvedValue(undefined);
    const mockCreateCheck = vi.fn().mockResolvedValue(1);
    const mockUpdateCheck = vi.fn().mockResolvedValue(undefined);
    const mockCalcScore = vi.fn().mockResolvedValue(55);

    vi.doMock("../db", () => ({
      createComplianceCheck: mockCreateCheck,
      updateComplianceCheck: mockUpdateCheck,
      updateUserProfile: mockUpdateUserProfile,
      calculateTrustScore: mockCalcScore,
      assignBadge: vi.fn().mockResolvedValue(undefined),
    }));

    const { appRouter } = await import("./routers");
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.compliance.runCheck({
      entityType: "user",
      entityId: 1,
      checkType: "kyb",
      entityName: "Acme Corp",
      jurisdiction: "us_de",
    });

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ kybStatus: "approved" })
    );
  });

  it("compliance.runCheck with checkType=kyb sets kybStatus=rejected when company not found", async () => {
    vi.doMock("../_core/kyb", () => ({
      checkOpenCorporates: vi.fn().mockResolvedValue({ found: false, status: "unknown" }),
    }));

    const mockUpdateUserProfile = vi.fn().mockResolvedValue(undefined);
    const mockCreateCheck = vi.fn().mockResolvedValue(1);
    const mockUpdateCheck = vi.fn().mockResolvedValue(undefined);
    const mockCalcScore = vi.fn().mockResolvedValue(20);

    vi.doMock("../db", () => ({
      createComplianceCheck: mockCreateCheck,
      updateComplianceCheck: mockUpdateCheck,
      updateUserProfile: mockUpdateUserProfile,
      calculateTrustScore: mockCalcScore,
      assignBadge: vi.fn().mockResolvedValue(undefined),
    }));

    const { appRouter } = await import("./routers");
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.compliance.runCheck({
      entityType: "user",
      entityId: 1,
      checkType: "kyb",
      entityName: "Ghost Corp",
      jurisdiction: "us_ca",
    });

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ kybStatus: "rejected" })
    );
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 6|KYB|OpenCorporates)"
```

Expected error:
```
Error: Cannot find module '../_core/kyb'
```

### Step 3: Write minimal implementation

**Create `anavi/server/_core/kyb.ts`:**

```typescript
import axios from "axios";

const OPENCORPORATES_BASE = "https://api.opencorporates.com/v0.4";

export interface KybResult {
  found: boolean;
  status: string;
  name?: string;
  jurisdictionCode?: string;
}

/**
 * Queries the OpenCorporates free API to verify a company exists.
 *
 * @param companyName  Legal name of the entity to search
 * @param jurisdiction OpenCorporates jurisdiction code, e.g. "us_de", "gb"
 * @returns found=true if any match; status is the company's current_status
 */
export async function checkOpenCorporates(
  companyName: string,
  jurisdiction: string
): Promise<KybResult> {
  try {
    const response = await axios.get(`${OPENCORPORATES_BASE}/companies/search`, {
      params: {
        q: companyName,
        jurisdiction_code: jurisdiction,
      },
      timeout: 15_000,
    });

    const companies: any[] =
      response.data?.results?.companies ?? [];

    if (companies.length === 0) {
      return { found: false, status: "unknown" };
    }

    const first = companies[0]?.company;
    return {
      found: true,
      status: first?.current_status ?? "Active",
      name: first?.name,
      jurisdictionCode: first?.jurisdiction_code,
    };
  } catch (err) {
    console.error("[KYB] OpenCorporates lookup failed:", err);
    return { found: false, status: "error" };
  }
}
```

**Modify `anavi/server/routers/compliance.ts`** — add KYB branch to `runCheck`:

```typescript
import { loadSdnList, checkOfac } from "../_core/ofac";
import { checkOpenCorporates } from "../_core/kyb";

// Inside runCheck mutation, add after the sanctions block:

if (input.checkType === "kyb" && input.entityName) {
  const jurisdiction = input.jurisdiction ?? "us_de";
  const kybResult = await checkOpenCorporates(input.entityName, jurisdiction);

  if (kybResult.found && kybResult.status.toLowerCase() !== "dissolved") {
    status = "passed";
    riskLevel = "low";
    // Mark user as KYB approved
    if (input.entityType === "user") {
      await db.updateUserProfile(input.entityId, { kybStatus: "approved" });
    }
  } else {
    status = "failed";
    riskLevel = "high";
    findings.push({
      type: "kyb_not_found",
      severity: "high",
      description: `Company "${input.entityName}" not found or dissolved in ${jurisdiction}`,
    });
    if (input.entityType === "user") {
      await db.updateUserProfile(input.entityId, { kybStatus: "rejected" });
    }
  }
}
```

Also add `jurisdiction` to the Zod input schema:
```typescript
.input(z.object({
  // ... existing fields ...
  entityName: z.string().optional(),
  jurisdiction: z.string().optional(),
}))
```

### Step 4: Run test to verify it passes

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 6|✓|✗)" | head -10
```

Expected output:
```
✓ Task 6: OpenCorporates KYB check > checkOpenCorporates returns found=true for a company that exists
✓ Task 6: OpenCorporates KYB check > checkOpenCorporates returns found=false when no results
✓ Task 6: OpenCorporates KYB check > compliance.runCheck with checkType=kyb sets kybStatus=approved when company found and active
✓ Task 6: OpenCorporates KYB check > compliance.runCheck with checkType=kyb sets kybStatus=rejected when company not found
```

### Step 5: Commit

```bash
cd anavi && git add server/_core/kyb.ts server/routers/compliance.ts server/trust.test.ts && git commit -m "feat: wire OpenCorporates KYB verification"
```

---

## Task 7: Blacklist Enforcement in `protectedProcedure`

**Files:**
- Create: `anavi/server/db/flags.ts`
- Modify: `anavi/server/db/index.ts`
- Modify: `anavi/server/_core/trpc.ts`
- Test: `anavi/server/trust.test.ts` (add tests)

### Step 1: Write the failing test

Append to `anavi/server/trust.test.ts`:

```typescript
describe("Task 7: blacklist enforcement", () => {
  it("protectedProcedure returns FORBIDDEN when user has an active blacklist flag", async () => {
    const mockGetUserFlags = vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 1,
        flagType: "blacklist",
        reason: "Fraud suspected",
        flaggedBy: null,
        expiresAt: null, // Non-expiring flag
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.doMock("../db", () => ({
      getUserFlags: mockGetUserFlags,
      getUserById: vi.fn().mockResolvedValue({
        id: 1,
        openId: "test-user-123",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      }),
    }));

    const { appRouter } = await import("./routers");
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.user.getProfile()).rejects.toThrow(
      expect.objectContaining({
        code: "FORBIDDEN",
        message: "Account suspended",
      })
    );
  });

  it("protectedProcedure allows access when user has no blacklist flag", async () => {
    const mockGetUserFlags = vi.fn().mockResolvedValue([]);
    const mockGetUserById = vi.fn().mockResolvedValue({
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
      role: "user",
      verificationTier: "none",
      trustScore: "0.00",
    });

    vi.doMock("../db", () => ({
      getUserFlags: mockGetUserFlags,
      getUserById: mockGetUserById,
    }));

    const { appRouter } = await import("./routers");
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.user.getProfile();
    expect(result).toBeDefined();
  });

  it("protectedProcedure ignores expired blacklist flags", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday = expired

    const mockGetUserFlags = vi.fn().mockResolvedValue([
      {
        id: 1,
        userId: 1,
        flagType: "blacklist",
        reason: "Temporary suspension",
        flaggedBy: null,
        expiresAt: pastDate, // Already expired
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const mockGetUserById = vi.fn().mockResolvedValue({
      id: 1,
      openId: "test-user-123",
      name: "Test User",
      role: "user",
    });

    vi.doMock("../db", () => ({
      getUserFlags: mockGetUserFlags,
      getUserById: mockGetUserById,
    }));

    const { appRouter } = await import("./routers");
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Should NOT throw since the flag is expired
    const result = await caller.user.getProfile();
    expect(result).toBeDefined();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 7|blacklist)"
```

Expected error:
```
AssertionError: expected promise to reject with ... but it resolved
```

### Step 3: Write minimal implementation

**Create `anavi/server/db/flags.ts`:**

```typescript
import { and, eq, or, isNull, gt } from "drizzle-orm";
import { userFlags, UserFlag } from "../../drizzle/schema";
import { getDb } from "./connection";

/**
 * Returns all active (non-expired) flags for the given user.
 * A flag is "active" if expiresAt is NULL or expiresAt is in the future.
 */
export async function getUserFlags(userId: number): Promise<UserFlag[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  return db
    .select()
    .from(userFlags)
    .where(
      and(
        eq(userFlags.userId, userId),
        or(
          isNull(userFlags.expiresAt),
          gt(userFlags.expiresAt, now)
        )
      )
    );
}

export async function createUserFlag(
  data: typeof userFlags.$inferInsert
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userFlags).values(data);
  return result[0].insertId;
}

export async function deleteUserFlag(flagId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userFlags).where(eq(userFlags.id, flagId));
}

export async function listUserFlags(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { flags: [], total: 0 };
  const offset = (page - 1) * limit;
  const flags = await db.select().from(userFlags).limit(limit).offset(offset);
  return { flags, page, limit };
}
```

**Modify `anavi/server/db/index.ts`** — add export:

```typescript
export * from "./flags";
```

**Modify `anavi/server/_core/trpc.ts`** — add blacklist check to `requireUser` middleware:

```typescript
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import * as db from "../db";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Check for active blacklist flags
  const flags = await db.getUserFlags(ctx.user.id);
  const isBlacklisted = flags.some((f) => f.flagType === "blacklist");
  if (isBlacklisted) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Account suspended",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
```

**Note on the bypass user (id=0):** The SYNTHETIC_BYPASS_USER has `id: 0`. When `getUserFlags(0)` is called, the DB query will return no flags (no real user with id=0), so this remains safe for development mode.

### Step 4: Run test to verify it passes

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 7|✓|✗)" | head -10
```

Expected output:
```
✓ Task 7: blacklist enforcement > protectedProcedure returns FORBIDDEN when user has an active blacklist flag
✓ Task 7: blacklist enforcement > protectedProcedure allows access when user has no blacklist flag
✓ Task 7: blacklist enforcement > protectedProcedure ignores expired blacklist flags
```

### Step 5: Commit

```bash
cd anavi && git add server/db/flags.ts server/db/index.ts server/_core/trpc.ts server/trust.test.ts && git commit -m "feat: blacklist enforcement in protectedProcedure"
```

---

## Task 8: `admin.flagUser` and `admin.listFlags` Procedures

**Files:**
- Create: `anavi/server/routers/admin.ts`
- Modify: `anavi/server/routers/index.ts`
- Test: `anavi/server/trust.test.ts` (add tests)

### Step 1: Write the failing test

Append to `anavi/server/trust.test.ts`:

```typescript
describe("Task 8: admin flag management", () => {
  const mockCreateUserFlag = vi.fn().mockResolvedValue(42);
  const mockDeleteUserFlag = vi.fn().mockResolvedValue(undefined);
  const mockListUserFlags = vi.fn().mockResolvedValue({ flags: [], page: 1, limit: 20 });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.doMock("../db", () => ({
      createUserFlag: mockCreateUserFlag,
      deleteUserFlag: mockDeleteUserFlag,
      listUserFlags: mockListUserFlags,
      getUserFlags: vi.fn().mockResolvedValue([]), // No blacklist for admin user
    }));
  });

  it("admin.flagUser rejects non-admin caller with FORBIDDEN", async () => {
    const { appRouter } = await import("./routers");
    const { ctx } = createAuthContext(); // role = "user"
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.flagUser({
        userId: 99,
        flagType: "blacklist",
        reason: "Fraud",
      })
    ).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN" })
    );
  });

  it("admin.flagUser allows admin caller and creates flag", async () => {
    const { appRouter } = await import("./routers");

    // Create admin context
    const adminCtx = {
      ...createAuthContext().ctx,
      user: {
        ...createAuthContext().ctx.user!,
        role: "admin" as const,
      },
    };
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.admin.flagUser({
      userId: 99,
      flagType: "blacklist",
      reason: "Fraud suspected",
    });

    expect(result).toEqual({ id: 42 });
    expect(mockCreateUserFlag).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 99,
        flagType: "blacklist",
        reason: "Fraud suspected",
      })
    );
  });

  it("admin.listFlags returns paginated list", async () => {
    const mockFlags = [
      { id: 1, userId: 99, flagType: "blacklist", reason: "Test", expiresAt: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockListUserFlags.mockResolvedValue({ flags: mockFlags, page: 1, limit: 20 });

    const { appRouter } = await import("./routers");
    const adminCtx = {
      ...createAuthContext().ctx,
      user: { ...createAuthContext().ctx.user!, role: "admin" as const },
    };
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.admin.listFlags({ page: 1, limit: 20 });

    expect(result.flags).toHaveLength(1);
    expect(result.flags[0]).toMatchObject({ flagType: "blacklist" });
  });

  it("admin.removeFlag allows admin caller and deletes flag", async () => {
    const { appRouter } = await import("./routers");
    const adminCtx = {
      ...createAuthContext().ctx,
      user: { ...createAuthContext().ctx.user!, role: "admin" as const },
    };
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.admin.removeFlag({ flagId: 42 });

    expect(result).toEqual({ success: true });
    expect(mockDeleteUserFlag).toHaveBeenCalledWith(42);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 8|admin flag)"
```

Expected error:
```
TypeError: caller.admin is undefined
  (or) Error: No procedure 'admin' found on router
```

### Step 3: Write minimal implementation

**Create `anavi/server/routers/admin.ts`:**

```typescript
import { adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const adminRouter = router({
  /**
   * Create a whitelist / blacklist / watchlist flag for a user.
   * Only callable by operators with role='admin'.
   */
  flagUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      flagType: z.enum(["whitelist", "blacklist", "watchlist"]),
      reason: z.string().min(1),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createUserFlag({
        userId: input.userId,
        flagType: input.flagType,
        reason: input.reason,
        flaggedBy: ctx.user.id,
        expiresAt: input.expiresAt ?? null,
      });
      return { id };
    }),

  /**
   * Paginated list of all flags across all users.
   */
  listFlags: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      return db.listUserFlags(input.page, input.limit);
    }),

  /**
   * Remove a flag by ID.
   */
  removeFlag: adminProcedure
    .input(z.object({ flagId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteUserFlag(input.flagId);
      return { success: true };
    }),
});
```

**Modify `anavi/server/routers/index.ts`** — import and add `adminRouter`:

```typescript
// Add import:
import { adminRouter } from "./admin";

// Add to appRouter:
export const appRouter = router({
  // ... existing routers ...
  admin: adminRouter,
});
```

### Step 4: Run test to verify it passes

```bash
cd anavi && pnpm test trust.test.ts --reporter=verbose 2>&1 | grep -E "(Task 8|✓|✗)" | head -10
```

Expected output:
```
✓ Task 8: admin flag management > admin.flagUser rejects non-admin caller with FORBIDDEN
✓ Task 8: admin flag management > admin.flagUser allows admin caller and creates flag
✓ Task 8: admin flag management > admin.listFlags returns paginated list
✓ Task 8: admin flag management > admin.removeFlag allows admin caller and deletes flag
```

### Step 5: Commit

```bash
cd anavi && git add server/routers/admin.ts server/routers/index.ts server/trust.test.ts && git commit -m "feat: admin flag management procedures"
```

---

## Task 9: Trust Score Display in `Verification.tsx`

**Files:**
- Modify: `anavi/server/routers/user.ts` — add `getTrustScore` query
- Modify: `anavi/client/src/pages/Verification.tsx` — add score display with animation

**Note:** This task involves UI and requires manual testing. No automated Vitest test is written (the backend procedure is covered by the general test infrastructure).

### Step 3: Write minimal implementation

**Modify `anavi/server/routers/user.ts`** — add the `getTrustScore` procedure:

```typescript
getTrustScore: protectedProcedure.query(async ({ ctx }) => {
  const user = await db.getUserById(ctx.user.id);
  if (!user) return null;

  // Fetch component data for the breakdown display
  const [reviews, checks, history] = await Promise.all([
    db.getPeerReviews(ctx.user.id),
    db.getComplianceChecks("user", ctx.user.id),
    db.getTrustScoreHistory(ctx.user.id, 1),
  ]);

  const TIER_SCORES: Record<string, number> = {
    none: 0, basic: 33.33, enhanced: 66.66, institutional: 100,
  };

  const totalDeals = user.totalDeals ?? 0;
  const tierRaw = TIER_SCORES[user.verificationTier ?? "none"] ?? 0;
  const dealRaw = Math.min(totalDeals / 20, 1) * 100;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s: number, r: any) => s + (r.rating ?? 1), 0) / reviews.length
      : 1;
  const reviewRaw = reviews.length > 0 ? ((avgRating - 1) / 4) * 100 : 0;

  const passedChecks = checks.filter((c: any) => c.status === "passed").length;
  const complianceRaw = checks.length > 0 ? (passedChecks / checks.length) * 100 : 0;

  const monthsOld =
    (Date.now() - (user.createdAt?.getTime() ?? Date.now())) /
    (1000 * 60 * 60 * 24 * 30.44);
  const tenureRaw = Math.min(monthsOld / 24, 1) * 100;

  return {
    total: Number(user.trustScore ?? 0),
    badge: user.verificationBadge,
    tier: user.verificationTier,
    components: {
      verification: Math.round(tierRaw * 0.3),
      deals: Math.round(dealRaw * 0.25),
      peerReviews: Math.round(reviewRaw * 0.2),
      compliance: Math.round(complianceRaw * 0.15),
      tenure: Math.round(tenureRaw * 0.1),
    },
    lastUpdated: history[0]?.createdAt ?? null,
  };
}),
```

**Modify `anavi/client/src/pages/Verification.tsx`** — locate the trust score display area and replace it with an animated breakdown. Find the existing score display and insert:

```typescript
// At top of component, add the query:
const { data: trustData } = trpc.user.getTrustScore.useQuery();

// In the JSX, add this score breakdown section (e.g., after the badge display):
import { motion } from "framer-motion";

// Inside the component's return:
{trustData && (
  <div className="space-y-2">
    <motion.div
      className="text-4xl font-bold tabular-nums"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {trustData.total}
      <span className="text-lg font-normal text-muted-foreground ml-1">/ 100</span>
    </motion.div>

    <div className="grid grid-cols-1 gap-1 mt-3 text-sm">
      {Object.entries(trustData.components).map(([key, value], i) => (
        <motion.div
          key={key}
          className="flex items-center justify-between"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <span className="capitalize text-muted-foreground">
            {key.replace(/([A-Z])/g, " $1")}
          </span>
          <span className="font-medium">{value} pts</span>
        </motion.div>
      ))}
    </div>
  </div>
)}
```

### Step 4: Run test to verify it passes

Manual verification steps:
1. Start the dev server: `cd anavi && pnpm dev`
2. Navigate to the Verification page
3. Confirm the trust score animates in on page load
4. Confirm the 5 component breakdowns are visible (verification, deals, peerReviews, compliance, tenure)
5. Confirm the score total matches the sum of components

```bash
cd anavi && pnpm test --reporter=verbose 2>&1 | tail -5
```

All previously passing tests should still pass.

### Step 5: Commit

```bash
cd anavi && git add server/routers/user.ts client/src/pages/Verification.tsx server/trust.test.ts && git commit -m "feat: trust score breakdown in Verification page"
```

---

## Full Test Run

After all tasks are complete, run the full test suite to verify nothing was broken:

```bash
cd anavi && pnpm test --reporter=verbose
```

Expected: all tests pass, no regressions in `anavi.test.ts`.

---

## Database Migration

After tasks 1–8 are implemented, generate and run the migration for the new `user_flags` table:

```bash
cd anavi && pnpm db:push
```

This runs `drizzle-kit generate && drizzle-kit migrate` which will detect the new `userFlags` table and create the appropriate SQL migration.

---

## Dependency Summary

| Package | Already in `package.json`? | Install command |
|---|---|---|
| `axios` | Yes (`^1.12.0`) | — |
| `fast-xml-parser` | **No** | `cd anavi && pnpm add fast-xml-parser` |
| `framer-motion` | Yes (`^12.23.22`) | — |
| `drizzle-orm` | Yes (`^0.44.5`) | — |
| `vitest` | Yes (`^2.1.4`) | — |

**Only `fast-xml-parser` needs to be installed (Task 5 prerequisite).**

---

## File Creation/Modification Summary

| Action | File |
|---|---|
| Modify | `anavi/drizzle/schema.ts` |
| Modify | `anavi/server/db/users.ts` |
| Create | `anavi/server/db/flags.ts` |
| Modify | `anavi/server/db/index.ts` |
| Create | `anavi/server/_core/ofac.ts` |
| Create | `anavi/server/_core/kyb.ts` |
| Modify | `anavi/server/_core/trpc.ts` |
| Modify | `anavi/server/routers/compliance.ts` |
| Modify | `anavi/server/routers/verification.ts` |
| Modify | `anavi/server/routers/deal.ts` |
| Modify | `anavi/server/routers/user.ts` |
| Create | `anavi/server/routers/admin.ts` |
| Modify | `anavi/server/routers/index.ts` |
| Modify | `anavi/client/src/pages/Verification.tsx` |
| Create | `anavi/server/trust.test.ts` |
