import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { photoDisplayUri, PHOTO_ROLE_LABEL } from '@/lib/photo';
import { colors, radius } from '@/theme';
import type { ListingPhoto } from '@/types';

import { Text } from './Text';

interface PhotoThumbnailProps {
  photo?: ListingPhoto | null;
  size?: number;
  showRole?: boolean;
  style?: ViewStyle;
}

/**
 * Small cached thumbnail (expo-image handles memory/disk caching + downscale).
 * Use this in lists; never render full-resolution images in long lists.
 */
export function PhotoThumbnail({ photo, size = 64, showRole, style }: PhotoThumbnailProps) {
  const uri = photo ? photoDisplayUri(photo) : null;

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={120}
          recyclingKey={photo?.id}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={size * 0.36} color={colors.textMuted} />
        </View>
      )}
      {showRole && photo ? (
        <View style={styles.roleChip}>
          <Text variant="caption2" color={colors.textPrimary}>
            {PHOTO_ROLE_LABEL[photo.photo_role]}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  roleChip: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.overlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
});
