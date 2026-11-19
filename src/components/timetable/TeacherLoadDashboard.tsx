import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { User } from '../../types';
import { Storage } from '../../utils/storage';
import { TTWorkspacePayload, ttApiFetch } from './timetableTypes';

interface TeacherLoadDashboardProps {
  currentUser: User;
  workspace?: TTWorkspacePayload | null;
  onOpenTimetableEditor?: () => void;
  onRefreshWorkspace?: () => Promise<void>;
}

type LoadStatus = 'overloaded' | 'balanced' | 'available';
type SortMode = 'highest_load' | 'most_free' | 'name_asc';

interface TeacherDailyStat {
  day: string;
  shortDay: string;
  allocated: number;
  free: number;
  lockedCount: number;
  freePeriodsList: number[];
  allocatedPeriodsList: number[];
}

interface TeacherWorkloadRow {
  id: string;
  name: string;
  shortName: string;
  department: string;
  tscNumber: string;
  allocated: number;
  free: number;
  weeklyCapacity: number;
  maxWeeklyCap: number;
  maxDailyCap: number;
  utilizationPct: number;
  lockedCount: number;
  status: LoadStatus;
  subjects: string[];
  streams: string[];
  daily: TeacherDailyStat[];
}

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function shortenTeacherName(fullName: string): string {
  const cleaned = fullName.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Tr\.)\s*/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return cleaned.slice(0, 14);
  return `${parts[0][0]}. ${parts[parts.length - 1]}`.slice(0, 16);
}

const CustomTeacherTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row: TeacherWorkloadRow | undefined = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="bg-slate-950 text-white px-3.5 py-2.5 rounded-lg border border-slate-800 shadow-lg text-xs space-y-1.5 min-w-[210px]">
      <div className="font-bold text-white border-b border-slate-800 pb-1">
        {row.name}
        <div className="text-[11px] font-normal text-slate-400">{row.department}</div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono tabular-nums">
        <span className="text-slate-300">Allocated Lessons:</span>
        <span className="text-right font-bold text-blue-300">{row.allocated} / wk</span>
        <span className="text-slate-300">Free Periods:</span>
        <span className="text-right font-bold text-emerald-300">{row.free} / wk</span>
        <span className="text-slate-300">Weekly Cap:</span>
        <span className="text-right text-slate-200">{row.maxWeeklyCap}p ({row.utilizationPct}%)</span>
        <span className="text-slate-300">Locked Anchors:</span>
        <span className="text-right text-amber-300">{row.lockedCount}</span>
      </div>
      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
        Click bar to inspect day-by-day free slots
      </div>
    </div>
  );
};

const CustomDailyTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const allocated = payload.find((p: any) => p.dataKey === 'allocated')?.value ?? 0;
  const free = payload.find((p: any) => p.dataKey === 'free')?.value ?? 0;
  const total = allocated + free;
  const util = total > 0 ? Math.round((allocated / total) * 100) : 0;

  return (
    <div className="bg-slate-950 text-white px-3.5 py-2.5 rounded-lg border border-slate-800 shadow-lg text-xs space-y-1">
      <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono tabular-nums">
        <span className="text-slate-300">Allocated Lessons:</span>
        <span className="text-right font-bold text-blue-300">{allocated}</span>
        <span className="text-slate-300">Free Teaching Slots:</span>
        <span className="text-right font-bold text-emerald-300">{free}</span>
        <span className="text-slate-300">Daily Load Ratio:</span>
        <span className="text-right text-slate-200">{util}%</span>
      </div>
    </div>
  );
};

