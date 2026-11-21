import crypto from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { getDb, notifyMySqlTablesChanged, writeSecurityAudit } from './db.ts';
import {
  requireAuth,
  resolveAuthorizedTenantId,
  sessionHasAnyRole,
  type AuthSession,
} from './authRoutes.ts';
import { broadcastChange } from './realtimeBus.ts';
import {
  buildDefaultPeriodSlots,
  ensureTimetableSeedForSchool,
  getCategoryForGrade,
  TIMETABLE_CATEGORIES,
  WEEKDAYS,
  type AllocationProcessingMode,
  type AssignmentAllocationSource,
  type FacilityType,
  type PeriodSlotDefinition,
  type StudentGroupMode,
  type TeacherAssignmentRole,
  type TimetableCategoryId,
  type TimetableSubjectKind,
} from './timetableSchema.ts';
import {
  generateTimetableSchedule,
  resolveEffectiveStreamAllocations,
  validateTimetableEntries,
  validateTimetableReadiness,
  type EngineFacility,
  type EngineInput,
  type EngineRemedialConfig,
  type EngineScheduleConfig,
  type EngineStream,
  type EngineSubject,
  type EngineTeacherAssignment,
  type EngineTimetableEntry,
} from './timetableEngine.ts';

const TIMETABLE_ADMIN_ROLES = new Set([
  'admin',
  'head_teacher',
  'deputy_head',
  'dean_of_studies',
  'curriculum_coordinator',
]);

const VALID_CATEGORIES = new Set<TimetableCategoryId>(['cat_1_3', 'cat_4_6', 'cat_7_9']);
const VALID_ALLOCATION_MODES = new Set<AllocationProcessingMode>([
  'individual_teacher',
  'category_redistribution',
]);
const VALID_ALLOCATION_SOURCES = new Set<AssignmentAllocationSource>([
  'individual',
  'category_redistribution',
]);
const VALID_FACILITY_TYPES = new Set<FacilityType>([
  'computer_lab',
  'ict_robotics_lab',
  'library',
  'swimming_pool',
  'maktaba_room',
  'clubs_venue',
  'general_room',
]);
const VALID_ASSIGNMENT_ROLES = new Set<TeacherAssignmentRole>([
  'subject_teacher',
  'supervisor',
  'remedial_teacher',
]);

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseGradeNumber(label: string | number | null | undefined): number | null {
  if (typeof label === 'number' && Number.isFinite(label)) {
    return label >= 1 && label <= 9 ? Math.trunc(label) : null;
  }
  if (!label) return null;
  const match = String(label).match(/\b([1-9])\b/);
  return match ? Number(match[1]) : null;
}

function isTimetableAdmin(session: AuthSession): boolean {
  return Boolean(session.isSuperAdmin || sessionHasAnyRole(session, TIMETABLE_ADMIN_ROLES));
}

function emitTimetableBroadcast(
  schoolId: string,
  actorId: string,
  type: 'record:created' | 'record:updated' | 'record:deleted',
  recordId?: string
): void {
  broadcastChange({
    type,
    collection: 'edusmart_timetable',
    tenantId: schoolId,
    recordId,
    actorId,
    timestamp: new Date().toISOString(),
  });
}

