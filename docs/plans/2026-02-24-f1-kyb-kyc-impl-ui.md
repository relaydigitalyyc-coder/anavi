# F1: KYB/KYC Verification Workflow — Implementation + UI PRD

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Feature:** KYB/KYC Verification Workflow  
**Source:** [ANAVI-PRD-24-High-Leverage-Improvements.md](ANAVI-PRD-24-High-Leverage-Improvements.md) §5.1  
**Excludes:** F4 (GitHub OAuth)

---

## Progress

> Master: [23-improvements-index](2026-02-24-23-improvements-index.md)

- [ ] Implementation complete
- [ ] UI complete
- [ ] Verified

---

## Implementation PRD

### Goal

End-to-end KYB/KYC workflow: document upload, reviewer queue (approve/reject/request-changes), status transitions, tier assignment (Basic/Enhanced/Institutional), email notifications.

### Architecture

Extend `verification_documents` and `users` (kybStatus, kycStatus, verificationTier). S3/proxy for storage. tRPC `verification.*` router. Admin reviewer UI.

### Tech Stack

Drizzle ORM, tRPC v11, React 19, S3-compatible storage, Resend/SendGrid, Vitest

### Pre-flight

| File | Contents |
|------|----------|
| `anavi/drizzle/schema.ts` | `verificationDocuments` table exists; `users` has kybStatus, kycStatus, verificationTier |
| `anavi/server/routers.ts` | Pattern: protectedProcedure, router |
| `anavi/client/src/pages/Verification.tsx` | Current verification UI; extend for upload + status |

### Phase 1: Document Upload + Storage

**Task 1 — Presigned upload endpoint**  
- `verification.requestUpload(documentType, mimeType)` → presigned PUT URL + key  
- S3 bucket; max 10MB; retention per jurisdiction  
- TDD: mock S3; assert URL returned

**Task 2 — Upload confirmation + persistence**  
- Client calls `verification.confirmUpload(fileKey, documentType)` after successful S3 PUT  
- Insert `verification_documents` (status=pending)  
- Virus scan (ClamAV/SentinelOne) before confirm; delete infected files

**Task 3 — Upload UI**  
- Verification page: document type selector (gov_id, business_license, etc.)  
- Dropzone → requestUpload → presigned PUT → confirmUpload  
- Progress indicator; success/error states

### Phase 2: Reviewer Queue + Status Transitions

**Task 4 — Reviewer queue procedures**  
- `verification.getQueue(status?)` — list pending/in_review for admins  
- `verification.review(documentId, action, notes)` — approve/reject/request_changes  
- Status: pending → in_review → approved/rejected  
- Update `users.kybStatus`/`kycStatus`, `verificationTier` on approve

**Task 5 — Reviewer UI**  
- Admin route `/verification-queue`  
- Table: document, user, type, submitted, actions (Approve/Reject/Request Changes)  
- Notes textarea; audit log on action

### Phase 3: Tier Assignment + Notifications

**Task 6 — Tier logic**  
- Config: Basic (1 doc), Enhanced (2+), Institutional (full suite)  
- On approval, recalc tier; update `users.verificationTier`

**Task 7 — Email notifications**  
- On status change: notify user (approved/rejected/request_changes)  
- Template: status, next steps, support link

### Dependency Map

```
Task 1 → Task 2 → Task 3
Task 4 → Task 5
Task 6 (after Task 4)
Task 7 (after Task 4)
```

### Verification

- [ ] `pnpm test` green
- [ ] Upload 10MB PDF; record created; virus scan blocks malware
- [ ] Reviewer approves; user tier updates; email sent

---

## UI PRD

### User Story

As an originator, I want to complete verification and receive a tier badge so counterparties trust me.

### Entry Points

- Verification page (existing): extend with upload + status display  
- Profile/settings: verification status badge + "Complete verification" CTA  
- Deal room: counterparty verification badge (read-only)

### Component Specs

| Component | Purpose | States |
|-----------|---------|--------|
| `DocumentUploadZone` | Dropzone for doc upload | idle, dragging, uploading, success, error |
| `VerificationStatusBadge` | Tier badge (Basic/Enhanced/Institutional) | pending, in_review, approved, rejected |
| `ReviewerQueueTable` | Admin queue | loading, rows, empty |
| `DocumentPreviewCard` | Thumbnail + metadata | — |

### Design Tokens

- **Approved:** `bg-[#059669]/15 text-[#059669]` badge
- **Pending:** `bg-[#F59E0B]/15 text-[#F59E0B]`
- **Rejected:** `bg-red-500/15 text-red-600`
- Card: `card-elevated`
- Dropzone border: `border-dashed border-2 border-[#1E3A5F]/30` when idle

### Empty States

- No documents: "Upload your first verification document. Accepted: gov ID, business license."
- Queue empty: "No documents pending review."

### Loading States

- Upload: progress bar + "Uploading…"
- Review: skeleton rows

### Accessibility

- Dropzone: keyboard focusable, aria-label
- Queue: sortable headers, screen reader announcements

---

## File Index

| File | Purpose |
|------|---------|
| `anavi/drizzle/schema.ts` | Extend verificationDocuments, users |
| `anavi/server/db.ts` | verification CRUD |
| `anavi/server/routers.ts` | verification router |
| `anavi/server/verification.test.ts` | Tests |
| `anavi/client/src/pages/Verification.tsx` | Upload + status |
| `anavi/client/src/pages/VerificationQueue.tsx` | Admin reviewer |
| `anavi/client/src/components/DocumentUploadZone.tsx` | Dropzone |
