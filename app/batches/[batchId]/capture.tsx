import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  CameraStatusPanel,
  CaptureActionBar,
  IconButton,
  Screen,
  Text,
} from '@/components';
import { APP_CONFIG } from '@/constants/config';
import { PHOTO_ROLE_LABEL } from '@/lib/photo';
import { capturePhoto } from '@/services/camera/capturePhoto';
import { pickPhotoFromLibrary, takePhotoWithSystemCamera } from '@/services/camera/pickPhoto';
import { useAppStore } from '@/store/useAppStore';
import { useCaptureStore } from '@/store/useCaptureStore';
import { colors, radius, spacing } from '@/theme';
import type { PendingPhoto, PhotoRole } from '@/types';

export default function CaptureScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const router = useRouter();
  const batch = useAppStore((s) => (batchId ? s.batches[batchId] : undefined));

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const session = useCaptureStore();
  const { currentPhotos, buildingLot, lotCardCount, listingsCreated, committing } = session;

  const hasFront = currentPhotos.some((p) => p.photo_role === 'front');
  const hasBack = currentPhotos.some((p) => p.photo_role === 'back');
  const nextRole: PhotoRole = !hasFront ? 'front' : !hasBack ? 'back' : 'imperfection';
  const listingNumber = listingsCreated + 1;

  // Start a fresh capture session when entering this batch.
  useEffect(() => {
    if (batchId) session.start(batchId);
    return () => session.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  if (!batch) {
    return (
      <Screen scroll={false}>
        <Text variant="title3" center style={{ marginTop: spacing.giant }}>
          Batch not found
        </Text>
      </Screen>
    );
  }

  async function take(role: PhotoRole) {
    try {
      let pending: PendingPhoto | null = null;
      if (permission?.granted && cameraReady && cameraRef.current) {
        pending = await capturePhoto(cameraRef.current, { role });
      } else {
        // Fallback to the system camera (also sharper on many devices).
        pending = await takePhotoWithSystemCamera(role);
      }
      if (pending) session.addPhoto(pending);
    } catch (err) {
      Alert.alert('Capture failed', err instanceof Error ? err.message : String(err));
    }
  }

  async function pickFromLibrary(role: PhotoRole) {
    try {
      const pending = await pickPhotoFromLibrary(role);
      if (pending) session.addPhoto(pending);
    } catch (err) {
      Alert.alert('Could not pick photo', err instanceof Error ? err.message : String(err));
    }
  }

  function retake(role: PhotoRole) {
    session.removeByRole(role);
    take(role);
  }

  async function commitSingle() {
    try {
      const res = await session.commitSingle();
      if (res.uploadErrors.length > 0) {
        Alert.alert(
          'Saved with upload warning',
          'The listing was saved, but some photos could not be uploaded to cloud storage. They are kept locally — connect Supabase to host them for eBay.',
        );
      }
    } catch (err) {
      Alert.alert('Could not save listing', err instanceof Error ? err.message : String(err));
    }
  }

  function handleNext() {
    if (currentPhotos.length === 0) return;
    if (APP_CONFIG.requireFrontBackBeforeNext && (!hasFront || !hasBack)) {
      Alert.alert(
        'Missing front/back',
        'This listing is missing a front or back photo. Save it anyway?',
        [
          { text: 'Keep capturing', style: 'cancel' },
          { text: 'Save anyway', onPress: commitSingle },
        ],
      );
      return;
    }
    commitSingle();
  }

  async function handleFinishLot() {
    try {
      await session.finishLot();
    } catch (err) {
      Alert.alert('Could not finish lot', err instanceof Error ? err.message : String(err));
    }
  }

  async function handleFlag() {
    try {
      await session.flagCurrent();
    } catch (err) {
      Alert.alert('Could not flag listing', err instanceof Error ? err.message : String(err));
    }
  }

  function handleExit() {
    const targetId = batch!.id;
    const dirty = currentPhotos.length > 0 || buildingLot;
    if (dirty) {
      Alert.alert('Exit capture?', 'You have an unsaved card or an open lot. Discard it?', [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Discard & exit',
          style: 'destructive',
          onPress: () => {
            session.reset();
            router.replace(`/batches/${targetId}`);
          },
        },
      ]);
      return;
    }
    session.reset();
    router.replace(`/batches/${targetId}`);
  }

  return (
    <Screen scroll={false} noPadding edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="close" onPress={handleExit} accessibilityLabel="Exit capture" />
        <View style={styles.headerCenter}>
          <Text variant="headline" numberOfLines={1}>
            Capture
          </Text>
          <Text variant="caption2" color={colors.textMuted} numberOfLines={1}>
            {batch.name}
          </Text>
        </View>
        <IconButton
          icon="images-outline"
          onPress={() => pickFromLibrary(nextRole)}
          accessibilityLabel="Pick from library"
        />
      </View>

      <View style={styles.body}>
        <CameraStatusPanel
          batchName={batch.name}
          listingNumber={listingNumber}
          listingsCreated={listingsCreated}
          currentRole={nextRole}
          hasFront={hasFront}
          hasBack={hasBack}
          photoCount={currentPhotos.length}
          buildingLot={buildingLot}
          lotCardCount={lotCardCount}
        />

        {/* Camera preview / permission gate */}
        <View style={styles.preview}>
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              onCameraReady={() => setCameraReady(true)}
            />
          ) : (
            <View style={styles.permission}>
              <Ionicons name="camera-outline" size={36} color={colors.textMuted} />
              <Text variant="callout" center>
                Camera access needed
              </Text>
              <Text variant="caption" color={colors.textMuted} center style={styles.permissionText}>
                Grant camera access to photograph cards, or use the library button to import photos.
              </Text>
              <Button
                label="Enable Camera"
                icon="camera"
                onPress={requestPermission}
                fullWidth={false}
              />
            </View>
          )}

          {/* Framing guide */}
          {permission?.granted ? (
            <View pointerEvents="none" style={styles.guide}>
              <View style={styles.guideBox} />
              <View style={styles.guideChip}>
                <Text variant="caption2" color={colors.white}>
                  Align {PHOTO_ROLE_LABEL[nextRole].toLowerCase()} · fill the frame
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Current listing thumbnails */}
        {currentPhotos.length > 0 ? (
          <View style={styles.thumbRow}>
            {currentPhotos.map((p) => (
              <Pressable
                key={p.id}
                onLongPress={() => session.removeByRole(p.photo_role)}
                style={styles.thumb}
              >
                <Image source={{ uri: p.local_uri }} style={styles.thumbImg} contentFit="cover" />
                <View style={styles.thumbLabel}>
                  <Text variant="caption2" color={colors.white}>
                    {PHOTO_ROLE_LABEL[p.photo_role]}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <CaptureActionBar
          hasFront={hasFront}
          hasBack={hasBack}
          photoCount={currentPhotos.length}
          buildingLot={buildingLot}
          committing={committing}
          onCaptureFront={() => take('front')}
          onCaptureBack={() => take('back')}
          onAddImperfection={() => take('imperfection')}
          onRetakeFront={() => retake('front')}
          onRetakeBack={() => retake('back')}
          onNextListing={handleNext}
          onAddToLot={() => session.addToLot()}
          onFinishLot={handleFinishLot}
          onFlag={handleFlag}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  body: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.md },
  preview: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 220,
  },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  permissionText: { maxWidth: 260, marginBottom: spacing.sm },
  guide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBox: {
    width: '74%',
    height: '82%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.lg,
  },
  guideChip: {
    position: 'absolute',
    bottom: spacing.lg,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  thumbRow: { flexDirection: 'row', gap: spacing.sm },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    paddingVertical: 1,
  },
  actionBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
});
