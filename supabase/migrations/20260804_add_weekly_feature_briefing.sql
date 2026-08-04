create table public.weekly_feature_reviews (
  id uuid primary key default gen_random_uuid(),
  feature_group_id uuid not null references public.publisher_feature_groups(id) on delete cascade,
  week_start date not null,
  status text not null check (status in ('selected', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (feature_group_id, week_start)
);
create index weekly_feature_reviews_week_idx on public.weekly_feature_reviews (week_start, status);
create trigger weekly_feature_reviews_updated_at before update on public.weekly_feature_reviews for each row execute function public.set_updated_at();
alter table public.weekly_feature_reviews enable row level security;
grant select, insert, update, delete on public.weekly_feature_reviews to service_role;
