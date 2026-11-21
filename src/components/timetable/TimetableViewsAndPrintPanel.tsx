import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Pencil,
  Play,
  Printer,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  ttApiFetch,
  type DirectoryTeacher,
  type PeriodSlotDefinition,
  type ScheduleConfig,
  type SchoolBrandInfo,
  type TimetableAuditReport,
  type TimetableCategoryId,
  type TimetableCategoryMeta,
  type TimetableEntry,
  type TimetableFacility,
  type TimetableStream,
  type TimetableVersion,
} from './timetableTypes';

interface Props {
  schoolId?: string;
  schoolName: string;
  school?: SchoolBrandInfo;
  categories: TimetableCategoryMeta[];
  weekdays: string[];
  scheduleConfigs: Record<TimetableCategoryId, ScheduleConfig>;
  facilities: TimetableFacility[];
  streams: TimetableStream[];
  teachers: DirectoryTeacher[];
  versions: TimetableVersion[];
  activeVersion: TimetableVersion | null;
  entries: TimetableEntry[];
  audit: TimetableAuditReport;
  canManage: boolean;
  initialCategory?: TimetableCategoryId | null;
  onSelectVersion: (versionId: string) => void;
  onRefresh: (versionId?: string) => Promise<void>;
}

type ViewPerspective = 'stream' | 'teacher' | 'grade' | 'category' | 'master';
type PrintMode =
  | 'individual_teacher'
  | 'individual_stream'
  | 'individual_grade'
  | 'all_teachers'
  | 'all_streams'
  | 'entire_category'
  | 'school_master';

interface PrintableSheet {
  title: string;
  subtitle: string;
  days: string[];
  periods: PeriodSlotDefinition[];
  entries: TimetableEntry[];
  mode: 'stream' | 'teacher';
  isMaster?: boolean;
  masterStreams?: TimetableStream[];
}

function parseMinutes(t: string): number {
  const [h, m] = (t || '').split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 9999;
}

const SchoolPrintHeader: React.FC<{
  school?: SchoolBrandInfo;
  fallbackSchoolName: string;
  sheetTitle: string;
  sheetSubtitle: string;
}> = ({ school, fallbackSchoolName, sheetTitle, sheetSubtitle }) => {
  const displayName = school?.name || fallbackSchoolName;
  const contactParts = [school?.address, school?.city, school?.phone, school?.email].filter(Boolean);

  return (
    <div className="mb-3 border-b-2 border-slate-800 pb-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {school?.logoUrl ? (
          <img
            src={school.logoUrl}
            alt={`${displayName} logo`}
            className="w-12 h-12 object-contain shrink-0"
          />
        ) : null}
        <div>
          <div className="text-base font-bold text-slate-900 uppercase tracking-tight">
            {displayName}
          </div>
          {school?.motto && (
            <div className="text-[11px] italic text-slate-600">{school.motto}</div>
          )}
          {contactParts.length > 0 && (
            <div className="text-[10px] text-slate-500">{contactParts.join(' · ')}</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-slate-900">{sheetTitle}</div>
        <div className="text-[11px] text-slate-600">{sheetSubtitle}</div>
      </div>
    </div>
  );
};

