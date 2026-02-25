# ANAVI — UI Update PRD: Wire Backend Features & Modernize Navigation

**Date:** 2026-02-25
**Status:** Ready for implementation
**Scope:** Wire 54 unused backend procedures to UI, reorganize navigation, replace 9 mock-data pages with tRPC, add missing UI surfaces

---

## Problem

The ANAVI backend has 106 tRPC procedures across 22 router domains. Only 52 (49%) are called from the client. 9 pages use exclusively mock/hardcoded data despite having backend counterparts. The sidebar shows only 8 of 37+ app pages, making most features undiscoverable. This PRD addresses every gap.

---

## Priorities

| Tier | Focus | Goal |
|------|-------|------|
| P0 | Sidebar & navigation overhaul | Make all features discoverable |
| P1 | Wire core unused procedures | Complete CRUD loops |
| P2 | Migrate mock-data pages to tRPC | Replace hardcoded data |
| P3 | Surface AI features in UI | Expose 12 AI endpoints |

---

## P0: Sidebar & Navigation Overhaul

### Current sidebar (8 items)
Dashboard, Relationships, Deal Matching, Deal Rooms, Verification, Intelligence, Payouts, Settings

### Proposed sidebar (grouped sections)

```
─── OVERVIEW
  Dashboard
  Analytics

─── DEALS
  Deal Matching
  Deal Rooms
  Deals (pipeline)
  Deal Intelligence

─── NETWORK
  Relationships
  Family Offices
  Targeting
  Network (graph)

─── COMPLIANCE
  Verification
  Audit Logs
  Compliance

─── FINANCE
  Payouts
  LP Portal

─── AI & INTEL
  AI Brain
  Intelligence

─── SETTINGS
  Settings
  Calendar
```

### Implementation

**File:** `anavi/client/src/components/DashboardLayout.tsx`

1. Replace flat `navItems` array with grouped structure:

```typescript
const navSections = [
  { label: "Overview", items: [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ]},
  { label: "Deals", items: [
    { icon: Target, label: "Deal Matching", path: "/deal-matching" },
    { icon: FolderOpen, label: "Deal Rooms", path: "/deal-rooms" },
    { icon: Briefcase, label: "Deals", path: "/deals" },
    { icon: Lightbulb, label: "Deal Intelligence", path: "/deal-intelligence" },
  ]},
  { label: "Network", items: [
    { icon: Users, label: "Relationships", path: "/relationships" },
    { icon: Building2, label: "Family Offices", path: "/family-offices" },
    { icon: Crosshair, label: "Targeting", path: "/targeting" },
    { icon: Network, label: "Network", path: "/network" },
  ]},
  { label: "Compliance", items: [
    { icon: Shield, label: "Verification", path: "/verification" },
    { icon: FileSearch, label: "Audit Logs", path: "/audit-logs" },
    { icon: CheckCircle, label: "Compliance", path: "/compliance" },
  ]},
  { label: "Finance", items: [
    { icon: Wallet, label: "Payouts", path: "/payouts" },
    { icon: PieChart, label: "LP Portal", path: "/lp-portal" },
  ]},
  { label: "AI & Intel", items: [
    { icon: Brain, label: "AI Brain", path: "/ai-brain" },
    { icon: TrendingUp, label: "Intelligence", path: "/intelligence" },
  ]},
  { label: "Settings", items: [
    { icon: CalendarIcon, label: "Calendar", path: "/calendar" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ]},
] as const;
```

2. Update sidebar rendering to show section labels with collapsible groups.
3. Update `mobileNavItems` to show 5 most important: Dashboard, Deal Matching, Relationships, Payouts, Settings.
4. Update `pageTitles` to derive from `navSections`.

**Verification:** All sidebar links navigate to correct pages. Mobile nav shows 5 items. Active state highlights correctly.

---

## P1: Wire Unused Core Procedures to UI

### P1.1 — Relationship Detail & Editing

**Procedures:** `relationship.get`, `relationship.update`, `relationship.grantConsent`

**Page:** `Relationships.tsx` — add slide-out detail panel

