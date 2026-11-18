import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileText,
  Layers,
  Lock,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Trash2,
  Users,
  Video,
  X,
  Zap,
} from 'lucide-react';
import {
  type SchedulingMode,
  type VirtualClassroomMeta,
  type VirtualLessonItem,
  exportAttendanceRegisterCsv,
  formatCountdownSeconds,
  formatSchedulingModeLabel,
  getSecondsUntilIso,
  vcApiFetch,
} from './virtualClassroomTypes';
import { LiveClassroomRoomModal } from './LiveClassroomRoomModal';

interface SeniorVirtualClassroomManagerProps {
  selectedGradeId?: string;
  initialOpenMode?: 'schedule' | 'instant' | null;
  onModalHandled?: () => void;
}

interface SeparateScheduleRow {
  streamId: string;
  teacherId: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
}

export const SeniorVirtualClassroomManager: React.FC<SeniorVirtualClassroomManagerProps> = ({
  selectedGradeId,
  initialOpenMode,
  onModalHandled,
}) => {
  const [meta, setMeta] = useState<VirtualClassroomMeta | null>(null);
  const [lessons, setLessons] = useState<VirtualLessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'scheduled' | 'postponed' | 'completed' | 'cancelled'>('all');

  // Active LiveKit room modal
  const [activeRoomLaunch, setActiveRoomLaunch] = useState<{ lessonId: string; classroomId?: string } | null>(null);

  // Schedule / Instant modal state
  const [modalMode, setModalMode] = useState<'schedule' | 'instant' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);

  // Form fields
  const [gradeId, setGradeId] = useState('');
  const [subjectName, setSubjectName] = useState('Mathematics');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>(['', '', '']);
  const [resourcesText, setResourcesText] = useState('');
  const [description, setDescription] = useState('');

  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode>('individual_stream');
  const [selectedStreamIds, setSelectedStreamIds] = useState<string[]>([]);
  const [separateRows, setSeparateRows] = useState<SeparateScheduleRow[]>([]);
  const [leadTeacherId, setLeadTeacherId] = useState('');
  const [coTeacherIds, setCoTeacherIds] = useState<string[]>([]);

  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(40);
  const [maxCapacity, setMaxCapacity] = useState(30);

  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  const [studentChatEnabled, setStudentChatEnabled] = useState(true);
  const [studentScreenshareEnabled, setStudentScreenshareEnabled] = useState(false);
  const [studentCameraEnabled, setStudentCameraEnabled] = useState(true);
  const [studentMicEnabled, setStudentMicEnabled] = useState(false);
  const [interactionEnabled, setInteractionEnabled] = useState(true);

  // Edit / Postpone modal
  const [editingLesson, setEditingLesson] = useState<VirtualLessonItem | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState(40);
  const [editReason, setEditReason] = useState('');

  // Cancel modal
  const [cancellingLesson, setCancellingLesson] = useState<VirtualLessonItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Attendance register modal
  const [attendanceLesson, setAttendanceLesson] = useState<VirtualLessonItem | null>(null);
  const [attendanceRegister, setAttendanceRegister] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 4000);
  };

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, l] = await Promise.all([
        vcApiFetch<VirtualClassroomMeta>('/api/virtual-lessons/meta'),
        vcApiFetch<{ lessons: VirtualLessonItem[] }>(
          `/api/virtual-lessons${selectedGradeId ? `?gradeId=${encodeURIComponent(selectedGradeId)}` : ''}`
        ),
      ]);
      setMeta(m);
      setLessons(l.lessons || []);
      const defaultGrade =
        (selectedGradeId && m.grades.some((g) => g.id === selectedGradeId) ? selectedGradeId : m.grades[0]?.id) || '';
      setGradeId((prev) => (prev && m.grades.some((g) => g.id === prev) ? prev : defaultGrade));
      setScheduledDate((prev) => prev || m.nairobiNow.dateStr);
      setStartTime((prev) => prev || m.nairobiNow.timeStr);
      setMaxCapacity(m.policy.defaultMaxCapacity || 30);
      setWaitingRoomEnabled(m.policy.defaultWaitingRoomEnabled);
      setRecordingEnabled(m.policy.defaultRecordingEnabled);
    } catch (err: any) {
      setError(err?.message || 'Failed loading virtual classroom console.');
    } finally {
      setLoading(false);
    }
  }, [selectedGradeId]);

  useEffect(() => {
    void loadData();
    const onSse = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || detail.key === 'edusmart_virtual_lessons_v1' || detail.key === '*') {
        void loadData();
      }
    };
    window.addEventListener('edusmart:data-changed', onSse);
    return () => window.removeEventListener('edusmart:data-changed', onSse);
  }, [loadData]);

  const gradeStreams = useMemo(() => {
    if (!meta || !gradeId) return [];
    return meta.streams.filter((s) => s.gradeId === gradeId);
  }, [meta, gradeId]);

  const subjectTeacherByStreamId = useMemo(() => {
    const map = new Map<string, { teacherId: string; teacherName: string }>();
    if (!meta || !gradeId || !subjectName) return map;
    const subLower = subjectName.trim().toLowerCase();
    for (const a of meta.gradeSubjectAssignments || []) {
      if (a.gradeId === gradeId && a.streamId && a.subjectName.trim().toLowerCase() === subLower) {
        map.set(a.streamId, { teacherId: a.teacherId, teacherName: a.teacherName });
      }
    }
    return map;
  }, [meta, gradeId, subjectName]);

  // Synchronize separate-stream rows when streams, grade, or subject changes
  useEffect(() => {
    if (gradeStreams.length === 0) return;
    setSelectedStreamIds((prev) => {
      const valid = prev.filter((id) => gradeStreams.some((s) => s.id === id));
      return valid.length > 0 ? valid : [gradeStreams[0].id];
    });
    setSeparateRows(
      gradeStreams.map((s) => {
        const linked = subjectTeacherByStreamId.get(s.id);
        return {
          streamId: s.id,
          teacherId: linked?.teacherId || s.classTeacherId || meta?.teachers[0]?.id || '',
          scheduledDate: scheduledDate || meta?.nairobiNow.dateStr || '',
          startTime: startTime || meta?.nairobiNow.timeStr || '',
          durationMinutes: durationMinutes || 40,
        };
      })
    );
  }, [gradeStreams, meta, scheduledDate, startTime, durationMinutes, subjectTeacherByStreamId]);

  useEffect(() => {
    if (schedulingMode === 'individual_stream' && selectedStreamIds.length === 1) {
      const linked = subjectTeacherByStreamId.get(selectedStreamIds[0]);
      if (linked?.teacherId) {
        setLeadTeacherId(linked.teacherId);
      }
    }
  }, [schedulingMode, selectedStreamIds, subjectTeacherByStreamId]);

  const openSchedulingModal = useCallback(
    (mode: 'schedule' | 'instant') => {
      setFormErrors([]);
      setConflictWarnings([]);
      setModalMode(mode);
      if (meta) {
        setScheduledDate(meta.nairobiNow.dateStr);
        setStartTime(meta.nairobiNow.timeStr);
        setSubjectName(meta.subjects[0] || 'Mathematics');
      }
      if (gradeStreams.length > 0 && selectedStreamIds.length === 0) {
        setSelectedStreamIds([gradeStreams[0].id]);
      }
    },
    [meta, gradeStreams, selectedStreamIds.length]
  );

  useEffect(() => {
    if (initialOpenMode) {
      openSchedulingModal(initialOpenMode);
      onModalHandled?.();
    }
  }, [initialOpenMode, openSchedulingModal, onModalHandled]);

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!gradeId) errs.push('Select an assigned grade.');
    if (!subjectName.trim()) errs.push('Select a subject.');
    if (!title.trim()) errs.push('Enter a lesson title.');
    if (!topic.trim()) errs.push('Enter a lesson topic.');
    if (!learningObjectives.trim()) errs.push('Enter the learning objectives.');
    const cleanedPoints = keyPoints.map((p) => p.trim()).filter(Boolean);
    if (cleanedPoints.length < 3) errs.push('Provide at least 3 key learning points.');
    if (durationMinutes < 1 || durationMinutes > 60) errs.push('Lesson duration must be between 1 and 60 minutes.');

    const targetIds =
      schedulingMode === 'all_streams_combined'
        ? gradeStreams.map((s) => s.id)
        : schedulingMode === 'multiple_separate'
        ? separateRows.filter((r) => selectedStreamIds.includes(r.streamId)).map((r) => r.streamId)
        : selectedStreamIds;

    if (targetIds.length === 0) errs.push('Select at least one stream.');
    if (schedulingMode === 'individual_stream' && targetIds.length !== 1) {
      errs.push('Individual Stream mode requires selecting exactly 1 stream.');
    }

    if (errs.length > 0) {
      setFormErrors(errs);
      return;
    }

    const resources = resourcesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, i) => {
        const parts = line.split('|').map((x) => x.trim());
        return {
          title: parts.length > 1 ? parts[0] : `Resource ${i + 1}`,
          url: parts.length > 1 ? parts[1] : parts[0],
        };
      });

    setSubmitting(true);
    setFormErrors([]);
    try {
      const endpoint =
        modalMode === 'instant' ? '/api/virtual-lessons/instant-start' : '/api/virtual-lessons/schedule';

      const payload = {
        gradeId,
        subjectName: subjectName.trim(),
        title: title.trim(),
        topic: topic.trim(),
        subtopic: subtopic.trim(),
        learningObjectives: learningObjectives.trim(),
        keyLearningPoints: cleanedPoints,
        resources,
        description: description.trim(),
        schedulingMode,
        streamIds: targetIds,
        separateStreamSchedules:
          schedulingMode === 'multiple_separate'
            ? separateRows.filter((r) => targetIds.includes(r.streamId))
            : undefined,
        leadTeacherId: leadTeacherId || undefined,
        coTeacherIds,
        scheduledDate,
        startTime,
        durationMinutes,
        maxCapacity,
        settings: {
          maxCapacity,
          recordingEnabled,
          waitingRoomEnabled,
          studentChatEnabled,
          studentScreenshareEnabled,
          studentCameraEnabled,
          studentMicEnabled,
          interactionEnabled,
        },
      };

      const res = await vcApiFetch<{ lesson: VirtualLessonItem; warnings?: string[] }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.warnings?.length) {
        setConflictWarnings(res.warnings);
      }

      showToast(
        modalMode === 'instant'
          ? `Instant classroom launched for ${res.lesson.subjectName}. Students and teachers notified live.`
          : `Scheduled ${res.lesson.subjectName}: ${res.lesson.title}. Automated notifications delivered.`
      );

      // Reset form cleanly
      setTitle('');
      setTopic('');
      setSubtopic('');
      setLearningObjectives('');
      setKeyPoints(['', '', '']);
      setResourcesText('');
      setDescription('');
      setModalMode(null);
      await loadData();

      // Open live room automatically for instant start if combined or first room
      if (modalMode === 'instant' && res.lesson.classrooms[0]) {
        setActiveRoomLaunch({ lessonId: res.lesson.id, classroomId: res.lesson.classrooms[0].id });
      }
    } catch (err: any) {
      setFormErrors([err?.message || 'Failed saving virtual lesson.']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEditPostpone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    setSubmitting(true);
    try {
      await vcApiFetch(`/api/virtual-lessons/${editingLesson.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          scheduledDate: editDate,
          startTime: editTime,
          durationMinutes: editDuration,
          postpone: editDate !== editingLesson.scheduledDate || editTime !== editingLesson.startTime,
          postponedReason: editReason,
        }),
      });
      showToast('Lesson schedule updated and participants notified.');
      setEditingLesson(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed updating schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingLesson) return;
    setSubmitting(true);
    try {
      await vcApiFetch(`/api/virtual-lessons/${cancellingLesson.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason || 'Cancelled by Senior Teacher' }),
      });
      showToast('Lesson cancelled and notifications updated.');
      setCancellingLesson(null);
      setCancelReason('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed cancelling lesson.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAttendance = async (lesson: VirtualLessonItem) => {
    setAttendanceLesson(lesson);
    setAttendanceRegister(null);
    try {
      const data = await vcApiFetch(`/api/virtual-lessons/${lesson.id}/attendance`);
      setAttendanceRegister(data);
    } catch (err: any) {
      setError(err?.message || 'Failed loading attendance register.');
    }
  };

  const filteredLessons = useMemo(() => {
    if (filterStatus === 'all') return lessons;
    return lessons.filter((l) => l.status === filterStatus);
  }, [lessons, filterStatus]);

  const liveLessonsCount = lessons.filter((l) => l.status === 'live').length;
  const upcomingLessonsCount = lessons.filter((l) => l.status === 'scheduled' || l.status === 'postponed').length;
  const completedLessonsCount = lessons.filter((l) => l.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header & Two Prominent Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            LiveKit Virtual Classroom Coordination
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Grade Virtual Classroom Management
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Schedule stream-specific, combined, or parallel separate LiveKit virtual classrooms for your assigned grade, start instant live lessons, monitor active sessions, and inspect verified attendance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => openSchedulingModal('schedule')}
            disabled={!meta?.grades.length}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>SCHEDULE VIRTUAL LESSON</span>
          </button>

          <button
            type="button"
            onClick={() => openSchedulingModal('instant')}
            disabled={!meta?.grades.length}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>START INSTANT VIRTUAL LESSON</span>
          </button>
        </div>
      </div>

      {/* LiveKit Configuration Notice (if env keys not present yet) */}
      {meta && !meta.livekitStatus.configured && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">LiveKit Server Credentials Required for WebRTC Media Streaming</div>
            <div className="text-amber-800 mt-0.5">
              Missing environment keys: <span className="font-mono">{meta.livekitStatus.missingKeys.join(', ')}</span>. Scheduling, waiting rooms, moderation policies, and notifications remain fully operational. Configure LiveKit keys in server <span className="font-mono">.env</span> to enable live video/audio WebRTC streaming.
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-rose-700 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {conflictWarnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            Schedule Conflict Warnings Recorded
          </div>
          {conflictWarnings.map((w, i) => (
            <div key={i}>• {w}</div>
          ))}
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Live Classrooms Now</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">{liveLessonsCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Upcoming & Postponed</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">{upcomingLessonsCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Completed Lessons</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">{completedLessonsCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-medium">Active Grade Streams</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">{gradeStreams.length}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
          {(['all', 'live', 'scheduled', 'postponed', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                filterStatus === status ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
          Loading virtual lessons...
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <Video className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-900">No Virtual Lessons Found</div>
          <p className="text-xs text-slate-500">
            Click "SCHEDULE VIRTUAL LESSON" or "START INSTANT VIRTUAL LESSON" above to launch your first LiveKit classroom.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLessons.map((lesson) => {
            const countdown = getSecondsUntilIso(lesson.scheduledStartAt, nowMs);
            return (
              <div
                key={lesson.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-bold uppercase tracking-wider font-mono ${
                          lesson.status === 'live'
                            ? 'text-emerald-700'
                            : lesson.status === 'cancelled'
                            ? 'text-rose-700'
                            : lesson.status === 'postponed'
                            ? 'text-amber-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {lesson.status === 'live' ? 'LIVE CLASSROOM' : lesson.status.toUpperCase()}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-700">{lesson.gradeName}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600">{formatSchedulingModeLabel(lesson.schedulingMode)}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {lesson.scheduledDate} {lesson.startTime}–{lesson.endTime} EAT ({lesson.durationMinutes}m)
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {lesson.subjectName}: {lesson.title}
                    </h3>
                    <div className="text-xs text-slate-600">
                      Topic: <strong className="text-slate-800">{lesson.topic}</strong>
                      {lesson.subtopic ? ` (${lesson.subtopic})` : ''} · Streams:{' '}
                      <strong className="text-slate-800">
                        {lesson.streams.map((s) => s.displayName || s.name).join(', ')}
                      </strong>
                    </div>

                    {lesson.status === 'scheduled' && countdown > 0 && (
                      <div className="text-xs font-mono tabular-nums text-slate-700 flex items-center gap-1.5 pt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Starts in {formatCountdownSeconds(countdown)}</span>
                      </div>
                    )}
                  </div>

                  {/* Primary Lesson Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(lesson.status === 'scheduled' || lesson.status === 'postponed') && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await vcApiFetch(`/api/virtual-lessons/${lesson.id}/start`, { method: 'POST', body: JSON.stringify({}) });
                            showToast(`Started live classroom for ${lesson.title}`);
                            await loadData();
                            if (lesson.classrooms[0]) {
                              setActiveRoomLaunch({ lessonId: lesson.id, classroomId: lesson.classrooms[0].id });
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Class</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLesson(lesson);
                            setEditDate(lesson.scheduledDate);
                            setEditTime(lesson.startTime);
                            setEditDuration(lesson.durationMinutes);
                            setEditReason(lesson.postponedReason || '');
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Reschedule</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancellingLesson(lesson)}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleOpenAttendance(lesson)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Attendance ({lesson.attendanceSummary.presentCount + lesson.attendanceSummary.partialCount})</span>
                    </button>
                  </div>
                </div>

                {/* LiveKit Rooms Breakdown (Combined = 1 room, Separate = 1 room per stream) */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  {lesson.classrooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{room.title}</div>
                        <div className="text-[11px] text-slate-600 truncate">
                          Teacher: <strong>{room.assignedTeacherName}</strong> ·{' '}
                          <span className="font-mono tabular-nums">
                            {room.connectedCount}/{room.capacity}
                          </span>
                          {room.waitingCount > 0 ? ` · ${room.waitingCount} waiting` : ''}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          Room: {room.livekitRoomName}
                        </div>
                      </div>

                      {(room.roomStatus === 'live' || room.roomStatus === 'scheduled') && (
                        <button
                          type="button"
                          onClick={() => setActiveRoomLaunch({ lessonId: lesson.id, classroomId: room.id })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                            room.roomStatus === 'live'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {room.roomStatus === 'live' ? 'Enter Monitor Room' : 'Launch Room'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recordings Row */}
                {lesson.recordings.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-rose-600" />
                      <span>{lesson.recordings.length} Recording(s)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lesson.recordings.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200"
                        >
                          <span className="font-mono text-[11px]">
                            {rec.recordingStatus} ({rec.durationSeconds}s)
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Expires {rec.retentionUntil.slice(0, 10)}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              await vcApiFetch(`/api/virtual-lessons/recordings/${rec.id}`, { method: 'DELETE' });
                              showToast('Recording deleted under retention policy.');
                              await loadData();
                            }}
                            className="text-rose-600 hover:text-rose-800 cursor-pointer"
                            title="Delete Recording"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          MODAL: SCHEDULE / START INSTANT VIRTUAL LESSON
          ===================================================================== */}
      {modalMode && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'instant'
                    ? 'Start Instant LiveKit Virtual Lesson'
                    : 'Schedule Virtual Classroom Lesson'}
                </h3>
                <p className="text-xs text-slate-500">
                  {modalMode === 'instant'
                    ? 'Launches LiveKit rooms immediately and pushes live join cards to selected streams & teachers.'
                    : 'All times are validated in Africa/Nairobi (EAT). Maximum duration: 60 minutes.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLesson} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              {formErrors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                  {formErrors.map((er, idx) => (
                    <div key={idx}>• {er}</div>
                  ))}
                </div>
              )}

              {/* Section A: Lesson Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5">
                  Section A: Lesson Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Grade (Assigned)</label>
                    <select
                      value={gradeId}
                      onChange={(e) => setGradeId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900"
                    >
                      {meta?.grades.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.levelBand})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                    <select
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900"
                    >
                      {meta?.subjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lesson Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Algebraic Linear Equations"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Topic *</label>
                    <input
                      type="text"
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Solving One-Variable Equations"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subtopic (Optional)</label>
                    <input
                      type="text"
                      value={subtopic}
                      onChange={(e) => setSubtopic(e.target.value)}
                      placeholder="e.g. Word Problems & Balancing"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Learning Objectives *</label>
                    <input
                      type="text"
                      required
                      value={learningObjectives}
                      onChange={(e) => setLearningObjectives(e.target.value)}
                      placeholder="By the end of the lesson, learners should be able to..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Key Learning Points (>= 3 required) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">
                      Key Learning Points (Minimum 3 Required) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setKeyPoints((prev) => [...prev, ''])}
                      className="text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Point
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {keyPoints.map((pt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={pt}
                        onChange={(e) => {
                          const next = [...keyPoints];
                          next[idx] = e.target.value;
                          setKeyPoints(next);
                        }}
                        placeholder={`Key Point ${idx + 1}`}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Attached Materials / Resource Links (1 per line, Title | URL)
                    </label>
                    <textarea
                      rows={2}
                      value={resourcesText}
                      onChange={(e) => setResourcesText(e.target.value)}
                      placeholder="Worksheet PDF | https://edusmart.co.ke/files/algebra.pdf"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lesson Description / Notes</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Preparation instructions for learners before joining..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section B: Stream Selection & 4 Modes */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5">
                  Section B: Stream Selection & Room Architecture
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'individual_stream' as const,
                      title: 'Option 1: Individual Stream',
                      desc: '1 LiveKit room for one chosen stream.',
                    },
                    {
                      id: 'selected_streams_combined' as const,
                      title: 'Option 2: Selected Streams (Combined)',
                      desc: 'Selected streams share ONE single LiveKit classroom.',
                    },
                    {
                      id: 'all_streams_combined' as const,
                      title: 'Option 3: All Streams in Grade (Combined)',
                      desc: 'All active streams in this grade join ONE shared room.',
                    },
                    {
                      id: 'multiple_separate' as const,
                      title: 'Option 4: Multiple Separate Stream Classes',
                      desc: 'Creates independent LiveKit rooms, teachers & schedules per stream.',
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSchedulingMode(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        schedulingMode === opt.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="font-bold">{opt.title}</div>
                      <div className={`text-[11px] mt-0.5 ${schedulingMode === opt.id ? 'text-slate-300' : 'text-slate-500'}`}>
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Stream checkboxes / selectors */}
                {schedulingMode !== 'all_streams_combined' && (
                  <div className="space-y-2">
                    <div className="font-semibold text-slate-700">
                      {schedulingMode === 'individual_stream' ? 'Choose Stream:' : 'Select Streams:'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gradeStreams.map((st) => {
                        const checked = selectedStreamIds.includes(st.id);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              if (schedulingMode === 'individual_stream') {
                                setSelectedStreamIds([st.id]);
                              } else {
                                setSelectedStreamIds((prev) =>
                                  prev.includes(st.id) ? prev.filter((id) => id !== st.id) : [...prev, st.id]
                                );
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                              checked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {st.displayName} ({st.studentCount} learners)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Per-stream teacher & timing configuration for Option 4 */}
                {schedulingMode === 'multiple_separate' && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="font-bold text-slate-800">
                      Separate Room Schedule & Assigned Teacher Per Stream
                    </div>
                    {separateRows
                      .filter((r) => selectedStreamIds.includes(r.streamId))
                      .map((row) => {
                        const stObj = gradeStreams.find((s) => s.id === row.streamId);
                        return (
                          <div key={row.streamId} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
                            <div className="font-bold text-slate-900">
                              <div>{stObj?.displayName}</div>
                              {subjectTeacherByStreamId.get(row.streamId) && (
                                <div className="text-[10px] font-medium text-emerald-700">
                                  Subject Teacher: {subjectTeacherByStreamId.get(row.streamId)?.teacherName}
                                </div>
                              )}
                            </div>
                            <select
                              value={row.teacherId}
                              onChange={(e) =>
                                setSeparateRows((prev) =>
                                  prev.map((x) => (x.streamId === row.streamId ? { ...x, teacherId: e.target.value } : x))
                                )
                              }
                              className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                            >
                              {meta?.teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="date"
                              disabled={modalMode === 'instant'}
                              value={row.scheduledDate}
                              onChange={(e) =>
                                setSeparateRows((prev) =>
                                  prev.map((x) => (x.streamId === row.streamId ? { ...x, scheduledDate: e.target.value } : x))
                                )
                              }
                              className="px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                            />
                            <input
                              type="time"
                              disabled={modalMode === 'instant'}
                              value={row.startTime}
                              onChange={(e) =>
                                setSeparateRows((prev) =>
                                  prev.map((x) => (x.streamId === row.streamId ? { ...x, startTime: e.target.value } : x))
                                )
                              }
                              className="px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
                            />
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Section C: Scheduling Time */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5">
                  Section C: Scheduling Time (Africa/Nairobi EAT · Max 60 Mins)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lesson Date</label>
                    <input
                      type="date"
                      disabled={modalMode === 'instant'}
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Time (EAT)</label>
                    <input
                      type="time"
                      disabled={modalMode === 'instant'}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Duration (1–60 mins)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Math.min(60, Math.max(1, Number(e.target.value) || 40)))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Max Capacity</label>
                    <input
                      type="number"
                      min={2}
                      max={200}
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Math.max(2, Number(e.target.value) || 30))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Section D: Classroom Security & Co-Teachers */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5">
                  Section D: Classroom Controls & Co-Teacher Authorisation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lead Teacher (Combined Room Host)</label>
                    <select
                      value={leadTeacherId}
                      onChange={(e) => setLeadTeacherId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Myself (Senior Teacher Host)</option>
                      {meta?.teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.role.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Authorise Subject Co-Teachers</label>
                    <div className="max-h-24 overflow-y-auto border border-slate-300 rounded-lg p-2 space-y-1">
                      {meta?.teachers.map((t) => (
                        <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={coTeacherIds.includes(t.id)}
                            onChange={(e) =>
                              setCoTeacherIds((prev) =>
                                e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id)
                              )
                            }
                            className="w-3.5 h-3.5 rounded"
                          />
                          <span className="truncate">{t.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {[
                    { label: 'Enable Waiting Room', val: waitingRoomEnabled, set: setWaitingRoomEnabled },
                    { label: 'Enable Student Chat', val: studentChatEnabled, set: setStudentChatEnabled },
                    { label: 'Enable Recording', val: recordingEnabled, set: setRecordingEnabled },
                    { label: 'Student Cameras On Entry', val: studentCameraEnabled, set: setStudentCameraEnabled },
                    { label: 'Student Mics On Entry', val: studentMicEnabled, set: setStudentMicEnabled },
                    { label: 'Student Screen Share', val: studentScreenshareEnabled, set: setStudentScreenshareEnabled },
                    { label: 'Hands & Reactions', val: interactionEnabled, set: setInteractionEnabled },
                  ].map((item) => (
                    <label key={item.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.val}
                        onChange={(e) => item.set(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      <span className="font-medium text-slate-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : modalMode === 'instant'
                    ? 'Launch Instant LiveKit Classroom'
                    : 'Schedule & Notify Streams'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule / Postpone Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditPostpone} className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Reschedule / Postpone Lesson</h3>
            <p className="text-slate-600">{editingLesson.subjectName}: {editingLesson.title}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Date</label>
                <input type="date" required value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Time (EAT)</label>
                <input type="time" required value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duration (1–60 mins)</label>
              <input type="number" min={1} max={60} value={editDuration} onChange={(e) => setEditDuration(Math.min(60, Math.max(1, Number(e.target.value) || 40)))} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Rescheduling</label>
              <input type="text" value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="e.g. Assembly adjustment" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingLesson(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer">Close</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold cursor-pointer">Save & Notify</button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel Modal */}
      {cancellingLesson && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleConfirmCancel} className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Cancel Virtual Lesson</h3>
            <p className="text-slate-600">Students and subject teachers in target streams will receive an automated cancellation update.</p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cancellation Reason</label>
              <input type="text" required value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason..." className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCancellingLesson(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer">Back</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold cursor-pointer">Confirm Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Attendance Register Modal */}
      {attendanceLesson && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Attendance Register — {attendanceLesson.subjectName}: {attendanceLesson.title}
                </h3>
                <p className="text-xs text-slate-500">Verified via LiveKit room sessions & webhooks</p>
              </div>
              <div className="flex items-center gap-2">
                {attendanceRegister?.register && (
                  <button
                    type="button"
                    onClick={() =>
                      exportAttendanceRegisterCsv(
                        attendanceLesson.title,
                        attendanceLesson.subjectName,
                        attendanceLesson.scheduledDate,
                        attendanceRegister.register
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                )}
                <button type="button" onClick={() => setAttendanceLesson(null)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {!attendanceRegister ? (
                <div className="text-center py-8 text-slate-500">Loading verified register...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <th className="py-2 pr-3">Student</th>
                      <th className="py-2 px-3">Stream</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Duration</th>
                      <th className="py-2 pl-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceRegister.register.map((r: any) => (
                      <tr key={r.studentId}>
                        <td className="py-2.5 pr-3 font-semibold text-slate-900">{r.studentName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.streamName}</td>
                        <td className="py-2.5 px-3 font-bold uppercase text-[11px]">
                          <span
                            className={
                              r.attendanceStatus === 'present'
                                ? 'text-emerald-700'
                                : r.attendanceStatus === 'partial'
                                ? 'text-amber-700'
                                : 'text-slate-400'
                            }
                          >
                            {r.attendanceStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums">{r.totalAttendanceMinutes} mins</td>
                        <td className="py-2.5 pl-3 font-mono text-[11px] text-slate-500">{r.verifiedVia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active LiveKit Classroom Room Modal */}
      {activeRoomLaunch && (
        <LiveClassroomRoomModal
          lessonId={activeRoomLaunch.lessonId}
          classroomId={activeRoomLaunch.classroomId}
          onClose={() => {
            setActiveRoomLaunch(null);
            void loadData();
          }}
          onLessonUpdated={() => void loadData()}
        />
      )}
    </div>
  );
};
