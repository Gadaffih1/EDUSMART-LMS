import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Copy,
  Edit3,
  FilePlus2,
  FileText,
  FolderKanban,
  GraduationCap,
  Layers,
  Plus,
  Printer,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  Users,
  UsersRound,
  X,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from 'lucide-react';
import type {
  ExecutiveReport,
  ExecutiveReportCategory,
  ExecutiveReportGroup,
  ExecutiveReportSection,
  ExecutiveReportShareTargetType,
  User,
} from '../../types';
import { ClientDataStore } from '../../utils/clientDataStore';
import { useTenant } from '../../context/TenantContext';
import { TenantSchoolLogo } from '../common/TenantSchoolLogo';

interface HeadTeacherReportsManagerProps {
  currentUser: User;
}

interface ShareDraftItem {
  targetType: ExecutiveReportShareTargetType;
  targetId: string;
  targetLabel: string;
  targetMeta?: Record<string, any>;
}

const CATEGORY_META: Record<
  ExecutiveReportCategory,
  { label: string; badgeClass: string; defaultClassification: string }
> = {
  bom_report: {
    label: 'BoM Governance Report',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    defaultClassification: 'CONFIDENTIAL EXECUTIVE BRIEFING',
  },
  academic_report: {
    label: 'Academic & CBC Report',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    defaultClassification: 'ACADEMIC EXECUTIVE REPORT',
  },
  department_review: {
    label: 'Departmental Review',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    defaultClassification: 'DEPARTMENTAL BRIEFING',
  },
  discipline_safety: {
    label: 'Safety, Welfare & Discipline',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    defaultClassification: 'CAMPUS WELFARE BRIEFING',
  },
  finance_operations: {
    label: 'Finance & Operations',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    defaultClassification: 'OPERATIONS & FINANCE BRIEF',
  },
  parent_briefing: {
    label: 'Parents & Guardians Briefing',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    defaultClassification: 'OFFICIAL PARENT CIRCULAR & REPORT',
  },
  general_report: {
    label: 'General / Other Report',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    defaultClassification: 'OFFICIAL SCHOOL REPORT',
  },
};

const TEACHER_ROLE_OPTIONS: Array<{ role: string; label: string }> = [
  { role: 'teacher', label: 'Subject Teachers' },
  { role: 'class_teacher', label: 'Class Teachers' },
  { role: 'hod', label: 'Heads of Department (HODs)' },
  { role: 'senior_teacher', label: 'Senior Teachers' },
  { role: 'deputy_head', label: 'Deputy Head Teacher' },
  { role: 'dean_of_studies', label: 'Dean of Studies' },
  { role: 'curriculum_coordinator', label: 'Curriculum Coordinator' },
  { role: 'librarian', label: 'School Librarian' },
];

const TEACHING_ROLE_SET = new Set(TEACHER_ROLE_OPTIONS.map((t) => t.role));

function shareKey(item: { targetType: string; targetId: string }): string {
  return `${item.targetType}::${item.targetId}`;
}

