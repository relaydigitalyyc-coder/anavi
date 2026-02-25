# PRD-5: LP Portal & Fund Communications — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static LP Portal with a data-backed fund management system: fund setup, LP invites, capital calls, distributions, and LP-facing portal with capital account statements.

**Architecture:** New `fund` tRPC router; Drizzle tables (`funds`, `fund_lps`, `fund_communications`, `capital_calls`, `capital_call_lps`, `distributions`, `distribution_lps`); upgrade existing LPPortal page (currently mock data) to fetch from `fund.*` procedures; add `/fund-management` and `/lp-portal/:fundId` routes.

**Tech Stack:** Drizzle ORM + mysql2, tRPC v11, React 19, Resend or SendGrid for email, Vitest, financial.js (XIRR)

---

## Pre-flight: Understand the Existing Code

Before starting, note the following existing patterns:

- **DB schema:** `/home/ariel/Documents/anavi-main/anavi/drizzle/schema.ts` — uses `mysqlTable`, `int`, `varchar`, `text`, `timestamp`, `decimal`, `boolean`, `json`, `mysqlEnum` from `drizzle-orm/mysql-core`. Every table exports `typeof table.$inferSelect` as its type.
- **DB layer:** `/home/ariel/Documents/anavi-main/anavi/server/db.ts` — exports plain async functions (`getDb()` pattern, `insert().values()`, `update().set()`, etc.). Returns early with `[]` or `undefined` when db is not available (no-db fallback).
- **Router pattern:** `/home/ariel/Documents/anavi-main/anavi/server/routers.ts` — each domain gets a `const xxxRouter = router({ ... })` block using `protectedProcedure` with `.input(z.object({...})).query/mutation(async ({ ctx, input }) => { ... })`. Audit events use `db.logAuditEvent(...)`. The root `appRouter` adds each sub-router by name.
- **Existing LP Portal:** `/home/ariel/Documents/anavi-main/anavi/client/src/pages/LPPortal.tsx` — uses mock `portfolioSummary`, `investments`, `pendingActions`, `documents`. Must be refactored to fetch from `fund.getCapitalAccountStatement`, `fund.get`, etc.
- **Client routes:** `/home/ariel/Documents/anavi-main/anavi/client/src/App.tsx` — `ShellRoute` wraps components in `<DashboardLayout><PageTransition>`. Current route: `/lp-portal` (line 116). Add `/fund-management`, `/fund-management/:fundId`, change LP portal to `/lp-portal/:fundId`.
- **Tests:** `/home/ariel/Documents/anavi-main/anavi/server/anavi.test.ts` — Vitest, uses `vi.mock("./db", ...)` to mock db functions, creates caller via `appRouter.createCaller(ctx)`, asserts on results.
- **Test command:** `pnpm test` (runs `vitest run`).
- **DB push command:** `pnpm db:push`.

---

## Existing Code Landmarks

| File | Relevant Contents |
|------|-------------------|
| `anavi/drizzle/schema.ts` | Pattern: `mysqlTable`, `int`, `varchar`, `decimal`, `timestamp`, `mysqlEnum`, `json`; `$inferSelect` types |
| `anavi/server/db.ts` | Thin Drizzle wrappers; early return when db unavailable |
| `anavi/server/routers.ts` | `protectedProcedure`, `router({ ... })`, add sub-router to `appRouter` |
| `anavi/client/src/pages/LPPortal.tsx` | Current: mock `portfolioSummary`, `investments`, `pendingActions`, `documents`; needs refactor to `fund.getCapitalAccountStatement`, etc. |
| `anavi/client/src/App.tsx` | Route `/lp-portal` (line 116); add `/fund-management`, `/lp-portal/:fundId` |

---

## Dependency Map

```
Task 1 (schema) → Task 2 (DB helpers) → Task 3 (fund router)
Task 3 → Task 4 (Fund Mgmt UI)
Task 3 → Task 5 (LP invite)
Task 5 → Task 6 (Capital call UI)
Task 3 → Task 7 (LP Portal refactor)
Task 6 → Task 7
Task 7 → Task 8 (Distributions)
Task 8 → Task 9 (Letters + NAV)
Task 9 → Task 10 (Performance)
Task 10 → Task 11 (PDF export)
Task 11 → Task 12 (Integration tests)
```

---

## Phase 1: Schema + Fund CRUD + LP Invite + Capital Call Flow

### Task 1 — DB Schema: funds, fund_lps, fund_communications, capital_calls, capital_call_lps, distributions, distribution_lps

**What:** Add all fund-related tables to the schema per PRD-5 design doc.

**File:** `/home/ariel/Documents/anavi-main/anavi/drizzle/schema.ts`

**Steps:**

