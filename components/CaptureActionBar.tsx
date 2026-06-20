import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

interface CaptureActionBarProps {
  hasFront: boolean;
  hasBack: boolean;
  photoCount: number;
  buildingLot: boolean;
  committing: boolean;

  onCaptureFront: () => void;
  onCaptureBack: () => void;
  onAddImperfection: () => void;
  onRetakeFront: () => void;
  onRetakeBack: () => void;
  onNextListing: () => void;
  onAddToLot: () => void;
  onFinishLot: () => void;
  onFlag: () => void;
}

/**
 * Large, thumb-friendly capture controls. The "next needed" capture is
 * highlighted as primary so the workflow is obvious and fast.
 */
export function CaptureActionBar(props: CaptureActionBarProps) {
  const {
    hasFront,
    hasBack,
    photoCount,
    buildingLot,
    committing,
    onCaptureFront,
    onCaptureBack,
    onAddImperfection,
    onRetakeFront,
    onRetakeBack,
    onNextListing,
    onAddToLot,
    onFinishLot,
    onFlag,
  } = props;

  const nextRole: 'front' | 'back' | 'detail' = !hasFront ? 'front' : !hasBack ? 'back' : 'detail';
  const bothCaptured = hasFront && hasBack;

  return (
    <View style={styles.container}>
      {/* Primary capture button — context aware */}
      {nextRole === 'front' ? (
        <CaptureButton label="Capture Front" icon="camera" onPress={onCaptureFront} loading={committing} />
      ) : nextRole === 'back' ? (
        <CaptureButton label="Capture Back" icon="camera-reverse" onPress={onCaptureBack} loading={committing} />
      ) : (
        <CaptureButton label="Capture Detail Photo" icon="add-circle" onPress={onAddImperfection} loading={committing} />
      )}

      {/* Advance actions */}
      <View style={styles.row}>
        <Button
          label="Next Listing"
          icon="arrow-forward-circle"
          variant={bothCaptured ? 'success' : 'secondary'}
          onPress={onNextListing}
          disabled={committing || photoCount === 0}
          style={styles.flex}
        />
        {buildingLot ? (
          <Button
            label="Finish Lot"
            icon="checkmark-done"
            variant="primary"
            onPress={onFinishLot}
            disabled={committing}
            style={styles.flex}
          />
        ) : (
          <Button
            label="Add to Lot"
            icon="layers"
            variant="secondary"
            onPress={onAddToLot}
            disabled={committing || photoCount === 0}
            style={styles.flex}
          />
        )}
      </View>

      {buildingLot ? (
        <Button
          label="Add to Lot"
          icon="layers-outline"
          variant="ghost"
          size="sm"
          onPress={onAddToLot}
          disabled={committing || photoCount === 0}
        />
      ) : null}

      {/* Retake + flag mini actions */}
      <View style={styles.miniRow}>
        <MiniAction label="Retake Front" icon="refresh" disabled={!hasFront || committing} onPress={onRetakeFront} />
        <MiniAction label="Retake Back" icon="refresh" disabled={!hasBack || committing} onPress={onRetakeBack} />
        <MiniAction label="Add Detail" icon="add" disabled={committing} onPress={onAddImperfection} />
        <MiniAction label="Flag" icon="flag" color={colors.warning} disabled={committing} onPress={onFlag} />
      </View>
    </View>
  );
}

function CaptureButton({
  label,
  icon,
  onPress,
  loading,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.captureBtn, shadows.glow, { opacity: pressed ? 0.9 : 1 }]}
    >
      <Ionicons name={icon} size={26} color={colors.onPrimary} />
      <Text variant="title3" color={colors.onPrimary}>
        {label}
      </Text>
    </Pressable>
  );
}

function MiniAction({
  label,
  icon,
  onPress,
  disabled,
  color = colors.textSecondary,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.mini, { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text variant="caption2" color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    height: 66,
    borderRadius: radius.lg,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  miniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  mini: { flex: 1, alignItems: 'center', gap: 4 },
});
