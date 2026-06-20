import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PHOTO_ROLE_LABEL } from '@/lib/photo';
import { colors, radius, spacing } from '@/theme';
import type { PhotoRole } from '@/types';

import { Text } from './Text';

interface CameraStatusPanelProps {
  batchName: string;
  listingNumber: number;
  listingsCreated: number;
  currentRole: PhotoRole;
  hasFront: boolean;
  hasBack: boolean;
  photoCount: number;
  buildingLot: boolean;
  lotCardCount: number;
}

/**
 * Compact heads-up panel shown above the camera. Always tells the user where
 * they are: batch, listing #, current role, front/back state, counts, lot mode.
 */
export function CameraStatusPanel({
  batchName,
  listingNumber,
  listingsCreated,
  currentRole,
  hasFront,
  hasBack,
  photoCount,
  buildingLot,
  lotCardCount,
}: CameraStatusPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.topRow}>
        <View style={styles.batchWrap}>
          <Text variant="caption2" color={colors.textMuted}>
            BATCH
          </Text>
          <Text variant="callout" numberOfLines={1}>
            {batchName}
          </Text>
        </View>
        <View style={styles.roleChip}>
          <Ionicons name="camera" size={13} color={colors.primary} />
          <Text variant="caption2" color={colors.primary}>
            {PHOTO_ROLE_LABEL[currentRole]}
          </Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <Stat label={buildingLot ? 'Lot card' : 'Listing'} value={`#${listingNumber}`} />
        <PhotoFlag label="Front" on={hasFront} />
        <PhotoFlag label="Back" on={hasBack} />
        <Stat label="Photos" value={`${photoCount}`} />
        <Stat label="Saved" value={`${listingsCreated}`} />
      </View>

      {buildingLot ? (
        <View style={styles.lotBanner}>
          <Ionicons name="layers" size={14} color={colors.primary} />
          <Text variant="caption" color={colors.primary}>
            Building lot · {lotCardCount} card{lotCardCount === 1 ? '' : 's'} added
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="headline">{value}</Text>
      <Text variant="caption2" color={colors.textMuted}>
        {label}
      </Text>
    </View>
  );
}

function PhotoFlag({ label, on }: { label: string; on: boolean }) {
  return (
    <View style={styles.stat}>
      <Ionicons
        name={on ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={on ? colors.success : colors.textMuted}
      />
      <Text variant="caption2" color={on ? colors.success : colors.textMuted}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  batchWrap: { flex: 1, gap: 1 },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stat: { alignItems: 'center', gap: 2, flex: 1 },
  lotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
