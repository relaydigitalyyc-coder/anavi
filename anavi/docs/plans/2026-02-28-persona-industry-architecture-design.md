# Persona-Industry Architecture Design
**Date:** 2026-02-28
**Status:** Approved
**Scope:** Three persona-specific dashboards, industry selection layer, persona switching, fully wired demo

---

## 0. Design Decisions & Architectural Insight

Three approaches were evaluated before arriving at this design. The cons of each became load-bearing architectural constraints:

**From Option A (pure view-mode) cons:** Persona is NOT a UI-layer preference. Attribution must be persona-scoped at the data layer. A relationship custodied under the Originator persona carries `originatorId` and `attributionChain` regardless of which persona view is active. Switching to Investor mode never re-frames an originator asset as a counterparty record. Attribution integrity is schema-enforced, not UI-enforced.

**From Option B (full parallel operation) cons:** Dashboard information overload is a design failure condition. The persona switcher is a deep-dive control, not a simultaneous multi-stream view. Each persona's dashboard surfaces only its own signals. Switching is instant and clean. Data from other personas is not hidden — it is not in scope for the active lens.

**From Option C (primary + explore) cons:** Explore mode must be data-backed from day one. It is not a preview or mockup. When a user switches to a secondary persona, their existing account data is re-framed through that lens immediately. No new onboarding. The `enabledPersonas` array on the user schema supports full parallel operation (Option B) as a future unlock — the schema supports it now even though the UI surfaces it incrementally.

**Industry insight:** "Developer" was rejected as the third persona term. It implies construction/infrastructure and excludes commodity sellers, fine art collectors, crypto OTC traders, business owners running M&A exits, and borrowers issuing notes. The third persona is **Principal** — the supply side of any deal, regardless of asset class. Principal holds its meaning whether the asset is a cargo of EN590, a Basquiat, a solar JV, or a Series B.

**Industry layer insight:** Industry cannot be persona-level only (breaks for brokers who operate across real estate, commodities, and fine art simultaneously) nor deal-level only (makes dashboard defaults incoherent). Two layers are required: user-level industry profile (sets defaults, vocabulary, templates) and deal-level asset class (ground truth per transaction, overrides defaults).

---

## 1. Architecture

### 1.1 Schema Layer

**Users table additions:**
```
primaryPersona: enum('originator', 'investor', 'principal')  — set at onboarding
enabledPersonas: JSON array  — starts as [primaryPersona], expands as user activates secondary roles
primaryIndustries: JSON array  — user-level industry profile, set at onboarding
```

**Per-deal/intent asset class** (already exists as `assetClass` on intents, deals, relationships):
No schema change required at deal level — existing `assetClass` field is the ground truth.

**Attribution integrity constraint:**
`originatorId`, `attributionChain`, and `attributionPercentage` on deal participants are persona-scoped to Originator. These fields are never re-interpreted by Investor or Principal views. Schema enforces this through the existing `dealParticipants.role` enum.

### 1.2 Runtime Layer

**`activePersona`** — lives in React context. Set to `primaryPersona` on login. Overridable via persona switcher. Persisted to localStorage between sessions. In demo mode, `DemoContext` holds this value — same contract, same rendering logic.

**`activeIndustry`** — secondary context value. Defaults to first entry in `primaryIndustries`. Overridable via industry context switcher in nav. Per-deal/intent asset class declaration does not change `activeIndustry` — it is deal-scoped, not session-scoped.

**`DemoContext` extension:**
Existing `DemoContext` already holds `activePersona`. Extend to hold `activeIndustry`. All 15 dashboard pages read both values to determine what fixture data to render and which vocabulary to apply.

### 1.3 Nav Layer

`DashboardLayout` reads `activePersona` and `activeIndustry` and renders three layers:

1. **Persona-exclusive modules** (2–3 items, top of nav) — unique to active persona, swap on persona switch
2. **Shared core** (Deal Rooms, Verification, Audit Logs, Settings) — always present, persona-framed vocabulary
3. **Persona switcher** — bottom of sidebar, always visible (see Section 5.2)

### 1.4 Attribution Integrity

The originator persona's custody register and attribution ledger are sovereign data. No other persona view can re-frame, hide, or override these records. When an Originator switches to Investor view, their custody register is not visible in the Investor nav — but it is not deleted or suspended. Switching back to Originator restores full access instantly.

