import type {
  AIAnalysisResult,
  Batch,
  ConfidenceLevel,
  Listing,
  ListingType,
  PhotoRole,
} from '@/types';

/** A photo reference handed to the AI service (local or hosted). */
export interface AIPhotoRef {
  role: PhotoRole;
  /** Local device URI (file://...) captured by the camera. */
  local_uri?: string | null;
  /** Hosted public HTTPS URL once uploaded. */
  public_url?: string | null;
}

/** Request payload for analyzing a single listing's photos. */
export interface AnalyzeCardImagesRequest {
  listing_id: string;
  listing_type: ListingType;
  photos: AIPhotoRef[];
  /** Convenience accessors (also present in `photos`). */
  front?: AIPhotoRef | null;
  back?: AIPhotoRef | null;
  imperfections?: AIPhotoRef[];
  /** Batch defaults inform conservative pricing / sale-type suggestions. */
  batchDefaults?: Partial<Batch>;
}

export type { AIAnalysisResult, ConfidenceLevel, Listing };

/** Signature every AI analysis implementation conforms to. */
export type AnalyzeCardImages = (req: AnalyzeCardImagesRequest) => Promise<AIAnalysisResult>;
