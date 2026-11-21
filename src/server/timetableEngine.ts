import crypto from 'node:crypto';
import type {
  AllocationProcessingMode,
  AssignmentAllocationSource,
  FacilityType,
  PeriodSlotDefinition,
  StudentGroupMode,
  TeacherAssignmentRole,
  TimetableCategoryId,
  TimetableSubjectKind,
} from './timetableSchema.ts';
import { TIMETABLE_CATEGORIES, WEEKDAYS, getCategoryForGrade } from './timetableSchema.ts';

export interface EngineScheduleConfig {
  categoryId: TimetableCategoryId;
  days: string[];
  periodsPerDay: number;
  periodDurationMins: number;
  periods: PeriodSlotDefinition[];
  allocationMode?: AllocationProcessingMode;
}

export interface EngineSubject {
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

export interface EngineFacility {
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

export interface EngineTeacherAssignment {
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

export interface EngineRemedialConfig {
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

export interface EngineStream {
  grade: number;
  stream: string;
  categoryId: TimetableCategoryId;
  studentIds: string[];
}

export interface EngineTimetableEntry {
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

export interface EngineInput {
  scheduleConfigs: Record<TimetableCategoryId, EngineScheduleConfig>;
  subjects: EngineSubject[];
  facilities: EngineFacility[];
  teacherAssignments: EngineTeacherAssignment[];
  remedialConfigs: EngineRemedialConfig[];
  streams: EngineStream[];
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
  candidateAssignments: EngineTeacherAssignment[];
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

export interface GenerateScheduleResult {
  success: boolean;
  entries: EngineTimetableEntry[];
  unplacedTasks: Array<{
    categoryId: TimetableCategoryId;
    grade: number;
    stream: string;
    subjectName: string;
    reason: string;
  }>;
  audit: TimetableAuditReport;
}

function getRegularPeriods(config: EngineScheduleConfig): PeriodSlotDefinition[] {
  const regular = config.periods.filter((p) => p.slotType === 'regular');
  if (regular.length > 0) return regular;
  return config.periods.slice(0, config.periodsPerDay);
}

function getAllPeriods(config: EngineScheduleConfig): PeriodSlotDefinition[] {
  return config.periods;
}

function slotKey(day: string, periodNumber: number): string {
  return `${day}::${periodNumber}`;
}

function streamKey(grade: number, stream: string): string {
  return `G${grade}::${stream}`;
}

function arraysOverlap(a: string[], b: string[]): string[] {
  if (a.length === 0 || b.length === 0) return [];
  const setB = new Set(b);
  return a.filter((id) => setB.has(id));
}

/**
 * Matches teacher assignments to a specific (category, subject, grade, stream).
 * Priority: exact grade+stream match > exact grade match > category-wide subject match.
 */
function findMatchingAssignments(
  assignments: EngineTeacherAssignment[],
  categoryId: TimetableCategoryId,
  subjectId: string,
  grade: number,
  stream: string
): EngineTeacherAssignment[] {
  const normStream = stream.trim().toLowerCase();
  const active = assignments.filter(
    (a) => a.isActive && a.categoryId === categoryId && a.subjectId === subjectId
  );
  const exact = active.filter(
    (a) => a.grade === grade && (a.stream || '').trim().toLowerCase() === normStream
  );
  if (exact.length > 0) return exact;
  const byGrade = active.filter((a) => a.grade === grade && (!a.stream || a.stream.trim() === ''));
  if (byGrade.length > 0) return byGrade;
  return active.filter((a) => a.grade === null && (!a.stream || a.stream.trim() === ''));
}

/**
 * Unified, strictly-linked stream allocation resolver supporting both processing modes:
 *  - Option 1 (`individual_teacher`): Uses individual teacher assignments capturing
 *    (teacher, category, subject, grade, stream, lessonsPerWeek) directly.
 *  - Option 2 (`category_redistribution`): Takes category-level subject weekly allocations,
 *    redistributes them to every active stream in the category, and strictly links each
 *    stream-subject demand to its assigned teacher (enforcing zero duplicate ownership).
 */
export function resolveEffectiveStreamAllocations(
  input: EngineInput
): ResolvedStreamAllocation[] {
  const subjectById = new Map(input.subjects.map((s) => [s.id, s]));
  const resolved: ResolvedStreamAllocation[] = [];

  for (const st of input.streams) {
    const cfg = input.scheduleConfigs[st.categoryId];
    const mode: AllocationProcessingMode = cfg?.allocationMode ?? 'category_redistribution';
    const normStream = st.stream.trim().toLowerCase();

    if (mode === 'individual_teacher') {
      const streamIndiv = input.teacherAssignments.filter(
        (a) =>
          a.isActive &&
          a.categoryId === st.categoryId &&
          a.grade === st.grade &&
          (a.stream || '').trim().toLowerCase() === normStream &&
          (Number(a.lessonsPerWeek) || 0) > 0
      );

      const bySubject = new Map<string, EngineTeacherAssignment[]>();
      for (const a of streamIndiv) {
        const sub = subjectById.get(a.subjectId);
        if (!sub || !sub.isActive || sub.subjectKind === 'remedial') continue;
        if (!bySubject.has(a.subjectId)) bySubject.set(a.subjectId, []);
        bySubject.get(a.subjectId)!.push(a);
      }

      for (const [subId, list] of bySubject.entries()) {
        const sub = subjectById.get(subId)!;
        const uniqueTeachers = Array.from(new Set(list.map((x) => x.teacherId)));
        const hasDuplicate = uniqueTeachers.length > 1 || list.length > 1;
        const primary = list[0];
        resolved.push({
          categoryId: st.categoryId,
          grade: st.grade,
          stream: st.stream,
          subjectId: sub.id,
          subjectName: sub.name,
          subjectKind: sub.subjectKind,
          lessonsPerWeek: Number(primary.lessonsPerWeek) || 0,
          source: 'individual',
          linkedAssignmentId: primary.id,
          teacherId: primary.teacherId,
          teacherName: primary.teacherName,
          candidateAssignments: list,
          status: hasDuplicate ? 'duplicate_conflict' : 'linked',
          conflictTeachers: hasDuplicate ? list.map((x) => x.teacherName) : [],
        });
      }
    } else {
      const catSubjects = input.subjects.filter(
        (s) =>
          s.categoryId === st.categoryId &&
          s.isActive &&
          s.lessonsPerWeek > 0 &&
          s.subjectKind !== 'remedial'
      );

      for (const sub of catSubjects) {
        const matches = findMatchingAssignments(
          input.teacherAssignments,
          st.categoryId,
          sub.id,
          st.grade,
          st.stream
        );

        const distinctTeacherIds = Array.from(new Set(matches.map((m) => m.teacherId)));
        if (matches.length === 0) {
          resolved.push({
            categoryId: st.categoryId,
            grade: st.grade,
            stream: st.stream,
            subjectId: sub.id,
            subjectName: sub.name,
            subjectKind: sub.subjectKind,
            lessonsPerWeek: sub.lessonsPerWeek,
            source: 'category_redistribution',
            linkedAssignmentId: null,
            teacherId: null,
            teacherName: null,
            candidateAssignments: [],
            status: 'unassigned',
            conflictTeachers: [],
          });
        } else if (distinctTeacherIds.length > 1) {
          resolved.push({
            categoryId: st.categoryId,
            grade: st.grade,
            stream: st.stream,
            subjectId: sub.id,
            subjectName: sub.name,
            subjectKind: sub.subjectKind,
            lessonsPerWeek: sub.lessonsPerWeek,
            source: 'category_redistribution',
            linkedAssignmentId: matches[0].id,
            teacherId: matches[0].teacherId,
            teacherName: matches[0].teacherName,
            candidateAssignments: matches,
            status: 'duplicate_conflict',
            conflictTeachers: matches.map((m) => m.teacherName),
          });
        } else {
          resolved.push({
            categoryId: st.categoryId,
            grade: st.grade,
            stream: st.stream,
            subjectId: sub.id,
            subjectName: sub.name,
            subjectKind: sub.subjectKind,
            lessonsPerWeek: sub.lessonsPerWeek,
            source: 'category_redistribution',
            linkedAssignmentId: matches[0].id,
            teacherId: matches[0].teacherId,
            teacherName: matches[0].teacherName,
            candidateAssignments: [matches[0]],
            status: 'linked',
            conflictTeachers: [],
          });
        }
      }
    }
  }

  return resolved;
}

export function computeCategoryTotals(
  input: EngineInput,
  resolvedAllocations?: ResolvedStreamAllocation[]
): CategoryAllocationSummary[] {
  const effective = resolvedAllocations ?? resolveEffectiveStreamAllocations(input);

  return TIMETABLE_CATEGORIES.map((cat) => {
    const cfg = input.scheduleConfigs[cat.id];
    const mode: AllocationProcessingMode = cfg?.allocationMode ?? 'category_redistribution';
    const regularSlotsCount = cfg ? cfg.days.length * getRegularPeriods(cfg).length : 0;
    const catSubjects = input.subjects.filter((s) => s.categoryId === cat.id && s.isActive);
    const catStreams = input.streams.filter((st) => st.categoryId === cat.id);
    const catResolved = effective.filter((r) => r.categoryId === cat.id);

    let allocatedCoreLessons = 0;
    let allocatedCommonLessons = 0;
    let allocatedRemedialLessons = 0;

    if (mode === 'individual_teacher' && catStreams.length > 0) {
      // Average/representative per-stream total in individual mode (or max stream load for capacity visibility)
      let maxStreamRegular = -1;
      for (const st of catStreams) {
        const stRows = catResolved.filter((r) => r.grade === st.grade && r.stream === st.stream);
        const core = stRows
          .filter((r) => r.subjectKind === 'core')
          .reduce((acc, r) => acc + r.lessonsPerWeek, 0);
        const common = stRows
          .filter((r) => r.subjectKind === 'common_activity')
          .reduce((acc, r) => acc + r.lessonsPerWeek, 0);
        if (core + common > maxStreamRegular) {
          maxStreamRegular = core + common;
          allocatedCoreLessons = core;
          allocatedCommonLessons = common;
        }
      }
      allocatedRemedialLessons = catSubjects
        .filter((s) => s.subjectKind === 'remedial')
        .reduce((acc, s) => acc + s.lessonsPerWeek, 0);
    } else {
      for (const s of catSubjects) {
        if (s.subjectKind === 'core') {
          allocatedCoreLessons += s.lessonsPerWeek;
        } else if (s.subjectKind === 'common_activity') {
          allocatedCommonLessons += s.lessonsPerWeek;
        } else if (s.subjectKind === 'remedial') {
          allocatedRemedialLessons += s.lessonsPerWeek;
        }
      }
    }

    const totalAllocatedRegularLessons = allocatedCoreLessons + allocatedCommonLessons;
    const remainingRegularPeriods = regularSlotsCount - totalAllocatedRegularLessons;

    const linkedStreamSlots = catResolved.filter((r) => r.status === 'linked').length;
    const unlinkedStreamSlots = catResolved.filter((r) => r.status === 'unassigned').length;
    const duplicateConflicts = catResolved.filter((r) => r.status === 'duplicate_conflict').length;

    return {
      categoryId: cat.id,
      label: cat.label,
      allocationMode: mode,
      availableRegularPeriods: regularSlotsCount,
      allocatedCoreLessons,
      allocatedCommonLessons,
      allocatedRemedialLessons,
      totalAllocatedRegularLessons,
      remainingRegularPeriods,
      activeStreamCount: catStreams.length,
      linkedStreamSlots,
      unlinkedStreamSlots,
      duplicateConflicts,
    };
  });
}

/**
 * Strict Requirement F & G readiness validation prior to generation (works seamlessly for BOTH
 * Option 1 Individual Teacher Assignment and Option 2 Category Redistribution):
 * - Enforces zero duplicate teacher ownership on any (subject, grade, stream).
 * - Enforces stream period budget (no over-allocation).
 * - Enforces every stream-subject allocation has an authorized linked teacher.
 * - Enforces teacher cumulative weekly load does not exceed physical weekly school slots.
 * - Enforces shared facility capacity across all 3 categories.
 * - Enforces Remedial 1 & 2 configuration completeness.
 */
export function validateTimetableReadiness(input: EngineInput): {
  readyToGenerate: boolean;
  issues: ValidationIssue[];
  categoryTotals: CategoryAllocationSummary[];
  streamAllocations: ResolvedStreamAllocation[];
} {
  const issues: ValidationIssue[] = [];
  const streamAllocations = resolveEffectiveStreamAllocations(input);
  const categoryTotals = computeCategoryTotals(input, streamAllocations);
  const subjectById = new Map(input.subjects.map((s) => [s.id, s]));

  if (input.streams.length === 0) {
    issues.push({
      code: 'NO_ACTIVE_STREAMS',
      severity: 'error',
      message: 'No active grades or streams found. Configure grades and streams in Academic Structure first.',
    });
  }

  let totalConfiguredLessonsAcrossSchool = 0;

  // 1. Validate every resolved stream allocation (duplicate conflicts, missing teachers, facilities)
  for (const alloc of streamAllocations) {
    totalConfiguredLessonsAcrossSchool += alloc.lessonsPerWeek;
    const catLabel =
      TIMETABLE_CATEGORIES.find((c) => c.id === alloc.categoryId)?.label || alloc.categoryId;

    if (alloc.status === 'duplicate_conflict') {
      issues.push({
        code: 'DUPLICATE_STREAM_SUBJECT_ASSIGNMENT',
        severity: 'error',
        categoryId: alloc.categoryId,
        grade: alloc.grade,
        stream: alloc.stream,
        message: `${catLabel} · Grade ${alloc.grade} ${alloc.stream}: "${alloc.subjectName}" has conflicting duplicate teacher assignments (${alloc.conflictTeachers.join(', ')}). Keep exactly one assigned teacher per stream-subject to guarantee zero collisions.`,
      });
    } else if (alloc.status === 'unassigned') {
      issues.push({
        code: 'UNASSIGNED_TEACHER',
        severity: 'error',
        categoryId: alloc.categoryId,
        grade: alloc.grade,
        stream: alloc.stream,
        message: `${catLabel} · Grade ${alloc.grade} ${alloc.stream}: "${alloc.subjectName}" has ${alloc.lessonsPerWeek} lesson(s)/week allocated but no authorized teacher/supervisor assigned.`,
      });
    }

    const sub = subjectById.get(alloc.subjectId);
    if (sub?.requiresFacilityType) {
      const preferredFacId = alloc.candidateAssignments[0]?.facilityId || sub.defaultFacilityId;
      const fac = preferredFacId
        ? input.facilities.find((f) => f.id === preferredFacId && f.isActive)
        : input.facilities.find(
            (f) => f.facilityType === sub.requiresFacilityType && f.isActive
          );
      if (!fac) {
        issues.push({
          code: 'MISSING_FACILITY',
          severity: 'error',
          categoryId: alloc.categoryId,
          grade: alloc.grade,
          stream: alloc.stream,
          message: `${catLabel} · Grade ${alloc.grade} ${alloc.stream}: "${sub.name}" requires an active shared facility (${sub.requiresFacilityType.replace(/_/g, ' ')}), but none is configured.`,
        });
      }
    }
  }

  // 2. Per-stream period budget check across all streams
  for (const st of input.streams) {
    const cfg = input.scheduleConfigs[st.categoryId];
    if (!cfg) continue;
    const availableRegular = cfg.days.length * getRegularPeriods(cfg).length;
    const stRows = streamAllocations.filter((r) => r.grade === st.grade && r.stream === st.stream);
    const streamRegularTotal = stRows.reduce((acc, r) => acc + r.lessonsPerWeek, 0);
    const catLabel =
      TIMETABLE_CATEGORIES.find((c) => c.id === st.categoryId)?.label || st.categoryId;

    if (streamRegularTotal > availableRegular) {
      issues.push({
        code: 'OVER_ALLOCATED_CATEGORY',
        severity: 'error',
        categoryId: st.categoryId,
        grade: st.grade,
        stream: st.stream,
        message: `${catLabel} · Grade ${st.grade} ${st.stream}: Allocated weekly lessons (${streamRegularTotal}) exceed available weekly periods (${availableRegular}). Reduce lessons or increase periods per day.`,
      });
    } else if (streamRegularTotal > 0 && streamRegularTotal < availableRegular) {
      issues.push({
        code: 'UNEXPLAINED_BLANK_POTENTIAL',
        severity: 'warning',
        categoryId: st.categoryId,
        grade: st.grade,
        stream: st.stream,
        message: `${catLabel} · Grade ${st.grade} ${st.stream}: ${availableRegular - streamRegularTotal} regular weekly period(s) remain unallocated (${streamRegularTotal}/${availableRegular}).`,
      });
    }
  }

  // 3. Check Remedial 1 and Remedial 2 per category
  for (const summary of categoryTotals) {
    const catStreams = input.streams.filter((st) => st.categoryId === summary.categoryId);
    if (catStreams.length === 0) continue;
    const catSubjects = input.subjects.filter(
      (s) => s.categoryId === summary.categoryId && s.isActive
    );
    const remedialSubjects = catSubjects.filter((s) => s.subjectKind === 'remedial');

    for (const remSub of remedialSubjects) {
      const configsForSub = input.remedialConfigs.filter(
        (rc) => rc.isActive && rc.categoryId === summary.categoryId && rc.subjectId === remSub.id
      );
      totalConfiguredLessonsAcrossSchool += configsForSub.reduce(
        (acc, rc) => acc + rc.weeklyFrequency,
        0
      );
      if (remSub.lessonsPerWeek > 0 && configsForSub.length === 0) {
        issues.push({
          code: 'MISSING_REMEDIAL_CONFIG',
          severity: 'error',
          categoryId: summary.categoryId,
          message: `${summary.label}: "${remSub.name}" has ${remSub.lessonsPerWeek} lesson(s)/week allocated, but no remedial session configuration (teacher, grade/stream, student group, periods) has been created.`,
        });
      }
      for (const rc of configsForSub) {
        if (!rc.teacherId) {
          issues.push({
            code: 'REMEDIAL_NO_TEACHER',
            severity: 'error',
            categoryId: summary.categoryId,
            grade: rc.grade,
            stream: rc.stream,
            message: `${summary.label} · Grade ${rc.grade} ${rc.stream}: ${remSub.name} requires an assigned remedial teacher.`,
          });
        }
        if (rc.studentGroupMode === 'selected_learners' && rc.studentIds.length === 0) {
          issues.push({
            code: 'REMEDIAL_NO_STUDENTS',
            severity: 'error',
            categoryId: summary.categoryId,
            grade: rc.grade,
            stream: rc.stream,
            message: `${summary.label} · Grade ${rc.grade} ${rc.stream}: ${remSub.name} is set to Selected Learners but no students are selected.`,
          });
        }
      }
    }
  }

  if (totalConfiguredLessonsAcrossSchool === 0) {
    issues.push({
      code: 'ZERO_LESSONS_CONFIGURED',
      severity: 'error',
      message: 'No weekly lessons have been allocated yet. Configure individual teacher stream assignments (Option 1) or category weekly allocations (Option 2) before generating.',
    });
  }

  // 4. Cross-category shared facility total weekly demand vs capacity check (from effective resolved allocations)
  const facilityDemand = new Map<string, number>();
  for (const alloc of streamAllocations) {
    const sub = subjectById.get(alloc.subjectId);
    if (!sub) continue;
    const preferredFacId = alloc.candidateAssignments[0]?.facilityId || sub.defaultFacilityId;
    const fac = preferredFacId
      ? input.facilities.find((f) => f.id === preferredFacId && f.isActive)
      : sub.requiresFacilityType
        ? input.facilities.find((f) => f.facilityType === sub.requiresFacilityType && f.isActive)
        : undefined;
    if (!fac) continue;
    facilityDemand.set(fac.id, (facilityDemand.get(fac.id) || 0) + alloc.lessonsPerWeek);
  }

  for (const [facId, totalDemand] of facilityDemand.entries()) {
    const fac = input.facilities.find((f) => f.id === facId);
    if (!fac) continue;
    const weeklyCapacity =
      fac.availableDays.length * fac.availablePeriods.length * Math.max(1, fac.capacityStreams);
    if (totalDemand > weeklyCapacity) {
      issues.push({
        code: 'FACILITY_CAPACITY_EXCEEDED',
        severity: 'error',
        message: `Shared facility "${fac.name}" demand across all categories (${totalDemand} stream-periods/week) exceeds its weekly capacity (${weeklyCapacity} = ${fac.availableDays.length} days × ${fac.availablePeriods.length} periods × ${fac.capacityStreams} concurrent stream(s)).`,
      });
    }
  }

  // 5. Teacher aggregate workload & physical weekly slot collision feasibility check
  const maxPhysicalRegularSlots = Math.max(
    1,
    ...Object.values(input.scheduleConfigs).map((c) => c.days.length * getRegularPeriods(c).length)
  );
  const maxPhysicalTotalSlots = Math.max(
    maxPhysicalRegularSlots,
    ...Object.values(input.scheduleConfigs).map((c) => c.days.length * getAllPeriods(c).length)
  );

  const teacherProjectedDemand = new Map<
    string,
    { name: string; regularDemand: number; totalDemand: number; max: number }
  >();

  for (const alloc of streamAllocations) {
    if (alloc.status !== 'linked' || !alloc.teacherId) continue;
    const a = alloc.candidateAssignments[0];
    const prev = teacherProjectedDemand.get(alloc.teacherId) || {
      name: alloc.teacherName || a?.teacherName || alloc.teacherId,
      regularDemand: 0,
      totalDemand: 0,
      max: a?.maxWeeklyPeriods ?? 28,
    };
    prev.regularDemand += alloc.lessonsPerWeek;
    prev.totalDemand += alloc.lessonsPerWeek;
    if (a) prev.max = Math.max(prev.max, a.maxWeeklyPeriods);
    teacherProjectedDemand.set(alloc.teacherId, prev);
  }

  for (const rc of input.remedialConfigs) {
    if (!rc.isActive || !rc.teacherId || rc.weeklyFrequency <= 0) continue;
    const prev = teacherProjectedDemand.get(rc.teacherId) || {
      name: rc.teacherName,
      regularDemand: 0,
      totalDemand: 0,
      max: 35,
    };
    prev.totalDemand += rc.weeklyFrequency;
    teacherProjectedDemand.set(rc.teacherId, prev);
  }

  for (const [, info] of teacherProjectedDemand.entries()) {
    if (info.regularDemand > maxPhysicalRegularSlots || info.totalDemand > maxPhysicalTotalSlots) {
      issues.push({
        code: 'TEACHER_IMPOSSIBLE_WEEKLY_LOAD',
        severity: 'error',
        message: `Teacher ${info.name} is assigned ${info.regularDemand} regular (${info.totalDemand} total) periods/week, which exceeds the school's ${maxPhysicalRegularSlots} regular (${maxPhysicalTotalSlots} total) weekly slots and would cause a guaranteed teacher collision. Reassign some streams to another teacher.`,
      });
    } else if (info.totalDemand > info.max) {
      issues.push({
        code: 'TEACHER_MAX_LOAD_EXCEEDED',
        severity: 'warning',
        message: `Teacher ${info.name} is projected for ${info.totalDemand} periods/week, exceeding their configured maximum of ${info.max} periods/week.`,
      });
    }
  }

  const hasError = issues.some((i) => i.severity === 'error');
  return {
    readyToGenerate: !hasError,
    issues,
    categoryTotals,
    streamAllocations,
  };
}

interface PlacementTask {
  taskId: string;
  categoryId: TimetableCategoryId;
  grade: number;
  stream: string;
  subject: EngineSubject;
  remedialConfig: EngineRemedialConfig | null;
  candidateAssignments: EngineTeacherAssignment[];
  facility: EngineFacility | null;
  allowedDays: string[];
  allowedPeriods: number[];
  studentGroupMode: StudentGroupMode;
  studentGroupName: string;
  studentIds: string[];
  durationMinsOverride: number | null;
  constraintTightness: number;
}

/**
 * Constraint-aware timetable generator supporting:
 * - Independent Category 1, 2, 3 subject & activity allocations
 * - Zero teacher collisions across all categories/streams/remedials/clubs/maktaba
 * - Shared facility capacity enforcement across all 3 categories
 * - Remedial 1 & 2 participating student-group overlap verification
 * - Clubs & Maktaba supervisor, day, and period constraints
 */
export function generateTimetableSchedule(input: EngineInput): GenerateScheduleResult {
  const readiness = validateTimetableReadiness(input);
  if (!readiness.readyToGenerate) {
    const audit = validateTimetableEntries(input, []);
    return {
      success: false,
      entries: [],
      unplacedTasks: [],
      audit,
    };
  }

  const tasks: PlacementTask[] = [];
  const facilityById = new Map<string, EngineFacility>();
  for (const f of input.facilities) {
    if (f.isActive) facilityById.set(f.id, f);
  }

  const resolveFacility = (
    preferredFacilityId: string | null,
    requiredType: FacilityType | null
  ): EngineFacility | null => {
    if (preferredFacilityId && facilityById.has(preferredFacilityId)) {
      return facilityById.get(preferredFacilityId)!;
    }
    if (requiredType) {
      return (
        input.facilities.find((f) => f.isActive && f.facilityType === requiredType) ?? null
      );
    }
    return null;
  };

  // Build regular + common activity tasks directly from resolved, strictly-linked stream allocations
  // (Supports BOTH Option 1 Individual Teacher Assignment and Option 2 Category Redistribution)
  const subjectById = new Map(input.subjects.map((s) => [s.id, s]));
  const streamByKey = new Map(
    input.streams.map((st) => [`${st.grade}::${st.stream.trim().toLowerCase()}`, st])
  );

  for (const alloc of readiness.streamAllocations) {
    if (alloc.status !== 'linked' || alloc.lessonsPerWeek <= 0) continue;
    const sub = subjectById.get(alloc.subjectId);
    const cfg = input.scheduleConfigs[alloc.categoryId];
    const st = streamByKey.get(`${alloc.grade}::${alloc.stream.trim().toLowerCase()}`);
    if (!sub || !cfg || !st || alloc.candidateAssignments.length === 0) continue;

    const regularPeriods = getRegularPeriods(cfg).map((p) => p.periodNumber);
    const primaryAssignment = alloc.candidateAssignments[0];
    const fac = resolveFacility(
      primaryAssignment.facilityId || sub.defaultFacilityId,
      sub.requiresFacilityType
    );

    let allowedDays = cfg.days.slice();
    if (sub.allowedDays.length > 0) {
      allowedDays = allowedDays.filter((d) => sub.allowedDays.includes(d));
    }
    if (fac && fac.availableDays.length > 0) {
      allowedDays = allowedDays.filter((d) => fac.availableDays.includes(d));
    }

    let allowedPeriods = regularPeriods.slice();
    if (sub.allowedPeriods.length > 0) {
      allowedPeriods = allowedPeriods.filter((p) => sub.allowedPeriods.includes(p));
    }
    if (fac && fac.availablePeriods.length > 0) {
      allowedPeriods = allowedPeriods.filter((p) => fac.availablePeriods.includes(p));
    }

    const tightness =
      (fac ? 0 : 100) +
      allowedDays.length * allowedPeriods.length +
      alloc.candidateAssignments.length * 10 +
      (sub.subjectKind === 'common_activity' ? -20 : 0);

    for (let i = 0; i < alloc.lessonsPerWeek; i++) {
      tasks.push({
        taskId: `${st.grade}_${st.stream}_${sub.id}_${i}`,
        categoryId: st.categoryId,
        grade: st.grade,
        stream: st.stream,
        subject: sub,
        remedialConfig: null,
        candidateAssignments: alloc.candidateAssignments,
        facility: fac,
        allowedDays,
        allowedPeriods,
        studentGroupMode: 'whole_stream',
        studentGroupName: `Grade ${st.grade} ${st.stream}`,
        studentIds: st.studentIds,
        durationMinsOverride: null,
        constraintTightness: tightness,
      });
    }
  }

  // Build Remedial 1 & Remedial 2 tasks from explicit remedial configurations
  for (const rc of input.remedialConfigs) {
    if (!rc.isActive || rc.weeklyFrequency <= 0 || !rc.teacherId) continue;
    const sub = input.subjects.find((s) => s.id === rc.subjectId && s.isActive);
    if (!sub) continue;
    const catId = getCategoryForGrade(rc.grade);
    const cfg = input.scheduleConfigs[catId];
    if (!cfg) continue;

    const allPeriods = getAllPeriods(cfg).map((p) => p.periodNumber);
    const remedialPeriods = cfg.periods
      .filter((p) => p.slotType === 'remedial')
      .map((p) => p.periodNumber);

    const allowedDays =
      rc.availableDays.length > 0
        ? cfg.days.filter((d) => rc.availableDays.includes(d))
        : cfg.days.slice();

    const allowedPeriods =
      rc.availablePeriods.length > 0
        ? allPeriods.filter((p) => rc.availablePeriods.includes(p))
        : remedialPeriods.length > 0
          ? remedialPeriods
          : allPeriods;

    const fac = resolveFacility(rc.facilityId || sub.defaultFacilityId, sub.requiresFacilityType);
    const streamObj = input.streams.find((s) => s.grade === rc.grade && s.stream === rc.stream);

    const syntheticAssignment: EngineTeacherAssignment = {
      id: `rem_assign_${rc.id}`,
      teacherId: rc.teacherId,
      teacherName: rc.teacherName,
      teacherEmail: '',
      categoryId: catId,
      subjectId: sub.id,
      grade: rc.grade,
      stream: rc.stream,
      roleType: 'remedial_teacher',
      maxWeeklyPeriods: 40,
      facilityId: fac?.id ?? null,
      equipmentNotes: '',
      allowedDays,
      allowedPeriods,
      isActive: true,
    };

    const participatingStudentIds =
      rc.studentGroupMode === 'selected_learners'
        ? rc.studentIds
        : streamObj?.studentIds ?? [];

    for (let i = 0; i < rc.weeklyFrequency; i++) {
      tasks.push({
        taskId: `rem_${rc.id}_${i}`,
        categoryId: catId,
        grade: rc.grade,
        stream: rc.stream,
        subject: sub,
        remedialConfig: rc,
        candidateAssignments: [syntheticAssignment],
        facility: fac,
        allowedDays,
        allowedPeriods,
        studentGroupMode: rc.studentGroupMode,
        studentGroupName:
          rc.studentGroupName ||
          (rc.studentGroupMode === 'selected_learners'
            ? `${sub.name} Group (${participatingStudentIds.length})`
            : `Grade ${rc.grade} ${rc.stream}`),
        studentIds: participatingStudentIds,
        durationMinsOverride: rc.durationMins || null,
        // Place remedial tasks after regular whole-stream lessons unless restricted to regular periods
        constraintTightness: 500 + allowedDays.length * allowedPeriods.length,
      });
    }
  }

  // Sort by MRV tightness (tightest tasks first; regular/facility/clubs before remedial)
  tasks.sort((a, b) => a.constraintTightness - b.constraintTightness);

  // Occupancy maps
  const entries: EngineTimetableEntry[] = [];
  const teacherBusy = new Map<string, Set<string>>(); // teacherId -> Set<slotKey>
  const teacherLoad = new Map<string, number>(); // teacherId -> count
  const facilityUsage = new Map<string, Map<string, number>>(); // facilityId -> slotKey -> count
  const streamWholeOccupied = new Map<string, Set<string>>(); // streamKey -> Set<slotKey>
  const streamEntriesBySlot = new Map<string, EngineTimetableEntry[]>(); // `${streamKey}::${slotKey}` -> entries
  const subjectPerStreamDayCount = new Map<string, number>(); // `${streamKey}::${subjectId}::${day}` -> count

  const isTeacherFree = (teacherId: string, sk: string): boolean => {
    return !(teacherBusy.get(teacherId)?.has(sk));
  };

  const isFacilityAvailable = (fac: EngineFacility | null, day: string, periodNum: number): boolean => {
    if (!fac) return true;
    if (fac.availableDays.length > 0 && !fac.availableDays.includes(day)) return false;
    if (fac.availablePeriods.length > 0 && !fac.availablePeriods.includes(periodNum)) return false;
    const sk = slotKey(day, periodNum);
    const used = facilityUsage.get(fac.id)?.get(sk) ?? 0;
    return used < Math.max(1, fac.capacityStreams);
  };

  const canPlaceForStreamAndStudents = (task: PlacementTask, sk: string): boolean => {
    const stKey = streamKey(task.grade, task.stream);
    const combinedKey = `${stKey}::${sk}`;
    const existing = streamEntriesBySlot.get(combinedKey) ?? [];

    if (task.studentGroupMode === 'whole_stream') {
      // Whole-stream regular lesson cannot share a slot with another whole-stream lesson
      // nor with a remedial session that includes learners from this stream (unless remedial is in a remedial slot)
      if (streamWholeOccupied.get(stKey)?.has(sk)) return false;
      if (existing.length > 0) return false;
      return true;
    }

    // Selected-learners remedial session:
    // Cannot collide with a whole-stream regular lesson if those learners would be in class at the same period,
    // UNLESS it's a dedicated remedial slot or no overlapping participating students are occupied.
    // Specifically: if a whole-stream lesson occupies this period, participating learners in that stream are in that regular lesson!
    // However, two separate selected-learner remedial sessions in the SAME period with DISJOINT studentIds CAN run concurrently!
    for (const ex of existing) {
      if (ex.studentGroupMode === 'whole_stream') {
        // Whole stream includes all learners of the stream -> conflicts with selected learners
        return false;
      }
      // Both are selected_learners -> check actual participating student_ids overlap
      const overlap = arraysOverlap(task.studentIds, ex.studentIds);
      if (overlap.length > 0) return false;
    }
    return true;
  };

  const placeEntry = (
    task: PlacementTask,
    assignment: EngineTeacherAssignment,
    day: string,
    periodSlot: PeriodSlotDefinition
  ): EngineTimetableEntry => {
    const sk = slotKey(day, periodSlot.periodNumber);
    const stKey = streamKey(task.grade, task.stream);
    const combinedKey = `${stKey}::${sk}`;
    const durationMins = task.durationMinsOverride || periodSlot.durationMins;

    const entry: EngineTimetableEntry = {
      id: `tte_${crypto.randomBytes(6).toString('hex')}`,
      categoryId: task.categoryId,
      grade: task.grade,
      stream: task.stream,
      dayOfWeek: day,
      periodNumber: periodSlot.periodNumber,
      startTime: periodSlot.startTime,
      endTime: periodSlot.endTime,
      durationMins,
      subjectId: task.subject.id,
      subjectName: task.subject.name,
      subjectKind: task.subject.subjectKind,
      teacherId: assignment.teacherId,
      teacherName: assignment.teacherName,
      facilityId: task.facility?.id ?? null,
      facilityName: task.facility?.name ?? null,
      remedialConfigId: task.remedialConfig?.id ?? null,
      studentGroupMode: task.studentGroupMode,
      studentGroupName: task.studentGroupName,
      studentIds: task.studentIds,
      isLocked: false,
      notes: task.remedialConfig?.notes || task.subject.equipmentNotes || '',
    };

    entries.push(entry);

    if (!teacherBusy.has(assignment.teacherId)) teacherBusy.set(assignment.teacherId, new Set());
    teacherBusy.get(assignment.teacherId)!.add(sk);
    teacherLoad.set(assignment.teacherId, (teacherLoad.get(assignment.teacherId) ?? 0) + 1);

    if (task.facility) {
      if (!facilityUsage.has(task.facility.id)) facilityUsage.set(task.facility.id, new Map());
      const fm = facilityUsage.get(task.facility.id)!;
      fm.set(sk, (fm.get(sk) ?? 0) + 1);
    }

    if (task.studentGroupMode === 'whole_stream') {
      if (!streamWholeOccupied.has(stKey)) streamWholeOccupied.set(stKey, new Set());
      streamWholeOccupied.get(stKey)!.add(sk);
    }

    if (!streamEntriesBySlot.has(combinedKey)) streamEntriesBySlot.set(combinedKey, []);
    streamEntriesBySlot.get(combinedKey)!.push(entry);

    const daySubKey = `${stKey}::${task.subject.id}::${day}`;
    subjectPerStreamDayCount.set(daySubKey, (subjectPerStreamDayCount.get(daySubKey) ?? 0) + 1);

    return entry;
  };

  const removeEntry = (entry: EngineTimetableEntry): void => {
    const idx = entries.findIndex((e) => e.id === entry.id);
    if (idx !== -1) entries.splice(idx, 1);

    const sk = slotKey(entry.dayOfWeek, entry.periodNumber);
    const stKey = streamKey(entry.grade, entry.stream);
    const combinedKey = `${stKey}::${sk}`;

    teacherBusy.get(entry.teacherId)?.delete(sk);
    teacherLoad.set(entry.teacherId, Math.max(0, (teacherLoad.get(entry.teacherId) ?? 1) - 1));

    if (entry.facilityId) {
      const fm = facilityUsage.get(entry.facilityId);
      if (fm) fm.set(sk, Math.max(0, (fm.get(sk) ?? 1) - 1));
    }

    if (entry.studentGroupMode === 'whole_stream') {
      streamWholeOccupied.get(stKey)?.delete(sk);
    }

    const list = streamEntriesBySlot.get(combinedKey);
    if (list) {
      const next = list.filter((e) => e.id !== entry.id);
      if (next.length === 0) streamEntriesBySlot.delete(combinedKey);
      else streamEntriesBySlot.set(combinedKey, next);
    }

    const daySubKey = `${stKey}::${entry.subjectId}::${entry.dayOfWeek}`;
    subjectPerStreamDayCount.set(daySubKey, Math.max(0, (subjectPerStreamDayCount.get(daySubKey) ?? 1) - 1));
  };

  const findBestCandidate = (
    task: PlacementTask
  ): { assignment: EngineTeacherAssignment; day: string; periodSlot: PeriodSlotDefinition; score: number } | null => {
    const cfg = input.scheduleConfigs[task.categoryId];
    if (!cfg) return null;
    const periodMap = new Map(cfg.periods.map((p) => [p.periodNumber, p]));
    const stKey = streamKey(task.grade, task.stream);

    let best: {
      assignment: EngineTeacherAssignment;
      day: string;
      periodSlot: PeriodSlotDefinition;
      score: number;
    } | null = null;

    for (const assignment of task.candidateAssignments) {
      const currentLoad = teacherLoad.get(assignment.teacherId) ?? 0;

      for (const day of task.allowedDays) {
        if (assignment.allowedDays.length > 0 && !assignment.allowedDays.includes(day)) continue;

        for (const periodNum of task.allowedPeriods) {
          if (assignment.allowedPeriods.length > 0 && !assignment.allowedPeriods.includes(periodNum)) {
            continue;
          }
          const periodSlot = periodMap.get(periodNum);
          if (!periodSlot) continue;

          const sk = slotKey(day, periodNum);
          if (!isTeacherFree(assignment.teacherId, sk)) continue;
          if (!isFacilityAvailable(task.facility, day, periodNum)) continue;
          if (!canPlaceForStreamAndStudents(task, sk)) continue;

          // Score slot: prefer spreading same subject across different days, prefer balanced teacher load,
          // prefer remedial slot for remedial sessions if available
          const sameDayCount = subjectPerStreamDayCount.get(`${stKey}::${task.subject.id}::${day}`) ?? 0;
          const overloadPenalty = currentLoad >= assignment.maxWeeklyPeriods ? 500 : 0;
          const remedialSlotBonus =
            task.remedialConfig && periodSlot.slotType === 'remedial' ? -30 : 0;
          // Mild spread across days based on day index & stream hash to avoid clumping
          const dayIdx = WEEKDAYS.indexOf(day as (typeof WEEKDAYS)[number]);
          const score =
            sameDayCount * 100 +
            overloadPenalty +
            currentLoad * 3 +
            remedialSlotBonus +
            periodNum * 2 +
            ((dayIdx + task.grade) % 5);

          if (!best || score < best.score) {
            best = { assignment, day, periodSlot, score };
          }
        }
      }
    }

    return best;
  };

  const unplacedTasks: GenerateScheduleResult['unplacedTasks'] = [];

  for (const task of tasks) {
    const candidate = findBestCandidate(task);
    if (candidate) {
      placeEntry(task, candidate.assignment, candidate.day, candidate.periodSlot);
      continue;
    }

    // Single-step Kempe-style swap repair: try relocating an existing entry in the same stream
    // so that this task can take its freed slot while preserving zero collisions.
    let repaired = false;
    const cfg = input.scheduleConfigs[task.categoryId];
    if (cfg && task.studentGroupMode === 'whole_stream') {
      const periodMap = new Map(cfg.periods.map((p) => [p.periodNumber, p]));
      const streamEntries = entries.filter(
        (e) =>
          e.grade === task.grade &&
          e.stream === task.stream &&
          e.studentGroupMode === 'whole_stream' &&
          task.allowedDays.includes(e.dayOfWeek) &&
          task.allowedPeriods.includes(e.periodNumber)
      );

      for (const blocker of streamEntries) {
        const blockerSk = slotKey(blocker.dayOfWeek, blocker.periodNumber);
        const blockerPeriod = periodMap.get(blocker.periodNumber);
        if (!blockerPeriod) continue;

        // Check if our task's teacher & facility could take blocker's slot
        const eligibleAssignment = task.candidateAssignments.find(
          (a) =>
            isTeacherFree(a.teacherId, blockerSk) &&
            (a.allowedDays.length === 0 || a.allowedDays.includes(blocker.dayOfWeek)) &&
            (a.allowedPeriods.length === 0 || a.allowedPeriods.includes(blocker.periodNumber))
        );
        if (!eligibleAssignment) continue;
        if (!isFacilityAvailable(task.facility, blocker.dayOfWeek, blocker.periodNumber)) continue;

        // Temporarily remove blocker and see if blocker can move somewhere else cleanly
        const blockerSub = input.subjects.find((s) => s.id === blocker.subjectId);
        if (!blockerSub) continue;
        const blockerFac = blocker.facilityId ? facilityById.get(blocker.facilityId) ?? null : null;
        const blockerAssigns = findMatchingAssignments(
          input.teacherAssignments,
          blocker.categoryId,
          blocker.subjectId,
          blocker.grade,
          blocker.stream
        );

        removeEntry(blocker);
        const placedNew = placeEntry(task, eligibleAssignment, blocker.dayOfWeek, blockerPeriod);

        const blockerTask: PlacementTask = {
          taskId: `repair_${blocker.id}`,
          categoryId: blocker.categoryId,
          grade: blocker.grade,
          stream: blocker.stream,
          subject: blockerSub,
          remedialConfig: null,
          candidateAssignments:
            blockerAssigns.length > 0
              ? blockerAssigns
              : [
                  {
                    id: 'fallback',
                    teacherId: blocker.teacherId,
                    teacherName: blocker.teacherName,
                    teacherEmail: '',
                    categoryId: blocker.categoryId,
                    subjectId: blocker.subjectId,
                    grade: blocker.grade,
                    stream: blocker.stream,
                    roleType: 'subject_teacher',
                    maxWeeklyPeriods: 35,
                    facilityId: blocker.facilityId,
                    equipmentNotes: '',
                    allowedDays: [],
                    allowedPeriods: [],
                    isActive: true,
                  },
                ],
          facility: blockerFac,
          allowedDays:
            blockerSub.allowedDays.length > 0
              ? cfg.days.filter((d) => blockerSub.allowedDays.includes(d))
              : cfg.days,
          allowedPeriods:
            blockerSub.allowedPeriods.length > 0
              ? getRegularPeriods(cfg)
                  .map((p) => p.periodNumber)
                  .filter((p) => blockerSub.allowedPeriods.includes(p))
              : getRegularPeriods(cfg).map((p) => p.periodNumber),
          studentGroupMode: blocker.studentGroupMode,
          studentGroupName: blocker.studentGroupName,
          studentIds: blocker.studentIds,
          durationMinsOverride: null,
          constraintTightness: 0,
        };

        const relocated = findBestCandidate(blockerTask);
        if (relocated) {
          placeEntry(blockerTask, relocated.assignment, relocated.day, relocated.periodSlot);
          repaired = true;
          break;
        } else {
          // Roll back swap
          removeEntry(placedNew);
          placeEntry(
            blockerTask,
            blockerTask.candidateAssignments[0],
            blocker.dayOfWeek,
            blockerPeriod
          );
        }
      }
    }

    if (!repaired) {
      unplacedTasks.push({
        categoryId: task.categoryId,
        grade: task.grade,
        stream: task.stream,
        subjectName: task.subject.name,
        reason: task.facility
          ? `No conflict-free slot with teacher and shared facility "${task.facility.name}" both available.`
          : 'No conflict-free slot available without causing teacher or student-group collision.',
      });
    }
  }

  const audit = validateTimetableEntries(input, entries);
  return {
    success: unplacedTasks.length === 0 && audit.teacherCollisions.length === 0 && audit.facilityOverflows.length === 0 && audit.studentGroupConflicts.length === 0,
    entries,
    unplacedTasks,
    audit,
  };
}

/**
 * Full timetable validation audit covering Requirement G:
 * - Zero teacher collisions
 * - Shared facility booking capacity across all 3 categories
 * - Participating student-group overlap verification for Remedial 1 & 2
 * - Zero-unexplained-blank-session check across active streams
 * - Teacher workload calculations (core, common activities, clubs/maktaba, remedial)
 * - Stream completeness checks
 */
export function validateTimetableEntries(
  input: EngineInput,
  entries: EngineTimetableEntry[]
): TimetableAuditReport {
  const readiness = validateTimetableReadiness(input);

  // 1. Teacher collision check
  const byTeacherSlot = new Map<string, EngineTimetableEntry[]>();
  for (const e of entries) {
    const key = `${e.teacherId}::${e.dayOfWeek}::${e.periodNumber}`;
    if (!byTeacherSlot.has(key)) byTeacherSlot.set(key, []);
    byTeacherSlot.get(key)!.push(e);
  }
  const teacherCollisions: TimetableAuditReport['teacherCollisions'] = [];
  for (const list of byTeacherSlot.values()) {
    if (list.length > 1) {
      teacherCollisions.push({
        teacherId: list[0].teacherId,
        teacherName: list[0].teacherName,
        dayOfWeek: list[0].dayOfWeek,
        periodNumber: list[0].periodNumber,
        entries: list.map((x) => ({
          grade: x.grade,
          stream: x.stream,
          subjectName: x.subjectName,
        })),
      });
    }
  }

  // 2. Shared facility capacity & utilization check across all 3 categories
  const facilityMap = new Map(input.facilities.map((f) => [f.id, f]));
  const byFacilitySlot = new Map<string, EngineTimetableEntry[]>();
  const facilityBookingsByCat = new Map<string, Record<TimetableCategoryId, number>>();
  const facilityTotalBooked = new Map<string, number>();
  const facilityPeak = new Map<string, number>();
  const facilityOverflowCount = new Map<string, number>();

  for (const f of input.facilities) {
    facilityBookingsByCat.set(f.id, { cat_1_3: 0, cat_4_6: 0, cat_7_9: 0 });
    facilityTotalBooked.set(f.id, 0);
    facilityPeak.set(f.id, 0);
    facilityOverflowCount.set(f.id, 0);
  }

  for (const e of entries) {
    if (!e.facilityId) continue;
    const key = `${e.facilityId}::${e.dayOfWeek}::${e.periodNumber}`;
    if (!byFacilitySlot.has(key)) byFacilitySlot.set(key, []);
    byFacilitySlot.get(key)!.push(e);

    facilityTotalBooked.set(e.facilityId, (facilityTotalBooked.get(e.facilityId) ?? 0) + 1);
    const catRec = facilityBookingsByCat.get(e.facilityId);
    if (catRec) catRec[e.categoryId] = (catRec[e.categoryId] ?? 0) + 1;
  }

  const facilityOverflows: TimetableAuditReport['facilityOverflows'] = [];
  for (const list of byFacilitySlot.values()) {
    const facId = list[0].facilityId!;
    const fac = facilityMap.get(facId);
    const cap = Math.max(1, fac?.capacityStreams ?? 1);
    facilityPeak.set(facId, Math.max(facilityPeak.get(facId) ?? 0, list.length));

    if (list.length > cap) {
      facilityOverflowCount.set(facId, (facilityOverflowCount.get(facId) ?? 0) + 1);
      facilityOverflows.push({
        facilityId: facId,
        facilityName: fac?.name ?? list[0].facilityName ?? facId,
        dayOfWeek: list[0].dayOfWeek,
        periodNumber: list[0].periodNumber,
        capacityStreams: cap,
        bookedStreams: list.length,
        entries: list.map((x) => ({
          grade: x.grade,
          stream: x.stream,
          subjectName: x.subjectName,
        })),
      });
    }
  }

  const facilityUtilization: FacilityUtilizationReport[] = input.facilities
    .filter((f) => f.isActive)
    .map((f) => ({
      facilityId: f.id,
      facilityName: f.name,
      facilityType: f.facilityType,
      capacityStreams: f.capacityStreams,
      totalBookedSlots: facilityTotalBooked.get(f.id) ?? 0,
      peakConcurrentStreams: facilityPeak.get(f.id) ?? 0,
      overflowSlots: facilityOverflowCount.get(f.id) ?? 0,
      bookingsByCategory: facilityBookingsByCat.get(f.id) ?? {
        cat_1_3: 0,
        cat_4_6: 0,
        cat_7_9: 0,
      },
    }));

  // 3. Participating student-group overlap check (Remedial 1 & 2 vs other sessions)
  const byStreamSlot = new Map<string, EngineTimetableEntry[]>();
  for (const e of entries) {
    const key = `${e.grade}::${e.stream}::${e.dayOfWeek}::${e.periodNumber}`;
    if (!byStreamSlot.has(key)) byStreamSlot.set(key, []);
    byStreamSlot.get(key)!.push(e);
  }

  const studentGroupConflicts: TimetableAuditReport['studentGroupConflicts'] = [];
  for (const list of byStreamSlot.values()) {
    if (list.length <= 1) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        let overlap: string[] = [];
        if (a.studentGroupMode === 'whole_stream' || b.studentGroupMode === 'whole_stream') {
          overlap =
            a.studentGroupMode === 'selected_learners'
              ? a.studentIds
              : b.studentGroupMode === 'selected_learners'
                ? b.studentIds
                : ['WHOLE_STREAM'];
        } else {
          overlap = arraysOverlap(a.studentIds, b.studentIds);
        }
        if (overlap.length > 0) {
          studentGroupConflicts.push({
            grade: a.grade,
            stream: a.stream,
            dayOfWeek: a.dayOfWeek,
            periodNumber: a.periodNumber,
            overlappingStudentIds: overlap,
            subjects: [a.subjectName, b.subjectName],
          });
        }
      }
    }
  }

