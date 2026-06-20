import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, severityColors, spacing } from '@/theme';
import type { ValidationResult } from '@/types';

import { Card } from './Card';
import { Text } from './Text';

interface ValidationIssueListProps {
  results: ValidationResult[];
  emptyLabel?: string;
}

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
};

/** Renders a list of validation results, errors first. */
export function ValidationIssueList({
  results,
  emptyLabel = 'No issues found.',
}: ValidationIssueListProps) {
  if (results.length === 0) {
    return (
      <Card style={styles.empty}>
        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        <Text variant="callout" color={colors.success}>
          {emptyLabel}
        </Text>
      </Card>
    );
  }

  const order = { error: 0, warning: 1, info: 2 } as const;
  const sorted = [...results].sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <View style={styles.list}>
      {sorted.map((r) => {
        const c = severityColors[r.severity];
        return (
          <View key={r.id} style={[styles.item, { borderLeftColor: c.fg }]}>
            <View style={styles.itemHeader}>
              <Ionicons name={ICON[r.severity]} size={15} color={c.fg} />
              <Text variant="caption" color={c.fg} style={styles.field}>
                {r.field_name}
              </Text>
            </View>
            <Text variant="callout">{r.message}</Text>
            {r.suggested_fix ? (
              <Text variant="caption" color={colors.textMuted} style={styles.fix}>
                Fix: {r.suggested_fix}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  list: { gap: spacing.sm },
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  field: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
  fix: { marginTop: 2 },
});