1. **Write the failing test first.**

   Create `/home/ariel/Documents/anavi-main/anavi/server/fund.test.ts`:

   ```typescript
   import { describe, it, expect } from "vitest";
   import {
     funds,
     fundLps,
     fundCommunications,
     capitalCalls,
     capitalCallLps,
     distributions,
     distributionLps,
   } from "../drizzle/schema";

   describe("schema: fund tables", () => {
     it("exports funds table with required columns", () => {
       const cols = Object.keys(funds);
       expect(cols).toContain("id");
       expect(cols).toContain("managerId");
       expect(cols).toContain("name");
       expect(cols).toContain("strategy");
       expect(cols).toContain("status");
     });

     it("exports fundLps table with required columns", () => {
       const cols = Object.keys(fundLps);
       expect(cols).toContain("fundId");
       expect(cols).toContain("userId");
       expect(cols).toContain("commitment");
       expect(cols).toContain("proRataPct");
     });

     it("exports capitalCalls table with required columns", () => {
       const cols = Object.keys(capitalCalls);
       expect(cols).toContain("communicationId");
       expect(cols).toContain("totalAmount");
       expect(cols).toContain("dueDate");
     });

     it("exports capitalCallLps table with required columns", () => {
       const cols = Object.keys(capitalCallLps);
       expect(cols).toContain("callId");
       expect(cols).toContain("lpId");
       expect(cols).toContain("amount");
       expect(cols).toContain("status");
     });
   });
   ```

2. **Verify it fails:**

   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test fund.test.ts 2>&1 | head -40
   ```

   Expected: TypeScript error or "Cannot find module" — tables don't exist yet.

3. **Implement:** In `schema.ts`, add before the TYPE EXPORTS section (or after the last table definition):

   ```typescript
   // ============================================================================
   // LP PORTAL & FUND MANAGEMENT (PRD-5)
   // ============================================================================

   export const funds = mysqlTable("funds", {
     id: int("id").autoincrement().primaryKey(),
     managerId: int("managerId").notNull(),
     name: varchar("name", { length: 200 }).notNull(),
     vintageYear: int("vintageYear"),
     strategy: mysqlEnum("strategy", [
       "venture",
       "private_equity",
       "real_estate",
       "credit",
       "hedge",
       "other",
     ]).default("other"),
     currency: varchar("currency", { length: 3 }).default("USD"),
     totalCommitment: decimal("totalCommitment", { precision: 20, scale: 2 }),
     currentNav: decimal("currentNav", { precision: 20, scale: 2 }),
     status: mysqlEnum("status", [
       "raising",
       "active",
       "harvesting",
       "closed",
     ]).default("active"),
     createdAt: timestamp("createdAt").defaultNow().notNull(),
     updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
   });

   export type Fund = typeof funds.$inferSelect;
   export type InsertFund = typeof funds.$inferInsert;

   export const fundLps = mysqlTable("fund_lps", {
     id: int("id").autoincrement().primaryKey(),
     fundId: int("fundId").notNull(),
     userId: int("userId").notNull(),
     commitment: decimal("commitment", { precision: 20, scale: 2 }).notNull(),
     proRataPct: decimal("proRataPct", { precision: 8, scale: 6 }).notNull(),
     invitedAt: timestamp("invitedAt").defaultNow().notNull(),
     joinedAt: timestamp("joinedAt"),
   });

   export type FundLp = typeof fundLps.$inferSelect;
   export type InsertFundLp = typeof fundLps.$inferInsert;

   export const fundCommunications = mysqlTable("fund_communications", {
     id: int("id").autoincrement().primaryKey(),
     fundId: int("fundId").notNull(),
     type: mysqlEnum("type", [
       "capital_call",
       "distribution",
       "quarterly_letter",
       "nav_statement",
       "portfolio_update",
     ]).notNull(),
     title: varchar("title", { length: 300 }),
     body: text("body"),
     attachmentKeys: json("attachmentKeys").$type<string[]>(),
     scheduledAt: timestamp("scheduledAt"),
     sentAt: timestamp("sentAt"),
     createdBy: int("createdBy").notNull(),
     createdAt: timestamp("createdAt").defaultNow().notNull(),
   });

   export type FundCommunication = typeof fundCommunications.$inferSelect;
   export type InsertFundCommunication = typeof fundCommunications.$inferInsert;

   export const capitalCalls = mysqlTable("capital_calls", {
     id: int("id").autoincrement().primaryKey(),
     communicationId: int("communicationId").notNull(),
     fundId: int("fundId").notNull(),
     totalAmount: decimal("totalAmount", { precision: 20, scale: 2 }).notNull(),
     callDate: timestamp("callDate").notNull(),
     dueDate: timestamp("dueDate").notNull(),
     purpose: text("purpose"),
     wireInstructions: json("wireInstructions").$type<Record<string, string>>(),
     createdAt: timestamp("createdAt").defaultNow().notNull(),
   });

   export type CapitalCall = typeof capitalCalls.$inferSelect;
   export type InsertCapitalCall = typeof capitalCalls.$inferInsert;

   export const capitalCallLps = mysqlTable("capital_call_lps", {
     id: int("id").autoincrement().primaryKey(),
     callId: int("callId").notNull(),
     lpId: int("lpId").notNull(),
     amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
     status: mysqlEnum("status", ["notified", "confirmed", "funded"])
       .default("notified")
       .notNull(),
     confirmedAt: timestamp("confirmedAt"),
     fundedAt: timestamp("fundedAt"),
     createdAt: timestamp("createdAt").defaultNow().notNull(),
   });

   export type CapitalCallLp = typeof capitalCallLps.$inferSelect;
   export type InsertCapitalCallLp = typeof capitalCallLps.$inferInsert;

   export const distributions = mysqlTable("distributions", {
     id: int("id").autoincrement().primaryKey(),
     communicationId: int("communicationId").notNull(),
     fundId: int("fundId").notNull(),
     totalAmount: decimal("totalAmount", { precision: 20, scale: 2 }).notNull(),
     distributionDate: timestamp("distributionDate").notNull(),
     type: mysqlEnum("type", [
       "return_of_capital",
       "realized_gain",
       "interest",
       "dividend",
     ]).notNull(),
     taxYear: int("taxYear"),
     createdAt: timestamp("createdAt").defaultNow().notNull(),
   });

   export type Distribution = typeof distributions.$inferSelect;
   export type InsertDistribution = typeof distributions.$inferInsert;

   export const distributionLps = mysqlTable("distribution_lps", {
     id: int("id").autoincrement().primaryKey(),
     distributionId: int("distributionId").notNull(),
     lpId: int("lpId").notNull(),
     amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
     createdAt: timestamp("createdAt").defaultNow().notNull(),
   });

   export type DistributionLp = typeof distributionLps.$inferSelect;
   export type InsertDistributionLp = typeof distributionLps.$inferInsert;
   ```

4. **Run the migration:**

   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm db:push
   ```

