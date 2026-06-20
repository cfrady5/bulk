import React from 'react';
import { StyleSheet, Switch, View, ViewStyle } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from './Text';

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  helper?: string;
  containerStyle?: ViewStyle;
}

/** Labeled switch row used for boolean settings (e.g. Accept Offers). */
export function ToggleField({ label, value, onChange, helper, containerStyle }: ToggleFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.text}>
        <Text variant="body">{label}</Text>
        {helper ? (
          <Text variant="caption" color={colors.textMuted} style={styles.helper}>
            {helper}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceElevated, true: colors.accentMuted }}
        thumbColor={value ? colors.primary : colors.textMuted}
        ios_backgroundColor={colors.surfaceElevated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  text: { flex: 1 },
  helper: { marginTop: 2 },
});
