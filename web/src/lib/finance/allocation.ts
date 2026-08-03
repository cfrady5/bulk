/**
 * Cost allocation across the cards in a purchase (spec §6).
 * All monetary values are integer cents. Allocations always sum EXACTLY to the
 * total landed cost — no lost or invented cents.
 */
import { Cents, splitByWeight, splitEvenly } from './money';

export type AllocationMethod = 'equal' | 'manual' | 'value_weighted';

export interface AllocationValidation {
  valid: boolean;
  totalLandedCost: Cents;
  totalAllocated: Cents;
  /** landed − allocated (positive = under-allocated, negative = over). */
  unallocated: Cents;
  hasNegative: boolean;
  /** Indices of cards with a negative allocation. */
  negativeIndices: number[];
}

/** Equal split of the landed cost across `cardCount` cards. */
export function equalAllocation(landedCostCents: Cents, cardCount: number): Cents[] {
  return splitEvenly(landedCostCents, cardCount);
}

/**
 * Value-weighted split: each card gets a share proportional to its market value
 * at acquisition. `card_allocated = value / totalValue × landedCost`.
 * Falls back to an equal split if total value is 0.
 */
export function valueWeightedAllocation(
  landedCostCents: Cents,
  marketValuesCents: Cents[],
): Cents[] {
  return splitByWeight(landedCostCents, marketValuesCents);
}

/**
 * Validate a manual (or any) allocation against the landed cost.
 * Enforces: sum === landed cost, and no negative allocations.
 */
export function validateAllocation(
  landedCostCents: Cents,
  allocationsCents: Cents[],
): AllocationValidation {
  const totalAllocated = allocationsCents.reduce((a, v) => a + v, 0);
  const negativeIndices = allocationsCents
    .map((v, i) => (v < 0 ? i : -1))
    .filter((i) => i >= 0);
  const unallocated = landedCostCents - totalAllocated;
  return {
    valid: unallocated === 0 && negativeIndices.length === 0,
    totalLandedCost: landedCostCents,
    totalAllocated,
    unallocated,
    hasNegative: negativeIndices.length > 0,
    negativeIndices,
  };
}

/** Convenience: produce allocations for a method, ready to persist. */
export function allocate(
  method: AllocationMethod,
  landedCostCents: Cents,
  opts: { cardCount: number; marketValuesCents?: Cents[]; manualCents?: Cents[] },
): Cents[] {
  switch (method) {
    case 'equal':
      return equalAllocation(landedCostCents, opts.cardCount);
    case 'value_weighted':
      return valueWeightedAllocation(
        landedCostCents,
        opts.marketValuesCents ?? new Array(opts.cardCount).fill(0),
      );
    case 'manual':
      return opts.manualCents ?? new Array(opts.cardCount).fill(0);
    default:
      return equalAllocation(landedCostCents, opts.cardCount);
  }
}
