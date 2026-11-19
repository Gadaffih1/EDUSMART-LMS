import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { getDb, notifyMySqlTablesChanged } from './db.ts';
import { upsertCollectionRecord } from './migrate.ts';
import { broadcastChange } from './realtimeBus.ts';

export interface TTPeriod {
  id: string;
  tenantId: string;
  configId: string;
  gradeBand: string;
  periodNumber: number;
  label: string;
  kind: 'lesson' | 'break' | 'lunch' | 'assembly';
  startTime: string;
  endTime: string;
  sortOrder: number;
}

export interface TTClassroom {
  id: string;
  tenantId: string;
  name: string;
  roomCode: string;
  roomType: string;
  capacity: number;
  location: string;
  assignedGrade: number | null;
  assignedStream: string | null;
  availability: Record<string, Record<string, boolean>>;
  isActive: boolean;
}

export interface TTTeacherProfile {
  id: string;
  tenantId: string;
  userId: string;
  teacherName: string;
  teacherEmail: string;
  tscNumber?: string;
  department: string;
  qualifiedSubjects: string[];
  availability: Record<string, Record<string, boolean>>;
  maxDailyPeriods: number;
  maxWeeklyPeriods: number;
  maxConsecutiveLessons: number;
  preferredFreePeriods: Array<{ day: string; period: number }>;
  activeInTimetable: boolean;
  archivedAt?: string | null;
}

export interface TTStudentGroup {
  id: string;
  tenantId: string;
  grade: number;
  stream: string;
  groupName: string;
  groupCode: string;
  studentCount: number;
  isWholeClass: boolean;
  parentClassKey: string;
}

export interface TTSessionUnit {
  sessionKey: string;
  allocationId?: string;
  jointLessonId?: string;
  title: string;
  subjectName: string;
  grade: number;
  stream: string;
  classTargets: Array<{ grade: number; stream: string; classKey: string }>;
  groupId?: string;
  groupName: string;
  isWholeClass: boolean;
  teacherIds: string[];
  teacherNames: string[];
  blockLength: 1 | 2 | 3;
  requiredRoomType: string;
  preferredRoomId?: string | null;
  preferredDays: string[];
  preferredPeriods: number[];
  maxPerDay: number;
  minSpacingDays: number;
  patternPreference: string;
  studentCount: number;
}

export const ALL_WORKING_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const PRIMARY_SUBJECT_PRESETS: Array<{
  subject: string;
  weekly: number;
  single: number;
  double: number;
  triple: number;
  roomType: string;
  maxPerDay: number;
  minSpacingDays: number;
  isPractical: number;
}> = [
  { subject: 'Mathematics', weekly: 5, single: 5, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 0, isPractical: 0 },
  { subject: 'English', weekly: 5, single: 5, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 0, isPractical: 0 },
  { subject: 'Kiswahili', weekly: 4, single: 4, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 0, isPractical: 0 },
  { subject: 'Integrated Science', weekly: 4, single: 2, double: 1, triple: 0, roomType: 'science_lab', maxPerDay: 2, minSpacingDays: 1, isPractical: 1 },
  { subject: 'Social Studies', weekly: 3, single: 3, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 1, isPractical: 0 },
  { subject: 'Religious Education', weekly: 3, single: 3, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 1, isPractical: 0 },
  { subject: 'Agriculture and Nutrition', weekly: 3, single: 3, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 1, isPractical: 1 },
  { subject: 'Computer Studies', weekly: 2, single: 0, double: 1, triple: 0, roomType: 'computer_lab', maxPerDay: 2, minSpacingDays: 2, isPractical: 1 },
  { subject: 'Creative Arts', weekly: 3, single: 1, double: 1, triple: 0, roomType: 'art_room', maxPerDay: 2, minSpacingDays: 1, isPractical: 1 },
  { subject: 'Physical and Health Education', weekly: 3, single: 3, double: 0, triple: 0, roomType: 'field', maxPerDay: 1, minSpacingDays: 1, isPractical: 1 },
];

const JUNIOR_SUBJECT_PRESETS: Array<{
  subject: string;
  weekly: number;
  single: number;
  double: number;
  triple: number;
  roomType: string;
  maxPerDay: number;
  minSpacingDays: number;
  isPractical: number;
}> = [
  { subject: 'Mathematics', weekly: 5, single: 5, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 0, isPractical: 0 },
  { subject: 'English', weekly: 5, single: 5, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 0, isPractical: 0 },
  { subject: 'Kiswahili', weekly: 4, single: 4, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 0, isPractical: 0 },
  { subject: 'Integrated Science', weekly: 5, single: 1, double: 2, triple: 0, roomType: 'science_lab', maxPerDay: 2, minSpacingDays: 1, isPractical: 1 },
  { subject: 'Pre-Technical Studies', weekly: 4, single: 2, double: 1, triple: 0, roomType: 'workshop', maxPerDay: 2, minSpacingDays: 1, isPractical: 1 },
  { subject: 'Social Studies', weekly: 3, single: 3, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 1, isPractical: 0 },
  { subject: 'Religious Education', weekly: 3, single: 3, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 1, isPractical: 0 },
  { subject: 'Agriculture and Nutrition', weekly: 3, single: 3, double: 0, triple: 0, roomType: 'general', maxPerDay: 1, minSpacingDays: 1, isPractical: 1 },
  { subject: 'Computer Studies', weekly: 2, single: 0, double: 1, triple: 0, roomType: 'computer_lab', maxPerDay: 2, minSpacingDays: 2, isPractical: 1 },
  { subject: 'Creative Arts', weekly: 3, single: 1, double: 1, triple: 0, roomType: 'art_room', maxPerDay: 2, minSpacingDays: 1, isPractical: 1 },
  { subject: 'Physical and Health Education', weekly: 2, single: 2, double: 0, triple: 0, roomType: 'field', maxPerDay: 1, minSpacingDays: 1, isPractical: 1 },
];

const DEFAULT_BELL_PERIODS = [
  { periodNumber: 1, label: 'Lesson 1', kind: 'lesson', startTime: '08:00', endTime: '08:40', sortOrder: 1 },
  { periodNumber: 2, label: 'Lesson 2', kind: 'lesson', startTime: '08:40', endTime: '09:20', sortOrder: 2 },
  { periodNumber: 0, label: 'Morning Short Break', kind: 'break', startTime: '09:20', endTime: '09:35', sortOrder: 3 },
  { periodNumber: 3, label: 'Lesson 3', kind: 'lesson', startTime: '09:35', endTime: '10:15', sortOrder: 4 },
  { periodNumber: 4, label: 'Lesson 4', kind: 'lesson', startTime: '10:15', endTime: '10:55', sortOrder: 5 },
  { periodNumber: 0, label: 'Tea & Health Break', kind: 'break', startTime: '10:55', endTime: '11:20', sortOrder: 6 },
  { periodNumber: 5, label: 'Lesson 5', kind: 'lesson', startTime: '11:20', endTime: '12:00', sortOrder: 7 },
  { periodNumber: 6, label: 'Lesson 6', kind: 'lesson', startTime: '12:00', endTime: '12:40', sortOrder: 8 },
  { periodNumber: 0, label: 'Lunch & Clubs', kind: 'lunch', startTime: '12:40', endTime: '13:55', sortOrder: 9 },
  { periodNumber: 7, label: 'Lesson 7', kind: 'lesson', startTime: '13:55', endTime: '14:35', sortOrder: 10 },
  { periodNumber: 8, label: 'Lesson 8', kind: 'lesson', startTime: '14:35', endTime: '15:15', sortOrder: 11 },
];

export function safeJsonParse<T>(raw: any, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw !== 'string') return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function classKeyOf(grade: number, stream: string): string {
  return `G${grade}-${stream.trim()}`;
}

