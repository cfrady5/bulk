import * as ImagePicker from 'expo-image-picker';

import { APP_CONFIG } from '@/constants/config';
import { uuid } from '@/lib/id';
import type { PendingPhoto, PhotoRole } from '@/types';

/**
 * Photo acquisition via expo-image-picker.
 *
 * Two paths:
 *   - takePhotoWithSystemCamera: opens the SYSTEM camera UI. This typically
 *     produces the sharpest results because it uses the OS's full computational
 *     photography pipeline (best for reading small card text / slab labels).
 *   - pickPhotoFromLibrary: choose an existing image (useful for testing in
 *     Expo Go / simulators with no camera).
 *
 * Both return a PendingPhoto (local URI, not yet uploaded).
 */

export async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function ensureLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function takePhotoWithSystemCamera(role: PhotoRole): Promise<PendingPhoto | null> {
  const granted = await ensureCameraPermission();
  if (!granted) {
    throw new Error('Camera permission was denied. Enable it in Settings to capture cards.');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: APP_CONFIG.captureQuality,
    allowsEditing: false,
    exif: false,
  });

  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];

  return {
    id: uuid(),
    local_uri: asset.uri,
    photo_role: role,
    width: asset.width,
    height: asset.height,
  };
}

export async function pickPhotoFromLibrary(role: PhotoRole): Promise<PendingPhoto | null> {
  const granted = await ensureLibraryPermission();
  if (!granted) {
    throw new Error('Photo library permission was denied. Enable it in Settings.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: APP_CONFIG.captureQuality,
    allowsEditing: false,
    exif: false,
  });

  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];

  return {
    id: uuid(),
    local_uri: asset.uri,
    photo_role: role,
    width: asset.width,
    height: asset.height,
  };
}
