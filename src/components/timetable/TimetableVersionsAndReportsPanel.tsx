import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  GitCompare,
  History,
  Lock,
  Plus,
  Printer,
  RotateCcw,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { User, GradeLevel, StreamName, SubjectName, TimetableSlot } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { TenantSchoolLogo } from '../common/TenantSchoolLogo';
import { TTWorkspacePayload, ttApiFetch } from './timetableTypes';
import { ClassicTimetableSheet } from './ClassicTimetableSheet';

interface TimetableVersionsAndReportsPanelProps {
  workspace: TTWorkspacePayload;
  currentUser: User;
  onRefresh: (versionId?: string) => Promise<void>;
}

type ReportTypeId =
  | 'master'
  | 'class'
  | 'teacher'
  | 'classroom'
  | 'unscheduled'
  | 'workload'
  | 'conflicts'
  | 'allocations';

const REPORT_TYPES: Array<{ id: ReportTypeId; label: string; description: string }> = [
  { id: 'master', label: '1. Whole-School Master Timetable', description: 'Complete matrix across all grades, streams, days, and periods.' },
  { id: 'class', label: '2. Individual Class Timetables', description: 'Weekly lesson grid per stream & student group.' },
  { id: 'teacher', label: '3. Individual Teacher Timetables', description: 'Personal teaching roster across days and assigned classes.' },
  { id: 'classroom', label: '4. Classroom Utilisation Report', description: 'Room occupancy rates, weekly hours booked, and peak periods.' },
  { id: 'unscheduled', label: '5. Unscheduled Lesson Report', description: 'Sessions pending placement along with blocking diagnostic reasons.' },
  { id: 'workload', label: '6. Teacher Workload Report', description: 'Scheduled periods vs daily/weekly caps and utilisation percentage.' },
  { id: 'conflicts', label: '7. Conflict & Validation Report', description: 'Independent audit separating mandatory errors from warnings.' },
  { id: 'allocations', label: '8. Weekly Subject Allocation Report', description: 'Configured weekly period requirements vs scheduled slots.' },
];

