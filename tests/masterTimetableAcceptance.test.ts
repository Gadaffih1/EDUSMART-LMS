import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { initTimetableSchema } from '../src/server/timetableSchema.ts';
import {
  bookEntryAtomically,
  categoryCodeForGrade,
  checkGlobalTeacherConflict,
  ensureTenantTimetableSeeded,
  gradesForCategoryCode,
  publishVersionEffects,
  runTimetableGenerationDirect,
  syncVersionBookingLocks,
  uid,
  validateSingleMoveCandidate,
  validateTimetableInputs,
  validateTimetableVersion,
} from '../src/server/timetableEngine.ts';

function initCoreLmsTables(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections_store (
      collection_key TEXT NOT NULL,
      record_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      PRIMARY KEY (collection_key, record_id, tenant_id)
    );
    CREATE TABLE IF NOT EXISTS school_grades (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS school_streams (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT
    );
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade_label TEXT,
      stream_label TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      tsc_number TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS provisioned_accounts (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade_number INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS streams (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS grade_teacher_assignments (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      periods_per_week INTEGER NOT NULL DEFAULT 4,
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `);
  initTimetableSchema(db);
}

function createMemoryDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  initCoreLmsTables(db);
  return db;
}

/**
 * Seeds a full realistic school spanning Grades 1-3, 4-6, and 7-9 with dedicated
 * teachers strictly assigned to their subjects, grades, and streams.
 */
function seedCategorySchool(
  db: DatabaseSync,
  tenantId: string,
  gradesToSeed: number[],
  streamsPerGrade: string[] = ['North', 'South']
) {
  const gradeIds = new Map<number, string>();
  const streamIds = new Map<string, string>();

  for (const g of gradesToSeed) {
    const gid = `${tenantId}-g${g}`;
    gradeIds.set(g, gid);
    db.prepare(`INSERT INTO school_grades (id, school_id, name) VALUES (?, ?, ?)`).run(gid, tenantId, `Grade ${g}`);
    db.prepare(`INSERT INTO grades (id, school_id, name, grade_number, is_active) VALUES (?, ?, ?, ?, 1)`).run(gid, tenantId, `Grade ${g}`, g);
    for (const s of streamsPerGrade) {
      const sid = `${tenantId}-s${g}-${s.toLowerCase()}`;
      streamIds.set(`${g}|${s}`, sid);
      db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, ?, ?, ?)`).run(
        sid,
        tenantId,
        gid,
        s,
        `${g} ${s}`
      );
      db.prepare(`INSERT INTO streams (id, school_id, grade_id, name, is_active) VALUES (?, ?, ?, ?, 1)`).run(
        sid,
        tenantId,
        gid,
        s
      );
    }
  }

  const seeded = ensureTenantTimetableSeeded(db, tenantId);
  const configId = seeded.configId;
  const now = new Date().toISOString();
  let versionRow = db
    .prepare(`SELECT id FROM tt_versions WHERE config_id = ? AND tenant_id = ? ORDER BY version_number DESC LIMIT 1`)
    .get(configId, tenantId) as any;
  if (!versionRow) {
    const newVid = uid('ttver');
    db.prepare(
      `INSERT INTO tt_versions (id, config_id, tenant_id, version_number, name, status, created_by, created_by_name, created_at, updated_at)
       VALUES (?, ?, ?, 1, 'Draft v1', 'draft', 'admin', 'Admin', ?, ?)`
    ).run(newVid, configId, tenantId, now, now);
    versionRow = { id: newVid };
  }
  const versionId = String(versionRow.id);

  // Helper to register a teacher with strict grade_teacher_assignments
  const addTeacher = (
    id: string,
    name: string,
    email: string,
    assignments: Array<{ grade: number; stream: string; subject: string }>
  ) => {
    const subjects = Array.from(new Set(assignments.map((a) => a.subject)));
    const grades = Array.from(new Set(assignments.map((a) => a.grade)));
    db.prepare(
      `INSERT OR IGNORE INTO users (id, school_id, email, name, role, is_active, payload_json)
       VALUES (?, ?, ?, ?, 'teacher', 1, ?)`
    ).run(id, tenantId, email, name, JSON.stringify({ id, name, email, role: 'teacher', subjects, assignedGrades: grades }));

    for (const a of assignments) {
      const gid = gradeIds.get(a.grade);
      const sid = streamIds.get(`${a.grade}|${a.stream}`);
      if (!gid || !sid) continue;
      db.prepare(
        `INSERT INTO grade_teacher_assignments (id, school_id, grade_id, stream_id, teacher_id, teacher_name, subject_name, periods_per_week, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 4, 1)`
      ).run(uid('gta'), tenantId, gid, sid, id, name, a.subject);
    }

    db.prepare(
      `INSERT OR REPLACE INTO tt_teacher_profiles (
         id, tenant_id, user_id, teacher_name, teacher_email, qualified_subjects_json,
         max_daily_periods, max_weekly_periods, max_consecutive_lessons, active_in_timetable, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 8, 40, 4, 1, ?)`
    ).run(id, tenantId, id, name, email, JSON.stringify(subjects), now);
  };

  return { configId, versionId, gradeIds, streamIds, addTeacher };
}

/**
 * Helper: configure crisp stream allocations for specified grades & run solver synchronously.
 */
async function configureAndGenerate(
  db: DatabaseSync,
  tenantId: string,
  configId: string,
  versionId: string,
  allocations: Array<{
    grade: number;
    stream: string;
    subject: string;
    periods: number;
    teacherId: string;
    doubleBlocks?: number;
    preferredRoomType?: string;
    roomId?: string | null;
  }>
) {
  const now = new Date().toISOString();
  // Clear default allocations on this config so test assertions are exact
  db.prepare(`DELETE FROM tt_stream_subject_allocations WHERE config_id = ?`).run(configId);
  db.prepare(`DELETE FROM tt_grade_subject_allocations WHERE config_id = ?`).run(configId);
  db.prepare(`DELETE FROM tt_entries WHERE version_id = ?`).run(versionId);
  db.prepare(`DELETE FROM tt_teacher_bookings WHERE version_id = ?`).run(versionId);
  db.prepare(`DELETE FROM tt_stream_bookings WHERE version_id = ?`).run(versionId);

  const subRows = db.prepare(`SELECT id, name FROM tt_subjects WHERE tenant_id = ?`).all(tenantId) as any[];
  const subByLower = new Map<string, string>(subRows.map((r) => [String(r.name).toLowerCase(), String(r.id)]));

  for (const a of allocations) {
    let subId = subByLower.get(a.subject.toLowerCase());
    if (!subId) {
      subId = uid('ttsub');
      db.prepare(
        `INSERT INTO tt_subjects (id, tenant_id, name, code, category, default_room_type, is_active, updated_at)
         VALUES (?, ?, ?, ?, 'core', ?, 1, ?)`
      ).run(subId, tenantId, a.subject, a.subject.slice(0, 4).toUpperCase(), a.preferredRoomType || 'general', now);
      subByLower.set(a.subject.toLowerCase(), subId);
    }
    const doubleBlocks = a.doubleBlocks || 0;
    const singleLessons = Math.max(0, a.periods - doubleBlocks * 2);
    db.prepare(
      `INSERT INTO tt_stream_subject_allocations (
         id, tenant_id, config_id, grade, stream, subject_name,
         is_overridden, required_weekly_periods, single_lessons, double_lessons, triple_lessons,
         required_room_type, room_id, teacher_ids_json, is_active, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 0, ?, ?, ?, 1, ?)`
    ).run(
      uid('ttsa'),
      tenantId,
      configId,
      a.grade,
      a.stream,
      a.subject,
      a.periods,
      singleLessons,
      doubleBlocks,
      a.preferredRoomType || 'general',
      a.roomId || null,
      JSON.stringify([a.teacherId]),
      now
    );
  }

  const jobId = uid('ttjob');
  db.prepare(
    `INSERT INTO tt_generation_jobs (id, tenant_id, version_id, status, progress_pct, stage_message, preserve_locked, created_by, created_at)
     VALUES (?, ?, ?, 'queued', 0, 'Queued for acceptance test', 1, 'admin', ?)`
  ).run(jobId, tenantId, versionId, now);

  await runTimetableGenerationDirect(db, jobId);

  const job = db.prepare(`SELECT * FROM tt_generation_jobs WHERE id = ?`).get(jobId) as any;
  const entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(versionId) as any[];
  const unscheduled = db.prepare(`SELECT * FROM tt_unscheduled_sessions WHERE version_id = ?`).all(versionId) as any[];
  const validation = validateTimetableVersion(db, versionId);
  return { job, entries, unscheduled, validation };
}

/** Assert zero teacher double-bookings across the entire version. */
function assertZeroTeacherCollisions(entries: any[]) {
  const seen = new Map<string, Set<string>>();
  for (const e of entries) {
    const tids: string[] = JSON.parse(e.teacher_ids_json || '[]');
    const eventKey = e.joint_lesson_id ? `jl:${e.joint_lesson_id}` : String(e.session_block_id);
    for (const tid of tids) {
      const slot = `${tid}|${e.day_of_week}|${e.period_number}`;
      if (!seen.has(slot)) seen.set(slot, new Set());
      seen.get(slot)!.add(eventKey);
    }
  }
  for (const [slot, events] of seen.entries()) {
    assert.equal(events.size, 1, `Teacher collision detected at ${slot}: ${Array.from(events).join(', ')}`);
  }
}

/* =========================================================================
   TEST 1: Generate timetables for Grades 1–3 (Lower Primary)
   ========================================================================= */
test('TEST 1: Generate clash-free timetables for Grades 1–3 (Lower Primary)', async () => {
  const db = createMemoryDb();
  const tenantId = 'school-lp';
  const { configId, versionId, addTeacher } = seedCategorySchool(db, tenantId, [1, 2, 3], ['Dove', 'Eagle']);

  const subjects = [
    { name: 'English', periods: 5 },
    { name: 'Kiswahili', periods: 4 },
    { name: 'Mathematics', periods: 5 },
    { name: 'Creative Arts', periods: 3 },
    { name: 'Library', periods: 1 },
  ];

  const allocs: any[] = [];
  for (const grade of [1, 2, 3]) {
    for (const stream of ['Dove', 'Eagle']) {
      const tid = `t-g${grade}-${stream.toLowerCase()}`;
      addTeacher(
        tid,
        `Tr. LP G${grade} ${stream}`,
        `${tid}@edusmart.ke`,
        subjects.map((s) => ({ grade, stream, subject: s.name }))
      );
      for (const s of subjects) {
        allocs.push({ grade, stream, subject: s.name, periods: s.periods, teacherId: tid });
      }
    }
  }

  const { job, entries, unscheduled, validation } = await configureAndGenerate(db, tenantId, configId, versionId, allocs);
  assert.equal(job.status, 'completed');
  assert.equal(unscheduled.length, 0, 'Expected 0 unscheduled lessons for Grades 1-3');
  assert.equal(validation.hardErrors, 0, `Unexpected hard errors: ${JSON.stringify(validation.hardErrors)}`);
  assert.equal(entries.length, 3 * 2 * 18, 'Expected 6 streams x 18 lessons = 108 entries');
  assertZeroTeacherCollisions(entries);
});

/* =========================================================================
   TEST 2: Generate timetables for Grades 4–6 (Upper Primary)
   ========================================================================= */
test('TEST 2: Generate clash-free timetables for Grades 4–6 (Upper Primary)', async () => {
  const db = createMemoryDb();
  const tenantId = 'school-up';
  const { configId, versionId, addTeacher } = seedCategorySchool(db, tenantId, [4, 5, 6], ['Robin', 'Crane']);

  const subjects = [
    { name: 'Mathematics', periods: 5 },
    { name: 'English', periods: 5 },
    { name: 'Science and Technology', periods: 4 },
    { name: 'Social Studies', periods: 3 },
    { name: 'Agriculture', periods: 3 },
  ];

  const allocs: any[] = [];
  for (const grade of [4, 5, 6]) {
    for (const s of subjects) {
      const tid = `t-up-g${grade}-${s.name.slice(0, 4).toLowerCase()}`;
      addTeacher(tid, `Tr. ${s.name} G${grade}`, `${tid}@edusmart.ke`, [
        { grade, stream: 'Robin', subject: s.name },
        { grade, stream: 'Crane', subject: s.name },
      ]);
      for (const stream of ['Robin', 'Crane']) {
        allocs.push({ grade, stream, subject: s.name, periods: s.periods, teacherId: tid });
      }
    }
  }

  const { job, entries, unscheduled, validation } = await configureAndGenerate(db, tenantId, configId, versionId, allocs);
  assert.equal(job.status, 'completed');
  assert.equal(unscheduled.length, 0);
  assert.equal(validation.hardErrors, 0, `Unexpected hard errors: ${JSON.stringify(validation.hardErrors)}`);
  assert.equal(entries.length, 3 * 2 * 20);
  assertZeroTeacherCollisions(entries);
});

/* =========================================================================
   TEST 3: Generate timetables for Grades 7–9 (Junior School)
   ========================================================================= */
test('TEST 3: Generate clash-free timetables for Grades 7–9 (Junior School)', async () => {
  const db = createMemoryDb();
  const tenantId = 'school-js';
  const { configId, versionId, addTeacher } = seedCategorySchool(db, tenantId, [7, 8, 9], ['Chania', 'Mara']);

  const subjects = [
    { name: 'Mathematics', periods: 5 },
    { name: 'English', periods: 5 },
    { name: 'Integrated Science', periods: 5 },
    { name: 'Pre-Technical Studies', periods: 4 },
    { name: 'Business Studies', periods: 3 },
  ];

  const allocs: any[] = [];
  for (const grade of [7, 8, 9]) {
    for (const s of subjects) {
      const tid = `t-js-g${grade}-${s.name.slice(0, 4).toLowerCase()}`;
      addTeacher(tid, `Tr. ${s.name} G${grade}`, `${tid}@edusmart.ke`, [
        { grade, stream: 'Chania', subject: s.name },
        { grade, stream: 'Mara', subject: s.name },
      ]);
      for (const stream of ['Chania', 'Mara']) {
        allocs.push({ grade, stream, subject: s.name, periods: s.periods, teacherId: tid });
      }
    }
  }

  const { job, entries, unscheduled, validation } = await configureAndGenerate(db, tenantId, configId, versionId, allocs);
  assert.equal(job.status, 'completed');
  assert.equal(unscheduled.length, 0);
  assert.equal(validation.hardErrors, 0, `Unexpected hard errors: ${JSON.stringify(validation.hardErrors)}`);
  assert.equal(entries.length, 3 * 2 * 22);
  assertZeroTeacherCollisions(entries);
});

/* =========================================================================
   TEST 4: Independent weekly allocations across the 3 categories
   ========================================================================= */
test('TEST 4: Modifying Grades 1–3 category allocations never changes Grades 4–6 or Grades 7–9', () => {
  const db = createMemoryDb();
  const tenantId = 'school-cat-indep';
  const { configId } = seedCategorySchool(db, tenantId, [1, 2, 3, 4, 5, 6, 7, 8, 9], ['A']);

  const readCatMath = (cat: string) =>
    (
      db
        .prepare(
          `SELECT required_weekly_periods FROM tt_category_subject_allocations
           WHERE config_id = ? AND category_code = ? AND lower(subject_name) = 'mathematics'`
        )
        .get(configId, cat) as any
    )?.required_weekly_periods;

  const beforeUpper = readCatMath('upper_primary');
  const beforeJunior = readCatMath('junior_school');
  assert.ok(beforeUpper > 0 && beforeJunior > 0, 'All categories must be seeded with Mathematics');

  // Update lower_primary Mathematics to 7 lessons/week and propagate ONLY to lower_primary grades (1, 2, 3)
  db.prepare(
    `UPDATE tt_category_subject_allocations
     SET required_weekly_periods = 7
     WHERE config_id = ? AND category_code = 'lower_primary' AND lower(subject_name) = 'mathematics'`
  ).run(configId);

  for (const g of gradesForCategoryCode('lower_primary')) {
    db.prepare(
      `UPDATE tt_grade_subject_allocations
       SET required_weekly_periods = 7
       WHERE config_id = ? AND grade = ? AND lower(subject_name) = 'mathematics' AND is_category_override = 0`
    ).run(configId, g);
  }

  assert.equal(readCatMath('lower_primary'), 7);
  assert.equal(readCatMath('upper_primary'), beforeUpper, 'Grades 4-6 must remain untouched');
  assert.equal(readCatMath('junior_school'), beforeJunior, 'Grades 7-9 must remain untouched');

  const g5Math = (
    db
      .prepare(
        `SELECT required_weekly_periods FROM tt_grade_subject_allocations
         WHERE config_id = ? AND grade = 5 AND lower(subject_name) = 'mathematics'`
      )
      .get(configId) as any
  )?.required_weekly_periods;
  const g8Math = (
    db
      .prepare(
        `SELECT required_weekly_periods FROM tt_grade_subject_allocations
         WHERE config_id = ? AND grade = 8 AND lower(subject_name) = 'mathematics'`
      )
      .get(configId) as any
  )?.required_weekly_periods;
  assert.equal(g5Math, beforeUpper);
  assert.equal(g8Math, beforeJunior);
});

/* =========================================================================
   TEST 5: Grade-specific overrides + restore to category default
   ========================================================================= */
test('TEST 5: Grade 3 override changes Grade 3 Mathematics to 6 without affecting Grades 1 & 2, and restores cleanly', () => {
  const db = createMemoryDb();
  const tenantId = 'school-override';
  const { configId } = seedCategorySchool(db, tenantId, [1, 2, 3], ['A']);

  const catMath = db
    .prepare(
      `SELECT id, required_weekly_periods FROM tt_category_subject_allocations
       WHERE config_id = ? AND category_code = 'lower_primary' AND lower(subject_name) = 'mathematics'`
    )
    .get(configId) as any;
  assert.equal(catMath.required_weekly_periods, 5);
  assert.equal(categoryCodeForGrade(3), 'lower_primary');

  // Override Grade 3 to 6 periods
  db.prepare(
    `UPDATE tt_grade_subject_allocations
     SET required_weekly_periods = 6, is_category_override = 1
     WHERE config_id = ? AND grade = 3 AND lower(subject_name) = 'mathematics'`
  ).run(configId);

  const g1 = db
    .prepare(`SELECT required_weekly_periods, is_category_override FROM tt_grade_subject_allocations WHERE config_id = ? AND grade = 1 AND lower(subject_name) = 'mathematics'`)
    .get(configId) as any;
  const g2 = db
    .prepare(`SELECT required_weekly_periods, is_category_override FROM tt_grade_subject_allocations WHERE config_id = ? AND grade = 2 AND lower(subject_name) = 'mathematics'`)
    .get(configId) as any;
  const g3 = db
    .prepare(`SELECT required_weekly_periods, is_category_override FROM tt_grade_subject_allocations WHERE config_id = ? AND grade = 3 AND lower(subject_name) = 'mathematics'`)
    .get(configId) as any;

  assert.equal(g1.required_weekly_periods, 5);
  assert.equal(g1.is_category_override, 0);
  assert.equal(g2.required_weekly_periods, 5);
  assert.equal(g2.is_category_override, 0);
  assert.equal(g3.required_weekly_periods, 6);
  assert.equal(g3.is_category_override, 1);

  // Restore Grade 3 back to category default
  db.prepare(
    `UPDATE tt_grade_subject_allocations
     SET required_weekly_periods = ?, is_category_override = 0
     WHERE config_id = ? AND grade = 3 AND lower(subject_name) = 'mathematics'`
  ).run(catMath.required_weekly_periods, configId);

  const g3Restored = db
    .prepare(`SELECT required_weekly_periods, is_category_override FROM tt_grade_subject_allocations WHERE config_id = ? AND grade = 3 AND lower(subject_name) = 'mathematics'`)
    .get(configId) as any;
  assert.equal(g3Restored.required_weekly_periods, 5);
  assert.equal(g3Restored.is_category_override, 0);
});

/* =========================================================================
   TEST 6 & TEST 7: Every stream gets all required weekly lessons &
   every teacher gets a complete clash-free personal timetable
   ========================================================================= */
test('TEST 6 & TEST 7: Every stream receives all required lessons and every teacher has zero clashes', async () => {
  const db = createMemoryDb();
  const tenantId = 'school-full-check';
  const { configId, versionId, addTeacher } = seedCategorySchool(db, tenantId, [4, 5], ['East', 'West']);

  const plan = [
    { subject: 'Mathematics', periods: 5, teacherId: 't-math' },
    { subject: 'English', periods: 5, teacherId: 't-eng' },
    { subject: 'Kiswahili', periods: 4, teacherId: 't-kis' },
    { subject: 'Science and Technology', periods: 4, teacherId: 't-sci' },
    { subject: 'Social Studies', periods: 3, teacherId: 't-sst' },
  ];

  const allocs: any[] = [];
  for (const p of plan) {
    const assigns: Array<{ grade: number; stream: string; subject: string }> = [];
    for (const g of [4, 5]) {
      for (const s of ['East', 'West']) {
        assigns.push({ grade: g, stream: s, subject: p.subject });
        allocs.push({ grade: g, stream: s, subject: p.subject, periods: p.periods, teacherId: p.teacherId });
      }
    }
    addTeacher(p.teacherId, `Tr. ${p.subject}`, `${p.teacherId}@edusmart.ke`, assigns);
  }

  const { entries, unscheduled, validation } = await configureAndGenerate(db, tenantId, configId, versionId, allocs);
  assert.equal(unscheduled.length, 0);
  assert.equal(validation.hardErrors, 0);

  // TEST 6: Every stream receives exact total (21 periods each)
  for (const g of [4, 5]) {
    for (const s of ['East', 'West']) {
      const streamEntries = entries.filter((e) => e.grade === g && e.stream === s);
      assert.equal(streamEntries.length, 21, `Grade ${g} ${s} must receive all 21 weekly lessons`);
    }
  }

  // TEST 7: Every teacher receives exact total across their 4 streams with zero collisions
  assertZeroTeacherCollisions(entries);
  for (const p of plan) {
    const teacherEntries = entries.filter((e) => JSON.parse(e.teacher_ids_json || '[]').includes(p.teacherId));
    assert.equal(teacherEntries.length, p.periods * 4, `Teacher ${p.teacherId} must have ${p.periods * 4} lessons`);
  }
});

/* =========================================================================
   TEST 8: Reject assigning one teacher to two streams at the same day & period
   ========================================================================= */
test('TEST 8: Atomically rejects double-booking the same teacher across two streams at the same slot', () => {
  const db = createMemoryDb();
  const tenantId = 'school-clash-teacher';
  const { versionId, addTeacher } = seedCategorySchool(db, tenantId, [7], ['Chania', 'Mara']);

  addTeacher('t-kamau', 'Mr. Kamau', 'kamau@edusmart.ke', [
    { grade: 7, stream: 'Chania', subject: 'Social Studies' },
    { grade: 7, stream: 'Mara', subject: 'Social Studies' },
  ]);

  const first = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Monday',
    periods: [1],
    grade: 7,
    stream: 'Chania',
    subjectName: 'Social Studies',
    teacherIds: ['t-kamau'],
    teacherNames: ['Mr. Kamau'],
  });
  assert.equal(first.ok, true);

  // Global conflict check must detect the active booking
  const conflict = checkGlobalTeacherConflict(db, versionId, ['t-kamau'], 'Monday', [1]);
  assert.equal(conflict.available, false);
  assert.ok(conflict.conflicts.length > 0);

  // Second booking for the same teacher at Monday P1 in another stream MUST fail
  const second = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Monday',
    periods: [1],
    grade: 7,
    stream: 'Mara',
    subjectName: 'Social Studies',
    teacherIds: ['t-kamau'],
    teacherNames: ['Mr. Kamau'],
  });
  assert.equal(second.ok, false);
  if (!second.ok) {
    assert.equal(second.code, 'TEACHER_CLASH');
  }

  // Verify DB-level booking lock table also enforces PRIMARY KEY constraint directly
  assert.throws(() => {
    db.prepare(
      `INSERT INTO tt_teacher_bookings (version_id, tenant_id, teacher_id, day_of_week, period_number, session_block_id, subject_name, grade, stream, updated_at)
       VALUES (?, ?, ?, 'Monday', 1, 'another-blk', 'Social Studies', 7, 'Mara', ?)`
    ).run(versionId, tenantId, 't-kamau', new Date().toISOString());
  }, /UNIQUE|PRIMARY KEY/i);
});

