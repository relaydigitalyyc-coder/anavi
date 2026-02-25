# ANAVI Whitepaper PRD Suite — Design Document
**Date:** 2026-02-25
**Source:** `/anavi-mega-archive/whitepaper_analysis.md`
**Approach:** C — Whitepaper Differentiators (5 PRDs mapped to competitive innovations)

---

## Context

The ANAVI whitepaper positions the platform as "the private market operating system — if Bloomberg runs public markets, ANAVI will run private ones." It defines five core components that create the competitive moat:

1. Verified Identity & Trust Scoring
2. Relationship Custody (cryptographic priority claims)
3. AI-Powered Blind Matching
4. Embedded Deal Infrastructure (escrow, compliance, e-sign)
5. Transparent Economics & Automated Payouts

A full gap analysis against the existing codebase found:
- **DB schema**: Complete across all 5 components (drizzle/schema.ts, 1100+ lines)
- **Backend logic**: Mostly stubs — trust score never calculated, custody hashes are fake, escrow returns hardcoded stub, payouts are read-only
- **UI**: Wired to tRPC but data is limited by backend gaps

These 5 PRDs close the gap between what exists and what the whitepaper requires.

---

## Execution Order

```
PRD-W2  Cryptographic Custody         (no external deps — ships first)
PRD-W1  Trust Engine                  (no external deps — ships second)
PRD-W3  Blind Matching + NDA Gateway  (depends on pdf-lib from prior PRD-2)
PRD-W4  Escrow & Milestone Rails      (requires Stripe Connect account)
PRD-W5  Payout Attribution Engine     (depends on W4 Stripe Connect + W2 attribution chain)
```

---

## PRD-W1: Trust Engine

### Problem Statement

The platform has `trustScore`, `trustScoreHistory`, `peerReviews`, `complianceChecks`, and `verificationDocuments` tables — but no algorithm that writes to `trustScore`. Every user defaults to the same value. The whitepaper's "dynamic rating based on verification depth, transaction history, dispute resolution, peer reviews" is the primary anti-fraud mechanism and the access gate for premium deal flow. Without it, Verification Badges, Whitelist Status, and tiered deal flow access are non-functional.

### Features

#### F1: Trust Score Algorithm
- **`calculateTrustScore(userId): number`** — pure function, called whenever relevant data changes
- Weighted formula:
  ```
  score =
    verificationTier * 0.30    // 0=none, 25=basic, 50=enhanced, 100=institutional
    + completedDeals * 0.25    // min(dealCount / 10, 1.0) * 100
    + peerReviewAvg * 0.20     // avg(professionalism, reliability, communication) * 20
    + compliancePassRate * 0.15 // (passed checks / total checks) * 100
    + tenureScore * 0.10       // min(monthsSinceJoined / 24, 1.0) * 100
  ```
- Returns 0–100 integer
- Called from: `verification.confirmUpload`, `deal.updateStage` (close/complete), `peerReview.create`, `compliance.runCheck` (on pass)
- Writes new row to `trustScoreHistory` with `changeSource`, `previousScore`, `newScore`, `reason`

#### F2: Compliance Automation
- `compliance.runCheck` wired to real screening:
  - **OFAC SDN XML** (free, no vendor contract): downloaded and cached server-side, refreshed daily via cron; checks name + aliases against sanctions list
  - **OpenCorporates API** (free tier): KYB business registration lookup by company name + jurisdiction
  - Fallback: if external call fails, status = `manual_review` (never auto-pass)
- Compliance check result drives trust score: pass → +5, fail → score floored to 0 + blacklist flag

#### F3: Badge Assignment Automation
- After every `calculateTrustScore` call, run `assignBadge(userId, score)`:
  - score < 40 → `verificationBadge = null`, `verificationTier = 'none'`
  - score ≥ 40 → `verificationBadge = 'basic'`, `verificationTier = 'basic'`
  - score ≥ 70 AND kybStatus = 'approved' → `verificationBadge = 'enhanced'`, `verificationTier = 'enhanced'`
  - score ≥ 90 AND complianceChecks all passed → `verificationBadge = 'institutional'`, `verificationTier = 'institutional'`

