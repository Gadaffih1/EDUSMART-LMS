import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Megaphone,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  XCircle,
} from 'lucide-react';
import {
  ahApiFetch,
  type AcademicGrade,
  type AcademicMonitoringItem,
  type AcademicStream,
  type ClassTeacherReportItem,
  type GradeAnnouncementItem,
  type GradeNotificationItem,
  type StudentInterventionItem,
} from './academicHierarchyTypes';

function statusTextTone(status: string): string {
  const s = String(status || '').toLowerCase();
  if (s === 'approved' || s === 'resolved' || s === 'reviewed') return 'text-emerald-700';
  if (s === 'returned_for_correction' || s === 'critical' || s === 'high') return 'text-rose-700';
  if (s === 'info_requested' || s === 'warning' || s === 'in_progress' || s === 'moderate') return 'text-amber-700';
  if (s === 'submitted' || s === 'open') return 'text-blue-700';
  return 'text-slate-600';
}

function formatStatusLabel(status: string): string {
  return String(status || 'draft')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ============================================================================
 * 1. NOTIFICATIONS PANEL
 * ==========================================================================*/
export const AcademicNotificationsPanel: React.FC<{
  notifications: GradeNotificationItem[];
  onRefresh: () => void;
  onNavigateTab?: (tab: string) => void;
}> = ({ notifications, onRefresh, onNavigateTab }) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    setBusyId(id);
    try {
      await ahApiFetch(`/api/academic/notifications/${id}/read`, { method: 'POST' });
      onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setBusyId('all');
    try {
      await ahApiFetch('/api/academic/notifications/read-all', { method: 'POST' });
      onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Academic Notifications & Alerts</h2>
          <p className="text-xs text-slate-500">
            <span className="font-mono tabular-nums font-semibold text-slate-800">{unreadCount}</span> unread ·{' '}
            <span className="font-mono tabular-nums">{notifications.length}</span> total alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            disabled={busyId === 'all'}
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          No notifications recorded yet. Report submissions, feedback, and low-performance alerts appear here automatically.
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {notifications.map((n) => (
            <div key={n.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className={`font-semibold ${statusTextTone(n.severity)}`}>
                    {formatStatusLabel(n.category)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{n.created_at.slice(0, 16).replace('T', ' ')}</span>
                  {!n.is_read && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-blue-700">Unread</span>
                    </>
                  )}
                </div>
                <div className={`text-sm ${n.is_read ? 'font-medium text-slate-700' : 'font-semibold text-slate-950'}`}>
                  {n.title}
                </div>
                <p className="text-xs text-slate-600">{n.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {n.action_url_tab && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(n.action_url_tab!)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    Open Section
                  </button>
                )}
                {!n.is_read && (
                  <button
                    type="button"
                    disabled={busyId === n.id}
                    onClick={() => markRead(n.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ============================================================================
 * 2. GRADE & STREAM ANNOUNCEMENTS PANEL
 * ==========================================================================*/
export const GradeAnnouncementsPanel: React.FC<{
  grades: AcademicGrade[];
  streams: AcademicStream[];
  announcements: GradeAnnouncementItem[];
  defaultGradeId?: string;
  defaultStreamId?: string;
  allowAllGrade?: boolean;
  onCreated: () => void;
}> = ({ grades, streams, announcements, defaultGradeId, defaultStreamId, allowAllGrade = true, onCreated }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [gradeId, setGradeId] = useState(defaultGradeId || grades[0]?.id || '');
  const [streamId, setStreamId] = useState(defaultStreamId || '');
  const [audience, setAudience] = useState(defaultStreamId ? 'stream_and_parents' : 'all_grade');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const filteredStreams = streams.filter((s) => !gradeId || s.gradeId === gradeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      await ahApiFetch('/api/academic/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          gradeId: gradeId || null,
          streamId: streamId || null,
          targetAudience: audience,
          priority,
        }),
      });
      setTitle('');
      setMessage('');
      setFeedback({ type: 'ok', text: 'Announcement published to authorized recipients.' });
      onCreated();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <form onSubmit={handleSubmit} className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Publish Scoped Announcement</h3>
          <p className="text-xs text-slate-500">
            Strictly delivered to teachers, learners, or parents within the selected grade or stream.
          </p>
        </div>

        {feedback && (
          <div className={`text-xs font-medium px-3 py-2 rounded-lg border ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {feedback.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
            <select
              value={gradeId}
              onChange={(e) => {
                setGradeId(e.target.value);
                if (!defaultStreamId) setStreamId('');
              }}
              disabled={Boolean(defaultStreamId)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Stream Scope</label>
            <select
              value={streamId}
              onChange={(e) => setStreamId(e.target.value)}
              disabled={Boolean(defaultStreamId)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
            >
              {allowAllGrade && <option value="">All Streams in Grade</option>}
              {filteredStreams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
            >
              <option value="all_grade">Teachers, Students & Parents</option>
              <option value="teachers_only">Class Teachers Only</option>
              <option value="parents_only">Parents & Guardians</option>
              <option value="students_only">Students Only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-900"
            >
              <option value="normal">Standard Notice</option>
              <option value="important">Important Action</option>
              <option value="urgent">Urgent Notice</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Grade 7 End-of-Month Assessment Briefing"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write clear academic instructions or updates..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Megaphone className="w-4 h-4" />
          <span>{saving ? 'Publishing...' : 'Publish Announcement'}</span>
        </button>
      </form>

      <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Published Notices</h3>
            <p className="text-xs text-slate-500">Chronological feed visible to your authorized grade/stream scope</p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">{announcements.length} notices</span>
        </div>

        {announcements.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">No announcements posted for your grade/stream yet.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {announcements.map((a) => (
              <article key={a.id} className="py-3.5 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">
                    {a.stream_display_name || a.grade_name || 'School-Wide'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{formatStatusLabel(a.target_audience)}</span>
                  <span aria-hidden="true">·</span>
                  <span className={a.priority === 'urgent' ? 'text-rose-700 font-semibold' : ''}>
                    {formatStatusLabel(a.priority)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{a.created_at.slice(0, 10)}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-950">{a.title}</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{a.message}</p>
                <div className="text-[11px] text-slate-500">
                  Posted by {a.author_name} ({formatStatusLabel(a.author_role)})
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

/* ============================================================================
 * 3. STUDENT INTERVENTIONS & REMEDIAL TRACKING PANEL
 * ==========================================================================*/
export const StudentInterventionsPanel: React.FC<{
  streams: AcademicStream[];
  interventions: StudentInterventionItem[];
  onRefresh: () => void;
}> = ({ streams, interventions, onRefresh }) => {
  const [streamId, setStreamId] = useState(streams[0]?.id || '');
  const [studentName, setStudentName] = useState('');
  const [subjectName, setSubjectName] = useState('Mathematics');
  const [category, setCategory] = useState('academic_remedial');
  const [severity, setSeverity] = useState('moderate');
  const [baselineScore, setBaselineScore] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [issue, setIssue] = useState('');
  const [plan, setPlan] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamId || !studentName.trim() || !issue.trim() || !plan.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      await ahApiFetch('/api/academic/interventions', {
        method: 'POST',
        body: JSON.stringify({
          streamId,
          studentName: studentName.trim(),
          subjectName: subjectName.trim(),
          category,
          severity,
          baselineScore: baselineScore ? Number(baselineScore) : null,
          targetScore: targetScore ? Number(targetScore) : null,
          identifiedIssue: issue.trim(),
          interventionPlan: plan.trim(),
        }),
      });
      setStudentName('');
      setIssue('');
      setPlan('');
      setBaselineScore('');
      setTargetScore('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await ahApiFetch(`/api/academic/interventions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <form onSubmit={handleCreate} className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-3.5">
        <div className="pb-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Recommend Academic Intervention</h3>
          <p className="text-xs text-slate-500">Flag learners needing remedial lessons or attendance follow-up.</p>
        </div>

        {errorMsg && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{errorMsg}</div>}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Stream</label>
          <select
            value={streamId}
            onChange={(e) => setStreamId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            {streams.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Student Name</label>
            <input
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="academic_remedial">Academic Remedial</option>
              <option value="attendance_followup">Attendance Follow-up</option>
              <option value="conduct_support">Behaviour & Pastoral</option>
              <option value="assignment_catchup">Assignment Catch-up</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Baseline %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={baselineScore}
              onChange={(e) => setBaselineScore(e.target.value)}
              placeholder="e.g. 42"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
              placeholder="e.g. 68"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Identified Issue</label>
          <textarea
            required
            rows={2}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Specific competency or attendance gap..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Intervention / Remedial Plan</label>
          <textarea
            required
            rows={2}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="Actionable remedial schedule & parent engagement..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Create Intervention Plan'}</span>
        </button>
      </form>

      <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active & Historical Student Interventions</h3>
            <p className="text-xs text-slate-500">Tracked across streams with Class Teacher ownership</p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">{interventions.length} records</span>
        </div>

        {interventions.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">No student intervention records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2 pr-3">Student & Stream</th>
                  <th className="py-2 pr-3">Subject / Gap</th>
                  <th className="py-2 pr-3">Remedial Plan</th>
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {interventions.map((i) => (
                  <tr key={i.id}>
                    <td className="py-3 pr-3 align-top">
                      <div className="font-semibold text-slate-900">{i.student_name}</div>
                      <div className="text-[11px] text-slate-500">{i.stream_display_name || i.stream_id}</div>
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <div className="font-medium text-slate-800">{i.subject_name || 'General'}</div>
                      <div className="text-[11px] text-slate-600 max-w-xs">{i.identified_issue}</div>
                    </td>
                    <td className="py-3 pr-3 align-top text-slate-700 max-w-xs">{i.intervention_plan}</td>
                    <td className="py-3 pr-3 align-top font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {i.baseline_score ?? '-'} → {i.target_score ?? '-'}%
                    </td>
                    <td className={`py-3 pr-3 align-top font-semibold whitespace-nowrap ${statusTextTone(i.status)}`}>
                      {formatStatusLabel(i.status)}
                    </td>
                    <td className="py-3 align-top text-right whitespace-nowrap">
                      {i.status !== 'resolved' ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(i.id, 'resolved')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-md cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateStatus(i.id, 'in_progress')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer"
                        >
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

/* ============================================================================
 * 4. ACADEMIC & SYLLABUS MONITORING EDITOR + TABLE
 * ==========================================================================*/
export const AcademicMonitoringPanel: React.FC<{
  streams: AcademicStream[];
  records: AcademicMonitoringItem[];
  onRefresh: () => void;
}> = ({ streams, records, onRefresh }) => {
  const [streamId, setStreamId] = useState(streams[0]?.id || '');
  const [subjectName, setSubjectName] = useState('Mathematics');
  const [weekNumber, setWeekNumber] = useState('6');
  const [topicsPlanned, setTopicsPlanned] = useState('12');
  const [topicsCompleted, setTopicsCompleted] = useState('8');
  const [lessonsScheduled, setLessonsScheduled] = useState('5');
  const [lessonsDelivered, setLessonsDelivered] = useState('5');
  const [assignmentPct, setAssignmentPct] = useState('85');
  const [meanScore, setMeanScore] = useState('72');
  const [weakAreas, setWeakAreas] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamId || !subjectName.trim()) return;
    setSaving(true);
    try {
      await ahApiFetch('/api/academic/monitoring', {
        method: 'POST',
        body: JSON.stringify({
          streamId,
          subjectName: subjectName.trim(),
          weekNumber: Number(weekNumber || 6),
          topicsPlanned: Number(topicsPlanned || 12),
          topicsCompleted: Number(topicsCompleted || 0),
          lessonsScheduled: Number(lessonsScheduled || 5),
          lessonsDelivered: Number(lessonsDelivered || 0),
          assignmentCompletionPct: Number(assignmentPct || 0),
          assessmentMeanScore: Number(meanScore || 0),
          weakAreas: weakAreas.trim(),
        }),
      });
      setWeakAreas('');
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Log Syllabus Coverage & Subject Mean</h3>
            <p className="text-xs text-slate-500">
              Updates stream performance KPIs and automatically notifies the Senior Teacher if subject mean drops below 50%.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Stream</label>
            <select
              value={streamId}
              onChange={(e) => setStreamId(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Week</label>
            <input
              type="number"
              min={1}
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Topics Done/Plan</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={topicsCompleted}
                onChange={(e) => setTopicsCompleted(e.target.value)}
                className="w-1/2 px-2 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
              <input
                type="number"
                min={1}
                value={topicsPlanned}
                onChange={(e) => setTopicsPlanned(e.target.value)}
                className="w-1/2 px-2 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assign %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={assignmentPct}
              onChange={(e) => setAssignmentPct(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mean %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={meanScore}
              onChange={(e) => setMeanScore(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Lessons Delivered / Scheduled & Weak Strands</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={lessonsDelivered}
                onChange={(e) => setLessonsDelivered(e.target.value)}
                title="Lessons Delivered"
                className="w-20 px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
              <input
                type="number"
                min={1}
                value={lessonsScheduled}
                onChange={(e) => setLessonsScheduled(e.target.value)}
                title="Lessons Scheduled"
                className="w-20 px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
              />
              <input
                type="text"
                value={weakAreas}
                onChange={(e) => setWeakAreas(e.target.value)}
                placeholder="Weak topics / competencies needing reinforcement (optional)"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Monitoring Log'}
          </button>
        </div>
      </form>

      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Subject & Syllabus Delivery Ledger</h3>
          <span className="text-xs font-mono tabular-nums text-slate-500">{records.length} logs</span>
        </div>
        {records.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No monitoring entries recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2 pr-3">Stream</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3 text-right">Week</th>
                  <th className="py-2 pr-3 text-right">Topics</th>
                  <th className="py-2 pr-3 text-right">Syllabus %</th>
                  <th className="py-2 pr-3 text-right">Lessons</th>
                  <th className="py-2 pr-3 text-right">Assign %</th>
                  <th className="py-2 pr-3 text-right">Mean %</th>
                  <th className="py-2">Weak Areas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 pr-3 font-medium text-slate-900">{m.stream_display_name || m.stream_id}</td>
                    <td className="py-2.5 pr-3 text-slate-800">{m.subject_name}</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">Wk {m.week_number}</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                      {m.topics_completed}/{m.topics_planned}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {m.syllabus_coverage_pct}%
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                      {m.lessons_delivered}/{m.lessons_scheduled}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{m.assignment_completion_pct}%</td>
                    <td
                      className={`py-2.5 pr-3 text-right font-mono tabular-nums font-semibold ${
                        m.assessment_mean_score > 0 && m.assessment_mean_score < 50 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {m.assessment_mean_score}%
                    </td>
                    <td className="py-2.5 text-slate-600">{m.weak_areas || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

/* ============================================================================
 * 5. CLASS TEACHER REPORT COMPOSER & SENIOR TEACHER FEEDBACK THREAD
 * ==========================================================================*/
export const ClassReportComposerAndHistory: React.FC<{
  stream: AcademicStream;
  seniorTeacherName?: string | null;
  defaultStudentsCount: number;
  reports: ClassTeacherReportItem[];
  onRefresh: () => void;
}> = ({ stream, seniorTeacherName, defaultStudentsCount, reports, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportType, setReportType] = useState('weekly');
  const [periodLabel, setPeriodLabel] = useState('Week 6 · Term 1, 2026');
  const [title, setTitle] = useState(`${stream.displayName} Weekly Academic & Attendance Report`);
  const [summary, setSummary] = useState('');
  const [attendanceRate, setAttendanceRate] = useState('94');
  const [academicMean, setAcademicMean] = useState('71');
  const [syllabusCoverage, setSyllabusCoverage] = useState('68');
  const [assignmentCompletion, setAssignmentCompletion] = useState('84');
  const [challenges, setChallenges] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadForEdit = (r: ClassTeacherReportItem) => {
    setEditingId(r.id);
    setReportType(r.report_type);
    setPeriodLabel(r.period_label);
    setTitle(r.title);
    setSummary(r.summary);
    setAttendanceRate(String(r.attendance_rate));
    setAcademicMean(String(r.academic_mean));
    setSyllabusCoverage(String(r.syllabus_coverage));
    setAssignmentCompletion(String(r.assignment_completion));
    setChallenges(r.challenges || '');
    setRecommendations(r.recommendations || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle(`${stream.displayName} Weekly Academic & Attendance Report`);
    setSummary('');
    setChallenges('');
    setRecommendations('');
  };

  const handleSave = async (submitNow: boolean) => {
    if (!title.trim() || !summary.trim()) {
      setNotice({ type: 'err', text: 'Please enter a report title and executive summary.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        streamId: stream.id,
        reportType,
        periodLabel,
        title: title.trim(),
        summary: summary.trim(),
        attendanceRate: Number(attendanceRate || 0),
        academicMean: Number(academicMean || 0),
        syllabusCoverage: Number(syllabusCoverage || 0),
        assignmentCompletion: Number(assignmentCompletion || 0),
        studentsCount: defaultStudentsCount,
        challenges: challenges.trim(),
        recommendations: recommendations.trim(),
        submitNow,
      };
      if (editingId) {
        await ahApiFetch(`/api/academic/class-reports/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await ahApiFetch('/api/academic/class-reports', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      setNotice({
        type: 'ok',
        text: submitNow
          ? `Report submitted to ${seniorTeacherName || 'your Senior Teacher'} for review.`
          : 'Report saved as draft.',
      });
      onRefresh();
    } catch (err: any) {
      setNotice({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">
            {editingId ? 'Revise & Resubmit Class Report' : 'Submit Report to Senior Teacher'}
          </h3>
          <p className="text-xs text-slate-500">
            Stream: {stream.displayName} · Reporting to: {seniorTeacherName || 'Unassigned Senior Teacher'}
          </p>
        </div>

        {notice && (
          <div className={`text-xs px-3 py-2 rounded-lg border ${
            notice.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {notice.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="weekly">Weekly Class Report</option>
              <option value="monthly">Monthly Class Report</option>
              <option value="termly">Termly Class Report</option>
              <option value="discipline">Behaviour & Discipline</option>
              <option value="intervention">Intervention Escalation</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Period Label</label>
            <input
              type="text"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Report Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Attend %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={attendanceRate}
              onChange={(e) => setAttendanceRate(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mean %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={academicMean}
              onChange={(e) => setAcademicMean(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Syllabus %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={syllabusCoverage}
              onChange={(e) => setSyllabusCoverage(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assign %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={assignmentCompletion}
              onChange={(e) => setAssignmentCompletion(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Stream Performance Summary</label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summarize learner progress, attendance patterns, and syllabus milestones..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Challenges Observed</label>
            <textarea
              rows={2}
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Weak subjects or truancy issues..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recommendations</label>
            <textarea
              rows={2}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Remedial actions requested..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="flex-1 px-3 py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit to Senior Teacher</span>
          </button>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="w-full text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Cancel Editing
          </button>
        )}
      </div>

      <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Submitted Class Reports & Senior Teacher Feedback</h3>
            <p className="text-xs text-slate-500">Track approval status and action instructions from your Grade Coordinator</p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">{reports.length} reports</span>
        </div>

        {reports.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">No class reports submitted yet for {stream.displayName}.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {reports.map((r) => (
              <div key={r.id} className="py-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className={`font-semibold ${statusTextTone(r.status)}`}>{formatStatusLabel(r.status)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{r.period_label}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Attend {r.attendance_rate}% · Mean {r.academic_mean}% · Syl {r.syllabus_coverage}%
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                  </div>
                  {(r.status === 'draft' || r.status === 'returned_for_correction' || r.status === 'info_requested') && (
                    <button
                      type="button"
                      onClick={() => loadForEdit(r)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      Edit & Resubmit
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-700">{r.summary}</p>
                {r.reviews && r.reviews.length > 0 && (
                  <div className="pt-2 space-y-1.5 border-t border-slate-100">
                    {r.reviews.map((rv) => (
                      <div key={rv.id} className="text-xs text-slate-700 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                        <div>
                          <span className={`font-semibold ${statusTextTone(rv.decision)}`}>
                            {rv.reviewer_name} ({formatStatusLabel(rv.decision)}):
                          </span>{' '}
                          {rv.comments}
                          {rv.action_items && <div className="text-[11px] text-slate-500">Action: {rv.action_items}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

/* ============================================================================
 * 6. SENIOR TEACHER CLASS REPORT REVIEW QUEUE
 * ==========================================================================*/
export const SeniorClassReportReviewList: React.FC<{
  reports: ClassTeacherReportItem[];
  onReviewed: () => void;
}> = ({ reports, onReviewed }) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'approved' | 'returned_for_correction' | 'info_requested' | 'instruction'>('approved');
  const [comments, setComments] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async (reportId: string) => {
    if (!comments.trim()) return;
    setSubmitting(true);
    try {
      await ahApiFetch(`/api/academic/class-reports/${reportId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          comments: comments.trim(),
          actionItems: actionItems.trim(),
        }),
      });
      setSelectedReportId(null);
      setComments('');
      setActionItems('');
      onReviewed();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Class Teacher Reports & Review Instructions</h3>
          <p className="text-xs text-slate-500">
            Review stream submissions, approve reports, return for corrections, or send direct instructions to Class Teachers.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-600">
          {reports.filter((r) => r.status === 'submitted').length} pending review
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500">No Class Teacher reports submitted yet in this grade.</div>
      ) : (
        <div className="divide-y divide-slate-200">
          {reports.map((r) => (
            <div key={r.id} className="py-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">{r.stream_display_name || r.stream_id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{r.class_teacher_name}</span>
                    <span aria-hidden="true">·</span>
                    <span className={`font-semibold ${statusTextTone(r.status)}`}>{formatStatusLabel(r.status)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{r.period_label}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-950">{r.title}</h4>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReportId(selectedReportId === r.id ? null : r.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {selectedReportId === r.id ? 'Close Review' : 'Review / Send Instruction'}
                </button>
              </div>

              <div className="text-xs font-mono tabular-nums text-slate-600">
                Attendance: {r.attendance_rate}% · Mean: {r.academic_mean}% · Syllabus: {r.syllabus_coverage}% · Assignments: {r.assignment_completion}%
              </div>
              <p className="text-xs text-slate-700">{r.summary}</p>
              {(r.challenges || r.recommendations) && (
                <div className="text-xs text-slate-600 space-y-0.5">
                  {r.challenges && <div><span className="font-semibold text-slate-800">Challenges:</span> {r.challenges}</div>}
                  {r.recommendations && <div><span className="font-semibold text-slate-800">Recommendations:</span> {r.recommendations}</div>}
                </div>
              )}

              {r.reviews && r.reviews.length > 0 && (
                <div className="pt-2 space-y-1 border-t border-slate-100">
                  {r.reviews.map((rv) => (
                    <div key={rv.id} className="text-xs text-slate-600">
                      <span className={`font-semibold ${statusTextTone(rv.decision)}`}>
                        {rv.reviewer_name} ({formatStatusLabel(rv.decision)}):
                      </span>{' '}
                      {rv.comments}
                    </div>
                  ))}
                </div>
              )}

              {selectedReportId === r.id && (
                <div className="pt-3 mt-2 border-t border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Review Decision</label>
                      <select
                        value={decision}
                        onChange={(e) => setDecision(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="approved">Approve Report</option>
                        <option value="returned_for_correction">Return for Correction</option>
                        <option value="info_requested">Request Additional Info</option>
                        <option value="instruction">Send Instruction / Feedback</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Action Items (Optional)</label>
                      <input
                        type="text"
                        value={actionItems}
                        onChange={(e) => setActionItems(e.target.value)}
                        placeholder="e.g., Schedule remedial Math clinics on Wednesday afternoon"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Feedback / Instructions to Class Teacher</label>
                    <textarea
                      rows={2}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Write clear review feedback..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={submitting || !comments.trim()}
                    onClick={() => submitReview(r.id)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    {submitting ? 'Saving Review...' : 'Submit Review & Notify Class Teacher'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
