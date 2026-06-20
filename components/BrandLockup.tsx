import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, shadows } from '@/theme';

// Official full logo lockup (icon + "bulk" wordmark), 3:1, white background.
const LOCKUP = require('@/assets/brand/logo-lockup.png');
const RATIO = 2172 / 724; // ≈ 3.0

interface BrandLockupProps {
  /** Width of the lockup (height derives from the 3:1 ratio). */
  width?: number;
  /**
   * Render on a premium rounded light plate (default true). The brand art has
   * a light background, so the plate reads as an intentional "logo card" on the
   * dark UI. Set false to render the raw art.
   */
  plate?: boolean;
  glow?: boolean;
  style?: ViewStyle;
}

/**
 * Full bulk logo lockup for larger brand moments: splash, home header, README,
 * welcome/empty states.
 */
export function BrandLockup({ width = 220, plate = true, glow = false, style }: BrandLockupProps) {
  const logoH = width / RATIO;

  if (!plate) {
    return (
      <View style={[{ width, height: logoH }, style]}>
        <Image source={LOCKUP} style={{ width, height: logoH }} contentFit="contain" />
      </View>
    );
  }

  const padH = width * 0.08;
  const padV = logoH * 0.34;
  const plateW = width + padH * 2;
  const plateH = logoH + padV * 2;

  return (
    <View
      style={[
        styles.plate,
        { width: plateW, height: plateH, borderRadius: plateH * 0.32 },
        shadows.lg,
        glow ? shadows.glow : null,
        style,
      ]}
    >
      <Image source={LOCKUP} style={{ width, height: logoH }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});

export { LOCKUP };
