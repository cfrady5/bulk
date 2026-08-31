'use client'

import clsx from 'clsx'
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Scale,
  XCircle,
} from 'lucide-react'
import { Card, Chip, SectionLabel } from '@/components/ui'
import { money, percent } from '@/lib/format'
import { RULE_TAGS, type Decision, type RuleTag } from '@/types/domain'
import type { BuyFlow } from '@/hooks/useBuyFlow'
import { useState } from 'react'

const DECISION_META: Record<
  Decision,
  { label: string; sub?: string; icon: typeof CheckCircle2; bg: string; fg: string }
> = {
  buy: { label: 'BUY', icon: CheckCircle2, bg: 'bg-buy', fg: 'text-white' },
  negotiate: { label: 'NEGOTIATE', icon: Scale, bg: 'bg-negotiate', fg: 'text-white' },
  pass: { label: 'PASS', icon: XCircle, bg: 'bg-pass', fg: 'text-white' },
  'no-need': {
    label: 'NO CURRENT NEED',
    sub: 'Override above to buy anyway',
    icon: AlertTriangle,
    bg: 'bg-canvas-raised',
    fg: 'text-white',
  },
  unknown: {
    label: 'ENTER SELLER ASK',
    icon: HelpCircle,
    bg: 'bg-surface-muted',
    fg: 'text-ink-soft',
  },
}

/** MARKET → PAYOUT → MAX BUY → ASK → decision → SAVE. Everything in one glance. */
export function DecisionCard({ flow }: { flow: BuyFlow }) {
  const [showNotes, setShowNotes] = useState(false)
  const s = flow.summary
  if (flow.status !== 'done' && flow.status !== 'error') return null
  if (!s) {
    if (flow.marketValue === null) return null
    return (
      <Card>
        <p className="text-center text-[13px] font-medium text-ink-soft">
          Select a team with an active need — or set payout and target overrides — to get
          a buy price.
        </p>
      </Card>
    )
  }

  const meta = DECISION_META[s.decision]
  const Icon = meta.icon

  return (
    <Card className="space-y-4">
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
        <BigStat label="Market" value={money(s.marketValue)} />
        <BigStat label={`Payout · ${percent(s.payoutPercentage, 0)}`} value={money(s.expectedPayout)} />
        <BigStat label={`Target · ${percent(s.targetBuyPercentage, 0)}`} value={money(s.targetBuyPrice)} accent />
        <label className="block">
          <span className="text-[10px] font-semibold tracking-[0.1em] text-ink-soft uppercase">
            Seller Ask
          </span>
          <input
            inputMode="decimal"
            type="number"
            min={0}
            step="1"
            placeholder="$"
            value={flow.askPrice}
            onChange={(e) => flow.setAskPrice(e.target.value)}
            className="tnum mt-0.5 w-full rounded-xl border-2 border-accent bg-surface px-3 py-1.5 text-2xl font-bold text-ink outline-none"
          />
        </label>
      </div>

      <div
        className={clsx('flex items-center justify-between rounded-2xl px-4 py-3.5', meta.bg)}
        role="status"
      >
        <div className={clsx('flex items-center gap-2.5', meta.fg)}>
          <Icon size={26} strokeWidth={2.5} />
          <div>
            <p className="text-xl leading-none font-black tracking-wide">{meta.label}</p>
            {meta.sub && <p className="mt-1 text-[11px] font-medium opacity-80">{meta.sub}</p>}
          </div>
        </div>
        {s.expectedProfit !== null && s.decision !== 'unknown' && (
          <div className={clsx('text-right', meta.fg)}>
            <p className="tnum text-xl leading-none font-black">
              {s.expectedProfit >= 0 ? '+' : ''}
              {money(s.expectedProfit)}
            </p>
            <p className="mt-1 text-[11px] font-semibold opacity-85">
              {s.roi !== null ? `${(s.roi * 100).toFixed(1)}% ROI` : ''}
              {s.acquisitionPercentage !== null
                ? ` · ${(s.acquisitionPercentage * 100).toFixed(1)}% of market`
                : ''}
            </p>
          </div>
        )}
      </div>

      {flow.warnings.length > 0 && (
        <ul className="space-y-1">
          {flow.warnings.map((w) => (
            <li key={w} className="flex items-center gap-1.5 text-[12px] font-medium text-negotiate">
              <AlertTriangle size={13} /> {w}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setShowNotes((v) => !v)}
        className="w-full text-left text-[12px] font-semibold text-ink-soft"
      >
        {showNotes ? '− Notes, tags & seller' : '+ Notes, tags & seller'}
      </button>
      {showNotes && (
        <div className="space-y-3">
          <textarea
            value={flow.notes}
            onChange={(e) => flow.setNotes(e.target.value)}
            placeholder={'e.g. "pay lower on Leaf", "only one sale"'}
            rows={2}
            className="w-full rounded-xl border border-line bg-surface-muted px-3 py-2 text-[14px] font-medium text-ink outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-1.5">
            {RULE_TAGS.map((tag) => (
              <Chip
                key={tag}
                active={flow.ruleTags.includes(tag)}
                onClick={() =>
                  flow.setRuleTags(
                    flow.ruleTags.includes(tag)
                      ? flow.ruleTags.filter((t: RuleTag) => t !== tag)
                      : [...flow.ruleTags, tag],
                  )
                }
              >
                {tag}
              </Chip>
            ))}
          </div>
          <input
            value={flow.sellerName}
            onChange={(e) => flow.setSellerName(e.target.value)}
            placeholder="Seller / table name (optional)"
            className="w-full rounded-xl border border-line bg-surface-muted px-3 py-2 text-[14px] font-medium text-ink outline-none focus:border-accent"
          />
        </div>
      )}

      <div className="space-y-2">
        <button
          disabled={flow.saving || flow.askPrice === ''}
          onClick={() => void flow.save(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-[16px] font-black tracking-wide text-white uppercase active:scale-[0.98] disabled:opacity-40"
        >
          {flow.saving && <Loader2 size={18} className="animate-spin" />}
          Save + Add Next
        </button>
        <button
          disabled={flow.saving || flow.askPrice === ''}
          onClick={() => void flow.save(false)}
          className="w-full rounded-2xl bg-surface-muted py-3 text-[14px] font-bold text-ink active:scale-[0.98] disabled:opacity-40"
        >
          Save Purchase
        </button>
      </div>
      <SectionLabel>
        Paid price = seller ask above. Adjust it to the negotiated price before saving.
      </SectionLabel>
    </Card>
  )
}

function BigStat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.1em] text-ink-soft uppercase">{label}</p>
      <p className={clsx('tnum text-2xl font-bold', accent ? 'text-buy' : 'text-ink')}>{value}</p>
    </div>
  )
}
