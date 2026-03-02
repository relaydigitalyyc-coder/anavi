import { motion } from "framer-motion";
import { useDemoContext, usePersonaSwitcher } from "@/contexts/DemoContext";
import type { PersonaKey } from "@/lib/copy";

const PERSONA_TILES: Array<{
  key: PersonaKey;
  label: string;
  shortLabel: string;
  icon: string;
}> = [
  { key: "originator", label: "Originator", shortLabel: "ORI", icon: "O" },
  { key: "investor", label: "Investor", shortLabel: "INV", icon: "I" },
  { key: "principal", label: "Principal", shortLabel: "PRI", icon: "P" },
];

export function PersonaSwitcher() {
  const { isDemo, activePersona } = useDemoContext();
  const { switchPersona } = usePersonaSwitcher();

  const livePersona = (
    typeof window !== "undefined"
      ? localStorage.getItem("anavi_active_persona") ?? "originator"
      : "originator"
  ) as PersonaKey;

  const current = isDemo ? activePersona : livePersona;

  return (
    <div className="pt-3 pb-2 px-3">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-[#1E3A5F]/40 mb-2">
        Active Persona
      </p>
      <div className="flex gap-1.5">
        {PERSONA_TILES.map((tile) => {
          const isActive = current === tile.key;
          return (
            <motion.button
              key={tile.key}
              onClick={() => {
                if (isDemo) switchPersona(tile.key);
                else localStorage.setItem("anavi_active_persona", tile.key);
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded text-center transition-colors ${
                isActive
                  ? "bg-[#1E3A5F] text-white"
                  : "bg-[#1E3A5F]/8 text-[#1E3A5F]/50 hover:bg-[#1E3A5F]/15 hover:text-[#1E3A5F]/80"
              }`}
              title={tile.label}
            >
              <span className="text-base leading-none">{tile.icon}</span>
              <span className="text-[8px] font-bold tracking-wider">{tile.shortLabel}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
