# ANAVI — Cinematic UI Upgrade PRD
**Date:** 2026-02-22
**Approach:** B — Continuous Depth
**Reference:** hex.tech × Duna.com × Linear precision
**Primary target:** Home.tsx → Login.tsx → OnboardingFlow.tsx
**Goal:** Hyper-premium animated UI that functions as a sales asset — mouth-watering first impression, authority of service, inspires exploration

---

## Design Philosophy

- Motion first, layout second
- Depth layering with intentional z-index logic
- Subtle parallax on cursor movement
- Magnetic hover physics (implied mass)
- Micro-delays (40–120ms) for intentionality
- Smooth cubic-bezier easing — no stiff transitions
- No dead static panels — ambient life always present
- Restraint as signal of confidence: accent used max 3× per screen

---

## Section 1 — Design Language Foundation

### 1.1 Color System Evolution

The existing navy/gold DNA stays. It deepens. No color replacement — extension.

```
CANVAS LAYER (new — home/auth surfaces)
canvas-void:    #060A12   background base — almost black, hint of navy
canvas-deep:    #0A0F1E   hero sections
canvas-mid:     #0D1628   card surfaces on dark
canvas-surface: #162040   elevated panels, modals

EXISTING APP TOKENS (unchanged, promoted)
navy-900:  #0A1628   sidebar, dark headers
surface-1: #F3F7FC   app content background — stays cream

ELECTRIC ACCENT SYSTEM (new alongside gold)
electric-cyan:   oklch(0.75 0.18 200)   → #22D4F5  — data highlights, glow source
electric-violet: oklch(0.65 0.22 280)   → #9B7CF8  — secondary accent, graph lines
electric-gold:   #C4972A (existing)     — CTAs, trust scores, brand anchor

GLOW TOKENS (for box-shadow + drop-shadow)
glow-cyan:    0 0 24px oklch(0.75 0.18 200 / 0.35)
glow-gold:    0 0 20px oklch(0.72 0.14 70 / 0.40)
glow-violet:  0 0 20px oklch(0.65 0.22 280 / 0.30)

GLASS TOKENS
glass-dark:   bg: oklch(0.12 0.03 220 / 0.60)  backdrop-blur: 20px saturate(140%)
glass-light:  bg: white/70                       backdrop-blur: 12px saturate(120%)
```

**Color transition logic:** Home and login pages use `canvas-*` tokens. Once inside the app, the surface lifts to cream `surface-1`. The sidebar remains `navy-900`. There is no hard mode switch — the nav bar smoothly transitions background from `canvas-deep` (pre-login) to `white/95` (in-app) via Framer Motion `layout` animation.

### 1.2 Typography System

```
DISPLAY (hero headings — Home page)
font-family: 'Inter', sans-serif
font-weight: 900
font-size: clamp(48px, 7vw, 96px)
letter-spacing: -0.05em
line-height: 0.95

HEADING (section titles)
font-weight: 800
font-size: clamp(28px, 4vw, 48px)
letter-spacing: -0.04em

SUBHEADING (card titles, nav labels)
font-weight: 700
font-size: 20px
letter-spacing: -0.02em

BODY
font-weight: 400–500
font-size: 16px
letter-spacing: -0.01em

CAPTION / LABEL
font-weight: 600
font-size: 11px
letter-spacing: 0.10em
text-transform: uppercase

MONO (data, numbers, trust scores, HUD readouts)
font-family: 'JetBrains Mono', monospace
font-weight: 500
font-size: 13px
letter-spacing: 0.02em
font-variant-numeric: tabular-nums
```

Fonts loaded via `<link>` in `index.html`. No new npm dependencies.
`Inter` (variable, wght 100–900) + `JetBrains Mono` (variable, wght 100–800) — both from Google Fonts.

### 1.3 Shadow + Depth System

