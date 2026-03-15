import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  AlertCircle,
  Info,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import type { TooltipType } from "@/lib/tooltipContent";

interface ConceptTooltipProps {
  type: TooltipType;
  title: string;
  content: string;
  learnMoreUrl?: string;
  tooltipId?: string;
  children: React.ReactNode;
}

const SUPPRESSED_KEY = 'anavi_tooltip_suppressed';
const SESSION_COUNT_KEY = 'anavi_tooltip_count';
const MAX_UNSOLICITED = 5;

function loadSuppressedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(SUPPRESSED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function suppressTooltip(id: string) {
  const set = loadSuppressedSet();
  set.add(id);
  localStorage.setItem(SUPPRESSED_KEY, JSON.stringify(Array.from(set)));
}

function getSessionCount(): number {
  return parseInt(sessionStorage.getItem(SESSION_COUNT_KEY) ?? '0', 10);
}

function incrementSessionCount() {
  sessionStorage.setItem(SESSION_COUNT_KEY, String(getSessionCount() + 1));
}

const TYPE_ICONS: Record<TooltipType, React.ReactNode> = {
  concept: <BookOpen className="size-4" />,
  action: <AlertCircle className="size-4" />,
  status: <Info className="size-4" />,
  data: <HelpCircle className="size-4" />,
  'empty-state': <Lightbulb className="size-4" />,
};

const SHOW_HEADER_TYPES = new Set<TooltipType>(['concept', 'data']);

// Hook for reduced motion preference
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export default function ConceptTooltip({
  type,
  title,
  content,
  learnMoreUrl,
  tooltipId,
  children,
}: ConceptTooltipProps) {
  const fallbackId = React.useId();
  const id = tooltipId ?? `tip_${fallbackId}`;

  const [suppressed, setSuppressed] = React.useState(() => loadSuppressedSet().has(id));
  const [forceMode, setForceMode] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();

  const canShowUnsolicited = React.useCallback(() => {
    if (suppressed) return false;
    return getSessionCount() < MAX_UNSOLICITED;
  }, [suppressed]);

  const show = React.useCallback((force: boolean) => {
    if (!force && !canShowUnsolicited()) return;
    if (!force) incrementSessionCount();
    setForceMode(force);
    setOpen(true);
  }, [canShowUnsolicited]);

  const hide = React.useCallback(() => {
    setOpen(false);
  }, []);

  const handleMouseEnter = () => {
    show(false);
  };

  const handleMouseLeave = () => {
    if (!forceMode) {
      hide();
    }
  };

  const handleHelpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
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
  const icon = TYPE_ICONS[type];

  return (
    <TooltipProvider delayDuration={prefersReducedMotion ? 0 : 300}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center gap-1.5"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {children}
            <button
              type="button"
              aria-label={`Info about ${title}`}
              className={cn(
                "inline-flex items-center justify-center size-5 rounded-full",
                "border border-border bg-muted text-foreground text-xs font-medium",
                "hover:bg-accent hover:text-accent-foreground transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "active:scale-95"
              )}
              onClick={handleHelpClick}
            >
              ?
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent
          className="max-w-xs bg-background border-border shadow-lg"
          sideOffset={8}
          onMouseEnter={() => setForceMode(true)}
          onMouseLeave={() => {
            if (forceMode) {
              // Keep open if force mode, but allow mouse leave to close if not force mode
              // Actually keep it open since user is interacting
            }
          }}
        >
          <div className="space-y-2">
            {showHeader && (
              <div className="flex items-center gap-2">
                <span className="text-primary">{icon}</span>
                <span className="font-semibold text-sm text-foreground">
                  {title}
                </span>
              </div>
            )}

            <p className="text-sm text-foreground">
              {content}
            </p>

            {(learnMoreUrl || !suppressed) && (
              <>
                <div className="border-t border-border pt-2 mt-2" />
                <div className="flex justify-between items-center">
                  {learnMoreUrl ? (
                    <a
                      href={learnMoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs font-medium inline-flex items-center gap-1"
                    >
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  ) : (
                    <span />
                  )}

                  {!suppressed && (
                    <button
                      type="button"
                      onClick={handleDontShow}
                      className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                    >
                      Don't show again
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}