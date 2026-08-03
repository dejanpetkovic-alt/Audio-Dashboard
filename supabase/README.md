# Supabase migration

1. In Supabase, open **SQL Editor** and create a new query.
2. Copy the complete content of `migrations/20260803_initial_schema.sql` into the query editor.
3. Run the query once. It creates the Media Pulse tables, indices, update triggers, and enables Row Level Security.

The application will access these tables server-side using the Supabase service key; no browser-level RLS policies are added at this stage.

Then run `migrations/20260803_seed_sources.sql` in the SQL Editor to add the initial source registry.

For an already set up project, run `migrations/20260803_add_youtube_source.sql` to add the official YouTube Blog feed. Its entries are automatically assigned to **Video / Andere Branchen** and still land in the review queue first.

Then run `migrations/20260803_add_remaining_sources.sql` to add Press Gazette, Podnews, Hot Pod, Spotify Newsroom, Meta Newsroom and Horizont. Press Gazette, Podnews and Horizont use public RSS feeds; the other sources are kept active for manual editorial research.

Run `migrations/20260803_product_features.sql` to add the internal audio/video product inventory. It creates the baseline for the later trend and industry benchmark.

Run `migrations/20260803_trend_radar.sql` after the product-feature migration to add the editorial Trend-Radar, including evidence links and the feature comparison model.

Run `migrations/20260803_trend_automation.sql` to enable the automated rule-based trend signals created after every successful source import.

Run `migrations/20260803_trend_radar_direct_output.sql` to show automated trend signals directly, without a separate trend approval step.

Run `migrations/20260803_add_product_innovation_sources.sql` to add product and innovation sources. The Guardian Engineering, The New York Times Open, Google Search Central Blog and Netflix TechBlog are imported via RSS; BBC R&D, Schibsted, Axel Springer and Zeitspace are kept as manual editorial sources.

If you created the project with **Automatically expose new tables** disabled, also run `migrations/20260803_grant_server_access.sql`. It grants access only to the server-side `service_role`; public browser roles remain blocked.
