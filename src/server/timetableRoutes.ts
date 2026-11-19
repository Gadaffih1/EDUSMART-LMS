import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { getDb, notifyMySqlTablesChanged } from './db.ts';
import {
  requireAuth,
  resolveAuthorizedTenantId,
  sessionHasAnyRole,
  sessionHasRole,
} from './authRoutes.ts';
import { upsertCollectionRecord } from './migrate.ts';
import { broadcastChange } from './realtimeBus.ts';
import {
  classKeyOf,
  enqueueTimetableGenerationJob,
  ensureTenantTimetableSeeded,
  expandRequirementUnits,
  publishVersionEffects,
  safeJsonParse,
  uid,
  validateSingleMoveCandidate,
  validateTimetableVersion,
} from './timetableEngine.ts';

const ADMIN_TIMETABLE_ROLES = new Set([
  'admin',
  'head_teacher',
  'deputy_head',
  'dean_of_studies',
  'curriculum_coordinator',
  'school_admin_staff',
  'senior_teacher',
  'hod',
]);

const APPROVER_ROLES = new Set(['admin', 'head_teacher', 'deputy_head', 'dean_of_studies', 'curriculum_coordinator']);

function requireTimetableAdmin(req: Request, res: Response): boolean {
  const session = req.authSession;
  if (!session) {
    res.status(401).json({ error: 'Authentication required.' });
    return false;
  }
  if (session.isSuperAdmin || sessionHasAnyRole(session, ADMIN_TIMETABLE_ROLES)) {
    return true;
  }
  res.status(403).json({ error: 'Administrator, Dean, or Leadership privileges are required to modify school timetables.' });
  return false;
}

