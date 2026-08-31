import 'server-only'
import { searchCardSales, type RawCardApiSale } from '@/lib/card-api'
import type { CardSale } from '@/types/domain'
import type { CompProvider, CompSearch, CompSearchResult } from './types'

function normalizeSale(raw: RawCardApiSale): CardSale | null {
  if (typeof raw.price !== 'number' || !Number.isFinite(raw.price) || raw.price <= 0) {
    return null // sales without a usable price cannot contribute to valuation
  }
  return {
    id: raw.id,
    title: raw.title ?? '',
    price: raw.price,
    soldAt: raw.sold_at ?? raw.sale_date ?? undefined,
    platform: raw.platform ?? undefined,
    listingType: raw.listing_type ?? undefined,
    url: raw.listing_url ?? undefined,
    imageUrl: raw.thumbnail_url ?? raw.image_url ?? undefined,
    grader: raw.grader ?? undefined,
    grade: raw.grade ?? undefined,
    raw,
  }
}

export const cardApiProvider: CompProvider = {
  name: 'card-api',
  async searchSales(search: CompSearch): Promise<CompSearchResult> {
    const { response, rateLimit } = await searchCardSales(search.query, search.limit ?? 25)
    const sales: CardSale[] = []
    const seen = new Set<string>()
    for (const raw of response.data) {
      const sale = normalizeSale(raw)
      if (!sale) continue
      // Drop exact duplicates (same listing id, or same title+price+date).
      const key = sale.id ?? `${sale.title}|${sale.price}|${sale.soldAt}`
      if (seen.has(key)) continue
      seen.add(key)
      sales.push(sale)
    }
    return {
      sales,
      totalAvailable: response.pagination?.total ?? null,
      rateLimit,
    }
  },
}
