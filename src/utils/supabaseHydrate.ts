import { supabase } from '../lib/supabase';

/** Set after the edusmart tables have been copied into localStorage. */
export const REMOTE_DATA_FLAG = 'edusmart_remote_data_v1';

export function isRemoteDataActive(): boolean {
  try {
    return localStorage.getItem(REMOTE_DATA_FLAG) === '1';
  } catch {
    return false;
  }
}

/** Supabase table -> the localStorage key the screens already read. */
const TABLE_KEYS: Record<string, string> = {
  tenants: 'edusmart_all_tenants_registry',
  users: 'edusmart_users_v1',
  grade_passwords: 'edusmart_grade_passwords_v1',
  topics: 'edusmart_topics_v1',
  lesson_notes: 'edusmart_notes_v1',
  videos: 'edusmart_videos_v1',
  audios: 'edusmart_audios_v1',
  quizzes: 'edusmart_quizzes_v1',
  quiz_attempts: 'edusmart_quiz_attempts_v1',
  assignments: 'edusmart_assignments_v1',
  announcements: 'edusmart_announcements_v1',
  virtual_classes: 'edusmart_virtual_classes_v1',
  work_entry_logs: 'edusmart_work_entry_logs_v1',
  gate_exit_passes: 'edusmart_gate_passes_v1',
  attendance: 'edusmart_attendance_v1',
  timetable: 'edusmart_timetable_v1',
  bell_schedule: 'edusmart_bell_schedule_v1',
  fixed_lesson_conditions: 'edusmart_fixed_lessons_v1',
  shared_facilities: 'edusmart_shared_resources_v1',
  lunch_records: 'edusmart_learner_lunch_records_v1',
  report_cards: 'edusmart_report_cards_v1',
  chat_messages: 'edusmart_chat_messages_v1',
  library_books: 'edusmart_library_books_v1',
  borrow_records: 'edusmart_borrow_records_v1',
  notifications: 'edusmart_notifications_v1',
  badges: 'edusmart_badges_v1',
  portfolio_items: 'edusmart_portfolio_v1',
  periodic_reports: 'edusmart_periodic_reports_v1',
  external_tools: 'edusmart_external_tools_v1',
  search_audit_logs: 'edusmart_search_audit_v1',
  calendar_events: 'edusmart_calendar_events_v1',
  parent_communications: 'edusmart_parent_communications_v1',
  exam_timetable: 'edusmart_exam_timetable_v1',
  sanatorium_records: 'edusmart_sanatorium_records_v1',
  school_buses: 'edusmart_transport_buses_v1',
  transport_routes: 'edusmart_transport_routes_v1',
  student_transport_profiles: 'edusmart_transport_students_v1',
  transport_trip_records: 'edusmart_transport_trip_records_v1',
  transport_incidents: 'edusmart_transport_incidents_v1',
  transport_alerts: 'edusmart_transport_alerts_v1',
  co_curricular_activities: 'edusmart_cocurricular_activities_v1',
  learner_co_curricular_profiles: 'edusmart_cocurricular_profiles_v1',
  co_curricular_attendance: 'edusmart_cocurricular_attendance_v1',
  co_curricular_competitions: 'edusmart_cocurricular_competitions_v1',
  co_curricular_equipment: 'edusmart_cocurricular_equipment_v1',
  co_curricular_trips: 'edusmart_cocurricular_trips_v1',
  co_curricular_announcements: 'edusmart_cocurricular_announcements_v1',
  co_curricular_budget: 'edusmart_cocurricular_budget_v1',
  library_reservations: 'edusmart_library_reservations_v1',
  library_fines: 'edusmart_library_fines_v1',
  library_acquisitions: 'edusmart_library_acquisitions_v1',
  library_shelves: 'edusmart_library_shelves_v1',
  digital_library_items: 'edusmart_library_digital_items_v1',
  reading_programme_members: 'edusmart_library_reading_programme_v1',
  library_attendance: 'edusmart_library_attendance_v1',
  library_timetable: 'edusmart_library_timetable_v1',
  library_events: 'edusmart_library_events_v1',
  library_policies: 'edusmart_library_policies_v1',
  library_audit_logs: 'edusmart_library_audit_logs_v1',
  library_rooms: 'edusmart_library_rooms_v1',
  library_room_bookings: 'edusmart_library_room_bookings_v1',
  staff_duty_roster: 'edusmart_staff_duty_rosters_v1',
  dropoff_verifications: 'edusmart_transport_dropoff_verifications_v1',
  lesson_images: 'edusmart_lesson_images_v1',
  e_links: 'edusmart_e_links_v1',
  event_tickets: 'edusmart_event_tickets_v1',
  assessment_records: 'edusmart_assessment_records_v1',
  teacher_upload_assignments: 'edusmart_teacher_upload_assignments_v1',
  coding_challenges: 'edusmart_coding_challenges_v1',
  document_requests: 'edusmart_document_requests_v1',
  document_submissions: 'edusmart_document_submissions_v1',
  post_categories: 'edusmart_post_categories_v1',
  portal_sections: 'edusmart_portal_sections_v1',
  cba_task_mappings: 'edusmart_cba_task_mappings_v1',
  staff_appraisals: 'edusmart_staff_appraisals_v1',
  curriculum_written_reports: 'edusmart_curriculum_written_reports_v1',
  coordinator_schemes_of_work: 'edusmart_coordinator_schemes_of_work_v1',
  coordinator_syllabus_tracking: 'edusmart_coordinator_syllabus_tracking_v1',
  coordinator_cba_moderations: 'edusmart_coordinator_cba_moderations_v1',
  fee_structures: 'edusmart_ops_fee_structures_v1',
  gl_accounts: 'edusmart_ops_gl_accounts_v1',
  budgets: 'edusmart_ops_budgets_v1',
  suppliers: 'edusmart_ops_suppliers_v1',
  requisitions: 'edusmart_ops_requisitions_v1',
  lpos: 'edusmart_ops_lpos_v1',
  inventory: 'edusmart_ops_inventory_v1',
  grns: 'edusmart_ops_grns_v1',
  sivs: 'edusmart_ops_sivs_v1',
  employees: 'edusmart_ops_employees_v1',
  payroll_runs: 'edusmart_ops_payroll_runs_v1',
  audit_logs: 'edusmart_ops_audit_logs_v1',
  platform_admins: 'edusmart_platform_admins_v1',
  system_roles: 'edusmart_system_roles_v1',
  school_accounts: 'edusmart_school_accounts_v1',
  provisioned_accounts: 'edusmart_provisioned_accounts_v1',
  school_grades: 'edusmart_school_grades_v1',
  school_streams: 'edusmart_school_streams_v1',
  students: 'edusmart_students_v1',
  student_parents: 'edusmart_student_parents_v1',
  school_departments: 'edusmart_school_departments_v1',
  subject_catalog: 'edusmart_subjects_v1',
  activity_catalog: 'edusmart_activities_v1',
  hero_video_presets: 'edusmart_hero_video_presets_v1',
  hero_image_presets: 'edusmart_hero_image_presets_v1',
  tpad_standards: 'edusmart_tpad_standards_v1',
  primary_curriculum_demand: 'edusmart_primary_curriculum_demand_v1',
  junior_curriculum_demand: 'edusmart_junior_curriculum_demand_v1',
  starter_package_docs: 'edusmart_starter_package_docs_v1',
};

function camelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
}

function camelRow(row: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === 'row_id') continue;
    next[camelKey(key)] = value;
  }
  return next;
}

function isSchemaMissing(error: { code?: string; message?: string } | null): boolean {
  const code = error?.code || '';
  const message = error?.message || '';
  return code === 'PGRST106' || code === 'PGRST205' || /invalid schema|could not find the table/i.test(message);
}

async function fetchTable(table: string): Promise<Record<string, unknown>[] | null> {
  if (!supabase) return null;
  const pageSize = 1000;
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .schema('edusmart')
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);
    if (error) {
      if (isSchemaMissing(error)) return null;
      console.warn(`[supabase] ${table}: ${error.message}`);
      return from === 0 ? null : rows;
    }
    const batch = (data || []).map((row) => camelRow(row as Record<string, unknown>));
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

async function mapPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  async function run(): Promise<void> {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
}

/** Copies edusmart tables into the keys the app already reads. Leaves the data.ts seeds in place when the schema is not available. */
export async function hydrateFromSupabase(): Promise<boolean> {
  if (!supabase) return false;
  const probe = await fetchTable('tenants');
  if (!probe) {
    console.warn('[supabase] edusmart tables are not available yet. The app is still using the local data files.');
    return false;
  }

  const loaded = new Map<string, Record<string, unknown>[]>();
  loaded.set('tenants', probe);
  const rest = Object.keys(TABLE_KEYS).filter((table) => table !== 'tenants');
  await mapPool(rest, 6, async (table) => {
    const rows = await fetchTable(table);
    if (rows) loaded.set(table, rows);
  });

  for (const [table, rows] of loaded) {
    const key = TABLE_KEYS[table];
    if (!key) continue;
    localStorage.setItem(key, JSON.stringify(rows));
  }

  const departments = loaded.get('school_departments') || [];
  const schoolIds = [...new Set(departments.map((row) => String(row.schoolId || '')).filter(Boolean))];
  if (schoolIds.length > 0) {
    localStorage.setItem('edusmart_school_departments_seeded_v1', JSON.stringify(schoolIds));
    localStorage.setItem('edusmart_department_kinds_v1', JSON.stringify(schoolIds));
  }

  const packRows = await fetchTable('platform_customization');
  if (packRows && packRows[0]) {
    const row = packRows[0];
    const pack = {
      landingPage: row.landingPage || row.landing_page,
      workspaces: row.workspaces,
      globalSettings: row.globalSettings || row.global_settings,
      classTeacherPolicy: row.classTeacherPolicy || row.class_teacher_policy,
      operationsPolicy: row.operationsPolicy || row.operations_policy,
      schoolOverrides: row.schoolOverrides || row.school_overrides,
    };
    localStorage.setItem('edusmart_platform_customization_pack_v1', JSON.stringify(pack));
  }

  localStorage.setItem(REMOTE_DATA_FLAG, '1');
  console.info(`[supabase] Loaded ${loaded.size} tables from edusmart.`);
  return true;
}
