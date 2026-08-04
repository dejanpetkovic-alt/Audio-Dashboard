create table public.feature_lab_items (
  id uuid primary key default gen_random_uuid(),
  publisher_source_id uuid not null references public.sources(id) on delete restrict,
  trend_signal_id uuid references public.trend_signals(id) on delete set null,
  publisher_observation_id uuid references public.publisher_feature_observations(id) on delete set null,
  product_name text not null,
  feature_description text not null,
  reference_url text not null,
  screenshot_url text,
  copyability text not null check (copyability in ('high', 'medium', 'low')),
  implementation_effort text not null check (implementation_effort in ('low', 'medium', 'high')),
  visibility text not null check (visibility in ('clear', 'partial', 'unclear')),
  product_value text not null check (product_value in ('high', 'medium', 'low')),
  build_priority text not null check (build_priority in ('now', 'watch', 'later')),
  status text not null default 'research' check (status in ('research', 'evaluate', 'build', 'done')),
  rationale text not null default '',
  technical_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feature_lab_items_status_idx on public.feature_lab_items (status, build_priority, created_at desc);
create trigger feature_lab_items_updated_at before update on public.feature_lab_items for each row execute function public.set_updated_at();
alter table public.feature_lab_items enable row level security;
grant select, insert, update, delete on public.feature_lab_items to service_role;
