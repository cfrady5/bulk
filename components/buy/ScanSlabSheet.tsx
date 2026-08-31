'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, ScanLine } from 'lucide-react'
import { Field, Sheet, inputClass } from '@/components/ui'
import type { BuyFlow } from '@/hooks/useBuyFlow'
import type { CertificationDetails } from '@/lib/grading/types'

/**
 * Slab-scanning entry point. Full recognition isn't built yet, so this is an
 * honest placeholder: capture a slab photo now, look up a PSA cert when the
 * PSA API is configured, and fall back to manual entry otherwise.
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
        flow.setCard({
          ...flow.card,
          grader: 'PSA',
          grade: body.cert.grade,
          certNumber: body.cert.certNumber,
          playerName: body.cert.playerName ?? flow.card.playerName,
          year: body.cert.year ?? flow.card.year,
          product: body.cert.setName ?? flow.card.product,
          cardNumber: body.cert.cardNumber ?? flow.card.cardNumber,
          parallel: body.cert.parallel ?? flow.card.parallel,
        })
        setMessage('Cert loaded — review the card details, then find comps.')
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
    <Sheet open={open} onClose={onClose} title="Scan Slab">
      <div className="space-y-4">
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
              <span className="text-[12px]">
                Automatic label recognition is coming — the photo is saved with the card now.
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
          <div className="flex gap-2">
            <input
              value={cert}
              onChange={(e) => setCert(e.target.value)}
              inputMode="numeric"
              placeholder="12345678"
              className={inputClass}
            />
            <button
              onClick={() => void lookup()}
              disabled={busy || !cert.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:opacity-40"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
              Look up
            </button>
          </div>
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
