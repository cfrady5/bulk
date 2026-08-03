# bulk — Rebuild Migration Plan

_From: listing-first Expo mobile app → inventory-first responsive web platform
(Sports Card Inventory + Break Profitability). Next.js + Supabase._

---

## 0. Guiding hierarchy

The new data hierarchy is the north star:

```
Purchase → Inventory Card → (Listing | Grading) → Sale
Break Product & Costs → Scenarios → Active Break → Actual Results
```

A **physical card is the permanent central record.** Purchases, valuations,
listings, grading, and sales attach to it. A card is never deleted on sale — its
status becomes `sold` and its full history remains.

---

## 1. Audit of the existing repo — what we reuse

The current app is an Expo (React Native) app. It cannot be dropped into Next.js
directly (RN primitives ≠ DOM), but its **brand, tokens, and pure logic port cleanly**.

| Existing asset | Location | Reuse in rebuild |
|---|---|---|
| **Brand identity + logo** | `assets/brand/*`, `brand/brand-bulk.png` | ✅ Copy to `web/public/brand/`; used across the web app |
| **Design tokens** (colors, gradient, spacing, radius, typography) | `theme/*` | ✅ Port to Tailwind theme + CSS variables (`web/src/app/globals.css`) |
| **Domain types** | `types/index.ts` | ♻️ Adapt: `Listing` → split into `cards` (identity) + `listings` (sale-channel). Reuse card-identity + grading + condition fields verbatim |
| **eBay CSV export** | `services/export/generateEbaySellerHubCsv.ts`, `ebayFieldMap.ts` | ✅ Port as-is (pure TS) into `web/src/lib/ebay/` |
| **eBay title/description gen** | `services/listing/generateListingTitle.ts`, `shortenEbayTitle.ts`, `generateDescription.ts` | ✅ Port as-is (pure TS) |
| **Listing validation** | `services/validation/*` | ✅ Port as-is; extend for inventory |
| **Card capture concepts** (front/back/imperfection, batch) | `app/.../capture.tsx`, `services/camera/*` | ♻️ Concepts + photo-role model reused; the mobile Expo app becomes the **companion** capture client on the shared DB |
| **SKU generation** | `services/listing/generateSku.ts` | ✅ Port |
| **Supabase project** | `ltkuipylizzcuxfhtxes` (us-east-1) | ✅ Reuse the project; **new normalized schema** via fresh migrations. Old MVP tables (`batches`, `listings`, …) are superseded and will be dropped after migration |
| **UI component patterns** | `components/*` | ♻️ Reimplement as React/DOM with shadcn/ui, keeping the same visual language |

**Not reused as-is:** React Native screen components, `expo-*` modules, the
listing-first navigation, and the flat `listings` store (replaced by a normalized,
server-backed model).

---

## 2. Target architecture & repo structure

Monorepo-friendly, additive (nothing destructive until the web app is proven):

```
/                      # existing Expo app stays (becomes the mobile companion)
  app/ components/ …   #   left in place; shares the Supabase DB
  supabase/
    schema.sql         #   OLD MVP schema (kept for reference)
    migrations/        #   NEW normalized schema lives here
      0001_core.sql
  web/                 # ⭐ the new primary product (Next.js App Router)
    src/
      app/             #   routes: dashboard, inventory, purchases, sales,
                       #     breaks (builder/active/history), reports, settings
      components/      #   shadcn/ui + app components
      lib/
        finance/       #   ⭐ pure calc engine (allocation, sales, breaks,
                       #     pricing, fill-rate, PYT, comparison) — fully tested
        ebay/          #   ported CSV/title/description/validation
        supabase/      #   server + browser clients (no service-role on client)
        money.ts       #   integer-cents money helpers
      server/          #   server actions / data-access (RLS-scoped)
    supabase/          #   -> symlinks/uses the root migrations
```

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase
(Postgres + Auth + Storage) · Zod · React Hook Form · TanStack Table · Recharts ·
Vitest (unit) + Playwright (integration, later).

**Conventions locked in now:**
- **Money = integer cents** everywhere (DB `bigint`, TS `number` of cents). No floats for stored money.
- **Rates/percentages = decimal fractions** in the calc layer (`0.13` = 13%); DB stores them as `numeric` with a documented meaning. Basis points only where noted.
- **Server-side DB ops**; service-role key server-only. Every business table scoped by `organization_id` (with `user_id` creator) and protected by **RLS**.
- **Calculations live in `web/src/lib/finance/` as pure functions** — no UI/DB coupling — so they're unit-tested in isolation (spec §23).

