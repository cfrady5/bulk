import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { BrandMark } from './BrandMark';
import { Text } from './Text';

interface LoadingStateProps {
  label?: string;
  inline?: boolean;
  /** Show the bulk app mark above the spinner (for full-screen loads). */
  brand?: boolean;
}

export function LoadingState({ label = 'Loading…', inline, brand }: LoadingStateProps) {
  return (
    <View style={[styles.container, inline ? styles.inline : null]}>
      {brand && !inline ? <BrandMark size={76} glow style={styles.mark} /> : null}
      <ActivityIndicator color={colors.primary} size={inline ? 'small' : 'large'} />
      {label ? (
        <Text variant="bodySecondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

/** Shimmer placeholder block for skeleton loading states. */
export function SkeletonBlock({
  height = 16,
  width = '100%',
  style,
}: {
  height?: number;
  width?: number | `${number}%` | 'auto';
  style?: object;
}) {
  return (
    <View
      style={[
        { height, width, backgroundColor: colors.shimmer, borderRadius: radius.sm },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
    gap: spacing.md,
  },
  inline: { paddingVertical: spacing.lg, flexDirection: 'row' },
  label: {},
  mark: { marginBottom: spacing.sm },
});