```
shadow-ambient:  0 1px 2px rgb(0 0 0 / 0.06)
shadow-card:     0 2px 8px rgb(0 0 0 / 0.10), 0 1px 2px rgb(0 0 0 / 0.06)
shadow-elevated: 0 8px 32px rgb(0 0 0 / 0.18), 0 2px 8px rgb(0 0 0 / 0.10)
shadow-bloom:    0 16px 64px rgb(0 0 0 / 0.24), 0 0 80px oklch(0.65 0.19 230 / 0.08)
shadow-hover:    0 20px 60px rgb(0 0 0 / 0.28), 0 0 40px oklch(0.75 0.18 200 / 0.12)
```

### 1.4 Border Language

```
border-hairline: 1px solid oklch(1 0 0 / 0.06)    — on dark surfaces
border-subtle:   1px solid oklch(1 0 0 / 0.12)    — card edges on dark
border-accent:   1px solid oklch(0.75 0.18 200 / 0.30)  — highlighted state
border-gold:     1px solid oklch(0.72 0.14 70 / 0.40)   — CTA borders

Radius:
--radius-sharp: 0       (hero CTA buttons)
--radius-sm: 6px        (inputs, pills)
--radius: 12px          (cards, panels — elevated from 8px)
--radius-lg: 16px       (modals, sheets)
--radius-full: 9999px   (avatars, tags)
```

---

## Section 2 — Layout Structure + Motion Choreography

### 2.1 Home Page — Layout Architecture

```
┌─────────────────────────────────────────────────────┐
│  FIXED NAV BAR          [glass-dark, blur-20px]     │  z-50
├─────────────────────────────────────────────────────┤
│  HERO SECTION           [100vh, canvas-void base]   │  z-10
│  ├── Animated gradient mesh background              │
│  ├── Noise texture overlay (3% opacity SVG)         │
│  ├── Floating HUD accent element (top-right)        │
│  ├── Display headline (animated word-by-word)       │
│  ├── Subheadline (fade in, 120ms delay after words) │
│  ├── CTA pair: [Primary sharp] [Ghost outline]      │
│  └── Proof strip: logos / metrics (scroll-cue ↓)   │
├─────────────────────────────────────────────────────┤
│  PROBLEM STATEMENT      [80vh, canvas-deep]         │
│  ├── Scroll-triggered word reveal                   │
│  └── Counter animation: deal leakage stat           │
├─────────────────────────────────────────────────────┤
│  FIVE PILLARS           [full, canvas-mid]          │
│  ├── Sticky section header (pinned while scrolling) │
│  ├── 5 × feature cards (stagger-reveal on scroll)   │
│  └── Each card: icon glow + description             │
├─────────────────────────────────────────────────────┤
│  TRUST SCORE SHOWCASE   [80vh, canvas-deep]         │
│  ├── Large mono number animates up to score         │
│  ├── Radial gauge visualization                     │
│  └── Breakdown items stagger in                     │
├─────────────────────────────────────────────────────┤
│  HOW IT WORKS           [full, canvas-mid]          │
│  ├── 3-step horizontal timeline                     │
│  └── Each step: scroll-linked SVG connector draw    │
├─────────────────────────────────────────────────────┤
│  SOCIAL PROOF / CTA     [60vh, canvas-void]         │
│  └── Full-width CTA, background mesh pulse          │
└─────────────────────────────────────────────────────┘
```

### 2.2 Hero Section — Motion Choreography Map (T = route entry complete)

```
T+0ms      Background gradient mesh: slow rotation begins (120s loop)
T+0ms      Noise texture: opacity 0→0.03 (800ms ease-in)
T+0ms      HUD accent element: translateY(20px)→0, opacity 0→1 (600ms ease-out-expo)

T+80ms     Headline word 1: translateY(20px)→0, opacity 0→1 (500ms ease-out-expo)
T+120ms    Headline word 2: same
T+160ms    Headline word 3: same
...        40ms stagger per word

T+(words×40 + 120ms)   Subheadline: blur(8px)→0, opacity 0→1 (600ms)
T+(+200ms)             CTA pair: scale(0.96)→1, opacity 0→1 (500ms, spring s:300 d:25)
T+(+160ms)             Proof strip: stagger left→right, 60ms between items

CONTINUOUS LOOP:
  Gradient mesh: slow drift, 120s rotation
  HUD element: hud-float animation (±8px, 6s ease-in-out)
  Cursor glow: 400px radial follows cursor with spring lag (stiffness:120 damping:20)
```