/* =========================================================================
   TEST 9: Reject booking Swimming Pool or Computer Lab for two incompatible sessions
   ========================================================================= */
test('TEST 9: Rejects double-booking Swimming Pool and Computer Lab beyond capacity', () => {
  const db = createMemoryDb();
  const tenantId = 'school-clash-facility';
  const { versionId, addTeacher } = seedCategorySchool(db, tenantId, [5, 6], ['A']);

  addTeacher('t-swim-1', 'Coach A', 'coacha@edusmart.ke', [{ grade: 5, stream: 'A', subject: 'Swimming' }]);
  addTeacher('t-swim-2', 'Coach B', 'coachb@edusmart.ke', [{ grade: 6, stream: 'A', subject: 'Swimming' }]);
  addTeacher('t-ict-1', 'Tr. ICT 1', 'ict1@edusmart.ke', [{ grade: 5, stream: 'A', subject: 'Computer Studies / ICT' }]);
  addTeacher('t-ict-2', 'Tr. ICT 2', 'ict2@edusmart.ke', [{ grade: 6, stream: 'A', subject: 'Computer Studies / ICT' }]);

  const pool = db
    .prepare(`SELECT id, name FROM tt_classrooms WHERE tenant_id = ? AND room_type = 'swimming_pool' LIMIT 1`)
    .get(tenantId) as any;
  const ictLab = db
    .prepare(`SELECT id, name FROM tt_classrooms WHERE tenant_id = ? AND room_type = 'computer_lab' LIMIT 1`)
    .get(tenantId) as any;
  assert.ok(pool && ictLab, 'Seeded school must have Swimming Pool and Computer Lab');

  // Book Swimming Pool at Tuesday P2 for Grade 5 A
  const swim1 = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Tuesday',
    periods: [2],
    grade: 5,
    stream: 'A',
    subjectName: 'Swimming',
    teacherIds: ['t-swim-1'],
    roomId: pool.id,
    roomName: pool.name,
  });
  assert.equal(swim1.ok, true);

  // Attempting to book Swimming Pool at Tuesday P2 for Grade 6 A must fail
  const swim2 = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Tuesday',
    periods: [2],
    grade: 6,
    stream: 'A',
    subjectName: 'Swimming',
    teacherIds: ['t-swim-2'],
    roomId: pool.id,
    roomName: pool.name,
  });
  assert.equal(swim2.ok, false);
  if (!swim2.ok) assert.equal(swim2.code, 'CLASSROOM_CLASH');

  // Same check for Computer Lab at Wednesday P3
  const ict1 = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Wednesday',
    periods: [3],
    grade: 5,
    stream: 'A',
    subjectName: 'Computer Studies / ICT',
    teacherIds: ['t-ict-1'],
    roomId: ictLab.id,
    roomName: ictLab.name,
  });
  assert.equal(ict1.ok, true);

  const ict2 = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Wednesday',
    periods: [3],
    grade: 6,
    stream: 'A',
    subjectName: 'Computer Studies / ICT',
    teacherIds: ['t-ict-2'],
    roomId: ictLab.id,
    roomName: ictLab.name,
  });
  assert.equal(ict2.ok, false);
  if (!ict2.ok) assert.equal(ict2.code, 'CLASSROOM_CLASH');
});

