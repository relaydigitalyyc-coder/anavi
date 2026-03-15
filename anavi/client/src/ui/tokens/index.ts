/**
 * ANAVI Design System - Design Tokens
 *
 * Centralized design token system for the ANAVI platform.
 * All design values (colors, spacing, typography, etc.) are defined here
 * and exported for use in components and styles.
 */

// ============================================================================
// RE-EXPORTS
// ============================================================================

export * as colors from './colors';
export * as spacing from './spacing';
export * as typography from './typography';
export * as radius from './radius';
export * as shadows from './shadows';
export * as easing from './easing';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  ColorToken,
} from './colors';

export type {
  SpacingScale,
  SpacingToken,
} from './spacing';

export type {
  TypographyToken,
} from './typography';

export type {
  RadiusScale,
  RadiusToken,
} from './radius';

export type {
  ShadowScale,
  CinematicShadow,
  ShadowToken,
} from './shadows';

export type {
  EasingCurve,
  EasingToken,
  DurationToken,
} from './easing';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all CSS custom properties for the design system
 * This can be used to inject tokens into global CSS
 */
export function getDesignSystemCssVars(): Record<string, string> {
  return {
    ...spacing.spacingCssVars,
    ...typography.typographyCssVars,
    ...radius.radiusCssVars,
    ...shadows.shadowCssVars,
    ...easing.easingCssVars,
    // Note: colors uses semantic CSS vars already defined in index.css
    // These are referenced via var(--color-*) in the semanticColors object
  };
}

/**
 * Generate CSS custom properties string for injection
 */
export function generateCssVars(): string {
  const vars = getDesignSystemCssVars();
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}

// ============================================================================
// DEFAULT EXPORT (Complete token system)
// ============================================================================

export default {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  easing,
  getDesignSystemCssVars,
  generateCssVars,
};
