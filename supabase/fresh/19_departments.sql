-- EduSmart fresh Supabase schema
-- School departments. Teaching departments keep subjects. Non-teaching departments keep activities.
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/departmentsData.ts :: SCHOOL_DEPARTMENTS (7 rows)
drop table if exists "edusmart"."school_departments" cascade;
create table "edusmart"."school_departments" (
  "id" text not null,
  "school_id" text not null,
  "name" text not null,
  "kind" text not null,
  "subjects" text[] not null,
  "activities" text[] not null,
  "created_at" text not null,
  primary key ("id")
);
comment on table "edusmart"."school_departments" is $es$A school department. Teaching departments keep that school’s subjects. Non-teaching departments keep that school’s activities.$es$;
insert into "edusmart"."school_departments" ("id", "school_id", "name", "kind", "subjects", "activities", "created_at") values
  ($es$dept-tenant-riara-1$es$, $es$tenant-riara$es$, $es$Mathematics & Computational Sciences$es$, $es$teaching$es$, array[$es$Mathematics$es$, $es$Computer Studies$es$]::text[], array[]::text[], $es$2026-01-08T08:30:00.000Z$es$),
  ($es$dept-tenant-riara-2$es$, $es$tenant-riara$es$, $es$Pure & Integrated Sciences$es$, $es$teaching$es$, array[$es$Integrated Science$es$, $es$Agriculture and Nutrition$es$, $es$Agriculture$es$]::text[], array[]::text[], $es$2026-01-08T08:30:00.000Z$es$),
  ($es$dept-tenant-riara-3$es$, $es$tenant-riara$es$, $es$Technical & Applied Sciences$es$, $es$teaching$es$, array[$es$Pretechnical Education$es$, $es$Pre-Technical Studies$es$, $es$Business Studies$es$]::text[], array[]::text[], $es$2026-01-08T08:30:00.000Z$es$),
  ($es$dept-tenant-riara-4$es$, $es$tenant-riara$es$, $es$Languages & Literature$es$, $es$teaching$es$, array[$es$English$es$, $es$Kiswahili$es$]::text[], array[]::text[], $es$2026-01-08T08:30:00.000Z$es$),
  ($es$dept-tenant-riara-5$es$, $es$tenant-riara$es$, $es$Pretechnical & Creative Arts$es$, $es$teaching$es$, array[$es$Creative Arts$es$, $es$Pretechnical Education$es$, $es$Physical and Health Education$es$]::text[], array[]::text[], $es$2026-01-08T08:30:00.000Z$es$),
  ($es$dept-tenant-riara-6$es$, $es$tenant-riara$es$, $es$Humanities & Social Sciences$es$, $es$teaching$es$, array[$es$Social Studies$es$, $es$Religious Education$es$]::text[], array[]::text[], $es$2026-01-08T08:30:00.000Z$es$),
  ($es$dept-tenant-riara-transport$es$, $es$tenant-riara$es$, $es$Transport & Fleet$es$, $es$non_teaching$es$, array[]::text[], array[$es$Route driving$es$, $es$Student boarding and alighting$es$, $es$Vehicle inspection$es$, $es$Fleet fuel and logbook$es$]::text[], $es$2026-01-08T08:30:00.000Z$es$);
create index "school_departments_school_id_idx" on "edusmart"."school_departments" ("school_id");
alter table "edusmart"."school_departments" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
