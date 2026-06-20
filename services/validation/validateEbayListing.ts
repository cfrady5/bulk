import { APP_CONFIG } from '@/constants/config';
import { uuid } from '@/lib/id';
import { isValidPrice } from '@/lib/format';
import { shortenEbayTitle } from '@/services/listing/shortenEbayTitle';
import type {
  AIFieldConfidence,
  Listing,
  ListingPhoto,
  ValidationResult,
  ValidationSeverity,
} from '@/types';

/**
 * Validate a single listing against common eBay Seller Hub bulk-upload issues.
 *
 * Returns a flat list of ValidationResult records. The export screen and
 * batch validator aggregate these. "error" severities are hard blockers;
 * "warning" can be exported only with explicit user acknowledgement.
 */

export interface ValidateListingContext {
  listing: Listing;
  photos: ListingPhoto[];
  /** Other SKUs in the same batch, used for duplicate detection. */
  batchSkus?: string[];
  /** AI confidence map keyed by field name. */
  fieldConfidence?: Record<string, AIFieldConfidence>;
  /** Max photo URLs per listing (configurable, default from APP_CONFIG). */
  maxPhotoUrls?: number;
}

function make(
  listing: Listing,
  severity: ValidationSeverity,
  field_name: string,
  message: string,
  suggested_fix: string,
): ValidationResult {
  return {
    id: uuid(),
    listing_id: listing.id,
    batch_id: listing.batch_id,
    severity,
    field_name,
    message,
    suggested_fix,
    created_at: new Date().toISOString(),
  };
}

function looksLikeValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  // For export we require hosted public HTTPS URLs (eBay can't read file://).
  return /^https:\/\/[^\s]+\.[^\s]+/i.test(trimmed);
}

