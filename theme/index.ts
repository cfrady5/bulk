export { colors, palette, statusColors, confidenceColors, severityColors } from './colors';
export { spacing, layout } from './spacing';
export { radius } from './radius';
export { typography, fontFamily, fontWeight } from './typography';
export type { TypographyVariant } from './typography';
export { shadows } from './shadows';
export { gradients } from './gradients';

import { colors } from './colors';
import { gradients } from './gradients';
import { radius } from './radius';
import { shadows } from './shadows';
import { layout, spacing } from './spacing';
import { typography } from './typography';

/** Convenience bundle if you'd rather import one object. */
export const theme = {
  colors,
  spacing,
  layout,
  radius,
  typography,
  shadows,
  gradients,
} as const;

export type Theme = typeof theme;
