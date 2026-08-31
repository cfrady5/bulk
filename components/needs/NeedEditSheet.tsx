'use client'

import { useState } from 'react'
import { Sheet, inputClass } from '@/components/ui'
import { useData } from '@/hooks/useData'
import { tierLabel } from '@/lib/format'
import type { TeamNeed } from '@/types/domain'

export function NeedEditSheet({
  need,
  onClose,
  onSave,
}: {
  need: TeamNeed | null
  onClose: () => void
  onSave: (need: TeamNeed) => Promise<void>
}) {
  const { data } = useData()
  const [qty, setQty] = useState('')
  const [acq, setAcq] = useState('')
  const [payout, setPayout] = useState('')
  const [target, setTarget] = useState('')
  const [key, setKey] = useState<string | null>(null)

  // Reinitialize local fields whenever a different need is opened.
  if (need && need.id !== key) {
    setKey(need.id)
    setQty(String(need.quantityNeeded))
    setAcq(String(need.quantityAcquired))
    setPayout((need.payoutPercentage * 100).toFixed(1).replace(/\.0$/, ''))
    setTarget((need.targetBuyPercentage * 100).toFixed(1).replace(/\.0$/, ''))
  }

  if (!need) return null
  const group = data?.teamGroups.find((g) => g.id === need.teamGroupId)
  const tier = data?.valueTiers.find((t) => t.id === need.valueTierId)

  return (
    <Sheet
      open={Boolean(need)}
      onClose={onClose}
      title={`${group?.name ?? ''} · ${tier ? tierLabel(tier.minimumValue, tier.maximumValue) : ''}`}
    >
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="text-[10px] font-semibold text-ink-soft uppercase">Needed</span>
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="numeric"
              type="number"
              min={0}
              className={`${inputClass} tnum mt-1 text-lg`}
            />
          </label>
          <label>
            <span className="text-[10px] font-semibold text-ink-soft uppercase">Acquired</span>
            <input
              value={acq}
              onChange={(e) => setAcq(e.target.value)}
              inputMode="numeric"
              type="number"
              min={0}
              className={`${inputClass} tnum mt-1 text-lg`}
            />
          </label>
          <label>
            <span className="text-[10px] font-semibold text-ink-soft uppercase">Payout %</span>
            <input
              value={payout}
              onChange={(e) => setPayout(e.target.value)}
              inputMode="decimal"
              type="number"
              min={0}
              max={200}
              className={`${inputClass} tnum mt-1 text-lg`}
            />
          </label>
          <label>
            <span className="text-[10px] font-semibold text-ink-soft uppercase">Target buy %</span>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              inputMode="decimal"
              type="number"
              min={0}
              max={200}
              className={`${inputClass} tnum mt-1 text-lg`}
            />
          </label>
        </div>
        <button
          onClick={() =>
            void onSave({
              ...need,
              quantityNeeded: Math.max(0, Number(qty) || 0),
              quantityAcquired: Math.max(0, Number(acq) || 0),
              payoutPercentage: Math.max(0, Number(payout) || 0) / 100,
              targetBuyPercentage: Math.max(0, Number(target) || 0) / 100,
              active: (Number(qty) || 0) > 0,
              updatedAt: new Date().toISOString(),
            })
          }
          className="w-full rounded-2xl bg-ink py-3.5 text-[15px] font-black tracking-wide text-white uppercase active:scale-[0.98]"
        >
          Save
        </button>
      </div>
    </Sheet>
  )
}
