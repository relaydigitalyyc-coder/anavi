import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Info,
  BookOpen,
  AlertCircle,
  HelpCircle,
  X,
  Lightbulb,
} from "lucide-react";
import type { TooltipType } from "@/lib/tooltipContent";

// Hook for reduced motion preference
export function useReducedMotion() {
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

// TooltipProvider with reduced motion support
export function AccessibleTooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipProvider>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <TooltipProvider
      delayDuration={prefersReducedMotion ? 0 : delayDuration}
      {...props}
    />
  );
}

// Base variant props
interface TooltipVariantProps {
  className?: string;
  sideOffset?: number;
  children?: React.ReactNode;
}

// Info tooltip content (icon + text)
export function TooltipContentInfo({
  className,
  sideOffset = 0,
  children,
  ...props
}: TooltipVariantProps & React.ComponentProps<typeof TooltipContent>) {
  return (
    <TooltipContent
      sideOffset={sideOffset}
      className={cn("max-w-xs", className)}
      {...props}
    >
      <div className="flex items-start gap-2">
        <Info className="size-3.5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">{children}</div>
      </div>
    </TooltipContent>
  );
}

// Concept tooltip content (icon, title, content, learn more link)
interface TooltipContentConceptProps extends TooltipVariantProps {
  type?: TooltipType;
  title?: string;
  content?: string;
  learnMoreUrl?: string;
}

export function TooltipContentConcept({
  type = "concept",
  title,
  content,
  learnMoreUrl,
  className,
  sideOffset = 0,
  children,
  ...props
}: TooltipContentConceptProps & React.ComponentProps<typeof TooltipContent>) {
  const iconMap: Record<TooltipType, React.ReactNode> = {
    concept: <BookOpen className="size-3.5" />,
    action: <AlertCircle className="size-3.5" />,
    status: <Info className="size-3.5" />,
    data: <HelpCircle className="size-3.5" />,
    'empty-state': <Lightbulb className="size-3.5" />,
  };

  const icon = iconMap[type];

  return (
    <TooltipContent
      sideOffset={sideOffset}
      className={cn("max-w-xs", className)}
      {...props}
    >
      <div className="space-y-2">
        {(title || icon) && (
          <div className="flex items-center gap-2">
            {icon && <span className="text-primary">{icon}</span>}
            {title && (
              <h4 className="font-semibold text-sm leading-tight">{title}</h4>
            )}
          </div>
        )}

        <div className="text-sm">
          {content || children}
        </div>

        {learnMoreUrl && (
          <div className="pt-2 border-t border-border mt-2">
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs font-medium inline-flex items-center gap-1"
            >
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        )}
      </div>
    </TooltipContent>
  );
}

// Interactive tooltip content (dismiss button, persistence)
interface TooltipContentInteractiveProps extends TooltipVariantProps {
  onDismiss?: () => void;
  persistent?: boolean;
}

export function TooltipContentInteractive({
  onDismiss,
  persistent = false,
  className,
  sideOffset = 0,
  children,
  ...props
}: TooltipContentInteractiveProps & React.ComponentProps<typeof TooltipContent>) {
  return (
    <TooltipContent
      sideOffset={sideOffset}
      className={cn("max-w-xs", className)}
      {...props}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 text-sm">{children}</div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              aria-label="Dismiss tooltip"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {persistent && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            This tip won't show again
          </div>
        )}
      </div>
    </TooltipContent>
  );
}

// Enhanced ConceptTooltip component (replaces existing ConceptTooltip with better accessibility)
interface EnhancedConceptTooltipProps {
  type?: TooltipType;
  title: string;
  content: string;
  learnMoreUrl?: string;
  tooltipId?: string;
  children: React.ReactNode;
  // Persistence features from original ConceptTooltip
  suppressible?: boolean;
  maxUnsolicited?: number;
}

