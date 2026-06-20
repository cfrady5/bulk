import { APP_CONFIG } from '@/constants/config';
import { supabase } from '@/lib/supabase';

/**
 * Delete a photo's bytes from Supabase Storage.
 *
 * No-op in local-only mode (nothing was uploaded). The photo row itself is
 * removed via services/supabase/photos.ts or the local store.
 */

export async function deleteListingPhoto(storagePath: string | null): Promise<void> {
  if (!storagePath || !supabase) return;

  const { error } = await supabase.storage.from(APP_CONFIG.storageBucket).remove([storagePath]);
  if (error) {
    throw new Error(`Failed to delete photo from storage: ${error.message}`);
  }
}
