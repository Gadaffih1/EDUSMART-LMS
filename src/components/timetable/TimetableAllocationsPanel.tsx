import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertTriangle, CheckCircle2, Copy, Layers, Plus, RotateCcw, Save, Trash2, Upload, Users } from 'lucide-react';
import {
  ROOM_TYPE_LABELS,
  TTClassroomItem,
  TTGradeAllocationItem,
  TTGradeSchedule,
  TTJointLessonItem,
  TTStreamAllocationItem,
  TTStudentGroupItem,
  TTSubjectItem,
  TTTeacherProfileItem,
  ttApiFetch,
} from './timetableTypes';

interface TimetableAllocationsPanelProps {
  gradeSchedules: TTGradeSchedule[];
  subjects: TTSubjectItem[];
  classrooms: TTClassroomItem[];
  studentGroups: TTStudentGroupItem[];
  teachers: TTTeacherProfileItem[];
  gradeAllocations: TTGradeAllocationItem[];
  streamAllocations: TTStreamAllocationItem[];
  jointLessons: TTJointLessonItem[];
  allocationIssues: Array<{ grade: number; stream: string; subject: string; message: string }>;
  streamLoadSummary: Array<{
    grade: number;
    stream: string;
    requiredPeriods: number;
    availablePeriods: number;
    deficitOrExcess: number;
  }>;
  onRefresh: () => Promise<void>;
}

const GRADE_BANDS = [
  { label: 'Grades 1-3', subtitle: 'Lower Primary', min: 1, max: 3 },
  { label: 'Grades 4-6', subtitle: 'Upper Primary', min: 4, max: 6 },
  { label: 'Grades 7-9', subtitle: 'Junior School', min: 7, max: 9 },
];

