import { APP_CONFIG } from '@/constants/config';
import type { Listing } from '@/types';

import { shortenEbayTitle } from './shortenEbayTitle';

/**
 * eBay-optimized sports card title generation.
 *
 * Singles:  YEAR MANUFACTURER SET PLAYER #CARD PARALLEL GRADE
 *   e.g. "2023 Panini Prizm Victor Wembanyama #136 Silver PSA 10"
 *
 * Lots:     COUNT CARD LOT THEME FEATURED PLAYER/TEAM/SET
 *   e.g. "25 Card Pacers Lot Tyrese Haliburton Mathurin Turner"
 *
 * We only include details that are present; low-confidence values should be
 * confirmed by the user before being baked into the title (the review screen
 * controls this — see requirements).
 */

export interface TitleResult {
  title: string;
  length: number;
  overLimit: boolean;
  shortened?: string;
}

function clean(value: string | null | undefined): string {
  return (value ?? '').toString().trim();
}

function joinTokens(tokens: Array<string | null | undefined>): string {
  return tokens
    .map(clean)
    .filter((t) => t.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSingleTitle(listing: Partial<Listing>): string {
  const cardNumber = clean(listing.card_number);
  const numberToken = cardNumber ? (cardNumber.startsWith('#') ? cardNumber : `#${cardNumber}`) : '';

  // Rookie indicator only if explicitly Yes.
  const rookieToken = listing.rookie_card === 'Yes' ? 'Rookie RC' : '';

  // Grade only when graded.
  let gradeToken = '';
  if (listing.graded === 'Yes') {
    const company = clean(listing.grading_company);
    const grade = clean(listing.grade);
    gradeToken = joinTokens([company, grade]);
  }

  return joinTokens([
    listing.year,
    listing.manufacturer,
    listing.set_name,
    listing.player,
    numberToken,
    listing.parallel_variety,
    listing.insert_set,
    rookieToken,
    listing.autographed === 'Yes' ? 'Auto' : '',
    gradeToken,
  ]);
}

function buildLotTitle(listing: Partial<Listing>): string {
  const count = listing.number_of_cards ? `${listing.number_of_cards} Card` : 'Card';
  const theme = clean(listing.shared_theme);
  const team = clean(listing.shared_team);
  const player = clean(listing.shared_player);
  const set = clean(listing.shared_set);
  const sport = clean(listing.shared_sport);
  const featured = clean(listing.featured_cards);

  // "COUNT Card [Team] Lot [Theme] [Featured]"
  return joinTokens([
    count,
    team || sport,
    'Lot',
    theme,
    player,
    set,
    featured,
  ]);
}

/**
 * Generate a listing title from listing fields.
 * Returns the title, its length, whether it exceeds the cap, and a shortened
 * variant when it does.
 */
export function generateListingTitle(
  listing: Partial<Listing>,
  maxLength: number = APP_CONFIG.maxTitleLength,
): TitleResult {
  const raw =
    listing.listing_type === 'Card Lot' ? buildLotTitle(listing) : buildSingleTitle(listing);

  const title = raw.length > 0 ? raw : clean(listing.card_name) || clean(listing.title);
  const length = title.length;
  const overLimit = length > maxLength;

  return {
    title,
    length,
    overLimit,
    shortened: overLimit ? shortenEbayTitle(title, maxLength).title : undefined,
  };
}
