# DocuSign Integration Blueprint (ANAVI)

Date: 2026-03-02
Status: Implementation-ready contract + schema stage

## 1) Credential Model

Use environment variables only:

- `DOCUSIGN_INTEGRATION_KEY`
- `DOCUSIGN_ACCOUNT_ID`
- `DOCUSIGN_BASE_URI`
- `DOCUSIGN_IMPERSONATED_USER_ID`
- `DOCUSIGN_RSA_PRIVATE_KEY`
- `DOCUSIGN_CONNECT_HMAC_SECRET`
- `DOCUSIGN_ENV` (`demo` or `prod`)
- `DOCUSIGN_EXECUTION_MODE` (`api` or `mcp`)
- `DOCUSIGN_MCP_URL` (remote MCP endpoint)
- `DOCUSIGN_MCP_CLIENT_ID` (IK)
- `DOCUSIGN_MCP_CLIENT_SECRET` (Secret Key)
- `DOCUSIGN_OAUTH_CLIENT_SECRET`
- `DOCUSIGN_OAUTH_REDIRECT_URI`

Never commit keys to source control or docs.

Execution modes:
- `api`: direct eSignature API from ANAVI backend
- `oauth`: direct eSignature API from ANAVI backend using per-user OAuth tokens
- `mcp`: remote MCP tool calls from ANAVI backend, with ANAVI still persisting all state/audit

OAuth routes:
- `GET /api/integrations/docusign/oauth/start`
- `GET /api/integrations/docusign/oauth/callback`

## 2) Implemented Backend Contract Files

- Drizzle schema: `drizzle/schema/docusign.ts`
- Router contract: `server/routers/docusign.ts`
- Router registration: `server/routers/index.ts`

These define data contracts and endpoint signatures, but core provider service wiring remains pending.

## 3) Webhook Processor Pseudocode (Connect)

```ts
async function handleDocusignConnectWebhook(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-docusign-signature-1");

  // 1) Verify authenticity
  assertHmacValid(rawBody, signature, env.DOCUSIGN_CONNECT_HMAC_SECRET);

  const parsed = JSON.parse(rawBody);
  const eventId = parsed?.eventId ?? hash(rawBody);
  const envelopeId = parsed?.data?.envelopeId;
  const eventType = parsed?.event;

  // 2) Idempotency gate
  const exists = await db.findWebhookEventByProviderEventId(eventId);
  if (exists) return { accepted: true, duplicate: true };

  // 3) Persist incoming event (pending)
  const localEventId = await db.insertWebhookEvent({
    providerEventId: eventId,
    providerEnvelopeId: envelopeId,
    eventType,
    payloadJson: parsed,
    processStatus: "pending",
  });

  try {
    // 4) Load current envelope
    const envelope = await db.findEnvelopeByProviderEnvelopeId(envelopeId);
    if (!envelope) throw new Error("Envelope not found");

    // 5) Compute state transitions (monotonic, no regressions)
    const nextEnvelopeStatus = mapProviderEventToEnvelopeStatus(eventType);
    await db.updateEnvelopeStatusMonotonic(envelope.id, nextEnvelopeStatus, parsed.timestamp);

    // 6) Recipient updates
    const recipientEvents = extractRecipientEvents(parsed);
    for (const r of recipientEvents) {
      await db.updateRecipientStatusMonotonic(envelope.id, r.providerRecipientId, r.status, r.timestamp);
    }

    // 7) Deal-room milestone updates
    if (nextEnvelopeStatus === "completed") {
      await db.unlockDealRoomMilestoneFromEnvelope(envelope.dealRoomId, envelope.id);
    }

    // 8) Immutable audit write
    await db.logAuditEvent({
      userId: envelope.createdByUserId,
      action: `docusign_${eventType}`,
      entityType: "deal_room",
      entityId: envelope.dealRoomId,
      newState: {
        providerEnvelopeId: envelope.providerEnvelopeId,
        status: nextEnvelopeStatus,
      },
    });

    // 9) Mark processed
    await db.markWebhookProcessed(localEventId);

    return { accepted: true, processed: true };
  } catch (err) {
    await db.markWebhookFailed(localEventId, String(err));
    throw err;
  }
}
```

## 4) Service Layer Contract (to implement)

Create a provider adapter (`server/services/docusign/provider.ts`) with:

- `createEnvelope(input)`
- `sendEnvelope(providerEnvelopeId)`
- `createRecipientView(input)`
- `voidEnvelope(input)`
- `getEnvelope(providerEnvelopeId)`

And orchestration service (`server/services/docusign/orchestrator.ts`) with:

- `createEnvelopeForDealRoom(input)`
- `sendEnvelope(input)`
- `createEmbeddedSigningView(input)`
- `voidEnvelope(input)`
- `processConnectWebhook(input)`

## 5) Phased Delivery Plan (Mapped to TODO Board)

### Phase A: Contract + Schema (Completed)

- [x] Define envelope/recipient/document/webhook data model.
- [x] Define tRPC endpoint contracts.
- [x] Register router.

### Phase B: Provider + Persistence

- [ ] Add `server/db/docusign.ts` repository methods.
- [ ] Build DocuSign provider adapter with JWT auth.
- [ ] Wire router procedures to orchestrator.
- [ ] Persist envelope and recipient state transitions.

### Phase C: Webhooks + Audit + Milestones

- [ ] Add webhook endpoint wiring in API server.
- [ ] Verify webhook HMAC signature.
- [ ] Implement idempotent processing pipeline.
- [ ] Write immutable audit events per transition.
- [ ] Unlock milestone logic on completed envelope.

### Phase D: UX Wiring

- [ ] Add Deal Room action buttons (`Create NDA`, `Send`, `Sign`).
- [ ] Add embedded signing launch flow.
- [ ] Surface envelope status + recipient timeline in UI.
- [ ] Add retry/reconciliation controls for operators.

### Phase E: Hardening

- [ ] Reconciliation poller for missed webhook events.
- [ ] Alerting for stuck envelopes and failed webhooks.
- [ ] SLA dashboard metrics (`sent->completed`, decline rate, failure rate).
- [ ] Production cutover checklist (`demo` -> `prod`).

## 6) Acceptance Criteria

- Envelope status stays consistent between ANAVI and DocuSign.
- Duplicate webhooks do not create duplicate state transitions.
- Completed NDA envelope unlocks the configured deal-room milestone.
- All signing transitions appear in immutable audit trail.
