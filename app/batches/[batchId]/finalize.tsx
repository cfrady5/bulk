import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BrandMark,
  Button,
  Card,
  ProgressRing,
  Screen,
  ScreenHeader,
  SkeletonBlock,
  Text,
} from '@/components';
import { analyzeCardImages } from '@/services/ai/analyzeCardImages';
import { buildListingDraft } from '@/services/ai/buildListingDraft';
import type { AIPhotoRef } from '@/services/ai/types';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing } from '@/theme';
import type { ReviewStatus } from '@/types';

/** Statuses that still need an AI draft pass. */
const DRAFTABLE: ReviewStatus[] = ['Draft'];

export default function FinalizeScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => (batchId ? s.batches[batchId] : undefined));

  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [currentTitle, setCurrentTitle] = useState('');
  const [finished, setFinished] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!batchId || started.current) return;
    started.current = true;

    const store = useAppStore.getState();
    const targets = store.getListingsForBatch(batchId).filter((l) => DRAFTABLE.includes(l.review_status));
    setTotal(targets.length);

    if (targets.length === 0) {
      setFinished(true);
      return;
    }

    let cancelled = false;

    (async () => {
      for (let i = 0; i < targets.length; i++) {
        if (cancelled) return;
        const listing = targets[i];
        setCurrentTitle(listing.card_name || listing.title || listing.sku);

        const photos = store.getPhotosForListing(listing.id);
        const photoRefs: AIPhotoRef[] = photos.map((p) => ({
          role: p.photo_role,
          local_uri: p.local_uri,
          public_url: p.public_url,
        }));

        try {
          const analysis = await analyzeCardImages({
            listing_id: listing.id,
            listing_type: listing.listing_type,
            photos: photoRefs,
            front: photoRefs.find((p) => p.role === 'front') ?? null,
            back: photoRefs.find((p) => p.role === 'back') ?? null,
            imperfections: photoRefs.filter((p) => p.role === 'imperfection'),
            batchDefaults: batch,
          });
          const draft = buildListingDraft(listing, analysis, photos);
          store.saveListing(draft.listing);
          store.setFieldConfidence(listing.id, draft.fieldConfidenceMap);
        } catch {
          // Don't let one listing block the batch; mark it for manual review.
          store.setReviewStatus(listing.id, 'Needs Review');
        }

        if (!cancelled) setDone(i + 1);
      }
      if (!cancelled) setFinished(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  // Auto-advance to the review queue shortly after finishing.
  useEffect(() => {
    if (!finished || !batchId) return;
    const t = setTimeout(() => router.replace(`/batches/${batchId}/review`), 700);
    return () => clearTimeout(t);
  }, [finished, batchId, router]);

  const progress = total > 0 ? done / total : 1;

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Finalizing Postings" showBack={!finished} />

      <View style={styles.center}>
        <BrandMark size={56} glow style={styles.brandMark} />
        <ProgressRing
          progress={progress}
          size={140}
          strokeWidth={10}
          value={total > 0 ? `${done}/${total}` : '0'}
          label={finished ? 'Done' : 'analyzing'}
        />
        <Text variant="title3" center style={styles.heading}>
          {total === 0
            ? 'Nothing new to analyze'
            : finished
              ? 'Drafts ready for review'
              : 'AI is drafting your listings'}
        </Text>
        <Text variant="bodySecondary" center style={styles.sub}>
          {total === 0
            ? 'All listings already have drafts. Heading to the review queue.'
            : finished
              ? 'Confidence scores and suggested fields are ready.'
              : `Analyzing ${currentTitle || 'card'}…`}
        </Text>
      </View>

      {/* Skeleton preview cards while processing */}
      {!finished ? (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => (
            <Card key={i} style={styles.skeleton}>
              <View style={styles.skeletonRow}>
                <SkeletonBlock width={64} height={64} />
                <View style={styles.skeletonText}>
                  <SkeletonBlock width="60%" height={12} />
                  <SkeletonBlock width="90%" height={12} />
                  <SkeletonBlock width="40%" height={12} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <Button
          label="Go to Review Queue"
          icon="arrow-forward"
          onPress={() => router.replace(`/batches/${batchId}/review`)}
          style={styles.cta}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.md, marginTop: spacing.giant },
  brandMark: { marginBottom: spacing.sm },
  heading: { marginTop: spacing.lg },
  sub: { maxWidth: 300 },
  skeletons: { marginTop: spacing.giant, gap: spacing.md },
  skeleton: {},
  skeletonRow: { flexDirection: 'row', gap: spacing.md },
  skeletonText: { flex: 1, gap: spacing.sm, justifyContent: 'center' },
  cta: { marginTop: spacing.giant },
});
