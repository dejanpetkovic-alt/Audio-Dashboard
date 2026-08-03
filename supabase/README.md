# Supabase migration

1. In Supabase, open **SQL Editor** and create a new query.
2. Copy the complete content of `migrations/20260803_initial_schema.sql` into the query editor.
3. Run the query once. It creates the Media Pulse tables, indices, update triggers, and enables Row Level Security.

The application will access these tables server-side using the Supabase service key; no browser-level RLS policies are added at this stage.

Then run `migrations/20260803_seed_sources.sql` in the SQL Editor to add the initial source registry.

For an already set up project, run `migrations/20260803_add_youtube_source.sql` to add the official YouTube Blog feed. Its entries are automatically assigned to **Video / Andere Branchen** and still land in the review queue first.

If you created the project with **Automatically expose new tables** disabled, also run `migrations/20260803_grant_server_access.sql`. It grants access only to the server-side `service_role`; public browser roles remain blocked.
