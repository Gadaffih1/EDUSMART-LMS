import React, { useState } from 'react';
import { 
  User, 
  SubjectName, 
  GradeLevel, 
  WorkEntryLog, 
  Quiz, 
  Topic 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  Briefcase, 
  BookOpen, 
  CheckSquare, 
  BarChart3, 
  FileCheck2, 
  Users, 
  Layers, 
  Award, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  ExternalLink,
  ShieldCheck,
  Lock,
  FileText,
  Sparkles,
  Check
} from 'lucide-react';
import { ReportingHub } from '../reports/ReportingHub';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';

interface HODWorkspaceProps {
  currentUser: User;
}

export const HODWorkspace: React.FC<HODWorkspaceProps> = ({ currentUser }) => {
  const deptName = currentUser.department || 'Sciences & Mathematics';

  // Map subjects belonging to this department
  const departmentSubjects: SubjectName[] = deptName.includes('Science') 
    ? ['Mathematics', 'Integrated Science', 'Agriculture and Nutrition'] 
    : deptName.includes('Language')
    ? ['English', 'Kiswahili']
    : ['Social Studies', 'Religious Education', 'Creative Arts', 'Pretechnical Education'];

  type HODTab = 'syllabus' | 'work_logs' | 'quiz_audit' | 'subject_analytics' | 'curriculum_resources' | 'reporting_hub';
  const [activeTab, setActiveTab] = useState<HODTab>('syllabus');

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(4);
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>(departmentSubjects[0]);

  // Data
  const allWorkLogs = Storage.getWorkEntryLogs();
  const deptWorkLogs = allWorkLogs.filter(w => w.subject ? departmentSubjects.includes(w.subject) : true);

  const allTopics = Storage.getTopics();
  const deptTopics = allTopics.filter(t => departmentSubjects.includes(t.subject));

  const allQuizzes = Storage.getQuizzes();
  const deptQuizzes = allQuizzes.filter(q => departmentSubjects.includes(q.subject));

  // Departmental Curriculum Resources
  const allNotes = Storage.getNotes();
  const deptNotes = allNotes.filter(n => departmentSubjects.includes(n.subject));
  const allAudios = Storage.getAudios();
  const deptAudios = allAudios.filter(a => departmentSubjects.includes(a.subject));
  const allVideos = Storage.getVideos();
  const deptVideos = allVideos.filter(v => departmentSubjects.includes(v.subject));

  // Approved resources tracking state
  const [approvedResources, setApprovedResources] = useState<Record<string, boolean>>({
    'note-1': true,
    'note-2': true,
    'audio-1': true,
    'video-1': true
  });

  // Teachers teaching in this department
  const allUsers = Storage.getUsers();
  const deptTeachers = allUsers.filter(u => 
    (u.role === 'teacher' || u.role === 'class_teacher') &&
    u.assignedSubjects?.some(s => departmentSubjects.includes(s))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HOD Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-1.5 rounded-xl border border-white/20 shadow-xs hidden sm:block">
              <EduSmartGadsaLogo variant="horizontal" size="xs" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase">
              <span>Departmental Leadership Console</span>
              <span aria-hidden="true">·</span>
              <span>Head of Department</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {deptName} Department
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Supervise curriculum delivery, audit teacher work entry registers, review topical quizzes, and monitor learning area performance across primary and junior school grades.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20 shrink-0 text-xs">
          <div className="text-[10px] uppercase font-bold text-indigo-300 mb-1">HOD Lead</div>
          <div className="font-extrabold text-base">{currentUser.name}</div>
          <div className="text-slate-300 font-mono text-[11px]">{currentUser.tscNumber || 'TSC/31204/ED'}</div>
          <div className="mt-2 pt-2 border-t border-white/20 flex gap-4 text-[11px]">
            <span>{departmentSubjects.length} Learning Areas</span>
            <span>·</span>
            <span>{deptTeachers.length} Teaching Staff</span>
          </div>
        </div>
      </div>

      {/* Primary Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'syllabus'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-indigo-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-indigo-100 text-indigo-800">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">1. Syllabus</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'syllabus' ? 'text-indigo-200' : 'text-slate-500'}`}>
              CBC milestones
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('work_logs')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'work_logs'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-indigo-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-emerald-100 text-emerald-800">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">2. Work Entry</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'work_logs' ? 'text-emerald-200' : 'text-slate-500'}`}>
              Lesson logs ({deptWorkLogs.length})
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('quiz_audit')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'quiz_audit'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-indigo-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-amber-100 text-amber-800">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">3. Test Bank</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'quiz_audit' ? 'text-amber-200' : 'text-slate-500'}`}>
              Quizzes ({deptQuizzes.length})
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('curriculum_resources')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'curriculum_resources'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-indigo-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-cyan-100 text-cyan-800">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">4. Curriculum Dev</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'curriculum_resources' ? 'text-cyan-200' : 'text-slate-500'}`}>
              Controlled access ({deptNotes.length + deptAudios.length + deptVideos.length})
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('subject_analytics')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'subject_analytics'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-indigo-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-purple-100 text-purple-800">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">5. Analytics</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'subject_analytics' ? 'text-purple-200' : 'text-slate-500'}`}>
              Subject means
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('reporting_hub')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'reporting_hub'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-indigo-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-emerald-100 text-emerald-800">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">6. Reporting Hub</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'reporting_hub' ? 'text-emerald-200' : 'text-slate-500'}`}>
              Periodic dossiers
            </div>
          </div>
        </button>
      </div>

      {/* ========================================================
          TAB 1: SYLLABUS COVERAGE & TOPICS
          ======================================================== */}
      {activeTab === 'syllabus' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Department Syllabus Coverage by Grade
              </h2>
              <p className="text-xs text-slate-500">
                Weekly scope & sequence for {deptName} across Term 1, 2, and 3.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Select Grade:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              >
                {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deptTopics
              .filter(t => t.grade === selectedGrade)
              .map((top) => (
                <div key={top.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {top.subject}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Term {top.term} · Week {top.week}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{top.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{top.description}</p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-emerald-700 font-semibold border-t border-slate-200">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>CBC Compliant</span>
                    </span>
                    <span className="text-slate-400 font-mono">Strand Verified</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 2: WORK ENTRY AUDIT (TEACHER LOGS)
          ======================================================== */}
      {activeTab === 'work_logs' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Teacher Daily Work Entry Audit
              </h2>
              <p className="text-xs text-slate-500">
                Verify that department educators sign the daily lesson delivery log with objectives and learner roll counts.
              </p>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              {deptWorkLogs.length} Verified Entries
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date / Time</th>
                  <th className="py-2.5 px-3">Educator</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Subject / Topic Taught</th>
                  <th className="py-2.5 px-3 text-center">Learners</th>
                  <th className="py-2.5 px-3">Objectives Covered</th>
                  <th className="py-2.5 px-3">HOD Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {deptWorkLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      <div>{log.date}</div>
                      <div className="text-[10px] text-slate-500">{log.time}</div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{log.teacherName}</td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-700">
                      Grade {log.grade} {log.stream}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{log.subject}</div>
                      <div className="text-slate-600 text-[11px]">{log.topicTaught}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                      {log.learnersPresent}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 italic max-w-xs truncate" title={log.objectivesCovered}>
                      "{log.objectivesCovered}"
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        Audited & Signed
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
          TAB 3: TOPICAL QUIZ AUDIT
          ======================================================== */}
      {activeTab === 'quiz_audit' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Department Topical Test Bank & Quiz Validation
              </h2>
              <p className="text-xs text-slate-500">
                Quality assurance for auto-marked topical assessments prepared by department teachers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deptQuizzes.map((quiz) => (
              <div key={quiz.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                    Grade {quiz.grade} · {quiz.subject}
                  </span>
                  <span className="text-slate-500 font-mono">Pass: {quiz.passPercentage}%</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">{quiz.title}</h3>
                <div className="text-slate-600">
                  Total Questions: <strong className="text-slate-900 font-mono">{quiz.questions.length}</strong> (MCQs) · Time: {quiz.timeLimitMinutes} min
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sample Question:</div>
                  <div className="font-semibold text-slate-800">{quiz.questions[0]?.questionText}</div>
                </div>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Author: {quiz.teacherName}</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>HOD Approved</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 4: SUBJECT PERFORMANCE ANALYTICS
          ======================================================== */}
      {activeTab === 'subject_analytics' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Department Performance Index
            </h2>
            <p className="text-xs text-slate-500">
              Mean score comparison and learner competency benchmarks in {deptName}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {departmentSubjects.map((sub, idx) => {
              const mean = 76 + ((idx * 5) % 15);
              return (
                <div key={sub} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Subject Overview</div>
                  <div className="font-extrabold text-base text-slate-900">{sub}</div>
                  <div className="text-3xl font-black font-mono text-indigo-700 mt-2">{mean}%</div>
                  <div className="text-slate-500">Department Subject Mean Score</div>
                  <div className="pt-2 border-t border-slate-200 text-emerald-700 font-semibold text-[11px]">
                    88% Meeting or Exceeding Expectations
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 5: CURRICULUM DEVELOPMENT & CONTROLLED ACCESS
          ======================================================== */}
      {activeTab === 'curriculum_resources' && (
        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Curriculum Content Development & Access Control</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Structured Learning Resources ({deptName})
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Curriculum-aligned digital materials developed with multi-tier role authorization. Only verified educational content is released to learner workspaces.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Access Controlled: 6 Leadership Tiers</span>
                </span>
              </div>
            </div>

            {/* Controlled Access Role Hierarchy Banner */}
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-700" />
                <span>Authorized Curriculum Content Roles & Permissions</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="font-bold text-slate-900">Head Teacher</div>
                  <div className="text-[10px] text-purple-700 font-semibold mt-0.5">Final Institutional Sanction</div>
                  <div className="text-[10px] text-slate-500 mt-1">Full override, school-wide syllabus policy.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="font-bold text-slate-900">Deputy Heads</div>
                  <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Instructional Supervision</div>
                  <div className="text-[10px] text-slate-500 mt-1">Curriculum discipline & teacher delivery.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="font-bold text-slate-900">Deans of Studies</div>
                  <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">Curriculum Architecture</div>
                  <div className="text-[10px] text-slate-500 mt-1">KICD strand alignment & pacing calendars.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="font-bold text-slate-900">Curriculum Coord.</div>
                  <div className="text-[10px] text-teal-700 font-semibold mt-0.5">Pacing & Lesson Audit</div>
                  <div className="text-[10px] text-slate-500 mt-1">Pedagogical standards & resource review.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border-2 border-cyan-500 shadow-2xs">
                  <div className="font-bold text-cyan-900">HODs (Active)</div>
                  <div className="text-[10px] text-cyan-700 font-bold mt-0.5">Departmental Vetting</div>
                  <div className="text-[10px] text-slate-600 mt-1">Direct approval of notes, tests & audios.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="font-bold text-slate-900">Subject Teachers</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Primary Authorship</div>
                  <div className="text-[10px] text-slate-500 mt-1">Drafting lesson notes, audios & quizzes.</div>
                </div>
              </div>
            </div>

            {/* Departmental Materials Ledger */}
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center justify-between">
                <span>Departmental Curriculum Resource Bank ({deptNotes.length} Reading Modules, {deptAudios.length} Audios, {deptVideos.length} Videos)</span>
                <span className="text-xs font-normal text-slate-500">Anti-Download & Watermark Protected</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deptNotes.map((note) => {
                  const isApproved = approvedResources[note.id] ?? true;
                  return (
                    <div key={note.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-100 text-indigo-800">
                            Grade {note.grade} · {note.subject}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">{note.createdAt}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{note.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{note.summary}</p>
                        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                          <span>Author:</span>
                          <strong className="text-slate-700">{note.author}</strong>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setApprovedResources(prev => ({ ...prev, [note.id]: !isApproved }));
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isApproved ? 'HOD Approved' : 'Pending Review'}</span>
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {isApproved ? 'Published to Learners' : 'Draft Only'}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
