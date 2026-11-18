import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { getDb, notifyMySqlTablesChanged, writeSecurityAudit } from './db.ts';
import { VIRTUAL_CLASSROOM_TABLES } from './virtualClassroomSchema.ts';
import {
  requireAuth,
  resolveAuthorizedTenantId,
  sessionHasAnyRole,
  sessionHasRole,
  type AuthSession,
} from './authRoutes.ts';
import { readCollectionForTenant } from './dataRoutes.ts';
import { broadcastChange } from './realtimeBus.ts';
import {
  broadcastLiveKitRoomData,
  buildCanonicalLiveKitRoomName,
  buildParticipantIdentity,
  deleteLiveKitRoom,
  ensureLiveKitRoom,
  getLiveKitConfig,
  mintLiveKitJoinToken,
  muteAllStudentsInLiveKitRoom,
  muteLiveKitParticipantTracks,
  removeLiveKitParticipant,
  startLiveKitEgressRecording,
  stopLiveKitEgressRecording,
  updateLiveKitParticipantPermissions,
  verifyLiveKitWebhook,
} from './livekitService.ts';

const ADMIN_ROLES = new Set([
  'admin',
  'head_teacher',
  'deputy_head',
  'dean_of_studies',
  'curriculum_coordinator',
]);

function isSchoolAdmin(session: AuthSession): boolean {
  return Boolean(session.isSuperAdmin || sessionHasAnyRole(session, ADMIN_ROLES));
}

function nowIso(): string {
  return new Date().toISOString();
}