| Task | File |
|------|------|
| Add relationship detail slide-out | `pages/Relationships.tsx` |
| Wire `trpc.relationship.get.useQuery(id)` on click | `pages/Relationships.tsx` |
| Add inline edit for notes/status via `trpc.relationship.update.useMutation()` | `pages/Relationships.tsx` |
| Add "Grant Consent" button via `trpc.relationship.grantConsent.useMutation()` | `pages/Relationships.tsx` |

### P1.2 — Contact Management

**Procedures:** `contact.list`, `contact.add`, `contact.getByRelationship`

**UI:** Add "Contacts" tab inside relationship detail panel.

| Task | File |
|------|------|
| Fetch contacts for relationship via `trpc.contact.getByRelationship.useQuery(relId)` | `pages/Relationships.tsx` |
| Add contact form via `trpc.contact.add.useMutation()` | `pages/Relationships.tsx` |

### P1.3 — Deal Detail & Participants

**Procedures:** `deal.get`, `deal.addParticipant`, `deal.getParticipants`

**Page:** `Deals.tsx` — add deal detail slide-out

| Task | File |
|------|------|
| Add deal detail slide-out on card click | `pages/Deals.tsx` |
| Wire `trpc.deal.get.useQuery(id)` for detail | `pages/Deals.tsx` |
| Show participants via `trpc.deal.getParticipants.useQuery(dealId)` | `pages/Deals.tsx` |
| Add participant form via `trpc.deal.addParticipant.useMutation()` | `pages/Deals.tsx` |

### P1.4 — Compliance Checks Viewer

**Procedure:** `compliance.getChecks`

**Page:** `Compliance.tsx`

| Task | File |
|------|------|
| Replace hardcoded `COMPLIANCE_CHECKS` with `trpc.compliance.getChecks.useQuery(entityId)` | `pages/Compliance.tsx` |

### P1.5 — Notification Mark-Read

**Procedure:** `notification.markRead`

**File:** `DashboardLayout.tsx`

| Task | File |
|------|------|
| Add click handler on individual notifications to call `trpc.notification.markRead.useMutation({ id })` | `components/DashboardLayout.tsx` |

### P1.6 — Real Estate CRUD

**Procedures:** `realEstate.get`, `realEstate.create`

**Page:** `RealEstate.tsx`

| Task | File |
|------|------|
| Wire "Add Listing" form to `trpc.realEstate.create.useMutation()` instead of simulated | `pages/RealEstate.tsx` |
| Add property detail view via `trpc.realEstate.get.useQuery(id)` on card click | `pages/RealEstate.tsx` |

### P1.7 — Intent Embedding Recompute

**Procedure:** `intent.recomputeEmbeddings`

**Page:** `Intents.tsx` or `DealMatching.tsx`

| Task | File |
|------|------|
| Add "Recompute Embeddings" admin button that calls `trpc.intent.recomputeEmbeddings.useMutation()` | `pages/DealMatching.tsx` |

### P1.8 — Calendar Full CRUD

**Procedures:** `calendar.connect`, `calendar.disconnect`, `calendar.updateEvent`, `calendar.deleteEvent`, `calendar.createReminder`, `calendar.updateReminder`, `calendar.meetingHistory`

**Page:** `Calendar.tsx`

| Task | File |
|------|------|
| Add "Connect Calendar" button → `trpc.calendar.connect.useMutation()` | `pages/Calendar.tsx` |
| Add disconnect option → `trpc.calendar.disconnect.useMutation()` | `pages/Calendar.tsx` |
| Add inline event editing → `trpc.calendar.updateEvent.useMutation()` | `pages/Calendar.tsx` |
| Add event delete → `trpc.calendar.deleteEvent.useMutation()` | `pages/Calendar.tsx` |
| Add reminder creation → `trpc.calendar.createReminder.useMutation()` | `pages/Calendar.tsx` |
| Add reminder editing → `trpc.calendar.updateReminder.useMutation()` | `pages/Calendar.tsx` |
| Add "Meeting History" tab → `trpc.calendar.meetingHistory.useQuery()` | `pages/Calendar.tsx` |

### P1.9 — Analytics Full Suite

**Procedures:** `analytics.dealAnalytics`, `analytics.funnels`

**Page:** `Analytics.tsx`

| Task | File |
|------|------|
| Add "Deal Analytics" tab → `trpc.analytics.dealAnalytics.useQuery({ period })` | `pages/Analytics.tsx` |
| Add "Conversion Funnels" tab → `trpc.analytics.funnels.useQuery()` | `pages/Analytics.tsx` |
| Replace hardcoded chart data with tRPC-backed data | `pages/Analytics.tsx` |

