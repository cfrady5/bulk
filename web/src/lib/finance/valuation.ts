/**
 * Card valuation math (spec §5). Keeps three distinct concepts separate:
 *  - purchase discount: bought below (or above) market at acquisition
 *  - market movement: value change since acquisition
 *  - unrealized gain: current value vs. total cost basis
 * All monetary values are integer cents; ratios are decimal fractions.
 */
import { Cents } from './money';

export interface ValuationInput {
  totalCostBasisCents: Cents;
  marketValueAtAcquisitionCents: Cents;
  currentEstimatedValueCents: Cents;
}

export interface ValuationResult {
  /** market_at_acquisition − total_cost_basis (positive = bought below market). */
  purchaseDiscountCents: Cents;
  /** purchase_discount / market_at_acquisition (null if market is 0). */
  purchaseDiscountPct: number | null;
  /** current_value − total_cost_basis. */
  unrealizedGainCents: Cents;
  /** unrealized_gain / total_cost_basis (null if basis is 0). */
  unrealizedGainPct: number | null;
  /** current_value − market_at_acquisition (change since acquisition). */
  marketMovementCents: Cents;
  underwater: boolean;
}

export function computeValuation(input: ValuationInput): ValuationResult {
  const { totalCostBasisCents, marketValueAtAcquisitionCents, currentEstimatedValueCents } =
    input;

  const purchaseDiscountCents = marketValueAtAcquisitionCents - totalCostBasisCents;
  const unrealizedGainCents = currentEstimatedValueCents - totalCostBasisCents;
  const marketMovementCents = currentEstimatedValueCents - marketValueAtAcquisitionCents;

  return {
    purchaseDiscountCents,
    purchaseDiscountPct:
      marketValueAtAcquisitionCents !== 0
        ? purchaseDiscountCents / marketValueAtAcquisitionCents
        : null,
    unrealizedGainCents,
    unrealizedGainPct:
      totalCostBasisCents !== 0 ? unrealizedGainCents / totalCostBasisCents : null,
    marketMovementCents,
    underwater: currentEstimatedValueCents < totalCostBasisCents,
  };
}
