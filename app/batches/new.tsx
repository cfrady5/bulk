import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  Button,
  FormSection,
  PriceField,
  Screen,
  ScreenHeader,
  SelectField,
  TextField,
  ToggleField,
} from '@/components';
import { parseInteger, parsePrice } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';
import {
  BATCH_LISTING_TYPES,
  type BatchInput,
  type BatchListingType,
  SALE_TYPES,
  type SaleType,
} from '@/types';

export default function CreateBatchScreen() {
  const router = useRouter();
  const createBatch = useAppStore((s) => s.createBatch);

  const [name, setName] = useState('');
  const [listingType, setListingType] = useState<BatchListingType>('Singles');
  const [saleType, setSaleType] = useState<SaleType>('Buy It Now');
  const [shippingProfile, setShippingProfile] = useState('Standard Cards (BMWT)');
  const [promotion, setPromotion] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState('');
  const [auctionStart, setAuctionStart] = useState<number | null>(null);
  const [binPrice, setBinPrice] = useState<number | null>(null);
  const [minOffer, setMinOffer] = useState<number | null>(null);
  const [autoAccept, setAutoAccept] = useState<number | null>(null);
  const [autoDecline, setAutoDecline] = useState<number | null>(null);
  const [acceptOffers, setAcceptOffers] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [conditionId, setConditionId] = useState('');
  const [notes, setNotes] = useState('');

  function buildInput(): BatchInput | null {
    if (!name.trim()) {
      Alert.alert('Batch name required', 'Give your batch a short name so you can find it later.');
      return null;
    }
    return {
      name: name.trim(),
      default_listing_type: listingType,
      default_sale_type: saleType,
      default_shipping_profile: shippingProfile.trim(),
      default_promotion_percent: promotion.trim() === '' ? null : parsePrice(promotion),
      default_quantity: parseInteger(quantity) ?? 1,
      default_condition: condition.trim(),
      default_auction_start_price: auctionStart,
      default_buy_it_now_price: binPrice,
      default_minimum_offer: minOffer,
      default_auto_accept_offer: autoAccept,
      default_auto_decline_offer: autoDecline,
      default_accept_offers: acceptOffers,
      default_category_id: categoryId.trim() || undefined,
      default_condition_id: conditionId.trim() || undefined,
      notes: notes.trim(),
    };
  }

  function handleSave(thenCapture: boolean) {
    const input = buildInput();
    if (!input) return;
    try {
      const batch = createBatch(input);
      if (thenCapture) {
        router.replace(`/batches/${batch.id}/capture`);
      } else {
        router.replace(`/batches/${batch.id}`);
      }
    } catch (err) {
      Alert.alert('Could not create batch', err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label="Save Batch"
            variant="secondary"
            icon="save-outline"
            onPress={() => handleSave(false)}
            style={styles.flex}
          />
          <Button
            label="Save & Capture"
            icon="camera"
            onPress={() => handleSave(true)}
            style={styles.flex}
          />
        </View>
      }
    >
      <ScreenHeader title="New Batch" subtitle="Set defaults to speed up review" />

      <FormSection title="Batch" icon="albums-outline">
        <TextField
          label="Batch name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. June 20 PSA Slabs"
          required
          autoFocus
        />
        <SelectField<BatchListingType>
          label="Default listing type"
          value={listingType}
          options={BATCH_LISTING_TYPES}
          onChange={setListingType}
        />
        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional batch notes"
          multiline
          containerStyle={styles.noMargin}
        />
      </FormSection>

      <FormSection title="Sale Defaults" icon="cart-outline">
        <SelectField<SaleType>
          label="Default sale type"
          value={saleType}
          options={SALE_TYPES}
          onChange={setSaleType}
        />
        <PriceField label="Default auction starting price" value={auctionStart} onChange={setAuctionStart} />
        <PriceField label="Default Buy It Now price" value={binPrice} onChange={setBinPrice} />
        <TextField
          label="Default quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          placeholder="1"
        />
        <TextField
          label="Default promotion %"
          value={promotion}
          onChangeText={setPromotion}
          keyboardType="decimal-pad"
          placeholder="e.g. 6"
          containerStyle={styles.noMargin}
        />
      </FormSection>

      <FormSection title="Offers" icon="pricetags-outline">
        <ToggleField label="Accept offers by default" value={acceptOffers} onChange={setAcceptOffers} />
        <PriceField label="Default minimum offer" value={minOffer} onChange={setMinOffer} />
        <PriceField label="Default auto-accept offer" value={autoAccept} onChange={setAutoAccept} />
        <PriceField
          label="Default auto-decline offer"
          value={autoDecline}
          onChange={setAutoDecline}
          containerStyle={styles.noMargin}
        />
      </FormSection>

      <FormSection title="Fulfillment & eBay" icon="cube-outline">
        <TextField
          label="Default shipping profile"
          value={shippingProfile}
          onChangeText={setShippingProfile}
          placeholder="e.g. Standard Cards (BMWT)"
        />
        <TextField label="Default condition" value={condition} onChangeText={setCondition} placeholder="e.g. Ungraded" />
        <TextField
          label="Default eBay category ID"
          value={categoryId}
          onChangeText={setCategoryId}
          placeholder="e.g. 261328"
          keyboardType="number-pad"
          helper="Verify against your eBay Seller Hub template."
        />
        <TextField
          label="Default eBay condition ID"
          value={conditionId}
          onChangeText={setConditionId}
          placeholder="e.g. 4000 (Ungraded) / 2750 (Graded)"
          keyboardType="number-pad"
          containerStyle={styles.noMargin}
        />
      </FormSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  noMargin: { marginBottom: 0 },
});