5. **Verify the test passes:**

   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test fund.test.ts
   ```

**Commit:** `feat(schema): add funds, fund_lps, fund_communications, capital_calls, capital_call_lps, distributions, distribution_lps tables`

---

### Task 2 — DB Helper Functions for Fund Operations

**What:** Add `createFund`, `getFund`, `listFundsByManager`, `inviteLp`, `getLpsByFund`, `createCapitalCall`, `createCapitalCallLps`, `getCapitalCallByLp`, `confirmCapitalCall`, `getCapitalAccountStatement` to `db.ts`.

**File:** `/home/ariel/Documents/anavi-main/anavi/server/db.ts`

**Steps:**

1. **Write the failing test first.** Add to `anavi/server/fund.test.ts`:

   ```typescript
   import * as db from "./db";

   describe("db: fund helpers exist", () => {
     it("createFund is a function", () => {
       expect(typeof db.createFund).toBe("function");
     });
     it("getFund is a function", () => {
       expect(typeof db.getFund).toBe("function");
     });
     it("listFundsByManager is a function", () => {
       expect(typeof db.listFundsByManager).toBe("function");
     });
     it("inviteLp is a function", () => {
       expect(typeof db.inviteLp).toBe("function");
     });
     it("getLpsByFund is a function", () => {
       expect(typeof db.getLpsByFund).toBe("function");
     });
     it("listFundsAsLp is a function", () => {
       expect(typeof db.listFundsAsLp).toBe("function");
     });
     it("createCapitalCall is a function", () => {
       expect(typeof db.createCapitalCall).toBe("function");
     });
     it("confirmCapitalCall is a function", () => {
       expect(typeof db.confirmCapitalCall).toBe("function");
     });
     it("getCapitalAccountStatement is a function", () => {
       expect(typeof db.getCapitalAccountStatement).toBe("function");
     });
   });
   ```

2. **Verify tests fail** (functions don't exist yet):

   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test fund.test.ts 2>&1 | head -30
   ```

