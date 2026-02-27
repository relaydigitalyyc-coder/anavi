# ANAVI Platform — 24 High-Leverage Improvements
## Master Product Requirements Document

**Document Version:** 1.0  
**Last Updated:** 2026-02-24  
**Classification:** Investor-Ready / Engineering-Build Spec

---

## INPUT CONTEXT

| Field | Value |
|-------|-------|
| **Product Name** | ANAVI (@navi) — The Private Market Operating System |
| **Problem** | Broker chain inefficiency (5–15 intermediaries, 1–5% fees each), relationship leakage (no originator protection), fraud epidemic ($10–40B annual US losses), due diligence duplication ($50K–$500K per deal) |
| **Target User** | Deal originators (brokers/agents), institutional investors (PE/VC/family offices), asset owners, project developers |
| **Business Model** | Platform fees on deal flow; transaction economics (originator 40–60%, contributors 20–30%, platform 10–20%); premium tiers for enhanced verification and deal intelligence |
| **Platform** | React 19 + TypeScript + Vite + tRPC v11 + Express + MySQL/TiDB (Drizzle) + Claude AI |
| **Constraints** | Partial MVP (~45% functional); ~25% production-ready; simulated compliance; no e-signature/escrow integrations |
| **Competitive Landscape** | Traditional broker networks (opaque), iPipeline/DealCloud (deal management, no custody), Axial (M&A network, no attribution), niche vertical platforms |

---

# 1. Executive Summary

ANAVI will close the gap between its current state (~45% functional MVP, simulated compliance, demo-only modules) and a production-ready private-market operating system by executing 24 high-leverage improvements across identity, custody, matching, deal infrastructure, payouts, security, activation, and scale. These improvements are sequenced to maximize trust signal delivery (verification, auth, audit), core value loop completion (vector matching, notifications, payout automation), and platform defensibility (escrow, e-signature, data-backed modules). Strategic positioning: become the canonical relationship custody layer for private markets before incumbents or well-funded competitors build equivalent infrastructure. The 24 improvements are designed to move ANAVI from demo-grade to institutional-grade in three phased releases over 12–18 months.

---

# 2. Problem Definition

**Core pain points**

- **Identity gap:** No end-to-end KYB/KYC workflow; simulated verification passes; no real sanctions/PEP/adverse-media screening. Originators and investors cannot trust counterparty verification.
- **Attribution gap:** Payout schema exists but no milestone-to-payout automation; no counterparty-facing statements; external settlement integrations missing. Originators cannot rely on economics.
- **Matching gap:** LLM-assisted scoring exists; no vector embedding pipeline for semantic retrieval; no production notifications. Match quality and speed are limited.
- **Deal infrastructure gap:** Deal rooms have document metadata but no DocuSign/Adobe Sign; no escrow integrations. Closing workflows remain manual.
- **Security gap:** Route-level auth not fully enforced; audit trail is mutable; no CI gates. Platform is not production-hardened.
- **Activation gap:** Search is "coming soon"; Intelligence page placeholder; mobile dashboard underdeveloped. Discovery and engagement suffer.
- **Data gap:** LP Portal, Real Estate, Audit Logs, Deal Intelligence are static/demo. Modules do not drive real workflows.

**Existing alternatives and why they fail**

- **Traditional brokers:** Opaque chains; no custody or attribution; relationship leakage.
- **DealCloud/iPipeline:** Deal management only; no relationship custody or originator protection.
- **Manual spreadsheets:** No timestamp proofs; no blind matching; no automated payouts.

**Quantified impact**

- Private markets AUM: $13+ trillion (2024) → $20–25 trillion (2030).
- Family office AUM: $3.1T → $5.4T. Commodities: $142T → $163T.
- Current platform surface ~80% complete; functional MVP ~45%; production readiness ~25%. The 24 improvements target raising functional MVP to 85%+ and production readiness to 75%+ within 18 months.

---

# 3. Target Users

**ICP definition**

- **Primary:** Deal originators (brokers, agents, relationship holders) with $1M–$500M+ deal flow who need custody, attribution, and fair compensation.
- **Secondary:** Institutional investors (family offices, PE/VC) seeking verified counterparties and differentiated deal flow; project developers seeking capital.

