-- Remaining sources from the editorial publisher list.
-- Feeds are only assigned where a public RSS endpoint is suitable for the daily importer.
insert into public.sources (name, homepage_url, feed_url, access) values
  ('DER SPIEGEL', 'https://www.spiegel.de/', null, 'public'),
  ('ZEIT ONLINE', 'https://www.zeit.de/', null, 'public'),
  ('Süddeutsche Zeitung (SZ)', 'https://www.sueddeutsche.de/', 'https://rss.sueddeutsche.de/rss/Topthemen', 'public'),
  ('Handelsblatt Media Group', 'https://www.handelsblatt.com/', null, 'public'),
  ('Schweizer Radio und Fernsehen (SRF)', 'https://www.srf.ch/', null, 'public'),
  ('ARD Audiothek', 'https://www.ardaudiothek.de/', null, 'public'),
  ('ORF', 'https://orf.at/', null, 'public'),
  ('kress.de', 'https://kress.de/', null, 'public'),
  ('WAN-IFRA Deutschland', 'https://wan-ifra.org/', null, 'public'),
  ('BBC', 'https://www.bbc.com/', 'https://feeds.bbci.co.uk/news/rss.xml', 'public'),
  ('The Guardian', 'https://www.theguardian.com/', 'https://www.theguardian.com/media/rss', 'public'),
  ('Financial Times', 'https://www.ft.com/', null, 'public'),
  ('Aftenposten', 'https://www.aftenposten.no/', null, 'public'),
  ('Ringier', 'https://www.ringier.com/', null, 'public'),
  ('RTL Europe', 'https://www.rtl.com/', null, 'public'),
  ('Reuters Institute', 'https://reutersinstitute.politics.ox.ac.uk/', null, 'public'),
  ('The New York Times', 'https://www.nytimes.com/', null, 'public'),
  ('The Washington Post', 'https://www.washingtonpost.com/', null, 'public'),
  ('Vox Media', 'https://www.voxmedia.com/', null, 'public'),
  ('NPR', 'https://www.npr.org/', 'https://feeds.npr.org/1001/rss.xml', 'public'),
  ('Bloomberg Media', 'https://www.bloomberg.com/', null, 'public'),
  ('The Wall Street Journal', 'https://www.wsj.com/', null, 'public'),
  ('Axios', 'https://www.axios.com/', null, 'public'),
  ('Poynter', 'https://www.poynter.org/', 'https://www.poynter.org/feed/', 'public')
on conflict (name) do update set
  homepage_url = excluded.homepage_url,
  feed_url = excluded.feed_url,
  access = excluded.access,
  active = true,
  updated_at = now();
