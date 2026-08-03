# bulk — Project Handoff

_Last updated: 2026-06-20 · Branch: `claude/gracious-faraday-91o4fp` · Repo: `cfrady5/bulk`_

---

## 1. What this is

**bulk** is a premium, dark-mode mobile app for **sports-card sellers**. Instead of
listing cards one at a time, the seller:

> **Snap → AI draft → human review → eBay validation → export CSV → email/share**

They create a **batch**, rapidly photograph each card (front / back / imperfection),
let the app draft eBay listing fields, review/fix anything missing or low-confidence,
validate against common eBay bulk-upload rules, and export an **eBay Seller Hub–compatible
CSV** to upload.

It is a **local-first Expo app**: it runs fully in **Expo Go** with **no backend or API
keys** (seeded with sample data). Supabase is an **optional** cloud layer for real photo
hosting + persistence.

---

## 2. Current status

| Area | State |
|---|---|
| **Platform** | Expo **SDK 54** (React 19.1 / React Native 0.81) — runs in current Expo Go |
| **Core flow** | ✅ Working end-to-end in local/mock mode (batch → capture → finalize → review → validate → export CSV) |
| **AI drafting** | ⚠️ **Mock/heuristic only** — no real vision model wired yet (see §6) |
| **Branding** | ✅ Official **bulk** identity applied (logo, app icon, splash, gradients) |
| **Supabase** | ✅ Provisioned + schema migrated; wired but **optional** (app works without it) |
| **Auth** | ❌ None (single-user MVP; RLS disabled — see §7 security note) |
| **Tests** | ❌ None yet |
| **Validated** | `tsc --noEmit` clean; `expo export` (production bundle) builds |

---

## 3. Tech stack

- **React Native 0.81** + **Expo SDK 54** + **React 19.1** + **TypeScript**
- **expo-router 6** — file-based navigation (`app/`)
- **Zustand** (+ `persist` to AsyncStorage) — local-first state
- **Supabase** (`@supabase/supabase-js`) — optional Postgres + Storage
- **expo-camera**, **expo-image-picker**, **expo-file-system** (classic API via `/legacy`), **expo-sharing**
- **expo-linear-gradient**, **react-native-svg** — brand gradients / progress ring
- **papaparse** — CSV generation
- Build-time only (not shipped): `@resvg/resvg-js`, `pngjs` — brand-asset generation scripts

---

## 4. Repository map

```
app/                         # expo-router screens (the routes)
  _layout.tsx                #   root layout, gesture root, store hydration gate
  index.tsx                  #   Home: brand header, batch list, empty state
  batches/new.tsx            #   Create batch (defaults form)
  batches/[batchId]/
    index.tsx                #   Batch detail (listings, stats, actions)
    capture.tsx              #   Capture Mode (camera / import, front/back/imperfection)
    finalize.tsx             #   AI processing screen (progress ring)
    review.tsx               #   Batch review queue
    export.tsx               #   Validation + CSV export + share (+ success card)
  listings/[listingId]/review.tsx   # Single-listing detail/edit

components/                  # ~30 UI primitives + brand components
  Button, Card, Text, Screen, ScreenHeader, SectionHeader, EmptyState,
  LoadingState, ProgressRing, ProgressBar, TextField, SelectField,
  ToggleField, PriceField, FormSection, StatusBadge, ConfidenceBadge,
  BatchCard, ListingCard, BatchStats, PhotoCarousel, PhotoThumbnail,
  CaptureActionBar, CameraStatusPanel, PreExportChecklist,
  ValidationIssueList, IconButton,
  BrandMark, BrandLockup         # <- the official logo components

theme/                       # Design system (single source of truth)
  colors, spacing, typography, radius, shadows, gradients, index

store/
  useAppStore.ts             # primary local-first store (batches/listings/photos/…)
  useCaptureStore.ts         # transient capture-session state
  selectors.ts               # computeBatchStats, etc.

services/
  ai/                        # analyzeCardImages -> MOCK (mockAnalyzeCardImages), buildListingDraft
  camera/                    # capturePhoto, pickPhoto
  listing/                   # applyBatchDefaults, generateSku/Title/Description, shortenEbayTitle
  export/                    # generateEbaySellerHubCsv, generateInternalCsv, ebayFieldMap, saveCsvFile, shareCsvFile
  validation/                # validateBatchForExport, validateEbayListing, getMissingFields
  storage/                   # uploadListingPhoto, deleteListingPhoto, getPublicPhotoUrl (Supabase Storage)
  supabase/                  # batches/listings/photos/exportJobs/validationResults (optional sync layer)

types/index.ts               # Domain model (Batch, Listing, ListingPhoto, AIFieldConfidence, …)
constants/config.ts          # APP_CONFIG (title length caps, bucket name, photo rules, …)
lib/                         # supabase client, format, id, base64, photo helpers
data/                        # mockBatches / mockListings / mockPhotos (seed data)

supabase/schema.sql          # Full DB schema (tables, indexes, triggers, RLS notes)
scripts/                     # brand-asset generators (see §8)
assets/                      # icon.png, splash.png, favicon.png, adaptive-icon.png
  brand/                     #   app-icon.png, logo-lockup.png (processed, transparent)
  brand/source/              #   full-res transparent masters (icon.png, lockup.png)
brand/brand-bulk.png         # the brand board / presentation image
```

