import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

export interface TabsProps extends React.ComponentProps<typeof TabsPrimitive.Root> {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  announceTabChange?: boolean;
  orientation?: "horizontal" | "vertical";
  scrollable?: boolean;
  showScrollButtons?: boolean;
  mobileBreakpoint?: "sm" | "md" | "lg" | "xl";
  respectReducedMotion?: boolean;
}

export interface TabsListProps extends React.ComponentProps<typeof TabsPrimitive.List> {
  scrollable?: boolean;
  showScrollButtons?: boolean;
  scrollContainerClassName?: string;
}

export interface TabsTriggerProps extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right" | "top" | "bottom";
  loading?: boolean;
  badge?: React.ReactNode;
  destructive?: boolean;
}

export interface TabsContentProps extends React.ComponentProps<typeof TabsPrimitive.Content> {
  animated?: boolean;
  animationDuration?: number;
  animationEasing?: string;
}

export interface ScrollableTabsProps extends Omit<TabsProps, "scrollable"> {
  autoScrollToActive?: boolean;
  scrollButtonAriaLabel?: string;
  scrollButtonClassName?: string;
  scrollOffset?: number;
}

export interface VerticalTabsProps extends Omit<TabsProps, "orientation"> {
  width?: string | number;
  collapsibleOnMobile?: boolean;
  defaultCollapsedOnMobile?: boolean;
}

export const isReactElementWithChildren = (
  element: React.ReactNode
): element is React.ReactElement<{ children?: React.ReactNode }> => {
  return React.isValidElement(element);
};

export type ExtractProps<T> = T extends React.ComponentType<infer P> ? P : never;
