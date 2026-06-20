/**
 * Spacing scale (4pt grid). Use these tokens for padding, margin, and gaps
 * so vertical rhythm stays consistent across screens.
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

/** Common layout constants. */
export const layout = {
  screenPaddingH: spacing.xl,
  screenPaddingV: spacing.lg,
  cardPadding: spacing.lg,
  gap: spacing.md,
  // Large, thumb-friendly tap targets per the capture-speed requirement.
  controlHeight: 52,
  controlHeightLarge: 64,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;

export type Spacing = keyof typeof spacing;
