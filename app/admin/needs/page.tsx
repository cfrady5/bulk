'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NeedEditSheet } from '@/components/needs/NeedEditSheet'
import { useData } from '@/hooks/useData'
import { percent } from '@/lib/format'
import type { TeamNeed } from '@/types/domain'

/**
 * Desktop/tablet spreadsheet-style editor: team groups as rows, value tiers as
 * columns, click a cell to edit quantity / payout % / target %.
 */
export default function AdminNeedsGrid() {
  const { data, loading, saveTeamNeed } = useData()
  const [editing, setEditing] = useState<TeamNeed | null>(null)

  const tiers = (data?.valueTiers ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <main className="px-3.5 pt-[calc(env(safe-area-inset-top)+14px)]">
      <header className="mb-4 flex items-center gap-3 px-1">
        <Link href="/needs" className="text-white/60">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">Needs Grid</h1>
          <p className="text-[12px] font-medium text-white/45">
            Click any cell to edit quantity, payout %, and target buy %.
          </p>
        </div>
      </header>

      {loading && <div className="h-64 animate-pulse rounded-2xl bg-white/5" />}

      {data && (
        <div className="relative overflow-x-auto rounded-2xl bg-surface shadow-lg shadow-black/20 lg:left-1/2 lg:w-[min(92vw,1200px)] lg:-translate-x-1/2">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky left-0 bg-surface px-3 py-2.5 text-left font-bold text-ink">
                  Group
                </th>
                {tiers.map((t) => (
                  <th key={t.id} className="tnum px-2 py-2.5 text-center font-bold whitespace-nowrap text-ink-soft">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.teamGroups.map((group) => (
                <tr key={group.id} className="border-b border-line last:border-0">
                  <td className="sticky left-0 bg-surface px-3 py-2 font-bold whitespace-nowrap text-ink">
                    {group.name}
                  </td>
                  {tiers.map((tier) => {
                    const need = data.teamNeeds.find(
                      (n) => n.teamGroupId === group.id && n.valueTierId === tier.id,
                    )
                    const remaining = need
                      ? Math.max(0, need.quantityNeeded - need.quantityAcquired)
                      : 0
                    return (
                      <td key={tier.id} className="px-1 py-1 text-center">
                        <button
                          onClick={() =>
                            setEditing(
                              need ?? {
                                id: `${group.id}:${tier.id}`,
                                teamGroupId: group.id,
                                valueTierId: tier.id,
                                quantityNeeded: 0,
                                quantityAcquired: 0,
                                payoutPercentage: 0.94,
                                targetBuyPercentage: 0.87,
                                active: false,
                                updatedAt: new Date().toISOString(),
                              },
                            )
                          }
                          className={`tnum mx-auto flex h-11 w-full min-w-14 flex-col items-center justify-center rounded-lg font-bold transition-colors ${
                            remaining > 0
                              ? 'bg-buy-soft text-buy hover:brightness-95'
                              : 'bg-surface-muted text-ink-soft/60 hover:bg-line'
                          }`}
                          title={
                            need
                              ? `payout ${percent(need.payoutPercentage, 0)} · target ${percent(need.targetBuyPercentage, 0)}`
                              : 'No rule yet'
                          }
                        >
                          <span className="text-[15px] leading-none">{remaining}</span>
                          {need && (
                            <span className="mt-0.5 text-[9px] leading-none font-semibold opacity-70">
                              {percent(need.payoutPercentage, 0)}/{percent(need.targetBuyPercentage, 0)}
                            </span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