### P1.10 — Family Office Extended

**Procedures:** `familyOffice.getBySlug`, `familyOffice.search`, `familyOffice.getSocialProfiles`, `familyOffice.addSocialProfile`, `familyOffice.getNews`

**Page:** `FamilyOffices.tsx`

| Task | File |
|------|------|
| Wire search input to `trpc.familyOffice.search.useQuery(query)` (debounced) | `pages/FamilyOffices.tsx` |
| Add "Social Profiles" section in detail panel → `trpc.familyOffice.getSocialProfiles.useQuery(id)` | `pages/FamilyOffices.tsx` |
| Add social profile form → `trpc.familyOffice.addSocialProfile.useMutation()` | `pages/FamilyOffices.tsx` |
| Add "News" tab in detail → `trpc.familyOffice.getNews.useQuery(id)` | `pages/FamilyOffices.tsx` |

### P1.11 — Targeting Full CRUD

**Procedures:** `targeting.get`, `targeting.create`, `targeting.delete`, `targeting.getActivities`

**Page:** `Targeting.tsx`

| Task | File |
|------|------|
| Add "New Target" form → `trpc.targeting.create.useMutation()` | `pages/Targeting.tsx` |
| Add target detail slide-out → `trpc.targeting.get.useQuery(id)` | `pages/Targeting.tsx` |
| Add delete button → `trpc.targeting.delete.useMutation()` | `pages/Targeting.tsx` |
| Show activity log → `trpc.targeting.getActivities.useQuery(targetId)` | `pages/Targeting.tsx` |

---

## P2: Migrate Mock-Data Pages to tRPC

These pages currently use hardcoded arrays. Each needs a backend router + DB backing, then UI wiring.

### P2.1 — OperatorIntake (form → backend)

**Current:** Form fields stored in local state, submission simulated.
**Target:** Wire form submit to new `trpc.operatorIntake.submit.useMutation()`.

| Task | File |
|------|------|
| Create `operatorIntake` router with `submit` mutation | `server/routers/operatorIntake.ts` |
| Add `operator_intakes` table to schema | `drizzle/schema.ts` |
| Wire form onSubmit to tRPC mutation | `pages/OperatorIntake.tsx` |

### P2.2 — SPVGenerator (form → backend)

**Current:** Multi-step wizard stored in local state, creation simulated.
**Target:** Wire to new `trpc.spv.create.useMutation()` and `trpc.spv.list.useQuery()`.

| Task | File |
|------|------|
| Create `spv` router with `create`, `list`, `get` | `server/routers/spv.ts` |
| Add `spvs` table to schema | `drizzle/schema.ts` |
| Wire wizard completion to tRPC | `pages/SPVGenerator.tsx` |
| Add "My SPVs" list section showing previously generated SPVs | `pages/SPVGenerator.tsx` |

### P2.3 — Commodities

**Current:** Hardcoded `commodityListings` array.
**Target:** New `commodity` router + DB table.

| Task | File |
|------|------|
| Create `commodity` router (list, get, create) | `server/routers/commodity.ts` |
| Add `commodity_listings` table | `drizzle/schema.ts` |
| Replace hardcoded data with `trpc.commodity.list.useQuery()` | `pages/Commodities.tsx` |
| Wire "Create Listing" form to `trpc.commodity.create.useMutation()` | `pages/Commodities.tsx` |

### P2.4 — TransactionMatching

**Current:** Hardcoded `transactionMatches` array.
**Target:** Use existing `match` router or create `transactionMatch` router.

| Task | File |
|------|------|
| Create `transactionMatch` router (list, create, updateStatus) | `server/routers/transactionMatch.ts` |
| Replace mock data with tRPC query | `pages/TransactionMatching.tsx` |

### P2.5 — CapitalManagement

**Current:** Hardcoded `spvs`, `capitalCalls`, `commitments`.
**Target:** New `capital` router or extend `spv` router.

| Task | File |
|------|------|
| Create `capital` router (getSpvs, getCapitalCalls, createCapitalCall, getCommitments) | `server/routers/capital.ts` |
| Add `capital_calls`, `commitments` tables | `drizzle/schema.ts` |
| Replace hardcoded data with tRPC | `pages/CapitalManagement.tsx` |

