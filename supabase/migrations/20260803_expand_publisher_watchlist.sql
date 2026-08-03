-- A fixed comparison group for the publisher feature monitor.
-- Selection criterion: leading digital news brands in their national markets,
-- grouped for web/app feature benchmarking rather than print circulation alone.
insert into public.sources (name, homepage_url, feed_url, access) values
  ('BILD', 'https://www.bild.de/', null, 'public'),
  ('Frankfurter Allgemeine Zeitung', 'https://www.faz.net/', null, 'public'),
  ('WELT', 'https://www.welt.de/', null, 'public'),
  ('Neue Zürcher Zeitung', 'https://www.nzz.ch/', null, 'public'),
  ('Tages-Anzeiger', 'https://www.tagesanzeiger.ch/', null, 'public'),
  ('Kronen Zeitung', 'https://www.krone.at/', null, 'public'),
  ('Le Monde', 'https://www.lemonde.fr/', null, 'public'),
  ('Le Figaro', 'https://www.lefigaro.fr/', null, 'public'),
  ('El País', 'https://elpais.com/', null, 'public'),
  ('la Repubblica', 'https://www.repubblica.it/', null, 'public'),
  ('Corriere della Sera', 'https://www.corriere.it/', null, 'public'),
  ('Dagens Nyheter', 'https://www.dn.se/', null, 'public'),
  ('De Telegraaf', 'https://www.telegraaf.nl/', null, 'public'),
  ('USA Today', 'https://www.usatoday.com/', null, 'public'),
  ('Los Angeles Times', 'https://www.latimes.com/', null, 'public'),
  ('Chicago Tribune', 'https://www.chicagotribune.com/', null, 'public'),
  ('The Boston Globe', 'https://www.bostonglobe.com/', null, 'public'),
  ('Toronto Star', 'https://www.thestar.com/', null, 'public'),
  ('The Globe and Mail', 'https://www.theglobeandmail.com/', null, 'public'),
  ('National Post', 'https://nationalpost.com/', null, 'public')
on conflict (name) do update set homepage_url = excluded.homepage_url, active = true, updated_at = now();

create table public.publisher_watchlist (
  publisher_source_id uuid primary key references public.sources(id) on delete cascade,
  region text not null check (region in ('dach', 'europe', 'north_america')),
  market text not null,
  priority integer not null check (priority between 1 and 10),
  created_at timestamptz not null default now(),
  unique (region, priority)
);

create index publisher_watchlist_region_idx on public.publisher_watchlist (region, priority);
alter table public.publisher_watchlist enable row level security;
grant select, insert, update, delete on public.publisher_watchlist to service_role;

insert into public.publisher_watchlist (publisher_source_id, region, market, priority)
select source.id, seed.region, seed.market, seed.priority
from (values
  ('DER SPIEGEL', 'dach', 'Deutschland', 1),
  ('BILD', 'dach', 'Deutschland', 2),
  ('ZEIT ONLINE', 'dach', 'Deutschland', 3),
  ('Süddeutsche Zeitung (SZ)', 'dach', 'Deutschland', 4),
  ('Frankfurter Allgemeine Zeitung', 'dach', 'Deutschland', 5),
  ('WELT', 'dach', 'Deutschland', 6),
  ('Handelsblatt Media Group', 'dach', 'Deutschland', 7),
  ('Neue Zürcher Zeitung', 'dach', 'Schweiz', 8),
  ('Tages-Anzeiger', 'dach', 'Schweiz', 9),
  ('Kronen Zeitung', 'dach', 'Österreich', 10),
  ('The Guardian', 'europe', 'Vereinigtes Königreich', 1),
  ('Financial Times', 'europe', 'Vereinigtes Königreich', 2),
  ('Le Monde', 'europe', 'Frankreich', 3),
  ('Le Figaro', 'europe', 'Frankreich', 4),
  ('El País', 'europe', 'Spanien', 5),
  ('la Repubblica', 'europe', 'Italien', 6),
  ('Corriere della Sera', 'europe', 'Italien', 7),
  ('Aftenposten', 'europe', 'Norwegen', 8),
  ('Dagens Nyheter', 'europe', 'Schweden', 9),
  ('De Telegraaf', 'europe', 'Niederlande', 10),
  ('The New York Times', 'north_america', 'USA', 1),
  ('The Wall Street Journal', 'north_america', 'USA', 2),
  ('The Washington Post', 'north_america', 'USA', 3),
  ('USA Today', 'north_america', 'USA', 4),
  ('Los Angeles Times', 'north_america', 'USA', 5),
  ('Chicago Tribune', 'north_america', 'USA', 6),
  ('The Boston Globe', 'north_america', 'USA', 7),
  ('Toronto Star', 'north_america', 'Kanada', 8),
  ('The Globe and Mail', 'north_america', 'Kanada', 9),
  ('National Post', 'north_america', 'Kanada', 10)
) as seed(source_name, region, market, priority)
join public.sources source on source.name = seed.source_name
on conflict (publisher_source_id) do update set region = excluded.region, market = excluded.market, priority = excluded.priority;
