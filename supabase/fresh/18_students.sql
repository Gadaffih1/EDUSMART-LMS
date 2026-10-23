-- EduSmart fresh Supabase schema
-- Students, grades, streams, and parents. Student rows are in students, with their rights, and are no longer inserted into users.
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/studentDirectoryData.ts :: SCHOOL_GRADES (3 rows)
drop table if exists "edusmart"."school_grades" cascade;
create table "edusmart"."school_grades" (
  "id" text not null,
  "school_id" text not null,
  "name" text not null,
  "created_at" text not null,
  primary key ("id")
);
comment on table "edusmart"."school_grades" is $es$School data from src/data/studentDirectoryData.ts export SCHOOL_GRADES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."school_grades" ("id", "school_id", "name", "created_at") values
  ($es$grade-tenant-riara-4$es$, $es$tenant-riara$es$, $es$Grade 4$es$, $es$2026-01-08T08:30:00.000Z$es$),
  ($es$grade-tenant-riara-8$es$, $es$tenant-riara$es$, $es$Grade 8$es$, $es$2026-01-08T08:30:00.000Z$es$),
  ($es$grade-tenant-riara-2$es$, $es$tenant-riara$es$, $es$Grade 2$es$, $es$2026-01-08T08:30:00.000Z$es$);
create index "school_grades_school_id_idx" on "edusmart"."school_grades" ("school_id");
alter table "edusmart"."school_grades" enable row level security;

-- src/data/studentDirectoryData.ts :: SCHOOL_STREAMS (3 rows)
drop table if exists "edusmart"."school_streams" cascade;
create table "edusmart"."school_streams" (
  "id" text not null,
  "school_id" text not null,
  "grade_id" text not null,
  "name" text not null,
  "display_name" text not null,
  "created_at" text not null,
  primary key ("id")
);
comment on table "edusmart"."school_streams" is $es$School data from src/data/studentDirectoryData.ts export SCHOOL_STREAMS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."school_streams" ("id", "school_id", "grade_id", "name", "display_name", "created_at") values
  ($es$stream-tenant-riara-4-dove$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-4$es$, $es$Dove$es$, $es$Grade 4 Dove$es$, $es$2026-01-08T08:30:00.000Z$es$),
  ($es$stream-tenant-riara-8-mara$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-8$es$, $es$Mara$es$, $es$Grade 8 Mara$es$, $es$2026-01-08T08:30:00.000Z$es$),
  ($es$stream-tenant-riara-2-eagle$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-2$es$, $es$Eagle$es$, $es$Grade 2 Eagle$es$, $es$2026-01-08T08:30:00.000Z$es$);
create index "school_streams_school_id_idx" on "edusmart"."school_streams" ("school_id");
alter table "edusmart"."school_streams" enable row level security;

