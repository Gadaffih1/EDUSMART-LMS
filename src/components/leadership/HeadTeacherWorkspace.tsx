import React, { useState } from 'react';
import { 
  User, 
  Announcement, 
  GradeLevel, 
  GateExitPass, 
  WorkEntryLog 
} from '../../types';
import { Storage } from '../../utils/storage';
import { ReportingHub } from '../reports/ReportingHub';
import { SchoolEventsManager } from '../events/SchoolEventsManager';
import { ExecutiveAnalyticsDashboard } from '../analytics/ExecutiveAnalyticsDashboard';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { WorkEntryAuditViewer } from '../common/WorkEntryAuditViewer';
import { TransportWorkspace } from '../transport/TransportWorkspace';
import { CoCurricularWorkspace } from '../cocurricular/CoCurricularWorkspace';
import { TimetablePortal } from '../timetable/TimetablePortal';
import { LearnerLunchRegister } from '../meals/LearnerLunchRegister';
import { WorkspaceSidebar, WorkspaceSidebarGroup } from '../layout/WorkspaceSidebar';
import { StaffAppraisalModule } from '../supervision/StaffAppraisalModule';
import { 
  School, 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  TrendingUp, 
  BarChart3, 
  Bell, 
  Send, 
  FileText, 
  CheckCircle, 
  Clock, 
  Building2, 
  Award,
  BookOpen,
  Printer,
  FileSpreadsheet,
  Bus,
  Trophy,
  CalendarDays,
  Utensils,
  Menu,
  UserCheck,
  ShieldAlert
} from 'lucide-react';

interface HeadTeacherWorkspaceProps {
  currentUser: User;
}

