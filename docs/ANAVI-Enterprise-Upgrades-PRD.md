# ANAVI MVP1 — Enterprise Upgrades PRD

**Version:** 1.0
**Status:** Implemented
**Scope:** Enterprise-grade polish across the full application — premium animations, functional completions, brand elevation, and consistency enforcement to justify a $2M platform valuation.

---

## 1. Objectives

- Deploy the existing premium animation libraries (AwwwardsAnimations, PremiumAnimations, PageTransition) across **every** interior page — currently used only on the landing page.
- Complete **functional stubs** in the Deal Room interior, document uploads, diligence checklists, and escrow visualization.
- Elevate the **Dashboard** with personalized greetings, interactive widgets, market depth visualization, and real-time activity indicators.
- Strengthen the **landing page brand** with social proof, testimonials, a pricing/value section, and a professional footer.
- Enforce **enterprise UI consistency** — unified card patterns, status pills, typography hierarchy, gold CTAs, and loading skeletons across all pages.
- Add **enterprise infrastructure** — keyboard shortcuts, print stylesheets, dynamic document titles, toast notifications, and scroll restoration.

---

## 2. Improvements

### 2.1 Premium Animation Deployment

| ID | Item | Detail |
|----|------|--------|
| E1 | **Dashboard animations** | Wrap stat numbers in SmoothCounter, Trust Score card in SmoothReveal, activity feed items in StaggeredList. Import from PremiumAnimations.tsx. |
| E2 | **Relationships animations** | Wrap relationship cards in ScaleHover, custody hash display in GlowingBorder on first card, header stats in FadeInView. |
| E3 | **DealMatching animations** | Compatibility scores use SmoothCounter, match cards in StaggeredList, top match card wrapped in Spotlight. |
| E4 | **DealRooms animations** | Room cards use ScaleHover, status transitions use AnimatePresence. DealRoom interior tabs wrap content in SlideIn on switch. |
| E5 | **Verification animations** | Radar chart reveal with SmoothReveal, tier upgrade cards in Card3D hover, score history in FadeInView. |
| E6 | **Payouts animations** | Earnings counters in SmoothCounter, payout rows in StaggeredList, expansion sections in AnimatePresence. |
| E7 | **Onboarding animations** | Step transitions use PageTransition wrapper, persona cards use Card3D, progress bar uses spring-physics animation. |
| E8 | **Global page transitions** | Wrap all ShellRoute pages in App.tsx with PageTransition component for fade+slide on every route change. |

### 2.2 Dashboard Enterprise Upgrade

| ID | Item | Detail |
|----|------|--------|
| E9 | **Real-time activity pulse** | Add animated pulse dot (CSS `pulse-notification` class) on the newest unread notification card. |
| E10 | **Market depth mini-chart** | Replace static MARKET_DEPTH table with horizontal bar chart showing buyers/sellers per sector. Inline SVG bars, no extra dependencies. |
| E11 | **Trust Score interactivity** | Trust Score card becomes clickable — navigates to `/verification`. Add cursor-pointer, hover scale, and tooltip "Click to view breakdown". |
| E12 | **Quick action feedback** | Gold CTA buttons ("Create Intent", "Protect Relationship") use ElasticButton wrapper and trigger sonner toast on click. |
| E13 | **Dashboard greeting** | Add personalized time-based greeting header: "Good morning, {name}" with date and summary line ("3 new matches, 1 payout pending"). |
| E14 | **Pending actions live status** | Pending action items show status badge. On "complete" action, play checkmark animation via AnimatePresence exit. |

### 2.3 Deal Room Interior Completion

| ID | Item | Detail |
|----|------|--------|
| E15 | **Documents tab upload** | Functional upload zone: FileReader reads file, shows base64 preview thumbnail for images, file-type icon for others, simulated progress bar (0-100% over 1.5s). Files stored in component state. |
| E16 | **Diligence checklist persistence** | Save checklist item states to localStorage keyed by `dealroom_diligence_{roomId}`. Restore on mount. Show completion percentage in tab badge. |
| E17 | **Escrow visualization** | Replace "Coming in Phase 2" placeholder with visual milestone tracker: 3-4 milestones (NDA Signed, Diligence Complete, Funds Released, Deal Closed) with amounts, dates, and status indicators. |
| E18 | **Compliance status panel** | Replace hardcoded values with dynamic status cards per party: verification tier badge, last check date, "Action Required" / "Verified" / "Pending" status with color coding. |
| E19 | **Audit trail enhancement** | Add filter controls (by event type dropdown, date range), search input, and "Export CSV" button that generates and downloads a CSV of the visible entries. |
| E20 | **Deal room header upgrade** | Enhanced header: deal value display (large number), days-active counter, participant avatar stack (up to 3 + overflow badge), stage progress bar with labeled milestones. |
| E21 | **Tab transition animations** | Wrap each tab panel content in SlideIn animation (direction based on tab index change — left or right). |

### 2.4 Verification & Trust Score Polish