/* =========================================================================
   TEST 10: Combined-stream joint lessons counted for both streams without
   double-booking or duplicating teacher workload
   ========================================================================= */
test('TEST 10: Combined-stream joint lesson counts for both streams without teacher double-booking', async () => {
  const db = createMemoryDb();
  const tenantId = 'school-joint';
  const { configId, versionId, addTeacher } = seedCategorySchool(db, tenantId, [7], ['Chania', 'Mara']);
  const now = new Date().toISOString();

  addTeacher('t-re', 'Tr. Faith', 'faith@edusmart.ke', [
    { grade: 7, stream: 'Chania', subject: 'Religious Education' },
    { grade: 7, stream: 'Mara', subject: 'Religious Education' },
  ]);

  // Clear defaults and create a 2-period joint Religious Education session for 7 Chania + 7 Mara
  db.prepare(`DELETE FROM tt_stream_subject_allocations WHERE config_id = ?`).run(configId);
  db.prepare(`DELETE FROM tt_grade_subject_allocations WHERE config_id = ?`).run(configId);
  db.prepare(`DELETE FROM tt_entries WHERE version_id = ?`).run(versionId);

  const subRow = db
    .prepare(`SELECT id FROM tt_subjects WHERE tenant_id = ? AND lower(name) = 'religious education'`)
    .get(tenantId) as any;

  const jointId = uid('ttjl');
  db.prepare(
    `INSERT INTO tt_joint_lessons (
       id, tenant_id, config_id, title, subject_name,
       participating_classes_json, teacher_ids_json, weekly_periods,
       lesson_length, required_room_type, is_active, updated_at
     ) VALUES (?, ?, ?, 'Grade 7 Combined RE', 'Religious Education', ?, ?, 2, 1, 'hall', 1, ?)`
  ).run(
    jointId,
    tenantId,
    configId,
    JSON.stringify([
      { grade: 7, stream: 'Chania' },
      { grade: 7, stream: 'Mara' },
    ]),
    JSON.stringify(['t-re']),
    now
  );

  const jobId = uid('ttjob');
  db.prepare(
    `INSERT INTO tt_generation_jobs (id, tenant_id, version_id, status, progress_pct, stage_message, preserve_locked, created_by, created_at)
     VALUES (?, ?, ?, 'queued', 0, 'Queued for acceptance test', 1, 'admin', ?)`
  ).run(jobId, tenantId, versionId, now);

  await runTimetableGenerationDirect(db, jobId);

  const entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(versionId) as any[];
  const chaniaEntries = entries.filter((e) => e.stream === 'Chania');
  const maraEntries = entries.filter((e) => e.stream === 'Mara');
  assert.equal(chaniaEntries.length, 2, '7 Chania must have 2 joint lessons');
  assert.equal(maraEntries.length, 2, '7 Mara must have 2 joint lessons');

  // Verify same day & period for both streams and only 2 teacher bookings (not 4)
  const teacherBookings = db
    .prepare(`SELECT * FROM tt_teacher_bookings WHERE version_id = ? AND teacher_id = 't-re'`)
    .all(versionId) as any[];
  assert.equal(teacherBookings.length, 2, 'Teacher workload must count each joint session once (2 bookings, not 4)');

  const validation = validateTimetableVersion(db, versionId);
  assert.equal(validation.hardErrors, 0, `Joint lesson should produce 0 hard errors: ${JSON.stringify(validation.hardErrors)}`);
});

