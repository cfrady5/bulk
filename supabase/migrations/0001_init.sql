-- Card Desk initial schema
-- Money uses numeric(12,2); percentages use numeric(5,4) storing 0-1 (0.94 = 94%).

create extension if not exists "pgcrypto";

-- ── Profiles / roles ─────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'buyer' check (role in ('admin', 'buyer')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ── Reference data ───────────────────────────────────────────────────────────

create table public.sports (
  id text primary key,
  name text not null,
  slug text not null unique
);

create table public.teams (
  id text primary key,
  sport_id text not null references public.sports (id),
  name text not null,
  city text not null,
  abbreviation text not null,
  logo_url text,
  created_at timestamptz not null default now()
);
create index teams_sport_idx on public.teams (sport_id);

create table public.team_groups (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.team_group_members (
  id uuid primary key default gen_random_uuid(),
  team_group_id text not null references public.team_groups (id) on delete cascade,
  team_id text not null references public.teams (id) on delete cascade,
  unique (team_group_id, team_id)
);
create index tgm_group_idx on public.team_group_members (team_group_id);
create index tgm_team_idx on public.team_group_members (team_id);

create table public.value_tiers (
  id text primary key,
  name text not null,
  minimum_value numeric(12,2) not null,
  maximum_value numeric(12,2),
  sort_order int not null default 0
);

create table public.team_needs (
  id text primary key,
  team_group_id text not null references public.team_groups (id) on delete cascade,
  value_tier_id text not null references public.value_tiers (id) on delete cascade,
  quantity_needed int not null default 0,
  quantity_acquired int not null default 0,
  payout_percentage numeric(5,4) not null default 0.94,
  target_buy_percentage numeric(5,4) not null default 0.87,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (team_group_id, value_tier_id)
);
create index team_needs_group_idx on public.team_needs (team_group_id);

create table public.pricing_rules (
  id text primary key,
  name text not null,
  rule_type text not null check (rule_type in ('tag', 'confidence', 'manual')),
  adjustment_type text not null default 'percentage',
  adjustment_value numeric(6,4) not null default 0,
  active boolean not null default false,
  description text
);

-- ── Cards / comps / purchases ────────────────────────────────────────────────

create table public.shows (
  id text primary key,
  name text not null,
  city text,
  state text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table public.cards (
  id text primary key,
  player_name text not null,
  year text,
  manufacturer text,
  product text,
  set_name text,
  parallel text,
  card_number text,
  serial_number text,
  sport_id text references public.sports (id),
  team_id text references public.teams (id),
  grader text,
  grade text,
  cert_number text,
  image_front_url text,
  image_back_url text,
  created_at timestamptz not null default now()
);
create index cards_player_idx on public.cards (player_name);
create index cards_team_idx on public.cards (team_id);

create table public.comp_searches (
  id uuid primary key default gen_random_uuid(),
  card_id text references public.cards (id) on delete set null,
  query text not null,
  provider text not null default 'card-api',
  searched_at timestamptz not null default now(),
  auto_market_value numeric(12,2),
  manual_market_value numeric(12,2),
  confidence text,
  created_at timestamptz not null default now()
);
create index comp_searches_query_idx on public.comp_searches (query);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  comp_search_id uuid not null references public.comp_searches (id) on delete cascade,
  provider text not null default 'card-api',
  provider_sale_id text,
  title text not null,
  price numeric(12,2) not null,
  sold_at timestamptz,
  marketplace text,
  listing_type text,
  url text,
  included boolean not null default true,
  raw_data jsonb,
  created_at timestamptz not null default now()
);
create index sales_search_idx on public.sales (comp_search_id);

create table public.purchases (
  id text primary key,
  card_id text not null references public.cards (id) on delete cascade,
  buyer_id uuid references public.profiles (id),
  show_id text references public.shows (id) on delete set null,
  seller_name text,
  query text,
  market_value numeric(12,2) not null,
  auto_market_value numeric(12,2),
  manual_market_value numeric(12,2),
  confidence text,
  comp_count int not null default 0,
  payout_percentage numeric(5,4) not null,
  expected_payout numeric(12,2) not null,
  target_buy_percentage numeric(5,4) not null,
  target_buy_price numeric(12,2) not null,
  asking_price numeric(12,2),
  actual_purchase_price numeric(12,2) not null,
  expected_profit numeric(12,2) not null,
  expected_roi numeric(8,4) not null,
  team_group_id text references public.team_groups (id) on delete set null,
  value_tier_id text references public.value_tiers (id) on delete set null,
  team_need_id text references public.team_needs (id) on delete set null,
  comp_image_url text,
  decision_shown text,
  overrode_decision boolean not null default false,
  notes text default '',
  rule_tags text[] not null default '{}',
  status text not null default 'purchased' check (status in ('purchased', 'passed')),
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index purchases_buyer_idx on public.purchases (buyer_id);
create index purchases_show_idx on public.purchases (show_id);
create index purchases_date_idx on public.purchases (purchased_at desc);

-- Keep team_needs.quantity_acquired in sync with saved purchases.
create or replace function public.bump_quantity_acquired()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.team_need_id is not null and new.status = 'purchased' then
    update public.team_needs
      set quantity_acquired = quantity_acquired + 1, updated_at = now()
      where id = new.team_need_id;
  elsif tg_op = 'DELETE' and old.team_need_id is not null and old.status = 'purchased' then
    update public.team_needs
      set quantity_acquired = greatest(0, quantity_acquired - 1), updated_at = now()
      where id = old.team_need_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger purchases_bump_acquired
  after insert or delete on public.purchases
  for each row execute function public.bump_quantity_acquired();

-- ── Row Level Security ───────────────────────────────────────────────────────
-- ADMIN manages configuration; BUYER reads config and records purchases.

alter table public.profiles enable row level security;
alter table public.sports enable row level security;
alter table public.teams enable row level security;
alter table public.team_groups enable row level security;
alter table public.team_group_members enable row level security;
alter table public.value_tiers enable row level security;
alter table public.team_needs enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.shows enable row level security;
alter table public.cards enable row level security;
alter table public.comp_searches enable row level security;
alter table public.sales enable row level security;
alter table public.purchases enable row level security;

create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "admin manages profiles" on public.profiles
  for update using (public.is_admin());

-- Reference/config tables: any signed-in user reads, admins write.
create policy "authenticated read sports" on public.sports for select using (auth.uid() is not null);
create policy "admin writes sports" on public.sports for all using (public.is_admin());
create policy "authenticated read teams" on public.teams for select using (auth.uid() is not null);
create policy "admin writes teams" on public.teams for all using (public.is_admin());
create policy "authenticated read team_groups" on public.team_groups for select using (auth.uid() is not null);
create policy "admin writes team_groups" on public.team_groups for all using (public.is_admin());
create policy "authenticated read tgm" on public.team_group_members for select using (auth.uid() is not null);
create policy "admin writes tgm" on public.team_group_members for all using (public.is_admin());
create policy "authenticated read value_tiers" on public.value_tiers for select using (auth.uid() is not null);
create policy "admin writes value_tiers" on public.value_tiers for all using (public.is_admin());
create policy "authenticated read team_needs" on public.team_needs for select using (auth.uid() is not null);
create policy "admin writes team_needs" on public.team_needs for all using (public.is_admin());
create policy "authenticated read pricing_rules" on public.pricing_rules for select using (auth.uid() is not null);
create policy "admin writes pricing_rules" on public.pricing_rules for all using (public.is_admin());
create policy "authenticated read shows" on public.shows for select using (auth.uid() is not null);
create policy "authenticated writes shows" on public.shows for all using (auth.uid() is not null);

-- Working data: buyers create and see their own; admins see everything.
create policy "authenticated read cards" on public.cards for select using (auth.uid() is not null);
create policy "authenticated writes cards" on public.cards for all using (auth.uid() is not null);
create policy "authenticated read comp_searches" on public.comp_searches for select using (auth.uid() is not null);
create policy "authenticated writes comp_searches" on public.comp_searches for all using (auth.uid() is not null);
create policy "authenticated read sales" on public.sales for select using (auth.uid() is not null);
create policy "authenticated writes sales" on public.sales for all using (auth.uid() is not null);

create policy "buyer reads own purchases" on public.purchases
  for select using (buyer_id = auth.uid() or public.is_admin());
create policy "buyer inserts own purchases" on public.purchases
  for insert with check (buyer_id = auth.uid() or public.is_admin());
create policy "buyer updates own purchases" on public.purchases
  for update using (buyer_id = auth.uid() or public.is_admin());
create policy "buyer deletes own purchases" on public.purchases
  for delete using (buyer_id = auth.uid() or public.is_admin());

-- ── Storage bucket for card photos ───────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('card-photos', 'card-photos', true)
on conflict (id) do nothing;

create policy "authenticated upload card photos" on storage.objects
  for insert with check (bucket_id = 'card-photos' and auth.uid() is not null);
create policy "public read card photos" on storage.objects
  for select using (bucket_id = 'card-photos');
