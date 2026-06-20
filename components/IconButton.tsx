import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { colors, layout, radius } from '@/theme';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  background?: string;
  disabled?: boolean;
  bordered?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/** Round/square icon-only button used in headers and toolbars. */
export function IconButton({
  icon,
  onPress,
  size = 22,
  color = colors.textPrimary,
  background = colors.surfaceElevated,
  disabled,
  bordered = true,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={layout.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderWidth: bordered ? 1 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
