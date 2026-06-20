import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { formatDate, plural } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { Batch, BatchStatsSummary } from '@/types';

import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { Text } from './Text';

interface BatchCardProps {
  batch: Batch;
  stats: BatchStatsSummary;
  onPress?: () => void;
}

export function BatchCard({ batch, stats, onPress }: BatchCardProps) {
  const done = stats.ready + stats.exported;
  const progress = stats.total > 0 ? done / stats.total : 0;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text variant="title3" numberOfLines={1}>
            {batch.name}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {formatDate(batch.created_at)} · {batch.default_listing_type}
          </Text>
        </View>
        <View style={styles.typeChip}>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat value={stats.total} label="Listings" />
        <Stat value={stats.needsReview} label="Review" color={colors.warning} />
        <Stat value={stats.ready} label="Ready" color={colors.success} />
        <Stat value={stats.exported} label="Exported" color={colors.primary} />
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar progress={progress} />
        <Text variant="caption2" color={colors.textMuted} style={styles.progressLabel}>
          {plural(done, 'listing')} ready/exported · {plural(stats.photoCount, 'photo')}
        </Text>
      </View>
    </Card>
  );
}

function Stat({ value, label, color = colors.textPrimary }: { value: number; label: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="title3" color={color}>
        {value}
      </Text>
      <Text variant="caption2" color={colors.textMuted}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleWrap: { flex: 1, gap: 2 },
  typeChip: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  progressWrap: { gap: spacing.sm },
  progressLabel: {},
});
