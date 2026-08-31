import type { CardSale, RateLimitInfo } from '@/types/domain'

export interface CompSearch {
  query: string
  limit?: number
}

export interface CompSearchResult {
  sales: CardSale[]
  totalAvailable: number | null
  rateLimit: RateLimitInfo | null
}

/**
 * A source of recent-sale comps. The Card API is the first implementation;
 * Card Ladder / CardHedge / eBay can be added behind the same interface.
 */
export interface CompProvider {
  readonly name: string
  searchSales(search: CompSearch): Promise<CompSearchResult>
}
