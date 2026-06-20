import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { ConfidenceLevel } from '@/types';

import { ConfidenceBadge } from './ConfidenceBadge';
import { Text } from './Text';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  helper?: string;
  error?: string;
  /** AI confidence badge shown next to the label. */
  confidence?: ConfidenceLevel;
  /** Show a live character counter against this max. */
  maxCount?: number;
  required?: boolean;
  containerStyle?: ViewStyle;
}

/**
 * Themed text input with label, helper/error text, optional AI confidence
 * badge, and an optional character counter (used for the 80-char title rule).
 */
export function TextField({
  label,
  value,
  onChangeText,
  helper,
  error,
  confidence,
  maxCount,
  required,
  multiline,
  containerStyle,
  ...rest
}: TextFieldProps) {
  const overCount = maxCount != null && value.length > maxCount;
  const showError = error || (overCount ? `Over ${maxCount} characters` : undefined);
  const lowConfidence = confidence === 'Low' || confidence === 'Missing';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <View style={styles.labelLeft}>
            <Text variant="label">
              {label}
              {required ? ' *' : ''}
            </Text>
            {confidence ? <ConfidenceBadge level={confidence} compact /> : null}
          </View>
          {maxCount != null ? (
            <Text variant="caption2" color={overCount ? colors.error : colors.textMuted}>
              {value.length}/{maxCount}
            </Text>
          ) : null}
        </View>
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          {
            borderColor: showError
              ? colors.error
              : lowConfidence
                ? colors.warning
                : colors.border,
          },
        ]}
        {...rest}
      />

      {showError ? (
        <Text variant="caption" color={colors.error} style={styles.helper}>
          {showError}
        </Text>
      ) : helper ? (
        <Text variant="caption" color={colors.textMuted} style={styles.helper}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  labelLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.md },
  helper: { marginTop: spacing.xs },
});
