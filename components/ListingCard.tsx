import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { coverPhoto } from '@/lib/photo';
import { colors, radius, spacing } from '@/theme';
import type { Listing, ListingPhoto } from '@/types';

import { Card } from './Card';
import { PhotoThumbnail } from './PhotoThumbnail';
import { StatusBadge } from './StatusBadge';
import { Text } from './Text';

interface ListingCardProps {
  listing: Listing;
  photos: ListingPhoto[];
  missingCount?: number;
  onPress?: () => void;
  onMarkReady?: () => void;
  onFlag?: () => void;
  showActions?: boolean;
}

export function ListingCard({
  listing,
  photos,
  missingCount = 0,
  onPress,
  onMarkReady,
  onFlag,
  showActions = true,
}: ListingCardProps) {
  const cover = coverPhoto(photos);
  const title = listing.title?.trim() || listing.card_name?.trim() || 'Untitled listing';
  const canMarkReady = listing.review_status !== 'Ready' && listing.review_status !== 'Exported';

  return (
    <Card style={styles.card} onPress={onPress} padded={false}>
      <View style={styles.row}>
        <PhotoThumbnail photo={cover} size={72} />

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text variant="caption2" color={colors.textMuted}>
              {listing.sku || 'NO-SKU'}
            </Text>
            <StatusBadge status={listing.review_status} />
          </View>

          <Text variant="callout" numberOfLines={2} style={styles.title}>
            {title}
          </Text>

          <View style={styles.metaRow}>
            <Meta icon="pricetag-outline" label={listing.listing_type === 'Card Lot' ? 'Lot' : 'Single'} />
            <Meta
              icon={listing.sale_type === 'Auction' ? 'hammer-outline' : 'cart-outline'}
              label={listing.sale_type === 'Auction' ? 'Auction' : 'BIN'}
            />
            <Meta icon="images-outline" label={`${photos.length}`} />
            {missingCount > 0 ? (
              <Meta icon="alert-circle-outline" label={`${missingCount} missing`} color={colors.warning} />
            ) : null}
          </View>

          {listing.ai_confidence_summary ? (
            <Text variant="caption2" color={colors.textMuted} numberOfLines={1} style={styles.conf}>
              {listing.ai_confidence_summary}
            </Text>
          ) : null}
        </View>
      </View>

      {showActions ? (
        <View style={styles.actions}>
          <QuickAction icon="create-outline" label="Review" onPress={onPress} />
          {canMarkReady ? (
            <QuickAction
              icon="checkmark-circle-outline"
              label="Mark Ready"
              color={colors.success}
              onPress={onMarkReady}
            />
          ) : null}
          <QuickAction icon="flag-outline" label="Flag" color={colors.warning} onPress={onFlag} />
        </View>
      ) : null}
    </Card>
  );
}

function Meta({
  icon,
  label,
  color = colors.textSecondary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={color} />
      <Text variant="caption2" color={color}>
        {label}
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  color = colors.textSecondary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={15} color={color} />
      <Text variant="caption" color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  body: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  conf: { marginTop: 2 },
  actions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.md,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
});
