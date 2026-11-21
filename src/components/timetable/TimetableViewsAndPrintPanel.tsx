import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Play,
  Printer,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  ttApiFetch,
  type DirectoryTeacher,
  type ScheduleConfig,
  type TimetableAuditReport,
  type TimetableCategoryId,
  type TimetableCategoryMeta,
  type TimetableEntry,
  type TimetableFacility,
  type TimetableStream,
  type TimetableVersion,
} from './timetableTypes';

interface Props {
  schoolName: string;
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
  onSelectVersion: (versionId: string) => void;
  onRefresh: (versionId?: string) => Promise<void>;
}

type ViewPerspective = 'stream' | 'grade' | 'category' | 'teacher' | 'facility';
type PrintMode =
  | 'individual_stream'
  | 'individual_teacher'
  | 'bulk_grade'
  | 'bulk_category'
  | 'bulk_all_teachers';

interface PrintableSheet {
  title: string;
  subtitle: string;
  days: string[];
  periods: Array<{ periodNumber: number; label: string; startTime: string; endTime: string }>;
  entries: TimetableEntry[];
  mode: 'stream' | 'teacher';
}

const TimetableMatrixGrid: React.FC<{
  title: string;
  subtitle: string;
  days: string[];
  periods: Array<{ periodNumber: number; label: string; startTime: string; endTime: string }>;
  entries: TimetableEntry[];
  mode: 'stream' | 'teacher' | 'facility';
  compact?: boolean;
}> = ({ title, subtitle, days, periods, entries, mode, compact = false }) => {
  const entriesBySlot = useMemo(() => {
    const map = new Map<string, TimetableEntry[]>();
    for (const e of entries) {
      const key = `${e.dayOfWeek}::${e.periodNumber}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [entries]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-xs font-mono text-slate-500 tabular-nums">
          {entries.length} scheduled session{entries.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[720px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <th className="py-2 px-3 w-32 border-r border-slate-200">Period / Time</th>
              {days.map((day) => (
                <th key={day} className="py-2 px-2.5 border-r border-slate-200 last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {periods.map((slot) => (
              <tr key={slot.periodNumber} className="align-top">
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
                              className={`rounded border p-1.5 ${
                                entry.subjectKind === 'remedial'
                                  ? 'bg-amber-50/80 border-amber-200'
                                  : entry.subjectKind === 'common_activity'
                                    ? 'bg-indigo-50/70 border-indigo-200'
                                    : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="font-semibold text-slate-900 leading-tight">
                                {entry.subjectName}
                              </div>
                              <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                                {mode === 'stream'
                                  ? entry.teacherName
                                  : `Grade ${entry.grade} ${entry.stream}`}
                              </div>
                              {entry.facilityName && mode !== 'facility' && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {entry.facilityName}
                                </div>
                              )}
                              {entry.subjectKind === 'remedial' &&
                                entry.studentGroupMode === 'selected_learners' && (
                                  <div className="text-[10px] font-medium text-amber-800 mt-0.5">
                                    {entry.studentGroupName} ({entry.studentIds.length} learners)
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TimetableViewsAndPrintPanel: React.FC<Props> = ({
  schoolName,
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
  onSelectVersion,
  onRefresh,
}) => {
  const [perspective, setPerspective] = useState<ViewPerspective>('stream');
  const [selectedCategory, setSelectedCategory] = useState<TimetableCategoryId>('cat_1_3');
  const [selectedGrade, setSelectedGrade] = useState<number>(streams[0]?.grade ?? 1);
  const [selectedStreamKey, setSelectedStreamKey] = useState<string>(
    streams[0] ? `${streams[0].grade}::${streams[0].stream}` : ''
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id ?? '');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(facilities[0]?.id ?? '');

  const [termLabel, setTermLabel] = useState('Term 1');
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [unplacedTasks, setUnplacedTasks] = useState<
    Array<{ grade: number; stream: string; subjectName: string; reason: string }>
  >([]);

  // Print portal state (uses createPortal into document.body + window.print)
  const [printMode, setPrintMode] = useState<PrintMode>('individual_stream');
  const [printSheets, setPrintSheets] = useState<PrintableSheet[] | null>(null);

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
    if (!selectedFacilityId && facilities.length > 0) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [facilities, selectedFacilityId]);

  // Trigger native browser print when printSheets mounts, then clean up afterprint
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
    }, 80);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', cleanup);
      document.body.classList.remove('printing-portal-active');
    };
  }, [printSheets]);

  const handleGenerate = async () => {
    if (!canManage) return;
    setGenerating(true);
    setFeedback(null);
    setUnplacedTasks([]);
    try {
      const resp = await ttApiFetch('/api/timetable/generate', {
        method: 'POST',
        body: JSON.stringify({
          termLabel,
          academicYear,
          name: `${termLabel} ${academicYear} Master Timetable`,
        }),
      });
      if (Array.isArray(resp.unplacedTasks) && resp.unplacedTasks.length > 0) {
        setUnplacedTasks(resp.unplacedTasks);
      }
      await onRefresh(resp.version?.id);
      setFeedback({
        type: resp.success ? 'ok' : 'err',
        text: resp.success
          ? `Generated "${resp.version?.name}" with ${resp.entries?.length || 0} conflict-free sessions.`
          : `Generated draft with ${resp.unplacedTasks?.length || 0} unplaced session(s). Review validation details below.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to generate timetable.' });
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!canManage || !activeVersion) return;
    setPublishing(true);
    setFeedback(null);
    try {
      await ttApiFetch(`/api/timetable/versions/${activeVersion.id}/publish`, {
        method: 'POST',
      });
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
      await ttApiFetch(`/api/timetable/versions/${activeVersion.id}`, { method: 'DELETE' });
      await onRefresh();
      setFeedback({ type: 'ok', text: `Deleted timetable version "${activeVersion.name}".` });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to delete version.' });
    }
  };

  // Compute unified period slots across categories (for Teacher / Facility cross-category views)
  const unifiedPeriods = useMemo(() => {
    const byNum = new Map<
      number,
      { periodNumber: number; label: string; startTime: string; endTime: string }
    >();
    for (const cfg of Object.values(scheduleConfigs)) {
      for (const p of cfg.periods) {
        if (!byNum.has(p.periodNumber)) {
          byNum.set(p.periodNumber, {
            periodNumber: p.periodNumber,
            label: p.label,
            startTime: p.startTime,
            endTime: p.endTime,
          });
        }
      }
    }
    return Array.from(byNum.values()).sort((a, b) => a.periodNumber - b.periodNumber);
  }, [scheduleConfigs]);

  const activeStreamObj = useMemo(() => {
    const [gStr, ...rest] = selectedStreamKey.split('::');
    return streams.find((s) => s.grade === Number(gStr) && s.stream === rest.join('::')) || null;
  }, [selectedStreamKey, streams]);

  const gradesAvailable = useMemo(
    () => Array.from(new Set(streams.map((s) => s.grade))).sort((a, b) => a - b),
    [streams]
  );

  // Build printable sheets for Individual or Bulk Printing
  const handlePrint = (overrideMode?: PrintMode) => {
    const mode = overrideMode || printMode;
    const sheets: PrintableSheet[] = [];
    const versionSubtitle = activeVersion
      ? `${activeVersion.name} · ${activeVersion.termLabel} ${activeVersion.academicYear}`
      : 'Master Timetable';

    const buildStreamSheet = (st: TimetableStream): PrintableSheet => {
      const cfg = scheduleConfigs[st.categoryId];
      return {
        title: `${schoolName} — Grade ${st.grade} ${st.stream} Timetable`,
        subtitle: `${categories.find((c) => c.id === st.categoryId)?.label || ''} · ${versionSubtitle}`,
        days: cfg?.days || weekdays,
        periods: cfg?.periods || unifiedPeriods,
        entries: entries.filter((e) => e.grade === st.grade && e.stream === st.stream),
        mode: 'stream',
      };
    };

    const buildTeacherSheet = (tId: string, tName: string): PrintableSheet => ({
      title: `${schoolName} — Teacher Timetable: ${tName}`,
      subtitle: `Individual Teacher Load & Supervision Schedule · ${versionSubtitle}`,
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
    } else if (mode === 'bulk_grade') {
      const gradeStreams = streams.filter((s) => s.grade === selectedGrade);
      gradeStreams.forEach((st) => sheets.push(buildStreamSheet(st)));
    } else if (mode === 'bulk_category') {
      const catStreams = streams.filter((s) => s.categoryId === selectedCategory);
      catStreams.forEach((st) => sheets.push(buildStreamSheet(st)));
    } else if (mode === 'bulk_all_teachers') {
      const activeTeacherIds = Array.from(new Set(entries.map((e) => e.teacherId)));
      activeTeacherIds.forEach((tId) => {
        const name =
          teachers.find((t) => t.id === tId)?.name ||
          entries.find((e) => e.teacherId === tId)?.teacherName ||
          tId;
        sheets.push(buildTeacherSheet(tId, name));
      });
    }

    if (sheets.length === 0) {
      setFeedback({ type: 'err', text: 'No timetable entries available to print for this selection.' });
      return;
    }
    setPrintSheets(sheets);
  };

  return (
    <div className="space-y-5">
      {/* Generation, Version Selector & Print Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <label className="flex items-center gap-1.5 text-slate-600">
              <span>Term</span>
              <input
                type="text"
                value={termLabel}
                onChange={(e) => setTermLabel(e.target.value)}
                disabled={!canManage}
                className="w-24 px-2 py-1.5 border border-slate-300 rounded text-slate-900"
              />
            </label>
            <label className="flex items-center gap-1.5 text-slate-600">
              <span>Year</span>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                disabled={!canManage}
                className="w-20 px-2 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
              />
            </label>
            {canManage && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                {generating ? 'Generating...' : 'Generate Validated Timetable'}
              </button>
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
                {publishing ? 'Publishing...' : 'Publish School-Wide'}
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

        {/* Individual & Bulk Print Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Individual & Bulk Printing</span> ·
            Print single streams, individual teachers, entire grades, full categories, or all
            teacher timetables in one pass.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value as PrintMode)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
            >
              <option value="individual_stream">Individual Stream Timetable</option>
              <option value="individual_teacher">Individual Teacher Timetable</option>
              <option value="bulk_grade">Bulk Print: All Streams in Selected Grade</option>
              <option value="bulk_category">Bulk Print: All Streams in Selected Category</option>
              <option value="bulk_all_teachers">Bulk Print: All Active Teacher Timetables</option>
            </select>
            <button
              type="button"
              disabled={entries.length === 0}
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Selected Scope
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
            className="text-xs font-medium underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Validation & Compliance Audit Summary */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <span>Timetable Validation & Compliance Audit</span>
          </div>
          <div className="text-xs font-medium">
            {audit.isValid ? (
              <span className="text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Zero collisions · Zero unexplained blanks · All streams complete
              </span>
            ) : (
              <span className="text-amber-700 inline-flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Review readiness & compliance checks below
              </span>
            )}
          </div>
        </div>

        {/* 4 Core KPI Compliance Figures */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="border border-slate-200 rounded-md p-3">
            <div className="text-xs text-slate-500">Teacher Collisions</div>
            <div
              className={`text-xl font-semibold font-mono tabular-nums mt-0.5 ${
                audit.teacherCollisions.length === 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {audit.teacherCollisions.length}
            </div>
            <div className="text-[11px] text-slate-500">Zero-teacher-collision rule</div>
          </div>

          <div className="border border-slate-200 rounded-md p-3">
            <div className="text-xs text-slate-500">Facility Overflows</div>
            <div
              className={`text-xl font-semibold font-mono tabular-nums mt-0.5 ${
                audit.facilityOverflows.length === 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {audit.facilityOverflows.length}
            </div>
            <div className="text-[11px] text-slate-500">Shared labs, library & pool</div>
          </div>

          <div className="border border-slate-200 rounded-md p-3">
            <div className="text-xs text-slate-500">Student Group Conflicts</div>
            <div
              className={`text-xl font-semibold font-mono tabular-nums mt-0.5 ${
                audit.studentGroupConflicts.length === 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {audit.studentGroupConflicts.length}
            </div>
            <div className="text-[11px] text-slate-500">Remedial 1 & 2 learner overlap</div>
          </div>

          <div className="border border-slate-200 rounded-md p-3">
            <div className="text-xs text-slate-500">Unexplained Blank Sessions</div>
            <div
              className={`text-xl font-semibold font-mono tabular-nums mt-0.5 ${
                audit.unexplainedBlankSessions.length === 0
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {audit.unexplainedBlankSessions.length}
            </div>
            <div className="text-[11px] text-slate-500">Zero-unexplained-blank rule</div>
          </div>
        </div>

        {/* Readiness Issues / Unplaced Tasks */}
        {(audit.readinessIssues.length > 0 || unplacedTasks.length > 0) && (
          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
            <div className="font-semibold text-slate-800">Actionable Validation Notices</div>
            {audit.readinessIssues.slice(0, 8).map((issue, idx) => (
              <div
                key={`${issue.code}_${idx}`}
                className={
                  issue.severity === 'error' ? 'text-red-700' : 'text-amber-800'
                }
              >
                <span className="font-semibold uppercase mr-1.5">[{issue.severity}]</span>
                {issue.message}
              </div>
            ))}
            {audit.readinessIssues.length > 8 && (
              <div className="text-slate-500">
                +{audit.readinessIssues.length - 8} additional notice(s)
              </div>
            )}
            {unplacedTasks.map((u, idx) => (
              <div key={idx} className="text-red-700">
                <span className="font-semibold">[UNPLACED]</span> Grade {u.grade} {u.stream} ·{' '}
                {u.subjectName}: {u.reason}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Perspective Interactive Timetable Viewer */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'stream', label: 'Stream View' },
                { id: 'grade', label: 'Grade View' },
                { id: 'category', label: 'Category View' },
                { id: 'teacher', label: 'Teacher View' },
                { id: 'facility', label: 'Shared Facilities View' },
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

          {/* Context Filter Selector */}
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
            {perspective === 'facility' && (
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} (Cap: {f.capacityStreams})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Active Timetable Matrix Rendering */}
        {entries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-800">No Timetable Generated Yet</div>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Configure weekly allocations in each category, assign authorized teachers and
              remedial groups, then click Generate Validated Timetable.
            </p>
          </div>
        ) : perspective === 'stream' && activeStreamObj ? (
          <TimetableMatrixGrid
            title={`Grade ${activeStreamObj.grade} · ${activeStreamObj.stream} Timetable`}
            subtitle={`${categories.find((c) => c.id === activeStreamObj.categoryId)?.label || ''} · Includes Core Learning Areas, Common Activities, Clubs, Maktaba, and Remedial 1 & 2`}
            days={scheduleConfigs[activeStreamObj.categoryId]?.days || weekdays}
            periods={scheduleConfigs[activeStreamObj.categoryId]?.periods || unifiedPeriods}
            entries={entries.filter(
              (e) => e.grade === activeStreamObj.grade && e.stream === activeStreamObj.stream
            )}
            mode="stream"
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
                />
              ))}
          </div>
        ) : perspective === 'teacher' ? (
          <TimetableMatrixGrid
            title={`Teacher Timetable: ${teachers.find((t) => t.id === selectedTeacherId)?.name || 'Selected Teacher'}`}
            subtitle="All assigned Core Lessons, ICT/Robotics, Computer Studies, Library, Swimming, Clubs, Maktaba, and Remedial sessions across Categories 1–3"
            days={weekdays}
            periods={unifiedPeriods}
            entries={entries.filter((e) => e.teacherId === selectedTeacherId)}
            mode="teacher"
          />
        ) : (
          <TimetableMatrixGrid
            title={`Shared Facility Schedule: ${facilities.find((f) => f.id === selectedFacilityId)?.name || 'Selected Facility'}`}
            subtitle="Cross-category facility reservations across Grades 1–9"
            days={weekdays}
            periods={unifiedPeriods}
            entries={entries.filter((e) => e.facilityId === selectedFacilityId)}
            mode="facility"
          />
        )}
      </div>

      {/* Teacher Workload & Stream Completeness Audit Tables */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Teacher Workload Breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold text-slate-900">
              Teacher Workload Calculations
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

          {/* Stream Completeness Checks */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold text-slate-900">
              Stream Completeness Checks
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                    <th className="py-2 px-3">Grade & Stream</th>
                    <th className="py-2 px-2 text-right">Regular</th>
                    <th className="py-2 px-2 text-right">Blanks</th>
                    <th className="py-2 px-2 text-right">Remedial</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {audit.streamCompleteness.map((sc) => (
                    <tr key={`${sc.grade}::${sc.stream}`} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-medium text-slate-900">
                        Grade {sc.grade} · {sc.stream}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">
                        {sc.scheduledRegularPeriods}/{sc.expectedRegularPeriods}
                      </td>
                      <td
                        className={`py-2 px-2 text-right font-mono tabular-nums ${
                          sc.unexplainedBlankPeriods > 0 ? 'text-amber-700 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        {sc.unexplainedBlankPeriods}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">
                        {sc.remedialSessionsScheduled}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-medium ${
                          sc.isComplete ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {sc.isComplete ? 'Complete' : 'Incomplete'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Clean Portal-Based Individual & Bulk Print Output (Zero window.open / Zero innerHTML) */}
      {printSheets &&
        printSheets.length > 0 &&
        createPortal(
          <div className="printable-credential-portal hidden print:block bg-white text-slate-900">
            {printSheets.map((sheet, idx) => (
              <div key={idx} className="printable-school-section p-4">
                <div className="mb-3 border-b border-slate-300 pb-2">
                  <div className="text-base font-bold text-slate-900">{sheet.title}</div>
                  <div className="text-xs text-slate-600">{sheet.subtitle}</div>
                </div>
                <TimetableMatrixGrid
                  title={sheet.title}
                  subtitle={sheet.subtitle}
                  days={sheet.days}
                  periods={sheet.periods}
                  entries={sheet.entries}
                  mode={sheet.mode}
                  compact
                />
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};
