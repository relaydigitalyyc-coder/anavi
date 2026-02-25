# F9: Match Notifications — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Match Notifications  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.3

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [x] Implementation complete (notifyNewMatch on match create; expressInterest already notifies)
- [x] UI complete (real notification drawer wired to API)
- [x] Verified (email/digest deferred)

---

## Implementation PRD

### Goal

In-app notifications (existing); email via SendGrid/Resend on new match; optional digest mode (daily); user preference for channel. Email delivery <5min; idempotent; unsubscribe handling.

### Architecture

`notifications` table exists. On `match.create` or mutual interest: insert notification; trigger email (immediate or digest). User prefs: `notifications` table or `user_preferences.notificationChannel` (immediate | digest | off).

### Tech Stack

Drizzle ORM, tRPC v11, Resend/SendGrid, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | `notifications`, `matches`, `users` |
| `anavi/server/db.ts` | createNotification, getNotifications |
| Existing email setup | Resend or SendGrid |

### Phase 1: Email on New Match

**Task 1 — Match event hook**  
- On match create (or mutual interest): call `notifyNewMatch(matchId, userId)`  
- Fetch match details, user email  
- Insert `notifications` row (type=match, entityId=matchId)  
- If user pref = immediate: send email within 60s  

**Task 2 — Email template**  
- Subject: "New match on ANAVI: [counterparty type]"  
- Body: CTA to view match; link to /deal-matching  
- Unsubscribe link in footer  
- Idempotent: dedupe by (userId, matchId) in 24h window

**Task 3 — User preferences**  
- `user_preferences` or extend users: `notificationChannel` (immediate | digest | none)  
- Settings UI: notification frequency  
- Default: immediate for matches

### Phase 2: Digest Mode

**Task 4 — Digest job**  
- Nightly (e.g., 8am user timezone): collect unread match notifications from past 24h  
- Single email: "You have N new matches" with links  
- Mark notifications as digest_sent  
- Skip if no matches

**Task 5 — Unsubscribe**  
- Link: /api/unsubscribe?token=…  
- Token = signed (userId, channel)  
- On click: set user pref to none; redirect "You've been unsubscribed"

### Phase 3: Push (Future)

- Placeholder: web push subscription; FCM or similar  
- Defer to Phase 2/3

### Dependency Map

```
Task 1 → Task 2
Task 3 (parallel)
Task 4 (after Task 2)
Task 5 (parallel)
```

### Verification

- [ ] New match triggers email within 5min
- [ ] Digest user gets single daily email
- [ ] Unsubscribe works

---

## UI PRD

### User Story

As a user, I want to be notified when I get a new match or mutual interest so I don't miss opportunities.

### Entry Points

- In-app: notification bell (existing); badge count  
- Email: "New match" email  
- Settings: Notification preferences  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `NotificationBell` | Badge + dropdown | loading, list, empty |
| `NotificationItem` | Single notification; link to match | unread, read |
| `NotificationPrefs` | Immediate / Digest / Off | — |

### Design Tokens

- Badge: `bg-[#C4972A] text-white` (gold accent)  
- Unread: left border `border-l-[#22D4F5]`  
- Card: `card-elevated` for dropdown  

### Empty States

- No notifications: "No new notifications."

### Email UI

- Clean; ANAVI branding; CTA button; unsubscribe footer  
- Mobile-responsive  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/email.ts` | Match email template |
| `anavi/server/notifications.ts` | notifyNewMatch, digest job |
| `anavi/server/routers.ts` | Wire match create → notify |
| `anavi/server/jobs/notification-digest.ts` | Nightly job |
| `anavi/client/src/components/NotificationBell.tsx` | In-app (may exist) |
| `anavi/client/src/pages/Settings.tsx` | Notification prefs |
