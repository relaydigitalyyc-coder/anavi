/**
 * ANAVI Design System - Typography Tokens
 *
 * Typography system based on CSS custom properties and PRD specifications.
 */

// ============================================================================
// FONT FAMILIES (From CSS Custom Properties)
// ============================================================================

export const fontFamilies = {
  sans: 'var(--font-sans)',
  serif: 'var(--font-serif)',
  mono: 'var(--font-mono)',
  display: 'var(--font-display)',
} as const;

// ============================================================================
// FONT SIZES (8-point scale with semantic names)
// ============================================================================

export const fontSizes = {
  // Absolute sizes
  xs: '11px',   // Micro text
  sm: '12px',   // Labels, captions
  base: '14px', // Body text
  md: '16px',   // Medium text
  lg: '18px',   // Subheading
  xl: '24px',   // Heading
  '2xl': '32px', // Display
  '3xl': '40px',
  '4xl': '48px',
  '5xl': '56px',
  '6xl': '64px',

  // Relative sizes (for responsive typography)
  fluidXs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
  fluidSm: 'clamp(0.875rem, 0.825rem + 0.25vw, 1rem)',
  fluidBase: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
  fluidLg: 'clamp(1.125rem, 1.05rem + 0.375vw, 1.375rem)',
  fluidXl: 'clamp(1.375rem, 1.25rem + 0.625vw, 1.75rem)',
  fluid2xl: 'clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem)',
  fluid3xl: 'clamp(2.5rem, 2rem + 2.5vw, 4rem)',
} as const;

// ============================================================================
// FONT WEIGHTS
// ============================================================================

export const fontWeights = {
  thin: '100',
  extraLight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const;

// ============================================================================
// LINE HEIGHTS
// ============================================================================

export const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

// ============================================================================
// LETTER SPACING
// ============================================================================

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// ============================================================================
// SEMANTIC TYPOGRAPHY TOKENS (Component usage)
// ============================================================================

export const typography = {
  // Display
  display: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Headings
  h1: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.tight,
  },
  h4: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Body Text
  bodyLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Labels & Captions
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  micro: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },

  // Code & Data
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  data: {
    fontFamily: fontFamilies.mono,
    fontSize: '13px', // From PRD: Data Mono 13pt
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Interactive Elements
  buttonLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },
  button: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },
  buttonSmall: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },

  // Form Elements
  input: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  inputLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },
  inputHelp: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
} as const;

// ============================================================================
// CSS CUSTOM PROPERTIES
// ============================================================================

export const typographyCssVars = {
  // Font families
  '--font-family-sans': fontFamilies.sans,
  '--font-family-serif': fontFamilies.serif,
  '--font-family-mono': fontFamilies.mono,
  '--font-family-display': fontFamilies.display,

  // Font sizes
  '--font-size-xs': fontSizes.xs,
  '--font-size-sm': fontSizes.sm,
  '--font-size-base': fontSizes.base,
  '--font-size-md': fontSizes.md,
  '--font-size-lg': fontSizes.lg,
  '--font-size-xl': fontSizes.xl,
  '--font-size-2xl': fontSizes['2xl'],
  '--font-size-3xl': fontSizes['3xl'],

  // Fluid typography
  '--font-size-fluid-xs': fontSizes.fluidXs,
  '--font-size-fluid-sm': fontSizes.fluidSm,
  '--font-size-fluid-base': fontSizes.fluidBase,
  '--font-size-fluid-lg': fontSizes.fluidLg,
  '--font-size-fluid-xl': fontSizes.fluidXl,
  '--font-size-fluid-2xl': fontSizes.fluid2xl,
  '--font-size-fluid-3xl': fontSizes.fluid3xl,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get typography style object for a semantic token
 */
export function getTypography(
  token: keyof typeof typography
): typeof typography[keyof typeof typography] {
  return typography[token];
}

/**
 * Convert typography object to CSS string
 */
export function typographyToCss(
  style: typeof typography[keyof typeof typography]
): string {
  const { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textTransform } = style;
  return `
    font-family: ${fontFamily};
    font-size: ${fontSize};
    font-weight: ${fontWeight};
    line-height: ${lineHeight};
    letter-spacing: ${letterSpacing};
    ${textTransform ? `text-transform: ${textTransform};` : ''}
  `.trim();
}

/**
 * Type-safe typography token type
 */
export type TypographyToken = keyof typeof typography;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  families: fontFamilies,
  sizes: fontSizes,
  weights: fontWeights,
  lineHeights,
  letterSpacing,
  tokens: typography,
  cssVars: typographyCssVars,
};
