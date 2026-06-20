import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Card } from './Card';
import { Text } from './Text';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Optional badge count (e.g. issues) shown in the header. */
  badgeCount?: number;
  badgeColor?: string;
}

/** Grouped section of form fields inside an elevated card with a header. */
export function FormSection({
  title,
  subtitle,
  icon,
  children,
  collapsible = false,
  defaultCollapsed = false,
  badgeCount,
  badgeColor = colors.warning,
}: FormSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <Card style={styles.card}>
      <Pressable
        disabled={!collapsible}
        onPress={() => setCollapsed((c) => !c)}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          {icon ? (
            <View style={styles.iconWrap}>
              <Ionicons name={icon} size={16} color={colors.primary} />
            </View>
          ) : null}
          <View style={styles.headerText}>
            <Text variant="headline">{title}</Text>
            {subtitle ? (
              <Text variant="caption" color={colors.textMuted}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.headerRight}>
          {badgeCount ? (
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              <Text variant="caption2" color={colors.textInverse} style={styles.badgeText}>
                {badgeCount}
              </Text>
            </View>
          ) : null}
          {collapsible ? (
            <Ionicons
              name={collapsed ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={colors.textMuted}
            />
          ) : null}
        </View>
      </Pressable>

      {!collapsed ? <View style={styles.body}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontWeight: '700' },
  body: { marginTop: spacing.lg },
});
