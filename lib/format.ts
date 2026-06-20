/**
 * Formatting + parsing helpers for prices, dates, and display strings.
 */

/** Format a number as USD. Returns '—' for null/undefined. */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `$${value.toFixed(2)}`;
}

/** Parse a user-entered price string into a number or null. */
export function parsePrice(input: string): number | null {
  if (input === undefined || input === null) return null;
  const cleaned = String(input).replace(/[^0-9.]/g, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** True if a price string is a valid, well-formed money value. */
export function isValidPrice(input: string | number | null | undefined): boolean {
  if (input === null || input === undefined || input === '') return false;
  const n = typeof input === 'number' ? input : parsePrice(input);
  return n !== null && Number.isFinite(n) && n >= 0;
}

/** Parse an integer (quantity) from input. */
export function parseInteger(input: string): number | null {
  const cleaned = String(input).replace(/[^0-9-]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}

/** Friendly relative-ish date, e.g. "Jun 20, 2026". */
export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Pluralize a noun based on count. */
export function plural(count: number, singular: string, pluralForm?: string): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${pluralForm ?? singular + 's'}`;
}

/** Truncate with ellipsis. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}