export function EnhancedConceptTooltip({
  type = "concept",
  title,
  content,
  learnMoreUrl,
  tooltipId,
  children,
  suppressible = true,
  maxUnsolicited = 5,
}: EnhancedConceptTooltipProps) {
  const [suppressed, setSuppressed] = React.useState(false);
  const [forceMode, setForceMode] = React.useState(false);
  const [sessionCount, setSessionCount] = React.useState(0);

  // Load suppression state from localStorage
  React.useEffect(() => {
    if (!suppressible || !tooltipId) return;

    try {
      const suppressedKey = 'anavi_tooltip_suppressed';
      const raw = localStorage.getItem(suppressedKey);
      const suppressedSet = raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
      setSuppressed(suppressedSet.has(tooltipId));
    } catch {
      // Ignore errors
    }
  }, [tooltipId, suppressible]);

  // Load session count from sessionStorage
  React.useEffect(() => {
    if (!suppressible) return;

    try {
      const sessionCountKey = 'anavi_tooltip_count';
      const count = sessionStorage.getItem(sessionCountKey);
      setSessionCount(count ? parseInt(count, 10) : 0);
    } catch {
      // Ignore errors
    }
  }, [suppressible]);

  const canShowUnsolicited = !suppressed && sessionCount < maxUnsolicited;

  const handleShow = (force: boolean) => {
    if (!force && !canShowUnsolicited) return;

    if (!force && suppressible) {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      sessionStorage.setItem('anavi_tooltip_count', newCount.toString());
    }

    setForceMode(force);
  };

  const handleDontShow = () => {
    if (!tooltipId || !suppressible) return;

    try {
      const suppressedKey = 'anavi_tooltip_suppressed';
      const raw = localStorage.getItem(suppressedKey);
      const suppressedSet = raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
      suppressedSet.add(tooltipId);
      localStorage.setItem(suppressedKey, JSON.stringify(Array.from(suppressedSet)));
      setSuppressed(true);
    } catch {
      // Ignore errors
    }
  };

  const iconMap: Record<TooltipType, React.ReactNode> = {
    concept: <BookOpen className="size-3.5" />,
    action: <AlertCircle className="size-3.5" />,
    status: <Info className="size-3.5" />,
    data: <HelpCircle className="size-3.5" />,
    'empty-state': <Lightbulb className="size-3.5" />,
  };

  const icon = iconMap[type];

  return (
    <AccessibleTooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5">
            {children}
            <button
              type="button"
              aria-label={`Info about ${title}`}
              className="inline-flex items-center justify-center size-4 rounded-full border border-border bg-muted text-foreground text-xs font-medium hover:bg-accent transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleShow(true);
              }}
              onMouseEnter={() => handleShow(false)}
            >
              ?
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {icon && <span className="text-primary">{icon}</span>}
              <h4 className="font-semibold text-sm leading-tight">{title}</h4>
            </div>

            <p className="text-sm">{content}</p>

            {(learnMoreUrl || (suppressible && !suppressed)) && (
              <div className="pt-2 border-t border-border mt-2 flex justify-between items-center">
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

                {suppressible && !suppressed && (
                  <button
                    onClick={handleDontShow}
                    className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                  >
                    Don't show again
                  </button>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </AccessibleTooltipProvider>
  );
}

// Utility component to migrate title attributes to tooltips
export function TitleTooltipMigrator({
  title,
  children,
  variant = "simple",
  ...props
}: {
  title: string;
  children: React.ReactElement;
  variant?: "simple" | "info" | "concept" | "interactive";
} & Omit<EnhancedConceptTooltipProps, 'title' | 'content' | 'children'>) {
  return (
    <AccessibleTooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {React.cloneElement(children, {
            // Remove title attribute to avoid duplicate tooltips
            title: undefined,
          })}
        </TooltipTrigger>
        <TooltipContent>
          {title}
        </TooltipContent>
      </Tooltip>
    </AccessibleTooltipProvider>
  );
}