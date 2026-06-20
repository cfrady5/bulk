import { Image } from 'expo-image';
import React from 'react';
import { View, ViewStyle } from 'react-native';

import { shadows } from '@/theme';

// Official full logo lockup (icon + "bulk" wordmark), transparent on dark.
const LOCKUP = require('@/assets/brand/logo-lockup.png');
const RATIO = 1600 / 624; // ≈ 2.56 (processed lockup aspect)

interface BrandLockupProps {
  /** Width of the lockup (height derives from the lockup aspect ratio). */
  width?: number;
  /** Soft violet brand glow behind the lockup. */
  glow?: boolean;
  style?: ViewStyle;
}

/**
 * Full bulk logo lockup for larger brand moments: splash, home header/empty
 * state, README, welcome. Transparent art — sits directly on the dark UI.
 */
export function BrandLockup({ width = 220, glow = false, style }: BrandLockupProps) {
  const height = width / RATIO;
  return (
    <View style={[{ width, height }, glow ? shadows.glow : null, style]}>
      <Image source={LOCKUP} style={{ width, height }} contentFit="contain" />
    </View>
  );
}

export { LOCKUP };
