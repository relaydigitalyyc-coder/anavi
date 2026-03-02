import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { importPKCS8, SignJWT } from "jose";
import { ENV } from "../_core/env";
import {
  consumeDocusignOauthState,
  createDocusignOauthState,
  getDocusignOauthState,
  getDocusignOauthTokenByUserId,
  upsertDocusignOauthToken,
} from "../db";

export type DocusignRecipientInput = {
  role: "signer" | "viewer" | "cc";
  routingOrder: number;
  name: string;
  email: string;
  userId?: number;
};

export type DocusignDocumentInput = {
  name: string;
  fileUrl?: string;
  dealRoomDocumentId?: number;
  sha256PreSend?: string;
};

type TokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function oauthBaseUrl() {
  return ENV.docusignEnv === "prod"
    ? "https://account.docusign.com"
    : "https://account-d.docusign.com";
}

function normalizePrivateKey(raw: string) {
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function apiBaseUrl() {
  const trimmed = ENV.docusignBaseUri.replace(/\/$/, "");
  return trimmed.endsWith("/restapi") ? trimmed : `${trimmed}/restapi`;
}

function isMcpConfigured() {
  return Boolean(
    ENV.docusignMcpUrl && ENV.docusignMcpClientId && ENV.docusignMcpClientSecret
  );
}

function isOauthConfigured() {
  return Boolean(
    ENV.docusignIntegrationKey && ENV.docusignOauthClientSecret
  );
}

async function callMcpTool<T>(toolName: string, args: Record<string, unknown>) {
  if (!isMcpConfigured()) {
    throw new Error("DocuSign MCP is not fully configured");
  }
  const auth = Buffer.from(
    `${ENV.docusignMcpClientId}:${ENV.docusignMcpClientSecret}`
  ).toString("base64");

  const response = await fetch(ENV.docusignMcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: randomUUID(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DocuSign MCP request failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as {
    error?: { message?: string };
    result?: unknown;
  };
  if (payload.error) {
    throw new Error(payload.error.message ?? "DocuSign MCP error");
  }
  return payload.result as T;
}

async function listMcpTools() {
  if (!isMcpConfigured()) {
    throw new Error("DocuSign MCP is not fully configured");
  }
  const auth = Buffer.from(
    `${ENV.docusignMcpClientId}:${ENV.docusignMcpClientSecret}`
  ).toString("base64");
  const response = await fetch(ENV.docusignMcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: randomUUID(),
      method: "tools/list",
      params: {},
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`MCP tools/list failed: ${response.status} ${text}`);
  }
  const payload = JSON.parse(text) as {
    error?: { message?: string };
    result?: { tools?: Array<{ name?: string }> };
  };
  if (payload.error) {
    throw new Error(payload.error.message ?? "MCP tools/list error");
  }
  return payload.result?.tools ?? [];
}

export function isDocusignConfigured() {
  if (ENV.docusignExecutionMode === "mcp") {
    return isMcpConfigured();
  }
  if (ENV.docusignExecutionMode === "oauth") {
    return isOauthConfigured();
  }
  return Boolean(
    ENV.docusignIntegrationKey &&
      ENV.docusignAccountId &&
      ENV.docusignBaseUri &&
      ENV.docusignImpersonatedUserId &&
      ENV.docusignRsaPrivateKey
  );
}

async function getAccessToken() {
  if (!isDocusignConfigured()) {
    throw new Error("DocuSign is not fully configured in environment variables");
  }

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.token;
  }

  const privateKey = await importPKCS8(normalizePrivateKey(ENV.docusignRsaPrivateKey), "RS256");
  const assertion = await new SignJWT({ scope: "signature impersonation" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(ENV.docusignIntegrationKey)
    .setSubject(ENV.docusignImpersonatedUserId)
    .setAudience(oauthBaseUrl())
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(`${oauthBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DocuSign token request failed: ${response.status} ${text}`);
  }

  const json = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };
  return json.access_token;
}

async function providerRequest<T>(path: string, init: RequestInit) {
  const token = await getAccessToken();
  const response = await fetch(`${apiBaseUrl()}/v2.1/accounts/${ENV.docusignAccountId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DocuSign API request failed: ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

function base64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getOauthAccessTokenForUser(userId: number) {
  const token = await getDocusignOauthTokenByUserId(userId);
  if (!token) throw new Error("DocuSign OAuth token not found for user");

  const expiresAt = token.expiresAt ? token.expiresAt.getTime() : 0;
  if (expiresAt > Date.now() + 30_000) {
    return {
      accessToken: token.accessToken,
      accountId: token.providerAccountId ?? ENV.docusignAccountId,
      baseUri: token.providerBaseUri ?? ENV.docusignBaseUri,
    };
  }

  if (!token.refreshToken) {
    throw new Error("DocuSign OAuth token expired and no refresh token is available");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: token.refreshToken,
    client_id: ENV.docusignIntegrationKey,
    client_secret: ENV.docusignOauthClientSecret,
  });
  const response = await fetch(`${oauthBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DocuSign OAuth refresh failed: ${response.status} ${text}`);
  }
  const json = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };
  const refreshedExpiresAt = json.expires_in
    ? new Date(Date.now() + json.expires_in * 1000)
    : undefined;
  await upsertDocusignOauthToken({
    userId,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? token.refreshToken ?? undefined,
    expiresAt: refreshedExpiresAt,
    scope: json.scope ?? token.scope ?? undefined,
    tokenType: json.token_type ?? token.tokenType ?? undefined,
    providerUserId: token.providerUserId ?? undefined,
    providerAccountId: token.providerAccountId ?? undefined,
    providerBaseUri: token.providerBaseUri ?? undefined,
  });

  return {
    accessToken: json.access_token,
    accountId: token.providerAccountId ?? ENV.docusignAccountId,
    baseUri: token.providerBaseUri ?? ENV.docusignBaseUri,
  };
}

async function providerRequestForUser<T>(
  authUserId: number | undefined,
  path: string,
  init: RequestInit
) {
  if (ENV.docusignExecutionMode === "oauth") {
    if (!authUserId) {
      throw new Error("authUserId is required for DocuSign OAuth execution mode");
    }
    const oauth = await getOauthAccessTokenForUser(authUserId);
    const base = oauth.baseUri.replace(/\/$/, "");
    const restBase = base.endsWith("/restapi") ? base : `${base}/restapi`;
    const response = await fetch(`${restBase}/v2.1/accounts/${oauth.accountId}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${oauth.accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DocuSign OAuth API request failed: ${response.status} ${text}`);
    }
    return (await response.json()) as T;
  }
  return providerRequest<T>(path, init);
}

export async function createDocusignOauthAuthorizeUrl(input: {
  userId: number;
  redirectUri?: string;
}) {
  if (!isOauthConfigured()) {
    throw new Error("DocuSign OAuth is not configured (integration key/client secret missing)");
  }
  const redirectUri = input.redirectUri ?? ENV.docusignOauthRedirectUri;
  if (!redirectUri) {
    throw new Error("DocuSign OAuth redirect URI is not configured");
  }

  const state = base64Url(randomBytes(24));
  const codeVerifier = base64Url(randomBytes(48));
  const codeChallenge = base64Url(
    createHash("sha256").update(codeVerifier).digest()
  );
  await createDocusignOauthState({
    userId: input.userId,
    state,
    codeVerifier,
    redirectUri,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const params = new URLSearchParams({
    response_type: "code",
    scope: "signature impersonation",
    client_id: ENV.docusignIntegrationKey,
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${oauthBaseUrl()}/oauth/auth?${params.toString()}`;
}

export async function exchangeDocusignOauthCode(input: {
  userId: number;
  state: string;
  code: string;
  redirectUri?: string;
}) {
  if (!isOauthConfigured()) {
    throw new Error("DocuSign OAuth is not configured");
  }
  const stateRow = await getDocusignOauthState(input.state);
  if (!stateRow) throw new Error("Invalid OAuth state");
  if (stateRow.userId !== input.userId) throw new Error("OAuth state user mismatch");
  if (stateRow.usedAt) throw new Error("OAuth state already consumed");
  if (stateRow.expiresAt.getTime() < Date.now()) throw new Error("OAuth state expired");

  const redirectUri = input.redirectUri ?? stateRow.redirectUri;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    client_id: ENV.docusignIntegrationKey,
    client_secret: ENV.docusignOauthClientSecret,
    redirect_uri: redirectUri,
    code_verifier: stateRow.codeVerifier,
  });
  const response = await fetch(`${oauthBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DocuSign OAuth code exchange failed: ${response.status} ${text}`);
  }
  const token = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  const userInfoResponse = await fetch(`${oauthBaseUrl()}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const userInfo = userInfoResponse.ok
    ? ((await userInfoResponse.json()) as {
        sub?: string;
        accounts?: Array<{ account_id?: string; base_uri?: string; is_default?: boolean }>;
      })
    : undefined;
  const defaultAccount =
    userInfo?.accounts?.find((account) => account.is_default) ??
    userInfo?.accounts?.[0];

  await upsertDocusignOauthToken({
    userId: input.userId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    scope: token.scope,
    tokenType: token.token_type,
    expiresAt: token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000)
      : undefined,
    providerUserId: userInfo?.sub,
    providerAccountId: defaultAccount?.account_id,
    providerBaseUri: defaultAccount?.base_uri,
  });
  await consumeDocusignOauthState(stateRow.id);
  return {
    accountId: defaultAccount?.account_id ?? null,
    baseUri: defaultAccount?.base_uri ?? null,
    scope: token.scope ?? null,
  };
}

export async function createProviderEnvelope(input: {
  subject: string;
  templateId?: string;
  recipients: DocusignRecipientInput[];
  documents: DocusignDocumentInput[];
  authUserId?: number;
}) {
  if (ENV.docusignExecutionMode === "mcp") {
    const mcpResult = await callMcpTool<{
      envelopeId?: string;
      status?: string;
      recipients?: Array<{ recipientId?: string }>;
      documents?: Array<{ documentId?: string }>;
    }>("docusign_create_envelope", input as unknown as Record<string, unknown>);
    return {
      providerEnvelopeId: mcpResult.envelopeId ?? `mcp-env-${randomUUID()}`,
      status: mcpResult.status ?? "created",
      recipients: input.recipients.map((recipient, idx) => ({
        providerRecipientId:
          mcpResult.recipients?.[idx]?.recipientId ?? String(idx + 1),
        ...recipient,
      })),
      documents: input.documents.map((document, idx) => ({
        providerDocumentId:
          mcpResult.documents?.[idx]?.documentId ?? String(idx + 1),
        ...document,
      })),
    };
  }
  if (!isDocusignConfigured()) {
    return {
      providerEnvelopeId: `mock-env-${randomUUID()}`,
      status: "created",
      recipients: input.recipients.map((recipient, idx) => ({
        providerRecipientId: String(idx + 1),
        ...recipient,
      })),
      documents: input.documents.map((document, idx) => ({
        providerDocumentId: String(idx + 1),
        ...document,
      })),
    };
  }

  const signers = input.recipients
    .filter((recipient) => recipient.role === "signer")
    .map((recipient, idx) => ({
      email: recipient.email,
      name: recipient.name,
      recipientId: String(idx + 1),
      routingOrder: String(recipient.routingOrder),
      clientUserId: String(recipient.userId ?? idx + 1),
    }));

  const carbonCopies = input.recipients
    .filter((recipient) => recipient.role === "cc")
    .map((recipient, idx) => ({
      email: recipient.email,
      name: recipient.name,
      recipientId: String(100 + idx + 1),
      routingOrder: String(recipient.routingOrder),
    }));

  const payload: Record<string, unknown> = {
    emailSubject: input.subject,
    status: "created",
  };

  if (input.templateId) {
    payload.templateId = input.templateId;
    payload.templateRoles = signers.map((signer, idx) => ({
      email: signer.email,
      name: signer.name,
      roleName: `Signer${idx + 1}`,
      clientUserId: signer.clientUserId,
    }));
  } else {
    payload.recipients = {
      signers,
      carbonCopies,
    };
  }

  const response = await providerRequestForUser<{ envelopeId: string; status: string }>(input.authUserId, "/envelopes", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    providerEnvelopeId: response.envelopeId,
    status: response.status,
    recipients: input.recipients.map((recipient, idx) => ({
      providerRecipientId: String(idx + 1),
      ...recipient,
    })),
    documents: input.documents.map((document, idx) => ({
      providerDocumentId: String(idx + 1),
      ...document,
    })),
  };
}

export async function sendProviderEnvelope(
  providerEnvelopeId: string,
  authUserId?: number
) {
  if (ENV.docusignExecutionMode === "mcp") {
    const result = await callMcpTool<{ status?: string }>(
      "docusign_send_envelope",
      { envelopeId: providerEnvelopeId }
    );
    return { providerEnvelopeId, status: result.status ?? "sent" };
  }
  if (!isDocusignConfigured()) {
    return { providerEnvelopeId, status: "sent" as const };
  }

  const response = await providerRequestForUser<{ envelopeId: string; status: string }>(authUserId, `/envelopes/${providerEnvelopeId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "sent" }),
  });

  return { providerEnvelopeId: response.envelopeId, status: response.status };
}

