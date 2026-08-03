-- The project was created with automatic table exposure disabled.
-- Grant the server-side service role access while keeping anon/authenticated blocked.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges for role postgres in schema public
grant select, insert, update, delete on tables to service_role;

alter default privileges for role postgres in schema public
grant usage, select on sequences to service_role;
