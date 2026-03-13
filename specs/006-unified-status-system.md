# Specification: 006-unified-status-system

## Status

PENDING

## Mission Prompt (Ralph Build Loop)

Build a Unified Platform Status System for ANAVI that gives users a single, authoritative view of every status dimension across their account: Trust Score health, Verification tier, Compliance posture, Relationship Custody portfolio, active Matches, Deal pipeline, and Payout queue.

This spec closes the UX gap where status is siloed to individual pages. After completion, users can monitor every critical status signal from one route and from a lightweight sidebar panel.

Use ANAVI-first terminology in all user-facing copy:
- Relationship Custody
- Trust Score
- Blind Matching
- Deal Room
- Attribution
- Intent
- Compliance Posture

## Non-Negotiable Execution Rules

1. No completion claim without evidence (`pnpm check`, `pnpm test`, `pnpm build`).
2. All status data must come from existing tRPC procedures — do NOT duplicate DB queries.
3. No placeholder "coming soon" panels — every panel must show real or demo-mode data.
4. Status changes must be auditable (use `db.logAuditEvent` on any mutations).
5. Keep docs and ops memory synchronized after each substantive pass.

---

## Functional Requirements

### FR-1: Platform Status Aggregation API

**Goal:** Single tRPC procedure that returns all status dimensions for the authenticated user.

**Router:** `server/routers/platformStatus.ts` (new file)
**Procedure:** `platformStatus.getSummary` (protectedProcedure, query)

**Returns:**
```typescript
{
  trustScore: {
    score: number;           // 0–100
    tier: "bronze" | "silver" | "gold" | "platinum";
    trend: "up" | "stable" | "down";
    lastUpdated: Date;
  };
  verification: {
    tier: number;            // 1 | 2
    status: "pending" | "approved" | "rejected";
    pendingDocuments: number;
    expiringDocuments: number;  // expiring within 30 days
  };
  compliance: {
    posture: "clear" | "watchlist" | "flagged" | "blocked";
    openChecks: number;      // checks in "pending" or "flagged" state
    lastChecked: Date | null;
  };
  relationships: {
    total: number;
    custodied: number;       // isBlind: true + consentGiven: false (sealed)
    disclosed: number;       // consentGiven: true
    open: number;            // isBlind: false
  };
  matches: {
    pendingReview: number;   // status: "pending" | "user1_interested"
    mutualInterest: number;  // status: "mutual_interest" | "nda_pending"
    activeRooms: number;     // status: "deal_room_created"
  };
  deals: {
    active: number;          // stage NOT IN ("completed", "cancelled")
    closingThisMonth: number; // stage: "closing"
    completedThisYear: number;
    totalValue: number;
  };
  payouts: {
    pendingApproval: number; // status: "pending"
    processing: number;      // status: "processing"
    totalLifetime: number;   // sum of completed payouts
    nextExpected: Date | null;
  };
  recentActivity: Array<{
    id: number;
    type: "match" | "deal" | "compliance" | "payout" | "verification" | "relationship";
    message: string;
    status: string;
    occurredAt: Date;
  }>;  // Last 10 activity events from auditLog
}
```

**Implementation:** Compose from existing db.* functions — do not write raw SQL.
Call: `db.getRelationships`, `db.getMatches`, `db.getDeals`, `db.getPayouts`, `db.getComplianceChecks`, `db.listAuditEvents`.

**Acceptance Criteria:**
- [ ] `platformStatus.getSummary` returns all seven dimensions without error for authenticated user
- [ ] Demo mode returns seeded demo data consistent with demo persona
- [ ] Response time < 500ms (parallel Promise.all for each dimension)
- [ ] All fields typed and validated via Zod output schema

---

### FR-2: Status Hub Page (`/status`)

**Goal:** Full-page dashboard at `/status` displaying all status dimensions with visual hierarchy.

**Route:** `App.tsx` — `<ShellRoute component={PlatformStatus} />` at path `/status`
**File:** `client/src/pages/PlatformStatus.tsx`

**Layout (desktop, 1280px+):**
```
┌─────────────────────────────────────────────────────────┐
│  PLATFORM STATUS          [Last refreshed 2s ago] [↻]   │
├─────────────┬─────────────┬─────────────┬───────────────┤
│ Trust Score │Verification │ Compliance  │  Relationships │
│  ● 87/100   │  Tier 2 ✓  │  ● Clear    │  14 Custodied │
│  ↑ Trending │  0 Pending  │  0 Flags    │   3 Disclosed  │
└─────────────┴─────────────┴─────────────┴───────────────┘
┌─────────────────────────┬───────────────────────────────┐
│   DEAL PIPELINE         │   PAYOUT QUEUE                │
│   3 Active · 1 Closing  │   $42,500 Pending Approval    │
│   [Lead→Qual→DD→Neg→Cl] │   2 In Processing             │
│   $8.2M total value     │   $184K Lifetime Attribution  │
└─────────────────────────┴───────────────────────────────┘
┌─────────────────────────┬───────────────────────────────┐
│   BLIND MATCHING        │   ACTIVITY FEED               │
│   2 Pending Review      │   · Match mutual interest     │
│   1 Mutual Interest     │   · Deal stage updated        │
│   1 Active Deal Room    │   · Payout approved           │
└─────────────────────────┴───────────────────────────────┘
```

