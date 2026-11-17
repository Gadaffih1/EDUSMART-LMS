import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Lock,
  Power,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Unlock,
  Users,
  Video,
} from 'lucide-react';
import {
  type VirtualLessonItem,
  vcApiFetch,
} from './virtualClassroomTypes';
import { LiveClassroomRoomModal } from './LiveClassroomRoomModal';

interface MonitoringPayload {
  schoolId: string;
  policy: {
    defaultMaxCapacity: number;
    maxDurationMinutes: number;
    overlapPolicy: 'warn' | 'block';
    teacherConflictPolicy: 'warn' | 'block';
    defaultRecordingEnabled: boolean;
    defaultWaitingRoomEnabled: boolean;
    requirePaidPassOnly: boolean;
    weeklyLessonLimitDefault: number;
    recordingRetentionDays: number;
  };
  livekitStatus: {
    configured: boolean;
    missingKeys: string[];
  };
  metrics: {
    totalLessons: number;
    scheduledCount: number;
    liveCount: number;
    completedCount: number;
    cancelledCount: number;
    postponedCount: number;
    activeRoomsCount: number;
    activeStudentsCount: number;
    activeTeachersCount: number;
    totalEnrolledStudents: number;
    attendanceRatePct: number;
    roomUtilizationPct: number;
  };
  liveRooms: Array<{
    id: string;
    lesson_id: string;
    title: string;
    grade_name: string;
    subject_name: string;
    topic: string;
    coordinator_name: string;
    assigned_teacher_name: string;
    livekit_room_name: string;
    capacity: number;
    locked: number;
    connectedCount: number;
  }>;
  lessons: VirtualLessonItem[];
  subscriptions: Array<{
    id: string;
    student_id: string;
    student_name: string;
    student_email?: string | null;
    grade_label?: string | null;
    stream_label?: string | null;
    admission_number?: string | null;
    tier: string;
    approval_status: 'approved' | 'pending' | 'suspended' | 'expired';
    weekly_lesson_limit: number;
    lessons_used_this_week: number;
    expires_at?: string | null;
  }>;
}