#### F4: Whitelist/Blacklist System
- New DB table: `userFlags`
  ```sql
  userFlags (
    id, userId, flagType ENUM('whitelist','blacklist','watchlist'),
    reason TEXT, flaggedBy userId, expiresAt TIMESTAMP nullable,
    createdAt, updatedAt
  )
  ```
- `protectedProcedure` middleware extended: checks `userFlags` on every request; blacklisted users receive `TRPCError({ code: 'FORBIDDEN', message: 'Account suspended' })`
- `admin.flagUser(userId, flagType, reason)` — operator-only mutation
- `admin.listFlags()` — paginated flag list with reason history

#### F5: Trust Score UI
- `Verification.tsx` — wire `calculateTrustScore` result to score display; animate score changes on page load
- Score breakdown tooltip showing each component's contribution
- Badge display on user profile cards across Relationships, Matches, DealRoom pages

### DB Changes
- New: `userFlags` table
- Modified: `users.trustScore` auto-updated by algorithm (previously static)

### tRPC Procedures
- `compliance.runCheck` — upgraded to real OFAC/OpenCorporates calls
- `user.getTrustScore` — returns score + breakdown by component
- `admin.flagUser` — create/update flag
- `admin.listFlags` — paginated flag list

### Acceptance Criteria
- [ ] `calculateTrustScore` returns deterministic result given same inputs
- [ ] New user starts at score reflecting only tenure (0–10)
- [ ] Completing KYB bumps score by ≥ 15 points
- [ ] Completing a deal bumps score (formula scales with deal count)
- [ ] Blacklisted user receives FORBIDDEN on any protected procedure
- [ ] OFAC check returns real sanctions data (test with known sanctioned entity name)
- [ ] Badge auto-assigns within 100ms of score recalculation
- [ ] `trustScoreHistory` has a row for every score change with correct `changeSource`

---

## PRD-W2: Cryptographic Relationship Custody

### Problem Statement

`relationships.timestampHash` and `timestampProof` exist in schema but are never populated with cryptographically valid data — the server writes placeholder strings. The whitepaper's core innovation is "cryptographically establishing priority claims on relationship introductions." Without real hashes, the platform cannot prove relationship ownership in any dispute, cannot sell the "we timestamp your relationships" value proposition, and the attribution chain (which drives payout economics) is never calculated.

### Features

#### F1: SHA-256 Hash Chain on Relationship Create
- On `relationship.create`:
  ```typescript
  const payload = JSON.stringify({
    userId: ctx.user.id,
    counterpartyHandle: input.counterpartyHandle,
    establishedAt: now.toISOString(),
    prevHash: await getLastRelationshipHash(ctx.user.id),
  })
  const hash = crypto.createHash('sha256').update(payload).digest('hex')
  const proof = Buffer.from(payload).toString('base64')
  ```
- Writes `timestampHash = hash`, `timestampProof = proof` to relationship row
- Same pattern already used in `auditLog` table (prevHash chain) — consistent architecture

#### F2: Public Verification Endpoint
- New Express route (not tRPC — must be publicly accessible without auth):
  - `GET /api/verify/relationship/:hash`
  - Returns `{ valid: boolean, establishedAt: string, ownerTier: string }` — never reveals identity
  - Validates by re-hashing `timestampProof` and comparing to `timestampHash`
- Enables external parties (lawyers, auditors) to verify relationship ownership without platform access

#### F3: Blind Exposure Enforcement
- `relationship.list` query changes:
  ```sql
  WHERE userId = :requestingUser
    OR (isBlind = false AND consentGiven = true)
  ```
  Blind relationships (`isBlind = true`) are only returned to their owner
- `relationship.get` adds same guard — throws `NOT_FOUND` if blind and not owner
- Blind toggle in `Relationships.tsx` — toggle `isBlind` field, confirm dialog explaining consequence

#### F4: Attribution Chain Calculator
- `calculateAttributionChain(dealId)` called from `deal.create`:
  1. Get `deal.counterpartyId` (buyer or seller)
  2. Query `relationships WHERE (userId = originator AND counterpartyHandle LIKE counterpartyId) ORDER BY establishedAt ASC LIMIT 1`
  3. If found: write `deal.attributionChain = [{ userId: relationship.userId, relationshipId: relationship.id, timestampHash: relationship.timestampHash, role: 'originator' }]`
  4. Add that user as `dealParticipant` with `role = 'originator'`, `attributionPercentage` derived from `relationship.attributionPercentage`

