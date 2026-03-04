# TypeScript Build Fix + Full Frontend Page Refactor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the TypeScript errors surfacing in Vercel build logs, then logically analyze and refactor every frontend page for consistency, type safety, and maintainability.

**Architecture:** Server-side TS errors stem from `cookies.ts` return-type mismatch and `@types/express` devDependency not being available in the Vercel build cache. Frontend refactoring follows a uniform pattern: typed constants at top, subcomponents extracted when file > 400 lines, `as any` eliminated, consistent loading/empty/error states, no hardcoded hex strings where Tailwind equivalents exist.

**Tech Stack:** React 19, TypeScript 5.9, tRPC v11, Tailwind 4, shadcn/ui, framer-motion, wouter, Express 4, Drizzle ORM

**Key Conventions (read before touching any file):**
- Pages MUST NOT render `<DashboardLayout>` — that's the ShellRoute wrapper's job
- tRPC: `trpc.router.proc.useQuery()` — always set `enabled: !demo` when bifurcating demo/live
- Demo data: `useDemoFixtures()` returns `PersonaFixtures | null` — null means not in demo
- Loading states: show `<Loader2 className="animate-spin" />` or Skeleton
- Empty states: use `<EmptyState />` from `@/components/EmptyState`
- Design tokens: navy=`#0A1628`, gold=`#C4972A`, blue=`#2563EB`, green=`#059669`, steel=`#1E3A5F`
- File limit: 800 lines max per file; pages > 400 lines → extract to `pages/<Name>/` subdirectory

---

## Phase 1 — Fix TypeScript Build Errors

### Task 1: Fix `cookies.ts` return type

**Problem:** `getSessionCookieOptions` return type is `Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure">` but `domain` is commented out of the return object.

**File:** `server/_core/cookies.ts`

**Step 1: Read the file**
```
Read: anavi/server/_core/cookies.ts
```

**Step 2: Fix the return type — remove `"domain"` from the Pick**

Change:
```typescript
export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
```

To:
```typescript
export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
```

**Step 3: Verify locally**
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check
```
Expected: no new errors

**Step 4: Commit**
```bash
git add server/_core/cookies.ts
git commit -m "fix: remove domain from CookieOptions Pick (commented out in return)"
```

---

### Task 2: Move `@types/express` to dependencies

**Problem:** Vercel's build may not include devDependencies in cached installs, causing Express types to be absent during esbuild's type-pass.

**File:** `anavi/package.json`

**Step 1: Read package.json**
```
Read: anavi/package.json
```

**Step 2: Move `@types/express` from `devDependencies` to `dependencies`**

Find in devDependencies:
```json
"@types/express": "4.17.21",
```

Move it to the `dependencies` section (remove from devDeps, add to deps).

**Step 3: Reinstall**
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm install
```

**Step 4: Verify**
```bash
pnpm check
```
Expected: clean

**Step 5: Commit**
```bash
git add package.json pnpm-lock.yaml
git commit -m "fix: move @types/express to dependencies for Vercel build compatibility"
```

---

## Phase 2 — Frontend Page Refactoring

Run these 8 task groups **in parallel** using subagents. Each group shares the same refactoring standards:

**Universal Refactoring Checklist for every page:**
- [ ] Constants typed and at module top (not inline)
- [ ] No `as any` — replace with proper types or `unknown` + narrowing
- [ ] No `as unknown as X[]` — cast via properly typed adapters
- [ ] Loading state: show spinner/skeleton (not blank screen)
- [ ] Empty state: use `<EmptyState />` component
- [ ] Error state: `toast.error(...)` + early return
- [ ] Files > 400 lines: extract named sub-components to `pages/<Name>/` folder
- [ ] Remove all dead/commented-out code
- [ ] No `DashboardLayout` wrapper inside the page
- [ ] Demo/live bifurcation: `enabled: !demo` on tRPC queries
- [ ] Verify with `pnpm check` after each file

---

### Group A: Authentication & Onboarding Shell Pages

**Files (read each before editing):**
- `client/src/pages/Login.tsx`
- `client/src/pages/Register.tsx`
- `client/src/pages/ForgotPassword.tsx`
- `client/src/pages/Onboarding.tsx`

**Step 1: Read all 4 files in parallel**

**Step 2: Apply universal checklist to each**

