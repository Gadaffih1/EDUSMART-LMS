import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  FACILITY_TYPE_LABELS,
  ttApiFetch,
  type AllocationProcessingMode,
  type CategoryAllocationSummary,
  type DirectoryTeacher,
  type ResolvedStreamAllocation,
  type ScheduleConfig,
  type TeacherAssignmentRole,
  type TimetableCategoryId,
  type TimetableCategoryMeta,
  type TimetableFacility,
  type TimetableStream,
  type TimetableSubject,
  type TimetableTeacherAssignment,
} from './timetableTypes';

interface Props {
  schoolId?: string;
  categories: TimetableCategoryMeta[];
  weekdays: string[];
  scheduleConfigs: Record<TimetableCategoryId, ScheduleConfig>;
  subjects: TimetableSubject[];
  facilities: TimetableFacility[];
  streams: TimetableStream[];
  teachers: DirectoryTeacher[];
  teacherAssignments: TimetableTeacherAssignment[];
  streamAllocations: ResolvedStreamAllocation[];
  categoryTotals: CategoryAllocationSummary[];
  canManage: boolean;
  preselectCategory?: TimetableCategoryId | null;
  preselectSubjectId?: string | null;
  onChangeAllocationMode: (
    categoryId: TimetableCategoryId,
    mode: AllocationProcessingMode
  ) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const ROLE_LABELS: Record<TeacherAssignmentRole, string> = {
  subject_teacher: 'Subject Teacher',
  supervisor: 'Activity Supervisor',
  remedial_teacher: 'Remedial Teacher',
};

export const TeacherAssignmentsPanel: React.FC<Props> = ({
  schoolId,
  categories,
  weekdays,
  scheduleConfigs,
  subjects,
  facilities,
  streams,
  teachers,
  teacherAssignments,
  streamAllocations,
  categoryTotals,
  canManage,
  preselectCategory,
  preselectSubjectId,
  onChangeAllocationMode,
  onRefresh,
}) => {
  const [filterCategory, setFilterCategory] = useState<TimetableCategoryId | 'all'>('all');
  const [categoryId, setCategoryId] = useState<TimetableCategoryId>(preselectCategory || 'cat_1_3');
  const [subjectId, setSubjectId] = useState<string>(preselectSubjectId || '');
  const [teacherId, setTeacherId] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [stream, setStream] = useState<string>('');
  const [lessonsPerWeek, setLessonsPerWeek] = useState<number>(4);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [roleType, setRoleType] = useState<TeacherAssignmentRole>('subject_teacher');
  const [maxWeeklyPeriods, setMaxWeeklyPeriods] = useState<number>(28);
  const [facilityId, setFacilityId] = useState<string>('');
  const [equipmentNotes, setEquipmentNotes] = useState<string>('');
  const [allowedDays, setAllowedDays] = useState<string[]>([]);
  const [allowedPeriods, setAllowedPeriods] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [updatingRowId, setUpdatingRowId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const activeCategoryConfig = scheduleConfigs[categoryId];
  const activeMode: AllocationProcessingMode =
    activeCategoryConfig?.allocationMode ?? 'category_redistribution';
  const isIndividualMode = activeMode === 'individual_teacher';

  useEffect(() => {
    if (preselectCategory) {
      setCategoryId(preselectCategory);
      setFilterCategory(preselectCategory);
    }
    if (preselectSubjectId) {
      setSubjectId(preselectSubjectId);
      const found = subjects.find((s) => s.id === preselectSubjectId);
      if (found) {
        if (found.code === 'clubs' || found.code === 'maktaba') {
          setRoleType('supervisor');
        } else if (found.subjectKind === 'remedial') {
          setRoleType('remedial_teacher');
        } else {
          setRoleType('subject_teacher');
        }
        setFacilityId(found.defaultFacilityId || '');
        if (found.lessonsPerWeek > 0) {
          setLessonsPerWeek(found.lessonsPerWeek);
        }
      }
    }
  }, [preselectCategory, preselectSubjectId, subjects]);

  const categorySubjects = useMemo(
    () =>
      subjects
        .filter((s) => s.categoryId === categoryId && s.subjectKind !== 'remedial')
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [subjects, categoryId]
  );

  useEffect(() => {
    if (!subjectId || !categorySubjects.some((s) => s.id === subjectId)) {
      const first = categorySubjects[0];
      setSubjectId(first?.id || '');
      if (first && first.lessonsPerWeek > 0) {
        setLessonsPerWeek(first.lessonsPerWeek);
      }
    }
  }, [categorySubjects, subjectId]);

  const categoryStreams = useMemo(
    () => streams.filter((st) => st.categoryId === categoryId),
    [streams, categoryId]
  );

  const gradesInCategory = useMemo(
    () => Array.from(new Set(categoryStreams.map((st) => st.grade))).sort((a, b) => a - b),
    [categoryStreams]
  );

  const streamsInSelectedGrade = useMemo(() => {
    if (!grade) return [];
    const g = Number(grade);
    return categoryStreams.filter((st) => st.grade === g).map((st) => st.stream);
  }, [categoryStreams, grade]);

  // When switching into Option 1 (Individual Teacher Assignment), preselect first grade/stream for fast entry
  useEffect(() => {
    if (isIndividualMode && !grade && gradesInCategory.length > 0) {
      const firstGrade = gradesInCategory[0];
      setGrade(String(firstGrade));
      const firstStream = categoryStreams.find((st) => st.grade === firstGrade)?.stream || '';
      setStream(firstStream);
    }
  }, [isIndividualMode, grade, gradesInCategory, categoryStreams]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId) || null,
    [subjects, subjectId]
  );

  // Live zero-collision telemetry for the currently selected stream and teacher
  const maxPhysicalRegularSlots = useMemo(() => {
    const vals = Object.values(scheduleConfigs).map((c) => c.days.length * c.periodsPerDay);
    return vals.length > 0 ? Math.max(...vals) : 40;
  }, [scheduleConfigs]);

  const selectedStreamBudget = useMemo(() => {
    if (!grade || !stream) return null;
    const g = Number(grade);
    const normStream = stream.trim().toLowerCase();
    const cfg = scheduleConfigs[categoryId];
    const capacity = cfg ? cfg.days.length * cfg.periodsPerDay : 40;

    const currentStreamItems = streamAllocations.filter(
      (ra) =>
        ra.categoryId === categoryId &&
        ra.grade === g &&
        ra.stream.trim().toLowerCase() === normStream
    );
    const currentTotal = currentStreamItems.reduce((sum, ra) => sum + ra.lessonsPerWeek, 0);
    const existingForSubject = currentStreamItems.find((ra) => ra.subjectId === subjectId);
    const existingCount = existingForSubject ? existingForSubject.lessonsPerWeek : 0;
    const projectedTotal = isIndividualMode
      ? currentTotal - (replaceExisting ? existingCount : 0) + lessonsPerWeek
      : currentTotal;

    return {
      capacity,
      currentTotal,
      projectedTotal,
      remainingAfter: capacity - projectedTotal,
      existingOwner: existingForSubject?.teacherName || null,
    };
  }, [
    grade,
    stream,
    scheduleConfigs,
    categoryId,
    streamAllocations,
    subjectId,
    isIndividualMode,
    replaceExisting,
    lessonsPerWeek,
  ]);

  const teacherLoadSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        linkedLessons: number;
        streamCount: number;
        maxWeeklyPeriods: number;
        categories: Set<TimetableCategoryId>;
      }
    >();

