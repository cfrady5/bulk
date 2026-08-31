'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useBuyFlow } from '@/hooks/useBuyFlow'
import { useData } from '@/hooks/useData'
import { TodayStrip } from '@/components/buy/TodayStrip'
import { QuickSearch } from '@/components/buy/QuickSearch'
import { CompResults } from '@/components/buy/CompResults'
import { ValuationPanel } from '@/components/buy/ValuationPanel'
import { NeedPanel } from '@/components/buy/NeedPanel'
import { DecisionCard } from '@/components/buy/DecisionCard'
import { AddCardSheet } from '@/components/buy/AddCardSheet'
import { ScanSlabSheet } from '@/components/buy/ScanSlabSheet'

export default function BuyPage() {
  const { data, loading } = useData()
  const flow = useBuyFlow()
  const [addOpen, setAddOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)

  return (
    <main className="space-y-3.5 px-3.5 pt-[calc(env(safe-area-inset-top)+14px)]">
      <header className="flex items-center justify-between px-1">
        <h1 className="text-xl font-black tracking-tight text-white">
          Card<span className="text-accent">Desk</span>
        </h1>
        {flow.lastSaved && flow.status === 'idle' && (
          <span className="flex items-center gap-1 text-[12px] font-semibold text-emerald-400">
            <CheckCircle2 size={14} /> Saved {flow.lastSaved}
          </span>
        )}
      </header>

      <TodayStrip />

      <QuickSearch
        flow={flow}
        onAddCard={() => setAddOpen(true)}
        onScanSlab={() => setScanOpen(true)}
      />

      {flow.status === 'loading' && (
        <div className="space-y-3.5" aria-hidden>
          {[64, 200, 160].map((h, i) => (
            <div
              key={i}
              style={{ height: h }}
              className="animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      )}

      <CompResults flow={flow} />
      <ValuationPanel flow={flow} />
      <NeedPanel flow={flow} teamsAvailable={!loading && (data?.teams.length ?? 0) > 0} />
      <DecisionCard flow={flow} />

      {flow.status === 'idle' && (
        <p className="px-4 pt-6 text-center text-[13px] leading-relaxed font-medium text-white/35">
          Search a card to pull recent sales, resolve the team need, and get an instant
          BUY / NEGOTIATE / PASS call with your max buy price.
        </p>
      )}

      <AddCardSheet flow={flow} open={addOpen} onClose={() => setAddOpen(false)} />
      <ScanSlabSheet flow={flow} open={scanOpen} onClose={() => setScanOpen(false)} />
    </main>
  )
}
