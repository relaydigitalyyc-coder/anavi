# PRD-W5: Payout Attribution Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement payout calculation with 40-60% originator split, admin approval workflow, Stripe Connect execution, and follow-on lifetime attribution tracking.

**Architecture:** payout.calculate is a pure preview function (no DB writes). payout.approve transitions pending→approved (admin only). payout.execute calls stripe.transfers.create and transitions approved→processing. Stripe webhook transitions processing→completed. Follow-on attribution (10%) added as a separate payout row with payoutType='lifetime_attribution'. All admin mutations check ctx.user.role === 'admin' or use the existing `adminProcedure` middleware (which throws FORBIDDEN for non-admins).

**Tech Stack:** Stripe Node.js SDK (from PRD-W4), Drizzle ORM (mysql2), Vitest, tRPC v11.

---

## Key Schema Facts (read before implementing)

- `payouts` table: `/home/ariel/Documents/anavi-main/anavi/drizzle/schema.ts` lines 520-552
  - `status` enum: `"pending" | "approved" | "processing" | "completed" | "failed"` — `"approved"` already exists
  - `payoutType` enum: `"originator_fee" | "introducer_fee" | "advisor_fee" | "milestone_bonus" | "success_fee"` — does NOT include `"lifetime_attribution"` — must add it
  - `isFollowOn: boolean`, `originalDealId: int` — already in schema
  - `paidAt: timestamp` — already in schema
  - `stripeTransferId` — NOT in schema, must add in Task 5
  - `"pending_banking"` status — NOT in schema, must add in Task 5
- `users.role` enum: `"user" | "admin"` — admin role check is `ctx.user.role === 'admin'`
- `adminProcedure` already exists in `/home/ariel/Documents/anavi-main/anavi/server/_core/trpc.ts` — use this instead of manual role checks in procedures
- `dealParticipants.role` enum includes: `"originator" | "buyer" | "seller" | "introducer" | "advisor" | "legal" | "escrow" | "observer"`
- `dealParticipants.attributionPercentage: decimal` — the per-participant attribution share
- `deals.dealValue: decimal` — deal total value (NOT a fee — apply feeRate to get totalFees)
- `deals.stage` enum includes `"completed"`
- `deals` table has NO `isFollowOn` or `originalDealId` fields — those are on `payouts`
- `relationships.totalEarnings: decimal` and `users.totalEarnings: decimal` — both exist
- `triggerPayoutsOnDealClose` already exists in `/home/ariel/Documents/anavi-main/anavi/server/db/payouts.ts` — Task 3 rewrites it with proper attribution logic
- `updatePayout` already exists in `/home/ariel/Documents/anavi-main/anavi/server/db/payouts.ts`
- `escrowAccounts` table — created by PRD-W4, does NOT yet exist in schema; Task 5 references it as already available

## Key Code Facts

- Test file: `/home/ariel/Documents/anavi-main/anavi/server/anavi.test.ts`
- Test command: `pnpm test` run from `/home/ariel/Documents/anavi-main/anavi/`
- DB mock pattern: `vi.mock("./db", () => ({ ... }))` — mock individual named exports
- Admin check pattern: use `adminProcedure` from `../_core/trpc` (already throws FORBIDDEN for non-admin)
- tRPC caller in tests: `appRouter.createCaller(ctx)` where ctx includes `user` with `role` field
- `User.role` type is `"user" | "admin"` (see schema.ts line 15)

---

## Task 1: Payout split calculator utility

**Files:**
- Create: `/home/ariel/Documents/anavi-main/anavi/server/_core/payoutCalc.ts`
- Test: `/home/ariel/Documents/anavi-main/anavi/server/payoutCalc.test.ts`

### Step 1: Write the failing test

Create `/home/ariel/Documents/anavi-main/anavi/server/payoutCalc.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { calculatePayoutSplits } from "./_core/payoutCalc";
import type { DealParticipant } from "../drizzle/schema";

function makeParticipant(overrides: Partial<DealParticipant>): DealParticipant {
  return {
    id: 1,
    dealId: 10,
    userId: overrides.userId ?? 1,
    role: overrides.role ?? "originator",
    attributionPercentage: overrides.attributionPercentage ?? "50.00",
    expectedPayout: null,
    actualPayout: null,
    payoutStatus: "pending",
    introducedBy: null,
    relationshipId: null,
    joinedAt: new Date(),
    leftAt: null,
    ...overrides,
  } as DealParticipant;
}

describe("calculatePayoutSplits", () => {
  it("single originator at 50% gets exactly 50% of totalFees (clamped to 40-60%)", () => {
    const participants = [makeParticipant({ userId: 1, role: "originator", attributionPercentage: "50.00" })];
    const splits = calculatePayoutSplits(100_000, 0.02, participants);
    // totalFees = 100000 * 0.02 = 2000
    // originator at 50% => 2000 * 0.50 = 1000
    const origSplit = splits.find(s => s.role === "originator");
    expect(origSplit).toBeDefined();
    expect(origSplit!.amount).toBeCloseTo(1000, 2);
    expect(origSplit!.attributionPercentage).toBe(50);
    expect(origSplit!.payoutType).toBe("originator_fee");
    expect(origSplit!.isFollowOn).toBe(false);
  });

  it("originator with 30% attribution is clamped UP to 40%", () => {
    const participants = [makeParticipant({ userId: 1, role: "originator", attributionPercentage: "30.00" })];
    const splits = calculatePayoutSplits(100_000, 0.02, participants);
    // totalFees = 2000; clamped to 40% => 2000 * 0.40 = 800
    const origSplit = splits.find(s => s.role === "originator");
    expect(origSplit!.amount).toBeCloseTo(800, 2);
    expect(origSplit!.attributionPercentage).toBe(40);
  });

  it("originator with 70% attribution is clamped DOWN to 60%", () => {
    const participants = [makeParticipant({ userId: 1, role: "originator", attributionPercentage: "70.00" })];
    const splits = calculatePayoutSplits(100_000, 0.02, participants);
    // totalFees = 2000; clamped to 60% => 2000 * 0.60 = 1200
    const origSplit = splits.find(s => s.role === "originator");
    expect(origSplit!.amount).toBeCloseTo(1200, 2);
    expect(origSplit!.attributionPercentage).toBe(60);
  });

  it("follow-on participant receives 10% of totalFees marked as isFollowOn", () => {
    const participants = [
      makeParticipant({ userId: 1, role: "originator", attributionPercentage: "50.00" }),
      makeParticipant({ userId: 2, role: "introducer", attributionPercentage: "10.00" }),
    ];
    // Mark the introducer as a lifetime_attribution follow-on
    const participantsWithFollowOn = [
      participants[0],
      { ...participants[1], relationshipId: 5 },
    ];
    const splits = calculatePayoutSplits(100_000, 0.02, participantsWithFollowOn, [
      { userId: 2, relationshipId: 5, attributionPercentage: 10 },
    ]);
    // totalFees = 2000; follow-on => 2000 * 0.10 = 200
    const followOnSplit = splits.find(s => s.isFollowOn === true);
    expect(followOnSplit).toBeDefined();
    expect(followOnSplit!.amount).toBeCloseTo(200, 2);
    expect(followOnSplit!.payoutType).toBe("lifetime_attribution");
  });

  it("two introducers split the remaining pool proportionally", () => {
    const participants = [
      makeParticipant({ userId: 1, role: "originator", attributionPercentage: "50.00" }),
      makeParticipant({ userId: 2, role: "introducer", attributionPercentage: "30.00" }),
      makeParticipant({ userId: 3, role: "introducer", attributionPercentage: "20.00" }),
    ];
    const splits = calculatePayoutSplits(100_000, 0.02, participants);
    // totalFees = 2000; originator = 1000; remaining = 1000
    // introducer A: 30/(30+20) * 1000 = 600
    // introducer B: 20/(30+20) * 1000 = 400
    const introA = splits.find(s => s.userId === 2);
    const introB = splits.find(s => s.userId === 3);
    expect(introA!.amount).toBeCloseTo(600, 2);
    expect(introB!.amount).toBeCloseTo(400, 2);
  });

  it("all splits sum to at most totalFees", () => {
    const participants = [
      makeParticipant({ userId: 1, role: "originator", attributionPercentage: "55.00" }),
      makeParticipant({ userId: 2, role: "introducer", attributionPercentage: "25.00" }),
      makeParticipant({ userId: 3, role: "advisor", attributionPercentage: "10.00" }),
    ];
    const splits = calculatePayoutSplits(200_000, 0.02, participants);
    const totalFees = 200_000 * 0.02;
    const sumOfSplits = splits.reduce((s, x) => s + x.amount, 0);
    expect(sumOfSplits).toBeLessThanOrEqual(totalFees + 0.01); // allow floating-point epsilon
  });

  it("returns empty array when no participants", () => {
    const splits = calculatePayoutSplits(100_000, 0.02, []);
    expect(splits).toEqual([]);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payoutCalc
```

