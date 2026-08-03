/**
 * Break pricing math (spec §11). Financially correct target-revenue formulas
 * with the markup-vs-margin distinction made explicit.
 *
 * Money is integer cents; markup/margin are decimal fractions (0.30 === 30%).
 * Revenue results are exact integer cents (sums); average spot prices may be
 * fractional cents — round them for display with `roundPrice`.
 */
import { Cents } from './money';

export function breakEvenRevenue(totalBreakCostCents: Cents): Cents {
  return totalBreakCostCents;
}

export function breakEvenSpotPrice(totalBreakCostCents: Cents, spots: number): number {
  if (spots <= 0) return 0;
  return totalBreakCostCents / spots;
}

/** required_revenue = total_break_cost + target_profit */
export function requiredRevenueForProfit(
  totalBreakCostCents: Cents,
  targetProfitCents: Cents,
): Cents {
  return totalBreakCostCents + targetProfitCents;
}

/** required_revenue = total_break_cost × (1 + markup) */
export function requiredRevenueForMarkup(totalBreakCostCents: Cents, markup: number): Cents {
  if (markup < 0) throw new RangeError('markup must be >= 0');
  return Math.round(totalBreakCostCents * (1 + markup));
}

/**
 * required_revenue = total_break_cost / (1 − margin)
 * Margin must be < 1 (100%); at or above 100% is mathematically impossible.
 */
export function requiredRevenueForMargin(totalBreakCostCents: Cents, margin: number): Cents {
  if (margin < 0) throw new RangeError('margin must be >= 0');
  if (margin >= 1) throw new RangeError('margin must be < 1 (100%)');
  return Math.round(totalBreakCostCents / (1 - margin));
}

/** required_average_spot_price = required_revenue / number_of_spots */
export function requiredAverageSpotPrice(requiredRevenueCents: Cents, spots: number): number {
  if (spots <= 0) return 0;
  return requiredRevenueCents / spots;
}

/** Convert a markup fraction to the equivalent margin fraction. */
export function markupToMargin(markup: number): number {
  return markup / (1 + markup);
}

/** Convert a margin fraction (<1) to the equivalent markup fraction. */
export function marginToMarkup(margin: number): number {
  if (margin >= 1) throw new RangeError('margin must be < 1 (100%)');
  return margin / (1 - margin);
}

export type PricingTarget =
  | { type: 'profit'; profitCents: Cents }
  | { type: 'markup'; markup: number }
  | { type: 'margin'; margin: number };

export interface PricingResult {
  requiredRevenueCents: Cents;
  requiredAverageSpotPriceCents: number;
  impliedProfitCents: Cents;
  impliedMargin: number;
  impliedMarkup: number;
}

/** Resolve any target into required revenue + per-spot price + implied metrics. */
export function computePricing(
  totalBreakCostCents: Cents,
  spots: number,
  target: PricingTarget,
): PricingResult {
  let requiredRevenueCents: Cents;
  switch (target.type) {
    case 'profit':
      requiredRevenueCents = requiredRevenueForProfit(totalBreakCostCents, target.profitCents);
      break;
    case 'markup':
      requiredRevenueCents = requiredRevenueForMarkup(totalBreakCostCents, target.markup);
      break;
    case 'margin':
      requiredRevenueCents = requiredRevenueForMargin(totalBreakCostCents, target.margin);
      break;
  }
  const impliedProfitCents = requiredRevenueCents - totalBreakCostCents;
  return {
    requiredRevenueCents,
    requiredAverageSpotPriceCents: requiredAverageSpotPrice(requiredRevenueCents, spots),
    impliedProfitCents,
    impliedMargin: requiredRevenueCents !== 0 ? impliedProfitCents / requiredRevenueCents : 0,
    impliedMarkup: totalBreakCostCents !== 0 ? impliedProfitCents / totalBreakCostCents : 0,
  };
}