    for (const ta of teacherAssignments) {
      if (!ta.isActive) continue;
      if (!map.has(ta.teacherId)) {
        map.set(ta.teacherId, {
          teacherId: ta.teacherId,
          teacherName: ta.teacherName,
          linkedLessons: 0,
          streamCount: 0,
          maxWeeklyPeriods: ta.maxWeeklyPeriods,
          categories: new Set([ta.categoryId]),
        });
      } else {
        const entry = map.get(ta.teacherId)!;
        entry.maxWeeklyPeriods = Math.max(entry.maxWeeklyPeriods, ta.maxWeeklyPeriods);
        entry.categories.add(ta.categoryId);
      }
    }

    for (const ra of streamAllocations) {
      if (!ra.teacherId || ra.status !== 'linked') continue;
      if (!map.has(ra.teacherId)) {
        map.set(ra.teacherId, {
          teacherId: ra.teacherId,
          teacherName: ra.teacherName || ra.teacherId,
          linkedLessons: 0,
          streamCount: 0,
          maxWeeklyPeriods: 28,
          categories: new Set([ra.categoryId]),
        });
      }
      const entry = map.get(ra.teacherId)!;
      entry.linkedLessons += ra.lessonsPerWeek;
      entry.streamCount += 1;
      entry.categories.add(ra.categoryId);
    }