function broadcastVirtualLessonChange(schoolId: string, recordId?: string, actorId?: string | null): void {
  broadcastChange({
    type: 'collection:updated',
    collection: 'edusmart_virtual_lessons_v1',
    tenantId: schoolId,
    recordId,
    actorId: actorId ?? null,
    timestamp: nowIso(),
  });
}

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getNairobiDateTimeParts(date: Date = new Date()): {
  dateStr: string;
  timeStr: string;
  isoOffset: string;
} {
  // Africa/Nairobi is permanent UTC+3 (no DST)
  const nairobiMs = date.getTime() + 3 * 60 * 60 * 1000;
  const shifted = new Date(nairobiMs);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  const hour = String(shifted.getUTCHours()).padStart(2, '0');
  const min = String(shifted.getUTCMinutes()).padStart(2, '0');
  const sec = String(shifted.getUTCSeconds()).padStart(2, '0');
  return {
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hour}:${min}`,
    isoOffset: `${year}-${month}-${day}T${hour}:${min}:${sec}+03:00`,
  };
}

export function parseNairobiDateTime(dateStr: string, timeStr: string): Date {
  const cleanDate = String(dateStr || '').trim();
  const cleanTime = String(timeStr || '08:00').trim();
  const timeWithSec = cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime;
  return new Date(`${cleanDate}T${timeWithSec}+03:00`);
}

export function computeEndTimeStr(startDate: Date, durationMinutes: number): string {
  const end = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  return getNairobiDateTimeParts(end).timeStr;
}

export function getCurrentWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getSchoolPolicy(db: DatabaseSync, schoolId: string) {
  let row = db
    .prepare(`SELECT * FROM virtual_classroom_school_policies WHERE school_id = ?`)
    .get(schoolId) as any;

  if (!row) {
    const now = nowIso();
    db.prepare(
      `INSERT OR IGNORE INTO virtual_classroom_school_policies
         (school_id, default_max_capacity, max_duration_minutes, overlap_policy, teacher_conflict_policy,
          default_recording_enabled, default_waiting_room_enabled, require_paid_pass_only,
          weekly_lesson_limit_default, recording_retention_days, updated_by, updated_at)
       VALUES (?, 30, 60, 'warn', 'warn', 0, 1, 0, 20, 90, 'system', ?)`
    ).run(schoolId, now);
    row = db
      .prepare(`SELECT * FROM virtual_classroom_school_policies WHERE school_id = ?`)
      .get(schoolId) as any;
  }

  return {
    schoolId,
    defaultMaxCapacity: Number(row?.default_max_capacity || 30),
    maxDurationMinutes: Math.min(60, Number(row?.max_duration_minutes || 60)),
    overlapPolicy: (row?.overlap_policy || 'warn') as 'warn' | 'block',
    teacherConflictPolicy: (row?.teacher_conflict_policy || 'warn') as 'warn' | 'block',
    defaultRecordingEnabled: Boolean(row?.default_recording_enabled),
    defaultWaitingRoomEnabled: row?.default_waiting_room_enabled !== 0,
    requirePaidPassOnly: Boolean(row?.require_paid_pass_only),
    weeklyLessonLimitDefault: Number(row?.weekly_lesson_limit_default || 20),
    recordingRetentionDays: Number(row?.recording_retention_days || 90),
    updatedAt: row?.updated_at || nowIso(),
  };
}

function getSeniorGradeIds(db: DatabaseSync, schoolId: string, teacherId: string): string[] {
  const rows = db
    .prepare(
      `SELECT grade_id FROM grade_senior_teachers
       WHERE school_id = ? AND teacher_id = ? AND is_active = 1`
    )
    .all(schoolId, teacherId) as Array<{ grade_id: string }>;
  return rows.map((r) => r.grade_id);
}

function getStudentStreamPlacement(
  db: DatabaseSync,
  schoolId: string,
  studentId: string
): { gradeId: string; streamId: string } | null {
  const ssa = db
    .prepare(
      `SELECT grade_id, stream_id FROM student_stream_assignments
       WHERE school_id = ? AND student_id = ? AND is_active = 1 LIMIT 1`
    )
    .get(schoolId, studentId) as { grade_id: string; stream_id: string } | undefined;
  if (ssa?.grade_id && ssa?.stream_id) {
    return { gradeId: ssa.grade_id, streamId: ssa.stream_id };
  }
  const stu = db
    .prepare(`SELECT grade_id, stream_id FROM students WHERE school_id = ? AND id = ? LIMIT 1`)
    .get(schoolId, studentId) as { grade_id: string; stream_id: string } | undefined;
  if (stu?.grade_id && stu?.stream_id) {
    return { gradeId: stu.grade_id, streamId: stu.stream_id };
  }
  return null;
}

function getParentChildrenIds(db: DatabaseSync, schoolId: string, session: AuthSession): string[] {
  const ids = new Set<string>(
    Array.isArray(session.user?.childrenIds) ? session.user.childrenIds.map(String) : []
  );
  const parentRows = db
    .prepare(
      `SELECT student_id FROM student_parents WHERE school_id = ? AND (id = ? OR lower(email) = ?)`
    )
    .all(
      schoolId,
      session.userId,
      String(session.user?.email || '').trim().toLowerCase()
    ) as Array<{ student_id: string }>;
  for (const r of parentRows) ids.add(r.student_id);
  return Array.from(ids);
}

function writeVirtualAudit(
  db: DatabaseSync,
  params: {
    schoolId: string;
    lessonId?: string | null;
    classroomId?: string | null;
    session: AuthSession;
    action: string;
    details?: Record<string, any>;
  }
): void {
  db.prepare(
    `INSERT INTO virtual_lesson_audit_logs
       (id, school_id, lesson_id, classroom_id, user_id, user_name, user_role, action, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    `vla-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    params.schoolId,
    params.lessonId || null,
    params.classroomId || null,
    params.session.userId,
    String(params.session.user?.name || params.session.role),
    params.session.role,
    params.action,
    JSON.stringify(params.details || {}),
    nowIso()
  );
  writeSecurityAudit({
    schoolId: params.schoolId,
    userId: params.session.userId,
    userEmail: params.session.user?.email,
    action: `virtual_classroom:${params.action}`,
    resource: params.classroomId || params.lessonId || 'virtual_classrooms',
    details: JSON.stringify(params.details || {}),
  });
}

/**
 * Checks whether a student can join a virtual classroom under institutional subscription & quota rules.
 */
function evaluateStudentSubscription(
  db: DatabaseSync,
  schoolId: string,
  studentId: string,
  lessonId: string
): {
  allowed: boolean;
  code?: string;
  reason?: string;
  remainingWeeklyLessons: number;
  weeklyLessonLimit: number;
  lessonsUsedThisWeek: number;
  approvalStatus: string;
  tier: string;
} {
  const policy = getSchoolPolicy(db, schoolId);
  const weekKey = getCurrentWeekKey();

  const stuRow = db
    .prepare(
      `SELECT id, name, email FROM students WHERE school_id = ? AND id = ?
       UNION ALL
       SELECT id, name, email FROM users WHERE school_id = ? AND id = ?
       LIMIT 1`
    )
    .get(schoolId, studentId, schoolId, studentId) as { id: string; name: string; email: string } | undefined;

  const stuEmail = String(stuRow?.email || '').trim().toLowerCase();

  // Check active M-Pesa Virtual Lab passes matching student or parent email
  const passes = readCollectionForTenant('edusmart_vlab_ticket_passes', 'global', true) || [];
  const activePaidPass = Array.isArray(passes)
    ? passes.find((p: any) => {
        const emailMatch = stuEmail && String(p?.email || '').trim().toLowerCase() === stuEmail;
        const holderMatch = String(p?.studentId || '') === studentId;
        if (!emailMatch && !holderMatch) return false;
        const statusOk = p?.status === 'active' || p?.approvalStatus === 'approved';
        const verifiedOk = p?.subscriptionVerified !== false;
        const notExpired = !p?.expiresAt || Date.parse(String(p.expiresAt)) > Date.now();
        return statusOk && verifiedOk && notExpired;
      })
    : null;

  let sub = db
    .prepare(`SELECT * FROM student_digital_subscriptions WHERE school_id = ? AND student_id = ? LIMIT 1`)
    .get(schoolId, studentId) as any;

  // Reset weekly counter if week changed
  if (sub && sub.week_key !== weekKey) {
    db.prepare(
      `UPDATE student_digital_subscriptions
       SET lessons_used_this_week = 0, week_key = ?, updated_at = ?
       WHERE id = ?`
    ).run(weekKey, nowIso(), sub.id);
    sub.lessons_used_this_week = 0;
    sub.week_key = weekKey;
  }

  // If student already has an admitted participant record for THIS lesson, reconnects never double-count or block mid-lesson
  const alreadyAdmittedForLesson = Boolean(
    db
      .prepare(
        `SELECT id FROM virtual_lesson_participants
         WHERE lesson_id = ? AND user_id = ? AND admission_status = 'admitted' AND join_time IS NOT NULL
         LIMIT 1`
      )
      .get(lessonId, studentId)
  );

  if (!sub) {
    if (policy.requirePaidPassOnly && !activePaidPass) {
      return {
        allowed: false,
        code: 'SUBSCRIPTION_REQUIRED',
        reason: 'Your Digital Class subscription is not active yet. Complete payment via M-Pesa Paybill 400200 (Account 1164798) or contact School Finance for approval.',
        remainingWeeklyLessons: 0,
        weeklyLessonLimit: 0,
        lessonsUsedThisWeek: 0,
        approvalStatus: 'unapproved',
        tier: 'none',
      };
    }

    // Provision default subscription record
    const limit = activePaidPass ? 100 : policy.weeklyLessonLimitDefault;
    const now = nowIso();
    const subId = `sds-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    db.prepare(
      `INSERT OR IGNORE INTO student_digital_subscriptions
         (id, school_id, student_id, student_name, student_email, ticket_id, tier, approval_status,
          weekly_lesson_limit, lessons_used_this_week, week_key, expires_at, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, 0, ?, ?, 'system', ?)`
    ).run(
      subId,
      schoolId,
      studentId,
      stuRow?.name || null,
      stuEmail || null,
      activePaidPass?.ticketId || null,
      activePaidPass ? String(activePaidPass.tier || 'termly') : 'school_bundled',
      limit,
      weekKey,
      activePaidPass?.expiresAt || null,
      now
    );
    sub = db
      .prepare(`SELECT * FROM student_digital_subscriptions WHERE school_id = ? AND student_id = ? LIMIT 1`)
      .get(schoolId, studentId) as any;
  }

  // Active paid pass overrides expired/unapproved default if newer
  if (activePaidPass && sub && sub.approval_status !== 'approved') {
    db.prepare(
      `UPDATE student_digital_subscriptions
       SET approval_status = 'approved', ticket_id = ?, tier = ?, expires_at = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      activePaidPass.ticketId || sub.ticket_id,
      String(activePaidPass.tier || 'paid_pass'),
      activePaidPass.expiresAt || null,
      nowIso(),
      sub.id
    );
    sub.approval_status = 'approved';
    sub.expires_at = activePaidPass.expiresAt || null;
  }

  const approvalStatus = String(sub?.approval_status || 'approved');
  const limit = Number(sub?.weekly_lesson_limit ?? policy.weeklyLessonLimitDefault);
  const used = Number(sub?.lessons_used_this_week ?? 0);
  const remaining = Math.max(0, limit - used);

  if (approvalStatus !== 'approved') {
    return {
      allowed: false,
      code: approvalStatus === 'expired' ? 'SUBSCRIPTION_EXPIRED' : 'SUBSCRIPTION_UNAPPROVED',
      reason:
        approvalStatus === 'suspended'
          ? 'Your virtual classroom access is temporarily suspended. Please check with the School Bursar or Senior Teacher.'
          : 'Your Digital Class subscription is unapproved or pending payment verification (Paybill 400200, Account 1164798).',
      remainingWeeklyLessons: remaining,
      weeklyLessonLimit: limit,
      lessonsUsedThisWeek: used,
      approvalStatus,
      tier: String(sub?.tier || 'school_bundled'),
    };
  }

  if (sub?.expires_at && Date.parse(String(sub.expires_at)) <= Date.now()) {
    return {
      allowed: false,
      code: 'SUBSCRIPTION_EXPIRED',
      reason: 'Your Digital Class subscription term has expired. Renew your plan via Fees & Digital Subscription to continue joining live classes.',
      remainingWeeklyLessons: 0,
      weeklyLessonLimit: limit,
      lessonsUsedThisWeek: used,
      approvalStatus: 'expired',
      tier: String(sub?.tier || 'school_bundled'),
    };
  }

  if (!alreadyAdmittedForLesson && used >= limit) {
    return {
      allowed: false,
      code: 'SUBSCRIPTION_QUOTA_DEPLETED',
      reason: `Weekly virtual lesson quota reached (${used}/${limit} lessons used this week). Upgrade your subscription package or contact School Administration.`,
      remainingWeeklyLessons: 0,
      weeklyLessonLimit: limit,
      lessonsUsedThisWeek: used,
      approvalStatus,
      tier: String(sub?.tier || 'school_bundled'),
    };
  }

  return {
    allowed: true,
    remainingWeeklyLessons: remaining,
    weeklyLessonLimit: limit,
    lessonsUsedThisWeek: used,
    approvalStatus,
    tier: String(sub?.tier || 'school_bundled'),
  };
}

function recordStudentSubscriptionConsumeOnce(
  db: DatabaseSync,
  schoolId: string,
  studentId: string
): void {
  const weekKey = getCurrentWeekKey();
  db.prepare(
    `UPDATE student_digital_subscriptions
     SET lessons_used_this_week = lessons_used_this_week + 1,
         week_key = ?,
         updated_at = ?
     WHERE school_id = ? AND student_id = ?`
  ).run(weekKey, nowIso(), schoolId, studentId);
}

/**
 * Resolves all active students and assigned subject/class teachers for a grade & stream subset,
 * and upserts zero-duplicate notifications into `virtual_lesson_notifications`.
 */
function syncLessonNotifications(
  db: DatabaseSync,
  lessonId: string,
  eventKind: 'scheduled' | 'live' | 'postponed' | 'cancelled' | 'completed' | 'warning_10' | 'warning_5'
): void {
  const lesson = db.prepare(`SELECT * FROM virtual_lessons WHERE id = ?`).get(lessonId) as any;
  if (!lesson) return;

  const classrooms = db
    .prepare(`SELECT * FROM virtual_classrooms WHERE lesson_id = ?`)
    .all(lessonId) as any[];

  const streamLinks = db
    .prepare(
      `SELECT vls.stream_id, vls.classroom_id, s.display_name, s.name
       FROM virtual_lesson_streams vls
       JOIN streams s ON s.id = vls.stream_id
       WHERE vls.lesson_id = ?`
    )
    .all(lessonId) as Array<{ stream_id: string; classroom_id: string; display_name: string; name: string }>;

  const gradeRow = db.prepare(`SELECT name FROM grades WHERE id = ?`).get(lesson.grade_id) as { name: string } | undefined;
  const gradeName = gradeRow?.name || 'Grade';

  const now = nowIso();
  const statusMap: Record<typeof eventKind, string> = {
    scheduled: 'VIRTUAL LESSON SCHEDULED',
    live: 'VIRTUAL CLASSROOM IS NOW LIVE!',
    postponed: 'VIRTUAL LESSON POSTPONED',
    cancelled: 'VIRTUAL LESSON CANCELLED',
    completed: 'VIRTUAL LESSON COMPLETED',
    warning_10: '10 MINUTES REMAINING IN LIVE CLASS',
    warning_5: '5 MINUTES REMAINING — PREPARE TO WRAP UP',
  };

  const notifTypeMap: Record<typeof eventKind, string> = {
    scheduled: 'lesson_scheduled',
    live: 'lesson_live',
    postponed: 'lesson_postponed',
    cancelled: 'lesson_cancelled',
    completed: 'lesson_completed',
    warning_10: 'lesson_warning_10m',
    warning_5: 'lesson_warning_5m',
  };

  const upsertNotif = (params: {
    recipientId: string;
    recipientType: string;
    classroomId: string | null;
    streamIds: string[];
    isCoTeacher: number;
    title: string;
    message: string;
    classroomStatus: string;
    resetUnread?: boolean;
  }) => {
    const existing = db
      .prepare(
        `SELECT id FROM virtual_lesson_notifications
         WHERE lesson_id = ? AND recipient_id = ? AND recipient_type = ?
           AND COALESCE(classroom_id, 'lesson') = COALESCE(?, 'lesson')
         LIMIT 1`
      )
      .get(lessonId, params.recipientId, params.recipientType, params.classroomId) as { id: string } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE virtual_lesson_notifications
         SET grade_id = ?,
             stream_ids_json = ?,
             subject_name = ?,
             topic = ?,
             coordinator_name = ?,
             scheduled_date = ?,
             start_time = ?,
             duration_minutes = ?,
             classroom_status = ?,
             is_co_teacher = ?,
             notification_type = ?,
             title = ?,
             message = ?,
             read_at = CASE WHEN ? = 1 THEN NULL ELSE read_at END,
             updated_at = ?
         WHERE id = ?`
      ).run(
        lesson.grade_id,
        JSON.stringify(params.streamIds),
        lesson.subject_name,
        lesson.topic,
        lesson.coordinator_name,
        lesson.scheduled_date,
        lesson.start_time,
        lesson.duration_minutes,
        params.classroomStatus,
        params.isCoTeacher,
        notifTypeMap[eventKind],
        params.title,
        params.message,
        params.resetUnread ? 1 : 0,
        now,
        existing.id
      );
    } else {
      db.prepare(
        `INSERT INTO virtual_lesson_notifications
           (id, school_id, lesson_id, classroom_id, recipient_id, recipient_type, grade_id, stream_ids_json,
            subject_name, topic, coordinator_name, scheduled_date, start_time, duration_minutes,
            classroom_status, is_co_teacher, notification_type, title, message, delivery_status, read_at,
            created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'delivered', NULL, ?, ?)`
      ).run(
        `vln-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        lesson.school_id,
        lessonId,
        params.classroomId,
        params.recipientId,
        params.recipientType,
        lesson.grade_id,
        JSON.stringify(params.streamIds),
        lesson.subject_name,
        lesson.topic,
        lesson.coordinator_name,
        lesson.scheduled_date,
        lesson.start_time,
        lesson.duration_minutes,
        params.classroomStatus,
        params.isCoTeacher,
        notifTypeMap[eventKind],
        params.title,
        params.message,
        now,
        now
      );
    }
  };

  // 1. Notify Students strictly scoped to target streams
  const targetStreamIds = streamLinks.map((l) => l.stream_id);
  if (targetStreamIds.length > 0) {
    const placeholders = targetStreamIds.map(() => '?').join(',');
    const assignedStudents = db
      .prepare(
        `SELECT DISTINCT student_id, stream_id
         FROM student_stream_assignments
         WHERE school_id = ? AND grade_id = ? AND stream_id IN (${placeholders}) AND is_active = 1`
      )
      .all(lesson.school_id, lesson.grade_id, ...targetStreamIds) as Array<{
      student_id: string;
      stream_id: string;
    }>;

    // Fallback check against `students` directory table if student_stream_assignments misses any active record
    const dirStudents = db
      .prepare(
        `SELECT id as student_id, stream_id
         FROM students
         WHERE school_id = ? AND grade_id = ? AND stream_id IN (${placeholders}) AND is_active = 1`
      )
      .all(lesson.school_id, lesson.grade_id, ...targetStreamIds) as Array<{
      student_id: string;
      stream_id: string;
    }>;

    const studentMap = new Map<string, string>();
    for (const s of [...assignedStudents, ...dirStudents]) {
      if (!studentMap.has(s.student_id)) {
        studentMap.set(s.student_id, s.stream_id);
      }
    }

    for (const [studentId, studentStreamId] of studentMap.entries()) {
      const link = streamLinks.find((l) => l.stream_id === studentStreamId);
      const classroom = classrooms.find((c) => c.id === link?.classroom_id) || classrooms[0];
      const streamLabel = link?.display_name || link?.name || gradeName;
      const roomScopeId = lesson.classroom_mode === 'separate' ? classroom?.id || null : null;

      let message = `${lesson.subject_name} (${lesson.topic}) scheduled on ${lesson.scheduled_date} at ${lesson.start_time} EAT (${lesson.duration_minutes} mins) for ${streamLabel}.`;
      if (eventKind === 'live') {
        message = `${lesson.subject_name}: ${lesson.topic} is now LIVE for ${streamLabel}. Join now!`;
      } else if (eventKind === 'postponed') {
        message = `Rescheduled to ${lesson.scheduled_date} at ${lesson.start_time} EAT. ${lesson.postponed_reason || ''}`.trim();
      } else if (eventKind === 'cancelled') {
        message = `Lesson cancelled by ${lesson.coordinator_name}. ${lesson.cancelled_reason || ''}`.trim();
      } else if (eventKind === 'completed') {
        message = `Lesson ended. Check your learning notes and attendance record.`;
      } else if (eventKind === 'warning_10' || eventKind === 'warning_5') {
        message = `${statusMap[eventKind]} for ${lesson.subject_name}: ${lesson.topic}.`;
      }

      upsertNotif({
        recipientId: studentId,
        recipientType: 'student',
        classroomId: roomScopeId,
        streamIds: roomScopeId ? [studentStreamId] : targetStreamIds,
        isCoTeacher: 0,
        title: statusMap[eventKind],
        message,
        classroomStatus: eventKind === 'warning_10' || eventKind === 'warning_5' ? 'live' : eventKind,
        resetUnread: eventKind === 'live' || eventKind === 'cancelled' || eventKind === 'postponed' || eventKind === 'scheduled',
      });
    }
  }

  // 2. Notify Grade Subject Teachers & Assigned Room/Co-Teachers (deduplicated)
  const explicitAssignments = db
    .prepare(
      `SELECT teacher_id, classroom_id, stream_id, assignment_type, can_co_teach
       FROM virtual_lesson_teacher_assignments
       WHERE lesson_id = ?`
    )
    .all(lessonId) as Array<{
    teacher_id: string;
    classroom_id: string | null;
    stream_id: string | null;
    assignment_type: string;
    can_co_teach: number;
  }>;

  const gradeTeachers = db
    .prepare(
      `SELECT DISTINCT teacher_id, stream_id
       FROM grade_teacher_assignments
       WHERE school_id = ? AND grade_id = ? AND is_active = 1`
    )
    .all(lesson.school_id, lesson.grade_id) as Array<{ teacher_id: string; stream_id: string | null }>;

  const streamTeachers = targetStreamIds.length > 0
    ? (db
        .prepare(
          `SELECT DISTINCT teacher_id, stream_id
           FROM stream_class_teachers
           WHERE school_id = ? AND grade_id = ? AND stream_id IN (${targetStreamIds.map(() => '?').join(',')}) AND is_active = 1`
        )
        .all(lesson.school_id, lesson.grade_id, ...targetStreamIds) as Array<{
        teacher_id: string;
        stream_id: string;
      }>)
    : [];

  // Map deduplicated key -> notification payload
  const teacherNotifTargets = new Map<
    string,
    { teacherId: string; classroomId: string | null; streamIds: string[]; isCoTeacher: number; roleDesc: string }
  >();

  // Helper to ensure grade/stream subject teachers only get notified when relevant to target streams
  for (const gt of gradeTeachers) {
    if (gt.stream_id && !targetStreamIds.includes(gt.stream_id)) continue;
    const key = lesson.classroom_mode === 'separate' && gt.stream_id ? `${gt.teacher_id}:${gt.stream_id}` : gt.teacher_id;
    const classroom =
      lesson.classroom_mode === 'separate' && gt.stream_id
        ? classrooms.find((c) => c.stream_id === gt.stream_id)
        : null;
    if (!teacherNotifTargets.has(key)) {
      teacherNotifTargets.set(key, {
        teacherId: gt.teacher_id,
        classroomId: classroom?.id || null,
        streamIds: gt.stream_id ? [gt.stream_id] : targetStreamIds,
        isCoTeacher: 0,
        roleDesc: 'Subject Teacher (Grade Notified)',
      });
    }
  }

  for (const st of streamTeachers) {
    const key = lesson.classroom_mode === 'separate' ? `${st.teacher_id}:${st.stream_id}` : st.teacher_id;
    const classroom = lesson.classroom_mode === 'separate' ? classrooms.find((c) => c.stream_id === st.stream_id) : null;
    if (!teacherNotifTargets.has(key)) {
      teacherNotifTargets.set(key, {
        teacherId: st.teacher_id,
        classroomId: classroom?.id || null,
        streamIds: lesson.classroom_mode === 'separate' ? [st.stream_id] : targetStreamIds,
        isCoTeacher: 0,
        roleDesc: 'Stream Class Teacher',
      });
    }
  }

  // Upgrade explicit teacher/co-teacher assignments
  for (const ea of explicitAssignments) {
    const key = lesson.classroom_mode === 'separate' && ea.stream_id ? `${ea.teacher_id}:${ea.stream_id}` : ea.teacher_id;
    const existingTarget = teacherNotifTargets.get(key) || teacherNotifTargets.get(ea.teacher_id);
    const isCo = ea.can_co_teach === 1 || ea.assignment_type === 'co_teacher' || ea.assignment_type === 'stream_teacher' || ea.assignment_type === 'coordinator' ? 1 : 0;
    const roleDesc =
      ea.assignment_type === 'stream_teacher'
        ? 'Assigned Stream Teacher (Host)'
        : ea.can_co_teach === 1 || ea.assignment_type === 'co_teacher'
        ? 'Authorised Co-Teacher'
        : 'Coordinator';

    if (existingTarget) {
      existingTarget.isCoTeacher = Math.max(existingTarget.isCoTeacher, isCo);
      existingTarget.classroomId = existingTarget.classroomId || ea.classroom_id;
      existingTarget.roleDesc = roleDesc;
    } else {
      teacherNotifTargets.set(key, {
        teacherId: ea.teacher_id,
        classroomId: lesson.classroom_mode === 'separate' ? ea.classroom_id : null,
        streamIds: ea.stream_id ? [ea.stream_id] : targetStreamIds,
        isCoTeacher: isCo,
        roleDesc,
      });
    }
  }

  const streamLabelText = streamLinks.map((s) => s.display_name || s.name).join(', ') || gradeName;
  for (const target of teacherNotifTargets.values()) {
    // Coordinator already sees everything on Senior Teacher console, keep clean if also subject teacher
    const scopeNames =
      lesson.classroom_mode === 'separate' && target.streamIds.length === 1
        ? streamLinks.find((s) => s.stream_id === target.streamIds[0])?.display_name || streamLabelText
        : streamLabelText;

    let msg = `${gradeName} · ${lesson.subject_name}: ${lesson.topic} (${scopeNames}) on ${lesson.scheduled_date} at ${lesson.start_time} EAT (${lesson.duration_minutes} mins). Coordinated by ${lesson.coordinator_name}.`;
    if (target.isCoTeacher === 1) {
      msg += ` Role: ${target.roleDesc}.`;
    }
    if (eventKind === 'live') {
      msg = `LIVE NOW: ${gradeName} · ${lesson.subject_name}: ${lesson.topic} (${scopeNames}). ${
        target.isCoTeacher ? 'You are authorised to join / co-teach.' : 'Grade schedule notification.'
      }`;
    } else if (eventKind === 'postponed') {
      msg = `POSTPONED to ${lesson.scheduled_date} at ${lesson.start_time} EAT. ${lesson.postponed_reason || ''}`.trim();
    } else if (eventKind === 'cancelled') {
      msg = `CANCELLED by ${lesson.coordinator_name}. ${lesson.cancelled_reason || ''}`.trim();
    } else if (eventKind === 'completed') {
      msg = `COMPLETED: ${gradeName} · ${lesson.subject_name}: ${lesson.topic}.`;
    }

    upsertNotif({
      recipientId: target.teacherId,
      recipientType: 'teacher',
      classroomId: target.classroomId,
      streamIds: target.streamIds,
      isCoTeacher: target.isCoTeacher,
      title: `${statusMap[eventKind]} — ${lesson.subject_name}`,
      message: msg,
      classroomStatus: eventKind === 'warning_10' || eventKind === 'warning_5' ? 'live' : eventKind,
      resetUnread: true,
    });
  }
}

/**
 * Validates schedule inputs, teacher timetable conflicts, and stream overlaps.
 */
function validateScheduleAndConflicts(
  db: DatabaseSync,
  params: {
    schoolId: string;
    gradeId: string;
    excludeLessonId?: string;
    scheduledDate: string;
    startTime: string;
    durationMinutes: number;
    streamConfigs: Array<{
      streamId: string;
      teacherId: string;
      scheduledDate: string;
      startTime: string;
      durationMinutes: number;
    }>;
  }
) {
  const policy = getSchoolPolicy(db, params.schoolId);
  const warnings: string[] = [];
  const blockingErrors: string[] = [];

  for (const cfg of params.streamConfigs) {
    if (cfg.durationMinutes < 1 || cfg.durationMinutes > 60) {
      blockingErrors.push(`Lesson duration must be between 1 and 60 minutes (got ${cfg.durationMinutes}).`);
    }

    const startObj = parseNairobiDateTime(cfg.scheduledDate, cfg.startTime);
    if (Number.isNaN(startObj.getTime())) {
      blockingErrors.push(`Invalid date/time: ${cfg.scheduledDate} ${cfg.startTime}.`);
      continue;
    }
    const startIso = startObj.toISOString();
    const endIso = new Date(startObj.getTime() + cfg.durationMinutes * 60 * 1000).toISOString();

    // 1. Overlapping virtual lesson on the same stream
    const overlappingStreamRows = db
      .prepare(
        `SELECT vl.id, vl.title, vl.subject_name, vc.scheduled_date, vc.start_time, vc.end_time, s.display_name
         FROM virtual_lesson_streams vls
         JOIN virtual_classrooms vc ON vc.id = vls.classroom_id
         JOIN virtual_lessons vl ON vl.id = vls.lesson_id
         JOIN streams s ON s.id = vls.stream_id
         WHERE vls.school_id = ?
           AND vls.stream_id = ?
           AND vc.room_status IN ('scheduled', 'live')
           AND (? IS NULL OR vl.id != ?)
           AND vc.scheduled_start_at < ?
           AND vc.scheduled_end_at > ?`
      )
      .all(
        params.schoolId,
        cfg.streamId,
        params.excludeLessonId || null,
        params.excludeLessonId || null,
        endIso,
        startIso
      ) as any[];

    for (const ov of overlappingStreamRows) {
      const msg = `${ov.display_name} already has "${ov.subject_name}: ${ov.title}" from ${ov.start_time} to ${ov.end_time} on ${ov.scheduled_date}.`;
      if (policy.overlapPolicy === 'block') {
        blockingErrors.push(msg);
      } else {
        warnings.push(`Stream overlap warning: ${msg}`);
      }
    }

    // 2. Teacher double-booking across active virtual classrooms at the same time
    const teacherDoubleRows = db
      .prepare(
        `SELECT vc.id, vc.title, vc.assigned_teacher_name, vc.scheduled_date, vc.start_time, vc.end_time
         FROM virtual_classrooms vc
         WHERE vc.school_id = ?
           AND vc.assigned_teacher_id = ?
           AND vc.room_status IN ('scheduled', 'live')
           AND (? IS NULL OR vc.lesson_id != ?)
           AND vc.scheduled_start_at < ?
           AND vc.scheduled_end_at > ?`
      )
      .all(
        params.schoolId,
        cfg.teacherId,
        params.excludeLessonId || null,
        params.excludeLessonId || null,
        endIso,
        startIso
      ) as any[];

    for (const tb of teacherDoubleRows) {
      const msg = `Teacher ${tb.assigned_teacher_name} is already assigned to virtual class "${tb.title}" (${tb.start_time}-${tb.end_time} on ${tb.scheduled_date}).`;
      if (policy.teacherConflictPolicy === 'block') {
        blockingErrors.push(msg);
      } else {
        warnings.push(`Teacher double-booking warning: ${msg}`);
      }
    }

    // 3. Check existing Timetable Teacher Availability & Profiles
    const profile = db
      .prepare(
        `SELECT teacher_name, availability_json, active_in_timetable
         FROM tt_teacher_profiles
         WHERE tenant_id = ? AND user_id = ? LIMIT 1`
      )
      .get(params.schoolId, cfg.teacherId) as
      | { teacher_name: string; availability_json: string; active_in_timetable: number }
      | undefined;

    if (profile && profile.availability_json) {
      const avail = safeParseJson<Record<string, any>>(profile.availability_json, {});
      const weekday = startObj.toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'Africa/Nairobi',
      });
      if (avail[weekday] === false || (Array.isArray(avail.unavailableDays) && avail.unavailableDays.includes(weekday))) {
        const msg = `${profile.teacher_name} is marked unavailable on ${weekday} in the school timetable.`;
        if (policy.teacherConflictPolicy === 'block') {
          blockingErrors.push(msg);
        } else {
          warnings.push(`Timetable availability notice: ${msg}`);
        }
      }
    }
  }

  return { policy, warnings, blockingErrors };
}

/**
 * Cleanly closes a virtual classroom / whole lesson, deletes LiveKit rooms, finalises attendance & recordings.
 */
async function closeVirtualLessonOrRoom(params: {
  db: DatabaseSync;
  lessonId: string;
  classroomId?: string | null;
  closedBy: string;
  reason?: string;
}): Promise<void> {
  const { db, lessonId, classroomId, closedBy, reason } = params;
  const now = nowIso();
  const lesson = db.prepare(`SELECT * FROM virtual_lessons WHERE id = ?`).get(lessonId) as any;
  if (!lesson) return;

  const targetRooms = classroomId
    ? (db.prepare(`SELECT * FROM virtual_classrooms WHERE id = ? AND lesson_id = ?`).all(classroomId, lessonId) as any[])
    : (db.prepare(`SELECT * FROM virtual_classrooms WHERE lesson_id = ?`).all(lessonId) as any[]);

  for (const room of targetRooms) {
    if (room.room_status === 'completed' || room.room_status === 'cancelled') continue;

    // Close active connected participants & roll up attendance durations
    const connectedParticipants = db
      .prepare(
        `SELECT * FROM virtual_lesson_participants WHERE classroom_id = ? AND is_connected = 1`
      )
      .all(room.id) as any[];

    for (const p of connectedParticipants) {
      const joinedAtMs = p.last_heartbeat_at
        ? Date.parse(p.last_heartbeat_at)
        : p.join_time
        ? Date.parse(p.join_time)
        : Date.now();
      const extraSec = Math.max(0, Math.round((Date.now() - joinedAtMs) / 1000));
      const newTotalSec = Number(p.total_duration_seconds || 0) + extraSec;
      const totalMins = Number((newTotalSec / 60).toFixed(1));
      const attStatus = newTotalSec >= 60 ? (totalMins >= 5 ? 'present' : 'partial') : p.attendance_status || 'partial';

      db.prepare(
        `UPDATE virtual_lesson_participants
         SET is_connected = 0, leave_time = ?, total_duration_seconds = ?, attendance_status = ?, updated_at = ?
         WHERE id = ?`
      ).run(now, newTotalSec, attStatus, now, p.id);

      if (p.user_role === 'student') {
        db.prepare(
          `UPDATE virtual_lesson_attendance
           SET last_left_at = ?, total_attendance_minutes = ?, attendance_status = ?, updated_at = ?
           WHERE lesson_id = ? AND student_id = ?`
        ).run(now, totalMins, attStatus, now, lessonId, p.user_id);
      }
    }

    // Stop any active recordings on this classroom
    const activeRecordings = db
      .prepare(
        `SELECT * FROM virtual_lesson_recordings WHERE classroom_id = ? AND recording_status = 'recording' AND deleted_at IS NULL`
      )
      .all(room.id) as any[];

    for (const rec of activeRecordings) {
      await stopLiveKitEgressRecording(rec.egress_id);
      const startMs = Date.parse(rec.created_at) || Date.now();
      const durSec = Math.max(0, Math.round((Date.now() - startMs) / 1000));
      db.prepare(
        `UPDATE virtual_lesson_recordings
         SET recording_status = 'completed',
             duration_seconds = ?,
             stopped_by = ?,
             recording_url = COALESCE(recording_url, ?),
             updated_at = ?
         WHERE id = ?`
      ).run(
        durSec,
        closedBy,
        `/api/virtual-lessons/recordings/${rec.id}/metadata`,
        now,
        rec.id
      );
    }

    await broadcastLiveKitRoomData(room.livekit_room_name, {
      type: 'CLASSROOM_ENDED',
      lessonId,
      classroomId: room.id,
      reason: reason || 'Lesson completed',
    });
    await deleteLiveKitRoom(room.livekit_room_name);

    db.prepare(
      `UPDATE virtual_classrooms
       SET room_status = 'completed',
           actual_end_time = COALESCE(actual_end_time, ?),
           locked = 1,
           updated_at = ?
       WHERE id = ?`
    ).run(now, now, room.id);
  }

  // If all classrooms in this lesson are completed/cancelled, close parent lesson
  const remainingActive = db
    .prepare(
      `SELECT COUNT(*) as c FROM virtual_classrooms
       WHERE lesson_id = ? AND room_status IN ('scheduled', 'live', 'postponed')`
    )
    .get(lessonId) as { c: number };

  if (remainingActive.c === 0) {
    db.prepare(
      `UPDATE virtual_lessons
       SET status = 'completed',
           actual_ended_at = COALESCE(actual_ended_at, ?),
           updated_at = ?
       WHERE id = ?`
    ).run(now, now, lessonId);
    syncLessonNotifications(db, lessonId, 'completed');
  }

  notifyMySqlTablesChanged(VIRTUAL_CLASSROOM_TABLES);
  broadcastVirtualLessonChange(lesson.school_id, lessonId);
}

let schedulerHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Automatic 60-minute enforcement and 10-min / 5-min expiration warnings.
 */
export function startVirtualLessonScheduler(): void {
  if (schedulerHandle) return;
  schedulerHandle = setInterval(async () => {
    try {
      const db = getDb();
      const liveRooms = db
        .prepare(
          `SELECT vc.*, vl.max_capacity
           FROM virtual_classrooms vc
           JOIN virtual_lessons vl ON vl.id = vc.lesson_id
           WHERE vc.room_status = 'live'`
        )
        .all() as any[];

      const nowMs = Date.now();
      for (const room of liveRooms) {
        const startMs = Date.parse(room.actual_start_time || room.scheduled_start_at) || nowMs;
        const capMins = Math.min(60, Math.max(1, Number(room.duration_minutes || 60)));
        const hard60LimitMs = startMs + capMins * 60 * 1000;
        const absoluteMaxMs = startMs + 60 * 60 * 1000;
        const effectiveEndMs = Math.min(hard60LimitMs, absoluteMaxMs);
        const remainingMs = effectiveEndMs - nowMs;

        if (remainingMs <= 0) {
          await closeVirtualLessonOrRoom({
            db,
            lessonId: room.lesson_id,
            classroomId: room.id,
            closedBy: 'system-auto-60min-limit',
            reason: 'Automatic 60-minute classroom limit reached.',
          });
          continue;
        }

        if (remainingMs <= 10 * 60 * 1000 && !room.warning_10_sent) {
          db.prepare(`UPDATE virtual_classrooms SET warning_10_sent = 1, updated_at = ? WHERE id = ?`).run(
            nowIso(),
            room.id
          );
          db.prepare(`UPDATE virtual_lessons SET warning_10_sent = 1, updated_at = ? WHERE id = ?`).run(
            nowIso(),
            room.lesson_id
          );
          syncLessonNotifications(db, room.lesson_id, 'warning_10');
          await broadcastLiveKitRoomData(room.livekit_room_name, {
            type: 'TIME_WARNING',
            minutesRemaining: 10,
            classroomId: room.id,
          });
          broadcastVirtualLessonChange(room.school_id, room.lesson_id);
        }

        if (remainingMs <= 5 * 60 * 1000 && !room.warning_5_sent) {
          db.prepare(`UPDATE virtual_classrooms SET warning_5_sent = 1, updated_at = ? WHERE id = ?`).run(
            nowIso(),
            room.id
          );
          db.prepare(`UPDATE virtual_lessons SET warning_5_sent = 1, updated_at = ? WHERE id = ?`).run(
            nowIso(),
            room.lesson_id
          );
          syncLessonNotifications(db, room.lesson_id, 'warning_5');
          await broadcastLiveKitRoomData(room.livekit_room_name, {
            type: 'TIME_WARNING',
            minutesRemaining: 5,
            classroomId: room.id,
          });
          broadcastVirtualLessonChange(room.school_id, room.lesson_id);
        }
      }
    } catch (err) {
      console.warn('[virtual-classroom-scheduler] sweep error:', err);
    }
  }, 15000);
  if (typeof schedulerHandle.unref === 'function') {
    schedulerHandle.unref();
  }
}

function hydrateLessonBundle(db: DatabaseSync, lessonRow: any) {
  const grade = db
    .prepare(`SELECT id, name, grade_number, level_band FROM grades WHERE id = ?`)
    .get(lessonRow.grade_id) as any;

  const classrooms = db
    .prepare(`SELECT * FROM virtual_classrooms WHERE lesson_id = ? ORDER BY created_at ASC`)
    .all(lessonRow.id) as any[];

  const streamLinks = db
    .prepare(
      `SELECT vls.stream_id, vls.classroom_id, s.name as stream_name, s.display_name
       FROM virtual_lesson_streams vls
       JOIN streams s ON s.id = vls.stream_id
       WHERE vls.lesson_id = ?`
    )
    .all(lessonRow.id) as any[];

  const teacherAssignments = db
    .prepare(`SELECT * FROM virtual_lesson_teacher_assignments WHERE lesson_id = ?`)
    .all(lessonRow.id) as any[];

  const participants = db
    .prepare(`SELECT * FROM virtual_lesson_participants WHERE lesson_id = ? ORDER BY created_at ASC`)
    .all(lessonRow.id) as any[];

  const attendance = db
    .prepare(`SELECT * FROM virtual_lesson_attendance WHERE lesson_id = ? ORDER BY student_name ASC`)
    .all(lessonRow.id) as any[];

  const recordings = db
    .prepare(
      `SELECT * FROM virtual_lesson_recordings WHERE lesson_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`
    )
    .all(lessonRow.id) as any[];

  return {
    id: lessonRow.id,
    schoolId: lessonRow.school_id,
    gradeId: lessonRow.grade_id,
    gradeName: grade?.name || 'Grade',
    coordinatorId: lessonRow.coordinator_id,
    coordinatorName: lessonRow.coordinator_name,
    subjectName: lessonRow.subject_name,
    title: lessonRow.title,
    topic: lessonRow.topic,
    subtopic: lessonRow.subtopic || '',
    learningObjectives: lessonRow.learning_objectives,
    keyLearningPoints: safeParseJson<string[]>(lessonRow.key_learning_points_json, []),
    resources: safeParseJson<any[]>(lessonRow.resources_json, []),
    description: lessonRow.description || '',
    schedulingMode: lessonRow.scheduling_mode,
    classroomMode: lessonRow.classroom_mode,
    scheduledDate: lessonRow.scheduled_date,
    startTime: lessonRow.start_time,
    endTime: lessonRow.end_time,
    scheduledStartAt: lessonRow.scheduled_start_at,
    scheduledEndAt: lessonRow.scheduled_end_at,
    durationMinutes: Number(lessonRow.duration_minutes),
    timezone: lessonRow.timezone || 'Africa/Nairobi',
    status: lessonRow.status,
    isInstant: Boolean(lessonRow.is_instant),
    maxCapacity: Number(lessonRow.max_capacity || 30),
    recordingEnabled: Boolean(lessonRow.recording_enabled),
    waitingRoomEnabled: Boolean(lessonRow.waiting_room_enabled),
    studentChatEnabled: Boolean(lessonRow.student_chat_enabled),
    studentScreenshareEnabled: Boolean(lessonRow.student_screenshare_enabled),
    studentCameraEnabled: Boolean(lessonRow.student_camera_enabled),
    studentMicEnabled: Boolean(lessonRow.student_mic_enabled),
    interactionEnabled: Boolean(lessonRow.interaction_enabled),
    settings: safeParseJson<Record<string, any>>(lessonRow.classroom_settings_json, {}),
    postponedReason: lessonRow.postponed_reason || null,
    cancelledReason: lessonRow.cancelled_reason || null,
    actualStartedAt: lessonRow.actual_started_at || null,
    actualEndedAt: lessonRow.actual_ended_at || null,
    createdAt: lessonRow.created_at,
    updatedAt: lessonRow.updated_at,
    streams: streamLinks.map((s) => ({
      streamId: s.stream_id,
      classroomId: s.classroom_id,
      name: s.stream_name,
      displayName: s.display_name,
    })),
    classrooms: classrooms.map((c) => {
      const roomParticipants = participants.filter((p) => p.classroom_id === c.id);
      const roomStreams = streamLinks.filter((s) => s.classroom_id === c.id);
      return {
        id: c.id,
        lessonId: c.lesson_id,
        schoolId: c.school_id,
        gradeId: c.grade_id,
        streamId: c.stream_id || null,
        streamNames: roomStreams.map((s) => s.display_name || s.stream_name),
        livekitRoomName: c.livekit_room_name,
        title: c.title,
        classroomMode: c.classroom_mode,
        roomStatus: c.room_status,
        assignedTeacherId: c.assigned_teacher_id,
        assignedTeacherName: c.assigned_teacher_name,
        scheduledDate: c.scheduled_date,
        startTime: c.start_time,
        endTime: c.end_time,
        scheduledStartAt: c.scheduled_start_at,
        scheduledEndAt: c.scheduled_end_at,
        durationMinutes: Number(c.duration_minutes),
        actualStartTime: c.actual_start_time || null,
        actualEndTime: c.actual_end_time || null,
        capacity: Number(c.capacity || 30),
        locked: Boolean(c.locked),
        waitingRoomEnabled: Boolean(c.waiting_room_enabled),
        recordingEnabled: Boolean(c.recording_enabled),
        studentChatEnabled: Boolean(c.student_chat_enabled),
        studentScreenshareEnabled: Boolean(c.student_screenshare_enabled),
        studentCameraEnabled: Boolean(c.student_camera_enabled),
        studentMicEnabled: Boolean(c.student_mic_enabled),
        interactionEnabled: Boolean(c.interaction_enabled),
        mutedAll: Boolean(c.muted_all),
        connectedCount: roomParticipants.filter((p) => p.is_connected === 1).length,
        waitingCount: roomParticipants.filter((p) => p.admission_status === 'waiting').length,
      };
    }),
    teacherAssignments: teacherAssignments.map((t) => ({
      id: t.id,
      teacherId: t.teacher_id,
      teacherName: t.teacher_name,
      teacherEmail: t.teacher_email,
      classroomId: t.classroom_id,
      streamId: t.stream_id,
      assignmentType: t.assignment_type,
      canCoTeach: Boolean(t.can_co_teach),
    })),
    attendanceSummary: {
      totalRecorded: attendance.length,
      presentCount: attendance.filter((a) => a.attendance_status === 'present').length,
      partialCount: attendance.filter((a) => a.attendance_status === 'partial').length,
    },
    recordings: recordings.map((r) => ({
      id: r.id,
      classroomId: r.classroom_id,
      recordingId: r.recording_id,
      egressId: r.egress_id,
      recordingUrl: r.recording_url,
      recordingStatus: r.recording_status,
      durationSeconds: Number(r.duration_seconds || 0),
      startedBy: r.started_by,
      stoppedBy: r.stopped_by,
      retentionUntil: r.retention_until,
      createdAt: r.created_at,
    })),
  };
}

function resolveUserTeacherPrivilegesForLesson(
  db: DatabaseSync,
  session: AuthSession,
  schoolId: string,
  lesson: any,
  classroomId?: string | null
): { canModerate: boolean; canView: boolean; isAssignedCoordinator: boolean; isCoTeacher: boolean } {
  if (isSchoolAdmin(session)) {
    return { canModerate: true, canView: true, isAssignedCoordinator: false, isCoTeacher: false };
  }

  if (sessionHasRole(session, 'senior_teacher')) {
    const myGradeIds = getSeniorGradeIds(db, schoolId, session.userId);
    const managesGrade = myGradeIds.includes(lesson.grade_id) || lesson.coordinator_id === session.userId;
    if (managesGrade) {
      return {
        canModerate: true,
        canView: true,
        isAssignedCoordinator: true,
        isCoTeacher: false,
      };
    }
    // Fall through so a Senior Teacher assigned as a Subject Teacher / Room Lead / Co-Teacher
    // in another grade retains full Subject Teacher classroom privileges.
  }

  // Check explicit room / lesson assignment
  const roomRows = db
    .prepare(`SELECT assigned_teacher_id FROM virtual_classrooms WHERE lesson_id = ?`)
    .all(lesson.id) as Array<{ assigned_teacher_id: string }>;
  const isRoomLead = roomRows.some((r) => r.assigned_teacher_id === session.userId);

  const assignRow = db
    .prepare(
      `SELECT assignment_type, can_co_teach
       FROM virtual_lesson_teacher_assignments
       WHERE lesson_id = ? AND teacher_id = ?
         AND (? IS NULL OR classroom_id IS NULL OR classroom_id = ?)
       ORDER BY can_co_teach DESC LIMIT 1`
    )
    .get(lesson.id, session.userId, classroomId || null, classroomId || null) as
    | { assignment_type: string; can_co_teach: number }
    | undefined;

  const isCoTeacher = Boolean(
    assignRow && (assignRow.can_co_teach === 1 || assignRow.assignment_type === 'co_teacher' || assignRow.assignment_type === 'stream_teacher')
  );

  if (isRoomLead || isCoTeacher) {
    return {
      canModerate: true,
      canView: true,
      isAssignedCoordinator: lesson.coordinator_id === session.userId,
      isCoTeacher,
    };
  }

  // Check if subject teacher in that grade (view notification)
  const teachesInGrade = Boolean(
    db
      .prepare(
        `SELECT id FROM grade_teacher_assignments
         WHERE school_id = ? AND grade_id = ? AND teacher_id = ? AND is_active = 1 LIMIT 1`
      )
      .get(schoolId, lesson.grade_id, session.userId)
  );
  const classTeacherInGrade = Boolean(
    db
      .prepare(
        `SELECT id FROM stream_class_teachers
         WHERE school_id = ? AND grade_id = ? AND teacher_id = ? AND is_active = 1 LIMIT 1`
      )
      .get(schoolId, lesson.grade_id, session.userId)
  );

  return {
    canModerate: false,
    canView: teachesInGrade || classTeacherInGrade,
    isAssignedCoordinator: false,
    isCoTeacher: false,
  };
}

export function registerVirtualClassroomRoutes(app: Express): void {
  // -------------------------------------------------------------------------
  // 1. Metadata & Scheduling Context (Grade, Streams, Subject Teachers, Policies)
  // -------------------------------------------------------------------------
  app.get('/api/virtual-lessons/meta', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.schoolId as string | undefined);
    if (!schoolId) return;
    const livekit = getLiveKitConfig();
    const policy = getSchoolPolicy(db, schoolId);

    const allGrades = db
      .prepare(
        `SELECT g.*, gst.teacher_id as senior_teacher_id, gst.teacher_name as senior_teacher_name
         FROM grades g
         LEFT JOIN grade_senior_teachers gst ON gst.grade_id = g.id AND gst.is_active = 1
         WHERE g.school_id = ? AND g.is_active = 1
         ORDER BY COALESCE(g.grade_number, 999) ASC, g.name ASC`
      )
      .all(schoolId) as any[];

    let scopedGrades = allGrades;
    if (sessionHasRole(session, 'senior_teacher') && !isSchoolAdmin(session)) {
      const assignedIds = new Set(getSeniorGradeIds(db, schoolId, session.userId));
      scopedGrades = allGrades.filter((g) => assignedIds.has(g.id));
    } else if (session.role === 'student') {
      const placement = getStudentStreamPlacement(db, schoolId, session.userId);
      scopedGrades = placement ? allGrades.filter((g) => g.id === placement.gradeId) : [];
    }

    const gradeIds = scopedGrades.map((g) => g.id);
    const allStreams =
      gradeIds.length > 0
        ? (db
            .prepare(
              `SELECT s.*, sct.teacher_id as class_teacher_id, sct.teacher_name as class_teacher_name,
                 (SELECT COUNT(*) FROM student_stream_assignments ssa WHERE ssa.stream_id = s.id AND ssa.is_active = 1) as student_count
               FROM streams s
               LEFT JOIN stream_class_teachers sct ON sct.stream_id = s.id AND sct.is_active = 1
               WHERE s.school_id = ? AND s.is_active = 1
               ORDER BY s.name ASC`
            )
            .all(schoolId) as any[])
        : [];

    const teachers = db
      .prepare(
        `SELECT id, name, email, role, staff_number, tsc_number, payload_json
         FROM users
         WHERE school_id = ? AND is_active = 1
           AND role IN ('senior_teacher', 'class_teacher', 'teacher', 'hod', 'curriculum_coordinator', 'dean_of_studies', 'deputy_head', 'head_teacher')
         ORDER BY name ASC`
      )
      .all(schoolId) as any[];

    const gradeAssignments = db
      .prepare(
        `SELECT grade_id, stream_id, teacher_id, teacher_name, subject_name
         FROM grade_teacher_assignments
         WHERE school_id = ? AND is_active = 1`
      )
      .all(schoolId) as any[];

    const ttSubjects = db
      .prepare(`SELECT name, code, department FROM tt_subjects WHERE tenant_id = ? AND is_active = 1 ORDER BY name ASC`)
      .all(schoolId) as Array<{ name: string; code: string; department: string }>;

    const defaultSubjects = [
      'Mathematics',
      'English',
      'Kiswahili',
      'Integrated Science',
      'Social Studies',
      'Agriculture & Nutrition',
      'Creative Arts & Sports',
      'Pre-Technical Studies',
      'Religious Education (CRE)',
      'Computer Science',
    ];
    const subjectNames = Array.from(
      new Set([...ttSubjects.map((s) => s.name), ...gradeAssignments.map((a) => a.subject_name), ...defaultSubjects].filter(Boolean))
    );

    const nairobiNow = getNairobiDateTimeParts();

    res.json({
      schoolId,
      nairobiNow,
      policy,
      livekitStatus: {
        configured: livekit.configured,
        missingKeys: livekit.missingKeys,
      },
      grades: scopedGrades.map((g) => ({
        id: g.id,
        name: g.name,
        gradeNumber: g.grade_number,
        levelBand: g.level_band,
        seniorTeacherId: g.senior_teacher_id || null,
        seniorTeacherName: g.senior_teacher_name || null,
      })),
      streams: allStreams.map((s) => ({
        id: s.id,
        gradeId: s.grade_id,
        name: s.name,
        displayName: s.display_name,
        capacity: s.capacity,
        classTeacherId: s.class_teacher_id || null,
        classTeacherName: s.class_teacher_name || null,
        studentCount: Number(s.student_count || 0),
      })),
      teachers: teachers.map((t) => {
        const payload = safeParseJson<Record<string, any>>(t.payload_json, {});
        return {
          id: t.id,
          name: t.name,
          email: t.email,
          role: t.role,
          tscNumber: t.tsc_number || null,
          assignedSubjects: Array.isArray(payload.assignedSubjects) ? payload.assignedSubjects : [],
        };
      }),
      gradeSubjectAssignments: gradeAssignments.map((a) => ({
        gradeId: a.grade_id,
        streamId: a.stream_id || null,
        teacherId: a.teacher_id,
        teacherName: a.teacher_name,
        subjectName: a.subject_name,
      })),
      subjects: subjectNames,
    });
  });

  // -------------------------------------------------------------------------
  // 2. List Scoped Virtual Lessons & Notifications
  // -------------------------------------------------------------------------
  app.get('/api/virtual-lessons', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.schoolId as string | undefined);
    if (!schoolId) return;
    const statusFilter = req.query.status ? String(req.query.status) : null;
    const gradeIdFilter = req.query.gradeId ? String(req.query.gradeId) : null;
    const viewAsTeacher = String(req.query.viewAs || '').toLowerCase() === 'teacher';

    let rows: any[] = [];

    if (isSchoolAdmin(session) && !viewAsTeacher) {
      rows = db
        .prepare(
          `SELECT * FROM virtual_lessons
           WHERE school_id = ?
             AND (? IS NULL OR status = ?)
             AND (? IS NULL OR grade_id = ?)
           ORDER BY scheduled_start_at DESC`
        )
        .all(schoolId, statusFilter, statusFilter, gradeIdFilter, gradeIdFilter) as any[];
    } else if (sessionHasRole(session, 'senior_teacher') && !viewAsTeacher) {
      const assignedIds = getSeniorGradeIds(db, schoolId, session.userId);
      if (gradeIdFilter && !assignedIds.includes(gradeIdFilter)) {
        return res.status(403).json({ error: 'Access denied: you are only authorized for your assigned grade.' });
      }
      if (assignedIds.length === 0) {
        rows = db
          .prepare(
            `SELECT DISTINCT vl.*
             FROM virtual_lessons vl
             LEFT JOIN virtual_lesson_teacher_assignments vlta
               ON vlta.lesson_id = vl.id AND vlta.teacher_id = ?
             LEFT JOIN virtual_classrooms vc
               ON vc.lesson_id = vl.id AND vc.assigned_teacher_id = ?
             LEFT JOIN grade_teacher_assignments gta
               ON gta.school_id = vl.school_id AND gta.grade_id = vl.grade_id AND gta.teacher_id = ? AND gta.is_active = 1
             WHERE vl.school_id = ?
               AND (vlta.id IS NOT NULL OR vc.id IS NOT NULL OR gta.id IS NOT NULL)
               AND (? IS NULL OR vl.status = ?)
             ORDER BY vl.scheduled_start_at DESC`
          )
          .all(session.userId, session.userId, session.userId, schoolId, statusFilter, statusFilter) as any[];
      } else {
        const placeholders = assignedIds.map(() => '?').join(',');
        rows = db
          .prepare(
            `SELECT DISTINCT vl.*
             FROM virtual_lessons vl
             LEFT JOIN virtual_lesson_teacher_assignments vlta
               ON vlta.lesson_id = vl.id AND vlta.teacher_id = ?
             LEFT JOIN virtual_classrooms vc
               ON vc.lesson_id = vl.id AND vc.assigned_teacher_id = ?
             LEFT JOIN grade_teacher_assignments gta
               ON gta.school_id = vl.school_id AND gta.grade_id = vl.grade_id AND gta.teacher_id = ? AND gta.is_active = 1
             WHERE vl.school_id = ?
               AND (vl.grade_id IN (${placeholders}) OR vlta.id IS NOT NULL OR vc.id IS NOT NULL OR gta.id IS NOT NULL)
               AND (? IS NULL OR vl.status = ?)
               AND (? IS NULL OR vl.grade_id = ?)
             ORDER BY vl.scheduled_start_at DESC`
          )
          .all(session.userId, session.userId, session.userId, schoolId, ...assignedIds, statusFilter, statusFilter, gradeIdFilter, gradeIdFilter) as any[];
      }
    } else if (session.role === 'student') {
      const placement = getStudentStreamPlacement(db, schoolId, session.userId);
      if (!placement) {
        return res.json({ schoolId, lessons: [], notifications: [] });
      }
      rows = db
        .prepare(
          `SELECT DISTINCT vl.*
           FROM virtual_lessons vl
           JOIN virtual_lesson_streams vls ON vls.lesson_id = vl.id
           WHERE vl.school_id = ?
             AND vls.stream_id = ?
             AND (? IS NULL OR vl.status = ?)
           ORDER BY vl.scheduled_start_at DESC`
        )
        .all(schoolId, placement.streamId, statusFilter, statusFilter) as any[];
    } else if (session.role === 'parent') {
      const childrenIds = getParentChildrenIds(db, schoolId, session);
      const streamIds = new Set<string>();
      for (const cid of childrenIds) {
        const placement = getStudentStreamPlacement(db, schoolId, cid);
        if (placement) streamIds.add(placement.streamId);
      }
      if (streamIds.size === 0) {
        return res.json({ schoolId, lessons: [], notifications: [], childrenProgress: [] });
      }
      const streamArr = Array.from(streamIds);
      const placeholders = streamArr.map(() => '?').join(',');
      rows = db
        .prepare(
          `SELECT DISTINCT vl.*
           FROM virtual_lessons vl
           JOIN virtual_lesson_streams vls ON vls.lesson_id = vl.id
           WHERE vl.school_id = ?
             AND vls.stream_id IN (${placeholders})
             AND (? IS NULL OR vl.status = ?)
           ORDER BY vl.scheduled_start_at DESC`
        )
        .all(schoolId, ...streamArr, statusFilter, statusFilter) as any[];
    } else {
      // Subject Teacher / Class Teacher / HOD: sees lessons in grades they teach, or rooms they lead/co-teach
      rows = db
        .prepare(
          `SELECT DISTINCT vl.*
           FROM virtual_lessons vl
           LEFT JOIN virtual_lesson_teacher_assignments vlta
             ON vlta.lesson_id = vl.id AND vlta.teacher_id = ?
           LEFT JOIN virtual_classrooms vc
             ON vc.lesson_id = vl.id AND vc.assigned_teacher_id = ?
           LEFT JOIN grade_teacher_assignments gta
             ON gta.school_id = vl.school_id AND gta.grade_id = vl.grade_id AND gta.teacher_id = ? AND gta.is_active = 1
           LEFT JOIN stream_class_teachers sct
             ON sct.school_id = vl.school_id AND sct.grade_id = vl.grade_id AND sct.teacher_id = ? AND sct.is_active = 1
           WHERE vl.school_id = ?
             AND (vlta.id IS NOT NULL OR vc.id IS NOT NULL OR gta.id IS NOT NULL OR sct.id IS NOT NULL)
             AND (? IS NULL OR vl.status = ?)
           ORDER BY vl.scheduled_start_at DESC`
        )
        .all(session.userId, session.userId, session.userId, session.userId, schoolId, statusFilter, statusFilter) as any[];
    }

    const hydrated = rows.map((r) => {
      const bundle = hydrateLessonBundle(db, r);
      if (session.role === 'student') {
        const placement = getStudentStreamPlacement(db, schoolId, session.userId);
        // Student only sees classrooms that match their stream
        const filteredRooms = bundle.classrooms.filter((c) => {
          if (bundle.classroomMode === 'combined') return true;
          return !c.streamId || c.streamId === placement?.streamId;
        });
        const myAttendance = db
          .prepare(`SELECT * FROM virtual_lesson_attendance WHERE lesson_id = ? AND student_id = ? LIMIT 1`)
          .get(r.id, session.userId) as any;
        const myParticipant = db
          .prepare(
            `SELECT admission_status, is_connected FROM virtual_lesson_participants
             WHERE lesson_id = ? AND user_id = ? LIMIT 1`
          )
          .get(r.id, session.userId) as any;
        const subStatus = evaluateStudentSubscription(db, schoolId, session.userId, r.id);
        return {
          ...bundle,
          classrooms: filteredRooms,
          myAttendance: myAttendance || null,
          myAdmissionStatus: myParticipant?.admission_status || null,
          mySubscription: subStatus,
        };
      }

      if (session.role === 'parent') {
        const childrenIds = getParentChildrenIds(db, schoolId, session);
        const childRecords = childrenIds.map((cid) => {
          const stu = db
            .prepare(`SELECT id, name, stream_id, stream_label, grade_label FROM students WHERE id = ? LIMIT 1`)
            .get(cid) as any;
          const att = db
            .prepare(`SELECT * FROM virtual_lesson_attendance WHERE lesson_id = ? AND student_id = ? LIMIT 1`)
            .get(r.id, cid) as any;
          const sub = evaluateStudentSubscription(db, schoolId, cid, r.id);
          return {
            studentId: cid,
            studentName: stu?.name || 'Student',
            streamId: stu?.stream_id || null,
            attendance: att || null,
            subscription: sub,
          };
        });
        return { ...bundle, childrenProgress: childRecords };
      }

      if (viewAsTeacher || (!isSchoolAdmin(session) && !sessionHasRole(session, 'senior_teacher'))) {
        const priv = resolveUserTeacherPrivilegesForLesson(db, session, schoolId, r);
        const myAssignments = bundle.teacherAssignments.filter((t) => t.teacherId === session.userId);
        return {
          ...bundle,
          myPrivileges: priv,
          myAssignments,
        };
      }

      return bundle;
    });

    // Also include recipient's scoped notifications
    const notifRows = db
      .prepare(
        `SELECT vln.*, g.name as grade_name
         FROM virtual_lesson_notifications vln
         LEFT JOIN grades g ON g.id = vln.grade_id
         WHERE vln.school_id = ? AND vln.recipient_id = ?
         ORDER BY vln.updated_at DESC
         LIMIT 50`
      )
      .all(schoolId, session.userId) as any[];

    res.json({
      schoolId,
      lessons: hydrated,
      notifications: notifRows.map((n) => ({
        ...n,
        streamIds: safeParseJson<string[]>(n.stream_ids_json, []),
        isCoTeacher: Boolean(n.is_co_teacher),
      })),
    });
  });

  // -------------------------------------------------------------------------
  // 3. Dedicated Notifications Endpoints
  // -------------------------------------------------------------------------
  app.get('/api/virtual-lessons/notifications', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.schoolId as string | undefined);
    if (!schoolId) return;
    const rows = db
      .prepare(
        `SELECT vln.*, g.name as grade_name
         FROM virtual_lesson_notifications vln
         LEFT JOIN grades g ON g.id = vln.grade_id
         WHERE vln.school_id = ? AND vln.recipient_id = ?
         ORDER BY vln.updated_at DESC
         LIMIT 100`
      )
      .all(schoolId, session.userId) as any[];

    res.json({
      schoolId,
      unreadCount: rows.filter((r) => !r.read_at).length,
      notifications: rows.map((n) => ({
        ...n,
        streamIds: safeParseJson<string[]>(n.stream_ids_json, []),
        isCoTeacher: Boolean(n.is_co_teacher),
      })),
    });
  });

  app.post('/api/virtual-lessons/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    db.prepare(
      `UPDATE virtual_lesson_notifications
       SET read_at = COALESCE(read_at, ?)
       WHERE id = ? AND school_id = ? AND recipient_id = ?`
    ).run(nowIso(), req.params.id, schoolId, session.userId);
    notifyMySqlTablesChanged(['virtual_lesson_notifications']);
    res.json({ ok: true });
  });

  // -------------------------------------------------------------------------
  // 4. School Admin Virtual Classroom Monitoring & Policies
  // -------------------------------------------------------------------------
  app.get('/api/virtual-lessons/admin/monitoring', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    if (!isSchoolAdmin(session)) {
      return res.status(403).json({ error: 'Only School Administrators can access school-wide virtual classroom monitoring.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.schoolId as string | undefined);
    if (!schoolId) return;
    const policy = getSchoolPolicy(db, schoolId);
    const livekit = getLiveKitConfig();

    const counts = db
      .prepare(
        `SELECT
           COUNT(*) as totalLessons,
           SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduledCount,
           SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as liveCount,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedCount,
           SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledCount,
           SUM(CASE WHEN status = 'postponed' THEN 1 ELSE 0 END) as postponedCount
         FROM virtual_lessons WHERE school_id = ?`
      )
      .get(schoolId) as any;

    const liveRooms = db
      .prepare(
        `SELECT vc.*, g.name as grade_name, vl.subject_name, vl.topic, vl.coordinator_name
         FROM virtual_classrooms vc
         JOIN virtual_lessons vl ON vl.id = vc.lesson_id
         JOIN grades g ON g.id = vc.grade_id
         WHERE vc.school_id = ? AND vc.room_status = 'live'
         ORDER BY vc.actual_start_time DESC`
      )
      .all(schoolId) as any[];

    const participatingStats = db
      .prepare(
        `SELECT
           COUNT(DISTINCT CASE WHEN vlp.is_connected = 1 AND vlp.user_role = 'student' THEN vlp.user_id END) as activeStudents,
           COUNT(DISTINCT CASE WHEN vlp.is_connected = 1 AND vlp.user_role != 'student' THEN vlp.user_id END) as activeTeachers,
           COUNT(DISTINCT CASE WHEN vla.attendance_status = 'present' THEN vla.id END) as verifiedPresentCount,
           COUNT(DISTINCT vla.id) as totalAttendanceRows
         FROM virtual_lessons vl
         LEFT JOIN virtual_lesson_participants vlp ON vlp.lesson_id = vl.id
         LEFT JOIN virtual_lesson_attendance vla ON vla.lesson_id = vl.id
         WHERE vl.school_id = ?`
      )
      .get(schoolId) as any;

    const totalEnrolledStudents = (
      db.prepare(`SELECT COUNT(*) as c FROM students WHERE school_id = ? AND is_active = 1`).get(schoolId) as { c: number }
    ).c;

    const allLessons = (
      db
        .prepare(`SELECT * FROM virtual_lessons WHERE school_id = ? ORDER BY scheduled_start_at DESC LIMIT 80`)
        .all(schoolId) as any[]
    ).map((l) => hydrateLessonBundle(db, l));

    const subscriptions = db
      .prepare(
        `SELECT sds.*, stu.grade_label, stu.stream_label, stu.admission_number
         FROM student_digital_subscriptions sds
         LEFT JOIN students stu ON stu.id = sds.student_id
         WHERE sds.school_id = ?
         ORDER BY sds.updated_at DESC
         LIMIT 100`
      )
      .all(schoolId) as any[];

    const activeRoomsSum = liveRooms.length;
    const totalCapacitySum = liveRooms.reduce((acc, r) => acc + Number(r.capacity || 30), 0);
    const totalActiveHeads = Number(participatingStats?.activeStudents || 0) + Number(participatingStats?.activeTeachers || 0);
    const utilizationPct = totalCapacitySum > 0 ? Math.min(100, Math.round((totalActiveHeads / totalCapacitySum) * 100)) : 0;

    const attendanceRatePct =
      Number(participatingStats?.totalAttendanceRows || 0) > 0
        ? Math.round((Number(participatingStats.verifiedPresentCount) / Number(participatingStats.totalAttendanceRows)) * 100)
        : 0;

    res.json({
      schoolId,
      policy,
      livekitStatus: {
        configured: livekit.configured,
        missingKeys: livekit.missingKeys,
      },
      metrics: {
        totalLessons: Number(counts?.totalLessons || 0),
        scheduledCount: Number(counts?.scheduledCount || 0),
        liveCount: Number(counts?.liveCount || 0),
        completedCount: Number(counts?.completedCount || 0),
        cancelledCount: Number(counts?.cancelledCount || 0),
        postponedCount: Number(counts?.postponedCount || 0),
        activeRoomsCount: activeRoomsSum,
        activeStudentsCount: Number(participatingStats?.activeStudents || 0),
        activeTeachersCount: Number(participatingStats?.activeTeachers || 0),
        totalEnrolledStudents,
        attendanceRatePct,
        roomUtilizationPct: utilizationPct,
      },
      liveRooms: liveRooms.map((r) => {
        const connected = (
          db
            .prepare(`SELECT COUNT(*) as c FROM virtual_lesson_participants WHERE classroom_id = ? AND is_connected = 1`)
            .get(r.id) as { c: number }
        ).c;
        return {
          ...r,
          connectedCount: connected,
        };
      }),
      lessons: allLessons,
      subscriptions,
    });
  });

  app.put('/api/virtual-lessons/admin/policies', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    if (!isSchoolAdmin(session)) {
      return res.status(403).json({ error: 'Only School Administrators can update virtual classroom policies.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
    if (!schoolId) return;
    const current = getSchoolPolicy(db, schoolId);

    const maxCap = Math.max(5, Math.min(200, Number(req.body?.defaultMaxCapacity ?? current.defaultMaxCapacity)));
    const maxDur = Math.max(15, Math.min(60, Number(req.body?.maxDurationMinutes ?? current.maxDurationMinutes)));
    const overlapPolicy = req.body?.overlapPolicy === 'block' ? 'block' : 'warn';
    const teacherConflictPolicy = req.body?.teacherConflictPolicy === 'block' ? 'block' : 'warn';
    const defaultRec = req.body?.defaultRecordingEnabled ? 1 : 0;
    const defaultWait = req.body?.defaultWaitingRoomEnabled === false ? 0 : 1;
    const requirePaidPassOnly = req.body?.requirePaidPassOnly ? 1 : 0;
    const weeklyLimit = Math.max(1, Math.min(100, Number(req.body?.weeklyLessonLimitDefault ?? current.weeklyLessonLimitDefault)));
    const retentionDays = Math.max(7, Math.min(365, Number(req.body?.recordingRetentionDays ?? current.recordingRetentionDays)));

    db.prepare(
      `INSERT INTO virtual_classroom_school_policies
         (school_id, default_max_capacity, max_duration_minutes, overlap_policy, teacher_conflict_policy,
          default_recording_enabled, default_waiting_room_enabled, require_paid_pass_only,
          weekly_lesson_limit_default, recording_retention_days, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(school_id) DO UPDATE SET
         default_max_capacity = excluded.default_max_capacity,
         max_duration_minutes = excluded.max_duration_minutes,
         overlap_policy = excluded.overlap_policy,
         teacher_conflict_policy = excluded.teacher_conflict_policy,
         default_recording_enabled = excluded.default_recording_enabled,
         default_waiting_room_enabled = excluded.default_waiting_room_enabled,
         require_paid_pass_only = excluded.require_paid_pass_only,
         weekly_lesson_limit_default = excluded.weekly_lesson_limit_default,
         recording_retention_days = excluded.recording_retention_days,
         updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`
    ).run(
      schoolId,
      maxCap,
      maxDur,
      overlapPolicy,
      teacherConflictPolicy,
      defaultRec,
      defaultWait,
      requirePaidPassOnly,
      weeklyLimit,
      retentionDays,
      session.userId,
      nowIso()
    );

    writeVirtualAudit(db, {
      schoolId,
      session,
      action: 'update_school_policies',
      details: { maxCap, overlapPolicy, teacherConflictPolicy, requirePaidPassOnly, weeklyLimit },
    });
    notifyMySqlTablesChanged(['virtual_classroom_school_policies']);
    res.json({ policy: getSchoolPolicy(db, schoolId) });
  });

  app.put('/api/virtual-lessons/admin/subscriptions/:studentId', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    if (!isSchoolAdmin(session)) {
      return res.status(403).json({ error: 'Only School Administrators can update student virtual subscriptions.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
    if (!schoolId) return;
    const { studentId } = req.params;
    const stu = db
      .prepare(`SELECT id, name, email FROM students WHERE school_id = ? AND id = ? LIMIT 1`)
      .get(schoolId, studentId) as { id: string; name: string; email: string } | undefined;

    const approvalStatus = ['approved', 'pending', 'suspended', 'expired'].includes(String(req.body?.approvalStatus))
      ? String(req.body.approvalStatus)
      : 'approved';
    const weeklyLessonLimit = Math.max(0, Math.min(200, Number(req.body?.weeklyLessonLimit ?? 20)));
    const lessonsUsedThisWeek = Math.max(0, Number(req.body?.lessonsUsedThisWeek ?? 0));
    const weekKey = getCurrentWeekKey();
    const now = nowIso();

    const existing = db
      .prepare(`SELECT id FROM student_digital_subscriptions WHERE school_id = ? AND student_id = ? LIMIT 1`)
      .get(schoolId, studentId) as { id: string } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE student_digital_subscriptions
         SET approval_status = ?, weekly_lesson_limit = ?, lessons_used_this_week = ?,
             expires_at = ?, tier = ?, updated_by = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        approvalStatus,
        weeklyLessonLimit,
        lessonsUsedThisWeek,
        req.body?.expiresAt ?? null,
        String(req.body?.tier || 'school_bundled'),
        session.userId,
        now,
        existing.id
      );
    } else {
      db.prepare(
        `INSERT INTO student_digital_subscriptions
           (id, school_id, student_id, student_name, student_email, tier, approval_status,
            weekly_lesson_limit, lessons_used_this_week, week_key, expires_at, updated_by, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        `sds-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        schoolId,
        studentId,
        stu?.name || req.body?.studentName || 'Student',
        stu?.email || req.body?.studentEmail || null,
        String(req.body?.tier || 'school_bundled'),
        approvalStatus,
        weeklyLessonLimit,
        lessonsUsedThisWeek,
        weekKey,
        req.body?.expiresAt ?? null,
        session.userId,
        now
      );
    }

    notifyMySqlTablesChanged(['student_digital_subscriptions']);
    broadcastVirtualLessonChange(schoolId, studentId, session.userId);
    res.json({ ok: true });
  });

  // -------------------------------------------------------------------------
  // 5. Schedule OR Start Instant Virtual Lesson
  // -------------------------------------------------------------------------
  async function handleCreateLesson(req: Request, res: Response, isInstantStart: boolean) {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
    if (!schoolId) return;

    if (!isSchoolAdmin(session) && !sessionHasRole(session, 'senior_teacher')) {
      return res.status(403).json({
        error: 'Only Grade Senior Teachers (for their assigned grade) or School Administrators can schedule virtual lessons.',
      });
    }

    const body = req.body || {};
    const gradeId = String(body.gradeId || '').trim();
    const subjectName = String(body.subjectName || '').trim();
    const title = String(body.title || '').trim();
    const topic = String(body.topic || '').trim();
    const subtopic = String(body.subtopic || '').trim();
    const learningObjectives = String(body.learningObjectives || '').trim();
    const description = String(body.description || '').trim();

    const rawPoints: string[] = Array.isArray(body.keyLearningPoints)
      ? body.keyLearningPoints.map((p: any) => String(p || '').trim()).filter(Boolean)
      : String(body.keyLearningPoints || '')
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean);

    const resources = Array.isArray(body.resources) ? body.resources : [];
    const schedulingMode = String(body.schedulingMode || 'individual_stream') as
      | 'individual_stream'
      | 'selected_streams_combined'
      | 'all_streams_combined'
      | 'multiple_separate';

    if (!gradeId || !subjectName || !title || !topic || !learningObjectives) {
      return res.status(400).json({
        error: 'Grade, subject, lesson title, topic, and learning objectives are all required.',
      });
    }
    if (rawPoints.length < 3) {
      return res.status(400).json({
        error: 'Please provide at least 3 learning key points for the lesson.',
      });
    }

    // Verify grade exists and Senior Teacher is strictly assigned to it
    const gradeRow = db
      .prepare(`SELECT id, name FROM grades WHERE id = ? AND school_id = ? AND is_active = 1`)
      .get(gradeId, schoolId) as { id: string; name: string } | undefined;
    if (!gradeRow) {
      return res.status(404).json({ error: 'Selected grade not found in this school.' });
    }

    if (sessionHasRole(session, 'senior_teacher') && !isSchoolAdmin(session)) {
      const assignedIds = getSeniorGradeIds(db, schoolId, session.userId);
      if (!assignedIds.includes(gradeId)) {
        return res.status(403).json({
          error: 'Access denied: Senior Teachers can only schedule virtual lessons for their explicitly assigned grade.',
        });
      }
    }

    const gradeStreams = db
      .prepare(`SELECT id, name, display_name FROM streams WHERE school_id = ? AND grade_id = ? AND is_active = 1`)
      .all(schoolId, gradeId) as Array<{ id: string; name: string; display_name: string }>;
    const validStreamMap = new Map(gradeStreams.map((s) => [s.id, s]));

    const durationMinutes = Number(body.durationMinutes || 40);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 60) {
      return res.status(400).json({ error: 'Lesson duration must be between 1 and 60 minutes.' });
    }

    const nairobiNow = getNairobiDateTimeParts();
    const scheduledDate = isInstantStart ? nairobiNow.dateStr : String(body.scheduledDate || nairobiNow.dateStr).trim();
    const startTime = isInstantStart ? nairobiNow.timeStr : String(body.startTime || nairobiNow.timeStr).trim();

    // Determine classroom & stream allocation plan
    const classroomMode: 'combined' | 'separate' = schedulingMode === 'multiple_separate' ? 'separate' : 'combined';
    let targetStreamIds: string[] = Array.isArray(body.streamIds)
      ? body.streamIds.map((id: any) => String(id).trim()).filter(Boolean)
      : [];

    if (schedulingMode === 'all_streams_combined') {
      targetStreamIds = gradeStreams.map((s) => s.id);
    }

    // Lookup explicit 1-to-1 (grade, specific stream, subject) -> teacher assignments
    const streamSubjectTeacherRows = db
      .prepare(
        `SELECT stream_id, teacher_id, teacher_name
         FROM grade_teacher_assignments
         WHERE school_id = ? AND grade_id = ? AND lower(subject_name) = lower(?) AND is_active = 1 AND stream_id IS NOT NULL`
      )
      .all(schoolId, gradeId, subjectName) as Array<{ stream_id: string; teacher_id: string; teacher_name: string }>;
    const streamSubjectTeacherMap = new Map(
      streamSubjectTeacherRows.map((r) => [r.stream_id, { id: r.teacher_id, name: r.teacher_name }])
    );

    interface SeparateRoomInput {
      streamId: string;
      teacherId: string;
      teacherName: string;
      scheduledDate: string;
      startTime: string;
      durationMinutes: number;
      title?: string;
    }

    let separateRooms: SeparateRoomInput[] = [];
    if (schedulingMode === 'multiple_separate') {
      const rawItems = Array.isArray(body.separateStreamSchedules) ? body.separateStreamSchedules : [];
      if (rawItems.length > 0) {
        separateRooms = rawItems.map((item: any) => {
          const sid = String(item.streamId || '').trim();
          const linked = streamSubjectTeacherMap.get(sid);
          const tid = String(item.teacherId || linked?.id || body.leadTeacherId || session.userId).trim();
          const tRow = db.prepare(`SELECT id, name FROM users WHERE id = ? AND school_id = ?`).get(tid, schoolId) as
            | { id: string; name: string }
            | undefined;
          const dur = Number(item.durationMinutes || durationMinutes);
          return {
            streamId: sid,
            teacherId: tRow?.id || linked?.id || session.userId,
            teacherName: tRow?.name || linked?.name || String(session.user?.name || 'Teacher'),
            scheduledDate: isInstantStart ? nairobiNow.dateStr : String(item.scheduledDate || scheduledDate).trim(),
            startTime: isInstantStart ? nairobiNow.timeStr : String(item.startTime || startTime).trim(),
            durationMinutes: dur,
            title: item.title ? String(item.title).trim() : undefined,
          };
        });
      } else {
        separateRooms = targetStreamIds.map((sid) => {
          const linked = streamSubjectTeacherMap.get(sid);
          return {
            streamId: sid,
            teacherId: String(body.leadTeacherId || linked?.id || session.userId),
            teacherName: String(body.leadTeacherName || linked?.name || session.user?.name || 'Teacher'),
            scheduledDate,
            startTime,
            durationMinutes,
          };
        });
      }
      targetStreamIds = separateRooms.map((r) => r.streamId);
    }

    if (targetStreamIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one stream for this virtual lesson.' });
    }
    if (schedulingMode === 'individual_stream' && targetStreamIds.length !== 1) {
      return res.status(400).json({ error: 'Individual Stream scheduling requires selecting exactly one stream.' });
    }

    for (const sid of targetStreamIds) {
      if (!validStreamMap.has(sid)) {
        return res.status(400).json({
          error: `Selected stream (${sid}) does not belong to ${gradeRow.name} or is inactive.`,
        });
      }
    }

    // Lead teacher for combined / individual mode (prefers explicit stream-subject assignment when omitted)
    const defaultLinkedTeacher =
      targetStreamIds.length === 1 ? streamSubjectTeacherMap.get(targetStreamIds[0]) : undefined;
    const leadTeacherId = String(body.leadTeacherId || defaultLinkedTeacher?.id || session.userId).trim();
    const leadTeacherRow = db
      .prepare(`SELECT id, name, email FROM users WHERE id = ? AND school_id = ?`)
      .get(leadTeacherId, schoolId) as { id: string; name: string; email: string } | undefined;

    const leadTeacherName = leadTeacherRow?.name || defaultLinkedTeacher?.name || String(session.user?.name || 'Senior Teacher');

    // Run conflict validation across streams & teachers
    const validationInput =
      classroomMode === 'separate'
        ? separateRooms.map((sr) => ({
            streamId: sr.streamId,
            teacherId: sr.teacherId,
            scheduledDate: sr.scheduledDate,
            startTime: sr.startTime,
            durationMinutes: sr.durationMinutes,
          }))
        : targetStreamIds.map((sid) => ({
            streamId: sid,
            teacherId: leadTeacherId,
            scheduledDate,
            startTime,
            durationMinutes,
          }));

    const { policy, warnings, blockingErrors } = validateScheduleAndConflicts(db, {
      schoolId,
      gradeId,
      scheduledDate,
      startTime,
      durationMinutes,
      streamConfigs: validationInput,
    });

    if (blockingErrors.length > 0) {
      return res.status(409).json({
        error: blockingErrors[0],
        blockingErrors,
        warnings,
      });
    }

    if (body.previewOnly) {
      return res.json({ valid: true, warnings, policy });
    }

    // Create Lesson + Classrooms + Stream Links + Co-teacher Assignments + Notifications
    const now = nowIso();
    const lessonId = `vl-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const mainStartDate = isInstantStart ? new Date() : parseNairobiDateTime(scheduledDate, startTime);
    const mainEndDate = new Date(mainStartDate.getTime() + durationMinutes * 60 * 1000);
    const mainEndTime = getNairobiDateTimeParts(mainEndDate).timeStr;
    const status = isInstantStart ? 'live' : 'scheduled';

    const settings = body.settings || {};
    const maxCapacity = Math.max(
      2,
      Math.min(200, Number(body.maxCapacity ?? settings.maxCapacity ?? policy.defaultMaxCapacity ?? 30))
    );
    const recordingEnabled = Boolean(settings.recordingEnabled ?? body.recordingEnabled ?? policy.defaultRecordingEnabled) ? 1 : 0;
    const waitingRoomEnabled =
      (settings.waitingRoomEnabled ?? body.waitingRoomEnabled ?? policy.defaultWaitingRoomEnabled) ? 1 : 0;
    const studentChatEnabled = (settings.studentChatEnabled ?? body.studentChatEnabled ?? true) ? 1 : 0;
    const studentScreenshareEnabled =
      Boolean(settings.studentScreenshareEnabled ?? body.studentScreenshareEnabled ?? false) ? 1 : 0;
    const studentCameraEnabled = (settings.studentCameraEnabled ?? body.studentCameraEnabled ?? true) ? 1 : 0;
    const studentMicEnabled = Boolean(settings.studentMicEnabled ?? body.studentMicEnabled ?? false) ? 1 : 0;
    const interactionEnabled = (settings.interactionEnabled ?? body.interactionEnabled ?? true) ? 1 : 0;

    const coTeacherIds: string[] = Array.isArray(body.coTeacherIds)
      ? Array.from(new Set(body.coTeacherIds.map((id: any) => String(id).trim()).filter(Boolean)))
      : [];

    const createdClassroomIds: Array<{ id: string; roomName: string; title: string; maxCapacity: number }> = [];

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(
        `INSERT INTO virtual_lessons
           (id, school_id, grade_id, coordinator_id, coordinator_name, subject_name, title, topic, subtopic,
            learning_objectives, key_learning_points_json, resources_json, description, scheduling_mode,
            classroom_mode, scheduled_date, start_time, end_time, scheduled_start_at, scheduled_end_at,
            duration_minutes, timezone, status, is_instant, max_capacity, recording_enabled, waiting_room_enabled,
            student_chat_enabled, student_screenshare_enabled, student_camera_enabled, student_mic_enabled,
            interaction_enabled, classroom_settings_json, actual_started_at, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Africa/Nairobi', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        lessonId,
        schoolId,
        gradeId,
        session.userId,
        String(session.user?.name || 'Senior Teacher'),
        subjectName,
        title,
        topic,
        subtopic || null,
        learningObjectives,
        JSON.stringify(rawPoints),
        JSON.stringify(resources),
        description || null,
        schedulingMode,
        classroomMode,
        scheduledDate,
        startTime,
        mainEndTime,
        mainStartDate.toISOString(),
        mainEndDate.toISOString(),
        durationMinutes,
        status,
        isInstantStart ? 1 : 0,
        maxCapacity,
        recordingEnabled,
        waitingRoomEnabled,
        studentChatEnabled,
        studentScreenshareEnabled,
        studentCameraEnabled,
        studentMicEnabled,
        interactionEnabled,
        JSON.stringify(settings),
        isInstantStart ? now : null,
        session.userId,
        now,
        now
      );

      if (classroomMode === 'combined') {
        const classroomId = `vc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        const roomName = buildCanonicalLiveKitRoomName({
          schoolId,
          gradeId,
          lessonId,
          streamId: targetStreamIds.length === 1 ? targetStreamIds[0] : null,
        });
        const streamLabel = targetStreamIds
          .map((sid) => validStreamMap.get(sid)?.display_name || validStreamMap.get(sid)?.name || '')
          .filter(Boolean)
          .join(' + ');
        const roomTitle = `${subjectName}: ${title} (${streamLabel})`;

        db.prepare(
          `INSERT INTO virtual_classrooms
             (id, school_id, lesson_id, grade_id, stream_id, livekit_room_name, title, classroom_mode, room_status,
              assigned_teacher_id, assigned_teacher_name, scheduled_date, start_time, end_time,
              scheduled_start_at, scheduled_end_at, duration_minutes, actual_start_time, capacity, locked,
              waiting_room_enabled, recording_enabled, student_chat_enabled, student_screenshare_enabled,
              student_camera_enabled, student_mic_enabled, interaction_enabled, muted_all, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'combined', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
        ).run(
          classroomId,
          schoolId,
          lessonId,
          gradeId,
          targetStreamIds.length === 1 ? targetStreamIds[0] : null,
          roomName,
          roomTitle,
          status,
          leadTeacherId,
          leadTeacherName,
          scheduledDate,
          startTime,
          mainEndTime,
          mainStartDate.toISOString(),
          mainEndDate.toISOString(),
          durationMinutes,
          isInstantStart ? now : null,
          maxCapacity,
          waitingRoomEnabled,
          recordingEnabled,
          studentChatEnabled,
          studentScreenshareEnabled,
          studentCameraEnabled,
          studentMicEnabled,
          interactionEnabled,
          now,
          now
        );

        for (const sid of targetStreamIds) {
          db.prepare(
            `INSERT INTO virtual_lesson_streams (id, school_id, lesson_id, grade_id, stream_id, classroom_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(`vls-${crypto.randomBytes(5).toString('hex')}`, schoolId, lessonId, gradeId, sid, classroomId, now);
        }

        createdClassroomIds.push({ id: classroomId, roomName, title: roomTitle, maxCapacity });
      } else {
        // Mode 4: Separate simultaneous or individually timed rooms per stream
        for (const sr of separateRooms) {
          const streamObj = validStreamMap.get(sr.streamId)!;
          const classroomId = `vc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
          const roomName = buildCanonicalLiveKitRoomName({
            schoolId,
            gradeId,
            lessonId,
            streamId: sr.streamId,
          });
          const sStartDate = isInstantStart ? new Date() : parseNairobiDateTime(sr.scheduledDate, sr.startTime);
          const sEndDate = new Date(sStartDate.getTime() + sr.durationMinutes * 60 * 1000);
          const sEndTime = getNairobiDateTimeParts(sEndDate).timeStr;
          const roomTitle = sr.title || `${subjectName}: ${title} (${streamObj.display_name || streamObj.name})`;

          db.prepare(
            `INSERT INTO virtual_classrooms
               (id, school_id, lesson_id, grade_id, stream_id, livekit_room_name, title, classroom_mode, room_status,
                assigned_teacher_id, assigned_teacher_name, scheduled_date, start_time, end_time,
                scheduled_start_at, scheduled_end_at, duration_minutes, actual_start_time, capacity, locked,
                waiting_room_enabled, recording_enabled, student_chat_enabled, student_screenshare_enabled,
                student_camera_enabled, student_mic_enabled, interaction_enabled, muted_all, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'separate', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
          ).run(
            classroomId,
            schoolId,
            lessonId,
            gradeId,
            sr.streamId,
            roomName,
            roomTitle,
            status,
            sr.teacherId,
            sr.teacherName,
            sr.scheduledDate,
            sr.startTime,
            sEndTime,
            sStartDate.toISOString(),
            sEndDate.toISOString(),
            sr.durationMinutes,
            isInstantStart ? now : null,
            maxCapacity,
            waitingRoomEnabled,
            recordingEnabled,
            studentChatEnabled,
            studentScreenshareEnabled,
            studentCameraEnabled,
            studentMicEnabled,
            interactionEnabled,
            now,
            now
          );

          db.prepare(
            `INSERT INTO virtual_lesson_streams (id, school_id, lesson_id, grade_id, stream_id, classroom_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(`vls-${crypto.randomBytes(5).toString('hex')}`, schoolId, lessonId, gradeId, sr.streamId, classroomId, now);

          db.prepare(
            `INSERT OR IGNORE INTO virtual_lesson_teacher_assignments
               (id, school_id, lesson_id, classroom_id, teacher_id, teacher_name, stream_id, assignment_type, can_co_teach, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'stream_teacher', 1, ?, ?)`
          ).run(
            `vlta-${crypto.randomBytes(5).toString('hex')}`,
            schoolId,
            lessonId,
            classroomId,
            sr.teacherId,
            sr.teacherName,
            sr.streamId,
            now,
            now
          );

          createdClassroomIds.push({ id: classroomId, roomName, title: roomTitle, maxCapacity });
        }
      }

      // Assign Coordinator & Explicit Co-Teachers
      db.prepare(
        `INSERT OR IGNORE INTO virtual_lesson_teacher_assignments
           (id, school_id, lesson_id, classroom_id, teacher_id, teacher_name, teacher_email, assignment_type, can_co_teach, created_at, updated_at)
         VALUES (?, ?, ?, NULL, ?, ?, ?, 'coordinator', 1, ?, ?)`
      ).run(
        `vlta-${crypto.randomBytes(5).toString('hex')}`,
        schoolId,
        lessonId,
        session.userId,
        String(session.user?.name || 'Senior Teacher'),
        session.user?.email || null,
        now,
        now
      );

      if (classroomMode === 'combined' && leadTeacherId !== session.userId) {
        db.prepare(
          `INSERT OR IGNORE INTO virtual_lesson_teacher_assignments
             (id, school_id, lesson_id, classroom_id, teacher_id, teacher_name, teacher_email, assignment_type, can_co_teach, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'stream_teacher', 1, ?, ?)`
        ).run(
          `vlta-${crypto.randomBytes(5).toString('hex')}`,
          schoolId,
          lessonId,
          createdClassroomIds[0]?.id || null,
          leadTeacherId,
          leadTeacherName,
          leadTeacherRow?.email || null,
          now,
          now
        );
      }

      for (const ctId of coTeacherIds) {
        const ctUser = db
          .prepare(`SELECT id, name, email FROM users WHERE id = ? AND school_id = ?`)
          .get(ctId, schoolId) as { id: string; name: string; email: string } | undefined;
        if (!ctUser) continue;
        db.prepare(
          `INSERT OR IGNORE INTO virtual_lesson_teacher_assignments
             (id, school_id, lesson_id, classroom_id, teacher_id, teacher_name, teacher_email, assignment_type, can_co_teach, created_at, updated_at)
           VALUES (?, ?, ?, NULL, ?, ?, ?, 'co_teacher', 1, ?, ?)`
        ).run(
          `vlta-${crypto.randomBytes(5).toString('hex')}`,
          schoolId,
          lessonId,
          ctUser.id,
          ctUser.name,
          ctUser.email,
          now,
          now
        );
      }

      syncLessonNotifications(db, lessonId, isInstantStart ? 'live' : 'scheduled');
      writeVirtualAudit(db, {
        schoolId,
        lessonId,
        session,
        action: isInstantStart ? 'instant_start_lesson' : 'schedule_lesson',
        details: { schedulingMode, classroomMode, targetStreamIds, roomsCreated: createdClassroomIds.length },
      });

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    // If instant start, proactively create LiveKit rooms (non-blocking if LiveKit credentials not yet in env)
    if (isInstantStart) {
      for (const room of createdClassroomIds) {
        await ensureLiveKitRoom({
          roomName: room.roomName,
          maxParticipants: room.maxCapacity,
          metadata: { schoolId, lessonId, classroomId: room.id, title: room.title },
        });
      }
    }

    notifyMySqlTablesChanged(VIRTUAL_CLASSROOM_TABLES);
    broadcastVirtualLessonChange(schoolId, lessonId, session.userId);

    const createdRow = db.prepare(`SELECT * FROM virtual_lessons WHERE id = ?`).get(lessonId);
    res.status(201).json({
      lesson: hydrateLessonBundle(db, createdRow),
      warnings,
    });
  }

  app.post('/api/virtual-lessons/schedule', requireAuth, async (req: Request, res: Response) => {
    try {
      await handleCreateLesson(req, res, false);
    } catch (err: any) {
      console.error('[virtual-lessons] schedule error:', err);
      res.status(500).json({ error: err?.message || 'Failed to schedule virtual lesson' });
    }
  });

  app.post('/api/virtual-lessons/instant-start', requireAuth, async (req: Request, res: Response) => {
    try {
      await handleCreateLesson(req, res, true);
    } catch (err: any) {
      console.error('[virtual-lessons] instant-start error:', err);
      res.status(500).json({ error: err?.message || 'Failed to start instant virtual lesson' });
    }
  });

  // -------------------------------------------------------------------------
  // 6. Get Lesson Details, Edit/Postpone, Cancel, Start, Create Rooms, End
  // -------------------------------------------------------------------------
  app.get('/api/virtual-lessons/:id', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const lesson = db
      .prepare(`SELECT * FROM virtual_lessons WHERE id = ? AND school_id = ?`)
      .get(req.params.id, schoolId) as any;
    if (!lesson) return res.status(404).json({ error: 'Virtual lesson not found.' });

    if (session.role === 'student') {
      const placement = getStudentStreamPlacement(db, schoolId, session.userId);
      const allowed = placement
        ? db
            .prepare(`SELECT id FROM virtual_lesson_streams WHERE lesson_id = ? AND stream_id = ?`)
            .get(lesson.id, placement.streamId)
        : null;
      if (!allowed) return res.status(403).json({ error: 'This virtual lesson is not assigned to your stream.' });
    } else if (!isSchoolAdmin(session)) {
      const priv = resolveUserTeacherPrivilegesForLesson(db, session, schoolId, lesson);
      if (!priv.canView) {
        return res.status(403).json({ error: 'You do not have access to this grade virtual lesson.' });
      }
    }

    res.json({ lesson: hydrateLessonBundle(db, lesson) });
  });

  app.put('/api/virtual-lessons/:id', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const lesson = db
      .prepare(`SELECT * FROM virtual_lessons WHERE id = ? AND school_id = ?`)
      .get(req.params.id, schoolId) as any;
    if (!lesson) return res.status(404).json({ error: 'Virtual lesson not found.' });

    const priv = resolveUserTeacherPrivilegesForLesson(db, session, schoolId, lesson);
    if (!isSchoolAdmin(session) && !priv.isAssignedCoordinator) {
      return res.status(403).json({ error: 'Only the assigned Grade Senior Teacher or School Admin can edit/postpone this lesson.' });
    }
    if (lesson.status === 'completed' || lesson.status === 'cancelled') {
      return res.status(409).json({ error: `Cannot modify a ${lesson.status} lesson.` });
    }

    const body = req.body || {};
    const scheduledDate = String(body.scheduledDate || lesson.scheduled_date).trim();
    const startTime = String(body.startTime || lesson.start_time).trim();
    const durationMinutes = Number(body.durationMinutes ?? lesson.duration_minutes);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 60) {
      return res.status(400).json({ error: 'Lesson duration must be between 1 and 60 minutes.' });
    }

    const isPostponed =
      Boolean(body.postpone) ||
      scheduledDate !== lesson.scheduled_date ||
      startTime !== lesson.start_time;

    const startDate = parseNairobiDateTime(scheduledDate, startTime);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    const endTime = getNairobiDateTimeParts(endDate).timeStr;

    const existingStreams = db
      .prepare(`SELECT stream_id FROM virtual_lesson_streams WHERE lesson_id = ?`)
      .all(lesson.id) as Array<{ stream_id: string }>;
    const rooms = db.prepare(`SELECT * FROM virtual_classrooms WHERE lesson_id = ?`).all(lesson.id) as any[];
    const conflictCheck = validateScheduleAndConflicts(db, {
      schoolId,
      gradeId: lesson.grade_id,
      excludeLessonId: lesson.id,
      scheduledDate,
      startTime,
      durationMinutes,
      streamConfigs: existingStreams.map((s) => ({
        streamId: s.stream_id,
        teacherId: rooms[0]?.assigned_teacher_id || lesson.coordinator_id,
        scheduledDate,
        startTime,
        durationMinutes,
      })),
    });

    if (conflictCheck.blockingErrors.length > 0) {
      return res.status(409).json({ error: conflictCheck.blockingErrors[0], blockingErrors: conflictCheck.blockingErrors });
    }

    const now = nowIso();
    const nextStatus = isPostponed && lesson.status === 'scheduled' ? 'postponed' : body.resumeScheduled ? 'scheduled' : lesson.status;
    const rawPoints = Array.isArray(body.keyLearningPoints)
      ? body.keyLearningPoints.map((p: any) => String(p || '').trim()).filter(Boolean)
      : safeParseJson<string[]>(lesson.key_learning_points_json, []);

    db.prepare(
      `UPDATE virtual_lessons
       SET title = ?,
           topic = ?,
           subtopic = ?,
           learning_objectives = ?,
           key_learning_points_json = ?,
           description = ?,
           scheduled_date = ?,
           start_time = ?,
           end_time = ?,
           scheduled_start_at = ?,
           scheduled_end_at = ?,
           duration_minutes = ?,
           status = ?,
           postponed_reason = ?,
           updated_at = ?
       WHERE id = ?`
    ).run(
      String(body.title || lesson.title).trim(),
      String(body.topic || lesson.topic).trim(),
      body.subtopic !== undefined ? String(body.subtopic || '').trim() : lesson.subtopic,
      String(body.learningObjectives || lesson.learning_objectives).trim(),
      JSON.stringify(rawPoints),
      body.description !== undefined ? String(body.description || '').trim() : lesson.description,
      scheduledDate,
      startTime,
      endTime,
      startDate.toISOString(),
      endDate.toISOString(),
      durationMinutes,
      nextStatus,
      body.postponedReason ? String(body.postponedReason).trim() : lesson.postponed_reason,
      now,
      lesson.id
    );

    db.prepare(
      `UPDATE virtual_classrooms
       SET scheduled_date = ?, start_time = ?, end_time = ?,
           scheduled_start_at = ?, scheduled_end_at = ?, duration_minutes = ?,
           room_status = CASE WHEN room_status IN ('scheduled', 'postponed') THEN ? ELSE room_status END,
           updated_at = ?
       WHERE lesson_id = ?`
    ).run(
      scheduledDate,
      startTime,
      endTime,
      startDate.toISOString(),
      endDate.toISOString(),
      durationMinutes,
      nextStatus,
      now,
      lesson.id
    );

    syncLessonNotifications(db, lesson.id, isPostponed ? 'postponed' : 'scheduled');
    writeVirtualAudit(db, {
      schoolId,
      lessonId: lesson.id,
      session,
      action: isPostponed ? 'postpone_lesson' : 'update_lesson',
      details: { scheduledDate, startTime, durationMinutes, postponedReason: body.postponedReason },
    });
    notifyMySqlTablesChanged(VIRTUAL_CLASSROOM_TABLES);
    broadcastVirtualLessonChange(schoolId, lesson.id, session.userId);

    const updated = db.prepare(`SELECT * FROM virtual_lessons WHERE id = ?`).get(lesson.id);
    res.json({ lesson: hydrateLessonBundle(db, updated), warnings: conflictCheck.warnings });
  });

  app.post('/api/virtual-lessons/:id/cancel', requireAuth, async (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const lesson = db
      .prepare(`SELECT * FROM virtual_lessons WHERE id = ? AND school_id = ?`)
      .get(req.params.id, schoolId) as any;
    if (!lesson) return res.status(404).json({ error: 'Virtual lesson not found.' });

    const priv = resolveUserTeacherPrivilegesForLesson(db, session, schoolId, lesson);
    if (!isSchoolAdmin(session) && !priv.isAssignedCoordinator) {
      return res.status(403).json({ error: 'Only the assigned Grade Senior Teacher or School Admin can cancel this lesson.' });
    }

    const reason = String(req.body?.reason || 'Cancelled by coordinator').trim();
    const now = nowIso();
    const rooms = db.prepare(`SELECT * FROM virtual_classrooms WHERE lesson_id = ?`).all(lesson.id) as any[];
    for (const r of rooms) {
      await broadcastLiveKitRoomData(r.livekit_room_name, {
        type: 'CLASSROOM_CANCELLED',
        lessonId: lesson.id,
        reason,
      });
      await deleteLiveKitRoom(r.livekit_room_name);
    }

    db.prepare(
      `UPDATE virtual_lessons SET status = 'cancelled', cancelled_reason = ?, actual_ended_at = COALESCE(actual_ended_at, ?), updated_at = ? WHERE id = ?`
    ).run(reason, now, now, lesson.id);
    db.prepare(
      `UPDATE virtual_classrooms SET room_status = 'cancelled', locked = 1, actual_end_time = COALESCE(actual_end_time, ?), updated_at = ? WHERE lesson_id = ?`
    ).run(now, now, lesson.id);

    syncLessonNotifications(db, lesson.id, 'cancelled');
    writeVirtualAudit(db, {
      schoolId,
      lessonId: lesson.id,
      session,
      action: 'cancel_lesson',
      details: { reason },
    });
    notifyMySqlTablesChanged(VIRTUAL_CLASSROOM_TABLES);
    broadcastVirtualLessonChange(schoolId, lesson.id, session.userId);

    const updated = db.prepare(`SELECT * FROM virtual_lessons WHERE id = ?`).get(lesson.id);
    res.json({ lesson: hydrateLessonBundle(db, updated) });
  });

  app.post('/api/virtual-lessons/:id/create-rooms', requireAuth, async (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const lesson = db
      .prepare(`SELECT * FROM virtual_lessons WHERE id = ? AND school_id = ?`)
      .get(req.params.id, schoolId) as any;
    if (!lesson) return res.status(404).json({ error: 'Virtual lesson not found.' });

    const priv = resolveUserTeacherPrivilegesForLesson(db, session, schoolId, lesson);
    if (!priv.canModerate) {
      return res.status(403).json({ error: 'Not authorized to provision LiveKit rooms for this lesson.' });
    }

    const rooms = db.prepare(`SELECT * FROM virtual_classrooms WHERE lesson_id = ?`).all(lesson.id) as any[];
    const results: Array<{ classroomId: string; roomName: string; ok: boolean; skipped?: boolean; error?: string }> = [];
    for (const r of rooms) {
      const outcome = await ensureLiveKitRoom({
        roomName: r.livekit_room_name,
        maxParticipants: Number(r.capacity || 30),
        metadata: { schoolId, lessonId: lesson.id, classroomId: r.id, title: r.title },
      });
      results.push({ classroomId: r.id, roomName: r.livekit_room_name, ...outcome });
    }
    res.json({ rooms: results });
  });

  app.post('/api/virtual-lessons/:id/start', requireAuth, async (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const lesson = db
      .prepare(`SELECT * FROM virtual_lessons WHERE id = ? AND school_id = ?`)
      .get(req.params.id, schoolId) as any;
    if (!lesson) return res.status(404).json({ error: 'Virtual lesson not found.' });

    const targetClassroomId = req.body?.classroomId ? String(req.body.classroomId) : null;
    const priv = resolveUserTeacherPrivilegesForLesson(db, session, schoolId, lesson, targetClassroomId);
    if (!priv.canModerate) {
      return res.status(403).json({ error: 'Only the Grade Senior Teacher, assigned room teacher, co-teacher, or Admin can start this classroom.' });
    }
    if (lesson.status === 'cancelled' || lesson.status === 'completed') {
      return res.status(409).json({ error: `Cannot start a ${lesson.status} lesson.` });
    }

    const now = nowIso();
    const nowDate = new Date();
    const endDate = new Date(nowDate.getTime() + Math.min(60, Number(lesson.duration_minutes || 40)) * 60 * 1000);
    const nairobiNow = getNairobiDateTimeParts(nowDate);
    const nairobiEnd = getNairobiDateTimeParts(endDate);

    const roomsToStart = targetClassroomId
      ? (db.prepare(`SELECT * FROM virtual_classrooms WHERE id = ? AND lesson_id = ?`).all(targetClassroomId, lesson.id) as any[])
      : (db.prepare(`SELECT * FROM virtual_classrooms WHERE lesson_id = ?`).all(lesson.id) as any[]);

    for (const r of roomsToStart) {
      await ensureLiveKitRoom({
        roomName: r.livekit_room_name,
        maxParticipants: Number(r.capacity || 30),
        metadata: { schoolId, lessonId: lesson.id, classroomId: r.id, title: r.title },
      });
      db.prepare(
        `UPDATE virtual_classrooms
         SET room_status = 'live',
             actual_start_time = COALESCE(actual_start_time, ?),
             scheduled_start_at = CASE WHEN actual_start_time IS NULL THEN ? ELSE scheduled_start_at END,
             scheduled_end_at = CASE WHEN actual_start_time IS NULL THEN ? ELSE scheduled_end_at END,
             locked = 0,
             updated_at = ?
         WHERE id = ?`
      ).run(now, nowDate.toISOString(), endDate.toISOString(), now, r.id);
    }

    db.prepare(
      `UPDATE virtual_lessons
       SET status = 'live',
           actual_started_at = COALESCE(actual_started_at, ?),
           scheduled_date = CASE WHEN actual_started_at IS NULL THEN ? ELSE scheduled_date END,
           start_time = CASE WHEN actual_started_at IS NULL THEN ? ELSE start_time END,
           end_time = CASE WHEN actual_started_at IS NULL THEN ? ELSE end_time END,
           scheduled_start_at = CASE WHEN actual_started_at IS NULL THEN ? ELSE scheduled_start_at END,
           scheduled_end_at = CASE WHEN actual_started_at IS NULL THEN ? ELSE scheduled_end_at END,
           updated_at = ?
       WHERE id = ?`
    ).run(
      now,
      nairobiNow.dateStr,
      nairobiNow.timeStr,
      nairobiEnd.timeStr,
      nowDate.toISOString(),
      endDate.toISOString(),
      now,
      lesson.id
    );

    syncLessonNotifications(db, lesson.id, 'live');
    writeVirtualAudit(db, {
      schoolId,
      lessonId: lesson.id,
      classroomId: targetClassroomId,
      session,
      action: 'start_classroom',
    });
    notifyMySqlTablesChanged(VIRTUAL_CLASSROOM_TABLES);
    broadcastVirtualLessonChange(schoolId, lesson.id, session.userId);

    const updated = db.prepare(`SELECT * FROM virtual_lessons WHERE id = ?`).get(lesson.id);
    res.json({ lesson: hydrateLessonBundle(db, updated) });
  });

  app.post('/api/virtual-lessons/:id/end', requireAuth, async (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const lesson = db
      .prepare(`SELECT * FROM virtual_lessons WHERE id = ? AND school_id = ?`)
      .get(req.params.id, schoolId) as any;
    if (!lesson) return res.status(404).json({ error: 'Virtual lesson not found.' });

    const targetClassroomId = req.body?.classroomId ? String(req.body.classroomId) : null;
    const priv = resolveUserTeacherPrivilegesForLesson(db, session, schoolId, lesson, targetClassroomId);
    if (!priv.canModerate) {
      return res.status(403).json({ error: 'Only authorized moderators can end this classroom.' });
    }

    await closeVirtualLessonOrRoom({
      db,
      lessonId: lesson.id,
      classroomId: targetClassroomId,
      closedBy: String(session.user?.name || session.userId),
      reason: String(req.body?.reason || 'Ended by teacher'),
    });

    writeVirtualAudit(db, {
      schoolId,
      lessonId: lesson.id,
      classroomId: targetClassroomId,
      session,
      action: 'end_classroom',
      details: { reason: req.body?.reason },
    });

    const updated = db.prepare(`SELECT * FROM virtual_lessons WHERE id = ?`).get(lesson.id);
    res.json({ lesson: hydrateLessonBundle(db, updated) });
  });

  // -------------------------------------------------------------------------
  // 7. Join Classroom & Server-Side LiveKit Token Minting
  // -------------------------------------------------------------------------
  async function handleJoinOrMintToken(req: Request, res: Response, forcedLessonId?: string) {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
    if (!schoolId) return;
    const lessonId = forcedLessonId || String(req.body?.lessonId || '').trim();
    const requestedClassroomId = req.body?.classroomId ? String(req.body.classroomId).trim() : null;

    if (!lessonId) {
      return res.status(400).json({ error: 'lessonId is required.' });
    }

    const lesson = db
      .prepare(`SELECT * FROM virtual_lessons WHERE id = ? AND school_id = ?`)
      .get(lessonId, schoolId) as any;
    if (!lesson) {
      return res.status(404).json({ error: 'Virtual lesson not found.' });
    }

    if (lesson.status === 'cancelled' || lesson.status === 'completed') {
      return res.status(409).json({
        error: `This virtual lesson is ${lesson.status} and can no longer be joined.`,
        status: lesson.status,
      });
    }

    // Resolve target classroom
    let classroom: any = null;
    if (requestedClassroomId) {
      classroom = db
        .prepare(`SELECT * FROM virtual_classrooms WHERE id = ? AND lesson_id = ? AND school_id = ?`)
        .get(requestedClassroomId, lesson.id, schoolId);
      if (!classroom) {
        return res.status(404).json({ error: 'Requested virtual classroom room does not belong to this lesson.' });
      }
    } else if (session.role === 'student') {
      const placement = getStudentStreamPlacement(db, schoolId, session.userId);
      if (placement) {
        classroom = db
          .prepare(
            `SELECT vc.* FROM virtual_classrooms vc
             JOIN virtual_lesson_streams vls ON vls.classroom_id = vc.id
             WHERE vc.lesson_id = ? AND vls.stream_id = ?
             LIMIT 1`
          )
          .get(lesson.id, placement.streamId);
      }
    } else {
      classroom = db
        .prepare(
          `SELECT * FROM virtual_classrooms
           WHERE lesson_id = ?
           ORDER BY CASE WHEN assigned_teacher_id = ? THEN 0 ELSE 1 END, created_at ASC
           LIMIT 1`
        )
        .get(lesson.id, session.userId);
    }

    if (!classroom) {
      return res.status(403).json({
        error: 'No virtual classroom for this lesson is assigned to your stream or account.',
      });
    }

    const isStudent = session.role === 'student';
    let isModerator = false;
    let studentStreamId: string | null = null;

    if (isStudent) {
      const placement = getStudentStreamPlacement(db, schoolId, session.userId);
      if (!placement) {
        return res.status(403).json({ error: 'Your student profile is not assigned to an active stream.' });
      }
      studentStreamId = placement.streamId;
      const streamMatch = db
        .prepare(
          `SELECT id FROM virtual_lesson_streams
           WHERE lesson_id = ? AND classroom_id = ? AND stream_id = ? LIMIT 1`
        )
        .get(lesson.id, classroom.id, placement.streamId);

      if (!streamMatch) {
        return res.status(403).json({
          error: 'Access denied: this virtual classroom belongs to a different stream.',
        });
      }

      if (classroom.room_status !== 'live') {
        return res.status(409).json({
          error:
            classroom.room_status === 'postponed'
              ? 'This virtual lesson was postponed. Check the updated schedule time.'
              : 'Waiting for your teacher to start the live virtual classroom.',
          roomStatus: classroom.room_status,
        });
      }

      // Subscription quota / approval check
      const subCheck = evaluateStudentSubscription(db, schoolId, session.userId, lesson.id);
      if (!subCheck.allowed) {
        return res.status(402).json({
          error: subCheck.reason,
          code: subCheck.code,
          subscription: subCheck,
          redirectTab: 'subscription_payment',
        });
      }
    } else {
      // Staff / Teacher / Senior Teacher / Admin check
      const priv = resolveUserTeacherPrivilegesForLesson(db, session, schoolId, lesson, classroom.id);
      if (!priv.canModerate && !priv.canView) {
        return res.status(403).json({
          error: 'Access denied: you are not assigned to this grade or virtual classroom.',
        });
      }
      isModerator = priv.canModerate;
      if (!isModerator && classroom.room_status !== 'live') {
        return res.status(409).json({
          error: 'This virtual classroom has not started yet.',
          roomStatus: classroom.room_status,
        });
      }
    }

    // Lock check (moderators bypass lock)
    if (classroom.locked && !isModerator) {
      return res.status(423).json({
        error: 'Classroom is currently locked by the teacher. Contact your teacher to unlock entry.',
        code: 'ROOM_LOCKED',
      });
    }

    // Auto-transition scheduled room to live when an authorized moderator enters
    const now = nowIso();
    if (classroom.room_status === 'scheduled' && isModerator) {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + Math.min(60, Number(classroom.duration_minutes || 40)) * 60 * 1000);
      db.prepare(
        `UPDATE virtual_classrooms
         SET room_status = 'live',
             actual_start_time = COALESCE(actual_start_time, ?),
             scheduled_start_at = ?,
             scheduled_end_at = ?,
             updated_at = ?
         WHERE id = ?`
      ).run(now, startDate.toISOString(), endDate.toISOString(), now, classroom.id);

      db.prepare(
        `UPDATE virtual_lessons
         SET status = 'live',
             actual_started_at = COALESCE(actual_started_at, ?),
             scheduled_start_at = ?,
             scheduled_end_at = ?,
             updated_at = ?
         WHERE id = ? AND status IN ('scheduled', 'postponed')`
      ).run(now, startDate.toISOString(), endDate.toISOString(), now, lesson.id);

      classroom = db.prepare(`SELECT * FROM virtual_classrooms WHERE id = ?`).get(classroom.id);
      syncLessonNotifications(db, lesson.id, 'live');
      broadcastVirtualLessonChange(schoolId, lesson.id, session.userId);
    }

    // Check participant record & permissions
    let participant = db
      .prepare(`SELECT * FROM virtual_lesson_participants WHERE classroom_id = ? AND user_id = ? LIMIT 1`)
      .get(classroom.id, session.userId) as any;

    if (participant && (participant.admission_status === 'removed' || participant.admission_status === 'rejected') && !isModerator) {
      return res.status(403).json({
        error: 'You were removed or denied entry from this virtual classroom session.',
        code: 'ENTRY_DENIED',
      });
    }

    // Enforce classroom capacity limit (default 30 including teacher)
    const connectedCount = (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM virtual_lesson_participants
           WHERE classroom_id = ? AND is_connected = 1 AND user_id != ?`
        )
        .get(classroom.id, session.userId) as { c: number }
    ).c;

    if (connectedCount >= Number(classroom.capacity || 30)) {
      return res.status(429).json({
        error: `Classroom capacity reached (${connectedCount}/${classroom.capacity}). Please wait for an open seat or ask your administrator.`,
        code: 'CAPACITY_FULL',
      });
    }

    const identity = buildParticipantIdentity({ schoolId, userId: session.userId });

    if (!participant) {
      const initialAdmission =
        !isStudent || isModerator || classroom.waiting_room_enabled === 0 ? 'admitted' : 'waiting';
      const partId = `vlp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      db.prepare(
        `INSERT INTO virtual_lesson_participants
           (id, school_id, lesson_id, classroom_id, user_id, user_name, user_role, stream_id, livekit_identity,
            admission_status, is_co_host, mic_allowed, cam_allowed, screenshare_allowed, chat_allowed,
            hand_raised, attendance_status, is_connected, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'absent', 0, ?, ?)`
      ).run(
        partId,
        schoolId,
        lesson.id,
        classroom.id,
        session.userId,
        String(session.user?.name || 'Participant'),
        session.role,
        studentStreamId,
        identity,
        initialAdmission,
        isModerator ? 1 : 0,
        isModerator || classroom.student_mic_enabled ? 1 : 0,
        isModerator || classroom.student_camera_enabled ? 1 : 0,
        isModerator || classroom.student_screenshare_enabled ? 1 : 0,
        isModerator || classroom.student_chat_enabled ? 1 : 0,
        now,
        now
      );
      participant = db.prepare(`SELECT * FROM virtual_lesson_participants WHERE id = ?`).get(partId);
      if (initialAdmission === 'waiting') {
        notifyMySqlTablesChanged(['virtual_lesson_participants']);
        broadcastVirtualLessonChange(schoolId, lesson.id, session.userId);
      }
    }

    if (participant.admission_status === 'waiting' && !isModerator) {
      return res.json({
        joined: false,
        waiting: true,
        admissionStatus: 'waiting',
        participantId: participant.id,
        classroomId: classroom.id,
        lessonId: lesson.id,
        message: 'You are in the classroom waiting room. Your teacher will admit you shortly.',
      });
    }

    // Consume weekly quota once on first admitted token mint for this lesson
    if (isStudent && participant.admission_status === 'admitted' && !participant.join_time) {
      recordStudentSubscriptionConsumeOnce(db, schoolId, session.userId);
    }

    // Enforce hard 60-min ceiling on token TTL
    const startMs = Date.parse(classroom.actual_start_time || classroom.scheduled_start_at) || Date.now();
    const maxEndMs = Math.min(
      startMs + Math.min(60, Number(classroom.duration_minutes || 60)) * 60 * 1000,
      startMs + 60 * 60 * 1000
    );
    const remainingSeconds = Math.max(60, Math.floor((maxEndMs - Date.now()) / 1000));

    const effectiveModerator = isModerator || participant.is_co_host === 1;
    const micAllowed = effectiveModerator || (participant.mic_allowed === 1 && classroom.muted_all === 0);
    const camAllowed = effectiveModerator || participant.cam_allowed === 1;
    const screenShareAllowed = effectiveModerator || participant.screenshare_allowed === 1;
    const chatAllowed = effectiveModerator || participant.chat_allowed === 1;

    await ensureLiveKitRoom({
      roomName: classroom.livekit_room_name,
      maxParticipants: Number(classroom.capacity || 30),
      metadata: { schoolId, lessonId: lesson.id, classroomId: classroom.id, title: classroom.title },
    });

    const tokenRes = await mintLiveKitJoinToken({
      roomName: classroom.livekit_room_name,
      identity,
      name: String(session.user?.name || 'Participant'),
      role: session.role,
      isModerator: effectiveModerator,
      micAllowed,
      camAllowed,
      screenShareAllowed,
      chatAllowed,
      ttlSeconds: remainingSeconds,
      metadata: {
        schoolId,
        lessonId: lesson.id,
        classroomId: classroom.id,
        userId: session.userId,
        role: session.role,
        isModerator: effectiveModerator,
        streamId: studentStreamId,
      },
    });

    writeVirtualAudit(db, {
      schoolId,
      lessonId: lesson.id,
      classroomId: classroom.id,
      session,
      action: 'mint_join_token',
      details: { identity, isModerator: effectiveModerator },
    });

    const hydratedLesson = hydrateLessonBundle(db, lesson);
    res.json({
      joined: true,
      waiting: false,
      admissionStatus: 'admitted',
      configured: tokenRes.configured,
      missingKeys: tokenRes.missingKeys,
      token: tokenRes.token,
      livekitUrl: tokenRes.livekitUrl,
      iceServers: tokenRes.iceServers,
      roomName: classroom.livekit_room_name,
      identity,
      isModerator: effectiveModerator,
      remainingSeconds,
      endsAt: new Date(maxEndMs).toISOString(),
      permissions: {
        micAllowed,
        camAllowed,
        screenShareAllowed,
        chatAllowed,
      },
      classroom: hydratedLesson.classrooms.find((c: any) => c.id === classroom.id),
      lesson: hydratedLesson,
    });
  }

  app.post('/api/virtual-lessons/:id/join', requireAuth, async (req: Request, res: Response) => {
    try {
      await handleJoinOrMintToken(req, res, req.params.id);
    } catch (err: any) {
      console.error('[virtual-lessons] join error:', err);
      res.status(500).json({ error: err?.message || 'Failed to join virtual classroom' });
    }
  });

  app.post('/api/livekit/token', requireAuth, async (req: Request, res: Response) => {
    try {
      await handleJoinOrMintToken(req, res, req.body?.lessonId);
    } catch (err: any) {
      console.error('[livekit] token error:', err);
      res.status(500).json({ error: err?.message || 'Failed to generate LiveKit token' });
    }
  });

  // Explicit client media session ack (called ONLY after LiveKit RoomEvent.Connected succeeds in browser)
  app.post('/api/virtual-lessons/:id/media-session-ack', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const classroomId = String(req.body?.classroomId || '').trim();
    const state = req.body?.state === 'disconnected' ? 'disconnected' : 'connected';
    const livekitConnected = Boolean(req.body?.livekitConnected);

    if (!classroomId) return res.status(400).json({ error: 'classroomId is required.' });
    const participant = db
      .prepare(
        `SELECT * FROM virtual_lesson_participants
         WHERE lesson_id = ? AND classroom_id = ? AND user_id = ? AND school_id = ? LIMIT 1`
      )
      .get(req.params.id, classroomId, session.userId, schoolId) as any;
    if (!participant || participant.admission_status !== 'admitted') {
      return res.status(403).json({ error: 'Participant not admitted into this classroom.' });
    }

    const now = nowIso();
    if (state === 'connected' && livekitConnected) {
      const nextReconnect = participant.join_time && participant.is_connected === 0 ? Number(participant.reconnect_count || 0) + 1 : Number(participant.reconnect_count || 0);
      // Increment elapsed time if heartbeating
      let totalSec = Number(participant.total_duration_seconds || 0);
      if (participant.is_connected === 1 && participant.last_heartbeat_at) {
        const delta = Math.max(0, Math.min(90, Math.round((Date.now() - Date.parse(participant.last_heartbeat_at)) / 1000)));
        totalSec += delta;
      }
      const mins = Number((totalSec / 60).toFixed(1));
      const attStatus = mins >= 5 ? 'present' : 'partial';

      db.prepare(
        `UPDATE virtual_lesson_participants
         SET is_connected = 1,
             join_time = COALESCE(join_time, ?),
             last_heartbeat_at = ?,
             total_duration_seconds = ?,
             reconnect_count = ?,
             attendance_status = ?,
             updated_at = ?
         WHERE id = ?`
      ).run(now, now, totalSec, nextReconnect, attStatus, now, participant.id);

      if (participant.user_role === 'student') {
        const existingAtt = db
          .prepare(`SELECT id FROM virtual_lesson_attendance WHERE lesson_id = ? AND student_id = ? LIMIT 1`)
          .get(req.params.id, session.userId) as { id: string } | undefined;
        if (existingAtt) {
          db.prepare(
            `UPDATE virtual_lesson_attendance
             SET total_attendance_minutes = ?, reconnect_count = ?, attendance_status = ?,
                 verified_via = CASE WHEN verified_via = 'livekit_webhook' THEN 'livekit_webhook' ELSE 'livekit_room_ack' END,
                 updated_at = ?
             WHERE id = ?`
          ).run(mins, nextReconnect, attStatus, now, existingAtt.id);
        } else {
          db.prepare(
            `INSERT INTO virtual_lesson_attendance
               (id, school_id, lesson_id, classroom_id, student_id, student_name, stream_id,
                first_joined_at, total_attendance_minutes, reconnect_count, attendance_status, verified_via, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'livekit_room_ack', ?, ?)`
          ).run(
            `vla-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            schoolId,
            req.params.id,
            classroomId,
            session.userId,
            participant.user_name,
            participant.stream_id || null,
            now,
            mins,
            nextReconnect,
            attStatus,
            now,
            now
          );
        }
      }
    } else if (state === 'disconnected') {
      let totalSec = Number(participant.total_duration_seconds || 0);
      if (participant.is_connected === 1 && participant.last_heartbeat_at) {
        const delta = Math.max(0, Math.min(180, Math.round((Date.now() - Date.parse(participant.last_heartbeat_at)) / 1000)));
        totalSec += delta;
      }
      const mins = Number((totalSec / 60).toFixed(1));
      const attStatus = participant.join_time ? (mins >= 5 ? 'present' : 'partial') : 'absent';

      db.prepare(
        `UPDATE virtual_lesson_participants
         SET is_connected = 0, leave_time = ?, total_duration_seconds = ?, attendance_status = ?, updated_at = ?
         WHERE id = ?`
      ).run(now, totalSec, attStatus, now, participant.id);

      if (participant.user_role === 'student' && participant.join_time) {
        db.prepare(
          `UPDATE virtual_lesson_attendance
           SET last_left_at = ?, total_attendance_minutes = ?, attendance_status = ?, updated_at = ?
           WHERE lesson_id = ? AND student_id = ?`
        ).run(now, mins, attStatus, now, req.params.id, session.userId);
      }
    }

    notifyMySqlTablesChanged(['virtual_lesson_participants', 'virtual_lesson_attendance']);
    res.json({ ok: true });
  });

  // -------------------------------------------------------------------------
  // 8. In-Room Teacher Controls (Lock, Unlock, Admit, Remove, Mute All, Permissions, Raise Hand, Chat)
  // -------------------------------------------------------------------------
  function requireRoomModerator(req: Request, res: Response): {
    db: DatabaseSync;
    session: AuthSession;
    schoolId: string;
    lesson: any;
    classroom: any;
  } | null {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return null;
    const lesson = db
      .prepare(`SELECT * FROM virtual_lessons WHERE id = ? AND school_id = ?`)
      .get(req.params.id, schoolId) as any;
    if (!lesson) {
      res.status(404).json({ error: 'Virtual lesson not found.' });
      return null;
    }
    const classroomId = req.body?.classroomId ? String(req.body.classroomId) : null;
    const classroom = classroomId
      ? (db.prepare(`SELECT * FROM virtual_classrooms WHERE id = ? AND lesson_id = ?`).get(classroomId, lesson.id) as any)
      : (db.prepare(`SELECT * FROM virtual_classrooms WHERE lesson_id = ? ORDER BY created_at ASC LIMIT 1`).get(lesson.id) as any);
    if (!classroom) {
      res.status(404).json({ error: 'Classroom room not found.' });
      return null;
    }
    const priv = resolveUserTeacherPrivilegesForLesson(db, session, schoolId, lesson, classroom.id);
    if (!priv.canModerate) {
      res.status(403).json({ error: 'Only authorized hosts, co-teachers, Senior Teachers, or Admins can control this classroom.' });
      return null;
    }
    return { db, session, schoolId, lesson, classroom };
  }

  app.post('/api/virtual-lessons/:id/lock', requireAuth, async (req: Request, res: Response) => {
    const ctx = requireRoomModerator(req, res);
    if (!ctx) return;
    ctx.db.prepare(`UPDATE virtual_classrooms SET locked = 1, updated_at = ? WHERE id = ?`).run(nowIso(), ctx.classroom.id);
    await broadcastLiveKitRoomData(ctx.classroom.livekit_room_name, { type: 'ROOM_LOCKED', locked: true, classroomId: ctx.classroom.id });
    writeVirtualAudit(ctx.db, { schoolId: ctx.schoolId, lessonId: ctx.lesson.id, classroomId: ctx.classroom.id, session: ctx.session, action: 'lock_room' });
    notifyMySqlTablesChanged(['virtual_classrooms']);
    broadcastVirtualLessonChange(ctx.schoolId, ctx.lesson.id, ctx.session.userId);
    res.json({ ok: true, locked: true });
  });

  app.post('/api/virtual-lessons/:id/unlock', requireAuth, async (req: Request, res: Response) => {
    const ctx = requireRoomModerator(req, res);
    if (!ctx) return;
    ctx.db.prepare(`UPDATE virtual_classrooms SET locked = 0, updated_at = ? WHERE id = ?`).run(nowIso(), ctx.classroom.id);
    await broadcastLiveKitRoomData(ctx.classroom.livekit_room_name, { type: 'ROOM_LOCKED', locked: false, classroomId: ctx.classroom.id });
    writeVirtualAudit(ctx.db, { schoolId: ctx.schoolId, lessonId: ctx.lesson.id, classroomId: ctx.classroom.id, session: ctx.session, action: 'unlock_room' });
    notifyMySqlTablesChanged(['virtual_classrooms']);
    broadcastVirtualLessonChange(ctx.schoolId, ctx.lesson.id, ctx.session.userId);
    res.json({ ok: true, locked: false });
  });

  app.post('/api/virtual-lessons/:id/admit', requireAuth, async (req: Request, res: Response) => {
    const ctx = requireRoomModerator(req, res);
    if (!ctx) return;
    const { db, classroom, lesson, schoolId, session } = ctx;
    const action = req.body?.decision === 'reject' ? 'rejected' : 'admitted';
    const participantId = req.body?.participantId ? String(req.body.participantId) : null;
    const admitAll = Boolean(req.body?.admitAll);
    const now = nowIso();

    if (admitAll && action === 'admitted') {
      // Admit waiting room students up to capacity
      const currentConnected = (
        db.prepare(`SELECT COUNT(*) as c FROM virtual_lesson_participants WHERE classroom_id = ? AND is_connected = 1`).get(classroom.id) as { c: number }
      ).c;
      const slotsAvailable = Math.max(0, Number(classroom.capacity || 30) - currentConnected);
      const waitingList = db
        .prepare(
          `SELECT id FROM virtual_lesson_participants
           WHERE classroom_id = ? AND admission_status = 'waiting'
           ORDER BY created_at ASC LIMIT ?`
        )
        .all(classroom.id, slotsAvailable) as Array<{ id: string }>;

      for (const w of waitingList) {
        db.prepare(`UPDATE virtual_lesson_participants SET admission_status = 'admitted', updated_at = ? WHERE id = ?`).run(now, w.id);
      }
      writeVirtualAudit(db, {
        schoolId,
        lessonId: lesson.id,
        classroomId: classroom.id,
        session,
        action: 'admit_all_waiting',
        details: { admittedCount: waitingList.length },
      });
    } else if (participantId) {
      db.prepare(`UPDATE virtual_lesson_participants SET admission_status = ?, updated_at = ? WHERE id = ? AND classroom_id = ?`).run(
        action,
        now,
        participantId,
        classroom.id
      );
      writeVirtualAudit(db, {
        schoolId,
        lessonId: lesson.id,
        classroomId: classroom.id,
        session,
        action: action === 'admitted' ? 'admit_participant' : 'reject_participant',
        details: { participantId },
      });
    } else {
      return res.status(400).json({ error: 'participantId or admitAll=true is required.' });
    }

    notifyMySqlTablesChanged(['virtual_lesson_participants']);
    broadcastVirtualLessonChange(schoolId, lesson.id, session.userId);
    res.json({ ok: true });
  });

  app.post('/api/virtual-lessons/:id/remove-participant', requireAuth, async (req: Request, res: Response) => {
    const ctx = requireRoomModerator(req, res);
    if (!ctx) return;
    const participantId = String(req.body?.participantId || '').trim();
    const userId = String(req.body?.userId || '').trim();
    const p = participantId
      ? (ctx.db.prepare(`SELECT * FROM virtual_lesson_participants WHERE id = ? AND classroom_id = ?`).get(participantId, ctx.classroom.id) as any)
      : (ctx.db.prepare(`SELECT * FROM virtual_lesson_participants WHERE user_id = ? AND classroom_id = ?`).get(userId, ctx.classroom.id) as any);
    if (!p) return res.status(404).json({ error: 'Participant not found in classroom.' });

    const now = nowIso();
    ctx.db
      .prepare(
        `UPDATE virtual_lesson_participants
         SET admission_status = 'removed', is_connected = 0, leave_time = COALESCE(leave_time, ?), updated_at = ?
         WHERE id = ?`
      )
      .run(now, now, p.id);

    await removeLiveKitParticipant(ctx.classroom.livekit_room_name, p.livekit_identity);
    writeVirtualAudit(ctx.db, {
      schoolId: ctx.schoolId,
      lessonId: ctx.lesson.id,
      classroomId: ctx.classroom.id,
      session: ctx.session,
      action: 'remove_participant',
      details: { targetUserId: p.user_id, targetName: p.user_name },
    });
    notifyMySqlTablesChanged(['virtual_lesson_participants']);
    broadcastVirtualLessonChange(ctx.schoolId, ctx.lesson.id, ctx.session.userId);
    res.json({ ok: true });
  });

  app.post('/api/virtual-lessons/:id/mute-all', requireAuth, async (req: Request, res: Response) => {
    const ctx = requireRoomModerator(req, res);
    if (!ctx) return;
    const mute = req.body?.muted !== false;
    const now = nowIso();
    ctx.db.prepare(`UPDATE virtual_classrooms SET muted_all = ?, student_mic_enabled = ?, updated_at = ? WHERE id = ?`).run(
      mute ? 1 : 0,
      mute ? 0 : 1,
      now,
      ctx.classroom.id
    );
    ctx.db
      .prepare(
        `UPDATE virtual_lesson_participants
         SET mic_allowed = ?, updated_at = ?
         WHERE classroom_id = ? AND user_role = 'student' AND is_co_host = 0`
      )
      .run(mute ? 0 : 1, now, ctx.classroom.id);

    const moderators = ctx.db
      .prepare(`SELECT livekit_identity FROM virtual_lesson_participants WHERE classroom_id = ? AND (is_co_host = 1 OR user_role != 'student')`)
      .all(ctx.classroom.id) as Array<{ livekit_identity: string }>;
    const modSet = new Set(moderators.map((m) => m.livekit_identity));

    if (mute) {
      await muteAllStudentsInLiveKitRoom({
        roomName: ctx.classroom.livekit_room_name,
        moderatorIdentities: modSet,
        muteAudio: true,
      });
    }

    const students = ctx.db
      .prepare(`SELECT * FROM virtual_lesson_participants WHERE classroom_id = ? AND user_role = 'student' AND is_co_host = 0`)
      .all(ctx.classroom.id) as any[];
    for (const st of students) {
      await updateLiveKitParticipantPermissions({
        roomName: ctx.classroom.livekit_room_name,
        identity: st.livekit_identity,
        micAllowed: !mute,
        camAllowed: st.cam_allowed === 1,
        screenShareAllowed: st.screenshare_allowed === 1,
        chatAllowed: st.chat_allowed === 1,
      });
    }

    await broadcastLiveKitRoomData(ctx.classroom.livekit_room_name, {
      type: 'PERMISSIONS_UPDATED',
      mutedAll: mute,
      classroomId: ctx.classroom.id,
    });
    writeVirtualAudit(ctx.db, {
      schoolId: ctx.schoolId,
      lessonId: ctx.lesson.id,
      classroomId: ctx.classroom.id,
      session: ctx.session,
      action: mute ? 'mute_all' : 'unmute_all',
    });
    notifyMySqlTablesChanged(['virtual_classrooms', 'virtual_lesson_participants']);
    broadcastVirtualLessonChange(ctx.schoolId, ctx.lesson.id, ctx.session.userId);
    res.json({ ok: true, mutedAll: mute });
  });

  app.post('/api/virtual-lessons/:id/permissions', requireAuth, async (req: Request, res: Response) => {
    const ctx = requireRoomModerator(req, res);
    if (!ctx) return;
    const { db, classroom, lesson, schoolId, session } = ctx;
    const now = nowIso();
    const targetParticipantId = req.body?.participantId ? String(req.body.participantId) : null;

    if (targetParticipantId) {
      const p = db
        .prepare(`SELECT * FROM virtual_lesson_participants WHERE id = ? AND classroom_id = ?`)
        .get(targetParticipantId, classroom.id) as any;
      if (!p) return res.status(404).json({ error: 'Participant not found.' });

      const micAllowed = req.body.micAllowed !== undefined ? Boolean(req.body.micAllowed) : p.mic_allowed === 1;
      const camAllowed = req.body.camAllowed !== undefined ? Boolean(req.body.camAllowed) : p.cam_allowed === 1;
      const screenShareAllowed = req.body.screenShareAllowed !== undefined ? Boolean(req.body.screenShareAllowed) : p.screenshare_allowed === 1;
      const chatAllowed = req.body.chatAllowed !== undefined ? Boolean(req.body.chatAllowed) : p.chat_allowed === 1;
      const isCoHost = req.body.isCoHost !== undefined ? Boolean(req.body.isCoHost) : p.is_co_host === 1;

      db.prepare(
        `UPDATE virtual_lesson_participants
         SET mic_allowed = ?, cam_allowed = ?, screenshare_allowed = ?, chat_allowed = ?, is_co_host = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        micAllowed ? 1 : 0,
        camAllowed ? 1 : 0,
        screenShareAllowed ? 1 : 0,
        chatAllowed ? 1 : 0,
        isCoHost ? 1 : 0,
        now,
        p.id
      );

      if (!micAllowed || !camAllowed) {
        await muteLiveKitParticipantTracks({
          roomName: classroom.livekit_room_name,
          identity: p.livekit_identity,
          muteAudio: !micAllowed,
          muteVideo: !camAllowed,
        });
      }
      await updateLiveKitParticipantPermissions({
        roomName: classroom.livekit_room_name,
        identity: p.livekit_identity,
        micAllowed: isCoHost || micAllowed,
        camAllowed: isCoHost || camAllowed,
        screenShareAllowed: isCoHost || screenShareAllowed,
        chatAllowed: isCoHost || chatAllowed,
      });

      writeVirtualAudit(db, {
        schoolId,
        lessonId: lesson.id,
        classroomId: classroom.id,
        session,
        action: 'update_participant_permissions',
        details: { participantId: p.id, micAllowed, camAllowed, screenShareAllowed, chatAllowed, isCoHost },
      });
    } else {
      // Classroom-wide student permissions toggle
      const studentMicEnabled =
        req.body.studentMicEnabled !== undefined ? Boolean(req.body.studentMicEnabled) : classroom.student_mic_enabled === 1;
      const studentCameraEnabled =
        req.body.studentCameraEnabled !== undefined ? Boolean(req.body.studentCameraEnabled) : classroom.student_camera_enabled === 1;
      const studentScreenshareEnabled =
        req.body.studentScreenshareEnabled !== undefined
          ? Boolean(req.body.studentScreenshareEnabled)
          : classroom.student_screenshare_enabled === 1;
      const studentChatEnabled =
        req.body.studentChatEnabled !== undefined ? Boolean(req.body.studentChatEnabled) : classroom.student_chat_enabled === 1;
      const waitingRoomEnabled =
        req.body.waitingRoomEnabled !== undefined ? Boolean(req.body.waitingRoomEnabled) : classroom.waiting_room_enabled === 1;

      db.prepare(
        `UPDATE virtual_classrooms
         SET student_mic_enabled = ?,
             student_camera_enabled = ?,
             student_screenshare_enabled = ?,
             student_chat_enabled = ?,
             waiting_room_enabled = ?,
             muted_all = ?,
             updated_at = ?
         WHERE id = ?`
      ).run(
        studentMicEnabled ? 1 : 0,
        studentCameraEnabled ? 1 : 0,
        studentScreenshareEnabled ? 1 : 0,
        studentChatEnabled ? 1 : 0,
        waitingRoomEnabled ? 1 : 0,
        studentMicEnabled ? 0 : classroom.muted_all,
        now,
        classroom.id
      );

      db.prepare(
        `UPDATE virtual_lesson_participants
         SET mic_allowed = ?, cam_allowed = ?, screenshare_allowed = ?, chat_allowed = ?, updated_at = ?
         WHERE classroom_id = ? AND user_role = 'student' AND is_co_host = 0`
      ).run(
        studentMicEnabled ? 1 : 0,
        studentCameraEnabled ? 1 : 0,
        studentScreenshareEnabled ? 1 : 0,
        studentChatEnabled ? 1 : 0,
        now,
        classroom.id
      );

      const students = db
        .prepare(`SELECT * FROM virtual_lesson_participants WHERE classroom_id = ? AND user_role = 'student' AND is_co_host = 0`)
        .all(classroom.id) as any[];
      for (const st of students) {
        if (!studentMicEnabled || !studentCameraEnabled) {
          await muteLiveKitParticipantTracks({
            roomName: classroom.livekit_room_name,
            identity: st.livekit_identity,
            muteAudio: !studentMicEnabled,
            muteVideo: !studentCameraEnabled,
          });
        }
        await updateLiveKitParticipantPermissions({
          roomName: classroom.livekit_room_name,
          identity: st.livekit_identity,
          micAllowed: studentMicEnabled,
          camAllowed: studentCameraEnabled,
          screenShareAllowed: studentScreenshareEnabled,
          chatAllowed: studentChatEnabled,
        });
      }

      await broadcastLiveKitRoomData(classroom.livekit_room_name, {
        type: 'CLASSROOM_SETTINGS_UPDATED',
        studentMicEnabled,
        studentCameraEnabled,
        studentScreenshareEnabled,
        studentChatEnabled,
        waitingRoomEnabled,
      });

      writeVirtualAudit(db, {
        schoolId,
        lessonId: lesson.id,
        classroomId: classroom.id,
        session,
        action: 'update_room_permissions',
        details: { studentMicEnabled, studentCameraEnabled, studentScreenshareEnabled, studentChatEnabled, waitingRoomEnabled },
      });
    }

    notifyMySqlTablesChanged(['virtual_classrooms', 'virtual_lesson_participants']);
    broadcastVirtualLessonChange(schoolId, lesson.id, session.userId);
    res.json({ ok: true });
  });

  app.post('/api/virtual-lessons/:id/raise-hand', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const classroomId = String(req.body?.classroomId || '').trim();
    const raised = req.body?.raised !== false;
    const now = nowIso();

    db.prepare(
      `UPDATE virtual_lesson_participants
       SET hand_raised = ?, hand_raised_at = ?, updated_at = ?
       WHERE lesson_id = ? AND classroom_id = ? AND user_id = ? AND school_id = ?`
    ).run(raised ? 1 : 0, raised ? now : null, now, req.params.id, classroomId, session.userId, schoolId);

    notifyMySqlTablesChanged(['virtual_lesson_participants']);
    broadcastVirtualLessonChange(schoolId, req.params.id, session.userId);
    res.json({ ok: true, handRaised: raised });
  });

  app.get('/api/virtual-lessons/:id/chat', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const classroomId = String(req.query.classroomId || '').trim();
    const messages = classroomId
      ? (db
          .prepare(
            `SELECT * FROM virtual_lesson_chat_messages
             WHERE school_id = ? AND lesson_id = ? AND classroom_id = ?
             ORDER BY created_at ASC LIMIT 200`
          )
          .all(schoolId, req.params.id, classroomId) as any[])
      : [];
    res.json({ messages });
  });

  app.post('/api/virtual-lessons/:id/chat', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const classroomId = String(req.body?.classroomId || '').trim();
    const message = String(req.body?.message || '').trim();
    if (!classroomId || !message) {
      return res.status(400).json({ error: 'classroomId and message are required.' });
    }

    const room = db.prepare(`SELECT * FROM virtual_classrooms WHERE id = ? AND school_id = ?`).get(classroomId, schoolId) as any;
    if (!room) return res.status(404).json({ error: 'Classroom not found.' });
    if (session.role === 'student' && room.student_chat_enabled === 0) {
      return res.status(403).json({ error: 'Student chat is currently disabled by the teacher.' });
    }

    const msgId = `vlcm-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = nowIso();
    db.prepare(
      `INSERT INTO virtual_lesson_chat_messages
         (id, school_id, lesson_id, classroom_id, sender_id, sender_name, sender_role, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(msgId, schoolId, req.params.id, classroomId, session.userId, String(session.user?.name || 'User'), session.role, message, now);

    notifyMySqlTablesChanged(['virtual_lesson_chat_messages']);
    broadcastVirtualLessonChange(schoolId, req.params.id, session.userId);
    res.status(201).json({
      message: {
        id: msgId,
        classroom_id: classroomId,
        sender_id: session.userId,
        sender_name: String(session.user?.name || 'User'),
        sender_role: session.role,
        message,
        created_at: now,
      },
    });
  });

  // -------------------------------------------------------------------------
  // 9. Participants & Verified Attendance
  // -------------------------------------------------------------------------
  app.get('/api/virtual-lessons/:id/participants', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const lesson = db
      .prepare(`SELECT * FROM virtual_lessons WHERE id = ? AND school_id = ?`)
      .get(req.params.id, schoolId) as any;
    if (!lesson) return res.status(404).json({ error: 'Virtual lesson not found.' });

    const classroomId = req.query.classroomId ? String(req.query.classroomId) : null;
    const rows = db
      .prepare(
        `SELECT * FROM virtual_lesson_participants
         WHERE lesson_id = ? AND school_id = ?
           AND (? IS NULL OR classroom_id = ?)
         ORDER BY CASE WHEN user_role != 'student' THEN 0 ELSE 1 END, is_connected DESC, user_name ASC`
      )
      .all(lesson.id, schoolId, classroomId, classroomId) as any[];

    res.json({ participants: rows });
  });

  app.get('/api/virtual-lessons/:id/attendance', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const lesson = db
      .prepare(`SELECT * FROM virtual_lessons WHERE id = ? AND school_id = ?`)
      .get(req.params.id, schoolId) as any;
    if (!lesson) return res.status(404).json({ error: 'Virtual lesson not found.' });

    const streamLinks = db
      .prepare(`SELECT stream_id, classroom_id FROM virtual_lesson_streams WHERE lesson_id = ?`)
      .all(lesson.id) as Array<{ stream_id: string; classroom_id: string }>;

    const targetStreamIds = streamLinks.map((s) => s.stream_id);
    const enrolled =
      targetStreamIds.length > 0
        ? (db
            .prepare(
              `SELECT DISTINCT ssa.student_id, ssa.student_name, ssa.admission_number, ssa.stream_id, st.display_name as stream_name
               FROM student_stream_assignments ssa
               JOIN streams st ON st.id = ssa.stream_id
               WHERE ssa.school_id = ? AND ssa.grade_id = ? AND ssa.stream_id IN (${targetStreamIds.map(() => '?').join(',')}) AND ssa.is_active = 1
               ORDER BY st.name ASC, ssa.student_name ASC`
            )
            .all(schoolId, lesson.grade_id, ...targetStreamIds) as any[])
        : [];

    const attendanceRows = db
      .prepare(`SELECT * FROM virtual_lesson_attendance WHERE lesson_id = ? AND school_id = ?`)
      .all(lesson.id, schoolId) as any[];
    const attMap = new Map(attendanceRows.map((a) => [a.student_id, a]));

    const register = enrolled.map((stu) => {
      const rec = attMap.get(stu.student_id);
      return {
        studentId: stu.student_id,
        studentName: stu.student_name,
        admissionNumber: stu.admission_number || '',
        streamId: stu.stream_id,
        streamName: stu.stream_name,
        firstJoinedAt: rec?.first_joined_at || null,
        lastLeftAt: rec?.last_left_at || null,
        totalAttendanceMinutes: Number(rec?.total_attendance_minutes || 0),
        reconnectCount: Number(rec?.reconnect_count || 0),
        attendanceStatus: rec?.attendance_status || 'absent',
        verifiedVia: rec?.verified_via || 'not_joined',
      };
    });

    res.json({
      lessonId: lesson.id,
      subjectName: lesson.subject_name,
      topic: lesson.topic,
      scheduledDate: lesson.scheduled_date,
      totalStudents: register.length,
      presentCount: register.filter((r) => r.attendanceStatus === 'present').length,
      partialCount: register.filter((r) => r.attendanceStatus === 'partial').length,
      absentCount: register.filter((r) => r.attendanceStatus === 'absent').length,
      register,
    });
  });

  // -------------------------------------------------------------------------
  // 10. Lesson Recordings Management & Retention
  // -------------------------------------------------------------------------
  app.post('/api/virtual-lessons/:id/recording/start', requireAuth, async (req: Request, res: Response) => {
    const ctx = requireRoomModerator(req, res);
    if (!ctx) return;
    const { db, classroom, lesson, schoolId, session } = ctx;
    const policy = getSchoolPolicy(db, schoolId);
    const recordingId = `rec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = nowIso();
    const retentionUntil = new Date(Date.now() + policy.recordingRetentionDays * 86400000).toISOString();

    const egressRes = await startLiveKitEgressRecording({
      roomName: classroom.livekit_room_name,
      recordingId,
    });

    const rowId = `vlr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    db.prepare(
      `INSERT INTO virtual_lesson_recordings
         (id, school_id, lesson_id, classroom_id, recording_id, egress_id, recording_url,
          recording_status, duration_seconds, started_by, retention_until, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'recording', 0, ?, ?, ?, ?)`
    ).run(
      rowId,
      schoolId,
      lesson.id,
      classroom.id,
      recordingId,
      egressRes.egressId,
      egressRes.recordingUrl,
      String(session.user?.name || session.userId),
      retentionUntil,
      now,
      now
    );

    db.prepare(`UPDATE virtual_classrooms SET recording_enabled = 1, updated_at = ? WHERE id = ?`).run(now, classroom.id);
    await broadcastLiveKitRoomData(classroom.livekit_room_name, { type: 'RECORDING_STATE', active: true, recordingId });
    writeVirtualAudit(db, {
      schoolId,
      lessonId: lesson.id,
      classroomId: classroom.id,
      session,
      action: 'start_recording',
      details: { recordingId, egressActive: egressRes.egressActive },
    });
    notifyMySqlTablesChanged(['virtual_lesson_recordings', 'virtual_classrooms']);
    broadcastVirtualLessonChange(schoolId, lesson.id, session.userId);
    res.status(201).json({
      recording: db.prepare(`SELECT * FROM virtual_lesson_recordings WHERE id = ?`).get(rowId),
      egressActive: egressRes.egressActive,
    });
  });

  app.post('/api/virtual-lessons/:id/recording/stop', requireAuth, async (req: Request, res: Response) => {
    const ctx = requireRoomModerator(req, res);
    if (!ctx) return;
    const { db, classroom, lesson, schoolId, session } = ctx;
    const now = nowIso();
    const activeRows = db
      .prepare(
        `SELECT * FROM virtual_lesson_recordings
         WHERE classroom_id = ? AND recording_status = 'recording' AND deleted_at IS NULL`
      )
      .all(classroom.id) as any[];

    for (const r of activeRows) {
      await stopLiveKitEgressRecording(r.egress_id);
      const startMs = Date.parse(r.created_at) || Date.now();
      const dur = Math.max(1, Math.round((Date.now() - startMs) / 1000));
      db.prepare(
        `UPDATE virtual_lesson_recordings
         SET recording_status = 'completed',
             duration_seconds = ?,
             stopped_by = ?,
             recording_url = COALESCE(recording_url, ?),
             updated_at = ?
         WHERE id = ?`
      ).run(dur, String(session.user?.name || session.userId), `/api/virtual-lessons/recordings/${r.id}/metadata`, now, r.id);
    }

    await broadcastLiveKitRoomData(classroom.livekit_room_name, { type: 'RECORDING_STATE', active: false });
    writeVirtualAudit(db, {
      schoolId,
      lessonId: lesson.id,
      classroomId: classroom.id,
      session,
      action: 'stop_recording',
    });
    notifyMySqlTablesChanged(['virtual_lesson_recordings']);
    broadcastVirtualLessonChange(schoolId, lesson.id, session.userId);
    res.json({ ok: true });
  });

  app.delete('/api/virtual-lessons/recordings/:recordingId', requireAuth, (req: Request, res: Response) => {
    const db = getDb();
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res);
    if (!schoolId) return;
    const rec = db
      .prepare(`SELECT * FROM virtual_lesson_recordings WHERE id = ? AND school_id = ?`)
      .get(req.params.recordingId, schoolId) as any;
    if (!rec) return res.status(404).json({ error: 'Recording not found.' });

    const lesson = db.prepare(`SELECT * FROM virtual_lessons WHERE id = ?`).get(rec.lesson_id) as any;
    const priv = lesson ? resolveUserTeacherPrivilegesForLesson(db, session, schoolId, lesson) : { canModerate: false };
    if (!isSchoolAdmin(session) && !priv.canModerate) {
      return res.status(403).json({ error: 'Not authorized to delete this recording.' });
    }

    db.prepare(`UPDATE virtual_lesson_recordings SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(nowIso(), nowIso(), rec.id);
    notifyMySqlTablesChanged(['virtual_lesson_recordings']);
    broadcastVirtualLessonChange(schoolId, rec.lesson_id, session.userId);
    res.json({ ok: true });
  });

  // -------------------------------------------------------------------------
  // 11. LiveKit Verified Webhook Endpoint (Room Completion, Join/Leave, Egress)
  // -------------------------------------------------------------------------
  app.post('/api/livekit/webhook', async (req: Request, res: Response) => {
    try {
      const cfg = getLiveKitConfig();
      if (!cfg.apiKey || !(cfg.webhookSecret || cfg.apiSecret)) {
        return res.status(503).json({
          error: 'LiveKit webhook credentials (LIVEKIT_API_KEY / LIVEKIT_API_SECRET) are not configured on this server.',
        });
      }

      const rawBody =
        typeof (req as any).rawBody === 'string'
          ? (req as any).rawBody
          : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body || {});
      const authHeader = String(req.headers.authorization || req.headers['Authorization'] || '');

      let event: any;
      try {
        event = await verifyLiveKitWebhook(rawBody, authHeader);
      } catch (verifyErr: any) {
        return res.status(401).json({ error: verifyErr?.message || 'Invalid LiveKit webhook signature.' });
      }
      if (!event) {
        return res.status(400).json({ error: 'Empty webhook payload.' });
      }

      const db = getDb();
      const now = nowIso();
      const eventType = String(event.event || '');
      const roomName = event.room?.name ? String(event.room.name) : null;
      const participantIdentity = event.participant?.identity ? String(event.participant.identity) : null;
      const eventId = String(
        event.id || `${eventType}:${roomName || ''}:${participantIdentity || ''}:${event.createdAt || now}`
      );

      // Idempotent deduplication check
      const inserted = db
        .prepare(
          `INSERT OR IGNORE INTO livekit_webhook_events (event_id, event_type, room_name, participant_identity, received_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(eventId, eventType, roomName, participantIdentity, now);

      if (inserted.changes === 0) {
        return res.status(200).json({ ok: true, duplicate: true, event: eventType });
      }

      const classroom = roomName
        ? (db.prepare(`SELECT * FROM virtual_classrooms WHERE livekit_room_name = ? LIMIT 1`).get(roomName) as any)
        : null;

      if (classroom) {
        if (eventType === 'room_started') {
          db.prepare(
            `UPDATE virtual_classrooms
             SET room_status = CASE WHEN room_status IN ('scheduled', 'postponed') THEN 'live' ELSE room_status END,
                 actual_start_time = COALESCE(actual_start_time, ?),
                 updated_at = ?
             WHERE id = ?`
          ).run(now, now, classroom.id);
          db.prepare(
            `UPDATE virtual_lessons
             SET status = CASE WHEN status IN ('scheduled', 'postponed') THEN 'live' ELSE status END,
                 actual_started_at = COALESCE(actual_started_at, ?),
                 updated_at = ?
             WHERE id = ?`
          ).run(now, now, classroom.lesson_id);
        } else if (eventType === 'participant_joined' && participantIdentity) {
          const parsedMeta = safeParseJson<Record<string, any>>(event.participant?.metadata, {});
          const fallbackUserId = participantIdentity.includes(':')
            ? participantIdentity.split(':').slice(1).join(':')
            : participantIdentity;
          const resolvedUserId = String(parsedMeta.userId || fallbackUserId);

          let p = db
            .prepare(`SELECT * FROM virtual_lesson_participants WHERE classroom_id = ? AND livekit_identity = ? LIMIT 1`)
            .get(classroom.id, participantIdentity) as any;

          if (!p && resolvedUserId) {
            p = db
              .prepare(`SELECT * FROM virtual_lesson_participants WHERE classroom_id = ? AND user_id = ? LIMIT 1`)
              .get(classroom.id, resolvedUserId) as any;
          }

          if (p) {
            const isReconnect = Boolean(p.join_time && p.is_connected === 0);
            const nextReconnect = isReconnect ? Number(p.reconnect_count || 0) + 1 : Number(p.reconnect_count || 0);
            const existingStatus = p.attendance_status === 'present' ? 'present' : 'partial';

            db.prepare(
              `UPDATE virtual_lesson_participants
               SET is_connected = 1,
                   livekit_identity = ?,
                   join_time = COALESCE(join_time, ?),
                   last_heartbeat_at = ?,
                   reconnect_count = ?,
                   attendance_status = ?,
                   updated_at = ?
               WHERE id = ?`
            ).run(participantIdentity, now, now, nextReconnect, existingStatus, now, p.id);
          } else {
            // Upsert participant automatically if they joined via pre-issued LiveKit token
            const userRow = db
              .prepare(`SELECT id, name, role FROM users WHERE id = ? AND school_id = ? LIMIT 1`)
              .get(resolvedUserId, classroom.school_id) as { id: string; name: string; role: string } | undefined;

            const userRole = String(parsedMeta.role || userRow?.role || 'student');
            const userName = String(event.participant?.name || userRow?.name || 'Participant');
            const isMod = Boolean(parsedMeta.isModerator || userRole !== 'student');
            const partId = `vlp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

            db.prepare(
              `INSERT INTO virtual_lesson_participants
                 (id, school_id, lesson_id, classroom_id, user_id, user_name, user_role, stream_id, livekit_identity,
                  admission_status, is_co_host, mic_allowed, cam_allowed, screenshare_allowed, chat_allowed,
                  hand_raised, join_time, last_heartbeat_at, reconnect_count, attendance_status, is_connected, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'admitted', ?, ?, ?, ?, ?, 0, ?, ?, 0, 'partial', 1, ?, ?)`
            ).run(
              partId,
              classroom.school_id,
              classroom.lesson_id,
              classroom.id,
              userRow?.id || resolvedUserId,
              userName,
              userRole,
              parsedMeta.streamId ? String(parsedMeta.streamId) : null,
              participantIdentity,
              isMod ? 1 : 0,
              isMod || classroom.student_mic_enabled ? 1 : 0,
              isMod || classroom.student_camera_enabled ? 1 : 0,
              isMod || classroom.student_screenshare_enabled ? 1 : 0,
              isMod || classroom.student_chat_enabled ? 1 : 0,
              now,
              now,
              now,
              now
            );

            p = db.prepare(`SELECT * FROM virtual_lesson_participants WHERE id = ?`).get(partId) as any;
          }

          if (p && p.user_role === 'student') {
            const nextReconnect = Number(p.reconnect_count || 0);
            const existingAtt = db
              .prepare(`SELECT * FROM virtual_lesson_attendance WHERE lesson_id = ? AND student_id = ? LIMIT 1`)
              .get(classroom.lesson_id, p.user_id) as any;
            if (existingAtt) {
              db.prepare(
                `UPDATE virtual_lesson_attendance
                 SET reconnect_count = ?, verified_via = 'livekit_webhook', updated_at = ?
                 WHERE id = ?`
              ).run(nextReconnect, now, existingAtt.id);
            } else {
              db.prepare(
                `INSERT INTO virtual_lesson_attendance
                   (id, school_id, lesson_id, classroom_id, student_id, student_name, stream_id,
                    first_joined_at, total_attendance_minutes, reconnect_count, attendance_status, verified_via, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'partial', 'livekit_webhook', ?, ?)`
              ).run(
                `vla-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
                classroom.school_id,
                classroom.lesson_id,
                classroom.id,
                p.user_id,
                p.user_name,
                p.stream_id || null,
                now,
                nextReconnect,
                now,
                now
              );
            }
          }
        } else if (eventType === 'participant_left' && participantIdentity) {
          const p = db
            .prepare(`SELECT * FROM virtual_lesson_participants WHERE classroom_id = ? AND livekit_identity = ? LIMIT 1`)
            .get(classroom.id, participantIdentity) as any;

          if (p) {
            const startAnchor = p.last_heartbeat_at || p.join_time || now;
            const deltaSec = Math.max(0, Math.round((Date.now() - Date.parse(startAnchor)) / 1000));
            const totalSec = Number(p.total_duration_seconds || 0) + deltaSec;
            const totalMins = Number((totalSec / 60).toFixed(1));
            const attStatus = totalMins >= 5 ? 'present' : p.join_time ? 'partial' : 'absent';

            db.prepare(
              `UPDATE virtual_lesson_participants
               SET is_connected = 0,
                   leave_time = ?,
                   total_duration_seconds = ?,
                   attendance_status = ?,
                   updated_at = ?
               WHERE id = ?`
            ).run(now, totalSec, attStatus, now, p.id);

            if (p.user_role === 'student') {
              db.prepare(
                `UPDATE virtual_lesson_attendance
                 SET last_left_at = ?,
                     total_attendance_minutes = ?,
                     attendance_status = ?,
                     verified_via = 'livekit_webhook',
                     updated_at = ?
                 WHERE lesson_id = ? AND student_id = ?`
              ).run(now, totalMins, attStatus, now, classroom.lesson_id, p.user_id);
            }
          }
        } else if (eventType === 'room_finished') {
          // Disconnect all still-connected participants and roll up durations & attendance
          const connectedParticipants = db
            .prepare(`SELECT * FROM virtual_lesson_participants WHERE classroom_id = ? AND is_connected = 1`)
            .all(classroom.id) as any[];

          for (const p of connectedParticipants) {
            const startAnchor = p.last_heartbeat_at || p.join_time || now;
            const deltaSec = Math.max(0, Math.round((Date.now() - Date.parse(startAnchor)) / 1000));
            const totalSec = Number(p.total_duration_seconds || 0) + deltaSec;
            const totalMins = Number((totalSec / 60).toFixed(1));
            const attStatus = totalMins >= 5 ? 'present' : p.join_time ? 'partial' : 'absent';

            db.prepare(
              `UPDATE virtual_lesson_participants
               SET is_connected = 0,
                   leave_time = COALESCE(leave_time, ?),
                   total_duration_seconds = ?,
                   attendance_status = ?,
                   updated_at = ?
               WHERE id = ?`
            ).run(now, totalSec, attStatus, now, p.id);

            if (p.user_role === 'student') {
              db.prepare(
                `UPDATE virtual_lesson_attendance
                 SET last_left_at = COALESCE(last_left_at, ?),
                     total_attendance_minutes = ?,
                     attendance_status = ?,
                     verified_via = 'livekit_webhook',
                     updated_at = ?
                 WHERE lesson_id = ? AND student_id = ?`
              ).run(now, totalMins, attStatus, now, classroom.lesson_id, p.user_id);
            }
          }

          // Finalize any still-open recordings for this classroom
          db.prepare(
            `UPDATE virtual_lesson_recordings
             SET recording_status = 'completed',
                 updated_at = ?
             WHERE classroom_id = ? AND recording_status = 'recording' AND deleted_at IS NULL`
          ).run(now, classroom.id);

          // Mark classroom completed if not already cancelled/completed
          if (classroom.room_status !== 'completed' && classroom.room_status !== 'cancelled') {
            db.prepare(
              `UPDATE virtual_classrooms
               SET room_status = 'completed',
                   actual_end_time = COALESCE(actual_end_time, ?),
                   locked = 1,
                   updated_at = ?
               WHERE id = ?`
            ).run(now, now, classroom.id);
          }

          // If all classrooms in this lesson are now completed/cancelled, close the parent lesson
          const remainingActive = db
            .prepare(
              `SELECT COUNT(*) as c FROM virtual_classrooms
               WHERE lesson_id = ? AND room_status IN ('scheduled', 'live', 'postponed')`
            )
            .get(classroom.lesson_id) as { c: number };

          if (remainingActive.c === 0) {
            db.prepare(
              `UPDATE virtual_lessons
               SET status = 'completed',
                   actual_ended_at = COALESCE(actual_ended_at, ?),
                   updated_at = ?
               WHERE id = ? AND status != 'cancelled'`
            ).run(now, now, classroom.lesson_id);
            syncLessonNotifications(db, classroom.lesson_id, 'completed');
          }
        } else if (eventType === 'egress_ended' && event.egressInfo?.egressId) {
          const fileUrl = event.egressInfo?.fileResults?.[0]?.location || null;
          db.prepare(
            `UPDATE virtual_lesson_recordings
             SET recording_status = 'completed',
                 recording_url = COALESCE(?, recording_url),
                 updated_at = ?
             WHERE egress_id = ?`
          ).run(fileUrl, now, event.egressInfo.egressId);
        }

        notifyMySqlTablesChanged(VIRTUAL_CLASSROOM_TABLES);
        broadcastVirtualLessonChange(classroom.school_id, classroom.lesson_id);
      }

      res.status(200).json({ ok: true, event: eventType, roomName, handled: Boolean(classroom) });
    } catch (err: any) {
      console.error('[livekit-webhook] handler error:', err);
      res.status(500).json({ error: err?.message || 'Webhook processing error' });
    }
  });
}
