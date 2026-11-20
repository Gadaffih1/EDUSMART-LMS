import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { initTimetableSchema } from '../src/server/timetableSchema.ts';
import {
  bookEntryAtomically,
  checkTeacherAssignmentScope,
  ensureTenantTimetableSeeded,
  loadTenantTeacherScopes,
  runTimetableGenerationDirect,
  uid,
  validateSingleMoveCandidate,
  validateTimetableVersion,
} from '../src/server/timetableEngine.ts';

function createStrictScopeTestDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
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
    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade_number INTEGER,
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
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade_label TEXT,
      stream_label TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
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
  `);
  initTimetableSchema(db);
  return db;
}

async function runSolver(db: DatabaseSync, tenantId: string, versionId: string) {
  const jobId = uid('ttjob');
  db.prepare(
    `INSERT INTO tt_generation_jobs
       (id, tenant_id, version_id, status, progress_pct, stage_message, preserve_locked, retries, cancel_requested, diagnostics_json, created_by, created_at)
     VALUES (?, ?, ?, 'queued', 0, 'Queued', 1, 0, 0, '{}', 'admin', ?)`
  ).run(jobId, tenantId, versionId, new Date().toISOString());
  await runTimetableGenerationDirect(db, jobId);
  return db.prepare(`SELECT * FROM tt_generation_jobs WHERE id = ?`).get(jobId) as any;
}

test('1. Seeding NEVER invents default subjects or round-robins teachers onto unassigned streams', () => {
  const db = createStrictScopeTestDb();
  const tenantId = 'school-strict-seed';

  db.prepare(`INSERT INTO grades (id, school_id, name, grade_number, is_active) VALUES (?, ?, ?, ?, 1)`).run('g4', tenantId, 'Grade 4', 4);
  db.prepare(`INSERT INTO streams (id, school_id, grade_id, name, is_active) VALUES (?, ?, ?, ?, 1)`).run('s4-dove', tenantId, 'g4', 'Dove');
  db.prepare(`INSERT INTO streams (id, school_id, grade_id, name, is_active) VALUES (?, ?, ?, ?, 1)`).run('s4-eagle', tenantId, 'g4', 'Eagle');

  db.prepare(`INSERT INTO school_grades (id, school_id, name) VALUES (?, ?, ?)`).run('g4', tenantId, 'Grade 4');
  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, ?, ?, ?)`).run('s4-dove', tenantId, 'g4', 'Dove', '4 Dove');
  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, ?, ?, ?)`).run('s4-eagle', tenantId, 'g4', 'Eagle', '4 Eagle');

  // Teacher A is ONLY assigned to Grade 4 Dove Mathematics. Teacher B has NO assignments at all.
  db.prepare(`INSERT INTO users (id, school_id, email, name, role, is_active, payload_json) VALUES (?, ?, ?, ?, 'teacher', 1, ?)`).run(
    'u-math-only',
    tenantId,
    'math@strict.ke',
    'Mr. Ochieng',
    JSON.stringify({
      department: 'Mathematics',
      assignedSubjectAllocations: [{ grade: 4, stream: 'Dove', subject: 'Mathematics', periodsPerWeek: 5 }],
      assignedSubjects: ['Mathematics'],
    })
  );
  db.prepare(`INSERT INTO users (id, school_id, email, name, role, is_active, payload_json) VALUES (?, ?, ?, ?, 'teacher', 1, ?)`).run(
    'u-unassigned',
    tenantId,
    'newstaff@strict.ke',
    'Ms. Wambui',
    JSON.stringify({ department: 'General' })
  );
  db.prepare(
    `INSERT INTO grade_teacher_assignments (id, school_id, grade_id, stream_id, teacher_id, teacher_name, subject_name, periods_per_week, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 5, 1)`
  ).run('gta-1', tenantId, 'g4', 's4-dove', 'u-math-only', 'Mr. Ochieng', 'Mathematics');

  const { configId } = ensureTenantTimetableSeeded(db, tenantId, 'admin');

  // Check qualified_subjects_json: Mr. Ochieng ONLY has Mathematics; Ms. Wambui has [] (never 6 fabricated subjects!)
  const tpMath = db.prepare(`SELECT * FROM tt_teacher_profiles WHERE tenant_id = ? AND user_id = 'u-math-only'`).get(tenantId) as any;
  const tpNew = db.prepare(`SELECT * FROM tt_teacher_profiles WHERE tenant_id = ? AND user_id = 'u-unassigned'`).get(tenantId) as any;
  assert.deepEqual(JSON.parse(tpMath.qualified_subjects_json), ['Mathematics']);
  assert.deepEqual(JSON.parse(tpNew.qualified_subjects_json), []);

  // Check seeded stream allocations: ONLY Grade 4 Dove Mathematics has Mr. Ochieng; Grade 4 Eagle Mathematics and Grade 4 Dove English MUST have []
  const doveMath = db.prepare(`SELECT teacher_ids_json FROM tt_stream_subject_allocations WHERE config_id = ? AND grade = 4 AND stream = 'Dove' AND subject_name = 'Mathematics'`).get(configId) as any;
  const eagleMath = db.prepare(`SELECT teacher_ids_json FROM tt_stream_subject_allocations WHERE config_id = ? AND grade = 4 AND stream = 'Eagle' AND subject_name = 'Mathematics'`).get(configId) as any;
  const doveEng = db.prepare(`SELECT teacher_ids_json FROM tt_stream_subject_allocations WHERE config_id = ? AND grade = 4 AND stream = 'Dove' AND subject_name = 'English'`).get(configId) as any;

  assert.deepEqual(JSON.parse(doveMath.teacher_ids_json), [tpMath.id]);
  assert.deepEqual(JSON.parse(eagleMath.teacher_ids_json), []);
  assert.deepEqual(JSON.parse(doveEng.teacher_ids_json), []);
});

test('2. Solver strictly places ONLY exact (teacher, subject, grade, stream) assignments and refuses unassigned or out-of-scope lessons', async () => {
  const db = createStrictScopeTestDb();
  const tenantId = 'school-strict-solver';

  db.prepare(`INSERT INTO grades (id, school_id, name, grade_number, is_active) VALUES (?, ?, ?, ?, 1)`).run('g4', tenantId, 'Grade 4', 4);
  db.prepare(`INSERT INTO streams (id, school_id, grade_id, name, is_active) VALUES (?, ?, ?, ?, 1)`).run('s4-dove', tenantId, 'g4', 'Dove');
  db.prepare(`INSERT INTO streams (id, school_id, grade_id, name, is_active) VALUES (?, ?, ?, ?, 1)`).run('s4-eagle', tenantId, 'g4', 'Eagle');

  db.prepare(`INSERT INTO school_grades (id, school_id, name) VALUES (?, ?, ?)`).run('g4', tenantId, 'Grade 4');
  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, ?, ?, ?)`).run('s4-dove', tenantId, 'g4', 'Dove', '4 Dove');
  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, ?, ?, ?)`).run('s4-eagle', tenantId, 'g4', 'Eagle', '4 Eagle');

  db.prepare(`INSERT INTO users (id, school_id, email, name, role, is_active, payload_json) VALUES (?, ?, ?, ?, 'teacher', 1, ?)`).run(
    'u-kamau',
    tenantId,
    'kamau@strict.ke',
    'Mr. Kamau',
    JSON.stringify({
      assignedSubjectAllocations: [{ grade: 4, stream: 'Dove', subject: 'Mathematics', periodsPerWeek: 3 }],
      assignedSubjects: ['Mathematics'],
    })
  );
  db.prepare(
    `INSERT INTO grade_teacher_assignments (id, school_id, grade_id, stream_id, teacher_id, teacher_name, subject_name, periods_per_week, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 3, 1)`
  ).run('gta-kamau', tenantId, 'g4', 's4-dove', 'u-kamau', 'Mr. Kamau', 'Mathematics');

  const { configId } = ensureTenantTimetableSeeded(db, tenantId, 'admin');
  const cfg = db.prepare(`SELECT active_version_id FROM tt_configs WHERE id = ?`).get(configId) as any;
  const versionId = String(cfg.active_version_id);
  const tpKamau = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? AND user_id = 'u-kamau'`).get(tenantId) as any;

  // Replace stream allocations with:
  // (a) Valid exact assignment: Grade 4 Dove · Mathematics -> Mr. Kamau (3p)
  // (b) Wrong stream violation: Grade 4 Eagle · Mathematics -> Mr. Kamau (2p) — NOT assigned to Eagle!
  // (c) Wrong subject violation: Grade 4 Dove · English -> Mr. Kamau (2p) — NOT assigned to English!
  // (d) Unassigned lesson: Grade 4 Eagle · Kiswahili -> [] (2p) — NO teacher assigned!
  db.prepare(`DELETE FROM tt_stream_subject_allocations WHERE config_id = ?`).run(configId);
  const now = new Date().toISOString();
  const insAlloc = db.prepare(
    `INSERT INTO tt_stream_subject_allocations
       (id, tenant_id, config_id, grade, stream, subject_name, is_overridden, required_weekly_periods, single_lessons, double_lessons, triple_lessons, pattern_preference, max_per_day, min_spacing_days, preferred_days_json, preferred_periods_json, required_room_type, teacher_ids_json, is_active, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 0, 0, 'spread', 1, 0, '[]', '[]', 'general', ?, 1, ?)`
  );
  insAlloc.run(uid('ttsa'), tenantId, configId, 4, 'Dove', 'Mathematics', 3, 3, JSON.stringify([tpKamau.id]), now);
  insAlloc.run(uid('ttsa'), tenantId, configId, 4, 'Eagle', 'Mathematics', 2, 2, JSON.stringify([tpKamau.id]), now);
  insAlloc.run(uid('ttsa'), tenantId, configId, 4, 'Dove', 'English', 2, 2, JSON.stringify([tpKamau.id]), now);
  insAlloc.run(uid('ttsa'), tenantId, configId, 4, 'Eagle', 'Kiswahili', 2, 2, '[]', now);

  await runSolver(db, tenantId, versionId);

  const entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(versionId) as any[];
  const unscheduled = db.prepare(`SELECT * FROM tt_unscheduled_sessions WHERE version_id = ?`).all(versionId) as any[];

  // ONLY the 3 valid Grade 4 Dove Mathematics lessons may appear on the timetable
  assert.equal(entries.length, 3);
  for (const e of entries) {
    assert.equal(Number(e.grade), 4);
    assert.equal(String(e.stream), 'Dove');
    assert.equal(String(e.subject_name), 'Mathematics');
    assert.deepEqual(JSON.parse(e.teacher_ids_json), [tpKamau.id]);
  }

  // All 6 invalid/unassigned sessions MUST remain unscheduled (2 wrong-stream + 2 wrong-subject + 2 unassigned)
  assert.equal(unscheduled.length, 6);
  assert.ok(unscheduled.some((u) => u.stream === 'Eagle' && u.subject_name === 'Mathematics'));
  assert.ok(unscheduled.some((u) => u.stream === 'Dove' && u.subject_name === 'English'));
  assert.ok(unscheduled.some((u) => u.stream === 'Eagle' && u.subject_name === 'Kiswahili'));

  // Validation MUST block approval due to unscheduled & out-of-scope allocations
  const validation = validateTimetableVersion(db, versionId);
  assert.equal(validation.canApprove, false);
  assert.ok(validation.hardErrors > 0);
});