#### F5: Follow-On Deal Detection
- `isFollowOn` flag set on `deal.create`:
  - Query: `SELECT * FROM deals WHERE (buyerId = :counterparty OR sellerId = :counterparty) AND status = 'completed' AND originatorId = :currentOriginator`
  - If result found: `deal.isFollowOn = true`, `deal.originalDealId = result[0].id`
  - Propagates to `payout` rows (consumed by PRD-W5)

#### F6: Attribution UI
- `Relationships.tsx` — "Proof" button opens modal with hash, proof string, and QR code linking to `/api/verify/relationship/:hash`
- `DealRoom.tsx` Attribution tab — timeline showing introduction chain, each node's timestamp, hash fingerprint

### DB Changes
- None new — all fields exist. Logic writes to previously-empty fields.

### tRPC Procedures
- `relationship.create` — upgraded with real hash generation
- `relationship.list` / `relationship.get` — blind exposure enforcement
- `deal.create` — calls attribution chain calculator
- New Express route: `GET /api/verify/relationship/:hash`

### Acceptance Criteria
- [ ] `timestampHash` is a valid 64-char hex string on every new relationship
- [ ] `timestampProof` base64-decodes to valid JSON with all 4 fields
- [ ] `GET /api/verify/relationship/:hash` returns `valid: true` for real hashes, `valid: false` for tampered hashes
- [ ] Blind relationship is invisible to other users in `relationship.list`
- [ ] `deal.attributionChain` is populated for deals where counterparty matches a known relationship
- [ ] `deal.isFollowOn = true` when same counterparty appears in 2+ completed deals
- [ ] Hash chain is linkable (each hash's `prevHash` matches prior relationship's hash)

---

## PRD-W3: Blind Matching & NDA Gateway

### Problem Statement

The matching engine calls an LLM for compatibility scoring (functional), but operates on plaintext intent fields and reveals full counterparty information on match. The whitepaper requires: "AI matches complementary intents while revealing only that a qualified counterparty exists." Additionally, `match.createDealRoom` currently bypasses NDA requirements — users jump to full document access without signing. The `intents.embedding` field (vector) exists in schema but is never populated, making semantic similarity search impossible.

### Features

#### F1: Vector Embeddings on Intent Create/Update
- `intent.create` and `intent.update` call Claude to generate embedding:
  ```typescript
  // Use claude-sonnet-4-6 text-embedding via a structured prompt
  // Concatenate: intentType + assetType + description + keywords
  // Store as JSON array of 384 floats in intents.embedding
  ```
- Since Claude doesn't expose an embedding API directly, use the LLM to output a semantic keyword vector (structured JSON) that enables cosine-similarity first-pass filtering before the expensive scoring call

#### F2: Cosine Similarity Pre-filter
- `intent.findMatches` — before calling LLM scorer, filter candidates:
  ```typescript
  const candidates = await getCandidateIntents(userId) // opposing intentType
  const withSimilarity = candidates.map(c => ({
    ...c,
    similarity: cosineSimilarity(myIntent.embedding, c.embedding)
  }))
  const filtered = withSimilarity
    .filter(c => c.similarity > 0.4)
    .sort((a,b) => b.similarity - a.similarity)
    .slice(0, 10) // top 10 only go to LLM
  ```
- Reduces LLM calls from O(n) to O(10) regardless of platform size

#### F3: Anonymized Match Display
- `match.list` response — fields returned before mutual consent:
  - ✓ `compatibilityScore`, `matchReason`, `assetType`, `dealValueRange`
  - ✓ `counterpartyIndustry` (derived from their intent.assetType)
  - ✓ `counterpartyVerificationTier` (trust proxy without identity)
  - ✓ `counterpartyDealCount` (experience proxy)
  - ✗ Never: `counterpartyName`, `counterpartyCompany`, `counterpartyHandle`, `userId`
- After `match.expressInterest` from both sides (mutual consent): full reveal

#### F4: NDA Gateway on Deal Room Creation
- `match.createDealRoom` now requires:
  1. `ndaTemplateId` — references a standard NDA template (stored as text in DB)
  2. On creation: generates NDA PDF via `pdf-lib`, stores as document in deal room
  3. Sets `dealRoomAccess.ndaSigned = false` for both parties
  4. Returns deal room with `ndaRequired: true`
