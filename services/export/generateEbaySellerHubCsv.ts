import Papa from 'papaparse';

import { APP_CONFIG } from '@/constants/config';
import { shortenEbayTitle } from '@/services/listing/shortenEbayTitle';
import type { Listing, ListingPhoto } from '@/types';

import { EBAY_FIELD_MAP, EbayFieldMapEntry } from './ebayFieldMap';

/**
 * Generate an eBay Seller Hub Reports CSV.
 *
 *  - One row per listing.
 *  - Columns / headers come from the configurable EBAY_FIELD_MAP.
 *  - Image URLs are joined with "|" (handled inside the field map).
 *  - Title length is enforced (auto-shortened as a final safety net; the UI
 *    already blocks export when a title is over the cap).
 *  - Item specifics are included via the field map.
 *
 * NOTE: Verify the header strings in ebayFieldMap.ts against the template you
 * download from eBay Seller Hub > Reports for your category.
 */

export interface GenerateEbayCsvInput {
  listings: Listing[];
  photosByListing: Record<string, ListingPhoto[]>;
  fieldMap?: EbayFieldMapEntry[];
  maxTitleLength?: number;
}

export interface GenerateCsvResult {
  csv: string;
  rowCount: number;
  headers: string[];
  /** SKUs whose titles had to be shortened during export. */
  shortenedTitles: string[];
}

export function generateEbaySellerHubCsv(input: GenerateEbayCsvInput): GenerateCsvResult {
  const map = input.fieldMap ?? EBAY_FIELD_MAP;
  const maxTitleLength = input.maxTitleLength ?? APP_CONFIG.maxTitleLength;
  const headers = map.map((m) => m.header);
  const shortenedTitles: string[] = [];

  const rows = input.listings.map((listing) => {
    const photos = input.photosByListing[listing.id] ?? [];

    // Safety net: enforce title length even if something slipped past the UI.
    let safeListing = listing;
    if (listing.title.length > maxTitleLength) {
      const shortened = shortenEbayTitle(listing.title, maxTitleLength).title;
      safeListing = { ...listing, title: shortened };
      shortenedTitles.push(listing.sku);
    }

    const row: Record<string, string> = {};
    map.forEach((entry) => {
      row[entry.header] = entry.value(safeListing, photos);
    });
    return row;
  });

  const csv = Papa.unparse(
    { fields: headers, data: rows.map((r) => headers.map((h) => r[h] ?? '')) },
    { quotes: true, newline: '\r\n' },
  );

  return { csv, rowCount: rows.length, headers, shortenedTitles };
}
