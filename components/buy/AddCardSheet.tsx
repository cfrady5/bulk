'use client'

import { useRef } from 'react'
import { Camera } from 'lucide-react'
import { Field, Sheet, inputClass } from '@/components/ui'
import { useData } from '@/hooks/useData'
import type { BuyFlow } from '@/hooks/useBuyFlow'
import type { Grader } from '@/types/domain'

const GRADERS: Grader[] = ['Raw', 'PSA', 'BGS', 'SGC', 'CGC', 'Other']
const GRADES = ['10', '9.5', '9', '8.5', '8', '7', '6', '5']
const PRODUCTS = [
  'Prizm', 'Select', 'Mosaic', 'Optic', 'Donruss', 'Topps Chrome', 'Bowman Chrome',
  'National Treasures', 'Flawless', 'Immaculate', 'Contenders', 'Leaf',
]
const PARALLELS = [
  'Base', 'Silver', 'Holo', 'Red', 'Blue', 'Green', 'Gold', 'Orange Lazer',
  'Cracked Ice', 'Red White Blue', 'Purple', 'Green Wave',
]

/**
 * Structured fast-entry. Fields build the comp query so typing stays minimal;
 * photos are stored with the card for future OCR/visual identification.
 */
export function AddCardSheet({
  flow,
  open,
  onClose,
}: {
  flow: BuyFlow
  open: boolean
  onClose: () => void
}) {
  const { data } = useData()
  const card = flow.card
  const set = (patch: Partial<typeof card>) => flow.setCard({ ...card, ...patch })
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  const graded = card.grader !== '' && card.grader !== 'Raw'

  const buildQuery = () =>
    [
      card.year,
      card.product,
      card.playerName,
      card.parallel && card.parallel !== 'Base' ? card.parallel : '',
      card.cardNumber ? `#${card.cardNumber}` : '',
      graded ? `${card.grader} ${card.grade}`.trim() : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim()

  const readPhoto = (file: File | undefined, key: 'imageFront' | 'imageBack') => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set({ [key]: String(reader.result) })
    reader.readAsDataURL(file)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add Card">
      <div className="space-y-3.5">
        <Field label="Player">
          <input
            value={card.playerName}
            onChange={(e) => set({ playerName: e.target.value })}
            placeholder="CJ Stroud"
            autoCapitalize="words"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Year">
            <input
              value={card.year}
              onChange={(e) => set({ year: e.target.value })}
              inputMode="numeric"
              placeholder="2023"
              className={inputClass}
            />
          </Field>
          <Field label="Card #">
            <input
              value={card.cardNumber}
              onChange={(e) => set({ cardNumber: e.target.value })}
              placeholder="301"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Product / Set">
          <input
            value={card.product}
            onChange={(e) => set({ product: e.target.value })}
            placeholder="Prizm"
            list="products"
            className={inputClass}
          />
          <datalist id="products">
            {PRODUCTS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Parallel">
            <input
              value={card.parallel}
              onChange={(e) => set({ parallel: e.target.value })}
              placeholder="Silver"
              list="parallels"
              className={inputClass}
            />
            <datalist id="parallels">
              {PARALLELS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
          <Field label="Serial #">
            <input
              value={card.serialNumber}
              onChange={(e) => set({ serialNumber: e.target.value })}
              placeholder="/99"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Grader">
          <div className="flex flex-wrap gap-1.5">
            {GRADERS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set({ grader: g, grade: g === 'Raw' ? '' : card.grade })}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold ${
                  card.grader === g ? 'bg-ink text-white' : 'bg-surface-muted text-ink-soft'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </Field>

        {graded && (
          <>
            <Field label="Grade">
              <div className="flex flex-wrap gap-1.5">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set({ grade: g })}
                    className={`tnum rounded-full px-3.5 py-1.5 text-[13px] font-bold ${
                      card.grade === g ? 'bg-ink text-white' : 'bg-surface-muted text-ink-soft'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>
            {(card.grader === 'PSA' || card.grader === 'BGS') && (
              <Field label="Cert Number">
                <input
                  value={card.certNumber}
                  onChange={(e) => set({ certNumber: e.target.value })}
                  inputMode="numeric"
                  placeholder="12345678"
                  className={inputClass}
                />
              </Field>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sport">
            <select
              value={card.sportId ?? ''}
              onChange={(e) => set({ sportId: e.target.value || null })}
              className={`${inputClass} appearance-none`}
            >
              <option value="">—</option>
              {(data?.sports ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Team">
            <select
              value={card.teamId ?? ''}
              onChange={(e) => {
                const team = data?.teams.find((t) => t.id === e.target.value)
                flow.setTeamManuallySet(true)
                set({ teamId: e.target.value || null, sportId: team?.sportId ?? card.sportId })
              }}
              className={`${inputClass} appearance-none`}
            >
              <option value="">—</option>
              {(data?.teams ?? [])
                .filter((t) => !card.sportId || t.sportId === card.sportId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.city} {t.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>

        <div className="flex gap-3">
          {(
            [
              ['Front', frontRef, card.imageFront, 'imageFront'],
              ['Back / Slab', backRef, card.imageBack, 'imageBack'],
            ] as const
          ).map(([label, ref, value, key]) => (
            <button
              key={label}
              type="button"
              onClick={() => ref.current?.click()}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-dashed border-line bg-surface-muted py-3 text-[12px] font-semibold text-ink-soft"
            >
              {value ? (
                // eslint-disable-next-line @next/next/no-img-element -- local data URI preview
                <img src={value} alt={label} className="h-16 rounded object-cover" />
              ) : (
                <Camera size={20} />
              )}
              {label} photo
              <input
                ref={ref}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => readPhoto(e.target.files?.[0], key)}
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            const q = buildQuery()
            onClose()
            if (q) void flow.search({ query: q })
          }}
          className="w-full rounded-2xl bg-accent py-3.5 text-[15px] font-black tracking-wide text-white uppercase active:scale-[0.98]"
        >
          Find Comps
        </button>
      </div>
    </Sheet>
  )
}