### 2.3 Scroll-Linked Animations

```
PROBLEM SECTION
  Word reveal: chars appear as section scrolls into viewport (progress 0→1)
  Counter: animates from 0 to stat value on viewport entry

FIVE PILLARS
  Sticky header: pinned, pillars animate under it as user scrolls
  Cards: translateY(40px)→0, 0.08s stagger between cards

HOW IT WORKS
  SVG path connector: stroke-dashoffset animates (full→0) as section scrolls in
  Step nodes: pulse once when connector line reaches them

SCROLL VELOCITY BLUR (global)
  velocity 0→300px/s:   blur 0px
  velocity 300→800px/s: blur 0px→1.5px
  velocity 800+px/s:    blur 1.5px (capped)
  Return: ease-out 400ms after scroll stops
  Applied to: main content container only
```

### 2.4 Login Page Layout

```
FULL VIEWPORT — canvas-void base
  Background: animated gradient mesh (shared component with Home)
  Noise texture overlay
  Three floating orbs: large, blurred, color: cyan/violet/gold — slow drift

CENTERED GLASS PANEL
  Background: glass-dark
  Border: border-subtle
  Backdrop-filter: blur(20px) saturate(140%)
  Width: 440px max, full-width on mobile
  Border-radius: --radius-lg (16px)

  Contents:
  - ANAVI wordmark (text-gradient-cyan, font-display at reduced size)
  - Email input (glass-dark input, border-hairline)
  - Password input
  - [Sign In] → magnetic sharp CTA button
  - Forgot password / SSO links (muted, small)

PANEL ENTRY ANIMATION
  initial: scale(0.94), opacity 0, blur(20px)
  animate: scale(1.0), opacity 1, blur(0) — spring stiffness:200 damping:20 (600ms)
```

### 2.5 Onboarding Flow Layout

```
STEP STRUCTURE
  Left (240px): Progress rail
    - Vertical connecting line (hairline, canvas-surface color)
    - Step nodes: 12px circles
      · Completed: gold fill, glow-gold, checkmark SVG draws in
      · Active: cyan fill, animate-glow-pulse
      · Pending: border-subtle, transparent fill
  Right: Content panel (glass-dark card, step-specific content)

STEP TRANSITIONS
  Exit: translateX(0)→(-20px), opacity 1→0, blur(0)→blur(6px) — 180ms ease-in
  Enter: translateX(20px)→0, opacity 0→1, blur(6px)→blur(0) — 280ms ease-out-expo, delay 200ms
  Background orbs: shift position between steps (2s ease transition)

PROGRESS BAR (top, full-width)
  Height: 2px
  Width: animates from step% to next step% via spring
  Color: electric-cyan
  Glow: 0 0 8px oklch(0.75 0.18 200 / 0.60)
```

---

## Section 3 — Interaction Animation Breakdown

### 3.1 Cursor Proximity Glow

Global `CursorGlow` component mounted once in `App.tsx`. Renders `position:fixed` radial gradient following cursor.

```
Glow size: 400px diameter
Color: oklch(0.75 0.18 200 / 0.08) — electric cyan, very faint
Lag: spring stiffness:120 damping:20 (~80ms effective lag)
On dark surfaces (canvas-*): opacity 1
On light surfaces (app interior): opacity 0
Surface transition: 400ms ease on route change

PROXIMITY BORDER REVEAL (per-card)
  Activation: cursor within 120px of card center
  Effect: border-color transitions hairline→accent
  Throttle: 60fps RAF
```

### 3.2 Magnetic Hover Physics

Applied to: primary CTA buttons, nav items, social proof links.

```
Activation radius: 80px from element center
Max displacement: 12px (x), 8px (y)
Physics: spring stiffness:400 damping:28
On leave: snaps back via spring (not tween)

SCALE SEQUENCE:
  Outside zone:    scale 1.0
  Inside zone:     scale 1.0→1.02 (breathing effect)
  On hover:        scale 1.02→1.04 + shadow-hover activates
  On pointerdown:  scale 1.04→0.97 (compress, 60ms)
  On pointerup:    scale 0.97→1.03 (spring overshoot, stiffness:500 damping:15)
  Settle:          scale 1.03→1.0 (spring stiffness:300 damping:20)
```