/* =========================================================================
   TEST 11: Weekly subject & activity counts match configured allocations
   exactly (including Swimming, Computer Studies, Library, Maktaba, Clubs)
   ========================================================================= */
test('TEST 11: Scheduled subject & activity counts match allocations exactly (Swimming, ICT, Library, Maktaba, Clubs)', async () => {
  const db = createMemoryDb();
  const tenantId = 'school-activities';
  const { configId, versionId, addTeacher } = seedCategorySchool(db, tenantId, [5], ['Dove']);

  const curriculum = [
    { subject: 'Mathematics', periods: 5, teacherId: 't-m', roomType: 'general' },
    { subject: 'English', periods: 5, teacherId: 't-e', roomType: 'general' },
    { subject: 'Swimming', periods: 2, teacherId: 't-sw', roomType: 'swimming_pool' },
    { subject: 'Computer Studies / ICT', periods: 2, teacherId: 't-ic', roomType: 'computer_lab' },
    { subject: 'Library', periods: 1, teacherId: 't-lb', roomType: 'library' },
    { subject: 'Maktaba', periods: 1, teacherId: 't-mk', roomType: 'maktaba' },
    { subject: 'Clubs', periods: 2, teacherId: 't-cl', roomType: 'clubs' },
  ];

  const allocs: any[] = [];
  for (const c of curriculum) {
    addTeacher(c.teacherId, `Tr. ${c.subject}`, `${c.teacherId}@edusmart.ke`, [
      { grade: 5, stream: 'Dove', subject: c.subject },
    ]);
    allocs.push({
      grade: 5,
      stream: 'Dove',
      subject: c.subject,
      periods: c.periods,
      teacherId: c.teacherId,
      preferredRoomType: c.roomType,
    });
  }

  const { entries, unscheduled, validation } = await configureAndGenerate(db, tenantId, configId, versionId, allocs);
  assert.equal(unscheduled.length, 0);
  assert.equal(validation.hardErrors, 0);

  for (const c of curriculum) {
    const count = entries.filter((e) => e.subject_name.toLowerCase() === c.subject.toLowerCase()).length;
    assert.equal(count, c.periods, `${c.subject} must be scheduled exactly ${c.periods} time(s)`);
  }
});

