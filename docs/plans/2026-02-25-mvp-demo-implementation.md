# ANAVI MVP Demo Experience — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the platform into a dual-purpose fundraising + sales asset by implementing: (1) whitepaper-language copy tokens, (2) landing page scrollytelling with problem panels and three-roles sections, (3) a `DemoContextProvider` that seeds all pages with persona-specific fixture data, (4) a persona picker overlay, (5) an overhauled 7-step persona-aware guided tour with a closing full-screen moment, and (6) onboarding flow upgrades including a custody receipt moment.

**Architecture:** All demo fixture data lives exclusively in a `DemoContextProvider` that intercepts tRPC query results at the React level — zero API calls in demo mode. The persona picker is a fullscreen overlay (no URL change). Whitepaper language is centralized in a copy token file so phrasing is consistent across every surface. The tour is rebuilt on top of the existing `GuidedTour` component and `tourDefinitions.ts` with persona-aware step variants.

**Tech Stack:** React 18, Wouter, Framer Motion, tRPC v11, TanStack Query v5, Tailwind CSS, existing `GuidedTour` component (`client/src/components/GuidedTour.tsx`), existing `FVMCelebration` component, existing `PremiumAnimations` + `AwwwardsAnimations` component libraries.

---

## Dependency Order

```
Task 1 (copy tokens) → Task 2 (landing page) → independent
Task 1 (copy tokens) → Task 3 (demo fixture data)
Task 3 (demo context) → Task 4 (persona picker)
Task 3 (demo context) → Task 5 (guided tour)
Task 1 (copy tokens) → Task 6 (onboarding POW)
```

---

## Task 1: Copy Token System

> Centralise all whitepaper language so every surface speaks consistently.

**Files:**
- Create: `client/src/lib/copy.ts`

**Step 1: Create the file**

```typescript
// client/src/lib/copy.ts
// Single source of truth for all whitepaper-aligned platform language.
// Import from here — never write custody/attribution/trust copy inline.

export const PLATFORM = {
  tagline: "The Private Market Operating System",
  thesis: "If Bloomberg runs public markets, ANAVI will run private ones.",
  market: "$13 trillion private market",
} as const;

export const PROBLEMS = {
  brokerChain: {
    stat: "5–15",
    headline: "Intermediaries Per Deal",
    body: "5 to 15 intermediaries per deal. Each extracting 1–5%. The originator — the person whose relationship made the deal possible — receives no attribution, no compounding value, and no protection if they're cut out.",
  },
  fraud: {
    stat: "$40B",
    headline: "Annual Fraud Losses",
    body: "$10 to $40 billion in annual US investment fraud losses. Because identity verification across private markets is fragmented, unshared, and trivially forged. Everyone runs their own checks. No one shares the results.",
  },
  dueDiligence: {
    stat: "$500K",
    headline: "Duplicated Per Deal",
    body: "$50,000 to $500,000 per deal in duplicated compliance costs. Every investor in the chain runs the same KYC, the same OFAC screen, the same accreditation check — independently, expensively, and without coordination.",
  },
} as const;

export const PERSONAS = {
  originator: {
    label: "Deal Originator / Broker",
    role: "Relationship Holder",
    problem: "My introductions close deals I never get credit for.",
    answer: "Custody your relationships. Timestamp your introductions. Collect your attribution.",
    tourPitch: "You made 847 introductions last year. ANAVI would have attributed every one.",
  },
  investor: {
    label: "Investor / Family Office",
    role: "Capital Deployer",
    problem: "I can't tell which deals are real or who's already seen them.",
    answer: "Verified counterparties. Blind matching. Mutual consent before any disclosure.",
    tourPitch: "You reviewed 40 deals. ANAVI would have verified every counterparty before you saw the first deck.",
  },
  developer: {
    label: "Developer / Asset Owner",
    role: "Capital Seeker",
    problem: "Raising capital means exposing my thesis before anyone commits.",
    answer: "Anonymous until you consent. NDA-gated rooms. Escrow-backed milestones.",
    tourPitch: "You raised $30M. ANAVI would have protected your thesis until the moment you chose to disclose it.",
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

export const TOUR = {
  trustScore: {
    title: "Your Trust Score",
    body: "A dynamic credential built from KYB verification depth, transaction history, dispute resolution outcomes, and peer attestations. It determines your access tier, your whitelist status, and whether counterparties transact with you.",
  },
  relationships: {
    originator: {
      title: "Your Custody Register",
      body: "Each entry carries a cryptographic timestamp — immutable proof of when you made this introduction. If this relationship produces a deal in three years, this record is your attribution claim.",
    },
    investor: {
      title: "Verified Counterparties",
      body: "Every counterparty here has passed KYB verification, OFAC screening, and accreditation confirmation. You see their trust score before you see their name.",
    },
    developer: {
      title: "Your Sealed Register",
      body: "Counterparties know a qualified party exists. Nothing is disclosed until mutual consent — and every disclosure is logged.",
    },
  },
  blindMatch: {
    title: "Blind Match",
    body: "A qualified counterparty has been matched to your intent. Their identity, firm, and terms remain sealed. ANAVI's matching engine operates on anonymized attributes — the platform cannot see unencrypted details until both parties authorize disclosure.",
  },
  dealRoom: {
    title: "Deal Room",
    body: "NDA executed. Immutable audit trail initiated. Every document access, version change, and signature event is cryptographically logged. This record is the basis for originator attribution, payout calculation, and regulatory compliance.",
  },
  attribution: {
    originator: {
      title: "Attribution & Payout",
      body: "Your introduction. $47M Riyadh Solar JV. Originator share: 2.5% — $1.175M — calculated automatically from the closing ledger. Triggered on milestone. No negotiation. No intermediary.",
    },
    investor: {
      title: "Attribution & Payout",
      body: "Your capital deployed across 3 verified SPVs. Every subsequent deal from this relationship credits your participation — compounding attribution over time.",
    },
    developer: {
      title: "Escrow Milestone",
      body: "Milestone reached: $12M of $30M committed. Funds release triggered automatically. Your operator economics, protected and automated.",
    },
  },
  compliance: {
    title: "Compliance Passport",
    body: "This counterparty's compliance passport — KYB verified, OFAC clean, accredited status confirmed — travels with every transaction they execute on ANAVI. You access their verification record. You don't duplicate it. $500,000 in due diligence costs, shared.",
  },
  close: {
    headline: "The Private Market Operating System.",
    subhead: "Every relationship custodied. Every introduction attributed. Every deal closed on infrastructure purpose-built for the $13 trillion private market.",
  },
} as const;

export const CUSTODY_RECEIPT = {
  title: "Introduction Custodied.",
  body: "This introduction is now timestamped, cryptographically signed, and permanently attributed to you. If this relationship produces a deal — today or in five years — this record is your claim.",
  cta: "View Your Custody Register",
} as const;
```

