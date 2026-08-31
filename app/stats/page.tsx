'use client'

import { useMemo, useState } from 'react'
import { Card, SectionLabel } from '@/components/ui'
import { useData } from '@/hooks/useData'
import { money, percent } from '@/lib/format'
import type { Purchase } from '@/types/domain'

type Range = 'today' | 'show' | 'all'

function aggregate(purchases: Purchase[]) {
  const bought = purchases.filter((p) => p.status === 'purchased')
  const spent = bought.reduce((a, p) => a + p.actualPurchasePrice, 0)
  const market = bought.reduce((a, p) => a + p.marketValue, 0)
  const payout = bought.reduce((a, p) => a + p.expectedPayout, 0)
  return {
    count: bought.length,
    spent,
    market,
    payout,
    profit: payout - spent,
    avgBuyPct: market > 0 ? spent / market : null,
    avgPayoutPct: market > 0 ? payout / market : null,
  }
}

export default function StatsPage() {
  const { data, loading, activeShowId } = useData()
  const [range, setRange] = useState<Range>('today')

  const stats = useMemo(() => {
    const all = data?.purchases ?? []
    const today = new Date().toDateString()
    const filtered =
      range === 'today'
        ? all.filter((p) => new Date(p.purchasedAt).toDateString() === today)
        : range === 'show'
          ? all.filter((p) => p.showId === activeShowId && activeShowId !== null)
          : all
    return aggregate(filtered)
  }, [data, range, activeShowId])

  const groupBreakdown = useMemo(() => {
    const all = (data?.purchases ?? []).filter((p) => p.status === 'purchased')
    const byGroup = new Map<string, { count: number; spent: number; profit: number }>()
    for (const p of all) {
      const key = p.teamGroupId ?? 'ungrouped'
      const entry = byGroup.get(key) ?? { count: 0, spent: 0, profit: 0 }
      entry.count++
      entry.spent += p.actualPurchasePrice
      entry.profit += p.expectedProfit
      byGroup.set(key, entry)
    }
    return [...byGroup.entries()]
      .map(([id, v]) => ({
        name: data?.teamGroups.find((g) => g.id === id)?.name ?? 'Ungrouped',
        ...v,
      }))
      .sort((a, b) => b.spent - a.spent)
  }, [data])

  const activeShow = data?.shows.find((s) => s.id === activeShowId)

  return (
    <main className="space-y-3.5 px-3.5 pt-[calc(env(safe-area-inset-top)+14px)]">
      <header className="px-1">
        <h1 className="text-xl font-black tracking-tight text-white">Stats</h1>
      </header>

      <div className="flex gap-1.5">
        {(
          [
            ['today', 'Today'],
            ['show', activeShow ? activeShow.name : 'Show'],
            ['all', 'All Time'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRange(key)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold whitespace-nowrap ${
              range === key ? 'bg-white text-ink' : 'bg-canvas-raised text-white/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {range === 'show' && !activeShow && (
        <p className="rounded-xl bg-canvas-raised px-3.5 py-2.5 text-[12px] font-medium text-white/60">
          No active show — pick one in the More tab.
        </p>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
      ) : (
        <>
          <Card>
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              <Big label="Cards Bought" value={String(stats.count)} />
              <Big label="Spent" value={money(stats.spent)} />
              <Big label="Market Value" value={money(stats.market)} />
              <Big label="Expected Payout" value={money(stats.payout)} />
              <Big
                label="Expected Profit"
                value={`${stats.profit >= 0 ? '+' : ''}${money(stats.profit)}`}
                tone={stats.profit >= 0 ? 'buy' : 'pass'}
              />
              <div className="grid grid-cols-2 gap-2">
                <Big label="Avg Buy" value={percent(stats.avgBuyPct)} small />
                <Big label="Avg Payout" value={percent(stats.avgPayoutPct)} small />
              </div>
            </div>
          </Card>

          {groupBreakdown.length > 0 && (
            <Card>
              <SectionLabel>By Team Group (all time)</SectionLabel>
              <ul className="mt-2 divide-y divide-line">
                {groupBreakdown.map((g) => (
                  <li key={g.name} className="flex items-center justify-between py-2">
                    <span className="text-[14px] font-bold text-ink">{g.name}</span>
                    <span className="tnum text-[13px] font-medium text-ink-soft">
                      {g.count} cards · {money(g.spent)} ·{' '}
                      <span className={g.profit >= 0 ? 'text-buy' : 'text-pass'}>
                        {g.profit >= 0 ? '+' : ''}
                        {money(g.profit)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </main>
  )
}

function Big({
  label,
  value,
  tone,
  small = false,
}: {
  label: string
  value: string
  tone?: 'buy' | 'pass'
  small?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.1em] text-ink-soft uppercase">{label}</p>
      <p
        className={`tnum font-bold ${small ? 'text-lg' : 'text-[26px]'} ${
          tone === 'buy' ? 'text-buy' : tone === 'pass' ? 'text-pass' : 'text-ink'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
