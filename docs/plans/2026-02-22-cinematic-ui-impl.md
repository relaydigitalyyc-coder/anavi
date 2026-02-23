# Cinematic UI Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform ANAVI's Home → Login → Onboarding into a hyper-premium cinematic interface (hex.tech × Duna.com × Linear) that functions as a sales asset — mouth-watering first impression with authority and depth.

**Architecture:** Approach B (Continuous Depth) — dark canvas base on public surfaces, glass panels, animated mesh background, spring physics throughout. No framework changes. Extension of existing PremiumAnimations + AwwwardsAnimations primitives. See full PRD: `docs/plans/2026-02-22-cinematic-ui-prd.md`.

**Tech Stack:** React 19, TypeScript, Framer Motion 12, Tailwind CSS v4, Radix/shadcn. Fonts via Google Fonts CDN (Inter variable + JetBrains Mono variable). No new npm deps.

**What already exists (DO NOT recreate):**
- `Magnetic` component — `client/src/components/AwwwardsAnimations.tsx:40`
- `TextReveal` (word/char/line) — `AwwwardsAnimations.tsx:81`
- `SmoothReveal`, `Card3D`, `GlowingBorder`, `SmoothCounter` — `PremiumAnimations.tsx`
- Framer Motion `useScroll`, `useTransform`, `useInView` already in use
- `PageTransition`, `StaggerContainer`, `FadeInView` — `PageTransition.tsx`

---

## Phase 1 — Foundation (prerequisite for everything else)

### Task 1: Add Google Fonts to index.html

**Files:**
- Modify: `anavi/index.html`

**Step 1: Open index.html and locate the `<head>` section**

Look for the existing `<head>` tag. It should already have a `<link>` for the favicon or similar.

**Step 2: Add font preconnect + stylesheet links**

Insert immediately before the closing `</head>` tag:

```html
    <!-- Cinematic UI Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet" />
```

**Step 3: Verify build still passes**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

Expected: no errors. Font URLs are external, build is unaffected.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add Inter variable + JetBrains Mono fonts for cinematic UI"
```

---

### Task 2: Add Canvas Color Tokens to index.css

**Files:**
- Modify: `anavi/client/src/index.css` (inside `@theme inline { }` block, around line 6)

**Step 1: Open index.css and find the `@theme inline` block**

The block starts at line 6 and ends with the sidebar tokens around line 60.

**Step 2: Add canvas + electric accent tokens at the end of `@theme inline`**

Insert before the closing `}` of `@theme inline`:

```css
  /* CINEMATIC UI — CANVAS PALETTE */
  --color-canvas-void:     #060A12;
  --color-canvas-deep:     #0A0F1E;
  --color-canvas-mid:      #0D1628;
  --color-canvas-surface:  #162040;

  /* CINEMATIC UI — ELECTRIC ACCENTS */
  --color-electric-cyan:   oklch(0.75 0.18 200);
  --color-electric-violet: oklch(0.65 0.22 280);

  /* CINEMATIC UI — GLOW SHADOWS */
  --shadow-glow-cyan:   0 0 24px oklch(0.75 0.18 200 / 0.35);
  --shadow-glow-gold:   0 0 20px oklch(0.72 0.14 70 / 0.40);
  --shadow-bloom:       0 20px 60px rgb(0 0 0 / 0.28), 0 0 40px oklch(0.75 0.18 200 / 0.12);
  --shadow-hover:       0 20px 60px rgb(0 0 0 / 0.28), 0 0 40px oklch(0.75 0.18 200 / 0.12);

  /* CINEMATIC UI — EXTENDED RADIUS */
  --radius-sharp: 0px;
  --radius-lg:    16px;

  /* CINEMATIC UI — EASING CURVES */
  --ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-expo:   cubic-bezier(0.7, 0, 0.84, 0);
  --ease-cinematic: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);

  /* CINEMATIC UI — TYPOGRAPHY */
  --font-display: 'Inter', var(--font-sans);
  --font-mono:    'JetBrains Mono', 'Courier New', monospace;
```

**Step 3: Verify TypeScript + CSS compiles**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

Expected: clean build, no errors.

**Step 4: Commit**

```bash
git add client/src/index.css
git commit -m "feat: add canvas palette, electric accents, glow shadows to design tokens"
```

---

### Task 3: Add Keyframe Animations to index.css

**Files:**
- Modify: `anavi/client/src/index.css` (at the end of the file, inside `@layer utilities`)

**Step 1: Locate the end of `@layer utilities` in index.css**

The `@layer utilities` block starts around line 86 and contains existing utilities like `.bg-geometric`, `.font-data-mono`, etc.

**Step 2: Add keyframes at the END of the file (after all existing content)**

Append to the very end of `index.css`:

```css
/* ============================================================
   CINEMATIC UI — KEYFRAME ANIMATIONS
   ============================================================ */

