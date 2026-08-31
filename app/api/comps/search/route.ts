import { NextResponse } from 'next/server'
import { CardApiError, getLastRateLimit } from '@/lib/card-api'
import { getCompProvider } from '@/lib/comps'
import type { CardSale, RateLimitInfo } from '@/types/domain'

export const runtime = 'nodejs'

/**
 * POST /api/comps/search  { query: string, limit?: number, refresh?: boolean }
 *
 * Proxies The Card API server-side (the key never reaches the browser) and
 * caches results per normalized query so walking back to a card at a show
 * doesn't burn a second API request. `refresh: true` bypasses the cache.
 */

interface CacheEntry {
  sales: CardSale[]
  totalAvailable: number | null
  fetchedAt: number
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // several hours, per product spec
const cache = new Map<string, CacheEntry>()

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ')
}

export async function POST(request: Request) {
  let body: { query?: unknown; limit?: unknown; refresh?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (query.length < 3) {
    return NextResponse.json(
      { error: 'Enter a search like "2024 Prizm Caleb Williams Silver PSA 10"' },
      { status: 400 },
    )
  }
  const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 50)
  const refresh = body.refresh === true

  const key = `${normalizeQuery(query)}|${limit}`
  const cached = cache.get(key)
  const now = Date.now()

  if (!refresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      query,
      sales: cached.sales,
      totalAvailable: cached.totalAvailable,
      cached: true,
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
      rateLimit: getLastRateLimit(),
    })
  }

  try {
    const provider = getCompProvider()
    const result = await provider.searchSales({ query, limit })
    cache.set(key, {
      sales: result.sales,
      totalAvailable: result.totalAvailable,
      fetchedAt: now,
    })
    return NextResponse.json({
      query,
      sales: result.sales,
      totalAvailable: result.totalAvailable,
      cached: false,
      fetchedAt: new Date(now).toISOString(),
      rateLimit: result.rateLimit,
    })
  } catch (err) {
    // Serve stale cache rather than leaving the buyer stuck at the table.
    if (cached) {
      return NextResponse.json({
        query,
        sales: cached.sales,
        totalAvailable: cached.totalAvailable,
        cached: true,
        stale: true,
        fetchedAt: new Date(cached.fetchedAt).toISOString(),
        rateLimit: getLastRateLimit(),
      })
    }
    if (err instanceof CardApiError) {
      const status = err.rateLimited ? 429 : 502
      return NextResponse.json(
        { error: err.message, rateLimited: err.rateLimited, rateLimit: getLastRateLimit() },
        { status },
      )
    }
    return NextResponse.json({ error: 'Comp search failed' }, { status: 500 })
  }
}

export interface CompSearchResponse {
  query: string
  sales: CardSale[]
  totalAvailable: number | null
  cached: boolean
  stale?: boolean
  fetchedAt: string
  rateLimit: RateLimitInfo | null
}
