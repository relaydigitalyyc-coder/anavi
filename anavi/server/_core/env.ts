import {
  getAppRuntimeCapabilities,
  parseAppRuntimeMode,
} from "@shared/appMode";

const appRuntimeMode = parseAppRuntimeMode(process.env.APP_RUNTIME_MODE);

if (appRuntimeMode === "live" && !process.env.JWT_SECRET) {
  console.warn(
    "[ANAVI] WARNING: JWT_SECRET is not set in live mode — using insecure default. Set JWT_SECRET in your environment."
  );
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "prelaunch-demo-secret-32-chars-ok!",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  docusignIntegrationKey: process.env.DOCUSIGN_INTEGRATION_KEY ?? "",
  docusignAccountId: process.env.DOCUSIGN_ACCOUNT_ID ?? "",
  docusignBaseUri: process.env.DOCUSIGN_BASE_URI ?? "",
  docusignImpersonatedUserId: process.env.DOCUSIGN_IMPERSONATED_USER_ID ?? "",
  docusignRsaPrivateKey: process.env.DOCUSIGN_RSA_PRIVATE_KEY ?? "",
  docusignConnectHmacSecret: process.env.DOCUSIGN_CONNECT_HMAC_SECRET ?? "",
  docusignEnv: process.env.DOCUSIGN_ENV === "prod" ? "prod" : "demo",
  docusignExecutionMode:
    process.env.DOCUSIGN_EXECUTION_MODE === "mcp"
      ? "mcp"
      : process.env.DOCUSIGN_EXECUTION_MODE === "oauth"
        ? "oauth"
        : "api",
  docusignMcpUrl: process.env.DOCUSIGN_MCP_URL ?? "",
  docusignMcpClientId: process.env.DOCUSIGN_MCP_CLIENT_ID ?? "",
  docusignMcpClientSecret: process.env.DOCUSIGN_MCP_CLIENT_SECRET ?? "",
  docusignOauthRedirectUri: process.env.DOCUSIGN_OAUTH_REDIRECT_URI ?? "",
  docusignOauthClientSecret:
    process.env.DOCUSIGN_OAUTH_CLIENT_SECRET ??
    process.env.DOCUSIGN_MCP_CLIENT_SECRET ??
    "",
  appRuntimeMode,
  appRuntimeCapabilities: getAppRuntimeCapabilities(appRuntimeMode),
};
