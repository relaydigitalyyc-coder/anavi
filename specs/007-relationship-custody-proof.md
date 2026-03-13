# Specification: 007-relationship-custody-proof

## Status

PENDING

## Mission Prompt (Ralph Build Loop)

Implement Relationship Custody Proof for ANAVI — the platform's core legal and technical differentiator. Every relationship upload must produce a **custody receipt** backed by an RFC-3161-equivalent timestamp, a SHA-256 content hash, and an originator claim. The receipt is the basis for lifetime attribution and priority claims.

This spec closes the highest-priority MVP-1 gap from `docs/plans/2026-03-01-prd-spec-upgrade.md` (Section 6, Gap Map):
> "RFC-3161 timestamping + custody receipt issuance"

Use ANAVI-first terminology in all user-facing copy:
- **Custody Receipt** — the legal timestamp artifact
- **Relationship Custody** — timestamped, attributed, blind-by-default
- **Originator ID** — the user who established the custody claim
- **Attribution Chain** — the sequence of originators eligible for lifetime fees
- **Trust Score** — updated when custody events occur

## Non-Negotiable Execution Rules

1. No completion claim without evidence (`pnpm check`, `pnpm test`, `pnpm build`).
2. Timestamp must be stored and retrievable — not simulated at display time.
3. SHA-256 hash computed over canonical relationship payload (deterministic).
4. Custody receipt must be downloadable as a human-readable JSON artifact.
5. Relationship privacy is preserved — custody receipt contains no PII in blind mode.
6. Keep docs and ops memory synchronized after each substantive pass.

---

## Background

ANAVI's whitepaper (Pillar 2) defines Relationship Custody as:
> "Relationships become timestamped, attributed assets. The originator who first registers a relationship holds a priority claim for lifetime attribution fees."

Currently, relationships are stored in the DB with a `timestampHash` column that is populated with `null` or a mock value. No actual SHA-256 content hash or RFC-3161 timestamp is computed. This spec makes the custody proof real.

**RFC-3161 note:** True RFC-3161 requires a Timestamp Authority (TSA) service (e.g., DigiCert, Sectigo). For MVP-1, we implement a **self-signed timestamp** using the server's wall clock + SHA-256, stored in the DB and displayed as a "ANAVI Custody Seal." The architecture allows a real TSA to be substituted with no UI changes. The spec doc must make this distinction clear to users.

---

## Functional Requirements

### FR-1: Custody Hash Computation

**Goal:** When a relationship is created or updated, compute a canonical SHA-256 hash over the relationship payload.

**Canonical payload (order matters for determinism):**
```typescript
type CustodyPayload = {
  originatorId: number;       // relationship ownerId
  contactIdentityHash: string; // SHA-256(contactId + SALT env var)
  relationshipType: string;   // "direct" | "introduction" | etc.
  strength: string;           // "weak" | "moderate" | "strong" | "very_strong"
  establishedAt: string;      // ISO 8601 UTC
  isBlind: boolean;
  attributionChain: number[]; // existing chain
};
```

**Hash computation:**
```
canonicalJson = JSON.stringify(payload, Object.keys(payload).sort())
timestampHash = SHA-256(canonicalJson + serverId + wallClockISO)
```

**Implementation location:** `server/db/custody.ts` (new file)
- `computeCustodyHash(payload: CustodyPayload): string`
- `issueCustodyReceipt(relationshipId: number, userId: number): Promise<CustodyReceipt>`

**Acceptance Criteria:**
- [ ] `computeCustodyHash` is deterministic for the same payload
- [ ] Hash is a 64-character hex string (SHA-256)
- [ ] Hash is stored in `relationships.timestampHash` on create/update
- [ ] No PII (name, email, phone) in the canonical payload

---

### FR-2: Custody Receipt Issuance

**Goal:** When a relationship is created (or retroactively sealed), issue a `CustodyReceipt` record.

**Schema addition:** Add `custodyReceipts` table to `drizzle/schema/users.ts`:
```typescript
export const custodyReceipts = mysqlTable("custody_receipts", {
  id:             int().primaryKey().autoincrement(),
  relationshipId: int().notNull().references(() => relationships.id),
  originatorId:   int().notNull().references(() => users.id),
  timestampHash:  varchar({ length: 64 }).notNull(),
  issuedAt:       timestamp().notNull().defaultNow(),
  sealVersion:    varchar({ length: 20 }).notNull().default("anavi-v1"),
  payloadJson:    text().notNull(),  // canonical payload JSON (no PII in blind mode)
  receiptJson:    text().notNull(),  // full receipt as downloadable artifact
  tsa:            varchar({ length: 255 }).default("anavi-self-signed"),
});
```

