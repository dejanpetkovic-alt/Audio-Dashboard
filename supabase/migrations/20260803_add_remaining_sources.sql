-- Adds the remaining sources from the editorial source list.
-- Only verified, public RSS feeds are enabled for automated import.
-- Sources without a feed remain active in the registry for manual research.
insert into public.sources (name, homepage_url, feed_url, access) values
  ('Press Gazette', 'https://pressgazette.co.uk/', 'https://pressgazette.co.uk/feed/', 'public'),
  ('Podnews', 'https://podnews.net/', 'https://podnews.net/rss', 'public'),
  ('Hot Pod', 'https://hotpodnews.com/', null, 'public'),
  ('Spotify Newsroom', 'https://newsroom.spotify.com/', null, 'public'),
  ('Meta Newsroom', 'https://about.fb.com/news/', null, 'public'),
  ('Horizont', 'https://www.horizont.net/', 'https://www.horizont.net/news/feed/', 'public')
on conflict (name) do update set
  homepage_url = excluded.homepage_url,
  feed_url = excluded.feed_url,
  access = excluded.access,
  active = true,
  updated_at = now();