const APPROVER_ROLES = new Set(['admin', 'head_teacher', 'deputy_head', 'dean_of_studies', 'curriculum_coordinator']);

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const TimetableVersionsAndReportsPanel: React.FC<TimetableVersionsAndReportsPanelProps> = ({
  workspace,
  currentUser,
  onRefresh,
}) => {
  const { currentTenant } = useTenant();
  const { versions, activeVersion, config, periods, classrooms, teachers, streamAllocations, auditLogs } = workspace;

  const [newDraftName, setNewDraftName] = useState('');
  const [reviewComments, setReviewComments] = useState(activeVersion?.reviewComments || '');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Version Comparison
  const [leftVersionId, setLeftVersionId] = useState<string>(versions[0]?.id || '');
  const [rightVersionId, setRightVersionId] = useState<string>(versions[1]?.id || versions[0]?.id || '');
  const [compareResult, setCompareResult] = useState<any>(null);

  // Report Selection
  const [selectedReport, setSelectedReport] = useState<ReportTypeId>('master');
  const [reportClassKey, setReportClassKey] = useState<string>('ALL');
  const [reportTeacherId, setReportTeacherId] = useState<string>('ALL');
  const [reportRoomId, setReportRoomId] = useState<string>('ALL');

  const canApproveOrPublish =
    currentUser.accessScope === 'super_admin_only' || APPROVER_ROLES.has(String(currentUser.role || '').toLowerCase());

  const hardErrors = useMemo(
    () => (activeVersion?.conflicts || []).filter((c) => c.severity === 'error'),
    [activeVersion]
  );
  const warnings = useMemo(
    () => (activeVersion?.conflicts || []).filter((c) => c.severity === 'warning'),
    [activeVersion]
  );
  const unscheduled = useMemo(() => activeVersion?.unscheduled || [], [activeVersion]);
  const hasBlockers = hardErrors.length > 0 || unscheduled.length > 0;

  const classOptions = useMemo(() => {
    const map = new Map<string, { grade: number; stream: string }>();
    for (const e of activeVersion?.entries || []) {
      map.set(`${e.grade}|${e.stream}`, { grade: e.grade, stream: e.stream });
    }
    return Array.from(map.values()).sort((a, b) => a.grade - b.grade || a.stream.localeCompare(b.stream));
  }, [activeVersion]);

  const runVersionAction = async (path: string, method: 'POST', body: any, okMsg: string) => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await ttApiFetch<any>(path, { method, body: JSON.stringify(body) });
      await onRefresh(res?.id || activeVersion?.id);
      setStatusMsg({ type: 'ok', text: okMsg });
    } catch (e: any) {
      setStatusMsg({ type: 'err', text: e?.message || 'Action failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleCreateDraft = async () => {
    await runVersionAction(
      '/api/timetable/versions',
      'POST',
      { name: newDraftName.trim() || undefined },
      'Created new draft timetable version.'
    );
    setNewDraftName('');
  };

  const handleCompareVersions = async () => {
    if (!leftVersionId || !rightVersionId) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await ttApiFetch<any>(
        `/api/timetable/versions/compare?leftId=${encodeURIComponent(leftVersionId)}&rightId=${encodeURIComponent(rightVersionId)}`
      );
      setCompareResult(res);
    } catch (e: any) {
      setStatusMsg({ type: 'err', text: e?.message || 'Version comparison failed.' });
    } finally {
      setBusy(false);
    }
  };

  // Build tabular dataset for any of the 8 official report types
  const buildReportDataset = (): { title: string; columns: string[]; rows: Array<Record<string, string | number>> } => {
    const entries = activeVersion?.entries || [];
    const lessonSlotsCount =
      (config.workingDays?.length || 5) * Math.max(1, periods.filter((p) => p.kind === 'lesson').length);

    if (selectedReport === 'master') {
      return {
        title: `Whole-School Master Timetable (${config.term} ${config.academicYear})`,
        columns: ['Day', 'Period', 'Grade', 'Stream', 'Group', 'Subject', 'Teacher(s)', 'Room', 'Block', 'Locked'],
        rows: [...entries]
          .sort((a, b) => a.grade - b.grade || a.stream.localeCompare(b.stream) || a.dayOfWeek.localeCompare(b.dayOfWeek) || a.periodNumber - b.periodNumber)
          .map((e) => ({
            Day: e.dayOfWeek,
            Period: `P${e.periodNumber}`,
            Grade: `Grade ${e.grade}`,
            Stream: e.stream,
            Group: e.groupName,
            Subject: e.subjectName,
            'Teacher(s)': e.teacherNames.join(', '),
            Room: e.roomName,
            Block: e.blockLength > 1 ? `${e.blockLength}P (${e.blockIndex + 1}/${e.blockLength})` : 'Single',
            Locked: e.isLocked ? 'Yes' : 'No',
          })),
      };
    }

    if (selectedReport === 'class') {
      const filtered =
        reportClassKey === 'ALL'
          ? entries
          : entries.filter((e) => `${e.grade}|${e.stream}` === reportClassKey);
      return {
        title: `Class Timetable Report (${reportClassKey === 'ALL' ? 'All Classes' : reportClassKey.replace('|', ' ')})`,
        columns: ['Class / Stream', 'Day', 'Period', 'Subject', 'Group', 'Teacher(s)', 'Room'],
        rows: [...filtered]
          .sort((a, b) => a.grade - b.grade || a.stream.localeCompare(b.stream) || a.dayOfWeek.localeCompare(b.dayOfWeek) || a.periodNumber - b.periodNumber)
          .map((e) => ({
            'Class / Stream': `Grade ${e.grade} ${e.stream}`,
            Day: e.dayOfWeek,
            Period: `P${e.periodNumber}`,
            Subject: e.subjectName,
            Group: e.groupName,
            'Teacher(s)': e.teacherNames.join(', '),
            Room: e.roomName,
          })),
      };
    }

    if (selectedReport === 'teacher') {
      const targetTeacher = teachers.find((t) => t.id === reportTeacherId);
      const filtered =
        reportTeacherId === 'ALL'
          ? entries
          : entries.filter(
              (e) =>
                e.teacherIds.includes(reportTeacherId) ||
                (targetTeacher && e.teacherNames.includes(targetTeacher.teacherName))
            );
      return {
        title: `Teacher Timetable Report (${targetTeacher ? targetTeacher.teacherName : 'All Teachers'})`,
        columns: ['Teacher(s)', 'Day', 'Period', 'Class / Stream', 'Subject', 'Room'],
        rows: [...filtered]
          .sort((a, b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.periodNumber - b.periodNumber)
          .map((e) => ({
            'Teacher(s)': e.teacherNames.join(', '),
            Day: e.dayOfWeek,
            Period: `P${e.periodNumber}`,
            'Class / Stream': `Grade ${e.grade} ${e.stream}`,
            Subject: e.subjectName,
            Room: e.roomName,
          })),
      };
    }

    if (selectedReport === 'classroom') {
      const filteredRooms = reportRoomId === 'ALL' ? classrooms : classrooms.filter((r) => r.id === reportRoomId);
      return {
        title: `Classroom & Facility Utilisation Report (${config.term} ${config.academicYear})`,
        columns: ['Room Name', 'Code', 'Type', 'Capacity', 'Booked Periods / Week', 'Available Periods / Week', 'Utilisation %'],
        rows: filteredRooms.map((r) => {
          const booked = entries.filter((e) => e.roomId === r.id).length;
          const pct = lessonSlotsCount > 0 ? Math.round((booked / lessonSlotsCount) * 100) : 0;
          return {
            'Room Name': r.name,
            Code: r.roomCode,
            Type: r.roomType,
            Capacity: r.capacity,
            'Booked Periods / Week': booked,
            'Available Periods / Week': lessonSlotsCount,
            'Utilisation %': `${pct}%`,
          };
        }),
      };
    }

    if (selectedReport === 'unscheduled') {
      return {
        title: 'Unscheduled Lessons & Diagnostic Report',
        columns: ['Grade', 'Stream', 'Group', 'Subject', 'Block Length', 'Assigned Teacher(s)', 'Room Type', 'Blocking Reason'],
        rows: unscheduled.map((u) => ({
          Grade: `Grade ${u.grade}`,
          Stream: u.stream,
          Group: u.groupName,
          Subject: u.subjectName,
          'Block Length': `${u.blockLength}P`,
          'Assigned Teacher(s)': u.teacherNames.join(', ') || 'Unassigned',
          'Room Type': u.requiredRoomType,
          'Blocking Reason': u.reason,
        })),
      };
    }

    if (selectedReport === 'workload') {
      const days = config.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      return {
        title: 'Faculty Teaching Workload & Cap Utilisation Report',
        columns: ['Teacher', 'Department', 'Status', 'Scheduled / Week', 'Max Weekly Cap', 'Peak Daily Periods', 'Max Daily Cap', 'Load %'],
        rows: teachers.map((t) => {
          const tEntries = entries.filter((e) => e.teacherIds.includes(t.id) || e.teacherNames.includes(t.teacherName));
          // Deduplicate joint lessons by (day, period)
          const uniqueSlots = new Map<string, number>();
          for (const e of tEntries) {
            uniqueSlots.set(`${e.dayOfWeek}|${e.periodNumber}`, 1);
          }
          const weeklyCount = uniqueSlots.size;
          const peakDay = days.reduce((mx, d) => {
            const dc = new Set(tEntries.filter((e) => e.dayOfWeek === d).map((e) => e.periodNumber)).size;
            return Math.max(mx, dc);
          }, 0);
          const pct = t.maxWeeklyPeriods > 0 ? Math.round((weeklyCount / t.maxWeeklyPeriods) * 100) : 0;
          return {
            Teacher: t.teacherName,
            Department: t.department,
            Status: t.activeInTimetable ? 'Active' : 'Archived',
            'Scheduled / Week': weeklyCount,
            'Max Weekly Cap': t.maxWeeklyPeriods,
            'Peak Daily Periods': peakDay,
            'Max Daily Cap': t.maxDailyPeriods,
            'Load %': `${pct}%`,
          };
        }),
      };
    }

    if (selectedReport === 'conflicts') {
      return {
        title: 'Schedule Validation & Conflict Report',
        columns: ['Severity', 'Conflict Type', 'Day', 'Period', 'Description'],
        rows: (activeVersion?.conflicts || []).map((c) => ({
          Severity: c.severity.toUpperCase(),
          'Conflict Type': c.conflictType,
          Day: c.dayOfWeek || '—',
          Period: c.periodNumber ? `P${c.periodNumber}` : '—',
          Description: c.message,
        })),
      };
    }

    // allocations
    return {
      title: 'Weekly Subject Allocation vs Placed Periods Report',
      columns: ['Grade', 'Stream', 'Subject', 'Source', 'Required / Week', 'Placed / Week', 'Variance', 'Doubles / Triples'],
      rows: streamAllocations.map((sa) => {
        const placed = entries.filter(
          (e) => e.grade === sa.grade && e.stream === sa.stream && e.subjectName === sa.subjectName
        ).length;
        const diff = placed - sa.requiredWeeklyPeriods;
        return {
          Grade: `Grade ${sa.grade}`,
          Stream: sa.stream,
          Subject: sa.subjectName,
          Source: sa.isOverridden ? 'Stream Override' : 'Inherited Template',
          'Required / Week': sa.requiredWeeklyPeriods,
          'Placed / Week': placed,
          Variance: diff === 0 ? 'Matched' : diff > 0 ? `+${diff}` : String(diff),
          'Doubles / Triples': `${sa.doubleLessons}D / ${sa.tripleLessons}T`,
        };
      }),
    };
  };

  const dataset = useMemo(buildReportDataset, [
    selectedReport,
    activeVersion,
    config,
    periods,
    classrooms,
    teachers,
    streamAllocations,
    unscheduled,
    reportClassKey,
    reportTeacherId,
    reportRoomId,
  ]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      dataset.rows.length > 0 ? dataset.rows : [{ Notice: 'No records available for selected filter.' }]
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedReport.toUpperCase().slice(0, 30));
    const safeSchool = (currentTenant.shortName || currentTenant.code || 'School').replace(/[^a-zA-Z0-9_-]/g, '_');
    XLSX.writeFile(wb, `${safeSchool}_Timetable_${selectedReport}_v${activeVersion?.versionNumber || 1}.xlsx`);
  };

  const handleExportPdfPrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const logoUrl = currentTenant.customLogoBase64 || currentTenant.logoUrl || '';
    const thCells = dataset.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
    const bodyRows =
      dataset.rows.length > 0
        ? dataset.rows
            .map(
              (r) =>
                `<tr>${dataset.columns
                  .map((c) => `<td>${escapeHtml(String(r[c] ?? ''))}</td>`)
                  .join('')}</tr>`
            )
            .join('')
        : `<tr><td colspan="${dataset.columns.length}" style="text-align:center;color:#64748b;padding:18px;">No records matched the selected report filters.</td></tr>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(currentTenant.name)} - ${escapeHtml(dataset.title)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; font-size: 11px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo-frame { width: 58px; height: 58px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px; background: #ffffff; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; flex-shrink: 0; }
    .logo-img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; }
    .school-name { font-size: 17px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; margin: 0; }
    .school-meta { font-size: 10px; color: #475569; margin-top: 2px; }
    .report-meta { text-align: right; font-size: 10px; color: #334155; }
    .report-title { font-size: 13px; font-weight: 700; margin: 0 0 8px 0; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 6px 7px; font-size: 10px; text-transform: uppercase; border: 1px solid #0f172a; }
    td { padding: 5px 7px; border: 1px solid #cbd5e1; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 14px; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      ${logoUrl ? `<div class="logo-frame"><img class="logo-img" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(currentTenant.name)}" /></div>` : ''}
      <div>
        <h1 class="school-name">${escapeHtml(currentTenant.name)}</h1>
        <div class="school-meta">${escapeHtml(currentTenant.motto || '')} ${currentTenant.registrationNumber ? '· ' + escapeHtml(currentTenant.registrationNumber) : ''}</div>
      </div>
    </div>
    <div class="report-meta">
      <div><strong>${escapeHtml(config.term)} · ${escapeHtml(config.academicYear)}</strong></div>
      <div>Version: v${activeVersion?.versionNumber || 1} (${escapeHtml((activeVersion?.status || 'draft').toUpperCase())})</div>
      <div>Printed: ${escapeHtml(new Date().toLocaleString())}</div>
    </div>
  </div>
  <h2 class="report-title">${escapeHtml(dataset.title)}</h2>
  <table>
    <thead><tr>${thCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">
    <span>${escapeHtml(currentTenant.name)} Official Timetable Office</span>
    <span>Prepared by ${escapeHtml(currentUser.name || 'Administrator')} · Total Rows: ${dataset.rows.length}</span>
  </div>
</body>
</html>`;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1200);
      }, 250);
    }
  };

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="underline text-[11px]">
            Close
          </button>
        </div>
      )}

      {/* SECTION 1: VERSION LIFECYCLE, APPROVALS & PUBLICATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Version Control & Approval Workflow</h3>
              <p className="text-xs text-slate-500">
                Lifecycle: Draft → Generated → Review → Approved → Published → Archived
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDraftName}
                onChange={(e) => setNewDraftName(e.target.value)}
                placeholder="New draft label..."
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                disabled={busy}
                onClick={handleCreateDraft}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Draft</span>
              </button>
            </div>
          </div>

          {activeVersion && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-slate-900">
                    v{activeVersion.versionNumber} · {activeVersion.name}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Status: <span className="font-bold uppercase text-slate-900">{activeVersion.status}</span> ·{' '}
                    Hard Errors: <span className={`font-mono font-bold ${hardErrors.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{hardErrors.length}</span> ·{' '}
                    Unscheduled: <span className={`font-mono font-bold ${unscheduled.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{unscheduled.length}</span>
                  </div>
                </div>
                {activeVersion.publishedAt && (
                  <div className="text-[11px] text-emerald-700 font-semibold">
                    Published by {activeVersion.publishedBy} · {new Date(activeVersion.publishedAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {hasBlockers && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Approval & Publication Blocked:</span> Resolve {hardErrors.length} hard error(s) and {unscheduled.length} unscheduled session(s) in the Drag & Drop Editor before submitting or approving.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review / Approval Notes</label>
                <textarea
                  rows={2}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Enter academic committee or dean review comments..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy || hasBlockers || activeVersion.status === 'published'}
                  onClick={() =>
                    runVersionAction(
                      `/api/timetable/versions/${activeVersion.id}/submit-review`,
                      'POST',
                      { comments: reviewComments },
                      'Submitted timetable for review.'
                    )
                  }
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>

                {canApproveOrPublish && (
                  <>
                    <button
                      type="button"
                      disabled={busy || hasBlockers || activeVersion.status === 'published'}
                      onClick={() =>
                        runVersionAction(
                          `/api/timetable/versions/${activeVersion.id}/approve`,
                          'POST',
                          { comments: reviewComments },
                          'Timetable approved.'
                        )
                      }
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      disabled={busy || activeVersion.status === 'published'}
                      onClick={() =>
                        runVersionAction(
                          `/api/timetable/versions/${activeVersion.id}/reject`,
                          'POST',
                          { comments: reviewComments || 'Returned to draft for adjustments.' },
                          'Returned timetable to Draft status.'
                        )
                      }
                      className="px-3 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-800 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject to Draft</span>
                    </button>

                    <button
                      type="button"
                      disabled={busy || hasBlockers || activeVersion.status === 'published'}
                      onClick={() =>
                        runVersionAction(
                          `/api/timetable/versions/${activeVersion.id}/publish`,
                          'POST',
                          {},
                          'Timetable published across Teacher, Student & Parent portals.'
                        )
                      }
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Publish Schedule</span>
                    </button>

                    {activeVersion.status === 'published' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          runVersionAction(
                            `/api/timetable/versions/${activeVersion.id}/withdraw`,
                            'POST',
                            {},
                            'Publication withdrawn back to Review.'
                          )
                        }
                        className="px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Withdraw Publication</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runVersionAction(
                      `/api/timetable/versions/${activeVersion.id}/restore`,
                      'POST',
                      {},
                      'Restored snapshot into a new editable draft version.'
                    )
                  }
                  className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clone / Restore as Draft</span>
                </button>
              </div>
            </div>
          )}

          {/* All Versions List */}
          <div className="border-t border-slate-100 pt-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              School Version Registry ({versions.length})
            </div>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
              {versions.map((v) => (
                <div
                  key={v.id}
                  onClick={() => onRefresh(v.id)}
                  className={`px-3 py-2 flex items-center justify-between cursor-pointer ${
                    v.id === activeVersion?.id ? 'bg-indigo-50/70' : 'hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-900">v{v.versionNumber} · {v.name}</span>
                    <span className="text-[11px] text-slate-500 ml-2">by {v.createdByName}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="uppercase font-bold text-slate-700">{v.status}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{new Date(v.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Version Comparison & Recent Audit Logs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-600" />
              <span>Version Comparison</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={leftVersionId}
                onChange={(e) => setLeftVersionId(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>Base: v{v.versionNumber} ({v.status})</option>
                ))}
              </select>
              <select
                value={rightVersionId}
                onChange={(e) => setRightVersionId(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>Target: v{v.versionNumber} ({v.status})</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={busy || versions.length < 1}
              onClick={handleCompareVersions}
              className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Compare Versions
            </button>

            {compareResult && (
              <div className="border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                <div className="font-bold text-slate-900">
                  {compareResult.diffCount} slot difference(s) found
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 text-[11px]">
                  {(compareResult.diffs || []).map((d: any, idx: number) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-slate-600">{d.slotKey}</span>
                      <span className="font-bold uppercase text-slate-800">{d.changeType}</span>
                    </div>
                  ))}
                  {compareResult.diffCount === 0 && (
                    <div className="text-slate-500 italic">Selected versions have identical slot placements.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <span>Audit Log Trail ({auditLogs.length})</span>
            </h3>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-[11px]">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{log.action}</div>
                    <div className="text-slate-500">
                      {log.actorName} ({log.actorRole})
                    </div>
                  </div>
                  <div className="text-slate-400 font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 8 OFFICIAL REPORTS & TENANT-BRANDED EXPORTS (PDF + EXCEL) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <TenantSchoolLogo variant="emblem" size="sm" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {currentTenant.name} · Timetable Reports & Exports
              </h3>
              <p className="text-xs text-slate-500">
                All printable PDFs and Excel workbooks strictly carry your school crest and isolated tenant data.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdfPrint}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Export Official PDF / Print</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-1.5">
            {REPORT_TYPES.map((rep) => (
              <button
                key={rep.id}
                type="button"
                onClick={() => setSelectedReport(rep.id)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  selectedReport === rep.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold">{rep.label}</div>
                <div className={`text-[10px] mt-0.5 ${selectedReport === rep.id ? 'text-slate-300' : 'text-slate-500'}`}>
                  {rep.description}
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 space-y-3">
            {/* Report Scope Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-xs font-bold text-slate-900">{dataset.title}</div>
              <div className="flex items-center gap-2 text-xs">
                {selectedReport === 'class' && (
                  <select
                    value={reportClassKey}
                    onChange={(e) => setReportClassKey(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs"
                  >
                    <option value="ALL">All Classes</option>
                    {classOptions.map((c) => (
                      <option key={`${c.grade}|${c.stream}`} value={`${c.grade}|${c.stream}`}>
                        Grade {c.grade} {c.stream}
                      </option>
                    ))}
                  </select>
                )}
                {selectedReport === 'teacher' && (
                  <select
                    value={reportTeacherId}
                    onChange={(e) => setReportTeacherId(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs"
                  >
                    <option value="ALL">All Teachers</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.teacherName}</option>
                    ))}
                  </select>
                )}
                {selectedReport === 'classroom' && (
                  <select
                    value={reportRoomId}
                    onChange={(e) => setReportRoomId(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs"
                  >
                    <option value="ALL">All Classrooms & Facilities</option>
                    {classrooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                )}
                <span className="font-mono tabular-nums text-[11px] text-slate-500">
                  {dataset.rows.length} rows
                </span>
              </div>
            </div>

            {/* Official 11-Lesson Horizontal Timetable Sheet Preview for Individual Class or Teacher */}
            {selectedReport === 'class' && classOptions.length > 0 && (() => {
              const targetClass =
                reportClassKey !== 'ALL'
                  ? classOptions.find((c) => `${c.grade}|${c.stream}` === reportClassKey) || classOptions[0]
                  : classOptions[0];
              const sheetSlots: TimetableSlot[] = (activeVersion?.entries || [])
                .filter((e) => e.grade === targetClass.grade && e.stream === targetClass.stream)
                .map((e) => ({
                  id: e.id,
                  grade: e.grade as GradeLevel,
                  stream: e.stream as StreamName,
                  dayOfWeek: e.dayOfWeek as TimetableSlot['dayOfWeek'],
                  period: e.periodNumber,
                  startTime: '08:20',
                  endTime: '09:00',
                  subject: e.subjectName as SubjectName,
                  teacherName: (e.teacherNames || []).join(' / ') || 'Faculty',
                  roomName: e.roomName || 'Classroom',
                }));
              return (
                <ClassicTimetableSheet
                  mode="class"
                  slots={sheetSlots}
                  grade={targetClass.grade as GradeLevel}
                  stream={targetClass.stream}
                  termLabel={`${config.term} ${config.academicYear}`}
                />
              );
            })()}

            {selectedReport === 'teacher' && teachers.length > 0 && (() => {
              const targetTeacher =
                reportTeacherId !== 'ALL'
                  ? teachers.find((t) => t.id === reportTeacherId) || teachers[0]
                  : teachers[0];
              const sheetSlots: TimetableSlot[] = (activeVersion?.entries || [])
                .filter(
                  (e) =>
                    e.teacherIds.includes(targetTeacher.id) ||
                    e.teacherNames.some((n) => n.toLowerCase() === targetTeacher.teacherName.toLowerCase())
                )
                .map((e) => ({
                  id: e.id,
                  grade: e.grade as GradeLevel,
                  stream: e.stream as StreamName,
                  dayOfWeek: e.dayOfWeek as TimetableSlot['dayOfWeek'],
                  period: e.periodNumber,
                  startTime: '08:20',
                  endTime: '09:00',
                  subject: e.subjectName as SubjectName,
                  teacherName: (e.teacherNames || []).join(' / ') || targetTeacher.teacherName,
                  roomName: e.roomName || 'Classroom',
                }));
              return (
                <ClassicTimetableSheet
                  mode="teacher"
                  slots={sheetSlots}
                  teacherName={targetTeacher.teacherName}
                  termLabel={`${config.term} ${config.academicYear}`}
                />
              );
            })()}

            {/* Report Preview Table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[420px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white sticky top-0">
                  <tr>
                    {dataset.columns.map((col) => (
                      <th key={col} className="py-2 px-3 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {dataset.rows.length === 0 ? (
                    <tr>
                      <td colSpan={dataset.columns.length} className="py-6 text-center text-slate-500 italic">
                        No rows for this report filter yet.
                      </td>
                    </tr>
                  ) : (
                    dataset.rows.slice(0, 150).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {dataset.columns.map((col) => (
                          <td key={col} className="py-2 px-3 text-slate-800 whitespace-nowrap font-mono tabular-nums text-[11px]">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {dataset.rows.length > 150 && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>Showing first 150 rows in preview. Export Excel or PDF for all {dataset.rows.length} records.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Independent Validation Inspector (Errors vs Warnings) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Mandatory Hard Errors ({hardErrors.length})</span>
          </h4>
          {hardErrors.length === 0 ? (
            <div className="text-xs text-emerald-700 font-semibold">No blocking hard errors in active version.</div>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {hardErrors.map((e) => (
                <li key={e.id} className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-900">
                  <span className="font-bold">{e.conflictType}:</span> {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Optimization Warnings ({warnings.length})</span>
          </h4>
          {warnings.length === 0 ? (
            <div className="text-xs text-emerald-700 font-semibold">No optimization warnings raised.</div>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {warnings.map((w) => (
                <li key={w.id} className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900">
                  <span className="font-bold">{w.conflictType}:</span> {w.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
