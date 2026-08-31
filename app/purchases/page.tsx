'use client'

import { useMemo, useState } from 'react'
import { Download, Search, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui'
import { useData } from '@/hooks/useData'
import { purchasesToCsv, downloadCsv } from '@/lib/csv'
import { fullDate, money } from '@/lib/format'

export default function PurchasesPage() {
  const { data, loading, deletePurchase } = useData()
  const [q, setQ] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [showFilter, setShowFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const purchases = useMemo(() => {
    let list = data?.purchases ?? []
    if (groupFilter) list = list.filter((p) => p.teamGroupId === groupFilter)
    if (showFilter) list = list.filter((p) => p.showId === showFilter)
    const needle = q.trim().toLowerCase()
    if (needle) {
      list = list.filter((p) => {
        const team = data?.teams.find((t) => t.id === p.card.teamId)
        const hay = [
          p.card.playerName, p.card.product, p.card.parallel, p.card.year,
          p.card.grader, p.card.grade, p.query, p.notes, p.sellerName,
          team?.name, team?.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(needle)
      })
    }
    return [...list].sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
  }, [data, q, groupFilter, showFilter])

  const exportCsv = () => {
    if (!data) return
    downloadCsv(
      `card-desk-purchases-${new Date().toISOString().slice(0, 10)}.csv`,
      purchasesToCsv(purchases, data),
    )
  }

  return (
    <main className="space-y-3.5 px-3.5 pt-[calc(env(safe-area-inset-top)+14px)]">
      <header className="flex items-center justify-between px-1">
        <h1 className="text-xl font-black tracking-tight text-white">Purchases</h1>
        <button
          onClick={exportCsv}
          disabled={purchases.length === 0}
          className="flex items-center gap-1.5 rounded-full bg-canvas-raised px-3 py-1.5 text-[12px] font-semibold text-white/70 ring-1 ring-white/10 disabled:opacity-40"
        >
          <Download size={14} /> CSV
        </button>
      </header>

      <div className="flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-lg shadow-black/20">
        <Search size={16} className="ml-2 shrink-0 text-ink-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search player, team, notes…"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] font-medium text-ink outline-none"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="rounded-full bg-canvas-raised px-3 py-1.5 text-[12px] font-semibold text-white/70 ring-1 ring-white/10"
        >
          <option value="">All groups</option>
          {(data?.teamGroups ?? []).map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          value={showFilter}
          onChange={(e) => setShowFilter(e.target.value)}
          className="rounded-full bg-canvas-raised px-3 py-1.5 text-[12px] font-semibold text-white/70 ring-1 ring-white/10"
        >
          <option value="">All shows</option>
          {(data?.shows ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="h-40 animate-pulse rounded-2xl bg-white/5" />}

      {!loading && purchases.length === 0 && (
        <p className="px-4 pt-8 text-center text-[13px] font-medium text-white/35">
          No purchases yet. Save your first card from the Buy tab.
        </p>
      )}

      {purchases.map((p) => {
        const team = data?.teams.find((t) => t.id === p.card.teamId)
        const cardLine = [p.card.year, p.card.product, p.card.parallel]
          .filter(Boolean)
          .join(' ')
        return (
          <Card key={p.id} className="!p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-ink">
                  {p.card.playerName || p.query}
                </p>
                <p className="truncate text-[12px] font-medium text-ink-soft">
                  {cardLine}
                  {p.card.grader && p.card.grader !== 'Raw'
                    ? ` · ${p.card.grader} ${p.card.grade}`
                    : ''}
                  {team ? ` · ${team.name}` : ''}
                </p>
                <p className="text-[11px] font-medium text-ink-soft/70">
                  {fullDate(p.purchasedAt)}
                  {p.sellerName ? ` · ${p.sellerName}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tnum text-[15px] font-bold text-ink">{money(p.actualPurchasePrice)}</p>
                <p className={`tnum text-[12px] font-bold ${p.expectedProfit >= 0 ? 'text-buy' : 'text-pass'}`}>
                  {p.expectedProfit >= 0 ? '+' : ''}{money(p.expectedProfit)}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[11px] font-medium text-ink-soft">
              <span className="tnum">
                Market {money(p.marketValue)} · Payout {money(p.expectedPayout)}
              </span>
              {confirmDelete === p.id ? (
                <span className="flex gap-2">
                  <button
                    onClick={() => void deletePurchase(p.id).then(() => setConfirmDelete(null))}
                    className="font-bold text-pass"
                  >
                    Confirm delete
                  </button>
                  <button onClick={() => setConfirmDelete(null)} className="font-bold">
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDelete(p.id)}
                  className="text-ink-soft/60"
                  aria-label="Delete purchase"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </Card>
        )
      })}
    </main>
  )
}
