export const APP_RUNTIME_MODES = ["demo", "hybrid", "live"] as const;

export type AppRuntimeMode = (typeof APP_RUNTIME_MODES)[number];

export const DEFAULT_APP_RUNTIME_MODE: AppRuntimeMode = "hybrid";

export type AppRuntimeCapabilities = {
  allowSyntheticUser: boolean;
  allowDemoFixtures: boolean;
  requireAuthRedirect: boolean;
};

export function parseAppRuntimeMode(input: string | null | undefined): AppRuntimeMode {
  if (!input) return DEFAULT_APP_RUNTIME_MODE;
  const normalized = input.trim().toLowerCase();
  return APP_RUNTIME_MODES.includes(normalized as AppRuntimeMode)
    ? (normalized as AppRuntimeMode)
    : DEFAULT_APP_RUNTIME_MODE;
}

export function getAppRuntimeCapabilities(mode: AppRuntimeMode): AppRuntimeCapabilities {
  if (mode === "demo") {
    return {
      allowSyntheticUser: true,
      allowDemoFixtures: true,
      requireAuthRedirect: false,
    };
  }

  if (mode === "live") {
    return {
      allowSyntheticUser: false,
      allowDemoFixtures: false,
      requireAuthRedirect: true,
    };
  }

  return {
    allowSyntheticUser: true,
    allowDemoFixtures: true,
    requireAuthRedirect: false,
  };
}
