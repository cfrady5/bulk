'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getDataStore, type AppData } from '@/lib/data'
import type {
  PricingRule,
  Purchase,
  Show,
  TeamGroup,
  TeamNeed,
} from '@/types/domain'

const ACTIVE_SHOW_KEY = 'card-desk:active-show'

interface DataContextValue {
  data: AppData | null
  loading: boolean
  error: string | null
  mode: 'local' | 'supabase'
  activeShowId: string | null
  setActiveShowId: (id: string | null) => void
  refresh: () => Promise<void>
  saveTeamNeed: (need: TeamNeed) => Promise<void>
  saveTeamGroup: (group: TeamGroup) => Promise<void>
  deleteTeamGroup: (groupId: string) => Promise<void>
  savePricingRule: (rule: PricingRule) => Promise<void>
  savePurchase: (purchase: Purchase) => Promise<void>
  deletePurchase: (purchaseId: string) => Promise<void>
  saveShow: (show: Show) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeShowId, setActiveShowIdState] = useState<string | null>(null)

  const store = useMemo(() => (typeof window === 'undefined' ? null : getDataStore()), [])

  const refresh = useCallback(async () => {
    if (!store) return
    try {
      setData(await store.load())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => {
    void (async () => {
      await refresh()
      try {
        setActiveShowIdState(window.localStorage.getItem(ACTIVE_SHOW_KEY))
      } catch {
        // storage unavailable; show selection just won't persist
      }
    })()
  }, [refresh])

  const setActiveShowId = useCallback((id: string | null) => {
    setActiveShowIdState(id)
    try {
      if (id) window.localStorage.setItem(ACTIVE_SHOW_KEY, id)
      else window.localStorage.removeItem(ACTIVE_SHOW_KEY)
    } catch {
      // non-fatal
    }
  }, [])

  const mutate = useCallback(
    async (apply: (d: AppData) => AppData, persist: () => Promise<void>) => {
      setData((d) => (d ? apply(d) : d))
      try {
        await persist()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
        await refresh() // roll back optimistic state to what actually persisted
      }
    },
    [refresh],
  )

  const upsert = <T extends { id: string }>(list: T[], item: T): T[] => {
    const i = list.findIndex((x) => x.id === item.id)
    return i === -1 ? [...list, item] : list.map((x) => (x.id === item.id ? item : x))
  }

  const saveTeamNeed = useCallback(
    (need: TeamNeed) =>
      mutate(
        (d) => ({ ...d, teamNeeds: upsert(d.teamNeeds, need) }),
        () => store!.saveTeamNeed(need),
      ),
    [mutate, store],
  )

  const saveTeamGroup = useCallback(
    (group: TeamGroup) =>
      mutate(
        (d) => ({ ...d, teamGroups: upsert(d.teamGroups, group) }),
        () => store!.saveTeamGroup(group),
      ),
    [mutate, store],
  )

  const deleteTeamGroup = useCallback(
    (groupId: string) =>
      mutate(
        (d) => ({
          ...d,
          teamGroups: d.teamGroups.filter((g) => g.id !== groupId),
          teamNeeds: d.teamNeeds.filter((n) => n.teamGroupId !== groupId),
        }),
        () => store!.deleteTeamGroup(groupId),
      ),
    [mutate, store],
  )

  const savePricingRule = useCallback(
    (rule: PricingRule) =>
      mutate(
        (d) => ({ ...d, pricingRules: upsert(d.pricingRules, rule) }),
        () => store!.savePricingRule(rule),
      ),
    [mutate, store],
  )

  const savePurchase = useCallback(
    async (purchase: Purchase) => {
      if (!store || !data) return
      const need =
        purchase.teamNeedId !== null
          ? (data.teamNeeds.find((n) => n.id === purchase.teamNeedId) ?? null)
          : null
      const bumped: TeamNeed | null =
        need && purchase.status === 'purchased'
          ? {
              ...need,
              quantityAcquired: need.quantityAcquired + 1,
              updatedAt: new Date().toISOString(),
            }
          : null
      await mutate(
        (d) => ({
          ...d,
          purchases: upsert(d.purchases, purchase),
          teamNeeds: bumped ? upsert(d.teamNeeds, bumped) : d.teamNeeds,
        }),
        async () => {
          await store.savePurchase(purchase)
          // Local mode persists the bump here; in Supabase a DB trigger does it.
          if (bumped && store.mode === 'local') await store.saveTeamNeed(bumped)
        },
      )
    },
    [mutate, store, data],
  )

  const deletePurchase = useCallback(
    async (purchaseId: string) => {
      if (!store || !data) return
      const purchase = data.purchases.find((p) => p.id === purchaseId)
      const need =
        purchase?.teamNeedId != null
          ? (data.teamNeeds.find((n) => n.id === purchase.teamNeedId) ?? null)
          : null
      const dropped: TeamNeed | null =
        need && purchase?.status === 'purchased'
          ? {
              ...need,
              quantityAcquired: Math.max(0, need.quantityAcquired - 1),
              updatedAt: new Date().toISOString(),
            }
          : null
      await mutate(
        (d) => ({
          ...d,
          purchases: d.purchases.filter((p) => p.id !== purchaseId),
          teamNeeds: dropped ? upsert(d.teamNeeds, dropped) : d.teamNeeds,
        }),
        async () => {
          await store.deletePurchase(purchaseId)
          if (dropped && store.mode === 'local') await store.saveTeamNeed(dropped)
        },
      )
    },
    [mutate, store, data],
  )

  const saveShow = useCallback(
    (show: Show) =>
      mutate(
        (d) => ({ ...d, shows: upsert(d.shows, show) }),
        () => store!.saveShow(show),
      ),
    [mutate, store],
  )

  const value: DataContextValue = {
    data,
    loading,
    error,
    mode: store?.mode ?? 'local',
    activeShowId,
    setActiveShowId,
    refresh,
    saveTeamNeed,
    saveTeamGroup,
    deleteTeamGroup,
    savePricingRule,
    savePurchase,
    deletePurchase,
    saveShow,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
