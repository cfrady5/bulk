'use client'

import { useCallback, useMemo, useState } from 'react'
import { useData } from './useData'
import { computeStatistics } from '@/lib/valuation'
import { resolveNeed, detectTeamFromTitles } from '@/lib/needs-engine'
import { summarize, round2 } from '@/lib/finance'
import { parseQuery, scoreSale, AUTO_INCLUDE_THRESHOLD } from '@/lib/match'
import type {
  CardDetails,
  CardSale,
  EvaluatedSale,
  Grader,
  Purchase,
  RateLimitInfo,
  RuleTag,
} from '@/types/domain'

export type SearchStatus = 'idle' | 'loading' | 'done' | 'error'

export const EMPTY_CARD: CardDetails = {
  playerName: '',
  year: '',
  product: '',
  parallel: '',
  cardNumber: '',
  serialNumber: '',
  grader: '',
  grade: '',
  certNumber: '',
  teamId: null,
  sportId: null,
}

interface SearchMeta {
  cached: boolean
  stale: boolean
  fetchedAt: string | null
  rateLimit: RateLimitInfo | null
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** All state + derived values for the CARD → COMPS → … → SAVE workflow. */
export function useBuyFlow() {
  const { data, activeShowId, savePurchase } = useData()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [sales, setSales] = useState<EvaluatedSale[]>([])
  const [meta, setMeta] = useState<SearchMeta | null>(null)

  const [card, setCard] = useState<CardDetails>(EMPTY_CARD)
  const [teamManuallySet, setTeamManuallySet] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [askPrice, setAskPrice] = useState('')
  const [payoutOverride, setPayoutOverride] = useState('')
  const [targetOverride, setTargetOverride] = useState('')
  const [needOverridden, setNeedOverridden] = useState(false)
  const [notes, setNotes] = useState('')
  const [ruleTags, setRuleTags] = useState<RuleTag[]>([])
  const [sellerName, setSellerName] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const search = useCallback(
    async (opts: { refresh?: boolean; query?: string } = {}) => {
      const refresh = opts.refresh ?? false
      // An explicit query (from Add Card / Scan Slab) wins over current state,
      // which may not have re-rendered yet when this is called right after setQuery.
      const q = (opts.query ?? query).trim()
      if (opts.query !== undefined) setQuery(opts.query)
      if (q.length < 3) {
        setSearchError('Type a card first — e.g. "2024 Prizm Caleb Williams Silver PSA 10"')
        setStatus('error')
        return
      }
      setStatus('loading')
      setSearchError(null)
      try {
        const res = await fetch('/api/comps/search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query: q, limit: 25, refresh }),
        })
        const body = (await res.json()) as {
          error?: string
          sales?: CardSale[]
          cached?: boolean
          stale?: boolean
          fetchedAt?: string
          rateLimit?: RateLimitInfo | null
        }
        if (!res.ok || !body.sales) {
          setSearchError(body.error ?? 'Comp search failed — you can still enter a value manually.')
          setStatus('error')
          return
        }
        const parsed = parseQuery(q)
        const evaluated: EvaluatedSale[] = body.sales.map((s) => {
          const matchScore = scoreSale(parsed, s)
          return { ...s, matchScore, included: matchScore >= AUTO_INCLUDE_THRESHOLD }
        })
        evaluated.sort((a, b) => (b.soldAt ?? '').localeCompare(a.soldAt ?? ''))
        setSales(evaluated)
        setMeta({
          cached: body.cached ?? false,
          stale: body.stale ?? false,
          fetchedAt: body.fetchedAt ?? null,
          rateLimit: body.rateLimit ?? null,
        })
        setStatus('done')

        // Prefill card details + auto team recognition from the comp titles.
        setCard((c) => ({
          ...c,
          year: c.year || (parsed.year ?? ''),
          grader: c.grader || ((parsed.grader?.toUpperCase() ?? '') as Grader | ''),
          grade: c.grade || (parsed.grade ?? ''),
        }))
        if (!teamManuallySet && data) {
          const includedTitles = evaluated.filter((s) => s.included).map((s) => s.title)
          const teamId = detectTeamFromTitles(
            includedTitles.length > 0 ? includedTitles : evaluated.map((s) => s.title),
            data.teams,
          )
          if (teamId) {
            const team = data.teams.find((t) => t.id === teamId)
            setCard((c) => ({ ...c, teamId, sportId: team?.sportId ?? c.sportId }))
          }
        }
      } catch {
        setSearchError('Network failure — check your connection, or enter a value manually.')
        setStatus('error')
      }
    },
    [query, teamManuallySet, data],
  )

  const toggleSale = useCallback((id: string | undefined, index: number) => {
    setSales((prev) =>
      prev.map((s, i) =>
        (id !== undefined ? s.id === id : i === index) ? { ...s, included: !s.included } : s,
      ),
    )
  }, [])

  const stats = useMemo(() => computeStatistics(sales), [sales])

  // Active pricing rules adjust the auto value (manual value always wins).
  const { adjustedAutoValue, appliedRules } = useMemo(() => {
    let value = stats.autoValue
    const applied: string[] = []
    if (value !== null && data) {
      for (const rule of data.pricingRules.filter((r) => r.active)) {
        const tagMatch =
          rule.ruleType === 'tag' &&
          ruleTags.some((t) => rule.name.toLowerCase().includes(t.toLowerCase().split(' ')[0]))
        const confMatch =
          rule.ruleType === 'confidence' &&
          (stats.confidence === 'low' || stats.confidence === 'none')
        if (tagMatch || confMatch) {
          value = round2(value * (1 + rule.adjustmentValue))
          applied.push(`${rule.name} ${rule.adjustmentValue * 100}%`)
        }
      }
    }
    return { adjustedAutoValue: value, appliedRules: applied }
  }, [stats, data, ruleTags])

