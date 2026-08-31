import type {
  PricingRule,
  Sport,
  Team,
  TeamGroup,
  TeamNeed,
  ValueTier,
} from '@/types/domain'

/**
 * Default configuration used to initialize Local Mode and mirrored by
 * supabase/seed.sql. Everything here is editable in the app — nothing about
 * the grouping is irreversible.
 */

export const SEED_SPORTS: Sport[] = [
  { id: 'nfl', name: 'NFL', slug: 'nfl' },
  { id: 'nba', name: 'NBA', slug: 'nba' },
  { id: 'mlb', name: 'MLB', slug: 'mlb' },
]

const t = (id: string, sportId: string, city: string, name: string, abbreviation: string): Team => ({
  id,
  sportId,
  city,
  name,
  abbreviation,
})

export const SEED_TEAMS: Team[] = [
  t('bears', 'nfl', 'Chicago', 'Bears', 'CHI'),
  t('bulls', 'nba', 'Chicago', 'Bulls', 'CHI'),
  t('cubs', 'mlb', 'Chicago', 'Cubs', 'CHC'),
  t('cowboys', 'nfl', 'Dallas', 'Cowboys', 'DAL'),
  t('mavericks', 'nba', 'Dallas', 'Mavericks', 'DAL'),
  t('rangers', 'mlb', 'Texas', 'Rangers', 'TEX'),
  t('patriots', 'nfl', 'New England', 'Patriots', 'NE'),
  t('celtics', 'nba', 'Boston', 'Celtics', 'BOS'),
  t('red-sox', 'mlb', 'Boston', 'Red Sox', 'BOS'),
  t('chiefs', 'nfl', 'Kansas City', 'Chiefs', 'KC'),
  t('royals', 'mlb', 'Kansas City', 'Royals', 'KC'),
  t('rams', 'nfl', 'Los Angeles', 'Rams', 'LAR'),
  t('lakers', 'nba', 'Los Angeles', 'Lakers', 'LAL'),
  t('angels', 'mlb', 'Los Angeles', 'Angels', 'LAA'),
  t('49ers', 'nfl', 'San Francisco', '49ers', 'SF'),
  t('warriors', 'nba', 'Golden State', 'Warriors', 'GSW'),
  t('giants-mlb', 'mlb', 'San Francisco', 'Giants', 'SFG'),
  t('browns', 'nfl', 'Cleveland', 'Browns', 'CLE'),
  t('cavaliers', 'nba', 'Cleveland', 'Cavaliers', 'CLE'),
  t('guardians', 'mlb', 'Cleveland', 'Guardians', 'CLE'),
  t('vikings', 'nfl', 'Minnesota', 'Vikings', 'MIN'),
  t('timberwolves', 'nba', 'Minnesota', 'Timberwolves', 'MIN'),
  t('twins', 'mlb', 'Minnesota', 'Twins', 'MIN'),
  t('giants-nfl', 'nfl', 'New York', 'Giants', 'NYG'),
  t('knicks', 'nba', 'New York', 'Knicks', 'NYK'),
  t('yankees', 'mlb', 'New York', 'Yankees', 'NYY'),
  t('texans', 'nfl', 'Houston', 'Texans', 'HOU'),
  t('rockets', 'nba', 'Houston', 'Rockets', 'HOU'),
  t('astros', 'mlb', 'Houston', 'Astros', 'HOU'),
  t('spurs', 'nba', 'San Antonio', 'Spurs', 'SAS'),
]

const g = (id: string, name: string, teamIds: string[]): TeamGroup => ({
  id,
  name,
  slug: id,
  teamIds,
})

export const SEED_TEAM_GROUPS: TeamGroup[] = [
  g('chicago', 'Chicago', ['bears', 'bulls', 'cubs']),
  g('dallas', 'Dallas', ['cowboys', 'mavericks', 'rangers']),
  g('boston', 'Boston', ['patriots', 'celtics', 'red-sox']),
  g('kansas-city', 'Kansas City', ['chiefs', 'royals']),
  g('los-angeles', 'Los Angeles', ['rams', 'lakers', 'angels']),
  g('san-francisco', 'San Francisco', ['49ers', 'warriors', 'giants-mlb']),
  g('cleveland', 'Cleveland', ['browns', 'cavaliers', 'guardians']),
  g('minnesota', 'Minnesota', ['vikings', 'timberwolves', 'twins']),
  g('new-york', 'New York', ['giants-nfl', 'knicks', 'yankees']),
  g('houston', 'Houston', ['texans', 'rockets', 'astros']),
  g('san-antonio', 'San Antonio', ['spurs']),
]

const tier = (
  id: string,
  min: number,
  max: number | null,
  sortOrder: number,
): ValueTier => ({
  id,
  name: max === null ? `$${min}+` : `$${min}-$${max}`,
  minimumValue: min,
  maximumValue: max,
  sortOrder,
})

export const SEED_VALUE_TIERS: ValueTier[] = [
  tier('t30', 30, 80, 0),
  tier('t300', 300, 400, 1),
  tier('t400', 400, 500, 2),
  tier('t500', 500, 600, 3),
  tier('t600', 600, 700, 4),
  tier('t700', 700, 850, 5),
  tier('t850', 850, 900, 6),
  tier('t900', 900, null, 7),
]

/** Demo needs matching the spec's Chicago example; fully editable in the app. */
export function seedTeamNeeds(): TeamNeed[] {
  const now = new Date().toISOString()
  const needs: TeamNeed[] = []
  const chicago: Record<string, number> = { t300: 10, t400: 13, t500: 11, t600: 9, t700: 8 }
  let i = 0
  for (const group of SEED_TEAM_GROUPS) {
    for (const vt of SEED_VALUE_TIERS) {
      const qty =
        group.id === 'chicago'
          ? (chicago[vt.id] ?? 0)
          : vt.id === 't30'
            ? 0
            : // vary the demo needs a little so screens aren't uniform
              [8, 6, 10, 5, 4, 3, 2][(i + vt.sortOrder) % 7]
      needs.push({
        id: `${group.id}:${vt.id}`,
        teamGroupId: group.id,
        valueTierId: vt.id,
        quantityNeeded: qty,
        quantityAcquired: 0,
        payoutPercentage: 0.94,
        targetBuyPercentage: 0.87,
        active: qty > 0,
        updatedAt: now,
      })
    }
    i++
  }
  return needs
}

export const SEED_PRICING_RULES: PricingRule[] = [
  {
    id: 'rule-leaf',
    name: 'Leaf products',
    ruleType: 'tag',
    adjustmentType: 'percentage',
    adjustmentValue: -0.05,
    active: false,
    description: 'Pay lower on Leaf (-5% off market value)',
  },
  {
    id: 'rule-redemption',
    name: 'Redemptions',
    ruleType: 'tag',
    adjustmentType: 'percentage',
    adjustmentValue: -0.08,
    active: false,
    description: "Don't pay strong for redemptions (-8%)",
  },
  {
    id: 'rule-low-confidence',
    name: 'Low confidence comps',
    ruleType: 'confidence',
    adjustmentType: 'percentage',
    adjustmentValue: -0.03,
    active: false,
    description: 'Thin or noisy comps (-3%)',
  },
]

/** Development/demo card queries (never shown as real sales data). */
export const DEMO_QUERIES = [
  '2023 Prizm CJ Stroud Silver PSA 10',
  '2024 Prizm Caleb Williams Silver PSA 10',
  '2023 Prizm Victor Wembanyama Silver PSA 10',
  '2009 Panini Stephen Curry PSA 9',
]
