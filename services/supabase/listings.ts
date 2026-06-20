import { requireSupabase } from '@/lib/supabase';
import type { Listing } from '@/types';

/**
 * Supabase data access for listings. See note in batches.ts about local-first
 * MVP behavior.
 */

const TABLE = 'listings';

export async function fetchListingsForBatch(batchId: string): Promise<Listing[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to fetch listings: ${error.message}`);
  return (data ?? []) as Listing[];
}

export async function fetchListing(id: string): Promise<Listing | null> {
  const sb = requireSupabase();
  const { data, error } = await sb.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch listing: ${error.message}`);
  return (data as Listing) ?? null;
}

export async function upsertListing(listing: Listing): Promise<Listing> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .upsert({ ...listing, updated_at: new Date().toISOString() })
    .select('*')
    .single();
  if (error) throw new Error(`Failed to save listing: ${error.message}`);
  return data as Listing;
}

export async function updateListing(id: string, patch: Partial<Listing>): Promise<Listing> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(`Failed to update listing: ${error.message}`);
  return data as Listing;
}

export async function deleteListing(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(`Failed to delete listing: ${error.message}`);
}