export function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 10)}`;
}

/**
 * Safely inspect existing multi-tenant LMS records (grades, streams, teachers,
 * subjects, bell schedules, shared facilities) and initialize missing additive
 * timetable module rows for this school without altering any core LMS tables.
 */
export function ensureTenantTimetableSeeded(
  db: DatabaseSync,
  tenantId: string,
  actorId = 'system'
): { configId: string } {
  const now = new Date().toISOString();
  const changedTables: string[] = [];

  // 1. Ensure Config exists
  let cfgRow = db
    .prepare(`SELECT * FROM tt_configs WHERE tenant_id = ? ORDER BY updated_at DESC LIMIT 1`)
    .get(tenantId) as any;

  if (!cfgRow) {
    const configId = uid('ttcfg');
    db.prepare(
      `INSERT INTO tt_configs
         (id, tenant_id, academic_year, term, cycle_days, working_days_json, default_periods_per_day, cycle_label, updated_by, created_at, updated_at)
       VALUES (?, ?, '2026', 'Term 1', 5, ?, 8, 'Weekly (Mon-Fri)', ?, ?, ?)`
    ).run(
      configId,
      tenantId,
      JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      actorId,
      now,
      now
    );
    cfgRow = db.prepare(`SELECT * FROM tt_configs WHERE id = ?`).get(configId) as any;
    changedTables.push('tt_configs');
  }

  const configId = String(cfgRow.id);

  // 2. Ensure Periods exist (seeded from existing bell_schedule collection if available)
  const existingPeriodCount = (
    db.prepare(`SELECT COUNT(*) as c FROM tt_periods WHERE config_id = ?`).get(configId) as any
  ).c;

  if (existingPeriodCount === 0) {
    const colBellRows = db
      .prepare(
        `SELECT payload_json FROM collections_store
         WHERE collection_key = 'edusmart_bell_schedule_v1' AND (tenant_id = ? OR tenant_id = 'global') AND deleted_at IS NULL`
      )
      .all(tenantId) as any[];

    const parsedBell: any[] = [];
    for (const r of colBellRows) {
      const p = safeJsonParse<any>(r.payload_json, null);
      if (p && p.startTime && p.endTime) parsedBell.push(p);
    }
    parsedBell.sort((a, b) => Number(a.period || 0) - Number(b.period || 0));

    const sourcePeriods =
      parsedBell.length >= 6
        ? parsedBell.map((b, idx) => ({
            periodNumber: b.isBreak ? 0 : Number(b.period || idx + 1),
            label: String(b.label || `Lesson ${idx + 1}`),
            kind: b.isBreak
              ? String(b.label || '').toLowerCase().includes('lunch')
                ? 'lunch'
                : 'break'
              : 'lesson',
            startTime: String(b.startTime),
            endTime: String(b.endTime),
            sortOrder: idx + 1,
          }))
        : DEFAULT_BELL_PERIODS;

    const insPeriod = db.prepare(
      `INSERT INTO tt_periods (id, tenant_id, config_id, grade_band, period_number, label, kind, start_time, end_time, sort_order)
       VALUES (?, ?, ?, 'all', ?, ?, ?, ?, ?, ?)`
    );
    for (const p of sourcePeriods) {
      insPeriod.run(uid('ttp'), tenantId, configId, p.periodNumber, p.label, p.kind, p.startTime, p.endTime, p.sortOrder);
    }
    changedTables.push('tt_periods');
  }

  // 3. Discover Grades & Streams from existing LMS tables
  const existingGradesRows = db
    .prepare(`SELECT id, name FROM school_grades WHERE school_id = ?`)
    .all(tenantId) as any[];
  const existingStreamsRows = db
    .prepare(`SELECT id, grade_id, name, display_name FROM school_streams WHERE school_id = ?`)
    .all(tenantId) as any[];

  const gradeList: number[] = [];
  for (const g of existingGradesRows) {
    const m = String(g.name || g.id).match(/\d+/);
    if (m) {
      const num = parseInt(m[0], 10);
      if (num >= 1 && num <= 12 && !gradeList.includes(num)) gradeList.push(num);
    }
  }
  if (gradeList.length === 0) {
    for (let g = 1; g <= 9; g++) gradeList.push(g);
  }
  gradeList.sort((a, b) => a - b);

  // Map grade -> stream names
  const gradeStreamsMap = new Map<number, string[]>();
  const gradeIdToNum = new Map<string, number>();
  for (const g of existingGradesRows) {
    const m = String(g.name || g.id).match(/\d+/);
    if (m) gradeIdToNum.set(g.id, parseInt(m[0], 10));
  }

  for (const s of existingStreamsRows) {
    let gNum = gradeIdToNum.get(s.grade_id);
    if (!gNum) {
      const m = String(s.grade_id || s.display_name || '').match(/\d+/);
      if (m) gNum = parseInt(m[0], 10);
    }
    if (gNum) {
      const arr = gradeStreamsMap.get(gNum) || [];
      const streamClean = String(s.name || 'North').trim();
      if (!arr.includes(streamClean)) arr.push(streamClean);
      gradeStreamsMap.set(gNum, arr);
    }
  }

  // Fallback check on students table if streams table was empty
  if (gradeStreamsMap.size === 0) {
    const studentGradeStreams = db
      .prepare(`SELECT DISTINCT grade_label, stream_label FROM students WHERE school_id = ?`)
      .all(tenantId) as any[];
    for (const st of studentGradeStreams) {
      const m = String(st.grade_label || '').match(/\d+/);
      const gNum = m ? parseInt(m[0], 10) : 0;
      const streamClean = String(st.stream_label || '').trim();
      if (gNum && streamClean) {
        const arr = gradeStreamsMap.get(gNum) || [];
        if (!arr.includes(streamClean)) arr.push(streamClean);
        gradeStreamsMap.set(gNum, arr);
      }
    }
  }

  for (const g of gradeList) {
    if (!gradeStreamsMap.has(g) || (gradeStreamsMap.get(g) || []).length === 0) {
      gradeStreamsMap.set(g, g <= 6 ? ['Dove', 'Eagle', 'Falcon'] : ['Athi', 'Mara', 'Tana']);
    }
  }

  // 4. Ensure tt_grade_schedules
  const workingDaysDefault = cfgRow.working_days_json || JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const insGradeSched = db.prepare(
    `INSERT OR IGNORE INTO tt_grade_schedules (id, tenant_id, config_id, grade, periods_per_day, working_days_json, assembly_day, assembly_period, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'Monday', 0, ?)`
  );
  for (const g of gradeList) {
    const defaultPeriodsForGrade = g <= 3 ? Math.min(7, Number(cfgRow.default_periods_per_day || 8)) : Number(cfgRow.default_periods_per_day || 8);
    insGradeSched.run(uid('ttgs'), tenantId, configId, g, defaultPeriodsForGrade, workingDaysDefault, now);
  }

  // 5. Ensure tt_subjects (including Library Lesson, Arts, Music, Nutrition)
  const insSub = db.prepare(
    `INSERT OR IGNORE INTO tt_subjects (id, tenant_id, name, code, department, is_practical, requires_room_type, color_token, is_active, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  );
  const combinedPresets = [...PRIMARY_SUBJECT_PRESETS, ...JUNIOR_SUBJECT_PRESETS];
  const colorMap: Record<string, string> = {
    Mathematics: 'blue',
    English: 'emerald',
    Kiswahili: 'amber',
    'Integrated Science': 'indigo',
    'Computer Studies': 'cyan',
    'Social Studies': 'orange',
    'Religious Education': 'violet',
    'Agriculture and Nutrition': 'lime',
    Nutrition: 'lime',
    'Pre-Technical Studies': 'slate',
    'Creative Arts': 'rose',
    Arts: 'rose',
    Music: 'pink',
    'Library Lesson': 'purple',
    'Physical and Health Education': 'teal',
  };
  for (const p of combinedPresets) {
    const code = p.subject
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
    const dept =
      p.roomType === 'science_lab'
        ? 'Sciences'
        : p.roomType === 'computer_lab'
        ? 'ICT & Computing'
        : p.roomType === 'art_room' || p.roomType === 'field'
        ? 'Creative Arts & Sports'
        : 'Core Academic';
    insSub.run(uid('ttsub'), tenantId, p.subject, code, dept, p.isPractical, p.roomType, colorMap[p.subject] || 'slate', now);
  }

  // Ensure Library Lesson, Arts, Music, and Nutrition are always present in tt_subjects
  const additionalSubjects: Array<[string, string, string, number, string, string]> = [
    ['Library Lesson', 'LIB', 'Library & Information Services', 0, 'library', 'purple'],
    ['Arts', 'ART', 'Creative Arts & Music', 1, 'art_room', 'rose'],
    ['Music', 'MUS', 'Creative Arts & Music', 1, 'art_room', 'pink'],
    ['Nutrition', 'NUT', 'Agriculture & Nutrition', 1, 'general', 'lime'],
  ];
  for (const [subName, subCode, subDept, isPrac, rType, cTok] of additionalSubjects) {
    insSub.run(uid('ttsub'), tenantId, subName, subCode, subDept, isPrac, rType, cTok, now);
  }

  // 5b. Ensure tt_departments
  const insDept = db.prepare(
    `INSERT OR IGNORE INTO tt_departments (id, tenant_id, name, code, head_name, description, is_active, updated_at)
     VALUES (?, ?, ?, ?, '', ?, 1, ?)`
  );
  const defaultDepartments: Array<[string, string, string]> = [
    ['Core Academic', 'CORE', 'Core foundational curriculum learning areas'],
    ['Mathematics & Computational Sciences', 'MATH', 'Mathematics and computational logic'],
    ['Sciences', 'SCI', 'Integrated and pure sciences'],
    ['Languages & Literature', 'LANG', 'English, Kiswahili, and literacy studies'],
    ['Humanities & Social Sciences', 'HUM', 'Social studies, history, geography, and religious education'],
    ['ICT & Computing', 'ICT', 'Computer studies and digital literacy'],
    ['Creative Arts & Music', 'ARTS', 'Visual Arts, Creative Arts, and Music education'],
    ['Creative Arts & Sports', 'CAS', 'Creative arts, physical education, and athletics'],
    ['Agriculture & Nutrition', 'AGRN', 'Agriculture, food science, and nutrition'],
    ['Technical & Applied Sciences', 'TECH', 'Pre-technical studies and business education'],
    ['Library & Information Services', 'LIB', 'Library lessons, reading culture, and research literacy'],
  ];
  for (const [dName, dCode, dDesc] of defaultDepartments) {
    insDept.run(uid('ttdept'), tenantId, dName, dCode, dDesc, now);
  }
  const existingSubDepts = db
    .prepare(`SELECT DISTINCT department FROM tt_subjects WHERE tenant_id = ? AND department IS NOT NULL AND trim(department) != ''`)
    .all(tenantId) as any[];
  for (const row of existingSubDepts) {
    const dn = String(row.department).trim();
    const dc = dn.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 4);
    insDept.run(uid('ttdept'), tenantId, dn, dc, 'Academic department', now);
  }

  // 6. Sync tt_student_groups (whole class group per active grade+stream)
  const existingGroupKeys = new Set<string>(
    (
      db
        .prepare(`SELECT parent_class_key FROM tt_student_groups WHERE tenant_id = ? AND is_whole_class = 1`)
        .all(tenantId) as any[]
    ).map((r) => String(r.parent_class_key))
  );
  const studentCounts = db
    .prepare(
      `SELECT grade_label, stream_label, COUNT(*) as cnt FROM students WHERE school_id = ? AND is_active = 1 GROUP BY grade_label, stream_label`
    )
    .all(tenantId) as any[];
  const countMap = new Map<string, number>();
  for (const row of studentCounts) {
    const gm = String(row.grade_label || '').match(/\d+/);
    if (gm && row.stream_label) {
      countMap.set(classKeyOf(parseInt(gm[0], 10), row.stream_label), Number(row.cnt || 35));
    }
  }

  const insGroup = db.prepare(
    `INSERT INTO tt_student_groups (id, tenant_id, grade, stream, group_name, group_code, student_count, is_whole_class, parent_class_key, updated_at)
     VALUES (?, ?, ?, ?, 'Whole Class', ?, ?, 1, ?, ?)`
  );
  for (const [grade, streams] of gradeStreamsMap.entries()) {
    for (const stream of streams) {
      const ck = classKeyOf(grade, stream);
      if (!existingGroupKeys.has(ck)) {
        const cnt = countMap.get(ck) || 38;
        insGroup.run(uid('ttgrp'), tenantId, grade, stream, `${ck}-ALL`, cnt, ck, now);
        changedTables.push('tt_student_groups');
      }
    }
  }

  // 7. Ensure Classrooms & Specialized Facilities
  const roomCount = (db.prepare(`SELECT COUNT(*) as c FROM tt_classrooms WHERE tenant_id = ?`).get(tenantId) as any).c;
  if (roomCount === 0) {
    const insRoom = db.prepare(
      `INSERT INTO tt_classrooms (id, tenant_id, name, room_code, room_type, capacity, location, assigned_grade, assigned_stream, availability_json, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '{}', 1, ?)`
    );
    // Specialized rooms
    const specialized: Array<[string, string, string, number, string]> = [
      ['Science Laboratory 1', 'LAB-SCI-01', 'science_lab', 48, 'STEM Block'],
      ['Science Laboratory 2', 'LAB-SCI-02', 'science_lab', 48, 'STEM Block'],
      ['Computer & ICT Lab', 'LAB-ICT-01', 'computer_lab', 45, 'Digital Wing'],
      ['Pre-Tech & Design Workshop', 'WRK-PRE-01', 'workshop', 45, 'Technical Wing'],
      ['Creative Arts & Music Studio', 'ART-STU-01', 'art_room', 50, 'Arts Pavilion'],
      ['Main Sports Field', 'FLD-SPT-01', 'field', 140, 'Sports Complex'],
      ['Main Assembly & Multi-Purpose Hall', 'HALL-MAIN-01', 'hall', 320, 'Administration Block'],
      ['Main Library Reading Hall', 'LIB-MAIN-01', 'library', 60, 'Ground Floor · Central Wing'],
    ];
    for (const [name, code, rtype, cap, loc] of specialized) {
      insRoom.run(uid('ttrm'), tenantId, name, code, rtype, cap, loc, null, null, now);
    }

    // Homeroom per grade/stream
    for (const [grade, streams] of gradeStreamsMap.entries()) {
      for (const stream of streams) {
        const rmName = `Grade ${grade} ${stream} Room`;
        const rmCode = `RM-G${grade}-${stream.slice(0, 3).toUpperCase()}`;
        insRoom.run(uid('ttrm'), tenantId, rmName, rmCode, 'general', 45, grade <= 6 ? 'Primary Wing' : 'Junior Secondary Wing', grade, stream, now);
      }
    }
    changedTables.push('tt_classrooms');
  } else {
    // Ensure a dedicated School Library facility exists for Library Lesson scheduling
    const libRoomCount = (
      db.prepare(`SELECT COUNT(*) as c FROM tt_classrooms WHERE tenant_id = ? AND room_type = 'library'`).get(tenantId) as any
    ).c;
    if (libRoomCount === 0) {
      db.prepare(
        `INSERT INTO tt_classrooms (id, tenant_id, name, room_code, room_type, capacity, location, assigned_grade, assigned_stream, availability_json, is_active, updated_at)
         VALUES (?, ?, ?, ?, 'library', 60, 'Ground Floor · Central Wing', NULL, NULL, '{}', 1, ?)`
      ).run(uid('ttrm'), tenantId, 'Main Library Reading Hall', 'LIB-MAIN-01', now);
      changedTables.push('tt_classrooms');
    }
  }

  // 8. Sync Teachers from existing LMS `users` & `provisioned_accounts` (zero duplicate user accounts)
  const teachingRoles = new Set([
    'teacher',
    'class_teacher',
    'hod',
    'senior_teacher',
    'dean_of_studies',
    'curriculum_coordinator',
    'deputy_head',
    'head_teacher',
  ]);
  const userRows = db
    .prepare(`SELECT id, email, name, role, tsc_number, is_active, payload_json FROM users WHERE school_id = ?`)
    .all(tenantId) as any[];
  const provRows = db
    .prepare(`SELECT id, email, name, role, is_active, payload_json FROM provisioned_accounts WHERE school_id = ?`)
    .all(tenantId) as any[];

  const seenEmails = new Set<string>();
  const staffCandidates: any[] = [];
  for (const row of [...userRows, ...provRows]) {
    const role = String(row.role || '').toLowerCase();
    const em = String(row.email || '').toLowerCase();
    if (!teachingRoles.has(role) || !em || seenEmails.has(em)) continue;
    seenEmails.add(em);
    staffCandidates.push(row);
  }

  const insTeacher = db.prepare(
    `INSERT OR IGNORE INTO tt_teacher_profiles
       (id, tenant_id, user_id, teacher_name, teacher_email, tsc_number, department, qualified_subjects_json, availability_json, max_daily_periods, max_weekly_periods, max_consecutive_lessons, preferred_free_periods_json, active_in_timetable, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', 6, 28, 3, '[]', ?, ?)`
  );

  for (const staff of staffCandidates) {
    const payload = safeJsonParse<any>(staff.payload_json, {});
    const subjectsRaw: string[] = [];
    if (Array.isArray(payload?.subjects)) subjectsRaw.push(...payload.subjects);
    if (typeof payload?.subject === 'string' && payload.subject) subjectsRaw.push(payload.subject);
    if (subjectsRaw.length === 0) {
      subjectsRaw.push('Mathematics', 'English', 'Kiswahili', 'Integrated Science', 'Social Studies', 'Religious Education');
    }
    const qualUnique = Array.from(new Set(subjectsRaw));
    const activeFlag = staff.is_active === 0 ? 0 : 1;
    insTeacher.run(
      uid('ttch'),
      tenantId,
      String(staff.id),
      String(staff.name),
      String(staff.email).toLowerCase(),
      staff.tsc_number ? String(staff.tsc_number) : null,
      String(payload?.department || 'Academic Faculty'),
      JSON.stringify(qualUnique),
      activeFlag,
      now
    );
  }

  // 9. Seed initial Grade-Level Templates + Propagated Stream Allocations if empty
  const existingGradeAllocCount = (
    db.prepare(`SELECT COUNT(*) as c FROM tt_grade_subject_allocations WHERE config_id = ?`).get(configId) as any
  ).c;

  const teacherProfiles = db
    .prepare(`SELECT id, teacher_name, qualified_subjects_json FROM tt_teacher_profiles WHERE tenant_id = ? AND active_in_timetable = 1`)
    .all(tenantId) as any[];

  const rooms = db
    .prepare(`SELECT id, room_type, assigned_grade, assigned_stream FROM tt_classrooms WHERE tenant_id = ? AND is_active = 1`)
    .all(tenantId) as any[];

  if (existingGradeAllocCount === 0) {
    const insGradeAlloc = db.prepare(
      `INSERT INTO tt_grade_subject_allocations
         (id, tenant_id, config_id, grade, subject_name, required_weekly_periods, single_lessons, double_lessons, triple_lessons, pattern_preference, max_per_day, min_spacing_days, preferred_days_json, preferred_periods_json, required_room_type, default_room_id, teacher_ids_json, student_group_label, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'spread', ?, ?, '[]', '[]', ?, ?, ?, 'Whole Class', 1, ?)`
    );
    const insStreamAlloc = db.prepare(
      `INSERT INTO tt_stream_subject_allocations
         (id, tenant_id, config_id, grade, stream, group_id, subject_name, inherited_from_id, is_overridden, required_weekly_periods, single_lessons, double_lessons, triple_lessons, pattern_preference, max_per_day, min_spacing_days, preferred_days_json, preferred_periods_json, required_room_type, room_id, teacher_ids_json, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'spread', ?, ?, '[]', '[]', ?, ?, ?, 1, ?)`
    );

    const ttTeacherByUserId = new Map<string, string>();
    const tpUsers = db
      .prepare(`SELECT id, user_id FROM tt_teacher_profiles WHERE tenant_id = ?`)
      .all(tenantId) as Array<{ id: string; user_id: string }>;
    for (const tp of tpUsers) ttTeacherByUserId.set(String(tp.user_id), String(tp.id));

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
      // ignore if hierarchy tables not yet initialized
    }

    const wholeGroups = db
      .prepare(`SELECT id, grade, stream FROM tt_student_groups WHERE tenant_id = ? AND is_whole_class = 1`)
      .all(tenantId) as any[];
    const groupLookup = new Map<string, string>();
    for (const g of wholeGroups) {
      groupLookup.set(classKeyOf(Number(g.grade), String(g.stream)), String(g.id));
    }

    for (const grade of gradeList) {
      const presets = grade <= 6 ? PRIMARY_SUBJECT_PRESETS : JUNIOR_SUBJECT_PRESETS;
      const streams = gradeStreamsMap.get(grade) || [];

      presets.forEach((p, subIdx) => {
        const gaId = uid('ttga');
        // Pick default qualified teacher if available
        const matchingTeachers = teacherProfiles.filter((t) => {
          const quals = safeJsonParse<string[]>(t.qualified_subjects_json, []);
          return quals.some((q) => q.toLowerCase() === p.subject.toLowerCase());
        });
        const chosenPool = matchingTeachers.length > 0 ? matchingTeachers : teacherProfiles;
        const defaultTeacher = chosenPool.length > 0 ? chosenPool[(grade + subIdx) % chosenPool.length] : null;
        const defaultTeacherIds = defaultTeacher ? [String(defaultTeacher.id)] : [];

        const specialRoom = rooms.find((r) => r.room_type === p.roomType && !r.assigned_grade);
        insGradeAlloc.run(
          gaId,
          tenantId,
          configId,
          grade,
          p.subject,
          p.weekly,
          p.single,
          p.double,
          p.triple,
          p.maxPerDay,
          p.minSpacingDays,
          p.roomType,
          specialRoom ? String(specialRoom.id) : null,
          JSON.stringify(defaultTeacherIds),
          now
        );

        streams.forEach((stream, sIdx) => {
          const linkedTeacherId = explicitStreamTeacherMap.get(
            `${grade}::${stream.toLowerCase()}::${p.subject.toLowerCase()}`
          );
          const streamTeacher = chosenPool.length > 0 ? chosenPool[(grade + subIdx + sIdx) % chosenPool.length] : null;
          const streamTeacherIds = linkedTeacherId
            ? [linkedTeacherId]
            : streamTeacher
            ? [String(streamTeacher.id)]
            : [];
          const homeRoom = rooms.find(
            (r) => Number(r.assigned_grade) === grade && String(r.assigned_stream || '').toLowerCase() === stream.toLowerCase()
          );
          const roomIdToUse =
            p.roomType !== 'general' && specialRoom
              ? String(specialRoom.id)
              : homeRoom
              ? String(homeRoom.id)
              : null;
          const grpId = groupLookup.get(classKeyOf(grade, stream)) || null;
          insStreamAlloc.run(
            uid('ttsa'),
            tenantId,
            configId,
            grade,
            stream,
            grpId,
            p.subject,
            gaId,
            p.weekly,
            p.single,
            p.double,
            p.triple,
            p.maxPerDay,
            p.minSpacingDays,
            p.roomType,
            roomIdToUse,
            JSON.stringify(streamTeacherIds),
            now
          );
        });
      });
    }
    changedTables.push('tt_grade_subject_allocations', 'tt_stream_subject_allocations');
  }

  // 10. Ensure at least one Version exists
  const existingVersionsCount = (
    db.prepare(`SELECT COUNT(*) as c FROM tt_versions WHERE config_id = ?`).get(configId) as any
  ).c;
  if (existingVersionsCount === 0) {
    const versionId = uid('ttver');
    db.prepare(
      `INSERT INTO tt_versions (id, tenant_id, config_id, version_number, name, status, metrics_json, created_by, created_by_name, created_at, updated_at)
       VALUES (?, ?, ?, 1, 'Term 1 Master Draft v1', 'draft', '{}', ?, 'School Administration', ?, ?)`
    ).run(versionId, tenantId, configId, actorId, now, now);
    db.prepare(`UPDATE tt_configs SET active_version_id = ? WHERE id = ?`).run(versionId, configId);
    changedTables.push('tt_versions');
  }

  if (changedTables.length > 0) {
    notifyMySqlTablesChanged(Array.from(new Set(changedTables)));
  }

  return { configId };
}

