import * as React from "react";
import { cn } from "@/lib/utils";
import { type VerticalTabsProps } from "./tabs.types";
import { Tabs } from "./tabs";
import { TabsList } from "./tabs-list";
import { TabsTrigger } from "./tabs-trigger";
import { TabsContent } from "./tabs-content";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "../button";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * VerticalTabs component for sidebar-style navigation
 *
 * @example
 * ```tsx
 * <VerticalTabs aria-label="Sidebar navigation">
 *   <TabsList>
 *     <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
 *     <TabsTrigger value="analytics">Analytics</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="dashboard">Dashboard content</TabsContent>
 *   <TabsContent value="analytics">Analytics content</TabsContent>
 * </VerticalTabs>
 * ```
 */
const VerticalTabs = React.forwardRef<
  HTMLDivElement,
  VerticalTabsProps & { children?: React.ReactNode }
>((props, ref) => {
  const {
    className,
    children,
    width = "240px",
    collapsibleOnMobile = true,
    defaultCollapsedOnMobile = true,
    orientation = "vertical",
    ...tabsProps
  } = props;

  const isMobile = useMediaQuery("(max-width: 768px)");
  const [collapsed, setCollapsed] = React.useState(
    collapsibleOnMobile && defaultCollapsedOnMobile
  );

  // Update collapsed state when mobile breakpoint changes
  React.useEffect(() => {
    if (!collapsibleOnMobile) return;
    if (isMobile && !collapsed && defaultCollapsedOnMobile) {
      setCollapsed(true);
    } else if (!isMobile && collapsed) {
      setCollapsed(false);
    }
  }, [isMobile, collapsibleOnMobile, collapsed, defaultCollapsedOnMobile]);

  // Find TabsList and TabsContent children
  const renderChildren = React.useMemo(() => {
    if (!children) return null;

    const childrenArray = React.Children.toArray(children);
    let tabsListElement: React.ReactElement | null = null;
    let tabsContentElements: React.ReactElement[] = [];

    // Separate TabsList and TabsContent
    childrenArray.forEach((child) => {
      if (!React.isValidElement(child)) return;

      if (child.type === TabsList) {
        tabsListElement = child;
      } else if (child.type === TabsContent) {
        tabsContentElements.push(child);
      }
    });

    // If no TabsList found, return original children
    if (!tabsListElement) {
      return children;
    }

    return (
      <>
        <div
          className={cn(
            "flex flex-col",
            collapsibleOnMobile && isMobile && collapsed
              ? "w-12"
              : "w-full"
          )}
          style={{
            width: collapsibleOnMobile && isMobile && collapsed ? "48px" : width,
          }}
        >
          {collapsibleOnMobile && isMobile && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="mb-2 self-end"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
          {React.cloneElement(tabsListElement, {
            orientation: "vertical",
            className: cn(
              tabsListElement.props.className,
              collapsibleOnMobile && isMobile && collapsed && "items-center"
            ),
            fullWidth: true,
          })}
        </div>
        <div className="flex-1">
          {tabsContentElements.map((content, index) =>
            React.cloneElement(content, {
              key: index,
              className: cn(content.props.className, "ml-4"),
            })
          )}
        </div>
      </>
    );
  }, [
    children,
    width,
    collapsibleOnMobile,
    isMobile,
    collapsed,
  ]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex",
        orientation === "vertical" ? "flex-row" : "flex-col",
        className
      )}
    >
      <Tabs
        orientation="vertical"
        className="flex-1"
        {...tabsProps}
      >
        {renderChildren}
      </Tabs>
    </div>
  );
});

// Default export for useMediaQuery hook
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [matches, query]);

  return matches;
};

VerticalTabs.displayName = "VerticalTabs";

export { VerticalTabs };