**User personas**

| Persona | JTBD | Behavioral trigger |
|---------|------|--------------------|
| Marcus (Originator) | Protect relationships and earn fair share on every deal | Loses a deal to a competitor who poached a relationship |
| Sarah (Investor) | Access qualified deal flow without broker chain opacity | Duplicates $50K DD across 5 deals |
| David (Developer) | Raise project capital from verified allocators | Spends months in manual outreach with no attribution |

**Jobs-to-be-done framing**

- **Originators:** "When I introduce a buyer to a seller, I want my ownership of that relationship recognized and compensated in perpetuity so I am not disintermediated."
- **Investors:** "When I evaluate a deal, I want verified counterparties and AI-assisted matching so I reduce DD cost and fraud risk."
- **Developers:** "When I seek capital, I want my project matched to qualified investors without exposing full details until NDA."

---

# 4. Product Vision

**Long-term strategic outcome**

ANAVI becomes the canonical relationship custody and attribution layer for private markets—the infrastructure that establishes who introduced whom, when, and what compensation flows. By 2030, a meaningful share of private market deal flow flows through ANAVI-attributed relationships.

**12-month vision**

- Full KYB/KYC workflow with real compliance providers.
- Vector-powered semantic matching with production notifications.
- Milestone-to-payout automation and escrow integration.
- E-signature integration in deal rooms.
- Auth enforced; immutable audit; CI gates; observability.
- LP Portal and Audit Logs fully data-backed.
- Global search; Intelligence page live; mobile-responsive dashboard.

**3-year leverage play**

- Phase 2: Project finance (renewable energy, $30M+); 100% funding capability.
- Phase 3: Platform extensions (credit lines, procurement, FinTech).
- Phase 4: Capital arms (ANAVI Ventures, ANAVI Credit, ANAVI Real Assets).

---

# 5. Feature Architecture (24 High-Leverage Improvements)

---

## 5.1 Identity & Trust (Improvements 1–4)

### F1. KYB/KYC Verification Workflow

| Attribute | Specification |
|-----------|----------------|
| **User story** | As an originator, I want to complete verification and receive a tier badge so counterparties trust me. |
| **Functional requirements** | Document upload (gov ID, business license); reviewer queue with approve/reject/request-changes; status transitions (pending → in_review → approved/rejected); tier assignment (Basic/Enhanced/Institutional); email notifications on status change. |
| **Non-functional** | Document storage via S3/proxy; max 10MB per file; retention per jurisdiction. |
| **Edge cases** | Expired documents; duplicate submissions; jurisdiction-specific requirements. |
| **Failure states** | Upload timeout; reviewer offline; storage full. |
| **Data dependencies** | `verification_documents`, `users` (verificationTier, kybStatus, kycStatus). |
| **API touchpoints** | `verification.upload`, `verification.review`, `verification.getStatus`; webhook for storage completion. |
| **Metrics** | Verification completion rate; time-to-tier; rejection rate by document type. |

### F2. Real Sanctions/PEP/Adverse-Media Integrations

| Attribute | Specification |
|-----------|----------------|
| **User story** | As the platform, I want to screen users against sanctions/PEP/adverse media so we comply and reduce fraud. |
| **Functional requirements** | Integrate Refinitiv World-Check, ComplyAdvantage, or equivalent; run on registration and periodic refresh; store results in `compliance_checks`; block or flag based on policy. |
| **Non-functional** | API latency <3s; batch mode for bulk refresh; rate limits respected. |
| **Edge cases** | Name collisions; partial matches; jurisdiction opt-out. |
| **Failure states** | Provider outage; API key expiry; rate limit exceeded. |
| **Data dependencies** | `compliance_checks`, `users`; provider response schema. |
| **API touchpoints** | Provider REST API; internal `compliance.runCheck` mutation. |
| **Metrics** | Check latency; false positive rate; provider availability. |

