import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Badge, BadgeProps } from "./badge";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "",
        outline: "",
        success: "",
        warning: "",
        info: "",
        neutral: "",
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
      removable: {
        true: "pr-1",
        false: "",
      },
      selected: {
        true: "ring-2 ring-ring ring-offset-1",
        false: "",
      },
      interactive: {
        true: "cursor-pointer hover:scale-105 active:scale-95",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
      removable: false,
      selected: false,
      interactive: false,
    },
  }
);

export interface ChipProps extends Omit<BadgeProps, "variant" | "size" | "interactive"> {
  /** Chip variant */
  variant?: VariantProps<typeof chipVariants>["variant"];
  /** Chip size */
  size?: VariantProps<typeof chipVariants>["size"];
  /** Whether chip is removable (shows close button) */
  removable?: boolean;
  /** Callback when remove button is clicked */
  onRemove?: () => void;
  /** Whether chip is selected (for filter/choice chips) */
  selected?: boolean;
  /** Callback when chip is clicked (for interactive chips) */
  onClick?: () => void;
  /** Chip type */
  type?: "default" | "filter" | "choice" | "input";
  /** Whether chip is disabled */
  disabled?: boolean;
  /** ARIA label for remove button (defaults to "Remove [label]") */
  removeLabel?: string;
}

/**
 * A versatile Chip component for displaying tags, labels, or filter options.
 *
 * - **Default**: Basic chip for displaying information
 * - **Filter**: Toggleable chip with `aria-pressed` for filter states
 * - **Choice**: Selectable chip for single/multiple choice with `aria-checked`
 * - **Input**: Chip with remove button for tag inputs
 *
 * @example
 * ```tsx
 * // Removable chip
 * <Chip removable onRemove={() => removeTag(id)}>Tag</Chip>
 *
 * // Filter chip
 * <Chip type="filter" selected={isActive} onClick={() => toggleFilter()}>
 *   Filter
 * </Chip>
 *
 * // Choice chip
 * <Chip type="choice" selected={isSelected} onClick={() => toggleSelection()}>
 *   Option
 * </Chip>
 * ```
 */
function Chip({
  className,
  variant = "default",
  size = "sm",
  removable = false,
  onRemove,
  selected = false,
  onClick,
  type = "default",
  disabled = false,
  removeLabel,
  children,
  ...props
}: ChipProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onClick?.();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    // Handle Enter/Space for click
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }

    // Handle Delete/Backspace for remove
    if (removable && onRemove && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      onRemove();
    }
  };

  // Determine ARIA attributes based on chip type
  const ariaProps: Record<string, boolean | string | undefined> = {};

  if (type === "filter") {
    ariaProps["role"] = "button";
    ariaProps["aria-pressed"] = selected;
    ariaProps["tabIndex"] = disabled ? -1 : 0;
  } else if (type === "choice") {
    ariaProps["role"] = "checkbox";
    ariaProps["aria-checked"] = selected;
    ariaProps["tabIndex"] = disabled ? -1 : 0;
  } else if (onClick) {
    ariaProps["role"] = "button";
    ariaProps["tabIndex"] = disabled ? -1 : 0;
  }

  if (disabled) {
    ariaProps["aria-disabled"] = true;
  }

  // Generate remove button label
  const defaultRemoveLabel = `Remove ${typeof children === "string" ? children : "item"}`;
  const actualRemoveLabel = removeLabel || defaultRemoveLabel;

  return (
    <Badge
      variant={variant}
      size={size}
      pill
      interactive={!!onClick || type === "filter" || type === "choice"}
      selected={selected}
      className={cn(
        chipVariants({ variant, size, removable, selected, interactive: !!onClick }),
        disabled && "opacity-50 cursor-not-allowed hover:scale-100",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...ariaProps}
      {...props}
    >
      {children}
      {removable && (
        <button
          type="button"
          className={cn(
            "ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors",
            "hover:bg-foreground/10 focus:outline-none focus:ring-1 focus:ring-ring",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={handleRemove}
          disabled={disabled}
          aria-label={actualRemoveLabel}
          title={actualRemoveLabel}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </Badge>
  );
}

export { Chip, chipVariants };