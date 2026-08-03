import { describe, expect, it } from 'vitest';

import {
  compareScenarios,
  computeBreakCost,
  computeBreakProductCost,
  computeFillLevel,
  computeSale,
  computeScenario,
  computeValuation,
  daysHeld,
  equalAllocation,
  estimateShipments,
  markupToMargin,
  marginToMarkup,
  rebalanceRemaining,
  requiredRevenueForMargin,
  requiredRevenueForMarkup,
  requiredRevenueForProfit,
  roundPrice,
  breakEvenSpotPrice,
  shippingExpense,
  splitByWeight,
  splitEvenly,
  suggestTeamPrices,
  summarizePyt,
  summarizeScenario,
  totalLandedCost,
  validateAllocation,
  valueWeightedAllocation,
  type ScenarioInput,
} from '../index';

describe('money', () => {
  it('splits evenly with exact sum', () => {
    expect(splitEvenly(1000, 3)).toEqual([334, 333, 333]);
    expect(splitEvenly(1000, 3).reduce((a, b) => a + b)).toBe(1000);
  });

  it('splits by weight with exact sum', () => {
    expect(splitByWeight(1000, [1, 1, 2])).toEqual([250, 250, 500]);
    expect(splitByWeight(100, [1, 1, 1]).reduce((a, b) => a + b)).toBe(100);
  });

  it('rounds prices by mode', () => {
    expect(roundPrice(1799, 'nearest_dollar')).toBe(1800);
    expect(roundPrice(1701, 'up_dollar')).toBe(1800);
    expect(roundPrice(1701, 'up_5')).toBe(2000);
    expect(roundPrice(1750, 'custom', { charmEndingCents: 99 })).toBe(1799);
    expect(roundPrice(1799, 'exact')).toBe(1799);
  });
});

describe('purchases — total landed cost', () => {
  it('sums all cost components', () => {
    expect(
      totalLandedCost({
        subtotalCents: 10000,
        taxCents: 800,
        buyerPremiumCents: 2000,
        inboundShippingCents: 500,
        travelCents: 0,
        otherExpensesCents: 100,
      }),
    ).toBe(13400);
  });
});

describe('allocation', () => {
  it('equal allocation sums to landed cost', () => {
    expect(equalAllocation(10000, 4)).toEqual([2500, 2500, 2500, 2500]);
    const alloc = equalAllocation(10001, 4);
    expect(alloc.reduce((a, b) => a + b)).toBe(10001);
    expect(alloc[0]).toBe(2501);
  });

  it('value-weighted allocation distributes by market value', () => {
    expect(valueWeightedAllocation(10000, [5000, 5000, 10000])).toEqual([2500, 2500, 5000]);
  });

  it('validates manual allocation', () => {
    expect(validateAllocation(10000, [2500, 2500, 5000]).valid).toBe(true);
    const under = validateAllocation(10000, [2500, 2500, 4000]);
    expect(under.valid).toBe(false);
    expect(under.unallocated).toBe(1000);
    const neg = validateAllocation(10000, [-100, 5100, 5000]);
    expect(neg.hasNegative).toBe(true);
    expect(neg.negativeIndices).toEqual([0]);
  });
});

describe('valuation', () => {
  it('keeps discount, movement, and unrealized gain distinct', () => {
    const v = computeValuation({
      totalCostBasisCents: 8000,
      marketValueAtAcquisitionCents: 10000,
      currentEstimatedValueCents: 12000,
    });
    expect(v.purchaseDiscountCents).toBe(2000);
    expect(v.purchaseDiscountPct).toBeCloseTo(0.2);
    expect(v.unrealizedGainCents).toBe(4000);
    expect(v.unrealizedGainPct).toBeCloseTo(0.5);
    expect(v.marketMovementCents).toBe(2000);
    expect(v.underwater).toBe(false);
  });
});

describe('sales', () => {
  it('computes net proceeds, net profit, and ROI', () => {
    const r = computeSale({
      grossSalePriceCents: 20000,
      buyerPaidShippingCents: 500,
      platformFeeCents: 2600,
      paymentProcessingFeeCents: 700,
      totalCostBasisCents: 8000,
    });
    expect(r.totalExpensesCents).toBe(3300);
    expect(r.netProceedsCents).toBe(17200);
    expect(r.netProfitCents).toBe(9200);
    expect(r.roi).toBeCloseTo(1.15);
  });

  it('computes days held', () => {
    expect(daysHeld('2026-01-01', '2026-01-31')).toBe(30);
  });
});

describe('break cost', () => {
  it('computes product entry cost', () => {
    const p = computeBreakProductCost({
      numberOfBoxes: 2,
      costPerBoxCents: 12000,
      salesTaxCents: 960,
      inboundShippingCents: 500,
    });
    expect(p.productSubtotalCents).toBe(24000);
    expect(p.totalProductEntryCostCents).toBe(25460);
  });

  it('separates fixed and variable operating costs', () => {
    const c = computeBreakCost(
      25460,
      [
        { label: 'supplies', category: 'fulfillment', kind: 'fixed', amountCents: 3000 },
        { label: 'mailers', category: 'fulfillment', kind: 'variable', amountCents: 400, per: 'shipment' },
        { label: 'platform', category: 'platform', kind: 'variable', amountCents: 50, per: 'spot' },
      ],
      { spots: 30, buyers: 20, shipments: 20 },
    );
    expect(c.fixedExpensesCents).toBe(3000);
    expect(c.variableExpensesCents).toBe(9500); // 400*20 + 50*30
    expect(c.fulfillmentCents).toBe(11000); // 3000 + 8000
    expect(c.platformCents).toBe(1500);
    expect(c.totalBreakCostCents).toBe(37960);
  });
});

