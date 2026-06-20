import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, shadows } from '@/theme';

// Official app icon asset (white-background brand art shown as a rounded tile).
const APP_ICON = require('@/assets/brand/app-icon.png');

interface BrandMarkProps {
  size?: number;
  /** Round the tile like an app icon (default true). */
  rounded?: boolean;
  /** Add a soft violet brand glow behind the mark. */
  glow?: boolean;
  style?: ViewStyle;
}

/**
 * The bulk app mark (the b + stacked cards). Use anywhere an app icon is
 * needed: loading/empty states, headers, export success, etc.
 */
export function BrandMark({ size = 64, rounded = true, glow = false, style }: BrandMarkProps) {
  const r = rounded ? size * 0.235 : 0;
  return (
    <View style={[{ width: size, height: size }, glow ? shadows.glow : null, style]}>
      <Image
        source={APP_ICON}
        style={[styles.img, { width: size, height: size, borderRadius: r }]}
        contentFit="cover"
      />
      <View
        pointerEvents="none"
        style={[styles.border, { borderRadius: r }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.white },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
});

export { APP_ICON };
