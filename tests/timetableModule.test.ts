import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  ADDITIONAL_COMMON_ACTIVITIES,
  CATEGORY_CORE_SUBJECTS,
  TIMETABLE_CATEGORIES,
  WEEKDAYS,
  buildDefaultPeriodSlots,
  ensureTimetableSeedForSchool,
  initTimetableSchema,
  type TimetableCategoryId,
} from '../src/server/timetableSchema.ts';
import {
  generateTimetableSchedule,
  validateTimetableEntries,
  validateTimetableReadiness,
  type EngineFacility,
  type EngineInput,
  type EngineRemedialConfig,
  type EngineScheduleConfig,
  type EngineStream,
  type EngineSubject,
  type EngineTeacherAssignment,
} from '../src/server/timetableEngine.ts';

function createMemoryTimetableDb() {
  const db = new DatabaseSync(':memory:');
  initTimetableSchema(db);
  ensureTimetableSeedForSchool(db, 'school-test-1');
  return db;
}

test('Definitive subject & activity lists seeded accurately per category with zero automatic assumptions', () => {
  const db = createMemoryTimetableDb();

  const expectedCore: Record<TimetableCategoryId, string[]> = {
    cat_1_3: [
      'Literacy',
      'English Activities',
      'Kiswahili/KSL',
      'Indigenous Language/Braille',
      'Mathematical Activities',
      'Environmental Activities',
      'Hygiene & Nutrition Activities',
      'Religious Education',
      'Movement & Creative Activities',
    ],
    cat_4_6: [
      'Mathematics',
      'English',
      'Kiswahili',
      'Integrated Science',
      'Agriculture',
      'Nutrition',
      'Social Studies',
      'Religious Education',
      'Creative Arts',
      'PHE/Sports',
      'Music',
    ],
    cat_7_9: [
      'Mathematics',
      'English',
      'Kiswahili',
      'Integrated Science',
      'Agriculture',
      'Nutrition',
      'Social Studies',
      'Religious Education',
      'Virtual Arts',
      'PHE/Sports',
      'Performing Arts',
      'Pretechnical Studies',
      'Computer Studies',
      'Business Studies',
    ],
  };

  const expectedCommon = [
    'ICT/Robotics',
    'Library Lessons',
    'Maktaba',
    'Swimming',
    'Clubs',
    'Remedial 1',
    'Remedial 2',
  ];

  for (const cat of TIMETABLE_CATEGORIES) {
    const rows = db
      .prepare(
        'SELECT name, subject_kind, is_additional_common, lessons_per_week FROM tt_subjects WHERE school_id = ? AND category_id = ? ORDER BY sort_order ASC'
      )
      .all('school-test-1', cat.id) as Array<{
      name: string;
      subject_kind: string;
      is_additional_common: number;
      lessons_per_week: number;
    }>;

    const coreNames = rows.filter((r) => !r.is_additional_common).map((r) => r.name);
    const commonNames = rows.filter((r) => r.is_additional_common).map((r) => r.name);

    assert.deepEqual(coreNames, expectedCore[cat.id], `Core subjects mismatch for ${cat.id}`);
    assert.deepEqual(commonNames, expectedCommon, `Common activities mismatch for ${cat.id}`);

    // Requirement F: Zero automatic assumptions on weekly frequencies
    for (const r of rows) {
      assert.equal(r.lessons_per_week, 0, `${r.name} in ${cat.id} must default to 0 lessons/week`);
    }
  }

  // Requirement F: Zero auto-assigned teachers
  const taCount = db
    .prepare('SELECT COUNT(*) as cnt FROM tt_teacher_assignments WHERE school_id = ?')
    .get('school-test-1') as { cnt: number };
  assert.equal(taCount.cnt, 0, 'No teachers should be automatically assigned');

  // Verify ICT/Robotics and Computer Studies are distinct in Category 3
  const cat3Tech = db
    .prepare(
      `SELECT code, name, requires_facility_type FROM tt_subjects
       WHERE school_id = ? AND category_id = 'cat_7_9' AND code IN ('computer_studies', 'ict_robotics')`
    )
    .all('school-test-1') as Array<{ code: string; name: string; requires_facility_type: string }>;
  assert.equal(cat3Tech.length, 2);
  assert.notEqual(cat3Tech[0].requires_facility_type, cat3Tech[1].requires_facility_type);
});

