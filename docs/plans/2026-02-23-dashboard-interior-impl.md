# Dashboard Interior & Flow — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade all 7 authenticated dashboard pages to a premium elevated-light aesthetic, and wire a personalized welcome banner that flows from the onboarding persona into the dashboard.

**Architecture:** Elevated light — `#F3F7FC` base unchanged, cards become frosted glass-light panels (`.card-elevated`). Each page keeps its existing tRPC logic and component structure; only visual layer is touched. Flow: Dashboard reads `localStorage` `anavi_onboarding` persona on first load and shows a personalized welcome banner.

**Tech Stack:** React 19, TypeScript, Framer Motion 12, Tailwind CSS v4. No new npm deps. Fonts/tokens/utilities already in `index.css` from the cinematic upgrade.

**Verification command:** `cd /home/ariel/Documents/anavi-main/anavi && npm run check 2>&1 | tail -20 && npm run build 2>&1 | tail -10`

---

## Phase 1 — Foundation

### Task 1: Add `.card-elevated` CSS utility to index.css

**Files:**
- Modify: `anavi/client/src/index.css` (append inside the final `@layer utilities { }` block, after `.border-gold-glow`)

**Step 1: Append the utility at the end of the last `@layer utilities` block**

The last line of `index.css` is `}` closing the `@layer utilities` block (line 539). Insert before that closing brace:

```css
  /* ── Elevated light card — for authenticated dashboard pages ── */
  .card-elevated {
    background: rgb(255 255 255 / 0.75);
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    border: 1px solid rgb(255 255 255 / 0.70);
    box-shadow:
      0 4px 24px rgb(10 22 40 / 0.08),
      0 1px 4px rgb(10 22 40 / 0.04);
    border-radius: 16px;
    transition: box-shadow 200ms ease, transform 200ms ease;
  }

  .card-elevated:hover {
    box-shadow:
      0 8px 40px rgb(10 22 40 / 0.12),
      0 2px 8px rgb(10 22 40 / 0.06);
  }

  /* Heading inside dashboard — Inter 800 tight tracking */
  .dash-heading {
    font-family: var(--font-display);
    font-weight: 800;
    letter-spacing: -0.04em;
    color: #0A1628;
  }

  /* Data HUD label — mono tabular */
  .data-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgb(30 58 95 / 0.50);
    font-variant-numeric: tabular-nums;
  }
```

**Step 2: Verify build**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run build 2>&1 | tail -10
```

Expected: clean build, no CSS parse errors.

**Step 3: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/index.css && git commit -m "feat: add .card-elevated, .dash-heading, .data-label utilities for dashboard interior"
```

---

### Task 2: Welcome Banner component + Dashboard flow wiring

**Files:**
- Modify: `anavi/client/src/pages/Dashboard.tsx`

No new file — add the `WelcomeBanner` function component at the top of `Dashboard.tsx` (before the `DashboardSkeleton` function, around line 121), then render it inside the main Dashboard return.

**Step 1: Add the WelcomeBanner function component**

In `Dashboard.tsx`, after the existing imports and before the `DashboardSkeleton` function (around line 121), insert:

```tsx
// ── Welcome Banner (shown once after onboarding) ───────────────────────────
const PERSONA_SUBTITLES: Record<string, string> = {
  originator: "Your first relationship has been custodied. Deal matching is live.",
  investor:   "Your investment intent is broadcasting to verified counterparties.",
  developer:  "Your project is verified. Qualified capital matches are incoming.",
  allocator:  "Your fund mandate is active. Institutional pipeline is open.",
  acquirer:   "Your acquisition criteria are live. Confidential matches are sourcing.",
};

const PERSONA_LABELS: Record<string, string> = {
  originator: "Deal Originator",
  investor:   "Investor",
  developer:  "Project Developer",
  allocator:  "Institutional Allocator",
  acquirer:   "Strategic Acquirer",
};

function WelcomeBanner({ name, persona, onDismiss }: { name: string; persona: string; onDismiss: () => void }) {
  const subtitle = PERSONA_SUBTITLES[persona] ?? "Your profile is ready.";
  const personaLabel = PERSONA_LABELS[persona] ?? persona;

  return (
    <div className="mb-6 card-elevated border-l-4 border-l-[#C4972A] p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C4972A]/15">
          <svg className="h-4 w-4 text-[#C4972A]" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0A1628]">
            Welcome, {name}. Your {personaLabel} profile is ready.
          </p>
          <p className="mt-0.5 text-sm text-[#1E3A5F]/70">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="mt-0.5 shrink-0 rounded p-1 text-[#1E3A5F]/40 hover:bg-[#1E3A5F]/8 hover:text-[#1E3A5F]/70 transition-colors"
        aria-label="Dismiss welcome banner"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
    </div>
  );
}
```

