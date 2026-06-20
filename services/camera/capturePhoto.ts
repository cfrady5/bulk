import type { CameraView } from 'expo-camera';

import { APP_CONFIG } from '@/constants/config';
import { uuid } from '@/lib/id';
import type { PendingPhoto, PhotoRole } from '@/types';

/**
 * Camera capture service (expo-camera).
 *
 * ----------------------------------------------------------------------------
 * CAMERA NOTE: The native system camera app often applies extra computational
 * photography (HDR, deep fusion, sharpening) that an in-app camera does not
 * fully match. For maximum card clarity you may prefer expo-image-picker's
 * launchCameraAsync (which uses the system camera UI) — see pickPhoto.ts.
 *
 * This service is intentionally thin so the capture method is easy to swap or
 * tune. We keep quality high (APP_CONFIG.captureQuality) to favor sharp,
 * readable card images over small file sizes.
 * TODO: expose exposure/focus controls; consider a RAW capture path later.
 * ----------------------------------------------------------------------------
 */

export interface CapturePhotoOptions {
  role: PhotoRole;
  quality?: number;
}

/**
 * Take a photo using a CameraView ref. Returns a PendingPhoto (local URI only,
 * not yet uploaded). Throws a friendly error if capture fails.
 */
export async function capturePhoto(
  cameraRef: CameraView | null,
  options: CapturePhotoOptions,
): Promise<PendingPhoto> {
  if (!cameraRef) {
    throw new Error('Camera is not ready yet. Please wait a moment and try again.');
  }

  try {
    const result = await cameraRef.takePictureAsync({
      quality: options.quality ?? APP_CONFIG.captureQuality,
      skipProcessing: false,
      // exif kept off for privacy + smaller payloads; flip on if needed.
      exif: false,
    });

    if (!result?.uri) {
      throw new Error('Capture returned no image.');
    }

    return {
      id: uuid(),
      local_uri: result.uri,
      photo_role: options.role,
      width: result.width,
      height: result.height,
    };
  } catch (err) {
    throw new Error(
      `Failed to capture photo: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
