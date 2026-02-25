# PRD-W4: Escrow & Milestone Payment Rails Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded escrow stub with real Stripe Connect escrow, implement milestone completion engine, and automate deal closing.

**Architecture:** Stripe Connect Express accounts linked per deal via escrowAccounts table. PaymentIntents created with capture_method='manual' (funds held, not captured until milestone release). Milestone engine reads deals.milestones JSON array, evaluates payoutTrigger flags, and creates payout rows. Stripe webhooks processed via raw body Express route (required by Stripe signature verification).

**Tech Stack:** Stripe Node.js SDK (stripe npm package), Drizzle ORM (mysql2), Vitest with vi.mock, tRPC v11, Express.

---

## Codebase Context

### Key existing patterns observed

**Schema (`anavi/drizzle/schema.ts`):**
- Tables use `int("id").autoincrement().primaryKey()`, `timestamp("createdAt").defaultNow().notNull()`, `timestamp("updatedAt").defaultNow().onUpdateNow().notNull()`
- Enums use `mysqlEnum`, decimals use `decimal("col", { precision: 15, scale: 2 })`
- Types exported at bottom: `export type Deal = typeof deals.$inferSelect`
- `deals.milestones` is a JSON column typed as `Array<{ id: string; name: string; status: "pending" | "in_progress" | "completed"; completedAt?: string; payoutTrigger?: boolean }>`
- `payouts` table has `milestoneId varchar(64)` and `milestoneName varchar(128)` for milestone-triggered payouts
- `dealParticipants.attributionPercentage` tracks pct per participant (decimal string)

**DB layer (`anavi/server/db/`):**
- Each domain has its own file (e.g., `deals.ts`, `payouts.ts`)
- Pattern: `const db = await getDb(); if (!db) return []/undefined/throw`
- Insert returns `result[0].insertId`; update uses `db.update(table).set({...data, updatedAt: new Date()}).where(eq(table.id, id))`
- `getDb()` is from `./connection` — returns a drizzle instance or null when DATABASE_URL is not set
- All DB modules re-exported from `server/db/index.ts` then re-exported from `server/db.ts`

**Router layer (`anavi/server/routers/`):**
- Pattern: `import { protectedProcedure, router } from "../_core/trpc"`
- All routers registered in `server/routers/index.ts` on `appRouter`
- `deal.getEscrowStatus` (line 111-117 of deal.ts) returns hardcoded stub: `{ status: "not_configured", provider: null, fundedAmount: 0 }`

**Test patterns (`anavi/server/anavi.test.ts`):**
- `vi.mock("./db", () => ({ funcName: vi.fn() }))` at top level
- `appRouter.createCaller(ctx)` to invoke procedures
- `createAuthContext()` helper creates a mock user ctx

**Express setup (`anavi/server/_core/index.ts`):**
- `express.json({ limit: "50mb" })` is registered at line 36 — webhook route must go BEFORE this
- Auth routes registered with `registerAuthRoutes(app)` before tRPC middleware

**Env (`anavi/server/_core/env.ts`):**
- Simple object with `process.env.VAR ?? "fallback"` pattern; no required-var enforcement

**Package manager:** `pnpm` — `stripe` is NOT yet in `package.json` dependencies.

---

## Task 1: Add escrowAccounts Drizzle Schema Table

**Files:**
- Modify: `anavi/drizzle/schema.ts`
- Test: `anavi/server/escrow.test.ts` (new file, created in this task)

### Step 1: Write the failing test

Create `anavi/server/escrow.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

describe("escrowAccounts schema", () => {
  it("exports escrowAccounts table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.escrowAccounts).toBeDefined();
    // Verify it has the expected columns by checking the table name
    expect(schema.escrowAccounts).toHaveProperty("_");
  });

  it("exports EscrowAccount type (compile-time check via runtime shape)", async () => {
    const schema = await import("../drizzle/schema");
    // If escrowAccounts table exists, inferSelect will produce the EscrowAccount type at compile time.
    // At runtime, verify the table has the required columns.
    const columns = Object.keys(schema.escrowAccounts);
    expect(columns).toContain("dealId");
    expect(columns).toContain("stripeAccountId");
    expect(columns).toContain("status");
    expect(columns).toContain("fundedAmount");
    expect(columns).toContain("releasedAmount");
  });

  it("escrowAccounts status enum contains expected values", async () => {
    const schema = await import("../drizzle/schema");
    // Drizzle mysqlEnum stores enumValues on the column
    const statusCol = (schema.escrowAccounts as any).status;
    expect(statusCol.enumValues).toEqual([
      "unfunded",
      "funded",
      "partially_released",
      "released",
      "refunded",
    ]);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "escrowAccounts schema"
```

Expected error:
```
Error: Cannot read properties of undefined (reading '_')
  — schema.escrowAccounts is undefined
```

### Step 3: Write minimal implementation

In `anavi/drizzle/schema.ts`, after the `payouts` table definition (around line 552) and before the `auditLog` table, add:

```typescript
// ============================================================================
// ESCROW ACCOUNTS
// ============================================================================

export const escrowAccounts = mysqlTable("escrow_accounts", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),

  // Stripe Connect Express account for the deal
  stripeAccountId: varchar("stripeAccountId", { length: 255 }).notNull(),

  // PaymentIntent used to hold funds (capture_method='manual')
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),

  // Fund tracking
  fundedAmount: decimal("fundedAmount", { precision: 15, scale: 2 }).default("0.00"),
  releasedAmount: decimal("releasedAmount", { precision: 15, scale: 2 }).default("0.00"),

  // Lifecycle status
  status: mysqlEnum("status", [
    "unfunded",
    "funded",
    "partially_released",
    "released",
    "refunded",
  ]).default("unfunded").notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EscrowAccount = typeof escrowAccounts.$inferSelect;
export type InsertEscrowAccount = typeof escrowAccounts.$inferInsert;
```

Also add `EscrowAccount` and `InsertEscrowAccount` to the TYPE EXPORTS section at the bottom of `schema.ts` (near line 627):

```typescript
export type EscrowAccount = typeof escrowAccounts.$inferSelect;
export type InsertEscrowAccount = typeof escrowAccounts.$inferInsert;
```

> Note: Since the type exports are generated inline with the table definition above, omit the duplicate at the bottom or consolidate. The inline export on the table definition is the preferred pattern consistent with the existing `InsertUser` export at line 64.

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 10 "escrowAccounts schema"
```

Expected output:
```
 ✓ escrowAccounts schema > exports escrowAccounts table
 ✓ escrowAccounts schema > exports EscrowAccount type (compile-time check via runtime shape)
 ✓ escrowAccounts schema > escrowAccounts status enum contains expected values
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/drizzle/schema.ts anavi/server/escrow.test.ts && git commit -m "$(cat <<'EOF'
feat: add escrowAccounts schema table

Adds escrow_accounts Drizzle schema table with Stripe account ID,
PaymentIntent ID, fund tracking decimals, and lifecycle status enum.
Exports EscrowAccount and InsertEscrowAccount types.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Install Stripe SDK and Create stripe.ts Helper

**Files:**
- Install: `stripe` npm package via pnpm
- Create: `anavi/server/_core/stripe.ts`
- Modify: `anavi/server/_core/env.ts`
- Test: `anavi/server/escrow.test.ts` (append new describe block)

### Step 1: Write the failing test

Append to `anavi/server/escrow.test.ts`:

```typescript
describe("stripe helper", () => {
  it("exports a Stripe instance", async () => {
    const { stripe } = await import("./_core/stripe");
    expect(stripe).toBeDefined();
    // Stripe instances have these methods
    expect(typeof stripe.accounts.create).toBe("function");
    expect(typeof stripe.paymentIntents.create).toBe("function");
    expect(typeof stripe.webhooks.constructEvent).toBe("function");
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "stripe helper"
```

