-- EduSmart generic record store schema.
-- Apply the authenticated policies from ../migrations/0002_authenticated_app_records.sql
-- after this schema and before importing seed records.

create extension if not exists pgcrypto;

create table if not exists public.app_records (
  collection text not null,
  record_id text not null,
  payload jsonb,
  tenant_id text not null default 'global',
  deleted boolean not null default false,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, collection, record_id)
);

create index if not exists app_records_collection_cursor_idx
  on public.app_records (collection, updated_at);
create index if not exists app_records_updated_at_idx
  on public.app_records (updated_at desc);
create index if not exists app_records_tenant_idx
  on public.app_records (tenant_id);
create index if not exists app_records_payload_gin_idx
  on public.app_records using gin (payload jsonb_path_ops);

create or replace function public.app_records_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  new.revision := old.revision + 1;
  return new;
end;
$$;

drop trigger if exists app_records_touch_trg on public.app_records;
create trigger app_records_touch_trg
  before update on public.app_records
  for each row execute function public.app_records_touch();

alter table public.app_records enable row level security;
