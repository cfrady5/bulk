import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

interface ProgressBarProps {
  /** 0..1 */
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 8,
  color = colors.primary,
  trackColor = colors.surfaceElevated,
  style,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }, style]}>
      <View
        style={[styles.fill, { width: `${pct}%`, backgroundColor: color, height }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: { borderRadius: radius.pill },
});
