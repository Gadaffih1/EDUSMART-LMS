-- EduSmart fresh Supabase schema
-- Activities a non-teaching department can assign, including driver work.
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/activityCatalogData.ts :: ACTIVITY_CATALOG (12 rows)
drop table if exists "edusmart"."activity_catalog" cascade;
create table "edusmart"."activity_catalog" (
  "id" text not null,
  "name" text not null,
  primary key ("id")
);
comment on table "edusmart"."activity_catalog" is $es$Platform activity pack, including driver work. A non-teaching department at a school chooses from this list, then stores the choice on that school.$es$;
insert into "edusmart"."activity_catalog" ("id", "name") values
  ($es$activity-route-driving$es$, $es$Route driving$es$),
  ($es$activity-student-boarding-and-alighting$es$, $es$Student boarding and alighting$es$),
  ($es$activity-vehicle-inspection$es$, $es$Vehicle inspection$es$),
  ($es$activity-fleet-fuel-and-logbook$es$, $es$Fleet fuel and logbook$es$),
  ($es$activity-gate-duty$es$, $es$Gate duty$es$),
  ($es$activity-clinic-reception$es$, $es$Clinic reception$es$),
  ($es$activity-lunch-service$es$, $es$Lunch service$es$),
  ($es$activity-stores-issue$es$, $es$Stores issue$es$),
  ($es$activity-fee-collection$es$, $es$Fee collection$es$),
  ($es$activity-grounds-and-maintenance$es$, $es$Grounds and maintenance$es$),
  ($es$activity-security-patrol$es$, $es$Security patrol$es$),
  ($es$activity-hostel-supervision$es$, $es$Hostel supervision$es$);
alter table "edusmart"."activity_catalog" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
