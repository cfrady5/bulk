import type { ListingPhoto, PhotoRole } from '@/types';

import { mockListings } from './mockListings';

/**
 * Seed photos for the mock listings.
 *
 * public_url uses stable HTTPS placeholder images so export validation treats
 * them as valid hosted URLs. In a real run these come from Supabase Storage.
 */

let counter = 0;
function photo(
  listingId: string,
  batchId: string,
  role: PhotoRole,
  sortOrder: number,
  seed: string,
): ListingPhoto {
  counter += 1;
  return {
    id: `photo-${counter}`,
    listing_id: listingId,
    batch_id: batchId,
    storage_path: `${batchId}/${listingId}/${seed}.jpg`,
    public_url: `https://picsum.photos/seed/${seed}/900/1260`,
    local_uri: null,
    photo_role: role,
    sort_order: sortOrder,
    created_at: '2026-06-20T14:20:00.000Z',
  };
}

export const mockPhotos: ListingPhoto[] = mockListings.flatMap((l) => {
  const base = [
    photo(l.id, l.batch_id, 'front', 0, `${l.id}-front`),
    photo(l.id, l.batch_id, 'back', 1, `${l.id}-back`),
  ];

  // Add an imperfection photo to a couple of listings.
  if (l.id === 'listing-raw-judge' || l.id === 'listing-psa-longtitle') {
    base.push(photo(l.id, l.batch_id, 'imperfection', 2, `${l.id}-imp`));
  }

  // The lot gets extra cards.
  if (l.listing_type === 'Card Lot') {
    base.push(photo(l.id, l.batch_id, 'lot_extra', 2, `${l.id}-x1`));
    base.push(photo(l.id, l.batch_id, 'lot_extra', 3, `${l.id}-x2`));
    base.push(photo(l.id, l.batch_id, 'lot_extra', 4, `${l.id}-x3`));
  }

  // The "flagged / unidentified" card has only a front photo (missing back).
  if (l.id === 'listing-raw-flagged') {
    return [photo(l.id, l.batch_id, 'front', 0, `${l.id}-front`)];
  }

  return base;
});
