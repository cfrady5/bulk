import type { AIAnalysisResult, ConfidenceLevel, Listing } from '@/types';

import type { AnalyzeCardImagesRequest } from './types';

/**
 * Mock AI analysis.
 *
 * Returns realistic, *structured* sample data so the whole app workflow can be
 * exercised without any API keys. It is deliberately conservative — it leaves
 * some fields Missing/Low and surfaces them for human review rather than
 * silently guessing.
 *
 * The mock is deterministic-ish: it varies its output based on the listing_id
 * hash so different listings get different drafts (a graded slab, a raw rookie,
 * a lot, etc.).
 *
 * TODO (future): replace this with a real multimodal call — see
 * analyzeCardImages.ts for where to wire Claude / OpenAI / Google Vision.
 */

interface MockProfile {
  fields: Partial<Record<keyof Listing, string>>;
  confidence: Partial<Record<keyof Listing, ConfidenceLevel>>;
  reasons: Partial<Record<keyof Listing, string>>;
  suggested_title: string;
  suggested_description: string;
  suggested_keywords: string[];
  detected_imperfections: string[];
  warnings: string[];
  reasoning_summary: string;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const GRADED_PROFILE: MockProfile = {
  fields: {
    card_name: 'Victor Wembanyama',
    player: 'Victor Wembanyama',
    team: 'San Antonio Spurs',
    sport: 'Basketball',
    league: 'NBA',
    year: '2023',
    season: '2023-24',
    manufacturer: 'Panini',
    set_name: 'Prizm',
    card_number: '136',
    parallel_variety: 'Silver Prizm',
    rookie_card: 'Yes',
    graded: 'Yes',
    grading_company: 'PSA',
    grade: '10',
    professional_grader: 'PSA',
    raw_or_graded: 'Graded',
    card_condition: 'Graded - Gem Mint',
  },
  confidence: {
    card_name: 'High',
    player: 'High',
    team: 'High',
    sport: 'High',
    league: 'High',
    year: 'High',
    season: 'Medium',
    manufacturer: 'High',
    set_name: 'High',
    card_number: 'High',
    parallel_variety: 'Medium',
    rookie_card: 'High',
    graded: 'High',
    grading_company: 'High',
    grade: 'High',
    professional_grader: 'High',
    raw_or_graded: 'High',
    card_condition: 'High',
  },
  reasons: {
    grade: 'Slab label reads "GEM MT 10".',
    grading_company: 'PSA logo + red label detected on slab.',
    parallel_variety: 'Silver finish detected; confirm exact parallel name.',
    season: 'Inferred from year; verify season notation.',
  },
  suggested_title: '2023 Panini Prizm Victor Wembanyama #136 Silver Prizm Rookie PSA 10',
  suggested_description:
    '2023 Panini Prizm Victor Wembanyama #136 Silver Prizm PSA 10. Card shown is the exact card you will receive. Please review all photos for condition details. Ships securely in protective packaging.',
  suggested_keywords: ['Wembanyama', 'Prizm', 'Rookie', 'PSA 10', 'Spurs', 'Silver'],
  detected_imperfections: [],
  warnings: ['Confirm the exact parallel name on the card back.'],
  reasoning_summary:
    'Detected a PSA-graded slab. Read label for player, year, set, card number, and grade with high confidence. Parallel finish looks Silver but should be confirmed.',
};

const RAW_ROOKIE_PROFILE: MockProfile = {
  fields: {
    card_name: 'Tyrese Haliburton',
    player: 'Tyrese Haliburton',
    team: 'Indiana Pacers',
    sport: 'Basketball',
    league: 'NBA',
    year: '2020',
    season: '2020-21',
    manufacturer: 'Panini',
    set_name: 'Mosaic',
    card_number: '203',
    rookie_card: 'Yes',
    graded: 'No',
    raw_or_graded: 'Raw',
    card_condition: 'Near Mint',
    condition_notes: 'Surface looks clean; check corners under light.',
  },
  confidence: {
    card_name: 'High',
    player: 'High',
    team: 'High',
    sport: 'High',
    league: 'High',
    year: 'Medium',
    manufacturer: 'High',
    set_name: 'High',
    card_number: 'Medium',
    rookie_card: 'High',
    graded: 'High',
    raw_or_graded: 'High',
    card_condition: 'Low',
  },
  reasons: {
    year: 'Set design matches 2020-21; year not printed clearly.',
    card_number: 'Number partially obscured by glare; verify.',
    card_condition: 'Raw card — condition is an estimate only, confirm from photos.',
  },
  suggested_title: '2020 Panini Mosaic Tyrese Haliburton Rookie RC #203 Pacers',
  suggested_description:
    'Raw card. Card shown is the exact card you will receive. Please review front and back photos for condition. Any visible imperfections are shown in the photos when applicable. Ships securely.',
  suggested_keywords: ['Haliburton', 'Mosaic', 'Rookie', 'RC', 'Pacers'],
  detected_imperfections: ['Possible soft top-right corner — verify in detail photo.'],
  warnings: ['Do not claim Mint on a raw card; let photos show condition.'],
  reasoning_summary:
    'Identified a raw rookie card from set design and player. Year and card number are medium confidence due to glare. Condition left Low — raw cards should not be professionally graded by AI.',
};

const LOT_PROFILE: MockProfile = {
  fields: {
    sport: 'Basketball',
    league: 'NBA',
    shared_team: 'Indiana Pacers',
    shared_sport: 'Basketball',
    shared_theme: 'Team Lot',
    featured_cards: 'Tyrese Haliburton, Bennedict Mathurin, Myles Turner',
    number_of_cards: '25',
    card_condition: 'Mixed',
  },
  confidence: {
    sport: 'High',
    league: 'High',
    shared_team: 'Medium',
    shared_sport: 'High',
    shared_theme: 'Medium',
    featured_cards: 'Medium',
    number_of_cards: 'Low',
    card_condition: 'Medium',
  },
  reasons: {
    number_of_cards: 'Estimated from photos; count the physical stack to confirm.',
    featured_cards: 'Identified a few visible stars; review the rest of the lot.',
    shared_team: 'Most visible cards appear to be Pacers; verify.',
  },
  suggested_title: '25 Card Pacers Lot Tyrese Haliburton Mathurin Turner',
  suggested_description:
    'Card lot shown in the photos is the exact lot you will receive. Includes the featured cards listed above. Please review all photos for card selection and condition. Ships securely.',
  suggested_keywords: ['Pacers', 'Lot', 'Haliburton', 'Mathurin', 'Turner', 'NBA'],
  detected_imperfections: [],
  warnings: ['Card count is an estimate — confirm before listing.'],
  reasoning_summary:
    'Treated as a card lot. Summarized shared theme/team and a few featured players. Did not force per-card detail. Card count is Low confidence and must be confirmed.',
};

function pickProfile(req: AnalyzeCardImagesRequest): MockProfile {
  if (req.listing_type === 'Card Lot') return LOT_PROFILE;
  // Alternate between graded + raw for singles so the review queue has variety.
  return hashString(req.listing_id) % 2 === 0 ? GRADED_PROFILE : RAW_ROOKIE_PROFILE;
}

/** Simulate network/processing latency so the AI Processing screen feels real. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockAnalyzeCardImages(
  req: AnalyzeCardImagesRequest,
): Promise<AIAnalysisResult> {
  await delay(450 + (hashString(req.listing_id) % 400));

  const profile = pickProfile(req);

  // Compute which expected fields are missing (so the review screen can warn).
  const expected: (keyof Listing)[] = [
    'player',
    'sport',
    'year',
    'manufacturer',
    'set_name',
    'card_condition',
  ];
  const missing_fields = expected
    .filter((f) => !profile.fields[f] || profile.confidence[f] === 'Missing')
    .map((f) => String(f));

  return {
    listing_id: req.listing_id,
    listing_type: req.listing_type,
    fields: { ...profile.fields },
    confidence: { ...profile.confidence },
    reasons: { ...profile.reasons },
    suggested_title: profile.suggested_title,
    suggested_description: profile.suggested_description,
    suggested_keywords: profile.suggested_keywords,
    missing_fields,
    detected_imperfections: profile.detected_imperfections,
    warnings: profile.warnings,
    reasoning_summary: profile.reasoning_summary,
  };
}
