# CardSnap Listings

> Snap → AI draft → human review → eBay validation → export CSV → email/share

CardSnap Listings is a premium, private mobile workflow tool for **sports card
sellers**. Instead of listing cards one-by-one, you create a batch, rapidly
photograph each card (front / back / imperfection), let AI draft listing
details, review and fix anything missing or low-confidence, validate against
common eBay bulk-upload rules, and export an **eBay Seller Hub–compatible CSV**
you can email or share for upload.

Built with React Native + Expo + TypeScript. Runs in **Expo Go** for MVP
testing. Local-first — works with **no backend or API keys**, with Supabase as
an optional cloud layer.

---

## What the app does

- **Batch creation** with defaults (sale type, prices, shipping, condition,
  category/condition IDs, offers) to avoid repetitive entry.
- **Capture Mode** — fast, thumb-friendly photographing of cards. Group
  front/back/imperfection photos into single listings, or build **card lots**.
- **AI draft generation** (mock by default) that returns *structured* fields
  with **per-field confidence** (High / Medium / Low / Missing).
- **Review Queue + Listing Review** — edit every field, see confidence badges,
  missing-field callouts, and a live 80-char title counter.
- **eBay validation** — catches missing SKUs, duplicate SKUs, titles > 80
  chars, missing prices/photos/category/condition IDs, and more.
- **CSV export** — two modes (Internal Full + eBay Seller Hub), photo URLs
  joined with `|`, configurable field mapping.
- **Share / Email** the CSV via the device share sheet.

---

## MVP limitations (intentionally out of scope)

- ❌ Direct eBay API publishing / eBay OAuth
- ❌ Live eBay sold-comps pricing / Terapeak
- ❌ Multi-user login / accounts / subscriptions
- ❌ Web dashboard (this is mobile-only — do not build a web app)
- ❌ Background AI jobs
- ❌ Real multimodal AI extraction unless you wire in your own key
- ❌ Direct email delivery (uses the share sheet for now)

Search the code for `TODO` to find every documented future-extension point.

---

## Tech stack

- **React Native** + **Expo (SDK 51)** + **TypeScript**
- **Expo Router** (file-based navigation)
- **Supabase** (Postgres + Storage) — optional
- **expo-camera** + **expo-image-picker** (capture)
- **expo-file-system** + **expo-sharing** (CSV save/share)
- **expo-image** (cached thumbnails / lazy carousels)
- **papaparse** (CSV generation)
- **Zustand** (lightweight, persisted local state)

### Architecture

```
app/                       Expo Router screens
  index.tsx                Home / Batch Dashboard
  batches/new.tsx          Create Batch
  batches/[batchId]/       Detail · Capture · Finalize(AI) · Review · Export
  listings/[listingId]/    Listing Review
components/                Reusable UI (Button, Card, fields, badges, …)
theme/                     colors / spacing / typography / radius / shadows
types/                     Strongly-typed domain models
constants/config.ts        Tunables (title cap, photo-URL limit, bucket, …)
store/                     Zustand (app store + capture session) + selectors
services/
  ai/                      analyze (mock) + buildListingDraft + types
  camera/                  capturePhoto / pickPhoto
  storage/                 upload / public URL / delete (Supabase Storage)
  listing/                 SKU / title / shorten / description / defaults
  validation/              validateEbayListing / validateBatch / missingFields
  export/                  CSV generators + field map + save + share
  supabase/                batches / listings / photos / exportJobs / validation
data/                      Mock batches / listings / photos / AI results
lib/                       supabase client, id, format, base64, photo helpers
supabase/schema.sql        Full SQL setup (tables, indexes, triggers, RLS notes)
```

---

## Installation

```bash
# 1. Install dependencies
npm install

# 2. (Optional) generate placeholder app icons/splash if missing
node scripts/generate-assets.js

# 3. Start Expo
npm start
```

Then scan the QR code with **Expo Go** (iOS/Android), or press `i` / `a` for a
simulator/emulator.

> The app runs immediately with **mock data** — no `.env` or Supabase needed.

---

## Running locally with Expo

- `npm start` — start the Metro dev server (Expo Go).
- `npm run ios` / `npm run android` — open a simulator/emulator.
- `npm run typecheck` — TypeScript check.

### Testing with mock data

On first launch the local store seeds itself with sample batches/listings/photos
covering: a graded PSA card, a raw single, a card lot, a listing missing its
set, a title over 80 chars, a listing missing a price, low AI confidence, a
ready-to-export listing, and a duplicate SKU. This lets you explore every screen
(including validation + export) before configuring anything.

