import { useCallback, useEffect, useState } from "react";
import { tourDefinitions, TOUR_STORAGE_KEY, TOUR_SESSION_KEY } from "./definitions";

export function useTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const step = tourDefinitions[currentStep];
  const totalSteps = tourDefinitions.length;
  const isLastStep = currentStep === totalSteps - 1;

  const complete = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const next = useCallback(() => {
    if (isLastStep) {
      complete();
      return;
    }
    setCurrentStep((s) => {
      const next_ = s + 1;
      try {
        sessionStorage.setItem(TOUR_SESSION_KEY, String(next_));
      } catch {
        /* ignore */
      }
      return next_;
    });
  }, [isLastStep, complete]);

  const skip = useCallback(() => {
    complete();
  }, [complete]);

  const start = useCallback(() => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY);
      sessionStorage.setItem(TOUR_SESSION_KEY, "0");
    } catch {
      /* ignore */
    }
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const restart = useCallback(() => {
    start();
  }, [start]);

  const hasCompletedTour = useCallback(() => {
    try {
      return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }, []);

  return {
    step,
    currentStep,
    totalSteps,
    isActive,
    isLastStep,
    next,
    skip,
    start,
    restart,
    complete,
    hasCompletedTour,
  };
}
