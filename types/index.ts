/**
 * bulk domain types.
 *
 * These are the single source of truth for the app's data model. They mirror
 * the Supabase schema (see supabase/schema.sql) and are used by the local
 * Zustand store, services, and UI.
 */

// ---------------------------------------------------------------------------
// Union / enum types
// ---------------------------------------------------------------------------

export type SaleType = 'Auction' | 'Buy It Now';

export type ListingType = 'Single Card' | 'Card Lot';

/** Batch-level default for what kinds of listings it will contain. */
export type BatchListingType = 'Singles' | 'Lots' | 'Mixed';

export type ReviewStatus = 'Draft' | 'Needs Review' | 'Ready' | 'Flagged' | 'Exported';

export type PhotoRole = 'front' | 'back' | 'imperfection' | 'lot_extra';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low' | 'Missing';

export type TriState = 'Yes' | 'No' | 'Unknown';

export type GradedState = 'Yes' | 'No';

export type RawOrGraded = 'Raw' | 'Graded';

export type OriginalOrReprint = 'Original' | 'Reprint';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type ExportStatus = 'pending' | 'success' | 'failed';

export type CsvExportMode = 'internal' | 'ebay';

// ---------------------------------------------------------------------------
// Batch
// ---------------------------------------------------------------------------

export interface Batch {
  id: string;
  name: string;
  default_listing_type: BatchListingType;
  default_sale_type: SaleType;
  default_shipping_profile: string;
  default_promotion_percent: number | null;
  default_quantity: number;
  default_condition: string;
  default_auction_start_price: number | null;
  default_buy_it_now_price: number | null;
  default_minimum_offer: number | null;
  default_auto_accept_offer: number | null;
  default_auto_decline_offer: number | null;
  default_accept_offers: boolean;
  default_category_id?: string;
  default_condition_id?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** Shape used when creating a batch (server fills id/timestamps). */
export type BatchInput = Omit<Batch, 'id' | 'created_at' | 'updated_at'>;

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

export interface Listing {
  id: string;
  batch_id: string;
  sku: string;
  listing_type: ListingType;

  // Card identity
  card_name: string;
  player: string;
  team: string;
  sport: string;
  league: string;
  year: string;
  season: string;
  manufacturer: string;
  set_name: string;
  card_number: string;
  parallel_variety: string;
  insert_set: string;
  rookie_card: TriState;
  autographed: TriState;
  memorabilia: TriState;

  // Grading / condition
  graded: GradedState;
  grading_company: string;
  grade: string;
  professional_grader: string;
  certification_number: string;
  raw_or_graded: RawOrGraded;
  original_reprint: OriginalOrReprint;
  card_condition: string;
  condition_notes: string;
  visible_imperfections: string;
  features: string;
  card_size: string;
  language: string;
  country_region_of_manufacture: string;

  // Pricing / sale format
  sale_type: SaleType;
  auction_start_price: number | null;
  buy_it_now_price: number | null;
  minimum_offer: number | null;
  auto_accept_offer: number | null;
  auto_decline_offer: number | null;
  accept_offers: boolean;
  quantity: number;
  shipping_profile: string;
  promotion_percent: number | null;

  // Content
  title: string;
  description: string;
  category_id: string;
  condition_id: string;
  internal_notes: string;

  // Lot-specific (only meaningful when listing_type === 'Card Lot')
  lot_title?: string;
  number_of_cards?: number | null;
  featured_cards?: string;
  shared_player?: string;
  shared_team?: string;
  shared_sport?: string;
  shared_league?: string;
  shared_set?: string;
  shared_theme?: string;
  lot_notes?: string;

  // Workflow
  review_status: ReviewStatus;
  ai_confidence_summary: string;

  created_at: string;
  updated_at: string;
}

/** A listing joined with its photos + computed AI confidence map. */
export interface ListingWithPhotos extends Listing {
  photos: ListingPhoto[];
  field_confidence?: Record<string, AIFieldConfidence>;
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export interface ListingPhoto {
  id: string;
  listing_id: string;
  batch_id: string;
  storage_path: string | null;
  /** Hosted public HTTPS URL (required for eBay CSV). May be null locally. */
  public_url: string | null;
  /** Local device URI captured by the camera (used as a preview fallback). */
  local_uri: string | null;
  photo_role: PhotoRole;
  sort_order: number;
  created_at: string;
}

/** Used while capturing, before a photo is persisted/uploaded. */
export interface PendingPhoto {
  id: string;
  local_uri: string;
  photo_role: PhotoRole;
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export interface AIFieldConfidence {
  id: string;
  listing_id: string;
  field_name: string;
  field_value: string;
  confidence: ConfidenceLevel;
  reason: string;
  created_at: string;
}

/** Structured result returned by the AI analysis service. */
export interface AIAnalysisResult {
  listing_id: string;
  listing_type: ListingType;
  /** Field name -> extracted value (subset of Listing fields). */
  fields: Partial<Record<keyof Listing, string>>;
  /** Field name -> confidence level for the extracted value. */
  confidence: Partial<Record<keyof Listing, ConfidenceLevel>>;
  /** Field name -> short reason / evidence string for display. */
  reasons: Partial<Record<keyof Listing, string>>;
  suggested_title: string;
  suggested_description: string;
  suggested_keywords: string[];
  missing_fields: string[];
  detected_imperfections: string[];
  warnings: string[];
  /** Human-readable summary suitable for the review screen. */
  reasoning_summary: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  id: string;
  listing_id: string;
  batch_id: string;
  severity: ValidationSeverity;
  field_name: string;
  message: string;
  suggested_fix: string;
  created_at: string;
}

/** Aggregate of validation across a whole batch. */
export interface BatchValidationSummary {
  batch_id: string;
  total_ready: number;
  listings_with_errors: number;
  listings_with_warnings: number;
  error_count: number;
  warning_count: number;
  results: ValidationResult[];
  /** listing_id -> its results */
  byListing: Record<string, ValidationResult[]>;
  canExport: boolean;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export interface ExportJob {
  id: string;
  batch_id: string;
  exported_count: number;
  csv_file_path: string;
  export_status: ExportStatus;
  export_mode: CsvExportMode;
  validation_errors_count: number;
  validation_warnings_count: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Derived UI helpers
// ---------------------------------------------------------------------------

export interface BatchStatsSummary {
  total: number;
  draft: number;
  needsReview: number;
  ready: number;
  flagged: number;
  exported: number;
  photoCount: number;
}

export const REVIEW_STATUSES: ReviewStatus[] = [
  'Needs Review',
  'Draft',
  'Ready',
  'Flagged',
  'Exported',
];

export const SALE_TYPES: SaleType[] = ['Auction', 'Buy It Now'];
export const LISTING_TYPES: ListingType[] = ['Single Card', 'Card Lot'];
export const BATCH_LISTING_TYPES: BatchListingType[] = ['Singles', 'Lots', 'Mixed'];
export const TRISTATE_OPTIONS: TriState[] = ['Yes', 'No', 'Unknown'];
export const PHOTO_ROLES: PhotoRole[] = ['front', 'back', 'imperfection', 'lot_extra'];