test('Scheduling engine enforces independent allocations, zero teacher collisions, shared facility capacity, Clubs/Maktaba, and Remedial 1 & 2 participating student groups', () => {
  const scheduleConfigs: Record<TimetableCategoryId, EngineScheduleConfig> = {
    cat_1_3: {
      categoryId: 'cat_1_3',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 35,
      periods: buildDefaultPeriodSlots(4, 35),
    },
    cat_4_6: {
      categoryId: 'cat_4_6',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 35,
      periods: buildDefaultPeriodSlots(4, 35),
    },
    cat_7_9: {
      categoryId: 'cat_7_9',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 40,
      periods: buildDefaultPeriodSlots(4, 40),
    },
  };

  const facilities: EngineFacility[] = [
    {
      id: 'fac_comp',
      name: 'Computer Lab 1',
      facilityType: 'computer_lab',
      capacityStreams: 1,
      seatCapacity: 40,
      equipment: ['40 PCs'],
      availableDays: [...WEEKDAYS],
      availablePeriods: [1, 2, 3, 4],
      notes: '',
      isActive: true,
    },
    {
      id: 'fac_ict',
      name: 'ICT/Robotics Lab',
      facilityType: 'ict_robotics_lab',
      capacityStreams: 1,
      seatCapacity: 35,
      equipment: ['Robotics Kits'],
      availableDays: [...WEEKDAYS],
      availablePeriods: [1, 2, 3, 4],
      notes: '',
      isActive: true,
    },
    {
      id: 'fac_lib',
      name: 'Main Library',
      facilityType: 'library',
      capacityStreams: 1,
      seatCapacity: 60,
      equipment: ['Books'],
      availableDays: [...WEEKDAYS],
      availablePeriods: [1, 2, 3, 4],
      notes: '',
      isActive: true,
    },
    {
      id: 'fac_pool',
      name: 'Swimming Pool',
      facilityType: 'swimming_pool',
      capacityStreams: 1,
      seatCapacity: 35,
      equipment: ['Pool'],
      availableDays: [...WEEKDAYS],
      availablePeriods: [1, 2, 3, 4],
      notes: '',
      isActive: true,
    },
  ];

  const streams: EngineStream[] = [
    { grade: 1, stream: 'North', categoryId: 'cat_1_3', studentIds: ['s1', 's2', 's3', 's4'] },
    { grade: 4, stream: 'North', categoryId: 'cat_4_6', studentIds: ['s5', 's6', 's7', 's8'] },
    { grade: 7, stream: 'North', categoryId: 'cat_7_9', studentIds: ['s9', 's10', 's11', 's12'] },
  ];

  // Independent allocations across categories (20 regular periods/wk each = 5 days x 4 periods)
  // Notice Swimming is 2 in Cat 1, 1 in Cat 2, 3 in Cat 3 (exact prompt example!)
  const subjects: EngineSubject[] = [
    // Category 1 (20 regular)
    { id: 'c1_lit', categoryId: 'cat_1_3', code: 'literacy', name: 'Literacy', shortCode: 'LIT', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 7, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 1 },
    { id: 'c1_mat', categoryId: 'cat_1_3', code: 'mathematical_activities', name: 'Mathematical Activities', shortCode: 'MAT', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 7, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 2 },
    { id: 'c1_ict', categoryId: 'cat_1_3', code: 'ict_robotics', name: 'ICT/Robotics', shortCode: 'ICT', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: 'ict_robotics_lab', defaultFacilityId: 'fac_ict', equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 3 },
    { id: 'c1_lib', categoryId: 'cat_1_3', code: 'library_lessons', name: 'Library Lessons', shortCode: 'LIB', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: 'library', defaultFacilityId: 'fac_lib', equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 4 },
    { id: 'c1_mkt', categoryId: 'cat_1_3', code: 'maktaba', name: 'Maktaba', shortCode: 'MKT', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: ['Tuesday'], allowedPeriods: [4], isActive: true, sortOrder: 5 },
    { id: 'c1_swm', categoryId: 'cat_1_3', code: 'swimming', name: 'Swimming', shortCode: 'SWM', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 2, requiresFacilityType: 'swimming_pool', defaultFacilityId: 'fac_pool', equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 6 },
    { id: 'c1_clb', categoryId: 'cat_1_3', code: 'clubs', name: 'Clubs', shortCode: 'CLB', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: ['Friday'], allowedPeriods: [4], isActive: true, sortOrder: 7 },
    { id: 'c1_rm1', categoryId: 'cat_1_3', code: 'remedial_1', name: 'Remedial 1', shortCode: 'RM1', subjectKind: 'remedial', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 8 },
    { id: 'c1_rm2', categoryId: 'cat_1_3', code: 'remedial_2', name: 'Remedial 2', shortCode: 'RM2', subjectKind: 'remedial', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 9 },

    // Category 2 (20 regular)
    { id: 'c2_mat', categoryId: 'cat_4_6', code: 'mathematics', name: 'Mathematics', shortCode: 'MAT', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 8, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 1 },
    { id: 'c2_eng', categoryId: 'cat_4_6', code: 'english', name: 'English', shortCode: 'ENG', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 7, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 2 },
    { id: 'c2_ict', categoryId: 'cat_4_6', code: 'ict_robotics', name: 'ICT/Robotics', shortCode: 'ICT', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: 'ict_robotics_lab', defaultFacilityId: 'fac_ict', equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 3 },
    { id: 'c2_lib', categoryId: 'cat_4_6', code: 'library_lessons', name: 'Library Lessons', shortCode: 'LIB', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: 'library', defaultFacilityId: 'fac_lib', equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 4 },
    { id: 'c2_mkt', categoryId: 'cat_4_6', code: 'maktaba', name: 'Maktaba', shortCode: 'MKT', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: ['Wednesday'], allowedPeriods: [4], isActive: true, sortOrder: 5 },
    { id: 'c2_swm', categoryId: 'cat_4_6', code: 'swimming', name: 'Swimming', shortCode: 'SWM', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: 'swimming_pool', defaultFacilityId: 'fac_pool', equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 6 },
    { id: 'c2_clb', categoryId: 'cat_4_6', code: 'clubs', name: 'Clubs', shortCode: 'CLB', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: ['Thursday'], allowedPeriods: [4], isActive: true, sortOrder: 7 },

    // Category 3 (20 regular — includes distinct Computer Studies AND ICT/Robotics)
    { id: 'c3_mat', categoryId: 'cat_7_9', code: 'mathematics', name: 'Mathematics', shortCode: 'MAT', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 6, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 1 },
    { id: 'c3_eng', categoryId: 'cat_7_9', code: 'english', name: 'English', shortCode: 'ENG', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 5, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 2 },
    { id: 'c3_cmp', categoryId: 'cat_7_9', code: 'computer_studies', name: 'Computer Studies', shortCode: 'CMP', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 2, requiresFacilityType: 'computer_lab', defaultFacilityId: 'fac_comp', equipmentNotes: '40 PCs', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 3 },
    { id: 'c3_ict', categoryId: 'cat_7_9', code: 'ict_robotics', name: 'ICT/Robotics', shortCode: 'ICT', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: 'ict_robotics_lab', defaultFacilityId: 'fac_ict', equipmentNotes: 'Robotics Kits', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 4 },
    { id: 'c3_lib', categoryId: 'cat_7_9', code: 'library_lessons', name: 'Library Lessons', shortCode: 'LIB', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: 'library', defaultFacilityId: 'fac_lib', equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 5 },
    { id: 'c3_mkt', categoryId: 'cat_7_9', code: 'maktaba', name: 'Maktaba', shortCode: 'MKT', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: ['Monday'], allowedPeriods: [4], isActive: true, sortOrder: 6 },
    { id: 'c3_swm', categoryId: 'cat_7_9', code: 'swimming', name: 'Swimming', shortCode: 'SWM', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 3, requiresFacilityType: 'swimming_pool', defaultFacilityId: 'fac_pool', equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 7 },
    { id: 'c3_clb', categoryId: 'cat_7_9', code: 'clubs', name: 'Clubs', shortCode: 'CLB', subjectKind: 'common_activity', isAdditionalCommon: true, lessonsPerWeek: 1, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: ['Friday'], allowedPeriods: [3], isActive: true, sortOrder: 8 },
  ];

  // First verify Requirement F: readiness MUST fail when teachers are unassigned
  const unready = validateTimetableReadiness({
    scheduleConfigs,
    subjects,
    facilities,
    teacherAssignments: [],
    remedialConfigs: [],
    streams,
  });
  assert.equal(unready.readyToGenerate, false, 'Generation must be blocked without assigned teachers');
  assert.ok(unready.issues.some((i) => i.code === 'UNASSIGNED_TEACHER'));

  // Now explicitly assign authorized teachers & supervisors
  const mkAssign = (
    id: string,
    teacherId: string,
    teacherName: string,
    categoryId: TimetableCategoryId,
    subjectId: string,
    roleType: 'subject_teacher' | 'supervisor' = 'subject_teacher',
    facilityId: string | null = null
  ): EngineTeacherAssignment => ({
    id,
    teacherId,
    teacherName,
    teacherEmail: `${teacherId}@school.test`,
    categoryId,
    subjectId,
    grade: null,
    stream: null,
    roleType,
    maxWeeklyPeriods: 28,
    facilityId,
    equipmentNotes: '',
    allowedDays: [],
    allowedPeriods: [],
    isActive: true,
  });

  const teacherAssignments: EngineTeacherAssignment[] = [
    mkAssign('a1', 't_c1_lit', 'Ms. Amina', 'cat_1_3', 'c1_lit'),
    mkAssign('a2', 't_c1_mat', 'Mr. Otieno', 'cat_1_3', 'c1_mat'),
    mkAssign('a3', 't_c2_mat', 'Mr. Kamau', 'cat_4_6', 'c2_mat'),
    mkAssign('a4', 't_c2_eng', 'Ms. Wanjiku', 'cat_4_6', 'c2_eng'),
    mkAssign('a5', 't_c3_mat', 'Mr. Njoroge', 'cat_7_9', 'c3_mat'),
    mkAssign('a6', 't_c3_eng', 'Ms. Chebet', 'cat_7_9', 'c3_eng'),
    mkAssign('a7', 't_comp', 'Mr. Kiprop (CS)', 'cat_7_9', 'c3_cmp', 'subject_teacher', 'fac_comp'),
    // Shared specialist teachers across all 3 categories (tests cross-category zero-collision!)
    mkAssign('a8', 't_ict', 'Ms. Zawadi (ICT/Robotics)', 'cat_1_3', 'c1_ict', 'subject_teacher', 'fac_ict'),
    mkAssign('a9', 't_ict', 'Ms. Zawadi (ICT/Robotics)', 'cat_4_6', 'c2_ict', 'subject_teacher', 'fac_ict'),
    mkAssign('a10', 't_ict', 'Ms. Zawadi (ICT/Robotics)', 'cat_7_9', 'c3_ict', 'subject_teacher', 'fac_ict'),
    mkAssign('a11', 't_lib', 'Mr. Mwangi (Librarian)', 'cat_1_3', 'c1_lib', 'subject_teacher', 'fac_lib'),
    mkAssign('a12', 't_lib', 'Mr. Mwangi (Librarian)', 'cat_4_6', 'c2_lib', 'subject_teacher', 'fac_lib'),
    mkAssign('a13', 't_lib', 'Mr. Mwangi (Librarian)', 'cat_7_9', 'c3_lib', 'subject_teacher', 'fac_lib'),
    mkAssign('a14', 't_swim', 'Coach Baraka', 'cat_1_3', 'c1_swm', 'subject_teacher', 'fac_pool'),
    mkAssign('a15', 't_swim', 'Coach Baraka', 'cat_4_6', 'c2_swm', 'subject_teacher', 'fac_pool'),
    mkAssign('a16', 't_swim', 'Coach Baraka', 'cat_7_9', 'c3_swm', 'subject_teacher', 'fac_pool'),
    mkAssign('a17', 't_mkt', 'Ustadh Ali (Maktaba)', 'cat_1_3', 'c1_mkt', 'supervisor'),
    mkAssign('a18', 't_mkt', 'Ustadh Ali (Maktaba)', 'cat_4_6', 'c2_mkt', 'supervisor'),
    mkAssign('a19', 't_mkt', 'Ustadh Ali (Maktaba)', 'cat_7_9', 'c3_mkt', 'supervisor'),
    mkAssign('a20', 't_clb', 'Ms. Akinyi (Clubs)', 'cat_1_3', 'c1_clb', 'supervisor'),
    mkAssign('a21', 't_clb', 'Ms. Akinyi (Clubs)', 'cat_4_6', 'c2_clb', 'supervisor'),
    mkAssign('a22', 't_clb', 'Ms. Akinyi (Clubs)', 'cat_7_9', 'c3_clb', 'supervisor'),
  ];

  // Requirement B: Two separate Remedial 1 & Remedial 2 groups in Grade 1 North with DISJOINT students
  // scheduled in the SAME remedial slot (Period 5 on Monday) with DIFFERENT teachers -> MUST NOT CONFLICT!
  const remedialConfigs: EngineRemedialConfig[] = [
    {
      id: 'rem_1_g1',
      categoryId: 'cat_1_3',
      remedialType: 'remedial_1',
      subjectId: 'c1_rm1',
      grade: 1,
      stream: 'North',
      weeklyFrequency: 1,
      teacherId: 't_c1_lit',
      teacherName: 'Ms. Amina',
      studentGroupMode: 'selected_learners',
      studentGroupName: 'Reading Boost Group',
      studentIds: ['s1', 's2'],
      durationMins: 40,
      availableDays: ['Monday'],
      availablePeriods: [5],
      facilityId: null,
      notes: '',
      isActive: true,
    },
    {
      id: 'rem_2_g1',
      categoryId: 'cat_1_3',
      remedialType: 'remedial_2',
      subjectId: 'c1_rm2',
      grade: 1,
      stream: 'North',
      weeklyFrequency: 1,
      teacherId: 't_c1_mat',
      teacherName: 'Mr. Otieno',
      studentGroupMode: 'selected_learners',
      studentGroupName: 'Numeracy Boost Group',
      studentIds: ['s3', 's4'],
      durationMins: 40,
      availableDays: ['Monday'],
      availablePeriods: [5],
      facilityId: null,
      notes: '',
      isActive: true,
    },
  ];

  const input: EngineInput = {
    scheduleConfigs,
    subjects,
    facilities,
    teacherAssignments,
    remedialConfigs,
    streams,
  };

  const result = generateTimetableSchedule(input);
  assert.equal(result.success, true, `Expected clean generation, unplaced: ${JSON.stringify(result.unplacedTasks)}`);
  assert.equal(result.audit.isValid, true, 'Generated timetable must pass full validation audit');
  assert.equal(result.audit.teacherCollisions.length, 0, 'Zero teacher collisions enforced');
  assert.equal(result.audit.facilityOverflows.length, 0, 'Zero shared facility overflows enforced');
  assert.equal(result.audit.studentGroupConflicts.length, 0, 'Zero student-group conflicts for disjoint remedial groups');
  assert.equal(result.audit.unexplainedBlankSessions.length, 0, 'Zero unexplained blank sessions across all 3 categories');

  // Verify Swimming ran 2x in Cat 1, 1x in Cat 2, 3x in Cat 3 (6 total bookings in Swimming Pool)
  const poolUtil = result.audit.facilityUtilization.find((f) => f.facilityId === 'fac_pool');
  assert.ok(poolUtil);
  assert.equal(poolUtil.bookingsByCategory.cat_1_3, 2);
  assert.equal(poolUtil.bookingsByCategory.cat_4_6, 1);
  assert.equal(poolUtil.bookingsByCategory.cat_7_9, 3);
  assert.equal(poolUtil.totalBookedSlots, 6);

  // Verify Clubs and Maktaba appear in both stream entries and supervisor workloads
  const clubsWorkload = result.audit.teacherWorkloads.find((w) => w.teacherId === 't_clb');
  const maktabaWorkload = result.audit.teacherWorkloads.find((w) => w.teacherId === 't_mkt');
  assert.equal(clubsWorkload?.clubsAndMaktabaPeriods, 3);
  assert.equal(maktabaWorkload?.clubsAndMaktabaPeriods, 3);

  // Verify both Remedial 1 and Remedial 2 were placed on Monday Period 5 without conflict (disjoint learners)
  const mondayRem = result.entries.filter(
    (e) => e.grade === 1 && e.stream === 'North' && e.dayOfWeek === 'Monday' && e.periodNumber === 5
  );
  assert.equal(mondayRem.length, 2, 'Disjoint selected-learner remedial groups should both schedule cleanly');

  // Now verify overlapping selected learners DO trigger studentGroupConflicts in validation audit
  const overlappingEntries = result.entries.map((e) =>
    e.remedialConfigId === 'rem_2_g1' ? { ...e, studentIds: ['s2', 's4'] } : e
  );
  const overlapAudit = validateTimetableEntries(input, overlappingEntries);
  assert.equal(
    overlapAudit.studentGroupConflicts.length,
    1,
    'Overlapping participating learner (s2) must be detected as a student-group conflict'
  );
  assert.deepEqual(overlapAudit.studentGroupConflicts[0].overlappingStudentIds, ['s2']);
});

