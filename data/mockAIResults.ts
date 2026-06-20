import type { AIAnalysisResult } from '@/types';

/**
 * Example AI analysis results keyed by listing id. Used to preview the review
 * screen's confidence badges + reasoning without running the (mock) AI service.
 *
 * The live flow generates these on the fly via services/ai/analyzeCardImages.ts;
 * this file is for static UI testing / Storybook-style previews.
 */

export const mockAIResults: Record<string, AIAnalysisResult> = {
  'listing-raw-missing': {
    listing_id: 'listing-raw-missing',
    listing_type: 'Single Card',
    fields: {
      player: 'Bennedict Mathurin',
      team: 'Indiana Pacers',
      sport: 'Basketball',
      year: '2022',
      manufacturer: 'Panini',
    },
    confidence: {
      player: 'High',
      team: 'Medium',
      sport: 'High',
      year: 'Medium',
      manufacturer: 'Low',
      set_name: 'Missing',
      card_number: 'Missing',
    },
    reasons: {
      manufacturer: 'Logo partially visible; verify manufacturer.',
      set_name: 'Could not determine the set from the photos.',
      card_number: 'Card number not legible in provided photos.',
    },
    suggested_title: 'Bennedict Mathurin Pacers Rookie',
    suggested_description:
      'Raw card. Card shown is the exact card you will receive. Please review front and back photos for condition. Ships securely.',
    suggested_keywords: ['Mathurin', 'Pacers', 'Rookie'],
    missing_fields: ['set_name', 'card_number'],
    detected_imperfections: [],
    warnings: ['Set and card number could not be identified — please review.'],
    reasoning_summary:
      'Identified the player and team but could not read the set or card number. Left those Missing rather than guessing.',
  },
};
