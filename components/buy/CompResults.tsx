'use client'

import clsx from 'clsx'
import { CheckCircle2, Circle, RefreshCw } from 'lucide-react'
import { Card, SectionLabel } from '@/components/ui'
import { money, saleDate } from '@/lib/format'
import type { BuyFlow } from '@/hooks/useBuyFlow'

function matchTone(score: number): string {
  if (score >= 0.9) return 'text-buy'
  if (score >= 0.75) return 'text-negotiate'
  return 'text-pass'
}

/** Recent sales with tap-to-include/exclude and match scoring. */
export function CompResults({ flow }: { flow: BuyFlow }) {
  if (flow.status !== 'done') return null
  const includedCount = flow.sales.filter((s) => s.included).length

  return (
    <Card>
      <div className="mb-2.5 flex items-center justify-between">
        <SectionLabel>
          Recent Sales · {includedCount}/{flow.sales.length} included
        </SectionLabel>
        <button
          onClick={() => void flow.search({ refresh: true })}
          className="flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-ink-soft active:scale-95"
        >
          <RefreshCw size={12} />
          {flow.meta?.cached ? 'Refresh sales' : 'Refresh'}
        </button>
      </div>

      {flow.meta?.stale && (
        <p className="mb-2 rounded-lg bg-negotiate-soft px-2.5 py-1.5 text-[12px] font-medium text-negotiate">
          Live search failed — showing cached sales.
        </p>
      )}

      {flow.sales.length === 0 ? (
        <p className="py-3 text-center text-sm font-medium text-ink-soft">
          No comps found. Loosen the search, or enter a market value manually below.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {flow.sales.map((sale, i) => (
            <li key={sale.id ?? i}>
              <button
                onClick={() => flow.toggleSale(sale.id, i)}
                className={clsx(
                  'flex w-full items-center gap-2.5 py-2.5 text-left transition-opacity',
                  !sale.included && 'opacity-40',
                )}
              >
                {sale.included ? (
                  <CheckCircle2 size={19} className="shrink-0 text-buy" />
                ) : (
                  <Circle size={19} className="shrink-0 text-ink-soft/40" />
                )}
                {sale.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- marketplace-hosted thumbs, hosts vary
                  <img
                    src={sale.imageUrl}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-12 w-9 shrink-0 rounded-md bg-surface-muted object-cover"
                    onError={(e) => {
                      e.currentTarget.style.visibility = 'hidden'
                    }}
                  />
                ) : (
                  <div className="h-12 w-9 shrink-0 rounded-md bg-surface-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] leading-tight font-medium text-ink">
                    {sale.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-ink-soft">
                    {saleDate(sale.soldAt)} · {sale.platform ?? '—'}
                    {sale.listingType ? ` · ${sale.listingType.replace('_', ' ')}` : ''}
                    {' · '}
                    <span className={matchTone(sale.matchScore)}>
                      {Math.round(sale.matchScore * 100)}% match
                    </span>
                  </p>
                </div>
                <p className="tnum shrink-0 text-[15px] font-bold text-ink">
                  {money(sale.price)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
