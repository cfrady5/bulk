import { LocalStore } from './local-store'
import { SupabaseStore } from './supabase-store'
import { isSupabaseConfigured, type DataStore } from './types'
import { createClient } from '@/lib/supabase/client'

let store: DataStore | null = null

/** Client-side singleton: Supabase when configured, otherwise on-device Local Mode. */
export function getDataStore(): DataStore {
  if (!store) {
    store = isSupabaseConfigured() ? new SupabaseStore(createClient()) : new LocalStore()
  }
  return store
}

export { isSupabaseConfigured }
export type { AppData, DataStore } from './types'