- New procedure: `dealRoom.signNda(dealRoomId)`:
  1. Marks `dealRoomAccess.ndaSigned = true`, `ndaSignedAt = now()`
  2. Writes to audit log
  3. If both parties have signed → unlocks document access (`accessLevel` becomes `view`)
- Document queries (`dealRoom.getDocuments`) throw `FORBIDDEN` if `ndaSigned = false` for requesting user

#### F5: NDA Template Management
- New table: `ndaTemplates` — `id`, `name`, `content` (markdown), `jurisdiction`, `createdBy`, `isDefault`
- Seed with 1 default NDA template (standard mutual NDA, no external vendor needed)
- `dealRoom.listNdaTemplates` — returns available templates

#### F6: Matching UI Upgrades
- `Matches.tsx` — anonymized card view with tier badge, deal count, asset type only
- "Sign NDA to Unlock" CTA when deal room created but NDA pending
- NDA signing modal (renders PDF preview via `pdf-lib`-generated content)

### DB Changes
- New: `ndaTemplates` table
- Modified: `intents.embedding` populated (was always null)
- Modified: `dealRoomAccess.ndaSigned` enforced in document queries

### tRPC Procedures
- `intent.create` / `intent.update` — add embedding generation
- `intent.findMatches` — add cosine pre-filter
- `match.list` — add anonymization layer
- `match.createDealRoom` — require NDA setup
- `dealRoom.signNda` — new
- `dealRoom.listNdaTemplates` — new
- `dealRoom.getDocuments` — add NDA guard

### Acceptance Criteria
- [ ] `intents.embedding` is non-null for all intents after create
- [ ] `intent.findMatches` calls LLM at most 10 times regardless of total intent count
- [ ] `match.list` never returns counterparty name/handle/company before mutual consent
- [ ] Creating a deal room from a match generates a PDF NDA document in the room
- [ ] `dealRoom.getDocuments` returns `FORBIDDEN` if user has not signed NDA
- [ ] After both parties sign NDA, `dealRoom.getDocuments` returns documents
- [ ] NDA signing is recorded in `auditLog`

---

## PRD-W4: Escrow & Milestone Payment Rails

### Problem Statement

`deal.getEscrowStatus` returns `{ status: 'not_configured', fundedAmount: 0 }` hardcoded. The `deals.milestones` JSON array has a `payoutTrigger` boolean on each milestone that is never evaluated. The whitepaper lists "integrated escrow for earnest money, deposits, milestone-based payments" as a core infrastructure component — it enables trust between unknown counterparties (the primary platform use case).

### Features

#### F1: Stripe Connect Integration
- Server-side: `server/_core/stripe.ts` — Stripe SDK initialized with `STRIPE_SECRET_KEY`
- `escrow.createAccount(dealId)` — creates a Stripe Connect Express account linked to the deal's seller; returns onboarding URL
- `escrow.fundEscrow(dealId, amount)` — creates a `PaymentIntent` with `capture_method: 'manual'` (held, not captured) linked to deal
- `escrow.getStatus(dealId)` — queries Stripe PaymentIntent status; replaces hardcoded stub
- `escrow.releaseToMilestone(dealId, milestoneIndex)` — captures and transfers proportional amount to seller's Connect account
- `escrow.refund(dealId)` — cancels uncaptured PaymentIntent (buyer protection)

**Required env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

#### F2: Milestone Engine
- `deal.completeMilestone(dealId, milestoneIndex)`:
  1. Validates milestone exists and is not already completed
  2. Sets `milestones[i].completedAt = now()`
  3. Checks `milestones[i].payoutTrigger === true` → calls `triggerMilestonePayout(dealId, milestoneIndex)`
  4. Writes audit log entry
  5. Notifies all `dealParticipants` via existing notification system
- `triggerMilestonePayout(dealId, milestoneIndex)`:
  1. Calculates proportional escrow release: `milestoneValue = deal.dealValue * (milestone.payoutPercentage / 100)`
  2. Calls `escrow.releaseToMilestone`
  3. Creates `payout` rows for each participant (consumed by PRD-W5 for execution)