---

## 5. Data model & state

State lives in **`store/useAppStore.ts`** (Zustand, persisted to AsyncStorage). It is the
working source of truth so the whole app runs offline. Records are keyed maps:

- **`batches`**, **`listings`**, **`photos`** (`ListingPhoto`), **`fieldConfidence`**
  (per-listing AI confidence), **`exportJobs`**, **`validationByBatch`**.
- Lifecycle: `hydrated`, `seedIfEmpty()` (loads `data/mock*` on first run), `resetAll()`.
- Full CRUD for batches/listings/photos + `markListingsExported`, `setValidationResults`, etc.

Core types are in **`types/index.ts`** — `Listing` is the big one (card identity, grading,
pricing/sale format, content, lot fields, workflow status). It mirrors `supabase/schema.sql`.

A separate **`store/useCaptureStore.ts`** holds transient capture-session state.

---

## 6. The workflow (screen by screen)

1. **Home (`app/index.tsx`)** — brand header, batch list + stats, or an empty state with the
   logo lockup and a "Create your first batch" CTA.
2. **New Batch (`batches/new.tsx`)** — sets batch-level defaults (sale type, shipping profile,
   category/condition IDs, pricing) that pre-fill every listing.
3. **Capture (`batches/[batchId]/capture.tsx`)** — camera-first rapid capture; tags photos as
   front / back / imperfection. **Camera requires a physical device**; a library-import
   fallback exists for simulators.
4. **Finalize (`batches/[batchId]/finalize.tsx`)** — runs the "AI" over each listing's photos
   and produces drafts + per-field confidence. **⚠️ This is currently `services/ai/mockAnalyzeCardImages.ts`
   — a deterministic heuristic mock, not a real vision/LLM call.** Swapping in a real model is
   the single biggest "make it real" task (see §9).
5. **Review (`batches/[batchId]/review.tsx` + `listings/[listingId]/review.tsx`)** — reviewer
   fixes missing/low-confidence fields; **Mark Ready** is blocked by hard validation errors or a
   title > 80 chars.
6. **Export (`batches/[batchId]/export.tsx`)** — pre-export checklist + validation summary,
   then **Export eBay CSV** (`generateEbaySellerHubCsv`) or an internal backup CSV. Saves the
   file and opens the share sheet; shows a brand success card.

**Export/validation logic** (the real IP) lives in `services/export/*` and `services/validation/*`
and is plain, testable TypeScript independent of the UI.

---

## 7. Supabase backend (optional)

A live project is **already provisioned and migrated**:

| | |
|---|---|
| Project name | `cardsnap-listings` (predates the "bulk" rename) |
| Project ref | `ltkuipylizzcuxfhtxes` |
| API URL | `https://ltkuipylizzcuxfhtxes.supabase.co` |
| Region | `us-east-1` |
| Tables | `batches`, `listings`, `listing_photos`, `ai_field_confidence`, `export_jobs`, `validation_results` (all with indexes + `updated_at` triggers) |
| Storage | public bucket `card-listing-photos` (read + anon upload policies) |

