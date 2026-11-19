import { ClientDataStore } from '../../utils/clientDataStore';

export interface TTConfigData {
  id: string;
  tenantId: string;
  academicYear: string;
  term: string;
  cycleDays: number;
  workingDays: string[];
  defaultPeriodsPerDay: number;
  cycleLabel: string;
  activeVersionId: string | null;
}

export interface TTGradeSchedule {
  id: string;
  grade: number;
  periodsPerDay: number;
  workingDays: string[];
  assemblyDay: string;
  assemblyPeriod: number;
  customNotes: string;
}

export interface TTPeriodItem {
  id: string;
  gradeBand: string;
  periodNumber: number;
  label: string;
  kind: 'lesson' | 'break' | 'lunch' | 'assembly';
  startTime: string;
  endTime: string;
  sortOrder: number;
}

export interface TTSubjectItem {
  id: string;
  name: string;
  code: string;
  department: string;
  isPractical: boolean;
  requiresRoomType: string;
  colorToken: string;
  isActive: boolean;
}

export interface TTDepartmentItem {
  id: string;
  name: string;
  code: string;
  headName: string;
  description: string;
  isActive: boolean;
}

export interface TTClassroomItem {
  id: string;
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

export interface TTStudentGroupItem {
  id: string;
  grade: number;
  stream: string;
  groupName: string;
  groupCode: string;
  studentCount: number;
  isWholeClass: boolean;
  parentClassKey: string;
}

export interface TTTeacherProfileItem {
  id: string;
  userId: string;
  teacherName: string;
  teacherEmail: string;
  tscNumber: string;
  department: string;
  qualifiedSubjects: string[];
  availability: Record<string, Record<string, boolean>>;
  maxDailyPeriods: number;
  maxWeeklyPeriods: number;
  maxConsecutiveLessons: number;
  preferredFreePeriods: Array<{ day: string; period: number }>;
  activeInTimetable: boolean;
  archivedAt: string | null;
}

export interface TTGradeAllocationItem {
  id: string;
  grade: number;
  subjectName: string;
  requiredWeeklyPeriods: number;
  singleLessons: number;
  doubleLessons: number;
  tripleLessons: number;
  patternPreference: string;
  maxPerDay: number;
  minSpacingDays: number;
  preferredDays: string[];
  preferredPeriods: number[];
  requiredRoomType: string;
  defaultRoomId: string | null;
  teacherIds: string[];
  studentGroupLabel: string;
  isActive: boolean;
}

export interface TTStreamAllocationItem {
  id: string;
  grade: number;
  stream: string;
  groupId: string | null;
  subjectName: string;
  inheritedFromId: string | null;
  isOverridden: boolean;
  requiredWeeklyPeriods: number;
  singleLessons: number;
  doubleLessons: number;
  tripleLessons: number;
  patternPreference: string;
  maxPerDay: number;
  minSpacingDays: number;
  preferredDays: string[];
  preferredPeriods: number[];
  requiredRoomType: string;
  roomId: string | null;
  teacherIds: string[];
  isActive: boolean;
}

export interface TTJointLessonItem {
  id: string;
  title: string;
  subjectName: string;
  participatingClasses: Array<{ grade: number; stream: string }>;
  teacherIds: string[];
  weeklyPeriods: number;
  lessonLength: number;
  roomId: string | null;
  requiredRoomType: string;
  combinedStudents: number;
  preferredDays: string[];
  preferredPeriods: number[];
  isActive: boolean;
}

export interface TTEntryItem {
  id: string;
  versionId: string;
  tenantId: string;
  dayOfWeek: string;
  periodNumber: number;
  grade: number;
  stream: string;
  streamLabel: string;
  groupId: string | null;
  groupName: string;
  jointLessonId: string | null;
  allocationId: string | null;
  subjectName: string;
  teacherIds: string[];
  teacherNames: string[];
  roomId: string | null;
  roomName: string;
  sessionBlockId: string;
  blockLength: number;
  blockIndex: number;
  isLocked: boolean;
  lockedBy: string | null;
  notes: string;
}

export interface TTUnscheduledItem {
  id: string;
  sessionKey: string;
  allocationId: string | null;
  jointLessonId: string | null;
  grade: number;
  stream: string;
  groupId: string | null;
  groupName: string;
  subjectName: string;
  teacherIds: string[];
  teacherNames: string[];
  blockLength: number;
  requiredRoomType: string;
  reason: string;
  diagnostics: any;
}

export interface TTConflictItem {
  id: string;
  severity: 'error' | 'warning';
  conflictType: string;
  dayOfWeek: string | null;
  periodNumber: number | null;
  message: string;
  details: any;
}

export interface TTJobItem {
  id: string;
  versionId?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progressPct: number;
  stageMessage: string;
  preserveLocked: boolean;
  retries: number;
  diagnostics: any;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt?: string;
}

export interface TTVersionSummary {
  id: string;
  versionNumber: number;
  name: string;
  status: 'draft' | 'generated' | 'review' | 'approved' | 'published' | 'archived';
  metrics: any;
  reviewComments: string;
  createdByName: string;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TTVersionDetail extends TTVersionSummary {
  tenantId: string;
  configId: string;
  entries: TTEntryItem[];
  unscheduled: TTUnscheduledItem[];
  conflicts: TTConflictItem[];
  jobs: TTJobItem[];
}

export interface TTWorkspacePayload {
  tenantId: string;
  config: TTConfigData;
  gradeSchedules: TTGradeSchedule[];
  periods: TTPeriodItem[];
  subjects: TTSubjectItem[];
  departments?: TTDepartmentItem[];
  classrooms: TTClassroomItem[];
  studentGroups: TTStudentGroupItem[];
  teachers: TTTeacherProfileItem[];
  gradeAllocations: TTGradeAllocationItem[];
  streamAllocations: TTStreamAllocationItem[];
  jointLessons: TTJointLessonItem[];
  versions: TTVersionSummary[];
  activeVersion: TTVersionDetail | null;
  allocationIssues: Array<{ grade: number; stream: string; subject: string; message: string }>;
  streamLoadSummary: Array<{
    grade: number;
    stream: string;
    requiredPeriods: number;
    availablePeriods: number;
    deficitOrExcess: number;
  }>;
  auditLogs: Array<{
    id: string;
    versionId: string | null;
    action: string;
    actorName: string;
    actorRole: string;
    details: any;
    createdAt: string;
  }>;
}

export async function ttApiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: ClientDataStore.getAuthHeaders({
      'Content-Type': 'application/json',
      ...(options.headers ? (options.headers as Record<string, string>) : {}),
    }),
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`) as Error & { status?: number; payload?: any };
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data as T;
}

export const ROOM_TYPE_LABELS: Record<string, string> = {
  general: 'Standard Classroom',
  science_lab: 'Science Laboratory',
  computer_lab: 'Computer / ICT Lab',
  workshop: 'Pre-Tech Workshop',
  art_room: 'Creative Arts & Music Studio',
  library: 'School Library / Reading Hall',
  field: 'Sports Field',
  hall: 'Assembly Hall',
};
