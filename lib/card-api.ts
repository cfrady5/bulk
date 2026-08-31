import 'server-only'
import type { RateLimitInfo } from '@/types/domain'

/**
 * Low-level client for The Card API (thecardapi.com).
 * Server-only: authenticates with CARD_API_KEY, which must never reach the browser.
 *
 * Observed response shape (verified against the live API):
 *   { data: RawSale[], pagination: { total, page, limit, pages }, meta: {...} }
 */

// The bare domain 307-redirects to www and fetch may drop headers on redirect,
// so always call the www host directly.
const BASE_URL = 'https://www.thecardapi.com/api/v1'

export interface RawCardApiSale {
  id: string
  platform: string | null
  listing_type: string | null
  title: string
  sale_date: string | null
  sold_at: string | null
  price: number | null
  currency: string | null
  bids: number | null
  image_url: string | null
  thumbnail_url: string | null
  listing_url: string | null
  grade: string | null
  grader: string | null
  grading_company: string | null
  cert: string | null
  [key: string]: unknown
}

export interface CardApiSalesResponse {
  data: RawCardApiSale[]
  pagination: { total: number; page: number; limit: number; pages: number }
  meta: Record<string, unknown>
}

export class CardApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly rateLimited: boolean = false,
  ) {
    super(message)
    this.name = 'CardApiError'
  }
}

// Last-seen rate limit info, captured from response headers on every call.
// Module-level state is fine here: it is advisory display data only.
let lastRateLimit: RateLimitInfo | null = null

export function getLastRateLimit(): RateLimitInfo | null {
  return lastRateLimit
}

function captureRateLimit(headers: Headers): RateLimitInfo {
  const num = (name: string) => {
    const v = headers.get(name)
    return v !== null && v !== '' ? Number(v) : null
  }
  lastRateLimit = {
    limit: num('x-ratelimit-limit'),
    remaining: num('x-ratelimit-remaining'),
    reset: num('x-ratelimit-reset'),
    capturedAt: new Date().toISOString(),
  }
  return lastRateLimit
}

export async function searchCardSales(
  query: string,
  limit = 10,
): Promise<{ response: CardApiSalesResponse; rateLimit: RateLimitInfo }> {
  const apiKey = process.env.CARD_API_KEY
  if (!apiKey) {
    throw new CardApiError('CARD_API_KEY is not configured on the server', null)
  }

  const url = new URL(`${BASE_URL}/market/sales`)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))

  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'x-market-api-key': apiKey },
      // Comps are time-sensitive; we cache at the application layer instead.
      cache: 'no-store',
    })
  } catch {
    throw new CardApiError('Could not reach The Card API (network failure)', null)
  }

  const rateLimit = captureRateLimit(res.headers)

  if (res.status === 429) {
    throw new CardApiError('The Card API rate limit has been reached', 429, true)
  }
  if (!res.ok) {
    throw new CardApiError(`The Card API returned HTTP ${res.status}`, res.status)
  }

  const body = (await res.json()) as CardApiSalesResponse
  if (!Array.isArray(body?.data)) {
    throw new CardApiError('Unexpected response shape from The Card API', res.status)
  }
  return { response: body, rateLimit }
}
