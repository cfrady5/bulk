'use client'

import { useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { Card, SectionLabel, inputClass } from '@/components/ui'
import { percent, tierLabel } from '@/lib/format'
import { useData } from '@/hooks/useData'
import type { BuyFlow } from '@/hooks/useBuyFlow'

/** Team → group → tier → need resolution, with override controls. */
export function NeedPanel({ flow, teamsAvailable }: { flow: BuyFlow; teamsAvailable: boolean }) {
  const [showOverrides, setShowOverrides] = useState(false)
  const r = flow.resolution

  if (flow.status !== 'done' && flow.status !== 'error') return null

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <SectionLabel>Team &amp; Need</SectionLabel>
        {!flow.teamManuallySet && flow.card.teamId && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-accent">
            <Sparkles size={12} /> auto-detected
          </span>
        )}
      </div>

      <TeamSelect flow={flow} disabled={!teamsAvailable} />

      {r?.teamGroup && r.tier ? (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-muted px-3.5 py-3">
          <div>
            <p className="text-lg leading-tight font-bold tracking-wide text-ink uppercase">
              {r.teamGroup.name}
            </p>
            <p className="text-[12px] font-medium text-ink-soft">
              {tierLabel(r.tier.minimumValue, r.tier.maximumValue)} tier
            </p>
          </div>
          <div className="text-right">
            {r.need && r.quantityRemaining > 0 ? (
              <>
                <p className="tnum text-2xl leading-tight font-bold text-buy">
                  {r.quantityRemaining}
                </p>
                <p className="text-[11px] font-semibold tracking-wide text-buy uppercase">
                  needed
                </p>
              </>
            ) : (
              <p className="rounded-full bg-pass-soft px-2.5 py-1 text-[11px] font-bold tracking-wide text-pass uppercase">
                No current need
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-surface-muted px-3.5 py-3 text-[13px] font-medium text-ink-soft">
          {flow.card.teamId
            ? 'This team is not in any group, or the value has no tier — set overrides below to price it anyway.'
            : 'Pick a team to resolve group, tier, and current need.'}
        </p>
      )}

      {r?.need && r.quantityRemaining <= 0 && (
        <label className="mt-2.5 flex items-center gap-2 text-[13px] font-medium text-ink">
          <input
            type="checkbox"
            checked={flow.needOverridden}
            onChange={(e) => flow.setNeedOverridden(e.target.checked)}
            className="h-4 w-4 accent-[#d97706]"
          />
          Buy anyway (override need)
        </label>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-muted px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.1em] text-ink-soft uppercase">
            Payout
          </p>
          <p className="tnum text-xl font-bold text-ink">
            {flow.payoutOverride !== ''
              ? `${flow.payoutOverride}%`
              : percent(r?.payoutPercentage ?? null, 0)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-muted px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.1em] text-ink-soft uppercase">
            Target Buy
          </p>
          <p className="tnum text-xl font-bold text-ink">
            {flow.targetOverride !== ''
              ? `${flow.targetOverride}%`
              : percent(r?.targetBuyPercentage ?? null, 0)}
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowOverrides((v) => !v)}
        className="mt-2.5 flex w-full items-center justify-center gap-1 py-1 text-[12px] font-semibold text-ink-soft"
      >
        Override rates
        <ChevronDown size={14} className={showOverrides ? 'rotate-180' : ''} />
      </button>
      {showOverrides && (
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="text-[10px] font-semibold text-ink-soft uppercase">Payout %</span>
            <input
              inputMode="decimal"
              type="number"
              min={0}
              max={200}
              placeholder="94"
              value={flow.payoutOverride}
              onChange={(e) => flow.setPayoutOverride(e.target.value)}
              className={`${inputClass} tnum mt-1`}
            />
          </label>
          <label>
            <span className="text-[10px] font-semibold text-ink-soft uppercase">Target %</span>
            <input
              inputMode="decimal"
              type="number"
              min={0}
              max={200}
              placeholder="87"
              value={flow.targetOverride}
              onChange={(e) => flow.setTargetOverride(e.target.value)}
              className={`${inputClass} tnum mt-1`}
            />
          </label>
        </div>
      )}
    </Card>
  )
}

function TeamSelect({ flow, disabled }: { flow: BuyFlow; disabled: boolean }) {
  const { data } = useData()
  const teams = data?.teams ?? []
  const sports = data?.sports ?? []
  return (
    <select
      value={flow.card.teamId ?? ''}
      disabled={disabled}
      onChange={(e) => {
        const teamId = e.target.value || null
        const team = teams.find((t) => t.id === teamId)
        flow.setTeamManuallySet(true)
        flow.setCard({ ...flow.card, teamId, sportId: team?.sportId ?? null })
      }}
      className={`${inputClass} appearance-none`}
    >
      <option value="">Select team…</option>
      {sports.map((sport) => (
        <optgroup key={sport.id} label={sport.name}>
          {teams
            .filter((t) => t.sportId === sport.id)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.city} {t.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}
