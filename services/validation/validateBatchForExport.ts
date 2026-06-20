import type {
  AIFieldConfidence,
  BatchValidationSummary,
  Listing,
  ListingPhoto,
  ReviewStatus,
  ValidationResult,
} from '@/types';

import { validateEbayListing } from './validateEbayListing';

/**
 * Validate every listing selected for export and roll the results up into a
 * batch-level summary that the Export screen consumes.
 */

export interface ValidateBatchInput {
  batchId: string;
  listings: Listing[];
  photosByListing: Record<string, ListingPhoto[]>;
  confidenceByListing?: Record<string, Record<string, AIFieldConfidence>>;
  /**
   * Which statuses to include. Defaults to Ready only (the export default), but
   * the Export screen can pass other statuses when the user opts in.
   */
  includeStatuses?: ReviewStatus[];
  maxPhotoUrls?: number;
}

export function validateBatchForExport(input: ValidateBatchInput): BatchValidationSummary {
  const includeStatuses = input.includeStatuses ?? (['Ready'] as ReviewStatus[]);
  const target = input.listings.filter((l) => includeStatuses.includes(l.review_status));

  // All SKUs across the whole batch (not just selected) so duplicates across
  // statuses are still caught.
  const allSkus = input.listings.map((l) => l.sku).filter(Boolean);

  const results: ValidationResult[] = [];
  const byListing: Record<string, ValidationResult[]> = {};

  const listingsWithErrors = new Set<string>();
  const listingsWithWarnings = new Set<string>();
  let errorCount = 0;
  let warningCount = 0;

  target.forEach((listing) => {
    const photos = input.photosByListing[listing.id] ?? [];
    const fieldConfidence = input.confidenceByListing?.[listing.id];
    const listingResults = validateEbayListing({
      listing,
      photos,
      batchSkus: allSkus,
      fieldConfidence,
      maxPhotoUrls: input.maxPhotoUrls,
    });

    byListing[listing.id] = listingResults;
    listingResults.forEach((r) => {
      results.push(r);
      if (r.severity === 'error') {
        errorCount += 1;
        listingsWithErrors.add(listing.id);
      } else if (r.severity === 'warning') {
        warningCount += 1;
        listingsWithWarnings.add(listing.id);
      }
    });
  });

  return {
    batch_id: input.batchId,
    total_ready: target.length,
    listings_with_errors: listingsWithErrors.size,
    listings_with_warnings: listingsWithWarnings.size,
    error_count: errorCount,
    warning_count: warningCount,
    results,
    byListing,
    // Can export when there are listings selected and no hard errors.
    canExport: target.length > 0 && listingsWithErrors.size === 0,
  };
}
