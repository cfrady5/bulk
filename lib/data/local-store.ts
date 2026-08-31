import type { AppData, DataStore } from './types'
import type {
  PricingRule,
  Purchase,
  Show,
  TeamGroup,
  TeamNeed,
} from '@/types/domain'
import {
  SEED_PRICING_RULES,
  SEED_SPORTS,
  SEED_TEAMS,
  SEED_TEAM_GROUPS,
  SEED_VALUE_TIERS,
  seedTeamNeeds,
} from './seed'

const STORAGE_KEY = 'card-desk:data:v1'

/**
 * On-device persistence via localStorage. Zero-setup and resilient to bad
 * venue Wi-Fi — comp searches still need the network, but saving purchases
 * never does. Data stays on this device until Supabase mode is enabled.
 */
export class LocalStore implements DataStore {
  readonly mode = 'local' as const
  private data: AppData | null = null

  private read(): AppData {
    if (this.data) return this.data
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          this.data = JSON.parse(raw) as AppData
          return this.data
        }
      } catch {
        // corrupted or unavailable storage — fall through to seed
      }
    }
    this.data = {
      sports: SEED_SPORTS,
      teams: SEED_TEAMS,
      teamGroups: SEED_TEAM_GROUPS,
      valueTiers: SEED_VALUE_TIERS,
      teamNeeds: seedTeamNeeds(),
      pricingRules: SEED_PRICING_RULES,
      shows: [],
      purchases: [],
    }
    this.write()
    return this.data
  }

  private write(): void {
    if (typeof window === 'undefined' || !this.data) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data))
    } catch {
      // storage full/unavailable; state stays in memory for the session
    }
  }

  async load(): Promise<AppData> {
    return this.read()
  }

  private upsert<T extends { id: string }>(list: T[], item: T): T[] {
    const i = list.findIndex((x) => x.id === item.id)
    if (i === -1) return [...list, item]
    const next = [...list]
    next[i] = item
    return next
  }

  async saveTeamNeed(need: TeamNeed): Promise<void> {
    const d = this.read()
    d.teamNeeds = this.upsert(d.teamNeeds, need)
    this.write()
  }

  async saveTeamGroup(group: TeamGroup): Promise<void> {
    const d = this.read()
    d.teamGroups = this.upsert(d.teamGroups, group)
    this.write()
  }

  async deleteTeamGroup(groupId: string): Promise<void> {
    const d = this.read()
    d.teamGroups = d.teamGroups.filter((g) => g.id !== groupId)
    d.teamNeeds = d.teamNeeds.filter((n) => n.teamGroupId !== groupId)
    this.write()
  }

  async savePricingRule(rule: PricingRule): Promise<void> {
    const d = this.read()
    d.pricingRules = this.upsert(d.pricingRules, rule)
    this.write()
  }

  async savePurchase(purchase: Purchase): Promise<void> {
    const d = this.read()
    d.purchases = this.upsert(d.purchases, purchase)
    this.write()
  }

  async deletePurchase(purchaseId: string): Promise<void> {
    const d = this.read()
    d.purchases = d.purchases.filter((p) => p.id !== purchaseId)
    this.write()
  }

  async saveShow(show: Show): Promise<void> {
    const d = this.read()
    d.shows = this.upsert(d.shows, show)
    this.write()
  }
}
