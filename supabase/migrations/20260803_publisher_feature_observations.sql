-- Publicly documented publisher features, separate from trend signals.
create table public.publisher_feature_observations (
  id uuid primary key default gen_random_uuid(),
  publisher_source_id uuid not null references public.sources(id) on delete restrict,
  product_feature_id uuid references public.product_features(id) on delete set null,
  observed_feature text not null,
  platforms text[] not null default '{}',
  status text not null check (status in ('current', 'historical', 'unclear')),
  evidence_url text not null,
  evidence_label text not null,
  observed_at timestamptz not null default now(),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (publisher_source_id, observed_feature, evidence_url)
);

create index publisher_feature_observations_feature_idx on public.publisher_feature_observations (product_feature_id);
alter table public.publisher_feature_observations enable row level security;
grant select, insert, update, delete on public.publisher_feature_observations to service_role;

insert into public.publisher_feature_observations (publisher_source_id, product_feature_id, observed_feature, platforms, status, evidence_url, evidence_label, notes)
select source.id, feature.id, seed.observed_feature, seed.platforms, seed.status, seed.evidence_url, seed.evidence_label, seed.notes
from (values
  ('Artikel vorlesen / Vorlesefunktion', array['Zeitungs-App', 'Digitale Ausgabe', 'E-Paper'], 'current', 'https://hilfe.sueddeutsche.de/sz-zeitungs-app/', 'SZ Zeitungs-App', 'Die Hilfeseite dokumentiert das Anhören von Artikeln und eine Vorlesefunktion der digitalen Ausgabe.', 'Artikelvertonung in den Apps'),
  ('Multimediale E-Paper-App mit Video und Audio-Clips', array['Zeitungs-App', 'E-Paper'], 'current', 'https://hilfe.sueddeutsche.de/digitale-zeitung/', 'Die digitale Süddeutsche Zeitung', 'Die digitale Zeitungs-App nennt Videos und Audio-Clips als interaktive Inhalte.', 'Video-Player im Artikel'),
  ('Podcast-Angebot mit Nachrichten-, Recherche- und Serienformaten', array['Web', 'App'], 'current', 'https://www.sueddeutsche.de/thema/Podcast', 'SZ Podcasts', 'Die Podcast-Seite bündelt zahlreiche freie und kostenpflichtige Formate.', 'Redaktionelle Podcasts'),
  ('Alexa-News und Podcast-Skill', array['Sprachassistent'], 'historical', 'https://www.sueddeutsche.de/service/sprachassistenten-alexa-was-sind-die-nachrichten-1.4331325', 'SZ Alexa-Skill', 'Öffentlich dokumentiert, aber Quelle von 2019; aktueller Verfügbarkeitsstatus nicht bestätigt.', null)
) as seed(observed_feature, platforms, status, evidence_url, evidence_label, notes, product_feature_title)
join public.sources source on source.name = 'Süddeutsche Zeitung (SZ)'
left join public.product_features feature on feature.title = seed.product_feature_title
on conflict (publisher_source_id, observed_feature, evidence_url) do nothing;