export const HeadTeacherWorkspace: React.FC<HeadTeacherWorkspaceProps> = ({ currentUser }) => {
  type HeadTab = 'analytics' | 'executive' | 'announcements' | 'staff_governance' | 'staff_appraisal' | 'timetable' | 'work_entry_audit' | 'lunch_register' | 'transport' | 'cocurricular' | 'bom_report' | 'reporting_hub' | 'events';
  const [activeTab, setActiveTab] = useState<HeadTab>('analytics');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const allUsers = Storage.getUsers();
  const students = allUsers.filter(u => u.role === 'student');
  const teachers = allUsers.filter(u => ['teacher', 'class_teacher', 'hod', 'senior_teacher', 'deputy_head', 'dean_of_studies', 'librarian'].includes(u.role));
  const parents = allUsers.filter(u => u.role === 'parent');
  const workLogs = Storage.getWorkEntryLogs();
  const gatePasses = Storage.getGatePasses();
  const [timetablePerspective, setTimetablePerspective] = useState<'grid' | 'today' | 'teacher' | 'rooms' | 'exams' | 'relief'>('grid');

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => Storage.getAnnouncements());
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnTarget, setNewAnnTarget] = useState<'all' | 'students' | 'teachers' | 'parents'>('all');
  const [annSuccess, setAnnSuccess] = useState(false);

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle.trim(),
      content: newAnnContent.trim(),
      type: 'general',
      author: `${currentUser.name} (Head Teacher)`,
      authorRole: 'Head Teacher',
      createdAt: new Date().toISOString()
    };

    Storage.addAnnouncement(newAnn);

    // Also broadcast into the centralized notification system
    Storage.addNotification({
      id: `notif-${Date.now()}`,
      title: `Executive Directive: ${newAnnTitle.trim()}`,
      message: newAnnContent.trim(),
      category: 'announcement',
      targetRole: 'all',
      urgency: 'high',
      createdAt: new Date().toISOString(),
      readByUserIds: []
    });

    setAnnouncements(Storage.getAnnouncements());
    setAnnSuccess(true);
    setNewAnnTitle('');
    setNewAnnContent('');
    setTimeout(() => setAnnSuccess(false), 3000);
  };

  const sidebarGroups: WorkspaceSidebarGroup<HeadTab>[] = [
    {
      title: 'EXECUTIVE & GOVERNANCE',
      items: [
        { id: 'analytics', label: 'Executive Health, Attendance & Academic Analytics', icon: TrendingUp },
        { id: 'executive', label: 'Executive Overview', icon: BarChart3 },
        { id: 'announcements', label: 'Directives & Notices', icon: Bell, badge: announcements.length },
        { id: 'bom_report', label: 'BoM Governance Report', icon: Building2 }
      ]
    },
    {
      title: 'ACADEMIC DEPARTMENT & STAFF',
      items: [
        { id: 'staff_governance', label: 'Academic Dept Allocations', icon: Users, badge: `${teachers.length}` },
        { id: 'staff_appraisal', label: 'Teacher Appraisal (TSC TPAD)', icon: Award, badge: 'TPAD' },
        { id: 'timetable', label: 'Master School Timetable', icon: CalendarDays },
        { id: 'work_entry_audit', label: 'Staff Work Entry Sign-Ins', icon: FileText, badge: `${workLogs.length}` },
        { id: 'reporting_hub', label: 'Institutional Reporting Hub', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'CAMPUS SERVICES & WELFARE',
      items: [
        { id: 'lunch_register', label: 'Learner Lunch Register', icon: Utensils },
        { id: 'transport', label: 'School Transport Fleet', icon: Bus },
        { id: 'cocurricular', label: 'Co-Curricular Directorate', icon: Trophy },
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
              <span>Head Teacher Executive Console</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                School Leadership
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Institutional Governance, Academic Department Oversight & Holistic Operations
            </p>
          </div>
        </div>

        <div className="text-right text-xs hidden md:block">
          <div className="font-bold text-white">{currentUser.name}</div>
          <div className="text-[10px] text-slate-400 font-mono">{currentUser.tscNumber || 'TSC/14982/ED'}</div>
        </div>
      </header>

      {/* Main Workspace Layout with Sidebar Tree */}
      <div className="flex-1 flex w-full">
        <WorkspaceSidebar<HeadTab>
          portalTitle="HEAD TEACHER"
          portalSubtitle="Institutional Leadership"
          portalIcon="🏛️"
          portalBadge="Executive"
          groups={sidebarGroups}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          themeColor="emerald"
          footerNote="Governance & CBC Quality"
          statusText="● Principal"
        />

        {/* Content View Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">

      {/* ========================================================
          TAB 1: HEAD TEACHER EXECUTIVE HEALTH, ATTENDANCE & ACADEMIC ANALYTICS
          (Landing Data on Dashboard)
          ======================================================== */}
      {activeTab === 'analytics' && (
        <ExecutiveAnalyticsDashboard 
          currentUser={currentUser}
          title="Head Teacher Executive Health, Attendance & Academic Analytics"
          subtitle="Real-time Recharts surveillance: Campus attendance rates, longitudinal CBC mastery, library foot-traffic, sanatorium clinic logs, and student wellbeing indicators."
        />
      )}

      {/* ========================================================
          TAB 2: EXECUTIVE OVERVIEW
          ======================================================== */}
      {activeTab === 'executive' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Primary School</span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">8 Streams</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Grades 1 to 6 Cohort</h3>
              <p className="text-xs text-slate-600">
                Primary streams: Dove, Eagle, Falcon, Flamingo, Heron, Pelican, Sparrow, Swan. Total primary enrollment: 240 learners.
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <span>Mean: 82.5%</span>
                <span className="font-bold text-emerald-700">98% Retention</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Junior School</span>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">7 Streams</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Grades 7 to 9 Cohort</h3>
              <p className="text-xs text-slate-600">
                Junior School streams: Athi, Chania, Kerio, Mara, Sabaki, Tana, Turkwel. Comprehensive preparation for Senior School pathway selection.
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <span>Mean: 79.8%</span>
                <span className="font-bold text-blue-700">100% Transition</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Campus Security</span>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">Gate Exit System</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Security Passes & Logistics</h3>
              <p className="text-xs text-slate-600">
                Active student exit tracking with registered guardian verification, security passcode generation, and vehicle logging.
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <span>{gatePasses.length} Total Passes</span>
                <span className="font-bold text-emerald-700">0 Incident Breaches</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 2: INSTITUTIONAL ANNOUNCEMENTS
          ======================================================== */}
      {activeTab === 'announcements' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Institutional Official Announcements & Directives
              </h2>
              <p className="text-xs text-slate-500">
                Authoritative directives broadcasted to learners, academic department, and parents across the platform.
              </p>
            </div>
          </div>

          {/* Broadcast Form */}
          <form onSubmit={handleBroadcastAnnouncement} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Publish New Directive</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  placeholder="Directive title (e.g. End of Term Closing Date & Academic Clinic)"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <select
                  value={newAnnTarget}
                  onChange={(e) => setNewAnnTarget(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="all">Audience: All School Stakeholders</option>
                  <option value="students">Audience: Students Only</option>
                  <option value="parents">Audience: Parents Only</option>
                  <option value="teachers">Audience: Academic Department & Staff</option>
                </select>
              </div>
            </div>

            <textarea
              rows={2}
              required
              value={newAnnContent}
              onChange={(e) => setNewAnnContent(e.target.value)}
              placeholder="Announcement text content..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
            />

            <div className="flex items-center justify-between">
              {annSuccess ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Directive successfully published!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Announcement</span>
              </button>
            </div>
          </form>

          {/* Announcements list */}
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 text-sm">{ann.title}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{ann.createdAt?.split('T')[0] || 'Recent'}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{ann.content}</p>
                <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                  <span>Authorized by: {ann.author}</span>
                  <span className="text-[10px] font-mono uppercase bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    {ann.targetGrade ? `Grade ${ann.targetGrade}` : 'Whole School'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 3: ACADEMIC DEPT ALLOCATION & WORK LOGS
          ======================================================== */}
      {activeTab === 'staff_governance' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Academic Department Allocation & Pedagogical Delivery Logs
            </h2>
            <p className="text-xs text-slate-500">
              Oversight of all Academic Department roles, departmental leads, and daily lesson delivery entries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((t) => (
              <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                  <div className="text-xs text-emerald-800 font-semibold uppercase">{t.role.replace('_', ' ')}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{t.tscNumber || 'TSC Verified'} · {t.email}</div>
                  {t.assignedSubjects && (
                    <div className="text-[11px] text-slate-600 mt-1">
                      Subjects: {t.assignedSubjects.join(', ')}
                    </div>
                  )}
                  {t.grade && (
                    <div className="text-[11px] text-slate-600">
                      Class Teacher: Grade {t.grade} ({t.stream})
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  Active
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB: TEACHER PERFORMANCE APPRAISAL (TSC TPAD) & RATIFICATION
          ======================================================== */}
      {activeTab === 'staff_appraisal' && (
        <StaffAppraisalModule currentUser={currentUser} />
      )}

      {/* ========================================================
          TAB: MASTER TIMETABLE & BELL SCHEDULE
          ======================================================== */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Executive School Governance & Operations</span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Institutional Master Timetable & Faculty Relief Oversight
              </h3>
              <p className="text-xs text-slate-500">
                School-wide routine schedules, bell periods, reported teacher absences, and relief teaching coverage.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimetablePerspective('relief')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                  timetablePerspective === 'relief'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                }`}
                title="Review teacher absences and assigned relief coverage"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Faculty Relief & Absence Desk</span>
                {Storage.getTeacherAbsenceReports().length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                    {Storage.getTeacherAbsenceReports().length} Absent
                  </span>
                )}
              </button>
            </div>
          </div>

          <TimetablePortal 
            currentUser={currentUser} 
            initialPerspective={timetablePerspective}
          />
        </div>
      )}

      {/* ========================================================
          TAB: WORK ENTRY AUDIT REGISTER (STRICTLY READ-ONLY)
          ======================================================== */}
      {activeTab === 'work_entry_audit' && (
        <WorkEntryAuditViewer 
          currentUser={currentUser} 
          title="Executive Work Entry Sign-In Audit Register"
          subtitle="Head Teacher executive oversight: All teacher work entry sign-ins, timestamps, verified GPS stamps, biometric photo ID records, and staff credentials. Strictly non-editable."
        />
      )}

      {/* ========================================================
          TAB: LEARNER LUNCH REGISTER & DINING SURVEILLANCE
          ======================================================== */}
      {activeTab === 'lunch_register' && (
        <LearnerLunchRegister
          currentUser={currentUser}
          viewMode="executive"
          title="Head Teacher Executive Learner Lunch & Dining Surveillance"
          subtitle="Institutional dining oversight: Real-time student lunch attendance, daily uptake percentages, special dietary notes, and class teacher registers across all grades and streams."
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
          TAB 4: BOM REPORT
          ======================================================== */}
      {activeTab === 'bom_report' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6 max-w-4xl mx-auto border-t-4 border-t-emerald-600 print:m-0 print:border-none print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-1.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs shrink-0">
                <EduSmartGadsaLogo variant="full" size="sm" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                  Edu-Smart PORTAL · By Gadsa Systems
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confidential Executive Briefing</div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Board of Management (BOM) Termly Report</h2>
                <div className="text-xs text-slate-500 font-mono mt-0.5">Reporting Period: Term 3 · Academic Year 2026</div>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print BOM Dossier</span>
            </button>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900 uppercase">1. Institutional Status & Enrollment</h3>
            <p>
              The institution has maintained stable operational efficiency across both Primary (Grades 1 to 6) and Junior School (Grades 7 to 9) cohorts, with full capacity utilized across 15 recognized streams. Total student headcount stands at optimal teacher-to-learner ratios conforming to Ministry of Education guidelines.
            </p>

            <h3 className="text-sm font-bold text-slate-900 uppercase">2. Competency-Based Curriculum (CBC) Transition</h3>
            <p>
              Curriculum progression for all 8 Primary learning areas and 9 Junior School learning areas exceeds 92% completion. Preparations for Grade 6 KPSEA national assessment simulations are fully on schedule under the Dean of Studies and Head of Department supervision.
            </p>

            <h3 className="text-sm font-bold text-slate-900 uppercase">3. Campus Safety, Discipline & Gate Pass Protocol</h3>
            <p>
              Implementation of the digital Student Gate Exit Pass system has eliminated unauthorized campus exits. Zero security breaches were recorded this academic term. Learner discipline cases have been handled restoratively through the Deputy Head Teacher and Senior Teacher mentorship initiatives.
            </p>

            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
              <div>Certified by: Dr. Arthur Mwangi, Head Teacher</div>
              <div>EduSmart Governance Directorate</div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 5: REPORTING HUB (MONTHLY, TERMLY, ANNUAL PDF)
          ======================================================== */}
      {activeTab === 'reporting_hub' && (
        <ReportingHub currentUser={currentUser} />
      )}

      {/* ========================================================
          TAB 6: SCHOOL EVENTS & EVENT TICKETING HUB
          (Head Teacher executive event posting & governance)
          ======================================================== */}
      {activeTab === 'events' && (
        <SchoolEventsManager currentUser={currentUser} />
      )}
        </main>
      </div>
    </div>
  );
};
