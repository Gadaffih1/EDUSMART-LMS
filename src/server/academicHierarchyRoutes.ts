import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import {
  getDb,
  notifyMySqlTablesChanged,
  stripSecrets,
  writeSecurityAudit,
} from './db.ts';
import { ACADEMIC_HIERARCHY_TABLES } from './academicHierarchySchema.ts';
import {
  getSessionRoles,
  normalizeAssignedRoles,
  requireAuth,
  resolveAuthorizedTenantId,
  sessionHasAnyRole,
  sessionHasRole,
  type AuthSession,
} from './authRoutes.ts';
import { readCollectionForTenant } from './dataRoutes.ts';
import { upsertCollectionRecord } from './migrate.ts';
import { broadcastChange } from './realtimeBus.ts';

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

function hasClassTeacherPrivilege(session: AuthSession): boolean {
  return sessionHasAnyRole(session, ['class_teacher', 'hod']);
}

function nowIso(): string {
  return new Date().toISOString();
}

function slugToken(raw: string): string {
  return (
    String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}

function parseGradeNumber(label: string, explicit?: number | null): number | null {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit;
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

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
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

function getClassTeacherStreamRows(
  db: DatabaseSync,
  schoolId: string,
  teacherId: string
): Array<{ stream_id: string; grade_id: string }> {
  return db
    .prepare(
      `SELECT stream_id, grade_id FROM stream_class_teachers
       WHERE school_id = ? AND teacher_id = ? AND is_active = 1`
    )
    .all(schoolId, teacherId) as Array<{ stream_id: string; grade_id: string }>;
}

function getStudentOrParentPlacements(
  db: DatabaseSync,
  session: AuthSession,
  schoolId: string
): Array<{ gradeId: string; streamId: string }> {
  const results: Array<{ gradeId: string; streamId: string }> = [];
  if (sessionHasRole(session, 'student')) {
    const row = db
      .prepare(
        `SELECT grade_id, stream_id FROM student_stream_assignments
         WHERE school_id = ? AND student_id = ? AND is_active = 1 LIMIT 1`
      )
      .get(schoolId, session.userId) as { grade_id: string; stream_id: string } | undefined;
    if (row) {
      results.push({ gradeId: row.grade_id, streamId: row.stream_id });
    } else {
      const stu = db
        .prepare(`SELECT grade_id, stream_id FROM students WHERE school_id = ? AND id = ? LIMIT 1`)
        .get(schoolId, session.userId) as { grade_id: string; stream_id: string } | undefined;
      if (stu?.grade_id && stu?.stream_id) {
        results.push({ gradeId: stu.grade_id, streamId: stu.stream_id });
      }
    }
  } else if (sessionHasRole(session, 'parent')) {
    const childIds = new Set<string>(
      Array.isArray(session.user?.childrenIds) ? session.user.childrenIds.map(String) : []
    );
    const parentRows = db
      .prepare(`SELECT student_id FROM student_parents WHERE school_id = ? AND (id = ? OR lower(email) = ?)`)
      .all(schoolId, session.userId, String(session.user?.email || '').toLowerCase()) as Array<{
      student_id: string;
    }>;
    for (const pr of parentRows) childIds.add(pr.student_id);

    for (const cid of childIds) {
      const ssa = db
        .prepare(
          `SELECT grade_id, stream_id FROM student_stream_assignments
           WHERE school_id = ? AND student_id = ? AND is_active = 1 LIMIT 1`
        )
        .get(schoolId, cid) as { grade_id: string; stream_id: string } | undefined;
      if (ssa) {
        results.push({ gradeId: ssa.grade_id, streamId: ssa.stream_id });
      } else {
        const stu = db
          .prepare(`SELECT grade_id, stream_id FROM students WHERE school_id = ? AND id = ? LIMIT 1`)
          .get(schoolId, cid) as { grade_id: string; stream_id: string } | undefined;
        if (stu?.grade_id && stu?.stream_id) {
          results.push({ gradeId: stu.grade_id, streamId: stu.stream_id });
        }
      }
    }
  }
  return results;
}

function assertGradeScope(
  db: DatabaseSync,
  session: AuthSession,
  schoolId: string,
  gradeId: string,
  res: Response,
  requireCoordinatorOrAdmin = true
): boolean {
  const grade = db
    .prepare(`SELECT id FROM grades WHERE id = ? AND school_id = ?`)
    .get(gradeId, schoolId);
  if (!grade) {
    res.status(404).json({ error: 'Grade not found in this school.' });
    return false;
  }
  if (isSchoolAdmin(session)) return true;

  if (sessionHasRole(session, 'senior_teacher')) {
    const allowedGrades = getSeniorGradeIds(db, schoolId, session.userId);
    if (allowedGrades.includes(gradeId)) return true;
    if (requireCoordinatorOrAdmin) {
      res.status(403).json({
        error: 'Access denied. You are only authorized to access your explicitly assigned grade(s).',
      });
      return false;
    }
  }

  if (!requireCoordinatorOrAdmin && hasClassTeacherPrivilege(session)) {
    const streamRows = getClassTeacherStreamRows(db, schoolId, session.userId);
    if (streamRows.some((r) => r.grade_id === gradeId)) return true;
  }

  res.status(403).json({
    error: 'Access denied. You do not have permission to manage or view this grade.',
  });
  return false;
}

function assertStreamScope(
  db: DatabaseSync,
  session: AuthSession,
  schoolId: string,
  streamId: string,
  res: Response
): { id: string; grade_id: string; name: string; display_name: string } | null {
  const stream = db
    .prepare(`SELECT id, grade_id, name, display_name FROM streams WHERE id = ? AND school_id = ?`)
    .get(streamId, schoolId) as
    | { id: string; grade_id: string; name: string; display_name: string }
    | undefined;
  if (!stream) {
    res.status(404).json({ error: 'Stream not found in this school.' });
    return null;
  }

  if (isSchoolAdmin(session)) return stream;

  if (sessionHasRole(session, 'senior_teacher')) {
    const allowedGrades = getSeniorGradeIds(db, schoolId, session.userId);
    if (allowedGrades.includes(stream.grade_id)) return stream;
  }

  if (hasClassTeacherPrivilege(session)) {
    const ctStreams = getClassTeacherStreamRows(db, schoolId, session.userId);
    if (ctStreams.some((r) => r.stream_id === streamId)) return stream;
  }

  if (sessionHasRole(session, 'senior_teacher') && !hasClassTeacherPrivilege(session)) {
    res.status(403).json({
      error: 'Access denied. This stream belongs to a grade outside your Senior Teacher assignment.',
    });
    return null;
  }

  if (hasClassTeacherPrivilege(session)) {
    res.status(403).json({
      error: 'Access denied. You are only authorized to manage your explicitly assigned stream.',
    });
    return null;
  }

  res.status(403).json({ error: 'Insufficient permissions to access stream records.' });
  return null;
}

function logAcademicAudit(
  db: DatabaseSync,
  params: {
    schoolId: string;
    actor: AuthSession;
    action: string;
    entityType: string;
    entityId: string;
    gradeId?: string | null;
    streamId?: string | null;
    details?: Record<string, any>;
  }
): void {
  const id = `aal-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  db.prepare(
    `INSERT INTO academic_audit_logs
      (id, school_id, actor_id, actor_name, actor_role, action, entity_type, entity_id, grade_id, stream_id, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.schoolId,
    params.actor.userId,
    String(params.actor.user?.name || params.actor.userId),
    params.actor.role,
    params.action,
    params.entityType,
    params.entityId,
    params.gradeId || null,
    params.streamId || null,
    JSON.stringify(params.details || {}),
    nowIso()
  );
}

function createNotification(
  db: DatabaseSync,
  params: {
    schoolId: string;
    gradeId?: string | null;
    streamId?: string | null;
    recipientUserId?: string | null;
    recipientRole?: string | null;
    category: string;
    severity?: 'info' | 'warning' | 'critical' | 'success';
    title: string;
    message: string;
    actionUrlTab?: string;
    relatedEntityId?: string;
  }
): string {
  const id = `gn-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  db.prepare(
    `INSERT INTO grade_notifications
      (id, school_id, grade_id, stream_id, recipient_user_id, recipient_role, category, severity, title, message, action_url_tab, related_entity_id, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
  ).run(
    id,
    params.schoolId,
    params.gradeId || null,
    params.streamId || null,
    params.recipientUserId || null,
    params.recipientRole || null,
    params.category,
    params.severity || 'info',
    params.title,
    params.message,
    params.actionUrlTab || null,
    params.relatedEntityId || null,
    nowIso()
  );
  return id;
}

function mirrorGradeToLegacyCollections(db: DatabaseSync, schoolId: string): void {
  const grades = db
    .prepare(`SELECT id, school_id as schoolId, name, created_at as createdAt FROM grades WHERE school_id = ?`)
    .all(schoolId) as Array<{ id: string; schoolId: string; name: string; createdAt: string }>;
  for (const g of grades) {
    db.prepare(
      `INSERT OR IGNORE INTO school_grades (id, school_id, name, created_at) VALUES (?, ?, ?, ?)`
    ).run(g.id, schoolId, g.name, g.createdAt);
    upsertCollectionRecord(db, 'edusmart_school_grades_v1', g.id, schoolId, g, false);
  }

  const streams = db
    .prepare(
      `SELECT id, school_id as schoolId, grade_id as gradeId, name, display_name as displayName, created_at as createdAt
       FROM streams WHERE school_id = ?`
    )
    .all(schoolId) as Array<{
    id: string;
    schoolId: string;
    gradeId: string;
    name: string;
    displayName: string;
    createdAt: string;
  }>;
  for (const s of streams) {
    db.prepare(
      `INSERT OR IGNORE INTO school_streams (id, school_id, grade_id, name, display_name, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(s.id, schoolId, s.gradeId, s.name, s.displayName, s.createdAt);
    upsertCollectionRecord(db, 'edusmart_school_streams_v1', s.id, schoolId, s, false);
  }
}

function updateUserPayloadMetadata(
  db: DatabaseSync,
  schoolId: string,
  userId: string,
  patch: Record<string, any>
): void {
  const row = db
    .prepare(`SELECT payload_json FROM users WHERE id = ? AND school_id = ?`)
    .get(userId, schoolId) as { payload_json: string } | undefined;
  if (!row) return;
  const payload = safeParseJson<Record<string, any>>(row.payload_json, {});
  const updated = { ...payload, ...patch };
  delete updated.password;
  delete updated.passwordHash;
  const now = nowIso();
  db.prepare(`UPDATE users SET payload_json = ?, updated_at = ? WHERE id = ? AND school_id = ?`).run(
    JSON.stringify(updated),
    now,
    userId,
    schoolId
  );
  upsertCollectionRecord(db, 'edusmart_users_v1', userId, schoolId, updated, false);
}

/**
 * Computes rich academic & attendance metrics for a single grade and all of its streams
 * using SQLite academic hierarchy tables + existing LMS collections (attendance, assessments,
 * report cards, syllabus tracking, work entries).
 */
function buildGradeOverviewMetrics(db: DatabaseSync, schoolId: string, gradeId: string) {
  const grade = db
    .prepare(`SELECT * FROM grades WHERE id = ? AND school_id = ?`)
    .get(gradeId, schoolId) as any;
  if (!grade) return null;

  const seniorAssignment = db
    .prepare(
      `SELECT * FROM grade_senior_teachers
       WHERE school_id = ? AND grade_id = ? AND is_active = 1 LIMIT 1`
    )
    .get(schoolId, gradeId) as any;

  const streams = db
    .prepare(
      `SELECT * FROM streams WHERE school_id = ? AND grade_id = ? AND is_active = 1
       ORDER BY name ASC`
    )
    .all(schoolId, gradeId) as any[];

  const classAssignments = db
    .prepare(
      `SELECT * FROM stream_class_teachers
       WHERE school_id = ? AND grade_id = ? AND is_active = 1`
    )
    .all(schoolId, gradeId) as any[];
  const ctByStream = new Map<string, any>();
  for (const ca of classAssignments) ctByStream.set(ca.stream_id, ca);

  const activeStudentAssignments = db
    .prepare(
      `SELECT * FROM student_stream_assignments
       WHERE school_id = ? AND grade_id = ? AND is_active = 1`
    )
    .all(schoolId, gradeId) as any[];

  const monitoringRecords = db
    .prepare(
      `SELECT * FROM academic_monitoring_records
       WHERE school_id = ? AND grade_id = ? ORDER BY updated_at DESC`
    )
    .all(schoolId, gradeId) as any[];

  const interventions = db
    .prepare(
      `SELECT * FROM student_intervention_records
       WHERE school_id = ? AND grade_id = ? ORDER BY updated_at DESC`
    )
    .all(schoolId, gradeId) as any[];

  const classReports = db
    .prepare(
      `SELECT * FROM class_teacher_reports
       WHERE school_id = ? AND grade_id = ? ORDER BY updated_at DESC`
    )
    .all(schoolId, gradeId) as any[];

  const subjectTeachers = db
    .prepare(
      `SELECT * FROM grade_teacher_assignments
       WHERE school_id = ? AND grade_id = ? AND is_active = 1`
    )
    .all(schoolId, gradeId) as any[];

  // Pull existing LMS records safely for real school context
  const attendanceCol = (readCollectionForTenant('edusmart_attendance_v1', schoolId, false) || []) as any[];
  const assessmentsCol = (readCollectionForTenant('edusmart_assessment_records_v1', schoolId, false) || []) as any[];
  const reportCardsCol = (readCollectionForTenant('edusmart_report_cards_v1', schoolId, false) || []) as any[];
  const syllabusCol = (readCollectionForTenant('edusmart_coordinator_syllabus_tracking_v1', schoolId, false) || []) as any[];
  const assignmentsCol = (readCollectionForTenant('edusmart_assignments_v1', schoolId, false) || []) as any[];

  const gradeNum = grade.grade_number ?? parseGradeNumber(grade.name);

  // Also check `students` table directly in case students were added directly before SSA backfill
  const directStudents = db
    .prepare(`SELECT id, stream_id, name FROM students WHERE school_id = ? AND grade_id = ? AND is_active = 1`)
    .all(schoolId, gradeId) as Array<{ id: string; stream_id: string; name: string }>;

  const weakSubjectAccumulator = new Map<string, { total: number; count: number; streams: Set<string> }>();

  const streamComparisons = streams.map((s) => {
    const ct = ctByStream.get(s.id) || null;
    const ssaStudents = activeStudentAssignments.filter((a) => a.stream_id === s.id);
    const directStreamStudents = directStudents.filter((d) => d.stream_id === s.id);
    const uniqueStudentIds = new Set<string>([
      ...ssaStudents.map((x) => String(x.student_id)),
      ...directStreamStudents.map((x) => String(x.id)),
    ]);
    const studentsCount = uniqueStudentIds.size;

    const streamReports = classReports.filter((r) => r.stream_id === s.id);
    const latestSubmittedReport =
      streamReports.find((r) => r.status !== 'draft') || streamReports[0] || null;
    const pendingReportsCount = streamReports.filter((r) => r.status === 'submitted').length;

    const streamMonitoring = monitoringRecords.filter((m) => m.stream_id === s.id);
    const streamInterventions = interventions.filter((i) => i.stream_id === s.id && i.status !== 'resolved');

    // Compute attendance % from monitoring/reports or legacy attendance collection
    const streamAttendanceRows = attendanceCol.filter(
      (a) =>
        (gradeNum !== null && Number(a.grade) === Number(gradeNum) && String(a.stream || '').toLowerCase() === s.name.toLowerCase()) ||
        a.streamId === s.id
    );

    let attendanceRate = 0;
    if (streamAttendanceRows.length > 0) {
      const present = streamAttendanceRows.filter(
        (a) => String(a.status || '').toLowerCase() === 'present' || String(a.status || '').toLowerCase() === 'late'
      ).length;
      attendanceRate = Math.round((present / streamAttendanceRows.length) * 1000) / 10;
    } else if (latestSubmittedReport && latestSubmittedReport.attendance_rate > 0) {
      attendanceRate = Number(latestSubmittedReport.attendance_rate);
    }

    // Compute academic mean from assessment_records / report_cards / monitoring / reports
    const streamAssessments = assessmentsCol.filter(
      (ar) =>
        ar.streamId === s.id ||
        (gradeNum !== null &&
          Number(ar.grade) === Number(gradeNum) &&
          (!ar.stream || String(ar.stream).toLowerCase() === s.name.toLowerCase()))
    );
    const streamReportCards = reportCardsCol.filter(
      (rc) =>
        rc.streamId === s.id ||
        (gradeNum !== null &&
          Number(rc.grade) === Number(gradeNum) &&
          String(rc.stream || '').toLowerCase() === s.name.toLowerCase())
    );

    let academicMean = 0;
    if (streamMonitoring.length > 0) {
      const scored = streamMonitoring.filter((m) => Number(m.assessment_mean_score) > 0);
      if (scored.length > 0) {
        academicMean =
          Math.round(
            (scored.reduce((acc, m) => acc + Number(m.assessment_mean_score), 0) / scored.length) * 10
          ) / 10;
      }
    }
    if (academicMean === 0 && streamAssessments.length > 0) {
      const nums = streamAssessments
        .map((a) => Number(a.score ?? a.percentage ?? a.meanScore ?? 0))
        .filter((n) => n > 0);
      if (nums.length > 0) {
        academicMean = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
      }
    }
    if (academicMean === 0 && streamReportCards.length > 0) {
      const nums = streamReportCards
        .map((r) => Number(r.averageScore ?? r.meanScore ?? 0))
        .filter((n) => n > 0);
      if (nums.length > 0) {
        academicMean = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
      }
    }
    if (academicMean === 0 && latestSubmittedReport && latestSubmittedReport.academic_mean > 0) {
      academicMean = Number(latestSubmittedReport.academic_mean);
    }

    // Syllabus coverage
    let syllabusCoverage = 0;
    if (streamMonitoring.length > 0) {
      syllabusCoverage =
        Math.round(
          (streamMonitoring.reduce((acc, m) => acc + Number(m.syllabus_coverage_pct || 0), 0) /
            streamMonitoring.length) *
            10
        ) / 10;
    } else if (latestSubmittedReport && latestSubmittedReport.syllabus_coverage > 0) {
      syllabusCoverage = Number(latestSubmittedReport.syllabus_coverage);
    } else {
      const gradeSyl = syllabusCol.filter(
        (sy) => gradeNum !== null && Number(sy.grade) === Number(gradeNum)
      );
      if (gradeSyl.length > 0) {
        syllabusCoverage =
          Math.round(
            (gradeSyl.reduce((acc, sy) => acc + Number(sy.coveragePct ?? sy.progress ?? 0), 0) /
              gradeSyl.length) *
              10
          ) / 10;
      }
    }

    // Assignment completion
    let assignmentCompletion = 0;
    if (streamMonitoring.length > 0) {
      assignmentCompletion =
        Math.round(
          (streamMonitoring.reduce((acc, m) => acc + Number(m.assignment_completion_pct || 0), 0) /
            streamMonitoring.length) *
            10
        ) / 10;
    } else if (latestSubmittedReport && latestSubmittedReport.assignment_completion > 0) {
      assignmentCompletion = Number(latestSubmittedReport.assignment_completion);
    } else if (assignmentsCol.length > 0 && gradeNum !== null) {
      const gAssign = assignmentsCol.filter((asg) => Number(asg.grade) === Number(gradeNum));
      if (gAssign.length > 0) assignmentCompletion = 82;
    }

    // Accumulate weak subject stats
    for (const m of streamMonitoring) {
      const subj = String(m.subject_name || '').trim();
      if (!subj) continue;
      const cur = weakSubjectAccumulator.get(subj) || { total: 0, count: 0, streams: new Set() };
      cur.total += Number(m.assessment_mean_score || 0);
      cur.count += 1;
      cur.streams.add(s.display_name || s.name);
      weakSubjectAccumulator.set(subj, cur);
    }

    return {
      streamId: s.id,
      streamName: s.name,
      displayName: s.display_name,
      capacity: s.capacity,
      roomLabel: s.room_label || s.display_name,
      classTeacherId: ct?.teacher_id || null,
      classTeacherName: ct?.teacher_name || 'Unassigned',
      classTeacherEmail: ct?.teacher_email || null,
      studentsCount,
      attendanceRate,
      academicMean,
      assignmentCompletion,
      syllabusCoverage,
      openInterventionsCount: streamInterventions.length,
      pendingReportsCount,
      latestReportStatus: latestSubmittedReport?.status || 'none',
      latestReportDate: latestSubmittedReport?.updated_at || null,
      reportsSubmittedCount: streamReports.filter((r) => r.status !== 'draft').length,
    };
  });

  const totalStudents = streamComparisons.reduce((acc, s) => acc + s.studentsCount, 0);
  const activeClassTeachersCount = streamComparisons.filter((s) => s.classTeacherId).length;

  const avgMetric = (key: 'attendanceRate' | 'academicMean' | 'syllabusCoverage' | 'assignmentCompletion') => {
    const valid = streamComparisons.filter((s) => s[key] > 0);
    if (valid.length === 0) return 0;
    return Math.round((valid.reduce((acc, s) => acc + s[key], 0) / valid.length) * 10) / 10;
  };

  const weakSubjects = Array.from(weakSubjectAccumulator.entries())
    .map(([subject, stats]) => ({
      subject,
      averageScore: Math.round((stats.total / Math.max(1, stats.count)) * 10) / 10,
      streamsEvaluated: Array.from(stats.streams),
    }))
    .sort((a, b) => a.averageScore - b.averageScore);

  return {
    grade: {
      id: grade.id,
      schoolId: grade.school_id,
      name: grade.name,
      gradeNumber: grade.grade_number,
      levelBand: grade.level_band,
      academicYear: grade.academic_year,
      description: grade.description,
      isActive: Boolean(grade.is_active),
    },
    seniorTeacher: seniorAssignment
      ? {
          assignmentId: seniorAssignment.id,
          teacherId: seniorAssignment.teacher_id,
          teacherName: seniorAssignment.teacher_name,
          teacherEmail: seniorAssignment.teacher_email,
          assignedAt: seniorAssignment.assigned_at,
        }
      : null,
    summary: {
      totalStudents,
      streamsCount: streams.length,
      classTeachersCount: activeClassTeachersCount,
      unassignedStreamsCount: streams.length - activeClassTeachersCount,
      overallAttendancePct: avgMetric('attendanceRate'),
      overallAcademicMean: avgMetric('academicMean'),
      overallSyllabusCoveragePct: avgMetric('syllabusCoverage'),
      overallAssignmentCompletionPct: avgMetric('assignmentCompletion'),
      pendingClassReportsCount: classReports.filter((r) => r.status === 'submitted').length,
      openInterventionsCount: interventions.filter((i) => i.status !== 'resolved').length,
      subjectTeachersCount: subjectTeachers.length,
    },
    streams: streamComparisons,
    weakSubjects,
    belowExpectationInterventions: interventions.slice(0, 20),
    recentMonitoring: monitoringRecords.slice(0, 25),
    recentClassReports: classReports.slice(0, 25),
  };
}

export function registerAcademicHierarchyRoutes(app: Express): void {
  // -------------------------------------------------------------------------
  // 1. Bootstrap (Role-Scoped Grades, Streams, Assignments, Staff Directory)
  // -------------------------------------------------------------------------
  app.get('/api/academic/bootstrap', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const db = getDb();
      const admin = isSchoolAdmin(session);
      const seniorGradeIds = getSeniorGradeIds(db, schoolId, session.userId);
      const classStreamRows = getClassTeacherStreamRows(db, schoolId, session.userId);
      const classStreamIds = classStreamRows.map((r) => r.stream_id);
      const classParentGradeIds = classStreamRows.map((r) => r.grade_id);
      const studentPlacements = getStudentOrParentPlacements(db, session, schoolId);

      // Strictly filter visible grades and streams by role
      const allGrades = db
        .prepare(`SELECT * FROM grades WHERE school_id = ? AND is_active = 1 ORDER BY COALESCE(grade_number, 99) ASC, name ASC`)
        .all(schoolId) as any[];

      const visibleGrades = allGrades.filter((g) => {
        if (admin) return true;
        if (sessionHasRole(session, 'senior_teacher') && seniorGradeIds.includes(g.id)) return true;
        if (hasClassTeacherPrivilege(session) && classParentGradeIds.includes(g.id)) return true;
        if (sessionHasAnyRole(session, ['student', 'parent'])) {
          if (studentPlacements.some((p) => p.gradeId === g.id)) return true;
        }
        return false;
      });

      const allStreams = db
        .prepare(`SELECT * FROM streams WHERE school_id = ? AND is_active = 1 ORDER BY display_name ASC`)
        .all(schoolId) as any[];

      const visibleStreams = allStreams.filter((s) => {
        if (admin) return true;
        if (sessionHasRole(session, 'senior_teacher') && seniorGradeIds.includes(s.grade_id)) return true;
        if (hasClassTeacherPrivilege(session) && classStreamIds.includes(s.id)) return true;
        if (sessionHasAnyRole(session, ['student', 'parent'])) {
          if (studentPlacements.some((p) => p.streamId === s.id)) return true;
        }
        return false;
      });

      const activeSeniorAssignments = db
        .prepare(`SELECT * FROM grade_senior_teachers WHERE school_id = ? AND is_active = 1`)
        .all(schoolId) as any[];
      const seniorMap = new Map<string, any>();
      for (const a of activeSeniorAssignments) seniorMap.set(a.grade_id, a);

      const activeClassAssignments = db
        .prepare(`SELECT * FROM stream_class_teachers WHERE school_id = ? AND is_active = 1`)
        .all(schoolId) as any[];
      const classMap = new Map<string, any>();
      for (const a of activeClassAssignments) classMap.set(a.stream_id, a);

      // Student counts per stream
      const streamCounts = db
        .prepare(
          `SELECT stream_id, COUNT(*) as cnt FROM student_stream_assignments
           WHERE school_id = ? AND is_active = 1 GROUP BY stream_id`
        )
        .all(schoolId) as Array<{ stream_id: string; cnt: number }>;
      const countMap = new Map<string, number>();
      for (const row of streamCounts) countMap.set(row.stream_id, row.cnt);

      const gradesPayload = visibleGrades.map((g) => {
        const st = seniorMap.get(g.id);
        const childStreams = visibleStreams.filter((s) => s.grade_id === g.id);
        const totalStudents = childStreams.reduce((acc, s) => acc + (countMap.get(s.id) || 0), 0);
        return {
          id: g.id,
          schoolId: g.school_id,
          name: g.name,
          gradeNumber: g.grade_number,
          levelBand: g.level_band,
          academicYear: g.academic_year,
          description: g.description,
          isActive: Boolean(g.is_active),
          seniorTeacherId: st?.teacher_id || null,
          seniorTeacherName: st?.teacher_name || null,
          seniorTeacherEmail: st?.teacher_email || null,
          seniorAssignedAt: st?.assigned_at || null,
          streamsCount: childStreams.length,
          studentsCount: totalStudents,
        };
      });

      const streamsPayload = visibleStreams.map((s) => {
        const ct = classMap.get(s.id);
        return {
          id: s.id,
          schoolId: s.school_id,
          gradeId: s.grade_id,
          name: s.name,
          displayName: s.display_name,
          capacity: s.capacity,
          roomLabel: s.room_label,
          isActive: Boolean(s.is_active),
          classTeacherId: ct?.teacher_id || null,
          classTeacherName: ct?.teacher_name || null,
          classTeacherEmail: ct?.teacher_email || null,
          classAssignedAt: ct?.assigned_at || null,
          studentsCount: countMap.get(s.id) || 0,
        };
      });

      // Eligible teaching staff for Admin & Senior Teacher dropdowns
      let staffDirectory: any[] = [];
      if (admin || sessionHasRole(session, 'senior_teacher')) {
        const staffRows = db
          .prepare(
            `SELECT id, name, email, role, staff_number, tsc_number, payload_json
             FROM users
             WHERE school_id = ? AND is_active = 1 AND role NOT IN ('student', 'parent')
             ORDER BY name ASC`
          )
          .all(schoolId) as any[];
        staffDirectory = staffRows.map((u) => {
          const p = safeParseJson<Record<string, any>>(u.payload_json, {});
          return stripSecrets({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            assignedRoles: normalizeAssignedRoles(u.role, p.assignedRoles, p.doubleAccessConfig),
            staffNumber: u.staff_number || p.staffNumber || null,
            tscNumber: u.tsc_number || p.tscNumber || null,
            department: p.department || null,
          });
        });
      }

      // Subject teacher assignments scoped by visible grades (enriched with grade & stream metadata)
      const visibleGradeIdSet = new Set(visibleGrades.map((g) => g.id));
      const subjectAssignments = (
        db
          .prepare(
            `SELECT gta.*, g.name as grade_name, g.grade_number as grade_number,
                    s.name as stream_name, s.display_name as stream_display_name
             FROM grade_teacher_assignments gta
             JOIN grades g ON g.id = gta.grade_id
             LEFT JOIN streams s ON s.id = gta.stream_id
             WHERE gta.school_id = ? AND gta.is_active = 1
             ORDER BY COALESCE(g.grade_number, 99) ASC, s.name ASC, gta.subject_name ASC`
          )
          .all(schoolId) as any[]
      ).filter((a) => visibleGradeIdSet.has(a.grade_id));

      // Unread notifications count for current user across all assigned roles
      const heldRoles = getSessionRoles(session);
      const rolePlaceholders = heldRoles.map(() => '?').join(',') || '?';
      const roleArgs = heldRoles.length > 0 ? heldRoles : [session.role];
      const unreadNotifications = db
        .prepare(
          `SELECT COUNT(*) as c FROM grade_notifications
           WHERE school_id = ? AND is_read = 0 AND (
             recipient_user_id = ? OR
             (recipient_user_id IS NULL AND recipient_role IN (${rolePlaceholders}))
           )`
        )
        .get(schoolId, session.userId, ...roleArgs) as { c: number };

      return res.json({
        success: true,
        schoolId,
        scope: {
          role: session.role,
          assignedRoles: heldRoles,
          isAdmin: admin,
          assignedGradeIds: seniorGradeIds,
          assignedStreamIds: classStreamIds,
          studentPlacements,
        },
        grades: gradesPayload,
        streams: streamsPayload,
        staffDirectory,
        subjectAssignments,
        unreadNotificationsCount: unreadNotifications.c,
        compliance: {
          gradesMissingSeniorTeacher: gradesPayload.filter((g) => !g.seniorTeacherId).map((g) => g.name),
          streamsMissingClassTeacher: streamsPayload.filter((s) => !s.classTeacherId).map((s) => s.displayName),
        },
      });
    } catch (err: any) {
      console.error('Error in GET /api/academic/bootstrap:', err);
      return res.status(500).json({ error: 'Failed loading academic hierarchy', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 2. Grade & Stream Management (Admin-only mutations)
  // -------------------------------------------------------------------------
  app.post('/api/academic/grades', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators can create grades.' });
      }
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const name = String(req.body?.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Grade name is required (e.g. Grade 7).' });

      const gradeNumber = parseGradeNumber(name, req.body?.gradeNumber ? Number(req.body.gradeNumber) : null);
      const levelBand = String(req.body?.levelBand || inferLevelBand(gradeNumber, name)).trim();
      const academicYear = String(req.body?.academicYear || '2026').trim();
      const description = String(req.body?.description || `${name} (${levelBand})`).trim();
      const initialStreams: string[] = Array.isArray(req.body?.streams)
        ? req.body.streams.map((s: any) => String(s).trim()).filter(Boolean)
        : [];

      const db = getDb();
      const duplicate = db
        .prepare(`SELECT id FROM grades WHERE school_id = ? AND lower(name) = ?`)
        .get(schoolId, name.toLowerCase());
      if (duplicate) {
        return res.status(409).json({ error: `"${name}" already exists in this school.` });
      }

      const now = nowIso();
      const gradeId = `grade-${slugToken(schoolId)}-${slugToken(name)}-${crypto.randomBytes(2).toString('hex')}`;

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `INSERT INTO grades (id, school_id, name, grade_number, level_band, academic_year, description, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(gradeId, schoolId, name, gradeNumber, levelBand, academicYear, description, now, now);

        for (const streamName of initialStreams) {
          const streamId = `stream-${slugToken(gradeId)}-${slugToken(streamName)}-${crypto.randomBytes(2).toString('hex')}`;
          const displayName = `${name} ${streamName}`.trim();
          db.prepare(
            `INSERT INTO streams (id, school_id, grade_id, name, display_name, capacity, room_label, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 45, ?, 1, ?, ?)`
          ).run(streamId, schoolId, gradeId, streamName, displayName, displayName, now, now);
        }

        mirrorGradeToLegacyCollections(db, schoolId);
        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'GRADE_CREATED',
          entityType: 'grade',
          entityId: gradeId,
          gradeId,
          details: { name, gradeNumber, levelBand, initialStreams },
        });
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      notifyMySqlTablesChanged([...ACADEMIC_HIERARCHY_TABLES, 'school_grades', 'school_streams', 'collections_store']);
      broadcastChange({
        type: 'record:created',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: gradeId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_grades_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_streams_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.status(201).json({
        success: true,
        grade: { id: gradeId, schoolId, name, gradeNumber, levelBand, academicYear, description },
        warning: 'Remember to assign one designated Senior Teacher to this active grade.',
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed creating grade', message: err?.message });
    }
  });

  app.post('/api/academic/grades/bulk-setup', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators can configure grades.' });
      }
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const startGrade = Math.max(1, Number(req.body?.startGrade || 1));
      const endGrade = Math.min(12, Number(req.body?.endGrade || 12));
      const defaultStreams: string[] = Array.isArray(req.body?.defaultStreams)
        ? req.body.defaultStreams.map((s: any) => String(s).trim()).filter(Boolean)
        : [];
      const academicYear = String(req.body?.academicYear || '2026').trim();

      const db = getDb();
      const now = nowIso();
      let createdGrades = 0;
      let createdStreams = 0;

      db.exec('BEGIN IMMEDIATE');
      try {
        for (let g = startGrade; g <= endGrade; g++) {
          const name = `Grade ${g}`;
          const existing = db
            .prepare(`SELECT id FROM grades WHERE school_id = ? AND (lower(name) = ? OR grade_number = ?) LIMIT 1`)
            .get(schoolId, name.toLowerCase(), g) as { id: string } | undefined;

          let gradeId = existing?.id;
          if (!gradeId) {
            gradeId = `grade-${slugToken(schoolId)}-grade-${g}`;
            const band = inferLevelBand(g, name);
            db.prepare(
              `INSERT INTO grades (id, school_id, name, grade_number, level_band, academic_year, description, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
            ).run(gradeId, schoolId, name, g, band, academicYear, `${name} (${band})`, now, now);
            createdGrades++;
          }

          for (const stName of defaultStreams) {
            const stExists = db
              .prepare(`SELECT id FROM streams WHERE grade_id = ? AND lower(name) = ? LIMIT 1`)
              .get(gradeId, stName.toLowerCase());
            if (!stExists) {
              const sId = `stream-${slugToken(gradeId)}-${slugToken(stName)}`;
              const displayName = `${name} ${stName}`;
              db.prepare(
                `INSERT INTO streams (id, school_id, grade_id, name, display_name, capacity, room_label, is_active, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, 45, ?, 1, ?, ?)`
              ).run(sId, schoolId, gradeId, stName, displayName, displayName, now, now);
              createdStreams++;
            }
          }
        }
        mirrorGradeToLegacyCollections(db, schoolId);
        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'GRADES_BULK_SETUP',
          entityType: 'grade',
          entityId: `range-${startGrade}-${endGrade}`,
          details: { startGrade, endGrade, createdGrades, createdStreams, defaultStreams },
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      notifyMySqlTablesChanged([...ACADEMIC_HIERARCHY_TABLES, 'school_grades', 'school_streams', 'collections_store']);
      broadcastChange({
        type: 'record:updated',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_grades_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_streams_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({ success: true, createdGrades, createdStreams });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed setting up grades', message: err?.message });
    }
  });

  app.put('/api/academic/grades/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators or Super Admins can update grades.' });
      }
      const schoolId = resolveAuthorizedTenantId(req, res, (req.body?.schoolId || req.query.schoolId || req.query.tenantId) as string);
      if (!schoolId) return;

      const gradeId = String(req.params.id);
      const db = getDb();
      const existing = db
        .prepare(`SELECT * FROM grades WHERE id = ? AND school_id = ?`)
        .get(gradeId, schoolId) as any;
      if (!existing) return res.status(404).json({ error: 'Grade not found.' });

      const name = String(req.body?.name || existing.name).trim();
      if (!name) return res.status(400).json({ error: 'Grade name cannot be empty.' });

      const duplicate = db
        .prepare(`SELECT id FROM grades WHERE school_id = ? AND lower(name) = ? AND id != ?`)
        .get(schoolId, name.toLowerCase(), gradeId);
      if (duplicate) {
        return res.status(409).json({ error: `Another grade named "${name}" already exists in this school.` });
      }

      const explicitGradeNum =
        req.body?.gradeNumber !== undefined && req.body?.gradeNumber !== null && req.body?.gradeNumber !== ''
          ? Number(req.body.gradeNumber)
          : name !== existing.name
            ? null
            : existing.grade_number;
      const gradeNumber = parseGradeNumber(name, explicitGradeNum);
      const levelBand = String(req.body?.levelBand || existing.level_band).trim();
      const academicYear = String(req.body?.academicYear || existing.academic_year).trim();
      const description = req.body?.description !== undefined ? String(req.body.description) : existing.description;
      const isActive = req.body?.isActive !== undefined ? (req.body.isActive ? 1 : 0) : existing.is_active;
      const now = nowIso();

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `UPDATE grades SET name = ?, grade_number = ?, level_band = ?, academic_year = ?, description = ?, is_active = ?, updated_at = ?
           WHERE id = ? AND school_id = ?`
        ).run(name, gradeNumber, levelBand, academicYear, description, isActive, now, gradeId, schoolId);

        if (name !== existing.name) {
          const childStreams = db
            .prepare(`SELECT id, name, display_name, room_label FROM streams WHERE grade_id = ? AND school_id = ?`)
            .all(gradeId, schoolId) as Array<{ id: string; name: string; display_name: string; room_label: string | null }>;
          for (const st of childStreams) {
            const nextDisplay = `${name} ${st.name}`.trim();
            const nextRoom = !st.room_label || st.room_label === st.display_name ? nextDisplay : st.room_label;
            db.prepare(`UPDATE streams SET display_name = ?, room_label = ?, updated_at = ? WHERE id = ?`).run(
              nextDisplay,
              nextRoom,
              now,
              st.id
            );
          }
        }

        mirrorGradeToLegacyCollections(db, schoolId);
        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'GRADE_UPDATED',
          entityType: 'grade',
          entityId: gradeId,
          gradeId,
          details: { previousName: existing.name, name, gradeNumber, levelBand, academicYear, isActive },
        });
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      notifyMySqlTablesChanged([...ACADEMIC_HIERARCHY_TABLES, 'school_grades', 'school_streams', 'collections_store']);
      broadcastChange({
        type: 'record:updated',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: gradeId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_grades_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_streams_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      return res.json({
        success: true,
        grade: { id: gradeId, schoolId, name, gradeNumber, levelBand, academicYear, description, isActive: Boolean(isActive) },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed updating grade', message: err?.message });
    }
  });

  app.delete('/api/academic/grades/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators or Super Admins can remove grades.' });
      }
      const schoolId = resolveAuthorizedTenantId(
        req,
        res,
        (req.query.schoolId || req.query.tenantId || req.body?.schoolId) as string
      );
      if (!schoolId) return;

      const gradeId = String(req.params.id);
      const force = req.query.force === 'true' || Boolean(req.body?.force);
      const db = getDb();
      const existing = db
        .prepare(`SELECT * FROM grades WHERE id = ? AND school_id = ?`)
        .get(gradeId, schoolId) as any;
      if (!existing) return res.status(404).json({ error: 'Grade not found.' });

      const activeStudents = db
        .prepare(
          `SELECT COUNT(*) as c FROM student_stream_assignments
           WHERE school_id = ? AND grade_id = ? AND is_active = 1`
        )
        .get(schoolId, gradeId) as { c: number };
      const childStreams = db
        .prepare(`SELECT id, name FROM streams WHERE school_id = ? AND grade_id = ?`)
        .all(schoolId, gradeId) as Array<{ id: string; name: string }>;

      if (activeStudents.c > 0 && !force) {
        return res.status(409).json({
          error: `"${existing.name}" has ${activeStudents.c} active enrolled student(s) across ${childStreams.length} stream(s). Confirm removal to unassign them and remove the grade.`,
          requiresForce: true,
          activeStudentsCount: activeStudents.c,
          streamsCount: childStreams.length,
        });
      }

      const now = nowIso();
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`UPDATE students SET grade_id = NULL, stream_id = NULL WHERE school_id = ? AND grade_id = ?`).run(
          schoolId,
          gradeId
        );
        for (const st of childStreams) {
          db.prepare(`DELETE FROM school_streams WHERE id = ? AND school_id = ?`).run(st.id, schoolId);
        }
        db.prepare(`DELETE FROM school_streams WHERE grade_id = ? AND school_id = ?`).run(gradeId, schoolId);
        db.prepare(`DELETE FROM school_grades WHERE id = ? AND school_id = ?`).run(gradeId, schoolId);
        db.prepare(`DELETE FROM grades WHERE id = ? AND school_id = ?`).run(gradeId, schoolId);

        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'GRADE_REMOVED',
          entityType: 'grade',
          entityId: gradeId,
          details: {
            removedGradeName: existing.name,
            removedStreamsCount: childStreams.length,
            unassignedStudentsCount: activeStudents.c,
            force,
          },
        });
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      notifyMySqlTablesChanged([...ACADEMIC_HIERARCHY_TABLES, 'school_grades', 'school_streams', 'students', 'collections_store']);
      broadcastChange({
        type: 'record:deleted',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: gradeId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_grades_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_streams_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({
        success: true,
        removedGradeId: gradeId,
        removedGradeName: existing.name,
        removedStreamsCount: childStreams.length,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed removing grade', message: err?.message });
    }
  });

  app.post('/api/academic/streams', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators can create streams.' });
      }
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const gradeId = String(req.body?.gradeId || '').trim();
      const name = String(req.body?.name || '').trim();
      if (!gradeId || !name) {
        return res.status(400).json({ error: 'gradeId and stream name are required.' });
      }

      const db = getDb();
      const grade = db
        .prepare(`SELECT id, name FROM grades WHERE id = ? AND school_id = ?`)
        .get(gradeId, schoolId) as { id: string; name: string } | undefined;
      if (!grade) return res.status(404).json({ error: 'Parent grade not found.' });

      const duplicate = db
        .prepare(`SELECT id FROM streams WHERE grade_id = ? AND lower(name) = ?`)
        .get(gradeId, name.toLowerCase());
      if (duplicate) {
        return res.status(409).json({ error: `Stream "${name}" already exists under ${grade.name}.` });
      }

      const displayName = String(req.body?.displayName || `${grade.name} ${name}`).trim();
      const capacity = Math.max(10, Number(req.body?.capacity || 45));
      const roomLabel = String(req.body?.roomLabel || displayName).trim();
      const now = nowIso();
      const streamId = `stream-${slugToken(gradeId)}-${slugToken(name)}-${crypto.randomBytes(2).toString('hex')}`;

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `INSERT INTO streams (id, school_id, grade_id, name, display_name, capacity, room_label, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(streamId, schoolId, gradeId, name, displayName, capacity, roomLabel, now, now);

        mirrorGradeToLegacyCollections(db, schoolId);
        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'STREAM_CREATED',
          entityType: 'stream',
          entityId: streamId,
          gradeId,
          streamId,
          details: { name, displayName, capacity },
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      notifyMySqlTablesChanged([...ACADEMIC_HIERARCHY_TABLES, 'school_streams', 'collections_store']);
      broadcastChange({
        type: 'record:created',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: streamId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_streams_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.status(201).json({
        success: true,
        stream: { id: streamId, schoolId, gradeId, name, displayName, capacity, roomLabel },
        warning: 'Remember to assign one designated Class Teacher to this active stream.',
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed creating stream', message: err?.message });
    }
  });

  app.put('/api/academic/streams/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators or Super Admins can update streams.' });
      }
      const schoolId = resolveAuthorizedTenantId(
        req,
        res,
        (req.body?.schoolId || req.query.schoolId || req.query.tenantId) as string
      );
      if (!schoolId) return;

      const streamId = String(req.params.id);
      const db = getDb();
      const existing = db
        .prepare(`SELECT * FROM streams WHERE id = ? AND school_id = ?`)
        .get(streamId, schoolId) as any;
      if (!existing) return res.status(404).json({ error: 'Stream not found.' });

      const targetGradeId = String(req.body?.gradeId || existing.grade_id).trim();
      const grade = db
        .prepare(`SELECT id, name FROM grades WHERE id = ? AND school_id = ?`)
        .get(targetGradeId, schoolId) as { id: string; name: string } | undefined;
      if (!grade) return res.status(404).json({ error: 'Target parent grade not found in this school.' });

      const name = String(req.body?.name || existing.name).trim();
      if (!name) return res.status(400).json({ error: 'Stream name cannot be empty.' });

      const duplicate = db
        .prepare(`SELECT id FROM streams WHERE grade_id = ? AND lower(name) = ? AND id != ?`)
        .get(targetGradeId, name.toLowerCase(), streamId);
      if (duplicate) {
        return res.status(409).json({ error: `Stream "${name}" already exists under ${grade.name}.` });
      }

      const displayName = String(req.body?.displayName || `${grade.name} ${name}`).trim();
      const capacity = req.body?.capacity !== undefined ? Math.max(10, Number(req.body.capacity)) : existing.capacity;
      const roomLabel = String(
        req.body?.roomLabel !== undefined
          ? req.body.roomLabel
          : !existing.room_label || existing.room_label === existing.display_name
            ? displayName
            : existing.room_label
      ).trim();
      const isActive = req.body?.isActive !== undefined ? (req.body.isActive ? 1 : 0) : existing.is_active;
      const now = nowIso();

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `UPDATE streams SET grade_id = ?, name = ?, display_name = ?, capacity = ?, room_label = ?, is_active = ?, updated_at = ?
           WHERE id = ? AND school_id = ?`
        ).run(targetGradeId, name, displayName, capacity, roomLabel, isActive, now, streamId, schoolId);

        if (targetGradeId !== existing.grade_id) {
          db.prepare(`UPDATE stream_class_teachers SET grade_id = ?, updated_at = ? WHERE stream_id = ? AND school_id = ?`).run(
            targetGradeId,
            now,
            streamId,
            schoolId
          );
          db.prepare(`UPDATE student_stream_assignments SET grade_id = ?, updated_at = ? WHERE stream_id = ? AND school_id = ?`).run(
            targetGradeId,
            now,
            streamId,
            schoolId
          );
          db.prepare(`UPDATE students SET grade_id = ? WHERE stream_id = ? AND school_id = ?`).run(
            targetGradeId,
            streamId,
            schoolId
          );
        }

        mirrorGradeToLegacyCollections(db, schoolId);
        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'STREAM_UPDATED',
          entityType: 'stream',
          entityId: streamId,
          gradeId: targetGradeId,
          streamId,
          details: { previousName: existing.name, name, gradeId: targetGradeId, displayName, capacity, roomLabel },
        });
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      notifyMySqlTablesChanged([
        ...ACADEMIC_HIERARCHY_TABLES,
        'school_streams',
        'students',
        'collections_store',
      ]);
      broadcastChange({
        type: 'record:updated',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: streamId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_streams_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      return res.json({
        success: true,
        stream: { id: streamId, schoolId, gradeId: targetGradeId, name, displayName, capacity, roomLabel, isActive: Boolean(isActive) },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed updating stream', message: err?.message });
    }
  });

  app.delete('/api/academic/streams/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators or Super Admins can remove streams.' });
      }
      const schoolId = resolveAuthorizedTenantId(
        req,
        res,
        (req.query.schoolId || req.query.tenantId || req.body?.schoolId) as string
      );
      if (!schoolId) return;

      const streamId = String(req.params.id);
      const force = req.query.force === 'true' || Boolean(req.body?.force);
      const db = getDb();
      const existing = db
        .prepare(`SELECT * FROM streams WHERE id = ? AND school_id = ?`)
        .get(streamId, schoolId) as any;
      if (!existing) return res.status(404).json({ error: 'Stream not found.' });

      const activeStudents = db
        .prepare(
          `SELECT COUNT(*) as c FROM student_stream_assignments
           WHERE school_id = ? AND stream_id = ? AND is_active = 1`
        )
        .get(schoolId, streamId) as { c: number };

      if (activeStudents.c > 0 && !force) {
        return res.status(409).json({
          error: `"${existing.display_name}" currently has ${activeStudents.c} active enrolled student(s). Transfer them or confirm removal to unassign them and delete the stream.`,
          requiresForce: true,
          activeStudentsCount: activeStudents.c,
        });
      }

      const now = nowIso();
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`UPDATE students SET stream_id = NULL WHERE school_id = ? AND stream_id = ?`).run(
          schoolId,
          streamId
        );
        db.prepare(`DELETE FROM school_streams WHERE id = ? AND school_id = ?`).run(streamId, schoolId);
        db.prepare(`DELETE FROM streams WHERE id = ? AND school_id = ?`).run(streamId, schoolId);

        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'STREAM_REMOVED',
          entityType: 'stream',
          entityId: streamId,
          gradeId: existing.grade_id,
          details: {
            removedDisplayName: existing.display_name,
            unassignedStudentsCount: activeStudents.c,
            force,
          },
        });
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      notifyMySqlTablesChanged([...ACADEMIC_HIERARCHY_TABLES, 'school_streams', 'students', 'collections_store']);
      broadcastChange({
        type: 'record:deleted',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: streamId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_school_streams_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({
        success: true,
        removedStreamId: streamId,
        removedDisplayName: existing.display_name,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed removing stream', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 3. Senior Teacher & Class Teacher Assignments (Preserving History)
  // -------------------------------------------------------------------------
  app.post('/api/academic/grades/:gradeId/assign-senior-teacher', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators can assign Senior Teachers.' });
      }
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const gradeId = String(req.params.gradeId);
      const teacherId = String(req.body?.teacherId || '').trim();
      const notes = String(req.body?.notes || '').trim();
      const academicYear = String(req.body?.academicYear || '2026').trim();
      if (!teacherId) return res.status(400).json({ error: 'teacherId is required.' });

      const db = getDb();
      const grade = db
        .prepare(`SELECT id, name, grade_number FROM grades WHERE id = ? AND school_id = ?`)
        .get(gradeId, schoolId) as { id: string; name: string; grade_number: number | null } | undefined;
      if (!grade) return res.status(404).json({ error: 'Grade not found in this school.' });

      const teacher = db
        .prepare(`SELECT id, name, email, role FROM users WHERE id = ? AND school_id = ?`)
        .get(teacherId, schoolId) as { id: string; name: string; email: string; role: string } | undefined;
      if (!teacher) return res.status(404).json({ error: 'Selected teacher account not found in this school.' });

      const now = nowIso();
      const assignmentId = `gst-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      db.exec('BEGIN IMMEDIATE');
      try {
        // Deactivate any previous active Senior Teacher for this grade while preserving history
        db.prepare(
          `UPDATE grade_senior_teachers
           SET is_active = 0, unassigned_at = ?, updated_at = ?
           WHERE school_id = ? AND grade_id = ? AND is_active = 1`
        ).run(now, now, schoolId, gradeId);

        db.prepare(
          `INSERT INTO grade_senior_teachers
            (id, school_id, grade_id, teacher_id, teacher_name, teacher_email, academic_year, assigned_by, assigned_at, is_active, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
        ).run(
          assignmentId,
          schoolId,
          gradeId,
          teacher.id,
          teacher.name,
          teacher.email,
          academicYear,
          session.userId,
          now,
          notes || `Designated Senior Teacher for ${grade.name}`,
          now,
          now
        );

        // Keep user profile grade metadata aligned without changing role permissions unexpectedly
        updateUserPayloadMetadata(db, schoolId, teacher.id, {
          assignedGradeId: grade.id,
          assignedGradeName: grade.name,
          ...(grade.grade_number ? { grade: grade.grade_number } : {}),
        });

        createNotification(db, {
          schoolId,
          gradeId,
          recipientUserId: teacher.id,
          recipientRole: teacher.role,
          category: 'assignment',
          severity: 'info',
          title: `Assigned as Senior Teacher: ${grade.name}`,
          message: `You have been designated by School Administration to coordinate ${grade.name} (${academicYear}).`,
          actionUrlTab: 'my_grade',
          relatedEntityId: assignmentId,
        });

        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'SENIOR_TEACHER_ASSIGNED',
          entityType: 'grade_senior_teachers',
          entityId: assignmentId,
          gradeId,
          details: { teacherId: teacher.id, teacherName: teacher.name, gradeName: grade.name },
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      notifyMySqlTablesChanged([...ACADEMIC_HIERARCHY_TABLES, 'users', 'collections_store']);
      broadcastChange({
        type: 'record:updated',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: gradeId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({
        success: true,
        assignment: {
          id: assignmentId,
          gradeId,
          gradeName: grade.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          teacherEmail: teacher.email,
          assignedAt: now,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed assigning Senior Teacher', message: err?.message });
    }
  });

  app.post('/api/academic/streams/:streamId/assign-class-teacher', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators can assign Class Teachers.' });
      }
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const streamId = String(req.params.streamId);
      const teacherId = String(req.body?.teacherId || '').trim();
      const notes = String(req.body?.notes || '').trim();
      const academicYear = String(req.body?.academicYear || '2026').trim();
      if (!teacherId) return res.status(400).json({ error: 'teacherId is required.' });

      const db = getDb();
      const stream = db
        .prepare(
          `SELECT s.id, s.grade_id, s.name, s.display_name, g.name as grade_name, g.grade_number
           FROM streams s JOIN grades g ON g.id = s.grade_id
           WHERE s.id = ? AND s.school_id = ?`
        )
        .get(streamId, schoolId) as any;
      if (!stream) return res.status(404).json({ error: 'Stream not found in this school.' });

      const teacher = db
        .prepare(`SELECT id, name, email, role, payload_json FROM users WHERE id = ? AND school_id = ?`)
        .get(teacherId, schoolId) as { id: string; name: string; email: string; role: string; payload_json?: string } | undefined;
      if (!teacher) return res.status(404).json({ error: 'Selected teacher account not found in this school.' });

      const teacherExtra = safeParseJson<Record<string, any>>(teacher.payload_json, {});
      const updatedAssignedRoles = normalizeAssignedRoles(
        teacher.role,
        [...(Array.isArray(teacherExtra.assignedRoles) ? teacherExtra.assignedRoles : []), 'class_teacher'],
        teacherExtra.doubleAccessConfig
      );

      const now = nowIso();
      const assignmentId = `sct-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `UPDATE stream_class_teachers
           SET is_active = 0, unassigned_at = ?, updated_at = ?
           WHERE school_id = ? AND stream_id = ? AND is_active = 1`
        ).run(now, now, schoolId, streamId);

        db.prepare(
          `INSERT INTO stream_class_teachers
            (id, school_id, grade_id, stream_id, teacher_id, teacher_name, teacher_email, academic_year, assigned_by, assigned_at, is_active, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
        ).run(
          assignmentId,
          schoolId,
          stream.grade_id,
          streamId,
          teacher.id,
          teacher.name,
          teacher.email,
          academicYear,
          session.userId,
          now,
          notes || `Designated Class Teacher for ${stream.display_name}`,
          now,
          now
        );

        updateUserPayloadMetadata(db, schoolId, teacher.id, {
          assignedRoles: updatedAssignedRoles,
          assignedGradeId: stream.grade_id,
          assignedStreamId: streamId,
          stream: stream.name,
          ...(stream.grade_number ? { grade: stream.grade_number } : {}),
        });

        createNotification(db, {
          schoolId,
          gradeId: stream.grade_id,
          streamId,
          recipientUserId: teacher.id,
          recipientRole: teacher.role,
          category: 'assignment',
          severity: 'info',
          title: `Assigned as Class Teacher: ${stream.display_name}`,
          message: `You have been designated Class Teacher for ${stream.display_name} (${academicYear}).`,
          actionUrlTab: 'my_class',
          relatedEntityId: assignmentId,
        });

        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'CLASS_TEACHER_ASSIGNED',
          entityType: 'stream_class_teachers',
          entityId: assignmentId,
          gradeId: stream.grade_id,
          streamId,
          details: { teacherId: teacher.id, teacherName: teacher.name, streamName: stream.display_name },
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      notifyMySqlTablesChanged([...ACADEMIC_HIERARCHY_TABLES, 'users', 'collections_store']);
      broadcastChange({
        type: 'record:updated',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: streamId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({
        success: true,
        assignment: {
          id: assignmentId,
          gradeId: stream.grade_id,
          streamId,
          streamDisplayName: stream.display_name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          teacherEmail: teacher.email,
          assignedAt: now,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed assigning Class Teacher', message: err?.message });
    }
  });

  app.get('/api/academic/grades/:gradeId/assignment-history', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const gradeId = String(req.params.gradeId);
      const db = getDb();
      if (!assertGradeScope(db, session, schoolId, gradeId, res, true)) return;

      const seniorHistory = db
        .prepare(
          `SELECT * FROM grade_senior_teachers
           WHERE school_id = ? AND grade_id = ?
           ORDER BY is_active DESC, assigned_at DESC`
        )
        .all(schoolId, gradeId);

      const classTeacherHistory = db
        .prepare(
          `SELECT sct.*, s.display_name as stream_display_name
           FROM stream_class_teachers sct
           JOIN streams s ON s.id = sct.stream_id
           WHERE sct.school_id = ? AND sct.grade_id = ?
           ORDER BY sct.is_active DESC, sct.assigned_at DESC`
        )
        .all(schoolId, gradeId);

      return res.json({ success: true, seniorHistory, classTeacherHistory });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading assignment history', message: err?.message });
    }
  });

  const syncTeacherPayloadFromAssignments = (
    db: DatabaseSync,
    schoolId: string,
    teacherId: string,
    extraPatch?: Record<string, any>
  ) => {
    const rows = db
      .prepare(
        `SELECT gta.id, gta.grade_id, gta.stream_id, gta.subject_name, gta.periods_per_week,
                g.name as grade_name, g.grade_number,
                s.name as stream_name
         FROM grade_teacher_assignments gta
         JOIN grades g ON g.id = gta.grade_id
         JOIN streams s ON s.id = gta.stream_id
         WHERE gta.school_id = ? AND gta.teacher_id = ? AND gta.is_active = 1 AND gta.stream_id IS NOT NULL
         ORDER BY COALESCE(g.grade_number, 99) ASC, s.name ASC, gta.subject_name ASC`
      )
      .all(schoolId, teacherId) as any[];

    const allocations = rows.map((r) => ({
      id: r.id,
      grade: (r.grade_number || parseGradeNumber(r.grade_name) || 1) as number,
      stream: String(r.stream_name),
      subject: String(r.subject_name),
      gradeId: String(r.grade_id),
      streamId: String(r.stream_id),
      periodsPerWeek: Number(r.periods_per_week || 4),
    }));

    const uniqueSubjects = Array.from(new Set(allocations.map((a) => a.subject)));
    const streamSeen = new Set<string>();
    const uniqueStreams: Array<{ grade: number; stream: string }> = [];
    for (const a of allocations) {
      const k = `${a.grade}::${a.stream.toLowerCase()}`;
      if (!streamSeen.has(k)) {
        streamSeen.add(k);
        uniqueStreams.push({ grade: a.grade, stream: a.stream });
      }
    }

    updateUserPayloadMetadata(db, schoolId, teacherId, {
      ...(extraPatch || {}),
      assignedSubjectAllocations: allocations,
      assignedSubjects: uniqueSubjects,
      assignedStreams: uniqueStreams,
    });
  };

  const syncStreamSubjectToTimetable = (
    db: DatabaseSync,
    schoolId: string,
    gradeNumber: number | null,
    streamName: string,
    subjectName: string,
    userId: string | null,
    expectedOldUserId?: string | null
  ) => {
    if (!gradeNumber || !streamName || !subjectName) return;
    const cfg = db
      .prepare(`SELECT id FROM tt_configs WHERE tenant_id = ? ORDER BY updated_at DESC LIMIT 1`)
      .get(schoolId) as { id: string } | undefined;
    if (!cfg) return;

    let targetTtTeacherId: string | null = null;
    if (userId) {
      const ttT = db
        .prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? AND user_id = ? LIMIT 1`)
        .get(schoolId, userId) as { id: string } | undefined;
      targetTtTeacherId = ttT?.id || null;
    }

    const now = nowIso();
    if (userId && targetTtTeacherId) {
      db.prepare(
        `UPDATE tt_stream_subject_allocations
         SET teacher_ids_json = ?, is_overridden = 1, updated_at = ?
         WHERE config_id = ? AND tenant_id = ? AND grade = ? AND lower(stream) = lower(?) AND lower(subject_name) = lower(?)`
      ).run(JSON.stringify([targetTtTeacherId]), now, cfg.id, schoolId, gradeNumber, streamName, subjectName);
    } else if (!userId && expectedOldUserId) {
      const oldTt = db
        .prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? AND user_id = ? LIMIT 1`)
        .get(schoolId, expectedOldUserId) as { id: string } | undefined;
      if (oldTt) {
        db.prepare(
          `UPDATE tt_stream_subject_allocations
           SET teacher_ids_json = '[]', updated_at = ?
           WHERE config_id = ? AND tenant_id = ? AND grade = ? AND lower(stream) = lower(?) AND lower(subject_name) = lower(?)
             AND teacher_ids_json = ?`
        ).run(now, cfg.id, schoolId, gradeNumber, streamName, subjectName, JSON.stringify([oldTt.id]));
      }
    }
  };

  // Subject Teacher Assignments per Grade + Specific Stream (Strict 1 Teacher per Subject per Stream)
  app.get('/api/academic/teacher-assignments', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, (req.query.schoolId || req.query.tenantId) as string);
      if (!schoolId) return;

      const db = getDb();
      const gradeId = req.query.gradeId ? String(req.query.gradeId).trim() : null;
      const streamId = req.query.streamId ? String(req.query.streamId).trim() : null;
      const teacherId = req.query.teacherId ? String(req.query.teacherId).trim() : null;
      const subjectName = req.query.subjectName ? String(req.query.subjectName).trim() : null;

      let sql = `
        SELECT gta.*, g.name as grade_name, g.grade_number as grade_number,
               s.name as stream_name, s.display_name as stream_display_name
        FROM grade_teacher_assignments gta
        JOIN grades g ON g.id = gta.grade_id
        LEFT JOIN streams s ON s.id = gta.stream_id
        WHERE gta.school_id = ? AND gta.is_active = 1
      `;
      const args: any[] = [schoolId];

      if (sessionHasRole(session, 'senior_teacher') && !isSchoolAdmin(session)) {
        const allowedGrades = getSeniorGradeIds(db, schoolId, session.userId);
        if (allowedGrades.length === 0) {
          return res.json({ success: true, assignments: [] });
        }
        sql += ` AND gta.grade_id IN (${allowedGrades.map(() => '?').join(',')})`;
        args.push(...allowedGrades);
      }
      if (gradeId) {
        sql += ` AND gta.grade_id = ?`;
        args.push(gradeId);
      }
      if (streamId) {
        sql += ` AND gta.stream_id = ?`;
        args.push(streamId);
      }
      if (teacherId) {
        sql += ` AND gta.teacher_id = ?`;
        args.push(teacherId);
      }
      if (subjectName) {
        sql += ` AND lower(gta.subject_name) = lower(?)`;
        args.push(subjectName);
      }

      sql += ` ORDER BY COALESCE(g.grade_number, 99) ASC, s.name ASC, gta.subject_name ASC`;
      const assignments = db.prepare(sql).all(...args);
      return res.json({ success: true, assignments });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading subject assignments', message: err?.message });
    }
  });

  app.post('/api/academic/teacher-assignments', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const gradeId = String(req.body?.gradeId || '').trim();
      const streamId = String(req.body?.streamId || '').trim();
      const teacherId = String(req.body?.teacherId || '').trim();
      const subjectName = String(req.body?.subjectName || '').trim();
      const periodsPerWeek = Math.max(1, Number(req.body?.periodsPerWeek || 4));
      const replaceExisting = Boolean(req.body?.replaceExisting);

      if (!gradeId || !streamId || !teacherId || !subjectName) {
        return res.status(400).json({
          error: 'gradeId, specific streamId, teacherId, and subjectName are all required when assigning a subject lesson.',
        });
      }

      const db = getDb();
      if (!assertGradeScope(db, session, schoolId, gradeId, res, true)) return;

      const gradeRow = db
        .prepare(`SELECT id, name, grade_number FROM grades WHERE id = ? AND school_id = ?`)
        .get(gradeId, schoolId) as { id: string; name: string; grade_number: number | null } | undefined;
      if (!gradeRow) return res.status(404).json({ error: 'Grade not found in this school.' });

      const streamRow = db
        .prepare(`SELECT id, grade_id, name, display_name FROM streams WHERE id = ? AND school_id = ?`)
        .get(streamId, schoolId) as { id: string; grade_id: string; name: string; display_name: string } | undefined;
      if (!streamRow || streamRow.grade_id !== gradeId) {
        return res.status(400).json({ error: 'Selected stream does not belong to the chosen grade in this school.' });
      }

      const teacher = db
        .prepare(`SELECT id, name FROM users WHERE id = ? AND school_id = ?`)
        .get(teacherId, schoolId) as { id: string; name: string } | undefined;
      if (!teacher) return res.status(404).json({ error: 'Teacher not found in this school.' });

      const existing = db
        .prepare(
          `SELECT id, teacher_id, teacher_name FROM grade_teacher_assignments
           WHERE school_id = ? AND grade_id = ? AND stream_id = ? AND lower(subject_name) = lower(?) AND is_active = 1
           LIMIT 1`
        )
        .get(schoolId, gradeId, streamId, subjectName) as { id: string; teacher_id: string; teacher_name: string } | undefined;

      if (existing && existing.teacher_id !== teacher.id && !replaceExisting) {
        return res.status(409).json({
          error: `${subjectName} in ${streamRow.display_name} is already assigned to ${existing.teacher_name}. No subject in any stream can have more than one teacher.`,
          conflict: {
            assignmentId: existing.id,
            currentTeacherId: existing.teacher_id,
            currentTeacherName: existing.teacher_name,
            subjectName,
            streamDisplayName: streamRow.display_name,
          },
        });
      }

      const now = nowIso();
      let assignmentId = existing?.id || `gta-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const displacedTeacherId = existing && existing.teacher_id !== teacher.id ? existing.teacher_id : null;

      db.exec('BEGIN IMMEDIATE');
      try {
        if (existing && existing.teacher_id === teacher.id) {
          db.prepare(
            `UPDATE grade_teacher_assignments
             SET subject_name = ?, teacher_name = ?, periods_per_week = ?, updated_at = ?
             WHERE id = ? AND school_id = ?`
          ).run(subjectName, teacher.name, periodsPerWeek, now, existing.id, schoolId);
        } else {
          if (existing) {
            db.prepare(
              `UPDATE grade_teacher_assignments
               SET is_active = 0, unassigned_at = ?, updated_at = ?
               WHERE id = ? AND school_id = ?`
            ).run(now, now, existing.id, schoolId);
            assignmentId = `gta-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
          }
          db.prepare(
            `INSERT INTO grade_teacher_assignments
              (id, school_id, grade_id, stream_id, teacher_id, teacher_name, subject_name, academic_year, periods_per_week, is_active, assigned_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, '2026', ?, 1, ?, ?, ?)`
          ).run(assignmentId, schoolId, gradeId, streamId, teacher.id, teacher.name, subjectName, periodsPerWeek, now, now, now);
        }

        const gradeNum = gradeRow.grade_number ?? parseGradeNumber(gradeRow.name);
        syncStreamSubjectToTimetable(db, schoolId, gradeNum, streamRow.name, subjectName, teacher.id);
        syncTeacherPayloadFromAssignments(db, schoolId, teacher.id);
        if (displacedTeacherId) {
          syncTeacherPayloadFromAssignments(db, schoolId, displacedTeacherId);
        }

        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: displacedTeacherId ? 'SUBJECT_TEACHER_REASSIGNED' : 'SUBJECT_TEACHER_ASSIGNED',
          entityType: 'grade_teacher_assignment',
          entityId: assignmentId,
          gradeId,
          streamId,
          details: { subjectName, teacherId: teacher.id, teacherName: teacher.name, displacedTeacherId },
        });
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      notifyMySqlTablesChanged(['grade_teacher_assignments', 'users', 'collections_store', 'tt_stream_subject_allocations', 'academic_audit_logs']);
      broadcastChange({
        type: 'record:updated',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_users_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.status(201).json({ success: true, id: assignmentId });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed creating subject assignment', message: err?.message });
    }
  });

  // Atomically synchronize all Grade + Specific Stream + Subject assignments for a single teacher
  app.put('/api/academic/teacher-assignments/sync-teacher', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session) && !sessionHasRole(session, 'senior_teacher')) {
        return res.status(403).json({ error: 'Only Academic Leadership or School Administrators can assign teacher lessons.' });
      }
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const teacherId = String(req.body?.teacherId || '').trim();
      const rawAllocations = Array.isArray(req.body?.allocations) ? req.body.allocations : null;
      const replaceExisting = Boolean(req.body?.replaceExisting);
      const department = req.body?.department !== undefined ? String(req.body.department).trim() : undefined;

      if (!teacherId || !rawAllocations) {
        return res.status(400).json({ error: 'teacherId and allocations array are required.' });
      }

      const db = getDb();
      const teacher = db
        .prepare(`SELECT id, name FROM users WHERE id = ? AND school_id = ?`)
        .get(teacherId, schoolId) as { id: string; name: string } | undefined;
      if (!teacher) return res.status(404).json({ error: 'Teacher not found in this school.' });

      const schoolGrades = db
        .prepare(`SELECT id, name, grade_number FROM grades WHERE school_id = ? AND is_active = 1`)
        .all(schoolId) as Array<{ id: string; name: string; grade_number: number | null }>;
      const schoolStreams = db
        .prepare(`SELECT id, grade_id, name, display_name FROM streams WHERE school_id = ? AND is_active = 1`)
        .all(schoolId) as Array<{ id: string; grade_id: string; name: string; display_name: string }>;

      const seniorAllowedGrades =
        sessionHasRole(session, 'senior_teacher') && !isSchoolAdmin(session)
          ? new Set(getSeniorGradeIds(db, schoolId, session.userId))
          : null;

      const resolvedMap = new Map<
        string,
        {
          gradeId: string;
          gradeNumber: number | null;
          gradeName: string;
          streamId: string;
          streamName: string;
          streamDisplayName: string;
          subjectName: string;
          periodsPerWeek: number;
        }
      >();

      const now = nowIso();
      for (const item of rawAllocations) {
        const subjectName = String(item?.subjectName || item?.subject || '').trim();
        if (!subjectName) {
          return res.status(400).json({ error: 'Each lesson assignment must specify a subject.' });
        }

        // Resolve Grade
        let gradeRow = item?.gradeId
          ? schoolGrades.find((g) => g.id === String(item.gradeId).trim())
          : undefined;
        if (!gradeRow && item?.grade !== undefined && item?.grade !== null && item?.grade !== '') {
          const gNum = Number(item.grade);
          gradeRow = schoolGrades.find(
            (g) => g.grade_number === gNum || g.name.toLowerCase() === `grade ${gNum}` || g.name.toLowerCase() === String(item.grade).trim().toLowerCase()
          );
          if (!gradeRow && Number.isFinite(gNum) && gNum >= 1 && gNum <= 12) {
            const gName = `Grade ${gNum}`;
            const newGradeId = `grade-${slugToken(schoolId)}-${slugToken(gName)}`;
            const band = inferLevelBand(gNum, gName);
            db.prepare(
              `INSERT OR IGNORE INTO grades (id, school_id, name, grade_number, level_band, academic_year, description, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, '2026', ?, 1, ?, ?)`
            ).run(newGradeId, schoolId, gName, gNum, band, `${gName} (${band})`, now, now);
            gradeRow = { id: newGradeId, name: gName, grade_number: gNum };
            schoolGrades.push(gradeRow);
          }
        }
        if (!gradeRow) {
          return res.status(400).json({ error: `Valid grade is required for ${subjectName}.` });
        }

        if (seniorAllowedGrades && !seniorAllowedGrades.has(gradeRow.id)) {
          return res.status(403).json({
            error: `Access denied. You cannot modify subject assignments for ${gradeRow.name}.`,
          });
        }

        // Resolve Specific Stream
        let streamRow = item?.streamId
          ? schoolStreams.find((s) => s.id === String(item.streamId).trim() && s.grade_id === gradeRow!.id)
          : undefined;
        if (!streamRow && item?.stream) {
          const stClean = String(item.stream).trim();
          streamRow = schoolStreams.find(
            (s) => s.grade_id === gradeRow!.id && s.name.toLowerCase() === stClean.toLowerCase()
          );
          if (!streamRow && stClean) {
            const newStreamId = `stream-${slugToken(gradeRow.id)}-${slugToken(stClean)}`;
            const disp = `${gradeRow.name} ${stClean}`;
            db.prepare(
              `INSERT OR IGNORE INTO streams (id, school_id, grade_id, name, display_name, capacity, room_label, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 45, ?, 1, ?, ?)`
            ).run(newStreamId, schoolId, gradeRow.id, stClean, disp, disp, now, now);
            streamRow = { id: newStreamId, grade_id: gradeRow.id, name: stClean, display_name: disp };
            schoolStreams.push(streamRow);
          }
        }
        if (!streamRow) {
          return res.status(400).json({
            error: `A specific stream is required when assigning ${subjectName} in ${gradeRow.name}.`,
          });
        }

        const key = `${gradeRow.id}::${streamRow.id}::${subjectName.toLowerCase()}`;
        resolvedMap.set(key, {
          gradeId: gradeRow.id,
          gradeNumber: gradeRow.grade_number ?? parseGradeNumber(gradeRow.name),
          gradeName: gradeRow.name,
          streamId: streamRow.id,
          streamName: streamRow.name,
          streamDisplayName: streamRow.display_name,
          subjectName,
          periodsPerWeek: Math.max(1, Number(item?.periodsPerWeek || 4)),
        });
      }

      // Enforce 1-teacher-per-subject-per-stream across the school
      const conflicts: Array<{
        subjectName: string;
        streamDisplayName: string;
        currentTeacherId: string;
        currentTeacherName: string;
        assignmentId: string;
      }> = [];

      for (const target of resolvedMap.values()) {
        const existingOther = db
          .prepare(
            `SELECT id, teacher_id, teacher_name FROM grade_teacher_assignments
             WHERE school_id = ? AND grade_id = ? AND stream_id = ? AND lower(subject_name) = lower(?) AND is_active = 1 AND teacher_id != ?
             LIMIT 1`
          )
          .get(schoolId, target.gradeId, target.streamId, target.subjectName, teacher.id) as
          | { id: string; teacher_id: string; teacher_name: string }
          | undefined;
        if (existingOther) {
          conflicts.push({
            subjectName: target.subjectName,
            streamDisplayName: target.streamDisplayName,
            currentTeacherId: existingOther.teacher_id,
            currentTeacherName: existingOther.teacher_name,
            assignmentId: existingOther.id,
          });
        }
      }

      if (conflicts.length > 0 && !replaceExisting) {
        const first = conflicts[0];
        return res.status(409).json({
          error: `${first.subjectName} in ${first.streamDisplayName} is already assigned to ${first.currentTeacherName}. No subject in any stream can have more than one teacher.`,
          conflicts,
        });
      }

      const displacedTeacherIds = new Set<string>();
      db.exec('BEGIN IMMEDIATE');
      try {
        mirrorGradeToLegacyCollections(db, schoolId);

        // Current active assignments held by this teacher
        const currentRows = db
          .prepare(
            `SELECT gta.id, gta.grade_id, gta.stream_id, gta.subject_name, g.name as grade_name, g.grade_number, s.name as stream_name
             FROM grade_teacher_assignments gta
             JOIN grades g ON g.id = gta.grade_id
             LEFT JOIN streams s ON s.id = gta.stream_id
             WHERE gta.school_id = ? AND gta.teacher_id = ? AND gta.is_active = 1`
          )
          .all(schoolId, teacher.id) as any[];

        // Deactivate removed slots
        for (const cur of currentRows) {
          const curKey = `${cur.grade_id}::${cur.stream_id || ''}::${String(cur.subject_name).toLowerCase()}`;
          if (!resolvedMap.has(curKey)) {
            if (seniorAllowedGrades && !seniorAllowedGrades.has(cur.grade_id)) {
              continue; // Senior Teacher only mutates their own grade(s)
            }
            db.prepare(
              `UPDATE grade_teacher_assignments SET is_active = 0, unassigned_at = ?, updated_at = ? WHERE id = ?`
            ).run(now, now, cur.id);
            const gNum = cur.grade_number ?? parseGradeNumber(cur.grade_name);
            if (cur.stream_name) {
              syncStreamSubjectToTimetable(db, schoolId, gNum, cur.stream_name, cur.subject_name, null, teacher.id);
            }
          }
        }

        // Displace conflicting assignments only when explicitly requested
        if (replaceExisting && conflicts.length > 0) {
          for (const c of conflicts) {
            db.prepare(
              `UPDATE grade_teacher_assignments SET is_active = 0, unassigned_at = ?, updated_at = ? WHERE id = ? AND school_id = ?`
            ).run(now, now, c.assignmentId, schoolId);
            displacedTeacherIds.add(c.currentTeacherId);
          }
        }

        // Upsert target slots for this teacher
        for (const target of resolvedMap.values()) {
          const mine = db
            .prepare(
              `SELECT id FROM grade_teacher_assignments
               WHERE school_id = ? AND grade_id = ? AND stream_id = ? AND lower(subject_name) = lower(?) AND teacher_id = ? AND is_active = 1
               LIMIT 1`
            )
            .get(schoolId, target.gradeId, target.streamId, target.subjectName, teacher.id) as { id: string } | undefined;

          if (mine) {
            db.prepare(
              `UPDATE grade_teacher_assignments SET periods_per_week = ?, teacher_name = ?, updated_at = ? WHERE id = ?`
            ).run(target.periodsPerWeek, teacher.name, now, mine.id);
          } else {
            const newId = `gta-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
            db.prepare(
              `INSERT INTO grade_teacher_assignments
                (id, school_id, grade_id, stream_id, teacher_id, teacher_name, subject_name, academic_year, periods_per_week, is_active, assigned_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, '2026', ?, 1, ?, ?, ?)`
            ).run(
              newId,
              schoolId,
              target.gradeId,
              target.streamId,
              teacher.id,
              teacher.name,
              target.subjectName,
              target.periodsPerWeek,
              now,
              now,
              now
            );
          }
          syncStreamSubjectToTimetable(
            db,
            schoolId,
            target.gradeNumber,
            target.streamName,
            target.subjectName,
            teacher.id
          );
        }

        syncTeacherPayloadFromAssignments(
          db,
          schoolId,
          teacher.id,
          department !== undefined ? { department: department || undefined } : undefined
        );
        for (const dId of displacedTeacherIds) {
          syncTeacherPayloadFromAssignments(db, schoolId, dId);
        }

        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'TEACHER_SUBJECT_ALLOCATIONS_SYNCED',
          entityType: 'user',
          entityId: teacher.id,
          details: {
            count: resolvedMap.size,
            displacedCount: displacedTeacherIds.size,
          },
        });
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      notifyMySqlTablesChanged([
        'grade_teacher_assignments',
        'grades',
        'streams',
        'school_grades',
        'school_streams',
        'users',
        'collections_store',
        'tt_stream_subject_allocations',
        'academic_audit_logs',
      ]);
      broadcastChange({
        type: 'record:updated',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_users_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });

      const updatedUserRow = db.prepare(`SELECT payload_json FROM users WHERE id = ? AND school_id = ?`).get(teacher.id, schoolId) as any;
      const updatedUser = stripSecrets(safeParseJson<Record<string, any>>(updatedUserRow?.payload_json, {}));
      const allActive = db
        .prepare(
          `SELECT gta.*, g.name as grade_name, g.grade_number as grade_number,
                  s.name as stream_name, s.display_name as stream_display_name
           FROM grade_teacher_assignments gta
           JOIN grades g ON g.id = gta.grade_id
           LEFT JOIN streams s ON s.id = gta.stream_id
           WHERE gta.school_id = ? AND gta.is_active = 1
           ORDER BY COALESCE(g.grade_number, 99) ASC, s.name ASC, gta.subject_name ASC`
        )
        .all(schoolId);

      return res.json({ success: true, user: updatedUser, assignments: allActive });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed syncing teacher subject allocations', message: err?.message });
    }
  });

  app.delete('/api/academic/teacher-assignments/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, (req.query.tenantId || req.query.schoolId) as string);
      if (!schoolId) return;

      const id = String(req.params.id);
      const db = getDb();
      const existing = db
        .prepare(
          `SELECT gta.grade_id, gta.teacher_id, gta.subject_name, g.name as grade_name, g.grade_number, s.name as stream_name
           FROM grade_teacher_assignments gta
           JOIN grades g ON g.id = gta.grade_id
           LEFT JOIN streams s ON s.id = gta.stream_id
           WHERE gta.id = ? AND gta.school_id = ?`
        )
        .get(id, schoolId) as any;
      if (!existing) return res.status(404).json({ error: 'Assignment not found.' });
      if (!assertGradeScope(db, session, schoolId, existing.grade_id, res, true)) return;

      const now = nowIso();
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `UPDATE grade_teacher_assignments SET is_active = 0, unassigned_at = ?, updated_at = ?
           WHERE id = ? AND school_id = ?`
        ).run(now, now, id, schoolId);

        const gNum = existing.grade_number ?? parseGradeNumber(existing.grade_name);
        if (existing.stream_name) {
          syncStreamSubjectToTimetable(db, schoolId, gNum, existing.stream_name, existing.subject_name, null, existing.teacher_id);
        }
        syncTeacherPayloadFromAssignments(db, schoolId, existing.teacher_id);
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      notifyMySqlTablesChanged(['grade_teacher_assignments', 'users', 'collections_store', 'tt_stream_subject_allocations']);
      broadcastChange({
        type: 'record:updated',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      broadcastChange({
        type: 'record:updated',
        collection: 'edusmart_users_v1',
        tenantId: schoolId,
        actorId: session.userId,
        timestamp: now,
      });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed removing subject assignment', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 4. Student Stream Roster & Transfers (Preserving History)
  // -------------------------------------------------------------------------
  app.get('/api/academic/streams/:streamId/students', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const streamId = String(req.params.streamId);
      const db = getDb();
      const stream = assertStreamScope(db, session, schoolId, streamId, res);
      if (!stream) return;

      const activeSsa = db
        .prepare(
          `SELECT * FROM student_stream_assignments
           WHERE school_id = ? AND stream_id = ? AND is_active = 1
           ORDER BY student_name ASC`
        )
        .all(schoolId, streamId) as any[];

      const directStudents = db
        .prepare(
          `SELECT id, name, admission_number, email, phone, grade_label, stream_label
           FROM students WHERE school_id = ? AND stream_id = ? AND is_active = 1 ORDER BY name ASC`
        )
        .all(schoolId, streamId) as any[];

      const mergedMap = new Map<string, any>();
      for (const ds of directStudents) {
        mergedMap.set(ds.id, {
          studentId: ds.id,
          studentName: ds.name,
          admissionNumber: ds.admission_number || '',
          email: ds.email || '',
          phone: ds.phone || '',
          gradeId: stream.grade_id,
          streamId: stream.id,
          streamDisplayName: stream.display_name,
          assignedAt: null,
        });
      }
      for (const ssa of activeSsa) {
        const existing = mergedMap.get(ssa.student_id) || {};
        mergedMap.set(ssa.student_id, {
          ...existing,
          assignmentId: ssa.id,
          studentId: ssa.student_id,
          studentName: ssa.student_name || existing.studentName,
          admissionNumber: ssa.admission_number || existing.admissionNumber || '',
          gradeId: ssa.grade_id,
          streamId: ssa.stream_id,
          streamDisplayName: stream.display_name,
          assignedAt: ssa.assigned_at,
        });
      }

      // Attach linked parent contacts & interventions count
      const parents = db
        .prepare(`SELECT student_id, name, phone, email, relationship FROM student_parents WHERE school_id = ?`)
        .all(schoolId) as any[];
      const parentByStu = new Map<string, any>();
      for (const p of parents) parentByStu.set(p.student_id, p);

      const interventions = db
        .prepare(
          `SELECT student_id, COUNT(*) as open_count FROM student_intervention_records
           WHERE school_id = ? AND stream_id = ? AND status != 'resolved' GROUP BY student_id`
        )
        .all(schoolId, streamId) as Array<{ student_id: string; open_count: number }>;
      const intMap = new Map<string, number>();
      for (const row of interventions) intMap.set(row.student_id, row.open_count);

      const studentsList = Array.from(mergedMap.values()).map((stu) => {
        const parent = parentByStu.get(stu.studentId);
        return {
          ...stu,
          parentName: parent?.name || null,
          parentPhone: parent?.phone || null,
          parentEmail: parent?.email || null,
          openInterventionsCount: intMap.get(stu.studentId) || 0,
        };
      });

      return res.json({ success: true, stream, students: studentsList });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading stream students', message: err?.message });
    }
  });

  app.post('/api/academic/students/transfer', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators can transfer students between streams.' });
      }
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const studentId = String(req.body?.studentId || '').trim();
      const targetStreamId = String(req.body?.targetStreamId || '').trim();
      const transferReason = String(req.body?.transferReason || 'Administrative stream placement').trim();
      const academicYear = String(req.body?.academicYear || '2026').trim();

      if (!studentId || !targetStreamId) {
        return res.status(400).json({ error: 'studentId and targetStreamId are required.' });
      }

      const db = getDb();
      const targetStream = db
        .prepare(
          `SELECT s.id, s.grade_id, s.name, s.display_name, g.name as grade_name, g.grade_number
           FROM streams s JOIN grades g ON g.id = s.grade_id
           WHERE s.id = ? AND s.school_id = ?`
        )
        .get(targetStreamId, schoolId) as any;
      if (!targetStream) return res.status(404).json({ error: 'Target stream not found in this school.' });

      // Resolve student from users or students table
      const dirStu = db
        .prepare(`SELECT id, name, admission_number, payload_json FROM students WHERE id = ? AND school_id = ?`)
        .get(studentId, schoolId) as any;
      const userStu = db
        .prepare(`SELECT id, name, admission_number, payload_json FROM users WHERE id = ? AND school_id = ?`)
        .get(studentId, schoolId) as any;
      const stu = dirStu || userStu;
      if (!stu) return res.status(404).json({ error: 'Student not found in this school.' });

      const now = nowIso();
      const newAssignmentId = `ssa-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      db.exec('BEGIN IMMEDIATE');
      try {
        // Close previous active stream assignment (retaining history)
        db.prepare(
          `UPDATE student_stream_assignments
           SET is_active = 0, unassigned_at = ?, updated_at = ?
           WHERE school_id = ? AND student_id = ? AND is_active = 1`
        ).run(now, now, schoolId, studentId);

        db.prepare(
          `INSERT INTO student_stream_assignments
            (id, school_id, student_id, student_name, admission_number, grade_id, stream_id, academic_year, assigned_at, transfer_reason, transferred_by, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        ).run(
          newAssignmentId,
          schoolId,
          studentId,
          stu.name,
          stu.admission_number || '',
          targetStream.grade_id,
          targetStream.id,
          academicYear,
          now,
          transferReason,
          session.userId,
          now,
          now
        );

        // Update students & users tables so directory stays unified
        if (dirStu) {
          const payload = safeParseJson<Record<string, any>>(dirStu.payload_json, {});
          const nextPayload = {
            ...payload,
            gradeId: targetStream.grade_id,
            streamId: targetStream.id,
            gradeLabel: targetStream.grade_name,
            streamLabel: targetStream.name,
            className: targetStream.display_name,
          };
          db.prepare(
            `UPDATE students SET grade_id = ?, stream_id = ?, grade_label = ?, stream_label = ?, class_name = ?, payload_json = ?
             WHERE id = ? AND school_id = ?`
          ).run(
            targetStream.grade_id,
            targetStream.id,
            targetStream.grade_name,
            targetStream.name,
            targetStream.display_name,
            JSON.stringify(nextPayload),
            studentId,
            schoolId
          );
          upsertCollectionRecord(db, 'edusmart_students_v1', studentId, schoolId, nextPayload, false);
        }

        if (userStu) {
          updateUserPayloadMetadata(db, schoolId, studentId, {
            grade: targetStream.grade_number || targetStream.grade_name,
            stream: targetStream.name,
            gradeId: targetStream.grade_id,
            streamId: targetStream.id,
            className: targetStream.display_name,
          });
        }

        // Notify target Class Teacher & Senior Teacher
        const targetCt = db
          .prepare(`SELECT teacher_id FROM stream_class_teachers WHERE stream_id = ? AND is_active = 1`)
          .get(targetStream.id) as { teacher_id: string } | undefined;
        if (targetCt?.teacher_id) {
          createNotification(db, {
            schoolId,
            gradeId: targetStream.grade_id,
            streamId: targetStream.id,
            recipientUserId: targetCt.teacher_id,
            recipientRole: 'class_teacher',
            category: 'student_transfer',
            severity: 'info',
            title: `Student Transferred to ${targetStream.display_name}`,
            message: `${stu.name} has been transferred into ${targetStream.display_name}. Reason: ${transferReason}.`,
            actionUrlTab: 'students',
            relatedEntityId: newAssignmentId,
          });
        }

        const targetSt = db
          .prepare(`SELECT teacher_id FROM grade_senior_teachers WHERE grade_id = ? AND is_active = 1`)
          .get(targetStream.grade_id) as { teacher_id: string } | undefined;
        if (targetSt?.teacher_id) {
          createNotification(db, {
            schoolId,
            gradeId: targetStream.grade_id,
            streamId: targetStream.id,
            recipientUserId: targetSt.teacher_id,
            recipientRole: 'senior_teacher',
            category: 'student_transfer',
            severity: 'info',
            title: `Grade Transfer: ${stu.name} -> ${targetStream.display_name}`,
            message: `Administration transferred ${stu.name} into ${targetStream.display_name}.`,
            actionUrlTab: 'students',
            relatedEntityId: newAssignmentId,
          });
        }

        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: 'STUDENT_STREAM_TRANSFER',
          entityType: 'student_stream_assignments',
          entityId: newAssignmentId,
          gradeId: targetStream.grade_id,
          streamId: targetStream.id,
          details: { studentId, studentName: stu.name, targetStream: targetStream.display_name, transferReason },
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      notifyMySqlTablesChanged([...ACADEMIC_HIERARCHY_TABLES, 'students', 'users', 'collections_store']);
      broadcastChange({
        type: 'record:updated',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: studentId,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({
        success: true,
        assignmentId: newAssignmentId,
        studentId,
        targetGradeId: targetStream.grade_id,
        targetStreamId: targetStream.id,
        targetStreamDisplayName: targetStream.display_name,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed transferring student', message: err?.message });
    }
  });

  app.get('/api/academic/students/:studentId/transfer-history', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const studentId = String(req.params.studentId);
      const db = getDb();

      // Verify caller has access to the student's current stream or is Admin
      if (!isSchoolAdmin(session)) {
        const current = db
          .prepare(`SELECT grade_id, stream_id FROM student_stream_assignments WHERE school_id = ? AND student_id = ? AND is_active = 1`)
          .get(schoolId, studentId) as { grade_id: string; stream_id: string } | undefined;
        if (current) {
          if (!assertStreamScope(db, session, schoolId, current.stream_id, res)) return;
        } else {
          return res.status(403).json({ error: 'Insufficient permissions to view transfer history.' });
        }
      }

      const history = db
        .prepare(
          `SELECT ssa.*, g.name as grade_name, s.display_name as stream_display_name
           FROM student_stream_assignments ssa
           JOIN grades g ON g.id = ssa.grade_id
           JOIN streams s ON s.id = ssa.stream_id
           WHERE ssa.school_id = ? AND ssa.student_id = ?
           ORDER BY ssa.is_active DESC, ssa.assigned_at DESC`
        )
        .all(schoolId, studentId);

      return res.json({ success: true, history });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading student transfer history', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 5. Grade Overview (Senior Teacher & Admin) & Stream Workspace
  // -------------------------------------------------------------------------
  app.get('/api/academic/grades/:gradeId/overview', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const gradeId = String(req.params.gradeId);
      const db = getDb();
      if (!assertGradeScope(db, session, schoolId, gradeId, res, true)) return;

      const overview = buildGradeOverviewMetrics(db, schoolId, gradeId);
      if (!overview) return res.status(404).json({ error: 'Grade not found.' });

      return res.json({ success: true, ...overview });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading grade overview', message: err?.message });
    }
  });

  app.get('/api/academic/streams/:streamId/workspace', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const streamId = String(req.params.streamId);
      const db = getDb();
      const stream = assertStreamScope(db, session, schoolId, streamId, res);
      if (!stream) return;

      const overview = buildGradeOverviewMetrics(db, schoolId, stream.grade_id);
      const streamStats = overview?.streams.find((s) => s.streamId === streamId) || null;

      const reports = db
        .prepare(
          `SELECT * FROM class_teacher_reports
           WHERE school_id = ? AND stream_id = ?
           ORDER BY updated_at DESC`
        )
        .all(schoolId, streamId) as any[];

      const reportIds = reports.map((r) => r.id);
      let reviews: any[] = [];
      if (reportIds.length > 0) {
        const placeholders = reportIds.map(() => '?').join(',');
        reviews = db
          .prepare(
            `SELECT * FROM senior_teacher_reviews
             WHERE school_id = ? AND report_id IN (${placeholders})
             ORDER BY created_at DESC`
          )
          .all(schoolId, ...reportIds) as any[];
      }

      const interventions = db
        .prepare(
          `SELECT * FROM student_intervention_records
           WHERE school_id = ? AND stream_id = ?
           ORDER BY updated_at DESC`
        )
        .all(schoolId, streamId);

      const monitoring = db
        .prepare(
          `SELECT * FROM academic_monitoring_records
           WHERE school_id = ? AND stream_id = ?
           ORDER BY updated_at DESC`
        )
        .all(schoolId, streamId);

      return res.json({
        success: true,
        grade: overview?.grade || null,
        seniorTeacher: overview?.seniorTeacher || null,
        stream: streamStats,
        reports: reports.map((r) => ({
          ...r,
          reviews: reviews.filter((rv) => rv.report_id === r.id),
        })),
        interventions,
        monitoring,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading stream workspace', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 6. Academic Monitoring & Student Interventions
  // -------------------------------------------------------------------------
  app.get('/api/academic/monitoring', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const gradeId = req.query.gradeId ? String(req.query.gradeId) : null;
      const streamId = req.query.streamId ? String(req.query.streamId) : null;
      const db = getDb();

      if (streamId) {
        if (!assertStreamScope(db, session, schoolId, streamId, res)) return;
      } else if (gradeId) {
        if (!assertGradeScope(db, session, schoolId, gradeId, res, true)) return;
      } else if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Please specify your assigned gradeId or streamId.' });
      }

      let sql = `SELECT m.*, s.display_name as stream_display_name FROM academic_monitoring_records m
                 JOIN streams s ON s.id = m.stream_id
                 WHERE m.school_id = ?`;
      const params: any[] = [schoolId];
      if (gradeId) {
        sql += ` AND m.grade_id = ?`;
        params.push(gradeId);
      }
      if (streamId) {
        sql += ` AND m.stream_id = ?`;
        params.push(streamId);
      }
      sql += ` ORDER BY m.updated_at DESC`;

      const records = db.prepare(sql).all(...params);
      return res.json({ success: true, records });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading monitoring records', message: err?.message });
    }
  });

  app.post('/api/academic/monitoring', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const streamId = String(req.body?.streamId || '').trim();
      const subjectName = String(req.body?.subjectName || '').trim();
      if (!streamId || !subjectName) {
        return res.status(400).json({ error: 'streamId and subjectName are required.' });
      }

      const db = getDb();
      const stream = assertStreamScope(db, session, schoolId, streamId, res);
      if (!stream) return;

      const topicsPlanned = Math.max(1, Number(req.body?.topicsPlanned || 10));
      const topicsCompleted = Math.max(0, Number(req.body?.topicsCompleted || 0));
      const syllabusCoveragePct =
        req.body?.syllabusCoveragePct !== undefined
          ? Number(req.body.syllabusCoveragePct)
          : Math.min(100, Math.round((topicsCompleted / topicsPlanned) * 1000) / 10);
      const lessonsScheduled = Math.max(0, Number(req.body?.lessonsScheduled || 5));
      const lessonsDelivered = Math.max(0, Number(req.body?.lessonsDelivered || 0));
      const assignmentCompletionPct = Number(req.body?.assignmentCompletionPct ?? 0);
      const assessmentMeanScore = Number(req.body?.assessmentMeanScore ?? 0);
      const weekNumber = Math.max(1, Number(req.body?.weekNumber || 1));
      const term = String(req.body?.term || 'Term 1').trim();
      const academicYear = String(req.body?.academicYear || '2026').trim();
      const weakAreas = String(req.body?.weakAreas || '').trim();
      const remarks = String(req.body?.remarks || '').trim();

      const now = nowIso();
      const id = req.body?.id ? String(req.body.id) : `amr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `INSERT INTO academic_monitoring_records
            (id, school_id, grade_id, stream_id, subject_name, teacher_id, teacher_name, academic_year, term, week_number,
             topics_planned, topics_completed, syllabus_coverage_pct, lessons_scheduled, lessons_delivered,
             assignment_completion_pct, assessment_mean_score, weak_areas, remarks, recorded_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             topics_planned = excluded.topics_planned,
             topics_completed = excluded.topics_completed,
             syllabus_coverage_pct = excluded.syllabus_coverage_pct,
             lessons_scheduled = excluded.lessons_scheduled,
             lessons_delivered = excluded.lessons_delivered,
             assignment_completion_pct = excluded.assignment_completion_pct,
             assessment_mean_score = excluded.assessment_mean_score,
             weak_areas = excluded.weak_areas,
             remarks = excluded.remarks,
             updated_at = excluded.updated_at`
        ).run(
          id,
          schoolId,
          stream.grade_id,
          stream.id,
          subjectName,
          req.body?.teacherId || session.userId,
          req.body?.teacherName || session.user?.name || 'Teacher',
          academicYear,
          term,
          weekNumber,
          topicsPlanned,
          topicsCompleted,
          syllabusCoveragePct,
          lessonsScheduled,
          lessonsDelivered,
          assignmentCompletionPct,
          assessmentMeanScore,
          weakAreas,
          remarks,
          session.userId,
          now,
          now
        );

        // Alert Senior Teacher when performance or syllabus coverage is below threshold
        const seniorTeacher = db
          .prepare(`SELECT teacher_id FROM grade_senior_teachers WHERE grade_id = ? AND is_active = 1`)
          .get(stream.grade_id) as { teacher_id: string } | undefined;
        if (seniorTeacher?.teacher_id) {
          if (assessmentMeanScore > 0 && assessmentMeanScore < 50) {
            createNotification(db, {
              schoolId,
              gradeId: stream.grade_id,
              streamId: stream.id,
              recipientUserId: seniorTeacher.teacher_id,
              recipientRole: 'senior_teacher',
              category: 'poor_performance',
              severity: 'warning',
              title: `Low Subject Mean Alert: ${subjectName} (${stream.display_name})`,
              message: `${subjectName} recorded a mean score of ${assessmentMeanScore}% in ${stream.display_name}. Consider remedial intervention.`,
              actionUrlTab: 'academic_performance',
              relatedEntityId: id,
            });
          }
          if (syllabusCoveragePct > 0 && syllabusCoveragePct < 60 && weekNumber >= 6) {
            createNotification(db, {
              schoolId,
              gradeId: stream.grade_id,
              streamId: stream.id,
              recipientUserId: seniorTeacher.teacher_id,
              recipientRole: 'senior_teacher',
              category: 'syllabus_lag',
              severity: 'warning',
              title: `Syllabus Coverage Behind Schedule: ${subjectName}`,
              message: `${stream.display_name} ${subjectName} is at ${syllabusCoveragePct}% coverage by Week ${weekNumber}.`,
              actionUrlTab: 'syllabus_coverage',
              relatedEntityId: id,
            });
          }
        }
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      notifyMySqlTablesChanged(['academic_monitoring_records', 'grade_notifications']);
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed saving monitoring record', message: err?.message });
    }
  });

  app.get('/api/academic/interventions', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const gradeId = req.query.gradeId ? String(req.query.gradeId) : null;
      const streamId = req.query.streamId ? String(req.query.streamId) : null;
      const db = getDb();

      if (streamId) {
        if (!assertStreamScope(db, session, schoolId, streamId, res)) return;
      } else if (gradeId) {
        if (!assertGradeScope(db, session, schoolId, gradeId, res, true)) return;
      } else if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Specify your assigned gradeId or streamId.' });
      }

      let sql = `SELECT i.*, s.display_name as stream_display_name FROM student_intervention_records i
                 JOIN streams s ON s.id = i.stream_id WHERE i.school_id = ?`;
      const params: any[] = [schoolId];
      if (gradeId) {
        sql += ` AND i.grade_id = ?`;
        params.push(gradeId);
      }
      if (streamId) {
        sql += ` AND i.stream_id = ?`;
        params.push(streamId);
      }
      sql += ` ORDER BY i.updated_at DESC`;

      const records = db.prepare(sql).all(...params);
      return res.json({ success: true, records });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading interventions', message: err?.message });
    }
  });

  app.post('/api/academic/interventions', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const streamId = String(req.body?.streamId || '').trim();
      const studentId = String(req.body?.studentId || '').trim();
      const studentName = String(req.body?.studentName || '').trim();
      const identifiedIssue = String(req.body?.identifiedIssue || '').trim();
      const interventionPlan = String(req.body?.interventionPlan || '').trim();
      if (!streamId || !studentName || !identifiedIssue || !interventionPlan) {
        return res.status(400).json({ error: 'streamId, studentName, identifiedIssue, and interventionPlan are required.' });
      }

      const db = getDb();
      const stream = assertStreamScope(db, session, schoolId, streamId, res);
      if (!stream) return;

      const id = `sir-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const now = nowIso();
      const ct = db
        .prepare(`SELECT teacher_id, teacher_name FROM stream_class_teachers WHERE stream_id = ? AND is_active = 1`)
        .get(stream.id) as { teacher_id: string; teacher_name: string } | undefined;

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `INSERT INTO student_intervention_records
            (id, school_id, grade_id, stream_id, student_id, student_name, subject_name, category, severity,
             baseline_score, target_score, identified_issue, intervention_plan,
             recommended_by_id, recommended_by_name, recommended_by_role,
             assigned_to_id, assigned_to_name, status, parent_notified, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`
        ).run(
          id,
          schoolId,
          stream.grade_id,
          stream.id,
          studentId || `stu-${slugToken(studentName)}`,
          studentName,
          req.body?.subjectName || 'General Academic',
          req.body?.category || 'academic_remedial',
          req.body?.severity || 'moderate',
          req.body?.baselineScore ?? null,
          req.body?.targetScore ?? null,
          identifiedIssue,
          interventionPlan,
          session.userId,
          session.user?.name || 'Educator',
          session.role,
          req.body?.assignedToId || ct?.teacher_id || null,
          req.body?.assignedToName || ct?.teacher_name || null,
          req.body?.parentNotified ? 1 : 0,
          now,
          now
        );

        // If non-Class-Teacher initiates a remedial intervention, notify the stream's Class Teacher
        if (!hasClassTeacherPrivilege(session) && ct?.teacher_id) {
          createNotification(db, {
            schoolId,
            gradeId: stream.grade_id,
            streamId: stream.id,
            recipientUserId: ct.teacher_id,
            recipientRole: 'class_teacher',
            category: 'intervention_recommended',
            severity: req.body?.severity === 'high' ? 'critical' : 'warning',
            title: `Academic Intervention Recommended: ${studentName}`,
            message: `${session.user?.name || 'Senior Teacher'} recommended an intervention for ${studentName} (${stream.display_name}): ${interventionPlan}`,
            actionUrlTab: 'my_class',
            relatedEntityId: id,
          });
        }
        // If Class Teacher (or HOD acting as Class Teacher) logs high-severity intervention, notify Senior Teacher
        if (hasClassTeacherPrivilege(session)) {
          const st = db
            .prepare(`SELECT teacher_id FROM grade_senior_teachers WHERE grade_id = ? AND is_active = 1`)
            .get(stream.grade_id) as { teacher_id: string } | undefined;
          if (st?.teacher_id) {
            createNotification(db, {
              schoolId,
              gradeId: stream.grade_id,
              streamId: stream.id,
              recipientUserId: st.teacher_id,
              recipientRole: 'senior_teacher',
              category: 'intervention_logged',
              severity: req.body?.severity === 'high' ? 'warning' : 'info',
              title: `Student Intervention Logged: ${studentName} (${stream.display_name})`,
              message: `${session.user?.name || 'Class Teacher'} flagged ${studentName}: ${identifiedIssue}`,
              actionUrlTab: 'interventions',
              relatedEntityId: id,
            });
          }
        }
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      notifyMySqlTablesChanged(['student_intervention_records', 'grade_notifications']);
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed creating intervention record', message: err?.message });
    }
  });

  app.patch('/api/academic/interventions/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const id = String(req.params.id);
      const db = getDb();
      const existing = db
        .prepare(`SELECT * FROM student_intervention_records WHERE id = ? AND school_id = ?`)
        .get(id, schoolId) as any;
      if (!existing) return res.status(404).json({ error: 'Intervention not found.' });
      if (!assertStreamScope(db, session, schoolId, existing.stream_id, res)) return;

      const status = String(req.body?.status || existing.status);
      const outcomeNotes = req.body?.outcomeNotes !== undefined ? String(req.body.outcomeNotes) : existing.outcome_notes;
      const parentNotified = req.body?.parentNotified !== undefined ? (req.body.parentNotified ? 1 : 0) : existing.parent_notified;

      db.prepare(
        `UPDATE student_intervention_records SET status = ?, outcome_notes = ?, parent_notified = ?, updated_at = ?
         WHERE id = ? AND school_id = ?`
      ).run(status, outcomeNotes, parentNotified, nowIso(), id, schoolId);

      notifyMySqlTablesChanged(['student_intervention_records']);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed updating intervention', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 7. Class Teacher Report Submission & Senior Teacher Review Workflow
  // -------------------------------------------------------------------------
  app.get('/api/academic/class-reports', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const gradeId = req.query.gradeId ? String(req.query.gradeId) : null;
      const streamId = req.query.streamId ? String(req.query.streamId) : null;
      const db = getDb();

      const admin = isSchoolAdmin(session);
      const seniorGradeIds = getSeniorGradeIds(db, schoolId, session.userId);
      const classStreamIds = getClassTeacherStreamRows(db, schoolId, session.userId).map((r) => r.stream_id);

      if (streamId) {
        if (!assertStreamScope(db, session, schoolId, streamId, res)) return;
      } else if (gradeId) {
        if (!assertGradeScope(db, session, schoolId, gradeId, res, true)) return;
      } else if (!admin && !sessionHasRole(session, 'senior_teacher') && !hasClassTeacherPrivilege(session)) {
        return res.status(403).json({ error: 'Insufficient permissions to view class reports.' });
      }

      let sql = `SELECT r.*, g.name as grade_name, s.display_name as stream_display_name
                 FROM class_teacher_reports r
                 JOIN grades g ON g.id = r.grade_id
                 JOIN streams s ON s.id = r.stream_id
                 WHERE r.school_id = ?`;
      const params: any[] = [schoolId];
      if (gradeId) {
        sql += ` AND r.grade_id = ?`;
        params.push(gradeId);
      }
      if (streamId) {
        sql += ` AND r.stream_id = ?`;
        params.push(streamId);
      }
      sql += ` ORDER BY r.updated_at DESC`;

      const allRows = db.prepare(sql).all(...params) as any[];
      const scopedRows = allRows.filter((r) => {
        if (admin) return true;
        if (sessionHasRole(session, 'senior_teacher') && seniorGradeIds.includes(r.grade_id)) return true;
        if (hasClassTeacherPrivilege(session) && classStreamIds.includes(r.stream_id)) return true;
        return false;
      });

      const reviews = db
        .prepare(`SELECT * FROM senior_teacher_reviews WHERE school_id = ? ORDER BY created_at DESC`)
        .all(schoolId) as any[];

      return res.json({
        success: true,
        reports: scopedRows.map((r) => ({
          ...r,
          reviews: reviews.filter((rv) => rv.report_id === r.id),
        })),
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading class teacher reports', message: err?.message });
    }
  });

  app.post('/api/academic/class-reports', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      if (!isSchoolAdmin(session) && !hasClassTeacherPrivilege(session)) {
        return res.status(403).json({ error: 'Only Class Teachers, Heads of Department, or Administrators can create class reports.' });
      }

      const streamId = String(req.body?.streamId || '').trim();
      const title = String(req.body?.title || '').trim();
      const summary = String(req.body?.summary || '').trim();
      if (!streamId || !title || !summary) {
        return res.status(400).json({ error: 'streamId, title, and summary are required.' });
      }

      const db = getDb();
      const stream = assertStreamScope(db, session, schoolId, streamId, res);
      if (!stream) return;

      const seniorTeacher = db
        .prepare(`SELECT teacher_id, teacher_name FROM grade_senior_teachers WHERE grade_id = ? AND is_active = 1`)
        .get(stream.grade_id) as { teacher_id: string; teacher_name: string } | undefined;

      const status = req.body?.submitNow ? 'submitted' : 'draft';
      const attendanceRate = Number(req.body?.attendanceRate ?? 0);
      const academicMean = Number(req.body?.academicMean ?? 0);
      const syllabusCoverage = Number(req.body?.syllabusCoverage ?? 0);
      const assignmentCompletion = Number(req.body?.assignmentCompletion ?? 0);
      const studentsCount = Number(req.body?.studentsCount ?? 0);
      const interventionCount = Number(req.body?.interventionCount ?? 0);

      const now = nowIso();
      const id = `ctr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `INSERT INTO class_teacher_reports
            (id, school_id, grade_id, stream_id, class_teacher_id, class_teacher_name, senior_teacher_id, senior_teacher_name,
             report_type, period_label, academic_year, term, title, summary,
             attendance_rate, academic_mean, syllabus_coverage, assignment_completion, students_count, intervention_count,
             challenges, recommendations, metrics_json, status, submitted_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id,
          schoolId,
          stream.grade_id,
          stream.id,
          session.userId,
          session.user?.name || 'Class Teacher',
          seniorTeacher?.teacher_id || null,
          seniorTeacher?.teacher_name || null,
          req.body?.reportType || 'weekly',
          req.body?.periodLabel || 'Week 6 · Term 1',
          req.body?.academicYear || '2026',
          req.body?.term || 'Term 1',
          title,
          summary,
          attendanceRate,
          academicMean,
          syllabusCoverage,
          assignmentCompletion,
          studentsCount,
          interventionCount,
          req.body?.challenges || '',
          req.body?.recommendations || '',
          JSON.stringify(req.body?.metrics || {}),
          status,
          status === 'submitted' ? now : null,
          now,
          now
        );

        if (status === 'submitted' && seniorTeacher?.teacher_id) {
          createNotification(db, {
            schoolId,
            gradeId: stream.grade_id,
            streamId: stream.id,
            recipientUserId: seniorTeacher.teacher_id,
            recipientRole: 'senior_teacher',
            category: 'report_submitted',
            severity: 'info',
            title: `Class Report Submitted: ${stream.display_name}`,
            message: `${session.user?.name || 'Class Teacher'} submitted "${title}" (${req.body?.periodLabel || 'Weekly'}) for your review.`,
            actionUrlTab: 'class_teachers',
            relatedEntityId: id,
          });

          if (attendanceRate > 0 && attendanceRate < 80) {
            createNotification(db, {
              schoolId,
              gradeId: stream.grade_id,
              streamId: stream.id,
              recipientUserId: seniorTeacher.teacher_id,
              recipientRole: 'senior_teacher',
              category: 'low_attendance',
              severity: 'warning',
              title: `Low Attendance Alert (${attendanceRate}%): ${stream.display_name}`,
              message: `${stream.display_name} reported attendance of ${attendanceRate}% in "${title}".`,
              actionUrlTab: 'attendance_monitor',
              relatedEntityId: id,
            });
          }

          if (academicMean > 0 && academicMean < 50) {
            createNotification(db, {
              schoolId,
              gradeId: stream.grade_id,
              streamId: stream.id,
              recipientUserId: seniorTeacher.teacher_id,
              recipientRole: 'senior_teacher',
              category: 'poor_performance',
              severity: 'warning',
              title: `Low Mean Score Alert (${academicMean}%): ${stream.display_name}`,
              message: `${stream.display_name} recorded a class academic mean of ${academicMean}%.`,
              actionUrlTab: 'academic_performance',
              relatedEntityId: id,
            });
          }
        }

        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: status === 'submitted' ? 'CLASS_REPORT_SUBMITTED' : 'CLASS_REPORT_SAVED',
          entityType: 'class_teacher_reports',
          entityId: id,
          gradeId: stream.grade_id,
          streamId: stream.id,
          details: { title, status },
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      notifyMySqlTablesChanged(['class_teacher_reports', 'grade_notifications', 'academic_audit_logs']);
      broadcastChange({
        type: 'record:created',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.status(201).json({ success: true, id, status });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed creating class report', message: err?.message });
    }
  });

  app.put('/api/academic/class-reports/:id', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const id = String(req.params.id);
      const db = getDb();
      const existing = db
        .prepare(`SELECT * FROM class_teacher_reports WHERE id = ? AND school_id = ?`)
        .get(id, schoolId) as any;
      if (!existing) return res.status(404).json({ error: 'Class report not found.' });
      if (!assertStreamScope(db, session, schoolId, existing.stream_id, res)) return;

      const nextStatus = req.body?.submitNow ? 'submitted' : existing.status === 'approved' ? 'approved' : 'draft';
      const now = nowIso();
      db.prepare(
        `UPDATE class_teacher_reports SET
          title = ?, summary = ?, report_type = ?, period_label = ?, term = ?,
          attendance_rate = ?, academic_mean = ?, syllabus_coverage = ?, assignment_completion = ?,
          students_count = ?, intervention_count = ?, challenges = ?, recommendations = ?,
          status = ?, submitted_at = COALESCE(submitted_at, ?), updated_at = ?
         WHERE id = ? AND school_id = ?`
      ).run(
        req.body?.title ?? existing.title,
        req.body?.summary ?? existing.summary,
        req.body?.reportType ?? existing.report_type,
        req.body?.periodLabel ?? existing.period_label,
        req.body?.term ?? existing.term,
        req.body?.attendanceRate ?? existing.attendance_rate,
        req.body?.academicMean ?? existing.academic_mean,
        req.body?.syllabusCoverage ?? existing.syllabus_coverage,
        req.body?.assignmentCompletion ?? existing.assignment_completion,
        req.body?.studentsCount ?? existing.students_count,
        req.body?.interventionCount ?? existing.intervention_count,
        req.body?.challenges ?? existing.challenges,
        req.body?.recommendations ?? existing.recommendations,
        nextStatus,
        nextStatus === 'submitted' ? now : null,
        now,
        id,
        schoolId
      );

      if (req.body?.submitNow) {
        const seniorTeacher = db
          .prepare(`SELECT teacher_id FROM grade_senior_teachers WHERE grade_id = ? AND is_active = 1`)
          .get(existing.grade_id) as { teacher_id: string } | undefined;
        if (seniorTeacher?.teacher_id) {
          createNotification(db, {
            schoolId,
            gradeId: existing.grade_id,
            streamId: existing.stream_id,
            recipientUserId: seniorTeacher.teacher_id,
            recipientRole: 'senior_teacher',
            category: 'report_resubmitted',
            severity: 'info',
            title: `Updated Class Report Resubmitted`,
            message: `${session.user?.name || 'Class Teacher'} resubmitted "${req.body?.title || existing.title}" after review.`,
            actionUrlTab: 'class_teachers',
            relatedEntityId: id,
          });
        }
      }

      notifyMySqlTablesChanged(['class_teacher_reports', 'grade_notifications']);
      return res.json({ success: true, status: nextStatus });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed updating class report', message: err?.message });
    }
  });

  app.post('/api/academic/class-reports/:id/submit', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const id = String(req.params.id);
      const db = getDb();
      const existing = db
        .prepare(`SELECT * FROM class_teacher_reports WHERE id = ? AND school_id = ?`)
        .get(id, schoolId) as any;
      if (!existing) return res.status(404).json({ error: 'Report not found.' });
      if (!assertStreamScope(db, session, schoolId, existing.stream_id, res)) return;

      const seniorTeacher = db
        .prepare(`SELECT teacher_id, teacher_name FROM grade_senior_teachers WHERE grade_id = ? AND is_active = 1`)
        .get(existing.grade_id) as { teacher_id: string; teacher_name: string } | undefined;
      const stream = db
        .prepare(`SELECT display_name FROM streams WHERE id = ?`)
        .get(existing.stream_id) as { display_name: string } | undefined;

      const now = nowIso();
      db.prepare(
        `UPDATE class_teacher_reports
         SET status = 'submitted', senior_teacher_id = ?, senior_teacher_name = ?, submitted_at = ?, updated_at = ?
         WHERE id = ? AND school_id = ?`
      ).run(
        seniorTeacher?.teacher_id || existing.senior_teacher_id,
        seniorTeacher?.teacher_name || existing.senior_teacher_name,
        now,
        now,
        id,
        schoolId
      );

      if (seniorTeacher?.teacher_id) {
        createNotification(db, {
          schoolId,
          gradeId: existing.grade_id,
          streamId: existing.stream_id,
          recipientUserId: seniorTeacher.teacher_id,
          recipientRole: 'senior_teacher',
          category: 'report_submitted',
          severity: 'info',
          title: `Class Report Submitted: ${stream?.display_name || 'Stream'}`,
          message: `${existing.class_teacher_name} submitted "${existing.title}" for your review.`,
          actionUrlTab: 'class_teachers',
          relatedEntityId: id,
        });
      }

      notifyMySqlTablesChanged(['class_teacher_reports', 'grade_notifications']);
      return res.json({ success: true, status: 'submitted' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed submitting report', message: err?.message });
    }
  });

  app.post('/api/academic/class-reports/:id/review', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      if (!isSchoolAdmin(session) && !sessionHasRole(session, 'senior_teacher')) {
        return res.status(403).json({ error: 'Only an assigned Senior Teacher or Administrator can review reports.' });
      }

      const id = String(req.params.id);
      const decision = String(req.body?.decision || 'approved').trim();
      const comments = String(req.body?.comments || '').trim();
      const actionItems = String(req.body?.actionItems || '').trim();
      if (!comments) return res.status(400).json({ error: 'Review comments or instructions are required.' });
      if (!['approved', 'returned_for_correction', 'info_requested', 'instruction'].includes(decision)) {
        return res.status(400).json({ error: 'Invalid review decision.' });
      }

      const db = getDb();
      const report = db
        .prepare(`SELECT * FROM class_teacher_reports WHERE id = ? AND school_id = ?`)
        .get(id, schoolId) as any;
      if (!report) return res.status(404).json({ error: 'Class report not found.' });
      if (!assertGradeScope(db, session, schoolId, report.grade_id, res, true)) return;

      const now = nowIso();
      const reviewId = `str-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `INSERT INTO senior_teacher_reviews
            (id, school_id, report_id, grade_id, stream_id, reviewer_id, reviewer_name, decision, comments, action_items, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          reviewId,
          schoolId,
          report.id,
          report.grade_id,
          report.stream_id,
          session.userId,
          session.user?.name || 'Senior Teacher',
          decision,
          comments,
          actionItems,
          now
        );

        if (decision !== 'instruction') {
          db.prepare(
            `UPDATE class_teacher_reports SET status = ?, reviewed_at = ?, updated_at = ?
             WHERE id = ? AND school_id = ?`
          ).run(decision, now, now, report.id, schoolId);
        }

        const activeCt = db
          .prepare(`SELECT teacher_id FROM stream_class_teachers WHERE stream_id = ? AND is_active = 1`)
          .get(report.stream_id) as { teacher_id: string } | undefined;
        const recipientUserId = activeCt?.teacher_id || report.class_teacher_id;

        const labelMap: Record<string, string> = {
          approved: 'Approved',
          returned_for_correction: 'Returned for Correction',
          info_requested: 'Additional Info Requested',
          instruction: 'Instruction Sent',
        };

        createNotification(db, {
          schoolId,
          gradeId: report.grade_id,
          streamId: report.stream_id,
          recipientUserId,
          recipientRole: 'class_teacher',
          category: 'report_review',
          severity: decision === 'approved' ? 'success' : 'warning',
          title: `Senior Teacher Review (${labelMap[decision]}): ${report.title}`,
          message: `${session.user?.name || 'Senior Teacher'}: ${comments}`,
          actionUrlTab: 'report_to_senior',
          relatedEntityId: report.id,
        });

        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: `CLASS_REPORT_${decision.toUpperCase()}`,
          entityType: 'senior_teacher_reviews',
          entityId: reviewId,
          gradeId: report.grade_id,
          streamId: report.stream_id,
          details: { reportId: report.id, decision, comments },
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      notifyMySqlTablesChanged(['class_teacher_reports', 'senior_teacher_reviews', 'grade_notifications', 'academic_audit_logs']);
      broadcastChange({
        type: 'record:updated',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: report.id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.json({ success: true, reviewId, decision });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed submitting review', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 8. Consolidated Grade Reports (Senior Teacher -> School Administration)
  // -------------------------------------------------------------------------
  app.get('/api/academic/consolidated-reports', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const gradeId = req.query.gradeId ? String(req.query.gradeId) : null;
      const db = getDb();

      const admin = isSchoolAdmin(session);
      const seniorGradeIds = getSeniorGradeIds(db, schoolId, session.userId);
      if (!admin && !sessionHasRole(session, 'senior_teacher')) {
        return res.status(403).json({ error: 'Access restricted to Senior Teachers and School Administrators.' });
      }
      if (gradeId && !assertGradeScope(db, session, schoolId, gradeId, res, true)) return;

      let sql = `SELECT gcr.*, g.name as grade_name FROM grade_consolidated_reports gcr
                 JOIN grades g ON g.id = gcr.grade_id WHERE gcr.school_id = ?`;
      const params: any[] = [schoolId];
      if (gradeId) {
        sql += ` AND gcr.grade_id = ?`;
        params.push(gradeId);
      }
      sql += ` ORDER BY gcr.updated_at DESC`;

      const rows = db.prepare(sql).all(...params) as any[];
      const filtered = rows
        .filter((r) => admin || seniorGradeIds.includes(r.grade_id))
        .map((r) => ({
          ...r,
          weakSubjects: safeParseJson(r.weak_subjects_json, []),
          streamComparison: safeParseJson(r.stream_comparison_json, []),
          includedReportIds: safeParseJson(r.included_report_ids_json, []),
        }));

      return res.json({ success: true, reports: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading consolidated reports', message: err?.message });
    }
  });

  app.post('/api/academic/consolidated-reports', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      if (!isSchoolAdmin(session) && !sessionHasRole(session, 'senior_teacher')) {
        return res.status(403).json({ error: 'Only assigned Senior Teachers or Administrators can compile consolidated grade reports.' });
      }

      const gradeId = String(req.body?.gradeId || '').trim();
      const title = String(req.body?.title || '').trim();
      const executiveSummary = String(req.body?.executiveSummary || '').trim();
      if (!gradeId || !title || !executiveSummary) {
        return res.status(400).json({ error: 'gradeId, title, and executiveSummary are required.' });
      }

      const db = getDb();
      if (!assertGradeScope(db, session, schoolId, gradeId, res, true)) return;

      const overview = buildGradeOverviewMetrics(db, schoolId, gradeId);
      if (!overview) return res.status(404).json({ error: 'Grade not found.' });

      const status = req.body?.submitNow ? 'submitted' : 'draft';
      const now = nowIso();
      const id = `gcr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const includedIds = Array.isArray(req.body?.includedReportIds)
        ? req.body.includedReportIds
        : overview.recentClassReports.filter((r: any) => r.status === 'approved' || r.status === 'submitted').map((r: any) => r.id);

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `INSERT INTO grade_consolidated_reports
            (id, school_id, grade_id, senior_teacher_id, senior_teacher_name, report_type, period_label, academic_year, term,
             title, executive_summary, weak_subjects_json, stream_comparison_json, intervention_summary, recommendations,
             included_report_ids_json, overall_attendance_rate, overall_academic_mean, overall_syllabus_coverage,
             total_students, total_streams, status, submitted_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id,
          schoolId,
          gradeId,
          session.userId,
          session.user?.name || 'Senior Teacher',
          req.body?.reportType || 'consolidated',
          req.body?.periodLabel || 'Term 1 Mid-Term',
          req.body?.academicYear || '2026',
          req.body?.term || 'Term 1',
          title,
          executiveSummary,
          JSON.stringify(overview.weakSubjects),
          JSON.stringify(overview.streams),
          req.body?.interventionSummary || `${overview.summary.openInterventionsCount} active learner interventions across ${overview.summary.streamsCount} streams.`,
          req.body?.recommendations || '',
          JSON.stringify(includedIds),
          overview.summary.overallAttendancePct,
          overview.summary.overallAcademicMean,
          overview.summary.overallSyllabusCoveragePct,
          overview.summary.totalStudents,
          overview.summary.streamsCount,
          status,
          status === 'submitted' ? now : null,
          now,
          now
        );

        if (status === 'submitted') {
          for (const adminRole of ['admin', 'head_teacher', 'deputy_head', 'dean_of_studies']) {
            createNotification(db, {
              schoolId,
              gradeId,
              recipientRole: adminRole,
              category: 'consolidated_report_submitted',
              severity: 'info',
              title: `Consolidated Grade Report Submitted: ${overview.grade.name}`,
              message: `${session.user?.name || 'Senior Teacher'} submitted "${title}" covering ${overview.summary.streamsCount} streams (${overview.summary.totalStudents} students).`,
              actionUrlTab: 'consolidated_reports',
              relatedEntityId: id,
            });
          }
        }

        logAcademicAudit(db, {
          schoolId,
          actor: session,
          action: status === 'submitted' ? 'CONSOLIDATED_REPORT_SUBMITTED' : 'CONSOLIDATED_REPORT_DRAFTED',
          entityType: 'grade_consolidated_reports',
          entityId: id,
          gradeId,
          details: { title, status, includedReportCount: includedIds.length },
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      notifyMySqlTablesChanged(['grade_consolidated_reports', 'grade_notifications', 'academic_audit_logs']);
      return res.status(201).json({ success: true, id, status });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed creating consolidated report', message: err?.message });
    }
  });

  app.post('/api/academic/consolidated-reports/:id/submit', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const id = String(req.params.id);
      const db = getDb();
      const report = db
        .prepare(`SELECT gcr.*, g.name as grade_name FROM grade_consolidated_reports gcr JOIN grades g ON g.id = gcr.grade_id WHERE gcr.id = ? AND gcr.school_id = ?`)
        .get(id, schoolId) as any;
      if (!report) return res.status(404).json({ error: 'Consolidated report not found.' });
      if (!assertGradeScope(db, session, schoolId, report.grade_id, res, true)) return;

      const now = nowIso();
      db.prepare(
        `UPDATE grade_consolidated_reports SET status = 'submitted', submitted_at = ?, updated_at = ?
         WHERE id = ? AND school_id = ?`
      ).run(now, now, id, schoolId);

      for (const adminRole of ['admin', 'head_teacher', 'deputy_head', 'dean_of_studies']) {
        createNotification(db, {
          schoolId,
          gradeId: report.grade_id,
          recipientRole: adminRole,
          category: 'consolidated_report_submitted',
          severity: 'info',
          title: `Consolidated Grade Report Submitted: ${report.grade_name}`,
          message: `${report.senior_teacher_name} submitted "${report.title}" for administrative review.`,
          actionUrlTab: 'consolidated_reports',
          relatedEntityId: id,
        });
      }

      notifyMySqlTablesChanged(['grade_consolidated_reports', 'grade_notifications']);
      return res.json({ success: true, status: 'submitted' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed submitting consolidated report', message: err?.message });
    }
  });

  app.post('/api/academic/consolidated-reports/:id/admin-review', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators can review consolidated grade reports.' });
      }
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const id = String(req.params.id);
      const status = String(req.body?.status || 'approved').trim();
      const adminFeedback = String(req.body?.adminFeedback || '').trim();
      if (!adminFeedback) return res.status(400).json({ error: 'Administrative feedback is required.' });
      if (!['reviewed', 'approved', 'feedback_sent'].includes(status)) {
        return res.status(400).json({ error: 'Invalid admin review status.' });
      }

      const db = getDb();
      const report = db
        .prepare(`SELECT * FROM grade_consolidated_reports WHERE id = ? AND school_id = ?`)
        .get(id, schoolId) as any;
      if (!report) return res.status(404).json({ error: 'Consolidated report not found.' });

      const now = nowIso();
      db.prepare(
        `UPDATE grade_consolidated_reports
         SET status = ?, admin_reviewer_id = ?, admin_reviewer_name = ?, admin_feedback = ?, admin_reviewed_at = ?, updated_at = ?
         WHERE id = ? AND school_id = ?`
      ).run(
        status,
        session.userId,
        session.user?.name || 'School Administrator',
        adminFeedback,
        now,
        now,
        id,
        schoolId
      );

      createNotification(db, {
        schoolId,
        gradeId: report.grade_id,
        recipientUserId: report.senior_teacher_id,
        recipientRole: 'senior_teacher',
        category: 'admin_report_feedback',
        severity: status === 'approved' ? 'success' : 'info',
        title: `Administration Review: ${report.title}`,
        message: `${session.user?.name || 'School Admin'} (${status.replace('_', ' ')}): ${adminFeedback}`,
        actionUrlTab: 'grade_reports',
        relatedEntityId: id,
      });

      logAcademicAudit(db, {
        schoolId,
        actor: session,
        action: `CONSOLIDATED_REPORT_${status.toUpperCase()}`,
        entityType: 'grade_consolidated_reports',
        entityId: id,
        gradeId: report.grade_id,
        details: { status, adminFeedback },
      });

      notifyMySqlTablesChanged(['grade_consolidated_reports', 'grade_notifications', 'academic_audit_logs']);
      return res.json({ success: true, status });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed reviewing consolidated report', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 9. Scoped Announcements, Notifications & Audit Logs
  // -------------------------------------------------------------------------
  app.get('/api/academic/announcements', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const db = getDb();
      const admin = isSchoolAdmin(session);
      const seniorGradeIds = getSeniorGradeIds(db, schoolId, session.userId);
      const classStreamRows = getClassTeacherStreamRows(db, schoolId, session.userId);
      const studentPlacements = getStudentOrParentPlacements(db, session, schoolId);

      const rows = db
        .prepare(
          `SELECT a.*, g.name as grade_name, s.display_name as stream_display_name
           FROM grade_announcements a
           LEFT JOIN grades g ON g.id = a.grade_id
           LEFT JOIN streams s ON s.id = a.stream_id
           WHERE a.school_id = ?
           ORDER BY a.is_pinned DESC, a.created_at DESC`
        )
        .all(schoolId) as any[];

      const visible = rows.filter((a) => {
        if (admin) return true;
        if (!a.grade_id && !a.stream_id) return true; // school-wide
        if (sessionHasRole(session, 'senior_teacher')) {
          if (a.grade_id && seniorGradeIds.includes(a.grade_id)) return true;
        }
        if (hasClassTeacherPrivilege(session)) {
          if (a.stream_id && classStreamRows.some((r) => r.stream_id === a.stream_id)) return true;
          if (a.grade_id && classStreamRows.some((r) => r.grade_id === a.grade_id)) return true;
        }
        if (sessionHasAnyRole(session, ['student', 'parent'])) {
          if (a.target_audience === 'teachers_only') return false;
          if (a.stream_id && studentPlacements.some((p) => p.streamId === a.stream_id)) return true;
          if (a.grade_id && studentPlacements.some((p) => p.gradeId === a.grade_id)) return true;
        }
        return false;
      });

      return res.json({ success: true, announcements: visible });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading announcements', message: err?.message });
    }
  });

  app.post('/api/academic/announcements', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      if (!isSchoolAdmin(session) && !sessionHasRole(session, 'senior_teacher') && !hasClassTeacherPrivilege(session)) {
        return res.status(403).json({ error: 'Only educators and administrators can publish announcements.' });
      }

      const title = String(req.body?.title || '').trim();
      const message = String(req.body?.message || '').trim();
      if (!title || !message) return res.status(400).json({ error: 'title and message are required.' });

      const gradeId = req.body?.gradeId ? String(req.body.gradeId).trim() : null;
      const streamId = req.body?.streamId ? String(req.body.streamId).trim() : null;
      const targetAudience = String(req.body?.targetAudience || (streamId ? 'stream' : 'all_grade')).trim();
      const priority = String(req.body?.priority || 'normal').trim();
      const isPinned = req.body?.isPinned ? 1 : 0;

      const db = getDb();
      if (streamId) {
        if (!assertStreamScope(db, session, schoolId, streamId, res)) return;
      } else if (gradeId) {
        if (!assertGradeScope(db, session, schoolId, gradeId, res, true)) return;
      } else if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only administrators may broadcast school-wide announcements without a gradeId/streamId.' });
      }

      const id = `ann-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const now = nowIso();
      db.prepare(
        `INSERT INTO grade_announcements
          (id, school_id, grade_id, stream_id, author_id, author_name, author_role, target_audience, title, message, priority, is_pinned, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        schoolId,
        gradeId,
        streamId,
        session.userId,
        session.user?.name || 'Staff',
        session.role,
        targetAudience,
        title,
        message,
        priority,
        isPinned,
        now,
        now
      );

      notifyMySqlTablesChanged(['grade_announcements']);
      broadcastChange({
        type: 'record:created',
        collection: 'academic_hierarchy',
        tenantId: schoolId,
        recordId: id,
        actorId: session.userId,
        timestamp: now,
      });

      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed publishing announcement', message: err?.message });
    }
  });

  app.get('/api/academic/notifications', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const db = getDb();
      const seniorGradeIds = getSeniorGradeIds(db, schoolId, session.userId);
      const classStreamIds = getClassTeacherStreamRows(db, schoolId, session.userId).map((r) => r.stream_id);

      const rows = db
        .prepare(
          `SELECT * FROM grade_notifications
           WHERE school_id = ?
           ORDER BY is_read ASC, created_at DESC LIMIT 120`
        )
        .all(schoolId) as any[];

      const heldRoles = new Set(getSessionRoles(session));
      const filtered = rows.filter((n) => {
        if (n.recipient_user_id) return n.recipient_user_id === session.userId;
        if (!heldRoles.has(String(n.recipient_role || '').toLowerCase())) return false;
        if (n.recipient_role === 'senior_teacher' && n.grade_id) {
          return seniorGradeIds.includes(n.grade_id);
        }
        if (n.recipient_role === 'class_teacher' && n.stream_id) {
          return classStreamIds.includes(n.stream_id);
        }
        return true;
      });

      return res.json({ success: true, notifications: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading notifications', message: err?.message });
    }
  });

  app.post('/api/academic/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const id = String(req.params.id);
      const db = getDb();
      const notif = db
        .prepare(`SELECT * FROM grade_notifications WHERE id = ? AND school_id = ?`)
        .get(id, schoolId) as any;
      if (!notif) return res.status(404).json({ error: 'Notification not found.' });
      if (notif.recipient_user_id && notif.recipient_user_id !== session.userId && !isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Cannot mark another user notification as read.' });
      }

      db.prepare(`UPDATE grade_notifications SET is_read = 1, read_at = ? WHERE id = ?`).run(nowIso(), id);
      notifyMySqlTablesChanged(['grade_notifications']);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed marking notification read', message: err?.message });
    }
  });

  app.post('/api/academic/notifications/read-all', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.body?.schoolId);
      if (!schoolId) return;

      const db = getDb();
      const now = nowIso();
      db.prepare(
        `UPDATE grade_notifications SET is_read = 1, read_at = ?
         WHERE school_id = ? AND is_read = 0 AND (recipient_user_id = ? OR (recipient_user_id IS NULL AND recipient_role = ?))`
      ).run(now, schoolId, session.userId, session.role);

      notifyMySqlTablesChanged(['grade_notifications']);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed clearing notifications', message: err?.message });
    }
  });

  // -------------------------------------------------------------------------
  // 10. Official Report Export Data Generator (8 Required Report Types)
  // -------------------------------------------------------------------------
  app.get('/api/academic/reports/export-data', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const reportType = String(req.query.type || 'consolidated').trim();
      const gradeId = String(req.query.gradeId || '').trim();
      const streamId = req.query.streamId ? String(req.query.streamId).trim() : null;

      if (!gradeId) return res.status(400).json({ error: 'gradeId is required for report generation.' });

      const db = getDb();
      if (streamId) {
        if (!assertStreamScope(db, session, schoolId, streamId, res)) return;
      } else {
        if (!assertGradeScope(db, session, schoolId, gradeId, res, true)) return;
      }

      const overview = buildGradeOverviewMetrics(db, schoolId, gradeId);
      if (!overview) return res.status(404).json({ error: 'Grade not found.' });

      const streams = streamId
        ? overview.streams.filter((s) => s.streamId === streamId)
        : overview.streams;

      const labels: Record<string, string> = {
        weekly: 'Weekly Grade Academic & Operational Report',
        monthly: 'Monthly Grade Progress & Attendance Report',
        termly: 'Termly Grade Academic Performance Report',
        attendance: 'Grade Attendance & Punctuality Compliance Report',
        teacher_activity: 'Class Teacher & Subject Delivery Activity Report',
        syllabus: 'Curriculum & Syllabus Coverage Tracking Report',
        intervention: 'Student Academic Intervention & Remedial Report',
        consolidated: 'Consolidated Grade Performance Dossier',
      };

      const title = `${overview.grade.name} — ${labels[reportType] || labels.consolidated}`;
      const summaryPairs: Array<[string, string]> = [
        ['Grade Level', `${overview.grade.name} (${overview.grade.levelBand})`],
        ['Senior Teacher', overview.seniorTeacher?.teacherName || 'Unassigned'],
        ['Active Streams', String(streams.length)],
        ['Total Students', String(streams.reduce((a, s) => a + s.studentsCount, 0))],
        ['Overall Attendance', `${overview.summary.overallAttendancePct}%`],
        ['Academic Mean Score', `${overview.summary.overallAcademicMean}%`],
        ['Syllabus Coverage', `${overview.summary.overallSyllabusCoveragePct}%`],
        ['Open Interventions', String(overview.summary.openInterventionsCount)],
      ];

      const sections: Array<{ title: string; columns: string[]; rows: Array<Array<string | number>> }> = [];

      sections.push({
        title: 'Stream Performance & Class Teacher Comparison',
        columns: [
          'Stream',
          'Class Teacher',
          'Students',
          'Attendance %',
          'Academic Mean %',
          'Assignment Comp %',
          'Syllabus %',
          'Open Interventions',
          'Latest Report',
        ],
        rows: streams.map((s) => [
          s.displayName,
          s.classTeacherName,
          s.studentsCount,
          `${s.attendanceRate}%`,
          `${s.academicMean}%`,
          `${s.assignmentCompletion}%`,
          `${s.syllabusCoverage}%`,
          s.openInterventionsCount,
          s.latestReportStatus.replace(/_/g, ' '),
        ]),
      });

      if (reportType === 'syllabus' || reportType === 'termly' || reportType === 'consolidated') {
        const mon = streamId
          ? overview.recentMonitoring.filter((m: any) => m.stream_id === streamId)
          : overview.recentMonitoring;
        sections.push({
          title: 'Subject Syllabus & Lesson Delivery Breakdown',
          columns: ['Subject', 'Teacher', 'Week', 'Topics Done/Planned', 'Syllabus %', 'Lessons Delivered/Sched', 'Mean Score', 'Weak Areas'],
          rows: mon.map((m: any) => [
            m.subject_name,
            m.teacher_name || 'Assigned Teacher',
            `Wk ${m.week_number}`,
            `${m.topics_completed}/${m.topics_planned}`,
            `${m.syllabus_coverage_pct}%`,
            `${m.lessons_delivered}/${m.lessons_scheduled}`,
            `${m.assessment_mean_score}%`,
            m.weak_areas || 'None flagged',
          ]),
        });
      }

      if (reportType === 'intervention' || reportType === 'termly' || reportType === 'consolidated') {
        const ints = streamId
          ? overview.belowExpectationInterventions.filter((i: any) => i.stream_id === streamId)
          : overview.belowExpectationInterventions;
        sections.push({
          title: 'Student Academic Interventions & Remedial Plans',
          columns: ['Student', 'Subject', 'Category', 'Severity', 'Baseline -> Target', 'Identified Issue', 'Intervention Plan', 'Status'],
          rows: ints.map((i: any) => [
            i.student_name,
            i.subject_name || 'General',
            i.category,
            i.severity,
            `${i.baseline_score ?? '-'} -> ${i.target_score ?? '-'}`,
            i.identified_issue,
            i.intervention_plan,
            i.status,
          ]),
        });
      }

      if (reportType === 'teacher_activity' || reportType === 'weekly' || reportType === 'monthly' || reportType === 'consolidated') {
        const reps = streamId
          ? overview.recentClassReports.filter((r: any) => r.stream_id === streamId)
          : overview.recentClassReports;
        sections.push({
          title: 'Class Teacher Submitted Reports & Review Status',
          columns: ['Report Title', 'Class Teacher', 'Period', 'Type', 'Attendance %', 'Mean %', 'Status', 'Submitted At'],
          rows: reps.map((r: any) => [
            r.title,
            r.class_teacher_name,
            r.period_label,
            r.report_type,
            `${r.attendance_rate}%`,
            `${r.academic_mean}%`,
            r.status.replace(/_/g, ' '),
            r.submitted_at ? r.submitted_at.slice(0, 10) : 'Draft',
          ]),
        });
      }

      if (overview.weakSubjects.length > 0) {
        sections.push({
          title: 'Learning Areas Requiring Focused Support (Weakest First)',
          columns: ['Subject / Learning Area', 'Grade Mean %', 'Streams Evaluated'],
          rows: overview.weakSubjects.map((ws) => [
            ws.subject,
            `${ws.averageScore}%`,
            ws.streamsEvaluated.join(', '),
          ]),
        });
      }

      return res.json({
        success: true,
        reportType,
        title,
        subtitle: `Academic Year ${overview.grade.academicYear} · Generated ${new Date().toLocaleDateString('en-GB')}`,
        summaryPairs,
        sections,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed preparing report export data', message: err?.message });
    }
  });

  app.get('/api/academic/audit-logs', requireAuth, (req: Request, res: Response) => {
    try {
      const session = req.authSession!;
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;
      if (!isSchoolAdmin(session)) {
        return res.status(403).json({ error: 'Only School Administrators can inspect academic audit logs.' });
      }
      const db = getDb();
      const logs = db
        .prepare(`SELECT * FROM academic_audit_logs WHERE school_id = ? ORDER BY created_at DESC LIMIT 100`)
        .all(schoolId);
      return res.json({ success: true, logs });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed loading audit logs', message: err?.message });
    }
  });
}