This prevents the attribution blur that a pure view-mode architecture creates: if persona were only a UI layer, a relationship record could theoretically be interpreted as either a custodied introduction (Originator) or a counterparty record (Investor) — with conflicting attribution consequences. By making persona a schema-level attribute on the custody act itself, the record's nature is fixed at creation time.

---

## 2. Originator / Broker Dashboard

**Whitepaper truth:** The originator made the introduction that closed the deal and received nothing. Every surface of this dashboard exists to fix that.

### 2.1 Primary Dashboard Widgets

| Widget | Content | Whitepaper Concept |
|--------|---------|-------------------|
| **Custody Register Summary** | Count of custodied relationships + custody hash timeline. "X introductions timestamped, Y attribution claims active." | Relationship Custody |
| **Attribution Earnings** | Pending attribution (pipeline) + triggered attribution (confirmed payouts) + lifetime attribution counter | Transparent Economics |
| **Active Introductions Feed** | Live status per introduction: sealed → consented → deal room → closed. Custody hash, asset class, stage per row | Attribution Chain |
| **Payout Waterfall** | Visual payout chain per active deal: originator share %, introducer share, platform fee. Next trigger condition | Automated Payouts |
| **Trust Score** | Framed as "Deal Access Tier" — higher trust = access to larger mandates. Upgrade CTA prominent | Verification Tiers |

### 2.2 Exclusive Nav Modules

**Custody Register** (`/custody`)
Full ledger of every custodied relationship. Per entry: contact name or sealed hash, custody timestamp, custody hash (cryptographic proof), asset class, deal status, attribution claim status.
Actions: timestamp new introduction, view proof, grant/revoke consent.
Filtered views: active, pending, attributed, expired.
Industry context: vocabulary adapts — commodity brokers see "cargo introduction," real estate brokers see "property introduction," art brokers see "collector introduction."

**Attribution Ledger** (`/attribution`)
Complete payout history: originator fees, introducer fees (second-degree introductions), follow-on attribution from deals that spawned subsequent transactions.
Key view: lifetime compounding — a deal from 18 months ago generating a follow-on payout today.
Per-entry: deal name, asset class, introduction date, close date, originator share %, payout amount, trigger event.

**Introduction Pipeline** (`/pipeline`)
Kanban: Custodied → Matched → Consented → Deal Room → Closing → Attributed.
Per card: deal size, counterparty trust tier (sealed), originator share %, days in current stage.
Industry context: pipeline stages adapt to asset class (commodity pipeline shows delivery confirmation stage; real estate shows title clearance stage).

### 2.3 Demo Fixtures (Originator Persona)

- **Alex Mercer**, Mercer Capital, Trust Score 78 (Enhanced)
- 4 custodied relationships across Gulf infrastructure and Pacific family office network
- 2 active blind matches: Gulf Coast refinery (EN590, $12M) and Riyadh Solar JV ($47M)
- 1 active deal room: Riyadh Solar JV, diligence stage, 40% escrow, 47 audit events
- Attribution earnings: $1.175M triggered (Riyadh Solar), $240K pending (Gulf Coast)
- Payout waterfall: 2.5% originator share on Riyadh, 2.0% on Gulf Coast

---

## 3. Investor / Family Office Dashboard

**Whitepaper truth:** Too many unverified deals, too many duplicate decks, too many brokers they can't trust. This dashboard shows only verified, non-duplicated deal flow where every counterparty has already passed compliance screening.

### 3.1 Primary Dashboard Widgets

| Widget | Content | Whitepaper Concept |
|--------|---------|-------------------|
| **Deal Flow Intelligence** | "X new blind matches from your active mandates. Y counterparties meet your verification threshold. Z deal rooms require action." Curation over volume | Blind Matching |
| **Deployment Capacity** | Available capital vs. committed vs. deployed. Mandate tracker: which intents are generating matches | Capital Deployment |
| **Counterparty Intelligence Feed** | Verified counterparties ranked by trust score: tier, asset classes, relationship graph depth, compliance passport status | Compliance Rails |
| **Portfolio Performance** | IRR per deal, capital deployed, unrealized vs. realized. Attribution chain per deal (who originated it) | Transparent Economics |
| **Active Deal Rooms** | Stage, escrow progress, document count, last audit event. Urgency indicators for rooms requiring action | Deal Infrastructure |

### 3.2 Exclusive Nav Modules

