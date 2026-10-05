import React, { useState } from 'react';
import { 
  User, 
  GateExitPass, 
  WorkEntryLog, 
  GradeLevel, 
  StreamName,
  SearchAuditLog,
  AppNotification
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
  HeartPulse
} from 'lucide-react';
import { ReportingHub } from '../reports/ReportingHub';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { WorkEntryAuditViewer } from '../common/WorkEntryAuditViewer';
import { SanatoriumSection } from '../sanatorium/SanatoriumSection';
import { TransportWorkspace } from '../transport/TransportWorkspace';
import { CoCurricularWorkspace } from '../cocurricular/CoCurricularWorkspace';
import { TimetablePortal } from '../timetable/TimetablePortal';
import { 
  Bus,
  Trophy,
  CalendarDays
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

interface StaffDutyAssignment {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  leadTeacher: string;
  assistantTeacher: string;
  gateDutyTeacher: string;
  diningSupervision: string;
  status: 'Current' | 'Upcoming' | 'Completed';
}

export const DeputyHeadWorkspace: React.FC<DeputyHeadWorkspaceProps> = ({ currentUser }) => {
  type DeputyTab = 'operations' | 'discipline' | 'online_discipline' | 'staff_duty' | 'timetable' | 'work_ledger' | 'sanatorium' | 'transport' | 'cocurricular' | 'reporting_hub';
  const [activeTab, setActiveTab] = useState<DeputyTab>('operations');

  // Gate passes from storage
  const [gatePasses, setGatePasses] = useState<GateExitPass[]>(() => Storage.getGatePasses());
  const workLogs = Storage.getWorkEntryLogs();
  const allUsers = Storage.getUsers();
  const teachersList = allUsers.filter(u => ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(u.role));

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

  // Staff duty rosters
  const [dutyRosters, setDutyRosters] = useState<StaffDutyAssignment[]>([
    {
      id: 'duty-w5',
      weekNumber: 5,
      startDate: '2026-09-28',
      endDate: '2026-10-02',
      leadTeacher: 'Mr. David Kiprono',
      assistantTeacher: 'Mrs. Florence Akinyi',
      gateDutyTeacher: 'Mr. Peter Mutua',
      diningSupervision: 'Mrs. Esther Kamau',
      status: 'Current'
    },
    {
      id: 'duty-w6',
      weekNumber: 6,
      startDate: '2026-10-05',
      endDate: '2026-10-09',
      leadTeacher: 'Mr. Peter Ochieng',
      assistantTeacher: 'Dr. Mercy Mwangi',
      gateDutyTeacher: 'Mr. Charles Omondi',
      diningSupervision: 'Mr. David Kiprono',
      status: 'Upcoming'
    }
  ]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-1.5 rounded-xl border border-white/20 shadow-xs hidden sm:block">
              <EduSmartGadsaLogo variant="horizontal" size="xs" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 tracking-wider uppercase">
              <span>Operations, Discipline & Staff Supervision</span>
              <span aria-hidden="true">·</span>
              <span>Executive Directorate</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Deputy Head Teacher Workspace
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Direct operational oversight of campus security, student gate pass authorizations, learner discipline and counseling cases, weekly staff duty rosters, and teacher lesson work entry audits.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20 shrink-0 text-xs">
          <div className="text-[10px] uppercase font-bold text-blue-300 mb-1">Office of the Deputy Head</div>
          <div className="font-extrabold text-base">{currentUser.name}</div>
          <div className="text-slate-300 font-mono text-[11px]">{currentUser.tscNumber || 'TSC/23491/ED'}</div>
          <div className="mt-2 pt-2 border-t border-white/20 flex gap-3 text-[11px]">
            <span className="text-emerald-300 font-bold">{gatePasses.filter(p => p.status === 'active').length} Active Passes</span>
            <span>·</span>
            <span className="text-amber-300 font-bold">{disciplineCases.filter(c => c.status !== 'Resolved').length} Active Cases</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Active Gate Passes</div>
          <div className="text-2xl font-extrabold font-mono text-amber-600 mt-1">
            {gatePasses.filter(p => p.status === 'active' || p.status === 'departed').length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Students currently off-campus</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Discipline Incidents</div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            {disciplineCases.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{disciplineCases.filter(c => c.status === 'Open').length} pending action</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Staff Duty Week</div>
          <div className="text-2xl font-extrabold font-mono text-blue-700 mt-1">
            Week 5
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Lead: Mr. Kiprono</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Work Logs Submitted</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">
            {workLogs.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">100% staff compliance</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('operations')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'operations' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Gate Security & Operations ({gatePasses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('discipline')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'discipline' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BadgeAlert className="w-4 h-4 text-amber-400" />
          <span>Learner Discipline & Conduct ({disciplineCases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('online_discipline')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'online_discipline' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Online Behavior & Search Filtration ({searchLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff_duty')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'staff_duty' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-400" />
          <span>Staff Duty Roster ({dutyRosters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'timetable' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-emerald-400" />
          <span>Curriculum Timetable & Bell Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('work_ledger')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'work_ledger' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-purple-400" />
          <span>Staff Work Entry Audit ({workLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sanatorium')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'sanatorium' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-rose-400" />
          <span>Sanatorium & Health</span>
        </button>

        <button
          onClick={() => setActiveTab('transport')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'transport' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Bus className="w-4 h-4 text-amber-400" />
          <span>Transport & Fleet</span>
        </button>

        <button
          onClick={() => setActiveTab('cocurricular')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'cocurricular' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-purple-400" />
          <span>Co-Curriculum & Sports</span>
        </button>

        <button
          onClick={() => setActiveTab('reporting_hub')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'reporting_hub' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Reporting Hub (Monthly, Termly & Annual)</span>
        </button>
      </div>

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
          TAB 3: STAFF DUTY ROSTER
          ======================================================== */}
      {activeTab === 'staff_duty' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Staff Weekly Duty Master Roster
              </h2>
              <p className="text-xs text-slate-500">
                Coordination of weekly teachers on duty (TOD), campus perimeter supervision, morning assembly, and dining hall monitoring.
              </p>
            </div>
            <div className="text-xs font-mono bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200">
              Active Term: Term 3 · 2026 Academic Year
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Week</th>
                  <th className="py-2.5 px-3">Dates</th>
                  <th className="py-2.5 px-3">Lead Teacher (Assembly)</th>
                  <th className="py-2.5 px-3">Assistant TOD</th>
                  <th className="py-2.5 px-3">Security & Gate TOD</th>
                  <th className="py-2.5 px-3">Dining & Recess</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dutyRosters.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-900">Week {d.weekNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{d.startDate} - {d.endDate}</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-900">{d.leadTeacher}</td>
                    <td className="py-2.5 px-3 text-slate-700">{d.assistantTeacher}</td>
                    <td className="py-2.5 px-3 text-slate-700">{d.gateDutyTeacher}</td>
                    <td className="py-2.5 px-3 text-slate-700">{d.diningSupervision}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        d.status === 'Current' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'Upcoming' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {d.status}
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
    </div>
  );
};
