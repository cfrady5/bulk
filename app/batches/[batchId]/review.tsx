import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  EmptyState,
  ListingCard,
  ScreenHeader,
  Text,
} from '@/components';
import { getMissingFields } from '@/services/validation/getMissingFields';
import { validateEbayListing } from '@/services/validation/validateEbayListing';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';
import type { Listing, ListingPhoto, ReviewStatus } from '@/types';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Filter = 'All' | ReviewStatus;
const FILTERS: Filter[] = ['All', 'Needs Review', 'Draft', 'Ready', 'Flagged', 'Exported'];

export default function ReviewQueueScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => (batchId ? s.batches[batchId] : undefined));
  const listings = useAppStore((s) => s.listings);
  const photos = useAppStore((s) => s.photos);
  const fieldConfidence = useAppStore((s) => s.fieldConfidence);
  const setReviewStatus = useAppStore((s) => s.setReviewStatus);

  const [filter, setFilter] = useState<Filter>('All');

  const batchListings = useMemo(
    () =>
      Object.values(listings)
        .filter((l) => l.batch_id === batchId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [listings, batchId],
  );

  const photosByListing = useMemo(() => {
    const map: Record<string, ListingPhoto[]> = {};
    Object.values(photos)
      .filter((p) => p.batch_id === batchId)
      .forEach((p) => {
        (map[p.listing_id] ??= []).push(p);
      });
    return map;
  }, [photos, batchId]);

  const batchSkus = useMemo(() => batchListings.map((l) => l.sku), [batchListings]);

  const filtered = useMemo(
    () => (filter === 'All' ? batchListings : batchListings.filter((l) => l.review_status === filter)),
    [batchListings, filter],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      All: batchListings.length,
      'Needs Review': 0,
      Draft: 0,
      Ready: 0,
      Flagged: 0,
      Exported: 0,
    };
    batchListings.forEach((l) => {
      c[l.review_status] += 1;
    });
    return c;
  }, [batchListings]);

  function handleMarkReady(listing: Listing) {
    const listingPhotos = photosByListing[listing.id] ?? [];
    const results = validateEbayListing({
      listing,
      photos: listingPhotos,
      batchSkus,
      fieldConfidence: fieldConfidence[listing.id],
    });
    const errors = results.filter((r) => r.severity === 'error');
    if (errors.length > 0) {
      const preview = errors.slice(0, 4).map((e) => `• ${e.message}`).join('\n');
      const more = errors.length > 4 ? `\n…and ${errors.length - 4} more` : '';
      Alert.alert('Resolve errors first', `${preview}${more}`, [
        { text: 'Open', onPress: () => router.push(`/listings/${listing.id}/review`) },
        { text: 'OK', style: 'cancel' },
      ]);
      return;
    }
    setReviewStatus(listing.id, 'Ready');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Review Queue"
        subtitle={batch?.name}
        rightIcon="cloud-upload-outline"
        rightAccessibilityLabel="Export"
        onRightPress={() => router.push(`/batches/${batchId}/export`)}
      />

      {/* Filters */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        renderItem={({ item }) => {
          const active = item === filter;
          return (
            <Pressable
              onPress={() => setFilter(item)}
              style={[
                styles.chip,
                { backgroundColor: active ? colors.accentSoft : colors.surface, borderColor: active ? colors.primary : colors.border },
              ]}
            >
              <Text variant="caption" color={active ? colors.primary : colors.textSecondary}>
                {item}
              </Text>
              <View style={[styles.chipCount, { backgroundColor: active ? colors.primary : colors.surfaceElevated }]}>
                <Text variant="caption2" color={active ? colors.onPrimary : colors.textMuted}>
                  {counts[item]}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        windowSize={7}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-done-outline"
            title="Nothing here"
            message={filter === 'All' ? 'This batch has no listings yet.' : `No ${filter} listings.`}
          />
        }
        renderItem={({ item }) => {
          const listingPhotos = photosByListing[item.id] ?? [];
          const missing = getMissingFields(item, listingPhotos).count;
          return (
            <ListingCard
              listing={item}
              photos={listingPhotos}
              missingCount={missing}
              onPress={() => router.push(`/listings/${item.id}/review`)}
              onMarkReady={() => handleMarkReady(item)}
              onFlag={() => setReviewStatus(item.id, 'Flagged')}
            />
          );
        }}
      />

      {counts.Ready > 0 ? (
        <View style={styles.footer}>
          <Button
            label={`Export ${counts.Ready} Ready`}
            icon="cloud-upload-outline"
            variant="success"
            onPress={() => router.push(`/batches/${batchId}/export`)}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  filters: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.giant, paddingTop: spacing.xs },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
});