**Deal Flow** (`/deal-flow`)
Blind match cards ranked by compatibility score. Per card: asset class, deal size range, jurisdiction, counterparty trust tier, originator trust tier. No names or firms until mutual consent.
Actions per card: Express Interest (triggers NDA flow) or Pass.
Filters: asset class, deal size, geography, verification tier minimum.
Secondary tab: mandate manager — configure intent parameters driving matching.
Industry context: commodity investors see lot size, delivery terms, grade specifications; real estate investors see cap rate, NOI, location tier; PE investors see revenue, EBITDA, sector.

**Portfolio** (`/portfolio`)
Full investment portfolio. Per position: SPV name, capital committed, current NAV, IRR, originator attribution (who brought the deal), deal room link, milestone timeline.
Aggregate view: total AUM deployed on ANAVI, blended IRR, vintage year distribution.
Attribution chain shown per deal — investor sees who originated each deal, reinforcing network trust.
Industry context: infrastructure shows MW capacity and energy yield; real estate shows occupancy and cap rate; PE shows revenue multiples.

**Counterparty Intelligence** (`/counterparty-intelligence`)
Compliance passport repository. Per counterparty: KYB status, OFAC clean date, accreditation confirmation, peer review score, completed ANAVI transactions.
Shared compliance records — investor accesses another party's verification without running their own check.
The $500K due diligence cost reduction made visible per counterparty as a saved-cost indicator.

### 3.3 Demo Fixtures (Investor Persona)

- **Pacific Capital Partners**, Trust Score 91 (Institutional), AUM $340M
- 2 sealed counterparty relationships (solar infrastructure + Gulf commodity)
- 4 active blind matches: solar ($47M, 96% compatibility), commodity ($12M, 91%), PropTech Series B ($8M, 84%), infrastructure debt ($20M, 79%)
- 1 active deal room: Solar Infrastructure SPV, closing stage, 65% escrow, 31 audit events
- Portfolio: 2 deployed positions ($2.1M infrastructure alpha, $750K Meridian Real Estate II)
- Blended IRR: 16.8%

---

## 4. Principal Dashboard

**Whitepaper truth:** The asset is the principal's most sensitive possession before a deal closes. Every surface communicates: *your asset is sealed until you choose otherwise.*

**Persona term rationale:** "Developer" was rejected as too narrow. "Principal" holds its meaning across all asset classes — commodity seller, solar developer, fine art collector, M&A exit, OTC crypto trade, debt issuer. In every case, this is the party whose asset is on the table.

### 4.1 Primary Dashboard Widgets

| Widget | Content | Whitepaper Concept |
|--------|---------|-------------------|
| **Asset Register** | Every active asset/raise: title (visible to principal only), asset class badge, deal size or raise target, protection status (sealed/NDA active/disclosed), qualified demand count | Relationship Custody |
| **Demand Pipeline** | Anonymous match cards ranked by trust tier + mandate alignment. Counterparty trust score, deployment mandate size, jurisdiction, compatibility score. Zero identifying info until consent | Blind Matching |
| **Sealed Disclosure Ledger** | Count breakdown: matched (sealed) → NDA executed → deal room active → closed. Ratio of matches to uncontrolled disclosures always visible | Attribution / Audit |
| **Milestone & Escrow Status** | Current milestone, amount in escrow, next trigger condition. Industry-adaptive: commodity = delivery milestones, infrastructure = capital tranches, M&A = regulatory gates | Escrow / Automated Payouts |
| **Trust Score / Tier CTA** | Tier determines which investor/buyer mandates can see the asset. Cost of current tier made concrete per asset class. Upgrade path prominent | Verification Tiers |

### 4.2 Exclusive Nav Modules

**Asset Register** (`/assets`)
Full inventory: active, closed, draft. Per asset: industry type, deal structure (spot sale, equity raise, debt raise, JV, auction), target size, geography, protection status, demand activity.
Asset creation wizard adapts to industry:
- Commodity: specification, grade, lot size, delivery terms, port, incoterms
- Capital raise: project stage, use of funds, minimum ticket, milestone structure, SPV structure
- Real estate: property type, location, asking price, financing structure, title status
- Fine art: artist, provenance, valuation, authentication status, sale structure
- M&A: sector, revenue, EBITDA, deal structure, exclusivity terms

**Demand Room** (`/demand`)
Every qualified counterparty interaction: sealed matches, NDA flows in progress, active deal rooms, closed transactions.
Per counterparty: trust tier, mandate alignment, NDA status, last activity.
Principal controls consent from this page — chooses who gets the NDA, who enters the deal room, who sees asset details.
Immutable log of every consent decision with cryptographic timestamp.

