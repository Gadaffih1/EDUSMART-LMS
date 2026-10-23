-- EduSmart fresh Supabase schema
-- Timetable rules and facilities
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/timetableData.ts :: INITIAL_FIXED_LESSON_CONDITIONS (5 rows)
drop table if exists "edusmart"."fixed_lesson_conditions" cascade;
create table "edusmart"."fixed_lesson_conditions" (
  "id" text not null,
  "title" text not null,
  "subject" text not null,
  "day_of_week" text not null,
  "period" bigint not null,
  "grades" bigint[] not null,
  "streams" text not null,
  "room_name" text not null,
  "teacher_name" text not null,
  "notes" text not null,
  "is_active" boolean not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."fixed_lesson_conditions" is $es$School data from src/data/timetableData.ts export INITIAL_FIXED_LESSON_CONDITIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."fixed_lesson_conditions" ("id", "title", "subject", "day_of_week", "period", "grades", "streams", "room_name", "teacher_name", "notes", "is_active", "school_id") values
  ($es$fix-assembly-mon$es$, $es$School-Wide Morning Assembly & Pastoral Devotion$es$, $es$Pastoral Care & Assembly$es$, $es$Monday$es$, 1, array[1, 2, 3, 4, 5, 6, 7, 8, 9]::bigint[], $es$all$es$, $es$Main Assembly Quadrangle$es$, $es$Dr. Arthur Mwangi (Head Teacher)$es$, $es$Mandatory school assembly, national anthem, scriptural devotion, executive briefing, and student body address.$es$, true, $es$tenant-riara$es$),
  ($es$fix-games-fri$es$, $es$Co-Curricular Sports, Physical Training & Clubs$es$, $es$Physical Education & Sports$es$, $es$Friday$es$, 8, array[1, 2, 3, 4, 5, 6, 7, 8, 9]::bigint[], $es$all$es$, $es$Main Sports Pitch & Athletics Track$es$, $es$Mr. Peter Ochieng (Sports Director)$es$, $es$School-wide athletics, football, volleyball, netball drills, debate societies, and scouting parade.$es$, true, $es$tenant-riara$es$),
  ($es$fix-remedial-wed$es$, $es$Remedial Mentorship & Library Study Hour$es$, $es$Remedial & Library Study$es$, $es$Wednesday$es$, 7, array[4, 5, 6, 7, 8, 9]::bigint[], $es$all$es$, $es$Library & Media Resource Center$es$, $es$Mrs. Esther Kamau (Librarian)$es$, $es$Formative assessment remediation, research literature consultation, and personalized teacher guidance.$es$, true, $es$tenant-riara$es$),
  ($es$fix-stem-lab-thu$es$, $es$Junior School STEM & Science Practical Block$es$, $es$Integrated Science$es$, $es$Thursday$es$, 4, array[7, 8, 9]::bigint[], $es$all$es$, $es$Junior Science Lab 1$es$, $es$Dr. Mercy Mwangi (HOD Sciences)$es$, $es$Laboratory safety, scientific titration experiments, biology microscope slides, and physics mechanics.$es$, true, $es$tenant-riara$es$),
  ($es$fix-creative-arts-tue$es$, $es$Creative Arts, Music & Cultural Rehearsal$es$, $es$Creative Arts & Sports$es$, $es$Tuesday$es$, 6, array[7, 8, 9]::bigint[], $es$all$es$, $es$Fine Art & Music Studio$es$, $es$Mr. Peter Mutua$es$, $es$Practical fine art drawing, Kenyan musical instrument practice, and folk choral verse rehearsals.$es$, true, $es$tenant-riara$es$);
create index "fixed_lesson_conditions_school_id_idx" on "edusmart"."fixed_lesson_conditions" ("school_id");
alter table "edusmart"."fixed_lesson_conditions" enable row level security;

-- src/data/timetableData.ts :: INITIAL_SHARED_FACILITIES (9 rows)
drop table if exists "edusmart"."shared_facilities" cascade;
create table "edusmart"."shared_facilities" (
  "id" text not null,
  "name" text not null,
  "type" text not null,
  "capacity" bigint not null,
  "suitable_subjects" text[] not null,
  "location" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."shared_facilities" is $es$School data from src/data/timetableData.ts export INITIAL_SHARED_FACILITIES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."shared_facilities" ("id", "name", "type", "capacity", "suitable_subjects", "location", "school_id") values
  ($es$fac-science-lab-1$es$, $es$Junior Science Lab 1$es$, $es$science_lab$es$, 40, array[$es$Integrated Science$es$, $es$Health Education$es$]::text[], $es$Science Wing Room 101$es$, $es$tenant-riara$es$),
  ($es$fac-science-lab-2$es$, $es$Junior Science Lab 2$es$, $es$science_lab$es$, 40, array[$es$Integrated Science$es$, $es$Agriculture and Nutrition$es$]::text[], $es$Science Wing Room 102$es$, $es$tenant-riara$es$),
  ($es$fac-comp-lab-a$es$, $es$Computer Lab A$es$, $es$computer_lab$es$, 45, array[$es$Pretechnical Education$es$, $es$Mathematics$es$]::text[], $es$Technology Block Floor 2$es$, $es$tenant-riara$es$),
  ($es$fac-comp-lab-b$es$, $es$Computer Lab B$es$, $es$computer_lab$es$, 40, array[$es$Pretechnical Education$es$, $es$English$es$]::text[], $es$Technology Block Floor 2$es$, $es$tenant-riara$es$),
  ($es$fac-art-studio$es$, $es$Fine Art & Music Studio$es$, $es$art_studio$es$, 35, array[$es$Creative Arts$es$, $es$Creative Arts & Sports$es$]::text[], $es$Creative Arts Center$es$, $es$tenant-riara$es$),
  ($es$fac-agri-plot$es$, $es$Agricultural Demonstration Plot$es$, $es$agri_plot$es$, 50, array[$es$Agriculture and Nutrition$es$, $es$Pretechnical Education$es$]::text[], $es$Campus East Farm Quad$es$, $es$tenant-riara$es$),
  ($es$fac-sports-pitch$es$, $es$Main Sports Pitch$es$, $es$sports_field$es$, 100, array[$es$Physical Education$es$, $es$Physical Education & Sports$es$, $es$Creative Arts & Sports$es$]::text[], $es$Central Athletics Field$es$, $es$tenant-riara$es$),
  ($es$fac-workshop$es$, $es$Pre-Technical & Home Science Workshop$es$, $es$workshop$es$, 35, array[$es$Pretechnical Education$es$, $es$Agriculture and Nutrition$es$]::text[], $es$Vocational Block$es$, $es$tenant-riara$es$),
  ($es$fac-library$es$, $es$Library & Media Resource Center$es$, $es$library$es$, 60, array[$es$English$es$, $es$Kiswahili$es$, $es$Remedial & Library Study$es$, $es$Social Studies$es$]::text[], $es$Main Academic Building Ground Floor$es$, $es$tenant-riara$es$);
create index "shared_facilities_school_id_idx" on "edusmart"."shared_facilities" ("school_id");
alter table "edusmart"."shared_facilities" enable row level security;

-- src/data/timetableData.ts :: PRIMARY_CURRICULUM_DEMAND (9 rows)
drop table if exists "edusmart"."primary_curriculum_demand" cascade;
create table "edusmart"."primary_curriculum_demand" (
  "subject" text not null,
  "periods_per_week" bigint not null,
  "requires_specialist_facility" boolean,
  "preferred_facility_type" text,
  primary key ("subject")
);
comment on table "edusmart"."primary_curriculum_demand" is $es$Platform feature pack from src/data/timetableData.ts export PRIMARY_CURRICULUM_DEMAND. Creating a school starts from this pack. The school then customises its own rows.$es$;
insert into "edusmart"."primary_curriculum_demand" ("subject", "periods_per_week", "requires_specialist_facility", "preferred_facility_type") values
  ($es$Mathematics$es$, 5, null, null),
  ($es$English$es$, 5, null, null),
  ($es$Kiswahili$es$, 4, null, null),
  ($es$Integrated Science$es$, 4, true, $es$science_lab$es$),
  ($es$Social Studies$es$, 3, null, null),
  ($es$Religious Education$es$, 3, null, null),
  ($es$Creative Arts$es$, 4, true, $es$art_studio$es$),
  ($es$Agriculture and Nutrition$es$, 4, true, $es$agri_plot$es$),
  ($es$Physical and Health Education$es$, 4, true, $es$sports_field$es$);
alter table "edusmart"."primary_curriculum_demand" enable row level security;

-- src/data/timetableData.ts :: JUNIOR_CURRICULUM_DEMAND (10 rows)
drop table if exists "edusmart"."junior_curriculum_demand" cascade;
create table "edusmart"."junior_curriculum_demand" (
  "subject" text not null,
  "periods_per_week" bigint not null,
  "requires_specialist_facility" boolean,
  "preferred_facility_type" text,
  primary key ("subject")
);
comment on table "edusmart"."junior_curriculum_demand" is $es$Platform feature pack from src/data/timetableData.ts export JUNIOR_CURRICULUM_DEMAND. Creating a school starts from this pack. The school then customises its own rows.$es$;
insert into "edusmart"."junior_curriculum_demand" ("subject", "periods_per_week", "requires_specialist_facility", "preferred_facility_type") values
  ($es$Mathematics$es$, 5, null, null),
  ($es$English$es$, 5, null, null),
  ($es$Kiswahili$es$, 4, null, null),
  ($es$Integrated Science$es$, 5, true, $es$science_lab$es$),
  ($es$Social Studies$es$, 3, null, null),
  ($es$Religious Education$es$, 3, null, null),
  ($es$Pretechnical Education$es$, 4, true, $es$computer_lab$es$),
  ($es$Agriculture and Nutrition$es$, 4, true, $es$agri_plot$es$),
  ($es$Creative Arts$es$, 4, true, $es$art_studio$es$),
  ($es$Physical and Health Education$es$, 3, true, $es$sports_field$es$);
alter table "edusmart"."junior_curriculum_demand" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
