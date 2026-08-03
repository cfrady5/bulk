/**
 * Shipping models (spec §13). Distinguishes spots, buyers, and shipments:
 * a buyer with multiple spots is generally ONE shipment (combined), not one
 * per spot — unless per-spot shipping is explicitly chosen.
 */
import { Cents } from './money';

export type ShippingMethod =
  | 'included'
  | 'flat_per_buyer'
  | 'charged_separately'
  | 'combined'
  | 'free_above_threshold'
  | 'hold'
  | 'local_pickup';

/** Estimate shipments from buyers. `hold`/`local_pickup` ship nothing now. */
export function estimateShipments(
  buyers: number,
  method: ShippingMethod,
  opts: { perSpot?: boolean; spots?: number } = {},
): number {
  if (method === 'hold' || method === 'local_pickup') return 0;
  if (opts.perSpot) return opts.spots ?? buyers;
  return buyers; // combined: one shipment per buyer
}

/** Variable shipping expense for a shipment count. */
export function shippingExpense(shipments: number, perShipmentCents: Cents): Cents {
  return Math.max(0, shipments) * perShipmentCents;
}