**Mobile layout (375px):** Single column, same cards, compact mode.

**Component structure:**
```
PlatformStatus.tsx
  └── StatusSummaryBar      (Trust + Verification + Compliance + Relationships row)
  └── DealPipelinePanel     (active deals with stage progress bar)
  └── PayoutQueuePanel      (pending/processing/lifetime summary)
  └── MatchStatusPanel      (pending review + mutual interest + rooms)
  └── ActivityFeed          (scrollable last-10 audit events)
```

**Design tokens (must match existing system):**
- Background: `#F3F7FC` (surface)
- Card borders: use `.card-border-gold` (Trust), `.card-border-green` (Verification), `.card-border-blue` (Compliance/Deals)
- Status pulses: use existing `StatusPulse` component from `PersonaSurface.tsx` (green/amber/blue tones)
- Animations: `SmoothReveal` for card entry, `SmoothCounter` for numeric values, `GlowingBorder` on critical alerts
- Badge classes: reuse `.status-active`, `.status-completed`, `.status-nda-pending`, `.status-declined`
- Font: `Plus Jakarta Sans` (sans), `Instrument Serif` (headings)
- Trust Score color scale: green `#059669` (>70), orange (`40–70`), red `#DC2626` (<40)

**Acceptance Criteria:**
- [ ] `/status` route renders without errors for all three personas (originator/investor/principal)
- [ ] All seven status dimensions display with correct data (real or demo-seeded)
- [ ] `SmoothCounter` animates on mount for all numeric values
- [ ] Mobile view (375px) renders correctly — single column, no horizontal overflow
- [ ] Page uses `FadeInView` + `StaggerContainer` for entry animations
- [ ] Loading skeleton shown while query is pending (use `skeleton.tsx` primitive)
- [ ] Error state shown if API fails (use `alert.tsx` primitive)

---

### FR-3: Sidebar Status Indicator

**Goal:** Lightweight status summary widget in `DashboardLayout.tsx` sidebar, visible on all pages.

**Location in sidebar:** Between the `TrustScoreChip` and the nav sections.

**Widget design (collapsed, always visible):**
```
┌─────────────────────────────────┐
│ ● Platform Status               │
│   3 active deals · 2 matches   │
│   Compliance: Clear             │
└─────────────────────────────────┘
```

- The `●` dot uses `StatusPulse` component:
  - Green tone: all clear (no flags, no pending compliance, trust score > 70)
  - Amber tone: attention needed (pending compliance checks, trust < 70)
  - Red is not used in sidebar — redirects to `/status` with alert
- Widget is a clickable link to `/status`
- Widget fetches `platformStatus.getSummary` with `staleTime: 60_000` (1 min cache)

**Acceptance Criteria:**
- [ ] Sidebar widget renders on all ShellRoute pages
- [ ] Pulse tone updates based on real data (green/amber)
- [ ] Clicking widget navigates to `/status`
- [ ] Widget data stale time is 60 seconds (no over-fetching)

---

### FR-4: Status Activity Feed

**Goal:** Scrollable audit-log-backed activity feed on the Status Hub page.

**Data source:** `audit.list` tRPC procedure (existing), filtered to current user's entity events, last 10 events.

**Display format:**
```
[icon] [message]                               [relative time]
  ↳ Match mutual interest confirmed             2 min ago
  ↳ Deal stage updated: Due Diligence           1 hr ago
  ↳ Payout approved: $4,200 originator fee      3 hrs ago
  ↳ Verification document submitted             Yesterday
```

**Icon mapping (reuse `NOTIFICATION_ICONS` from DashboardLayout):**
- `match_found` → cyan `#22D4F5`
- `deal_update` → blue `#2563EB`
- `payout_received` → green `#059669`
- `compliance_alert` → red `#DC2626`
- `system` → gray

**Acceptance Criteria:**
- [ ] Feed shows last 10 audit events for the user
- [ ] Relative timestamps formatted via `date-fns/formatDistanceToNow`
- [ ] Icons use the `NOTIFICATION_ICONS` mapping
- [ ] Feed scrollable if > 5 items (use `scroll-area.tsx`)
- [ ] Empty state shows `EmptyState` component (no activity yet message)

