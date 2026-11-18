import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  Lock,
  Play,
  Radio,
  RefreshCw,
  Video,
} from 'lucide-react';
import {
  type VirtualLessonItem,
  type VirtualLessonNotification,
  formatCountdownSeconds,
  getSecondsUntilIso,
  vcApiFetch,
} from './virtualClassroomTypes';
import { LiveClassroomRoomModal } from './LiveClassroomRoomModal';
import { VirtualLabSubscriptionModal } from '../virtuallab/VirtualLabSubscriptionModal';

interface StudentVirtualClassroomPanelProps {
  compactBannerOnly?: boolean;
  onOpenFullTab?: () => void;
}

export const StudentVirtualClassroomPanel: React.FC<StudentVirtualClassroomPanelProps> = ({
  compactBannerOnly = false,
  onOpenFullTab,
}) => {
  const [lessons, setLessons] = useState<VirtualLessonItem[]>([]);
  const [notifications, setNotifications] = useState<VirtualLessonNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [sectionTab, setSectionTab] = useState<'live_upcoming' | 'completed' | 'recordings'>('live_upcoming');

  const [joiningRoom, setJoiningRoom] = useState<{ lessonId: string; classroomId?: string } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vcApiFetch<{
        lessons: VirtualLessonItem[];
        notifications: VirtualLessonNotification[];
      }>('/api/virtual-lessons');
      setLessons(data.lessons || []);
      setNotifications(data.notifications || []);
    } catch {
      // keep silent in banner if loading
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLessons();
    const onSse = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || detail.key === 'edusmart_virtual_lessons_v1' || detail.key === '*') {
        void loadLessons();
      }
    };
    window.addEventListener('edusmart:data-changed', onSse);
    return () => window.removeEventListener('edusmart:data-changed', onSse);
  }, [loadLessons]);

  const liveLessons = useMemo(() => lessons.filter((l) => l.status === 'live'), [lessons]);
  const upcomingLessons = useMemo(
    () => lessons.filter((l) => l.status === 'scheduled' || l.status === 'postponed'),
    [lessons]
  );
  const completedLessons = useMemo(
    () => lessons.filter((l) => l.status === 'completed' || l.status === 'cancelled'),
    [lessons]
  );
  const recordedLessons = useMemo(
    () => lessons.filter((l) => l.recordings && l.recordings.length > 0),
    [lessons]
  );

  const subscriptionSummary = lessons[0]?.mySubscription;

  const handleJoinClick = (lesson: VirtualLessonItem) => {
    const room = lesson.classrooms[0];
    if (lesson.mySubscription && !lesson.mySubscription.allowed) {
      setSubscriptionNotice(lesson.mySubscription.reason || 'Active Digital Class subscription required.');
      setShowSubscriptionModal(true);
      return;
    }
    setJoiningRoom({ lessonId: lesson.id, classroomId: room?.id });
  };

  if (compactBannerOnly) {
    if (liveLessons.length === 0 && upcomingLessons.length === 0) return null;

    return (
      <div className="space-y-3">
        {liveLessons.map((lesson) => (
          <div
            key={lesson.id}
            className="bg-emerald-950 text-white border border-emerald-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>VIRTUAL CLASSROOM IS NOW LIVE!</span>
              </div>
              <div className="text-sm font-bold text-white truncate">
                {lesson.subjectName}: {lesson.topic} — {lesson.title}
              </div>
              <div className="text-xs text-emerald-200/90">
                Teacher: {lesson.classrooms[0]?.assignedTeacherName || lesson.coordinatorName} ·{' '}
                {lesson.streams.map((s) => s.displayName || s.name).join(', ')}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleJoinClick(lesson)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>JOIN CLASS</span>
              </button>
              {onOpenFullTab && (
                <button
                  type="button"
                  onClick={onOpenFullTab}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  All Classes
                </button>
              )}
            </div>
          </div>
        ))}

        {liveLessons.length === 0 && upcomingLessons.slice(0, 1).map((lesson) => {
          const countdown = getSecondsUntilIso(lesson.scheduledStartAt, nowMs);
          return (
            <div
              key={lesson.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{lesson.status === 'postponed' ? 'VIRTUAL LESSON POSTPONED' : 'VIRTUAL LESSON SCHEDULED'}</span>
                </div>
                <div className="text-sm font-bold text-slate-900 truncate">
                  {lesson.subjectName}: {lesson.topic}
                </div>
                <div className="text-xs text-slate-600 font-mono tabular-nums">
                  {lesson.scheduledDate} at {lesson.startTime} EAT ({lesson.durationMinutes} mins)
                  {countdown > 0 ? ` · Starts in ${formatCountdownSeconds(countdown)}` : ''}
                </div>
              </div>
              {onOpenFullTab && (
                <button
                  type="button"
                  onClick={onOpenFullTab}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open My Virtual Classrooms
                </button>
              )}
            </div>
          );
        })}

        {joiningRoom && (
          <LiveClassroomRoomModal
            lessonId={joiningRoom.lessonId}
            classroomId={joiningRoom.classroomId}
            onClose={() => {
              setJoiningRoom(null);
              void loadLessons();
            }}
            onRequestPayment={(reason) => {
              setJoiningRoom(null);
              setSubscriptionNotice(reason);
              setShowSubscriptionModal(true);
            }}
            onLessonUpdated={() => void loadLessons()}
          />
        )}

        <VirtualLabSubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSubscriptionSuccess={() => {
            setShowSubscriptionModal(false);
            setSubscriptionNotice(null);
            void loadLessons();
          }}
        />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">MY VIRTUAL CLASSROOMS</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Live and scheduled LiveKit lessons strictly personalized for your stream. Join active sessions directly when your teacher starts class.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {subscriptionSummary && (
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">Weekly Quota: </span>
              <strong className="font-mono tabular-nums text-slate-900">
                {subscriptionSummary.remainingWeeklyLessons}/{subscriptionSummary.weeklyLessonLimit} left
              </strong>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSubscriptionModal(true)}
            className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Digital Class Pass</span>
          </button>

          <button
            type="button"
            onClick={() => void loadLessons()}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {subscriptionNotice && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{subscriptionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSubscriptionModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold shrink-0 cursor-pointer"
          >
            Activate Subscription
          </button>
        </div>
      )}

      {/* Section Switcher */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {[
          { id: 'live_upcoming' as const, label: `Live & Upcoming (${liveLessons.length + upcomingLessons.length})` },
          { id: 'completed' as const, label: `Completed & Attendance (${completedLessons.length})` },
          { id: 'recordings' as const, label: `Recorded Lessons (${recordedLessons.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSectionTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              sectionTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Live & Upcoming Section */}
      {sectionTab === 'live_upcoming' && (
        <div className="space-y-4">
          {liveLessons.length === 0 && upcomingLessons.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <Video className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-900">No Upcoming or Live Virtual Lessons</div>
              <p className="text-xs text-slate-500">
                When your Senior Teacher schedules a lesson for your stream, it will appear right here with live countdown and entry button.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...liveLessons, ...upcomingLessons].map((lesson) => {
                const isLive = lesson.status === 'live';
                const room = lesson.classrooms[0];
                const countdown = getSecondsUntilIso(lesson.scheduledStartAt, nowMs);
                return (
                  <div
                    key={lesson.id}
                    className={`rounded-2xl border p-5 space-y-4 ${
                      isLive ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isLive ? 'text-emerald-700' : lesson.status === 'postponed' ? 'text-amber-700' : 'text-slate-600'
                          }`}
                        >
                          {isLive
                            ? 'VIRTUAL CLASSROOM IS NOW LIVE!'
                            : lesson.status === 'postponed'
                            ? 'VIRTUAL LESSON POSTPONED'
                            : 'VIRTUAL LESSON SCHEDULED'}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          {lesson.subjectName}: {lesson.title}
                        </h3>
                        <div className="text-xs text-slate-600 mt-0.5">Topic: {lesson.topic}</div>
                      </div>
                      {room?.locked && (
                        <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <div>
                        <span className="text-slate-500">Teacher:</span>{' '}
                        <strong className="text-slate-900">{room?.assignedTeacherName || lesson.coordinatorName}</strong>
                      </div>
                      <div className="font-mono tabular-nums">
                        <span className="text-slate-500">Time:</span>{' '}
                        <strong className="text-slate-900">{lesson.startTime}–{lesson.endTime} EAT</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Date:</span>{' '}
                        <strong className="text-slate-900 font-mono">{lesson.scheduledDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Duration:</span>{' '}
                        <strong className="text-slate-900 font-mono">{lesson.durationMinutes} mins</strong>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <strong className="text-slate-800">Objectives:</strong> {lesson.learningObjectives}
                    </div>

                    {isLive ? (
                      <button
                        type="button"
                        onClick={() => handleJoinClick(lesson)}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        <span>JOIN CLASS</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="font-mono tabular-nums text-slate-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {countdown > 0 ? `Starts in ${formatCountdownSeconds(countdown)}` : 'Waiting for teacher to start'}
                        </span>
                        <span className="text-slate-500">Auto-activates when live</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed Section */}
      {sectionTab === 'completed' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {completedLessons.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No completed lessons yet.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Subject & Topic</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">My Attendance</th>
                  <th className="py-3 px-4">Duration Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedLessons.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{l.subjectName}: {l.title}</div>
                      <div className="text-slate-500">{l.topic}</div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {l.scheduledDate} · {l.startTime}
                    </td>
                    <td className="py-3 px-4 uppercase font-bold text-[11px]">{l.status}</td>
                    <td className="py-3 px-4 uppercase font-bold text-[11px]">
                      <span
                        className={
                          l.myAttendance?.attendance_status === 'present'
                            ? 'text-emerald-700'
                            : l.myAttendance?.attendance_status === 'partial'
                            ? 'text-amber-700'
                            : 'text-slate-400'
                        }
                      >
                        {l.myAttendance?.attendance_status || 'absent'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      {l.myAttendance?.total_attendance_minutes ?? 0} mins
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Recordings Section */}
      {sectionTab === 'recordings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          {recordedLessons.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No recorded virtual lessons available for your stream yet.</div>
          ) : (
            recordedLessons.map((l) => (
              <div key={l.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-slate-900">{l.subjectName}: {l.title}</div>
                  <div className="text-slate-500">{l.scheduledDate} · {l.topic}</div>
                </div>
                <div className="flex items-center gap-2">
                  {l.recordings.map((r) => (
                    <span key={r.id} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px]">
                      {r.recordingStatus} · {r.durationSeconds}s
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recent Lesson Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recent Virtual Classroom Notifications</span>
          </h3>
          <div className="space-y-2">
            {notifications.slice(0, 6).map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">{n.title}</div>
                  <div className="text-slate-600 mt-0.5">{n.message}</div>
                </div>
                <span className="font-mono text-[10px] text-slate-500 shrink-0">{n.scheduled_date} {n.start_time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {joiningRoom && (
        <LiveClassroomRoomModal
          lessonId={joiningRoom.lessonId}
          classroomId={joiningRoom.classroomId}
          onClose={() => {
            setJoiningRoom(null);
            void loadLessons();
          }}
          onRequestPayment={(reason) => {
            setJoiningRoom(null);
            setSubscriptionNotice(reason);
            setShowSubscriptionModal(true);
          }}
          onLessonUpdated={() => void loadLessons()}
        />
      )}

      <VirtualLabSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={() => {
          setShowSubscriptionModal(false);
          setSubscriptionNotice(null);
          void loadLessons();
        }}
      />
    </section>
  );
};
