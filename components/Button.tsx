import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { colors, gradients, radius, shadows, spacing, typography } from '@/theme';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { bg: string; fg: string; border?: string; glow?: boolean }
> = {
  primary: { bg: colors.primary, fg: colors.onPrimary, glow: true },
  secondary: { bg: colors.surfaceElevated, fg: colors.textPrimary, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.textSecondary },
  danger: { bg: colors.errorSoft, fg: colors.error, border: colors.error },
  success: { bg: colors.success, fg: colors.textInverse },
};

const SIZE_STYLES: Record<ButtonSize, { height: number; px: number; font: number }> = {
  sm: { height: 38, px: spacing.md, font: 14 },
  md: { height: 52, px: spacing.lg, font: 16 },
  lg: { height: 60, px: spacing.xl, font: 17 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled,
  loading,
  fullWidth = true,
  style,
}: ButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isPrimary ? 'transparent' : v.bg,
          height: s.height,
          paddingHorizontal: s.px,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        isPrimary && !isDisabled ? shadows.glow : null,
        style,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={gradients.brand}
          start={gradients.diagonal.start}
          end={gradients.diagonal.end}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
        />
      ) : null}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={v.fg} size="small" />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={s.font + 3} color={v.fg} /> : null}
            <Text
              style={[typography.button, { color: v.fg, fontSize: s.font }]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {iconRight ? <Ionicons name={iconRight} size={s.font + 3} color={v.fg} /> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
