import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { photoDisplayUri, PHOTO_ROLE_LABEL } from '@/lib/photo';
import { colors, radius, spacing } from '@/theme';
import type { ListingPhoto } from '@/types';

import { Text } from './Text';

interface PhotoCarouselProps {
  photos: ListingPhoto[];
  height?: number;
}

/**
 * Full-resolution image carousel for the focused review screen only.
 *
 * Loads images lazily (expo-image with disk/memory cache). This is where we
 * intentionally load full-res — list screens use PhotoThumbnail instead.
 */
export function PhotoCarousel({ photos, height = 320 }: PhotoCarouselProps) {
  const width = Dimensions.get('window').width - spacing.xl * 2;
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setIndex(Math.round(x / width));
  };

  if (photos.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Ionicons name="images-outline" size={40} color={colors.textMuted} />
        <Text variant="caption" color={colors.textMuted}>
          No photos
        </Text>
      </View>
    );
  }

  const current = photos[Math.min(index, photos.length - 1)];

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={[styles.scroll, { height }]}
      >
        {photos.map((p) => {
          const uri = photoDisplayUri(p);
          return (
            <View key={p.id} style={{ width, height }}>
              {uri ? (
                <Image
                  source={{ uri }}
                  style={styles.image}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={160}
                  recyclingKey={p.id}
                />
              ) : (
                <View style={styles.empty}>
                  <Ionicons name="image-outline" size={40} color={colors.textMuted} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Role label + counter */}
      <View style={styles.overlayTop}>
        <View style={styles.roleChip}>
          <Text variant="caption2" color={colors.textPrimary}>
            {PHOTO_ROLE_LABEL[current.photo_role]}
          </Text>
        </View>
        <View style={styles.roleChip}>
          <Text variant="caption2" color={colors.textPrimary}>
            {index + 1}/{photos.length}
          </Text>
        </View>
      </View>

      {/* Dots */}
      {photos.length > 1 ? (
        <View style={styles.dots}>
          {photos.map((p, i) => (
            <View
              key={p.id}
              style={[
                styles.dot,
                { backgroundColor: i === index ? colors.primary : colors.borderStrong },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: '100%' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  overlayTop: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleChip: {
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
