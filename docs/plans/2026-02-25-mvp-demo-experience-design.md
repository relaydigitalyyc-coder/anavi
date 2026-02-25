# ANAVI MVP Demo Experience — Design Document
**Date:** 2026-02-25
**Status:** Approved
**Audience:** Dual-purpose — fundraising asset (investor pitch) + enterprise sales asset (family offices, originators, developers)

---

## Vision

The platform must communicate three things simultaneously:
1. The $13 trillion private market has a structural problem that no one has solved
2. ANAVI's architecture is the correct solution — not a feature set, a new primitive
3. The product is real, beautiful, and ready to operate

Every screen, every word, every animation is in service of those three statements. The demo is not a product tour. It is a thesis demonstration.

---

## Core Thesis (Whitepaper Language)

> "If Bloomberg runs public markets, ANAVI will run private ones."

The four problems ANAVI solves:
- **Broker Chain**: 5–15 intermediaries per deal, each extracting 1–5%. Originators — the people whose relationships make deals possible — receive no attribution, no compounding value, no protection.
- **Fraud Epidemic**: $10–$40B annual US investment losses. Identity verification across private markets is fragmented, unshared, and trivially forged.
- **Relationship Leakage**: No cryptographic ownership of introductions. Anyone downstream can claim credit. The originator has no recourse.
- **Due Diligence Bottleneck**: $50K–$500K per deal in duplicated compliance work. Every party runs the same KYC, OFAC screen, and accreditation check independently.

ANAVI's response: **Relationship Custody + Blind Matching + Embedded Deal Infrastructure + Automated Attribution Payouts.**

---

## The Three Roles (Persona Architecture)

All personas map to one of three roles in the private market transaction graph. Labels are fintech-standard; the underlying architecture is whitepaper-derived.

| Tile | Fintech Label | Whitepaper Role | Core Problem |
|------|--------------|-----------------|--------------|
| 1 | Deal Originator / Broker | Relationship Holder | Introductions are stolen. Attribution is theoretical. |
| 2 | Investor / Family Office | Capital Deployer | Deal flow is unverified. Counterparties are unknown. 15 hands touched it first. |
| 3 | Developer / Asset Owner | Capital Seeker | Raising capital means exposing your thesis before the first dollar commits. |

---

## User Journey Architecture

```
/ (Home — scrollytelling)
  ├── Hero: "Custody Your Relationships"
  ├── [NEW] The Problem: Three panels, whitepaper language, data-backed
  ├── [NEW] The Three Roles: Scrollytelling — each role gets a full viewport moment
  │         Each shows: their problem → ANAVI's answer → live UI preview
  ├── How It Works: 4-step core loop (tightened)
  ├── Trust & Security
  ├── [NEW] Enter Demo CTA: promoted, full-width, high-conviction language
  └── Footer

"Enter Demo" → PersonaPicker (fullscreen overlay, no URL change)
  └── One click → DemoShell mounts for selected persona
        ├── DemoContextProvider seeds all tRPC queries with fixture data
        ├── DashboardLayout renders with persona-specific data
        └── GuidedTour auto-starts (7 steps, persona-aware)
              └── Step 7 end screen → "Request Access" / "Continue Exploring"

"Apply for Access" (separate nav CTA) → /onboarding (real account creation flow)
  └── Same visual language as demo — identical POW
  └── Persona selection → tailored step sequence → FVM Celebration moments
```

---

## Landing Page: Scrollytelling Structure

### Section: The Problem (NEW)

Three panels, full-width, dark background. Each panel:
- Large typographic number (the data point)
- One-line headline in display serif
- Two-sentence body in whitepaper language
- Subtle animated visualization

**Panel 1 — The Broker Chain**
> *"5 to 15 intermediaries per deal. Each extracting 1–5%. The originator — the person whose relationship made the deal possible — receives no attribution, no compounding value, and no protection if they're cut out."*

