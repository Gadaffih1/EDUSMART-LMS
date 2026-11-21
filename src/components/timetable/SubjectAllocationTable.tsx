import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  Minus,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  UserPlus,
} from 'lucide-react';
import {
  FACILITY_TYPE_LABELS,
  ttApiFetch,
  type ScheduleConfig,
  type TimetableCategoryId,
  type TimetableCategoryMeta,
  type TimetableFacility,
  type TimetableRemedialConfig,
  type TimetableSubject,
  type TimetableTeacherAssignment,
} from './timetableTypes';

interface Props {
  categories: TimetableCategoryMeta[];
  weekdays: string[];
  scheduleConfigs: Record<TimetableCategoryId, ScheduleConfig>;
  subjects: TimetableSubject[];
  facilities: TimetableFacility[];
  teacherAssignments: TimetableTeacherAssignment[];
  remedialConfigs: TimetableRemedialConfig[];
  canManage: boolean;
  onRefresh: () => Promise<void>;
  onJumpToTeachers: (categoryId: TimetableCategoryId, subjectId: string) => void;
  onJumpToRemedials: (categoryId: TimetableCategoryId, remedialType: 'remedial_1' | 'remedial_2') => void;
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
  categories,
  weekdays,
  scheduleConfigs,
  subjects,
  facilities,
  teacherAssignments,
  remedialConfigs,
  canManage,
  onRefresh,
  onJumpToTeachers,
  onJumpToRemedials,
}) => {
  const [activeCategory, setActiveCategory] = useState<TimetableCategoryId>('cat_1_3');
  const [drafts, setDrafts] = useState<Record<string, EditableSubjectRow>>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const currentConfig = scheduleConfigs[activeCategory];
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

  // Sync server subjects into local draft map for the active category
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
    setExpandedRowId(null);
  }, [categorySubjects]);

  const hasDirtyChanges = useMemo(() => {
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
    setFeedback(null);
  };

  const handleSaveSchedule = async () => {
    if (!canManage) return;
    setSavingSchedule(true);
    setFeedback(null);
    try {
      await ttApiFetch(`/api/timetable/schedule-config/${activeCategory}`, {
        method: 'PUT',
        body: JSON.stringify({
          days: selectedDays,
          periodsPerDay,
          periodDurationMins,
        }),
      });
      await onRefresh();
      setFeedback({ type: 'ok', text: 'Category schedule limits saved to database.' });
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

      await ttApiFetch(`/api/timetable/allocations/${activeCategory}`, {
        method: 'PUT',
        body: JSON.stringify({ allocations: payload }),
      });
      await onRefresh();
      setFeedback({
        type: 'ok',
        text: `Weekly lesson allocations saved for ${categories.find((c) => c.id === activeCategory)?.label}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to save allocations.' });
    } finally {
      setSaving(false);
    }
  };

  const regularPeriodNumbers = Array.from({ length: periodsPerDay }, (_, idx) => idx + 1);

  return (
    <div className="space-y-5">
      {/* Category Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isSelected = cat.id === activeCategory;
            const catSubs = subjects.filter((s) => s.categoryId === cat.id);
            const catAllocated = catSubs
              .filter((s) => s.subjectKind !== 'remedial')
              .reduce((acc, s) => acc + s.lessonsPerWeek, 0);
            const cfg = scheduleConfigs[cat.id];
            const catAvailable = cfg ? cfg.days.length * cfg.periodsPerDay : 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setFeedback(null);
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
              Discard Changes
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
              {saving ? 'Saving...' : 'Save Allocations'}
            </button>
          )}
        </div>
      </div>

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
            className="text-xs font-medium underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Compact Schedule Capacity & Live Allocation Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs font-medium text-slate-500">Available Weekly Periods</div>
              <div className="text-xl font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                {availableRegularPeriods}
                <span className="text-xs font-sans font-normal text-slate-500 ml-1.5">
                  ({selectedDays.length}d × {periodsPerDay}p)
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
              <div className="text-xs font-medium text-slate-500">Remaining Available Periods</div>
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
                      ? 'Balanced'
                      : 'Unallocated'}
                </span>
              </div>
            </div>
          </div>

          {/* Inline Periods/Day & Duration Config */}
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
                <span>Minutes/Period</span>
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
                  {savingSchedule ? 'Updating...' : 'Apply Limits'}
                </button>
              )}
            </div>
          )}
        </div>

        {totals.remainingRegular < 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Regular weekly allocations exceed available periods by{' '}
              <strong className="font-mono">{Math.abs(totals.remainingRegular)}</strong>. Reduce
              lesson counts or increase Periods/Day before generating.
            </span>
          </div>
        )}
      </div>

      {/* Unified Weekly Subject & Activity Allocation Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Subject / Activity Name</th>
                <th className="py-3 px-4">Category & Facility</th>
                <th className="py-3 px-4 text-center">Lessons Per Week</th>
                <th className="py-3 px-4">Authorized Teachers / Config</th>
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
                const remConfigsForSub =
                  sub.subjectKind === 'remedial'
                    ? remedialConfigs.filter(
                        (rc) => rc.isActive && rc.categoryId === activeCategory && rc.subjectId === sub.id
                      )
                    : [];

                const linkedFacility = draft.defaultFacilityId
                  ? facilities.find((f) => f.id === draft.defaultFacilityId)
                  : null;

                const isFirstAdditional =
                  sub.isAdditionalCommon &&
                  (idx === 0 || !categorySubjects[idx - 1].isAdditionalCommon);

                const isExpanded = expandedRowId === sub.id;
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
                    : assigned.length === 0);

                return (
                  <React.Fragment key={sub.id}>
                    {isFirstAdditional && (
                      <tr className="bg-slate-50/80 border-t border-slate-200">
                        <td
                          colSpan={5}
                          className="py-2 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider"
                        >
                          Additional Common Subjects & Activities (Independent Allocation for{' '}
                          {categories.find((c) => c.id === activeCategory)?.shortLabel})
                        </td>
                      </tr>
                    )}
                    <tr
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isModified ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* Column 1: Subject / Activity Name */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          <span>{sub.name}</span>
                          {isModified && (
                            <span className="text-[11px] font-medium text-indigo-700">
                              · Unsaved
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          <span className="font-mono">{sub.shortCode}</span>
                          {' · '}
                          {sub.subjectKind === 'core'
                            ? 'Core Learning Area'
                            : sub.subjectKind === 'remedial'
                              ? 'Schedulable Remedial Type'
                              : 'Common Subject / Activity'}
                          {draft.allowedDays.length > 0 &&
                            ` · Days: ${draft.allowedDays.map((d) => d.slice(0, 3)).join(', ')}`}
                          {draft.allowedPeriods.length > 0 &&
                            ` · Periods: P${draft.allowedPeriods.join(', P')}`}
                        </div>
                      </td>

                      {/* Column 2: Shared Facility / Requirements */}
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {linkedFacility ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{linkedFacility.name}</span>
                          </div>
                        ) : sub.requiresFacilityType ? (
                          <span className="text-amber-700 font-medium">
                            Requires {FACILITY_TYPE_LABELS[sub.requiresFacilityType]}
                          </span>
                        ) : (
                          <span className="text-slate-400">Classroom / Flexible</span>
                        )}
                        {draft.equipmentNotes && (
                          <div className="text-slate-500 mt-0.5 truncate max-w-[220px]">
                            {draft.equipmentNotes}
                          </div>
                        )}
                      </td>

                      {/* Column 3: Lessons Per Week (- / numeric input / +) */}
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

                      {/* Column 4: Authorized Teachers / Remedial Config */}
                      <td className="py-3 px-4 text-xs">
                        {sub.subjectKind === 'remedial' ? (
                          remConfigsForSub.length > 0 ? (
                            <div className="text-slate-700">
                              <span className="font-mono font-semibold text-slate-900">
                                {remConfigsForSub.length}
                              </span>{' '}
                              remedial group(s) configured
                            </div>
                          ) : (
                            <span
                              className={
                                needsTeacherWarning
                                  ? 'text-amber-700 font-medium'
                                  : 'text-slate-400'
                              }
                            >
                              {needsTeacherWarning
                                ? 'Configure remedial groups & teacher'
                                : 'No remedial groups yet'}
                            </span>
                          )
                        ) : assigned.length > 0 ? (
                          <div className="text-slate-700">
                            <span className="font-mono font-semibold text-slate-900">
                              {assigned.length}
                            </span>{' '}
                            assigned ·{' '}
                            <span className="text-slate-500">
                              {assigned
                                .slice(0, 2)
                                .map((a) => a.teacherName)
                                .join(', ')}
                              {assigned.length > 2 ? ` +${assigned.length - 2}` : ''}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={
                              needsTeacherWarning
                                ? 'text-amber-700 font-medium'
                                : 'text-slate-400'
                            }
                          >
                            {needsTeacherWarning
                              ? 'Teacher assignment required'
                              : 'Not assigned (manual setup)'}
                          </span>
                        )}
                      </td>

                      {/* Column 5: Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRowId(isExpanded ? null : sub.id)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 whitespace-nowrap shrink-0"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            {isExpanded ? 'Hide Rules' : 'Facility & Slots'}
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
                              Configure Groups
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onJumpToTeachers(activeCategory, sub.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 whitespace-nowrap shrink-0"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Assign Teacher
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Inline Facility, Equipment & Allowed Days/Periods Editor */}
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={5} className="p-4 border-t border-slate-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
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
                                      {f.capacityStreams} stream{f.capacityStreams > 1 ? 's' : ''})
                                    </option>
                                  ))}
                              </select>
                              <label className="block font-semibold text-slate-700 mt-2.5 mb-1">
                                Equipment / Lab Requirements
                              </label>
                              <input
                                type="text"
                                disabled={!canManage}
                                placeholder="e.g., Robotics kits, 40 PCs, Projector..."
                                value={draft.equipmentNotes}
                                onChange={(e) =>
                                  updateRow(sub.id, { equipmentNotes: e.target.value })
                                }
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                              />
                            </div>

                            <div>
                              <div className="font-semibold text-slate-700 mb-1">
                                Allocated Days (leave empty for any day)
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {weekdays.map((day) => {
                                  const active = draft.allowedDays.includes(day);
                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      disabled={!canManage}
                                      onClick={() => toggleDayOnSubject(sub.id, day)}
                                      className={`px-2.5 py-1 rounded border text-xs font-medium ${
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
                              <div className="font-semibold text-slate-700 mb-1">
                                Allocated Periods (leave empty for any period)
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {regularPeriodNumbers.map((p) => {
                                  const active = draft.allowedPeriods.includes(p);
                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      disabled={!canManage}
                                      onClick={() => togglePeriodOnSubject(sub.id, p)}
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
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-slate-900 text-sm">
                <td className="py-3 px-4" colSpan={2}>
                  Weekly Allocation Total ({categories.find((c) => c.id === activeCategory)?.label})
                </td>
                <td className="py-3 px-4 text-center font-mono tabular-nums">
                  {totals.regularAllocated} / {availableRegularPeriods} regular
                  {totals.remedialTotal > 0 && (
                    <span className="text-xs font-normal text-slate-500 block">
                      +{totals.remedialTotal} remedial
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono tabular-nums text-xs" colSpan={2}>
                  Remaining Available Periods:{' '}
                  <span
                    className={
                      totals.remainingRegular < 0
                        ? 'text-red-600'
                        : totals.remainingRegular === 0
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                    }
                  >
                    {totals.remainingRegular}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