    return Array.from(map.values()).sort((a, b) => b.linkedLessons - a.linkedLessons);
  }, [teacherAssignments, streamAllocations]);

  const selectedTeacherCurrentLoad = useMemo(() => {
    if (!teacherId) return 0;
    return teacherLoadSummary.find((t) => t.teacherId === teacherId)?.linkedLessons ?? 0;
  }, [teacherId, teacherLoadSummary]);

  const toggleDay = (day: string) => {
    setAllowedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const togglePeriod = (p: number) => {
    setAllowedPeriods((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p].sort((a, b) => a - b)
    );
  };

  const handleSwitchMode = async (mode: AllocationProcessingMode) => {
    if (!canManage || mode === activeMode) return;
    setSwitchingMode(true);
    setFeedback(null);
    try {
      await onChangeAllocationMode(categoryId, mode);
      setFeedback({
        type: 'ok',
        text:
          mode === 'individual_teacher'
            ? `Switched ${categories.find((c) => c.id === categoryId)?.label} to Option 1 (Individual Teacher Assignments).`
            : `Switched ${categories.find((c) => c.id === categoryId)?.label} to Option 2 (Category → Stream Redistribution).`,
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to update processing mode.' });
    } finally {
      setSwitchingMode(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      setFeedback({ type: 'err', text: 'Select an authorized teacher or supervisor.' });
      return;
    }
    if (!subjectId) {
      setFeedback({ type: 'err', text: 'Select a subject or activity.' });
      return;
    }
    if (isIndividualMode && (!grade || !stream)) {
      setFeedback({
        type: 'err',
        text: 'Option 1 (Individual Teacher Assignment) requires a specific Grade and Stream.',
      });
      return;
    }
    if (isIndividualMode && lessonsPerWeek <= 0) {
      setFeedback({
        type: 'err',
        text: 'Specify at least 1 lesson per week for an individual teacher assignment.',
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await ttApiFetch(
        '/api/timetable/teacher-assignments',
        {
          method: 'POST',
          body: JSON.stringify({
            teacherId: teacher.id,
            teacherName: teacher.name,
            teacherEmail: teacher.email,
            categoryId,
            subjectId,
            grade: grade ? Number(grade) : null,
            stream: stream || null,
            lessonsPerWeek: grade && stream ? lessonsPerWeek : null,
            allocationSource: isIndividualMode ? 'individual' : 'category_redistribution',
            replaceExisting,
            roleType,
            maxWeeklyPeriods,
            facilityId: facilityId || null,
            equipmentNotes,
            allowedDays,
            allowedPeriods,
          }),
        },
        schoolId
      );
      await onRefresh();
      const scopeDesc = grade
        ? `Grade ${grade}${stream ? ` ${stream}` : ' (All streams)'}`
        : 'Category-wide';
      const lessonsText = grade && stream ? ` · ${lessonsPerWeek} lessons/wk` : '';
      setFeedback({
        type: 'ok',
        text: `${res.replaced ? 'Reassigned' : 'Assigned'} ${teacher.name} to ${
          selectedSubject?.name || 'subject'
        } (${scopeDesc}${lessonsText}). Synced with timetable engine.`,
      });
      setReplaceExisting(false);
      setEquipmentNotes('');
      setAllowedDays([]);
      setAllowedPeriods([]);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to save assignment.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustRowLessons = async (assignment: TimetableTeacherAssignment, delta: number) => {
    if (!canManage) return;
    const current = assignment.lessonsPerWeek ?? 0;
    const next = Math.max(0, Math.min(30, current + delta));
    if (next === current) return;
    setUpdatingRowId(assignment.id);
    setFeedback(null);
    try {
      await ttApiFetch(
        `/api/timetable/teacher-assignments/${assignment.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ lessonsPerWeek: next }),
        },
        schoolId
      );
      await onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to update weekly lessons.' });
    } finally {
      setUpdatingRowId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    try {
      await ttApiFetch(`/api/timetable/teacher-assignments/${id}`, { method: 'DELETE' }, schoolId);
      await onRefresh();
      setFeedback({ type: 'ok', text: 'Teacher assignment removed.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to remove assignment.' });
    }
  };

  const filteredAssignments = useMemo(() => {
    return teacherAssignments.filter((a) =>
      filterCategory === 'all' ? true : a.categoryId === filterCategory
    );
  }, [teacherAssignments, filterCategory]);

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const facilityById = useMemo(() => new Map(facilities.map((f) => [f.id, f])), [facilities]);

  const duplicateConflicts = useMemo(
    () => streamAllocations.filter((ra) => ra.status === 'duplicate_conflict'),
    [streamAllocations]
  );

  const unlinkedStreams = useMemo(
    () => streamAllocations.filter((ra) => ra.status === 'unassigned'),
    [streamAllocations]
  );

  const activeCatSummary = categoryTotals.find((c) => c.categoryId === categoryId);

  return (
    <div className="space-y-5">
      {/* Zero-Collision Alerts */}
      {duplicateConflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">
              {duplicateConflicts.length} duplicate stream-subject teacher assignment conflict(s)
              detected (generation blocked):
            </div>
            <div className="mt-1 text-red-800">
              {duplicateConflicts
                .slice(0, 6)
                .map(
                  (c) =>
                    `Grade ${c.grade} ${c.stream} ${c.subjectName} (${c.conflictTeachers.join(' vs ')})`
                )
                .join(' · ')}
            </div>
          </div>
        </div>
      )}

      {unlinkedStreams.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-900">
          <div className="font-semibold">
            {unlinkedStreams.length} stream-subject slot(s) still require an authorized teacher or
            supervisor before timetable generation:
          </div>
          <div className="mt-1 text-amber-800">
            {unlinkedStreams
              .slice(0, 8)
              .map((s) => `Grade ${s.grade} ${s.stream} · ${s.subjectName} (${s.lessonsPerWeek}/wk)`)
              .join(' · ')}
            {unlinkedStreams.length > 8 ? ` (+${unlinkedStreams.length - 8} more)` : ''}
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`px-4 py-2.5 rounded-md border text-sm flex items-center justify-between ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-medium underline ml-4 whitespace-nowrap shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Individual / Linked Teacher Assignment Form */}
      {canManage && (
        <form
          onSubmit={handleAssign}
          className="bg-white border border-slate-200 rounded-lg p-4 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {isIndividualMode
                  ? 'Option 1: Individual Teacher Subject Assignment (Direct Timetable Sync)'
                  : 'Assign Authorized Teacher / Supervisor (Linked to Category Redistribution)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isIndividualMode
                  ? 'Capture Teacher, Subject Category, Subject, Grade, Stream, and Lessons Per Week individually. Enforces strict zero-duplicate ownership and teacher/stream period limits.'
                  : 'Assign authorized teachers at category, grade, or stream scope. Redistributed category weekly lessons strictly link to these teachers with zero collisions.'}
              </p>
            </div>

            {/* Category Processing Mode Switcher */}
            <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                disabled={switchingMode}
                onClick={() => handleSwitchMode('individual_teacher')}
                className={`px-2.5 py-1.5 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isIndividualMode
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Option 1: Individual Teacher
              </button>
              <button
                type="button"
                disabled={switchingMode}
                onClick={() => handleSwitchMode('category_redistribution')}
                className={`px-2.5 py-1.5 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
                  !isIndividualMode
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Option 2: Category → Streams
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* 1. Teacher */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Teacher / Supervisor *
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                <option value="">Select staff member...</option>
                {teachers.map((t) => {
                  const load = teacherLoadSummary.find((x) => x.teacherId === t.id)?.linkedLessons ?? 0;
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} ({load}/{maxPhysicalRegularSlots}p)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. Subject Category */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Subject Category *</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value as TimetableCategoryId);
                  setGrade('');
                  setStream('');
                }}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Subject / Activity */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Subject / Activity *</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSubjectId(id);
                  const found = subjects.find((s) => s.id === id);
                  if (found) {
                    setRoleType(
                      found.code === 'clubs' || found.code === 'maktaba'
                        ? 'supervisor'
                        : 'subject_teacher'
                    );
                    setFacilityId(found.defaultFacilityId || '');
                    if (found.lessonsPerWeek > 0) {
                      setLessonsPerWeek(found.lessonsPerWeek);
                    }
                  }
                }}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                {categorySubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {!isIndividualMode ? ` (${s.lessonsPerWeek}/wk)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Grade */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Grade {isIndividualMode ? '*' : '(optional)'}
              </label>
              <select
                value={grade}
                required={isIndividualMode}
                onChange={(e) => {
                  const gVal = e.target.value;
                  setGrade(gVal);
                  if (gVal) {
                    const firstSt =
                      categoryStreams.find((st) => st.grade === Number(gVal))?.stream || '';
                    setStream(isIndividualMode ? firstSt : '');
                  } else {
                    setStream('');
                  }
                }}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                {!isIndividualMode && <option value="">All Grades in Category</option>}
                {isIndividualMode && <option value="">Select Grade...</option>}
                {gradesInCategory.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Stream */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Stream {isIndividualMode ? '*' : '(optional)'}
              </label>
              <select
                value={stream}
                required={isIndividualMode}
                disabled={!grade}
                onChange={(e) => setStream(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900 disabled:bg-slate-50"
              >
                {!isIndividualMode && <option value="">All Streams in Grade</option>}
                {isIndividualMode && <option value="">Select Stream...</option>}
                {streamsInSelectedGrade.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Lessons Per Week (- / input / +) */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Lessons / Week {isIndividualMode ? '*' : '(stream)'}
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!grade || !stream || lessonsPerWeek <= 0}
                  onClick={() => setLessonsPerWeek((v) => Math.max(0, v - 1))}
                  className="w-8 h-9 inline-flex items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={0}
                  max={30}
                  disabled={!grade || !stream}
                  value={grade && stream ? lessonsPerWeek : selectedSubject?.lessonsPerWeek ?? 0}
                  onChange={(e) =>
                    setLessonsPerWeek(
                      Math.max(0, Math.min(30, Math.trunc(Number(e.target.value) || 0)))
                    )
                  }
                  className="w-full h-9 text-center border border-slate-300 rounded font-mono text-sm font-semibold text-slate-900 tabular-nums disabled:bg-slate-50 disabled:text-slate-500"
                />
                <button
                  type="button"
                  disabled={!grade || !stream || lessonsPerWeek >= 30}
                  onClick={() => setLessonsPerWeek((v) => Math.min(30, v + 1))}
                  className="w-8 h-9 inline-flex items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Live Collision & Capacity Pre-check Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Zero-Collision Pre-check:
              </span>
              {selectedStreamBudget ? (
                <span>
                  Grade {grade} {stream} budget:{' '}
                  <strong
                    className={`font-mono tabular-nums ${
                      selectedStreamBudget.remainingAfter < 0
                        ? 'text-red-600'
                        : selectedStreamBudget.remainingAfter === 0
                          ? 'text-emerald-700'
                          : 'text-slate-900'
                    }`}
                  >
                    {selectedStreamBudget.projectedTotal}/{selectedStreamBudget.capacity}
                  </strong>{' '}
                  ({selectedStreamBudget.remainingAfter} remaining)
                </span>
              ) : (
                <span>
                  Category linked slots:{' '}
                  <strong className="font-mono tabular-nums text-slate-900">
                    {activeCatSummary?.linkedStreamSlots ?? 0}
                  </strong>
                  {activeCatSummary && activeCatSummary.unlinkedStreamSlots > 0 && (
                    <span className="text-amber-700 ml-1">
                      · {activeCatSummary.unlinkedStreamSlots} unlinked
                    </span>
                  )}
                </span>
              )}
              {teacherId && (
                <span>
                  Teacher load:{' '}
                  <strong
                    className={`font-mono tabular-nums ${
                      selectedTeacherCurrentLoad + (isIndividualMode ? lessonsPerWeek : 0) >
                      maxPhysicalRegularSlots
                        ? 'text-red-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {selectedTeacherCurrentLoad}
                    {isIndividualMode && grade && stream ? ` → ${selectedTeacherCurrentLoad + lessonsPerWeek}` : ''}
                    /{maxPhysicalRegularSlots}
                  </strong>{' '}
                  weekly slots
                </span>
              )}
            </div>

            {selectedStreamBudget?.existingOwner && (
              <label className="inline-flex items-center gap-1.5 text-amber-800 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded border-amber-400 text-indigo-600"
                />
                <span>
                  Replace existing teacher ({selectedStreamBudget.existingOwner}) for this stream
                  subject
                </span>
              </label>
            )}
          </div>

          {/* Secondary Configuration Row: Role, Facility, Max Load, Days, Periods */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Assignment Role</label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value as TeacherAssignmentRole)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                <option value="subject_teacher">Subject Teacher</option>
                <option value="supervisor">Activity Supervisor (Clubs / Maktaba)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Assigned Lab / Shared Facility
              </label>
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                <option value="">Use Subject Default / Classroom</option>
                {facilities
                  .filter((f) => f.isActive)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({FACILITY_TYPE_LABELS[f.facilityType]})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Teacher Target Max Load
              </label>
              <input
                type="number"
                min={1}
                max={45}
                value={maxWeeklyPeriods}
                onChange={(e) =>
                  setMaxWeeklyPeriods(Math.max(1, Math.min(45, Number(e.target.value) || 28)))
                }
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded font-mono text-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Equipment / Qualification Notes
              </label>
              <input
                type="text"
                placeholder="e.g., Robotics kit A, Computer Lab 1"
                value={equipmentNotes}
                onChange={(e) => setEquipmentNotes(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs items-end">
            <div>
              <div className="font-medium text-slate-700 mb-1">
                Allocated Days (optional availability / Clubs / Maktaba)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {weekdays.map((day) => {
                  const active = allowedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-2 py-1 rounded border text-xs font-medium ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="font-medium text-slate-700 mb-1">
                Allocated Periods (optional)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
                  const active = allowedPeriods.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePeriod(p)}
                      className={`w-8 h-7 rounded border font-mono text-xs font-medium ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      P{p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                {saving
                  ? 'Saving...'
                  : replaceExisting
                    ? 'Replace & Sync Assignment'
                    : 'Save Teacher Assignment'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Existing Assignments Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserCheck className="w-4 h-4 text-slate-600" />
            <span>Authorized Teacher & Supervisor Assignments</span>
            <span className="font-mono text-xs font-normal text-slate-500">
              ({filteredAssignments.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${
                filterCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilterCategory(c.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${
                  filterCategory === c.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4">Teacher / Supervisor</th>
                <th className="py-2.5 px-4">Category & Subject</th>
                <th className="py-2.5 px-4">Grade & Stream</th>
                <th className="py-2.5 px-4 text-center">Lessons / Week</th>
                <th className="py-2.5 px-4">Source & Facility</th>
                <th className="py-2.5 px-4 text-right">Teacher Load</th>
                {canManage && <th className="py-2.5 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 7 : 6}
                    className="py-8 px-4 text-center text-xs text-slate-500"
                  >
                    No teacher assignments configured yet for this filter. Use the form above to
                    authorize teachers with exact category, subject, grade, stream, and weekly
                    lesson counts.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((a) => {
                  const sub = subjectById.get(a.subjectId);
                  const fac = a.facilityId ? facilityById.get(a.facilityId) : null;
                  const cat = categories.find((c) => c.id === a.categoryId);
                  const teacherTotal =
                    teacherLoadSummary.find((t) => t.teacherId === a.teacherId)?.linkedLessons ?? 0;
                  const isBridgedLms = a.id.startsWith('lms_');
                  const isConcreteStream = a.grade !== null && Boolean(a.stream);
                  const effectiveLessons =
                    a.lessonsPerWeek !== null && a.lessonsPerWeek !== undefined
                      ? a.lessonsPerWeek
                      : sub?.lessonsPerWeek ?? 0;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-900">{a.teacherName}</div>
                        <div className="text-xs text-slate-500">
                          {ROLE_LABELS[a.roleType]}
                          {a.teacherEmail ? ` · ${a.teacherEmail}` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-900">
                          {sub?.name || a.subjectId}
                        </div>
                        <div className="text-xs text-slate-500">{cat?.label}</div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-700 font-medium">
                        {a.grade
                          ? `Grade ${a.grade}${a.stream ? ` · ${a.stream}` : ' (All streams)'}`
                          : 'All grades in category'}
                      </td>
                      <td className="py-2.5 px-4">
                        {isConcreteStream && canManage && !isBridgedLms ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              disabled={updatingRowId === a.id || effectiveLessons <= 0}
                              onClick={() => handleAdjustRowLessons(a, -1)}
                              className="w-6 h-6 inline-flex items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-10 text-center font-mono text-xs font-semibold text-slate-900 tabular-nums">
                              {effectiveLessons}
                            </span>
                            <button
                              type="button"
                              disabled={updatingRowId === a.id || effectiveLessons >= 30}
                              onClick={() => handleAdjustRowLessons(a, 1)}
                              className="w-6 h-6 inline-flex items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center font-mono text-xs font-semibold text-slate-700 tabular-nums">
                            {effectiveLessons}/wk
                            <span className="block text-[10px] font-sans font-normal text-slate-400">
                              {isBridgedLms
                                ? 'EduSmart LMS'
                                : isConcreteStream
                                  ? 'Fixed'
                                  : 'From category'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <GitBranch className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {isBridgedLms
                              ? 'EduSmart LMS Staff Record'
                              : a.allocationSource === 'category_redistribution'
                                ? 'Category Redistributed'
                                : 'Individual Assignment'}
                          </span>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {fac ? fac.name : 'Default venue'}
                          {a.allowedDays.length > 0 &&
                            ` · ${a.allowedDays.map((d) => d.slice(0, 3)).join(', ')}`}
                          {a.allowedPeriods.length > 0 &&
                            ` · P${a.allowedPeriods.join(', P')}`}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-xs tabular-nums">
                        <div
                          className={`font-semibold ${
                            teacherTotal > maxPhysicalRegularSlots
                              ? 'text-red-600'
                              : teacherTotal > a.maxWeeklyPeriods
                                ? 'text-amber-700'
                                : 'text-slate-900'
                          }`}
                        >
                          {teacherTotal} / {a.maxWeeklyPeriods}p
                        </div>
                        <div className="text-[10px] font-sans text-slate-400">
                          {teacherTotal > maxPhysicalRegularSlots
                            ? 'Exceeds week slots'
                            : teacherTotal > a.maxWeeklyPeriods
                              ? 'Above target max'
                              : 'Collision-safe'}
                        </div>
                      </td>
                      {canManage && (
                        <td className="py-2.5 px-4 text-right">
                          {isBridgedLms ? (
                            <span className="text-[11px] text-slate-400 whitespace-nowrap">
                              LMS Synced
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDelete(a.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded whitespace-nowrap shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Teacher Cumulative Weekly Load & Zero-Collision Audit */}
      {teacherLoadSummary.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Teacher Cumulative Weekly Load (Cross-Category Collision Guard)</span>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              Physical Weekly Ceiling: {maxPhysicalRegularSlots} periods
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-2 px-4">Teacher / Supervisor</th>
                  <th className="py-2 px-4">Categories Covered</th>
                  <th className="py-2 px-4 text-right">Linked Stream-Subjects</th>
                  <th className="py-2 px-4 text-right">Assigned / Target Max</th>
                  <th className="py-2 px-4 text-right">Feasibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {teacherLoadSummary.map((row) => {
                  const exceedsPhysical = row.linkedLessons > maxPhysicalRegularSlots;
                  const exceedsTarget = row.linkedLessons > row.maxWeeklyPeriods;
                  return (
                    <tr key={row.teacherId} className="hover:bg-slate-50/70">
                      <td className="py-2 px-4 font-medium text-slate-900">{row.teacherName}</td>
                      <td className="py-2 px-4 text-slate-600">
                        {Array.from(row.categories)
                          .map((cid) => categories.find((c) => c.id === cid)?.shortLabel || cid)
                          .join(', ')}
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums text-slate-700">
                        {row.streamCount}
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {row.linkedLessons} / {row.maxWeeklyPeriods}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {exceedsPhysical ? (
                          <span className="text-red-600 font-semibold">
                            Collision Risk (Over {maxPhysicalRegularSlots}p)
                          </span>
                        ) : exceedsTarget ? (
                          <span className="text-amber-700 font-medium">Over Target Load</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Feasible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