Expected error:
```
Error: Cannot find module './_core/stripe'
  — module does not exist yet
```

### Step 3: Write minimal implementation

**Install stripe SDK** (run from `anavi/` directory):
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm add stripe
```

**Create `anavi/server/_core/stripe.ts`:**

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder",
  {
    apiVersion: "2024-06-20",
  }
);
```

**Modify `anavi/server/_core/env.ts`** — add Stripe env vars:

```typescript
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "prelaunch-demo-secret-32-chars-ok!",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Stripe — optional. Platform works without escrow when not configured.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "stripe helper"
```

Expected output:
```
 ✓ stripe helper > exports a Stripe instance
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/_core/stripe.ts anavi/server/_core/env.ts anavi/package.json anavi/pnpm-lock.yaml anavi/server/escrow.test.ts && git commit -m "$(cat <<'EOF'
feat: Stripe SDK setup

Installs stripe npm package, creates server/_core/stripe.ts singleton,
and adds optional STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET to ENV config.
Platform remains functional without Stripe configured.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add Escrow DB Helper Functions

**Files:**
- Create: `anavi/server/db/escrow.ts`
- Modify: `anavi/server/db/index.ts`
- Test: `anavi/server/escrow.test.ts` (append new describe block)

### Step 1: Write the failing test

Append to `anavi/server/escrow.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the DB connection so tests don't need a real database
vi.mock("./db/connection", () => ({
  getDb: vi.fn(),
}));

describe("escrow DB helpers", () => {
  let mockDb: any;

  beforeEach(async () => {
    const { getDb } = await import("./db/connection");
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([{ insertId: 42 }]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb);
  });

  it("getEscrowAccount queries by dealId and returns first row", async () => {
    const mockAccount = {
      id: 1,
      dealId: 99,
      stripeAccountId: "acct_test",
      status: "funded",
      fundedAmount: "10000.00",
      releasedAmount: "0.00",
    };
    mockDb.limit.mockResolvedValueOnce([mockAccount]);

    const { getEscrowAccount } = await import("./db/escrow");
    const result = await getEscrowAccount(99);

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.from).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
    expect(result).toEqual(mockAccount);
  });

  it("getEscrowAccount returns undefined when no row found", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const { getEscrowAccount } = await import("./db/escrow");
    const result = await getEscrowAccount(999);

    expect(result).toBeUndefined();
  });

  it("createEscrowAccount inserts a row and returns insertId", async () => {
    const { createEscrowAccount } = await import("./db/escrow");
    const id = await createEscrowAccount(10, "acct_abc123");

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        dealId: 10,
        stripeAccountId: "acct_abc123",
      })
    );
    expect(id).toBe(42);
  });

  it("updateEscrowAccount updates the correct dealId row", async () => {
    const { updateEscrowAccount } = await import("./db/escrow");
    await updateEscrowAccount(10, {
      status: "funded",
      fundedAmount: "5000.00",
      stripePaymentIntentId: "pi_test",
    });

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "funded",
        fundedAmount: "5000.00",
        stripePaymentIntentId: "pi_test",
      })
    );
    expect(mockDb.where).toHaveBeenCalled();
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "escrow DB helpers"
```

Expected error:
```
Error: Cannot find module './db/escrow'
```

### Step 3: Write minimal implementation

**Create `anavi/server/db/escrow.ts`:**

```typescript
import { eq } from "drizzle-orm";
import { escrowAccounts } from "../../drizzle/schema";
import type { InsertEscrowAccount } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getEscrowAccount(dealId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(escrowAccounts)
    .where(eq(escrowAccounts.dealId, dealId))
    .limit(1);
  return result[0];
}

export async function createEscrowAccount(
  dealId: number,
  stripeAccountId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(escrowAccounts).values({
    dealId,
    stripeAccountId,
    status: "unfunded",
    fundedAmount: "0.00",
    releasedAmount: "0.00",
  });
  return result[0].insertId;
}

export async function updateEscrowAccount(
  dealId: number,
  updates: Partial<InsertEscrowAccount>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(escrowAccounts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(escrowAccounts.dealId, dealId));
}
```

**Modify `anavi/server/db/index.ts`** — add escrow export:

```typescript
export * from "./connection";
export * from "./users";
export * from "./relationships";
export * from "./intents";
export * from "./matches";
export * from "./deals";
export * from "./compliance";
export * from "./payouts";
export * from "./audit";
export * from "./notifications";
export * from "./familyOffices";
export * from "./enrichment";
export * from "./calendar";
export * from "./analytics";
export * from "./realEstate";
export * from "./escrow";
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 10 "escrow DB helpers"
```

Expected output:
```
 ✓ escrow DB helpers > getEscrowAccount queries by dealId and returns first row
 ✓ escrow DB helpers > getEscrowAccount returns undefined when no row found
 ✓ escrow DB helpers > createEscrowAccount inserts a row and returns insertId
 ✓ escrow DB helpers > updateEscrowAccount updates the correct dealId row
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/db/escrow.ts anavi/server/db/index.ts anavi/server/escrow.test.ts && git commit -m "$(cat <<'EOF'
feat: escrow DB helper functions

Adds anavi/server/db/escrow.ts with getEscrowAccount, createEscrowAccount,
and updateEscrowAccount. Re-exports from db/index.ts.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: escrow.createAccount tRPC Procedure

**Files:**
- Create: `anavi/server/routers/escrow.ts`
- Modify: `anavi/server/routers/index.ts`
- Test: `anavi/server/escrow.test.ts` (append new describe block)

### Step 1: Write the failing test

Append to `anavi/server/escrow.test.ts`:

```typescript
// Mock stripe module before importing appRouter
vi.mock("./_core/stripe", () => ({
  stripe: {
    accounts: {
      create: vi.fn().mockResolvedValue({ id: "acct_test123" }),
      links: undefined,
    },
    accountLinks: {
      create: vi.fn().mockResolvedValue({
        url: "https://connect.stripe.com/setup/e/acct_test123/onboard",
      }),
    },
    paymentIntents: {
      create: vi.fn(),
      cancel: vi.fn(),
    },
    transfers: {
      create: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

// Mock all DB functions used by escrow router
vi.mock("./db", () => ({
  getDealById: vi.fn(),
  getDealParticipants: vi.fn(),
  getEscrowAccount: vi.fn(),
  createEscrowAccount: vi.fn(),
  updateEscrowAccount: vi.fn(),
  createPayout: vi.fn(),
  updateDeal: vi.fn(),
  updatePayout: vi.fn(),
  logAuditEvent: vi.fn(),
  triggerPayoutsOnDealClose: vi.fn(),
  createNotification: vi.fn(),
  recalculateTrustScore: vi.fn(),
}));

describe("escrow.createAccount procedure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns onboardingUrl from Stripe account link", async () => {
    const { appRouter } = await import("./routers");
    const { stripe } = await import("./_core/stripe");
    const db = await import("./db");

    // Arrange: user is a deal participant
    vi.mocked(db.getDealById).mockResolvedValue({
      id: 5,
      title: "Test Deal",
      stage: "negotiation",
    } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator" } as any,
    ]);
    vi.mocked(db.getEscrowAccount).mockResolvedValue(undefined);
    vi.mocked(db.createEscrowAccount).mockResolvedValue(10);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.escrow.createAccount({ dealId: 5 });

    // Assert Stripe account created
    expect(stripe.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "express",
        capabilities: { transfers: { requested: true } },
      })
    );

    // Assert account link created with returned account id
    expect(stripe.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        account: "acct_test123",
        type: "account_onboarding",
      })
    );

    // Assert escrowAccounts row created
    expect(db.createEscrowAccount).toHaveBeenCalledWith(5, "acct_test123");

    // Assert response contains onboarding URL
    expect(result).toEqual({
      onboardingUrl:
        "https://connect.stripe.com/setup/e/acct_test123/onboard",
    });
  });

  it("throws FORBIDDEN if user is not a deal participant", async () => {
    const { appRouter } = await import("./routers");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ id: 5 } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 99, dealId: 5, role: "buyer" } as any, // different user
    ]);

    const { ctx } = createAuthContext(); // ctx.user.id = 1
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.escrow.createAccount({ dealId: 5 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "escrow.createAccount"
```