@keyframes mesh-drift {
  0%   { transform: rotate(0deg) scale(1); }
  33%  { transform: rotate(120deg) scale(1.08); }
  66%  { transform: rotate(240deg) scale(0.96); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes hud-float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%       { transform: translateY(-8px) rotate(1deg); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px oklch(0.75 0.18 200 / 0.4); }
  50%       { box-shadow: 0 0 20px oklch(0.75 0.18 200 / 0.7), 0 0 40px oklch(0.75 0.18 200 / 0.3); }
}

@keyframes shimmer {
  from { background-position: -200% center; }
  to   { background-position:  200% center; }
}

@keyframes stroke-draw {
  from { stroke-dashoffset: var(--path-length, 1000); }
  to   { stroke-dashoffset: 0; }
}

/* ============================================================
   CINEMATIC UI — UTILITY CLASSES
   ============================================================ */

@layer utilities {
  /* Canvas backgrounds */
  .bg-canvas-void    { background-color: var(--color-canvas-void); }
  .bg-canvas-deep    { background-color: var(--color-canvas-deep); }
  .bg-canvas-mid     { background-color: var(--color-canvas-mid); }
  .bg-canvas-surface { background-color: var(--color-canvas-surface); }

  /* Animated gradient mesh */
  .bg-mesh {
    background:
      radial-gradient(ellipse 80% 50% at 20% 30%, oklch(0.65 0.19 230 / 0.12) 0%, transparent 60%),
      radial-gradient(ellipse 60% 70% at 80% 70%, oklch(0.65 0.22 280 / 0.08) 0%, transparent 55%),
      radial-gradient(ellipse 100% 80% at 50% 50%, oklch(0.55 0.15 200 / 0.06) 0%, transparent 70%),
      var(--color-canvas-void);
    animation: mesh-drift 120s ease-in-out infinite;
  }

  /* Glass surfaces */
  .glass-dark {
    background: oklch(0.12 0.03 220 / 0.60);
    backdrop-filter: blur(20px) saturate(140%);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    border: 1px solid oklch(1 0 0 / 0.08);
  }

  .glass-light {
    background: rgb(255 255 255 / 0.70);
    backdrop-filter: blur(12px) saturate(120%);
    -webkit-backdrop-filter: blur(12px) saturate(120%);
    border: 1px solid rgb(255 255 255 / 0.60);
  }

  /* Display typography */
  .font-display {
    font-family: var(--font-display);
    font-weight: 900;
    letter-spacing: -0.05em;
    line-height: 0.95;
  }

  .font-heading-tight {
    font-family: var(--font-display);
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .font-data-hud {
    font-family: var(--font-mono);
    font-weight: 500;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }

  /* Gradient text */
  .text-gradient-cyan {
    background: linear-gradient(135deg, var(--color-electric-cyan) 0%, oklch(0.75 0.15 230) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .text-gradient-gold {
    background: linear-gradient(135deg, #E8C87A 0%, #C4972A 50%, #A07A1A 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Animation utilities */
  .animate-hud-float   { animation: hud-float 6s ease-in-out infinite; }
  .animate-glow-pulse  { animation: glow-pulse 2s ease-in-out infinite; }
  .animate-mesh-drift  { animation: mesh-drift 120s ease-in-out infinite; }

  /* Onboarding progress nodes */
  .progress-node-active {
    background: var(--color-electric-cyan);
    box-shadow: var(--shadow-glow-cyan);
    animation: glow-pulse 2s ease-in-out infinite;
  }

  .progress-node-complete {
    background: var(--color-trust-gold);
    box-shadow: var(--shadow-glow-gold);
  }

  .progress-node-pending {
    background: oklch(1 0 0 / 0.12);
    border: 1px solid oklch(1 0 0 / 0.20);
  }

  /* Chart animated stroke */
  .chart-animated-line {
    stroke-dasharray: var(--path-length, 1000);
    stroke-dashoffset: var(--path-length, 1000);
    animation: stroke-draw 1200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: calc(var(--line-index, 0) * 150ms);
  }

  /* Border hairline variants for dark surfaces */
  .border-hairline { border: 1px solid oklch(1 0 0 / 0.06); }
  .border-subtle   { border: 1px solid oklch(1 0 0 / 0.12); }
  .border-accent-glow { border: 1px solid oklch(0.75 0.18 200 / 0.30); }
  .border-gold-glow   { border: 1px solid oklch(0.72 0.14 70 / 0.40); }
}
```

**Step 3: Verify build**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

Expected: clean build. CSS is static, no TS to break.

**Step 4: Commit**

```bash
git add client/src/index.css
git commit -m "feat: add cinematic keyframes, glass utilities, gradient text, canvas bg classes"
```

---

### Task 4: Create Framer Motion Presets File

**Files:**
- Create: `anavi/client/src/lib/motion.ts`

**Step 1: Check that lib/ directory exists**

```bash
ls /home/ariel/Documents/anavi-main/anavi/client/src/lib/
```

Expected: shows existing files like `trpc.ts`. Directory exists.

**Step 2: Create the file**

```typescript
// client/src/lib/motion.ts
// Shared Framer Motion presets for the cinematic UI system

// Spring physics presets
export const SPRING_SNAPPY  = { type: "spring", stiffness: 400, damping: 25 } as const;
export const SPRING_SOFT    = { type: "spring", stiffness: 200, damping: 20 } as const;
export const SPRING_BOUNCE  = { type: "spring", stiffness: 500, damping: 15 } as const;
export const SPRING_MAGNETIC = { type: "spring", stiffness: 400, damping: 28 } as const;

// Easing curves (Framer Motion accepts arrays for cubic-bezier)
export const EASE_OUT_EXPO  = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_EXPO   = [0.7, 0, 0.84, 0] as const;
export const EASE_CINEMATIC = [0.25, 0.1, 0.25, 1] as const;
export const EASE_EASEOUT   = [0.215, 0.61, 0.355, 1] as const;

// Reusable animation variants

/** Fade up with blur — primary entry animation for text, cards, labels */
export const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      delay: i * 0.04,
      ease: EASE_OUT_EXPO,
    },
  }),
};

/** Scale in with blur — for modals, panels, login cards */
export const scaleInVariant = {
  hidden: { opacity: 0, scale: 0.94, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
};

/** Page-level transitions — used in PageTransition.tsx */
export const pageTransition = {
  initial:  {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
  },
  animate:  {
    opacity: 1,
    scale: 1.0,
    filter: "blur(0px)",
    transition: {
      duration: 0.35,
      delay: 0.08,
      ease: EASE_CINEMATIC,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
    transition: {
      duration: 0.20,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
};

/** Stagger container — wraps a list of items to animate in sequence */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

/** Step transition for onboarding — slide + blur between steps */
export const stepExit = {
  opacity: 0,
  x: -20,
  filter: "blur(6px)",
  transition: { duration: 0.18, ease: EASE_IN_EXPO },
};

export const stepEnter = {
  opacity: 1,
  x: 0,
  filter: "blur(0px)",
  transition: { duration: 0.28, delay: 0.20, ease: EASE_OUT_EXPO },
};
```

**Step 3: Verify TypeScript compiles**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check 2>&1 | tail -20
```

Expected: no TypeScript errors.

**Step 4: Commit**

```bash
git add client/src/lib/motion.ts
git commit -m "feat: add shared Framer Motion presets (springs, easings, variants)"
```

---

### Task 5: Create CursorGlow Component

**Files:**
- Create: `anavi/client/src/components/CursorGlow.tsx`

**Step 1: Create the component**

```typescript
// client/src/components/CursorGlow.tsx
// Global ambient cursor glow for dark canvas surfaces.
// Mount once in App.tsx — works automatically on canvas-void/canvas-deep pages.

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export function CursorGlow() {
  const rawX = useMotionValue(-500);
  const rawY = useMotionValue(-500);

  // Spring lag creates 80ms effective delay — cursor leads, glow follows
  const x = useSpring(rawX, { stiffness: 120, damping: 20 });
  const y = useSpring(rawY, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      rawX.set(e.clientX - 200); // offset by half glow size (400px / 2)
      rawY.set(e.clientY - 200);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [rawX, rawY]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] select-none"
      style={{
        x,
        y,
        width: 400,
        height: 400,
        background:
          "radial-gradient(circle, oklch(0.75 0.18 200 / 0.08) 0%, transparent 70%)",
        borderRadius: "50%",
      }}
      aria-hidden="true"
    />
  );
}
```

**Step 2: Verify TypeScript**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check 2>&1 | grep -i "cursor\|error" | head -20
```

Expected: no errors mentioning CursorGlow.

**Step 3: Commit**

```bash
git add client/src/components/CursorGlow.tsx
git commit -m "feat: add CursorGlow ambient light component for dark canvas surfaces"
```

---

### Task 6: Wire CursorGlow into App.tsx

**Files:**
- Modify: `anavi/client/src/App.tsx`

**Step 1: Add import at the top of App.tsx (after existing imports)**

Find the import block in App.tsx (around line 1–49). Add:

```typescript
import { CursorGlow } from "./components/CursorGlow";
```

**Step 2: Mount CursorGlow inside the `App` function return, as the first child of `<ErrorBoundary>`**

Find this block (around line 150–160):

```tsx
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

Change to:

```tsx
function App() {
  return (
    <ErrorBoundary>
      <CursorGlow />
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

**Step 3: Verify TypeScript**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check 2>&1 | tail -20
```

**Step 4: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat: mount global CursorGlow ambient light in App"
```

---

### Task 7: Update PageTransition.tsx with Cinematic Crossfade + Scale

**Files:**
- Modify: `anavi/client/src/components/PageTransition.tsx`

**Step 1: Read the current file**

The current `PageTransition` uses `{ opacity: 0, y: 20 }` → `{ opacity: 1, y: 0 }` with `duration: 0.4`. We're replacing with scale + blur.

**Step 2: Replace the `pageVariants` constant and `PageTransition` transition prop**

Find lines 9–36 (the `pageVariants` object and the `PageTransition` component):

```tsx
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
};

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

Replace with:

```tsx
const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
  },
  enter: {
    opacity: 1,
    scale: 1.0,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
  },
};

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      transition={{
        enter: { duration: 0.35, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] },
        exit:  { duration: 0.20, ease: [0.4, 0, 1, 1] },
        default: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Step 3: Also update `StaggerItem` to add blur**

Find the `itemVariants` constant (around line 65–74):

```tsx
const itemVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
  },
};
```

Replace with:

```tsx
const itemVariants = {
  initial: {
    opacity: 0,
    y: 16,
    filter: "blur(6px)",
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};
```

**Step 4: Verify TypeScript**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add client/src/components/PageTransition.tsx
git commit -m "feat: upgrade page transitions to cinematic crossfade + scale 0.98→1.0 + blur"
```

---

## Phase 2 — Home Page

### Task 8: Update Home.tsx Root Container + Nav to Dark Canvas

**Files:**
- Modify: `anavi/client/src/pages/Home.tsx`

The Home page root div is `className="min-h-screen bg-background text-foreground overflow-hidden"` (line 55). The nav uses `bg-background/60` (line 58).

**Step 1: Change root container to dark canvas + mesh**

Find:
```tsx
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
```

Replace with:
```tsx
    <div className="min-h-screen bg-canvas-void text-white overflow-hidden">
```

**Step 2: Update the nav background to glass-dark**

Find (line ~58):
```tsx
        className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50"
```

Replace with:
```tsx
        className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-hairline"
```

**Step 3: Update nav text/link colors since background is now dark**

Find the nav link classes (around line 85):
```tsx
className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 relative group"
```

Replace with:
```tsx
className="text-sm text-white/60 hover:text-white transition-all duration-300 relative group"
```

**Step 4: Update the nav "Enter App" button to use gold accent on dark**

Find the nav button (around line 100):
```tsx
className="relative bg-foreground text-background px-5 md:px-8 py-2.5 md:py-3 text-xs md:text-sm font-medium overflow-hidden group"
```

Replace with:
```tsx
className="relative bg-[#C4972A] text-[#060A12] px-5 md:px-8 py-2.5 md:py-3 text-xs md:text-sm font-semibold overflow-hidden group"
```

**Step 5: Verify app still builds**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: Home - switch to dark canvas base, glass nav, gold CTA"
```

---

### Task 9: Update Home.tsx Hero Background to Animated Mesh

**Files:**
- Modify: `anavi/client/src/pages/Home.tsx`

The hero section is inside the root div. We need to add the animated mesh behind the existing hero content.

**Step 1: Find the hero section opening**

Look for the `<motion.section ref={heroRef}` or similar hero div — it's the first large section after the nav. It should be around line 120–140.

If the hero section has a class like `relative`, it already has positioning context. If it uses `bg-background` or similar, that needs updating.

**Step 2: Add the mesh background as the very first child of the hero section**

After the opening tag of the hero section div/motion.div, add:

```tsx
          {/* Animated gradient mesh background */}
          <div className="absolute inset-0 bg-mesh pointer-events-none" aria-hidden="true" />

          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
              opacity: 0.4,
            }}
          />
```

**Step 3: If the hero section has a solid bg class, remove it**

Check if the hero section has `bg-background`, `bg-navy`, or similar. Remove any background color class from the hero section — the mesh provides the background.

**Step 4: Build and verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: Home hero - add animated gradient mesh + noise texture background"
```

---

### Task 10: Update Home.tsx Hero Headline to Word-by-Word Stagger

**Files:**
- Modify: `anavi/client/src/pages/Home.tsx`

The `TextReveal` component from `AwwwardsAnimations.tsx` already handles word-by-word animation with `type="word"`. The existing Home.tsx imports it and likely uses it — but we need to verify the timing matches the PRD spec (40ms stagger, ease-out-expo).

**Step 1: Find the hero headline in Home.tsx**

Search for the display headline — it will be around `<h1>` or a large heading element. It may already use `TextReveal` or `SplitText`.

**Step 2: Wrap the headline with word-by-word reveal if not already done**

If the headline is a plain `<h1>`:

```tsx
<h1 className="font-display text-white">
  The Private Market<br />
  <span className="text-gradient-gold">Operating System</span>
</h1>
```

Replace with `TextReveal` wrapping (note: `TextReveal` accepts a string, not JSX, so use two separate TextReveal instances for the two lines):

```tsx
<div className="font-display text-white">
  <TextReveal
    type="word"
    delay={0.08}
    className="block font-display text-white"
  >
    The Private Market
  </TextReveal>
  <TextReveal
    type="word"
    delay={0.28}
    className="block font-display text-gradient-gold"
  >
    Operating System
  </TextReveal>
</div>
```

**Step 3: Verify that the `TextReveal` import is already present** (it should be at line ~26 of Home.tsx from `AwwwardsAnimations`)

If not, add to imports:
```tsx
import { ..., TextReveal } from "@/components/AwwwardsAnimations";
```

**Step 4: Build and verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: Home hero - word-by-word stagger headline with gradient gold accent"
```

---

### Task 11: Add HUD Floating Accent Element to Hero

**Files:**
- Modify: `anavi/client/src/pages/Home.tsx`

A decorative HUD element — positioned top-right of the hero, showing a few key metrics in mono font. Signals "data platform."

**Step 1: Add this after the mesh/noise divs, inside the hero section, positioned absolutely top-right**

```tsx
          {/* HUD accent element */}
          <motion.div
            className="absolute top-8 right-8 hidden lg:block animate-hud-float pointer-events-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            <div className="glass-dark rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22D4F5] animate-glow-pulse" />
                <span className="font-data-hud text-[10px] text-white/40 uppercase tracking-widest">
                  System Status
                </span>
              </div>
              <div className="space-y-1">
                {[
                  { label: "Trust Engine", value: "ACTIVE", color: "#22D4F5" },
                  { label: "Matches Live", value: "247", color: "#C4972A" },
                  { label: "Deal Rooms", value: "89", color: "#9B7CF8" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between gap-6">
                    <span className="font-data-hud text-[10px] text-white/40">{label}</span>
                    <span className="font-data-hud text-[10px]" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
```

**Step 2: Build and verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: Home hero - add HUD floating accent element with live metrics display"
```

---

### Task 12: Update Home.tsx Section Backgrounds to Dark Canvas Depth

**Files:**
- Modify: `anavi/client/src/pages/Home.tsx`

The sections below the hero need to follow the depth layering: `canvas-void` → `canvas-deep` → `canvas-mid` → `canvas-deep` → `canvas-mid` → `canvas-void`.

**Step 1: Identify each major section**

Open `Home.tsx` and find section-level divs (usually `<section>` elements or large `<div>` with `id=` attributes). They will have `bg-background`, `bg-muted`, `bg-white`, or similar. There should be ~5 sections after the hero.

**Step 2: Apply the canvas depth palette**

For each section (in order, after hero):
- Problem statement section: change to `bg-canvas-deep`
- Five pillars section: change to `bg-canvas-mid`
- Trust score section: change to `bg-canvas-deep`
- How it works section: change to `bg-canvas-mid`
- CTA footer section: change to `bg-canvas-void`

Also update any text colors from `text-foreground` → `text-white` or `text-white/70` for section body text on dark backgrounds.

**Step 3: Update card backgrounds in the sections**

Cards that used `bg-card` or `bg-white` should become `glass-dark` on the dark canvas. Find card elements in the five pillars / how-it-works sections and update:

From: `className="... bg-card border border-border ..."`
To:   `className="... glass-dark ..."`

**Step 4: Build and verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: Home - dark canvas depth layering across all sections, glass cards"
```

---

### Task 13: Add Scroll-Linked Reveals to Home.tsx Sections

**Files:**
- Modify: `anavi/client/src/pages/Home.tsx`

The `FadeInView`, `RevealOnScroll`, and `SmoothReveal` components already exist. The task is ensuring each section's content uses `SmoothReveal` with proper delays, and that list items stagger using `StaggeredList`.

**Step 1: Import SmoothReveal + StaggeredList if not already imported**

Check the existing import from PremiumAnimations (line ~20–41). If missing, add:
```tsx
import { ..., SmoothReveal, StaggeredList } from "@/components/PremiumAnimations";
```

**Step 2: Wrap each section heading with SmoothReveal**

For each section heading `<h2>`:

```tsx
<SmoothReveal direction="up" delay={0}>
  <h2 className="font-heading-tight text-white ...">Section Title</h2>
</SmoothReveal>
```

**Step 3: Wrap feature card lists with StaggeredList**

For any grid of feature cards (the five pillars, how-it-works steps):

From:
```tsx
<div className="grid grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

To:
```tsx
<StaggeredList className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.08}>
  {items.map(item => <Card key={item.id} {...item} />)}
</StaggeredList>
```

**Step 4: Add hover rise to feature cards**

For each feature card div, add Framer Motion `whileHover`:

```tsx
<motion.div
  className="glass-dark rounded-xl p-6 ..."
  whileHover={{ y: -4, boxShadow: "0 20px 60px rgb(0 0 0 / 0.28), 0 0 40px oklch(0.75 0.18 200 / 0.12)" }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
>
```

**Step 5: Build and verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: Home - scroll-linked reveals, staggered lists, card hover rise"
```

---

## Phase 3 — Login Page

### Task 14: Rebuild Login.tsx with Dark Canvas + Glass Panel

**Files:**
- Modify: `anavi/client/src/pages/Login.tsx`

Current Login has a two-column layout: left dark panel (navy), right white form panel. We're replacing with: full-viewport dark canvas + centered glass panel.

**Step 1: Add Framer Motion and motion imports to Login.tsx**

Current Login.tsx has no Framer Motion. Add at the top:

```tsx
import { motion } from "framer-motion";
import { scaleInVariant } from "@/lib/motion";
```

**Step 2: Replace the root return div**

Current: `<div className="flex min-h-screen font-sans">`

The existing two-panel structure needs a complete restructure. The new structure:

```tsx
  return (
    <div className="relative min-h-screen bg-mesh flex items-center justify-center overflow-hidden font-sans">

      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "oklch(0.65 0.19 230 / 0.06)", filter: "blur(80px)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "oklch(0.65 0.22 280 / 0.05)", filter: "blur(80px)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "oklch(0.72 0.14 70 / 0.04)", filter: "blur(60px)" }} />

      {/* Glass panel */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial="hidden"
        animate="visible"
        variants={scaleInVariant}
      >
        <div className="glass-dark rounded-2xl p-8 md:p-10 space-y-6">

          {/* Wordmark */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <span className="text-2xl font-bold text-white tracking-tight">@navi</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D4F5] animate-glow-pulse" />
            </div>
            <p className="text-sm text-white/40">The Private Market Operating System</p>
          </div>

          {/* Form (existing handleSubmit logic — keep unchanged) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#22D4F5]/50 focus:bg-white/[0.08] transition-all duration-200 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#22D4F5]/50 focus:bg-white/[0.08] transition-all duration-200 text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C4972A] text-[#060A12] font-semibold text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </motion.button>
          </form>

          {/* Footer links */}
          <div className="flex items-center justify-between text-xs">
            <Link href="/forgot-password" className="text-white/30 hover:text-white/60 transition-colors">
              Forgot password?
            </Link>
            <Link href="/register" className="text-white/30 hover:text-white/60 transition-colors">
              Create account
            </Link>
          </div>

        </div>
      </motion.div>

    </div>
  );
```

**Step 3: Remove the old imports that are no longer needed**

The `Shield` icon from lucide-react was used in the old left panel. Remove it if it's no longer referenced.

**Step 4: Verify TypeScript (no functional logic changed — form still works)**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check 2>&1 | tail -20
```

**Step 5: Build**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add client/src/pages/Login.tsx
git commit -m "feat: Login - dark canvas glass panel with animated entry, gold CTA, glow inputs"
```

---

## Phase 4 — Onboarding Flow

### Task 15: Add Progress Rail with Glow Nodes to OnboardingFlow.tsx

**Files:**
- Modify: `anavi/client/src/pages/OnboardingFlow.tsx`

The OnboardingFlow.tsx is 1111 lines. We need to add:
1. A vertical progress rail component (left side)
2. Glow node states (active/complete/pending)

**Step 1: Open OnboardingFlow.tsx and find the step state management**

Look for a `currentStep` or `step` state variable. This tells us what step we're on.

**Step 2: Find the layout structure**

Look for the outer wrapper — it's likely a `div` with flex or grid. We'll add a left rail alongside the existing content.

**Step 3: Add a ProgressRail component as a sibling to the main content**

Find the outermost return div (the one wrapping all step content) and wrap it in a flex container, adding the rail:

```tsx
{/* Add at the top of the main layout div — before the step content */}
<div className="hidden lg:flex flex-col items-center gap-0 w-48 py-8 flex-shrink-0">
  {/* Vertical connecting line */}
  <div className="absolute top-8 bottom-8 left-24 w-px bg-white/10" />

  {STEPS.map((step, i) => {
    const isComplete = i < currentStep;
    const isActive   = i === currentStep;
    const isPending  = i > currentStep;

    return (
      <div key={step.id} className="relative flex flex-col items-center">
        {/* Node */}
        <div className={[
          "relative z-10 w-3 h-3 rounded-full transition-all duration-500",
          isComplete ? "progress-node-complete" : "",
          isActive   ? "progress-node-active"   : "",
          isPending  ? "progress-node-pending"  : "",
        ].join(" ")}>
          {isComplete && (
            <motion.svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 12 12"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.path
                d="M2 6 L5 9 L10 3"
                stroke="#0D1628"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </div>

        {/* Label */}
        <span className={[
          "mt-2 text-[10px] font-semibold uppercase tracking-widest transition-colors duration-300",
          isActive   ? "text-[#22D4F5]"  : "",
          isComplete ? "text-[#C4972A]"  : "",
          isPending  ? "text-white/25"   : "",
        ].join(" ")}>
          {step.label}
        </span>

        {/* Connector to next node */}
        {i < STEPS.length - 1 && (
          <div className="h-8 w-px my-1 bg-white/10" />
        )}
      </div>
    );
  })}
</div>
```

**Note:** Replace `STEPS` and `step.id`, `step.label`, `currentStep` with whatever variable names are actually used in OnboardingFlow.tsx (examine lines 1–100 to find them).

**Step 4: Add motion import if not present**

```tsx
import { motion, AnimatePresence } from "framer-motion";
```

**Step 5: Build and verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add client/src/pages/OnboardingFlow.tsx
git commit -m "feat: OnboardingFlow - add glow progress rail with complete/active/pending node states"
```

---

### Task 16: Add Step Transition Animation to OnboardingFlow.tsx

**Files:**
- Modify: `anavi/client/src/pages/OnboardingFlow.tsx`

**Step 1: Find where step content is conditionally rendered**

Look for a pattern like:
```tsx
{currentStep === 0 && <StepOne />}
{currentStep === 1 && <StepTwo />}
```
Or a switch statement, or a step component array rendered by index.

**Step 2: Wrap step content in AnimatePresence + motion.div**

Replace the current step rendering pattern with:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 20, filter: "blur(6px)" }}
    animate={{ opacity: 1, x: 0,  filter: "blur(0px)" }}
    exit={{    opacity: 0, x: -20, filter: "blur(6px)" }}
    transition={{
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1],
    }}
  >
    {/* existing step content here */}
  </motion.div>
</AnimatePresence>
```

The `key={currentStep}` is critical — AnimatePresence uses it to detect when to animate out the old content and in the new.

**Step 3: Add progress bar at the top of the onboarding layout**

Find the outermost layout container and add as its first child:

```tsx
{/* Cinematic progress bar */}
<div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-white/5">
  <motion.div
    className="h-full bg-[#22D4F5]"
    style={{ boxShadow: "0 0 8px oklch(0.75 0.18 200 / 0.60)" }}
    animate={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
    transition={{ type: "spring", stiffness: 200, damping: 25 }}
  />
</div>
```

Replace `TOTAL_STEPS` with the actual total step count.

**Step 4: Build and verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add client/src/pages/OnboardingFlow.tsx
git commit -m "feat: OnboardingFlow - cinematic step transitions with AnimatePresence + glow progress bar"
```

---

## Phase 5 — Global Polish

### Task 17: Update DashboardLayout.tsx Sidebar Depth + Nav

**Files:**
- Modify: `anavi/client/src/components/DashboardLayout.tsx`

**Step 1: Deepen the sidebar background**

Find the sidebar div — it uses `bg-sidebar` or `bg-[#0A1628]` currently. Update to use the deeper navy:

Find in DashboardLayout.tsx any inline style or class setting the sidebar background. Update:

From: `style={{ backgroundColor: "#0A1628" }}` or `className="... bg-[#0A1628] ..."`
To:   `className="... bg-[#060A12] ..."` (canvas-void — deepest)

**Step 2: Add gold active-state left glow to sidebar nav items**

Find the active nav item styling (the one that highlights the current route). It likely uses a background color change. Add the left-border gold glow:

From (active state class):
```tsx
"bg-sidebar-accent text-sidebar-accent-foreground"
```

To:
```tsx
"bg-white/8 text-white" // and add box-shadow inline
```

For the active item wrapper, add:
```tsx
style={isActive ? { boxShadow: "inset 3px 0 0 #C4972A" } : {}}
```

**Step 3: Update the top header bar to glass-light**

Find the top bar (if it exists in DashboardLayout) — it may have `bg-background` or `bg-white`. Update to glass:

From: `className="... bg-background border-b ..."`
To:   `className="... glass-light border-b border-border/40 ..."`

**Step 4: Build and verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add client/src/components/DashboardLayout.tsx
git commit -m "feat: DashboardLayout - deeper sidebar (canvas-void), gold active glow, glass topbar"
```

---

### Task 18: Add Kinetic Press Feedback to Primary Buttons (Global)

**Files:**
- Modify: `anavi/client/src/components/ui/button.tsx` (if it exists — check first)

**Step 1: Find the primary button component**

```bash
ls /home/ariel/Documents/anavi-main/anavi/client/src/components/ui/
```

Look for `button.tsx`. This is the shadcn Button component. It uses class-variance-authority (CVA).

**Step 2: Read button.tsx to understand current structure**

The shadcn Button renders a `<button>` element (or polymorphic via `asChild`). It won't have Framer Motion by default.

**Step 3: Wrap the button in Framer Motion for kinetic press**

The cleanest approach is to add `whileTap` directly to the motion wrapper. Since shadcn Button renders a plain `<button>`, we don't modify the primitive — instead, we update calling sites.

For the **primary CTA button** in Home.tsx, Login.tsx, and other key locations, ensure they use `motion.button` or wrap with `motion.div`:

Pattern to apply at each CTA site:
```tsx
<motion.div
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 500, damping: 15 }}
>
  <Button ...>...</Button>
</motion.div>
```

**Step 4: Apply this pattern to at least the 3 highest-visibility CTAs:**
- Home.tsx nav "Enter App" button
- Home.tsx hero primary CTA
- Login.tsx "Sign In" button (already done in Task 14 with `motion.button`)

**Step 5: Build and verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
git add client/src/pages/Home.tsx client/src/pages/Login.tsx
git commit -m "feat: add kinetic press feedback (whileTap spring) to primary CTA buttons"
```

---

### Task 19: Final Build Check + Smoke Test

**Step 1: Run full TypeScript check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm check 2>&1
```

Expected: no errors.

**Step 2: Run full production build**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm build 2>&1
```

Expected: clean build, dist files output.

**Step 3: Start dev server and manually verify**

```bash
cd /home/ariel/Documents/anavi-main/anavi && pnpm dev
```

Open `http://localhost:5000` (or whatever port Vite uses) and verify:
- [ ] Home page: dark canvas background visible (not cream)
- [ ] Home nav: glass-dark (not opaque navy)
- [ ] Home hero: animated gradient mesh moving slowly in background
- [ ] Home hero: HUD element visible top-right
- [ ] Login page: full dark canvas with centered glass panel
- [ ] Login: gold "Sign In" button
- [ ] Page transitions: scale + blur (not y-axis slide)
- [ ] Cursor: ambient glow follows mouse on dark pages
- [ ] Sidebar: deeper black (canvas-void)
- [ ] Sidebar active item: gold left glow

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: cinematic UI Phase 1-5 complete - dark canvas, glass panels, mesh bg, kinetic motion"
```

---

## Implementation Notes

### File Touch Summary

| File | Type | Purpose |
|------|------|---------|
| `index.html` | Modify | Add Inter + JetBrains Mono fonts |
| `client/src/index.css` | Modify | Canvas tokens, keyframes, utility classes |
| `client/src/lib/motion.ts` | Create | Shared FM presets |
| `client/src/components/CursorGlow.tsx` | Create | Global ambient cursor light |
| `client/src/App.tsx` | Modify | Mount CursorGlow |
| `client/src/components/PageTransition.tsx` | Modify | Crossfade + scale transition |
| `client/src/pages/Home.tsx` | Modify | Dark canvas, mesh, HUD, glass cards |
| `client/src/pages/Login.tsx` | Modify | Dark canvas glass panel |
| `client/src/pages/OnboardingFlow.tsx` | Modify | Progress rail + step transitions |
| `client/src/components/DashboardLayout.tsx` | Modify | Sidebar depth, gold active glow |

### DO NOT Touch (existing, already good)
- `PremiumAnimations.tsx` — use as-is: Card3D, SmoothReveal, StaggeredList, GlowingBorder
- `AwwwardsAnimations.tsx` — use as-is: Magnetic, TextReveal, AnimatedCounter, Glow, Marquee
- All server code, tRPC routes, database schema

### Testing Strategy

No automated tests needed for these purely visual changes (the existing vitest config only tests server code). Verification is visual + TypeScript compilation.

For each task: `pnpm check` → `pnpm build` → visual inspection at `pnpm dev`.
