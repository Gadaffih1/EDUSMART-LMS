import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { initTimetableSchema } from '../src/server/timetableSchema.ts';
import {
  ensureTenantTimetableSeeded,
  publishVersionEffects,
  runTimetableGenerationDirect,
  uid,
  validateSingleMoveCandidate,
  validateTimetableVersion,
} from '../src/server/timetableEngine.ts';

/**
 * Create an isolated in-memory SQLite database replicating core EduSmart LMS tables
 * plus all additive timetable schema migrations.
 */
function createTestDb(): DatabaseSync {
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
    CREATE TABLE IF NOT EXISTS grade_teacher_assignments (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      teacher_user_id TEXT NOT NULL,
      grade_id TEXT NOT NULL,
      stream_id TEXT,
      subject TEXT
    );
  `);

  initTimetableSchema(db);
  return db;
}

function seedMinimalSchool(db: DatabaseSync, tenantId: string) {
  db.prepare(`INSERT INTO school_grades (id, school_id, name) VALUES (?, ?, ?)`).run(`${tenantId}-g4`, tenantId, 'Grade 4');
  db.prepare(`INSERT INTO school_grades (id, school_id, name) VALUES (?, ?, ?)`).run(`${tenantId}-g7`, tenantId, 'Grade 7');

  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, ?, ?, ?)`).run(`${tenantId}-s4d`, tenantId, `${tenantId}-g4`, 'Dove', '4 Dove');
  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, ?, ?, ?)`).run(`${tenantId}-s4e`, tenantId, `${tenantId}-g4`, 'Eagle', '4 Eagle');
  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, ?, ?, ?)`).run(`${tenantId}-s7c`, tenantId, `${tenantId}-g7`, 'Chania', '7 Chania');
  db.prepare(`INSERT INTO school_streams (id, school_id, grade_id, name, display_name) VALUES (?, ?, ?, ?, ?)`).run(`${tenantId}-s7m`, tenantId, `${tenantId}-g7`, 'Mara', '7 Mara');

  const teachers = [
    { id: `${tenantId}-u1`, email: `kamau@${tenantId}.ke`, name: 'Mr. Kamau', dept: 'Sciences' },
    { id: `${tenantId}-u2`, email: `wanjiku@${tenantId}.ke`, name: 'Ms. Wanjiku', dept: 'Languages' },
    { id: `${tenantId}-u3`, email: `otieno@${tenantId}.ke`, name: 'Mr. Otieno', dept: 'Mathematics' },
    { id: `${tenantId}-u4`, email: `akinyi@${tenantId}.ke`, name: 'Ms. Akinyi', dept: 'ICT & Library' },
    { id: `${tenantId}-u5`, email: `mutua@${tenantId}.ke`, name: 'Mr. Mutua', dept: 'Sports & Swimming' },
    { id: `${tenantId}-u6`, email: `njeri@${tenantId}.ke`, name: 'Ms. Njeri', dept: 'Humanities' },
  ];
  for (const t of teachers) {
    db.prepare(`INSERT INTO users (id, school_id, email, name, role, is_active, payload_json) VALUES (?, ?, ?, ?, 'teacher', 1, ?)`).run(
      t.id,
      tenantId,
      t.email,
      t.name,
      JSON.stringify({ department: t.dept })
    );
  }
  db.prepare(`INSERT INTO students (id, school_id, name, grade_label, stream_label, is_active) VALUES (?, ?, ?, ?, ?, 1)`).run(
    `${tenantId}-st1`,
    tenantId,
    'Amina Hassan',
    'Grade 4',
    'Dove'
  );
  db.prepare(`INSERT INTO students (id, school_id, name, grade_label, stream_label, is_active) VALUES (?, ?, ?, ?, ?, 1)`).run(
    `${tenantId}-st2`,
    tenantId,
    'Brian Kipchoge',
    'Grade 7',
    'Chania'
  );

  const { configId } = ensureTenantTimetableSeeded(db, tenantId, `${tenantId}-u1`);
  const cfg = db.prepare(`SELECT active_version_id FROM tt_configs WHERE id = ?`).get(configId) as any;
  const versionId = String(cfg?.active_version_id || '');
  return { configId, versionId };
}

