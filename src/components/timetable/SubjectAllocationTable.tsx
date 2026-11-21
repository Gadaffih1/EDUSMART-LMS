import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import {
  FACILITY_TYPE_LABELS,
  ttApiFetch,
  type CategoryAllocationSummary,
  type GradeSubjectOverride,
  type ResolvedStreamAllocation,
  type ScheduleConfig,
  type TimetableCategoryId,
  type TimetableCategoryMeta,
  type TimetableFacility,
  type TimetableRemedialConfig,
  type TimetableStream,
  type TimetableSubject,
  type TimetableTeacherAssignment,
  type ValidationIssue,
} from './timetableTypes';

interface Props {
  schoolId?: string;
  categories: TimetableCategoryMeta[];
  weekdays: string[];
  scheduleConfigs: Record<TimetableCategoryId, ScheduleConfig>;
  subjects: TimetableSubject[];
  gradeOverrides: GradeSubjectOverride[];
  facilities: TimetableFacility[];
  streams: TimetableStream[];
  teacherAssignments: TimetableTeacherAssignment[];
  remedialConfigs: TimetableRemedialConfig[];
  streamAllocations: ResolvedStreamAllocation[];
  categoryTotals: CategoryAllocationSummary[];
  canManage: boolean;
  onRefresh: (versionId?: string) => Promise<void>;
  onGeneratedSuccess: (versionId: string, targetCategoryId?: TimetableCategoryId) => void;
  onJumpToTeachers: (categoryId: TimetableCategoryId, subjectId: string) => void;
  onJumpToRemedials: (
    categoryId: TimetableCategoryId,
    remedialType: 'remedial_1' | 'remedial_2'
  ) => void;
}

interface EditableSubjectRow {
  id: string;
  lessonsPerWeek: number;
  defaultFacilityId: string;
  equipmentNotes: string;
  allowedDays: string[];
  allowedPeriods: number[];
  isActive: boolean;
}

