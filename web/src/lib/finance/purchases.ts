/** Purchase-level cost math (spec §6). All values are integer cents. */
import { Cents, sumCents } from './money';

export interface PurchaseCostInput {
  subtotalCents: Cents;
  taxCents?: Cents;
  buyerPremiumCents?: Cents;
  inboundShippingCents?: Cents;
  travelCents?: Cents;
  otherExpensesCents?: Cents;
}

/**
 * total_landed_cost = subtotal + tax + buyer_premium + inbound_shipping
 *                     + travel + other_expenses
 */
export function totalLandedCost(input: PurchaseCostInput): Cents {
  return sumCents([
    input.subtotalCents,
    input.taxCents ?? 0,
    input.buyerPremiumCents ?? 0,
    input.inboundShippingCents ?? 0,
    input.travelCents ?? 0,
    input.otherExpensesCents ?? 0,
  ]);
}
