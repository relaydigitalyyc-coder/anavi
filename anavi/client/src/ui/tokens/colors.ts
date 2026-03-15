/**
 * ANAVI Design System - Color Tokens
 *
 * This file defines the complete color token system for the ANAVI platform.
 * Tokens are organized by semantic meaning and usage context.
 *
 * All colors reference CSS custom properties defined in index.css
 * to maintain a single source of truth.
 */

// ============================================================================
// RAW COLOR VALUES (From CSS Custom Properties)
// ============================================================================

export const rawColors = {
  // Core Palette
  navy: '#0A1628',
  gold: '#C4972A',
  blue: '#2563EB',
  green: '#059669',
  red: '#DC2626',
  steel: '#1E3A5F',

  // Neutrals
  white: '#FFFFFF',
  background: '#F3F7FC',
  surface: '#F3F7FC',
  muted: '#E8EDF4',
  border: '#D1DCF0',
  borderBlue: '#D1DCF0',
  input: '#E8EDF4',

  // Semantic
  accent: '#2563EB',
  destructive: '#DC2626',
  trustGold: '#C4972A',
  trustGreen: '#059669',
  dataSteel: '#1E3A5F',
  alertRed: '#DC2626',

  // Cinematic UI
  canvasVoid: '#060A12',
  canvasDeep: '#0A0F1E',
  canvasMid: '#0D1628',
  canvasSurface: '#162040',
  electricCyan: 'oklch(0.75 0.18 200)',
  electricViolet: 'oklch(0.65 0.22 280)',

  // Chart Colors
  chart1: '#2563EB',
  chart2: '#C4972A',
  chart3: '#059669',
  chart4: '#1E3A5F',
  chart5: '#DC2626',

  // Sidebar
  sidebar: '#0A1628',
  sidebarAccent: '#162240',
  sidebarBorder: '#1E3A5F',
  sidebarPrimary: '#2563EB',
} as const;

// ============================================================================
// COLOR SCALES (Generated from base colors)
// ============================================================================

/**
 * Navy color scale (Primary brand color)
 * Base: #0A1628
 */
export const navyScale = {
  50: '#F3F7FC',
  100: '#D1DCF0',
  200: '#A3B9E1',
  300: '#7596D2',
  400: '#4773C3',
  500: '#0A1628', // Primary Navy
  600: '#081220',
  700: '#060E18',
  800: '#040A10',
  900: '#020608',
} as const;

/**
 * Gold color scale (Trust/accent color)
 * Base: #C4972A
 */
export const goldScale = {
  50: '#FDF8E9',
  100: '#FAEDC9',
  200: '#F5DA95',
  300: '#F0C760',
  400: '#EBB42C',
  500: '#C4972A', // Trust Gold
  600: '#9D7822',
  700: '#765A19',
  800: '#4F3B11',
  900: '#281D09',
} as const;

/**
 * Blue color scale (Action/CTA color)
 * Base: #2563EB
 */
export const blueScale = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#2563EB', // Action Blue
  600: '#1D4ED8',
  700: '#1E40AF',
  800: '#1E3A8A',
  900: '#172554',
} as const;

/**
 * Green color scale (Success/trust color)
 * Base: #059669
 */
export const greenScale = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#059669', // Trust Green
  600: '#047857',
  700: '#065F46',
  800: '#064E3B',
  900: '#022C22',
} as const;

/**
 * Red color scale (Destructive/alert color)
 * Base: #DC2626
 */
export const redScale = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#DC2626', // Alert Red
  600: '#B91C1C',
  700: '#991B1B',
  800: '#7F1D1D',
  900: '#451A1A',
} as const;

/**
 * Steel color scale (Data/neutral color)
 * Base: #1E3A5F
 */
export const steelScale = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#1E3A5F', // Data Steel
  600: '#1E293B',
  700: '#0F172A',
  800: '#0A1422',
  900: '#020617',
} as const;

// ============================================================================
// SEMANTIC COLOR TOKENS (For component usage)
// ============================================================================

export const semanticColors = {
  // Background & Surface
  background: 'var(--color-background)',
  surface: 'var(--color-surface)',
  card: 'var(--color-card)',
  popover: 'var(--color-popover)',

  // Foreground
  foreground: 'var(--color-foreground)',
  cardForeground: 'var(--color-card-foreground)',
  popoverForeground: 'var(--color-popover-foreground)',
  mutedForeground: 'var(--color-muted-foreground)',

  // Primary
  primary: 'var(--color-primary)',
  primaryForeground: 'var(--color-primary-foreground)',

  // Secondary
  secondary: 'var(--color-secondary)',
  secondaryForeground: 'var(--color-secondary-foreground)',

  // Accent
  accent: 'var(--color-accent)',
  accentForeground: 'var(--color-accent-foreground)',

  // Destructive
  destructive: 'var(--color-destructive)',
  destructiveForeground: 'var(--color-destructive-foreground)',

  // Border & Input
  border: 'var(--color-border)',
  input: 'var(--color-input)',
  ring: 'var(--color-ring)',

  // ANAVI Semantic
  trustGold: 'var(--color-trust-gold)',
  trustGreen: 'var(--color-trust-green)',
  dataSteel: 'var(--color-data-steel)',
  borderBlue: 'var(--color-border-blue)',
  alertRed: 'var(--color-alert-red)',
  navy: 'var(--color-navy)',

  // Cinematic UI
  canvasVoid: 'var(--color-canvas-void)',
  canvasDeep: 'var(--color-canvas-deep)',
  canvasMid: 'var(--color-canvas-mid)',
  canvasSurface: 'var(--color-canvas-surface)',
  electricCyan: 'var(--color-electric-cyan)',
  electricViolet: 'var(--color-electric-violet)',

  // Chart
  chart1: 'var(--color-chart-1)',
  chart2: 'var(--color-chart-2)',
  chart3: 'var(--color-chart-3)',
  chart4: 'var(--color-chart-4)',
  chart5: 'var(--color-chart-5)',

  // Sidebar
  sidebar: 'var(--color-sidebar)',
  sidebarForeground: 'var(--color-sidebar-foreground)',
  sidebarPrimary: 'var(--color-sidebar-primary)',
  sidebarPrimaryForeground: 'var(--color-sidebar-primary-foreground)',
  sidebarAccent: 'var(--color-sidebar-accent)',
  sidebarAccentForeground: 'var(--color-sidebar-accent-foreground)',
  sidebarBorder: 'var(--color-sidebar-border)',
  sidebarRing: 'var(--color-sidebar-ring)',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get CSS variable reference for a semantic color
 */
export function colorVar(token: keyof typeof semanticColors): string {
  return semanticColors[token];
}

/**
 * Get raw color value for a semantic color
 * Note: This returns the CSS variable reference, not the actual hex value
 * For actual hex values, use rawColors or scale objects
 */
export function getColor(token: keyof typeof semanticColors): string {
  return semanticColors[token];
}

/**
 * Type-safe color token type
 */
export type ColorToken = keyof typeof semanticColors;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  raw: rawColors,
  scales: {
    navy: navyScale,
    gold: goldScale,
    blue: blueScale,
    green: greenScale,
    red: redScale,
    steel: steelScale,
  },
  semantic: semanticColors,
  vars: semanticColors, // Alias for semantic
};