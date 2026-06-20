import { requireSupabase } from '@/lib/supabase';
import type { ValidationResult } from '@/types';

/**
 * Supabase data access for persisted validation results.
 *
 * Persisting validation results is optional — the app recomputes validation on
 * demand — but storing the latest run is useful for history/audit.
 */

const TABLE = 'validation_results';

export async function fetchValidationResults(batchId: string): Promise<ValidationResult[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch validation results: ${error.message}`);
  return (data ?? []) as ValidationResult[];
}

export async function replaceValidationResults(
  batchId: string,
  results: ValidationResult[],
): Promise<void> {
  const sb = requireSupabase();
  // Clear previous run for this batch, then insert the latest.
  const del = await sb.from(TABLE).delete().eq('batch_id', batchId);
  if (del.error) throw new Error(`Failed to clear validation results: ${del.error.message}`);
  if (results.length === 0) return;
  const { error } = await sb.from(TABLE).insert(results);
  if (error) throw new Error(`Failed to save validation results: ${error.message}`);
}
