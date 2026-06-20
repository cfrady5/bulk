import { create } from 'zustand';

import { uuid } from '@/lib/id';
import { uploadListingPhoto } from '@/services/storage/uploadListingPhoto';
import type { ListingPhoto, ListingType, PendingPhoto, PhotoRole } from '@/types';

import { useAppStore } from './useAppStore';

/**
 * Ephemeral capture session.
 *
 * Holds the photos for the card currently in front of the camera plus any
 * active lot being built. NOT persisted — capture buffers are transient and we
 * commit finished listings/photos into the persisted app store.
 *
 * Performance: we only keep local URIs in memory here (a handful at a time),
 * never full-resolution decoded images, so capture stays responsive across a
 * 200-photo batch.
 */

interface CaptureCommitResult {
  listingId: string;
  uploadErrors: string[];
}

interface CaptureState {
  batchId: string | null;

  /** Photos for the single card currently being captured. */
  currentPhotos: PendingPhoto[];

  /** Lot building. */
  buildingLot: boolean;
  lotPhotos: PendingPhoto[];
  lotCardCount: number;

  /** Number of listings committed during this session. */
  listingsCreated: number;
  committing: boolean;

  start: (batchId: string) => void;
  reset: () => void;

  addPhoto: (photo: PendingPhoto) => void;
  removeByRole: (role: PhotoRole) => void;
  hasRole: (role: PhotoRole) => boolean;
  currentPhotoCount: () => number;

  commitSingle: () => Promise<CaptureCommitResult>;
  flagCurrent: () => Promise<CaptureCommitResult>;
  addToLot: () => void;
  finishLot: () => Promise<CaptureCommitResult>;
}

/** Upload pending photos and turn them into persisted ListingPhoto rows. */
async function persistPhotos(
  pendings: PendingPhoto[],
  batchId: string,
  listingId: string,
): Promise<{ photos: ListingPhoto[]; errors: string[] }> {
  const photos: ListingPhoto[] = [];
  const errors: string[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < pendings.length; i++) {
    const pending = pendings[i];
    let storage_path: string | null = null;
    let public_url: string | null = null;

    try {
      const result = await uploadListingPhoto({
        localUri: pending.local_uri,
        batchId,
        listingId,
      });
      storage_path = result.storage_path;
      public_url = result.public_url;
    } catch (err) {
      // Keep the photo locally so it isn't lost; surface the error to the user.
      errors.push(err instanceof Error ? err.message : String(err));
    }

    photos.push({
      id: uuid(),
      listing_id: listingId,
      batch_id: batchId,
      storage_path,
      public_url,
      local_uri: pending.local_uri,
      photo_role: pending.photo_role,
      sort_order: i,
      created_at: now,
    });
  }

  return { photos, errors };
}

/** Reassign roles for a lot so the cover is front/back and the rest lot_extra. */
function normalizeLotRoles(pendings: PendingPhoto[]): PendingPhoto[] {
  let frontUsed = false;
  let backUsed = false;
  return pendings.map((p) => {
    if (p.photo_role === 'front' && !frontUsed) {
      frontUsed = true;
      return p;
    }
    if (p.photo_role === 'back' && !backUsed) {
      backUsed = true;
      return p;
    }
    return { ...p, photo_role: 'lot_extra' as PhotoRole };
  });
}

export const useCaptureStore = create<CaptureState>((set, get) => ({
  batchId: null,
  currentPhotos: [],
  buildingLot: false,
  lotPhotos: [],
  lotCardCount: 0,
  listingsCreated: 0,
  committing: false,

  start: (batchId) =>
    set({
      batchId,
      currentPhotos: [],
      buildingLot: false,
      lotPhotos: [],
      lotCardCount: 0,
      listingsCreated: 0,
      committing: false,
    }),

  reset: () =>
    set({
      batchId: null,
      currentPhotos: [],
      buildingLot: false,
      lotPhotos: [],
      lotCardCount: 0,
      listingsCreated: 0,
      committing: false,
    }),

  addPhoto: (photo) =>
    set((s) => {
      // Front/back are single-slot (capturing again replaces). Imperfection &
      // lot_extra can stack.
      if (photo.photo_role === 'front' || photo.photo_role === 'back') {
        const filtered = s.currentPhotos.filter((p) => p.photo_role !== photo.photo_role);
        return { currentPhotos: [...filtered, photo] };
      }
      return { currentPhotos: [...s.currentPhotos, photo] };
    }),

  removeByRole: (role) =>
    set((s) => ({ currentPhotos: s.currentPhotos.filter((p) => p.photo_role !== role) })),

  hasRole: (role) => get().currentPhotos.some((p) => p.photo_role === role),

  currentPhotoCount: () => get().currentPhotos.length,

  commitSingle: async () => {
    const { batchId, currentPhotos } = get();
    if (!batchId) throw new Error('No active capture session.');
    if (currentPhotos.length === 0) throw new Error('Capture at least one photo first.');

    set({ committing: true });
    try {
      const store = useAppStore.getState();
      const listing = store.addListing(batchId, 'Single Card');
      const { photos, errors } = await persistPhotos(currentPhotos, batchId, listing.id);
      store.addPhotos(photos);
      set((s) => ({ currentPhotos: [], listingsCreated: s.listingsCreated + 1 }));
      return { listingId: listing.id, uploadErrors: errors };
    } finally {
      set({ committing: false });
    }
  },

  flagCurrent: async () => {
    const { batchId, currentPhotos } = get();
    if (!batchId) throw new Error('No active capture session.');

    set({ committing: true });
    try {
      const store = useAppStore.getState();
      const listing = store.addListing(batchId, 'Single Card');
      store.setReviewStatus(listing.id, 'Flagged');
      const { photos, errors } = await persistPhotos(currentPhotos, batchId, listing.id);
      store.addPhotos(photos);
      set((s) => ({ currentPhotos: [], listingsCreated: s.listingsCreated + 1 }));
      return { listingId: listing.id, uploadErrors: errors };
    } finally {
      set({ committing: false });
    }
  },

  addToLot: () =>
    set((s) => {
      if (s.currentPhotos.length === 0) return s;
      return {
        lotPhotos: [...s.lotPhotos, ...s.currentPhotos],
        lotCardCount: s.lotCardCount + 1,
        currentPhotos: [],
        buildingLot: true,
      };
    }),

  finishLot: async () => {
    const state = get();
    if (!state.batchId) throw new Error('No active capture session.');

    // Fold any in-progress card into the lot first.
    const allLotPhotos = [...state.lotPhotos, ...state.currentPhotos];
    if (allLotPhotos.length === 0) throw new Error('Add at least one card to the lot first.');

    set({ committing: true });
    try {
      const store = useAppStore.getState();
      const listing = store.addListing(state.batchId, 'Card Lot');
      const cardCount = state.lotCardCount + (state.currentPhotos.length > 0 ? 1 : 0);
      store.updateListing(listing.id, { number_of_cards: cardCount, quantity: 1 });

      const normalized = normalizeLotRoles(allLotPhotos);
      const { photos, errors } = await persistPhotos(normalized, state.batchId, listing.id);
      store.addPhotos(photos);

      set((s) => ({
        lotPhotos: [],
        currentPhotos: [],
        buildingLot: false,
        lotCardCount: 0,
        listingsCreated: s.listingsCreated + 1,
      }));
      return { listingId: listing.id, uploadErrors: errors };
    } finally {
      set({ committing: false });
    }
  },
}));

// Re-export for callers that want the type.
export type { ListingType };