interface DirectoryTeacher {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DirectoryStudent {
  id: string;
  name: string;
  admissionNumber: string;
  grade: number;
  stream: string;
}

function loadSchoolDirectory(schoolId: string): {
  streams: EngineStream[];
  teachers: DirectoryTeacher[];
  students: DirectoryStudent[];
} {
  const db = getDb();

  // 1. Load real students first so we can attach studentIds to streams
  const studentRows = db
    .prepare(
      `SELECT id, name, admission_number, grade_label, stream_label, class_name
       FROM students
       WHERE school_id = ? AND is_active = 1
       ORDER BY name ASC`
    )
    .all(schoolId) as Array<{
    id: string;
    name: string;
    admission_number: string | null;
    grade_label: string | null;
    stream_label: string | null;
    class_name: string | null;
  }>;

  const provStudents = db
    .prepare(
      `SELECT id, name, admission_number, grade, stream
       FROM provisioned_accounts
       WHERE school_id = ? AND role = 'student' AND is_active = 1
       ORDER BY name ASC`
    )
    .all(schoolId) as Array<{
    id: string;
    name: string;
    admission_number: string | null;
    grade: number | null;
    stream: string | null;
  }>;

  const studentMap = new Map<string, DirectoryStudent>();
  for (const s of studentRows) {
    const g = parseGradeNumber(s.grade_label || s.class_name);
    if (!g) continue;
    const stName = (s.stream_label || 'North').trim();
    studentMap.set(s.id, {
      id: s.id,
      name: s.name,
      admissionNumber: s.admission_number || '',
      grade: g,
      stream: stName,
    });
  }
  for (const s of provStudents) {
    if (studentMap.has(s.id)) continue;
    const g = parseGradeNumber(s.grade);
    if (!g) continue;
    studentMap.set(s.id, {
      id: s.id,
      name: s.name,
      admissionNumber: s.admission_number || '',
      grade: g,
      stream: (s.stream || 'North').trim(),
    });
  }
  const students = Array.from(studentMap.values());

  // 2. Load active grades & streams
  const streamKeyMap = new Map<string, EngineStream>();

  const normStreams = db
    .prepare(
      `SELECT g.grade_number, g.name as grade_name, s.name as stream_name
       FROM streams s
       JOIN grades g ON g.id = s.grade_id
       WHERE s.school_id = ? AND s.is_active = 1 AND g.is_active = 1
       ORDER BY g.grade_number ASC, s.name ASC`
    )
    .all(schoolId) as Array<{
    grade_number: number | null;
    grade_name: string;
    stream_name: string;
  }>;

  for (const row of normStreams) {
    const g = parseGradeNumber(row.grade_number ?? row.grade_name);
    if (!g) continue;
    const st = row.stream_name.trim();
    if (!st) continue;
    const key = `${g}::${st.toLowerCase()}`;
    if (!streamKeyMap.has(key)) {
      streamKeyMap.set(key, {
        grade: g,
        stream: st,
        categoryId: getCategoryForGrade(g),
        studentIds: [],
      });
    }
  }

  if (streamKeyMap.size === 0) {
    const legacyStreams = db
      .prepare(
        `SELECT sg.name as grade_name, ss.name as stream_name
         FROM school_streams ss
         JOIN school_grades sg ON sg.id = ss.grade_id
         WHERE ss.school_id = ?
         ORDER BY sg.name ASC, ss.name ASC`
      )
      .all(schoolId) as Array<{ grade_name: string; stream_name: string }>;

    for (const row of legacyStreams) {
      const g = parseGradeNumber(row.grade_name);
      if (!g) continue;
      const st = row.stream_name.trim();
      if (!st) continue;
      const key = `${g}::${st.toLowerCase()}`;
      if (!streamKeyMap.has(key)) {
        streamKeyMap.set(key, {
          grade: g,
          stream: st,
          categoryId: getCategoryForGrade(g),
          studentIds: [],
        });
      }
    }
  }

  for (const stu of students) {
    const key = `${stu.grade}::${stu.stream.toLowerCase()}`;
    if (!streamKeyMap.has(key)) {
      streamKeyMap.set(key, {
        grade: stu.grade,
        stream: stu.stream,
        categoryId: getCategoryForGrade(stu.grade),
        studentIds: [],
      });
    }
    streamKeyMap.get(key)!.studentIds.push(stu.id);
  }

  if (streamKeyMap.size === 0) {
    for (let g = 1; g <= 9; g++) {
      streamKeyMap.set(`${g}::a`, {
        grade: g,
        stream: 'A',
        categoryId: getCategoryForGrade(g),
        studentIds: [],
      });
    }
  }

  const streams = Array.from(streamKeyMap.values()).sort(
    (a, b) => a.grade - b.grade || a.stream.localeCompare(b.stream)
  );

  // 3. Load selectable teachers / supervisors
  const STAFF_ROLES = [
    'teacher',
    'class_teacher',
    'hod',
    'senior_teacher',
    'dean_of_studies',
    'deputy_head',
    'head_teacher',
    'curriculum_coordinator',
    'librarian',
    'cocurricular_team',
    'admin',
  ];
  const placeholders = STAFF_ROLES.map(() => '?').join(', ');

  const userRows = db
    .prepare(
      `SELECT id, name, email, role FROM users
       WHERE school_id = ? AND is_active = 1 AND lower(role) IN (${placeholders})
       ORDER BY name ASC`
    )
    .all(schoolId, ...STAFF_ROLES) as Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;

  const provTeachers = db
    .prepare(
      `SELECT id, name, email, role FROM provisioned_accounts
       WHERE school_id = ? AND is_active = 1 AND lower(role) IN (${placeholders})
       ORDER BY name ASC`
    )
    .all(schoolId, ...STAFF_ROLES) as Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;

  const teacherMap = new Map<string, DirectoryTeacher>();
  for (const t of userRows) {
    teacherMap.set(t.id, { id: t.id, name: t.name, email: t.email, role: t.role });
  }
  for (const t of provTeachers) {
    if (!teacherMap.has(t.id)) {
      teacherMap.set(t.id, { id: t.id, name: t.name, email: t.email, role: t.role });
    }
  }

  return {
    streams,
    teachers: Array.from(teacherMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    students,
  };
}

function loadEngineInput(schoolId: string): {
  input: EngineInput;
  teachers: DirectoryTeacher[];
  students: DirectoryStudent[];
} {
  const db = getDb();
  ensureTimetableSeedForSchool(db, schoolId);
  const directory = loadSchoolDirectory(schoolId);

  const cfgRows = db
    .prepare('SELECT * FROM tt_schedule_config WHERE school_id = ?')
    .all(schoolId) as Array<{
    category_id: TimetableCategoryId;
    days_json: string;
    periods_per_day: number;
    period_duration_mins: number;
    periods_json: string;
    allocation_mode?: string | null;
  }>;

  const scheduleConfigs = {} as Record<TimetableCategoryId, EngineScheduleConfig>;
  for (const cat of TIMETABLE_CATEGORIES) {
    const row = cfgRows.find((r) => r.category_id === cat.id);
    if (row) {
      const mode: AllocationProcessingMode = VALID_ALLOCATION_MODES.has(
        row.allocation_mode as AllocationProcessingMode
      )
        ? (row.allocation_mode as AllocationProcessingMode)
        : 'category_redistribution';
      scheduleConfigs[cat.id] = {
        categoryId: cat.id,
        days: safeParseJson<string[]>(row.days_json, [...WEEKDAYS]),
        periodsPerDay: row.periods_per_day,
        periodDurationMins: row.period_duration_mins,
        periods: safeParseJson<PeriodSlotDefinition[]>(
          row.periods_json,
          buildDefaultPeriodSlots(row.periods_per_day, row.period_duration_mins)
        ),
        allocationMode: mode,
      };
    } else {
      scheduleConfigs[cat.id] = {
        categoryId: cat.id,
        days: [...WEEKDAYS],
        periodsPerDay: cat.defaultPeriodsPerDay,
        periodDurationMins: cat.defaultPeriodDurationMins,
        periods: buildDefaultPeriodSlots(cat.defaultPeriodsPerDay, cat.defaultPeriodDurationMins),
        allocationMode: 'category_redistribution',
      };
    }
  }

  const subRows = db
    .prepare(
      'SELECT * FROM tt_subjects WHERE school_id = ? ORDER BY category_id ASC, sort_order ASC, name ASC'
    )
    .all(schoolId) as Array<any>;

  const subjects: EngineSubject[] = subRows.map((r) => ({
    id: r.id,
    categoryId: r.category_id as TimetableCategoryId,
    code: r.code,
    name: r.name,
    shortCode: r.short_code,
    subjectKind: r.subject_kind as TimetableSubjectKind,
    isAdditionalCommon: Boolean(r.is_additional_common),
    lessonsPerWeek: Number(r.lessons_per_week) || 0,
    requiresFacilityType: (r.requires_facility_type || null) as FacilityType | null,
    defaultFacilityId: r.default_facility_id || null,
    equipmentNotes: r.equipment_notes || '',
    allowedDays: safeParseJson<string[]>(r.allowed_days_json, []),
    allowedPeriods: safeParseJson<number[]>(r.allowed_periods_json, []),
    isActive: Boolean(r.is_active),
    sortOrder: Number(r.sort_order) || 0,
  }));

  const facRows = db
    .prepare('SELECT * FROM tt_facilities WHERE school_id = ? ORDER BY name ASC')
    .all(schoolId) as Array<any>;

  const facilities: EngineFacility[] = facRows.map((r) => ({
    id: r.id,
    name: r.name,
    facilityType: r.facility_type as FacilityType,
    capacityStreams: Number(r.capacity_streams) || 1,
    seatCapacity: Number(r.seat_capacity) || 40,
    equipment: safeParseJson<string[]>(r.equipment_json, []),
    availableDays: safeParseJson<string[]>(r.available_days_json, [...WEEKDAYS]),
    availablePeriods: safeParseJson<number[]>(r.available_periods_json, [1, 2, 3, 4, 5, 6, 7, 8, 9]),
    notes: r.notes || '',
    isActive: Boolean(r.is_active),
  }));

  const taRows = db
    .prepare(
      'SELECT * FROM tt_teacher_assignments WHERE school_id = ? ORDER BY category_id ASC, teacher_name ASC'
    )
    .all(schoolId) as Array<any>;

  const teacherAssignments: EngineTeacherAssignment[] = taRows.map((r) => ({
    id: r.id,
    teacherId: r.teacher_id,
    teacherName: r.teacher_name,
    teacherEmail: r.teacher_email || '',
    categoryId: r.category_id as TimetableCategoryId,
    subjectId: r.subject_id,
    grade: r.grade === null || r.grade === undefined ? null : Number(r.grade),
    stream: r.stream || null,
    lessonsPerWeek:
      r.lessons_per_week === null || r.lessons_per_week === undefined
        ? null
        : Number(r.lessons_per_week),
    allocationSource: VALID_ALLOCATION_SOURCES.has(r.allocation_source as AssignmentAllocationSource)
      ? (r.allocation_source as AssignmentAllocationSource)
      : 'individual',
    roleType: r.role_type as TeacherAssignmentRole,
    maxWeeklyPeriods: Number(r.max_weekly_periods) || 28,
    facilityId: r.facility_id || null,
    equipmentNotes: r.equipment_notes || '',
    allowedDays: safeParseJson<string[]>(r.allowed_days_json, []),
    allowedPeriods: safeParseJson<number[]>(r.allowed_periods_json, []),
    isActive: Boolean(r.is_active),
  }));

  const remRows = db
    .prepare(
      'SELECT * FROM tt_remedial_configs WHERE school_id = ? ORDER BY category_id ASC, grade ASC, stream ASC, remedial_type ASC'
    )
    .all(schoolId) as Array<any>;

  const remedialConfigs: EngineRemedialConfig[] = remRows.map((r) => ({
    id: r.id,
    categoryId: r.category_id as TimetableCategoryId,
    remedialType: r.remedial_type as 'remedial_1' | 'remedial_2',
    subjectId: r.subject_id,
    grade: Number(r.grade),
    stream: r.stream,
    weeklyFrequency: Number(r.weekly_frequency) || 0,
    teacherId: r.teacher_id,
    teacherName: r.teacher_name,
    studentGroupMode: (r.student_group_mode || 'selected_learners') as StudentGroupMode,
    studentGroupName: r.student_group_name || '',
    studentIds: safeParseJson<string[]>(r.student_ids_json, []),
    durationMins: Number(r.duration_mins) || 40,
    availableDays: safeParseJson<string[]>(r.available_days_json, []),
    availablePeriods: safeParseJson<number[]>(r.available_periods_json, []),
    facilityId: r.facility_id || null,
    notes: r.notes || '',
    isActive: Boolean(r.is_active),
  }));

  return {
    input: {
      scheduleConfigs,
      subjects,
      facilities,
      teacherAssignments,
      remedialConfigs,
      streams: directory.streams,
    },
    teachers: directory.teachers,
    students: directory.students,
  };
}

function loadVersionEntries(schoolId: string, versionId: string): EngineTimetableEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM tt_entries
       WHERE school_id = ? AND version_id = ?
       ORDER BY grade ASC, stream ASC, day_of_week ASC, period_number ASC`
    )
    .all(schoolId, versionId) as Array<any>;

  return rows.map((r) => ({
    id: r.id,
    categoryId: r.category_id as TimetableCategoryId,
    grade: Number(r.grade),
    stream: r.stream,
    dayOfWeek: r.day_of_week,
    periodNumber: Number(r.period_number),
    startTime: r.start_time,
    endTime: r.end_time,
    durationMins: Number(r.duration_mins) || 35,
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    subjectKind: r.subject_kind as TimetableSubjectKind,
    teacherId: r.teacher_id,
    teacherName: r.teacher_name,
    facilityId: r.facility_id || null,
    facilityName: r.facility_name || null,
    remedialConfigId: r.remedial_config_id || null,
    studentGroupMode: (r.student_group_mode || 'whole_stream') as StudentGroupMode,
    studentGroupName: r.student_group_name || '',
    studentIds: safeParseJson<string[]>(r.student_ids_json, []),
    isLocked: Boolean(r.is_locked),
    notes: r.notes || '',
  }));
}

export function registerTimetableRoutes(app: Express): void {
  // -------------------------------------------------------------------------
  // GET /api/timetable/bootstrap
  // -------------------------------------------------------------------------
  app.get('/api/timetable/bootstrap', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    try {
      const db = getDb();
      const { input, teachers, students } = loadEngineInput(schoolId);

      const versionRows = db
        .prepare(
          `SELECT id, name, term_label, academic_year, status, validation_summary_json,
                  created_by, created_at, published_at
           FROM tt_versions
           WHERE school_id = ?
           ORDER BY CASE WHEN status = 'published' THEN 0 ELSE 1 END, created_at DESC`
        )
        .all(schoolId) as Array<any>;

      const versions = versionRows.map((v) => ({
        id: v.id,
        name: v.name,
        termLabel: v.term_label,
        academicYear: v.academic_year,
        status: v.status as 'draft' | 'published' | 'archived',
        createdBy: v.created_by,
        createdAt: v.created_at,
        publishedAt: v.published_at,
      }));

      const requestedVersionId =
        typeof req.query.versionId === 'string' && req.query.versionId.trim()
          ? req.query.versionId.trim()
          : null;

      const activeVersion =
        (requestedVersionId ? versions.find((v) => v.id === requestedVersionId) : null) ||
        versions.find((v) => v.status === 'published') ||
        versions[0] ||
        null;

      const entries = activeVersion ? loadVersionEntries(schoolId, activeVersion.id) : [];
      const audit = validateTimetableEntries(input, entries);

      return res.json({
        schoolId,
        categories: TIMETABLE_CATEGORIES,
        weekdays: [...WEEKDAYS],
        scheduleConfigs: input.scheduleConfigs,
        subjects: input.subjects,
        facilities: input.facilities,
        teacherAssignments: input.teacherAssignments,
        remedialConfigs: input.remedialConfigs,
        streams: input.streams,
        teachers,
        students,
        versions,
        activeVersion,
        entries,
        audit,
        canManage: isTimetableAdmin(session),
      });
    } catch (err: any) {
      console.error('[Timetable] bootstrap error:', err);
      return res.status(500).json({ error: 'Failed to load timetable workspace.' });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/timetable/published
  // -------------------------------------------------------------------------
  app.get('/api/timetable/published', requireAuth, (req: Request, res: Response) => {
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    try {
      const db = getDb();
      const { input } = loadEngineInput(schoolId);
      const published = db
        .prepare(
          `SELECT id, name, term_label, academic_year, status, created_by, created_at, published_at
           FROM tt_versions
           WHERE school_id = ? AND status = 'published'
           ORDER BY published_at DESC, created_at DESC
           LIMIT 1`
        )
        .get(schoolId) as any;

      const entries = published ? loadVersionEntries(schoolId, published.id) : [];

      return res.json({
        schoolId,
        categories: TIMETABLE_CATEGORIES,
        weekdays: [...WEEKDAYS],
        scheduleConfigs: input.scheduleConfigs,
        streams: input.streams,
        version: published
          ? {
              id: published.id,
              name: published.name,
              termLabel: published.term_label,
              academicYear: published.academic_year,
              status: published.status,
              publishedAt: published.published_at,
            }
          : null,
        entries,
      });
    } catch (err: any) {
      console.error('[Timetable] published view error:', err);
      return res.status(500).json({ error: 'Failed to load published timetable.' });
    }
  });

  // -------------------------------------------------------------------------
  // PUT /api/timetable/schedule-config/:categoryId
  // -------------------------------------------------------------------------
  app.put('/api/timetable/schedule-config/:categoryId', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const categoryId = req.params.categoryId as TimetableCategoryId;
    if (!VALID_CATEGORIES.has(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID.' });
    }

    const periodsPerDay = Number(req.body?.periodsPerDay);
    const periodDurationMins = Number(req.body?.periodDurationMins);
    const daysInput: string[] = Array.isArray(req.body?.days)
      ? req.body.days.filter((d: unknown) => typeof d === 'string' && (WEEKDAYS as readonly string[]).includes(d))
      : [...WEEKDAYS];

    if (!Number.isInteger(periodsPerDay) || periodsPerDay < 4 || periodsPerDay > 12) {
      return res.status(400).json({ error: 'Periods per day must be an integer between 4 and 12.' });
    }
    if (!Number.isInteger(periodDurationMins) || periodDurationMins < 20 || periodDurationMins > 90) {
      return res.status(400).json({ error: 'Period duration must be between 20 and 90 minutes.' });
    }
    if (daysInput.length === 0) {
      return res.status(400).json({ error: 'Select at least one teaching day.' });
    }

    const customPeriods =
      Array.isArray(req.body?.periods) && req.body.periods.length > 0
        ? req.body.periods
        : buildDefaultPeriodSlots(periodsPerDay, periodDurationMins);

    const db = getDb();
    ensureTimetableSeedForSchool(db, schoolId);
    const existingCfg = db
      .prepare('SELECT allocation_mode FROM tt_schedule_config WHERE school_id = ? AND category_id = ?')
      .get(schoolId, categoryId) as { allocation_mode?: string } | undefined;

    const requestedMode = req.body?.allocationMode as AllocationProcessingMode | undefined;
    const allocationMode: AllocationProcessingMode =
      requestedMode && VALID_ALLOCATION_MODES.has(requestedMode)
        ? requestedMode
        : existingCfg?.allocation_mode &&
            VALID_ALLOCATION_MODES.has(existingCfg.allocation_mode as AllocationProcessingMode)
          ? (existingCfg.allocation_mode as AllocationProcessingMode)
          : 'category_redistribution';

    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO tt_schedule_config (
        school_id, category_id, days_json, periods_per_day, period_duration_mins, periods_json, allocation_mode, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(school_id, category_id) DO UPDATE SET
        days_json = excluded.days_json,
        periods_per_day = excluded.periods_per_day,
        period_duration_mins = excluded.period_duration_mins,
        periods_json = excluded.periods_json,
        allocation_mode = excluded.allocation_mode,
        updated_at = excluded.updated_at`
    ).run(
      schoolId,
      categoryId,
      JSON.stringify(daysInput),
      periodsPerDay,
      periodDurationMins,
      JSON.stringify(customPeriods),
      allocationMode,
      now
    );