**Receipt JSON structure (the downloadable artifact):**
```json
{
  "anaviCustodySeal": "1.0",
  "receiptId": "anavi-rcpt-<id>",
  "originatorId": 42,
  "relationshipRef": "anavi-rel-<id>",
  "timestampHash": "abc123...",
  "issuedAt": "2026-03-13T14:22:00Z",
  "sealVersion": "anavi-v1",
  "tsa": "anavi-self-signed",
  "notice": "This seal uses ANAVI's internal timestamp authority. A Qualified TSA (RFC-3161) upgrade is available for legal-grade timestamping.",
  "canonicalPayload": { ... }  // the CustodyPayload (no PII)
}
```

**Acceptance Criteria:**
- [ ] `custody_receipts` table created via `pnpm db:push`
- [ ] Receipt issued automatically when a new relationship is created
- [ ] `issueCustodyReceipt` callable for existing relationships (retroactive sealing)
- [ ] Receipt JSON parseable and contains all required fields

---

### FR-3: tRPC Procedures

**Router:** `server/routers/custody.ts` (new file, merge into `routers/index.ts`)

**Procedures:**

```typescript
// Get custody receipt for a relationship
custody.getReceipt({ relationshipId: z.number() })
  → CustodyReceipt | null

// Issue or re-issue custody receipt (idempotent)
custody.sealRelationship({ relationshipId: z.number() })
  → CustodyReceipt

// Download receipt as JSON string
custody.downloadReceipt({ relationshipId: z.number() })
  → { json: string; filename: string }

// List all receipts for current user
custody.listMyReceipts()
  → CustodyReceipt[]
```

All procedures: `protectedProcedure`. User must own the relationship (ownerId === ctx.user.id).

**Acceptance Criteria:**
- [ ] `custody.getReceipt` returns null gracefully if no receipt exists
- [ ] `custody.sealRelationship` is idempotent (second call returns existing receipt)
- [ ] `custody.downloadReceipt` returns valid JSON with correct filename format: `anavi-custody-rcpt-<id>.json`
- [ ] Unauthorized access (not owner) throws `FORBIDDEN`

---

### FR-4: Relationship Creation Hook

**Goal:** Wire custody receipt issuance into `server/routers/relationship.ts` — on every new relationship creation, automatically issue a custody receipt.

**Change:** After `db.createRelationship(...)`, call:
```typescript
const receipt = await db.issueCustodyReceipt(newRelationship.id, ctx.user.id);
await db.logAuditEvent({
  userId: ctx.user.id,
  action: "custody_receipt_issued",
  entityType: "relationship",
  entityId: newRelationship.id,
  metadata: { receiptId: receipt.id, hash: receipt.timestampHash }
});
```

**Acceptance Criteria:**
- [ ] New relationship creation triggers custody receipt issuance
- [ ] Audit event logged with receipt metadata
- [ ] Existing relationships without receipts are NOT broken (no cascade)

---

### FR-5: Custody Receipt UI — Relationship Card

**Goal:** Display custody status on the Relationship Card component (`RelationshipCard.tsx`) with a "Sealed" or "Unsealed" indicator, and a button to view/download the receipt.

**Custody Status Badge (update existing pattern in RelationshipCard):**
```
● ANAVI CUSTODY SEAL            [View Receipt]
  Issued: Mar 13, 2026 14:22 UTC
  Hash: abc123...def (first 8 + last 4 chars shown)
```

**Badge variants:**
- **Sealed** (receipt exists): `InlineProofChip variant="sealed"` — `bg-blue-50 text-blue-700`
- **Unsealed** (no receipt): amber chip — `bg-[#F59E0B]/15 text-[#F59E0B]` with [Seal Now] button

**`[View Receipt]` button:** Opens a `Sheet` (side panel) with:
1. Full receipt JSON displayed in a code block (`<pre>` + `font-mono`)
2. `[Download JSON]` button — triggers browser download of the receipt JSON
3. Receipt metadata table: Receipt ID, Issued At, Hash, Seal Version, TSA
4. Disclaimer: "ANAVI Custody Seal (Internal). Legal-grade RFC-3161 timestamping available on request."

**Acceptance Criteria:**
- [ ] Sealed relationships show `InlineProofChip variant="sealed"` on the card
- [ ] Unsealed relationships show amber chip with `[Seal Now]` button
- [ ] `[Seal Now]` calls `custody.sealRelationship` mutation and updates card UI
- [ ] `[View Receipt]` opens Sheet with full receipt JSON
- [ ] `[Download JSON]` triggers file download in browser
- [ ] Sheet closes cleanly on backdrop click or Escape

---

### FR-6: Custody Register Page Integration

**Goal:** Update the `CustodyRegister` page (`/custody`) to show custody status for all relationships and a portfolio-level custody health metric.

**Add to `CustodyRegister.tsx`:**

