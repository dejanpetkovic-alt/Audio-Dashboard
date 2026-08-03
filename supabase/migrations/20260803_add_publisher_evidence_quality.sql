-- Makes the provenance and confidence of every publisher observation explicit.
alter table public.publisher_feature_observations
  add column evidence_quality text not null default 'direct' check (evidence_quality in ('direct', 'industry_report', 'to_verify')),
  add column trend_signal_id uuid references public.trend_signals(id) on delete set null;

create index publisher_feature_observations_trend_idx on public.publisher_feature_observations (trend_signal_id);
