/**
 * ANAVI Design System - Border Radius Tokens
 *
 * Border radius system based on CSS custom properties.
 */

// ============================================================================
// BORDER RADIUS SCALE
// ============================================================================

export const radiusScale = {
  none: '0px',
  sharp: 'var(--radius-sharp)', // 0px
  sm: '2px',
  base: 'var(--radius)', // 0.5rem (8px)
  md: '8px',
  lg: 'var(--radius-lg)', // 16px
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  full: '9999px',
} as const;

// ============================================================================
// SEMANTIC RADIUS TOKENS (Component usage)
// ============================================================================

export const radius = {
  // Interactive Elements
  button: radiusScale.base,
  buttonSm: radiusScale.sm,
  buttonLg: radiusScale.lg,
  input: radiusScale.base,
  inputSm: radiusScale.sm,
  inputLg: radiusScale.lg,
  chip: radiusScale.full,

  // Containers
  card: radiusScale.base,
  cardSm: radiusScale.sm,
  cardLg: radiusScale.lg,
  modal: radiusScale.lg,
  sheet: radiusScale.lg,
  dropdown: radiusScale.base,
  popover: radiusScale.base,
  tooltip: radiusScale.sm,

  // UI Elements
  avatar: radiusScale.full,
  badge: radiusScale.full,
  tag: radiusScale.md,

  // Special
  pill: radiusScale.full,
  rounded: radiusScale.base,
  roundedLg: radiusScale.lg,
  roundedFull: radiusScale.full,
} as const;

// ============================================================================
// CSS CUSTOM PROPERTIES
// ============================================================================

export const radiusCssVars = {
  '--radius-none': radiusScale.none,
  '--radius-sharp': radiusScale.sharp,
  '--radius-sm': radiusScale.sm,
  '--radius': radiusScale.base,
  '--radius-md': radiusScale.md,
  '--radius-lg': radiusScale.lg,
  '--radius-xl': radiusScale.xl,
  '--radius-2xl': radiusScale['2xl'],
  '--radius-3xl': radiusScale['3xl'],
  '--radius-full': radiusScale.full,

  // Semantic radius vars
  '--radius-button': radius.button,
  '--radius-input': radius.input,
  '--radius-card': radius.card,
  '--radius-modal': radius.modal,
  '--radius-avatar': radius.avatar,
  '--radius-badge': radius.badge,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get radius value from the scale
 */
export function getRadius(unit: keyof typeof radiusScale): string {
  return radiusScale[unit];
}

/**
 * Get semantic radius value
 */
export function getRadiusToken(token: keyof typeof radius): string {
  return radius[token];
}

/**
 * Type-safe radius token types
 */
export type RadiusScale = keyof typeof radiusScale;
export type RadiusToken = keyof typeof radius;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  scale: radiusScale,
  tokens: radius,
  cssVars: radiusCssVars,
};