test('Option 1 (individual_teacher): Individual teacher-subject-grade-stream-lessonsPerWeek assignments sync directly to zero-collision timetable processing', () => {
  const scheduleConfigs: Record<TimetableCategoryId, EngineScheduleConfig> = {
    cat_1_3: {
      categoryId: 'cat_1_3',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 35,
      periods: buildDefaultPeriodSlots(4, 35),
      allocationMode: 'category_redistribution',
    },
    cat_4_6: {
      categoryId: 'cat_4_6',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 35,
      periods: buildDefaultPeriodSlots(4, 35),
      allocationMode: 'individual_teacher',
    },
    cat_7_9: {
      categoryId: 'cat_7_9',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 40,
      periods: buildDefaultPeriodSlots(4, 40),
      allocationMode: 'category_redistribution',
    },
  };

  const streams: EngineStream[] = [
    { grade: 4, stream: 'North', categoryId: 'cat_4_6', studentIds: ['s1', 's2'] },
    { grade: 4, stream: 'South', categoryId: 'cat_4_6', studentIds: ['s3', 's4'] },
  ];

  // Category-level lessonsPerWeek intentionally left at 0 to prove Option 1 reads individual teacher assignments
  const subjects: EngineSubject[] = [
    { id: 'c2_mat', categoryId: 'cat_4_6', code: 'mathematics', name: 'Mathematics', shortCode: 'MAT', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 0, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 1 },
    { id: 'c2_eng', categoryId: 'cat_4_6', code: 'english', name: 'English', shortCode: 'ENG', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 0, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 2 },
    { id: 'c2_sci', categoryId: 'cat_4_6', code: 'integrated_science', name: 'Integrated Science', shortCode: 'SCI', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 0, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 3 },
  ];

  // Grade 4 North gets 8 Math + 7 Eng + 5 Sci = 20 lessons/wk
  // Grade 4 South gets 6 Math + 8 Eng + 6 Sci = 20 lessons/wk
  // Same Math teacher (t_math) teaches BOTH streams (8 + 6 = 14 <= 20 physical slots) -> must schedule with ZERO collisions!
  const teacherAssignments: EngineTeacherAssignment[] = [
    {
      id: 'ind_1', teacherId: 't_math', teacherName: 'Mr. Kamau', teacherEmail: 'kamau@test',
      categoryId: 'cat_4_6', subjectId: 'c2_mat', grade: 4, stream: 'North', lessonsPerWeek: 8,
      allocationSource: 'individual', roleType: 'subject_teacher', maxWeeklyPeriods: 28,
      facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true,
    },
    {
      id: 'ind_2', teacherId: 't_eng', teacherName: 'Ms. Wanjiku', teacherEmail: 'wanjiku@test',
      categoryId: 'cat_4_6', subjectId: 'c2_eng', grade: 4, stream: 'North', lessonsPerWeek: 7,
      allocationSource: 'individual', roleType: 'subject_teacher', maxWeeklyPeriods: 28,
      facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true,
    },
    {
      id: 'ind_3', teacherId: 't_sci', teacherName: 'Mr. Ochieng', teacherEmail: 'ochieng@test',
      categoryId: 'cat_4_6', subjectId: 'c2_sci', grade: 4, stream: 'North', lessonsPerWeek: 5,
      allocationSource: 'individual', roleType: 'subject_teacher', maxWeeklyPeriods: 28,
      facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true,
    },
    {
      id: 'ind_4', teacherId: 't_math', teacherName: 'Mr. Kamau', teacherEmail: 'kamau@test',
      categoryId: 'cat_4_6', subjectId: 'c2_mat', grade: 4, stream: 'South', lessonsPerWeek: 6,
      allocationSource: 'individual', roleType: 'subject_teacher', maxWeeklyPeriods: 28,
      facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true,
    },
    {
      id: 'ind_5', teacherId: 't_eng', teacherName: 'Ms. Wanjiku', teacherEmail: 'wanjiku@test',
      categoryId: 'cat_4_6', subjectId: 'c2_eng', grade: 4, stream: 'South', lessonsPerWeek: 8,
      allocationSource: 'individual', roleType: 'subject_teacher', maxWeeklyPeriods: 28,
      facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true,
    },
    {
      id: 'ind_6', teacherId: 't_sci', teacherName: 'Mr. Ochieng', teacherEmail: 'ochieng@test',
      categoryId: 'cat_4_6', subjectId: 'c2_sci', grade: 4, stream: 'South', lessonsPerWeek: 6,
      allocationSource: 'individual', roleType: 'subject_teacher', maxWeeklyPeriods: 28,
      facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true,
    },
  ];

  const input: EngineInput = {
    scheduleConfigs,
    subjects,
    facilities: [],
    teacherAssignments,
    remedialConfigs: [],
    streams,
  };

  const result = generateTimetableSchedule(input);
  assert.equal(result.success, true, `Option 1 should schedule cleanly: ${JSON.stringify(result.unplacedTasks)}`);
  assert.equal(result.audit.isValid, true);
  assert.equal(result.audit.teacherCollisions.length, 0, 'Zero teacher collisions across streams');
  assert.equal(result.audit.unexplainedBlankSessions.length, 0, 'Zero blank sessions');

  // Verify exact per-stream individual counts
  const northMath = result.entries.filter((e) => e.grade === 4 && e.stream === 'North' && e.subjectId === 'c2_mat');
  const southMath = result.entries.filter((e) => e.grade === 4 && e.stream === 'South' && e.subjectId === 'c2_mat');
  assert.equal(northMath.length, 8);
  assert.equal(southMath.length, 6);

  const mathWorkload = result.audit.teacherWorkloads.find((w) => w.teacherId === 't_math');
  assert.equal(mathWorkload?.scheduledTotal, 14);
});