### P2.6 — TradingPlatform

**Current:** Hardcoded portfolio/positions/trades.
**Target:** New `trading` router.

| Task | File |
|------|------|
| Create `trading` router (getPortfolio, getPositions, getRecentTrades) | `server/routers/trading.ts` |
| Replace hardcoded data | `pages/TradingPlatform.tsx` |

### P2.7 — FeeManagement

**Current:** Hardcoded fee stats/structures.
**Target:** New `fee` router.

| Task | File |
|------|------|
| Create `fee` router (getStats, getStructure, list, getPartnerPayouts) | `server/routers/fee.ts` |
| Replace hardcoded data | `pages/FeeManagement.tsx` |

### P2.8 — MemberOnboarding

**Current:** Hardcoded `members` list.
**Target:** New `memberOnboarding` router.

| Task | File |
|------|------|
| Create `memberOnboarding` router (list, getStats, updateStatus) | `server/routers/memberOnboarding.ts` |
| Replace hardcoded data | `pages/MemberOnboarding.tsx` |

### P2.9 — CryptoAssets

**Current:** Hardcoded stablecoin and crypto data.
**Target:** New `cryptoAsset` router.

| Task | File |
|------|------|
| Create `cryptoAsset` router (getPositions, getStablecoinBackings, getTokenizationPipeline) | `server/routers/cryptoAsset.ts` |
| Replace hardcoded data | `pages/CryptoAssets.tsx` |

### P2.10 — DealIntelligence

**Current:** Hardcoded extracted deals and insights.
**Target:** Wire to existing `intelligence` router or extend.

| Task | File |
|------|------|
| Add procedures to `intelligence` router: `getExtractedDeals`, `getNeededConnections`, `getActionItems` | `server/routers/intelligence.ts` |
| Replace hardcoded data | `pages/DealIntelligence.tsx` |

### P2.11 — KnowledgeGraphPage

**Current:** Hardcoded nodes/links/insights.
**Target:** Wire to backend graph data.

| Task | File |
|------|------|
| Add procedures to `intelligence` or new `knowledgeGraph` router: `getGraphData`, `getMeetingInsights` | `server/routers/intelligence.ts` |
| Replace hardcoded data | `pages/KnowledgeGraphPage.tsx` |

---

## P3: Surface AI Features

### P3.1 — AI Brain Enhancements

**Unused procedures:** `ai.analyzeDeal`, `ai.suggestConnections`, `ai.dueDiligence`, `ai.semanticMatch`, `ai.analyzeFamilyOfficeFit`, `ai.generateOutreach`, `ai.claudeAnalyzeDeal`, `ai.recommendIntroduction`, `ai.marketQuery`, `ai.sectorIntelligence`, `ai.assessRisk`, `ai.portfolioRecommendations`

**Page:** `AIBrain.tsx`

| Task | Description |
|------|-------------|
| Add "Quick Actions" toolbar | Buttons for: Analyze Deal, Suggest Connections, Due Diligence, Risk Assessment |
| Wire "Analyze Deal" | Select a deal → `trpc.ai.analyzeDeal.useMutation({ dealId })` → show results in panel |
| Wire "Suggest Connections" | `trpc.ai.suggestConnections.useMutation()` → show suggestions |
| Wire "Due Diligence" | Select entity → `trpc.ai.dueDiligence.useMutation()` → show report |
| Wire "Risk Assessment" | `trpc.ai.assessRisk.useMutation()` → show risk card |
| Add "Outreach Generator" | Select relationship → `trpc.ai.generateOutreach.useMutation()` → copyable text |
| Add "Market Query" input | `trpc.ai.marketQuery.useMutation()` → display insights |
| Add "Sector Intelligence" | `trpc.ai.sectorIntelligence.useMutation({ sector })` → charts |
| Add "Portfolio Recommendations" | `trpc.ai.portfolioRecommendations.useMutation()` → cards |

### P3.2 — Contextual AI in Deal Rooms

**Page:** `DealRoom.tsx`

