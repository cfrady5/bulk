import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors, shadows } from '@/theme';

// Official app icon (transparent 3D mark: glossy b + violet→blue stacked cards).
const APP_ICON = require('@/assets/brand/app-icon.png');

interface BrandMarkProps {
  size?: number;
  /** Soft violet brand glow behind the mark. */
  glow?: boolean;
  /** Render inside a dark rounded "app icon" tile (for app-icon references). */
  tile?: boolean;
  style?: ViewStyle;
}

/**
 * The bulk app mark. Transparent art that sits directly on the dark UI — use
 * anywhere an app icon is needed (headers, loading/empty states, export
 * success). Pass `tile` to show it as a rounded app-icon tile.
 */
export function BrandMark({ size = 64, glow = false, tile = false, style }: BrandMarkProps) {
  if (tile) {
    const r = size * 0.235;
    const pad = size * 0.14;
    return (
      <View
        style={[
          styles.tile,
          { width: size, height: size, borderRadius: r },
          glow ? shadows.glow : null,
          style,
        ]}
      >
        <Image
          source={APP_ICON}
          style={{ width: size - pad * 2, height: size - pad * 2 }}
          contentFit="contain"
        />
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size }, glow ? shadows.glow : null, style]}>
      <Image source={APP_ICON} style={{ width: size, height: size }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export { APP_ICON };
