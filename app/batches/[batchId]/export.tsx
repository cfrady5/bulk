import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  BrandMark,
  Button,
  Card,
  type ChecklistItem,
  PreExportChecklist,
  Screen,
  ScreenHeader,
  SectionHeader,
  SeverityBadge,
  Text,
  ValidationIssueList,
} from '@/components';
import { APP_CONFIG } from '@/constants/config';
import { formatDate } from '@/lib/format';
import { uuid } from '@/lib/id';
import { ebayHeaders } from '@/services/export/ebayFieldMap';
import { generateEbaySellerHubCsv } from '@/services/export/generateEbaySellerHubCsv';
import { generateInternalCsv } from '@/services/export/generateInternalCsv';
import { saveCsvFile, type SaveCsvResult } from '@/services/export/saveCsvFile';
import { shareCsvFile } from '@/services/export/shareCsvFile';
import { getMissingFields } from '@/services/validation/getMissingFields';
import { validateBatchForExport } from '@/services/validation/validateBatchForExport';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';
import type { CsvExportMode, ListingPhoto } from '@/types';

export default function ExportScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const router = useRouter();

  const batch = useAppStore((s) => (batchId ? s.batches[batchId] : undefined));
  const listings = useAppStore((s) => s.listings);
  const photos = useAppStore((s) => s.photos);
  const fieldConfidence = useAppStore((s) => s.fieldConfidence);
  const addExportJob = useAppStore((s) => s.addExportJob);
  const markListingsExported = useAppStore((s) => s.markListingsExported);
  const setValidationResults = useAppStore((s) => s.setValidationResults);
  const exportJobsAll = useAppStore((s) => s.exportJobs);

  const [lastExport, setLastExport] = useState<
    (SaveCsvResult & { mode: CsvExportMode; listingIds: string[] }) | null
  >(null);
  const [busy, setBusy] = useState(false);

  const batchListings = useMemo(
    () => Object.values(listings).filter((l) => l.batch_id === batchId),
    [listings, batchId],
  );
  const photosByListing = useMemo(() => {
    const map: Record<string, ListingPhoto[]> = {};
    Object.values(photos)
      .filter((p) => p.batch_id === batchId)
      .forEach((p) => {
        (map[p.listing_id] ??= []).push(p);
      });
    return map;
  }, [photos, batchId]);

  const ready = useMemo(
    () => batchListings.filter((l) => l.review_status === 'Ready'),
    [batchListings],
  );
  const exportedCount = batchListings.filter((l) => l.review_status === 'Exported').length;

  const validation = useMemo(
    () =>
      validateBatchForExport({
        batchId: batchId ?? '',
        listings: batchListings,
        photosByListing,
        confidenceByListing: fieldConfidence,
        includeStatuses: ['Ready'],
      }),
    [batchId, batchListings, photosByListing, fieldConfidence],
  );

  const exportJobs = useMemo(
    () => exportJobsAll.filter((j) => j.batch_id === batchId),
    [exportJobsAll, batchId],
  );

  // Pre-export checklist computed from the Ready listings.
  const checklist: ChecklistItem[] = useMemo(() => {
    const skuMap = new Map<string, number>();
    batchListings.forEach((l) => skuMap.set(l.sku.toUpperCase(), (skuMap.get(l.sku.toUpperCase()) ?? 0) + 1));
    const noDupes = ready.every((l) => (skuMap.get(l.sku.toUpperCase()) ?? 0) <= 1);

    const every = (fn: (l: (typeof ready)[number]) => boolean) => ready.length > 0 && ready.every(fn);

    return [
      { label: 'Titles under 80 characters', passed: every((l) => !!l.title && l.title.length <= APP_CONFIG.maxTitleLength) },
      { label: 'Required prices present', passed: every((l) => (l.sale_type === 'Auction' ? l.auction_start_price != null : l.buy_it_now_price != null)) },
      { label: 'Photo URLs available', passed: every((l) => (photosByListing[l.id] ?? []).some((p) => !!p.public_url)), detail: 'eBay needs hosted HTTPS photo URLs.' },
      { label: 'Category IDs present', passed: every((l) => !!l.category_id) },
      { label: 'Condition IDs present', passed: every((l) => !!l.condition_id) },
      { label: 'Shipping profile present', passed: every((l) => !!l.shipping_profile) },
      { label: 'Required fields complete', passed: every((l) => getMissingFields(l, photosByListing[l.id] ?? []).count === 0) },
      { label: 'No duplicate SKUs', passed: noDupes },
      { label: 'Required item specifics reviewed', passed: every((l) => !!l.sport) },
    ];
  }, [ready, batchListings, photosByListing]);

  const ebayCols = useMemo(() => ebayHeaders(), []);

  function handleValidate() {
    setValidationResults(batchId ?? '', validation.results);
    Alert.alert(
      'Validation complete',
      validation.total_ready === 0
        ? 'No Ready listings to validate. Mark listings Ready first.'
        : `${validation.total_ready} Ready · ${validation.error_count} error(s) · ${validation.warning_count} warning(s).`,
    );
  }

  async function doExport(mode: CsvExportMode) {
    const target = mode === 'ebay' ? ready : batchListings;
    if (target.length === 0) {
      Alert.alert('Nothing to export', mode === 'ebay' ? 'No Ready listings to export.' : 'This batch has no listings.');
      return;
    }
    if (mode === 'ebay' && validation.error_count > 0) {
      Alert.alert('Hard errors block export', `Resolve ${validation.error_count} error(s) before exporting to eBay.`);
      return;
    }
    if (mode === 'ebay' && validation.warning_count > 0) {
      Alert.alert('Warnings present', `There are ${validation.warning_count} warning(s). Export anyway?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export Anyway', onPress: () => runExport(mode, target.map((l) => l.id)) },
      ]);
      return;
    }
    runExport(mode, target.map((l) => l.id));
  }

  async function runExport(mode: CsvExportMode, listingIds: string[]) {
    setBusy(true);
    try {
      const target = batchListings.filter((l) => listingIds.includes(l.id));
      const result =
        mode === 'ebay'
          ? generateEbaySellerHubCsv({ listings: target, photosByListing })
          : generateInternalCsv({ listings: target, photosByListing });

      const baseName = `${batch?.name ?? 'batch'}_${mode}`;
      const saved = await saveCsvFile(result.csv, baseName);

      addExportJob({
        id: uuid(),
        batch_id: batchId ?? '',
        exported_count: result.rowCount,
        csv_file_path: saved.uri,
        export_status: 'success',
        export_mode: mode,
        validation_errors_count: mode === 'ebay' ? validation.error_count : 0,
        validation_warnings_count: mode === 'ebay' ? validation.warning_count : 0,
        created_at: new Date().toISOString(),
      });

      setLastExport({ ...saved, mode, listingIds });

      // Immediately offer to share + (for eBay) mark exported.
      await shareCsvFile(saved.uri, { dialogTitle: `Share ${saved.fileName}` });

      if (mode === 'ebay') {
        Alert.alert('Exported', `Saved ${result.rowCount} listing(s). Mark them as Exported?`, [
          { text: 'Not yet', style: 'cancel' },
          { text: 'Mark Exported', onPress: () => markListingsExported(listingIds) },
        ]);
      }
    } catch (err) {
      addExportJob({
        id: uuid(),
        batch_id: batchId ?? '',
        exported_count: 0,
        csv_file_path: '',
        export_status: 'failed',
        export_mode: mode,
        validation_errors_count: validation.error_count,
        validation_warnings_count: validation.warning_count,
        created_at: new Date().toISOString(),
      });
      Alert.alert('Export failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleShare(subjectHint?: string) {
    if (!lastExport) {
      Alert.alert('Nothing to share', 'Export a CSV first.');
      return;
    }
    try {
      await shareCsvFile(lastExport.uri, {
        dialogTitle: `Share ${lastExport.fileName}`,
        subject: subjectHint,
      });
    } catch (err) {
      Alert.alert('Share failed', err instanceof Error ? err.message : String(err));
    }
  }

  const canExportEbay = ready.length > 0 && validation.error_count === 0;

  return (
    <Screen>
      <ScreenHeader title="Export" subtitle={batch?.name} />

      {/* Export success brand moment */}
      {lastExport ? (
        <Card style={styles.successCard} elevated>
          <BrandMark size={48} glow />
          <View style={styles.successText}>
            <Text variant="headline" color={colors.success}>
              {lastExport.mode === 'ebay' ? 'eBay CSV ready' : 'Backup CSV ready'}
            </Text>
            <Text variant="caption" color={colors.textMuted} numberOfLines={1}>
              {lastExport.fileName}
            </Text>
          </View>
          <Button
            label="Share"
            icon="share-outline"
            size="sm"
            variant="secondary"
            fullWidth={false}
            onPress={() => handleShare()}
          />
        </Card>
      ) : null}

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <StatBox value={ready.length} label="Ready" color={colors.success} />
        <StatBox value={exportedCount} label="Exported" color={colors.primary} />
        <StatBox value={validation.error_count} label="Errors" color={colors.error} />
        <StatBox value={validation.warning_count} label="Warnings" color={colors.warning} />
      </View>

      {/* Validate + fix */}
      <View style={styles.actionRow}>
        <Button label="Validate Batch" icon="shield-checkmark-outline" variant="secondary" onPress={handleValidate} style={styles.flex} />
        {validation.error_count + validation.warning_count > 0 ? (
          <Button label="Fix Issues" icon="construct-outline" variant="secondary" onPress={() => router.push(`/batches/${batchId}/review`)} style={styles.flex} />
        ) : null}
      </View>

      {/* Pre-export checklist */}
      <SectionHeader title="Pre-Export Checklist" />
      <PreExportChecklist items={checklist} />

      {/* Validation issues */}
      {validation.results.length > 0 ? (
        <>
          <SectionHeader title="Validation Issues" count={validation.results.length} />
          <ValidationIssueList results={validation.results} emptyLabel="No issues on Ready listings." />
        </>
      ) : null}

      {/* Export actions */}
      <SectionHeader title="Export" />
      {validation.error_count > 0 ? (
        <Card style={styles.blockCard}>
          <Ionicons name="lock-closed" size={16} color={colors.error} />
          <Text variant="caption" color={colors.error} style={styles.flex}>
            eBay export is locked until {validation.error_count} hard error(s) are resolved.
          </Text>
        </Card>
      ) : null}

      <View style={styles.exportActions}>
        <Button label="Export eBay CSV" icon="cloud-upload-outline" variant="success" disabled={!canExportEbay || busy} loading={busy} onPress={() => doExport('ebay')} />
        <Button label="Export Internal CSV" icon="document-outline" variant="secondary" disabled={busy} onPress={() => doExport('internal')} />
        <View style={styles.actionRow}>
          <Button label="Share CSV" icon="share-outline" variant="secondary" disabled={!lastExport} onPress={() => handleShare()} style={styles.flex} />
          <Button label="Email CSV" icon="mail-outline" variant="secondary" disabled={!lastExport} onPress={() => handleShare('bulk eBay export')} style={styles.flex} />
        </View>
        <Button label="Mark Ready as Exported" icon="checkmark-done-outline" variant="ghost" disabled={ready.length === 0} onPress={() => {
          Alert.alert('Mark exported', `Mark ${ready.length} Ready listing(s) as Exported?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Mark Exported', onPress: () => markListingsExported(ready.map((l) => l.id)) },
          ]);
        }} />
      </View>

      {/* CSV column preview */}
      <SectionHeader title="eBay CSV Columns" count={ebayCols.length} />
      <Card>
        <Text variant="caption" color={colors.textMuted} style={styles.previewNote}>
          One row per listing · photo URLs joined with "{APP_CONFIG.photoUrlSeparator}" · up to{' '}
          {APP_CONFIG.maxPhotoUrlsPerListing} photos. Edit headers in services/export/ebayFieldMap.ts
          to match your eBay template.
        </Text>
        <View style={styles.cols}>
          {ebayCols.map((c) => (
            <View key={c} style={styles.colChip}>
              <Text variant="caption2" color={colors.textSecondary}>
                {c}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Export history */}
      <SectionHeader title="Export History" count={exportJobs.length} />
      {exportJobs.length === 0 ? (
        <Card>
          <Text variant="caption" color={colors.textMuted}>
            No exports yet.
          </Text>
        </Card>
      ) : (
        exportJobs.map((job) => (
          <Card key={job.id} style={styles.jobCard}>
            <View style={styles.flex}>
              <Text variant="callout">
                {job.export_mode === 'ebay' ? 'eBay Seller Hub' : 'Internal Full'} ·{' '}
                {job.exported_count} row{job.exported_count === 1 ? '' : 's'}
              </Text>
              <Text variant="caption2" color={colors.textMuted}>
                {formatDate(job.created_at)}
              </Text>
            </View>
            <SeverityBadge severity={job.export_status === 'failed' ? 'error' : 'info'} />
          </Card>
        ))
      )}
    </Screen>
  );
}

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Card style={styles.statBox} elevated>
      <Text variant="title2" color={color}>
        {value}
      </Text>
      <Text variant="caption2" color={colors.textMuted}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderColor: colors.success,
  },
  successText: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  exportActions: { gap: spacing.md },
  flex: { flex: 1 },
  blockCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderColor: colors.error, marginBottom: spacing.md },
  previewNote: { marginBottom: spacing.md },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  colChip: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
});