Specific issues to check:
- Login/Register: confirm form state is managed with typed interfaces (not `as any` for form fields)
- ForgotPassword: stub is fine; ensure it shows proper feedback state
- Onboarding: confirm no hardcoded `/dashboard` links that bypass router (per TODO in MEMORY.md)

**Step 3: Run check**
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check
```

**Step 4: Commit**
```bash
git add client/src/pages/Login.tsx client/src/pages/Register.tsx \
  client/src/pages/ForgotPassword.tsx client/src/pages/Onboarding.tsx
git commit -m "refactor: auth + onboarding shell pages — types, constants, clean state"
```

---

### Group B: Core Onboarding Flows

**Files:**
- `client/src/pages/OnboardingFlow.tsx` (1899 lines — MUST split)
- `client/src/pages/OperatorIntake.tsx`
- `client/src/pages/MemberOnboarding.tsx`

**Step 1: Read all 3 files**

**Step 2: Create subdirectory and split OnboardingFlow.tsx**

Create `client/src/pages/onboarding-flow/` with:
- `types.ts` — all interfaces and type literals
- `constants.ts` — STEPS array, copy, config
- `StepRenderer.tsx` — renders the active step
- `CustodyReceiptModal.tsx` — the custody receipt overlay (if not already extracted)
- `index.tsx` — top-level page (re-exports default)

OnboardingFlow.tsx itself should become a thin orchestrator < 200 lines.

**Step 3: Apply universal checklist to OperatorIntake + MemberOnboarding**

**Step 4: Run check**
```bash
pnpm check
```

**Step 5: Commit**
```bash
git add client/src/pages/OnboardingFlow.tsx client/src/pages/onboarding-flow/ \
  client/src/pages/OperatorIntake.tsx client/src/pages/MemberOnboarding.tsx
git commit -m "refactor: split OnboardingFlow into subcomponents, clean OperatorIntake + MemberOnboarding"
```

---

### Group C: Relationships — Critical Refactor

**Files:**
- `client/src/pages/Relationships.tsx` (2541 lines — highest priority split)
- `client/src/pages/Network.tsx`
- `client/src/pages/Matches.tsx`
- `client/src/pages/Intents.tsx`

**Step 1: Read all 4 files**

**Step 2: Split Relationships.tsx**

Create `client/src/pages/relationships/`:
- `types.ts` — `Relationship`, `RelationshipType`, filter types
- `constants.ts` — COLORS, SECTORS, REGIONS, REL_TYPES, VERIFICATION_LEVELS
- `utils.ts` — `formatCurrency()`, `generateFakeHash()`, other pure functions
- `RelationshipCard.tsx` — single relationship card component
- `RelationshipSheet.tsx` — the side-sheet detail view
- `RelationshipFilters.tsx` — search + filter bar
- `CustodyHashDisplay.tsx` — hash display + QR code moment
- `index.tsx` — page orchestrator (< 200 lines)

**Step 3: Apply universal checklist to Network, Matches, Intents**

For Matches.tsx specifically:
- `getStatusStyle` and `getStatusLabel` should be typed with `MatchStatus` literal union
- Remove `as any` from `assetType` in form state

For Intents.tsx:
- Confirm `newIntent.assetType` is `string | undefined` not `undefined as any`

**Step 4: Run check**
```bash
pnpm check
```

**Step 5: Commit**
```bash
git add client/src/pages/Relationships.tsx client/src/pages/relationships/ \
  client/src/pages/Network.tsx client/src/pages/Matches.tsx client/src/pages/Intents.tsx
