import type { Express, Request, Response } from 'express';
import { getDb, notifyMySqlTablesChanged } from './db.ts';
import { requireAuth, resolveAuthorizedTenantId } from './authRoutes.ts';
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
  if (session.isSuperAdmin || ADMIN_TIMETABLE_ROLES.has(String(session.role || '').toLowerCase())) {
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
    if (!b.name) {
      res.status(400).json({ error: 'Subject name is required.' });
      return;
    }
    const id = uid('ttsub');
    const code = String(b.code || String(b.name).slice(0, 4).toUpperCase());
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
      String(b.name).trim(),
      code,
      String(b.department || 'Academic'),
      b.isPractical ? 1 : 0,
      String(b.requiresRoomType || 'general'),
      String(b.colorToken || 'slate'),
      new Date().toISOString()
    );
    notifyMySqlTablesChanged(['tt_subjects']);
    res.status(201).json({ ok: true });
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
    if (!b.grade || !b.subjectName) {
      res.status(400).json({ error: 'Grade and subjectName are required.' });
      return;
    }

    const grade = Number(b.grade);
    const single = Number(b.singleLessons ?? 0);
    const dbl = Number(b.doubleLessons ?? 0);
    const triple = Number(b.tripleLessons ?? 0);
    const required = Number(b.requiredWeeklyPeriods ?? (single + dbl * 2 + triple * 3));
    const now = new Date().toISOString();
    const id = b.id || uid('ttga');

    db.prepare(
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
         teacher_ids_json = excluded.teacher_ids_json,
         student_group_label = excluded.student_group_label,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`
    ).run(
      id,
      tenantId,
      configId,
      grade,
      String(b.subjectName).trim(),
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
      JSON.stringify(Array.isArray(b.teacherIds) ? b.teacherIds : []),
      String(b.studentGroupLabel || 'Whole Class'),
      b.isActive === false ? 0 : 1,
      now
    );

    notifyMySqlTablesChanged(['tt_grade_subject_allocations']);
    res.json({ ok: true });
  });

  app.post('/api/timetable/allocations/apply-template', requireAuth, (req: Request, res: Response) => {
    const tenantId = resolveAuthorizedTenantId(req, res);
    if (!tenantId) return;
    if (!requireTimetableAdmin(req, res)) return;

    const db = getDb();
    const { configId } = ensureTenantTimetableSeeded(db, tenantId, req.authSession!.userId);
    const { grade, overwriteOverridden = false } = req.body || {};
    if (!grade) {
      res.status(400).json({ error: 'Target grade is required.' });
      return;
    }

    const targetGrade = Number(grade);
    const gradeTemplates = db
      .prepare(`SELECT * FROM tt_grade_subject_allocations WHERE config_id = ? AND grade = ?`)
      .all(configId, targetGrade) as any[];
    const wholeGroups = db
      .prepare(`SELECT * FROM tt_student_groups WHERE tenant_id = ? AND grade = ? AND is_whole_class = 1`)
      .all(tenantId, targetGrade) as any[];

    const now = new Date().toISOString();
    let updatedCount = 0;

    db.exec('BEGIN IMMEDIATE');
    try {
      for (const wg of wholeGroups) {
        const stream = String(wg.stream);
        for (const tpl of gradeTemplates) {
          const existing = db
            .prepare(
              `SELECT id, is_overridden FROM tt_stream_subject_allocations
               WHERE config_id = ? AND grade = ? AND stream = ? AND lower(subject_name) = lower(?) AND (group_id = ? OR group_id IS NULL)`
            )
            .get(configId, targetGrade, stream, String(tpl.subject_name), String(wg.id)) as any;

          if (existing && Number(existing.is_overridden) === 1 && !overwriteOverridden) {
            continue; // Respect explicit stream override unless requested
          }

          if (existing) {
            db.prepare(
              `UPDATE tt_stream_subject_allocations
               SET inherited_from_id = ?, is_overridden = 0, required_weekly_periods = ?, single_lessons = ?, double_lessons = ?, triple_lessons = ?,
                   pattern_preference = ?, max_per_day = ?, min_spacing_days = ?, preferred_days_json = ?, preferred_periods_json = ?,
                   required_room_type = ?, room_id = COALESCE(?, room_id), teacher_ids_json = CASE WHEN json_array_length(?) > 0 THEN ? ELSE teacher_ids_json END,
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
              tpl.teacher_ids_json,
              tpl.teacher_ids_json,
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
              tpl.teacher_ids_json,
              tpl.is_active,
              now
            );
          }
          updatedCount++;
        }
      }
      writeAudit(
        tenantId,
        null,
        'TEMPLATE_APPLIED_TO_STREAMS',
        req.authSession!.userId,
        String(req.authSession!.user.name || 'Admin'),
        String(req.authSession!.role),
        { grade: targetGrade, updatedCount, overwriteOverridden }
      );
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    notifyMySqlTablesChanged(['tt_stream_subject_allocations', 'tt_audit_logs']);
    res.json({ ok: true, updatedCount });
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

    const now = new Date().toISOString();
    const id = b.id || uid('ttsa');
    const single = Number(b.singleLessons ?? 0);
    const dbl = Number(b.doubleLessons ?? 0);
    const triple = Number(b.tripleLessons ?? 0);
    const required = Number(b.requiredWeeklyPeriods ?? (single + dbl * 2 + triple * 3));
    const isOverridden = b.resetToInherited ? 0 : 1;

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
        JSON.stringify(Array.isArray(b.teacherIds) ? b.teacherIds : []),
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
        Number(b.grade),
        String(b.stream).trim(),
        b.groupId || null,
        String(b.subjectName).trim(),
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
        JSON.stringify(Array.isArray(b.teacherIds) ? b.teacherIds : []),
        b.isActive === false ? 0 : 1,
        now
      );
    }

    notifyMySqlTablesChanged(['tt_stream_subject_allocations']);
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

    // Compute combined student count from whole-class groups if not explicitly provided
    let combinedStudents = Number(b.combinedStudents || 0);
    if (combinedStudents <= 0) {
      for (const pc of b.participatingClasses) {
        const gRow = db
          .prepare(`SELECT student_count FROM tt_student_groups WHERE tenant_id = ? AND grade = ? AND stream = ? AND is_whole_class = 1 LIMIT 1`)
          .get(tenantId, Number(pc.grade), String(pc.stream)) as any;
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
      JSON.stringify(Array.isArray(b.teacherIds) ? b.teacherIds : []),
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
    if (!req.authSession!.isSuperAdmin && !APPROVER_ROLES.has(String(req.authSession!.role || '').toLowerCase())) {
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
    if (!req.authSession!.isSuperAdmin && !APPROVER_ROLES.has(String(req.authSession!.role || '').toLowerCase())) {
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
    if (!req.authSession!.isSuperAdmin && !APPROVER_ROLES.has(String(req.authSession!.role || '').toLowerCase())) {
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
    if (!req.authSession!.isSuperAdmin && !APPROVER_ROLES.has(String(req.authSession!.role || '').toLowerCase())) {
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

    // Enforce strict portal data scoping for students, parents, and teachers
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
    } else if (role === 'teacher' || role === 'class_teacher') {
      const userId = String(session.userId);
      const userNameLower = String(session.user.name || '').toLowerCase();
      const tProf = db
        .prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? AND (user_id = ? OR lower(teacher_email) = lower(?)) LIMIT 1`)
        .get(tenantId, userId, String(session.user.email || '')) as any;
      const myProfileId = tProf ? String(tProf.id) : '';
      filteredEntries = allEntries.filter((e) => {
        const tIds = safeJsonParse<string[]>(e.teacher_ids_json, []);
        const tNames = safeJsonParse<string[]>(e.teacher_names_json, []).map((n) => n.toLowerCase());
        const matchesTeacher = (myProfileId && tIds.includes(myProfileId)) || tNames.includes(userNameLower);
        if (role === 'class_teacher' && session.user.grade && session.user.stream) {
          const isOwnClass =
            Number(e.grade) === Number(session.user.grade) &&
            String(e.stream || '').toLowerCase() === String(session.user.stream).toLowerCase();
          return matchesTeacher || isOwnClass;
        }
        return matchesTeacher;
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