### F3. Trust Score Automation

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a user, I want my Trust Score to update automatically based on verified events so my reputation reflects reality. |
| **Functional requirements** | Event-driven updates: +points for completed deals, peer reviews, document approvals; −points for disputes, rejections; configurable weights; history in `trust_score_history`. |
| **Non-functional** | Recalculation <5min after event; idempotent; no cascading locks. |
| **Edge cases** | Retroactive corrections; multi-event batching; score ceiling/floor. |
| **Failure states** | Event queue backlog; DB timeout. |
| **Data dependencies** | `trust_score_history`, `users.trustScore`; events from deals, reviews, verification. |
| **API touchpoints** | Internal event bus or trigger; `user.getStats` (trustScore). |
| **Metrics** | Score delta per event type; recalculation lag. |

### F4. GitHub OAuth + SSO

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a stakeholder, I want to sign in with GitHub (or SSO) so I can explore the platform quickly. |
| **Functional requirements** | GitHub OAuth flow: authorize → callback → exchange code → fetch user → upsert by email/openId → set session cookie; optional enterprise SSO (SAML/OIDC) for institutions. |
| **Non-functional** | Session creation <2s; secure state param; PKCE where supported. |
| **Edge cases** | Email collision with existing user; GitHub email private; org SSO override. |
| **Failure states** | OAuth provider down; callback mismatch; token exchange failure. |
| **Data dependencies** | `users` (openId, email, loginMethod); session JWT. |
| **API touchpoints** | `GET /api/auth/github`, `GET /api/auth/github/callback`; GitHub `/user` API. |
| **Metrics** | OAuth conversion rate; login method mix. |

---

## 5.2 Relationship Custody & Attribution (Improvements 5–7)

### F5. Attribution Payout Automation

| Attribute | Specification |
|-----------|----------------|
| **User story** | As an originator, I want payouts to trigger automatically when milestones close so I don't chase commissions. |
| **Functional requirements** | Milestone definitions per deal; triggers (stage→closed, paidAt set); attribution % from `deal_participants`; create `payouts` rows; notify originators. |
| **Non-functional** | Idempotent; audit every payout creation; handle partial milestones. |
| **Edge cases** | Multi-originator splits; follow-on deals; disputes. |
| **Failure states** | Duplicate payout; missing attribution %; deal rolled back. |
| **Data dependencies** | `payouts`, `deal_participants`, `deals`, `relationships`. |
| **API touchpoints** | `payout.create`; deal stage webhook or cron. |
| **Metrics** | Payouts per deal; time from close to payout; attribution accuracy. |

### F6. External Custody Proofs

| Attribute | Specification |
|-----------|----------------|
| **User story** | As an originator, I want cryptographic proof of relationship ownership that I can externalize so I have portable claims. |
| **Functional requirements** | Sign relationship timestamp hash with platform key; expose verifiable credential (W3C or custom); allow export/sharing; verification endpoint for third parties. |
| **Non-functional** | Signing latency <500ms; key rotation policy; revocation list. |
| **Edge cases** | Relationship modified after signing; key compromise. |
| **Failure states** | Signing service down; key not found. |
| **Data dependencies** | `relationships` (timestampHash); keys in HSM or env. |
| **API touchpoints** | `relationship.getProof`, `relationship.verifyProof` (public). |
| **Metrics** | Proof requests; verification success rate. |

### F7. Counterparty-Facing Payout Statements

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a deal participant, I want a statement of payouts attributed to me so I can reconcile with my records. |
| **Functional requirements** | Generate PDF/HTML statement per period; include deal refs, amounts, dates; shareable link with expiry; download. |
| **Non-functional** | Generation <10s; templated; audit trail. |
| **Edge cases** | Multi-currency; adjustments; disputed payouts. |
| **Failure states** | Template error; missing data; PDF generation timeout. |
| **Data dependencies** | `payouts`, `deals`, `users`. |
| **API touchpoints** | `payout.getStatement`, `payout.downloadStatement`. |
| **Metrics** | Statement requests; download completion. |

---

## 5.3 Matching & Deal Flow (Improvements 8–11)

