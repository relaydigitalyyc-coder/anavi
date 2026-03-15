/**
 * ANAVI Design System - Easing Tokens
 *
 * Animation easing curves for consistent motion design.
 */

// ============================================================================
// EASING CURVES (From CSS Custom Properties)
// ============================================================================

export const easingCurves = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom curves from CSS
  easeOutExpo: 'var(--ease-out-expo)',
  easeInExpo: 'var(--ease-in-expo)',
  cinematic: 'var(--ease-cinematic)',
  spring: 'var(--ease-spring)',
} as const;

// ============================================================================
// SEMANTIC EASING TOKENS (Component usage)
// ============================================================================

export const easing = {
  // Interactive Elements
  button: easingCurves.cinematic,
  link: easingCurves.cinematic,
  card: easingCurves.cinematic,
  input: easingCurves.easeOutExpo,

  // Navigation & Transitions
  pageTransition: easingCurves.cinematic,
  modal: easingCurves.cinematic,
  dropdown: easingCurves.easeOutExpo,
  tooltip: easingCurves.easeOutExpo,
  toast: easingCurves.spring,

  // Feedback & Micro-interactions
  hover: easingCurves.cinematic,
  focus: easingCurves.easeOutExpo,
  active: easingCurves.easeInExpo,
  ripple: easingCurves.easeOutExpo,

  // Data Visualization
  chart: easingCurves.easeOutExpo,
  progress: easingCurves.linear,
  skeleton: easingCurves.easeInOut,

  // Special Effects
  glow: easingCurves.spring,
  bloom: easingCurves.cinematic,
  float: easingCurves.spring,
} as const;

// ============================================================================
// DURATION TOKENS
// ============================================================================

export const durations = {
  instant: '0ms',
  fastest: '50ms',
  faster: '100ms',
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '700ms',
} as const;

// ============================================================================
// CSS CUSTOM PROPERTIES
// ============================================================================

export const easingCssVars = {
  // Curves
  '--ease-linear': easingCurves.linear,
  '--ease-ease': easingCurves.ease,
  '--ease-in': easingCurves.easeIn,
  '--ease-out': easingCurves.easeOut,
  '--ease-in-out': easingCurves.easeInOut,
  '--ease-out-expo': easingCurves.easeOutExpo,
  '--ease-in-expo': easingCurves.easeInExpo,
  '--ease-cinematic': easingCurves.cinematic,
  '--ease-spring': easingCurves.spring,

  // Durations
  '--duration-instant': durations.instant,
  '--duration-fastest': durations.fastest,
  '--duration-faster': durations.faster,
  '--duration-fast': durations.fast,
  '--duration-base': durations.base,
  '--duration-slow': durations.slow,
  '--duration-slower': durations.slower,
  '--duration-slowest': durations.slowest,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get easing curve value
 */
export function getEasing(curve: keyof typeof easingCurves): string {
  return easingCurves[curve];
}

/**
 * Get semantic easing value
 */
export function getEasingToken(token: keyof typeof easing): string {
  return easing[token];
}

/**
 * Get duration value
 */
export function getDuration(duration: keyof typeof durations): string {
  return durations[duration];
}

/**
 * Create transition CSS string
 */
export function createTransition(
  properties: string | string[],
  easingToken: keyof typeof easing = 'button',
  durationToken: keyof typeof durations = 'base'
): string {
  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  const easingValue = getEasingToken(easingToken);
  const durationValue = getDuration(durationToken);

  return `${props} ${durationValue} ${easingValue}`;
}

/**
 * Type-safe easing token types
 */
export type EasingCurve = keyof typeof easingCurves;
export type EasingToken = keyof typeof easing;
export type DurationToken = keyof typeof durations;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  curves: easingCurves,
  tokens: easing,
  durations,
  cssVars: easingCssVars,
};
