// client/src/components/CursorGlow.tsx
// Global ambient cursor glow for dark canvas surfaces.
// Mount once in App.tsx — works automatically on dark pages.

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export function CursorGlow() {
  const rawX = useMotionValue(-500);
  const rawY = useMotionValue(-500);

  const x = useSpring(rawX, { stiffness: 120, damping: 20 });
  const y = useSpring(rawY, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      rawX.set(e.clientX - 200);
      rawY.set(e.clientY - 200);
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [rawX, rawY]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] select-none"
      style={{
        x,
        y,
        width: 400,
        height: 400,
        background:
          "radial-gradient(circle, oklch(0.75 0.18 200 / 0.08) 0%, transparent 70%)",
        borderRadius: "50%",
      }}
      aria-hidden="true"
    />
  );
}
