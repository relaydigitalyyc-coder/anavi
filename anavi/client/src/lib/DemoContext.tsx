import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useAppMode } from "@/contexts/AppModeContext";
import { getDemoFixtures } from "@/lib/demoFixtures";
import { convertFixturesToDemoData, type DemoPersona, type DemoData } from "@/pages/demo/demoAdapter";

interface DemoContextValue {
  isDemo: boolean;
  persona: DemoPersona | null;
  demoData: DemoData | null;
  setPersona: (persona: DemoPersona) => void;
  demoUserName: string;
  setDemoUserName: (name: string) => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemo: false,
  persona: null,
  demoData: null,
  setPersona: () => {},
  demoUserName: '',
  setDemoUserName: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const { capabilities } = useAppMode();
  const [persona, setPersonaState] = useState<DemoPersona | null>(null);
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [demoUserName, setDemoUserName] = useState('');

  const setPersona = useCallback((p: DemoPersona) => {
    setPersonaState(p);
    const fixtures = getDemoFixtures(p as any, "baseline");
    setDemoData(convertFixturesToDemoData(fixtures as any, p));
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemo: capabilities.allowDemoFixtures,
        persona,
        demoData: capabilities.allowDemoFixtures ? demoData : null,
        setPersona,
        demoUserName,
        setDemoUserName,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
