import { APP_CONFIG } from '@/constants/config';
import type { Listing, ListingPhoto } from '@/types';

/**
 * eBay Seller Hub field mapping layer.
 *
 * ⚠️ IMPORTANT: eBay templates VARY by category. Do not assume one universal
 * template works everywhere.
 *
 *   - "Update these headers to match your downloaded eBay Seller Hub Reports
 *      template." Download the template for YOUR category from Seller Hub >
 *      Reports and copy the exact column header strings into `header` below.
 *   - "Category-specific required fields may vary." Some categories need extra
 *      item specifics; add rows here as needed.
 *   - "Condition ID and Category ID should be verified against eBay's current
 *      template/category tools." Don't hardcode names; use the numeric IDs.
 *
 * Each entry maps an internal value -> a CSV column. `header` is what eBay
 * expects; `value` extracts/formats the value from a listing + its photos.
 */

export interface EbayFieldMapEntry {
  /** Stable internal key (for the column preview UI). */
  key: string;
  /** The exact CSV column header eBay expects. EDIT THESE per your template. */
  header: string;
  /** Extract + format the cell value for a given listing. */
  value: (listing: Listing, photos: ListingPhoto[]) => string;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function priceStr(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '';
  return v.toFixed(2);
}

/** Map our SaleType to eBay's Format column. */
function ebayFormat(listing: Listing): string {
  // Common eBay Format values are "Auction" and "FixedPrice".
  return listing.sale_type === 'Auction' ? 'Auction' : 'FixedPrice';
}

/** Join hosted photo URLs with the configured separator, honoring the limit. */
export function joinPhotoUrls(
  photos: ListingPhoto[],
  maxUrls: number = APP_CONFIG.maxPhotoUrlsPerListing,
): string {
  const ordered = [...photos].sort((a, b) => a.sort_order - b.sort_order);
  const urls = ordered
    .map((p) => p.public_url)
    .filter((u): u is string => !!u && u.trim() !== '')
    .slice(0, maxUrls);
  return urls.join(APP_CONFIG.photoUrlSeparator);
}

/**
 * Default eBay Seller Hub field map. EDIT the `header` strings to match your
 * downloaded template exactly.
 */
export const EBAY_FIELD_MAP: EbayFieldMapEntry[] = [
  { key: 'sku', header: 'Custom label (SKU)', value: (l) => str(l.sku) },
  { key: 'category_id', header: 'Category ID', value: (l) => str(l.category_id) },
  { key: 'title', header: 'Title', value: (l) => str(l.title) },
  { key: 'description', header: 'Description', value: (l) => str(l.description) },
  { key: 'condition_id', header: 'Condition ID', value: (l) => str(l.condition_id) },
  { key: 'format', header: 'Format', value: (l) => ebayFormat(l) },
  {
    key: 'start_price',
    header: 'Start price',
    value: (l) =>
      l.sale_type === 'Auction' ? priceStr(l.auction_start_price) : priceStr(l.buy_it_now_price),
  },
  { key: 'buy_it_now_price', header: 'Buy It Now price', value: (l) => priceStr(l.buy_it_now_price) },
  { key: 'quantity', header: 'Quantity', value: (l) => str(l.quantity) },
  {
    key: 'best_offer',
    header: 'Best Offer Enabled',
    value: (l) => (l.accept_offers ? '1' : '0'),
  },
  {
    key: 'best_offer_auto_accept',
    header: 'Best Offer Auto Accept Price',
    value: (l) => priceStr(l.auto_accept_offer),
  },
  {
    key: 'best_offer_min',
    header: 'Minimum Best Offer Price',
    value: (l) => priceStr(l.minimum_offer ?? l.auto_decline_offer),
  },
  {
    key: 'shipping_profile',
    header: 'Shipping profile name',
    value: (l) => str(l.shipping_profile),
  },
  {
    key: 'promotion_percent',
    header: 'Promoted Listings Ad Rate',
    value: (l) => (l.promotion_percent == null ? '' : str(l.promotion_percent)),
  },
  {
    key: 'photo_urls',
    header: 'Item photo URL',
    value: (l, photos) => joinPhotoUrls(photos),
  },

  // ----- Item specifics (sports cards) -----
  { key: 'sport', header: 'C:Sport', value: (l) => str(l.sport) },
  { key: 'league', header: 'C:League', value: (l) => str(l.league) },
  { key: 'player', header: 'C:Player/Athlete', value: (l) => str(l.player || l.shared_player) },
  { key: 'team', header: 'C:Team', value: (l) => str(l.team || l.shared_team) },
  { key: 'season', header: 'C:Season', value: (l) => str(l.season) },
  { key: 'manufacturer', header: 'C:Manufacturer', value: (l) => str(l.manufacturer) },
  { key: 'set_name', header: 'C:Set', value: (l) => str(l.set_name || l.shared_set) },
  { key: 'card_number', header: 'C:Card Number', value: (l) => str(l.card_number) },
  { key: 'parallel_variety', header: 'C:Parallel/Variety', value: (l) => str(l.parallel_variety) },
  { key: 'insert_set', header: 'C:Insert Set', value: (l) => str(l.insert_set) },
  { key: 'rookie_card', header: 'C:Rookie', value: (l) => str(l.rookie_card) },
  { key: 'autographed', header: 'C:Autographed', value: (l) => str(l.autographed) },
  { key: 'memorabilia', header: 'C:Memorabilia', value: (l) => str(l.memorabilia) },
  { key: 'graded', header: 'C:Graded', value: (l) => str(l.graded) },
  { key: 'professional_grader', header: 'C:Professional Grader', value: (l) => str(l.professional_grader) },
  { key: 'grade', header: 'C:Grade', value: (l) => str(l.grade) },
  { key: 'certification_number', header: 'C:Certification Number', value: (l) => str(l.certification_number) },
  { key: 'original_reprint', header: 'C:Original/Licensed Reprint', value: (l) => str(l.original_reprint) },
  { key: 'features', header: 'C:Features', value: (l) => str(l.features) },
  { key: 'year', header: 'C:Year Manufactured', value: (l) => str(l.year) },
  { key: 'card_condition', header: 'C:Card Condition', value: (l) => str(l.card_condition) },
  { key: 'language', header: 'C:Language', value: (l) => str(l.language) },
  {
    key: 'country',
    header: 'C:Country/Region of Manufacture',
    value: (l) => str(l.country_region_of_manufacture),
  },
];

/** The ordered list of eBay headers (for the CSV column preview UI). */
export function ebayHeaders(map: EbayFieldMapEntry[] = EBAY_FIELD_MAP): string[] {
  return map.map((m) => m.header);
}