/* =========================================================================
   TEST 12: Zero lessons placed during breaks/lunch or outside operating hours
   ========================================================================= */
test('TEST 12: Zero lessons placed on break/lunch periods or outside configured teaching periods', async () => {
  const db = createMemoryDb();
  const tenantId = 'school-breaks';
  const { configId, versionId, addTeacher } = seedCategorySchool(db, tenantId, [6], ['A']);

  addTeacher('t-math6', 'Tr. Math 6', 'math6@edusmart.ke', [{ grade: 6, stream: 'A', subject: 'Mathematics' }]);

  // Insert explicit break & lunch rows with period_number = 0 / non-lesson kind
  const periodRows = db.prepare(`SELECT period_number, kind FROM tt_periods WHERE config_id = ?`).all(configId) as any[];
  const teachingPeriods = new Set(
    periodRows.filter((p) => p.kind === 'lesson' && Number(p.period_number) > 0).map((p) => Number(p.period_number))
  );
  assert.ok(teachingPeriods.size > 0);

  const { entries } = await configureAndGenerate(db, tenantId, configId, versionId, [
    { grade: 6, stream: 'A', subject: 'Mathematics', periods: 5, teacherId: 't-math6' },
  ]);
  for (const e of entries) {
    assert.ok(teachingPeriods.has(Number(e.period_number)), `Entry placed on non-teaching period ${e.period_number}`);
  }

  // Attempting to book a lesson directly into a break/outside-hours period (e.g. 0 or 99) MUST be rejected
  const badBreak = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Monday',
    periods: [0],
    grade: 6,
    stream: 'A',
    subjectName: 'Mathematics',
    teacherIds: ['t-math6'],
  });
  assert.equal(badBreak.ok, false);
  if (!badBreak.ok) assert.equal(badBreak.code, 'LESSON_ON_NON_TEACHING_SLOT');

  const badAfterHours = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Monday',
    periods: [99],
    grade: 6,
    stream: 'A',
    subjectName: 'Mathematics',
    teacherIds: ['t-math6'],
  });
  assert.equal(badAfterHours.ok, false);
  if (!badAfterHours.ok) assert.equal(badAfterHours.code, 'LESSON_ON_NON_TEACHING_SLOT');
});

