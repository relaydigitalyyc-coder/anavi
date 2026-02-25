import { createContext, useContext, type ReactNode } from "react";
import { useTour } from "@/tour/useTour";

type TourContextValue = ReturnType<typeof useTour>;

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const tour = useTour();
  return (
    <TourContext.Provider value={tour}>
      {children}
    </TourContext.Provider>
  );
}

export function useTourContext() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTourContext must be used within TourProvider");
  return ctx;
}