#### F3: Closing Workflow Automation
- When all milestones completed → auto-call `deal.updateStage('completed')`
- `deal.updateStage('completed')`:
  1. Calls `calculateAttributionChain(dealId)` (from PRD-W2)
  2. Calls `triggerPayoutsOnDealClose(dealId)` — creates pending `payout` rows for all participants
  3. Calls `calculateTrustScore` for originator and participants (from PRD-W1)
  4. Sends closing notifications to all participants

#### F4: Escrow UI
- `DealRoom.tsx` Escrow tab — replace hardcoded stub with real `escrow.getStatus` data
- Fund escrow CTA → Stripe hosted checkout flow (redirect to Stripe, return to deal room)
- Milestone checklist with "Complete Milestone" button (operator/admin only)
- Escrow balance display, release history

### DB Changes
- New: `escrowAccounts` table: `dealId`, `stripeAccountId`, `stripePaymentIntentId`, `fundedAmount`, `releasedAmount`, `status` (unfunded, funded, partially_released, released, refunded)

### tRPC Procedures
- `escrow.createAccount` — new
- `escrow.fundEscrow` — new
- `escrow.getStatus` — replaces stub
- `escrow.releaseToMilestone` — new
- `escrow.refund` — new
- `deal.completeMilestone` — new
- `deal.getEscrowStatus` — upgraded (was stub)

### Acceptance Criteria
- [ ] `escrow.getStatus` returns real Stripe data (not hardcoded stub)
- [ ] Funding escrow creates a PaymentIntent in `capture_method: 'manual'` state
- [ ] Completing a payout-trigger milestone releases proportional escrow funds
- [ ] Completing all milestones triggers `deal.updateStage('completed')`
- [ ] Refunding escrow cancels the PaymentIntent
- [ ] Escrow tab in DealRoom shows real balance and release history
- [ ] Stripe webhook handler processes `payment_intent.succeeded` and `transfer.created` events

---

## PRD-W5: Payout Attribution Engine

### Problem Statement

The `payouts` table is entirely read-only — there are `list`, `getByDeal`, and `getStatement` queries but no mutations. The whitepaper's economic promise — "40-60% originator share, lifetime attribution, follow-on deal compensation" — is the primary incentive for originators to use ANAVI over traditional broker chains. Without execution, every deal that closes creates `payout` rows that sit permanently in `pending` status.

### Features

#### F1: Payout Calculation
- `payout.calculate(dealId)` — preview before execution, returns breakdown:
  ```typescript
  {
    totalIntermediaryFees: number,  // from deal.dealValue * feeRate
    splits: [{
      userId, role, attributionPercentage,
      amount, payoutType, isFollowOn
    }]
  }
  ```
- Split rules (whitepaper §5):
  - `originator`: `min(0.60, max(0.40, participant.attributionPercentage))` of total fees
  - `introducer`: proportional share of remaining after originator
  - `advisor`: fixed percentage from deal terms
  - `follow-on originator` (isFollowOn = true): 10% of total fees (lifetime attribution)
- `feeRate` defaults to 2% of deal value (configurable per deal)

#### F2: Payout Approval Workflow
- `payout.approve(payoutId)` — admin/operator only:
  1. Validates `payout.status === 'pending'`
  2. Validates `deal.stage === 'completed'`
  3. Transitions `status → 'approved'`
  4. Writes audit log
- `payout.bulkApprove(dealId)` — approves all pending payouts for a deal in one call

#### F3: Payout Execution via Stripe Connect
- `payout.execute(payoutId)` — admin/operator only:
  1. Validates `payout.status === 'approved'`
  2. Looks up recipient's Stripe Connect account from `escrowAccounts`
  3. Calls `stripe.transfers.create({ amount, currency: 'usd', destination: stripeAccountId })`
  4. Transitions `status → 'processing'`
  5. Stripe webhook `transfer.paid` event → transitions `status → 'completed'`, writes `paidAt`
- `payout.execute` fails gracefully if recipient has no connected account: sets `status → 'pending_banking'`, notifies user to complete Stripe Connect onboarding

#### F4: Statement Upgrades
- `payout.getStatement` now includes:
  - `lifetimeEarnings` — sum of all completed payouts for user across all deals
  - `pendingPayouts` — sum of pending + approved payouts
  - `followOnEarnings` — sum of payouts where `isFollowOn = true`
  - `originatorEarnings` — sum where `payoutType = 'originator_fee'`
  - `introducerEarnings` — sum where `payoutType = 'introducer_fee'`

