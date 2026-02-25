# PRD-1: Deal Pipeline & Stage Management — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a kanban pipeline view to ANAVI so deal professionals can see and manage their deal flow by stage.

**Architecture:** Extend the existing deals table with stage tracking fields. New tRPC procedures for pipeline queries and stage movement. Kanban UI using @dnd-kit/core for drag-and-drop.

**Tech Stack:** @dnd-kit/core (drag-and-drop), Drizzle ORM + mysql2, tRPC v11, React 19, Framer Motion, Vitest

---

## Pre-flight: Understand the Existing Code

Before starting, note the following existing patterns:

- **DB schema:** `/home/ariel/Documents/anavi-main/anavi/drizzle/schema.ts` — uses `mysqlTable`, `int`, `varchar`, `text`, `timestamp`, `decimal`, `boolean`, `json`, `mysqlEnum` from `drizzle-orm/mysql-core`. Every table exports `typeof table.$inferSelect` as its type.
- **DB layer:** `/home/ariel/Documents/anavi-main/anavi/server/db.ts` — exports plain async functions (`getDb()` pattern, `insert().values()`, `update().set()`, etc.). Returns early with `[]` or `undefined` when db is not available (no-db fallback).
- **Router pattern:** `/home/ariel/Documents/anavi-main/anavi/server/routers.ts` — each domain gets a `const xxxRouter = router({ ... })` block using `protectedProcedure` with `.input(z.object({...})).query/mutation(async ({ ctx, input }) => { ... })`. Audit events use `db.logAuditEvent(...)`. The root `appRouter` at the bottom of the file adds each sub-router by name.
- **Existing deal stage enum in DB:** `"lead" | "qualification" | "due_diligence" | "negotiation" | "documentation" | "closing" | "completed" | "cancelled"` — the new pipeline stages (`Sourced | Intro Made | NDA Signed | Diligence | Term Sheet | Closed | Passed`) are a **separate pipeline concept** stored in the new `pipelineStage` field, not replacing the existing `stage` field.
- **Tests:** `/home/ariel/Documents/anavi-main/anavi/server/anavi.test.ts` — Vitest, uses `vi.mock("./db", () => ({ ... }))` to mock all db functions, creates a caller via `appRouter.createCaller(ctx)`, asserts on results.
- **Client routes:** `/home/ariel/Documents/anavi-main/anavi/client/src/App.tsx` — `ShellRoute` wraps a component in `<DashboardLayout><PageTransition>`. New pages live in `/home/ariel/Documents/anavi-main/anavi/client/src/pages/`.
- **Existing Deals page:** `/home/ariel/Documents/anavi-main/anavi/client/src/pages/Deals.tsx` — uses `trpc.deal.list.useQuery()`, `trpc.deal.updateStage.useMutation()`. Deal shape from `db.getDealsByUser()` returns `typeof deals.$inferSelect`.
- **Test command:** `pnpm test` (runs `vitest run`).
- **DB push command:** `pnpm db:push` (runs `drizzle-kit generate && drizzle-kit migrate`).

---

## Phase 1: Kanban Board with Default Stages

### Task 1 — Add `@dnd-kit/core` to package.json

**What:** Add the drag-and-drop library and its sortable extension.

**File:** `/home/ariel/Documents/anavi-main/anavi/package.json`

**Steps:**

1. Open `package.json`. In the `"dependencies"` object, add after the `"axios"` entry:
   ```json
   "@dnd-kit/core": "^6.3.1",
   "@dnd-kit/sortable": "^8.0.0",
   "@dnd-kit/utilities": "^3.2.2",
   ```

2. Run:
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm install
   ```

3. Verify TypeScript can find the types:
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm check
   ```

**Commit:** `feat(deps): add @dnd-kit/core, sortable, utilities for pipeline drag-and-drop`

---

### Task 2 — Extend the DB schema: deals table + pipeline_templates table

**What:** Add pipeline tracking columns to `deals` and create a new `pipeline_templates` table.

**File:** `/home/ariel/Documents/anavi-main/anavi/drizzle/schema.ts`

**Steps:**

1. **Write the failing test first.**

   Open `/home/ariel/Documents/anavi-main/anavi/server/pipeline.test.ts` (new file) and add a placeholder test that imports the new schema types. This will fail because the types don't exist yet:
   ```typescript
   import { describe, it, expect } from "vitest";
   import type { PipelineTemplate } from "../drizzle/schema";

   describe("schema: pipeline_templates", () => {
     it("PipelineTemplate type is exported from schema", () => {
       const t: PipelineTemplate = {
         id: 1,
         userId: 1,
         name: "Default",
         dealType: "any",
         stages: ["Sourced"],
         isDefault: true,
         createdAt: new Date(),
       };
       expect(t.id).toBe(1);
     });
   });
   ```

2. **Verify it fails:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test 2>&1 | grep "PipelineTemplate"
   ```
   Expected: TypeScript compile error or test failure because `PipelineTemplate` is not yet exported.

3. **Implement:** In `schema.ts`, after the `deals` table definition (around line 334) and before `dealParticipants`, add:

   ```typescript
   // ============================================================================
   // PIPELINE TEMPLATES
   // ============================================================================

   export const pipelineTemplates = mysqlTable("pipeline_templates", {
     id: int("id").autoincrement().primaryKey(),
     userId: int("userId").notNull(),
     name: varchar("name", { length: 128 }).notNull(),
     dealType: varchar("dealType", { length: 64 }).notNull().default("any"),
     stages: json("stages").$type<string[]>().notNull(),
     isDefault: boolean("isDefault").default(false).notNull(),
     createdAt: timestamp("createdAt").defaultNow().notNull(),
     updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
   });

   export type PipelineTemplate = typeof pipelineTemplates.$inferSelect;
   export type InsertPipelineTemplate = typeof pipelineTemplates.$inferInsert;
   ```

4. **Extend the `deals` table** — inside the `mysqlTable("deals", { ... })` definition, after `updatedAt` and before the closing `})`, add:

   ```typescript
   // Pipeline Fields
   pipelineTemplateId: int("pipelineTemplateId"),
   pipelineStage: varchar("pipelineStage", { length: 64 }),
   assignedToUserId: int("assignedToUserId"),
   lastTouchedAt: timestamp("lastTouchedAt"),
   stageEnteredAt: timestamp("stageEnteredAt"),
   priority: mysqlEnum("priority", ["low", "normal", "high", "critical"]).default("normal"),
   counterparty: varchar("counterparty", { length: 255 }),
   sector: varchar("sector", { length: 128 }),
   ```

5. **Add the `Deal` type export** — the existing `export type Deal = typeof deals.$inferSelect;` around line 616 already exists. It will automatically include the new columns.

6. **Run the migration:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm db:push
   ```

7. **Verify the test now passes:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test pipeline.test.ts
   ```

**Commit:** `feat(schema): add pipelineTemplates table + pipeline fields to deals`

---

### Task 3 — Add DB helper functions for pipeline operations

**What:** Add `getPipelineByUser`, `moveDealStage`, `getPipelineTemplates`, `createPipelineTemplate`, `updatePipelineTemplate`, `getStaleDeals`, `bulkUpdateDeals` to `db.ts`.

**File:** `/home/ariel/Documents/anavi-main/anavi/server/db.ts`

**Steps:**

1. **Write the failing test first.** In `/home/ariel/Documents/anavi-main/anavi/server/pipeline.test.ts`, add (inside the existing `describe` block or as a new describe block):

   ```typescript
   import { describe, it, expect, vi, beforeEach } from "vitest";

   vi.mock("../server/db", async () => {
     const actual = await vi.importActual("../server/db");
     return {
       ...actual,
       getPipelineByUser: vi.fn(),
       moveDealStage: vi.fn(),
       getPipelineTemplates: vi.fn(),
       createPipelineTemplate: vi.fn(),
       updatePipelineTemplate: vi.fn(),
       getStaleDeals: vi.fn(),
       bulkUpdateDeals: vi.fn(),
     };
   });

   describe("db: pipeline helpers exist", () => {
     it("getPipelineByUser is a function", async () => {
       const db = await import("../server/db");
       expect(typeof db.getPipelineByUser).toBe("function");
     });

     it("moveDealStage is a function", async () => {
       const db = await import("../server/db");
       expect(typeof db.moveDealStage).toBe("function");
     });

     it("getStaleDeals is a function", async () => {
       const db = await import("../server/db");
       expect(typeof db.getStaleDeals).toBe("function");
     });

     it("bulkUpdateDeals is a function", async () => {
       const db = await import("../server/db");
       expect(typeof db.bulkUpdateDeals).toBe("function");
     });
   });
   ```

2. **Verify tests fail** (functions don't exist yet):
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test pipeline.test.ts 2>&1 | head -30
   ```

