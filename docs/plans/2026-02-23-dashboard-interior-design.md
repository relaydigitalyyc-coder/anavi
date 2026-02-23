# Dashboard Interior & Flow Design

**Date:** 2026-02-23
**Scope:** Onboarding → Dashboard logical flow + all 7 interior dashboard pages
**Approach:** Elevated light — `#F3F7FC` base, glass-light frosted cards, premium typography, cinematic reveals
**Theme:** Keep the dark cinematic shell (sidebar, topbar) from the previous upgrade; make the interior feel like a premium private-market Bloomberg terminal — clean authority, not startup SaaS

---

## 1. Flow — Onboarding → Dashboard

### Problem
`goToDashboard()` is a cold `navigate("/dashboard")`. No persona context, no acknowledgment of the work just done. The user arrives on a generic light dashboard with no connection to what they set up.

### Solution: Personalized Welcome Banner

**Mechanic:**
- Dashboard reads `localStorage.getItem("anavi_onboarding")` → `{ persona, formData, step }`
- On first visit (no `welcomed: true` flag), renders a `WelcomeBanner` above the greeting
- On dismiss (× button), sets `welcomed: true` in localStorage → never shows again
- PageTransition already handles the cinematic crossfade entry

**Banner content by persona:**

| Persona | Subtitle |
|---------|----------|
| `originator` | "Your first relationship has been custodied. Deal matching is live." |
| `investor` | "Your investment intent is broadcasting to verified counterparties." |
| `developer` | "Your project is verified. Qualified capital matches are incoming." |
| `allocator` | "Your fund mandate is active. Institutional pipeline is open." |
| `acquirer` | "Your acquisition criteria are live. Confidential matches are sourcing." |

**Visual spec:**
- Glass-light card with gold left-border (`border-l-4 border-[#C4972A]`)
- Left: gold checkmark circle icon + `"Welcome, [firstName]. Your [Persona Label] profile is ready."`
- Right: × dismiss button
- Entry: `fadeUpVariant` (opacity 0→1, y 20→0, blur 8→0)
- Exit: `AnimatePresence` scale+fade out

---

## 2. Glass-Light Card System

All interior pages share one upgraded card primitive replacing `bg-white border-[#D1DCF0]`.

### `DashCard` — Updated Spec
```
background:    rgba(255,255,255,0.75) + backdrop-blur(16px) + saturate(120%)
border:        1px solid rgba(255,255,255,0.70)
box-shadow:    0 4px 24px rgba(10,22,40,0.08), 0 1px 4px rgba(10,22,40,0.04)
border-radius: 16px
padding:       24px
hover:         shadow 0 8px 40px rgba(10,22,40,0.12), translateY(-2px), duration 200ms
```

### CSS Utility
Add to `index.css @layer utilities`:
```css
.card-elevated {
  background: rgb(255 255 255 / 0.75);
  backdrop-filter: blur(16px) saturate(120%);
  -webkit-backdrop-filter: blur(16px) saturate(120%);
  border: 1px solid rgb(255 255 255 / 0.70);
  box-shadow: 0 4px 24px rgb(10 22 40 / 0.08), 0 1px 4px rgb(10 22 40 / 0.04);
  border-radius: 16px;
}
.card-elevated:hover {
  box-shadow: 0 8px 40px rgb(10 22 40 / 0.12), 0 2px 8px rgb(10 22 40 / 0.06);
}
```

### Typography Scale (all interior pages)
- Section headers: `font-heading-tight text-[#0A1628]` (Inter 800, -0.04em)
- Card titles: `text-sm font-semibold uppercase tracking-wide text-[#1E3A5F]`
- Body: `text-sm text-[#1E3A5F]/80`
- Timestamps / metadata: `font-data-hud text-[10px] text-[#1E3A5F]/50`
- Large numbers: `font-data-hud text-2xl text-[#0A1628]`

