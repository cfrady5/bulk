import * as FileSystem from 'expo-file-system';

import { APP_CONFIG } from '@/constants/config';
import { base64ToUint8Array } from '@/lib/base64';
import { uuid } from '@/lib/id';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import { getPublicPhotoUrl } from './getPublicPhotoUrl';

/**
 * Upload a captured photo to Supabase Storage and return its storage path +
 * public URL.
 *
 * Local-first behavior: if Supabase is not configured, this is a no-op that
 * returns the local URI as a *preview* source with a null public_url. The app
 * keeps working for capture/review; export validation will flag the missing
 * public URLs because eBay needs hosted HTTPS links.
 *
 * Image quality: we read the file as-is (no re-compression here) to keep card
 * images sharp. The capture/pick step controls quality via APP_CONFIG.
 * TODO: add optional resize/compress (expo-image-manipulator) for very large
 * files if upload times become a problem on slow connections.
 */

export interface UploadPhotoInput {
  localUri: string;
  batchId: string;
  listingId: string;
  /** File extension hint, default jpg. */
  ext?: string;
  contentType?: string;
}

export interface UploadPhotoResult {
  storage_path: string | null;
  public_url: string | null;
  local_uri: string;
  uploaded: boolean;
}

export async function uploadListingPhoto(input: UploadPhotoInput): Promise<UploadPhotoResult> {
  const { localUri, batchId, listingId } = input;
  const ext = (input.ext ?? 'jpg').replace(/^\./, '');
  const contentType = input.contentType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  // Local-only mode — no backend configured.
  if (!isSupabaseConfigured || !supabase) {
    return {
      storage_path: null,
      public_url: null,
      local_uri: localUri,
      uploaded: false,
    };
  }

  const storagePath = `${batchId}/${listingId}/${uuid()}.${ext}`;

  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = base64ToUint8Array(base64);

    const { error } = await supabase.storage
      .from(APP_CONFIG.storageBucket)
      .upload(storagePath, bytes, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const publicUrl = getPublicPhotoUrl(storagePath);

    return {
      storage_path: storagePath,
      public_url: publicUrl,
      local_uri: localUri,
      uploaded: true,
    };
  } catch (err) {
    // Don't lose the photo — keep the local URI so the user can retry upload.
    throw new Error(
      `Photo upload failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
