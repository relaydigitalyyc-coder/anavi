import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TourStep } from '@/lib/tourDefinitions';

interface GuidedTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  onStepChange?: (stepIndex: number) => void;
}

export function tourCompletedKey(tourId: string) {
  return `anavi_tour_completed_${tourId}`;
}

export function isTourCompleted(tourId: string): boolean {
  return localStorage.getItem(tourCompletedKey(tourId)) === 'true';
}

export function clearTourCompleted(tourId: string) {
  localStorage.removeItem(tourCompletedKey(tourId));
}

function markTourCompleted(tourId: string) {
  localStorage.setItem(tourCompletedKey(tourId), 'true');
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

type CardPlacement = 'top' | 'bottom' | 'left' | 'right';

const CARD_WIDTH = 360;
const CARD_GAP = 16;
const SPOTLIGHT_PADDING = 8;
const GLOW_SIZE = 8;

function bestPlacement(
  rect: TargetRect,
  preferredPos?: CardPlacement,
): CardPlacement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceAbove = rect.top;
  const spaceBelow = vh - (rect.top + rect.height);
  const spaceLeft = rect.left;
  const spaceRight = vw - (rect.left + rect.width);

  if (preferredPos) {
    const enough =
      (preferredPos === 'top' && spaceAbove > 220) ||
      (preferredPos === 'bottom' && spaceBelow > 220) ||
      (preferredPos === 'left' && spaceLeft > CARD_WIDTH + CARD_GAP) ||
      (preferredPos === 'right' && spaceRight > CARD_WIDTH + CARD_GAP);
    if (enough) return preferredPos;
  }

  if (spaceBelow > 220) return 'bottom';
  if (spaceAbove > 220) return 'top';
  if (spaceRight > CARD_WIDTH + CARD_GAP) return 'right';
  return 'left';
}

function cardStyle(
  rect: TargetRect,
  placement: CardPlacement,
): React.CSSProperties {
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  const base: React.CSSProperties = {
    position: 'absolute',
    width: CARD_WIDTH,
    zIndex: 50002,
  };

  switch (placement) {
    case 'top':
      return {
        ...base,
        bottom: undefined,
        top: scrollY + rect.top - CARD_GAP,
        left:
          scrollX +
          Math.max(
            8,
            Math.min(
              rect.left + rect.width / 2 - CARD_WIDTH / 2,
              window.innerWidth - CARD_WIDTH - 8,
            ),
          ),
        transform: 'translateY(-100%)',
      };
    case 'bottom':
      return {
        ...base,
        top: scrollY + rect.top + rect.height + CARD_GAP,
        left:
          scrollX +
          Math.max(
            8,
            Math.min(
              rect.left + rect.width / 2 - CARD_WIDTH / 2,
              window.innerWidth - CARD_WIDTH - 8,
            ),
          ),
      };
    case 'left':
      return {
        ...base,
        top: scrollY + rect.top + rect.height / 2,
        left: scrollX + rect.left - CARD_WIDTH - CARD_GAP,
        transform: 'translateY(-50%)',
      };
    case 'right':
      return {
        ...base,
        top: scrollY + rect.top + rect.height / 2,
        left: scrollX + rect.left + rect.width + CARD_GAP,
        transform: 'translateY(-50%)',
      };
  }
}

export default function GuidedTour({
  tourId,
  steps,
  onComplete,
  onSkip,
  onStepChange,
}: GuidedTourProps) {
  const [active, setActive] = useState(() => !isTourCompleted(tourId));
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const rafRef = useRef(0);

  const step = steps[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === steps.length - 1;

  const measureTarget = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, [step]);

  useEffect(() => {
    if (active && step) {
      onStepChange?.(stepIdx);
    }
  }, [active, stepIdx, step, onStepChange]);

  useEffect(() => {
    if (!active || !step) return;

    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const measure = () => {
      measureTarget();
      rafRef.current = requestAnimationFrame(measure);
    };
    rafRef.current = requestAnimationFrame(measure);

    const onResize = () => measureTarget();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [active, step, measureTarget]);

  const goNext = () => {
    if (isLast) {
      markTourCompleted(tourId);
      setActive(false);
      onComplete();
    } else {
      const nextIdx = stepIdx + 1;
      setStepIdx(nextIdx);
      onStepChange?.(nextIdx);
    }
  };

  const goBack = () => {
    if (!isFirst) {
      const prevIdx = stepIdx - 1;
      setStepIdx(prevIdx);
      onStepChange?.(prevIdx);
    }
  };

  const skip = () => {
    markTourCompleted(tourId);
    setActive(false);
    onSkip();
  };

  if (!active || !step) return null;

  const placement = targetRect
    ? bestPlacement(targetRect, step.position)
    : 'bottom';
  const progress = ((stepIdx + 1) / steps.length) * 100;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50000,
        pointerEvents: 'none',
      }}
    >
      {/* Full-screen click blocker */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50000,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Spotlight cutout */}
      {targetRect && (
        <div
          style={{
            position: 'absolute',
            top: window.scrollY + targetRect.top - SPOTLIGHT_PADDING,
            left: window.scrollX + targetRect.left - SPOTLIGHT_PADDING,
            width: targetRect.width + SPOTLIGHT_PADDING * 2,
            height: targetRect.height + SPOTLIGHT_PADDING * 2,
            borderRadius: 8,
            boxShadow: `0 0 0 9999px rgba(10,22,40,0.6), 0 0 ${GLOW_SIZE}px ${GLOW_SIZE}px rgba(37,99,235,0.4)`,
            border: '4px solid #0A1628',
            zIndex: 50001,
            pointerEvents: 'none',
            transition: 'all 300ms ease',
          }}
        />
      )}

      {/* Tour card */}
      {targetRect && (
        <div
          style={{
            ...cardStyle(targetRect, placement),
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(10,22,40,0.25)',
            padding: 0,
            overflow: 'hidden',
            pointerEvents: 'auto',
            animation: 'tourCardFade 200ms ease',
          }}
        >
          {/* Progress bar */}
          <div
            style={{
              height: 3,
              background: '#D1DCF0',
              width: '100%',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: '#0A1628',
                transition: 'width 300ms ease',
              }}
            />
          </div>

          <div style={{ padding: '20px 24px 16px' }}>
            {/* Step counter */}
            <div
              style={{
                fontSize: 12,
                color: '#888',
                marginBottom: 8,
              }}
            >
              Step {stepIdx + 1} of {steps.length}
            </div>

            {/* Title */}
            <h3
              style={{
                margin: '0 0 8px',
                fontSize: 16,
                fontWeight: 700,
                color: '#0A1628',
              }}
            >
              {step.title}
            </h3>

            {/* Description */}
            <p
              style={{
                margin: '0 0 20px',
                fontSize: 14,
                lineHeight: 1.5,
                color: '#333',
              }}
            >
              {step.content}
            </p>

            {/* Navigation */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                onClick={goBack}
                disabled={isFirst}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: '1px solid #D1DCF0',
                  background: '#fff',
                  color: isFirst ? '#bbb' : '#0A1628',
                  cursor: isFirst ? 'default' : 'pointer',
                  opacity: isFirst ? 0.5 : 1,
                }}
              >
                Back
              </button>
              <button
                onClick={goNext}
                style={{
                  padding: '8px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 'none',
                  background: isLast ? '#C4972A' : '#0A1628',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {isLast ? "Let's Go" : 'Next'}
              </button>
            </div>

            {/* Skip */}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                onClick={skip}
                style={{
                  fontSize: 13,
                  color: '#888',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  padding: 0,
                }}
              >
                Skip Tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes tourCardFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
