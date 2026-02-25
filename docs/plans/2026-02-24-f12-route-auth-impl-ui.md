# F12: Route-Level Auth Enforcement — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Route-Level Auth Enforcement  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.4

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [x] Implementation complete
- [x] UI complete (ProtectedRoute, post-login redirect)
- [x] Verified (build passes)

---

## Implementation PRD

### Goal

Audit all tRPC procedures; ensure protected routes use `protectedProcedure`. Guard client routes (redirect if unauthenticated). API key validation for external hooks. No protected procedure without middleware; consistent error codes.

### Architecture

tRPC context: `user` from session. `protectedProcedure` requires user. Client: `useAuth` with `redirectOnUnauthenticated`. Express: tRPC middleware runs before procedures. Webhook routes: API key header validation.

### Tech Stack

tRPC v11, Express, existing auth/session

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/server/_core/trpc.ts` | `protectedProcedure`, `publicProcedure` |
| `anavi/server/routers.ts` | All routers |
| `anavi/client/src` | Auth context, route guards |
| `anavi/client/src/App.tsx` | Route structure |

### Phase 1: Server Audit

**Task 1 — Procedure audit**  
- List all tRPC procedures  
- Each that touches user data or mutations: must use `protectedProcedure`  
- Exceptions: `auth.me`, `auth.logout`, `market.*` (if public), health checks  
- Create checklist; fix any that use `publicProcedure` incorrectly  
- TDD: assert unauthenticated caller gets 401 for protected procedures  

**Task 2 — Consistent error codes**  
- `TRPCError` with code UNAUTHORIZED for missing/invalid session  
- Code FORBIDDEN for valid user but insufficient permission  
- Standardize error messages (no sensitive leak)  

**Task 3 — Webhook API key**  
- Routes like `/api/webhooks/*`: require `Authorization: Bearer <API_KEY>` or `X-API-Key`  
- Reject 401 if missing/invalid  
- API key from env  

### Phase 2: Client Guards

**Task 4 — Route guard**  
- `ProtectedRoute` or `ShellRoute` wrapper  
- Before render: check `useAuth().user`  
- If null: redirect to `/login` (or `/`)  
- Preserve intended path in query for post-login redirect  
- Loading state while auth check pending  

**Task 5 — Apply to all app routes**  
- Dashboard, Relationships, Deal Matching, Deal Rooms, Payouts, Settings, etc.  
- Public: Home, Login, (optional) Landing  
- Ensure no flash of protected content before redirect  

### Phase 3: Verification

**Task 6 — Smoke test**  
- Unauthenticated request to protected tRPC → 401  
- Unauthenticated nav to /dashboard → redirect to login  
- Authenticated → full access  
- Log auth bypass attempts (if feasible)  

### Dependency Map

```
Task 1 → Task 2
Task 3 (parallel)
Task 4 → Task 5 → Task 6
```

### Verification

- [ ] All protected procedures reject unauthenticated
- [ ] Client redirects before rendering protected pages
- [ ] Webhooks require valid API key

---

## UI PRD

### User Story

As the platform, I want every protected route to enforce authentication so no unauthorized access.

### Entry Points

- Any app route when unauthenticated → redirect  
- tRPC call when session expired → 401 → client redirect  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `ProtectedRoute` | Wraps routes; checks auth; redirects | loading, redirect, render |
| `useAuth` | Provides user + redirectOnUnauthenticated | — |

### UX

- **No flash:** Avoid showing protected content before redirect. Use loading spinner or blank until auth resolved.  
- **Redirect target:** `/login` with `?redirect=/dashboard` (or intended path). After login, navigate to redirect.  
- **Session expired:** Mid-session 401 → toast "Session expired" → redirect to login.  
- **Generic message:** "Please sign in to continue."  

### Design Tokens

- N/A (auth is functional, not visual)  
- Loading: skeleton or spinner consistent with app  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/routers.ts` | Audit all procedures |
| `anavi/server/_core/trpc.ts` | protectedProcedure |
| `anavi/client/src/App.tsx` | ProtectedRoute usage |
| `anavi/client/src/hooks/useAuth.ts` | Auth + redirect logic |
| `anavi/server/_core/index.ts` | Webhook auth middleware |