Hook: `useMagneticButton` — Framer Motion `useMotionValue` + `useSpring`.

### 3.3 Button Press Kinetic Feedback

```
PHASE 1 — COMPRESS (pointerdown, 60ms)
  scale: 1.0 → 0.97
  y: 0 → +1px
  ease: cubic-bezier(0.25, 0, 0.5, 1)

PHASE 2 — RELEASE SPRING (pointerup)
  scale: 0.97 → 1.03 (overshoot)
  y: +1px → -1px (rebound)
  spring: stiffness:600 damping:12

PHASE 3 — SETTLE
  scale: 1.03 → 1.0
  y: -1px → 0
  spring: stiffness:300 damping:20

RIPPLE (simultaneous with Phase 1)
  Origin: click coordinates within button
  Expand: 0 → 200% of button dimensions
  Opacity: 0.2 → 0
  Duration: 500ms ease-out
  Color: white/20 on dark buttons, navy/10 on light buttons
```

### 3.4 Card Hover Rise

```
REST STATE
  transform: translateY(0) translateZ(0)
  box-shadow: shadow-card
  border: border-hairline

HOVER STATE (Framer Motion whileHover)
  transform: translateY(-4px) translateZ(0)
  box-shadow: shadow-hover (includes cyan bloom)
  border: border-accent
  transition: spring stiffness:300 damping:20

INTERNAL CURSOR GLOW (per-card)
  position: absolute, inset: -1px
  radial-gradient at cursor position within card
  opacity: 0→0.06 on hover
  blur: 20px
```

### 3.5 Page Transitions (Route Changes)

```
PAGE EXIT
  opacity: 1→0, scale: 1.0→0.98, filter: blur(0)→blur(4px)
  duration: 200ms, ease: cubic-bezier(0.4, 0, 1, 1)

PAGE ENTER
  opacity: 0→1, scale: 0.98→1.0, filter: blur(4px)→blur(0)
  duration: 350ms, ease: cubic-bezier(0, 0, 0.2, 1)
  delay: 80ms (after exit completes)

Nav bar: persists, layout animation only if dimensions change
```

### 3.6 Data Load Stagger (Authenticated App)

```
STAGGER PATTERN
  Item n: delay n×40ms (cap: 320ms for long lists)

PER-ITEM
  initial: { opacity: 0, y: 16, filter: "blur(6px)" }
  animate: { opacity: 1, y: 0, filter: "blur(0px)" }
  duration: 500ms, ease: cubic-bezier(0.215, 0.61, 0.355, 1)
```

### 3.7 Graph Trailing Stroke (Recharts)

```css
@keyframes stroke-draw {
  from { stroke-dashoffset: var(--path-length); }
  to   { stroke-dashoffset: 0; }
}
.chart-animated-line {
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  animation: stroke-draw 1200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--line-index, 0) * 150ms);
}
```

Data points: fade in 100ms after their line reaches them.

### 3.8 Haptic Illusion — Scale Micro-Shift

```
Interactive list items: scale 0.99 on pointerdown → 1.0 on pointerup (80ms spring)
Input fields: inner-shadow deepens on focus (no border jump)
Toggle switches: thumb overshoots 4px before settling
Checkboxes: checkmark SVG stroke-draw animation (120ms)
```

### 3.9 Motion Reduced Fallback

All animations check `prefers-reduced-motion` via Framer Motion `useReducedMotion()` hook, provided globally via context:
- `filter: blur()` animations → instant
- `translateY` → opacity-only
- Spring physics → `duration: 0`
- Background mesh → static gradient, no rotation
- Cursor glow → disabled

---

## Section 4 — CSS Animation Specs

### 4.1 Custom Properties (additions to `index.css`)

