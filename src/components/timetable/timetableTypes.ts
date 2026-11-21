import { ClientDataStore } from '../../utils/clientDataStore';

export type TimetableCategoryId = 'cat_1_3' | 'cat_4_6' | 'cat_7_9';
export type TimetableSubjectKind = 'core' | 'common_activity' | 'remedial';
export type FacilityType =
  | 'computer_lab'
  | 'ict_robotics_lab'
  | 'science_lab'
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
  slotType: 'regular' | 'break' | 'lunch' | 'remedial';
}

export interface SchoolBrandInfo {
  id: string;
  name: string;
  logoUrl: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  motto: string;
  printFooterNotes: string;
}

export interface GradeSubjectOverride {
  categoryId: TimetableCategoryId;
  grade: number;
  subjectId: string;
  lessonsPerWeek: number;
}

export interface ScheduleConfig {
  categoryId: TimetableCategoryId;
  days: string[];
  periodsPerDay: number;
  periodDurationMins: number;
  periods: PeriodSlotDefinition[];
  allocationMode?: AllocationProcessingMode;
}

export interface TimetableSubject {
  id: string;
  categoryId: TimetableCategoryId;
  code: string;
  name: string;
  shortCode: string;
  subjectKind: TimetableSubjectKind;
  isAdditionalCommon: boolean;
  lessonsPerWeek: number;
  requiresFacilityType: FacilityType | null;
  defaultFacilityId: string | null;
  equipmentNotes: string;
  allowedDays: string[];
  allowedPeriods: number[];
  isActive: boolean;
  sortOrder: number;
}

export interface TimetableFacility {
  id: string;
  name: string;
  facilityType: FacilityType;
  capacityStreams: number;
  seatCapacity: number;
  equipment: string[];
  availableDays: string[];
  availablePeriods: number[];
  notes: string;
  isActive: boolean;
}

export interface TimetableTeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  categoryId: TimetableCategoryId;
  subjectId: string;
  grade: number | null;
  stream: string | null;
  lessonsPerWeek?: number | null;
  allocationSource?: AssignmentAllocationSource;
  roleType: TeacherAssignmentRole;
  maxWeeklyPeriods: number;
  facilityId: string | null;
  equipmentNotes: string;
  allowedDays: string[];
  allowedPeriods: number[];
  isActive: boolean;
}

export interface TimetableRemedialConfig {
  id: string;
  categoryId: TimetableCategoryId;
  remedialType: 'remedial_1' | 'remedial_2';
  subjectId: string;
  grade: number;
  stream: string;
  weeklyFrequency: number;
  teacherId: string;
  teacherName: string;
  studentGroupMode: StudentGroupMode;
  studentGroupName: string;
  studentIds: string[];
  durationMins: number;
  availableDays: string[];
  availablePeriods: number[];
  facilityId: string | null;
  notes: string;
  isActive: boolean;
}

export interface TimetableStream {
  grade: number;
  stream: string;
  categoryId: TimetableCategoryId;
  studentIds: string[];
}

export interface DirectoryTeacher {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface DirectoryStudent {
  id: string;
  name: string;
  admissionNumber: string;
  grade: number;
  stream: string;
}

export interface TimetableVersion {
  id: string;
  name: string;
  termLabel: string;
  academicYear: string;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
}

export interface TimetableEntry {
  id: string;
  categoryId: TimetableCategoryId;
  grade: number;
  stream: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  durationMins: number;
  subjectId: string;
  subjectName: string;
  subjectKind: TimetableSubjectKind;
  teacherId: string;
  teacherName: string;
  facilityId: string | null;
  facilityName: string | null;
  remedialConfigId: string | null;
  studentGroupMode: StudentGroupMode;
  studentGroupName: string;
  studentIds: string[];
  isLocked: boolean;
  notes: string;
}

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  categoryId?: TimetableCategoryId;
  grade?: number;
  stream?: string;
  message: string;
}

export interface CategoryAllocationSummary {
  categoryId: TimetableCategoryId;
  label: string;
  allocationMode: AllocationProcessingMode;
  availableRegularPeriods: number;
  allocatedCoreLessons: number;
  allocatedCommonLessons: number;
  allocatedRemedialLessons: number;
  totalAllocatedRegularLessons: number;
  remainingRegularPeriods: number;
  activeStreamCount: number;
  linkedStreamSlots: number;
  unlinkedStreamSlots: number;
  duplicateConflicts: number;
}

