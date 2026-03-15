import * as React from "react";
import { cn } from "@/lib/utils";
import { type ScrollableTabsProps } from "./tabs.types";
import { Tabs } from "./tabs";
import { TabsList } from "./tabs-list";
import { TabsTrigger } from "./tabs-trigger";
import { TabsContent } from "./tabs-content";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../button";

/**
 * ScrollableTabs component with automatic scroll buttons for overflow
 *
 * @example
 * ```tsx
 * <ScrollableTabs aria-label="Dashboard sections">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *     {/* More tabs that may overflow *\/}
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </ScrollableTabs>
 * ```
 */
const ScrollableTabs = React.forwardRef<
  HTMLDivElement,
  ScrollableTabsProps & { children?: React.ReactNode }
>((props, ref) => {
  const {
    className,
    children,
    autoScrollToActive = true,
    scrollButtonAriaLabel = "Scroll tabs",
    scrollButtonClassName,
    scrollOffset = 16,
    orientation = "horizontal",
    showScrollButtons = true,
    ...tabsProps
  } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = React.useState(false);
  const [showRightScroll, setShowRightScroll] = React.useState(false);

  // Find TabsList child to wrap with scroll container
  const renderChildren = React.useMemo(() => {
    if (!children) return null;

    const childrenArray = React.Children.toArray(children);
    return childrenArray.map((child, index) => {
      if (!React.isValidElement(child)) return child;

      // Wrap TabsList with scroll container
      if (child.type === TabsList) {
        const listProps = child.props;
        const listChildren = listProps.children;

        const ScrollContainer = ({
          children: listChildren,
        }: {
          children: React.ReactNode;
        }) => {
          const listContainerRef = React.useRef<HTMLDivElement>(null);

          const updateScrollButtons = React.useCallback(() => {
            if (!listContainerRef.current || orientation === "vertical") {
              setShowLeftScroll(false);
              setShowRightScroll(false);
              return;
            }

            const container = listContainerRef.current;
            const showLeft = container.scrollLeft > 0;
            const showRight =
              container.scrollLeft <
              container.scrollWidth - container.clientWidth - 1;

            setShowLeftScroll(showLeft);
            setShowRightScroll(showRight);
          }, [orientation]);

          React.useEffect(() => {
            const container = listContainerRef.current;
            if (!container || orientation === "vertical") return;

            const handleScroll = () => updateScrollButtons();
            container.addEventListener("scroll", handleScroll);
            window.addEventListener("resize", updateScrollButtons);

            // Initial check
            updateScrollButtons();

            return () => {
              container.removeEventListener("scroll", handleScroll);
              window.removeEventListener("resize", updateScrollButtons);
            };
          }, [updateScrollButtons, orientation]);

          const scrollLeft = () => {
            if (!listContainerRef.current) return;
            listContainerRef.current.scrollBy({
              left: -200,
              behavior: "smooth",
            });
          };

          const scrollRight = () => {
            if (!listContainerRef.current) return;
            listContainerRef.current.scrollBy({
              left: 200,
              behavior: "smooth",
            });
          };

          return (
            <div className="relative flex items-center">
              {showScrollButtons && showLeftScroll && orientation === "horizontal" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                    "absolute left-0 z-10 bg-background/80 backdrop-blur-sm",
                    scrollButtonClassName
                  )}
                  onClick={scrollLeft}
                  aria-label={`${scrollButtonAriaLabel} left`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div
                ref={listContainerRef}
                className={cn(
                  "overflow-x-auto scrollbar-hide",
                  orientation === "horizontal" ? "flex-1" : ""
                )}
                style={{ scrollBehavior: "smooth" }}
              >
                {React.cloneElement(child as React.ReactElement, {
                  scrollable: true,
                  showScrollButtons: false, // We're handling scroll buttons ourselves
                  orientation,
                  ref: (node: any) => {
                    // Merge refs if needed
                  },
                })}
              </div>
              {showScrollButtons && showRightScroll && orientation === "horizontal" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                    "absolute right-0 z-10 bg-background/80 backdrop-blur-sm",
                    scrollButtonClassName
                  )}
                  onClick={scrollRight}
                  aria-label={`${scrollButtonAriaLabel} right`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        };

        return (
          <ScrollContainer key={index}>
            {listChildren}
          </ScrollContainer>
        );
      }

      return child;
    });
  }, [
    children,
    orientation,
    showScrollButtons,
    scrollButtonClassName,
    scrollButtonAriaLabel,
  ]);

  return (
    <Tabs
      ref={ref}
      className={cn(className)}
      orientation={orientation}
      showScrollButtons={showScrollButtons}
      {...tabsProps}
    >
      {renderChildren}
    </Tabs>
  );
});
ScrollableTabs.displayName = "ScrollableTabs";

export { ScrollableTabs };