### F8. Vector Embedding Pipeline

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a user, I want intent matching to use semantic similarity so I get better matches than keyword search. |
| **Functional requirements** | Embed intent text (title, description) via Claude or dedicated embedding model; store in vector DB (Pgvector, Pinecone, or similar); similarity search on new intents; configurable threshold. |
| **Non-functional** | Embedding latency <2s; index refresh on intent create/update; batch backfill for existing. |
| **Edge cases** | Empty descriptions; non-English; very long text. |
| **Failure states** | Embedding API down; vector DB unreachable; index corruption. |
| **Data dependencies** | `intents`; vector store; embedding model. |
| **API touchpoints** | Internal pipeline; `match.findMatches` (vector path). |
| **Metrics** | Match recall@k; embedding latency; index size. |

### F9. Match Notifications

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a user, I want to be notified when I get a new match or mutual interest so I don't miss opportunities. |
| **Functional requirements** | In-app notifications (existing); email via SendGrid/Resend on new match; optional push (future); digest mode (daily); user preference for channel. |
| **Non-functional** | Email delivery <5min; idempotent; unsubscribe handling. |
| **Edge cases** | User has no email; digest vs immediate; spam filters. |
| **Failure states** | Email provider down; bounce; rate limit. |
| **Data dependencies** | `notifications`, `matches`, `users` (email, preferences). |
| **API touchpoints** | `notification.send`; email provider API. |
| **Metrics** | Delivery rate; open rate; CTR. |

### F10. LP Portal Data-Backing

| Attribute | Specification |
|-----------|----------------|
| **User story** | As an LP, I want to see my actual commitments, distributions, and documents so I manage my portfolio. |
| **Functional requirements** | LP Portal page: commitments from DB; distributions from payout logic; document links from deal rooms; NAV/IRR calculations (simplified). |
| **Non-functional** | Data scoped by user/fund; pagination; export. |
| **Edge cases** | No commitments; partial data; fund-level vs individual. |
| **Failure states** | Missing fund association; stale data. |
| **Data dependencies** | `deal_participants`, `payouts`, `documents`, custom LP schema if needed. |
| **API touchpoints** | `lpPortal.getCommitments`, `lpPortal.getDistributions`, `lpPortal.getDocuments`. |
| **Metrics** | LP Portal DAU; page depth. |

### F11. Deal Room E-Signature Integration

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a deal participant, I want to sign documents in the deal room via DocuSign/Adobe Sign so we close faster. |
| **Functional requirements** | DocuSign or Adobe Sign API integration; "Request Signature" on document; embed signing link; webhook for completion; update document status. |
| **Non-functional** | OAuth for provider; webhook verification; audit. |
| **Edge cases** | Multiple signers; envelope voided; document replaced. |
| **Failure states** | Provider down; webhook missed; auth expired. |
| **Data dependencies** | `documents`, `document_signatures`; provider envelope ID. |
| **API touchpoints** | Provider REST API; `document.requestSignature`, webhook handler. |
| **Metrics** | Envelopes sent; completion rate; time-to-sign. |

---

## 5.4 Security & Compliance (Improvements 12–14)

### F12. Route-Level Auth Enforcement

| Attribute | Specification |
|-----------|----------------|
| **User story** | As the platform, I want every protected route to enforce authentication so no unauthorized access. |
| **Functional requirements** | Audit all tRPC procedures; ensure protected routes use `protectedProcedure`; guard client routes (redirect if unauthenticated); API key validation for external hooks. |
| **Non-functional** | No protected procedure without middleware; consistent error codes. |
| **Edge cases** | Public procedures (auth.me, market data); optional auth paths. |
| **Failure states** | Missing middleware; token tampering. |
| **Data dependencies** | tRPC context; session validation. |
| **API touchpoints** | All tRPC procedures; `useAuth` with redirectOnUnauthenticated. |
| **Metrics** | 401 rate; auth bypass attempts (logging). |

### F13. Immutable Audit Trail

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a compliance officer, I want an immutable audit trail so we can prove actions for regulators. |
| **Functional requirements** | Append-only audit log (new table or event store); hash chain or Merkle tree; write-once; no update/delete; retention policy; export for regulators. |
| **Non-functional** | Write latency <50ms; compression for old data; query by actor, entity, date. |
| **Edge cases** | High volume; schema evolution; retroactive backfill. |
| **Failure states** | Write failure; storage full; corruption. |
| **Data dependencies** | `audit_log` (append-only); hash chain metadata. |
| **API touchpoints** | `audit.log` (internal); `audit.query`, `audit.export`. |
| **Metrics** | Events per day; write latency; query performance. |

