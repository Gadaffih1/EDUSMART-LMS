import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Edit3,
  Minus,
  Plus,
  Power,
  RotateCcw,
  Save,
  Search,
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
  allCategoryAllocations?: TTCategoryAllocationItem[];
  gradeSchedules: TTGradeSchedule[];
  gradeAllocations: TTGradeAllocationItem[];
  allGradeAllocations?: TTGradeAllocationItem[];
  subjects: TTSubjectItem[];
  activeDepartmentFilter?: string;
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

const MIN_LESSONS = 0;
const MAX_LESSONS = 20;

type ScopeKey = `cat:${TTCategoryCode}` | `grade:${number}`;

interface BaselineRow {
  draftKey: string;
  scopeKey: ScopeKey;
  scopeType: 'category' | 'grade';
  categoryCode: TTCategoryCode;
  grade?: number;
  subjectKey: string;
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
}

interface PendingDraft {
  draftKey: string;
  scopeKey: ScopeKey;
  scopeType: 'category' | 'grade';
  categoryCode: TTCategoryCode;
  grade?: number;
  subjectKey: string;
  subjectName: string;
  requiredWeeklyPeriods: number;
  singleLessons: number;
  doubleLessons: number;
  tripleLessons: number;
  requiredRoomType: string;
  maxPerDay: number;
  minSpacingDays: number;
  isActive: boolean;
}

interface EditableRow extends BaselineRow {
  dirty: boolean;
  baselineWeeklyPeriods: number;
  baselineIsActive: boolean;
}

function makeScopeKey(categoryCode: TTCategoryCode, scope: 'category' | number): ScopeKey {
  return scope === 'category' ? `cat:${categoryCode}` : `grade:${scope}`;
}

function makeDraftKey(scopeKey: ScopeKey, subjectName: string): string {
  return `${scopeKey}::${subjectName.trim().toLowerCase()}`;
}

function rebalanceLessonBlocks(
  weeklyRaw: number,
  currentDoubles: number,
  currentTriples: number
): { requiredWeeklyPeriods: number; singleLessons: number; doubleLessons: number; tripleLessons: number } {
  const nextWeekly = Math.max(MIN_LESSONS, Math.min(MAX_LESSONS, Math.floor(Number.isFinite(weeklyRaw) ? weeklyRaw : 0)));
  const safeDoubles = Math.min(Math.max(0, currentDoubles), Math.floor(nextWeekly / 2));
  const remAfterDoubles = nextWeekly - safeDoubles * 2;
  const safeTriples = Math.min(Math.max(0, currentTriples), Math.floor(remAfterDoubles / 3));
  const singles = Math.max(0, nextWeekly - safeDoubles * 2 - safeTriples * 3);
  return {
    requiredWeeklyPeriods: nextWeekly,
    singleLessons: singles,
    doubleLessons: safeDoubles,
    tripleLessons: safeTriples,
  };
}

function isSameAsBaseline(draft: PendingDraft, base: BaselineRow): boolean {
  return (
    draft.requiredWeeklyPeriods === base.requiredWeeklyPeriods &&
    draft.singleLessons === base.singleLessons &&
    draft.doubleLessons === base.doubleLessons &&
    draft.tripleLessons === base.tripleLessons &&
    draft.requiredRoomType === base.requiredRoomType &&
    draft.maxPerDay === base.maxPerDay &&
    draft.minSpacingDays === base.minSpacingDays &&
    draft.isActive === base.isActive
  );
}

