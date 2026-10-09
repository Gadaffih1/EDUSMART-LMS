import React, { useState } from 'react';
import { 
  User, 
  GateExitPass, 
  WorkEntryLog, 
  GradeLevel, 
  StreamName,
  SearchAuditLog,
  AppNotification,
  StaffDutyAssignment,
  ReportCard,
  SubjectName
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  ShieldCheck, 
  Users, 
  FileCheck2, 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Search, 
  Plus, 
  Check, 
  School, 
  FileText, 
  BadgeAlert, 
  UserX, 
  Phone, 
  Printer,
  ShieldAlert,
  Smartphone,
  Send,
  Globe,
  Sparkles,
  BarChart3,
  HeartPulse,
  Edit2,
  Edit3,
  Trash2,
  X,
  PlusCircle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { ExecutiveAnalyticsDashboard } from '../analytics/ExecutiveAnalyticsDashboard';
import { ReportingHub } from '../reports/ReportingHub';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { WorkEntryAuditViewer } from '../common/WorkEntryAuditViewer';
import { SanatoriumSection } from '../sanatorium/SanatoriumSection';
import { TransportWorkspace } from '../transport/TransportWorkspace';
import { CoCurricularWorkspace } from '../cocurricular/CoCurricularWorkspace';
import { TimetablePortal } from '../timetable/TimetablePortal';
import { LearnerLunchRegister } from '../meals/LearnerLunchRegister';
import { SchoolEventsManager } from '../events/SchoolEventsManager';
import { ResultUploadManager } from '../academic/ResultUploadManager';
import { WorkspaceSidebar, WorkspaceSidebarGroup } from '../layout/WorkspaceSidebar';
import { 
  Bus,
  Trophy,
  CalendarDays,
  Utensils,
  Menu,
  Upload,
  ChevronRight
} from 'lucide-react';

interface DeputyHeadWorkspaceProps {
  currentUser: User;
}

interface DisciplineCase {
  id: string;
  studentName: string;
  grade: GradeLevel;
  stream: StreamName;
  admissionNumber: string;
  incidentDate: string;
  category: 'Lateness/Truancy' | 'Uniform & Grooming' | 'Bullying & Conduct' | 'Property Damage' | 'Academic Dishonesty';
  description: string;
  actionTaken: string;
  status: 'Open' | 'Parent Summoned' | 'Counseling' | 'Resolved';
  reportedBy: string;
}

export const DeputyHeadWorkspace: React.FC<DeputyHeadWorkspaceProps> = ({ currentUser }) => {
  type DeputyTab = 
    | 'analytics'
    | 'results_upload' 
    | 'operations' 
    | 'reports_moderation'
    | 'discipline' 
    | 'online_discipline' 
    | 'staff_duty' 
    | 'timetable' 
    | 'work_ledger' 
    | 'sanatorium' 
    | 'lunch_register' 
    | 'transport' 
    | 'cocurricular' 
    | 'reporting_hub' 
    | 'events';
  const [activeTab, setActiveTab] = useState<DeputyTab>('analytics');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Report Cards & Moderation states
  const [reportCards, setReportCards] = useState<ReportCard[]>(() => Storage.getReportCards());
  const [selectedModerationGrade, setSelectedModerationGrade] = useState<GradeLevel>(4);
  const [editingReportCard, setEditingReportCard] = useState<ReportCard | null>(null);
  const [editClassRemarks, setEditClassRemarks] = useState('');
  const [editDeputyRemarks, setEditDeputyRemarks] = useState('');
  const [editSubjectRemarks, setEditSubjectRemarks] = useState<{ subject: SubjectName; remarks: string }[]>([]);
  const [deputyToast, setDeputyToast] = useState<string | null>(null);

  React.useEffect(() => {
    const handleReportUpdate = () => {
      setReportCards(Storage.getReportCards());
    };
    window.addEventListener('report-cards-updated', handleReportUpdate);
    return () => window.removeEventListener('report-cards-updated', handleReportUpdate);
  }, []);

  const showDeputyToast = (msg: string) => {
    setDeputyToast(msg);
    setTimeout(() => setDeputyToast(null), 4000);
  };

  const handleOpenEditReport = (rc: ReportCard) => {
    setEditingReportCard(rc);
    setEditClassRemarks(rc.classTeacherRemarks || '');
    setEditDeputyRemarks(rc.deputyRemarks || 'Reviewed for learner decorum, character development, and academic diligence by Deputy Head Teacher.');
    setEditSubjectRemarks(rc.subjects.map(s => ({ subject: s.subject, remarks: s.remarks || '' })));
  };

  const handleSaveAndRepublishReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReportCard) return;

    const updatedSubjects = editingReportCard.subjects.map(s => {
      const match = editSubjectRemarks.find(sr => sr.subject === s.subject);
      return match ? { ...s, remarks: match.remarks } : s;
    });

    const republished = Storage.republishReportCard(
      editingReportCard.id,
      {
        classTeacherRemarks: editClassRemarks.trim(),
        deputyRemarks: editDeputyRemarks.trim(),
        subjects: updatedSubjects
      },
      currentUser.name,
      'Deputy Head Teacher',
      'Pastoral and academic conduct review completed. Verified and officially republished.'
    );

    if (republished) {
      setReportCards(Storage.getReportCards());
      showDeputyToast(`Report Card for ${editingReportCard.studentName} successfully republished with Deputy Head endorsement!`);
      setEditingReportCard(null);
    }
  };

  const handleQuickRepublishSingle = (rc: ReportCard) => {
    const republished = Storage.republishReportCard(
      rc.id,
      {
        deputyRemarks: rc.deputyRemarks || 'Verified and officially republished by Deputy Head Teacher.'
      },
      currentUser.name,
      'Deputy Head Teacher',
      'Endorsed and republished following termly operational review.'
    );
    if (republished) {
      setReportCards(Storage.getReportCards());
      showDeputyToast(`Report Card for ${rc.studentName} republished with Deputy Head seal!`);
    }
  };

  // Gate passes from storage
  const [gatePasses, setGatePasses] = useState<GateExitPass[]>(() => Storage.getGatePasses());
  const workLogs = Storage.getWorkEntryLogs();
  const allUsers = Storage.getUsers();
  const teachersList = allUsers.filter(u => ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(u.role));
  const seniorTeachers = allUsers.filter(u => u.role === 'senior_teacher');

  // Staff duty rosters from Storage (Editable & Assignable by Deputy Head)
  const [dutyRosters, setDutyRosters] = useState<StaffDutyAssignment[]>(() => Storage.getStaffDutyRosters());
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [editingDutyId, setEditingDutyId] = useState<string | null>(null);
  const [dutyWeek, setDutyWeek] = useState<number>(7);
  const [dutyStartDate, setDutyStartDate] = useState('2026-10-12');
  const [dutyEndDate, setDutyEndDate] = useState('2026-10-16');
  const [dutyLeadTeacher, setDutyLeadTeacher] = useState('Mr. Peter Ochieng');
  const [dutyAssistantTeacher, setDutyAssistantTeacher] = useState('Mr. David Kiprono');
  const [dutyGateTeacher, setDutyGateTeacher] = useState('Mrs. Jane Njeri');
  const [dutyDiningSupervisor, setDutyDiningSupervisor] = useState('Mrs. Grace Muthoni');
  const [dutyFocusTheme, setDutyFocusTheme] = useState('Morning Assembly Discipline & Compound Order');
  const [dutyStatus, setDutyStatus] = useState<StaffDutyAssignment['status']>('Upcoming');
  const [dutyNotes, setDutyNotes] = useState('');
  const [dutyFeedback, setDutyFeedback] = useState<string | null>(null);

  // Sync duty rosters on storage updates
  React.useEffect(() => {
    const handleDutyUpdate = () => {
      setDutyRosters(Storage.getStaffDutyRosters());
    };
    window.addEventListener('staff-duty-rosters-updated', handleDutyUpdate);
    return () => window.removeEventListener('staff-duty-rosters-updated', handleDutyUpdate);
  }, []);

  const handleOpenNewDutyModal = () => {
    setEditingDutyId(null);
    const nextWeek = dutyRosters.length > 0 ? Math.max(...dutyRosters.map(d => d.weekNumber)) + 1 : 7;
    setDutyWeek(nextWeek);
    setDutyStartDate('2026-10-12');
    setDutyEndDate('2026-10-16');
    setDutyLeadTeacher(seniorTeachers[0]?.name || 'Mr. Peter Ochieng');
    setDutyAssistantTeacher(teachersList[0]?.name || 'Mr. David Kiprono');
    setDutyGateTeacher(teachersList[1]?.name || 'Mrs. Jane Njeri');
    setDutyDiningSupervisor(teachersList[2]?.name || 'Mrs. Grace Muthoni');
    setDutyFocusTheme('Punctuality, Smart Attire & Assembly Decorum');
    setDutyStatus('Upcoming');
    setDutyNotes('');
    setShowDutyModal(true);
  };

  const handleEditDuty = (duty: StaffDutyAssignment) => {
    setEditingDutyId(duty.id);
    setDutyWeek(duty.weekNumber);
    setDutyStartDate(duty.startDate);
    setDutyEndDate(duty.endDate);
    setDutyLeadTeacher(duty.leadTeacher);
    setDutyAssistantTeacher(duty.assistantTeacher);
    setDutyGateTeacher(duty.gateDutyTeacher);
    setDutyDiningSupervisor(duty.diningSupervision);
    setDutyFocusTheme(duty.focusTheme || '');
    setDutyStatus(duty.status);
    setDutyNotes(duty.notes || '');
    setShowDutyModal(true);
  };

  const handleSaveDuty = (e: React.FormEvent) => {
    e.preventDefault();
    const dutyPayload: StaffDutyAssignment = {
      id: editingDutyId || `duty-w${dutyWeek}-${Date.now()}`,
      weekNumber: Number(dutyWeek),
      startDate: dutyStartDate,
      endDate: dutyEndDate,
      leadTeacher: dutyLeadTeacher,
      seniorTeacherName: dutyLeadTeacher.includes('Peter Ochieng') || dutyLeadTeacher.includes('Senior')
        ? `${dutyLeadTeacher} (Senior Teacher)`
        : dutyLeadTeacher,
      assistantTeacher: dutyAssistantTeacher,
      gateDutyTeacher: dutyGateTeacher,
      diningSupervision: dutyDiningSupervisor,
      focusTheme: dutyFocusTheme,
      status: dutyStatus,
      assignedBy: `${currentUser.name} (Deputy Head)`,
      assignedAt: new Date().toISOString().split('T')[0],
      notes: dutyNotes
    };

    if (editingDutyId) {
      Storage.updateStaffDutyRoster(editingDutyId, dutyPayload);
      setDutyFeedback(`Weekly Duty Roster for Week ${dutyWeek} successfully updated!`);
    } else {
      Storage.addStaffDutyRoster(dutyPayload);
      setDutyFeedback(`Weekly Duty Roster for Week ${dutyWeek} assigned and broadcast to staff!`);
    }

    setShowDutyModal(false);
    setTimeout(() => setDutyFeedback(null), 3500);
  };

  const handleDeleteDuty = (id: string, week: number) => {
    if (confirm(`Remove duty roster assignment for Week ${week}?`)) {
      Storage.deleteStaffDutyRoster(id);
      setDutyFeedback(`Week ${week} duty assignment removed.`);
      setTimeout(() => setDutyFeedback(null), 3000);
    }
  };

  // Online Search Discipline & Filtration state
  const [searchLogs, setSearchLogs] = useState<SearchAuditLog[]>(() => Storage.getSearchAuditLogs());
  const [searchStatusFilter, setSearchStatusFilter] = useState<'all' | 'flagged' | 'guided_redirection' | 'safe'>('all');
  const [smsSentSuccess, setSmsSentSuccess] = useState<string | null>(null);

  const handleSendParentNotice = (log: SearchAuditLog) => {
    const notif: AppNotification = {
      id: `notif-disp-${Date.now()}`,
      title: `Online Safety Alert: ${log.userName} (Grade ${log.grade})`,
      message: `Safety Notice: Learner search query "${log.searchQuery}" was flagged by school online safety guardrails (${log.filterReason || 'Off-curriculum restricted query'}). Disciplinary Dean has logged counseling follow-up.`,
      category: 'safety',
      targetRole: 'parent',
      targetGrade: log.grade,
      urgency: 'high',
      createdAt: new Date().toISOString().split('T')[0],
      readByUserIds: []
    };
    Storage.addNotification(notif);
    setSmsSentSuccess(`SMS Alert & App Notification sent to ${log.userName}'s parents!`);
    setTimeout(() => setSmsSentSuccess(null), 3500);
  };

  // Discipline state
  const [disciplineCases, setDisciplineCases] = useState<DisciplineCase[]>([
    {
      id: 'disp-101',
      studentName: 'Kelvin Mwangi',
      grade: 7,
      stream: 'Athi',
      admissionNumber: 'ADM/2024/0719',
      incidentDate: '2026-09-29',
      category: 'Lateness/Truancy',
      description: 'Reported 40 minutes late past morning assembly for the third consecutive day.',
      actionTaken: 'First warning letter issued. Parent contacted via SMS.',
      status: 'Parent Summoned',
      reportedBy: 'Mr. David Kiprono'
    },
    {
      id: 'disp-102',
      studentName: 'Samuel Kariuki',
      grade: 8,
      stream: 'Mara',
      admissionNumber: 'ADM/2023/0842',
      incidentDate: '2026-09-25',
      category: 'Bullying & Conduct',
      description: 'Verbal confrontation with junior school learners near the sports pavilion.',
      actionTaken: 'Peer mediation session and guided counseling with Senior Teacher.',
      status: 'Counseling',
      reportedBy: 'Mr. Peter Ochieng'
    },
    {
      id: 'disp-103',
      studentName: 'Mercy Achieng',
      grade: 6,
      stream: 'Falcon',
      admissionNumber: 'ADM/2025/0605',
      incidentDate: '2026-09-20',
      category: 'Uniform & Grooming',
      description: 'Incorrect sports kit worn during formal academic hours.',
      actionTaken: 'Corrected attire, verbal reprimand recorded.',
      status: 'Resolved',
      reportedBy: 'Mrs. Florence Akinyi'
    }
  ]);

  // New discipline case modal / form
  const [showAddDiscipline, setShowAddDiscipline] = useState(false);
  const [dispStudentName, setDispStudentName] = useState('');
  const [dispGrade, setDispGrade] = useState<GradeLevel>(7);
  const [dispStream, setDispStream] = useState<StreamName>('Athi');
  const [dispCategory, setDispCategory] = useState<DisciplineCase['category']>('Lateness/Truancy');
  const [dispDescription, setDispDescription] = useState('');
  const [dispAction, setDispAction] = useState('');

  // Handle Mark Gate Pass Returned
  const handleUpdatePassStatus = (id: string, newStatus: GateExitPass['status']) => {
    Storage.updateGatePassStatus(id, newStatus, {
      actualReturnTime: newStatus === 'returned' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
    });
    setGatePasses(Storage.getGatePasses());
  };

  // Handle Add Discipline Case
  const handleCreateDisciplineCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispStudentName.trim() || !dispDescription.trim()) return;

    const newCase: DisciplineCase = {
      id: `disp-${Date.now()}`,
      studentName: dispStudentName.trim(),
      grade: dispGrade,
      stream: dispStream,
      admissionNumber: `ADM/2026/0${dispGrade}${Math.floor(10 + Math.random() * 89)}`,
      incidentDate: new Date().toISOString().split('T')[0],
      category: dispCategory,
      description: dispDescription.trim(),
      actionTaken: dispAction.trim() || 'Logged under deputy head observation.',
      status: 'Open',
      reportedBy: currentUser.name
    };

    setDisciplineCases([newCase, ...disciplineCases]);
    setShowAddDiscipline(false);
    setDispStudentName('');
    setDispDescription('');
    setDispAction('');
  };

  const sidebarGroups: WorkspaceSidebarGroup<DeputyTab>[] = [
    {
      title: 'EXECUTIVE & GOVERNANCE',
      items: [
        { id: 'analytics', label: 'Executive Health, Attendance & Academic Analytics', icon: TrendingUp }
      ]
    },
    {
      title: 'OPERATIONS & GATE PASSES',
      items: [
        { id: 'operations', label: 'Gate Security & Operations', icon: ShieldCheck, badge: gatePasses.length },
        { id: 'staff_duty', label: 'Staff Duty Rosters', icon: Calendar, badge: dutyRosters.length }
      ]
    },
    {
      title: 'DISCIPLINE & WELFARE',
      items: [
        { id: 'discipline', label: 'Learner Discipline & Conduct', icon: BadgeAlert, badge: disciplineCases.length, badgeColor: 'bg-amber-600' },
        { id: 'online_discipline', label: 'Online Behavior & Filtration', icon: ShieldAlert, badge: searchLogs.length, badgeColor: 'bg-rose-600' }
      ]
    },
    {
      title: 'ACADEMIC & CBC ASSESSMENTS',
      items: [
        { id: 'reports_moderation', label: 'Reports & Write-Ups Moderation', icon: FileCheck2, badge: 'Republish', badgeColor: 'bg-blue-600' },
        { id: 'results_upload', label: 'CBC Assessment Results Hub', icon: Upload, badge: 'Upload / Assign', badgeColor: 'bg-emerald-600' },
        { id: 'work_ledger', label: 'Staff Work Entry Audit', icon: FileCheck2, badge: workLogs.length },
        { id: 'timetable', label: 'Curriculum Master Timetable', icon: CalendarDays },
        { id: 'reporting_hub', label: 'Institutional Reporting Hub', icon: BarChart3 }
      ]
    },
    {
      title: 'CAMPUS SERVICES',
      items: [
        { id: 'sanatorium', label: 'Sanatorium & Clinic', icon: HeartPulse },
        { id: 'lunch_register', label: 'Learner Lunch Register', icon: Utensils },
        { id: 'transport', label: 'Transport & Fleet', icon: Bus },
        { id: 'cocurricular', label: 'Co-Curriculum & Sports', icon: Trophy },
        { id: 'events', label: 'School Events & Tickets', icon: CalendarDays, badge: 'Post', badgeColor: 'bg-indigo-500' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors lg:hidden cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="bg-white p-1 rounded-lg border border-slate-700 hidden sm:block">
            <EduSmartGadsaLogo variant="horizontal" size="xs" />
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
              <span>Deputy Head Teacher Workspace</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Executive Directorate
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Operations, Discipline, Duty Rosters & CBC Grade Result Upload Oversight
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Result Upload Action Button */}
          <button
            onClick={() => setActiveTab('results_upload')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Grade Results</span>
            <span className="sm:hidden">Upload Results</span>
          </button>

          <div className="text-right text-xs hidden md:block">
            <div className="font-bold text-white">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{currentUser.tscNumber || 'TSC/23491/ED'}</div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout with Sidebar Tree */}
      <div className="flex-1 flex w-full">
        <WorkspaceSidebar<DeputyTab>
          portalTitle="DEPUTY HEAD"
          portalSubtitle="Operations & Security"
          portalIcon="🛡️"
          portalBadge="Executive"
          groups={sidebarGroups}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          themeColor="blue"
          footerNote="Safety & CBC Integrity"
          statusText="● Active Duty"
        />

        {/* Content View Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">

          {/* ========================================================
              TAB 1: EXECUTIVE HEALTH, ATTENDANCE & ACADEMIC ANALYTICS
              (Executive Health & Intelligence Console - Landing Data)
              ======================================================== */}
          {activeTab === 'analytics' && (
            <ExecutiveAnalyticsDashboard 
              currentUser={currentUser}
              title="Executive Health, Attendance & Academic Analytics"
              subtitle="Executive Health & Intelligence Console: Real-time Recharts surveillance of campus attendance rates, longitudinal CBC mastery, library foot-traffic, sanatorium clinic logs, and student wellbeing indicators."
            />
          )}

          {/* ========================================================
              TAB: CBC ASSESSMENT RESULTS HUB (DEPUTY VIEW / ASSIGN / UPLOAD)
              ======================================================== */}
          {activeTab === 'results_upload' && (
            <ResultUploadManager 
              currentUser={currentUser} 
              viewMode="deputy"
              defaultGrade={4}
            />
          )}

          {/* ========================================================
              TAB: REPORTS & WRITE-UPS MODERATION (DEPUTY HEAD FULL RIGHTS)
              ======================================================== */}
          {activeTab === 'reports_moderation' && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    <span>Deputy Head Pastoral & Conduct Oversight</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Reports & Narrative Write-Ups Moderation
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deputy Head Teacher possesses full executive authority to edit teacher comments, conduct write-ups, and authoritatively republish student reports.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
                    <span className="text-slate-500">Cohort:</span>
                    <select
                      value={selectedModerationGrade}
                      onChange={(e) => setSelectedModerationGrade(Number(e.target.value) as GradeLevel)}
                      className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                    >
                      {[1,2,3,4,5,6,7,8,9].map(g => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      allUsers
                        .filter(u => u.role === 'student' && u.grade === selectedModerationGrade)
                        .forEach(s => {
                          const existing = reportCards.find(r => r.studentId === s.id);
                          if (existing) {
                            Storage.republishReportCard(
                              existing.id,
                              {
                                deputyRemarks: existing.deputyRemarks || 'Conduct, discipline and termly citizenship verified and approved by Deputy Head Teacher.'
                              },
                              currentUser.name,
                              'Deputy Head Teacher',
                              `Batch cohort verification for Grade ${selectedModerationGrade}.`
                            );
                          }
                        });
                      setReportCards(Storage.getReportCards());
                      showDeputyToast(`All Grade ${selectedModerationGrade} reports republished with Deputy Head seal!`);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Batch Republish Grade {selectedModerationGrade}</span>
                  </button>
                </div>
              </div>

              {deputyToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{deputyToast}</span>
                  </div>
                  <button onClick={() => setDeputyToast(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allUsers
                  .filter(u => u.role === 'student' && u.grade === selectedModerationGrade)
                  .map(student => {
                    const rc = reportCards.find(r => r.studentId === student.id) || {
                      id: `rc-${student.id}-gen`,
                      studentId: student.id,
                      studentName: student.name,
                      admissionNumber: student.admissionNumber || `ADM/2026/0${student.grade || 4}01`,
                      grade: student.grade || 4,
                      stream: student.stream || 'Dove',
                      term: 'Term 3' as const,
                      academicYear: 2026,
                      subjects: [
                        { subject: 'Mathematics' as SubjectName, openerScore: 78, midTermScore: 82, endTermScore: 84, total: 82, gradeLetter: 'B' as const, rubricLevel: 'Meeting Expectations' as const, remarks: 'Good analytical reasoning and active class effort.', teacherName: 'Mr. David Kiprono' },
                        { subject: 'English' as SubjectName, openerScore: 80, midTermScore: 84, endTermScore: 86, total: 84, gradeLetter: 'A' as const, rubricLevel: 'Exceeding Expectations' as const, remarks: 'Demonstrates eloquence and rich vocabulary.', teacherName: 'Mrs. Florence Akinyi' }
                      ],
                      overallAverage: 83,
                      overallRubric: 'Exceeding Expectations' as const,
                      streamPosition: 4,
                      totalStudentsInStream: 42,
                      attendanceDays: 49,
                      totalSchoolDays: 50,
                      nextTermBegins: '2027-01-05',
                      classTeacherRemarks: 'Well-mannered, punctual, and upholds high standards of conduct.',
                      headTeacherRemarks: 'Commended for excellent leadership.'
                    };

                    const isRepublished = rc.publicationStatus === 'Republished';

                    return (
                      <div key={rc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900">{rc.studentName}</h3>
                                {isRepublished && (
                                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Republished</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                {rc.admissionNumber} · Grade {rc.grade} ({rc.stream}) · {rc.term}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-extrabold font-mono text-emerald-700">{rc.overallAverage}%</span>
                              <div className="text-[10px] text-slate-400 font-mono">{rc.overallRubric}</div>
                            </div>
                          </div>

                          {/* Class Teacher Remarks */}
                          <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                            <div className="text-slate-500 font-semibold text-[10px] uppercase">Class Teacher Conduct Remarks:</div>
                            <p className="text-slate-700 italic text-[11px] leading-relaxed">"{rc.classTeacherRemarks}"</p>
                          </div>

                          {/* Deputy Head Remarks */}
                          {rc.deputyRemarks && (
                            <div className="text-xs bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 space-y-1">
                              <div className="text-blue-900 font-semibold text-[10px] uppercase flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-blue-700" />
                                <span>Deputy Head Endorsement & Conduct Review:</span>
                              </div>
                              <p className="text-blue-950 font-medium text-[11px] leading-relaxed">"{rc.deputyRemarks}"</p>
                              {rc.republishedAt && (
                                <div className="text-[9px] text-blue-700 font-mono">
                                  Republished by {rc.republishedBy || 'Deputy Head'} on {new Date(rc.republishedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between text-xs pt-3 border-t border-slate-200 gap-2">
                          <span className="text-slate-500 font-mono text-[11px]">
                            Attendance: {rc.attendanceDays}/{rc.totalSchoolDays} days
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditReport(rc)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-white text-slate-700 hover:text-blue-800 border border-slate-300 hover:border-blue-400 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Edit conduct remarks or subject commentary"
                            >
                              <Edit2 className="w-3 h-3 text-blue-600" />
                              <span>Edit Remarks</span>
                            </button>

                            <button
                              onClick={() => handleQuickRepublishSingle(rc)}
                              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                isRepublished 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-blue-700 hover:bg-blue-800 text-white shadow-2xs'
                              }`}
                              title="Officially republish report card"
                            >
                              <Send className="w-3 h-3" />
                              <span>{isRepublished ? 'Re-Publish' : 'Republish Report'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Deputy Edit Modal */}
          {editingReportCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-xs">
                      <Edit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Deputy Head: Edit Remarks & Republish Report
                      </h3>
                      <div className="text-xs text-slate-500 font-mono">
                        Learner: {editingReportCard.studentName} · Grade {editingReportCard.grade} ({editingReportCard.stream})
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingReportCard(null)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAndRepublishReport} className="p-6 overflow-y-auto flex-1 space-y-5">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950">
                    <strong>Deputy Rights Active:</strong> You have full authority to modify student conduct write-ups, teacher comments, and officially republish reports.
                  </div>

                  {/* Class Teacher Remarks */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900 uppercase">
                      Class Teacher Remarks (Conduct & Behavior)
                    </label>
                    <textarea
                      rows={3}
                      value={editClassRemarks}
                      onChange={(e) => setEditClassRemarks(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                      placeholder="Edit class teacher remarks..."
                    />
                  </div>

                  {/* Deputy Remarks */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                      <span>Deputy Head Endorsement & Pastoral Remarks</span>
                    </label>
                    <textarea
                      rows={2}
                      value={editDeputyRemarks}
                      onChange={(e) => setEditDeputyRemarks(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-blue-300 bg-blue-50/30 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                      placeholder="Deputy Head pastoral endorsement..."
                    />
                  </div>

                  {/* Subject Remarks */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-900 uppercase">
                      Subject Feedback Remarks Moderation
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {editSubjectRemarks.map((sub, idx) => (
                        <div key={sub.subject} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                          <span className="font-bold text-slate-800">{sub.subject}</span>
                          <input
                            type="text"
                            value={sub.remarks}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditSubjectRemarks(prev => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], remarks: val };
                                return next;
                              });
                            }}
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                            placeholder={`Remarks for ${sub.subject}...`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
                    <button
                      type="button"
                      onClick={() => setEditingReportCard(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Save Remarks & Republish Report</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

      {/* ========================================================
          TAB 1: GATE PASS SECURITY & OPERATIONS
          ======================================================== */}
      {activeTab === 'operations' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 print:m-0 print:border-none print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                <EduSmartGadsaLogo variant="horizontal" size="xs" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Gate Pass Approvals & Exit Security Tracking
                </h2>
                <p className="text-xs text-slate-500">
                  Authorized student departure slips issued by Class Teachers. Verify security codes, guardian contact details, and return times.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Gate Register</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Pass Code</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Grade & Stream</th>
                    <th className="py-2.5 px-3">Reason Category</th>
                    <th className="py-2.5 px-3">Departure / Return</th>
                    <th className="py-2.5 px-3">Guardian Info</th>
                    <th className="py-2.5 px-3">Authorized By</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {gatePasses.map((pass) => (
                    <tr key={pass.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{pass.gatePassCode}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{pass.studentName}</td>
                      <td className="py-2.5 px-3 text-slate-600">Grade {pass.grade} ({pass.stream})</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">{pass.reason}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <div>Dep: {pass.departureTime}</div>
                        <div className="text-slate-500">Exp: {pass.expectedReturnTime || 'Day end'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{pass.guardianName}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          {pass.guardianPhone}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{pass.teacherName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          pass.status === 'active' ? 'bg-amber-100 text-amber-800' :
                          pass.status === 'departed' ? 'bg-purple-100 text-purple-800' :
                          pass.status === 'returned' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {pass.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {pass.status !== 'returned' && (
                          <div className="flex items-center justify-end gap-1">
                            {pass.status === 'active' && (
                              <button
                                onClick={() => handleUpdatePassStatus(pass.id, 'departed')}
                                className="px-2 py-1 text-[10px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded"
                              >
                                Mark Departed
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdatePassStatus(pass.id, 'returned')}
                              className="px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded"
                            >
                              Mark Returned
                            </button>
                          </div>
                        )}
                        {pass.status === 'returned' && (
                          <span className="text-[10px] text-slate-400 font-mono">Checked In</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 2: LEARNER DISCIPLINE & CONDUCT
          ======================================================== */}
      {activeTab === 'discipline' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Learner Discipline & Guidance Register
              </h2>
              <p className="text-xs text-slate-500">
                Formal logging of behavioral concerns, parental summons, peer counseling, and restorative actions.
              </p>
            </div>
            <button
              onClick={() => setShowAddDiscipline(true)}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log Discipline Incident</span>
            </button>
          </div>

          {/* Discipline Cases List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {disciplineCases.map((c) => (
              <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                    c.status === 'Open' ? 'bg-rose-100 text-rose-800' :
                    c.status === 'Parent Summoned' ? 'bg-amber-100 text-amber-800' :
                    c.status === 'Counseling' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {c.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{c.incidentDate}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.studentName}</h3>
                  <div className="text-xs text-slate-500">Grade {c.grade} ({c.stream}) · {c.admissionNumber}</div>
                </div>

                <div className="text-xs font-semibold text-slate-700 bg-white p-2 rounded border border-slate-200">
                  <span className="text-blue-800 font-bold block mb-0.5">{c.category}</span>
                  <p className="text-slate-600 font-normal">{c.description}</p>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Action: </span>
                  {c.actionTaken}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Reported by: {c.reportedBy}</span>
                  {c.status !== 'Resolved' && (
                    <button
                      onClick={() => {
                        setDisciplineCases(disciplineCases.map(dc => dc.id === c.id ? { ...dc, status: 'Resolved' } : dc));
                      }}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Resolve Case
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal / Inline Add Discipline Case */}
          {showAddDiscipline && (
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-300 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Record New Disciplinary Matter</h3>
                <button 
                  onClick={() => setShowAddDiscipline(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateDisciplineCase} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      value={dispStudentName}
                      onChange={(e) => setDispStudentName(e.target.value)}
                      placeholder="e.g. John Kamau"
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Grade Level *</label>
                    <select
                      value={dispGrade}
                      onChange={(e) => setDispGrade(Number(e.target.value) as GradeLevel)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {[1,2,3,4,5,6,7,8,9].map(g => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                    <select
                      value={dispCategory}
                      onChange={(e) => setDispCategory(e.target.value as DisciplineCase['category'])}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Lateness/Truancy">Lateness / Truancy</option>
                      <option value="Uniform & Grooming">Uniform & Grooming</option>
                      <option value="Bullying & Conduct">Bullying & Conduct</option>
                      <option value="Property Damage">Property Damage</option>
                      <option value="Academic Dishonesty">Academic Dishonesty</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="font-semibold text-slate-700 block mb-1">Incident Specifics & Findings *</label>
                  <textarea
                    rows={2}
                    required
                    value={dispDescription}
                    onChange={(e) => setDispDescription(e.target.value)}
                    placeholder="Provide details regarding the observed behavior and time..."
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="text-xs">
                  <label className="font-semibold text-slate-700 block mb-1">Corrective / Administrative Action *</label>
                  <input
                    type="text"
                    required
                    value={dispAction}
                    onChange={(e) => setDispAction(e.target.value)}
                    placeholder="e.g. Letter to parent, counseling referral, campus clean-up"
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDiscipline(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
                  >
                    Save Disciplinary Record
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          TAB: LEARNER ONLINE BEHAVIOR & CONTENT FILTRATION
          ======================================================== */}
      {activeTab === 'online_discipline' && (
        <section className="space-y-6">
          {smsSentSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-bounce">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{smsSentSuccess}</span>
            </div>
          )}

          {/* Module Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none">
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0 hidden sm:block">
                <EduSmartGadsaLogo variant="horizontal" size="xs" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Learner Online Discipline & Search Filtration</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Digital Citizenship & Safe Search Audit Ledger
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Automated continuous surveillance of learner-driven curriculum searches. Enforces child protection guardrails, triggers guided educational redirections away from recreational gaming, and flags violations for parental SMS notice.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export Safety Audit</span>
              </button>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Monitored Searches</div>
              <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{searchLogs.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Across Grade 1-9 portals</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Compliant Curriculum Searches</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">
                {searchLogs.filter(s => s.status === 'safe').length}
              </div>
              <div className="text-xs text-emerald-600 mt-0.5">Approved CBC learning materials</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-amber-700">Guided Redirections</div>
              <div className="text-2xl font-extrabold font-mono text-amber-700 mt-1">
                {searchLogs.filter(s => s.status === 'guided_redirection').length}
              </div>
              <div className="text-xs text-amber-600 mt-0.5">Redirected to Kahoot/Quizizz</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-rose-700">Flagged Safety Infractions</div>
              <div className="text-2xl font-extrabold font-mono text-rose-700 mt-1">
                {searchLogs.filter(s => s.status === 'flagged').length}
              </div>
              <div className="text-xs text-rose-600 mt-0.5">Counseling review required</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filter By Status:</span>
              {(['all', 'flagged', 'guided_redirection', 'safe'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setSearchStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    searchStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {st === 'all' ? `All Logs (${searchLogs.length})` :
                   st === 'flagged' ? `Flagged Alerts (${searchLogs.filter(s => s.status === 'flagged').length})` :
                   st === 'guided_redirection' ? `Guided Redirections (${searchLogs.filter(s => s.status === 'guided_redirection').length})` :
                   `Safe Curriculum (${searchLogs.filter(s => s.status === 'safe').length})`}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Live filtration engine: Active
            </div>
          </div>

          {/* Search Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Real-Time Learner Search Audit Ledger
              </div>
              <div className="text-[11px] text-slate-500">
                Sorted by most recent online activity
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Learner & Grade</th>
                    <th className="py-3 px-4">Search Query Entered</th>
                    <th className="py-3 px-4 text-center">Safety Status</th>
                    <th className="py-3 px-4">Filtration Reason / Redirection Action</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Disciplinary Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {searchLogs
                    .filter(log => searchStatusFilter === 'all' || log.status === searchStatusFilter)
                    .map((log) => {
                      const isFlagged = log.status === 'flagged';
                      const isRedirect = log.status === 'guided_redirection';

                      return (
                        <tr key={log.id} className={`hover:bg-slate-50 ${isFlagged ? 'bg-rose-50/40' : ''}`}>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{log.userName}</div>
                            <div className="text-[11px] text-slate-500">
                              Grade {log.grade || 4} · CBC Learner
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 px-2 py-1 bg-slate-100 rounded border border-slate-200">
                              "{log.searchQuery}"
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase ${
                              isFlagged ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              isRedirect ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {isFlagged ? 'Flagged Alert' : isRedirect ? 'Guided Redirection' : 'Safe / Clean'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-700">
                            {isFlagged ? (
                              <span className="text-rose-700 font-semibold">{log.filterReason}</span>
                            ) : isRedirect ? (
                              <span className="text-amber-800 font-medium">{log.filterReason} → {log.educationalTopicFound}</span>
                            ) : (
                              <span className="text-emerald-800">{log.educationalTopicFound || 'Curriculum Inquiry'}</span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isFlagged ? (
                              <button
                                onClick={() => handleSendParentNotice(log)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition-colors"
                                title="Send SMS Notice to Parent"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Send Parent SMS</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">No action required</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Content Filtration Policies & Safe Guardrails */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Globe className="w-4 h-4 text-blue-700" />
              <span>EduSmart LMS Online Safety & Content Whitelist Policy</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              In compliance with Kenya Institute of Curriculum Development (KICD) digital learning standards, the EduSmart search engine operates under active algorithmic filtration. Learner queries containing restricted terms are immediately prevented, logged to the Deputy Head discipline ledger, and can trigger automated SMS notifications to guardians. Queries related to recreational video games (e.g. Roblox, Fortnite) are automatically redirected to gamified learning modules (Kahoot, Quizizz, and interactive CBC mathematics challenges).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <strong className="text-emerald-800 block mb-1">Whitelisted Academic Sources</strong>
                <span className="text-slate-600">KICD EduTV, Kenya National Library, World Book, Google Classroom, Zoom, Meet.</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <strong className="text-amber-800 block mb-1">Gamified Redirections</strong>
                <span className="text-slate-600">Kahoot CBC Quizzes, Quizizz Competency Challenges, Interactive Fraction Games.</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <strong className="text-rose-800 block mb-1">Automated Parent Alerts</strong>
                <span className="text-slate-600">SMS and app-based incident push to parents upon repeated flagged search attempts.</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 3: STAFF DUTY ROSTER (DEPUTY HEAD ASSIGNMENT & EDIT RIGHTS)
          ======================================================== */}
      {activeTab === 'staff_duty' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Staff Weekly Duty Master Roster
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-300">
                  Deputy Head Assignment Rights Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deputy Head operational administration: Edit and assign teachers and senior teachers on weekly duty (TOD), gate surveillance, morning assembly, and dining supervision.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenNewDutyModal}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Assign Weekly Duty Roster</span>
              </button>
              <div className="text-xs font-mono bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200">
                Active Term: Term 3 · 2026 Academic Year
              </div>
            </div>
          </div>

          {dutyFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dutyFeedback}</span>
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Week</th>
                  <th className="py-2.5 px-3">Dates</th>
                  <th className="py-2.5 px-3">Lead / Senior Teacher (Assembly)</th>
                  <th className="py-2.5 px-3">Assistant TOD</th>
                  <th className="py-2.5 px-3">Security & Gate TOD</th>
                  <th className="py-2.5 px-3">Dining & Recess</th>
                  <th className="py-2.5 px-3">Weekly Theme</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Deputy Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dutyRosters.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-900 whitespace-nowrap">Week {d.weekNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{d.startDate} - {d.endDate}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-blue-900">{d.leadTeacher}</div>
                      {d.seniorTeacherName && (
                        <div className="text-[10px] text-indigo-700 font-medium">Senior Teacher Lead</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{d.assistantTeacher}</td>
                    <td className="py-2.5 px-3 text-slate-700">{d.gateDutyTeacher}</td>
                    <td className="py-2.5 px-3 text-slate-700">{d.diningSupervision}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate" title={d.focusTheme || d.notes}>
                      {d.focusTheme || 'General Campus Supervision'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        d.status === 'Current' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditDuty(d)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit Duty Assignment"
                        >
                          <Edit3 className="w-3 h-3 text-slate-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDuty(d.id, d.weekNumber)}
                          className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                          title="Remove Assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DEPUTY HEAD ASSIGNMENT & EDIT MODAL */}
          {showDutyModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {editingDutyId ? `Edit Weekly Duty Assignment (Week ${dutyWeek})` : 'Assign Teachers & Senior Teachers on Weekly Duty'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Deputy Head authority to allocate staff supervision responsibilities.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDutyModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveDuty} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Term Week #</label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        required
                        value={dutyWeek}
                        onChange={(e) => setDutyWeek(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        required
                        value={dutyStartDate}
                        onChange={(e) => setDutyStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">End Date</label>
                      <input
                        type="date"
                        required
                        value={dutyEndDate}
                        onChange={(e) => setDutyEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Duty Teachers Selection */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>Lead Teacher / Senior Teacher (Assembly & Pastoral)</span>
                        <span className="text-[10px] text-blue-700 font-normal">Supervisory Tier</span>
                      </label>
                      <select
                        value={dutyLeadTeacher}
                        onChange={(e) => setDutyLeadTeacher(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      >
                        <optgroup label="⭐ Senior Teachers (Curriculum & Assembly Lead)">
                          {seniorTeachers.map(t => (
                            <option key={t.id} value={t.name}>
                              {t.name} (Senior Teacher - {t.tscNumber || 'TSC'})
                            </option>
                          ))}
                          {seniorTeachers.length === 0 && (
                            <option value="Mr. Peter Ochieng">Mr. Peter Ochieng (Senior Teacher)</option>
                          )}
                        </optgroup>
                        <optgroup label="👨‍🏫 Teaching Staff & HODs">
                          {teachersList.filter(t => t.role !== 'senior_teacher').map(t => (
                            <option key={t.id} value={t.name}>
                              {t.name} ({t.role === 'hod' ? 'HOD' : t.role === 'class_teacher' ? 'Class Teacher' : 'Teacher'})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Assistant TOD</label>
                        <select
                          value={dutyAssistantTeacher}
                          onChange={(e) => setDutyAssistantTeacher(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                        >
                          {teachersList.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Security & Gate TOD</label>
                        <select
                          value={dutyGateTeacher}
                          onChange={(e) => setDutyGateTeacher(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                        >
                          {teachersList.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Dining & Recess TOD</label>
                        <select
                          value={dutyDiningSupervisor}
                          onChange={(e) => setDutyDiningSupervisor(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                        >
                          {teachersList.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Weekly Theme / Focus</label>
                      <input
                        type="text"
                        placeholder="e.g. Punctuality, Smart Attire & Assembly Decorum"
                        value={dutyFocusTheme}
                        onChange={(e) => setDutyFocusTheme(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Duty Status</label>
                      <select
                        value={dutyStatus}
                        onChange={(e) => setDutyStatus(e.target.value as StaffDutyAssignment['status'])}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                      >
                        <option value="Current">Current Active Week</option>
                        <option value="Upcoming">Upcoming Scheduled Week</option>
                        <option value="Completed">Completed Archive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Operational Directives & Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Special instructions for gate opening, parade inspection, or dining crowd control..."
                      value={dutyNotes}
                      onChange={(e) => setDutyNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-hidden text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowDutyModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-md shadow-slate-900/20 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      <span>{editingDutyId ? 'Save Duty Changes' : 'Confirm & Assign Duty Roster'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          TAB: MASTER TIMETABLE & BELL SCHEDULE
          ======================================================== */}
      {activeTab === 'timetable' && (
        <TimetablePortal 
          currentUser={currentUser} 
        />
      )}

      {/* ========================================================
          TAB 4: STAFF WORK ENTRY AUDIT (STRICTLY READ-ONLY)
          ======================================================== */}
      {activeTab === 'work_ledger' && (
        <WorkEntryAuditViewer 
          currentUser={currentUser} 
          title="Deputy Head Work Entry Sign-In Register"
          subtitle="Operational and instructional duty oversight: Real-time clock-in logs, GPS stamps, staff credentials, and verified biometric photos. Strictly non-editable."
        />
      )}

      {/* ========================================================
          TAB 5: SANATORIUM & STUDENT HEALTH OVERSIGHT
          ======================================================== */}
      {activeTab === 'sanatorium' && (
        <SanatoriumSection
          currentUser={currentUser}
          canRecord={false}
          title="Deputy Head Sanatorium & Student Health Oversight"
          subtitle="Campus healthcare surveillance, observation bay logs, nurse in-charge notes, hospital referrals, and emergency gate pass coordination. (Read-Only Audit Mode)"
        />
      )}

      {/* ========================================================
          TAB: LEARNER LUNCH REGISTER & DINING SURVEILLANCE
          ======================================================== */}
      {activeTab === 'lunch_register' && (
        <LearnerLunchRegister
          currentUser={currentUser}
          viewMode="executive"
          title="Deputy Head Learner Lunch & Dining Surveillance"
          subtitle="Operational dining oversight: Real-time learner meal uptake, special dietary tracking, and class teacher attendance registers across all grades and streams."
        />
      )}

      {/* ========================================================
          TAB: SCHOOL TRANSPORT & FLEET SURVEILLANCE
          ======================================================== */}
      {activeTab === 'transport' && (
        <TransportWorkspace currentUser={currentUser} isEmbedded={true} readOnly={true} />
      )}

      {/* ========================================================
          TAB: CO-CURRICULAR & SPORTS SURVEILLANCE
          ======================================================== */}
      {activeTab === 'cocurricular' && (
        <CoCurricularWorkspace currentUser={currentUser} isEmbedded={true} readOnly={true} />
      )}

      {/* ========================================================
          TAB 6: REPORTING HUB (AGGREGATED & INDIVIDUAL DOSSIERS)
          ======================================================== */}
      {activeTab === 'reporting_hub' && (
        <ReportingHub currentUser={currentUser} />
      )}

      {/* ========================================================
          TAB 7: SCHOOL EVENTS & EVENT TICKETING HUB
          (Deputy Head has official posting & logistics rights)
          ======================================================== */}
      {activeTab === 'events' && (
        <SchoolEventsManager currentUser={currentUser} />
      )}
        </main>
      </div>
    </div>
  );
};
