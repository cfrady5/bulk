'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, Chip, SectionLabel, Stat, inputClass } from '@/components/ui'
import { money } from '@/lib/format'
import type { BuyFlow } from '@/hooks/useBuyFlow'
import type { Confidence } from '@/types/domain'

const CONFIDENCE_LABEL: Record<Confidence, { label: string; tone: 'buy' | 'negotiate' | 'pass' }> = {
  high: { label: 'High Confidence', tone: 'buy' },
  medium: { label: 'Medium Confidence', tone: 'negotiate' },
  low: { label: 'Low Confidence', tone: 'pass' },
  none: { label: 'No Comps', tone: 'pass' },
}

export function ValuationPanel({ flow }: { flow: BuyFlow }) {
  const { stats } = flow
  if (flow.status !== 'done' && flow.status !== 'error') return null
  const conf = CONFIDENCE_LABEL[stats.confidence]

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <SectionLabel>Market Value</SectionLabel>
        <div className="flex gap-1.5">
          <Chip tone={conf.tone}>{conf.label}</Chip>
        </div>
      </div>

      {stats.highVariance && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-negotiate-soft px-2.5 py-1.5 text-[12px] font-semibold text-negotiate">
          <AlertTriangle size={14} /> High price variance — check the comps
        </p>
      )}

      {stats.count > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-x-2 gap-y-3">
          <Stat label="Comps" value={String(stats.count)} />
          <Stat label="Median" value={money(stats.median)} />
          <Stat label="Average" value={money(stats.average)} />
          <Stat label="Low" value={money(stats.low)} tone="muted" />
          <Stat label="High" value={money(stats.high)} tone="muted" />
          <Stat label="Last Sale" value={money(stats.lastSale)} />
        </div>
      )}

      <div className="grid grid-cols-2 items-end gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.1em] text-ink-soft uppercase">
            Auto Value
          </p>
          <p className="tnum text-3xl font-bold text-ink">{money(flow.adjustedAutoValue)}</p>
          {flow.appliedRules.map((r) => (
            <p key={r} className="text-[11px] font-medium text-negotiate">
              {r} applied
            </p>
          ))}
        </div>
        <label className="block">
          <span className="text-[10px] font-semibold tracking-[0.1em] text-ink-soft uppercase">
            Manual Override
          </span>
          <input
            inputMode="decimal"
            type="number"
            min={0}
            step="0.01"
            placeholder="$"
            value={flow.manualValue}
            onChange={(e) => flow.setManualValue(e.target.value)}
            className={`${inputClass} tnum mt-1 text-lg font-bold`}
          />
        </label>
      </div>
      {flow.manualValue !== '' && (
        <p className="mt-2 text-[12px] font-medium text-accent">
          Using manual value — auto value preserved for the record.
        </p>
      )}
    </Card>
  )
}
