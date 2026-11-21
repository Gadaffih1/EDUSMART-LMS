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

export interface EngineGradeSubjectOverride {
  categoryId: TimetableCategoryId;
  grade: number;
  subjectId: string;
  lessonsPerWeek: number;
}

export interface EngineInput {
  scheduleConfigs: Record<TimetableCategoryId, EngineScheduleConfig>;
  subjects: EngineSubject[];
  facilities: EngineFacility[];
  teacherAssignments: EngineTeacherAssignment[];
  remedialConfigs: EngineRemedialConfig[];
  streams: EngineStream[];
  gradeOverrides?: EngineGradeSubjectOverride[];
}

export interface GenerateScheduleOptions {
  targetCategoryId?: TimetableCategoryId;
  lockedEntries?: EngineTimetableEntry[];
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
  return config.periods
    .filter((p) => p.slotType !== 'break' && p.slotType !== 'lunch')
    .slice(0, config.periodsPerDay);
}

function getSchedulablePeriods(config: EngineScheduleConfig): PeriodSlotDefinition[] {
  return config.periods.filter((p) => p.slotType === 'regular' || p.slotType === 'remedial');
}

export function parseTimeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr) return -1;
  const parts = String(timeStr).trim().split(':');
  if (parts.length < 2) return -1;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}

export function timeRangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  if (aStart < 0 || aEnd <= aStart || bStart < 0 || bEnd <= bStart) return false;
  return aStart < bEnd && bStart < aEnd;
}

