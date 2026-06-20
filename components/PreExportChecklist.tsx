import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Card } from './Card';
import { Text } from './Text';

export interface ChecklistItem {
  label: string;
  passed: boolean;
  detail?: string;
}

interface PreExportChecklistProps {
  items: ChecklistItem[];
}

/** Visual pre-export checklist with pass/fail rows. */
export function PreExportChecklist({ items }: PreExportChecklistProps) {
  return (
    <Card padded={false}>
      {items.map((item, i) => (
        <View
          key={item.label}
          style={[styles.row, i < items.length - 1 ? styles.divider : null]}
        >
          <View
            style={[
              styles.check,
              {
                backgroundColor: item.passed ? colors.successSoft : colors.warningSoft,
                borderColor: item.passed ? colors.success : colors.warning,
              },
            ]}
          >
            <Ionicons
              name={item.passed ? 'checkmark' : 'remove'}
              size={14}
              color={item.passed ? colors.success : colors.warning}
            />
          </View>
          <View style={styles.text}>
            <Text variant="callout" color={item.passed ? colors.textPrimary : colors.textSecondary}>
              {item.label}
            </Text>
            {item.detail ? (
              <Text variant="caption2" color={colors.textMuted}>
                {item.detail}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
});
