import type { AppData } from '@/lib/data/types'
import type { Purchase } from '@/types/domain'

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const HEADERS = [
  'Card',
  'Player',
  'Year',
  'Set',
  'Parallel',
  'Card Number',
  'Serial Number',
  'Cert',
  'Grade',
  'Team',
  'Team Group',
  'Market Value',
  'Payout %',
  'Expected Payout',
  'Target Buy %',
  'Target Buy Price',
  'Actual Paid',
  'Expected Profit',
  'ROI',
  'Notes',
  'Purchased At',
  'Buyer',
  'Show',
]

export function purchasesToCsv(
  purchases: Purchase[],
  data: Pick<AppData, 'teams' | 'teamGroups' | 'shows'>,
  buyerName = '',
): string {
  const rows = purchases.map((p) => {
    const team = data.teams.find((t) => t.id === p.card.teamId)
    const group = data.teamGroups.find((g) => g.id === p.teamGroupId)
    const show = data.shows.find((s) => s.id === p.showId)
    const cardLabel = [p.card.year, p.card.product, p.card.parallel, p.card.cardNumber && `#${p.card.cardNumber}`]
      .filter(Boolean)
      .join(' ')
    return [
      cardLabel,
      p.card.playerName,
      p.card.year,
      p.card.product,
      p.card.parallel,
      p.card.cardNumber,
      p.card.serialNumber,
      p.card.certNumber,
      p.card.grader ? `${p.card.grader} ${p.card.grade}`.trim() : p.card.grade,
      team ? `${team.city} ${team.name}` : '',
      group?.name ?? '',
      p.marketValue.toFixed(2),
      (p.payoutPercentage * 100).toFixed(1),
      p.expectedPayout.toFixed(2),
      (p.targetBuyPercentage * 100).toFixed(1),
      p.targetBuyPrice.toFixed(2),
      p.actualPurchasePrice.toFixed(2),
      p.expectedProfit.toFixed(2),
      (p.expectedRoi * 100).toFixed(2),
      p.notes,
      p.purchasedAt,
      buyerName,
      show?.name ?? '',
    ]
      .map(esc)
      .join(',')
  })
  return [HEADERS.join(','), ...rows].join('\n')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
