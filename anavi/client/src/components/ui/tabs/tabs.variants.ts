import { cva } from "class-variance-authority";

// Base styles for tabs root
export const tabsVariants = cva("flex flex-col gap-2", {
  variants: {
    orientation: {
      horizontal: "flex-col",
      vertical: "flex-row",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    fullWidth: false,
  },
});

// Variants for tabs list
export const tabsListVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default:
          "bg-muted text-muted-foreground rounded-lg p-[3px]",
        outline:
          "border border-input bg-transparent rounded-lg p-[3px]",
        pill:
          "bg-transparent gap-1 p-1",
        underline:
          "border-b border-border bg-transparent rounded-none p-0 gap-0",
      },
      size: {
        sm: "h-7 text-xs",
        md: "h-9 text-sm",
        lg: "h-11 text-base",
      },
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col items-stretch",
      },
      fullWidth: {
        true: "w-full",
        false: "w-fit",
      },
      scrollable: {
        true: "overflow-x-auto scrollbar-hide",
        false: "",
      },
    },
    compoundVariants: [
      // Pill variant with size adjustments
      {
        variant: "pill",
        size: "sm",
        className: "h-7",
      },
      {
        variant: "pill",
        size: "md",
        className: "h-9",
      },
      {
        variant: "pill",
        size: "lg",
        className: "h-11",
      },
      // Underline variant adjustments
      {
        variant: "underline",
        className: "min-h-0",
      },
      {
        variant: "underline",
        size: "sm",
        className: "h-8",
      },
      {
        variant: "underline",
        size: "md",
        className: "h-10",
      },
      {
        variant: "underline",
        size: "lg",
        className: "h-12",
      },
      // Vertical orientation adjustments
      {
        orientation: "vertical",
        variant: "default",
        className: "w-fit",
      },
      {
        orientation: "vertical",
        variant: "outline",
        className: "w-fit",
      },
      {
        orientation: "vertical",
        variant: "pill",
        className: "w-fit",
      },
      {
        orientation: "vertical",
        variant: "underline",
        className: "w-fit border-b-0 border-r border-border",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      orientation: "horizontal",
      fullWidth: false,
      scrollable: false,
    },
  }
);

// Variants for tabs trigger
export const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: [
          "border border-transparent",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          "dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30",
          "text-foreground dark:text-muted-foreground",
        ],
        outline: [
          "border border-transparent",
          "data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary",
          "hover:bg-accent",
          "text-muted-foreground",
        ],
        pill: [
          "rounded-full",
          "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
          "hover:bg-accent",
          "text-muted-foreground",
        ],
        underline: [
          "border-b-2 border-transparent rounded-none",
          "data-[state=active]:border-primary data-[state=active]:text-primary",
          "hover:text-foreground",
          "text-muted-foreground",
          "pb-2",
        ],
      },
      size: {
        sm: "h-[calc(100%-1px)] px-2 py-1 text-xs",
        md: "h-[calc(100%-1px)] px-3 py-1.5 text-sm",
        lg: "h-[calc(100%-1px)] px-4 py-2 text-base",
      },
      color: {
        primary: "",
        secondary: "data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground",
        gold: "data-[state=active]:bg-trust-gold data-[state=active]:text-white",
        destructive: "data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground",
      },
      iconPosition: {
        left: "flex-row",
        right: "flex-row-reverse",
        top: "flex-col",
        bottom: "flex-col-reverse",
      },
      fullWidth: {
        true: "flex-1",
        false: "",
      },
      destructive: {
        true: "data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground",
      },
    },
    compoundVariants: [
      // Size adjustments for underline variant
      {
        variant: "underline",
        size: "sm",
        className: "px-2",
      },
      {
        variant: "underline",
        size: "md",
        className: "px-3",
      },
      {
        variant: "underline",
        size: "lg",
        className: "px-4",
      },
      // Pill variant size adjustments
      {
        variant: "pill",
        size: "sm",
        className: "px-3",
      },
      {
        variant: "pill",
        size: "md",
        className: "px-4",
      },
      {
        variant: "pill",
        size: "lg",
        className: "px-5",
      },
      // Color variants
      {
        color: "gold",
        variant: ["default", "outline"],
        className: "data-[state=active]:bg-trust-gold data-[state=active]:text-white",
      },
      {
        color: "gold",
        variant: "pill",
        className: "data-[state=active]:bg-trust-gold data-[state=active]:text-white",
      },
      {
        color: "gold",
        variant: "underline",
        className: "data-[state=active]:border-trust-gold data-[state=active]:text-trust-gold",
      },
      // Icon position adjustments
      {
        iconPosition: ["top", "bottom"],
        className: "gap-1",
      },
      {
        iconPosition: ["left", "right"],
        className: "gap-2",
      },
      // Destructive variant
      {
        destructive: true,
        variant: "underline",
        className: "data-[state=active]:border-destructive data-[state=active]:text-destructive",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      color: "primary",
      iconPosition: "left",
      fullWidth: false,
      destructive: false,
    },
  }
);

// Variants for tabs content
export const tabsContentVariants = cva("outline-none", {
  variants: {
    animated: {
      true: "transition-all duration-200 ease-in-out",
      false: "",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    animated: true,
    fullWidth: true,
  },
});