**Step 2: Add banner state inside the Dashboard component**

Inside the `Dashboard` function (after the existing `const { user }` line, around line 183), add:

```tsx
  // Welcome banner: read onboarding persona from localStorage
  const [welcomePersona, setWelcomePersona] = React.useState<string | null>(() => {
    try {
      const raw = localStorage.getItem("anavi_onboarding");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Only show if not yet welcomed
      const welcomed = localStorage.getItem("anavi_welcomed");
      if (welcomed) return null;
      return parsed.persona ?? null;
    } catch {
      return null;
    }
  });

  const handleDismissWelcome = React.useCallback(() => {
    localStorage.setItem("anavi_welcomed", "true");
    setWelcomePersona(null);
  }, []);
```

You'll also need to add `React` to the import — check if React is already imported. In React 19 with the new JSX transform it may not be. Add if missing:
```tsx
import React from "react";
```

**Step 3: Render WelcomeBanner in the JSX**

Find the greeting section (around line 210):
```tsx
    <DashboardLayout>
      {/* E13: Personalized greeting */}
      <FadeInView>
        <div className="mb-6 flex items-baseline justify-between">
```

Replace with:
```tsx
    <DashboardLayout>
      {welcomePersona && (
        <WelcomeBanner
          name={user?.name?.split(" ")[0] ?? "there"}
          persona={welcomePersona}
          onDismiss={handleDismissWelcome}
        />
      )}
      {/* E13: Personalized greeting */}
      <FadeInView>
        <div className="mb-6 flex items-baseline justify-between">
```

**Step 4: Verify TypeScript**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run check 2>&1 | tail -20
```

Expected: no errors.

**Step 5: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/Dashboard.tsx && git commit -m "feat: Dashboard - personalized welcome banner reads onboarding persona from localStorage"
```

---

## Phase 2 — Dashboard Page

### Task 3: Upgrade Dashboard.tsx cards, typography, and animations

**Files:**
- Modify: `anavi/client/src/pages/Dashboard.tsx`

This task replaces the `DashCard` component and upgrades the Trust Ring animation, activity feed cards, Market Depth bars, and typography.

**Step 1: Replace `DashCard` component**

Find (around line 104–119):
```tsx
function DashCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#D1DCF0] bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1E3A5F]">
        {title}
      </h3>
      {children}
    </div>
  );
}
```