**Close Tracker** (`/close`)
Active deals in late stage: outstanding conditions, regulatory requirements, escrow milestones, compliance sign-offs.
Industry-adaptive closing checklist:
- Commodity: delivery confirmation, inspection certificate, bill of lading, payment release
- Real estate: title search, environmental clearance, survey, funding wire, deed transfer
- Infrastructure raise: SPAC formation, LP sign-off, first capital call, regulatory approval
- M&A: exclusivity agreement, due diligence completion, board approval, regulatory filing, wire

### 4.3 Demo Fixtures (Principal Persona)

- **Meridian Renewables**, Trust Score 65 (Basic), upgrade prompt active
- Active raise: Riyadh Solar JV, $30M target, $12M committed (40%)
- 3 sealed investor matches: institutional allocator (94% compatibility), family office (87%), PE fund (78%)
- 2 sealed relationships pending consent
- 1 active deal room: 3 qualified investors, identities sealed, 47 audit events, 5 documents
- Compliance alert: upgrade to Tier 2 to unlock direct institutional introductions

---

## 5. Shared Core + Persona Switcher + Industry Architecture

### 5.1 Shared Core Pages

All three personas access these pages. Content is identical in structure, persona-framed in vocabulary and CTA emphasis.

| Page | Originator Frame | Investor Frame | Principal Frame |
|------|-----------------|----------------|-----------------|
| **Verification** (`/verification`) | Deal access tier, payout % unlock | Counterparty threshold, mandate eligibility | Investor visibility tier, institutional access |
| **Audit Logs** (`/audit-logs`) | Attribution claim evidence | Due diligence record | Non-disclosure proof |
| **Deal Rooms** (`/deal-rooms`) | Rooms I originated or facilitated | Rooms I'm evaluating as buyer | Rooms I opened for my assets |
| **Settings** (`/settings`) | Persona management, industry profile, notification preferences | Same | Same |

### 5.2 Persona Switcher

Location: bottom of sidebar, always visible.
Three persona tiles: Originator, Investor, Principal.

**States per tile:**
- **Active** — highlighted, current operating lens
- **Unlocked** — user has activated, click to switch instantly (nav re-renders, dashboard re-renders, exclusive modules swap, shared core unchanged, no page reload)
- **Preview** — not yet activated. Clicking opens full-screen persona overview showing what this lens unlocks, with one-click activation. Existing account data immediately re-framed through new lens on activation. No additional onboarding required.
- **Locked** — reserved for future gating (trust tier, subscription tier)

**Data integrity on switch:**
Switching persona never destroys or hides data from other personas. The Originator's custody register is not visible in Investor nav — it is not in scope for that lens. Switching back to Originator restores full access instantly. This is a rendering scope change, not a data change.

Active persona badge appears at top of sidebar next to username at all times.

### 5.3 Industry Selection Architecture

**Layer 1 — User-level industry profile**
Set during onboarding immediately after persona selection. Multi-select from taxonomy. Drives: dashboard vocabulary, match filter presets, deal template availability, compliance rail defaults, widget labeling, asset creation wizard flow.

**Industry taxonomy (extensible):**
- Commodities: Oil & Gas · Metals & Mining · Agricultural · Chemicals · LNG
- Real Estate: Commercial · Residential · Land · Industrial · Mixed-Use
- Infrastructure: Renewable Energy · Utilities · Transport · Telecoms · Water
- Private Equity & M&A: Growth · Buyout · Venture · Distressed · Secondary
- Financial Instruments: Debt · Structured Products · Trade Finance · Bonds
- Fine Art & Collectibles
- Digital Assets & Crypto
- Other / Bespoke

**Layer 2 — Deal-level asset class**
Every intent, asset listing, and deal room carries its own `assetClass` declaration (existing schema field). This is the ground truth per transaction. A commodities broker who occasionally does real estate deals does not change their profile — they declare the asset class when creating the intent. Layer 2 overrides Layer 1 defaults for that specific transaction.

**Industry context switcher:**
Secondary control beneath the persona switcher in the sidebar. Lets the user shift their entire dashboard vocabulary to a different industry when working across multiple sectors in parallel. Clicking "Commodities" when profile is "Real Estate + Commodities" re-frames widget labels, match filters, and CTA vocabulary for commodity context — without changing persona.

