/**
 * Sale profitability math (spec §8). All monetary values are integer cents;
 * ROI is a decimal fraction.
 *
 *   net_proceeds = gross_sale_price + buyer_paid_shipping − all_sale_expenses
 *   net_profit   = net_proceeds − total_cost_basis
 *   roi          = net_profit / total_cost_basis
 */
import { Cents, sumCents } from './money';

export interface SaleExpenses {
  platformFeeCents?: Cents;
  paymentProcessingFeeCents?: Cents;
  promotionFeeCents?: Cents;
  consignmentFeeCents?: Cents;
  actualShippingCents?: Cents;
  packagingCents?: Cents;
  insuranceCents?: Cents;
  refundCents?: Cents;
  otherSaleExpensesCents?: Cents;
}

export interface SaleInput extends SaleExpenses {
  grossSalePriceCents: Cents;
  buyerPaidShippingCents?: Cents;
  totalCostBasisCents: Cents;
}

export interface SaleResult {
  totalExpensesCents: Cents;
  netProceedsCents: Cents;
  netProfitCents: Cents;
  /** decimal fraction; null when cost basis is 0. */
  roi: number | null;
}

export function totalSaleExpenses(e: SaleExpenses): Cents {
  return sumCents([
    e.platformFeeCents ?? 0,
    e.paymentProcessingFeeCents ?? 0,
    e.promotionFeeCents ?? 0,
    e.consignmentFeeCents ?? 0,
    e.actualShippingCents ?? 0,
    e.packagingCents ?? 0,
    e.insuranceCents ?? 0,
    e.refundCents ?? 0,
    e.otherSaleExpensesCents ?? 0,
  ]);
}

export function computeSale(input: SaleInput): SaleResult {
  const totalExpensesCents = totalSaleExpenses(input);
  const netProceedsCents =
    input.grossSalePriceCents + (input.buyerPaidShippingCents ?? 0) - totalExpensesCents;
  const netProfitCents = netProceedsCents - input.totalCostBasisCents;
  return {
    totalExpensesCents,
    netProceedsCents,
    netProfitCents,
    roi: input.totalCostBasisCents !== 0 ? netProfitCents / input.totalCostBasisCents : null,
  };
}

/** Whole days between acquisition and sale (>= 0). */
export function daysHeld(acquiredISO: string, soldISO: string): number {
  const MS_PER_DAY = 86_400_000;
  const a = Date.parse(acquiredISO);
  const s = Date.parse(soldISO);
  if (Number.isNaN(a) || Number.isNaN(s)) return 0;
  return Math.max(0, Math.floor((s - a) / MS_PER_DAY));
}
