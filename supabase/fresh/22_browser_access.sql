-- Lets the browser publishable key read and write schema edusmart.
-- Run this after 01 through 21.
-- In the Supabase dashboard, open Project Settings → Data API and add edusmart
-- to Exposed schemas. The API currently exposes only public and graphql_public.
begin;

grant usage on schema "edusmart" to anon, authenticated;
grant select, insert, update, delete on all tables in schema "edusmart" to anon, authenticated;
grant usage, select on all sequences in schema "edusmart" to anon, authenticated;

do $$
declare
  table_name text;
begin
  for table_name in
    select tablename from pg_tables where schemaname = 'edusmart'
  loop
    execute format('drop policy if exists "browser_access" on "edusmart".%I', table_name);
    execute format(
      'create policy "browser_access" on "edusmart".%I for all to anon, authenticated using (true) with check (true)',
      table_name
    );
  end loop;
end $$;

alter role authenticator set pgrst.db_schemas = 'public, graphql_public, edusmart';
notify pgrst, 'reload config';

commit;