Expected error:
```
Cannot find module './_core/payoutCalc'
```

### Step 3: Write minimal implementation

Create `/home/ariel/Documents/anavi-main/anavi/server/_core/payoutCalc.ts`:

```typescript
import type { DealParticipant } from "../../drizzle/schema";

export type PayoutSplit = {
  userId: number;
  role: string;
  payoutType: "originator_fee" | "introducer_fee" | "advisor_fee" | "lifetime_attribution";
  attributionPercentage: number;
  amount: number;
  isFollowOn: boolean;
  relationshipId?: number | null;
};

export type FollowOnAttribution = {
  userId: number;
  relationshipId: number;
  attributionPercentage: number;
};

/**
 * Pure function — no DB side effects.
 * Calculates how totalFees (dealValue * feeRate) are split among participants.
 *
 * Rules:
 *   - Originator: attributionPercentage clamped to [40, 60]% of totalFees
 *   - Follow-on entries: 10% of totalFees each, marked isFollowOn=true, payoutType='lifetime_attribution'
 *   - Introducers: split remaining pool proportionally by their attributionPercentage
 *   - Advisors: fixed share = totalFees * (attributionPercentage / 100), capped at remaining pool
 */
export function calculatePayoutSplits(
  dealValue: number,
  feeRate: number,
  participants: DealParticipant[],
  followOnAttributions: FollowOnAttribution[] = [],
): PayoutSplit[] {
  if (participants.length === 0) return [];

  const totalFees = dealValue * feeRate;
  const splits: PayoutSplit[] = [];

  // 1. Originator split (clamped to 40-60% of totalFees)
  const originator = participants.find(p => p.role === "originator");
  let originatorAmount = 0;
  if (originator) {
    const rawPct = Number(originator.attributionPercentage ?? 50);
    const clampedPct = Math.min(60, Math.max(40, rawPct));
    originatorAmount = totalFees * (clampedPct / 100);
    splits.push({
      userId: originator.userId,
      role: "originator",
      payoutType: "originator_fee",
      attributionPercentage: clampedPct,
      amount: originatorAmount,
      isFollowOn: false,
      relationshipId: originator.relationshipId,
    });
  }

  // 2. Follow-on attribution entries (10% each)
  let followOnTotal = 0;
  for (const fo of followOnAttributions) {
    const foAmount = totalFees * 0.10;
    followOnTotal += foAmount;
    splits.push({
      userId: fo.userId,
      role: "introducer",
      payoutType: "lifetime_attribution",
      attributionPercentage: 10,
      amount: foAmount,
      isFollowOn: true,
      relationshipId: fo.relationshipId,
    });
  }

  // 3. Remaining pool after originator and follow-on
  let remaining = totalFees - originatorAmount - followOnTotal;
  if (remaining < 0) remaining = 0;

  // 4. Advisors — fixed % of totalFees from remaining pool
  const advisors = participants.filter(p => p.role === "advisor");
  let advisorTotal = 0;
  for (const advisor of advisors) {
    const pct = Number(advisor.attributionPercentage ?? 0);
    if (pct <= 0) continue;
    const advisorAmount = Math.min(totalFees * (pct / 100), remaining - advisorTotal);
    if (advisorAmount <= 0) continue;
    advisorTotal += advisorAmount;
    splits.push({
      userId: advisor.userId,
      role: "advisor",
      payoutType: "advisor_fee",
      attributionPercentage: pct,
      amount: advisorAmount,
      isFollowOn: false,
      relationshipId: advisor.relationshipId,
    });
  }

  remaining -= advisorTotal;
  if (remaining < 0) remaining = 0;

  // 5. Introducers — split remaining proportionally by attributionPercentage
  const introducers = participants.filter(p => p.role === "introducer");
  const totalIntroducerPct = introducers.reduce(
    (sum, p) => sum + Number(p.attributionPercentage ?? 0),
    0,
  );

  if (totalIntroducerPct > 0 && remaining > 0) {
    for (const intro of introducers) {
      const pct = Number(intro.attributionPercentage ?? 0);
      if (pct <= 0) continue;
      const introAmount = remaining * (pct / totalIntroducerPct);
      splits.push({
        userId: intro.userId,
        role: "introducer",
        payoutType: "introducer_fee",
        attributionPercentage: pct,
        amount: introAmount,
        isFollowOn: false,
        relationshipId: intro.relationshipId,
      });
    }
  }

  return splits;
}
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payoutCalc
```

Expected output:
```
PASS  server/payoutCalc.test.ts
  calculatePayoutSplits
    ✓ single originator at 50% gets exactly 50% of totalFees (clamped to 40-60%)
    ✓ originator with 30% attribution is clamped UP to 40%
    ✓ originator with 70% attribution is clamped DOWN to 60%
    ✓ follow-on participant receives 10% of totalFees marked as isFollowOn
    ✓ two introducers split the remaining pool proportionally
    ✓ all splits sum to at most totalFees
    ✓ returns empty array when no participants
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/_core/payoutCalc.ts anavi/server/payoutCalc.test.ts && git commit -m "feat: payout split calculator utility"
```

---

## Task 2: payout.calculate procedure

**Files:**
- Modify: `/home/ariel/Documents/anavi-main/anavi/server/routers/payout.ts`
- Test additions in: `/home/ariel/Documents/anavi-main/anavi/server/anavi.test.ts` (or new `payout.test.ts`)

### Step 1: Write the failing test

Add a new describe block to `/home/ariel/Documents/anavi-main/anavi/server/anavi.test.ts` (or create `/home/ariel/Documents/anavi-main/anavi/server/payout.test.ts`):

