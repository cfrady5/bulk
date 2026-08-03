'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client (anon key only — never the service-role key).
 * Reads public env vars injected at build time.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
