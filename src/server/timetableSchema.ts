import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export type TimetableCategoryId = 'cat_1_3' | 'cat_4_6' | 'cat_7_9';

export type TimetableSubjectKind = 'core' | 'common_activity' | 'remedial';

export type FacilityType =
  | 'computer_lab'
  | 'ict_robotics_lab'
  | 'library'
  | 'swimming_pool'
  | 'maktaba_room'
  | 'clubs_venue'
  | 'general_room';

export type TeacherAssignmentRole = 'subject_teacher' | 'supervisor' | 'remedial_teacher';

export type StudentGroupMode = 'whole_stream' | 'selected_learners';

export type AllocationProcessingMode = 'individual_teacher' | 'category_redistribution';

export type AssignmentAllocationSource = 'individual' | 'category_redistribution';

export interface TimetableCategoryMeta {
  id: TimetableCategoryId;
  label: string;
  shortLabel: string;
  grades: number[];
  defaultPeriodsPerDay: number;
  defaultPeriodDurationMins: number;
}

export interface PeriodSlotDefinition {
  periodNumber: number;
  label: string;
  startTime: string;
  endTime: string;
  durationMins: number;
  slotType: 'regular' | 'remedial';
}

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export type WeekdayName = (typeof WEEKDAYS)[number];

export const TIMETABLE_CATEGORIES: TimetableCategoryMeta[] = [
  {
    id: 'cat_1_3',
    label: 'Category 1: Grades 1–3',
    shortLabel: 'Grades 1–3',
    grades: [1, 2, 3],
    defaultPeriodsPerDay: 7,
    defaultPeriodDurationMins: 35,
  },
  {
    id: 'cat_4_6',
    label: 'Category 2: Grades 4–6',
    shortLabel: 'Grades 4–6',
    grades: [4, 5, 6],
    defaultPeriodsPerDay: 8,
    defaultPeriodDurationMins: 35,
  },
  {
    id: 'cat_7_9',
    label: 'Category 3: Grades 7–9',
    shortLabel: 'Grades 7–9',
    grades: [7, 8, 9],
    defaultPeriodsPerDay: 8,
    defaultPeriodDurationMins: 40,
  },
];

export interface SubjectTemplate {
  code: string;
  name: string;
  shortCode: string;
  kind: TimetableSubjectKind;
  isAdditionalCommon: boolean;
  requiresFacilityType: FacilityType | null;
}

