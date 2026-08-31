const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function money(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return usd.format(n)
}

/** Compact money for big display numbers: whole dollars under $10k. */
export function moneyCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return Math.abs(n) >= 10000
    ? `$${(n / 1000).toFixed(1)}k`
    : usdWhole.format(Math.round(n))
}

export function percent(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return `${(n * 100).toFixed(digits)}%`
}

export function saleDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    .toUpperCase()
}

export function fullDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function tierLabel(min: number, max: number | null): string {
  return max === null ? `$${min}+` : `$${min}–$${max}`
}