function clearStreamAllocations(db: DatabaseSync, configId: string) {
  db.prepare(`DELETE FROM tt_stream_subject_allocations WHERE config_id = ?`).run(configId);
  db.prepare(`DELETE FROM tt_joint_lessons WHERE config_id = ?`).run(configId);
}

function addStreamAlloc(
  db: DatabaseSync,
  tenantId: string,
  configId: string,
  opts: {
    grade: number;
    stream: string;
    subject: string;
    weekly: number;
    singles?: number;
    doubles?: number;
    triples?: number;
    roomType?: string;
    teacherIds: string[];
    maxPerDay?: number;
  }
) {
  const singles = opts.singles ?? (opts.weekly - (opts.doubles || 0) * 2 - (opts.triples || 0) * 3);
  const doubles = opts.doubles ?? 0;
  const triples = opts.triples ?? 0;
  const maxPerDay = opts.maxPerDay ?? Math.max(1, triples > 0 ? 3 : doubles > 0 ? 2 : 1);
  db.prepare(
    `INSERT INTO tt_stream_subject_allocations
       (id, tenant_id, config_id, grade, stream, subject_name, is_overridden, required_weekly_periods, single_lessons, double_lessons, triple_lessons, pattern_preference, max_per_day, min_spacing_days, preferred_days_json, preferred_periods_json, required_room_type, teacher_ids_json, is_active, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 'spread', ?, 0, '[]', '[]', ?, ?, 1, ?)`
  ).run(
    uid('ttsa'),
    tenantId,
    configId,
    opts.grade,
    opts.stream,
    opts.subject,
    opts.weekly,
    singles,
    doubles,
    triples,
    maxPerDay,
    opts.roomType || 'general',
    JSON.stringify(opts.teacherIds),
    new Date().toISOString()
  );
}

function runSolver(db: DatabaseSync, tenantId: string, versionId: string, preserveLocked = false, scope?: any) {
  const jobId = uid('ttjob');
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO tt_generation_jobs
       (id, tenant_id, version_id, status, progress_pct, stage_message, preserve_locked, scope_json, cancel_requested, retries, diagnostics_json, created_by, created_at)
     VALUES (?, ?, ?, 'queued', 0, 'Test queued', ?, ?, 0, 0, '{}', 'test-runner', ?)`
  ).run(jobId, tenantId, versionId, preserveLocked ? 1 : 0, JSON.stringify(scope || { mode: 'all' }), now);
  runTimetableGenerationDirect(db, jobId);
  return db.prepare(`SELECT * FROM tt_generation_jobs WHERE id = ?`).get(jobId) as any;
}

// ---------------------------------------------------------------------------
// PART 11: ALL 20 MANDATORY VERIFICATION SCENARIOS
// ---------------------------------------------------------------------------

test('1 & 2. Overlapping teacher assignment prevented & single teacher cannot teach 2 streams simultaneously (unless joint)', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t1';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teacher = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? LIMIT 1`).get(tenantId) as any;

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Mathematics', weekly: 5, teacherIds: [teacher.id] });
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Eagle', subject: 'Mathematics', weekly: 5, teacherIds: [teacher.id] });

  runSolver(db, tenantId, versionId);
  const entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(versionId) as any[];
  assert.equal(entries.length, 10, 'All 10 lessons placed across both streams');

  // Verify zero teacher overlaps
  const seen = new Set<string>();
  for (const e of entries) {
    const key = `${e.day_of_week}|${e.period_number}`;
    assert.equal(seen.has(key), false, `Teacher double-booked at ${key}`);
    seen.add(key);
  }

  const val = validateTimetableVersion(db, versionId);
  assert.equal(val.hardErrors, 0);
});

