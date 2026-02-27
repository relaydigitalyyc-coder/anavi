# ANAVI UI Wiring & Dashboard Upgrade — Design Document

**Date**: 2026-02-27
**Status**: Approved
**Author**: Claude Code (claude-sonnet-4-6)

---

## 1. Problem Statement

The ANAVI platform has 39 routes, 40+ pages, and a growing component surface. The codebase was built in rapid sprints and contains multiple classes of wiring inconsistencies that must be resolved before the platform can be trusted as a demo vehicle or investor-facing product.

More critically: the Dashboard UI does not yet feel like the **"Quiet Operating System That Serious Private Capital Plugs Into"** described in the whitepaper. It feels like a prototype dashboard. The gap between the whitepaper vision and the current UI is the central UX problem this spec addresses.

---

## 2. Vision Benchmark

> *"If Bloomberg runs public markets, ANAVI will run private ones."*

**From the Whitepaper:**
- ANAVI is a **Relationship Operating System** — not a marketplace, not a CRM
- The 6 core modules are: Identity/KYC, Relationship Custody, Blind Matching, Deal Rooms, Compliance/Escrow, Economics/Payouts
- Target users: Family Offices, Institutional Investors, Deal Originators, Asset Owners, Project Developers
- UX principle (from Webaroo spec): **"Simplicity as design principle. Progressive disclosure — advanced features available but not in the way."**
- Visual identity: navy/blue palette, luxury aesthetic, institutional-grade

**The Transformation ANAVI promises:**

| Before ANAVI | After ANAVI |
|---|---|
| 5-15 broker chains per deal | Direct verified counterparty access |
| Manual, costly due diligence | Pre-verified participant network |
| Relationship leakage | Custodied relationships with lifetime attribution |
| Opaque, negotiated fees | Transparent, automated economics |
| High fraud risk | Trust-scored network with blacklist controls |
| One-time transactions | Compounding relationship value |

The UI must *demonstrate* this transformation in every interaction.

---

## 3. Current State Audit

### 3.1 Wiring Issues (Technical)

| Issue | Severity | Description |
|---|---|---|
| Tour selector drift | HIGH | `demoTour` targets `[data-tour="payouts"]`, Dashboard renders `[data-tour="payout"]` |
| Dead tour export | MED | `onboardingTour` export in tourDefinitions.ts is never consumed |
| Two tour systems | MED | `data-tour` (demo GuidedTour) vs `data-tour-id` (live TourOverlay) coexist with overlapping semantics |
| Nav/route gaps | MED | ~8 routes in App.tsx not in navSections sidebar (Intents, Matches, Network, SPVGenerator, Manifesto, etc.) |
| Demo gating gaps | MED | Only Dashboard gates tRPC with `enabled: !demo`; other pages accessible in demo lack gating |
| Fixture shape drift | LOW | demoFixtures.ts shapes may silently diverge from actual tRPC router output |
| TypeScript errors | VARIABLE | Pre-existing 9 errors in GuidedTour.tsx; need to verify no new errors from recent commits |

### 3.2 UX/Vision Gaps (Dashboard)

| Module | Current State | Required State |
|---|---|---|
| Identity/KYC | TrustRing widget exists, tier badge present | Trust Score must be hero element; tier should feel institutional, not decorative |
| Relationship Custody | List with hash/age shown | Timestamp + hash should feel like a legal timestamp receipt, not metadata |
| Blind Matching | Match cards with score | "Sealed" mystery must be visceral — the card should feel like a redacted intelligence brief |
| Deal Rooms | Escrow progress bar | Should feel like a secure deal war room, not a card with a progress bar |
| Compliance/Escrow | Section in sidebar | Verification/compliance should be a first-class status visible from Dashboard |
| Economics Engine | Payouts list | Attribution chain + lifetime value should tell a story, not just show a number |

### 3.3 Navigation Architecture

Current navSections are organized by feature accident, not by the 6-module user journey. The sidebar should guide users from "I just joined" → "I'm closing deals":

**Proposed module-driven hierarchy:**
```
OVERVIEW
  ├── Dashboard
  └── Analytics

TRUST & IDENTITY
  ├── Verification (Trust Score, KYB)
  └── Compliance

RELATIONSHIPS
  ├── My Relationships (Custody)
  ├── Network Graph
  └── Family Offices

DEALS
  ├── Deal Matching (Intents + Matches)
  ├── Deal Rooms
  └── Deal Intelligence

ECONOMICS
  ├── Payouts (Attribution)
  └── LP Portal

INTELLIGENCE
  ├── AI Brain
  └── Intelligence

SETTINGS
  ├── Calendar
  └── Settings
```

