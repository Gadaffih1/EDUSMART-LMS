export type DepartmentKind = 'teaching' | 'non_teaching';

export interface SchoolDepartment {
  id: string;
  schoolId: string;
  name: string;
  kind?: DepartmentKind;
  subjects: string[];
  activities: string[];
  createdAt: string;
}

const TEACHING_DEPARTMENT_SUBJECTS: Record<string, string[]> = {
  'Mathematics & Computational Sciences': ['Mathematics', 'Computer Studies'],
  'Pure & Integrated Sciences': ['Integrated Science', 'Agriculture and Nutrition', 'Agriculture'],
  'Technical & Applied Sciences': ['Pretechnical Education', 'Pre-Technical Studies', 'Business Studies'],
  'Languages & Literature': ['English', 'Kiswahili'],
  'Pretechnical & Creative Arts': ['Creative Arts', 'Pretechnical Education', 'Physical and Health Education'],
  'Humanities & Social Sciences': ['Social Studies', 'Religious Education'],
};

const NON_TEACHING_DEPARTMENT_ACTIVITIES: Record<string, string[]> = {
  'Transport & Fleet': [
    'Route driving',
    'Student boarding and alighting',
    'Vehicle inspection',
    'Fleet fuel and logbook',
  ],
};

const DEPARTMENT_NAMES = Object.keys(TEACHING_DEPARTMENT_SUBJECTS);

const STORAGE_KEY = 'edusmart_school_departments_v1';
const SEEDED_KEY = 'edusmart_school_departments_seeded_v1';
const KIND_KEY = 'edusmart_department_kinds_v1';

function readAll(): SchoolDepartment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: SchoolDepartment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listDepartments(schoolId: string): SchoolDepartment[] {
  return readAll()
    .filter((row) => row.schoolId === schoolId)
    .map((row) => ({
      ...row,
      subjects: row.subjects || [],
      activities: row.activities || [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function seedRows(schoolId: string, existing: SchoolDepartment[]): SchoolDepartment[] {
  const teaching = DEPARTMENT_NAMES.map((name, index) => ({
    id: `dept-${schoolId}-${index + 1}`,
    schoolId,
    name,
    kind: 'teaching' as const,
    subjects: TEACHING_DEPARTMENT_SUBJECTS[name],
    activities: [],
    createdAt: '2026-01-08T08:30:00.000Z',
  }));
  const transport = {
    id: `dept-${schoolId}-transport`,
    schoolId,
    name: 'Transport & Fleet',
    kind: 'non_teaching' as const,
    subjects: [],
    activities: NON_TEACHING_DEPARTMENT_ACTIVITIES['Transport & Fleet'],
    createdAt: '2026-01-08T08:30:00.000Z',
  };
  return [...teaching, transport].filter((row) => (
    !existing.some((item) => item.schoolId === schoolId && item.name.toLowerCase() === row.name.toLowerCase())
  ));
}

export function ensureDepartments(schoolId: string): SchoolDepartment[] {
  const seeded = readIds(SEEDED_KEY);
  let rows = readAll();
  if (!seeded.includes(schoolId)) {
    rows = [...rows, ...seedRows(schoolId, rows)];
    writeAll(rows);
    localStorage.setItem(SEEDED_KEY, JSON.stringify([...seeded, schoolId]));
  }
  const migrated = readIds(KIND_KEY);
  if (!migrated.includes(schoolId)) {
    rows = rows.map((row) => {
      if (row.schoolId !== schoolId || row.kind) {
        return { ...row, subjects: row.subjects || [], activities: row.activities || [] };
      }
      const subjects = TEACHING_DEPARTMENT_SUBJECTS[row.name];
      if (subjects) return { ...row, kind: 'teaching' as const, subjects, activities: [] };
      const activities = NON_TEACHING_DEPARTMENT_ACTIVITIES[row.name];
      if (activities) return { ...row, kind: 'non_teaching' as const, subjects: [], activities };
      return { ...row, subjects: row.subjects || [], activities: row.activities || [] };
    });
    if (!rows.some((row) => row.schoolId === schoolId && row.name.toLowerCase() === 'transport & fleet')) {
      rows.push({
        id: `dept-${schoolId}-transport`,
        schoolId,
        name: 'Transport & Fleet',
        kind: 'non_teaching',
        subjects: [],
        activities: NON_TEACHING_DEPARTMENT_ACTIVITIES['Transport & Fleet'],
        createdAt: new Date().toISOString(),
      });
    }
    writeAll(rows);
    localStorage.setItem(KIND_KEY, JSON.stringify([...migrated, schoolId]));
  }
  return listDepartments(schoolId);
}

export function createDepartment(schoolId: string, name: string): SchoolDepartment {
  const clean = name.trim();
  if (!clean) throw new Error('Type a department name.');
  const rows = readAll();
  if (rows.some((row) => row.schoolId === schoolId && row.name.toLowerCase() === clean.toLowerCase())) {
    throw new Error('That department is already in the list.');
  }
  const created: SchoolDepartment = {
    id: `dept-${schoolId}-${Date.now()}`,
    schoolId,
    name: clean,
    subjects: [],
    activities: [],
    createdAt: new Date().toISOString(),
  };
  writeAll([...rows, created]);
  const seeded = readIds(SEEDED_KEY);
  if (!seeded.includes(schoolId)) localStorage.setItem(SEEDED_KEY, JSON.stringify([...seeded, schoolId]));
  return created;
}

export function updateDepartment(id: string, name: string): { previous: string; next: SchoolDepartment } {
  const clean = name.trim();
  if (!clean) throw new Error('Type a department name.');
  const rows = readAll();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) throw new Error('That department was not found.');
  const duplicate = rows.some((row) => row.id !== id && row.schoolId === rows[index].schoolId && row.name.toLowerCase() === clean.toLowerCase());
  if (duplicate) throw new Error('That department is already in the list.');
  const previous = rows[index].name;
  rows[index] = { ...rows[index], name: clean, subjects: rows[index].subjects || [], activities: rows[index].activities || [] };
  writeAll(rows);
  return { previous, next: rows[index] };
}

export function saveDepartmentChoice(
  id: string,
  updates: Partial<Pick<SchoolDepartment, 'kind' | 'subjects' | 'activities'>>,
): SchoolDepartment {
  const rows = readAll();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) throw new Error('That department was not found.');
  const next: SchoolDepartment = {
    ...rows[index],
    subjects: rows[index].subjects || [],
    activities: rows[index].activities || [],
    ...updates,
  };
  if (updates.kind === 'teaching') next.activities = [];
  if (updates.kind === 'non_teaching') next.subjects = [];
  rows[index] = next;
  writeAll(rows);
  return next;
}

export function deleteDepartment(id: string): void {
  writeAll(readAll().filter((row) => row.id !== id));
}