test('3. Stream cannot attend two lessons simultaneously (enforced by solver & independent validator)', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t3';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teachers = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[];

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Mathematics', weekly: 5, teacherIds: [teachers[0].id] });
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'English', weekly: 5, teacherIds: [teachers[1].id] });
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Kiswahili', weekly: 4, teacherIds: [teachers[2].id] });

  runSolver(db, tenantId, versionId);
  const entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(versionId) as any[];
  assert.equal(entries.length, 14);

  const slotKeys = new Set<string>();
  for (const e of entries) {
    const k = `${e.grade}|${e.stream}|${e.day_of_week}|${e.period_number}`;
    assert.equal(slotKeys.has(k), false, `Stream overlap at ${k}`);
    slotKeys.add(k);
  }

  // Inject an artificial class clash and confirm validator flags CLASS_CLASH
  const first = entries[0];
  db.prepare(
    `INSERT INTO tt_entries (id, version_id, tenant_id, day_of_week, period_number, grade, stream, stream_label, group_name, subject_name, teacher_ids_json, teacher_names_json, room_name, session_block_id, block_length, block_index, is_locked, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Whole Class', 'Music', ?, '["Ms. Njeri"]', 'Room 1', ?, 1, 0, 0, ?)`
  ).run(uid('ttent'), versionId, tenantId, first.day_of_week, first.period_number, first.grade, first.stream, first.stream_label, JSON.stringify([teachers[5].id]), uid('blk'), new Date().toISOString());

  const val = validateTimetableVersion(db, versionId);
  assert.ok(val.conflicts.some((c) => c.conflictType === 'CLASS_CLASH'), 'Validator detects CLASS_CLASH');
});

test('4. Swimming pool capacity (max_concurrent_classes = 1) strictly enforced across multiple streams', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t4';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teachers = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[];

  const pool = db.prepare(`SELECT * FROM tt_classrooms WHERE tenant_id = ? AND room_type = 'swimming_pool' LIMIT 1`).get(tenantId) as any;
  assert.ok(pool, 'Swimming Pool seeded automatically');
  assert.equal(Number(pool.max_concurrent_classes || 1), 1);

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Swimming', weekly: 3, triples: 1, roomType: 'swimming_pool', teacherIds: [teachers[0].id] });
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Eagle', subject: 'Swimming', weekly: 3, triples: 1, roomType: 'swimming_pool', teacherIds: [teachers[1].id] });
  addStreamAlloc(db, tenantId, configId, { grade: 7, stream: 'Chania', subject: 'Swimming', weekly: 3, triples: 1, roomType: 'swimming_pool', teacherIds: [teachers[2].id] });

  runSolver(db, tenantId, versionId);
  const poolEntries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ? AND room_id = ?`).all(versionId, pool.id) as any[];
  assert.equal(poolEntries.length, 9, 'All 3 streams scheduled for 3-period Swimming in pool');

  // Verify pool never hosts > 1 class simultaneously
  const poolSlots = new Set<string>();
  for (const e of poolEntries) {
    const k = `${e.day_of_week}|${e.period_number}`;
    assert.equal(poolSlots.has(k), false, `Swimming Pool double-booked at ${k}`);
    poolSlots.add(k);
  }
  const val = validateTimetableVersion(db, versionId);
  assert.equal(val.hardErrors, 0);
});

test('5. Computer lab capacity respected with double ICT/Robotics sessions', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t5';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teachers = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[];
  const lab = db.prepare(`SELECT * FROM tt_classrooms WHERE tenant_id = ? AND room_type = 'computer_lab' LIMIT 1`).get(tenantId) as any;
  assert.ok(lab, 'Computer Lab seeded');

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Computer Studies', weekly: 2, doubles: 1, roomType: 'computer_lab', teacherIds: [teachers[0].id] });
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Eagle', subject: 'Computer Studies', weekly: 2, doubles: 1, roomType: 'computer_lab', teacherIds: [teachers[1].id] });
  addStreamAlloc(db, tenantId, configId, { grade: 7, stream: 'Chania', subject: 'Computer Studies', weekly: 2, doubles: 1, roomType: 'computer_lab', teacherIds: [teachers[2].id] });

  runSolver(db, tenantId, versionId);
  const labEntries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ? AND room_id = ?`).all(versionId, lab.id) as any[];
  assert.equal(labEntries.length, 6);

  const labSlots = new Set<string>();
  for (const e of labEntries) {
    const k = `${e.day_of_week}|${e.period_number}`;
    assert.equal(labSlots.has(k), false, `Computer Lab double-booked at ${k}`);
    labSlots.add(k);
  }
});

