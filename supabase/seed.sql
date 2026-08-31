-- Card Desk seed data — mirrors lib/data/seed.ts. Everything is editable in-app.

insert into public.sports (id, name, slug) values
  ('nfl', 'NFL', 'nfl'),
  ('nba', 'NBA', 'nba'),
  ('mlb', 'MLB', 'mlb')
on conflict (id) do nothing;

insert into public.teams (id, sport_id, city, name, abbreviation) values
  ('bears', 'nfl', 'Chicago', 'Bears', 'CHI'),
  ('bulls', 'nba', 'Chicago', 'Bulls', 'CHI'),
  ('cubs', 'mlb', 'Chicago', 'Cubs', 'CHC'),
  ('cowboys', 'nfl', 'Dallas', 'Cowboys', 'DAL'),
  ('mavericks', 'nba', 'Dallas', 'Mavericks', 'DAL'),
  ('rangers', 'mlb', 'Texas', 'Rangers', 'TEX'),
  ('patriots', 'nfl', 'New England', 'Patriots', 'NE'),
  ('celtics', 'nba', 'Boston', 'Celtics', 'BOS'),
  ('red-sox', 'mlb', 'Boston', 'Red Sox', 'BOS'),
  ('chiefs', 'nfl', 'Kansas City', 'Chiefs', 'KC'),
  ('royals', 'mlb', 'Kansas City', 'Royals', 'KC'),
  ('rams', 'nfl', 'Los Angeles', 'Rams', 'LAR'),
  ('lakers', 'nba', 'Los Angeles', 'Lakers', 'LAL'),
  ('angels', 'mlb', 'Los Angeles', 'Angels', 'LAA'),
  ('49ers', 'nfl', 'San Francisco', '49ers', 'SF'),
  ('warriors', 'nba', 'Golden State', 'Warriors', 'GSW'),
  ('giants-mlb', 'mlb', 'San Francisco', 'Giants', 'SFG'),
  ('browns', 'nfl', 'Cleveland', 'Browns', 'CLE'),
  ('cavaliers', 'nba', 'Cleveland', 'Cavaliers', 'CLE'),
  ('guardians', 'mlb', 'Cleveland', 'Guardians', 'CLE'),
  ('vikings', 'nfl', 'Minnesota', 'Vikings', 'MIN'),
  ('timberwolves', 'nba', 'Minnesota', 'Timberwolves', 'MIN'),
  ('twins', 'mlb', 'Minnesota', 'Twins', 'MIN'),
  ('giants-nfl', 'nfl', 'New York', 'Giants', 'NYG'),
  ('knicks', 'nba', 'New York', 'Knicks', 'NYK'),
  ('yankees', 'mlb', 'New York', 'Yankees', 'NYY'),
  ('texans', 'nfl', 'Houston', 'Texans', 'HOU'),
  ('rockets', 'nba', 'Houston', 'Rockets', 'HOU'),
  ('astros', 'mlb', 'Houston', 'Astros', 'HOU'),
  ('spurs', 'nba', 'San Antonio', 'Spurs', 'SAS')
on conflict (id) do nothing;

insert into public.team_groups (id, name, slug) values
  ('chicago', 'Chicago', 'chicago'),
  ('dallas', 'Dallas', 'dallas'),
  ('boston', 'Boston', 'boston'),
  ('kansas-city', 'Kansas City', 'kansas-city'),
  ('los-angeles', 'Los Angeles', 'los-angeles'),
  ('san-francisco', 'San Francisco', 'san-francisco'),
  ('cleveland', 'Cleveland', 'cleveland'),
  ('minnesota', 'Minnesota', 'minnesota'),
  ('new-york', 'New York', 'new-york'),
  ('houston', 'Houston', 'houston'),
  ('san-antonio', 'San Antonio', 'san-antonio')
on conflict (id) do nothing;

insert into public.team_group_members (team_group_id, team_id) values
  ('chicago', 'bears'), ('chicago', 'bulls'), ('chicago', 'cubs'),
  ('dallas', 'cowboys'), ('dallas', 'mavericks'), ('dallas', 'rangers'),
  ('boston', 'patriots'), ('boston', 'celtics'), ('boston', 'red-sox'),
  ('kansas-city', 'chiefs'), ('kansas-city', 'royals'),
  ('los-angeles', 'rams'), ('los-angeles', 'lakers'), ('los-angeles', 'angels'),
  ('san-francisco', '49ers'), ('san-francisco', 'warriors'), ('san-francisco', 'giants-mlb'),
  ('cleveland', 'browns'), ('cleveland', 'cavaliers'), ('cleveland', 'guardians'),
  ('minnesota', 'vikings'), ('minnesota', 'timberwolves'), ('minnesota', 'twins'),
  ('new-york', 'giants-nfl'), ('new-york', 'knicks'), ('new-york', 'yankees'),
  ('houston', 'texans'), ('houston', 'rockets'), ('houston', 'astros'),
  ('san-antonio', 'spurs')
on conflict (team_group_id, team_id) do nothing;

insert into public.value_tiers (id, name, minimum_value, maximum_value, sort_order) values
  ('t30', '$30-$80', 30, 80, 0),
  ('t300', '$300-$400', 300, 400, 1),
  ('t400', '$400-$500', 400, 500, 2),
  ('t500', '$500-$600', 500, 600, 3),
  ('t600', '$600-$700', 600, 700, 4),
  ('t700', '$700-$850', 700, 850, 5),
  ('t850', '$850-$900', 850, 900, 6),
  ('t900', '$900+', 900, null, 7)
on conflict (id) do nothing;

-- One need row per group x tier; Chicago carries the spec's example quantities.
insert into public.team_needs
  (id, team_group_id, value_tier_id, quantity_needed, quantity_acquired,
   payout_percentage, target_buy_percentage, active)
select
  g.id || ':' || t.id,
  g.id,
  t.id,
  case
    when g.id = 'chicago' and t.id = 't300' then 10
    when g.id = 'chicago' and t.id = 't400' then 13
    when g.id = 'chicago' and t.id = 't500' then 11
    when g.id = 'chicago' and t.id = 't600' then 9
    when g.id = 'chicago' and t.id = 't700' then 8
    when g.id = 'chicago' then 0
    when t.id = 't30' then 0
    else 5
  end,
  0,
  0.94,
  0.87,
  true
from public.team_groups g
cross join public.value_tiers t
on conflict (id) do nothing;

update public.team_needs set active = quantity_needed > 0;

insert into public.pricing_rules
  (id, name, rule_type, adjustment_type, adjustment_value, active, description) values
  ('rule-leaf', 'Leaf products', 'tag', 'percentage', -0.05, false,
   'Pay lower on Leaf (-5% off market value)'),
  ('rule-redemption', 'Redemptions', 'tag', 'percentage', -0.08, false,
   'Don''t pay strong for redemptions (-8%)'),
  ('rule-low-confidence', 'Low confidence comps', 'confidence', 'percentage', -0.03, false,
   'Thin or noisy comps (-3%)')
on conflict (id) do nothing;
