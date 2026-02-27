# ANAVI MVP1 — Improvements PRD

**Version:** 1.0  
**Status:** Implemented  
**Scope:** Post-MVP1 UX polish, correctness fixes, and fill-in gaps.

---

## 1. Objectives

- Fix auth and API contract mismatches so users see correct errors and redirects.
- Eliminate dead navigation (Intelligence link) and broken flows (Forgot password).
- Unify empty and loading UX across core pages for a consistent, professional feel.

---

## 2. Improvements

### 2.1 Auth & API Contract

| ID | Item | Detail |
|----|------|--------|
| A1 | **Login error key** | API returns `{ error: "..." }`. Client currently reads `data?.message`. Fix to `data?.error ?? "Invalid email or password"`. |
| A2 | **Register request body** | API expects `name`; client sends `fullName`. Send `name: fullName.trim()` in the register request body. |
| A3 | **Register error key** | Same as A1: display `data?.error` (API returns `error`, not `message`). |
| A4 | **Post-login redirect** | After login, redirect to `/dashboard` if user has `onboardingCompleted === true`, otherwise `/onboarding`. Requires login API to return `user.onboardingCompleted` and client to branch on it. |
| A5 | **Post-register redirect** | After register, redirect to `/onboarding` (new users); optional future: if server signals onboarding completed, redirect to `/dashboard`. |

### 2.2 Missing Routes & Pages

| ID | Item | Detail |
|----|------|--------|
| B1 | **Intelligence route** | Nav includes "Intelligence" with path `/intelligence` and "Coming Soon" badge. Add route in `App.tsx` and a placeholder page: "Intelligence — Coming in Phase 2" with short copy and link back to Dashboard. |

### 2.3 Forgot Password

| ID | Item | Detail |
|----|------|--------|
| C1 | **Forgot password page** | Add `/forgot-password` route and a simple page: email input, "Send reset link" button, success state ("If an account exists, we've sent a link to your email"). |
| C2 | **Backend stub (optional)** | POST `/api/auth/forgot-password` with `{ email }`. Respond 200 with generic success message; no email sending required for MVP. |

### 2.4 Empty States

| ID | Item | Detail |
|----|------|--------|
| D1 | **Dashboard activity** | Replace inline "No activity yet..." text with `<EmptyState {...EMPTY_STATES.notifications} />`. |
| D2 | **DealMatching** | Use `EMPTY_STATES.intents` for empty My Intents, `EMPTY_STATES.matches` for empty Incoming Matches / History where appropriate. |
| D3 | **DealRooms list** | Use `EMPTY_STATES.dealRooms` when there are no deal rooms. |
| D4 | **Payouts** | Use `EMPTY_STATES.payouts` when there are no payouts (in addition to or replacing inline empty text). |

### 2.5 Loading States

| ID | Item | Detail |
|----|------|--------|
| E1 | **Dashboard** | While `getStats` or main data is loading, show a compact skeleton or spinner for the 3-column layout (e.g. skeleton cards for Trust Score, Activity, Payout Summary) so the page doesn’t flash empty. |
| E2 | **Relationships** | Show loading skeleton or spinner for relationship list when `relationship.list` is loading. |
| E3 | **DealMatching** | Show loading state for intents and matches when the respective queries are loading. |

### 2.6 Accessibility & Copy

| ID | Item | Detail |
|----|------|--------|
| F1 | **Intelligence page** | Use proper heading hierarchy and an optional "Back to Dashboard" link for clarity. |

---

## 3. Out of Scope (this round)

- Actual email delivery for password reset.
- Changing Home/landing branding (e.g. @navi vs ANAVI).
- New backend tables or migrations (except optional forgot-password log if needed later).

---

## 4. Success Criteria

- User sees correct error message on invalid login/register (API `error` field).
- New user: Register → Onboarding; Returning user: Login → Dashboard when onboarding already completed.
- Clicking "Intelligence" in the nav opens a Coming Soon page (no 404).
- "Forgot password?" leads to a dedicated page with clear copy and no console errors.
- Dashboard, DealMatching, DealRooms, and Payouts use shared `EmptyState` where lists are empty.
- Dashboard and at least one other core page show a loading state while data is fetched.

---

## 5. Files to Touch

- `client/src/pages/Login.tsx` — error key, redirect logic
- `client/src/pages/Register.tsx` — request body `name`, error key
- `server/_core/oauth.ts` — optional: return `onboardingCompleted` in login response; add forgot-password route
- `client/src/App.tsx` — routes: `/intelligence`, `/forgot-password`
- `client/src/pages/Intelligence.tsx` — new (Coming Soon)
- `client/src/pages/ForgotPassword.tsx` — new
- `client/src/pages/Dashboard.tsx` — EmptyState for activity, loading skeleton
- `client/src/pages/DealMatching.tsx` — EmptyState for intents/matches, loading
- `client/src/pages/DealRooms.tsx` — EmptyState, loading
- `client/src/pages/Payouts.tsx` — EmptyState, loading (if applicable)
- `client/src/pages/Relationships.tsx` — loading state