Expected error:
```
TypeError: caller.escrow is not defined
  — escrowRouter not yet registered on appRouter
```

### Step 3: Write minimal implementation

**Create `anavi/server/routers/escrow.ts`:**

```typescript
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { stripe } from "../_core/stripe";
import * as db from "../db";

export const escrowRouter = router({
  createAccount: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify deal exists and user is a participant
      const deal = await db.getDealById(input.dealId);
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      const participants = await db.getDealParticipants(input.dealId);
      const isParticipant = participants.some((p) => p.userId === ctx.user.id);
      if (!isParticipant) throw new TRPCError({ code: "FORBIDDEN" });

      // 2. Create Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: { transfers: { requested: true } },
      });

      // 3. Create account onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${ctx.req.protocol}://${ctx.req.headers.host}/deals`,
        return_url: `${ctx.req.protocol}://${ctx.req.headers.host}/deals`,
        type: "account_onboarding",
      });

      // 4. Persist escrow account record
      await db.createEscrowAccount(input.dealId, account.id);

      return { onboardingUrl: accountLink.url };
    }),

  fundEscrow: protectedProcedure
    .input(z.object({ dealId: z.number(), amountCents: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      const participants = await db.getDealParticipants(input.dealId);
      const isParticipant = participants.some((p) => p.userId === ctx.user.id);
      if (!isParticipant) throw new TRPCError({ code: "FORBIDDEN" });

      const escrowAccount = await db.getEscrowAccount(input.dealId);
      if (!escrowAccount)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Escrow account not configured. Call createAccount first.",
        });

      // Create PaymentIntent with manual capture (funds held, not charged immediately)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: input.amountCents,
        currency: "usd",
        capture_method: "manual",
        transfer_data: {
          destination: escrowAccount.stripeAccountId,
        },
      });

      // Update escrow record
      await db.updateEscrowAccount(input.dealId, {
        stripePaymentIntentId: paymentIntent.id,
        fundedAmount: (input.amountCents / 100).toFixed(2),
        status: "funded",
      });

      return { clientSecret: paymentIntent.client_secret };
    }),

  getStatus: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      const escrowAccount = await db.getEscrowAccount(input.dealId);
      if (!escrowAccount) {
        return { status: "not_configured", fundedAmount: 0, releasedAmount: 0 };
      }

      // Map platform status to response
      return {
        status: escrowAccount.status,
        fundedAmount: Number(escrowAccount.fundedAmount),
        releasedAmount: Number(escrowAccount.releasedAmount),
        stripeAccountId: escrowAccount.stripeAccountId,
        stripePaymentIntentId: escrowAccount.stripePaymentIntentId,
      };
    }),

  releaseToMilestone: protectedProcedure
    .input(
      z.object({
        dealId: z.number(),
        milestoneIndex: z.number().int().min(0),
        amountCents: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      const participants = await db.getDealParticipants(input.dealId);
      const isParticipant = participants.some((p) => p.userId === ctx.user.id);
      if (!isParticipant) throw new TRPCError({ code: "FORBIDDEN" });

      const escrowAccount = await db.getEscrowAccount(input.dealId);
      if (!escrowAccount || !escrowAccount.stripePaymentIntentId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No funded escrow account found for this deal.",
        });
      }

      // Capture the PaymentIntent (partial capture for milestone amount)
      await stripe.paymentIntents.capture(escrowAccount.stripePaymentIntentId, {
        amount_to_capture: input.amountCents,
      } as any);

      // Transfer funds to the connected account
      await stripe.transfers.create({
        amount: input.amountCents,
        currency: "usd",
        destination: escrowAccount.stripeAccountId,
      });

      // Update released amount
      const prevReleased = Number(escrowAccount.releasedAmount ?? 0) * 100;
      const newReleasedCents = prevReleased + input.amountCents;
      const fundedCents = Number(escrowAccount.fundedAmount ?? 0) * 100;
      const newStatus =
        newReleasedCents >= fundedCents ? "released" : "partially_released";

      await db.updateEscrowAccount(input.dealId, {
        releasedAmount: (newReleasedCents / 100).toFixed(2),
        status: newStatus,
      });

      return { success: true, newStatus };
    }),

  refund: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

      const participants = await db.getDealParticipants(input.dealId);
      const isParticipant = participants.some((p) => p.userId === ctx.user.id);
      if (!isParticipant) throw new TRPCError({ code: "FORBIDDEN" });

      const escrowAccount = await db.getEscrowAccount(input.dealId);
      if (!escrowAccount || !escrowAccount.stripePaymentIntentId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No funded escrow to refund.",
        });
      }

      // Cancel the uncaptured PaymentIntent (automatic refund)
      await stripe.paymentIntents.cancel(escrowAccount.stripePaymentIntentId);

      await db.updateEscrowAccount(input.dealId, { status: "refunded" });

      return { success: true };
    }),
});
```

**Modify `anavi/server/routers/index.ts`** — add escrow router:

```typescript
import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { verificationRouter } from "./verification";
import { relationshipRouter } from "./relationship";
import { contactRouter } from "./contact";
import { intentRouter } from "./intent";
import { matchRouter } from "./match";
import { dealRouter } from "./deal";
import { dealRoomRouter } from "./dealRoom";
import { complianceRouter } from "./compliance";
import { payoutRouter } from "./payout";
import { notificationRouter } from "./notification";
import { auditRouter } from "./audit";
import { lpPortalRouter } from "./lpPortal";
import { searchRouter } from "./search";
import { intelligenceRouter } from "./intelligence";
import { realEstateRouter } from "./realEstate";
import { aiRouter } from "./ai";
import { familyOfficeRouter } from "./familyOffice";
import { targetingRouter } from "./targeting";
import { brokerContactRouter } from "./brokerContact";
import { enrichmentRouter } from "./enrichment";
import { calendarRouter } from "./calendar";
import { analyticsRouter } from "./analytics";
import { escrowRouter } from "./escrow";

export const appRouter = router({
  system: systemRouter,
  search: searchRouter,
  intelligence: intelligenceRouter,
  realEstate: realEstateRouter,
  auth: authRouter,
  user: userRouter,
  verification: verificationRouter,
  relationship: relationshipRouter,
  contact: contactRouter,
  intent: intentRouter,
  match: matchRouter,
  deal: dealRouter,
  dealRoom: dealRoomRouter,
  compliance: complianceRouter,
  payout: payoutRouter,
  notification: notificationRouter,
  audit: auditRouter,
  ai: aiRouter,
  lpPortal: lpPortalRouter,
  familyOffice: familyOfficeRouter,
  targeting: targetingRouter,
  brokerContact: brokerContactRouter,
  enrichment: enrichmentRouter,
  calendar: calendarRouter,
  analytics: analyticsRouter,
  escrow: escrowRouter,
});

export type AppRouter = typeof appRouter;
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 10 "escrow.createAccount"
```

Expected output:
```
 ✓ escrow.createAccount procedure > returns onboardingUrl from Stripe account link
 ✓ escrow.createAccount procedure > throws FORBIDDEN if user is not a deal participant
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/routers/escrow.ts anavi/server/routers/index.ts anavi/server/escrow.test.ts && git commit -m "$(cat <<'EOF'
feat: escrow.createAccount procedure

