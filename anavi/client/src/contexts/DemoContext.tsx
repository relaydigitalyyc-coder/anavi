// client/src/contexts/DemoContext.tsx
// Whitepaper-aligned demo context. Zero API calls in demo mode.
// Pages check useDemoFixtures() — if truthy, use fixture data; if null, use real tRPC.

import { createContext, useContext, useState, type ReactNode } from "react";
import type { PersonaKey } from "@/lib/copy";
import { useAppMode } from "@/contexts/AppModeContext";
import {
  getDemoFixtures,
  type DemoFixtures,
  type DemoScenarioKey,
} from "@/lib/demoFixtures";

interface DemoContextValue {
  isDemo: boolean;
  persona: PersonaKey | null;
  activePersona: PersonaKey | null;
  activeIndustry: string;
  activeScenario: DemoScenarioKey;
  fixtures: DemoFixtures[PersonaKey] | null;
  switchPersona: (p: PersonaKey) => void;
  switchIndustry: (i: string) => void;
  switchScenario: (s: DemoScenarioKey) => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemo: false,
  persona: null,
  activePersona: null,
  activeIndustry: "Infrastructure",
  activeScenario: "baseline",
  fixtures: null,
  switchPersona: () => {},
  switchIndustry: () => {},
  switchScenario: () => {},
});

export function DemoContextProvider({
  persona,
  children,
}: {
  persona: PersonaKey;
  children: ReactNode;
}) {
  const { capabilities } = useAppMode();
  const [activePersona, setActivePersona] = useState<PersonaKey>(persona);
  const [activeIndustry, setActiveIndustry] = useState<string>(
    persona === "investor" ? "Infrastructure" : "Commodities"
  );
  const [activeScenario, setActiveScenario] = useState<DemoScenarioKey>("baseline");

  return (
    <DemoContext.Provider
      value={{
        isDemo: capabilities.allowDemoFixtures,
        persona,
        activePersona,
        activeIndustry,
        activeScenario,
        fixtures: capabilities.allowDemoFixtures
          ? getDemoFixtures(activePersona, activeScenario)
          : null,
        switchPersona: setActivePersona,
        switchIndustry: setActiveIndustry,
        switchScenario: setActiveScenario,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  return useContext(DemoContext);
}

/**
 * Use in pages to get demo-mode data.
 * Returns null when not in demo mode — page falls through to real tRPC.
 *
 * Example:
 *   const demo = useDemoFixtures();
 *   const { data: relationships } = trpc.relationship.list.useQuery(
 *     undefined, { enabled: !demo }
 *   );
 *   const items = demo?.relationships ?? relationships ?? [];
 */
export function useDemoFixtures() {
  const ctx = useContext(DemoContext);
  const { capabilities } = useAppMode();
  return ctx.isDemo && capabilities.allowDemoFixtures ? ctx.fixtures : null;
}

export function useActivePersona() {
  const ctx = useContext(DemoContext);
  return ctx.activePersona;
}

export function useActiveIndustry() {
  const ctx = useContext(DemoContext);
  return ctx.activeIndustry;
}

export function usePersonaSwitcher() {
  const ctx = useContext(DemoContext);
  return {
    switchPersona: ctx.switchPersona,
    switchIndustry: ctx.switchIndustry,
    switchScenario: ctx.switchScenario,
  };
}

export function useActiveScenario() {
  const ctx = useContext(DemoContext);
  return ctx.activeScenario;
}
