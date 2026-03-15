/**
 * ANAVI Design System - Shadow Tokens
 *
 * Shadow system including elevation levels and cinematic glow effects.
 */

// ============================================================================
// SHADOW SCALE (Elevation levels)
// ============================================================================

export const shadowScale = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '2xl': '0 50px 100px -20px rgb(0 0 0 / 0.25)',
} as const;

// ============================================================================
// CINEMATIC SHADOWS (From CSS Custom Properties)
// ============================================================================

export const cinematicShadows = {
  glowCyan: 'var(--shadow-glow-cyan)',
  glowGold: 'var(--shadow-glow-gold)',
  bloom: 'var(--shadow-bloom)',
  hover: 'var(--shadow-hover)',
} as const;

// ============================================================================
// SEMANTIC SHADOW TOKENS (Component usage)
// ============================================================================

export const shadows = {
  // Elevation Levels
  elevation0: shadowScale.none,
  elevation1: shadowScale.xs,
  elevation2: shadowScale.sm,
  elevation3: shadowScale.base,
  elevation4: shadowScale.md,
  elevation5: shadowScale.lg,
  elevation6: shadowScale.xl,
  elevation7: shadowScale['2xl'],

  // Interactive States
  hover: cinematicShadows.hover,
  focus: '0 0 0 3px var(--color-ring)',
  focusVisible: '0 0 0 3px var(--color-ring), 0 0 0 1px var(--color-background)',
  active: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // UI Elements
  card: shadowScale.base,
  cardHover: cinematicShadows.hover,
  modal: shadowScale.lg,
  dropdown: shadowScale.md,
  tooltip: shadowScale.sm,
  toast: shadowScale.md,

  // Special Effects
  glowCyan: cinematicShadows.glowCyan,
  glowGold: cinematicShadows.glowGold,
  bloom: cinematicShadows.bloom,
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  inset: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Borders & Outlines
  outline: '0 0 0 1px var(--color-border)',
  outlineHover: '0 0 0 1px var(--color-accent)',
  outlineFocus: '0 0 0 2px var(--color-ring)',
} as const;

// ============================================================================
// CSS CUSTOM PROPERTIES
// ============================================================================

export const shadowCssVars = {
  // Scale
  '--shadow-xs': shadowScale.xs,
  '--shadow-sm': shadowScale.sm,
  '--shadow-base': shadowScale.base,
  '--shadow-md': shadowScale.md,
  '--shadow-lg': shadowScale.lg,
  '--shadow-xl': shadowScale.xl,
  '--shadow-2xl': shadowScale['2xl'],

  // Cinematic
  '--shadow-glow-cyan': cinematicShadows.glowCyan,
  '--shadow-glow-gold': cinematicShadows.glowGold,
  '--shadow-bloom': cinematicShadows.bloom,
  '--shadow-hover': cinematicShadows.hover,

  // Semantic
  '--shadow-card': shadows.card,
  '--shadow-card-hover': shadows.cardHover,
  '--shadow-modal': shadows.modal,
  '--shadow-dropdown': shadows.dropdown,
  '--shadow-tooltip': shadows.tooltip,
  '--shadow-focus': shadows.focus,
  '--shadow-outline': shadows.outline,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get shadow value from the scale
 */
export function getShadow(unit: keyof typeof shadowScale): string {
  return shadowScale[unit];
}

/**
 * Get cinematic shadow value
 */
export function getCinematicShadow(
  shadow: keyof typeof cinematicShadows
): string {
  return cinematicShadows[shadow];
}

/**
 * Get semantic shadow value
 */
export function getShadowToken(token: keyof typeof shadows): string {
  return shadows[token];
}

/**
 * Type-safe shadow token types
 */
export type ShadowScale = keyof typeof shadowScale;
export type CinematicShadow = keyof typeof cinematicShadows;
export type ShadowToken = keyof typeof shadows;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  scale: shadowScale,
  cinematic: cinematicShadows,
  tokens: shadows,
  cssVars: shadowCssVars,
};