```typescript
// payout.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// Mock only the db functions used by payout procedures
vi.mock("./db", () => ({
  getPayoutsByUser: vi.fn().mockResolvedValue([]),
  getPayoutsByDeal: vi.fn().mockResolvedValue([]),
  getDealById: vi.fn(),
  getDealParticipants: vi.fn(),
  createPayout: vi.fn().mockResolvedValue(1),
  updatePayout: vi.fn().mockResolvedValue(undefined),
  triggerPayoutsOnDealClose: vi.fn().mockResolvedValue(undefined),
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import * as db from "./db";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    passwordHash: null,
    emailVerified: false,
    loginMethod: "test",
    role: "user",
    verificationTier: "none",
    trustScore: "0.00",
    verificationBadge: null,
    kybStatus: "pending",
    kycStatus: "pending",
    participantType: null,
    onboardingStep: 0,
    onboardingCompleted: false,
    company: null,
    title: null,
    bio: null,
    avatar: null,
    website: null,
    location: null,
    phone: null,
    investmentFocus: null,
    dealVerticals: null,
    typicalDealSize: null,
    geographicFocus: null,
    yearsExperience: null,
    linkedinUrl: null,
    sanctionsCleared: false,
    pepStatus: false,
    adverseMediaCleared: true,
    complianceLastChecked: null,
    jurisdictions: null,
    totalDeals: 0,
    totalDealValue: "0.00",
    totalEarnings: "0.00",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  } as User;
}

function makeContext(user: User): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("payout.calculate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns split preview without writing to DB", async () => {
    const mockDeal = {
      id: 10,
      title: "Test Deal",
      dealType: "acquisition" as const,
      dealValue: "100000.00",
      currency: "USD",
      stage: "completed" as const,
      originatorId: 1,
      buyerId: null,
      sellerId: null,
      dealRoomId: null,
      currentMilestone: null,
      milestones: null,
      expectedCloseDate: null,
      actualCloseDate: null,
      complianceStatus: "cleared" as const,
      complianceNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockParticipants = [
      {
        id: 1, dealId: 10, userId: 1,
        role: "originator" as const,
        attributionPercentage: "50.00",
        expectedPayout: null, actualPayout: null,
        payoutStatus: "pending" as const,
        introducedBy: null, relationshipId: null,
        joinedAt: new Date(), leftAt: null,
      },
      {
        id: 2, dealId: 10, userId: 2,
        role: "introducer" as const,
        attributionPercentage: "30.00",
        expectedPayout: null, actualPayout: null,
        payoutStatus: "pending" as const,
        introducedBy: null, relationshipId: null,
        joinedAt: new Date(), leftAt: null,
      },
    ];

    vi.mocked(db.getDealById).mockResolvedValue(mockDeal as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue(mockParticipants as any);

    const caller = appRouter.createCaller(makeContext(makeUser()));
    const result = await caller.payout.calculate({ dealId: 10 });

    // totalFees = 100000 * 0.02 = 2000
    // originator: 50% => 1000
    // introducer: remaining (1000) => 100% of introducers => 1000
    expect(result.totalFees).toBeCloseTo(2000, 2);
    expect(result.dealId).toBe(10);
    expect(result.splits).toHaveLength(2);

    const origSplit = result.splits.find((s: any) => s.role === "originator");
    expect(origSplit).toBeDefined();
    expect(origSplit!.amount).toBeCloseTo(1000, 2);

    // Assert no DB insert was called
    expect(db.createPayout).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when deal does not exist", async () => {
    vi.mocked(db.getDealById).mockResolvedValue(undefined as any);

    const caller = appRouter.createCaller(makeContext(makeUser()));
    await expect(caller.payout.calculate({ dealId: 999 })).rejects.toThrow("NOT_FOUND");
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected error:
```
TypeError: caller.payout.calculate is not a function
  (procedure does not exist yet)
```

### Step 3: Write minimal implementation

Modify `/home/ariel/Documents/anavi-main/anavi/server/routers/payout.ts` — add `calculate` procedure:

```typescript
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { calculatePayoutSplits } from "../_core/payoutCalc";

export const payoutRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getPayoutsByUser(ctx.user.id);
  }),

  calculate: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      const participants = await db.getDealParticipants(input.dealId);
      const feeRate = 0.02;
      const dealValue = Number(deal.dealValue ?? 0);
      const totalFees = dealValue * feeRate;

      const splits = calculatePayoutSplits(dealValue, feeRate, participants);

      return {
        dealId: input.dealId,
        dealValue,
        totalFees,
        feeRate,
        stageWarning: deal.stage !== "completed"
          ? `Deal is in stage '${deal.stage}', not 'completed'. Splits are a preview only.`
          : null,
        splits,
      };
    }),

  getStatement: protectedProcedure
    .input(z.object({
      periodStart: z.string().datetime(),
      periodEnd: z.string().datetime(),
    }))
    .query(async ({ ctx, input }) => {
      const payouts = await db.getPayoutsByUser(ctx.user.id);
      const start = new Date(input.periodStart);
      const end = new Date(input.periodEnd);
      const items = payouts.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= start && d <= end;
      });
      const total = items.reduce((s, p) => s + Number(p.amount ?? 0), 0);
      return {
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        items,
        total,
      };
    }),

  getByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      return db.getPayoutsByDeal(input.dealId);
    }),
});
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected output:
```
PASS  server/payout.test.ts
  payout.calculate
    ✓ returns split preview without writing to DB
    ✓ throws NOT_FOUND when deal does not exist
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/routers/payout.ts anavi/server/payout.test.ts && git commit -m "feat: payout.calculate preview procedure"
```

---

## Task 3: triggerPayoutsOnDealClose DB function rewrite

**Files:**
- Modify: `/home/ariel/Documents/anavi-main/anavi/server/db/payouts.ts`
- The `updateStage` call in `/home/ariel/Documents/anavi-main/anavi/server/routers/deal.ts` already calls `db.triggerPayoutsOnDealClose` — no change needed there

### Step 1: Write the failing test

Add to `/home/ariel/Documents/anavi-main/anavi/server/payout.test.ts`:

```typescript
// Add these imports at the top of payout.test.ts:
// import { triggerPayoutsOnDealClose } from "./db/payouts";

// Mock drizzle connection
vi.mock("./db/connection", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db/connection";

describe("triggerPayoutsOnDealClose", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts correct payout rows for originator and introducers", async () => {
    const insertedRows: any[] = [];

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        // Return deal on first call, empty on idempotency check, participants on third
        return Promise.resolve([]);
      }),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockImplementation((data) => {
        insertedRows.push(data);
        return Promise.resolve([{ insertId: insertedRows.length }]);
      }),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    // NOTE: Because triggerPayoutsOnDealClose uses getDb() internally and makes
    // multiple sequential selects, the recommended approach is to test it via
    // the payout.calculate + manual insert path in integration. For unit tests,
    // mock calculatePayoutSplits directly:

    vi.mock("./_core/payoutCalc", () => ({
      calculatePayoutSplits: vi.fn().mockReturnValue([
        {
          userId: 1, role: "originator", payoutType: "originator_fee",
          attributionPercentage: 50, amount: 1000, isFollowOn: false,
          relationshipId: null,
        },
        {
          userId: 2, role: "introducer", payoutType: "introducer_fee",
          attributionPercentage: 30, amount: 600, isFollowOn: false,
          relationshipId: null,
        },
      ]),
    }));

    vi.mocked(db.getDealById).mockResolvedValue({
      id: 10, title: "Deal", dealType: "acquisition",
      dealValue: "100000.00", currency: "USD", stage: "completed",
      originatorId: 1, buyerId: null, sellerId: null, dealRoomId: null,
      currentMilestone: null, milestones: null, expectedCloseDate: null,
      actualCloseDate: null, complianceStatus: "cleared", complianceNotes: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    vi.mocked(db.getDealParticipants).mockResolvedValue([
      {
        id: 1, dealId: 10, userId: 1, role: "originator",
        attributionPercentage: "50.00", expectedPayout: null, actualPayout: null,
        payoutStatus: "pending", introducedBy: null, relationshipId: null,
        joinedAt: new Date(), leftAt: null,
      },
      {
        id: 2, dealId: 10, userId: 2, role: "introducer",
        attributionPercentage: "30.00", expectedPayout: null, actualPayout: null,
        payoutStatus: "pending", introducedBy: null, relationshipId: null,
        joinedAt: new Date(), leftAt: null,
      },
    ] as any);

    vi.mocked(db.getPayoutsByDeal).mockResolvedValue([]); // no existing payouts = not idempotent

    // Call triggerPayoutsOnDealClose via the deal.updateStage path
    const caller = appRouter.createCaller(makeContext(makeUser()));

    // We test the DB function directly by importing it
    const { triggerPayoutsOnDealClose } = await import("./db/payouts");
    await triggerPayoutsOnDealClose(10);

    // Should have called createPayout twice (once per split)
    expect(db.createPayout).toHaveBeenCalledTimes(2);

    const firstCall = vi.mocked(db.createPayout).mock.calls[0][0];
    expect(firstCall.payoutType).toBe("originator_fee");
    expect(Number(firstCall.amount)).toBeCloseTo(1000, 2);
    expect(firstCall.status).toBe("pending");
    expect(firstCall.dealId).toBe(10);

    const secondCall = vi.mocked(db.createPayout).mock.calls[1][0];
    expect(secondCall.payoutType).toBe("introducer_fee");
    expect(Number(secondCall.amount)).toBeCloseTo(600, 2);
  });

  it("is idempotent — does not re-insert if payouts already exist for deal", async () => {
    vi.mocked(db.getDealById).mockResolvedValue({
      id: 10, dealValue: "100000.00", currency: "USD", stage: "completed",
      originatorId: 1,
    } as any);
    vi.mocked(db.getPayoutsByDeal).mockResolvedValue([
      { id: 1, dealId: 10, milestoneName: "deal_close", status: "pending" } as any,
    ]);

    const { triggerPayoutsOnDealClose } = await import("./db/payouts");
    await triggerPayoutsOnDealClose(10);

    expect(db.createPayout).not.toHaveBeenCalled();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected error:
```
AssertionError: expected "createPayout" to have been called 2 times, but it was called 0 times
(existing triggerPayoutsOnDealClose uses raw drizzle inserts, not createPayout, and has wrong attribution logic)
```

### Step 3: Write minimal implementation

Rewrite `/home/ariel/Documents/anavi-main/anavi/server/db/payouts.ts`:

```typescript
import { eq, desc, and } from "drizzle-orm";
import { payouts, deals, dealParticipants } from "../../drizzle/schema";
import { getDb } from "./connection";
import { calculatePayoutSplits } from "../_core/payoutCalc";

