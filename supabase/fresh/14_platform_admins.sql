-- EduSmart fresh Supabase schema
-- Platform super administrators
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/platformAdminsData.ts :: PLATFORM_ADMINS (1 rows)
drop table if exists "edusmart"."platform_admins" cascade;
create table "edusmart"."platform_admins" (
  "id" text not null,
  "name" text not null,
  "email" text not null,
  "password" text not null,
  "rights" text[] not null,
  "access_scope" text not null,
  "is_active" boolean not null,
  primary key ("id")
);
comment on table "edusmart"."platform_admins" is $es$Fresh seed from src/data/platformAdminsData.ts export PLATFORM_ADMINS. Nested objects stay JSON. No foreign keys.$es$;
insert into "edusmart"."platform_admins" ("id", "name", "email", "password", "rights", "access_scope", "is_active") values
  ($es$platform-admin-1$es$, $es$Platform Super Admin$es$, $es$admin@edutech.ac.ke$es$, $es$1234$es$, array[$es$super_admin_page$es$]::text[], $es$super_admin_only$es$, true);
alter table "edusmart"."platform_admins" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