  // 4. Zero-unexplained-blank-session & stream completeness checks
  const unexplainedBlankSessions: TimetableAuditReport['unexplainedBlankSessions'] = [];
  const streamCompleteness: StreamCompletenessReport[] = [];

  for (const st of input.streams) {
    const cfg = input.scheduleConfigs[st.categoryId];
    if (!cfg) continue;
    const regularPeriods = getRegularPeriods(cfg);
    const expectedRegularPeriods = cfg.days.length * regularPeriods.length;

    const streamEntries = entries.filter((e) => e.grade === st.grade && e.stream === st.stream);
    const regularEntries = streamEntries.filter((e) =>
      regularPeriods.some((rp) => rp.periodNumber === e.periodNumber)
    );
    const remedialEntries = streamEntries.filter((e) => e.subjectKind === 'remedial');

    let blanks = 0;
    for (const day of cfg.days) {
      for (const rp of regularPeriods) {
        const occupied = streamEntries.some(
          (e) => e.dayOfWeek === day && e.periodNumber === rp.periodNumber
        );
        if (!occupied) {
          blanks += 1;
          unexplainedBlankSessions.push({
            categoryId: st.categoryId,
            grade: st.grade,
            stream: st.stream,
            dayOfWeek: day,
            periodNumber: rp.periodNumber,
          });
        }
      }
    }

    // Per-subject expected vs scheduled completeness (synced with effective Option 1 or Option 2 allocations)
    const streamExpectedAllocs = readiness.streamAllocations.filter(
      (a) => a.grade === st.grade && a.stream === st.stream && a.lessonsPerWeek > 0
    );
    const missingLessons: StreamCompletenessReport['missingLessons'] = [];
    for (const alloc of streamExpectedAllocs) {
      const scheduled = streamEntries.filter((e) => e.subjectId === alloc.subjectId).length;
      if (scheduled < alloc.lessonsPerWeek) {
        missingLessons.push({
          subjectName: alloc.subjectName,
          expected: alloc.lessonsPerWeek,
          scheduled,
        });
      }
    }

    // Also verify configured remedial sessions for this stream
    const streamRemedials = input.remedialConfigs.filter(
      (rc) => rc.isActive && rc.grade === st.grade && rc.stream === st.stream && rc.weeklyFrequency > 0
    );
    for (const rc of streamRemedials) {
      const scheduled = streamEntries.filter((e) => e.remedialConfigId === rc.id).length;
      if (scheduled < rc.weeklyFrequency) {
        const sub = input.subjects.find((s) => s.id === rc.subjectId);
        missingLessons.push({
          subjectName: `${sub?.name ?? rc.remedialType} (${rc.studentGroupName || 'Group'})`,
          expected: rc.weeklyFrequency,
          scheduled,
        });
      }
    }

    streamCompleteness.push({
      categoryId: st.categoryId,
      grade: st.grade,
      stream: st.stream,
      expectedRegularPeriods,
      scheduledRegularPeriods: regularEntries.length,
      unexplainedBlankPeriods: blanks,
      remedialSessionsScheduled: remedialEntries.length,
      missingLessons,
      isComplete: blanks === 0 && missingLessons.length === 0,
    });
  }

