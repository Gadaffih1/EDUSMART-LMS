import React, { useState } from 'react';
import { 
  User, 
  GradeLevel, 
  SubjectName, 
  getSubjectsForGrade, 
  ReportCard,
  QuizAttempt,
  PRIMARY_SUBJECTS,
  JUNIOR_SUBJECTS
} from '../../types';
import { Storage } from '../../utils/storage';
import { ReportingHub } from '../reports/ReportingHub';
import { ExecutiveAnalyticsDashboard } from '../analytics/ExecutiveAnalyticsDashboard';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { WorkEntryAuditViewer } from '../common/WorkEntryAuditViewer';
import { SanatoriumSection } from '../sanatorium/SanatoriumSection';
import { TransportWorkspace } from '../transport/TransportWorkspace';
import { CoCurricularWorkspace } from '../cocurricular/CoCurricularWorkspace';
import { TimetablePortal } from '../timetable/TimetablePortal';
import { FacultyAllocationManager } from '../timetable/FacultyAllocationManager';
import { FixedLessonsManager } from '../timetable/FixedLessonsManager';
import { TimetableAutoGeneratorModal } from '../timetable/TimetableAutoGeneratorModal';
import { LearnerLunchRegister } from '../meals/LearnerLunchRegister';
import { SchoolEventsManager } from '../events/SchoolEventsManager';
import { ResultUploadManager } from './ResultUploadManager';
import { 
  BookOpen, 
  BarChart3, 
  Calendar, 
  CalendarDays,
  FileText, 
  Award, 
  CheckCircle, 
  Clock, 
  Filter, 
  Printer, 
  TrendingUp, 
  Search,
  Check,
  School,
  Layers,
  FileCheck,
  Sparkles,
  FileSpreadsheet,
  HeartPulse,
  Bus,
  Trophy,
  Users,
  Lock,
  Utensils,
  Menu,
  X,
  Upload,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Save,
  Send,
  CheckCircle2,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DeanOfStudiesWorkspaceProps {
  currentUser: User;
}

interface ExamScheduleItem {
  id: string;
  name: string;
  term: 1 | 2 | 3;
  startDate: string;
  endDate: string;
  gradesTargeted: string;
  type: 'Continuous Assessment' | 'Mid-Term Evaluation' | 'End-Term Summative' | 'KPSEA / KCSE National Mock';
  status: 'Draft' | 'Scheduled' | 'Completed';
}

export const DeanOfStudiesWorkspace: React.FC<DeanOfStudiesWorkspaceProps> = ({ currentUser }) => {
  type DeanTab = 
    | 'results_upload'
    | 'assessments' 
    | 'analytics' 
    | 'report_cards' 
    | 'curriculum' 
    | 'timetable' 
    | 'faculty_allocations' 
    | 'fixed_lessons' 
    | 'work_entries' 
    | 'sanatorium' 
    | 'lunch_register'
    | 'transport' 
    | 'cocurricular' 
    | 'reporting_hub'
    | 'events';

  const [activeTab, setActiveTab] = useState<DeanTab>('analytics');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [analyticsSubView, setAnalyticsSubView] = useState<'school_health' | 'exam_means'>('school_health');
  const [showAutoGenModal, setShowAutoGenModal] = useState(false);
  const [timetablePerspective, setTimetablePerspective] = useState<'grid' | 'today' | 'teacher' | 'rooms' | 'exams' | 'relief'>('grid');
  const workLogs = Storage.getWorkEntryLogs();

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(4);

  // Exam Schedules
  const [examSchedules, setExamSchedules] = useState<ExamScheduleItem[]>([
    {
      id: 'ex-1',
      name: 'Term 3 Mid-Term Evaluative Assessments',
      term: 3,
      startDate: '2026-10-12',
      endDate: '2026-10-16',
      gradesTargeted: 'Grades 1 to 9 (All Streams)',
      type: 'Mid-Term Evaluation',
      status: 'Scheduled'
    },
    {
      id: 'ex-2',
      name: 'Grade 6 KPSEA National Simulation Exam',
      term: 3,
      startDate: '2026-10-19',
      endDate: '2026-10-23',
      gradesTargeted: 'Grade 6 (All 8 Streams)',
      type: 'KPSEA / KCSE National Mock',
      status: 'Scheduled'
    },
    {
      id: 'ex-3',
      name: 'Junior School Grade 9 Pre-Senior Comprehensive',
      term: 3,
      startDate: '2026-10-26',
      endDate: '2026-10-30',
      gradesTargeted: 'Grade 9 (All 7 Streams)',
      type: 'End-Term Summative',
      status: 'Scheduled'
    },
    {
      id: 'ex-4',
      name: 'Term 3 Opener Baseline Tests',
      term: 3,
      startDate: '2026-09-02',
      endDate: '2026-09-04',
      gradesTargeted: 'Grades 1 to 9',
      type: 'Continuous Assessment',
      status: 'Completed'
    }
  ]);

  // Report cards and Dean Republishing states
  const [reportCards, setReportCards] = useState<ReportCard[]>(() => Storage.getReportCards());
  const [editingReportCard, setEditingReportCard] = useState<ReportCard | null>(null);
  const [editClassRemarks, setEditClassRemarks] = useState('');
  const [editDeanRemarks, setEditDeanRemarks] = useState('');
  const [editHeadRemarks, setEditHeadRemarks] = useState('');
  const [editSubjectRemarks, setEditSubjectRemarks] = useState<{ subject: SubjectName; remarks: string }[]>([]);
  const [deanRepublishToast, setDeanRepublishToast] = useState<string | null>(null);

  React.useEffect(() => {
    const handleReportUpdate = () => {
      setReportCards(Storage.getReportCards());
    };
    window.addEventListener('report-cards-updated', handleReportUpdate);
    return () => window.removeEventListener('report-cards-updated', handleReportUpdate);
  }, []);

  const showDeanToast = (msg: string) => {
    setDeanRepublishToast(msg);
    setTimeout(() => setDeanRepublishToast(null), 4000);
  };

  const handleOpenEditReport = (rc: ReportCard) => {
    setEditingReportCard(rc);
    setEditClassRemarks(rc.classTeacherRemarks || '');
    setEditDeanRemarks(rc.deanRemarks || 'Verified and officially authorized by Dean of Studies for curriculum competence.');
    setEditHeadRemarks(rc.headTeacherRemarks || '');
    setEditSubjectRemarks(rc.subjects.map(s => ({ subject: s.subject, remarks: s.remarks || '' })));
  };

  const handleSaveAndRepublish = (e: React.FormEvent) => {
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
        deanRemarks: editDeanRemarks.trim(),
        headTeacherRemarks: editHeadRemarks.trim(),
        subjects: updatedSubjects
      },
      currentUser.name,
      'Dean of Studies',
      'Curriculum review complete. All subject marks and qualitative write-ups moderated and officially republished.'
    );

    if (republished) {
      setReportCards(Storage.getReportCards());
      showDeanToast(`Report Card for ${editingReportCard.studentName} successfully republished with Dean of Studies official seal!`);
      setEditingReportCard(null);
    }
  };

  const handleQuickRepublishSingle = (rc: ReportCard) => {
    const republished = Storage.republishReportCard(
      rc.id,
      {
        deanRemarks: rc.deanRemarks || 'Approved and officially republished by Dean of Studies.'
      },
      currentUser.name,
      'Dean of Studies',
      'Endorsed and republished following termly academic moderation.'
    );
    if (republished) {
      setReportCards(Storage.getReportCards());
      showDeanToast(`Report Card for ${rc.studentName} republished with official Dean seal!`);
    }
  };

  const handleBatchRepublishGrade = () => {
    gradeReportCards.forEach(rc => {
      Storage.republishReportCard(
        rc.id,
        {
          deanRemarks: rc.deanRemarks || 'Cohort academic standards verified and republished by Dean of Studies.'
        },
        currentUser.name,
        'Dean of Studies',
        `Batch cohort authorization for Grade ${selectedGrade}.`
      );
    });
    setReportCards(Storage.getReportCards());
    showDeanToast(`All Grade ${selectedGrade} report cards successfully republished with Dean of Studies seal!`);
  };

  const allUsers = Storage.getUsers();
  const students = allUsers.filter(u => u.role === 'student');
  const gradeStudents = students.filter(s => s.grade === selectedGrade);

  // Report cards for selected grade
  const gradeReportCards: ReportCard[] = gradeStudents.map(student => {
    const existing = reportCards.find(r => r.studentId === student.id);
    if (existing) return existing;

    // Fallback dynamic card
    const subjects = getSubjectsForGrade(student.grade || 4);
    return {
      id: `rc-${student.id}-t3`,
      studentId: student.id,
      studentName: student.name,
      admissionNumber: student.admissionNumber || `ADM/2026/0${student.grade || 4}12`,
      grade: student.grade || 4,
      stream: student.stream || 'Dove',
      term: 'Term 3' as const,
      academicYear: 2026,
      subjects: subjects.map(sub => ({
        subject: sub,
        openerScore: 78,
        midTermScore: 82,
        endTermScore: 80,
        total: 80,
        gradeLetter: 'B' as const,
        rubricLevel: 'Meeting Expectations' as const,
        remarks: 'Consistent conceptual grasp and active class contribution.',
        teacherName: 'Academic Dept Staff'
      })),
      overallAverage: 80,
      overallRubric: 'Meeting Expectations' as const,
      streamPosition: 3,
      totalStudentsInStream: 40,
      attendanceDays: 48,
      totalSchoolDays: 50,
      nextTermBegins: '2027-01-05',
      classTeacherRemarks: 'A courteous and focused learner who demonstrates exceptional promise.',
      headTeacherRemarks: 'Approved for exemplary academic progression.'
    };
  });

  // Analytics data for chart
  const gradePerformanceData = [
    { grade: 'Grade 1', mean: 84, target: 80 },
    { grade: 'Grade 2', mean: 82, target: 80 },
    { grade: 'Grade 3', mean: 79, target: 80 },
    { grade: 'Grade 4', mean: 81, target: 80 },
    { grade: 'Grade 5', mean: 77, target: 80 },
    { grade: 'Grade 6', mean: 86, target: 82 },
    { grade: 'Grade 7', mean: 74, target: 75 },
    { grade: 'Grade 8', mean: 78, target: 78 },
    { grade: 'Grade 9', mean: 80, target: 80 },
  ];

  const masteryPieData = [
    { name: 'Exceeding Expectations (EE)', value: 42, color: '#10b981' },
    { name: 'Meeting Expectations (ME)', value: 38, color: '#3b82f6' },
    { name: 'Approaching Expectations (AE)', value: 16, color: '#f59e0b' },
    { name: 'Below Expectations (BE)', value: 4, color: '#ef4444' },
  ];

  const sidebarGroups = [
    {
      title: 'EXECUTIVE & GOVERNANCE',
      items: [
        { id: 'analytics' as DeanTab, label: 'Executive Health, Attendance & Academic Analytics', icon: TrendingUp },
      ]
    },
    {
      title: 'OVERVIEW & CBC ASSESSMENTS',
      items: [
        { id: 'results_upload' as DeanTab, label: 'CBC Assessment Results Hub', icon: Upload, badge: 'Upload & Publish', badgeColor: 'bg-emerald-500' },
        { id: 'assessments' as DeanTab, label: 'Assessment Schedules & Rosters', icon: Calendar },
        { id: 'report_cards' as DeanTab, label: 'Term Report Card Authorization', icon: FileText, badge: `${gradeStudents.length}` },
        { id: 'curriculum' as DeanTab, label: 'Curriculum Strands & KPSEA Pacing', icon: BookOpen },
      ]
    },
    {
      title: 'TIMETABLE & ACADEMIC DEPT',
      items: [
        { id: 'timetable' as DeanTab, label: 'Master School Timetable', icon: CalendarDays },
        { id: 'faculty_allocations' as DeanTab, label: 'Academic Dept Allocations', icon: Users },
        { id: 'fixed_lessons' as DeanTab, label: 'Fixed Lesson Parameters', icon: Lock },
        { id: 'work_entries' as DeanTab, label: 'Teacher Work Entry Sign-Ins', icon: FileCheck, badge: `${workLogs.length}` },
      ]
    },
    {
      title: 'OPERATIONS & STUDENT WELFARE',
      items: [
        { id: 'sanatorium' as DeanTab, label: 'Sanatorium & Health Logs', icon: HeartPulse },
        { id: 'lunch_register' as DeanTab, label: 'Learner Lunch Register', icon: Utensils },
        { id: 'transport' as DeanTab, label: 'School Transport Fleet', icon: Bus },
        { id: 'cocurricular' as DeanTab, label: 'Co-Curricular Directorate', icon: Trophy },
        { id: 'reporting_hub' as DeanTab, label: 'Comprehensive Reporting Hub', icon: FileSpreadsheet },
        { id: 'events' as DeanTab, label: 'School Events & Calendar', icon: CalendarDays, badge: 'Post', badgeColor: 'bg-indigo-500' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
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
              <span>Dean of Studies Workspace</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Academic Directorate
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              CBC Examination Schedules, Whole Grade Results Upload & Academic Quality Assurance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Result Upload Action Button */}
          <button
            onClick={() => setActiveTab('results_upload')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Grade Results</span>
            <span className="sm:hidden">Upload</span>
          </button>

          <div className="text-right text-xs hidden md:block">
            <div className="font-bold text-white">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{currentUser.tscNumber || 'TSC/38910/ED'}</div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout with Sidebar Buttons on the Left */}
      <div className="flex-1 flex w-full">
        
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Left Sidebar */}
        <aside className={`
          fixed lg:static top-14 bottom-0 left-0 z-40
          w-64 bg-slate-900 border-r border-slate-800 text-slate-300
          flex flex-col shrink-0 transition-transform duration-200 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Sidebar Portal Title */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <div>
                <div className="text-xs font-black text-white uppercase tracking-wider">ACADEMIC PORTAL</div>
                <div className="text-[10px] text-slate-400 font-mono">Dean of Studies Hub</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              v3.2
            </span>
          </div>

          {/* Scrollable Navigation Tree with Buttons on the Left */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar text-xs">
            {sidebarGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all text-left cursor-pointer
                          ${isActive 
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black text-white ${item.badgeColor || 'bg-slate-700'}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Footer Stamp */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Academic Directorate</span>
            <span className="text-emerald-400 font-bold">● Online</span>
          </div>
        </aside>

        {/* Content View Area on the Right */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
          
          {/* Top KPI Cards (Visible in Dean Overview when not on Executive Analytics) */}
          {activeTab !== 'analytics' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-slate-500">Upcoming Assessments</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">3</div>
                <div className="text-xs text-slate-500 mt-0.5">Term 3 Assessment Windows</div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-slate-500">School-Wide Mastery Rate</div>
                <div className="text-2xl font-extrabold font-mono text-blue-700 mt-1">80.0%</div>
                <div className="text-xs text-slate-500 mt-0.5">Meeting or Exceeding (EE + ME)</div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-slate-500">Report Cards Pending Approval</div>
                <div className="text-2xl font-extrabold font-mono text-amber-600 mt-1">{gradeStudents.length}</div>
                <div className="text-xs text-slate-500 mt-0.5">Grade {selectedGrade} cohort</div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-slate-500">Syllabus Completion Index</div>
                <div className="text-2xl font-extrabold font-mono text-purple-700 mt-1">92.4%</div>
                <div className="text-xs text-slate-500 mt-0.5">Tracking ahead of schedule</div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 0: EXECUTIVE HEALTH, ATTENDANCE & ACADEMIC ANALYTICS
              (Executive Health & Intelligence Console - Landing Data)
              ======================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Sub-view switcher */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200 w-fit">
                <button
                  onClick={() => setAnalyticsSubView('school_health')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    analyticsSubView === 'school_health'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Executive Health & Intelligence Console</span>
                </button>
                <button
                  onClick={() => setAnalyticsSubView('exam_means')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    analyticsSubView === 'exam_means'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Curriculum Exam Performance & Mastery Bands</span>
                </button>
              </div>

              {analyticsSubView === 'school_health' ? (
                <ExecutiveAnalyticsDashboard
                  currentUser={currentUser}
                  title="Executive Health, Attendance & Academic Analytics"
                  subtitle="Executive Health & Intelligence Console: Real-time Recharts surveillance of campus attendance rates, longitudinal CBC mastery, library foot-traffic, sanatorium clinic logs, and student wellbeing indicators."
                />
              ) : (
                <section className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Mean Performance Index Across Grades (Term 3)
                          </h3>
                          <p className="text-xs text-slate-500">Actual performance mean vs institutional target benchmark (80%)</p>
                        </div>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={gradePerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip 
                              formatter={(val: any) => [`${val}%`, 'Mean Score']} 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                            />
                            <Bar dataKey="mean" fill="#059669" radius={[6, 6, 0, 0]} name="Actual Mean %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          CBC Mastery Distribution
                        </h3>
                        <p className="text-xs text-slate-500">Overall cohort rating breakdown</p>
                      </div>

                      <div className="h-48 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={masteryPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {masteryPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(val: any) => [`${val}%`, 'Learners']}
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        {masteryPieData.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            <span className="text-slate-600 truncate">{d.name.split(' ')[0]}</span>
                            <span className="font-bold text-slate-900 ml-auto">{d.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 0: CBC ASSESSMENT RESULTS & WHOLE GRADE UPLOAD HUB
              ======================================================== */}
          {activeTab === 'results_upload' && (
            <ResultUploadManager
              currentUser={currentUser}
              viewMode="dean"
              defaultGrade={selectedGrade}
            />
          )}

      {/* ========================================================
          TAB 1: ASSESSMENT CALENDAR & SCHEDULES
          ======================================================== */}
      {activeTab === 'assessments' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 print:m-0 print:border-none print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                <EduSmartGadsaLogo variant="horizontal" size="xs" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  School-Wide Assessment Timetable & Examination Roster
                </h2>
                <p className="text-xs text-slate-500">
                  Formal scheduling of continuous assessment tests (CATs), termly summative evaluations, and national benchmark simulations.
                </p>
              </div>
            </div>
            <button 
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Timetable</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Assessment Title</th>
                  <th className="py-2.5 px-3">Term</th>
                  <th className="py-2.5 px-3">Evaluation Dates</th>
                  <th className="py-2.5 px-3">Target Cohort</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {examSchedules.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{ex.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">Term {ex.term}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{ex.startDate} to {ex.endDate}</td>
                    <td className="py-2.5 px-3 text-slate-700">{ex.gradesTargeted}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-emerald-800">{ex.type}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        ex.status === 'Completed' ? 'bg-slate-200 text-slate-600' :
                        ex.status === 'Scheduled' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ex.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 3: REPORT CARDS AUTHORIZATION & REPUBLISHING
          ======================================================== */}
      {activeTab === 'report_cards' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 uppercase tracking-wider mb-1">
                <FileCheck className="w-4 h-4 text-cyan-600" />
                <span>Executive Academic Moderation</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Term Report Card Verification, Write-ups Moderation & Republishing
              </h2>
              <p className="text-xs text-slate-500">
                Dean of Studies has full authoritative rights to review, edit comment write-ups, adjust remarks, and officially republish reports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
                <span className="text-slate-500">Cohort:</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
                  className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  {[1,2,3,4,5,6,7,8,9].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleBatchRepublishGrade}
                className="px-3.5 py-1.5 text-xs font-bold bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Authoritatively republish all approved report cards for this cohort"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Republish All Grade {selectedGrade} Reports</span>
              </button>
            </div>
          </div>

          {deanRepublishToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{deanRepublishToast}</span>
              </div>
              <button onClick={() => setDeanRepublishToast(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gradeReportCards.map((rc) => {
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
                          {rc.admissionNumber} · Grade {rc.grade} ({rc.stream}) · {rc.term} ({rc.academicYear})
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-extrabold font-mono text-emerald-700">{rc.overallAverage}%</span>
                        <div className="text-[10px] text-slate-400 font-mono">{rc.overallRubric}</div>
                      </div>
                    </div>

                    {/* Class Teacher Remarks */}
                    <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="text-slate-500 font-semibold text-[10px] uppercase">Class Teacher Remarks:</div>
                      <p className="text-slate-700 italic text-[11px] leading-relaxed">"{rc.classTeacherRemarks}"</p>
                    </div>

                    {/* Dean of Studies Remarks */}
                    {rc.deanRemarks && (
                      <div className="text-xs bg-cyan-50/70 p-2.5 rounded-lg border border-cyan-200 space-y-1">
                        <div className="text-cyan-900 font-semibold text-[10px] uppercase flex items-center gap-1">
                          <Award className="w-3 h-3 text-cyan-700" />
                          <span>Dean of Studies Endorsement:</span>
                        </div>
                        <p className="text-cyan-950 font-medium text-[11px] leading-relaxed">"{rc.deanRemarks}"</p>
                        {rc.republishedAt && (
                          <div className="text-[9px] text-cyan-700 font-mono">
                            Republished by {rc.republishedBy || 'Dean'} on {new Date(rc.republishedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between text-xs pt-3 border-t border-slate-200 gap-2">
                    <span className="text-slate-500 font-mono text-[11px]">
                      Attendance: {rc.attendanceDays}/{rc.totalSchoolDays} days
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditReport(rc)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white text-slate-700 hover:text-cyan-800 border border-slate-300 hover:border-cyan-400 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit teacher remarks, subject write-ups, or Dean remarks"
                      >
                        <Edit2 className="w-3 h-3 text-cyan-600" />
                        <span>Edit Remarks</span>
                      </button>

                      <button
                        onClick={() => handleQuickRepublishSingle(rc)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          isRepublished 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-cyan-700 hover:bg-cyan-800 text-white shadow-2xs'
                        }`}
                        title="Republish this student's official report card dossier"
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

      {/* ========================================================
          MODAL: DEAN OF STUDIES EDIT REMARKS & REPUBLISH
          ======================================================== */}
      {editingReportCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-700 text-white flex items-center justify-center font-bold shadow-xs">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Edit Write-Ups & Republish Report
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

            {/* Edit Form */}
            <form onSubmit={handleSaveAndRepublish} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-950">
                <strong>Dean Rights Active:</strong> You have full authority to modify any class teacher remark, subject feedback commentary, or institutional endorsement, and officially republish to student & parent portals.
              </div>

              {/* Class Teacher Remarks */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase">
                  Class Teacher General Remarks
                </label>
                <textarea
                  rows={3}
                  value={editClassRemarks}
                  onChange={(e) => setEditClassRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-medium"
                  placeholder="Enter or edit general conduct and academic remarks..."
                />
              </div>

              {/* Dean Remarks */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Dean of Studies Official Endorsement</span>
                </label>
                <textarea
                  rows={2}
                  value={editDeanRemarks}
                  onChange={(e) => setEditDeanRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-cyan-300 bg-cyan-50/30 rounded-lg focus:ring-2 focus:ring-cyan-500 font-medium"
                  placeholder="Official Dean academic summary..."
                />
              </div>

              {/* Head Teacher Remarks */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase">
                  Head Teacher / Executive Remarks
                </label>
                <input
                  type="text"
                  value={editHeadRemarks}
                  onChange={(e) => setEditHeadRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 font-medium"
                  placeholder="Executive approval remarks..."
                />
              </div>

              {/* Subject-Specific Remarks */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-900 uppercase">
                  Subject Qualitative Remarks & Moderation
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
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
                        placeholder={`Subject remarks for ${sub.subject}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
          TAB 4: CURRICULUM STRANDS & KPSEA PACING
          ======================================================== */}
      {activeTab === 'curriculum' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Curriculum Pacing & KNEC Assessment Standards
            </h2>
            <p className="text-xs text-slate-500">
              Alignment of learning strand objectives with Kenya National Examinations Council (KNEC) and KICD requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <div className="text-xs font-bold text-emerald-900 uppercase">Primary School (Grades 1-6)</div>
              <div className="text-sm font-bold text-emerald-950">Foundational & Middle School</div>
              <p className="text-xs text-emerald-800">
                8 Learning Areas including Integrated Science, Creative Arts, Agriculture & Nutrition. KPSEA summative assessment administered at Grade 6.
              </p>
              <div className="text-xs font-mono font-bold text-emerald-700 pt-1">94% Core Competencies Covered</div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
              <div className="text-xs font-bold text-blue-900 uppercase">Junior School (Grades 7-9)</div>
              <div className="text-sm font-bold text-blue-950">Exploratory & Pre-Technical</div>
              <p className="text-xs text-blue-800">
                9 Learning Areas featuring Pre-Technical Education, Integrated Science, Social Studies, and Foreign/Indigenous Languages.
              </p>
              <div className="text-xs font-mono font-bold text-blue-700 pt-1">91% Core Competencies Covered</div>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
              <div className="text-xs font-bold text-purple-900 uppercase">Assessment Rubric</div>
              <div className="text-sm font-bold text-purple-950">4-Tier CBC Level Rating</div>
              <p className="text-xs text-purple-800">
                Standardized grading: Exceeding Expectations [80-100%], Meeting Expectations [65-79%], Approaching Expectations [50-64%], Below Expectations [0-49%].
              </p>
              <div className="text-xs font-mono font-bold text-purple-700 pt-1">Standardized Across All Subjects</div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB: MASTER TIMETABLE & BELL SCHEDULE
          ======================================================== */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          {/* Quick Timetable Operations Hub */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autonomous Timetable Architecture</span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Master Timetable & Autonomous Generator
              </h3>
              <p className="text-xs text-slate-500">
                Generate and synchronize conflict-free learning schedules once teacher subject and stream allocations are set.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('faculty_allocations')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Teacher Allocations</span>
              </button>

              <button
                onClick={() => setActiveTab('fixed_lessons')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Fixed Lessons</span>
              </button>

              <button
                onClick={() => setTimetablePerspective('relief')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  timetablePerspective === 'relief'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                }`}
                title="Dean of Studies: Book teachers when colleagues are absent"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Book Relief Teachers</span>
                {Storage.getTeacherAbsenceReports().length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                    {Storage.getTeacherAbsenceReports().length} Absent
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowAutoGenModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Generate Master Timetable</span>
              </button>
            </div>
          </div>

          <TimetablePortal 
            currentUser={currentUser} 
            initialGrade={selectedGrade} 
            initialPerspective={timetablePerspective}
          />
        </div>
      )}

      {/* ========================================================
          TAB: FACULTY SUBJECT & STREAM ALLOCATIONS (DEAN EDITABLE)
          ======================================================== */}
      {activeTab === 'faculty_allocations' && (
        <FacultyAllocationManager
          currentUser={currentUser}
          onTriggerAutoGeneration={() => setShowAutoGenModal(true)}
        />
      )}

      {/* ========================================================
          TAB: FIXED LESSONS & PRE-PUBLICATION CONDITIONS
          ======================================================== */}
      {activeTab === 'fixed_lessons' && (
        <FixedLessonsManager
          onTriggerAutoGeneration={() => setShowAutoGenModal(true)}
        />
      )}

      {/* ========================================================
          TAB 5: FACULTY WORK ENTRY SIGN-IN AUDIT (READ-ONLY)
          ======================================================== */}
      {activeTab === 'work_entries' && (
        <WorkEntryAuditViewer 
          currentUser={currentUser} 
          title="Dean of Studies Work Entry Sign-In Register"
          subtitle="Curriculum pacing and instructional delivery verification: Official sign-in logs, GPS stamps, and biometric photo ID stamps. Strictly non-editable."
        />
      )}

      {/* ========================================================
          TAB: SANATORIUM & MEDICAL LOGS (READ-ONLY FOR DEAN)
          ======================================================== */}
      {activeTab === 'sanatorium' && (
        <SanatoriumSection
          currentUser={currentUser}
          canRecord={false}
          title="Dean of Studies Sanatorium & Medical Logs"
          subtitle="Monitor learner clinical attendances, assessment exemptions, exam medical leaves, and doctor recommendations. (Read-Only Audit Mode)"
        />
      )}

      {/* ========================================================
          TAB: LEARNER LUNCH REGISTER & DINING SURVEILLANCE
          ======================================================== */}
      {activeTab === 'lunch_register' && (
        <LearnerLunchRegister
          currentUser={currentUser}
          viewMode="executive"
          title="Dean of Studies Learner Lunch & Dining Surveillance"
          subtitle="Academic leadership dining oversight: Monitor daily student meal participation, verify class teacher lunch markings, and inspect special diet accommodation."
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
          TAB 6: REPORTING HUB (MONTHLY, TERMLY, ANNUAL PDF)
          ======================================================== */}
      {activeTab === 'reporting_hub' && (
        <ReportingHub currentUser={currentUser} />
      )}

      {/* ========================================================
          TAB 7: SCHOOL EVENTS & EVENT TICKETING HUB
          (Dean of Studies has official posting rights)
          ======================================================== */}
      {activeTab === 'events' && (
        <SchoolEventsManager currentUser={currentUser} />
      )}

        </main>
      </div>

      {/* Auto-Generator Modal */}
      <TimetableAutoGeneratorModal
        currentUser={currentUser}
        isOpen={showAutoGenModal}
        onClose={() => setShowAutoGenModal(false)}
        onTimetablePublished={() => {
          setActiveTab('timetable');
        }}
      />
    </div>
  );
};
