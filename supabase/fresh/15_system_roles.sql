-- EduSmart fresh Supabase schema
-- Roles created for school accounts
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/systemRolesData.ts :: SYSTEM_ROLES (20 rows)
drop table if exists "edusmart"."system_roles" cascade;
create table "edusmart"."system_roles" (
  "id" text not null,
  "name" text not null,
  "slug" text not null,
  "password_prefix" text not null,
  "number_kind" text not null,
  "built_in" boolean not null,
  "is_active" boolean not null,
  primary key ("id")
);
comment on table "edusmart"."system_roles" is $es$Platform feature pack from src/data/systemRolesData.ts export SYSTEM_ROLES. Creating a school starts from this pack. The school then customises its own rows.$es$;
insert into "edusmart"."system_roles" ("id", "name", "slug", "password_prefix", "number_kind", "built_in", "is_active") values
  ($es$role-student$es$, $es$Student / Learner$es$, $es$student$es$, $es$st$es$, $es$admission$es$, true, true),
  ($es$role-parent$es$, $es$Parent / Guardian$es$, $es$parent$es$, $es$pa$es$, $es$none$es$, true, true),
  ($es$role-teacher$es$, $es$Subject Teacher$es$, $es$teacher$es$, $es$te$es$, $es$staff$es$, true, true),
  ($es$role-class-teacher$es$, $es$Class Teacher$es$, $es$class_teacher$es$, $es$ct$es$, $es$staff$es$, true, true),
  ($es$role-hod$es$, $es$Head of Department$es$, $es$hod$es$, $es$ho$es$, $es$staff$es$, true, true),
  ($es$role-senior-teacher$es$, $es$Senior Teacher$es$, $es$senior_teacher$es$, $es$sn$es$, $es$staff$es$, true, true),
  ($es$role-deputy-head$es$, $es$Deputy Head Teacher$es$, $es$deputy_head$es$, $es$dh$es$, $es$staff$es$, true, true),
  ($es$role-dean$es$, $es$Dean of Studies$es$, $es$dean_of_studies$es$, $es$ds$es$, $es$staff$es$, true, true),
  ($es$role-curriculum$es$, $es$Curriculum Coordinator$es$, $es$curriculum_coordinator$es$, $es$cc$es$, $es$staff$es$, true, true),
  ($es$role-librarian$es$, $es$Librarian$es$, $es$librarian$es$, $es$li$es$, $es$staff$es$, true, true),
  ($es$role-head-teacher$es$, $es$Head Teacher$es$, $es$head_teacher$es$, $es$ht$es$, $es$staff$es$, true, true),
  ($es$role-school-admin-staff$es$, $es$School Admin Staff$es$, $es$school_admin_staff$es$, $es$sa$es$, $es$staff$es$, true, true),
  ($es$role-nurse$es$, $es$School Nurse$es$, $es$nurse$es$, $es$nu$es$, $es$staff$es$, true, true),
  ($es$role-transport$es$, $es$Transport Team$es$, $es$transport_team$es$, $es$tr$es$, $es$staff$es$, true, true),
  ($es$role-cocurricular$es$, $es$Co-curricular Team$es$, $es$cocurricular_team$es$, $es$co$es$, $es$staff$es$, true, true),
  ($es$role-finance$es$, $es$Finance Officer$es$, $es$finance_officer$es$, $es$fi$es$, $es$staff$es$, true, true),
  ($es$role-procurement$es$, $es$Procurement Officer$es$, $es$procurement_officer$es$, $es$pr$es$, $es$staff$es$, true, true),
  ($es$role-storekeeper$es$, $es$Storekeeper$es$, $es$storekeeper$es$, $es$sk$es$, $es$staff$es$, true, true),
  ($es$role-hr$es$, $es$HR Manager$es$, $es$hr_manager$es$, $es$hr$es$, $es$staff$es$, true, true),
  ($es$role-admin$es$, $es$School Administrator$es$, $es$admin$es$, $es$ad$es$, $es$staff$es$, true, true);
create unique index if not exists "system_roles_slug_key" on "edusmart"."system_roles" ("slug");
create unique index if not exists "system_roles_password_prefix_key" on "edusmart"."system_roles" ("password_prefix");
comment on column "edusmart"."system_roles"."built_in" is $es$False when the platform admin adds the role in Manage Roles. Those roles are new rows in this same table.$es$;
alter table "edusmart"."system_roles" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
