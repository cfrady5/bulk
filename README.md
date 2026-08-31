# Card Desk

A mobile-first acquisition operating system for sports-card buyers and repackers.
Built to be used **one-handed on an iPhone while walking a card show**:

**CARD → COMPS → TEAM → NEED/TIER → PAYOUT → MAX BUY → ACTUAL PRICE → PROFIT → SAVE → NEXT CARD**

Within ~10 seconds of finding a card at a dealer table you see recent comps, whether
the repacker needs that team/value tier, the payout %, the max price you should pay,
and a huge **BUY / NEGOTIATE / PASS** verdict with expected profit.

## Stack

- Next.js 16 (App Router) + TypeScript (strict) + Tailwind CSS 4
- The Card API for recent sales comps (server-side only, provider architecture)
- Supabase (Postgres + Auth + RLS + Storage) — optional; the app also runs in
  a zero-setup on-device **Local Mode**
- Lucide icons, PWA manifest, Vercel-ready

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # then paste your real CARD_API_KEY
npm run dev
```

Open http://localhost:3000 (or your LAN IP from a phone). That's it — with only
`CARD_API_KEY` set, the app runs in **Local Mode**: comps come from the live Card
API through the Next.js server; team groups, tiers, needs, shows, and purchases
persist in the browser (`localStorage`) with editable seed data preloaded.

### Verify the Card API first

```bash
npx tsx scripts/test-card-api.ts
```

Prints record counts, titles, prices, dates, and your remaining rate limit for two
liquid test queries. If this fails, check `CARD_API_KEY` in `.env.local`.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `CARD_API_KEY` | yes | The Card API key. **Server-side only** — never expose as `NEXT_PUBLIC_*`. All requests proxy through `/api/comps/search`. |
| `NEXT_PUBLIC_SUPABASE_URL` | no | Enables Supabase mode (sync + auth + RLS). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Anon/publishable key (safe for the browser; RLS enforces access). |
| `PSA_API_TOKEN` | no | Enables real PSA cert lookup in Scan Slab. Without it the UI falls back to manual entry — no data is faked. |

`.env.local` is gitignored; `.env.example` documents the shape.

## Supabase setup (optional, enables multi-user + auth)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Run the migration: paste `supabase/migrations/0001_init.sql` into the SQL editor
   (or `supabase db push` with the CLI). This creates all tables, indexes, foreign
   keys, RLS policies, the `card-photos` storage bucket, and a trigger that keeps
   `team_needs.quantity_acquired` in sync with purchases.
3. Seed reference data: run `supabase/seed.sql` (sports, ~30 teams, 11 team groups,
   8 value tiers, per-group needs, pricing rules — all editable in-app).
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
   and restart. Sign up at `/login`; the first user can be promoted to admin with
   `update profiles set role = 'admin' where email = 'you@example.com';`

Roles: **admin** manages groups/needs/rates/rules; **buyer** searches, views needs,
and records purchases (RLS restricts buyers to their own purchase rows).

## Deploy to Vercel

```bash
npx vercel
```

Set the same environment variables in the Vercel project settings
(`CARD_API_KEY`, plus the Supabase pair if used) and deploy.
No special configuration is needed — API routes run as serverless functions. Note the
in-memory comp cache and rate-limit display are per-instance on serverless; see
Limitations.

## How it works

### Comp engine
- `lib/card-api.ts` — server-only client for `GET https://www.thecardapi.com/api/v1/market/sales`
  (auth header `x-market-api-key`), captures `X-RateLimit-*` headers, typed errors.
- `lib/comps/` — provider architecture (`CompProvider` interface). The Card API is
  the first provider; Card Ladder / CardHedge / eBay can be added without touching UI.
- `/api/comps/search` — POST `{query, limit, refresh}` → normalized sales + cache
  metadata. 6-hour server-side cache per normalized query; **Refresh sales** forces
  a live fetch; stale cache is served if the live call fails.

### Valuation (`lib/valuation.ts`)
Count / average / median / low / high / last sale over **included** sales only.
Auto value = median at 3+ comps, average at 1–2. Confidence: high 5+, medium 3–4,
low 1–2, none 0 — downgraded one step when the coefficient of variation exceeds
25% (shown as **High price variance**). Manual market value always wins but the
auto value is preserved on the purchase record.

