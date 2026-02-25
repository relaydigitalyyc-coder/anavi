# White Paper Alignment — ANAVI Codebase

**Source:** ANAVI White Paper (Strategic Overview) | January 2026  
**Purpose:** Map white paper concepts to code locations so agents use consistent terminology and know where features live.

---

## Product Identity

| White Paper | Codebase |
|-------------|----------|
| **"The Private Market Operating System"** | Home.tsx badge (line 185), footer (882) |
| **"If Bloomberg runs public markets, ANAVI will run private ones."** | Vision statement — use in docs, not yet in UI |
| **"Relationship Operating System"** | Alternate framing — tooltips, Onboarding |
| **@navi** | Brand mark — nav, Home, Demo |

---

## Core Platform Components → Code Map

### 1. Verified Identity & Trust Scoring

| White Paper Concept | Code Location | Notes |
|---------------------|---------------|-------|
| **Trust Score** (0–100, dynamic) | `users.trustScore`, `trustScoreHistory` table | Schema: `drizzle/schema.ts`. Calculation: `server/db/users.ts` (recalculateTrustScore). Display: `Dashboard.tsx`, `Verification.tsx`, `Settings.tsx`, `tooltipContent.ts` |
| **Verification Badges** (Basic, Enhanced, Institutional) | `Verification.tsx` — tier system | Tiers 1–3. `TIER_FEATURES` in Verification.tsx |
| **KYB/KYC on onboarding** | `OnboardingFlow.tsx`, `verification` router | Document upload: `trpc.verification.requestUpload`, `confirmUpload` |
| **Peer Reviews** | `peerReviews` table, `server/db/notifications.ts` | Used in trust score calculation |
| **Whitelist Status** | Not yet implemented | Enhanced verification → premium deal flow |
| **Blacklist Monitoring** | `compliance` router, `complianceChecks` table | Sanctions screening: `trpc.compliance.runCheck`, `getChecks` |

### 2. Relationship Custody (Core Innovation)

| White Paper Concept | Code Location | Notes |
|---------------------|---------------|-------|
| **Timestamps ownership** | `relationships` table, `server/db/relationships.ts` | `createRelationship` — custody proof via `verificationProofs` / `getProof` |
| **Blind until consent** | `relationships.isBlind`, `grantConsent` | `trpc.relationship.grantConsent` |
| **Attribution** | `deals.originatorId`, `dealParticipants.attributionPercentage`, `payouts.attributionChain` | Schema: `drizzle/schema.ts`. Payout logic: `server/db/payouts.ts` |
| **Lifetime attribution** | `attributionChain` JSON, payout types `originator_fee`, `introducer_fee` | Follow-on deals → `triggerPayoutsOnDealClose` |
| **Originator share (40–60%)** | Default `attributionPercentage: '50.00'` in `deal` router | Configurable per deal participant |
| **Relationship graph** | `relationships`, `contactHandles`, `Network.tsx` | `trpc.relationship.getNetwork` |

### 3. AI-Powered Blind Matching

| White Paper Concept | Code Location | Notes |
|---------------------|---------------|-------|
| **Buy/Sell/Investment Intent** | `intents` table, `Intents.tsx`, `DealMatching.tsx` | `trpc.intent.list`, `create`, `update`, `findMatches` |
| **Blind matching** | `matches` table, match flow | Intent attributes anonymized until mutual consent |
| **NDA-gated deal room** | `dealRooms`, `DealRoom.tsx` | `trpc.dealRoom.get`, `getDocuments`, `requestSignature` |
| **Vector embeddings** | `intents` (embedding columns), `intent.recomputeEmbeddings` | Semantic matching |
| **Match notifications** | `notifications` table, `trpc.notification.list` | `match_found` type |

### 4. Embedded Deal Infrastructure

| White Paper Concept | Code Location | Notes |
|---------------------|---------------|-------|
| **Virtual Deal Rooms** | `dealRooms`, `DealRoom.tsx`, `deal-room/` tab components | Documents, diligence, compliance, escrow, payouts, audit |
| **E-signature** | `documentSignatures`, `trpc.dealRoom.requestSignature` | E-sign integration |
| **Compliance Rails** | `compliance` router, `Compliance.tsx`, `AuditLogs.tsx` | AML/KYC, sanctions, `audit_log` (hash-chained) |
| **Escrow** | `trpc.deal.getEscrowStatus`, `DealRoom` EscrowTab | Milestone-based |
| **Audit trail** | `audit_log` (hash-chained), `audit` router | Immutable, tamper-evident |

### 5. Transparent Economics & Automated Payouts

| White Paper Concept | Code Location | Notes |
|---------------------|---------------|-------|
| **Originator share** | `dealParticipants.role = 'originator'`, `attributionPercentage` | `server/db/payouts.ts` |
| **Contributor recognition** | `dealParticipants` (introducer, advisor, etc.), `payouts` | Proportional automated payouts |
| **Lifetime attribution** | `attributionChain`, payout triggers on deal close | `triggerPayoutsOnDealClose` |
| **Payout statements** | `Payouts.tsx`, `trpc.payout.getStatement`, `list` | |
| **Trajectory tracking** | Dashboard, DealRoom tabs | Deal progress, milestones |

---

## Terminology Reference (Use Consistently)

| Prefer | Avoid |
|--------|-------|
| Relationship Custody | Relationship management |
| Trust Score | Trust level, credibility score |
| Originator | Deal creator (when meaning relationship holder) |
| Attribution | Commission, fee share (when meaning automatic payout) |
| Blind matching | Anonymous matching (less precise) |
| Deal Room | Data room, VDR (when referring to ANAVI product) |
| Intent | Deal request, opportunity (when meaning structured buy/sell/invest) |

---

## Phased Rollout (White Paper) vs. Current Focus

- **Phase 1 (Current):** Relationship & Deal Layer — custody, verification, matching ✓  
- **Phase 2:** Project finance ($30M+ renewable energy) — planned  
- **Phase 3:** Platform extensions (credit, procurement, FinTech) — planned  
- **Phase 4:** Capital arms (ANAVI Ventures, Credit, Real Assets) — planned  

When implementing, align feature scope with the current phase. See `docs/ANAVI-PRD-24-High-Leverage-Improvements.md` and `docs/plans/` for detailed PRDs.

---

## Related Docs

- `anavi/whitepaper_analysis.md` — Extracted requirements from white paper
- `docs/ANAVI-PRD-24-High-Leverage-Improvements.md` — 24 improvements PRD
- `docs/plans/2026-02-25-prd-w1-trust-engine-impl.md` — Trust Engine implementation
