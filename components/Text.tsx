import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

import { colors, typography, TypographyVariant } from '@/theme';

interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
  children: React.ReactNode;
}

/**
 * Themed Text. Always use this instead of RN's Text so typography + colors stay
 * consistent. `variant` selects a token from theme/typography.
 */
export function Text({
  variant = 'body',
  color,
  center,
  style,
  children,
  ...rest
}: AppTextProps) {
  const base = typography[variant] as TextStyle;
  return (
    <RNText
      style={[base, color ? { color } : null, center ? { textAlign: 'center' } : null, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
