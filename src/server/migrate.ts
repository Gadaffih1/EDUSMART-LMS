import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { getDb, getDbPaths, hashPassword, isHashedPassword } from './db';
import { DEFAULT_PLATFORM_CUSTOMIZATION } from '../data/defaultCustomization';

/** Map from SQL table name in supabase/fresh/*.sql -> frontend collection key */
export const SQL_TABLE_TO_COLLECTION: Record<string, string> = {
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
  platform_customization: 'edusmart_platform_customization_v6',
};

function camelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
}

/** Parse a single SQL value expression from supabase/fresh/*.sql ($es$...$es$, arrays, numbers, booleans, null). */
function parseSqlValue(raw: string): any {
  const s = raw.trim();
  if (s === 'null' || s === 'NULL') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);

  // array[...] ::type[]
  if (s.startsWith('array[')) {
    const closeBracket = findMatchingBracket(s, 5);
    const inner = s.slice(6, closeBracket).trim();
    if (!inner) return [];
    const elements = splitTopLevelComma(inner);
    return elements.map(parseSqlValue);
  }

  // $es$...$es$::jsonb or $es$...$es$
  if (s.startsWith('$es$')) {
    const endIdx = s.indexOf('$es$', 4);
    if (endIdx !== -1) {
      const text = s.slice(4, endIdx);
      const suffix = s.slice(endIdx + 4).trim();
      if (suffix.startsWith('::jsonb') || suffix.startsWith('::json')) {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
      return text;
    }
  }

  // Single-quoted SQL string fallback
  if (s.startsWith("'")) {
    const endQuote = s.lastIndexOf("'");
    if (endQuote > 0) {
      return s.slice(1, endQuote).replace(/''/g, "'");
    }
  }

  return s;
}

