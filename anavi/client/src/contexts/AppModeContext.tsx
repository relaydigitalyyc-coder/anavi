import {
  DEFAULT_APP_RUNTIME_MODE,
  getAppRuntimeCapabilities,
  parseAppRuntimeMode,
  type AppRuntimeMode,
} from "@shared/appMode";
import { createContext, useContext, type ReactNode } from "react";

type AppModeContextValue = {
  mode: AppRuntimeMode;
  capabilities: ReturnType<typeof getAppRuntimeCapabilities>;
  isDemoMode: boolean;
  isLiveMode: boolean;
};

function readRuntimeModeFromEnv(): AppRuntimeMode {
  return parseAppRuntimeMode(
    import.meta.env.VITE_APP_RUNTIME_MODE ?? import.meta.env.APP_RUNTIME_MODE
  );
}

const mode = readRuntimeModeFromEnv();
const capabilities = getAppRuntimeCapabilities(mode);

const AppModeContext = createContext<AppModeContextValue>({
  mode: DEFAULT_APP_RUNTIME_MODE,
  capabilities: getAppRuntimeCapabilities(DEFAULT_APP_RUNTIME_MODE),
  isDemoMode: false,
  isLiveMode: false,
});

export function AppModeProvider({ children }: { children: ReactNode }) {
  return (
    <AppModeContext.Provider
      value={{
        mode,
        capabilities,
        isDemoMode: mode === "demo",
        isLiveMode: mode === "live",
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
