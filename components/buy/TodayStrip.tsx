'use client'

import { useData } from '@/hooks/useData'
import { moneyCompact } from '@/lib/format'

/** Compact TODAY summary at the top of the buy screen. */
export function TodayStrip() {
  const { data, activeShowId } = useData()
  const today = new Date().toDateString()
  const purchases = (data?.purchases ?? []).filter(
    (p) =>
      p.status === 'purchased' &&
      new Date(p.purchasedAt).toDateString() === today &&
      (activeShowId === null || p.showId === activeShowId),
  )
  const spent = purchases.reduce((a, p) => a + p.actualPurchasePrice, 0)
  const payout = purchases.reduce((a, p) => a + p.expectedPayout, 0)
  const profit = payout - spent

  const show = data?.shows.find((s) => s.id === activeShowId)

  const cell = (label: string, value: string, accent = false) => (
    <div className="flex-1 text-center">
      <p className={`tnum text-[17px] font-bold ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-[10px] font-medium tracking-wide text-white/40 uppercase">{label}</p>
    </div>
  )

  return (
    <div className="rounded-2xl bg-canvas-raised px-3 py-3">
      <p className="mb-2 text-center text-[10px] font-semibold tracking-[0.15em] text-white/35 uppercase">
        {show ? show.name : 'Today'}
      </p>
      <div className="flex items-center divide-x divide-white/10">
        {cell('Bought', String(purchases.length))}
        {cell('Spent', moneyCompact(spent))}
        {cell('Payout', moneyCompact(payout))}
        {cell('Profit', `${profit >= 0 ? '+' : ''}${moneyCompact(profit)}`, profit > 0)}
      </div>
    </div>
  )
}
