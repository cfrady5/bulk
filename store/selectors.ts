import type {
  BatchStatsSummary,
  Listing,
  ListingPhoto,
  ReviewStatus,
} from '@/types';

/**
 * Pure derived-state helpers used by screens + components. Keeping these out of
 * the store avoids re-render churn and makes them easy to unit test.
 */

export function computeBatchStats(
  listings: Listing[],
  photos: ListingPhoto[],
): BatchStatsSummary {
  const stats: BatchStatsSummary = {
    total: listings.length,
    draft: 0,
    needsReview: 0,
    ready: 0,
    flagged: 0,
    exported: 0,
    photoCount: photos.length,
  };

  listings.forEach((l) => {
    switch (l.review_status) {
      case 'Draft':
        stats.draft += 1;
        break;
      case 'Needs Review':
        stats.needsReview += 1;
        break;
      case 'Ready':
        stats.ready += 1;
        break;
      case 'Flagged':
        stats.flagged += 1;
        break;
      case 'Exported':
        stats.exported += 1;
        break;
    }
  });

  return stats;
}

/** Group listings by review status (preserves input order within a group). */
export function groupByStatus(listings: Listing[]): Record<ReviewStatus, Listing[]> {
  const groups: Record<ReviewStatus, Listing[]> = {
    'Needs Review': [],
    Draft: [],
    Ready: [],
    Flagged: [],
    Exported: [],
  };
  listings.forEach((l) => {
    groups[l.review_status].push(l);
  });
  return groups;
}

/** Aggregate stats across many batches (for the home dashboard). */
export function aggregateStats(allListings: Listing[]): BatchStatsSummary {
  return computeBatchStats(allListings, []);
}