git commit -m "refactor: split Relationships into subcomponents, clean Network/Matches/Intents"
```

---

### Group D: Deal Flow Pages

**Files:**
- `client/src/pages/Deals.tsx`
- `client/src/pages/DealRooms.tsx`
- `client/src/pages/DealRoom.tsx`
- `client/src/pages/DealMatching.tsx` (1855 lines — must split)
- `client/src/pages/DealFlow.tsx`
- `client/src/pages/deal-room/OverviewTab.tsx`
- `client/src/pages/deal-room/DocumentsTab.tsx`
- `client/src/pages/deal-room/DiligenceTab.tsx`
- `client/src/pages/deal-room/ComplianceTab.tsx`
- `client/src/pages/deal-room/AuditTab.tsx`
- `client/src/pages/deal-room/EscrowTab.tsx`
- `client/src/pages/deal-room/PayoutsTab.tsx`

**Step 1: Read all files**

**Step 2: Split DealMatching.tsx**

Create `client/src/pages/deal-matching/`:
- `types.ts` — match, filter, stage types
- `constants.ts` — DEAL_STAGES, filter options
- `MatchCard.tsx` — single match card
- `MatchFilters.tsx` — filter bar
- `MatchDetailSheet.tsx` — deal match detail panel
- `index.tsx` — page orchestrator (< 150 lines)

**Step 3: Apply universal checklist to Deals.tsx**

Deals.tsx specific:
- `newDeal.dealType` — change `as any` to the actual union type from shared types
- `newParticipant.role` — type as `(typeof PARTICIPANT_ROLES)[number]` not `string`
- `DEAL_STAGES` and `PARTICIPANT_ROLES` already at module top — good, just type them

**Step 4: Apply universal checklist to deal-room tabs**

Each tab: ensure loading skeleton is shown when `isLoading`, and empty state when data is empty array.

**Step 5: Run check**
```bash
pnpm check
```

**Step 6: Commit**
```bash
git add client/src/pages/Deals.tsx client/src/pages/DealRooms.tsx \
  client/src/pages/DealRoom.tsx client/src/pages/DealMatching.tsx \
  client/src/pages/deal-matching/ client/src/pages/DealFlow.tsx \
  client/src/pages/deal-room/
git commit -m "refactor: split DealMatching, clean all deal-flow pages and deal-room tabs"
```

---

### Group E: Dashboard + Intelligence Pages

**Files:**
- `client/src/pages/Dashboard.tsx` (1987 lines — must split)
- `client/src/pages/Intelligence.tsx`
- `client/src/pages/DealIntelligence.tsx`
- `client/src/pages/AIBrain.tsx`
- `client/src/pages/KnowledgeGraphPage.tsx`

**Step 1: Read all files**

**Step 2: Split Dashboard.tsx**

Create `client/src/pages/dashboard/`:
- `types.ts` — `DashCard` props, notification types, market depth types
- `constants.ts` — NOTIFICATION_STYLES, DEFAULT_STYLE, MARKET_DEPTH, PENDING_ACTIONS
- `DashCard.tsx` — reusable dashboard card wrapper
- `TrustScoreWidget.tsx` — trust ring + score display
- `MatchFeedSection.tsx` — match cards feed (demo + live)
- `MarketDepthChart.tsx` — market depth bar chart
- `NotificationsList.tsx` — notifications feed
- `MaybeLink.tsx` — demo-safe link wrapper (if not already standalone)
- `index.tsx` — page orchestrator (< 250 lines)

**Step 3: Apply universal checklist to Intelligence, DealIntelligence, AIBrain, KnowledgeGraphPage**

KnowledgeGraphPage at 1144 lines — split if feasible:
- `client/src/pages/knowledge-graph/GraphCanvas.tsx` — the graph visualization
- `client/src/pages/knowledge-graph/NodePanel.tsx` — selected node detail
- `client/src/pages/knowledge-graph/FilterBar.tsx`
- `client/src/pages/knowledge-graph/index.tsx`

**Step 4: Remove the large comment block in Dashboard.tsx** (lines ~30–40 that describe assumed demoFixtures structure — this is developer scaffolding, not production code)

**Step 5: Run check**
```bash
pnpm check
```

**Step 6: Commit**
```bash
git add client/src/pages/Dashboard.tsx client/src/pages/dashboard/ \
  client/src/pages/Intelligence.tsx client/src/pages/DealIntelligence.tsx \
  client/src/pages/AIBrain.tsx client/src/pages/KnowledgeGraphPage.tsx \
  client/src/pages/knowledge-graph/
