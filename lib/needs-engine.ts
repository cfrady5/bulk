import type {
  NeedResolution,
  TeamGroup,
  TeamNeed,
  ValueTier,
} from '@/types/domain'

/**
 * The core differentiator: given a market value and a team, resolve the
 * repacker's current need, payout %, and target buy %.
 * Pure function — callers supply the current config from the data store.
 */
export function resolveNeed(params: {
  marketValue: number | null
  teamId: string | null
  teamGroups: TeamGroup[]
  valueTiers: ValueTier[]
  teamNeeds: TeamNeed[]
}): NeedResolution {
  const { marketValue, teamId, teamGroups, valueTiers, teamNeeds } = params

  const teamGroup =
    teamId !== null ? (teamGroups.find((g) => g.teamIds.includes(teamId)) ?? null) : null

  const tier =
    marketValue !== null && marketValue > 0
      ? (valueTiers.find(
          (t) =>
            marketValue >= t.minimumValue &&
            (t.maximumValue === null || marketValue < t.maximumValue),
        ) ?? null)
      : null

  const need =
    teamGroup && tier
      ? (teamNeeds.find(
          (n) => n.teamGroupId === teamGroup.id && n.valueTierId === tier.id && n.active,
        ) ?? null)
      : null

  const quantityRemaining = need
    ? Math.max(0, need.quantityNeeded - need.quantityAcquired)
    : 0

  return {
    teamGroup,
    tier,
    need,
    quantityRemaining,
    payoutPercentage: need?.payoutPercentage ?? null,
    targetBuyPercentage: need?.targetBuyPercentage ?? null,
  }
}

/**
 * Detects the most likely team from comp sale titles by counting mentions of
 * team names, cities, and abbreviations. Powers automatic team recognition.
 */
export function detectTeamFromTitles(
  titles: string[],
  teams: { id: string; name: string; city: string; abbreviation: string }[],
): string | null {
  const counts = new Map<string, number>()
  const text = titles.join(' \n ').toLowerCase()
  for (const team of teams) {
    let count = 0
    const name = team.name.toLowerCase()
    if (name.length > 3) {
      count += (text.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length
    }
    if (count > 0) counts.set(team.id, count)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [id, count] of counts) {
    if (count > bestCount) {
      best = id
      bestCount = count
    }
  }
  return best
}