3. **Implement** — in `db.ts`, add after the last deal-related function (`getDealParticipants` / `addDealParticipant` block). First, ensure the necessary imports are at the top of `db.ts` — check that `pipelineTemplates` and `inArray`, `and`, `lt`, `isNotNull`, `sql` are imported. Add at the top of the import from `drizzle/schema.ts`:

   ```typescript
   import {
     // ... existing imports ...
     pipelineTemplates,
   } from "../drizzle/schema";
   ```

   Then add the functions:

   ```typescript
   // ============================================================================
   // PIPELINE OPERATIONS
   // ============================================================================

   export const DEFAULT_PIPELINE_STAGES = [
     "Sourced",
     "Intro Made",
     "NDA Signed",
     "Diligence",
     "Term Sheet",
     "Closed",
     "Passed",
   ] as const;

   export type PipelineStage = (typeof DEFAULT_PIPELINE_STAGES)[number];

   /**
    * Returns all deals for a user, grouped by pipelineStage.
    * Deals without a pipelineStage are placed in "Sourced".
    */
   export async function getPipelineByUser(
     userId: number,
     templateId?: number
   ): Promise<Record<string, typeof deals.$inferSelect[]>> {
     const db = await getDb();
     if (!db) return {};

     const participantRows = await db
       .select({ dealId: dealParticipants.dealId })
       .from(dealParticipants)
       .where(eq(dealParticipants.userId, userId));

     const dealIds = participantRows.map((p) => p.dealId);
     if (dealIds.length === 0) return {};

     const rows = await db
       .select()
       .from(deals)
       .where(inArray(deals.id, dealIds))
       .orderBy(desc(deals.createdAt));

     // Group by pipelineStage; default to "Sourced"
     const grouped: Record<string, typeof deals.$inferSelect[]> = {};
     for (const stage of DEFAULT_PIPELINE_STAGES) {
       grouped[stage] = [];
     }
     for (const deal of rows) {
       const stage = deal.pipelineStage ?? "Sourced";
       if (!grouped[stage]) grouped[stage] = [];
       grouped[stage].push(deal);
     }
     return grouped;
   }

   /**
    * Moves a deal to a new pipeline stage and stamps stageEnteredAt + lastTouchedAt.
    * Returns the previous stage for audit purposes.
    */
   export async function moveDealStage(
     dealId: number,
     newStage: string
   ): Promise<{ previousStage: string | null }> {
     const db = await getDb();
     if (!db) throw new Error("Database not available");

     const [existing] = await db
       .select({ pipelineStage: deals.pipelineStage })
       .from(deals)
       .where(eq(deals.id, dealId))
       .limit(1);

     const previousStage = existing?.pipelineStage ?? null;

     await db
       .update(deals)
       .set({
         pipelineStage: newStage,
         stageEnteredAt: new Date(),
         lastTouchedAt: new Date(),
         updatedAt: new Date(),
       })
       .where(eq(deals.id, dealId));

     return { previousStage };
   }

   /**
    * Returns deals that have been in their current pipeline stage for more
    * than `thresholdDays` days without a stage change.
    */
   export async function getStaleDeals(
     userId: number,
     thresholdDays: number
   ): Promise<typeof deals.$inferSelect[]> {
     const db = await getDb();
     if (!db) return [];

     const participantRows = await db
       .select({ dealId: dealParticipants.dealId })
       .from(dealParticipants)
       .where(eq(dealParticipants.userId, userId));

     const dealIds = participantRows.map((p) => p.dealId);
     if (dealIds.length === 0) return [];

     const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

     return db
       .select()
       .from(deals)
       .where(
         and(
           inArray(deals.id, dealIds),
           isNotNull(deals.stageEnteredAt),
           lt(deals.stageEnteredAt, cutoff)
         )
       )
       .orderBy(deals.stageEnteredAt);
   }

   /**
    * Bulk-updates a set of deals with the given partial data.
    */
   export async function bulkUpdateDeals(
     dealIds: number[],
     data: Partial<typeof deals.$inferInsert>
   ): Promise<void> {
     const db = await getDb();
     if (!db) throw new Error("Database not available");
     if (dealIds.length === 0) return;

     await db
       .update(deals)
       .set({ ...data, updatedAt: new Date() })
       .where(inArray(deals.id, dealIds));
   }

   // ============================================================================
   // PIPELINE TEMPLATE OPERATIONS
   // ============================================================================

   export async function getPipelineTemplates(
     userId: number
   ): Promise<typeof pipelineTemplates.$inferSelect[]> {
     const db = await getDb();
     if (!db) return [];
     return db
       .select()
       .from(pipelineTemplates)
       .where(eq(pipelineTemplates.userId, userId))
       .orderBy(desc(pipelineTemplates.createdAt));
   }

   export async function createPipelineTemplate(
     data: typeof pipelineTemplates.$inferInsert
   ): Promise<number> {
     const db = await getDb();
     if (!db) throw new Error("Database not available");
     const result = await db.insert(pipelineTemplates).values(data);
     return result[0].insertId;
   }

   export async function updatePipelineTemplate(
     id: number,
     data: Partial<typeof pipelineTemplates.$inferInsert>
   ): Promise<void> {
     const db = await getDb();
     if (!db) throw new Error("Database not available");
     await db
       .update(pipelineTemplates)
       .set({ ...data, updatedAt: new Date() })
       .where(eq(pipelineTemplates.id, id));
   }
   ```

