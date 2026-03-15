/**
 * ANAVI Design System - Spacing Tokens
 *
 * 8-point spacing system based on PRD specifications.
 * All values are in pixels and follow the base unit of 8px.
 */

// ============================================================================
// BASE SPACING SCALE (8-point system)
// ============================================================================

export const spacingScale = {
  // Micro spacing
  px: '1px',
  0: '0px',
  0.5: '4px', // Half unit
  1: '8px',   // Base unit
  1.5: '12px',
  2: '16px',  // 2 units
  2.5: '20px',
  3: '24px',  // 3 units (Card padding)
  3.5: '28px',
  4: '32px',  // 4 units
  5: '40px',  // 5 units
  6: '48px',  // 6 units (Section spacing)
  7: '56px',
  8: '64px',  // 8 units
  9: '72px',
  10: '80px',
  11: '88px',
  12: '96px', // 12 units
  14: '112px',
  16: '128px',
  20: '160px',
  24: '192px',
  28: '224px',
  32: '256px',
  36: '288px',
  40: '320px',
  44: '352px',
  48: '384px',
  52: '416px',
  56: '448px',
  60: '480px',
  64: '512px',
  72: '576px',
  80: '640px',
  96: '768px',
} as const;

// ============================================================================
// SEMANTIC SPACING TOKENS
// ============================================================================

export const spacing = {
  // Container & Layout
  containerMaxWidth: '1280px', // From PRD: Content Width

  // Component Spacing
  cardPadding: spacingScale[3], // 24px - Card internal padding
  cardGap: spacingScale[4],     // 32px - Space between card elements
  sectionSpacing: spacingScale[6], // 48px - Between major sections
  formSpacing: spacingScale[3], // 24px - Between form elements
  inputHeight: '48px', // Form input height from PRD

  // Content Spacing
  contentPadding: spacingScale[6], // 48px - Page content padding
  sidebarWidth: '240px', // Common sidebar width
  sidebarPadding: spacingScale[4], // 32px - Sidebar internal padding

  // UI Element Spacing
  iconSizeSm: spacingScale[3], // 24px - Small icon size
  iconSizeMd: spacingScale[4], // 32px - Medium icon size
  iconSizeLg: spacingScale[6], // 48px - Large icon size
  avatarSizeSm: spacingScale[4], // 32px
  avatarSizeMd: spacingScale[6], // 48px
  avatarSizeLg: spacingScale[8], // 64px

  // Interactive Elements
  buttonHeightSm: spacingScale[5], // 40px
  buttonHeightMd: '48px', // From PRD: Form Inputs Height
  buttonHeightLg: spacingScale[7], // 56px
  buttonPaddingXSm: spacingScale[2], // 16px
  buttonPaddingXMd: spacingScale[3], // 24px
  buttonPaddingXLg: spacingScale[4], // 32px

  // Border & Divider
  borderWidth: '1px',
  borderWidthThick: '2px',
  dividerHeight: '1px',

  // Shadow Offsets
  shadowSm: '0 1px 2px 0px',
  shadowMd: '0 4px 6px -1px',
  shadowLg: '0 10px 15px -3px',
  shadowXl: '0 20px 25px -5px',
} as const;

// ============================================================================
// CSS CUSTOM PROPERTIES
// ============================================================================

/**
 * CSS custom properties for spacing.
 * These should be added to the global CSS to enable CSS variable usage.
 */
export const spacingCssVars = {
  '--spacing-px': spacingScale.px,
  '--spacing-0': spacingScale[0],
  '--spacing-0-5': spacingScale[0.5],
  '--spacing-1': spacingScale[1],
  '--spacing-1-5': spacingScale[1.5],
  '--spacing-2': spacingScale[2],
  '--spacing-2-5': spacingScale[2.5],
  '--spacing-3': spacingScale[3],
  '--spacing-3-5': spacingScale[3.5],
  '--spacing-4': spacingScale[4],
  '--spacing-5': spacingScale[5],
  '--spacing-6': spacingScale[6],
  '--spacing-7': spacingScale[7],
  '--spacing-8': spacingScale[8],
  '--spacing-9': spacingScale[9],
  '--spacing-10': spacingScale[10],
  '--spacing-12': spacingScale[12],
  '--spacing-16': spacingScale[16],
  '--spacing-20': spacingScale[20],
  '--spacing-24': spacingScale[24],
  '--spacing-32': spacingScale[32],
  '--spacing-40': spacingScale[40],
  '--spacing-48': spacingScale[48],
  '--spacing-56': spacingScale[56],
  '--spacing-64': spacingScale[64],
  '--spacing-80': spacingScale[80],
  '--spacing-96': spacingScale[96],

  // Semantic spacing vars
  '--spacing-container-max-width': spacing.containerMaxWidth,
  '--spacing-card-padding': spacing.cardPadding,
  '--spacing-section': spacing.sectionSpacing,
  '--spacing-input-height': spacing.inputHeight,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get spacing value from the scale
 */
export function getSpacing(unit: keyof typeof spacingScale): string {
  return spacingScale[unit];
}

/**
 * Get semantic spacing value
 */
export function getSpacingToken(token: keyof typeof spacing): string {
  return spacing[token];
}

/**
 * Type-safe spacing token types
 */
export type SpacingScale = keyof typeof spacingScale;
export type SpacingToken = keyof typeof spacing;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  scale: spacingScale,
  tokens: spacing,
  cssVars: spacingCssVars,
};