-- ============================================================
-- ExpatPortugal.guide — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ARTICLES (auto-generated daily by n8n + Claude)
create table articles (
  id           bigserial primary key,
  title        text not null,
  summary      text not null,
  body         text,
  category     text not null,  -- news | housing | bureaucracy | food | events | community | transport | lifestyle
  region       text default 'all', -- all | Lisbon | Porto | Algarve | Cascais | Braga | Alentejo | Madeira
  source_url   text,
  source_name  text,
  image_emoji  text default '📰',
  status       text default 'pending', -- pending | approved | rejected
  featured     boolean default false,
  created_at   timestamptz default now(),
  published_at timestamptz,
  approved_by  text,
  approved_at  timestamptz
);

-- EVENTS (auto-pulled daily from Eventbrite + scraped sources)
create table events (
  id           bigserial primary key,
  title        text not null,
  description  text,
  category     text not null,  -- music | food | social | sport | culture | market | art | family
  city         text not null,
  venue        text,
  event_date   date not null,
  event_time   text,
  price        text default 'Free',
  url          text,
  source       text,
  status       text default 'approved', -- events auto-approve unless flagged
  created_at   timestamptz default now()
);

-- NEWSLETTER SUBSCRIBERS
create table subscribers (
  id           bigserial primary key,
  email        text not null unique,
  region       text default 'all',
  source       text default 'website', -- website | tools | live_local | language_exchange
  status       text default 'active',  -- active | unsubscribed
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz
);

-- NEWSLETTER SENDS (log of every digest sent)
create table newsletter_sends (
  id           bigserial primary key,
  subject      text not null,
  body_html    text not null,
  recipient_count int default 0,
  status       text default 'draft', -- draft | sent | failed
  sent_at      timestamptz,
  created_at   timestamptz default now()
);

-- LANGUAGE EXCHANGE SIGNUPS
create table language_exchange (
  id           bigserial primary key,
  name         text not null,
  email        text not null,
  type         text not null,  -- expat | local
  city         text not null,
  level        text,
  matched      boolean default false,
  matched_with bigint references language_exchange(id),
  matched_at   timestamptz,
  created_at   timestamptz default now()
);

-- RENTAL PRICES (updated monthly by n8n)
create table rental_prices (
  id           bigserial primary key,
  city         text not null,
  area         text not null,
  region       text not null,
  studio_avg   int,
  bed1_avg     int,
  bed2_avg     int,
  bed3_avg     int,
  trend_pct    text,  -- e.g. "+3%"
  trend_dir    text,  -- up | dn | fl
  updated_at   timestamptz default now()
);

-- DIRECTORY LISTINGS (professionals + lifestyle services)
create table directory (
  id           bigserial primary key,
  name         text not null,
  role         text not null,
  type         text not null,   -- professional | lifestyle
  category     text not null,   -- legal | tax | relocation | property | finance | fitness | health | pets | beauty | home | tutoring | childcare
  city         text not null,
  description  text,
  tags         text[],
  contact_email text,
  contact_url  text,
  listing_tier  text default 'basic', -- basic | featured | premium
  paid_until   date,
  status       text default 'active',
  created_at   timestamptz default now()
);

-- AUTOMATION LOGS (track what n8n ran and when)
create table automation_logs (
  id           bigserial primary key,
  workflow     text not null,   -- daily_news | weekly_digest | event_scrape | rental_update
  status       text not null,   -- success | error | partial
  items_created int default 0,
  error_msg    text,
  ran_at       timestamptz default now()
);

-- ============================================================
-- INDEXES (speed up common queries)
-- ============================================================
create index idx_articles_status    on articles(status);
create index idx_articles_category  on articles(category);
create index idx_articles_region    on articles(region);
create index idx_articles_published on articles(published_at desc);
create index idx_events_date        on events(event_date);
create index idx_events_city        on events(city);
create index idx_subscribers_status on subscribers(status);
create index idx_directory_type     on directory(type, category);

