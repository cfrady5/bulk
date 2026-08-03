/**
 * Scenario comparison + plain-language recommendation (spec §15).
 * Recommendations are derived purely from the entered inputs/calculations.
 */
import { computeFillLevel, computeScenario, RiskRating, ScenarioInput } from './fillRate';
import { Cents } from './money';

export interface ScenarioSummary {
  id: string;
  name: string;
  format: string;
  spots: number;
  avgSpotPriceCents: number;
  maxRevenueCents: Cents;
  expectedFillRate: number;
  expectedRevenueCents: Cents;
  expectedBuyers: number;
  expectedShipments: number;
  breakEvenFillRate: number;
  expectedProfitCents: Cents;
  expectedMargin: number;
  risk: RiskRating;
}

/** Build a comparable summary from a scenario input + its expected fill rate. */
export function summarizeScenario(
  id: string,
  name: string,
  format: string,
  input: ScenarioInput,
  expectedFillRate: number,
): ScenarioSummary {
  const model = computeScenario(input);
  const expected = computeFillLevel(input, expectedFillRate);
  return {
    id,
    name,
    format,
    spots: input.spots,
    avgSpotPriceCents: input.avgSpotPriceCents,
    maxRevenueCents: model.maxRevenueCents,
    expectedFillRate,
    expectedRevenueCents: expected.revenueCents,
    expectedBuyers: Math.round(input.expectedBuyers * expectedFillRate),
    expectedShipments: expected.shipments,
    breakEvenFillRate: model.breakEvenFillRate,
    expectedProfitCents: expected.profitCents,
    expectedMargin: expected.margin,
    risk: model.risk,
  };
}

export interface ComparisonResult {
  best: {
    byProfit: string;
    byMargin: string;
    byBreakEvenFillRate: string;
    byEntryPrice: string;
    byBuyers: string;
    byShipping: string;
  };
  recommendedId: string;
  recommendation: string;
}

function argMin<T>(items: T[], key: (t: T) => number): T {
  return items.reduce((best, cur) => (key(cur) < key(best) ? cur : best));
}
function argMax<T>(items: T[], key: (t: T) => number): T {
  return items.reduce((best, cur) => (key(cur) > key(best) ? cur : best));
}

export function compareScenarios(scenarios: ScenarioSummary[]): ComparisonResult {
  if (scenarios.length === 0) {
    return {
      best: {
        byProfit: '',
        byMargin: '',
        byBreakEvenFillRate: '',
        byEntryPrice: '',
        byBuyers: '',
        byShipping: '',
      },
      recommendedId: '',
      recommendation: 'No scenarios to compare.',
    };
  }

  const byProfit = argMax(scenarios, (s) => s.expectedProfitCents);
  const byMargin = argMax(scenarios, (s) => s.expectedMargin);
  const byBreakEvenFillRate = argMin(scenarios, (s) => s.breakEvenFillRate);
  const byEntryPrice = argMin(scenarios, (s) => s.avgSpotPriceCents);
  const byBuyers = argMin(scenarios, (s) => s.expectedBuyers);
  const byShipping = argMin(scenarios, (s) => s.expectedShipments);

  // Recommend the most profitable, but call out a safer alternative if one is
  // materially easier to fill or needs meaningfully fewer buyers.
  const top = byProfit;
  const safer = byBreakEvenFillRate;
  let recommendation: string;
  if (safer.id === top.id) {
    recommendation = `${top.name} (${top.format}) has both the highest expected profit and the lowest break-even fill rate — the clear pick.`;
  } else {
    const easierFill = top.breakEvenFillRate - safer.breakEvenFillRate >= 0.1;
    const fewerBuyers = top.expectedBuyers - safer.expectedBuyers >= 3;
    if (easierFill || fewerBuyers) {
      recommendation =
        `${top.name} (${top.format}) shows the highest expected profit, but ${safer.name} (${safer.format}) ` +
        `breaks even at a lower fill rate` +
        (fewerBuyers ? ` and needs fewer buyers` : '') +
        ` — a lower-risk alternative if demand is uncertain.`;
    } else {
      recommendation = `${top.name} (${top.format}) offers the highest expected profit at comparable risk — recommended.`;
    }
  }

  return {
    best: {
      byProfit: byProfit.id,
      byMargin: byMargin.id,
      byBreakEvenFillRate: byBreakEvenFillRate.id,
      byEntryPrice: byEntryPrice.id,
      byBuyers: byBuyers.id,
      byShipping: byShipping.id,
    },
    recommendedId: top.id,
    recommendation,
  };
}
