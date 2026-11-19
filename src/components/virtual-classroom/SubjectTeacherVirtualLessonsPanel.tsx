import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Play,
  RefreshCw,
  Users,
  Video,
} from 'lucide-react';
import {
  type VirtualLessonItem,
  type VirtualLessonNotification,
  vcApiFetch,
} from './virtualClassroomTypes';
import { LiveClassroomRoomModal } from './LiveClassroomRoomModal';

export const SubjectTeacherVirtualLessonsPanel: React.FC = () => {
  const [lessons, setLessons] = useState<VirtualLessonItem[]>([]);
  const [notifications, setNotifications] = useState<VirtualLessonNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<{ lessonId: string; classroomId?: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vcApiFetch<{
        lessons: VirtualLessonItem[];
        notifications: VirtualLessonNotification[];
      }>('/api/virtual-lessons?viewAs=teacher');
      setLessons(res.lessons || []);
      setNotifications(res.notifications || []);
    } catch {
      // ignore transient error
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

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Grade Virtual Classroom Schedule & Notifications</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Automated LiveKit virtual lesson alerts for your assigned grades and streams. Launch rooms you lead or join as an authorised co-teacher.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
          {toast}
        </div>
      )}

      {/* Teacher Notifications Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>Grade Lesson Notifications ({notifications.length})</span>
          </h3>
          {unreadCount > 0 && (
            <span className="text-xs font-mono font-bold text-rose-700">{unreadCount} unread</span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-xs text-slate-500 py-4">No grade virtual lesson notifications yet.</div>
        ) : (
          <div className="space-y-2.5">
            {notifications.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !n.read_at ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    {n.isCoTeacher && (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Authorised Co-Teacher / Host
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600">{n.message}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Coordinator: {n.coordinator_name} · {n.scheduled_date} {n.start_time} EAT ({n.duration_minutes} mins) · Status: {n.classroom_status.toUpperCase()}
                  </div>
                </div>

                {!n.read_at && (
                  <button
                    type="button"
                    onClick={async () => {
                      await vcApiFetch(`/api/virtual-lessons/notifications/${n.id}/read`, { method: 'POST' });
                      await loadData();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned & Grade Virtual Classrooms List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Grade Virtual Classrooms ({lessons.length})
        </h3>

        {lessons.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
            No scheduled or live virtual lessons for your assigned grades yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lessons.map((lesson) => {
              const canJoinOrTeach = Boolean(lesson.myPrivileges?.canModerate);
              return (
                <div key={lesson.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold uppercase font-mono text-emerald-700">
                        {lesson.status} · {lesson.gradeName}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">
                        {lesson.subjectName}: {lesson.title}
                      </h4>
                      <div className="text-xs text-slate-600">Topic: {lesson.topic}</div>
                    </div>
                    {canJoinOrTeach && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Co-Teach / Lead Enabled
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div>
                      Target Streams: <strong>{lesson.streams.map((s) => s.displayName || s.name).join(', ')}</strong>
                    </div>
                    <div className="font-mono tabular-nums">
                      Schedule: {lesson.scheduledDate} · {lesson.startTime}–{lesson.endTime} EAT ({lesson.durationMinutes} mins)
                    </div>
                    <div>Coordinator: {lesson.coordinatorName}</div>
                  </div>

                  {canJoinOrTeach ? (
                    <div className="space-y-2">
                      {lesson.classrooms.map((room) => (
                        <div key={room.id} className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{room.title}</div>
                            <div className="text-[11px] text-slate-500">
                              Lead: {room.assignedTeacherName} · {room.connectedCount}/{room.capacity} connected
                            </div>
                          </div>
                          {(room.roomStatus === 'live' || room.roomStatus === 'scheduled') && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (room.roomStatus === 'scheduled') {
                                  await vcApiFetch(`/api/virtual-lessons/${lesson.id}/start`, {
                                    method: 'POST',
                                    body: JSON.stringify({ classroomId: room.id }),
                                  });
                                  setToast(`Started classroom: ${room.title}`);
                                }
                                setActiveRoom({ lessonId: lesson.id, classroomId: room.id });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>{room.roomStatus === 'live' ? 'Join Classroom' : 'Start Room'}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                      Grade notification only. Contact Senior Teacher {lesson.coordinatorName} if you need co-teacher authorisation to enter.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeRoom && (
        <LiveClassroomRoomModal
          lessonId={activeRoom.lessonId}
          classroomId={activeRoom.classroomId}
          onClose={() => {
            setActiveRoom(null);
            void loadData();
          }}
          onLessonUpdated={() => void loadData()}
        />
      )}
    </section>
  );
};
