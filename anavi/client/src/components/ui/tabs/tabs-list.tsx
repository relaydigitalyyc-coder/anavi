import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { tabsListVariants } from "./tabs.variants";
import { type TabsListProps } from "./tabs.types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../button";
import { isInViewport, scrollIntoViewWithOptions } from "./tabs.utils";

/**
 * Enhanced TabsList component with scrollable support and variants
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>((props, ref) => {
  const {
    className,
    variant = "default",
    size = "md",
    orientation = "horizontal",
    fullWidth = false,
    scrollable = false,
    showScrollButtons = false,
    scrollContainerClassName,
    children,
    ...rest
  } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = React.useState(false);
  const [showRightScroll, setShowRightScroll] = React.useState(false);

  // Check scroll position
  const updateScrollButtons = React.useCallback(() => {
    if (!containerRef.current || !listRef.current || !scrollable) {
      setShowLeftScroll(false);
      setShowRightScroll(false);
      return;
    }

    const container = containerRef.current;
    const list = listRef.current;

    const showLeft = container.scrollLeft > 0;
    const showRight =
      container.scrollLeft < list.scrollWidth - container.clientWidth - 1;

    setShowLeftScroll(showLeft);
    setShowRightScroll(showRight);
  }, [scrollable]);

  // Handle scroll events
  React.useEffect(() => {
    if (!scrollable) return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => updateScrollButtons();
    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updateScrollButtons);

    // Initial check
    updateScrollButtons();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [scrollable, updateScrollButtons]);

  // Scroll handlers
  const scrollLeft = React.useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: -200, behavior: "smooth" });
  }, []);

  const scrollRight = React.useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: 200, behavior: "smooth" });
  }, []);

  // Render scrollable container
  if (scrollable) {
    return (
      <div className="relative flex items-center">
        {showScrollButtons && showLeftScroll && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute left-0 z-10 bg-background/80 backdrop-blur-sm"
            onClick={scrollLeft}
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <div
          ref={containerRef}
          className={cn(
            "overflow-x-auto scrollbar-hide",
            scrollContainerClassName
          )}
          style={{ scrollBehavior: "smooth" }}
        >
          <TabsPrimitive.List
            ref={ref}
            data-slot="tabs-list"
            data-variant={variant}
            data-size={size}
            data-orientation={orientation}
            data-scrollable={scrollable}
            className={cn(
              tabsListVariants({
                variant,
                size,
                orientation,
                fullWidth,
                scrollable: true,
              }),
              className
            )}
            {...rest}
          >
            {children}
          </TabsPrimitive.List>
        </div>
        {showScrollButtons && showRightScroll && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-0 z-10 bg-background/80 backdrop-blur-sm"
            onClick={scrollRight}
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Render non-scrollable list
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      data-variant={variant}
      data-size={size}
      data-orientation={orientation}
      className={cn(
        tabsListVariants({ variant, size, orientation, fullWidth }),
        className
      )}
      {...rest}
    >
      {children}
    </TabsPrimitive.List>
  );
});
TabsList.displayName = "TabsList";

export { TabsList };