// Definitive Core Learning Areas per Category
export const CATEGORY_CORE_SUBJECTS: Record<TimetableCategoryId, SubjectTemplate[]> = {
  cat_1_3: [
    { code: 'literacy', name: 'Literacy', shortCode: 'LIT', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'english_activities', name: 'English Activities', shortCode: 'ENG', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'kiswahili_ksl', name: 'Kiswahili/KSL', shortCode: 'KIS', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'indigenous_language_braille', name: 'Indigenous Language/Braille', shortCode: 'IND', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'mathematical_activities', name: 'Mathematical Activities', shortCode: 'MAT', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'environmental_activities', name: 'Environmental Activities', shortCode: 'ENV', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'hygiene_nutrition_activities', name: 'Hygiene & Nutrition Activities', shortCode: 'HYG', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'religious_education', name: 'Religious Education', shortCode: 'CRE', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'movement_creative_activities', name: 'Movement & Creative Activities', shortCode: 'MOV', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
  ],
  cat_4_6: [
    { code: 'mathematics', name: 'Mathematics', shortCode: 'MAT', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'english', name: 'English', shortCode: 'ENG', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'kiswahili', name: 'Kiswahili', shortCode: 'KIS', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'integrated_science', name: 'Integrated Science', shortCode: 'SCI', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'agriculture', name: 'Agriculture', shortCode: 'AGR', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'nutrition', name: 'Nutrition', shortCode: 'NUT', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'social_studies', name: 'Social Studies', shortCode: 'SST', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'religious_education', name: 'Religious Education', shortCode: 'CRE', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'creative_arts', name: 'Creative Arts', shortCode: 'CAR', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'phe_sports', name: 'PHE/Sports', shortCode: 'PHE', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'music', name: 'Music', shortCode: 'MUS', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
  ],
  cat_7_9: [
    { code: 'mathematics', name: 'Mathematics', shortCode: 'MAT', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'english', name: 'English', shortCode: 'ENG', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'kiswahili', name: 'Kiswahili', shortCode: 'KIS', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'integrated_science', name: 'Integrated Science', shortCode: 'SCI', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'agriculture', name: 'Agriculture', shortCode: 'AGR', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'nutrition', name: 'Nutrition', shortCode: 'NUT', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'social_studies', name: 'Social Studies', shortCode: 'SST', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'religious_education', name: 'Religious Education', shortCode: 'CRE', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'virtual_arts', name: 'Virtual Arts', shortCode: 'VAR', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'phe_sports', name: 'PHE/Sports', shortCode: 'PHE', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'performing_arts', name: 'Performing Arts', shortCode: 'PAR', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'pretechnical_studies', name: 'Pretechnical Studies', shortCode: 'PRE', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
    { code: 'computer_studies', name: 'Computer Studies', shortCode: 'CMP', kind: 'core', isAdditionalCommon: false, requiresFacilityType: 'computer_lab' },
    { code: 'business_studies', name: 'Business Studies', shortCode: 'BUS', kind: 'core', isAdditionalCommon: false, requiresFacilityType: null },
  ],
};

// Definitive 7 Additional Common Subjects & Activities (independently available in ALL 3 categories)
export const ADDITIONAL_COMMON_ACTIVITIES: SubjectTemplate[] = [
  { code: 'ict_robotics', name: 'ICT/Robotics', shortCode: 'ICT', kind: 'common_activity', isAdditionalCommon: true, requiresFacilityType: 'ict_robotics_lab' },
  { code: 'library_lessons', name: 'Library Lessons', shortCode: 'LIB', kind: 'common_activity', isAdditionalCommon: true, requiresFacilityType: 'library' },
  { code: 'maktaba', name: 'Maktaba', shortCode: 'MKT', kind: 'common_activity', isAdditionalCommon: true, requiresFacilityType: null },
  { code: 'swimming', name: 'Swimming', shortCode: 'SWM', kind: 'common_activity', isAdditionalCommon: true, requiresFacilityType: 'swimming_pool' },
  { code: 'clubs', name: 'Clubs', shortCode: 'CLB', kind: 'common_activity', isAdditionalCommon: true, requiresFacilityType: null },
  { code: 'remedial_1', name: 'Remedial 1', shortCode: 'RM1', kind: 'remedial', isAdditionalCommon: true, requiresFacilityType: null },
  { code: 'remedial_2', name: 'Remedial 2', shortCode: 'RM2', kind: 'remedial', isAdditionalCommon: true, requiresFacilityType: null },
];

export function getCategoryForGrade(grade: number): TimetableCategoryId {
  if (grade <= 3) return 'cat_1_3';
  if (grade <= 6) return 'cat_4_6';
  return 'cat_7_9';
}

export function buildDefaultPeriodSlots(periodsPerDay: number, durationMins: number): PeriodSlotDefinition[] {
  const slots: PeriodSlotDefinition[] = [];
  let cursorMins = 8 * 60; // 08:00 start

  const formatTime = (totalMins: number): string => {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  for (let p = 1; p <= periodsPerDay; p++) {
    // Short break after Period 2 (15m), Tea break after Period 4 (25m), Lunch break after Period 6 (45m)
    if (p === 3) cursorMins += 15;
    if (p === 5) cursorMins += 25;
    if (p === 7) cursorMins += 45;

    const start = formatTime(cursorMins);
    cursorMins += durationMins;
    const end = formatTime(cursorMins);

    slots.push({
      periodNumber: p,
      label: `Period ${p}`,
      startTime: start,
      endTime: end,
      durationMins,
      slotType: 'regular',
    });
  }

  // Dedicated post-class remedial slot (Remedial Slot)
  cursorMins += 10;
  const remStart = formatTime(cursorMins);
  cursorMins += 40;
  const remEnd = formatTime(cursorMins);
  slots.push({
    periodNumber: periodsPerDay + 1,
    label: `Remedial Slot (P${periodsPerDay + 1})`,
    startTime: remStart,
    endTime: remEnd,
    durationMins: 40,
    slotType: 'remedial',
  });

  return slots;
}

export function initTimetableSchema(db: DatabaseSync): void {
  // One-time cleanup if obsolete pre-removal timetable tables (using tenant_id instead of school_id)
  // still exist in the persistent SQLite file.
  const requiredTables = [
    'tt_schedule_config',
    'tt_facilities',
    'tt_subjects',
    'tt_teacher_assignments',
    'tt_remedial_configs',
    'tt_versions',
    'tt_entries',
  ];

  let hasLegacyIncompatibleTable = false;
  for (const tbl of requiredTables) {
    const exists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
      .get(tbl) as { name?: string } | undefined;
    if (!exists?.name) continue;
    const cols = db.prepare(`PRAGMA table_info(${tbl})`).all() as Array<{ name: string }>;
    const hasSchoolId = cols.some((c) => c.name === 'school_id');
    if (!hasSchoolId) {
      hasLegacyIncompatibleTable = true;
      break;
    }
  }

  if (hasLegacyIncompatibleTable) {
    const legacyTtTables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'tt_%'`)
      .all() as Array<{ name: string }>;
    db.exec('PRAGMA foreign_keys = OFF;');
    try {
      for (const row of legacyTtTables) {
        if (/^tt_[a-z0-9_]+$/i.test(row.name)) {
          db.exec(`DROP TABLE IF EXISTS "${row.name}";`);
        }
      }
    } finally {
      db.exec('PRAGMA foreign_keys = ON;');
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS tt_schedule_config (
      school_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      days_json TEXT NOT NULL,
      periods_per_day INTEGER NOT NULL DEFAULT 8,
      period_duration_mins INTEGER NOT NULL DEFAULT 35,
      periods_json TEXT NOT NULL,
      allocation_mode TEXT NOT NULL DEFAULT 'category_redistribution',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (school_id, category_id)
    );

    CREATE TABLE IF NOT EXISTS tt_facilities (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      facility_type TEXT NOT NULL,
      capacity_streams INTEGER NOT NULL DEFAULT 1,
      seat_capacity INTEGER NOT NULL DEFAULT 40,
      equipment_json TEXT NOT NULL DEFAULT '[]',
      available_days_json TEXT NOT NULL,
      available_periods_json TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tt_facilities_school ON tt_facilities(school_id, is_active);

    CREATE TABLE IF NOT EXISTS tt_subjects (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      short_code TEXT NOT NULL,
      subject_kind TEXT NOT NULL,
      is_additional_common INTEGER NOT NULL DEFAULT 0,
      lessons_per_week INTEGER NOT NULL DEFAULT 0,
      requires_facility_type TEXT,
      default_facility_id TEXT,
      equipment_notes TEXT NOT NULL DEFAULT '',
      allowed_days_json TEXT NOT NULL DEFAULT '[]',
      allowed_periods_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE(school_id, category_id, code)
    );
    CREATE INDEX IF NOT EXISTS idx_tt_subjects_school_cat ON tt_subjects(school_id, category_id, sort_order);

    CREATE TABLE IF NOT EXISTS tt_teacher_assignments (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      teacher_email TEXT NOT NULL DEFAULT '',
      category_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      grade INTEGER,
      stream TEXT,
      lessons_per_week INTEGER,
      allocation_source TEXT NOT NULL DEFAULT 'individual',
      role_type TEXT NOT NULL DEFAULT 'subject_teacher',
      max_weekly_periods INTEGER NOT NULL DEFAULT 28,
      facility_id TEXT,
      equipment_notes TEXT NOT NULL DEFAULT '',
      allowed_days_json TEXT NOT NULL DEFAULT '[]',
      allowed_periods_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tt_teacher_assign_school ON tt_teacher_assignments(school_id, category_id, subject_id);
    CREATE INDEX IF NOT EXISTS idx_tt_teacher_assign_teacher ON tt_teacher_assignments(school_id, teacher_id);
    CREATE INDEX IF NOT EXISTS idx_tt_teacher_assign_stream ON tt_teacher_assignments(school_id, category_id, grade, stream, subject_id);

    CREATE TABLE IF NOT EXISTS tt_remedial_configs (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      remedial_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      grade INTEGER NOT NULL,
      stream TEXT NOT NULL,
      weekly_frequency INTEGER NOT NULL DEFAULT 1,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      student_group_mode TEXT NOT NULL DEFAULT 'selected_learners',
      student_group_name TEXT NOT NULL DEFAULT '',
      student_ids_json TEXT NOT NULL DEFAULT '[]',
      duration_mins INTEGER NOT NULL DEFAULT 40,
      available_days_json TEXT NOT NULL DEFAULT '[]',
      available_periods_json TEXT NOT NULL DEFAULT '[]',
      facility_id TEXT,
      notes TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tt_remedial_school ON tt_remedial_configs(school_id, category_id, grade, stream);

    CREATE TABLE IF NOT EXISTS tt_versions (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      term_label TEXT NOT NULL DEFAULT 'Term 1',
      academic_year TEXT NOT NULL DEFAULT '2026',
      status TEXT NOT NULL DEFAULT 'draft',
      validation_summary_json TEXT NOT NULL DEFAULT '{}',
      created_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      published_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tt_versions_school ON tt_versions(school_id, status, created_at);

    CREATE TABLE IF NOT EXISTS tt_entries (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      grade INTEGER NOT NULL,
      stream TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      period_number INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_mins INTEGER NOT NULL DEFAULT 35,
      subject_id TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      subject_kind TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      facility_id TEXT,
      facility_name TEXT,
      remedial_config_id TEXT,
      student_group_mode TEXT NOT NULL DEFAULT 'whole_stream',
      student_group_name TEXT NOT NULL DEFAULT '',
      student_ids_json TEXT NOT NULL DEFAULT '[]',
      is_locked INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tt_entries_version ON tt_entries(school_id, version_id);
    CREATE INDEX IF NOT EXISTS idx_tt_entries_stream ON tt_entries(version_id, grade, stream, day_of_week, period_number);
    CREATE INDEX IF NOT EXISTS idx_tt_entries_teacher ON tt_entries(version_id, teacher_id, day_of_week, period_number);
    CREATE INDEX IF NOT EXISTS idx_tt_entries_facility ON tt_entries(version_id, facility_id, day_of_week, period_number);
  `);

  const ensureColumn = (tableName: string, columnName: string, alterSql: string) => {
    const cols = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === columnName)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${alterSql};`);
    }
  };

  ensureColumn(
    'tt_schedule_config',
    'allocation_mode',
    `allocation_mode TEXT NOT NULL DEFAULT 'category_redistribution'`
  );
  ensureColumn('tt_teacher_assignments', 'lessons_per_week', 'lessons_per_week INTEGER');
  ensureColumn(
    'tt_teacher_assignments',
    'allocation_source',
    `allocation_source TEXT NOT NULL DEFAULT 'individual'`
  );
}

/**
 * Idempotently seeds schedule configs, definitive subject/activity catalog (with lessons_per_week = 0
 * — zero frequency assumptions), and baseline shared facilities if the school has none yet.
 * NEVER auto-assigns teachers (strict Requirement F).
 */
export function ensureTimetableSeedForSchool(db: DatabaseSync, schoolId: string): void {
  const now = new Date().toISOString();

  // 1. Seed schedule configs for all 3 categories
  const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO tt_schedule_config (
      school_id, category_id, days_json, periods_per_day, period_duration_mins, periods_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cat of TIMETABLE_CATEGORIES) {
    const periods = buildDefaultPeriodSlots(cat.defaultPeriodsPerDay, cat.defaultPeriodDurationMins);
    insertConfig.run(
      schoolId,
      cat.id,
      JSON.stringify([...WEEKDAYS]),
      cat.defaultPeriodsPerDay,
      cat.defaultPeriodDurationMins,
      JSON.stringify(periods),
      now
    );
  }

  // 2. Seed baseline shared facilities ONLY if school has 0 facilities
  const facilityCountRow = db
    .prepare('SELECT COUNT(*) as cnt FROM tt_facilities WHERE school_id = ?')
    .get(schoolId) as { cnt: number };

  const defaultFacilityIdsByType: Partial<Record<FacilityType, string>> = {};

  if (!facilityCountRow || facilityCountRow.cnt === 0) {
    const defaultFacilities: Array<{
      name: string;
      facilityType: FacilityType;
      capacityStreams: number;
      seatCapacity: number;
      equipment: string[];
      notes: string;
    }> = [
      {
        name: 'Computer Laboratory 1',
        facilityType: 'computer_lab',
        capacityStreams: 1,
        seatCapacity: 40,
        equipment: ['40 Desktop Workstations', 'Projector', 'LAN Switch', 'Structured Cabling'],
        notes: 'Dedicated laboratory for Computer Studies (Grades 7–9).',
      },
      {
        name: 'ICT & Robotics Innovation Lab',
        facilityType: 'ict_robotics_lab',
        capacityStreams: 1,
        seatCapacity: 36,
        equipment: ['36 Laptops/Tablets', 'Robotics Kits', 'Microcontrollers', 'Interactive Smartboard'],
        notes: 'Shared laboratory for ICT/Robotics across Categories 1–3.',
      },
      {
        name: 'Main School Library',
        facilityType: 'library',
        capacityStreams: 2,
        seatCapacity: 80,
        equipment: ['Reading Tables', 'Catalogue Terminals', 'Storybook & Reference Shelves'],
        notes: 'Shared library facility for Library Lessons across Categories 1–3.',
      },
      {
        name: 'School Swimming Pool',
        facilityType: 'swimming_pool',
        capacityStreams: 1,
        seatCapacity: 35,
        equipment: ['25m 6-Lane Pool', 'Kickboards', 'Lifeguard Rescue Kit', 'Changing Rooms'],
        notes: 'Shared aquatics facility for Swimming across Categories 1–3.',
      },
    ];

    const insertFac = db.prepare(`
      INSERT INTO tt_facilities (
        id, school_id, name, facility_type, capacity_streams, seat_capacity,
        equipment_json, available_days_json, available_periods_json, notes, is_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const defaultPeriods = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (const f of defaultFacilities) {
      const id = `fac_${crypto.randomBytes(6).toString('hex')}`;
      defaultFacilityIdsByType[f.facilityType] = id;
      insertFac.run(
        id,
        schoolId,
        f.name,
        f.facilityType,
        f.capacityStreams,
        f.seatCapacity,
        JSON.stringify(f.equipment),
        JSON.stringify([...WEEKDAYS]),
        JSON.stringify(defaultPeriods),
        f.notes,
        now
      );
    }
  } else {
    const existingFacs = db
      .prepare('SELECT id, facility_type FROM tt_facilities WHERE school_id = ? AND is_active = 1')
      .all(schoolId) as Array<{ id: string; facility_type: FacilityType }>;
    for (const f of existingFacs) {
      if (!defaultFacilityIdsByType[f.facility_type]) {
        defaultFacilityIdsByType[f.facility_type] = f.id;
      }
    }
  }

  // 3. Seed definitive subjects & 7 additional common activities independently per category
  //    lessons_per_week ALWAYS starts at 0 (Requirement F: No automatic assumptions).
  const insertSub = db.prepare(`
    INSERT OR IGNORE INTO tt_subjects (
      id, school_id, category_id, code, name, short_code, subject_kind,
      is_additional_common, lessons_per_week, requires_facility_type, default_facility_id,
      equipment_notes, allowed_days_json, allowed_periods_json, is_active, sort_order, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, '', '[]', '[]', 1, ?, ?)
  `);

  for (const cat of TIMETABLE_CATEGORIES) {
    const combined: SubjectTemplate[] = [
      ...CATEGORY_CORE_SUBJECTS[cat.id],
      ...ADDITIONAL_COMMON_ACTIVITIES,
    ];
    combined.forEach((tmpl, idx) => {
      const id = `sub_${cat.id}_${tmpl.code}_${schoolId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;
      const defaultFacId = tmpl.requiresFacilityType
        ? defaultFacilityIdsByType[tmpl.requiresFacilityType] ?? null
        : null;
      insertSub.run(
        id,
        schoolId,
        cat.id,
        tmpl.code,
        tmpl.name,
        tmpl.shortCode,
        tmpl.kind,
        tmpl.isAdditionalCommon ? 1 : 0,
        tmpl.requiresFacilityType,
        defaultFacId,
        idx + 1,
        now
      );
    });
  }
}
