-- Editorial trend layer: trends bundle evidence and are compared to internal features.
create table public.trend_signals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  area text not null check (area in ('audio', 'video', 'both')),
  maturity text not null check (maturity in ('early_signal', 'growing', 'standard')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trend_evidence (
  id uuid primary key default gen_random_uuid(),
  trend_id uuid not null references public.trend_signals(id) on delete cascade,
  source_name text not null,
  title text not null,
  url text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.trend_feature_assessments (
  id uuid primary key default gen_random_uuid(),
  trend_id uuid not null references public.trend_signals(id) on delete cascade,
  product_feature_id uuid not null references public.product_features(id) on delete cascade,
  status text not null check (status in ('covered', 'gap', 'watch', 'pioneer')),
  rationale text not null,
  created_at timestamptz not null default now(),
  unique (trend_id, product_feature_id)
);

create trigger trend_signals_updated_at before update on public.trend_signals
for each row execute function public.set_updated_at();

create index trend_evidence_trend_idx on public.trend_evidence (trend_id);
create index trend_assessments_trend_idx on public.trend_feature_assessments (trend_id);
alter table public.trend_signals enable row level security;
alter table public.trend_evidence enable row level security;
alter table public.trend_feature_assessments enable row level security;
grant select, insert, update, delete on public.trend_signals, public.trend_evidence, public.trend_feature_assessments to service_role;