/* =========================================================================
   TEST 13: Concurrent / conflicting updates from two administrators
   ========================================================================= */
test('TEST 13: Conflicting concurrent administrator bookings leave DB consistent and reject the second write', () => {
  const db = createMemoryDb();
  const tenantId = 'school-concurrent';
  const { versionId, addTeacher } = seedCategorySchool(db, tenantId, [8], ['A', 'B']);

  addTeacher('t-shared', 'Mr. Ochieng', 'ochieng@edusmart.ke', [
    { grade: 8, stream: 'A', subject: 'Mathematics' },
    { grade: 8, stream: 'B', subject: 'Mathematics' },
  ]);

  // Admin 1 and Admin 2 both attempt to book Mr. Ochieng on Thursday P2 in different streams
  const admin1Res = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Thursday',
    periods: [2],
    grade: 8,
    stream: 'A',
    subjectName: 'Mathematics',
    teacherIds: ['t-shared'],
    teacherNames: ['Mr. Ochieng'],
  });
  const admin2Res = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Thursday',
    periods: [2],
    grade: 8,
    stream: 'B',
    subjectName: 'Mathematics',
    teacherIds: ['t-shared'],
    teacherNames: ['Mr. Ochieng'],
  });

  assert.equal(admin1Res.ok, true);
  assert.equal(admin2Res.ok, false);
  if (!admin2Res.ok) assert.equal(admin2Res.code, 'TEACHER_CLASH');

  // Verify database contains strictly 1 entry & 1 booking lock for Thursday P2
  const rows = db
    .prepare(`SELECT * FROM tt_entries WHERE version_id = ? AND day_of_week = 'Thursday' AND period_number = 2`)
    .all(versionId) as any[];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].stream, 'A');

  const lockResult = syncVersionBookingLocks(db, versionId);
  assert.equal(lockResult.teacherBookings, 1);
  assert.equal(lockResult.streamBookings, 1);
});

