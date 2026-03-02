# Handoff Packet — DocuSign Integration

**Date:** 2026-03-02
**Prepared by:** Engineering
**Scope:** ANAVI DocuSign MCP/OAuth/API integration and operational readiness

## 1) Canonical References

- Runbook: `DOCUSIGN_OPERATIONS_RUNBOOK.md`
- API reference: `DOCUSIGN_API_REFERENCE.md`
- Integration blueprint: `DOCUSIGN_INTEGRATION_BLUEPRINT.md`
- Active queue: `TODO_BOARD.md`
- Engineering memory: `ENGINEERING_MEMORY.md`

## 2) Current Implementation Status

Implemented:
- Backend execution modes: `mcp`, `oauth`, `api`
- Deal Room NDA lifecycle endpoints (create/send/sign-url/list)
- Connect webhook ingestion with idempotent event storage
- Envelope status sync + NDA access update + audit events
- Settings UI integration panel for connection status and OAuth connect/disconnect

Pending:
- Run DB migration generation/apply for DocuSign tables
- Confirm MCP RBAC entitlement in DocuSign tenant
- Production hardening (reconciliation + alerting)

## 3) Environment Checklist

Configured in app:
- `DOCUSIGN_EXECUTION_MODE`
- `DOCUSIGN_ENV`
- `DOCUSIGN_MCP_URL`
- `DOCUSIGN_MCP_CLIENT_ID`
- `DOCUSIGN_MCP_CLIENT_SECRET`
- `DOCUSIGN_OAUTH_CLIENT_SECRET`
- `DOCUSIGN_OAUTH_REDIRECT_URI`
- `DOCUSIGN_CONNECT_HMAC_SECRET`

Also used for JWT mode:
- `DOCUSIGN_ACCOUNT_ID`
- `DOCUSIGN_BASE_URI`
- `DOCUSIGN_IMPERSONATED_USER_ID`
- `DOCUSIGN_RSA_PRIVATE_KEY`

## 4) Admin/Tenant Actions Required

1. Ensure OAuth redirect URI exactly matches:
- `http://localhost:3000/api/integrations/docusign/oauth/callback`

2. Ensure MCP entitlement/RBAC is active for this account/integration key.
- Current observed failure during live MCP call: `403 RBAC: access denied`

3. Configure Connect webhook target:
- `POST /api/webhooks/docusign`
- Enable HMAC and set matching secret in env.

## 5) Smoke Test Procedure

1. Open Settings -> Security -> DocuSign Integration.
2. Verify config status and execution mode.
3. Connect OAuth if in OAuth mode.
4. Open a Deal Room -> Documents.
5. Trigger NDA flow:
- create envelope
- send envelope
- open sign URL
6. Confirm webhook event propagation and final NDA signed state.

## 6) Risk Snapshot

- MCP path currently blocked by RBAC at tenant edge.
- Migration not applied yet for latest DocuSign schema additions.
- Webhook health alerting/retry policy not fully hardened.

## 7) Next Work Items

1. Apply migrations for `drizzle/schema/docusign.ts` additions.
2. Add replay/reconciliation utility for failed webhook events.
3. Add one-click UI smoke-test action in Settings.
4. Add basic integration tests for envelope transition handling.