git commit -m "refactor: split Dashboard + KnowledgeGraph into subcomponents, clean intelligence pages"
```

---

### Group F: Financial + Compliance Pages

**Files:**
- `client/src/pages/Payouts.tsx`
- `client/src/pages/FeeManagement.tsx`
- `client/src/pages/Analytics.tsx`
- `client/src/pages/Verification.tsx` (1114 lines — must split)
- `client/src/pages/Compliance.tsx`
- `client/src/pages/AuditLogs.tsx`
- `client/src/pages/CapitalManagement.tsx`

**Step 1: Read all files**

**Step 2: Split Verification.tsx**

Create `client/src/pages/verification/`:
- `types.ts` — tier types, dimension keys, verification status
- `constants.ts` — DIMENSIONS_CONFIG, TIER_FEATURES, C (design tokens)
- `TrustRadar.tsx` — the radar/score radar chart component
- `TierTable.tsx` — tier feature comparison table
- `VerificationSteps.tsx` — step-by-step verification progress
- `index.tsx` — page orchestrator (< 200 lines)

**Step 3: Apply universal checklist to remaining pages**

Payouts.tsx specific:
- `PayoutStatus` and `PayoutTypeFilter` types are already defined — good
- Confirm `fmtCurrency` is pure and at module top

Analytics.tsx: check for any hardcoded data arrays — extract to `constants.ts`

**Step 4: Run check**
```bash
pnpm check
```

**Step 5: Commit**
```bash
git add client/src/pages/Payouts.tsx client/src/pages/FeeManagement.tsx \
  client/src/pages/Analytics.tsx client/src/pages/Verification.tsx \
  client/src/pages/verification/ client/src/pages/Compliance.tsx \
  client/src/pages/AuditLogs.tsx client/src/pages/CapitalManagement.tsx
git commit -m "refactor: split Verification, clean financial + compliance pages"
```

---

### Group G: Asset Class + Specialized Pages

**Files:**
- `client/src/pages/RealEstate.tsx`
- `client/src/pages/Commodities.tsx`
- `client/src/pages/CryptoAssets.tsx`
- `client/src/pages/TradingPlatform.tsx`
- `client/src/pages/TransactionMatching.tsx`
- `client/src/pages/FamilyOffices.tsx`
- `client/src/pages/LPPortal.tsx`
- `client/src/pages/SPVGenerator.tsx`
- `client/src/pages/Targeting.tsx`
- `client/src/pages/Calendar.tsx`

**Step 1: Read all files**

**Step 2: Apply universal checklist to each**

RealEstate, Commodities, CryptoAssets, TradingPlatform, TransactionMatching:
- These are "demo/mock" pages per CLAUDE.md — they should have consistent mock-data patterns
- Ensure they use `useDemoFixtures()` or well-typed local constants for mock data
- Ensure they show `EmptyState` when no data (not a blank render)

Calendar.tsx at 859 lines — split if possible:
- Extract event rendering and calendar grid to `client/src/pages/calendar/`

SPVGenerator.tsx at 719 lines — extract form steps to subcomponents

**Step 3: Run check**
```bash
pnpm check
```

**Step 4: Commit**
```bash
git add client/src/pages/RealEstate.tsx client/src/pages/Commodities.tsx \
  client/src/pages/CryptoAssets.tsx client/src/pages/TradingPlatform.tsx \
  client/src/pages/TransactionMatching.tsx client/src/pages/FamilyOffices.tsx \
  client/src/pages/LPPortal.tsx client/src/pages/SPVGenerator.tsx \
  client/src/pages/Targeting.tsx client/src/pages/Calendar.tsx \
  client/src/pages/calendar/
git commit -m "refactor: clean asset class + specialized pages, extract Calendar subcomponents"
```

---

### Group H: New C1/C2 Persona Pages

**Files (all new, persona-surface-based):**
- `client/src/pages/AssetRegister.tsx`
- `client/src/pages/AttributionLedger.tsx`
- `client/src/pages/CloseTracker.tsx`
- `client/src/pages/CounterpartyIntelligence.tsx`
- `client/src/pages/CustodyRegister.tsx`
- `client/src/pages/DemandRoom.tsx`
- `client/src/pages/IntroductionPipeline.tsx`
- `client/src/pages/Portfolio.tsx`

**Step 1: Read all files**

**Step 2: Apply standards to each**

These pages use `PersonaSurface` components (`KpiRibbon`, `ActionCards`, `LiveProofStrip`, etc.) and demo fixtures. Common issues to fix:

- `as unknown as Array<...>` casts — replace with properly typed adapters
- Inline math expressions in JSX (e.g., `{(dr.escrowCurrent / 1e6).toFixed(1)}M`) — extract to named format functions at top of file
- `useLocation` imported but unused (DemandRoom uses `params` from `window.location.search` directly) — if `useLocation` is only used for the `location` dep in `useMemo`, this is a smell; refactor to a custom hook or direct URLSearchParams
- Missing `enabled: !demo` guards on tRPC queries where applicable
- AttributionLedger: `as unknown as Array<{ id: number; amount: number | string; } & Record<string, unknown>>` — define a proper `RawPayout` interface and use it
- Portfolio: same pattern as AttributionLedger — deduplicate the raw→typed payout mapping to a shared util

**Step 3: Extract shared payout mapping utility**

Both AttributionLedger and Portfolio do the same raw payout → typed mapping. Extract to:
`client/src/lib/payoutUtils.ts`:
```typescript
export interface RawPayout extends Record<string, unknown> {
  id: number;
  amount: number | string;
}

