'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, Loader2, ScanLine } from 'lucide-react'
import { Field, Sheet, inputClass } from '@/components/ui'
import type { BuyFlow } from '@/hooks/useBuyFlow'
import type { CardDetails } from '@/types/domain'
import type { CertificationDetails } from '@/lib/grading/types'

/**
 * PSA slab search: photograph the slab, enter (or later OCR) the cert number,
 * and the cert lookup fills the card + immediately runs the comp search.
 * When PSA_API_TOKEN isn't configured the sheet says so and manual entry
 * still works — no data is ever faked.
 */
export function ScanSlabSheet({
  flow,
  open,
  onClose,
}: {
  flow: BuyFlow
  open: boolean
  onClose: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [cert, setCert] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    if (!open || configured !== null) return
    void fetch('/api/grading/psa')
      .then((r) => r.json())
      .then((b: { configured?: boolean }) => setConfigured(b.configured ?? false))
      .catch(() => setConfigured(false))
  }, [open, configured])

  const buildQuery = (card: CardDetails): string =>
    [
      card.year,
      card.product,
      card.playerName,
      card.parallel,
      card.cardNumber ? `#${card.cardNumber}` : '',
      `PSA ${card.grade}`.trim(),
    ]
      .filter(Boolean)
      .join(' ')
      .trim()

  const lookup = async () => {
    if (!cert.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/grading/psa', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ certNumber: cert.trim() }),
      })
      const body = (await res.json()) as { cert?: CertificationDetails; error?: string }
      if (res.ok && body.cert) {
        const c = body.cert
        const card: CardDetails = {
          ...flow.card,
          grader: 'PSA',
          grade: c.grade || flow.card.grade,
          certNumber: c.certNumber,
          playerName: c.playerName ?? flow.card.playerName,
          year: c.year ?? flow.card.year,
          product: c.setName ?? flow.card.product,
          cardNumber: c.cardNumber ?? flow.card.cardNumber,
          parallel: c.parallel ?? flow.card.parallel,
        }
        flow.setCard(card)
        // Straight into the money question: close the sheet and pull comps.
        onClose()
        void flow.search({ query: buildQuery(card) })
      } else {
        setMessage(body.error ?? 'Lookup failed — enter the card manually.')
      }
    } catch {
      setMessage('Network failure — enter the card manually.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Scan PSA Slab">
      <div className="space-y-4">
        {configured !== null && (
          <p
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[12px] font-semibold ${
              configured ? 'bg-buy-soft text-buy' : 'bg-negotiate-soft text-negotiate'
            }`}
          >
            {configured ? (
              <>
                <CheckCircle2 size={14} className="shrink-0" />
                PSA lookup is active — enter a cert number to pull the card and comps.
              </>
            ) : (
              'PSA lookup is not configured yet (set PSA_API_TOKEN — free at psacard.com/publicapi). Cert entry below still saves with the card; use Add Card for details.'
            )}
          </p>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface-muted py-8 text-ink-soft"
        >
          {flow.card.imageSlab ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URI preview
            <img src={flow.card.imageSlab} alt="Slab" className="h-32 rounded-lg object-cover" />
          ) : (
            <>
              <Camera size={32} />
              <span className="text-sm font-semibold">Photograph the slab label</span>
              <span className="px-6 text-center text-[12px]">
                Automatic label OCR is coming — the photo is saved with the card now.
              </span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => flow.setCard({ ...flow.card, imageSlab: String(reader.result) })
              reader.readAsDataURL(file)
            }}
          />
        </button>

        <Field label="PSA Cert Number">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (configured) {
                void lookup()
              } else {
                flow.setCard({ ...flow.card, grader: 'PSA', certNumber: cert.trim() })
                setMessage('Cert saved with the card. Add details via Add Card, then find comps.')
              }
            }}
          >
            <input
              value={cert}
              onChange={(e) => setCert(e.target.value)}
              inputMode="numeric"
              enterKeyHint="search"
              placeholder="12345678"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={busy || !cert.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:opacity-40"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
              {configured ? 'Look up' : 'Save cert'}
            </button>
          </form>
        </Field>

        {message && (
          <p className="rounded-xl bg-surface-muted px-3.5 py-2.5 text-[13px] font-medium text-ink">
            {message}
          </p>
        )}
      </div>
    </Sheet>
  )
}
