import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppData, DataStore } from './types'
import type {
  CardDetails,
  Grader,
  PricingRule,
  Purchase,
  Show,
  TeamGroup,
  TeamNeed,
} from '@/types/domain'

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come back untyped
   from supabase-js; each mapper immediately narrows them to domain types. */
type Row = Record<string, any>

/**
 * Supabase-backed persistence. Maps snake_case rows to the domain types the
 * app uses everywhere, mirroring supabase/migrations/0001_init.sql.
 */
export class SupabaseStore implements DataStore {
  readonly mode = 'supabase' as const

  constructor(private readonly client: SupabaseClient) {}

  async load(): Promise<AppData> {
    const [sports, teams, groups, members, tiers, needs, rules, shows, purchases] =
      await Promise.all([
        this.client.from('sports').select('*').order('name'),
        this.client.from('teams').select('*').order('name'),
        this.client.from('team_groups').select('*').order('name'),
        this.client.from('team_group_members').select('*'),
        this.client.from('value_tiers').select('*').order('sort_order'),
        this.client.from('team_needs').select('*'),
        this.client.from('pricing_rules').select('*'),
        this.client.from('shows').select('*').order('start_date', { ascending: false }),
        this.client
          .from('purchases')
          .select('*, cards(*)')
          .order('purchased_at', { ascending: false }),
      ])
    const firstError = [sports, teams, groups, members, tiers, needs, rules, shows, purchases]
      .map((r) => r.error)
      .find(Boolean)
    if (firstError) throw new Error(`Supabase load failed: ${firstError.message}`)

    const membersByGroup = new Map<string, string[]>()
    for (const m of (members.data ?? []) as Row[]) {
      const list = membersByGroup.get(m.team_group_id) ?? []
      list.push(m.team_id)
      membersByGroup.set(m.team_group_id, list)
    }

    return {
      sports: ((sports.data ?? []) as Row[]).map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
      })),
      teams: ((teams.data ?? []) as Row[]).map((r) => ({
        id: r.id,
        sportId: r.sport_id,
        name: r.name,
        city: r.city,
        abbreviation: r.abbreviation,
      })),
      teamGroups: ((groups.data ?? []) as Row[]).map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        teamIds: membersByGroup.get(r.id) ?? [],
      })),
      valueTiers: ((tiers.data ?? []) as Row[]).map((r) => ({
        id: r.id,
        name: r.name,
        minimumValue: Number(r.minimum_value),
        maximumValue: r.maximum_value === null ? null : Number(r.maximum_value),
        sortOrder: r.sort_order,
      })),
      teamNeeds: ((needs.data ?? []) as Row[]).map((r) => ({
        id: r.id,
        teamGroupId: r.team_group_id,
        valueTierId: r.value_tier_id,
        quantityNeeded: r.quantity_needed,
        quantityAcquired: r.quantity_acquired,
        payoutPercentage: Number(r.payout_percentage),
        targetBuyPercentage: Number(r.target_buy_percentage),
        active: r.active,
        updatedAt: r.updated_at,
      })),
      pricingRules: ((rules.data ?? []) as Row[]).map((r) => ({
        id: r.id,
        name: r.name,
        ruleType: r.rule_type,
        adjustmentType: r.adjustment_type,
        adjustmentValue: Number(r.adjustment_value),
        active: r.active,
        description: r.description ?? '',
      })),
      shows: ((shows.data ?? []) as Row[]).map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city ?? '',
        state: r.state ?? '',
        startDate: r.start_date,
        endDate: r.end_date,
        createdAt: r.created_at,
      })),
      purchases: ((purchases.data ?? []) as Row[]).map((r) => this.mapPurchase(r)),
    }
  }

  private mapPurchase(r: Row): Purchase {
    const c = (r.cards ?? {}) as Row
    const card: CardDetails = {
      playerName: c.player_name ?? '',
      year: c.year ?? '',
      product: c.product ?? '',
      parallel: c.parallel ?? '',
      cardNumber: c.card_number ?? '',
      serialNumber: c.serial_number ?? '',
      grader: (c.grader ?? '') as Grader | '',
      grade: c.grade ?? '',
      certNumber: c.cert_number ?? '',
      teamId: c.team_id,
      sportId: c.sport_id,
      imageFront: c.image_front_url ?? undefined,
      imageBack: c.image_back_url ?? undefined,
    }
    return {
      id: r.id,
      card,
      showId: r.show_id,
      sellerName: r.seller_name,
      query: r.query ?? '',
      marketValue: Number(r.market_value),
      autoMarketValue: r.auto_market_value === null ? null : Number(r.auto_market_value),
      manualMarketValue:
        r.manual_market_value === null ? null : Number(r.manual_market_value),
      confidence: r.confidence ?? 'none',
      compCount: r.comp_count ?? 0,
      payoutPercentage: Number(r.payout_percentage),
      expectedPayout: Number(r.expected_payout),
      targetBuyPercentage: Number(r.target_buy_percentage),
      targetBuyPrice: Number(r.target_buy_price),
      askingPrice: r.asking_price === null ? null : Number(r.asking_price),
      actualPurchasePrice: Number(r.actual_purchase_price),
      expectedProfit: Number(r.expected_profit),
      expectedRoi: Number(r.expected_roi),
      teamGroupId: r.team_group_id,
      valueTierId: r.value_tier_id,
      teamNeedId: r.team_need_id,
      compImageUrl: r.comp_image_url ?? null,
      decisionShown: r.decision_shown ?? 'unknown',
      overrodeDecision: r.overrode_decision ?? false,
      notes: r.notes ?? '',
      ruleTags: r.rule_tags ?? [],
      status: r.status ?? 'purchased',
      purchasedAt: r.purchased_at,
    }
  }

  async saveTeamNeed(need: TeamNeed): Promise<void> {
    const { error } = await this.client.from('team_needs').upsert({
      id: need.id,
      team_group_id: need.teamGroupId,
      value_tier_id: need.valueTierId,
      quantity_needed: need.quantityNeeded,
      quantity_acquired: need.quantityAcquired,
      payout_percentage: need.payoutPercentage,
      target_buy_percentage: need.targetBuyPercentage,
      active: need.active,
      updated_at: new Date().toISOString(),
    })
    if (error) throw new Error(error.message)
  }

  async saveTeamGroup(group: TeamGroup): Promise<void> {
    const { error } = await this.client
      .from('team_groups')
      .upsert({ id: group.id, name: group.name, slug: group.slug })
    if (error) throw new Error(error.message)
    const del = await this.client
      .from('team_group_members')
      .delete()
      .eq('team_group_id', group.id)
    if (del.error) throw new Error(del.error.message)
    if (group.teamIds.length > 0) {
      const ins = await this.client
        .from('team_group_members')
        .insert(group.teamIds.map((teamId) => ({ team_group_id: group.id, team_id: teamId })))
      if (ins.error) throw new Error(ins.error.message)
    }
  }

  async deleteTeamGroup(groupId: string): Promise<void> {
    const { error } = await this.client.from('team_groups').delete().eq('id', groupId)
    if (error) throw new Error(error.message)
  }

  async savePricingRule(rule: PricingRule): Promise<void> {
    const { error } = await this.client.from('pricing_rules').upsert({
      id: rule.id,
      name: rule.name,
      rule_type: rule.ruleType,
      adjustment_type: rule.adjustmentType,
      adjustment_value: rule.adjustmentValue,
      active: rule.active,
      description: rule.description,
    })
    if (error) throw new Error(error.message)
  }

  async savePurchase(purchase: Purchase): Promise<void> {
    const user = (await this.client.auth.getUser()).data.user
    const card = purchase.card
    const cardRes = await this.client
      .from('cards')
      .upsert({
        id: purchase.id, // 1:1 card per purchase keeps the mapping simple
        player_name: card.playerName,
        year: card.year || null,
        product: card.product || null,
        parallel: card.parallel || null,
        card_number: card.cardNumber || null,
        serial_number: card.serialNumber || null,
        sport_id: card.sportId,
        team_id: card.teamId,
        grader: card.grader || null,
        grade: card.grade || null,
        cert_number: card.certNumber || null,
        image_front_url: card.imageFront ?? null,
        image_back_url: card.imageBack ?? null,
      })
      .select('id')
      .single()
    if (cardRes.error) throw new Error(cardRes.error.message)

    const { error } = await this.client.from('purchases').upsert({
      id: purchase.id,
      card_id: cardRes.data.id,
      buyer_id: user?.id ?? null,
      show_id: purchase.showId,
      seller_name: purchase.sellerName,
      query: purchase.query,
      market_value: purchase.marketValue,
      auto_market_value: purchase.autoMarketValue,
      manual_market_value: purchase.manualMarketValue,
      confidence: purchase.confidence,
      comp_count: purchase.compCount,
      payout_percentage: purchase.payoutPercentage,
      expected_payout: purchase.expectedPayout,
      target_buy_percentage: purchase.targetBuyPercentage,
      target_buy_price: purchase.targetBuyPrice,
      asking_price: purchase.askingPrice,
      actual_purchase_price: purchase.actualPurchasePrice,
      expected_profit: purchase.expectedProfit,
      expected_roi: purchase.expectedRoi,
      team_group_id: purchase.teamGroupId,
      value_tier_id: purchase.valueTierId,
      team_need_id: purchase.teamNeedId,
      comp_image_url: purchase.compImageUrl,
      decision_shown: purchase.decisionShown,
      overrode_decision: purchase.overrodeDecision,
      notes: purchase.notes,
      rule_tags: purchase.ruleTags,
      status: purchase.status,
      purchased_at: purchase.purchasedAt,
    })
    if (error) throw new Error(error.message)
  }

  async deletePurchase(purchaseId: string): Promise<void> {
    const { error } = await this.client.from('purchases').delete().eq('id', purchaseId)
    if (error) throw new Error(error.message)
  }

  async saveShow(show: Show): Promise<void> {
    const { error } = await this.client.from('shows').upsert({
      id: show.id,
      name: show.name,
      city: show.city || null,
      state: show.state || null,
      start_date: show.startDate,
      end_date: show.endDate,
    })
    if (error) throw new Error(error.message)
  }
}
