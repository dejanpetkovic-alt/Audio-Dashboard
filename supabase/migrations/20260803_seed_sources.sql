-- Public source registry for the first import release.
-- Sources without a feed are intentionally retained for manual editorial entry.
insert into public.sources (name, homepage_url, feed_url, access) values
  ('Nieman Lab', 'https://www.niemanlab.org/', 'https://www.niemanlab.org/feed/', 'public'),
  ('Digiday', 'https://digiday.com/', 'https://digiday.com/feed/', 'public'),
  ('Press Gazette', 'https://pressgazette.co.uk/', 'https://pressgazette.co.uk/feed/', 'public'),
  ('Podnews', 'https://podnews.net/', 'https://podnews.net/rss', 'public'),
  ('Hot Pod', 'https://hotpodnews.com/', null, 'public'),
  ('Spotify Newsroom', 'https://newsroom.spotify.com/', null, 'public'),
  ('YouTube Official Blog', 'https://blog.youtube/', 'https://www.blog.youtube/feed/', 'public'),
  ('Meta Newsroom', 'https://about.fb.com/news/', null, 'public'),
  ('Horizont', 'https://www.horizont.net/', 'https://www.horizont.net/news/feed/', 'public'),
  ('The Guardian Engineering', 'https://theguardian.engineering/', 'https://www.theguardian.com/info/series/engineering-blog/rss', 'public'),
  ('The New York Times Open', 'https://open.nytimes.com/', 'https://open.nytimes.com/feed', 'public'),
  ('Google Search Central Blog', 'https://developers.google.com/search/blog', 'https://developers.google.com/search/blog/rss.xml', 'public'),
  ('Netflix TechBlog', 'https://netflixtechblog.com/', 'https://netflixtechblog.com/feed', 'public'),
  ('BBC R&D', 'https://www.bbc.co.uk/rd/', null, 'public'),
  ('Schibsted', 'https://schibsted.com/newsroom/', null, 'public'),
  ('Axel Springer', 'https://www.axelspringer.com/en/', null, 'public'),
  ('Zeitspace', 'https://www.zeitspace.com/blog/', null, 'public'),
  ('INMA', 'https://www.inma.org/', null, 'member_link_only'),
  ('The Audiencers', 'https://theaudiencers.com/', null, 'public'),
  ('WAN-IFRA', 'https://wan-ifra.org/', null, 'public')
on conflict (name) do update set
  homepage_url = excluded.homepage_url,
  feed_url = excluded.feed_url,
  access = excluded.access,
  active = true,
  updated_at = now();
