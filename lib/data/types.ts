import type {
  PricingRule,
  Purchase,
  Show,
  Sport,
  Team,
  TeamGroup,
  TeamNeed,
  ValueTier,
} from '@/types/domain'

export interface AppData {
  sports: Sport[]
  teams: Team[]
  teamGroups: TeamGroup[]
  valueTiers: ValueTier[]
  teamNeeds: TeamNeed[]
  pricingRules: PricingRule[]
  shows: Show[]
  purchases: Purchase[]
}

/**
 * Persistence abstraction. LocalStore keeps everything on-device
 * (zero-setup, works offline at a show); SupabaseStore syncs to Postgres
 * with auth + RLS. Both expose identical operations.
 */
export interface DataStore {
  readonly mode: 'local' | 'supabase'
  load(): Promise<AppData>
  saveTeamNeed(need: TeamNeed): Promise<void>
  saveTeamGroup(group: TeamGroup): Promise<void>
  deleteTeamGroup(groupId: string): Promise<void>
  savePricingRule(rule: PricingRule): Promise<void>
  savePurchase(purchase: Purchase): Promise<void>
  deletePurchase(purchaseId: string): Promise<void>
  saveShow(show: Show): Promise<void>
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
