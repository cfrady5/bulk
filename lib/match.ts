import type { CardSale } from '@/types/domain'

/**
 * Conservative comp-relevance scoring.
 *
 * The biggest valuation risk is silently averaging in raw cards, wrong grades,
 * wrong parallels, lots, or reprints. We parse the user's query into weighted
 * attributes, score each sale title against them, and auto-exclude poor matches
 * (the user can always re-include a sale by tapping it).
 */

const GRADERS = ['psa', 'bgs', 'sgc', 'cgc']
const NEGATIVE_TERMS = ['lot', 'reprint', 'digital', 'break', 'checklist', 'custom', 'novelty']

export interface ParsedQuery {
  year: string | null
  grader: string | null
  grade: string | null
  terms: string[]
  exclusions: string[]
}

export function parseQuery(query: string): ParsedQuery {
  const tokens = query.trim().split(/\s+/)
  const exclusions: string[] = []
  const kept: string[] = []
  for (const t of tokens) {
    if (t.startsWith('-') && t.length > 1) exclusions.push(t.slice(1).toLowerCase())
    else kept.push(t)
  }
  const text = kept.join(' ').toLowerCase()

  const year = text.match(/\b(19|20)\d{2}\b/)?.[0] ?? null
  let grader: string | null = null
  let grade: string | null = null
  for (const g of GRADERS) {
    const m = text.match(new RegExp(`\\b${g}\\s*(10|9\\.5|9|8\\.5|8|7|6|5|4|3|2|1)?\\b`))
    if (m) {
      grader = g
      grade = m[1] ?? null
      break
    }
  }

  const terms = text
    .replace(/["']/g, '')
    .split(/\s+/)
    .filter(
      (t) =>
        t.length > 1 &&
        t !== year &&
        !GRADERS.includes(t) &&
        !/^(10|9\.5|9|8\.5|8)$/.test(t),
    )
  return { year, grader, grade, terms, exclusions }
}

/** Returns a 0-1 relevance score for a sale against the parsed query. */
export function scoreSale(parsed: ParsedQuery, sale: CardSale): number {
  const title = sale.title.toLowerCase()
  let score = 0
  let weight = 0

  // General terms (player, set, parallel, card number): bulk of the weight.
  if (parsed.terms.length > 0) {
    const hits = parsed.terms.filter((t) => title.includes(t)).length
    score += (hits / parsed.terms.length) * 0.55
  }
  weight += 0.55

  if (parsed.year) {
    weight += 0.15
    if (title.includes(parsed.year)) score += 0.15
  }

  if (parsed.grader) {
    weight += 0.15
    const saleGrader = sale.grader?.toLowerCase() ?? ''
    if (saleGrader === parsed.grader || title.includes(parsed.grader)) score += 0.15
    if (parsed.grade) {
      weight += 0.15
      if (sale.grade === parsed.grade || title.includes(`${parsed.grader} ${parsed.grade}`)) {
        score += 0.15
      }
    }
  }

  let result = weight > 0 ? score / weight : 0

  // Hard penalties for red-flag terms and explicit exclusions.
  for (const term of [...NEGATIVE_TERMS, ...parsed.exclusions]) {
    if (title.includes(term)) result -= 0.4
  }
  // Query asks for a graded card but the sale looks raw.
  if (parsed.grader && !sale.grader && !GRADERS.some((g) => title.includes(g))) {
    result -= 0.3
  }

  return Math.max(0, Math.min(1, result))
}

/** Sales below this score start excluded; the user can re-include them. */
export const AUTO_INCLUDE_THRESHOLD = 0.8
