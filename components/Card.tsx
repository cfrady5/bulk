import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, layout, radius, shadows } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevated?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}

/** Elevated dark surface with subtle border — the base container in the app. */
export function Card({ children, onPress, elevated, padded = true, style }: CardProps) {
  const content = (
    <View
      style={[
        styles.base,
        {
          backgroundColor: elevated ? colors.cardElevated : colors.card,
          padding: padded ? layout.cardPadding : 0,
        },
        elevated ? shadows.md : shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
