import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors, gradients } from '@/theme';

import { Text } from './Text';

interface ProgressRingProps {
  /** 0..1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  /** Big centered value (e.g. "12"). */
  value?: string;
  /** Small caption under the value. */
  label?: string;
}

/** Circular progress indicator with optional centered value/label. */
export function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 8,
  color,
  trackColor = colors.surfaceElevated,
  value,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);
  const stroke = color ?? 'url(#ringGrad)';

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradients.brand[0]} />
            <Stop offset="1" stopColor={gradients.brand[2]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // Start from top.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {(value || label) && (
        <View style={styles.center}>
          {value ? <Text variant="title2">{value}</Text> : null}
          {label ? (
            <Text variant="caption2" color={colors.textMuted}>
              {label}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
