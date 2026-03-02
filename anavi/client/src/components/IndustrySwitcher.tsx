import { useState, useEffect } from "react";
import { useDemoContext, useActiveIndustry, usePersonaSwitcher } from "@/contexts/DemoContext";

const INDUSTRIES = [
  "Infrastructure",
  "Commodities",
  "Real Estate",
  "Private Equity",
  "Energy",
] as const;

type Industry = typeof INDUSTRIES[number];

export function IndustrySwitcher() {
  const { isDemo } = useDemoContext();
  const activeIndustry = useActiveIndustry() ?? "Infrastructure";
  const { switchIndustry } = usePersonaSwitcher();
  const [liveIndustry, setLiveIndustry] = useState<Industry>("Infrastructure");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("anavi_active_industry");
    if (stored && INDUSTRIES.includes(stored as Industry)) {
      setLiveIndustry(stored as Industry);
    }
  }, []);

  const current = isDemo ? activeIndustry : liveIndustry;

  return (
    <div className="pb-3 px-3">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-[#1E3A5F]/40 mb-2">
        Industry Lens
      </p>
      <div className="flex flex-wrap gap-1.5">
        {INDUSTRIES.map((industry) => {
          const isActive = current === industry;
          return (
            <button
              key={industry}
              onClick={() => {
                if (isDemo) {
                  switchIndustry(industry);
                } else {
                  localStorage.setItem("anavi_active_industry", industry);
                  setLiveIndustry(industry);
                }
              }}
              className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-[#C4972A]/20 text-[#C4972A]"
                  : "bg-[#1E3A5F]/8 text-[#1E3A5F]/50 hover:bg-[#1E3A5F]/15 hover:text-[#1E3A5F]/80"
              }`}
            >
              {industry}
            </button>
          );
        })}
      </div>
    </div>
  );
}
