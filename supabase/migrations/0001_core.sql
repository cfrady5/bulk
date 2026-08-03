-- ===========================================================================
-- bulk — Inventory & Break Profitability : core schema (rebuild)
-- ===========================================================================
-- Conventions:
--   * Money is stored as BIGINT **cents**. Never float.
--   * Rates/percentages are NUMERIC decimal fractions (0.13 = 13%) unless a
--     column name ends in _bps (basis points, integer).
--   * Every business row carries organization_id and is protected by RLS.
--   * created_at / updated_at on mutable tables; updated_at via trigger.
-- ===========================================================================

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- --- enums -----------------------------------------------------------------
do $$ begin
  create type card_status as enum (
    'Unprocessed','In Inventory','Personal Collection','Listed','Sold','Shipped',
    'Sent for Grading','At Grading','At Consignment','Traded','Returned',
    'Written Off','Archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type purchase_type as enum (
    'Individual','Lot','Collection','Sealed Box','Case','Break','Trade',
    'Consignment Intake','Other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type allocation_method as enum ('equal','manual','value_weighted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sale_platform as enum (
    'eBay','Whatnot','Instagram','Facebook','Card Show','Local','Consignment',
    'Private','Trade','Other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type break_status as enum (
    'Draft','Open','Filling','Full','Scheduled','Completed','Shipping','Closed','Cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type spot_payment_status as enum ('unpaid','paid','refunded','partial');
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- Identity / tenancy
-- ===========================================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index if not exists idx_org_members_user on organization_members(user_id);

-- Helper: is the current user a member of org?
create or replace function public.is_org_member(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org and m.user_id = auth.uid()
  );
$$;

-- ===========================================================================
-- Storage locations
-- ===========================================================================
create table if not exists storage_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  box text, "row" text, slot text, showcase text,
  qr_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_storage_locations_org on storage_locations(organization_id);

-- ===========================================================================
-- Purchases + cost allocation
-- ===========================================================================
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by uuid references auth.users(id),
  name text not null,
  purchase_type purchase_type not null default 'Individual',
  acquisition_date date,
  seller text, platform text,
  subtotal_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  buyer_premium_cents bigint not null default 0,
  inbound_shipping_cents bigint not null default 0,
  travel_cents bigint not null default 0,
  other_expenses_cents bigint not null default 0,
  total_landed_cost_cents bigint not null default 0,
  allocation_method allocation_method not null default 'equal',
  notes text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_purchases_org on purchases(organization_id);
create index if not exists idx_purchases_date on purchases(acquisition_date);

create table if not exists purchase_expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  purchase_id uuid not null references purchases(id) on delete cascade,
  label text not null,
  amount_cents bigint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_purchase_expenses_purchase on purchase_expenses(purchase_id);

-- ===========================================================================
-- Cards (the permanent central record)
-- ===========================================================================
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by uuid references auth.users(id),

  -- identity
  player text, sport text, team text, year text,
  manufacturer text, product text, set_name text, insert_set text,
  card_number text, parallel text, variation text,
  serial_number integer, serial_denominator integer,
  is_rookie boolean not null default false,
  is_autograph boolean not null default false,
  is_memorabilia boolean not null default false,
  is_short_print boolean not null default false,
  is_case_hit boolean not null default false,

  -- grading / condition
  is_graded boolean not null default false,
  grading_company text, grade text, certification_number text,
  condition_notes text, internal_notes text,
  quantity integer not null default 1,

  -- financial
  purchase_id uuid references purchases(id) on delete set null,
  acquisition_date date,
  acquisition_source text,
  amount_paid_cents bigint,
  allocated_acquisition_cost_cents bigint not null default 0,
  grading_cost_cents bigint not null default 0,
  additional_expenses_cents bigint not null default 0,
  total_cost_basis_cents bigint not null default 0,
  market_value_at_acquisition_cents bigint,
  current_estimated_value_cents bigint,
  last_valuation_date date,
  valuation_source text,

  -- workflow / storage
  status card_status not null default 'Unprocessed',
  storage_location_id uuid references storage_locations(id) on delete set null,
  consignment_location text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cards_org on cards(organization_id);
create index if not exists idx_cards_status on cards(organization_id, status);
create index if not exists idx_cards_player on cards(organization_id, player);
create index if not exists idx_cards_sport on cards(organization_id, sport);
create index if not exists idx_cards_set on cards(organization_id, set_name);
create index if not exists idx_cards_purchase on cards(purchase_id);
create index if not exists idx_cards_storage on cards(storage_location_id);
create index if not exists idx_cards_acq_date on cards(organization_id, acquisition_date);

create table if not exists card_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  storage_path text,
  photo_role text not null default 'front', -- front | back | imperfection | extra
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_card_photos_card on card_photos(card_id);

create table if not exists card_cost_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  purchase_id uuid not null references purchases(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  method allocation_method not null,
  allocated_cost_cents bigint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_cost_alloc_purchase on card_cost_allocations(purchase_id);
create index if not exists idx_cost_alloc_card on card_cost_allocations(card_id);

create table if not exists card_valuations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  valuation_date date not null default current_date,
  estimated_value_cents bigint not null,
  source text,
  notes text,
  is_manual boolean not null default true,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_card_valuations_card on card_valuations(card_id, valuation_date desc);

-- ===========================================================================
-- Listings (a card's sale-channel presence) + Sales
-- ===========================================================================
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  platform sale_platform not null default 'eBay',
  title text, description text,
  ask_price_cents bigint,
  listed_at timestamptz,
  external_id text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_listings_card on listings(card_id);
create index if not exists idx_listings_org_status on listings(organization_id, status);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete restrict,
  listing_id uuid references listings(id) on delete set null,
  sale_date date not null default current_date,
  platform sale_platform not null default 'eBay',
  buyer text,
  quantity integer not null default 1,
  gross_sale_price_cents bigint not null default 0,
  buyer_paid_shipping_cents bigint not null default 0,
  net_proceeds_cents bigint not null default 0,
  total_cost_basis_cents bigint not null default 0,
  net_profit_cents bigint not null default 0,
  roi numeric,            -- decimal fraction
  days_held integer,
  order_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sales_org on sales(organization_id);
create index if not exists idx_sales_card on sales(card_id);
create index if not exists idx_sales_date on sales(organization_id, sale_date);
create index if not exists idx_sales_platform on sales(organization_id, platform);

create table if not exists sale_expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sale_id uuid not null references sales(id) on delete cascade,
  kind text not null, -- platform_fee | processing_fee | promotion | consignment | shipping | packaging | insurance | refund | other
  amount_cents bigint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_sale_expenses_sale on sale_expenses(sale_id);

-- ===========================================================================
-- Grading
-- ===========================================================================
create table if not exists grading_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company text not null,
  service_level text,
  submitted_at date,
  expected_return date,
  returned_at date,
  fee_cents bigint not null default 0,
  status text not null default 'submitted',
  tracking text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_grading_org on grading_submissions(organization_id);

create table if not exists grading_submission_cards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  submission_id uuid not null references grading_submissions(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  declared_value_cents bigint,
  returned_grade text,
  created_at timestamptz not null default now()
);
create index if not exists idx_grading_cards_sub on grading_submission_cards(submission_id);
create index if not exists idx_grading_cards_card on grading_submission_cards(card_id);

-- ===========================================================================
-- Breaks
-- ===========================================================================
create table if not exists breaks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by uuid references auth.users(id),
  name text not null,
  sport text, product_year text, manufacturer text, product_name text, product_format text,
  number_of_boxes integer not null default 1,
  cost_per_box_cents bigint not null default 0,
  product_subtotal_cents bigint not null default 0,
  sales_tax_cents bigint not null default 0,
  buyer_premium_cents bigint not null default 0,
  inbound_shipping_cents bigint not null default 0,
  total_product_entry_cost_cents bigint not null default 0,
  status break_status not null default 'Draft',
  break_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_breaks_org on breaks(organization_id);
create index if not exists idx_breaks_status on breaks(organization_id, status);

create table if not exists break_expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  break_id uuid not null references breaks(id) on delete cascade,
  label text not null,
  category text not null default 'fulfillment', -- fulfillment | acquisition | platform | labor | other
  kind text not null default 'fixed',           -- fixed | variable
  amount_cents bigint not null default 0,
  per text,                                       -- buyer | spot | shipment | card
  created_at timestamptz not null default now()
);
create index if not exists idx_break_expenses_break on break_expenses(break_id);

create table if not exists break_scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  break_id uuid not null references breaks(id) on delete cascade,
  name text not null,
  format text not null,
  number_of_spots integer not null default 1,
  spot_pricing_method text,
  expected_buyers integer,
  expected_shipments integer,
  shipping_method text,
  platform_fee_pct numeric not null default 0,       -- decimal fraction
  payment_processing_pct numeric not null default 0, -- decimal fraction
  expected_fill_rate numeric,                        -- decimal fraction
  target_profit_cents bigint,
  target_markup numeric,                             -- decimal fraction
  target_margin numeric,                             -- decimal fraction
  avg_spot_price_cents bigint,
  rounding_mode text not null default 'exact',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_break_scenarios_break on break_scenarios(break_id);

create table if not exists break_scenario_spots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  scenario_id uuid not null references break_scenarios(id) on delete cascade,
  label text,
  price_cents bigint not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_scenario_spots_scenario on break_scenario_spots(scenario_id);

create table if not exists break_team_prices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  scenario_id uuid not null references break_scenarios(id) on delete cascade,
  team text not null,
  weight numeric not null default 1,
  checklist_score numeric, rookie_score numeric, star_score numeric,
  autograph_score numeric, memorabilia_score numeric, case_hit_score numeric, demand_score numeric,
  suggested_price_cents bigint,
  final_price_cents bigint,
  min_price_cents bigint,
  status text not null default 'available', -- available | sold
  buyer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_team_prices_scenario on break_team_prices(scenario_id);

create table if not exists active_break_spots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  break_id uuid not null references breaks(id) on delete cascade,
  scenario_id uuid references break_scenarios(id) on delete set null,
  label text,
  team text,
  price_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  shipping_charged_cents bigint not null default 0,
  customer text,
  payment_status spot_payment_status not null default 'unpaid',
  amount_paid_cents bigint not null default 0,
  refunded boolean not null default false,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_active_spots_break on active_break_spots(break_id);

create table if not exists break_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  break_id uuid not null references breaks(id) on delete cascade,
  -- actuals (cents)
  actual_product_cost_cents bigint, actual_supplies_cents bigint, actual_promotion_cents bigint,
  actual_platform_fees_cents bigint, actual_payment_fees_cents bigint, actual_shipping_cents bigint,
  actual_buyers integer, actual_shipments integer,
  actual_revenue_cents bigint, actual_discounts_cents bigint, actual_refunds_cents bigint,
  actual_profit_cents bigint, actual_margin numeric, actual_fill_rate numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_break_results_break on break_results(break_id);

-- ===========================================================================
-- Audit log
-- ===========================================================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_org on audit_logs(organization_id, created_at desc);

-- ===========================================================================
-- updated_at triggers
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','organizations','storage_locations','purchases','cards','listings',
    'sales','grading_submissions','breaks','break_scenarios','break_team_prices',
    'active_break_spots','break_results'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on %1$s;
       create trigger trg_%1$s_updated_at before update on %1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ===========================================================================
-- Row Level Security — every business table scoped by organization membership
-- ===========================================================================
do $$
declare t text;
begin
  -- org-scoped tables
  foreach t in array array[
    'organizations','storage_locations','purchases','purchase_expenses','cards',
    'card_photos','card_cost_allocations','card_valuations','listings','sales',
    'sale_expenses','grading_submissions','grading_submission_cards','breaks',
    'break_expenses','break_scenarios','break_scenario_spots','break_team_prices',
    'active_break_spots','break_results','audit_logs'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists org_rw on %I;', t);
    if t = 'organizations' then
      execute format($f$create policy org_rw on %I
        using (public.is_org_member(id))
        with check (public.is_org_member(id) or owner_id = auth.uid());$f$, t);
    else
      execute format($f$create policy org_rw on %I
        using (public.is_org_member(organization_id))
        with check (public.is_org_member(organization_id));$f$, t);
    end if;
  end loop;
end $$;

-- profiles: a user sees/edits only their own profile
alter table profiles enable row level security;
drop policy if exists profiles_self on profiles;
create policy profiles_self on profiles
  using (id = auth.uid()) with check (id = auth.uid());

-- organization_members: a user can see membership rows for their orgs
alter table organization_members enable row level security;
drop policy if exists org_members_rw on organization_members;
create policy org_members_rw on organization_members
  using (user_id = auth.uid() or public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id) or user_id = auth.uid());