3. **Implement** — in `db.ts`, add the fund-related imports and functions. Ensure `funds`, `fundLps`, `fundCommunications`, `capitalCalls`, `capitalCallLps`, `distributions`, `distributionLps` are imported from schema. Add `eq`, `and`, `desc`, `asc` from drizzle-orm as needed.

   Add the following block (abridged — key signatures):

   ```typescript
   // ============================================================================
   // FUND OPERATIONS (PRD-5)
   // ============================================================================

   export async function createFund(data: {
     managerId: number;
     name: string;
     vintageYear?: number;
     strategy?: string;
     currency?: string;
     totalCommitment?: string;
     status?: string;
   }): Promise<number> {
     const db = await getDb();
     if (!db) throw new Error("Database not available");
     const result = await db.insert(funds).values({
       managerId: data.managerId,
       name: data.name,
       vintageYear: data.vintageYear,
       strategy: data.strategy as any,
       currency: data.currency ?? "USD",
       totalCommitment: data.totalCommitment,
       status: (data.status as any) ?? "active",
     });
     return result[0].insertId;
   }

   export async function getFund(id: number) {
     const db = await getDb();
     if (!db) return undefined;
     const rows = await db.select().from(funds).where(eq(funds.id, id)).limit(1);
     return rows[0];
   }

   export async function listFundsByManager(managerId: number) {
     const db = await getDb();
     if (!db) return [];
     return db
       .select()
       .from(funds)
       .where(eq(funds.managerId, managerId))
       .orderBy(desc(funds.createdAt));
   }

   export async function createFundCommunication(data: {
     fundId: number;
     type: "capital_call" | "distribution" | "quarterly_letter" | "nav_statement" | "portfolio_update";
     title?: string;
     body?: string;
     createdBy: number;
   }): Promise<number> {
     const db = await getDb();
     if (!db) throw new Error("Database not available");
     const result = await db.insert(fundCommunications).values({
       fundId: data.fundId,
       type: data.type,
       title: data.title,
       body: data.body,
       createdBy: data.createdBy,
     });
     return result[0].insertId;
   }

   export async function inviteLp(data: {
     fundId: number;
     userId: number;
     commitment: string;
     proRataPct: string;
   }): Promise<number> {
     const db = await getDb();
     if (!db) throw new Error("Database not available");
     const result = await db.insert(fundLps).values(data);
     return result[0].insertId;
   }

   export async function getLpsByFund(fundId: number) {
     const db = await getDb();
     if (!db) return [];
     return db
       .select()
       .from(fundLps)
       .where(eq(fundLps.fundId, fundId))
       .orderBy(asc(fundLps.invitedAt));
   }

   export async function listFundsAsLp(userId: number) {
     const db = await getDb();
     if (!db) return [];
     return db
       .select({ fund: funds })
       .from(fundLps)
       .innerJoin(funds, eq(fundLps.fundId, funds.id))
       .where(eq(fundLps.userId, userId))
       .orderBy(desc(funds.createdAt))
       .then((rows) => rows.map((r) => r.fund));
   }

   export async function createCapitalCall(data: {
     communicationId: number;
     fundId: number;
     totalAmount: string;
     callDate: Date;
     dueDate: Date;
     purpose?: string;
     wireInstructions?: Record<string, string>;
   }): Promise<number> {
     const db = await getDb();
     if (!db) throw new Error("Database not available");
     const result = await db.insert(capitalCalls).values(data);
     return result[0].insertId;
   }

   export async function createCapitalCallLps(
     callId: number,
     lpAmounts: { lpId: number; amount: string }[]
   ): Promise<void> {
     const db = await getDb();
     if (!db) throw new Error("Database not available");
     for (const { lpId, amount } of lpAmounts) {
       await db.insert(capitalCallLps).values({ callId, lpId, amount });
     }
   }

   export async function getCapitalCallByLp(callId: number, lpId: number) {
     const db = await getDb();
     if (!db) return undefined;
     const rows = await db
       .select()
       .from(capitalCallLps)
       .where(and(eq(capitalCallLps.callId, callId), eq(capitalCallLps.lpId, lpId)))
       .limit(1);
     return rows[0];
   }

   export async function confirmCapitalCall(
     callLpId: number,
     lpId: number
   ): Promise<boolean> {
     const db = await getDb();
     if (!db) throw new Error("Database not available");
     const [result] = await db
       .update(capitalCallLps)
       .set({ status: "confirmed", confirmedAt: new Date() })
       .where(and(eq(capitalCallLps.id, callLpId), eq(capitalCallLps.lpId, lpId)));
     return ((result as { affectedRows?: number })?.affectedRows ?? 0) > 0;
   }

   export async function getCapitalAccountStatement(fundId: number, lpId: number) {
     const db = await getDb();
     if (!db) return { calls: [], distributions: [], fund: undefined };
     const fund = await getFund(fundId);
     if (!fund) return { calls: [], distributions: [], fund: undefined };
     // Join capital_call_lps with capital_calls for this LP
     const callRows = await db
       .select({
         id: capitalCallLps.id,
         callId: capitalCallLps.callId,
         amount: capitalCallLps.amount,
         status: capitalCallLps.status,
         confirmedAt: capitalCallLps.confirmedAt,
         callDate: capitalCalls.callDate,
         dueDate: capitalCalls.dueDate,
         purpose: capitalCalls.purpose,
       })
       .from(capitalCallLps)
       .innerJoin(capitalCalls, eq(capitalCallLps.callId, capitalCalls.id))
       .where(and(eq(capitalCallLps.lpId, lpId), eq(capitalCalls.fundId, fundId)))
       .orderBy(asc(capitalCalls.callDate));
     const distRows = await db
       .select({
         id: distributionLps.id,
         amount: distributionLps.amount,
         distributionDate: distributions.distributionDate,
         type: distributions.type,
       })
       .from(distributionLps)
       .innerJoin(distributions, eq(distributionLps.distributionId, distributions.id))
       .where(and(eq(distributionLps.lpId, lpId), eq(distributions.fundId, fundId)))
       .orderBy(asc(distributions.distributionDate));
     return {
       fund,
       calls: callRows,
       distributions: distRows,
     };
   }
   ```