**Step 2: Commit**

```bash
git add client/src/lib/copy.ts
git commit -m "feat: add whitepaper-aligned copy token system"
```

---

## Task 2: Landing Page Restructure

> Add "The Problem" panels and "The Three Roles" scrollytelling section. Promote the Enter Demo CTA.

**Files:**
- Modify: `client/src/pages/Home.tsx`

**Context:** The current `Home.tsx` has these sections in order: Nav → Hero → Marquee → Stats → Features → How It Works → Trust → Social Proof → Testimonials → Enterprise → CTA → Footer. We insert two new sections after Marquee: "The Problem" and "The Three Roles".

**Step 1: Import copy tokens at the top of Home.tsx**

After the existing imports, add:
```typescript
import { PROBLEMS, PERSONAS } from "@/lib/copy";
```

**Step 2: Add "The Problem" section after the Marquee section**

Insert after the closing `</section>` tag of the Marquee section (around line 395):

```tsx
{/* The Problem */}
<section className="py-20 md:py-32 bg-canvas-deep relative overflow-hidden">
  <div className="max-w-7xl mx-auto px-4 md:px-8">
    <SmoothReveal>
      <div className="text-center mb-16 md:mb-24">
        <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4">The Problem</p>
        <h2 className="text-5xl md:text-7xl font-serif">
          <SplitText>Private Markets Are Broken</SplitText>
        </h2>
      </div>
    </SmoothReveal>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {[PROBLEMS.brokerChain, PROBLEMS.fraud, PROBLEMS.dueDiligence].map((p, i) => (
        <SmoothReveal key={i} delay={i * 0.15}>
          <motion.div
            className="glass-dark p-8 md:p-10 relative overflow-hidden group"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="text-6xl md:text-7xl font-serif text-white/10 mb-4 group-hover:text-white/20 transition-colors duration-500"
              style={{ WebkitTextStroke: "1px oklch(0.65 0.19 230 / 0.3)" }}>
              {p.stat}
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">{p.headline}</h3>
            <p className="text-sm text-white/50 leading-relaxed">{p.body}</p>
          </motion.div>
        </SmoothReveal>
      ))}
    </div>
  </div>
</section>
```

**Step 3: Add "The Three Roles" section after The Problem section**

