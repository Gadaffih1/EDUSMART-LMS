import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  Download,
  History,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import {
  ahApiFetch,
  type AcademicBootstrapPayload,
  type AcademicGrade,
  type AcademicStream,
  type ConsolidatedGradeReportItem,
  type GradeOverviewPayload,
} from './academicHierarchyTypes';
import { exportAcademicReportToExcel, printAcademicReportPdf } from './academicReportExporter';

export type AdminAcademicMode =
  | 'grades'
  | 'streams'
  | 'senior_assignments'
  | 'class_assignments'
  | 'grade_performance'
  | 'consolidated_reports';

interface GradeStreamManagementConsoleProps {
  mode?: AdminAcademicMode;
  defaultMode?: AdminAcademicMode;
  onChangeMode?: (mode: AdminAcademicMode) => void;
  allowCampusSelection?: boolean;
}

export const GradeStreamManagementConsole: React.FC<GradeStreamManagementConsoleProps> = ({
  mode,
  defaultMode = 'grades',
  onChangeMode,
  allowCampusSelection = false,
}) => {
  const { currentTenant, allTenants } = useTenant();
  const [internalMode, setInternalMode] = useState<AdminAcademicMode>(defaultMode);
  const effectiveMode = mode ?? internalMode;
  const handleSelectMode = (next: AdminAcademicMode) => {
    setInternalMode(next);
    onChangeMode?.(next);
  };

  const [targetSchoolId, setTargetSchoolId] = useState<string>(currentTenant.id);
  const activeSchoolId = allowCampusSelection ? (targetSchoolId || currentTenant.id) : currentTenant.id;
  const activeTenant = allTenants.find((t) => t.id === activeSchoolId) || currentTenant;

  const [bootstrap, setBootstrap] = useState<AcademicBootstrapPayload | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [overview, setOverview] = useState<GradeOverviewPayload | null>(null);
  const [consolidatedReports, setConsolidatedReports] = useState<ConsolidatedGradeReportItem[]>([]);
  const [historyData, setHistoryData] = useState<{ seniorHistory: any[]; classTeacherHistory: any[] } | null>(null);
  const [streamStudents, setStreamStudents] = useState<any[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Forms state
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeBand, setNewGradeBand] = useState('Junior School');
  const [newGradeStreams, setNewGradeStreams] = useState('East, West, North');

  const [streamTargetGradeId, setStreamTargetGradeId] = useState('');
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamCapacity, setNewStreamCapacity] = useState('45');

  const [assignSeniorGradeId, setAssignSeniorGradeId] = useState('');
  const [assignSeniorTeacherId, setAssignSeniorTeacherId] = useState('');

  const [assignClassStreamId, setAssignClassStreamId] = useState('');
  const [assignClassTeacherId, setAssignClassTeacherId] = useState('');

  // Grade Edit & Delete modal state
  const [editingGrade, setEditingGrade] = useState<AcademicGrade | null>(null);
  const [editGradeName, setEditGradeName] = useState('');
  const [editGradeNumber, setEditGradeNumber] = useState('');
  const [editGradeBand, setEditGradeBand] = useState('Junior School');
  const [editGradeYear, setEditGradeYear] = useState('2026');
  const [editGradeDesc, setEditGradeDesc] = useState('');

  const [deletingGrade, setDeletingGrade] = useState<AcademicGrade | null>(null);
  const [deleteGradeRequiresForce, setDeleteGradeRequiresForce] = useState(false);
  const [deleteGradeWarningText, setDeleteGradeWarningText] = useState<string | null>(null);

  // Stream Edit & Delete modal state
  const [editingStream, setEditingStream] = useState<AcademicStream | null>(null);
  const [editStreamGradeId, setEditStreamGradeId] = useState('');
  const [editStreamName, setEditStreamName] = useState('');
  const [editStreamCapacity, setEditStreamCapacity] = useState('45');
  const [editStreamRoomLabel, setEditStreamRoomLabel] = useState('');

  const [deletingStream, setDeletingStream] = useState<AcademicStream | null>(null);
  const [deleteStreamRequiresForce, setDeleteStreamRequiresForce] = useState(false);
  const [deleteStreamWarningText, setDeleteStreamWarningText] = useState<string | null>(null);

  // Transfer modal state
  const [transferStudent, setTransferStudent] = useState<any | null>(null);
  const [transferTargetStreamId, setTransferTargetStreamId] = useState('');
  const [transferReason, setTransferReason] = useState('Balanced stream placement');

  // Admin consolidated review state
  const [reviewingReportId, setReviewingReportId] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState('');
  const [adminDecision, setAdminDecision] = useState<'approved' | 'reviewed' | 'feedback_sent'>('approved');

  const notify = (text: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ahApiFetch<AcademicBootstrapPayload>('/api/academic/bootstrap', {
        tenantId: activeSchoolId,
      });
      setBootstrap(data);
      const firstGrade =
        selectedGradeId && data.grades.some((g) => g.id === selectedGradeId)
          ? selectedGradeId
          : data.grades[0]?.id || '';
      setSelectedGradeId(firstGrade);
      setStreamTargetGradeId((prev) =>
        prev && data.grades.some((g) => g.id === prev) ? prev : firstGrade
      );
      setAssignSeniorGradeId((prev) =>
        prev && data.grades.some((g) => g.id === prev) ? prev : firstGrade
      );
      if (data.streams.length > 0) {
        setSelectedStreamId((prev) =>
          prev && data.streams.some((s) => s.id === prev) ? prev : data.streams[0].id
        );
        setAssignClassStreamId((prev) =>
          prev && data.streams.some((s) => s.id === prev) ? prev : data.streams[0].id
        );
      } else {
        setSelectedStreamId('');
        setAssignClassStreamId('');
      }
      const cReports = await ahApiFetch<{ reports: ConsolidatedGradeReportItem[] }>(
        '/api/academic/consolidated-reports',
        { tenantId: activeSchoolId }
      );
      setConsolidatedReports(cReports.reports || []);
    } catch (err: any) {
      notify(err.message, 'err');
    } finally {
      setLoading(false);
    }
  }, [activeSchoolId, selectedGradeId]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    if (!selectedGradeId) {
      setOverview(null);
      setHistoryData(null);
      return;
    }
    void ahApiFetch<GradeOverviewPayload>(`/api/academic/grades/${selectedGradeId}/overview`, {
      tenantId: activeSchoolId,
    })
      .then((res) => setOverview(res))
      .catch(() => setOverview(null));

    void ahApiFetch<{ seniorHistory: any[]; classTeacherHistory: any[] }>(
      `/api/academic/grades/${selectedGradeId}/assignment-history`,
      { tenantId: activeSchoolId }
    )
      .then((res) => setHistoryData(res))
      .catch(() => setHistoryData(null));
  }, [selectedGradeId, bootstrap, activeSchoolId]);

  useEffect(() => {
    if (!selectedStreamId) {
      setStreamStudents([]);
      return;
    }
    void ahApiFetch<{ students: any[] }>(`/api/academic/streams/${selectedStreamId}/students`, {
      tenantId: activeSchoolId,
    })
      .then((res) => setStreamStudents(res.students || []))
      .catch(() => setStreamStudents([]));
  }, [selectedStreamId, bootstrap, activeSchoolId]);

  const handleCampusChange = (nextSchoolId: string) => {
    setTargetSchoolId(nextSchoolId);
    setSelectedGradeId('');
    setSelectedStreamId('');
    setStreamTargetGradeId('');
    setAssignSeniorGradeId('');
    setAssignClassStreamId('');
    setEditingGrade(null);
    setDeletingGrade(null);
    setEditingStream(null);
    setDeletingStream(null);
  };

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeName.trim()) return;
    try {
      const streamList = newGradeStreams
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await ahApiFetch('/api/academic/grades', {
        method: 'POST',
        tenantId: activeSchoolId,
        body: JSON.stringify({
          schoolId: activeSchoolId,
          name: newGradeName.trim(),
          levelBand: newGradeBand,
          streams: streamList,
        }),
      });
      setNewGradeName('');
      notify(`Created ${newGradeName.trim()} with ${streamList.length} stream(s).`);
      await loadBootstrap();
    } catch (err: any) {
      notify(err.message, 'err');
    }
  };

  const openEditGradeModal = (g: AcademicGrade) => {
    setEditingGrade(g);
    setEditGradeName(g.name);
    setEditGradeNumber(g.gradeNumber !== null && g.gradeNumber !== undefined ? String(g.gradeNumber) : '');
    setEditGradeBand(g.levelBand || 'Junior School');
    setEditGradeYear(g.academicYear || '2026');
    setEditGradeDesc(g.description || '');
  };

  const handleUpdateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade || !editGradeName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await ahApiFetch(`/api/academic/grades/${editingGrade.id}`, {
        method: 'PUT',
        tenantId: activeSchoolId,
        body: JSON.stringify({
          schoolId: activeSchoolId,
          name: editGradeName.trim(),
          gradeNumber: editGradeNumber.trim() !== '' ? Number(editGradeNumber) : null,
          levelBand: editGradeBand,
          academicYear: editGradeYear.trim() || '2026',
          description: editGradeDesc.trim(),
        }),
      });
      notify(`Updated grade "${editGradeName.trim()}".`);
      setEditingGrade(null);
      await loadBootstrap();
    } catch (err: any) {
      notify(err.message, 'err');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteGradeModal = (g: AcademicGrade) => {
    setDeletingGrade(g);
    setDeleteGradeRequiresForce(false);
    setDeleteGradeWarningText(null);
  };

  const handleConfirmDeleteGrade = async (force: boolean) => {
    if (!deletingGrade || submitting) return;
    setSubmitting(true);
    try {
      const res = await ahApiFetch<{ removedGradeName: string; removedStreamsCount: number }>(
        `/api/academic/grades/${deletingGrade.id}${force ? '?force=true' : ''}`,
        {
          method: 'DELETE',
          tenantId: activeSchoolId,
          body: JSON.stringify({ schoolId: activeSchoolId, force }),
        }
      );
      notify(`Removed "${res.removedGradeName}" (${res.removedStreamsCount} stream(s) cleared).`);
      setDeletingGrade(null);
      setDeleteGradeRequiresForce(false);
      setDeleteGradeWarningText(null);
      if (selectedGradeId === deletingGrade.id) setSelectedGradeId('');
      await loadBootstrap();
    } catch (err: any) {
      if (err.status === 409 && err.data?.requiresForce) {
        setDeleteGradeRequiresForce(true);
        setDeleteGradeWarningText(err.message);
      } else {
        notify(err.message, 'err');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkGrades = async () => {
    try {
      const res = await ahApiFetch<{ createdGrades: number; createdStreams: number }>('/api/academic/grades/bulk-setup', {
        method: 'POST',
        tenantId: activeSchoolId,
        body: JSON.stringify({ schoolId: activeSchoolId, startGrade: 1, endGrade: 12, defaultStreams: ['East', 'West', 'North'] }),
      });
      notify(`Provisioned ${res.createdGrades} grades and ${res.createdStreams} streams.`);
      await loadBootstrap();
    } catch (err: any) {
      notify(err.message, 'err');
    }
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamTargetGradeId || !newStreamName.trim()) return;
    try {
      await ahApiFetch('/api/academic/streams', {
        method: 'POST',
        tenantId: activeSchoolId,
        body: JSON.stringify({
          schoolId: activeSchoolId,
          gradeId: streamTargetGradeId,
          name: newStreamName.trim(),
          capacity: Number(newStreamCapacity || 45),
        }),
      });
      setNewStreamName('');
      notify('Stream added cleanly.');
      await loadBootstrap();
    } catch (err: any) {
      notify(err.message, 'err');
    }
  };

  const openEditStreamModal = (s: AcademicStream) => {
    setEditingStream(s);
    setEditStreamGradeId(s.gradeId);
    setEditStreamName(s.name);
    setEditStreamCapacity(String(s.capacity || 45));
    setEditStreamRoomLabel(s.roomLabel || s.displayName || '');
  };

  const handleUpdateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStream || !editStreamGradeId || !editStreamName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await ahApiFetch(`/api/academic/streams/${editingStream.id}`, {
        method: 'PUT',
        tenantId: activeSchoolId,
        body: JSON.stringify({
          schoolId: activeSchoolId,
          gradeId: editStreamGradeId,
          name: editStreamName.trim(),
          capacity: Math.max(10, Number(editStreamCapacity || 45)),
          roomLabel: editStreamRoomLabel.trim(),
        }),
      });
      notify(`Updated stream "${editStreamName.trim()}".`);
      setEditingStream(null);
      await loadBootstrap();
    } catch (err: any) {
      notify(err.message, 'err');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteStreamModal = (s: AcademicStream) => {
    setDeletingStream(s);
    setDeleteStreamRequiresForce(false);
    setDeleteStreamWarningText(null);
  };

  const handleConfirmDeleteStream = async (force: boolean) => {
    if (!deletingStream || submitting) return;
    setSubmitting(true);
    try {
      const res = await ahApiFetch<{ removedDisplayName: string }>(
        `/api/academic/streams/${deletingStream.id}${force ? '?force=true' : ''}`,
        {
          method: 'DELETE',
          tenantId: activeSchoolId,
          body: JSON.stringify({ schoolId: activeSchoolId, force }),
        }
      );
      notify(`Removed stream "${res.removedDisplayName}".`);
      setDeletingStream(null);
      setDeleteStreamRequiresForce(false);
      setDeleteStreamWarningText(null);
      if (selectedStreamId === deletingStream.id) setSelectedStreamId('');
      await loadBootstrap();
    } catch (err: any) {
      if (err.status === 409 && err.data?.requiresForce) {
        setDeleteStreamRequiresForce(true);
        setDeleteStreamWarningText(err.message);
      } else {
        notify(err.message, 'err');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSeniorTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSeniorGradeId || !assignSeniorTeacherId) return;
    try {
      await ahApiFetch(`/api/academic/grades/${assignSeniorGradeId}/assign-senior-teacher`, {
        method: 'POST',
        tenantId: activeSchoolId,
        body: JSON.stringify({ schoolId: activeSchoolId, teacherId: assignSeniorTeacherId }),
      });
      notify('Designated Senior Teacher assigned & historical log preserved.');
      await loadBootstrap();
    } catch (err: any) {
      notify(err.message, 'err');
    }
  };

  const handleAssignClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClassStreamId || !assignClassTeacherId) return;
    try {
      await ahApiFetch(`/api/academic/streams/${assignClassStreamId}/assign-class-teacher`, {
        method: 'POST',
        tenantId: activeSchoolId,
        body: JSON.stringify({ schoolId: activeSchoolId, teacherId: assignClassTeacherId }),
      });
      notify('Designated Class Teacher assigned & historical log preserved.');
      await loadBootstrap();
    } catch (err: any) {
      notify(err.message, 'err');
    }
  };

  const handleTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudent || !transferTargetStreamId) return;
    try {
      await ahApiFetch('/api/academic/students/transfer', {
        method: 'POST',
        tenantId: activeSchoolId,
        body: JSON.stringify({
          schoolId: activeSchoolId,
          studentId: transferStudent.studentId,
          targetStreamId: transferTargetStreamId,
          transferReason,
        }),
      });
      notify(`${transferStudent.studentName} transferred cleanly with history preserved.`);
      setTransferStudent(null);
      await loadBootstrap();
    } catch (err: any) {
      notify(err.message, 'err');
    }
  };

  const handleAdminReviewConsolidated = async (reportId: string) => {
    if (!adminFeedback.trim()) return;
    try {
      await ahApiFetch(`/api/academic/consolidated-reports/${reportId}/admin-review`, {
        method: 'POST',
        tenantId: activeSchoolId,
        body: JSON.stringify({ schoolId: activeSchoolId, status: adminDecision, adminFeedback: adminFeedback.trim() }),
      });
      setReviewingReportId(null);
      setAdminFeedback('');
      notify('Administrative review recorded and Senior Teacher notified.');
      await loadBootstrap();
    } catch (err: any) {
      notify(err.message, 'err');
    }
  };

  const handleExportGradeOverview = async (format: 'pdf' | 'excel') => {
    if (!selectedGradeId) return;
    try {
      const data = await ahApiFetch<any>(
        `/api/academic/reports/export-data?type=consolidated&gradeId=${encodeURIComponent(selectedGradeId)}`,
        { tenantId: activeSchoolId }
      );
      if (format === 'excel') {
        exportAcademicReportToExcel(data.title, activeTenant.name, data.summaryPairs, data.sections);
      } else {
        printAcademicReportPdf(activeTenant, data.title, data.subtitle, data.summaryPairs, data.sections);
      }
    } catch (err: any) {
      notify(err.message, 'err');
    }
  };

  const grades = bootstrap?.grades || [];
  const streams = bootstrap?.streams || [];
  const staff = bootstrap?.staffDirectory || [];
  const compliance = bootstrap?.compliance || { gradesMissingSeniorTeacher: [], streamsMissingClassTeacher: [] };

  const tabs: Array<{ id: AdminAcademicMode; label: string }> = [
    { id: 'grades', label: 'Grade Management' },
    { id: 'streams', label: 'Stream Management' },
    { id: 'senior_assignments', label: 'Senior Teacher Assignments' },
    { id: 'class_assignments', label: 'Class Teacher Assignments' },
    { id: 'grade_performance', label: 'Grade Performance' },
    { id: 'consolidated_reports', label: 'Consolidated Reports' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
              <span>{activeTenant.name}</span>
              <span aria-hidden="true">·</span>
              <span>Grade-Based Academic Governance</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{grades.length} Grades / {streams.length} Streams</span>
            </div>
            <h2 className="text-xl font-bold text-slate-950 mt-0.5">
              Grades, Streams & Academic Leadership Hierarchy
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {allowCampusSelection && allTenants.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="ah-target-campus" className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1 whitespace-nowrap">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Target School:</span>
                </label>
                <select
                  id="ah-target-campus"
                  value={activeSchoolId}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-200 rounded-lg bg-white max-w-[260px]"
                >
                  {allTenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() => void loadBootstrap()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Sub-mode segmented tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectMode(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                effectiveMode === t.id
                  ? 'bg-white text-slate-950 font-semibold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {toast && (
          <div
            className={`text-xs font-medium px-3.5 py-2.5 rounded-lg border ${
              toast.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {toast.text}
          </div>
        )}

        {(compliance.gradesMissingSeniorTeacher.length > 0 || compliance.streamsMissingClassTeacher.length > 0) && (
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Leadership Staffing Check:</span>{' '}
              {compliance.gradesMissingSeniorTeacher.length > 0 && (
                <span>
                  Grades without Senior Teacher: {compliance.gradesMissingSeniorTeacher.join(', ')}.{' '}
                </span>
              )}
              {compliance.streamsMissingClassTeacher.length > 0 && (
                <span>
                  Streams without Class Teacher: {compliance.streamsMissingClassTeacher.slice(0, 6).join(', ')}
                  {compliance.streamsMissingClassTeacher.length > 6 ? '…' : ''}.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODE 1: GRADE MANAGEMENT */}
      {effectiveMode === 'grades' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleCreateGrade} className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Create Grade Level</h3>
              <p className="text-xs text-slate-500">Add Grades 1–12 or custom levels with optional streams.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Name</label>
              <input
                type="text"
                required
                value={newGradeName}
                onChange={(e) => setNewGradeName(e.target.value)}
                placeholder="e.g., Grade 7"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">School Section</label>
              <select
                value={newGradeBand}
                onChange={(e) => setNewGradeBand(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Pre-Primary">Pre-Primary</option>
                <option value="Lower Primary">Lower Primary (Grades 1–3)</option>
                <option value="Upper Primary">Upper Primary (Grades 4–6)</option>
                <option value="Junior School">Junior School (Grades 7–9)</option>
                <option value="Senior School">Senior School (Grades 10–12)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Streams (Comma Separated)</label>
              <input
                type="text"
                value={newGradeStreams}
                onChange={(e) => setNewGradeStreams(e.target.value)}
                placeholder="East, West, North"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Grade</span>
            </button>
            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleBulkGrades}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Auto-Configure Missing Grades 1–12
              </button>
            </div>
          </form>

          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">All School Grades & Designated Coordinators</h3>
              <span className="text-xs font-mono tabular-nums text-slate-500">{grades.length} active</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2.5 pr-3">Grade</th>
                    <th className="py-2.5 pr-3">Section</th>
                    <th className="py-2.5 pr-3">Senior Teacher (Grade Coordinator)</th>
                    <th className="py-2.5 pr-3 text-right">Streams</th>
                    <th className="py-2.5 pr-3 text-right">Students</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {grades.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No grades configured for {activeTenant.name} yet. Use the form on the left to add or auto-configure grades.
                      </td>
                    </tr>
                  ) : (
                    grades.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50">
                        <td className="py-3 pr-3 font-semibold text-slate-950">{g.name}</td>
                        <td className="py-3 pr-3 text-slate-600">{g.levelBand}</td>
                        <td className="py-3 pr-3">
                          {g.seniorTeacherName ? (
                            <span className="font-medium text-emerald-700">{g.seniorTeacherName}</span>
                          ) : (
                            <span className="font-medium text-amber-700">Needs Senior Teacher</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums">{g.streamsCount}</td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums">{g.studentsCount}</td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGradeId(g.id);
                                handleSelectMode('grade_performance');
                              }}
                              className="px-2 py-1 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Inspect
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditGradeModal(g)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                              title={`Edit ${g.name}`}
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteGradeModal(g)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                              title={`Remove ${g.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* MODE 2: STREAM MANAGEMENT & STUDENT TRANSFERS */}
      {effectiveMode === 'streams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={handleCreateStream} className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">Create Stream Under Grade</h3>
                <p className="text-xs text-slate-500">Add East, West, North, or custom class streams.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Grade</label>
                <select
                  value={streamTargetGradeId}
                  onChange={(e) => setStreamTargetGradeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stream Name</label>
                  <input
                    type="text"
                    required
                    value={newStreamName}
                    onChange={(e) => setNewStreamName(e.target.value)}
                    placeholder="e.g., North"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min={10}
                    value={newStreamCapacity}
                    onChange={(e) => setNewStreamCapacity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Stream</span>
              </button>
            </form>

            <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Active Streams & Assigned Class Teachers</h3>
                <span className="text-xs font-mono tabular-nums text-slate-500">{streams.length} streams</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 pr-3">Stream</th>
                      <th className="py-2.5 pr-3">Class Teacher</th>
                      <th className="py-2.5 pr-3 text-right">Enrolled</th>
                      <th className="py-2.5 pr-3 text-right">Capacity</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {streams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No streams configured for {activeTenant.name} yet.
                        </td>
                      </tr>
                    ) : (
                      streams.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2.5 pr-3 font-semibold text-slate-950">{s.displayName}</td>
                          <td className="py-2.5 pr-3">
                            {s.classTeacherName ? (
                              <span className="text-emerald-700 font-medium">{s.classTeacherName}</span>
                            ) : (
                              <span className="text-amber-700 font-medium">Unassigned</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{s.studentsCount}</td>
                          <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{s.capacity}</td>
                          <td className="py-2.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedStreamId(s.id)}
                                className="px-2 py-1 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Roster
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditStreamModal(s)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                                title={`Edit ${s.displayName}`}
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteStreamModal(s)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                                title={`Remove ${s.displayName}`}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Stream Student Roster & Transfer Panel */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Stream Learner Roster & Student Transfers</h3>
                <p className="text-xs text-slate-500">
                  Transfer learners cleanly across streams while preserving full historical enrollment audit logs.
                </p>
              </div>
              <select
                value={selectedStreamId}
                onChange={(e) => setSelectedStreamId(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
              >
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} ({s.studentsCount})
                  </option>
                ))}
              </select>
            </div>

            {streamStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No active students enrolled in this stream yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2 pr-3">Adm No.</th>
                      <th className="py-2 pr-3">Student Name</th>
                      <th className="py-2 pr-3">Parent / Contact</th>
                      <th className="py-2 text-right">Transfer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {streamStudents.map((stu) => (
                      <tr key={stu.studentId}>
                        <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-600">{stu.admissionNumber || '—'}</td>
                        <td className="py-2.5 pr-3 font-semibold text-slate-900">{stu.studentName}</td>
                        <td className="py-2.5 pr-3 text-slate-600">
                          {stu.parentName ? `${stu.parentName} · ${stu.parentPhone || stu.parentEmail || ''}` : stu.email || '—'}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setTransferStudent(stu);
                              setTransferTargetStreamId(streams.find((x) => x.id !== stu.streamId)?.id || '');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Transfer Stream</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* MODE 3: SENIOR TEACHER ASSIGNMENTS */}
      {effectiveMode === 'senior_assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleAssignSeniorTeacher} className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Assign Designated Senior Teacher</h3>
              <p className="text-xs text-slate-500">
                Each active grade has one designated Senior Teacher. Reassigning archives the previous term record cleanly.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Grade</label>
              <select
                value={assignSeniorGradeId}
                onChange={(e) => {
                  setAssignSeniorGradeId(e.target.value);
                  setSelectedGradeId(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.seniorTeacherName ? `(Current: ${g.seniorTeacherName})` : '(Unassigned)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Educator</label>
              <select
                value={assignSeniorTeacherId}
                onChange={(e) => setAssignSeniorTeacherId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Choose teacher / senior teacher...</option>
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} · {st.role.replace(/_/g, ' ')} ({st.email})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Senior Teacher</span>
            </button>
          </form>

          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Senior Teacher Assignment History</h3>
                <p className="text-xs text-slate-500">Preserved audit trail for {grades.find((g) => g.id === selectedGradeId)?.name || 'Selected Grade'}</p>
              </div>
              <History className="w-4 h-4 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2 pr-3">Senior Teacher</th>
                    <th className="py-2 pr-3">Assigned</th>
                    <th className="py-2 pr-3">Ended</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(historyData?.seniorHistory || []).map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 pr-3 font-medium text-slate-900">
                        {h.teacher_name} <span className="text-slate-500 font-normal">({h.teacher_email})</span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-600">{String(h.assigned_at).slice(0, 10)}</td>
                      <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-600">
                        {h.unassigned_at ? String(h.unassigned_at).slice(0, 10) : '—'}
                      </td>
                      <td className={`py-2.5 font-semibold ${h.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {h.is_active ? 'Active Coordinator' : 'Historical Record'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* MODE 4: CLASS TEACHER ASSIGNMENTS */}
      {effectiveMode === 'class_assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleAssignClassTeacher} className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Assign Designated Class Teacher</h3>
              <p className="text-xs text-slate-500">
                Every active stream requires one designated Class Teacher. Historical postings remain intact when reassigned.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Stream</label>
              <select
                value={assignClassStreamId}
                onChange={(e) => {
                  setAssignClassStreamId(e.target.value);
                  const st = streams.find((x) => x.id === e.target.value);
                  if (st) setSelectedGradeId(st.gradeId);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} {s.classTeacherName ? `(Current: ${s.classTeacherName})` : '(Unassigned)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Class Teacher</label>
              <select
                value={assignClassTeacherId}
                onChange={(e) => setAssignClassTeacherId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Choose educator...</option>
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} · {st.role.replace(/_/g, ' ')} ({st.email})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Class Teacher</span>
            </button>
          </form>

          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Stream Class Teacher Assignment History</h3>
                <p className="text-xs text-slate-500">All active and archived Class Teachers in {grades.find((g) => g.id === selectedGradeId)?.name || 'Grade'}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2 pr-3">Stream</th>
                    <th className="py-2 pr-3">Class Teacher</th>
                    <th className="py-2 pr-3">Assigned</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(historyData?.classTeacherHistory || []).map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 pr-3 font-semibold text-slate-900">{h.stream_display_name}</td>
                      <td className="py-2.5 pr-3 text-slate-800">{h.teacher_name}</td>
                      <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-600">{String(h.assigned_at).slice(0, 10)}</td>
                      <td className={`py-2.5 font-semibold ${h.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {h.is_active ? 'Active' : `Ended ${String(h.unassigned_at || '').slice(0, 10)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* MODE 5: GRADE PERFORMANCE COMPARISON */}
      {effectiveMode === 'grade_performance' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cross-Stream Grade Performance</h3>
              <p className="text-xs text-slate-500">
                Senior Teacher: {overview?.seniorTeacher?.teacherName || 'Unassigned'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedGradeId}
                onChange={(e) => setSelectedGradeId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleExportGradeOverview('pdf')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
              <button
                type="button"
                onClick={() => void handleExportGradeOverview('excel')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {overview && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500">Total Students</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 mt-1">
                    {overview.summary.totalStudents}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{overview.summary.streamsCount} streams</div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500">Overall Attendance</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 mt-1">
                    {overview.summary.overallAttendancePct}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Across grade streams</div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500">Academic Performance</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 mt-1">
                    {overview.summary.overallAcademicMean}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Grade assessment mean</div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500">Syllabus Coverage</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 mt-1">
                    {overview.summary.overallSyllabusCoveragePct}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {overview.summary.openInterventionsCount} interventions open
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 pr-3">Stream</th>
                      <th className="py-2.5 pr-3">Class Teacher</th>
                      <th className="py-2.5 pr-3 text-right">Students</th>
                      <th className="py-2.5 pr-3 text-right">Attendance</th>
                      <th className="py-2.5 pr-3 text-right">Academic Mean</th>
                      <th className="py-2.5 pr-3 text-right">Assignments</th>
                      <th className="py-2.5 pr-3 text-right">Syllabus</th>
                      <th className="py-2.5 pr-3 text-right">Interventions</th>
                      <th className="py-2.5">Latest Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {overview.streams.map((st) => (
                      <tr key={st.streamId}>
                        <td className="py-3 pr-3 font-semibold text-slate-950">{st.displayName}</td>
                        <td className="py-3 pr-3 text-slate-700">{st.classTeacherName}</td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums">{st.studentsCount}</td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums">{st.attendanceRate}%</td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums font-semibold">{st.academicMean}%</td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums">{st.assignmentCompletion}%</td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums">{st.syllabusCoverage}%</td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums">{st.openInterventionsCount}</td>
                        <td className="py-3 text-slate-600">{st.latestReportStatus.replace(/_/g, ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {/* MODE 6: CONSOLIDATED GRADE REPORTS */}
      {effectiveMode === 'consolidated_reports' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Consolidated Grade Reports from Senior Teachers</h3>
              <p className="text-xs text-slate-500">
                Inspect consolidated dossiers submitted by Grade Coordinators, provide administrative feedback, and approve.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-600">{consolidatedReports.length} reports</span>
          </div>

          {consolidatedReports.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              No consolidated grade reports have been submitted by Senior Teachers yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {consolidatedReports.map((cr) => (
                <div key={cr.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">{cr.grade_name || cr.grade_id}</span>
                        <span aria-hidden="true">·</span>
                        <span>Coordinator: {cr.senior_teacher_name}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-semibold ${cr.status === 'approved' ? 'text-emerald-700' : 'text-blue-700'}`}>
                          {cr.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {cr.total_streams} streams · {cr.total_students} students · Attend {cr.overall_attendance_rate}% · Mean {cr.overall_academic_mean}%
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-950 mt-0.5">{cr.title}</h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingReportId(reviewingReportId === cr.id ? null : cr.id);
                          setAdminFeedback(cr.admin_feedback || '');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                      >
                        {reviewingReportId === cr.id ? 'Close Review' : 'Review & Send Feedback'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700">{cr.executive_summary}</p>
                  {cr.admin_feedback && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <span className="font-semibold">Admin Review ({cr.admin_reviewer_name || 'Administrator'}):</span> {cr.admin_feedback}
                    </div>
                  )}

                  {reviewingReportId === cr.id && (
                    <div className="pt-2 border-t border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Decision</label>
                          <select
                            value={adminDecision}
                            onChange={(e) => setAdminDecision(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="approved">Approve Report</option>
                            <option value="reviewed">Mark Reviewed</option>
                            <option value="feedback_sent">Send Follow-up Feedback</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Administrative Feedback</label>
                          <input
                            type="text"
                            value={adminFeedback}
                            onChange={(e) => setAdminFeedback(e.target.value)}
                            placeholder="Write endorsement or action instructions for the Senior Teacher..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAdminReviewConsolidated(cr.id)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        Save Review & Notify Senior Teacher
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* EDIT GRADE MODAL */}
      {editingGrade && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateGrade}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-950">Edit Grade Level</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Renaming automatically updates stream labels across {activeTenant.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingGrade(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                aria-label="Close edit grade modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Name</label>
                <input
                  type="text"
                  required
                  value={editGradeName}
                  onChange={(e) => setEditGradeName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Order #</label>
                <input
                  type="number"
                  value={editGradeNumber}
                  onChange={(e) => setEditGradeNumber(e.target.value)}
                  placeholder="Auto"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">School Section</label>
                <select
                  value={editGradeBand}
                  onChange={(e) => setEditGradeBand(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Pre-Primary">Pre-Primary</option>
                  <option value="Lower Primary">Lower Primary</option>
                  <option value="Upper Primary">Upper Primary</option>
                  <option value="Junior School">Junior School</option>
                  <option value="Senior School">Senior School</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={editGradeYear}
                  onChange={(e) => setEditGradeYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={editGradeDesc}
                onChange={(e) => setEditGradeDesc(e.target.value)}
                placeholder="Optional summary"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingGrade(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REMOVE GRADE MODAL */}
      {deletingGrade && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-rose-800">Remove Grade Level</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeTenant.name} · {deletingGrade.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingGrade(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                aria-label="Close remove grade modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Removing <span className="font-bold text-slate-950">{deletingGrade.name}</span> will remove{' '}
              <span className="font-mono tabular-nums font-semibold">{deletingGrade.streamsCount}</span> child stream(s) and their grade coordinator assignment records.
            </p>
            {deleteGradeRequiresForce && deleteGradeWarningText && (
              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{deleteGradeWarningText}</span>
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingGrade(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirmDeleteGrade(deleteGradeRequiresForce)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {submitting
                  ? 'Removing...'
                  : deleteGradeRequiresForce
                    ? 'Confirm Force Removal'
                    : 'Remove Grade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STREAM MODAL */}
      {editingStream && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateStream}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-950">Edit Stream</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update parent grade, stream name, capacity, or room label.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStream(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                aria-label="Close edit stream modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Grade</label>
              <select
                value={editStreamGradeId}
                onChange={(e) => setEditStreamGradeId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stream Name</label>
                <input
                  type="text"
                  required
                  value={editStreamName}
                  onChange={(e) => setEditStreamName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  min={10}
                  required
                  value={editStreamCapacity}
                  onChange={(e) => setEditStreamCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Label</label>
              <input
                type="text"
                value={editStreamRoomLabel}
                onChange={(e) => setEditStreamRoomLabel(e.target.value)}
                placeholder="e.g., Block B Room 4"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingStream(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Stream'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REMOVE STREAM MODAL */}
      {deletingStream && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-rose-800">Remove Stream</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeTenant.name} · {deletingStream.displayName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingStream(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                aria-label="Close remove stream modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Confirm permanent removal of stream <span className="font-bold text-slate-950">{deletingStream.displayName}</span>.
            </p>
            {deleteStreamRequiresForce && deleteStreamWarningText && (
              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{deleteStreamWarningText}</span>
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStream(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirmDeleteStream(deleteStreamRequiresForce)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {submitting
                  ? 'Removing...'
                  : deleteStreamRequiresForce
                    ? 'Confirm Force Removal'
                    : 'Remove Stream'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT STREAM TRANSFER MODAL */}
      {transferStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleTransferStudent}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-slate-950">Transfer Student Between Streams</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Student: <span className="font-semibold text-slate-800">{transferStudent.studentName}</span> · Current:{' '}
                {transferStudent.streamDisplayName}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Grade & Stream</label>
              <select
                required
                value={transferTargetStreamId}
                onChange={(e) => setTransferTargetStreamId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                {streams
                  .filter((s) => s.id !== transferStudent.streamId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName} ({s.studentsCount}/{s.capacity})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Reason</label>
              <input
                type="text"
                required
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Confirm Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