-- src/data/studentDirectoryData.ts :: STUDENTS (11 rows)
drop table if exists "edusmart"."students" cascade;
create table "edusmart"."students" (
  "id" text not null,
  "school_id" text not null,
  "grade_id" text not null,
  "stream_id" text not null,
  "name" text not null,
  "email" text not null,
  "password" text not null,
  "admission_number" text not null,
  "phone" text not null,
  "upi_number" text not null,
  "grade_label" text not null,
  "stream_label" text not null,
  "class_name" text not null,
  "is_active" boolean not null,
  "created_at" text not null,
  "rights" jsonb not null,
  primary key ("id")
);
comment on table "edusmart"."students" is $es$Learners live in this table under their school. rights is that student access profile. class_name joins the grade and the stream. These people are not shared with another school.$es$;
insert into "edusmart"."students" ("id", "school_id", "grade_id", "stream_id", "name", "email", "password", "admission_number", "phone", "upi_number", "grade_label", "stream_label", "class_name", "is_active", "created_at", "rights") values
  ($es$usr-stu-brian$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-4$es$, $es$stream-tenant-riara-4-dove$es$, $es$Brian Otieno$es$, $es$brian.otieno@student.edusmart.ac.ke$es$, $es$GR4@2026$es$, $es$ADM/2023/0412$es$, $es$$es$, $es$$es$, $es$Grade 4$es$, $es$Dove$es$, $es$Grade 4 Dove$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb),
  ($es$usr-stu-amina$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-4$es$, $es$stream-tenant-riara-4-dove$es$, $es$Amina Hassan$es$, $es$amina.hassan@student.edusmart.ac.ke$es$, $es$GR4@2026$es$, $es$ADM/2023/0413$es$, $es$$es$, $es$$es$, $es$Grade 4$es$, $es$Dove$es$, $es$Grade 4 Dove$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb),
  ($es$usr-stu-kelvin$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-4$es$, $es$stream-tenant-riara-4-dove$es$, $es$Kelvin Kiprop$es$, $es$kelvin.kiprop@student.edusmart.ac.ke$es$, $es$GR4@2026$es$, $es$ADM/2023/0414$es$, $es$$es$, $es$$es$, $es$Grade 4$es$, $es$Dove$es$, $es$Grade 4 Dove$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb),
  ($es$usr-stu-mercy$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-4$es$, $es$stream-tenant-riara-4-dove$es$, $es$Mercy Chebet$es$, $es$mercy.chebet@student.edusmart.ac.ke$es$, $es$GR4@2026$es$, $es$ADM/2023/0415$es$, $es$$es$, $es$$es$, $es$Grade 4$es$, $es$Dove$es$, $es$Grade 4 Dove$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb),
  ($es$usr-stu-daniel$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-4$es$, $es$stream-tenant-riara-4-dove$es$, $es$Daniel Njoroge$es$, $es$daniel.njoroge@student.edusmart.ac.ke$es$, $es$GR4@2026$es$, $es$ADM/2023/0416$es$, $es$$es$, $es$$es$, $es$Grade 4$es$, $es$Dove$es$, $es$Grade 4 Dove$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb),
  ($es$usr-stu-faith$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-8$es$, $es$stream-tenant-riara-8-mara$es$, $es$Faith Wanjiru$es$, $es$faith.wanjiru@student.edusmart.ac.ke$es$, $es$GR8@2026$es$, $es$ADM/2021/0819$es$, $es$$es$, $es$$es$, $es$Grade 8$es$, $es$Mara$es$, $es$Grade 8 Mara$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb),
  ($es$usr-stu-ian$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-8$es$, $es$stream-tenant-riara-8-mara$es$, $es$Ian Mwangi$es$, $es$ian.mwangi@student.edusmart.ac.ke$es$, $es$GR8@2026$es$, $es$ADM/2021/0820$es$, $es$$es$, $es$$es$, $es$Grade 8$es$, $es$Mara$es$, $es$Grade 8 Mara$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb),
  ($es$usr-stu-sharon$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-8$es$, $es$stream-tenant-riara-8-mara$es$, $es$Sharon Cherono$es$, $es$sharon.cherono@student.edusmart.ac.ke$es$, $es$GR8@2026$es$, $es$ADM/2021/0821$es$, $es$$es$, $es$$es$, $es$Grade 8$es$, $es$Mara$es$, $es$Grade 8 Mara$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb),
  ($es$usr-stu-victor$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-8$es$, $es$stream-tenant-riara-8-mara$es$, $es$Victor Ochieng$es$, $es$victor.ochieng@student.edusmart.ac.ke$es$, $es$GR8@2026$es$, $es$ADM/2021/0822$es$, $es$$es$, $es$$es$, $es$Grade 8$es$, $es$Mara$es$, $es$Grade 8 Mara$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb),
  ($es$usr-stu-kevin2$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-2$es$, $es$stream-tenant-riara-2-eagle$es$, $es$Kevin Maina$es$, $es$kevin.maina@student.edusmart.ac.ke$es$, $es$GR2@2026$es$, $es$ADM/2025/0201$es$, $es$$es$, $es$$es$, $es$Grade 2$es$, $es$Eagle$es$, $es$Grade 2 Eagle$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb),
  ($es$usr-stu-peter$es$, $es$tenant-riara$es$, $es$grade-tenant-riara-2$es$, $es$stream-tenant-riara-2-eagle$es$, $es$Peter Otieno$es$, $es$peter.otieno@student.edusmart.ac.ke$es$, $es$GR2@2026$es$, $es$ADM/2025/0202$es$, $es$$es$, $es$$es$, $es$Grade 2$es$, $es$Eagle$es$, $es$Grade 2 Eagle$es$, true, $es$2026-01-08T08:30:00.000Z$es$, $es${"canAccessSanatorium":false,"canAccessAcademicReports":true,"canEditCommentWriteUps":false,"canRepublishReports":false,"canManageUsersAndRoles":false,"canAccessAdminSettings":false,"canAccessFinancials":false,"canAccessProcurement":false,"canAccessStores":false,"canAccessHRPayroll":false,"canAccessTimetable":true,"canAccessGatePasses":false,"canAccessLibrary":true,"canAccessTransport":false,"canAccessCoCurricular":true,"canAccessLunchRegister":false,"canAccessVirtualRooms":true,"canManageDiscipline":false,"canRequestDocumentSubmissions":false,"canEditPostsBySpecificUsers":false,"canAddCategoriesToPosts":false,"hasDoubleAccessRights":false,"canManageAllPostsCategoriesSections":false}$es$::jsonb);
