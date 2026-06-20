import React from 'react';
import { StyleSheet, TextInput, View, ViewStyle } from 'react-native';

import { parsePrice } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';
import type { ConfidenceLevel } from '@/types';

import { ConfidenceBadge } from './ConfidenceBadge';
import { Text } from './Text';

interface PriceFieldProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  helper?: string;
  error?: string;
  confidence?: ConfidenceLevel;
  required?: boolean;
  containerStyle?: ViewStyle;
}

/**
 * Numeric price input with a leading "$". Stores a number | null, parsing user
 * input leniently. Price fields are treated as user-confirmed before Mark Ready.
 */
export function PriceField({
  label,
  value,
  onChange,
  placeholder = '0.00',
  helper,
  error,
  confidence,
  required,
  containerStyle,
}: PriceFieldProps) {
  const [text, setText] = React.useState(value != null ? String(value) : '');

  // Keep local text in sync when the value changes externally (e.g. AI fill).
  React.useEffect(() => {
    const incoming = value != null ? String(value) : '';
    setText((prev) => (parsePrice(prev) === value ? prev : incoming));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (t: string) => {
    setText(t);
    onChange(parsePrice(t));
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text variant="label">
            {label}
            {required ? ' *' : ''}
          </Text>
          {confidence ? <ConfidenceBadge level={confidence} compact /> : null}
        </View>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          { borderColor: error ? colors.error : colors.border },
        ]}
      >
        <Text variant="body" color={colors.textMuted} style={styles.dollar}>
          $
        </Text>
        <TextInput
          value={text}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>
      {error ? (
        <Text variant="caption" color={colors.error} style={styles.helper}>
          {error}
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
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  dollar: { marginRight: spacing.xs },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  helper: { marginTop: spacing.xs },
});
