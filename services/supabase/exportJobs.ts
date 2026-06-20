import { requireSupabase } from '@/lib/supabase';
import type { ExportJob } from '@/types';

/** Supabase data access for export job history. */

const TABLE = 'export_jobs';

export async function fetchExportJobs(batchId: string): Promise<ExportJob[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch export jobs: ${error.message}`);
  return (data ?? []) as ExportJob[];
}

export async function insertExportJob(job: ExportJob): Promise<ExportJob> {
  const sb = requireSupabase();
  const { data, error } = await sb.from(TABLE).insert(job).select('*').single();
  if (error) throw new Error(`Failed to save export job: ${error.message}`);
  return data as ExportJob;
}