-- ============================================================
-- ROW LEVEL SECURITY (public reads, no public writes)
-- ============================================================
alter table articles          enable row level security;
alter table events            enable row level security;
alter table subscribers       enable row level security;
alter table rental_prices     enable row level security;
alter table directory         enable row level security;
alter table language_exchange enable row level security;

-- Public can read approved articles + events + rentals + directory
create policy "Public read articles"
  on articles for select using (status = 'approved');

create policy "Public read events"
  on events for select using (status = 'approved');

create policy "Public read rentals"
  on rental_prices for select using (true);

create policy "Public read directory"
  on directory for select using (status = 'active');

-- Public can INSERT subscribers and language exchange (sign-up forms)
create policy "Public subscribe"
  on subscribers for insert with check (true);

create policy "Public language exchange signup"
  on language_exchange for insert with check (true);

-- ============================================================
-- SEED DATA — starter rental prices
-- ============================================================
insert into rental_prices (city, area, region, studio_avg, bed1_avg, bed2_avg, bed3_avg, trend_pct, trend_dir) values
  ('Lisbon',   'Chiado / Bairro Alto',    'lisbon',  1450, 1900, 2600, 3800, '+4%', 'up'),
  ('Lisbon',   'Alfama / Mouraria',        'lisbon',  1100, 1500, 2000, 2900, '+6%', 'up'),
  ('Lisbon',   'Principe Real',            'lisbon',  1600, 2100, 2900, 4200, '+3%', 'up'),
  ('Lisbon',   'Almada / Cacilhas',        'lisbon',   750,  950, 1250, 1700, '+2%', 'up'),
  ('Cascais',  'Town centre',              'other',   1100, 1500, 2100, 3000, '+5%', 'up'),
  ('Sintra',   'Town & surrounds',         'other',    800, 1050, 1450, 2000, '+3%', 'up'),
  ('Porto',    'Ribeira / Cedofeita',      'porto',    900, 1150, 1550, 2200, '+2%', 'up'),
  ('Porto',    'Foz do Douro',             'porto',   1100, 1450, 1950, 2800, '+4%', 'up'),
  ('Porto',    'Matosinhos',               'porto',    750,  950, 1250, 1700,  '0%', 'fl'),
  ('Porto',    'Gaia / Espinho',           'porto',    650,  850, 1100, 1500, '-1%', 'dn'),
  ('Algarve',  'Lagos',                    'algarve',  900, 1200, 1600, 2200, '+3%', 'up'),
  ('Algarve',  'Vilamoura / Albufeira',    'algarve', 1000, 1350, 1800, 2600, '+5%', 'up'),
  ('Algarve',  'Tavira / Eastern Algarve', 'algarve',  650,  850, 1100, 1500,  '0%', 'fl'),
  ('Braga',    'City centre',              'other',    550,  700,  950, 1300, '+2%', 'up'),
  ('Coimbra',  'City centre',              'other',    500,  650,  850, 1150, '+1%', 'up'),
  ('Alentejo', 'Evora & surrounds',        'other',    380,  500,  650,  850,  '0%', 'fl');

-- ============================================================
-- LOCAL BUSINESSES (manually added via admin dashboard)
-- For the "Live Like a Local" page — locally-owned Portuguese
-- businesses worth supporting
-- ============================================================
create table local_businesses (
  id          bigserial primary key,
  name        text not null,
  type        text not null,  -- restaurant | market | bakery | bar | cultural | sport | services | other
  city        text not null,
  area        text,           -- neighbourhood e.g. Mouraria, Bairro Alto
  reason      text not null,  -- why it's recommended
  address     text,
  url         text,           -- Google Maps or website
  price_range text,           -- € | €€ | €€€
  emoji       text default '🏪',
  status      text default 'active',
  created_at  timestamptz default now()
);

create index idx_businesses_city on local_businesses(city);
create index idx_businesses_type on local_businesses(type);

alter table local_businesses enable row level security;

create policy "Public read businesses"
  on local_businesses for select using (status = 'active');