create index "students_school_id_idx" on "edusmart"."students" ("school_id");
create unique index if not exists "students_email_key" on "edusmart"."students" ("email");
alter table "edusmart"."students" enable row level security;

-- src/data/studentDirectoryData.ts :: STUDENT_PARENTS (3 rows)
drop table if exists "edusmart"."student_parents" cascade;
create table "edusmart"."student_parents" (
  "id" text not null,
  "school_id" text not null,
  "student_id" text not null,
  "name" text not null,
  "email" text not null,
  "password" text not null,
  "phone" text not null,
  "relationship" text not null,
  "created_at" text not null,
  primary key ("id")
);
comment on table "edusmart"."student_parents" is $es$School data from src/data/studentDirectoryData.ts export STUDENT_PARENTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."student_parents" ("id", "school_id", "student_id", "name", "email", "password", "phone", "relationship", "created_at") values
  ($es$parent-usr-parent-otieno-usr-stu-brian$es$, $es$tenant-riara$es$, $es$usr-stu-brian$es$, $es$Mrs. Grace Otieno (Parent)$es$, $es$parent.otieno@edusmart.ac.ke$es$, $es$parent2026$es$, $es$+254 722 123 456$es$, $es$Parent$es$, $es$2026-01-08T08:30:00.000Z$es$),
  ($es$parent-usr-parent-otieno-usr-stu-faith$es$, $es$tenant-riara$es$, $es$usr-stu-faith$es$, $es$Mrs. Grace Otieno (Parent)$es$, $es$parent.otieno@edusmart.ac.ke$es$, $es$parent2026$es$, $es$+254 722 123 456$es$, $es$Parent$es$, $es$2026-01-08T08:30:00.000Z$es$),
  ($es$parent-usr-parent-otieno-usr-stu-peter$es$, $es$tenant-riara$es$, $es$usr-stu-peter$es$, $es$Mrs. Grace Otieno (Parent)$es$, $es$parent.otieno@edusmart.ac.ke$es$, $es$parent2026$es$, $es$+254 722 123 456$es$, $es$Parent$es$, $es$2026-01-08T08:30:00.000Z$es$);
create index "student_parents_school_id_idx" on "edusmart"."student_parents" ("school_id");
alter table "edusmart"."student_parents" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
