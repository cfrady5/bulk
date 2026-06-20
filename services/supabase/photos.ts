import { requireSupabase } from '@/lib/supabase';
import type { ListingPhoto } from '@/types';

/** Supabase data access for listing photo rows (metadata, not the bytes). */

const TABLE = 'listing_photos';

export async function fetchPhotosForListing(listingId: string): Promise<ListingPhoto[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`Failed to fetch photos: ${error.message}`);
  return (data ?? []) as ListingPhoto[];
}

export async function fetchPhotosForBatch(batchId: string): Promise<ListingPhoto[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('batch_id', batchId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`Failed to fetch batch photos: ${error.message}`);
  return (data ?? []) as ListingPhoto[];
}

export async function insertPhoto(photo: ListingPhoto): Promise<ListingPhoto> {
  const sb = requireSupabase();
  const { data, error } = await sb.from(TABLE).insert(photo).select('*').single();
  if (error) throw new Error(`Failed to save photo: ${error.message}`);
  return data as ListingPhoto;
}

export async function deletePhotoRow(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(`Failed to delete photo row: ${error.message}`);
}