export function validateEbayListing(ctx: ValidateListingContext): ValidationResult[] {
  const { listing, photos } = ctx;
  const maxPhotoUrls = ctx.maxPhotoUrls ?? APP_CONFIG.maxPhotoUrlsPerListing;
  const results: ValidationResult[] = [];

  // --- SKU ---------------------------------------------------------------
  if (!listing.sku || listing.sku.trim() === '') {
    results.push(make(listing, 'error', 'sku', 'Missing SKU.', 'Generate or enter a SKU.'));
  } else if (ctx.batchSkus) {
    const dupes = ctx.batchSkus.filter(
      (s) => s.trim().toUpperCase() === listing.sku.trim().toUpperCase(),
    );
    if (dupes.length > 1) {
      results.push(
        make(
          listing,
          'error',
          'sku',
          `Duplicate SKU "${listing.sku}" in this batch.`,
          'Make each SKU unique within the batch.',
        ),
      );
    }
  }

  // --- Title -------------------------------------------------------------
  if (!listing.title || listing.title.trim() === '') {
    results.push(make(listing, 'error', 'title', 'Missing title.', 'Add a descriptive title.'));
  } else if (listing.title.length > APP_CONFIG.maxTitleLength) {
    const shortened = shortenEbayTitle(listing.title).title;
    results.push(
      make(
        listing,
        'error',
        'title',
        `Title is ${listing.title.length} characters (max ${APP_CONFIG.maxTitleLength}).`,
        `Use a shorter title, e.g. "${shortened}".`,
      ),
    );
  }

  // --- Description -------------------------------------------------------
  if (!listing.description || listing.description.trim() === '') {
    results.push(
      make(listing, 'warning', 'description', 'Missing description.', 'Add a short description.'),
    );
  }

  // --- Sale format + pricing --------------------------------------------
  if (!listing.sale_type) {
    results.push(
      make(listing, 'error', 'sale_type', 'Missing sale format.', 'Choose Auction or Buy It Now.'),
    );
  } else if (listing.sale_type === 'Auction') {
    if (listing.auction_start_price == null) {
      results.push(
        make(
          listing,
          'error',
          'auction_start_price',
          'Auction listing is missing a starting price.',
          'Enter an auction starting price.',
        ),
      );
    } else if (!isValidPrice(listing.auction_start_price)) {
      results.push(
        make(
          listing,
          'error',
          'auction_start_price',
          'Invalid auction starting price.',
          'Enter a valid positive price.',
        ),
      );
    }
  } else if (listing.sale_type === 'Buy It Now') {
    if (listing.buy_it_now_price == null) {
      results.push(
        make(
          listing,
          'error',
          'buy_it_now_price',
          'Buy It Now listing is missing a price.',
          'Enter a Buy It Now price.',
        ),
      );
    } else if (!isValidPrice(listing.buy_it_now_price)) {
      results.push(
        make(
          listing,
          'error',
          'buy_it_now_price',
          'Invalid Buy It Now price.',
          'Enter a valid positive price.',
        ),
      );
    }
  }

  // Offer thresholds sanity.
  if (
    listing.accept_offers &&
    listing.auto_accept_offer != null &&
    listing.auto_decline_offer != null &&
    listing.auto_accept_offer < listing.auto_decline_offer
  ) {
    results.push(
      make(
        listing,
        'warning',
        'auto_accept_offer',
        'Auto-accept is lower than auto-decline.',
        'Auto-accept should be ≥ auto-decline.',
      ),
    );
  }

  // --- Quantity ----------------------------------------------------------
  if (listing.quantity == null) {
    results.push(make(listing, 'error', 'quantity', 'Missing quantity.', 'Set a quantity (≥ 1).'));
  } else if (!Number.isInteger(listing.quantity) || listing.quantity < 1) {
    results.push(
      make(listing, 'error', 'quantity', 'Invalid quantity.', 'Quantity must be a whole number ≥ 1.'),
    );
  }

  // --- Shipping / category / condition ----------------------------------
  if (!listing.shipping_profile || listing.shipping_profile.trim() === '') {
    results.push(
      make(
        listing,
        'error',
        'shipping_profile',
        'Missing shipping profile.',
        'Select a shipping profile.',
      ),
    );
  }
  if (!listing.category_id || listing.category_id.trim() === '') {
    results.push(
      make(
        listing,
        'error',
        'category_id',
        'Missing eBay category ID.',
        'Enter the category ID from your eBay template.',
      ),
    );
  }
  if (!listing.condition_id || listing.condition_id.trim() === '') {
    results.push(
      make(
        listing,
        'error',
        'condition_id',
        'Missing eBay condition ID.',
        'Enter the condition ID from your eBay template.',
      ),
    );
  }

  // --- Photos ------------------------------------------------------------
  if (photos.length === 0) {
    results.push(
      make(listing, 'error', 'photos', 'No photos attached.', 'Capture at least a front photo.'),
    );
  } else {
    const publicUrls = photos.map((p) => p.public_url).filter(Boolean) as string[];
    if (publicUrls.length === 0) {
      results.push(
        make(
          listing,
          'error',
          'photos',
          'No public photo URLs. eBay cannot use local files.',
          'Upload photos to get hosted HTTPS URLs (configure Supabase Storage).',
        ),
      );
    } else {
      const emptyish = photos.filter((p) => p.public_url != null && p.public_url.trim() === '');
      if (emptyish.length > 0) {
        results.push(
          make(listing, 'warning', 'photos', 'Some photo URLs are empty.', 'Re-upload those photos.'),
        );
      }
      const broken = publicUrls.filter((u) => !looksLikeValidUrl(u));
      if (broken.length > 0) {
        results.push(
          make(
            listing,
            'warning',
            'photos',
            `${broken.length} photo URL(s) do not look like public HTTPS links.`,
            'Ensure photos are uploaded to a public HTTPS host.',
          ),
        );
      }
      if (publicUrls.length > maxPhotoUrls) {
        results.push(
          make(
            listing,
            'warning',
            'photos',
            `${publicUrls.length} photos exceed the ${maxPhotoUrls}-URL export limit.`,
            `Only the first ${maxPhotoUrls} will be exported, or raise the limit in config.`,
          ),
        );
      }
    }

    // Front / back coverage for card listings.
    const hasFront = photos.some((p) => p.photo_role === 'front');
    const hasBack = photos.some((p) => p.photo_role === 'back');
    if (!hasFront) {
      results.push(
        make(listing, 'error', 'photos', 'No front photo.', 'Add a front photo of the card.'),
      );
    }
    if (!hasBack) {
      results.push(
        make(
          listing,
          'warning',
          'photos',
          'No back photo for this card listing.',
          'Add a back photo so buyers can see condition.',
        ),
      );
    }
  }

  // --- Promotion ---------------------------------------------------------
  if (listing.promotion_percent != null) {
    if (
      !Number.isFinite(listing.promotion_percent) ||
      listing.promotion_percent < 0 ||
      listing.promotion_percent > 100
    ) {
      results.push(
        make(
          listing,
          'warning',
          'promotion_percent',
          'Invalid promotion percentage.',
          'Use a value between 0 and 100.',
        ),
      );
    }
  }

  // --- Required item specifics ------------------------------------------
  // eBay sports-card categories generally require Sport at minimum.
  if (!listing.sport || listing.sport.trim() === '') {
    results.push(
      make(
        listing,
        'error',
        'sport',
        'Missing required item specific: Sport.',
        'Set the Sport (e.g. Basketball).',
      ),
    );
  }
  if (
    listing.listing_type === 'Single Card' &&
    (!listing.player || listing.player.trim() === '') &&
    (!listing.card_name || listing.card_name.trim() === '')
  ) {
    results.push(
      make(
        listing,
        'warning',
        'player',
        'Missing Player/Athlete item specific.',
        'Add the player or card name.',
      ),
    );
  }

  // --- AI confidence on required fields ---------------------------------
  if (ctx.fieldConfidence) {
    const requiredForConfidence = ['player', 'year', 'set_name', 'sport'];
    requiredForConfidence.forEach((field) => {
      const c = ctx.fieldConfidence?.[field];
      const value = (listing as unknown as Record<string, unknown>)[field];
      const stillEmptyOrAi =
        value === undefined || value === null || String(value).trim() === '' ? false : true;
      if (c && (c.confidence === 'Low' || c.confidence === 'Missing') && stillEmptyOrAi) {
        results.push(
          make(
            listing,
            'warning',
            field,
            `Low AI confidence on "${field}". ${c.reason}`.trim(),
            'Verify this value against the photos before exporting.',
          ),
        );
      }
    });
  }

  return results;
}

/** Convenience: true if a listing has zero hard errors. */
export function listingHasNoErrors(ctx: ValidateListingContext): boolean {
  return validateEbayListing(ctx).every((r) => r.severity !== 'error');
}