### F14. CI Gates

| Attribute | Specification |
|-----------|----------------|
| **User story** | As an engineer, I want CI to block merges when typecheck/tests/build fail so we don't ship broken code. |
| **Functional requirements** | GitHub Actions: `pnpm check` (tsc); `pnpm test`; `pnpm build`; run on PR; block merge on failure; status badge. |
| **Non-functional** | CI time <10min; cache deps; parallel jobs where possible. |
| **Edge cases** | Flaky tests; env-dependent tests; external mocks. |
| **Failure states** | Runner down; timeout; cache poison. |
| **Data dependencies** | package.json scripts; test files. |
| **API touchpoints** | GitHub API; pnpm. |
| **Metrics** | Pass rate; CI duration; flakiness. |

---

## 5.5 Activation & UX (Improvements 15–18)

### F15. Global Search

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a user, I want to search across intents, deals, relationships, and matches so I find things quickly. |
| **Functional requirements** | Cmd+K or header search; query backend; search intents (title, description), deals (title), relationships (alias), matches (counterparty alias); typeahead; recent searches. |
| **Non-functional** | Response <500ms; debounce 300ms; limit 20 results. |
| **Edge cases** | Empty query; no results; permission filtering. |
| **Failure states** | Search service down; timeout. |
| **Data dependencies** | `intents`, `deals`, `relationships`, `matches`; full-text index or LIKE. |
| **API touchpoints** | `search.global` (query, limit). |
| **Metrics** | Search usage; result click-through; zero-result rate. |

### F16. Guided Tour + Restart

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a new user, I want a guided tour and the ability to restart it so I understand the platform. |
| **Functional requirements** | Demo mode: 5–7 step tour; highlight targets; next/skip; "Restart Tour" in banner; persist "tour completed" in localStorage; optional server-side completion. |
| **Non-functional** | Tour loads <1s; accessible (keyboard, screen reader). |
| **Edge cases** | User refreshes mid-tour; DOM targets missing. |
| **Failure states** | Tour script error; target not found. |
| **Data dependencies** | `tourDefinitions`; localStorage. |
| **API touchpoints** | Client-only; optional `user.completeTour`. |
| **Metrics** | Tour start rate; completion rate; restart rate. |

### F17. Intelligence Page Launch

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a user, I want an Intelligence page with market insights so I make better decisions. |
| **Functional requirements** | Remove "coming soon"; deliver sector intelligence, market depth, deal flow analytics; can start with existing `marketQuery`, `sectorIntelligence` tRPC if present; or aggregate from dashboard stats. |
| **Non-functional** | Page load <3s; cache aggressive reads. |
| **Edge cases** | No data; permission filtering. |
| **Failure states** | Backend down; empty state. |
| **Data dependencies** | Existing analytics endpoints; optional new aggregations. |
| **API touchpoints** | `intelligence.*` or `analytics.*`. |
| **Metrics** | Intelligence page views; time on page. |

### F18. Mobile-Responsive Dashboard

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a user on mobile, I want the dashboard to work well so I can check on the go. |
| **Functional requirements** | Responsive breakpoints (sm/md/lg); collapsible sidebar; touch-friendly cards; bottom nav already exists—ensure all key flows work; test on iOS/Android. |
| **Non-functional** | Core Web Vitals; tap targets ≥44px. |
| **Edge cases** | Large tables; modals; landscape. |
| **Failure states** | Layout overflow; unclickable elements. |
| **Data dependencies** | None (layout only). |
| **API touchpoints** | None. |
| **Metrics** | Mobile share of traffic; mobile conversion. |

---

## 5.6 Operations & Scale (Improvements 19–21)

