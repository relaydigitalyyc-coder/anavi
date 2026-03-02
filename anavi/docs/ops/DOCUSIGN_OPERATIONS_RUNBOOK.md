# DocuSign Operations Runbook

Last updated: 2026-03-02
Owner: Engineering

## Purpose

This runbook is the operational source of truth for DocuSign in ANAVI: architecture, setup, environments, test flow, troubleshooting, and production cutover.

## Current Implementation Scope

Implemented in code:
- DocuSign execution modes: `mcp`, `oauth`, `api`
- Deal Room NDA flow endpoints:
  - create envelope
  - send envelope
  - generate signer view URL
  - envelope status listing
- Connect webhook ingestion with idempotent storage and status updates
- Audit event logging for envelope lifecycle
- Settings UI for connection health and OAuth connect/disconnect

Pending:
- DB migration generation/apply for new DocuSign tables
- Full production hardening (alerts/reconciliation)

## Architecture

### Control and execution planes

- Control plane: ANAVI backend (`server/services/docusign.ts`)
- Execution plane:
  - `mcp`: remote MCP endpoint calls
  - `oauth`: direct eSignature API with per-user OAuth token
  - `api`: direct eSignature API with JWT service credentials

### Core paths

1. User initiates NDA from Deal Room (`DocumentsTab`).
2. ANAVI creates envelope + recipients + docs in local DB.
3. ANAVI sends envelope and opens signer view URL.
4. DocuSign Connect posts lifecycle events to `/api/webhooks/docusign`.
5. ANAVI updates envelope status + NDA signed state + audit chain.

## Configuration

Use `anavi/.env.local` (gitignored).

### Required baseline

- `DOCUSIGN_ENV=demo|prod`
- `DOCUSIGN_EXECUTION_MODE=mcp|oauth|api`

### MCP mode

- `DOCUSIGN_MCP_URL` (example: `https://mcp-d.docusign.com/mcp`)
- `DOCUSIGN_MCP_CLIENT_ID` (Integration Key)
- `DOCUSIGN_MCP_CLIENT_SECRET` (Secret Key)

### OAuth mode

- `DOCUSIGN_INTEGRATION_KEY`
- `DOCUSIGN_OAUTH_CLIENT_SECRET`
- `DOCUSIGN_OAUTH_REDIRECT_URI`

### API/JWT mode

- `DOCUSIGN_INTEGRATION_KEY`
- `DOCUSIGN_ACCOUNT_ID`
- `DOCUSIGN_BASE_URI`
- `DOCUSIGN_IMPERSONATED_USER_ID`
- `DOCUSIGN_RSA_PRIVATE_KEY`

### Webhook verification

- `DOCUSIGN_CONNECT_HMAC_SECRET`

## DocuSign Admin Setup Checklist

1. Apps and Keys
- Integration Key exists and is active.
- Secret Key generated for Auth Code/MCP.
- RSA keypair generated for JWT mode (if used).

2. OAuth redirect URI
- Add exactly: `http://localhost:3000/api/integrations/docusign/oauth/callback`

3. MCP access
- Ensure account/app has RBAC entitlement for MCP endpoint access.
- If MCP returns `403 RBAC: access denied`, entitlement is missing.

4. Connect webhook
- Configure Connect to target `/api/webhooks/docusign`.
- Enable HMAC and copy shared secret into env.

## Runtime Health Checks

### App-level

- Settings -> Security -> DocuSign Integration panel
  - `configured`
  - `executionMode`
  - OAuth connected/disconnected
  - MCP/OAuth env presence flags
  - `Run Diagnostics` action for mode-aware health checks

### API-level

- tRPC `docusign.getConfigStatus`
- tRPC `docusign.getOauthStatus`

### Server-level

- Startup and webhook logs in `server/_core/index.ts`

## End-to-End Test Procedure

1. Start app in `demo` DocuSign env.
2. Connect OAuth from Settings (if `oauth` mode).
3. Open a Deal Room -> Documents.
4. Trigger NDA signing flow.
5. Verify:
- envelope appears in workflow panel
- status transitions (`created` -> `sent` -> `completed`)
- signer view opens
- webhook updates local envelope state
- deal room access marks `ndaSigned=true`
- audit event rows appear for lifecycle changes

## Troubleshooting Matrix

### MCP `403 RBAC: access denied`

Cause:
- DocuSign-side entitlement/permissions missing for MCP.

Action:
- Update DocuSign admin RBAC/app permissions.

### OAuth callback fails

Cause:
- Redirect URI mismatch or missing state/code.

Action:
- Verify redirect URI exact match in Admin and env.
- Ensure callback route is reachable and no proxy strips query params.

### Envelope creation succeeds but no status updates

Cause:
- Connect webhook not configured or signature invalid.

Action:
- Confirm Connect target URL and HMAC secret match.
- Check webhook endpoint receives raw body and signature header.

### Envelope status stale

Cause:
- Missed webhook or processing failure.

Action:
- Inspect `docusign_webhook_events` rows and `processStatus`.
- Reprocess failed payloads manually.

## Security and Compliance Notes

- Keep credentials only in env/secret manager.
- Do not log tokens/secret values.
- Treat webhook payloads as sensitive records.
- Keep audit logging enabled for all envelope lifecycle transitions.

## Production Cutover Checklist

1. Move from demo to prod DocuSign tenant values.
2. Rotate integration secrets and RSA keys.
3. Confirm OAuth consent + redirect URI for production domain.
4. Confirm Connect webhook URL and HMAC secret in prod.
5. Run full E2E smoke test in production-like environment.
6. Enable alerts for webhook failures and stuck envelopes.
