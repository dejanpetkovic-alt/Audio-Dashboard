-- Make every backlog item actionable: ownership, automated technical signals and a reusable implementation brief.
alter table public.feature_lab_items
  add column assignee text not null default '',
  add column detected_tech text[] not null default '{}',
  add column inspection_status text not null default 'pending' check (inspection_status in ('pending', 'scanned', 'unavailable')),
  add column implementation_brief text not null default '';

create index feature_lab_items_assignee_idx on public.feature_lab_items (assignee, status);
