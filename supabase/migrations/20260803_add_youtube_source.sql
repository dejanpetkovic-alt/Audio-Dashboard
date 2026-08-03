-- Adds an official public platform source for the "Video / Andere Branchen" area.
-- Safe to run once on an existing Media Pulse project.
insert into public.sources (name, homepage_url, feed_url, access)
values ('YouTube Official Blog', 'https://blog.youtube/', 'https://www.blog.youtube/feed/', 'public')
on conflict (name) do update set
  homepage_url = excluded.homepage_url,
  feed_url = excluded.feed_url,
  access = excluded.access,
  active = true,
  updated_at = now();