| ID | Item | Detail |
|----|------|--------|
| E22 | **Radar chart animation** | Animate radar polygon dimensions from 0 to their target values over 800ms on first view using requestAnimationFrame and linear interpolation. |
| E23 | **Tier upgrade modal enhancement** | Add numbered step indicator dots below progress bar. Document upload shows preview thumbnails. AML questionnaire shows progress fraction ("3 of 8"). |
| E24 | **Score history sparkline** | Animate the score history mini line chart by drawing path from left to right over 600ms using stroke-dashoffset technique. |
| E25 | **Compliance passport card** | Add GlowingBorder component around the passport card. Add animated "Verified" stamp that fades + scales in on mount. |
| E26 | **Share verification link** | Copy-to-clipboard on click with animated checkmark icon transition (clipboard icon -> check icon over 300ms), tooltip "Link copied!" for 2 seconds. |

### 2.5 Relationships Portfolio Enhancement

| ID | Item | Detail |
|----|------|--------|
| E27 | **Card flip interaction** | Relationship cards gain a "View Receipt" button. On click, card flips 180deg (CSS perspective + rotateY) to show custody receipt details (timestamp, hash, verification level, attribution status). Back button flips back. |
| E28 | **Bulk selection mode** | Add "Select" toggle button in header. When active, each card shows a checkbox. Selected count badge appears. Bulk actions bar slides up from bottom: "Export Selected", "Tag Selected". |
| E29 | **Custody hash verification** | Each custody hash row gets a "Verify" button. On click, show 3-step animated sequence: (1) "Checking ledger..." spinner, (2) "Timestamp confirmed" with date, (3) green checkmark "Verified". 1.5s total animation. |
| E30 | **Relationship timeline** | Each relationship card in grid view shows a mini 4-dot timeline at the bottom: Created -> Verified -> Matched -> Attributed. Filled dots for completed stages, empty for pending. Tooltip on each dot with date. |
| E31 | **Upload modal file handling** | Step 2 of the 5-step relationship protection wizard: FileReader-based document preview. Show filename, size, type icon. Remove button. Accept PDF, PNG, JPG. |

### 2.6 Deal Matching Enterprise Features

| ID | Item | Detail |
|----|------|--------|
| E32 | **Match review panel animations** | Slide-in panel uses SlideIn from right (300ms). Compatibility ring animates stroke-dashoffset from 0 to score. Score breakdown bars stagger in (50ms delay each). |
| E33 | **Intent creation celebration** | After successfully creating an intent, trigger FVMCelebration modal with title "Intent Published", subtitle "Your intent is now matching across our network", CTA "View My Intents". |
| E34 | **Match comparison table** | Side-by-side parameter comparison table uses alternating row background. Values that differ between parties are bold. Matching values get a subtle green checkmark. |
| E35 | **Real-time match counter** | Header "Incoming Matches" tab shows count badge. When match count changes (re-fetch), use SmoothCounter to animate the number transition. |
| E36 | **Match decline feedback** | On declining a match, show toast: "Match declined" with brief undo timer (3s). After timeout, confirm decline. |

### 2.7 Landing Page & Brand

| ID | Item | Detail |
|----|------|--------|
| E37 | **Hero background depth** | Add MorphingBlob component behind the orbital visualization. Subtle navy-to-blue gradient blob that slowly morphs, adding visual depth to the hero. |
| E38 | **Social proof section** | New section after stats: "Trusted by Leading Institutions" heading with 6 generic logo placeholders (styled rounded rectangles with placeholder text: "Institution I" through "Institution VI") in grayscale. |
| E39 | **Pricing/value section** | New section before final CTA: "Enterprise Platform" card with gradient border. Feature checklist (8 items with checkmarks), "Starting at enterprise pricing" tagline, "Contact Sales" ElasticButton CTA. |
| E40 | **Testimonial carousel** | 3 testimonial cards in auto-rotating carousel (5s interval). Each: avatar circle, name, title/company, quote. Fictional but realistic private-markets personas. Dot indicators below. |
| E41 | **Footer enhancement** | Replace minimal footer with 4-column layout: Product (Dashboard, Deal Rooms, Matching, Verification), Company (About, Careers, Press, Contact), Legal (Privacy Policy, Terms of Service, Cookie Policy), Support (Documentation, API Reference, Status, Help Center). Copyright line below. |

### 2.8 Notification & Feedback System

| ID | Item | Detail |
|----|------|--------|
| E42 | **Toast notifications** | Use existing sonner Toaster (already in App.tsx). Add toast calls for: intent created, relationship protected, match accepted/declined, deal room entered, verification submitted. Replace any console.log feedback. |
| E43 | **Notification drawer** | Bell icon in DashboardLayout header opens a slide-in drawer (Sheet component) showing notifications grouped by day. Each notification: icon, title, message, time, mark-as-read button. "Mark All Read" at top. |
| E44 | **Success state animations** | After form submissions (register, onboarding steps, intent creation), show a brief checkmark animation (scale in from 0 with bounce easing) before redirect or next step. |
| E45 | **Error state handling** | Consistent error display component: AlertTriangle icon, "Something went wrong" heading, error message, "Try Again" button. Use in ErrorBoundary fallback and query error states. |

