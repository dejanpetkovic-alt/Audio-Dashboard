alter table public.cases
  add column region text not null default 'global' check (region in ('dach', 'europe', 'north_america', 'global')),
  add column categories text[] not null default '{}',
  add column subcategory text,
  add column affected_platforms text[] not null default '{}',
  add column publisher_related boolean not null default false,
  add column why_relevant text,
  add column observation_status text not null default 'watch' check (observation_status in ('read', 'watch', 'test', 'share')),
  add column examples_mentioned boolean not null default false,
  add column ai_relevance text not null default 'low' check (ai_relevance in ('low', 'medium', 'high')),
  add column audio_relevance text not null default 'low' check (audio_relevance in ('low', 'medium', 'high')),
  add column video_relevance text not null default 'low' check (video_relevance in ('low', 'medium', 'high'));

create index cases_standard_filters_idx on public.cases (region, publisher_related, observation_status);