#### F5: Payout UI
- `Payouts.tsx` — add approval and execution controls (admin-only, behind role check)
- "Calculate Payouts" button on deal close that shows breakdown modal before creating payout rows
- Statement panel with lifetime / pending / follow-on breakdowns
- Payout status badges: pending (amber), approved (blue), processing (purple), completed (green), failed (red)

### DB Changes
- None new — all fields exist. Logic populates previously-empty fields.

### tRPC Procedures
- `payout.calculate` — new
- `payout.approve` — new
- `payout.bulkApprove` — new
- `payout.execute` — new
- `payout.getStatement` — upgraded with aggregates

### Acceptance Criteria
- [ ] `payout.calculate` returns correct originator percentage (40-60% of fees)
- [ ] Follow-on deal payouts include 10% lifetime attribution for original relationship owner
- [ ] `payout.approve` rejects if deal is not `completed`
- [ ] `payout.execute` creates a Stripe transfer to recipient's Connect account
- [ ] Stripe webhook marks payout `completed` and writes `paidAt`
- [ ] User with no Connect account receives `pending_banking` status with onboarding link
- [ ] `payout.getStatement` returns `lifetimeEarnings` and `followOnEarnings` aggregates
- [ ] Admin-only procedures reject non-admin callers with `UNAUTHORIZED`

---

## Cross-PRD Dependency Map

```
PRD-W1 Trust Engine
  └─ reads: verificationDocuments, peerReviews, complianceChecks, deals
  └─ writes: users.trustScore, trustScoreHistory, users.verificationBadge, userFlags
  └─ called by: W4 (deal close recalculates score)

PRD-W2 Cryptographic Custody
  └─ reads: relationships, auditLog (for prevHash)
  └─ writes: relationships.timestampHash, relationships.timestampProof
             relationships.attributionChain, deals.isFollowOn
  └─ called by: W4 (attribution chain on deal create), W5 (isFollowOn flag)
  └─ exposes: GET /api/verify/relationship/:hash (public, no auth)

PRD-W3 Blind Matching + NDA Gateway
  └─ reads: intents, matches, dealRoomAccess
  └─ writes: intents.embedding, dealRoomAccess.ndaSigned, ndaTemplates
  └─ called by: W4 (deal room creation requires NDA signed before document access)

PRD-W4 Escrow & Milestone Rails
  └─ reads: deals.milestones, dealParticipants
  └─ writes: escrowAccounts, deals.stage, payouts (pending rows)
  └─ calls: W1 (trust score on close), W2 (attribution chain on close)
  └─ depends on: Stripe Connect account (vendor)

PRD-W5 Payout Attribution Engine
  └─ reads: payouts, dealParticipants, deals.attributionChain, escrowAccounts
  └─ writes: payouts.status, payouts.paidAt
  └─ depends on: W4 (escrowAccounts for Stripe destination), W2 (isFollowOn flag)
  └─ depends on: Stripe Connect account (vendor)
```

---

## External Dependencies

| Vendor | PRD | Required for | Free Tier? | Contract Needed? |
|--------|-----|-------------|------------|-----------------|
| OFAC SDN XML | W1 | Sanctions screening | Free (US gov) | No |
| OpenCorporates | W1 | KYB lookup | Yes (limited) | No for MVP |
| Stripe Connect | W4, W5 | Escrow + payouts | No fees until payout | Yes (Stripe ToS) |
| pdf-lib | W3 | NDA PDF generation | Free (npm) | No |

All external dependencies have free/no-contract options for MVP. Stripe Connect requires a Stripe account but has no upfront cost.

---

## Testing Strategy

Each PRD follows TDD:
1. Write failing test against the stub behavior
2. Run to confirm red
3. Implement
4. Run to confirm green
5. Commit

Key test patterns from `anavi/server/anavi.test.ts`:
```typescript
vi.mock('./db', () => ({ getDb: vi.fn() }))
const ctx = createAuthContext({ id: 'user1', trustScore: 50 })
const caller = appRouter.createCaller(ctx)
```

Trust score tests must mock `getDb` to return deterministic history, review, and compliance data.
Stripe tests use `stripe-mock` or `vi.mock('@stripe/stripe-js')`.
Hash chain tests verify SHA-256 output is deterministic given same input.