export interface ResolvedStreamAllocation {
  categoryId: TimetableCategoryId;
  grade: number;
  stream: string;
  subjectId: string;
  subjectName: string;
  subjectKind: TimetableSubjectKind;
  lessonsPerWeek: number;
  source: AssignmentAllocationSource;
  linkedAssignmentId: string | null;
  teacherId: string | null;
  teacherName: string | null;
  status: 'linked' | 'unassigned' | 'duplicate_conflict';
  conflictTeachers: string[];
}

export interface TeacherWorkloadReport {
  teacherId: string;
  teacherName: string;
  maxWeeklyPeriods: number;
  scheduledTotal: number;
  corePeriods: number;
  commonActivityPeriods: number;
  remedialPeriods: number;
  clubsAndMaktabaPeriods: number;
  utilizationPct: number;
  isOverloaded: boolean;
  categoriesTaught: TimetableCategoryId[];
}

export interface FacilityUtilizationReport {
  facilityId: string;
  facilityName: string;
  facilityType: FacilityType;
  capacityStreams: number;
  totalBookedSlots: number;
  peakConcurrentStreams: number;
  overflowSlots: number;
  bookingsByCategory: Record<TimetableCategoryId, number>;
}

export interface StreamCompletenessReport {
  categoryId: TimetableCategoryId;
  grade: number;
  stream: string;
  expectedRegularPeriods: number;
  scheduledRegularPeriods: number;
  unexplainedBlankPeriods: number;
  remedialSessionsScheduled: number;
  missingLessons: Array<{ subjectName: string; expected: number; scheduled: number }>;
  isComplete: boolean;
}

export interface TimetableAuditReport {
  isValid: boolean;
  readyToGenerate: boolean;
  readinessIssues: ValidationIssue[];
  teacherCollisions: Array<{
    teacherId: string;
    teacherName: string;
    dayOfWeek: string;
    periodNumber: number;
    entries: Array<{ grade: number; stream: string; subjectName: string }>;
  }>;
  facilityOverflows: Array<{
    facilityId: string;
    facilityName: string;
    dayOfWeek: string;
    periodNumber: number;
    capacityStreams: number;
    bookedStreams: number;
    entries: Array<{ grade: number; stream: string; subjectName: string }>;
  }>;
  studentGroupConflicts: Array<{
    grade: number;
    stream: string;
    dayOfWeek: string;
    periodNumber: number;
    overlappingStudentIds: string[];
    subjects: string[];
  }>;
  unexplainedBlankSessions: Array<{
    categoryId: TimetableCategoryId;
    grade: number;
    stream: string;
    dayOfWeek: string;
    periodNumber: number;
  }>;
  categoryTotals: CategoryAllocationSummary[];
  streamAllocations: ResolvedStreamAllocation[];
  teacherWorkloads: TeacherWorkloadReport[];
  facilityUtilization: FacilityUtilizationReport[];
  streamCompleteness: StreamCompletenessReport[];
}

export interface TimetableBootstrapResponse {
  schoolId: string;
  school?: SchoolBrandInfo;
  categories: TimetableCategoryMeta[];
  weekdays: string[];
  scheduleConfigs: Record<TimetableCategoryId, ScheduleConfig>;
  subjects: TimetableSubject[];
  gradeOverrides?: GradeSubjectOverride[];
  facilities: TimetableFacility[];
  teacherAssignments: TimetableTeacherAssignment[];
  remedialConfigs: TimetableRemedialConfig[];
  streams: TimetableStream[];
  teachers: DirectoryTeacher[];
  students: DirectoryStudent[];
  versions: TimetableVersion[];
  activeVersion: TimetableVersion | null;
  entries: TimetableEntry[];
  audit: TimetableAuditReport;
  canManage: boolean;
}

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  computer_lab: 'Computer Laboratory',
  ict_robotics_lab: 'ICT / Robotics Lab',
  science_lab: 'Science Laboratory',
  library: 'Library',
  swimming_pool: 'Swimming Pool',
  maktaba_room: 'Maktaba Room',
  clubs_venue: 'Clubs Venue',
  general_room: 'General Room',
};

export function withTenantQuery(url: string, tenantId?: string): string {
  if (!tenantId) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}tenantId=${encodeURIComponent(tenantId)}`;
}

export async function ttApiFetch<T = any>(
  url: string,
  options: RequestInit = {},
  tenantId?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...ClientDataStore.getAuthHeaders(),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(withTenantQuery(url, tenantId), {
    ...options,
    headers,
    credentials: 'include',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload?.error || `Request failed (${response.status})`) as Error & {
      payload?: any;
      status?: number;
    };
    err.payload = payload;
    err.status = response.status;
    throw err;
  }
  return payload as T;
}
