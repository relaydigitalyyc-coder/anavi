// client/src/components/PersonaPicker.tsx
// Fullscreen persona picker overlay. No URL change.
// On persona select: fades in → mounts DemoShell (DashboardLayout + tour).

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, TrendingUp, Building2 } from "lucide-react";
import { PERSONAS, type PersonaKey } from "@/lib/copy";
import { DemoContextProvider } from "@/contexts/DemoContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import { GuidedTourOverlay } from "@/components/GuidedTourOverlay";
import { AuroraBackground, MorphingBlob } from "@/components/PremiumAnimations";

const ICONS: Record<PersonaKey, React.ComponentType<{ className?: string }>> = {
  originator: Handshake,
  investor: TrendingUp,
  developer: Building2,
};

interface PersonaPickerProps {
  onClose: () => void;
}

export function PersonaPicker({ onClose }: PersonaPickerProps) {
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSelect = useCallback((persona: PersonaKey) => {
    setIsTransitioning(true);
    // After flash animation completes, mount demo shell
    setTimeout(() => {
      setSelectedPersona(persona);
      setIsTransitioning(false);
    }, 500);
  }, []);

  // Demo shell: full-screen dashboard with demo data + guided tour
  if (selectedPersona && !isTransitioning) {
    return (
      <DemoContextProvider persona={selectedPersona}>
        <div className="fixed inset-0 z-50 bg-[#060A12]">
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
          <GuidedTourOverlay persona={selectedPersona} onExitDemo={onClose} />
        </div>
      </DemoContextProvider>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#060A12] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AuroraBackground className="opacity-30" />
        <MorphingBlob
          className="w-[600px] h-[600px] absolute -top-[200px] -right-[200px]"
          color="oklch(0.65 0.19 230 / 0.06)"
        />
        <MorphingBlob
          className="w-[400px] h-[400px] absolute bottom-[10%] -left-[100px]"
          color="oklch(0.55 0.15 160 / 0.05)"
        />

        <div className="relative z-10 w-full max-w-5xl mx-4">
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4">
              Enter the Operating System
            </p>
            <h2 className="text-4xl md:text-6xl font-serif text-white">
              Who are you in this market?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {(Object.entries(PERSONAS) as [PersonaKey, typeof PERSONAS[PersonaKey]][]).map(
              ([key, persona], i) => {
                const Icon = ICONS[key];
                return (
                  <motion.button
                    key={key}
                    onClick={() => handleSelect(key)}
                    className="relative group text-left p-8 md:p-10 glass-dark border border-white/10 hover:border-sky-500/50 transition-all duration-300 overflow-hidden rounded-xl cursor-pointer"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    whileHover={{
                      y: -4,
                      boxShadow:
                        "0 20px 60px rgb(0 0 0 / 0.4), 0 0 40px oklch(0.65 0.19 230 / 0.12)",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <Icon className="w-10 h-10 mb-6 text-white/30 group-hover:text-[#22D4F5] transition-colors duration-300 relative z-10" />

                    <p className="text-xs uppercase tracking-widest text-white/30 mb-2 relative z-10">
                      {persona.role}
                    </p>
                    <h3 className="text-xl md:text-2xl font-serif text-white mb-4 relative z-10">
                      {persona.label}
                    </h3>

                    {/* Problem / Answer crossfade */}
                    <div className="relative min-h-[48px]">
                      <p className="text-sm text-white/50 italic absolute inset-0 group-hover:opacity-0 transition-opacity duration-300">
                        "{persona.problem}"
                      </p>
                      <p className="text-sm text-[#22D4F5]/80 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {persona.answer}
                      </p>
                    </div>
                  </motion.button>
                );
              }
            )}
          </div>

          <motion.button
            onClick={onClose}
            className="block mx-auto mt-10 text-xs text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Back to Site
          </motion.button>
        </div>

        {/* Transition flash when persona selected */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              className="absolute inset-0 bg-[#060A12] z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