**Matching engine interaction:**
Deal-level asset class is the primary filter for all matching. User-level industry profile determines which match results the dashboard surfaces first (preference ordering, not exclusive filtering). A commodity seller whose profile includes real estate will still see real estate matches — they'll just appear lower in the feed unless they switch industry context.

---

## 6. Demo Architecture

### 6.1 Fully Wired Demo Requirement

Every page accessible from the dashboard sidebar must show rich, persona-specific, industry-specific fixture data in demo mode. No empty states. No "no data found" messages. No skeleton loaders that never resolve.

**Pattern for every page:**
```tsx
const demo = useDemoFixtures();
// All tRPC queries disabled in demo mode
const { data: liveData } = trpc.x.useQuery(undefined, { enabled: !demo });
// Fixture data as source of truth in demo
const data = demo?.pageKey ?? liveData ?? [];
```

### 6.2 Pages Requiring Demo Wiring

| Page | Status | Fixture Data Needed |
|------|--------|---------------------|
| Relationships | Has fixtures, not wired | Wire existing |
| Intents | Has fixtures, not wired | Wire existing |
| Matches | Has fixtures, not wired | Wire existing |
| DealRooms | Has fixtures, not wired | Wire existing |
| Payouts | Has fixtures, not wired | Wire existing |
| Deals | No fixtures | Create + wire |
| Verification | No fixtures | Create + wire |
| FamilyOffices | No fixtures | Create + wire |
| CapitalManagement | No fixtures | Create + wire |
| Targeting | No fixtures | Create + wire |
| AuditLogs | No fixtures | Create + wire |
| DealIntelligence | Inline mock (not persona-aware) | Move to fixtures + wire |
| FeeManagement | Inline mock (not persona-aware) | Move to fixtures + wire |
| AIBrain | Inline mock (not persona-aware) | Move to fixtures + wire |
| Analytics | No fixtures | Create + wire |

### 6.3 Persona Switching in Demo

The demo's PersonaPicker (on the landing page) sets the initial `activePersona`. When the user is in the demo and uses the persona switcher in the sidebar, the `DemoContext` switches to that persona's fixture dataset. All three persona fixture sets must be fully populated. Switching persona in demo should feel identical to switching persona in production — instant, complete, no empty states.

---

## 7. Implementation Phases

### Phase 1 — Schema + Runtime Foundation
- Add `primaryPersona`, `enabledPersonas`, `primaryIndustries` to users schema
- Extend `DemoContext` with `activePersona` + `activeIndustry`
- Build `PersonaSwitcher` component
- Build `IndustryContextSwitcher` component
- Update `DashboardLayout` to read `activePersona` and render conditional nav

### Phase 2 — Three Persona Dashboards
- Build Originator dashboard homepage (new widgets)
- Build Investor dashboard homepage (new widgets)
- Build Principal dashboard homepage (new widgets)
- All three persona-exclusive module pages (9 new pages total)

### Phase 3 — Fully Wired Demo
- Extend `demoFixtures.ts` with all missing fixture data (15 pages × 3 personas)
- Wire all 14 unwired pages with `useDemoFixtures()` + `enabled: !demo` pattern
- Move inline mocks (DealIntelligence, FeeManagement, AIBrain) to fixtures

### Phase 4 — Industry Selection
- Onboarding industry selection step (after persona)
- Industry context switcher in nav
- Industry-adaptive vocabulary system (copy tokens per industry)
- Asset creation wizard with industry-adaptive forms
- Extend demo fixtures with industry variants

### Phase 5 — Persona PRDs (detailed feature specs)
- Originator PRD: Custody Register, Attribution Ledger, Introduction Pipeline
- Investor PRD: Deal Flow, Portfolio, Counterparty Intelligence
- Principal PRD: Asset Register, Demand Room, Close Tracker

---

## 8. Key Constraints

1. **Never break attribution** — `originatorId` and `attributionChain` are immutable once set. No persona switch or industry switch can re-assign attribution after a custody act is recorded.
2. **Demo must be indistinguishable from live** — fixture data quality, vocabulary, and visual richness must be production-grade. Demo is the primary sales surface.
3. **Persona switch is instant** — no loading state, no page reload. `activePersona` is a context value, not a route parameter.
4. **Industry adapts vocabulary, not data model** — the underlying data schema is industry-agnostic. Industry context drives rendering labels, templates, and filter defaults — it does not create parallel data structures.
5. **Shared core is truly shared** — Verification, Audit Logs, Deal Rooms, and Settings must render correctly regardless of active persona. They are not duplicated per persona.
