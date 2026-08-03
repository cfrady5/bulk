/**
 * Money is represented as an integer number of **cents** everywhere in the app.
 * Never store or compute stored monetary values as floating-point dollars.
 *
 * Rates/percentages in this layer are **decimal fractions** (0.13 === 13%).
 */

export type Cents = number;

/** Rounding strategies for spot / listing prices (spec §11). */
export type RoundingMode =
  | 'exact'
  | 'nearest_dollar'
  | 'up_dollar'
  | 'up_5'
  | 'custom';

export interface CustomRoundingOptions {
  /** Step to round up to, in cents (default 100 = $1). */
  stepCents?: number;
  /** Psychological "charm" ending in cents, e.g. 99 → prices end in .99. */
  charmEndingCents?: number;
}

const DOLLAR = 100;

export function dollarsToCents(dollars: number): Cents {
  return Math.round(dollars * DOLLAR);
}

export function centsToDollars(cents: Cents): number {
  return cents / DOLLAR;
}

/** Sum a list of cents exactly (integers → no float drift). */
export function sumCents(values: Cents[]): Cents {
  return values.reduce((acc, v) => acc + v, 0);
}

/** Apply a decimal rate to a cents amount, rounded to the nearest cent. */
export function applyRate(cents: Cents, rate: number): Cents {
  return Math.round(cents * rate);
}

/**
 * Round a price (in cents) using the chosen strategy. Input may be fractional
 * cents (e.g. from a division); output is always an integer number of cents.
 */
export function roundPrice(
  cents: number,
  mode: RoundingMode = 'exact',
  custom: CustomRoundingOptions = {},
): Cents {
  switch (mode) {
    case 'exact':
      return Math.round(cents);
    case 'nearest_dollar':
      return Math.round(cents / DOLLAR) * DOLLAR;
    case 'up_dollar':
      return Math.ceil(cents / DOLLAR) * DOLLAR;
    case 'up_5':
      return Math.ceil(cents / (5 * DOLLAR)) * (5 * DOLLAR);
    case 'custom': {
      const step = custom.stepCents && custom.stepCents > 0 ? custom.stepCents : DOLLAR;
      const base = Math.ceil(cents / step) * step;
      if (custom.charmEndingCents == null) return base;
      // e.g. base 1800, charm 99 → 1799 (round up to next dollar, drop 1¢)
      return base - (DOLLAR - custom.charmEndingCents);
    }
    default:
      return Math.round(cents);
  }
}

/** Format cents as a currency string (display only). */
export function formatMoney(cents: Cents, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    centsToDollars(cents),
  );
}

/** Format a decimal rate as a percentage string (0.125 → "12.5%"). */
export function formatPercent(rate: number, fractionDigits = 1): string {
  return `${(rate * 100).toFixed(fractionDigits)}%`;
}

/**
 * Distribute `total` cents across `count` buckets as evenly as possible while
 * summing **exactly** to `total` (largest-remainder / banker-safe integer split).
 */
export function splitEvenly(total: Cents, count: number): Cents[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  let remainder = total - base * count; // 0..count-1
  const out = new Array<Cents>(count).fill(base);
  // hand out the leftover cents one at a time
  for (let i = 0; i < count && remainder > 0; i++) {
    out[i] += 1;
    remainder -= 1;
  }
  return out;
}

/**
 * Distribute `total` cents proportionally to `weights`, summing exactly to
 * `total`. Uses the largest-remainder method so no cent is lost or invented.
 * If all weights are 0, falls back to an even split.
 */
export function splitByWeight(total: Cents, weights: number[]): Cents[] {
  const n = weights.length;
  if (n === 0) return [];
  const totalWeight = weights.reduce((a, w) => a + Math.max(0, w), 0);
  if (totalWeight <= 0) return splitEvenly(total, n);

  const exact = weights.map((w) => (Math.max(0, w) / totalWeight) * total);
  const floors = exact.map((v) => Math.floor(v));
  let assigned = floors.reduce((a, v) => a + v, 0);
  let remainder = total - assigned; // integer cents still to hand out

  // rank by largest fractional part
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const out = floors.slice();
  for (let k = 0; k < order.length && remainder > 0; k++) {
    out[order[k].i] += 1;
    remainder -= 1;
  }
  return out;
}
