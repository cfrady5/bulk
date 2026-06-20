import { uuid } from '@/lib/id';
import { generateDescription } from '@/services/listing/generateDescription';
import { generateListingTitle } from '@/services/listing/generateListingTitle';
import type {
  AIAnalysisResult,
  AIFieldConfidence,
  ConfidenceLevel,
  Listing,
  ListingPhoto,
} from '@/types';

/**
 * Turn a raw AIAnalysisResult into a concrete listing draft.
 *
 * - Applies extracted field values onto the listing (without clobbering values
 *   the user already typed).
 * - Generates a title + description (preferring the AI suggestion, falling back
 *   to our deterministic generators).
 * - Produces AIFieldConfidence records for the review screen badges.
 * - Builds a short confidence summary and sets status to "Needs Review".
 */

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
  Missing: 0,
};

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

export interface ListingDraft {
  listing: Listing;
  confidence: AIFieldConfidence[];
  fieldConfidenceMap: Record<string, AIFieldConfidence>;
}

export function buildListingDraft(
  listing: Listing,
  analysis: AIAnalysisResult,
  photos: ListingPhoto[] = [],
): ListingDraft {
  const next: Listing = { ...listing };
  const confidence: AIFieldConfidence[] = [];
  const fieldConfidenceMap: Record<string, AIFieldConfidence> = {};
  const nowIso = new Date().toISOString();

  // Apply each AI-extracted field if the user hasn't already filled it in.
  (Object.keys(analysis.fields) as (keyof Listing)[]).forEach((field) => {
    const value = analysis.fields[field];
    const level = analysis.confidence[field] ?? 'Missing';
    const reason = analysis.reasons[field] ?? '';

    if (value !== undefined && isEmpty((next as unknown as Record<string, unknown>)[field as string])) {
      // number_of_cards is numeric on the model; coerce when needed.
      if (field === 'number_of_cards') {
        const n = parseInt(String(value), 10);
        (next as unknown as Record<string, unknown>)[field] = Number.isFinite(n) ? n : null;
      } else {
        (next as unknown as Record<string, unknown>)[field] = value;
      }
    }

    const record: AIFieldConfidence = {
      id: uuid(),
      listing_id: listing.id,
      field_name: String(field),
      field_value: value ?? '',
      confidence: level,
      reason,
      created_at: nowIso,
    };
    confidence.push(record);
    fieldConfidenceMap[String(field)] = record;
  });

  // Title: prefer AI suggestion, else generate from fields.
  if (isEmpty(next.title)) {
    const suggested = analysis.suggested_title?.trim();
    if (suggested) {
      next.title = suggested;
    } else {
      next.title = generateListingTitle(next).title;
    }
  }

  // Description: prefer AI suggestion, else generate.
  if (isEmpty(next.description)) {
    next.description =
      analysis.suggested_description?.trim() || generateDescription(next, { photos });
  }

  // Visible imperfections: seed from detected imperfections if empty.
  if (isEmpty(next.visible_imperfections) && analysis.detected_imperfections.length > 0) {
    next.visible_imperfections = analysis.detected_imperfections.join('; ');
  }

  // Keep raw_or_graded consistent with graded.
  if (next.graded === 'Yes') next.raw_or_graded = 'Graded';
  if (next.graded === 'No') next.raw_or_graded = 'Raw';

  next.ai_confidence_summary = buildConfidenceSummary(analysis);
  next.review_status = 'Needs Review';
  next.updated_at = nowIso;

  return { listing: next, confidence, fieldConfidenceMap };
}

/** Human-readable one-liner for the review queue card. */
export function buildConfidenceSummary(analysis: AIAnalysisResult): string {
  const levels = Object.values(analysis.confidence);
  if (levels.length === 0) return 'No AI data';

  const counts = { High: 0, Medium: 0, Low: 0, Missing: 0 } as Record<ConfidenceLevel, number>;
  levels.forEach((l) => {
    counts[l] = (counts[l] ?? 0) + 1;
  });

  const lowOrMissing = counts.Low + counts.Missing + analysis.missing_fields.length;
  const avg =
    levels.reduce((acc, l) => acc + CONFIDENCE_RANK[l], 0) / Math.max(1, levels.length);

  const overall = avg >= 2.5 ? 'High' : avg >= 1.5 ? 'Medium' : 'Low';

  if (lowOrMissing === 0) {
    return `${overall} confidence • all key fields detected`;
  }
  return `${overall} confidence • ${lowOrMissing} field${lowOrMissing === 1 ? '' : 's'} need review`;
}