Replace with:
```tsx
function DashCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-elevated p-6 ${className}`}>
      <h3 className="mb-4 data-label">
        {title}
      </h3>
      {children}
    </div>
  );
}
```

**Step 2: Update `DashboardSkeleton` skeleton cards**

Find every `rounded-lg border border-[#D1DCF0] bg-white` in the skeleton (lines 125–157) and change to `card-elevated`. There are 4–5 occurrences. Replace all:

From: `className="rounded-lg border border-[#D1DCF0] bg-white p-6"`
To:   `className="card-elevated p-6"`

**Step 3: Upgrade Trust Score widget card**

Find (around line 232):
```tsx
              <div className="group cursor-pointer rounded-lg border border-[#D1DCF0] bg-white p-6 text-center transition-all duration-200 hover:border-[#2563EB]/40 hover:shadow-lg">
```

Replace with:
```tsx
              <div className="group cursor-pointer card-elevated p-6 text-center hover:translate-y-[-2px]">
```

**Step 4: Upgrade Trust Score number typography**

Find (around line 239):
```tsx
                  <span
                    className="text-trust-score absolute inset-0 flex items-center justify-center"
                    style={{ color: scoreColor }}
                  >
```

Replace with:
```tsx
                  <span
                    className="font-data-hud text-4xl font-bold absolute inset-0 flex items-center justify-center"
                    style={{ color: scoreColor }}
                  >
```

**Step 5: Upgrade activity heading**

Find (around line 295):
```tsx
          <h2 className="mb-4 text-heading text-[#0A1628]">Activity</h2>
```

Replace with:
```tsx
          <h2 className="mb-4 dash-heading text-2xl">Activity</h2>
```

**Step 6: Upgrade activity notification cards**

Find (around line 304):
```tsx
                      className={`rounded-lg border border-[#D1DCF0] border-l-4 bg-white p-4 hover-lift ${style.border}`}
```

Replace with:
```tsx
                      className={`card-elevated border-l-4 p-4 hover:translate-y-[-2px] ${style.border}`}
```

**Step 7: Upgrade activity empty state wrapper**

Find (around line 337):
```tsx
            <div className="rounded-lg border border-[#D1DCF0] bg-white p-6">
              <EmptyState {...EMPTY_STATES.notifications} />
            </div>
```

Replace with:
```tsx
            <div className="card-elevated p-6">
              <EmptyState {...EMPTY_STATES.notifications} />
            </div>
```

**Step 8: Animate Market Depth bars with Framer Motion**

Add `motion` import — check if `framer-motion` is already imported in Dashboard.tsx. If not, add:
```tsx
import { motion } from "framer-motion";
```

Then find `MarketDepthBar` function (around line 167):
```tsx
function MarketDepthBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-right font-data-mono text-xs text-[#1E3A5F]/70">{value}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#0A1628]/5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: label === "buyers" ? "#2563EB" : "#C4972A" }}
        />
      </div>
    </div>
  );
}
```

Replace with:
```tsx
function MarketDepthBar({ label, value, max, index = 0 }: { label: string; value: number; max: number; index?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-right font-data-hud text-[10px] text-[#1E3A5F]/60">{value}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#0A1628]/6">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: label === "buyers" ? "#2563EB" : "#C4972A" }}
        />
      </div>
    </div>
  );
}
```

Then update the call sites in the JSX where `MarketDepthBar` is rendered (inside the `MARKET_DEPTH.map`) — add an `index` prop:
```tsx
{MARKET_DEPTH.map((m, i) => (
  <div key={m.sector}>
    <p className="mb-1.5 text-xs font-semibold text-[#0A1628]">{m.sector}</p>
    <MarketDepthBar label="buyers" value={m.buyers} max={maxDepth} index={i * 2} />
    <MarketDepthBar label="sellers" value={m.sellers} max={maxDepth} index={i * 2 + 1} />
  </div>
))}
```

**Step 9: Upgrade payout rows card wrapper**

Find the payout rows (around line 394):
```tsx
                      className="flex items-center justify-between rounded border border-[#D1DCF0] px-3 py-2 text-sm hover-lift"
```

Replace with:
```tsx
                      className="flex items-center justify-between card-elevated px-3 py-2.5 text-sm hover:translate-y-[-1px]"
```

**Step 10: Upgrade greeting heading**

Find (around line 213):
```tsx
            <h1 className="text-display text-[#0A1628]">
```

Replace with:
```tsx
            <h1 className="dash-heading text-3xl">
```

**Step 11: Verify TypeScript + build**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run check 2>&1 | tail -20
```

Expected: no errors.

**Step 12: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/Dashboard.tsx && git commit -m "feat: Dashboard - card-elevated, dash-heading typography, animated depth bars, glass cards"
```

---

## Phase 3 — Secondary Pages

### Task 4: Upgrade Relationships.tsx

**Files:**
- Modify: `anavi/client/src/pages/Relationships.tsx`

**Step 1: Read the full component structure**

Read the file to understand what card patterns it uses:
```bash
grep -n "bg-white\|border-\[#D1DCF0\]\|rounded-lg border\|Card\b" /home/ariel/Documents/anavi-main/anavi/client/src/pages/Relationships.tsx | head -40
```

**Step 2: Replace all `bg-white` card containers with `card-elevated`**

Pattern to replace (replace all occurrences):

From: `className="... rounded-lg border border-[#D1DCF0] bg-white ..."`
To:   `className="... card-elevated ..."`

From: `className="rounded-lg bg-white border border-[#D1DCF0] ..."`
To:   `className="card-elevated ..."`

Also from: `<Card` (shadcn Card) — if it appears, add `className="card-elevated"` to the Card component.

**Step 3: Add custody hash styling**

Find where the hash is displayed (search for `generateFakeHash` call or hash display). Update the hash span to use `font-data-hud`:

Find pattern like:
```tsx
<span className="... font-mono text-xs ...">{hash}</span>
```
Replace with:
```tsx
<span className="font-data-hud text-[10px] text-[#1E3A5F]/50">{hash}</span>
```

**Step 4: Upgrade page heading**

Find the page `<h1>` or heading at the top of the page JSX. Update to:
```tsx
<h1 className="dash-heading text-3xl">Relationships</h1>
```

**Step 5: Upgrade filter bar styling**

Find the search/filter bar container. Update:
From: `className="... bg-white border border-[#D1DCF0] ..."`
To:   `className="card-elevated ..."`

**Step 6: Verify TypeScript**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run check 2>&1 | grep -i "relationship\|error" | head -20
```

Expected: no new errors.

**Step 7: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/Relationships.tsx && git commit -m "feat: Relationships - card-elevated glass cards, custody hash font-data-hud, dash-heading"
```

---

### Task 5: Upgrade DealMatching.tsx

**Files:**
- Modify: `anavi/client/src/pages/DealMatching.tsx`

**Step 1: Identify all white card patterns**

```bash
grep -n "bg-white\|border-\[#D1DCF0\]\|rounded-lg border\|Card\b" /home/ariel/Documents/anavi-main/anavi/client/src/pages/DealMatching.tsx | head -40
```

**Step 2: Replace all card containers with `card-elevated`**

Same pattern as Task 4:
From: `rounded-lg border border-[#D1DCF0] bg-white`
To:   `card-elevated`

**Step 3: Upgrade match score display to `font-data-hud`**

Search for where compatibility score percentage is displayed (likely `compatibilityScore` or `score` field):

```bash
grep -n "score\|compatib\|%" /home/ariel/Documents/anavi-main/anavi/client/src/pages/DealMatching.tsx | head -20
```

Update the score display span:
```tsx
<span className="font-data-hud text-2xl font-bold text-[#22D4F5]">{score}%</span>
```

**Step 4: Add cyan glow border to top match card**

Find where match cards are rendered. For the first/top match (index === 0 or highest score), add:
```tsx
className={`card-elevated p-5 hover:translate-y-[-2px] transition-transform ${index === 0 ? "border-[#22D4F5]/25" : ""}`}
style={index === 0 ? { boxShadow: "0 4px 24px rgb(10 22 40 / 0.08), 0 0 0 1px rgb(34 212 245 / 0.20)" } : undefined}
```

**Step 5: Upgrade page heading**

```tsx
<h1 className="dash-heading text-3xl">Deal Matching</h1>
```

**Step 6: Upgrade tab/filter buttons styling**

Find the intent type tabs or filter buttons. Update active state to use gold underline:
From active: `bg-[#C4972A] text-white` (or similar)
Keep as-is if it uses `btn-gold` — that already has gold styling.

**Step 7: Verify TypeScript**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run check 2>&1 | grep -i "dealmatching\|error" | head -20
```

**Step 8: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/DealMatching.tsx && git commit -m "feat: DealMatching - card-elevated, cyan match score, top-match glow border"
```

---

### Task 6: Upgrade DealRooms.tsx

**Files:**
- Modify: `anavi/client/src/pages/DealRooms.tsx`

**Step 1: Identify all white card patterns**

```bash
grep -n "bg-white\|border-\[#D1DCF0\]\|rounded-lg border\|Card\b" /home/ariel/Documents/anavi-main/anavi/client/src/pages/DealRooms.tsx | head -40
```

**Step 2: Replace all card containers with `card-elevated`**

Same pattern as previous tasks.

**Step 3: Upgrade status badges to use consistent badge system**

Find where `getStatusClass` result is used in JSX. The existing classes (`status-active`, `status-nda-pending`, etc.) may already be styled — check `index.css` for `.status-*` classes. If they use `bg-white border` — upgrade them to match the badge system:

Active: `bg-[#22D4F5]/10 text-[#22D4F5]/80 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`
NDA Pending: `bg-[#F59E0B]/15 text-[#F59E0B] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`
Completed: `bg-[#059669]/15 text-[#059669] ...`

**Step 4: Upgrade time display to `font-data-hud`**

Find `formatRelativeTime` call sites and wrap in:
```tsx
<span className="font-data-hud text-[10px] text-[#1E3A5F]/50">{formatRelativeTime(room.createdAt)}</span>
```

**Step 5: Upgrade status filter bar**

Find the filter tabs row. Update container:
From: `className="... bg-white rounded-lg border border-[#D1DCF0] ..."`
To:   `className="card-elevated p-1.5 flex gap-1"`

Active filter: `className="rounded-md px-3 py-1.5 text-xs font-semibold bg-[#0A1628] text-white"`
Inactive filter: `className="rounded-md px-3 py-1.5 text-xs font-medium text-[#1E3A5F]/60 hover:text-[#0A1628] hover:bg-[#0A1628]/5"`

**Step 6: Upgrade page heading**

```tsx
<h1 className="dash-heading text-3xl">Deal Rooms</h1>
```

**Step 7: Verify TypeScript**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run check 2>&1 | grep -i "dealroom\|error" | head -20
```

**Step 8: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/DealRooms.tsx && git commit -m "feat: DealRooms - card-elevated, consistent status badges, font-data-hud timestamps"
```

---

### Task 7: Upgrade Verification.tsx

**Files:**
- Modify: `anavi/client/src/pages/Verification.tsx`

**Step 1: Identify all card patterns**

```bash
grep -n "bg-white\|border-\[#D1DCF0\]\|rounded-lg border\|<Card\b\|CardContent\|CardHeader" /home/ariel/Documents/anavi-main/anavi/client/src/pages/Verification.tsx | head -40
```

**Step 2: Replace shadcn `<Card>` usage with `card-elevated`**

The file imports `{ Card, CardContent, CardHeader, CardTitle }` from `@/components/ui/card`. Replace:

From:
```tsx
<Card>
  <CardHeader>
    <CardTitle>...</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

To:
```tsx
<div className="card-elevated p-6">
  <h3 className="mb-4 data-label">...</h3>
  ...
</div>
```

Note: Remove the `Card`, `CardContent`, `CardHeader`, `CardTitle` imports once they're no longer used.

**Step 3: Update verification dimension score rows**

The `DIMENSIONS` array has score values. Find where they render as rows (likely with a progress bar). Update the bar to match the animated pattern from Task 3:

```tsx
<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0A1628]/6">
  <div
    className="h-full rounded-full transition-all duration-1000"
    style={{
      width: `${dim.score}%`,
      background: dim.score > 80 ? "#059669" : dim.score > 60 ? "#C4972A" : "#2563EB"
    }}
  />
</div>
```

**Step 4: Upgrade TIER_FEATURES table**

Find the tier comparison table. Update the header row and cells to use `.card-elevated` for the tier column cards:
- Active tier column: `card-elevated border-[#C4972A]/25`
- Other tier columns: lighter treatment

**Step 5: Upgrade page heading**

```tsx
<h1 className="dash-heading text-3xl">Verification</h1>
```

**Step 6: Upgrade SmoothCounter for trust score if displayed**

If the trust score uses `SmoothCounter`, ensure it's rendered in `font-data-hud text-4xl font-bold`.

**Step 7: Remove now-unused shadcn Card imports**

```bash
grep -n "import.*Card\|from.*ui/card" /home/ariel/Documents/anavi-main/anavi/client/src/pages/Verification.tsx
```

Remove unused imports.

**Step 8: Verify TypeScript**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run check 2>&1 | grep -i "verification\|error" | head -20
```

**Step 9: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/Verification.tsx && git commit -m "feat: Verification - card-elevated replaces shadcn Card, animated score bars, dash-heading"
```

---

### Task 8: Upgrade Payouts.tsx

**Files:**
- Modify: `anavi/client/src/pages/Payouts.tsx`

**Step 1: Identify all card patterns**

```bash
grep -n "bg-white\|border-\[#D1DCF0\]\|rounded-lg border\|<Card\b\|CardContent\|CardHeader" /home/ariel/Documents/anavi-main/anavi/client/src/pages/Payouts.tsx | head -40
```

**Step 2: Replace shadcn Card usage with `card-elevated`**

Same pattern as Task 7 — replace `<Card><CardHeader>...<CardContent>` with `<div className="card-elevated p-6">`.

Remove unused Card imports.

**Step 3: Upgrade attribution summary header card**

Find the top-level summary card showing Lifetime Attribution / Next Payout. Update to:

```tsx
<div className="card-elevated p-6 mb-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Metric 1: Lifetime Attribution */}
    <div>
      <p className="data-label mb-1">Lifetime Attribution</p>
      <p className="font-data-hud text-3xl font-bold text-[#059669]">
        $<SmoothCounter value={lifetimeTotal} duration={1.2} />
      </p>
    </div>
    {/* Metric 2: Next Payout */}
    <div>
      <p className="data-label mb-1">Next Payout</p>
      <p className="font-data-hud text-3xl font-bold text-[#0A1628]">
        $<SmoothCounter value={nextPayoutAmount} duration={1} />
      </p>
    </div>
    {/* Metric 3: Pending */}
    <div>
      <p className="data-label mb-1">Pending</p>
      <p className="font-data-hud text-3xl font-bold text-[#F59E0B]">
        {pendingCount}
      </p>
    </div>
  </div>
</div>
```

Use the actual variable names from the file (check what `trpc.payout.list` returns and what stats are computed).

**Step 4: Upgrade payout list rows**

Find each payout row (inside the list). Update:

```tsx
<div className="card-elevated px-4 py-3 flex items-center justify-between hover:translate-y-[-1px] transition-transform">
  <div>
    <p className="font-data-hud text-base font-semibold text-[#0A1628]">
      {fmtCurrency(parseFloat(p.amount))}
    </p>
    <p className="data-label mt-0.5">{p.payoutType.replace(/_/g, " ")}</p>
  </div>
  <div className="flex items-center gap-3">
    <span className="data-label">{format(new Date(p.createdAt), "MMM d")}</span>
    {/* status badge */}
  </div>
</div>
```

**Step 5: Upgrade filter dropdowns**

Find `Select` components for status/type filters. Wrap in:
```tsx
<div className="flex gap-3 mb-4">
  {/* existing Select components */}
</div>
```

**Step 6: Upgrade page heading**

```tsx
<h1 className="dash-heading text-3xl">Payouts</h1>
```

**Step 7: Verify TypeScript**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run check 2>&1 | grep -i "payout\|error" | head -20
```

**Step 8: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/Payouts.tsx && git commit -m "feat: Payouts - card-elevated, attribution hero with SmoothCounter, font-data-hud amounts"
```

---

## Phase 4 — Tertiary Pages

### Task 9: Upgrade Settings.tsx

**Files:**
- Modify: `anavi/client/src/pages/Settings.tsx`

**Step 1: Upgrade outer heading**

Find (around line 43–50):
```tsx
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account, verification, and preferences
        </p>
      </div>
```

Replace with:
```tsx
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="dash-heading text-3xl">Settings</h1>
        <p className="mt-1.5 text-sm text-[#1E3A5F]/60">
          Manage your account, verification, and preferences
        </p>
      </div>
```

**Step 2: Upgrade tabs styling**

Find (around line 52–53):
```tsx
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
```

Replace with:
```tsx
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="card-elevated p-1 h-auto gap-0.5">
```

Find each `TabsTrigger`:
```tsx
          <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
```

Replace with:
```tsx
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#0A1628] data-[state=active]:text-white data-[state=active]:shadow-none rounded-md text-[#1E3A5F]/60 text-sm">
```

Apply this to ALL TabsTrigger elements (there should be 4: profile, verification, notifications, security).

**Step 3: Upgrade Tab content cards**

Find `TabsContent` children that use `<Card>`:
```tsx
          <TabsContent value="profile">
            <Card>
              <CardHeader>...</CardHeader>
              <CardContent>...</CardContent>
            </Card>
          </TabsContent>
```

Replace each `<Card>...<CardContent>` wrapper with `<div className="card-elevated p-6">`. Remove `<CardHeader>` — put title directly as `<h3 className="dash-heading text-lg mb-6">`.

**Step 4: Upgrade form field labels**

Find `<Label htmlFor="...">` elements. They'll render with default styling. Update to:
```tsx
<Label htmlFor="name" className="text-xs font-semibold text-[#1E3A5F]/60 uppercase tracking-wider">
```

**Step 5: Upgrade Save button**

Find `<Button>` with save text. Ensure it uses `btn-gold` or gold styling:
```tsx
<Button
  onClick={handleSaveProfile}
  disabled={updateProfileMutation.isPending}
  className="btn-gold px-6"
>
  {updateProfileMutation.isPending ? "Saving…" : "Save Changes"}
</Button>
```

**Step 6: Remove now-unused Card imports if any were removed**

```bash
grep -n "import.*Card\|from.*ui/card" /home/ariel/Documents/anavi-main/anavi/client/src/pages/Settings.tsx
```

Remove only if unused.

**Step 7: Verify TypeScript**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run check 2>&1 | grep -i "settings\|error" | head -20
```

**Step 8: Commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/pages/Settings.tsx && git commit -m "feat: Settings - card-elevated tab panels, dash-heading, gold save button, elevated form"
```

---

### Task 10: Final verification + DashboardLayout ambient gradient

**Files:**
- Modify: `anavi/client/src/components/DashboardLayout.tsx`

**Step 1: Add subtle ambient gradient to main content area**

Find (around line 243):
```tsx
        <main
          role="main"
          className="flex-1 overflow-y-auto pb-16 scrollbar-premium md:pb-0"
          style={{ backgroundColor: "#F3F7FC" }}
        >
```

Replace with:
```tsx
        <main
          role="main"
          className="flex-1 overflow-y-auto pb-16 scrollbar-premium md:pb-0 relative"
          style={{ backgroundColor: "#F3F7FC" }}
        >
          {/* Subtle ambient depth — very faint, non-animated for performance */}
          <div
            className="pointer-events-none absolute top-0 right-0 w-[600px] h-[400px]"
            style={{
              background: "radial-gradient(ellipse at top right, rgb(196 151 42 / 0.04) 0%, transparent 60%)",
            }}
            aria-hidden="true"
          />
```

**Step 2: Run full TypeScript check**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run check 2>&1
```

Expected: zero errors.

**Step 3: Run full production build**

```bash
cd /home/ariel/Documents/anavi-main/anavi && npm run build 2>&1 | tail -20
```

Expected: clean build.

**Step 4: Verify all pages load (dev server should already be running)**

Visual checklist at `http://localhost:3000`:
- [ ] `/dashboard` — glass cards, animated depth bars, welcome banner appears fresh user
- [ ] `/relationships` — card-elevated cards, hash in mono
- [ ] `/deal-matching` — top match has cyan glow
- [ ] `/deal-rooms` — consistent status badges
- [ ] `/verification` — card-elevated, no white boxes
- [ ] `/payouts` — attribution hero, animated counters
- [ ] `/settings` — tab panels glass-elevated, gold save button
- [ ] Sidebar + topbar still correct (dark sidebar, glass topbar)

**Step 5: Final commit**

```bash
cd /home/ariel/Documents/anavi-main/anavi && git add client/src/components/DashboardLayout.tsx && git commit -m "feat: DashboardLayout - subtle ambient gold gradient on content area"
```

---

## Implementation Notes

### Key patterns used (consistent across all tasks)

| Old | New |
|-----|-----|
| `rounded-lg border border-[#D1DCF0] bg-white p-6` | `card-elevated p-6` |
| `text-3xl font-bold tracking-tight` | `dash-heading text-3xl` |
| `font-mono text-xs text-[#1E3A5F]/60` | `font-data-hud text-[10px] text-[#1E3A5F]/50` |
| `<Card><CardHeader>...<CardContent>` | `<div className="card-elevated p-6">` |

### DO NOT touch
- All tRPC queries and mutations
- All form logic, state, event handlers
- Server code
- `PremiumAnimations.tsx`, `AwwwardsAnimations.tsx`
- `PageTransition.tsx`
- Any page not in the list above

### No tests needed
These are purely visual changes. The existing vitest config only covers server-side code. TypeScript compilation + `npm run build` is the full verification.

### File touch summary

| File | Type |
|------|------|
| `client/src/index.css` | Modify — add `.card-elevated`, `.dash-heading`, `.data-label` |
| `client/src/pages/Dashboard.tsx` | Modify — WelcomeBanner, DashCard, bars, typography |
| `client/src/pages/Relationships.tsx` | Modify — card-elevated, hash styling |
| `client/src/pages/DealMatching.tsx` | Modify — card-elevated, match score, cyan glow |
| `client/src/pages/DealRooms.tsx` | Modify — card-elevated, status badges, filter bar |
| `client/src/pages/Verification.tsx` | Modify — card-elevated replaces shadcn Card |
| `client/src/pages/Payouts.tsx` | Modify — card-elevated replaces shadcn Card, hero |
| `client/src/pages/Settings.tsx` | Modify — card-elevated tab panels, form upgrade |
| `client/src/components/DashboardLayout.tsx` | Modify — ambient gradient |
