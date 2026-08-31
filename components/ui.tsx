'use client'

import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={clsx('rounded-2xl bg-surface p-4 shadow-lg shadow-black/20', className)}>
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-soft uppercase">
      {children}
    </p>
  )
}

export function Chip({
  children,
  active = false,
  tone = 'neutral',
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  tone?: 'neutral' | 'buy' | 'negotiate' | 'pass'
  onClick?: () => void
}) {
  const tones = {
    neutral: active ? 'bg-ink text-white' : 'bg-surface-muted text-ink-soft',
    buy: 'bg-buy-soft text-buy',
    negotiate: 'bg-negotiate-soft text-negotiate',
    pass: 'bg-pass-soft text-pass',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={clsx(
        'rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
        tones[tone],
        onClick && 'active:scale-95',
      )}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-line bg-surface-muted px-3 py-2.5 text-[15px] font-medium text-ink outline-none focus:border-accent focus:bg-surface'

export function Stat({
  label,
  value,
  big = false,
  tone,
}: {
  label: string
  value: string
  big?: boolean
  tone?: 'buy' | 'pass' | 'muted'
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.1em] text-ink-soft uppercase">
        {label}
      </p>
      <p
        className={clsx(
          'tnum font-semibold',
          big ? 'text-2xl' : 'text-[15px]',
          tone === 'buy' && 'text-buy',
          tone === 'pass' && 'text-pass',
          tone === 'muted' && 'text-ink-soft',
        )}
      >
        {value}
      </p>
    </div>
  )
}

/** Bottom sheet for fast mobile sub-flows. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-surface-muted p-2 text-ink-soft"
            aria-label="Close sheet"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
