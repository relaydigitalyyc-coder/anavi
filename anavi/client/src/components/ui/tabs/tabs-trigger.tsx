import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { tabsTriggerVariants } from "./tabs.variants";
import { type TabsTriggerProps } from "./tabs.types";
import { Loader2 } from "lucide-react";
import { Badge } from "../badge";

/**
 * Enhanced TabsTrigger component with icons, badges, and variants
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>((props, ref) => {
  const {
    className,
    variant = "default",
    size = "md",
    color = "primary",
    iconPosition = "left",
    fullWidth = false,
    destructive = false,
    icon,
    loading = false,
    badge,
    children,
    disabled,
    ...rest
  } = props;

  const renderIcon = React.useMemo(() => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return icon;
  }, [loading, icon]);

  const renderContent = React.useMemo(() => {
    const hasIcon = Boolean(renderIcon);
    const hasBadge = Boolean(badge);

    return (
      <>
        {hasIcon && iconPosition !== "right" && iconPosition !== "bottom" && (
          <span className="shrink-0">{renderIcon}</span>
        )}
        {children && <span className="truncate">{children}</span>}
        {hasIcon && (iconPosition === "right" || iconPosition === "bottom") && (
          <span className="shrink-0">{renderIcon}</span>
        )}
        {hasBadge && (
          <Badge
            variant="secondary"
            size="sm"
            className="ml-1.5 shrink-0"
            aria-hidden="true"
          >
            {badge}
          </Badge>
        )}
      </>
    );
  }, [renderIcon, iconPosition, children, badge]);

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      data-variant={variant}
      data-size={size}
      data-color={color}
      data-icon-position={iconPosition}
      data-destructive={destructive}
      data-full-width={fullWidth}
      data-loading={loading}
      disabled={disabled || loading}
      className={cn(
        tabsTriggerVariants({
          variant,
          size,
          color,
          iconPosition,
          fullWidth,
          destructive,
        }),
        className
      )}
      {...rest}
    >
      {renderContent}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = "TabsTrigger";

export { TabsTrigger };