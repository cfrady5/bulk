import type { Listing } from '@/types';

import { MOCK_BATCH_PSA_ID, MOCK_BATCH_RAW_ID } from './mockBatches';

/**
 * Seed listings covering the required test scenarios:
 *  - Single raw card
 *  - Graded PSA card
 *  - Card lot
 *  - Listing with missing set
 *  - Listing with a title over 80 characters
 *  - Listing missing price
 *  - Listing with low AI confidence
 *  - Listing ready to export
 *  - Listing with a duplicate SKU
 */

/** A fully-populated base so each mock only overrides what it needs. */
const base: Omit<Listing, 'id' | 'batch_id' | 'sku' | 'created_at' | 'updated_at'> = {
  listing_type: 'Single Card',
  card_name: '',
  player: '',
  team: '',
  sport: 'Basketball',
  league: 'NBA',
  year: '',
  season: '',
  manufacturer: '',
  set_name: '',
  card_number: '',
  parallel_variety: '',
  insert_set: '',
  rookie_card: 'Unknown',
  autographed: 'No',
  memorabilia: 'No',
  graded: 'No',
  grading_company: '',
  grade: '',
  professional_grader: '',
  certification_number: '',
  raw_or_graded: 'Raw',
  original_reprint: 'Original',
  card_condition: 'Near Mint',
  condition_notes: '',
  visible_imperfections: '',
  features: '',
  card_size: 'Standard',
  language: 'English',
  country_region_of_manufacture: 'United States',
  sale_type: 'Buy It Now',
  auction_start_price: null,
  buy_it_now_price: 19.99,
  minimum_offer: null,
  auto_accept_offer: null,
  auto_decline_offer: null,
  accept_offers: true,
  quantity: 1,
  shipping_profile: 'Standard Cards (BMWT)',
  promotion_percent: 6,
  title: '',
  description: '',
  category_id: '261328',
  condition_id: '4000',
  internal_notes: '',
  review_status: 'Draft',
  ai_confidence_summary: '',
};

function ts(date: string): { created_at: string; updated_at: string } {
  return { created_at: date, updated_at: date };
}

