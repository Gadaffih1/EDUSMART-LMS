import type { DatabaseSync } from 'node:sqlite';

/**
 * Additive, Multi-Tenant Normalized Schema for the
 * EduSmart Intelligent Automatic Timetable Management System.
 *
 * Strictly preserves all existing LMS tables (users, students, tenants,
 * school_grades, school_streams, etc.) without renaming, altering, or dropping.
 */
export function initTimetableSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tt_configs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      academic_year TEXT NOT NULL DEFAULT '2026',
      term TEXT NOT NULL DEFAULT 'Term 1',
      cycle_days INTEGER NOT NULL DEFAULT 5,
      working_days_json TEXT NOT NULL DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
      default_periods_per_day INTEGER NOT NULL DEFAULT 8,
      cycle_label TEXT NOT NULL DEFAULT 'Weekly (Mon-Fri)',
      active_version_id TEXT,
      updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tt_configs_tenant_term
      ON tt_configs(tenant_id, academic_year, term);

    CREATE TABLE IF NOT EXISTS tt_grade_schedules (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      config_id TEXT NOT NULL,
      grade INTEGER NOT NULL,
      periods_per_day INTEGER NOT NULL DEFAULT 8,
      working_days_json TEXT NOT NULL,
      assembly_day TEXT DEFAULT 'Monday',
      assembly_period INTEGER DEFAULT 0,
      custom_notes TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (config_id) REFERENCES tt_configs(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tt_grade_sched_unique
      ON tt_grade_schedules(config_id, grade);

    CREATE TABLE IF NOT EXISTS tt_periods (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      config_id TEXT NOT NULL,
      grade_band TEXT NOT NULL DEFAULT 'all',
      period_number INTEGER NOT NULL,
      label TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'lesson',
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (config_id) REFERENCES tt_configs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tt_periods_cfg
      ON tt_periods(config_id, grade_band, sort_order);

    CREATE TABLE IF NOT EXISTS tt_subjects (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'General',
      is_practical INTEGER NOT NULL DEFAULT 0,
      requires_room_type TEXT DEFAULT 'general',
      color_token TEXT DEFAULT 'slate',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tt_subjects_tenant_name
      ON tt_subjects(tenant_id, lower(name));

    CREATE TABLE IF NOT EXISTS tt_departments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL DEFAULT '',
      hod_user_id TEXT DEFAULT '',
      head_name TEXT DEFAULT '',
      description TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tt_departments_tenant_name
      ON tt_departments(tenant_id, lower(name));

    CREATE TABLE IF NOT EXISTS tt_classrooms (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      room_code TEXT NOT NULL,
      room_type TEXT NOT NULL DEFAULT 'general',
      capacity INTEGER NOT NULL DEFAULT 45,
      location TEXT DEFAULT 'Main Block',
      assigned_grade INTEGER,
      assigned_stream TEXT,
      availability_json TEXT NOT NULL DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tt_classrooms_tenant
      ON tt_classrooms(tenant_id, room_type, is_active);

    CREATE TABLE IF NOT EXISTS tt_student_groups (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      grade INTEGER NOT NULL,
      stream TEXT NOT NULL,
      group_name TEXT NOT NULL,
      group_code TEXT NOT NULL,
      student_count INTEGER NOT NULL DEFAULT 35,
      is_whole_class INTEGER NOT NULL DEFAULT 1,
      parent_class_key TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tt_groups_tenant_class
      ON tt_student_groups(tenant_id, grade, stream);

    CREATE TABLE IF NOT EXISTS tt_teacher_profiles (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      teacher_email TEXT NOT NULL,
      tsc_number TEXT,
      department TEXT DEFAULT 'Academic',
      qualified_subjects_json TEXT NOT NULL DEFAULT '[]',
      availability_json TEXT NOT NULL DEFAULT '{}',
      max_daily_periods INTEGER NOT NULL DEFAULT 6,
      max_weekly_periods INTEGER NOT NULL DEFAULT 28,
      max_consecutive_lessons INTEGER NOT NULL DEFAULT 3,
      preferred_free_periods_json TEXT NOT NULL DEFAULT '[]',
      active_in_timetable INTEGER NOT NULL DEFAULT 1,
      archived_at TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tt_teacher_tenant_user
      ON tt_teacher_profiles(tenant_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_tt_teacher_email
      ON tt_teacher_profiles(tenant_id, lower(teacher_email));

    CREATE TABLE IF NOT EXISTS tt_grade_subject_allocations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      config_id TEXT NOT NULL,
      grade INTEGER NOT NULL,
      subject_name TEXT NOT NULL,
      required_weekly_periods INTEGER NOT NULL DEFAULT 4,
      single_lessons INTEGER NOT NULL DEFAULT 4,
      double_lessons INTEGER NOT NULL DEFAULT 0,
      triple_lessons INTEGER NOT NULL DEFAULT 0,
      pattern_preference TEXT NOT NULL DEFAULT 'spread',
      max_per_day INTEGER NOT NULL DEFAULT 1,
      min_spacing_days INTEGER NOT NULL DEFAULT 0,
      preferred_days_json TEXT NOT NULL DEFAULT '[]',
      preferred_periods_json TEXT NOT NULL DEFAULT '[]',
      required_room_type TEXT DEFAULT 'general',
      default_room_id TEXT,
      teacher_ids_json TEXT NOT NULL DEFAULT '[]',
      student_group_label TEXT DEFAULT 'Whole Class',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (config_id) REFERENCES tt_configs(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tt_grade_alloc_unique
      ON tt_grade_subject_allocations(config_id, grade, lower(subject_name));

    CREATE TABLE IF NOT EXISTS tt_stream_subject_allocations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      config_id TEXT NOT NULL,
      grade INTEGER NOT NULL,
      stream TEXT NOT NULL,
      group_id TEXT,
      subject_name TEXT NOT NULL,
      inherited_from_id TEXT,
      is_overridden INTEGER NOT NULL DEFAULT 0,
      required_weekly_periods INTEGER NOT NULL DEFAULT 4,
      single_lessons INTEGER NOT NULL DEFAULT 4,
      double_lessons INTEGER NOT NULL DEFAULT 0,
      triple_lessons INTEGER NOT NULL DEFAULT 0,
      pattern_preference TEXT NOT NULL DEFAULT 'spread',
      max_per_day INTEGER NOT NULL DEFAULT 1,
      min_spacing_days INTEGER NOT NULL DEFAULT 0,
      preferred_days_json TEXT NOT NULL DEFAULT '[]',
      preferred_periods_json TEXT NOT NULL DEFAULT '[]',
      required_room_type TEXT DEFAULT 'general',
      room_id TEXT,
      teacher_ids_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (config_id) REFERENCES tt_configs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tt_stream_alloc_lookup
      ON tt_stream_subject_allocations(config_id, grade, stream);

    CREATE TABLE IF NOT EXISTS tt_joint_lessons (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      config_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      participating_classes_json TEXT NOT NULL DEFAULT '[]',
      teacher_ids_json TEXT NOT NULL DEFAULT '[]',
      weekly_periods INTEGER NOT NULL DEFAULT 1,
      lesson_length INTEGER NOT NULL DEFAULT 1,
      room_id TEXT,
      required_room_type TEXT DEFAULT 'hall',
      combined_students INTEGER NOT NULL DEFAULT 0,
      preferred_days_json TEXT NOT NULL DEFAULT '[]',
      preferred_periods_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (config_id) REFERENCES tt_configs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tt_joint_cfg
      ON tt_joint_lessons(config_id, tenant_id);

    CREATE TABLE IF NOT EXISTS tt_versions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      config_id TEXT NOT NULL,
      version_number INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      metrics_json TEXT NOT NULL DEFAULT '{}',
      review_comments TEXT,
      created_by TEXT NOT NULL,
      created_by_name TEXT,
      approved_by TEXT,
      approved_at TEXT,
      published_by TEXT,
      published_at TEXT,
      withdrawn_at TEXT,
      parent_version_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (config_id) REFERENCES tt_configs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tt_versions_tenant_status
      ON tt_versions(tenant_id, status, updated_at);

    CREATE TABLE IF NOT EXISTS tt_entries (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      period_number INTEGER NOT NULL,
      grade INTEGER NOT NULL,
      stream TEXT NOT NULL,
      stream_label TEXT NOT NULL,
      group_id TEXT,
      group_name TEXT DEFAULT 'Whole Class',
      joint_lesson_id TEXT,
      allocation_id TEXT,
      subject_name TEXT NOT NULL,
      teacher_ids_json TEXT NOT NULL DEFAULT '[]',
      teacher_names_json TEXT NOT NULL DEFAULT '[]',
      room_id TEXT,
      room_name TEXT,
      session_block_id TEXT NOT NULL,
      block_length INTEGER NOT NULL DEFAULT 1,
      block_index INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      locked_by TEXT,
      notes TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (version_id) REFERENCES tt_versions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tt_entries_version
      ON tt_entries(version_id, day_of_week, period_number);
    CREATE INDEX IF NOT EXISTS idx_tt_entries_class
      ON tt_entries(version_id, grade, stream);

    CREATE TABLE IF NOT EXISTS tt_unscheduled_sessions (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      session_key TEXT NOT NULL,
      allocation_id TEXT,
      joint_lesson_id TEXT,
      grade INTEGER NOT NULL,
      stream TEXT NOT NULL,
      group_id TEXT,
      group_name TEXT DEFAULT 'Whole Class',
      subject_name TEXT NOT NULL,
      teacher_ids_json TEXT NOT NULL DEFAULT '[]',
      teacher_names_json TEXT NOT NULL DEFAULT '[]',
      block_length INTEGER NOT NULL DEFAULT 1,
      required_room_type TEXT DEFAULT 'general',
      reason TEXT NOT NULL,
      diagnostics_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (version_id) REFERENCES tt_versions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tt_unsched_version
      ON tt_unscheduled_sessions(version_id);

    CREATE TABLE IF NOT EXISTS tt_validation_conflicts (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      conflict_type TEXT NOT NULL,
      day_of_week TEXT,
      period_number INTEGER,
      message TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (version_id) REFERENCES tt_versions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tt_conflicts_version
      ON tt_validation_conflicts(version_id, severity);

    CREATE TABLE IF NOT EXISTS tt_generation_jobs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      progress_pct INTEGER NOT NULL DEFAULT 0,
      stage_message TEXT NOT NULL DEFAULT 'Queued for constraint solver',
      preserve_locked INTEGER NOT NULL DEFAULT 1,
      retries INTEGER NOT NULL DEFAULT 0,
      cancel_requested INTEGER NOT NULL DEFAULT 0,
      diagnostics_json TEXT NOT NULL DEFAULT '{}',
      error_message TEXT,
      created_by TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (version_id) REFERENCES tt_versions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_tt_jobs_tenant_version
      ON tt_generation_jobs(tenant_id, version_id, created_at);

    CREATE TABLE IF NOT EXISTS tt_audit_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      version_id TEXT,
      action TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_name TEXT,
      actor_role TEXT,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tt_audit_tenant
      ON tt_audit_logs(tenant_id, created_at);
  `);

  // Safe migration for existing databases missing hod_user_id on tt_departments
  const deptCols = db.prepare(`PRAGMA table_info(tt_departments)`).all() as Array<{ name: string }>;
  if (!deptCols.some((c) => c.name === 'hod_user_id')) {
    db.exec(`ALTER TABLE tt_departments ADD COLUMN hod_user_id TEXT DEFAULT ''`);
  }
}