test('6. Library capacity respected (enforces 1 class default and allows 2 classes when max_concurrent_classes = 2)', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t6';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teachers = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[];
  const lib = db.prepare(`SELECT * FROM tt_classrooms WHERE tenant_id = ? AND room_type = 'library' LIMIT 1`).get(tenantId) as any;
  assert.ok(lib, 'Main Library Reading Hall seeded');

  // Set Library max_concurrent_classes = 2 and place 2 distinct classes at Monday P1 manually; validator must accept 2 and reject 3
  db.prepare(`UPDATE tt_classrooms SET max_concurrent_classes = 2 WHERE id = ?`).run(lib.id);
  const now = new Date().toISOString();
  const ins = db.prepare(
    `INSERT INTO tt_entries (id, version_id, tenant_id, day_of_week, period_number, grade, stream, stream_label, group_name, subject_name, teacher_ids_json, teacher_names_json, room_id, room_name, session_block_id, block_length, block_index, is_locked, updated_at)
     VALUES (?, ?, ?, 'Monday', 1, ?, ?, ?, 'Whole Class', 'Library Lesson', ?, ?, ?, ?, ?, 1, 0, 0, ?)`
  );
  ins.run(uid('ttent'), versionId, tenantId, 4, 'Dove', 'Grade 4 Dove', JSON.stringify([teachers[0].id]), '["T1"]', lib.id, lib.name, uid('blk'), now);
  ins.run(uid('ttent'), versionId, tenantId, 4, 'Eagle', 'Grade 4 Eagle', JSON.stringify([teachers[1].id]), '["T2"]', lib.id, lib.name, uid('blk'), now);

  let val = validateTimetableVersion(db, versionId);
  assert.equal(val.conflicts.filter((c) => c.conflictType === 'ROOM_CLASH').length, 0, '2 concurrent classes permitted when Library max_concurrent_classes = 2');

  // Adding a 3rd class at the exact same slot must trigger ROOM_CLASH
  ins.run(uid('ttent'), versionId, tenantId, 7, 'Chania', 'Grade 7 Chania', JSON.stringify([teachers[2].id]), '["T3"]', lib.id, lib.name, uid('blk'), now);
  val = validateTimetableVersion(db, versionId);
  assert.ok(val.conflicts.some((c) => c.conflictType === 'ROOM_CLASH'), '3rd class exceeds Library capacity of 2 and raises ROOM_CLASH');
});

