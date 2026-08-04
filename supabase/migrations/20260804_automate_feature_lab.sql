create unique index feature_lab_source_reference_unique on public.feature_lab_items (publisher_source_id, reference_url);

-- Seed the backlog from already verified publisher observations.
insert into public.feature_lab_items (
  publisher_source_id, trend_signal_id, publisher_observation_id, product_name, feature_description, reference_url,
  copyability, implementation_effort, visibility, product_value, build_priority, status, rationale, technical_notes
)
select
  observation.publisher_source_id,
  observation.trend_signal_id,
  observation.id,
  observation.observed_feature,
  case when observation.notes <> '' then observation.notes else 'Automatisch aus einer belegten Publisher-Beobachtung übernommen.' end,
  observation.evidence_url,
  'medium',
  'medium',
  case observation.evidence_quality when 'direct' then 'clear' when 'industry_report' then 'partial' else 'unclear' end,
  case when observation.trend_signal_id is not null then 'high' else 'medium' end,
  case observation.evidence_quality when 'direct' then 'now' else 'watch' end,
  'research',
  case observation.evidence_quality when 'direct' then 'Direkt beim Publisher belegt.' when 'industry_report' then 'Von einer Branchenquelle berichtet; Produktseite bei Bedarf gegenprüfen.' else 'Signal vor dem Nachbau verifizieren.' end,
  'Vor dem Nachbau UI-Ablauf, Datenquellen, technische Komponenten und offene Produktannahmen prüfen.'
from public.publisher_feature_observations observation
on conflict (publisher_source_id, reference_url) do nothing;
