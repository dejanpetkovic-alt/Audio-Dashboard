-- Marks how a trend entered the radar. Automated trends still remain drafts.
alter table public.trend_signals add column if not exists origin text not null default 'manual';
alter table public.trend_signals drop constraint if exists trend_signals_origin_check;
alter table public.trend_signals add constraint trend_signals_origin_check check (origin in ('manual', 'automation'));