---

### FR-5: Sidebar Navigation Entry

**Goal:** Add "Platform Status" to the sidebar `CORE` nav section.

**Location:** `DashboardLayout.tsx` → `navSections` → CORE section.

**Entry:**
```typescript
{ icon: Activity, label: "Platform Status", path: "/status" }
```

- Import `Activity` from `lucide-react`
- Insert after "Dashboard" in the CORE section

**Acceptance Criteria:**
- [ ] "Platform Status" appears in sidebar CORE section on all personas
- [ ] Active state highlights correctly when on `/status`
- [ ] Icon is `Activity` from lucide-react

---

## UI Component Map

| Component | File | Imports |
|-----------|------|---------|
| `PlatformStatus` | `pages/PlatformStatus.tsx` | trpc, FadeInView, StaggerContainer, SmoothReveal, SmoothCounter, GlowingBorder, Badge, ScrollArea |
| `StatusSummaryBar` | `pages/PlatformStatus.tsx` (inline) | StatusPulse (from PersonaSurface), card-border-* classes |
| `DealPipelinePanel` | `pages/PlatformStatus.tsx` (inline) | Progress from ui/progress, format from date-fns |
| `PayoutQueuePanel` | `pages/PlatformStatus.tsx` (inline) | SmoothCounter, fmtCurrency |
| `MatchStatusPanel` | `pages/PlatformStatus.tsx` (inline) | Badge, status-pill classes |
| `ActivityFeed` | `pages/PlatformStatus.tsx` (inline) | ScrollArea, formatDistanceToNow, NOTIFICATION_ICONS |
| `SidebarStatusWidget` | `DashboardLayout.tsx` (inline) | StatusPulse, Link (wouter) |

---

## Backend File Map

| File | Change |
|------|--------|
| `server/routers/platformStatus.ts` | NEW — aggregation router |
| `server/routers/index.ts` | ADD platformStatus router |
| `server/db/platformStatus.ts` | NEW — parallel db query aggregation |
| `server/db/index.ts` | ADD platformStatus exports |

---

## Test Requirements

### Unit Tests (`anavi/`)

- `platformStatus.getSummary` returns correct shape for mock user
- All seven dimensions present and correctly typed
- Demo mode returns seeded data without DB

### Integration Tests

- `/status` route loads without crash in all three persona contexts
- Sidebar widget renders on `/dashboard` and shows correct pulse tone

---

## Success Criteria

1. Users can see their complete platform status from a single `/status` page
2. Sidebar shows real-time status pulse on every page
3. All numeric values animate in via `SmoothCounter`
4. Mobile view at 375px is fully usable — no overflow
5. `pnpm check` clean, `pnpm test` green, `pnpm build` succeeds

---

## Dependencies

- `server/routers/audit.ts` — `list` procedure (existing)
- `server/routers/deal.ts` — `list` procedure (existing)
- `server/routers/match.ts` — existing procedures
- `server/routers/payout.ts` — existing procedures
- `server/routers/compliance.ts` — `getChecks` procedure (existing)
- `server/routers/relationship.ts` — existing procedures
- `client/src/components/PersonaSurface.tsx` — `StatusPulse` component
- `client/src/components/PremiumAnimations.tsx` — `SmoothReveal`, `SmoothCounter`, `GlowingBorder`
- `client/src/components/PageTransition.tsx` — `FadeInView`, `StaggerContainer`
- `client/src/components/ui/scroll-area.tsx`, `progress.tsx`, `badge.tsx`, `skeleton.tsx`, `alert.tsx`

---

## Completion Signal

### Implementation Checklist

- [ ] `server/routers/platformStatus.ts` — `getSummary` protectedProcedure created
- [ ] `server/db/platformStatus.ts` — parallel aggregation functions created
- [ ] `server/routers/index.ts` — platformStatus merged
- [ ] `server/db/index.ts` — platformStatus exports added
- [ ] `client/src/pages/PlatformStatus.tsx` — full page component with all 5 panels
- [ ] `App.tsx` — `/status` ShellRoute added
- [ ] `DashboardLayout.tsx` — CORE nav entry + sidebar status widget added
- [ ] Unit tests written and passing
- [ ] `pnpm check` — no TypeScript errors
- [ ] `pnpm test` — all tests green
- [ ] `pnpm build` — clean production build

### Iteration Instructions

If ANY check fails:
1. Identify the specific issue
2. Fix the code
3. Run tests again
4. Verify all criteria
5. Commit and push
6. Check again

**Only when ALL checks pass, output:** `<promise>DONE</promise>`