### Accent Badge System (consistent across all pages)
```tsx
// Gold — Match, Intent, Attribution
className="bg-[#C4972A]/15 text-[#C4972A] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"

// Cyan — Active, Live, Verified
className="bg-[#22D4F5]/10 text-[#22D4F5]/80 ..."

// Green — Completed, Protected, Paid
className="bg-[#059669]/15 text-[#059669] ..."

// Amber — Pending, Action Required
className="bg-[#F59E0B]/15 text-[#F59E0B] ..."

// Navy — Intelligence, System
className="bg-[#1E3A5F]/10 text-[#1E3A5F] ..."
```

---

## 3. Dashboard Page (/dashboard)

### Layout
Three-column grid preserved: `[280px 1fr 280px]`

### Left Column — Trust Score Widget
- Card → `card-elevated`
- TrustRing: outer track softens with `opacity-20`, progress track gets color `scoreColor`, strokeLinecap="round"
- **Animate on mount**: `strokeDashoffset` starts at full circumference → animates to calculated value via CSS `transition-all duration-1000`
- Score number: `SmoothCounter` already in use — keep, upgrade to `font-data-hud text-4xl`
- Below score: `"Tier 2 — Enhanced"` badge (gold chip), `"+3 this month"` in green
- Hover reveal text: `"Click to view breakdown →"` in `#1E3A5F]/40`

### Left Column — Quick Actions
- "Create Intent" → `btn-gold` already has gold styling, add `whileTap={{ scale: 0.97 }}` spring
- "Protect Relationship" → same treatment
- "View Matches" → border button, lighter treatment

### Center Column — Activity Feed
- Header: `font-heading-tight text-[#0A1628]`
- Each notification card → `card-elevated` + `border-l-4` color-coding
- Newest item → animated pulse dot (already exists, keep)
- Timestamp → `font-data-hud text-[10px] text-[#1E3A5F]/50`
- Empty state → upgrade with `EmptyState` premium styling

### Right Column — Market Depth
- Card → `card-elevated`
- Bars: animate from `width: 0%` → `width: pct%` on mount with `transition={{ duration: 0.8, delay: index * 0.1 }}`
- Buyers bar color: `#2563EB`, Sellers: `#C4972A`
- Legend: small colored dots, `font-data-hud text-[10px]`

### Right Column — Pending Actions
- Icon circles → `bg-[#1E3A5F]/8` with icon in `text-[#1E3A5F]/60`
- "ACTION" badge → amber chip
- Hover: `hover-lift`

### Right Column — Recent Payouts
- "Next Payout" → `font-data-hud text-2xl text-[#059669]` with `SmoothCounter`
- Payout rows → `card-elevated` at reduced padding, status chips

### Personalized Greeting (top)
- `font-heading-tight` for name (already `text-display`)
- Date line → `font-data-hud text-sm` secondary styling
- WelcomeBanner rendered above greeting when applicable

---

## 4. Relationships Page (/relationships)

### Header Strip
- H1: `font-heading-tight text-[#0A1628]`
- Subtitle: description of relationship custody concept
- CTA: `btn-gold` "Protect New Relationship"

### Relationship Cards
- `card-elevated` with left-border gold (`border-l-4 border-[#C4972A]`)
- Custody hash: `font-data-hud text-[10px] text-[#1E3A5F]/50` — e.g. `0xA4F2...7B3C`
- "PROTECTED" badge in green
- Timestamp: `font-data-hud`
- Counterparty name: `font-semibold text-[#0A1628]`
- Hover: lift + subtle gold left-glow

### Empty State
- `EmptyState` with premium styling: illustration + "Your first relationship establishes custody." + gold CTA

---

## 5. Deal Matching Page (/deal-matching)

### Match Cards
- `card-elevated`
- Compatibility score: large `font-data-hud` number (e.g. "91%") in cyan text
- Top match (highest score): `border-[#22D4F5]/30` border + subtle cyan glow shadow
- Match score circle: small SVG arc (stroke-draw animation on mount) in cyan
- Deal type badge: gold chip
- "ACCEPT MATCH" CTA: gold button with `whileTap` spring
- "PASS" link: text-only in `text-[#1E3A5F]/40`

### Intent Creation Section
- Glass-light form card
- Multi-select chips: `bg-[#1E3A5F]/8 border-[#1E3A5F]/20` unselected, `bg-[#C4972A]/15 border-[#C4972A]/40` selected

