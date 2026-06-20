import { APP_CONFIG } from '@/constants/config';

/**
 * Shorten an eBay title to fit within the character cap (default 80).
 *
 * Strategy: progressively drop the lowest-value tokens (team names, generic
 * words, then trailing detail) while preserving the most important identity
 * tokens (year, player, card number, grade). We never silently fabricate.
 */

const MAX = APP_CONFIG.maxTitleLength;

/** Words that can be dropped first when a title is too long. */
const LOW_VALUE_TOKENS = new Set([
  'card',
  'sports',
  'trading',
  'the',
  'official',
  'authentic',
  'nm-mt',
  'mint',
]);

export interface ShortenResult {
  title: string;
  wasShortened: boolean;
  originalLength: number;
  finalLength: number;
}

export function shortenEbayTitle(input: string, maxLength: number = MAX): ShortenResult {
  const original = (input || '').replace(/\s+/g, ' ').trim();
  const originalLength = original.length;

  if (originalLength <= maxLength) {
    return { title: original, wasShortened: false, originalLength, finalLength: originalLength };
  }

  let tokens = original.split(' ');

  // 1) Remove low-value filler words from the end inward.
  for (let i = tokens.length - 1; i >= 0 && tokens.join(' ').length > maxLength; i--) {
    if (LOW_VALUE_TOKENS.has(tokens[i].toLowerCase())) {
      tokens.splice(i, 1);
    }
  }

  // 2) Still too long: trim trailing tokens (least important info sits at end).
  while (tokens.length > 1 && tokens.join(' ').length > maxLength) {
    tokens.pop();
  }

  let result = tokens.join(' ').trim();

  // 3) Hard cap as a last resort (e.g. one extremely long token).
  if (result.length > maxLength) {
    result = result.slice(0, maxLength).trimEnd();
  }

  return {
    title: result,
    wasShortened: true,
    originalLength,
    finalLength: result.length,
  };
}

/** Convenience: returns just the shortened string. */
export function shortenEbayTitleString(input: string, maxLength: number = MAX): string {
  return shortenEbayTitle(input, maxLength).title;
}