### 2.9 Enterprise UI Consistency

| ID | Item | Detail |
|----|------|--------|
| E46 | **Consistent card pattern** | Audit all pages — ensure cards use: `rounded-lg border bg-white p-6` with `hover-lift` class, `border-[#D1DCF0]` border color. Fix any cards using different patterns. |
| E47 | **Status pill standardization** | All status pills across deal rooms, matches, payouts, verification use the 6 CSS classes: `status-nda-pending` (gray), `status-active` (blue), `status-diligence` (orange), `status-closing` (gold), `status-completed` (green), `status-declined` (red). |
| E48 | **Typography hierarchy** | Every page: page title uses `text-display` (32px), section headers use `text-heading` (24px), card titles use `text-subheading` (18px), labels use `text-label` (12px uppercase). Audit and fix inconsistencies. |
| E49 | **Gold CTA consistency** | All primary action buttons ("Create Intent", "Protect Relationship", "Start Demo", "Apply for Access") use `btn-gold` class. Secondary actions use navy outline. |
| E50 | **Loading skeleton consistency** | Every page that loads data shows shimmer skeleton. Ensure skeleton matches final layout shape (cards, lists, charts). Use `animate-shimmer` class consistently. |

### 2.10 Performance & Polish

| ID | Item | Detail |
|----|------|--------|
| E51 | **Scroll restoration** | On route change, save scroll position to sessionStorage keyed by path. On navigate back, restore position. Implement in DashboardLayout or App.tsx. |
| E52 | **Keyboard shortcuts** | Global keydown listener: `Cmd/Ctrl+K` focuses search (if exists) or shows toast "Search coming soon", `Escape` closes any open modal/sheet. Add `useEffect` in DashboardLayout. |
| E53 | **Print stylesheet** | Add `@media print` rules in index.css: hide sidebar, header, nav; expand main content to full width; remove shadows and backgrounds; ensure text is black on white. |
| E54 | **Dynamic document title** | Each page sets `document.title` on mount via `useEffect`. Format: "{Page Name} | ANAVI". Dashboard shows "Dashboard | ANAVI", Deal Room shows "Deal Room: {title} | ANAVI", etc. |
| E55 | **Scrollbar styling** | Apply `scrollbar-premium` class to main content scrollable container in DashboardLayout and to all scrollable panels (notification drawer, match review panel, deal room tabs). |

---

## 3. Out of Scope

- Backend API changes or new database tables
- Real third-party integrations (KYC providers, e-signature, payment processors)
- Mobile-native app development
- Internationalization / localization
- Real-time WebSocket connections
- Actual file storage (uploads are client-side only for demo purposes)

---

## 4. Success Criteria

- Every interior page (Dashboard, Relationships, DealMatching, DealRooms, DealRoom, Verification, Payouts, Onboarding) uses at least 2 premium animation components.
- Page transitions are visible on every route change within the dashboard shell.
- Deal Room interior has functional document upload, persistent diligence checklist, and escrow milestone visualization.
- Landing page has social proof, testimonials, pricing, and a professional 4-column footer.
- All cards, status pills, typography, and CTAs follow consistent patterns across all pages.
- Toast notifications fire for all major user actions.
- Dynamic document titles update on every page navigation.
- Print stylesheet produces a clean layout for Dashboard and Deal Room.

---

## 5. Files to Touch

### New Files
- `docs/ANAVI-Enterprise-Upgrades-PRD.md` (this document)

### Major Modifications
- `anavi/client/src/pages/Dashboard.tsx` — E1, E9–E14
- `anavi/client/src/pages/DealRoom.tsx` — E4, E15–E21
- `anavi/client/src/pages/Relationships.tsx` — E2, E27–E31
- `anavi/client/src/pages/DealMatching.tsx` — E3, E32–E36
- `anavi/client/src/pages/Verification.tsx` — E5, E22–E26
- `anavi/client/src/pages/Payouts.tsx` — E6
- `anavi/client/src/pages/OnboardingFlow.tsx` — E7
- `anavi/client/src/pages/DealRooms.tsx` — E4
- `anavi/client/src/pages/Home.tsx` — E37–E41
- `anavi/client/src/App.tsx` — E8, E54
- `anavi/client/src/components/DashboardLayout.tsx` — E43, E52, E55
- `anavi/client/src/index.css` — E53

---

## 6. Implementation Priority

| Phase | Items | Rationale |
|-------|-------|-----------|
| P1 — Animations & Feedback | E1–E8, E42–E45 | Biggest perceived value lift; every page instantly feels premium |
| P2 — Dashboard & Deal Room | E9–E21 | Core enterprise pages; functional completions matter most |
| P3 — Feature Pages | E22–E36 | Verification, Relationships, DealMatching polish |
| P4 — Brand | E37–E41 | Landing page credibility for buyer first impression |
| P5 — Consistency & Performance | E46–E55 | Final sweep; professional attention to detail |