Creates escrowRouter with createAccount, fundEscrow, getStatus,
releaseToMilestone, and refund procedures. Registers escrowRouter on
appRouter. Stripe calls are fully mocked in tests.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: escrow.fundEscrow and Real escrow.getStatus

**Files:**
- Modify: `anavi/server/routers/escrow.ts` (already written in Task 4; verify tests below)
- Modify: `anavi/server/routers/deal.ts` — replace hardcoded `getEscrowStatus` stub
- Test: `anavi/server/escrow.test.ts` (append new describe blocks)

### Step 1: Write the failing tests

Append to `anavi/server/escrow.test.ts`:

```typescript
describe("escrow.fundEscrow procedure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a PaymentIntent with capture_method='manual' and returns clientSecret", async () => {
    const { appRouter } = await import("./routers");
    const { stripe } = await import("./_core/stripe");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ id: 5 } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator" } as any,
    ]);
    vi.mocked(db.getEscrowAccount).mockResolvedValue({
      id: 10,
      dealId: 5,
      stripeAccountId: "acct_test",
      stripePaymentIntentId: null,
      fundedAmount: "0.00",
      releasedAmount: "0.00",
      status: "unfunded",
    } as any);
    vi.mocked(stripe.paymentIntents.create).mockResolvedValue({
      id: "pi_test123",
      client_secret: "pi_test123_secret",
    } as any);
    vi.mocked(db.updateEscrowAccount).mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.escrow.fundEscrow({
      dealId: 5,
      amountCents: 100000,
    });

    // Assert PaymentIntent created with manual capture
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 100000,
        currency: "usd",
        capture_method: "manual",
        transfer_data: { destination: "acct_test" },
      })
    );

    // Assert escrowAccount updated with PaymentIntent ID and funded status
    expect(db.updateEscrowAccount).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        stripePaymentIntentId: "pi_test123",
        fundedAmount: "1000.00",
        status: "funded",
      })
    );

    // Assert clientSecret returned (used by Stripe Elements on frontend)
    expect(result).toEqual({ clientSecret: "pi_test123_secret" });
  });

  it("throws PRECONDITION_FAILED when no escrow account exists", async () => {
    const { appRouter } = await import("./routers");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ id: 5 } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator" } as any,
    ]);
    vi.mocked(db.getEscrowAccount).mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.escrow.fundEscrow({ dealId: 5, amountCents: 100000 })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});

describe("escrow.getStatus — real data replaces stub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_configured when no escrow account exists", async () => {
    const { appRouter } = await import("./routers");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ id: 5 } as any);
    vi.mocked(db.getEscrowAccount).mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.escrow.getStatus({ dealId: 5 });

    expect(result).toEqual({
      status: "not_configured",
      fundedAmount: 0,
      releasedAmount: 0,
    });
  });

  it("returns real status and amounts when escrow account exists", async () => {
    const { appRouter } = await import("./routers");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ id: 5 } as any);
    vi.mocked(db.getEscrowAccount).mockResolvedValue({
      id: 10,
      dealId: 5,
      stripeAccountId: "acct_test",
      stripePaymentIntentId: "pi_test",
      fundedAmount: "1000.00",
      releasedAmount: "250.00",
      status: "partially_released",
    } as any);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.escrow.getStatus({ dealId: 5 });

    expect(result.status).toBe("partially_released");
    expect(result.fundedAmount).toBe(1000);
    expect(result.releasedAmount).toBe(250);
  });
});

describe("deal.getEscrowStatus stub removal", () => {
  it("deal.getEscrowStatus delegates to real escrow logic (not hardcoded)", async () => {
    const { appRouter } = await import("./routers");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ id: 5 } as any);
    vi.mocked(db.getEscrowAccount).mockResolvedValue({
      id: 10,
      dealId: 5,
      stripeAccountId: "acct_real",
      stripePaymentIntentId: "pi_real",
      fundedAmount: "5000.00",
      releasedAmount: "0.00",
      status: "funded",
    } as any);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.deal.getEscrowStatus({ dealId: 5 });

    // Must NOT be the old hardcoded stub value
    expect(result.status).not.toBe("not_configured");
    expect(result.fundedAmount).toBe(5000);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "deal.getEscrowStatus stub removal"
```

Expected error:
```
AssertionError: expected 'not_configured' not to equal 'not_configured'
  — deal.getEscrowStatus still returns hardcoded stub
```

### Step 3: Write minimal implementation

The escrow procedures (`fundEscrow`, `getStatus`) are already implemented in `anavi/server/routers/escrow.ts` from Task 4.

**Modify `anavi/server/routers/deal.ts`** — replace the `getEscrowStatus` stub:

Replace:
```typescript
getEscrowStatus: protectedProcedure
  .input(z.object({ dealId: z.number() }))
  .query(async ({ input }) => {
    const deal = await db.getDealById(input.dealId);
    if (!deal) throw new TRPCError({ code: "NOT_FOUND" });
    return { status: "not_configured", provider: null, fundedAmount: 0 };
  }),
```

With:
```typescript
getEscrowStatus: protectedProcedure
  .input(z.object({ dealId: z.number() }))
  .query(async ({ input }) => {
    const deal = await db.getDealById(input.dealId);
    if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

    const escrowAccount = await db.getEscrowAccount(input.dealId);
    if (!escrowAccount) {
      return { status: "not_configured", provider: null, fundedAmount: 0, releasedAmount: 0 };
    }

    return {
      status: escrowAccount.status,
      provider: "stripe",
      fundedAmount: Number(escrowAccount.fundedAmount),
      releasedAmount: Number(escrowAccount.releasedAmount),
      stripeAccountId: escrowAccount.stripeAccountId,
      stripePaymentIntentId: escrowAccount.stripePaymentIntentId,
    };
  }),
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -E "(escrow.fundEscrow|escrow.getStatus|deal.getEscrowStatus)"
```