export async function createPayout(data: typeof payouts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payouts).values(data);
  return result[0].insertId;
}

export async function getPayoutsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payouts).where(eq(payouts.userId, userId)).orderBy(desc(payouts.createdAt));
}

export async function getPayoutsByDeal(dealId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payouts).where(eq(payouts.dealId, dealId)).orderBy(desc(payouts.createdAt));
}

/**
 * Trigger payouts when a deal closes. Idempotent — checks for existing
 * deal_close payouts before inserting. Uses calculatePayoutSplits for proper
 * 40-60% originator clamping and proportional introducer splits.
 */
export async function triggerPayoutsOnDealClose(dealId: number) {
  const db = await getDb();
  if (!db) return;

  const dealRows = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
  if (dealRows.length === 0) return;
  const deal = dealRows[0];

  const dealValue = Number(deal.dealValue ?? 0);
  if (dealValue <= 0) return;

  // Idempotency check — don't re-insert if deal_close payouts already exist
  const existing = await db
    .select({ id: payouts.id })
    .from(payouts)
    .where(and(eq(payouts.dealId, dealId), eq(payouts.milestoneName, "deal_close")));
  if (existing.length > 0) return;

  const participants = await db
    .select()
    .from(dealParticipants)
    .where(eq(dealParticipants.dealId, dealId));

  const splits = calculatePayoutSplits(dealValue, 0.02, participants);

  for (const split of splits) {
    await createPayout({
      dealId,
      userId: split.userId,
      amount: String(split.amount.toFixed(2)),
      currency: deal.currency ?? "USD",
      payoutType: split.payoutType as typeof payouts.$inferInsert["payoutType"],
      attributionPercentage: String(split.attributionPercentage),
      relationshipId: split.relationshipId ?? undefined,
      isFollowOn: split.isFollowOn,
      originalDealId: split.isFollowOn ? dealId : undefined,
      status: "pending",
      milestoneId: `deal_close_${dealId}`,
      milestoneName: "deal_close",
    });
  }
}

export async function updatePayout(id: number, data: Partial<typeof payouts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payouts).set({ ...data, updatedAt: new Date() }).where(eq(payouts.id, id));
}
```

**Important:** Because `payoutType` enum in schema does not include `"lifetime_attribution"`, you must also add it to the schema in this task. In `/home/ariel/Documents/anavi-main/anavi/drizzle/schema.ts`, change line 528-530:

```typescript
// Before:
payoutType: mysqlEnum("payoutType", [
  "originator_fee", "introducer_fee", "advisor_fee", "milestone_bonus", "success_fee"
]).notNull(),

// After:
payoutType: mysqlEnum("payoutType", [
  "originator_fee", "introducer_fee", "advisor_fee", "milestone_bonus", "success_fee",
  "lifetime_attribution"
]).notNull(),
```

Then generate and apply the migration:

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm drizzle-kit generate && pnpm drizzle-kit migrate
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected output:
```
PASS  server/payout.test.ts
  triggerPayoutsOnDealClose
    ✓ inserts correct payout rows for originator and introducers
    ✓ is idempotent — does not re-insert if payouts already exist for deal
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/db/payouts.ts anavi/drizzle/schema.ts anavi/server/payout.test.ts && git commit -m "feat: triggerPayoutsOnDealClose creates pending payout rows on deal close"
```

---

## Task 4: payout.approve and payout.bulkApprove procedures

**Files:**
- Modify: `/home/ariel/Documents/anavi-main/anavi/server/routers/payout.ts`

### Step 1: Write the failing test

Add to `/home/ariel/Documents/anavi-main/anavi/server/payout.test.ts`:

```typescript
describe("payout.approve", () => {
  const pendingPayout = {
    id: 1, dealId: 10, userId: 1,
    amount: "1000.00", currency: "USD",
    payoutType: "originator_fee" as const,
    attributionPercentage: "50.00",
    relationshipId: null, isFollowOn: false, originalDealId: null,
    status: "pending" as const,
    milestoneId: null, milestoneName: null,
    paymentMethod: null, paymentReference: null, paidAt: null,
    stripeTransferId: null,
    createdAt: new Date(), updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws FORBIDDEN for non-admin caller", async () => {
    const caller = appRouter.createCaller(makeContext(makeUser({ role: "user" })));
    await expect(caller.payout.approve({ payoutId: 1 })).rejects.toThrow("FORBIDDEN");
  });

  it("admin caller transitions pending payout to approved", async () => {
    vi.mocked(db.getPayoutsByDeal).mockResolvedValue([pendingPayout] as any);
    // Mock a function to get single payout — we'll add getPayoutById to db
    // For now mock via getPayoutsByDeal or add getPayoutById to mock
    vi.mocked(db.updatePayout).mockResolvedValue(undefined);

    // We need getPayoutById — add it to the db mock
    const mockGetPayoutById = vi.fn().mockResolvedValue(pendingPayout);
    vi.doMock("./db", () => ({
      ...vi.importActual("./db"),
      getPayoutById: mockGetPayoutById,
      updatePayout: vi.fn().mockResolvedValue(undefined),
      logAuditEvent: vi.fn().mockResolvedValue(undefined),
    }));

    const caller = appRouter.createCaller(makeContext(makeUser({ role: "admin" })));
    const result = await caller.payout.approve({ payoutId: 1 });

    expect(result.success).toBe(true);
    expect(db.updatePayout).toHaveBeenCalledWith(1, expect.objectContaining({ status: "approved" }));
  });

  it("throws BAD_REQUEST when approving a non-pending payout", async () => {
    const approvedPayout = { ...pendingPayout, status: "approved" as const };
    // mock getPayoutById to return approved payout
    vi.doMock("./db", () => ({
      getPayoutById: vi.fn().mockResolvedValue(approvedPayout),
      updatePayout: vi.fn().mockResolvedValue(undefined),
      logAuditEvent: vi.fn().mockResolvedValue(undefined),
    }));

    const caller = appRouter.createCaller(makeContext(makeUser({ role: "admin" })));
    await expect(caller.payout.approve({ payoutId: 1 })).rejects.toThrow("BAD_REQUEST");
  });
});

