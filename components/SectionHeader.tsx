import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from './Text';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional right-aligned action label. */
  actionLabel?: string;
  onActionPress?: () => void;
  /** Optional count chip after the title. */
  count?: number;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  count,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text variant="label">{title}</Text>
          {typeof count === 'number' ? (
            <View style={styles.countChip}>
              <Text variant="caption2" color={colors.textSecondary}>
                {count}
              </Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text variant="caption" color={colors.textMuted} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text variant="callout" color={colors.primary}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  left: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  countChip: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { marginTop: 2 },
});
