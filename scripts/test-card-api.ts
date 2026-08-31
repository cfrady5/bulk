/**
 * Server-only smoke test for The Card API. Run with:
 *   npx tsx scripts/test-card-api.ts
 * Reads CARD_API_KEY from .env.local. Never runs in the browser.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
    }
  } catch {
    // rely on the ambient environment
  }
}

async function run(query: string): Promise<void> {
  const apiKey = process.env.CARD_API_KEY
  if (!apiKey) throw new Error('CARD_API_KEY not set (create .env.local)')

  const url = new URL('https://www.thecardapi.com/api/v1/market/sales')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '10')

  const res = await fetch(url, { headers: { 'x-market-api-key': apiKey } })
  console.log(`\n=== ${query}`)
  console.log(
    `HTTP ${res.status} | rate limit remaining: ${res.headers.get('x-ratelimit-remaining')}/${res.headers.get('x-ratelimit-limit')}`,
  )
  if (!res.ok) {
    console.log(await res.text())
    return
  }
  const body = (await res.json()) as {
    data: { title: string; price: number; sale_date: string; platform: string }[]
    pagination: { total: number }
  }
  console.log(`records returned: ${body.data.length} (total available: ${body.pagination.total})`)
  for (const sale of body.data) {
    console.log(`  ${sale.sale_date}  $${sale.price.toFixed(2).padStart(9)}  [${sale.platform}]  ${sale.title}`)
  }
}

async function main(): Promise<void> {
  loadEnvLocal()
  const queries = ['2024 Prizm Caleb Williams PSA 10', '2023 Prizm Victor Wembanyama PSA 10']
  for (const q of queries) {
    await run(q)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