**Panel 2 — The Fraud Epidemic**
> *"$10 to $40 billion in annual US investment fraud losses. Because identity verification across private markets is fragmented, unshared, and trivially forged. Everyone runs their own checks. No one shares the results."*

**Panel 3 — The Due Diligence Bottleneck**
> *"$50,000 to $500,000 per deal in duplicated compliance costs. Every investor in the chain runs the same KYC, the same OFAC screen, the same accreditation check — independently, expensively, and without coordination."*

---

### Section: The Three Roles (NEW)

Full-viewport scrollytelling — each role occupies one scroll step. As the user scrolls, the active panel slides in with the persona's problem, then crossfades to ANAVI's architectural response, then reveals a live UI preview (screenshot/mockup of the relevant dashboard view).

**Role 1 — Deal Originator / Broker**
- Problem: *"You made the introduction. The deal closed. The chain collected. You got nothing."*
- Response: *"ANAVI timestamps your introduction at the moment of custody registration. Cryptographically signed. Immutable. If this relationship produces a deal in three years, this record is your attribution claim."*
- UI Preview: Relationship custody register, showing a timestamped entry with trust score and "Attribution Active" badge

**Role 2 — Investor / Family Office**
- Problem: *"Every deck you receive has already passed through 15 intermediaries. You don't know what's real, who's verified, or what you're actually seeing."*
- Response: *"Blind matching on verified intents. A qualified counterparty exists. Their identity, firm, and terms remain sealed until mutual consent is registered. ANAVI's engine operates on anonymized attributes."*
- UI Preview: Blind match card with trust score visible, identity sealed, "Consent to Reveal" CTA

**Role 3 — Developer / Asset Owner**
- Problem: *"You disclose your project to raise capital. Your competitors find out before the first dollar commits."*
- Response: *"Your raise stays anonymous until you authorize disclosure. NDA-gated deal rooms with immutable audit trails. Escrow-backed milestones. Your operator thesis, protected."*
- UI Preview: Deal room entry screen showing NDA status, audit trail counter, escrow milestone progress

---

## Persona Picker Design

Full-screen overlay. Same void/aurora background as hero. No URL change.

### Layout
Three tiles, horizontal on desktop, stacked on mobile. Each tile:
- Animated icon (Handshake / TrendingUp / Building2)
- Role label in display serif, large
- Problem statement in white/60, one line
- Border: white/10 default → sky-500/50 on hover
- On hover: problem statement crossfades to ANAVI's answer in sky-500/80

### Copy

**Tile 1 — Deal Originator / Broker**
- Label: *"Deal Originator / Broker"*
- Problem: *"My introductions close deals I never get credit for."*
- Answer (hover): *"Custody your relationships. Timestamp your introductions. Collect your attribution."*

**Tile 2 — Investor / Family Office**
- Label: *"Investor / Family Office"*
- Problem: *"I can't tell which deals are real or who's already seen them."*
- Answer (hover): *"Verified counterparties. Blind matching. Mutual consent before any disclosure."*

**Tile 3 — Developer / Asset Owner**
- Label: *"Developer / Asset Owner"*
- Problem: *"Raising capital means exposing my thesis before anyone commits."*
- Answer (hover): *"Anonymous until you consent. NDA-gated rooms. Escrow-backed milestones."*

### Transition
On click: selected tile scales to fill screen, others fade + collapse, screen wipes into DemoShell.

---

## Demo Context Architecture

`DemoContextProvider` wraps the demo shell and intercepts all tRPC queries. Zero API calls. All pages that participate in the demo read from context rather than the network.

```typescript
type DemoPersona = "originator" | "investor" | "developer";

interface DemoContext {
  persona: DemoPersona;
  user: DemoUser;           // trust score, name, tier
  relationships: Relationship[];
  matches: Match[];
  deals: Deal[];
  dealRooms: DealRoom[];
  notifications: Notification[];
  payouts: Payout[];
}
```