test('Strict Zero-Collision Guards block duplicate stream-subject ownership, teacher impossible weekly load, and stream over-allocation', () => {
  const scheduleConfigs: Record<TimetableCategoryId, EngineScheduleConfig> = {
    cat_1_3: {
      categoryId: 'cat_1_3',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 35,
      periods: buildDefaultPeriodSlots(4, 35),
      allocationMode: 'individual_teacher',
    },
    cat_4_6: {
      categoryId: 'cat_4_6',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 35,
      periods: buildDefaultPeriodSlots(4, 35),
      allocationMode: 'category_redistribution',
    },
    cat_7_9: {
      categoryId: 'cat_7_9',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 40,
      periods: buildDefaultPeriodSlots(4, 40),
      allocationMode: 'category_redistribution',
    },
  };

  const streams: EngineStream[] = [
    { grade: 1, stream: 'North', categoryId: 'cat_1_3', studentIds: [] },
    { grade: 1, stream: 'South', categoryId: 'cat_1_3', studentIds: [] },
    { grade: 2, stream: 'North', categoryId: 'cat_1_3', studentIds: [] },
  ];

  const subjects: EngineSubject[] = [
    { id: 'c1_lit', categoryId: 'cat_1_3', code: 'literacy', name: 'Literacy', shortCode: 'LIT', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 0, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 1 },
    { id: 'c1_mat', categoryId: 'cat_1_3', code: 'mathematical_activities', name: 'Mathematical Activities', shortCode: 'MAT', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 0, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 2 },
  ];

  // 1. Duplicate ownership conflict: two different teachers assigned to Grade 1 North Literacy
  const dupReadiness = validateTimetableReadiness({
    scheduleConfigs,
    subjects,
    facilities: [],
    remedialConfigs: [],
    streams,
    teacherAssignments: [
      {
        id: 'd1', teacherId: 't1', teacherName: 'Ms. A', teacherEmail: '', categoryId: 'cat_1_3',
        subjectId: 'c1_lit', grade: 1, stream: 'North', lessonsPerWeek: 5, allocationSource: 'individual',
        roleType: 'subject_teacher', maxWeeklyPeriods: 28, facilityId: null, equipmentNotes: '',
        allowedDays: [], allowedPeriods: [], isActive: true,
      },
      {
        id: 'd2', teacherId: 't2', teacherName: 'Mr. B', teacherEmail: '', categoryId: 'cat_1_3',
        subjectId: 'c1_lit', grade: 1, stream: 'North', lessonsPerWeek: 5, allocationSource: 'individual',
        roleType: 'subject_teacher', maxWeeklyPeriods: 28, facilityId: null, equipmentNotes: '',
        allowedDays: [], allowedPeriods: [], isActive: true,
      },
    ],
  });
  assert.equal(dupReadiness.readyToGenerate, false);
  assert.ok(
    dupReadiness.issues.some((i) => i.code === 'DUPLICATE_STREAM_SUBJECT_ASSIGNMENT'),
    'Must flag DUPLICATE_STREAM_SUBJECT_ASSIGNMENT'
  );

  // 2. Teacher impossible weekly load: single teacher assigned 10 + 10 + 5 = 25 lessons/wk when only 20 physical slots exist
  const overloadReadiness = validateTimetableReadiness({
    scheduleConfigs,
    subjects,
    facilities: [],
    remedialConfigs: [],
    streams,
    teacherAssignments: [
      {
        id: 'o1', teacherId: 't_over', teacherName: 'Mr. Overloaded', teacherEmail: '', categoryId: 'cat_1_3',
        subjectId: 'c1_lit', grade: 1, stream: 'North', lessonsPerWeek: 10, allocationSource: 'individual',
        roleType: 'subject_teacher', maxWeeklyPeriods: 30, facilityId: null, equipmentNotes: '',
        allowedDays: [], allowedPeriods: [], isActive: true,
      },
      {
        id: 'o2', teacherId: 't_over', teacherName: 'Mr. Overloaded', teacherEmail: '', categoryId: 'cat_1_3',
        subjectId: 'c1_lit', grade: 1, stream: 'South', lessonsPerWeek: 10, allocationSource: 'individual',
        roleType: 'subject_teacher', maxWeeklyPeriods: 30, facilityId: null, equipmentNotes: '',
        allowedDays: [], allowedPeriods: [], isActive: true,
      },
      {
        id: 'o3', teacherId: 't_over', teacherName: 'Mr. Overloaded', teacherEmail: '', categoryId: 'cat_1_3',
        subjectId: 'c1_lit', grade: 2, stream: 'North', lessonsPerWeek: 5, allocationSource: 'individual',
        roleType: 'subject_teacher', maxWeeklyPeriods: 30, facilityId: null, equipmentNotes: '',
        allowedDays: [], allowedPeriods: [], isActive: true,
      },
    ],
  });
  assert.equal(overloadReadiness.readyToGenerate, false);
  assert.ok(
    overloadReadiness.issues.some((i) => i.code === 'TEACHER_IMPOSSIBLE_WEEKLY_LOAD'),
    'Must flag TEACHER_IMPOSSIBLE_WEEKLY_LOAD'
  );

  // 3. Stream over-allocation: Grade 1 North assigned 12 + 10 = 22 > 20 available periods
  const overStreamReadiness = validateTimetableReadiness({
    scheduleConfigs,
    subjects,
    facilities: [],
    remedialConfigs: [],
    streams: [streams[0]],
    teacherAssignments: [
      {
        id: 's1', teacherId: 't1', teacherName: 'Ms. A', teacherEmail: '', categoryId: 'cat_1_3',
        subjectId: 'c1_lit', grade: 1, stream: 'North', lessonsPerWeek: 12, allocationSource: 'individual',
        roleType: 'subject_teacher', maxWeeklyPeriods: 28, facilityId: null, equipmentNotes: '',
        allowedDays: [], allowedPeriods: [], isActive: true,
      },
      {
        id: 's2', teacherId: 't2', teacherName: 'Mr. B', teacherEmail: '', categoryId: 'cat_1_3',
        subjectId: 'c1_mat', grade: 1, stream: 'North', lessonsPerWeek: 10, allocationSource: 'individual',
        roleType: 'subject_teacher', maxWeeklyPeriods: 28, facilityId: null, equipmentNotes: '',
        allowedDays: [], allowedPeriods: [], isActive: true,
      },
    ],
  });
  assert.equal(overStreamReadiness.readyToGenerate, false);
  assert.ok(
    overStreamReadiness.issues.some((i) => i.code === 'OVER_ALLOCATED_CATEGORY'),
    'Must flag OVER_ALLOCATED_CATEGORY when stream exceeds available weekly periods'
  );
});

