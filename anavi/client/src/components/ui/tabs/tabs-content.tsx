import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { tabsContentVariants } from "./tabs.variants";
import { type TabsContentProps } from "./tabs.types";
import { useReducedMotion } from "./tabs.utils";

/**
 * Enhanced TabsContent component with animation support
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>((props, ref) => {
  const {
    className,
    animated = true,
    animationDuration = 200,
    animationEasing = "ease-in-out",
    children,
    ...rest
  } = props;

  const reducedMotion = useReducedMotion();
  const shouldAnimate = animated && !reducedMotion;

  const animationStyle = React.useMemo(
    () =>
      shouldAnimate
        ? {
            transitionDuration: `${animationDuration}ms`,
            transitionTimingFunction: animationEasing,
          }
        : undefined,
    [shouldAnimate, animationDuration, animationEasing]
  );

  return (
    <TabsPrimitive.Content
      ref={ref}
      data-slot="tabs-content"
      data-animated={shouldAnimate}
      className={cn(tabsContentVariants({ animated: shouldAnimate }), className)}
      style={animationStyle}
      {...rest}
    >
      {children}
    </TabsPrimitive.Content>
  );
});
TabsContent.displayName = "TabsContent";

export { TabsContent };