---

## 4. Goals

1. **Zero wiring inconsistencies** — all tour selectors resolve, no orphaned routes, no dead code
2. **Demo experience is watertight** — demo mode works identically for all 3 personas; no tRPC calls leak through
3. **Dashboard feels institutional** — the 6-module structure is visually legible; a sophisticated user immediately understands the operating system
4. **Navigation tells the user journey** — sidebar reflects the 6-module progression, not feature-dump
5. **Terminology is whitepaper-aligned** — every label, copy token, and button uses the vocabulary from the whitepaper

---

## 5. Out of Scope

- New tRPC procedures or schema changes
- New pages (beyond upgrading existing ones)
- Mobile responsive design (Phase 2 per Webaroo)
- Backend data model changes
- Authentication or authorization changes

---

## 6. Success Criteria

- [ ] `pnpm check` passes with zero new errors
- [ ] `pnpm test` passes (37 tests, all green)
- [ ] All `targetSelector` strings in tourDefinitions.ts resolve to DOM elements in Dashboard
- [ ] All 3 demo personas produce zero network requests (tRPC queries gated with `enabled: !demo`)
- [ ] Every route in App.tsx either appears in navSections or has a documented reason for exclusion
- [ ] The 6-module structure is visually legible in the Dashboard without explanation
- [ ] All hardcoded labels use whitepaper terminology (trustScore, originatorId, attributionPercentage, attributionChain, isBlind, Relationship Custody, Trust Score, Blind Matching, Deal Room, Originator Share, Lifetime Attribution)

---

## 7. The 10-Agent Gemini Swarm

### Phase 1: Analysis + Patch Agents (Parallel)

| Agent | Domain | Primary Files | Output |
|---|---|---|---|
| Agent 1: Dashboard Intelligence | Dashboard.tsx vs 6-module structure | Dashboard.tsx (687 lines) | Component restructuring spec + JSX patches |
| Agent 2: Navigation Architecture | Route/nav organization | App.tsx, DashboardLayout.tsx navSections | Sidebar reorganization + route wrapper fixes |
| Agent 3: Tour System Integrity | Selector drift + dead code | tourDefinitions.ts, tour/definitions.ts | Selector fixes, dead export removal |
| Agent 4: Demo Data Fidelity | Fixture shapes + persona narrative | demoFixtures.ts, DemoContext.tsx | Shape alignment patches + narrative polish |
| Agent 5: Whitepaper Copy Audit | Terminology drift | lib/copy.ts, all hardcoded labels | Copy token additions + label fixes |
| Agent 6: Page Inventory | All 40+ pages categorization | All client/src/pages/*.tsx | Inventory report: real/demo/orphaned + gaps |
| Agent 7: TypeScript Health | Type errors | pnpm check output + affected files | Type error fixes |
| Agent 8: Onboarding Flow | Value prop alignment | OnboardingFlow.tsx, Onboarding.tsx | Value prop enhancement patches |

### Phase 2: Synthesis Agents (Sequential)

| Agent | Role | Input | Output |
|---|---|---|---|
| Agent 9: Cross-Patch Validator | Conflict detection | All Phase 1 findings | Ordered merge plan with conflict resolutions |
| Agent 10: Dashboard UI Upgrade | Final visual upgrade | Phase 1 findings + whitepaper vision | Upgraded Dashboard.tsx implementing 6-module structure |

### Merge Order
1. TypeScript Health (Agent 7) — clean type baseline
2. Navigation Architecture (Agent 2) — stable route structure
3. Tour System Integrity (Agent 3) — clean selectors
4. Demo Data Fidelity (Agent 4) — clean fixture shapes
5. Whitepaper Copy (Agent 5) — clean terminology
6. Pages (Agent 6 findings) — documented inventory
7. Onboarding Flow (Agent 8) — value prop alignment
8. Dashboard Intelligence + UI Upgrade (Agents 1 + 10) — visual upgrade applied last

---

## 8. Agent Prompt Design Principles

Each agent receives:
1. **Context block**: Relevant file contents (full source)
2. **Vision block**: Whitepaper + Webaroo spec key sections
3. **Scope block**: Exactly what to audit and fix
4. **Output format**: Structured JSON with `findings[]` + `patches[]` (unified diffs or full file replacements)
5. **Constraints**: Do not change files outside scope; do not add features; flag uncertainties

---

## 9. Implementation Plan

See: `docs/plans/2026-02-27-ui-wiring-implementation-plan.md`

---

*Design approved: 2026-02-27*
