import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { IconButton } from './IconButton';
import { Text } from './Text';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
}

/** Consistent custom header: back button, title/subtitle, optional right action. */
export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel,
}: ScreenHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));

  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {showBack ? (
          <IconButton icon="chevron-back" onPress={handleBack} accessibilityLabel="Go back" />
        ) : null}
      </View>

      <View style={styles.titleWrap}>
        <Text variant="headline" numberOfLines={1} center>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption2" color={colors.textMuted} center numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.side, styles.right]}>
        {rightIcon ? (
          <IconButton
            icon={rightIcon}
            onPress={onRightPress}
            accessibilityLabel={rightAccessibilityLabel}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  side: { width: 44 },
  right: { alignItems: 'flex-end' },
  titleWrap: { flex: 1, alignItems: 'center' },
});