/**
 * Expand weekly allocations + joint lessons into discrete lesson sessions to place.
 */
export function expandRequirementUnits(
  db: DatabaseSync,
  tenantId: string,
  configId: string
): {
  units: TTSessionUnit[];
  allocationIssues: Array<{
    grade: number;
    stream: string;
    subject: string;
    message: string;
  }>;
  streamLoadSummary: Array<{
    grade: number;
    stream: string;
    requiredPeriods: number;
    availablePeriods: number;
    deficitOrExcess: number;
  }>;
} {
  const cfg = db.prepare(`SELECT * FROM tt_configs WHERE id = ?`).get(configId) as any;
  const workingDays: string[] = safeJsonParse<string[]>(cfg?.working_days_json, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  const gradeSchedRows = db
    .prepare(`SELECT * FROM tt_grade_schedules WHERE config_id = ?`)
    .all(configId) as any[];
  const gradeSchedMap = new Map<number, { periodsPerDay: number; days: string[]; assemblyDay?: string; assemblyPeriod?: number }>();
  for (const gs of gradeSchedRows) {
    const days = safeJsonParse<string[]>(gs.working_days_json, workingDays);
    gradeSchedMap.set(Number(gs.grade), {
      periodsPerDay: Number(gs.periods_per_day || cfg?.default_periods_per_day || 8),
      days,
      assemblyDay: gs.assembly_day,
      assemblyPeriod: Number(gs.assembly_period || 0),
    });
  }

  const teachers = db
    .prepare(`SELECT id, teacher_name FROM tt_teacher_profiles WHERE tenant_id = ?`)
    .all(tenantId) as any[];
  const teacherNameMap = new Map<string, string>();
  for (const t of teachers) teacherNameMap.set(String(t.id), String(t.teacher_name));

  const groups = db
    .prepare(`SELECT * FROM tt_student_groups WHERE tenant_id = ?`)
    .all(tenantId) as any[];
  const groupById = new Map<string, any>();
  const wholeGroupByClass = new Map<string, any>();
  for (const g of groups) {
    groupById.set(String(g.id), g);
    if (Number(g.is_whole_class) === 1) {
      wholeGroupByClass.set(classKeyOf(Number(g.grade), String(g.stream)), g);
    }
  }

  const streamAllocs = db
    .prepare(`SELECT * FROM tt_stream_subject_allocations WHERE config_id = ? AND is_active = 1 ORDER BY grade, stream, subject_name`)
    .all(configId) as any[];

  const jointLessons = db
    .prepare(`SELECT * FROM tt_joint_lessons WHERE config_id = ? AND is_active = 1`)
    .all(configId) as any[];

  const units: TTSessionUnit[] = [];
  const allocationIssues: Array<{ grade: number; stream: string; subject: string; message: string }> = [];
  const classRequiredTotals = new Map<string, number>();

  // 1. Joint Multi-Stream Lessons first
  for (const jl of jointLessons) {
    const classTargetsRaw = safeJsonParse<Array<{ grade: number; stream: string }>>(jl.participating_classes_json, []);
    if (classTargetsRaw.length < 2) {
      allocationIssues.push({
        grade: classTargetsRaw[0]?.grade || 0,
        stream: classTargetsRaw[0]?.stream || 'Joint',
        subject: String(jl.subject_name),
        message: `Joint lesson "${jl.title}" must include at least 2 participating classes/streams.`,
      });
      continue;
    }

    const teacherIds = safeJsonParse<string[]>(jl.teacher_ids_json, []);
    const teacherNames = teacherIds.map((id) => teacherNameMap.get(id) || 'Assigned Teacher');
    const len = Math.min(3, Math.max(1, Number(jl.lesson_length || 1))) as 1 | 2 | 3;
    const weeklyPeriods = Number(jl.weekly_periods || len);
    const sessionsCount = Math.max(1, Math.round(weeklyPeriods / len));
    const classTargets = classTargetsRaw.map((c) => ({
      grade: Number(c.grade),
      stream: String(c.stream),
      classKey: classKeyOf(Number(c.grade), String(c.stream)),
    }));
    const combinedCount =
      Number(jl.combined_students || 0) ||
      classTargets.reduce((sum, c) => sum + Number(wholeGroupByClass.get(c.classKey)?.student_count || 38), 0);

    for (const c of classTargets) {
      classRequiredTotals.set(c.classKey, (classRequiredTotals.get(c.classKey) || 0) + weeklyPeriods);
    }

    for (let i = 0; i < sessionsCount; i++) {
      units.push({
        sessionKey: `jl:${jl.id}:${i + 1}`,
        jointLessonId: String(jl.id),
        title: String(jl.title),
        subjectName: String(jl.subject_name),
        grade: classTargets[0].grade,
        stream: classTargets.map((c) => c.stream).join('+'),
        classTargets,
        groupName: 'Joint Cohort',
        isWholeClass: true,
        teacherIds,
        teacherNames,
        blockLength: len,
        requiredRoomType: String(jl.required_room_type || 'hall'),
        preferredRoomId: jl.room_id ? String(jl.room_id) : null,
        preferredDays: safeJsonParse<string[]>(jl.preferred_days_json, []),
        preferredPeriods: safeJsonParse<number[]>(jl.preferred_periods_json, []),
        maxPerDay: len,
        minSpacingDays: 1,
        patternPreference: 'spread',
        studentCount: combinedCount,
      });
    }
  }

  // 2. Individual Stream / Student-Group Subject Allocations
  for (const sa of streamAllocs) {
    const grade = Number(sa.grade);
    const stream = String(sa.stream);
    const ck = classKeyOf(grade, stream);
    const reqWeekly = Number(sa.required_weekly_periods || 0);
    const singles = Number(sa.single_lessons || 0);
    const doubles = Number(sa.double_lessons || 0);
    const triples = Number(sa.triple_lessons || 0);
    const sessionSum = singles + doubles * 2 + triples * 3;

    if (sessionSum !== reqWeekly) {
      allocationIssues.push({
        grade,
        stream,
        subject: String(sa.subject_name),
        message: `Session breakdown (${singles}×1 + ${doubles}×2 + ${triples}×3 = ${sessionSum}) does not equal required weekly periods (${reqWeekly}).`,
      });
    }

    const grp = sa.group_id ? groupById.get(String(sa.group_id)) : wholeGroupByClass.get(ck);
    const isWholeClass = grp ? Number(grp.is_whole_class) === 1 : true;
    const groupName = grp ? String(grp.group_name) : 'Whole Class';
    const studentCount = grp ? Number(grp.student_count || 38) : 38;

    // Only count Whole Class toward total available class periods (or max per split)
    if (isWholeClass) {
      classRequiredTotals.set(ck, (classRequiredTotals.get(ck) || 0) + reqWeekly);
    }

    const rawTeacherIds = safeJsonParse<string[]>(sa.teacher_ids_json, []);
    const uniqueTeacherIds = Array.from(new Set(rawTeacherIds.filter(Boolean)));
    if (uniqueTeacherIds.length > 1) {
      allocationIssues.push({
        grade,
        stream,
        subject: String(sa.subject_name),
        message: `Multiple teachers assigned to Grade ${grade} ${stream} · ${sa.subject_name}. No subject in any stream can have more than one teacher.`,
      });
    }
    const teacherIds = uniqueTeacherIds.slice(0, 1);
    const teacherNames = teacherIds.map((id) => teacherNameMap.get(id) || 'Unassigned Teacher');
    if (teacherIds.length === 0) {
      allocationIssues.push({
        grade,
        stream,
        subject: String(sa.subject_name),
        message: `No subject teacher assigned to Grade ${grade} ${stream} · ${sa.subject_name}.`,
      });
    }

    const prefDays = safeJsonParse<string[]>(sa.preferred_days_json, []);
    const prefPeriods = safeJsonParse<number[]>(sa.preferred_periods_json, []);

    const makeUnit = (blockLen: 1 | 2 | 3, idx: number): TTSessionUnit => ({
      sessionKey: `sa:${sa.id}:${blockLen}:${idx}`,
      allocationId: String(sa.id),
      title: String(sa.subject_name),
      subjectName: String(sa.subject_name),
      grade,
      stream,
      classTargets: [{ grade, stream, classKey: ck }],
      groupId: grp ? String(grp.id) : undefined,
      groupName,
      isWholeClass,
      teacherIds,
      teacherNames,
      blockLength: blockLen,
      requiredRoomType: String(sa.required_room_type || 'general'),
      preferredRoomId: sa.room_id ? String(sa.room_id) : null,
      preferredDays: prefDays,
      preferredPeriods: prefPeriods,
      maxPerDay: Math.max(blockLen, Number(sa.max_per_day || 1)),
      minSpacingDays: Number(sa.min_spacing_days || 0),
      patternPreference: String(sa.pattern_preference || 'spread'),
      studentCount,
    });

    for (let i = 1; i <= triples; i++) units.push(makeUnit(3, i));
    for (let i = 1; i <= doubles; i++) units.push(makeUnit(2, i));
    for (let i = 1; i <= singles; i++) units.push(makeUnit(1, i));
  }

  // Build load summary per stream
  const streamLoadSummary: Array<{
    grade: number;
    stream: string;
    requiredPeriods: number;
    availablePeriods: number;
    deficitOrExcess: number;
  }> = [];

  for (const [ck, req] of classRequiredTotals.entries()) {
    const [gPart, ...sParts] = ck.replace(/^G/, '').split('-');
    const grade = parseInt(gPart, 10);
    const stream = sParts.join('-');
    const gs = gradeSchedMap.get(grade);
    const daysCount = (gs?.days || workingDays).length;
    const perDay = gs?.periodsPerDay || Number(cfg?.default_periods_per_day || 8);
    const assemblyDeduct = gs?.assemblyPeriod && gs.assemblyPeriod > 0 ? 1 : 0;
    const available = Math.max(0, daysCount * perDay - assemblyDeduct);
    streamLoadSummary.push({
      grade,
      stream,
      requiredPeriods: req,
      availablePeriods: available,
      deficitOrExcess: available - req,
    });
  }
  streamLoadSummary.sort((a, b) => (a.grade !== b.grade ? a.grade - b.grade : a.stream.localeCompare(b.stream)));

  return { units, allocationIssues, streamLoadSummary };
}

/**
 * Compute valid contiguous teaching-period windows for a given block length.
 * Breaks/Lunch sit between teaching periods, so if `sort_order` between lesson P and P+1
 * contains a break/lunch/assembly, a multi-lesson block CANNOT span across that break!
 */
export function getContiguousLessonStarts(
  periods: TTPeriod[],
  maxLessonPeriodForGrade: number,
  blockLength: 1 | 2 | 3
): number[][] {
  const lessonPeriods = periods
    .filter((p) => p.kind === 'lesson' && p.periodNumber >= 1 && p.periodNumber <= maxLessonPeriodForGrade)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const validWindows: number[][] = [];
  for (let i = 0; i <= lessonPeriods.length - blockLength; i++) {
    const slice = lessonPeriods.slice(i, i + blockLength);
    let contiguous = true;
    for (let k = 1; k < slice.length; k++) {
      // Must be consecutive periodNumber AND no break/lunch in between (sortOrder diff === 1)
      if (
        slice[k].periodNumber !== slice[k - 1].periodNumber + 1 ||
        slice[k].sortOrder !== slice[k - 1].sortOrder + 1
      ) {
        contiguous = false;
        break;
      }
    }
    if (contiguous) {
      validWindows.push(slice.map((s) => s.periodNumber));
    }
  }
  return validWindows;
}

/**
 * Independent full validation engine before, during, and after generation.
 * Separates mandatory hard errors ('error') from optimization warnings ('warning').
 */
export function validateTimetableVersion(
  db: DatabaseSync,
  versionId: string
): {
  hardErrors: number;
  warnings: number;
  conflicts: Array<{
    id: string;
    severity: 'error' | 'warning';
    conflictType: string;
    dayOfWeek?: string;
    periodNumber?: number;
    message: string;
    details: any;
  }>;
  canApprove: boolean;
} {
  const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ?`).get(versionId) as any;
  if (!version) throw new Error('Timetable version not found.');

  const tenantId = String(version.tenant_id);
  const configId = String(version.config_id);
  const cfg = db.prepare(`SELECT * FROM tt_configs WHERE id = ?`).get(configId) as any;
  const workingDays = safeJsonParse<string[]>(cfg?.working_days_json, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  const periodsRaw = db
    .prepare(`SELECT * FROM tt_periods WHERE config_id = ? ORDER BY sort_order ASC`)
    .all(configId) as any[];
  const periods: TTPeriod[] = periodsRaw.map((p) => ({
    id: String(p.id),
    tenantId,
    configId,
    gradeBand: String(p.grade_band),
    periodNumber: Number(p.period_number),
    label: String(p.label),
    kind: p.kind,
    startTime: String(p.start_time),
    endTime: String(p.end_time),
    sortOrder: Number(p.sort_order),
  }));

  const entries = db
    .prepare(`SELECT * FROM tt_entries WHERE version_id = ? ORDER BY day_of_week, period_number, grade, stream`)
    .all(versionId) as any[];

  const unscheduled = db
    .prepare(`SELECT * FROM tt_unscheduled_sessions WHERE version_id = ?`)
    .all(versionId) as any[];

  const teacherMap = new Map<string, any>();
  for (const t of db.prepare(`SELECT * FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[]) {
    teacherMap.set(String(t.id), {
      ...t,
      availability: safeJsonParse<Record<string, Record<string, boolean>>>(t.availability_json, {}),
      preferredFree: safeJsonParse<Array<{ day: string; period: number }>>(t.preferred_free_periods_json, []),
    });
  }

  const roomMap = new Map<string, any>();
  for (const r of db.prepare(`SELECT * FROM tt_classrooms WHERE tenant_id = ?`).all(tenantId) as any[]) {
    roomMap.set(String(r.id), {
      ...r,
      availability: safeJsonParse<Record<string, Record<string, boolean>>>(r.availability_json, {}),
    });
  }

  const groupMap = new Map<string, any>();
  for (const g of db.prepare(`SELECT * FROM tt_student_groups WHERE tenant_id = ?`).all(tenantId) as any[]) {
    groupMap.set(String(g.id), g);
  }

  const { allocationIssues, streamLoadSummary, units } = expandRequirementUnits(db, tenantId, configId);
  const allocMap = new Map<string, any>();
  for (const a of db.prepare(`SELECT * FROM tt_stream_subject_allocations WHERE config_id = ?`).all(configId) as any[]) {
    allocMap.set(String(a.id), a);
  }

  const conflicts: Array<{
    id: string;
    severity: 'error' | 'warning';
    conflictType: string;
    dayOfWeek?: string;
    periodNumber?: number;
    message: string;
    details: any;
  }> = [];

  const pushConflict = (
    severity: 'error' | 'warning',
    conflictType: string,
    message: string,
    dayOfWeek?: string,
    periodNumber?: number,
    details: any = {}
  ) => {
    conflicts.push({
      id: uid('ttc'),
      severity,
      conflictType,
      dayOfWeek,
      periodNumber,
      message,
      details,
    });
  };

  // A. Allocation consistency & capacity checks
  for (const issue of allocationIssues) {
    pushConflict('error', 'ALLOCATION_INCONSISTENT', `Grade ${issue.grade} ${issue.stream} · ${issue.subject}: ${issue.message}`, undefined, undefined, issue);
  }

  for (const summary of streamLoadSummary) {
    if (summary.deficitOrExcess < 0) {
      pushConflict(
        'error',
        'INSUFFICIENT_WEEKLY_PERIODS',
        `Grade ${summary.grade} ${summary.stream} requires ${summary.requiredPeriods} periods/week but only ${summary.availablePeriods} teaching slots exist (shortfall of ${Math.abs(summary.deficitOrExcess)} periods).`,
        undefined,
        undefined,
        summary
      );
    }
  }

  // B. Unscheduled sessions block approval
  for (const u of unscheduled) {
    pushConflict(
      'error',
      'MISSING_WEEKLY_LESSONS',
      `Unscheduled ${Number(u.block_length) > 1 ? `${u.block_length}-period ` : ''}lesson: Grade ${u.grade} ${u.stream} · ${u.subject_name} (${u.reason})`,
      undefined,
      undefined,
      { sessionKey: u.session_key, grade: u.grade, stream: u.stream, subject: u.subject_name }
    );
  }

  // Deduplicate joint lesson rows into logical events by session_block_id + period for teacher & room clash detection
  const teacherSlotEvents = new Map<string, Map<string, any>>(); // `${teacherId}|${day}|${period}` -> Map<blockKey, entry>
  const roomSlotEvents = new Map<string, Map<string, any>>(); // `${roomId}|${day}|${period}` -> Map<blockKey, entry>
  const classSlotEntries = new Map<string, any[]>(); // `${grade}|${stream}|${day}|${period}` -> entries[]
  const blockSegments = new Map<string, any[]>(); // `${sessionBlockId}|${grade}|${stream}` -> entries[]

  // Teacher daily/weekly workload tracking
  const teacherDayPeriods = new Map<string, Set<number>>(); // `${teacherId}|${day}` -> Set<periodNumber>
  const teacherWeekCount = new Map<string, number>();

  // Subject distribution tracking
  const classSubjectDayCount = new Map<string, Map<string, number>>(); // `${grade}|${stream}|${subject}|${day}` -> unique block count

  for (const e of entries) {
    const day = String(e.day_of_week);
    const period = Number(e.period_number);
    const grade = Number(e.grade);
    const stream = String(e.stream);
    const blockEventKey = e.joint_lesson_id ? `jl:${e.joint_lesson_id}` : String(e.session_block_id);
    const teacherIds = safeJsonParse<string[]>(e.teacher_ids_json, []);

    const cKey = `${grade}|${stream}|${day}|${period}`;
    const cList = classSlotEntries.get(cKey) || [];
    cList.push(e);
    classSlotEntries.set(cKey, cList);

    const bsKey = `${e.session_block_id}|${grade}|${stream}`;
    const bsList = blockSegments.get(bsKey) || [];
    bsList.push(e);
    blockSegments.set(bsKey, bsList);

    // Subject daily count (count block starts only, or distinct blockEventKey)
    const sdKey = `${grade}|${stream}|${e.subject_name}`;
    const dayCounts = classSubjectDayCount.get(sdKey) || new Map<string, number>();
    if (Number(e.block_index || 0) === 0) {
      dayCounts.set(day, (dayCounts.get(day) || 0) + Number(e.block_length || 1));
    }
    classSubjectDayCount.set(sdKey, dayCounts);

    // Teacher slot & availability
    for (const tid of teacherIds) {
      const tsKey = `${tid}|${day}|${period}`;
      if (!teacherSlotEvents.has(tsKey)) teacherSlotEvents.set(tsKey, new Map());
      teacherSlotEvents.get(tsKey)!.set(blockEventKey, e);

      const tdKey = `${tid}|${day}`;
      if (!teacherDayPeriods.has(tdKey)) teacherDayPeriods.set(tdKey, new Set());
      const prevSize = teacherDayPeriods.get(tdKey)!.size;
      teacherDayPeriods.get(tdKey)!.add(period);
      if (teacherDayPeriods.get(tdKey)!.size > prevSize) {
        teacherWeekCount.set(tid, (teacherWeekCount.get(tid) || 0) + 1);
      }

      const tProf = teacherMap.get(tid);
      if (tProf) {
        if (tProf.availability?.[day]?.[String(period)] === false) {
          pushConflict(
            'error',
            'TEACHER_UNAVAILABLE',
            `${tProf.teacher_name} is marked unavailable on ${day} Period ${period} (${e.subject_name} for Grade ${grade} ${stream}).`,
            day,
            period,
            { teacherId: tid, entryId: e.id }
          );
        }
        if (Number(tProf.active_in_timetable) === 0 && ['draft', 'generated', 'review'].includes(String(version.status))) {
          pushConflict(
            'warning',
            'TEACHER_INACTIVE',
            `Assigned teacher ${tProf.teacher_name} is currently inactive in timetable roster.`,
            day,
            period,
            { teacherId: tid, entryId: e.id }
          );
        }
        if (Array.isArray(tProf.preferredFree) && tProf.preferredFree.some((pf: any) => pf.day === day && Number(pf.period) === period)) {
          pushConflict(
            'warning',
            'PREFERRED_FREE_USED',
            `${tProf.teacher_name} prefers Period ${period} on ${day} as a free preparation slot.`,
            day,
            period,
            { teacherId: tid }
          );
        }
      }
    }

    // Room slot & availability
    if (e.room_id) {
      const rid = String(e.room_id);
      const rsKey = `${rid}|${day}|${period}`;
      if (!roomSlotEvents.has(rsKey)) roomSlotEvents.set(rsKey, new Map());
      roomSlotEvents.get(rsKey)!.set(blockEventKey, e);

      const rObj = roomMap.get(rid);
      if (rObj) {
        if (rObj.availability?.[day]?.[String(period)] === false) {
          pushConflict(
            'error',
            'ROOM_UNAVAILABLE',
            `Classroom "${rObj.name}" is marked unavailable on ${day} Period ${period}.`,
            day,
            period,
            { roomId: rid, entryId: e.id }
          );
        }
        // Capacity check
        let neededSeats = 38;
        if (e.group_id && groupMap.has(String(e.group_id))) {
          neededSeats = Number(groupMap.get(String(e.group_id)).student_count || 38);
        }
        if (!e.joint_lesson_id && neededSeats > Number(rObj.capacity || 45)) {
          pushConflict(
            'error',
            'ROOM_CAPACITY_EXCEEDED',
            `"${rObj.name}" (capacity ${rObj.capacity}) is too small for Grade ${grade} ${stream} (${neededSeats} learners).`,
            day,
            period,
            { roomId: rid, neededSeats, capacity: rObj.capacity }
          );
        }
      }
    }
  }

  // Check Joint Lesson Combined Capacities
  const jointEventsChecked = new Set<string>();
  for (const e of entries) {
    if (!e.joint_lesson_id || !e.room_id || jointEventsChecked.has(`${e.joint_lesson_id}|${e.day_of_week}|${e.period_number}`)) continue;
    jointEventsChecked.add(`${e.joint_lesson_id}|${e.day_of_week}|${e.period_number}`);
    const jl = db.prepare(`SELECT * FROM tt_joint_lessons WHERE id = ?`).get(String(e.joint_lesson_id)) as any;
    const rObj = roomMap.get(String(e.room_id));
    if (jl && rObj && Number(jl.combined_students || 0) > Number(rObj.capacity || 0)) {
      pushConflict(
        'error',
        'ROOM_CAPACITY_EXCEEDED',
        `Joint lesson "${jl.title}" has ${jl.combined_students} combined students exceeding "${rObj.name}" capacity (${rObj.capacity}).`,
        String(e.day_of_week),
        Number(e.period_number),
        { jointLessonId: jl.id, roomId: rObj.id }
      );
    }
  }

  // C. Teacher Double-Bookings
  for (const [key, eventMap] of teacherSlotEvents.entries()) {
    if (eventMap.size > 1) {
      const [tid, day, periodStr] = key.split('|');
      const tName = teacherMap.get(tid)?.teacher_name || tid;
      const evs = Array.from(eventMap.values()).map((x) => `Grade ${x.grade} ${x.stream} (${x.subject_name})`);
      pushConflict(
        'error',
        'TEACHER_CLASH',
        `Teacher double-booking: ${tName} is scheduled simultaneously for ${evs.join(' AND ')} on ${day} Period ${periodStr}.`,
        day,
        Number(periodStr),
        { teacherId: tid, events: evs }
      );
    }
  }

  // D. Classroom Double-Bookings
  for (const [key, eventMap] of roomSlotEvents.entries()) {
    if (eventMap.size > 1) {
      const [rid, day, periodStr] = key.split('|');
      const rName = roomMap.get(rid)?.name || rid;
      const evs = Array.from(eventMap.values()).map((x) => `Grade ${x.grade} ${x.stream} (${x.subject_name})`);
      pushConflict(
        'error',
        'CLASSROOM_CLASH',
        `Classroom clash: "${rName}" is double-booked for ${evs.join(' AND ')} on ${day} Period ${periodStr}.`,
        day,
        Number(periodStr),
        { roomId: rid, events: evs }
      );
    }
  }

  // E. Class & Split Student-Group Clashes
  for (const [key, list] of classSlotEntries.entries()) {
    if (list.length <= 1) continue;
    const [gStr, stream, day, pStr] = key.split('|');
    // Multiple entries in same class/stream are ONLY valid if NONE is Whole Class AND each has a distinct group_id
    const hasWhole = list.some((x) => !x.group_id || (groupMap.get(String(x.group_id))?.is_whole_class ?? 1) === 1);
    const groupIds = list.map((x) => String(x.group_id || 'whole'));
    const hasDupGroup = new Set(groupIds).size !== groupIds.length;
    if (hasWhole) {
      pushConflict(
        'error',
        'CLASS_CLASH',
        `Class overlap: Grade ${gStr} ${stream} has ${list.map((x) => x.subject_name).join(' & ')} scheduled simultaneously on ${day} Period ${pStr}.`,
        day,
        Number(pStr),
        { grade: Number(gStr), stream, subjects: list.map((x) => x.subject_name) }
      );
    } else if (hasDupGroup) {
      pushConflict(
        'error',
        'STUDENT_GROUP_CLASH',
        `Student group clash in Grade ${gStr} ${stream} on ${day} Period ${pStr}.`,
        day,
        Number(pStr),
        { grade: Number(gStr), stream }
      );
    }
  }

  // F. Double & Triple Block Continuity Checks
  for (const [_key, segs] of blockSegments.entries()) {
    const blockLen = Number(segs[0].block_length || 1);
    if (blockLen <= 1) continue;
    if (segs.length !== blockLen) {
      pushConflict(
        'error',
        'INVALID_DOUBLE_LESSON',
        `Incomplete ${blockLen}-period block for Grade ${segs[0].grade} ${segs[0].stream} · ${segs[0].subject_name} on ${segs[0].day_of_week}.`,
        String(segs[0].day_of_week),
        Number(segs[0].period_number),
        { sessionBlockId: segs[0].session_block_id }
      );
      continue;
    }
    const sorted = [...segs].sort((a, b) => Number(a.period_number) - Number(b.period_number));
    const pNums = sorted.map((s) => Number(s.period_number));
    const validStarts = getContiguousLessonStarts(periods, 12, blockLen as 1 | 2 | 3);
    const isWindowValid = validStarts.some((w) => w.length === pNums.length && w.every((val, idx) => val === pNums[idx]));
    if (!isWindowValid) {
      pushConflict(
        'error',
        'INVALID_DOUBLE_LESSON',
        `Broken multi-period block: Grade ${segs[0].grade} ${segs[0].stream} · ${segs[0].subject_name} on ${segs[0].day_of_week} (Periods ${pNums.join(', ')}) spans a break or non-adjacent slots.`,
        String(segs[0].day_of_week),
        pNums[0],
        { sessionBlockId: segs[0].session_block_id, periods: pNums }
      );
    }
  }

  // G. Placed count vs Required count check (detect deleted entries)
  const expectedCountByKey = new Map<string, number>();
  for (const u of units) {
    for (const ct of u.classTargets) {
      const k = `${ct.grade}|${ct.stream}|${u.subjectName}|${u.groupName}`;
      expectedCountByKey.set(k, (expectedCountByKey.get(k) || 0) + u.blockLength);
    }
  }
  const actualCountByKey = new Map<string, number>();
  for (const e of entries) {
    const k = `${e.grade}|${e.stream}|${e.subject_name}|${e.group_name || 'Whole Class'}`;
    actualCountByKey.set(k, (actualCountByKey.get(k) || 0) + 1);
  }
  for (const [k, exp] of expectedCountByKey.entries()) {
    const act = actualCountByKey.get(k) || 0;
    if (act < exp && unscheduled.length === 0 && entries.length > 0) {
      const [gStr, st, subj, grp] = k.split('|');
      pushConflict(
        'error',
        'MISSING_WEEKLY_LESSONS',
        `Missing weekly lessons for Grade ${gStr} ${st} (${grp}) · ${subj}: ${act}/${exp} periods scheduled.`,
        undefined,
        undefined,
        { grade: Number(gStr), stream: st, subject: subj, scheduled: act, required: exp }
      );
    }
  }

  // H. Teacher Workload & Consecutive Lesson Warnings
  for (const [tdKey, periodSet] of teacherDayPeriods.entries()) {
    const [tid, day] = tdKey.split('|');
    const tProf = teacherMap.get(tid);
    if (!tProf) continue;
    const maxDaily = Number(tProf.max_daily_periods || 6);
    if (periodSet.size > maxDaily) {
      pushConflict(
        'warning',
        'TEACHER_DAILY_OVERLOAD',
        `${tProf.teacher_name} has ${periodSet.size} lessons on ${day} (daily limit: ${maxDaily}).`,
        day,
        undefined,
        { teacherId: tid, count: periodSet.size, limit: maxDaily }
      );
    }

    const sortedP = Array.from(periodSet).sort((a, b) => a - b);
    let streak = 1;
    let maxStreak = 1;
    for (let i = 1; i < sortedP.length; i++) {
      if (sortedP[i] === sortedP[i - 1] + 1) {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        streak = 1;
      }
    }
    const maxConsec = Number(tProf.max_consecutive_lessons || 3);
    if (maxStreak > maxConsec) {
      pushConflict(
        'warning',
        'TEACHER_CONSECUTIVE_LIMIT',
        `${tProf.teacher_name} has ${maxStreak} consecutive lessons on ${day} (recommended max: ${maxConsec}).`,
        day,
        undefined,
        { teacherId: tid, maxStreak, limit: maxConsec }
      );
    }
  }

  for (const [tid, weekTotal] of teacherWeekCount.entries()) {
    const tProf = teacherMap.get(tid);
    if (tProf && weekTotal > Number(tProf.max_weekly_periods || 28)) {
      pushConflict(
        'warning',
        'TEACHER_WEEKLY_OVERLOAD',
        `${tProf.teacher_name} is assigned ${weekTotal} weekly periods (weekly target limit: ${tProf.max_weekly_periods}).`,
        undefined,
        undefined,
        { teacherId: tid, count: weekTotal, limit: tProf.max_weekly_periods }
      );
    }
  }

  // I. Subject Daily Concentration & Minimum Day Spacing Warnings
  const dayIndexMap = new Map<string, number>();
  workingDays.forEach((d, idx) => dayIndexMap.set(d, idx));

  for (const e of entries) {
    if (!e.allocation_id || Number(e.block_index || 0) !== 0) continue;
    const alloc = allocMap.get(String(e.allocation_id));
    if (!alloc) continue;
    const maxPerDay = Number(alloc.max_per_day || 1);
    const sdKey = `${e.grade}|${e.stream}|${e.subject_name}`;
    const dCount = classSubjectDayCount.get(sdKey)?.get(String(e.day_of_week)) || 0;
    if (dCount > Math.max(maxPerDay, Number(e.block_length || 1))) {
      // Avoid repeating identical warning for same class/subject/day
      const alreadyLogged = conflicts.some(
        (c) =>
          c.conflictType === 'EXCESS_DAILY_SUBJECT' &&
          c.details?.grade === Number(e.grade) &&
          c.details?.stream === String(e.stream) &&
          c.details?.subject === String(e.subject_name) &&
          c.dayOfWeek === String(e.day_of_week)
      );
      if (!alreadyLogged) {
        pushConflict(
          'warning',
          'EXCESS_DAILY_SUBJECT',
          `Excessive daily allocation: Grade ${e.grade} ${e.stream} has ${dCount} periods of ${e.subject_name} on ${e.day_of_week} (limit: ${maxPerDay}).`,
          String(e.day_of_week),
          Number(e.period_number),
          { grade: Number(e.grade), stream: String(e.stream), subject: String(e.subject_name), count: dCount, limit: maxPerDay }
        );
      }
    }
  }

  // Persist into tt_validation_conflicts
  const now = new Date().toISOString();
  db.prepare(`DELETE FROM tt_validation_conflicts WHERE version_id = ?`).run(versionId);
  const insConf = db.prepare(
    `INSERT INTO tt_validation_conflicts (id, version_id, tenant_id, severity, conflict_type, day_of_week, period_number, message, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const c of conflicts) {
    insConf.run(
      c.id,
      versionId,
      tenantId,
      c.severity,
      c.conflictType,
      c.dayOfWeek || null,
      c.periodNumber ?? null,
      c.message,
      JSON.stringify(c.details),
      now
    );
  }

  const hardErrors = conflicts.filter((c) => c.severity === 'error').length;
  const warnings = conflicts.filter((c) => c.severity === 'warning').length;

  return {
    hardErrors,
    warnings,
    conflicts,
    canApprove: hardErrors === 0 && entries.length > 0 && unscheduled.length === 0,
  };
}

/**
 * Atomic move check for Manual Drag-and-Drop Editor BEFORE committing to DB.
 * Checks teacher clash, class/split-group clash, classroom clash, break continuity, and availability.
 */
export function validateSingleMoveCandidate(
  db: DatabaseSync,
  versionId: string,
  sessionBlockId: string,
  targetDay: string,
  targetStartPeriod: number,
  targetRoomId?: string | null
): {
  valid: boolean;
  hardConflicts: string[];
  warnings: string[];
  targetPeriods: number[];
} {
  const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ?`).get(versionId) as any;
  if (!version) return { valid: false, hardConflicts: ['Timetable version not found.'], warnings: [], targetPeriods: [] };

  const blockEntries = db
    .prepare(`SELECT * FROM tt_entries WHERE version_id = ? AND session_block_id = ? ORDER BY block_index ASC`)
    .all(versionId, sessionBlockId) as any[];

  if (blockEntries.length === 0) {
    return { valid: false, hardConflicts: ['Lesson session block not found in this timetable version.'], warnings: [], targetPeriods: [] };
  }

  const tenantId = String(version.tenant_id);
  const configId = String(version.config_id);
  const blockLen = Number(blockEntries[0].block_length || 1) as 1 | 2 | 3;

  const periodsRaw = db
    .prepare(`SELECT * FROM tt_periods WHERE config_id = ? ORDER BY sort_order ASC`)
    .all(configId) as any[];
  const periods: TTPeriod[] = periodsRaw.map((p) => ({
    id: String(p.id),
    tenantId,
    configId,
    gradeBand: String(p.grade_band),
    periodNumber: Number(p.period_number),
    label: String(p.label),
    kind: p.kind,
    startTime: String(p.start_time),
    endTime: String(p.end_time),
    sortOrder: Number(p.sort_order),
  }));

  const validWindows = getContiguousLessonStarts(periods, 12, blockLen);
  const matchingWindow = validWindows.find((w) => w[0] === targetStartPeriod);
  const hardConflicts: string[] = [];
  const warnings: string[] = [];

  if (!matchingWindow) {
    hardConflicts.push(
      `Cannot place ${blockLen}-period block at Period ${targetStartPeriod}: slot is either invalid or crosses a break/lunch period.`
    );
    return { valid: false, hardConflicts, warnings, targetPeriods: [] };
  }

  // Distinct class targets (multiple if joint lesson)
  const uniqueClasses = Array.from(
    new Map(blockEntries.map((e) => [`${e.grade}|${e.stream}`, e])).values()
  );

  // Check Grade schedule limits
  for (const ce of uniqueClasses) {
    const gs = db
      .prepare(`SELECT periods_per_day, working_days_json FROM tt_grade_schedules WHERE config_id = ? AND grade = ?`)
      .get(configId, Number(ce.grade)) as any;
    const allowedDays = safeJsonParse<string[]>(gs?.working_days_json, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    if (!allowedDays.includes(targetDay)) {
      hardConflicts.push(`${targetDay} is not a configured working day for Grade ${ce.grade}.`);
    }
    const maxP = Number(gs?.periods_per_day || 8);
    if (matchingWindow.some((p) => p > maxP)) {
      hardConflicts.push(`Period ${Math.max(...matchingWindow)} exceeds Grade ${ce.grade} daily periods (${maxP}).`);
    }
  }

  // Load other entries on targetDay within targetPeriods (excluding this sessionBlockId)
  const placeholders = matchingWindow.map(() => '?').join(',');
  const otherEntries = db
    .prepare(
      `SELECT * FROM tt_entries
       WHERE version_id = ? AND day_of_week = ? AND period_number IN (${placeholders}) AND session_block_id != ?`
    )
    .all(versionId, targetDay, ...matchingWindow, sessionBlockId) as any[];

  const teacherIds = safeJsonParse<string[]>(blockEntries[0].teacher_ids_json, []);
  const roomId = targetRoomId !== undefined ? targetRoomId : (blockEntries[0].room_id ? String(blockEntries[0].room_id) : null);

  // Teacher clashes & availability
  for (const tid of teacherIds) {
    const tProf = db
      .prepare(`SELECT teacher_name, availability_json FROM tt_teacher_profiles WHERE id = ?`)
      .get(tid) as any;
    const avail = safeJsonParse<Record<string, Record<string, boolean>>>(tProf?.availability_json, {});
    for (const p of matchingWindow) {
      if (avail?.[targetDay]?.[String(p)] === false) {
        hardConflicts.push(`${tProf?.teacher_name || 'Teacher'} is unavailable on ${targetDay} Period ${p}.`);
      }
      const clash = otherEntries.find((oe) => {
        if (Number(oe.period_number) !== p) return false;
        const oTeachers = safeJsonParse<string[]>(oe.teacher_ids_json, []);
        return oTeachers.includes(tid);
      });
      if (clash) {
        hardConflicts.push(
          `Teacher clash: ${tProf?.teacher_name || 'Teacher'} is already teaching Grade ${clash.grade} ${clash.stream} (${clash.subject_name}) on ${targetDay} Period ${p}.`
        );
      }
    }
  }

  // Class & student group clashes
  const groupInfoMap = new Map<string, any>();
  for (const g of db.prepare(`SELECT * FROM tt_student_groups WHERE tenant_id = ?`).all(tenantId) as any[]) {
    groupInfoMap.set(String(g.id), g);
  }

  for (const ce of uniqueClasses) {
    const movingGroupId = ce.group_id ? String(ce.group_id) : null;
    const movingWhole = !movingGroupId || Number(groupInfoMap.get(movingGroupId)?.is_whole_class ?? 1) === 1;

    for (const p of matchingWindow) {
      const sameClassAtP = otherEntries.filter(
        (oe) => Number(oe.grade) === Number(ce.grade) && String(oe.stream) === String(ce.stream) && Number(oe.period_number) === p
      );
      for (const clash of sameClassAtP) {
        const clashWhole = !clash.group_id || Number(groupInfoMap.get(String(clash.group_id))?.is_whole_class ?? 1) === 1;
        if (movingWhole || clashWhole || String(clash.group_id || '') === String(movingGroupId || '')) {
          hardConflicts.push(
            `Class clash: Grade ${ce.grade} ${ce.stream} already has ${clash.subject_name} (${clash.group_name || 'Whole Class'}) on ${targetDay} Period ${p}.`
          );
        }
      }
    }
  }

  // Room clashes & availability
  if (roomId) {
    const rObj = db.prepare(`SELECT * FROM tt_classrooms WHERE id = ?`).get(roomId) as any;
    const avail = safeJsonParse<Record<string, Record<string, boolean>>>(rObj?.availability_json, {});
    for (const p of matchingWindow) {
      if (avail?.[targetDay]?.[String(p)] === false) {
        hardConflicts.push(`Room "${rObj?.name || roomId}" is marked unavailable on ${targetDay} Period ${p}.`);
      }
      const rClash = otherEntries.find((oe) => Number(oe.period_number) === p && String(oe.room_id || '') === roomId);
      if (rClash) {
        hardConflicts.push(
          `Classroom clash: "${rObj?.name || roomId}" is booked by Grade ${rClash.grade} ${rClash.stream} (${rClash.subject_name}) on ${targetDay} Period ${p}.`
        );
      }
    }
  }

  return {
    valid: hardConflicts.length === 0,
    hardConflicts,
    warnings,
    targetPeriods: matchingWindow,
  };
}

// =========================================================================
// ASYNC CONSTRAINT-BASED BACKGROUND SCHEDULER
// =========================================================================
const activeJobs = new Set<string>();

export function enqueueTimetableGenerationJob(
  db: DatabaseSync,
  tenantId: string,
  versionId: string,
  actorId: string,
  preserveLocked = true
): { jobId: string } {
  const now = new Date().toISOString();
  const jobId = uid('ttjob');
  db.prepare(
    `INSERT INTO tt_generation_jobs
       (id, tenant_id, version_id, status, progress_pct, stage_message, preserve_locked, retries, cancel_requested, diagnostics_json, created_by, created_at)
     VALUES (?, ?, ?, 'queued', 0, 'Queued for automatic timetable constraint solver', ?, 0, 0, '{}', ?, ?)`
  ).run(jobId, tenantId, versionId, preserveLocked ? 1 : 0, actorId, now);

  notifyMySqlTablesChanged(['tt_generation_jobs']);
  scheduleJobExecution(jobId);
  return { jobId };
}

export function scheduleJobExecution(jobId: string): void {
  if (activeJobs.has(jobId)) return;
  activeJobs.add(jobId);
  setImmediate(() => {
    void runTimetableGenerationWorker(jobId).finally(() => {
      activeJobs.delete(jobId);
    });
  });
}

async function yieldEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

async function runTimetableGenerationWorker(jobId: string): Promise<void> {
  const db = getDb();
  const job = db.prepare(`SELECT * FROM tt_generation_jobs WHERE id = ?`).get(jobId) as any;
  if (!job) return;

  const tenantId = String(job.tenant_id);
  const versionId = String(job.version_id);
  const preserveLocked = Number(job.preserve_locked) === 1;

  const updateJob = (fields: {
    status?: string;
    progressPct?: number;
    stageMessage?: string;
    diagnostics?: any;
    errorMessage?: string | null;
    startedAt?: string;
    completedAt?: string;
  }) => {
    const sets: string[] = [];
    const params: any[] = [];
    if (fields.status !== undefined) { sets.push('status = ?'); params.push(fields.status); }
    if (fields.progressPct !== undefined) { sets.push('progress_pct = ?'); params.push(fields.progressPct); }
    if (fields.stageMessage !== undefined) { sets.push('stage_message = ?'); params.push(fields.stageMessage); }
    if (fields.diagnostics !== undefined) { sets.push('diagnostics_json = ?'); params.push(JSON.stringify(fields.diagnostics)); }
    if (fields.errorMessage !== undefined) { sets.push('error_message = ?'); params.push(fields.errorMessage); }
    if (fields.startedAt !== undefined) { sets.push('started_at = ?'); params.push(fields.startedAt); }
    if (fields.completedAt !== undefined) { sets.push('completed_at = ?'); params.push(fields.completedAt); }
    if (sets.length === 0) return;
    params.push(jobId);
    db.prepare(`UPDATE tt_generation_jobs SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    broadcastChange({
      type: 'collection:updated',
      collection: 'tt_generation_jobs',
      tenantId,
      recordId: jobId,
      timestamp: new Date().toISOString(),
    });
  };

  const isCancelled = () => {
    const row = db.prepare(`SELECT cancel_requested FROM tt_generation_jobs WHERE id = ?`).get(jobId) as any;
    return Number(row?.cancel_requested || 0) === 1;
  };

  try {
    updateJob({
      status: 'running',
      progressPct: 8,
      stageMessage: 'Loading school timetable constraints, teacher availability, rooms & allocations...',
      startedAt: new Date().toISOString(),
    });
    await yieldEventLoop();
    if (isCancelled()) {
      updateJob({ status: 'cancelled', stageMessage: 'Cancelled by administrator.', completedAt: new Date().toISOString() });
      return;
    }

    const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ?`).get(versionId) as any;
    if (!version) throw new Error('Target timetable version was deleted.');

    const configId = String(version.config_id);
    const cfg = db.prepare(`SELECT * FROM tt_configs WHERE id = ?`).get(configId) as any;
    const workingDays = safeJsonParse<string[]>(cfg?.working_days_json, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

    const periodsRaw = db
      .prepare(`SELECT * FROM tt_periods WHERE config_id = ? ORDER BY sort_order ASC`)
      .all(configId) as any[];
    const periods: TTPeriod[] = periodsRaw.map((p) => ({
      id: String(p.id),
      tenantId,
      configId,
      gradeBand: String(p.grade_band),
      periodNumber: Number(p.period_number),
      label: String(p.label),
      kind: p.kind,
      startTime: String(p.start_time),
      endTime: String(p.end_time),
      sortOrder: Number(p.sort_order),
    }));

    const gradeSchedMap = new Map<number, { periodsPerDay: number; days: string[] }>();
    for (const gs of db.prepare(`SELECT * FROM tt_grade_schedules WHERE config_id = ?`).all(configId) as any[]) {
      gradeSchedMap.set(Number(gs.grade), {
        periodsPerDay: Number(gs.periods_per_day || cfg?.default_periods_per_day || 8),
        days: safeJsonParse<string[]>(gs.working_days_json, workingDays),
      });
    }

    const teachersList = (
      db.prepare(`SELECT * FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[]
    ).map((t) => ({
      id: String(t.id),
      name: String(t.teacher_name),
      availability: safeJsonParse<Record<string, Record<string, boolean>>>(t.availability_json, {}),
      preferredFree: safeJsonParse<Array<{ day: string; period: number }>>(t.preferred_free_periods_json, []),
      maxDaily: Number(t.max_daily_periods || 6),
      maxWeekly: Number(t.max_weekly_periods || 28),
      maxConsecutive: Number(t.max_consecutive_lessons || 3),
      active: Number(t.active_in_timetable) === 1,
    }));
    const teacherMap = new Map(teachersList.map((t) => [t.id, t]));

    const roomsList = (
      db.prepare(`SELECT * FROM tt_classrooms WHERE tenant_id = ? AND is_active = 1`).all(tenantId) as any[]
    ).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      roomType: String(r.room_type),
      capacity: Number(r.capacity || 45),
      assignedGrade: r.assigned_grade ? Number(r.assigned_grade) : null,
      assignedStream: r.assigned_stream ? String(r.assigned_stream) : null,
      availability: safeJsonParse<Record<string, Record<string, boolean>>>(r.availability_json, {}),
    }));
    const roomMap = new Map(roomsList.map((r) => [r.id, r]));

    // Locked entries to preserve if preserveLocked=true
    const lockedEntries = preserveLocked
      ? (db.prepare(`SELECT * FROM tt_entries WHERE version_id = ? AND is_locked = 1`).all(versionId) as any[])
      : [];

    const { units: allUnits, allocationIssues } = expandRequirementUnits(db, tenantId, configId);

    updateJob({
      progressPct: 20,
      stageMessage: `Expanded ${allUnits.length} weekly session blocks (${lockedEntries.length} locked slots preserved)...`,
    });
    await yieldEventLoop();
    if (isCancelled()) {
      updateJob({ status: 'cancelled', stageMessage: 'Cancelled by administrator.', completedAt: new Date().toISOString() });
      return;
    }

    // Track state occupied by locked entries
    interface OccupiedState {
      teacherBusy: Set<string>; // `${teacherId}|${day}|${period}`
      roomBusy: Set<string>; // `${roomId}|${day}|${period}`
      classWholeBusy: Set<string>; // `${grade}|${stream}|${day}|${period}`
      classGroupBusy: Set<string>; // `${grade}|${stream}|${groupKey}|${day}|${period}`
      classAnyBusy: Set<string>; // `${grade}|${stream}|${day}|${period}` (to block Whole Class against split)
      teacherDayPeriods: Map<string, Set<number>>; // `${teacherId}|${day}` -> Set<period>
      teacherWeekTotal: Map<string, number>;
      classSubjDays: Map<string, Map<string, number>>; // `${grade}|${stream}|${subject}` -> Map<day, periodCount>
    }

    const state: OccupiedState = {
      teacherBusy: new Set(),
      roomBusy: new Set(),
      classWholeBusy: new Set(),
      classGroupBusy: new Set(),
      classAnyBusy: new Set(),
      teacherDayPeriods: new Map(),
      teacherWeekTotal: new Map(),
      classSubjDays: new Map(),
    };

    const lockedCountsByAllocOrJoint = new Map<string, number>();

    for (const le of lockedEntries) {
      const day = String(le.day_of_week);
      const period = Number(le.period_number);
      const grade = Number(le.grade);
      const stream = String(le.stream);
      const tIds = safeJsonParse<string[]>(le.teacher_ids_json, []);
      for (const tid of tIds) {
        state.teacherBusy.add(`${tid}|${day}|${period}`);
        const tdKey = `${tid}|${day}`;
        if (!state.teacherDayPeriods.has(tdKey)) state.teacherDayPeriods.set(tdKey, new Set());
        if (!state.teacherDayPeriods.get(tdKey)!.has(period)) {
          state.teacherDayPeriods.get(tdKey)!.add(period);
          state.teacherWeekTotal.set(tid, (state.teacherWeekTotal.get(tid) || 0) + 1);
        }
      }
      if (le.room_id) state.roomBusy.add(`${le.room_id}|${day}|${period}`);
      state.classAnyBusy.add(`${grade}|${stream}|${day}|${period}`);
      if (!le.group_id || le.group_name === 'Whole Class') {
        state.classWholeBusy.add(`${grade}|${stream}|${day}|${period}`);
      } else {
        state.classGroupBusy.add(`${grade}|${stream}|${le.group_id}|${day}|${period}`);
      }
      if (Number(le.block_index || 0) === 0) {
        const k = le.joint_lesson_id ? `jl:${le.joint_lesson_id}:${grade}:${stream}` : `sa:${le.allocation_id}:${le.block_length}`;
        lockedCountsByAllocOrJoint.set(k, (lockedCountsByAllocOrJoint.get(k) || 0) + 1);
        const sdKey = `${grade}|${stream}|${le.subject_name}`;
        if (!state.classSubjDays.has(sdKey)) state.classSubjDays.set(sdKey, new Map());
        state.classSubjDays.get(sdKey)!.set(day, (state.classSubjDays.get(sdKey)!.get(day) || 0) + Number(le.block_length || 1));
      }
    }

    // Filter out units already covered by locked entries
    const remainingUnits: TTSessionUnit[] = [];
    const consumedLocked = new Map<string, number>(lockedCountsByAllocOrJoint);
    for (const u of allUnits) {
      const k = u.jointLessonId
        ? `jl:${u.jointLessonId}:${u.classTargets[0].grade}:${u.classTargets[0].stream}`
        : `sa:${u.allocationId}:${u.blockLength}`;
      const rem = consumedLocked.get(k) || 0;
      if (rem > 0) {
        consumedLocked.set(k, rem - 1);
      } else {
        remainingUnits.push(u);
      }
    }

    // Most-Constrained-First heuristic ordering:
    // 1. Joint Multi-Stream -> 2. Triples -> 3. Doubles -> 4. Specialized Lab/Workshop rooms -> 5. Preferred slots -> 6. Teacher scarcity
    const teacherFrequency = new Map<string, number>();
    for (const u of remainingUnits) {
      for (const tid of u.teacherIds) teacherFrequency.set(tid, (teacherFrequency.get(tid) || 0) + u.blockLength);
    }

    remainingUnits.sort((a, b) => {
      const scoreUnit = (u: TTSessionUnit) => {
        let s = 0;
        if (u.jointLessonId) s += 10000;
        s += u.blockLength * 1200;
        if (u.requiredRoomType !== 'general') s += 600;
        if (u.preferredDays.length > 0 || u.preferredPeriods.length > 0) s += 300;
        const maxTLoad = u.teacherIds.reduce((m, tid) => Math.max(m, teacherFrequency.get(tid) || 0), 0);
        s += maxTLoad * 10;
        return s;
      };
      return scoreUnit(b) - scoreUnit(a);
    });

    interface PlacedEntry {
      id: string;
      sessionBlockId: string;
      unit: TTSessionUnit;
      day: string;
      period: number;
      blockIndex: number;
      roomId: string | null;
      roomName: string | null;
    }

    const newlyPlaced: PlacedEntry[] = [];
    const unscheduledOut: Array<{ unit: TTSessionUnit; reason: string; diagnostics: any }> = [];

    const pickRoom = (unit: TTSessionUnit, day: string, windowPeriods: number[]): { id: string | null; name: string | null } | null => {
      const checkRoomOk = (r: typeof roomsList[number]) => {
        if (r.capacity < unit.studentCount) return false;
        for (const p of windowPeriods) {
          if (r.availability?.[day]?.[String(p)] === false) return false;
          if (state.roomBusy.has(`${r.id}|${day}|${p}`)) return false;
        }
        return true;
      };

      // 1. Preferred room
      if (unit.preferredRoomId && roomMap.has(unit.preferredRoomId)) {
        const pr = roomMap.get(unit.preferredRoomId)!;
        if (checkRoomOk(pr)) return { id: pr.id, name: pr.name };
      }

      // 2. Specialized matching type
      if (unit.requiredRoomType !== 'general') {
        const specialized = roomsList
          .filter((r) => r.roomType === unit.requiredRoomType && checkRoomOk(r))
          .sort((a, b) => a.capacity - b.capacity);
        if (specialized.length > 0) return { id: specialized[0].id, name: specialized[0].name };
        return null; // Specialized room unavailable
      }

      // 3. Dedicated homeroom first
      if (unit.classTargets.length === 1) {
        const ct = unit.classTargets[0];
        const home = roomsList.find(
          (r) =>
            r.assignedGrade === ct.grade &&
            String(r.assignedStream || '').toLowerCase() === ct.stream.toLowerCase() &&
            checkRoomOk(r)
        );
        if (home) return { id: home.id, name: home.name };
      }

      // 4. Any available general classroom or hall fallback matching capacity
      const anyGeneral = roomsList
        .filter((r) => (r.roomType === 'general' || r.roomType === 'hall') && checkRoomOk(r))
        .sort((a, b) => a.capacity - b.capacity);
      if (anyGeneral.length > 0) return { id: anyGeneral[0].id, name: anyGeneral[0].name };

      // If no rooms configured at all, allow virtual assignment; otherwise reject room shortage
      return roomsList.length === 0 ? { id: null, name: 'Assigned Classroom' } : null;
    };

    const scoreCandidate = (unit: TTSessionUnit, day: string, windowPeriods: number[], allowSoftSpreadOverflow: boolean): number | null => {
      // Check Grade working days & max periods
      for (const ct of unit.classTargets) {
        const gs = gradeSchedMap.get(ct.grade);
        const allowedDays = gs?.days || workingDays;
        if (!allowedDays.includes(day)) return null;
        const maxP = gs?.periodsPerDay || Number(cfg?.default_periods_per_day || 8);
        if (windowPeriods.some((p) => p > maxP)) return null;

        // Class / Student Group Clash (HARD)
        for (const p of windowPeriods) {
          if (unit.isWholeClass) {
            if (state.classAnyBusy.has(`${ct.grade}|${ct.stream}|${day}|${p}`)) return null;
          } else {
            if (state.classWholeBusy.has(`${ct.grade}|${ct.stream}|${day}|${p}`)) return null;
            if (state.classGroupBusy.has(`${ct.grade}|${ct.stream}|${unit.groupId || unit.groupName}|${day}|${p}`)) return null;
          }
        }
      }

      // Check Teacher Clashes & Availability (HARD)
      for (const tid of unit.teacherIds) {
        const t = teacherMap.get(tid);
        if (t && !t.active) return null;
        for (const p of windowPeriods) {
          if (t?.availability?.[day]?.[String(p)] === false) return null;
          if (state.teacherBusy.has(`${tid}|${day}|${p}`)) return null;
        }
      }

      // Check Classroom availability & capacity (HARD)
      const room = pickRoom(unit, day, windowPeriods);
      if (!room) return null;

      // Soft Score (higher is better)
      let score = 1000;

      // 1. Subject spread & daily cap
      const dayIdx = workingDays.indexOf(day);
      for (const ct of unit.classTargets) {
        const sdKey = `${ct.grade}|${ct.stream}|${unit.subjectName}`;
        const existingDaysMap = state.classSubjDays.get(sdKey);
        const alreadyOnDay = existingDaysMap?.get(day) || 0;
        const effectiveMaxDay = Math.max(unit.maxPerDay, unit.blockLength);
        if (alreadyOnDay + unit.blockLength > effectiveMaxDay) {
          if (!allowSoftSpreadOverflow) return null;
          score -= 500 * (alreadyOnDay + 1);
        } else if (alreadyOnDay > 0) {
          score -= 120;
        }

        // Minimum spacing check
        if (unit.minSpacingDays > 0 && existingDaysMap) {
          for (const [prevDay, cnt] of existingDaysMap.entries()) {
            if (cnt <= 0) continue;
            const prevIdx = workingDays.indexOf(prevDay);
            if (prevIdx !== -1 && Math.abs(dayIdx - prevIdx) <= unit.minSpacingDays) {
              score -= allowSoftSpreadOverflow ? 150 : 320;
            }
          }
        }
      }

      // 2. Teacher workload balance, consecutive cap & preferred free slots
      for (const tid of unit.teacherIds) {
        const t = teacherMap.get(tid);
        if (!t) continue;
        const dayLoad = state.teacherDayPeriods.get(`${tid}|${day}`)?.size || 0;
        const weekLoad = state.teacherWeekTotal.get(tid) || 0;

        if (dayLoad + windowPeriods.length > t.maxDaily) score -= 420;
        if (weekLoad + windowPeriods.length > t.maxWeekly) score -= 350;
        score -= dayLoad * 18; // Balance daily teaching evenly across the week

        // Consecutive streak check
        const merged = new Set(state.teacherDayPeriods.get(`${tid}|${day}`) || []);
        windowPeriods.forEach((p) => merged.add(p));
        const sortedP = Array.from(merged).sort((a, b) => a - b);
        let maxRun = 1;
        let run = 1;
        for (let i = 1; i < sortedP.length; i++) {
          if (sortedP[i] === sortedP[i - 1] + 1) {
            run++;
            if (run > maxRun) maxRun = run;
          } else {
            run = 1;
          }
        }
        if (maxRun > t.maxConsecutive) score -= 260;

        // Avoid placing into preferred free period
        if (t.preferredFree.some((pf) => pf.day === day && windowPeriods.includes(Number(pf.period)))) {
          score -= 220;
        }
      }

      // 3. Preferred days & periods bonus
      if (unit.preferredDays.length > 0 && unit.preferredDays.includes(day)) score += 160;
      if (unit.preferredPeriods.length > 0 && windowPeriods.some((p) => unit.preferredPeriods.includes(p))) score += 140;

      // 4. Morning preference for heavy core cognitive subjects
      const isCoreHeavy = ['Mathematics', 'English', 'Kiswahili', 'Integrated Science'].includes(unit.subjectName);
      if (isCoreHeavy && windowPeriods[0] <= 4) score += 45;
      if (!isCoreHeavy && windowPeriods[0] >= 5) score += 25;

      // 5. Compactness bonus (prefer earlier available slots in the day to avoid awkward gaps)
      score -= windowPeriods[0] * 3;

      return score;
    };

    const commitUnitPlacement = (unit: TTSessionUnit, day: string, windowPeriods: number[], room: { id: string | null; name: string | null }) => {
      const sessionBlockId = uid('ttblk');
      windowPeriods.forEach((p, bIdx) => {
        for (const tid of unit.teacherIds) {
          state.teacherBusy.add(`${tid}|${day}|${p}`);
          const tdKey = `${tid}|${day}`;
          if (!state.teacherDayPeriods.has(tdKey)) state.teacherDayPeriods.set(tdKey, new Set());
          if (!state.teacherDayPeriods.get(tdKey)!.has(p)) {
            state.teacherDayPeriods.get(tdKey)!.add(p);
            state.teacherWeekTotal.set(tid, (state.teacherWeekTotal.get(tid) || 0) + 1);
          }
        }
        if (room.id) state.roomBusy.add(`${room.id}|${day}|${p}`);
        for (const ct of unit.classTargets) {
          state.classAnyBusy.add(`${ct.grade}|${ct.stream}|${day}|${p}`);
          if (unit.isWholeClass) {
            state.classWholeBusy.add(`${ct.grade}|${ct.stream}|${day}|${p}`);
          } else {
            state.classGroupBusy.add(`${ct.grade}|${ct.stream}|${unit.groupId || unit.groupName}|${day}|${p}`);
          }
          newlyPlaced.push({
            id: uid('ttent'),
            sessionBlockId,
            unit: { ...unit, grade: ct.grade, stream: ct.stream },
            day,
            period: p,
            blockIndex: bIdx,
            roomId: room.id,
            roomName: room.name,
          });
        }
      });

      for (const ct of unit.classTargets) {
        const sdKey = `${ct.grade}|${ct.stream}|${unit.subjectName}`;
        if (!state.classSubjDays.has(sdKey)) state.classSubjDays.set(sdKey, new Map());
        state.classSubjDays.get(sdKey)!.set(day, (state.classSubjDays.get(sdKey)!.get(day) || 0) + unit.blockLength);
      }
    };

    // Place sessions in two passes (Pass 1: strict spread + zero hard conflicts; Pass 2: relax soft daily/spacing caps if needed)
    let processed = 0;
    const totalCount = Math.max(1, remainingUnits.length);

    for (const unit of remainingUnits) {
      processed++;
      if (processed % 15 === 0) {
        const pct = Math.min(82, 22 + Math.round((processed / totalCount) * 60));
        updateJob({
          progressPct: pct,
          stageMessage: `Placing lesson blocks (${processed}/${remainingUnits.length})...`,
        });
        await yieldEventLoop();
        if (isCancelled()) {
          updateJob({ status: 'cancelled', stageMessage: 'Cancelled by administrator.', completedAt: new Date().toISOString() });
          return;
        }
      }

      const maxGradeP = Math.min(
        ...unit.classTargets.map((ct) => gradeSchedMap.get(ct.grade)?.periodsPerDay || Number(cfg?.default_periods_per_day || 8))
      );
      const contiguousWindows = getContiguousLessonStarts(periods, maxGradeP, unit.blockLength);

      type CandidateChoice = { day: string; windowPeriods: number[]; score: number; room: { id: string | null; name: string | null } };
      let bestCandidate: CandidateChoice | null = null as CandidateChoice | null;

      for (const allowRelaxedSoft of [false, true]) {
        for (const day of workingDays) {
          for (const win of contiguousWindows) {
            const sc = scoreCandidate(unit, day, win, allowRelaxedSoft);
            if (sc === null) continue;
            // Deterministic tie-breaker spread across days using processed index
            const jittered = sc + ((processed + workingDays.indexOf(day)) % 3);
            if (!bestCandidate || jittered > bestCandidate.score) {
              const room = pickRoom(unit, day, win);
              if (room) {
                bestCandidate = { day, windowPeriods: win, score: jittered, room };
              }
            }
          }
        }
        if (bestCandidate) break;
      }

      if (bestCandidate) {
        commitUnitPlacement(unit, bestCandidate.day, bestCandidate.windowPeriods, bestCandidate.room);
      } else {
        unscheduledOut.push({
          unit,
          reason:
            unit.teacherIds.length === 0
              ? 'No qualified teacher assigned to subject.'
              : unit.blockLength > 1
              ? `No clash-free ${unit.blockLength}-period contiguous slot with ${unit.requiredRoomType} availability.`
              : `All valid teaching slots conflicted with teacher, class, or room availability.`,
          diagnostics: {
            blockLength: unit.blockLength,
            requiredRoomType: unit.requiredRoomType,
            teachers: unit.teacherNames,
            studentCount: unit.studentCount,
          },
        });
      }
    }

    updateJob({
      progressPct: 88,
      stageMessage: 'Committing timetable entries & running independent conflict validation...',
    });
    await yieldEventLoop();

    // Commit atomically in SQLite transaction
    const now = new Date().toISOString();
    db.exec('BEGIN IMMEDIATE');
    try {
      if (preserveLocked) {
        db.prepare(`DELETE FROM tt_entries WHERE version_id = ? AND is_locked = 0`).run(versionId);
      } else {
        db.prepare(`DELETE FROM tt_entries WHERE version_id = ?`).run(versionId);
      }
      db.prepare(`DELETE FROM tt_unscheduled_sessions WHERE version_id = ?`).run(versionId);

      const insEntry = db.prepare(
        `INSERT INTO tt_entries
           (id, version_id, tenant_id, day_of_week, period_number, grade, stream, stream_label, group_id, group_name, joint_lesson_id, allocation_id, subject_name, teacher_ids_json, teacher_names_json, room_id, room_name, session_block_id, block_length, block_index, is_locked, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
      );

      for (const pe of newlyPlaced) {
        const u = pe.unit;
        insEntry.run(
          pe.id,
          versionId,
          tenantId,
          pe.day,
          pe.period,
          u.grade,
          u.stream,
          `Grade ${u.grade} ${u.stream}`,
          u.groupId || null,
          u.groupName || 'Whole Class',
          u.jointLessonId || null,
          u.allocationId || null,
          u.subjectName,
          JSON.stringify(u.teacherIds),
          JSON.stringify(u.teacherNames),
          pe.roomId,
          pe.roomName || 'Assigned Room',
          pe.sessionBlockId,
          u.blockLength,
          pe.blockIndex,
          now
        );
      }

      const insUnsched = db.prepare(
        `INSERT INTO tt_unscheduled_sessions
           (id, version_id, tenant_id, session_key, allocation_id, joint_lesson_id, grade, stream, group_id, group_name, subject_name, teacher_ids_json, teacher_names_json, block_length, required_room_type, reason, diagnostics_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const us of unscheduledOut) {
        insUnsched.run(
          uid('ttun'),
          versionId,
          tenantId,
          us.unit.sessionKey,
          us.unit.allocationId || null,
          us.unit.jointLessonId || null,
          us.unit.grade,
          us.unit.stream,
          us.unit.groupId || null,
          us.unit.groupName || 'Whole Class',
          us.unit.subjectName,
          JSON.stringify(us.unit.teacherIds),
          JSON.stringify(us.unit.teacherNames),
          us.unit.blockLength,
          us.unit.requiredRoomType,
          us.reason,
          JSON.stringify(us.diagnostics)
        );
      }

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    // Run independent post-generation validation
    const validation = validateTimetableVersion(db, versionId);
    const totalEntries = (
      db.prepare(`SELECT COUNT(*) as c FROM tt_entries WHERE version_id = ?`).get(versionId) as any
    ).c;

    const metrics = {
      totalEntries,
      lockedPreserved: lockedEntries.length,
      placedThisRun: newlyPlaced.length,
      unscheduledCount: unscheduledOut.length,
      hardErrors: validation.hardErrors,
      warnings: validation.warnings,
      allocationIssuesCount: allocationIssues.length,
      generatedAt: now,
    };

    db.prepare(
      `UPDATE tt_versions SET status = 'generated', metrics_json = ?, updated_at = ? WHERE id = ?`
    ).run(JSON.stringify(metrics), now, versionId);

    updateJob({
      status: 'completed',
      progressPct: 100,
      stageMessage:
        unscheduledOut.length === 0 && validation.hardErrors === 0
          ? `Schedule generated cleanly with ${totalEntries} entries and zero hard conflicts.`
          : `Schedule generated with ${totalEntries} entries, ${unscheduledOut.length} unscheduled sessions, ${validation.hardErrors} hard errors, ${validation.warnings} warnings.`,
      diagnostics: metrics,
      completedAt: now,
    });

    notifyMySqlTablesChanged([
      'tt_versions',
      'tt_entries',
      'tt_unscheduled_sessions',
      'tt_validation_conflicts',
      'tt_generation_jobs',
    ]);
    broadcastChange({
      type: 'collection:updated',
      collection: 'edusmart_timetable_v1',
      tenantId,
      recordId: versionId,
      timestamp: now,
    });
  } catch (err: any) {
    console.error('[timetableEngine] Generation error:', err);
    updateJob({
      status: 'failed',
      progressPct: 100,
      stageMessage: 'Timetable generation encountered an error.',
      errorMessage: err?.message || 'Unknown solver error',
      completedAt: new Date().toISOString(),
    });
  }
}

/**
 * Sync published version entries into legacy `edusmart_timetable_v1` collection
 * and broadcast notification in `edusmart_notifications_v1` so all portals stay in sync.
 */
export function publishVersionEffects(
  db: DatabaseSync,
  tenantId: string,
  versionId: string,
  actorId: string,
  actorName: string
): void {
  const version = db.prepare(`SELECT * FROM tt_versions WHERE id = ?`).get(versionId) as any;
  if (!version) return;
  const cfg = db.prepare(`SELECT * FROM tt_configs WHERE id = ?`).get(String(version.config_id)) as any;
  const periods = db.prepare(`SELECT * FROM tt_periods WHERE config_id = ?`).all(String(version.config_id)) as any[];
  const pTimeMap = new Map<number, { startTime: string; endTime: string }>();
  for (const p of periods) {
    if (Number(p.period_number) > 0) {
      pTimeMap.set(Number(p.period_number), { startTime: String(p.start_time), endTime: String(p.end_time) });
    }
  }

  const entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(versionId) as any[];
  const now = new Date().toISOString();

  // Soft-delete previous legacy timetable records for this tenant
  db.prepare(
    `UPDATE collections_store SET deleted_at = ?, updated_at = ?
     WHERE collection_key = 'edusmart_timetable_v1' AND tenant_id = ?`
  ).run(now, now, tenantId);

  for (const e of entries) {
    const pt = pTimeMap.get(Number(e.period_number)) || { startTime: '08:00', endTime: '08:40' };
    const names = safeJsonParse<string[]>(e.teacher_names_json, []);
    const legacySlot = {
      id: String(e.id),
      schoolId: tenantId,
      grade: Number(e.grade),
      stream: String(e.stream),
      dayOfWeek: String(e.day_of_week),
      period: Number(e.period_number),
      startTime: pt.startTime,
      endTime: pt.endTime,
      subject: String(e.subject_name),
      teacherName: names.join(' & ') || 'Subject Teacher',
      roomName: String(e.room_name || 'Classroom'),
      roomType: e.joint_lesson_id ? 'shared' : 'classroom',
      groupName: String(e.group_name || 'Whole Class'),
      isJointLesson: Boolean(e.joint_lesson_id),
      isDoublePeriod: Number(e.block_length || 1) >= 2,
      term: String(cfg?.term || 'Term 1'),
      academicYear: String(cfg?.academic_year || '2026'),
      versionId,
    };
    upsertCollectionRecord(db, 'edusmart_timetable_v1', legacySlot.id, tenantId, legacySlot, false);
  }

  // Sync published Library Lesson entries into edusmart_library_timetable_v1 so Library Bookings reflect free vs occupied slots
  db.prepare(
    `UPDATE collections_store SET deleted_at = ?, updated_at = ?
     WHERE collection_key = 'edusmart_library_timetable_v1' AND tenant_id = ? AND record_id LIKE 'mt-lib-%'`
  ).run(now, now, tenantId);

  let syncedLibraryLessonsCount = 0;
  for (const e of entries) {
    if (!String(e.subject_name || '').toLowerCase().includes('library')) continue;
    const pt = pTimeMap.get(Number(e.period_number)) || { startTime: '08:00', endTime: '08:40' };
    const names = safeJsonParse<string[]>(e.teacher_names_json, []);
    const libSlotId = `mt-lib-${String(e.id)}`;
    upsertCollectionRecord(
      db,
      'edusmart_library_timetable_v1',
      libSlotId,
      tenantId,
      {
        id: libSlotId,
        schoolId: tenantId,
        dayOfWeek: String(e.day_of_week),
        startTime: pt.startTime,
        endTime: pt.endTime,
        grade: Number(e.grade),
        stream: String(e.stream),
        teacherInCharge: names.join(' & ') || 'Subject Teacher',
        sessionType: 'Library Reading Period',
        venue: String(e.room_name || 'Main Library Reading Hall'),
      },
      false
    );
    syncedLibraryLessonsCount++;
  }

  // Emit tenant-wide notification when timetable is published
  const notifId = uid('ttnotif');
  upsertCollectionRecord(
    db,
    'edusmart_notifications_v1',
    notifId,
    tenantId,
    {
      id: notifId,
      schoolId: tenantId,
      title: `Published Timetable Updated (${cfg?.term || 'Term 1'} ${cfg?.academic_year || '2026'})`,
      message: `${version.name} has been officially approved and published by ${actorName}. Open Timetable to view your updated weekly schedule.`,
      targetRoles: ['admin', 'head_teacher', 'deputy_head', 'dean_of_studies', 'class_teacher', 'teacher', 'student', 'parent'],
      type: 'timetable_published',
      createdAt: now,
      read: false,
      senderId: actorId,
    },
    false
  );

  notifyMySqlTablesChanged(['collections_store']);
  broadcastChange({
    type: 'collection:updated',
    collection: 'edusmart_timetable_v1',
    tenantId,
    recordId: versionId,
    timestamp: now,
  });
  if (syncedLibraryLessonsCount > 0) {
    broadcastChange({
      type: 'collection:updated',
      collection: 'edusmart_library_timetable_v1',
      tenantId,
      recordId: versionId,
      timestamp: now,
    });
  }
  broadcastChange({
    type: 'collection:updated',
    collection: 'edusmart_notifications_v1',
    tenantId,
    recordId: notifId,
    timestamp: now,
  });
}
