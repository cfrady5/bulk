import type { AIAnalysisResult } from '@/types';

import { mockAnalyzeCardImages } from './mockAnalyzeCardImages';
import type { AnalyzeCardImages, AnalyzeCardImagesRequest } from './types';

/**
 * AI analysis entry point.
 *
 * For the MVP this delegates to the mock implementation so the app runs with no
 * API keys. The function signature is the seam where a real multimodal model
 * gets wired in.
 *
 * ---------------------------------------------------------------------------
 * TODO (future) — connect a real multimodal AI / OCR provider:
 *
 *   1. Read a provider flag (e.g. EXPO_PUBLIC_AI_PROVIDER) and branch here.
 *   2. Upload/host the photos first (eBay + most vision APIs need URLs), then
 *      pass the public_url of front/back/imperfection photos to the model.
 *   3. Prompt the model to return STRUCTURED JSON matching AIAnalysisResult —
 *      including per-field confidence. Do NOT accept free-text only.
 *   4. For graded cards, instruct the model to read the slab label.
 *      For raw cards, flag visible issues but never "grade" the card.
 *      For lots, summarize + identify featured cards; don't force per-card detail.
 *   5. Never ship secret API keys in the client bundle — proxy the call through
 *      a Supabase Edge Function (services + key live server-side).
 *
 * Example providers: Anthropic Claude (vision), OpenAI, Google Cloud Vision,
 * AWS Rekognition / Textract, or a dedicated card-recognition API.
 * ---------------------------------------------------------------------------
 */

const USE_MOCK = true; // Flip to false once a real provider is wired below.

export const analyzeCardImages: AnalyzeCardImages = async (
  req: AnalyzeCardImagesRequest,
): Promise<AIAnalysisResult> => {
  if (USE_MOCK) {
    return mockAnalyzeCardImages(req);
  }

  // TODO: real implementation, e.g.:
  //
  // const response = await fetch(`${EDGE_FUNCTION_URL}/analyze-card`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     listing_id: req.listing_id,
  //     listing_type: req.listing_type,
  //     image_urls: req.photos.map((p) => p.public_url).filter(Boolean),
  //   }),
  // });
  // const json = await response.json();
  // return normalizeToAIAnalysisResult(json);

  return mockAnalyzeCardImages(req);
};
