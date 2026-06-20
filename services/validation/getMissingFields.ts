import type { Listing, ListingPhoto } from '@/types';

/**
 * Determine which *required* listing fields are still missing.
 *
 * Used both for the review-queue "missing fields count" and to drive the
 * missing-field callout on the review screen. This is intentionally about
 * presence, not eBay-specific rules (those live in validateEbayListing).
 */

export interface MissingFieldsResult {
  fields: string[];
  count: number;
}

/** Required fields that apply to every listing. */
const CORE_REQUIRED: { key: keyof Listing; label: string }[] = [
  { key: 'sku', label: 'SKU' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'category_id', label: 'Category ID' },
  { key: 'condition_id', label: 'Condition ID' },
  { key: 'shipping_profile', label: 'Shipping profile' },
  { key: 'sport', label: 'Sport' },
];

function isEmptyStr(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

export function getMissingFields(
  listing: Listing,
  photos: ListingPhoto[] = [],
): MissingFieldsResult {
  const missing: string[] = [];

  CORE_REQUIRED.forEach(({ key, label }) => {
    if (isEmptyStr(listing[key])) missing.push(label);
  });

  // Sale-format-dependent pricing.
  if (listing.sale_type === 'Auction' && listing.auction_start_price == null) {
    missing.push('Auction starting price');
  }
  if (listing.sale_type === 'Buy It Now' && listing.buy_it_now_price == null) {
    missing.push('Buy It Now price');
  }

  // Quantity.
  if (listing.quantity == null || listing.quantity < 1) {
    missing.push('Quantity');
  }

  // Photos.
  const hasPhoto = photos.length > 0;
  if (!hasPhoto) {
    missing.push('Photos');
  }

  // Single-card identity: player or card name should be present.
  if (listing.listing_type === 'Single Card') {
    if (isEmptyStr(listing.player) && isEmptyStr(listing.card_name)) {
      missing.push('Player / Card name');
    }
  } else {
    // Lots need a lot title or card name.
    if (isEmptyStr(listing.lot_title) && isEmptyStr(listing.title)) {
      missing.push('Lot title');
    }
  }

  return { fields: missing, count: missing.length };
}
