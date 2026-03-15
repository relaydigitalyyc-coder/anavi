import * as React from "react";

/**
 * Hook to detect prefers-reduced-motion. Defaults to false on SSR.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    onChange();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    } else if (typeof media.addListener === "function") {
      media.addListener(onChange);
      return () => media.removeListener(onChange);
    }
  }, []);

  return reduced;
}
