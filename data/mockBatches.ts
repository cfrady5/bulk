import type { Batch } from '@/types';

/**
 * Seed batches. These let the whole UI be explored before Supabase is wired up.
 * The local store seeds itself from these on first launch.
 */

export const MOCK_BATCH_PSA_ID = 'batch-psa-june20';
export const MOCK_BATCH_RAW_ID = 'batch-raw-basketball';

export const mockBatches: Batch[] = [
  {
    id: MOCK_BATCH_PSA_ID,
    name: 'June 20 PSA Slabs',
    default_listing_type: 'Singles',
    default_sale_type: 'Buy It Now',
    default_shipping_profile: 'Standard Cards (BMWT)',
    default_promotion_percent: 6,
    default_quantity: 1,
    default_condition: 'Graded',
    default_auction_start_price: 0.99,
    default_buy_it_now_price: null,
    default_minimum_offer: null,
    default_auto_accept_offer: null,
    default_auto_decline_offer: null,
    default_accept_offers: true,
    default_category_id: '261328', // Sports Trading Cards (verify per category)
    default_condition_id: '2750', // Graded (verify against eBay)
    notes: 'PSA-graded basketball slabs from the June pickup.',
    created_at: '2026-06-20T14:10:00.000Z',
    updated_at: '2026-06-20T14:10:00.000Z',
  },
  {
    id: MOCK_BATCH_RAW_ID,
    name: 'Raw Basketball Singles',
    default_listing_type: 'Mixed',
    default_sale_type: 'Buy It Now',
    default_shipping_profile: 'Standard Cards (BMWT)',
    default_promotion_percent: 4,
    default_quantity: 1,
    default_condition: 'Ungraded',
    default_auction_start_price: 0.99,
    default_buy_it_now_price: null,
    default_minimum_offer: null,
    default_auto_accept_offer: null,
    default_auto_decline_offer: null,
    default_accept_offers: true,
    default_category_id: '261328',
    default_condition_id: '4000', // Ungraded (verify against eBay)
    notes: 'Raw singles + a Pacers team lot.',
    created_at: '2026-06-18T09:30:00.000Z',
    updated_at: '2026-06-19T16:45:00.000Z',
  },
];