### Fixture Data — Originator Persona
- **User**: Trust Score 78, Tier: Enhanced, Name: "Alex Mercer", 4 relationships custodied
- **Relationships**: Ahmad Al-Rashid (Gulf sovereign wealth, custody 14 months), Sarah Chen (Pacific Family Office, $2.1B AUM), Meridian Group (PE, 3 active deals)
- **Matches**: 2 pending — "Qualified buyer for Gulf Coast refinery introduction (EN590, 50,000 MT)", "Investor match for Riyadh Solar JV ($47M, Stage 2)"
- **Notifications**: "Match found: Ahmad Al-Rashid introduction has a qualified counterparty", "Attribution credit: $1.175M origination fee triggered on Riyadh Solar close"
- **Active Deal Room**: Riyadh Solar JV — NDA executed, 3 documents, audit trail 47 events, escrow milestone at 40%

### Fixture Data — Investor Persona
- **User**: Trust Score 91, Tier: Institutional, Name: "Pacific Capital Partners", $340M AUM
- **Matches**: 6 blind matches — Solar infrastructure ($30M+), Gulf Coast commodity play, PropTech Series B, Infrastructure debt
- **Deployed**: $2.1M across 3 SPVs, 18.5% blended IRR
- **Pending**: 2 NDA consents, 1 deal room invitation, capital call notification

### Fixture Data — Developer Persona
- **User**: Trust Score 65, Tier: Basic (upgrade prompt active), Name: "Meridian Renewables"
- **Raise**: $30M Riyadh Solar JV — 3 qualified investor inquiries, anonymous until consent
- **KYB Status**: Verified, OFAC clean, accredited confirmed
- **Deal Room**: Stage 2 entry, escrow milestone $12M of $30M, 2 pending signatures
- **Operator Intake**: Submitted, under manual review

---

## Guided Tour: 7 Steps

Persona-aware. Spotlight overlay dims everything except the targeted element. Each step: headline + insight + progress indicator.

### Step 1 — Trust Score
**Target**: Trust Score ring on dashboard
> *"Your Trust Score is a dynamic credential — built from KYB verification depth, transaction history, dispute resolution outcomes, and peer attestations. It determines your access tier, your whitelist status, and whether counterparties transact with you."*

### Step 2 — Relationship Custody Register
**Target**: Relationships panel / sidebar link
> *(Originator)*: *"This is your custody register. Each entry carries a cryptographic timestamp — immutable proof of when you made this introduction. If this relationship produces a deal in three years, this record is your attribution claim."*
> *(Investor)*: *"Every counterparty here has passed KYB verification, OFAC screening, and accreditation confirmation. You see their trust score before you see their name."*
> *(Developer)*: *"Your relationship register is sealed. Counterparties know a qualified party exists. Nothing is disclosed until mutual consent — and every disclosure is logged."*

### Step 3 — Blind Match
**Target**: First match card in Matches panel
> *"A qualified counterparty has been matched to your intent. Their identity, firm, and terms remain sealed. ANAVI's matching engine operates on anonymized attributes — the platform cannot see unencrypted relationship details until both parties authorize disclosure."*

### Step 4 — Deal Room
**Target**: Active deal room entry
> *"NDA executed. Immutable audit trail initiated. Every document access, version change, and signature event is cryptographically logged. This record is the basis for originator attribution, payout calculation, and regulatory compliance."*

### Step 5 — Attribution & Payout
**Target**: Payout panel or notification
> *(Originator)*: *"Your introduction. $47M Riyadh Solar JV. Originator share: 2.5% — $1.175M — calculated automatically from the closing ledger. Triggered on milestone. No negotiation. No intermediary."*
> *(Investor)*: *"Your capital deployed across 3 verified SPVs. Every subsequent deal from this relationship credits your participation — compounding attribution over time."*
> *(Developer)*: *"Escrow milestone reached: $12M of $30M committed. Funds release triggered automatically. Your operator economics, protected and automated."*

