# F18: Mobile-Responsive Dashboard — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Mobile-Responsive Dashboard  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.5

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [x] Implementation complete (sidebar drawer, responsive breakpoints)
- [x] UI complete (hamburger, 44px tap targets, overflow-x-hidden)
- [x] Verified

---

## Implementation PRD

### Goal

Responsive breakpoints (sm/md/lg). Collapsible sidebar. Touch-friendly cards. Bottom nav exists—ensure all key flows work. Core Web Vitals; tap targets ≥44px. Test on iOS/Android.

### Architecture

Tailwind breakpoints. Sidebar: collapse to icons or hide; hamburger opens drawer. Bottom nav: Dashboard, Matches, Deals, More. All pages responsive. No layout overflow; no unclickable elements.

### Tech Stack

React 19, Tailwind CSS, Framer Motion (optional for drawer)

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/client/src/components/DashboardLayout.tsx` | Sidebar, layout |
| `anavi/client/src/App.tsx` | Routes |
| `tailwind.config` | Breakpoints |
| `anavi/client/src/index.css` | Global styles |

### Phase 1: Layout Breakpoints

**Task 1 — Sidebar responsiveness**  
- lg (1024px+): full sidebar  
- md (768–1023): collapsed sidebar (icons only) or hidden  
- sm (<768): sidebar hidden; hamburger opens overlay/drawer  
- State: `isSidebarOpen`; toggle on hamburger click  
- Overlay: backdrop when drawer open; click to close  

**Task 2 — Bottom nav (mobile)**  
- sm/md: show bottom nav (Dashboard, Matches, Deals, More)  
- lg: hide bottom nav (sidebar used)  
- Ensure nav links work; active state  
- Tap targets: min 44×44px  

**Task 3 — Main content area**  
- Padding responsive: p-4 sm:p-6 lg:p-8  
- No horizontal overflow; `overflow-x-hidden` on body if needed  
- Grids: 1 col sm, 2 col md, 3 col lg for cards  

### Phase 2: Component Fixes

**Task 4 — Cards and tables**  
- Cards: stack vertically on small screens  
- Tables: horizontal scroll wrapper or card layout for rows  
- `overflow-x-auto` on tables; min-width or responsive columns  

**Task 5 — Modals and dialogs**  
- Full-screen on sm; or max-h-screen with scroll  
- Close button always accessible (44px tap target)  
- No content cut off  

**Task 6 — Forms**  
- Inputs: full width on mobile  
- Buttons: full width or min 44px height  
- Labels: don't overlap inputs  

### Phase 3: Touch and Performance

**Task 7 — Tap targets**  
- Audit: all clickable elements ≥44px  
- Increase padding where needed  
- Remove :hover-only actions; provide tap alternative  

**Task 8 — Core Web Vitals**  
- LCP: optimize images; lazy load below fold  
- CLS: reserve space for dynamic content  
- INP: debounce heavy handlers  

**Task 9 — Test devices**  
- Chrome DevTools device emulation  
- Real device test: iOS Safari, Android Chrome  
- Document known issues  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4, 5, 6 (components)
Task 7, 8, 9 (polish)
```

### Verification

- [ ] Sidebar collapses; hamburger works
- [ ] Bottom nav works on mobile
- [ ] No horizontal scroll
- [ ] Tap targets adequate
- [ ] Forms usable on phone

---

## UI PRD

### User Story

As a user on mobile, I want the dashboard to work well so I can check on the go.

### Entry Points

- All app routes on mobile viewport  
- Bottom nav as primary navigation on mobile  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `Sidebar` | Collapsible; drawer on mobile | expanded, collapsed, drawer |
| `BottomNav` | 4–5 key links | — |
| `HamburgerButton` | Opens sidebar drawer | — |
| `ResponsiveCardGrid` | 1/2/3 col by breakpoint | — |

### Design Tokens

- Breakpoints: sm 640, md 768, lg 1024 (Tailwind default)  
- Drawer: `w-72` or `w-[280px]`; `z-50`  
- Backdrop: `bg-black/50`  
- Bottom nav: `h-14`; icons 24px; label 10px  
- Tap: `min-h-[44px] min-w-[44px]`  

### Empty States

- N/A (layout only)  

### Edge Cases

- Landscape: same layout; may need taller bottom nav or different arrangement  
- Very small (<375px): ensure no overflow  
- Large tables: horizontal scroll with shadow gradient to indicate more  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/client/src/components/DashboardLayout.tsx` | Sidebar, bottom nav |
| `anavi/client/src/components/Sidebar.tsx` | Collapse, drawer |
| `anavi/client/src/components/BottomNav.tsx` | Mobile nav |
| `anavi/client/src/pages/Dashboard.tsx` | Responsive grid |
| `anavi/client/src/pages/*.tsx` | Table scroll, form width |
| `tailwind.config.js` | Breakpoints (if custom) |
