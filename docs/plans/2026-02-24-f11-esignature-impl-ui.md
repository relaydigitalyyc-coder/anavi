# F11: Deal Room E-Signature Integration — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** Deal Room E-Signature Integration  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.3  
**Overlap:** PRD-2 Document Data Room specifies e-signature

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

DocuSign or Adobe Sign API integration. "Request Signature" on document. Embed signing link. Webhook for completion. Update document status. OAuth for provider; webhook verification; audit.

### Architecture

Provider SDK (DocuSign/Adobe). OAuth flow for org; store tokens. `document_signatures` table: documentId, envelopeId, status, signedAt. Webhook handler: provider calls us on envelope complete; update DB; notify.

### Tech Stack

DocuSign eSignature API or Adobe Sign, Express, Drizzle ORM, tRPC v11, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | `documents`, `files`; add `document_signatures` |
| `anavi/client/src/pages/DealRoom.tsx` | Documents tab |
| PRD-2 | Document storage, S3, presigned URLs |

### Phase 1: Provider Integration

**Task 1 — Provider client**  
- `anavi/server/esignature-provider.ts`  
- `createEnvelope(documentUrl, signers[], title)` → envelopeId  
- OAuth: store refresh token; get access token  
- DocuSign: use `docusign-esign` SDK; Adobe: REST API  

**Task 2 — Request signature flow**  
- `document.requestSignature(documentId, signerEmails[])`  
- Fetch document URL (S3 presigned or public)  
- Create envelope; store `document_signatures` (status=sent)  
- Return signing URL for initiator to share  

**Task 3 — Webhook handler**  
- `POST /api/webhooks/docusign` (or Adobe)  
- Verify signature (HMAC)  
- On envelope complete: update `document_signatures` (status=completed, signedAt); update document metadata  
- Notify deal room participants  

### Phase 2: UI Integration

**Task 4 — Request Signature button**  
- Documents tab: each document row has "Request Signature"  
- Modal: add signer emails; send  
- Show envelope status: Sent, Viewed, Signed  

**Task 5 — Signing link display**  
- Copyable link for each signer  
- Or: redirect user to provider's signing page  

### Phase 3: Edge Cases

**Task 6 — Multiple signers**  
- Envelope supports multiple recipients; order optional  
- Track per-signer status if provider supports  

**Task 7 — Envelope voided, document replaced**  
- Webhook: void event → status=voided  
- If document replaced, create new envelope; old envelope obsolete  

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 2 → Task 4 → Task 5
Task 6, 7 (handling)
```

### Verification

- [ ] Request signature creates envelope
- [ ] Webhook updates status on sign
- [ ] Document shows "Signed" badge

---

## UI PRD

### User Story

As a deal participant, I want to sign documents in the deal room via DocuSign/Adobe Sign so we close faster.

### Entry Points

- Deal room → Documents tab → "Request Signature" on document  
- Email from provider: signer receives link to sign  
- Deal room: document status updates when signed  

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `RequestSignatureModal` | Add signers; send | — |
| `DocumentSignatureStatus` | Badge: Pending / Signed | — |
| `SigningLinkDisplay` | Copy link for signer | — |

### Design Tokens

- Signed: `bg-[#059669]/15 text-[#059669]`  
- Pending: `bg-[#F59E0B]/15 text-[#F59E0B]`  
- CTA: "Request Signature" — `btn-gold` or outline  

### Empty States

- No signers added: "Add at least one signer email."  

### Trust Signals

- "Secured by DocuSign" / "Adobe Sign"  
- Signed timestamp visible  
- Audit: who requested, when envelope sent  

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/server/esignature-provider.ts` | DocuSign/Adobe client |
| `anavi/drizzle/schema.ts` | document_signatures |
| `anavi/server/routers.ts` | document.requestSignature |
| `anavi/server/_core/index.ts` | Webhook route |
| `anavi/client/src/pages/DealRoom.tsx` | Documents tab + modal |
| `anavi/client/src/components/RequestSignatureModal.tsx` | — |