### F19. Escrow/Payment Integrations

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a deal participant, I want escrow for milestone payments so counterparties are protected. |
| **Functional requirements** | Integrate escrow provider (e.g., Escrow.com, bank API, or crypto); create escrow on milestone; release on completion; webhook for status; record in `payouts`. |
| **Non-functional** | Idempotent; audit; reconciliation reports. |
| **Edge cases** | Partial release; disputes; refunds. |
| **Failure states** | Provider down; webhook lost; balance insufficient. |
| **Data dependencies** | `payouts`, `deals`; provider account linking. |
| **API touchpoints** | Provider API; webhook handler. |
| **Metrics** | Escrow volume; release time; dispute rate. |

### F20. Integration Tests

| Attribute | Specification |
|-----------|----------------|
| **User story** | As an engineer, I want integration tests for the core funnel so we catch regressions. |
| **Functional requirements** | Test: onboarding → identity → create intent → find matches → mutual interest → create deal room; use test DB or mocks; assert state transitions. |
| **Non-functional** | Run in CI; <5min; isolated. |
| **Edge cases** | Async flows; cleanup. |
| **Failure states** | Test env misconfigured; flakiness. |
| **Data dependencies** | Test fixtures; seed data. |
| **API touchpoints** | tRPC caller or HTTP. |
| **Metrics** | Coverage of critical paths; flakiness rate. |

### F21. Observability & Alerting

| Attribute | Specification |
|-----------|----------------|
| **User story** | As an operator, I want logging and alerts so I know when something breaks. |
| **Functional requirements** | Structured logging (JSON); log level config; metrics (request count, latency, error rate); alert on error spike, latency p99, job failures; dashboard (Grafana/Datadog/custom). |
| **Non-functional** | Log retention 30d; alert latency <5min; PagerDuty/Slack integration. |
| **Edge cases** | Log volume; metric cardinality. |
| **Failure states** | Logging backend down; alert fatigue. |
| **Data dependencies** | Log aggregation; metric store. |
| **API touchpoints** | Logger middleware; health checks. |
| **Metrics** | MTTR; alert accuracy; coverage. |

---

## 5.7 Product Polish (Improvements 22–24)

### F22. Audit Logs Backend Wiring

| Attribute | Specification |
|-----------|----------------|
| **User story** | As an admin, I want to query the real audit log so I investigate incidents. |
| **Functional requirements** | Audit Logs page calls `audit.query` with filters (user, entity, date range); pagination; export CSV; real data from `audit_log`. |
| **Non-functional** | Query <2s; index on actor, entityType, createdAt. |
| **Edge cases** | Large result set; retention cutoff. |
| **Failure states** | Query timeout; missing index. |
| **Data dependencies** | `audit_log` (or immutable store). |
| **API touchpoints** | `audit.list` or `auditLog.query`. |
| **Metrics** | Audit log queries; export usage. |

### F23. Real Estate Module Data-Backing

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a user, I want the Real Estate module to use real data so I can list and browse properties. |
| **Functional requirements** | Add `real_estate_listings` (or extend schema); CRUD; link to deals; replace placeholder photos with upload or placeholder service; filters. |
| **Non-functional** | Image CDN; search index. |
| **Edge cases** | No listings; draft vs published. |
| **Failure states** | Upload fail; missing fields. |
| **Data dependencies** | New or extended schema; S3/proxy for images. |
| **API touchpoints** | `realEstate.list`, `realEstate.create`, etc. |
| **Metrics** | Listings created; search usage. |

### F24. Deal Intelligence Pipeline

| Attribute | Specification |
|-----------|----------------|
| **User story** | As a user, I want deal intelligence extracted from my data so I get AI insights. |
| **Functional requirements** | Pipeline: ingest Fireflies transcripts or similar; extract entities, deals, relationships; populate Knowledge Graph; surface in Deal Intelligence page. |
| **Non-functional** | Async processing; idempotent; privacy (user-scoped). |
| **Edge cases** | Unstructured input; duplicates; low quality. |
| **Failure states** | Pipeline crash; storage full; rate limit. |
| **Data dependencies** | `enrichment_jobs`, Knowledge Graph tables; source data. |
| **API touchpoints** | `dealIntelligence.analyze`; pipeline worker. |
| **Metrics** | Documents processed; extraction quality; latency. |

---

# 6. System Architecture Overview

