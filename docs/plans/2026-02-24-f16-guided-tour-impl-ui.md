# F16: Guided Tour + Restart — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Guided Tour + Restart  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.5

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [x] Implementation complete
- [x] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

5–7 step tour. Highlight targets. Next/skip. "Restart Tour" in banner. Persist "tour completed" in localStorage. Optional server-side completion. Tour loads <1s; accessible (keyboard, screen reader).

### Architecture

Tour definitions: array of { id, target, title, body, placement }. Driver.js, Intro.js, or custom overlay. localStorage: anavi_tour_completed. Optional: `user.completeTour` tRPC to persist server-side.

### Tech Stack

React 19, Driver.js or custom, localStorage, tRPC (optional)

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/client/src` | App structure, Dashboard, routes |
| `package.json` | Add driver.js or similar (or build custom) |

### Phase 1: Tour Definition

**Task 1 — Tour steps**  
- `tourDefinitions`: 5–7 steps  
- Targets: data-tour-id attributes or CSS selectors  
- Example: Welcome → Dashboard stats → Relationships → Deal Matching → Payouts → Verification → "You're all set"  
- Each: title, body (1–2 sentences), placement (top/bottom/left/right)  

**Task 2 — Tour runner**  
- `useTour()` hook: start, next, skip, restart  
- State: currentStep, isActive  
- Persist completed to localStorage on finish  
- Optional: call `user.completeTour` tRPC  

### Phase 2: Integration

**Task 3 — Trigger on first visit**  
- After onboarding (or first dashboard load): if !localStorage.anavi_tour_completed, auto-start tour  
- Or: show "Take a quick tour" CTA; user clicks to start  

**Task 4 — Restart Tour**  
- Banner or Settings: "Restart Tour" button  
- Clears localStorage; starts tour from step 1  
- Accessible from Help menu or footer  

**Task 5 — Target elements**  
- Add `data-tour-id="welcome"` etc. to Dashboard, Relationships link, etc.  
- Ensure targets exist when step loads; handle missing (skip or fallback position)  

### Phase 3: Edge Cases

**Task 6 — Refresh mid-tour**  
- Persist currentStep in sessionStorage  
- On remount: resume or restart from beginning (simpler: restart)  

**Task 7 — DOM targets missing**  
- Dynamic routes: target may not exist yet  
- Skip step or wait; or use "floating" step without target  
- Fallback: center of viewport for orphan steps  

### Dependency Map

```
Task 1 → Task 2 → Task 3 → Task 4
Task 5 (markup)
Task 6, 7 (handling)
```

### Verification

- [ ] Tour starts on first visit
- [ ] Next/skip work
- [ ] Restart works
- [ ] Completed persists
- [ ] Keyboard nav (Tab, Enter, Escape)

---

## UI PRD

### User Story

As a new user, I want a guided tour and the ability to restart it so I understand the platform.

### Entry Points

- First dashboard visit: tour auto-starts (or CTA)  
- Help menu / Settings: "Restart Tour"  
- Banner: "New here? Take a 2-minute tour"  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `TourOverlay` | Highlight + popover | step N of M |
| `TourPopover` | Title, body, Next/Skip | — |
| `RestartTourBanner` | Dismissable; "Restart Tour" CTA | — |

### Design Tokens

- Overlay: dark backdrop; highlight cutout with `box-shadow` glow  
- Popover: `card-elevated`; `dash-heading` for title  
- CTA: Next = `btn-gold`; Skip = ghost  
- Progress: "Step 2 of 6" — `data-label`  

### Accessibility

- aria-live for step content  
- Focus trap in popover  
- Escape to skip  
- Screen reader: "Guided tour, step 2 of 6"  

### Empty States

- N/A (tour has fixed steps)  

### Metrics

- Tour start rate; completion rate; restart rate  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/client/src/tour/definitions.ts` | Tour steps |
| `anavi/client/src/tour/useTour.ts` | Hook |
| `anavi/client/src/components/TourOverlay.tsx` | UI |
| `anavi/client/src/components/RestartTourBanner.tsx` | Banner |
| `anavi/client/src/App.tsx` | Mount tour; Cmd+K or first load |
| `anavi/server/routers.ts` | user.completeTour (optional) |
