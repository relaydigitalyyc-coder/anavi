# ANAVI UI Redesign — Design Document
**Date:** 2026-02-22
**Approach:** B — Token system first, then pages in priority order
**Direction:** Keep navy/gold brand DNA; elevate execution to hex.tech sophistication + swap-commerce education

---

## Design Goals

1. **Beauty & authority** — hex.tech level: editorial typography, glassmorphism, spring motion, dramatic depth
2. **User education** — swap-commerce level: contextual tooltips, problem-first narratives, smart empty states
3. **Brand consistency** — eliminate all color inconsistencies (cyan headers, amber LP portal, violet pages)

---

## Section 1 — Typography + Token System

### Typography
- Replace `Arial` everywhere with `Inter` (variable weight, Google Fonts)
- Display headings: `Inter` weight 800–900, `letter-spacing: -0.04em` to `-0.06em`
- Body: `Inter` weight 400–500, `letter-spacing: -0.01em`
- Mono: `JetBrains Mono` replaces `Courier New` — for trust scores, data, numbers
- New CSS utility: `.font-display` with tight tracking for hero text

### Token Additions
**Navy depth palette:**
```
navy-950: #04090F   (darkest — sidebar background)
navy-900: #0A1628   (existing primary)
navy-800: #0D2040
navy-700: #162A52
```

**Surface layers:**
```
surface-0: #FFFFFF
surface-1: #F3F7FC  (existing background)
surface-2: #E8EDF4
surface-3: #D1DCF0
```

**Gold enriched:**
```
gold-light: #E8C87A
gold-mid:   #C4972A  (existing trust-gold)
gold-dark:  #A07A1A
```

**Shadow tokens (navy-tinted):**
```
shadow-card: 0 1px 3px rgb(10 22 40 / 0.08), 0 4px 12px rgb(10 22 40 / 0.05)
shadow-md:   0 4px 16px rgb(10 22 40 / 0.12), 0 1px 4px rgb(10 22 40 / 0.08)
shadow-lg:   0 8px 32px rgb(10 22 40 / 0.16), 0 2px 8px rgb(10 22 40 / 0.10)
```

**Border radius:**
```
--radius-sharp: 0       (large CTAs, hero buttons)
--radius-sm:    0.375rem (inputs, small elements)
--radius:       0.75rem  (cards, modals — bumped from 0.5rem)
--radius-full:  9999px   (pills, avatars)
```

---

## Section 2 — Component Visual Language

### Sidebar
- Background: `navy-950` (#04090F) — deeper than current #0A1628
- Active item: gold left-border glow `box-shadow: inset 3px 0 0 #C4972A` + `bg-white/8`
- User chip: gold avatar ring, elevated `bg-navy-800` surface
- Width: 240px → 256px

### Top Header Bar
- Background: `bg-white/95 backdrop-blur-md` — floats above content
- Page title: `text-sm font-medium uppercase tracking-[0.12em]` — editorial
- "Create Intent" button: gradient-border technique (hex.tech style) instead of flat gold fill

### Cards
- Standard: `bg-white shadow-card border border-surface-2 rounded-[0.75rem]`
- Premium/glass: `bg-white/70 backdrop-blur-sm border border-white/60 shadow-card rounded-[0.75rem]`
- Hover: `translateY(-2px) shadow-md transition-all duration-200`

### Buttons
- Primary CTA: `border-radius: 0` (sharp), `bg-navy-900 text-white`, gold shimmer on hover
- Gold CTA: `bg-gradient-to-r from-[#C4972A] to-[#D4A73A]` — gradient, not flat
- Ghost: `border-navy-800/30 hover:border-accent/60 hover:bg-accent/5`
- Heights: compact `h-10`, default `h-11`, hero `h-12`

### Status Pills
- All use brand palette only (navy/gold/green/red) — no generic gray-100
- Shape: `rounded-full px-3 py-1`

### Data Tables
- Sticky header: `backdrop-blur-sm bg-surface-1/90`
- Row hover: `bg-accent/4`
- Numbers: `font-mono tabular-nums` enforced universally

---

## Section 3 — Educational Layer

### Contextual Tooltips
- Every metric, trust score, and status pill gets an `(i)` trigger
- Tooltip style: bold label "What this means:" + plain-English explanation
- Source: `tooltipContent.ts` already exists — wire it up universally

### Feature Cards (Home)
- Each card gets a "Why it matters" second line in `text-muted-foreground text-sm`
- Example: Blind Matching → *"Revealing your interest too early in private markets costs deals. Both parties only identify when there's mutual intent."*

### Empty States
- Replace all "No data" states with educational prompts explaining the concept and first action
- Example: Relationships empty → *"Your network is your inventory. Start by importing contacts or adding relationships manually."*

### Home Page — Problem-First Narrative
- "How It Works" rewritten: each step opens with the pain point, then the solution
- Step 01: *"Most deals die because nobody knows who introduced whom. Import your network with cryptographic timestamps that prove relationship custody forever."*

### Dashboard — First-Login Education Strip
- Dismissible banner on first login explaining trust score and 3 actions to improve it
- Each dashboard stat card gets "Learn more" micro-link that expands in-place

---

## Section 4 — Page Priority Order

| Priority | File | Changes |
|----------|------|---------|
| 1 | `client/src/index.css` | Font import, token expansion, shadow/radius/utility classes |
| 2 | `components/DashboardLayout.tsx` | Sidebar depth, topbar glass, button refinement, mobile nav |
| 3 | `pages/Home.tsx` | Dark hero, editorial typography, educational cards, narrative How It Works |
| 4 | `pages/Dashboard.tsx` | Glass stat cards, education strip, consistent palette |
| 5 | `pages/Relationships.tsx` | Custody tooltips, privacy model education, token cleanup |
| 6 | `pages/DealMatching.tsx` | Matching explainer, blind-matching education, palette fix |
| 7 | `pages/DealRooms.tsx` | Collaboration UI refinement |
| 8 | Auth/Onboarding pages | Premium first impression, trust copy |
| 9 | Remaining 35 pages | Token sweep, color inconsistency fixes, educational empty states |

---

## Constraints
- No framework changes — stays on React 19, Tailwind v4, Shadcn/Radix, Framer Motion
- No new dependencies except Google Fonts (Inter, JetBrains Mono)
- Existing animation components (PremiumAnimations, AwwwardsAnimations) retained and extended
- Mobile-first — all changes must be responsive