export const SubjectAllocationTable: React.FC<Props> = ({
  schoolId,
  categories,
  weekdays,
  scheduleConfigs,
  subjects,
  gradeOverrides,
  facilities,
  streams,
  teacherAssignments,
  remedialConfigs,
  categoryTotals,
  canManage,
  onRefresh,
  onGeneratedSuccess,
  onJumpToTeachers,
  onJumpToRemedials,
}) => {
  const [activeCategory, setActiveCategory] = useState<TimetableCategoryId>('cat_1_3');
  const [drafts, setDrafts] = useState<Record<string, EditableSubjectRow>>({});
  // Key: `${grade}::${subjectId}` -> string value ('' = inherit category default)
  const [overrideDrafts, setOverrideDrafts] = useState<Record<string, string>>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [generatingScope, setGeneratingScope] = useState<TimetableCategoryId | 'whole_school' | null>(
    null
  );
  const [termLabel, setTermLabel] = useState('Term 1');
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));

  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [generationIssues, setGenerationIssues] = useState<ValidationIssue[]>([]);
  const [unplacedErrors, setUnplacedErrors] = useState<
    Array<{ grade: number; stream: string; subjectName: string; reason: string }>
  >([]);

  const currentConfig = scheduleConfigs[activeCategory];
  const currentCategoryMeta = categories.find((c) => c.id === activeCategory);
  const [periodsPerDay, setPeriodsPerDay] = useState<number>(currentConfig?.periodsPerDay ?? 8);
  const [periodDurationMins, setPeriodDurationMins] = useState<number>(
    currentConfig?.periodDurationMins ?? 35
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(currentConfig?.days ?? weekdays);

  useEffect(() => {
    const cfg = scheduleConfigs[activeCategory];
    if (cfg) {
      setPeriodsPerDay(cfg.periodsPerDay);
      setPeriodDurationMins(cfg.periodDurationMins);
      setSelectedDays(cfg.days);
    }
  }, [activeCategory, scheduleConfigs]);

  const categorySubjects = useMemo(
    () =>
      subjects
        .filter((s) => s.categoryId === activeCategory)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [subjects, activeCategory]
  );

  const categoryStreams = useMemo(
    () => streams.filter((st) => st.categoryId === activeCategory),
    [streams, activeCategory]
  );

  const categoryGrades = useMemo(() => {
    const metaGrades = currentCategoryMeta?.grades ?? [];
    const activeGrades = Array.from(new Set(categoryStreams.map((s) => s.grade))).sort(
      (a, b) => a - b
    );
    return activeGrades.length > 0 ? activeGrades : metaGrades;
  }, [currentCategoryMeta, categoryStreams]);

  // Sync server subjects & overrides into local drafts when category or server data changes
  useEffect(() => {
    const next: Record<string, EditableSubjectRow> = {};
    for (const s of categorySubjects) {
      next[s.id] = {
        id: s.id,
        lessonsPerWeek: s.lessonsPerWeek,
        defaultFacilityId: s.defaultFacilityId || '',
        equipmentNotes: s.equipmentNotes || '',
        allowedDays: s.allowedDays || [],
        allowedPeriods: s.allowedPeriods || [],
        isActive: s.isActive,
      };
    }
    setDrafts(next);

    const nextOv: Record<string, string> = {};
    for (const ov of gradeOverrides) {
      if (ov.categoryId === activeCategory) {
        nextOv[`${ov.grade}::${ov.subjectId}`] = String(ov.lessonsPerWeek);
      }
    }
    setOverrideDrafts(nextOv);
    setExpandedRowId(null);
  }, [categorySubjects, gradeOverrides, activeCategory]);

  const hasDirtySubjects = useMemo(() => {
    return categorySubjects.some((s) => {
      const d = drafts[s.id];
      if (!d) return false;
      return (
        d.lessonsPerWeek !== s.lessonsPerWeek ||
        (d.defaultFacilityId || '') !== (s.defaultFacilityId || '') ||
        d.equipmentNotes !== (s.equipmentNotes || '') ||
        JSON.stringify(d.allowedDays) !== JSON.stringify(s.allowedDays || []) ||
        JSON.stringify(d.allowedPeriods) !== JSON.stringify(s.allowedPeriods || [])
      );
    });
  }, [categorySubjects, drafts]);

  const hasDirtyOverrides = useMemo(() => {
    const serverMap = new Map<string, string>();
    for (const ov of gradeOverrides) {
      if (ov.categoryId === activeCategory) {
        serverMap.set(`${ov.grade}::${ov.subjectId}`, String(ov.lessonsPerWeek));
      }
    }
    const allKeys = new Set([...serverMap.keys(), ...Object.keys(overrideDrafts)]);
    for (const k of allKeys) {
      if ((serverMap.get(k) ?? '') !== (overrideDrafts[k] ?? '')) {
        return true;
      }
    }
    return false;
  }, [gradeOverrides, overrideDrafts, activeCategory]);

  const hasDirtyChanges = hasDirtySubjects || hasDirtyOverrides;

  const hasDirtySchedule = useMemo(() => {
    if (!currentConfig) return false;
    return (
      periodsPerDay !== currentConfig.periodsPerDay ||
      periodDurationMins !== currentConfig.periodDurationMins ||
      JSON.stringify(selectedDays) !== JSON.stringify(currentConfig.days)
    );
  }, [currentConfig, periodsPerDay, periodDurationMins, selectedDays]);

  const availableRegularPeriods = selectedDays.length * periodsPerDay;

  const totals = useMemo(() => {
    let coreTotal = 0;
    let commonTotal = 0;
    let remedialTotal = 0;

    for (const s of categorySubjects) {
      const count = drafts[s.id]?.lessonsPerWeek ?? s.lessonsPerWeek;
      if (s.subjectKind === 'core') coreTotal += count;
      else if (s.subjectKind === 'common_activity') commonTotal += count;
      else remedialTotal += count;
    }

    const regularAllocated = coreTotal + commonTotal;
    const remainingRegular = availableRegularPeriods - regularAllocated;
    return { coreTotal, commonTotal, remedialTotal, regularAllocated, remainingRegular };
  }, [categorySubjects, drafts, availableRegularPeriods]);

  const updateRow = (id: string, patch: Partial<EditableSubjectRow>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }));
    setFeedback(null);
  };

  const adjustLessons = (id: string, delta: number) => {
    const current = drafts[id]?.lessonsPerWeek ?? 0;
    const next = Math.max(0, Math.min(30, current + delta));
    updateRow(id, { lessonsPerWeek: next });
  };

  const toggleDayOnSubject = (id: string, day: string) => {
    const current = drafts[id]?.allowedDays ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    updateRow(id, { allowedDays: next });
  };

  const togglePeriodOnSubject = (id: string, periodNum: number) => {
    const current = drafts[id]?.allowedPeriods ?? [];
    const next = current.includes(periodNum)
      ? current.filter((p) => p !== periodNum)
      : [...current, periodNum].sort((a, b) => a - b);
    updateRow(id, { allowedPeriods: next });
  };

  const resetDrafts = () => {
    const reset: Record<string, EditableSubjectRow> = {};
    for (const s of categorySubjects) {
      reset[s.id] = {
        id: s.id,
        lessonsPerWeek: s.lessonsPerWeek,
        defaultFacilityId: s.defaultFacilityId || '',
        equipmentNotes: s.equipmentNotes || '',
        allowedDays: s.allowedDays || [],
        allowedPeriods: s.allowedPeriods || [],
        isActive: s.isActive,
      };
    }
    setDrafts(reset);

    const nextOv: Record<string, string> = {};
    for (const ov of gradeOverrides) {
      if (ov.categoryId === activeCategory) {
        nextOv[`${ov.grade}::${ov.subjectId}`] = String(ov.lessonsPerWeek);
      }
    }
    setOverrideDrafts(nextOv);
    setFeedback(null);
  };

  const persistCurrentCategory = async () => {
    if (hasDirtySubjects) {
      const payload = categorySubjects.map((s) => {
        const d = drafts[s.id];
        return {
          id: s.id,
          lessonsPerWeek: d ? d.lessonsPerWeek : s.lessonsPerWeek,
          defaultFacilityId: d?.defaultFacilityId || null,
          equipmentNotes: d?.equipmentNotes || '',
          allowedDays: d?.allowedDays || [],
          allowedPeriods: d?.allowedPeriods || [],
          isActive: d ? d.isActive : s.isActive,
        };
      });

      await ttApiFetch(
        `/api/timetable/allocations/${activeCategory}`,
        {
          method: 'PUT',
          body: JSON.stringify({ allocations: payload }),
        },
        schoolId
      );
    }

    if (hasDirtyOverrides) {
      const overridesPayload: Array<{
        grade: number;
        subjectId: string;
        lessonsPerWeek: number | null;
      }> = [];
      for (const grade of categoryGrades) {
        for (const sub of categorySubjects) {
          const key = `${grade}::${sub.id}`;
          const raw = overrideDrafts[key];
          if (raw === undefined || raw.trim() === '') {
            overridesPayload.push({ grade, subjectId: sub.id, lessonsPerWeek: null });
          } else {
            overridesPayload.push({
              grade,
              subjectId: sub.id,
              lessonsPerWeek: Math.max(0, Math.min(30, Math.trunc(Number(raw) || 0))),
            });
          }
        }
      }

      await ttApiFetch(
        `/api/timetable/grade-overrides/${activeCategory}`,
        {
          method: 'PUT',
          body: JSON.stringify({ overrides: overridesPayload }),
        },
        schoolId
      );
    }
  };

  const handleSaveSchedule = async () => {
    if (!canManage) return;
    setSavingSchedule(true);
    setFeedback(null);
    try {
      await ttApiFetch(
        `/api/timetable/schedule-config/${activeCategory}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            days: selectedDays,
            periodsPerDay,
            periodDurationMins,
            allocationMode: 'category_redistribution',
          }),
        },
        schoolId
      );
      await onRefresh();
      setFeedback({ type: 'ok', text: 'Working days and period schedule saved to database.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to save schedule settings.' });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSaveAllocations = async () => {
    if (!canManage) return;
    setSaving(true);
    setFeedback(null);
    try {
      await persistCurrentCategory();
      await onRefresh();
      setFeedback({
        type: 'ok',
        text: `Weekly lesson allocations saved for ${currentCategoryMeta?.label || activeCategory}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to save allocations.' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (targetCategoryId?: TimetableCategoryId) => {
    if (!canManage) return;
    const scopeKey = targetCategoryId ?? 'whole_school';
    setGeneratingScope(scopeKey);
    setFeedback(null);
    setGenerationIssues([]);
    setUnplacedErrors([]);

    try {
      // Automatically persist any unsaved edits in the active category before generating
      if (hasDirtyChanges) {
        await persistCurrentCategory();
      }
      if (hasDirtySchedule) {
        await ttApiFetch(
          `/api/timetable/schedule-config/${activeCategory}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              days: selectedDays,
              periodsPerDay,
              periodDurationMins,
              allocationMode: 'category_redistribution',
            }),
          },
          schoolId
        );
      }

      const resp = await ttApiFetch(
        '/api/timetable/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            termLabel,
            academicYear,
            targetCategoryId: targetCategoryId || undefined,
          }),
        },
        schoolId
      );

      await onRefresh(resp.version?.id);
      if (resp.version?.id) {
        onGeneratedSuccess(resp.version.id, targetCategoryId);
      }
    } catch (err: any) {
      const payload = err?.payload;
      if (Array.isArray(payload?.audit?.readinessIssues)) {
        setGenerationIssues(payload.audit.readinessIssues);
      }
      if (Array.isArray(payload?.unplacedTasks)) {
        setUnplacedErrors(payload.unplacedTasks);
      }
      setFeedback({
        type: 'err',
        text: err.message || 'Timetable generation could not complete. Review details below.',
      });
    } finally {
      setGeneratingScope(null);
    }
  };

  const regularPeriodNumbers = Array.from({ length: periodsPerDay }, (_, idx) => idx + 1);

  return (
    <div className="space-y-5">
      {/* Three Independent Category Tabs + Save Allocation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isSelected = cat.id === activeCategory;
            const catSummary = categoryTotals.find((c) => c.categoryId === cat.id);
            const catAllocated = catSummary?.totalAllocatedRegularLessons ?? 0;
            const cfg = scheduleConfigs[cat.id];
            const catAvailable = cfg ? cfg.days.length * cfg.periodsPerDay : 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setFeedback(null);
                  setGenerationIssues([]);
                  setUnplacedErrors([]);
                }}
                className={`px-3.5 py-2 rounded-md text-sm font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`ml-2 font-mono text-xs tabular-nums ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {catAllocated}/{catAvailable}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {hasDirtyChanges && (
            <button
              type="button"
              onClick={resetDrafts}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Discard
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={handleSaveAllocations}
              disabled={saving || !hasDirtyChanges}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                hasDirtyChanges
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Allocation'}
            </button>
          )}
        </div>
      </div>

      {/* Prominent Automatic Timetable Generation Action Bar */}
      {canManage && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Automatic Timetable Generator</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Enter lessons per week below, save, and generate an individual category (keeping
                other categories untouched while checking school-wide teacher &amp; facility
                availability) or the whole school at once.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="flex items-center gap-1.5 text-slate-600">
                <span>Term</span>
                <input
                  type="text"
                  value={termLabel}
                  onChange={(e) => setTermLabel(e.target.value)}
                  className="w-24 px-2 py-1.5 border border-slate-300 rounded text-slate-900"
                />
              </label>
              <label className="flex items-center gap-1.5 text-slate-600">
                <span>Year</span>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-20 px-2 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={generatingScope !== null}
              onClick={() => handleGenerate('cat_1_3')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600" />
              {generatingScope === 'cat_1_3' ? 'Generating...' : 'Generate Grades 1–3'}
            </button>
            <button
              type="button"
              disabled={generatingScope !== null}
              onClick={() => handleGenerate('cat_4_6')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600" />
              {generatingScope === 'cat_4_6' ? 'Generating...' : 'Generate Grades 4–6'}
            </button>
            <button
              type="button"
              disabled={generatingScope !== null}
              onClick={() => handleGenerate('cat_7_9')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600" />
              {generatingScope === 'cat_7_9' ? 'Generating...' : 'Generate Grades 7–9'}
            </button>
            <button
              type="button"
              disabled={generatingScope !== null}
              onClick={() => handleGenerate(undefined)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap shrink-0 ml-auto"
            >
              <Play className="w-3.5 h-3.5" />
              {generatingScope === 'whole_school' ? 'Generating Whole School...' : 'Generate Whole School'}
            </button>
          </div>
        </div>
      )}

      {/* Feedback & Generation Error Details */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-md border text-sm space-y-2 ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium">{feedback.text}</span>
            <button
              type="button"
              onClick={() => {
                setFeedback(null);
                setGenerationIssues([]);
                setUnplacedErrors([]);
              }}
              className="text-xs font-medium underline whitespace-nowrap shrink-0"
            >
              Dismiss
            </button>
          </div>

          {generationIssues.length > 0 && (
            <div className="pt-2 border-t border-red-200/70 space-y-1 text-xs">
              {generationIssues.slice(0, 10).map((issue, idx) => (
                <div key={`${issue.code}_${idx}`}>
                  <span className="font-semibold uppercase mr-1.5">[{issue.severity}]</span>
                  {issue.message}
                </div>
              ))}
              {generationIssues.length > 10 && (
                <div className="text-red-700/80">
                  +{generationIssues.length - 10} additional validation notice(s)
                </div>
              )}
            </div>
          )}

          {unplacedErrors.length > 0 && (
            <div className="pt-2 border-t border-red-200/70 space-y-1 text-xs">
              {unplacedErrors.slice(0, 10).map((u, idx) => (
                <div key={idx}>
                  <span className="font-semibold">[UNPLACED]</span> Grade {u.grade} {u.stream} ·{' '}
                  {u.subjectName}: {u.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compact Capacity & Live Weekly Totals Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs font-medium text-slate-500">Available Weekly Periods</div>
              <div className="text-xl font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                {availableRegularPeriods}
                <span className="text-xs font-sans font-normal text-slate-500 ml-1.5">
                  ({selectedDays.length}d × {periodsPerDay}p · {categoryStreams.length} stream
                  {categoryStreams.length === 1 ? '' : 's'})
                </span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="text-xs font-medium text-slate-500">Total Weekly Lessons</div>
              <div className="text-xl font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                {totals.regularAllocated}
                <span className="text-xs font-sans font-normal text-slate-500 ml-1.5">
                  Core {totals.coreTotal} · Common {totals.commonTotal}
                  {totals.remedialTotal > 0 ? ` · Remedial ${totals.remedialTotal}` : ''}
                </span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="text-xs font-medium text-slate-500">Remaining Periods</div>
              <div
                className={`text-xl font-semibold font-mono tabular-nums mt-0.5 ${
                  totals.remainingRegular < 0
                    ? 'text-red-600'
                    : totals.remainingRegular === 0
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                }`}
              >
                {totals.remainingRegular}
                <span className="text-xs font-sans font-normal ml-1.5">
                  {totals.remainingRegular < 0
                    ? 'Over capacity'
                    : totals.remainingRegular === 0
                      ? 'Exact fit'
                      : 'Unallocated'}
                </span>
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 text-slate-600">
                <span>Periods/Day</span>
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={periodsPerDay}
                  onChange={(e) =>
                    setPeriodsPerDay(Math.max(4, Math.min(12, Number(e.target.value) || 4)))
                  }
                  className="w-16 px-2 py-1 border border-slate-300 rounded text-slate-900 font-mono tabular-nums text-center"
                />
              </label>
              <label className="flex items-center gap-1.5 text-slate-600">
                <span>Mins/Period</span>
                <input
                  type="number"
                  min={20}
                  max={90}
                  value={periodDurationMins}
                  onChange={(e) =>
                    setPeriodDurationMins(Math.max(20, Math.min(90, Number(e.target.value) || 35)))
                  }
                  className="w-16 px-2 py-1 border border-slate-300 rounded text-slate-900 font-mono tabular-nums text-center"
                />
              </label>
              {hasDirtySchedule && (
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  disabled={savingSchedule}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  {savingSchedule ? 'Updating...' : 'Apply'}
                </button>
              )}
            </div>
          )}
        </div>

        {totals.remainingRegular < 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Allocated weekly lessons exceed available periods by{' '}
              <strong className="font-mono">{Math.abs(totals.remainingRegular)}</strong>. Reduce
              lesson counts or increase Periods/Day before generating.
            </span>
          </div>
        )}
      </div>

      {/* Clean Subject Allocation Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Subject / Activity Name</th>
                <th className="py-3 px-4 text-center">Lessons Per Week</th>
                <th className="py-3 px-4">Assigned Teachers (EduSmart Records)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {categorySubjects.map((sub, idx) => {
                const draft = drafts[sub.id] ?? {
                  id: sub.id,
                  lessonsPerWeek: sub.lessonsPerWeek,
                  defaultFacilityId: sub.defaultFacilityId || '',
                  equipmentNotes: sub.equipmentNotes || '',
                  allowedDays: sub.allowedDays || [],
                  allowedPeriods: sub.allowedPeriods || [],
                  isActive: sub.isActive,
                };

                const assigned = teacherAssignments.filter(
                  (ta) => ta.isActive && ta.categoryId === activeCategory && ta.subjectId === sub.id
                );
                const uniqueTeacherNames = Array.from(new Set(assigned.map((a) => a.teacherName)));
                const remConfigsForSub =
                  sub.subjectKind === 'remedial'
                    ? remedialConfigs.filter(
                        (rc) =>
                          rc.isActive && rc.categoryId === activeCategory && rc.subjectId === sub.id
                      )
                    : [];

                const linkedFacility = draft.defaultFacilityId
                  ? facilities.find((f) => f.id === draft.defaultFacilityId)
                  : null;

                const isFirstAdditional =
                  sub.isAdditionalCommon &&
                  (idx === 0 || !categorySubjects[idx - 1].isAdditionalCommon);

                const isExpanded = expandedRowId === sub.id;
                const activeGradeOverrideCount = categoryGrades.filter((g) => {
                  const v = overrideDrafts[`${g}::${sub.id}`];
                  return v !== undefined && v.trim() !== '';
                }).length;

                const isModified =
                  draft.lessonsPerWeek !== sub.lessonsPerWeek ||
                  draft.defaultFacilityId !== (sub.defaultFacilityId || '') ||
                  draft.equipmentNotes !== (sub.equipmentNotes || '') ||
                  JSON.stringify(draft.allowedDays) !== JSON.stringify(sub.allowedDays || []) ||
                  JSON.stringify(draft.allowedPeriods) !== JSON.stringify(sub.allowedPeriods || []);

                const needsTeacherWarning =
                  draft.lessonsPerWeek > 0 &&
                  (sub.subjectKind === 'remedial'
                    ? remConfigsForSub.length === 0
                    : uniqueTeacherNames.length === 0);

                return (
                  <React.Fragment key={sub.id}>
                    {isFirstAdditional && (
                      <tr className="bg-slate-50/90 border-t border-slate-200">
                        <td
                          colSpan={4}
                          className="py-2 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider"
                        >
                          Additional Common Subjects &amp; Activities ({currentCategoryMeta?.shortLabel})
                        </td>
                      </tr>
                    )}

                    <tr
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isModified ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* Subject / Activity Name */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          <span>{sub.name}</span>
                          {isModified && (
                            <span className="text-[11px] font-medium text-indigo-700">
                              · Unsaved
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-mono">{sub.shortCode}</span>
                          {linkedFacility && (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Building2 className="w-3 h-3" />
                              {linkedFacility.name}
                            </span>
                          )}
                          {activeGradeOverrideCount > 0 && (
                            <span className="text-indigo-700 font-medium">
                              · {activeGradeOverrideCount} grade override
                              {activeGradeOverrideCount === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lessons Per Week (- / input / +) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={!canManage || draft.lessonsPerWeek <= 0}
                            onClick={() => adjustLessons(sub.id, -1)}
                            aria-label={`Decrease lessons per week for ${sub.name}`}
                            className="w-8 h-8 inline-flex items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={30}
                            disabled={!canManage}
                            aria-label={`Lessons per week for ${sub.name}`}
                            value={draft.lessonsPerWeek}
                            onChange={(e) => {
                              const parsed = Math.max(
                                0,
                                Math.min(30, Math.trunc(Number(e.target.value) || 0))
                              );
                              updateRow(sub.id, { lessonsPerWeek: parsed });
                            }}
                            className="w-16 h-8 text-center border border-slate-300 rounded font-mono text-sm font-semibold text-slate-900 tabular-nums focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
                          />
                          <button
                            type="button"
                            disabled={!canManage || draft.lessonsPerWeek >= 30}
                            onClick={() => adjustLessons(sub.id, 1)}
                            aria-label={`Increase lessons per week for ${sub.name}`}
                            className="w-8 h-8 inline-flex items-center justify-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Assigned Teachers (from EduSmart LMS + Timetable Assignments) */}
                      <td className="py-3 px-4 text-xs">
                        {sub.subjectKind === 'remedial' ? (
                          remConfigsForSub.length > 0 ? (
                            <span className="text-slate-700">
                              <span className="font-mono font-semibold text-slate-900">
                                {remConfigsForSub.length}
                              </span>{' '}
                              remedial group(s) configured
                            </span>
                          ) : (
                            <span
                              className={
                                needsTeacherWarning
                                  ? 'text-amber-700 font-medium inline-flex items-center gap-1'
                                  : 'text-slate-400'
                              }
                            >
                              {needsTeacherWarning && <AlertTriangle className="w-3.5 h-3.5" />}
                              {needsTeacherWarning
                                ? 'Remedial teacher & group required'
                                : 'No remedial groups yet'}
                            </span>
                          )
                        ) : uniqueTeacherNames.length > 0 ? (
                          <div className="text-slate-700">
                            <span className="font-medium text-slate-900">
                              {uniqueTeacherNames.slice(0, 2).join(', ')}
                            </span>
                            {uniqueTeacherNames.length > 2 && (
                              <span className="text-slate-500">
                                {' '}
                                +{uniqueTeacherNames.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span
                            className={
                              needsTeacherWarning
                                ? 'text-amber-700 font-medium inline-flex items-center gap-1'
                                : 'text-slate-400'
                            }
                          >
                            {needsTeacherWarning && <AlertTriangle className="w-3.5 h-3.5" />}
                            {needsTeacherWarning
                              ? 'Missing teacher assignment'
                              : 'Unassigned'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedRowId(isExpanded ? null : sub.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 whitespace-nowrap shrink-0"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            {isExpanded ? 'Close' : 'Grade Overrides & Lab'}
                          </button>
                          {sub.subjectKind === 'remedial' ? (
                            <button
                              type="button"
                              onClick={() =>
                                onJumpToRemedials(
                                  activeCategory,
                                  sub.code === 'remedial_2' ? 'remedial_2' : 'remedial_1'
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 whitespace-nowrap shrink-0"
                            >
                              Remedial Setup
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onJumpToTeachers(activeCategory, sub.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 whitespace-nowrap shrink-0"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Teachers
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Inline Grade Overrides, Facility & Allowed Slots Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="p-4 border-t border-slate-200">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                            {/* Grade-specific weekly lesson overrides */}
                            {sub.subjectKind !== 'remedial' && (
                              <div>
                                <div className="font-semibold text-slate-700 mb-1.5">
                                  Grade-Specific Weekly Overrides (optional)
                                </div>
                                <p className="text-[11px] text-slate-500 mb-2">
                                  Leave blank to inherit the category allocation (
                                  <span className="font-mono">{draft.lessonsPerWeek}</span>/wk).
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {categoryGrades.map((g) => {
                                    const key = `${g}::${sub.id}`;
                                    const val = overrideDrafts[key] ?? '';
                                    return (
                                      <label
                                        key={g}
                                        className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 py-1"
                                      >
                                        <span className="font-medium text-slate-700">
                                          Grade {g}
                                        </span>
                                        <input
                                          type="number"
                                          min={0}
                                          max={30}
                                          disabled={!canManage}
                                          placeholder={String(draft.lessonsPerWeek)}
                                          value={val}
                                          onChange={(e) => {
                                            setOverrideDrafts((prev) => ({
                                              ...prev,
                                              [key]: e.target.value,
                                            }));
                                            setFeedback(null);
                                          }}
                                          className="w-12 text-center border border-slate-300 rounded font-mono text-slate-900 py-0.5"
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Shared Facility Selection */}
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Shared Facility / Laboratory
                              </label>
                              <select
                                disabled={!canManage}
                                value={draft.defaultFacilityId}
                                onChange={(e) =>
                                  updateRow(sub.id, { defaultFacilityId: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                              >
                                <option value="">None (Standard Classroom)</option>
                                {facilities
                                  .filter((f) => f.isActive)
                                  .map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {f.name} ({FACILITY_TYPE_LABELS[f.facilityType]} · Cap:{' '}
                                      {f.capacityStreams})
                                    </option>
                                  ))}
                              </select>
                            </div>

                            {/* Allowed Days & Periods */}
                            <div className="space-y-2">
                              <div>
                                <div className="font-semibold text-slate-700 mb-1">
                                  Allowed Days (empty = any day)
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {weekdays.map((day) => {
                                    const active = draft.allowedDays.includes(day);
                                    return (
                                      <button
                                        key={day}
                                        type="button"
                                        disabled={!canManage}
                                        onClick={() => toggleDayOnSubject(sub.id, day)}
                                        className={`px-2 py-1 rounded border text-[11px] font-medium ${
                                          active
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {day.slice(0, 3)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold text-slate-700 mb-1">
                                  Allowed Periods (empty = any period)
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {regularPeriodNumbers.map((pNum) => {
                                    const active = draft.allowedPeriods.includes(pNum);
                                    return (
                                      <button
                                        key={pNum}
                                        type="button"
                                        disabled={!canManage}
                                        onClick={() => togglePeriodOnSubject(sub.id, pNum)}
                                        className={`w-7 h-7 rounded border font-mono text-[11px] font-medium ${
                                          active
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        P{pNum}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
