import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-success text-success-foreground [a&]:hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-warning-foreground [a&]:hover:bg-warning/90",
        info: "border-transparent bg-info text-info-foreground [a&]:hover:bg-info/90",
        neutral:
          "border-transparent bg-muted text-muted-foreground [a&]:hover:bg-muted/90",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-1.5 text-base",
      },
      pill: {
        true: "rounded-full",
        false: "rounded-md",
      },
      interactive: {
        true: "cursor-pointer hover:scale-105 active:scale-95 transition-transform",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
      pill: false,
      interactive: false,
    },
  }
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  selected?: boolean;
  "aria-selected"?: boolean;
}

function Badge({
  className,
  variant,
  size,
  pill,
  interactive,
  asChild = false,
  icon,
  iconPosition = "left",
  selected,
  "aria-selected": ariaSelected,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  // Determine aria attributes
  const ariaProps: Record<string, boolean | string | number | undefined> = {};
  if (selected !== undefined || ariaSelected !== undefined) {
    ariaProps["aria-selected"] = selected ?? ariaSelected;
  }
  if (interactive) {
    ariaProps["role"] = "button";
    ariaProps["tabIndex"] = 0;
  }

  return (
    <Comp
      data-slot="badge"
      data-size={size}
      data-variant={variant}
      data-pill={pill}
      data-interactive={interactive}
      data-selected={selected}
      className={cn(
        badgeVariants({ variant, size, pill, interactive }),
        className
      )}
      {...ariaProps}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="inline-flex items-center" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="inline-flex items-center" aria-hidden="true">
          {icon}
        </span>
      )}
    </Comp>
  );
}

export { Badge, badgeVariants };
