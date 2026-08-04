create table public.publisher_scan_targets (
  id uuid primary key default gen_random_uuid(),
  publisher_source_id uuid not null references public.sources(id) on delete cascade,
  url text not null,
  target_type text not null default 'website' check (target_type in ('website', 'audio_hub', 'video_hub', 'help', 'app_store')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (publisher_source_id, url)
);
create trigger publisher_scan_targets_updated_at before update on public.publisher_scan_targets for each row execute function public.set_updated_at();

create table public.publisher_feature_groups (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null unique,
  title text not null,
  medium text not null check (medium in ('audio', 'video', 'both')),
  description text not null,
  prototype_brief text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger publisher_feature_groups_updated_at before update on public.publisher_feature_groups for each row execute function public.set_updated_at();

create table public.publisher_feature_findings (
  id uuid primary key default gen_random_uuid(),
  feature_group_id uuid not null references public.publisher_feature_groups(id) on delete cascade,
  publisher_source_id uuid not null references public.sources(id) on delete cascade,
  scan_target_id uuid references public.publisher_scan_targets(id) on delete set null,
  evidence_url text not null,
  evidence_label text not null,
  page_excerpt text not null default '',
  platforms text[] not null default '{}',
  region text not null check (region in ('dach', 'europe', 'north_america')),
  evidence_quality text not null check (evidence_quality in ('direct', 'to_verify')),
  technical_signals text[] not null default '{}',
  screenshot_url text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (feature_group_id, publisher_source_id, evidence_url)
);
create index publisher_feature_findings_group_idx on public.publisher_feature_findings (feature_group_id, last_seen_at desc);
create trigger publisher_feature_findings_updated_at before update on public.publisher_feature_findings for each row execute function public.set_updated_at();

alter table public.publisher_scan_targets enable row level security;
alter table public.publisher_feature_groups enable row level security;
alter table public.publisher_feature_findings enable row level security;
grant select, insert, update, delete on public.publisher_scan_targets, public.publisher_feature_groups, public.publisher_feature_findings to service_role;

insert into public.publisher_scan_targets (publisher_source_id, url, target_type)
select watchlist.publisher_source_id, sources.homepage_url, 'website'
from public.publisher_watchlist watchlist join public.sources sources on sources.id = watchlist.publisher_source_id
on conflict (publisher_source_id, url) do nothing;

insert into public.publisher_feature_groups (feature_key, title, medium, description, prototype_brief) values
('article-tts', 'Artikel vorlesen / Text-to-Speech', 'audio', 'Eine Vorlesefunktion macht Artikel als Audio direkt am Lesepunkt verfügbar.', 'Erstelle einen klickbaren Web-Prototyp einer Artikel-Vorlesefunktion. Zeige einen Artikelkopf mit gut sichtbarem „Artikel anhören“-Einstieg, einen kompakten Player mit Abspielstatus, Geschwindigkeit und Fortschritt sowie eine Rückkehr zum Lesetext. Nutze Platzhalterinhalte und kopiere weder Gestaltung noch Inhalte der Referenz.'),
('podcast-hub', 'Podcast- und Audio-Hub', 'audio', 'Ein zentraler Bereich bündelt Podcast- und Audioformate zur Entdeckung und Wiedergabe.', 'Erstelle einen klickbaren Web-Prototyp eines Audio-Hubs für eine Nachrichtenmarke. Enthalten sein sollen Einstieg, Format-Kategorien, Episodenkarten, ein persistenter Mini-Player und eine Detailansicht. Nutze fiktive Marken- und Inhaltsdaten.'),
('article-video', 'Video-Player im redaktionellen Angebot', 'video', 'Video wird als eigenständiges redaktionelles Element in Artikeln oder Themenbereichen angeboten.', 'Erstelle einen klickbaren Web-Prototyp eines Artikel-Video-Moduls. Baue Artikelkontext, Videoplayer-Platzhalter, Titel, Laufzeit, Untertitel-Schalter und Empfehlungen unterhalb des Players. Verwende keine Inhalte oder Gestaltung der Referenz.'),
('vertical-video', 'Vertical-Video-Feed', 'video', 'Vertikale Kurzvideos werden als swipe- oder feedartiges Entdeckungsformat präsentiert.', 'Erstelle einen klickbaren Web-Prototyp eines Vertical-Video-Feeds für eine Nachrichten-App im Web. Zeige ein Vollformat-Video-Layout, Swipe-/Weiter-Navigation, Kontext, Tonsteuerung und eine Aktion zum Öffnen des zugehörigen Artikels. Verwende fiktive Daten.')
on conflict (feature_key) do nothing;

insert into public.publisher_feature_findings (feature_group_id, publisher_source_id, evidence_url, evidence_label, page_excerpt, platforms, region, evidence_quality, technical_signals)
select groups.id, observation.publisher_source_id, observation.evidence_url, observation.evidence_label, observation.notes, observation.platforms, watchlist.region,
case when observation.evidence_quality = 'direct' then 'direct' else 'to_verify' end, array[]::text[]
from public.publisher_feature_observations observation
join public.publisher_watchlist watchlist on watchlist.publisher_source_id = observation.publisher_source_id
join public.publisher_feature_groups groups on groups.feature_key = case
  when lower(observation.observed_feature) like '%vorles%' or lower(observation.observed_feature) like '%text-to-speech%' then 'article-tts'
  when lower(observation.observed_feature) like '%podcast%' or lower(observation.observed_feature) like '%audio%' then 'podcast-hub'
  when lower(observation.observed_feature) like '%video%' then 'article-video'
  else 'podcast-hub' end
on conflict (feature_group_id, publisher_source_id, evidence_url) do nothing;
