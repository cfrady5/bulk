import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format integer cents as a USD string. */
export function money(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100,
  );
}

/** Format a decimal fraction as a percentage (0.125 -> "12.5%"). */
export function percent(rate: number | null | undefined, digits = 1): string {
  if (rate == null || !Number.isFinite(rate)) return '—';
  return `${(rate * 100).toFixed(digits)}%`;
}

/** Tailwind class for a profit/loss value (spec §21: green up, red down). */
export function pnlClass(cents: number): string {
  if (cents > 0) return 'text-positive';
  if (cents < 0) return 'text-negative';
  return 'text-muted-foreground';
}
