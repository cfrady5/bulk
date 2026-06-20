import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BatchCard,
  BatchStats,
  BrandLockup,
  BrandMark,
  Button,
  Card,
  EmptyState,
  Screen,
  SectionHeader,
  Text,
} from '@/components';
import { plural } from '@/lib/format';
import { computeBatchStats } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme';
import { APP_CONFIG } from '@/constants/config';

export default function HomeScreen() {
  const router = useRouter();
  const batches = useAppStore((s) => s.batches);
  const listings = useAppStore((s) => s.listings);
  const photos = useAppStore((s) => s.photos);

  const batchList = useMemo(
    () =>
      Object.values(batches).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [batches],
  );

  const allListings = useMemo(() => Object.values(listings), [listings]);
  const allPhotos = useMemo(() => Object.values(photos), [photos]);
  const stats = useMemo(() => computeBatchStats(allListings, allPhotos), [allListings, allPhotos]);

  const isEmpty = batchList.length === 0;

  return (
    <Screen edges={['top', 'left', 'right']}>
      {/* Brand header */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <BrandMark size={42} glow />
          <View>
            <Text variant="title2">bulk</Text>
            <Text variant="caption" color={colors.textMuted}>
              {plural(batchList.length, 'batch', 'batches')} ·{' '}
              {plural(allListings.length, 'listing')}
            </Text>
          </View>
        </View>
      </View>

      {isEmpty ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyBrand}>
            <BrandLockup width={210} glow />
          </View>
          <EmptyState
            icon="camera-outline"
            title="List your cards in bulk."
            message="Create your first batch, rapidly photograph your cards, and let AI draft eBay-ready listings."
            ctaLabel="Create your first batch"
            ctaIcon="add"
            onCtaPress={() => router.push('/batches/new')}
          />
        </Card>
      ) : (
        <>
          <Button
            label="New Batch"
            icon="add"
            onPress={() => router.push('/batches/new')}
            style={styles.newBtn}
          />

          <SectionHeader title="Overview" />
          <BatchStats stats={stats} />

          <SectionHeader title="Recent Batches" count={batchList.length} />
          {batchList.map((batch) => {
            const batchListings = allListings.filter((l) => l.batch_id === batch.id);
            const batchPhotos = allPhotos.filter((p) => p.batch_id === batch.id);
            const batchStats = computeBatchStats(batchListings, batchPhotos);
            return (
              <BatchCard
                key={batch.id}
                batch={batch}
                stats={batchStats}
                onPress={() => router.push(`/batches/${batch.id}`)}
              />
            );
          })}

          <Text variant="caption2" color={colors.textMuted} center style={styles.footerNote}>
            {APP_CONFIG.appName} · Export-ready CSVs for eBay Seller Hub
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emptyCard: { marginTop: spacing.xl },
  emptyBrand: { alignItems: 'center', paddingTop: spacing.lg },
  newBtn: { marginBottom: spacing.sm },
  footerNote: { marginTop: spacing.xxl },
});
