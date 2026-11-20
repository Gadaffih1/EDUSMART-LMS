import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Power,
  Undo2,
  X,
} from 'lucide-react';
import {
  ROOM_TYPE_LABELS,
  TTCategoryAllocationItem,
  TTCategoryCode,
  TTCategoryItem,
  TTGradeAllocationItem,
  TTGradeSchedule,
  TTSubjectItem,
  ttApiFetch,
} from './timetableTypes';

interface CentralCategoryAllocationsTableProps {
  categories?: TTCategoryItem[];
  categoryAllocations?: TTCategoryAllocationItem[];
  gradeSchedules: TTGradeSchedule[];
  gradeAllocations: TTGradeAllocationItem[];
  subjects: TTSubjectItem[];
  onRefresh: () => Promise<void>;
}

const DEFAULT_CATEGORIES: Array<{ code: TTCategoryCode; name: string; label: string; grades: number[] }> = [
  { code: 'lower_primary', name: 'Lower Primary', label: 'Grades 1–3', grades: [1, 2, 3] },
  { code: 'upper_primary', name: 'Upper Primary', label: 'Grades 4–6', grades: [4, 5, 6] },
  { code: 'junior_school', name: 'Junior School', label: 'Grades 7–9', grades: [7, 8, 9] },
];

const CURRICULUM_AND_ACTIVITY_SUGGESTIONS: Array<{ name: string; roomType: string; defaultWeekly: number }> = [
  { name: 'English', roomType: 'general', defaultWeekly: 5 },
  { name: 'Kiswahili', roomType: 'general', defaultWeekly: 4 },
  { name: 'Mathematics', roomType: 'general', defaultWeekly: 5 },
  { name: 'Science and Technology', roomType: 'science_lab', defaultWeekly: 4 },
  { name: 'Social Studies', roomType: 'general', defaultWeekly: 3 },
  { name: 'Religious Education', roomType: 'general', defaultWeekly: 3 },
  { name: 'Integrated Science', roomType: 'science_lab', defaultWeekly: 5 },
  { name: 'Pre-Technical Studies', roomType: 'workshop', defaultWeekly: 4 },
  { name: 'Agriculture', roomType: 'general', defaultWeekly: 3 },
  { name: 'Creative Arts', roomType: 'art_room', defaultWeekly: 3 },
  { name: 'Physical Education', roomType: 'field', defaultWeekly: 2 },
  { name: 'Health Education', roomType: 'general', defaultWeekly: 2 },
  { name: 'Life Skills', roomType: 'general', defaultWeekly: 1 },
  { name: 'Business Studies', roomType: 'general', defaultWeekly: 3 },
  { name: 'Computer Studies / ICT', roomType: 'computer_lab', defaultWeekly: 2 },
  { name: 'Swimming', roomType: 'swimming_pool', defaultWeekly: 1 },
  { name: 'Library', roomType: 'library', defaultWeekly: 1 },
  { name: 'Maktaba', roomType: 'maktaba', defaultWeekly: 1 },
  { name: 'Clubs', roomType: 'clubs', defaultWeekly: 1 },
  { name: 'Music', roomType: 'art_room', defaultWeekly: 2 },
  { name: 'Sports', roomType: 'field', defaultWeekly: 2 },
  { name: 'Performing Arts', roomType: 'art_room', defaultWeekly: 2 },
];

interface EditableRow {
  key: string;
  id?: string;
  subjectName: string;
  requiredWeeklyPeriods: number;
  singleLessons: number;
  doubleLessons: number;
  tripleLessons: number;
  requiredRoomType: string;
  maxPerDay: number;
  minSpacingDays: number;
  isActive: boolean;
  isCategoryOverride: boolean;
  categoryDefaultPeriods?: number;
  dirty?: boolean;
}