Expected output:
```
 ✓ escrow.fundEscrow procedure > creates a PaymentIntent with capture_method='manual' and returns clientSecret
 ✓ escrow.fundEscrow procedure > throws PRECONDITION_FAILED when no escrow account exists
 ✓ escrow.getStatus — real data replaces stub > returns not_configured when no escrow account exists
 ✓ escrow.getStatus — real data replaces stub > returns real status and amounts when escrow account exists
 ✓ deal.getEscrowStatus stub removal > deal.getEscrowStatus delegates to real escrow logic (not hardcoded)
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/routers/deal.ts anavi/server/escrow.test.ts && git commit -m "$(cat <<'EOF'
feat: escrow.fundEscrow and real escrow.getStatus

Implements fundEscrow creating PaymentIntent with capture_method='manual'.
Replaces deal.getEscrowStatus hardcoded stub with real escrowAccounts
DB lookup. getStatus now returns live fundedAmount, releasedAmount, status.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: escrow.releaseToMilestone and escrow.refund

**Files:**
- Modify: `anavi/server/routers/escrow.ts` (procedures already implemented in Task 4; tests added here)
- Test: `anavi/server/escrow.test.ts` (append new describe blocks)

### Step 1: Write the failing tests

Append to `anavi/server/escrow.test.ts`:

```typescript
describe("escrow.releaseToMilestone procedure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures PaymentIntent and creates transfer for milestone amount", async () => {
    const { appRouter } = await import("./routers");
    const { stripe } = await import("./_core/stripe");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ id: 5 } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator" } as any,
    ]);
    vi.mocked(db.getEscrowAccount).mockResolvedValue({
      id: 10,
      dealId: 5,
      stripeAccountId: "acct_test",
      stripePaymentIntentId: "pi_test123",
      fundedAmount: "1000.00",
      releasedAmount: "0.00",
      status: "funded",
    } as any);
    vi.mocked(stripe.paymentIntents.capture as any) = vi.fn().mockResolvedValue({ id: "pi_test123", status: "captured" });
    vi.mocked(stripe.transfers.create).mockResolvedValue({ id: "tr_test123" } as any);
    vi.mocked(db.updateEscrowAccount).mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.escrow.releaseToMilestone({
      dealId: 5,
      milestoneIndex: 3,
      amountCents: 25000, // $250
    });

    // Assert transfer created with correct amount and destination
    expect(stripe.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25000,
        currency: "usd",
        destination: "acct_test",
      })
    );

    // Assert releasedAmount updated correctly: 0 + 250 = 250.00
    expect(db.updateEscrowAccount).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        releasedAmount: "250.00",
        status: "partially_released", // 250 < 1000 funded
      })
    );

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("partially_released");
  });

  it("sets status=released when releasedAmount reaches fundedAmount", async () => {
    const { appRouter } = await import("./routers");
    const { stripe } = await import("./_core/stripe");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ id: 5 } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator" } as any,
    ]);
    vi.mocked(db.getEscrowAccount).mockResolvedValue({
      id: 10,
      dealId: 5,
      stripeAccountId: "acct_test",
      stripePaymentIntentId: "pi_test123",
      fundedAmount: "1000.00",
      releasedAmount: "750.00",
      status: "partially_released",
    } as any);
    vi.mocked(stripe.transfers.create).mockResolvedValue({ id: "tr_test" } as any);
    vi.mocked(db.updateEscrowAccount).mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.escrow.releaseToMilestone({
      dealId: 5,
      milestoneIndex: 5,
      amountCents: 25000, // $250 — brings total to $1000 = funded
    });

    expect(db.updateEscrowAccount).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        releasedAmount: "1000.00",
        status: "released",
      })
    );
    expect(result.newStatus).toBe("released");
  });
});

describe("escrow.refund procedure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels the uncaptured PaymentIntent and sets status=refunded", async () => {
    const { appRouter } = await import("./routers");
    const { stripe } = await import("./_core/stripe");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ id: 5 } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator" } as any,
    ]);
    vi.mocked(db.getEscrowAccount).mockResolvedValue({
      id: 10,
      dealId: 5,
      stripeAccountId: "acct_test",
      stripePaymentIntentId: "pi_test123",
      fundedAmount: "1000.00",
      releasedAmount: "0.00",
      status: "funded",
    } as any);
    vi.mocked(stripe.paymentIntents.cancel).mockResolvedValue({
      id: "pi_test123",
      status: "canceled",
    } as any);
    vi.mocked(db.updateEscrowAccount).mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.escrow.refund({ dealId: 5 });

    expect(stripe.paymentIntents.cancel).toHaveBeenCalledWith("pi_test123");
    expect(db.updateEscrowAccount).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ status: "refunded" })
    );
    expect(result.success).toBe(true);
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "escrow.releaseToMilestone"
```

Expected error (if `stripe.paymentIntents.capture` is not fully mocked):
```
TypeError: stripe.paymentIntents.capture is not a function
  — capture mock not properly configured
