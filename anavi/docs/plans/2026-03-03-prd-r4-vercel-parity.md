# R4 — Vercel Deployment Parity

**Version:** 1.1
**Status:** Active
**Date:** 2026-03-03
**Context:** `anavi-seven.vercel.app` is the live demo URL shared with investors. If it 404s on API routes or fails to handle webhooks, the pitch fails.
**Estimated effort:** 2–3 hours

---

## Why This Matters for MVP

The production deployment runs `api/index.ts` — a 23-line file that only mounts tRPC and basic auth. The dev server (`_core/index.ts`) has 6 additional route groups. During a demo, if someone:
- Clicks "Verify Relationship" → 404 (verify routes not mounted)
- The DocuSign NDA flow triggers a callback → silently fails
- Someone checks `/api/health` → 404

These aren't theoretical — they're demo-breakers.

---

## V1. Add Missing Routes to `api/index.ts`

| Route | Why It Matters for Demo |
|-------|----------------------|
| `GET /api/health` | Uptime monitoring, Vercel check |
| `GET /api/verify/relationship/:hash` | Public verification links — core platform feature |
| `POST /api/webhooks/stripe` | Won't break demo (Stripe not live), but prevents silent errors |
| `POST /api/webhooks/docusign` | DocuSign NDA callback — needed if DocuSign is configured |
| `GET/POST /api/auth/docusign/*` | DocuSign OAuth — needed if DocuSign is configured |

**Implementation:** Extract the inline webhook handlers from `_core/index.ts` into importable functions, then import them in `api/index.ts`.

---

## V2. Fix TypeScript Build Errors

The Vercel build shows ~20 TS errors in server code (Express type mismatches in `oauth.ts`, `cookies.ts`, `context.ts`, `auth.ts`). They don't block deployment (Vercel builds anyway) but they indicate the server code may behave unexpectedly.

**Fix:** Add explicit Express type imports to the 4 affected files. No logic changes.

---

## V3. Bump `maxDuration`

`vercel.json` has `maxDuration: 30`. Claude chat responses can take 15–30 seconds. With cold starts, 30s is too tight.

**Fix:** Change to `maxDuration: 60`.

---

## V4. Security — Defer

The previous version of this PRD flagged public AI endpoints and missing rate limiting. For a demo product:
- Public AI endpoints are fine — the demo needs to work without login
- Rate limiting can wait — there's no real traffic

**Track for post-MVP:** Protect AI endpoints behind auth, add rate limiting to auth routes.

---

## Verification

```bash
# Deploy
cd anavi && vercel --prod --yes

# Test
curl https://anavi-seven.vercel.app/api/health
# Should return {"status":"ok"}
```

---

## NOT in Scope

- Rate limiting (no real traffic yet)
- Auth on AI endpoints (demo needs to work frictionlessly)
- Custom domains
- CDN optimization