### Match scoring (`lib/match.ts`)
Conservative relevance scoring of each sale title against the parsed query (terms,
year, grader, grade), with hard penalties for lots/reprints and `-term` exclusions.
Sales under 80% match start **excluded**; every sale is one tap to include/exclude
and statistics recompute instantly client-side.

### Team need engine (`lib/needs-engine.ts`)
`resolveNeed(marketValue, teamId)` → team group → value tier → need record →
remaining quantity + payout % + target buy %. Teams are auto-detected from comp
titles (e.g. "…CHICAGO BEARS…" → Bears → CHICAGO group) and always overridable.

### Financials (`lib/finance.ts`)
`expectedPayout = market × payout%`, `targetBuy = market × target%`,
profit/ROI/acquisition %, and the decision engine:
ask ≤ target → **BUY**; target < ask ≤ payout → **NEGOTIATE**; ask > payout →
**PASS**; remaining ≤ 0 → **NO CURRENT NEED** unless overridden.

### Screens
- **Buy** (default): Today strip, quick search, structured Add Card sheet
  (graders, grades, photos, autocomplete), Scan PSA Slab (slab photo + cert
  lookup: cert number → card details → comps run automatically; register for a
  free token at [psacard.com/publicapi](https://www.psacard.com/publicapi) and
  set `PSA_API_TOKEN` — without it the sheet says so and cert entry still saves
  with the card), comp list with sale photos, valuation, need panel, decision
  card with **Save + Add Next** for rapid-fire entry. Saved purchases keep the
  best-matching comp's photo so history rows have card images even without
  your own photo.
- **Needs**: team-group cards with tier remaining counts, All/High/Low/Closed
  filters, tap-to-edit; **/admin/needs** is the desktop spreadsheet-style grid.
- **Purchases**: search + group/show filters, per-row economics, delete, CSV export.
- **Stats**: Today / Show / All-time aggregates + per-group breakdown.
- **More**: Show Mode, team-group membership editing, pricing-rule toggles
  (Leaf −5%, Redemption −8%, Low confidence −3% — off by default), and a
  developer section showing Card API requests remaining.

## Current limitations

- **Supabase project not provisioned**: the account hit the 2-free-project limit,
  so the app currently runs in Local Mode. The full schema/seed/RLS and the
  `SupabaseStore` are implemented and ready — follow "Supabase setup" once a
  project slot is free. Local Mode data is per-device/per-browser.
- The comp cache and rate-limit capture are in-memory per server instance; on
  serverless they reset per cold start. Move to Supabase tables or KV for
  durable caching.
- Slab scanning is cert-lookup only for now: slab photos are captured and
  stored, PSA lookup needs `PSA_API_TOKEN` (free registration), and no
  OCR/vision runs yet — the cert number is typed, not read from the photo.
- Comp queries hit the API's default relevance search; pagination beyond the
  first page (up to 50 sales) isn't fetched.
- Player-name parsing from a free-text query is heuristic (set names can leak
  into the player field) — editable in Add Card before saving.
- Photos in Local Mode are stored as data URIs in `localStorage` (size-limited);
  Supabase mode should move them to the `card-photos` bucket (bucket + policies
  are already in the migration, upload wiring is a next step).
- CSV export only (XLSX later); no Recharts analytics yet.

## Recommended next steps

1. Free a Supabase slot (or upgrade), run migration + seed, flip on Supabase mode,
   and wire photo uploads to Storage.
2. Durable comp cache (`comp_searches`/`sales` tables are already in the schema).
3. PSA API credentials → activate `lib/grading/psa-provider.ts`; then OCR on the
   slab photo (cert number → automatic lookup → prefilled card).
4. Second comp provider (eBay/Card Ladder) + provider blending and per-provider
   match weighting.
5. Pricing-rule engine v2: tag detection from titles (auto-flag Leaf/redemptions),
   per-tier rule overrides.
6. Offline queue for purchases made while venue connectivity drops mid-save.
