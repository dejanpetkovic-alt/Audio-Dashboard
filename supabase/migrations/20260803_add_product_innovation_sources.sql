-- Product, innovation and publisher sources for concrete implementation signals.
-- Only verified public feeds are imported automatically; the remaining sources
-- are retained for manual editorial research.
insert into public.sources (name, homepage_url, feed_url, access) values
  ('The Guardian Engineering', 'https://theguardian.engineering/', 'https://www.theguardian.com/info/series/engineering-blog/rss', 'public'),
  ('The New York Times Open', 'https://open.nytimes.com/', 'https://open.nytimes.com/feed', 'public'),
  ('Google Search Central Blog', 'https://developers.google.com/search/blog', 'https://developers.google.com/search/blog/rss.xml', 'public'),
  ('Netflix TechBlog', 'https://netflixtechblog.com/', 'https://netflixtechblog.com/feed', 'public'),
  ('BBC R&D', 'https://www.bbc.co.uk/rd/', null, 'public'),
  ('Schibsted', 'https://schibsted.com/newsroom/', null, 'public'),
  ('Axel Springer', 'https://www.axelspringer.com/en/', null, 'public'),
  ('Zeitspace', 'https://www.zeitspace.com/blog/', null, 'public')
on conflict (name) do update set
  homepage_url = excluded.homepage_url,
  feed_url = excluded.feed_url,
  access = excluded.access,
  active = true,
  updated_at = now();
