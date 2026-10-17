-- Supabase Auth and role-scoped access for the generic EduSmart record store.
-- Auth users must have trusted app_metadata.app_user_id, tenant_id, and role.

alter table public.app_records
  drop constraint if exists app_records_pkey;
alter table public.app_records
  add constraint app_records_pkey primary key (tenant_id, collection, record_id);

create or replace function public.app_records_claim(claim_name text)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> claim_name, '');
$$;

create or replace function public.app_records_is_manager()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select public.app_records_claim('role') in ('admin', 'head_teacher', 'deputy_head');
$$;

create or replace function public.app_records_is_owner(payload jsonb)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    public.app_records_claim('app_user_id') is not null
    and public.app_records_claim('app_user_id') in (
      payload ->> 'user_id',
      payload ->> 'userId',
      payload ->> 'student_id',
      payload ->> 'studentId',
      payload ->> 'parent_id',
      payload ->> 'parentId',
      payload ->> 'sender_id',
      payload ->> 'senderId',
      payload ->> 'recipient_id',
      payload ->> 'recipientId'
    );
$$;

create or replace function public.app_records_can_read(
  collection_name text,
  record_key text,
  record_payload jsonb
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    when collection_name = 'edusmart_users_v1' then
      public.app_records_is_manager()
      or record_key = public.app_records_claim('app_user_id')
    when collection_name = 'edusmart_role_permissions_v1'
      then public.app_records_claim('role') = 'admin'
    when collection_name = 'edusmart_grade_passwords_v1' then false
    when public.app_records_claim('role') = 'admin' then true
    when collection_name in (
      'edusmart_topics_v1',
      'edusmart_notes_v1',
      'edusmart_videos_v1',
      'edusmart_audios_v1',
      'edusmart_lesson_images_v1',
      'edusmart_quizzes_v1',
      'edusmart_assignments_v1',
      'edusmart_announcements_v1',
      'edusmart_virtual_classes_v1',
      'edusmart_timetable_v1',
      'edusmart_bell_schedule_v1',
      'edusmart_fixed_lessons_v1',
      'edusmart_shared_resources_v1',
      'edusmart_badges_v1',
      'edusmart_external_tools_v1',
      'edusmart_calendar_events_v1',
      'edusmart_exam_timetable_v1',
      'edusmart_e_links_v1',
      'edusmart_coding_challenges_v1'
    ) then true
    when collection_name in (
      'edusmart_sanatorium_records_v1'
    ) then public.app_records_claim('role') in ('admin', 'nurse', 'head_teacher')
    when collection_name like 'edusmart_ops_hr_%'
      or collection_name in (
        'edusmart_ops_employees_v1',
        'edusmart_ops_payroll_runs_v1',
        'edusmart_ops_payslips_v1'
      ) then public.app_records_claim('role') in ('admin', 'hr_manager', 'head_teacher')
    when collection_name like 'edusmart_ops_fee_%' then
        public.app_records_claim('role') in ('admin', 'finance_officer', 'head_teacher', 'deputy_head')
        or (
          public.app_records_claim('role') in ('student', 'parent')
          and public.app_records_is_owner(record_payload)
        )
    when collection_name in (
      'edusmart_ops_gl_accounts_v1',
      'edusmart_ops_budgets_v1',
      'edusmart_ops_audit_logs_v1'
    ) then public.app_records_claim('role') in ('admin', 'finance_officer', 'head_teacher', 'deputy_head')
    when collection_name like 'edusmart_ops_%'
      then public.app_records_claim('role') in ('admin', 'procurement_officer', 'storekeeper', 'head_teacher', 'deputy_head')
    when collection_name like 'edusmart_transport_%'
      or collection_name in ('edusmart_transport_buses_v1', 'edusmart_transport_routes_v1')
      then public.app_records_claim('role') in ('admin', 'transport_team', 'head_teacher', 'school_admin_staff')
    when collection_name like 'edusmart_cocurricular_%'
      then public.app_records_claim('role') in ('admin', 'cocurricular_team', 'head_teacher', 'teacher', 'class_teacher')
    when collection_name in (
      'edusmart_library_books_v1',
      'edusmart_library_shelves_v1',
      'edusmart_library_digital_items_v1',
      'edusmart_library_policies_v1',
      'edusmart_library_events_v1',
      'edusmart_library_timetable_v1',
      'edusmart_library_rooms_v1'
    ) then public.app_records_claim('role') in ('admin', 'librarian', 'teacher', 'class_teacher', 'student')
    when collection_name in (
      'edusmart_library_reservations_v1',
      'edusmart_library_fines_v1',
      'edusmart_library_reading_programme_v1',
      'edusmart_library_acquisitions_v1',
      'edusmart_library_attendance_v1',
      'edusmart_library_audit_logs_v1',
      'edusmart_library_room_bookings_v1',
      'edusmart_borrow_records_v1'
    ) then
      public.app_records_is_manager()
      or public.app_records_claim('role') = 'librarian'
      or (
        public.app_records_claim('role') in ('student', 'parent')
        and public.app_records_is_owner(record_payload)
      )
    when collection_name in (
      'edusmart_notifications_v1',
      'edusmart_chat_messages_v1',
      'edusmart_parent_communications_v1'
    ) then public.app_records_is_owner(record_payload)
    when collection_name in (
      'edusmart_report_cards_v1',
      'edusmart_quiz_attempts_v1',
      'edusmart_assignment_submissions_v1',
      'edusmart_portfolio_v1',
      'edusmart_periodic_reports_v1',
      'edusmart_assessment_records_v1',
      'edusmart_streaks_v1',
      'edusmart_event_tickets_v1',
      'edusmart_learner_lunch_records_v1',
      'edusmart_student_transport_profiles_v1'
    ) then
      public.app_records_is_manager()
      or public.app_records_claim('role') in (
        'teacher', 'class_teacher', 'hod', 'senior_teacher',
        'deputy_head', 'dean_of_studies', 'curriculum_coordinator',
        'school_admin_staff', 'finance_officer', 'librarian'
      )
      or (
        public.app_records_claim('role') in ('student', 'parent')
        and public.app_records_is_owner(record_payload)
      )
    when collection_name in (
      'edusmart_attendance_v1',
      'edusmart_work_entry_logs_v1',
      'edusmart_gate_passes_v1',
      'edusmart_teacher_upload_assignments_v1',
      'edusmart_staff_duty_rosters_v1',
      'edusmart_transport_dropoff_verifications_v1',
      'edusmart_document_requests_v1',
      'edusmart_document_submissions_v1',
      'edusmart_post_categories_v1',
      'edusmart_portal_sections_v1',
      'edusmart_cba_task_mappings_v1',
      'edusmart_staff_appraisals_v1',
      'edusmart_curriculum_written_reports_v1',
      'edusmart_coordinator_schemes_of_work_v1',
      'edusmart_coordinator_syllabus_tracking_v1',
      'edusmart_coordinator_cba_moderations_v1',
      'edusmart_teacher_absence_reports_v1',
      'edusmart_onboarding_batches_v1'
    ) then
      public.app_records_is_manager()
      or public.app_records_claim('role') in (
        'teacher', 'class_teacher', 'hod', 'senior_teacher',
        'dean_of_studies', 'curriculum_coordinator', 'school_admin_staff'
      )
    else false
  end;
$$;

create or replace function public.app_records_can_write(
  collection_name text,
  record_payload jsonb
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when auth.uid() is null then false
    when collection_name = 'edusmart_grade_passwords_v1' then false
    when public.app_records_claim('role') = 'admin' then true
    when collection_name in (
      'edusmart_topics_v1',
      'edusmart_notes_v1',
      'edusmart_videos_v1',
      'edusmart_audios_v1',
      'edusmart_lesson_images_v1',
      'edusmart_quizzes_v1',
      'edusmart_assignments_v1',
      'edusmart_announcements_v1',
      'edusmart_virtual_classes_v1',
      'edusmart_timetable_v1',
      'edusmart_fixed_lessons_v1',
      'edusmart_calendar_events_v1',
      'edusmart_e_links_v1'
    ) then public.app_records_claim('role') in (
      'teacher', 'class_teacher', 'hod', 'senior_teacher',
      'deputy_head', 'dean_of_studies', 'curriculum_coordinator',
      'head_teacher', 'school_admin_staff'
    )
    when collection_name = 'edusmart_sanatorium_records_v1'
      then public.app_records_claim('role') = 'nurse'
    when collection_name like 'edusmart_ops_hr_%'
      or collection_name in (
        'edusmart_ops_employees_v1',
        'edusmart_ops_payroll_runs_v1',
        'edusmart_ops_payslips_v1'
      ) then public.app_records_claim('role') = 'hr_manager'
    when collection_name like 'edusmart_ops_fee_%'
      or collection_name in (
        'edusmart_ops_gl_accounts_v1',
        'edusmart_ops_budgets_v1'
      ) then public.app_records_claim('role') = 'finance_officer'
    when collection_name like 'edusmart_ops_%'
      then public.app_records_claim('role') in ('procurement_officer', 'storekeeper')
    when collection_name like 'edusmart_transport_%'
      or collection_name in ('edusmart_transport_buses_v1', 'edusmart_transport_routes_v1')
      then public.app_records_claim('role') = 'transport_team'
    when collection_name like 'edusmart_cocurricular_%'
      then public.app_records_claim('role') = 'cocurricular_team'
    when collection_name in (
      'edusmart_library_reservations_v1',
      'edusmart_library_fines_v1',
      'edusmart_library_reading_programme_v1',
      'edusmart_library_acquisitions_v1',
      'edusmart_library_attendance_v1',
      'edusmart_library_room_bookings_v1'
    ) then public.app_records_claim('role') = 'librarian'
    when collection_name in (
      'edusmart_quiz_attempts_v1',
      'edusmart_assignment_submissions_v1',
      'edusmart_portfolio_v1',
      'edusmart_chat_messages_v1',
      'edusmart_notifications_v1',
      'edusmart_parent_communications_v1'
    ) then public.app_records_is_owner(record_payload)
    else false
  end;
$$;

update public.app_records
set payload = payload - 'password'
where collection = 'edusmart_users_v1'
  and payload ? 'password';

delete from public.app_records
where collection = 'edusmart_grade_passwords_v1';

drop policy if exists "app_records_select" on public.app_records;
drop policy if exists "app_records_insert" on public.app_records;
drop policy if exists "app_records_update" on public.app_records;
drop policy if exists "app_records_delete" on public.app_records;
drop policy if exists "app_records_select_authenticated" on public.app_records;
drop policy if exists "app_records_insert_authenticated" on public.app_records;
drop policy if exists "app_records_update_authenticated" on public.app_records;
drop policy if exists "app_records_delete_authenticated" on public.app_records;

create policy "app_records_select_authenticated"
  on public.app_records for select
  to authenticated
  using (
    tenant_id = public.app_records_claim('tenant_id')
    and public.app_records_can_read(collection, record_id, payload)
  );

create policy "app_records_insert_authenticated"
  on public.app_records for insert
  to authenticated
  with check (
    tenant_id = public.app_records_claim('tenant_id')
    and public.app_records_can_write(collection, payload)
  );

create policy "app_records_update_authenticated"
  on public.app_records for update
  to authenticated
  using (
    tenant_id = public.app_records_claim('tenant_id')
    and public.app_records_can_read(collection, record_id, payload)
  )
  with check (
    tenant_id = public.app_records_claim('tenant_id')
    and public.app_records_can_write(collection, payload)
  );

create policy "app_records_delete_authenticated"
  on public.app_records for delete
  to authenticated
  using (
    tenant_id = public.app_records_claim('tenant_id')
    and public.app_records_can_read(collection, record_id, payload)
    and public.app_records_can_write(collection, payload)
  );

revoke all on public.app_records from anon;
grant select, insert, update, delete on public.app_records to authenticated;

revoke execute on function public.app_records_claim(text) from public, anon;
revoke execute on function public.app_records_is_manager() from public, anon;
revoke execute on function public.app_records_is_owner(jsonb) from public, anon;
revoke execute on function public.app_records_can_read(text, text, jsonb) from public, anon;
revoke execute on function public.app_records_can_write(text, jsonb) from public, anon;
grant execute on function public.app_records_claim(text) to authenticated;
grant execute on function public.app_records_is_manager() to authenticated;
grant execute on function public.app_records_is_owner(jsonb) to authenticated;
grant execute on function public.app_records_can_read(text, text, jsonb) to authenticated;
grant execute on function public.app_records_can_write(text, jsonb) to authenticated;
