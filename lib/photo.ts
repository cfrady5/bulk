import type { ListingPhoto, PhotoRole } from '@/types';

/** Best display URI for a photo: prefer hosted URL, fall back to local URI. */
export function photoDisplayUri(photo: Pick<ListingPhoto, 'public_url' | 'local_uri'>): string | null {
  return photo.public_url || photo.local_uri || null;
}

/** Pick the cover photo for a listing (front first, else first photo). */
export function coverPhoto(photos: ListingPhoto[]): ListingPhoto | null {
  if (photos.length === 0) return null;
  const front = photos.find((p) => p.photo_role === 'front');
  return front ?? [...photos].sort((a, b) => a.sort_order - b.sort_order)[0];
}

export const PHOTO_ROLE_LABEL: Record<PhotoRole, string> = {
  front: 'Front',
  back: 'Back',
  imperfection: 'Detail',
  lot_extra: 'Lot',
};