---

## 6. Deal Rooms Page (/deal-rooms)

### Room Cards
- `card-elevated`
- Status chip: Active (cyan), Pre-Close (gold), Expired (muted)
- NDA expiry: if < 72h, show amber countdown badge `"NDA expires in 48h"`
- Participant count: small avatar stack (initials circles) in `#1E3A5F/20` bg
- "ENTER ROOM" CTA: right-aligned text link with arrow

### Empty State
- "No active deal rooms yet." + gold CTA "Create Deal Room"

---

## 7. Verification Page (/verification)

### Trust Score Hero
- Full-width `card-elevated` at top
- Large TrustRing (200px) center-left, score details right
- Tier badge prominently: `"Tier 2 — Institutional Access"` gold chip
- Progress to Tier 3: progress bar in cyan

### Verification Steps Ladder
- Each step as a `card-elevated` row
- Left: step number in circle (complete = gold filled, active = cyan outline, pending = gray)
- Icon + step name + description
- Right: status chip (Verified / In Progress / Required)
- Complete steps: subtle green left-border
- Active step: cyan left-border + `animate-glow-pulse`

### Upload Zones
- Elevated with drag-over glow state
- `card-elevated` at rest, `border-[#22D4F5]/40` on drag

---

## 8. Payouts Page (/payouts)

### Attribution Summary Card
- `card-elevated` full-width hero card
- "Lifetime Attribution" in large `font-data-hud text-4xl text-[#059669]` with `SmoothCounter`
- "Next Payout" animated counter
- "Recent Payouts" counter
- Three metrics side-by-side with dividers

### Payout Table Rows
- Each row → `card-elevated` reduced padding
- Amount: `font-data-hud font-semibold text-[#0A1628]`
- Type label: small navy badge
- Date: `font-data-hud text-[10px] text-[#1E3A5F]/50`
- Status: gold/green/amber chip
- Hover: lift

---

## 9. Settings Page (/settings)

### Tab Navigation
- Tabs: `text-[#1E3A5F]/60` inactive, `text-[#0A1628] border-b-2 border-[#C4972A]` active
- Tab panels: `card-elevated`

### Profile Section
- Avatar circle: `bg-[#C4972A]` with initials, 64px
- Name + role in `font-heading-tight`
- Form fields: light focus ring `focus:border-[#2563EB] focus:ring-1`

### Danger Zone
- Separated card at bottom with `border-red-200` accent

---

## 10. DashboardLayout Changes

### Main Content Area
- Background stays `#F3F7FC` — the frosted glass cards float above it
- Add subtle `bg-mesh`-like ambient: a very faint radial gradient overlay (5% opacity) centered at top-right for depth — non-animated for performance

### Content Max-Width
- Keep `max-w-[1280px]` — suits the three-column layout

---

## Files to Touch

| File | Change |
|------|--------|
| `index.css` | Add `.card-elevated` utility |
| `Dashboard.tsx` | WelcomeBanner, card-elevated, TrustRing animation, bar animation, typography |
| `Relationships.tsx` | card-elevated, custody card design, header strip |
| `DealMatching.tsx` | card-elevated, match score ring, top-match glow |
| `DealRooms.tsx` | card-elevated, NDA countdown, participant avatars |
| `Verification.tsx` | Trust score hero, step ladder, upload zone elevation |
| `Payouts.tsx` | Attribution hero, payout rows, animated counters |
| `Settings.tsx` | Tab panels, profile section, form field upgrade |
| `DashboardLayout.tsx` | Ambient gradient overlay on content area |

---

## Implementation Priority

| Phase | Files | Rationale |
|-------|-------|-----------|
| P1 | `index.css`, `Dashboard.tsx` | Foundation utility + highest-visibility page |
| P2 | `DealMatching.tsx`, `Relationships.tsx` | Primary user journeys after dashboard |
| P3 | `DealRooms.tsx`, `Verification.tsx` | Deal funnel pages |
| P4 | `Payouts.tsx`, `Settings.tsx`, `DashboardLayout.tsx` | Secondary pages + shell polish |