export const CentralCategoryAllocationsTable: React.FC<CentralCategoryAllocationsTableProps> = ({
  categories,
  categoryAllocations = [],
  allCategoryAllocations,
  gradeSchedules,
  gradeAllocations,
  allGradeAllocations,
  subjects,
  activeDepartmentFilter = '',
  onRefresh,
}) => {
  const fullCategoryAllocations = allCategoryAllocations || categoryAllocations;
  const fullGradeAllocations = allGradeAllocations || gradeAllocations;

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
  const [activeScope, setActiveScope] = useState<'category' | number>('category');
  // Cross-tab & cross-scope tracked edits persisted in client state until saved to DB
  const [pendingDrafts, setPendingDrafts] = useState<Record<string, PendingDraft>>({});
  // Transient raw text buffer while typing inside a numeric Lessons Per Week input
  const [editingNumericInputs, setEditingNumericInputs] = useState<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [rowFilter, setRowFilter] = useState<'all' | 'active' | 'modified'>('all');
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

  // Reset grade sub-scope to category default when switching category tabs (tracked edits remain preserved!)
  useEffect(() => {
    setActiveScope('category');
    setEditingRowKey(null);
  }, [activeCategory]);

  // Warn before closing/reloading page if there are unsaved tracked changes
  const totalPendingList = useMemo(() => Object.values(pendingDrafts), [pendingDrafts]);
  const totalPendingCount = totalPendingList.length;

  useEffect(() => {
    if (totalPendingCount === 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [totalPendingCount]);

  // Compute available weekly periods per grade from tt_grade_schedules
  const availableSlotsForGrade = useCallback(
    (grade: number): number => {
      const gs = gradeSchedules.find((g) => g.grade === grade);
      if (!gs) return grade <= 3 ? 35 : 40;
      const daysCount = gs.workingDays?.length || 5;
      const assemblyDeduct = gs.assemblyPeriod > 0 ? 1 : 0;
      return Math.max(1, daysCount * gs.periodsPerDay - assemblyDeduct);
    },
    [gradeSchedules]
  );

  // Build baseline rows for any (categoryCode, scope) using either filtered or full allocations
  const buildBaselineRowsForScope = useCallback(
    (
      catCode: TTCategoryCode,
      scope: 'category' | number,
      catSource: TTCategoryAllocationItem[],
      gradeSource: TTGradeAllocationItem[]
    ): BaselineRow[] => {
      const scopeKey = makeScopeKey(catCode, scope);
      const catDefaults = catSource.filter((a) => a.categoryCode === catCode);
      const catDefaultMap = new Map<string, TTCategoryAllocationItem>();
      for (const d of catDefaults) {
        catDefaultMap.set(d.subjectName.trim().toLowerCase(), d);
      }

      if (scope === 'category') {
        return catDefaults
          .map((a) => {
            const subjectKey = a.subjectName.trim().toLowerCase();
            return {
              draftKey: makeDraftKey(scopeKey, a.subjectName),
              scopeKey,
              scopeType: 'category' as const,
              categoryCode: catCode,
              subjectKey,
              id: a.id,
              subjectName: a.subjectName,
              requiredWeeklyPeriods: Number(a.requiredWeeklyPeriods || 0),
              singleLessons: Number(a.singleLessons || 0),
              doubleLessons: Number(a.doubleLessons || 0),
              tripleLessons: Number(a.tripleLessons || 0),
              requiredRoomType: a.requiredRoomType || 'general',
              maxPerDay: a.maxPerDay || 1,
              minSpacingDays: a.minSpacingDays || 0,
              isActive: Boolean(a.isActive),
              isCategoryOverride: false,
            };
          })
          .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.subjectName.localeCompare(b.subjectName));
      }

      const gRows = gradeSource.filter((g) => g.grade === scope);
      const merged = new Map<string, BaselineRow>();

      for (const cd of catDefaults) {
        const subjectKey = cd.subjectName.trim().toLowerCase();
        merged.set(subjectKey, {
          draftKey: makeDraftKey(scopeKey, cd.subjectName),
          scopeKey,
          scopeType: 'grade',
          categoryCode: catCode,
          grade: scope,
          subjectKey,
          subjectName: cd.subjectName,
          requiredWeeklyPeriods: Number(cd.requiredWeeklyPeriods || 0),
          singleLessons: Number(cd.singleLessons || 0),
          doubleLessons: Number(cd.doubleLessons || 0),
          tripleLessons: Number(cd.tripleLessons || 0),
          requiredRoomType: cd.requiredRoomType || 'general',
          maxPerDay: cd.maxPerDay || 1,
          minSpacingDays: cd.minSpacingDays || 0,
          isActive: Boolean(cd.isActive),
          isCategoryOverride: false,
          categoryDefaultPeriods: Number(cd.requiredWeeklyPeriods || 0),
        });
      }

      for (const gr of gRows) {
        const subjectKey = gr.subjectName.trim().toLowerCase();
        const cd = catDefaultMap.get(subjectKey);
        const differsFromCat =
          Boolean(gr.isCategoryOverride) ||
          !cd ||
          gr.requiredWeeklyPeriods !== cd.requiredWeeklyPeriods ||
          gr.isActive !== cd.isActive;
        merged.set(subjectKey, {
          draftKey: makeDraftKey(scopeKey, gr.subjectName),
          scopeKey,
          scopeType: 'grade',
          categoryCode: catCode,
          grade: scope,
          subjectKey,
          id: gr.id,
          subjectName: gr.subjectName,
          requiredWeeklyPeriods: Number(gr.requiredWeeklyPeriods || 0),
          singleLessons: Number(gr.singleLessons || 0),
          doubleLessons: Number(gr.doubleLessons || 0),
          tripleLessons: Number(gr.tripleLessons || 0),
          requiredRoomType: gr.requiredRoomType || 'general',
          maxPerDay: gr.maxPerDay || 1,
          minSpacingDays: gr.minSpacingDays || 0,
          isActive: Boolean(gr.isActive),
          isCategoryOverride: differsFromCat,
          categoryDefaultPeriods: cd !== undefined ? Number(cd.requiredWeeklyPeriods || 0) : undefined,
        });
      }

      return Array.from(merged.values()).sort(
        (a, b) => Number(b.isActive) - Number(a.isActive) || a.subjectName.localeCompare(b.subjectName)
      );
    },
    []
  );

  // Merge baseline rows with tracked pendingDrafts for the active view
  const activeScopeKey = makeScopeKey(activeCategory, activeScope);

  const baselineRows = useMemo(
    () => buildBaselineRowsForScope(activeCategory, activeScope, categoryAllocations, gradeAllocations),
    [buildBaselineRowsForScope, activeCategory, activeScope, categoryAllocations, gradeAllocations]
  );

  const baselineByDraftKey = useMemo(() => {
    const map = new Map<string, BaselineRow>();
    for (const r of baselineRows) map.set(r.draftKey, r);
    return map;
  }, [baselineRows]);

  const rows: EditableRow[] = useMemo(() => {
    return baselineRows.map((base) => {
      const draft = pendingDrafts[base.draftKey];
      if (!draft) {
        return {
          ...base,
          dirty: false,
          baselineWeeklyPeriods: base.requiredWeeklyPeriods,
          baselineIsActive: base.isActive,
        };
      }
      return {
        ...base,
        requiredWeeklyPeriods: draft.requiredWeeklyPeriods,
        singleLessons: draft.singleLessons,
        doubleLessons: draft.doubleLessons,
        tripleLessons: draft.tripleLessons,
        requiredRoomType: draft.requiredRoomType,
        maxPerDay: draft.maxPerDay,
        minSpacingDays: draft.minSpacingDays,
        isActive: draft.isActive,
        isCategoryOverride:
          base.scopeType === 'grade'
            ? base.isCategoryOverride ||
              (base.categoryDefaultPeriods !== undefined &&
                draft.requiredWeeklyPeriods !== base.categoryDefaultPeriods)
            : false,
        dirty: true,
        baselineWeeklyPeriods: base.requiredWeeklyPeriods,
        baselineIsActive: base.isActive,
      };
    });
  }, [baselineRows, pendingDrafts]);

  // Full (unfiltered) scope rows so remaining available periods are always true to the entire school week
  const fullScopeRowsForCapacity = useMemo(() => {
    const fullBase = buildBaselineRowsForScope(
      activeCategory,
      activeScope,
      fullCategoryAllocations,
      fullGradeAllocations
    );
    return fullBase.map((base) => {
      const draft = pendingDrafts[base.draftKey];
      return draft
        ? {
            ...base,
            requiredWeeklyPeriods: draft.requiredWeeklyPeriods,
            isActive: draft.isActive,
          }
        : base;
    });
  }, [
    buildBaselineRowsForScope,
    activeCategory,
    activeScope,
    fullCategoryAllocations,
    fullGradeAllocations,
    pendingDrafts,
  ]);

  // Live summary per category tab (reflects tracked pending edits immediately!)
  const categoryStats = useMemo(() => {
    const map = new Map<
      TTCategoryCode,
      { total: number; available: number; remaining: number; activeCount: number; pendingCount: number }
    >();
    for (const cat of categoryList) {
      const catBase = buildBaselineRowsForScope(cat.code, 'category', fullCategoryAllocations, fullGradeAllocations);
      let total = 0;
      let activeCount = 0;
      for (const r of catBase) {
        const draft = pendingDrafts[r.draftKey];
        const isActive = draft ? draft.isActive : r.isActive;
        const periods = draft ? draft.requiredWeeklyPeriods : r.requiredWeeklyPeriods;
        if (isActive) {
          total += periods;
          activeCount += 1;
        }
      }
      const refGrade = cat.grades.find((g) => gradeSchedules.some((gs) => gs.grade === g)) || cat.grades[0];
      const available = availableSlotsForGrade(refGrade);
      const pendingCount = totalPendingList.filter((d) => d.categoryCode === cat.code).length;
      map.set(cat.code, {
        total,
        available,
        remaining: available - total,
        activeCount,
        pendingCount,
      });
    }
    return map;
  }, [
    categoryList,
    buildBaselineRowsForScope,
    fullCategoryAllocations,
    fullGradeAllocations,
    pendingDrafts,
    gradeSchedules,
    availableSlotsForGrade,
    totalPendingList,
  ]);

  const currentAvailableSlots = useMemo(() => {
    if (typeof activeScope === 'number') return availableSlotsForGrade(activeScope);
    const refGrade =
      currentCategoryObj.grades.find((g) => gradeSchedules.some((gs) => gs.grade === g)) ||
      currentCategoryObj.grades[0];
    return availableSlotsForGrade(refGrade);
  }, [activeScope, currentCategoryObj, gradeSchedules, availableSlotsForGrade]);

  const displayedTotalLessons = useMemo(
    () => rows.filter((r) => r.isActive).reduce((sum, r) => sum + Number(r.requiredWeeklyPeriods || 0), 0),
    [rows]
  );

  const activeTotalLessons = useMemo(
    () =>
      fullScopeRowsForCapacity
        .filter((r) => r.isActive)
        .reduce((sum, r) => sum + Number(r.requiredWeeklyPeriods || 0), 0),
    [fullScopeRowsForCapacity]
  );

  const remainingSlots = currentAvailableSlots - activeTotalLessons;
  const utilizationPct =
    currentAvailableSlots > 0 ? Math.min(100, Math.round((activeTotalLessons / currentAvailableSlots) * 100)) : 0;

  const activeCount = rows.filter((r) => r.isActive).length;
  const disabledCount = rows.length - activeCount;
  const currentScopeDirtyRows = useMemo(() => rows.filter((r) => r.dirty), [rows]);

  // Visible rows after search & status filter
  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      if (rowFilter === 'active' && !r.isActive) return false;
      if (rowFilter === 'modified' && !r.dirty) return false;
      if (!q) return true;
      const facility = (ROOM_TYPE_LABELS[r.requiredRoomType] || '').toLowerCase();
      return r.subjectName.toLowerCase().includes(q) || facility.includes(q);
    });
  }, [rows, searchQuery, rowFilter]);

  const allocationWarnings = useMemo(() => {
    const warns: string[] = [];
    if (remainingSlots < 0) {
      warns.push(
        `Over-allocated by ${Math.abs(remainingSlots)} period(s): total weekly lessons (${activeTotalLessons}) exceed available weekly periods (${currentAvailableSlots}). Reduce lessons or increase daily periods before generating.`
      );
    } else if (remainingSlots > 5) {
      warns.push(
        `${remainingSlots} available weekly periods are currently unallocated (${activeTotalLessons} of ${currentAvailableSlots} periods assigned).`
      );
    }
    const zeroActive = rows.filter((r) => r.isActive && r.requiredWeeklyPeriods <= 0);
    if (zeroActive.length > 0) {
      warns.push(
        `${zeroActive.map((z) => z.subjectName).join(', ')} set to 0 weekly lessons. Increase to at least 1 lesson or disable it.`
      );
    }
    return warns;
  }, [remainingSlots, activeTotalLessons, currentAvailableSlots, rows]);

  // Core tracked change updater: compares against saved DB baseline and cleans up if reverted
  const applyDraftMutation = useCallback(
    (draftKey: string, mutate: (current: PendingDraft, base: BaselineRow) => PendingDraft) => {
      const base = baselineByDraftKey.get(draftKey);
      if (!base) return;
      setPendingDrafts((prev) => {
        const existing: PendingDraft = prev[draftKey] || {
          draftKey: base.draftKey,
          scopeKey: base.scopeKey,
          scopeType: base.scopeType,
          categoryCode: base.categoryCode,
          grade: base.grade,
          subjectKey: base.subjectKey,
          subjectName: base.subjectName,
          requiredWeeklyPeriods: base.requiredWeeklyPeriods,
          singleLessons: base.singleLessons,
          doubleLessons: base.doubleLessons,
          tripleLessons: base.tripleLessons,
          requiredRoomType: base.requiredRoomType,
          maxPerDay: base.maxPerDay,
          minSpacingDays: base.minSpacingDays,
          isActive: base.isActive,
        };
        const updated = mutate(existing, base);
        if (isSameAsBaseline(updated, base)) {
          if (!(draftKey in prev)) return prev;
          const next = { ...prev };
          delete next[draftKey];
          return next;
        }
        return { ...prev, [draftKey]: updated };
      });
    },
    [baselineByDraftKey]
  );

  const adjustRowLessons = useCallback(
    (draftKey: string, nextWeeklyRaw: number) => {
      applyDraftMutation(draftKey, (cur) => {
        const balanced = rebalanceLessonBlocks(nextWeeklyRaw, cur.doubleLessons, cur.tripleLessons);
        return {
          ...cur,
          ...balanced,
        };
      });
      setEditingNumericInputs((prev) => {
        if (!(draftKey in prev)) return prev;
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
    },
    [applyDraftMutation]
  );

  const updateRowField = useCallback(
    (draftKey: string, patch: Partial<PendingDraft>) => {
      applyDraftMutation(draftKey, (cur) => ({ ...cur, ...patch }));
    },
    [applyDraftMutation]
  );

  const revertSingleRow = useCallback((draftKey: string) => {
    setPendingDrafts((prev) => {
      if (!(draftKey in prev)) return prev;
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
    setEditingNumericInputs((prev) => {
      if (!(draftKey in prev)) return prev;
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  }, []);

  const discardScopeDrafts = useCallback((scopeKey: ScopeKey) => {
    setPendingDrafts((prev) => {
      const next: Record<string, PendingDraft> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v.scopeKey !== scopeKey) next[k] = v;
      }
      return next;
    });
    setEditingNumericInputs({});
  }, []);

  const discardAllDrafts = useCallback(() => {
    setPendingDrafts({});
    setEditingNumericInputs({});
    setBanner(null);
  }, []);

  // Persist a specific set of rows in the active scope to PUT /api/timetable/allocations
  const persistActiveScopeRows = async (
    targetRows: EditableRow[],
    label: string,
    extraFlag?: { resetToCategoryDefault?: boolean }
  ) => {
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

      // Clear only the saved rows from pendingDrafts so edits in other tabs/rows remain safe
      const savedKeys = new Set(targetRows.map((r) => r.draftKey));
      setPendingDrafts((prev) => {
        const next: Record<string, PendingDraft> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (!savedKeys.has(k)) next[k] = v;
        }
        return next;
      });
      await onRefresh();
      setEditingRowKey(null);
      setBanner({
        type: 'ok',
        text:
          activeScope === 'category'
            ? `Saved ${label} for ${currentCategoryObj.label} (${currentCategoryObj.name}) to database and synced non-overridden grades in this category.`
            : extraFlag?.resetToCategoryDefault
            ? `Restored ${label} on Grade ${activeScope} to ${currentCategoryObj.label} category default.`
            : `Saved Grade ${activeScope} override for ${label} to database (other grades in ${currentCategoryObj.label} unchanged).`,
      });
    } catch (err: any) {
      setBanner({ type: 'err', text: err?.message || 'Failed to save subject allocations.' });
    } finally {
      setBusyKey(null);
    }
  };

  // Persist ALL tracked changes across ALL category tabs and grade scopes in one action
  const persistAllTrackedDrafts = async () => {
    if (totalPendingList.length === 0) return;
    setBusyKey('save-all-tracked');
    setBanner(null);

    // Group drafts by scopeKey
    const grouped = new Map<ScopeKey, PendingDraft[]>();
    for (const draft of totalPendingList) {
      const list = grouped.get(draft.scopeKey) || [];
      list.push(draft);
      grouped.set(draft.scopeKey, list);
    }

    const savedKeys = new Set<string>();
    const savedScopeLabels: string[] = [];

    try {
      // Persist category-level changes first, then grade-level overrides so propagation order is deterministic
      const orderedEntries = Array.from(grouped.entries()).sort((a, b) => {
        const aIsCat = a[0].startsWith('cat:') ? 0 : 1;
        const bIsCat = b[0].startsWith('cat:') ? 0 : 1;
        return aIsCat - bIsCat || a[0].localeCompare(b[0]);
      });

      for (const [, drafts] of orderedEntries) {
        const first = drafts[0];
        const payload =
          first.scopeType === 'category'
            ? {
                scope: 'category',
                categoryCode: first.categoryCode,
                propagateToGrades: true,
                allocations: drafts.map((d) => ({
                  subjectName: d.subjectName,
                  requiredWeeklyPeriods: d.requiredWeeklyPeriods,
                  singleLessons: d.singleLessons,
                  doubleLessons: d.doubleLessons,
                  tripleLessons: d.tripleLessons,
                  requiredRoomType: d.requiredRoomType,
                  maxPerDay: d.maxPerDay,
                  minSpacingDays: d.minSpacingDays,
                  isActive: d.isActive,
                })),
              }
            : {
                scope: 'grade',
                grade: first.grade,
                allocations: drafts.map((d) => ({
                  subjectName: d.subjectName,
                  requiredWeeklyPeriods: d.requiredWeeklyPeriods,
                  singleLessons: d.singleLessons,
                  doubleLessons: d.doubleLessons,
                  tripleLessons: d.tripleLessons,
                  requiredRoomType: d.requiredRoomType,
                  maxPerDay: d.maxPerDay,
                  minSpacingDays: d.minSpacingDays,
                  isActive: d.isActive,
                })),
              };

        await ttApiFetch('/api/timetable/allocations', {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        for (const d of drafts) savedKeys.add(d.draftKey);
        if (first.scopeType === 'category') {
          const catObj = categoryList.find((c) => c.code === first.categoryCode);
          savedScopeLabels.push(`${catObj?.label || first.categoryCode} (${drafts.length})`);
        } else {
          savedScopeLabels.push(`Grade ${first.grade} (${drafts.length})`);
        }
      }

      setPendingDrafts((prev) => {
        const next: Record<string, PendingDraft> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (!savedKeys.has(k)) next[k] = v;
        }
        return next;
      });
      await onRefresh();
      setEditingRowKey(null);
      setBanner({
        type: 'ok',
        text: `Persisted ${savedKeys.size} tracked allocation change(s) to database: ${savedScopeLabels.join(', ')}.`,
      });
    } catch (err: any) {
      // Remove any scopes that succeeded before the error so user only retries the remaining failed ones
      if (savedKeys.size > 0) {
        setPendingDrafts((prev) => {
          const next: Record<string, PendingDraft> = {};
          for (const [k, v] of Object.entries(prev)) {
            if (!savedKeys.has(k)) next[k] = v;
          }
          return next;
        });
        await onRefresh();
      }
      setBanner({ type: 'err', text: err?.message || 'Failed to save one or more allocation changes.' });
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleDisableRow = async (row: EditableRow) => {
    const updated: EditableRow = { ...row, isActive: !row.isActive };
    await persistActiveScopeRows([updated], `${row.subjectName} (${updated.isActive ? 'Restored' : 'Disabled'})`);
  };

  const handleAddSubjectOrActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSubjectName.trim();
    if (!clean) return;
    const weekly = Math.max(1, Math.min(MAX_LESSONS, Math.floor(newWeeklyPeriods)));
    const doubles = Math.min(Math.max(0, Math.floor(newDoubleLessons)), Math.floor(weekly / 2));
    const singles = weekly - doubles * 2;
    const scopeKey = makeScopeKey(activeCategory, activeScope);

    const newRow: EditableRow = {
      draftKey: makeDraftKey(scopeKey, clean),
      scopeKey,
      scopeType: activeScope === 'category' ? 'category' : 'grade',
      categoryCode: activeCategory,
      grade: typeof activeScope === 'number' ? activeScope : undefined,
      subjectKey: clean.toLowerCase(),
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
      dirty: false,
      baselineWeeklyPeriods: weekly,
      baselineIsActive: true,
    };

    await persistActiveScopeRows([newRow], clean);
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
      const count = fullGradeAllocations.filter((ga) => ga.grade === g && ga.isCategoryOverride).length;
      map.set(g, count);
    }
    return map;
  }, [currentCategoryObj, fullGradeAllocations]);

  const gradePendingCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const g of currentCategoryObj.grades) {
      const scopeKey = makeScopeKey(activeCategory, g);
      map.set(
        g,
        totalPendingList.filter((d) => d.scopeKey === scopeKey).length
      );
    }
    return map;
  }, [currentCategoryObj, activeCategory, totalPendingList]);

  const categoryDefaultPendingCount = useMemo(() => {
    const key = makeScopeKey(activeCategory, 'category');
    return totalPendingList.filter((d) => d.scopeKey === key).length;
  }, [activeCategory, totalPendingList]);

  // Group pending summary by category for the persistent change-tracker bar
  const pendingSummaryByCategory = useMemo(() => {
    const items: Array<{ code: TTCategoryCode; label: string; count: number }> = [];
    for (const cat of categoryList) {
      const count = totalPendingList.filter((d) => d.categoryCode === cat.code).length;
      if (count > 0) items.push({ code: cat.code, label: cat.label, count });
    }
    return items;
  }, [categoryList, totalPendingList]);

  const activeScopeTitle =
    activeScope === 'category'
      ? `${currentCategoryObj.label} (${currentCategoryObj.name})`
      : `Grade ${activeScope} (${currentCategoryObj.label} Override)`;

  return (
    <div className="space-y-4">
      {/* Three Independent Central Subject Allocation Category Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div
          role="tablist"
          aria-label="Subject allocation categories"
          className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-200 divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
        >
          {categoryList.map((cat) => {
            const isSelected = activeCategory === cat.code;
            const st = categoryStats.get(cat.code);
            const over = st ? st.remaining < 0 : false;
            const exact = st ? st.remaining === 0 : false;
            return (
              <button
                key={cat.code}
                type="button"
                role="tab"
                aria-selected={isSelected}
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
                          : exact
                          ? 'text-emerald-300'
                          : 'text-slate-200'
                        : over
                        ? 'text-rose-700'
                        : exact
                        ? 'text-emerald-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {st ? `${st.total} / ${st.available} periods` : '—'}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                  <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                    {cat.name}
                    {st && (
                      <span className="font-mono tabular-nums">
                        {' '}
                        ·{' '}
                        {st.remaining > 0
                          ? `${st.remaining} left`
                          : st.remaining === 0
                          ? 'Full'
                          : `${Math.abs(st.remaining)} over`}
                      </span>
                    )}
                  </span>
                  {st && st.pendingCount > 0 && (
                    <span
                      className={`font-mono tabular-nums font-semibold ${
                        isSelected ? 'text-amber-300' : 'text-amber-700'
                      }`}
                    >
                      {st.pendingCount} unsaved
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Grade-Specific Adjustment Scope Bar & Primary Actions */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 mr-1">Allocation Scope:</span>
            <button
              type="button"
              onClick={() => setActiveScope('category')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeScope === 'category'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Category Default ({currentCategoryObj.label})
              {categoryDefaultPendingCount > 0 && (
                <span
                  className={`ml-1.5 font-mono tabular-nums text-[11px] ${
                    activeScope === 'category' ? 'text-amber-300' : 'text-amber-700'
                  }`}
                >
                  · {categoryDefaultPendingCount} unsaved
                </span>
              )}
            </button>
            {currentCategoryObj.grades.map((g) => {
              const ovCount = gradeOverrideCounts.get(g) || 0;
              const pendCount = gradePendingCounts.get(g) || 0;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveScope(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeScope === g
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Grade {g}
                  {ovCount > 0 && (
                    <span
                      className={`ml-1.5 font-mono tabular-nums text-[11px] ${
                        activeScope === g ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      · {ovCount} override{ovCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {pendCount > 0 && (
                    <span
                      className={`ml-1.5 font-mono tabular-nums text-[11px] ${
                        activeScope === g ? 'text-amber-300' : 'text-amber-700'
                      }`}
                    >
                      · {pendCount} unsaved
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
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject / Activity</span>
            </button>

            <button
              type="button"
              disabled={totalPendingCount === 0 || busyKey !== null}
              onClick={() =>
                totalPendingCount > currentScopeDirtyRows.length
                  ? persistAllTrackedDrafts()
                  : persistActiveScopeRows(
                      currentScopeDirtyRows,
                      `${currentScopeDirtyRows.length} subject change(s)`
                    )
              }
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {busyKey === 'save-all-tracked' || (busyKey && busyKey.includes('change'))
                  ? 'Saving to Database...'
                  : totalPendingCount > 0
                  ? `Save Changes (${totalPendingCount})`
                  : 'All Saved'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Calculation KPI Strip & Capacity Utilization Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-slate-200 border-b border-slate-200 bg-white">
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Total Weekly Lessons
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {activeTotalLessons}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                / {currentAvailableSlots} periods
              </span>
            </div>
            {activeDepartmentFilter && displayedTotalLessons !== activeTotalLessons && (
              <div className="mt-0.5 text-[11px] text-slate-500 font-mono tabular-nums">
                {activeDepartmentFilter}: {displayedTotalLessons} lessons
              </div>
            )}
          </div>

          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Available Weekly Periods
            </div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900">
              {currentAvailableSlots}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Net teaching slots (excl. assembly)
            </div>
          </div>

          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Remaining Available Periods
            </div>
            <div
              className={`mt-1 flex items-baseline gap-2 text-xl font-bold font-mono tabular-nums ${
                remainingSlots < 0
                  ? 'text-rose-700'
                  : remainingSlots === 0
                  ? 'text-emerald-700'
                  : 'text-slate-900'
              }`}
            >
              <span>{remainingSlots > 0 ? remainingSlots : remainingSlots === 0 ? '0' : remainingSlots}</span>
              <span className="text-xs font-sans font-semibold">
                {remainingSlots < 0
                  ? 'Over capacity'
                  : remainingSlots === 0
                  ? 'Exact fit'
                  : 'Available'}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  remainingSlots < 0
                    ? 'bg-rose-600'
                    : remainingSlots === 0
                    ? 'bg-emerald-600'
                    : 'bg-slate-800'
                }`}
                style={{ width: `${utilizationPct}%` }}
              />
            </div>
          </div>

          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Persistence Status
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`text-xl font-bold font-mono tabular-nums ${
                  totalPendingCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {totalPendingCount}
              </span>
              <span className="text-xs font-medium text-slate-600">
                {totalPendingCount === 0
                  ? 'Synced with database'
                  : totalPendingCount === 1
                  ? 'Unsaved change tracked'
                  : 'Unsaved changes tracked'}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 font-mono tabular-nums">
              {activeCount} active · {disabledCount} disabled
            </div>
          </div>
        </div>

        {/* Persistent Cross-Tab Change Tracker Bar */}
        {totalPendingCount > 0 && (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-amber-950">
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-semibold">
                {totalPendingCount} unsaved change{totalPendingCount > 1 ? 's' : ''} ready for database persistence
              </span>
              <span className="text-amber-800 font-mono tabular-nums">
                ({pendingSummaryByCategory.map((p) => `${p.label}: ${p.count}`).join(' · ')})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {currentScopeDirtyRows.length > 0 && currentScopeDirtyRows.length < totalPendingCount && (
                <button
                  type="button"
                  disabled={busyKey !== null}
                  onClick={() => discardScopeDrafts(activeScopeKey)}
                  className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-md font-semibold cursor-pointer whitespace-nowrap"
                >
                  Revert This View ({currentScopeDirtyRows.length})
                </button>
              )}
              <button
                type="button"
                disabled={busyKey !== null}
                onClick={discardAllDrafts}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Undo2 className="w-3 h-3" />
                <span>Discard All</span>
              </button>
              <button
                type="button"
                disabled={busyKey !== null}
                onClick={persistAllTrackedDrafts}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-md font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {busyKey === 'save-all-tracked'
                    ? 'Saving...'
                    : `Save All to Database (${totalPendingCount})`}
                </span>
              </button>
            </div>
          </div>
        )}

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
            <button
              type="button"
              onClick={() => setBanner(null)}
              aria-label="Dismiss status message"
              className="text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {allocationWarnings.length > 0 && (
          <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-200 text-xs text-amber-900 space-y-1">
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
                  const matched = allQuickPickOptions.find(
                    (o) => o.name.toLowerCase() === val.trim().toLowerCase()
                  );
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
                max={MAX_LESSONS}
                value={newWeeklyPeriods}
                onChange={(e) => setNewWeeklyPeriods(Math.max(1, Math.min(MAX_LESSONS, Number(e.target.value || 1))))}
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
                className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                Add &amp; Save
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

        {/* Table Filter & Quick Search Strip */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search subjects in ${currentCategoryObj.label}...`}
              aria-label={`Search subjects in ${currentCategoryObj.label}`}
              className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear subject search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setRowFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                rowFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setRowFilter('active')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                rowFilter === 'active' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setRowFilter('modified')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                rowFilter === 'modified'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modified ({currentScopeDirtyRows.length})
            </button>
          </div>
        </div>

        {/* Central 3-Column Interactive Weekly Subject Allocation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Subject / Activity Name</th>
                <th className="py-3 px-4 w-64">Lessons Per Week</th>
                <th className="py-3 px-5 text-right w-72">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 px-5 text-center text-xs text-slate-500">
                    {rows.length === 0
                      ? `No subjects or activities configured for ${currentCategoryObj.label} yet. Click “Add Subject / Activity” above to add curriculum lessons.`
                      : 'No subjects match the current search or filter.'}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => {
                  const isEditing = editingRowKey === row.draftKey;
                  const facilityLabel = ROOM_TYPE_LABELS[row.requiredRoomType] || 'Standard Classroom';
                  const delta = row.requiredWeeklyPeriods - row.baselineWeeklyPeriods;
                  const inputDisplayValue =
                    row.draftKey in editingNumericInputs
                      ? editingNumericInputs[row.draftKey]
                      : String(row.requiredWeeklyPeriods);

                  return (
                    <tr
                      key={row.draftKey}
                      className={`transition-colors ${
                        !row.isActive
                          ? 'bg-slate-50/70 text-slate-400'
                          : row.dirty
                          ? 'bg-amber-50/40'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* COLUMN 1: Subject / Activity Name */}
                      <td className="py-3 px-5 align-middle">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold text-sm ${
                                row.isActive ? 'text-slate-900' : 'line-through text-slate-400'
                              }`}
                            >
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
                                  {row.categoryDefaultPeriods !== undefined
                                    ? ` (Category default: ${row.categoryDefaultPeriods})`
                                    : ''}
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
                                  onChange={(e) =>
                                    updateRowField(row.draftKey, { requiredRoomType: e.target.value })
                                  }
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
                                    const dbl = Math.max(
                                      0,
                                      Math.min(
                                        Math.floor(row.requiredWeeklyPeriods / 2),
                                        Number(e.target.value || 0)
                                      )
                                    );
                                    const sng = Math.max(
                                      0,
                                      row.requiredWeeklyPeriods - dbl * 2 - row.tripleLessons * 3
                                    );
                                    updateRowField(row.draftKey, {
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
                                  onChange={(e) =>
                                    updateRowField(row.draftKey, {
                                      maxPerDay: Math.max(1, Math.min(4, Number(e.target.value || 1))),
                                    })
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums text-slate-800"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* COLUMN 2: Interactive Lessons Per Week Numeric Stepper */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`inline-flex items-center border rounded-lg bg-white overflow-hidden transition-colors ${
                              row.dirty
                                ? 'border-amber-400 ring-1 ring-amber-200'
                                : 'border-slate-300 focus-within:border-slate-600'
                            }`}
                          >
                            <button
                              type="button"
                              disabled={!row.isActive || row.requiredWeeklyPeriods <= MIN_LESSONS}
                              onClick={() => adjustRowLessons(row.draftKey, row.requiredWeeklyPeriods - 1)}
                              aria-label={`Decrease weekly lessons for ${row.subjectName}`}
                              className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              disabled={!row.isActive}
                              value={inputDisplayValue}
                              onFocus={(e) => {
                                setEditingNumericInputs((prev) => ({
                                  ...prev,
                                  [row.draftKey]: String(row.requiredWeeklyPeriods),
                                }));
                                e.currentTarget.select();
                              }}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                setEditingNumericInputs((prev) => ({ ...prev, [row.draftKey]: raw }));
                                if (raw !== '') {
                                  const parsed = Math.max(MIN_LESSONS, Math.min(MAX_LESSONS, Number(raw)));
                                  applyDraftMutation(row.draftKey, (cur) => ({
                                    ...cur,
                                    ...rebalanceLessonBlocks(parsed, cur.doubleLessons, cur.tripleLessons),
                                  }));
                                }
                              }}
                              onBlur={() => {
                                const raw = editingNumericInputs[row.draftKey];
                                if (raw !== undefined) {
                                  const parsed = raw === '' ? row.baselineWeeklyPeriods : Number(raw);
                                  adjustRowLessons(row.draftKey, parsed);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  adjustRowLessons(row.draftKey, row.requiredWeeklyPeriods + 1);
                                } else if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  adjustRowLessons(row.draftKey, row.requiredWeeklyPeriods - 1);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setEditingNumericInputs((prev) => {
                                    const next = { ...prev };
                                    delete next[row.draftKey];
                                    return next;
                                  });
                                  e.currentTarget.blur();
                                }
                              }}
                              aria-label={`Weekly lessons for ${row.subjectName}`}
                              className="w-12 py-1.5 text-center text-sm font-bold font-mono tabular-nums text-slate-900 border-x border-slate-200 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                            <button
                              type="button"
                              disabled={!row.isActive || row.requiredWeeklyPeriods >= MAX_LESSONS}
                              onClick={() => adjustRowLessons(row.draftKey, row.requiredWeeklyPeriods + 1)}
                              aria-label={`Increase weekly lessons for ${row.subjectName}`}
                              className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {row.dirty && (
                            <div className="flex items-center gap-1.5">
                              {delta !== 0 && (
                                <span
                                  className={`text-[11px] font-mono tabular-nums font-semibold ${
                                    delta > 0 ? 'text-emerald-700' : 'text-amber-700'
                                  }`}
                                  title={`Saved value in database: ${row.baselineWeeklyPeriods}`}
                                >
                                  {delta > 0 ? `+${delta}` : delta} (was {row.baselineWeeklyPeriods})
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => revertSingleRow(row.draftKey)}
                                title={`Revert ${row.subjectName} back to saved database value`}
                                aria-label={`Revert unsaved changes for ${row.subjectName}`}
                                className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* COLUMN 3: Actions */}
                      <td className="py-3 px-5 align-middle text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={busyKey !== null || !row.dirty}
                            onClick={() => persistActiveScopeRows([row], row.subjectName)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingRowKey(isEditing ? null : row.draftKey)}
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

                          {typeof activeScope === 'number' &&
                            row.isCategoryOverride &&
                            row.categoryDefaultPeriods !== undefined && (
                              <button
                                type="button"
                                disabled={busyKey !== null}
                                onClick={() =>
                                  persistActiveScopeRows([row], row.subjectName, {
                                    resetToCategoryDefault: true,
                                  })
                                }
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

            {/* Live Automatic Weekly Total & Remaining Available Periods Footer */}
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 text-xs">
                <td className="py-3.5 px-5 align-middle">
                  <div className="font-bold text-slate-900">
                    Weekly Allocation Summary — {activeScopeTitle}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {utilizationPct}% of {currentAvailableSlots} available weekly periods allocated
                    {activeDepartmentFilter && displayedTotalLessons !== activeTotalLessons
                      ? ` (${displayedTotalLessons} in ${activeDepartmentFilter})`
                      : ''}
                  </div>
                </td>
                <td className="py-3.5 px-4 align-middle">
                  <div className="flex flex-col">
                    <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                      {activeTotalLessons} / {currentAvailableSlots} lessons
                    </div>
                    <div
                      className={`text-xs font-mono tabular-nums font-semibold mt-0.5 ${
                        remainingSlots < 0
                          ? 'text-rose-700'
                          : remainingSlots === 0
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {remainingSlots > 0
                        ? `${remainingSlots} remaining period${remainingSlots === 1 ? '' : 's'}`
                        : remainingSlots === 0
                        ? '0 remaining (exact fit)'
                        : `${Math.abs(remainingSlots)} period${Math.abs(remainingSlots) === 1 ? '' : 's'} over limit`}
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-5 align-middle text-right">
                  {currentScopeDirtyRows.length > 0 ? (
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyKey !== null}
                        onClick={() => discardScopeDrafts(activeScopeKey)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Revert ({currentScopeDirtyRows.length})
                      </button>
                      <button
                        type="button"
                        disabled={busyKey !== null}
                        onClick={() =>
                          persistActiveScopeRows(
                            currentScopeDirtyRows,
                            `${currentScopeDirtyRows.length} subject change(s)`
                          )
                        }
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Tab Changes</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-emerald-700 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>All changes saved to database</span>
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
