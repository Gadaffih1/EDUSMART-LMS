import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  User,
  GradeLevel,
  StreamName,
  getStreamsForGrade,
} from '../../types';
import { Storage } from '../../utils/storage';
import { useTenant } from '../../context/TenantContext';
import { TenantSchoolLogo } from '../common/TenantSchoolLogo';
import { ClassTeacherModule } from './ClassTeacherModule';
import { ResultUploadManager } from '../academic/ResultUploadManager';
import { LearnerLunchRegister } from '../meals/LearnerLunchRegister';
import { StudentGateExit } from './StudentGateExit';
import { TeacherWorkEntryForm } from './TeacherWorkEntryForm';
import { TimetablePortal } from '../timetable/TimetablePortal';
import { OwnStaffAppraisal } from '../admin/TeacherAppraisalPages';
import { WorkspaceSidebar, WorkspaceSidebarGroup } from '../layout/WorkspaceSidebar';
import {
  ahApiFetch,
  type AcademicBootstrapPayload,
  type AcademicMonitoringItem,
  type AcademicStream,
  type ClassTeacherReportItem,
  type GradeAnnouncementItem,
  type GradeNotificationItem,
  type StreamPerformanceRow,
  type StudentInterventionItem,
} from '../academic-hierarchy/academicHierarchyTypes';
import {
  exportAcademicReportToExcel,
  printAcademicReportPdf,
} from '../academic-hierarchy/academicReportExporter';
import {
  AcademicMonitoringPanel,
  AcademicNotificationsPanel,
  ClassReportComposerAndHistory,
  GradeAnnouncementsPanel,
  StudentInterventionsPanel,
} from '../academic-hierarchy/GradeReportSubmitAndReviewPanels';
import { SubjectTeacherVirtualLessonsPanel } from '../virtual-classroom/SubjectTeacherVirtualLessonsPanel';
import {
  UserCheck,
  Award,
  MessageSquare,
  Utensils,
  ShieldAlert,
  DoorOpen,
  Calendar,
  FileCheck2,
  Bell,
  Briefcase,
  Users,
  CheckCircle2,
  Search,
  Save,
  Menu,
  FileSpreadsheet,
  TrendingUp,
  LayoutDashboard,
  GraduationCap,
  Megaphone,
  Send,
  Printer,
  BookOpen,
  RefreshCw,
  Video,
} from 'lucide-react';

export type ClassTeacherTab =
  | 'dashboard'
  | 'my_class'
  | 'students'
  | 'class_register'
  | 'cbc_results'
  | 'discipline_log'
  | 'parent_comms'
  | 'report_remarks'
  | 'report_to_senior'
  | 'announcements'
  | 'notifications'
  | 'lunch_register'
  | 'gate_exit'
  | 'timetable'
  | 'virtual_classrooms'
  | 'work_entry'
  | 'staff_appraisal';

interface ClassTeacherWorkspaceProps {
  currentUser: User;
}

interface StreamWorkspaceResponse {
  grade: {
    id: string;
    name: string;
    gradeNumber: number | null;
    levelBand: string;
    academicYear: string;
  } | null;
  seniorTeacher: {
    assignmentId: string;
    teacherId: string;
    teacherName: string;
    teacherEmail: string;
    assignedAt: string;
  } | null;
  stream: StreamPerformanceRow | null;
  reports: ClassTeacherReportItem[];
  interventions: StudentInterventionItem[];
  monitoring: AcademicMonitoringItem[];
}

