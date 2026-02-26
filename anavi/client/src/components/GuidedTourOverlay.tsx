// client/src/components/GuidedTourOverlay.tsx
// Wraps GuidedTour with persona-aware whitepaper steps + full-screen close moment.

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GuidedTour, { isTourCompleted } from "@/components/GuidedTour";
import { buildDemoTourSteps } from "@/lib/tourDefinitions";
import { TOUR, PERSONAS, type PersonaKey } from "@/lib/copy";
import { AuroraBackground } from "@/components/PremiumAnimations";
import { Link } from "wouter";

interface GuidedTourOverlayProps {
  persona: PersonaKey;
  onExitDemo: () => void;
}

export function GuidedTourOverlay({ persona, onExitDemo }: GuidedTourOverlayProps) {
  const tourId = `demo-${persona}`;
  const [showClose, setShowClose] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(isTourCompleted(tourId));

  const handleComplete = useCallback(() => setShowClose(true), []);
  const handleSkip = useCallback(() => setTourDismissed(true), []);

  if (tourDismissed && !showClose) return null;

  const steps = buildDemoTourSteps(persona);
  const personaCopy = PERSONAS[persona];

  return (
    <>
      {!tourDismissed && (
        <GuidedTour
          tourId={tourId}
          steps={steps}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}

      {/* Full-screen tour close moment — Step 7 */}
      <AnimatePresence>
        {showClose && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#060A12] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <AuroraBackground className="opacity-40" />
            <div className="relative z-10 text-center max-w-3xl mx-4">
              <motion.p
                className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {personaCopy.role}
              </motion.p>
              <motion.h2
                className="text-5xl md:text-7xl font-serif text-white mb-8 leading-[0.95]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {TOUR.close.headline}
              </motion.h2>
              <motion.p
                className="text-lg md:text-xl text-white/60 mb-6 leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {TOUR.close.subhead}
              </motion.p>
              <motion.p
                className="text-base text-[#22D4F5]/80 italic mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {personaCopy.tourPitch}
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <Link href="/onboarding">
                  <motion.button
                    className="bg-[#C4972A] text-[#060A12] px-10 py-4 text-sm font-semibold uppercase tracking-widest cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Request Access
                  </motion.button>
                </Link>
                <motion.button
                  onClick={() => {
                    setShowClose(false);
                    setTourDismissed(true);
                  }}
                  className="text-sm text-white/40 hover:text-white/70 uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Continue Exploring
                </motion.button>
                <motion.button
                  onClick={onExitDemo}
                  className="text-sm text-white/25 hover:text-white/50 uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Exit Demo
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
