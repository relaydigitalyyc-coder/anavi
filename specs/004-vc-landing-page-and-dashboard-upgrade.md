# Specification: VC-Focused Landing Page & Dashboard Upgrade

## Feature: Venture Capital Audience Optimization

### Overview
Upgrade the ANAVI landing page and investor dashboard to speak directly to Venture Capital firms, family offices, and institutional allocators. The current UI is good but generic — this spec makes ANAVI's value proposition irresistible to VCs by emphasizing deal flow quality, portfolio intelligence, blind matching ROI, and fund-level compliance automation. The aesthetic should feel like Bloomberg Terminal meets Stripe — premium, data-dense, and distinctive.

### User Stories
- As a **VC partner**, I want the landing page to immediately communicate how ANAVI improves my deal flow quality so that I can evaluate whether this platform is worth my time in under 10 seconds.
- As a **family office director**, I want the investor dashboard to show portfolio-level intelligence (deal pipeline, trust scores across counterparties, attribution value) so that I can see immediate value.
- As a **fund operations lead**, I want compliance status and audit readiness visible at a glance so that I trust ANAVI with regulated deal flow.

---

## Functional Requirements

### FR-1: Landing Page — VC-Optimized Hero Copy
Replace or enhance the hero section copy to speak directly to institutional capital deployers.

**Acceptance Criteria:**
- [ ] Hero headline references deal flow, counterparty quality, or blind matching (not generic "custody your relationships")
- [ ] Subheadline includes a specific, credible stat (e.g., "$34B lost annually to inefficient KYC/KYB" or "94% match accuracy")
- [ ] Mobile hero stats strip shows VC-relevant metrics (deal flow volume, match accuracy, compliance coverage)

### FR-2: Landing Page — VC Social Proof Section
Add a dedicated social proof section targeting institutional investors.

**Acceptance Criteria:**
- [ ] At least 3 testimonials that reference VC-specific outcomes (deal flow, due diligence time savings, blind matching wins)
- [ ] Featured pull quote from a credible institutional figure
- [ ] Industry vertical badges include "Venture Capital", "Growth Equity", "Fund of Funds"

### FR-3: Landing Page — Fund-Level Metrics Section
Add a section showing fund-level platform metrics that VCs care about.

**Acceptance Criteria:**
- [ ] Animated counters showing: total deal flow ($), matches completed, average time-to-close, compliance checks automated
- [ ] Each metric has a credible source attribution or "ANAVI Platform" label
- [ ] Section is visually distinct (not a repeat of existing stats section)

### FR-4: Investor Dashboard — Portfolio Intelligence Panel
Enhance the investor dashboard with a portfolio-level overview panel.

**Acceptance Criteria:**
- [ ] Panel shows: active deal pipeline count, total committed capital, weighted trust score across counterparties
- [ ] Pipeline visualization (chart or progress indicators) showing deal stages
- [ ] Panel renders correctly on both desktop and mobile
- [ ] Uses existing tRPC data where available, demo fixtures for the rest

### FR-5: Investor Dashboard — Compliance Readiness Card
Add a compliance readiness summary card to the investor dashboard.

**Acceptance Criteria:**
- [ ] Card shows: number of verified counterparties, pending compliance actions, audit trail completeness %
- [ ] Uses ANAVI's existing compliance check data (trpc.compliance.getChecks)
- [ ] Card has clear "View Compliance Center" CTA linking to /compliance

### FR-6: Typography & Visual Polish
Ensure the VC-facing pages use the established Instrument Serif / Plus Jakarta Sans typography system with the "Private Intelligence Terminal" aesthetic.

**Acceptance Criteria:**
- [ ] All new sections use CSS custom properties (--font-serif, --font-sans, --font-mono) and utility classes (dash-heading, data-label, font-serif, font-data-hud)
- [ ] Dark sections use bg-canvas-deep/bg-canvas-void with proper glass-dark treatments
- [ ] All animations use framer-motion and respect prefers-reduced-motion
- [ ] No hardcoded colors — use design tokens from index.css

---

## Success Criteria

- Landing page immediately communicates VC value prop within 10 seconds
- Investor dashboard shows portfolio intelligence and compliance readiness
- All new sections are mobile-responsive (tested at 375px, 768px, 1024px, 1440px)
- No TypeScript errors (`pnpm check` clean)
- All 67+ tests pass (`pnpm test`)
- Production build succeeds (`pnpm build`)

---

## Dependencies
- Existing landing page sections in `client/src/pages/home/`
- InvestorDashboard at `client/src/pages/dashboard/InvestorDashboard.tsx`
- Design tokens in `client/src/index.css`
- Copy constants in `client/src/lib/copy.ts` (COMPLIANCE_MARKET, KYB_VALUE, PERSONAS)
- Animation components in `components/AwwwardsAnimations.tsx` and `components/PremiumAnimations.tsx`

## Assumptions
- All changes are frontend-only (no new tRPC procedures needed)
- Demo fixtures provide sufficient data for the new panels
- The existing typography system (Instrument Serif + Plus Jakarta Sans) is the target aesthetic

---

## Completion Signal

### Implementation Checklist
- [ ] Landing page hero copy updated for VC audience
- [ ] VC social proof section added or existing one enhanced
- [ ] Fund-level metrics section added
- [ ] Investor dashboard portfolio intelligence panel added
- [ ] Investor dashboard compliance readiness card added
- [ ] All typography and visual polish applied per FR-6

### Testing Requirements

The agent MUST complete ALL before outputting the magic phrase:

#### Code Quality
- [ ] `pnpm check` passes (no TypeScript errors)
- [ ] `pnpm test` passes (67+ tests, all green)
- [ ] `pnpm build` succeeds
- [ ] No lint errors introduced

#### Functional Verification
- [ ] All acceptance criteria verified
- [ ] Edge cases handled (empty data, loading states)
- [ ] Error handling in place

#### Visual Verification
- [ ] Desktop view (1440px+) looks correct
- [ ] Tablet view (768px) looks correct
- [ ] Mobile view (375px) looks correct
- [ ] Design matches existing ANAVI aesthetic (dark theme, serif typography, gold accents)

### Iteration Instructions

If ANY check fails:
1. Identify the specific issue
2. Fix the code
3. Run tests again
4. Verify all criteria
5. Commit and push
6. Check again

**Only when ALL checks pass, output:** `<promise>DONE</promise>`

<!-- NR_OF_TRIES: 0 -->
