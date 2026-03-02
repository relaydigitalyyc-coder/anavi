# DocuSign API Reference (ANAVI)

Last updated: 2026-03-02

## tRPC Routers

### `docusign.*`

- `getConfigStatus` (query)
  - Returns execution mode + config readiness flags.

- `getOauthStatus` (query)
  - Returns OAuth connection/token state for current user.

- `runDiagnostics` (query)
  - Runs mode-specific health checks (MCP reachability / OAuth userinfo / JWT token mint).

- `getOauthAuthorizeUrl` (mutation)
  - Input: `{ redirectUri? }`
  - Output: `{ authorizeUrl }`

- `completeOauthCode` (mutation)
  - Input: `{ state, code, redirectUri? }`
  - Exchanges auth code and stores tokens.

- `disconnectOauth` (mutation)
  - Deletes stored OAuth token for current user.

- `createEnvelope` (mutation)
  - Generic envelope creation contract (used by deeper flows).

- `sendEnvelope` (mutation)

- `createRecipientView` (mutation)

- `getEnvelope` (query)

- `voidEnvelope` (mutation)

- `connectWebhook` (mutation)
  - Contract-level webhook processor entry.

- `verifyConnectSignature` (query)
  - Utility signature verification endpoint.

### `dealRoom.*` (DocuSign-related)

- `createNdaEnvelope` (mutation)
  - Input: `{ dealRoomId, subject? }`
  - Creates or reuses an in-flight NDA envelope for room participants.

- `sendNdaEnvelope` (mutation)
  - Input: `{ envelopeId }`

- `getNdaSignUrl` (query)
  - Input: `{ envelopeId, returnUrl }`
  - Returns signer view URL for current user.

- `getNdaEnvelopes` (query)
  - Input: `{ dealRoomId }`
  - Returns envelopes + recipients for UI status panel.

## REST Endpoints

### OAuth

- `GET /api/integrations/docusign/oauth/start`
  - Starts OAuth flow and redirects to DocuSign authorize URL.
  - Query options:
    - `redirectUri` (optional)

- `GET /api/integrations/docusign/oauth/callback`
  - Handles DocuSign auth code callback.
  - Query options:
    - `state`
    - `code`
    - `returnUrl` (optional)
    - `redirectUri` (optional)

### Webhook

- `POST /api/webhooks/docusign`
  - Raw-body endpoint for DocuSign Connect.
  - Verifies `x-docusign-signature-1` when HMAC secret is configured.
  - Persists idempotent event rows and updates envelope/room state.

## Primary Source Files

- Runtime config: `server/_core/env.ts`
- Express route wiring: `server/_core/index.ts`
- Router contracts: `server/routers/docusign.ts`, `server/routers/dealRoom.ts`
- Provider logic: `server/services/docusign.ts`
- Persistence layer: `server/db/docusign.ts`
- Data schema: `drizzle/schema/docusign.ts`
