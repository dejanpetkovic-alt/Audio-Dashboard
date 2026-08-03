-- Trend signals are informational output, not an approval workflow.
update public.trend_signals set status = 'published' where status = 'draft';
alter table public.trend_signals alter column status set default 'published';
