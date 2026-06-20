import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { radius, severityColors, statusColors } from '@/theme';
import type { ReviewStatus, ValidationSeverity } from '@/types';

import { Text } from './Text';

interface StatusBadgeProps {
  status: ReviewStatus;
  style?: ViewStyle;
}

/** Pill chip that colors itself based on a listing's review status. */
export function StatusBadge({ status, style }: StatusBadgeProps) {
  const c = statusColors[status];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: c.fg }]} />
      <Text variant="caption2" color={c.fg} style={styles.text}>
        {status}
      </Text>
    </View>
  );
}

interface SeverityBadgeProps {
  severity: ValidationSeverity;
  count?: number;
}

/** Small chip for error/warning/info counts. */
export function SeverityBadge({ severity, count }: SeverityBadgeProps) {
  const c = severityColors[severity];
  const label = severity.charAt(0).toUpperCase() + severity.slice(1);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text variant="caption2" color={c.fg} style={styles.text}>
        {count != null ? `${count} ` : ''}
        {label}
        {count != null && count !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontWeight: '600' },
});