function findMatchingBracket(str: string, openIdx: number): number {
  let depth = 0;
  let i = openIdx;
  while (i < str.length) {
    if (str.startsWith('$es$', i)) {
      const end = str.indexOf('$es$', i + 4);
      i = end === -1 ? str.length : end + 4;
      continue;
    }
    const ch = str[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return str.length - 1;
}

function splitTopLevelComma(str: string): string[] {
  const out: string[] = [];
  let start = 0;
  let i = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  while (i < str.length) {
    if (str.startsWith('$es$', i)) {
      const end = str.indexOf('$es$', i + 4);
      i = end === -1 ? str.length : end + 4;
      continue;
    }
    if (str[i] === "'") {
      i++;
      while (i < str.length) {
        if (str[i] === "'" && str[i + 1] === "'") {
          i += 2;
        } else if (str[i] === "'") {
          i++;
          break;
        } else {
          i++;
        }
      }
      continue;
    }
    const ch = str[i];
    if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth--;
    else if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth--;
    else if (ch === ',' && bracketDepth === 0 && parenDepth === 0) {
      out.push(str.slice(start, i));
      start = i + 1;
    }
    i++;
  }
  if (start < str.length) out.push(str.slice(start));
  return out;
}

/** Extract all INSERT statements from a supabase/fresh SQL file. */
export function parseFreshSqlInserts(sqlContent: string): Array<{ table: string; rows: Record<string, any>[] }> {
  const results: Array<{ table: string; rows: Record<string, any>[] }> = [];
  const headerRegex = /insert\s+into\s+"edusmart"\."([a-z0-9_]+)"\s*\(([^)]+)\)\s*values\s*/gi;
  let match: RegExpExecArray | null;

  while ((match = headerRegex.exec(sqlContent)) !== null) {
    const table = match[1];
    const cols = match[2].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    let pos = headerRegex.lastIndex;
    const rows: Record<string, any>[] = [];

    // Parse tuples: (...), (...);
    while (pos < sqlContent.length) {
      while (pos < sqlContent.length && /\s/.test(sqlContent[pos])) pos++;
      if (sqlContent[pos] !== '(') break;

      // Scan matching ')' respecting $es$...$es$ and single quotes
      const tupleStart = pos + 1;
      pos++;
      let depth = 1;
      while (pos < sqlContent.length && depth > 0) {
        if (sqlContent.startsWith('$es$', pos)) {
          const end = sqlContent.indexOf('$es$', pos + 4);
          pos = end === -1 ? sqlContent.length : end + 4;
          continue;
        }
        if (sqlContent[pos] === "'") {
          pos++;
          while (pos < sqlContent.length) {
            if (sqlContent[pos] === "'" && sqlContent[pos + 1] === "'") {
              pos += 2;
            } else if (sqlContent[pos] === "'") {
              pos++;
              break;
            } else {
              pos++;
            }
          }
          continue;
        }
        if (sqlContent[pos] === '(') depth++;
        else if (sqlContent[pos] === ')') depth--;
        pos++;
      }

      const tupleInner = sqlContent.slice(tupleStart, pos - 1);
      const rawValues = splitTopLevelComma(tupleInner);
      const obj: Record<string, any> = {};
      cols.forEach((col, idx) => {
        if (col === 'row_id') return;
        obj[camelKey(col)] = idx < rawValues.length ? parseSqlValue(rawValues[idx]) : null;
      });
      rows.push(obj);

      while (pos < sqlContent.length && /[\s,]/.test(sqlContent[pos])) {
        if (sqlContent[pos] === ';') {
          pos++;
          break;
        }
        pos++;
      }
      if (sqlContent[pos - 1] === ';' || sqlContent[pos] === ';') {
        if (sqlContent[pos] === ';') pos++;
        break;
      }
    }

    if (rows.length > 0) {
      results.push({ table, rows });
    }
    headerRegex.lastIndex = pos;
  }

  return results;
}

const GLOBAL_COLLECTIONS = new Set([
  'edusmart_all_tenants_registry',
  'edusmart_platform_customization_v6',
  'edusmart_platform_customization_pack_v1',
  'edusmart_platform_admins_v1',
  'edusmart_system_roles_v1',
  'edusmart_subjects_v1',
  'edusmart_activities_v1',
  'edusmart_hero_video_presets_v1',
  'edusmart_hero_image_presets_v1',
  'edusmart_tpad_standards_v1',
  'edusmart_primary_curriculum_demand_v1',
  'edusmart_junior_curriculum_demand_v1',
  'edusmart_starter_package_docs_v1',
  'edusmart_school_registry_v1',
  'edusmart_school_accounts_v1',
  'edusmart_vlab_ticket_passes',
]);

export function resolveRecordTenantId(collectionKey: string, record: any, fallbackTenant = 'global'): string {
  if (GLOBAL_COLLECTIONS.has(collectionKey)) return 'global';
  if (record && typeof record === 'object') {
    const t = record.schoolId || record.tenantId || record.school_id || record.tenant_id;
    if (typeof t === 'string' && t.trim()) return t.trim();
  }
  return fallbackTenant || 'global';
}

export function resolveRecordId(record: any, index: number): string {
  if (record && typeof record === 'object' && !Array.isArray(record)) {
    if (record.id !== undefined && record.id !== null && String(record.id) !== '') {
      return String(record.id);
    }
    if (record.grade !== undefined && record.schoolId !== undefined) {
      return `${record.schoolId}-grade-${record.grade}`;
    }
    if (record.code !== undefined) {
      return String(record.code);
    }
    if (record.subject !== undefined) {
      return String(record.subject);
    }
  }
  return `idx:${index}`;
}

export function upsertCollectionRecord(
  db: DatabaseSync,
  collectionKey: string,
  recordId: string,
  tenantId: string,
  payload: any,
  onlyIfMissing = false
): void {
  const now = new Date().toISOString();
  const safePayload = payload;
  const json = JSON.stringify(safePayload);

  if (onlyIfMissing) {
    db.prepare(
      `INSERT OR IGNORE INTO collections_store (collection_key, tenant_id, record_id, payload_json, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, NULL)`
    ).run(collectionKey, tenantId, recordId, json, now);
  } else {
    db.prepare(
      `INSERT INTO collections_store (collection_key, tenant_id, record_id, payload_json, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, NULL)
       ON CONFLICT(collection_key, tenant_id, record_id)
       DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at, deleted_at = NULL`
    ).run(collectionKey, tenantId, recordId, json, now);
  }
}

function upsertRelationalRow(db: DatabaseSync, collectionKey: string, item: any, onlyIfMissing: boolean): void {
  if (!item || typeof item !== 'object') return;
  const now = new Date().toISOString();
  const mode = onlyIfMissing ? 'INSERT OR IGNORE' : 'INSERT OR REPLACE';

  if (collectionKey === 'edusmart_all_tenants_registry' || collectionKey === 'tenants' || collectionKey === 'edusmart_school_registry_v1') {
    if (!item.id || !item.name) return;
    db.prepare(
      `${mode} INTO tenants (id, name, short_name, code, domain, email, theme_color, payload_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(item.id),
      String(item.name),
      item.shortName || item.name,
      item.code || '',
      item.domain || '',
      item.email || '',
      item.themeColor || 'blue',
      JSON.stringify(item),
      now
    );
    return;
  }

  if (collectionKey === 'edusmart_users_v1') {
    if (!item.id || !item.email) return;
    const rawPass = item.password || item.passwordHash || 'admin2026';
    const passHash = isHashedPassword(rawPass) ? rawPass : hashPassword(String(rawPass));
    const cleanPayload = { ...item };
    delete cleanPayload.password;
    delete cleanPayload.passwordHash;
    db.prepare(
      `${mode} INTO users (id, email, name, role, school_id, admission_number, staff_number, tsc_number, password_hash, is_active, payload_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(item.id),
      String(item.email).trim().toLowerCase(),
      String(item.name || 'User'),
      String(item.role || 'student'),
      String(item.schoolId || 'tenant-riara'),
      item.admissionNumber || null,
      item.staffNumber || null,
      item.tscNumber || null,
      passHash,
      item.isActive === false ? 0 : 1,
      JSON.stringify(cleanPayload),
      now
    );
    return;
  }

  if (collectionKey === 'edusmart_platform_admins_v1') {
    if (!item.id || !item.email) return;
    const rawPass = item.password || item.passwordHash || '';
    const passHash = isHashedPassword(rawPass) ? rawPass : hashPassword(String(rawPass));
    db.prepare(
      `${mode} INTO platform_admins (id, name, email, password_hash, rights_json, access_scope, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(item.id),
      String(item.name || 'Platform Super Admin'),
      String(item.email).trim().toLowerCase(),
      passHash,
      JSON.stringify(item.rights || ['super_admin_page']),
      String(item.accessScope || 'super_admin_only'),
      item.isActive === false ? 0 : 1,
      now
    );
    return;
  }

  if (collectionKey === 'edusmart_system_roles_v1') {
    if (!item.id || !item.slug) return;
    db.prepare(
      `${mode} INTO system_roles (id, name, slug, password_prefix, number_kind, built_in, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(item.id),
      String(item.name),
      String(item.slug),
      String(item.passwordPrefix || 'rl'),
      String(item.numberKind || 'staff'),
      item.builtIn ? 1 : 0,
      item.isActive === false ? 0 : 1
    );
    return;
  }

  if (collectionKey === 'edusmart_school_accounts_v1') {
    if (!item.id || !item.email) return;
    const rawPass = item.password || item.passwordHash || '';
    const passHash = isHashedPassword(rawPass) ? rawPass : hashPassword(String(rawPass));
    db.prepare(
      `${mode} INTO school_accounts (id, school_id, email, password_hash, domain, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(item.id),
      String(item.schoolId || ''),
      String(item.email).trim().toLowerCase(),
      passHash,
      String(item.domain || ''),
      String(item.createdAt || now),
      now
    );
    return;
  }

  if (collectionKey === 'edusmart_provisioned_accounts_v1') {
    if (!item.id || !item.email) return;
    const rawPass = item.password || item.passwordHash || '';
    const passHash = isHashedPassword(rawPass) ? rawPass : hashPassword(String(rawPass));
    const cleanPayload = { ...item };
    delete cleanPayload.password;
    db.prepare(
      `${mode} INTO provisioned_accounts (id, school_id, name, email, password_hash, role, admission_number, staff_number, phone, grade, stream, is_active, created_at, payload_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(item.id),
      String(item.schoolId || 'tenant-riara'),
      String(item.name || ''),
      String(item.email).trim().toLowerCase(),
      passHash,
      String(item.role || 'student'),
      item.admissionNumber || null,
      item.staffNumber || null,
      item.phone || null,
      item.grade ?? null,
      item.stream || null,
      item.isActive === false ? 0 : 1,
      String(item.createdAt || now),
      JSON.stringify(cleanPayload)
    );
    return;
  }

  if (collectionKey === 'edusmart_school_grades_v1') {
    if (!item.id || !item.schoolId) return;
    db.prepare(
      `${mode} INTO school_grades (id, school_id, name, created_at) VALUES (?, ?, ?, ?)`
    ).run(String(item.id), String(item.schoolId), String(item.name), String(item.createdAt || now));
    return;
  }

  if (collectionKey === 'edusmart_school_streams_v1') {
    if (!item.id || !item.schoolId) return;
    db.prepare(
      `${mode} INTO school_streams (id, school_id, grade_id, name, display_name, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      String(item.id),
      String(item.schoolId),
      String(item.gradeId || ''),
      String(item.name),
      String(item.displayName || item.name),
      String(item.createdAt || now)
    );
    return;
  }

  if (collectionKey === 'edusmart_students_v1') {
    if (!item.id || !item.schoolId) return;
    const rawPass = item.password || item.passwordHash || 'GR4@2026';
    const passHash = isHashedPassword(rawPass) ? rawPass : hashPassword(String(rawPass));
    const cleanPayload = { ...item };
    delete cleanPayload.password;
    db.prepare(
      `${mode} INTO students (id, school_id, grade_id, stream_id, name, email, password_hash, admission_number, phone, upi_number, grade_label, stream_label, class_name, is_active, created_at, rights_json, payload_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(item.id),
      String(item.schoolId),
      String(item.gradeId || ''),
      String(item.streamId || ''),
      String(item.name || ''),
      String(item.email || '').trim().toLowerCase(),
      passHash,
      item.admissionNumber || '',
      item.phone || '',
      item.upiNumber || '',
      item.gradeLabel || '',
      item.streamLabel || '',
      item.className || '',
      item.isActive === false ? 0 : 1,
      String(item.createdAt || now),
      JSON.stringify(item.rights || {}),
      JSON.stringify(cleanPayload)
    );
    return;
  }

  if (collectionKey === 'edusmart_student_parents_v1') {
    if (!item.id || !item.schoolId) return;
    const rawPass = item.password || item.passwordHash || 'parent2026';
    const passHash = isHashedPassword(rawPass) ? rawPass : hashPassword(String(rawPass));
    const cleanPayload = { ...item };
    delete cleanPayload.password;
    db.prepare(
      `${mode} INTO student_parents (id, school_id, student_id, name, email, password_hash, phone, relationship, created_at, payload_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(item.id),
      String(item.schoolId),
      String(item.studentId || ''),
      String(item.name || ''),
      String(item.email || '').trim().toLowerCase(),
      passHash,
      item.phone || '',
      item.relationship || 'Parent',
      String(item.createdAt || now),
      JSON.stringify(cleanPayload)
    );
    return;
  }

  if (collectionKey === 'edusmart_school_departments_v1') {
    if (!item.id || !item.schoolId) return;
    db.prepare(
      `${mode} INTO school_departments (id, school_id, name, kind, subjects_json, activities_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(item.id),
      String(item.schoolId),
      String(item.name),
      item.kind || null,
      JSON.stringify(item.subjects || []),
      JSON.stringify(item.activities || []),
      String(item.createdAt || now)
    );
  }
}

export function ingestCollectionData(
  db: DatabaseSync,
  collectionKey: string,
  data: any,
  onlyIfMissing: boolean
): number {
  let count = 0;
  if (Array.isArray(data)) {
    data.forEach((item, idx) => {
      if (item === undefined || item === null) return;
      // Preserve operational/relational rows AND store sanitized copy in collections_store
      const tenantId = resolveRecordTenantId(collectionKey, item);
      const recordId = resolveRecordId(item, idx);
      // Do NOT store plaintext passwords inside collections_store for accounts
      let storePayload = item;
      if (
        (collectionKey === 'edusmart_users_v1' ||
          collectionKey === 'edusmart_platform_admins_v1' ||
          collectionKey === 'edusmart_school_accounts_v1' ||
          collectionKey === 'edusmart_provisioned_accounts_v1' ||
          collectionKey === 'edusmart_students_v1' ||
          collectionKey === 'edusmart_student_parents_v1') &&
        item &&
        typeof item === 'object'
      ) {
        const clone = { ...item };
        delete clone.password;
        delete clone.passwordHash;
        storePayload = clone;
      }

      upsertRelationalRow(db, collectionKey, item, onlyIfMissing);
      upsertCollectionRecord(db, collectionKey, recordId, tenantId, storePayload, onlyIfMissing);
      count++;
    });
  } else if (data && typeof data === 'object') {
    const tenantId = resolveRecordTenantId(collectionKey, data);
    upsertCollectionRecord(db, collectionKey, 'singleton', tenantId, data, onlyIfMissing);
    count = 1;
  }
  return count;
}

/** Runs on server startup. Idempotent and non-destructive. */
export function runDatabaseMigrations(rootDir: string = process.cwd()): void {
  const db = getDb();
  const { legacyJsonPath } = getDbPaths(rootDir);

  const tx = () => {
    db.exec('BEGIN IMMEDIATE');
    try {
      // 1. Seed from data/server_db.json FIRST (preserves all existing production/session edits, 160 users, 32 invoices, etc.)
      if (fs.existsSync(legacyJsonPath)) {
        const alreadyImported = db
          .prepare(`SELECT value FROM migration_meta WHERE key = 'legacy_json_imported_v1'`)
          .get() as { value: string } | undefined;

        if (!alreadyImported) {
          const raw = fs.readFileSync(legacyJsonPath, 'utf-8');
          const parsed = JSON.parse(raw);
          const collections = parsed?.collections || {};
          let importedCount = 0;

          for (const [key, val] of Object.entries(collections)) {
            const targetKey = key === 'tenants' ? 'edusmart_all_tenants_registry' : key === 'platform_customization' ? 'edusmart_platform_customization_pack_v1' : key;
            // Notice: platform_customization in server_db.json may be an array of 1 item -> normalize pack singleton
            const normalizedVal =
              key === 'platform_customization' && Array.isArray(val) && val[0] ? val[0] : val;
            importedCount += ingestCollectionData(db, targetKey, normalizedVal, true);
          }

          db.prepare(
            `INSERT OR REPLACE INTO migration_meta (key, value, applied_at) VALUES (?, ?, ?)`
          ).run('legacy_json_imported_v1', String(importedCount), new Date().toISOString());
          console.info(`[db] Imported ${importedCount} existing records from data/server_db.json`);
        }
      }

      // 2. Seed all missing tables & starter collections from supabase/fresh/*.sql (INSERT OR IGNORE)
      const freshSqlDir = path.resolve(rootDir, 'supabase', 'fresh');
      const sqlSeedDone = db
        .prepare(`SELECT value FROM migration_meta WHERE key = 'fresh_sql_seeded_v1'`)
        .get() as { value: string } | undefined;

      if (fs.existsSync(freshSqlDir) && !sqlSeedDone) {
        const files = fs
          .readdirSync(freshSqlDir)
          .filter((f) => f.endsWith('.sql') && f !== '00_run_order.sql' && f !== '22_browser_access.sql')
          .sort();

        let sqlRowsTotal = 0;
        for (const file of files) {
          const sqlContent = fs.readFileSync(path.join(freshSqlDir, file), 'utf-8');
          const parsedTables = parseFreshSqlInserts(sqlContent);
          for (const { table, rows } of parsedTables) {
            const colKey = SQL_TABLE_TO_COLLECTION[table] || `edusmart_${table}_v1`;
            if (table === 'platform_customization' && rows[0]) {
              const pack = {
                landingPage: rows[0].landingPage,
                workspaces: rows[0].workspaces,
                globalSettings: rows[0].globalSettings,
                classTeacherPolicy: rows[0].classTeacherPolicy,
                operationsPolicy: rows[0].operationsPolicy,
                schoolOverrides: rows[0].schoolOverrides,
              };
              sqlRowsTotal += ingestCollectionData(db, 'edusmart_platform_customization_pack_v1', pack, true);
              sqlRowsTotal += ingestCollectionData(db, 'edusmart_platform_customization_v6', pack, true);
            } else {
              sqlRowsTotal += ingestCollectionData(db, colKey, rows, true);
            }
          }
        }

        // Mark departments seeded for existing tenants present in SQL
        const deptSchools = db.prepare(`SELECT DISTINCT school_id FROM school_departments`).all() as Array<{ school_id: string }>;
        if (deptSchools.length > 0) {
          const schoolIds = deptSchools.map((r) => r.school_id);
          upsertCollectionRecord(db, 'edusmart_school_departments_seeded_v1', 'singleton', 'global', schoolIds, true);
          upsertCollectionRecord(db, 'edusmart_department_kinds_v1', 'singleton', 'global', schoolIds, true);
        }

        db.prepare(
          `INSERT OR REPLACE INTO migration_meta (key, value, applied_at) VALUES (?, ?, ?)`
        ).run('fresh_sql_seeded_v1', String(sqlRowsTotal), new Date().toISOString());
        console.info(`[db] Merged ${sqlRowsTotal} seed rows from supabase/fresh/*.sql (non-destructive)`);
      }

      // 3. Ensure default platform_admins exists if table ended up empty (safety guard)
      const adminCount = (db.prepare(`SELECT COUNT(*) as c FROM platform_admins`).get() as { c: number }).c;
      if (adminCount === 0) {
        ingestCollectionData(
          db,
          'edusmart_platform_admins_v1',
          [
            {
              id: 'platform-admin-1',
              name: 'Platform Super Admin',
              email: 'admin@edutech.ac.ke',
              password: hashPassword('1234'),
              rights: ['super_admin_page'],
              accessScope: 'super_admin_only',
              isActive: true,
            },
          ],
          true
        );
      }

      // 4. Strictly seed platform & per-school settings while retaining all existing settings
      seedAndRetainSettings(db);

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };

  tx();
}

function deepMergeRetainingExisting<T extends Record<string, any>>(defaultsObj: T, existingObj: any): T {
  if (!existingObj || typeof existingObj !== 'object' || Array.isArray(existingObj)) {
    return JSON.parse(JSON.stringify(defaultsObj));
  }
  const result: Record<string, any> = { ...defaultsObj };
  for (const [key, val] of Object.entries(existingObj)) {
    if (val === undefined || val === null) continue;
    const defVal = result[key];
    if (
      defVal &&
      typeof defVal === 'object' &&
      !Array.isArray(defVal) &&
      typeof val === 'object' &&
      !Array.isArray(val)
    ) {
      result[key] = deepMergeRetainingExisting(defVal, val);
    } else if (Array.isArray(val) && val.length === 0 && Array.isArray(defVal) && defVal.length > 0) {
      result[key] = defVal;
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

/**
 * Retains 100% of current platform customization & tenant branding settings while
 * strictly seeding missing default policy keys (including virtualLabPolicy) and
 * populating per-school institutional settings rows in `school_settings`.
 */
export function seedAndRetainSettings(db: DatabaseSync): void {
  const now = new Date().toISOString();

  // A. Read existing platform customization pack (checking v6 first, then pack_v1)
  const v6Row = db
    .prepare(
      `SELECT payload_json FROM collections_store
       WHERE collection_key = 'edusmart_platform_customization_v6' AND deleted_at IS NULL
       ORDER BY updated_at DESC LIMIT 1`
    )
    .get() as { payload_json: string } | undefined;

  const packRow = db
    .prepare(
      `SELECT payload_json FROM collections_store
       WHERE collection_key = 'edusmart_platform_customization_pack_v1' AND deleted_at IS NULL
       ORDER BY updated_at DESC LIMIT 1`
    )
    .get() as { payload_json: string } | undefined;

  let existingPack: any = null;
  for (const candidate of [v6Row, packRow]) {
    if (candidate?.payload_json) {
      try {
        const parsed = JSON.parse(candidate.payload_json);
        if (parsed && typeof parsed === 'object') {
          existingPack = parsed;
          break;
        }
      } catch {
        // ignore malformed row
      }
    }
  }

  const mergedPlatform = deepMergeRetainingExisting(DEFAULT_PLATFORM_CUSTOMIZATION as any, existingPack);
  // Strictly enforce subscription-required Virtual Lab policy on public page
  mergedPlatform.globalSettings = {
    ...(mergedPlatform.globalSettings || {}),
    virtualLabPolicy: {
      publicAccessMode: 'subscription_required',
      requirePaidSubscriptionOnPublicPage: true,
      allowFreePublicDemo: false,
      freeForMemberSchools: true,
    },
  };
  // Keep packages hidden from public portal view while retaining all other landing customization
  if (mergedPlatform.landingPage) {
    mergedPlatform.landingPage.visibility = {
      ...(mergedPlatform.landingPage.visibility || {}),
      pricing: false,
    };
    if (Array.isArray(mergedPlatform.landingPage.header?.navLinks)) {
      mergedPlatform.landingPage.header.navLinks = mergedPlatform.landingPage.header.navLinks.map(
        (link: any) =>
          link?.id === 'nav-pricing' || link?.sectionId === 'pricing-section'
            ? { ...link, enabled: false }
            : link
      );
    }
  }

  upsertCollectionRecord(db, 'edusmart_platform_customization_v6', 'singleton', 'global', mergedPlatform, false);
  upsertCollectionRecord(db, 'edusmart_platform_customization_pack_v1', 'singleton', 'global', mergedPlatform, false);

  // B. Seed per-school settings rows in `school_settings` for every tenant (INSERT OR IGNORE)
  const tenants = db
    .prepare(`SELECT id, name, code, payload_json FROM tenants`)
    .all() as Array<{ id: string; name: string; code: string; payload_json: string }>;

  const insertSettingStmt = db.prepare(
    `INSERT OR IGNORE INTO school_settings (school_id, setting_key, payload_json, updated_at)
     VALUES (?, ?, ?, ?)`
  );

  let seededCount = 0;
  for (const tenant of tenants) {
    let parsedTenant: Record<string, any> = {};
    try {
      parsedTenant = tenant.payload_json ? JSON.parse(tenant.payload_json) : {};
    } catch {
      parsedTenant = {};
    }

    const schoolDefaults: Array<[string, Record<string, any>]> = [
      [
        'profile_and_branding',
        {
          id: tenant.id,
          name: parsedTenant.name || tenant.name,
          shortName: parsedTenant.shortName || parsedTenant.name || tenant.name,
          code: parsedTenant.code || tenant.code,
          motto: parsedTenant.motto || 'Excellence & Integrity',
          location: parsedTenant.location || 'Kenya',
          primaryColor: parsedTenant.primaryColor || '#2563eb',
          logoUrl: parsedTenant.logoUrl || '',
        },
      ],
      [
        'academic_calendar',
        {
          currentYear: '2026',
          currentTerm: 1,
          termLabel: 'Term 1, 2026',
          curriculum: parsedTenant.curriculum || 'Kenyan CBC & JSS',
          gradingScale: 'CBC 4-Level (EE, ME, AE, BE)',
        },
      ],
      [
        'portal_and_virtual_lab',
        {
          virtualLabBundledForSchool: true,
          publicVirtualLabRequiresSubscription: true,
          allowParentPortal: true,
          allowStudentPortal: true,
        },
      ],
      [
        'operations_and_finance',
        {
          currency: 'KES',
          mpesaIntegrated: true,
          strictBudgetEnforcement: true,
          approvalThresholdKes: 50000,
        },
      ],
      [
        'notifications_and_attendance',
        {
          smsGateExitAlerts: true,
          morningRollCallDeadline: '08:30 AM',
          emailDigestEnabled: true,
        },
      ],
    ];

    for (const [settingKey, payload] of schoolDefaults) {
      const info = insertSettingStmt.run(tenant.id, settingKey, JSON.stringify(payload), now);
      if (info.changes > 0) seededCount++;
    }
  }

  db.prepare(
    `INSERT OR REPLACE INTO migration_meta (key, value, applied_at) VALUES (?, ?, ?)`
  ).run('settings_seeded_v1', `${tenants.length} tenants:${seededCount} inserted`, now);
}