test('7 & 8. Double lessons (2p) and Triple Swimming (3p) occupy consecutive periods without crossing break/lunch', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t78';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teachers = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[];

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Computer Studies', weekly: 2, doubles: 1, roomType: 'computer_lab', teacherIds: [teachers[0].id] });
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Swimming', weekly: 3, triples: 1, roomType: 'swimming_pool', teacherIds: [teachers[1].id] });

  runSolver(db, tenantId, versionId);
  const entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ? ORDER BY subject_name, block_index`).all(versionId) as any[];

  const ict = entries.filter((e) => e.subject_name === 'Computer Studies');
  assert.equal(ict.length, 2);
  assert.equal(ict[0].day_of_week, ict[1].day_of_week);
  assert.equal(ict[1].period_number, ict[0].period_number + 1, 'Double ICT occupies 2 consecutive periods');

  const swim = entries.filter((e) => e.subject_name === 'Swimming');
  assert.equal(swim.length, 3);
  assert.equal(swim[0].day_of_week, swim[1].day_of_week);
  assert.equal(swim[1].day_of_week, swim[2].day_of_week);
  assert.equal(swim[1].period_number, swim[0].period_number + 1, 'Triple Swimming P2 consecutive');
  assert.equal(swim[2].period_number, swim[1].period_number + 1, 'Triple Swimming P3 consecutive');

  const val = validateTimetableVersion(db, versionId);
  assert.equal(val.conflicts.filter((c) => c.conflictType === 'BLOCK_SPLIT_ACROSS_BREAK').length, 0, 'Multi-period blocks never split across break/lunch');
  assert.equal(val.hardErrors, 0);
});

test('9. Teacher off-duty periods strictly respected by solver and validator', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t9';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teacher = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? LIMIT 1`).get(tenantId) as any;

  // Mark Wednesday periods 5, 6, 7, 8 as OFF DUTY (like KAMAU on We afternoon)
  const offDuty = [
    { day: 'Wednesday', period: 5 },
    { day: 'Wednesday', period: 6 },
    { day: 'Wednesday', period: 7 },
    { day: 'Wednesday', period: 8 },
  ];
  db.prepare(`UPDATE tt_teacher_profiles SET off_duty_slots_json = ? WHERE id = ?`).run(JSON.stringify(offDuty), teacher.id);

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 7, stream: 'Chania', subject: 'Social Studies', weekly: 6, maxPerDay: 2, teacherIds: [teacher.id] });

  runSolver(db, tenantId, versionId);
  const entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(versionId) as any[];
  assert.equal(entries.length, 6);
  for (const e of entries) {
    if (e.day_of_week === 'Wednesday') {
      assert.ok(![5, 6, 7, 8].includes(Number(e.period_number)), `Solver violated OFF DUTY at We P${e.period_number}`);
    }
  }

  // Manually inject entry on Wednesday P6 and verify validator flags TEACHER_OFF_DUTY
  db.prepare(
    `INSERT INTO tt_entries (id, version_id, tenant_id, day_of_week, period_number, grade, stream, stream_label, group_name, subject_name, teacher_ids_json, teacher_names_json, room_name, session_block_id, block_length, block_index, is_locked, updated_at)
     VALUES (?, ?, ?, 'Wednesday', 6, 7, 'Mara', 'Grade 7 Mara', 'Whole Class', 'Social Studies', ?, '["Mr. Kamau"]', 'Room 7M', ?, 1, 0, 0, ?)`
  ).run(uid('ttent'), versionId, tenantId, JSON.stringify([teacher.id]), uid('blk'), new Date().toISOString());

  const val = validateTimetableVersion(db, versionId);
  assert.ok(val.conflicts.some((c) => c.conflictType === 'TEACHER_OFF_DUTY'), 'Validator flags TEACHER_OFF_DUTY hard conflict');
});

test('10. Different teacher break/availability schedules handled accurately', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t10';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teachers = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[];

  // Teacher 0 unavailable every day Period 1 & 2; Teacher 1 unavailable every day Period 7 & 8
  const avail0: Record<string, Record<string, boolean>> = {};
  const avail1: Record<string, Record<string, boolean>> = {};
  for (const d of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
    avail0[d] = { '1': false, '2': false };
    avail1[d] = { '7': false, '8': false };
  }
  db.prepare(`UPDATE tt_teacher_profiles SET availability_json = ? WHERE id = ?`).run(JSON.stringify(avail0), teachers[0].id);
  db.prepare(`UPDATE tt_teacher_profiles SET availability_json = ? WHERE id = ?`).run(JSON.stringify(avail1), teachers[1].id);

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Mathematics', weekly: 5, teacherIds: [teachers[0].id] });
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'English', weekly: 5, teacherIds: [teachers[1].id] });

  runSolver(db, tenantId, versionId);
  const entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(versionId) as any[];
  for (const e of entries) {
    if (e.subject_name === 'Mathematics') assert.ok(e.period_number > 2, 'Teacher 0 never scheduled in P1-P2');
    if (e.subject_name === 'English') assert.ok(e.period_number < 7, 'Teacher 1 never scheduled in P7-P8');
  }
});

