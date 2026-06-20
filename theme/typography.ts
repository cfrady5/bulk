import { Platform, TextStyle } from 'react-native';

import { colors } from './colors';

/**
 * Typography system. We lean on the platform system font (San Francisco /
 * Roboto) for a native, premium feel without bundling custom fonts in the MVP.
 *
 * TODO (future): load a custom display font (e.g. Inter / Geist) via
 * expo-font for a more branded look.
 */

const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const systemFontMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

export const fontFamily = {
  regular: systemFont,
  medium: systemFontMedium,
  semibold: systemFontMedium,
  bold: systemFont,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

type Variant = TextStyle;

export const typography: Record<string, Variant> = {
  // Large screen titles / hero numbers
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: fontWeight.bold as TextStyle['fontWeight'],
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  title1: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.bold as TextStyle['fontWeight'],
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  title2: {
    fontFamily: fontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeight.semibold as TextStyle['fontWeight'],
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  title3: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeight.semibold as TextStyle['fontWeight'],
    color: colors.textPrimary,
  },
  headline: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeight.semibold as TextStyle['fontWeight'],
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: fontWeight.regular as TextStyle['fontWeight'],
    color: colors.textPrimary,
  },
  bodySecondary: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: fontWeight.regular as TextStyle['fontWeight'],
    color: colors.textSecondary,
  },
  callout: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: fontWeight.medium as TextStyle['fontWeight'],
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: fontWeight.regular as TextStyle['fontWeight'],
    color: colors.textSecondary,
  },
  caption2: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: fontWeight.regular as TextStyle['fontWeight'],
    color: colors.textMuted,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.semibold as TextStyle['fontWeight'],
    color: colors.textSecondary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeight.semibold as TextStyle['fontWeight'],
    color: colors.textPrimary,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
};

export type TypographyVariant = keyof typeof typography;
