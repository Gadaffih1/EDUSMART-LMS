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
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { WorkEntryAuditViewer } from '../common/WorkEntryAuditViewer';
import { SanatoriumSection } from '../sanatorium/SanatoriumSection';
import { 
  BookOpen, 
  BarChart3, 
  Calendar, 
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
  HeartPulse
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
  type DeanTab = 'assessments' | 'analytics' | 'report_cards' | 'curriculum' | 'work_entries' | 'sanatorium' | 'reporting_hub';
  const [activeTab, setActiveTab] = useState<DeanTab>('assessments');
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

  // Report cards
  const allUsers = Storage.getUsers();
  const students = allUsers.filter(u => u.role === 'student');
  const gradeStudents = students.filter(s => s.grade === selectedGrade);

  // Report cards for selected grade
  const gradeReportCards: ReportCard[] = gradeStudents.map(student => {
    const existing = Storage.getReportCards(student.id)[0];
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
        teacherName: 'Staff Faculty'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-1.5 rounded-xl border border-white/20 shadow-xs hidden sm:block">
              <EduSmartGadsaLogo variant="horizontal" size="xs" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              <span>Academic Affairs & Assessment Directorate</span>
              <span aria-hidden="true">·</span>
              <span>Academic Directorate</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dean of Studies Workspace
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Institutional coordination of Competency-Based Curriculum assessment schedules, examination analytics, report card standardization, and academic target monitoring across Grades 1 through 9.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20 shrink-0 text-xs">
          <div className="text-[10px] uppercase font-bold text-emerald-300 mb-1">Dean of Studies</div>
          <div className="font-extrabold text-base">{currentUser.name}</div>
          <div className="text-slate-300 font-mono text-[11px]">{currentUser.tscNumber || 'TSC/38910/ED'}</div>
          <div className="mt-2 pt-2 border-t border-white/20 flex gap-3 text-[11px]">
            <span className="text-emerald-300 font-bold">80.1% School Mean</span>
            <span>·</span>
            <span className="text-blue-300 font-bold">{students.length} Total Enrolled</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('assessments')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'assessments' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Assessment Calendar & Schedules</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'analytics' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span>Institutional Exam Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('report_cards')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'report_cards' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Term Report Card Authorization</span>
        </button>

        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'curriculum' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Curriculum Strands & KPSEA Pacing</span>
        </button>

        <button
          onClick={() => setActiveTab('work_entries')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'work_entries' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Faculty Work Entry Sign-Ins ({workLogs.length})</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded font-mono font-bold">Locked</span>
        </button>

        <button
          onClick={() => setActiveTab('sanatorium')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'sanatorium' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-rose-400" />
          <span>Sanatorium & Health Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('reporting_hub')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'reporting_hub' ? 'bg-slate-900 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Reporting Hub (Monthly, Termly, Annual PDF)</span>
        </button>
      </div>

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
          TAB 2: INSTITUTIONAL EXAM ANALYTICS
          ======================================================== */}
      {activeTab === 'analytics' && (
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
                      contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="mean" fill="#059669" radius={[4, 4, 0, 0]} name="Actual Mean" />
                    <Bar dataKey="target" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Target (80%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  CBC Mastery Distribution
                </h3>
                <p className="text-xs text-slate-500">Student competency banding</p>
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
                    <Tooltip formatter={(val: any) => [`${val}% of Students`, 'Cohort']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1 text-xs">
                {masteryPieData.map(m => (
                  <div key={m.name} className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="text-[11px] truncate max-w-[170px]">{m.name}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{m.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 3: REPORT CARDS AUTHORIZATION
          ======================================================== */}
      {activeTab === 'report_cards' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Term Report Card Verification & Seal Authorization
              </h2>
              <p className="text-xs text-slate-500">
                Review class teacher remarks, subject marks breakdown, and authorize release to parents.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Cohort:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
              >
                {[1,2,3,4,5,6,7,8,9].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gradeReportCards.map((rc) => (
              <div key={rc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{rc.studentName}</h3>
                    <div className="text-xs text-slate-500">Grade {rc.grade} ({rc.stream}) · Term {rc.term}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold font-mono text-emerald-700">{rc.overallAverage}%</span>
                    <div className="text-[10px] text-slate-400 font-mono">{rc.overallRubric}</div>
                  </div>
                </div>

                <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase">Class Teacher Remarks:</div>
                  <p className="text-slate-700 italic text-[11px]">"{rc.classTeacherRemarks}"</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-mono text-[11px]">Attendance: {rc.attendanceDays}/{rc.totalSchoolDays} days</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Dean Approved</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
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
          subtitle="Monitor learner clinical attendances, assessment exemptions, exam medical leaves, and doctor recommendations."
        />
      )}

      {/* ========================================================
          TAB 6: REPORTING HUB (MONTHLY, TERMLY, ANNUAL PDF)
          ======================================================== */}
      {activeTab === 'reporting_hub' && (
        <ReportingHub currentUser={currentUser} />
      )}
    </div>
  );
};