```

> Note: The `releaseToMilestone` and `refund` implementations exist from Task 4. If mock configuration issues arise, adjust the `vi.mock("./_core/stripe")` at the top of the test file to include:
> ```typescript
> paymentIntents: {
>   create: vi.fn(),
>   capture: vi.fn().mockResolvedValue({ id: "pi_test", status: "captured" }),
>   cancel: vi.fn(),
> },
> ```

### Step 3: Implementation note

The `releaseToMilestone` and `refund` procedures were already written in Task 4. The stripe mock at the top of the test file needs `paymentIntents.capture` added:

**Update the `vi.mock("./_core/stripe", ...)` block** (already placed in Task 4's test section) to include `capture`:

```typescript
vi.mock("./_core/stripe", () => ({
  stripe: {
    accounts: {
      create: vi.fn().mockResolvedValue({ id: "acct_test123" }),
    },
    accountLinks: {
      create: vi.fn().mockResolvedValue({
        url: "https://connect.stripe.com/setup/e/acct_test123/onboard",
      }),
    },
    paymentIntents: {
      create: vi.fn(),
      capture: vi.fn().mockResolvedValue({ id: "pi_test", status: "captured" }),
      cancel: vi.fn(),
    },
    transfers: {
      create: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -E "(releaseToMilestone|escrow.refund)"
```

Expected output:
```
 ✓ escrow.releaseToMilestone procedure > captures PaymentIntent and creates transfer for milestone amount
 ✓ escrow.releaseToMilestone procedure > sets status=released when releasedAmount reaches fundedAmount
 ✓ escrow.refund procedure > cancels the uncaptured PaymentIntent and sets status=refunded
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/escrow.test.ts && git commit -m "$(cat <<'EOF'
feat: escrow.releaseToMilestone and escrow.refund

Tests and verifies that releaseToMilestone captures PaymentIntent, creates
Stripe transfer, and increments releasedAmount. Verifies refund cancels the
PaymentIntent and marks escrowAccount as refunded.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: deal.completeMilestone Procedure

**Files:**
- Modify: `anavi/server/routers/deal.ts` — add `completeMilestone` procedure
- Test: `anavi/server/escrow.test.ts` (append new describe block)

### Step 1: Write the failing tests

Append to `anavi/server/escrow.test.ts`:

```typescript
describe("deal.completeMilestone procedure", () => {
  const baseDeal = {
    id: 5,
    title: "Test Deal",
    stage: "negotiation" as const,
    dealValue: "100000.00",
    currency: "USD",
    milestones: [
      { id: "1", name: "Initial Contact", status: "completed" as const, completedAt: "2024-01-01T00:00:00.000Z", payoutTrigger: false },
      { id: "2", name: "NDA Signed", status: "pending" as const, payoutTrigger: false },
      { id: "3", name: "Due Diligence", status: "pending" as const, payoutTrigger: false },
      { id: "4", name: "Term Sheet", status: "pending" as const, payoutTrigger: true },
      { id: "5", name: "Documentation", status: "pending" as const, payoutTrigger: false },
      { id: "6", name: "Closing", status: "pending" as const, payoutTrigger: true },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets completedAt on milestone without payoutTrigger; no payout created", async () => {
    const { appRouter } = await import("./routers");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ ...baseDeal } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator", attributionPercentage: "100.00" } as any,
    ]);
    vi.mocked(db.updateDeal).mockResolvedValue(undefined);
    vi.mocked(db.logAuditEvent).mockResolvedValue(undefined);
    vi.mocked(db.createPayout).mockResolvedValue(1);
    vi.mocked(db.getEscrowAccount).mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Complete milestone index 1 (NDA Signed — no payoutTrigger)
    const result = await caller.deal.completeMilestone({
      dealId: 5,
      milestoneIndex: 1,
    });

    // Assert updateDeal called with completedAt set on milestone[1]
    expect(db.updateDeal).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        milestones: expect.arrayContaining([
          expect.objectContaining({ id: "2", status: "completed", completedAt: expect.any(String) }),
        ]),
      })
    );

    // No payout created since payoutTrigger=false
    expect(db.createPayout).not.toHaveBeenCalled();

    expect(result.success).toBe(true);
  });

  it("creates payout rows for participants when payoutTrigger=true", async () => {
    const { appRouter } = await import("./routers");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ ...baseDeal } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator", attributionPercentage: "50.00" } as any,
      { userId: 2, dealId: 5, role: "introducer", attributionPercentage: "50.00" } as any,
    ]);
    vi.mocked(db.updateDeal).mockResolvedValue(undefined);
    vi.mocked(db.logAuditEvent).mockResolvedValue(undefined);
    vi.mocked(db.createPayout).mockResolvedValue(1);
    vi.mocked(db.getEscrowAccount).mockResolvedValue(undefined);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Complete milestone index 3 (Term Sheet — payoutTrigger=true)
    await caller.deal.completeMilestone({
      dealId: 5,
      milestoneIndex: 3,
    });

    // Payout rows created for both participants
    expect(db.createPayout).toHaveBeenCalledTimes(2);
    expect(db.createPayout).toHaveBeenCalledWith(
      expect.objectContaining({
        dealId: 5,
        userId: 1,
        payoutType: "milestone_bonus",
        milestoneId: "4",
        milestoneName: "Term Sheet",
        status: "pending",
      })
    );
  });

  it("auto-closes deal when all milestones completed", async () => {
    const { appRouter } = await import("./routers");
    const db = await import("./db");

    // All milestones completed except the last one (index 5)
    const almostDone = {
      ...baseDeal,
      milestones: [
        { id: "1", name: "Initial Contact", status: "completed" as const, completedAt: "2024-01-01T00:00:00.000Z", payoutTrigger: false },
        { id: "2", name: "NDA Signed", status: "completed" as const, completedAt: "2024-01-02T00:00:00.000Z", payoutTrigger: false },
        { id: "3", name: "Due Diligence", status: "completed" as const, completedAt: "2024-01-03T00:00:00.000Z", payoutTrigger: false },
        { id: "4", name: "Term Sheet", status: "completed" as const, completedAt: "2024-01-04T00:00:00.000Z", payoutTrigger: true },
        { id: "5", name: "Documentation", status: "completed" as const, completedAt: "2024-01-05T00:00:00.000Z", payoutTrigger: false },
        { id: "6", name: "Closing", status: "pending" as const, payoutTrigger: true },
      ],
    };

    vi.mocked(db.getDealById).mockResolvedValue({ ...almostDone } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator", attributionPercentage: "100.00" } as any,
    ]);
    vi.mocked(db.updateDeal).mockResolvedValue(undefined);
    vi.mocked(db.logAuditEvent).mockResolvedValue(undefined);
    vi.mocked(db.createPayout).mockResolvedValue(1);
    vi.mocked(db.getEscrowAccount).mockResolvedValue(undefined);
    vi.mocked(db.triggerPayoutsOnDealClose).mockResolvedValue(undefined);
    vi.mocked(db.recalculateTrustScore).mockResolvedValue(undefined);
    vi.mocked(db.createNotification).mockResolvedValue(1);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Complete the final milestone (index 5 — Closing)
    const result = await caller.deal.completeMilestone({
      dealId: 5,
      milestoneIndex: 5,
    });

    // Deal stage should auto-update to 'completed'
    expect(db.updateDeal).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ stage: "completed" })
    );

    expect(result.dealCompleted).toBe(true);
  });

  it("throws NOT_FOUND if milestone index does not exist", async () => {
    const { appRouter } = await import("./routers");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ ...baseDeal } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator" } as any,
    ]);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.deal.completeMilestone({ dealId: 5, milestoneIndex: 99 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws BAD_REQUEST if milestone already completed", async () => {
    const { appRouter } = await import("./routers");
    const db = await import("./db");

    vi.mocked(db.getDealById).mockResolvedValue({ ...baseDeal } as any);
    vi.mocked(db.getDealParticipants).mockResolvedValue([
      { userId: 1, dealId: 5, role: "originator" } as any,
    ]);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Milestone 0 is already completed in baseDeal
    await expect(
      caller.deal.completeMilestone({ dealId: 5, milestoneIndex: 0 })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
```

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "deal.completeMilestone"
```

Expected error:
```
TypeError: caller.deal.completeMilestone is not a function
  — procedure does not exist yet
```

### Step 3: Write minimal implementation

**Add `completeMilestone` to `anavi/server/routers/deal.ts`**, before the closing `});` of the `dealRouter`:

```typescript
completeMilestone: protectedProcedure
  .input(
    z.object({
      dealId: z.number(),
      milestoneIndex: z.number().int().min(0),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // 1. Fetch deal and verify participant access
    const deal = await db.getDealById(input.dealId);
    if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

    const participants = await db.getDealParticipants(input.dealId);
    const isParticipant = participants.some((p) => p.userId === ctx.user.id);
    if (!isParticipant) throw new TRPCError({ code: "FORBIDDEN" });

    // 2. Validate milestone exists and is not already completed
    const milestones = deal.milestones ?? [];
    const milestone = milestones[input.milestoneIndex];
    if (!milestone) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Milestone at index ${input.milestoneIndex} does not exist.`,
      });
    }
    if (milestone.status === "completed") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Milestone is already completed.",
      });
    }

    // 3. Mark milestone as completed
    const updatedMilestones = milestones.map((m, idx) =>
      idx === input.milestoneIndex
        ? { ...m, status: "completed" as const, completedAt: new Date().toISOString() }
        : m
    );

    // 4. Persist updated milestones
    await db.updateDeal(input.dealId, { milestones: updatedMilestones });

    // 5. Trigger payout if payoutTrigger=true
    if (milestone.payoutTrigger === true) {
      const dealValue = Number(deal.dealValue ?? 0);
      // Distribute proportionally across eligible participants
      const eligibleParticipants = participants.filter(
        (p) => p.role === "originator" || p.role === "introducer" || p.role === "advisor"
      );
      for (const p of eligibleParticipants) {
        const pct = Number(p.attributionPercentage ?? 0);
        if (pct <= 0) continue;
        const amount = (dealValue * pct) / 100;
        await db.createPayout({
          dealId: input.dealId,
          userId: p.userId,
          amount: String(amount),
          currency: deal.currency ?? "USD",
          payoutType: "milestone_bonus",
          attributionPercentage: String(pct),
          relationshipId: p.relationshipId,
          status: "pending",
          milestoneId: milestone.id,
          milestoneName: milestone.name,
        });
      }
    }

    // 6. Check if ALL milestones are now completed → auto-close deal
    const allCompleted = updatedMilestones.every((m) => m.status === "completed");
    let dealCompleted = false;
    if (allCompleted) {
      await db.updateDeal(input.dealId, { stage: "completed" });
      await db.triggerPayoutsOnDealClose(input.dealId);
      for (const p of participants) {
        if (p.role === "originator") {
          await db.recalculateTrustScore(p.userId, "deal_completion", input.dealId, "deal");
        }
      }
      for (const p of participants) {
        if (p.userId !== ctx.user.id) {
          await db.createNotification({
            userId: p.userId,
            type: "deal_update",
            title: "Deal Completed",
            message: `All milestones for deal "${deal.title}" have been completed.`,
            relatedEntityType: "deal",
            relatedEntityId: input.dealId,
          });
        }
      }
      dealCompleted = true;
    }

    // 7. Write audit log
    await db.logAuditEvent({
      userId: ctx.user.id,
      action: "milestone_completed",
      entityType: "deal",
      entityId: input.dealId,
      newState: {
        milestoneIndex: input.milestoneIndex,
        milestoneName: milestone.name,
        payoutTriggered: milestone.payoutTrigger,
        dealCompleted,
      },
    });

    return { success: true, dealCompleted, updatedMilestones };
  }),
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 15 "deal.completeMilestone"
```

Expected output:
```
 ✓ deal.completeMilestone procedure > sets completedAt on milestone without payoutTrigger; no payout created
 ✓ deal.completeMilestone procedure > creates payout rows for participants when payoutTrigger=true
 ✓ deal.completeMilestone procedure > auto-closes deal when all milestones completed
 ✓ deal.completeMilestone procedure > throws NOT_FOUND if milestone index does not exist
 ✓ deal.completeMilestone procedure > throws BAD_REQUEST if milestone already completed
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/routers/deal.ts anavi/server/escrow.test.ts && git commit -m "$(cat <<'EOF'
feat: deal.completeMilestone with payout triggering and auto-close

Adds completeMilestone procedure that marks milestone as completed,
evaluates payoutTrigger flag to create proportional payout rows,
and auto-transitions deal.stage to 'completed' when all milestones finish.
Writes audit log on every call.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Stripe Webhook Handler

**Files:**
- Modify: `anavi/server/_core/index.ts` — add webhook route before `express.json()`
- Test: `anavi/server/escrow.test.ts` (append new describe block)

### Step 1: Write the failing test

Append to `anavi/server/escrow.test.ts`:

```typescript
import request from "supertest"; // Add to devDependencies: pnpm add -D supertest @types/supertest

describe("Stripe webhook handler", () => {
  it("handles payment_intent.succeeded event and updates escrow status", async () => {
    // This test uses supertest to POST to the webhook endpoint.
    // We construct a mock Stripe webhook event and bypass signature verification.

    const { stripe } = await import("./_core/stripe");
    const db = await import("./db");

    const mockEvent = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test123",
          metadata: { dealId: "5" },
        },
      },
    };

    // Mock constructEvent to return our fake event
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);
    vi.mocked(db.getEscrowAccount).mockResolvedValue({
      id: 10,
      dealId: 5,
      stripeAccountId: "acct_test",
      stripePaymentIntentId: "pi_test123",
      status: "funded",
      fundedAmount: "1000.00",
      releasedAmount: "0.00",
    } as any);
    vi.mocked(db.updateEscrowAccount).mockResolvedValue(undefined);

    // Import the Express app factory (not the server start fn)
    // The webhook handler must be imported separately or via a testable app export.
    // See implementation note below.

    // For now, test that the webhook handler function logic works directly:
    const { handleStripeWebhook } = await import("./_core/stripeWebhook");

    const mockReq = {
      body: Buffer.from(JSON.stringify(mockEvent)),
      headers: { "stripe-signature": "test_sig" },
    } as any;
    const mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as any;

    await handleStripeWebhook(mockReq, mockRes);

    expect(stripe.webhooks.constructEvent).toHaveBeenCalled();
    // Status updated to confirmed funded
    expect(db.updateEscrowAccount).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ status: "funded" })
    );
    expect(mockRes.json).toHaveBeenCalledWith({ received: true });
  });

  it("handles transfer.paid event and marks payout as completed", async () => {
    const { stripe } = await import("./_core/stripe");
    const db = await import("./db");

    const mockTransferEvent = {
      type: "transfer.paid",
      data: {
        object: {
          id: "tr_test123",
          metadata: { dealId: "5", milestoneId: "4" },
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockTransferEvent as any);
    vi.mocked(db.getPayoutsByDeal).mockResolvedValue([
      {
        id: 1,
        dealId: 5,
        milestoneId: "4",
        status: "pending",
        paymentReference: null,
      } as any,
    ]);
    vi.mocked(db.updatePayout).mockResolvedValue(undefined);

    const { handleStripeWebhook } = await import("./_core/stripeWebhook");

    const mockReq = {
      body: Buffer.from(JSON.stringify(mockTransferEvent)),
      headers: { "stripe-signature": "test_sig" },
    } as any;
    const mockRes = { json: vi.fn(), status: vi.fn().mockReturnThis() } as any;

    await handleStripeWebhook(mockReq, mockRes);

    expect(db.updatePayout).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: "completed",
        paidAt: expect.any(Date),
        paymentReference: "tr_test123",
      })
    );
    expect(mockRes.json).toHaveBeenCalledWith({ received: true });
  });
});
```

> **Implementation Note:** To make the webhook handler unit-testable without spinning up the full Express server, extract the handler function into a separate module `anavi/server/_core/stripeWebhook.ts`. The webhook route in `index.ts` will import and call this function.

### Step 2: Run test to verify it fails

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 5 "Stripe webhook handler"
```

