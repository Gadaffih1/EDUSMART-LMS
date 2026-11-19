import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Unlock,
  Users,
  XCircle,
  Layers,
  MapPin,
} from 'lucide-react';
import {
  TTEntryItem,
  TTJobItem,
  TTUnscheduledItem,
  TTWorkspacePayload,
  ttApiFetch,
} from './timetableTypes';

interface TimetableDragDropEditorProps {
  workspace: TTWorkspacePayload;
  onRefresh: (versionId?: string) => Promise<void>;
}

type EditorViewMode = 'class' | 'teacher' | 'room' | 'master';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableDragDropEditor: React.FC<TimetableDragDropEditorProps> = ({
  workspace,
  onRefresh,
}) => {
  const { config, periods, classrooms, teachers, streamLoadSummary, activeVersion, versions } = workspace;

  const workingDays = useMemo(() => {
    const days = config?.workingDays?.length ? config.workingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return DAYS_ORDER.filter((d) => days.includes(d));
  }, [config]);

  // Distinct streams available in the school
  const streamOptions = useMemo(() => {
    const set = new Map<string, { grade: number; stream: string }>();
    for (const s of streamLoadSummary) {
      set.set(`${s.grade}|${s.stream}`, { grade: s.grade, stream: s.stream });
    }
    if (activeVersion?.entries) {
      for (const e of activeVersion.entries) {
        set.set(`${e.grade}|${e.stream}`, { grade: e.grade, stream: e.stream });
      }
    }
    return Array.from(set.values()).sort((a, b) => a.grade - b.grade || a.stream.localeCompare(b.stream));
  }, [streamLoadSummary, activeVersion]);

  const [viewMode, setViewMode] = useState<EditorViewMode>('class');
  const [selectedClassKey, setSelectedClassKey] = useState<string>(() =>
    streamOptions[0] ? `${streamOptions[0].grade}|${streamOptions[0].stream}` : '4|Dove'
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => teachers[0]?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => classrooms[0]?.id || '');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [mobileDay, setMobileDay] = useState<string>(() => workingDays[0] || 'Monday');

  // Drag state
  const [draggingBlock, setDraggingBlock] = useState<{ kind: 'entry'; entry: TTEntryItem } | { kind: 'unscheduled'; item: TTUnscheduledItem } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Touch / click fallback for placing unscheduled or moving
  const [placeTargetItem, setPlaceTargetItem] = useState<TTUnscheduledItem | null>(null);
  const [placeDay, setPlaceDay] = useState<string>(workingDays[0] || 'Monday');
  const [placePeriod, setPlacePeriod] = useState<number>(1);
  const [placeRoomId, setPlaceRoomId] = useState<string>('');

  // Generation job tracking
  const [activeJob, setActiveJob] = useState<TTJobItem | null>(() => {
    const latest = activeVersion?.jobs?.[0];
    if (latest && (latest.status === 'queued' || latest.status === 'running')) return latest;
    return null;
  });
  const [busyAction, setBusyAction] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err' | 'warn'; title: string; details?: string[] } | null>(null);

  useEffect(() => {
    if (streamOptions.length > 0 && !streamOptions.some((s) => `${s.grade}|${s.stream}` === selectedClassKey)) {
      setSelectedClassKey(`${streamOptions[0].grade}|${streamOptions[0].stream}`);
    }
  }, [streamOptions, selectedClassKey]);

  useEffect(() => {
    if (teachers.length > 0 && !teachers.some((t) => t.id === selectedTeacherId)) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  useEffect(() => {
    if (classrooms.length > 0 && !classrooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(classrooms[0].id);
    }
  }, [classrooms, selectedRoomId]);

  useEffect(() => {
    if (!workingDays.includes(mobileDay) && workingDays[0]) {
      setMobileDay(workingDays[0]);
    }
  }, [workingDays, mobileDay]);

  // Live Weekly Lesson Quota Compliance for selected Class/Stream & zero teacher clash check
  const selectedClassQuotaRows = useMemo(() => {
    const [gStr, stName] = selectedClassKey.split('|');
    const grade = Number(gStr);
    const stream = stName || '';
    if (!grade || !stream) return [];
    const allocs = (workspace.streamAllocations || []).filter(
      (a) => a.isActive && a.grade === grade && a.stream.toLowerCase() === stream.toLowerCase()
    );
    const entriesList = activeVersion?.entries || [];
    return allocs
      .map((a) => {
        const scheduled = entriesList.filter(
          (e) =>
            e.grade === grade &&
            e.stream.toLowerCase() === stream.toLowerCase() &&
            e.subjectName.toLowerCase() === a.subjectName.toLowerCase()
        ).length;
        return {
          id: a.id,
          subjectName: a.subjectName,
          required: a.requiredWeeklyPeriods,
          scheduled,
        };
      })
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [workspace.streamAllocations, activeVersion?.entries, selectedClassKey]);

  const teacherClashCount = useMemo(() => {
    const seen = new Map<string, Set<string>>();
    for (const e of activeVersion?.entries || []) {
      const eventKey = e.jointLessonId ? `jl:${e.jointLessonId}` : e.sessionBlockId;
      for (const tid of e.teacherIds || []) {
        const slot = `${tid}|${e.dayOfWeek}|${e.periodNumber}`;
        if (!seen.has(slot)) seen.set(slot, new Set());
        seen.get(slot)!.add(eventKey);
      }
    }
    let clashes = 0;
    for (const set of seen.values()) {
      if (set.size > 1) clashes++;
    }
    return clashes;
  }, [activeVersion?.entries]);

  // Poll active generation job
  useEffect(() => {
    if (!activeJob || (activeJob.status !== 'queued' && activeJob.status !== 'running')) return;
    const timer = window.setInterval(async () => {
      try {
        const job = await ttApiFetch<TTJobItem>(`/api/timetable/jobs/${activeJob.id}`);
        setActiveJob(job);
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          window.clearInterval(timer);
          await onRefresh(activeVersion?.id);
          if (job.status === 'completed') {
            setFeedback({
              type: job.diagnostics?.unscheduledCount > 0 ? 'warn' : 'ok',
              title: `Generation completed (${job.diagnostics?.placedBlocks ?? 0} blocks scheduled, ${job.diagnostics?.unscheduledCount ?? 0} unscheduled).`,
              details: job.diagnostics?.hardErrors > 0 ? [`${job.diagnostics.hardErrors} validation error(s) detected.`] : undefined,
            });
          } else if (job.status === 'failed') {
            setFeedback({
              type: 'err',
              title: job.errorMessage || 'Timetable generation failed.',
            });
          } else {
            setFeedback({
              type: 'warn',
              title: 'Generation job was cancelled.',
            });
          }
        }
      } catch {
        // Ignore transient poll glitches
      }
    }, 800);
    return () => window.clearInterval(timer);
  }, [activeJob, activeVersion?.id, onRefresh]);

  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => a.sortOrder - b.sortOrder), [periods]);
  const lessonPeriods = useMemo(() => sortedPeriods.filter((p) => p.kind === 'lesson'), [sortedPeriods]);

  const subjectList = useMemo(() => {
    const names = new Set<string>();
    for (const e of activeVersion?.entries || []) names.add(e.subjectName);
    for (const u of activeVersion?.unscheduled || []) names.add(u.subjectName);
    return Array.from(names).sort();
  }, [activeVersion]);

  const isLockedVersion = activeVersion?.status === 'published' || activeVersion?.status === 'archived';

  const startGeneration = async (preserveLocked: boolean) => {
    if (!activeVersion) return;
    setBusyAction(true);
    setFeedback(null);
    try {
      const res = await ttApiFetch<{ jobId: string; status: string }>(`/api/timetable/versions/${activeVersion.id}/generate`, {
        method: 'POST',
        body: JSON.stringify({ preserveLocked }),
      });
      setActiveJob({
        id: res.jobId,
        versionId: activeVersion.id,
        status: 'queued',
        progressPct: 5,
        stageMessage: preserveLocked ? 'Queuing regeneration (preserving locked lessons)...' : 'Queuing fresh full timetable generation...',
        preserveLocked,
        retries: 0,
        diagnostics: {},
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      });
    } catch (e: any) {
      setFeedback({ type: 'err', title: e?.message || 'Failed to trigger timetable generation.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleCancelJob = async () => {
    if (!activeJob) return;
    try {
      await ttApiFetch(`/api/timetable/jobs/${activeJob.id}/cancel`, { method: 'POST' });
    } catch (e: any) {
      setFeedback({ type: 'err', title: e?.message || 'Could not cancel job.' });
    }
  };

  const handleRetryJob = async (jobId: string) => {
    setBusyAction(true);
    try {
      const res = await ttApiFetch<{ jobId: string }>(`/api/timetable/jobs/${jobId}/retry`, { method: 'POST' });
      setActiveJob({
        id: res.jobId,
        versionId: activeVersion?.id,
        status: 'queued',
        progressPct: 5,
        stageMessage: 'Retrying timetable solver...',
        preserveLocked: true,
        retries: 1,
        diagnostics: {},
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      });
    } catch (e: any) {
      setFeedback({ type: 'err', title: e?.message || 'Could not retry job.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleValidateNow = async () => {
    if (!activeVersion) return;
    setBusyAction(true);
    try {
      const res = await ttApiFetch<{ hardErrors: number; warnings: number; canApprove: boolean }>(
        `/api/timetable/versions/${activeVersion.id}/validate`,
        { method: 'POST' }
      );
      await onRefresh(activeVersion.id);
      setFeedback({
        type: res.hardErrors > 0 ? 'err' : res.warnings > 0 ? 'warn' : 'ok',
        title: `Validation complete: ${res.hardErrors} hard error(s), ${res.warnings} optimization warning(s).`,
      });
    } catch (e: any) {
      setFeedback({ type: 'err', title: e?.message || 'Validation failed.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleToggleLock = async (entry: TTEntryItem) => {
    if (!activeVersion || isLockedVersion) return;
    try {
      await ttApiFetch(`/api/timetable/versions/${activeVersion.id}/toggle-lock`, {
        method: 'POST',
        body: JSON.stringify({ sessionBlockId: entry.sessionBlockId, locked: !entry.isLocked }),
      });
      await onRefresh(activeVersion.id);
    } catch (e: any) {
      setFeedback({ type: 'err', title: e?.message || 'Could not toggle lock state.' });
    }
  };

  const executeMoveEntry = async (entry: TTEntryItem, targetDay: string, targetStartPeriod: number) => {
    if (!activeVersion) return;
    if (isLockedVersion) {
      setFeedback({ type: 'err', title: 'Published or archived versions cannot be edited. Restore a new draft first.' });
      return;
    }
    if (entry.isLocked) {
      setFeedback({ type: 'err', title: `"${entry.subjectName}" is locked. Unlock the block before dragging it.` });
      return;
    }
    setFeedback(null);
    try {
      await ttApiFetch(`/api/timetable/versions/${activeVersion.id}/move-entry`, {
        method: 'POST',
        body: JSON.stringify({
          sessionBlockId: entry.sessionBlockId,
          targetDay,
          targetStartPeriod,
          targetRoomId: viewMode === 'room' ? selectedRoomId : undefined,
        }),
      });
      await onRefresh(activeVersion.id);
      setFeedback({
        type: 'ok',
        title: `Moved ${entry.subjectName} (${entry.streamLabel}) to ${targetDay} Period ${targetStartPeriod}.`,
      });
    } catch (e: any) {
      const conflicts: string[] = Array.isArray(e?.payload?.hardConflicts) ? e.payload.hardConflicts : [];
      setFeedback({
        type: 'err',
        title: e?.message || 'Move rejected due to scheduling conflict. Original placement preserved.',
        details: conflicts.length > 1 ? conflicts : undefined,
      });
    }
  };

  const executePlaceUnscheduled = async (item: TTUnscheduledItem, targetDay: string, targetStartPeriod: number, roomId?: string) => {
    if (!activeVersion) return;
    if (isLockedVersion) {
      setFeedback({ type: 'err', title: 'Published or archived versions cannot be edited. Restore a new draft first.' });
      return;
    }
    setFeedback(null);
    try {
      await ttApiFetch(`/api/timetable/versions/${activeVersion.id}/place-unscheduled`, {
        method: 'POST',
        body: JSON.stringify({
          unscheduledId: item.id,
          targetDay,
          targetStartPeriod,
          roomId: roomId || (viewMode === 'room' ? selectedRoomId : undefined),
        }),
      });
      setPlaceTargetItem(null);
      await onRefresh(activeVersion.id);
      setFeedback({
        type: 'ok',
        title: `Placed ${item.subjectName} (Gr ${item.grade} ${item.stream}) on ${targetDay} P${targetStartPeriod}.`,
      });
    } catch (e: any) {
      const conflicts: string[] = Array.isArray(e?.payload?.hardConflicts) ? e.payload.hardConflicts : [];
      setFeedback({
        type: 'err',
        title: e?.message || 'Placement rejected due to hard scheduling conflict.',
        details: conflicts.length > 1 ? conflicts : undefined,
      });
    }
  };

  const handleDropOnCell = async (day: string, periodNumber: number) => {
    setDragOverSlot(null);
    if (!draggingBlock) return;
    const payload = draggingBlock;
    setDraggingBlock(null);
    if (payload.kind === 'entry') {
      await executeMoveEntry(payload.entry, day, periodNumber);
    } else {
      await executePlaceUnscheduled(payload.item, day, periodNumber);
    }
  };

  // Filtered entries for current grid perspective
  const visibleEntries = useMemo(() => {
    const raw = activeVersion?.entries || [];
    return raw.filter((e) => {
      if (subjectFilter !== 'ALL' && e.subjectName !== subjectFilter) return false;
      if (viewMode === 'class') {
        return `${e.grade}|${e.stream}` === selectedClassKey;
      }
      if (viewMode === 'teacher') {
        const t = teachers.find((x) => x.id === selectedTeacherId);
        return e.teacherIds.includes(selectedTeacherId) || (t && e.teacherNames.includes(t.teacherName));
      }
      if (viewMode === 'room') {
        return e.roomId === selectedRoomId;
      }
      return true;
    });
  }, [activeVersion, viewMode, selectedClassKey, selectedTeacherId, selectedRoomId, subjectFilter, teachers]);

  const hardErrors = (activeVersion?.conflicts || []).filter((c) => c.severity === 'error');
  const warnings = (activeVersion?.conflicts || []).filter((c) => c.severity === 'warning');
  const unscheduled = activeVersion?.unscheduled || [];
  const lastJob = activeJob || activeVersion?.jobs?.[0] || null;

  if (!activeVersion) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-sm font-bold text-slate-800">No timetable draft selected.</p>
        <p className="text-xs text-slate-500 mt-1">Create a new draft version in Approvals & Versions or refresh workspace.</p>
      </div>
    );
  }

  const renderLessonCard = (entry: TTEntryItem) => {
    const canDrag = !isLockedVersion && !entry.isLocked;
    return (
      <div
        key={entry.id}
        draggable={canDrag}
        onDragStart={(ev) => {
          if (!canDrag) {
            ev.preventDefault();
            return;
          }
          setDraggingBlock({ kind: 'entry', entry });
          ev.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => {
          setDraggingBlock(null);
          setDragOverSlot(null);
        }}
        className={`rounded-lg border p-2 text-left transition-colors ${
          entry.isLocked
            ? 'bg-amber-50/70 border-amber-300'
            : canDrag
            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-grab active:cursor-grabbing'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="text-xs font-bold text-slate-900 leading-snug">{entry.subjectName}</span>
          <button
            type="button"
            disabled={isLockedVersion}
            onClick={(ev) => {
              ev.stopPropagation();
              handleToggleLock(entry);
            }}
            title={entry.isLocked ? 'Unlock lesson block' : 'Lock lesson block so regeneration preserves it'}
            className={`p-0.5 rounded hover:bg-white/80 shrink-0 ${
              entry.isLocked ? 'text-amber-700' : 'text-slate-400 hover:text-slate-700'
            } disabled:opacity-40`}
          >
            {entry.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="mt-1 text-[11px] text-slate-600 leading-tight space-y-0.5">
          <div className="truncate font-medium text-slate-700">
            {viewMode === 'class' ? entry.teacherNames.join(', ') || 'Unassigned' : `${entry.streamLabel} · ${entry.teacherNames.join(', ')}`}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500">
            <span className="truncate">{entry.roomName}</span>
            <span>
              {entry.blockLength > 1 ? `${entry.blockLength}P (${entry.blockIndex + 1}/${entry.blockLength})` : '1P'}
              {entry.jointLessonId ? ' · Joint' : entry.groupName !== 'Whole Class' ? ` · ${entry.groupName}` : ''}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Version, Solver Actions & Metrics */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Active Timetable Version
              </label>
              <select
                value={activeVersion.id}
                onChange={(e) => onRefresh(e.target.value)}
                className="mt-0.5 px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber} · {v.name} [{v.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-600 border-l border-slate-200 pl-3 font-mono tabular-nums">
              Status: <span className="font-bold text-slate-900 uppercase">{activeVersion.status}</span> ·{' '}
              Placed: <span className="font-bold text-slate-900">{activeVersion.entries.length}</span> slots ·{' '}
              Unscheduled: <span className={`font-bold ${unscheduled.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{unscheduled.length}</span> ·{' '}
              Errors: <span className={`font-bold ${hardErrors.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{hardErrors.length}</span> ·{' '}
              Warnings: <span className="font-bold text-amber-700">{warnings.length}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busyAction || isLockedVersion || (activeJob?.status === 'running' || activeJob?.status === 'queued')}
              onClick={() => startGeneration(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Regenerate Unlocked</span>
            </button>

            <button
              type="button"
              disabled={busyAction || isLockedVersion || (activeJob?.status === 'running' || activeJob?.status === 'queued')}
              onClick={() => startGeneration(false)}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Full Auto-Generate</span>
            </button>

            <button
              type="button"
              disabled={busyAction}
              onClick={handleValidateNow}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Validate Schedule</span>
            </button>
          </div>
        </div>

        {/* Background Solver Job Progress */}
        {lastJob && (
          <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Background Solver ({lastJob.status.toUpperCase()}) · {lastJob.stageMessage}
                </span>
                <span className="font-mono tabular-nums text-slate-600 font-bold">{lastJob.progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    lastJob.status === 'failed'
                      ? 'bg-rose-600'
                      : lastJob.status === 'cancelled'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(4, lastJob.progressPct))}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(lastJob.status === 'queued' || lastJob.status === 'running') && (
                <button
                  type="button"
                  onClick={handleCancelJob}
                  className="px-2.5 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
              {(lastJob.status === 'failed' || lastJob.status === 'cancelled') && (
                <button
                  type="button"
                  onClick={() => handleRetryJob(lastJob.id)}
                  className="px-2.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Atomic Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
              feedback.type === 'err'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : feedback.type === 'warn'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                {feedback.type === 'err' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : feedback.type === 'warn' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.title}</span>
              </div>
              {feedback.details && feedback.details.length > 0 && (
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {feedback.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" onClick={() => setFeedback(null)} className="text-slate-500 hover:text-slate-800 font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* Filters Row */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(
              [
                { id: 'class', label: 'Class / Stream', icon: Users },
                { id: 'teacher', label: 'Teacher View', icon: Filter },
                { id: 'room', label: 'Classroom View', icon: MapPin },
                { id: 'master', label: 'Master Grid', icon: Layers },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewMode(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                    viewMode === tab.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewMode === 'class' && (
              <select
                value={selectedClassKey}
                onChange={(e) => setSelectedClassKey(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800"
              >
                {streamOptions.map((s) => (
                  <option key={`${s.grade}|${s.stream}`} value={`${s.grade}|${s.stream}`}>
                    Grade {s.grade} — {s.stream}
                  </option>
                ))}
              </select>
            )}

            {viewMode === 'teacher' && (
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.teacherName} ({t.department})
                  </option>
                ))}
              </select>
            )}

            {viewMode === 'room' && (
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800"
              >
                {classrooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.roomCode} · Cap {r.capacity})
                  </option>
                ))}
              </select>
            )}

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="ALL">All Subjects ({subjectList.length})</option>
              {subjectList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Editor Split: Mon-Sat Grid + Unscheduled Lessons Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-9 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {isLockedVersion && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs font-semibold text-amber-900">
              This timetable version is {activeVersion.status.toUpperCase()} and read-only. Restore it as a new Draft in Approvals & Reports to make changes.
            </div>
          )}

          {/* Mobile Day Tabs (< md) */}
          <div className="md:hidden border-b border-slate-200 p-2 flex items-center gap-1 overflow-x-auto bg-slate-50">
            {workingDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setMobileDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${
                  mobileDay === day ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Mobile Responsive Day View */}
          <div className="md:hidden divide-y divide-slate-200">
            {sortedPeriods.map((p) => {
              if (p.kind !== 'lesson') {
                return (
                  <div key={p.id} className="px-4 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    <span>{p.label}</span>
                    <span className="font-mono tabular-nums">{p.startTime}–{p.endTime}</span>
                  </div>
                );
              }
              const cellEntries = visibleEntries.filter((e) => e.dayOfWeek === mobileDay && e.periodNumber === p.periodNumber);
              return (
                <div key={p.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{p.label}</span>
                    <span className="font-mono tabular-nums text-slate-500">{p.startTime}–{p.endTime}</span>
                  </div>
                  {cellEntries.length > 0 ? (
                    <div className="space-y-1.5">{cellEntries.map(renderLessonCard)}</div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">Free period</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Mon–Sat Drag-and-Drop Grid */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-2.5 px-3 w-32 border-r border-slate-800 font-bold text-[11px] uppercase tracking-wider">
                    Period / Time
                  </th>
                  {workingDays.map((day) => (
                    <th key={day} className="py-2.5 px-2.5 border-r border-slate-800 last:border-r-0 font-bold text-[11px] uppercase tracking-wider min-w-[145px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedPeriods.map((p) => {
                  if (p.kind !== 'lesson') {
                    return (
                      <tr key={p.id} className="bg-slate-100/80">
                        <td className="py-1.5 px-3 border-r border-slate-200 font-mono tabular-nums text-[11px] text-slate-600 font-semibold">
                          {p.startTime}–{p.endTime}
                        </td>
                        <td colSpan={workingDays.length} className="py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 text-center">
                          {p.label}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={p.id} className="align-top">
                      <td className="py-2.5 px-3 border-r border-slate-200 bg-slate-50/70">
                        <div className="font-bold text-slate-900">P{p.periodNumber} · {p.label}</div>
                        <div className="text-[10px] font-mono tabular-nums text-slate-500 mt-0.5">
                          {p.startTime}–{p.endTime}
                        </div>
                      </td>

                      {workingDays.map((day) => {
                        const slotKey = `${day}|${p.periodNumber}`;
                        const isOver = dragOverSlot === slotKey;
                        const cellEntries = visibleEntries.filter(
                          (e) => e.dayOfWeek === day && e.periodNumber === p.periodNumber
                        );

                        return (
                          <td
                            key={slotKey}
                            onDragOver={(ev) => {
                              if (isLockedVersion) return;
                              ev.preventDefault();
                              ev.dataTransfer.dropEffect = 'move';
                              if (dragOverSlot !== slotKey) setDragOverSlot(slotKey);
                            }}
                            onDragLeave={() => {
                              if (dragOverSlot === slotKey) setDragOverSlot(null);
                            }}
                            onDrop={(ev) => {
                              ev.preventDefault();
                              handleDropOnCell(day, p.periodNumber);
                            }}
                            className={`p-1.5 border-r border-slate-200 last:border-r-0 min-h-[76px] transition-colors ${
                              isOver ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-500' : 'bg-white'
                            }`}
                          >
                            {cellEntries.length > 0 ? (
                              <div className="space-y-1.5">{cellEntries.map(renderLessonCard)}</div>
                            ) : (
                              <div className="h-14 flex items-center justify-center text-[10px] text-slate-300 select-none">
                                {isOver ? 'Drop lesson here' : '—'}
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

        {/* Right Sidebar: Unscheduled Lessons Panel & Live Conflicts Summary */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Unscheduled Lessons ({unscheduled.length})
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Drag any unscheduled card onto a compatible slot in the grid, or click Place to assign manually.
            </p>

            {unscheduled.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All weekly curriculum sessions are placed.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {unscheduled.map((item) => (
                  <div
                    key={item.id}
                    draggable={!isLockedVersion}
                    onDragStart={(ev) => {
                      if (isLockedVersion) {
                        ev.preventDefault();
                        return;
                      }
                      setDraggingBlock({ kind: 'unscheduled', item });
                      ev.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDraggingBlock(null);
                      setDragOverSlot(null);
                    }}
                    className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/50 space-y-1 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.subjectName}</span>
                      <span className="text-[10px] font-mono tabular-nums font-bold text-rose-800">
                        {item.blockLength}P
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-medium">
                      Grade {item.grade} {item.stream} · {item.groupName}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      Teacher: {item.teacherNames.join(', ') || 'Unassigned'}
                    </div>
                    <div className="text-[10px] text-rose-700 leading-snug">{item.reason}</div>
                    {!isLockedVersion && (
                      <button
                        type="button"
                        onClick={() => {
                          setPlaceTargetItem(item);
                          setPlaceDay(workingDays[0] || 'Monday');
                          setPlacePeriod(lessonPeriods[0]?.periodNumber || 1);
                          setPlaceRoomId(classrooms[0]?.id || '');
                        }}
                        className="mt-1 w-full py-1 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[11px] font-bold text-slate-800 inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Place Manually</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Multi-View Sync & Weekly Lesson Quota Compliance */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Weekly Quota &amp; Sync Audit
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                  teacherClashCount === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {teacherClashCount === 0 ? '0 Teacher Clashes' : `${teacherClashCount} Clash(es)`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Class/Stream, Teacher, and Master timetables sync automatically from this version. Every teacher is restricted to max 1 lesson per slot.
            </p>
            {selectedClassQuotaRows.length > 0 && (
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1 pt-1">
                {selectedClassQuotaRows.map((q) => {
                  const exact = q.scheduled === q.required;
                  const over = q.scheduled > q.required;
                  return (
                    <div
                      key={q.id}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] ${
                        exact
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : over
                          ? 'bg-rose-50 border-rose-200 text-rose-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <span className="font-semibold truncate pr-2">{q.subjectName}</span>
                      <span className="font-mono font-bold shrink-0">
                        {q.scheduled}/{q.required}p
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conflict Diagnostics Snapshot */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Validation Diagnostics
            </h3>
            {hardErrors.length === 0 && warnings.length === 0 ? (
              <div className="text-xs text-emerald-700 font-semibold">
                Zero clashes or policy errors detected.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 text-[11px]">
                {hardErrors.map((c) => (
                  <div key={c.id} className="p-2 rounded border border-rose-200 bg-rose-50 text-rose-900">
                    <div className="font-bold uppercase text-[10px]">{c.conflictType}</div>
                    <div>{c.message}</div>
                  </div>
                ))}
                {warnings.map((w) => (
                  <div key={w.id} className="p-2 rounded border border-amber-200 bg-amber-50 text-amber-900">
                    <div className="font-bold uppercase text-[10px]">Warning · {w.conflictType}</div>
                    <div>{w.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Manual Placement Picker for Unscheduled Session */}
      {placeTargetItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Place Unscheduled Lesson</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {placeTargetItem.subjectName} · Grade {placeTargetItem.grade} {placeTargetItem.stream} ({placeTargetItem.blockLength} Period{placeTargetItem.blockLength > 1 ? 's' : ''})
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Day of Week</label>
                <select
                  value={placeDay}
                  onChange={(e) => setPlaceDay(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {workingDays.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Starting Period</label>
                <select
                  value={placePeriod}
                  onChange={(e) => setPlacePeriod(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {lessonPeriods.map((p) => (
                    <option key={p.id} value={p.periodNumber}>
                      P{p.periodNumber} · {p.label} ({p.startTime}–{p.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Classroom / Facility</label>
                <select
                  value={placeRoomId}
                  onChange={(e) => setPlaceRoomId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Auto-assign matching room</option>
                  {classrooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.roomType} · Cap {r.capacity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPlaceTargetItem(null)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executePlaceUnscheduled(placeTargetItem, placeDay, placePeriod, placeRoomId || undefined)}
                className="px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg cursor-pointer"
              >
                Validate & Place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