To wipe local data and re-seed, reinstall the app (or clear Expo Go's data).

---

## Supabase setup (optional — for cloud storage + hosted photo URLs)

eBay CSV uploads require **public HTTPS image URLs**. Local `file://` URIs won't
work for upload, so to produce a truly eBay-ready CSV you need hosted photos —
that's what Supabase Storage provides.

1. **Create a Supabase project** at <https://supabase.com>.
2. **Run the SQL schema**: open the SQL Editor and paste
   [`supabase/schema.sql`](supabase/schema.sql). This creates all tables,
   indexes, triggers, and the storage bucket.
3. **Storage bucket**: the SQL creates a **public** bucket named
   `card-listing-photos`. (You can also create it manually: Storage → New bucket
   → name `card-listing-photos` → toggle *Public bucket* ON.)
4. **Make the bucket public** — acceptable for MVP testing; **reconsider for
   production** (prefer signed URLs + RLS + auth).
5. **Add environment variables** — copy `.env.example` to `.env`:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Optional CDN host for photo URLs; otherwise derived from the URL above:
   EXPO_PUBLIC_PHOTO_PUBLIC_HOST=
   ```

6. **Start the app**: `npm start`.
7. **Test photo upload**: enter Capture Mode and take a photo. With Supabase
   configured, photos upload to `card-listing-photos` and get a public URL.
8. **Test CSV export**: mark a listing Ready → Export → Export eBay CSV → share.

> The anon key is safe in a client app (gated by RLS in production). **Never**
> put the `service_role` key in the app.

---

## How to export a CSV

1. **Capture** cards in a batch.
2. **Finalize (AI)** — generates drafts + confidence.
3. **Review** each listing; fix missing/low-confidence fields; **Mark Ready**
   (blocked if there are hard validation errors or a title > 80 chars).
4. Open **Export**:
   - **Validate Batch** to see errors/warnings + the pre-export checklist.
   - **Export eBay CSV** (only Ready listings; disabled while hard errors
     exist; warnings require an "Export Anyway" confirmation).
   - **Export Internal CSV** for a full backup of all fields.
   - **Share / Email CSV** via the device share sheet.
   - Optionally **Mark Ready as Exported**.

CSV behavior:
- One row per listing.
- Photo URLs joined with `|` (configurable separator/limit in
  `constants/config.ts`).
- Titles enforced to ≤ 80 characters (auto-shortened as a final safety net).

---

## How to update the eBay CSV field mapping

eBay templates **vary by category** — there is no single universal template.

Edit [`services/export/ebayFieldMap.ts`](services/export/ebayFieldMap.ts):

- Update each entry's `header` to match the exact column names from the template
  you download in **eBay Seller Hub → Reports** for your category.
- Add/remove rows for category-specific item specifics.
- Verify **Category ID** and **Condition ID** against eBay's current
  category/condition tools — don't rely on plain names.

The photo-URL limit (default **12**) and separator (`|`) live in
`constants/config.ts`.

---

## Image handling & performance

- Photos upload to the `card-listing-photos` bucket; public URLs are stored on
  each photo row and used in the eBay CSV.
- Capture prioritizes **sharp, readable** images (quality is tunable in
  `constants/config.ts`). See comments in `services/camera/*` — the native
  system camera may apply extra computational photography, so the capture path
  is intentionally easy to swap (`expo-camera` ↔ `expo-image-picker`).
- Lists use **thumbnails** (`PhotoThumbnail` via `expo-image`); full-resolution
  images load only in the focused **Listing Review** carousel. The app is built
  to comfortably handle **200+ photos per batch** (virtualized lists, cached
  images, ephemeral capture buffers).

---

## Known limitations

- Without Supabase, photos stay as local `file://` URIs — great for testing the
  workflow, but those URLs are **not** valid for an actual eBay upload (export
  validation will warn you).
- AI extraction is a **mock** by default (returns realistic sample data). Wire a
  real provider in `services/ai/analyzeCardImages.ts`.
- The device share sheet handles "email" — there is no direct mail delivery yet.

---

## Future roadmap

- Direct eBay API integration + OAuth; category / condition ID lookup
- eBay business-policy / shipping-profile sync
- Sold-comps pricing assistant (Terapeak if available)
- True direct email export (Resend / SendGrid via Supabase Edge Functions)
- Real multimodal AI extraction; barcode/OCR + slab-label OCR
- Inventory location tracking; multi-batch search; template management
- Listing performance tracking; relisting unsold inventory; bulk live edits

---

## License

Private MVP. Not affiliated with eBay.