export const TimetableMatrixGrid: React.FC<{
  title: string;
  subtitle: string;
  days: string[];
  periods: PeriodSlotDefinition[];
  entries: TimetableEntry[];
  mode: 'stream' | 'teacher';
  compact?: boolean;
  hideHeader?: boolean;
  canEdit?: boolean;
  onEditEntry?: (entry: TimetableEntry) => void;
}> = ({
  title,
  subtitle,
  days,
  periods,
  entries,
  mode,
  compact = false,
  hideHeader = false,
  canEdit = false,
  onEditEntry,
}) => {
  const entriesBySlot = useMemo(() => {
    const map = new Map<string, TimetableEntry[]>();
    for (const e of entries) {
      const key = `${e.dayOfWeek}::${e.periodNumber}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [entries]);

  const orderedPeriods = useMemo(
    () =>
      [...periods].sort((a, b) => {
        const diff = parseMinutes(a.startTime) - parseMinutes(b.startTime);
        return diff !== 0 ? diff : a.periodNumber - b.periodNumber;
      }),
    [periods]
  );

  // Only show remedial slot row if there is at least one remedial entry in this grid
  const hasRemedialEntries = useMemo(
    () => entries.some((e) => e.subjectKind === 'remedial'),
    [entries]
  );

  const visiblePeriods = useMemo(
    () =>
      orderedPeriods.filter((p) => {
        if (p.slotType === 'remedial' && !hasRemedialEntries) return false;
        return true;
      }),
    [orderedPeriods, hasRemedialEntries]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {!hideHeader && (
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <div className="text-xs font-mono text-slate-500 tabular-nums">
            {entries.length} scheduled lesson{entries.length === 1 ? '' : 's'}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[720px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
              <th className="py-2 px-3 w-36 border-r border-slate-200">Lesson / Time</th>
              {days.map((day) => (
                <th key={day} className="py-2 px-2.5 border-r border-slate-200 last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {visiblePeriods.map((slot, idx) => {
              if (slot.slotType === 'break' || slot.slotType === 'lunch') {
                return (
                  <tr
                    key={`brk_${slot.periodNumber}_${idx}`}
                    className={slot.slotType === 'lunch' ? 'bg-amber-50/70' : 'bg-slate-100/80'}
                  >
                    <td className="py-1.5 px-3 border-r border-slate-200 font-mono">
                      <div className="font-semibold text-slate-700">{slot.label}</div>
                      <div className="text-[11px] text-slate-500">
                        {slot.startTime}–{slot.endTime}
                      </div>
                    </td>
                    <td
                      colSpan={days.length}
                      className="py-1.5 px-3 text-center font-semibold tracking-wider uppercase text-[11px] text-slate-600"
                    >
                      {slot.label} ({slot.durationMins} mins · {slot.startTime} – {slot.endTime})
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={`p_${slot.periodNumber}_${idx}`} className="align-top">
                  <td className="py-2 px-3 bg-slate-50/60 border-r border-slate-200 font-mono">
                    <div className="font-semibold text-slate-900">{slot.label}</div>
                    <div className="text-[11px] text-slate-500">
                      {slot.startTime}–{slot.endTime}
                    </div>
                  </td>
                  {days.map((day) => {
                    const list = entriesBySlot.get(`${day}::${slot.periodNumber}`) || [];
                    return (
                      <td
                        key={day}
                        className={`${compact ? 'p-1.5' : 'p-2'} border-r border-slate-200 last:border-r-0 align-top`}
                      >
                        {list.length === 0 ? (
                          <span className="text-slate-300 text-[11px]">—</span>
                        ) : (
                          <div className="space-y-1.5">
                            {list.map((entry) => (
                              <div
                                key={entry.id}
                                className={`group relative rounded border p-1.5 ${
                                  entry.subjectKind === 'remedial'
                                    ? 'bg-amber-50/80 border-amber-200'
                                    : entry.subjectKind === 'common_activity'
                                      ? 'bg-indigo-50/60 border-indigo-200'
                                      : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="font-semibold text-slate-900 leading-tight">
                                    {entry.subjectName}
                                  </div>
                                  {canEdit && onEditEntry && (
                                    <button
                                      type="button"
                                      onClick={() => onEditEntry(entry)}
                                      title="Move or reassign slot (zero-collision validated)"
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-700 transition-opacity print:hidden"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                                  {mode === 'stream'
                                    ? entry.teacherName
                                    : `Grade ${entry.grade} ${entry.stream}`}
                                </div>
                                {entry.facilityName && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {entry.facilityName}
                                  </div>
                                )}
                                {entry.subjectKind === 'remedial' &&
                                  entry.studentGroupMode === 'selected_learners' && (
                                    <div className="text-[10px] font-medium text-amber-800 mt-0.5">
                                      {entry.studentGroupName} ({entry.studentIds.length})
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SchoolMasterMatrix: React.FC<{
  day: string;
  streams: TimetableStream[];
  entries: TimetableEntry[];
  periods: PeriodSlotDefinition[];
}> = ({ day, streams, entries, periods }) => {
  const regularPeriods = useMemo(
    () =>
      periods
        .filter((p) => p.slotType === 'regular')
        .sort((a, b) => a.periodNumber - b.periodNumber),
    [periods]
  );

  const entryMap = useMemo(() => {
    const m = new Map<string, TimetableEntry[]>();
    for (const e of entries) {
      if (e.dayOfWeek !== day) continue;
      const k = `${e.grade}::${e.stream}::${e.periodNumber}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [entries, day]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">
          School Master Timetable — {day} (All Grades &amp; Streams)
        </h4>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          {streams.length} stream{streams.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[780px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <th className="py-2 px-3 w-36 border-r border-slate-200">Grade &amp; Stream</th>
              {regularPeriods.map((p) => (
                <th
                  key={p.periodNumber}
                  className="py-2 px-2 border-r border-slate-200 last:border-r-0 font-mono"
                >
                  <div>P{p.periodNumber}</div>
                  <div className="text-[10px] font-normal text-slate-500">
                    {p.startTime}–{p.endTime}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {streams.map((st) => (
              <tr key={`${st.grade}::${st.stream}`} className="align-top">
                <td className="py-2 px-3 bg-slate-50/70 border-r border-slate-200 font-semibold text-slate-900 whitespace-nowrap">
                  Grade {st.grade} · {st.stream}
                </td>
                {regularPeriods.map((p) => {
                  const list = entryMap.get(`${st.grade}::${st.stream}::${p.periodNumber}`) || [];
                  return (
                    <td
                      key={p.periodNumber}
                      className="p-1.5 border-r border-slate-200 last:border-r-0"
                    >
                      {list.length === 0 ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        list.map((e) => (
                          <div key={e.id} className="leading-tight">
                            <div className="font-semibold text-slate-900">{e.subjectName}</div>
                            <div className="text-[10px] text-slate-600">{e.teacherName}</div>
                            {e.facilityName && (
                              <div className="text-[9px] text-slate-500">{e.facilityName}</div>
                            )}
                          </div>
                        ))
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TimetableViewsAndPrintPanel: React.FC<Props> = ({
  schoolId,
  schoolName,
  school,
  categories,
  weekdays,
  scheduleConfigs,
  facilities,
  streams,
  teachers,
  versions,
  activeVersion,
  entries,
  audit,
  canManage,
  initialCategory,
  onSelectVersion,
  onRefresh,
}) => {
  const [perspective, setPerspective] = useState<ViewPerspective>('stream');
  const [selectedCategory, setSelectedCategory] = useState<TimetableCategoryId>(
    initialCategory || 'cat_1_3'
  );
  const [selectedGrade, setSelectedGrade] = useState<number>(streams[0]?.grade ?? 1);
  const [selectedStreamKey, setSelectedStreamKey] = useState<string>(
    streams[0] ? `${streams[0].grade}::${streams[0].stream}` : ''
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id ?? '');
  const [selectedMasterDay, setSelectedMasterDay] = useState<string>(weekdays[0] || 'Monday');

  const [termLabel, setTermLabel] = useState('Term 1');
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [generatingScope, setGeneratingScope] = useState<TimetableCategoryId | 'whole_school' | null>(
    null
  );
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [unplacedTasks, setUnplacedTasks] = useState<
    Array<{ grade: number; stream: string; subjectName: string; reason: string }>
  >([]);

  // Manual slot edit modal state (strict zero-collision backend validation)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [editDay, setEditDay] = useState<string>('Monday');
  const [editPeriod, setEditPeriod] = useState<number>(1);
  const [editTeacherId, setEditTeacherId] = useState<string>('');
  const [editFacilityId, setEditFacilityId] = useState<string>('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Print portal state
  const [printMode, setPrintMode] = useState<PrintMode>('individual_stream');
  const [printSheets, setPrintSheets] = useState<PrintableSheet[] | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      const matchingStream = streams.find((s) => s.categoryId === initialCategory);
      if (matchingStream) {
        setSelectedStreamKey(`${matchingStream.grade}::${matchingStream.stream}`);
        setSelectedGrade(matchingStream.grade);
      }
    }
  }, [initialCategory, streams]);

  useEffect(() => {
    if (!selectedStreamKey && streams.length > 0) {
      setSelectedStreamKey(`${streams[0].grade}::${streams[0].stream}`);
      setSelectedGrade(streams[0].grade);
    }
  }, [streams, selectedStreamKey]);

  useEffect(() => {
    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  useEffect(() => {
    if (!printSheets || printSheets.length === 0) return;
    document.body.classList.add('printing-portal-active');
    const cleanup = () => {
      document.body.classList.remove('printing-portal-active');
      setPrintSheets(null);
    };
    window.addEventListener('afterprint', cleanup);
    const timer = window.setTimeout(() => {
      window.print();
    }, 90);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', cleanup);
      document.body.classList.remove('printing-portal-active');
    };
  }, [printSheets]);

  const handleGenerate = async (targetCategoryId?: TimetableCategoryId) => {
    if (!canManage) return;
    setGeneratingScope(targetCategoryId ?? 'whole_school');
    setFeedback(null);
    setUnplacedTasks([]);
    try {
      const resp = await ttApiFetch(
        '/api/timetable/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            termLabel,
            academicYear,
            targetCategoryId: targetCategoryId || undefined,
            baseVersionId: activeVersion?.id || undefined,
          }),
        },
        schoolId
      );
      await onRefresh(resp.version?.id);
      setFeedback({
        type: 'ok',
        text: `Generated "${resp.version?.name}" with ${resp.entries?.length || 0} conflict-free lesson sessions (0 teacher collisions, 0 unplaced).`,
      });
    } catch (err: any) {
      if (Array.isArray(err?.payload?.unplacedTasks)) {
        setUnplacedTasks(err.payload.unplacedTasks);
      }
      setFeedback({ type: 'err', text: err.message || 'Failed to generate timetable.' });
    } finally {
      setGeneratingScope(null);
    }
  };

  const handlePublish = async () => {
    if (!canManage || !activeVersion) return;
    setPublishing(true);
    setFeedback(null);
    try {
      await ttApiFetch(
        `/api/timetable/versions/${activeVersion.id}/publish`,
        { method: 'POST' },
        schoolId
      );
      await onRefresh(activeVersion.id);
      setFeedback({
        type: 'ok',
        text: `Published "${activeVersion.name}" to all streams, teachers, students, and parents.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to publish timetable.' });
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteVersion = async () => {
    if (!canManage || !activeVersion) return;
    try {
      await ttApiFetch(
        `/api/timetable/versions/${activeVersion.id}`,
        { method: 'DELETE' },
        schoolId
      );
      await onRefresh();
      setFeedback({ type: 'ok', text: `Deleted timetable version "${activeVersion.name}".` });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to delete version.' });
    }
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setEditDay(entry.dayOfWeek);
    setEditPeriod(entry.periodNumber);
    setEditTeacherId(entry.teacherId);
    setEditFacilityId(entry.facilityId || '');
    setEditError(null);
  };

  const handleSaveManualEdit = async () => {
    if (!editingEntry || !activeVersion) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const teacher = teachers.find((t) => t.id === editTeacherId);
      await ttApiFetch(
        `/api/timetable/versions/${activeVersion.id}/entries/${editingEntry.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            dayOfWeek: editDay,
            periodNumber: editPeriod,
            teacherId: editTeacherId,
            teacherName: teacher?.name || editingEntry.teacherName,
            facilityId: editFacilityId || null,
          }),
        },
        schoolId
      );
      setEditingEntry(null);
      await onRefresh(activeVersion.id);
      setFeedback({
        type: 'ok',
        text: `Updated ${editingEntry.subjectName} (Grade ${editingEntry.grade} ${editingEntry.stream}) with zero collisions verified.`,
      });
    } catch (err: any) {
      setEditError(err.message || 'Manual edit rejected due to scheduling collision.');
    } finally {
      setEditSaving(false);
    }
  };

  // Unified chronological period slots across categories (used for Teacher & School Master views)
  const unifiedPeriods = useMemo<PeriodSlotDefinition[]>(() => {
    const preferred =
      scheduleConfigs.cat_4_6?.periods ||
      scheduleConfigs.cat_7_9?.periods ||
      scheduleConfigs.cat_1_3?.periods ||
      [];
    return preferred;
  }, [scheduleConfigs]);

  const activeStreamObj = useMemo(() => {
    const [gStr, ...rest] = selectedStreamKey.split('::');
    return streams.find((s) => s.grade === Number(gStr) && s.stream === rest.join('::')) || null;
  }, [selectedStreamKey, streams]);

  const gradesAvailable = useMemo(
    () => Array.from(new Set(streams.map((s) => s.grade))).sort((a, b) => a - b),
    [streams]
  );

  // Build printable sheets for ALL 7 required print modes
  const handlePrint = (overrideMode?: PrintMode) => {
    const mode = overrideMode || printMode;
    const sheets: PrintableSheet[] = [];
    const versionSubtitle = activeVersion
      ? `${activeVersion.name} · ${activeVersion.termLabel} ${activeVersion.academicYear}`
      : 'Master Timetable';

    const buildStreamSheet = (st: TimetableStream): PrintableSheet => {
      const cfg = scheduleConfigs[st.categoryId];
      return {
        title: `Grade ${st.grade} ${st.stream} Timetable`,
        subtitle: `${categories.find((c) => c.id === st.categoryId)?.label || ''} · ${versionSubtitle}`,
        days: cfg?.days || weekdays,
        periods: cfg?.periods || unifiedPeriods,
        entries: entries.filter((e) => e.grade === st.grade && e.stream === st.stream),
        mode: 'stream',
      };
    };

    const buildTeacherSheet = (tId: string, tName: string): PrintableSheet => ({
      title: `Teacher Timetable — ${tName}`,
      subtitle: `Individual Teaching & Supervision Schedule · ${versionSubtitle}`,
      days: weekdays,
      periods: unifiedPeriods,
      entries: entries.filter((e) => e.teacherId === tId),
      mode: 'teacher',
    });

    if (mode === 'individual_stream' && activeStreamObj) {
      sheets.push(buildStreamSheet(activeStreamObj));
    } else if (mode === 'individual_teacher') {
      const t = teachers.find((x) => x.id === selectedTeacherId);
      if (t) sheets.push(buildTeacherSheet(t.id, t.name));
    } else if (mode === 'individual_grade') {
      const gradeStreams = streams.filter((s) => s.grade === selectedGrade);
      gradeStreams.forEach((st) => sheets.push(buildStreamSheet(st)));
    } else if (mode === 'all_teachers') {
      const activeTeacherIds = Array.from(new Set(entries.map((e) => e.teacherId)));
      activeTeacherIds.forEach((tId) => {
        const name =
          teachers.find((t) => t.id === tId)?.name ||
          entries.find((e) => e.teacherId === tId)?.teacherName ||
          tId;
        sheets.push(buildTeacherSheet(tId, name));
      });
    } else if (mode === 'all_streams') {
      streams
        .filter((st) => entries.some((e) => e.grade === st.grade && e.stream === st.stream))
        .forEach((st) => sheets.push(buildStreamSheet(st)));
    } else if (mode === 'entire_category') {
      const catStreams = streams.filter((s) => s.categoryId === selectedCategory);
      catStreams.forEach((st) => sheets.push(buildStreamSheet(st)));
    } else if (mode === 'school_master') {
      const activeStreams = streams.filter((st) =>
        entries.some((e) => e.grade === st.grade && e.stream === st.stream)
      );
      for (const day of weekdays) {
        sheets.push({
          title: `School Master Timetable — ${day}`,
          subtitle: `Whole School Schedule Overview · ${versionSubtitle}`,
          days: [day],
          periods: unifiedPeriods,
          entries: entries.filter((e) => e.dayOfWeek === day),
          mode: 'stream',
          isMaster: true,
          masterStreams: activeStreams.length > 0 ? activeStreams : streams,
        });
      }
    }

    if (sheets.length === 0) {
      setFeedback({ type: 'err', text: 'No timetable entries available to print for this selection.' });
      return;
    }
    setPrintSheets(sheets);
  };

  const displaySchoolName = school?.name || schoolName;

  return (
    <div className="space-y-5">
      {/* Generation, Version Selector & 7-Mode Print Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              value={termLabel}
              onChange={(e) => setTermLabel(e.target.value)}
              disabled={!canManage}
              aria-label="Term"
              className="w-20 px-2 py-1.5 border border-slate-300 rounded text-slate-900"
            />
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              disabled={!canManage}
              aria-label="Academic Year"
              className="w-16 px-2 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
            />
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => handleGenerate('cat_1_3')}
                  disabled={generatingScope !== null}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 text-slate-800 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Play className="w-3 h-3 text-indigo-600" />
                  {generatingScope === 'cat_1_3' ? 'Working...' : 'Grades 1–3'}
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerate('cat_4_6')}
                  disabled={generatingScope !== null}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 text-slate-800 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Play className="w-3 h-3 text-indigo-600" />
                  {generatingScope === 'cat_4_6' ? 'Working...' : 'Grades 4–6'}
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerate('cat_7_9')}
                  disabled={generatingScope !== null}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 text-slate-800 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Play className="w-3 h-3 text-indigo-600" />
                  {generatingScope === 'cat_7_9' ? 'Working...' : 'Grades 7–9'}
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerate(undefined)}
                  disabled={generatingScope !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Play className="w-3 h-3" />
                  {generatingScope === 'whole_school' ? 'Generating...' : 'Generate Whole School'}
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {versions.length > 0 && (
              <select
                value={activeVersion?.id || ''}
                onChange={(e) => onSelectVersion(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.status.toUpperCase()})
                  </option>
                ))}
              </select>
            )}
            {canManage && activeVersion && activeVersion.status !== 'published' && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white text-xs font-medium rounded-md hover:bg-emerald-800 whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            )}
            {canManage && activeVersion && (
              <button
                type="button"
                onClick={handleDeleteVersion}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* 7-Mode Print Controls with School Branding */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Print-Ready Timetables</span> · Includes{' '}
            {displaySchoolName} crest &amp; school details with break and lunch bands.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value as PrintMode)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
            >
              <option value="individual_stream">1. Individual Stream Timetable</option>
              <option value="individual_teacher">2. Individual Teacher Timetable</option>
              <option value="individual_grade">3. Individual Grade Timetable</option>
              <option value="all_teachers">4. All Teacher Timetables</option>
              <option value="all_streams">5. All Stream Timetables</option>
              <option value="entire_category">6. Entire Category Timetable</option>
              <option value="school_master">7. School Master Timetable</option>
            </select>
            <button
              type="button"
              disabled={entries.length === 0}
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Timetable
            </button>
          </div>
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
            className="text-xs font-medium underline ml-4 whitespace-nowrap shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Validation & Zero-Collision Compliance Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <span>Zero-Collision &amp; Completeness Verification</span>
          </div>
          <div className="text-xs font-medium">
            {audit.teacherCollisions.length === 0 &&
            audit.facilityOverflows.length === 0 &&
            audit.studentGroupConflicts.length === 0 &&
            entries.length > 0 ? (
              <span className="text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Zero teacher collisions · Zero facility overflows
              </span>
            ) : (
              <span className="text-amber-700 inline-flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {entries.length === 0 ? 'Generate a timetable to run audit' : 'Review validation notices'}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="border border-slate-200 rounded-md p-2.5">
            <div className="text-xs text-slate-500">Teacher Collisions</div>
            <div
              className={`text-lg font-semibold font-mono tabular-nums ${
                audit.teacherCollisions.length === 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {audit.teacherCollisions.length}
            </div>
          </div>
          <div className="border border-slate-200 rounded-md p-2.5">
            <div className="text-xs text-slate-500">Shared Facility Overflows</div>
            <div
              className={`text-lg font-semibold font-mono tabular-nums ${
                audit.facilityOverflows.length === 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {audit.facilityOverflows.length}
            </div>
          </div>
          <div className="border border-slate-200 rounded-md p-2.5">
            <div className="text-xs text-slate-500">Remedial Group Conflicts</div>
            <div
              className={`text-lg font-semibold font-mono tabular-nums ${
                audit.studentGroupConflicts.length === 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {audit.studentGroupConflicts.length}
            </div>
          </div>
          <div className="border border-slate-200 rounded-md p-2.5">
            <div className="text-xs text-slate-500">Scheduled Lessons</div>
            <div className="text-lg font-semibold font-mono tabular-nums text-slate-900">
              {entries.length}
            </div>
          </div>
        </div>

        {unplacedTasks.length > 0 && (
          <div className="border-t border-slate-100 pt-2.5 space-y-1 text-xs text-red-700">
            {unplacedTasks.map((u, idx) => (
              <div key={idx}>
                <span className="font-semibold">[UNPLACED]</span> Grade {u.grade} {u.stream} ·{' '}
                {u.subjectName}: {u.reason}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5 Required Timetable Views */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'stream', label: 'Individual Stream' },
                { id: 'teacher', label: 'Teacher Timetable' },
                { id: 'grade', label: 'Whole Grade' },
                { id: 'category', label: 'Whole Category' },
                { id: 'master', label: 'School Master' },
              ] as Array<{ id: ViewPerspective; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPerspective(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap shrink-0 ${
                  perspective === tab.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {perspective === 'stream' && (
              <select
                value={selectedStreamKey}
                onChange={(e) => setSelectedStreamKey(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
              >
                {streams.map((st) => (
                  <option key={`${st.grade}::${st.stream}`} value={`${st.grade}::${st.stream}`}>
                    Grade {st.grade} · {st.stream}
                  </option>
                ))}
              </select>
            )}
            {perspective === 'teacher' && (
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            {perspective === 'grade' && (
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
              >
                {gradesAvailable.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            )}
            {perspective === 'category' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as TimetableCategoryId)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
            {perspective === 'master' && (
              <select
                value={selectedMasterDay}
                onChange={(e) => setSelectedMasterDay(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
              >
                {weekdays.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Active View Content */}
        {entries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-800">No Timetable Generated Yet</div>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Enter weekly lesson counts in the Subject Allocations tab, save, and click Generate.
            </p>
          </div>
        ) : perspective === 'stream' && activeStreamObj ? (
          <TimetableMatrixGrid
            title={`Grade ${activeStreamObj.grade} · ${activeStreamObj.stream} Timetable`}
            subtitle={`${categories.find((c) => c.id === activeStreamObj.categoryId)?.label || ''} · Hover any lesson cell to move or reassign with collision check`}
            days={scheduleConfigs[activeStreamObj.categoryId]?.days || weekdays}
            periods={scheduleConfigs[activeStreamObj.categoryId]?.periods || unifiedPeriods}
            entries={entries.filter(
              (e) => e.grade === activeStreamObj.grade && e.stream === activeStreamObj.stream
            )}
            mode="stream"
            canEdit={canManage}
            onEditEntry={openEditModal}
          />
        ) : perspective === 'teacher' ? (
          <TimetableMatrixGrid
            title={`Teacher Timetable: ${teachers.find((t) => t.id === selectedTeacherId)?.name || 'Selected Teacher'}`}
            subtitle="All assigned subjects & activities across Grades 1–9 (zero overlap guaranteed)"
            days={weekdays}
            periods={unifiedPeriods}
            entries={entries.filter((e) => e.teacherId === selectedTeacherId)}
            mode="teacher"
            canEdit={canManage}
            onEditEntry={openEditModal}
          />
        ) : perspective === 'grade' ? (
          <div className="space-y-4">
            {streams
              .filter((s) => s.grade === selectedGrade)
              .map((st) => (
                <TimetableMatrixGrid
                  key={`${st.grade}::${st.stream}`}
                  title={`Grade ${st.grade} · ${st.stream}`}
                  subtitle={categories.find((c) => c.id === st.categoryId)?.label || ''}
                  days={scheduleConfigs[st.categoryId]?.days || weekdays}
                  periods={scheduleConfigs[st.categoryId]?.periods || unifiedPeriods}
                  entries={entries.filter((e) => e.grade === st.grade && e.stream === st.stream)}
                  mode="stream"
                  compact
                  canEdit={canManage}
                  onEditEntry={openEditModal}
                />
              ))}
          </div>
        ) : perspective === 'category' ? (
          <div className="space-y-4">
            {streams
              .filter((s) => s.categoryId === selectedCategory)
              .map((st) => (
                <TimetableMatrixGrid
                  key={`${st.grade}::${st.stream}`}
                  title={`Grade ${st.grade} · ${st.stream}`}
                  subtitle={categories.find((c) => c.id === st.categoryId)?.label || ''}
                  days={scheduleConfigs[st.categoryId]?.days || weekdays}
                  periods={scheduleConfigs[st.categoryId]?.periods || unifiedPeriods}
                  entries={entries.filter((e) => e.grade === st.grade && e.stream === st.stream)}
                  mode="stream"
                  compact
                  canEdit={canManage}
                  onEditEntry={openEditModal}
                />
              ))}
          </div>
        ) : (
          <SchoolMasterMatrix
            day={selectedMasterDay}
            streams={streams}
            entries={entries}
            periods={unifiedPeriods}
          />
        )}
      </div>

      {/* Teacher Workload Summary */}
      {entries.length > 0 && audit.teacherWorkloads.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold text-slate-900">
            Teacher Workload Summary
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <th className="py-2 px-3">Teacher</th>
                  <th className="py-2 px-2 text-right">Core</th>
                  <th className="py-2 px-2 text-right">Common</th>
                  <th className="py-2 px-2 text-right">Clubs/Mkt</th>
                  <th className="py-2 px-2 text-right">Remedial</th>
                  <th className="py-2 px-3 text-right">Total / Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {audit.teacherWorkloads.map((tw) => (
                  <tr key={tw.teacherId} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-medium text-slate-900">{tw.teacherName}</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums">{tw.corePeriods}</td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums">
                      {tw.commonActivityPeriods}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums">
                      {tw.clubsAndMaktabaPeriods}
                    </td>
                    <td className="py-2 px-2 text-right font-mono tabular-nums">
                      {tw.remedialPeriods}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono font-semibold tabular-nums ${
                        tw.isOverloaded ? 'text-red-600' : 'text-slate-900'
                      }`}
                    >
                      {tw.scheduledTotal} / {tw.maxWeeklyPeriods} ({tw.utilizationPct}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Timetable Cell Edit Modal (Strict Zero-Collision Validation) */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Move or Reassign Lesson
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingEntry.subjectName} · Grade {editingEntry.grade} {editingEntry.stream}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {editError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Day of Week</label>
                <select
                  value={editDay}
                  onChange={(e) => setEditDay(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-900"
                >
                  {weekdays.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Lesson Period</label>
                <select
                  value={editPeriod}
                  onChange={(e) => setEditPeriod(Number(e.target.value))}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-900"
                >
                  {(scheduleConfigs[editingEntry.categoryId]?.periods || unifiedPeriods)
                    .filter((p) => p.slotType === 'regular' || p.slotType === 'remedial')
                    .map((p) => (
                      <option key={p.periodNumber} value={p.periodNumber}>
                        {p.label} ({p.startTime}–{p.endTime})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Teacher</label>
                <select
                  value={editTeacherId}
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-900"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Shared Facility (optional)
                </label>
                <select
                  value={editFacilityId}
                  onChange={(e) => setEditFacilityId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-900"
                >
                  <option value="">Standard Classroom</option>
                  {facilities
                    .filter((f) => f.isActive)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editSaving}
                onClick={handleSaveManualEdit}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {editSaving ? 'Validating...' : 'Validate & Save Move'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-Ready Portal with School Logo, School Details & Break/Lunch Bands */}
      {printSheets &&
        printSheets.length > 0 &&
        createPortal(
          <div className="printable-credential-portal hidden print:block bg-white text-slate-900">
            {printSheets.map((sheet, idx) => (
              <div key={idx} className="printable-school-section p-4">
                <SchoolPrintHeader
                  school={school}
                  fallbackSchoolName={schoolName}
                  sheetTitle={sheet.title}
                  sheetSubtitle={sheet.subtitle}
                />
                {sheet.isMaster && sheet.masterStreams ? (
                  <SchoolMasterMatrix
                    day={sheet.days[0]}
                    streams={sheet.masterStreams}
                    entries={sheet.entries}
                    periods={sheet.periods}
                  />
                ) : (
                  <TimetableMatrixGrid
                    title={sheet.title}
                    subtitle={sheet.subtitle}
                    days={sheet.days}
                    periods={sheet.periods}
                    entries={sheet.entries}
                    mode={sheet.mode}
                    compact
                    hideHeader
                  />
                )}
                {school?.printFooterNotes && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 text-center">
                    {school.printFooterNotes}
                  </div>
                )}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};
