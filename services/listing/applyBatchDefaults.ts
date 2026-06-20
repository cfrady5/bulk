import type { Batch, Listing, ListingType } from '@/types';
import { uuid } from '@/lib/id';

/**
 * Batch defaults reduce repetitive data entry during review. When a listing is
 * created in a batch, it inherits the batch's default sale type, quantity,
 * condition, prices, shipping profile, promotion %, and offer settings.
 *
 * Defaults are applied as *starting values* — every field stays user-editable.
 */

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Build a brand-new, mostly-empty listing for a batch. Inherits batch defaults
 * for sale/pricing/fulfillment fields.
 */
export function createEmptyListing(
  batch: Batch,
  options: { listingType?: ListingType; sku?: string } = {},
): Listing {
  const listingType: ListingType =
    options.listingType ?? (batch.default_listing_type === 'Lots' ? 'Card Lot' : 'Single Card');

  const ts = nowIso();

  return {
    id: uuid(),
    batch_id: batch.id,
    sku: options.sku ?? '',
    listing_type: listingType,

    card_name: '',
    player: '',
    team: '',
    sport: '',
    league: '',
    year: '',
    season: '',
    manufacturer: '',
    set_name: '',
    card_number: '',
    parallel_variety: '',
    insert_set: '',
    rookie_card: 'Unknown',
    autographed: 'Unknown',
    memorabilia: 'Unknown',

    graded: 'No',
    grading_company: '',
    grade: '',
    professional_grader: '',
    certification_number: '',
    raw_or_graded: 'Raw',
    original_reprint: 'Original',
    card_condition: batch.default_condition || '',
    condition_notes: '',
    visible_imperfections: '',
    features: '',
    card_size: 'Standard',
    language: 'English',
    country_region_of_manufacture: 'United States',

    sale_type: batch.default_sale_type,
    auction_start_price: batch.default_auction_start_price,
    buy_it_now_price: batch.default_buy_it_now_price,
    minimum_offer: batch.default_minimum_offer,
    auto_accept_offer: batch.default_auto_accept_offer,
    auto_decline_offer: batch.default_auto_decline_offer,
    accept_offers: batch.default_accept_offers,
    quantity: listingType === 'Card Lot' ? 1 : batch.default_quantity,
    shipping_profile: batch.default_shipping_profile,
    promotion_percent: batch.default_promotion_percent,

    title: '',
    description: '',
    category_id: batch.default_category_id ?? '',
    condition_id: batch.default_condition_id ?? '',
    internal_notes: '',

    // Lot-specific defaults
    lot_title: listingType === 'Card Lot' ? '' : undefined,
    number_of_cards: listingType === 'Card Lot' ? null : undefined,
    featured_cards: listingType === 'Card Lot' ? '' : undefined,
    shared_player: listingType === 'Card Lot' ? '' : undefined,
    shared_team: listingType === 'Card Lot' ? '' : undefined,
    shared_sport: listingType === 'Card Lot' ? '' : undefined,
    shared_league: listingType === 'Card Lot' ? '' : undefined,
    shared_set: listingType === 'Card Lot' ? '' : undefined,
    shared_theme: listingType === 'Card Lot' ? '' : undefined,
    lot_notes: listingType === 'Card Lot' ? '' : undefined,

    review_status: 'Draft',
    ai_confidence_summary: '',

    created_at: ts,
    updated_at: ts,
  };
}

/**
 * Re-apply batch defaults onto an existing listing for any fields the user has
 * not yet set. Only fills *empty* values so user edits are never overwritten.
 */
export function applyBatchDefaults(listing: Listing, batch: Batch): Listing {
  const isEmptyNum = (v: number | null | undefined) => v === null || v === undefined;
  const isEmptyStr = (v: string | null | undefined) => !v || v.trim() === '';

  return {
    ...listing,
    sale_type: listing.sale_type ?? batch.default_sale_type,
    auction_start_price: isEmptyNum(listing.auction_start_price)
      ? batch.default_auction_start_price
      : listing.auction_start_price,
    buy_it_now_price: isEmptyNum(listing.buy_it_now_price)
      ? batch.default_buy_it_now_price
      : listing.buy_it_now_price,
    minimum_offer: isEmptyNum(listing.minimum_offer)
      ? batch.default_minimum_offer
      : listing.minimum_offer,
    auto_accept_offer: isEmptyNum(listing.auto_accept_offer)
      ? batch.default_auto_accept_offer
      : listing.auto_accept_offer,
    auto_decline_offer: isEmptyNum(listing.auto_decline_offer)
      ? batch.default_auto_decline_offer
      : listing.auto_decline_offer,
    accept_offers: listing.accept_offers ?? batch.default_accept_offers,
    quantity: listing.quantity || batch.default_quantity,
    shipping_profile: isEmptyStr(listing.shipping_profile)
      ? batch.default_shipping_profile
      : listing.shipping_profile,
    promotion_percent: isEmptyNum(listing.promotion_percent)
      ? batch.default_promotion_percent
      : listing.promotion_percent,
    card_condition: isEmptyStr(listing.card_condition)
      ? batch.default_condition
      : listing.card_condition,
    category_id: isEmptyStr(listing.category_id)
      ? batch.default_category_id ?? ''
      : listing.category_id,
    condition_id: isEmptyStr(listing.condition_id)
      ? batch.default_condition_id ?? ''
      : listing.condition_id,
    updated_at: nowIso(),
  };
}