```css
@theme inline {
  --color-canvas-void:     #060A12;
  --color-canvas-deep:     #0A0F1E;
  --color-canvas-mid:      #0D1628;
  --color-canvas-surface:  #162040;
  --color-electric-cyan:   oklch(0.75 0.18 200);
  --color-electric-violet: oklch(0.65 0.22 280);

  --shadow-glow-cyan:   0 0 24px oklch(0.75 0.18 200 / 0.35);
  --shadow-glow-gold:   0 0 20px oklch(0.72 0.14 70 / 0.40);
  --shadow-bloom:       0 20px 60px rgb(0 0 0 / 0.28),
                        0 0 40px oklch(0.75 0.18 200 / 0.12);

  --radius-sharp: 0px;
  --radius-lg:    16px;

  --ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-expo:   cubic-bezier(0.7, 0, 0.84, 0);
  --ease-cinematic: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);

  --font-display: 'Inter', var(--font-sans);
  --font-mono:    'JetBrains Mono', 'Courier New', monospace;
}
```

### 4.2 Keyframes

```css
@keyframes mesh-drift {
  0%   { transform: rotate(0deg) scale(1); }
  33%  { transform: rotate(120deg) scale(1.08); }
  66%  { transform: rotate(240deg) scale(0.96); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes noise-appear {
  from { opacity: 0; }
  to   { opacity: 0.03; }
}

@keyframes stroke-draw {
  from { stroke-dashoffset: var(--path-length, 1000); }
  to   { stroke-dashoffset: 0; }
}

@keyframes hud-float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%       { transform: translateY(-8px) rotate(1deg); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px oklch(0.75 0.18 200 / 0.4); }
  50%       { box-shadow: 0 0 20px oklch(0.75 0.18 200 / 0.7),
                           0 0 40px oklch(0.75 0.18 200 / 0.3); }
}

@keyframes shimmer {
  from { background-position: -200% center; }
  to   { background-position: 200% center; }
}
```

### 4.3 Key Utility Classes

```css
.bg-mesh {
  background:
    radial-gradient(ellipse 80% 50% at 20% 30%, oklch(0.65 0.19 230 / 0.12) 0%, transparent 60%),
    radial-gradient(ellipse 60% 70% at 80% 70%, oklch(0.65 0.22 280 / 0.08) 0%, transparent 55%),
    radial-gradient(ellipse 100% 80% at 50% 50%, oklch(0.55 0.15 200 / 0.06) 0%, transparent 70%),
    var(--color-canvas-void);
  animation: mesh-drift 120s ease-in-out infinite;
}

.glass-dark {
  background: oklch(0.12 0.03 220 / 0.60);
  backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid oklch(1 0 0 / 0.08);
}

.glass-light {
  background: rgb(255 255 255 / 0.70);
  backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid rgb(255 255 255 / 0.60);
}

.font-display {
  font-family: var(--font-display);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 0.95;
}

.font-data {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.text-gradient-cyan {
  background: linear-gradient(135deg, var(--color-electric-cyan) 0%, oklch(0.75 0.15 230) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.animate-hud-float { animation: hud-float 6s ease-in-out infinite; }
.animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }

.progress-node-active {
  background: var(--color-electric-cyan);
  box-shadow: var(--shadow-glow-cyan);
  animation: glow-pulse 2s ease-in-out infinite;
}

.progress-node-complete {
  background: var(--color-trust-gold);
  box-shadow: var(--shadow-glow-gold);
}
```

### 4.4 Framer Motion Presets (new file: `lib/motion.ts`)

```ts
export const SPRING_SNAPPY = { type: "spring", stiffness: 400, damping: 25 };
export const SPRING_SOFT   = { type: "spring", stiffness: 200, damping: 20 };
export const SPRING_BOUNCE = { type: "spring", stiffness: 500, damping: 15 };

export const EASE_OUT_EXPO  = [0.16, 1, 0.3, 1] as const;
export const EASE_CINEMATIC = [0.25, 0.1, 0.25, 1] as const;

export const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.6, delay: i * 0.04, ease: EASE_OUT_EXPO }
  })
};

export const scaleInVariant = {
  hidden: { opacity: 0, scale: 0.94, filter: "blur(12px)" },
  visible: {
    opacity: 1, scale: 1, filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_OUT_EXPO }
  }
};

export const pageTransition = {
  initial:  { opacity: 0, scale: 0.98, filter: "blur(4px)" },
  animate:  { opacity: 1, scale: 1.0,  filter: "blur(0px)",
               transition: { duration: 0.35, delay: 0.08, ease: EASE_CINEMATIC } },
  exit:     { opacity: 0, scale: 0.98, filter: "blur(4px)",
               transition: { duration: 0.20, ease: [0.4, 0, 1, 1] } }
};
```

