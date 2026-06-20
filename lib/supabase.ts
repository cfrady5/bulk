import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client.
 *
 * The MVP runs fully in local mode (Zustand + AsyncStorage). Supabase is
 * OPTIONAL and only needed for real cloud storage + hosted public photo URLs
 * (which eBay requires). When the env vars below are missing, `supabase` is
 * null and the app falls back to local persistence everywhere.
 *
 * Required env (see .env.example):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

function looksConfigured(url?: string, key?: string): boolean {
  return (
    !!url &&
    !!key &&
    url !== 'your_supabase_url' &&
    key !== 'your_supabase_anon_key' &&
    /^https?:\/\//.test(url)
  );
}

export const isSupabaseConfigured = looksConfigured(supabaseUrl, supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        // No user login in the MVP. Persist nothing auth-related, but keep a
        // storage adapter so the SDK is happy in React Native.
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Throw a clear error when a Supabase-only path is hit without config. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
    );
  }
  return supabase;
}
