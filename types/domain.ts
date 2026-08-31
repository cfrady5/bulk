/**
 * Core domain types. Everything downstream of the comp providers uses these
 * shapes — never a provider's raw response format.
 */

export interface CardSale {
  id?: string
  title: string
  price: number
  soldAt?: string
  platform?: string
  listingType?: string
  url?: string
  imageUrl?: string
  grader?: string
  grade?: string
  raw?: unknown
}

/** A sale as displayed/used in the buy flow, with client-side state attached. */
export interface EvaluatedSale extends CardSale {
  matchScore: number
  included: boolean
}

export type Confidence = 'high' | 'medium' | 'low' | 'none'

export interface CompStatistics {
  count: number
  average: number | null
  median: number | null
  low: number | null
  high: number | null
  lastSale: number | null
  lastSaleDate: string | null
  /** Coefficient of variation (stddev / mean) of included prices. */
  coefficientOfVariation: number | null
  highVariance: boolean
  confidence: Confidence
  /** The value the engine recommends (median at 3+, average at 1-2). */
  autoValue: number | null
}

export interface RateLimitInfo {
  limit: number | null
  remaining: number | null
  /** Unix epoch seconds when the window resets. */
  reset: number | null
  capturedAt: string
}

export type Grader = 'Raw' | 'PSA' | 'BGS' | 'SGC' | 'CGC' | 'Other'

export interface CardDetails {
  playerName: string
  year: string
  product: string
  parallel: string
  cardNumber: string
  serialNumber: string
  grader: Grader | ''
  grade: string
  certNumber: string
  teamId: string | null
  sportId: string | null
  imageFront?: string
  imageBack?: string
  imageSlab?: string
}

export interface Sport {
  id: string
  name: string
  slug: string
}

export interface Team {
  id: string
  sportId: string
  name: string
  city: string
  abbreviation: string
}

export interface TeamGroup {
  id: string
  name: string
  slug: string
  teamIds: string[]
}

export interface ValueTier {
  id: string
  name: string
  minimumValue: number
  maximumValue: number | null
  sortOrder: number
}

export interface TeamNeed {
  id: string
  teamGroupId: string
  valueTierId: string
  quantityNeeded: number
  quantityAcquired: number
  /** 0-1, e.g. 0.94 */
  payoutPercentage: number
  /** 0-1, e.g. 0.87 */
  targetBuyPercentage: number
  active: boolean
  updatedAt: string
}

/** Result of the team-need engine for one card. */
export interface NeedResolution {
  teamGroup: TeamGroup | null
  tier: ValueTier | null
  need: TeamNeed | null
  quantityRemaining: number
  payoutPercentage: number | null
  targetBuyPercentage: number | null
}

export type Decision = 'buy' | 'negotiate' | 'pass' | 'no-need' | 'unknown'

export interface FinancialSummary {
  marketValue: number
  payoutPercentage: number
  targetBuyPercentage: number
  expectedPayout: number
  targetBuyPrice: number
  askingPrice: number | null
  expectedProfit: number | null
  roi: number | null
  acquisitionPercentage: number | null
  decision: Decision
}

export const RULE_TAGS = [
  'LEAF',
  'REDEMPTION',
  'LOW LIQUIDITY',
  'ONLY ONE COMP',
  'RARE PARALLEL',
  'VINTAGE',
  'MANUAL REVIEW',
] as const
export type RuleTag = (typeof RULE_TAGS)[number]

export interface PricingRule {
  id: string
  name: string
  ruleType: 'tag' | 'confidence' | 'manual'
  adjustmentType: 'percentage'
  /** e.g. -0.05 for -5% */
  adjustmentValue: number
  active: boolean
  description: string
}

export interface Show {
  id: string
  name: string
  city: string
  state: string
  startDate: string | null
  endDate: string | null
  createdAt: string
}

export type PurchaseStatus = 'purchased' | 'passed'

export interface Purchase {
  id: string
  card: CardDetails
  showId: string | null
  sellerName: string | null
  query: string
  marketValue: number
  autoMarketValue: number | null
  manualMarketValue: number | null
  confidence: Confidence
  compCount: number
  payoutPercentage: number
  expectedPayout: number
  targetBuyPercentage: number
  targetBuyPrice: number
  askingPrice: number | null
  actualPurchasePrice: number
  expectedProfit: number
  expectedRoi: number
  teamGroupId: string | null
  valueTierId: string | null
  teamNeedId: string | null
  /** Thumbnail from the best-matching included comp, shown when no own photo exists. */
  compImageUrl: string | null
  decisionShown: Decision
  overrodeDecision: boolean
  notes: string
  ruleTags: RuleTag[]
  status: PurchaseStatus
  purchasedAt: string
}
