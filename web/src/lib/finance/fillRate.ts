/**
 * Fill-rate & risk modeling for a break scenario (spec §12).
 * Money is integer cents; rates are decimal fractions. `avgSpotPriceCents` may
 * be fractional (an average); revenue is rounded to whole cents.
 */
import { applyRate, Cents } from './money';

export interface ScenarioInput {
  spots: number;
  /** Average price per spot in cents (may be fractional). */
  avgSpotPriceCents: number;
  /** Fixed cost incurred regardless of fill (product + fixed operating). */
  totalBreakCostCents: Cents;
  platformFeePct: number;
  paymentProcessingPct: number;
  /** Variable cost per sold spot (supplies, per-card materials). */
  perSpotVariableCents?: Cents;
  /** Expected buyers & shipments at 100% fill. */
  expectedBuyers: number;
  expectedShipments: number;
  /** Variable shipping/fulfillment cost per shipment. */
  perShipmentCents?: Cents;
  /** Shipping revenue collected per shipment (charged separately). */
  shippingChargedPerShipmentCents?: Cents;
  /** If true, shipping scales per sold spot rather than per shipment. */
  perSpotShipping?: boolean;
}

export interface FillLevelResult {
  fillRate: number;
  spotsSold: number;
  revenueCents: Cents;
  platformFeesCents: Cents;
  paymentFeesCents: Cents;
  shipments: number;
  shippingExpenseCents: Cents;
  variableSpotCostCents: Cents;
  totalCostCents: Cents;
  profitCents: Cents;
  margin: number;
}

export type RiskRating = 'low' | 'moderate' | 'high';

export interface ScenarioModel {
  fillLevels: FillLevelResult[];
  maxRevenueCents: Cents;
  breakEvenSpots: number;
  breakEvenFillRate: number;
  netRevenuePerSpotCents: number;
  risk: RiskRating;
}

export const DEFAULT_FILL_LEVELS = [1, 0.9, 0.8, 0.7, 0.6];

export function computeFillLevel(s: ScenarioInput, fillRate: number): FillLevelResult {
  const spotsSold = Math.round(s.spots * fillRate);
  const fraction = s.spots > 0 ? spotsSold / s.spots : 0;

  const shipments = s.perSpotShipping ? spotsSold : Math.ceil(s.expectedShipments * fraction);

  const saleRevenue = Math.round(spotsSold * s.avgSpotPriceCents);
  const shippingRevenue = (s.shippingChargedPerShipmentCents ?? 0) * shipments;
  const revenueCents = saleRevenue + shippingRevenue;

  const platformFeesCents = applyRate(revenueCents, s.platformFeePct);
  const paymentFeesCents = applyRate(revenueCents, s.paymentProcessingPct);
  const shipUnits = s.perSpotShipping ? spotsSold : shipments;
  const shippingExpenseCents = shipUnits * (s.perShipmentCents ?? 0);
  const variableSpotCostCents = spotsSold * (s.perSpotVariableCents ?? 0);

  const totalCostCents =
    s.totalBreakCostCents +
    platformFeesCents +
    paymentFeesCents +
    shippingExpenseCents +
    variableSpotCostCents;

  const profitCents = revenueCents - totalCostCents;

  return {
    fillRate,
    spotsSold,
    revenueCents,
    platformFeesCents,
    paymentFeesCents,
    shipments,
    shippingExpenseCents,
    variableSpotCostCents,
    totalCostCents,
    profitCents,
    margin: revenueCents !== 0 ? profitCents / revenueCents : 0,
  };
}

/** Net revenue contributed by one additional sold spot (for break-even). */
export function netRevenuePerSpot(s: ScenarioInput): number {
  const feeFraction = s.platformFeePct + s.paymentProcessingPct;
  const perSpotShip = s.perSpotShipping
    ? (s.perShipmentCents ?? 0)
    : (s.perShipmentCents ?? 0) * (s.spots > 0 ? s.expectedShipments / s.spots : 0);
  return (
    s.avgSpotPriceCents * (1 - feeFraction) - (s.perSpotVariableCents ?? 0) - perSpotShip
  );
}

function ratingFrom(breakEvenFillRate: number, buyersRequired: number): RiskRating {
  // Higher required fill and more unique buyers → higher risk.
  if (breakEvenFillRate <= 0.6 && buyersRequired <= 12) return 'low';
  if (breakEvenFillRate <= 0.85 && buyersRequired <= 25) return 'moderate';
  return 'high';
}

export function computeScenario(
  s: ScenarioInput,
  fillLevels: number[] = DEFAULT_FILL_LEVELS,
): ScenarioModel {
  const perSpotNet = netRevenuePerSpot(s);
  const breakEvenSpots =
    perSpotNet > 0 ? Math.ceil(s.totalBreakCostCents / perSpotNet) : Infinity;
  const breakEvenFillRate = s.spots > 0 ? breakEvenSpots / s.spots : Infinity;

  return {
    fillLevels: fillLevels.map((f) => computeFillLevel(s, f)),
    maxRevenueCents: Math.round(s.spots * s.avgSpotPriceCents),
    breakEvenSpots,
    breakEvenFillRate,
    netRevenuePerSpotCents: perSpotNet,
    risk: ratingFrom(breakEvenFillRate, s.expectedBuyers),
  };
}