  const manualValueNum = manualValue === '' ? null : Number(manualValue)
  const marketValue =
    manualValueNum !== null && Number.isFinite(manualValueNum) && manualValueNum > 0
      ? manualValueNum
      : adjustedAutoValue

  const resolution = useMemo(
    () =>
      data
        ? resolveNeed({
            marketValue,
            teamId: card.teamId,
            teamGroups: data.teamGroups,
            valueTiers: data.valueTiers,
            teamNeeds: data.teamNeeds,
          })
        : null,
    [data, marketValue, card.teamId],
  )

  const payoutPct =
    payoutOverride !== ''
      ? Number(payoutOverride) / 100
      : (resolution?.payoutPercentage ?? null)
  const targetPct =
    targetOverride !== ''
      ? Number(targetOverride) / 100
      : (resolution?.targetBuyPercentage ?? null)

  const askNum = askPrice === '' ? null : Number(askPrice)

  const summary = useMemo(() => {
    if (marketValue === null || payoutPct === null || targetPct === null) return null
    return summarize({
      marketValue,
      payoutPercentage: payoutPct,
      targetBuyPercentage: targetPct,
      askingPrice: askNum !== null && Number.isFinite(askNum) ? askNum : null,
      quantityRemaining: resolution?.need ? resolution.quantityRemaining : null,
      needOverridden,
    })
  }, [marketValue, payoutPct, targetPct, askNum, resolution, needOverridden])

  const warnings = useMemo(() => {
    const w: string[] = []
    if (stats.highVariance) w.push('High price variance in comps')
    if (stats.count === 1) w.push('Only one comp — verify manually')
    if (stats.confidence === 'low') w.push('Low confidence (1-2 sales)')
    for (const tag of ruleTags) w.push(`Rule tag: ${tag}`)
    return w
  }, [stats, ruleTags])

  const reset = useCallback(() => {
    setQuery('')
    setStatus('idle')
    setSearchError(null)
    setSales([])
    setMeta(null)
    setCard(EMPTY_CARD)
    setTeamManuallySet(false)
    setManualValue('')
    setAskPrice('')
    setPayoutOverride('')
    setTargetOverride('')
    setNeedOverridden(false)
    setNotes('')
    setRuleTags([])
    // seller name intentionally persists — you often buy several cards per table
  }, [])

  const save = useCallback(
    async (andNext: boolean) => {
      if (!summary || marketValue === null) return false
      const paid = askNum !== null && Number.isFinite(askNum) && askNum > 0 ? askNum : null
      if (paid === null) return false
      setSaving(true)
      const parsed = parseQuery(query)
      const playerName = card.playerName || titleCase(parsed.terms.slice(0, 4).join(' '))
      const bestComp = sales
        .filter((s) => s.included && s.imageUrl)
        .sort((a, b) => b.matchScore - a.matchScore)[0]
      const purchase: Purchase = {
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        card: { ...card, playerName },
        showId: activeShowId,
        sellerName: sellerName || null,
        query,
        marketValue,
        autoMarketValue: stats.autoValue,
        manualMarketValue: manualValueNum,
        confidence: stats.confidence,
        compCount: stats.count,
        payoutPercentage: summary.payoutPercentage,
        expectedPayout: summary.expectedPayout,
        targetBuyPercentage: summary.targetBuyPercentage,
        targetBuyPrice: summary.targetBuyPrice,
        askingPrice: askNum,
        actualPurchasePrice: paid,
        expectedProfit: round2(summary.expectedPayout - paid),
        expectedRoi: paid > 0 ? round2((summary.expectedPayout - paid) / paid * 10000) / 10000 : 0,
        teamGroupId: resolution?.teamGroup?.id ?? null,
        valueTierId: resolution?.tier?.id ?? null,
        teamNeedId: resolution?.need?.id ?? null,
        compImageUrl: bestComp?.imageUrl ?? null,
        decisionShown: summary.decision,
        overrodeDecision:
          needOverridden || (summary.decision === 'pass' || summary.decision === 'no-need'),
        notes,
        ruleTags,
        status: 'purchased',
        purchasedAt: new Date().toISOString(),
      }
      try {
        await savePurchase(purchase)
        setLastSaved(playerName)
        if (andNext) reset()
        return true
      } finally {
        setSaving(false)
      }
    },
    [
      summary, marketValue, askNum, query, card, activeShowId, sellerName, stats, sales,
      manualValueNum, resolution, needOverridden, notes, ruleTags, savePurchase, reset,
    ],
  )

  return {
    query, setQuery,
    status, searchError, sales, meta, search, toggleSale,
    card, setCard, teamManuallySet, setTeamManuallySet,
    stats, adjustedAutoValue, appliedRules,
    manualValue, setManualValue, marketValue,
    askPrice, setAskPrice,
    payoutOverride, setPayoutOverride, targetOverride, setTargetOverride,
    needOverridden, setNeedOverridden,
    notes, setNotes, ruleTags, setRuleTags,
    sellerName, setSellerName,
    resolution, summary, warnings,
    saving, lastSaved, save, reset,
  }
}

export type BuyFlow = ReturnType<typeof useBuyFlow>
