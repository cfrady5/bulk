import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import type { BatchStatsSummary } from '@/types';

import { Card } from './Card';
import { Text } from './Text';

interface BatchStatsProps {
  stats: BatchStatsSummary;
  /** Show as a compact 2x... grid of stat tiles. */
  title?: string;
}

interface Tile {
  key: keyof BatchStatsSummary;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const TILES: Tile[] = [
  { key: 'total', label: 'Total', icon: 'albums-outline', color: colors.textPrimary },
  { key: 'draft', label: 'Draft', icon: 'document-outline', color: colors.textSecondary },
  { key: 'needsReview', label: 'Needs Review', icon: 'alert-circle-outline', color: colors.warning },
  { key: 'ready', label: 'Ready', icon: 'checkmark-circle-outline', color: colors.success },
  { key: 'exported', label: 'Exported', icon: 'cloud-upload-outline', color: colors.primary },
  { key: 'flagged', label: 'Flagged', icon: 'flag-outline', color: colors.error },
];

/** Grid of headline stats for the dashboard / batch detail. */
export function BatchStats({ stats, title }: BatchStatsProps) {
  return (
    <View>
      {title ? (
        <Text variant="label" style={styles.title}>
          {title}
        </Text>
      ) : null}
      <View style={styles.grid}>
        {TILES.map((tile) => (
          <Card key={tile.key} style={styles.tile} elevated>
            <View style={styles.tileHeader}>
              <Ionicons name={tile.icon} size={16} color={tile.color} />
            </View>
            <Text variant="title2" color={tile.color}>
              {stats[tile.key]}
            </Text>
            <Text variant="caption2" color={colors.textMuted}>
              {tile.label}
            </Text>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47%',
    flexGrow: 1,
    gap: 2,
    borderRadius: radius.lg,
  },
  tileHeader: { marginBottom: spacing.xs },
});