**To enable it**, create a gitignored `.env` in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://ltkuipylizzcuxfhtxes.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key — Supabase dashboard → Project Settings → API>
EXPO_PUBLIC_PHOTO_PUBLIC_HOST=
```

Without `.env`, the app runs entirely local/mock. The schema is version-controlled at
`supabase/schema.sql`.

> ### 🔒 Security note (must fix before production)
> **Row Level Security is DISABLED** on all tables and the storage bucket is fully open to
> the anon key — fine for a private single-user MVP, **not** for production. Before shipping to
> real users: add **auth**, **enable RLS**, and scope every table by owner (`auth.uid()`), and
> move photo access to signed URLs. Template is at the bottom of `supabase/schema.sql`.

---

## 8. Branding & design system

- **Identity:** glossy white **b** + violet→electric-blue stacked cards; wordmark **bulk**
  (lowercase). Sits directly on near-black. Assets are transparent PNGs.
- **Components:** `BrandMark` (app icon; `tile` option for a rounded app-icon tile) and
  `BrandLockup` (full logo). Used in the loading gate, Home header/empty state, AI finalize,
  and export success.
- **Design tokens:** `theme/` — deep graphite backgrounds, silver/white text, one restrained
  accent, and the brand gradient (`theme/gradients.ts`). Primary `Button` and `ProgressRing`
  use the violet→blue gradient. **Never hardcode hex in components — import from `theme/`.**
- **Asset pipeline (regenerate any time):**
  ```bash
  node scripts/clean-brand-images.js      # trims/keys the source art -> assets/brand/*
  node scripts/generate-brand-assets.js   # icon, splash, favicon, adaptive, brand board
  ```
  Masters live in `assets/brand/source/`. The launcher icon/splash live in `assets/`.

---

## 9. How to run it (Expo Go)

```bash
git clone https://github.com/cfrady5/bulk.git
cd bulk
git checkout claude/gracious-faraday-91o4fp
npm install --legacy-peer-deps        # the flag is REQUIRED (Expo's strict peer ranges)
npx expo start
```
Scan the QR with **Expo Go** (phone on the **same Wi‑Fi**). If the LAN connection fails
(corporate/guest Wi‑Fi, VPN), use `npx expo start --tunnel`.

**Gotchas learned the hard way:**
- Always `npm install --legacy-peer-deps` (plain install throws `ERESOLVE`).
- **Camera needs a real device;** use the library-import button on simulators.
- **SDK match:** the project is on SDK 54 so it works with today's store Expo Go. If Expo Go
  ever says "requires a newer version," update Expo Go; if it says "incompatible/older," we bump
  the project SDK.
- Windows: run in PowerShell; don't paste inline `# comments` into zsh/pwsh.

---

## 10. Known limitations / tech debt

- **AI is mocked** — `services/ai/mockAnalyzeCardImages.ts`. No real card recognition yet.
- **No auth, RLS disabled** (see §7).
- **No automated tests.** The export/validation services are pure functions and are the
  highest-value place to add unit tests first.
- **No real photo upload path exercised end-to-end** (Supabase egress was blocked in the build
  sandbox; the code path exists and should work on-device with `.env` set).
- **Supabase sync is one-directional/manual** — the `services/supabase/*` layer mirrors local
  records but there's no live subscription/conflict resolution.
- iOS bundle identifier is still `com.cardsnap.listings` (internal only; rename before store submit).

---

## 11. Suggested next steps

1. **Wire a real AI drafting service** behind `services/ai/analyzeCardImages.ts` (vision model
   for card identification → fill `Listing` fields + confidence). Keep the mock as a fallback.
2. **Add auth + enable RLS** and scope tables by owner; switch photos to signed URLs.
3. **Unit-test** `services/export/*` and `services/validation/*` (pure, high-value).
4. **Exercise the Supabase path on a real device** with `.env` set (upload → public URL → CSV).
5. **Pre-store polish:** rename bundle IDs to `com.bulk.*`, add a real App Store icon if a
   lighter variant is wanted, and set up **EAS Build → TestFlight** for beta distribution.

---

## 12. Changelog (this branch)

```
5b6c10e  Downgrade to Expo SDK 54 (React 19.1 / RN 0.81) for Expo Go compatibility
32e46f2  Upgrade to Expo SDK 56 (superseded by the SDK 54 pin above)
37b24a5  Swap to transparent brand masters; logo sits directly on dark
1084d98  Adopt uploaded bulk brand assets as the official identity
19685a0  Add bulk brand board mockup (vector source + rendered PNG)
ebd4a1f  Provision live Supabase backend + document connection
4571de7  Build the MVP — sports-card eBay listing workflow
```

---

_Questions this doc should answer for the next person: what it is (§1), how to run it (§9),
where the real logic lives (§6 services), what's fake (§6/§10 AI), and what's unsafe for
production (§7 RLS). Start there._
