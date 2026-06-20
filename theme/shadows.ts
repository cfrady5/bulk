import { Platform, ViewStyle } from 'react-native';

/**
 * Soft elevation. On dark UIs shadows read as subtle depth rather than drop
 * shadows; we keep them low-opacity. Android uses `elevation`.
 */

const make = (elevation: number, opacity: number, radius: number, height: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
    default: {},
  }) as ViewStyle;

export const shadows = {
  none: {} as ViewStyle,
  sm: make(2, 0.18, 6, 2),
  md: make(6, 0.28, 14, 6),
  lg: make(12, 0.34, 24, 12),
  // Accent glow for the primary capture button / hero CTA.
  glow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#6E8BFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }) as ViewStyle,
} as const;

export type ShadowVariant = keyof typeof shadows;