  // 5. Teacher workload calculations (including all core, common activities, clubs, maktaba, remedial)
  const teacherMaxMap = new Map<string, { name: string; max: number }>();
  for (const a of input.teacherAssignments) {
    if (!a.isActive) continue;
    const prev = teacherMaxMap.get(a.teacherId);
    if (!prev || a.maxWeeklyPeriods > prev.max) {
      teacherMaxMap.set(a.teacherId, { name: a.teacherName, max: a.maxWeeklyPeriods });
    }
  }
  for (const rc of input.remedialConfigs) {
    if (!rc.isActive || !rc.teacherId) continue;
    if (!teacherMaxMap.has(rc.teacherId)) {
      teacherMaxMap.set(rc.teacherId, { name: rc.teacherName, max: 28 });
    }
  }
  for (const e of entries) {
    if (!teacherMaxMap.has(e.teacherId)) {
      teacherMaxMap.set(e.teacherId, { name: e.teacherName, max: 28 });
    }
  }

  const teacherWorkloads: TeacherWorkloadReport[] = Array.from(teacherMaxMap.entries())
    .map(([teacherId, info]) => {
      const tEntries = entries.filter((e) => e.teacherId === teacherId);
      const corePeriods = tEntries.filter((e) => e.subjectKind === 'core').length;
      const commonActivityPeriods = tEntries.filter(
        (e) => e.subjectKind === 'common_activity'
      ).length;
      const remedialPeriods = tEntries.filter((e) => e.subjectKind === 'remedial').length;
      const clubsAndMaktabaPeriods = tEntries.filter((e) => {
        const lower = e.subjectName.toLowerCase();
        return lower === 'clubs' || lower === 'maktaba';
      }).length;
      const scheduledTotal = tEntries.length;
      const maxWeeklyPeriods = Math.max(1, info.max);
      const utilizationPct = Math.round((scheduledTotal / maxWeeklyPeriods) * 100);
      const categoriesTaught = Array.from(
        new Set(tEntries.map((e) => e.categoryId))
      ) as TimetableCategoryId[];

      return {
        teacherId,
        teacherName: info.name,
        maxWeeklyPeriods,
        scheduledTotal,
        corePeriods,
        commonActivityPeriods,
        remedialPeriods,
        clubsAndMaktabaPeriods,
        utilizationPct,
        isOverloaded: scheduledTotal > maxWeeklyPeriods,
        categoriesTaught,
      };
    })
    .sort((a, b) => b.scheduledTotal - a.scheduledTotal || a.teacherName.localeCompare(b.teacherName));

  const isValid =
    entries.length > 0 &&
    teacherCollisions.length === 0 &&
    facilityOverflows.length === 0 &&
    studentGroupConflicts.length === 0 &&
    unexplainedBlankSessions.length === 0 &&
    streamCompleteness.every((sc) => sc.isComplete);

  return {
    isValid,
    readyToGenerate: readiness.readyToGenerate,
    readinessIssues: readiness.issues,
    teacherCollisions,
    facilityOverflows,
    studentGroupConflicts,
    unexplainedBlankSessions,
    categoryTotals: readiness.categoryTotals,
    streamAllocations: readiness.streamAllocations,
    teacherWorkloads,
    facilityUtilization,
    streamCompleteness,
  };
}
