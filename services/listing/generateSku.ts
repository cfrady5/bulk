import type { ListingType } from '@/types';

/**
 * SKU generation.
 *
 * SKUs are derived from the batch name/date + a sequential listing number.
 * They must be unique within a batch and remain user-editable. Duplicate SKUs
 * are caught by validation before export.
 *
 * Examples:
 *   JUNE20-001
 *   JUNE20-002
 *   JUNE20-LOT-003
 *   PSA-JUNE20-001
 *   RAW-JUNE20-001
 */

/** Turn an arbitrary batch name into a compact SKU-safe prefix. */
export function batchNameToPrefix(batchName: string): string {
  const cleaned = (batchName || 'BATCH')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim();

  if (!cleaned) return 'BATCH';

  // Use the first 1-2 meaningful words, capped in length.
  const words = cleaned.split(/\s+/).filter(Boolean);
  const prefix = words.slice(0, 2).join('').slice(0, 10);
  return prefix || 'BATCH';
}

/** Zero-pad a listing number, e.g. 3 -> "003". */
export function padListingNumber(n: number, width = 3): string {
  return String(Math.max(0, Math.floor(n))).padStart(width, '0');
}

export interface GenerateSkuOptions {
  batchName: string;
  listingNumber: number;
  listingType?: ListingType;
  /** Optional extra prefix, e.g. "PSA" or "RAW". */
  prefix?: string;
}

/** Build a SKU string from the given parts. */
export function generateSku({
  batchName,
  listingNumber,
  listingType = 'Single Card',
  prefix,
}: GenerateSkuOptions): string {
  const base = batchNameToPrefix(batchName);
  const num = padListingNumber(listingNumber);
  const lotSegment = listingType === 'Card Lot' ? 'LOT-' : '';
  const extra = prefix ? `${prefix.toUpperCase()}-` : '';
  return `${extra}${base}-${lotSegment}${num}`;
}

/**
 * Generate a SKU that does not collide with any in `existingSkus`.
 * If a collision occurs, the listing number is bumped until it's unique.
 */
export function generateUniqueSku(
  options: GenerateSkuOptions,
  existingSkus: Iterable<string>,
): string {
  const taken = new Set(Array.from(existingSkus).map((s) => s.toUpperCase()));
  let n = options.listingNumber;
  let candidate = generateSku({ ...options, listingNumber: n });
  // Guard against infinite loops; 9999 listings per batch is far beyond MVP scope.
  let guard = 0;
  while (taken.has(candidate.toUpperCase()) && guard < 10000) {
    n += 1;
    guard += 1;
    candidate = generateSku({ ...options, listingNumber: n });
  }
  return candidate;
}