    notifyMySqlTablesChanged(['tt_schedule_config']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:updated', categoryId);

    const { input } = loadEngineInput(schoolId);
    const readiness = validateTimetableReadiness(input);
    return res.json({
      ok: true,
      scheduleConfig: input.scheduleConfigs[categoryId],
      categoryTotals: readiness.categoryTotals,
      readiness,
    });
  });

  // -------------------------------------------------------------------------
  // PUT /api/timetable/allocation-mode/:categoryId
  // -------------------------------------------------------------------------
  app.put('/api/timetable/allocation-mode/:categoryId', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const categoryId = req.params.categoryId as TimetableCategoryId;
    if (!VALID_CATEGORIES.has(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID.' });
    }

    const allocationMode = req.body?.allocationMode as AllocationProcessingMode;
    if (!VALID_ALLOCATION_MODES.has(allocationMode)) {
      return res.status(400).json({
        error: "Invalid allocation mode. Choose 'individual_teacher' or 'category_redistribution'.",
      });
    }

    const db = getDb();
    ensureTimetableSeedForSchool(db, schoolId);
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE tt_schedule_config
       SET allocation_mode = ?, updated_at = ?
       WHERE school_id = ? AND category_id = ?`
    ).run(allocationMode, now, schoolId, categoryId);

    writeSecurityAudit({
      schoolId,
      userId: session.userId,
      userEmail: session.user?.email,
      action: 'timetable_allocation_mode_changed',
      resource: `tt_schedule_config:${categoryId}`,
      details: `Switched ${categoryId} allocation mode to ${allocationMode}`,
    });
    notifyMySqlTablesChanged(['tt_schedule_config']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:updated', categoryId);

    const { input } = loadEngineInput(schoolId);
    const readiness = validateTimetableReadiness(input);
    return res.json({
      ok: true,
      scheduleConfig: input.scheduleConfigs[categoryId],
      categoryTotals: readiness.categoryTotals,
      readiness,
      streamAllocations: resolveEffectiveStreamAllocations(input),
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/timetable/redistribute-category/:categoryId
  // Option 2: Allocate subjects & lessons/wk at category level -> redistribute
  // to all active streams in category -> strictly link to assigned teacher.
  // -------------------------------------------------------------------------
  app.post(
    '/api/timetable/redistribute-category/:categoryId',
    requireAuth,
    (req: Request, res: Response) => {
      const session = req.authSession!;
      if (!isTimetableAdmin(session)) {
        return res.status(403).json({ error: 'Administrator privileges required.' });
      }
      const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
      if (!schoolId) return;

      const categoryId = req.params.categoryId as TimetableCategoryId;
      if (!VALID_CATEGORIES.has(categoryId)) {
        return res.status(400).json({ error: 'Invalid category ID.' });
      }

      const db = getDb();
      ensureTimetableSeedForSchool(db, schoolId);
      const now = new Date().toISOString();

      // Switch category into Option 2 (category_redistribution)
      db.prepare(
        `UPDATE tt_schedule_config SET allocation_mode = 'category_redistribution', updated_at = ?
         WHERE school_id = ? AND category_id = ?`
      ).run(now, schoolId, categoryId);

      const { input } = loadEngineInput(schoolId);
      const cfg = input.scheduleConfigs[categoryId];
      const availableRegularSlots = cfg.days.length * cfg.periodsPerDay;

      const catSubjects = input.subjects.filter(
        (s) => s.categoryId === categoryId && s.isActive && s.subjectKind !== 'remedial'
      );
      const allocatedRegularTotal = catSubjects.reduce(
        (sum, s) => sum + (Number(s.lessonsPerWeek) || 0),
        0
      );

      if (allocatedRegularTotal > availableRegularSlots) {
        return res.status(422).json({
          error: `Cannot redistribute ${allocatedRegularTotal} regular weekly lessons when only ${availableRegularSlots} periods are available (${cfg.days.length}d × ${cfg.periodsPerDay}p).`,
        });
      }

      const catStreams = input.streams.filter((st) => st.categoryId === categoryId);
      const maxPhysicalRegularSlots = Math.max(
        ...Object.values(input.scheduleConfigs).map((c) => c.days.length * c.periodsPerDay)
      );

      // Zero out stale redistributed stream rows whose category subject was reduced to 0
      const zeroSubjectIds = new Set(
        catSubjects.filter((s) => s.lessonsPerWeek <= 0).map((s) => s.id)
      );
      for (const zSubId of zeroSubjectIds) {
        db.prepare(
          `UPDATE tt_teacher_assignments
           SET lessons_per_week = 0, updated_at = ?
           WHERE school_id = ? AND category_id = ? AND subject_id = ?
             AND grade IS NOT NULL AND stream IS NOT NULL
             AND allocation_source = 'category_redistribution'`
        ).run(now, schoolId, categoryId, zSubId);
      }

      // Track live cumulative regular load per teacher across ALL categories so redistribution
      // can never silently create an impossible teacher load collision.
      const existingEffective = resolveEffectiveStreamAllocations(input);
      const teacherRegularLoad = new Map<string, number>();
      for (const ra of existingEffective) {
        if (ra.teacherId && ra.status === 'linked') {
          teacherRegularLoad.set(
            ra.teacherId,
            (teacherRegularLoad.get(ra.teacherId) || 0) + ra.lessonsPerWeek
          );
        }
      }

      let syncedCount = 0;
      let createdCount = 0;
      const unlinkedSlots: Array<{ grade: number; stream: string; subjectId: string; subjectName: string; lessonsPerWeek: number }> = [];
      const conflictSlots: Array<{ grade: number; stream: string; subjectName: string; teachers: string[] }> = [];
      const overloadedSlots: Array<{ grade: number; stream: string; subjectName: string; teacherName: string; projectedLoad: number; physicalLimit: number }> = [];

      const updateExactStmt = db.prepare(
        `UPDATE tt_teacher_assignments
         SET lessons_per_week = ?, allocation_source = 'category_redistribution', updated_at = ?
         WHERE id = ? AND school_id = ?`
      );
      const insertStreamStmt = db.prepare(`
        INSERT INTO tt_teacher_assignments (
          id, school_id, teacher_id, teacher_name, teacher_email, category_id, subject_id,
          grade, stream, lessons_per_week, allocation_source, role_type, max_weekly_periods,
          facility_id, equipment_notes, allowed_days_json, allowed_periods_json, is_active, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'category_redistribution', ?, ?, ?, ?, ?, ?, 1, ?)
      `);

      const activeCategorySubjects = catSubjects.filter((s) => s.lessonsPerWeek > 0);
      for (const st of catStreams) {
        const normStream = st.stream.trim().toLowerCase();
        for (const sub of activeCategorySubjects) {
          const matchingAll = input.teacherAssignments.filter(
            (a) => a.isActive && a.categoryId === categoryId && a.subjectId === sub.id
          );
          const exactMatches = matchingAll.filter(
            (a) => a.grade === st.grade && (a.stream || '').trim().toLowerCase() === normStream
          );

          if (exactMatches.length > 0) {
            const distinctTeachers = Array.from(new Set(exactMatches.map((m) => m.teacherId)));
            if (distinctTeachers.length > 1 || exactMatches.length > 1) {
              conflictSlots.push({
                grade: st.grade,
                stream: st.stream,
                subjectName: sub.name,
                teachers: exactMatches.map((m) => m.teacherName),
              });
              continue;
            }
            const existing = exactMatches[0];
            updateExactStmt.run(sub.lessonsPerWeek, now, existing.id, schoolId);
            syncedCount++;
            continue;
          }

          // No exact stream assignment yet — check grade-level or category-level authorized teacher
          const byGrade = matchingAll.filter(
            (a) => a.grade === st.grade && (!a.stream || a.stream.trim() === '')
          );
          const fallbackPool =
            byGrade.length > 0
              ? byGrade
              : matchingAll.filter(
                  (a) => a.grade === null && (!a.stream || a.stream.trim() === '')
                );

          if (fallbackPool.length === 0) {
            // Strict Requirement F: NEVER auto-assign teachers!
            unlinkedSlots.push({
              grade: st.grade,
              stream: st.stream,
              subjectId: sub.id,
              subjectName: sub.name,
              lessonsPerWeek: sub.lessonsPerWeek,
            });
            continue;
          }

          const distinctFallback = Array.from(new Set(fallbackPool.map((m) => m.teacherId)));
          if (distinctFallback.length > 1) {
            conflictSlots.push({
              grade: st.grade,
              stream: st.stream,
              subjectName: sub.name,
              teachers: fallbackPool.map((m) => m.teacherName),
            });
            continue;
          }

          const template = fallbackPool[0];
          const currentLoad = teacherRegularLoad.get(template.teacherId) || 0;
          // Note: existingEffective already counted this slot via category/grade fallback if it was linked;
          // check physical slot limit so we never create an impossible collision.
          if (currentLoad > maxPhysicalRegularSlots) {
            overloadedSlots.push({
              grade: st.grade,
              stream: st.stream,
              subjectName: sub.name,
              teacherName: template.teacherName,
              projectedLoad: currentLoad,
              physicalLimit: maxPhysicalRegularSlots,
            });
            continue;
          }

          const newId = `ta_${crypto.randomBytes(6).toString('hex')}`;
          insertStreamStmt.run(
            newId,
            schoolId,
            template.teacherId,
            template.teacherName,
            template.teacherEmail,
            categoryId,
            sub.id,
            st.grade,
            st.stream,
            sub.lessonsPerWeek,
            template.roleType,
            template.maxWeeklyPeriods,
            template.facilityId || sub.defaultFacilityId || null,
            template.equipmentNotes || sub.equipmentNotes || '',
            JSON.stringify(template.allowedDays),
            JSON.stringify(template.allowedPeriods),
            now
          );
          createdCount++;
        }
      }

      writeSecurityAudit({
        schoolId,
        userId: session.userId,
        userEmail: session.user?.email,
        action: 'timetable_category_redistributed',
        resource: `tt_teacher_assignments:${categoryId}`,
        details: `Redistributed ${categoryId} to ${catStreams.length} stream(s): synced ${syncedCount}, created ${createdCount}, unlinked ${unlinkedSlots.length}, conflicts ${conflictSlots.length}`,
      });
      notifyMySqlTablesChanged(['tt_schedule_config', 'tt_teacher_assignments']);
      emitTimetableBroadcast(schoolId, session.userId, 'record:updated', categoryId);

      const { input: refreshed } = loadEngineInput(schoolId);
      const readiness = validateTimetableReadiness(refreshed);
      return res.json({
        ok: true,
        syncedCount,
        createdCount,
        unlinkedSlots,
        conflictSlots,
        overloadedSlots,
        scheduleConfig: refreshed.scheduleConfigs[categoryId],
        teacherAssignments: refreshed.teacherAssignments,
        readiness,
        streamAllocations: resolveEffectiveStreamAllocations(refreshed),
      });
    }
  );

  // -------------------------------------------------------------------------
  // PUT /api/timetable/allocations/:categoryId
  // -------------------------------------------------------------------------
  app.put('/api/timetable/allocations/:categoryId', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const categoryId = req.params.categoryId as TimetableCategoryId;
    if (!VALID_CATEGORIES.has(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID.' });
    }

    const items = req.body?.allocations;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Allocations array is required.' });
    }

    const db = getDb();
    ensureTimetableSeedForSchool(db, schoolId);
    const now = new Date().toISOString();

    const updateStmt = db.prepare(`
      UPDATE tt_subjects
      SET lessons_per_week = ?,
          default_facility_id = ?,
          equipment_notes = ?,
          allowed_days_json = ?,
          allowed_periods_json = ?,
          is_active = ?,
          updated_at = ?
      WHERE id = ? AND school_id = ? AND category_id = ?
    `);

    for (const item of items) {
      if (!item || typeof item.id !== 'string') continue;
      const lessons = Math.max(0, Math.min(30, Math.trunc(Number(item.lessonsPerWeek) || 0)));
      const facilityId =
        typeof item.defaultFacilityId === 'string' && item.defaultFacilityId.trim()
          ? item.defaultFacilityId.trim()
          : null;
      const equipmentNotes =
        typeof item.equipmentNotes === 'string' ? item.equipmentNotes.trim().slice(0, 400) : '';
      const allowedDays = Array.isArray(item.allowedDays)
        ? item.allowedDays.filter(
            (d: unknown) => typeof d === 'string' && (WEEKDAYS as readonly string[]).includes(d)
          )
        : [];
      const allowedPeriods = Array.isArray(item.allowedPeriods)
        ? item.allowedPeriods
            .map((p: unknown) => Math.trunc(Number(p)))
            .filter((p: number) => Number.isInteger(p) && p >= 1 && p <= 15)
        : [];
      const isActive = item.isActive === false ? 0 : 1;

      updateStmt.run(
        lessons,
        facilityId,
        equipmentNotes,
        JSON.stringify(allowedDays),
        JSON.stringify(allowedPeriods),
        isActive,
        now,
        item.id,
        schoolId,
        categoryId
      );
    }

    writeSecurityAudit({
      schoolId,
      userId: session.userId,
      userEmail: session.user?.email,
      action: 'timetable_allocations_updated',
      resource: `tt_subjects:${categoryId}`,
      details: `Updated weekly lesson allocations for ${categoryId}`,
    });
    notifyMySqlTablesChanged(['tt_subjects']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:updated', categoryId);

    const { input } = loadEngineInput(schoolId);
    const readiness = validateTimetableReadiness(input);
    return res.json({
      ok: true,
      subjects: input.subjects.filter((s) => s.categoryId === categoryId),
      categoryTotals: readiness.categoryTotals,
      readiness,
    });
  });

  // -------------------------------------------------------------------------
  // Shared Facilities CRUD
  // -------------------------------------------------------------------------
  app.post('/api/timetable/facilities', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const facilityType = req.body?.facilityType as FacilityType;
    const capacityStreams = Math.max(1, Math.min(20, Math.trunc(Number(req.body?.capacityStreams) || 1)));
    const seatCapacity = Math.max(5, Math.min(500, Math.trunc(Number(req.body?.seatCapacity) || 40)));
    const equipment = Array.isArray(req.body?.equipment)
      ? req.body.equipment.map((e: unknown) => String(e).trim()).filter(Boolean)
      : [];
    const availableDays =
      Array.isArray(req.body?.availableDays) && req.body.availableDays.length > 0
        ? req.body.availableDays.filter((d: unknown) => (WEEKDAYS as readonly string[]).includes(String(d)))
        : [...WEEKDAYS];
    const availablePeriods =
      Array.isArray(req.body?.availablePeriods) && req.body.availablePeriods.length > 0
        ? req.body.availablePeriods
            .map((p: unknown) => Math.trunc(Number(p)))
            .filter((p: number) => p >= 1 && p <= 15)
        : [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim().slice(0, 500) : '';

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Facility name is required.' });
    }
    if (!VALID_FACILITY_TYPES.has(facilityType)) {
      return res.status(400).json({ error: 'Invalid facility type.' });
    }

    const db = getDb();
    ensureTimetableSeedForSchool(db, schoolId);
    const id = `fac_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tt_facilities (
        id, school_id, name, facility_type, capacity_streams, seat_capacity,
        equipment_json, available_days_json, available_periods_json, notes, is_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      schoolId,
      name,
      facilityType,
      capacityStreams,
      seatCapacity,
      JSON.stringify(equipment),
      JSON.stringify(availableDays),
      JSON.stringify(availablePeriods),
      notes,
      now
    );

    notifyMySqlTablesChanged(['tt_facilities']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:created', id);

    const { input } = loadEngineInput(schoolId);
    return res.status(201).json({ ok: true, id, facilities: input.facilities });
  });

  app.put('/api/timetable/facilities/:id', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const id = req.params.id;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const facilityType = req.body?.facilityType as FacilityType;
    const capacityStreams = Math.max(1, Math.min(20, Math.trunc(Number(req.body?.capacityStreams) || 1)));
    const seatCapacity = Math.max(5, Math.min(500, Math.trunc(Number(req.body?.seatCapacity) || 40)));
    const equipment = Array.isArray(req.body?.equipment)
      ? req.body.equipment.map((e: unknown) => String(e).trim()).filter(Boolean)
      : [];
    const availableDays =
      Array.isArray(req.body?.availableDays) && req.body.availableDays.length > 0
        ? req.body.availableDays.filter((d: unknown) => (WEEKDAYS as readonly string[]).includes(String(d)))
        : [...WEEKDAYS];
    const availablePeriods =
      Array.isArray(req.body?.availablePeriods) && req.body.availablePeriods.length > 0
        ? req.body.availablePeriods
            .map((p: unknown) => Math.trunc(Number(p)))
            .filter((p: number) => p >= 1 && p <= 15)
        : [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim().slice(0, 500) : '';
    const isActive = req.body?.isActive === false ? 0 : 1;

    if (!name || !VALID_FACILITY_TYPES.has(facilityType)) {
      return res.status(400).json({ error: 'Valid facility name and type are required.' });
    }

    const db = getDb();
    const result = db.prepare(`
      UPDATE tt_facilities
      SET name = ?, facility_type = ?, capacity_streams = ?, seat_capacity = ?,
          equipment_json = ?, available_days_json = ?, available_periods_json = ?,
          notes = ?, is_active = ?, updated_at = ?
      WHERE id = ? AND school_id = ?
    `).run(
      name,
      facilityType,
      capacityStreams,
      seatCapacity,
      JSON.stringify(equipment),
      JSON.stringify(availableDays),
      JSON.stringify(availablePeriods),
      notes,
      isActive,
      new Date().toISOString(),
      id,
      schoolId
    );

    if (!result.changes) return res.status(404).json({ error: 'Facility not found.' });

    notifyMySqlTablesChanged(['tt_facilities']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:updated', id);

    const { input } = loadEngineInput(schoolId);
    return res.json({ ok: true, facilities: input.facilities });
  });

  app.delete('/api/timetable/facilities/:id', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const db = getDb();
    db.prepare('DELETE FROM tt_facilities WHERE id = ? AND school_id = ?').run(req.params.id, schoolId);
    db.prepare(
      'UPDATE tt_subjects SET default_facility_id = NULL WHERE default_facility_id = ? AND school_id = ?'
    ).run(req.params.id, schoolId);

    notifyMySqlTablesChanged(['tt_facilities', 'tt_subjects']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:deleted', req.params.id);

    const { input } = loadEngineInput(schoolId);
    return res.json({ ok: true, facilities: input.facilities });
  });

  // -------------------------------------------------------------------------
  // Teacher & Supervisor Assignments CRUD (Strict Zero-Collision Guards)
  // -------------------------------------------------------------------------
  function validateAssignmentZeroCollision(
    schoolId: string,
    candidate: {
      teacherId: string;
      teacherName: string;
      categoryId: TimetableCategoryId;
      subjectId: string;
      grade: number | null;
      stream: string | null;
      lessonsPerWeek: number | null;
      allocationSource: AssignmentAllocationSource;
      roleType: TeacherAssignmentRole;
      maxWeeklyPeriods: number;
      facilityId: string | null;
      equipmentNotes: string;
      allowedDays: string[];
      allowedPeriods: number[];
    },
    options: { excludeId?: string; replaceExisting?: boolean } = {}
  ):
    | { ok: true; replaceId?: string }
    | { ok: false; status: number; error: string; existingAssignmentId?: string } {
    if (candidate.stream && candidate.grade === null) {
      return {
        ok: false,
        status: 400,
        error: 'Select a target grade before selecting a specific stream.',
      };
    }
    if (candidate.grade !== null && getCategoryForGrade(candidate.grade) !== candidate.categoryId) {
      return {
        ok: false,
        status: 400,
        error: `Grade ${candidate.grade} does not belong to the selected category.`,
      };
    }

    const { input } = loadEngineInput(schoolId);
    const normStream = (candidate.stream || '').trim().toLowerCase();

    // 1. Strict Duplicate Scope Ownership Guard (zero duplicate teacher per subject+grade+stream)
    const duplicate = input.teacherAssignments.find(
      (a) =>
        a.isActive &&
        a.id !== options.excludeId &&
        a.categoryId === candidate.categoryId &&
        a.subjectId === candidate.subjectId &&
        a.grade === candidate.grade &&
        (a.stream || '').trim().toLowerCase() === normStream
    );

    let replaceId: string | undefined;
    if (duplicate) {
      if (options.replaceExisting) {
        replaceId = duplicate.id;
      } else {
        const scopeText =
          candidate.grade !== null
            ? `Grade ${candidate.grade}${candidate.stream ? ` ${candidate.stream}` : ' (All streams)'}`
            : 'Category-wide';
        const subName =
          input.subjects.find((s) => s.id === candidate.subjectId)?.name || candidate.subjectId;
        return {
          ok: false,
          status: 409,
          error: `Collision blocked: ${duplicate.teacherName} is already assigned to ${subName} for ${scopeText}. Remove or replace the existing assignment to prevent duplicate ownership.`,
          existingAssignmentId: duplicate.id,
        };
      }
    }

    // 2. Simulate effective allocations to verify Stream Period Budget & Teacher Physical Slot Limit
    const simAssignment: EngineTeacherAssignment = {
      id: replaceId || options.excludeId || '__candidate__',
      teacherId: candidate.teacherId,
      teacherName: candidate.teacherName,
      teacherEmail: '',
      categoryId: candidate.categoryId,
      subjectId: candidate.subjectId,
      grade: candidate.grade,
      stream: candidate.stream,
      lessonsPerWeek: candidate.lessonsPerWeek,
      allocationSource: candidate.allocationSource,
      roleType: candidate.roleType,
      maxWeeklyPeriods: candidate.maxWeeklyPeriods,
      facilityId: candidate.facilityId,
      equipmentNotes: candidate.equipmentNotes,
      allowedDays: candidate.allowedDays,
      allowedPeriods: candidate.allowedPeriods,
      isActive: true,
    };

    const simAssignments = [
      ...input.teacherAssignments.filter(
        (a) => a.id !== options.excludeId && a.id !== replaceId
      ),
      simAssignment,
    ];
    const simInput: EngineInput = {
      ...input,
      teacherAssignments: simAssignments,
    };

    // Check concrete stream period budget when lessonsPerWeek > 0 on a concrete stream
    if (candidate.grade !== null && candidate.stream && (candidate.lessonsPerWeek || 0) > 0) {
      const cfg = input.scheduleConfigs[candidate.categoryId];
      const maxStreamSlots = cfg.days.length * cfg.periodsPerDay;
      const mode = cfg.allocationMode ?? 'category_redistribution';

      if (mode === 'individual_teacher') {
        const streamIndivTotal = simAssignments
          .filter(
            (a) =>
              a.isActive &&
              a.categoryId === candidate.categoryId &&
              a.grade === candidate.grade &&
              (a.stream || '').trim().toLowerCase() === normStream &&
              (Number(a.lessonsPerWeek) || 0) > 0
          )
          .reduce((sum, a) => sum + (Number(a.lessonsPerWeek) || 0), 0);

        if (streamIndivTotal > maxStreamSlots) {
          const previousTotal = streamIndivTotal - (candidate.lessonsPerWeek || 0);
          const remaining = Math.max(0, maxStreamSlots - previousTotal);
          return {
            ok: false,
            status: 422,
            error: `Stream period limit exceeded: Grade ${candidate.grade} ${candidate.stream} would have ${streamIndivTotal} weekly lessons, exceeding the ${maxStreamSlots} available weekly periods (${remaining} remaining).`,
          };
        }
      }
    }

    // Check teacher cumulative physical weekly slot feasibility across ALL categories & streams
    const simEffective = resolveEffectiveStreamAllocations(simInput);
    const maxPhysicalRegularSlots = Math.max(
      ...Object.values(input.scheduleConfigs).map((c) => c.days.length * c.periodsPerDay)
    );
    const teacherRegularTotal = simEffective
      .filter((ra) => ra.teacherId === candidate.teacherId)
      .reduce((sum, ra) => sum + ra.lessonsPerWeek, 0);

    if (teacherRegularTotal > maxPhysicalRegularSlots) {
      return {
        ok: false,
        status: 422,
        error: `Zero-collision guard: ${candidate.teacherName} would have ${teacherRegularTotal} regular weekly lessons across assigned streams, exceeding the ${maxPhysicalRegularSlots} physical weekly periods available in the timetable.`,
      };
    }

    return { ok: true, replaceId };
  }

  app.post('/api/timetable/teacher-assignments', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const teacherId = typeof req.body?.teacherId === 'string' ? req.body.teacherId.trim() : '';
    const teacherName = typeof req.body?.teacherName === 'string' ? req.body.teacherName.trim() : '';
    const teacherEmail = typeof req.body?.teacherEmail === 'string' ? req.body.teacherEmail.trim() : '';
    const categoryId = req.body?.categoryId as TimetableCategoryId;
    const subjectId = typeof req.body?.subjectId === 'string' ? req.body.subjectId.trim() : '';
    const grade =
      req.body?.grade === null || req.body?.grade === '' || req.body?.grade === undefined
        ? null
        : Number(req.body.grade);
    const stream =
      typeof req.body?.stream === 'string' && req.body.stream.trim() ? req.body.stream.trim() : null;
    const rawLessons = req.body?.lessonsPerWeek;
    const lessonsPerWeek =
      rawLessons === null || rawLessons === '' || rawLessons === undefined
        ? null
        : Math.max(0, Math.min(30, Math.trunc(Number(rawLessons))));
    const allocationSource: AssignmentAllocationSource = VALID_ALLOCATION_SOURCES.has(
      req.body?.allocationSource
    )
      ? req.body.allocationSource
      : 'individual';
    const replaceExisting = Boolean(req.body?.replaceExisting);
    const roleType = (req.body?.roleType || 'subject_teacher') as TeacherAssignmentRole;
    const maxWeeklyPeriods = Math.max(1, Math.min(45, Math.trunc(Number(req.body?.maxWeeklyPeriods) || 28)));
    const facilityId =
      typeof req.body?.facilityId === 'string' && req.body.facilityId.trim()
        ? req.body.facilityId.trim()
        : null;
    const equipmentNotes =
      typeof req.body?.equipmentNotes === 'string' ? req.body.equipmentNotes.trim().slice(0, 400) : '';
    const allowedDays = Array.isArray(req.body?.allowedDays)
      ? req.body.allowedDays.filter((d: unknown) => (WEEKDAYS as readonly string[]).includes(String(d)))
      : [];
    const allowedPeriods = Array.isArray(req.body?.allowedPeriods)
      ? req.body.allowedPeriods
          .map((p: unknown) => Math.trunc(Number(p)))
          .filter((p: number) => p >= 1 && p <= 15)
      : [];

    if (!teacherId || !teacherName) {
      return res.status(400).json({ error: 'Select an authorized teacher or supervisor.' });
    }
    if (!VALID_CATEGORIES.has(categoryId) || !subjectId) {
      return res.status(400).json({ error: 'Valid category and subject/activity are required.' });
    }
    if (!VALID_ASSIGNMENT_ROLES.has(roleType)) {
      return res.status(400).json({ error: 'Invalid teacher assignment role.' });
    }
    if (grade !== null && (!Number.isInteger(grade) || grade < 1 || grade > 9)) {
      return res.status(400).json({ error: 'Grade must be between 1 and 9.' });
    }
    if (lessonsPerWeek !== null && (!Number.isInteger(lessonsPerWeek) || lessonsPerWeek < 0 || lessonsPerWeek > 30)) {
      return res.status(400).json({ error: 'Lessons per week must be between 0 and 30.' });
    }

    const db = getDb();
    ensureTimetableSeedForSchool(db, schoolId);
    const subExists = db
      .prepare('SELECT id FROM tt_subjects WHERE id = ? AND school_id = ? AND category_id = ?')
      .get(subjectId, schoolId, categoryId);
    if (!subExists) {
      return res.status(404).json({ error: 'Selected subject does not exist in this category.' });
    }

    const guard = validateAssignmentZeroCollision(
      schoolId,
      {
        teacherId,
        teacherName,
        categoryId,
        subjectId,
        grade,
        stream,
        lessonsPerWeek,
        allocationSource,
        roleType,
        maxWeeklyPeriods,
        facilityId,
        equipmentNotes,
        allowedDays,
        allowedPeriods,
      },
      { replaceExisting }
    );
    if (!guard.ok) {
      return res.status(guard.status).json({
        error: guard.error,
        existingAssignmentId: guard.existingAssignmentId,
      });
    }

    const now = new Date().toISOString();
    let recordId: string;

    if (guard.replaceId) {
      recordId = guard.replaceId;
      db.prepare(`
        UPDATE tt_teacher_assignments
        SET teacher_id = ?, teacher_name = ?, teacher_email = ?, grade = ?, stream = ?,
            lessons_per_week = ?, allocation_source = ?, role_type = ?, max_weekly_periods = ?,
            facility_id = ?, equipment_notes = ?, allowed_days_json = ?, allowed_periods_json = ?,
            is_active = 1, updated_at = ?
        WHERE id = ? AND school_id = ?
      `).run(
        teacherId,
        teacherName,
        teacherEmail,
        grade,
        stream,
        lessonsPerWeek,
        allocationSource,
        roleType,
        maxWeeklyPeriods,
        facilityId,
        equipmentNotes,
        JSON.stringify(allowedDays),
        JSON.stringify(allowedPeriods),
        now,
        recordId,
        schoolId
      );
    } else {
      recordId = `ta_${crypto.randomBytes(6).toString('hex')}`;
      db.prepare(`
        INSERT INTO tt_teacher_assignments (
          id, school_id, teacher_id, teacher_name, teacher_email, category_id, subject_id,
          grade, stream, lessons_per_week, allocation_source, role_type, max_weekly_periods,
          facility_id, equipment_notes, allowed_days_json, allowed_periods_json, is_active, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        recordId,
        schoolId,
        teacherId,
        teacherName,
        teacherEmail,
        categoryId,
        subjectId,
        grade,
        stream,
        lessonsPerWeek,
        allocationSource,
        roleType,
        maxWeeklyPeriods,
        facilityId,
        equipmentNotes,
        JSON.stringify(allowedDays),
        JSON.stringify(allowedPeriods),
        now
      );
    }

    notifyMySqlTablesChanged(['tt_teacher_assignments']);
    emitTimetableBroadcast(
      schoolId,
      session.userId,
      guard.replaceId ? 'record:updated' : 'record:created',
      recordId
    );

    const { input } = loadEngineInput(schoolId);
    return res.status(guard.replaceId ? 200 : 201).json({
      ok: true,
      id: recordId,
      replaced: Boolean(guard.replaceId),
      teacherAssignments: input.teacherAssignments,
      readiness: validateTimetableReadiness(input),
      streamAllocations: resolveEffectiveStreamAllocations(input),
    });
  });

  app.put('/api/timetable/teacher-assignments/:id', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM tt_teacher_assignments WHERE id = ? AND school_id = ?')
      .get(req.params.id, schoolId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Teacher assignment not found.' });
    }

    const teacherId =
      typeof req.body?.teacherId === 'string' && req.body.teacherId.trim()
        ? req.body.teacherId.trim()
        : existing.teacher_id;
    const teacherName =
      typeof req.body?.teacherName === 'string' && req.body.teacherName.trim()
        ? req.body.teacherName.trim()
        : existing.teacher_name;
    const teacherEmail =
      typeof req.body?.teacherEmail === 'string' ? req.body.teacherEmail.trim() : existing.teacher_email || '';
    const categoryId = existing.category_id as TimetableCategoryId;
    const subjectId = existing.subject_id as string;

    const grade =
      req.body?.grade === undefined
        ? existing.grade === null
          ? null
          : Number(existing.grade)
        : req.body.grade === null || req.body.grade === ''
          ? null
          : Number(req.body.grade);
    const stream =
      req.body?.stream === undefined
        ? existing.stream || null
        : typeof req.body.stream === 'string' && req.body.stream.trim()
          ? req.body.stream.trim()
          : null;
    const lessonsPerWeek =
      req.body?.lessonsPerWeek === undefined
        ? existing.lessons_per_week === null || existing.lessons_per_week === undefined
          ? null
          : Number(existing.lessons_per_week)
        : req.body.lessonsPerWeek === null || req.body.lessonsPerWeek === ''
          ? null
          : Math.max(0, Math.min(30, Math.trunc(Number(req.body.lessonsPerWeek))));
    const allocationSource: AssignmentAllocationSource =
      req.body?.allocationSource && VALID_ALLOCATION_SOURCES.has(req.body.allocationSource)
        ? req.body.allocationSource
        : VALID_ALLOCATION_SOURCES.has(existing.allocation_source)
          ? existing.allocation_source
          : 'individual';
    const roleType = (req.body?.roleType || existing.role_type || 'subject_teacher') as TeacherAssignmentRole;
    const maxWeeklyPeriods = Math.max(
      1,
      Math.min(45, Math.trunc(Number(req.body?.maxWeeklyPeriods ?? existing.max_weekly_periods) || 28))
    );
    const facilityId =
      req.body?.facilityId === undefined
        ? existing.facility_id || null
        : typeof req.body.facilityId === 'string' && req.body.facilityId.trim()
          ? req.body.facilityId.trim()
          : null;
    const equipmentNotes =
      req.body?.equipmentNotes === undefined
        ? existing.equipment_notes || ''
        : typeof req.body.equipmentNotes === 'string'
          ? req.body.equipmentNotes.trim().slice(0, 400)
          : '';
    const allowedDays =
      req.body?.allowedDays === undefined
        ? safeParseJson<string[]>(existing.allowed_days_json, [])
        : Array.isArray(req.body.allowedDays)
          ? req.body.allowedDays.filter((d: unknown) => (WEEKDAYS as readonly string[]).includes(String(d)))
          : [];
    const allowedPeriods =
      req.body?.allowedPeriods === undefined
        ? safeParseJson<number[]>(existing.allowed_periods_json, [])
        : Array.isArray(req.body.allowedPeriods)
          ? req.body.allowedPeriods
              .map((p: unknown) => Math.trunc(Number(p)))
              .filter((p: number) => p >= 1 && p <= 15)
          : [];

    if (!VALID_ASSIGNMENT_ROLES.has(roleType)) {
      return res.status(400).json({ error: 'Invalid role type.' });
    }
    if (grade !== null && (!Number.isInteger(grade) || grade < 1 || grade > 9)) {
      return res.status(400).json({ error: 'Grade must be between 1 and 9.' });
    }

    const guard = validateAssignmentZeroCollision(
      schoolId,
      {
        teacherId,
        teacherName,
        categoryId,
        subjectId,
        grade,
        stream,
        lessonsPerWeek,
        allocationSource,
        roleType,
        maxWeeklyPeriods,
        facilityId,
        equipmentNotes,
        allowedDays,
        allowedPeriods,
      },
      { excludeId: req.params.id }
    );
    if (!guard.ok) {
      return res.status(guard.status).json({ error: guard.error });
    }

    db.prepare(`
      UPDATE tt_teacher_assignments
      SET teacher_id = ?, teacher_name = ?, teacher_email = ?, grade = ?, stream = ?,
          lessons_per_week = ?, allocation_source = ?, role_type = ?, max_weekly_periods = ?,
          facility_id = ?, equipment_notes = ?, allowed_days_json = ?,
          allowed_periods_json = ?, updated_at = ?
      WHERE id = ? AND school_id = ?
    `).run(
      teacherId,
      teacherName,
      teacherEmail,
      grade,
      stream,
      lessonsPerWeek,
      allocationSource,
      roleType,
      maxWeeklyPeriods,
      facilityId,
      equipmentNotes,
      JSON.stringify(allowedDays),
      JSON.stringify(allowedPeriods),
      new Date().toISOString(),
      req.params.id,
      schoolId
    );

    notifyMySqlTablesChanged(['tt_teacher_assignments']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:updated', req.params.id);

    const { input } = loadEngineInput(schoolId);
    return res.json({
      ok: true,
      teacherAssignments: input.teacherAssignments,
      readiness: validateTimetableReadiness(input),
      streamAllocations: resolveEffectiveStreamAllocations(input),
    });
  });

  app.delete('/api/timetable/teacher-assignments/:id', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const db = getDb();
    db.prepare('DELETE FROM tt_teacher_assignments WHERE id = ? AND school_id = ?').run(
      req.params.id,
      schoolId
    );

    notifyMySqlTablesChanged(['tt_teacher_assignments']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:deleted', req.params.id);

    const { input } = loadEngineInput(schoolId);
    return res.json({
      ok: true,
      teacherAssignments: input.teacherAssignments,
      readiness: validateTimetableReadiness(input),
    });
  });

  // -------------------------------------------------------------------------
  // Remedial 1 & Remedial 2 Configurations CRUD
  // -------------------------------------------------------------------------
  app.post('/api/timetable/remedials', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const remedialType = req.body?.remedialType === 'remedial_2' ? 'remedial_2' : 'remedial_1';
    const grade = Number(req.body?.grade);
    const stream = typeof req.body?.stream === 'string' ? req.body.stream.trim() : '';
    const weeklyFrequency = Math.max(1, Math.min(10, Math.trunc(Number(req.body?.weeklyFrequency) || 1)));
    const teacherId = typeof req.body?.teacherId === 'string' ? req.body.teacherId.trim() : '';
    const teacherName = typeof req.body?.teacherName === 'string' ? req.body.teacherName.trim() : '';
    const studentGroupMode: StudentGroupMode =
      req.body?.studentGroupMode === 'whole_stream' ? 'whole_stream' : 'selected_learners';
    const studentGroupName =
      typeof req.body?.studentGroupName === 'string' ? req.body.studentGroupName.trim().slice(0, 120) : '';
    const studentIds = Array.isArray(req.body?.studentIds)
      ? req.body.studentIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];
    const durationMins = Math.max(20, Math.min(120, Math.trunc(Number(req.body?.durationMins) || 40)));
    const availableDays = Array.isArray(req.body?.availableDays)
      ? req.body.availableDays.filter((d: unknown) => (WEEKDAYS as readonly string[]).includes(String(d)))
      : [];
    const availablePeriods = Array.isArray(req.body?.availablePeriods)
      ? req.body.availablePeriods
          .map((p: unknown) => Math.trunc(Number(p)))
          .filter((p: number) => p >= 1 && p <= 15)
      : [];
    const facilityId =
      typeof req.body?.facilityId === 'string' && req.body.facilityId.trim()
        ? req.body.facilityId.trim()
        : null;
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim().slice(0, 400) : '';

    if (!Number.isInteger(grade) || grade < 1 || grade > 9 || !stream) {
      return res.status(400).json({ error: 'Valid target grade (1–9) and stream are required.' });
    }
    if (!teacherId || !teacherName) {
      return res.status(400).json({ error: 'An assigned remedial teacher is required.' });
    }
    if (studentGroupMode === 'selected_learners' && studentIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one participating student for Selected Learners mode.' });
    }

    const db = getDb();
    ensureTimetableSeedForSchool(db, schoolId);
    const categoryId = getCategoryForGrade(grade);
    const remSubject = db
      .prepare('SELECT id FROM tt_subjects WHERE school_id = ? AND category_id = ? AND code = ?')
      .get(schoolId, categoryId, remedialType) as { id: string } | undefined;

    if (!remSubject) {
      return res.status(404).json({ error: 'Remedial subject entry not found for category.' });
    }

    const id = `rem_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tt_remedial_configs (
        id, school_id, category_id, remedial_type, subject_id, grade, stream,
        weekly_frequency, teacher_id, teacher_name, student_group_mode, student_group_name,
        student_ids_json, duration_mins, available_days_json, available_periods_json,
        facility_id, notes, is_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      schoolId,
      categoryId,
      remedialType,
      remSubject.id,
      grade,
      stream,
      weeklyFrequency,
      teacherId,
      teacherName,
      studentGroupMode,
      studentGroupName,
      JSON.stringify(studentIds),
      durationMins,
      JSON.stringify(availableDays),
      JSON.stringify(availablePeriods),
      facilityId,
      notes,
      now
    );

    notifyMySqlTablesChanged(['tt_remedial_configs']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:created', id);

    const { input } = loadEngineInput(schoolId);
    return res.status(201).json({
      ok: true,
      id,
      remedialConfigs: input.remedialConfigs,
      readiness: validateTimetableReadiness(input),
    });
  });

  app.put('/api/timetable/remedials/:id', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const remedialType = req.body?.remedialType === 'remedial_2' ? 'remedial_2' : 'remedial_1';
    const grade = Number(req.body?.grade);
    const stream = typeof req.body?.stream === 'string' ? req.body.stream.trim() : '';
    const weeklyFrequency = Math.max(1, Math.min(10, Math.trunc(Number(req.body?.weeklyFrequency) || 1)));
    const teacherId = typeof req.body?.teacherId === 'string' ? req.body.teacherId.trim() : '';
    const teacherName = typeof req.body?.teacherName === 'string' ? req.body.teacherName.trim() : '';
    const studentGroupMode: StudentGroupMode =
      req.body?.studentGroupMode === 'whole_stream' ? 'whole_stream' : 'selected_learners';
    const studentGroupName =
      typeof req.body?.studentGroupName === 'string' ? req.body.studentGroupName.trim().slice(0, 120) : '';
    const studentIds = Array.isArray(req.body?.studentIds)
      ? req.body.studentIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];
    const durationMins = Math.max(20, Math.min(120, Math.trunc(Number(req.body?.durationMins) || 40)));
    const availableDays = Array.isArray(req.body?.availableDays)
      ? req.body.availableDays.filter((d: unknown) => (WEEKDAYS as readonly string[]).includes(String(d)))
      : [];
    const availablePeriods = Array.isArray(req.body?.availablePeriods)
      ? req.body.availablePeriods
          .map((p: unknown) => Math.trunc(Number(p)))
          .filter((p: number) => p >= 1 && p <= 15)
      : [];
    const facilityId =
      typeof req.body?.facilityId === 'string' && req.body.facilityId.trim()
        ? req.body.facilityId.trim()
        : null;
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim().slice(0, 400) : '';

    if (!Number.isInteger(grade) || grade < 1 || grade > 9 || !stream || !teacherId || !teacherName) {
      return res.status(400).json({ error: 'Valid grade, stream, and remedial teacher are required.' });
    }
    if (studentGroupMode === 'selected_learners' && studentIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one participating student for Selected Learners mode.' });
    }

    const db = getDb();
    const categoryId = getCategoryForGrade(grade);
    const remSubject = db
      .prepare('SELECT id FROM tt_subjects WHERE school_id = ? AND category_id = ? AND code = ?')
      .get(schoolId, categoryId, remedialType) as { id: string } | undefined;

    if (!remSubject) {
      return res.status(404).json({ error: 'Remedial subject entry not found.' });
    }

    const result = db.prepare(`
      UPDATE tt_remedial_configs
      SET category_id = ?, remedial_type = ?, subject_id = ?, grade = ?, stream = ?,
          weekly_frequency = ?, teacher_id = ?, teacher_name = ?, student_group_mode = ?,
          student_group_name = ?, student_ids_json = ?, duration_mins = ?,
          available_days_json = ?, available_periods_json = ?, facility_id = ?,
          notes = ?, updated_at = ?
      WHERE id = ? AND school_id = ?
    `).run(
      categoryId,
      remedialType,
      remSubject.id,
      grade,
      stream,
      weeklyFrequency,
      teacherId,
      teacherName,
      studentGroupMode,
      studentGroupName,
      JSON.stringify(studentIds),
      durationMins,
      JSON.stringify(availableDays),
      JSON.stringify(availablePeriods),
      facilityId,
      notes,
      new Date().toISOString(),
      req.params.id,
      schoolId
    );

    if (!result.changes) return res.status(404).json({ error: 'Remedial configuration not found.' });

    notifyMySqlTablesChanged(['tt_remedial_configs']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:updated', req.params.id);

    const { input } = loadEngineInput(schoolId);
    return res.json({
      ok: true,
      remedialConfigs: input.remedialConfigs,
      readiness: validateTimetableReadiness(input),
    });
  });

  app.delete('/api/timetable/remedials/:id', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const db = getDb();
    db.prepare('DELETE FROM tt_remedial_configs WHERE id = ? AND school_id = ?').run(
      req.params.id,
      schoolId
    );

    notifyMySqlTablesChanged(['tt_remedial_configs']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:deleted', req.params.id);

    const { input } = loadEngineInput(schoolId);
    return res.json({
      ok: true,
      remedialConfigs: input.remedialConfigs,
      readiness: validateTimetableReadiness(input),
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/timetable/validate
  // -------------------------------------------------------------------------
  app.post('/api/timetable/validate', requireAuth, (req: Request, res: Response) => {
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const versionId = typeof req.body?.versionId === 'string' ? req.body.versionId.trim() : '';
    const { input } = loadEngineInput(schoolId);
    const entries = versionId ? loadVersionEntries(schoolId, versionId) : [];
    const audit = validateTimetableEntries(input, entries);

    return res.json({ ok: true, audit });
  });

  // -------------------------------------------------------------------------
  // POST /api/timetable/generate
  // -------------------------------------------------------------------------
  app.post('/api/timetable/generate', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const termLabel =
      typeof req.body?.termLabel === 'string' && req.body.termLabel.trim()
        ? req.body.termLabel.trim().slice(0, 40)
        : 'Term 1';
    const academicYear =
      typeof req.body?.academicYear === 'string' && req.body.academicYear.trim()
        ? req.body.academicYear.trim().slice(0, 16)
        : String(new Date().getFullYear());
    const name =
      typeof req.body?.name === 'string' && req.body.name.trim()
        ? req.body.name.trim().slice(0, 120)
        : `${termLabel} ${academicYear} Master Timetable`;

    const { input } = loadEngineInput(schoolId);
    const result = generateTimetableSchedule(input);

    if (!result.audit.readyToGenerate) {
      return res.status(422).json({
        error: 'Timetable configuration is incomplete. Resolve readiness issues before generating.',
        audit: result.audit,
        unplacedTasks: result.unplacedTasks,
      });
    }

    const db = getDb();
    const versionId = `ttv_${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();
    const actorLabel = session.user?.name || session.user?.email || session.userId;

    db.prepare(`
      INSERT INTO tt_versions (
        id, school_id, name, term_label, academic_year, status,
        validation_summary_json, created_by, created_at, published_at
      ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, NULL)
    `).run(
      versionId,
      schoolId,
      name,
      termLabel,
      academicYear,
      JSON.stringify({
        isValid: result.audit.isValid,
        teacherCollisions: result.audit.teacherCollisions.length,
        facilityOverflows: result.audit.facilityOverflows.length,
        studentGroupConflicts: result.audit.studentGroupConflicts.length,
        unexplainedBlankSessions: result.audit.unexplainedBlankSessions.length,
        unplacedCount: result.unplacedTasks.length,
      }),
      actorLabel,
      now
    );

    const insertEntry = db.prepare(`
      INSERT INTO tt_entries (
        id, school_id, version_id, category_id, grade, stream, day_of_week,
        period_number, start_time, end_time, duration_mins, subject_id, subject_name,
        subject_kind, teacher_id, teacher_name, facility_id, facility_name,
        remedial_config_id, student_group_mode, student_group_name, student_ids_json,
        is_locked, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const e of result.entries) {
      insertEntry.run(
        e.id,
        schoolId,
        versionId,
        e.categoryId,
        e.grade,
        e.stream,
        e.dayOfWeek,
        e.periodNumber,
        e.startTime,
        e.endTime,
        e.durationMins,
        e.subjectId,
        e.subjectName,
        e.subjectKind,
        e.teacherId,
        e.teacherName,
        e.facilityId,
        e.facilityName,
        e.remedialConfigId,
        e.studentGroupMode,
        e.studentGroupName,
        JSON.stringify(e.studentIds),
        e.isLocked ? 1 : 0,
        e.notes,
        now
      );
    }

    writeSecurityAudit({
      schoolId,
      userId: session.userId,
      userEmail: session.user?.email,
      action: 'timetable_generated',
      resource: `tt_versions:${versionId}`,
      details: `Generated timetable "${name}" (${result.entries.length} entries, ${result.unplacedTasks.length} unplaced)`,
    });
    notifyMySqlTablesChanged(['tt_versions', 'tt_entries']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:created', versionId);

    return res.status(201).json({
      ok: true,
      success: result.success,
      version: {
        id: versionId,
        name,
        termLabel,
        academicYear,
        status: 'draft',
        createdBy: actorLabel,
        createdAt: now,
        publishedAt: null,
      },
      entries: result.entries,
      unplacedTasks: result.unplacedTasks,
      audit: result.audit,
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/timetable/versions/:versionId/publish
  // -------------------------------------------------------------------------
  app.post('/api/timetable/versions/:versionId/publish', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const versionId = req.params.versionId;
    const db = getDb();
    const version = db
      .prepare('SELECT id, name FROM tt_versions WHERE id = ? AND school_id = ?')
      .get(versionId, schoolId) as { id: string; name: string } | undefined;

    if (!version) return res.status(404).json({ error: 'Timetable version not found.' });

    const { input } = loadEngineInput(schoolId);
    const entries = loadVersionEntries(schoolId, versionId);
    const audit = validateTimetableEntries(input, entries);

    if (
      audit.teacherCollisions.length > 0 ||
      audit.facilityOverflows.length > 0 ||
      audit.studentGroupConflicts.length > 0
    ) {
      return res.status(422).json({
        error: 'Cannot publish timetable with teacher collisions, facility overflows, or student-group conflicts.',
        audit,
      });
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE tt_versions SET status = 'archived' WHERE school_id = ? AND status = 'published'`
    ).run(schoolId);
    db.prepare(
      `UPDATE tt_versions SET status = 'published', published_at = ? WHERE id = ? AND school_id = ?`
    ).run(now, versionId, schoolId);

    writeSecurityAudit({
      schoolId,
      userId: session.userId,
      userEmail: session.user?.email,
      action: 'timetable_published',
      resource: `tt_versions:${versionId}`,
      details: `Published timetable "${version.name}"`,
    });
    notifyMySqlTablesChanged(['tt_versions']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:updated', versionId);

    return res.json({ ok: true, versionId, publishedAt: now, audit });
  });

  // -------------------------------------------------------------------------
  // DELETE /api/timetable/versions/:versionId
  // -------------------------------------------------------------------------
  app.delete('/api/timetable/versions/:versionId', requireAuth, (req: Request, res: Response) => {
    const session = req.authSession!;
    if (!isTimetableAdmin(session)) {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    const schoolId = resolveAuthorizedTenantId(req, res, req.query.tenantId as string);
    if (!schoolId) return;

    const db = getDb();
    db.prepare('DELETE FROM tt_entries WHERE version_id = ? AND school_id = ?').run(
      req.params.versionId,
      schoolId
    );
    db.prepare('DELETE FROM tt_versions WHERE id = ? AND school_id = ?').run(
      req.params.versionId,
      schoolId
    );

    notifyMySqlTablesChanged(['tt_versions', 'tt_entries']);
    emitTimetableBroadcast(schoolId, session.userId, 'record:deleted', req.params.versionId);

    return res.json({ ok: true });
  });
}