Expected error:
```
Error: Cannot find module './_core/stripeWebhook'
```

### Step 3: Write minimal implementation

**Create `anavi/server/_core/stripeWebhook.ts`:**

```typescript
import type { Request, Response } from "express";
import { stripe } from "./stripe";
import { ENV } from "./env";
import * as db from "../db";

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = ENV.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as any;
      const dealId = paymentIntent.metadata?.dealId
        ? Number(paymentIntent.metadata.dealId)
        : null;
      if (dealId) {
        await db.updateEscrowAccount(dealId, { status: "funded" });
      }
    }

    if (event.type === "transfer.paid") {
      const transfer = event.data.object as any;
      const dealId = transfer.metadata?.dealId
        ? Number(transfer.metadata.dealId)
        : null;
      const milestoneId = transfer.metadata?.milestoneId ?? null;

      if (dealId) {
        const payoutsList = await db.getPayoutsByDeal(dealId);
        const matchingPayout = milestoneId
          ? payoutsList.find((p) => p.milestoneId === milestoneId && p.status === "pending")
          : payoutsList.find((p) => p.status === "pending");

        if (matchingPayout) {
          await db.updatePayout(matchingPayout.id, {
            status: "completed",
            paidAt: new Date(),
            paymentReference: transfer.id,
          });
        }
      }
    }
  } catch (err) {
    console.error("[Stripe Webhook] Event handling error:", err);
    return res.status(500).json({ error: "Internal webhook processing error" });
  }

  return res.json({ received: true });
}
```

**Modify `anavi/server/_core/index.ts`** — add webhook route BEFORE `express.json()`:

```typescript
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { handleStripeWebhook } from "./stripeWebhook";

// ... (keep isPortAvailable and findAvailablePort helpers unchanged)

async function startServer() {
  const app = express();
  const server = createServer(app);

  // IMPORTANT: Stripe webhook route must be registered BEFORE express.json()
  // because Stripe signature verification requires the raw request body.
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // F21: Health check
  app.get("/health", async (_req, res) => {
    // ... (unchanged)
  });

  // ... (rest unchanged)
}
```

### Step 4: Run test to verify it passes

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test --reporter=verbose 2>&1 | grep -A 10 "Stripe webhook handler"
```

Expected output:
```
 ✓ Stripe webhook handler > handles payment_intent.succeeded event and updates escrow status
 ✓ Stripe webhook handler > handles transfer.paid event and marks payout as completed
```

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/server/_core/stripeWebhook.ts anavi/server/_core/index.ts anavi/server/escrow.test.ts && git commit -m "$(cat <<'EOF'
feat: Stripe webhook handler for payment and transfer events

Adds /api/webhooks/stripe Express route registered before express.json()
(required for raw body Stripe signature verification). Extracts handler
to stripeWebhook.ts for testability. Handles payment_intent.succeeded
(updates escrow status) and transfer.paid (marks payout as completed).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Escrow Tab UI in DealRoom.tsx

**Files:**
- Modify: `anavi/client/src/pages/DealRoom.tsx` (or equivalent DealRoom component path)
- Test: Visual/integration (no Vitest test for this task — it is a UI task)

### Step 1: Locate the DealRoom component

```bash
find /home/ariel/Documents/anavi-main/anavi -name "DealRoom.tsx" -o -name "DealRoom*" 2>/dev/null
```

Or use the glob pattern in your editor to find the relevant file.

### Step 2: Replace the escrow tab data

Find the existing Escrow tab section that calls `trpc.deal.getEscrowStatus` or renders hardcoded data.

Replace with real tRPC calls:

```typescript
// In the Escrow tab component section:

