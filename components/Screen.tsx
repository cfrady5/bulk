import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Remove horizontal padding (e.g. for the camera screen). */
  noPadding?: boolean;
  edges?: Edge[];
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Sticky footer rendered outside the scroll area. */
  footer?: React.ReactNode;
  backgroundColor?: string;
}

/**
 * Base screen wrapper: safe area, dark status bar, consistent padding, optional
 * scrolling, and keyboard avoidance for form screens.
 */
export function Screen({
  children,
  scroll = true,
  noPadding = false,
  edges = ['top', 'left', 'right'],
  contentContainerStyle,
  style,
  refreshControl,
  footer,
  backgroundColor = colors.background,
}: ScreenProps) {
  const padding = noPadding ? {} : { paddingHorizontal: layout.screenPaddingH };

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        padding,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor }, style]} edges={edges}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingVertical: layout.screenPaddingV,
    paddingBottom: 48,
  },
  footer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
});
