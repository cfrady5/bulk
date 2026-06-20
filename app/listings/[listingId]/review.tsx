import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  ConfidenceBadge,
  FormSection,
  PhotoCarousel,
  PriceField,
  Screen,
  ScreenHeader,
  SelectField,
  StatusBadge,
  Text,
  TextField,
  ToggleField,
} from '@/components';
import { APP_CONFIG } from '@/constants/config';
import { parseInteger } from '@/lib/format';
import { generateDescription } from '@/services/listing/generateDescription';
import { generateListingTitle } from '@/services/listing/generateListingTitle';
import { shortenEbayTitle } from '@/services/listing/shortenEbayTitle';
import { getMissingFields } from '@/services/validation/getMissingFields';
import { validateEbayListing } from '@/services/validation/validateEbayListing';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';
import {
  LISTING_TYPES,
  REVIEW_STATUSES,
  SALE_TYPES,
  TRISTATE_OPTIONS,
  type ConfidenceLevel,
  type Listing,
} from '@/types';

export default function ListingReviewScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();

  const storedListing = useAppStore((s) => (listingId ? s.listings[listingId] : undefined));
  const fieldConfidenceMap = useAppStore((s) => (listingId ? s.fieldConfidence[listingId] : undefined));
  const saveListing = useAppStore((s) => s.saveListing);
  const setReviewStatus = useAppStore((s) => s.setReviewStatus);
  const getPhotosForListing = useAppStore((s) => s.getPhotosForListing);
  const getListingsForBatch = useAppStore((s) => s.getListingsForBatch);

  const [draft, setDraft] = useState<Listing | undefined>(storedListing);

  const photos = useMemo(
    () => (storedListing ? getPhotosForListing(storedListing.id) : []),
    [storedListing, getPhotosForListing],
  );

  const siblings = useMemo(
    () => (storedListing ? getListingsForBatch(storedListing.batch_id) : []),
    [storedListing, getListingsForBatch],
  );
  const currentIndex = siblings.findIndex((l) => l.id === listingId);

  if (!draft || !storedListing) {
    return (
      <Screen>
        <ScreenHeader title="Listing" />
        <Text variant="title3" center style={{ marginTop: spacing.giant }}>
          Listing not found
        </Text>
      </Screen>
    );
  }

  const isLot = draft.listing_type === 'Card Lot';
  const titleLen = draft.title.length;
  const titleOver = titleLen > APP_CONFIG.maxTitleLength;
  const missing = getMissingFields(draft, photos);
  const batchSkus = siblings.map((l) => l.sku);

  function update<K extends keyof Listing>(key: K, value: Listing[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function conf(field: keyof Listing): ConfidenceLevel | undefined {
    return fieldConfidenceMap?.[field as string]?.confidence;
  }

  function persist(next?: Listing) {
    const toSave = next ?? draft;
    if (toSave) saveListing(toSave);
  }

  function handleGenerateTitle() {
    const result = generateListingTitle(draft!);
    update('title', result.title);
  }

  function handleShortenTitle() {
    update('title', shortenEbayTitle(draft!.title).title);
  }

  function handleGenerateDescription() {
    update('description', generateDescription(draft!, { photos }));
  }

  function runValidation(): { ok: boolean; errors: string[] } {
    const results = validateEbayListing({
      listing: draft!,
      photos,
      batchSkus,
      fieldConfidence: fieldConfidenceMap,
    });
    const errors = results.filter((r) => r.severity === 'error').map((r) => r.message);
    return { ok: errors.length === 0, errors };
  }

  function handleMarkReady() {
    if (titleOver) {
      Alert.alert('Title too long', `Title must be ${APP_CONFIG.maxTitleLength} characters or fewer.`);
      return;
    }
    const { ok, errors } = runValidation();
    if (!ok) {
      const preview = errors.slice(0, 5).map((e) => `• ${e}`).join('\n');
      const more = errors.length > 5 ? `\n…and ${errors.length - 5} more` : '';
      Alert.alert('Resolve errors first', `${preview}${more}`);
      return;
    }
    const next = { ...draft!, review_status: 'Ready' as const };
    setDraft(next);
    persist(next);
    setReviewStatus(draft!.id, 'Ready');
    Alert.alert('Marked Ready', 'This listing passed validation and is ready to export.');
  }

  function handleSave() {
    persist();
    Alert.alert('Saved', 'Your changes have been saved.');
  }

  function goTo(index: number) {
    persist();
    const target = siblings[index];
    if (target) router.replace(`/listings/${target.id}/review`);
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Button
              label="Previous"
              icon="chevron-back"
              variant="secondary"
              disabled={currentIndex <= 0}
              onPress={() => goTo(currentIndex - 1)}
              style={styles.flex}
            />
            <Button
              label="Save & Next"
              iconRight="chevron-forward"
              variant="secondary"
              disabled={currentIndex >= siblings.length - 1}
              onPress={() => goTo(currentIndex + 1)}
              style={styles.flex}
            />
          </View>
          <View style={styles.footerRow}>
            <Button label="Flag" icon="flag-outline" variant="danger" onPress={() => { setReviewStatus(draft.id, 'Flagged'); update('review_status', 'Flagged'); }} style={styles.flex} />
            <Button label="Save" icon="save-outline" variant="secondary" onPress={handleSave} style={styles.flex} />
            <Button label="Mark Ready" icon="checkmark-circle" variant="success" onPress={handleMarkReady} style={styles.flex} />
          </View>
        </View>
      }
    >
      <ScreenHeader
        title={draft.sku || 'Listing'}
        subtitle={`${currentIndex + 1} of ${siblings.length}`}
      />

      <PhotoCarousel photos={photos} />

      <View style={styles.statusRow}>
        <StatusBadge status={draft.review_status} />
        <Text variant="caption" color={colors.textMuted}>
          {photos.length} photo{photos.length === 1 ? '' : 's'} · {draft.listing_type}
        </Text>
      </View>

      {/* AI confidence summary */}
      {draft.ai_confidence_summary ? (
        <Card style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text variant="callout" color={colors.primary}>
              AI summary
            </Text>
          </View>
          <Text variant="caption" color={colors.textSecondary}>
            {draft.ai_confidence_summary}
          </Text>
        </Card>
      ) : null}

      {/* Missing fields callout */}
      {missing.count > 0 ? (
        <Card style={styles.missingCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text variant="callout" color={colors.warning}>
              {missing.count} field{missing.count === 1 ? '' : 's'} to complete
            </Text>
          </View>
          <Text variant="caption" color={colors.textSecondary}>
            {missing.fields.join(' · ')}
          </Text>
        </Card>
      ) : null}

      {/* 1. Listing Basics */}
      <FormSection title="Listing Basics" icon="document-text-outline">
        <TextField label="SKU" value={draft.sku} onChangeText={(t) => update('sku', t)} autoCapitalize="characters" required />
        <SelectField label="Listing type" value={draft.listing_type} options={LISTING_TYPES} onChange={(v) => update('listing_type', v)} />
        <TextField
          label="Title"
          value={draft.title}
          onChangeText={(t) => update('title', t)}
          maxCount={APP_CONFIG.maxTitleLength}
          confidence={conf('title')}
          multiline
          required
        />
        <View style={styles.titleActions}>
          <Pressable onPress={handleGenerateTitle} style={styles.linkBtn}>
            <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
            <Text variant="caption" color={colors.primary}>
              Generate
            </Text>
          </Pressable>
          {titleOver ? (
            <Pressable onPress={handleShortenTitle} style={styles.linkBtn}>
              <Ionicons name="cut-outline" size={14} color={colors.warning} />
              <Text variant="caption" color={colors.warning}>
                Use shortened ({shortenEbayTitle(draft.title).title.length} chars)
              </Text>
            </Pressable>
          ) : null}
        </View>
        <TextField label="Description" value={draft.description} onChangeText={(t) => update('description', t)} multiline confidence={conf('description')} />
        <Pressable onPress={handleGenerateDescription} style={[styles.linkBtn, styles.descBtn]}>
          <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
          <Text variant="caption" color={colors.primary}>
            Generate description
          </Text>
        </Pressable>
        <TextField label="eBay Category ID" value={draft.category_id} onChangeText={(t) => update('category_id', t)} keyboardType="number-pad" helper="Verify against your eBay template." required />
        <TextField label="eBay Condition ID" value={draft.condition_id} onChangeText={(t) => update('condition_id', t)} keyboardType="number-pad" required containerStyle={styles.noMargin} />
      </FormSection>

      {/* Lot details */}
      {isLot ? (
        <FormSection title="Lot Details" icon="layers-outline">
          <TextField label="Lot title" value={draft.lot_title ?? ''} onChangeText={(t) => update('lot_title', t)} />
          <TextField label="Number of cards" value={draft.number_of_cards != null ? String(draft.number_of_cards) : ''} onChangeText={(t) => update('number_of_cards', parseInteger(t))} keyboardType="number-pad" confidence={conf('number_of_cards')} />
          <TextField label="Featured cards" value={draft.featured_cards ?? ''} onChangeText={(t) => update('featured_cards', t)} multiline confidence={conf('featured_cards')} />
          <TextField label="Shared player" value={draft.shared_player ?? ''} onChangeText={(t) => update('shared_player', t)} />
          <TextField label="Shared team" value={draft.shared_team ?? ''} onChangeText={(t) => update('shared_team', t)} />
          <TextField label="Shared set" value={draft.shared_set ?? ''} onChangeText={(t) => update('shared_set', t)} />
          <TextField label="Shared theme" value={draft.shared_theme ?? ''} onChangeText={(t) => update('shared_theme', t)} />
          <TextField label="Lot notes" value={draft.lot_notes ?? ''} onChangeText={(t) => update('lot_notes', t)} multiline containerStyle={styles.noMargin} />
        </FormSection>
      ) : null}

      {/* 2. Card Details */}
      <FormSection title="Card Details" icon="person-outline">
        <TextField label="Card name" value={draft.card_name} onChangeText={(t) => update('card_name', t)} confidence={conf('card_name')} />
        <TextField label="Player" value={draft.player} onChangeText={(t) => update('player', t)} confidence={conf('player')} />
        <TextField label="Team" value={draft.team} onChangeText={(t) => update('team', t)} confidence={conf('team')} />
        <TextField label="Sport" value={draft.sport} onChangeText={(t) => update('sport', t)} confidence={conf('sport')} required />
        <TextField label="League" value={draft.league} onChangeText={(t) => update('league', t)} confidence={conf('league')} />
        <TextField label="Year" value={draft.year} onChangeText={(t) => update('year', t)} confidence={conf('year')} keyboardType="number-pad" />
        <TextField label="Season" value={draft.season} onChangeText={(t) => update('season', t)} confidence={conf('season')} />
        <TextField label="Manufacturer" value={draft.manufacturer} onChangeText={(t) => update('manufacturer', t)} confidence={conf('manufacturer')} />
        <TextField label="Set" value={draft.set_name} onChangeText={(t) => update('set_name', t)} confidence={conf('set_name')} />
        <TextField label="Card number" value={draft.card_number} onChangeText={(t) => update('card_number', t)} confidence={conf('card_number')} />
        <TextField label="Parallel / variety" value={draft.parallel_variety} onChangeText={(t) => update('parallel_variety', t)} confidence={conf('parallel_variety')} />
        <TextField label="Insert set" value={draft.insert_set} onChangeText={(t) => update('insert_set', t)} confidence={conf('insert_set')} />
        <SelectField label="Rookie card" value={draft.rookie_card} options={TRISTATE_OPTIONS} onChange={(v) => update('rookie_card', v)} confidence={conf('rookie_card')} />
        <SelectField label="Autographed" value={draft.autographed} options={TRISTATE_OPTIONS} onChange={(v) => update('autographed', v)} confidence={conf('autographed')} />
        <SelectField label="Memorabilia" value={draft.memorabilia} options={TRISTATE_OPTIONS} onChange={(v) => update('memorabilia', v)} confidence={conf('memorabilia')} containerStyle={styles.noMargin} />
      </FormSection>

      {/* 3. Grading / Condition */}
      <FormSection title="Grading & Condition" icon="ribbon-outline">
        <SelectField label="Graded" value={draft.graded} options={['Yes', 'No']} onChange={(v) => update('graded', v as Listing['graded'])} confidence={conf('graded')} />
        <TextField label="Grading company" value={draft.grading_company} onChangeText={(t) => update('grading_company', t)} confidence={conf('grading_company')} />
        <TextField label="Professional grader" value={draft.professional_grader} onChangeText={(t) => update('professional_grader', t)} />
        <TextField label="Grade" value={draft.grade} onChangeText={(t) => update('grade', t)} confidence={conf('grade')} />
        <TextField label="Certification number" value={draft.certification_number} onChangeText={(t) => update('certification_number', t)} confidence={conf('certification_number')} />
        <SelectField label="Raw / graded" value={draft.raw_or_graded} options={['Raw', 'Graded']} onChange={(v) => update('raw_or_graded', v as Listing['raw_or_graded'])} />
        <SelectField label="Original / reprint" value={draft.original_reprint} options={['Original', 'Reprint']} onChange={(v) => update('original_reprint', v as Listing['original_reprint'])} />
        <TextField label="Card condition" value={draft.card_condition} onChangeText={(t) => update('card_condition', t)} confidence={conf('card_condition')} />
        <TextField label="Condition notes" value={draft.condition_notes} onChangeText={(t) => update('condition_notes', t)} multiline />
        <TextField label="Visible imperfections" value={draft.visible_imperfections} onChangeText={(t) => update('visible_imperfections', t)} multiline containerStyle={styles.noMargin} />
      </FormSection>

      {/* 4. Pricing / Sale Format */}
      <FormSection title="Pricing & Sale Format" icon="cash-outline">
        <SelectField label="Sale type" value={draft.sale_type} options={SALE_TYPES} onChange={(v) => update('sale_type', v)} />
        {draft.sale_type === 'Auction' ? (
          <PriceField label="Auction starting price" value={draft.auction_start_price} onChange={(v) => update('auction_start_price', v)} required />
        ) : (
          <PriceField label="Buy It Now price" value={draft.buy_it_now_price} onChange={(v) => update('buy_it_now_price', v)} required />
        )}
        <ToggleField label="Accept offers" value={draft.accept_offers} onChange={(v) => update('accept_offers', v)} />
        {draft.accept_offers ? (
          <>
            <PriceField label="Minimum offer" value={draft.minimum_offer} onChange={(v) => update('minimum_offer', v)} />
            <PriceField label="Auto-accept offer" value={draft.auto_accept_offer} onChange={(v) => update('auto_accept_offer', v)} />
            <PriceField label="Auto-decline offer" value={draft.auto_decline_offer} onChange={(v) => update('auto_decline_offer', v)} />
          </>
        ) : null}
        <TextField label="Quantity" value={String(draft.quantity ?? '')} onChangeText={(t) => update('quantity', parseInteger(t) ?? 1)} keyboardType="number-pad" />
        <TextField
          label="Promotion %"
          value={draft.promotion_percent != null ? String(draft.promotion_percent) : ''}
          onChangeText={(t) => update('promotion_percent', t.trim() === '' ? null : Number(t.replace(/[^0-9.]/g, '')))}
          keyboardType="decimal-pad"
          containerStyle={styles.noMargin}
        />
      </FormSection>

      {/* 5. Fulfillment */}
      <FormSection title="Fulfillment" icon="cube-outline">
        <TextField label="Shipping profile" value={draft.shipping_profile} onChangeText={(t) => update('shipping_profile', t)} required containerStyle={styles.noMargin} />
      </FormSection>

      {/* 6. Internal */}
      <FormSection title="Internal" icon="lock-closed-outline">
        <TextField label="Internal notes" value={draft.internal_notes} onChangeText={(t) => update('internal_notes', t)} multiline />
        <SelectField label="Review status" value={draft.review_status} options={REVIEW_STATUSES} onChange={(v) => update('review_status', v)} containerStyle={styles.noMargin} />
      </FormSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  aiCard: { marginBottom: spacing.md, borderColor: colors.accentMuted, gap: spacing.xs },
  missingCard: { marginBottom: spacing.md, borderColor: colors.warning, gap: spacing.xs },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleActions: { flexDirection: 'row', gap: spacing.lg, marginTop: -spacing.sm, marginBottom: spacing.lg },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  descBtn: { marginTop: -spacing.sm, marginBottom: spacing.lg },
  noMargin: { marginBottom: 0 },
  footer: { gap: spacing.sm },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
