alter table public.cases
  add column relevance_score integer not null default 3 check (relevance_score between 1 and 5),
  add column priority text not null default 'watch' check (priority in ('review_now', 'watch', 'background')),
  add column signal_type text not null default 'case' check (signal_type in ('product', 'feature', 'trend', 'case', 'analysis', 'report'));

create index cases_daily_briefing_idx on public.cases (status, discovered_at desc, relevance_score desc);
