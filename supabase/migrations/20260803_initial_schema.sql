-- Media Pulse: initial production schema
-- Access is intentionally server-side only. RLS is enabled without browser policies.

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  homepage_url text not null,
  feed_url text,
  access text not null default 'public' check (access in ('public', 'member_link_only')),
  active boolean not null default true,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  canonical_url text not null unique,
  external_id text,
  title text not null,
  excerpt text,
  summary text,
  medium text not null check (medium in ('audio', 'video')),
  sector text not null check (sector in ('publisher', 'other_industry')),
  market text not null check (market in ('dach', 'international')),
  platform text not null check (platform in ('web', 'app', 'web_and_app')),
  format text,
  tags text[] not null default '{}',
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  status text not null default 'review' check (status in ('review', 'published', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  kind text not null check (kind in ('reach', 'engagement', 'watch_time', 'listen_time', 'completion', 'conversion', 'subscriptions', 'revenue', 'production_effort')),
  value_numeric numeric,
  value_text text,
  unit text,
  period text,
  evidence_url text not null,
  evidence_label text not null,
  created_at timestamptz not null default now(),
  check (value_numeric is not null or value_text is not null)
);

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  imported_count integer not null default 0,
  error text
);

create table public.review_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  reviewer text not null,
  decision text not null check (decision in ('approved', 'rejected', 'changes_requested')),
  note text,
  created_at timestamptz not null default now()
);

-- owner_key is reserved for a future browser-local or identity-based personal list.
create table public.user_saved_cases (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  case_id uuid not null references public.cases(id) on delete cascade,
  note text,
  saved_at timestamptz not null default now(),
  unique (owner_key, case_id)
);

create index cases_dashboard_idx on public.cases (status, published_at desc);
create index cases_filters_idx on public.cases (medium, sector, market, platform);
create index metrics_case_idx on public.performance_metrics (case_id);
create index ingestion_runs_source_idx on public.ingestion_runs (source_id, started_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger sources_updated_at before update on public.sources
for each row execute function public.set_updated_at();
create trigger cases_updated_at before update on public.cases
for each row execute function public.set_updated_at();

alter table public.sources enable row level security;
alter table public.cases enable row level security;
alter table public.performance_metrics enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.review_decisions enable row level security;
alter table public.user_saved_cases enable row level security;

-- Server-side Next.js routes use the service role. Browser roles receive no grants.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