export const CentralCategoryAllocationsTable: React.FC<CentralCategoryAllocationsTableProps> = ({
  categories,
  categoryAllocations = [],
  gradeSchedules,
  gradeAllocations,
  subjects,
  onRefresh,
}) => {
  const categoryList = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((c) => {
        const grades: number[] = [];
        for (let g = c.minGrade; g <= c.maxGrade; g++) grades.push(g);
        return { code: c.code, name: c.name, label: c.label, grades };
      });
    }
    return DEFAULT_CATEGORIES;
  }, [categories]);

  const [activeCategory, setActiveCategory] = useState<TTCategoryCode>('lower_primary');
  // 'category' edits the category default; a number edits an individual grade override inside this category
  const [activeScope, setActiveScope] = useState<'category' | number>('category');
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newWeeklyPeriods, setNewWeeklyPeriods] = useState(2);
  const [newRoomType, setNewRoomType] = useState('general');
  const [newDoubleLessons, setNewDoubleLessons] = useState(0);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const currentCategoryObj = useMemo(
    () => categoryList.find((c) => c.code === activeCategory) || categoryList[0],
    [categoryList, activeCategory]
  );

  // Reset scope to category default whenever switching between Grades 1–3, 4–6, 7–9
  useEffect(() => {
    setActiveScope('category');
    setEditingRowKey(null);
  }, [activeCategory]);

  // Compute available weekly slots per category and per grade from tt_grade_schedules
  const availableSlotsForGrade = (grade: number): number => {
    const gs = gradeSchedules.find((g) => g.grade === grade);
    if (!gs) return grade <= 3 ? 35 : 40;
    const daysCount = gs.workingDays?.length || 5;
    const assemblyDeduct = gs.assemblyPeriod > 0 ? 1 : 0;
    return Math.max(1, daysCount * gs.periodsPerDay - assemblyDeduct);
  };

  // Live summary per category tab (for independent tab headers)
  const categoryStats = useMemo(() => {
    const map = new Map<TTCategoryCode, { total: number; available: number; remaining: number; activeCount: number }>();
    for (const cat of categoryList) {
      const catRows = categoryAllocations.filter((a) => a.categoryCode === cat.code && a.isActive);
      const total = catRows.reduce((s, r) => s + Number(r.requiredWeeklyPeriods || 0), 0);
      const refGrade = cat.grades.find((g) => gradeSchedules.some((gs) => gs.grade === g)) || cat.grades[0];
      const available = availableSlotsForGrade(refGrade);
      map.set(cat.code, {
        total,
        available,
        remaining: available - total,
        activeCount: catRows.length,
      });
    }
    return map;
  }, [categoryList, categoryAllocations, gradeSchedules]);

  // Hydrate editable table rows whenever category, scope, or DB allocations refresh
  useEffect(() => {
    const catDefaults = categoryAllocations.filter((a) => a.categoryCode === activeCategory);
    const catDefaultMap = new Map<string, TTCategoryAllocationItem>();
    for (const d of catDefaults) {
      catDefaultMap.set(d.subjectName.trim().toLowerCase(), d);
    }

    if (activeScope === 'category') {
      const next: EditableRow[] = catDefaults.map((a) => ({
        key: `cat::${a.subjectName.toLowerCase()}`,
        id: a.id,
        subjectName: a.subjectName,
        requiredWeeklyPeriods: a.requiredWeeklyPeriods,
        singleLessons: a.singleLessons,
        doubleLessons: a.doubleLessons,
        tripleLessons: a.tripleLessons,
        requiredRoomType: a.requiredRoomType || 'general',
        maxPerDay: a.maxPerDay || 1,
        minSpacingDays: a.minSpacingDays || 0,
        isActive: a.isActive,
        isCategoryOverride: false,
        dirty: false,
      }));
      next.sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.subjectName.localeCompare(b.subjectName));
      setRows(next);
    } else {
      const gRows = gradeAllocations.filter((g) => g.grade === activeScope);
      const merged = new Map<string, EditableRow>();

      // Start from category defaults so admin can see inherited subjects clearly
      for (const cd of catDefaults) {
        const k = cd.subjectName.trim().toLowerCase();
        merged.set(k, {
          key: `grade::${activeScope}::${k}`,
          subjectName: cd.subjectName,
          requiredWeeklyPeriods: cd.requiredWeeklyPeriods,
          singleLessons: cd.singleLessons,
          doubleLessons: cd.doubleLessons,
          tripleLessons: cd.tripleLessons,
          requiredRoomType: cd.requiredRoomType || 'general',
          maxPerDay: cd.maxPerDay || 1,
          minSpacingDays: cd.minSpacingDays || 0,
          isActive: cd.isActive,
          isCategoryOverride: false,
          categoryDefaultPeriods: cd.requiredWeeklyPeriods,
          dirty: false,
        });
      }

      // Layer actual grade rows on top
      for (const gr of gRows) {
        const k = gr.subjectName.trim().toLowerCase();
        const cd = catDefaultMap.get(k);
        const differsFromCat =
          Boolean(gr.isCategoryOverride) ||
          !cd ||
          gr.requiredWeeklyPeriods !== cd.requiredWeeklyPeriods ||
          gr.isActive !== cd.isActive;
        merged.set(k, {
          key: `grade::${activeScope}::${k}`,
          id: gr.id,
          subjectName: gr.subjectName,
          requiredWeeklyPeriods: gr.requiredWeeklyPeriods,
          singleLessons: gr.singleLessons,
          doubleLessons: gr.doubleLessons,
          tripleLessons: gr.tripleLessons,
          requiredRoomType: gr.requiredRoomType || 'general',
          maxPerDay: gr.maxPerDay || 1,
          minSpacingDays: gr.minSpacingDays || 0,
          isActive: gr.isActive,
          isCategoryOverride: differsFromCat,
          categoryDefaultPeriods: cd?.requiredWeeklyPeriods,
          dirty: false,
        });
      }

      const list = Array.from(merged.values()).sort(
        (a, b) => Number(b.isActive) - Number(a.isActive) || a.subjectName.localeCompare(b.subjectName)
      );
      setRows(list);
    }
  }, [activeCategory, activeScope, categoryAllocations, gradeAllocations]);

  const currentAvailableSlots = useMemo(() => {
    if (typeof activeScope === 'number') return availableSlotsForGrade(activeScope);
    const refGrade = currentCategoryObj.grades.find((g) => gradeSchedules.some((gs) => gs.grade === g)) || currentCategoryObj.grades[0];
    return availableSlotsForGrade(refGrade);
  }, [activeScope, currentCategoryObj, gradeSchedules]);

  const activeTotalLessons = useMemo(
    () => rows.filter((r) => r.isActive).reduce((sum, r) => sum + Number(r.requiredWeeklyPeriods || 0), 0),
    [rows]
  );
  const remainingSlots = currentAvailableSlots - activeTotalLessons;
  const activeCount = rows.filter((r) => r.isActive).length;
  const disabledCount = rows.length - activeCount;
  const dirtyRows = rows.filter((r) => r.dirty);

  const allocationWarnings = useMemo(() => {
    const warns: string[] = [];
    if (remainingSlots < 0) {
      warns.push(
        `Over-allocated by ${Math.abs(remainingSlots)} lesson(s): total weekly lessons (${activeTotalLessons}) exceed available weekly slots (${currentAvailableSlots}). Reduce allocations or increase daily periods before generating.`
      );
    } else if (remainingSlots > 5) {
      warns.push(
        `${remainingSlots} available weekly lesson slots are currently unallocated (${activeTotalLessons} / ${currentAvailableSlots} used).`
      );
    }
    const zeroActive = rows.filter((r) => r.isActive && r.requiredWeeklyPeriods <= 0);
    if (zeroActive.length > 0) {
      warns.push(
        `${zeroActive.map((z) => z.subjectName).join(', ')} has 0 weekly lessons. Set at least 1 lesson or disable it.`
      );
    }
    return warns;
  }, [remainingSlots, activeTotalLessons, currentAvailableSlots, rows]);

  const adjustRowLessons = (rowKey: string, nextWeeklyRaw: number) => {
    const nextWeekly = Math.max(0, Math.min(20, Math.floor(nextWeeklyRaw)));
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== rowKey) return r;
        const safeDoubles = Math.min(r.doubleLessons, Math.floor(nextWeekly / 2));
        const remAfterDoubles = nextWeekly - safeDoubles * 2;
        const safeTriples = Math.min(r.tripleLessons, Math.floor(remAfterDoubles / 3));
        const singles = Math.max(0, nextWeekly - safeDoubles * 2 - safeTriples * 3);
        return {
          ...r,
          requiredWeeklyPeriods: nextWeekly,
          singleLessons: singles,
          doubleLessons: safeDoubles,
          tripleLessons: safeTriples,
          dirty: true,
        };
      })
    );
  };

  const updateRowField = (rowKey: string, patch: Partial<EditableRow>) => {
    setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, ...patch, dirty: true } : r)));
  };

  const persistRows = async (targetRows: EditableRow[], label: string, extraFlag?: { resetToCategoryDefault?: boolean }) => {
    if (targetRows.length === 0) return;
    setBusyKey(label);
    setBanner(null);
    try {
      const payload =
        activeScope === 'category'
          ? {
              scope: 'category',
              categoryCode: activeCategory,
              propagateToGrades: true,
              allocations: targetRows.map((r) => ({
                subjectName: r.subjectName,
                requiredWeeklyPeriods: r.requiredWeeklyPeriods,
                singleLessons: r.singleLessons,
                doubleLessons: r.doubleLessons,
                tripleLessons: r.tripleLessons,
                requiredRoomType: r.requiredRoomType,
                maxPerDay: r.maxPerDay,
                minSpacingDays: r.minSpacingDays,
                isActive: r.isActive,
              })),
            }
          : {
              scope: 'grade',
              grade: activeScope,
              allocations: targetRows.map((r) => ({
                subjectName: r.subjectName,
                requiredWeeklyPeriods: r.requiredWeeklyPeriods,
                singleLessons: r.singleLessons,
                doubleLessons: r.doubleLessons,
                tripleLessons: r.tripleLessons,
                requiredRoomType: r.requiredRoomType,
                maxPerDay: r.maxPerDay,
                minSpacingDays: r.minSpacingDays,
                isActive: r.isActive,
                resetToCategoryDefault: Boolean(extraFlag?.resetToCategoryDefault),
              })),
            };

      await ttApiFetch('/api/timetable/allocations', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      await onRefresh();
      setEditingRowKey(null);
      setBanner({
        type: 'ok',
        text:
          activeScope === 'category'
            ? `Saved ${label} for ${currentCategoryObj.label} (${currentCategoryObj.name}) and synced non-overridden grades in this category only.`
            : extraFlag?.resetToCategoryDefault
            ? `Restored ${label} on Grade ${activeScope} to ${currentCategoryObj.label} category default.`
            : `Saved Grade ${activeScope} override for ${label} (other grades in ${currentCategoryObj.label} remain unchanged).`,
      });
    } catch (err: any) {
      setBanner({ type: 'err', text: err?.message || 'Failed to save subject allocations.' });
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleDisableRow = async (row: EditableRow) => {
    const updated: EditableRow = { ...row, isActive: !row.isActive };
    await persistRows([updated], `${row.subjectName} (${updated.isActive ? 'Restored' : 'Disabled'})`);
  };

  const handleAddSubjectOrActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSubjectName.trim();
    if (!clean) return;
    const weekly = Math.max(1, Math.min(20, Math.floor(newWeeklyPeriods)));
    const doubles = Math.min(Math.max(0, Math.floor(newDoubleLessons)), Math.floor(weekly / 2));
    const singles = weekly - doubles * 2;

    const newRow: EditableRow = {
      key: `new::${clean.toLowerCase()}`,
      subjectName: clean,
      requiredWeeklyPeriods: weekly,
      singleLessons: singles,
      doubleLessons: doubles,
      tripleLessons: 0,
      requiredRoomType: newRoomType,
      maxPerDay: doubles > 0 ? 2 : 1,
      minSpacingDays: weekly <= 2 ? 1 : 0,
      isActive: true,
      isCategoryOverride: typeof activeScope === 'number',
    };

    await persistRows([newRow], clean);
    setNewSubjectName('');
    setNewWeeklyPeriods(2);
    setNewDoubleLessons(0);
    setNewRoomType('general');
    setShowAddForm(false);
  };

  const allQuickPickOptions = useMemo(() => {
    const map = new Map<string, { name: string; roomType: string; defaultWeekly: number }>();
    for (const s of CURRICULUM_AND_ACTIVITY_SUGGESTIONS) {
      map.set(s.name.toLowerCase(), s);
    }
    for (const s of subjects) {
      const k = s.name.trim().toLowerCase();
      if (k && !map.has(k)) {
        map.set(k, { name: s.name, roomType: s.requiresRoomType || 'general', defaultWeekly: 2 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects]);

  const gradeOverrideCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const g of currentCategoryObj.grades) {
      const count = gradeAllocations.filter((ga) => ga.grade === g && ga.isCategoryOverride).length;
      map.set(g, count);
    }
    return map;
  }, [currentCategoryObj, gradeAllocations]);

  return (
    <div className="space-y-4">
      {/* Three Independent Central Subject Allocation Category Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-200 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {categoryList.map((cat) => {
            const isSelected = activeCategory === cat.code;
            const st = categoryStats.get(cat.code);
            const over = st ? st.remaining < 0 : false;
            return (
              <button
                key={cat.code}
                type="button"
                onClick={() => setActiveCategory(cat.code)}
                className={`px-5 py-4 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold tracking-tight">{cat.label}</span>
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold ${
                      isSelected
                        ? over
                          ? 'text-rose-300'
                          : 'text-emerald-300'
                        : over
                        ? 'text-rose-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {st ? `${st.total}/${st.available} lessons` : '—'}
                  </span>
                </div>
                <div className={`text-xs mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {cat.name} · Independent Allocation
                </div>
              </button>
            );
          })}
        </div>

        {/* Grade-Specific Adjustment Scope Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 mr-1">Allocation Scope:</span>
            <button
              type="button"
              onClick={() => setActiveScope('category')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeScope === 'category'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Category Default ({currentCategoryObj.label})
            </button>
            {currentCategoryObj.grades.map((g) => {
              const ovCount = gradeOverrideCounts.get(g) || 0;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveScope(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeScope === g
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Grade {g}
                  {ovCount > 0 && (
                    <span className={`ml-1.5 font-mono tabular-nums text-[11px] ${activeScope === g ? 'text-amber-300' : 'text-amber-700'}`}>
                      · {ovCount} override{ovCount > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject / Activity</span>
            </button>

            <button
              type="button"
              disabled={dirtyRows.length === 0 || busyKey !== null}
              onClick={() => persistRows(dirtyRows, `${dirtyRows.length} subject change(s)`)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {busyKey && busyKey.includes('change')
                  ? 'Saving...'
                  : dirtyRows.length > 0
                  ? `Save Changes (${dirtyRows.length})`
                  : 'Saved'}
              </span>
            </button>
          </div>
        </div>

        {/* Summary KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-slate-200 border-b border-slate-200 bg-white">
          <div className="px-5 py-3">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Total Weekly Lessons
            </div>
            <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-slate-900">
              {activeTotalLessons}
            </div>
          </div>
          <div className="px-5 py-3">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Available Weekly Slots
            </div>
            <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-slate-900">
              {currentAvailableSlots}
            </div>
          </div>
          <div className="px-5 py-3">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Remaining Slots
            </div>
            <div
              className={`mt-0.5 text-lg font-bold font-mono tabular-nums ${
                remainingSlots < 0
                  ? 'text-rose-700'
                  : remainingSlots === 0
                  ? 'text-emerald-700'
                  : 'text-slate-900'
              }`}
            >
              {remainingSlots >= 0 ? remainingSlots : `${remainingSlots} (Over)`}
            </div>
          </div>
          <div className="px-5 py-3">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Active / Disabled
            </div>
            <div className="mt-0.5 text-lg font-bold font-mono tabular-nums text-slate-900">
              {activeCount} <span className="text-xs font-normal text-slate-500">/ {disabledCount} disabled</span>
            </div>
          </div>
        </div>

        {/* Inline Status & Warnings */}
        {banner && (
          <div
            className={`px-5 py-2.5 border-b text-xs font-medium flex items-center justify-between gap-2 ${
              banner.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {banner.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{banner.text}</span>
            </div>
            <button type="button" onClick={() => setBanner(null)} className="text-slate-500 hover:text-slate-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {allocationWarnings.length > 0 && (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 space-y-1">
            {allocationWarnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Add Subject or Schedulable Activity Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubjectOrActivity}
            className="px-5 py-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
          >
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject or Schedulable Activity
              </label>
              <input
                list="edusmart-subject-activity-options"
                value={newSubjectName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewSubjectName(val);
                  const matched = allQuickPickOptions.find((o) => o.name.toLowerCase() === val.trim().toLowerCase());
                  if (matched) {
                    setNewRoomType(matched.roomType);
                    setNewWeeklyPeriods(matched.defaultWeekly);
                  }
                }}
                placeholder="e.g. Swimming, Maktaba, Clubs, Mathematics..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                required
              />
              <datalist id="edusmart-subject-activity-options">
                {allQuickPickOptions.map((opt) => (
                  <option key={opt.name} value={opt.name} />
                ))}
              </datalist>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lessons / Week</label>
              <input
                type="number"
                min={1}
                max={20}
                value={newWeeklyPeriods}
                onChange={(e) => setNewWeeklyPeriods(Math.max(1, Number(e.target.value || 1)))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono tabular-nums text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Double Blocks</label>
              <input
                type="number"
                min={0}
                max={Math.floor(newWeeklyPeriods / 2)}
                value={newDoubleLessons}
                onChange={(e) => setNewDoubleLessons(Math.max(0, Number(e.target.value || 0)))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono tabular-nums text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Type</label>
              <select
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
              >
                {Object.entries(ROOM_TYPE_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={busyKey !== null}
                className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Add & Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Central 3-Column Weekly Subject Allocation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Subject / Activity Name</th>
                <th className="py-3 px-4 w-56">Lessons Per Week</th>
                <th className="py-3 px-5 text-right w-72">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 px-5 text-center text-xs text-slate-500">
                    No subjects or activities configured for {currentCategoryObj.label} yet. Click “Add Subject / Activity” above to add curriculum lessons.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isEditing = editingRowKey === row.key;
                  const facilityLabel = ROOM_TYPE_LABELS[row.requiredRoomType] || 'Standard Classroom';
                  return (
                    <tr
                      key={row.key}
                      className={`transition-colors ${
                        !row.isActive
                          ? 'bg-slate-50/70 text-slate-400'
                          : row.dirty
                          ? 'bg-amber-50/35'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* COLUMN 1: Subject / Activity Name */}
                      <td className="py-3 px-5 align-middle">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${row.isActive ? 'text-slate-900' : 'line-through text-slate-400'}`}>
                              {row.subjectName}
                            </span>
                            {row.dirty && (
                              <span className="text-[11px] font-semibold text-amber-700">· Unsaved</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                            <span>{facilityLabel}</span>
                            {row.doubleLessons > 0 && (
                              <span className="font-mono tabular-nums">· {row.doubleLessons} double</span>
                            )}
                            {typeof activeScope === 'number' ? (
                              row.isCategoryOverride ? (
                                <span className="text-amber-700 font-medium">
                                  · Overridden for Grade {activeScope}
                                  {row.categoryDefaultPeriods !== undefined ? ` (Category default: ${row.categoryDefaultPeriods})` : ''}
                                </span>
                              ) : (
                                <span className="text-slate-500">· Inherited from {currentCategoryObj.label}</span>
                              )
                            ) : (
                              <span className="text-slate-500">· Default for {currentCategoryObj.label}</span>
                            )}
                            {!row.isActive && <span className="text-rose-600 font-medium">· Disabled</span>}
                          </div>

                          {isEditing && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-lg">
                              <div>
                                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                                  Facility Type
                                </label>
                                <select
                                  value={row.requiredRoomType}
                                  onChange={(e) => updateRowField(row.key, { requiredRoomType: e.target.value })}
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
                                >
                                  {Object.entries(ROOM_TYPE_LABELS).map(([k, lbl]) => (
                                    <option key={k} value={k}>
                                      {lbl}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                                  Double Lessons
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={Math.floor(row.requiredWeeklyPeriods / 2)}
                                  value={row.doubleLessons}
                                  onChange={(e) => {
                                    const dbl = Math.max(0, Math.min(Math.floor(row.requiredWeeklyPeriods / 2), Number(e.target.value || 0)));
                                    const sng = Math.max(0, row.requiredWeeklyPeriods - dbl * 2 - row.tripleLessons * 3);
                                    updateRowField(row.key, {
                                      doubleLessons: dbl,
                                      singleLessons: sng,
                                      maxPerDay: dbl > 0 ? Math.max(2, row.maxPerDay) : row.maxPerDay,
                                    });
                                  }}
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                                  Max Per Day
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={4}
                                  value={row.maxPerDay}
                                  onChange={(e) => updateRowField(row.key, { maxPerDay: Math.max(1, Number(e.target.value || 1)) })}
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums text-slate-800"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* COLUMN 2: Lessons Per Week */}
                      <td className="py-3 px-4 align-middle">
                        <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            disabled={!row.isActive || row.requiredWeeklyPeriods <= 0}
                            onClick={() => adjustRowLessons(row.key, row.requiredWeeklyPeriods - 1)}
                            aria-label={`Decrease weekly lessons for ${row.subjectName}`}
                            className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={20}
                            disabled={!row.isActive}
                            value={row.requiredWeeklyPeriods}
                            onChange={(e) => adjustRowLessons(row.key, Number(e.target.value || 0))}
                            aria-label={`Weekly lessons for ${row.subjectName}`}
                            className="w-12 py-1.5 text-center text-sm font-bold font-mono tabular-nums text-slate-900 border-x border-slate-200 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                          />
                          <button
                            type="button"
                            disabled={!row.isActive || row.requiredWeeklyPeriods >= 20}
                            onClick={() => adjustRowLessons(row.key, row.requiredWeeklyPeriods + 1)}
                            aria-label={`Increase weekly lessons for ${row.subjectName}`}
                            className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* COLUMN 3: Actions */}
                      <td className="py-3 px-5 align-middle text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={busyKey !== null || !row.dirty}
                            onClick={() => persistRows([row], row.subjectName)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingRowKey(isEditing ? null : row.key)}
                            className={`px-2.5 py-1.5 border rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                              isEditing
                                ? 'bg-slate-100 border-slate-400 text-slate-900'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isEditing ? 'Done' : 'Edit'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={busyKey !== null}
                            onClick={() => handleToggleDisableRow(row)}
                            className={`px-2.5 py-1.5 border rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                              row.isActive
                                ? 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-700'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {row.isActive ? <Power className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                            <span>{row.isActive ? 'Disable' : 'Restore'}</span>
                          </button>

                          {typeof activeScope === 'number' && row.isCategoryOverride && row.categoryDefaultPeriods !== undefined && (
                            <button
                              type="button"
                              disabled={busyKey !== null}
                              onClick={() => persistRows([row], row.subjectName, { resetToCategoryDefault: true })}
                              title={`Restore ${row.subjectName} on Grade ${activeScope} to ${currentCategoryObj.label} default (${row.categoryDefaultPeriods} lessons)`}
                              className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>Reset Default</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
