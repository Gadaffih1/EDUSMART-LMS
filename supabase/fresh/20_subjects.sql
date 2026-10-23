-- EduSmart fresh Supabase schema
-- Curriculum subjects a teaching department can deal with.
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/subjectCatalogData.ts :: SUBJECT_CATALOG (14 rows)
drop table if exists "edusmart"."subject_catalog" cascade;
create table "edusmart"."subject_catalog" (
  "id" text not null,
  "name" text not null,
  primary key ("id")
);
comment on table "edusmart"."subject_catalog" is $es$Platform subject pack. A teaching department at a school chooses from this list, then stores the choice on that school.$es$;
insert into "edusmart"."subject_catalog" ("id", "name") values
  ($es$subject-mathematics$es$, $es$Mathematics$es$),
  ($es$subject-english$es$, $es$English$es$),
  ($es$subject-kiswahili$es$, $es$Kiswahili$es$),
  ($es$subject-integrated-science$es$, $es$Integrated Science$es$),
  ($es$subject-computer-studies$es$, $es$Computer Studies$es$),
  ($es$subject-agriculture-and-nutrition$es$, $es$Agriculture and Nutrition$es$),
  ($es$subject-social-studies$es$, $es$Social Studies$es$),
  ($es$subject-religious-education$es$, $es$Religious Education$es$),
  ($es$subject-creative-arts$es$, $es$Creative Arts$es$),
  ($es$subject-physical-and-health-education$es$, $es$Physical and Health Education$es$),
  ($es$subject-agriculture$es$, $es$Agriculture$es$),
  ($es$subject-pretechnical-education$es$, $es$Pretechnical Education$es$),
  ($es$subject-pre-technical-studies$es$, $es$Pre-Technical Studies$es$),
  ($es$subject-business-studies$es$, $es$Business Studies$es$);
alter table "edusmart"."subject_catalog" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
