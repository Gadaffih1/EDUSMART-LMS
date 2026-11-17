import type { DatabaseSync } from 'node:sqlite';

/**
 * Additive, Multi-Tenant Normalized Schema for the
 * EduSmart Grade-Based Academic Management and Reporting Structure:
 *   Class Teacher (Stream) -> Senior Teacher (Grade Coordinator) -> School Administrator
 *
 * Strictly preserves all existing LMS tables (tenants, users, students, student_parents,
 * school_grades, school_streams, etc.) without renaming, deleting, or duplicating records.
 */
export function initAcademicHierarchySchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade_number INTEGER,
      level_band TEXT NOT NULL DEFAULT 'Primary',
      academic_year TEXT NOT NULL DEFAULT '2026',
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ah_grades_school_name
      ON grades(school_id, lower(name));
    CREATE INDEX IF NOT EXISTS idx_ah_grades_school_active
      ON grades(school_id, is_active, grade_number);

    CREATE TABLE IF NOT EXISTS streams (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 45,
      room_label TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ah_streams_grade_name
      ON streams(grade_id, lower(name));
    CREATE INDEX IF NOT EXISTS idx_ah_streams_school_grade
      ON streams(school_id, grade_id, is_active);

    CREATE TABLE IF NOT EXISTS grade_senior_teachers (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      teacher_email TEXT,
      academic_year TEXT NOT NULL DEFAULT '2026',
      assigned_by TEXT,
      assigned_at TEXT NOT NULL,
      unassigned_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ah_gst_one_active_grade
      ON grade_senior_teachers(grade_id) WHERE is_active = 1;
    CREATE INDEX IF NOT EXISTS idx_ah_gst_teacher
      ON grade_senior_teachers(school_id, teacher_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_ah_gst_history
      ON grade_senior_teachers(school_id, grade_id, assigned_at);

    CREATE TABLE IF NOT EXISTS stream_class_teachers (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      teacher_email TEXT,
      academic_year TEXT NOT NULL DEFAULT '2026',
      assigned_by TEXT,
      assigned_at TEXT NOT NULL,
      unassigned_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ah_sct_one_active_stream
      ON stream_class_teachers(stream_id) WHERE is_active = 1;
    CREATE INDEX IF NOT EXISTS idx_ah_sct_teacher
      ON stream_class_teachers(school_id, teacher_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_ah_sct_history
      ON stream_class_teachers(school_id, stream_id, assigned_at);

    CREATE TABLE IF NOT EXISTS grade_teacher_assignments (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      academic_year TEXT NOT NULL DEFAULT '2026',
      periods_per_week INTEGER NOT NULL DEFAULT 4,
      is_active INTEGER NOT NULL DEFAULT 1,
      assigned_at TEXT NOT NULL,
      unassigned_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ah_gta_lookup
      ON grade_teacher_assignments(school_id, grade_id, stream_id, is_active);

    CREATE TABLE IF NOT EXISTS student_stream_assignments (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      admission_number TEXT,
      grade_id TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      academic_year TEXT NOT NULL DEFAULT '2026',
      assigned_at TEXT NOT NULL,
      unassigned_at TEXT,
      transfer_reason TEXT,
      transferred_by TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ah_ssa_one_active_student
      ON student_stream_assignments(school_id, student_id) WHERE is_active = 1;
    CREATE INDEX IF NOT EXISTS idx_ah_ssa_stream
      ON student_stream_assignments(school_id, grade_id, stream_id, is_active);

    CREATE TABLE IF NOT EXISTS class_teacher_reports (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      class_teacher_id TEXT NOT NULL,
      class_teacher_name TEXT NOT NULL,
      senior_teacher_id TEXT,
      senior_teacher_name TEXT,
      report_type TEXT NOT NULL DEFAULT 'weekly',
      period_label TEXT NOT NULL,
      academic_year TEXT NOT NULL DEFAULT '2026',
      term TEXT NOT NULL DEFAULT 'Term 1',
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      attendance_rate REAL NOT NULL DEFAULT 0,
      academic_mean REAL NOT NULL DEFAULT 0,
      syllabus_coverage REAL NOT NULL DEFAULT 0,
      assignment_completion REAL NOT NULL DEFAULT 0,
      students_count INTEGER NOT NULL DEFAULT 0,
      intervention_count INTEGER NOT NULL DEFAULT 0,
      challenges TEXT,
      recommendations TEXT,
      metrics_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft',
      submitted_at TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ah_ctr_lookup
      ON class_teacher_reports(school_id, grade_id, stream_id, status);
    CREATE INDEX IF NOT EXISTS idx_ah_ctr_teacher
      ON class_teacher_reports(school_id, class_teacher_id, updated_at);

    CREATE TABLE IF NOT EXISTS senior_teacher_reviews (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      report_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      reviewer_name TEXT NOT NULL,
      decision TEXT NOT NULL DEFAULT 'approved',
      comments TEXT NOT NULL,
      action_items TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (report_id) REFERENCES class_teacher_reports(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ah_str_report
      ON senior_teacher_reviews(school_id, report_id, created_at);

    CREATE TABLE IF NOT EXISTS grade_consolidated_reports (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      senior_teacher_id TEXT NOT NULL,
      senior_teacher_name TEXT NOT NULL,
      report_type TEXT NOT NULL DEFAULT 'consolidated',
      period_label TEXT NOT NULL,
      academic_year TEXT NOT NULL DEFAULT '2026',
      term TEXT NOT NULL DEFAULT 'Term 1',
      title TEXT NOT NULL,
      executive_summary TEXT NOT NULL,
      weak_subjects_json TEXT NOT NULL DEFAULT '[]',
      stream_comparison_json TEXT NOT NULL DEFAULT '[]',
      intervention_summary TEXT,
      recommendations TEXT,
      included_report_ids_json TEXT NOT NULL DEFAULT '[]',
      overall_attendance_rate REAL NOT NULL DEFAULT 0,
      overall_academic_mean REAL NOT NULL DEFAULT 0,
      overall_syllabus_coverage REAL NOT NULL DEFAULT 0,
      total_students INTEGER NOT NULL DEFAULT 0,
      total_streams INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      submitted_at TEXT,
      admin_reviewer_id TEXT,
      admin_reviewer_name TEXT,
      admin_feedback TEXT,
      admin_reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ah_gcr_lookup
      ON grade_consolidated_reports(school_id, grade_id, status, updated_at);

    CREATE TABLE IF NOT EXISTS grade_announcements (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT,
      stream_id TEXT,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL,
      target_audience TEXT NOT NULL DEFAULT 'all_grade',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ah_ann_lookup
      ON grade_announcements(school_id, grade_id, stream_id, created_at);

    CREATE TABLE IF NOT EXISTS student_intervention_records (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      subject_name TEXT,
      category TEXT NOT NULL DEFAULT 'academic_remedial',
      severity TEXT NOT NULL DEFAULT 'moderate',
      baseline_score REAL,
      target_score REAL,
      identified_issue TEXT NOT NULL,
      intervention_plan TEXT NOT NULL,
      recommended_by_id TEXT NOT NULL,
      recommended_by_name TEXT NOT NULL,
      recommended_by_role TEXT NOT NULL,
      assigned_to_id TEXT,
      assigned_to_name TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      parent_notified INTEGER NOT NULL DEFAULT 0,
      outcome_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ah_sir_lookup
      ON student_intervention_records(school_id, grade_id, stream_id, status);

    CREATE TABLE IF NOT EXISTS academic_monitoring_records (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      teacher_id TEXT,
      teacher_name TEXT,
      academic_year TEXT NOT NULL DEFAULT '2026',
      term TEXT NOT NULL DEFAULT 'Term 1',
      week_number INTEGER NOT NULL DEFAULT 1,
      topics_planned INTEGER NOT NULL DEFAULT 10,
      topics_completed INTEGER NOT NULL DEFAULT 0,
      syllabus_coverage_pct REAL NOT NULL DEFAULT 0,
      lessons_scheduled INTEGER NOT NULL DEFAULT 0,
      lessons_delivered INTEGER NOT NULL DEFAULT 0,
      assignment_completion_pct REAL NOT NULL DEFAULT 0,
      assessment_mean_score REAL NOT NULL DEFAULT 0,
      weak_areas TEXT,
      remarks TEXT,
      recorded_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ah_amr_lookup
      ON academic_monitoring_records(school_id, grade_id, stream_id, subject_name);

    CREATE TABLE IF NOT EXISTS grade_notifications (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT,
      stream_id TEXT,
      recipient_user_id TEXT,
      recipient_role TEXT,
      category TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      action_url_tab TEXT,
      related_entity_id TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ah_gn_recipient
      ON grade_notifications(school_id, recipient_user_id, is_read, created_at);
    CREATE INDEX IF NOT EXISTS idx_ah_gn_role_grade
      ON grade_notifications(school_id, recipient_role, grade_id, is_read);

    CREATE TABLE IF NOT EXISTS academic_audit_logs (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      grade_id TEXT,
      stream_id TEXT,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ah_aal_school
      ON academic_audit_logs(school_id, created_at);
  `);
}

export const ACADEMIC_HIERARCHY_TABLES = [
  'grades',
  'streams',
  'grade_senior_teachers',
  'stream_class_teachers',
  'grade_teacher_assignments',
  'student_stream_assignments',
  'class_teacher_reports',
  'senior_teacher_reviews',
  'grade_consolidated_reports',
  'grade_announcements',
  'student_intervention_records',
  'academic_monitoring_records',
  'grade_notifications',
  'academic_audit_logs',
];

function parseGradeNumber(label: string): number | null {
  const m = String(label || '').match(/\b(\d{1,2})\b/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 1 && n <= 12 ? n : null;
}

function inferLevelBand(gradeNum: number | null, label: string): string {
  const low = String(label || '').toLowerCase();
  if (low.includes('pp') || low.includes('pre')) return 'Pre-Primary';
  if (gradeNum !== null) {
    if (gradeNum <= 3) return 'Lower Primary';
    if (gradeNum <= 6) return 'Upper Primary';
    if (gradeNum <= 9) return 'Junior School';
    return 'Senior School';
  }
  return 'Primary';
}

function slugToken(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

/**
 * Non-destructive, idempotent backfill & bridge from existing EduSmart tables
 * (`tenants`, `school_grades`, `school_streams`, `students`, `users`, `collections_store`).
 * Safe to run repeatedly on startup without duplicating or overwriting data.
 */
export function syncAcademicHierarchyFromExistingData(db: DatabaseSync): void {
  const now = new Date().toISOString();
  const tenants = db.prepare(`SELECT id FROM tenants`).all() as Array<{ id: string }>;
  if (tenants.length === 0) return;

  const insertGrade = db.prepare(`
    INSERT OR IGNORE INTO grades
      (id, school_id, name, grade_number, level_band, academic_year, description, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, '2026', ?, 1, ?, ?)
  `);

  const insertStream = db.prepare(`
    INSERT OR IGNORE INTO streams
      (id, school_id, grade_id, name, display_name, capacity, room_label, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 45, ?, 1, ?, ?)
  `);

  for (const tenant of tenants) {
    const schoolId = tenant.id;

    // 1. Copy existing school_grades into normalized grades
    const legacyGrades = db
      .prepare(`SELECT id, name, created_at FROM school_grades WHERE school_id = ?`)
      .all(schoolId) as Array<{ id: string; name: string; created_at: string }>;

    for (const lg of legacyGrades) {
      const num = parseGradeNumber(lg.name);
      const band = inferLevelBand(num, lg.name);
      insertGrade.run(
        lg.id,
        schoolId,
        lg.name.trim(),
        num,
        band,
        `${lg.name.trim()} (${band})`,
        lg.created_at || now,
        now
      );
    }

    // 2. Copy existing school_streams into normalized streams
    const legacyStreams = db
      .prepare(`SELECT id, grade_id, name, display_name, created_at FROM school_streams WHERE school_id = ?`)
      .all(schoolId) as Array<{ id: string; grade_id: string; name: string; display_name: string; created_at: string }>;

    for (const ls of legacyStreams) {
      const parentGrade = db
        .prepare(`SELECT id FROM grades WHERE id = ? AND school_id = ?`)
        .get(ls.grade_id, schoolId) as { id: string } | undefined;
      if (!parentGrade) continue;
      insertStream.run(
        ls.id,
        schoolId,
        ls.grade_id,
        ls.name.trim(),
        ls.display_name || ls.name.trim(),
        ls.display_name || ls.name.trim(),
        ls.created_at || now,
        now
      );
    }

    // 3. Ensure any grades/streams referenced by existing users/students exist in grades & streams
    const schoolUsers = db
      .prepare(`SELECT id, name, email, role, admission_number, is_active, payload_json FROM users WHERE school_id = ?`)
      .all(schoolId) as Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        admission_number: string | null;
        is_active: number;
        payload_json: string;
      }>;

    const findOrCreateGrade = (gradeNumOrName: number | string): { id: string; name: string; grade_number: number | null } => {
      const rawName = typeof gradeNumOrName === 'number' ? `Grade ${gradeNumOrName}` : String(gradeNumOrName).trim();
      const num = typeof gradeNumOrName === 'number' ? gradeNumOrName : parseGradeNumber(rawName);
      const existing = db
        .prepare(
          `SELECT id, name, grade_number FROM grades
           WHERE school_id = ? AND (lower(name) = ? OR (? IS NOT NULL AND grade_number = ?))
           LIMIT 1`
        )
        .get(schoolId, rawName.toLowerCase(), num, num) as { id: string; name: string; grade_number: number | null } | undefined;
      if (existing) return existing;

      const id = `grade-${slugToken(schoolId)}-${slugToken(rawName)}`;
      const band = inferLevelBand(num, rawName);
      insertGrade.run(id, schoolId, rawName, num, band, `${rawName} (${band})`, now, now);
      db.prepare(`INSERT OR IGNORE INTO school_grades (id, school_id, name, created_at) VALUES (?, ?, ?, ?)`).run(
        id,
        schoolId,
        rawName,
        now
      );
      return { id, name: rawName, grade_number: num };
    };

    const findOrCreateStream = (gradeRow: { id: string; name: string }, streamName: string): { id: string; name: string; display_name: string } => {
      const cleanName = String(streamName || '').trim();
      const existing = db
        .prepare(
          `SELECT id, name, display_name FROM streams
           WHERE grade_id = ? AND lower(name) = ?
           LIMIT 1`
        )
        .get(gradeRow.id, cleanName.toLowerCase()) as { id: string; name: string; display_name: string } | undefined;
      if (existing) return existing;

      const displayName = `${gradeRow.name} ${cleanName}`.trim();
      const id = `stream-${slugToken(gradeRow.id)}-${slugToken(cleanName)}`;
      insertStream.run(id, schoolId, gradeRow.id, cleanName, displayName, displayName, now, now);
      db.prepare(
        `INSERT OR IGNORE INTO school_streams (id, school_id, grade_id, name, display_name, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(id, schoolId, gradeRow.id, cleanName, displayName, now);
      return { id, name: cleanName, display_name: displayName };
    };

    // Index existing users by role and attributes
    for (const u of schoolUsers) {
      let payload: Record<string, any> = {};
      try {
        payload = u.payload_json ? JSON.parse(u.payload_json) : {};
      } catch {
        payload = {};
      }
      if (!u.is_active) continue;

      if (u.role === 'student' && payload.grade && payload.stream) {
        const gRow = findOrCreateGrade(Number(payload.grade) || String(payload.grade));
        const sRow = findOrCreateStream(gRow, String(payload.stream));
        const hasActive = db
          .prepare(`SELECT id FROM student_stream_assignments WHERE school_id = ? AND student_id = ? AND is_active = 1`)
          .get(schoolId, u.id);
        if (!hasActive) {
          db.prepare(`
            INSERT OR IGNORE INTO student_stream_assignments
              (id, school_id, student_id, student_name, admission_number, grade_id, stream_id, academic_year, assigned_at, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, '2026', ?, 1, ?, ?)
          `).run(
            `ssa-${slugToken(u.id)}`,
            schoolId,
            u.id,
            u.name,
            u.admission_number || payload.admissionNumber || '',
            gRow.id,
            sRow.id,
            now,
            now,
            now
          );
        }
      }

      if (u.role === 'class_teacher' && payload.grade && payload.stream) {
        const gRow = findOrCreateGrade(Number(payload.grade) || String(payload.grade));
        const sRow = findOrCreateStream(gRow, String(payload.stream));
        const hasActiveCt = db
          .prepare(`SELECT id FROM stream_class_teachers WHERE stream_id = ? AND is_active = 1`)
          .get(sRow.id);
        if (!hasActiveCt) {
          db.prepare(`
            INSERT OR IGNORE INTO stream_class_teachers
              (id, school_id, grade_id, stream_id, teacher_id, teacher_name, teacher_email, academic_year, assigned_by, assigned_at, is_active, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, '2026', 'system-migration', ?, 1, 'Migrated from existing class teacher profile', ?, ?)
          `).run(
            `sct-${slugToken(sRow.id)}-${slugToken(u.id)}`,
            schoolId,
            gRow.id,
            sRow.id,
            u.id,
            u.name,
            u.email,
            now,
            now,
            now
          );
        }
      }

      if (u.role === 'senior_teacher' && payload.grade) {
        const gRow = findOrCreateGrade(Number(payload.grade) || String(payload.grade));
        const hasActiveSt = db
          .prepare(`SELECT id FROM grade_senior_teachers WHERE grade_id = ? AND is_active = 1`)
          .get(gRow.id);
        if (!hasActiveSt) {
          db.prepare(`
            INSERT OR IGNORE INTO grade_senior_teachers
              (id, school_id, grade_id, teacher_id, teacher_name, teacher_email, academic_year, assigned_by, assigned_at, is_active, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, '2026', 'system-migration', ?, 1, 'Migrated from existing senior teacher profile', ?, ?)
          `).run(
            `gst-${slugToken(gRow.id)}-${slugToken(u.id)}`,
            schoolId,
            gRow.id,
            u.id,
            u.name,
            u.email,
            now,
            now,
            now
          );
        }
      }
    }

    // 4. Also bridge rows from normalized `students` table
    const dirStudents = db
      .prepare(`SELECT id, grade_id, stream_id, name, admission_number, grade_label, stream_label, is_active FROM students WHERE school_id = ?`)
      .all(schoolId) as Array<{
        id: string;
        grade_id: string;
        stream_id: string;
        name: string;
        admission_number: string | null;
        grade_label: string | null;
        stream_label: string | null;
        is_active: number;
      }>;

    for (const st of dirStudents) {
      if (!st.is_active) continue;
      const hasActive = db
        .prepare(`SELECT id FROM student_stream_assignments WHERE school_id = ? AND student_id = ? AND is_active = 1`)
        .get(schoolId, st.id);
      if (hasActive) continue;

      let gradeId = st.grade_id;
      let streamId = st.stream_id;

      const gradeExists = gradeId
        ? (db.prepare(`SELECT id, name FROM grades WHERE id = ? AND school_id = ?`).get(gradeId, schoolId) as { id: string; name: string } | undefined)
        : undefined;
      const streamExists = streamId
        ? (db.prepare(`SELECT id FROM streams WHERE id = ? AND school_id = ?`).get(streamId, schoolId) as { id: string } | undefined)
        : undefined;

      if (!gradeExists && st.grade_label) {
        const gRow = findOrCreateGrade(st.grade_label);
        gradeId = gRow.id;
        if (!streamExists && st.stream_label) {
          streamId = findOrCreateStream(gRow, st.stream_label).id;
        }
      } else if (gradeExists && !streamExists && st.stream_label) {
        streamId = findOrCreateStream(gradeExists, st.stream_label).id;
      }

      if (gradeId && streamId) {
        db.prepare(`
          INSERT OR IGNORE INTO student_stream_assignments
            (id, school_id, student_id, student_name, admission_number, grade_id, stream_id, academic_year, assigned_at, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, '2026', ?, 1, ?, ?)
        `).run(
          `ssa-${slugToken(st.id)}`,
          schoolId,
          st.id,
          st.name,
          st.admission_number || '',
          gradeId,
          streamId,
          now,
          now,
          now
        );
      }
    }
  }
}
