import { GradeLevel, JUNIOR_STREAMS, PRIMARY_STREAMS, RoleAccessRights, StreamName, User } from '../types';
import { nameToken } from './accountCredentials';

export const STUDENT_RIGHTS: RoleAccessRights = {
  canAccessSanatorium: false,
  canAccessAcademicReports: true,
  canEditCommentWriteUps: false,
  canRepublishReports: false,
  canManageUsersAndRoles: false,
  canAccessAdminSettings: false,
  canAccessFinancials: false,
  canAccessProcurement: false,
  canAccessStores: false,
  canAccessHRPayroll: false,
  canAccessTimetable: true,
  canAccessGatePasses: false,
  canAccessLibrary: true,
  canAccessTransport: false,
  canAccessCoCurricular: true,
  canAccessLunchRegister: false,
  canAccessVirtualRooms: true,
  canManageDiscipline: false,
  canRequestDocumentSubmissions: false,
  canEditPostsBySpecificUsers: false,
  canAddCategoriesToPosts: false,
  hasDoubleAccessRights: false,
  canManageAllPostsCategoriesSections: false,
};

export const STUDENT_RIGHT_LABELS: { key: keyof RoleAccessRights; label: string }[] = [
  { key: 'canAccessAcademicReports', label: 'Academic reports' },
  { key: 'canAccessTimetable', label: 'Timetable' },
  { key: 'canAccessLibrary', label: 'Library' },
  { key: 'canAccessVirtualRooms', label: 'Virtual rooms' },
  { key: 'canAccessCoCurricular', label: 'Co-curricular' },
  { key: 'canAccessSanatorium', label: 'Sanatorium' },
  { key: 'canAccessGatePasses', label: 'Gate passes' },
  { key: 'canAccessTransport', label: 'Transport' },
  { key: 'canAccessLunchRegister', label: 'Lunch register' },
  { key: 'canAccessFinancials', label: 'Fees and finance' },
  { key: 'canManageDiscipline', label: 'Discipline' },
  { key: 'canManageUsersAndRoles', label: 'Users and roles' },
  { key: 'canAccessAdminSettings', label: 'Admin settings' },
];

export interface SchoolGrade {
  id: string;
  schoolId: string;
  name: string;
  createdAt: string;
}

export interface SchoolStream {
  id: string;
  schoolId: string;
  gradeId: string;
  name: string;
  displayName: string;
  createdAt: string;
}

export interface StudentRecord {
  id: string;
  schoolId: string;
  gradeId: string;
  streamId: string;
  name: string;
  email: string;
  password: string;
  admissionNumber: string;
  phone: string;
  upiNumber: string;
  gradeLabel: string;
  streamLabel: string;
  className: string;
  isActive: boolean;
  createdAt: string;
  rights: RoleAccessRights;
}

export interface StudentParentRecord {
  id: string;
  schoolId: string;
  studentId: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  relationship: string;
  createdAt: string;
}

export interface SchoolDirectory {
  grades: SchoolGrade[];
  streams: SchoolStream[];
  students: StudentRecord[];
  parents: StudentParentRecord[];
}

export function titleCaseWords(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b([a-zA-Z])/g, (letter) => letter.toUpperCase());
}

export function joinGradeStream(gradeName: string, streamName: string): string {
  return `${titleCaseWords(gradeName)} ${titleCaseWords(streamName)}`.trim();
}

const KEYS = {
  grades: 'edusmart_school_grades_v1',
  streams: 'edusmart_school_streams_v1',
  students: 'edusmart_students_v1',
  parents: 'edusmart_student_parents_v1',
};

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, rows: T[]): void {
  localStorage.setItem(key, JSON.stringify(rows));
}

function mergeById<T extends { id: string }>(key: string, incoming: T[]): T[] {
  const removed = removedDirectoryIds();
  const current = read<T>(key).filter((row) => !removed.has(row.id));
  const ids = new Set(current.map((row) => row.id));
  const added = incoming.filter((row) => !ids.has(row.id) && !removed.has(row.id));
  if (added.length === 0 && current.length === read<T>(key).length) return current;
  const next = current.concat(added);
  write(key, next);
  return next;
}

