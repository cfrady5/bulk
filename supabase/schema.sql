-- ===========================================================================
-- CardSnap Listings — Supabase schema
-- ===========================================================================
-- Run this in the Supabase SQL Editor (or via the CLI) to provision the
-- backend. The MVP app runs fully local without this, but Supabase is required
-- for cloud storage + hosted public photo URLs (which eBay needs).
--
-- Conventions:
--   * UUID primary keys (gen_random_uuid()).
--   * created_at / updated_at timestamps.
--   * updated_at is auto-maintained by a trigger.
--   * Indexes on batch_id / listing_id foreign keys.
--
-- RLS NOTE (MVP):
--   The MVP has NO user login, so we DISABLE row level security below to keep
--   the anon key fully functional. This is acceptable for private/local MVP
--   testing only. BEFORE PRODUCTION: add auth, enable RLS, and scope every
--   table by owner (e.g. `auth.uid() = user_id`). See the commented template
--   at the bottom of this file.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --- updated_at trigger function ------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ===========================================================================
-- 13.1 batches
-- ===========================================================================
create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_listing_type text not null default 'Singles',      -- Singles | Lots | Mixed
  default_sale_type text not null default 'Buy It Now',       -- Auction | Buy It Now
  default_shipping_profile text default '',
  default_promotion_percent numeric,
  default_quantity integer not null default 1,
  default_condition text default '',
  default_auction_start_price numeric,
  default_buy_it_now_price numeric,
  default_minimum_offer numeric,
  default_auto_accept_offer numeric,
  default_auto_decline_offer numeric,
  default_accept_offers boolean not null default true,
  default_category_id text,
  default_condition_id text,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_batches_updated_at on batches;
create trigger trg_batches_updated_at
  before update on batches
  for each row execute function set_updated_at();

-- ===========================================================================
-- 13.2 listings
-- ===========================================================================
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  sku text not null default '',
  listing_type text not null default 'Single Card',          -- Single Card | Card Lot

  -- Card identity
  card_name text default '',
  player text default '',
  team text default '',
  sport text default '',
  league text default '',
  year text default '',
  season text default '',
  manufacturer text default '',
  set_name text default '',
  card_number text default '',
  parallel_variety text default '',
  insert_set text default '',
  rookie_card text default 'Unknown',                        -- Yes | No | Unknown
  autographed text default 'Unknown',
  memorabilia text default 'Unknown',

  -- Grading / condition
  graded text default 'No',                                  -- Yes | No
  grading_company text default '',
  grade text default '',
  professional_grader text default '',
  certification_number text default '',
  raw_or_graded text default 'Raw',                          -- Raw | Graded
  original_reprint text default 'Original',                  -- Original | Reprint
  card_condition text default '',
  condition_notes text default '',
  visible_imperfections text default '',
  features text default '',
  card_size text default 'Standard',
  language text default 'English',
  country_region_of_manufacture text default 'United States',

  -- Pricing / sale format
  sale_type text not null default 'Buy It Now',              -- Auction | Buy It Now
  auction_start_price numeric,
  buy_it_now_price numeric,
  minimum_offer numeric,
  auto_accept_offer numeric,
  auto_decline_offer numeric,
  accept_offers boolean not null default true,
  quantity integer not null default 1,
  shipping_profile text default '',
  promotion_percent numeric,

  -- Content
  title text default '',
  description text default '',
  category_id text default '',
  condition_id text default '',
  internal_notes text default '',

  -- Lot-specific
  lot_title text,
  number_of_cards integer,
  featured_cards text,
  shared_player text,
  shared_team text,
  shared_sport text,
  shared_league text,
  shared_set text,
  shared_theme text,
  lot_notes text,

  -- Workflow
  review_status text not null default 'Draft',               -- Draft | Needs Review | Ready | Flagged | Exported
  ai_confidence_summary text default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listings_batch_id on listings(batch_id);
create index if not exists idx_listings_review_status on listings(review_status);

drop trigger if exists trg_listings_updated_at on listings;
create trigger trg_listings_updated_at
  before update on listings
  for each row execute function set_updated_at();

-- ===========================================================================
-- 13.3 listing_photos
-- ===========================================================================
create table if not exists listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete cascade,
  storage_path text,
  public_url text,
  local_uri text,
  photo_role text not null default 'front',                  -- front | back | imperfection | lot_extra
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_listing_photos_listing_id on listing_photos(listing_id);
create index if not exists idx_listing_photos_batch_id on listing_photos(batch_id);

-- ===========================================================================
-- 13.4 ai_field_confidence
-- ===========================================================================
create table if not exists ai_field_confidence (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  field_name text not null,
  field_value text default '',
  confidence text not null default 'Missing',                -- High | Medium | Low | Missing
  reason text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_field_confidence_listing_id on ai_field_confidence(listing_id);

-- ===========================================================================
-- 13.5 export_jobs
-- ===========================================================================
create table if not exists export_jobs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  exported_count integer not null default 0,
  csv_file_path text default '',
  export_status text not null default 'pending',             -- pending | success | failed
  export_mode text not null default 'ebay',                  -- ebay | internal
  validation_errors_count integer not null default 0,
  validation_warnings_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_export_jobs_batch_id on export_jobs(batch_id);

-- ===========================================================================
-- 13.6 validation_results
-- ===========================================================================
create table if not exists validation_results (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  batch_id uuid not null references batches(id) on delete cascade,
  severity text not null default 'warning',                  -- error | warning | info
  field_name text default '',
  message text default '',
  suggested_fix text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_validation_results_batch_id on validation_results(batch_id);
create index if not exists idx_validation_results_listing_id on validation_results(listing_id);

-- ===========================================================================
-- RLS (MVP: disabled — see note at top of file)
-- ===========================================================================
alter table batches            disable row level security;
alter table listings           disable row level security;
alter table listing_photos     disable row level security;
alter table ai_field_confidence disable row level security;
alter table export_jobs        disable row level security;
alter table validation_results disable row level security;

-- ---------------------------------------------------------------------------
-- PRODUCTION RLS TEMPLATE (uncomment + adapt once you add auth + a user_id col)
-- ---------------------------------------------------------------------------
-- alter table batches enable row level security;
-- create policy "owner can do everything" on batches
--   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- (repeat per table; add a `user_id uuid references auth.users` column first.)

-- ===========================================================================
-- STORAGE BUCKET SETUP
-- ===========================================================================
-- Create the public bucket used for card photos. You can also do this in the
-- Supabase Dashboard: Storage > New bucket > name "card-listing-photos",
-- toggle "Public bucket" ON (acceptable for MVP; reconsider for production).
insert into storage.buckets (id, name, public)
values ('card-listing-photos', 'card-listing-photos', true)
on conflict (id) do update set public = true;

-- Public read for the bucket (MVP). For production, prefer signed URLs.
-- create policy "public read card photos" on storage.objects
--   for select using (bucket_id = 'card-listing-photos');
-- create policy "anon upload card photos" on storage.objects
--   for insert with check (bucket_id = 'card-listing-photos');
