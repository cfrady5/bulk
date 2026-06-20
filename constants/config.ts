/**
 * App-wide tunable configuration.
 *
 * Keep "magic numbers" that may change with eBay templates / categories here,
 * not scattered through the code.
 */

export const APP_CONFIG = {
  appName: 'CardSnap Listings',

  /**
   * eBay listing titles are capped at 80 characters. Validation enforces this
   * before a listing can be marked Ready.
   */
  maxTitleLength: 80,

  /**
   * Max number of photo URLs joined into a single eBay CSV cell.
   * eBay supports up to 12 for many categories; some templates differ, so this
   * is configurable. Validation warns when a listing exceeds it.
   */
  maxPhotoUrlsPerListing: 12,

  /** Character used to join multiple image URLs in one CSV field. */
  photoUrlSeparator: '|',

  /** Supabase Storage bucket that holds card photos. */
  storageBucket: 'card-listing-photos',

  /**
   * Capture-mode safety: require front + back before allowing "Next Listing"
   * unless the user explicitly overrides.
   */
  requireFrontBackBeforeNext: true,

  /**
   * Image quality used when capturing / picking (0..1).
   * MVP prioritizes sharp, readable card images over small file size.
   * TODO: tune compression once we measure upload times on real devices.
   */
  captureQuality: 0.9,

  /** Performance: how many photos a batch should comfortably handle. */
  targetPhotosPerBatch: 200,

  /** Confidence levels that should be surfaced as "needs attention". */
  lowConfidenceLevels: ['Low', 'Missing'] as const,
} as const;

export type AppConfig = typeof APP_CONFIG;