4. **Verify tests pass:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test pipeline.test.ts
   ```

**Commit:** `feat(db): add pipeline helper functions — getPipelineByUser, moveDealStage, getStaleDeals, bulkUpdateDeals, template CRUD`

---

### Task 4 — Add tRPC routers: `deal.getPipeline`, `deal.moveStage`, and `pipelineTemplate.*`

**What:** Wire the new DB functions into tRPC procedures following the existing router pattern.

**File:** `/home/ariel/Documents/anavi-main/anavi/server/routers.ts`

**Steps:**

1. **Write the failing tests first.** Add to `/home/ariel/Documents/anavi-main/anavi/server/pipeline.test.ts`:

   ```typescript
   import { appRouter } from "./routers";
   import type { TrpcContext } from "./_core/context";

   // Extend the existing vi.mock("./db", ...) at the top of the file to include
   // the new pipeline db functions:
   //   getPipelineByUser, moveDealStage, getPipelineTemplates,
   //   createPipelineTemplate, updatePipelineTemplate,
   //   getStaleDeals, bulkUpdateDeals, getDealById, logAuditEvent

   type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

   function makeCtx(): TrpcContext {
     const user: AuthenticatedUser = {
       id: 1,
       openId: "test-pipeline-user",
       email: "pipeline@test.com",
       name: "Pipeline User",
       loginMethod: "manus",
       role: "user",
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

   describe("tRPC: deal.getPipeline", () => {
     beforeEach(() => vi.clearAllMocks());

     it("returns grouped deals when getPipelineByUser resolves", async () => {
       const mockPipeline = { Sourced: [], "Intro Made": [] };
       vi.mocked(db.getPipelineByUser).mockResolvedValue(mockPipeline);

       const caller = appRouter.createCaller(makeCtx());
       const result = await caller.deal.getPipeline({});

       expect(db.getPipelineByUser).toHaveBeenCalledWith(1, undefined);
       expect(result).toEqual(mockPipeline);
     });

     it("requires authentication", async () => {
       const unauthCtx: TrpcContext = {
         user: null,
         req: { protocol: "https", headers: {} } as TrpcContext["req"],
         res: { clearCookie: () => {} } as TrpcContext["res"],
       };
       const caller = appRouter.createCaller(unauthCtx);
       await expect(caller.deal.getPipeline({})).rejects.toThrow();
     });
   });

   describe("tRPC: deal.moveStage", () => {
     beforeEach(() => vi.clearAllMocks());

     it("calls moveDealStage, logAuditEvent, and returns success", async () => {
       vi.mocked(db.getDealById).mockResolvedValue({
         id: 42, title: "Test Deal", pipelineStage: "Sourced",
       } as any);
       vi.mocked(db.moveDealStage).mockResolvedValue({ previousStage: "Sourced" });
       vi.mocked(db.logAuditEvent).mockResolvedValue(undefined as any);

       const caller = appRouter.createCaller(makeCtx());
       const result = await caller.deal.moveStage({
         dealId: 42,
         newStage: "Intro Made",
       });

       expect(db.moveDealStage).toHaveBeenCalledWith(42, "Intro Made");
       expect(db.logAuditEvent).toHaveBeenCalledWith(
         expect.objectContaining({
           action: "deal_pipeline_stage_moved",
           entityType: "deal",
           entityId: 42,
         })
       );
       expect(result).toEqual({ success: true });
     });

     it("throws NOT_FOUND when deal does not exist", async () => {
       vi.mocked(db.getDealById).mockResolvedValue(undefined);

       const caller = appRouter.createCaller(makeCtx());
       await expect(
         caller.deal.moveStage({ dealId: 999, newStage: "Closed" })
       ).rejects.toThrow("NOT_FOUND");
     });
   });

   describe("tRPC: deal.getStaleDeals", () => {
     beforeEach(() => vi.clearAllMocks());

     it("delegates to getStaleDeals with thresholdDays", async () => {
       vi.mocked(db.getStaleDeals).mockResolvedValue([]);

       const caller = appRouter.createCaller(makeCtx());
       await caller.deal.getStaleDeals({ thresholdDays: 14 });

       expect(db.getStaleDeals).toHaveBeenCalledWith(1, 14);
     });
   });

   describe("tRPC: deal.bulkUpdate", () => {
     beforeEach(() => vi.clearAllMocks());

     it("calls bulkUpdateDeals and logs audit event", async () => {
       vi.mocked(db.bulkUpdateDeals).mockResolvedValue(undefined);
       vi.mocked(db.logAuditEvent).mockResolvedValue(undefined as any);

       const caller = appRouter.createCaller(makeCtx());
       const result = await caller.deal.bulkUpdate({
         dealIds: [1, 2, 3],
         updates: { priority: "high" },
       });

       expect(db.bulkUpdateDeals).toHaveBeenCalledWith(
         [1, 2, 3],
         { priority: "high" }
       );
       expect(result).toEqual({ success: true, count: 3 });
     });
   });

   describe("tRPC: pipelineTemplate.list", () => {
     beforeEach(() => vi.clearAllMocks());

     it("returns templates for authenticated user", async () => {
       const mockTemplates = [{ id: 1, userId: 1, name: "Default", stages: ["Sourced"] }];
       vi.mocked(db.getPipelineTemplates).mockResolvedValue(mockTemplates as any);

       const caller = appRouter.createCaller(makeCtx());
       const result = await caller.pipelineTemplate.list();

       expect(db.getPipelineTemplates).toHaveBeenCalledWith(1);
       expect(result).toEqual(mockTemplates);
     });
   });
   ```

2. **Verify tests fail** (procedures don't exist yet):
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test pipeline.test.ts 2>&1 | grep -E "FAIL|Error|not a function"
   ```

3. **Implement** — in `routers.ts`:

   a. **Extend the existing `dealRouter`** by adding new procedures after the existing `getParticipants` procedure (before the closing `}`):

   ```typescript
   getPipeline: protectedProcedure
     .input(z.object({ templateId: z.number().optional() }).optional())
     .query(async ({ ctx, input }) => {
       return db.getPipelineByUser(ctx.user.id, input?.templateId);
     }),

   moveStage: protectedProcedure
     .input(z.object({
       dealId: z.number(),
       newStage: z.string(),
     }))
     .mutation(async ({ ctx, input }) => {
       const deal = await db.getDealById(input.dealId);
       if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

       const { previousStage } = await db.moveDealStage(input.dealId, input.newStage);

       await db.logAuditEvent({
         userId: ctx.user.id,
         action: "deal_pipeline_stage_moved",
         entityType: "deal",
         entityId: input.dealId,
         previousState: { pipelineStage: previousStage },
         newState: { pipelineStage: input.newStage },
       });

       return { success: true };
     }),

   getStaleDeals: protectedProcedure
     .input(z.object({ thresholdDays: z.number().min(1).default(14) }))
     .query(async ({ ctx, input }) => {
       return db.getStaleDeals(ctx.user.id, input.thresholdDays);
     }),

   bulkUpdate: protectedProcedure
     .input(z.object({
       dealIds: z.array(z.number()).min(1),
       updates: z.object({
         pipelineStage: z.string().optional(),
         priority: z.enum(["low", "normal", "high", "critical"]).optional(),
         assignedToUserId: z.number().optional(),
       }),
     }))
     .mutation(async ({ ctx, input }) => {
       await db.bulkUpdateDeals(input.dealIds, input.updates);

       await db.logAuditEvent({
         userId: ctx.user.id,
         action: "deal_bulk_updated",
         entityType: "deal",
         entityId: input.dealIds[0],
         newState: { dealIds: input.dealIds, updates: input.updates },
       });

       return { success: true, count: input.dealIds.length };
     }),
   ```

   b. **Add a new `pipelineTemplateRouter`** after the `dealRouter` block and before the `dealRoomRouter`:

   ```typescript
   // ============================================================================
   // PIPELINE TEMPLATE ROUTER
   // ============================================================================

   const pipelineTemplateRouter = router({
     list: protectedProcedure.query(async ({ ctx }) => {
       return db.getPipelineTemplates(ctx.user.id);
     }),

     create: protectedProcedure
       .input(z.object({
         name: z.string().min(1).max(128),
         dealType: z.string().optional().default("any"),
         stages: z.array(z.string().min(1)).min(1),
         isDefault: z.boolean().optional().default(false),
       }))
       .mutation(async ({ ctx, input }) => {
         const id = await db.createPipelineTemplate({
           userId: ctx.user.id,
           name: input.name,
           dealType: input.dealType,
           stages: input.stages,
           isDefault: input.isDefault,
         });

         await db.logAuditEvent({
           userId: ctx.user.id,
           action: "pipeline_template_created",
           entityType: "pipeline_template",
           entityId: id,
           newState: input,
         });

         return { id };
       }),

     update: protectedProcedure
       .input(z.object({
         id: z.number(),
         name: z.string().min(1).max(128).optional(),
         stages: z.array(z.string().min(1)).min(1).optional(),
         isDefault: z.boolean().optional(),
       }))
       .mutation(async ({ ctx, input }) => {
         const { id, ...data } = input;
         await db.updatePipelineTemplate(id, data);

         await db.logAuditEvent({
           userId: ctx.user.id,
           action: "pipeline_template_updated",
           entityType: "pipeline_template",
           entityId: id,
           newState: data,
         });

         return { success: true };
       }),
   });
   ```

   c. **Register in `appRouter`** — after `deal: dealRouter,` add:
   ```typescript
   pipelineTemplate: pipelineTemplateRouter,
   ```

4. **Verify all pipeline tests pass:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test pipeline.test.ts
   ```

5. **Verify the full test suite still passes:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test
   ```

**Commit:** `feat(api): deal.getPipeline, deal.moveStage, deal.getStaleDeals, deal.bulkUpdate, pipelineTemplate router`

---

### Task 5 — Add `/pipeline` route in App.tsx

**What:** Register the new `DealKanban` page under `/pipeline` as a `ShellRoute`.

**File:** `/home/ariel/Documents/anavi-main/anavi/client/src/App.tsx`

**Steps:**

1. Add the import at the top of `App.tsx`, after the `DealMatching` import:
   ```typescript
   import DealKanban from "./pages/DealKanban";
   ```

2. Inside the `Router` function's `<Switch>`, add after the `/deal-matching` route:
   ```tsx
   <Route path="/pipeline">
     <ShellRoute component={DealKanban} />
   </Route>
   ```

3. Create a placeholder page so TypeScript doesn't error. Create `/home/ariel/Documents/anavi-main/anavi/client/src/pages/DealKanban.tsx`:
   ```tsx
   export default function DealKanban() {
     return <div>Pipeline — coming in Task 6</div>;
   }
   ```

4. Verify TypeScript compiles:
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm check
   ```

**Commit:** `feat(routes): add /pipeline route pointing to DealKanban page`

---

### Task 6 — Build the `DealCard` component

**What:** A card representing a single deal in the kanban. Shows name, counterparty, deal size, sector, days-in-stage with amber/red left border warnings, last-touched timestamp.

**File:** `/home/ariel/Documents/anavi-main/anavi/client/src/components/DealCard.tsx` (new file)

**Steps:**

1. **Write the failing test first.** Create `/home/ariel/Documents/anavi-main/anavi/client/src/components/DealCard.test.tsx`:

   ```tsx
   import { describe, it, expect, vi } from "vitest";
   import { render, screen } from "@testing-library/react";
   import userEvent from "@testing-library/user-event";
   import { DealCard } from "./DealCard";

   const baseDeal = {
     id: 1,
     title: "Acme Acquisition",
     counterparty: "Acme Corp",
     dealValue: "5000000",
     currency: "USD",
     sector: "Technology",
     stageEnteredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
     lastTouchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
     priority: "normal" as const,
   };

   describe("DealCard", () => {
     it("renders deal title", () => {
       render(<DealCard deal={baseDeal} onClick={() => {}} />);
       expect(screen.getByText("Acme Acquisition")).toBeDefined();
     });

     it("renders counterparty", () => {
       render(<DealCard deal={baseDeal} onClick={() => {}} />);
       expect(screen.getByText("Acme Corp")).toBeDefined();
     });

     it("renders formatted deal value", () => {
       render(<DealCard deal={baseDeal} onClick={() => {}} />);
       expect(screen.getByText(/\$5\.0M/)).toBeDefined();
     });

     it("renders sector badge", () => {
       render(<DealCard deal={baseDeal} onClick={() => {}} />);
       expect(screen.getByText("Technology")).toBeDefined();
     });

     it("shows no warning border at 10 days (< 14)", () => {
       const { container } = render(<DealCard deal={baseDeal} onClick={() => {}} />);
       const card = container.firstChild as HTMLElement;
       expect(card.className).not.toMatch(/border-amber/);
       expect(card.className).not.toMatch(/border-red/);
     });

     it("shows amber border when > 14 days in stage", () => {
       const amberDeal = {
         ...baseDeal,
         stageEnteredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
       };
       const { container } = render(<DealCard deal={amberDeal} onClick={() => {}} />);
       const card = container.firstChild as HTMLElement;
       expect(card.className).toMatch(/border-amber/);
     });

     it("shows red border when > 30 days in stage", () => {
       const staleDeal = {
         ...baseDeal,
         stageEnteredAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
       };
       const { container } = render(<DealCard deal={staleDeal} onClick={() => {}} />);
       const card = container.firstChild as HTMLElement;
       expect(card.className).toMatch(/border-red/);
     });

     it("calls onClick when clicked", async () => {
       const onClick = vi.fn();
       render(<DealCard deal={baseDeal} onClick={onClick} />);
       await userEvent.click(screen.getByText("Acme Acquisition"));
       expect(onClick).toHaveBeenCalledWith(1);
     });
   });
   ```

2. **Verify tests fail** (component doesn't exist):
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test DealCard.test.tsx 2>&1 | head -20
   ```

3. **Implement** `/home/ariel/Documents/anavi-main/anavi/client/src/components/DealCard.tsx`:

   ```tsx
   import { differenceInDays, formatDistanceToNow } from "date-fns";
   import { Building2, DollarSign, Tag, Clock } from "lucide-react";
   import { cn } from "@/lib/utils";

   export interface DealCardData {
     id: number;
     title: string;
     counterparty?: string | null;
     dealValue?: string | null;
     currency?: string | null;
     sector?: string | null;
     stageEnteredAt?: Date | null;
     lastTouchedAt?: Date | null;
     priority?: "low" | "normal" | "high" | "critical" | null;
   }

   interface DealCardProps {
     deal: DealCardData;
     onClick: (id: number) => void;
     isDragging?: boolean;
   }

   function formatDealValue(value?: string | null, currency?: string | null): string {
     const num = parseFloat(value ?? "0");
     if (!num) return "—";
     const symbol = currency === "USD" ? "$" : (currency ?? "$");
     if (num >= 1_000_000_000) return `${symbol}${(num / 1_000_000_000).toFixed(1)}B`;
     if (num >= 1_000_000) return `${symbol}${(num / 1_000_000).toFixed(1)}M`;
     if (num >= 1_000) return `${symbol}${(num / 1_000).toFixed(0)}K`;
     return `${symbol}${num.toFixed(0)}`;
   }

   function getStaleBorderClass(stageEnteredAt?: Date | null): string {
     if (!stageEnteredAt) return "";
     const days = differenceInDays(new Date(), stageEnteredAt);
     if (days > 30) return "border-l-4 border-l-red-500";
     if (days > 14) return "border-l-4 border-l-amber-400";
     return "";
   }

   function getDaysInStage(stageEnteredAt?: Date | null): number | null {
     if (!stageEnteredAt) return null;
     return differenceInDays(new Date(), stageEnteredAt);
   }

   export function DealCard({ deal, onClick, isDragging }: DealCardProps) {
     const staleBorder = getStaleBorderClass(deal.stageEnteredAt);
     const daysInStage = getDaysInStage(deal.stageEnteredAt);

     return (
       <div
         role="button"
         tabIndex={0}
         onClick={() => onClick(deal.id)}
         onKeyDown={(e) => e.key === "Enter" && onClick(deal.id)}
         className={cn(
           "group relative rounded-lg bg-card/80 backdrop-blur-sm p-3",
           "border border-white/10 hover:border-white/20",
           "shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer",
           "select-none",
           staleBorder,
           isDragging && "opacity-50 rotate-1 shadow-xl"
         )}
       >
         {/* Priority indicator */}
         {(deal.priority === "high" || deal.priority === "critical") && (
           <div
             className={cn(
               "absolute top-2 right-2 w-1.5 h-1.5 rounded-full",
               deal.priority === "critical" ? "bg-red-500" : "bg-amber-400"
             )}
           />
         )}

         {/* Title */}
         <p className="font-medium text-sm text-foreground leading-tight mb-1.5 pr-3">
           {deal.title}
         </p>

         {/* Counterparty */}
         {deal.counterparty && (
           <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
             <Building2 className="w-3 h-3 shrink-0" />
             <span className="truncate">{deal.counterparty}</span>
           </div>
         )}

         {/* Deal value + sector */}
         <div className="flex items-center justify-between mt-2 gap-2">
           {deal.dealValue && (
             <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
               <DollarSign className="w-3 h-3 shrink-0" />
               <span>{formatDealValue(deal.dealValue, deal.currency)}</span>
             </div>
           )}
           {deal.sector && (
             <div className="flex items-center gap-1 text-xs text-muted-foreground">
               <Tag className="w-3 h-3 shrink-0" />
               <span className="truncate max-w-[80px]">{deal.sector}</span>
             </div>
           )}
         </div>

         {/* Days in stage / last touched */}
         <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
           {daysInStage !== null && (
             <span
               className={cn(
                 "text-[10px] font-data-hud tabular-nums",
                 daysInStage > 30
                   ? "text-red-400"
                   : daysInStage > 14
                   ? "text-amber-400"
                   : "text-muted-foreground"
               )}
             >
               {daysInStage}d in stage
             </span>
           )}
           {deal.lastTouchedAt && (
             <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
               <Clock className="w-2.5 h-2.5" />
               <span>{formatDistanceToNow(deal.lastTouchedAt, { addSuffix: true })}</span>
             </div>
           )}
         </div>
       </div>
     );
   }
   ```

4. **Verify tests pass:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test DealCard.test.tsx
   ```

**Commit:** `feat(ui): DealCard component with stale-deal amber/red border warnings`

---

### Task 7 — Build the `KanbanColumn` component

**What:** A single pipeline stage column. Renders a header with stage name + deal count, a scrollable list of `DealCard`s, and acts as a `useDroppable` target for @dnd-kit.

**File:** `/home/ariel/Documents/anavi-main/anavi/client/src/components/KanbanColumn.tsx` (new file)

**Steps:**

1. **Write the failing test first.** Create `/home/ariel/Documents/anavi-main/anavi/client/src/components/KanbanColumn.test.tsx`:

   ```tsx
   import { describe, it, expect, vi } from "vitest";
   import { render, screen } from "@testing-library/react";
   import { DndContext } from "@dnd-kit/core";
   import { KanbanColumn } from "./KanbanColumn";

   const mockDeals = [
     {
       id: 1,
       title: "Deal Alpha",
       counterparty: "Alpha LLC",
       dealValue: "1000000",
       currency: "USD",
       sector: "Fintech",
       stageEnteredAt: new Date(),
       lastTouchedAt: new Date(),
       priority: "normal" as const,
     },
     {
       id: 2,
       title: "Deal Beta",
       counterparty: null,
       dealValue: null,
       currency: "USD",
       sector: null,
       stageEnteredAt: null,
       lastTouchedAt: null,
       priority: "high" as const,
     },
   ];

   describe("KanbanColumn", () => {
     it("renders stage name", () => {
       render(
         <DndContext>
           <KanbanColumn stage="Sourced" deals={mockDeals} onCardClick={() => {}} />
         </DndContext>
       );
       expect(screen.getByText("Sourced")).toBeDefined();
     });

     it("renders deal count badge", () => {
       render(
         <DndContext>
           <KanbanColumn stage="Sourced" deals={mockDeals} onCardClick={() => {}} />
         </DndContext>
       );
       expect(screen.getByText("2")).toBeDefined();
     });

     it("renders all deal cards", () => {
       render(
         <DndContext>
           <KanbanColumn stage="Sourced" deals={mockDeals} onCardClick={() => {}} />
         </DndContext>
       );
       expect(screen.getByText("Deal Alpha")).toBeDefined();
       expect(screen.getByText("Deal Beta")).toBeDefined();
     });

     it("renders empty state when no deals", () => {
       render(
         <DndContext>
           <KanbanColumn stage="Term Sheet" deals={[]} onCardClick={() => {}} />
         </DndContext>
       );
       expect(screen.getByText(/no deals/i)).toBeDefined();
     });
   });
   ```

2. **Verify tests fail:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test KanbanColumn.test.tsx 2>&1 | head -20
   ```

3. **Implement** `/home/ariel/Documents/anavi-main/anavi/client/src/components/KanbanColumn.tsx`:

   ```tsx
   import { useDroppable } from "@dnd-kit/core";
   import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
   import { cn } from "@/lib/utils";
   import { DealCard, type DealCardData } from "./DealCard";

   interface KanbanColumnProps {
     stage: string;
     deals: DealCardData[];
     onCardClick: (dealId: number) => void;
     isOver?: boolean;
   }

   const STAGE_COLORS: Record<string, string> = {
     Sourced: "text-sky-400",
     "Intro Made": "text-violet-400",
     "NDA Signed": "text-emerald-400",
     Diligence: "text-amber-400",
     "Term Sheet": "text-orange-400",
     Closed: "text-green-400",
     Passed: "text-rose-400",
   };

   export function KanbanColumn({ stage, deals, onCardClick }: KanbanColumnProps) {
     const { setNodeRef, isOver } = useDroppable({ id: stage });

     const colorClass = STAGE_COLORS[stage] ?? "text-muted-foreground";
     const dealIds = deals.map((d) => d.id.toString());

     return (
       <div className="flex flex-col w-64 shrink-0 h-full">
         {/* Column header */}
         <div className="flex items-center justify-between px-3 py-2 mb-2">
           <span className={cn("text-xs font-semibold uppercase tracking-wider", colorClass)}>
             {stage}
           </span>
           <span className="text-xs font-data-hud tabular-nums bg-white/5 text-muted-foreground px-1.5 py-0.5 rounded-full">
             {deals.length}
           </span>
         </div>

         {/* Drop zone */}
         <div
           ref={setNodeRef}
           className={cn(
             "flex-1 flex flex-col gap-2 rounded-xl px-2 py-2 min-h-[120px]",
             "transition-colors duration-150",
             isOver
               ? "bg-white/5 ring-1 ring-white/20"
               : "bg-white/[0.02]"
           )}
         >
           <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
             {deals.length === 0 ? (
               <div className="flex-1 flex items-center justify-center">
                 <p className="text-[11px] text-muted-foreground/50 italic">
                   No deals in this stage
                 </p>
               </div>
             ) : (
               deals.map((deal) => (
                 <DealCard key={deal.id} deal={deal} onClick={onCardClick} />
               ))
             )}
           </SortableContext>
         </div>
       </div>
     );
   }
   ```

4. **Verify tests pass:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test KanbanColumn.test.tsx
   ```

**Commit:** `feat(ui): KanbanColumn component with dnd-kit droppable + stage color tokens`

---

### Task 8 — Build the slide-out `DealDetailPanel` component

**What:** A slide-out drawer (using `vaul` which is already in `package.json`) that shows full deal detail when a card is clicked.

**File:** `/home/ariel/Documents/anavi-main/anavi/client/src/components/DealDetailPanel.tsx` (new file)

**Steps:**

1. **Write the failing test first.** Create `/home/ariel/Documents/anavi-main/anavi/client/src/components/DealDetailPanel.test.tsx`:

   ```tsx
   import { describe, it, expect, vi } from "vitest";
   import { render, screen } from "@testing-library/react";
   import userEvent from "@testing-library/user-event";
   import { DealDetailPanel } from "./DealDetailPanel";

   const mockDeal = {
     id: 7,
     title: "Bridge Financing Round",
     description: "Series B bridge note",
     counterparty: "Nexus Capital",
     dealValue: "12000000",
     currency: "USD",
     sector: "Fintech",
     dealType: "debt_financing" as const,
     pipelineStage: "Diligence",
     priority: "high" as const,
     stageEnteredAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
     lastTouchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
     createdAt: new Date(),
   };

   describe("DealDetailPanel", () => {
     it("renders deal title when open", () => {
       render(
         <DealDetailPanel deal={mockDeal} open={true} onClose={() => {}} />
       );
       expect(screen.getByText("Bridge Financing Round")).toBeDefined();
     });

     it("renders counterparty", () => {
       render(
         <DealDetailPanel deal={mockDeal} open={true} onClose={() => {}} />
       );
       expect(screen.getByText("Nexus Capital")).toBeDefined();
     });

     it("does not render content when closed", () => {
       render(
         <DealDetailPanel deal={mockDeal} open={false} onClose={() => {}} />
       );
       expect(screen.queryByText("Bridge Financing Round")).toBeNull();
     });

     it("renders null gracefully when deal is null", () => {
       const { container } = render(
         <DealDetailPanel deal={null} open={true} onClose={() => {}} />
       );
       // Should not throw, may render empty drawer
       expect(container).toBeDefined();
     });

     it("calls onClose when close button clicked", async () => {
       const onClose = vi.fn();
       render(
         <DealDetailPanel deal={mockDeal} open={true} onClose={onClose} />
       );
       const closeBtn = screen.getByRole("button", { name: /close/i });
       await userEvent.click(closeBtn);
       expect(onClose).toHaveBeenCalled();
     });
   });
   ```

2. **Verify tests fail:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test DealDetailPanel.test.tsx 2>&1 | head -20
   ```

3. **Implement** `/home/ariel/Documents/anavi-main/anavi/client/src/components/DealDetailPanel.tsx`:

   ```tsx
   import { Drawer } from "vaul";
   import { X, Building2, DollarSign, Tag, Clock, Calendar, AlertTriangle } from "lucide-react";
   import { differenceInDays, format, formatDistanceToNow } from "date-fns";
   import { cn } from "@/lib/utils";
   import { Badge } from "@/components/ui/badge";

   interface DealForPanel {
     id: number;
     title: string;
     description?: string | null;
     counterparty?: string | null;
     dealValue?: string | null;
     currency?: string | null;
     sector?: string | null;
     dealType?: string | null;
     pipelineStage?: string | null;
     priority?: "low" | "normal" | "high" | "critical" | null;
     stageEnteredAt?: Date | null;
     lastTouchedAt?: Date | null;
     createdAt?: Date | null;
   }

   interface DealDetailPanelProps {
     deal: DealForPanel | null;
     open: boolean;
     onClose: () => void;
   }

   function formatValue(value?: string | null, currency?: string | null): string {
     const num = parseFloat(value ?? "0");
     if (!num) return "—";
     const sym = currency === "USD" ? "$" : (currency ?? "$");
     if (num >= 1_000_000_000) return `${sym}${(num / 1_000_000_000).toFixed(2)}B`;
     if (num >= 1_000_000) return `${sym}${(num / 1_000_000).toFixed(2)}M`;
     return `${sym}${num.toLocaleString()}`;
   }

   const PRIORITY_COLORS: Record<string, string> = {
     low: "bg-slate-500/20 text-slate-400",
     normal: "bg-sky-500/20 text-sky-400",
     high: "bg-amber-500/20 text-amber-400",
     critical: "bg-red-500/20 text-red-400",
   };

   export function DealDetailPanel({ deal, open, onClose }: DealDetailPanelProps) {
     const daysInStage = deal?.stageEnteredAt
       ? differenceInDays(new Date(), deal.stageEnteredAt)
       : null;

     const isStale = daysInStage !== null && daysInStage > 14;

     return (
       <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()} direction="right">
         <Drawer.Portal>
           <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
           <Drawer.Content
             className={cn(
               "fixed right-0 top-0 bottom-0 z-50 flex flex-col",
               "w-full max-w-md bg-background/95 backdrop-blur-xl",
               "border-l border-white/10 shadow-2xl"
             )}
           >
             {deal && (
               <>
                 {/* Header */}
                 <div className="flex items-start justify-between p-6 border-b border-white/10">
                   <div className="flex-1 pr-4">
                     <h2 className="text-lg font-semibold text-foreground leading-tight">
                       {deal.title}
                     </h2>
                     {deal.pipelineStage && (
                       <span className="text-xs text-muted-foreground mt-1 block">
                         {deal.pipelineStage}
                       </span>
                     )}
                   </div>
                   <button
                     aria-label="Close"
                     onClick={onClose}
                     className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 </div>

                 {/* Body */}
                 <div className="flex-1 overflow-y-auto p-6 space-y-5">
                   {/* Stale warning */}
                   {isStale && (
                     <div className={cn(
                       "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
                       daysInStage > 30
                         ? "bg-red-500/10 text-red-400 border border-red-500/20"
                         : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                     )}>
                       <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                       <span>
                         {daysInStage}d in stage —{" "}
                         {daysInStage > 30 ? "needs immediate attention" : "consider follow-up"}
                       </span>
                     </div>
                   )}

                   {/* Meta grid */}
                   <div className="grid grid-cols-2 gap-3">
                     {deal.counterparty && (
                       <div className="bg-white/5 rounded-lg p-3">
                         <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                           Counterparty
                         </p>
                         <div className="flex items-center gap-1.5">
                           <Building2 className="w-3 h-3 text-muted-foreground" />
                           <span className="text-sm font-medium">{deal.counterparty}</span>
                         </div>
                       </div>
                     )}

                     {deal.dealValue && (
                       <div className="bg-white/5 rounded-lg p-3">
                         <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                           Deal Size
                         </p>
                         <div className="flex items-center gap-1.5">
                           <DollarSign className="w-3 h-3 text-emerald-400" />
                           <span className="text-sm font-medium text-emerald-400">
                             {formatValue(deal.dealValue, deal.currency)}
                           </span>
                         </div>
                       </div>
                     )}

                     {deal.sector && (
                       <div className="bg-white/5 rounded-lg p-3">
                         <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                           Sector
                         </p>
                         <div className="flex items-center gap-1.5">
                           <Tag className="w-3 h-3 text-muted-foreground" />
                           <span className="text-sm">{deal.sector}</span>
                         </div>
                       </div>
                     )}

                     {deal.priority && (
                       <div className="bg-white/5 rounded-lg p-3">
                         <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                           Priority
                         </p>
                         <span className={cn(
                           "text-xs px-2 py-0.5 rounded-full capitalize font-medium",
                           PRIORITY_COLORS[deal.priority] ?? ""
                         )}>
                           {deal.priority}
                         </span>
                       </div>
                     )}
                   </div>

                   {/* Description */}
                   {deal.description && (
                     <div>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                         Description
                       </p>
                       <p className="text-sm text-muted-foreground leading-relaxed">
                         {deal.description}
                       </p>
                     </div>
                   )}

                   {/* Timestamps */}
                   <div className="space-y-2 pt-2 border-t border-white/5">
                     {deal.stageEnteredAt && (
                       <div className="flex items-center justify-between text-xs text-muted-foreground">
                         <span className="flex items-center gap-1.5">
                           <Calendar className="w-3 h-3" />
                           Stage entered
                         </span>
                         <span className="font-data-hud">
                           {format(deal.stageEnteredAt, "MMM d, yyyy")}
                         </span>
                       </div>
                     )}
                     {deal.lastTouchedAt && (
                       <div className="flex items-center justify-between text-xs text-muted-foreground">
                         <span className="flex items-center gap-1.5">
                           <Clock className="w-3 h-3" />
                           Last touched
                         </span>
                         <span className="font-data-hud">
                           {formatDistanceToNow(deal.lastTouchedAt, { addSuffix: true })}
                         </span>
                       </div>
                     )}
                     {deal.createdAt && (
                       <div className="flex items-center justify-between text-xs text-muted-foreground">
                         <span className="flex items-center gap-1.5">
                           <Clock className="w-3 h-3" />
                           Created
                         </span>
                         <span className="font-data-hud">
                           {format(deal.createdAt, "MMM d, yyyy")}
                         </span>
                       </div>
                     )}
                   </div>
                 </div>
               </>
             )}
           </Drawer.Content>
         </Drawer.Portal>
       </Drawer.Root>
     );
   }
   ```

4. **Verify tests pass:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test DealDetailPanel.test.tsx
   ```

**Commit:** `feat(ui): DealDetailPanel slide-out drawer with stale warning + deal metadata`

---

### Task 9 — Build the main `DealKanban` page

**What:** Replace the placeholder `DealKanban.tsx` with the full kanban board. Uses `DndContext` from `@dnd-kit/core`, renders one `KanbanColumn` per stage, handles `onDragEnd` to call `trpc.deal.moveStage`, manages selected deal for the `DealDetailPanel`.

**File:** `/home/ariel/Documents/anavi-main/anavi/client/src/pages/DealKanban.tsx`

**Steps:**

1. **Write the failing test first.** Create `/home/ariel/Documents/anavi-main/anavi/client/src/pages/DealKanban.test.tsx`:

   ```tsx
   import { describe, it, expect, vi } from "vitest";
   import { render, screen, waitFor } from "@testing-library/react";
   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

   // Mock trpc
   vi.mock("@/lib/trpc", () => ({
     trpc: {
       deal: {
         getPipeline: {
           useQuery: vi.fn().mockReturnValue({
             data: {
               Sourced: [
                 {
                   id: 1, title: "Alpha Deal", counterparty: "Acme",
                   dealValue: "5000000", currency: "USD", sector: "Tech",
                   stageEnteredAt: new Date(), lastTouchedAt: new Date(), priority: "normal",
                 },
               ],
               "Intro Made": [],
               "NDA Signed": [],
               Diligence: [],
               "Term Sheet": [],
               Closed: [],
               Passed: [],
             },
             isLoading: false,
             refetch: vi.fn(),
           }),
         },
         moveStage: {
           useMutation: vi.fn().mockReturnValue({
             mutate: vi.fn(),
             isPending: false,
           }),
         },
       },
     },
   }));

   import DealKanban from "./DealKanban";

   function wrapper({ children }: { children: React.ReactNode }) {
     return (
       <QueryClientProvider client={new QueryClient()}>
         {children}
       </QueryClientProvider>
     );
   }

   describe("DealKanban page", () => {
     it("renders all 7 default stage columns", async () => {
       render(<DealKanban />, { wrapper });
       await waitFor(() => {
         expect(screen.getByText("Sourced")).toBeDefined();
         expect(screen.getByText("Intro Made")).toBeDefined();
         expect(screen.getByText("NDA Signed")).toBeDefined();
         expect(screen.getByText("Diligence")).toBeDefined();
         expect(screen.getByText("Term Sheet")).toBeDefined();
         expect(screen.getByText("Closed")).toBeDefined();
         expect(screen.getByText("Passed")).toBeDefined();
       });
     });

     it("renders deal cards from pipeline data", async () => {
       render(<DealKanban />, { wrapper });
       await waitFor(() => {
         expect(screen.getByText("Alpha Deal")).toBeDefined();
       });
     });

     it("renders page heading", async () => {
       render(<DealKanban />, { wrapper });
       await waitFor(() => {
         expect(screen.getByText(/pipeline/i)).toBeDefined();
       });
     });
   });
   ```

2. **Verify tests fail** (page renders placeholder text only):
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test DealKanban.test.tsx 2>&1 | head -20
   ```

3. **Implement** `/home/ariel/Documents/anavi-main/anavi/client/src/pages/DealKanban.tsx`:

   ```tsx
   import { useState, useCallback } from "react";
   import {
     DndContext,
     DragOverlay,
     PointerSensor,
     useSensor,
     useSensors,
     type DragEndEvent,
     type DragStartEvent,
   } from "@dnd-kit/core";
   import { motion } from "framer-motion";
   import { GitBranch, AlertTriangle } from "lucide-react";
   import { toast } from "sonner";
   import { trpc } from "@/lib/trpc";
   import { KanbanColumn } from "@/components/KanbanColumn";
   import { DealCard, type DealCardData } from "@/components/DealCard";
   import { DealDetailPanel } from "@/components/DealDetailPanel";

   const DEFAULT_STAGES = [
     "Sourced",
     "Intro Made",
     "NDA Signed",
     "Diligence",
     "Term Sheet",
     "Closed",
     "Passed",
   ] as const;

   export default function DealKanban() {
     const [activeDeal, setActiveDeal] = useState<DealCardData | null>(null);
     const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
     const [panelOpen, setPanelOpen] = useState(false);

     const { data: pipeline = {}, refetch } = trpc.deal.getPipeline.useQuery({});

     const moveStage = trpc.deal.moveStage.useMutation({
       onSuccess: () => {
         refetch();
         toast.success("Deal moved");
       },
       onError: (err) => {
         toast.error(err.message);
         refetch(); // revert optimistic update
       },
     });

     const sensors = useSensors(
       useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
     );

     const handleDragStart = useCallback(
       (event: DragStartEvent) => {
         const id = Number(event.active.id);
         for (const stage of DEFAULT_STAGES) {
           const deal = (pipeline[stage] ?? []).find((d: DealCardData) => d.id === id);
           if (deal) {
             setActiveDeal(deal);
             return;
           }
         }
       },
       [pipeline]
     );

     const handleDragEnd = useCallback(
       (event: DragEndEvent) => {
         setActiveDeal(null);
         const { active, over } = event;
         if (!over || active.id === over.id) return;

         const dealId = Number(active.id);
         const newStage = String(over.id);

         // Validate it's a real stage
         if (!DEFAULT_STAGES.includes(newStage as any)) return;

         moveStage.mutate({ dealId, newStage });
       },
       [moveStage]
     );

     const handleCardClick = useCallback((dealId: number) => {
       setSelectedDealId(dealId);
       setPanelOpen(true);
     }, []);

     // Find the full deal data for the panel
     const selectedDeal = selectedDealId
       ? DEFAULT_STAGES.flatMap((s) => pipeline[s] ?? []).find(
           (d: DealCardData) => d.id === selectedDealId
         ) ?? null
       : null;

     // Count total deals
     const totalDeals = DEFAULT_STAGES.reduce(
       (sum, s) => sum + (pipeline[s]?.length ?? 0),
       0
     );

     return (
       <div className="min-h-screen bg-background flex flex-col">
         {/* Header */}
         <motion.div
           initial={{ opacity: 0, y: -8 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
           className="px-8 pt-8 pb-4 shrink-0"
         >
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                 <GitBranch className="w-4.5 h-4.5 text-emerald-400" />
               </div>
               <div>
                 <h1 className="text-xl font-semibold dash-heading">
                   Deal Pipeline
                 </h1>
                 <p className="text-xs text-muted-foreground mt-0.5">
                   {totalDeals} deal{totalDeals !== 1 ? "s" : ""} across{" "}
                   {DEFAULT_STAGES.length} stages
                 </p>
               </div>
             </div>
           </div>
         </motion.div>

         {/* Kanban board */}
         <div className="flex-1 overflow-x-auto px-6 pb-8">
           <DndContext
             sensors={sensors}
             onDragStart={handleDragStart}
             onDragEnd={handleDragEnd}
           >
             <div className="flex gap-3 h-full min-h-[600px]">
               {DEFAULT_STAGES.map((stage) => (
                 <KanbanColumn
                   key={stage}
                   stage={stage}
                   deals={pipeline[stage] ?? []}
                   onCardClick={handleCardClick}
                 />
               ))}
             </div>

             {/* Drag overlay — rendered outside columns so it floats above all */}
             <DragOverlay dropAnimation={null}>
               {activeDeal ? (
                 <DealCard
                   deal={activeDeal}
                   onClick={() => {}}
                   isDragging
                 />
               ) : null}
             </DragOverlay>
           </DndContext>
         </div>

         {/* Slide-out panel */}
         <DealDetailPanel
           deal={selectedDeal as any}
           open={panelOpen}
           onClose={() => {
             setPanelOpen(false);
             setSelectedDealId(null);
           }}
         />
       </div>
     );
   }
   ```

4. **Verify tests pass:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test DealKanban.test.tsx
   ```

5. **Verify the full test suite still passes:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test
   ```

**Commit:** `feat(page): DealKanban — 7-stage board, drag-and-drop, slide-out panel, stage move mutation`

---

## Phase 2: Custom Templates, Bulk Operations, Stale Deal Alerts

### Task 10 — `StaleDealsAlert` banner component

**What:** A persistent dismissable alert banner at the top of the pipeline page that lists deals overdue for follow-up (beyond 14 days), fetched via `trpc.deal.getStaleDeals`.

**File:** `/home/ariel/Documents/anavi-main/anavi/client/src/components/StaleDealsAlert.tsx` (new file)

**Steps:**

1. **Write the failing test first.** Create `/home/ariel/Documents/anavi-main/anavi/client/src/components/StaleDealsAlert.test.tsx`:

   ```tsx
   import { describe, it, expect, vi } from "vitest";
   import { render, screen } from "@testing-library/react";
   import userEvent from "@testing-library/user-event";
   import { StaleDealsAlert } from "./StaleDealsAlert";

   const staleDeals = [
     { id: 1, title: "Old Deal Alpha", pipelineStage: "Diligence", stageEnteredAt: new Date(Date.now() - 20 * 86400000) },
     { id: 2, title: "Old Deal Beta", pipelineStage: "Sourced", stageEnteredAt: new Date(Date.now() - 35 * 86400000) },
   ];

   describe("StaleDealsAlert", () => {
     it("renders stale deal count", () => {
       render(<StaleDealsAlert deals={staleDeals} onDismiss={() => {}} />);
       expect(screen.getByText(/2 deal/i)).toBeDefined();
     });

     it("renders deal titles", () => {
       render(<StaleDealsAlert deals={staleDeals} onDismiss={() => {}} />);
       expect(screen.getByText("Old Deal Alpha")).toBeDefined();
       expect(screen.getByText("Old Deal Beta")).toBeDefined();
     });

     it("renders nothing when no stale deals", () => {
       const { container } = render(<StaleDealsAlert deals={[]} onDismiss={() => {}} />);
       expect(container.firstChild).toBeNull();
     });

     it("calls onDismiss when dismiss button clicked", async () => {
       const onDismiss = vi.fn();
       render(<StaleDealsAlert deals={staleDeals} onDismiss={onDismiss} />);
       await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
       expect(onDismiss).toHaveBeenCalled();
     });
   });
   ```

2. **Verify tests fail:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test StaleDealsAlert.test.tsx 2>&1 | head -10
   ```

3. **Implement** `/home/ariel/Documents/anavi-main/anavi/client/src/components/StaleDealsAlert.tsx`:

   ```tsx
   import { differenceInDays } from "date-fns";
   import { AlertTriangle, X } from "lucide-react";
   import { cn } from "@/lib/utils";

   interface StaleDealsAlertProps {
     deals: Array<{
       id: number;
       title: string;
       pipelineStage?: string | null;
       stageEnteredAt?: Date | null;
     }>;
     onDismiss: () => void;
   }

   export function StaleDealsAlert({ deals, onDismiss }: StaleDealsAlertProps) {
     if (deals.length === 0) return null;

     const critical = deals.filter(
       (d) =>
         d.stageEnteredAt &&
         differenceInDays(new Date(), d.stageEnteredAt) > 30
     );

     const isCritical = critical.length > 0;

     return (
       <div
         role="alert"
         className={cn(
           "mx-6 mb-3 flex items-start gap-3 rounded-xl px-4 py-3 text-sm",
           "border",
           isCritical
             ? "bg-red-500/10 border-red-500/30 text-red-300"
             : "bg-amber-500/10 border-amber-500/30 text-amber-300"
         )}
       >
         <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
         <div className="flex-1 min-w-0">
           <p className="font-medium">
             {deals.length} deal{deals.length !== 1 ? "s" : ""} need attention
           </p>
           <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
             {deals.slice(0, 5).map((d) => (
               <span key={d.id} className="text-xs opacity-80 truncate max-w-[160px]">
                 {d.title}
                 {d.pipelineStage && (
                   <span className="opacity-60"> · {d.pipelineStage}</span>
                 )}
               </span>
             ))}
             {deals.length > 5 && (
               <span className="text-xs opacity-60">+{deals.length - 5} more</span>
             )}
           </div>
         </div>
         <button
           aria-label="Dismiss"
           onClick={onDismiss}
           className="text-current opacity-60 hover:opacity-100 transition-opacity shrink-0"
         >
           <X className="w-4 h-4" />
         </button>
       </div>
     );
   }
   ```

4. **Integrate into `DealKanban.tsx`:** Import and add `StaleDealsAlert` between the header and the board. Add state `const [staleAlertDismissed, setStaleAlertDismissed] = useState(false)` and a query:

   ```tsx
   const { data: staleDeals = [] } = trpc.deal.getStaleDeals.useQuery(
     { thresholdDays: 14 },
     { staleTime: 5 * 60 * 1000 }
   );
   ```

   Then render before the board div:
   ```tsx
   {!staleAlertDismissed && staleDeals.length > 0 && (
     <StaleDealsAlert
       deals={staleDeals}
       onDismiss={() => setStaleAlertDismissed(true)}
     />
   )}
   ```

5. **Verify tests pass:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test StaleDealsAlert.test.tsx
   ```

**Commit:** `feat(ui): StaleDealsAlert banner — amber/red threshold warnings, dismissable`

---

### Task 11 — Bulk operations: `BulkActionBar` component + `deal.bulkUpdate` wiring

**What:** When multiple deal cards are checked (shift-click or checkbox), a floating action bar appears at the bottom of the pipeline page with "Move all to stage" and "Set priority" bulk actions.

**File:** `/home/ariel/Documents/anavi-main/anavi/client/src/components/BulkActionBar.tsx` (new file)

**Steps:**

1. **Write the failing test first.** Create `/home/ariel/Documents/anavi-main/anavi/client/src/components/BulkActionBar.test.tsx`:

   ```tsx
   import { describe, it, expect, vi } from "vitest";
   import { render, screen } from "@testing-library/react";
   import userEvent from "@testing-library/user-event";
   import { BulkActionBar } from "./BulkActionBar";

   const DEFAULT_STAGES = [
     "Sourced", "Intro Made", "NDA Signed", "Diligence", "Term Sheet", "Closed", "Passed",
   ];

   describe("BulkActionBar", () => {
     it("renders nothing when no deals selected", () => {
       const { container } = render(
         <BulkActionBar
           selectedIds={[]}
           stages={DEFAULT_STAGES}
           onMoveToStage={() => {}}
           onSetPriority={() => {}}
           onClear={() => {}}
         />
       );
       expect(container.firstChild).toBeNull();
     });

     it("shows count of selected deals", () => {
       render(
         <BulkActionBar
           selectedIds={[1, 2, 3]}
           stages={DEFAULT_STAGES}
           onMoveToStage={() => {}}
           onSetPriority={() => {}}
           onClear={() => {}}
         />
       );
       expect(screen.getByText(/3 selected/i)).toBeDefined();
     });

     it("shows clear button and calls onClear", async () => {
       const onClear = vi.fn();
       render(
         <BulkActionBar
           selectedIds={[1, 2]}
           stages={DEFAULT_STAGES}
           onMoveToStage={() => {}}
           onSetPriority={() => {}}
           onClear={onClear}
         />
       );
       await userEvent.click(screen.getByRole("button", { name: /clear/i }));
       expect(onClear).toHaveBeenCalled();
     });
   });
   ```

2. **Verify tests fail:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test BulkActionBar.test.tsx 2>&1 | head -10
   ```

3. **Implement** `/home/ariel/Documents/anavi-main/anavi/client/src/components/BulkActionBar.tsx`:

   ```tsx
   import { AnimatePresence, motion } from "framer-motion";
   import { X, ArrowRight, Flag } from "lucide-react";
   import { Button } from "@/components/ui/button";
   import {
     Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
   } from "@/components/ui/select";

   interface BulkActionBarProps {
     selectedIds: number[];
     stages: string[];
     onMoveToStage: (stage: string) => void;
     onSetPriority: (priority: "low" | "normal" | "high" | "critical") => void;
     onClear: () => void;
   }

   export function BulkActionBar({
     selectedIds,
     stages,
     onMoveToStage,
     onSetPriority,
     onClear,
   }: BulkActionBarProps) {
     if (selectedIds.length === 0) return null;

     return (
       <AnimatePresence>
         <motion.div
           initial={{ y: 80, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: 80, opacity: 0 }}
           transition={{ type: "spring", stiffness: 400, damping: 30 }}
           className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                      flex items-center gap-3 px-4 py-3
                      bg-background/95 backdrop-blur-xl border border-white/10
                      rounded-2xl shadow-2xl"
         >
           <span className="text-sm font-medium text-foreground whitespace-nowrap">
             {selectedIds.length} selected
           </span>

           <div className="w-px h-5 bg-white/10" />

           {/* Move to stage */}
           <div className="flex items-center gap-1.5">
             <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
             <Select onValueChange={onMoveToStage}>
               <SelectTrigger className="h-7 text-xs w-32 border-white/10">
                 <SelectValue placeholder="Move to…" />
               </SelectTrigger>
               <SelectContent>
                 {stages.map((s) => (
                   <SelectItem key={s} value={s} className="text-xs">
                     {s}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>

           {/* Set priority */}
           <div className="flex items-center gap-1.5">
             <Flag className="w-3.5 h-3.5 text-muted-foreground" />
             <Select onValueChange={(v) => onSetPriority(v as any)}>
               <SelectTrigger className="h-7 text-xs w-28 border-white/10">
                 <SelectValue placeholder="Priority…" />
               </SelectTrigger>
               <SelectContent>
                 {(["low", "normal", "high", "critical"] as const).map((p) => (
                   <SelectItem key={p} value={p} className="text-xs capitalize">
                     {p}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>

           <div className="w-px h-5 bg-white/10" />

           <Button
             aria-label="Clear selection"
             variant="ghost"
             size="sm"
             className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
             onClick={onClear}
           >
             <X className="w-3.5 h-3.5" />
           </Button>
         </motion.div>
       </AnimatePresence>
     );
   }
   ```

4. **Integrate into `DealKanban.tsx`:** Add state:

   ```tsx
   const [selectedIds, setSelectedIds] = useState<number[]>([]);
   ```

   Add the `BulkActionBar` at the bottom of the page:
   ```tsx
   <BulkActionBar
     selectedIds={selectedIds}
     stages={[...DEFAULT_STAGES]}
     onMoveToStage={(stage) => {
       bulkUpdate.mutate(
         { dealIds: selectedIds, updates: { pipelineStage: stage } },
         { onSuccess: () => { setSelectedIds([]); refetch(); } }
       );
     }}
     onSetPriority={(priority) => {
       bulkUpdate.mutate(
         { dealIds: selectedIds, updates: { priority } },
         { onSuccess: () => { setSelectedIds([]); refetch(); } }
       );
     }}
     onClear={() => setSelectedIds([])}
   />
   ```

   Add the `bulkUpdate` mutation:
   ```tsx
   const bulkUpdate = trpc.deal.bulkUpdate.useMutation({
     onError: (err) => toast.error(err.message),
   });
   ```

   Pass `selectedIds` / `onSelect` down to `KanbanColumn` → `DealCard` as a follow-on enhancement once the checkbox UX is designed (mark with `// TODO: checkbox selection`).

5. **Verify tests pass:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test BulkActionBar.test.tsx
   ```

**Commit:** `feat(ui): BulkActionBar — floating bulk move-stage + set-priority actions`

---

### Task 12 — Custom pipeline template UI: `PipelineTemplateManager`

**What:** A settings-style panel (accessible from a button in the pipeline header) that lets users create and rename custom stage templates via `pipelineTemplate.list`, `pipelineTemplate.create`, `pipelineTemplate.update`. Templates list their stages in a sortable chip list.

**File:** `/home/ariel/Documents/anavi-main/anavi/client/src/components/PipelineTemplateManager.tsx` (new file)

**Steps:**

1. **Write the failing test first.** Create `/home/ariel/Documents/anavi-main/anavi/client/src/components/PipelineTemplateManager.test.tsx`:

   ```tsx
   import { describe, it, expect, vi } from "vitest";
   import { render, screen, waitFor } from "@testing-library/react";
   import userEvent from "@testing-library/user-event";
   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

   vi.mock("@/lib/trpc", () => ({
     trpc: {
       pipelineTemplate: {
         list: {
           useQuery: vi.fn().mockReturnValue({
             data: [
               {
                 id: 1,
                 name: "My Template",
                 stages: ["Sourced", "Diligence", "Closed"],
                 isDefault: true,
                 dealType: "any",
               },
             ],
             isLoading: false,
           }),
         },
         create: {
           useMutation: vi.fn().mockReturnValue({
             mutate: vi.fn(),
             isPending: false,
           }),
         },
         update: {
           useMutation: vi.fn().mockReturnValue({
             mutate: vi.fn(),
             isPending: false,
           }),
         },
       },
     },
   }));

   import { PipelineTemplateManager } from "./PipelineTemplateManager";

   function wrapper({ children }: { children: React.ReactNode }) {
     return (
       <QueryClientProvider client={new QueryClient()}>
         {children}
       </QueryClientProvider>
     );
   }

   describe("PipelineTemplateManager", () => {
     it("renders existing template name", async () => {
       render(
         <PipelineTemplateManager open={true} onClose={() => {}} onSelect={() => {}} />,
         { wrapper }
       );
       await waitFor(() => {
         expect(screen.getByText("My Template")).toBeDefined();
       });
     });

     it("renders stage chips for the template", async () => {
       render(
         <PipelineTemplateManager open={true} onClose={() => {}} onSelect={() => {}} />,
         { wrapper }
       );
       await waitFor(() => {
         expect(screen.getByText("Sourced")).toBeDefined();
         expect(screen.getByText("Diligence")).toBeDefined();
         expect(screen.getByText("Closed")).toBeDefined();
       });
     });

     it("does not render when closed", () => {
       render(
         <PipelineTemplateManager open={false} onClose={() => {}} onSelect={() => {}} />,
         { wrapper }
       );
       expect(screen.queryByText("My Template")).toBeNull();
     });
   });
   ```

2. **Verify tests fail:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test PipelineTemplateManager.test.tsx 2>&1 | head -10
   ```

3. **Implement** `/home/ariel/Documents/anavi-main/anavi/client/src/components/PipelineTemplateManager.tsx`:

   ```tsx
   import { useState } from "react";
   import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
   import { Button } from "@/components/ui/button";
   import { Input } from "@/components/ui/input";
   import { Label } from "@/components/ui/label";
   import { Badge } from "@/components/ui/badge";
   import { Plus, Check, Trash2 } from "lucide-react";
   import { toast } from "sonner";
   import { trpc } from "@/lib/trpc";
   import { cn } from "@/lib/utils";

   interface PipelineTemplateManagerProps {
     open: boolean;
     onClose: () => void;
     onSelect: (templateId: number, stages: string[]) => void;
   }

   const DEFAULT_STAGES = [
     "Sourced", "Intro Made", "NDA Signed",
     "Diligence", "Term Sheet", "Closed", "Passed",
   ];

   export function PipelineTemplateManager({
     open, onClose, onSelect,
   }: PipelineTemplateManagerProps) {
     const [newName, setNewName] = useState("");
     const [newStages, setNewStages] = useState<string[]>([...DEFAULT_STAGES]);
     const [stageInput, setStageInput] = useState("");
     const [showCreate, setShowCreate] = useState(false);

     const { data: templates = [], refetch } = trpc.pipelineTemplate.list.useQuery(
       undefined,
       { enabled: open }
     );

     const createTemplate = trpc.pipelineTemplate.create.useMutation({
       onSuccess: () => {
         toast.success("Template created");
         setNewName("");
         setNewStages([...DEFAULT_STAGES]);
         setShowCreate(false);
         refetch();
       },
       onError: (err) => toast.error(err.message),
     });

     const updateTemplate = trpc.pipelineTemplate.update.useMutation({
       onSuccess: () => {
         toast.success("Template updated");
         refetch();
       },
       onError: (err) => toast.error(err.message),
     });

     const addStage = () => {
       const trimmed = stageInput.trim();
       if (trimmed && !newStages.includes(trimmed)) {
         setNewStages((prev) => [...prev, trimmed]);
         setStageInput("");
       }
     };

     const removeStage = (stage: string) => {
       setNewStages((prev) => prev.filter((s) => s !== stage));
     };

     return (
       <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
         <DialogContent className="max-w-lg bg-background/95 backdrop-blur-xl border-white/10">
           <DialogHeader>
             <DialogTitle className="dash-heading">Pipeline Templates</DialogTitle>
           </DialogHeader>

           <div className="space-y-4 mt-2">
             {/* Existing templates */}
             {templates.map((tpl) => (
               <div
                 key={tpl.id}
                 className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
               >
                 <div className="flex items-center justify-between mb-2">
                   <span className="font-medium text-sm">{tpl.name}</span>
                   <div className="flex items-center gap-2">
                     {tpl.isDefault && (
                       <Badge variant="outline" className="text-[10px]">Default</Badge>
                     )}
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-6 px-2 text-xs text-emerald-400"
                       onClick={() => onSelect(tpl.id, tpl.stages)}
                     >
                       <Check className="w-3 h-3 mr-1" />
                       Use
                     </Button>
                   </div>
                 </div>
                 <div className="flex flex-wrap gap-1">
                   {tpl.stages.map((stage) => (
                     <span
                       key={stage}
                       className="text-[10px] px-2 py-0.5 rounded-full bg-white/5
                                  text-muted-foreground border border-white/10"
                     >
                       {stage}
                     </span>
                   ))}
                 </div>
               </div>
             ))}

             {/* Create new template */}
             {!showCreate ? (
               <Button
                 variant="outline"
                 size="sm"
                 className="w-full border-dashed border-white/20 text-muted-foreground"
                 onClick={() => setShowCreate(true)}
               >
                 <Plus className="w-3.5 h-3.5 mr-1.5" />
                 New Template
               </Button>
             ) : (
               <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 space-y-3">
                 <div>
                   <Label className="text-xs text-muted-foreground">Template Name</Label>
                   <Input
                     value={newName}
                     onChange={(e) => setNewName(e.target.value)}
                     placeholder="e.g. Real Estate Pipeline"
                     className="mt-1 text-sm"
                   />
                 </div>

                 <div>
                   <Label className="text-xs text-muted-foreground">Stages</Label>
                   <div className="flex flex-wrap gap-1 mt-1 mb-2">
                     {newStages.map((s) => (
                       <span
                         key={s}
                         className="flex items-center gap-1 text-[10px] px-2 py-0.5
                                    rounded-full bg-white/5 text-muted-foreground
                                    border border-white/10"
                       >
                         {s}
                         <button
                           onClick={() => removeStage(s)}
                           className="hover:text-red-400 transition-colors"
                         >
                           <Trash2 className="w-2.5 h-2.5" />
                         </button>
                       </span>
                     ))}
                   </div>
                   <div className="flex gap-2">
                     <Input
                       value={stageInput}
                       onChange={(e) => setStageInput(e.target.value)}
                       onKeyDown={(e) => e.key === "Enter" && addStage()}
                       placeholder="Add stage…"
                       className="text-xs h-7"
                     />
                     <Button
                       variant="outline"
                       size="sm"
                       className="h-7 text-xs px-2"
                       onClick={addStage}
                     >
                       Add
                     </Button>
                   </div>
                 </div>

                 <div className="flex gap-2 justify-end">
                   <Button
                     variant="ghost"
                     size="sm"
                     className="text-xs"
                     onClick={() => setShowCreate(false)}
                   >
                     Cancel
                   </Button>
                   <Button
                     size="sm"
                     className="text-xs"
                     disabled={!newName.trim() || newStages.length === 0}
                     onClick={() =>
                       createTemplate.mutate({
                         name: newName.trim(),
                         stages: newStages,
                         isDefault: false,
                       })
                     }
                   >
                     Create
                   </Button>
                 </div>
               </div>
             )}
           </div>
         </DialogContent>
       </Dialog>
     );
   }
   ```

4. **Integrate into `DealKanban.tsx`:** Add a "Templates" button in the page header that opens `PipelineTemplateManager`. Add state `const [templateManagerOpen, setTemplateManagerOpen] = useState(false)` and a handler that updates the active stages when a template is selected.

5. **Verify tests pass:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test PipelineTemplateManager.test.tsx
   ```

6. **Run the full test suite one final time:**
   ```bash
   cd /home/ariel/Documents/anavi-main/anavi && pnpm test
   ```

**Commit:** `feat(ui): PipelineTemplateManager dialog — list, create, select custom stage templates`

---

## Final Checklist

After all 12 tasks are done, verify the following:

```
[ ] pnpm test                         — all tests green
[ ] pnpm check                        — zero TypeScript errors
[ ] pnpm db:push                      — migration applied cleanly
[ ] /pipeline route loads in browser  — kanban board visible
[ ] Drag a card between columns       — stage updates in DB, toast appears
[ ] Click a card                      — DealDetailPanel slides in from right
[ ] Stale deal (> 14d) shows amber border; > 30d shows red border
[ ] BulkActionBar appears when selectedIds.length > 0
[ ] PipelineTemplateManager opens, existing templates listed
[ ] Creating a new template via the dialog calls pipelineTemplate.create
```

## File Index

| File | Purpose |
|---|---|
| `anavi/package.json` | Added `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| `anavi/drizzle/schema.ts` | New `pipelineTemplates` table; new columns on `deals` |
| `anavi/server/db.ts` | `getPipelineByUser`, `moveDealStage`, `getStaleDeals`, `bulkUpdateDeals`, template CRUD |
| `anavi/server/routers.ts` | `deal.getPipeline`, `deal.moveStage`, `deal.getStaleDeals`, `deal.bulkUpdate`, full `pipelineTemplateRouter` |
| `anavi/server/pipeline.test.ts` | Vitest tests for all new tRPC procedures and schema types |
| `anavi/client/src/App.tsx` | `/pipeline` ShellRoute added |
| `anavi/client/src/pages/DealKanban.tsx` | Main pipeline page: DndContext, stage columns, drag handler |
| `anavi/client/src/components/DealCard.tsx` | Deal card: value, counterparty, sector, stale border |
| `anavi/client/src/components/DealCard.test.tsx` | Unit tests for DealCard stale border logic |
| `anavi/client/src/components/KanbanColumn.tsx` | Droppable stage column with SortableContext |
| `anavi/client/src/components/KanbanColumn.test.tsx` | Unit tests for KanbanColumn |
| `anavi/client/src/components/DealDetailPanel.tsx` | Vaul slide-out drawer, deal metadata + stale warning |
| `anavi/client/src/components/DealDetailPanel.test.tsx` | Unit tests for DealDetailPanel |
| `anavi/client/src/components/StaleDealsAlert.tsx` | Dismissable banner for overdue deals |
| `anavi/client/src/components/StaleDealsAlert.test.tsx` | Unit tests for StaleDealsAlert |
| `anavi/client/src/components/BulkActionBar.tsx` | Floating bulk-action bar: move stage + set priority |
| `anavi/client/src/components/BulkActionBar.test.tsx` | Unit tests for BulkActionBar |
| `anavi/client/src/components/PipelineTemplateManager.tsx` | Dialog to list/create/select stage templates |
| `anavi/client/src/components/PipelineTemplateManager.test.tsx` | Unit tests for PipelineTemplateManager |
