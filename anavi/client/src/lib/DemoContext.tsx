import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getDemoData, type DemoPersona, type DemoData } from './demoData';

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
  const [persona, setPersonaState] = useState<DemoPersona | null>(null);
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [demoUserName, setDemoUserName] = useState('');

  const setPersona = useCallback((p: DemoPersona) => {
    setPersonaState(p);
    setDemoData(getDemoData(p));
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemo: true,
        persona,
        demoData,
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
