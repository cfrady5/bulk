import { requireSupabase } from '@/lib/supabase';
import type { Batch, BatchInput } from '@/types';

/**
 * Supabase data access for batches.
 *
 * These are the production cloud data functions. The MVP UI primarily reads
 * from the local Zustand store (so it runs with no backend), but these are
 * ready to wire in / sync once Supabase is configured.
 *
 * TODO (future): add an offline sync layer that mirrors the local store into
 * these tables in the background.
 */

const TABLE = 'batches';

export async function fetchBatches(): Promise<Batch[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch batches: ${error.message}`);
  return (data ?? []) as Batch[];
}

export async function fetchBatch(id: string): Promise<Batch | null> {
  const sb = requireSupabase();
  const { data, error } = await sb.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch batch: ${error.message}`);
  return (data as Batch) ?? null;
}

export async function createBatch(input: BatchInput & { id?: string }): Promise<Batch> {
  const sb = requireSupabase();
  const { data, error } = await sb.from(TABLE).insert(input).select('*').single();
  if (error) throw new Error(`Failed to create batch: ${error.message}`);
  return data as Batch;
}

export async function updateBatch(id: string, patch: Partial<Batch>): Promise<Batch> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(`Failed to update batch: ${error.message}`);
  return data as Batch;
}

export async function deleteBatch(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(`Failed to delete batch: ${error.message}`);
}
