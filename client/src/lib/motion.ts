// client/src/lib/motion.ts
// Shared Framer Motion presets for the cinematic UI system

// Spring physics presets
export const SPRING_SNAPPY   = { type: "spring", stiffness: 400, damping: 25 } as const;
export const SPRING_SOFT     = { type: "spring", stiffness: 200, damping: 20 } as const;
export const SPRING_BOUNCE   = { type: "spring", stiffness: 500, damping: 15 } as const;
export const SPRING_MAGNETIC = { type: "spring", stiffness: 400, damping: 28 } as const;

// Easing curves (Framer Motion accepts arrays for cubic-bezier)
export const EASE_OUT_EXPO  = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_EXPO   = [0.7, 0, 0.84, 0] as const;
export const EASE_CINEMATIC = [0.25, 0.1, 0.25, 1] as const;
export const EASE_EASEOUT   = [0.215, 0.61, 0.355, 1] as const;

/** Fade up with blur — primary entry animation for text, cards, labels */
export const fadeUpVariant = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      delay: i * 0.04,
      ease: EASE_OUT_EXPO,
    },
  }),
};

/** Scale in with blur — for modals, panels, login cards */
export const scaleInVariant = {
  hidden: { opacity: 0, scale: 0.94, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
};

/** Page-level transitions */
export const pageTransition = {
  initial:  { opacity: 0, scale: 0.98, filter: "blur(4px)" },
  animate:  {
    opacity: 1,
    scale: 1.0,
    filter: "blur(0px)",
    transition: { duration: 0.35, delay: 0.08, ease: EASE_CINEMATIC },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
    transition: { duration: 0.20, ease: [0.4, 0, 1, 1] as const },
  },
};

/** Stagger container */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

/** Step exit — onboarding slide-out */
export const stepExit = {
  opacity: 0,
  x: -20,
  filter: "blur(6px)",
  transition: { duration: 0.18, ease: EASE_IN_EXPO },
};

/** Step enter — onboarding slide-in */
export const stepEnter = {
  opacity: 1,
  x: 0,
  filter: "blur(0px)",
  transition: { duration: 0.28, delay: 0.20, ease: EASE_OUT_EXPO },
};
