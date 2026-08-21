-- Run this once in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  link text not null,
  icon_url text,
  clicks int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  requested_usd numeric(12, 2) not null,
  amount_usd numeric(12, 2),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  chain text check (chain in ('solana', 'ethereum', 'bsc', 'polygon', 'base')),
  token text check (token in ('USDC', 'USDT')),
  payer_wallet text,
  tx_signature text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists bids_listing_id_idx on bids(listing_id);
create index if not exists bids_status_idx on bids(status);

create or replace function increment_listing_clicks(listing_id uuid)
returns void as $$
  update listings set clicks = clicks + 1 where id = listing_id;
$$ language sql;

create table if not exists site_meta (
  key text primary key,
  value text not null
);

insert into site_meta (key, value)
values ('launched_at', now()::text)
on conflict (key) do nothing;

create table if not exists page_visits (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists page_visits_visitor_id_idx on page_visits(visitor_id);

-- The current #1 price and each listing's best paid bid, used by the leaderboard.
create or replace view leaderboard as
select
  l.id,
  l.name,
  l.description,
  l.link,
  l.icon_url,
  l.clicks,
  l.created_at,
  b.amount_usd,
  b.paid_at,
  row_number() over (order by b.amount_usd desc, b.paid_at asc) as rank
from listings l
join lateral (
  select amount_usd, paid_at
  from bids
  where bids.listing_id = l.id and bids.status = 'paid'
  order by amount_usd desc
  limit 1
) b on true
order by rank;

alter table listings enable row level security;
alter table bids enable row level security;
alter table site_meta enable row level security;
alter table page_visits enable row level security;

drop policy if exists "public read listings" on listings;
create policy "public read listings" on listings for select using (true);

drop policy if exists "public read paid bids" on bids;
create policy "public read paid bids" on bids for select using (status = 'paid');

drop policy if exists "public read site meta" on site_meta;
create policy "public read site meta" on site_meta for select using (true);

-- All writes (listings, bids, visit logging) go through API routes using the
-- service role key, which bypasses RLS — no insert/update policies needed here.
