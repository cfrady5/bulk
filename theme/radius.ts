/**
 * Corner radius scale. Rounded, modern surfaces — bigger radius on larger
 * containers, pills for chips/badges.
 */
export const radius = {
  none: 0,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
  full: 9999,
} as const;

export type Radius = keyof typeof radius;
