import { useActiveScenario, useDemoContext, usePersonaSwitcher } from "@/contexts/DemoContext";
import { DEMO_SCENARIOS } from "@/lib/demoFixtures";

export function DemoScenarioSwitcher() {
  const { isDemo } = useDemoContext();
  const activeScenario = useActiveScenario();
  const { switchScenario } = usePersonaSwitcher();

  if (!isDemo) return null;

  return (
    <div className="pb-3 px-3">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-[#1E3A5F]/40 mb-2">
        Demo Scenario
      </p>
      <div className="flex flex-wrap gap-1.5">
        {DEMO_SCENARIOS.map((scenario) => {
          const isActive = activeScenario === scenario.key;
          return (
            <button
              key={scenario.key}
              onClick={() => switchScenario(scenario.key)}
              title={scenario.note}
              className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-[#2563EB]/20 text-[#2563EB]"
                  : "bg-[#1E3A5F]/8 text-[#1E3A5F]/50 hover:bg-[#1E3A5F]/15 hover:text-[#1E3A5F]/80"
              }`}
            >
              {scenario.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
