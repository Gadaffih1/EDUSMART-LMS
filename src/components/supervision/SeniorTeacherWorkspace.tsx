import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bus,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  LayoutDashboard,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  Printer,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { GradeLevel, User } from '../../types';
import { Storage } from '../../utils/storage';
import { useTenant } from '../../context/TenantContext';
import { ReportingHub } from '../reports/ReportingHub';
import { TenantSchoolLogo } from '../common/TenantSchoolLogo';
import { WorkEntryAuditViewer } from '../common/WorkEntryAuditViewer';
import { SanatoriumSection } from '../sanatorium/SanatoriumSection';
import { TransportWorkspace } from '../transport/TransportWorkspace';
import { CoCurricularWorkspace } from '../cocurricular/CoCurricularWorkspace';
import { WorkspaceSidebar, WorkspaceSidebarGroup } from '../layout/WorkspaceSidebar';
import { SchoolStaffAppraisal } from '../admin/TeacherAppraisalPages';
import {
  ahApiFetch,
  type AcademicBootstrapPayload,
  type ClassTeacherReportItem,
  type ConsolidatedGradeReportItem,
  type GradeAnnouncementItem,
  type GradeNotificationItem,
  type GradeOverviewPayload,
} from '../academic-hierarchy/academicHierarchyTypes';
import {
  exportAcademicReportToExcel,
  printAcademicReportPdf,
} from '../academic-hierarchy/academicReportExporter';
import {
  AcademicMonitoringPanel,
  AcademicNotificationsPanel,
  GradeAnnouncementsPanel,
  SeniorClassReportReviewList,
  StudentInterventionsPanel,
} from '../academic-hierarchy/GradeReportSubmitAndReviewPanels';
import { SeniorVirtualClassroomManager } from '../virtual-classroom/SeniorVirtualClassroomManager';
import { StudentStreamManager } from '../teacher/StudentStreamManager';
import { canAccessStudentStreamAllocation } from '../../utils/subjectTeacherSwitch';

interface SeniorTeacherWorkspaceProps {
  currentUser: User;
}

type SupervisionTab =
  | 'dashboard'
  | 'my_grade'
  | 'streams'
  | 'student_stream_allocation'
  | 'class_teachers'
  | 'students'
  | 'attendance_monitor'
  | 'academic_performance'
  | 'syllabus_coverage'
  | 'interventions'
  | 'grade_reports'
  | 'announcements'
  | 'notifications'
  | 'gate_safety'
  | 'staff_appraisal'
  | 'work_entry_audit'
  | 'sanatorium'
  | 'transport'
  | 'cocurricular'
  | 'mentorship'
  | 'curriculum_coordination'
  | 'virtual_classrooms'
  | 'reporting_hub';

const REPORT_CATALOG: Array<{ key: string; label: string; description: string }> = [
  { key: 'weekly', label: 'Weekly Grade Report', description: 'Weekly stream roll call, class reports & syllabus pacing' },
  { key: 'monthly', label: 'Monthly Grade Report', description: 'Monthly attendance trend & assessment mean summary' },
  { key: 'termly', label: 'Termly Academic Performance', description: 'Full term subject comparison & learning area standings' },
  { key: 'attendance', label: 'Attendance Compliance Report', description: 'Stream attendance percentages & truancy follow-ups' },
  { key: 'teacher_activity', label: 'Teacher Activity Report', description: 'Class Teacher reporting cadence & review compliance' },
  { key: 'syllabus', label: 'Syllabus Coverage Report', description: 'Topics planned vs completed & lessons delivered' },
  { key: 'intervention', label: 'Student Intervention Report', description: 'Remedial plans, target scores & open learner cases' },
  { key: 'consolidated', label: 'Consolidated Grade Performance', description: 'Executive grade dossier for School Administration' },
];

