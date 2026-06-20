import { APP_CONFIG } from '@/constants/config';
import { supabase } from '@/lib/supabase';

/**
 * Resolve the public HTTPS URL for a stored photo path.
 *
 * eBay CSV requires hosted public URLs (it cannot read local file:// URIs).
 * The `card-listing-photos` bucket is public for the MVP (see README) so any
 * stored object has a stable public URL.
 *
 * An optional override host can be provided via EXPO_PUBLIC_PHOTO_PUBLIC_HOST
 * (e.g. a CDN in front of Storage). Otherwise we use Supabase's public URL.
 */

const overrideHost = process.env.EXPO_PUBLIC_PHOTO_PUBLIC_HOST?.trim();

export function getPublicPhotoUrl(storagePath: string): string | null {
  if (!storagePath) return null;

  if (overrideHost) {
    const base = overrideHost.replace(/\/+$/, '');
    const path = storagePath.replace(/^\/+/, '');
    return `${base}/${path}`;
  }

  if (!supabase) return null;

  const { data } = supabase.storage.from(APP_CONFIG.storageBucket).getPublicUrl(storagePath);
  return data?.publicUrl ?? null;
}
