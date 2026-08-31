import 'server-only'
import { cardApiProvider } from './card-api-provider'
import type { CompProvider } from './types'

const providers: Record<string, CompProvider> = {
  [cardApiProvider.name]: cardApiProvider,
}

/** Returns the active comp provider. Swap or extend here to add Card Ladder, eBay, etc. */
export function getCompProvider(name = 'card-api'): CompProvider {
  const provider = providers[name]
  if (!provider) throw new Error(`Unknown comp provider: ${name}`)
  return provider
}

export type { CompProvider, CompSearch, CompSearchResult } from './types'
