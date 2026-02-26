import { useEffect, useRef, useCallback } from "react";
import type { TourStep } from "@/tour/definitions";

interface TourOverlayProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export function TourOverlay({ step, currentStep, totalSteps, onNext, onSkip }: TourOverlayProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      if (e.key === "Enter") onNext();
    },
    [onSkip, onNext]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const target = step.target && typeof document !== "undefined" ? document.querySelector(step.target) : null;
  const targetRect = target?.getBoundingClientRect();
  const useTarget = targetRect && targetRect.width > 0 && targetRect.height > 0 && step.placement !== "center";
  const isLast = currentStep >= totalSteps - 1;

  return (
    <div
      className="fixed inset-0 z-[9998]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
      aria-live="polite"
    >
      {/* Backdrop with cutout */}
      <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {useTarget && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-mask)" />
        {useTarget && (
          <rect
            x={targetRect.left - 8}
            y={targetRect.top - 8}
            width={targetRect.width + 16}
            height={targetRect.height + 16}
            rx="8"
            fill="none"
            stroke="rgba(196, 151, 42, 0.9)"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Clickable backdrop to allow clicking outside */}
      <div
        className="absolute inset-0"
        onClick={onSkip}
        style={{ cursor: "default" }}
        aria-hidden="true"
      />

      {/* Popover */}
      <div
        ref={popoverRef}
        className={`absolute z-[9999] rounded-xl border bg-white shadow-xl ${
          isLast ? "min-w-[340px] max-w-[420px] border-[#C4972A]/30 p-8 text-center" : "min-w-[280px] max-w-[360px] border-[#0A1628]/10 p-5"
        }`}
        style={getPopoverPosition(useTarget ? targetRect! : null, step.placement)}
      >
        {isLast && (
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C4972A]/10">
            <svg className="h-7 w-7 text-[#C4972A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <p id="tour-title" className={`dash-heading font-semibold text-[#0A1628] ${isLast ? "text-xl" : "text-lg"}`}>
          {step.title}
        </p>
        <p id="tour-body" className={`mt-2 text-sm text-[#1E3A5F]/80 ${isLast ? "mx-auto max-w-[280px]" : ""}`}>
          {step.body}
        </p>
        <div className={`mt-4 flex items-center gap-3 ${isLast ? "justify-center" : "justify-between"}`}>
          {!isLast && (
            <span className="text-xs text-[#1E3A5F]/50" data-label>
              Step {currentStep + 1} of {totalSteps}
            </span>
          )}
          <div className="flex gap-2">
            {!isLast && (
              <button
                onClick={onSkip}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#1E3A5F]/70 hover:bg-[#0A1628]/5"
              >
                Skip
              </button>
            )}
            <button
              onClick={onNext}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${isLast ? "btn-gold px-8 py-3" : "btn-gold"}`}
            >
              {isLast ? "Start Exploring" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPopoverPosition(
  targetRect: DOMRect | null,
  placement: string
): React.CSSProperties {
  const padding = 16;
  if (!targetRect) {
    return {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  }
  switch (placement) {
    case "right":
      return {
        left: targetRect.right + padding,
        top: targetRect.top + targetRect.height / 2,
        transform: "translateY(-50%)",
      };
    case "left":
      return {
        left: Math.max(padding, targetRect.left - 320 - padding),
        top: targetRect.top + targetRect.height / 2,
        transform: "translateY(-50%)",
      };
    case "bottom":
      return {
        left: targetRect.left + targetRect.width / 2,
        top: targetRect.bottom + padding,
        transform: "translateX(-50%)",
      };
    case "top":
      return {
        left: targetRect.left + targetRect.width / 2,
        bottom: window.innerHeight - targetRect.top + padding,
        top: "auto",
        transform: "translateX(-50%)",
      };
    case "center":
    default:
      return {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      };
  }
}