export const SeniorTeacherWorkspace: React.FC<SeniorTeacherWorkspaceProps> = ({ currentUser }) => {
  const { currentTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<SupervisionTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [vcInitialModalMode, setVcInitialModalMode] = useState<'schedule' | 'instant' | null>(null);

  // Backend-scoped Grade Coordinator state
  const [bootstrap, setBootstrap] = useState<AcademicBootstrapPayload | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [overview, setOverview] = useState<GradeOverviewPayload | null>(null);
  const [classReports, setClassReports] = useState<ClassTeacherReportItem[]>([]);
  const [consolidatedReports, setConsolidatedReports] = useState<ConsolidatedGradeReportItem[]>([]);
  const [announcements, setAnnouncements] = useState<GradeAnnouncementItem[]>([]);
  const [notifications, setNotifications] = useState<GradeNotificationItem[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [streamStudents, setStreamStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Consolidated report composer state
  const [cTitle, setCTitle] = useState('');
  const [cPeriod, setCPeriod] = useState('Term 1 Mid-Term 2026');
  const [cSummary, setCSummary] = useState('');
  const [cRecommendations, setCRecommendations] = useState('');
  const [cSubmitting, setCSubmitting] = useState(false);

  const notify = (text: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadHierarchyData = useCallback(async () => {
    setLoading(true);
    try {
      const bs = await ahApiFetch<AcademicBootstrapPayload>('/api/academic/bootstrap');
      setBootstrap(bs);
      const nextGradeId =
        selectedGradeId && bs.grades.some((g) => g.id === selectedGradeId)
          ? selectedGradeId
          : bs.grades[0]?.id || '';
      setSelectedGradeId(nextGradeId);

      const [annRes, notifRes] = await Promise.all([
        ahApiFetch<{ announcements: GradeAnnouncementItem[] }>('/api/academic/announcements'),
        ahApiFetch<{ notifications: GradeNotificationItem[] }>('/api/academic/notifications'),
      ]);
      setAnnouncements(annRes.announcements || []);
      setNotifications(notifRes.notifications || []);

      if (nextGradeId) {
        const [ovRes, crRes, conRes] = await Promise.all([
          ahApiFetch<GradeOverviewPayload>(`/api/academic/grades/${nextGradeId}/overview`),
          ahApiFetch<{ reports: ClassTeacherReportItem[] }>(
            `/api/academic/class-reports?gradeId=${encodeURIComponent(nextGradeId)}`
          ),
          ahApiFetch<{ reports: ConsolidatedGradeReportItem[] }>(
            `/api/academic/consolidated-reports?gradeId=${encodeURIComponent(nextGradeId)}`
          ),
        ]);
        setOverview(ovRes);
        setClassReports(crRes.reports || []);
        setConsolidatedReports(conRes.reports || []);
        setCTitle((prev) => prev || `${ovRes.grade.name} Consolidated Academic & Welfare Report`);

        const gradeStreams = bs.streams.filter((s) => s.gradeId === nextGradeId);
        if (gradeStreams.length > 0) {
          setSelectedStreamId((prev) =>
            prev && gradeStreams.some((s) => s.id === prev) ? prev : gradeStreams[0].id
          );
        }
      } else {
        setOverview(null);
        setClassReports([]);
        setConsolidatedReports([]);
      }
    } catch (err: any) {
      notify(err.message, 'err');
    } finally {
      setLoading(false);
    }
  }, [selectedGradeId]);

  useEffect(() => {
    void loadHierarchyData();
  }, [loadHierarchyData]);

  useEffect(() => {
    if (!selectedStreamId) {
      setStreamStudents([]);
      return;
    }
    void ahApiFetch<{ students: any[] }>(`/api/academic/streams/${selectedStreamId}/students`)
      .then((res) => setStreamStudents(res.students || []))
      .catch(() => setStreamStudents([]));
  }, [selectedStreamId, bootstrap]);

  useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (!tab) return;
      const valid: SupervisionTab[] = [
        'dashboard',
        'my_grade',
        'streams',
        'class_teachers',
        'students',
        'attendance_monitor',
        'academic_performance',
        'syllabus_coverage',
        'interventions',
        'grade_reports',
        'announcements',
        'notifications',
        'gate_safety',
        'staff_appraisal',
        'work_entry_audit',
        'sanatorium',
        'transport',
        'cocurricular',
        'mentorship',
        'curriculum_coordination',
        'virtual_classrooms',
        'reporting_hub',
      ];
      if (valid.includes(tab as SupervisionTab)) {
        setActiveTab(tab as SupervisionTab);
      } else if (tab === 'attendance' || tab === 'roll_call' || tab === 'register') {
        setActiveTab('attendance_monitor');
      } else if (tab === 'report' || tab === 'reports') {
        setActiveTab('grade_reports');
      } else if (tab === 'work_ledger' || tab === 'work_entries') {
        setActiveTab('work_entry_audit');
      } else if (tab === 'virtual_class' || tab === 'virtual_rooms') {
        setActiveTab('virtual_classrooms');
      }
    };
    window.addEventListener('workspace-nav-tab', handleNavEvent);
    return () => window.removeEventListener('workspace-nav-tab', handleNavEvent);
  }, []);

  const handleCompileConsolidated = async (submitNow: boolean) => {
    if (!selectedGradeId || !cTitle.trim() || !cSummary.trim()) {
      notify('Please provide a report title and executive summary.', 'err');
      return;
    }
    setCSubmitting(true);
    try {
      await ahApiFetch('/api/academic/consolidated-reports', {
        method: 'POST',
        body: JSON.stringify({
          gradeId: selectedGradeId,
          title: cTitle.trim(),
          periodLabel: cPeriod.trim(),
          executiveSummary: cSummary.trim(),
          recommendations: cRecommendations.trim(),
          submitNow,
        }),
      });
      setCSummary('');
      setCRecommendations('');
      notify(
        submitNow
          ? 'Consolidated Grade Report submitted to School Administration.'
          : 'Consolidated report saved as draft.'
      );
      await loadHierarchyData();
    } catch (err: any) {
      notify(err.message, 'err');
    } finally {
      setCSubmitting(false);
    }
  };

  const handleExportReport = async (reportType: string, format: 'pdf' | 'excel') => {
    if (!selectedGradeId) return;
    try {
      const data = await ahApiFetch<any>(
        `/api/academic/reports/export-data?type=${encodeURIComponent(reportType)}&gradeId=${encodeURIComponent(selectedGradeId)}`
      );
      if (format === 'excel') {
        exportAcademicReportToExcel(data.title, currentTenant.name, data.summaryPairs, data.sections);
      } else {
        printAcademicReportPdf(currentTenant, data.title, data.subtitle, data.summaryPairs, data.sections);
      }
    } catch (err: any) {
      notify(err.message, 'err');
    }
  };

  // Legacy Mentorship state preserved
  interface MentorshipLog {
    id: string;
    studentName: string;
    grade: GradeLevel;
    stream: string;
    category: 'Academic Improvement' | 'Character & Conduct' | 'Health & Well-being' | 'Peer Relationship';
    notes: string;
    mentor: string;
    date: string;
  }
  const [mentorshipList, setMentorshipList] = useState<MentorshipLog[]>([
    {
      id: 'men-1',
      studentName: 'Brian Otieno',
      grade: 4,
      stream: 'Dove',
      category: 'Academic Improvement',
      notes: 'Encouraged continued diligence in fractions and decimals. Showing strong analytical curiosity.',
      mentor: currentUser.name,
      date: '2026-09-28',
    },
  ]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newGrade, setNewGrade] = useState<GradeLevel>(4);
  const [newStream, setNewStream] = useState('Dove');
  const [newCategory, setNewCategory] = useState<MentorshipLog['category']>('Academic Improvement');
  const [newNotes, setNewNotes] = useState('');
  const [mentorSuccess, setMentorSuccess] = useState(false);

  const handleAddMentorship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newNotes.trim()) return;
    setMentorshipList([
      {
        id: `men-${Date.now()}`,
        studentName: newStudentName.trim(),
        grade: newGrade,
        stream: newStream,
        category: newCategory,
        notes: newNotes.trim(),
        mentor: currentUser.name,
        date: new Date().toISOString().split('T')[0],
      },
      ...mentorshipList,
    ]);
    setMentorSuccess(true);
    setNewStudentName('');
    setNewNotes('');
    setTimeout(() => setMentorSuccess(false), 3000);
  };

  const allGatePasses = Storage.getGatePasses();
  const allWorkLogs = Storage.getWorkEntryLogs();
  const assignedGrades = bootstrap?.grades || [];
  const seniorAllowedGrades = React.useMemo<GradeLevel[]>(() => {
    const fromBootstrap = assignedGrades
      .map((g) => Number(g.gradeNumber))
      .filter((n): n is GradeLevel => Number.isInteger(n) && n >= 1 && n <= 9);
    if (fromBootstrap.length > 0) {
      return Array.from(new Set(fromBootstrap)).sort((a, b) => a - b);
    }
    return currentUser.grade ? [currentUser.grade] : [];
  }, [assignedGrades, currentUser.grade]);
  const canAllocateStreams = canAccessStudentStreamAllocation(currentUser);
  const gradeStreams = (bootstrap?.streams || []).filter((s) => s.gradeId === selectedGradeId);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const pendingReportsCount = classReports.filter((r) => r.status === 'submitted').length;

  const sidebarGroups: WorkspaceSidebarGroup<SupervisionTab>[] = [
    {
      title: 'GRADE COORDINATION',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my_grade', label: 'My Grade', icon: GraduationCap },
        { id: 'streams', label: 'Streams', icon: Users, badge: gradeStreams.length || undefined },
        ...(canAllocateStreams
          ? [{ id: 'student_stream_allocation' as SupervisionTab, label: 'Student Stream Allocations', icon: Users, badge: 'CBC Streams', badgeColor: 'bg-blue-600' }]
          : []),
        {
          id: 'class_teachers',
          label: 'Class Teachers',
          icon: ClipboardCheck,
          badge: pendingReportsCount > 0 ? pendingReportsCount : undefined,
          badgeColor: 'bg-amber-600',
        },
        { id: 'students', label: 'Students', icon: UserCheck },
        { id: 'virtual_classrooms', label: 'Virtual Classrooms', icon: Video },
      ],
    },
    {
      title: 'ACADEMIC MONITORING',
      items: [
        { id: 'attendance_monitor', label: 'Attendance Monitoring', icon: CheckCircle2 },
        { id: 'academic_performance', label: 'Academic Performance', icon: BarChart3 },
        { id: 'syllabus_coverage', label: 'Syllabus Coverage', icon: BookOpen },
        { id: 'interventions', label: 'Student Interventions', icon: AlertTriangle },
        { id: 'grade_reports', label: 'Grade Reports', icon: FileSpreadsheet },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : undefined,
          badgeColor: 'bg-rose-600',
        },
      ],
    },
    {
      title: 'SUPERVISION & CAMPUS',
      items: [
        { id: 'gate_safety', label: 'Gate Exit Verifications', icon: LogOut, badge: allGatePasses.length },
        { id: 'work_entry_audit', label: 'Teacher Work Entry Audit', icon: FileCheck2, badge: allWorkLogs.length },
        { id: 'staff_appraisal', label: 'Teacher Appraisal (TPAD)', icon: Award },
        { id: 'curriculum_coordination', label: 'Curriculum Strands & KICD', icon: Lock },
        { id: 'mentorship', label: 'Mentorship & Pastoral Care', icon: HeartHandshake },
        { id: 'sanatorium', label: 'Sanatorium & Clinic', icon: HeartPulse },
        { id: 'transport', label: 'School Transport Fleet', icon: Bus },
        { id: 'cocurricular', label: 'Co-Curricular & Sports', icon: Trophy },
        { id: 'reporting_hub', label: 'School Reporting Hub', icon: FileText },
      ],
    },
  ];

  const renderUnassignedBanner = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
      <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
      <h2 className="text-lg font-bold text-slate-900">No Active Grade Assignment Yet</h2>
      <p className="text-xs text-slate-600 max-w-lg mx-auto">
        As a Senior Teacher (Grade Coordinator), your academic workspace is strictly scoped to the grade assigned by
        School Administration. Ask your School Administrator to designate your grade under Academic Structure → Senior
        Teacher Assignments.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar Header (Strictly Tenant-Branded) */}
      <header className="relative lg:sticky lg:top-16 z-20 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors lg:hidden cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="bg-white p-1 rounded-xl border border-slate-700 shrink-0">
            <TenantSchoolLogo variant="horizontal" size="xs" showMotto={false} compactMobile />
          </div>

          <div className="min-w-0">
            <div className="text-xs text-slate-300 flex items-center gap-2 truncate">
              <span className="font-semibold text-white">Senior Teacher Console</span>
              <span aria-hidden="true">·</span>
              <span>{overview?.grade.name || 'Grade Coordinator'}</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">
              {currentTenant.name} — Multi-Stream Oversight, Class Teacher Supervision & Consolidated Reporting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {assignedGrades.length > 1 && (
            <select
              value={selectedGradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 border border-slate-700 text-white rounded-lg"
            >
              {assignedGrades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => void loadHierarchyData()}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="text-right text-xs hidden md:block">
            <div className="font-semibold text-white">{currentUser.name}</div>
            <div className="text-[11px] text-slate-400 font-mono">{currentUser.tscNumber || 'Grade Coordinator'}</div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full">
        <WorkspaceSidebar<SupervisionTab>
          portalTitle="SENIOR TEACHER"
          portalSubtitle={overview ? `${overview.grade.name} Coordinator` : 'Grade Coordination'}
          portalIcon="🧭"
          portalBadge={overview ? overview.grade.name : 'Coordinator'}
          groups={sidebarGroups}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          themeColor="emerald"
          footerNote={currentTenant.shortName || currentTenant.name}
          statusText={overview ? `${overview.summary.streamsCount} Streams Active` : 'Active'}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
          {toast && (
            <div
              className={`text-xs font-medium px-4 py-3 rounded-lg border ${
                toast.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {toast.text}
            </div>
          )}

          {/* ================================================================
              1. DASHBOARD & 2. MY GRADE
              ============================================================== */}
          {(activeTab === 'dashboard' || activeTab === 'my_grade') && (
            !overview ? (
              renderUnassignedBanner()
            ) : (
              <div className="space-y-6">
                {/* Grade Overview KPI Row */}
                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span>{currentTenant.name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{overview.grade.levelBand}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{overview.grade.academicYear}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-950 mt-0.5">
                        {overview.grade.name} Overview & Stream Health
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVcInitialModalMode('schedule');
                          setActiveTab('virtual_classrooms');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>SCHEDULE VIRTUAL LESSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVcInitialModalMode('instant');
                          setActiveTab('virtual_classrooms');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>START INSTANT VIRTUAL LESSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleExportReport('consolidated', 'pdf')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Grade PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleExportReport('consolidated', 'excel')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Excel</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="p-3.5 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Students</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 mt-1">
                        {overview.summary.totalStudents}
                      </div>
                    </div>
                    <div className="p-3.5 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Streams</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 mt-1">
                        {overview.summary.streamsCount}
                      </div>
                    </div>
                    <div className="p-3.5 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Class Teachers</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 mt-1">
                        {overview.summary.classTeachersCount}/{overview.summary.streamsCount}
                      </div>
                    </div>
                    <div className="p-3.5 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Attendance</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                        {overview.summary.overallAttendancePct}%
                      </div>
                    </div>
                    <div className="p-3.5 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Academic Mean</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 mt-1">
                        {overview.summary.overallAcademicMean}%
                      </div>
                    </div>
                    <div className="p-3.5 border border-slate-200 rounded-lg">
                      <div className="text-xs text-slate-500">Syllabus</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 mt-1">
                        {overview.summary.overallSyllabusCoveragePct}%
                      </div>
                    </div>
                  </div>
                </section>

                {/* Stream Comparison Table */}
                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Stream Performance Comparison</h3>
                      <p className="text-xs text-slate-500">Side-by-side comparison across all streams in {overview.grade.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('class_teachers')}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-950 underline cursor-pointer"
                    >
                      Pending Reports ({overview.summary.pendingClassReportsCount})
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2.5 pr-3">Stream</th>
                          <th className="py-2.5 pr-3">Class Teacher</th>
                          <th className="py-2.5 pr-3 text-right">Students</th>
                          <th className="py-2.5 pr-3 text-right">Attendance</th>
                          <th className="py-2.5 pr-3 text-right">Assessments</th>
                          <th className="py-2.5 pr-3 text-right">Assignments</th>
                          <th className="py-2.5 pr-3 text-right">Syllabus</th>
                          <th className="py-2.5 pr-3 text-right">Interventions</th>
                          <th className="py-2.5">Latest Report</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {overview.streams.map((st) => (
                          <tr key={st.streamId} className="hover:bg-slate-50">
                            <td className="py-3 pr-3 font-semibold text-slate-950">{st.displayName}</td>
                            <td className="py-3 pr-3 text-slate-700">{st.classTeacherName}</td>
                            <td className="py-3 pr-3 text-right font-mono tabular-nums">{st.studentsCount}</td>
                            <td className="py-3 pr-3 text-right font-mono tabular-nums">{st.attendanceRate}%</td>
                            <td className="py-3 pr-3 text-right font-mono tabular-nums font-semibold">{st.academicMean}%</td>
                            <td className="py-3 pr-3 text-right font-mono tabular-nums">{st.assignmentCompletion}%</td>
                            <td className="py-3 pr-3 text-right font-mono tabular-nums">{st.syllabusCoverage}%</td>
                            <td className="py-3 pr-3 text-right font-mono tabular-nums">{st.openInterventionsCount}</td>
                            <td className="py-3 text-slate-700">{st.latestReportStatus.replace(/_/g, ' ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )
          )}

          {/* ================================================================
              3. STREAMS
              ============================================================== */}
          {activeTab === 'streams' && (
            !overview ? (
              renderUnassignedBanner()
            ) : (
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="pb-3 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900">{overview.grade.name} Streams & Class Teacher Supervision</h2>
                  <p className="text-xs text-slate-500">Inspect enrollment, attendance, report cadence, and open interventions per stream.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {overview.streams.map((st) => (
                    <div key={st.streamId} className="border border-slate-200 rounded-xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-950">{st.displayName}</h3>
                          <div className="text-xs text-slate-500">Class Teacher: {st.classTeacherName}</div>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-slate-600">{st.studentsCount}/{st.capacity}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div>
                          <div className="text-slate-500">Attendance</div>
                          <div className="font-mono tabular-nums font-bold text-slate-900">{st.attendanceRate}%</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Academic Mean</div>
                          <div className="font-mono tabular-nums font-bold text-slate-900">{st.academicMean}%</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Syllabus</div>
                          <div className="font-mono tabular-nums font-bold text-slate-900">{st.syllabusCoverage}%</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Interventions</div>
                          <div className="font-mono tabular-nums font-bold text-slate-900">{st.openInterventionsCount}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500">Pending Reports: <strong className="font-mono tabular-nums text-slate-800">{st.pendingReportsCount}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStreamId(st.streamId);
                            setActiveTab('students');
                          }}
                          className="font-semibold text-slate-800 hover:text-slate-950 underline cursor-pointer"
                        >
                          Open Roster
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          )}

          {/* ================================================================
              4. CLASS TEACHERS (MONITOR & REVIEW REPORTS)
              ============================================================== */}
          {activeTab === 'class_teachers' && (
            !overview ? (
              renderUnassignedBanner()
            ) : (
              <div className="space-y-6">
                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="pb-3 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Class Teachers Supervised ({overview.grade.name})</h2>
                    <p className="text-xs text-slate-500">Attendance recording, submitted reports, and syllabus implementation tracking</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2 pr-3">Class Teacher</th>
                          <th className="py-2 pr-3">Assigned Stream</th>
                          <th className="py-2 pr-3 text-right">Reports Submitted</th>
                          <th className="py-2 pr-3 text-right">Pending Review</th>
                          <th className="py-2 text-right">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {overview.streams.map((st) => (
                          <tr key={st.streamId}>
                            <td className="py-2.5 pr-3 font-semibold text-slate-900">{st.classTeacherName}</td>
                            <td className="py-2.5 pr-3 text-slate-700">{st.displayName}</td>
                            <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{st.reportsSubmittedCount}</td>
                            <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{st.pendingReportsCount}</td>
                            <td className="py-2.5 text-right font-mono tabular-nums">{st.attendanceRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <SeniorClassReportReviewList reports={classReports} onReviewed={() => void loadHierarchyData()} />
              </div>
            )
          )}

          {/* ================================================================
              5. STUDENTS IN ASSIGNED GRADE
              ============================================================== */}
          {activeTab === 'students' && (
            !overview ? (
              renderUnassignedBanner()
            ) : (
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{overview.grade.name} Student Roster</h2>
                    <p className="text-xs text-slate-500">Learners enrolled across streams in your supervised grade</p>
                  </div>
                  <select
                    value={selectedStreamId}
                    onChange={(e) => setSelectedStreamId(e.target.value)}
                    className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
                  >
                    {gradeStreams.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} ({s.studentsCount})
                      </option>
                    ))}
                  </select>
                </div>

                {streamStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">No students assigned to this stream yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2 pr-3">Adm No.</th>
                          <th className="py-2 pr-3">Student Name</th>
                          <th className="py-2 pr-3">Parent / Guardian</th>
                          <th className="py-2 text-right">Open Interventions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {streamStudents.map((stu) => (
                          <tr key={stu.studentId}>
                            <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-600">{stu.admissionNumber || '—'}</td>
                            <td className="py-2.5 pr-3 font-semibold text-slate-900">{stu.studentName}</td>
                            <td className="py-2.5 pr-3 text-slate-600">
                              {stu.parentName ? `${stu.parentName} (${stu.parentPhone || stu.parentEmail || ''})` : stu.email || '—'}
                            </td>
                            <td className="py-2.5 text-right font-mono tabular-nums">{stu.openInterventionsCount || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )
          )}

          {/* ================================================================
              6. ATTENDANCE MONITORING
              ============================================================== */}
          {activeTab === 'attendance_monitor' && (
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {overview ? `${overview.grade.name} Attendance Monitoring` : 'Attendance Monitoring'}
                  </h2>
                  <p className="text-xs text-slate-500">Cross-stream roll call rates & Class Teacher reporting compliance</p>
                </div>
                {overview && (
                  <button
                    type="button"
                    onClick={() => void handleExportReport('attendance', 'pdf')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Attendance Report</span>
                  </button>
                )}
              </div>

              {overview && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2 pr-3">Stream</th>
                        <th className="py-2 pr-3">Class Teacher</th>
                        <th className="py-2 pr-3 text-right">Learners</th>
                        <th className="py-2 pr-3 text-right">Attendance %</th>
                        <th className="py-2">Threshold Check</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {overview.streams.map((st) => (
                        <tr key={st.streamId}>
                          <td className="py-2.5 pr-3 font-semibold text-slate-900">{st.displayName}</td>
                          <td className="py-2.5 pr-3 text-slate-700">{st.classTeacherName}</td>
                          <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{st.studentsCount}</td>
                          <td className="py-2.5 pr-3 text-right font-mono tabular-nums font-bold">{st.attendanceRate}%</td>
                          <td className={`py-2.5 font-semibold ${st.attendanceRate > 0 && st.attendanceRate < 80 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {st.attendanceRate === 0
                              ? 'Awaiting Roll Call'
                              : st.attendanceRate < 80
                              ? 'Below 80% Alert'
                              : 'Meeting Target'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Preserved Faculty Absences Watch */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Reported Faculty Absences & Relief Cover</h3>
                {Storage.getTeacherAbsenceReports().length === 0 ? (
                  <div className="p-4 border border-slate-200 rounded-lg text-xs text-slate-500">
                    All teaching staff are present on duty today.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Storage.getTeacherAbsenceReports().map((rep) => (
                      <div key={rep.id} className="p-3.5 border border-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>{rep.teacherName}</span>
                          <span className={rep.reliefStatus === 'fully_assigned' ? 'text-emerald-700' : 'text-rose-700'}>
                            {rep.reliefStatus === 'fully_assigned' ? 'Covered' : 'Relief Needed'}
                          </span>
                        </div>
                        <div className="text-slate-600">{rep.leaveType.replace('_', ' ')} · {rep.startDate} to {rep.endDate}</div>
                        <div className="text-slate-700">{rep.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================================================================
              7. ACADEMIC PERFORMANCE (WEAK SUBJECTS & STREAM TRENDS)
              ============================================================== */}
          {activeTab === 'academic_performance' && (
            !overview ? (
              renderUnassignedBanner()
            ) : (
              <div className="space-y-6">
                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{overview.grade.name} Weak Subjects & Learning Areas</h2>
                      <p className="text-xs text-slate-500">Ranked lowest mean score first to guide remedial allocation</p>
                    </div>
                  </div>
                  {overview.weakSubjects.length === 0 ? (
                    <div className="py-6 text-xs text-slate-500">
                      Log subject assessment means under Syllabus Coverage to track weak learning areas automatically.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                          <tr>
                            <th className="py-2 pr-3">Subject / Learning Area</th>
                            <th className="py-2 pr-3 text-right">Grade Mean %</th>
                            <th className="py-2 pr-3">Streams Evaluated</th>
                            <th className="py-2">Standing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {overview.weakSubjects.map((ws) => (
                            <tr key={ws.subject}>
                              <td className="py-2.5 pr-3 font-semibold text-slate-900">{ws.subject}</td>
                              <td className="py-2.5 pr-3 text-right font-mono tabular-nums font-bold">{ws.averageScore}%</td>
                              <td className="py-2.5 pr-3 text-slate-600">{ws.streamsEvaluated.join(', ')}</td>
                              <td className={`py-2.5 font-semibold ${ws.averageScore < 50 ? 'text-rose-700' : ws.averageScore < 65 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {ws.averageScore < 50 ? 'Remedial Priority' : ws.averageScore < 65 ? 'Needs Support' : 'On Track'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <AcademicMonitoringPanel
                  streams={gradeStreams}
                  records={overview.recentMonitoring}
                  onRefresh={() => void loadHierarchyData()}
                />
              </div>
            )
          )}

          {/* ================================================================
              8. SYLLABUS COVERAGE
              ============================================================== */}
          {activeTab === 'syllabus_coverage' && (
            !overview ? (
              renderUnassignedBanner()
            ) : (
              <AcademicMonitoringPanel
                streams={gradeStreams}
                records={overview.recentMonitoring}
                onRefresh={() => void loadHierarchyData()}
              />
            )
          )}

          {/* ================================================================
              9. STUDENT INTERVENTIONS
              ============================================================== */}
          {activeTab === 'interventions' && (
            !overview ? (
              renderUnassignedBanner()
            ) : (
              <StudentInterventionsPanel
                streams={gradeStreams}
                interventions={overview.belowExpectationInterventions}
                onRefresh={() => void loadHierarchyData()}
              />
            )
          )}

          {/* ================================================================
              10. GRADE REPORTS (CONSOLIDATE TO ADMIN + 8 EXPORTS TO PDF/EXCEL)
              ============================================================== */}
          {activeTab === 'grade_reports' && (
            !overview ? (
              renderUnassignedBanner()
            ) : (
              <div className="space-y-6">
                {/* Official Report Generator (8 Types -> PDF & Excel) */}
                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="pb-3 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">
                      Official Grade Reporting & Exports ({overview.grade.name})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Export tenant-branded PDF dossiers and multi-sheet Excel workbooks across all 8 required reports.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {REPORT_CATALOG.map((rc) => (
                      <div key={rc.key} className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-slate-950">{rc.label}</div>
                          <p className="text-xs text-slate-500 mt-1">{rc.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleExportReport(rc.key, 'pdf')}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExportReport(rc.key, 'excel')}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Excel</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Consolidated Grade Report Submission to School Administration */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="pb-3 border-b border-slate-200">
                      <h3 className="text-base font-bold text-slate-900">Compile & Submit Consolidated Grade Report</h3>
                      <p className="text-xs text-slate-500">
                        Aggregates all stream comparisons, weak subjects, and reviewed Class Teacher reports for School Administration.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Report Title</label>
                      <input
                        type="text"
                        value={cTitle}
                        onChange={(e) => setCTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Period Label</label>
                      <input
                        type="text"
                        value={cPeriod}
                        onChange={(e) => setCPeriod(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Executive Grade Summary</label>
                      <textarea
                        rows={4}
                        value={cSummary}
                        onChange={(e) => setCSummary(e.target.value)}
                        placeholder="Summarize cross-stream academic standing, attendance highlights, and staffing needs..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Recommendations to Administration</label>
                      <textarea
                        rows={2}
                        value={cRecommendations}
                        onChange={(e) => setCRecommendations(e.target.value)}
                        placeholder="Requested learning resources, remedial timetable slots, or parent clinics..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={cSubmitting}
                        onClick={() => void handleCompileConsolidated(false)}
                        className="flex-1 px-3 py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        disabled={cSubmitting}
                        onClick={() => void handleCompileConsolidated(true)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit to Admin</span>
                      </button>
                    </div>
                  </div>

                  <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">Submitted Consolidated Reports & Admin Feedback</h3>
                      <span className="text-xs font-mono tabular-nums text-slate-500">{consolidatedReports.length} reports</span>
                    </div>
                    {consolidatedReports.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-500">
                        No consolidated grade reports compiled yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {consolidatedReports.map((cr) => (
                          <div key={cr.id} className="py-3.5 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                              <span className="font-semibold text-slate-800">{cr.period_label}</span>
                              <span className={cr.status === 'approved' ? 'text-emerald-700 font-semibold' : 'text-blue-700 font-semibold'}>
                                {cr.status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-950">{cr.title}</h4>
                            <p className="text-xs text-slate-700">{cr.executive_summary}</p>
                            {cr.admin_feedback && (
                              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                <span className="font-semibold">Admin Feedback ({cr.admin_reviewer_name || 'Admin'}):</span>{' '}
                                {cr.admin_feedback}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )
          )}

          {/* ================================================================
              11. ANNOUNCEMENTS
              ============================================================== */}
          {activeTab === 'announcements' && (
            <GradeAnnouncementsPanel
              grades={assignedGrades}
              streams={gradeStreams}
              announcements={announcements}
              defaultGradeId={selectedGradeId}
              onCreated={() => void loadHierarchyData()}
            />
          )}

          {/* ================================================================
              12. NOTIFICATIONS
              ============================================================== */}
          {activeTab === 'notifications' && (
            <AcademicNotificationsPanel
              notifications={notifications}
              onRefresh={() => void loadHierarchyData()}
              onNavigateTab={(tab) => setActiveTab(tab as SupervisionTab)}
            />
          )}

          {/* ================================================================
              PRESERVED CAMPUS SUPERVISION TABS
              ============================================================== */}
          {activeTab === 'gate_safety' && (
            <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Student Gate Departure & Safety Ledger</h2>
                  <p className="text-xs text-slate-500">
                    Live monitoring of all pupils signed out of the school gates with authorized guardians.
                  </p>
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-600">
                  Out: {allGatePasses.filter((p) => p.status === 'active' || p.status === 'departed').length} · Returned:{' '}
                  {allGatePasses.filter((p) => p.status === 'returned').length}
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
                <table className="w-full text-left min-w-[560px]">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Pass Code</th>
                      <th className="py-2.5 px-3">Pupil Name</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Departure</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Guardian</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {allGatePasses.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{p.gatePassCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{p.studentName}</td>
                        <td className="py-2.5 px-3 text-slate-600">Grade {p.grade} {p.stream}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                          {p.departureDate || '2026-10-01'} {p.departureTime}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 max-w-xs truncate">{p.reason}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {p.guardianName} ({p.guardianPhone})
                        </td>
                        <td className={`py-2.5 px-3 text-right font-semibold ${p.status === 'returned' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {p.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'work_entry_audit' && (
            <WorkEntryAuditViewer
              currentUser={currentUser}
              title="Senior Teacher Work Entry Sign-In Register"
              subtitle="Real-time clock-in logs, location stamps, staff credentials, and verified biometric photos."
            />
          )}

          {activeTab === 'sanatorium' && (
            <SanatoriumSection
              currentUser={currentUser}
              canRecord={false}
              filterGrade={(overview?.grade.gradeNumber || currentUser.grade || 7) as GradeLevel}
              title={`Senior Teacher Sanatorium Oversight · ${overview?.grade.name || `Grade ${currentUser.grade || 7}`}`}
              subtitle="Learner health visits, triage records, and medical recommendations for your supervised grade."
            />
          )}

          {activeTab === 'transport' && <TransportWorkspace currentUser={currentUser} isEmbedded={true} readOnly={true} />}
          {activeTab === 'cocurricular' && <CoCurricularWorkspace currentUser={currentUser} isEmbedded={true} readOnly={true} />}

          {activeTab === 'mentorship' && (
            <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Learner Mentorship & Character Formation Register</h2>
                <p className="text-xs text-slate-500">Document pastoral counseling and behavioral reinforcement.</p>
              </div>
              {mentorSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Mentorship note successfully recorded.</span>
                </div>
              )}
              <form onSubmit={handleAddMentorship} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Student name"
                    className="px-3 py-2 border border-slate-200 rounded-lg"
                  />
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(Number(e.target.value) as GradeLevel)}
                    className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newStream}
                    onChange={(e) => setNewStream(e.target.value)}
                    placeholder="Stream"
                    className="px-3 py-2 border border-slate-200 rounded-lg"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Academic Improvement">Academic Improvement</option>
                    <option value="Character & Conduct">Character & Conduct</option>
                    <option value="Health & Well-being">Health & Well-being</option>
                    <option value="Peer Relationship">Peer Relationship</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  required
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Counseling notes and follow-up goals..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs cursor-pointer">
                  Save Supervision Record
                </button>
              </form>
              <div className="divide-y divide-slate-200">
                {mentorshipList.map((m) => (
                  <div key={m.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-900">{m.studentName} · Grade {m.grade} {m.stream} · {m.category}</span>
                      <span className="font-mono tabular-nums">{m.date}</span>
                    </div>
                    <p className="text-slate-700">{m.notes}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'curriculum_coordination' && (
            <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Curriculum Alignment & KICD Standards</h2>
                <p className="text-xs text-slate-500">
                  Primary (Grades 1–6) and Junior School (Grades 7–9) syllabus alignment across your supervised grade.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                  <div className="font-bold text-slate-900">Primary CBC Standards (Grades 1–6)</div>
                  <p className="text-slate-600">8 Core Learning Areas audited against KICD curriculum strands.</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                  <div className="font-bold text-slate-900">Junior School Standards (Grades 7–9)</div>
                  <p className="text-slate-600">9 Core & Pre-Technical subjects tracked with rubric moderation.</p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'student_stream_allocation' && canAllocateStreams && (
            <StudentStreamManager
              currentUser={currentUser}
              allowedGrades={seniorAllowedGrades}
            />
          )}
          {activeTab === 'virtual_classrooms' && (
            <SeniorVirtualClassroomManager
              selectedGradeId={selectedGradeId}
              initialOpenMode={vcInitialModalMode}
              onModalHandled={() => setVcInitialModalMode(null)}
            />
          )}
          {activeTab === 'staff_appraisal' && <SchoolStaffAppraisal currentUser={currentUser} />}
          {activeTab === 'reporting_hub' && <ReportingHub currentUser={currentUser} />}
        </main>
      </div>
    </div>
  );
};