export const mockListings: Listing[] = [
  // 1) Graded PSA card — READY to export.
  {
    ...base,
    id: 'listing-psa-wemby',
    batch_id: MOCK_BATCH_PSA_ID,
    sku: 'JUNE20PSA-001',
    card_name: 'Victor Wembanyama',
    player: 'Victor Wembanyama',
    team: 'San Antonio Spurs',
    year: '2023',
    season: '2023-24',
    manufacturer: 'Panini',
    set_name: 'Prizm',
    card_number: '136',
    parallel_variety: 'Silver Prizm',
    rookie_card: 'Yes',
    graded: 'Yes',
    grading_company: 'PSA',
    grade: '10',
    professional_grader: 'PSA',
    certification_number: '77329104',
    raw_or_graded: 'Graded',
    card_condition: 'Graded',
    condition_id: '2750',
    title: '2023 Panini Prizm Victor Wembanyama #136 Silver Prizm Rookie PSA 10',
    description:
      '2023 Panini Prizm Victor Wembanyama #136 Silver Prizm PSA 10. Card shown is the exact card you will receive. Please review all photos for condition details. Ships securely in protective packaging.',
    buy_it_now_price: 899.99,
    review_status: 'Ready',
    ai_confidence_summary: 'High confidence • all key fields detected',
    ...ts('2026-06-20T14:20:00.000Z'),
  },

  // 2) Graded card with a TITLE OVER 80 CHARACTERS — needs review.
  {
    ...base,
    id: 'listing-psa-longtitle',
    batch_id: MOCK_BATCH_PSA_ID,
    sku: 'JUNE20PSA-002',
    card_name: 'Tyrese Haliburton',
    player: 'Tyrese Haliburton',
    team: 'Indiana Pacers',
    year: '2020',
    season: '2020-21',
    manufacturer: 'Panini',
    set_name: 'Mosaic',
    card_number: '203',
    parallel_variety: 'Genesis Prizm',
    rookie_card: 'Yes',
    graded: 'Yes',
    grading_company: 'PSA',
    grade: '9',
    professional_grader: 'PSA',
    certification_number: '88210345',
    raw_or_graded: 'Graded',
    card_condition: 'Graded',
    condition_id: '2750',
    title:
      '2020 Panini Mosaic Tyrese Haliburton Genesis Prizm Rookie RC #203 Indiana Pacers PSA 9 Mint Investment Card',
    description:
      'Card shown is the exact card you will receive. Please review all photos for condition details. Ships securely in protective packaging.',
    buy_it_now_price: 149.99,
    review_status: 'Needs Review',
    ai_confidence_summary: 'Medium confidence • 1 field needs review',
    ...ts('2026-06-20T14:25:00.000Z'),
  },

  // 3) Single raw card — READY (drives the "ready" + raw scenarios).
  {
    ...base,
    id: 'listing-raw-judge',
    batch_id: MOCK_BATCH_RAW_ID,
    sku: 'RAW-JUNE18-001',
    card_name: 'Aaron Judge',
    player: 'Aaron Judge',
    team: 'New York Yankees',
    sport: 'Baseball',
    league: 'MLB',
    year: '2022',
    season: '2022',
    manufacturer: 'Topps',
    set_name: 'Chrome',
    card_number: '99',
    parallel_variety: 'Refractor',
    rookie_card: 'No',
    card_condition: 'Near Mint',
    title: '2022 Topps Chrome Aaron Judge Refractor #99 Yankees',
    description:
      'Raw card. Card shown is the exact card you will receive. Please review front and back photos for condition. Ships securely.',
    buy_it_now_price: 24.99,
    review_status: 'Ready',
    ai_confidence_summary: 'High confidence • all key fields detected',
    ...ts('2026-06-18T10:05:00.000Z'),
  },

  // 4) Listing with MISSING SET + MISSING PRICE + LOW AI CONFIDENCE.
  {
    ...base,
    id: 'listing-raw-missing',
    batch_id: MOCK_BATCH_RAW_ID,
    sku: 'RAW-JUNE18-002',
    card_name: 'Bennedict Mathurin',
    player: 'Bennedict Mathurin',
    team: 'Indiana Pacers',
    year: '2022',
    manufacturer: 'Panini',
    set_name: '', // MISSING set
    card_number: '',
    rookie_card: 'Unknown',
    card_condition: 'Near Mint',
    title: 'Bennedict Mathurin Pacers Rookie',
    description: '',
    buy_it_now_price: null, // MISSING price
    review_status: 'Needs Review',
    ai_confidence_summary: 'Low confidence • 3 fields need review',
    ...ts('2026-06-18T10:12:00.000Z'),
  },

  // 5) Card LOT — needs review.
  {
    ...base,
    id: 'listing-lot-pacers',
    batch_id: MOCK_BATCH_RAW_ID,
    sku: 'RAW-JUNE18-LOT-003',
    listing_type: 'Card Lot',
    sport: 'Basketball',
    league: 'NBA',
    card_condition: 'Mixed',
    title: '25 Card Pacers Lot Tyrese Haliburton Mathurin Turner',
    description:
      'Card lot shown in the photos is the exact lot you will receive. Includes the featured cards listed above. Please review all photos for card selection and condition. Ships securely.',
    buy_it_now_price: 39.99,
    lot_title: 'Indiana Pacers 25-Card Team Lot',
    number_of_cards: 25,
    featured_cards: 'Tyrese Haliburton, Bennedict Mathurin, Myles Turner',
    shared_player: '',
    shared_team: 'Indiana Pacers',
    shared_sport: 'Basketball',
    shared_league: 'NBA',
    shared_set: '',
    shared_theme: 'Team Lot',
    lot_notes: 'Mostly base + a few inserts.',
    review_status: 'Needs Review',
    ai_confidence_summary: 'Medium confidence • confirm card count',
    ...ts('2026-06-18T10:20:00.000Z'),
  },

  // 6) DUPLICATE SKU (same as #3) — drives the duplicate-SKU validation case.
  {
    ...base,
    id: 'listing-raw-dupe',
    batch_id: MOCK_BATCH_RAW_ID,
    sku: 'RAW-JUNE18-001', // intentional duplicate of listing-raw-judge
    card_name: 'Mookie Betts',
    player: 'Mookie Betts',
    team: 'Los Angeles Dodgers',
    sport: 'Baseball',
    league: 'MLB',
    year: '2021',
    manufacturer: 'Topps',
    set_name: 'Series 1',
    card_number: '50',
    card_condition: 'Near Mint',
    title: '2021 Topps Series 1 Mookie Betts #50 Dodgers',
    description:
      'Raw card. Card shown is the exact card you will receive. Please review front and back photos for condition. Ships securely.',
    buy_it_now_price: 4.99,
    review_status: 'Draft',
    ai_confidence_summary: 'Medium confidence',
    ...ts('2026-06-18T10:28:00.000Z'),
  },

  // 7) Flagged listing.
  {
    ...base,
    id: 'listing-raw-flagged',
    batch_id: MOCK_BATCH_RAW_ID,
    sku: 'RAW-JUNE18-004',
    card_name: 'Unknown Player',
    player: '',
    team: '',
    year: '',
    manufacturer: '',
    set_name: '',
    title: 'Vintage basketball card',
    description: '',
    buy_it_now_price: null,
    review_status: 'Flagged',
    ai_confidence_summary: 'Low confidence • could not identify card',
    internal_notes: 'Hard to read — research later.',
    ...ts('2026-06-18T10:35:00.000Z'),
  },

  // 8) Already EXPORTED listing (for the Exported group + history).
  {
    ...base,
    id: 'listing-psa-exported',
    batch_id: MOCK_BATCH_PSA_ID,
    sku: 'JUNE20PSA-003',
    card_name: 'Anthony Edwards',
    player: 'Anthony Edwards',
    team: 'Minnesota Timberwolves',
    year: '2020',
    season: '2020-21',
    manufacturer: 'Panini',
    set_name: 'Prizm',
    card_number: '258',
    parallel_variety: 'Base',
    rookie_card: 'Yes',
    graded: 'Yes',
    grading_company: 'PSA',
    grade: '10',
    professional_grader: 'PSA',
    certification_number: '66120987',
    raw_or_graded: 'Graded',
    card_condition: 'Graded',
    condition_id: '2750',
    title: '2020 Panini Prizm Anthony Edwards #258 Rookie PSA 10',
    description:
      'Card shown is the exact card you will receive. Please review all photos for condition details. Ships securely.',
    buy_it_now_price: 199.99,
    review_status: 'Exported',
    ai_confidence_summary: 'High confidence • all key fields detected',
    ...ts('2026-06-20T15:00:00.000Z'),
  },
];
