import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { TooltipType } from '@/lib/tooltipContent';

interface ConceptTooltipProps {
  type: TooltipType;
  title: string;
  content: string;
  learnMoreUrl?: string;
  tooltipId?: string;
  children: ReactNode;
}

const SUPPRESSED_KEY = 'anavi_tooltip_suppressed';
const SESSION_COUNT_KEY = 'anavi_tooltip_count';
const MAX_UNSOLICITED = 5;

function getSuppressedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(SUPPRESSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function suppressTooltip(id: string) {
  const set = getSuppressedSet();
  set.add(id);
  localStorage.setItem(SUPPRESSED_KEY, JSON.stringify([...set]));
}

function getSessionCount(): number {
  return parseInt(sessionStorage.getItem(SESSION_COUNT_KEY) ?? '0', 10);
}

function incrementSessionCount() {
  sessionStorage.setItem(SESSION_COUNT_KEY, String(getSessionCount() + 1));
}

type Position = { top: number; left: number; placement: 'top' | 'bottom' };

function calcPosition(
  triggerRect: DOMRect,
  tipWidth: number,
  tipHeight: number,
): Position {
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  const gap = 12;

  const centeredLeft =
    scrollX + triggerRect.left + triggerRect.width / 2 - tipWidth / 2;
  const clampedLeft = Math.max(
    8,
    Math.min(centeredLeft, window.innerWidth - tipWidth - 8 + scrollX),
  );

  const spaceAbove = triggerRect.top;
  if (spaceAbove >= tipHeight + gap) {
    return {
      top: scrollY + triggerRect.top - tipHeight - gap,
      left: clampedLeft,
      placement: 'top',
    };
  }

  return {
    top: scrollY + triggerRect.bottom + gap,
    left: clampedLeft,
    placement: 'bottom',
  };
}

const TYPE_ICONS: Record<TooltipType, string> = {
  concept: '📖',
  action: '⚡',
  status: '📊',
  data: '📈',
  'empty-state': '💡',
};

const SHOW_HEADER_TYPES = new Set<TooltipType>(['concept', 'data']);

export default function ConceptTooltip({
  type,
  title,
  content,
  learnMoreUrl,
  tooltipId,
  children,
}: ConceptTooltipProps) {
  const fallbackId = useId();
  const id = tooltipId ?? `tip_${fallbackId}`;

  const [visible, setVisible] = useState(false);
  const [forceMode, setForceMode] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);

  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [suppressed, setSuppressed] = useState(() => getSuppressedSet().has(id));

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) return;
    const rect = trigger.getBoundingClientRect();
    setPos(calcPosition(rect, tip.offsetWidth, tip.offsetHeight));
  }, []);

  const canShowUnsolicited = useCallback(() => {
    if (suppressed) return false;
    return getSessionCount() < MAX_UNSOLICITED;
  }, [suppressed]);

  const show = useCallback(
    (force: boolean) => {
      if (!force && !canShowUnsolicited()) return;
      if (!force) incrementSessionCount();
      setForceMode(force);
      setVisible(true);
    },
    [canShowUnsolicited],
  );

  const hide = useCallback(() => {
    setVisible(false);
    setPos(null);
  }, []);

  useEffect(() => {
    if (!visible) return;
    reposition();
    const onResize = () => reposition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [visible, reposition]);

  useEffect(() => {
    if (!visible) return;
    requestAnimationFrame(reposition);
  }, [visible, reposition]);

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => show(false), 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    if (!forceMode) hide();
  };

  const handleHelpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (visible) {
      hide();
    } else {
      show(true);
    }
  };

  const handleDontShow = () => {
    suppressTooltip(id);
    setSuppressed(true);
    hide();
  };

  const showHeader = SHOW_HEADER_TYPES.has(type);

  const tooltipCard = visible
    ? createPortal(
        <div
          ref={tipRef}
          onMouseEnter={() => clearTimeout(hoverTimerRef.current)}
          onMouseLeave={() => {
            if (!forceMode) hide();
          }}
          style={{
            position: 'absolute',
            top: pos?.top ?? -9999,
            left: pos?.left ?? -9999,
            zIndex: 50000,
            maxWidth: 320,
            background: '#fff',
            border: '1px solid #0A1628',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(10,22,40,0.15)',
            padding: '16px 20px',
            opacity: pos ? 1 : 0,
            transition: 'opacity 150ms ease',
            pointerEvents: 'auto',
          }}
        >
          {/* Triangle pointer */}
          <span
            style={{
              position: 'absolute',
              ...(pos?.placement === 'top'
                ? {
                    bottom: -9,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid #0A1628',
                  }
                : {
                    top: -9,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid #0A1628',
                  }),
              width: 0,
              height: 0,
            }}
          />
          {/* Inner white fill for the pointer */}
          <span
            style={{
              position: 'absolute',
              ...(pos?.placement === 'top'
                ? {
                    bottom: -7,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '7px solid #fff',
                  }
                : {
                    top: -7,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderBottom: '7px solid #fff',
                  }),
              width: 0,
              height: 0,
            }}
          />

          {showHeader && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>
                {TYPE_ICONS[type]}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#0A1628',
                }}
              >
                {title}
              </span>
            </div>
          )}

          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.5,
              color: '#333',
            }}
          >
            {content}
          </p>

          {(learnMoreUrl || !suppressed) && (
            <>
              <hr
                style={{
                  border: 'none',
                  borderTop: '1px solid #D1DCF0',
                  margin: '12px 0 8px',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {learnMoreUrl ? (
                  <a
                    href={learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      color: '#2563EB',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Learn More →
                  </a>
                ) : (
                  <span />
                )}
                {!suppressed && (
                  <button
                    onClick={handleDontShow}
                    style={{
                      fontSize: 12,
                      color: '#888',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Don't show again
                  </button>
                )}
              </div>
            </>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <span
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      {children}
      <button
        onClick={handleHelpClick}
        aria-label={`Info about ${title}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '1px solid #D1DCF0',
          background: '#F3F7FC',
          color: '#0A1628',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ?
      </button>
      {tooltipCard}
    </span>
  );
}