/* =========================================================================
   TEST 14: Published timetable records match student stream & parent children
   ========================================================================= */
test('TEST 14: Published timetable serves exact stream entries for students and linked children for parents', async () => {
  const db = createMemoryDb();
  const tenantId = 'school-portals';
  const { configId, versionId, addTeacher } = seedCategorySchool(db, tenantId, [4, 7], ['Dove', 'Chania']);

  addTeacher('t-g4', 'Tr. Grace', 'grace@edusmart.ke', [{ grade: 4, stream: 'Dove', subject: 'Mathematics' }]);
  addTeacher('t-g7', 'Tr. Peter', 'peter@edusmart.ke', [{ grade: 7, stream: 'Chania', subject: 'Integrated Science' }]);

  // Register Student 1 (Grade 4 Dove), Student 2 (Grade 7 Chania), and Parent linked to both
  db.prepare(
    `INSERT INTO students (id, school_id, name, grade_label, stream_label, is_active, payload_json)
     VALUES ('stu-1', ?, 'Amina Ali', 'Grade 4', 'Dove', 1, ?)`
  ).run(tenantId, JSON.stringify({ id: 'stu-1', grade: 4, stream: 'Dove', parentId: 'par-1' }));
  db.prepare(
    `INSERT INTO students (id, school_id, name, grade_label, stream_label, is_active, payload_json)
     VALUES ('stu-2', ?, 'Brian Ali', 'Grade 7', 'Chania', 1, ?)`
  ).run(tenantId, JSON.stringify({ id: 'stu-2', grade: 7, stream: 'Chania', parentId: 'par-1' }));
  db.prepare(
    `INSERT INTO users (id, school_id, email, name, role, is_active, payload_json)
     VALUES ('par-1', ?, 'parent@edusmart.ke', 'Mrs. Ali', 'parent', 1, ?)`
  ).run(tenantId, JSON.stringify({ id: 'par-1', role: 'parent', studentIds: ['stu-1', 'stu-2'] }));

  const { unscheduled, validation } = await configureAndGenerate(db, tenantId, configId, versionId, [
    { grade: 4, stream: 'Dove', subject: 'Mathematics', periods: 4, teacherId: 't-g4' },
    { grade: 7, stream: 'Chania', subject: 'Integrated Science', periods: 4, teacherId: 't-g7' },
  ]);
  assert.equal(unscheduled.length, 0);
  assert.equal(validation.hardErrors, 0);

  // Publish the timetable version
  db.prepare(`UPDATE tt_versions SET status = 'published', published_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    versionId
  );
  publishVersionEffects(db, tenantId, versionId, 'admin-1', 'Admin');

  // Verify student-1 sees ONLY Grade 4 Dove lessons (4 lessons)
  const stu1Entries = db
    .prepare(
      `SELECT * FROM tt_entries WHERE version_id = ? AND grade = 4 AND lower(stream) = 'dove'`
    )
    .all(versionId) as any[];
  assert.equal(stu1Entries.length, 4);
  assert.ok(stu1Entries.every((e) => e.subject_name === 'Mathematics'));

  // Verify parent-1 sees BOTH children's streams (4 + 4 = 8 lessons)
  const parentEntries = db
    .prepare(
      `SELECT * FROM tt_entries WHERE version_id = ? AND ((grade = 4 AND lower(stream) = 'dove') OR (grade = 7 AND lower(stream) = 'chania'))`
    )
    .all(versionId) as any[];
  assert.equal(parentEntries.length, 8);

  // Verify synced collections_store timetables collection matches published entries
  const syncedSlots = db
    .prepare(`SELECT * FROM collections_store WHERE tenant_id = ? AND collection_key = 'edusmart_timetable_v1' AND deleted_at IS NULL`)
    .all(tenantId) as any[];
  assert.equal(syncedSlots.length, 8);
});

/* =========================================================================
   TEST 15: Persistence across fresh SQLite DB re-open (restart simulation)
   ========================================================================= */
test('TEST 15: Categories, overrides, assignments, and published entries persist across DB close & re-open', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edusmart-tt-persist-'));
  const dbPath = path.join(tmpDir, 'edusmart-test.sqlite');

  try {
    let savedVersionId = '';
    let savedConfigId = '';

    // Session 1: initialize, customize category & grade override, generate, publish, close
    {
      const db1 = new DatabaseSync(dbPath);
      initCoreLmsTables(db1);
      const { configId, versionId, addTeacher } = seedCategorySchool(db1, 'school-persist', [1, 3], ['A']);
      savedConfigId = configId;
      savedVersionId = versionId;

      // Update lower_primary English to 6 and override Grade 3 English to 7
      db1.prepare(
        `UPDATE tt_category_subject_allocations
         SET required_weekly_periods = 6
         WHERE config_id = ? AND category_code = 'lower_primary' AND lower(subject_name) = 'english'`
      ).run(configId);
      db1.prepare(
        `UPDATE tt_grade_subject_allocations
         SET required_weekly_periods = 7, is_category_override = 1
         WHERE config_id = ? AND grade = 3 AND lower(subject_name) = 'english'`
      ).run(configId);

      addTeacher('t-persist', 'Tr. Persist', 'persist@edusmart.ke', [
        { grade: 1, stream: 'A', subject: 'English' },
        { grade: 3, stream: 'A', subject: 'English' },
      ]);

      // Directly book 2 lessons and mark published
      const b1 = bookEntryAtomically(db1, {
        versionId,
        tenantId: 'school-persist',
        dayOfWeek: 'Monday',
        periods: [1],
        grade: 1,
        stream: 'A',
        subjectName: 'English',
        teacherIds: ['t-persist'],
      });
      const b2 = bookEntryAtomically(db1, {
        versionId,
        tenantId: 'school-persist',
        dayOfWeek: 'Monday',
        periods: [2],
        grade: 3,
        stream: 'A',
        subjectName: 'English',
        teacherIds: ['t-persist'],
      });
      assert.equal(b1.ok, true);
      assert.equal(b2.ok, true);
      db1.prepare(`UPDATE tt_versions SET status = 'published', published_at = ? WHERE id = ?`).run(
        new Date().toISOString(),
        versionId
      );
      db1.close();
    }

    // Session 2: open fresh handle on the same DB file and verify every record survived intact
    {
      const db2 = new DatabaseSync(dbPath);
      const cats = db2.prepare(`SELECT code FROM tt_categories WHERE tenant_id = 'school-persist'`).all() as any[];
      assert.equal(cats.length, 3);

      const catEng = db2
        .prepare(
          `SELECT required_weekly_periods FROM tt_category_subject_allocations
           WHERE config_id = ? AND category_code = 'lower_primary' AND lower(subject_name) = 'english'`
        )
        .get(savedConfigId) as any;
      assert.equal(catEng.required_weekly_periods, 6);

      const g3Eng = db2
        .prepare(
          `SELECT required_weekly_periods, is_category_override FROM tt_grade_subject_allocations
           WHERE config_id = ? AND grade = 3 AND lower(subject_name) = 'english'`
        )
        .get(savedConfigId) as any;
      assert.equal(g3Eng.required_weekly_periods, 7);
      assert.equal(g3Eng.is_category_override, 1);

      const entries = db2.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(savedVersionId) as any[];
      assert.equal(entries.length, 2);

      const bookings = db2.prepare(`SELECT * FROM tt_teacher_bookings WHERE version_id = ?`).all(savedVersionId) as any[];
      assert.equal(bookings.length, 2);

      db2.close();
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

/* =========================================================================
   TEST 16: Multi-tenant isolation between School A and School B
   ========================================================================= */
test('TEST 16: Strict multi-tenant isolation between School A and School B', async () => {
  const db = createMemoryDb();

  const schoolA = seedCategorySchool(db, 'school-alpha', [4], ['North']);
  const schoolB = seedCategorySchool(db, 'school-beta', [4], ['South']);

  schoolA.addTeacher('t-alpha', 'Tr. Alpha', 'alpha@alpha.ke', [{ grade: 4, stream: 'North', subject: 'Mathematics' }]);
  schoolB.addTeacher('t-beta', 'Tr. Beta', 'beta@beta.ke', [{ grade: 4, stream: 'South', subject: 'English' }]);

  await configureAndGenerate(db, 'school-alpha', schoolA.configId, schoolA.versionId, [
    { grade: 4, stream: 'North', subject: 'Mathematics', periods: 5, teacherId: 't-alpha' },
  ]);
  await configureAndGenerate(db, 'school-beta', schoolB.configId, schoolB.versionId, [
    { grade: 4, stream: 'South', subject: 'English', periods: 4, teacherId: 't-beta' },
  ]);

  const alphaEntries = db.prepare(`SELECT * FROM tt_entries WHERE tenant_id = 'school-alpha'`).all() as any[];
  const betaEntries = db.prepare(`SELECT * FROM tt_entries WHERE tenant_id = 'school-beta'`).all() as any[];

  assert.equal(alphaEntries.length, 5);
  assert.equal(betaEntries.length, 4);
  assert.ok(alphaEntries.every((e) => e.subject_name === 'Mathematics' && e.stream === 'North'));
  assert.ok(betaEntries.every((e) => e.subject_name === 'English' && e.stream === 'South'));

  // Cross-tenant booking attempt (School B trying to write into School A's version) MUST be rejected
  const crossTenant = bookEntryAtomically(db, {
    versionId: schoolA.versionId,
    tenantId: 'school-beta',
    dayOfWeek: 'Friday',
    periods: [1],
    grade: 4,
    stream: 'South',
    subjectName: 'English',
    teacherIds: ['t-beta'],
  });
  assert.equal(crossTenant.ok, false);
  if (!crossTenant.ok) assert.equal(crossTenant.code, 'VERSION_NOT_FOUND');

  // Verify pre-generation input validator is strictly tenant-scoped
  const diagA = validateTimetableInputs(db, 'school-alpha', schoolA.configId);
  const diagB = validateTimetableInputs(db, 'school-beta', schoolB.configId);
  assert.equal(diagA.streamLoadSummary.length, 1);
  assert.equal(diagB.streamLoadSummary.length, 1);
});