describe("payout.bulkApprove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws FORBIDDEN for non-admin caller", async () => {
    const caller = appRouter.createCaller(makeContext(makeUser({ role: "user" })));
    await expect(caller.payout.bulkApprove({ dealId: 10 })).rejects.toThrow("FORBIDDEN");
  });

  it("admin bulk-approves all pending payouts for a deal", async () => {
    const pendingPayouts = [
      { id: 1, dealId: 10, status: "pending" as const, amount: "1000.00", userId: 1, payoutType: "originator_fee" as const, currency: "USD", attributionPercentage: "50.00", relationshipId: null, isFollowOn: false, originalDealId: null, milestoneId: null, milestoneName: null, paymentMethod: null, paymentReference: null, paidAt: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, dealId: 10, status: "pending" as const, amount: "600.00", userId: 2, payoutType: "introducer_fee" as const, currency: "USD", attributionPercentage: "30.00", relationshipId: null, isFollowOn: false, originalDealId: null, milestoneId: null, milestoneName: null, paymentMethod: null, paymentReference: null, paidAt: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    vi.mocked(db.getPayoutsByDeal).mockResolvedValue(pendingPayouts as any);
    vi.mocked(db.updatePayout).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeContext(makeUser({ role: "admin" })));
    const result = await caller.payout.bulkApprove({ dealId: 10 });

    expect(result.approvedCount).toBe(2);
    expect(db.updatePayout).toHaveBeenCalledTimes(2);
    expect(db.updatePayout).toHaveBeenNthCalledWith(1, 1, expect.objectContaining({ status: "approved" }));
    expect(db.updatePayout).toHaveBeenNthCalledWith(2, 2, expect.objectContaining({ status: "approved" }));
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected error:
```
TypeError: caller.payout.approve is not a function
```

### Step 3: Write minimal implementation

Add `getPayoutById` to `/home/ariel/Documents/anavi-main/anavi/server/db/payouts.ts`:

```typescript
export async function getPayoutById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payouts).where(eq(payouts.id, id)).limit(1);
  return result[0];
}
```

Add to the mock in `payout.test.ts`:

```typescript
getPayoutById: vi.fn().mockResolvedValue(undefined),
```

Add `approve` and `bulkApprove` to `/home/ariel/Documents/anavi-main/anavi/server/routers/payout.ts`:

```typescript
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { calculatePayoutSplits } from "../_core/payoutCalc";

export const payoutRouter = router({
  // ... existing procedures ...

  approve: adminProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const payout = await db.getPayoutById(input.payoutId);
      if (!payout) throw new TRPCError({ code: "NOT_FOUND" });
      if (payout.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Payout is in '${payout.status}' status; only 'pending' payouts can be approved.`,
        });
      }

      await db.updatePayout(input.payoutId, { status: "approved" });
      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "payout_approved",
        entityType: "payout",
        entityId: input.payoutId,
        previousState: { status: "pending" },
        newState: { status: "approved" },
      });

      return { success: true, payoutId: input.payoutId };
    }),

  bulkApprove: adminProcedure
    .input(z.object({ dealId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dealPayouts = await db.getPayoutsByDeal(input.dealId);
      const pendingPayouts = dealPayouts.filter(p => p.status === "pending");

      for (const payout of pendingPayouts) {
        await db.updatePayout(payout.id, { status: "approved" });
      }

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "payouts_bulk_approved",
        entityType: "deal",
        entityId: input.dealId,
        newState: { approvedCount: pendingPayouts.length },
      });

      return { approvedCount: pendingPayouts.length, dealId: input.dealId };
    }),
});
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected output:
```
PASS  server/payout.test.ts
  payout.approve
    ✓ throws FORBIDDEN for non-admin caller
    ✓ admin caller transitions pending payout to approved
    ✓ throws BAD_REQUEST when approving a non-pending payout
  payout.bulkApprove
    ✓ throws FORBIDDEN for non-admin caller
    ✓ admin bulk-approves all pending payouts for a deal
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/routers/payout.ts anavi/server/db/payouts.ts anavi/server/payout.test.ts && git commit -m "feat: payout.approve and payout.bulkApprove (admin-only)"
```

---

## Task 5: payout.execute procedure + schema additions

**Files:**
- Modify: `/home/ariel/Documents/anavi-main/anavi/drizzle/schema.ts` — add `stripeTransferId` and `"pending_banking"` status to `payouts` table
- Create: `/home/ariel/Documents/anavi-main/anavi/server/_core/stripe.ts` (if not created by PRD-W4)
- Modify: `/home/ariel/Documents/anavi-main/anavi/server/routers/payout.ts` — add `execute` procedure
- Modify: `/home/ariel/Documents/anavi-main/anavi/server/db/payouts.ts` — add `getEscrowAccountByDeal`

### Step 1: Write the failing test

Add to `/home/ariel/Documents/anavi-main/anavi/server/payout.test.ts`:

```typescript
vi.mock("./_core/stripe", () => ({
  stripe: {
    transfers: {
      create: vi.fn().mockResolvedValue({ id: "tr_test_123" }),
    },
    accounts: {
      createLoginLink: vi.fn().mockResolvedValue({ url: "https://stripe.com/onboarding/test" }),
    },
  },
}));

import { stripe } from "./_core/stripe";

describe("payout.execute", () => {
  const approvedPayout = {
    id: 1, dealId: 10, userId: 1,
    amount: "1000.00", currency: "USD",
    payoutType: "originator_fee" as const,
    attributionPercentage: "50.00",
    relationshipId: null, isFollowOn: false, originalDealId: null,
    status: "approved" as const,
    milestoneId: null, milestoneName: null,
    paymentMethod: null, paymentReference: null, paidAt: null,
    stripeTransferId: null,
    createdAt: new Date(), updatedAt: new Date(),
  };

  const mockEscrowAccount = {
    id: 1, dealId: 10, userId: 1,
    stripeAccountId: "acct_test_abc",
    status: "active",
    createdAt: new Date(), updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws FORBIDDEN for non-admin caller", async () => {
    const caller = appRouter.createCaller(makeContext(makeUser({ role: "user" })));
    await expect(caller.payout.execute({ payoutId: 1 })).rejects.toThrow("FORBIDDEN");
  });

  it("throws BAD_REQUEST when payout is not in approved status", async () => {
    vi.mocked(db.getPayoutById).mockResolvedValue({
      ...approvedPayout, status: "pending" as const,
    } as any);

    const caller = appRouter.createCaller(makeContext(makeUser({ role: "admin" })));
    await expect(caller.payout.execute({ payoutId: 1 })).rejects.toThrow("BAD_REQUEST");
  });

  it("calls stripe.transfers.create with amount in cents and transitions to processing", async () => {
    vi.mocked(db.getPayoutById).mockResolvedValue(approvedPayout as any);
    vi.mocked(db.getEscrowAccountByDeal).mockResolvedValue(mockEscrowAccount as any);
    vi.mocked(db.updatePayout).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeContext(makeUser({ role: "admin" })));
    const result = await caller.payout.execute({ payoutId: 1 });

    expect(stripe.transfers.create).toHaveBeenCalledWith({
      amount: 100000, // $1000.00 * 100 = 100000 cents
      currency: "usd",
      destination: "acct_test_abc",
      transfer_group: "deal_10",
    });

    expect(db.updatePayout).toHaveBeenCalledWith(1, expect.objectContaining({
      status: "processing",
      stripeTransferId: "tr_test_123",
    }));

    expect(result.stripeTransferId).toBe("tr_test_123");
    expect(result.status).toBe("processing");
  });

  it("returns requiresOnboarding=true when no escrow account exists", async () => {
    vi.mocked(db.getPayoutById).mockResolvedValue(approvedPayout as any);
    vi.mocked(db.getEscrowAccountByDeal).mockResolvedValue(undefined);
    vi.mocked(db.updatePayout).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(makeContext(makeUser({ role: "admin" })));
    const result = await caller.payout.execute({ payoutId: 1 });

    expect(result.requiresOnboarding).toBe(true);
    expect(db.updatePayout).toHaveBeenCalledWith(1, expect.objectContaining({
      status: "pending_banking",
    }));
    // Stripe transfer must NOT be called
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected errors:
```
Cannot find module './_core/stripe'
TypeError: caller.payout.execute is not a function
```

### Step 3: Write minimal implementation

**3a. Add schema columns** — in `/home/ariel/Documents/anavi-main/anavi/drizzle/schema.ts`, update the `payouts` table:

```typescript
// Change status enum to include "pending_banking":
status: mysqlEnum("status", [
  "pending", "approved", "processing", "completed", "failed", "pending_banking"
]).default("pending"),

