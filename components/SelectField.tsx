import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import type { ConfidenceLevel } from '@/types';

import { ConfidenceBadge } from './ConfidenceBadge';
import { Text } from './Text';

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

interface SelectFieldProps<T extends string = string> {
  label?: string;
  value: T | null | undefined;
  options: SelectOption<T>[] | readonly T[];
  onChange: (value: T) => void;
  placeholder?: string;
  confidence?: ConfidenceLevel;
  /** Render small option set inline as segmented chips (<= 3 options). */
  inline?: boolean;
  required?: boolean;
  containerStyle?: ViewStyle;
}

function normalize<T extends string>(
  options: SelectOption<T>[] | readonly T[],
): SelectOption<T>[] {
  return (options as Array<SelectOption<T> | T>).map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o,
  );
}

/**
 * Select field. Small sets (or inline=true) render as segmented chips; larger
 * sets open a modal picker. Supports an AI confidence badge by the label.
 */
export function SelectField<T extends string = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  confidence,
  inline,
  required,
  containerStyle,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const opts = normalize(options);
  const selected = opts.find((o) => o.value === value);
  const useInline = inline ?? opts.length <= 3;
  const lowConfidence = confidence === 'Low' || confidence === 'Missing';

  const Label = label ? (
    <View style={styles.labelRow}>
      <Text variant="label">
        {label}
        {required ? ' *' : ''}
      </Text>
      {confidence ? <ConfidenceBadge level={confidence} compact /> : null}
    </View>
  ) : null;

  if (useInline) {
    return (
      <View style={[styles.container, containerStyle]}>
        {Label}
        <View style={styles.segments}>
          {opts.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => onChange(o.value)}
                style={[
                  styles.segment,
                  {
                    backgroundColor: active ? colors.accentSoft : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  variant="callout"
                  color={active ? colors.primary : colors.textSecondary}
                  numberOfLines={1}
                >
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {Label}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          { borderColor: lowConfidence ? colors.warning : colors.border },
        ]}
      >
        <Text
          variant="body"
          color={selected ? colors.textPrimary : colors.textMuted}
          numberOfLines={1}
          style={styles.triggerText}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {label ? (
              <Text variant="title3" style={styles.sheetTitle}>
                {label}
              </Text>
            ) : null}
            <ScrollView style={styles.sheetScroll} bounces={false}>
              {opts.map((o) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={styles.option}
                  >
                    <Text
                      variant="body"
                      color={active ? colors.primary : colors.textPrimary}
                    >
                      {o.label}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  segments: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  segment: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 72,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  triggerText: { flex: 1, marginRight: spacing.sm },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: { marginBottom: spacing.md },
  sheetScroll: {},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