function writeAudit(
  tenantId: string,
  versionId: string | null,
  action: string,
  actorId: string,
  actorName: string,
  actorRole: string,
  details: any = {}
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO tt_audit_logs (id, tenant_id, version_id, action, actor_id, actor_name, actor_role, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(uid('ttaud'), tenantId, versionId, action, actorId, actorName, actorRole, JSON.stringify(details), new Date().toISOString());
}

function hydrateVersionDetail(db: ReturnType<typeof getDb>, versionId: string) {
  const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ?`).get(versionId) as any;
  if (!version) return null;

  const entries = db
    .prepare(`SELECT * FROM tt_entries WHERE version_id = ? ORDER BY day_of_week, period_number, grade, stream`)
    .all(versionId) as any[];
  const unscheduled = db
    .prepare(`SELECT * FROM tt_unscheduled_sessions WHERE version_id = ? ORDER BY grade, stream, subject_name`)
    .all(versionId) as any[];
  const conflicts = db
    .prepare(`SELECT * FROM tt_validation_conflicts WHERE version_id = ? ORDER BY CASE WHEN severity='error' THEN 0 ELSE 1 END, conflict_type`)
    .all(versionId) as any[];
  const jobs = db
    .prepare(`SELECT * FROM tt_generation_jobs WHERE version_id = ? ORDER BY created_at DESC LIMIT 8`)
    .all(versionId) as any[];

  return {
    id: String(version.id),
    tenantId: String(version.tenant_id),
    configId: String(version.config_id),
    versionNumber: Number(version.version_number),
    name: String(version.name),
    status: String(version.status),
    metrics: safeJsonParse<any>(version.metrics_json, {}),
    reviewComments: version.review_comments || '',
    createdBy: String(version.created_by),
    createdByName: version.created_by_name || 'Administrator',
    approvedBy: version.approved_by || null,
    approvedAt: version.approved_at || null,
    publishedBy: version.published_by || null,
    publishedAt: version.published_at || null,
    withdrawnAt: version.withdrawn_at || null,
    parentVersionId: version.parent_version_id || null,
    createdAt: String(version.created_at),
    updatedAt: String(version.updated_at),
    entries: entries.map((e) => ({
      id: String(e.id),
      versionId: String(e.version_id),
      tenantId: String(e.tenant_id),
      dayOfWeek: String(e.day_of_week),
      periodNumber: Number(e.period_number),
      grade: Number(e.grade),
      stream: String(e.stream),
      streamLabel: String(e.stream_label),
      groupId: e.group_id ? String(e.group_id) : null,
      groupName: String(e.group_name || 'Whole Class'),
      jointLessonId: e.joint_lesson_id ? String(e.joint_lesson_id) : null,
      allocationId: e.allocation_id ? String(e.allocation_id) : null,
      subjectName: String(e.subject_name),
      teacherIds: safeJsonParse<string[]>(e.teacher_ids_json, []),
      teacherNames: safeJsonParse<string[]>(e.teacher_names_json, []),
      roomId: e.room_id ? String(e.room_id) : null,
      roomName: e.room_name || 'Assigned Room',
      sessionBlockId: String(e.session_block_id),
      blockLength: Number(e.block_length || 1),
      blockIndex: Number(e.block_index || 0),
      isLocked: Number(e.is_locked) === 1,
      lockedBy: e.locked_by || null,
      notes: e.notes || '',
    })),
    unscheduled: unscheduled.map((u) => ({
      id: String(u.id),
      sessionKey: String(u.session_key),
      allocationId: u.allocation_id || null,
      jointLessonId: u.joint_lesson_id || null,
      grade: Number(u.grade),
      stream: String(u.stream),
      groupId: u.group_id || null,
      groupName: String(u.group_name || 'Whole Class'),
      subjectName: String(u.subject_name),
      teacherIds: safeJsonParse<string[]>(u.teacher_ids_json, []),
      teacherNames: safeJsonParse<string[]>(u.teacher_names_json, []),
      blockLength: Number(u.block_length || 1),
      requiredRoomType: String(u.required_room_type || 'general'),
      reason: String(u.reason),
      diagnostics: safeJsonParse<any>(u.diagnostics_json, {}),
    })),
    conflicts: conflicts.map((c) => ({
      id: String(c.id),
      severity: c.severity as 'error' | 'warning',
      conflictType: String(c.conflict_type),
      dayOfWeek: c.day_of_week || null,
      periodNumber: c.period_number !== null ? Number(c.period_number) : null,
      message: String(c.message),
      details: safeJsonParse<any>(c.details_json, {}),
    })),
    jobs: jobs.map((j) => ({
      id: String(j.id),
      status: String(j.status),
      progressPct: Number(j.progress_pct || 0),
      stageMessage: String(j.stage_message),
      preserveLocked: Number(j.preserve_locked) === 1,
      retries: Number(j.retries || 0),
      diagnostics: safeJsonParse<any>(j.diagnostics_json, {}),
      errorMessage: j.error_message || null,
      startedAt: j.started_at || null,
      completedAt: j.completed_at || null,
      createdAt: String(j.created_at),
    })),
  };
}

export function registerTimetableRoutes(app: Express): void {
  // ------------------------------------------------------------------
  // 1. WORKSPACE BOOTSTRAP (Config, Grades, Rooms, Groups, Teachers, Allocations, Versions)
  // ------------------------------------------------------------------
  app.get('/api/timetable/workspace', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const { configId } = ensureTenantTimetableSeeded(db, tenantId, req.authSession!.userId);

    const cfgRow = db.prepare(`SELECT * FROM tt_configs WHERE id = ?`).get(configId) as any;
    const config = cfgRow
      ? {
          id: String(cfgRow.id),
          tenantId,
          academicYear: String(cfgRow.academic_year),
          term: String(cfgRow.term),
          cycleDays: Number(cfgRow.cycle_days),
          workingDays: safeJsonParse<string[]>(cfgRow.working_days_json, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
          defaultPeriodsPerDay: Number(cfgRow.default_periods_per_day),
          cycleLabel: String(cfgRow.cycle_label),
          activeVersionId: cfgRow.active_version_id || null,
        }
      : null;

    const gradeSchedules = (
      db.prepare(`SELECT * FROM tt_grade_schedules WHERE config_id = ? ORDER BY grade ASC`).all(configId) as any[]
    ).map((g) => ({
      id: String(g.id),
      grade: Number(g.grade),
      periodsPerDay: Number(g.periods_per_day),
      workingDays: safeJsonParse<string[]>(g.working_days_json, config?.workingDays || []),
      assemblyDay: g.assembly_day || 'Monday',
      assemblyPeriod: Number(g.assembly_period || 0),
      customNotes: g.custom_notes || '',
    }));

    const periods = (
      db.prepare(`SELECT * FROM tt_periods WHERE config_id = ? ORDER BY sort_order ASC`).all(configId) as any[]
    ).map((p) => ({
      id: String(p.id),
      gradeBand: String(p.grade_band),
      periodNumber: Number(p.period_number),
      label: String(p.label),
      kind: String(p.kind),
      startTime: String(p.start_time),
      endTime: String(p.end_time),
      sortOrder: Number(p.sort_order),
    }));

    const subjects = (
      db.prepare(`SELECT * FROM tt_subjects WHERE tenant_id = ? ORDER BY name ASC`).all(tenantId) as any[]
    ).map((s) => ({
      id: String(s.id),
      name: String(s.name),
      code: String(s.code),
      department: String(s.department),
      isPractical: Number(s.is_practical) === 1,
      requiresRoomType: String(s.requires_room_type || 'general'),
      colorToken: String(s.color_token || 'slate'),
      isActive: Number(s.is_active) === 1,
    }));

    const rawDepartments = db
      .prepare(`SELECT * FROM tt_departments WHERE tenant_id = ? ORDER BY name ASC`)
      .all(tenantId) as any[];

    // Auto-link any department missing hod_user_id when a tenant HoD user already belongs to that department
    const tenantUsersForHod = db
      .prepare(`SELECT id, name, role, payload_json FROM users WHERE school_id = ? AND is_active = 1`)
      .all(tenantId) as any[];
    const hodUsersByDept = new Map<string, { id: string; name: string }>();
    for (const u of tenantUsersForHod) {
      const payload = safeJsonParse<Record<string, any>>(u.payload_json, {});
      const roleLower = String(u.role || '').toLowerCase();
      const assignedRoles = Array.isArray(payload.assignedRoles) ? payload.assignedRoles.map((r: any) => String(r).toLowerCase()) : [];
      const deptName = String(payload.department || '').trim().toLowerCase();
      if (deptName && (roleLower === 'hod' || assignedRoles.includes('hod'))) {
        if (!hodUsersByDept.has(deptName)) {
          hodUsersByDept.set(deptName, { id: String(u.id), name: String(u.name || payload.name || '') });
        }
      }
    }

    const departments = rawDepartments.map((d) => {
      let hodUserId = String(d.hod_user_id || '').trim();
      let headName = String(d.head_name || '').trim();
      if (!hodUserId) {
        const matchedHod = hodUsersByDept.get(String(d.name || '').trim().toLowerCase());
        if (matchedHod) {
          hodUserId = matchedHod.id;
          headName = matchedHod.name || headName;
          try {
            db.prepare(`UPDATE tt_departments SET hod_user_id = ?, head_name = ? WHERE id = ? AND tenant_id = ?`).run(
              hodUserId,
              headName,
              d.id,
              tenantId
            );
          } catch {
            // non-fatal backfill
          }
        }
      }
      return {
        id: String(d.id),
        name: String(d.name),
        code: String(d.code || ''),
        hodUserId,
        headName,
        description: String(d.description || ''),
        isActive: Number(d.is_active) === 1,
      };
    });

    const classrooms = (
      db.prepare(`SELECT * FROM tt_classrooms WHERE tenant_id = ? ORDER BY room_type, name ASC`).all(tenantId) as any[]
    ).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      roomCode: String(r.room_code),
      roomType: String(r.room_type),
      capacity: Number(r.capacity),
      location: String(r.location || 'Main Block'),
      assignedGrade: r.assigned_grade !== null ? Number(r.assigned_grade) : null,
      assignedStream: r.assigned_stream || null,
      availability: safeJsonParse<Record<string, Record<string, boolean>>>(r.availability_json, {}),
      isActive: Number(r.is_active) === 1,
    }));

    const studentGroups = (
      db.prepare(`SELECT * FROM tt_student_groups WHERE tenant_id = ? ORDER BY grade, stream, is_whole_class DESC, group_name`).all(tenantId) as any[]
    ).map((g) => ({
      id: String(g.id),
      grade: Number(g.grade),
      stream: String(g.stream),
      groupName: String(g.group_name),
      groupCode: String(g.group_code),
      studentCount: Number(g.student_count),
      isWholeClass: Number(g.is_whole_class) === 1,
      parentClassKey: String(g.parent_class_key),
    }));

    const teachers = (
      db.prepare(`SELECT * FROM tt_teacher_profiles WHERE tenant_id = ? ORDER BY active_in_timetable DESC, teacher_name ASC`).all(tenantId) as any[]
    ).map((t) => ({
      id: String(t.id),
      userId: String(t.user_id),
      teacherName: String(t.teacher_name),
      teacherEmail: String(t.teacher_email),
      tscNumber: t.tsc_number || '',
      department: String(t.department || 'Academic'),
      qualifiedSubjects: safeJsonParse<string[]>(t.qualified_subjects_json, []),
      availability: safeJsonParse<Record<string, Record<string, boolean>>>(t.availability_json, {}),
      maxDailyPeriods: Number(t.max_daily_periods || 6),
      maxWeeklyPeriods: Number(t.max_weekly_periods || 28),
      maxConsecutiveLessons: Number(t.max_consecutive_lessons || 3),
      preferredFreePeriods: safeJsonParse<Array<{ day: string; period: number }>>(t.preferred_free_periods_json, []),
      activeInTimetable: Number(t.active_in_timetable) === 1,
      archivedAt: t.archived_at || null,
    }));

    const gradeAllocations = (
      db.prepare(`SELECT * FROM tt_grade_subject_allocations WHERE config_id = ? ORDER BY grade, subject_name`).all(configId) as any[]
    ).map((a) => ({
      id: String(a.id),
      grade: Number(a.grade),
      subjectName: String(a.subject_name),
      requiredWeeklyPeriods: Number(a.required_weekly_periods),
      singleLessons: Number(a.single_lessons),
      doubleLessons: Number(a.double_lessons),
      tripleLessons: Number(a.triple_lessons),
      patternPreference: String(a.pattern_preference || 'spread'),
      maxPerDay: Number(a.max_per_day || 1),
      minSpacingDays: Number(a.min_spacing_days || 0),
      preferredDays: safeJsonParse<string[]>(a.preferred_days_json, []),
      preferredPeriods: safeJsonParse<number[]>(a.preferred_periods_json, []),
      requiredRoomType: String(a.required_room_type || 'general'),
      defaultRoomId: a.default_room_id || null,
      teacherIds: safeJsonParse<string[]>(a.teacher_ids_json, []),
      studentGroupLabel: String(a.student_group_label || 'Whole Class'),
      isActive: Number(a.is_active) === 1,
    }));

    const streamAllocations = (
      db.prepare(`SELECT * FROM tt_stream_subject_allocations WHERE config_id = ? ORDER BY grade, stream, subject_name`).all(configId) as any[]
    ).map((a) => ({
      id: String(a.id),
      grade: Number(a.grade),
      stream: String(a.stream),
      groupId: a.group_id || null,
      subjectName: String(a.subject_name),
      inheritedFromId: a.inherited_from_id || null,
      isOverridden: Number(a.is_overridden) === 1,
      requiredWeeklyPeriods: Number(a.required_weekly_periods),
      singleLessons: Number(a.single_lessons),
      doubleLessons: Number(a.double_lessons),
      tripleLessons: Number(a.triple_lessons),
      patternPreference: String(a.pattern_preference || 'spread'),
      maxPerDay: Number(a.max_per_day || 1),
      minSpacingDays: Number(a.min_spacing_days || 0),
      preferredDays: safeJsonParse<string[]>(a.preferred_days_json, []),
      preferredPeriods: safeJsonParse<number[]>(a.preferred_periods_json, []),
      requiredRoomType: String(a.required_room_type || 'general'),
      roomId: a.room_id || null,
      teacherIds: safeJsonParse<string[]>(a.teacher_ids_json, []),
      isActive: Number(a.is_active) === 1,
    }));

    const jointLessons = (
      db.prepare(`SELECT * FROM tt_joint_lessons WHERE config_id = ? ORDER BY title ASC`).all(configId) as any[]
    ).map((j) => ({
      id: String(j.id),
      title: String(j.title),
      subjectName: String(j.subject_name),
      participatingClasses: safeJsonParse<Array<{ grade: number; stream: string }>>(j.participating_classes_json, []),
      teacherIds: safeJsonParse<string[]>(j.teacher_ids_json, []),
      weeklyPeriods: Number(j.weekly_periods),
      lessonLength: Number(j.lesson_length),
      roomId: j.room_id || null,
      requiredRoomType: String(j.required_room_type || 'hall'),
      combinedStudents: Number(j.combined_students || 0),
      preferredDays: safeJsonParse<string[]>(j.preferred_days_json, []),
      preferredPeriods: safeJsonParse<number[]>(j.preferred_periods_json, []),
      isActive: Number(j.is_active) === 1,
    }));

    const versionsSummary = (
      db.prepare(`SELECT * FROM tt_versions WHERE config_id = ? ORDER BY version_number DESC, updated_at DESC`).all(configId) as any[]
    ).map((v) => ({
      id: String(v.id),
      versionNumber: Number(v.version_number),
      name: String(v.name),
      status: String(v.status),
      metrics: safeJsonParse<any>(v.metrics_json, {}),
      reviewComments: v.review_comments || '',
      createdByName: v.created_by_name || 'Administrator',
      approvedBy: v.approved_by || null,
      approvedAt: v.approved_at || null,
      publishedBy: v.published_by || null,
      publishedAt: v.published_at || null,
      withdrawnAt: v.withdrawn_at || null,
      createdAt: String(v.created_at),
      updatedAt: String(v.updated_at),
    }));

    const activeVersionId =
      (req.query.versionId as string) ||
      config?.activeVersionId ||
      versionsSummary[0]?.id ||
      null;
    const activeVersion = activeVersionId ? hydrateVersionDetail(db, activeVersionId) : null;

    const auditLogs = (
      db.prepare(`SELECT * FROM tt_audit_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 40`).all(tenantId) as any[]
    ).map((a) => ({
      id: String(a.id),
      versionId: a.version_id || null,
      action: String(a.action),
      actorName: a.actor_name || a.actor_id,
      actorRole: a.actor_role || '',
      details: safeJsonParse<any>(a.details_json, {}),
      createdAt: String(a.created_at),
    }));

    const { allocationIssues, streamLoadSummary } = expandRequirementUnits(db, tenantId, configId);

    res.json({
      tenantId,
      config,
      gradeSchedules,
      periods,
      subjects,
      departments,
      classrooms,
      studentGroups,
      teachers,
      gradeAllocations,
      streamAllocations,
      jointLessons,
      versions: versionsSummary,
      activeVersion,
      allocationIssues,
      streamLoadSummary,
      auditLogs,
    });
  });

  // ------------------------------------------------------------------
  // 1b. RESET & RE-ENABLE TIMETABLE WORKSPACE (Fresh Editable Draft + Optional CBC Allocation Reset)
  // ------------------------------------------------------------------
  app.post('/api/timetable/workspace/reset', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const actorId = req.authSession!.userId;
    const actorName = String(req.authSession!.user?.name || 'Administrator');
    const actorRole = String(req.authSession!.role || 'admin');
    const resetAllocations = Boolean(req.body?.resetAllocations);
    const now = new Date().toISOString();

    const { configId } = ensureTenantTimetableSeeded(db, tenantId, actorId);

    let newVerId = '';
    let nextNum = 1;
    let newName = '';

    db.exec('BEGIN IMMEDIATE');
    try {
      // 1. Cancel any stale queued or running generation jobs so the Auto-Solver is never stuck
      db.prepare(
        `UPDATE tt_generation_jobs
         SET status = 'cancelled', stage_message = 'Cleared during timetable workspace reset', completed_at = ?
         WHERE tenant_id = ? AND status IN ('queued', 'running')`
      ).run(now, tenantId);

      // 2. Optionally reset grade & stream allocations to clean CBC Grade-Band defaults (Grades 1-3, 4-6, 7-9)
      if (resetAllocations) {
        db.prepare(`DELETE FROM tt_stream_subject_allocations WHERE config_id = ? AND tenant_id = ?`).run(configId, tenantId);
        db.prepare(`DELETE FROM tt_grade_subject_allocations WHERE config_id = ? AND tenant_id = ?`).run(configId, tenantId);
      }

      // 3. Create a fresh unlocked editable Draft version and make it active
      const maxVer = (db.prepare(`SELECT MAX(version_number) as m FROM tt_versions WHERE config_id = ?`).get(configId) as any)?.m || 0;
      nextNum = Number(maxVer) + 1;
      newVerId = uid('ttver');
      newName = resetAllocations
        ? `Reset CBC Master Draft v${nextNum}`
        : `Fresh Editable Draft v${nextNum}`;

      db.prepare(
        `INSERT INTO tt_versions
           (id, tenant_id, config_id, version_number, name, status, metrics_json, review_comments, created_by, created_by_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'draft', '{}', '', ?, ?, ?, ?)`
      ).run(newVerId, tenantId, configId, nextNum, newName, actorId, actorName, now, now);

      db.prepare(`UPDATE tt_configs SET active_version_id = ?, updated_by = ?, updated_at = ? WHERE id = ?`).run(
        newVerId,
        actorId,
        now,
        configId
      );

      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    // 4. Re-seed any missing subjects (incl. French, Swimming, Library Lesson, Arts, Music, Nutrition), departments, teachers, and (if cleared) allocations
    ensureTenantTimetableSeeded(db, tenantId, actorId);
    validateTimetableVersion(db, newVerId);
    writeAudit(tenantId, newVerId, 'WORKSPACE_RESET', actorId, actorName, actorRole, {
      resetAllocations,
      versionNumber: nextNum,
      versionName: newName,
    });
    notifyMySqlTablesChanged([
      'tt_configs',
      'tt_versions',
      'tt_generation_jobs',
      'tt_subjects',
      'tt_departments',
      'tt_grade_subject_allocations',
      'tt_stream_subject_allocations',
      'tt_validation_conflicts',
      'tt_audit_logs',
    ]);

    res.json({
      ok: true,
      versionId: newVerId,
      versionNumber: nextNum,
      versionName: newName,
      resetAllocations,
    });
  });

  // ------------------------------------------------------------------
  // 2. CONFIGURATION, BELL PERIODS & GRADE SCHEDULES
  // ------------------------------------------------------------------
  app.put('/api/timetable/config', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const { configId } = ensureTenantTimetableSeeded(db, tenantId, req.authSession!.userId);
    const {
      academicYear = '2026',
      term = 'Term 1',
      cycleDays = 5,
      workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      defaultPeriodsPerDay = 8,
      cycleLabel = 'Weekly Cycle',
      periods,
      gradeSchedules,
    } = req.body || {};

    const now = new Date().toISOString();
    const daysClean = Array.isArray(workingDays) && workingDays.length > 0 ? workingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(
        `UPDATE tt_configs
         SET academic_year = ?, term = ?, cycle_days = ?, working_days_json = ?, default_periods_per_day = ?, cycle_label = ?, updated_by = ?, updated_at = ?
         WHERE id = ? AND tenant_id = ?`
      ).run(
        String(academicYear),
        String(term),
        Number(cycleDays || daysClean.length),
        JSON.stringify(daysClean),
        Number(defaultPeriodsPerDay || 8),
        String(cycleLabel),
        req.authSession!.userId,
        now,
        configId,
        tenantId
      );

      if (Array.isArray(periods) && periods.length > 0) {
        db.prepare(`DELETE FROM tt_periods WHERE config_id = ?`).run(configId);
        const insP = db.prepare(
          `INSERT INTO tt_periods (id, tenant_id, config_id, grade_band, period_number, label, kind, start_time, end_time, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        periods.forEach((p: any, idx: number) => {
          insP.run(
            p.id || uid('ttp'),
            tenantId,
            configId,
            String(p.gradeBand || 'all'),
            Number(p.kind === 'lesson' ? p.periodNumber : 0),
            String(p.label || `Period ${idx + 1}`),
            String(p.kind || 'lesson'),
            String(p.startTime || '08:00'),
            String(p.endTime || '08:40'),
            Number(p.sortOrder ?? idx + 1)
          );
        });
      }

      if (Array.isArray(gradeSchedules)) {
        for (const gs of gradeSchedules) {
          db.prepare(
            `INSERT INTO tt_grade_schedules (id, tenant_id, config_id, grade, periods_per_day, working_days_json, assembly_day, assembly_period, custom_notes, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(config_id, grade) DO UPDATE SET
               periods_per_day = excluded.periods_per_day,
               working_days_json = excluded.working_days_json,
               assembly_day = excluded.assembly_day,
               assembly_period = excluded.assembly_period,
               custom_notes = excluded.custom_notes,
               updated_at = excluded.updated_at`
          ).run(
            gs.id || uid('ttgs'),
            tenantId,
            configId,
            Number(gs.grade),
            Number(gs.periodsPerDay || defaultPeriodsPerDay || 8),
            JSON.stringify(Array.isArray(gs.workingDays) && gs.workingDays.length > 0 ? gs.workingDays : daysClean),
            String(gs.assemblyDay || 'Monday'),
            Number(gs.assemblyPeriod || 0),
            String(gs.customNotes || ''),
            now
          );
        }
      }

      writeAudit(
        tenantId,
        null,
        'CONFIG_UPDATED',
        req.authSession!.userId,
        String(req.authSession!.user.name || 'Admin'),
        String(req.authSession!.role),
        { academicYear, term, cycleDays, defaultPeriodsPerDay }
      );
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    notifyMySqlTablesChanged(['tt_configs', 'tt_periods', 'tt_grade_schedules', 'tt_audit_logs']);
    res.json({ ok: true, configId });
  });

  // ------------------------------------------------------------------
  // 3. CLASSROOMS, SUBJECTS & STUDENT GROUPS
  // ------------------------------------------------------------------
  app.post('/api/timetable/classrooms', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const b = req.body || {};
    if (!b.name || !b.roomCode) {
      res.status(400).json({ error: 'Room name and room code are required.' });
      return;
    }
    const id = uid('ttrm');
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO tt_classrooms (id, tenant_id, name, room_code, room_type, capacity, location, assigned_grade, assigned_stream, availability_json, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      tenantId,
      String(b.name).trim(),
      String(b.roomCode).trim(),
      String(b.roomType || 'general'),
      Math.max(5, Number(b.capacity || 45)),
      String(b.location || 'Main Block'),
      b.assignedGrade ? Number(b.assignedGrade) : null,
      b.assignedStream ? String(b.assignedStream) : null,
      JSON.stringify(b.availability || {}),
      b.isActive === false ? 0 : 1,
      now
    );
    notifyMySqlTablesChanged(['tt_classrooms']);
    res.status(201).json({ id });
  });

  app.put('/api/timetable/classrooms/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const b = req.body || {};
    db.prepare(
      `UPDATE tt_classrooms
       SET name = COALESCE(?, name),
           room_code = COALESCE(?, room_code),
           room_type = COALESCE(?, room_type),
           capacity = COALESCE(?, capacity),
           location = COALESCE(?, location),
           assigned_grade = ?,
           assigned_stream = ?,
           availability_json = COALESCE(?, availability_json),
           is_active = COALESCE(?, is_active),
           updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).run(
      b.name ?? null,
      b.roomCode ?? null,
      b.roomType ?? null,
      b.capacity !== undefined ? Number(b.capacity) : null,
      b.location ?? null,
      b.assignedGrade ? Number(b.assignedGrade) : null,
      b.assignedStream || null,
      b.availability ? JSON.stringify(b.availability) : null,
      b.isActive !== undefined ? (b.isActive ? 1 : 0) : null,
      new Date().toISOString(),
      req.params.id,
      tenantId
    );
    notifyMySqlTablesChanged(['tt_classrooms']);
    res.json({ ok: true });
  });

  app.delete('/api/timetable/classrooms/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    db.prepare(`DELETE FROM tt_classrooms WHERE id = ? AND tenant_id = ?`).run(req.params.id, tenantId);
    notifyMySqlTablesChanged(['tt_classrooms']);
    res.json({ ok: true });
  });

  app.post('/api/timetable/subjects', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const b = req.body || {};
    const cleanName = String(b.name || '').trim();
    if (!cleanName) {
      res.status(400).json({ error: 'Subject name is required.' });
      return;
    }
    const id = uid('ttsub');
    const code = String(b.code || cleanName.split(/\s+/).map((w) => w[0]).join('').slice(0, 4).toUpperCase());
    const deptName = String(b.department || 'Core Academic').trim() || 'Core Academic';
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO tt_subjects (id, tenant_id, name, code, department, is_practical, requires_room_type, color_token, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
       ON CONFLICT(tenant_id, lower(name)) DO UPDATE SET
         code = excluded.code,
         department = excluded.department,
         is_practical = excluded.is_practical,
         requires_room_type = excluded.requires_room_type,
         color_token = excluded.color_token,
         updated_at = excluded.updated_at`
    ).run(
      id,
      tenantId,
      cleanName,
      code,
      deptName,
      b.isPractical ? 1 : 0,
      String(b.requiresRoomType || 'general'),
      String(b.colorToken || 'slate'),
      now
    );

    // Ensure department exists in tt_departments too
    db.prepare(
      `INSERT OR IGNORE INTO tt_departments (id, tenant_id, name, code, head_name, description, is_active, updated_at)
       VALUES (?, ?, ?, ?, '', 'Academic department', 1, ?)`
    ).run(uid('ttdept'), tenantId, deptName, deptName.slice(0, 4).toUpperCase(), now);

    writeAudit(tenantId, null, 'SUBJECT_ADDED', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), req.authSession!.role, {
      name: cleanName,
      code,
      department: deptName,
    });
    notifyMySqlTablesChanged(['tt_subjects', 'tt_departments']);
    res.status(201).json({ ok: true, id });
  });

  app.put('/api/timetable/subjects/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const existing = db
      .prepare(`SELECT * FROM tt_subjects WHERE id = ? AND tenant_id = ?`)
      .get(req.params.id, tenantId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Subject not found.' });
      return;
    }

    const b = req.body || {};
    const nextName = String(b.name ?? existing.name).trim();
    if (!nextName) {
      res.status(400).json({ error: 'Subject name cannot be empty.' });
      return;
    }

    const dup = db
      .prepare(`SELECT id FROM tt_subjects WHERE tenant_id = ? AND lower(name) = lower(?) AND id != ?`)
      .get(tenantId, nextName, req.params.id) as any;
    if (dup) {
      res.status(409).json({ error: `A subject named "${nextName}" already exists.` });
      return;
    }

    const nextCode = String(b.code ?? existing.code).trim() || nextName.slice(0, 4).toUpperCase();
    const nextDept = String(b.department ?? existing.department).trim() || 'Core Academic';
    const nextPractical = b.isPractical !== undefined ? (b.isPractical ? 1 : 0) : Number(existing.is_practical);
    const nextRoomType = String(b.requiresRoomType ?? existing.requires_room_type ?? 'general');
    const nextColor = String(b.colorToken ?? existing.color_token ?? 'slate');
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE tt_subjects
       SET name = ?, code = ?, department = ?, is_practical = ?, requires_room_type = ?, color_token = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).run(nextName, nextCode, nextDept, nextPractical, nextRoomType, nextColor, now, req.params.id, tenantId);

    // Cascade subject rename across allocations & teacher qualifications
    if (String(existing.name).toLowerCase() !== nextName.toLowerCase()) {
      db.prepare(
        `UPDATE tt_grade_subject_allocations SET subject_name = ?, updated_at = ? WHERE tenant_id = ? AND lower(subject_name) = lower(?)`
      ).run(nextName, now, tenantId, existing.name);
      db.prepare(
        `UPDATE tt_stream_subject_allocations SET subject_name = ?, updated_at = ? WHERE tenant_id = ? AND lower(subject_name) = lower(?)`
      ).run(nextName, now, tenantId, existing.name);
      db.prepare(
        `UPDATE tt_joint_lessons SET subject_name = ?, updated_at = ? WHERE tenant_id = ? AND lower(subject_name) = lower(?)`
      ).run(nextName, now, tenantId, existing.name);
    }

    writeAudit(tenantId, null, 'SUBJECT_UPDATED', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), req.authSession!.role, {
      id: req.params.id,
      previousName: existing.name,
      name: nextName,
      department: nextDept,
    });
    notifyMySqlTablesChanged(['tt_subjects', 'tt_grade_subject_allocations', 'tt_stream_subject_allocations', 'tt_joint_lessons']);
    res.json({ ok: true });
  });

  app.delete('/api/timetable/subjects/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const existing = db
      .prepare(`SELECT * FROM tt_subjects WHERE id = ? AND tenant_id = ?`)
      .get(req.params.id, tenantId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Subject not found.' });
      return;
    }

    db.prepare(`DELETE FROM tt_subjects WHERE id = ? AND tenant_id = ?`).run(req.params.id, tenantId);
    db.prepare(`DELETE FROM tt_grade_subject_allocations WHERE tenant_id = ? AND lower(subject_name) = lower(?)`).run(tenantId, existing.name);
    db.prepare(`DELETE FROM tt_stream_subject_allocations WHERE tenant_id = ? AND lower(subject_name) = lower(?)`).run(tenantId, existing.name);

    writeAudit(tenantId, null, 'SUBJECT_DELETED', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), req.authSession!.role, {
      id: req.params.id,
      name: existing.name,
    });
    notifyMySqlTablesChanged(['tt_subjects', 'tt_grade_subject_allocations', 'tt_stream_subject_allocations']);
    res.json({ ok: true });
  });

  // ------------------------------------------------------------------
  // 3b. MASTER TIMETABLE DEPARTMENTS CRUD
  // ------------------------------------------------------------------
  // Helper: sync a department's linked HoD user record & teacher profile cleanly
  const syncDepartmentHodLink = (
    db: ReturnType<typeof getDb>,
    tenantId: string,
    deptName: string,
    requestedHodUserId: string,
    fallbackHeadName: string,
    now: string
  ): { hodUserId: string; headName: string } => {
    const cleanHodId = String(requestedHodUserId || '').trim();
    if (!cleanHodId) {
      return { hodUserId: '', headName: String(fallbackHeadName || '').trim() };
    }
    const uRow = db
      .prepare(`SELECT id, name, role, email, payload_json FROM users WHERE id = ? AND school_id = ?`)
      .get(cleanHodId, tenantId) as any;
    if (!uRow) {
      return { hodUserId: cleanHodId, headName: String(fallbackHeadName || '').trim() };
    }
    const resolvedName = String(uRow.name || fallbackHeadName || '').trim();
    const payload = safeJsonParse<Record<string, any>>(uRow.payload_json, {});
    const roleLower = String(uRow.role || '').toLowerCase();
    const existingAssigned = Array.isArray(payload.assignedRoles) ? payload.assignedRoles.map(String) : [];
    const nextAssigned =
      roleLower === 'hod' || existingAssigned.some((r) => r.toLowerCase() === 'hod')
        ? existingAssigned
        : [...existingAssigned, 'hod'];
    const nextPayload = {
      ...payload,
      department: deptName,
      assignedRoles: nextAssigned,
    };
    db.prepare(`UPDATE users SET payload_json = ?, updated_at = ? WHERE id = ? AND school_id = ?`).run(
      JSON.stringify(nextPayload),
      now,
      cleanHodId,
      tenantId
    );
    db.prepare(
      `UPDATE tt_teacher_profiles SET department = ?, updated_at = ?
       WHERE tenant_id = ? AND (user_id = ? OR lower(teacher_email) = lower(?))`
    ).run(deptName, now, tenantId, cleanHodId, String(uRow.email || ''));

    return { hodUserId: cleanHodId, headName: resolvedName };
  };

  app.post('/api/timetable/departments', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const b = req.body || {};
    const cleanName = String(b.name || '').trim();
    if (!cleanName) {
      res.status(400).json({ error: 'Department name is required.' });
      return;
    }
    const existing = db
      .prepare(`SELECT id FROM tt_departments WHERE tenant_id = ? AND lower(name) = lower(?)`)
      .get(tenantId, cleanName) as any;
    if (existing) {
      res.status(409).json({ error: `Department "${cleanName}" already exists.` });
      return;
    }
    const id = uid('ttdept');
    const code = String(b.code || cleanName.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 5));
    const now = new Date().toISOString();
    const linked = syncDepartmentHodLink(db, tenantId, cleanName, String(b.hodUserId || ''), String(b.headName || ''), now);

    db.prepare(
      `INSERT INTO tt_departments (id, tenant_id, name, code, hod_user_id, head_name, description, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(id, tenantId, cleanName, code, linked.hodUserId, linked.headName, String(b.description || '').trim(), now);

    writeAudit(tenantId, null, 'DEPARTMENT_ADDED', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), req.authSession!.role, {
      id,
      name: cleanName,
      code,
      hodUserId: linked.hodUserId,
      headName: linked.headName,
    });
    notifyMySqlTablesChanged(['tt_departments', 'users', 'tt_teacher_profiles']);
    res.status(201).json({ ok: true, id, hodUserId: linked.hodUserId, headName: linked.headName });
  });

  app.put('/api/timetable/departments/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const existing = db
      .prepare(`SELECT * FROM tt_departments WHERE id = ? AND tenant_id = ?`)
      .get(req.params.id, tenantId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    const b = req.body || {};
    const nextName = String(b.name ?? existing.name).trim();
    if (!nextName) {
      res.status(400).json({ error: 'Department name cannot be empty.' });
      return;
    }
    const dup = db
      .prepare(`SELECT id FROM tt_departments WHERE tenant_id = ? AND lower(name) = lower(?) AND id != ?`)
      .get(tenantId, nextName, req.params.id) as any;
    if (dup) {
      res.status(409).json({ error: `Department "${nextName}" already exists.` });
      return;
    }

    const nextCode = String(b.code ?? existing.code).trim();
    const nextDesc = String(b.description ?? existing.description ?? '').trim();
    const now = new Date().toISOString();

    const requestedHodId = b.hodUserId !== undefined ? String(b.hodUserId || '').trim() : String(existing.hod_user_id || '').trim();
    const fallbackHead = b.headName !== undefined ? String(b.headName || '').trim() : String(existing.head_name || '').trim();
    const linked = syncDepartmentHodLink(db, tenantId, nextName, requestedHodId, fallbackHead, now);

    db.prepare(
      `UPDATE tt_departments
       SET name = ?, code = ?, hod_user_id = ?, head_name = ?, description = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).run(nextName, nextCode, linked.hodUserId, linked.headName, nextDesc, now, req.params.id, tenantId);

    // Cascade department rename to subjects and teacher timetable profiles
    if (String(existing.name).toLowerCase() !== nextName.toLowerCase()) {
      db.prepare(
        `UPDATE tt_subjects SET department = ?, updated_at = ? WHERE tenant_id = ? AND lower(department) = lower(?)`
      ).run(nextName, now, tenantId, existing.name);
      db.prepare(
        `UPDATE tt_teacher_profiles SET department = ?, updated_at = ? WHERE tenant_id = ? AND lower(department) = lower(?)`
      ).run(nextName, now, tenantId, existing.name);
    }

    writeAudit(tenantId, null, 'DEPARTMENT_UPDATED', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), req.authSession!.role, {
      id: req.params.id,
      previousName: existing.name,
      name: nextName,
      hodUserId: linked.hodUserId,
      headName: linked.headName,
    });
    notifyMySqlTablesChanged(['tt_departments', 'tt_subjects', 'tt_teacher_profiles', 'users']);
    res.json({ ok: true, hodUserId: linked.hodUserId, headName: linked.headName });
  });

  app.delete('/api/timetable/departments/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const existing = db
      .prepare(`SELECT * FROM tt_departments WHERE id = ? AND tenant_id = ?`)
      .get(req.params.id, tenantId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }
    const now = new Date().toISOString();
    db.prepare(`DELETE FROM tt_departments WHERE id = ? AND tenant_id = ?`).run(req.params.id, tenantId);
    // Reassign orphaned subjects cleanly to Core Academic
    db.prepare(
      `UPDATE tt_subjects SET department = 'Core Academic', updated_at = ? WHERE tenant_id = ? AND lower(department) = lower(?)`
    ).run(now, tenantId, existing.name);

    writeAudit(tenantId, null, 'DEPARTMENT_DELETED', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), req.authSession!.role, {
      id: req.params.id,
      name: existing.name,
    });
    notifyMySqlTablesChanged(['tt_departments', 'tt_subjects']);
    res.json({ ok: true });
  });

  app.post('/api/timetable/groups', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const b = req.body || {};
    if (!b.grade || !b.stream || !b.groupName) {
      res.status(400).json({ error: 'Grade, stream, and groupName are required.' });
      return;
    }
    const grade = Number(b.grade);
    const stream = String(b.stream).trim();
    const ck = classKeyOf(grade, stream);
    const id = uid('ttgrp');
    db.prepare(
      `INSERT INTO tt_student_groups (id, tenant_id, grade, stream, group_name, group_code, student_count, is_whole_class, parent_class_key, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      tenantId,
      grade,
      stream,
      String(b.groupName).trim(),
      String(b.groupCode || `${ck}-${String(b.groupName).slice(0, 4).toUpperCase()}`),
      Math.max(1, Number(b.studentCount || 20)),
      b.isWholeClass ? 1 : 0,
      ck,
      new Date().toISOString()
    );
    notifyMySqlTablesChanged(['tt_student_groups']);
    res.status(201).json({ id });
  });

  app.delete('/api/timetable/groups/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const row = db.prepare(`SELECT is_whole_class FROM tt_student_groups WHERE id = ? AND tenant_id = ?`).get(req.params.id, tenantId) as any;
    if (row && Number(row.is_whole_class) === 1) {
      res.status(400).json({ error: 'Cannot delete primary Whole Class cohort group.' });
      return;
    }
    db.prepare(`DELETE FROM tt_student_groups WHERE id = ? AND tenant_id = ?`).run(req.params.id, tenantId);
    notifyMySqlTablesChanged(['tt_student_groups']);
    res.json({ ok: true });
  });

  // ------------------------------------------------------------------
  // 4. TEACHER TIMETABLE PROFILES (Linked to existing HR/User records)
  // ------------------------------------------------------------------
  app.put('/api/timetable/teachers/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const b = req.body || {};
    const now = new Date().toISOString();
    const activeVal = b.activeInTimetable !== undefined ? (b.activeInTimetable ? 1 : 0) : null;
    const archivedVal = b.activeInTimetable === false ? now : b.activeInTimetable === true ? null : undefined;

    db.prepare(
      `UPDATE tt_teacher_profiles
       SET department = COALESCE(?, department),
           qualified_subjects_json = COALESCE(?, qualified_subjects_json),
           availability_json = COALESCE(?, availability_json),
           max_daily_periods = COALESCE(?, max_daily_periods),
           max_weekly_periods = COALESCE(?, max_weekly_periods),
           max_consecutive_lessons = COALESCE(?, max_consecutive_lessons),
           preferred_free_periods_json = COALESCE(?, preferred_free_periods_json),
           active_in_timetable = COALESCE(?, active_in_timetable),
           archived_at = CASE WHEN ? IS NOT NULL THEN ? ELSE archived_at END,
           updated_at = ?
       WHERE id = ? AND tenant_id = ?`
    ).run(
      b.department ?? null,
      b.qualifiedSubjects ? JSON.stringify(b.qualifiedSubjects) : null,
      b.availability ? JSON.stringify(b.availability) : null,
      b.maxDailyPeriods !== undefined ? Number(b.maxDailyPeriods) : null,
      b.maxWeeklyPeriods !== undefined ? Number(b.maxWeeklyPeriods) : null,
      b.maxConsecutiveLessons !== undefined ? Number(b.maxConsecutiveLessons) : null,
      b.preferredFreePeriods ? JSON.stringify(b.preferredFreePeriods) : null,
      activeVal,
      archivedVal !== undefined ? (archivedVal || '') : null,
      archivedVal || null,
      now,
      req.params.id,
      tenantId
    );

    writeAudit(
      tenantId,
      null,
      'TEACHER_PROFILE_UPDATED',
      req.authSession!.userId,
      String(req.authSession!.user.name || 'Admin'),
      String(req.authSession!.role),
      { teacherId: req.params.id, activeInTimetable: b.activeInTimetable }
    );
    notifyMySqlTablesChanged(['tt_teacher_profiles', 'tt_audit_logs']);
    res.json({ ok: true });
  });

  // ------------------------------------------------------------------
  // 5. GRADE TEMPLATES, APPLY TEMPLATE & STREAM OVERRIDES + JOINT LESSONS
  // ------------------------------------------------------------------
  app.put('/api/timetable/allocations/grade', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const { configId } = ensureTenantTimetableSeeded(db, tenantId, req.authSession!.userId);
    const b = req.body || {};
    const targetGradesRaw: number[] = Array.isArray(b.targetGrades) && b.targetGrades.length > 0
      ? Array.from(new Set<number>(b.targetGrades.map((g: any) => Number(g)).filter((g: number) => Number.isFinite(g) && g >= 1 && g <= 12)))
      : b.grade
      ? [Number(b.grade)]
      : [];

    if (targetGradesRaw.length === 0 || !b.subjectName) {
      res.status(400).json({ error: 'Target grade(s) and subjectName are required.' });
      return;
    }

    const subjectName = String(b.subjectName).trim();
    const isActive = b.isActive !== false;

    for (const g of targetGradesRaw) {
      const gradeSched = db
        .prepare(`SELECT periods_per_day, working_days_json, assembly_period FROM tt_grade_schedules WHERE config_id = ? AND grade = ?`)
        .get(configId, g) as any;
      if (!gradeSched) {
        res.status(400).json({ error: `Grade ${g} is not an active configured grade in timetable setup.` });
        return;
      }
    }

    const activeSubjectCount = (db.prepare(`SELECT COUNT(*) as c FROM tt_subjects WHERE tenant_id = ? AND is_active = 1`).get(tenantId) as any)?.c || 0;
    if (activeSubjectCount > 0) {
      const subjRow = db
        .prepare(`SELECT id FROM tt_subjects WHERE tenant_id = ? AND is_active = 1 AND lower(name) = lower(?) LIMIT 1`)
        .get(tenantId, subjectName);
      if (!subjRow) {
        res.status(400).json({ error: `Subject "${subjectName}" is not an active subject in the school curriculum catalog.` });
        return;
      }
    }

    const teacherIds: string[] = Array.isArray(b.teacherIds)
      ? Array.from(new Set<string>(b.teacherIds.map((x: any) => String(x || '').trim()).filter(Boolean)))
      : [];
    if (teacherIds.length > 1) {
      res.status(400).json({ error: 'No subject in any stream can have more than one teacher.' });
      return;
    }

    const single = Math.floor(Number(b.singleLessons ?? 0));
    const dbl = Math.floor(Number(b.doubleLessons ?? 0));
    const triple = Math.floor(Number(b.tripleLessons ?? 0));
    const sessionSum = single + dbl * 2 + triple * 3;
    const required = Math.floor(Number(b.requiredWeeklyPeriods ?? sessionSum));

    if (single < 0 || dbl < 0 || triple < 0) {
      res.status(400).json({ error: 'Single, double, and triple lesson counts cannot be negative.' });
      return;
    }
    if (isActive && required < 1) {
      res.status(400).json({ error: `Active subject "${subjectName}" must have at least 1 lesson per week.` });
      return;
    }
    if (sessionSum !== required) {
      res.status(400).json({
        error: `Lesson breakdown (${single}×1 + ${dbl}×2 + ${triple}×3 = ${sessionSum}) must exactly equal the required ${required} weekly lessons for ${subjectName}.`,
      });
      return;
    }

    const now = new Date().toISOString();
    const upsertStmt = db.prepare(
      `INSERT INTO tt_grade_subject_allocations
         (id, tenant_id, config_id, grade, subject_name, required_weekly_periods, single_lessons, double_lessons, triple_lessons, pattern_preference, max_per_day, min_spacing_days, preferred_days_json, preferred_periods_json, required_room_type, default_room_id, teacher_ids_json, student_group_label, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(config_id, grade, lower(subject_name)) DO UPDATE SET
         required_weekly_periods = excluded.required_weekly_periods,
         single_lessons = excluded.single_lessons,
         double_lessons = excluded.double_lessons,
         triple_lessons = excluded.triple_lessons,
         pattern_preference = excluded.pattern_preference,
         max_per_day = excluded.max_per_day,
         min_spacing_days = excluded.min_spacing_days,
         preferred_days_json = excluded.preferred_days_json,
         preferred_periods_json = excluded.preferred_periods_json,
         required_room_type = excluded.required_room_type,
         default_room_id = excluded.default_room_id,
         teacher_ids_json = CASE WHEN json_array_length(excluded.teacher_ids_json) > 0 THEN excluded.teacher_ids_json ELSE tt_grade_subject_allocations.teacher_ids_json END,
         student_group_label = excluded.student_group_label,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`
    );

    db.exec('BEGIN IMMEDIATE');
    try {
      for (const targetGrade of targetGradesRaw) {
        const rowId = targetGradesRaw.length === 1 && b.id ? String(b.id) : uid('ttga');
        upsertStmt.run(
          rowId,
          tenantId,
          configId,
          targetGrade,
          subjectName,
          required,
          single,
          dbl,
          triple,
          String(b.patternPreference || 'spread'),
          Math.max(1, Number(b.maxPerDay || 1)),
          Math.max(0, Number(b.minSpacingDays || 0)),
          JSON.stringify(Array.isArray(b.preferredDays) ? b.preferredDays : []),
          JSON.stringify(Array.isArray(b.preferredPeriods) ? b.preferredPeriods : []),
          String(b.requiredRoomType || 'general'),
          b.defaultRoomId || null,
          JSON.stringify(teacherIds),
          String(b.studentGroupLabel || 'Whole Class'),
          b.isActive === false ? 0 : 1,
          now
        );
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    notifyMySqlTablesChanged(['tt_grade_subject_allocations']);
    res.json({ ok: true, gradesUpdated: targetGradesRaw });
  });

  app.delete('/api/timetable/allocations/grade/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const existing = db
      .prepare(`SELECT * FROM tt_grade_subject_allocations WHERE id = ? AND tenant_id = ?`)
      .get(req.params.id, tenantId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Grade subject allocation not found.' });
      return;
    }

    const bandGradesParam = String(req.query.bandGrades || '').trim();
    const targetGrades = bandGradesParam
      ? bandGradesParam
          .split(',')
          .map((x) => Number(x.trim()))
          .filter((g) => Number.isFinite(g) && g >= 1 && g <= 12)
      : [Number(existing.grade)];

    db.exec('BEGIN IMMEDIATE');
    try {
      for (const g of targetGrades) {
        db.prepare(
          `DELETE FROM tt_grade_subject_allocations
           WHERE config_id = ? AND tenant_id = ? AND grade = ? AND lower(subject_name) = lower(?)`
        ).run(existing.config_id, tenantId, g, existing.subject_name);
        db.prepare(
          `DELETE FROM tt_stream_subject_allocations
           WHERE config_id = ? AND tenant_id = ? AND grade = ? AND lower(subject_name) = lower(?) AND is_overridden = 0`
        ).run(existing.config_id, tenantId, g, existing.subject_name);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    notifyMySqlTablesChanged(['tt_grade_subject_allocations', 'tt_stream_subject_allocations']);
    res.json({ ok: true, gradesUpdated: targetGrades });
  });

  app.delete('/api/timetable/allocations/stream/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    db.prepare(`DELETE FROM tt_stream_subject_allocations WHERE id = ? AND tenant_id = ?`).run(req.params.id, tenantId);
    notifyMySqlTablesChanged(['tt_stream_subject_allocations']);
    res.json({ ok: true });
  });

  app.post('/api/timetable/allocations/apply-template', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const { configId } = ensureTenantTimetableSeeded(db, tenantId, req.authSession!.userId);
    const { grade, grades, overwriteOverridden = false, overwriteTeachers = false } = req.body || {};

    const targetGrades: number[] = Array.isArray(grades) && grades.length > 0
      ? Array.from(new Set<number>(grades.map((g: any) => Number(g)).filter((g: number) => Number.isFinite(g) && g >= 1 && g <= 12)))
      : grade
      ? [Number(grade)]
      : [];

    if (targetGrades.length === 0) {
      res.status(400).json({ error: 'Target grade or grade band list is required.' });
      return;
    }

    // Build lookup of stream-specific subject teachers from academic hierarchy so stream teacher assignments are strictly honored
    const ttTeacherByUserId = new Map<string, string>();
    for (const tp of db.prepare(`SELECT id, user_id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[]) {
      ttTeacherByUserId.set(String(tp.user_id), String(tp.id));
    }
    const explicitStreamTeacherMap = new Map<string, string>();
    try {
      const gtaRows = db
        .prepare(
          `SELECT gta.teacher_id, gta.subject_name, g.grade_number, g.name as grade_name, s.name as stream_name
           FROM grade_teacher_assignments gta
           JOIN grades g ON g.id = gta.grade_id
           JOIN streams s ON s.id = gta.stream_id
           WHERE gta.school_id = ? AND gta.is_active = 1 AND gta.stream_id IS NOT NULL`
        )
        .all(tenantId) as any[];
      for (const r of gtaRows) {
        const gNum = Number(r.grade_number || String(r.grade_name || '').match(/\d+/)?.[0] || 0);
        const ttTid = ttTeacherByUserId.get(String(r.teacher_id));
        if (gNum > 0 && r.stream_name && ttTid) {
          explicitStreamTeacherMap.set(
            `${gNum}::${String(r.stream_name).toLowerCase()}::${String(r.subject_name).toLowerCase()}`,
            ttTid
          );
        }
      }
    } catch {
      // ignore if hierarchy tables not yet populated
    }

    const now = new Date().toISOString();
    let updatedCount = 0;

    db.exec('BEGIN IMMEDIATE');
    try {
      for (const targetGrade of targetGrades) {
        const gradeTemplates = db
          .prepare(`SELECT * FROM tt_grade_subject_allocations WHERE config_id = ? AND grade = ?`)
          .all(configId, targetGrade) as any[];
        const wholeGroups = db
          .prepare(`SELECT * FROM tt_student_groups WHERE tenant_id = ? AND grade = ? AND is_whole_class = 1`)
          .all(tenantId, targetGrade) as any[];

        for (const wg of wholeGroups) {
          const stream = String(wg.stream);
          for (const tpl of gradeTemplates) {
            const existing = db
              .prepare(
                `SELECT id, is_overridden, teacher_ids_json FROM tt_stream_subject_allocations
                 WHERE config_id = ? AND grade = ? AND stream = ? AND lower(subject_name) = lower(?) AND (group_id = ? OR group_id IS NULL)`
              )
              .get(configId, targetGrade, stream, String(tpl.subject_name), String(wg.id)) as any;

            if (existing && Number(existing.is_overridden) === 1 && !overwriteOverridden) {
              continue; // Respect explicit stream override unless requested
            }

            const linkedStreamTeacher = explicitStreamTeacherMap.get(
              `${targetGrade}::${stream.toLowerCase()}::${String(tpl.subject_name).toLowerCase()}`
            );
            const fallbackTeachersJson = linkedStreamTeacher
              ? JSON.stringify([linkedStreamTeacher])
              : String(tpl.teacher_ids_json || '[]');

            if (existing) {
              const existingTeachers = safeJsonParse<string[]>(existing.teacher_ids_json, []).filter(Boolean);
              const resolvedTeachersJson =
                !overwriteTeachers && existingTeachers.length > 0
                  ? JSON.stringify(existingTeachers)
                  : fallbackTeachersJson;

              db.prepare(
                `UPDATE tt_stream_subject_allocations
                 SET inherited_from_id = ?, is_overridden = 0, required_weekly_periods = ?, single_lessons = ?, double_lessons = ?, triple_lessons = ?,
                     pattern_preference = ?, max_per_day = ?, min_spacing_days = ?, preferred_days_json = ?, preferred_periods_json = ?,
                     required_room_type = ?, room_id = COALESCE(?, room_id), teacher_ids_json = ?,
                     is_active = ?, updated_at = ?
                 WHERE id = ?`
              ).run(
                tpl.id,
                tpl.required_weekly_periods,
                tpl.single_lessons,
                tpl.double_lessons,
                tpl.triple_lessons,
                tpl.pattern_preference,
                tpl.max_per_day,
                tpl.min_spacing_days,
                tpl.preferred_days_json,
                tpl.preferred_periods_json,
                tpl.required_room_type,
                tpl.default_room_id,
                resolvedTeachersJson,
                tpl.is_active,
                now,
                existing.id
              );
            } else {
              db.prepare(
                `INSERT INTO tt_stream_subject_allocations
                   (id, tenant_id, config_id, grade, stream, group_id, subject_name, inherited_from_id, is_overridden, required_weekly_periods, single_lessons, double_lessons, triple_lessons, pattern_preference, max_per_day, min_spacing_days, preferred_days_json, preferred_periods_json, required_room_type, room_id, teacher_ids_json, is_active, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              ).run(
                uid('ttsa'),
                tenantId,
                configId,
                targetGrade,
                stream,
                String(wg.id),
                tpl.subject_name,
                tpl.id,
                tpl.required_weekly_periods,
                tpl.single_lessons,
                tpl.double_lessons,
                tpl.triple_lessons,
                tpl.pattern_preference,
                tpl.max_per_day,
                tpl.min_spacing_days,
                tpl.preferred_days_json,
                tpl.preferred_periods_json,
                tpl.required_room_type,
                tpl.default_room_id,
                fallbackTeachersJson,
                tpl.is_active,
                now
              );
            }
            updatedCount++;
          }
        }
      }
      writeAudit(
        tenantId,
        null,
        'TEMPLATE_APPLIED_TO_STREAMS',
        req.authSession!.userId,
        String(req.authSession!.user.name || 'Admin'),
        String(req.authSession!.role),
        { grades: targetGrades, updatedCount, overwriteOverridden, overwriteTeachers }
      );
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    notifyMySqlTablesChanged(['tt_stream_subject_allocations', 'tt_audit_logs']);
    res.json({ ok: true, updatedCount, gradesSynced: targetGrades });
  });

  app.put('/api/timetable/allocations/stream', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const { configId } = ensureTenantTimetableSeeded(db, tenantId, req.authSession!.userId);
    const b = req.body || {};
    if (!b.grade || !b.stream || !b.subjectName) {
      res.status(400).json({ error: 'Grade, stream, and subjectName are required.' });
      return;
    }

    const teacherIds: string[] = Array.isArray(b.teacherIds)
      ? Array.from(new Set<string>(b.teacherIds.map((x: any) => String(x || '').trim()).filter(Boolean)))
      : [];
    if (teacherIds.length > 1) {
      res.status(400).json({
        error: 'No subject in any stream can have more than one teacher. Assign at most one teacher.',
      });
      return;
    }

    const gradeNum = Number(b.grade);
    const streamName = String(b.stream).trim();
    const subjectName = String(b.subjectName).trim();
    const isActive = b.isActive !== false;

    const gradeSched = db
      .prepare(`SELECT periods_per_day, working_days_json, assembly_period FROM tt_grade_schedules WHERE config_id = ? AND grade = ?`)
      .get(configId, gradeNum) as any;
    if (!gradeSched) {
      res.status(400).json({ error: `Grade ${gradeNum} is not an active configured grade in timetable setup.` });
      return;
    }

    const streamGroupsCount = (db.prepare(`SELECT COUNT(*) as c FROM tt_student_groups WHERE tenant_id = ?`).get(tenantId) as any)?.c || 0;
    if (streamGroupsCount > 0) {
      const streamGroup = db
        .prepare(`SELECT id FROM tt_student_groups WHERE tenant_id = ? AND grade = ? AND lower(stream) = lower(?) LIMIT 1`)
        .get(tenantId, gradeNum, streamName);
      if (!streamGroup) {
        res.status(400).json({ error: `Stream "${streamName}" is not an allocated stream for Grade ${gradeNum}.` });
        return;
      }
    }

    const activeSubjectCount = (db.prepare(`SELECT COUNT(*) as c FROM tt_subjects WHERE tenant_id = ? AND is_active = 1`).get(tenantId) as any)?.c || 0;
    if (activeSubjectCount > 0) {
      const subjRow = db
        .prepare(`SELECT id FROM tt_subjects WHERE tenant_id = ? AND is_active = 1 AND lower(name) = lower(?) LIMIT 1`)
        .get(tenantId, subjectName);
      if (!subjRow) {
        res.status(400).json({ error: `Subject "${subjectName}" is not an active subject in the school curriculum catalog.` });
        return;
      }
    }

    const now = new Date().toISOString();
    const id = b.id || uid('ttsa');
    const single = Math.floor(Number(b.singleLessons ?? 0));
    const dbl = Math.floor(Number(b.doubleLessons ?? 0));
    const triple = Math.floor(Number(b.tripleLessons ?? 0));
    const sessionSum = single + dbl * 2 + triple * 3;
    const required = Math.floor(Number(b.requiredWeeklyPeriods ?? sessionSum));
    const isOverridden = b.resetToInherited ? 0 : 1;

    if (single < 0 || dbl < 0 || triple < 0) {
      res.status(400).json({ error: 'Single, double, and triple lesson counts cannot be negative.' });
      return;
    }
    if (isActive && required < 1) {
      res.status(400).json({ error: `Active subject "${subjectName}" must have at least 1 lesson per week.` });
      return;
    }
    if (sessionSum !== required) {
      res.status(400).json({
        error: `Lesson breakdown (${single}×1 + ${dbl}×2 + ${triple}×3 = ${sessionSum}) must exactly equal the required ${required} weekly lessons for Grade ${gradeNum} ${streamName} · ${subjectName}.`,
      });
      return;
    }

    // Check weekly teaching capacity for this stream (for active whole-class allocations)
    const targetGrp = b.groupId
      ? (db.prepare(`SELECT is_whole_class FROM tt_student_groups WHERE id = ? AND tenant_id = ?`).get(b.groupId, tenantId) as any)
      : null;
    const isWholeClassTarget = !targetGrp || Number(targetGrp.is_whole_class) === 1;
    if (isActive && isWholeClassTarget) {
      const daysArr = safeJsonParse<string[]>(gradeSched.working_days_json, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
      const perDay = Number(gradeSched.periods_per_day || 8);
      const assemblyDeduct = Number(gradeSched.assembly_period || 0) > 0 ? 1 : 0;
      const availablePeriods = Math.max(0, daysArr.length * perDay - assemblyDeduct);

      const otherAllocs = db
        .prepare(
          `SELECT sa.id, sa.required_weekly_periods, sa.group_id, g.is_whole_class
           FROM tt_stream_subject_allocations sa
           LEFT JOIN tt_student_groups g ON g.id = sa.group_id
           WHERE sa.config_id = ? AND sa.grade = ? AND lower(sa.stream) = lower(?) AND sa.is_active = 1`
        )
        .all(configId, gradeNum, streamName) as any[];

      let otherTotal = 0;
      for (const oa of otherAllocs) {
        if (b.id && String(oa.id) === String(b.id)) continue;
        if (!b.id && oa.group_id === (b.groupId || null)) {
          // Skip same allocation if updating without explicit id
        }
        const oaWhole = oa.group_id ? Number(oa.is_whole_class ?? 1) === 1 : true;
        if (oaWhole) otherTotal += Number(oa.required_weekly_periods || 0);
      }

      const jointRows = db
        .prepare(`SELECT participating_classes_json, weekly_periods FROM tt_joint_lessons WHERE config_id = ? AND is_active = 1`)
        .all(configId) as any[];
      for (const jl of jointRows) {
        const classes = safeJsonParse<Array<{ grade: number; stream: string }>>(jl.participating_classes_json, []);
        if (classes.some((c) => Number(c.grade) === gradeNum && String(c.stream).toLowerCase() === streamName.toLowerCase())) {
          otherTotal += Number(jl.weekly_periods || 0);
        }
      }

      if (availablePeriods > 0 && otherTotal + required > availablePeriods) {
        res.status(400).json({
          error: `Weekly period capacity exceeded for Grade ${gradeNum} ${streamName}: allocating ${required} weekly lessons for ${subjectName} brings total to ${otherTotal + required} periods, exceeding the ${availablePeriods} available teaching periods per week.`,
        });
        return;
      }
    }

    if (b.id) {
      db.prepare(
        `UPDATE tt_stream_subject_allocations
         SET is_overridden = ?, group_id = ?, required_weekly_periods = ?, single_lessons = ?, double_lessons = ?, triple_lessons = ?,
             pattern_preference = ?, max_per_day = ?, min_spacing_days = ?, preferred_days_json = ?, preferred_periods_json = ?,
             required_room_type = ?, room_id = ?, teacher_ids_json = ?, is_active = ?, updated_at = ?
         WHERE id = ? AND tenant_id = ?`
      ).run(
        isOverridden,
        b.groupId || null,
        required,
        single,
        dbl,
        triple,
        String(b.patternPreference || 'spread'),
        Math.max(1, Number(b.maxPerDay || 1)),
        Math.max(0, Number(b.minSpacingDays || 0)),
        JSON.stringify(Array.isArray(b.preferredDays) ? b.preferredDays : []),
        JSON.stringify(Array.isArray(b.preferredPeriods) ? b.preferredPeriods : []),
        String(b.requiredRoomType || 'general'),
        b.roomId || null,
        JSON.stringify(teacherIds),
        b.isActive === false ? 0 : 1,
        now,
        b.id,
        tenantId
      );
    } else {
      db.prepare(
        `INSERT INTO tt_stream_subject_allocations
           (id, tenant_id, config_id, grade, stream, group_id, subject_name, inherited_from_id, is_overridden, required_weekly_periods, single_lessons, double_lessons, triple_lessons, pattern_preference, max_per_day, min_spacing_days, preferred_days_json, preferred_periods_json, required_room_type, room_id, teacher_ids_json, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        tenantId,
        configId,
        gradeNum,
        streamName,
        b.groupId || null,
        subjectName,
        b.inheritedFromId || null,
        isOverridden,
        required,
        single,
        dbl,
        triple,
        String(b.patternPreference || 'spread'),
        Math.max(1, Number(b.maxPerDay || 1)),
        Math.max(0, Number(b.minSpacingDays || 0)),
        JSON.stringify(Array.isArray(b.preferredDays) ? b.preferredDays : []),
        JSON.stringify(Array.isArray(b.preferredPeriods) ? b.preferredPeriods : []),
        String(b.requiredRoomType || 'general'),
        b.roomId || null,
        JSON.stringify(teacherIds),
        b.isActive === false ? 0 : 1,
        now
      );
    }

    // Synchronize stream-subject single teacher into grade_teacher_assignments and users.payload_json
    const syncedTables = ['tt_stream_subject_allocations'];
    const gradeRow = db
      .prepare(
        `SELECT id, name, grade_number FROM grades
         WHERE school_id = ? AND is_active = 1 AND (grade_number = ? OR lower(name) = lower(?))
         LIMIT 1`
      )
      .get(tenantId, gradeNum, `Grade ${gradeNum}`) as { id: string; name: string; grade_number: number | null } | undefined;
    const streamRow = gradeRow
      ? (db
          .prepare(
            `SELECT id, name FROM streams
             WHERE school_id = ? AND grade_id = ? AND is_active = 1 AND lower(name) = lower(?)
             LIMIT 1`
          )
          .get(tenantId, gradeRow.id, streamName) as { id: string; name: string } | undefined)
      : undefined;

    if (gradeRow && streamRow) {
      const affectedUserIds = new Set<string>();
      const existingGta = db
        .prepare(
          `SELECT id, teacher_id FROM grade_teacher_assignments
           WHERE school_id = ? AND grade_id = ? AND stream_id = ? AND lower(subject_name) = lower(?) AND is_active = 1
           LIMIT 1`
        )
        .get(tenantId, gradeRow.id, streamRow.id, subjectName) as { id: string; teacher_id: string } | undefined;

      let assignedUserId: string | null = null;
      let assignedUserName: string | null = null;
      if (teacherIds[0]) {
        const tp = db
          .prepare(`SELECT user_id, teacher_name FROM tt_teacher_profiles WHERE tenant_id = ? AND (id = ? OR user_id = ?) LIMIT 1`)
          .get(tenantId, teacherIds[0], teacherIds[0]) as { user_id: string; teacher_name: string } | undefined;
        if (tp?.user_id) {
          const uRow = db
            .prepare(`SELECT id, name FROM users WHERE id = ? AND school_id = ? LIMIT 1`)
            .get(tp.user_id, tenantId) as { id: string; name: string } | undefined;
          if (uRow) {
            assignedUserId = uRow.id;
            assignedUserName = uRow.name;
          }
        }
      }

      if (assignedUserId && assignedUserName) {
        if (existingGta && existingGta.teacher_id === assignedUserId) {
          db.prepare(
            `UPDATE grade_teacher_assignments SET periods_per_week = ?, teacher_name = ?, updated_at = ? WHERE id = ?`
          ).run(Math.max(1, required || 4), assignedUserName, now, existingGta.id);
        } else {
          if (existingGta) {
            db.prepare(
              `UPDATE grade_teacher_assignments SET is_active = 0, unassigned_at = ?, updated_at = ? WHERE id = ?`
            ).run(now, now, existingGta.id);
            affectedUserIds.add(existingGta.teacher_id);
          }
          db.prepare(
            `INSERT INTO grade_teacher_assignments
              (id, school_id, grade_id, stream_id, teacher_id, teacher_name, subject_name, academic_year, periods_per_week, is_active, assigned_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, '2026', ?, 1, ?, ?, ?)`
          ).run(
            `gta-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            tenantId,
            gradeRow.id,
            streamRow.id,
            assignedUserId,
            assignedUserName,
            subjectName,
            Math.max(1, required || 4),
            now,
            now,
            now
          );
        }
        affectedUserIds.add(assignedUserId);
      } else if (existingGta && teacherIds.length === 0) {
        db.prepare(
          `UPDATE grade_teacher_assignments SET is_active = 0, unassigned_at = ?, updated_at = ? WHERE id = ?`
        ).run(now, now, existingGta.id);
        affectedUserIds.add(existingGta.teacher_id);
      }

      for (const uidToSync of affectedUserIds) {
        const gRows = db
          .prepare(
            `SELECT gta.id, gta.grade_id, gta.stream_id, gta.subject_name, gta.periods_per_week, g.grade_number, g.name as grade_name, s.name as stream_name
             FROM grade_teacher_assignments gta
             JOIN grades g ON g.id = gta.grade_id
             JOIN streams s ON s.id = gta.stream_id
             WHERE gta.school_id = ? AND gta.teacher_id = ? AND gta.is_active = 1 AND gta.stream_id IS NOT NULL`
          )
          .all(tenantId, uidToSync) as any[];
        const allocations = gRows.map((r) => ({
          id: r.id,
          grade: Number(r.grade_number || gradeNum),
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
        const uRow = db
          .prepare(`SELECT payload_json FROM users WHERE id = ? AND school_id = ?`)
          .get(uidToSync, tenantId) as { payload_json: string } | undefined;
        if (uRow) {
          const payload = safeJsonParse<Record<string, any>>(uRow.payload_json, {});
          const nextPayload: Record<string, any> = {
            ...payload,
            assignedSubjectAllocations: allocations,
            assignedSubjects: uniqueSubjects,
            assignedStreams: uniqueStreams,
          };
          delete nextPayload.password;
          delete nextPayload.passwordHash;
          db.prepare(`UPDATE users SET payload_json = ?, updated_at = ? WHERE id = ? AND school_id = ?`).run(
            JSON.stringify(nextPayload),
            now,
            uidToSync,
            tenantId
          );
          upsertCollectionRecord(db, 'edusmart_users_v1', uidToSync, tenantId, nextPayload, false);
        }
      }

      if (affectedUserIds.size > 0) {
        syncedTables.push('grade_teacher_assignments', 'users', 'collections_store');
        broadcastChange({
          type: 'record:updated',
          collection: 'academic_hierarchy',
          tenantId,
          actorId: req.authSession!.userId,
          timestamp: now,
        });
        broadcastChange({
          type: 'record:updated',
          collection: 'edusmart_users_v1',
          tenantId,
          actorId: req.authSession!.userId,
          timestamp: now,
        });
      }
    }

    notifyMySqlTablesChanged(syncedTables);
    res.json({ ok: true, id });
  });

  app.post('/api/timetable/joint-lessons', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const { configId } = ensureTenantTimetableSeeded(db, tenantId, req.authSession!.userId);
    const b = req.body || {};
    if (!b.title || !b.subjectName || !Array.isArray(b.participatingClasses) || b.participatingClasses.length < 2) {
      res.status(400).json({ error: 'Joint lesson requires title, subjectName, and at least 2 participating classes.' });
      return;
    }

    const jlSubjectName = String(b.subjectName).trim();
    const activeSubjectCount = (db.prepare(`SELECT COUNT(*) as c FROM tt_subjects WHERE tenant_id = ? AND is_active = 1`).get(tenantId) as any)?.c || 0;
    if (activeSubjectCount > 0) {
      const subjRow = db
        .prepare(`SELECT id FROM tt_subjects WHERE tenant_id = ? AND is_active = 1 AND lower(name) = lower(?) LIMIT 1`)
        .get(tenantId, jlSubjectName);
      if (!subjRow) {
        res.status(400).json({ error: `Subject "${jlSubjectName}" is not an active subject in the school curriculum catalog.` });
        return;
      }
    }

    const jlWeeklyPeriods = Math.floor(Number(b.weeklyPeriods || 1));
    const jlLessonLength = Math.min(3, Math.max(1, Math.floor(Number(b.lessonLength || 1))));
    if (jlWeeklyPeriods < 1 || jlWeeklyPeriods % jlLessonLength !== 0) {
      res.status(400).json({
        error: `Joint lesson weekly periods (${jlWeeklyPeriods}) must be a positive multiple of lesson length (${jlLessonLength}).`,
      });
      return;
    }

    const jlTeacherIds: string[] = Array.isArray(b.teacherIds)
      ? Array.from(new Set<string>(b.teacherIds.map((x: any) => String(x || '').trim()).filter(Boolean)))
      : [];
    if (jlTeacherIds.length > 1) {
      res.status(400).json({ error: 'No subject in any stream can have more than one teacher.' });
      return;
    }

    // Validate participating grades & streams exist and compute combined student count
    const hasGroups = ((db.prepare(`SELECT COUNT(*) as c FROM tt_student_groups WHERE tenant_id = ?`).get(tenantId) as any)?.c || 0) > 0;
    let combinedStudents = Number(b.combinedStudents || 0);
    for (const pc of b.participatingClasses) {
      const pGrade = Number(pc.grade);
      const pStream = String(pc.stream || '').trim();
      const gs = db.prepare(`SELECT grade FROM tt_grade_schedules WHERE config_id = ? AND grade = ?`).get(configId, pGrade);
      if (!gs) {
        res.status(400).json({ error: `Participating Grade ${pGrade} is not a configured grade in timetable setup.` });
        return;
      }
      const gRow = db
        .prepare(`SELECT student_count FROM tt_student_groups WHERE tenant_id = ? AND grade = ? AND lower(stream) = lower(?) AND is_whole_class = 1 LIMIT 1`)
        .get(tenantId, pGrade, pStream) as any;
      if (hasGroups && !gRow) {
        res.status(400).json({ error: `Participating stream Grade ${pGrade} ${pStream} is not an allocated stream.` });
        return;
      }
      if (Number(b.combinedStudents || 0) <= 0) {
        combinedStudents += Number(gRow?.student_count || 38);
      }
    }

    if (b.roomId) {
      const rRow = db.prepare(`SELECT name, capacity FROM tt_classrooms WHERE id = ? AND tenant_id = ?`).get(b.roomId, tenantId) as any;
      if (rRow && combinedStudents > Number(rRow.capacity)) {
        res.status(400).json({
          error: `Selected room "${rRow.name}" (capacity ${rRow.capacity}) cannot accommodate ${combinedStudents} combined students.`,
        });
        return;
      }
    }

    const id = uid('ttjl');
    db.prepare(
      `INSERT INTO tt_joint_lessons
         (id, tenant_id, config_id, title, subject_name, participating_classes_json, teacher_ids_json, weekly_periods, lesson_length, room_id, required_room_type, combined_students, preferred_days_json, preferred_periods_json, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(
      id,
      tenantId,
      configId,
      String(b.title).trim(),
      String(b.subjectName).trim(),
      JSON.stringify(b.participatingClasses),
      JSON.stringify(jlTeacherIds),
      Math.max(1, Number(b.weeklyPeriods || 1)),
      Math.min(3, Math.max(1, Number(b.lessonLength || 1))),
      b.roomId || null,
      String(b.requiredRoomType || 'hall'),
      combinedStudents,
      JSON.stringify(Array.isArray(b.preferredDays) ? b.preferredDays : []),
      JSON.stringify(Array.isArray(b.preferredPeriods) ? b.preferredPeriods : []),
      new Date().toISOString()
    );
    notifyMySqlTablesChanged(['tt_joint_lessons']);
    res.status(201).json({ id, combinedStudents });
  });

  app.delete('/api/timetable/joint-lessons/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    db.prepare(`DELETE FROM tt_joint_lessons WHERE id = ? AND tenant_id = ?`).run(req.params.id, tenantId);
    notifyMySqlTablesChanged(['tt_joint_lessons']);
    res.json({ ok: true });
  });

  // ------------------------------------------------------------------
  // 6. VERSIONS, GENERATION BACKGROUND JOBS, MANUAL DRAG-DROP & WORKFLOW
  // ------------------------------------------------------------------
  app.post('/api/timetable/versions', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const { configId } = ensureTenantTimetableSeeded(db, tenantId, req.authSession!.userId);
    const maxVer = (db.prepare(`SELECT MAX(version_number) as m FROM tt_versions WHERE config_id = ?`).get(configId) as any)?.m || 0;
    const nextNum = Number(maxVer) + 1;
    const name = String(req.body?.name || `Timetable Draft v${nextNum}`).trim();
    const id = uid('ttver');
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO tt_versions (id, tenant_id, config_id, version_number, name, status, metrics_json, created_by, created_by_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'draft', '{}', ?, ?, ?, ?)`
    ).run(id, tenantId, configId, nextNum, name, req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), now, now);

    db.prepare(`UPDATE tt_configs SET active_version_id = ? WHERE id = ?`).run(id, configId);
    writeAudit(tenantId, id, 'VERSION_CREATED', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), String(req.authSession!.role), { name, nextNum });
    notifyMySqlTablesChanged(['tt_versions', 'tt_configs', 'tt_audit_logs']);
    res.status(201).json({ id, versionNumber: nextNum, name });
  });

  app.get('/api/timetable/versions/compare', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const leftId = String(req.query.leftId || '');
    const rightId = String(req.query.rightId || '');
    const left = db.prepare(`SELECT * FROM tt_versions WHERE id = ? AND tenant_id = ?`).get(leftId, tenantId) as any;
    const right = db.prepare(`SELECT * FROM tt_versions WHERE id = ? AND tenant_id = ?`).get(rightId, tenantId) as any;
    if (!left || !right) {
      res.status(404).json({ error: 'Both timetable versions must belong to your school.' });
      return;
    }

    const leftEntries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(leftId) as any[];
    const rightEntries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(rightId) as any[];
    const keyOf = (e: any) => `${e.grade}|${e.stream}|${e.day_of_week}|${e.period_number}|${e.group_name}`;

    const lMap = new Map(leftEntries.map((e) => [keyOf(e), e]));
    const rMap = new Map(rightEntries.map((e) => [keyOf(e), e]));
    const diffs: Array<{ slotKey: string; changeType: 'added' | 'removed' | 'changed'; left?: any; right?: any }> = [];

    for (const [k, re] of rMap.entries()) {
      const le = lMap.get(k);
      if (!le) {
        diffs.push({ slotKey: k, changeType: 'added', right: re });
      } else if (le.subject_name !== re.subject_name || le.room_name !== re.room_name || le.teacher_names_json !== re.teacher_names_json) {
        diffs.push({ slotKey: k, changeType: 'changed', left: le, right: re });
      }
    }
    for (const [k, le] of lMap.entries()) {
      if (!rMap.has(k)) {
        diffs.push({ slotKey: k, changeType: 'removed', left: le });
      }
    }

    res.json({
      left: { id: left.id, name: left.name, status: left.status, entryCount: leftEntries.length, metrics: safeJsonParse(left.metrics_json, {}) },
      right: { id: right.id, name: right.name, status: right.status, entryCount: rightEntries.length, metrics: safeJsonParse(right.metrics_json, {}) },
      diffCount: diffs.length,
      diffs: diffs.slice(0, 120),
    });
  });

  app.get('/api/timetable/versions/:id', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const ver = hydrateVersionDetail(db, String(req.params.id));
    if (!ver || ver.tenantId !== tenantId) {
      res.status(404).json({ error: 'Timetable version not found for this school.' });
      return;
    }
    res.json(ver);
  });

  app.post('/api/timetable/versions/:id/generate', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ? AND tenant_id = ?`).get(req.params.id, tenantId) as any;
    if (!version) {
      res.status(404).json({ error: 'Timetable version not found.' });
      return;
    }
    if (version.status === 'published' || version.status === 'archived') {
      res.status(400).json({ error: `Cannot overwrite a ${version.status} timetable directly. Clone or restore into a draft version first.` });
      return;
    }

    // Pre-flight strict allocation & weekly quota check before queuing generation
    const preflight = expandRequirementUnits(db, tenantId, String(version.config_id));
    if (preflight.units.length === 0) {
      res.status(400).json({
        error: 'Cannot generate timetable: no active allocated grades, streams, and subjects were found.',
      });
      return;
    }
    const overloadedStreams = preflight.streamLoadSummary.filter((s) => s.deficitOrExcess < 0);
    if (overloadedStreams.length > 0) {
      const first = overloadedStreams[0];
      res.status(400).json({
        error: `Cannot generate timetable: Grade ${first.grade} ${first.stream} has ${first.requiredPeriods} allocated lessons/week but only ${first.availablePeriods} available teaching periods. Adjust subject weekly lesson counts first.`,
        overloadedStreams,
      });
      return;
    }
    const blockingAllocationIssues = preflight.allocationIssues.filter(
      (i) => !i.message.startsWith('No subject teacher assigned')
    );
    if (blockingAllocationIssues.length > 0) {
      const first = blockingAllocationIssues[0];
      res.status(400).json({
        error: `Strict allocation error in Grade ${first.grade} ${first.stream} · ${first.subject}: ${first.message}`,
        allocationIssues: blockingAllocationIssues,
      });
      return;
    }

    const preserveLocked = req.body?.preserveLocked !== false;
    const { jobId } = enqueueTimetableGenerationJob(db, tenantId, String(version.id), req.authSession!.userId, preserveLocked);
    writeAudit(
      tenantId,
      String(version.id),
      'GENERATION_QUEUED',
      req.authSession!.userId,
      String(req.authSession!.user.name || 'Admin'),
      String(req.authSession!.role),
      { jobId, preserveLocked }
    );
    res.status(202).json({ jobId, versionId: version.id, status: 'queued' });
  });

  app.get('/api/timetable/jobs/:jobId', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const job = db.prepare(`SELECT * FROM tt_generation_jobs WHERE id = ? AND tenant_id = ?`).get(req.params.jobId, tenantId) as any;
    if (!job) {
      res.status(404).json({ error: 'Generation job not found.' });
      return;
    }
    res.json({
      id: String(job.id),
      versionId: String(job.version_id),
      status: String(job.status),
      progressPct: Number(job.progress_pct || 0),
      stageMessage: String(job.stage_message),
      preserveLocked: Number(job.preserve_locked) === 1,
      retries: Number(job.retries || 0),
      diagnostics: safeJsonParse<any>(job.diagnostics_json, {}),
      errorMessage: job.error_message || null,
      startedAt: job.started_at || null,
      completedAt: job.completed_at || null,
    });
  });

  app.post('/api/timetable/jobs/:jobId/cancel', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    db.prepare(`UPDATE tt_generation_jobs SET cancel_requested = 1 WHERE id = ? AND tenant_id = ?`).run(req.params.jobId, tenantId);
    res.json({ ok: true });
  });

  app.post('/api/timetable/jobs/:jobId/retry', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const old = db.prepare(`SELECT * FROM tt_generation_jobs WHERE id = ? AND tenant_id = ?`).get(req.params.jobId, tenantId) as any;
    if (!old) {
      res.status(404).json({ error: 'Generation job not found.' });
      return;
    }
    const { jobId } = enqueueTimetableGenerationJob(db, tenantId, String(old.version_id), req.authSession!.userId, Number(old.preserve_locked) === 1);
    db.prepare(`UPDATE tt_generation_jobs SET retries = ? WHERE id = ?`).run(Number(old.retries || 0) + 1, jobId);
    res.status(202).json({ jobId, versionId: old.version_id });
  });

  // Atomic Manual Drag-and-Drop Move (Rejects invalid move and preserves original timetable!)
  app.post('/api/timetable/versions/:id/move-entry', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ? AND tenant_id = ?`).get(req.params.id, tenantId) as any;
    if (!version) {
      res.status(404).json({ error: 'Timetable version not found.' });
      return;
    }
    if (version.status === 'published' || version.status === 'archived') {
      res.status(400).json({ error: 'Published/archived timetables are locked against direct edits. Restore as a new draft first.' });
      return;
    }

    const { sessionBlockId, targetDay, targetStartPeriod, targetRoomId } = req.body || {};
    if (!sessionBlockId || !targetDay || !targetStartPeriod) {
      res.status(400).json({ error: 'sessionBlockId, targetDay, and targetStartPeriod are required.' });
      return;
    }

    const blockCheck = db
      .prepare(`SELECT is_locked, subject_name FROM tt_entries WHERE version_id = ? AND session_block_id = ? LIMIT 1`)
      .get(version.id, String(sessionBlockId)) as any;
    if (!blockCheck) {
      res.status(404).json({ error: 'Lesson session block not found.' });
      return;
    }
    if (Number(blockCheck.is_locked) === 1) {
      res.status(409).json({ error: `"${blockCheck.subject_name}" is locked. Unlock it before moving.` });
      return;
    }

    const validationResult = validateSingleMoveCandidate(
      db,
      String(version.id),
      String(sessionBlockId),
      String(targetDay),
      Number(targetStartPeriod),
      targetRoomId !== undefined ? targetRoomId : undefined
    );

    if (!validationResult.valid) {
      res.status(409).json({
        error: validationResult.hardConflicts[0] || 'Movement rejected due to scheduling clash.',
        hardConflicts: validationResult.hardConflicts,
        preservedOriginal: true,
      });
      return;
    }

    const now = new Date().toISOString();
    let targetRoomName: string | undefined;
    if (targetRoomId) {
      const rRow = db.prepare(`SELECT name FROM tt_classrooms WHERE id = ? AND tenant_id = ?`).get(targetRoomId, tenantId) as any;
      targetRoomName = rRow?.name;
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      const blockRows = db
        .prepare(`SELECT * FROM tt_entries WHERE version_id = ? AND session_block_id = ? ORDER BY grade, stream, block_index ASC`)
        .all(version.id, String(sessionBlockId)) as any[];

      for (const row of blockRows) {
        const bIdx = Number(row.block_index || 0);
        const newPeriod = validationResult.targetPeriods[bIdx] ?? Number(targetStartPeriod) + bIdx;
        db.prepare(
          `UPDATE tt_entries
           SET day_of_week = ?, period_number = ?,
               room_id = CASE WHEN ? IS NOT NULL THEN ? ELSE room_id END,
               room_name = CASE WHEN ? IS NOT NULL THEN ? ELSE room_name END,
               updated_at = ?
           WHERE id = ?`
        ).run(
          String(targetDay),
          newPeriod,
          targetRoomId || null,
          targetRoomId || null,
          targetRoomName || null,
          targetRoomName || null,
          now,
          row.id
        );
      }

      const postValidation = validateTimetableVersion(db, String(version.id));
      writeAudit(
        tenantId,
        String(version.id),
        'MANUAL_MOVE',
        req.authSession!.userId,
        String(req.authSession!.user.name || 'Admin'),
        String(req.authSession!.role),
        { sessionBlockId, targetDay, targetPeriods: validationResult.targetPeriods }
      );
      db.exec('COMMIT');

      notifyMySqlTablesChanged(['tt_entries', 'tt_validation_conflicts', 'tt_audit_logs']);
      res.json({
        ok: true,
        targetPeriods: validationResult.targetPeriods,
        validation: { hardErrors: postValidation.hardErrors, warnings: postValidation.warnings },
      });
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  });

  // Drag an Unscheduled Session Card onto a Timetable Slot
  app.post('/api/timetable/versions/:id/place-unscheduled', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ? AND tenant_id = ?`).get(req.params.id, tenantId) as any;
    if (!version) {
      res.status(404).json({ error: 'Timetable version not found.' });
      return;
    }

    const { unscheduledId, targetDay, targetStartPeriod, roomId } = req.body || {};
    const unsched = db
      .prepare(`SELECT * FROM tt_unscheduled_sessions WHERE id = ? AND version_id = ?`)
      .get(String(unscheduledId), String(version.id)) as any;
    if (!unsched) {
      res.status(404).json({ error: 'Unscheduled lesson record not found.' });
      return;
    }

    const blockLen = Math.min(3, Math.max(1, Number(unsched.block_length || 1)));
    const sessionBlockId = uid('ttblk');
    const now = new Date().toISOString();

    // Strict allocation & weekly quota guard before manual placement
    if (!unsched.joint_lesson_id) {
      const activeAlloc = unsched.allocation_id
        ? (db
            .prepare(
              `SELECT id, required_weekly_periods, is_active FROM tt_stream_subject_allocations
               WHERE id = ? AND config_id = ? AND is_active = 1`
            )
            .get(String(unsched.allocation_id), String(version.config_id)) as any)
        : (db
            .prepare(
              `SELECT id, required_weekly_periods, is_active FROM tt_stream_subject_allocations
               WHERE config_id = ? AND grade = ? AND lower(stream) = lower(?) AND lower(subject_name) = lower(?) AND is_active = 1
               LIMIT 1`
            )
            .get(String(version.config_id), Number(unsched.grade), String(unsched.stream), String(unsched.subject_name)) as any);

      if (!activeAlloc) {
        res.status(409).json({
          error: `Cannot place lesson: Grade ${unsched.grade} ${unsched.stream} · ${unsched.subject_name} is not an active allocated subject for this stream.`,
        });
        return;
      }

      const maxWeekly = Number(activeAlloc.required_weekly_periods || 0);
      const alreadyPlaced = (
        db
          .prepare(
            `SELECT COUNT(*) as c FROM tt_entries
             WHERE version_id = ? AND grade = ? AND lower(stream) = lower(?) AND lower(subject_name) = lower(?)
               AND COALESCE(group_name, 'Whole Class') = ?`
          )
          .get(
            String(version.id),
            Number(unsched.grade),
            String(unsched.stream),
            String(unsched.subject_name),
            String(unsched.group_name || 'Whole Class')
          ) as any
      )?.c || 0;

      if (alreadyPlaced + blockLen > maxWeekly) {
        res.status(409).json({
          error: `Weekly lesson quota exceeded for Grade ${unsched.grade} ${unsched.stream} · ${unsched.subject_name}: placing ${blockLen} period(s) would total ${alreadyPlaced + blockLen}, exceeding the strict limit of ${maxWeekly} lessons/week.`,
        });
        return;
      }
    }

    let resolvedRoomName = 'Assigned Room';
    if (roomId) {
      const rRow = db.prepare(`SELECT name FROM tt_classrooms WHERE id = ? AND tenant_id = ?`).get(roomId, tenantId) as any;
      if (rRow) resolvedRoomName = String(rRow.name);
    }

    // Insert temporarily inside rollback-safe transaction, run full single-block validation, rollback on conflict!
    db.exec('BEGIN IMMEDIATE');
    try {
      const ins = db.prepare(
        `INSERT INTO tt_entries
           (id, version_id, tenant_id, day_of_week, period_number, grade, stream, stream_label, group_id, group_name, joint_lesson_id, allocation_id, subject_name, teacher_ids_json, teacher_names_json, room_id, room_name, session_block_id, block_length, block_index, is_locked, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
      );
      for (let i = 0; i < blockLen; i++) {
        ins.run(
          uid('ttent'),
          version.id,
          tenantId,
          String(targetDay),
          Number(targetStartPeriod) + i,
          Number(unsched.grade),
          String(unsched.stream),
          `Grade ${unsched.grade} ${unsched.stream}`,
          unsched.group_id || null,
          String(unsched.group_name || 'Whole Class'),
          unsched.joint_lesson_id || null,
          unsched.allocation_id || null,
          String(unsched.subject_name),
          String(unsched.teacher_ids_json || '[]'),
          String(unsched.teacher_names_json || '[]'),
          roomId || null,
          resolvedRoomName,
          sessionBlockId,
          blockLen,
          i,
          now
        );
      }

      const check = validateSingleMoveCandidate(db, String(version.id), sessionBlockId, String(targetDay), Number(targetStartPeriod), roomId || null);
      if (!check.valid) {
        db.exec('ROLLBACK');
        res.status(409).json({
          error: check.hardConflicts[0] || 'Slot placement has a scheduling clash.',
          hardConflicts: check.hardConflicts,
        });
        return;
      }

      db.prepare(`DELETE FROM tt_unscheduled_sessions WHERE id = ?`).run(unsched.id);
      validateTimetableVersion(db, String(version.id));
      writeAudit(
        tenantId,
        String(version.id),
        'UNSCHEDULED_PLACED',
        req.authSession!.userId,
        String(req.authSession!.user.name || 'Admin'),
        String(req.authSession!.role),
        { subject: unsched.subject_name, grade: unsched.grade, stream: unsched.stream, targetDay, targetStartPeriod }
      );
      db.exec('COMMIT');
      notifyMySqlTablesChanged(['tt_entries', 'tt_unscheduled_sessions', 'tt_validation_conflicts']);
      res.json({ ok: true, sessionBlockId });
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch { /* ignore */ }
      throw e;
    }
  });

  app.post('/api/timetable/versions/:id/toggle-lock', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const { sessionBlockId, locked } = req.body || {};
    if (!sessionBlockId) {
      res.status(400).json({ error: 'sessionBlockId is required.' });
      return;
    }

    db.prepare(
      `UPDATE tt_entries SET is_locked = ?, locked_by = ?, updated_at = ?
       WHERE version_id = ? AND tenant_id = ? AND session_block_id = ?`
    ).run(
      locked ? 1 : 0,
      locked ? String(req.authSession!.user.name || req.authSession!.userId) : null,
      new Date().toISOString(),
      req.params.id,
      tenantId,
      String(sessionBlockId)
    );
    notifyMySqlTablesChanged(['tt_entries']);
    res.json({ ok: true, locked: Boolean(locked) });
  });

  app.post('/api/timetable/versions/:id/validate', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const version = db.prepare(`SELECT id FROM tt_versions WHERE id = ? AND tenant_id = ?`).get(req.params.id, tenantId) as any;
    if (!version) {
      res.status(404).json({ error: 'Timetable version not found.' });
      return;
    }
    const result = validateTimetableVersion(db, String(version.id));
    notifyMySqlTablesChanged(['tt_validation_conflicts']);
    res.json(result);
  });

  // ------------------------------------------------------------------
  // 7. APPROVAL & PUBLICATION WORKFLOW
  // ------------------------------------------------------------------
  app.post('/api/timetable/versions/:id/submit-review', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ? AND tenant_id = ?`).get(req.params.id, tenantId) as any;
    if (!version) {
      res.status(404).json({ error: 'Timetable version not found.' });
      return;
    }
    const check = validateTimetableVersion(db, String(version.id));
    if (!check.canApprove) {
      res.status(400).json({
        error: `Cannot submit for approval: ${check.hardErrors} hard scheduling conflict(s) or unscheduled lessons must be resolved first.`,
        hardErrors: check.hardErrors,
      });
      return;
    }

    const now = new Date().toISOString();
    db.prepare(`UPDATE tt_versions SET status = 'review', review_comments = ?, updated_at = ? WHERE id = ?`).run(
      String(req.body?.comments || version.review_comments || ''),
      now,
      version.id
    );
    writeAudit(tenantId, String(version.id), 'SUBMITTED_FOR_REVIEW', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), String(req.authSession!.role));
    notifyMySqlTablesChanged(['tt_versions', 'tt_audit_logs']);
    res.json({ ok: true, status: 'review' });
  });

  app.post('/api/timetable/versions/:id/approve', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!req.authSession!.isSuperAdmin && !sessionHasAnyRole(req.authSession, APPROVER_ROLES)) {
      res.status(403).json({ error: 'Only authorized school officials (Admin, Head Teacher, Deputy Head, Dean of Studies) may approve timetables.' });
      return;
    }

    const db = getDb();
    const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ? AND tenant_id = ?`).get(req.params.id, tenantId) as any;
    if (!version) {
      res.status(404).json({ error: 'Timetable version not found.' });
      return;
    }

    const check = validateTimetableVersion(db, String(version.id));
    if (!check.canApprove) {
      res.status(400).json({
        error: `Approval blocked: Timetable contains ${check.hardErrors} unresolved hard conflict(s) or missing weekly lessons.`,
        hardErrors: check.hardErrors,
      });
      return;
    }

    const now = new Date().toISOString();
    const approverName = String(req.authSession!.user.name || req.authSession!.userId);
    db.prepare(
      `UPDATE tt_versions SET status = 'approved', approved_by = ?, approved_at = ?, review_comments = COALESCE(?, review_comments), updated_at = ? WHERE id = ?`
    ).run(approverName, now, req.body?.comments || null, now, version.id);

    writeAudit(tenantId, String(version.id), 'APPROVED', req.authSession!.userId, approverName, String(req.authSession!.role), { comments: req.body?.comments });
    notifyMySqlTablesChanged(['tt_versions', 'tt_audit_logs']);
    res.json({ ok: true, status: 'approved' });
  });

  app.post('/api/timetable/versions/:id/reject', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!req.authSession!.isSuperAdmin && !sessionHasAnyRole(req.authSession, APPROVER_ROLES)) {
      res.status(403).json({ error: 'Only authorized school officials may reject timetable reviews.' });
      return;
    }

    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE tt_versions SET status = 'draft', review_comments = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`
    ).run(String(req.body?.comments || 'Returned for adjustments.'), now, req.params.id, tenantId);
    writeAudit(tenantId, String(req.params.id), 'REJECTED_TO_DRAFT', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), String(req.authSession!.role), { comments: req.body?.comments });
    notifyMySqlTablesChanged(['tt_versions', 'tt_audit_logs']);
    res.json({ ok: true, status: 'draft' });
  });

  app.post('/api/timetable/versions/:id/publish', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!req.authSession!.isSuperAdmin && !sessionHasAnyRole(req.authSession, APPROVER_ROLES)) {
      res.status(403).json({ error: 'Only authorized school officials may publish timetables.' });
      return;
    }

    const db = getDb();
    const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ? AND tenant_id = ?`).get(req.params.id, tenantId) as any;
    if (!version) {
      res.status(404).json({ error: 'Timetable version not found.' });
      return;
    }
    const check = validateTimetableVersion(db, String(version.id));
    if (!check.canApprove) {
      res.status(400).json({ error: `Cannot publish incomplete schedule with ${check.hardErrors} hard conflict(s).` });
      return;
    }

    const now = new Date().toISOString();
    const pubName = String(req.authSession!.user.name || req.authSession!.userId);

    db.exec('BEGIN IMMEDIATE');
    try {
      // Archive any currently published timetable for same config
      db.prepare(`UPDATE tt_versions SET status = 'archived', updated_at = ? WHERE config_id = ? AND status = 'published'`).run(
        now,
        version.config_id
      );
      db.prepare(
        `UPDATE tt_versions
         SET status = 'published',
             approved_by = COALESCE(approved_by, ?),
             approved_at = COALESCE(approved_at, ?),
             published_by = ?,
             published_at = ?,
             updated_at = ?
         WHERE id = ?`
      ).run(pubName, now, pubName, now, now, version.id);

      db.prepare(`UPDATE tt_configs SET active_version_id = ?, updated_at = ? WHERE id = ?`).run(version.id, now, version.config_id);
      publishVersionEffects(db, tenantId, String(version.id), req.authSession!.userId, pubName);
      writeAudit(tenantId, String(version.id), 'PUBLISHED', req.authSession!.userId, pubName, String(req.authSession!.role), { versionName: version.name });
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    notifyMySqlTablesChanged(['tt_versions', 'tt_configs', 'tt_audit_logs']);
    res.json({ ok: true, status: 'published' });
  });

  app.post('/api/timetable/versions/:id/withdraw', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!req.authSession!.isSuperAdmin && !sessionHasAnyRole(req.authSession, APPROVER_ROLES)) {
      res.status(403).json({ error: 'Only authorized school officials may withdraw published timetables.' });
      return;
    }

    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`UPDATE tt_versions SET status = 'review', withdrawn_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ?`).run(
      now,
      now,
      req.params.id,
      tenantId
    );
    writeAudit(tenantId, String(req.params.id), 'PUBLICATION_WITHDRAWN', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), String(req.authSession!.role));
    notifyMySqlTablesChanged(['tt_versions', 'tt_audit_logs']);
    res.json({ ok: true, status: 'review' });
  });

  app.post('/api/timetable/versions/:id/restore', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const src = db.prepare(`SELECT * FROM tt_versions WHERE id = ? AND tenant_id = ?`).get(req.params.id, tenantId) as any;
    if (!src) {
      res.status(404).json({ error: 'Source timetable version not found.' });
      return;
    }

    const maxVer = (db.prepare(`SELECT MAX(version_number) as m FROM tt_versions WHERE config_id = ?`).get(src.config_id) as any)?.m || 0;
    const nextNum = Number(maxVer) + 1;
    const newVerId = uid('ttver');
    const newName = String(req.body?.name || `${src.name} (Restored Draft v${nextNum})`);
    const now = new Date().toISOString();

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(
        `INSERT INTO tt_versions (id, tenant_id, config_id, version_number, name, status, metrics_json, parent_version_id, created_by, created_by_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`
      ).run(
        newVerId,
        tenantId,
        src.config_id,
        nextNum,
        newName,
        src.metrics_json,
        src.id,
        req.authSession!.userId,
        String(req.authSession!.user.name || 'Admin'),
        now,
        now
      );

      const srcEntries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(src.id) as any[];
      const insE = db.prepare(
        `INSERT INTO tt_entries
           (id, version_id, tenant_id, day_of_week, period_number, grade, stream, stream_label, group_id, group_name, joint_lesson_id, allocation_id, subject_name, teacher_ids_json, teacher_names_json, room_id, room_name, session_block_id, block_length, block_index, is_locked, locked_by, notes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const e of srcEntries) {
        insE.run(
          uid('ttent'),
          newVerId,
          tenantId,
          e.day_of_week,
          e.period_number,
          e.grade,
          e.stream,
          e.stream_label,
          e.group_id,
          e.group_name,
          e.joint_lesson_id,
          e.allocation_id,
          e.subject_name,
          e.teacher_ids_json,
          e.teacher_names_json,
          e.room_id,
          e.room_name,
          e.session_block_id,
          e.block_length,
          e.block_index,
          e.is_locked,
          e.locked_by,
          e.notes,
          now
        );
      }

      db.prepare(`UPDATE tt_configs SET active_version_id = ? WHERE id = ?`).run(newVerId, src.config_id);
      validateTimetableVersion(db, newVerId);
      writeAudit(tenantId, newVerId, 'VERSION_RESTORED', req.authSession!.userId, String(req.authSession!.user.name || 'Admin'), String(req.authSession!.role), { sourceVersionId: src.id });
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    notifyMySqlTablesChanged(['tt_versions', 'tt_entries', 'tt_validation_conflicts', 'tt_audit_logs']);
    res.status(201).json({ id: newVerId, name: newName, versionNumber: nextNum });
  });

  // ------------------------------------------------------------------
  // 8. PORTAL-SCOPED PUBLISHED TIMETABLE VIEW (Admin, Teacher, Student, Parent)
  // ------------------------------------------------------------------
  app.get('/api/timetable/published', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;

    const db = getDb();
    const session = req.authSession!;
    const role = String(session.role || '').toLowerCase();

    const pubVersion = db
      .prepare(`SELECT * FROM tt_versions WHERE tenant_id = ? AND status = 'published' ORDER BY published_at DESC LIMIT 1`)
      .get(tenantId) as any;

    if (!pubVersion) {
      res.json({ published: false, version: null, entries: [], periods: [], workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] });
      return;
    }

    const cfg = db.prepare(`SELECT * FROM tt_configs WHERE id = ?`).get(String(pubVersion.config_id)) as any;
    const periods = db.prepare(`SELECT * FROM tt_periods WHERE config_id = ? ORDER BY sort_order ASC`).all(String(pubVersion.config_id)) as any[];
    const allEntries = db
      .prepare(`SELECT * FROM tt_entries WHERE version_id = ? ORDER BY day_of_week, period_number`)
      .all(String(pubVersion.id)) as any[];

    let filteredEntries = allEntries;

    const viewAsTeacher = String(req.query.viewAs || '').toLowerCase() === 'teacher';
    const EXECUTIVE_FULL_VIEW = new Set([
      'admin',
      'head_teacher',
      'deputy_head',
      'dean_of_studies',
      'school_admin_staff',
      'principal',
      'director',
      'hod',
      'senior_teacher',
      'curriculum_coordinator',
    ]);
    const TEACHER_VIEW_ELIGIBLE = new Set([
      'teacher',
      'class_teacher',
      'hod',
      'senior_teacher',
      'deputy_head',
      'dean_of_studies',
      'curriculum_coordinator',
    ]);

    // Enforce strict portal data scoping while keeping Master, Class/Stream, and Teacher views 100% synced
    if (role === 'student') {
      const grade = Number(session.user.grade || 0);
      const stream = String(session.user.stream || '').toLowerCase();
      filteredEntries = allEntries.filter(
        (e) => Number(e.grade) === grade && String(e.stream || '').toLowerCase() === stream
      );
    } else if (role === 'parent') {
      // Find children linked to this parent
      const childIds = Array.isArray(session.user.childrenIds) ? session.user.childrenIds : [];
      const linkedStudents = db
        .prepare(`SELECT id, grade_label, stream_label FROM students WHERE school_id = ?`)
        .all(tenantId) as any[];
      const parentRows = db
        .prepare(`SELECT student_id FROM student_parents WHERE school_id = ? AND lower(email) = lower(?)`)
        .all(tenantId, String(session.user.email || '')) as any[];
      const allChildIds = new Set<string>([...childIds, ...parentRows.map((p) => String(p.student_id))]);
      const allowedClasses = new Set<string>();
      for (const st of linkedStudents) {
        if (allChildIds.has(String(st.id))) {
          const gm = String(st.grade_label || '').match(/\d+/);
          if (gm && st.stream_label) {
            allowedClasses.add(`${parseInt(gm[0], 10)}|${String(st.stream_label).toLowerCase()}`);
          }
        }
      }
      filteredEntries = allEntries.filter((e) => allowedClasses.has(`${e.grade}|${String(e.stream).toLowerCase()}`));
    } else if (viewAsTeacher && sessionHasAnyRole(session, TEACHER_VIEW_ELIGIBLE)) {
      const userId = String(session.userId);
      const userNameLower = String(session.user.name || '').toLowerCase();
      const tProf = db
        .prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? AND (user_id = ? OR lower(teacher_email) = lower(?)) LIMIT 1`)
        .get(tenantId, userId, String(session.user.email || '')) as any;
      const myProfileId = tProf ? String(tProf.id) : '';
      filteredEntries = allEntries.filter((e) => {
        const tIds = safeJsonParse<string[]>(e.teacher_ids_json, []);
        const tNames = safeJsonParse<string[]>(e.teacher_names_json, []).map((n) => n.toLowerCase());
        return (myProfileId && tIds.includes(myProfileId)) || tNames.includes(userNameLower);
      });
    } else if (!EXECUTIVE_FULL_VIEW.has(role) && (role === 'teacher' || role === 'class_teacher')) {
      // Return BOTH this teacher's own lessons AND full routine for their assigned streams so Teacher View and Class/Stream View stay 100% synced
      const userId = String(session.userId);
      const userNameLower = String(session.user.name || '').toLowerCase();
      const tProf = db
        .prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? AND (user_id = ? OR lower(teacher_email) = lower(?)) LIMIT 1`)
        .get(tenantId, userId, String(session.user.email || '')) as any;
      const myProfileId = tProf ? String(tProf.id) : '';

      const myAssignedClassKeys = new Set<string>();
      if (session.user.grade && session.user.stream) {
        myAssignedClassKeys.add(`${Number(session.user.grade)}|${String(session.user.stream).toLowerCase()}`);
      }
      if (Array.isArray(session.user.assignedStreams)) {
        for (const as of session.user.assignedStreams) {
          if (as?.grade && as?.stream) {
            myAssignedClassKeys.add(`${Number(as.grade)}|${String(as.stream).toLowerCase()}`);
          }
        }
      }
      for (const e of allEntries) {
        const tIds = safeJsonParse<string[]>(e.teacher_ids_json, []);
        const tNames = safeJsonParse<string[]>(e.teacher_names_json, []).map((n) => n.toLowerCase());
        if ((myProfileId && tIds.includes(myProfileId)) || tNames.includes(userNameLower)) {
          myAssignedClassKeys.add(`${Number(e.grade)}|${String(e.stream || '').toLowerCase()}`);
        }
      }

      filteredEntries = allEntries.filter((e) => {
        const tIds = safeJsonParse<string[]>(e.teacher_ids_json, []);
        const tNames = safeJsonParse<string[]>(e.teacher_names_json, []).map((n) => n.toLowerCase());
        const matchesTeacher = (myProfileId && tIds.includes(myProfileId)) || tNames.includes(userNameLower);
        const matchesClass = myAssignedClassKeys.has(`${Number(e.grade)}|${String(e.stream || '').toLowerCase()}`);
        return matchesTeacher || matchesClass;
      });
    }

    res.json({
      published: true,
      version: {
        id: String(pubVersion.id),
        name: String(pubVersion.name),
        versionNumber: Number(pubVersion.version_number),
        publishedAt: pubVersion.published_at,
        publishedBy: pubVersion.published_by,
        term: cfg?.term || 'Term 1',
        academicYear: cfg?.academic_year || '2026',
      },
      workingDays: safeJsonParse<string[]>(cfg?.working_days_json, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      periods: periods.map((p) => ({
        id: String(p.id),
        periodNumber: Number(p.period_number),
        label: String(p.label),
        kind: String(p.kind),
        startTime: String(p.start_time),
        endTime: String(p.end_time),
        sortOrder: Number(p.sort_order),
      })),
      entries: filteredEntries.map((e) => ({
        id: String(e.id),
        dayOfWeek: String(e.day_of_week),
        periodNumber: Number(e.period_number),
        grade: Number(e.grade),
        stream: String(e.stream),
        groupName: String(e.group_name || 'Whole Class'),
        subjectName: String(e.subject_name),
        teacherNames: safeJsonParse<string[]>(e.teacher_names_json, []),
        roomName: String(e.room_name || 'Classroom'),
        blockLength: Number(e.block_length || 1),
        isJointLesson: Boolean(e.joint_lesson_id),
      })),
    });
  });
}
