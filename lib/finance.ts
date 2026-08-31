import type { Decision, FinancialSummary } from '@/types/domain'

/** All money math lives here so every screen agrees on the numbers. */

export const round2 = (n: number): number => Math.round(n * 100) / 100

export function expectedPayout(marketValue: number, payoutPercentage: number): number {
  return round2(marketValue * payoutPercentage)
}

export function targetBuyPrice(marketValue: number, targetBuyPercentage: number): number {
  return round2(marketValue * targetBuyPercentage)
}

export function expectedProfit(payout: number, actualPurchasePrice: number): number {
  return round2(payout - actualPurchasePrice)
}

export function roi(profit: number, actualPurchasePrice: number): number | null {
  if (actualPurchasePrice <= 0) return null
  return profit / actualPurchasePrice
}

export function acquisitionPercentage(
  actualPurchasePrice: number,
  marketValue: number,
): number | null {
  if (marketValue <= 0) return null
  return actualPurchasePrice / marketValue
}

export function decide(
  askingPrice: number | null,
  target: number,
  payout: number,
  quantityRemaining: number | null,
  needOverridden: boolean,
): Decision {
  if (quantityRemaining !== null && quantityRemaining <= 0 && !needOverridden) {
    return 'no-need'
  }
  if (askingPrice === null || askingPrice <= 0) return 'unknown'
  if (askingPrice <= target) return 'buy'
  if (askingPrice <= payout) return 'negotiate'
  return 'pass'
}

export function summarize(params: {
  marketValue: number
  payoutPercentage: number
  targetBuyPercentage: number
  askingPrice: number | null
  quantityRemaining: number | null
  needOverridden: boolean
}): FinancialSummary {
  const payout = expectedPayout(params.marketValue, params.payoutPercentage)
  const target = targetBuyPrice(params.marketValue, params.targetBuyPercentage)
  const ask = params.askingPrice
  const profit = ask !== null && ask > 0 ? expectedProfit(payout, ask) : null
  return {
    marketValue: params.marketValue,
    payoutPercentage: params.payoutPercentage,
    targetBuyPercentage: params.targetBuyPercentage,
    expectedPayout: payout,
    targetBuyPrice: target,
    askingPrice: ask,
    expectedProfit: profit,
    roi: profit !== null && ask !== null ? roi(profit, ask) : null,
    acquisitionPercentage:
      ask !== null && ask > 0 ? acquisitionPercentage(ask, params.marketValue) : null,
    decision: decide(ask, target, payout, params.quantityRemaining, params.needOverridden),
  }
}
