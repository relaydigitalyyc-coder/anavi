// client/src/contexts/DemoContext.tsx
// Whitepaper-aligned demo context. Zero API calls in demo mode.
// Pages check useDemoFixtures() — if truthy, use fixture data; if null, use real tRPC.

import { createContext, useContext, type ReactNode } from "react";
import type { PersonaKey } from "@/lib/copy";
import { DEMO_FIXTURES, type DemoFixtures } from "@/lib/demoFixtures";

interface DemoContextValue {
  isDemo: boolean;
  persona: PersonaKey | null;
  fixtures: DemoFixtures[PersonaKey] | null;
}

const DemoContext = createContext<DemoContextValue>({
  isDemo: false,
  persona: null,
  fixtures: null,
});

export function DemoContextProvider({
  persona,
  children,
}: {
  persona: PersonaKey;
  children: ReactNode;
}) {
  return (
    <DemoContext.Provider
      value={{
        isDemo: true,
        persona,
        fixtures: DEMO_FIXTURES[persona],
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
  return ctx.isDemo ? ctx.fixtures : null;
}
