import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingState } from '@/components';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme';

/**
 * Root layout: providers + a hydration gate so we never render screens before
 * the persisted store has rehydrated (avoids a flash of empty state).
 */
export default function RootLayout() {
  const hydrated = useAppStore((s) => s.hydrated);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {hydrated ? (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="batches/new" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="batches/[batchId]/index" />
            <Stack.Screen
              name="batches/[batchId]/capture"
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            <Stack.Screen name="batches/[batchId]/finalize" options={{ gestureEnabled: false }} />
            <Stack.Screen name="batches/[batchId]/review" />
            <Stack.Screen name="batches/[batchId]/export" />
            <Stack.Screen name="listings/[listingId]/review" />
          </Stack>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
            <LoadingState label="Loading bulk…" brand />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
