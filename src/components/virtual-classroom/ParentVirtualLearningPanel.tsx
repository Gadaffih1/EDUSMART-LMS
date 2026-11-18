import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Film,
  RefreshCw,
  Users,
  Video,
} from 'lucide-react';
import {
  type VirtualLessonItem,
  type VirtualLessonNotification,
  formatCountdownSeconds,
  getSecondsUntilIso,
  vcApiFetch,
} from './virtualClassroomTypes';
import { VirtualLabSubscriptionModal } from '../virtuallab/VirtualLabSubscriptionModal';

interface ParentVirtualLearningPanelProps {
  selectedChildId: string; // 'all' or specific child ID
  onOpenPayment?: (childId?: string) => void;
}

export const ParentVirtualLearningPanel: React.FC<ParentVirtualLearningPanelProps> = ({
  selectedChildId,
  onOpenPayment,
}) => {
  const [lessons, setLessons] = useState<VirtualLessonItem[]>([]);
  const [notifications, setNotifications] = useState<VirtualLessonNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'live_upcoming' | 'completed' | 'recordings'>('all');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [showPassModal, setShowPassModal] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vcApiFetch<{
        lessons: VirtualLessonItem[];
        notifications: VirtualLessonNotification[];
      }>('/api/virtual-lessons');
      setLessons(res.lessons || []);
      setNotifications(res.notifications || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load children virtual learning schedule.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Extract unique children summaries from hydrated parent lesson data
  const childSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        streamId: string | null;
        subscription: NonNullable<VirtualLessonItem['childrenProgress']>[number]['subscription'];
        presentCount: number;
        partialCount: number;
        totalMinutes: number;
      }
    >();

    for (const lesson of lessons) {
      for (const cp of lesson.childrenProgress || []) {
        if (selectedChildId !== 'all' && cp.studentId !== selectedChildId) continue;
        // Only count lessons matching this child's stream if stream is known
        const matchesChildStream =
          !cp.streamId || lesson.streams.some((s) => s.streamId === cp.streamId);
        if (!matchesChildStream) continue;

        const existing = map.get(cp.studentId) || {
          studentId: cp.studentId,
          studentName: cp.studentName,
          streamId: cp.streamId,
          subscription: cp.subscription,
          presentCount: 0,
          partialCount: 0,
          totalMinutes: 0,
        };
        if (cp.attendance?.attendance_status === 'present') {
          existing.presentCount += 1;
        } else if (cp.attendance?.attendance_status === 'partial') {
          existing.partialCount += 1;
        }
        existing.totalMinutes += Number(cp.attendance?.total_attendance_minutes || 0);
        map.set(cp.studentId, existing);
      }
    }
    return Array.from(map.values());
  }, [lessons, selectedChildId]);

  // Filter lessons matching selectedChildId + statusFilter
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (selectedChildId !== 'all') {
        const childEntry = (lesson.childrenProgress || []).find((c) => c.studentId === selectedChildId);
        if (childEntry?.streamId && !lesson.streams.some((s) => s.streamId === childEntry.streamId)) {
          return false;
        }
      }
      if (statusFilter === 'live_upcoming') {
        return lesson.status === 'live' || lesson.status === 'scheduled' || lesson.status === 'postponed';
      }
      if (statusFilter === 'completed') {
        return lesson.status === 'completed' || lesson.status === 'cancelled';
      }
      if (statusFilter === 'recordings') {
        return (lesson.recordings || []).length > 0;
      }
      return true;
    });
  }, [lessons, selectedChildId, statusFilter]);

  return (
    <section className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">MY CHILDREN&apos;S VIRTUAL LEARNING</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Track live and upcoming LiveKit virtual lessons, verified attendance durations, Digital Class pass quotas, and authorized class recordings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onOpenPayment) {
                onOpenPayment(selectedChildId !== 'all' ? selectedChildId : undefined);
              } else {
                setShowPassModal(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pay / Renew Digital Class Pass</span>
          </button>

          <button
            type="button"
            onClick={() => void loadData()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Per-Child Digital Class Subscription & Attendance Strip */}
      {childSummaries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {childSummaries.map((child) => {
            const sub = child.subscription;
            const restricted = !sub.allowed;
            return (
              <div
                key={child.studentId}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Learner Digital Class Account</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{child.studentName}</h3>
                  </div>

                  <span
                    className={`text-xs font-bold uppercase ${
                      restricted ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {sub.approvalStatus}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <div className="text-slate-500">Weekly Quota Left</div>
                    <div className="font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                      {sub.remainingWeeklyLessons} / {sub.weeklyLessonLimit}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Present / Partial</div>
                    <div className="font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                      {child.presentCount} / {child.partialCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Total Minutes</div>
                    <div className="font-mono tabular-nums font-bold text-slate-900 mt-0.5">
                      {child.totalMinutes} mins
                    </div>
                  </div>
                </div>

                {restricted && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                    <span>{sub.reason || 'Subscription renewal required for virtual class access.'}</span>
                    <button
                      type="button"
                      onClick={() => setShowPassModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Renew Now
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {[
          { id: 'all' as const, label: `All Lessons (${lessons.length})` },
          {
            id: 'live_upcoming' as const,
            label: `Live & Upcoming (${lessons.filter((l) => l.status === 'live' || l.status === 'scheduled' || l.status === 'postponed').length})`,
          },
          {
            id: 'completed' as const,
            label: `Completed (${lessons.filter((l) => l.status === 'completed' || l.status === 'cancelled').length})`,
          },
          {
            id: 'recordings' as const,
            label: `Recordings (${lessons.filter((l) => (l.recordings || []).length > 0).length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lessons Feed */}
      {loading && lessons.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-3">
          <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="h-16 w-full bg-slate-100 rounded animate-pulse" />
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <Video className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-900">No Virtual Classroom Sessions Found</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Scheduled LiveKit classes, verified child attendance records, and authorized lesson recordings will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLessons.map((lesson) => {
            const countdown = getSecondsUntilIso(lesson.scheduledStartAt, nowMs);
            const relevantChildren = (lesson.childrenProgress || []).filter((c) => {
              if (selectedChildId !== 'all' && c.studentId !== selectedChildId) return false;
              return !c.streamId || lesson.streams.some((s) => s.streamId === c.streamId);
            });

            return (
              <div key={lesson.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 font-mono">
                      <span
                        className={`font-bold uppercase ${
                          lesson.status === 'live'
                            ? 'text-emerald-700'
                            : lesson.status === 'cancelled'
                            ? 'text-rose-700'
                            : lesson.status === 'postponed'
                            ? 'text-amber-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {lesson.status}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{lesson.gradeName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lesson.streams.map((s) => s.displayName || s.name).join(', ')}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {lesson.subjectName}: {lesson.title}
                    </h3>
                    <div className="text-xs text-slate-600 mt-0.5">Topic: {lesson.topic}</div>
                  </div>

                  <div className="text-right text-xs font-mono tabular-nums text-slate-600 shrink-0">
                    <div>{lesson.scheduledDate}</div>
                    <div>
                      {lesson.startTime}–{lesson.endTime} EAT
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <div>
                    Senior Coordinator: <strong className="text-slate-900">{lesson.coordinatorName}</strong>
                  </div>
                  <div>
                    Room Teacher:{' '}
                    <strong className="text-slate-900">
                      {lesson.classrooms[0]?.assignedTeacherName || lesson.coordinatorName}
                    </strong>
                  </div>
                  {lesson.status === 'scheduled' && countdown > 0 && (
                    <div className="font-mono tabular-nums text-emerald-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Starts in {formatCountdownSeconds(countdown)}</span>
                    </div>
                  )}
                </div>

                {/* Child Attendance Rows for this lesson */}
                {relevantChildren.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Child Attendance & Access</div>
                    {relevantChildren.map((cp) => {
                      const attStatus = cp.attendance?.attendance_status || (lesson.status === 'completed' ? 'absent' : 'pending');
                      const mins = Number(cp.attendance?.total_attendance_minutes || 0);
                      return (
                        <div
                          key={cp.studentId}
                          className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-slate-100 last:border-b-0"
                        >
                          <div className="font-semibold text-slate-900">{cp.studentName}</div>
                          <div className="flex items-center gap-3 font-mono tabular-nums">
                            <span className="text-slate-500">{mins} mins</span>
                            <span
                              className={`font-bold uppercase ${
                                attStatus === 'present'
                                  ? 'text-emerald-700'
                                  : attStatus === 'partial'
                                  ? 'text-amber-700'
                                  : attStatus === 'absent'
                                  ? 'text-rose-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {attStatus}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Authorized Recordings */}
                {lesson.recordings && lesson.recordings.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-slate-500" />
                      <span>Recorded Lesson Replay</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lesson.recordings.map((rec) => (
                        <div
                          key={rec.id}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-mono tabular-nums">
                            {rec.recordingStatus} · {rec.durationSeconds}s
                          </span>
                          {rec.recordingUrl && (
                            <a
                              href={rec.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 font-bold underline"
                            >
                              Watch
                            </a>
                          )}
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

      {/* Recent Lesson Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Virtual Classroom Schedule Alerts ({notifications.length})</span>
          </h3>
          <div className="space-y-2">
            {notifications.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-900">{n.title}</div>
                  <div className="text-slate-600 mt-0.5">{n.message}</div>
                </div>
                <span className="font-mono tabular-nums text-[11px] text-slate-500 shrink-0">
                  {n.scheduled_date} {n.start_time} EAT
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <VirtualLabSubscriptionModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        onSubscriptionSuccess={() => {
          setShowPassModal(false);
          void loadData();
        }}
      />
    </section>
  );
};