export function ensureSchoolDirectory(schoolId: string): SchoolDirectory {
  return {
    grades: read<SchoolGrade>(KEYS.grades).filter((row) => row.schoolId === schoolId),
    streams: read<SchoolStream>(KEYS.streams).filter((row) => row.schoolId === schoolId),
    students: read<StudentRecord>(KEYS.students).filter((row) => row.schoolId === schoolId),
    parents: read<StudentParentRecord>(KEYS.parents).filter((row) => row.schoolId === schoolId),
  };
}

export function listGrades(schoolId: string): SchoolGrade[] {
  return read<SchoolGrade>(KEYS.grades)
    .filter((row) => row.schoolId === schoolId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listStreams(gradeId: string): SchoolStream[] {
  return read<SchoolStream>(KEYS.streams)
    .filter((row) => row.gradeId === gradeId)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function listStudents(streamId: string): StudentRecord[] {
  return read<StudentRecord>(KEYS.students)
    .filter((row) => row.streamId === streamId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listSchoolStudents(schoolId: string): StudentRecord[] {
  ensureSchoolDirectory(schoolId);
  return read<StudentRecord>(KEYS.students)
    .filter((row) => row.schoolId === schoolId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listStudentParents(studentId: string): StudentParentRecord[] {
  return read<StudentParentRecord>(KEYS.parents)
    .filter((row) => row.studentId === studentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listSchoolParents(schoolId: string): StudentParentRecord[] {
  ensureSchoolDirectory(schoolId);
  return read<StudentParentRecord>(KEYS.parents)
    .filter((row) => row.schoolId === schoolId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getGrade(id: string): SchoolGrade | undefined {
  return read<SchoolGrade>(KEYS.grades).find((row) => row.id === id);
}

export function getStream(id: string): SchoolStream | undefined {
  return read<SchoolStream>(KEYS.streams).find((row) => row.id === id);
}

export function getStudentRecord(id: string): StudentRecord | undefined {
  return read<StudentRecord>(KEYS.students).find((row) => row.id === id);
}

export function listDirectoryEmails(): string[] {
  return [
    ...read<StudentRecord>(KEYS.students).map((row) => row.email),
    ...read<StudentParentRecord>(KEYS.parents).map((row) => row.email),
  ];
}

export function listAdmissionNumbers(): string[] {
  return read<StudentRecord>(KEYS.students).map((row) => row.admissionNumber);
}

function sameText(value: string | undefined, ident: string): boolean {
  return Boolean(value && value.trim().toLowerCase() === ident);
}

function knownGrade(label: string): GradeLevel | undefined {
  const match = label.match(/\b([1-9])\b/);
  return match ? Number(match[1]) as GradeLevel : undefined;
}

function knownStream(label: string): StreamName | undefined {
  return [...PRIMARY_STREAMS, ...JUNIOR_STREAMS].find((name) => name.toLowerCase() === label.trim().toLowerCase());
}

export function studentRecordToUser(student: StudentRecord): User {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    password: student.password,
    role: 'student',
    schoolId: student.schoolId,
    admissionNumber: student.admissionNumber,
    phone: student.phone,
    upiNumber: student.upiNumber,
    grade: knownGrade(student.gradeLabel),
    stream: knownStream(student.streamLabel),
    className: student.className,
    isActive: student.isActive,
  };
}

/** Students and parents live in the school directory and sign in through Login. */
export function findDirectoryLogin(rawIdent: string): { user: User; password: string } | null {
  const ident = rawIdent.trim().toLowerCase();
  if (!ident) return null;
  const students = read<StudentRecord>(KEYS.students);
  const student = students.find((row) => (
    row.isActive && (sameText(row.email, ident) || sameText(row.admissionNumber, ident) || sameText(row.name, ident))
  ));
  if (student) {
    return { user: studentRecordToUser(student), password: student.password };
  }
  const parent = read<StudentParentRecord>(KEYS.parents).find((row) => (
    sameText(row.email, ident) || sameText(row.name, ident) || sameText(row.phone, ident)
  ));
  if (!parent) return null;
  return {
    password: parent.password,
    user: {
      id: parent.id,
      name: parent.name,
      email: parent.email,
      password: parent.password,
      role: 'parent',
      schoolId: parent.schoolId,
      phone: parent.phone,
      childrenIds: [parent.studentId],
      isActive: true,
    },
  };
}

export function createGrade(schoolId: string, rawName: string): SchoolGrade {
  const name = titleCaseWords(rawName);
  if (!name) throw new Error('Type a grade name, such as Grade 1 or Year 1.');
  const existing = listGrades(schoolId);
  if (existing.some((grade) => grade.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`${name} is already in this school.`);
  }
  const grade: SchoolGrade = {
    id: `grade-${schoolId}-${nameToken(name)}-${Date.now()}`,
    schoolId,
    name,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.grades, read<SchoolGrade>(KEYS.grades).concat(grade));
  return grade;
}

export function createStream(schoolId: string, grade: SchoolGrade, rawName: string): SchoolStream {
  const name = titleCaseWords(rawName);
  if (!name) throw new Error('Type a stream name, such as Love.');
  const displayName = joinGradeStream(grade.name, name);
  const existing = listStreams(grade.id);
  if (existing.some((stream) => stream.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`${displayName} is already in ${grade.name}.`);
  }
  const stream: SchoolStream = {
    id: `stream-${grade.id}-${nameToken(name)}-${Date.now()}`,
    schoolId,
    gradeId: grade.id,
    name,
    displayName,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.streams, read<SchoolStream>(KEYS.streams).concat(stream));
  return stream;
}

export function saveStudentRecord(student: StudentRecord): StudentRecord {
  const all = read<StudentRecord>(KEYS.students);
  const index = all.findIndex((row) => row.id === student.id || row.email.toLowerCase() === student.email.toLowerCase());
  if (index >= 0) all[index] = student;
  else all.push(student);
  write(KEYS.students, all);
  return student;
}

export function saveStudentParent(parent: StudentParentRecord): StudentParentRecord {
  const all = read<StudentParentRecord>(KEYS.parents);
  const index = all.findIndex((row) => row.id === parent.id || (row.studentId === parent.studentId && row.email.toLowerCase() === parent.email.toLowerCase()));
  if (index >= 0) all[index] = parent;
  else all.push(parent);
  write(KEYS.parents, all);
  return parent;
}

const REMOVED_KEY = 'edusmart_directory_removed_v1';

function removedDirectoryIds(): Set<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(REMOVED_KEY) || '[]');
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function rememberRemoved(ids: string[]): void {
  const current = removedDirectoryIds();
  ids.forEach((id) => current.add(id));
  localStorage.setItem(REMOVED_KEY, JSON.stringify([...current]));
}

export function updateGrade(id: string, rawName: string): SchoolGrade {
  const grades = read<SchoolGrade>(KEYS.grades);
  const grade = grades.find((item) => item.id === id);
  if (!grade) throw new Error('That grade was not found.');
  const name = titleCaseWords(rawName);
  if (!name) throw new Error('Type a grade name, such as Grade 1 or Year 1.');
  if (grades.some((item) => item.schoolId === grade.schoolId && item.id !== id && item.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`${name} is already in this school.`);
  }
  grade.name = name;
  write(KEYS.grades, grades);
  const streams = read<SchoolStream>(KEYS.streams).map((stream) => (
    stream.gradeId === id ? { ...stream, displayName: joinGradeStream(name, stream.name) } : stream
  ));
  write(KEYS.streams, streams);
  const byStream = new Map(streams.map((stream) => [stream.id, stream]));
  write(KEYS.students, read<StudentRecord>(KEYS.students).map((student) => {
    if (student.gradeId !== id) return student;
    const stream = byStream.get(student.streamId);
    return {
      ...student,
      gradeLabel: name,
      className: stream?.displayName || joinGradeStream(name, student.streamLabel),
    };
  }));
  return grade;
}

export function updateStream(id: string, rawName: string): SchoolStream {
  const streams = read<SchoolStream>(KEYS.streams);
  const stream = streams.find((item) => item.id === id);
  if (!stream) throw new Error('That stream was not found.');
  const grade = read<SchoolGrade>(KEYS.grades).find((item) => item.id === stream.gradeId);
  if (!grade) throw new Error('The grade for this stream was not found.');
  const name = titleCaseWords(rawName);
  if (!name) throw new Error('Type a stream name, such as Love.');
  if (streams.some((item) => item.gradeId === stream.gradeId && item.id !== id && item.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`${joinGradeStream(grade.name, name)} is already in ${grade.name}.`);
  }
  const displayName = joinGradeStream(grade.name, name);
  const next = { ...stream, name, displayName };
  write(KEYS.streams, streams.map((item) => (item.id === id ? next : item)));
  write(KEYS.students, read<StudentRecord>(KEYS.students).map((student) => (
    student.streamId === id
      ? { ...student, streamLabel: name, className: displayName }
      : student
  )));
  return next;
}

function accountIdsForStudents(studentIds: Set<string>): string[] {
  const parents = read<StudentParentRecord>(KEYS.parents).filter((parent) => studentIds.has(parent.studentId));
  return [...studentIds, ...parents.map((parent) => parent.id)];
}

export function deleteGrade(id: string): string[] {
  const streamIds = read<SchoolStream>(KEYS.streams).filter((stream) => stream.gradeId === id).map((stream) => stream.id);
  const students = read<StudentRecord>(KEYS.students).filter((student) => student.gradeId === id);
  const studentIds = new Set(students.map((student) => student.id));
  const accountIds = accountIdsForStudents(studentIds);
  rememberRemoved([id, ...streamIds, ...accountIds]);
  write(KEYS.grades, read<SchoolGrade>(KEYS.grades).filter((grade) => grade.id !== id));
  write(KEYS.streams, read<SchoolStream>(KEYS.streams).filter((stream) => stream.gradeId !== id));
  write(KEYS.students, read<StudentRecord>(KEYS.students).filter((student) => !studentIds.has(student.id)));
  write(KEYS.parents, read<StudentParentRecord>(KEYS.parents).filter((parent) => !studentIds.has(parent.studentId)));
  return accountIds;
}

export function deleteStream(id: string): string[] {
  const students = read<StudentRecord>(KEYS.students).filter((student) => student.streamId === id);
  const studentIds = new Set(students.map((student) => student.id));
  const accountIds = accountIdsForStudents(studentIds);
  rememberRemoved([id, ...accountIds]);
  write(KEYS.streams, read<SchoolStream>(KEYS.streams).filter((stream) => stream.id !== id));
  write(KEYS.students, read<StudentRecord>(KEYS.students).filter((student) => student.streamId !== id));
  write(KEYS.parents, read<StudentParentRecord>(KEYS.parents).filter((parent) => !studentIds.has(parent.studentId)));
  return accountIds;
}

export function deleteStudentRecord(id: string): string[] {
  const accountIds = accountIdsForStudents(new Set([id]));
  rememberRemoved(accountIds);
  write(KEYS.students, read<StudentRecord>(KEYS.students).filter((student) => student.id !== id));
  write(KEYS.parents, read<StudentParentRecord>(KEYS.parents).filter((parent) => parent.studentId !== id));
  return accountIds;
}

export function deleteParentRecord(id: string): void {
  rememberRemoved([id]);
  write(KEYS.parents, read<StudentParentRecord>(KEYS.parents).filter((parent) => parent.id !== id));
}
