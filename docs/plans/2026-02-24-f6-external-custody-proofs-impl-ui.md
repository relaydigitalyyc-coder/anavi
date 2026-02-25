# F6: External Custody Proofs — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** External Custody Proofs  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.2

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

Sign relationship timestamp hash with platform key. Expose verifiable credential (W3C or custom). Allow export/sharing. Public verification endpoint for third parties. Signing latency <500ms.

### Architecture

`relationships.timestampHash` exists. Sign with platform private key (env). Verifiable credential format (JSON-LD or custom). `GET /api/verify/:hash` public endpoint. Key rotation policy; revocation list.

### Tech Stack

Node crypto (ECDSA or Ed25519), Drizzle ORM, Express, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | `relationships` with timestampHash |
| `anavi/server/_core/index.ts` | Express routes before tRPC |
| PRD-6 | Attribution hash chain; verify endpoint pattern |

### Phase 1: Signing + Proof Generation

**Task 1 — Signing module**  
- `anavi/server/custody-proof.ts`  
- `signRelationshipProof(relationshipId)`  
- Fetch relationship; hash = timestampHash + relationshipId  
- Sign with platform key (from env)  
- Return: { proof, signature, timestamp, relationshipId }

**Task 2 — Verifiable credential format**  
- W3C Verifiable Credential or custom JSON  
- Include: issuer (platform), subject (relationship), claim (ownership), proof (signature)  
- `relationship.getProof(relationshipId)` tRPC — protected  
- Returns JSON credential; user can export/share

**Task 3 — Public verification endpoint**  
- `GET /api/verify/custody/:hash` or `:signature`  
- Verify signature; return { valid, relationshipId?, timestamp }  
- No auth required; read-only

### Phase 2: Key Management + Revocation

**Task 4 — Key rotation**  
- Support multiple keys (key ID in proof)  
- Rotate: add new key; phase out old; update signing to use current  
- Verification accepts any valid key in rotation set

**Task 5 — Revocation list**  
- `revoked_proofs` table or JSON list  
- On revoke: add proof/signature to list  
- Verification checks list; return invalid if revoked  
- Revoke triggers: relationship deleted, dispute, etc.

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 1 → Task 4
Task 5 (parallel)
```

### Verification

- [ ] getProof returns valid VC
- [ ] Third party can verify via /api/verify
- [ ] Revoked proof returns invalid

---

## UI PRD

### User Story

As an originator, I want cryptographic proof of relationship ownership that I can externalize so I have portable claims.

### Entry Points

- Relationships page: "Get Proof" button on each relationship  
- Relationship detail: Proof section with download/share  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `CustodyProofCard` | Display proof status + actions | no proof, has proof, revoked |
| `ProofExportButton` | Download JSON/QR | — |
| `VerificationLinkDisplay` | Copyable URL for third-party verify | — |

### Design Tokens

- Proof badge: `bg-[#22D4F5]/10 text-[#22D4F5]` (custody/tech accent)  
- Copy button: `font-data-hud` for URL  
- Trust signal: "Verifiable by third parties at [URL]"  

### Empty States

- No proof yet: "Generate a verifiable proof to share with counterparties or auditors."

### Trust Signals

- Lock icon; "Cryptographically signed"  
- QR code option for in-person verification  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/custody-proof.ts` | Sign, verify, revoke |
| `anavi/server/routers.ts` | relationship.getProof |
| `anavi/server/_core/index.ts` | GET /api/verify/custody/:id |
| `anavi/client/src/components/CustodyProofCard.tsx` | UI |
