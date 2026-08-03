/**
 * Break cost structure (spec §9). All monetary values are integer cents.
 * Clearly separates product / fulfillment / acquisition / platform / labor so
 * the dashboard and reports can show where the money goes.
 */
import { Cents, sumCents } from './money';

export interface BreakProductInput {
  numberOfBoxes: number;
  costPerBoxCents: Cents;
  salesTaxCents?: Cents;
  buyerPremiumCents?: Cents;
  inboundShippingCents?: Cents;
}

export interface BreakProductCost {
  productSubtotalCents: Cents;
  totalProductEntryCostCents: Cents;
}

/** productSubtotal = boxes × costPerBox; entry = subtotal + tax + premium + inbound. */
export function computeBreakProductCost(input: BreakProductInput): BreakProductCost {
  const productSubtotalCents = input.numberOfBoxes * input.costPerBoxCents;
  const totalProductEntryCostCents = sumCents([
    productSubtotalCents,
    input.salesTaxCents ?? 0,
    input.buyerPremiumCents ?? 0,
    input.inboundShippingCents ?? 0,
  ]);
  return { productSubtotalCents, totalProductEntryCostCents };
}

/** A single operating expense line — fixed, or variable per unit. */
export interface BreakExpense {
  label: string;
  category: 'fulfillment' | 'acquisition' | 'platform' | 'labor' | 'other';
  /** 'fixed' → amountCents once; 'variable' → amountCents × units. */
  kind: 'fixed' | 'variable';
  amountCents: Cents;
  /** For variable: 'buyer' | 'spot' | 'shipment' | 'card'. */
  per?: 'buyer' | 'spot' | 'shipment' | 'card';
}

export interface BreakVolume {
  spots: number;
  buyers: number;
  shipments: number;
  cards?: number;
}

export interface BreakCostBreakdown {
  productCostCents: Cents;
  fulfillmentCents: Cents;
  acquisitionCents: Cents;
  platformCents: Cents;
  laborCents: Cents;
  otherCents: Cents;
  fixedExpensesCents: Cents;
  variableExpensesCents: Cents;
  /** total_break_cost = product + fixed + estimated variable. */
  totalBreakCostCents: Cents;
}

function unitsFor(per: BreakExpense['per'], v: BreakVolume): number {
  switch (per) {
    case 'buyer':
      return v.buyers;
    case 'spot':
      return v.spots;
    case 'shipment':
      return v.shipments;
    case 'card':
      return v.cards ?? v.spots;
    default:
      return 1;
  }
}

export function computeBreakCost(
  productCostCents: Cents,
  expenses: BreakExpense[],
  volume: BreakVolume,
): BreakCostBreakdown {
  const byCategory = { fulfillment: 0, acquisition: 0, platform: 0, labor: 0, other: 0 };
  let fixed = 0;
  let variable = 0;

  for (const e of expenses) {
    const amount = e.kind === 'fixed' ? e.amountCents : e.amountCents * unitsFor(e.per, volume);
    byCategory[e.category] += amount;
    if (e.kind === 'fixed') fixed += amount;
    else variable += amount;
  }

  return {
    productCostCents,
    fulfillmentCents: byCategory.fulfillment,
    acquisitionCents: byCategory.acquisition,
    platformCents: byCategory.platform,
    laborCents: byCategory.labor,
    otherCents: byCategory.other,
    fixedExpensesCents: fixed,
    variableExpensesCents: variable,
    totalBreakCostCents: productCostCents + fixed + variable,
  };
}