export const ClassTeacherWorkspace: React.FC<ClassTeacherWorkspaceProps> = ({ currentUser }) => {
  const { currentTenant } = useTenant();
  const isSuperAdmin = currentUser.role === 'admin';

  // Backend-scoped Grade/Stream Hierarchy state
  const [bootstrap, setBootstrap] = useState<AcademicBootstrapPayload | null>(null);
  const [activeStreamId, setActiveStreamId] = useState<string>('');
  const [streamWorkspace, setStreamWorkspace] = useState<StreamWorkspaceResponse | null>(null);
  const [streamRoster, setStreamRoster] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<GradeAnnouncementItem[]>([]);
  const [notifications, setNotifications] = useState<GradeNotificationItem[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState<boolean>(true);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ClassTeacherTab>('dashboard');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState<boolean>(false);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [academicRecordsSubTab, setAcademicRecordsSubTab] = useState<'marksheet' | 'monitoring'>('marksheet');
  const [disciplineSubTab, setDisciplineSubTab] = useState<'pastoral' | 'interventions'>('pastoral');

  // Legacy fallback grade/stream synchronized with assigned AcademicStream
  const selectedHierarchyStream: AcademicStream | undefined = useMemo(() => {
    if (!bootstrap?.streams.length) return undefined;
    return bootstrap.streams.find((s) => s.id === activeStreamId) || bootstrap.streams[0];
  }, [bootstrap, activeStreamId]);

  const selectedHierarchyGrade = useMemo(() => {
    if (!bootstrap?.grades.length || !selectedHierarchyStream) return undefined;
    return bootstrap.grades.find((g) => g.id === selectedHierarchyStream.gradeId);
  }, [bootstrap, selectedHierarchyStream]);

  const selectedGrade: GradeLevel =
    ((selectedHierarchyGrade?.gradeNumber as GradeLevel) || currentUser.grade || 4) as GradeLevel;
  const selectedStream: StreamName =
    ((selectedHierarchyStream?.name as StreamName) || currentUser.stream || 'Dove') as StreamName;

  const loadBootstrap = useCallback(async () => {
    setLoadingHierarchy(true);
    setHierarchyError(null);
    try {
      const [bs, annRes, notifRes] = await Promise.all([
        ahApiFetch<AcademicBootstrapPayload>('/api/academic/bootstrap'),
        ahApiFetch<{ announcements: GradeAnnouncementItem[] }>('/api/academic/announcements'),
        ahApiFetch<{ notifications: GradeNotificationItem[] }>('/api/academic/notifications'),
      ]);
      setBootstrap(bs);
      setAnnouncements(annRes.announcements || []);
      setNotifications(notifRes.notifications || []);
      if (bs.streams.length > 0) {
        setActiveStreamId((prev) =>
          prev && bs.streams.some((s) => s.id === prev) ? prev : bs.streams[0].id
        );
      } else {
        setActiveStreamId('');
      }
    } catch (err: any) {
      setHierarchyError(err?.message || 'Unable to load assigned class workspace.');
    } finally {
      setLoadingHierarchy(false);
    }
  }, []);

  const loadActiveStreamDetails = useCallback(async () => {
    if (!activeStreamId) {
      setStreamWorkspace(null);
      setStreamRoster([]);
      return;
    }
    try {
      const [wsRes, stuRes] = await Promise.all([
        ahApiFetch<StreamWorkspaceResponse>(`/api/academic/streams/${encodeURIComponent(activeStreamId)}/workspace`),
        ahApiFetch<{ students: any[] }>(`/api/academic/streams/${encodeURIComponent(activeStreamId)}/students`),
      ]);
      setStreamWorkspace(wsRes);
      setStreamRoster(stuRes.students || []);
    } catch (err: any) {
      setHierarchyError(err?.message || 'Unable to load stream details.');
    }
  }, [activeStreamId]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    void loadActiveStreamDetails();
  }, [loadActiveStreamDetails]);

  useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail as ClassTeacherTab | undefined;
      if (!tab) return;
      const validTabs: ClassTeacherTab[] = [
        'dashboard',
        'my_class',
        'students',
        'class_register',
        'cbc_results',
        'discipline_log',
        'parent_comms',
        'report_remarks',
        'report_to_senior',
        'announcements',
        'notifications',
        'lunch_register',
        'gate_exit',
        'timetable',
        'virtual_classrooms',
        'work_entry',
        'staff_appraisal',
      ];
      if (validTabs.includes(tab)) {
        setActiveTab(tab);
      }
    };
    window.addEventListener('workspace-nav-tab', handleNavEvent);
    return () => window.removeEventListener('workspace-nav-tab', handleNavEvent);
  }, []);

  const refreshAll = async () => {
    await Promise.all([loadBootstrap(), loadActiveStreamDetails()]);
  };

  // Fallback local stream students list merged with backend stream roster
  const legacyStreamStudents = Storage.getUsers().filter(
    (u) => u.role === 'student' && u.grade === selectedGrade && u.stream === selectedStream
  );

  const effectiveRoster = useMemo(() => {
    if (streamRoster.length > 0) return streamRoster;
    return legacyStreamStudents.map((stu, idx) => ({
      studentId: stu.id,
      studentName: stu.name,
      admissionNumber: stu.admissionNumber || `ADM-${1000 + idx}`,
      email: stu.email || '',
      phone: stu.phone || '',
      streamDisplayName: selectedHierarchyStream?.displayName || `Grade ${selectedGrade} ${selectedStream}`,
      parentName: stu.parentName || null,
      parentPhone: stu.parentPhone || null,
      parentEmail: stu.parentEmail || null,
      openInterventionsCount: 0,
    }));
  }, [streamRoster, legacyStreamStudents, selectedHierarchyStream, selectedGrade, selectedStream]);

  // Termly Report Card Remarks State
  const [remarksSearchQuery, setRemarksSearchQuery] = useState('');
  const [studentRemarksMap, setStudentRemarksMap] = useState<Record<string, string>>({});
  const [remarksSavedToast, setRemarksSavedToast] = useState<string | null>(null);

  // Discipline state
  const [disciplineEntries, setDisciplineEntries] = useState<
    Array<{
      id: string;
      studentId: string;
      studentName: string;
      type: 'merit' | 'demerit' | 'counseling' | 'commendation';
      category: string;
      description: string;
      date: string;
      actionTaken: string;
    }>
  >([
    {
      id: 'disc-1',
      studentId: legacyStreamStudents[0]?.id || 'stu-1',
      studentName: legacyStreamStudents[0]?.name || 'Brian Otieno',
      type: 'commendation',
      category: 'Leadership & Orderliness',
      description: 'Maintained exceptional class discipline and organized peer group workstations.',
      date: '2026-10-01',
      actionTaken: 'Awarded 5 Merit Points & Commended during morning assembly',
    },
    {
      id: 'disc-2',
      studentId: legacyStreamStudents[1]?.id || 'stu-2',
      studentName: legacyStreamStudents[1]?.name || 'Amina Hassan',
      type: 'merit',
      category: 'Peer Collaboration',
      description: 'Volunteered to assist peers during practical group work.',
      date: '2026-09-29',
      actionTaken: 'Recorded in Termly Character Progress Profile',
    },
  ]);

  const [newDisciplineStudentId, setNewDisciplineStudentId] = useState<string>('');
  const [newDisciplineType, setNewDisciplineType] = useState<'merit' | 'demerit' | 'counseling' | 'commendation'>('merit');
  const [newDisciplineCategory, setNewDisciplineCategory] = useState<string>('Academic Diligence');
  const [newDisciplineDesc, setNewDisciplineDesc] = useState<string>('');
  const [newDisciplineAction, setNewDisciplineAction] = useState<string>('');
  const [showNewDisciplineModal, setShowNewDisciplineModal] = useState<boolean>(false);

  // Parent Comms state
  const [classAnnouncements, setClassAnnouncements] = useState<
    Array<{
      id: string;
      title: string;
      message: string;
      urgency: 'normal' | 'important' | 'urgent';
      date: string;
      recipientsCount: number;
    }>
  >([
    {
      id: 'ann-1',
      title: 'Term CBC Practical Project Supplies Reminder',
      message: `Dear ${selectedHierarchyStream?.displayName || `Grade ${selectedGrade} ${selectedStream}`} Parents, kindly ensure your learner carries a notebook and metric ruler for Wednesday practicals.`,
      urgency: 'important',
      date: '2026-10-01',
      recipientsCount: effectiveRoster.length,
    },
  ]);

  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeMsg, setNewNoticeMsg] = useState('');
  const [newNoticeUrgency, setNewNoticeUrgency] = useState<'normal' | 'important' | 'urgent'>('normal');

  useEffect(() => {
    const reportCards = Storage.getReportCards(undefined, selectedGrade, selectedStream);
    const initialMap: Record<string, string> = {};
    effectiveRoster.forEach((stu) => {
      const existingRc = reportCards.find((rc) => rc.studentId === stu.studentId);
      initialMap[stu.studentId] =
        existingRc?.classTeacherRemarks ||
        'Exhibits steady CBC competency progression, punctuality, and positive peer collaboration.';
    });
    setStudentRemarksMap(initialMap);
    if (!newDisciplineStudentId && effectiveRoster[0]?.studentId) {
      setNewDisciplineStudentId(effectiveRoster[0].studentId);
    }
  }, [selectedGrade, selectedStream, effectiveRoster.length]);

  const handleSaveStudentRemarks = (studentId: string) => {
    const remark = studentRemarksMap[studentId];
    if (!remark) return;

    const reportCards = Storage.getReportCards(undefined, selectedGrade, selectedStream);
    const existingRc = reportCards.find((rc) => rc.studentId === studentId);
    if (existingRc) {
      Storage.updateReportCardRemarks(existingRc.id, { classTeacherRemarks: remark });
    }
    const targetName = effectiveRoster.find((s) => s.studentId === studentId)?.studentName || 'Learner';
    setRemarksSavedToast(`Class teacher remarks saved for ${targetName}.`);
    setTimeout(() => setRemarksSavedToast(null), 3000);
  };

  const handleBatchSaveAllRemarks = () => {
    const reportCards = Storage.getReportCards(undefined, selectedGrade, selectedStream);
    effectiveRoster.forEach((stu) => {
      const remark = studentRemarksMap[stu.studentId];
      const existingRc = reportCards.find((rc) => rc.studentId === stu.studentId);
      if (remark && existingRc) {
        Storage.updateReportCardRemarks(existingRc.id, { classTeacherRemarks: remark });
      }
    });
    setRemarksSavedToast(`Saved remarks for all ${effectiveRoster.length} learners in ${streamLabel}.`);
    setTimeout(() => setRemarksSavedToast(null), 3500);
  };

  const REMARK_PRESETS = [
    'Consistently disciplined, focused, and demonstrates exemplary CBC competency growth.',
    'A courteous and diligent learner who exhibits exceptional promise in collaborative learning.',
    'Making steady, commendable progress. Encouraged to participate more actively in class discussions.',
    'Exhibits outstanding intellectual curiosity and maintains high standards of classroom conduct.',
    'Creative, punctual, and well-behaved. Keep up the commendable standard of work!',
  ];

  const handleAddDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    const stuId = newDisciplineStudentId || effectiveRoster[0]?.studentId;
    if (!newDisciplineDesc || !stuId) return;

    const studentObj = effectiveRoster.find((s) => s.studentId === stuId);
    const entry = {
      id: `disc-${Date.now()}`,
      studentId: stuId,
      studentName: studentObj?.studentName || 'Learner',
      type: newDisciplineType,
      category: newDisciplineCategory,
      description: newDisciplineDesc,
      date: new Date().toISOString().split('T')[0],
      actionTaken: newDisciplineAction || 'Recorded in Class Pastoral Register',
    };

    setDisciplineEntries([entry, ...disciplineEntries]);
    setShowNewDisciplineModal(false);
    setNewDisciplineDesc('');
    setNewDisciplineAction('');
  };

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeMsg.trim()) return;

    // Persist scoped notice directly to backend when stream is active
    if (selectedHierarchyStream) {
      try {
        await ahApiFetch('/api/academic/announcements', {
          method: 'POST',
          body: JSON.stringify({
            title: newNoticeTitle.trim(),
            message: newNoticeMsg.trim(),
            gradeId: selectedHierarchyStream.gradeId,
            streamId: selectedHierarchyStream.id,
            targetAudience: 'parents_only',
            priority: newNoticeUrgency,
          }),
        });
        await loadBootstrap();
      } catch {
        // Maintain graceful local feed continuity even if announcement endpoint fails
      }
    }

    const newNotice = {
      id: `ann-${Date.now()}`,
      title: newNoticeTitle,
      message: newNoticeMsg,
      urgency: newNoticeUrgency,
      date: new Date().toISOString().split('T')[0],
      recipientsCount: effectiveRoster.length,
    };

    setClassAnnouncements([newNotice, ...classAnnouncements]);
    setNewNoticeTitle('');
    setNewNoticeMsg('');
    setRemarksSavedToast(`Notice sent to ${effectiveRoster.length} parents in ${streamLabel}.`);
    setTimeout(() => setRemarksSavedToast(null), 3500);
  };

  const handleExportStreamReport = (format: 'pdf' | 'excel') => {
    const title = `${streamLabel} Class Academic & Pastoral Report`;
    const summaryPairs: Array<[string, string]> = [
      ['Class Stream', streamLabel],
      ['Class Teacher', currentUser.name],
      ['Grade Coordinator', streamWorkspace?.seniorTeacher?.teacherName || 'Unassigned'],
      ['Enrolled Students', String(effectiveRoster.length)],
      ['Attendance Rate', `${streamWorkspace?.stream?.attendanceRate ?? 0}%`],
      ['Academic Mean', `${streamWorkspace?.stream?.academicMean ?? 0}%`],
      ['Syllabus Coverage', `${streamWorkspace?.stream?.syllabusCoverage ?? 0}%`],
      ['Open Interventions', String(streamWorkspace?.interventions.filter((i) => i.status !== 'resolved').length ?? 0)],
    ];

    const sections = [
      {
        title: 'Registered Stream Students',
        columns: ['Adm No.', 'Student Name', 'Parent / Guardian', 'Parent Phone', 'Open Interventions'],
        rows: effectiveRoster.map((s) => [
          s.admissionNumber || '—',
          s.studentName,
          s.parentName || '—',
          s.parentPhone || s.phone || '—',
          s.openInterventionsCount || 0,
        ]),
      },
      {
        title: 'Submitted Reports to Senior Teacher',
        columns: ['Period', 'Type', 'Title', 'Attend %', 'Mean %', 'Syllabus %', 'Status'],
        rows: (streamWorkspace?.reports || []).map((r) => [
          r.period_label,
          r.report_type,
          r.title,
          `${r.attendance_rate}%`,
          `${r.academic_mean}%`,
          `${r.syllabus_coverage}%`,
          r.status,
        ]),
      },
      {
        title: 'Subject Syllabus & Mean Monitoring',
        columns: ['Subject', 'Week', 'Topics', 'Syllabus %', 'Mean %', 'Weak Areas'],
        rows: (streamWorkspace?.monitoring || []).map((m) => [
          m.subject_name,
          m.week_number,
          `${m.topics_completed}/${m.topics_planned}`,
          `${m.syllabus_coverage_pct}%`,
          `${m.assessment_mean_score}%`,
          m.weak_areas || '—',
        ]),
      },
    ];

    if (format === 'excel') {
      exportAcademicReportToExcel(title, currentTenant.name, summaryPairs, sections);
    } else {
      printAcademicReportPdf(
        currentTenant,
        title,
        `${streamLabel} · Coordinator: ${streamWorkspace?.seniorTeacher?.teacherName || 'Unassigned'}`,
        summaryPairs,
        sections
      );
    }
  };

  const streamLabel =
    selectedHierarchyStream?.displayName || `Grade ${selectedGrade} ${selectedStream}`;
  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;
  const openInterventions = (streamWorkspace?.interventions || []).filter((i) => i.status !== 'resolved');
  const latestReviewAlert = (streamWorkspace?.reports || [])
    .flatMap((r) => (r.reviews || []).map((rv) => ({ ...rv, reportTitle: r.title })))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];

  const availableStreamsList = bootstrap?.streams || [];
  const legacyAvailableStreams: StreamName[] = isSuperAdmin
    ? getStreamsForGrade(selectedGrade)
    : [currentUser.stream || 'Dove'];

  const filteredRoster = effectiveRoster.filter(
    (s) =>
      !rosterSearch.trim() ||
      String(s.studentName || '').toLowerCase().includes(rosterSearch.toLowerCase()) ||
      String(s.admissionNumber || '').toLowerCase().includes(rosterSearch.toLowerCase())
  );

  // Sidebar navigation structure (strictly includes all 10 required Class Teacher views + Routine)
  const sidebarGroups: WorkspaceSidebarGroup<ClassTeacherTab>[] = [
    {
      title: 'Class Teacher Governance',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my_class', label: 'My Class', icon: GraduationCap, badge: streamLabel },
        {
          id: 'students',
          label: 'Students',
          icon: Users,
          badge: `${effectiveRoster.length}`,
        },
        { id: 'class_register', label: 'Attendance', icon: UserCheck },
        { id: 'cbc_results', label: 'Academic Records', icon: Award },
        {
          id: 'discipline_log',
          label: 'Behaviour Records',
          icon: ShieldAlert,
          badge: `${disciplineEntries.length + openInterventions.length}`,
        },
        { id: 'parent_comms', label: 'Parent Communication', icon: MessageSquare },
        { id: 'report_remarks', label: 'Class Reports', icon: FileCheck2 },
        {
          id: 'report_to_senior',
          label: 'Report to Senior Teacher',
          icon: Send,
          badge: `${streamWorkspace?.reports.length || 0}`,
          badgeColor: 'bg-emerald-600',
        },
        {
          id: 'announcements',
          label: 'Announcements',
          icon: Megaphone,
          badge: `${announcements.length}`,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badge: unreadNotifCount > 0 ? `${unreadNotifCount}` : undefined,
          badgeColor: unreadNotifCount > 0 ? 'bg-rose-600' : undefined,
        },
      ],
    },
    {
      title: 'Routine & Campus',
      items: [
        { id: 'lunch_register', label: 'Learner Lunch Register', icon: Utensils },
        { id: 'gate_exit', label: 'Student Gate Exit', icon: DoorOpen },
        { id: 'timetable', label: 'Class Timetable', icon: Calendar },
        { id: 'virtual_classrooms', label: 'Virtual Classrooms', icon: Video },
        { id: 'work_entry', label: 'Daily Work Entry', icon: Briefcase },
        { id: 'staff_appraisal', label: 'TPAD Appraisal', icon: TrendingUp },
      ],
    },
  ];

  return (
    <div className="flex w-full min-h-screen bg-slate-50 relative">
      {/* Toast Notification */}
      {remarksSavedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950 text-emerald-100 px-4 py-3 rounded-xl shadow-lg border border-emerald-500/40 flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{remarksSavedToast}</span>
        </div>
      )}

      {/* Workspace Sidebar */}
      <WorkspaceSidebar
        portalTitle="Class Teacher Desk"
        portalSubtitle={`${streamLabel} Form Lead`}
        portalIcon="👨‍🏫"
        portalBadge="Form Lead"
        groups={sidebarGroups}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSidebarOpenMobile(false);
        }}
        isOpenMobile={sidebarOpenMobile}
        onCloseMobile={() => setSidebarOpenMobile(false)}
        themeColor="emerald"
        footerNote={`${currentTenant.name} · Academic Governance`}
        statusText={`${streamLabel} Active`}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpenMobile(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <TenantSchoolLogo variant="horizontal" size="sm" />
            <div className="border-l border-slate-200 pl-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="font-semibold text-emerald-800 uppercase tracking-wider">Class Teacher Portal</span>
                <span aria-hidden="true">·</span>
                <span>{streamLabel}</span>
                {streamWorkspace?.seniorTeacher && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Coordinator: {streamWorkspace.seniorTeacher.teacherName}</span>
                  </>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {currentUser.name}
              </h1>
            </div>
          </div>

          {/* Stream Switcher + Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {availableStreamsList.length > 1 ? (
              <select
                value={activeStreamId}
                onChange={(e) => setActiveStreamId(e.target.value)}
                aria-label="Select assigned stream"
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg"
              >
                {availableStreamsList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.displayName} ({st.studentsCount} learners)
                  </option>
                ))}
              </select>
            ) : legacyAvailableStreams.length > 1 && availableStreamsList.length === 0 ? (
              <div className="flex items-center gap-1 text-xs">
                {legacyAvailableStreams.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-xs border cursor-pointer ${
                      selectedStream === st
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alerts</span>
              {unreadNotifCount > 0 && (
                <span className="font-mono tabular-nums text-rose-700 font-bold">({unreadNotifCount})</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => void refreshAll()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
              title="Refresh assigned stream data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHierarchy ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Unassigned Class Teacher Notice */}
        {!loadingHierarchy && bootstrap && bootstrap.streams.length === 0 && !isSuperAdmin && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-900">
            No active stream is currently assigned to your account in this school. Contact the School Administrator to assign you as Class Teacher of a stream; routine campus modules remain accessible.
          </div>
        )}

        {hierarchyError && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-800">
            {hierarchyError}
          </div>
        )}

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* ========================================================
              TAB: DASHBOARD
              ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top KPI Grid (max 4 primary KPIs per row, zero-pill, single elevation) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-xs font-medium text-slate-500">Registered Students</div>
                  <div className="mt-1.5 text-2xl font-bold text-slate-950 font-mono tabular-nums">
                    {effectiveRoster.length}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{streamLabel}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-xs font-medium text-slate-500">Attendance Rate</div>
                  <div className="mt-1.5 text-2xl font-bold text-slate-950 font-mono tabular-nums">
                    {streamWorkspace?.stream?.attendanceRate ?? 0}%
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                    Latest verified class average
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-xs font-medium text-slate-500">Academic Mean</div>
                  <div className="mt-1.5 text-2xl font-bold text-slate-950 font-mono tabular-nums">
                    {streamWorkspace?.stream?.academicMean ?? 0}%
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
                    Syllabus {streamWorkspace?.stream?.syllabusCoverage ?? 0}%
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-xs font-medium text-slate-500">Open Interventions</div>
                  <div className="mt-1.5 text-2xl font-bold text-slate-950 font-mono tabular-nums">
                    {openInterventions.length}
                  </div>
                  <div className="mt-1 text-[11px] text-amber-700 font-medium">
                    {(streamWorkspace?.reports || []).length} reports to Senior Teacher
                  </div>
                </div>
              </div>

              {/* Senior Teacher Feedback & Grade Supervision Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Senior Teacher Supervision & Feedback</h2>
                      <p className="text-xs text-slate-500">
                        Grade Coordinator:{' '}
                        <span className="font-semibold text-slate-800">
                          {streamWorkspace?.seniorTeacher?.teacherName || 'Pending Admin Assignment'}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('report_to_senior')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Class Report</span>
                    </button>
                  </div>

                  {latestReviewAlert ? (
                    <div className="border border-slate-200 rounded-lg p-4 space-y-1.5 bg-slate-50">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-900">
                          Latest Feedback on: {latestReviewAlert.reportTitle}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {latestReviewAlert.created_at.slice(0, 10)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">{latestReviewAlert.comments}</p>
                      {latestReviewAlert.action_items && (
                        <p className="text-[11px] font-medium text-amber-800">
                          Action Item: {latestReviewAlert.action_items}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-xs text-slate-500">
                      No Senior Teacher feedback posted yet. Submit a weekly or termly class report to receive coordinator review comments.
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('class_register')}
                      className="px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
                    >
                      Mark Attendance
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('students')}
                      className="px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
                    >
                      View Students
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('discipline_log')}
                      className="px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
                    >
                      Log Intervention
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('announcements')}
                      className="px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
                    >
                      Post Notice
                    </button>
                  </div>
                </section>

                <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-900">Recent Announcements & Alerts</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('notifications')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {announcements.slice(0, 3).map((ann) => (
                      <div key={ann.id} className="py-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">{ann.author_name}</span>
                          <span className="font-mono tabular-nums">{ann.created_at.slice(0, 10)}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">{ann.title}</div>
                        <p className="text-[11px] text-slate-600 line-clamp-2">{ann.message}</p>
                      </div>
                    ))}
                    {announcements.length === 0 && (
                      <div className="py-6 text-xs text-slate-500 text-center">
                        No grade or stream notices posted yet.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: MY CLASS
              ======================================================== */}
          {activeTab === 'my_class' && (
            <div className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{streamLabel} — Stream Command</h2>
                    <p className="text-xs text-slate-500">
                      Room: {selectedHierarchyStream?.roomLabel || streamLabel} · Capacity{' '}
                      <span className="font-mono tabular-nums">{selectedHierarchyStream?.capacity || 45}</span> · Senior Coordinator:{' '}
                      {streamWorkspace?.seniorTeacher?.teacherName || 'Unassigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportStreamReport('pdf')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Class PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportStreamReport('excel')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export Excel</span>
                    </button>
                  </div>
                </div>

                {selectedHierarchyStream && (
                  <AcademicMonitoringPanel
                    streams={[selectedHierarchyStream]}
                    records={streamWorkspace?.monitoring || []}
                    onRefresh={() => void refreshAll()}
                  />
                )}
              </section>
            </div>
          )}

          {/* ========================================================
              TAB: STUDENTS ROSTER
              ======================================================== */}
          {activeTab === 'students' && (
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Registered Students — {streamLabel}</h2>
                  <p className="text-xs text-slate-500">
                    <span className="font-mono tabular-nums font-semibold text-slate-800">{effectiveRoster.length}</span>{' '}
                    active learners enrolled in your assigned stream
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by name or admission..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {filteredRoster.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No learners match your filter in {streamLabel}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-2.5 pr-3">Adm No.</th>
                        <th className="py-2.5 pr-3">Learner Name</th>
                        <th className="py-2.5 pr-3">Parent / Guardian</th>
                        <th className="py-2.5 pr-3">Contact Phone</th>
                        <th className="py-2.5 pr-3 text-right">Open Interventions</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredRoster.map((stu) => (
                        <tr key={stu.studentId} className="hover:bg-slate-50/60">
                          <td className="py-3 pr-3 font-mono tabular-nums text-slate-700">
                            {stu.admissionNumber || '—'}
                          </td>
                          <td className="py-3 pr-3 font-semibold text-slate-900">{stu.studentName}</td>
                          <td className="py-3 pr-3 text-slate-700">{stu.parentName || '—'}</td>
                          <td className="py-3 pr-3 font-mono tabular-nums text-slate-600">
                            {stu.parentPhone || stu.phone || '—'}
                          </td>
                          <td className="py-3 pr-3 text-right font-mono tabular-nums">
                            <span className={stu.openInterventionsCount > 0 ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                              {stu.openInterventionsCount || 0}
                            </span>
                          </td>
                          <td className="py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setDisciplineSubTab('interventions');
                                setActiveTab('discipline_log');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-md cursor-pointer"
                            >
                              Intervention
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ========================================================
              TAB: ATTENDANCE (ClassTeacherModule)
              ======================================================== */}
          {activeTab === 'class_register' && (
            <div className="space-y-6">
              <ClassTeacherModule currentUser={currentUser} />
            </div>
          )}

          {/* ========================================================
              TAB: ACADEMIC RECORDS (Marksheet + Syllabus Monitoring)
              ======================================================== */}
          {activeTab === 'cbc_results' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {streamLabel} — Academic Performance & Syllabus Pacing
                    </h2>
                    <p className="text-xs text-slate-500">
                      Upload learner continuous assessment scores or log weekly subject syllabus coverage to your Senior Teacher.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAcademicRecordsSubTab('marksheet')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                        academicRecordsSubTab === 'marksheet'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      CBC Marksheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setAcademicRecordsSubTab('monitoring')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                        academicRecordsSubTab === 'monitoring'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Syllabus & Subject Mean
                    </button>
                  </div>
                </div>

                {academicRecordsSubTab === 'marksheet' ? (
                  <ResultUploadManager currentUser={currentUser} defaultGrade={selectedGrade} />
                ) : selectedHierarchyStream ? (
                  <AcademicMonitoringPanel
                    streams={[selectedHierarchyStream]}
                    records={streamWorkspace?.monitoring || []}
                    onRefresh={() => void refreshAll()}
                  />
                ) : (
                  <div className="text-xs text-slate-500 py-8 text-center">
                    Assign a stream to log subject syllabus monitoring records.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: BEHAVIOUR & INTERVENTIONS
              ======================================================== */}
          {activeTab === 'discipline_log' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {streamLabel} — Behaviour, Discipline & Student Interventions
                    </h2>
                    <p className="text-xs text-slate-500">
                      Record pastoral conduct incidents and escalate academic or attendance interventions to the Senior Teacher.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDisciplineSubTab('pastoral')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                        disciplineSubTab === 'pastoral'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Pastoral Register
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisciplineSubTab('interventions')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                        disciplineSubTab === 'interventions'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Intervention Plans ({openInterventions.length})
                    </button>
                    {disciplineSubTab === 'pastoral' && (
                      <button
                        type="button"
                        onClick={() => setShowNewDisciplineModal(true)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Record Entry</span>
                      </button>
                    )}
                  </div>
                </div>

                {disciplineSubTab === 'pastoral' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2.5 pr-3">Date</th>
                          <th className="py-2.5 pr-3">Learner</th>
                          <th className="py-2.5 pr-3">Category</th>
                          <th className="py-2.5 pr-3">Classification</th>
                          <th className="py-2.5 pr-3">Notes & Observation</th>
                          <th className="py-2.5">Action Taken</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {disciplineEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td className="py-3 pr-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">{entry.date}</td>
                            <td className="py-3 pr-3 font-semibold text-slate-900">{entry.studentName}</td>
                            <td className="py-3 pr-3 text-slate-700">{entry.category}</td>
                            <td className="py-3 pr-3 font-semibold uppercase text-[11px] text-slate-700">{entry.type}</td>
                            <td className="py-3 pr-3 text-slate-700 max-w-xs">{entry.description}</td>
                            <td className="py-3 text-slate-600">{entry.actionTaken}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : selectedHierarchyStream ? (
                  <StudentInterventionsPanel
                    streams={[selectedHierarchyStream]}
                    interventions={streamWorkspace?.interventions || []}
                    onRefresh={() => void refreshAll()}
                  />
                ) : null}
              </div>

              {showNewDisciplineModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <h3 className="text-base font-bold text-slate-900">Record Learner Pastoral Entry</h3>
                      <button
                        type="button"
                        onClick={() => setShowNewDisciplineModal(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddDiscipline} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Select Learner</label>
                        <select
                          value={newDisciplineStudentId}
                          onChange={(e) => setNewDisciplineStudentId(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 bg-white"
                        >
                          {effectiveRoster.map((s) => (
                            <option key={s.studentId} value={s.studentId}>
                              {s.studentName} ({s.admissionNumber || 'Student'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Type</label>
                          <select
                            value={newDisciplineType}
                            onChange={(e) => setNewDisciplineType(e.target.value as any)}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 bg-white"
                          >
                            <option value="merit">Merit</option>
                            <option value="commendation">Commendation</option>
                            <option value="counseling">Counseling Referral</option>
                            <option value="demerit">Infraction Warning</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Category</label>
                          <input
                            type="text"
                            required
                            value={newDisciplineCategory}
                            onChange={(e) => setNewDisciplineCategory(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Description</label>
                        <textarea
                          rows={3}
                          required
                          value={newDisciplineDesc}
                          onChange={(e) => setNewDisciplineDesc(e.target.value)}
                          placeholder="Describe the incident or achievement..."
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Action Taken</label>
                        <input
                          type="text"
                          value={newDisciplineAction}
                          onChange={(e) => setNewDisciplineAction(e.target.value)}
                          placeholder="e.g. Parent contacted / counseling referral"
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowNewDisciplineModal(false)}
                          className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer"
                        >
                          Save Record
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB: PARENT COMMUNICATION
              ======================================================== */}
          {activeTab === 'parent_comms' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="pb-4 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900">
                    {streamLabel} — Parent Communication Hub
                  </h2>
                  <p className="text-xs text-slate-500">
                    Send class-specific updates exclusively to parents of learners in {streamLabel}.
                  </p>
                </div>

                <form onSubmit={handleSendNotice} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="text-xs font-semibold text-slate-900">Broadcast Notice to Stream Parents</div>
                  <input
                    type="text"
                    required
                    placeholder="Notice Subject..."
                    value={newNoticeTitle}
                    onChange={(e) => setNewNoticeTitle(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <textarea
                    rows={3}
                    required
                    placeholder="Write message to stream parents..."
                    value={newNoticeMsg}
                    onChange={(e) => setNewNoticeMsg(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <select
                      value={newNoticeUrgency}
                      onChange={(e) => setNewNoticeUrgency(e.target.value as any)}
                      className="p-2 text-xs bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="normal">Standard Notice</option>
                      <option value="important">Important Action</option>
                      <option value="urgent">Urgent Notice</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Send to Parents ({effectiveRoster.length})</span>
                    </button>
                  </div>
                </form>

                <div className="divide-y divide-slate-200">
                  {classAnnouncements.map((ann) => (
                    <div key={ann.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">{ann.title}</span>
                        <span className="font-mono tabular-nums text-[11px] text-slate-500">{ann.date}</span>
                      </div>
                      <p className="text-xs text-slate-600">{ann.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900">Stream Parent Directory</h3>
                  <p className="text-xs text-slate-500">Guardians linked to students in {streamLabel}</p>
                </div>
                <div className="divide-y divide-slate-200 max-h-[420px] overflow-y-auto">
                  {effectiveRoster.map((stu) => (
                    <div key={stu.studentId} className="py-2.5 text-xs">
                      <div className="font-semibold text-slate-900">{stu.parentName || 'Parent Record'}</div>
                      <div className="text-slate-500">
                        Learner: {stu.studentName} · <span className="font-mono tabular-nums">{stu.parentPhone || stu.phone || '—'}</span>
                      </div>
                    </div>
                  ))}
                  {effectiveRoster.length === 0 && (
                    <div className="py-8 text-xs text-slate-500 text-center">No parent contacts loaded yet.</div>
                  )}
                </div>
              </aside>
            </div>
          )}

          {/* ========================================================
              TAB: CLASS REPORTS & TERMLY REMARKS
              ======================================================== */}
          {activeTab === 'report_remarks' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {streamLabel} — Class Reports & Progress Remarks
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter official learner report card remarks or export your tenant-branded Class Stream Dossier.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportStreamReport('pdf')}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportStreamReport('excel')}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchSaveAllRemarks}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save All Remarks</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search pupil by name or admission..."
                    value={remarksSearchQuery}
                    onChange={(e) => setRemarksSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  {effectiveRoster.length} learners
                </div>
              </div>

              <div className="space-y-3">
                {effectiveRoster
                  .filter(
                    (stu) =>
                      stu.studentName.toLowerCase().includes(remarksSearchQuery.toLowerCase()) ||
                      (stu.admissionNumber && stu.admissionNumber.toLowerCase().includes(remarksSearchQuery.toLowerCase()))
                  )
                  .map((stu) => {
                    const currentRemark = studentRemarksMap[stu.studentId] || '';
                    return (
                      <div key={stu.studentId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{stu.studentName}</div>
                            <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                              Adm: {stu.admissionNumber || '—'} · {streamLabel}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveStudentRemarks(stu.studentId)}
                            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                          >
                            <Save className="w-3 h-3 text-emerald-600" />
                            <span>Save</span>
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={currentRemark}
                          onChange={(e) =>
                            setStudentRemarksMap({
                              ...studentRemarksMap,
                              [stu.studentId]: e.target.value,
                            })
                          }
                          className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Templates:</span>
                          {REMARK_PRESETS.map((preset, pidx) => (
                            <button
                              key={pidx}
                              type="button"
                              onClick={() =>
                                setStudentRemarksMap({
                                  ...studentRemarksMap,
                                  [stu.studentId]: preset,
                                })
                              }
                              className="px-2 py-0.5 bg-white border border-slate-200 hover:border-emerald-300 text-[10px] rounded text-slate-700 cursor-pointer truncate max-w-[200px]"
                              title={preset}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB: REPORT TO SENIOR TEACHER (Structured Academic Escalation)
              ======================================================== */}
          {activeTab === 'report_to_senior' && (
            selectedHierarchyStream ? (
              <ClassReportComposerAndHistory
                stream={selectedHierarchyStream}
                seniorTeacherName={streamWorkspace?.seniorTeacher?.teacherName}
                defaultStudentsCount={effectiveRoster.length}
                reports={streamWorkspace?.reports || []}
                onRefresh={() => void refreshAll()}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500">
                An active stream assignment is required before submitting reports to a Senior Teacher.
              </div>
            )
          )}

          {/* ========================================================
              TAB: ANNOUNCEMENTS
              ======================================================== */}
          {activeTab === 'announcements' && (
            selectedHierarchyGrade && selectedHierarchyStream ? (
              <GradeAnnouncementsPanel
                grades={[selectedHierarchyGrade]}
                streams={[selectedHierarchyStream]}
                announcements={announcements}
                defaultGradeId={selectedHierarchyGrade.id}
                defaultStreamId={selectedHierarchyStream.id}
                allowAllGrade={false}
                onCreated={() => void refreshAll()}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500">
                No assigned stream announcements available yet.
              </div>
            )
          )}

          {/* ========================================================
              TAB: NOTIFICATIONS
              ======================================================== */}
          {activeTab === 'notifications' && (
            <AcademicNotificationsPanel
              notifications={notifications}
              onRefresh={() => void refreshAll()}
              onNavigateTab={(t) => {
                if (t) setActiveTab(t as ClassTeacherTab);
              }}
            />
          )}

          {/* ========================================================
              PRESERVED ROUTINE TABS
              ======================================================== */}
          {activeTab === 'lunch_register' && (
            <LearnerLunchRegister
              currentUser={currentUser}
              initialGrade={selectedGrade}
              initialStream={selectedStream}
              viewMode="class_teacher"
              title={`${streamLabel} Learner Lunch Register`}
              subtitle="Official daily midday lunch attendance log marked strictly by the Class Teacher."
            />
          )}

          {activeTab === 'gate_exit' && <StudentGateExit currentUser={currentUser} />}

          {activeTab === 'timetable' && <TimetablePortal currentUser={currentUser} />}

          {activeTab === 'virtual_classrooms' && <SubjectTeacherVirtualLessonsPanel />}

          {activeTab === 'work_entry' && <TeacherWorkEntryForm currentUser={currentUser} />}

          {activeTab === 'staff_appraisal' && <OwnStaffAppraisal currentUser={currentUser} />}
        </main>
      </div>
    </div>
  );
};