export const TimetableAllocationsPanel: React.FC<TimetableAllocationsPanelProps> = ({
  gradeSchedules,
  subjects,
  classrooms,
  studentGroups,
  teachers,
  gradeAllocations,
  streamAllocations,
  jointLessons,
  allocationIssues,
  streamLoadSummary,
  onRefresh,
}) => {
  const grades = useMemo(() => gradeSchedules.map((g) => g.grade).sort((a, b) => a - b), [gradeSchedules]);
  const [selectedGrade, setSelectedGrade] = useState<number>(grades[0] || 4);
  const gradeBandOptions = useMemo(() => {
    const bands = GRADE_BANDS.map((band) => ({
      ...band,
      grades: grades.filter((grade) => grade >= band.min && grade <= band.max),
    })).filter((band) => band.grades.length > 0);
    const otherGrades = grades.filter((grade) => grade < 1 || grade > 9);
    if (otherGrades.length > 0) bands.push({ label: 'Other Grades', subtitle: 'Extended', min: otherGrades[0], max: otherGrades[otherGrades.length - 1], grades: otherGrades });
    return bands;
  }, [grades]);
  const selectedGradeBand = gradeBandOptions.find((band) => band.grades.includes(selectedGrade));
  const [applyEditsToWholeBand, setApplyEditsToWholeBand] = useState<boolean>(true);
  const [subTab, setSubTab] = useState<'grade_template' | 'stream_allocations' | 'groups_joint'>('grade_template');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const gradeStreams = useMemo(() => {
    const names = Array.from(
      new Set(studentGroups.filter((g) => g.grade === selectedGrade).map((g) => g.stream))
    );
    return names.sort();
  }, [studentGroups, selectedGrade]);

  const activeStream = gradeStreams.includes(selectedStream) ? selectedStream : (gradeStreams[0] || '');

  // Split Group Form
  const [newGroupStream, setNewGroupStream] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCount, setNewGroupCount] = useState(20);

  // Joint Lesson Form
  const [jlTitle, setJlTitle] = useState('');
  const [jlSubject, setJlSubject] = useState(subjects[0]?.name || 'Religious Education');
  const [jlSelectedClasses, setJlSelectedClasses] = useState<Array<{ grade: number; stream: string }>>([]);
  const [jlTeacherId, setJlTeacherId] = useState(teachers[0]?.id || '');
  const [jlWeeklyPeriods, setJlWeeklyPeriods] = useState(2);
  const [jlLessonLen, setJlLessonLen] = useState(1);
  const [jlRoomId, setJlRoomId] = useState('');

  // Add Subject to Grade Template Form
  const [addTplSubject, setAddTplSubject] = useState('');
  const [addTplWeekly, setAddTplWeekly] = useState(2);
  const [addTplRoomType, setAddTplRoomType] = useState('general');
  const [addTplTeacherId, setAddTplTeacherId] = useState('');
  const [confirmRemoveGradeAllocId, setConfirmRemoveGradeAllocId] = useState<string | null>(null);
  const [confirmRemoveStreamAllocId, setConfirmRemoveStreamAllocId] = useState<string | null>(null);
  const [copySourceGrade, setCopySourceGrade] = useState<number>(() => (grades.find((g) => g !== selectedGrade) || grades[0] || 4));
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopyFromGrade = async () => {
    if (!copySourceGrade || copySourceGrade === selectedGrade) {
      setStatusMsg({ type: 'err', text: 'Select a different source grade to copy subject allocations from.' });
      return;
    }
    setBusyId('copy-grade');
    setStatusMsg(null);
    try {
      const res = await ttApiFetch<{ ok: boolean; copiedCount: number }>('/api/timetable/allocations/copy-grade', {
        method: 'POST',
        body: JSON.stringify({
          sourceGrade: copySourceGrade,
          targetGrades: activeTargetGrades.filter((g) => g !== copySourceGrade),
          applyToStreams: true,
        }),
      });
      await onRefresh();
      setStatusMsg({
        type: 'ok',
        text: `Copied ${res.copiedCount} subject allocations from Grade ${copySourceGrade} to Grade ${selectedGrade} and synced streams.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Failed to copy grade allocations.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleImportSpreadsheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusyId('import-xlsx');
    setStatusMsg(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const firstSheet = wb.SheetNames[0];
      if (!firstSheet) {
        setStatusMsg({ type: 'err', text: 'Uploaded spreadsheet contains no sheets.' });
        return;
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[firstSheet]);
      if (rows.length === 0) {
        setStatusMsg({ type: 'err', text: 'No allocation rows found. Expected columns: Grade, Subject, Lessons (optional: Doubles, Triples, RoomType, Teacher).' });
        return;
      }
      const res = await ttApiFetch<{ ok: boolean; importedCount: number; errors?: string[] }>(
        '/api/timetable/allocations/import',
        {
          method: 'POST',
          body: JSON.stringify({ rows, applyToStreams: true }),
        }
      );
      await onRefresh();
      setStatusMsg({
        type: res.errors && res.errors.length > 0 && res.importedCount === 0 ? 'err' : 'ok',
        text: `Imported ${res.importedCount} weekly subject allocation(s) from "${file.name}"${res.errors?.length ? ` (${res.errors.length} row(s) skipped)` : ''}.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Failed to import allocations spreadsheet.' });
    } finally {
      setBusyId(null);
    }
  };

  const gradeTemplateRows = useMemo(
    () => gradeAllocations.filter((a) => a.grade === selectedGrade),
    [gradeAllocations, selectedGrade]
  );

  const streamRows = useMemo(
    () => streamAllocations.filter((a) => a.grade === selectedGrade && a.stream === activeStream),
    [streamAllocations, selectedGrade, activeStream]
  );

  const streamGroups = useMemo(
    () => studentGroups.filter((g) => g.grade === selectedGrade && g.stream === activeStream),
    [studentGroups, selectedGrade, activeStream]
  );

  const currentStreamLoad = streamLoadSummary.find(
    (s) => s.grade === selectedGrade && s.stream === activeStream
  );

  const activeTargetGrades = useMemo(() => {
    if (applyEditsToWholeBand && selectedGradeBand && selectedGradeBand.grades.length > 0) {
      return selectedGradeBand.grades;
    }
    return [selectedGrade];
  }, [applyEditsToWholeBand, selectedGradeBand, selectedGrade]);

  const bandSummary = useMemo(() => {
    const activeRows = gradeTemplateRows.filter((r) => r.isActive);
    const totalWeeklyFed = activeRows.reduce((acc, r) => acc + Number(r.requiredWeeklyPeriods || 0), 0);
    const sched = gradeSchedules.find((g) => g.grade === selectedGrade);
    const weeklyCapacity = sched ? sched.periodsPerDay * (sched.workingDays?.length || 5) : 40;
    const bandStreamsCount = studentGroups.filter(
      (g) => g.isWholeClass && activeTargetGrades.includes(g.grade)
    ).length;
    return {
      subjectCount: activeRows.length,
      totalWeeklyFed,
      weeklyCapacity,
      bandStreamsCount,
    };
  }, [gradeTemplateRows, gradeSchedules, selectedGrade, studentGroups, activeTargetGrades]);

  const handleSaveGradeRow = async (row: TTGradeAllocationItem) => {
    setBusyId(row.id);
    setStatusMsg(null);
    try {
      await ttApiFetch('/api/timetable/allocations/grade', {
        method: 'PUT',
        body: JSON.stringify({
          ...row,
          targetGrades: activeTargetGrades,
        }),
      });
      await onRefresh();
      const scopeLabel =
        activeTargetGrades.length > 1 && selectedGradeBand
          ? `${selectedGradeBand.label} (Grades ${activeTargetGrades.join(', ')})`
          : `Grade ${row.grade}`;
      setStatusMsg({
        type: 'ok',
        text: `Saved ${row.subjectName} (${row.requiredWeeklyPeriods} lessons/wk) for ${scopeLabel}.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Failed to save grade allocation.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleAddSubjectToGradeTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjName = addTplSubject.trim();
    if (!subjName) return;
    setBusyId('add-tpl-sub');
    setStatusMsg(null);
    try {
      const periodsCount = Math.max(1, Number(addTplWeekly || 1));
      await ttApiFetch('/api/timetable/allocations/grade', {
        method: 'PUT',
        body: JSON.stringify({
          grade: selectedGrade,
          targetGrades: activeTargetGrades,
          subjectName: subjName,
          requiredWeeklyPeriods: periodsCount,
          singleLessons: periodsCount,
          doubleLessons: 0,
          tripleLessons: 0,
          maxPerDay: 1,
          minSpacingDays: 0,
          requiredRoomType: addTplRoomType,
          teacherIds: addTplTeacherId ? [addTplTeacherId] : [],
          isActive: true,
        }),
      });
      setAddTplSubject('');
      await onRefresh();
      const scopeLabel =
        activeTargetGrades.length > 1 && selectedGradeBand
          ? selectedGradeBand.label
          : `Grade ${selectedGrade}`;
      setStatusMsg({
        type: 'ok',
        text: `Added "${subjName}" (${periodsCount} lessons/wk) to ${scopeLabel}. Click "Apply Template" to sync streams while preserving stream-assigned teachers.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not add subject to grade template.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveGradeRow = async (row: TTGradeAllocationItem) => {
    setBusyId(row.id);
    setStatusMsg(null);
    try {
      const qs =
        activeTargetGrades.length > 1 ? `?bandGrades=${encodeURIComponent(activeTargetGrades.join(','))}` : '';
      await ttApiFetch(`/api/timetable/allocations/grade/${row.id}${qs}`, { method: 'DELETE' });
      setConfirmRemoveGradeAllocId(null);
      await onRefresh();
      const scopeLabel =
        activeTargetGrades.length > 1 && selectedGradeBand ? selectedGradeBand.label : `Grade ${row.grade}`;
      setStatusMsg({ type: 'ok', text: `Removed "${row.subjectName}" from ${scopeLabel} template.` });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not remove subject allocation.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveStreamRow = async (row: TTStreamAllocationItem) => {
    setBusyId(row.id);
    setStatusMsg(null);
    try {
      await ttApiFetch(`/api/timetable/allocations/stream/${row.id}`, { method: 'DELETE' });
      setConfirmRemoveStreamAllocId(null);
      await onRefresh();
      setStatusMsg({ type: 'ok', text: `Removed "${row.subjectName}" from Grade ${row.grade} ${row.stream}.` });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not remove stream subject allocation.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleApplyTemplateToStreams = async (overwriteOverridden: boolean) => {
    setBusyId('apply-tpl');
    setStatusMsg(null);
    try {
      const res = await ttApiFetch<{ ok: boolean; updatedCount: number; gradesSynced?: number[] }>(
        '/api/timetable/allocations/apply-template',
        {
          method: 'POST',
          body: JSON.stringify({
            grade: selectedGrade,
            grades: activeTargetGrades,
            overwriteOverridden,
            overwriteTeachers: false,
          }),
        }
      );
      await onRefresh();
      const scopeLabel =
        activeTargetGrades.length > 1 && selectedGradeBand
          ? `${selectedGradeBand.label} (Grades ${activeTargetGrades.join(', ')})`
          : `Grade ${selectedGrade}`;
      setStatusMsg({
        type: 'ok',
        text: `Applied ${scopeLabel} subject & weekly lesson template across all streams (${res.updatedCount} stream allocations synced; each stream's assigned teacher preserved).`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Template propagation failed.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveStreamRow = async (row: TTStreamAllocationItem, resetToInherited = false) => {
    setBusyId(row.id);
    setStatusMsg(null);
    try {
      await ttApiFetch('/api/timetable/allocations/stream', {
        method: 'PUT',
        body: JSON.stringify({ ...row, resetToInherited }),
      });
      await onRefresh();
      setStatusMsg({
        type: 'ok',
        text: resetToInherited
          ? `Reset Grade ${row.grade} ${row.stream} · ${row.subjectName} back to Grade Template.`
          : `Saved override for Grade ${row.grade} ${row.stream} · ${row.subjectName}.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Failed to save stream allocation.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleAddSplitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStream = newGroupStream || activeStream;
    if (!targetStream || !newGroupName.trim()) return;
    try {
      await ttApiFetch('/api/timetable/groups', {
        method: 'POST',
        body: JSON.stringify({
          grade: selectedGrade,
          stream: targetStream,
          groupName: newGroupName.trim(),
          studentCount: newGroupCount,
          isWholeClass: false,
        }),
      });
      setNewGroupName('');
      await onRefresh();
      setStatusMsg({ type: 'ok', text: `Created student sub-group "${newGroupName.trim()}" in Grade ${selectedGrade} ${targetStream}.` });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not create student group.' });
    }
  };

  const handleCreateJointLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jlSelectedClasses.length < 2 || !jlTitle.trim()) {
      setStatusMsg({ type: 'err', text: 'Select at least 2 participating classes and provide a title.' });
      return;
    }
    try {
      await ttApiFetch('/api/timetable/joint-lessons', {
        method: 'POST',
        body: JSON.stringify({
          title: jlTitle.trim(),
          subjectName: jlSubject,
          participatingClasses: jlSelectedClasses,
          teacherIds: jlTeacherId ? [jlTeacherId] : [],
          weeklyPeriods: jlWeeklyPeriods,
          lessonLength: jlLessonLen,
          roomId: jlRoomId || null,
          requiredRoomType: 'hall',
        }),
      });
      setJlTitle('');
      setJlSelectedClasses([]);
      await onRefresh();
      setStatusMsg({ type: 'ok', text: 'Joint multi-stream lesson saved.' });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err?.message || 'Could not create joint lesson.' });
    }
  };

  // Controlled editable copies per row via state map
  const [gradeEdits, setGradeEdits] = useState<Record<string, TTGradeAllocationItem>>({});
  const [streamEdits, setStreamEdits] = useState<Record<string, TTStreamAllocationItem>>({});

  // Auto-reconcile single/double/triple lesson breakdown whenever weekly lessons are adjusted
  const reconcileBreakdown = (
    required: number,
    doubles: number,
    triples: number
  ): { requiredWeeklyPeriods: number; singleLessons: number; doubleLessons: number; tripleLessons: number } => {
    const req = Math.max(1, Math.min(15, Math.floor(Number(required || 1))));
    let tr = Math.max(0, Math.min(4, Math.floor(Number(triples || 0))));
    while (tr * 3 > req && tr > 0) tr--;
    let db = Math.max(0, Math.min(6, Math.floor(Number(doubles || 0))));
    while (tr * 3 + db * 2 > req && db > 0) db--;
    const sg = Math.max(0, req - tr * 3 - db * 2);
    return {
      requiredWeeklyPeriods: req,
      singleLessons: sg,
      doubleLessons: db,
      tripleLessons: tr,
    };
  };

  const getG = (row: TTGradeAllocationItem) => gradeEdits[row.id] || row;
  const setG = (id: string, base: TTGradeAllocationItem, patch: Partial<TTGradeAllocationItem>) => {
    setGradeEdits((prev) => {
      const current = prev[id] || base;
      const merged = { ...current, ...patch };
      if (
        patch.requiredWeeklyPeriods !== undefined ||
        patch.doubleLessons !== undefined ||
        patch.tripleLessons !== undefined
      ) {
        const balanced = reconcileBreakdown(
          merged.requiredWeeklyPeriods,
          merged.doubleLessons,
          merged.tripleLessons
        );
        return { ...prev, [id]: { ...merged, ...balanced } };
      }
      return { ...prev, [id]: merged };
    });
  };

  const getS = (row: TTStreamAllocationItem) => streamEdits[row.id] || row;
  const setS = (id: string, base: TTStreamAllocationItem, patch: Partial<TTStreamAllocationItem>) => {
    setStreamEdits((prev) => {
      const current = prev[id] || base;
      const merged = { ...current, ...patch };
      if (
        patch.requiredWeeklyPeriods !== undefined ||
        patch.doubleLessons !== undefined ||
        patch.tripleLessons !== undefined
      ) {
        const balanced = reconcileBreakdown(
          merged.requiredWeeklyPeriods,
          merged.doubleLessons,
          merged.tripleLessons
        );
        return { ...prev, [id]: { ...merged, ...balanced } };
      }
      return { ...prev, [id]: merged };
    });
  };

  const wholeClassOptions = useMemo(
    () =>
      studentGroups
        .filter((g) => g.isWholeClass)
        .map((g) => ({ grade: g.grade, stream: g.stream, count: g.studentCount })),
    [studentGroups]
  );

  return (
    <div className="space-y-5">
      {statusMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {statusMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Strict Allocation & Adjustable Weekly Lessons Policy */}
      <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-950">Strict Weekly Lesson Adherence Active: </span>
            <span>
              Timetable production schedules lessons strictly for the grades, streams, and subjects allocated below, matching each subject&apos;s exact weekly lesson count. Adjust lessons per week anytime using the <strong className="font-mono">- / +</strong> controls and save.
            </span>
          </div>
        </div>
      </div>

      {/* Consistency Warnings Banner */}
      {allocationIssues.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-xs text-amber-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{allocationIssues.length} Allocation Consistency Warning(s)</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
            {allocationIssues.slice(0, 5).map((iss, idx) => (
              <li key={idx}>
                Grade {iss.grade} {iss.stream} · {iss.subject}: {iss.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {gradeBandOptions.map((band) => (
              <button
                key={band.label}
                type="button"
                onClick={() => setSelectedGrade(band.grades[0])}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                  selectedGradeBand?.label === band.label
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {band.label}
              </button>
            ))}
          </div>
          <label className="text-xs font-semibold text-slate-600">Grade Level:</label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white"
          >
            {(selectedGradeBand?.grades || grades).map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setSubTab('grade_template')}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                subTab === 'grade_template' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Grade Template
            </button>
            <button
              type="button"
              onClick={() => setSubTab('stream_allocations')}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                subTab === 'stream_allocations' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Stream Inherit / Override
            </button>
            <button
              type="button"
              onClick={() => setSubTab('groups_joint')}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                subTab === 'groups_joint' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Student Groups &amp; Joint Lessons
            </button>
          </div>
        </div>

        {subTab === 'grade_template' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy From Another Grade */}
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-500">Copy from:</span>
              <select
                value={copySourceGrade}
                onChange={(e) => setCopySourceGrade(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold"
              >
                {grades.filter((g) => g !== selectedGrade).map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={busyId === 'copy-grade'}
                onClick={handleCopyFromGrade}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold cursor-pointer"
              >
                {busyId === 'copy-grade' ? '...' : 'Copy'}
              </button>
            </div>

            {/* Bulk Import CSV / Excel */}
            <input
              ref={importFileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportSpreadsheet}
              className="hidden"
            />
            <button
              type="button"
              disabled={busyId === 'import-xlsx'}
              onClick={() => importFileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              title="Import columns: Grade, Subject, Lessons, Doubles, Triples, RoomType, Teacher"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>{busyId === 'import-xlsx' ? 'Importing...' : 'Import CSV / Excel'}</span>
            </button>

            {selectedGradeBand && selectedGradeBand.grades.length > 1 && (
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyEditsToWholeBand}
                  onChange={(e) => setApplyEditsToWholeBand(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Sync across all of {selectedGradeBand.label}</span>
              </label>
            )}
            <button
              type="button"
              disabled={busyId === 'apply-tpl'}
              onClick={() => handleApplyTemplateToStreams(false)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>
                {applyEditsToWholeBand && selectedGradeBand && selectedGradeBand.grades.length > 1
                  ? `Apply ${selectedGradeBand.label} Template to All Streams`
                  : `Apply Template to All Grade ${selectedGrade} Streams`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-view 1: Grade Template */}
      {subTab === 'grade_template' && (
        <div className="space-y-3">
          {/* Grade-Band Allocation Summary Strip */}
          <div className="bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 grid grid-cols-1 sm:grid-cols-4 text-xs">
            <div className="p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Active Band Scope</div>
              <div className="font-bold text-slate-900 mt-0.5">
                {selectedGradeBand ? `${selectedGradeBand.label} · ${selectedGradeBand.subtitle}` : `Grade ${selectedGrade}`}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {applyEditsToWholeBand && selectedGradeBand && selectedGradeBand.grades.length > 1
                  ? `Edits feed Grades ${selectedGradeBand.grades.join(', ')}`
                  : `Editing Grade ${selectedGrade} only`}
              </div>
            </div>
            <div className="p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Listed Subjects</div>
              <div className="font-mono tabular-nums font-bold text-base text-slate-900 mt-0.5">
                {bandSummary.subjectCount}
              </div>
              <div className="text-[11px] text-slate-500">Active in band curriculum</div>
            </div>
            <div className="p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Weekly Lessons Fed</div>
              <div
                className={`font-mono tabular-nums font-bold text-base mt-0.5 ${
                  bandSummary.totalWeeklyFed > bandSummary.weeklyCapacity ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {bandSummary.totalWeeklyFed} / {bandSummary.weeklyCapacity} periods
              </div>
              <div className="text-[11px] text-slate-500">Teaching slots (breaks &amp; lunch excluded)</div>
            </div>
            <div className="p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Shared Resources &amp; Streams</div>
              <div className="font-mono tabular-nums font-bold text-base text-slate-900 mt-0.5">
                {bandSummary.bandStreamsCount} streams
              </div>
              <div className="text-[11px] text-slate-500">
                Locked lessons, breaks &amp; rooms reserved collision-free
              </div>
            </div>
          </div>
          {/* Add Subject to Grade Template Bar */}
          <form
            onSubmit={handleAddSubjectToGradeTemplate}
            className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-6 gap-2 items-center text-xs"
          >
            <select
              value={addTplSubject}
              onChange={(e) => {
                const val = e.target.value;
                setAddTplSubject(val);
                const meta = subjects.find((s) => s.name === val);
                if (meta?.requiresRoomType) setAddTplRoomType(meta.requiresRoomType);
                if (val.toLowerCase().includes('library')) {
                  setAddTplWeekly(1);
                  setAddTplRoomType('library');
                }
              }}
              required
              className="sm:col-span-2 px-2.5 py-2 border border-slate-200 rounded-lg bg-white font-semibold"
            >
              <option value="">+ Add Subject to Grade {selectedGrade} Template...</option>
              {subjects
                .filter((s) => !gradeTemplateRows.some((r) => r.subjectName.toLowerCase() === s.name.toLowerCase()))
                .map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.department})
                  </option>
                ))}
            </select>
            <input
              type="number"
              min={1}
              max={15}
              value={addTplWeekly}
              onChange={(e) => setAddTplWeekly(Math.max(1, Number(e.target.value || 1)))}
              title="Weekly Periods"
              placeholder="Periods/wk"
              className="px-2.5 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
            />
            <select
              value={addTplRoomType}
              onChange={(e) => setAddTplRoomType(e.target.value)}
              className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
            >
              {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={addTplTeacherId}
              onChange={(e) => setAddTplTeacherId(e.target.value)}
              className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="">-- Default Teacher --</option>
              {teachers.filter((t) => t.activeInTimetable).map((t) => (
                <option key={t.id} value={t.id}>{t.teacherName}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!addTplSubject || busyId === 'add-tpl-sub'}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3">Subject</th>
                  <th className="p-3">Weekly Target</th>
                  <th className="p-3">Singles (1p)</th>
                  <th className="p-3">Doubles (2p)</th>
                  <th className="p-3">Triples (3p)</th>
                  <th className="p-3">Max / Day</th>
                  <th className="p-3">Min Spacing (d)</th>
                  <th className="p-3">Room Type</th>
                  <th className="p-3">Default Teacher</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gradeTemplateRows.map((orig) => {
                  const row = getG(orig);
                  const sessionSum = row.singleLessons + row.doubleLessons * 2 + row.tripleLessons * 3;
                  const mismatch = sessionSum !== row.requiredWeeklyPeriods;
                  return (
                    <tr key={row.id} className={mismatch ? 'bg-amber-50/60' : 'hover:bg-slate-50/70'}>
                      <td className="p-3 font-semibold text-slate-900">
                        {row.subjectName}
                        {mismatch && (
                          <div className="text-[11px] text-amber-700 font-normal">
                            Breakdown sums to {sessionSum} vs {row.requiredWeeklyPeriods}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setG(row.id, orig, { requiredWeeklyPeriods: Math.max(1, row.requiredWeeklyPeriods - 1) })}
                            className="w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                            title="Decrease weekly lessons"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={15}
                            value={row.requiredWeeklyPeriods}
                            onChange={(e) => setG(row.id, orig, { requiredWeeklyPeriods: Math.max(1, Number(e.target.value || 1)) })}
                            className="w-12 px-1.5 py-1 border border-slate-200 rounded font-mono tabular-nums text-center font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setG(row.id, orig, { requiredWeeklyPeriods: Math.min(15, row.requiredWeeklyPeriods + 1) })}
                            className="w-6 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                            title="Increase weekly lessons"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          max={12}
                          value={row.singleLessons}
                          onChange={(e) => setG(row.id, orig, { singleLessons: Number(e.target.value || 0) })}
                          className="w-14 px-2 py-1 border border-slate-200 rounded font-mono tabular-nums"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          max={6}
                          value={row.doubleLessons}
                          onChange={(e) => setG(row.id, orig, { doubleLessons: Number(e.target.value || 0) })}
                          className="w-14 px-2 py-1 border border-slate-200 rounded font-mono tabular-nums"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          max={4}
                          value={row.tripleLessons}
                          onChange={(e) => setG(row.id, orig, { tripleLessons: Number(e.target.value || 0) })}
                          className="w-14 px-2 py-1 border border-slate-200 rounded font-mono tabular-nums"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={1}
                          max={4}
                          value={row.maxPerDay}
                          onChange={(e) => setG(row.id, orig, { maxPerDay: Number(e.target.value || 1) })}
                          className="w-14 px-2 py-1 border border-slate-200 rounded font-mono tabular-nums"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          max={4}
                          value={row.minSpacingDays}
                          onChange={(e) => setG(row.id, orig, { minSpacingDays: Number(e.target.value || 0) })}
                          className="w-14 px-2 py-1 border border-slate-200 rounded font-mono tabular-nums"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={row.requiredRoomType}
                          onChange={(e) => setG(row.id, orig, { requiredRoomType: e.target.value })}
                          className="px-2 py-1 border border-slate-200 rounded bg-white"
                        >
                          {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={row.teacherIds[0] || ''}
                          onChange={(e) => setG(row.id, orig, { teacherIds: e.target.value ? [e.target.value] : [] })}
                          className="w-40 px-2 py-1 border border-slate-200 rounded bg-white"
                        >
                          <option value="">-- Unassigned --</option>
                          {teachers.filter((t) => t.activeInTimetable).map((t) => (
                            <option key={t.id} value={t.id}>{t.teacherName}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1">
                        {confirmRemoveGradeAllocId === row.id ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === row.id}
                              onClick={() => handleRemoveGradeRow(row)}
                              className="px-2 py-1 bg-rose-600 text-white rounded font-bold cursor-pointer"
                            >
                              Remove
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveGradeAllocId(null)}
                              className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={busyId === row.id || mismatch || row.requiredWeeklyPeriods < 1}
                              onClick={() => handleSaveGradeRow(row)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded font-semibold cursor-pointer inline-flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveGradeAllocId(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer align-middle"
                              title={`Remove ${row.subjectName} from Grade ${row.grade}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* Sub-view 2: Stream Inherit & Override */}
      {subTab === 'stream_allocations' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Select Stream:</span>
              <div className="flex flex-wrap gap-1.5">
                {gradeStreams.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStream(st)}
                    className={`px-3 py-1 rounded-lg font-semibold border cursor-pointer ${
                      activeStream === st
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {currentStreamLoad && (
              <div className="flex items-center gap-3 font-mono tabular-nums">
                <span className="text-slate-600">
                  Required: <strong className="text-slate-900">{currentStreamLoad.requiredPeriods}p</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600">
                  Available: <strong className="text-slate-900">{currentStreamLoad.availablePeriods}p</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={`font-bold ${
                    currentStreamLoad.deficitOrExcess < 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {currentStreamLoad.deficitOrExcess < 0
                    ? `Shortfall ${Math.abs(currentStreamLoad.deficitOrExcess)}p`
                    : `${currentStreamLoad.deficitOrExcess}p free/buffer`}
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-[11px] text-slate-600 flex items-center justify-between gap-2">
            <span>
              <strong className="text-slate-900">Single-Teacher Rule:</strong> Each subject in a specific stream can have at most one assigned teacher. Saving updates Faculty Workload &amp; Academic Hierarchy automatically.
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3">Subject</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Group</th>
                    <th className="p-3">Weekly / Split (1p·2p·3p)</th>
                    <th className="p-3">Assigned Teacher</th>
                    <th className="p-3">Preferred Room</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {streamRows.map((orig) => {
                    const row = getS(orig);
                    const sum = row.singleLessons + row.doubleLessons * 2 + row.tripleLessons * 3;
                    return (
                      <tr key={row.id} className={row.isOverridden ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'}>
                        <td className="p-3 font-semibold text-slate-900">{row.subjectName}</td>
                        <td className="p-3 text-xs font-medium">
                          {row.isOverridden ? (
                            <span className="text-blue-700 font-semibold">Overridden</span>
                          ) : (
                            <span className="text-slate-500">Inherited</span>
                          )}
                        </td>
                        <td className="p-3">
                          <select
                            value={row.groupId || ''}
                            onChange={(e) => setS(row.id, orig, { groupId: e.target.value || null })}
                            className="px-2 py-1 border border-slate-200 rounded bg-white"
                          >
                            {streamGroups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.groupName} ({g.studentCount})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 font-mono tabular-nums">
                            <button
                              type="button"
                              onClick={() => setS(row.id, orig, { requiredWeeklyPeriods: Math.max(1, row.requiredWeeklyPeriods - 1) })}
                              className="w-5 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                              title="Decrease weekly lessons"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={row.requiredWeeklyPeriods}
                              onChange={(e) => setS(row.id, orig, { requiredWeeklyPeriods: Math.max(1, Number(e.target.value || 1)) })}
                              className="w-11 px-1 py-1 border border-slate-200 rounded text-center font-bold"
                              title="Total Weekly Periods (strictly enforced)"
                            />
                            <button
                              type="button"
                              onClick={() => setS(row.id, orig, { requiredWeeklyPeriods: Math.min(15, row.requiredWeeklyPeriods + 1) })}
                              className="w-5 h-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                              title="Increase weekly lessons"
                            >
                              +
                            </button>
                            <span>=</span>
                            <input
                              type="number"
                              min={0}
                              max={12}
                              value={row.singleLessons}
                              onChange={(e) => setS(row.id, orig, { singleLessons: Number(e.target.value || 0) })}
                              className="w-11 px-1.5 py-1 border border-slate-200 rounded"
                              title="Single lessons"
                            />
                            <input
                              type="number"
                              min={0}
                              max={6}
                              value={row.doubleLessons}
                              onChange={(e) => setS(row.id, orig, { doubleLessons: Number(e.target.value || 0) })}
                              className="w-11 px-1.5 py-1 border border-slate-200 rounded"
                              title="Double lessons"
                            />
                            <input
                              type="number"
                              min={0}
                              max={4}
                              value={row.tripleLessons}
                              onChange={(e) => setS(row.id, orig, { tripleLessons: Number(e.target.value || 0) })}
                              className="w-11 px-1.5 py-1 border border-slate-200 rounded"
                              title="Triple lessons"
                            />
                            {sum !== row.requiredWeeklyPeriods && (
                              <span className="text-rose-600 font-bold">(!)</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <select
                            value={row.teacherIds[0] || ''}
                            onChange={(e) => {
                              setS(row.id, orig, { teacherIds: e.target.value ? [e.target.value] : [] });
                            }}
                            className="w-44 px-2 py-1 border border-slate-200 rounded bg-white"
                          >
                            <option value="">-- Unassigned --</option>
                            {teachers.filter((t) => t.activeInTimetable).map((t) => (
                              <option key={t.id} value={t.id}>{t.teacherName}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={row.roomId || ''}
                            onChange={(e) => setS(row.id, orig, { roomId: e.target.value || null })}
                            className="w-36 px-2 py-1 border border-slate-200 rounded bg-white"
                          >
                            <option value="">Auto ({row.requiredRoomType})</option>
                            {classrooms.map((r) => (
                              <option key={r.id} value={r.id}>{r.name} ({r.capacity})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {confirmRemoveStreamAllocId === row.id ? (
                            <>
                              <button
                                type="button"
                                disabled={busyId === row.id}
                                onClick={() => handleRemoveStreamRow(row)}
                                className="px-2 py-1 bg-rose-600 text-white rounded font-bold cursor-pointer"
                              >
                                Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveStreamAllocId(null)}
                                className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {row.isOverridden && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveStreamRow(row, true)}
                                  className="px-2 py-1 border border-slate-200 hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                                  title="Reset to Inherited Template"
                                >
                                  <RotateCcw className="w-3 h-3 inline" />
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={busyId === row.id || sum !== row.requiredWeeklyPeriods || row.requiredWeeklyPeriods < 1}
                                onClick={() => handleSaveStreamRow(row, false)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded font-semibold cursor-pointer inline-flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveStreamAllocId(row.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer align-middle"
                                title={`Remove ${row.subjectName} from ${row.stream}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view 3: Student Groups & Joint Lessons */}
      {subTab === 'groups_joint' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Student Split Groups */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span>Split Student Groups (Grade {selectedGrade})</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Sub-groups inside the same stream can take parallel practicals/options without colliding with each other, while preventing same-group overlaps.
              </p>
            </div>

            <form onSubmit={handleAddSplitGroup} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <select
                value={newGroupStream || activeStream}
                onChange={(e) => setNewGroupStream(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded bg-white"
              >
                {gradeStreams.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Group Name (e.g. Set A)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
                className="px-2.5 py-1.5 border border-slate-200 rounded bg-white"
              />
              <input
                type="number"
                min={1}
                max={80}
                value={newGroupCount}
                onChange={(e) => setNewGroupCount(Number(e.target.value || 20))}
                className="px-2.5 py-1.5 border border-slate-200 rounded bg-white font-mono tabular-nums"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto text-xs">
              {studentGroups
                .filter((g) => g.grade === selectedGrade)
                .map((g) => (
                  <div key={g.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">Grade {g.grade} {g.stream}</span>
                      <span className="mx-2 text-slate-400">·</span>
                      <span className="text-slate-700">{g.groupName}</span>
                      <span className="ml-2 font-mono text-slate-500 tabular-nums">({g.studentCount} learners)</span>
                    </div>
                    {!g.isWholeClass && (
                      <button
                        type="button"
                        onClick={() => ttApiFetch(`/api/timetable/groups/${g.id}`, { method: 'DELETE' }).then(onRefresh)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        aria-label="Delete group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Joint Multi-Stream Lessons */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Joint Multi-Stream Lessons</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Schedule multiple streams together in one synchronized event and validate combined student count against hall capacity.
              </p>
            </div>

            <form onSubmit={handleCreateJointLesson} className="space-y-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Title (e.g. Grade 7 PPI / CRE Joint)"
                  value={jlTitle}
                  onChange={(e) => setJlTitle(e.target.value)}
                  required
                  className="px-2.5 py-2 border border-slate-200 rounded bg-white"
                />
                <select
                  value={jlSubject}
                  onChange={(e) => setJlSubject(e.target.value)}
                  className="px-2.5 py-2 border border-slate-200 rounded bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="font-semibold text-slate-600 mb-1">Participating Classes (Pick 2+):</div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {wholeClassOptions
                    .filter((c) => c.grade === selectedGrade)
                    .map((c) => {
                      const active = jlSelectedClasses.some((x) => x.grade === c.grade && x.stream === c.stream);
                      return (
                        <button
                          key={`${c.grade}-${c.stream}`}
                          type="button"
                          onClick={() =>
                            setJlSelectedClasses((prev) =>
                              active
                                ? prev.filter((x) => !(x.grade === c.grade && x.stream === c.stream))
                                : [...prev, { grade: c.grade, stream: c.stream }]
                            )
                          }
                          className={`px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer ${
                            active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          G{c.grade} {c.stream} ({c.count})
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={jlTeacherId}
                  onChange={(e) => setJlTeacherId(e.target.value)}
                  className="sm:col-span-2 px-2 py-1.5 border border-slate-200 rounded bg-white"
                >
                  <option value="">-- Lead Teacher --</option>
                  {teachers.filter((t) => t.activeInTimetable).map((t) => (
                    <option key={t.id} value={t.id}>{t.teacherName}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={jlWeeklyPeriods}
                  onChange={(e) => setJlWeeklyPeriods(Number(e.target.value || 1))}
                  className="px-2 py-1.5 border border-slate-200 rounded bg-white font-mono tabular-nums"
                  title="Weekly Periods"
                />
                <select
                  value={jlLessonLen}
                  onChange={(e) => setJlLessonLen(Number(e.target.value || 1))}
                  className="px-2 py-1.5 border border-slate-200 rounded bg-white"
                >
                  <option value={1}>Single (1p)</option>
                  <option value={2}>Double (2p)</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2">
                <select
                  value={jlRoomId}
                  onChange={(e) => setJlRoomId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded bg-white"
                >
                  <option value="">Auto Select Hall / Large Venue</option>
                  {classrooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.capacity} seats)</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded cursor-pointer"
                >
                  Create Joint Lesson
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-100 text-xs">
              {jointLessons.length === 0 ? (
                <div className="py-4 text-center text-slate-500">No joint multi-stream lessons configured yet.</div>
              ) : (
                jointLessons.map((jl) => (
                  <div key={jl.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">{jl.title} · {jl.subjectName}</div>
                      <div className="text-[11px] text-slate-500">
                        {jl.participatingClasses.map((c) => `G${c.grade} ${c.stream}`).join(' + ')}
                        <span className="mx-1.5">·</span>
                        <span className="font-mono tabular-nums">{jl.combinedStudents} students</span>
                        <span className="mx-1.5">·</span>
                        <span>{jl.weeklyPeriods}p/wk</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => ttApiFetch(`/api/timetable/joint-lessons/${jl.id}`, { method: 'DELETE' }).then(onRefresh)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      aria-label="Delete joint lesson"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
