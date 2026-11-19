import {
  GradeLevel,
  StreamName,
  SubjectName,
  SubjectStreamAllocation,
  User,
  getSubjectsForGrade,
} from '../types';
import { Storage } from './storage';

export interface TeacherClassSubjectAllocation {
  grade: GradeLevel;
  stream: StreamName;
  subject: SubjectName;
}

export function normalizeSubjectName(subject: string | undefined | null): string {
  return String(subject || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function normalizeStreamName(stream: string | undefined | null): string {
  return String(stream || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isIntegratedScienceSubject(subject: string | undefined | null): boolean {
  return normalizeSubjectName(subject) === 'integrated science';
}

export function isComputerStudiesSubject(subject: string | undefined | null): boolean {
  return normalizeSubjectName(subject) === 'computer studies';
}

export function isLabEligibleSubject(subject: string | undefined | null): boolean {
  return isIntegratedScienceSubject(subject) || isComputerStudiesSubject(subject);
}

/**
 * Merges the React-held user snapshot with the latest synchronized user record
 * from Storage (if loaded) so newly updated Faculty Allocations take effect
 * immediately without requiring a full sign-out/sign-in cycle.
 */
export function resolveLatestTeacherProfile(user: User | null | undefined): User | null {
  if (!user) return null;
  try {
    const allUsers = Storage.getUsers();
    const latest = Array.isArray(allUsers)
      ? allUsers.find((u) => u && u.id === user.id)
      : undefined;
    if (!latest) return user;

    const merged: User = {
      ...user,
      grade: latest.grade ?? user.grade,
      stream: latest.stream ?? user.stream,
      department: latest.department ?? user.department,
      assignedSubjectAllocations:
        latest.assignedSubjectAllocations !== undefined
          ? latest.assignedSubjectAllocations
          : user.assignedSubjectAllocations,
      assignedSubjects:
        latest.assignedSubjects !== undefined
          ? latest.assignedSubjects
          : user.assignedSubjects,
      assignedStreams:
        latest.assignedStreams !== undefined
          ? latest.assignedStreams
          : user.assignedStreams,
    };
    return merged;
  } catch {
    return user;
  }
}

/**
 * Resolves exact (grade, stream, subject) tuples assigned to a teacher.
 * - When `assignedSubjectAllocations` is present as an array, it is authoritative.
 * - Otherwise falls back to legacy seeded `assignedStreams` x `assignedSubjects`.
 */
export function getTeacherAssignedAllocations(
  user: User | null | undefined
): TeacherClassSubjectAllocation[] {
  const resolved = resolveLatestTeacherProfile(user);
  if (!resolved) return [];

  const deduped: TeacherClassSubjectAllocation[] = [];
  const seen = new Set<string>();

  const pushTuple = (grade: GradeLevel, stream: StreamName, subject: SubjectName) => {
    const numGrade = Number(grade) as GradeLevel;
    const cleanStream = String(stream || '').trim() as StreamName;
    const cleanSubject = String(subject || '').trim() as SubjectName;
    if (!numGrade || !cleanStream || !cleanSubject) return;
    const key = `${numGrade}::${normalizeStreamName(cleanStream)}::${normalizeSubjectName(cleanSubject)}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push({ grade: numGrade, stream: cleanStream, subject: cleanSubject });
  };

  if (Array.isArray(resolved.assignedSubjectAllocations)) {
    for (const item of resolved.assignedSubjectAllocations as SubjectStreamAllocation[]) {
      if (!item) continue;
      pushTuple(item.grade, item.stream, item.subject);
    }
    return deduped;
  }

  const subjects = Array.isArray(resolved.assignedSubjects)
    ? resolved.assignedSubjects.filter(Boolean)
    : [];
  const streams: Array<{ grade: GradeLevel; stream: StreamName }> =
    Array.isArray(resolved.assignedStreams) && resolved.assignedStreams.length > 0
      ? resolved.assignedStreams
      : resolved.grade && resolved.stream
      ? [{ grade: resolved.grade, stream: resolved.stream }]
      : [];

  if (subjects.length === 0 || streams.length === 0) {
    return [];
  }

  for (const st of streams) {
    const gradeSubjects = getSubjectsForGrade(Number(st.grade) as GradeLevel).map((s) =>
      normalizeSubjectName(s)
    );
    const matchingForGrade = subjects.filter((sub) =>
      gradeSubjects.includes(normalizeSubjectName(sub))
    );
    const effectiveSubjects = matchingForGrade.length > 0 ? matchingForGrade : subjects;
    for (const sub of effectiveSubjects) {
      pushTuple(st.grade, st.stream, sub);
    }
  }

  return deduped;
}

/**
 * Returns unique subjects assigned to the teacher (preserving display order).
 */
export function getTeacherAssignedSubjects(user: User | null | undefined): SubjectName[] {
  const resolved = resolveLatestTeacherProfile(user);
  if (!resolved) return [];

  if (Array.isArray(resolved.assignedSubjectAllocations)) {
    const out: SubjectName[] = [];
    const seen = new Set<string>();
    for (const item of resolved.assignedSubjectAllocations) {
      const norm = normalizeSubjectName(item?.subject);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        out.push(item.subject);
      }
    }
    return out;
  }

  const out: SubjectName[] = [];
  const seen = new Set<string>();
  for (const sub of resolved.assignedSubjects || []) {
    const norm = normalizeSubjectName(sub);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(sub);
    }
  }
  return out;
}

/**
 * Strictly checks if a teacher is assigned Integrated Science.
 */
export function canAccessIntegratedScienceLab(user: User | null | undefined): boolean {
  return getTeacherAssignedSubjects(user).some((sub) => isIntegratedScienceSubject(sub));
}

/**
 * Strictly checks if a teacher is assigned Computer Studies.
 */
export function canAccessComputerStudiesLab(user: User | null | undefined): boolean {
  return getTeacherAssignedSubjects(user).some((sub) => isComputerStudiesSubject(sub));
}

/**
 * Strictly checks if a teacher may view and access the Virtual Laboratory and Computer Laboratory.
 * ONLY teachers assigned Integrated Science or Computer Studies may access them.
 */
export function canAccessTeacherLabs(user: User | null | undefined): boolean {
  return getTeacherAssignedSubjects(user).some((sub) => isLabEligibleSubject(sub));
}

export function getAllowedGradesForTeacher(
  user: User | null | undefined,
  restrictToSubjects?: SubjectName[]
): GradeLevel[] {
  const allocations = getTeacherAssignedAllocations(user);
  const subjectSet =
    restrictToSubjects && restrictToSubjects.length > 0
      ? new Set(restrictToSubjects.map((s) => normalizeSubjectName(s)))
      : null;

  const grades = new Set<GradeLevel>();
  for (const a of allocations) {
    if (subjectSet && !subjectSet.has(normalizeSubjectName(a.subject))) continue;
    grades.add(a.grade);
  }
  return Array.from(grades).sort((a, b) => a - b);
}

export function getAllowedStreamsForGrade(
  user: User | null | undefined,
  grade: GradeLevel | number,
  restrictToSubjects?: SubjectName[]
): StreamName[] {
  const allocations = getTeacherAssignedAllocations(user);
  const subjectSet =
    restrictToSubjects && restrictToSubjects.length > 0
      ? new Set(restrictToSubjects.map((s) => normalizeSubjectName(s)))
      : null;

  const out: StreamName[] = [];
  const seen = new Set<string>();
  for (const a of allocations) {
    if (Number(a.grade) !== Number(grade)) continue;
    if (subjectSet && !subjectSet.has(normalizeSubjectName(a.subject))) continue;
    const normStream = normalizeStreamName(a.stream);
    if (!seen.has(normStream)) {
      seen.add(normStream);
      out.push(a.stream);
    }
  }
  return out;
}

export function getAllowedSubjectsForGradeStream(
  user: User | null | undefined,
  grade: GradeLevel | number,
  stream: string | undefined | null
): SubjectName[] {
  const allocations = getTeacherAssignedAllocations(user);
  const normStream = normalizeStreamName(stream);
  if (!normStream) return [];

  const out: SubjectName[] = [];
  const seen = new Set<string>();
  for (const a of allocations) {
    if (Number(a.grade) !== Number(grade)) continue;
    if (normalizeStreamName(a.stream) !== normStream) continue;
    const normSub = normalizeSubjectName(a.subject);
    if (!seen.has(normSub)) {
      seen.add(normSub);
      out.push(a.subject);
    }
  }
  return out;
}

export function isTeacherAssignedToTarget(
  user: User | null | undefined,
  grade: GradeLevel | number,
  stream: string | undefined | null,
  subject: string | undefined | null
): boolean {
  const normStream = normalizeStreamName(stream);
  const normSubject = normalizeSubjectName(subject);
  if (!normStream || !normSubject) return false;
  if (normStream === 'all streams' || normStream === 'all') return false;

  const allocations = getTeacherAssignedAllocations(user);
  return allocations.some(
    (a) =>
      Number(a.grade) === Number(grade) &&
      normalizeStreamName(a.stream) === normStream &&
      normalizeSubjectName(a.subject) === normSubject
  );
}

/**
 * Parses a formatted class target label like "Grade 7 Dove" or "Grade 7 Dove (JSS)"
 * into `{ grade, stream }`, or returns null if not a valid single-stream class target.
 */
export function parseClassTargetLabel(
  label: string | undefined | null
): { grade: GradeLevel; stream: StreamName } | null {
  const raw = String(label || '').trim();
  const match = raw.match(/grade\s*(\d)\s+([a-z]+)/i);
  if (!match) return null;
  const grade = Number(match[1]) as GradeLevel;
  const stream = match[2].trim() as StreamName;
  if (grade < 1 || grade > 9 || normalizeStreamName(stream) === 'all') return null;
  return { grade, stream };
}
