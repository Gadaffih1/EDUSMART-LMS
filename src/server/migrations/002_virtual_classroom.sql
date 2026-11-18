-- EduSmart LMS - Live Virtual Classroom Migration (002_virtual_classroom.sql)
-- Additive multi-tenant SQL migration integrating with existing tenants, grades, streams, users, and students tables.
-- Safe to run idempotently (CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS).

PRAGMA foreign_keys = ON;

-- 1. Primary Grade-Coordinated Virtual Lessons
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
  scheduling_mode TEXT NOT NULL CHECK (scheduling_mode IN ('individual_stream', 'selected_streams_combined', 'all_streams_combined', 'multiple_separate')),
  classroom_mode TEXT NOT NULL DEFAULT 'combined' CHECK (classroom_mode IN ('combined', 'separate')),
  scheduled_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  scheduled_start_at TEXT NOT NULL,
  scheduled_end_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 40 CHECK (duration_minutes >= 1 AND duration_minutes <= 60),
  timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'postponed', 'cancelled', 'completed')),
  is_instant INTEGER NOT NULL DEFAULT 0,
  max_capacity INTEGER NOT NULL DEFAULT 30 CHECK (max_capacity >= 2 AND max_capacity <= 200),
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
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_vl_school_grade_status
  ON virtual_lessons(school_id, grade_id, status, scheduled_start_at);
CREATE INDEX IF NOT EXISTS idx_vl_school_date
  ON virtual_lessons(school_id, scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_vl_coordinator
  ON virtual_lessons(school_id, coordinator_id, scheduled_start_at);

-- 2. LiveKit Classroom Instances (1 shared room for combined lessons; 1 per stream for separate lessons)
CREATE TABLE IF NOT EXISTS virtual_classrooms (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  grade_id TEXT NOT NULL,
  stream_id TEXT,
  livekit_room_name TEXT NOT NULL,
  title TEXT NOT NULL,
  classroom_mode TEXT NOT NULL DEFAULT 'combined' CHECK (classroom_mode IN ('combined', 'separate')),
  room_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (room_status IN ('scheduled', 'live', 'postponed', 'cancelled', 'completed')),
  assigned_teacher_id TEXT NOT NULL,
  assigned_teacher_name TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  scheduled_start_at TEXT NOT NULL,
  scheduled_end_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 40 CHECK (duration_minutes >= 1 AND duration_minutes <= 60),
  actual_start_time TEXT,
  actual_end_time TEXT,
  capacity INTEGER NOT NULL DEFAULT 30 CHECK (capacity >= 2 AND capacity <= 200),
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
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_teacher_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vc_livekit_room_name
  ON virtual_classrooms(livekit_room_name);
CREATE INDEX IF NOT EXISTS idx_vc_lesson
  ON virtual_classrooms(lesson_id, room_status);
CREATE INDEX IF NOT EXISTS idx_vc_school_status
  ON virtual_classrooms(school_id, room_status, scheduled_start_at);
CREATE INDEX IF NOT EXISTS idx_vc_teacher
  ON virtual_classrooms(school_id, assigned_teacher_id, scheduled_start_at);

-- 3. Lesson-to-Stream & Classroom Target Mapping
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
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE,
  FOREIGN KEY (classroom_id) REFERENCES virtual_classrooms(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vls_lesson_stream
  ON virtual_lesson_streams(lesson_id, stream_id);
CREATE INDEX IF NOT EXISTS idx_vls_stream
  ON virtual_lesson_streams(school_id, stream_id, lesson_id);

-- 4. Coordinator, Stream Lead & Co-Teacher Authorisations
CREATE TABLE IF NOT EXISTS virtual_lesson_teacher_assignments (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  classroom_id TEXT,
  teacher_id TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  teacher_email TEXT,
  stream_id TEXT,
  assignment_type TEXT NOT NULL DEFAULT 'co_teacher' CHECK (assignment_type IN ('coordinator', 'stream_teacher', 'co_teacher')),
  can_co_teach INTEGER NOT NULL DEFAULT 0,
  permissions_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (classroom_id) REFERENCES virtual_classrooms(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vlta_unique
  ON virtual_lesson_teacher_assignments(lesson_id, teacher_id, COALESCE(classroom_id, 'all'));
CREATE INDEX IF NOT EXISTS idx_vlta_teacher
  ON virtual_lesson_teacher_assignments(school_id, teacher_id, lesson_id);

-- 5. Participant Admission, Waiting Room, Moderation & Live Presence
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
  admission_status TEXT NOT NULL DEFAULT 'admitted' CHECK (admission_status IN ('admitted', 'waiting', 'rejected', 'removed')),
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
  attendance_status TEXT NOT NULL DEFAULT 'absent' CHECK (attendance_status IN ('present', 'partial', 'absent')),
  is_connected INTEGER NOT NULL DEFAULT 0,
  last_heartbeat_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (classroom_id) REFERENCES virtual_classrooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vlp_classroom_user
  ON virtual_lesson_participants(classroom_id, user_id);
CREATE INDEX IF NOT EXISTS idx_vlp_identity
  ON virtual_lesson_participants(livekit_identity);
CREATE INDEX IF NOT EXISTS idx_vlp_lesson
  ON virtual_lesson_participants(lesson_id, admission_status, is_connected);

-- 6. Scoped & Deduplicated Automated Notifications (Students, Parents, Subject & Class Teachers)
CREATE TABLE IF NOT EXISTS virtual_lesson_notifications (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  classroom_id TEXT,
  recipient_id TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'teacher', 'parent', 'senior_teacher', 'admin')),
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
  FOREIGN KEY (lesson_id) REFERENCES virtual_lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (classroom_id) REFERENCES virtual_classrooms(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vln_dedup_recipient
  ON virtual_lesson_notifications(lesson_id, recipient_id, recipient_type, COALESCE(classroom_id, 'lesson'));
CREATE INDEX IF NOT EXISTS idx_vln_recipient
  ON virtual_lesson_notifications(school_id, recipient_id, recipient_type, read_at, updated_at);
