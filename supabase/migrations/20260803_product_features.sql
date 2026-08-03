-- Internal product inventory used as the baseline for future industry benchmarking.
create table if not exists public.product_features (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  area text not null check (area in ('audio', 'video')),
  status text not null default 'live' check (status in ('live', 'in_progress', 'planned')),
  surfaces text[] not null default '{}',
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_features_updated_at before update on public.product_features
for each row execute function public.set_updated_at();

alter table public.product_features enable row level security;
grant select, insert, update, delete on public.product_features to service_role;

insert into public.product_features (title, area, status, surfaces, description) values
  ('Artikelvertonung in den Apps', 'audio', 'live', array['Webview', 'E-Paper', 'Nativer Player'], 'Vertonte Artikel aus Webview und E-Paper werden im nativen Player ausgespielt.'),
  ('KI-generierte Morgenreports', 'audio', 'live', array['Webview', 'Lokalteile'], 'Tägliches Audio-Briefing mit drei aktuellen Artikeln und Wetter für jeden Lokalteil.'),
  ('KI-generierte Themenreports', 'audio', 'live', array['Webview', 'Audience-Themen'], 'Thematische Briefings für Angebote wie Familie oder Blaulicht.'),
  ('Audio-Hub', 'audio', 'live', array['App', 'Audio'], 'Zentraler Einstiegspunkt für alle Audio-Themen und -Formate.'),
  ('Redaktionelle Podcasts', 'audio', 'live', array['Fußball', 'True Crime', 'Essen'], 'Manuell produzierte Podcastformate für ausgewählte Themenfelder.'),
  ('Video-Player im Artikel', 'video', 'live', array['Artikel', 'Eigene Produktionen'], 'Eigene Videoproduktionen werden direkt im passenden Artikel ausgespielt.'),
  ('Vertical-Feed-Player', 'video', 'live', array['App', 'Vertikalvideo'], 'Ein Reel-ähnlicher Feed für eigene vertikale Videos.'),
  ('Video-Hub', 'video', 'live', array['App', 'Video'], 'Zentraler Einstiegspunkt für alle Video-Themen und -Formate.')
on conflict (title) do update set
  area = excluded.area, status = excluded.status, surfaces = excluded.surfaces, description = excluded.description, updated_at = now();