test('11. Different grade daily schedules supported (Grade 4 = 6 periods/day vs Grade 7 = 8 periods/day)', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t11';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teachers = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[];

  db.prepare(`UPDATE tt_grade_schedules SET periods_per_day = 6 WHERE config_id = ? AND grade = 4`).run(configId);
  db.prepare(`UPDATE tt_grade_schedules SET periods_per_day = 8 WHERE config_id = ? AND grade = 7`).run(configId);

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Mathematics', weekly: 5, teacherIds: [teachers[0].id] });
  addStreamAlloc(db, tenantId, configId, { grade: 7, stream: 'Chania', subject: 'English', weekly: 5, teacherIds: [teachers[1].id] });

  runSolver(db, tenantId, versionId);
  const g4Entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ? AND grade = 4`).all(versionId) as any[];
  assert.equal(g4Entries.length, 5);
  for (const e of g4Entries) {
    assert.ok(Number(e.period_number) <= 6, `Grade 4 period ${e.period_number} exceeded 6 periods/day limit`);
  }
});

test('12. All allocated weekly lessons are either scheduled or explicitly reported in tt_unscheduled_sessions', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t12';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teacher = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? LIMIT 1`).get(tenantId) as any;

  // Lock out all days except Monday P1-P2 for teacher so only 2 of 5 Mathematics lessons can fit
  const avail: Record<string, Record<string, boolean>> = {};
  for (const d of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
    avail[d] = {};
    for (let p = 1; p <= 9; p++) {
      if (!(d === 'Monday' && p <= 2)) avail[d][String(p)] = false;
    }
  }
  db.prepare(`UPDATE tt_teacher_profiles SET availability_json = ? WHERE id = ?`).run(JSON.stringify(avail), teacher.id);

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Mathematics', weekly: 5, maxPerDay: 2, teacherIds: [teacher.id] });

  runSolver(db, tenantId, versionId);
  const placed = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(versionId) as any[];
  const unscheduled = db.prepare(`SELECT * FROM tt_unscheduled_sessions WHERE version_id = ?`).all(versionId) as any[];

  const unscheduledPeriods = unscheduled.reduce((sum, u) => sum + Number(u.block_length || 1), 0);
  assert.equal(placed.length + unscheduledPeriods, 5, 'Placed + unscheduled periods equals exact weekly allocation (5)');
  assert.ok(unscheduled.length > 0, 'Overflow sessions explicitly reported in tt_unscheduled_sessions');
});

