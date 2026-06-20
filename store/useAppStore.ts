import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { uuid } from '@/lib/id';
import { mockBatches } from '@/data/mockBatches';
import { mockListings } from '@/data/mockListings';
import { mockPhotos } from '@/data/mockPhotos';
import { applyBatchDefaults, createEmptyListing } from '@/services/listing/applyBatchDefaults';
import { generateUniqueSku } from '@/services/listing/generateSku';
import type {
  AIFieldConfidence,
  Batch,
  BatchInput,
  ExportJob,
  Listing,
  ListingPhoto,
  ListingType,
  ReviewStatus,
  ValidationResult,
} from '@/types';

/**
 * Primary app store (local-first).
 *
 * This is the working source of truth for the UI so the whole app runs in
 * Expo Go with no backend. It persists to AsyncStorage. When Supabase is
 * configured, the services/supabase/* layer can mirror/sync these records.
 */

interface AppState {
  hydrated: boolean;
  seeded: boolean;

  batches: Record<string, Batch>;
  listings: Record<string, Listing>;
  photos: Record<string, ListingPhoto>;
  fieldConfidence: Record<string, Record<string, AIFieldConfidence>>;
  exportJobs: ExportJob[];
  validationByBatch: Record<string, ValidationResult[]>;

  // --- lifecycle ---
  setHydrated: (v: boolean) => void;
  seedIfEmpty: () => void;
  resetAll: () => void;

  // --- batches ---
  createBatch: (input: BatchInput) => Batch;
  updateBatch: (id: string, patch: Partial<Batch>) => void;
  deleteBatch: (id: string) => void;
  getBatch: (id: string) => Batch | undefined;
  listBatches: () => Batch[];

  // --- listings ---
  addListing: (batchId: string, listingType?: ListingType) => Listing;
  saveListing: (listing: Listing) => void;
  updateListing: (id: string, patch: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  getListing: (id: string) => Listing | undefined;
  getListingsForBatch: (batchId: string) => Listing[];
  setReviewStatus: (id: string, status: ReviewStatus) => void;
  nextListingNumber: (batchId: string) => number;
  makeUniqueSku: (batchId: string, listingType: ListingType, prefix?: string) => string;

  // --- photos ---
  addPhotos: (photos: ListingPhoto[]) => void;
  getPhotosForListing: (listingId: string) => ListingPhoto[];
  getPhotosForBatch: (batchId: string) => ListingPhoto[];
  deletePhoto: (id: string) => void;

  // --- AI confidence ---
  setFieldConfidence: (listingId: string, map: Record<string, AIFieldConfidence>) => void;
  getFieldConfidence: (listingId: string) => Record<string, AIFieldConfidence> | undefined;

  // --- export ---
  addExportJob: (job: ExportJob) => void;
  getExportJobs: (batchId: string) => ExportJob[];
  markListingsExported: (listingIds: string[]) => void;

  // --- validation ---
  setValidationResults: (batchId: string, results: ValidationResult[]) => void;
  getValidationResults: (batchId: string) => ValidationResult[];
}

function toRecord<T extends { id: string }>(items: T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      seeded: false,
      batches: {},
      listings: {},
      photos: {},
      fieldConfidence: {},
      exportJobs: [],
      validationByBatch: {},

      setHydrated: (v) => set({ hydrated: v }),

      seedIfEmpty: () => {
        const state = get();
        if (state.seeded || Object.keys(state.batches).length > 0) {
          if (!state.seeded) set({ seeded: true });
          return;
        }
        set({
          batches: toRecord(mockBatches),
          listings: toRecord(mockListings),
          photos: toRecord(mockPhotos),
          seeded: true,
        });
      },

      resetAll: () =>
        set({
          batches: {},
          listings: {},
          photos: {},
          fieldConfidence: {},
          exportJobs: [],
          validationByBatch: {},
          seeded: false,
        }),

      // --- batches ---
      createBatch: (input) => {
        const now = new Date().toISOString();
        const batch: Batch = { ...input, id: uuid(), created_at: now, updated_at: now };
        set((s) => ({ batches: { ...s.batches, [batch.id]: batch } }));
        return batch;
      },

      updateBatch: (id, patch) =>
        set((s) => {
          const existing = s.batches[id];
          if (!existing) return s;
          return {
            batches: {
              ...s.batches,
              [id]: { ...existing, ...patch, updated_at: new Date().toISOString() },
            },
          };
        }),

      deleteBatch: (id) =>
        set((s) => {
          const batches = { ...s.batches };
          delete batches[id];
          const listings = Object.fromEntries(
            Object.entries(s.listings).filter(([, l]) => l.batch_id !== id),
          );
          const photos = Object.fromEntries(
            Object.entries(s.photos).filter(([, p]) => p.batch_id !== id),
          );
          return { batches, listings, photos };
        }),

      getBatch: (id) => get().batches[id],

      listBatches: () =>
        Object.values(get().batches).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),