**Core components**

- **Frontend:** React 19 SPA; Vite; tRPC client; Framer Motion; Tailwind.
- **Backend:** Express; tRPC v11; Drizzle ORM; MySQL/TiDB.
- **AI:** Claude (intent, matching, deal intelligence); optional embedding service.
- **Storage:** S3/proxy for documents; vector DB for embeddings.
- **Auth:** JWT sessions; OAuth (GitHub); optional SSO.
- **Compliance:** External provider APIs (sanctions, PEP, adverse media).
- **Payments:** Escrow provider API; payout automation service.

**Data flow**

- User → Frontend → tRPC → Procedures → DB / External APIs.
- Events (deal close, verification) → Payout automation, Trust Score updater.
- Documents → S3 → E-signature provider → Webhook → DB update.

**Third-party integrations**

- DocuSign or Adobe Sign (e-signature).
- Refinitiv / ComplyAdvantage (compliance).
- SendGrid / Resend (email).
- Escrow.com or bank API (payments).
- Vector DB (Pgvector, Pinecone, or Weaviate).
- S3-compatible storage (documents, proofs).

**Scalability model**

- Stateless API servers; horizontal scaling.
- DB read replicas for heavy queries.
- Async workers for payout automation, embeddings, intelligence pipeline.
- CDN for static assets and images.

**Security considerations**

- All secrets in env; no client exposure.
- CORS, CSP, rate limiting.
- Audit every sensitive mutation.
- Encryption at rest for PII.

**Failure tolerance strategy**

- Graceful degradation: feature flags for new integrations.
- Circuit breakers for external APIs.
- Queue retries with backoff for async jobs.
- Fallback to manual workflows when automated path fails.

---

# 7. UX / UI Principles

**Core UX philosophy**

- Authority and depth (Bloomberg-terminal aesthetic for power users).
- Friction reduction at critical moments (onboarding, first match, first payout).
- Trust signals everywhere (verification badges, custody hashes, audit trail).
- Progressive disclosure (blind → NDA → full).

**Interaction model**

- Keyboard-first for power users; touch-friendly for mobile.
- Consistent card patterns (`card-elevated`); clear hierarchy.
- Inline validation; optimistic updates where safe.

**Trust signals**

- Verification tier badge; Trust Score; custody hash.
- "Verified" labels on counterparties; audit trail links.

**Friction reduction strategy**

- Prefill where possible; skip optional steps; one-click actions (e.g., "Accept match").
- Guided tour for discovery; tooltips for concepts.

**Empty states / loading states**

- Skeleton loaders; clear empty state copy with CTA.
- No blank screens; always explain what to do next.

---

# 8. Growth Mechanics

**Activation triggers**

- First relationship custodied; first intent created; first match; first deal room.
- Welcome banner post-onboarding; guided tour.

**Retention loops**

- Weekly match digest; payout notifications; deal stage updates.
- Trust Score visibility; tier progression.

**Referral mechanics**

- Invite counterparty; shared deal room; attribution visibility as social proof.

**Monetization triggers**

- Platform fee on closed deals; premium tiers for enhanced verification and intelligence.
- Escrow fee share; e-signature usage.

**Network effects**

- Each verified participant increases value for others.
- Relationship custody creates switching costs; attribution compounds.

---

# 9. Analytics & Metrics

**North Star Metric**

- **Closed deal value through ANAVI-attributed relationships** (monthly).

**Supporting KPIs**

- Verified users; relationships custodied; intents created; matches; deal rooms created; payouts.
- Verification completion rate; match-to-deal conversion; time-to-close.
- DAU/MAU; retention D1/D7/D30.

**Instrumentation requirements**

- Event tracking: `user_signed_up`, `relationship_created`, `intent_created`, `match_found`, `deal_room_created`, `deal_closed`, `payout_created`.
- Page views; feature usage; errors.

**Event schema outline**

```json
{
  "event": "string",
  "userId": "string",
  "timestamp": "ISO8601",
  "properties": {},
  "context": { "sessionId", "device", "url" }
}
```

---