export const AdminVirtualClassroomMonitor: React.FC = () => {
  const [data, setData] = useState<MonitoringPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'policies' | 'subscriptions'>('overview');
  const [monitorRoom, setMonitorRoom] = useState<{ lessonId: string; classroomId: string } | null>(null);

  // Policy draft state
  const [defaultMaxCapacity, setDefaultMaxCapacity] = useState(30);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(60);
  const [overlapPolicy, setOverlapPolicy] = useState<'warn' | 'block'>('warn');
  const [teacherConflictPolicy, setTeacherConflictPolicy] = useState<'warn' | 'block'>('warn');
  const [defaultRecordingEnabled, setDefaultRecordingEnabled] = useState(false);
  const [defaultWaitingRoomEnabled, setDefaultWaitingRoomEnabled] = useState(true);
  const [requirePaidPassOnly, setRequirePaidPassOnly] = useState(false);
  const [weeklyLessonLimitDefault, setWeeklyLessonLimitDefault] = useState(20);
  const [recordingRetentionDays, setRecordingRetentionDays] = useState(30);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const loadMonitoring = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vcApiFetch<MonitoringPayload>('/api/virtual-lessons/admin/monitoring');
      setData(res);
      setDefaultMaxCapacity(res.policy.defaultMaxCapacity);
      setMaxDurationMinutes(res.policy.maxDurationMinutes);
      setOverlapPolicy(res.policy.overlapPolicy);
      setTeacherConflictPolicy(res.policy.teacherConflictPolicy);
      setDefaultRecordingEnabled(res.policy.defaultRecordingEnabled);
      setDefaultWaitingRoomEnabled(res.policy.defaultWaitingRoomEnabled);
      setRequirePaidPassOnly(res.policy.requirePaidPassOnly);
      setWeeklyLessonLimitDefault(res.policy.weeklyLessonLimitDefault);
      setRecordingRetentionDays(res.policy.recordingRetentionDays);
    } catch (err: any) {
      setError(err?.message || 'Unable to load school-wide virtual classroom monitoring.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMonitoring();
    const onSse = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || detail.key === 'edusmart_virtual_lessons_v1' || detail.key === '*') {
        void loadMonitoring();
      }
    };
    window.addEventListener('edusmart:data-changed', onSse);
    return () => window.removeEventListener('edusmart:data-changed', onSse);
  }, [loadMonitoring]);

  const handleToggleLock = async (lessonId: string, classroomId: string, currentlyLocked: boolean) => {
    try {
      await vcApiFetch(`/api/virtual-lessons/${lessonId}/${currentlyLocked ? 'unlock' : 'lock'}`, {
        method: 'POST',
        body: JSON.stringify({ classroomId }),
      });
      setToast(currentlyLocked ? 'Classroom unlocked.' : 'Classroom locked.');
      await loadMonitoring();
    } catch (err: any) {
      setError(err?.message || 'Action failed.');
    }
  };

  const handleEndClassroom = async (lessonId: string, classroomId: string) => {
    try {
      await vcApiFetch(`/api/virtual-lessons/${lessonId}/end`, {
        method: 'POST',
        body: JSON.stringify({ classroomId }),
      });
      setToast('Classroom terminated and attendance finalized.');
      await loadMonitoring();
    } catch (err: any) {
      setError(err?.message || 'Unable to end classroom.');
    }
  };

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    setError(null);
    try {
      await vcApiFetch('/api/virtual-lessons/admin/policies', {
        method: 'PUT',
        body: JSON.stringify({
          defaultMaxCapacity,
          maxDurationMinutes,
          overlapPolicy,
          teacherConflictPolicy,
          defaultRecordingEnabled,
          defaultWaitingRoomEnabled,
          requirePaidPassOnly,
          weeklyLessonLimitDefault,
          recordingRetentionDays,
        }),
      });
      setToast('School-wide LiveKit virtual classroom policies saved.');
      await loadMonitoring();
    } catch (err: any) {
      setError(err?.message || 'Failed to save virtual classroom policies.');
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleUpdateSubscription = async (
    studentId: string,
    updates: {
      approvalStatus: 'approved' | 'pending' | 'suspended' | 'expired';
      weeklyLessonLimit: number;
      lessonsUsedThisWeek: number;
      tier: string;
    }
  ) => {
    try {
      await vcApiFetch(`/api/virtual-lessons/admin/subscriptions/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setToast('Student Digital Class entitlement updated.');
      await loadMonitoring();
    } catch (err: any) {
      setError(err?.message || 'Failed to update subscription.');
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      await vcApiFetch(`/api/virtual-lessons/recordings/${recordingId}`, { method: 'DELETE' });
      setToast('Recording metadata deleted.');
      await loadMonitoring();
    } catch (err: any) {
      setError(err?.message || 'Unable to delete recording.');
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">VIRTUAL CLASSROOM MONITORING</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            School-wide visibility and governance over LiveKit virtual classrooms, teacher &amp; student participation, attendance, policies, and student digital quotas.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {data && (
            <span
              className={`text-xs font-mono font-bold ${
                data.livekitStatus.configured ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {data.livekitStatus.configured
                ? 'LiveKit SFU Ready'
                : `Missing Env: ${data.livekitStatus.missingKeys.join(', ')}`}
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadMonitoring()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-emerald-700 font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Strip */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Scheduled', value: data.metrics.scheduledCount, tone: 'text-slate-900' },
            { label: 'Live Now', value: data.metrics.liveCount, tone: 'text-emerald-700' },
            { label: 'Active Students', value: data.metrics.activeStudentsCount, tone: 'text-slate-900' },
            { label: 'Active Teachers', value: data.metrics.activeTeachersCount, tone: 'text-slate-900' },
            { label: 'Attendance %', value: `${data.metrics.attendanceRatePct}%`, tone: 'text-emerald-700' },
            { label: 'Completed', value: data.metrics.completedCount, tone: 'text-slate-900' },
            { label: 'Cancelled', value: data.metrics.cancelledCount, tone: 'text-rose-700' },
            { label: 'Utilisation', value: `${data.metrics.roomUtilizationPct}%`, tone: 'text-slate-900' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-500">{kpi.label}</div>
              <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${kpi.tone}`}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {[
          { id: 'overview' as const, label: `Live Rooms (${data?.liveRooms.length ?? 0})` },
          { id: 'lessons' as const, label: `All Grade Lessons & Recordings (${data?.lessons.length ?? 0})` },
          { id: 'policies' as const, label: 'Policies & Capacity Limits' },
          { id: 'subscriptions' as const, label: `Student Digital Quotas (${data?.subscriptions.length ?? 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Active Live Rooms */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-600" />
              <span>Active LiveKit Classrooms</span>
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {data?.liveRooms.length ?? 0} live rooms
            </span>
          </div>

          {!data || data.liveRooms.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No live virtual classrooms are currently active across school grades.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Room Title &amp; Topic</th>
                    <th className="py-3 px-4">Grade &amp; Coordinator</th>
                    <th className="py-3 px-4">Lead Teacher</th>
                    <th className="py-3 px-4">LiveKit Room ID</th>
                    <th className="py-3 px-4 text-right">Capacity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.liveRooms.map((room) => (
                    <tr key={room.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{room.title}</div>
                        <div className="text-slate-500">
                          {room.subject_name} · {room.topic}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{room.grade_name}</div>
                        <div className="text-slate-500">{room.coordinator_name}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{room.assigned_teacher_name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{room.livekit_room_name}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {room.connectedCount} / {room.capacity}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setMonitorRoom({ lessonId: room.lesson_id, classroomId: room.id })}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Monitor Room</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleLock(room.lesson_id, room.id, Boolean(room.locked))}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {room.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{room.locked ? 'Unlock' : 'Lock'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleEndClassroom(room.lesson_id, room.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>End</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Lessons & Recordings */}
      {activeTab === 'lessons' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {!data || data.lessons.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">No virtual lessons scheduled yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Grade &amp; Lesson</th>
                    <th className="py-3 px-4">Coordinator &amp; Streams</th>
                    <th className="py-3 px-4">Schedule (EAT)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Attendance</th>
                    <th className="py-3 px-4">Recordings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.lessons.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {l.gradeName} · {l.subjectName}: {l.title}
                        </div>
                        <div className="text-slate-500">{l.topic}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{l.coordinatorName}</div>
                        <div className="text-slate-500">{l.streams.map((s) => s.name).join(', ')}</div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {l.scheduledDate} · {l.startTime}–{l.endTime} ({l.durationMinutes}m)
                      </td>
                      <td className="py-3 px-4 uppercase font-bold text-[11px]">{l.status}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {l.attendanceSummary.presentCount}P / {l.attendanceSummary.partialCount}Pt (
                        {l.attendanceSummary.totalRecorded})
                      </td>
                      <td className="py-3 px-4">
                        {l.recordings && l.recordings.length > 0 ? (
                          <div className="space-y-1">
                            {l.recordings.map((rec) => (
                              <div key={rec.id} className="flex items-center gap-2 font-mono text-[11px]">
                                <span>{rec.recordingStatus}</span>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteRecording(rec.id)}
                                  className="text-rose-600 hover:text-rose-800 cursor-pointer"
                                  title="Delete recording metadata"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Policies & Capacity Configuration */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSavePolicies} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
            <Settings className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">School-Wide Virtual Classroom Configuration &amp; Limits</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Room Capacity (Participants)</label>
              <input
                type="number"
                min={5}
                max={200}
                value={defaultMaxCapacity}
                onChange={(e) => setDefaultMaxCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Lesson Duration (Hard Limit: 60 mins)</label>
              <input
                type="number"
                min={15}
                max={60}
                value={maxDurationMinutes}
                onChange={(e) => setMaxDurationMinutes(Math.min(60, Math.max(15, Number(e.target.value))))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Weekly Student Quota</label>
              <input
                type="number"
                min={1}
                max={100}
                value={weeklyLessonLimitDefault}
                onChange={(e) => setWeeklyLessonLimitDefault(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stream Schedule Overlap Policy</label>
              <select
                value={overlapPolicy}
                onChange={(e) => setOverlapPolicy(e.target.value as 'warn' | 'block')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="warn">Warn coordinator on stream overlap</option>
                <option value="block">Block overlapping stream lessons</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Teacher Double-Booking Policy</label>
              <select
                value={teacherConflictPolicy}
                onChange={(e) => setTeacherConflictPolicy(e.target.value as 'warn' | 'block')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="warn">Warn coordinator on teacher conflict</option>
                <option value="block">Block conflicting teacher assignments</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recording Retention (Days)</label>
              <input
                type="number"
                min={7}
                max={365}
                value={recordingRetentionDays}
                onChange={(e) => setRecordingRetentionDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={defaultWaitingRoomEnabled}
                onChange={(e) => setDefaultWaitingRoomEnabled(e.target.checked)}
              />
              <span className="font-semibold text-slate-800">Enable Waiting Room by default</span>
            </label>

            <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={defaultRecordingEnabled}
                onChange={(e) => setDefaultRecordingEnabled(e.target.checked)}
              />
              <span className="font-semibold text-slate-800">Enable Egress Recording by default</span>
            </label>

            <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={requirePaidPassOnly}
                onChange={(e) => setRequirePaidPassOnly(e.target.checked)}
              />
              <span className="font-semibold text-slate-800">Require explicit paid subscription pass</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPolicy}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingPolicy ? 'Saving...' : 'Save School Policy'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Student Digital Subscriptions */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Student Digital Class Subscriptions &amp; Weekly Quotas</h3>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Records auto-created on student room join or updated below
            </span>
          </div>

          {!data || data.subscriptions.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No explicit student Digital Class subscription overrides recorded yet. School policy defaults apply automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class / Adm No</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Weekly Quota Used / Limit</th>
                    <th className="py-3 px-4 text-right">Quick Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sub.student_name}</div>
                        <div className="text-slate-500">{sub.student_email || sub.student_id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>
                          {sub.grade_label || '-'} {sub.stream_label || ''}
                        </div>
                        <div className="font-mono text-[11px]">{sub.admission_number || '-'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{sub.tier}</td>
                      <td className="py-3 px-4 uppercase font-bold text-[11px]">{sub.approval_status}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {sub.lessons_used_this_week} / {sub.weekly_lesson_limit}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void handleUpdateSubscription(sub.student_id, {
                                approvalStatus: sub.approval_status === 'approved' ? 'suspended' : 'approved',
                                weeklyLessonLimit: sub.weekly_lesson_limit,
                                lessonsUsedThisWeek: sub.lessons_used_this_week,
                                tier: sub.tier,
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                              sub.approval_status === 'approved'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {sub.approval_status === 'approved' ? 'Suspend Access' : 'Approve Access'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleUpdateSubscription(sub.student_id, {
                                approvalStatus: 'approved',
                                weeklyLessonLimit: sub.weekly_lesson_limit + 5,
                                lessonsUsedThisWeek: sub.lessons_used_this_week,
                                tier: sub.tier,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            +5 Weekly Quota
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {monitorRoom && (
        <LiveClassroomRoomModal
          lessonId={monitorRoom.lessonId}
          classroomId={monitorRoom.classroomId}
          onClose={() => {
            setMonitorRoom(null);
            void loadMonitoring();
          }}
          onLessonUpdated={() => void loadMonitoring()}
        />
      )}
    </section>
  );
};
