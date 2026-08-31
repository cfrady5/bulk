'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'
import { Card, Chip } from '@/components/ui'
import { NeedEditSheet } from '@/components/needs/NeedEditSheet'
import { useData } from '@/hooks/useData'
import { tierLabel } from '@/lib/format'
import type { TeamNeed } from '@/types/domain'

type Filter = 'all' | 'high' | 'low' | 'closed'

export default function NeedsPage() {
  const { data, loading, saveTeamNeed } = useData()
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<TeamNeed | null>(null)

  const groups = useMemo(() => {
    if (!data) return []
    return data.teamGroups.map((group) => {
      const needs = data.valueTiers
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((tier) => {
          const need = data.teamNeeds.find(
            (n) => n.teamGroupId === group.id && n.valueTierId === tier.id,
          )
          const remaining = need
            ? Math.max(0, need.quantityNeeded - need.quantityAcquired)
            : 0
          return { tier, need, remaining }
        })
      const totalRemaining = needs.reduce((a, n) => a + n.remaining, 0)
      return { group, needs, totalRemaining }
    })
  }, [data])

  const filtered = groups.filter(({ totalRemaining }) => {
    if (filter === 'high') return totalRemaining >= 20
    if (filter === 'low') return totalRemaining > 0 && totalRemaining < 20
    if (filter === 'closed') return totalRemaining === 0
    return true
  })

  return (
    <main className="space-y-3.5 px-3.5 pt-[calc(env(safe-area-inset-top)+14px)]">
      <header className="flex items-center justify-between px-1">
        <h1 className="text-xl font-black tracking-tight text-white">Needs</h1>
        <Link
          href="/admin/needs"
          className="hidden items-center gap-1.5 rounded-full bg-canvas-raised px-3 py-1.5 text-[12px] font-semibold text-white/70 ring-1 ring-white/10 sm:flex"
        >
          <LayoutGrid size={14} /> Grid editor
        </Link>
      </header>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(
          [
            ['all', 'All'],
            ['high', 'High Need'],
            ['low', 'Low Need'],
            ['closed', 'Closed'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold whitespace-nowrap ${
              filter === key ? 'bg-white text-ink' : 'bg-canvas-raised text-white/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="h-40 animate-pulse rounded-2xl bg-white/5" />}

      {filtered.map(({ group, needs, totalRemaining }) => {
        const teams = (data?.teams ?? []).filter((t) => group.teamIds.includes(t.id))
        return (
          <Card key={group.id}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[17px] font-black tracking-wide text-ink uppercase">
                {group.name}
              </h2>
              {totalRemaining > 0 ? (
                <Chip tone="buy">Active need · {totalRemaining}</Chip>
              ) : (
                <Chip tone="pass">No need</Chip>
              )}
            </div>
            <p className="mb-3 text-[12px] font-medium text-ink-soft">
              {teams.map((t) => t.name).join(' • ') || 'No teams assigned'}
            </p>
            <ul className="divide-y divide-line">
              {needs
                .filter(({ need }) => need)
                .map(({ tier, need, remaining }) => (
                  <li key={tier.id}>
                    <button
                      onClick={() => setEditing(need!)}
                      className="flex w-full items-center justify-between py-2 text-left"
                    >
                      <span className="tnum text-[14px] font-semibold text-ink">
                        {tierLabel(tier.minimumValue, tier.maximumValue)}
                      </span>
                      <span
                        className={`tnum rounded-full px-2.5 py-0.5 text-[13px] font-bold ${
                          remaining > 0 ? 'bg-buy-soft text-buy' : 'bg-surface-muted text-ink-soft'
                        }`}
                      >
                        {remaining > 0 ? `${remaining} remaining` : '0 — do not buy'}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </Card>
        )
      })}

      <NeedEditSheet
        need={editing}
        onClose={() => setEditing(null)}
        onSave={async (n) => {
          await saveTeamNeed(n)
          setEditing(null)
        }}
      />
    </main>
  )
}