function entriesTimeOverlap(
  a: { dayOfWeek: string; periodNumber: number; startTime: string; endTime: string },
  b: { dayOfWeek: string; periodNumber: number; startTime: string; endTime: string }
): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  const aS = parseTimeToMinutes(a.startTime);
  const aE = parseTimeToMinutes(a.endTime);
  const bS = parseTimeToMinutes(b.startTime);
  const bE = parseTimeToMinutes(b.endTime);
  if (aS >= 0 && aE > aS && bS >= 0 && bE > bS) {
    return timeRangesOverlap(aS, aE, bS, bE);
  }
  return a.periodNumber === b.periodNumber;
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
  const overrideMap = new Map<string, number>();
  for (const ov of input.gradeOverrides ?? []) {
    overrideMap.set(`${ov.grade}::${ov.subjectId}`, Math.max(0, Math.trunc(ov.lessonsPerWeek)));
  }

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
        (s) => s.categoryId === st.categoryId && s.isActive && s.subjectKind !== 'remedial'
      );

      for (const sub of catSubjects) {
        const overrideKey = `${st.grade}::${sub.id}`;
        const effectiveLessons = overrideMap.has(overrideKey)
          ? overrideMap.get(overrideKey)!
          : sub.lessonsPerWeek;

        if (effectiveLessons <= 0) continue;

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
            lessonsPerWeek: effectiveLessons,
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
            lessonsPerWeek: effectiveLessons,
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
            lessonsPerWeek: effectiveLessons,
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
export function validateTimetableReadiness(
  input: EngineInput,
  options?: { targetCategoryId?: TimetableCategoryId; lockedEntries?: EngineTimetableEntry[] }
): {
  readyToGenerate: boolean;
  issues: ValidationIssue[];
  categoryTotals: CategoryAllocationSummary[];
  streamAllocations: ResolvedStreamAllocation[];
} {
  const issues: ValidationIssue[] = [];
  const targetCat = options?.targetCategoryId;
  const lockedEntries = options?.lockedEntries ?? [];
  const streamAllocations = resolveEffectiveStreamAllocations(input);
  const categoryTotals = computeCategoryTotals(input, streamAllocations);
  const subjectById = new Map(input.subjects.map((s) => [s.id, s]));

  const relevantStreams = targetCat
    ? input.streams.filter((st) => st.categoryId === targetCat)
    : input.streams;
  const relevantAllocations = targetCat
    ? streamAllocations.filter((a) => a.categoryId === targetCat)
    : streamAllocations;

  if (relevantStreams.length === 0) {
    const catLabel = targetCat
      ? TIMETABLE_CATEGORIES.find((c) => c.id === targetCat)?.label || targetCat
      : 'school';
    issues.push({
      code: 'NO_ACTIVE_STREAMS',
      severity: 'error',
      categoryId: targetCat,
      message: `No active grades or streams found for ${catLabel}. Configure grades and streams in Academic Structure first.`,
    });
  }

  let totalConfiguredLessonsInScope = 0;

  // 1. Validate every resolved stream allocation in scope
  for (const alloc of relevantAllocations) {
    totalConfiguredLessonsInScope += alloc.lessonsPerWeek;
    const catLabel =
      TIMETABLE_CATEGORIES.find((c) => c.id === alloc.categoryId)?.label || alloc.categoryId;

    if (alloc.status === 'duplicate_conflict') {
      issues.push({
        code: 'DUPLICATE_STREAM_SUBJECT_ASSIGNMENT',
        severity: 'error',
        categoryId: alloc.categoryId,
        grade: alloc.grade,
        stream: alloc.stream,
        message: `${catLabel} · Grade ${alloc.grade} ${alloc.stream}: "${alloc.subjectName}" has conflicting duplicate teacher assignments (${alloc.conflictTeachers.join(', ')}). Keep exactly one assigned teacher per stream-subject.`,
      });
    } else if (alloc.status === 'unassigned') {
      issues.push({
        code: 'UNASSIGNED_TEACHER',
        severity: 'error',
        categoryId: alloc.categoryId,
        grade: alloc.grade,
        stream: alloc.stream,
        message: `${catLabel} · Grade ${alloc.grade} ${alloc.stream}: "${alloc.subjectName}" has ${alloc.lessonsPerWeek} lesson(s)/week allocated but no authorized teacher/supervisor assigned in EduSmart teacher records.`,
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

  // 2. Per-stream period budget check
  for (const st of relevantStreams) {
    const cfg = input.scheduleConfigs[st.categoryId];
    if (!cfg) continue;
    const availableRegular = cfg.days.length * getRegularPeriods(cfg).length;
    const stRows = relevantAllocations.filter((r) => r.grade === st.grade && r.stream === st.stream);
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

  // 3. Check Remedial 1 and Remedial 2 per category in scope
  const relevantSummaries = targetCat
    ? categoryTotals.filter((c) => c.categoryId === targetCat)
    : categoryTotals;

  for (const summary of relevantSummaries) {
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
      totalConfiguredLessonsInScope += configsForSub.reduce(
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

  if (totalConfiguredLessonsInScope === 0) {
    const scopeLabel = targetCat
      ? TIMETABLE_CATEGORIES.find((c) => c.id === targetCat)?.label || targetCat
      : 'any category';
    issues.push({
      code: 'ZERO_LESSONS_CONFIGURED',
      severity: 'error',
      categoryId: targetCat,
      message: `No weekly lessons have been allocated yet for ${scopeLabel}. Enter lessons per week in the subject allocation table and save before generating.`,
    });
  }

  // 4. Cross-category shared facility total weekly demand vs capacity check
  const facilityDemand = new Map<string, number>();
  for (const alloc of relevantAllocations) {
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
  // Include locked other-category facility bookings when regenerating one category
  if (targetCat && lockedEntries.length > 0) {
    for (const le of lockedEntries) {
      if (le.categoryId === targetCat || !le.facilityId) continue;
      facilityDemand.set(le.facilityId, (facilityDemand.get(le.facilityId) || 0) + 1);
    }
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
        message: `Shared facility "${fac.name}" demand across categories (${totalDemand} stream-periods/week) exceeds its weekly capacity (${weeklyCapacity} = ${fac.availableDays.length} days × ${fac.availablePeriods.length} periods × ${fac.capacityStreams} concurrent stream(s)).`,
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
    ...Object.values(input.scheduleConfigs).map((c) => c.days.length * getSchedulablePeriods(c).length)
  );

  const teacherProjectedDemand = new Map<
    string,
    { name: string; regularDemand: number; totalDemand: number; max: number }
  >();

  for (const alloc of relevantAllocations) {
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

  // Include locked other-category bookings for teachers when generating a single category
  if (targetCat && lockedEntries.length > 0) {
    for (const le of lockedEntries) {
      if (le.categoryId === targetCat) continue;
      const prev = teacherProjectedDemand.get(le.teacherId) || {
        name: le.teacherName,
        regularDemand: 0,
        totalDemand: 0,
        max: 28,
      };
      if (le.subjectKind !== 'remedial') prev.regularDemand += 1;
      prev.totalDemand += 1;
      teacherProjectedDemand.set(le.teacherId, prev);
    }
  }

  const relevantRemedials = targetCat
    ? input.remedialConfigs.filter((rc) => rc.categoryId === targetCat)
    : input.remedialConfigs;
  for (const rc of relevantRemedials) {
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
export function generateTimetableSchedule(
  input: EngineInput,
  options?: GenerateScheduleOptions
): GenerateScheduleResult {
  const targetCategoryId = options?.targetCategoryId;
  // Keep locked entries from the OTHER categories untouched when regenerating a single category
  const preservedLockedEntries: EngineTimetableEntry[] = targetCategoryId
    ? (options?.lockedEntries ?? [])
        .filter((e) => e.categoryId !== targetCategoryId)
        .map((e) => ({ ...e, id: `tte_${crypto.randomBytes(6).toString('hex')}` }))
    : [];

  const readiness = validateTimetableReadiness(input, {
    targetCategoryId,
    lockedEntries: preservedLockedEntries,
  });
  if (!readiness.readyToGenerate) {
    const audit = validateTimetableEntries(input, preservedLockedEntries, { targetCategoryId });
    return {
      success: false,
      entries: preservedLockedEntries,
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
  const subjectById = new Map(input.subjects.map((s) => [s.id, s]));
  const streamByKey = new Map(
    input.streams.map((st) => [`${st.grade}::${st.stream.trim().toLowerCase()}`, st])
  );

  for (const alloc of readiness.streamAllocations) {
    if (targetCategoryId && alloc.categoryId !== targetCategoryId) continue;
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
    const catId = getCategoryForGrade(rc.grade);
    if (targetCategoryId && catId !== targetCategoryId) continue;
    const sub = input.subjects.find((s) => s.id === rc.subjectId && s.isActive);
    if (!sub) continue;
    const cfg = input.scheduleConfigs[catId];
    if (!cfg) continue;

    const schedulablePeriods = getSchedulablePeriods(cfg).map((p) => p.periodNumber);
    const remedialPeriods = cfg.periods
      .filter((p) => p.slotType === 'remedial')
      .map((p) => p.periodNumber);

    const allowedDays =
      rc.availableDays.length > 0
        ? cfg.days.filter((d) => rc.availableDays.includes(d))
        : cfg.days.slice();

    const allowedPeriods =
      rc.availablePeriods.length > 0
        ? schedulablePeriods.filter((p) => rc.availablePeriods.includes(p))
        : remedialPeriods.length > 0
          ? remedialPeriods
          : schedulablePeriods;

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
        constraintTightness: 500 + allowedDays.length * allowedPeriods.length,
      });
    }
  }

  // Sort by MRV tightness (tightest tasks first; regular/facility/clubs before remedial)
  tasks.sort((a, b) => a.constraintTightness - b.constraintTightness);

  // Occupancy maps (tracking BOTH period slot AND exact clock-time intervals for cross-category safety)
  interface BookedInterval {
    entryId: string;
    periodNumber: number;
    startMins: number;
    endMins: number;
  }

  const entries: EngineTimetableEntry[] = [];
  const teacherDayIntervals = new Map<string, BookedInterval[]>(); // `${teacherId}::${day}` -> intervals
  const teacherLoad = new Map<string, number>(); // teacherId -> count
  const facilityDayIntervals = new Map<string, BookedInterval[]>(); // `${facilityId}::${day}` -> intervals
  const streamWholeOccupied = new Map<string, Set<string>>(); // streamKey -> Set<slotKey>
  const streamEntriesBySlot = new Map<string, EngineTimetableEntry[]>(); // `${streamKey}::${slotKey}` -> entries
  const subjectPerStreamDayCount = new Map<string, number>(); // `${streamKey}::${subjectId}::${day}` -> count
  const lockedEntryIds = new Set<string>();

  const registerOccupancy = (entry: EngineTimetableEntry): void => {
    const sk = slotKey(entry.dayOfWeek, entry.periodNumber);
    const stKey = streamKey(entry.grade, entry.stream);
    const combinedKey = `${stKey}::${sk}`;
    const startMins = parseTimeToMinutes(entry.startTime);
    const endMins = parseTimeToMinutes(entry.endTime);

    const tdKey = `${entry.teacherId}::${entry.dayOfWeek}`;
    if (!teacherDayIntervals.has(tdKey)) teacherDayIntervals.set(tdKey, []);
    teacherDayIntervals.get(tdKey)!.push({
      entryId: entry.id,
      periodNumber: entry.periodNumber,
      startMins,
      endMins,
    });
    teacherLoad.set(entry.teacherId, (teacherLoad.get(entry.teacherId) ?? 0) + 1);

    if (entry.facilityId) {
      const fdKey = `${entry.facilityId}::${entry.dayOfWeek}`;
      if (!facilityDayIntervals.has(fdKey)) facilityDayIntervals.set(fdKey, []);
      facilityDayIntervals.get(fdKey)!.push({
        entryId: entry.id,
        periodNumber: entry.periodNumber,
        startMins,
        endMins,
      });
    }

    if (entry.studentGroupMode === 'whole_stream') {
      if (!streamWholeOccupied.has(stKey)) streamWholeOccupied.set(stKey, new Set());
      streamWholeOccupied.get(stKey)!.add(sk);
    }

    if (!streamEntriesBySlot.has(combinedKey)) streamEntriesBySlot.set(combinedKey, []);
    streamEntriesBySlot.get(combinedKey)!.push(entry);

    const daySubKey = `${stKey}::${entry.subjectId}::${entry.dayOfWeek}`;
    subjectPerStreamDayCount.set(daySubKey, (subjectPerStreamDayCount.get(daySubKey) ?? 0) + 1);
  };

  // Pre-seed occupancy with preserved locked entries from OTHER categories
  for (const locked of preservedLockedEntries) {
    entries.push(locked);
    lockedEntryIds.add(locked.id);
    registerOccupancy(locked);
  }

  const isTeacherFreeAtSlot = (
    teacherId: string,
    day: string,
    periodSlot: PeriodSlotDefinition
  ): boolean => {
    const list = teacherDayIntervals.get(`${teacherId}::${day}`);
    if (!list || list.length === 0) return true;
    const s = parseTimeToMinutes(periodSlot.startTime);
    const e = parseTimeToMinutes(periodSlot.endTime);
    for (const booked of list) {
      if (s >= 0 && e > s && booked.startMins >= 0 && booked.endMins > booked.startMins) {
        if (timeRangesOverlap(s, e, booked.startMins, booked.endMins)) return false;
      } else if (booked.periodNumber === periodSlot.periodNumber) {
        return false;
      }
    }
    return true;
  };

  const isFacilityAvailableAtSlot = (
    fac: EngineFacility | null,
    day: string,
    periodSlot: PeriodSlotDefinition
  ): boolean => {
    if (!fac) return true;
    if (fac.availableDays.length > 0 && !fac.availableDays.includes(day)) return false;
    if (fac.availablePeriods.length > 0 && !fac.availablePeriods.includes(periodSlot.periodNumber)) {
      return false;
    }
    const list = facilityDayIntervals.get(`${fac.id}::${day}`);
    if (!list || list.length === 0) return true;
    const s = parseTimeToMinutes(periodSlot.startTime);
    const e = parseTimeToMinutes(periodSlot.endTime);
    let concurrent = 0;
    for (const booked of list) {
      const overlaps =
        s >= 0 && e > s && booked.startMins >= 0 && booked.endMins > booked.startMins
          ? timeRangesOverlap(s, e, booked.startMins, booked.endMins)
          : booked.periodNumber === periodSlot.periodNumber;
      if (overlaps) concurrent += 1;
    }
    return concurrent < Math.max(1, fac.capacityStreams);
  };

  const canPlaceForStreamAndStudents = (task: PlacementTask, sk: string): boolean => {
    const stKey = streamKey(task.grade, task.stream);
    const combinedKey = `${stKey}::${sk}`;
    const existing = streamEntriesBySlot.get(combinedKey) ?? [];

    if (task.studentGroupMode === 'whole_stream') {
      if (streamWholeOccupied.get(stKey)?.has(sk)) return false;
      if (existing.length > 0) return false;
      return true;
    }

    for (const ex of existing) {
      if (ex.studentGroupMode === 'whole_stream') return false;
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
    registerOccupancy(entry);
    return entry;
  };

  const removeEntry = (entry: EngineTimetableEntry): void => {
    const idx = entries.findIndex((e) => e.id === entry.id);
    if (idx !== -1) entries.splice(idx, 1);

    const sk = slotKey(entry.dayOfWeek, entry.periodNumber);
    const stKey = streamKey(entry.grade, entry.stream);
    const combinedKey = `${stKey}::${sk}`;

    const tdKey = `${entry.teacherId}::${entry.dayOfWeek}`;
    const tList = teacherDayIntervals.get(tdKey);
    if (tList) {
      teacherDayIntervals.set(
        tdKey,
        tList.filter((b) => b.entryId !== entry.id)
      );
    }
    teacherLoad.set(entry.teacherId, Math.max(0, (teacherLoad.get(entry.teacherId) ?? 1) - 1));

    if (entry.facilityId) {
      const fdKey = `${entry.facilityId}::${entry.dayOfWeek}`;
      const fList = facilityDayIntervals.get(fdKey);
      if (fList) {
        facilityDayIntervals.set(
          fdKey,
          fList.filter((b) => b.entryId !== entry.id)
        );
      }
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
    subjectPerStreamDayCount.set(
      daySubKey,
      Math.max(0, (subjectPerStreamDayCount.get(daySubKey) ?? 1) - 1)
    );
  };

  const findBestCandidate = (
    task: PlacementTask
  ): { assignment: EngineTeacherAssignment; day: string; periodSlot: PeriodSlotDefinition; score: number } | null => {
    const cfg = input.scheduleConfigs[task.categoryId];
    if (!cfg) return null;
    const periodMap = new Map(
      getSchedulablePeriods(cfg).map((p) => [p.periodNumber, p])
    );
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
          if (!isTeacherFreeAtSlot(assignment.teacherId, day, periodSlot)) continue;
          if (!isFacilityAvailableAtSlot(task.facility, day, periodSlot)) continue;
          if (!canPlaceForStreamAndStudents(task, sk)) continue;

          const sameDayCount = subjectPerStreamDayCount.get(`${stKey}::${task.subject.id}::${day}`) ?? 0;
          const overloadPenalty = currentLoad >= assignment.maxWeeklyPeriods ? 500 : 0;
          const remedialSlotBonus =
            task.remedialConfig && periodSlot.slotType === 'remedial' ? -30 : 0;
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

    // Single-step Kempe-style swap repair within the same stream (never touching locked entries)
    let repaired = false;
    const cfg = input.scheduleConfigs[task.categoryId];
    if (cfg && task.studentGroupMode === 'whole_stream') {
      const periodMap = new Map(
        getSchedulablePeriods(cfg).map((p) => [p.periodNumber, p])
      );
      const streamEntries = entries.filter(
        (e) =>
          !lockedEntryIds.has(e.id) &&
          e.grade === task.grade &&
          e.stream === task.stream &&
          e.studentGroupMode === 'whole_stream' &&
          task.allowedDays.includes(e.dayOfWeek) &&
          task.allowedPeriods.includes(e.periodNumber)
      );

      for (const blocker of streamEntries) {
        const blockerPeriod = periodMap.get(blocker.periodNumber);
        if (!blockerPeriod) continue;

        const eligibleAssignment = task.candidateAssignments.find(
          (a) =>
            isTeacherFreeAtSlot(a.teacherId, blocker.dayOfWeek, blockerPeriod) &&
            (a.allowedDays.length === 0 || a.allowedDays.includes(blocker.dayOfWeek)) &&
            (a.allowedPeriods.length === 0 || a.allowedPeriods.includes(blocker.periodNumber))
        );
        if (!eligibleAssignment) continue;
        if (!isFacilityAvailableAtSlot(task.facility, blocker.dayOfWeek, blockerPeriod)) continue;

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
          ? `No conflict-free slot with teacher and shared facility "${task.facility.name}" both available (checking all categories).`
          : 'No conflict-free slot available without causing a cross-school teacher or student-group collision.',
      });
    }
  }

  const audit = validateTimetableEntries(input, entries, {
    targetCategoryId,
    lockedEntries: preservedLockedEntries,
  });
  return {
    success:
      unplacedTasks.length === 0 &&
      audit.teacherCollisions.length === 0 &&
      audit.facilityOverflows.length === 0 &&
      audit.studentGroupConflicts.length === 0,
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
  entries: EngineTimetableEntry[],
  options?: { targetCategoryId?: TimetableCategoryId; lockedEntries?: EngineTimetableEntry[] }
): TimetableAuditReport {
  const readiness = validateTimetableReadiness(input, options);
  const targetCat = options?.targetCategoryId;

  // 1. Strict Whole-School Teacher Collision Check (BOTH same period AND cross-category clock-time overlap)
  const byTeacherDay = new Map<string, EngineTimetableEntry[]>();
  for (const e of entries) {
    const key = `${e.teacherId}::${e.dayOfWeek}`;
    if (!byTeacherDay.has(key)) byTeacherDay.set(key, []);
    byTeacherDay.get(key)!.push(e);
  }
  const teacherCollisions: TimetableAuditReport['teacherCollisions'] = [];
  const seenCollisionPairs = new Set<string>();
  for (const list of byTeacherDay.values()) {
    if (list.length <= 1) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (entriesTimeOverlap(a, b)) {
          const pairKey = [a.id, b.id].sort().join('::');
          if (seenCollisionPairs.has(pairKey)) continue;
          seenCollisionPairs.add(pairKey);
          teacherCollisions.push({
            teacherId: a.teacherId,
            teacherName: a.teacherName,
            dayOfWeek: a.dayOfWeek,
            periodNumber: a.periodNumber,
            entries: [
              { grade: a.grade, stream: a.stream, subjectName: `${a.subjectName} (${a.startTime}–${a.endTime})` },
              { grade: b.grade, stream: b.stream, subjectName: `${b.subjectName} (${b.startTime}–${b.endTime})` },
            ],
          });
        }
      }
    }
  }

  // 2. Shared facility capacity & utilization check across ALL 3 categories (clock-time overlap aware)
  const facilityMap = new Map(input.facilities.map((f) => [f.id, f]));
  const byFacilityDay = new Map<string, EngineTimetableEntry[]>();
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
    const key = `${e.facilityId}::${e.dayOfWeek}`;
    if (!byFacilityDay.has(key)) byFacilityDay.set(key, []);
    byFacilityDay.get(key)!.push(e);

    facilityTotalBooked.set(e.facilityId, (facilityTotalBooked.get(e.facilityId) ?? 0) + 1);
    const catRec = facilityBookingsByCat.get(e.facilityId);
    if (catRec) catRec[e.categoryId] = (catRec[e.categoryId] ?? 0) + 1;
  }

  const facilityOverflows: TimetableAuditReport['facilityOverflows'] = [];
  const recordedFacOverflow = new Set<string>();
  for (const list of byFacilityDay.values()) {
    const facId = list[0].facilityId!;
    const fac = facilityMap.get(facId);
    const cap = Math.max(1, fac?.capacityStreams ?? 1);

    for (const anchor of list) {
      const concurrent = list.filter((other) => entriesTimeOverlap(anchor, other));
      facilityPeak.set(facId, Math.max(facilityPeak.get(facId) ?? 0, concurrent.length));

      if (concurrent.length > cap) {
        const overflowKey = `${facId}::${anchor.dayOfWeek}::${concurrent.map((c) => c.id).sort().join(',')}`;
        if (recordedFacOverflow.has(overflowKey)) continue;
        recordedFacOverflow.add(overflowKey);
        facilityOverflowCount.set(facId, (facilityOverflowCount.get(facId) ?? 0) + 1);
        facilityOverflows.push({
          facilityId: facId,
          facilityName: fac?.name ?? anchor.facilityName ?? facId,
          dayOfWeek: anchor.dayOfWeek,
          periodNumber: anchor.periodNumber,
          capacityStreams: cap,
          bookedStreams: concurrent.length,
          entries: concurrent.map((x) => ({
            grade: x.grade,
            stream: x.stream,
            subjectName: `${x.subjectName} (${x.startTime}–${x.endTime})`,
          })),
        });
      }
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

    const streamExpectedAllocs = readiness.streamAllocations.filter(
      (a) => a.grade === st.grade && a.stream === st.stream && a.lessonsPerWeek > 0
    );
    const streamRemedials = input.remedialConfigs.filter(
      (rc) => rc.isActive && rc.grade === st.grade && rc.stream === st.stream && rc.weeklyFrequency > 0
    );

    const inActiveScope =
      !targetCat || st.categoryId === targetCat || streamEntries.length > 0;
    const hasConfiguredWork = streamExpectedAllocs.length > 0 || streamRemedials.length > 0;

    let blanks = 0;
    if (inActiveScope && (hasConfiguredWork || streamEntries.length > 0)) {
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
    }

    const missingLessons: StreamCompletenessReport['missingLessons'] = [];
    if (inActiveScope) {
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
      isComplete:
        (!hasConfiguredWork && streamEntries.length === 0) ||
        (blanks === 0 && missingLessons.length === 0),
    });
  }

  // 5. Teacher workload calculations
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

/**
 * Strict validation for manual timetable cell editing (Requirement 7):
 * Checks whole-school teacher clock-time collisions, shared facility capacity,
 * and stream/student-group conflicts before persisting any manual edit.
 */
export function validateSingleEntryEdit(
  input: EngineInput,
  allEntries: EngineTimetableEntry[],
  updatedEntry: EngineTimetableEntry
): { ok: true } | { ok: false; error: string } {
  const others = allEntries.filter((e) => e.id !== updatedEntry.id);

  // 1. Strict whole-school teacher collision check (clock-time overlap across all categories)
  for (const other of others) {
    if (other.teacherId === updatedEntry.teacherId && entriesTimeOverlap(updatedEntry, other)) {
      return {
        ok: false,
        error: `Teacher collision blocked: ${updatedEntry.teacherName} is already scheduled to teach ${other.subjectName} in Grade ${other.grade} ${other.stream} on ${other.dayOfWeek} (${other.startTime}–${other.endTime}).`,
      };
    }
  }

  // 2. Stream / participating student-group conflict check
  for (const other of others) {
    if (
      other.grade === updatedEntry.grade &&
      other.stream.toLowerCase() === updatedEntry.stream.toLowerCase() &&
      other.dayOfWeek === updatedEntry.dayOfWeek &&
      other.periodNumber === updatedEntry.periodNumber
    ) {
      const conflicts =
        updatedEntry.studentGroupMode === 'whole_stream' ||
        other.studentGroupMode === 'whole_stream' ||
        arraysOverlap(updatedEntry.studentIds, other.studentIds).length > 0;
      if (conflicts) {
        return {
          ok: false,
          error: `Stream slot conflict: Grade ${updatedEntry.grade} ${updatedEntry.stream} already has ${other.subjectName} scheduled on ${other.dayOfWeek} Period ${other.periodNumber}.`,
        };
      }
    }
  }

  // 3. Shared facility capacity check across all categories
  if (updatedEntry.facilityId) {
    const fac = input.facilities.find((f) => f.id === updatedEntry.facilityId && f.isActive);
    const cap = Math.max(1, fac?.capacityStreams ?? 1);
    const concurrent = others.filter(
      (o) => o.facilityId === updatedEntry.facilityId && entriesTimeOverlap(updatedEntry, o)
    );
    if (concurrent.length >= cap) {
      return {
        ok: false,
        error: `Shared facility capacity exceeded: "${fac?.name || updatedEntry.facilityName || 'Facility'}" is already booked (${concurrent.length}/${cap} streams) during ${updatedEntry.dayOfWeek} ${updatedEntry.startTime}–${updatedEntry.endTime}.`,
      };
    }
  }

  return { ok: true };
}