test('3. Validator & Manual Move Candidate reject any unauthorized teacher entry on tt_entries', () => {
  const db = createStrictScopeTestDb();
  const tenantId = 'school-strict-validator';

  db.prepare(`INSERT INTO grades (id, school_id, name, grade_number, is_active) VALUES (?, ?, ?, ?, 1)`).run('g7', tenantId, 'Grade 7', 7);
  db.prepare(`INSERT INTO streams (id, school_id, grade_id, name, is_active) VALUES (?, ?, ?, ?, 1)`).run('s7-chania', tenantId, 'g7', 'Chania');
  db.prepare(`INSERT INTO school_grades (id, school_id, name) VALUES (?, ?, ?)`).run('g7', tenantId, 'Grade 7');
  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, ?, ?, ?)`).run('s7-chania', tenantId, 'g7', 'Chania', '7 Chania');

  db.prepare(`INSERT INTO users (id, school_id, email, name, role, is_active, payload_json) VALUES (?, ?, ?, ?, 'teacher', 1, ?)`).run(
    'u-french',
    tenantId,
    'french@strict.ke',
    'Mme. Njeri',
    JSON.stringify({
      assignedSubjectAllocations: [{ grade: 7, stream: 'Chania', subject: 'French', periodsPerWeek: 2 }],
      assignedSubjects: ['French'],
    })
  );
  db.prepare(
    `INSERT INTO grade_teacher_assignments (id, school_id, grade_id, stream_id, teacher_id, teacher_name, subject_name, periods_per_week, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 2, 1)`
  ).run('gta-fr', tenantId, 'g7', 's7-chania', 'u-french', 'Mme. Njeri', 'French');

  const { configId } = ensureTenantTimetableSeeded(db, tenantId, 'admin');
  const cfg = db.prepare(`SELECT active_version_id FROM tt_configs WHERE id = ?`).get(configId) as any;
  const versionId = String(cfg.active_version_id);
  const tpFrench = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? AND user_id = 'u-french'`).get(tenantId) as any;

  // Scope check API directly verifies allowed vs forbidden tuples
  const scopes = loadTenantTeacherScopes(db, tenantId);
  assert.equal(checkTeacherAssignmentScope(scopes, tpFrench.id, 7, 'Chania', 'French').ok, true);
  assert.equal(checkTeacherAssignmentScope(scopes, tpFrench.id, 7, 'Chania', 'Mathematics').ok, false);
  assert.equal(checkTeacherAssignmentScope(scopes, tpFrench.id, 7, 'Chania', 'Mathematics').code, 'TEACHER_SUBJECT_NOT_ASSIGNED');
  assert.equal(checkTeacherAssignmentScope(scopes, tpFrench.id, 7, 'Mara', 'French').ok, false);
  assert.equal(checkTeacherAssignmentScope(scopes, tpFrench.id, 7, 'Mara', 'French').code, 'TEACHER_SCOPE_VIOLATION');

  // Inject an unauthorized Mathematics entry for Mme. Njeri into tt_entries
  const badBlockId = uid('ttblk');
  db.prepare(
    `INSERT INTO tt_entries
       (id, version_id, tenant_id, day_of_week, period_number, grade, stream, stream_label, group_name, subject_name, teacher_ids_json, teacher_names_json, room_name, session_block_id, block_length, block_index, is_locked, updated_at)
     VALUES (?, ?, ?, 'Monday', 1, 7, 'Chania', 'Grade 7 Chania', 'Whole Class', 'Mathematics', ?, ?, 'Room 7A', ?, 1, 0, 0, ?)`
  ).run(uid('ttent'), versionId, tenantId, JSON.stringify([tpFrench.id]), JSON.stringify(['Mme. Njeri']), badBlockId, new Date().toISOString());

  const validation = validateTimetableVersion(db, versionId);
  assert.equal(validation.canApprove, false);
  assert.ok(
    validation.conflicts.some((c) => c.conflictType === 'TEACHER_SUBJECT_NOT_ASSIGNED'),
    'Expected TEACHER_SUBJECT_NOT_ASSIGNED conflict for Mme. Njeri teaching Mathematics'
  );

  const moveCheck = validateSingleMoveCandidate(db, versionId, badBlockId, 'Tuesday', 2);
  assert.equal(moveCheck.valid, false);
  assert.ok(moveCheck.hardConflicts.some((m) => m.includes('not assigned to teach Mathematics')));
});