// Add after paymentReference column:
stripeTransferId: varchar("stripeTransferId", { length: 255 }),
```

**3b. Create Stripe helper** at `/home/ariel/Documents/anavi-main/anavi/server/_core/stripe.ts`:

```typescript
import Stripe from "stripe";
import { ENV } from "./env";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "test") {
  console.warn("[stripe] STRIPE_SECRET_KEY not set — Stripe calls will fail");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2024-06-20",
});
```

**3c. Add `getEscrowAccountByDeal`** — this function queries the `escrowAccounts` table created by PRD-W4. Add to `/home/ariel/Documents/anavi-main/anavi/server/db/payouts.ts` (or a new `escrow.ts`):

```typescript
// In db/payouts.ts — add after existing functions:
// NOTE: escrowAccounts table is created in PRD-W4.
// Import it from schema once that migration has run.
// For now, we add the function stub that will resolve once the table exists.

export async function getEscrowAccountByDeal(dealId: number) {
  const db = await getDb();
  if (!db) return undefined;
  // escrowAccounts imported from schema after PRD-W4 migration
  // const { escrowAccounts } = await import("../../drizzle/schema");
  // return (await db.select().from(escrowAccounts).where(eq(escrowAccounts.dealId, dealId)).limit(1))[0];
  // Until PRD-W4 runs, return undefined (triggers onboarding flow)
  return undefined;
}
```

**3d. Add `execute` procedure** to `/home/ariel/Documents/anavi-main/anavi/server/routers/payout.ts`:

```typescript
  execute: adminProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const payout = await db.getPayoutById(input.payoutId);
      if (!payout) throw new TRPCError({ code: "NOT_FOUND" });
      if (payout.status !== "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Payout must be 'approved' to execute; current status is '${payout.status}'.`,
        });
      }

      const escrowAccount = await db.getEscrowAccountByDeal(payout.dealId);
      if (!escrowAccount) {
        await db.updatePayout(input.payoutId, { status: "pending_banking" });
        return {
          requiresOnboarding: true,
          onboardingUrl: null, // Stripe Connect onboarding URL generated via PRD-W4 flow
          payoutId: input.payoutId,
        };
      }

      const { stripe } = await import("../_core/stripe");
      const transfer = await stripe.transfers.create({
        amount: Math.round(Number(payout.amount) * 100), // dollars → cents
        currency: "usd",
        destination: escrowAccount.stripeAccountId,
        transfer_group: `deal_${payout.dealId}`,
      });

      await db.updatePayout(input.payoutId, {
        status: "processing",
        stripeTransferId: transfer.id,
      });

      await db.logAuditEvent({
        userId: ctx.user.id,
        action: "payout_executed",
        entityType: "payout",
        entityId: input.payoutId,
        previousState: { status: "approved" },
        newState: { status: "processing", stripeTransferId: transfer.id },
      });

      return {
        requiresOnboarding: false,
        stripeTransferId: transfer.id,
        status: "processing",
        payoutId: input.payoutId,
      };
    }),
```

Generate and apply migration for schema changes:

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm drizzle-kit generate && pnpm drizzle-kit migrate
```

Also add `stripe` as a dependency if not already present:

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm add stripe
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected output:
```
PASS  server/payout.test.ts
  payout.execute
    ✓ throws FORBIDDEN for non-admin caller
    ✓ throws BAD_REQUEST when payout is not in approved status
    ✓ calls stripe.transfers.create with amount in cents and transitions to processing
    ✓ returns requiresOnboarding=true when no escrow account exists
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/drizzle/schema.ts anavi/server/_core/stripe.ts anavi/server/routers/payout.ts anavi/server/db/payouts.ts anavi/server/payout.test.ts && git commit -m "feat: payout.execute calls Stripe Connect transfer"
```

---

## Task 6: Stripe webhook — transfer.paid → completed

**Files:**
- Modify: `/home/ariel/Documents/anavi-main/anavi/server/_core/index.ts` — add webhook endpoint
- Modify: `/home/ariel/Documents/anavi-main/anavi/server/db/payouts.ts` — add `getPayoutByStripeTransferId`

### Step 1: Write the failing test

Create `/home/ariel/Documents/anavi-main/anavi/server/webhook.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Mock stripe to avoid real SDK calls
vi.mock("./_core/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock("./db", () => ({
  getPayoutByStripeTransferId: vi.fn(),
  updatePayout: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn(),
  updateUser: vi.fn().mockResolvedValue(undefined),
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import * as db from "./db";
import { stripe } from "./_core/stripe";

// Import the webhook handler function (we'll export it from index.ts)
import { handleStripeWebhook } from "./_core/webhookHandler";

describe("Stripe webhook: transfer.paid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks payout completed and updates user totalEarnings on transfer.paid", async () => {
    const mockPayout = {
      id: 1, dealId: 10, userId: 1,
      amount: "1000.00", currency: "USD",
      payoutType: "originator_fee",
      status: "processing",
      stripeTransferId: "tr_test_123",
      paidAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    const mockUser = {
      id: 1, totalEarnings: "500.00",
    };

    vi.mocked(db.getPayoutByStripeTransferId).mockResolvedValue(mockPayout as any);
    vi.mocked(db.getUserById).mockResolvedValue(mockUser as any);

    const fakeTransferEvent = {
      type: "transfer.paid",
      data: {
        object: {
          id: "tr_test_123",
          amount: 100000,
          currency: "usd",
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(fakeTransferEvent as any);

    // Call the webhook handler directly
    await handleStripeWebhook(fakeTransferEvent as any);

    expect(db.updatePayout).toHaveBeenCalledWith(1, expect.objectContaining({
      status: "completed",
      paidAt: expect.any(Date),
    }));

    // user totalEarnings: 500 + 1000 = 1500
    expect(db.updateUser).toHaveBeenCalledWith(1, expect.objectContaining({
      totalEarnings: "1500.00",
    }));
  });

  it("does nothing when no matching payout found for transfer", async () => {
    vi.mocked(db.getPayoutByStripeTransferId).mockResolvedValue(undefined);

    const fakeEvent = {
      type: "transfer.paid",
      data: { object: { id: "tr_unknown" } },
    };

    await handleStripeWebhook(fakeEvent as any);

    expect(db.updatePayout).not.toHaveBeenCalled();
    expect(db.updateUser).not.toHaveBeenCalled();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test webhook.test
```

Expected error:
```
Cannot find module './_core/webhookHandler'
```

### Step 3: Write minimal implementation

**3a. Add `getPayoutByStripeTransferId`** to `/home/ariel/Documents/anavi-main/anavi/server/db/payouts.ts`:

```typescript
export async function getPayoutByStripeTransferId(stripeTransferId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(payouts)
    .where(eq(payouts.stripeTransferId, stripeTransferId))
    .limit(1);
  return result[0];
}
```

Note: This requires `stripeTransferId` to be added to the schema (done in Task 5). If that column is typed as `varchar | null` in Drizzle, the `eq` call will work — Drizzle handles the null case at runtime.

**3b. Add `updateUser`** to `/home/ariel/Documents/anavi-main/anavi/server/db/users.ts` (check if it already exists first):

```typescript
export async function updateUser(id: number, data: Partial<typeof users.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
}
```

**3c. Create `/home/ariel/Documents/anavi-main/anavi/server/_core/webhookHandler.ts`:**

```typescript
import type Stripe from "stripe";
import * as db from "../db";

/**
 * Handles verified Stripe webhook events.
 * Called from the Express webhook route after signature verification.
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "transfer.paid": {
      const transfer = event.data.object as Stripe.Transfer;
      const payout = await db.getPayoutByStripeTransferId(transfer.id);
      if (!payout) return;

      // Transition: processing → completed
      await db.updatePayout(payout.id, {
        status: "completed",
        paidAt: new Date(),
      });

      // Update user's lifetime totalEarnings
      const user = await db.getUserById(payout.userId);
      if (user) {
        const newTotal = (Number(user.totalEarnings ?? 0) + Number(payout.amount)).toFixed(2);
        await db.updateUser(payout.userId, { totalEarnings: newTotal });
      }

      await db.logAuditEvent({
        userId: payout.userId,
        action: "payout_completed",
        entityType: "payout",
        entityId: payout.id,
        previousState: { status: "processing" },
        newState: { status: "completed", stripeTransferId: transfer.id },
      });
      break;
    }

    default:
      // Unhandled event type — ignore silently
      break;
  }
}
```

**3d. Register webhook endpoint** in `/home/ariel/Documents/anavi-main/anavi/server/_core/index.ts` — add before the tRPC middleware:

