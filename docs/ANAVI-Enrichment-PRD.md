# ANAVI Demo — Enrichment PRD

**Version:** 1.0  
**Status:** Implemented  
**Scope:** Premium demo experience for $2M commission — tooltips, guided tour, sales assets, animations, UI/UX upgrades.

---

## 1. Objectives

- Make the demo **interactive** via tooltips on every key concept (Trust Score, Attribution, Relationships, etc.).
- Add a **guided demo tour** that walks the commissioner through the value narrative in 5–7 steps.
- Introduce **sales assets** — value callouts, ROI highlights, trust indicators — that reinforce the $2M investment.
- Apply **premium animations** — staggered reveals, number counters, micro-interactions — so the UI feels polished.
- Upgrade **UI/UX** — typography, spacing, hierarchy, premium aesthetic — to match enterprise expectations.

---

## 2. Improvements

### 2.1 Tooltips

| ID | Item | Detail |
|----|------|--------|
| T1 | **Trust Score tooltip** | Wrap Trust Score in Demo with ConceptTooltip using TOOLTIP_CONTENT.trustScore. Add tooltipId for suppression. |
| T2 | **Attribution / Payout tooltips** | ConceptTooltip on "Lifetime Attribution", "Next Payout", "Recent Payouts" using attribution content. |
| T3 | **Relationship custody tooltips** | ConceptTooltip on first relationship card and custody hash display using relationshipCustody. |
| T4 | **Blind Matching tooltip** | ConceptTooltip on AI Matches section header or first match card using blindMatching. |
| T5 | **Demo-specific tooltip content** | Add new TOOLTIP_CONTENT entries for demo-only concepts (e.g. "Deal Room", "Compatibility Score") with sales-focused copy. |

### 2.2 Guided Tour

| ID | Item | Detail |
|----|------|--------|
| G1 | **Wire GuidedTour to Demo** | Render GuidedTour with demoTour when Demo starts. Add data-tour attributes to Demo.tsx elements: dashboard, relationships, match-card, deal-room, payout, apply. |
| G2 | **Demo tour selector mapping** | Map demoTour steps to actual Demo DOM: dashboard (main content area), relationships (sidebar + page), match-card (first match in Matches), deal-room (first Deal Room), payout (Recent Payouts card), apply (Demo banner CTA). |
| G3 | **Skip/restart for demo** | Add "Restart Tour" link in Demo banner or header so commissioner can replay without clearing localStorage. |

### 2.3 Sales Assets

| ID | Item | Detail |
|----|------|--------|
| S1 | **Value proposition banner** | Add optional collapsible "Why ANAVI" strip above or beside Demo content: 3 bullets (e.g. "Relationships as Assets", "Blind Matching", "Automatic Attribution"). Dismissible, premium styling. |
| S2 | **ROI callout on Payouts** | When viewing payouts, show inline callout: "Your relationships generate lifetime value. This $X is just the start." with animated number or highlight. |
| S3 | **Trust tier badge** | Prominent badge near Trust Score: "Tier 2 — Institutional Access" with tooltip explaining tier benefits. |
| S4 | **Match highlight animation** | Subtle pulse or glow on the top compatibility match card to draw attention to the 91% score. |
| S5 | **Persona selector upgrade** | Add one-line value statement under each persona: "See how originators protect $X in relationships" or similar. Refine visuals (subtle gradient, icon animation). |

### 2.4 Animations

| ID | Item | Detail |
|----|------|--------|
| A1 | **Staggered page load** | Apply animate-fade-in + stagger-1..stagger-6 to Dashboard, Relationships, Matches, Deal Rooms content blocks on mount. |
| A2 | **Trust Ring animation** | TrustRing draws in on mount (stroke-dashoffset transition from full to calculated). Already has transition-all; ensure initial state animates. |
| A3 | **Number counter** | For Trust Score, Lifetime Attribution, and key stats: animate from 0 to value on first view (e.g. 300–600ms). |
| A4 | **Card hover micro-interactions** | Consistent hover-lift on all cards (relationships, matches, deal rooms, payouts). Add subtle scale or shadow transition. |
| A5 | **Persona tile selection** | On persona select: smooth checkmark draw, border color transition, optional gentle scale. |
| A6 | **Demo banner CTA** | Subtle pulse or gradient animation on "Apply for Access" to draw attention. |

### 2.5 UI/UX

| ID | Item | Detail |
|----|------|--------|
| U1 | **Typography upgrade** | Use gradient-text or gradient-gold for key headings in Demo. Ensure font-weight and size hierarchy (text-display, text-heading, text-subheading where appropriate). |
| U2 | **Persona selector layout** | Improve spacing, add subtle background pattern or gradient (bg-geometric), ensure "Start Demo" CTA has gold gradient and hover state. |
| U3 | **Sidebar and header polish** | Consistent nav hover states, clear active indicator, optional icon animation on nav change. |
| U4 | **Stats card refinement** | Portfolio Overview, Attribution Summary: improve visual hierarchy, add subtle dividers or icons. |
| U5 | **Empty/placeholder states** | If any demo sections can be empty, use EmptyState with premium styling (not just text). |

---

## 3. Out of Scope (this round)

- Backend or API changes for demo
- Real data or integrations
- Mobile-specific demos or responsive redesign (assume desktop-first for $2M stakeholder demos)
- New pages or routes
- Localization or i18n

---

## 4. Success Criteria

- Commissioner sees tooltips on Trust Score, Attribution, Relationships, and Matches when hovering or clicking the (?) icon.
- Commissioner can complete a guided tour (or skip) within the first 30 seconds of Demo start.
- At least 3 explicit sales/value callouts visible during a typical Demo walkthrough.
- Dashboard and key cards animate in with staggered reveals; Trust Ring and key numbers animate on first view.
- Demo feels noticeably more polished than current state: premium typography, consistent hover states, clear hierarchy.

---

## 5. Files to Touch

- `anavi/client/src/pages/Demo.tsx` — data-tour attributes, GuidedTour, ConceptTooltips, stagger classes, value callouts, persona selector UI
- `anavi/client/src/lib/tooltipContent.ts` — new demo-specific tooltip entries
- `anavi/client/src/lib/tourDefinitions.ts` — adjust demoTour steps/selectors if needed for Demo DOM
- `anavi/client/src/components/ConceptTooltip.tsx` — optional: demo mode that always shows tooltips (no suppression)
- `anavi/client/src/components/GuidedTour.tsx` — optional: "Restart Tour" variant or allow re-trigger when isDemo
- `anavi/client/src/index.css` — optional: new animations (number-count, card-reveal) if needed

---

## 6. Implementation Priority

| Phase | Items | Rationale |
|-------|-------|-----------|
| P1 — High Impact | T1–T4, G1–G2 | Tooltips and tour = immediate interactivity; highest perceived value |
| P2 — Polish | A1–A4, U1–U3 | Animations and typography = premium feel |
| P3 — Sales | S1–S5, G3 | Value callouts and restart = stronger pitch |
| P4 — Refinement | T5, A5–A6, U4–U5 | Edge cases and additional polish |