---

## 3. New data model (summary)

Normalized, cents-based, ownership-scoped (full DDL in `supabase/migrations/0001_core.sql`):

`profiles`, `organizations`, `organization_members` · `cards`, `card_photos`,
`card_valuations`, `storage_locations` · `purchases`, `purchase_expenses`,
`purchase_cards`, `card_cost_allocations` · `listings`, `sales`, `sale_expenses`
· `grading_submissions`, `grading_submission_cards` · `breaks`, `break_expenses`,
`break_scenarios`, `break_scenario_spots`, `break_team_prices`,
`active_break_spots`, `break_results` · `audit_logs`.

Card `status` enum covers the full lifecycle (Unprocessed → In Inventory →
Listed → Sold → Shipped, plus Personal Collection, Sent/At Grading, Consignment,
Traded, Returned, Written Off, Archived). Cards are never hard-deleted on sale.

---

## 4. Financial calculations (the core IP)

Implemented as pure modules in `web/src/lib/finance/`, each unit-tested:

| Module | Covers |
|---|---|
| `money.ts` | cents arithmetic, rounding modes (exact / nearest $ / up $ / up $5 / custom) |
| `allocation.ts` | equal / manual / value-weighted cost allocation + validation (sum = landed cost, no negatives, remainder) |
| `purchases.ts` | total landed cost |
| `sales.ts` | net proceeds, net profit, ROI, days held |
| `valuation.ts` | purchase discount, unrealized gain, market movement |
| `breaks.ts` | total break cost (product + fulfillment + acquisition + platform + labor) |
| `pricing.ts` | break-even revenue/spot, required revenue for target profit / markup / margin, required avg spot price; **markup vs margin** guarded (reject margin ≥ 100%) |
| `fillRate.ts` | per-fill-level P&L, break-even spots & fill rate, risk rating |
| `shipping.ts` | spots vs buyers vs shipments; per-buyer/per-shipment variable costs |
| `pyt.ts` | weighted team pricing, rebalance-remaining, over/under-priced exposure |
| `comparison.ts` | scenario ranking + plain-language recommendation |

All formulas follow the spec exactly (§6, §8, §11–15).

---

## 5. Phased plan (spec §22)

- **Phase 1 — Foundation** _(this PR)_: Next.js shell + theme + brand, Supabase config, **finance engine + passing unit tests**, **new schema migration** (with RLS + indexes), auth scaffolding, responsive app shell + navigation.
- **Phase 2 — Inventory**: purchases + cost allocation, inventory records, card detail (tabbed), valuation history, storage tracking, TanStack inventory table (filters, saved views, bulk actions, mobile card view).
- **Phase 3 — Sales**: register sale from a card, expense tracking, profit/ROI, sales history + reporting; status → Sold preserving the record.
- **Phase 4 — Break Builder**: costs, scenarios, pricing calculator, fill-rate modeling, scenario comparison, Pick Your Team pricing.
- **Phase 5 — Active breaks**: spot sales, buyer records, payment status, fill progress, actual vs planned results.
- **Phase 6 — Workflow migration**: adapt capture + photos to inventory, retain eBay listing gen + CSV export + validation, wire dashboard + reports, seed data, integration tests, production hardening.

---

## 6. Production hardening checklist (spec §2)

Auth on every route · RLS on every table · `organization_id`/`user_id` ownership ·
signed photo URLs · no anonymous public writes · indexes on common filters ·
automated tests for all financial calculations · service-role key never on client.

---

## 7. What Phase 1 delivers in this PR

1. This plan.
2. `web/` Next.js app: config, Tailwind theme (ported brand tokens), brand assets, responsive app shell + sidebar/mobile nav (all 9 sections), dashboard scaffold.
3. `web/src/lib/finance/` — the full calculation engine.
4. Vitest test suite for the finance engine (**run and green**).
5. `supabase/migrations/0001_core.sql` — the new normalized, RLS-enabled, indexed schema.

UI data-wiring for inventory/sales/breaks is Phases 2–5.