```typescript
import { stripe } from "./stripe";
import { handleStripeWebhook } from "./webhookHandler";

// Stripe webhook — must use raw body parser (before express.json middleware)
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[webhook] STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err) {
      console.error("[webhook] Signature verification failed:", err);
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    try {
      await handleStripeWebhook(event);
      return res.json({ received: true });
    } catch (err) {
      console.error("[webhook] Handler error:", err);
      return res.status(500).json({ error: "Webhook handler failed" });
    }
  }
);
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test webhook.test
```

Expected output:
```
PASS  server/webhook.test.ts
  Stripe webhook: transfer.paid
    ✓ marks payout completed and updates user totalEarnings on transfer.paid
    ✓ does nothing when no matching payout found for transfer
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/_core/webhookHandler.ts anavi/server/_core/index.ts anavi/server/db/payouts.ts anavi/server/db/users.ts anavi/server/webhook.test.ts && git commit -m "feat: transfer.paid webhook marks payout completed and updates earnings"
```

---

## Task 7: payout.getStatement aggregates upgrade

**Files:**
- Modify: `/home/ariel/Documents/anavi-main/anavi/server/routers/payout.ts`

### Step 1: Write the failing test

Add to `/home/ariel/Documents/anavi-main/anavi/server/payout.test.ts`:

```typescript
describe("payout.getStatement aggregates", () => {
  const mockPayouts = [
    // Completed originator payout (lifetime)
    { id: 1, userId: 1, dealId: 10, amount: "1000.00", currency: "USD", payoutType: "originator_fee", status: "completed", isFollowOn: false, paidAt: new Date("2026-01-15"), createdAt: new Date("2026-01-10"), updatedAt: new Date() },
    // Completed introducer payout
    { id: 2, userId: 1, dealId: 10, amount: "500.00", currency: "USD", payoutType: "introducer_fee", status: "completed", isFollowOn: false, paidAt: new Date("2026-01-15"), createdAt: new Date("2026-01-10"), updatedAt: new Date() },
    // Pending originator payout
    { id: 3, userId: 1, dealId: 11, amount: "800.00", currency: "USD", payoutType: "originator_fee", status: "pending", isFollowOn: false, paidAt: null, createdAt: new Date("2026-02-01"), updatedAt: new Date() },
    // Approved payout
    { id: 4, userId: 1, dealId: 12, amount: "300.00", currency: "USD", payoutType: "introducer_fee", status: "approved", isFollowOn: false, paidAt: null, createdAt: new Date("2026-02-10"), updatedAt: new Date() },
    // Processing payout
    { id: 5, userId: 1, dealId: 13, amount: "200.00", currency: "USD", payoutType: "originator_fee", status: "processing", isFollowOn: false, paidAt: null, createdAt: new Date("2026-02-15"), updatedAt: new Date() },
    // Follow-on completed payout
    { id: 6, userId: 1, dealId: 14, amount: "150.00", currency: "USD", payoutType: "lifetime_attribution", status: "completed", isFollowOn: true, paidAt: new Date("2026-01-20"), createdAt: new Date("2026-01-20"), updatedAt: new Date() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getPayoutsByUser).mockResolvedValue(mockPayouts as any);
  });

  it("returns correct aggregates across all time", async () => {
    const caller = appRouter.createCaller(makeContext(makeUser()));
    const result = await caller.payout.getStatement({
      periodStart: "2026-01-01T00:00:00.000Z",
      periodEnd: "2026-12-31T23:59:59.999Z",
    });

    // lifetimeEarnings: all completed = 1000 + 500 + 150 = 1650
    expect(result.lifetimeEarnings).toBeCloseTo(1650, 2);

    // pendingPayouts: pending + approved = 800 + 300 = 1100
    expect(result.pendingPayouts).toBeCloseTo(1100, 2);

    // followOnEarnings: isFollowOn=true completed = 150
    expect(result.followOnEarnings).toBeCloseTo(150, 2);

    // originatorEarnings: payoutType='originator_fee' completed = 1000
    expect(result.originatorEarnings).toBeCloseTo(1000, 2);

    // introducerEarnings: payoutType='introducer_fee' completed = 500
    expect(result.introducerEarnings).toBeCloseTo(500, 2);

    // processingPayouts: status='processing' = 200
    expect(result.processingPayouts).toBeCloseTo(200, 2);
  });

  it("filters items by date range but aggregates use all-time data", async () => {
    const caller = appRouter.createCaller(makeContext(makeUser()));
    const result = await caller.payout.getStatement({
      periodStart: "2026-02-01T00:00:00.000Z",
      periodEnd: "2026-02-28T23:59:59.999Z",
    });

    // items should only include payouts created in February
    expect(result.items.length).toBe(3); // ids 3, 4, 5

    // But lifetimeEarnings is all completed ever (not just in period)
    expect(result.lifetimeEarnings).toBeCloseTo(1650, 2);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected error:
```
AssertionError: expected undefined to be 1650
(result.lifetimeEarnings is undefined — field doesn't exist yet)
```

### Step 3: Write minimal implementation

Update `getStatement` in `/home/ariel/Documents/anavi-main/anavi/server/routers/payout.ts`:

```typescript
  getStatement: protectedProcedure
    .input(z.object({
      periodStart: z.string().datetime(),
      periodEnd: z.string().datetime(),
    }))
    .query(async ({ ctx, input }) => {
      const allPayouts = await db.getPayoutsByUser(ctx.user.id);

      // Date-filtered items (for the statement period)
      const start = new Date(input.periodStart);
      const end = new Date(input.periodEnd);
      const items = allPayouts.filter((p) => {
        const d = new Date(p.createdAt);
        return d >= start && d <= end;
      });
      const periodTotal = items.reduce((s, p) => s + Number(p.amount ?? 0), 0);

      // All-time aggregates (not filtered by date range)
      const completedPayouts = allPayouts.filter(p => p.status === "completed");
      const lifetimeEarnings = completedPayouts.reduce((s, p) => s + Number(p.amount ?? 0), 0);

      const pendingPayouts = allPayouts
        .filter(p => p.status === "pending" || p.status === "approved")
        .reduce((s, p) => s + Number(p.amount ?? 0), 0);

      const followOnEarnings = completedPayouts
        .filter(p => p.isFollowOn)
        .reduce((s, p) => s + Number(p.amount ?? 0), 0);

      const originatorEarnings = completedPayouts
        .filter(p => p.payoutType === "originator_fee")
        .reduce((s, p) => s + Number(p.amount ?? 0), 0);

      const introducerEarnings = completedPayouts
        .filter(p => p.payoutType === "introducer_fee")
        .reduce((s, p) => s + Number(p.amount ?? 0), 0);

      const processingPayouts = allPayouts
        .filter(p => p.status === "processing")
        .reduce((s, p) => s + Number(p.amount ?? 0), 0);

      return {
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        items,
        total: periodTotal,
        // Aggregates
        lifetimeEarnings,
        pendingPayouts,
        followOnEarnings,
        originatorEarnings,
        introducerEarnings,
        processingPayouts,
      };
    }),
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected output:
```
PASS  server/payout.test.ts
  payout.getStatement aggregates
    ✓ returns correct aggregates across all time
    ✓ filters items by date range but aggregates use all-time data
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/routers/payout.ts anavi/server/payout.test.ts && git commit -m "feat: payout.getStatement with lifetime and follow-on aggregates"
```

---

## Task 8: Payouts.tsx UI upgrade

**Files:**
- Modify: `/home/ariel/Documents/anavi-main/anavi/client/src/pages/Payouts.tsx`

### Step 1: Write the failing test

This task targets the React UI. Since no Vitest DOM tests exist for pages, write a smoke-test verifying the new procedures are wired up correctly:

Add to `/home/ariel/Documents/anavi-main/anavi/server/payout.test.ts`:

```typescript
describe("payout router — procedure shape", () => {
  it("exposes approve, bulkApprove, execute, calculate procedures", () => {
    // Verify all procedures exist on the router
    expect(typeof appRouter._def.procedures["payout.approve"]).toBe("object");
    expect(typeof appRouter._def.procedures["payout.bulkApprove"]).toBe("object");
    expect(typeof appRouter._def.procedures["payout.execute"]).toBe("object");
    expect(typeof appRouter._def.procedures["payout.calculate"]).toBe("object");
  });

  it("getStatement response includes all aggregate fields", async () => {
    vi.mocked(db.getPayoutsByUser).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeContext(makeUser()));
    const result = await caller.payout.getStatement({
      periodStart: "2026-01-01T00:00:00.000Z",
      periodEnd: "2026-12-31T23:59:59.999Z",
    });
    expect(result).toHaveProperty("lifetimeEarnings");
    expect(result).toHaveProperty("pendingPayouts");
    expect(result).toHaveProperty("followOnEarnings");
    expect(result).toHaveProperty("originatorEarnings");
    expect(result).toHaveProperty("introducerEarnings");
    expect(result).toHaveProperty("processingPayouts");
  });
});
```

### Step 2: Run test to verify it fails (shape test)

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Expected: passes if Tasks 1-7 are complete. The shape test confirms all procedures are wired up.

### Step 3: Write minimal implementation

Modify `/home/ariel/Documents/anavi-main/anavi/client/src/pages/Payouts.tsx` with these changes:

**3a. Add new status options** — add `"approved"` and `"pending_banking"` to the `STATUS_OPTIONS` array and `PayoutStatus` type:

```typescript
type PayoutStatus = "all" | "pending" | "approved" | "processing" | "completed" | "failed" | "pending_banking";

const STATUS_OPTIONS: { value: PayoutStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "pending_banking", label: "Needs Banking" },
  { value: "failed", label: "Failed" },
];
```

**3b. Update status pill classes** — in `getStatusPillClasses`:

```typescript
function getStatusPillClasses(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700";       // amber for pending
    case "approved":
      return "bg-blue-100 text-blue-700";          // blue for approved
    case "processing":
      return "bg-purple-100 text-purple-700";      // purple for processing
    case "completed":
      return "bg-emerald-100 text-emerald-700";    // green for completed
    case "pending_banking":
      return "bg-orange-100 text-orange-700";      // orange for needs banking
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
```

**3c. Add admin controls** — add tRPC mutation hooks and admin check at the top of `Payouts()`:

```typescript
// Inside Payouts() component, after existing trpc.payout.list.useQuery():
const utils = trpc.useUtils();

// Detect admin role from the auth.me query
const { data: me } = trpc.auth.me.useQuery();
const isAdmin = me?.role === "admin";

const approveMutation = trpc.payout.approve.useMutation({
  onSuccess: () => {
    toast.success("Payout approved");
    utils.payout.list.invalidate();
  },
  onError: (err) => toast.error(err.message),
});

const bulkApproveMutation = trpc.payout.bulkApprove.useMutation({
  onSuccess: (data) => {
    toast.success(`${data.approvedCount} payout(s) approved`);
    utils.payout.list.invalidate();
  },
  onError: (err) => toast.error(err.message),
});

const executeMutation = trpc.payout.execute.useMutation({
  onSuccess: (data) => {
    if (data.requiresOnboarding) {
      toast.warning("Banking setup required before this payout can be executed.");
    } else {
      toast.success("Payout sent to Stripe for processing");
    }
    utils.payout.list.invalidate();
  },
  onError: (err) => toast.error(err.message),
});
```

**3d. Add aggregate stats to the statement section** — update `PayoutStatementSection` to show aggregates when `statement` data is available:

```typescript
// Inside the statement modal body, after the items list, add:
{statement && (
  <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-muted-foreground">Lifetime Earnings</span>
      <span className="font-semibold text-emerald-600">{fmtCurrency(statement.lifetimeEarnings ?? 0)}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Pending Payouts</span>
      <span className="font-semibold text-amber-600">{fmtCurrency(statement.pendingPayouts ?? 0)}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Follow-on / Lifetime Attribution</span>
      <span className="font-semibold text-blue-600">{fmtCurrency(statement.followOnEarnings ?? 0)}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Originator Earnings</span>
      <span className="font-semibold">{fmtCurrency(statement.originatorEarnings ?? 0)}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-muted-foreground">Introducer Earnings</span>
      <span className="font-semibold">{fmtCurrency(statement.introducerEarnings ?? 0)}</span>
    </div>
  </div>
)}
```

**3e. Add Approve/Execute buttons per payout row** — in the `filteredPayouts.map` section, add admin controls after the status badge:

```tsx
{/* Admin controls — only visible to admins */}
{isAdmin && (
  <div className="flex items-center gap-2">
    {p.status === "pending" && (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => approveMutation.mutate({ payoutId: p.id })}
        disabled={approveMutation.isPending}
      >
        Approve
      </Button>
    )}
    {p.status === "approved" && (
      <Button
        size="sm"
        className="h-7 text-xs bg-slate-900 text-white hover:bg-slate-700"
        onClick={() => executeMutation.mutate({ payoutId: p.id })}
        disabled={executeMutation.isPending}
      >
        Execute
      </Button>
    )}
    {p.status === "pending_banking" && (
      <span className="text-xs text-orange-600 font-medium">
        Banking Setup Required
      </span>
    )}
  </div>
)}
```

**3f. Add "Approve All" button per deal group** — in the `dealGroups.map` section header, add next to the deal total:

```tsx
{isAdmin && group.payouts.some(p => p.status === "pending") && (
  <Button
    size="sm"
    variant="outline"
    className="h-7 text-xs shrink-0"
    onClick={() => bulkApproveMutation.mutate({ dealId: group.dealId })}
    disabled={bulkApproveMutation.isPending}
  >
    Approve All
  </Button>
)}
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test payout.test
```

Run full test suite to confirm no regressions:

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test
```

Expected output:
```
PASS  server/payout.test.ts
PASS  server/payoutCalc.test.ts
PASS  server/webhook.test.ts
PASS  server/anavi.test.ts
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/client/src/pages/Payouts.tsx && git commit -m "feat: Payouts page with admin controls, statement panel, status badges"
```

---

## Summary of All Files Changed

| File | Action | Task |
|------|--------|------|
| `anavi/server/_core/payoutCalc.ts` | Create | 1 |
| `anavi/server/payoutCalc.test.ts` | Create | 1 |
| `anavi/server/routers/payout.ts` | Modify (add calculate, approve, bulkApprove, execute, upgrade getStatement) | 2, 4, 5, 7 |
| `anavi/server/db/payouts.ts` | Modify (rewrite triggerPayoutsOnDealClose, add getPayoutById, getPayoutByStripeTransferId, getEscrowAccountByDeal) | 3, 4, 5, 6 |
| `anavi/server/db/users.ts` | Modify (add updateUser if missing) | 6 |
| `anavi/drizzle/schema.ts` | Modify (add lifetime_attribution to payoutType enum, add pending_banking to status enum, add stripeTransferId column) | 3, 5 |
| `anavi/server/_core/stripe.ts` | Create | 5 |
| `anavi/server/_core/webhookHandler.ts` | Create | 6 |
| `anavi/server/_core/index.ts` | Modify (add /api/webhooks/stripe endpoint) | 6 |
| `anavi/server/payout.test.ts` | Create | 2, 4, 5, 7, 8 |
| `anavi/server/webhook.test.ts` | Create | 6 |
| `anavi/client/src/pages/Payouts.tsx` | Modify (add admin controls, aggregates, status badges) | 8 |

## Migration Checklist

After schema changes in Tasks 3 and 5, run:

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm drizzle-kit generate && pnpm drizzle-kit migrate
```

Schema changes that require migrations:
1. Task 3: Add `"lifetime_attribution"` to `payouts.payoutType` enum
2. Task 5: Add `"pending_banking"` to `payouts.status` enum; add `stripeTransferId varchar(255)` column

## Environment Variables Required

Add to `.env` (never commit to git):

```
STRIPE_SECRET_KEY=sk_live_...        # or sk_test_... for development
STRIPE_WEBHOOK_SECRET=whsec_...      # from Stripe dashboard webhook settings
```
