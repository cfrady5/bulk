/**
 * Pick Your Team weighted pricing (spec §14).
 * Initial suggested price: team_price = team_weight / total_weights × required_revenue.
 * "Rebalance remaining" redistributes the still-needed revenue across unsold
 * teams by weight, without touching already-sold team prices.
 * Money is integer cents.
 */
import { Cents, splitByWeight } from './money';

export interface PytTeam {
  id: string;
  weight: number;
  minPriceCents?: Cents;
  finalPriceCents?: Cents;
  status: 'available' | 'sold';
}

export interface PricedTeam extends PytTeam {
  suggestedPriceCents: Cents;
}

export interface PytSummary {
  requiredRevenueCents: Cents;
  /** sum of final (or suggested) prices across all teams. */
  totalAssignedCents: Cents;
  soldRevenueCents: Cents;
  /** required − assigned (positive = still need to price in). */
  revenueRemainingCents: Cents;
  /** revenue tied up in still-unsold teams. */
  unsoldExposureCents: Cents;
  overpricedTeamIds: string[];
  underpricedTeamIds: string[];
  projectedProfitCents: Cents | null;
  projectedMargin: number | null;
}

/** Weighted suggested prices summing exactly to `requiredRevenueCents`. */
export function suggestTeamPrices(requiredRevenueCents: Cents, teams: PytTeam[]): PricedTeam[] {
  const prices = splitByWeight(
    requiredRevenueCents,
    teams.map((t) => t.weight),
  );
  return teams.map((t, i) => ({ ...t, suggestedPriceCents: prices[i] }));
}

/**
 * Redistribute the remaining required revenue across UNSOLD teams by weight.
 * Sold teams keep their final price; unsold teams get new suggested prices that,
 * together with sold revenue, sum to the required revenue.
 */
export function rebalanceRemaining(
  requiredRevenueCents: Cents,
  teams: PytTeam[],
): PricedTeam[] {
  const priceFor = (t: PytTeam) => t.finalPriceCents ?? 0;
  const soldRevenue = teams
    .filter((t) => t.status === 'sold')
    .reduce((a, t) => a + priceFor(t), 0);
  const remaining = requiredRevenueCents - soldRevenue;

  const unsold = teams.filter((t) => t.status === 'available');
  const unsoldPrices = splitByWeight(
    Math.max(0, remaining),
    unsold.map((t) => t.weight),
  );

  let u = 0;
  return teams.map((t) => {
    if (t.status === 'sold') {
      return { ...t, suggestedPriceCents: priceFor(t) };
    }
    return { ...t, suggestedPriceCents: unsoldPrices[u++] };
  });
}

export function summarizePyt(
  requiredRevenueCents: Cents,
  teams: PricedTeam[],
  totalBreakCostCents?: Cents,
): PytSummary {
  const effective = (t: PricedTeam) => t.finalPriceCents ?? t.suggestedPriceCents;

  const totalAssignedCents = teams.reduce((a, t) => a + effective(t), 0);
  const soldRevenueCents = teams
    .filter((t) => t.status === 'sold')
    .reduce((a, t) => a + effective(t), 0);
  const unsoldExposureCents = teams
    .filter((t) => t.status === 'available')
    .reduce((a, t) => a + effective(t), 0);

  const overpricedTeamIds = teams
    .filter((t) => t.finalPriceCents != null && t.finalPriceCents > t.suggestedPriceCents)
    .map((t) => t.id);
  const underpricedTeamIds = teams
    .filter((t) => t.finalPriceCents != null && t.finalPriceCents < t.suggestedPriceCents)
    .map((t) => t.id);

  const projectedProfitCents =
    totalBreakCostCents != null ? totalAssignedCents - totalBreakCostCents : null;
  const projectedMargin =
    totalBreakCostCents != null && totalAssignedCents !== 0
      ? (totalAssignedCents - totalBreakCostCents) / totalAssignedCents
      : null;

  return {
    requiredRevenueCents,
    totalAssignedCents,
    soldRevenueCents,
    revenueRemainingCents: requiredRevenueCents - totalAssignedCents,
    unsoldExposureCents,
    overpricedTeamIds,
    underpricedTeamIds,
    projectedProfitCents,
    projectedMargin,
  };
}