```tsx
{/* The Three Roles */}
<section className="py-20 md:py-40 bg-canvas-mid relative overflow-hidden">
  <LiquidGradient className="opacity-20" />
  <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
    <SmoothReveal>
      <div className="text-center mb-16 md:mb-24">
        <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4">Who It's For</p>
        <h2 className="text-5xl md:text-7xl font-serif">
          <SplitText>Three Roles. One Operating System.</SplitText>
        </h2>
      </div>
    </SmoothReveal>
    <div className="space-y-16 md:space-y-32">
      {(Object.entries(PERSONAS) as [keyof typeof PERSONAS, typeof PERSONAS[keyof typeof PERSONAS]][]).map(([key, p], i) => (
        <SmoothReveal key={key} delay={i * 0.1}>
          <motion.div
            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}
          >
            <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
              <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-3">{p.role}</p>
              <h3 className="text-4xl md:text-5xl font-serif text-white mb-6">{p.label}</h3>
              <p className="text-lg text-white/40 italic mb-6">"{p.problem}"</p>
              <div className="h-px bg-gradient-to-r from-sky-500/50 to-transparent mb-6" />
              <p className="text-base text-white/70 leading-relaxed">{p.answer}</p>
            </div>
            <div className={`glass-dark rounded-xl p-8 border border-white/10 ${i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
              {/* Role-specific UI preview mockup */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#22D4F5] animate-pulse" />
                <span className="text-xs uppercase tracking-widest text-white/40">
                  {key === 'originator' ? 'Custody Register' : key === 'investor' ? 'Blind Match' : 'Deal Room'}
                </span>
              </div>
              {key === 'originator' && (
                <div className="space-y-3">
                  {[
                    { name: "Ahmad Al-Rashid", tag: "Gulf Sovereign Wealth", score: 91, age: "14 months" },
                    { name: "Sarah Chen", tag: "Pacific Family Office", score: 88, age: "8 months" },
                    { name: "Meridian Group", tag: "Private Equity", score: 76, age: "3 months" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <p className="text-sm font-medium text-white">{r.name}</p>
                        <p className="text-xs text-white/40">{r.tag} · Custodied {r.age}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-[#22D4F5]">Trust {r.score}</div>
                        <div className="text-xs text-[#C4972A]">Attribution Active</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {key === 'investor' && (
                <div className="space-y-3">
                  {[
                    { tag: "Solar Infrastructure", size: "$47M", score: 94 },
                    { tag: "Gulf Coast Commodity", size: "$12M", score: 88 },
                    { tag: "PropTech Series B", size: "$8M", score: 82 },
                  ].map((m, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wider text-[#22D4F5]">Match #{i + 1}</span>
                        <span className="text-xs font-mono text-white/40">Identity Sealed</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">{m.tag} · {m.size}</span>
                        <span className="text-xs bg-[#22D4F5]/10 text-[#22D4F5] px-2 py-0.5 rounded">Score {m.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {key === 'developer' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Riyadh Solar JV</span>
                    <span className="text-xs bg-[#059669]/10 text-[#059669] px-2 py-0.5 rounded">NDA Active</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>Raise Progress</span>
                      <span>$12M / $30M</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: "40%" }}
                        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-white/40">3 qualified investors matched · Identity sealed</div>
                  <div className="text-xs text-[#22D4F5]">Audit trail: 47 events · OFAC clean · KYB verified</div>
                </div>
              )}
            </div>
          </motion.div>
        </SmoothReveal>
      ))}
    </div>
  </div>
</section>
```

**Step 4: Upgrade the Enter Demo CTA section**

Find the existing CTA section (around line 783). Replace its headline and subhead:

```tsx
// Replace existing CTA headline:
<h2 className="text-5xl md:text-7xl lg:text-8xl font-serif mb-8 md:mb-12 leading-[0.95]">
  The Private Market<br />
  <GradientText>Operating System.</GradientText>
</h2>
<p className="text-lg md:text-xl text-white/60 mb-12 md:mb-16 max-w-2xl mx-auto leading-relaxed">
  Every relationship custodied. Every introduction attributed. Every deal closed on
  infrastructure purpose-built for the {PLATFORM.market}.
</p>
```

**Step 5: Wire the Enter Demo button to open persona picker**

The persona picker (Task 4) will expose a `useDemoEntry` hook. Import and wire here:

```tsx
// Add to Home.tsx imports (after Task 4 is complete):
import { useDemoEntry } from "@/components/PersonaPicker";

// Replace the Link href="/dashboard" wrapper on Enter Demo buttons with:
<motion.button onClick={() => openDemoEntry()} ...>
  Enter Demo
</motion.button>
```

> Note: Do this wiring step *after* Task 4 is complete. For now, leave the button pointing to `/dashboard` as-is.

**Step 6: Commit**

```bash
git add client/src/pages/Home.tsx client/src/lib/copy.ts
git commit -m "feat: landing page — problem panels + three roles scrollytelling"
```

---

## Task 3: DemoContextProvider + Fixture Data

> Create the isolated demo data layer. All pages in demo mode read from here — zero API calls.

**Files:**
- Create: `client/src/contexts/DemoContext.tsx`
- Create: `client/src/lib/demoFixtures.ts`

**Step 1: Create fixture data file**

```typescript
// client/src/lib/demoFixtures.ts
import type { PersonaKey } from "@/lib/copy";

// These types mirror the tRPC response shapes used by each page.
// Keep them in sync if the real router output types change.

export const DEMO_FIXTURES = {
  originator: {
    user: {
      id: "demo-originator",
      name: "Alex Mercer",
      email: "alex@mercercapital.com",
      trustScore: 78,
      tier: "enhanced" as const,
      kybStatus: "verified" as const,
      onboardingCompleted: true,
      relationshipCount: 4,
    },
    relationships: [
      { id: 1, name: "Ahmad Al-Rashid", company: "Gulf Sovereign Wealth Fund", trustScore: 91, custodyAge: "14 months", attributionStatus: "active", hash: "0x7f3a...c12e", assetClass: "Infrastructure" },
      { id: 2, name: "Sarah Chen", company: "Pacific Family Office", trustScore: 88, custodyAge: "8 months", attributionStatus: "active", hash: "0x2b9d...4f7a", assetClass: "Private Equity" },
      { id: 3, name: "Meridian Group", company: "Private Equity", trustScore: 76, custodyAge: "3 months", attributionStatus: "pending", hash: "0x9e1c...8b3d", assetClass: "Real Estate" },
      { id: 4, name: "Delta Capital", company: "Hedge Fund", trustScore: 62, custodyAge: "1 month", attributionStatus: "pending", hash: "0x4a7f...2e9c", assetClass: "Commodities" },
    ],
    matches: [
      { id: 1, tag: "Qualified buyer for Gulf Coast refinery (EN590, 50,000 MT)", compatibilityScore: 94, sealed: true, assetClass: "Commodities", dealSize: "$12M", status: "pending_consent" },
      { id: 2, tag: "Investor match for Riyadh Solar JV ($47M, Stage 2)", compatibilityScore: 88, sealed: true, assetClass: "Infrastructure", dealSize: "$47M", status: "pending_consent" },
    ],
    dealRooms: [
      { id: 1, name: "Riyadh Solar JV", stage: "diligence", ndaStatus: "executed", escrowProgress: 40, escrowCurrent: 12000000, escrowTarget: 30000000, auditEvents: 47, documentCount: 3, counterparty: "Sealed — Institutional Allocator, Trust 91" },
    ],
    notifications: [
      { id: 1, type: "match_found", message: "Match found: Ahmad Al-Rashid introduction has a qualified counterparty", time: "2 hours ago" },
      { id: 2, type: "payout_received", message: "Attribution credit: $1.175M origination fee triggered on Riyadh Solar close", time: "Yesterday" },
      { id: 3, type: "compliance_alert", message: "KYB verification upgrade available — unlock Tier 3 access", time: "3 days ago" },
    ],
    payouts: [
      { id: 1, deal: "Riyadh Solar JV", amount: 1175000, status: "triggered", originatorShare: 2.5, closingDate: "2026-02-18" },
      { id: 2, deal: "Gulf Coast Refinery", amount: 240000, status: "pending", originatorShare: 2.0, closingDate: null },
    ],
  },

  investor: {
    user: {
      id: "demo-investor",
      name: "Pacific Capital Partners",
      email: "invest@pacificcapital.com",
      trustScore: 91,
      tier: "institutional" as const,
      kybStatus: "verified" as const,
      onboardingCompleted: true,
      aum: "$340M",
    },
    relationships: [
      { id: 1, name: "Verified Operator A", company: "[Sealed — Solar Infrastructure]", trustScore: 88, custodyAge: "Active", attributionStatus: "active", hash: "0x1a2b...3c4d", assetClass: "Infrastructure" },
      { id: 2, name: "Verified Operator B", company: "[Sealed — Gulf Coast Commodity]", trustScore: 82, custodyAge: "Active", attributionStatus: "active", hash: "0x5e6f...7g8h", assetClass: "Commodities" },
    ],
    matches: [
      { id: 1, tag: "Solar Infrastructure — $30M+ raise, Stage 2 ready", compatibilityScore: 96, sealed: true, assetClass: "Infrastructure", dealSize: "$47M", status: "pending_consent" },
      { id: 2, tag: "Gulf Coast Commodity Play — EN590, 50,000 MT", compatibilityScore: 91, sealed: true, assetClass: "Commodities", dealSize: "$12M", status: "pending_consent" },
      { id: 3, tag: "PropTech Series B — Enterprise SaaS", compatibilityScore: 84, sealed: true, assetClass: "Private Equity", dealSize: "$8M", status: "pending_consent" },
      { id: 4, tag: "Infrastructure Debt — 7% yield, 5-year", compatibilityScore: 79, sealed: true, assetClass: "Infrastructure", dealSize: "$20M", status: "pending_consent" },
    ],
    dealRooms: [
      { id: 1, name: "Solar Infrastructure SPV", stage: "closing", ndaStatus: "executed", escrowProgress: 65, escrowCurrent: 2100000, escrowTarget: 3000000, auditEvents: 31, documentCount: 8, counterparty: "Meridian Renewables · Trust 91" },
    ],
    notifications: [
      { id: 1, type: "match_found", message: "4 new blind matches generated from your investment intent", time: "1 hour ago" },
      { id: 2, type: "deal_update", message: "NDA consent required: Solar Infrastructure SPV — deal room ready", time: "4 hours ago" },
      { id: 3, type: "payout_received", message: "Capital call: $450K due — Solar Infrastructure SPV", time: "2 days ago" },
    ],
    payouts: [
      { id: 1, deal: "Infrastructure Alpha SPV", amount: 2100000, status: "deployed", irr: 18.5, vintage: "2025" },
      { id: 2, deal: "Meridian Real Estate II", amount: 750000, status: "deployed", irr: 14.2, vintage: "2025" },
    ],
  },

  developer: {
    user: {
      id: "demo-developer",
      name: "Meridian Renewables",
      email: "raise@meridianrenewables.com",
      trustScore: 65,
      tier: "basic" as const,
      kybStatus: "verified" as const,
      onboardingCompleted: true,
      upgradePromptActive: true,
    },
    relationships: [
      { id: 1, name: "[Sealed — Institutional Allocator]", company: "Identity Protected", trustScore: 91, custodyAge: "Pending consent", attributionStatus: "pending", hash: "0x3f4g...5h6i", assetClass: "Infrastructure" },
      { id: 2, name: "[Sealed — Family Office]", company: "Identity Protected", trustScore: 85, custodyAge: "Pending consent", attributionStatus: "pending", hash: "0x7j8k...9l0m", assetClass: "Infrastructure" },
    ],
    matches: [
      { id: 1, tag: "Institutional Allocator — $100M+ deployment mandate, solar focus", compatibilityScore: 94, sealed: true, assetClass: "Infrastructure", dealSize: "$47M", status: "pending_consent" },
      { id: 2, tag: "Family Office — Direct deal mandate, renewable energy", compatibilityScore: 87, sealed: true, assetClass: "Infrastructure", dealSize: "$30M", status: "pending_consent" },
      { id: 3, tag: "PE Fund — Infrastructure debt + equity hybrid", compatibilityScore: 78, sealed: true, assetClass: "Infrastructure", dealSize: "$15M", status: "pending_consent" },
    ],
    dealRooms: [
      { id: 1, name: "Riyadh Solar JV — $30M Raise", stage: "fundraising", ndaStatus: "executed", escrowProgress: 40, escrowCurrent: 12000000, escrowTarget: 30000000, auditEvents: 47, documentCount: 5, counterparty: "3 qualified investors — identities sealed" },
    ],
    notifications: [
      { id: 1, type: "match_found", message: "3 qualified investors matched to your Riyadh Solar JV raise", time: "30 minutes ago" },
      { id: 2, type: "deal_update", message: "Escrow milestone reached: $12M of $30M committed", time: "Yesterday" },
      { id: 3, type: "compliance_alert", message: "Upgrade to Tier 2 to unlock direct investor introductions", time: "3 days ago" },
    ],
    payouts: [
      { id: 1, deal: "Riyadh Solar JV", amount: 30000000, status: "fundraising", escrowMilestone: 40, nextTrigger: "$18M committed" },
    ],
  },
} as const;

export type DemoFixtures = typeof DEMO_FIXTURES;
```

**Step 2: Create DemoContextProvider**

```tsx
// client/src/contexts/DemoContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import type { PersonaKey } from "@/lib/copy";
import { DEMO_FIXTURES } from "@/lib/demoFixtures";

interface DemoContextValue {
  isDemo: boolean;
  persona: PersonaKey | null;
  fixtures: typeof DEMO_FIXTURES[PersonaKey] | null;
}

const DemoContext = createContext<DemoContextValue>({
  isDemo: false,
  persona: null,
  fixtures: null,
});

export function DemoContextProvider({
  persona,
  children,
}: {
  persona: PersonaKey;
  children: ReactNode;
}) {
  return (
    <DemoContext.Provider
      value={{
        isDemo: true,
        persona,
        fixtures: DEMO_FIXTURES[persona],
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  return useContext(DemoContext);
}

/**
 * Use in pages to get demo-mode data.
 * Returns null when not in demo mode — page should fall through to real tRPC.
 *
 * Example:
 *   const demo = useDemoFixtures();
 *   const { data: relationships } = trpc.relationship.list.useQuery(
 *     undefined, { enabled: !demo }
 *   );
 *   const items = demo?.relationships ?? relationships ?? [];
 */
export function useDemoFixtures() {
  const ctx = useContext(DemoContext);
  return ctx.isDemo ? ctx.fixtures : null;
}
```

**Step 3: Commit**

```bash
git add client/src/contexts/DemoContext.tsx client/src/lib/demoFixtures.ts
git commit -m "feat: DemoContextProvider + persona fixture data layer"
```

---

## Task 4: Persona Picker Overlay

> Fullscreen overlay. One click → persona selected → DemoShell mounts. No URL change.

**Files:**
- Create: `client/src/components/PersonaPicker.tsx`
- Modify: `client/src/App.tsx` (add DemoShell route + overlay state)

**Step 1: Create PersonaPicker component**

```tsx
// client/src/components/PersonaPicker.tsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, TrendingUp, Building2 } from "lucide-react";
import { PERSONAS, type PersonaKey } from "@/lib/copy";
import { DemoContextProvider } from "@/contexts/DemoContext";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import { GuidedTourOverlay } from "@/components/GuidedTourOverlay";
import { AuroraBackground, MorphingBlob } from "@/components/PremiumAnimations";

const ICONS: Record<PersonaKey, React.ComponentType<{ className?: string }>> = {
  originator: Handshake,
  investor: TrendingUp,
  developer: Building2,
};

interface PersonaPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PersonaPicker({ isOpen, onClose }: PersonaPickerProps) {
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSelect = useCallback((persona: PersonaKey) => {
    setIsTransitioning(true);
    setSelectedPersona(persona);
  }, []);

  // If a persona has been selected and transition complete, render demo shell
  if (selectedPersona && !isTransitioning) {
    return (
      <DemoContextProvider persona={selectedPersona}>
        <div className="fixed inset-0 z-50 bg-[#060A12]">
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
          <GuidedTourOverlay persona={selectedPersona} />
        </div>
      </DemoContextProvider>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#060A12] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AuroraBackground className="opacity-30" />
          <MorphingBlob className="w-[600px] h-[600px] -top-[200px] -right-[200px]" color="oklch(0.65 0.19 230 / 0.06)" />
          <MorphingBlob className="w-[400px] h-[400px] bottom-[10%] -left-[100px]" color="oklch(0.55 0.15 160 / 0.05)" />

          <div className="relative z-10 w-full max-w-5xl mx-4">
            <motion.div
              className="text-center mb-12 md:mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4">Enter the Operating System</p>
              <h2 className="text-4xl md:text-6xl font-serif text-white">Who are you in this market?</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {(Object.entries(PERSONAS) as [PersonaKey, typeof PERSONAS[PersonaKey]][]).map(([key, persona], i) => {
                const Icon = ICONS[key];
                return (
                  <motion.button
                    key={key}
                    onClick={() => handleSelect(key)}
                    className="relative group text-left p-8 md:p-10 glass-dark border border-white/10 hover:border-sky-500/50 transition-all duration-300 overflow-hidden"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    whileHover={{ y: -4, boxShadow: "0 20px 60px rgb(0 0 0 / 0.4), 0 0 40px oklch(0.65 0.19 230 / 0.12)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Hover glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <Icon className="w-10 h-10 mb-6 text-white/30 group-hover:text-[#22D4F5] transition-colors duration-300 relative z-10" />

                    <p className="text-xs uppercase tracking-widest text-white/30 mb-2 relative z-10">{persona.role}</p>
                    <h3 className="text-xl md:text-2xl font-serif text-white mb-4 relative z-10">{persona.label}</h3>

                    {/* Problem / Answer crossfade */}
                    <div className="relative min-h-[48px]">
                      <p className="text-sm text-white/50 italic absolute inset-0 group-hover:opacity-0 transition-opacity duration-300">
                        "{persona.problem}"
                      </p>
                      <p className="text-sm text-[#22D4F5]/80 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {persona.answer}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              onClick={onClose}
              className="block mx-auto mt-10 text-xs text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Back to Site
            </motion.button>
          </div>

          {/* Transition flash when persona selected */}
          <AnimatePresence>
            {isTransitioning && (
              <motion.div
                className="absolute inset-0 bg-[#060A12]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onAnimationComplete={() => setIsTransitioning(false)}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for Home.tsx to open the picker
let _open: (() => void) | null = null;

export function useDemoEntry() {
  return useCallback(() => _open?.(), []);
}

export function registerDemoEntryOpener(fn: () => void) {
  _open = fn;
}
```

**Step 2: Mount PersonaPicker in App.tsx**

In `client/src/App.tsx`, add to the `App` component:

```tsx
import { PersonaPicker, registerDemoEntryOpener } from "@/components/PersonaPicker";
import { useState } from "react";

function App() {
  const [pickerOpen, setPickerOpen] = useState(false);
  registerDemoEntryOpener(() => setPickerOpen(true));

  return (
    <ErrorBoundary>
      <CursorGlow />
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <TourProvider>
            <Toaster />
            <Router />
            <PersonaPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
          </TourProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

**Step 3: Wire Enter Demo buttons in Home.tsx**

Now complete Task 2 Step 5 — replace the `Link href="/dashboard"` wrappers on the Enter Demo buttons:

```tsx
import { useDemoEntry } from "@/components/PersonaPicker";

// Inside Home():
const openDemoEntry = useDemoEntry();

// Replace each <Link href="/dashboard"> Enter Demo wrapper:
<motion.button onClick={openDemoEntry} ...>
  <span>Enter Demo</span>
  ...
</motion.button>
```

Do this for all three Enter Demo buttons (hero, nav, CTA section).

**Step 4: Commit**

```bash
git add client/src/components/PersonaPicker.tsx client/src/App.tsx client/src/pages/Home.tsx
git commit -m "feat: persona picker overlay + demo shell wiring"
```

---

## Task 5: Guided Tour Overhaul

> Replace the existing `demoTour` steps with whitepaper-language persona-aware steps. Add full-screen tour close moment.

**Files:**
- Create: `client/src/components/GuidedTourOverlay.tsx`
- Modify: `client/src/lib/tourDefinitions.ts`

**Step 1: Create persona-aware tour step builder**

Add to `client/src/lib/tourDefinitions.ts` (append after existing exports):

```typescript
import type { PersonaKey } from "@/lib/copy";
import { TOUR } from "@/lib/copy";

export function buildDemoTourSteps(persona: PersonaKey): TourStep[] {
  return [
    {
      targetSelector: '[data-tour="trust-score"]',
      title: TOUR.trustScore.title,
      content: TOUR.trustScore.body,
      position: "bottom",
    },
    {
      targetSelector: '[data-tour="relationships"]',
      title: TOUR.relationships[persona].title,
      content: TOUR.relationships[persona].body,
      position: "right",
    },
    {
      targetSelector: '[data-tour="match-card"]',
      title: TOUR.blindMatch.title,
      content: TOUR.blindMatch.body,
      position: "bottom",
    },
    {
      targetSelector: '[data-tour="deal-room"]',
      title: TOUR.dealRoom.title,
      content: TOUR.dealRoom.body,
      position: "top",
      interactive: true,
      actionHint: "Enter the deal room to see the full audit trail.",
    },
    {
      targetSelector: '[data-tour="payout"]',
      title: TOUR.attribution[persona].title,
      content: TOUR.attribution[persona].body,
      position: "top",
    },
    {
      targetSelector: '[data-tour="verification"]',
      title: TOUR.compliance.title,
      content: TOUR.compliance.body,
      position: "right",
    },
    // Step 7 is the full-screen close moment — no targetSelector needed
    {
      targetSelector: '[data-tour="apply"]',
      title: TOUR.close.headline,
      content: TOUR.close.subhead,
      position: "bottom",
    },
  ];
}
```

**Step 2: Create GuidedTourOverlay component**

This wraps the existing `GuidedTour` component and adds the full-screen closing moment:

```tsx
// client/src/components/GuidedTourOverlay.tsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GuidedTour, isTourCompleted } from "@/components/GuidedTour";
import { buildDemoTourSteps } from "@/lib/tourDefinitions";
import { TOUR, PERSONAS, type PersonaKey } from "@/lib/copy";
import { AuroraBackground } from "@/components/PremiumAnimations";
import { Link } from "wouter";

interface GuidedTourOverlayProps {
  persona: PersonaKey;
}

export function GuidedTourOverlay({ persona }: GuidedTourOverlayProps) {
  const tourId = `demo-${persona}`;
  const [showClose, setShowClose] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(
    isTourCompleted(tourId)
  );

  const handleComplete = useCallback(() => setShowClose(true), []);
  const handleSkip = useCallback(() => setTourDismissed(true), []);

  if (tourDismissed && !showClose) return null;

  const steps = buildDemoTourSteps(persona);
  const personaCopy = PERSONAS[persona];

  return (
    <>
      {!tourDismissed && (
        <GuidedTour
          tourId={tourId}
          steps={steps}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}

      {/* Full-screen tour close moment */}
      <AnimatePresence>
        {showClose && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#060A12] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <AuroraBackground className="opacity-40" />
            <div className="relative z-10 text-center max-w-3xl mx-4">
              <motion.p
                className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {personaCopy.role}
              </motion.p>
              <motion.h2
                className="text-5xl md:text-7xl font-serif text-white mb-8 leading-[0.95]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {TOUR.close.headline}
              </motion.h2>
              <motion.p
                className="text-lg md:text-xl text-white/60 mb-6 leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {TOUR.close.subhead}
              </motion.p>
              <motion.p
                className="text-base text-[#22D4F5]/80 italic mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {personaCopy.tourPitch}
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <Link href="/onboarding">
                  <motion.button
                    className="bg-[#C4972A] text-[#060A12] px-10 py-4 text-sm font-semibold uppercase tracking-widest"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Request Access
                  </motion.button>
                </Link>
                <motion.button
                  onClick={() => setShowClose(false)}
                  className="text-sm text-white/40 hover:text-white/70 uppercase tracking-widest transition-colors"
                >
                  Continue Exploring
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

**Step 3: Commit**

```bash
git add client/src/components/GuidedTourOverlay.tsx client/src/lib/tourDefinitions.ts
git commit -m "feat: persona-aware guided tour with whitepaper copy + full-screen close moment"
```

---

## Task 6: Onboarding Flow POW — Custody Receipt Moment

> Match the visual weight of the demo. Add a custody receipt moment. Upgrade copy to whitepaper language.

**Files:**
- Create: `client/src/components/CustodyReceipt.tsx`
- Modify: `client/src/pages/OnboardingFlow.tsx`

**Step 1: Create CustodyReceipt component**

```tsx
// client/src/components/CustodyReceipt.tsx
import { motion } from "framer-motion";
import { Shield, Clock } from "lucide-react";
import { CUSTODY_RECEIPT } from "@/lib/copy";

interface CustodyReceiptProps {
  relationshipName: string;
  timestamp: string;
  hash: string;
  trustDelta: number;
  onContinue: () => void;
}

export function CustodyReceipt({ relationshipName, timestamp, hash, trustDelta, onContinue }: CustodyReceiptProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#060A12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "oklch(0.65 0.19 230 / 0.08)", filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 max-w-lg w-full mx-4">
        <motion.div
          className="glass-dark rounded-2xl p-10 border border-sky-500/30 text-center"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* Icon */}
          <motion.div
            className="w-20 h-20 rounded-full border border-sky-500/40 bg-sky-500/10 flex items-center justify-center mx-auto mb-8"
            animate={{ boxShadow: ["0 0 20px oklch(0.65 0.19 230 / 0.15)", "0 0 50px oklch(0.65 0.19 230 / 0.3)", "0 0 20px oklch(0.65 0.19 230 / 0.15)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-10 h-10 text-sky-500" />
          </motion.div>

          <motion.h2
            className="text-3xl font-serif text-white mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {CUSTODY_RECEIPT.title}
          </motion.h2>

          <motion.p
            className="text-sm text-white/60 mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {CUSTODY_RECEIPT.body}
          </motion.p>

          {/* Receipt details */}
          <motion.div
            className="bg-white/5 rounded-lg p-5 mb-8 text-left space-y-3 border border-white/10 font-mono text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex justify-between">
              <span className="text-white/40 uppercase tracking-wider">Relationship</span>
              <span className="text-white">{relationshipName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3 h-3" /> Timestamp</span>
              <span className="text-[#22D4F5]">{timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 uppercase tracking-wider">Custody Hash</span>
              <span className="text-white/70">{hash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 uppercase tracking-wider">Trust Delta</span>
              <span className="text-[#059669]">+{trustDelta} pts</span>
            </div>
          </motion.div>

          <motion.button
            onClick={onContinue}
            className="w-full py-4 bg-[#C4972A] text-[#060A12] font-semibold text-sm uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
          >
            {CUSTODY_RECEIPT.cta}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
```

**Step 2: Integrate CustodyReceipt into OnboardingFlow**

In `client/src/pages/OnboardingFlow.tsx`, find the step that handles "First Relationship" submission (originator persona) and the profile completion steps for other personas. After a successful submission, trigger the receipt:

```tsx
import { CustodyReceipt } from "@/components/CustodyReceipt";
import { AnimatePresence } from "framer-motion";

// Add state near the top of OnboardingFlow:
const [custodyReceipt, setCustodyReceipt] = useState<{
  relationshipName: string;
  timestamp: string;
  hash: string;
  trustDelta: number;
} | null>(null);

// When a relationship is submitted successfully, show the receipt:
const handleRelationshipSubmit = (name: string) => {
  setCustodyReceipt({
    relationshipName: name,
    timestamp: new Date().toISOString(),
    hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    trustDelta: 12,
  });
};

// In the JSX, wrap at component root level:
<AnimatePresence>
  {custodyReceipt && (
    <CustodyReceipt
      {...custodyReceipt}
      onContinue={() => {
        setCustodyReceipt(null);
        advanceStep(); // call whatever function moves to next step
      }}
    />
  )}
</AnimatePresence>
```

**Step 3: Update onboarding step copy to whitepaper language**

In `client/src/pages/OnboardingFlow.tsx`, replace the `benefit` strings in the `STEPS` constant using the copy tokens. Examples:

```typescript
// originator steps — replace benefit strings:
{ name: "Identity", minutes: 3, benefit: "Establishes your timestamp authority — the cryptographic foundation of your relationship custody claims." },
{ name: "Business Profile", minutes: 2, benefit: "Your deal profile enables AI matching against $13T in private market deal flow." },
{ name: "First Relationship", minutes: 3, benefit: "Upload your first relationship. Receive a custody receipt — your timestamped, signed attribution claim." },
{ name: "Upgrade Prompt", minutes: 2, benefit: "Tier 2 unlocks whitelist status: enhanced verification, priority matching, and institutional counterparty access." },
{ name: "Dashboard Intro", minutes: 1, benefit: "Your operating system is ready. Every introduction you make from here is custodied." },

// investor steps:
{ name: "Investment Profile", minutes: 4, benefit: "Defines your investment thesis. ANAVI's matching engine runs on this intent — anonymized, sealed, and matched against verified counterparties only." },
{ name: "KYB / KYC", minutes: 4, benefit: "Your compliance passport. It travels with every deal you touch — so counterparties never have to run their own check on you." },

// developer steps:
{ name: "Project Profile", minutes: 4, benefit: "Your raise profile, sealed. Matched to qualified capital without disclosing your identity until you consent." },
```

**Step 4: Commit**

```bash
git add client/src/components/CustodyReceipt.tsx client/src/pages/OnboardingFlow.tsx
git commit -m "feat: custody receipt moment + onboarding whitepaper copy upgrade"
```

---

## Task 7: Wire Demo Context into Dashboard

> Make the Dashboard actually read from DemoContextProvider when in demo mode.

**Files:**
- Modify: `client/src/pages/Dashboard.tsx`

**Step 1: Import and use demo fixtures**

At the top of `Dashboard.tsx`, add:

```tsx
import { useDemoFixtures } from "@/contexts/DemoContext";
```

Inside the `Dashboard` component, add near the top:

```tsx
const demo = useDemoFixtures();
```

**Step 2: Use demo data for notifications query**

Find the notification query (e.g. `trpc.notification.list.useQuery(...)`) and replace with:

```tsx
const { data: liveNotifications } = trpc.notification.list.useQuery(undefined, {
  enabled: !demo,
});
const notifications = demo?.notifications ?? liveNotifications ?? [];
```

**Step 3: Use demo data for user trust score**

Find the `trpc.auth.me.useQuery` or `useAuth()` call. Augment:

```tsx
const { user: liveUser } = useAuth();
const user = demo ? demo.user : liveUser;
const trustScore = user?.trustScore ?? 0;
```

**Step 4: Use demo data for matches summary**

```tsx
const { data: liveMatches } = trpc.match.list.useQuery(undefined, { enabled: !demo });
const matches = demo?.matches ?? liveMatches ?? [];
```

**Step 5: Ensure `data-tour` attributes are present**

The tour targets these selectors — verify they exist in the Dashboard JSX:
- `data-tour="trust-score"` — on the TrustRing container
- `data-tour="relationships"` — on the relationships panel/link
- `data-tour="match-card"` — on the first match card
- `data-tour="payout"` — on the payout panel
- `data-tour="apply"` — on a CTA button (add if missing: a subtle "Request Full Access" button at dashboard bottom)
- `data-tour="verification"` — on the compliance/verification badge

Add any missing attributes inline:
```tsx
<div data-tour="trust-score" ...>
  <TrustRing score={trustScore} />
</div>
```

**Step 6: Commit**

```bash
git add client/src/pages/Dashboard.tsx
git commit -m "feat: dashboard reads from DemoContextProvider in demo mode"
```

---

## Task 8: Final Polish + Deploy

**Step 1: Verify complete demo flow in browser**
1. Navigate to `/`
2. Click "Enter Demo" → persona picker opens fullscreen
3. Select "Deal Originator / Broker"
4. Demo shell mounts with fixture data
5. Tour starts automatically — all 7 steps advance
6. Tour close moment renders: headline, persona pitch, CTAs
7. "Continue Exploring" dismisses close moment, leaves in demo shell
8. "Request Access" navigates to `/onboarding`

**Step 2: Verify onboarding flow**
1. Navigate to `/onboarding`
2. Same visual weight as demo
3. Custody receipt triggers after relationship step
4. FVM Celebration fires at completion

**Step 3: Smoke check all three personas**
- Originator: relationships panel shows 4 entries with timestamps
- Investor: matches panel shows 4 sealed blind matches
- Developer: deal room shows escrow progress bar at 40%

**Step 4: Commit, push, deploy**

```bash
git add -A
git commit -m "feat: MVP demo experience — persona picker, demo context, guided tour, onboarding POW"
git push origin main
cd /home/ariel/Documents/anavi-main/anavi && vercel deploy --prod
```

---

## Architectural Notes

**Why `DemoContextProvider` over mock service worker (MSW):**
MSW would intercept at the network layer and require separate setup for Vercel. `DemoContextProvider` is a pure React pattern — it lives in the component tree, is trivially removable, and requires zero infrastructure changes. The `useDemoFixtures()` hook makes the seam explicit at every call site.

**Why no URL change on persona picker:**
The demo is a sales tool, not a product feature. Keeping `/` in the URL bar means investors can share the link and recipients land on the full landing page — not mid-demo. The picker mounts as a React overlay.

**Copy token architecture:**
`client/src/lib/copy.ts` is the single source of truth. No whitepaper language should be written inline in JSX — always import from `copy.ts`. This makes copy updates a one-file change across the entire surface.

**Tour state:**
`localStorage` key `anavi_tour_completed_demo-{persona}` is set on tour completion. If a user returns, the tour doesn't auto-start. "Replay Tour" can be wired to `clearTourCompleted(tourId)` anywhere in the UI.
