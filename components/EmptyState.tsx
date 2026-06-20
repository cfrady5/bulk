import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({
  icon = 'albums-outline',
  title,
  message,
  ctaLabel,
  onCtaPress,
  ctaIcon,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text variant="title3" center>
        {title}
      </Text>
      {message ? (
        <Text variant="bodySecondary" center style={styles.message}>
          {message}
        </Text>
      ) : null}
      {ctaLabel ? (
        <View style={styles.cta}>
          <Button label={ctaLabel} onPress={onCtaPress} icon={ctaIcon} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.giant,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  message: { marginTop: 4, maxWidth: 280 },
  cta: { marginTop: spacing.lg },
});