### Step 6 — Compliance Rail
**Target**: Verification badge or compliance indicator
> *"This counterparty's compliance passport — KYB verified, OFAC clean, accredited status confirmed — travels with every transaction they execute on ANAVI. You access their verification record. You don't duplicate it. $500,000 in due diligence costs, shared."*

### Step 7 — Tour End (Full-screen close)
**Background**: Aurora, void, same as hero
**Headline** (display serif, large): *"The Private Market Operating System."*
**Subhead**: *"Every relationship custodied. Every introduction attributed. Every deal closed on infrastructure purpose-built for the $13 trillion private market."*
**Body**: Persona-specific value crystallized:
- *(Originator)*: *"You made 847 introductions last year. ANAVI would have attributed every one."*
- *(Investor)*: *"You reviewed 40 deals. ANAVI would have verified every counterparty before you saw the first deck."*
- *(Developer)*: *"You raised $30M. ANAVI would have protected your thesis until the moment you chose to disclose it."*

**CTAs**:
- Primary: **Request Access** → /onboarding
- Secondary: **Continue Exploring** → dismiss tour, stay in demo

---

## Onboarding Flow: Same POW

The `/onboarding` route (real account creation) must match the demo in visual weight and emotional conviction. The platform is exclusive. The onboarding should feel like being admitted, not filling out a form.

### Principles
- **Every step earns trust**: Each step explains what it unlocks, not what it asks for. Not "Enter your company name" — "Your business profile enables AI-powered matching against $13T in private market deal flow."
- **FVM Celebration moments**: Trigger the celebration component at: identity verified, first relationship custodied, trust score established, first match generated
- **Upgrade prompt is a threshold, not an upsell**: The Tier 2 upgrade moment should feel like crossing into a higher-access environment, not a pricing page

### Custody Receipt Moment
When the user submits their first relationship, the UI should pause — full-screen moment — and render a stylized "Custody Receipt":
- Relationship hash (truncated)
- Timestamp (ISO, precise to millisecond)
- Trust score delta
- Copy: *"This introduction is now custodied. Timestamped. Yours."*

This is the product's core value proposition made tangible. It should feel like receiving a signed document, not a form confirmation.

---

## Pages Participating in Demo Context

These pages must read from `DemoContextProvider` when in demo mode:

| Page | Demo Data Source | Key Demo Moment |
|------|-----------------|-----------------|
| Dashboard | user, notifications, matches summary | Trust Score ring, pending actions |
| Relationships | relationships[] | Custody register, timestamps |
| Matches | matches[] | Blind match cards, consent flow |
| Deal Rooms | dealRooms[] | NDA status, audit trail |
| Payouts | payouts[] | Attribution calculation |
| Compliance | user.kybStatus | Compliance passport |
| Intelligence | hardcoded fixture | Deal extraction preview |

---

## Architectural Constraints

1. **Demo layer is explicitly isolated** — `DemoContextProvider` is the only place fixture data lives. It never touches the real tRPC stack. When auth is reinstated, the provider is simply not mounted for authenticated users.

2. **No URL changes during persona picker** — the persona picker mounts as an overlay. `/` stays `/`. The demo environment mounts under the same URL to keep sharing clean.

3. **Tour state persists in sessionStorage** — if the user navigates away and returns, the tour resumes at the correct step.

4. **All whitepaper language is token-based** — key phrases ("relationship custody", "trust score", "blind matching", "attribution", "compliance passport") should be defined as UI copy constants, not scattered inline strings. This enables consistent language across the entire platform surface.

---

## Success Criteria

**For an investor audience:**
- Within 90 seconds, they understand the problem, the differentiation, and the market size
- The product feels institutional — not a prototype
- The whitepaper thesis is legible in the product, not just the deck

**For an enterprise customer:**
- They self-identify with one of the three personas before they click anything
- The guided tour narrates their specific pain point and ANAVI's answer in their language
- They reach the "Request Access" CTA feeling like they're applying, not signing up

---

*Next step: writing-plans — detailed implementation PRDs for each component.*