export const HeadTeacherReportsManager: React.FC<HeadTeacherReportsManagerProps> = ({
  currentUser,
}) => {
  const { currentTenant } = useTenant();
  const [reports, setReports] = useState<ExecutiveReport[]>([]);
  const [groups, setGroups] = useState<ExecutiveReportGroup[]>([]);
  const [departments, setDepartments] = useState<
    Array<{ id: string; name: string; kind: string; subjects: string[]; activities: string[] }>
  >([]);
  const [audienceUsers, setAudienceUsers] = useState<Array<User & { childrenGrades?: number[] }>>([]);
  const [canManage, setCanManage] = useState<boolean>(
    ['head_teacher', 'admin'].includes(currentUser.role)
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create / Edit Modal state
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<ExecutiveReport | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ExecutiveReportCategory>('bom_report');
  const [formClassification, setFormClassification] = useState('CONFIDENTIAL EXECUTIVE BRIEFING');
  const [formReportingPeriod, setFormReportingPeriod] = useState('Term 3 · Academic Year 2026');
  const [formTerm, setFormTerm] = useState('Term 3');
  const [formAcademicYear, setFormAcademicYear] = useState('2026');
  const [formSummary, setFormSummary] = useState('');
  const [formCertifiedBy, setFormCertifiedBy] = useState(
    `Certified by: ${currentUser.name}, Head Teacher`
  );
  const [formDirectorate, setFormDirectorate] = useState('EduSmart Governance Directorate');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('published');
  const [formSections, setFormSections] = useState<ExecutiveReportSection[]>([]);
  const [savingReport, setSavingReport] = useState(false);

  // Share Modal state
  const [shareModalReport, setShareModalReport] = useState<ExecutiveReport | null>(null);
  const [shareTab, setShareTab] = useState<ExecutiveReportShareTargetType>('bom');
  const [draftShares, setDraftShares] = useState<ShareDraftItem[]>([]);
  const [shareNote, setShareNote] = useState('');
  const [notifyOnShare, setNotifyOnShare] = useState(true);
  const [savingShares, setSavingShares] = useState(false);
  const [audienceSearch, setAudienceSearch] = useState('');

  // Custom Group Builder inside Share Modal
  const [groupBuilderOpen, setGroupBuilderOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExecutiveReportGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<ExecutiveReport | null>(null);
  const [deleting, setDeleting] = useState(false);

  const notifyToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4200);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsRes, audienceRes] = await Promise.all([
        ClientDataStore.apiFetchExecutiveReports(currentTenant.id),
        ClientDataStore.apiFetchReportAudienceOptions(currentTenant.id).catch(() => null),
      ]);
      setReports(reportsRes.reports);
      setCanManage(reportsRes.canManage);
      setGroups(audienceRes?.groups || reportsRes.groups || []);
      setDepartments(audienceRes?.departments || reportsRes.departments || []);
      if (audienceRes?.users) {
        setAudienceUsers(audienceRes.users);
      }
      setSelectedReportId((prev) => {
        if (prev && reportsRes.reports.some((r) => r.id === prev)) return prev;
        return reportsRes.reports[0]?.id || null;
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to load reports from database.');
    } finally {
      setLoading(false);
    }
  }, [currentTenant.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const onRealtime = () => {
      void loadData();
    };
    window.addEventListener('executive-reports-updated', onRealtime);
    return () => window.removeEventListener('executive-reports-updated', onRealtime);
  }, [loadData]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchCat = categoryFilter === 'all' || r.category === categoryFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.reportingPeriod.toLowerCase().includes(q) ||
        r.classification.toLowerCase().includes(q) ||
        r.sections.some(
          (s) => s.heading.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)
        );
      return matchCat && matchSearch;
    });
  }, [reports, categoryFilter, searchQuery]);

  const activeReport = useMemo(() => {
    return (
      filteredReports.find((r) => r.id === selectedReportId) ||
      reports.find((r) => r.id === selectedReportId) ||
      filteredReports[0] ||
      reports[0] ||
      null
    );
  }, [filteredReports, reports, selectedReportId]);

  // ---------------------------------------------------------------------------
  // Create / Edit / Duplicate Handlers
  // ---------------------------------------------------------------------------
  const openCreateModal = (presetCategory: ExecutiveReportCategory = 'bom_report') => {
    const meta = CATEGORY_META[presetCategory];
    setEditingReport(null);
    setFormCategory(presetCategory);
    setFormTitle(
      presetCategory === 'bom_report'
        ? 'Board of Management (BOM) Termly Report'
        : 'Institutional Executive Report'
    );
    setFormClassification(meta.defaultClassification);
    setFormReportingPeriod('Term 3 · Academic Year 2026');
    setFormTerm('Term 3');
    setFormAcademicYear('2026');
    setFormSummary('');
    setFormCertifiedBy(`Certified by: ${currentUser.name}, Head Teacher`);
    setFormDirectorate('EduSmart Governance Directorate');
    setFormStatus('published');
    setFormSections(
      presetCategory === 'bom_report'
        ? [
            {
              id: `sec-${Date.now()}-1`,
              heading: 'Institutional Status & Enrollment',
              body: '',
            },
            {
              id: `sec-${Date.now()}-2`,
              heading: 'Competency-Based Curriculum (CBC) Transition',
              body: '',
            },
            {
              id: `sec-${Date.now()}-3`,
              heading: 'Campus Safety, Discipline & Gate Pass Protocol',
              body: '',
            },
          ]
        : [
            {
              id: `sec-${Date.now()}-1`,
              heading: 'Executive Summary & Key Observations',
              body: '',
            },
            {
              id: `sec-${Date.now()}-2`,
              heading: 'Action Plan & Recommendations',
              body: '',
            },
          ]
    );
    setEditorOpen(true);
  };

  const openEditModal = (report: ExecutiveReport) => {
    setEditingReport(report);
    setFormCategory(report.category);
    setFormTitle(report.title);
    setFormClassification(report.classification);
    setFormReportingPeriod(report.reportingPeriod);
    setFormTerm(report.term || 'Term 3');
    setFormAcademicYear(report.academicYear || '2026');
    setFormSummary(report.summary || '');
    setFormCertifiedBy(report.certifiedBy);
    setFormDirectorate(report.directorateLabel || 'EduSmart Governance Directorate');
    setFormStatus(report.status);
    setFormSections(
      report.sections.length > 0
        ? report.sections.map((s) => ({ ...s }))
        : [{ id: `sec-${Date.now()}`, heading: 'Section 1', body: '' }]
    );
    setEditorOpen(true);
  };

  const handleDuplicateReport = async (report: ExecutiveReport) => {
    try {
      const created = await ClientDataStore.apiCreateExecutiveReport({
        schoolId: currentTenant.id,
        title: `${report.title} (Copy)`,
        category: report.category,
        classification: report.classification,
        reportingPeriod: report.reportingPeriod,
        term: report.term,
        academicYear: report.academicYear,
        summary: report.summary,
        sections: report.sections.map((s, idx) => ({
          id: `sec-${Date.now()}-${idx}`,
          heading: s.heading,
          body: s.body,
        })),
        certifiedBy: `Certified by: ${currentUser.name}, Head Teacher`,
        directorateLabel: report.directorateLabel,
        status: 'draft',
      });
      await loadData();
      setSelectedReportId(created.id);
      notifyToast(`Duplicated "${report.title}" as a new draft.`);
    } catch (err: any) {
      setError(err?.message || 'Could not duplicate report.');
    }
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError('Please enter a report title.');
      return;
    }
    const cleanSections = formSections
      .map((s, i) => ({
        id: s.id || `sec-${i + 1}`,
        heading: s.heading.trim(),
        body: s.body.trim(),
      }))
      .filter((s) => s.heading || s.body);
    if (cleanSections.length === 0) {
      setError('Please add at least one section with a heading or content.');
      return;
    }

    setSavingReport(true);
    setError(null);
    try {
      if (editingReport) {
        const updated = await ClientDataStore.apiUpdateExecutiveReport(editingReport.id, {
          title: formTitle.trim(),
          category: formCategory,
          classification: formClassification.trim() || 'CONFIDENTIAL EXECUTIVE BRIEFING',
          reportingPeriod: formReportingPeriod.trim() || 'Term 3 · Academic Year 2026',
          term: formTerm.trim(),
          academicYear: formAcademicYear.trim(),
          summary: formSummary.trim(),
          sections: cleanSections,
          certifiedBy: formCertifiedBy.trim() || `Certified by: ${currentUser.name}, Head Teacher`,
          directorateLabel: formDirectorate.trim() || 'EduSmart Governance Directorate',
          status: formStatus,
        });
        setSelectedReportId(updated.id);
        notifyToast(`Updated "${updated.title}".`);
      } else {
        const created = await ClientDataStore.apiCreateExecutiveReport({
          schoolId: currentTenant.id,
          title: formTitle.trim(),
          category: formCategory,
          classification: formClassification.trim() || 'CONFIDENTIAL EXECUTIVE BRIEFING',
          reportingPeriod: formReportingPeriod.trim() || 'Term 3 · Academic Year 2026',
          term: formTerm.trim(),
          academicYear: formAcademicYear.trim(),
          summary: formSummary.trim(),
          sections: cleanSections,
          certifiedBy: formCertifiedBy.trim() || `Certified by: ${currentUser.name}, Head Teacher`,
          directorateLabel: formDirectorate.trim() || 'EduSmart Governance Directorate',
          status: formStatus,
          shares:
            formCategory === 'bom_report'
              ? [
                  {
                    targetType: 'bom',
                    targetId: 'bom_board',
                    targetLabel: 'Board of Management (BoM)',
                    targetMeta: { boardScope: 'full_bom' },
                  },
                ]
              : [],
        });
        setSelectedReportId(created.id);
        notifyToast(`Created "${created.title}".`);
      }
      setEditorOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed saving report.');
    } finally {
      setSavingReport(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ClientDataStore.apiDeleteExecutiveReport(deleteTarget.id);
      notifyToast(`Deleted "${deleteTarget.title}".`);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed deleting report.');
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Share Modal Handlers
  // ---------------------------------------------------------------------------
  const openShareModal = (report: ExecutiveReport) => {
    setShareModalReport(report);
    setShareTab('bom');
    setDraftShares(
      (report.shares || []).map((s) => ({
        targetType: s.targetType,
        targetId: s.targetId,
        targetLabel: s.targetLabel,
        targetMeta: s.targetMeta || {},
      }))
    );
    setShareNote('');
    setNotifyOnShare(true);
    setAudienceSearch('');
    setGroupBuilderOpen(false);
  };

  const isShareSelected = (targetType: ExecutiveReportShareTargetType, targetId: string) =>
    draftShares.some((s) => s.targetType === targetType && s.targetId === targetId);

  const toggleShareTarget = (item: ShareDraftItem) => {
    setDraftShares((prev) => {
      const exists = prev.some((s) => shareKey(s) === shareKey(item));
      if (exists) {
        return prev.filter((s) => shareKey(s) !== shareKey(item));
      }
      return [...prev, item];
    });
  };

  const handleSaveShares = async () => {
    if (!shareModalReport) return;
    setSavingShares(true);
    setError(null);
    try {
      const updated = await ClientDataStore.apiShareExecutiveReport(shareModalReport.id, {
        shares: draftShares,
        sharedNote: shareNote.trim(),
        publish: true,
        notifyRecipients: notifyOnShare,
      });
      setShareModalReport(null);
      await loadData();
      setSelectedReportId(updated.id);
      notifyToast(
        draftShares.length > 0
          ? `Shared "${updated.title}" with ${draftShares.length} specific target(s).`
          : `Cleared sharing recipients for "${updated.title}".`
      );
    } catch (err: any) {
      setError(err?.message || 'Failed updating sharing targets.');
    } finally {
      setSavingShares(false);
    }
  };

  // Custom Group Builder Handlers
  const openGroupBuilder = (group?: ExecutiveReportGroup) => {
    if (group && !group.isBuiltIn) {
      setEditingGroup(group);
      setGroupName(group.name);
      setGroupDescription(group.description || '');
      setGroupMemberIds(group.memberUserIds || []);
    } else {
      setEditingGroup(null);
      setGroupName('');
      setGroupDescription('');
      setGroupMemberIds([]);
    }
    setGroupMemberSearch('');
    setGroupBuilderOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name.');
      return;
    }
    setSavingGroup(true);
    try {
      let saved: ExecutiveReportGroup;
      if (editingGroup) {
        saved = await ClientDataStore.apiUpdateReportGroup(editingGroup.id, {
          name: groupName.trim(),
          description: groupDescription.trim(),
          memberUserIds: groupMemberIds,
          memberRoles: [],
        });
      } else {
        saved = await ClientDataStore.apiCreateReportGroup({
          schoolId: currentTenant.id,
          name: groupName.trim(),
          description: groupDescription.trim(),
          memberUserIds: groupMemberIds,
          memberRoles: [],
        });
        // Automatically select newly created custom group in draft shares
        setDraftShares((prev) => {
          const item: ShareDraftItem = {
            targetType: 'group',
            targetId: saved.id,
            targetLabel: `Group: ${saved.name}`,
            targetMeta: { memberCount: saved.memberUserIds.length },
          };
          if (prev.some((s) => shareKey(s) === shareKey(item))) return prev;
          return [...prev, item];
        });
      }
      setGroupBuilderOpen(false);
      await loadData();
      notifyToast(`Saved recipient group "${saved.name}".`);
    } catch (err: any) {
      setError(err?.message || 'Failed saving group.');
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteCustomGroup = async (groupId: string) => {
    try {
      await ClientDataStore.apiDeleteReportGroup(groupId);
      setDraftShares((prev) => prev.filter((s) => !(s.targetType === 'group' && s.targetId === groupId)));
      await loadData();
      notifyToast('Recipient group removed.');
    } catch (err: any) {
      setError(err?.message || 'Failed deleting group.');
    }
  };

  // Filtered audience helpers
  const teacherUsers = useMemo(
    () => audienceUsers.filter((u) => TEACHING_ROLE_SET.has(u.role)),
    [audienceUsers]
  );
  const parentUsers = useMemo(
    () => audienceUsers.filter((u) => u.role === 'parent'),
    [audienceUsers]
  );
  const bomUsers = useMemo(
    () =>
      audienceUsers.filter(
        (u) =>
          ['admin', 'head_teacher', 'deputy_head', 'finance_officer'].includes(u.role) ||
          String(u.designation || '').toLowerCase().includes('bom') ||
          String(u.designation || '').toLowerCase().includes('board')
      ),
    [audienceUsers]
  );

  const moveSection = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta;
    if (nextIdx < 0 || nextIdx >= formSections.length) return;
    setFormSections((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIdx, 0, item);
      return copy;
    });
  };

  return (
    <section className="space-y-5">
      {/* Control Toolbar (hidden when printing) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>Head Teacher Reports &amp; BoM Governance Directorate</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              BoM Reports &amp; Institutional Briefing Studio
            </h2>
            <p className="text-xs text-slate-600">
              Create, edit, delete, and share BoM or institutional reports directly with BoM, Teachers, Departments, Parents, Individuals, or Custom Groups.
            </p>
          </div>

          {canManage && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openCreateModal('bom_report')}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add BoM Report</span>
              </button>
              <button
                type="button"
                onClick={() => openCreateModal('general_report')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Create Other Report</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search BoM reports, termly briefings, sections..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="all">All Report Types ({reports.length})</option>
            {(Object.keys(CATEGORY_META) as ExecutiveReportCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_META[cat].label}
              </option>
            ))}
          </select>
        </div>

        {toast && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Split: Reports Selector + Active Executive Briefing Sheet */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left List of Reports (hidden on print) */}
        <aside className="xl:col-span-4 space-y-2.5 print:hidden">
          {loading && reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              Loading institutional reports from database...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-bold text-slate-700">No reports match your filter</div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => openCreateModal('bom_report')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create BoM Report</span>
                </button>
              )}
            </div>
          ) : (
            filteredReports.map((rep) => {
              const isActive = activeReport?.id === rep.id;
              const catMeta = CATEGORY_META[rep.category] || CATEGORY_META.general_report;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isActive
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/15 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catMeta.badgeClass}`}
                    >
                      {catMeta.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        rep.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rep.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-snug">{rep.title}</h3>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      {rep.reportingPeriod}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Share2 className="w-3 h-3 text-emerald-600" />
                      {rep.shares.length > 0
                        ? `Shared to ${rep.shares.length} target${rep.shares.length === 1 ? '' : 's'}`
                        : 'Not shared yet'}
                    </span>
                    <span>{rep.sections.length} sections</span>
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Right: Active Report Document View (matches screenshot layout + management actions) */}
        <div className="xl:col-span-8">
          {activeReport ? (
            <div className="space-y-4">
              {/* Management Action Bar for Active Report */}
              {canManage && (
                <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 shadow-xs print:hidden">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">Shared with:</span>
                    {activeReport.shares.length === 0 ? (
                      <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Private (Head Teacher / Admin Only)
                      </span>
                    ) : (
                      activeReport.shares.map((s) => (
                        <span
                          key={s.id}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          {s.targetLabel}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openShareModal(activeReport)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share to Specifics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(activeReport)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDuplicateReport(activeReport)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      title="Duplicate report as draft"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Clone</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(activeReport)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Executive Briefing Dossier Card (Screenshot-faithful layout) */}
              <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 border-t-4 border-t-emerald-600 print:m-0 print:border-none print:shadow-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-1.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs shrink-0">
                      <TenantSchoolLogo variant="full" size="sm" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                        {currentTenant.name}
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {activeReport.classification}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                        {activeReport.title}
                      </h2>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Reporting Period: {activeReport.reportingPeriod}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto cursor-pointer print:hidden"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>
                      {activeReport.category === 'bom_report'
                        ? 'Print BOM Dossier'
                        : 'Print Report Dossier'}
                    </span>
                  </button>
                </div>

                {activeReport.summary && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                      Executive Abstract
                    </span>
                    {activeReport.summary}
                  </div>
                )}

                <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                  {activeReport.sections.map((sec, idx) => (
                    <div key={sec.id || idx} className="space-y-1.5">
                      <h3 className="text-sm font-bold text-slate-900 uppercase">
                        {idx + 1}. {sec.heading}
                      </h3>
                      <p className="whitespace-pre-line">{sec.body}</p>
                    </div>
                  ))}

                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-mono">
                    <div>{activeReport.certifiedBy}</div>
                    <div>{activeReport.directorateLabel}</div>
                  </div>
                </div>
              </article>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
              Select a report or create a new BoM / Institutional Report to get started.
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          MODAL 1: CREATE / EDIT REPORT (BoM OR ANY OTHER REPORT)
          ===================================================================== */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl my-8 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">
                    {editingReport ? `Edit Report: ${editingReport.title}` : 'Create New Executive / School Report'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Saved strictly in the school database and available across all browsers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditor} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Report Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as ExecutiveReportCategory;
                      setFormCategory(cat);
                      if (!editingReport) {
                        setFormClassification(CATEGORY_META[cat].defaultClassification);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {(Object.keys(CATEGORY_META) as ExecutiveReportCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_META[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Publication Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'draft' | 'published')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="published">Published (Visible to Shared Recipients)</option>
                    <option value="draft">Draft (Head Teacher Only)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Report Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Board of Management (BOM) Termly Report"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Classification Subtitle</label>
                  <input
                    type="text"
                    value={formClassification}
                    onChange={(e) => setFormClassification(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL EXECUTIVE BRIEFING"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reporting Period *</label>
                  <input
                    type="text"
                    required
                    value={formReportingPeriod}
                    onChange={(e) => setFormReportingPeriod(e.target.value)}
                    placeholder="Term 3 · Academic Year 2026"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Term</label>
                  <select
                    value={formTerm}
                    onChange={(e) => setFormTerm(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Annual">Annual</option>
                    <option value="Special">Special Briefing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    placeholder="2026"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Executive Abstract / Overview (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Optional concise summary appearing at the top of the report..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Dynamic Numbered Sections Builder */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                      Report Sections ({formSections.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Add, edit, reorder, or remove numbered report sections.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormSections((prev) => [
                        ...prev,
                        {
                          id: `sec-${Date.now()}-${prev.length + 1}`,
                          heading: '',
                          body: '',
                        },
                      ])
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </button>
                </div>

                {formSections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-slate-700 uppercase">
                        Section {idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, -1)}
                          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === formSections.length - 1}
                          onClick={() => moveSection(idx, 1)}
                          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        {formSections.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormSections((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 cursor-pointer"
                            title="Remove section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={sec.heading}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormSections((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, heading: val } : item))
                        );
                      }}
                      placeholder={`Section ${idx + 1} Heading (e.g. Institutional Status & Enrollment)`}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold"
                    />
                    <textarea
                      rows={3}
                      value={sec.body}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormSections((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, body: val } : item))
                        );
                      }}
                      placeholder="Write detailed findings, figures, metrics, or directives..."
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Certification Line</label>
                  <input
                    type="text"
                    value={formCertifiedBy}
                    onChange={(e) => setFormCertifiedBy(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Directorate / Footer Label</label>
                  <input
                    type="text"
                    value={formDirectorate}
                    onChange={(e) => setFormDirectorate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReport}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black disabled:opacity-60 cursor-pointer"
                >
                  {savingReport
                    ? 'Saving to Database…'
                    : editingReport
                    ? 'Save Report Changes'
                    : 'Save & Create Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: GRANULAR SHARE TO SPECIFICS (BoM, Teachers, Departments, Parents, Individual, Group)
          ===================================================================== */}
      {shareModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl my-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Share Report: {shareModalReport.title}</h3>
                  <p className="text-[11px] text-slate-300">
                    Select exact recipients across BoM, Teachers, Departments, Parents, Individuals, or Groups.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalReport(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
              {/* Target Type Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {[
                  { id: 'bom', label: 'BoM', icon: Building2 },
                  { id: 'teachers', label: 'Teachers', icon: GraduationCap },
                  { id: 'departments', label: 'Departments', icon: FolderKanban },
                  { id: 'parents', label: 'Parents', icon: Users },
                  { id: 'individual', label: 'Individual', icon: UserIcon },
                  { id: 'group', label: 'Group', icon: UsersRound },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const count = draftShares.filter((s) => s.targetType === tab.id).length;
                  const active = shareTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setShareTab(tab.id as ExecutiveReportShareTargetType);
                        setAudienceSearch('');
                      }}
                      className={`px-3 py-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                            active ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 min-h-[240px]">
                {/* 1. BoM Tab */}
                {shareTab === 'bom' && (
                  <div className="space-y-3">
                    <div className="font-bold text-slate-900">Board of Management (BoM) Distribution</div>
                    <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
                      <input
                        type="checkbox"
                        checked={isShareSelected('bom', 'bom_board')}
                        onChange={() =>
                          toggleShareTarget({
                            targetType: 'bom',
                            targetId: 'bom_board',
                            targetLabel: 'Board of Management (BoM)',
                            targetMeta: { boardScope: 'full_bom' },
                          })
                        }
                        className="mt-0.5 rounded border-slate-300 text-emerald-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Full Board of Management (BoM) &amp; Governance Directorate</div>
                        <div className="text-[11px] text-slate-500">
                          Delivers to Board governance portal, School Admin, Deputy Head, Finance Bursar, and designated BoM members.
                        </div>
                      </div>
                    </label>

                    {bomUsers.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-600 uppercase">
                          Or Tag Specific BoM / Governance Representatives
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {bomUsers.map((u) => {
                            const targetId = `bom:${u.id}`;
                            return (
                              <label
                                key={u.id}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isShareSelected('bom', targetId)}
                                  onChange={() =>
                                    toggleShareTarget({
                                      targetType: 'bom',
                                      targetId,
                                      targetLabel: `BoM: ${u.name}`,
                                      targetMeta: { memberUserIds: [u.id] },
                                    })
                                  }
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">{u.name}</div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    {u.designation || u.role.replace(/_/g, ' ')} · {u.email}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Teachers Tab */}
                {shareTab === 'teachers' && (
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
                      <input
                        type="checkbox"
                        checked={isShareSelected('teachers', 'all')}
                        onChange={() =>
                          toggleShareTarget({
                            targetType: 'teachers',
                            targetId: 'all',
                            targetLabel: 'All Teachers & Academic Staff',
                          })
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">All Teachers &amp; Academic Staff</div>
                        <div className="text-[11px] text-slate-500">
                          Shares with all Subject Teachers, Class Teachers, HODs, Senior Teachers, Deans &amp; Librarian.
                        </div>
                      </div>
                    </label>

                    <div>
                      <div className="text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                        Or Share by Specific Teaching Role
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {TEACHER_ROLE_OPTIONS.map((tr) => {
                          const targetId = `role:${tr.role}`;
                          return (
                            <label
                              key={tr.role}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isShareSelected('teachers', targetId)}
                                onChange={() =>
                                  toggleShareTarget({
                                    targetType: 'teachers',
                                    targetId,
                                    targetLabel: `Teachers: ${tr.label}`,
                                  })
                                }
                              />
                              <span className="font-semibold text-slate-800">{tr.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-slate-600 uppercase">
                          Or Select Specific Teachers ({teacherUsers.length})
                        </span>
                        <input
                          type="text"
                          value={audienceSearch}
                          onChange={(e) => setAudienceSearch(e.target.value)}
                          placeholder="Filter teachers..."
                          className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {teacherUsers
                          .filter(
                            (u) =>
                              !audienceSearch.trim() ||
                              u.name.toLowerCase().includes(audienceSearch.toLowerCase()) ||
                              u.email.toLowerCase().includes(audienceSearch.toLowerCase())
                          )
                          .map((u) => (
                            <label
                              key={u.id}
                              className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isShareSelected('teachers', u.id)}
                                onChange={() =>
                                  toggleShareTarget({
                                    targetType: 'teachers',
                                    targetId: u.id,
                                    targetLabel: `Teacher: ${u.name}`,
                                    targetMeta: { userIds: [u.id] },
                                  })
                                }
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{u.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {u.role.replace(/_/g, ' ')} {u.department ? `· ${u.department}` : ''}
                                </div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Departments Tab */}
                {shareTab === 'departments' && (
                  <div className="space-y-3">
                    <div>
                      <div className="font-bold text-slate-900">Select Specific School Departments</div>
                      <p className="text-[11px] text-slate-500">
                        Automatically reaches Heads of Department (HODs) and all teachers/staff belonging to each selected department.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto">
                      {departments.map((dept) => {
                        const checked = isShareSelected('departments', dept.name);
                        return (
                          <label
                            key={dept.id}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer ${
                              checked
                                ? 'bg-emerald-50/70 border-emerald-400'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleShareTarget({
                                  targetType: 'departments',
                                  targetId: dept.name,
                                  targetLabel: `Dept: ${dept.name}`,
                                  targetMeta: { departmentId: dept.id, departmentName: dept.name },
                                })
                              }
                              className="mt-0.5"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900">{dept.name}</div>
                              {dept.subjects?.length > 0 && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Subjects: {dept.subjects.join(', ')}
                                </div>
                              )}
                              {dept.activities?.length > 0 && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Operations: {dept.activities.join(', ')}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Parents Tab */}
                {shareTab === 'parents' && (
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
                      <input
                        type="checkbox"
                        checked={isShareSelected('parents', 'all')}
                        onChange={() =>
                          toggleShareTarget({
                            targetType: 'parents',
                            targetId: 'all',
                            targetLabel: 'All School Parents & Guardians',
                          })
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">All Parents &amp; Guardians</div>
                        <div className="text-[11px] text-slate-500">
                          Publishes report to every verified parent portal across Grades 1 to 9.
                        </div>
                      </div>
                    </label>

                    <div>
                      <div className="text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                        Or Target Parents by Child Grade Level
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => {
                          const targetId = `grade:${g}`;
                          return (
                            <label
                              key={g}
                              className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isShareSelected('parents', targetId)}
                                onChange={() =>
                                  toggleShareTarget({
                                    targetType: 'parents',
                                    targetId,
                                    targetLabel: `Grade ${g} Parents`,
                                    targetMeta: { grade: g },
                                  })
                                }
                              />
                              <span className="font-bold text-slate-800">Grade {g}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-slate-600 uppercase">
                          Or Specific Individual Parents ({parentUsers.length})
                        </span>
                        <input
                          type="text"
                          value={audienceSearch}
                          onChange={(e) => setAudienceSearch(e.target.value)}
                          placeholder="Search parents..."
                          className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                        {parentUsers
                          .filter(
                            (u) =>
                              !audienceSearch.trim() ||
                              u.name.toLowerCase().includes(audienceSearch.toLowerCase()) ||
                              u.email.toLowerCase().includes(audienceSearch.toLowerCase())
                          )
                          .map((u) => (
                            <label
                              key={u.id}
                              className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isShareSelected('parents', u.id)}
                                onChange={() =>
                                  toggleShareTarget({
                                    targetType: 'parents',
                                    targetId: u.id,
                                    targetLabel: `Parent: ${u.name}`,
                                    targetMeta: { userIds: [u.id] },
                                  })
                                }
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{u.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {u.email}
                                  {u.childrenGrades?.length ? ` · Gr ${u.childrenGrades.join(', ')}` : ''}
                                </div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Individual Tab */}
                {shareTab === 'individual' && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">Share with Specific Individual Users</div>
                        <div className="text-[11px] text-slate-500">
                          Pick any individual teacher, parent, HOD, bursar, admin staff, or learner in {currentTenant.name}.
                        </div>
                      </div>
                      <input
                        type="text"
                        value={audienceSearch}
                        onChange={(e) => setAudienceSearch(e.target.value)}
                        placeholder="Search by name, email, role..."
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white sm:w-64"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {audienceUsers
                        .filter((u) => {
                          const q = audienceSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            u.name.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q) ||
                            u.role.toLowerCase().includes(q) ||
                            String(u.department || '').toLowerCase().includes(q)
                          );
                        })
                        .map((u) => (
                          <label
                            key={u.id}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-emerald-400"
                          >
                            <input
                              type="checkbox"
                              checked={isShareSelected('individual', u.id)}
                              onChange={() =>
                                toggleShareTarget({
                                  targetType: 'individual',
                                  targetId: u.id,
                                  targetLabel: `${u.name} (${u.role.replace(/_/g, ' ')})`,
                                  targetMeta: { userIds: [u.id], email: u.email },
                                })
                              }
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{u.name}</div>
                              <div className="text-[10px] text-slate-500 truncate">
                                <span className="uppercase font-semibold text-emerald-700">
                                  {u.role.replace(/_/g, ' ')}
                                </span>{' '}
                                · {u.email}
                              </div>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                )}

                {/* 6. Group Tab (Cohort Groups + Custom Named Groups) */}
                {shareTab === 'group' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">Share with School Cohort or Custom Group</div>
                        <div className="text-[11px] text-slate-500">
                          Choose a built-in committee/cohort or build your own named recipient group stored in the database.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openGroupBuilder()}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Custom Group</span>
                      </button>
                    </div>

                    {groupBuilderOpen && (
                      <div className="p-4 rounded-xl bg-white border-2 border-emerald-500 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-slate-900">
                            {editingGroup ? `Edit Group: ${editingGroup.name}` : 'New Custom Recipient Group'}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setGroupBuilderOpen(false)}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Group Name (e.g. BoM Finance Committee)"
                            className="p-2 rounded-lg border border-slate-300"
                          />
                          <input
                            type="text"
                            value={groupDescription}
                            onChange={(e) => setGroupDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="p-2 rounded-lg border border-slate-300"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[11px] font-bold text-slate-700">
                              Select Group Members ({groupMemberIds.length} selected)
                            </span>
                            <input
                              type="text"
                              value={groupMemberSearch}
                              onChange={(e) => setGroupMemberSearch(e.target.value)}
                              placeholder="Filter users..."
                              className="px-2 py-1 text-[11px] rounded-lg border border-slate-300"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                            {audienceUsers
                              .filter(
                                (u) =>
                                  !groupMemberSearch.trim() ||
                                  u.name.toLowerCase().includes(groupMemberSearch.toLowerCase()) ||
                                  u.role.toLowerCase().includes(groupMemberSearch.toLowerCase())
                              )
                              .map((u) => {
                                const checked = groupMemberIds.includes(u.id);
                                return (
                                  <label
                                    key={u.id}
                                    className="flex items-center gap-2 p-1.5 rounded bg-white border border-slate-200 cursor-pointer text-[11px]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        setGroupMemberIds((prev) =>
                                          prev.includes(u.id)
                                            ? prev.filter((id) => id !== u.id)
                                            : [...prev, u.id]
                                        )
                                      }
                                    />
                                    <span className="truncate font-semibold">{u.name}</span>
                                    <span className="text-[10px] text-slate-400 uppercase ml-auto">
                                      {u.role.replace(/_/g, ' ')}
                                    </span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setGroupBuilderOpen(false)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingGroup}
                            onClick={() => void handleSaveGroup()}
                            className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white font-bold disabled:opacity-60 cursor-pointer"
                          >
                            {savingGroup ? 'Saving…' : 'Save Group'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto">
                      {groups.map((grp) => {
                        const checked = isShareSelected('group', grp.id);
                        return (
                          <div
                            key={grp.id}
                            className={`flex items-start justify-between gap-2 p-3 rounded-xl border ${
                              checked
                                ? 'bg-emerald-50/70 border-emerald-400'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleShareTarget({
                                    targetType: 'group',
                                    targetId: grp.id,
                                    targetLabel: `Group: ${grp.name}`,
                                    targetMeta: {
                                      isBuiltIn: Boolean(grp.isBuiltIn),
                                      memberCount: grp.memberUserIds?.length || 0,
                                    },
                                  })
                                }
                                className="mt-0.5"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span className="truncate">{grp.name}</span>
                                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                    {grp.isBuiltIn
                                      ? 'Cohort'
                                      : `${grp.memberUserIds?.length || 0} members`}
                                  </span>
                                </div>
                                {grp.description && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {grp.description}
                                  </div>
                                )}
                              </div>
                            </label>

                            {!grp.isBuiltIn && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openGroupBuilder(grp)}
                                  className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                                  title="Edit group"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteCustomGroup(grp.id)}
                                  className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                  title="Delete group"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Targets Summary Chips */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase">
                  Selected Share Recipients ({draftShares.length})
                </div>
                {draftShares.length === 0 ? (
                  <div className="text-[11px] text-slate-500 italic">
                    No recipients selected. Saving will restrict this report to Head Teacher / School Admin only.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {draftShares.map((s) => (
                      <span
                        key={shareKey(s)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold text-[11px]"
                      >
                        <span>{s.targetLabel}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftShares((prev) =>
                              prev.filter((item) => shareKey(item) !== shareKey(s))
                            )
                          }
                          className="text-emerald-700 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Share Note + Notification Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cover Note for Recipients (Optional)
                  </label>
                  <input
                    type="text"
                    value={shareNote}
                    onChange={(e) => setShareNote(e.target.value)}
                    placeholder="e.g. Please review prior to Friday BoM & Staff Briefing."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyOnShare}
                      onChange={(e) => setNotifyOnShare(e.target.checked)}
                    />
                    <span className="font-semibold text-slate-800">
                      Send real-time notification alert to selected recipients
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShareModalReport(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingShares}
                  onClick={() => void handleSaveShares()}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{savingShares ? 'Sharing…' : 'Confirm & Share Report'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: CONFIRM DELETE REPORT
          ===================================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-950">Delete Report</h3>
                  <p className="text-[11px] text-rose-700 font-mono">{deleteTarget.reportingPeriod}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900">{deleteTarget.title}</strong>? It will be removed from the central database and revoked from all shared recipients.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleConfirmDelete()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black disabled:opacity-60 cursor-pointer"
                >
                  {deleting ? 'Deleting…' : 'Delete Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