export const TeacherLoadDashboard: React.FC<TeacherLoadDashboardProps> = ({
  currentUser,
  workspace: externalWorkspace,
  onOpenTimetableEditor,
  onRefreshWorkspace,
}) => {
  const [fetchedWorkspace, setFetchedWorkspace] = useState<TTWorkspacePayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LoadStatus>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('highest_load');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const loadWorkspaceStandalone = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await ttApiFetch<TTWorkspacePayload>('/api/timetable/workspace');
      setFetchedWorkspace(data);
    } catch (err: any) {
      setFetchError(err?.message || 'Unable to sync live master timetable; displaying cached school schedule.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!externalWorkspace) {
      void loadWorkspaceStandalone();
    }
  }, [externalWorkspace, loadWorkspaceStandalone]);

  const workspace = externalWorkspace ?? fetchedWorkspace;

  const handleRefresh = async () => {
    if (onRefreshWorkspace) {
      setLoading(true);
      try {
        await onRefreshWorkspace();
      } finally {
        setLoading(false);
      }
    } else {
      await loadWorkspaceStandalone();
    }
  };

  // Derive active working days and teaching periods (strictly excluding breaks, lunch, and assembly)
  const { workingDays, teachingPeriods, dataSourceLabel } = useMemo(() => {
    if (workspace) {
      const days =
        workspace.config?.workingDays && workspace.config.workingDays.length > 0
          ? workspace.config.workingDays
          : DEFAULT_DAYS;
      const lessonNums = workspace.periods
        .filter((p) => p.kind === 'lesson' && p.periodNumber > 0)
        .map((p) => p.periodNumber)
        .sort((a, b) => a - b);
      const fallbackNums = Array.from(
        { length: Math.max(1, workspace.config?.defaultPeriodsPerDay || 8) },
        (_, idx) => idx + 1
      );
      const versionLabel = workspace.activeVersion
        ? `${workspace.activeVersion.name} (${workspace.activeVersion.status})`
        : 'Master Curriculum Allocations';
      return {
        workingDays: days,
        teachingPeriods: lessonNums.length > 0 ? lessonNums : fallbackNums,
        dataSourceLabel: `${versionLabel} · ${workspace.config.term} ${workspace.config.academicYear}`,
      };
    }

    const bell = Storage.getBellSchedule();
    const lessonNums = bell
      .filter((b) => !b.isBreak && Number(b.period) > 0)
      .map((b) => Number(b.period))
      .sort((a, b) => a - b);
    return {
      workingDays: DEFAULT_DAYS,
      teachingPeriods: lessonNums.length > 0 ? lessonNums : [1, 2, 3, 4, 5, 6, 7, 8],
      dataSourceLabel: 'Published School Timetable',
    };
  }, [workspace]);

  const weeklyTeachingSlots = workingDays.length * teachingPeriods.length;

  // Build authoritative Teacher Workload dataset (allocated lessons vs free periods across Mon-Fri)
  const teacherRows: TeacherWorkloadRow[] = useMemo(() => {
    if (workspace && workspace.teachers.length > 0) {
      const entries = workspace.activeVersion?.entries || [];
      const streamAllocs = workspace.streamAllocations || [];
      const hasEntries = entries.length > 0;

      // Index distinct (day, period) teaching slots per teacher so joint lessons never double-count
      const slotsByTeacher = new Map<
        string,
        Map<string, Set<number>>
      >();
      const lockedByTeacherDay = new Map<string, Map<string, Set<number>>>();
      const subjectsByTeacher = new Map<string, Set<string>>();
      const streamsByTeacher = new Map<string, Set<string>>();
      const allocWeeklySumByTeacher = new Map<string, number>();

      for (const sa of streamAllocs) {
        if (!sa.isActive) continue;
        for (const tid of sa.teacherIds || []) {
          allocWeeklySumByTeacher.set(tid, (allocWeeklySumByTeacher.get(tid) || 0) + Number(sa.requiredWeeklyPeriods || 0));
          if (!subjectsByTeacher.has(tid)) subjectsByTeacher.set(tid, new Set());
          subjectsByTeacher.get(tid)!.add(sa.subjectName);
          if (!streamsByTeacher.has(tid)) streamsByTeacher.set(tid, new Set());
          streamsByTeacher.get(tid)!.add(`G${sa.grade} ${sa.stream}`);
        }
      }

      for (const e of entries) {
        if (!teachingPeriods.includes(e.periodNumber)) continue;
        for (const tid of e.teacherIds || []) {
          if (!slotsByTeacher.has(tid)) slotsByTeacher.set(tid, new Map());
          const dayMap = slotsByTeacher.get(tid)!;
          if (!dayMap.has(e.dayOfWeek)) dayMap.set(e.dayOfWeek, new Set());
          dayMap.get(e.dayOfWeek)!.add(e.periodNumber);

          if (e.isLocked) {
            if (!lockedByTeacherDay.has(tid)) lockedByTeacherDay.set(tid, new Map());
            const lMap = lockedByTeacherDay.get(tid)!;
            if (!lMap.has(e.dayOfWeek)) lMap.set(e.dayOfWeek, new Set());
            lMap.get(e.dayOfWeek)!.add(e.periodNumber);
          }

          if (!subjectsByTeacher.has(tid)) subjectsByTeacher.set(tid, new Set());
          subjectsByTeacher.get(tid)!.add(e.subjectName);
          if (!streamsByTeacher.has(tid)) streamsByTeacher.set(tid, new Set());
          streamsByTeacher.get(tid)!.add(`G${e.grade} ${e.stream}`);
        }
      }

      return workspace.teachers
        .filter((t) => t.activeInTimetable && !t.archivedAt)
        .map((t) => {
          const dayMap = slotsByTeacher.get(t.id) || new Map<string, Set<number>>();
          const lockedMap = lockedByTeacherDay.get(t.id) || new Map<string, Set<number>>();

          let allocatedTotal = 0;
          let lockedTotal = 0;

          const daily: TeacherDailyStat[] = workingDays.map((day, dIdx) => {
            const bookedSet = dayMap.get(day) || new Set<number>();
            const lockedSet = lockedMap.get(day) || new Set<number>();

            // If version has no generated entries yet, project daily load evenly from active stream allocations
            let allocatedToday = bookedSet.size;
            let allocatedPeriodsList = Array.from(bookedSet).sort((a, b) => a - b);

            if (!hasEntries) {
              const targetWeek = allocWeeklySumByTeacher.get(t.id) || 0;
              const basePerDay = Math.floor(targetWeek / workingDays.length);
              const extra = dIdx < targetWeek % workingDays.length ? 1 : 0;
              allocatedToday = Math.min(teachingPeriods.length, basePerDay + extra);
              allocatedPeriodsList = teachingPeriods.slice(0, allocatedToday);
            }

            const allocatedSet = new Set(allocatedPeriodsList);
            const freePeriodsList = teachingPeriods.filter((p) => !allocatedSet.has(p));

            allocatedTotal += allocatedToday;
            lockedTotal += lockedSet.size;

            return {
              day,
              shortDay: day.slice(0, 3),
              allocated: allocatedToday,
              free: freePeriodsList.length,
              lockedCount: lockedSet.size,
              freePeriodsList,
              allocatedPeriodsList,
            };
          });

          const freeTotal = Math.max(0, weeklyTeachingSlots - allocatedTotal);
          const maxWeeklyCap = Math.max(1, Number(t.maxWeeklyPeriods || 28));
          const utilizationPct = Math.round((allocatedTotal / maxWeeklyCap) * 100);

          const status: LoadStatus =
            allocatedTotal > maxWeeklyCap || utilizationPct >= 92
              ? 'overloaded'
              : utilizationPct < 60
              ? 'available'
              : 'balanced';

          return {
            id: t.id,
            name: t.teacherName,
            shortName: shortenTeacherName(t.teacherName),
            department: t.department || 'Academic Faculty',
            tscNumber: t.tscNumber || '—',
            allocated: allocatedTotal,
            free: freeTotal,
            weeklyCapacity: weeklyTeachingSlots,
            maxWeeklyCap,
            maxDailyCap: Number(t.maxDailyPeriods || 6),
            utilizationPct,
            lockedCount: lockedTotal,
            status,
            subjects: Array.from(subjectsByTeacher.get(t.id) || t.qualifiedSubjects || []).sort(),
            streams: Array.from(streamsByTeacher.get(t.id) || []).sort(),
            daily,
          };
        });
    }

    // Fallback to published client Storage slots when backend workspace is unavailable
    const allUsers = Storage.getUsers();
    const teachingRoles = new Set([
      'teacher',
      'class_teacher',
      'hod',
      'senior_teacher',
      'dean_of_studies',
      'curriculum_coordinator',
      'deputy_head',
    ]);
    const faculty = allUsers.filter((u) => teachingRoles.has(u.role));
    const slots = Storage.getAllTimetableSlots();

    return faculty.map((u) => {
      const mySlots = slots.filter(
        (s) =>
          (s.teacherEmail && u.email && s.teacherEmail.trim().toLowerCase() === u.email.trim().toLowerCase()) ||
          s.teacherName.trim().toLowerCase() === u.name.trim().toLowerCase()
      );
      const subjectsSet = new Set<string>(u.assignedSubjects || []);
      const streamsSet = new Set<string>(
        (u.assignedStreams || []).map((st) => `G${st.grade} ${st.stream}`)
      );

      let allocatedTotal = 0;
      const daily: TeacherDailyStat[] = workingDays.map((day) => {
        const booked = new Set<number>();
        mySlots
          .filter((s) => s.dayOfWeek === day && teachingPeriods.includes(Number(s.period)))
          .forEach((s) => {
            booked.add(Number(s.period));
            subjectsSet.add(s.subject);
            streamsSet.add(`G${s.grade} ${s.stream}`);
          });
        const allocatedPeriodsList = Array.from(booked).sort((a, b) => a - b);
        const freePeriodsList = teachingPeriods.filter((p) => !booked.has(p));
        allocatedTotal += allocatedPeriodsList.length;

        return {
          day,
          shortDay: day.slice(0, 3),
          allocated: allocatedPeriodsList.length,
          free: freePeriodsList.length,
          lockedCount: 0,
          freePeriodsList,
          allocatedPeriodsList,
        };
      });

      const freeTotal = Math.max(0, weeklyTeachingSlots - allocatedTotal);
      const maxWeeklyCap = 28;
      const utilizationPct = Math.round((allocatedTotal / maxWeeklyCap) * 100);
      const status: LoadStatus =
        allocatedTotal > maxWeeklyCap || utilizationPct >= 92
          ? 'overloaded'
          : utilizationPct < 60
          ? 'available'
          : 'balanced';

      return {
        id: u.id,
        name: u.name,
        shortName: shortenTeacherName(u.name),
        department: u.department || 'Academic Faculty',
        tscNumber: u.tscNumber || '—',
        allocated: allocatedTotal,
        free: freeTotal,
        weeklyCapacity: weeklyTeachingSlots,
        maxWeeklyCap,
        maxDailyCap: 6,
        utilizationPct,
        lockedCount: 0,
        status,
        subjects: Array.from(subjectsSet).sort(),
        streams: Array.from(streamsSet).sort(),
        daily,
      };
    });
  }, [workspace, workingDays, teachingPeriods, weeklyTeachingSlots]);

  const departments = useMemo(() => {
    return Array.from(new Set(teacherRows.map((t) => t.department).filter(Boolean))).sort();
  }, [teacherRows]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = teacherRows.filter((t) => {
      if (selectedDepartment !== 'ALL' && t.department !== selectedDepartment) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (q) {
        const hay = `${t.name} ${t.department} ${t.subjects.join(' ')} ${t.streams.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortMode === 'highest_load') {
      sorted.sort((a, b) => b.allocated - a.allocated || a.name.localeCompare(b.name));
    } else if (sortMode === 'most_free') {
      sorted.sort((a, b) => b.free - a.free || a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [teacherRows, selectedDepartment, statusFilter, searchQuery, sortMode]);

  const selectedTeacher = useMemo(
    () => teacherRows.find((t) => t.id === selectedTeacherId) || null,
    [teacherRows, selectedTeacherId]
  );

  // KPI metrics
  const kpis = useMemo(() => {
    const count = teacherRows.length;
    if (count === 0) {
      return {
        totalTeachers: 0,
        avgAllocated: '0.0',
        avgFree: '0.0',
        overloadedCount: 0,
        availableCount: 0,
        avgCap: 28,
      };
    }
    const sumAlloc = teacherRows.reduce((acc, t) => acc + t.allocated, 0);
    const sumFree = teacherRows.reduce((acc, t) => acc + t.free, 0);
    const sumCap = teacherRows.reduce((acc, t) => acc + t.maxWeeklyCap, 0);
    const overloadedCount = teacherRows.filter((t) => t.status === 'overloaded').length;
    const availableCount = teacherRows.filter((t) => t.status === 'available').length;
    return {
      totalTeachers: count,
      avgAllocated: (sumAlloc / count).toFixed(1),
      avgFree: (sumFree / count).toFixed(1),
      overloadedCount,
      availableCount,
      avgCap: Math.round(sumCap / count),
    };
  }, [teacherRows]);

  // Daily distribution chart data (either selected teacher OR filtered cohort aggregate)
  const dailyChartData = useMemo(() => {
    if (selectedTeacher) {
      return selectedTeacher.daily.map((d) => ({
        day: d.shortDay,
        fullDay: d.day,
        allocated: d.allocated,
        free: d.free,
      }));
    }
    return workingDays.map((day, idx) => {
      const allocSum = filteredTeachers.reduce((acc, t) => acc + (t.daily[idx]?.allocated || 0), 0);
      const freeSum = filteredTeachers.reduce((acc, t) => acc + (t.daily[idx]?.free || 0), 0);
      return {
        day: day.slice(0, 3),
        fullDay: day,
        allocated: allocSum,
        free: freeSum,
      };
    });
  }, [selectedTeacher, filteredTeachers, workingDays]);

  const chartTeachers = useMemo(() => filteredTeachers.slice(0, 18), [filteredTeachers]);

  const statusMeta = (status: LoadStatus) => {
    if (status === 'overloaded') {
      return { label: 'Overloaded', textClass: 'text-rose-700', barClass: 'bg-rose-600' };
    }
    if (status === 'available') {
      return { label: 'Available Capacity', textClass: 'text-emerald-700', barClass: 'bg-emerald-600' };
    }
    return { label: 'Balanced', textClass: 'text-slate-700', barClass: 'bg-slate-800' };
  };

  return (
    <div className="space-y-5">
      {/* Top Bar Contract: Title + Context Left, 1-2 Actions Right */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-slate-700" />
            <span>Deputy Head Workload Analytics · {dataSourceLabel}</span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
            Teacher Load Dashboard — Free Periods vs. Allocated Lessons
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Weekly capacity calculated strictly from <span className="font-mono tabular-nums font-semibold text-slate-800">{teachingPeriods.length}</span> daily teaching periods × <span className="font-mono tabular-nums font-semibold text-slate-800">{workingDays.length}</span> days (<span className="font-mono tabular-nums font-semibold text-slate-800">{weeklyTeachingSlots}</span> slots/wk, breaks &amp; lunch excluded).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Refresh Data'}</span>
          </button>
          {onOpenTimetableEditor && (
            <button
              type="button"
              onClick={onOpenTimetableEditor}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Rebalance in Timetable</span>
            </button>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Flat Single-Elevation KPI Strip (Zero Card Sandwiches, Tabular Numerals) */}
      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Active Faculty</span>
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
            {kpis.totalTeachers}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Tracked across {departments.length} department{departments.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Avg. Weekly Load</span>
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
            {kpis.avgAllocated} <span className="text-xs font-semibold text-slate-400">/ {weeklyTeachingSlots}p</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5 font-mono tabular-nums">
            Avg. {kpis.avgFree} free periods / teacher
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Overloaded Faculty</span>
          </div>
          <div className={`text-2xl font-extrabold font-mono tabular-nums mt-1 ${kpis.overloadedCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {kpis.overloadedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            At or above 92% of weekly cap ({kpis.avgCap}p)
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Relief-Ready Capacity</span>
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-700 mt-1">
            {kpis.availableCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Teachers below 60% cap available to rebalance
          </div>
        </div>
      </div>

      {/* Filter & Sort Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teacher, subject, stream..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'overloaded', label: 'Overloaded' },
                { id: 'balanced', label: 'Balanced' },
                { id: 'available', label: 'Available' },
              ] as const
            ).map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => setStatusFilter(seg.id)}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  statusFilter === seg.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {seg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Sort:</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-800"
          >
            <option value="highest_load">Highest Allocated Load</option>
            <option value="most_free">Most Free Periods</option>
            <option value="name_asc">Teacher Name (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Recharts Visualizations Grid */}
      {loading && teacherRows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-3">
          <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
          <div className="h-64 w-full bg-slate-100 rounded animate-pulse" />
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <div className="text-sm font-bold text-slate-800">No teachers match the current filter</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Clear your search or department filters to inspect weekly allocated lessons versus free periods across the school faculty.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedDepartment('ALL');
              setStatusFilter('ALL');
            }}
            className="px-3.5 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Chart 1: Stacked Bar Chart — Allocated Lessons vs Free Periods per Teacher */}
          <section className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Weekly Allocated Lessons vs. Free Periods by Teacher
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {chartTeachers.length} of {filteredTeachers.length} teachers · Dashed line indicates average weekly cap ({kpis.avgCap} lessons). Click any bar to drill into daily slots.
                </p>
              </div>
              {selectedTeacher && (
                <button
                  type="button"
                  onClick={() => setSelectedTeacherId(null)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Selected: {selectedTeacher.name}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="w-full h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartTeachers}
                  margin={{ top: 12, right: 16, left: 0, bottom: 48 }}
                  barCategoryGap="24%"
                  onClick={(state: any) => {
                    const clicked = state?.activePayload?.[0]?.payload as TeacherWorkloadRow | undefined;
                    if (clicked?.id) {
                      setSelectedTeacherId((prev) => (prev === clicked.id ? null : clicked.id));
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    angle={-32}
                    textAnchor="end"
                    interval={0}
                    height={56}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    domain={[0, weeklyTeachingSlots]}
                    label={{
                      value: 'Periods / Week',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 11, fill: '#64748B' },
                    }}
                  />
                  <Tooltip content={<CustomTeacherTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="square"
                    wrapperStyle={{ fontSize: '12px', paddingBottom: '8px' }}
                  />
                  <ReferenceLine
                    y={kpis.avgCap}
                    stroke="#D97706"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Cap (${kpis.avgCap}p)`,
                      position: 'insideTopRight',
                      fill: '#B45309',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="allocated"
                    name="Allocated Lessons"
                    stackId="week"
                    fill="#1E3A8A"
                    radius={[0, 0, 0, 0]}
                    className="cursor-pointer"
                  >
                    {chartTeachers.map((entry) => {
                      const isSelected = selectedTeacherId === entry.id;
                      const color =
                        entry.status === 'overloaded'
                          ? '#DC2626'
                          : isSelected
                          ? '#2563EB'
                          : '#1E293B';
                      return <Cell key={entry.id} fill={color} />;
                    })}
                  </Bar>
                  <Bar
                    dataKey="free"
                    name="Free Periods"
                    stackId="week"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    className="cursor-pointer"
                  >
                    {chartTeachers.map((entry) => (
                      <Cell
                        key={`free-${entry.id}`}
                        fill={selectedTeacherId === entry.id ? '#059669' : '#A7F3D0'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Chart 2: Daily Balance (Mon-Fri) — Allocated vs Free Teaching Slots */}
          <section className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedTeacher
                  ? `${selectedTeacher.shortName} — Daily Balance`
                  : 'School-Wide Daily Balance (Mon–Fri)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedTeacher
                  ? `Allocated vs. free periods per day (daily cap: ${selectedTeacher.maxDailyCap}p)`
                  : `Total allocated vs. free teaching slots across ${filteredTeachers.length} teachers`}
              </p>
            </div>

            <div className="w-full h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 12, right: 12, left: -10, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip content={<CustomDailyTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="square"
                    wrapperStyle={{ fontSize: '12px', paddingBottom: '8px' }}
                  />
                  {selectedTeacher && (
                    <ReferenceLine
                      y={selectedTeacher.maxDailyCap}
                      stroke="#D97706"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                  )}
                  <Bar dataKey="allocated" name="Allocated" fill="#1E293B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="free" name="Free Slots" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {/* Selected Teacher Free-Period Inspector Drawer */}
      {selectedTeacher && (
        <div className="bg-white border border-slate-300 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Individual Workload &amp; Free Slot Inspector
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                {selectedTeacher.name} · <span className="font-semibold text-slate-600">{selectedTeacher.department}</span>
              </h3>
              <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  Subjects: <strong className="text-slate-900">{selectedTeacher.subjects.join(', ') || 'Unassigned'}</strong>
                </span>
                <span>
                  Streams: <strong className="text-slate-900">{selectedTeacher.streams.join(', ') || 'None yet'}</strong>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTeacherId(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {selectedTeacher.daily.map((d) => (
              <div key={d.day} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{d.day}</span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-600">
                    {d.allocated}p / {d.free} free
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <div className="text-[10px] font-semibold uppercase text-emerald-700 mb-0.5">Free Teaching Periods</div>
                  <div className="font-mono tabular-nums text-slate-900">
                    {d.freePeriodsList.length > 0 ? d.freePeriodsList.map((p) => `P${p}`).join(', ') : 'No free slots'}
                  </div>
                </div>
                {d.lockedCount > 0 && (
                  <div className="text-[10px] font-medium text-amber-800 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>{d.lockedCount} locked shared anchor{d.lockedCount === 1 ? '' : 's'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High-Density Teacher Workload Balancing Table */}
      {filteredTeachers.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Faculty Weekly Load &amp; Free Capacity Register</h3>
              <p className="text-xs text-slate-500">
                Click any teacher row to inspect exact daily free periods (Mon–Fri) for workload balancing and relief cover.
              </p>
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500">
              {filteredTeachers.length} teacher{filteredTeachers.length === 1 ? '' : 's'} shown
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-2.5">Teacher &amp; Department</th>
                  <th className="px-3 py-2.5">Subjects / Streams</th>
                  {workingDays.map((day) => (
                    <th key={day} className="px-2 py-2.5 text-right font-mono">
                      {day.slice(0, 3)}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right">Allocated</th>
                  <th className="px-3 py-2.5 text-right">Free</th>
                  <th className="px-4 py-2.5 text-right">Weekly Cap</th>
                  <th className="px-4 py-2.5">Load Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t) => {
                  const meta = statusMeta(t.status);
                  const isSelected = selectedTeacherId === t.id;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTeacherId((prev) => (prev === t.id ? null : t.id))}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-500">{t.department}</div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[210px]">
                        <div className="truncate text-slate-800 font-medium" title={t.subjects.join(', ')}>
                          {t.subjects.slice(0, 2).join(', ') || '—'}
                          {t.subjects.length > 2 ? ` +${t.subjects.length - 2}` : ''}
                        </div>
                        <div className="truncate text-[11px] text-slate-500" title={t.streams.join(', ')}>
                          {t.streams.slice(0, 3).join(', ') || 'No streams assigned'}
                          {t.streams.length > 3 ? ` +${t.streams.length - 3}` : ''}
                        </div>
                      </td>
                      {t.daily.map((d) => (
                        <td key={d.day} className="px-2 py-2.5 text-right font-mono tabular-nums">
                          <span className={d.allocated > t.maxDailyCap ? 'font-bold text-rose-700' : 'text-slate-800'}>
                            {d.allocated}
                          </span>
                          <span className="text-slate-400">/{d.free}f</span>
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-slate-900">
                        {t.allocated}p
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-emerald-700">
                        {t.free}p
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700">
                        {t.allocated}/{t.maxWeeklyCap} ({t.utilizationPct}%)
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${meta.barClass}`}
                              style={{ width: `${Math.min(100, t.utilizationPct)}%` }}
                            />
                          </div>
                          <span className={`font-semibold text-[11px] ${meta.textClass}`}>
                            {meta.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
