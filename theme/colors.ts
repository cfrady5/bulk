/**
 * bulk color system.
 *
 * Premium dark interface — deep graphite backgrounds, elevated surfaces,
 * subtle borders, a single restrained accent, and clear semantic colors.
 *
 * Never hardcode hex values in components. Import from here so the whole app
 * can be re-themed from one place.
 */

export const palette = {
  // Backgrounds (deepest -> most elevated)
  black: '#08090B',
  graphite: '#0E1014',
  surface: '#16181D',
  surfaceElevated: '#1E2127',
  surfaceHover: '#262A31',

  // Borders / dividers
  border: '#2A2E36',
  borderStrong: '#383D47',
  divider: '#1C1F25',

  // Text
  textPrimary: '#F4F6F8',
  textSecondary: '#9BA3AF',
  textMuted: '#6B7280',
  textInverse: '#0A0B0D',

  // Accent (electric violet/blue) — used sparingly
  accent: '#6E8BFF',
  accentMuted: '#3A4470',
  accentSoft: 'rgba(110, 139, 255, 0.14)',

  // Brand gradient anchor colors (the logo cards: violet -> electric blue)
  brandViolet: '#8E73F5',
  brandIndigo: '#5C5DF0',
  brandBlue: '#1E47E6',
  brandGlow: 'rgba(110, 139, 255, 0.22)',

  // Semantic
  success: '#3FCF8E',
  successSoft: 'rgba(63, 207, 142, 0.14)',
  warning: '#F5B14C',
  warningSoft: 'rgba(245, 177, 76, 0.14)',
  error: '#F26D6D',
  errorSoft: 'rgba(242, 109, 109, 0.14)',
  info: '#6E8BFF',
  infoSoft: 'rgba(110, 139, 255, 0.14)',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.6)',
  shimmer: '#232830',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

export const colors = {
  ...palette,

  // Semantic aliases used throughout the app
  background: palette.black,
  backgroundAlt: palette.graphite,
  card: palette.surface,
  cardElevated: palette.surfaceElevated,

  primary: palette.accent,
  onPrimary: palette.textInverse,
} as const;

/**
 * Maps a review status / confidence / severity to its color set.
 * Keeps status colors consistent across badges, chips, and cards.
 */
export const statusColors = {
  Draft: { fg: palette.textSecondary, bg: palette.surfaceElevated, border: palette.border },
  'Needs Review': { fg: palette.warning, bg: palette.warningSoft, border: palette.warning },
  Ready: { fg: palette.success, bg: palette.successSoft, border: palette.success },
  Flagged: { fg: palette.error, bg: palette.errorSoft, border: palette.error },
  Exported: { fg: palette.accent, bg: palette.accentSoft, border: palette.accent },
} as const;

export const confidenceColors = {
  High: { fg: palette.success, bg: palette.successSoft, border: palette.success },
  Medium: { fg: palette.warning, bg: palette.warningSoft, border: palette.warning },
  Low: { fg: palette.error, bg: palette.errorSoft, border: palette.error },
  Missing: { fg: palette.textMuted, bg: palette.surfaceElevated, border: palette.borderStrong },
} as const;

export const severityColors = {
  error: { fg: palette.error, bg: palette.errorSoft, border: palette.error },
  warning: { fg: palette.warning, bg: palette.warningSoft, border: palette.warning },
  info: { fg: palette.info, bg: palette.infoSoft, border: palette.info },
} as const;

export type Colors = typeof colors;