| Task | Description |
|------|-------------|
| Replace "Coming in Phase 2" placeholder | Wire `trpc.ai.claudeAnalyzeDeal.useMutation()` for AI diligence summary |
| Add "Recommend Introduction" button | `trpc.ai.recommendIntroduction.useMutation()` in participants tab |
| Add "Semantic Match" | `trpc.ai.semanticMatch.useMutation()` to find related deals |

### P3.3 — AI in Family Offices

**Page:** `FamilyOffices.tsx`

| Task | Description |
|------|-------------|
| Add "Analyze Fit" button on office detail | `trpc.ai.analyzeFamilyOfficeFit.useMutation({ officeId })` → compatibility card |

---

## P4: Wire Broker Contact & Enrichment

### P4.1 — Broker Contact Directory

**Router:** `brokerContact` (entirely unused — 7 procedures)

**Action:** Either create a new `BrokerContacts` page or integrate into `Relationships.tsx` as a tab.

| Task | File |
|------|------|
| Create `pages/BrokerContacts.tsx` or add tab to Relationships | New or existing |
| Wire list, create, update, delete, social profiles | Page file |
| Add route in App.tsx + sidebar | `App.tsx`, `DashboardLayout.tsx` |

### P4.2 — Data Enrichment

**Router:** `enrichment` (entirely unused — 2 procedures)

**Action:** Add enrichment controls in Settings or as a utility in Targeting.

| Task | File |
|------|------|
| Add "Enrich" button on Targeting detail that calls `trpc.enrichment.request.useMutation()` | `pages/Targeting.tsx` |
| Add enrichment job list in Settings → `trpc.enrichment.list.useQuery()` | `pages/Settings.tsx` |

---

## Implementation Order

```
Phase 1 (P0): Sidebar overhaul                    → 1 file, ~150 lines
Phase 2 (P1): Wire 54 unused procedures           → 12 pages, ~800 lines
Phase 3 (P2): Migrate 11 mock pages               → 11 pages + 9 routers + schema
Phase 4 (P3): AI features                         → 3 pages, ~400 lines
Phase 5 (P4): Broker contacts + enrichment         → 2 pages, ~200 lines
```

Each phase is independently shippable. Run `pnpm check && pnpm test` after each phase.

---

## File Index

| File | Changes |
|------|---------|
| `client/src/components/DashboardLayout.tsx` | Grouped sidebar, mobile nav, notification mark-read |
| `client/src/pages/Relationships.tsx` | Detail panel, contacts tab, update, consent |
| `client/src/pages/Deals.tsx` | Detail panel, participants |
| `client/src/pages/Compliance.tsx` | Wire getChecks |
| `client/src/pages/RealEstate.tsx` | Wire create, get |
| `client/src/pages/Calendar.tsx` | Full CRUD, meeting history |
| `client/src/pages/Analytics.tsx` | Deal analytics, funnels tabs |
| `client/src/pages/FamilyOffices.tsx` | Search, social profiles, news |
| `client/src/pages/Targeting.tsx` | Create, delete, activities, enrichment |
| `client/src/pages/DealMatching.tsx` | Recompute embeddings button |
| `client/src/pages/AIBrain.tsx` | 12 AI actions |
| `client/src/pages/DealRoom.tsx` | AI diligence, recommend intro |
| `client/src/pages/OperatorIntake.tsx` | Form → tRPC |
| `client/src/pages/SPVGenerator.tsx` | Form → tRPC + list |
| `client/src/pages/Commodities.tsx` | Mock → tRPC |
| `client/src/pages/TransactionMatching.tsx` | Mock → tRPC |
| `client/src/pages/CapitalManagement.tsx` | Mock → tRPC |
| `client/src/pages/TradingPlatform.tsx` | Mock → tRPC |
| `client/src/pages/FeeManagement.tsx` | Mock → tRPC |
| `client/src/pages/MemberOnboarding.tsx` | Mock → tRPC |
| `client/src/pages/CryptoAssets.tsx` | Mock → tRPC |
| `client/src/pages/DealIntelligence.tsx` | Mock → tRPC |
| `client/src/pages/KnowledgeGraphPage.tsx` | Mock → tRPC |
| `server/routers/*.ts` | 9+ new router files |
| `server/routers/index.ts` | Merge new routers |
| `drizzle/schema.ts` | New tables for mock-data pages |
| `App.tsx` | New routes if new pages |
