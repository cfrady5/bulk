'use client'

import { Loader2, Plus, ScanLine, Search } from 'lucide-react'
import type { BuyFlow } from '@/hooks/useBuyFlow'

export function QuickSearch({
  flow,
  onAddCard,
  onScanSlab,
}: {
  flow: BuyFlow
  onAddCard: () => void
  onScanSlab: () => void
}) {
  const busy = flow.status === 'loading'
  return (
    <div className="space-y-2.5">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void flow.search()
        }}
        className="flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-lg shadow-black/20"
      >
        <Search size={18} className="ml-2 shrink-0 text-ink-soft" />
        <input
          value={flow.query}
          onChange={(e) => flow.setQuery(e.target.value)}
          placeholder="2024 Prizm Caleb Williams Silver PSA 10"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] font-medium text-ink outline-none placeholder:text-ink-soft/60"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : 'Find Comps'}
        </button>
      </form>

      <div className="flex gap-2.5">
        <button
          onClick={onAddCard}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-accent py-3 text-sm font-bold text-white shadow-lg shadow-black/20 active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.6} /> Add Card
        </button>
        <button
          onClick={onScanSlab}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-canvas-raised py-3 text-sm font-bold text-white/80 ring-1 ring-white/10 active:scale-[0.98]"
        >
          <ScanLine size={18} /> Scan Slab
        </button>
      </div>

      {flow.status === 'error' && flow.searchError && (
        <div className="rounded-xl bg-pass-soft px-3.5 py-2.5 text-[13px] font-medium text-pass">
          {flow.searchError}
        </div>
      )}
    </div>
  )
}