      // --- listings ---
      nextListingNumber: (batchId) => {
        const count = Object.values(get().listings).filter((l) => l.batch_id === batchId).length;
        return count + 1;
      },

      makeUniqueSku: (batchId, listingType, prefix) => {
        const state = get();
        const batch = state.batches[batchId];
        const existing = Object.values(state.listings)
          .filter((l) => l.batch_id === batchId)
          .map((l) => l.sku);
        const listingNumber = existing.length + 1;
        return generateUniqueSku(
          { batchName: batch?.name ?? 'BATCH', listingNumber, listingType, prefix },
          existing,
        );
      },

      addListing: (batchId, listingType) => {
        const state = get();
        const batch = state.batches[batchId];
        if (!batch) throw new Error('Batch not found.');
        const type =
          listingType ?? (batch.default_listing_type === 'Lots' ? 'Card Lot' : 'Single Card');
        const sku = state.makeUniqueSku(batchId, type);
        const listing = applyBatchDefaults(createEmptyListing(batch, { listingType: type, sku }), batch);
        set((s) => ({ listings: { ...s.listings, [listing.id]: listing } }));
        return listing;
      },

      saveListing: (listing) =>
        set((s) => ({
          listings: {
            ...s.listings,
            [listing.id]: { ...listing, updated_at: new Date().toISOString() },
          },
        })),

      updateListing: (id, patch) =>
        set((s) => {
          const existing = s.listings[id];
          if (!existing) return s;
          return {
            listings: {
              ...s.listings,
              [id]: { ...existing, ...patch, updated_at: new Date().toISOString() },
            },
          };
        }),

      deleteListing: (id) =>
        set((s) => {
          const listings = { ...s.listings };
          delete listings[id];
          const photos = Object.fromEntries(
            Object.entries(s.photos).filter(([, p]) => p.listing_id !== id),
          );
          return { listings, photos };
        }),

      getListing: (id) => get().listings[id],

      getListingsForBatch: (batchId) =>
        Object.values(get().listings)
          .filter((l) => l.batch_id === batchId)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),

      setReviewStatus: (id, status) => get().updateListing(id, { review_status: status }),

      // --- photos ---
      addPhotos: (photos) =>
        set((s) => {
          const next = { ...s.photos };
          photos.forEach((p) => {
            next[p.id] = p;
          });
          return { photos: next };
        }),

      getPhotosForListing: (listingId) =>
        Object.values(get().photos)
          .filter((p) => p.listing_id === listingId)
          .sort((a, b) => a.sort_order - b.sort_order),

      getPhotosForBatch: (batchId) =>
        Object.values(get().photos).filter((p) => p.batch_id === batchId),

      deletePhoto: (id) =>
        set((s) => {
          const photos = { ...s.photos };
          delete photos[id];
          return { photos };
        }),

      // --- AI confidence ---
      setFieldConfidence: (listingId, map) =>
        set((s) => ({
          fieldConfidence: { ...s.fieldConfidence, [listingId]: map },
        })),

      getFieldConfidence: (listingId) => get().fieldConfidence[listingId],

      // --- export ---
      addExportJob: (job) => set((s) => ({ exportJobs: [job, ...s.exportJobs] })),

      getExportJobs: (batchId) =>
        get()
          .exportJobs.filter((j) => j.batch_id === batchId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),

      markListingsExported: (listingIds) =>
        set((s) => {
          const listings = { ...s.listings };
          const now = new Date().toISOString();
          listingIds.forEach((id) => {
            if (listings[id]) {
              listings[id] = { ...listings[id], review_status: 'Exported', updated_at: now };
            }
          });
          return { listings };
        }),

      // --- validation ---
      setValidationResults: (batchId, results) =>
        set((s) => ({
          validationByBatch: { ...s.validationByBatch, [batchId]: results },
        })),

      getValidationResults: (batchId) => get().validationByBatch[batchId] ?? [],
    }),
    {
      name: 'cardsnap-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        batches: s.batches,
        listings: s.listings,
        photos: s.photos,
        fieldConfidence: s.fieldConfidence,
        exportJobs: s.exportJobs,
        validationByBatch: s.validationByBatch,
        seeded: s.seeded,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        state?.seedIfEmpty();
      },
    },
  ),
);
