import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BatchStats,
  Button,
  Card,
  EmptyState,
  ListingCard,
  Screen,
  ScreenHeader,
  SectionHeader,
  SeverityBadge,
  Text,
} from '@/components';
import { formatDate, plural } from '@/lib/format';
import { validateBatchForExport } from '@/services/validation/validateBatchForExport';
import { computeBatchStats, groupByStatus } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme';
import { REVIEW_STATUSES, type ReviewStatus } from '@/types';

export default function BatchDetailScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const router = useRouter();

  const batch = useAppStore((s) => (batchId ? s.batches[batchId] : undefined));
  const listings = useAppStore((s) => s.listings);
  const photos = useAppStore((s) => s.photos);

  const batchListings = useMemo(
    () =>
      Object.values(listings)
        .filter((l) => l.batch_id === batchId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [listings, batchId],
  );
  const batchPhotos = useMemo(
    () => Object.values(photos).filter((p) => p.batch_id === batchId),
    [photos, batchId],
  );
  const photosByListing = useMemo(() => {
    const map: Record<string, typeof batchPhotos> = {};
    batchPhotos.forEach((p) => {
      (map[p.listing_id] ??= []).push(p);
    });
    return map;
  }, [batchPhotos]);

  const stats = useMemo(
    () => computeBatchStats(batchListings, batchPhotos),
    [batchListings, batchPhotos],
  );
  const groups = useMemo(() => groupByStatus(batchListings), [batchListings]);

  const validation = useMemo(
    () =>
      validateBatchForExport({
        batchId: batchId ?? '',
        listings: batchListings,
        photosByListing,
        includeStatuses: ['Ready', 'Needs Review', 'Draft', 'Flagged'],
      }),
    [batchId, batchListings, photosByListing],
  );

  if (!batch) {
    return (
      <Screen>
        <ScreenHeader title="Batch" />
        <EmptyState icon="alert-circle-outline" title="Batch not found" message="It may have been deleted." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title={batch.name}
        subtitle={`Created ${formatDate(batch.created_at)}`}
        rightIcon="cloud-upload-outline"
        rightAccessibilityLabel="Export"
        onRightPress={() => router.push(`/batches/${batch.id}/export`)}
      />

      {/* Primary actions */}
      <View style={styles.actions}>
        <Button
          label="Continue Capture"
          icon="camera"
          onPress={() => router.push(`/batches/${batch.id}/capture`)}
        />
        <View style={styles.actionRow}>
          <Button
            label="Finalize (AI)"
            icon="sparkles"
            variant="secondary"
            onPress={() => router.push(`/batches/${batch.id}/finalize`)}
            style={styles.flex}
          />
          <Button
            label="Review"
            icon="list"
            variant="secondary"
            onPress={() => router.push(`/batches/${batch.id}/review`)}
            style={styles.flex}
          />
        </View>
        <Button
          label="Export Ready Listings"
          icon="cloud-upload-outline"
          variant={stats.ready > 0 ? 'success' : 'secondary'}
          onPress={() => router.push(`/batches/${batch.id}/export`)}
        />
      </View>

      <SectionHeader title="Progress" />
      <BatchStats stats={stats} />

      {/* Validation summary */}
      <Card style={styles.validationCard}>
        <View style={styles.validationLeft}>
          <Ionicons
            name={validation.error_count > 0 ? 'warning' : 'shield-checkmark'}
            size={20}
            color={validation.error_count > 0 ? colors.warning : colors.success}
          />
          <Text variant="callout">
            {validation.error_count + validation.warning_count > 0
              ? `${plural(validation.error_count + validation.warning_count, 'issue')} to resolve`
              : 'No validation issues'}
          </Text>
        </View>
        <View style={styles.badges}>
          {validation.error_count > 0 ? (
            <SeverityBadge severity="error" count={validation.error_count} />
          ) : null}
          {validation.warning_count > 0 ? (
            <SeverityBadge severity="warning" count={validation.warning_count} />
          ) : null}
        </View>
      </Card>

      {/* Grouped listings */}
      {batchListings.length === 0 ? (
        <Card style={styles.emptyCard}>
          <EmptyState
            icon="camera-outline"
            title="No listings yet"
            message="Start capturing cards to build this batch."
            ctaLabel="Start Capture"
            ctaIcon="camera"
            onCtaPress={() => router.push(`/batches/${batch.id}/capture`)}
          />
        </Card>
      ) : (
        REVIEW_STATUSES.map((status: ReviewStatus) => {
          const items = groups[status];
          if (items.length === 0) return null;
          return (
            <View key={status}>
              <SectionHeader title={status} count={items.length} />
              {items.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  photos={photosByListing[listing.id] ?? []}
                  showActions={false}
                  onPress={() => router.push(`/listings/${listing.id}/review`)}
                />
              ))}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.md, marginBottom: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  validationCard: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  validationLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  badges: { flexDirection: 'row', gap: spacing.sm },
  emptyCard: { marginTop: spacing.xl },
});
