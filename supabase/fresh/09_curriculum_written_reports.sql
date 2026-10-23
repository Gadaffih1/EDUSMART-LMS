-- EduSmart fresh Supabase schema
-- Curriculum written reports
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/curriculumWrittenReportsData.ts :: INITIAL_CURRICULUM_WRITTEN_REPORTS (3 rows)
drop table if exists "edusmart"."curriculum_written_reports" cascade;
create table "edusmart"."curriculum_written_reports" (
  "id" text not null,
  "title" text not null,
  "report_type" text not null,
  "target_grade" jsonb not null,
  "term" bigint not null,
  "academic_year" bigint not null,
  "author_name" text not null,
  "author_role" text not null,
  "executive_summary" text not null,
  "key_findings" text[] not null,
  "recommendations" text[] not null,
  "qualitative_comments" jsonb not null,
  "status" text not null,
  "created_at" text not null,
  "published_at" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."curriculum_written_reports" is $es$School data from src/data/curriculumWrittenReportsData.ts export INITIAL_CURRICULUM_WRITTEN_REPORTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."curriculum_written_reports" ("id", "title", "report_type", "target_grade", "term", "academic_year", "author_name", "author_role", "executive_summary", "key_findings", "recommendations", "qualitative_comments", "status", "created_at", "published_at", "school_id") values
  ($es$c-rep-001$es$, $es$Term 2 CBC Curriculum Pacing & Syllabi Synchronization Audit$es$, $es$Syllabus Pacing & Audit$es$, $es$"All Grades"$es$::jsonb, 2, 2026, $es$Mrs. Beatrice Omari$es$, $es$Curriculum Coordinator$es$, $es$Institutional audit of all 9 grade levels in primary and junior school streams. Overall pacing achievement sits at 91.2% on schedule, with 148 schemes of work verified and cross-referenced with national KICD designs.$es$, array[$es$Grade 4 Mathematics and Integrated Science streams are 100% synchronized with Term 2 Week 7 pacing benchmarks.$es$, $es$Grade 7 Computer Studies coding curriculum is running 1 week ahead due to daily Scratch Computer Lab interactive studio usage.$es$, $es$Grade 5 Creative Arts weaving sub-strand exhibits a 2-week lag in North stream due to local fiber harvesting delays.$es$, $es$Grade 8 Pretechnical workshop safety compliance reached 94% following hands-on hazard mitigation practicals.$es$]::text[], array[$es$Organize two remedial practical block periods for Grade 5 Creative Arts to complete indigenous loom projects before Week 9.$es$, $es$Adopt Computer Lab Challenge Library model across Pretechnical drawing modules.$es$, $es$Standardize formative observation rubrics across junior secondary science laboratory classes.$es$]::text[], $es$[{"id":"comm-01","author":"Dr. Arthur Onyango","authorRole":"Head Teacher","comment":"Comprehensive pacing audit approved. Remedial timetable adjustments for Grade 5 Arts authorized immediately.","createdAt":"2026-10-08T09:30:00Z"},{"id":"comm-02","author":"Mr. James Wafula","authorRole":"Deputy Head Teacher","comment":"Double laboratory sessions allocated for Tuesday afternoon to assist lagging streams.","createdAt":"2026-10-08T11:15:00Z"}]$es$::jsonb, $es$published$es$, $es$2026-10-07T08:00:00Z$es$, $es$2026-10-08T14:00:00Z$es$, $es$tenant-riara$es$),
  ($es$c-rep-002$es$, $es$CBA Formative Moderation & Attainment Consistency Analysis across Streams$es$, $es$CBA Moderation & Attainment$es$, $es$4$es$::jsonb, 2, 2026, $es$Mrs. Beatrice Omari$es$, $es$Curriculum Coordinator$es$, $es$Comparative study across Grades 4 East, West, North, and South streams on competency-based assessment attainment tiers (EE, ME, AE, BE). Moderation reveals strong consistency in meeting expectations.$es$, array[$es$28.4% of cohort achieved Exceeding Expectations (EE) in hands-on mathematical problem-solving.$es$, $es$56.2% consistently Met Expectations (ME), adhering closely to KICD standard benchmarks.$es$, $es$Approaching Expectations (AE) reduced from 18% in Term 1 to 12.1% in Term 2 following peer-mentoring groups.$es$, $es$Below Expectations (BE) learners identified for targeted scaffolding in decimal notation and fraction conversion.$es$]::text[], array[$es$Maintain continuous portfolio artifact collection for all borderline AE learners.$es$, $es$Share Ms. Mwangi's fraction strip manipulative rubric as best practice model across all primary streams.$es$]::text[], $es$[{"id":"comm-03","author":"Mrs. Beatrice Omari","authorRole":"Curriculum Coordinator","comment":"All report card qualitative remarks across Grade 4 have been moderated and endorsed with curriculum stamps.","createdAt":"2026-10-09T10:00:00Z"}]$es$::jsonb, $es$published$es$, $es$2026-10-08T12:00:00Z$es$, $es$2026-10-09T15:30:00Z$es$, $es$tenant-riara$es$),
  ($es$c-rep-003$es$, $es$Junior Secondary STEM Transition & Scratch Computer Lab Integration Report$es$, $es$Curriculum Implementation$es$, $es$7$es$::jsonb, 2, 2026, $es$Mrs. Beatrice Omari$es$, $es$Curriculum Coordinator$es$, $es$Evaluation of Grades 7-9 rollout of digital literacy, algorithmic thinking, and integrated science laboratories. Computer Lab projection and Virtual Science Lab adoption evaluated.$es$, array[$es$100% of Grade 7 learners successfully completed their Scratch traffic light animation challenge.$es$, $es$Bonus Points (BP) gamification streak mechanism resulted in 98% voluntary lunchtime challenge attempts.$es$, $es$Virtual Science experiment simulations boosted learner pre-lab quiz scores by 22% compared to traditional blackboard chalk lectures.$es$]::text[], array[$es$Expand challenge library with advanced nested loops and mathematical coordinate animations for Term 3.$es$, $es$Schedule joint STEM exhibition for parents during upcoming Academic Open Day.$es$]::text[], $es$[{"id":"comm-04","author":"Mr. John Kamau","authorRole":"Computer Studies Lead","comment":"Learner feedback on projected coding studio has been phenomenal. Grade 8 Python transition modules drafted.","createdAt":"2026-10-10T14:20:00Z"}]$es$::jsonb, $es$submitted_to_bom$es$, $es$2026-10-09T16:00:00Z$es$, $es$2026-10-10T16:30:00Z$es$, $es$tenant-riara$es$);
create index "curriculum_written_reports_school_id_idx" on "edusmart"."curriculum_written_reports" ("school_id");
alter table "edusmart"."curriculum_written_reports" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