# 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Technical:** Vector DB cost/scale | Start with Pgvector; migrate to Pinecone if needed. |
| **Technical:** E-signature provider lock-in | Abstract interface; support DocuSign + Adobe. |
| **Adoption:** Users don't trust custody | Real verification; external proofs; transparency. |
| **Adoption:** Compliance burden on SMBs | Tiered verification; Basic tier low-friction. |
| **Regulatory:** Jurisdiction variance | Compliance provider handles; legal review for new geos. |
| **Scalability:** Payout automation load | Async queue; batch processing; rate limits. |

---

# 11. MVP Definition

**Included in MVP (first ship)**

- F4 (GitHub OAuth)
- F12 (Route-level auth)
- F14 (CI gates)
- F15 (Global search)
- F16 (Guided tour + restart)
- F20 (Integration tests)
- F21 (Observability base)
- F22 (Audit logs wired)

**Excluded from MVP**

- F2 (Real compliance providers) — requires vendor selection and contract.
- F6 (External custody proofs) — requires key infrastructure.
- F11 (E-signature) — requires provider integration.
- F19 (Escrow) — requires provider and legal.
- F23 (Real Estate full) — lower priority.
- F24 (Deal Intelligence pipeline) — complex; Phase 2.

**Validation criteria**

- All MVP features ship; CI green; no critical auth bypass.
- Search returns results; tour completable; audit log queryable.

**Launch success threshold**

- Zero P0/P1 bugs in first 2 weeks; activation funnel measurable.

---

# 12. Build Phases

**Phase 1: Trust & Security (Months 1–3)**

- Scope: F1 (KYB workflow), F12 (auth enforcement), F13 (immutable audit), F14 (CI gates), F20 (integration tests), F21 (observability), F4 (GitHub OAuth).
- Success metrics: Auth enforced on all protected routes; audit append-only; CI blocks bad merges; OAuth conversion >0.
- Dependencies: Reviewer tooling for F1; log storage for F13.

**Phase 2: Core Value Loop (Months 4–8)**

- Scope: F2 (real compliance), F3 (trust automation), F5 (payout automation), F8 (vector pipeline), F9 (notifications), F10 (LP Portal), F15 (search), F16 (tour), F17 (Intelligence), F22 (audit wired).
- Success metrics: Match quality improvement; notification delivery >90%; LP Portal DAU; search CTR.
- Dependencies: Compliance provider contract; vector DB; email provider.

**Phase 3: Deal Infrastructure & Scale (Months 9–14)**

- Scope: F6 (custody proofs), F7 (payout statements), F11 (e-signature), F19 (escrow), F18 (mobile), F23 (Real Estate), F24 (Deal Intelligence pipeline).
- Success metrics: E-signature envelopes sent; escrow volume; mobile share; intelligence pipeline throughput.
- Dependencies: E-signature provider; escrow provider; Fireflies or equivalent data source.

---

# 13. Competitive Moat

**Data moat**

- Relationship graph, deal outcomes, attribution history create proprietary data.
- Vector embeddings and match quality improve with usage.

**Workflow lock-in**

- Custody and attribution become part of daily workflow.
- Switching means losing historical claims and re-onboarding.

**Switching costs**

- Relationships custodied; deal history; Trust Score.
- Network: counterparties on platform.

**Defensibility strategy**

- First-mover in relationship custody for private markets.
- Integrate deep with escrow, legal, compliance—ecosystem lock-in.
- Enterprise SSO and compliance for institutional stickiness.

---

# 14. Open Questions

1. **Compliance provider:** Refinitiv vs ComplyAdvantage vs other—cost, coverage, integration effort?
2. **Vector DB:** Pgvector vs Pinecone vs Weaviate—scale, cost, ops?
3. **E-signature:** DocuSign vs Adobe Sign—enterprise penetration, pricing?
4. **Escrow:** Escrow.com vs bank API vs crypto—jurisdiction, fees?
5. **Fireflies integration:** Contract status; data format; retention?
6. **Enterprise SSO:** SAML vs OIDC; which IdPs to support first?
7. **Payout automation:** Legal review for automated disbursement; dispute process?
8. **Mobile:** Native app vs PWA—roadmap timing?

---

*End of document.*
