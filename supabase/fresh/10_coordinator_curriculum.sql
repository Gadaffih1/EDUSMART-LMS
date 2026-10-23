-- EduSmart fresh Supabase schema
-- Coordinator curriculum
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/coordinatorCurriculumData.ts :: INITIAL_COORDINATOR_SYLLABUS_TRACKING (6 rows)
drop table if exists "edusmart"."coordinator_syllabus_tracking" cascade;
create table "edusmart"."coordinator_syllabus_tracking" (
  "id" text not null,
  "grade" bigint not null,
  "subject" text not null,
  "strand" text not null,
  "sub_strand" text not null,
  "expected_week" bigint not null,
  "completed_week" bigint not null,
  "status" text not null,
  "lead_teacher" text not null,
  "competency_target" text not null,
  "coordinator_remarks" text not null,
  "comments" jsonb,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."coordinator_syllabus_tracking" is $es$School data from src/data/coordinatorCurriculumData.ts export INITIAL_COORDINATOR_SYLLABUS_TRACKING. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."coordinator_syllabus_tracking" ("id", "grade", "subject", "strand", "sub_strand", "expected_week", "completed_week", "status", "lead_teacher", "competency_target", "coordinator_remarks", "comments", "school_id") values
  ($es$syl-01$es$, 4, $es$Mathematics$es$, $es$Numbers & Operations$es$, $es$Fractions & Equivalent Quantities$es$, 7, 7, $es$on_schedule$es$, $es$Ms. Sarah Mwangi$es$, $es$Critical thinking in splitting concrete objects into fractional units$es$, $es$Instructional pace strictly aligned with Term 2 KICD syllabus standards.$es$, $es$[{"id":"comm-syl-1","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"Teacher manipulative kits utilized effectively during Tuesday observation.","createdAt":"2026-10-06T10:00:00Z"}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$syl-02$es$, 4, $es$Integrated Science$es$, $es$Living Things & Ecosystems$es$, $es$Plant Nutrition & Water Transport$es$, 7, 6, $es$lagging$es$, $es$Mr. David Omondi$es$, $es$Practical experiment setup with food dye and celery stalks$es$, $es$Lagging by 1 week due to missed double period during sports gala.$es$, $es$[{"id":"comm-syl-2","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"Catch-up remedial practical scheduled for Friday 2:00 PM.","createdAt":"2026-10-07T14:20:00Z"}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$syl-03$es$, 7, $es$Computer Studies$es$, $es$Computational Thinking$es$, $es$Scratch Algorithms & Loop Iterations$es$, 7, 8, $es$ahead$es$, $es$Mr. John Kamau$es$, $es$Sprite broadcast messaging and variable scorekeeper counters$es$, $es$Ahead of target schedule due to active lunchtime coding lab attendance.$es$, $es$[{"id":"comm-syl-3","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"Exemplary integration with student streak badges and bonus point challenges.","createdAt":"2026-10-08T09:15:00Z"}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$syl-04$es$, 8, $es$Pretechnical Education$es$, $es$Materials & Production$es$, $es$Safety in Mechanical Workshop$es$, 7, 7, $es$on_schedule$es$, $es$Mrs. Grace Njeri$es$, $es$Standard PPE protocol and hazardous material storage$es$, $es$Workshop floor hazard signs completed and verified.$es$, null, $es$tenant-riara$es$),
  ($es$syl-05$es$, 5, $es$Creative Arts$es$, $es$Visual Arts & Craft$es$, $es$Weaving & Pattern Construction$es$, 7, 5, $es$lagging$es$, $es$Mr. Patrick Mutiso$es$, $es$Local fibre collection and geometric loom design$es$, $es$2-week lag; banana fiber drying took longer than anticipated.$es$, $es$[{"id":"comm-syl-4","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"Teacher advised to utilize pre-treated synthetic twines for group demonstrations.","createdAt":"2026-10-09T08:30:00Z"}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$syl-06$es$, 6, $es$Social Studies$es$, $es$Resources & Economic Activities$es$, $es$Dairy Farming in Eastern Africa$es$, 7, 7, $es$on_schedule$es$, $es$Mrs. Janet Otieno$es$, $es$Map interpretation and cooperative society benefits$es$, $es$Field excursion notes integrated into learner portfolios.$es$, null, $es$tenant-riara$es$);
create index "coordinator_syllabus_tracking_school_id_idx" on "edusmart"."coordinator_syllabus_tracking" ("school_id");
alter table "edusmart"."coordinator_syllabus_tracking" enable row level security;

-- src/data/coordinatorCurriculumData.ts :: INITIAL_COORDINATOR_SCHEMES_OF_WORK (5 rows)
drop table if exists "edusmart"."coordinator_schemes_of_work" cascade;
create table "edusmart"."coordinator_schemes_of_work" (
  "id" text not null,
  "teacher" text not null,
  "grade" bigint not null,
  "subject" text not null,
  "term" bigint not null,
  "academic_year" bigint not null,
  "submitted_date" text not null,
  "status" text not null,
  "feedback" text not null,
  "reviewed_by" text not null,
  "created_at" text not null,
  "comments" jsonb,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."coordinator_schemes_of_work" is $es$School data from src/data/coordinatorCurriculumData.ts export INITIAL_COORDINATOR_SCHEMES_OF_WORK. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."coordinator_schemes_of_work" ("id", "teacher", "grade", "subject", "term", "academic_year", "submitted_date", "status", "feedback", "reviewed_by", "created_at", "comments", "school_id") values
  ($es$sch-01$es$, $es$Ms. Sarah Mwangi$es$, 4, $es$Mathematics$es$, 2, 2026, $es$2026-10-02$es$, $es$approved$es$, $es$Excellent alignment with CBC inquiry questions and learner rubrics.$es$, $es$Mrs. Beatrice Omari$es$, $es$2026-10-02T08:00:00Z$es$, $es$[{"id":"sch-comm-1","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"Inquiry questions in Week 6 and 7 provide great formative assessment opportunities.","createdAt":"2026-10-02T11:00:00Z"}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$sch-02$es$, $es$Mr. David Omondi$es$, 4, $es$Integrated Science$es$, 2, 2026, $es$2026-10-04$es$, $es$pending_revision$es$, $es$Please incorporate the Virtual Science Lab experiment on Acids & Bases into Week 8.$es$, $es$Mrs. Beatrice Omari$es$, $es$2026-10-04T09:30:00Z$es$, $es$[{"id":"sch-comm-2","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"Awaiting revised lesson step notes with laboratory safety goggles requirement.","createdAt":"2026-10-05T08:45:00Z"}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$sch-03$es$, $es$Mr. John Kamau$es$, 7, $es$Computer Studies$es$, 2, 2026, $es$2026-10-05$es$, $es$approved$es$, $es$Great use of Computer Lab Challenge Library for Grade 7 coding sessions.$es$, $es$Mrs. Beatrice Omari$es$, $es$2026-10-05T14:00:00Z$es$, null, $es$tenant-riara$es$),
  ($es$sch-04$es$, $es$Mrs. Grace Njeri$es$, 8, $es$Pretechnical Education$es$, 2, 2026, $es$2026-10-06$es$, $es$approved$es$, $es$Comprehensive workshop risk mitigation guidelines and tool maintenance checklist included.$es$, $es$Mrs. Beatrice Omari$es$, $es$2026-10-06T10:15:00Z$es$, null, $es$tenant-riara$es$),
  ($es$sch-05$es$, $es$Mr. Patrick Mutiso$es$, 5, $es$Creative Arts$es$, 2, 2026, $es$2026-10-07$es$, $es$remediation_planned$es$, $es$Requires condensed timeline for indigenous weaving to prevent Term 2 syllabus backlog.$es$, $es$Mrs. Beatrice Omari$es$, $es$2026-10-07T11:20:00Z$es$, $es$[{"id":"sch-comm-3","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"Met with teacher to restructure Week 8 and 9 into double-period craft clinics.","createdAt":"2026-10-08T15:00:00Z"}]$es$::jsonb, $es$tenant-riara$es$);
create index "coordinator_schemes_of_work_school_id_idx" on "edusmart"."coordinator_schemes_of_work" ("school_id");
alter table "edusmart"."coordinator_schemes_of_work" enable row level security;

-- src/data/coordinatorCurriculumData.ts :: INITIAL_COORDINATOR_CBA_MODERATIONS (3 rows)
drop table if exists "edusmart"."coordinator_cba_moderations" cascade;
create table "edusmart"."coordinator_cba_moderations" (
  "id" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "subject" text not null,
  "assessment_title" text not null,
  "moderator" text not null,
  "moderated_date" text not null,
  "consensus_level" text not null,
  "sample_size" bigint not null,
  "ee_count" bigint not null,
  "me_count" bigint not null,
  "ae_count" bigint not null,
  "be_count" bigint not null,
  "variance_notes" text not null,
  "consensus_status" text not null,
  "created_at" text not null,
  "comments" jsonb not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."coordinator_cba_moderations" is $es$School data from src/data/coordinatorCurriculumData.ts export INITIAL_COORDINATOR_CBA_MODERATIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."coordinator_cba_moderations" ("id", "grade", "stream", "subject", "assessment_title", "moderator", "moderated_date", "consensus_level", "sample_size", "ee_count", "me_count", "ae_count", "be_count", "variance_notes", "consensus_status", "created_at", "comments", "school_id") values
  ($es$mod-01$es$, 4, $es$all$es$, $es$Mathematics$es$, $es$Fraction Strip Construction & Equivalence Investigation$es$, $es$Mrs. Beatrice Omari$es$, $es$2026-10-07$es$, $es$ME$es$, 40, 12, 20, 6, 2, $es$Inter-stream scoring variance between East and West within 3.5% acceptable margin.$es$, $es$verified$es$, $es$2026-10-07T12:00:00Z$es$, $es$[{"id":"mod-comm-1","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"Uniform criteria applied across all 4 streams. Exemplary rubric descriptors.","createdAt":"2026-10-07T14:00:00Z"}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$mod-02$es$, 7, $es$East$es$, $es$Computer Studies$es$, $es$Scratch Interactive Traffic Light Controller Project$es$, $es$Mrs. Beatrice Omari$es$, $es$2026-10-08$es$, $es$EE$es$, 36, 16, 15, 4, 1, $es$High digital fluency demonstrated; 44% achieved EE with custom sprite animations.$es$, $es$verified$es$, $es$2026-10-08T16:00:00Z$es$, $es$[{"id":"mod-comm-2","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"Code submissions moderated via Computer Lab Studio repository.","createdAt":"2026-10-08T16:30:00Z"}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$mod-03$es$, 5, $es$West$es$, $es$Creative Arts$es$, $es$Traditional Fibre Loom Weaving Practical$es$, $es$Mrs. Beatrice Omari$es$, $es$2026-10-09$es$, $es$AE$es$, 38, 4, 16, 14, 4, $es$Elevated AE and BE frequency due to incomplete tensioning in student looms.$es$, $es$action_required$es$, $es$2026-10-09T13:00:00Z$es$, $es$[{"id":"mod-comm-3","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"Departmental head instructed to run remedial loom knotting clinics next Monday.","createdAt":"2026-10-09T15:10:00Z"}]$es$::jsonb, $es$tenant-riara$es$);
create index "coordinator_cba_moderations_school_id_idx" on "edusmart"."coordinator_cba_moderations" ("school_id");
alter table "edusmart"."coordinator_cba_moderations" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
