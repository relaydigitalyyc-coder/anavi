import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { tabsVariants } from "./tabs.variants";
import { type TabsProps } from "./tabs.types";
import { useReducedMotion } from "./tabs.utils";

/**
 * Enhanced Tabs component with variant system and accessibility features.
 *
 * @example
 * ```tsx
 * <Tabs variant="outline" size="md" aria-label="Dashboard sections">
 *   <TabsList>
 *     <TabsTrigger value="overview">Overview</TabsTrigger>
 *     <TabsTrigger value="analytics">Analytics</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="overview">Overview content</TabsContent>
 *   <TabsContent value="analytics">Analytics content</TabsContent>
 * </Tabs>
 * ```
 */
const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>((props, ref) => {
  const {
    className,
    orientation = "horizontal",
    // tabsVariants accepts fullWidth but our public props don't require it;
    // we derive it from className or default to false.
    // @ts-expect-error allowing internal variant prop passthrough
    fullWidth = false,
    announceTabChange = true,
    respectReducedMotion = true,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    ...rest
  } = props;

  const reducedMotion = useReducedMotion();
  const shouldAnimate = respectReducedMotion ? !reducedMotion : true;

  // Warn in development if neither aria-label nor aria-labelledby is provided
  if (process.env.NODE_ENV === "development") {
    React.useEffect(() => {
      if (!ariaLabel && !ariaLabelledby) {
        console.warn(
          "Tabs: Missing accessible label. Provide either aria-label or aria-labelledby prop."
        );
      }
    }, [ariaLabel, ariaLabelledby]);
  }

  return (
    <TabsPrimitive.Root
      ref={ref}
      data-slot="tabs"
      data-orientation={orientation}
      data-full-width={fullWidth}
      data-animated={shouldAnimate}
      className={cn(tabsVariants({ orientation, fullWidth }), className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      {...rest}
    />
  );
});
Tabs.displayName = "Tabs";

export { Tabs };
