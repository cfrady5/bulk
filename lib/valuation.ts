import type { CompStatistics, Confidence, EvaluatedSale } from '@/types/domain'

/** Coefficient-of-variation threshold above which we flag high price variance. */
export const HIGH_VARIANCE_CV = 0.25

export const EMPTY_STATISTICS: CompStatistics = {
  count: 0,
  average: null,
  median: null,
  low: null,
  high: null,
  lastSale: null,
  lastSaleDate: null,
  coefficientOfVariation: null,
  highVariance: false,
  confidence: 'none',
  autoValue: null,
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function baseConfidence(count: number): Confidence {
  if (count >= 5) return 'high'
  if (count >= 3) return 'medium'
  if (count >= 1) return 'low'
  return 'none'
}

function downgrade(confidence: Confidence): Confidence {
  if (confidence === 'high') return 'medium'
  if (confidence === 'medium') return 'low'
  return confidence
}

/**
 * Computes valuation statistics over the INCLUDED sales only.
 * Auto value is the median at 3+ comps, the average at 1-2.
 * High price variance (CV) downgrades confidence one step.
 */
export function computeStatistics(sales: EvaluatedSale[]): CompStatistics {
  const included = sales.filter((s) => s.included)
  if (included.length === 0) return EMPTY_STATISTICS

  const prices = included.map((s) => s.price)
  const sorted = [...prices].sort((a, b) => a - b)
  const count = prices.length
  const sum = prices.reduce((a, b) => a + b, 0)
  const average = sum / count
  const med = median(sorted)

  let cv: number | null = null
  if (count >= 2 && average > 0) {
    const variance = prices.reduce((acc, p) => acc + (p - average) ** 2, 0) / count
    cv = Math.sqrt(variance) / average
  }
  const highVariance = cv !== null && cv > HIGH_VARIANCE_CV

  const byDate = [...included].sort((a, b) =>
    (b.soldAt ?? '').localeCompare(a.soldAt ?? ''),
  )
  const last = byDate[0]

  let confidence = baseConfidence(count)
  if (highVariance) confidence = downgrade(confidence)

  return {
    count,
    average,
    median: med,
    low: sorted[0],
    high: sorted[sorted.length - 1],
    lastSale: last?.price ?? null,
    lastSaleDate: last?.soldAt ?? null,
    coefficientOfVariation: cv,
    highVariance,
    confidence,
    autoValue: count >= 3 ? med : average,
  }
}