---

## Section 5 — What Makes It Feel "Impossibly Premium"

### 5.1 Intentional Micro-Delays
40ms word stagger reads not as choreography but as **intelligence** — each word choosing its moment. The 120ms pause before the subheadline feels like a breath. Users don't see timing; they feel authority.

### 5.2 Physics That Respect Mass
Spring values are tuned to implied weight. Modals enter at stiffness:200 (heavy glass being placed). Buttons snap at stiffness:400 (mechanical precision). Toggle overshoots 4px (real object with momentum). Users can't articulate this — they feel **materiality.**

### 5.3 The Background Is Never Static
Mesh drifts. Orbs pulse. Noise breathes. On any loaded page, something is imperceptibly alive. This is the difference between a premium interface and a static design: **ambient life.**

### 5.4 The Cursor Changes the Room
Cursor acts as ambient light. Moving across the page shifts the glow, brightens card borders, pulls buttons toward you. The product responds to presence **before the click** — attentive, not reactive.

### 5.5 Typography That Commands
96px display at `letter-spacing: -0.05em` and `line-height: 0.95` has editorial authority. Combined with JetBrains Mono for data, you get two languages: human voice (Inter) and machine precision (mono). The contrast signals the product is built for serious operators.

### 5.6 The Transition Hides the Seam
On login: the dark canvas recedes. The glass panel expands. The sidebar emerges. The nav morphs from dark glass to frosted white. No hard cut — **one continuous space that changes character.**

### 5.7 Nothing Loads — Everything Arrives
Data doesn't appear after a spinner. It arrives — staggered, blurred-in, purposeful. 10 deals at 40ms intervals with fade-up-deblur feels like a briefing, not a page load. **Users lean in.**

### 5.8 Restraint as the Signal of Confidence
Accent color: max 3× per screen. Grid: crisp. Borders: hairlines. Mesh: visible only if you look. Overdesigned = insecurity. Underdesigned = neglect. This balance signals **mastery.**

---

## Implementation Scope

### Phase 1 — Foundation (prerequisite for all pages)
1. `index.html` — add Inter + JetBrains Mono font links
2. `index.css` — add canvas tokens, electric accents, glow tokens, keyframes, utility classes
3. `lib/motion.ts` — create Framer Motion preset file
4. `App.tsx` — add `CursorGlow` component, `ReducedMotionProvider`, `AnimatePresence` page wrapper

### Phase 2 — Home Page (`Home.tsx`)
5. Full page rebuild: background mesh, hero section, problem statement, five pillars, trust score, how it works, CTA
6. Hero word-by-word animation
7. Scroll-linked reveals for all sections
8. HUD accent floating element

### Phase 3 — Login + Auth (`Login.tsx`)
9. Glass panel redesign on dark canvas background
10. Magnetic CTA button
11. Panel entry animation

### Phase 4 — Onboarding (`OnboardingFlow.tsx`)
12. Progress rail with glow nodes
13. Step transition choreography
14. Progress bar with glow

### Phase 5 — Global Polish
15. `DashboardLayout.tsx` — nav transition from dark→light, sidebar depth
16. `PageTransition.tsx` — implement unified page crossfade + scale
17. All buttons — kinetic press feedback
18. All cards — hover rise + cursor glow

---

## Constraints
- No framework changes — React 19, Tailwind v4, Shadcn/Radix, Framer Motion 12
- No new npm dependencies (fonts via Google Fonts CDN only)
- Existing `PremiumAnimations.tsx` and `AwwwardsAnimations.tsx` retained, extended
- All changes mobile-responsive
- `prefers-reduced-motion` fallback required on every animation
