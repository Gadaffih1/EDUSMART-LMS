-- ===========================================================================
-- EduSmart LMS — Supabase bootstrap (migration 0001)
-- Run this ONCE in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste this file → Run
--   (or: supabase db push, if you use the Supabase CLI)
--
-- Design: one generic row store, `app_records`, holds every LMS collection.
--   collection = the localStorage key that used to own the data (e.g.
--   'edusmart_users_v1'), record_id = the entity id inside that collection,
--   payload = the full JSON object for that record.
--
-- This keeps the ~110 collections in syncable form without hand-writing 110
-- schemas, while still giving per-record RLS, updated_at timestamps (used as
-- the incremental pull cursor) and realtime change events.
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. The row store
-- ---------------------------------------------------------x`z------------------
create table if not exists public.app_records (
  collection   text        not null,
  record_id    text        not null,
  payload      jsonb,
  tenant_id    text        not null default 'global',  -- school tenant metadata (RLS-ready)
  deleted      boolean     not null default false,      -- tombstone: replicates deletions
  revision     bigint      not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (collection, record_id)
);

comment on table public.app_records is
  'EduSmart hybrid sync store: one row per record of a localStorage collection.';

-- Incremental pulls read `where updated_at >= <cursor>`.
create index if not exists app_records_collection_cursor_idx
  on public.app_records (collection, updated_at);
create index if not exists app_records_updated_at_idx
  on public.app_records (updated_at desc);
create index if not exists app_records_tenant_idx
  on public.app_records (tenant_id);
-- Ad-hoc queries / reporting straight into the JSON payloads.
create index if not exists app_records_payload_gin_idx
  on public.app_records using gin (payload jsonb_path_ops);

-- ---------------------------------------------------------------------------
-- 2. Server-owned timestamps & revision counter
--    The browser never controls updated_at: it is assigned by Postgres so the
--    pull cursor and last-write-wins merge use one consistent clock.
-- ---------------------------------------------------------------------------
create or replace function public.app_records_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  new.revision   := old.revision + 1;
  return new;
end;
$$;

drop trigger if exists app_records_touch_trg on public.app_records;
create trigger app_records_touch_trg
  before update on public.app_records
  for each row execute function public.app_records_touch();

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
--    The app currently has no Supabase Auth session (login is app-side), so
--    these policies are intentionally permissive *for now* — the same trust
--    level as today's pure-localStorage build, but with RLS switched on so
--    tightening is a policy edit, not a schema change.
--
--    TO DO when real auth lands:
--      * enable supabase/auth, sign users in, and derive tenant_id from the JWT
--      * replace `using (true)` with e.g.
--          using (
--             tenant_id = coalesce(
--               auth.jwt() -> 'app_metadata' ->> 'tenant_id', 'global')
--          )
-- ---------------------------------------------------------------------------
alter table public.app_records enable row level security;

drop policy if exists "app_records_select" on public.app_records;
create policy "app_records_select"
  on public.app_records for select
  to anon, authenticated
  using (true);

drop policy if exists "app_records_insert" on public.app_records;
create policy "app_records_insert"
  on public.app_records for insert
  to anon, authenticated
  with check (true);

drop policy if exists "app_records_update" on public.app_records;
create policy "app_records_update"
  on public.app_records for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "app_records_delete" on public.app_records;
create policy "app_records_delete"
  on public.app_records for delete
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 4. Realtime — the app subscribes to changes so two open devices converge
--    without a refresh.
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.app_records;
exception
  when duplicate_object then null;   -- already part of the publication
  when undefined_object  then null;  -- publication does not exist (CLI-managed)
end $$;

-- ---------------------------------------------------------------------------
-- 5. Convenience view: one row per collection with counts (useful for audits)
-- ---------------------------------------------------------------------------
create or replace view public.app_collection_stats
with (security_invoker = true) as
select
  collection,
  tenant_id,
  count(*)                                        as record_count,
  count(*) filter (where deleted)                 as deleted_count,
  max(updated_at)                                 as last_change
from public.app_records
group by collection, tenant_id;