**Header metric card:**
```
┌─────────────────────────────────────────────────────┐
│  CUSTODY PORTFOLIO HEALTH                           │
│  14 Sealed · 2 Unsealed · 16 Total                  │
│  [Seal All Unsealed] (batch action)                 │
└─────────────────────────────────────────────────────┘
```

**Per-row custody column in relationship table:**
- Shows `InlineProofChip variant="sealed"` or amber chip
- Clicking chip opens the custody receipt Sheet (reuse from FR-5)

**Acceptance Criteria:**
- [ ] Custody portfolio health card shows correct counts
- [ ] `[Seal All Unsealed]` button calls `custody.sealRelationship` for all unsealed relationships (sequential, with loading state)
- [ ] Custody column visible in relationship table
- [ ] Per-row receipt Sheet works

---

## UI Design Standards

**Consistent with existing system:**
- `InlineProofChip variant="sealed"` (blue) — already defined in `InlineProofChip.tsx`
- `InlineProofChip variant="attribution-locked"` (purple) — for chain-locked relationships
- `GlowingBorder` on the receipt viewer Sheet header
- `SmoothReveal` for the header metric card entry
- `font-mono` (`JetBrains Mono`) for hash display and JSON code block
- Gold accent `#C4972A` for the "Seal Now" CTA button (`.btn-gold` class)
- `Sheet` component from `@/components/ui/sheet`

---

## Backend File Map

| File | Change |
|------|--------|
| `server/db/custody.ts` | NEW — hash computation, receipt issuance, queries |
| `server/db/index.ts` | ADD custody exports |
| `server/routers/custody.ts` | NEW — getReceipt, sealRelationship, downloadReceipt, listMyReceipts |
| `server/routers/index.ts` | ADD custody router |
| `server/routers/relationship.ts` | MODIFY — auto-issue receipt on create |
| `drizzle/schema/users.ts` | ADD custodyReceipts table |
| `drizzle/relations.ts` | ADD custodyReceipts relation to relationships |

---

## Frontend File Map

| File | Change |
|------|--------|
| `pages/relationships/RelationshipCard.tsx` | ADD custody status chip + View/Seal buttons + Sheet |
| `pages/CustodyRegister.tsx` | ADD portfolio health card + custody column |

---

## Test Requirements

### Unit Tests

- `computeCustodyHash` is deterministic (same input → same output)
- `computeCustodyHash` changes when any payload field changes
- `issueCustodyReceipt` creates receipt with correct schema
- `custody.sealRelationship` is idempotent (second call does not create duplicate)
- Unauthorized user cannot access another user's receipt (FORBIDDEN)

### Integration Tests

- New relationship creation flow issues custody receipt automatically
- `custody.downloadReceipt` returns valid JSON string
- `RelationshipCard` renders sealed chip when receipt exists

---

## Success Criteria

1. Every new relationship creates a custody receipt with a real SHA-256 hash
2. Users can view and download their custody receipt from the Relationship Card
3. `CustodyRegister` page shows portfolio-level custody health
4. Audit log records every custody seal event
5. No PII in the custody receipt canonical payload (blind mode preserved)
6. `pnpm check` clean, `pnpm test` green, `pnpm build` succeeds

---

## Dependencies

- `drizzle/schema/users.ts` — relationships table (`timestampHash`, `ownerId`)
- `server/routers/relationship.ts` — create procedure to hook
- `client/src/components/InlineProofChip.tsx` — `sealed` variant
- `client/src/components/ui/sheet.tsx`
- `client/src/components/PremiumAnimations.tsx` — `GlowingBorder`, `SmoothReveal`
- Node.js `crypto` module — `createHash('sha256')`

---

## Completion Signal

### Implementation Checklist

- [ ] `drizzle/schema/users.ts` — `custodyReceipts` table added
- [ ] `drizzle/relations.ts` — relation added
- [ ] `pnpm db:push` — migration runs without error
- [ ] `server/db/custody.ts` — `computeCustodyHash`, `issueCustodyReceipt`, `getReceipt`, `listMyReceipts`, `downloadReceipt`
- [ ] `server/db/index.ts` — custody exports added
- [ ] `server/routers/custody.ts` — all four procedures
- [ ] `server/routers/index.ts` — custody router merged
- [ ] `server/routers/relationship.ts` — auto-issue wired to create
- [ ] `pages/relationships/RelationshipCard.tsx` — custody chip + Sheet
- [ ] `pages/CustodyRegister.tsx` — portfolio health card + column
- [ ] Unit + integration tests written and passing
- [ ] `pnpm check` — no TypeScript errors
- [ ] `pnpm test` — all tests green
- [ ] `pnpm build` — clean production build

### Iteration Instructions

If ANY check fails:
1. Identify the specific issue
2. Fix the code
3. Run tests again
4. Verify all criteria
5. Commit and push
6. Check again

**Only when ALL checks pass, output:** `<promise>DONE</promise>`