test('4. Database-backed bookEntryAtomically strictly blocks unassigned subjects, grades, and streams', () => {
  const db = createStrictScopeTestDb();
  const tenantId = 'tenant-atomic-scope';
  db.prepare(`INSERT INTO school_grades (id, school_id, name) VALUES (?, ?, 'Grade 4')`).run('g4', tenantId);
  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, 'g4', 'Dove', '4 Dove')`).run('s4d', tenantId);
  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, 'g4', 'Eagle', '4 Eagle')`).run('s4e', tenantId);
  db.prepare(`INSERT INTO grades (id, school_id, name, grade_number, is_active) VALUES ('g4', ?, 'Grade 4', 4, 1)`).run(tenantId);
  db.prepare(`INSERT INTO streams (id, school_id, grade_id, name, is_active) VALUES ('s4d', ?, 'g4', 'Dove', 1)`).run(tenantId);
  db.prepare(`INSERT INTO streams (id, school_id, grade_id, name, is_active) VALUES ('s4e', ?, 'g4', 'Eagle', 1)`).run(tenantId);
  db.prepare(
    `INSERT INTO users (id, school_id, email, name, role, is_active, payload_json)
     VALUES ('t1', ?, 'otieno@school.ke', 'Mr. Otieno', 'teacher', 1, ?)`
  ).run(tenantId, JSON.stringify({ id: 't1', name: 'Mr. Otieno', role: 'teacher' }));
  db.prepare(
    `INSERT INTO grade_teacher_assignments (id, school_id, grade_id, stream_id, teacher_id, teacher_name, subject_name, periods_per_week, is_active)
     VALUES ('gta-1', ?, 'g4', 's4d', 't1', 'Mr. Otieno', 'Mathematics', 4, 1)`
  ).run(tenantId);

  const { configId } = ensureTenantTimetableSeeded(db, tenantId);
  const versionId = String(
    (db.prepare(`SELECT id FROM tt_versions WHERE config_id = ? LIMIT 1`).get(configId) as any).id
  );
  const tProfile = db
    .prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? AND user_id = 't1' LIMIT 1`)
    .get(tenantId) as any;
  const teacherId = String(tProfile?.id || 't1');

  // Valid scoped booking succeeds
  const validBooking = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Monday',
    periods: [1],
    grade: 4,
    stream: 'Dove',
    subjectName: 'Mathematics',
    teacherIds: [teacherId],
    teacherNames: ['Mr. Otieno'],
  });
  assert.equal(validBooking.ok, true, `Expected valid scoped booking to succeed, got: ${JSON.stringify(validBooking)}`);

  // Wrong stream for Mr. Otieno is strictly rejected
  const wrongStream = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Monday',
    periods: [2],
    grade: 4,
    stream: 'Eagle',
    subjectName: 'Mathematics',
    teacherIds: [teacherId],
    teacherNames: ['Mr. Otieno'],
  });
  assert.equal(wrongStream.ok, false);
  if (!wrongStream.ok) assert.ok(wrongStream.code.includes('SCOPE') || wrongStream.error.includes('not assigned'));

  // Wrong subject for Mr. Otieno is strictly rejected
  const wrongSubject = bookEntryAtomically(db, {
    versionId,
    tenantId,
    dayOfWeek: 'Monday',
    periods: [3],
    grade: 4,
    stream: 'Dove',
    subjectName: 'Kiswahili',
    teacherIds: [teacherId],
    teacherNames: ['Mr. Otieno'],
  });
  assert.equal(wrongSubject.ok, false);
  if (!wrongSubject.ok) assert.ok(wrongSubject.code.includes('SCOPE') || wrongSubject.error.includes('not assigned'));
});