// Query real escrow status
const { data: escrowStatus, isLoading: escrowLoading } = trpc.escrow.getStatus.useQuery(
  { dealId: deal.id },
  { enabled: !!deal.id }
);

// Fund escrow mutation
const fundEscrowMutation = trpc.escrow.fundEscrow.useMutation({
  onSuccess: (data) => {
    if (data.clientSecret) {
      // Redirect to Stripe Elements or hosted checkout
      // Use @stripe/stripe-js to mount Payment Element with clientSecret
      window.location.href = `https://checkout.stripe.com/?client_secret=${data.clientSecret}`;
    }
  },
  onError: (err) => {
    toast.error(`Fund escrow failed: ${err.message}`);
  },
});

// Complete milestone mutation
const completeMilestoneMutation = trpc.deal.completeMilestone.useMutation({
  onSuccess: (data) => {
    if (data.dealCompleted) {
      toast.success("All milestones complete! Deal has been closed.");
    } else {
      toast.success("Milestone marked as complete.");
    }
    refetchDeal();
  },
  onError: (err) => {
    toast.error(`Could not complete milestone: ${err.message}`);
  },
});

// Create escrow account mutation (for initial setup)
const createAccountMutation = trpc.escrow.createAccount.useMutation({
  onSuccess: (data) => {
    window.open(data.onboardingUrl, "_blank");
  },
});
```

**UI rendering:**

```tsx
{/* Escrow Status Card */}
<div className="rounded-lg border p-4">
  <h3 className="font-semibold mb-2">Escrow Status</h3>
  {escrowLoading ? (
    <p className="text-muted-foreground text-sm">Loading...</p>
  ) : escrowStatus?.status === "not_configured" ? (
    <div>
      <p className="text-muted-foreground text-sm mb-3">
        No escrow account configured for this deal.
      </p>
      <Button
        size="sm"
        onClick={() => createAccountMutation.mutate({ dealId: deal.id })}
        disabled={createAccountMutation.isPending}
      >
        Set Up Stripe Escrow
      </Button>
    </div>
  ) : (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Status</span>
        <Badge variant={escrowStatus?.status === "funded" ? "default" : "secondary"}>
          {escrowStatus?.status}
        </Badge>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Funded Amount</span>
        <span className="text-sm font-medium">
          ${escrowStatus?.fundedAmount?.toLocaleString()}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">Released Amount</span>
        <span className="text-sm font-medium">
          ${escrowStatus?.releasedAmount?.toLocaleString()}
        </span>
      </div>
      {escrowStatus?.status === "unfunded" && (
        <Button
          size="sm"
          className="mt-2"
          onClick={() =>
            fundEscrowMutation.mutate({
              dealId: deal.id,
              amountCents: Math.round(Number(deal.dealValue ?? 0) * 100),
            })
          }
          disabled={fundEscrowMutation.isPending}
        >
          Fund Escrow
        </Button>
      )}
    </div>
  )}
</div>

{/* Milestone Checklist */}
<div className="rounded-lg border p-4 mt-4">
  <h3 className="font-semibold mb-3">Milestones</h3>
  <ul className="space-y-2">
    {(deal.milestones ?? []).map((milestone, idx) => (
      <li key={milestone.id} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              milestone.status === "completed" ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <span className={`text-sm ${milestone.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
            {milestone.name}
          </span>
          {milestone.payoutTrigger && (
            <Badge variant="outline" className="text-xs">Payout</Badge>
          )}
        </div>
        {milestone.status !== "completed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              completeMilestoneMutation.mutate({
                dealId: deal.id,
                milestoneIndex: idx,
              })
            }
            disabled={completeMilestoneMutation.isPending}
          >
            Complete
          </Button>
        )}
        {milestone.completedAt && (
          <span className="text-xs text-muted-foreground">
            {new Date(milestone.completedAt).toLocaleDateString()}
          </span>
        )}
      </li>
    ))}
  </ul>
</div>
```

### Step 3: Verify TypeScript compilation

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check 2>&1 | head -40
```

Fix any TypeScript errors (typically missing type imports or mismatched prop types).

### Step 4: Run full test suite

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | tail -20
```

All existing tests plus the new escrow tests should pass.

### Step 5: Commit

```bash
cd /home/ariel/Documents/anavi-main && git add anavi/client/src/pages/DealRoom.tsx && git commit -m "$(cat <<'EOF'
feat: real escrow data in DealRoom Escrow tab

Replaces hardcoded stub with trpc.escrow.getStatus live query.
Adds Fund Escrow button (calls fundEscrow, redirects to Stripe checkout),
Create Escrow Account button (opens Stripe Express onboarding), and
milestone checklist with Complete Milestone button (calls completeMilestone).
Shows releasedAmount and funded/status badge in real-time.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Implementation Notes

### Ordering constraints

1. **Task 1 before Tasks 3, 4, 5, 6:** The `escrowAccounts` schema must exist before the DB helpers reference it.
2. **Task 2 before Tasks 4, 5, 6, 8:** The `stripe.ts` module must exist before any router imports it.
3. **Task 3 before Tasks 4, 5, 6:** The DB helpers must exist before the router calls them.
4. **Task 4 before Task 5:** `getStatus` and `fundEscrow` tests verify that existing implementations match expected contract.
5. **Task 7 can run in parallel with Task 8** once Tasks 1–6 are complete.
6. **Task 9 is last** — UI depends on all backend procedures being registered.

### Running the full test suite

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm test
```

### Environment variables required for production

Add to `.env` (never commit this file):
```
STRIPE_SECRET_KEY=sk_live_...       # or sk_test_... for development
STRIPE_WEBHOOK_SECRET=whsec_...     # from Stripe Dashboard → Webhooks
```

### Stripe Connect flow (end-to-end)

1. Deal participants call `escrow.createAccount` → get `onboardingUrl`
2. User visits Stripe Express onboarding URL and completes KYB
3. Stripe sends `account.updated` webhook (optional: handle to mark account as ready)
4. Buyer calls `escrow.fundEscrow(amountCents)` → gets `clientSecret`
5. Frontend uses Stripe.js `confirmPayment(clientSecret)` — PaymentIntent created with `capture_method='manual'`
6. Funds held (not captured) until milestone release
7. Each `completeMilestone` with `payoutTrigger=true` → `escrow.releaseToMilestone` → Stripe capture + transfer
8. Stripe sends `transfer.paid` webhook → payout rows marked `completed`
9. All milestones complete → `deal.stage = 'completed'`

### Stripe webhook registration (one-time setup)

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `transfer.paid`

Or use Stripe CLI for local development:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Database migration

After modifying `schema.ts`, run:
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm db:push
```

This generates and applies the migration to create the `escrow_accounts` table.

### Test file structure summary

All escrow tests live in `anavi/server/escrow.test.ts`. The `vi.mock` calls at the top of the file must be hoisted before any `describe` blocks — Vitest handles this automatically when `vi.mock` appears at module scope. Import the mocked modules inside each test using dynamic `await import(...)` to get the mocked versions.

```
anavi/server/escrow.test.ts
├── describe: escrowAccounts schema          (Task 1)
├── describe: stripe helper                 (Task 2)
├── describe: escrow DB helpers             (Task 3)
├── describe: escrow.createAccount          (Task 4)
├── describe: escrow.fundEscrow             (Task 5)
├── describe: escrow.getStatus              (Task 5)
├── describe: deal.getEscrowStatus stub     (Task 5)
├── describe: escrow.releaseToMilestone     (Task 6)
├── describe: escrow.refund                 (Task 6)
├── describe: deal.completeMilestone        (Task 7)
└── describe: Stripe webhook handler        (Task 8)
```
