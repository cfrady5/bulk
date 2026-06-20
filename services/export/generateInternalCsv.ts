import Papa from 'papaparse';

import { APP_CONFIG } from '@/constants/config';
import type { Listing, ListingPhoto } from '@/types';

import type { GenerateCsvResult } from './generateEbaySellerHubCsv';

/**
 * Internal Full Export.
 *
 * Exports ALL app fields (plus photo metadata) for backup, analysis, or
 * external editing. This is intentionally exhaustive and is NOT meant for
 * direct upload to eBay — use generateEbaySellerHubCsv for that.
 */

export interface GenerateInternalCsvInput {
  listings: Listing[];
  photosByListing: Record<string, ListingPhoto[]>;
}

/** Every Listing field, in a stable, readable column order. */
const INTERNAL_COLUMNS: (keyof Listing)[] = [
  'id',
  'batch_id',
  'sku',
  'listing_type',
  'review_status',
  'title',
  'description',
  'category_id',
  'condition_id',
  'card_name',
  'player',
  'team',
  'sport',
  'league',
  'year',
  'season',
  'manufacturer',
  'set_name',
  'card_number',
  'parallel_variety',
  'insert_set',
  'rookie_card',
  'autographed',
  'memorabilia',
  'graded',
  'grading_company',
  'grade',
  'professional_grader',
  'certification_number',
  'raw_or_graded',
  'original_reprint',
  'card_condition',
  'condition_notes',
  'visible_imperfections',
  'features',
  'card_size',
  'language',
  'country_region_of_manufacture',
  'sale_type',
  'auction_start_price',
  'buy_it_now_price',
  'minimum_offer',
  'auto_accept_offer',
  'auto_decline_offer',
  'accept_offers',
  'quantity',
  'shipping_profile',
  'promotion_percent',
  'lot_title',
  'number_of_cards',
  'featured_cards',
  'shared_player',
  'shared_team',
  'shared_sport',
  'shared_league',
  'shared_set',
  'shared_theme',
  'lot_notes',
  'internal_notes',
  'ai_confidence_summary',
  'created_at',
  'updated_at',
];

function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function generateInternalCsv(input: GenerateInternalCsvInput): GenerateCsvResult {
  const headers = [...INTERNAL_COLUMNS.map(String), 'photo_count', 'photo_urls', 'photo_local_uris'];

  const data = input.listings.map((listing) => {
    const photos = input.photosByListing[listing.id] ?? [];
    const ordered = [...photos].sort((a, b) => a.sort_order - b.sort_order);

    const base = INTERNAL_COLUMNS.map((col) => cell(listing[col]));
    base.push(String(photos.length));
    base.push(
      ordered
        .map((p) => p.public_url ?? '')
        .filter(Boolean)
        .join(APP_CONFIG.photoUrlSeparator),
    );
    base.push(
      ordered
        .map((p) => p.local_uri ?? '')
        .filter(Boolean)
        .join(APP_CONFIG.photoUrlSeparator),
    );
    return base;
  });

  const csv = Papa.unparse({ fields: headers, data }, { quotes: true, newline: '\r\n' });

  return { csv, rowCount: data.length, headers, shortenedTitles: [] };
}