4. **Verify tests pass:**

   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test fund.test.ts
   ```

**Commit:** `feat(db): add fund CRUD, LP invite, capital call, and capital account statement helpers`

---

### Task 3 — fund tRPC Router

**What:** Add `fund` router with `create`, `get`, `list`, `inviteLp`, `sendCapitalCall`, `confirmCapitalCall`, `getCapitalAccountStatement`.

**File:** `/home/ariel/Documents/anavi-main/anavi/server/routers.ts`

**Steps:**

1. **Write the failing test first.** Add to `fund.test.ts` (extend the mock for db):

   ```typescript
   vi.mock("./db", async (importOriginal) => {
     const actual = await importOriginal<typeof import("./db")>();
     return {
       ...actual,
       createFund: vi.fn(),
       getFund: vi.fn(),
       listFundsByManager: vi.fn(),
       inviteLp: vi.fn(),
       getLpsByFund: vi.fn(),
       createCapitalCall: vi.fn(),
       createCapitalCallLps: vi.fn(),
       createFundCommunication: vi.fn(),
       confirmCapitalCall: vi.fn(),
       getCapitalAccountStatement: vi.fn(),
     };
   });

   import { appRouter } from "./routers";
   import type { TrpcContext } from "./_core/context";

   function makeCtx(): TrpcContext {
     const user = {
       id: 1,
       openId: "test-fund-user",
       email: "fund@test.com",
       name: "Fund User",
       loginMethod: "manus",
       role: "user" as const,
       createdAt: new Date(),
       updatedAt: new Date(),
       lastSignedIn: new Date(),
     };
     return {
       user,
       req: { protocol: "https", headers: {} } as TrpcContext["req"],
       res: { clearCookie: () => {} } as TrpcContext["res"],
     };
   }

   describe("tRPC: fund.create", () => {
     beforeEach(() => vi.clearAllMocks());
     it("creates fund and returns id", async () => {
       vi.mocked(db.createFund).mockResolvedValue(42);
       const caller = appRouter.createCaller(makeCtx());
       const result = await caller.fund.create({
         name: "Test Fund",
         vintageYear: 2025,
         strategy: "venture",
       });
       expect(db.createFund).toHaveBeenCalledWith(
         expect.objectContaining({
           managerId: 1,
           name: "Test Fund",
           vintageYear: 2025,
           strategy: "venture",
         })
       );
       expect(result.id).toBe(42);
     });
   });

   describe("tRPC: fund.list", () => {
     it("returns funds for manager", async () => {
       const mockFunds = [{ id: 1, name: "Fund A" }];
       vi.mocked(db.listFundsByManager).mockResolvedValue(mockFunds as any);
       const caller = appRouter.createCaller(makeCtx());
       const result = await caller.fund.list();
       expect(db.listFundsByManager).toHaveBeenCalledWith(1);
       expect(result).toEqual(mockFunds);
     });
   });
   ```

2. **Verify tests fail** (fund router doesn't exist yet).

3. **Implement:** In `routers.ts`, add:

   ```typescript
   const fundRouter = router({
     create: protectedProcedure
       .input(z.object({
         name: z.string().min(1),
         vintageYear: z.number().optional(),
         strategy: z.enum(["venture","private_equity","real_estate","credit","hedge","other"]).optional(),
         currency: z.string().length(3).optional(),
         totalCommitment: z.string().optional(),
         status: z.enum(["raising","active","harvesting","closed"]).optional(),
       }))
       .mutation(async ({ ctx, input }) => {
         const id = await db.createFund({ managerId: ctx.user.id, ...input });
         return { id };
       }),

     get: protectedProcedure
       .input(z.object({ fundId: z.number() }))
       .query(async ({ ctx, input }) => {
         const fund = await db.getFund(input.fundId);
         if (!fund) throw new TRPCError({ code: "NOT_FOUND" });
         if (fund.managerId !== ctx.user.id) {
           const lps = await db.getLpsByFund(input.fundId);
           const isLp = lps.some((lp) => lp.userId === ctx.user.id);
           if (!isLp) throw new TRPCError({ code: "FORBIDDEN" });
         }
         return fund;
       }),

     list: protectedProcedure.query(async ({ ctx }) => {
       return db.listFundsByManager(ctx.user.id);
     }),

     listAsLp: protectedProcedure.query(async ({ ctx }) => {
       return db.listFundsAsLp(ctx.user.id);
     }),

     inviteLp: protectedProcedure
       .input(z.object({
         fundId: z.number(),
         userId: z.number(),
         commitment: z.string(),
         proRataPct: z.string(),
       }))
       .mutation(async ({ ctx, input }) => {
         const fund = await db.getFund(input.fundId);
         if (!fund || fund.managerId !== ctx.user.id)
           throw new TRPCError({ code: "FORBIDDEN" });
         const id = await db.inviteLp(input);
         return { id };
       }),

     getLps: protectedProcedure
       .input(z.object({ fundId: z.number() }))
       .query(async ({ ctx, input }) => {
         const fund = await db.getFund(input.fundId);
         if (!fund || fund.managerId !== ctx.user.id)
           throw new TRPCError({ code: "FORBIDDEN" });
         return db.getLpsByFund(input.fundId);
       }),

     sendCapitalCall: protectedProcedure
       .input(z.object({
         fundId: z.number(),
         totalAmount: z.string(),
         callDate: z.string(),
         dueDate: z.string(),
         purpose: z.string().optional(),
         wireInstructions: z.record(z.string()).optional(),
       }))
       .mutation(async ({ ctx, input }) => {
         const fund = await db.getFund(input.fundId);
         if (!fund || fund.managerId !== ctx.user.id)
           throw new TRPCError({ code: "FORBIDDEN" });
         const lps = await db.getLpsByFund(input.fundId);
         if (lps.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No LPs" });
         const totalProRata = lps.reduce((s, lp) => s + Number(lp.proRataPct), 0);
         const lpAmounts = lps.map((lp) => ({
           lpId: lp.userId,
           amount: (Number(input.totalAmount) * Number(lp.proRataPct) / totalProRata).toFixed(2),
         }));
         const commId = await db.createFundCommunication({
           fundId: input.fundId,
           type: "capital_call",
           createdBy: ctx.user.id,
         });
         const callId = await db.createCapitalCall({
           communicationId: commId,
           fundId: input.fundId,
           totalAmount: input.totalAmount,
           callDate: new Date(input.callDate),
           dueDate: new Date(input.dueDate),
           purpose: input.purpose,
           wireInstructions: input.wireInstructions,
         });
         await db.createCapitalCallLps(callId, lpAmounts);
         return { callId, lpAmounts };
       }),

     confirmCapitalCall: protectedProcedure
       .input(z.object({ callLpId: z.number() }))
       .mutation(async ({ ctx, input }) => {
         const ok = await db.confirmCapitalCall(input.callLpId, ctx.user.id);
         if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
         return { success: true };
       }),

     getCapitalAccountStatement: protectedProcedure
       .input(z.object({ fundId: z.number() }))
       .query(async ({ ctx, input }) => {
         return db.getCapitalAccountStatement(input.fundId, ctx.user.id);
       }),
   });
   ```

   Add `createFundCommunication` to `db.ts` if not yet implemented (insert into `fundCommunications`).

   Add `fund: fundRouter` to `appRouter`:

   ```typescript
   fund: fundRouter,
   ```

4. **Verify tests pass:**

   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test fund.test.ts
   ```

**Commit:** `feat(trpc): add fund router with create, get, list, inviteLp, sendCapitalCall, confirmCapitalCall, getCapitalAccountStatement`

---

### Task 4 — Fund Management UI

**What:** Create FundManagement and FundManagementDetail pages; wire to `fund.list`, `fund.create`, `fund.get`, `fund.getLps`.

**Files:** `anavi/client/src/pages/FundManagement.tsx`, `anavi/client/src/pages/FundManagementDetail.tsx`, `anavi/client/src/App.tsx`

**Steps:**

1. Create `FundManagement.tsx` — list of funds, "Create Fund" button, link to `/fund-management/:fundId` for each fund. Use `trpc.fund.list.useQuery()`.

2. Create fund form (modal or inline): name, vintage year, strategy, currency, total commitment. On submit, call `fund.create.useMutation()`, invalidate `fund.list`, navigate to detail.

3. Create `FundManagementDetail.tsx` — fetch `fund.get` by `fundId` from route. Display fund name, status, total commitment, current NAV. Tabs or sections: Overview, LPs, Capital Calls, Distributions (placeholder for Phase 2).

4. Add routes in `App.tsx`:
   ```tsx
   <Route path="/fund-management" component={FundManagement} />
   <Route path="/fund-management/:fundId" component={FundManagementDetail} />
   ```

5. Add nav link to "Fund Management" in sidebar (optional — check `DashboardLayout` or nav config).

**Commit:** `feat(ui): FundManagement and FundManagementDetail pages with fund list and create`

---

### Task 5 — LP Invite Flow

**What:** Add invite form in FundManagementDetail; send invitation email (Resend or SendGrid).

**File:** `anavi/client/src/pages/FundManagementDetail.tsx`, `anavi/server/` (email service)

**Steps:**

1. Add "Invite LP" form: email (create user or lookup by email), commitment amount, pro-rata %. Compute pro-rata from total commitment if needed.

2. Call `fund.inviteLp` mutation. Backend: lookup or create user by email, call `db.inviteLp`, send email with invite link to `/lp-portal/:fundId`.

3. Email: Use Resend (`resend` package) or existing SendGrid. Template: "You've been invited to [Fund Name]. View your LP portal: [link]."

4. Add env var `RESEND_API_KEY` or `SENDGRID_API_KEY` if not present.

**Commit:** `feat(fund): LP invite flow with email notification`

---

### Task 6 — Capital Call Creation UI

**What:** Form in FundManagementDetail to create and send capital call. Preview per-LP amounts before send.

**File:** `anavi/client/src/pages/FundManagementDetail.tsx`

**Steps:**

1. Add "Send Capital Call" button and modal/drawer.

2. Form fields: total amount, call date, due date, purpose (textarea), wire instructions (bank name, routing, account, reference).

3. Preview: fetch `fund.getLps` and compute per-LP amount (totalAmount * proRataPct / sum(proRataPct)). Display table: LP name, amount, pro-rata %.

4. On "Send", call `fund.sendCapitalCall`. Backend creates `fund_communications`, `capital_calls`, `capital_call_lps`. Send email to each LP with their amount, due date, wire instructions, link to `/lp-portal/:fundId`.

**Commit:** `feat(fund): capital call creation UI with per-LP preview and email send`

---

### Task 7 — LP Portal Data-Backed

**What:** Refactor LPPortal to use `fundId` from route; fetch from `fund.getCapitalAccountStatement`, `fund.get`. Add "Confirm Receipt" for capital calls.

**File:** `anavi/client/src/pages/LPPortal.tsx`, `anavi/client/src/App.tsx`

**Steps:**

1. Change route from `/lp-portal` to `/lp-portal/:fundId`. Update `App.tsx`.

2. In LPPortal, read `fundId` from route params (e.g. `useParams()`). If no fundId, show "Select a fund" or redirect to list of funds for this LP (new query `fund.listAsLp` or reuse `fund.list` filtered by LP membership).

3. Replace mock data with:
   - `trpc.fund.get.useQuery({ fundId })`
   - `trpc.fund.getCapitalAccountStatement.useQuery({ fundId })`

4. Render: summary header (committed, called, distributed, NAV from statement), capital account table (calls + distributions in date order), documents (from `fund_communications` — Phase 2).

5. Each capital call row: "Confirm Receipt" button. On click, `fund.confirmCapitalCall.useMutation({ callLpId })`. Disable after confirm.

**Commit:** `feat(lp-portal): data-backed LP portal with capital account statement and confirm receipt`

---

## Phase 2: Distributions, Letters, NAV

### Task 8 — Distribution Notices

**What:** Add `fund.sendDistribution`, create `distributions` and `distribution_lps` records, email LPs.

**Files:** `anavi/server/db.ts`, `anavi/server/routers.ts`, `anavi/client/src/pages/FundManagementDetail.tsx`

**Steps:**

1. Add db helpers: `createDistribution`, `createDistributionLps`, `getDistributionsByFund`, `getDistributionLpsByDistribution`.

2. Add `fund.sendDistribution` procedure: input totalAmount, distributionDate, type, taxYear. Create `fund_communications`, `distributions`, `distribution_lps` (per-LP amounts from pro-rata). Send email to each LP.

3. Add "Send Distribution" form and button in FundManagementDetail. Form: amount, date, type dropdown, tax year.

4. Update `getCapitalAccountStatement` to include distributions from `distributionLps` join (if not already).

**Commit:** `feat(fund): distribution notices with per-LP amounts and email send`

---

### Task 9 — Quarterly Letters & NAV Updates

**What:** Add `fund.sendLetter`, `fund.updateNav`. Rich text editor for letter body; PDF attachment; scheduled send.

**Files:** `anavi/server/db.ts`, `anavi/server/routers.ts`, `anavi/client/src/pages/FundManagementDetail.tsx`

**Steps:**

1. Add `fund.sendLetter`: input title, body (markdown/HTML), attachmentKeys (S3 keys), scheduledAt. Create `fund_communications` (type=quarterly_letter or nav_statement). Send email when scheduled or immediately.

2. Add `fund.updateNav`: input quarter, year, nav. Update `funds.currentNav`. Optionally create nav_statement communication.

3. UI: "Send Quarterly Letter" form with rich text (e.g. TipTap or simple textarea), file upload for PDF. "Update NAV" form with nav value.

**Commit:** `feat(fund): quarterly letters, NAV updates, and nav statement communications`

---

## Phase 3: Performance & Export

### Task 10 — IRR/DPI/TVPI/RVPI Calculation

**What:** Implement XIRR; add `fund.getPerformanceMetrics` returning IRR, DPI, RVPI, TVPI. Charts for capital deployment, distribution timeline, NAV over time.

**Files:** `anavi/server/db.ts`, `anavi/server/routers.ts`, `anavi/package.json` (add `financial` or implement XIRR)

**Steps:**

1. Add `financial` package: `pnpm add financial` (or use `xirr` package). Implement `computeXIRR(cashflows: { date: Date; amount: number }[]): number`.

2. Add `getPerformanceMetrics(fundId)`: aggregate capital calls, distributions, current NAV per LP. Compute DPI = totalDistributions / totalCalled, RVPI = currentNav / totalCalled, TVPI = DPI + RVPI. Compute IRR via XIRR from cashflows (negative for calls, positive for distributions + terminal NAV).

3. Add `fund.getPerformanceMetrics` tRPC procedure.

4. UI: display metrics in FundManagementDetail and LPPortal. Add charts (e.g. Recharts): capital deployment by quarter, distribution timeline, NAV over time.

**Commit:** `feat(fund): IRR/DPI/TVPI/RVPI calculation and performance charts`

---

### Task 11 — PDF Report Export

**What:** Add `fund.exportReport(fundId, quarter, year)` — generate PDF with fund metrics, LP table, performance chart.

**Files:** `anavi/server/` (PDF generation), `anavi/server/routers.ts`

**Steps:**

1. Add PDF library: `pnpm add @react-pdf/renderer` or `jspdf` or `puppeteer`. Choose based on need for charts (puppeteer can render React to PDF).

2. Build report template: fund name, vintage, strategy; LP table (name, commitment, called, distributed, nav); performance metrics; chart image (render with Recharts, capture as PNG, embed in PDF).

3. `fund.exportReport` procedure: fetch data, render PDF, return as Buffer or presigned S3 URL. Client downloads via blob URL or redirect.

**Commit:** `feat(fund): PDF report export with metrics and charts`

---

### Task 12 — Integration Tests

**What:** End-to-end test: create fund, invite LP, send capital call, LP confirms, fetch statement. Mock email.

**File:** `anavi/server/fund.test.ts`

**Steps:**

1. Add integration describe block. Mock `db` with actual implementations for a subset, or use in-memory SQLite for isolated tests (if supported).

2. Alternatively, use `vi.mocked(db.createFund).mockResolvedValue(1)` and chain mocks so that `fund.create` → `fund.inviteLp` → `fund.sendCapitalCall` → `fund.confirmCapitalCall` → `fund.getCapitalAccountStatement` returns expected shape.

3. Assert: capital account statement contains the call with status "confirmed"; amounts match pro-rata.

**Commit:** `test(fund): integration tests for fund creation, LP invite, capital call, confirm, statement`

---

## Final Checklist

After all 12 tasks are done, verify the following:

```
[ ] pnpm test                         — all tests green
[ ] pnpm check                        — zero TypeScript errors
[ ] pnpm db:push                      — migration applied cleanly
[ ] /fund-management route loads      — fund list visible
[ ] Create fund, invite LP, send capital call in < 10 min
[ ] LP receives email within 60s of capital call send
[ ] Per-LP call amount correct from pro-rata percentage
[ ] LP capital account statement reflects all calls and distributions in order
[ ] LP confirming receipt creates audit log entry (if audit added)
[ ] /lp-portal/:fundId loads for LP user
[ ] IRR matches Excel XIRR for same inputs (within 0.01%) — Phase 3
[ ] PDF report export contains fund metrics, LP table, performance chart — Phase 3
```

## File Index

| File | Purpose |
|------|---------|
| `anavi/drizzle/schema.ts` | Add funds, fund_lps, fund_communications, capital_calls, capital_call_lps, distributions, distribution_lps |
| `anavi/server/db.ts` | createFund, getFund, listFundsByManager, listFundsAsLp, inviteLp, getLpsByFund, createFundCommunication, createCapitalCall, createCapitalCallLps, confirmCapitalCall, getCapitalAccountStatement, createDistribution, createDistributionLps, getPerformanceMetrics |
| `anavi/server/routers.ts` | fund router with create, get, list, listAsLp, inviteLp, getLps, sendCapitalCall, confirmCapitalCall, getCapitalAccountStatement, sendDistribution, sendLetter, updateNav, getPerformanceMetrics, exportReport |
| `anavi/server/fund.test.ts` | Unit and integration tests for fund schema, db helpers, tRPC procedures |
| `anavi/client/src/App.tsx` | Routes `/fund-management`, `/fund-management/:fundId`, `/lp-portal/:fundId` |
| `anavi/client/src/pages/FundManagement.tsx` | Fund manager list + create fund form |
| `anavi/client/src/pages/FundManagementDetail.tsx` | Fund detail, LP invite, capital call form, distribution form, quarterly letter, NAV update |
| `anavi/client/src/pages/LPPortal.tsx` | Refactor to data-backed; fundId from route; capital account statement; confirm receipt |
| `anavi/package.json` | Add `financial` (or `xirr`), `resend` or `@sendgrid/mail`, PDF library |
