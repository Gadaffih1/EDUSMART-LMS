-- EduSmart fresh Supabase schema
-- School login accounts
-- The running app stores new rows in local storage. This table is the cloud shape.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

drop table if exists "edusmart"."school_accounts" cascade;
create table "edusmart"."school_accounts" (
  "id" text not null,
  "school_id" text not null,
  "email" text not null,
  "password" text not null,
  "domain" text not null,
  "created_at" text not null,
  primary key ("id")
);
comment on table "edusmart"."school_accounts" is $es$School portal login. Email is the address the platform admin entered. Password is generated when the school is registered.$es$;
alter table "edusmart"."school_accounts" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