export async function voidProviderEnvelope(
  providerEnvelopeId: string,
  reason: string,
  authUserId?: number
) {
  if (ENV.docusignExecutionMode === "mcp") {
    const result = await callMcpTool<{ status?: string }>(
      "docusign_void_envelope",
      { envelopeId: providerEnvelopeId, reason }
    );
    return { providerEnvelopeId, status: result.status ?? "voided" };
  }
  if (!isDocusignConfigured()) {
    return { providerEnvelopeId, status: "voided" as const };
  }

  const response = await providerRequestForUser<{ envelopeId: string; status: string }>(authUserId, `/envelopes/${providerEnvelopeId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "voided", voidedReason: reason }),
  });

  return { providerEnvelopeId: response.envelopeId, status: response.status };
}

export async function getProviderEnvelope(
  providerEnvelopeId: string,
  authUserId?: number
) {
  if (ENV.docusignExecutionMode === "mcp") {
    const result = await callMcpTool<{ status?: string }>(
      "docusign_get_envelope",
      { envelopeId: providerEnvelopeId }
    );
    return { providerEnvelopeId, status: result.status ?? "created" };
  }
  if (!isDocusignConfigured()) {
    return { providerEnvelopeId, status: "created" as const };
  }

  return providerRequestForUser<{ envelopeId: string; status: string }>(authUserId, `/envelopes/${providerEnvelopeId}`, {
    method: "GET",
  });
}

export async function createProviderRecipientView(input: {
  providerEnvelopeId: string;
  providerRecipientId: string;
  name: string;
  email: string;
  clientUserId?: string;
  returnUrl: string;
  authUserId?: number;
}) {
  if (ENV.docusignExecutionMode === "mcp") {
    const result = await callMcpTool<{ url?: string }>(
      "docusign_create_recipient_view",
      {
        envelopeId: input.providerEnvelopeId,
        recipientId: input.providerRecipientId,
        name: input.name,
        email: input.email,
        clientUserId: input.clientUserId,
        returnUrl: input.returnUrl,
      }
    );
    if (!result.url) {
      throw new Error("DocuSign MCP did not return a recipient view URL");
    }
    return { url: result.url };
  }
  if (!isDocusignConfigured()) {
    return { url: `${input.returnUrl}?mockDocusign=1&envelopeId=${encodeURIComponent(input.providerEnvelopeId)}` };
  }

  const response = await providerRequestForUser<{ url: string }>(input.authUserId, `/envelopes/${input.providerEnvelopeId}/views/recipient`, {
    method: "POST",
    body: JSON.stringify({
      authenticationMethod: "none",
      recipientId: input.providerRecipientId,
      userName: input.name,
      email: input.email,
      clientUserId: input.clientUserId ?? input.providerRecipientId,
      returnUrl: input.returnUrl,
    }),
  });

  return { url: response.url };
}

export function verifyDocusignConnectSignature(rawBody: Buffer, signatureHeader: string | undefined) {
  const secret = ENV.docusignConnectHmacSecret;
  if (!secret) return false;
  if (!signatureHeader) return false;

  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function mapEnvelopeEventToStatus(eventType: string) {
  const lower = eventType.toLowerCase();
  if (lower.includes("completed")) return "completed" as const;
  if (lower.includes("declined")) return "declined" as const;
  if (lower.includes("voided")) return "voided" as const;
  if (lower.includes("expired")) return "expired" as const;
  if (lower.includes("delivered")) return "delivered" as const;
  if (lower.includes("sent")) return "sent" as const;
  if (lower.includes("created")) return "created" as const;
  return "error" as const;
}

export async function runDocusignDiagnostics(userId: number) {
  const checks: Array<{ check: string; ok: boolean; detail: string }> = [];
  checks.push({
    check: "Execution Mode",
    ok: true,
    detail: ENV.docusignExecutionMode,
  });

  if (ENV.docusignExecutionMode === "mcp") {
    try {
      const tools = await listMcpTools();
      checks.push({
        check: "MCP Reachability",
        ok: true,
        detail: `reachable, tools=${tools.length}`,
      });
    } catch (error: any) {
      checks.push({
        check: "MCP Reachability",
        ok: false,
        detail: String(error?.message ?? error),
      });
    }
  }

  if (ENV.docusignExecutionMode === "oauth") {
    const token = await getDocusignOauthTokenByUserId(userId);
    checks.push({
      check: "OAuth Token Present",
      ok: Boolean(token),
      detail: token ? "token found" : "token missing",
    });
    if (token?.accessToken) {
      try {
        const response = await fetch(`${oauthBaseUrl()}/oauth/userinfo`, {
          headers: { Authorization: `Bearer ${token.accessToken}` },
        });
        checks.push({
          check: "OAuth UserInfo",
          ok: response.ok,
          detail: response.ok ? "userinfo reachable" : `status=${response.status}`,
        });
      } catch (error: any) {
        checks.push({
          check: "OAuth UserInfo",
          ok: false,
          detail: String(error?.message ?? error),
        });
      }
    }
  }

  if (ENV.docusignExecutionMode === "api") {
    try {
      await getAccessToken();
      checks.push({
        check: "JWT Access Token",
        ok: true,
        detail: "token minted",
      });
    } catch (error: any) {
      checks.push({
        check: "JWT Access Token",
        ok: false,
        detail: String(error?.message ?? error),
      });
    }
  }

  return {
    mode: ENV.docusignExecutionMode,
    ok: checks.every((item) => item.ok),
    checks,
    timestamp: new Date().toISOString(),
  };
}