describe('pricing — markup vs margin', () => {
  const cost = 37960;
  it('break-even spot price', () => {
    expect(breakEvenSpotPrice(cost, 30)).toBeCloseTo(1265.333, 2);
  });
  it('required revenue for a target profit', () => {
    expect(requiredRevenueForProfit(cost, 10000)).toBe(47960);
  });
  it('required revenue for a target markup', () => {
    expect(requiredRevenueForMarkup(cost, 0.3)).toBe(49348);
  });
  it('required revenue for a target margin', () => {
    expect(requiredRevenueForMargin(cost, 0.3)).toBe(54229);
  });
  it('rejects impossible margins >= 100%', () => {
    expect(() => requiredRevenueForMargin(cost, 1)).toThrow();
    expect(() => requiredRevenueForMargin(cost, 1.2)).toThrow();
  });
  it('converts between markup and margin', () => {
    expect(markupToMargin(1)).toBeCloseTo(0.5);
    expect(marginToMarkup(0.5)).toBeCloseTo(1);
  });
});

describe('shipping — spots vs buyers vs shipments', () => {
  it('combines shipments per buyer unless per-spot', () => {
    expect(estimateShipments(20, 'combined')).toBe(20);
    expect(estimateShipments(20, 'combined', { perSpot: true, spots: 30 })).toBe(30);
    expect(estimateShipments(5, 'local_pickup')).toBe(0);
  });
  it('computes variable shipping expense', () => {
    expect(shippingExpense(12, 400)).toBe(4800);
  });
});

const SCENARIO: ScenarioInput = {
  spots: 30,
  avgSpotPriceCents: 2000,
  totalBreakCostCents: 37960,
  platformFeePct: 0.1,
  paymentProcessingPct: 0.03,
  expectedBuyers: 20,
  expectedShipments: 20,
  perShipmentCents: 400,
};

describe('fill-rate modeling', () => {
  it('computes profitability at 100% fill', () => {
    const f = computeFillLevel(SCENARIO, 1);
    expect(f.spotsSold).toBe(30);
    expect(f.revenueCents).toBe(60000);
    expect(f.platformFeesCents).toBe(6000);
    expect(f.paymentFeesCents).toBe(1800);
    expect(f.shipments).toBe(20);
    expect(f.shippingExpenseCents).toBe(8000);
    expect(f.totalCostCents).toBe(53760);
    expect(f.profitCents).toBe(6240);
  });

  it('shows a loss at low fill', () => {
    const f = computeFillLevel(SCENARIO, 0.6);
    expect(f.spotsSold).toBe(18);
    expect(f.profitCents).toBeLessThan(0);
  });

  it('computes break-even spots, fill rate, and risk', () => {
    const m = computeScenario(SCENARIO);
    expect(m.breakEvenSpots).toBe(26);
    expect(m.breakEvenFillRate).toBeCloseTo(0.8667, 3);
    expect(m.risk).toBe('high');
    expect(m.maxRevenueCents).toBe(60000);
  });
});

describe('Pick Your Team pricing', () => {
  const teams = [
    { id: 'a', weight: 3, status: 'available' as const },
    { id: 'b', weight: 2, status: 'available' as const },
    { id: 'c', weight: 1, status: 'available' as const },
  ];

  it('suggests weighted prices summing to required revenue', () => {
    const priced = suggestTeamPrices(50000, teams);
    expect(priced.map((t) => t.suggestedPriceCents)).toEqual([25000, 16667, 8333]);
    expect(priced.reduce((a, t) => a + t.suggestedPriceCents, 0)).toBe(50000);
  });

  it('rebalances remaining revenue across unsold teams only', () => {
    const withSale = [
      { id: 'a', weight: 3, status: 'sold' as const, finalPriceCents: 30000 },
      { id: 'b', weight: 2, status: 'available' as const },
      { id: 'c', weight: 1, status: 'available' as const },
    ];
    const rebalanced = rebalanceRemaining(50000, withSale);
    const byId = Object.fromEntries(rebalanced.map((t) => [t.id, t.suggestedPriceCents]));
    expect(byId.a).toBe(30000); // sold untouched
    expect(byId.b + byId.c).toBe(20000); // remaining redistributed
    expect(byId.b).toBe(13333);
    expect(byId.c).toBe(6667);
  });

  it('summarizes exposure and projected profit', () => {
    const priced = suggestTeamPrices(50000, teams);
    const s = summarizePyt(50000, priced, 38000);
    expect(s.totalAssignedCents).toBe(50000);
    expect(s.revenueRemainingCents).toBe(0);
    expect(s.unsoldExposureCents).toBe(50000);
    expect(s.projectedProfitCents).toBe(12000);
  });
});

describe('scenario comparison', () => {
  it('ranks scenarios and recommends by inputs', () => {
    const a = summarizeScenario('a', 'Pick Your Team', 'Pick Your Team', SCENARIO, 0.9);
    const b = summarizeScenario(
      'b',
      'Two Random Teams',
      'Two Random Teams',
      { ...SCENARIO, spots: 8, avgSpotPriceCents: 9000, expectedBuyers: 8, expectedShipments: 8 },
      0.9,
    );
    const result = compareScenarios([a, b]);
    expect(result.best.byEntryPrice).toBe('a'); // lower avg spot price
    expect(result.best.byBuyers).toBe('b'); // fewer buyers
    expect(result.best.byShipping).toBe('b'); // fewer shipments
    expect(result.recommendedId).toBe(result.best.byProfit);
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});
