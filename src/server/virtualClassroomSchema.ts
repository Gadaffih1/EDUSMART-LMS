import type { DatabaseSync } from 'node:sqlite';

/**
 * Additive, Multi-Tenant Normalized Schema for the
 * EduSmart Live Virtual Classroom Module (LiveKit Conferencing, Scheduling & Notifications).
 *
 * Strictly preserves all existing LMS tables (grades, streams, grade_senior_teachers,
 * stream_class_teachers, grade_teacher_assignments, student_stream_assignments, users,
 * students, tenants) without altering, renaming, or duplicating records.
 */
export function initVirtualClassroomSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS virtual_lessons (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      coordinator_id TEXT NOT NULL,
      coordinator_name TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      subtopic TEXT,
      learning_objectives TEXT NOT NULL,
      key_learning_points_json TEXT NOT NULL DEFAULT '[]',
      resources_json TEXT NOT NULL DEFAULT '[]',
      description TEXT,
      scheduling_mode TEXT NOT NULL,
      classroom_mode TEXT NOT NULL DEFAULT 'combined',
      scheduled_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      scheduled_start_at TEXT NOT NULL,
      scheduled_end_at TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 40,
      timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
      status TEXT NOT NULL DEFAULT 'scheduled',
      is_instant INTEGER NOT NULL DEFAULT 0,
      max_capacity INTEGER NOT NULL DEFAULT 30,
      recording_enabled INTEGER NOT NULL DEFAULT 0,
      waiting_room_enabled INTEGER NOT NULL DEFAULT 1,
      student_chat_enabled INTEGER NOT NULL DEFAULT 1,
      student_screenshare_enabled INTEGER NOT NULL DEFAULT 0,
      student_camera_enabled INTEGER NOT NULL DEFAULT 1,
      student_mic_enabled INTEGER NOT NULL DEFAULT 0,
      interaction_enabled INTEGER NOT NULL DEFAULT 1,
      classroom_settings_json TEXT NOT NULL DEFAULT '{}',
      postponed_reason TEXT,
      cancelled_reason TEXT,
      actual_started_at TEXT,
      actual_ended_at TEXT,
      warning_10_sent INTEGER NOT NULL DEFAULT 0,
      warning_5_sent INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_vl_school_grade_status
      ON virtual_lessons(school_id, grade_id, status, scheduled_start_at);
    CREATE INDEX IF NOT EXISTS idx_vl_school_date
      ON virtual_lessons(school_id, scheduled_date, status);

    CREATE TABLE IF NOT EXISTS virtual_classrooms (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT,
      livekit_room_name TEXT NOT NULL,
      title TEXT NOT NULL,
      classroom_mode TEXT NOT NULL DEFAULT 'combined',
      room_status TEXT NOT NULL DEFAULT 'scheduled',
      assigned_teacher_id TEXT NOT NULL,
      assigned_teacher_name TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      scheduled_start_at TEXT NOT NULL,
      scheduled_end_at TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 40,
      actual_start_time TEXT,
      actual_end_time TEXT,
      capacity INTEGER NOT NULL DEFAULT 30,
      locked INTEGER NOT NULL DEFAULT 0,
      waiting_room_enabled INTEGER NOT NULL DEFAULT 1,
      recording_enabled INTEGER NOT NULL DEFAULT 0,
      student_chat_enabled INTEGER NOT NULL DEFAULT 1,
      student_screenshare_enabled INTEGER NOT NULL DEFAULT 0,
      student_camera_enabled INTEGER NOT NULL DEFAULT 1,
      student_mic_enabled INTEGER NOT NULL DEFAULT 0,
      interaction_enabled INTEGER NOT NULL DEFAULT 1,
      muted_all INTEGER NOT NULL DEFAULT 0,
      warning_10_sent INTEGER NOT NULL DEFAULT 0,
      warning_5_sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE SET NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vc_livekit_room_name
      ON virtual_classrooms(livekit_room_name);
    CREATE INDEX IF NOT EXISTS idx_vc_lesson
      ON virtual_classrooms(lesson_id, room_status);
    CREATE INDEX IF NOT EXISTS idx_vc_school_status
      ON virtual_classrooms(school_id, room_status, scheduled_start_at);

    CREATE TABLE IF NOT EXISTS virtual_lesson_streams (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT NOT NULL,
      classroom_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE,
      FOREIGN KEY (classroom_id) REFERENCES virtual_classrooms(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vls_lesson_stream
      ON virtual_lesson_streams(lesson_id, stream_id);
    CREATE INDEX IF NOT EXISTS idx_vls_stream
      ON virtual_lesson_streams(school_id, stream_id, lesson_id);

    CREATE TABLE IF NOT EXISTS virtual_lesson_teacher_assignments (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      classroom_id TEXT,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      teacher_email TEXT,
      stream_id TEXT,
      assignment_type TEXT NOT NULL DEFAULT 'co_teacher',
      can_co_teach INTEGER NOT NULL DEFAULT 0,
      permissions_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vlta_unique
      ON virtual_lesson_teacher_assignments(lesson_id, teacher_id, COALESCE(classroom_id, 'all'));
    CREATE INDEX IF NOT EXISTS idx_vlta_teacher
      ON virtual_lesson_teacher_assignments(school_id, teacher_id, lesson_id);

    CREATE TABLE IF NOT EXISTS virtual_lesson_participants (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      classroom_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      stream_id TEXT,
      livekit_identity TEXT NOT NULL,
      admission_status TEXT NOT NULL DEFAULT 'admitted',
      is_co_host INTEGER NOT NULL DEFAULT 0,
      mic_allowed INTEGER NOT NULL DEFAULT 0,
      cam_allowed INTEGER NOT NULL DEFAULT 1,
      screenshare_allowed INTEGER NOT NULL DEFAULT 0,
      chat_allowed INTEGER NOT NULL DEFAULT 1,
      hand_raised INTEGER NOT NULL DEFAULT 0,
      hand_raised_at TEXT,
      join_time TEXT,
      leave_time TEXT,
      total_duration_seconds INTEGER NOT NULL DEFAULT 0,
      reconnect_count INTEGER NOT NULL DEFAULT 0,
      attendance_status TEXT NOT NULL DEFAULT 'absent',
      is_connected INTEGER NOT NULL DEFAULT 0,
      last_heartbeat_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (classroom_id) REFERENCES virtual_classrooms(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vlp_classroom_user
      ON virtual_lesson_participants(classroom_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_vlp_identity
      ON virtual_lesson_participants(livekit_identity);
    CREATE INDEX IF NOT EXISTS idx_vlp_lesson
      ON virtual_lesson_participants(lesson_id, admission_status, is_connected);

    CREATE TABLE IF NOT EXISTS virtual_lesson_notifications (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      classroom_id TEXT,
      recipient_id TEXT NOT NULL,
      recipient_type TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_ids_json TEXT NOT NULL DEFAULT '[]',
      subject_name TEXT NOT NULL,
      topic TEXT NOT NULL,
      coordinator_name TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      classroom_status TEXT NOT NULL DEFAULT 'scheduled',
      is_co_teacher INTEGER NOT NULL DEFAULT 0,
      notification_type TEXT NOT NULL DEFAULT 'lesson_scheduled',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      delivery_status TEXT NOT NULL DEFAULT 'delivered',
      read_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vln_dedup_recipient
      ON virtual_lesson_notifications(lesson_id, recipient_id, recipient_type, COALESCE(classroom_id, 'lesson'));
    CREATE INDEX IF NOT EXISTS idx_vln_recipient
      ON virtual_lesson_notifications(school_id, recipient_id, recipient_type, read_at, updated_at);

    CREATE TABLE IF NOT EXISTS virtual_lesson_attendance (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      classroom_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      stream_id TEXT,
      first_joined_at TEXT,
      last_left_at TEXT,
      total_attendance_minutes REAL NOT NULL DEFAULT 0,
      reconnect_count INTEGER NOT NULL DEFAULT 0,
      attendance_status TEXT NOT NULL DEFAULT 'absent',
      verified_via TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (classroom_id) REFERENCES virtual_classrooms(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vla_lesson_student
      ON virtual_lesson_attendance(lesson_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_vla_classroom
      ON virtual_lesson_attendance(classroom_id, attendance_status);

    CREATE TABLE IF NOT EXISTS virtual_lesson_recordings (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      classroom_id TEXT NOT NULL,
      recording_id TEXT NOT NULL,
      egress_id TEXT,
      recording_url TEXT,
      recording_status TEXT NOT NULL DEFAULT 'recording',
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      started_by TEXT NOT NULL,
      stopped_by TEXT,
      retention_until TEXT NOT NULL,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (classroom_id) REFERENCES virtual_classrooms(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_vlr_lesson
      ON virtual_lesson_recordings(lesson_id, recording_status, deleted_at);

    CREATE TABLE IF NOT EXISTS virtual_lesson_audit_logs (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      lesson_id TEXT,
      classroom_id TEXT,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_vlal_school
      ON virtual_lesson_audit_logs(school_id, lesson_id, created_at);

    CREATE TABLE IF NOT EXISTS virtual_classroom_school_policies (
      school_id TEXT PRIMARY KEY,
      default_max_capacity INTEGER NOT NULL DEFAULT 30,
      max_duration_minutes INTEGER NOT NULL DEFAULT 60,
      overlap_policy TEXT NOT NULL DEFAULT 'warn',
      teacher_conflict_policy TEXT NOT NULL DEFAULT 'warn',
      default_recording_enabled INTEGER NOT NULL DEFAULT 0,
      default_waiting_room_enabled INTEGER NOT NULL DEFAULT 1,
      require_paid_pass_only INTEGER NOT NULL DEFAULT 0,
      weekly_lesson_limit_default INTEGER NOT NULL DEFAULT 20,
      recording_retention_days INTEGER NOT NULL DEFAULT 90,
      updated_by TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_digital_subscriptions (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT,
      student_email TEXT,
      ticket_id TEXT,
      tier TEXT NOT NULL DEFAULT 'school_bundled',
      approval_status TEXT NOT NULL DEFAULT 'approved',
      weekly_lesson_limit INTEGER NOT NULL DEFAULT 20,
      lessons_used_this_week INTEGER NOT NULL DEFAULT 0,
      week_key TEXT NOT NULL,
      expires_at TEXT,
      notes TEXT,
      updated_by TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sds_school_student
      ON student_digital_subscriptions(school_id, student_id);

    CREATE TABLE IF NOT EXISTS virtual_lesson_chat_messages (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      classroom_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (classroom_id) REFERENCES virtual_classrooms(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_vlcm_classroom
      ON virtual_lesson_chat_messages(classroom_id, created_at);

    CREATE TABLE IF NOT EXISTS livekit_webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      room_name TEXT,
      participant_identity TEXT,
      received_at TEXT NOT NULL
    );
  `);
}

export const VIRTUAL_CLASSROOM_TABLES = [
  'virtual_lessons',
  'virtual_classrooms',
  'virtual_lesson_streams',
  'virtual_lesson_teacher_assignments',
  'virtual_lesson_participants',
  'virtual_lesson_notifications',
  'virtual_lesson_attendance',
  'virtual_lesson_recordings',
  'virtual_lesson_audit_logs',
  'virtual_classroom_school_policies',
  'student_digital_subscriptions',
  'virtual_lesson_chat_messages',
  'livekit_webhook_events',
];
