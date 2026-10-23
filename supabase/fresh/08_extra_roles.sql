-- EduSmart fresh Supabase schema
-- Portal sections and document requests
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/extraRolesData.ts :: INITIAL_POST_CATEGORIES (6 rows)
drop table if exists "edusmart"."post_categories" cascade;
create table "edusmart"."post_categories" (
  "id" text not null,
  "name" text not null,
  "slug" text not null,
  "color" text not null,
  "description" text not null,
  "icon" text not null,
  "is_system_default" boolean not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."post_categories" is $es$School data from src/data/extraRolesData.ts export INITIAL_POST_CATEGORIES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."post_categories" ("id", "name", "slug", "color", "description", "icon", "is_system_default", "school_id") values
  ($es$cat-academic$es$, $es$Academic Directives & Syllabi$es$, $es$academic-directives$es$, $es$emerald$es$, $es$Curriculum coverage guidelines, timetable adjustments, and CBC learning materials$es$, $es$BookOpen$es$, true, $es$tenant-riara$es$),
  ($es$cat-computer-lab$es$, $es$CS Computer Lab & Coding$es$, $es$cs-computer-lab$es$, $es$indigo$es$, $es$Scratch studio demonstrations, computational challenges, and digital literacy updates$es$, $es$Laptop$es$, true, $es$tenant-riara$es$),
  ($es$cat-cocurricular$es$, $es$Sports & Co-Curricular$es$, $es$sports-cocurricular$es$, $es$orange$es$, $es$Athletics fixtures, music festival preparations, and club activities$es$, $es$Trophy$es$, true, $es$tenant-riara$es$),
  ($es$cat-sanatorium$es$, $es$Sanatorium & Health Briefs$es$, $es$sanatorium-health$es$, $es$rose$es$, $es$Clinic immunization alerts, wellness notices, and student medical clearance$es$, $es$HeartPulse$es$, true, $es$tenant-riara$es$),
  ($es$cat-assessments$es$, $es$CBC Assessments & KNEC$es$, $es$cbc-assessments$es$, $es$blue$es$, $es$Assessment rubrics, SBA upload deadlines, and termly examination reports$es$, $es$Award$es$, true, $es$tenant-riara$es$),
  ($es$cat-governance$es$, $es$Institutional Governance$es$, $es$institutional-governance$es$, $es$purple$es$, $es$BOM board directives, staff briefings, and official school policies$es$, $es$Shield$es$, true, $es$tenant-riara$es$);
create index "post_categories_school_id_idx" on "edusmart"."post_categories" ("school_id");
alter table "edusmart"."post_categories" enable row level security;

-- src/data/extraRolesData.ts :: INITIAL_PORTAL_SECTIONS (4 rows)
drop table if exists "edusmart"."portal_sections" cascade;
create table "edusmart"."portal_sections" (
  "id" text not null,
  "title" text not null,
  "description" text not null,
  "category_key" text not null,
  "is_visible" boolean not null,
  "order" bigint not null,
  "target_audience" text not null,
  "icon" text not null,
  "badge" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."portal_sections" is $es$School data from src/data/extraRolesData.ts export INITIAL_PORTAL_SECTIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."portal_sections" ("id", "title", "description", "category_key", "is_visible", "order", "target_audience", "icon", "badge", "school_id") values
  ($es$sec-announcements$es$, $es$School Directives & Bulletins$es$, $es$Official administrative notices from head teacher and executive board$es$, $es$institutional-governance$es$, true, 1, $es$all$es$, $es$Bell$es$, $es$Official Broadcast$es$, $es$tenant-riara$es$),
  ($es$sec-academics$es$, $es$Curriculum & Topical Learning Feed$es$, $es$Subject teacher reminders, homework releases, and digital lab schedules$es$, $es$academic-directives$es$, true, 2, $es$students$es$, $es$BookOpen$es$, $es$CBC Grade 1-9$es$, $es$tenant-riara$es$),
  ($es$sec-computer-lab$es$, $es$Computer Lab Challenges & Coding Showcase$es$, $es$Weekly Scratch coding assignments, block puzzles, and project highlights$es$, $es$cs-computer-lab$es$, true, 3, $es$all$es$, $es$Code2$es$, $es$STEM & CS$es$, $es$tenant-riara$es$),
  ($es$sec-cocurricular$es$, $es$Co-Curricular & Sports Academy Feed$es$, $es$Fixtures, team training times, talent trophies, and club patron posts$es$, $es$sports-cocurricular$es$, true, 4, $es$all$es$, $es$Trophy$es$, $es$Talent & Athletics$es$, $es$tenant-riara$es$);
create index "portal_sections_school_id_idx" on "edusmart"."portal_sections" ("school_id");
alter table "edusmart"."portal_sections" enable row level security;

-- src/data/extraRolesData.ts :: INITIAL_DOCUMENT_REQUESTS (3 rows)
drop table if exists "edusmart"."document_requests" cascade;
create table "edusmart"."document_requests" (
  "id" text not null,
  "title" text not null,
  "description" text not null,
  "requested_by_user_id" text not null,
  "requested_by_user_name" text not null,
  "requested_by_user_role" text not null,
  "target_user_ids" text[] not null,
  "target_grade" bigint,
  "target_role" text not null,
  "due_date" text not null,
  "required_doc_types" text[] not null,
  "mandatory" boolean not null,
  "created_at" text not null,
  "status" text not null,
  "instructions" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."document_requests" is $es$School data from src/data/extraRolesData.ts export INITIAL_DOCUMENT_REQUESTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."document_requests" ("id", "title", "description", "requested_by_user_id", "requested_by_user_name", "requested_by_user_role", "target_user_ids", "target_grade", "target_role", "due_date", "required_doc_types", "mandatory", "created_at", "status", "instructions", "school_id") values
  ($es$doc-req-001$es$, $es$Grade 4 CBC Transition Dossier & Birth Certificate$es$, $es$Mandatory submission of the official Ministry birth certificate copy and medical immunization record for NEMIS / KNEC CBA index registration.$es$, $es$usr-admin-system$es$, $es$Principal Dr. Peter Otieno$es$, $es$head_teacher$es$, array[$es$usr-stu-brian$es$, $es$usr-stu-faith$es$, $es$usr-stu-kevin$es$]::text[], 4, $es$student$es$, $es$2026-11-15$es$, array[$es$Birth Certificate (PDF or Clear JPG)$es$, $es$MOH Immunization Card$es$, $es$Grade 3 CBA Transition Assessment Summary$es$]::text[], true, $es$2026-10-01T08:00:00.000Z$es$, $es$active$es$, $es$Please upload scanned PDF or crisp mobile phone photos. File sizes up to 15MB are accepted. Ensure learner full names match school admission registers.$es$, $es$tenant-riara$es$),
  ($es$doc-req-002$es$, $es$Teacher Annual TIG Professional Development Dossier$es$, $es$Submission of TSC Teacher Induction & Guidance (TIG) portfolio evidence, lesson attendance records, and subject remedial log sheets.$es$, $es$usr-admin-system$es$, $es$Gadsa Systems Administrator$es$, $es$admin$es$, array[$es$usr-teach-sarah$es$, $es$usr-teach-omondi$es$]::text[], null, $es$teacher$es$, $es$2026-11-20$es$, array[$es$TPAD Self-Assessment Summary Sheet$es$, $es$Approved Schemes of Work Q4$es$, $es$Remedial Attendance Register$es$]::text[], true, $es$2026-10-05T09:30:00.000Z$es$, $es$active$es$, $es$Upload certified documents signed by the respective Head of Department or Dean of Studies.$es$, $es$tenant-riara$es$),
  ($es$doc-req-003$es$, $es$Parent Emergency Contact & Hospital Authorization Slip$es$, $es$Submission of authorized medical consent form allowing emergency ambulance transit to designated partner referral hospitals.$es$, $es$usr-admin-system$es$, $es$Sister Agnes Kilonzo$es$, $es$nurse$es$, array[$es$usr-par-mary$es$, $es$usr-par-john$es$]::text[], null, $es$parent$es$, $es$2026-11-25$es$, array[$es$Signed Hospital Consent Form$es$, $es$National ID Copy (Primary Guardian)$es$]::text[], false, $es$2026-10-08T11:00:00.000Z$es$, $es$active$es$, $es$Required for all boarders and day scholars participating in inter-county sports or excursion trips.$es$, $es$tenant-riara$es$);
create index "document_requests_school_id_idx" on "edusmart"."document_requests" ("school_id");
alter table "edusmart"."document_requests" enable row level security;

-- src/data/extraRolesData.ts :: INITIAL_DOCUMENT_SUBMISSIONS (3 rows)
drop table if exists "edusmart"."document_submissions" cascade;
create table "edusmart"."document_submissions" (
  "id" text not null,
  "request_id" text not null,
  "user_id" text not null,
  "user_name" text not null,
  "user_email" text not null,
  "user_role" text not null,
  "file_name" text not null,
  "file_size" text not null,
  "file_type" text not null,
  "notes" text not null,
  "status" text not null,
  "submitted_at" text not null,
  "reviewed_by" text,
  "review_notes" text,
  "reviewed_at" text,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."document_submissions" is $es$School data from src/data/extraRolesData.ts export INITIAL_DOCUMENT_SUBMISSIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."document_submissions" ("id", "request_id", "user_id", "user_name", "user_email", "user_role", "file_name", "file_size", "file_type", "notes", "status", "submitted_at", "reviewed_by", "review_notes", "reviewed_at", "school_id") values
  ($es$sub-001$es$, $es$doc-req-001$es$, $es$usr-stu-brian$es$, $es$Brian Kipchumba$es$, $es$brian.kipchumba@student.edusmart.ac.ke$es$, $es$student$es$, $es$Brian_Kipchumba_BirthCert_NEMIS.pdf$es$, $es$1.8 MB$es$, $es$application/pdf$es$, $es$Uploaded verified certified copy from civil registration bureau.$es$, $es$verified$es$, $es$2026-10-06T14:22:00.000Z$es$, $es$Dr. Peter Otieno$es$, $es$Verified against KNEC CBA index register. Entry validated.$es$, $es$2026-10-07T09:15:00.000Z$es$, $es$tenant-riara$es$),
  ($es$sub-002$es$, $es$doc-req-001$es$, $es$usr-stu-faith$es$, $es$Faith Wanjiku$es$, $es$faith.wanjiku@student.edusmart.ac.ke$es$, $es$student$es$, $es$Faith_Wanjiku_Immunization_and_Cert.jpg$es$, $es$3.4 MB$es$, $es$image/jpeg$es$, $es$Scanned clinic card showing all childhood immunizations complete.$es$, $es$submitted$es$, $es$2026-10-09T16:05:00.000Z$es$, null, null, null, $es$tenant-riara$es$),
  ($es$sub-003$es$, $es$doc-req-002$es$, $es$usr-teach-sarah$es$, $es$Ms. Sarah Mwangi$es$, $es$sarah.mwangi@teacher.edusmart.ac.ke$es$, $es$teacher$es$, $es$Sarah_Mwangi_TPAD_Term3_Summary.pdf$es$, $es$4.2 MB$es$, $es$application/pdf$es$, $es$Attached certified lesson study reviews and learner progress tracking sheets.$es$, $es$verified$es$, $es$2026-10-08T10:30:00.000Z$es$, $es$Dean of Studies Mr. Kamau$es$, $es$All 8 competencies meet standard. Approved.$es$, $es$2026-10-09T11:40:00.000Z$es$, $es$tenant-riara$es$);
create index "document_submissions_school_id_idx" on "edusmart"."document_submissions" ("school_id");
alter table "edusmart"."document_submissions" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