test('13. Combined/joint stream lessons count once for teacher workload and appear for every participating stream', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t13';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teacher = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ? LIMIT 1`).get(tenantId) as any;
  const hall = db.prepare(`SELECT id FROM tt_classrooms WHERE tenant_id = ? AND room_type = 'hall' LIMIT 1`).get(tenantId) as any;

  clearStreamAllocations(db, configId);
  const jlId = uid('ttjl');
  db.prepare(
    `INSERT INTO tt_joint_lessons
       (id, tenant_id, config_id, title, subject_name, participating_classes_json, teacher_ids_json, weekly_periods, lesson_length, room_id, required_room_type, combined_students, preferred_days_json, preferred_periods_json, is_active, updated_at)
     VALUES (?, ?, ?, 'Grade 4 Joint Music', 'Music', ?, ?, 2, 1, ?, 'hall', 70, '[]', '[]', 1, ?)`
  ).run(
    jlId,
    tenantId,
    configId,
    JSON.stringify([{ grade: 4, stream: 'Dove' }, { grade: 4, stream: 'Eagle' }]),
    JSON.stringify([teacher.id]),
    hall?.id || null,
    new Date().toISOString()
  );

  runSolver(db, tenantId, versionId);
  const entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ? AND joint_lesson_id = ?`).all(versionId, jlId) as any[];
  assert.equal(entries.length, 4, '2 weekly joint lessons × 2 participating streams = 4 entry rows');

  const uniqueTeacherSlots = new Set(entries.map((e) => `${e.day_of_week}|${e.period_number}`));
  assert.equal(uniqueTeacherSlots.size, 2, 'Counts as exactly 2 unique teaching slots for teacher workload');

  const val = validateTimetableVersion(db, versionId);
  assert.equal(val.hardErrors, 0, 'Joint lesson produces zero teacher or room clashes');
});

test('14. Manual move candidate validation rejects teacher and class conflicts', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t14';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teachers = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[];

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Mathematics', weekly: 2, teacherIds: [teachers[0].id] });
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Eagle', subject: 'Mathematics', weekly: 2, teacherIds: [teachers[0].id] });

  runSolver(db, tenantId, versionId);
  const doveEntry = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ? AND stream = 'Dove' LIMIT 1`).get(versionId) as any;
  const eagleEntry = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ? AND stream = 'Eagle' LIMIT 1`).get(versionId) as any;

  // Attempt moving Dove's Mathematics onto Eagle's Mathematics slot (same teacher!)
  const check = validateSingleMoveCandidate(
    db,
    versionId,
    String(doveEntry.session_block_id),
    String(eagleEntry.day_of_week),
    Number(eagleEntry.period_number)
  );
  assert.equal(check.ok, false, 'Moving into conflicting teacher slot is rejected');
  assert.ok(check.hardConflicts.length > 0);
});

test('15 & 16. Draft timetables are not published; publishing syncs effects cleanly without leaking drafts', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t15';
  const { configId, versionId } = seedMinimalSchool(db, tenantId);
  const teachers = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[];

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Library Lesson', weekly: 1, roomType: 'library', teacherIds: [teachers[0].id] });
  runSolver(db, tenantId, versionId);

  // While status is 'draft', published query returns nothing
  const pubBefore = db.prepare(`SELECT * FROM tt_versions WHERE tenant_id = ? AND status = 'published'`).get(tenantId);
  assert.equal(pubBefore, undefined, 'Unapproved draft is not visible as published timetable');

  // Publish version and run publishVersionEffects
  const now = new Date().toISOString();
  db.prepare(`UPDATE tt_versions SET status = 'published', published_at = ?, published_by = 'Principal' WHERE id = ?`).run(now, versionId);
  publishVersionEffects(db, tenantId, versionId, `${tenantId}-u1`, 'Principal');

  const pubAfter = db.prepare(`SELECT * FROM tt_versions WHERE tenant_id = ? AND status = 'published'`).get(tenantId) as any;
  assert.equal(pubAfter.id, versionId);

  const syncedLegacy = db.prepare(`SELECT * FROM collections_store WHERE collection_key = 'edusmart_timetable_v1' AND tenant_id = ? AND deleted_at IS NULL`).all(tenantId) as any[];
  assert.equal(syncedLegacy.length, 1, 'Published entries synced to legacy collection');

  const syncedLib = db.prepare(`SELECT * FROM collections_store WHERE collection_key = 'edusmart_library_timetable_v1' AND tenant_id = ? AND deleted_at IS NULL`).all(tenantId) as any[];
  assert.equal(syncedLib.length, 1, 'Library Lesson synced to Library Timetable bookings');
});

test('17. Multi-tenant isolation verified (Tenant A schedules and queries never leak into Tenant B)', () => {
  const db = createTestDb();
  const a = seedMinimalSchool(db, 'tenant-alpha');
  const b = seedMinimalSchool(db, 'tenant-beta');

  const ta = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = 'tenant-alpha' LIMIT 1`).get() as any;
  const tb = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = 'tenant-beta' LIMIT 1`).get() as any;

  clearStreamAllocations(db, a.configId);
  clearStreamAllocations(db, b.configId);
  addStreamAlloc(db, 'tenant-alpha', a.configId, { grade: 4, stream: 'Dove', subject: 'French', weekly: 2, teacherIds: [ta.id] });
  addStreamAlloc(db, 'tenant-beta', b.configId, { grade: 4, stream: 'Dove', subject: 'Music', weekly: 3, teacherIds: [tb.id] });

  runSolver(db, 'tenant-alpha', a.versionId);
  runSolver(db, 'tenant-beta', b.versionId);

  const alphaEntries = db.prepare(`SELECT * FROM tt_entries WHERE tenant_id = 'tenant-alpha'`).all() as any[];
  const betaEntries = db.prepare(`SELECT * FROM tt_entries WHERE tenant_id = 'tenant-beta'`).all() as any[];

  assert.equal(alphaEntries.length, 2);
  assert.equal(betaEntries.length, 3);
  assert.ok(alphaEntries.every((e) => e.subject_name === 'French'));
  assert.ok(betaEntries.every((e) => e.subject_name === 'Music'));
});

test('18. Core LMS records (users, students, school_grades, school_streams) remain intact after seeding & generation', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t18';
  const { versionId } = seedMinimalSchool(db, tenantId);

  const beforeCounts = {
    users: (db.prepare(`SELECT COUNT(*) as c FROM users WHERE school_id = ?`).get(tenantId) as any).c,
    students: (db.prepare(`SELECT COUNT(*) as c FROM students WHERE school_id = ?`).get(tenantId) as any).c,
    grades: (db.prepare(`SELECT COUNT(*) as c FROM school_grades WHERE school_id = ?`).get(tenantId) as any).c,
    streams: (db.prepare(`SELECT COUNT(*) as c FROM school_streams WHERE school_id = ?`).get(tenantId) as any).c,
  };

  runSolver(db, tenantId, versionId);

  const afterCounts = {
    users: (db.prepare(`SELECT COUNT(*) as c FROM users WHERE school_id = ?`).get(tenantId) as any).c,
    students: (db.prepare(`SELECT COUNT(*) as c FROM students WHERE school_id = ?`).get(tenantId) as any).c,
    grades: (db.prepare(`SELECT COUNT(*) as c FROM school_grades WHERE school_id = ?`).get(tenantId) as any).c,
    streams: (db.prepare(`SELECT COUNT(*) as c FROM school_streams WHERE school_id = ?`).get(tenantId) as any).c,
  };

  assert.deepEqual(afterCounts, beforeCounts, 'Zero duplicate or deleted core LMS records');
});

test('19 & 20. Cancelled/failed draft generation does not damage published version & historical versions remain intact', () => {
  const db = createTestDb();
  const tenantId = 'tenant-t19';
  const { configId, versionId: v1Id } = seedMinimalSchool(db, tenantId);
  const teachers = db.prepare(`SELECT id FROM tt_teacher_profiles WHERE tenant_id = ?`).all(tenantId) as any[];

  clearStreamAllocations(db, configId);
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Dove', subject: 'Mathematics', weekly: 4, teacherIds: [teachers[0].id] });
  runSolver(db, tenantId, v1Id);

  const v1CountBefore = (db.prepare(`SELECT COUNT(*) as c FROM tt_entries WHERE version_id = ?`).get(v1Id) as any).c;
  assert.equal(v1CountBefore, 4);

  // Publish v1
  const now = new Date().toISOString();
  db.prepare(`UPDATE tt_versions SET status = 'published', published_at = ? WHERE id = ?`).run(now, v1Id);

  // Create draft v2 and simulate a cancelled generation job on v2
  const v2Id = uid('ttver');
  db.prepare(
    `INSERT INTO tt_versions (id, tenant_id, config_id, version_number, name, status, metrics_json, created_by, created_by_name, created_at, updated_at)
     VALUES (?, ?, ?, 2, 'Draft v2', 'draft', '{}', 'admin', 'Admin', ?, ?)`
  ).run(v2Id, tenantId, configId, now, now);

  const cancelledJobId = uid('ttjob');
  db.prepare(
    `INSERT INTO tt_generation_jobs (id, tenant_id, version_id, status, progress_pct, stage_message, preserve_locked, scope_json, cancel_requested, retries, diagnostics_json, created_by, created_at)
     VALUES (?, ?, ?, 'queued', 0, 'Queued', 1, '{}', 1, 0, '{}', 'admin', ?)`
  ).run(cancelledJobId, tenantId, v2Id, now);

  runTimetableGenerationDirect(db, cancelledJobId);
  const jobAfter = db.prepare(`SELECT status FROM tt_generation_jobs WHERE id = ?`).get(cancelledJobId) as any;
  assert.equal(jobAfter.status, 'cancelled');

  // Verify published v1 is completely untouched and still active/historical
  const v1Row = db.prepare(`SELECT status FROM tt_versions WHERE id = ?`).get(v1Id) as any;
  const v1CountAfter = (db.prepare(`SELECT COUNT(*) as c FROM tt_entries WHERE version_id = ?`).get(v1Id) as any).c;
  assert.equal(v1Row.status, 'published', 'Published timetable status untouched');
  assert.equal(v1CountAfter, v1CountBefore, 'Published timetable entries completely intact');

  // Verify scoped generation preserves out-of-scope streams cleanly
  addStreamAlloc(db, tenantId, configId, { grade: 4, stream: 'Eagle', subject: 'English', weekly: 3, teacherIds: [teachers[1].id] });
  runSolver(db, tenantId, v2Id, false, { mode: 'stream', grade: 4, stream: 'Eagle' });
  const v2Entries = db.prepare(`SELECT * FROM tt_entries WHERE version_id = ?`).all(v2Id) as any[];
  assert.equal(v2Entries.length, 3);
  assert.ok(v2Entries.every((e) => e.stream === 'Eagle'), 'Stream-scoped generation targets only Grade 4 Eagle');
});
