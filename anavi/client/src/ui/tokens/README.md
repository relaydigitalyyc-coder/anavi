# ANAVI Design Tokens

Comprehensive design token system for the ANAVI platform.

## Overview

This token system provides a single source of truth for all design values (colors, spacing, typography, etc.) used throughout the ANAVI application. Tokens are organized semantically and provide type-safe access via TypeScript.

## Structure

```
tokens/
├── index.ts          # Main exports and utilities
├── colors.ts         # Color tokens and scales
├── spacing.ts        # 8-point spacing system
├── typography.ts     # Typography scale and semantic tokens
├── radius.ts         # Border radius tokens
├── shadows.ts        # Shadow and elevation tokens
├── easing.ts         # Animation easing curves and durations
└── README.md         # This documentation
```

## Usage

### Importing Tokens

```typescript
// Import entire token system
import tokens from '@/ui/tokens';

// Or import specific token categories
import { colors, spacing, typography } from '@/ui/tokens';

// Or import individual exports
import { getColor, getSpacing } from '@/ui/tokens';
```

### Using Color Tokens

```typescript
import { colors } from '@/ui/tokens';

// Raw color values
const navy = colors.raw.navy; // '#0A1628'

// Color scales
const navyLight = colors.scales.navy[50]; // '#F3F7FC'
const navyDark = colors.scales.navy[900]; // '#020608'

// Semantic tokens (CSS variable references)
const primary = colors.semantic.primary; // 'var(--color-primary)'
const accent = colors.semantic.accent;   // 'var(--color-accent)'

// Utility functions
const bgColor = colors.getColor('background'); // 'var(--color-background)'
```

### Using Spacing Tokens

```typescript
import { spacing } from '@/ui/tokens';

// Scale values
const small = spacing.scale[2]; // '16px'
const large = spacing.scale[6]; // '48px'

// Semantic tokens
const cardPadding = spacing.tokens.cardPadding; // '24px'
const sectionSpacing = spacing.tokens.sectionSpacing; // '48px'

// Utility functions
const space = spacing.getSpacing(4); // '32px'
const token = spacing.getSpacingToken('cardPadding'); // '24px'
```

### Using Typography Tokens

```typescript
import { typography } from '@/ui/tokens';

// Font families
const sans = typography.families.sans; // 'var(--font-sans)'

// Semantic typography styles
const headingStyle = typography.tokens.h1;
// {
//   fontFamily: 'var(--font-sans)',
//   fontSize: '32px',
//   fontWeight: '700',
//   lineHeight: '1.25',
//   letterSpacing: '-0.025em'
// }

// Convert to CSS
const css = typography.typographyToCss(headingStyle);
```

### Using Radius Tokens

```typescript
import { radius } from '@/ui/tokens';

// Scale values
const small = radius.scale.sm; // '2px'
const large = radius.scale.lg; // 'var(--radius-lg)'

// Semantic tokens
const buttonRadius = radius.tokens.button; // 'var(--radius)'
const cardRadius = radius.tokens.card;     // 'var(--radius)'
```

### Using Shadow Tokens

```typescript
import { shadows } from '@/ui/tokens';

// Scale values
const subtle = shadows.scale.sm; // '0 1px 3px 0 rgb(0 0 0 / 0.1)...'

// Cinematic shadows
const glow = shadows.cinematic.glowCyan; // 'var(--shadow-glow-cyan)'

// Semantic tokens
const cardShadow = shadows.tokens.card;       // shadowScale.base
const cardHover = shadows.tokens.cardHover;   // 'var(--shadow-hover)'
```

### Using Easing Tokens

```typescript
import { easing } from '@/ui/tokens';

// Easing curves
const cinematic = easing.curves.cinematic; // 'var(--ease-cinematic)'

// Durations
const fast = easing.durations.fast; // '150ms'

// Semantic tokens
const buttonEasing = easing.tokens.button; // 'var(--ease-cinematic)'

// Create transitions
const transition = easing.createTransition(
  'background-color, transform',
  'button',
  'base'
); // 'background-color, transform 200ms var(--ease-cinematic)'
```

## CSS Custom Properties

The token system works with existing CSS custom properties defined in `index.css`. Additional CSS variables can be generated using:

```typescript
import { generateCssVars } from '@/ui/tokens';

const cssVars = generateCssVars();
// Outputs:
// --spacing-1: 8px;
// --spacing-2: 16px;
// --font-size-xs: 11px;
// --font-size-sm: 12px;
// ...etc
```

## Integration with Components

### React Component Example

```tsx
import React from 'react';
import { colors, spacing, typography } from '@/ui/tokens';
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all',
  {
    variants: {
      variant: {
        primary: `bg-[${colors.raw.navy}] text-white hover:bg-[${colors.scales.navy[600]}]`,
        gold: `bg-[${colors.raw.gold}] text-white hover:bg-[${colors.scales.gold[600]}]`,
      },
      size: {
        sm: `h-[${spacing.tokens.buttonHeightSm}] px-[${spacing.tokens.buttonPaddingXSm}]`,
        md: `h-[${spacing.tokens.buttonHeightMd}] px-[${spacing.tokens.buttonPaddingXMd}]`,
        lg: `h-[${spacing.tokens.buttonHeightLg}] px-[${spacing.tokens.buttonPaddingXLg}]`,
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      style={{
        borderRadius: radius.tokens.button,
        fontFamily: typography.tokens.button.fontFamily,
        fontSize: typography.tokens.button.fontSize,
        fontWeight: typography.tokens.button.fontWeight,
        letterSpacing: typography.tokens.button.letterSpacing,
      }}
      {...props}
    />
  );
}
```

### Styling with CSS Variables

```css
/* Using CSS custom properties from tokens */
.component {
  background-color: var(--color-background);
  padding: var(--spacing-card-padding);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
}

.component:hover {
  box-shadow: var(--shadow-card-hover);
  transition: box-shadow var(--duration-base) var(--ease-cinematic);
}
```

## Best Practices

1. **Use semantic tokens** over raw values for maintainability
2. **Reference CSS variables** in stylesheets for runtime theming support
3. **Use scale values** for consistency (e.g., `spacing.scale[4]` instead of `'32px'`)
4. **Leverage TypeScript** for type-safe token usage
5. **Add new tokens** to the appropriate category file when needed

## Adding New Tokens

1. Add raw values to the appropriate scale
2. Create semantic token mapping
3. Add CSS custom property definition if needed
4. Export from the category file
5. Re-export from `index.ts`

## Relationship with Tailwind

The token system complements Tailwind CSS by providing:
- TypeScript interfaces for design values
- Semantic naming for design decisions
- Runtime CSS variable support
- Design token documentation

For Tailwind class usage, continue using utility classes while referencing token values for consistency.

## Future Enhancements

- Theme switching support
- Dark mode tokens
- Responsive typography scales
- Design token export for Figma
- Automated token synchronization