import type { Listing, ListingPhoto } from '@/types';

/**
 * Honest, clean description generation.
 *
 * Rules:
 *  - Never overstate condition. Do not claim "Mint" unless graded or the user
 *    confirms it.
 *  - Always use "exact card shown in photos" language.
 *  - Include an imperfection note when imperfection photos exist.
 *  - All descriptions are editable in the review screen.
 */

function clean(value: string | null | undefined): string {
  return (value ?? '').toString().trim();
}

function hasImperfectionPhotos(photos: ListingPhoto[] = []): boolean {
  return photos.some((p) => p.photo_role === 'imperfection');
}

export interface DescriptionOptions {
  photos?: ListingPhoto[];
}

export function generateDescription(
  listing: Partial<Listing>,
  options: DescriptionOptions = {},
): string {
  const photos = options.photos ?? [];
  const lines: string[] = [];

  const isLot = listing.listing_type === 'Card Lot';
  const isGraded = listing.graded === 'Yes';

  if (isLot) {
    const lead = clean(listing.lot_title) || clean(listing.title) || 'Card lot';
    lines.push(`${lead}.`);
    lines.push('Card lot shown in the photos is the exact lot you will receive.');
    if (clean(listing.featured_cards)) {
      lines.push(`Includes the featured cards listed: ${clean(listing.featured_cards)}.`);
    } else {
      lines.push('Includes the featured cards listed above.');
    }
    lines.push('Please review all photos for card selection and condition.');
  } else if (isGraded) {
    // Graded single — we may reference the slab grade honestly.
    const lead =
      clean(listing.title) ||
      [
        clean(listing.year),
        clean(listing.manufacturer),
        clean(listing.set_name),
        clean(listing.player),
      ]
        .filter(Boolean)
        .join(' ');
    const gradeLine = [clean(listing.grading_company), clean(listing.grade)]
      .filter(Boolean)
      .join(' ');
    lines.push(`${lead}${gradeLine ? ` ${gradeLine}` : ''}.`.replace(/\.\.$/, '.'));
    lines.push('Card shown is the exact card you will receive.');
    lines.push('Please review all photos for condition details.');
  } else {
    // Raw single — conservative language, no grading claims.
    lines.push('Raw card. Card shown is the exact card you will receive.');
    lines.push('Please review front and back photos for condition.');
  }

  // Imperfection note when applicable.
  if (hasImperfectionPhotos(photos) || clean(listing.visible_imperfections)) {
    const note = clean(listing.visible_imperfections);
    lines.push(
      note
        ? `Visible imperfections: ${note}. See detail photos.`
        : 'Any visible imperfections are shown in the photos when applicable.',
    );
  }

  // Optional condition notes if the user added any.
  if (clean(listing.condition_notes)) {
    lines.push(clean(listing.condition_notes));
  }

  lines.push('Ships securely in protective packaging.');

  return lines.join(' ').replace(/\s+/g, ' ').trim();
}
