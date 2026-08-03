-- Public source registry for the first import release.
-- Sources without a feed are intentionally retained for manual editorial entry.
insert into public.sources (name, homepage_url, feed_url, access) values
  ('Nieman Lab', 'https://www.niemanlab.org/', 'https://www.niemanlab.org/feed/', 'public'),
  ('Digiday', 'https://digiday.com/', 'https://digiday.com/feed/', 'public'),
  ('INMA', 'https://www.inma.org/', null, 'member_link_only'),
  ('The Audiencers', 'https://theaudiencers.com/', null, 'public'),
  ('WAN-IFRA', 'https://wan-ifra.org/', null, 'public')
on conflict (name) do update set
  homepage_url = excluded.homepage_url,
  feed_url = excluded.feed_url,
  access = excluded.access,
  active = true,
  updated_at = now();
