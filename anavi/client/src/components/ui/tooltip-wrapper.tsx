import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface TooltipWrapperProps {
  /**
   * The title text to display in the tooltip (replaces native title attribute)
   */
  title: string;
  /**
   * The child element that triggers the tooltip
   */
  children: React.ReactElement;
  /**
   * Tooltip variant
   */
  variant?: "simple" | "info";
  /**
   * Delay before showing tooltip (ms)
   */
  delayDuration?: number;
  /**
   * Side of the tooltip relative to trigger
   */
  side?: "top" | "right" | "bottom" | "left";
  /**
   * Alignment of the tooltip relative to trigger
   */
  align?: "start" | "center" | "end";
  /**
   * Whether to disable the tooltip (for conditional rendering)
   */
  disabled?: boolean;
}

/**
 * TooltipWrapper - Converts native title attributes to accessible tooltips
 *
 * Usage:
 * ```tsx
 * // Before:
 * <button title="Search (Cmd+K)" onClick={...}>
 *   <SearchIcon />
 * </button>
 *
 * // After:
 * <TooltipWrapper title="Search (Cmd+K)">
 *   <button onClick={...}>
 *     <SearchIcon />
 *   </button>
 * </TooltipWrapper>
 * ```
 *
 * This component removes the native title attribute from the child element
 * to avoid duplicate tooltips and provides proper keyboard navigation,
 * screen reader support, and reduced motion preferences.
 */
export function TooltipWrapper({
  title,
  children,
  variant = "simple",
  delayDuration = 300,
  side = "top",
  align = "center",
  disabled = false,
}: TooltipWrapperProps) {
  if (disabled || !title) {
    // If disabled or no title, just return children without tooltip
    // but remove title attribute to avoid native tooltip
    return React.cloneElement(children, { title: undefined });
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {React.cloneElement(children, {
            // Remove title attribute to avoid duplicate tooltips
            title: undefined,
            // Ensure proper ARIA attributes
            "aria-describedby": `tooltip-${React.useId()}`,
          })}
        </TooltipTrigger>
        <TooltipContent side={side} align={align}>
          {title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook to check if tooltip migration is needed for an element
 * Returns true if the element has a title attribute that should be migrated
 */
export function useShouldMigrateTitle(element: HTMLElement | null): boolean {
  return React.useMemo(() => {
    if (!element) return false;
    return element.hasAttribute("title");
  }, [element]);
}