export interface MappedPayout {
  id: number;
  deal: string;
  amount: number;
  status: string;
}

export function mapRawPayout(payout: RawPayout): MappedPayout { ... }
```

**Step 4: Run check**
```bash
pnpm check
```

**Step 5: Commit**
```bash
git add client/src/pages/AssetRegister.tsx client/src/pages/AttributionLedger.tsx \
  client/src/pages/CloseTracker.tsx client/src/pages/CounterpartyIntelligence.tsx \
  client/src/pages/CustodyRegister.tsx client/src/pages/DemandRoom.tsx \
  client/src/pages/IntroductionPipeline.tsx client/src/pages/Portfolio.tsx \
  client/src/lib/payoutUtils.ts
git commit -m "refactor: C1/C2 persona pages — typed adapters, shared payoutUtils, clean patterns"
```

---

### Group I: Public + Settings Pages

**Files:**
- `client/src/pages/Home.tsx` (1037 lines)
- `client/src/pages/Demo.tsx` (1322 lines)
- `client/src/pages/Settings.tsx`
- `client/src/pages/Manifesto.tsx`
- `client/src/pages/NotFound.tsx`
- `client/src/pages/ComponentShowcase.tsx` (dev-only)

**Step 1: Read all files**

**Step 2: Split Home.tsx**

Create `client/src/pages/home/`:
- `HeroSection.tsx` — main hero + Enter Demo CTA
- `ProblemsSection.tsx` — problem panels
- `ThreeRolesSection.tsx` — three persona role cards
- `index.tsx` — page assembly (< 100 lines)

**Step 3: Split Demo.tsx**

Create `client/src/pages/demo/`:
- `constants.ts` — all demo content/copy
- `DemoTourWrapper.tsx` — the guided tour logic
- `index.tsx` — page orchestrator

**Step 4: Apply universal checklist to Settings.tsx**

Settings is 555 lines — check if it needs splitting. If form sections are clearly delineated, extract:
- `ProfileSection.tsx`
- `SecuritySection.tsx`
- `NotificationsSection.tsx`

**Step 5: Leave ComponentShowcase as-is** — it's a dev tool, not a production page

**Step 6: Run check**
```bash
pnpm check
```

**Step 7: Commit**
```bash
git add client/src/pages/Home.tsx client/src/pages/home/ \
  client/src/pages/Demo.tsx client/src/pages/demo/ \
  client/src/pages/Settings.tsx client/src/pages/Manifesto.tsx \
  client/src/pages/NotFound.tsx
git commit -m "refactor: split Home + Demo pages, clean Settings/Manifesto/NotFound"
```

---

## Phase 3 — Verification + Deploy

### Task: Final check + test + deploy

**Step 1: TypeScript check**
```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check
```
Expected: 0 errors (pre-existing GuidedTour.tsx `hole` null errors are known — acceptable)

**Step 2: Run tests**
```bash
pnpm test
```
Expected: 37 tests pass

**Step 3: Deploy preview**
```bash
cd /home/ariel/Documents/anavi-main && vercel deploy
```

**Step 4: Inspect preview for visual regressions**
- Check Dashboard, Relationships, DealMatching in preview URL
- Confirm no blank screens or broken imports

**Step 5: Deploy to production**
```bash
vercel --prod
```

**Step 6: Final commit**
```bash
git add -A && git commit -m "chore: final verification — all pages refactored, TS clean, deployed"
```
