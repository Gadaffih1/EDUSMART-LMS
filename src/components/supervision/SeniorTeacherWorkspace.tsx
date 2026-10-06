import React, { useState } from 'react';
import { 
  User, 
  GateExitPass, 
  WorkEntryLog, 
  AttendanceRecord,
  GradeLevel,
  StreamName 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  ShieldCheck, 
  Users, 
  LogOut, 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle, 
  UserCheck, 
  Clock, 
  Search, 
  HeartHandshake, 
  Plus, 
  Check, 
  School,
  BookOpen,
  FileText,
  Lock,
  BarChart3,
  Sparkles,
  CheckCircle2,
  HeartPulse,
  Bus,
  Trophy
} from 'lucide-react';
import { ReportingHub } from '../reports/ReportingHub';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { WorkEntryAuditViewer } from '../common/WorkEntryAuditViewer';
import { SanatoriumSection } from '../sanatorium/SanatoriumSection';
import { TransportWorkspace } from '../transport/TransportWorkspace';
import { CoCurricularWorkspace } from '../cocurricular/CoCurricularWorkspace';

interface SeniorTeacherWorkspaceProps {
  currentUser: User;
}

export const SeniorTeacherWorkspace: React.FC<SeniorTeacherWorkspaceProps> = ({ currentUser }) => {
  type SupervisionTab = 'gate_safety' | 'work_entry_audit' | 'sanatorium' | 'transport' | 'cocurricular' | 'attendance_monitor' | 'mentorship' | 'curriculum_coordination' | 'reporting_hub';
  const [activeTab, setActiveTab] = useState<SupervisionTab>('gate_safety');

  // Mentorship log state
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
      date: '2026-09-28'
    },
    {
      id: 'men-2',
      studentName: 'Faith Wanjiru',
      grade: 8,
      stream: 'Mara',
      category: 'Academic Improvement',
      notes: 'Discussed high school selection goals and pre-technical subject combination interest.',
      mentor: currentUser.name,
      date: '2026-09-30'
    }
  ]);

  const [newStudentName, setNewStudentName] = useState('');
  const [newGrade, setNewGrade] = useState<GradeLevel>(4);
  const [newStream, setNewStream] = useState('Dove');
  const [newCategory, setNewCategory] = useState<'Academic Improvement' | 'Character & Conduct' | 'Health & Well-being' | 'Peer Relationship'>('Academic Improvement');
  const [newNotes, setNewNotes] = useState('');
  const [mentorSuccess, setMentorSuccess] = useState(false);

  const handleAddMentorship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newNotes.trim()) return;

    const entry: MentorshipLog = {
      id: `men-${Date.now()}`,
      studentName: newStudentName.trim(),
      grade: newGrade,
      stream: newStream,
      category: newCategory,
      notes: newNotes.trim(),
      mentor: currentUser.name,
      date: new Date().toISOString().split('T')[0]
    };

    setMentorshipList([entry, ...mentorshipList]);
    setMentorSuccess(true);
    setNewStudentName('');
    setNewNotes('');
    setTimeout(() => setMentorSuccess(false), 3000);
  };

  const allGatePasses = Storage.getGatePasses();
  const allWorkLogs = Storage.getWorkEntryLogs();
  const allStudents = Storage.getUsers().filter(u => u.role === 'student');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-1.5 rounded-xl border border-white/20 shadow-xs hidden sm:block">
              <EduSmartGadsaLogo variant="horizontal" size="xs" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              <span>Academic & Learner Supervision Console</span>
              <span aria-hidden="true">·</span>
              <span>Senior Teacher & Curriculum Coordinator</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Curriculum Coordination & Learner Supervision
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Oversee CBC curriculum alignment, learner welfare and academic guidance, track compound gate exits, verify teacher work entry compliance, and maintain learner mentorship logs for {currentUser.name}.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20 shrink-0 text-xs">
          <div className="text-[10px] uppercase font-bold text-emerald-300 mb-1">Supervision Lead</div>
          <div className="font-extrabold text-base">{currentUser.name}</div>
          <div className="text-slate-300 font-mono text-[11px]">{currentUser.tscNumber || 'TSC/29410/ED'}</div>
          <div className="mt-2 pt-2 border-t border-white/20 flex gap-4 text-[11px]">
            <span>{allStudents.length} Total Enrolled Learners</span>
            <span>·</span>
            <span>Grades 1 to 9</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveTab('gate_safety')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'gate_safety'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-emerald-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-rose-100 text-rose-800">
            <LogOut className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">1. Gate Exit</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'gate_safety' ? 'text-rose-200' : 'text-slate-500'}`}>
              Passes ({allGatePasses.length})
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('work_entry_audit')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'work_entry_audit'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-emerald-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-emerald-100 text-emerald-800">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">2. Work Logs</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'work_entry_audit' ? 'text-emerald-200' : 'text-slate-500'}`}>
              Sign-ins ({allWorkLogs.length})
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('sanatorium')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'sanatorium'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-rose-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-rose-100 text-rose-800">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">3. Sanatorium</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'sanatorium' ? 'text-rose-200' : 'text-slate-500'}`}>
              Health logs
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('transport')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'transport'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-amber-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-amber-100 text-amber-800">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">4. Transport</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'transport' ? 'text-amber-200' : 'text-slate-500'}`}>
              Fleet & routes
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('cocurricular')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'cocurricular'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-purple-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-purple-100 text-purple-800">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">5. Co-Curricular</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'cocurricular' ? 'text-purple-200' : 'text-slate-500'}`}>
              Clubs & sports
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('mentorship')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'mentorship'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-emerald-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-blue-100 text-blue-800">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">3. Mentorship</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'mentorship' ? 'text-blue-200' : 'text-slate-500'}`}>
              Pastoral records
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('attendance_monitor')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'attendance_monitor'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-emerald-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-teal-100 text-teal-800">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">4. Roll Call</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'attendance_monitor' ? 'text-teal-200' : 'text-slate-500'}`}>
              Daily attendance
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('curriculum_coordination')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'curriculum_coordination'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-emerald-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-cyan-100 text-cyan-800">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">5. Curriculum Dev</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'curriculum_coordination' ? 'text-cyan-200' : 'text-slate-500'}`}>
              Controlled access
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('reporting_hub')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'reporting_hub'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-emerald-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-purple-100 text-purple-800">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">6. Reporting Hub</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'reporting_hub' ? 'text-purple-200' : 'text-slate-500'}`}>
              Periodic dossiers
            </div>
          </div>
        </button>
      </div>

      {/* ========================================================
          TAB 1: GATE EXIT SAFETY MONITOR
          ======================================================== */}
      {activeTab === 'gate_safety' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-600" />
                <span>Student Gate Departure & Safety Ledger</span>
              </h2>
              <p className="text-xs text-slate-500">
                Live monitoring of all pupils signed out of the school gates with authorized guardians.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200">
                {allGatePasses.filter(p => p.status === 'active' || p.status === 'departed').length} Currently Out
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                {allGatePasses.filter(p => p.status === 'returned').length} Returned
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Pass Code</th>
                  <th className="py-2.5 px-3">Pupil Name</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Departure Date / Time</th>
                  <th className="py-2.5 px-3">Reason for Departure</th>
                  <th className="py-2.5 px-3">Guardian & Phone</th>
                  <th className="py-2.5 px-3 text-center">Status Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allGatePasses.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.gatePassCode}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{p.studentName}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">Grade {p.grade} {p.stream}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      <div>{p.departureDate || '2026-10-01'}</div>
                      <div className="text-[10px] text-slate-500">{p.departureTime}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 max-w-xs truncate" title={p.reason}>{p.reason}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{p.guardianName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{p.guardianPhone}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        p.status === 'returned'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'active' || p.status === 'departed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
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
          TAB 2: TEACHER WORK ENTRY COMPLIANCE (STRICTLY READ-ONLY)
          ======================================================== */}
      {activeTab === 'work_entry_audit' && (
        <WorkEntryAuditViewer 
          currentUser={currentUser} 
          title="Senior Teacher Work Entry Sign-In Register"
          subtitle="Learner supervision & instructional delivery oversight: Real-time clock-in logs, GPS stamps, staff credentials, and verified biometric photos. Strictly non-editable."
        />
      )}

      {/* ========================================================
          TAB: SANATORIUM & STUDENT HEALTH OVERSIGHT
          ======================================================== */}
      {activeTab === 'sanatorium' && (
        <SanatoriumSection
          currentUser={currentUser}
          canRecord={false}
          filterGrade={currentUser.grade || 8}
          title={`Senior Teacher Sanatorium Oversight · Grade ${currentUser.grade || 8}`}
          subtitle={`Learner health visits, triage records, and medical recommendations strictly for your supervised Grade ${currentUser.grade || 8} cohort.`}
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
          TAB 3: LEARNER MENTORSHIP & GUIDANCE LOG
          ======================================================== */}
      {activeTab === 'mentorship' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-blue-600" />
              <span>Learner Mentorship & Character Formation Register</span>
            </h2>
            <p className="text-xs text-slate-500">
              Document pastoral counseling, academic goal-setting, and positive behavioral reinforcement.
            </p>
          </div>

          {mentorSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Mentorship note successfully recorded!</span>
            </div>
          )}

          {/* New Mentorship Note Form */}
          <form onSubmit={handleAddMentorship} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-slate-800 text-sm">Add New Mentorship / Supervision Entry</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Kelvin Kiprop"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Grade</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(Number(e.target.value) as GradeLevel)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                >
                  {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stream</label>
                <input
                  type="text"
                  value={newStream}
                  onChange={(e) => setNewStream(e.target.value)}
                  placeholder="e.g. Dove"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Guidance Focus</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Academic Improvement">Academic Improvement</option>
                  <option value="Character & Conduct">Character & Conduct</option>
                  <option value="Health & Well-being">Health & Well-being</option>
                  <option value="Peer Relationship">Peer Relationship</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Counseling / Mentorship Notes</label>
              <textarea
                rows={2}
                required
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Details of advice given, goals agreed upon with the student, and follow-up actions..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Supervision Record</span>
            </button>
          </form>

          {/* Mentorship Records List */}
          <div className="space-y-3">
            {mentorshipList.map((m) => (
              <div key={m.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{m.studentName}</span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      Grade {m.grade} {m.stream}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {m.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{m.date}</span>
                </div>
                <p className="text-slate-700 italic leading-relaxed">"{m.notes}"</p>
                <div className="text-[10px] text-slate-400 font-mono">Recorded by Senior Teacher: {m.mentor}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 4: STREAM ROLL CALL MONITOR
          ======================================================== */}
      {activeTab === 'attendance_monitor' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              School Attendance Health Overview
            </h2>
            <p className="text-xs text-slate-500">
              Cross-grade daily roll call monitoring to prevent truancy and support learner retention.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
              <div className="text-[10px] font-bold uppercase text-emerald-700">Average School Attendance</div>
              <div className="text-3xl font-mono font-black text-emerald-900">96.4%</div>
              <div className="text-emerald-700">Consistently meeting national threshold</div>
            </div>

            <div className="p-5 bg-blue-50 rounded-xl border border-blue-200 text-xs space-y-1">
              <div className="text-[10px] font-bold uppercase text-blue-700">Active Learners Supervised</div>
              <div className="text-3xl font-mono font-black text-blue-900">{allStudents.length}</div>
              <div className="text-blue-700">Across 15 Primary & Junior streams</div>
            </div>

            <div className="p-5 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-1">
              <div className="text-[10px] font-bold uppercase text-purple-700">Mentorship Engagements</div>
              <div className="text-3xl font-mono font-black text-purple-900">{mentorshipList.length}</div>
              <div className="text-purple-700">Learners supported this term</div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 5: CURRICULUM COORDINATION & CONTROLLED ACCESS
          ======================================================== */}
      {activeTab === 'curriculum_coordination' && (
        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 uppercase tracking-wider mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span>Curriculum Coordination & Resource Standards</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Curriculum Alignment & Controlled Access Governance
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Enforces structured curriculum content development across Primary (Grades 1-6) and Junior Secondary (Grades 7-9). Verifies pedagogical rigor and controlled access permissions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Role Access Guard: 6 Authorized Tiers</span>
                </span>
              </div>
            </div>

            {/* Controlled Access Role Hierarchy Grid */}
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-700" />
                <span>Curriculum Content Development Access Authority Matrix</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">Head Teacher</div>
                  <div className="text-[10px] text-purple-700 font-semibold mt-0.5">Institutional Sign-off</div>
                  <div className="text-[10px] text-slate-500 mt-1">Full override, MoE and KICD statutory compliance.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">Deputy Heads</div>
                  <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Operations & Timetabling</div>
                  <div className="text-[10px] text-slate-500 mt-1">Staff roster alignment & teaching delivery.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">Deans of Studies</div>
                  <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">Academic Frameworks</div>
                  <div className="text-[10px] text-slate-500 mt-1">Assessment pacing & summative rubrics.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border-2 border-cyan-500">
                  <div className="font-bold text-cyan-900">Curriculum Coord.</div>
                  <div className="text-[10px] text-cyan-700 font-bold mt-0.5">Pedagogical Review</div>
                  <div className="text-[10px] text-slate-600 mt-1">Resource quality, lesson pacing & audit.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">HODs</div>
                  <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Departmental Vetting</div>
                  <div className="text-[10px] text-slate-500 mt-1">Subject matter accuracy & test bank checks.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">Subject Teachers</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Content Authorship</div>
                  <div className="text-[10px] text-slate-500 mt-1">Creating notes, recorded audios & quizzes.</div>
                </div>
              </div>
            </div>

            {/* Curriculum Milestones by Grade Band */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Primary CBC Standards (Grades 1-6)
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    95% Aligned
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  8 Core Learning areas audited against KICD syllabus. Interactive reading notes protected by client-side anti-copy and watermark guardrails.
                </p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>8 Primary Subjects</span>
                  <span>100% Digital Coverage</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Junior Secondary Standards (Grades 7-9)
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    92% Aligned
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  9 Core and Pre-Technical learning areas verified for exploratory learning, practical science demonstrations, and formative rubric assessments.
                </p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>9 Junior Subjects</span>
                  <span>Interactive Test Banks</span>
                </div>
              </div>
            </div>
          </div>
        </section>
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
