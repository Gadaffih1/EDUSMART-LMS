-- EduSmart fresh Supabase schema
-- Usernames created for finance, curriculum, head teacher, nurse, students, and admin-added roles.
-- The running app stores new rows in local storage. This table is the cloud shape.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

drop table if exists "edusmart"."provisioned_accounts" cascade;
create table "edusmart"."provisioned_accounts" (
  "id" text not null,
  "school_id" text not null,
  "name" text not null,
  "email" text not null,
  "password" text not null,
  "role" text not null,
  "admission_number" text,
  "staff_number" text,
  "phone" text,
  "grade" bigint,
  "stream" text,
  "is_active" boolean not null,
  "created_at" text not null,
  primary key ("id")
);
comment on table "edusmart"."provisioned_accounts" is $es$Username is fname.lname@school domain. Password is the role prefix, @, and the year. Admission and staff numbers end with year/sequence and stay editable.$es$;
create unique index if not exists "provisioned_accounts_email_key" on "edusmart"."provisioned_accounts" ("email");
alter table "edusmart"."provisioned_accounts" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