test('Option 2 (category_redistribution): Category weekly allocations redistribute across multiple streams and strictly link to assigned teachers with zero collisions', () => {
  const scheduleConfigs: Record<TimetableCategoryId, EngineScheduleConfig> = {
    cat_1_3: {
      categoryId: 'cat_1_3',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 35,
      periods: buildDefaultPeriodSlots(4, 35),
      allocationMode: 'category_redistribution',
    },
    cat_4_6: {
      categoryId: 'cat_4_6',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 35,
      periods: buildDefaultPeriodSlots(4, 35),
      allocationMode: 'category_redistribution',
    },
    cat_7_9: {
      categoryId: 'cat_7_9',
      days: [...WEEKDAYS],
      periodsPerDay: 4,
      periodDurationMins: 40,
      periods: buildDefaultPeriodSlots(4, 40),
      allocationMode: 'category_redistribution',
    },
  };

  const streams: EngineStream[] = [
    { grade: 4, stream: 'North', categoryId: 'cat_4_6', studentIds: [] },
    { grade: 4, stream: 'South', categoryId: 'cat_4_6', studentIds: [] },
    { grade: 5, stream: 'North', categoryId: 'cat_4_6', studentIds: [] },
  ];

  // Category 2 allocates 10 Math + 10 English = 20 regular periods -> redistributes to all 3 streams (60 total lessons)
  const subjects: EngineSubject[] = [
    { id: 'c2_mat', categoryId: 'cat_4_6', code: 'mathematics', name: 'Mathematics', shortCode: 'MAT', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 10, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 1 },
    { id: 'c2_eng', categoryId: 'cat_4_6', code: 'english', name: 'English', shortCode: 'ENG', subjectKind: 'core', isAdditionalCommon: false, lessonsPerWeek: 10, requiresFacilityType: null, defaultFacilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true, sortOrder: 2 },
  ];

  // Strictly linked stream teachers (each teacher takes <= 20 periods/wk so 0 collisions)
  const teacherAssignments: EngineTeacherAssignment[] = [
    { id: 'r1', teacherId: 'tm1', teacherName: 'Mr. Math A', teacherEmail: '', categoryId: 'cat_4_6', subjectId: 'c2_mat', grade: 4, stream: 'North', lessonsPerWeek: 10, allocationSource: 'category_redistribution', roleType: 'subject_teacher', maxWeeklyPeriods: 28, facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true },
    { id: 'r2', teacherId: 'tm1', teacherName: 'Mr. Math A', teacherEmail: '', categoryId: 'cat_4_6', subjectId: 'c2_mat', grade: 4, stream: 'South', lessonsPerWeek: 10, allocationSource: 'category_redistribution', roleType: 'subject_teacher', maxWeeklyPeriods: 28, facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true },
    { id: 'r3', teacherId: 'tm2', teacherName: 'Ms. Math B', teacherEmail: '', categoryId: 'cat_4_6', subjectId: 'c2_mat', grade: 5, stream: 'North', lessonsPerWeek: 10, allocationSource: 'category_redistribution', roleType: 'subject_teacher', maxWeeklyPeriods: 28, facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true },
    { id: 'r4', teacherId: 'te1', teacherName: 'Ms. Eng A', teacherEmail: '', categoryId: 'cat_4_6', subjectId: 'c2_eng', grade: 4, stream: 'North', lessonsPerWeek: 10, allocationSource: 'category_redistribution', roleType: 'subject_teacher', maxWeeklyPeriods: 28, facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true },
    { id: 'r5', teacherId: 'te1', teacherName: 'Ms. Eng A', teacherEmail: '', categoryId: 'cat_4_6', subjectId: 'c2_eng', grade: 4, stream: 'South', lessonsPerWeek: 10, allocationSource: 'category_redistribution', roleType: 'subject_teacher', maxWeeklyPeriods: 28, facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true },
    { id: 'r6', teacherId: 'te2', teacherName: 'Mr. Eng B', teacherEmail: '', categoryId: 'cat_4_6', subjectId: 'c2_eng', grade: 5, stream: 'North', lessonsPerWeek: 10, allocationSource: 'category_redistribution', roleType: 'subject_teacher', maxWeeklyPeriods: 28, facilityId: null, equipmentNotes: '', allowedDays: [], allowedPeriods: [], isActive: true },
  ];

  const result = generateTimetableSchedule({
    scheduleConfigs,
    subjects,
    facilities: [],
    teacherAssignments,
    remedialConfigs: [],
    streams,
  });

  assert.equal(result.success, true, `Option 2 redistribution must succeed: ${JSON.stringify(result.unplacedTasks)}`);
  assert.equal(result.audit.isValid, true);
  assert.equal(result.audit.teacherCollisions.length, 0);
  assert.equal(result.audit.unexplainedBlankSessions.length, 0);
  assert.equal(result.entries.length, 60);
  assert.equal(result.audit.streamAllocations.length, 6);
  assert.ok(result.audit.streamAllocations.every((ra) => ra.status === 'linked'));
});

