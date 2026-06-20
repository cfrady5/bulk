import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { confidenceColors, radius } from '@/theme';
import type { ConfidenceLevel } from '@/types';

import { Text } from './Text';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  /** Compact dot-only mode for tight rows. */
  compact?: boolean;
  style?: ViewStyle;
}

const ICONS: Record<ConfidenceLevel, keyof typeof Ionicons.glyphMap> = {
  High: 'checkmark-circle',
  Medium: 'alert-circle',
  Low: 'warning',
  Missing: 'help-circle',
};

/**
 * Badge shown beside AI-filled fields. Low/Missing levels are visually distinct
 * so they never look "final" — driving the user to review them.
 */
export function ConfidenceBadge({ level, compact, style }: ConfidenceBadgeProps) {
  const c = confidenceColors[level];

  if (compact) {
    return (
      <View style={[styles.dotWrap, { backgroundColor: c.bg, borderColor: c.border }, style]}>
        <Ionicons name={ICONS[level]} size={11} color={c.fg} />
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }, style]}>
      <Ionicons name={ICONS[level]} size={12} color={c.fg} />
      <Text variant="caption2" color={c.fg} style={styles.text}>
        {level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dotWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontWeight: '600' },
});
