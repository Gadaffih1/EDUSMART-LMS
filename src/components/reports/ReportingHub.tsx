import React, { useState, useMemo } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName, 
  PeriodicReport, 
  ReportCard,
  QuizAttempt,
  PortfolioItem,
  getSubjectsForGrade,
  SubjectName,
  PRIMARY_STREAMS
} from '../../types';
import { Storage } from '../../utils/storage';
import { exportToPdf } from '../../utils/pdfExport';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  User as UserIcon, 
  Users, 
  School, 
  Clock, 
  BarChart3, 
  FolderGit2, 
  CheckSquare, 
  ChevronRight, 
  ArrowDownToLine, 
  Eye, 
  FileSpreadsheet, 
  Check, 
  ShieldCheck,
  Filter,
  Edit2,
  Send,
  X,
  Save
} from 'lucide-react';

interface ReportingHubProps {
  currentUser: User;
  initialStudentId?: string;
  defaultPeriod?: 'Monthly' | 'Termly' | 'Annually';
  onClose?: () => void;
}

export const ReportingHub: React.FC<ReportingHubProps> = ({
  currentUser,
  initialStudentId,
  defaultPeriod = 'Monthly',
  onClose
}) => {
  const isParent = currentUser.role === 'parent';
  const isStudent = currentUser.role === 'student';
  const isTeacher = ['teacher', 'class_teacher', 'hod', 'senior_teacher', 'dean_of_studies', 'curriculum_coordinator', 'head_teacher', 'admin'].includes(currentUser.role);

  // Period Type
  const [periodType, setPeriodType] = useState<'Monthly' | 'Termly' | 'Annually'>(defaultPeriod);
  
  // Specific Period Intervals
  const [selectedMonth, setSelectedMonth] = useState<string>('September 2026');
  const [selectedTerm, setSelectedTerm] = useState<string>('Term 3 (2026)');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Scope: Individual Learner vs Class Aggregate (for Teachers/Deans)
  const [reportScope, setReportScope] = useState<'individual' | 'class_aggregate'>('individual');

  // Grade & Stream Filters
  const allUsers = Storage.getUsers();
  const allStudents = allUsers.filter(u => u.role === 'student');

  // Determine initial grade & stream
  const parentChildren = isParent ? Storage.getParentChildren(currentUser) : [];
  
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(() => {
    if (isStudent && currentUser.grade) return currentUser.grade;
    if (isParent && parentChildren[0]?.grade) return parentChildren[0].grade;
    if (currentUser.grade) return currentUser.grade;
    return 4;
  });

  const [selectedStream, setSelectedStream] = useState<StreamName>(() => {
    if (isStudent && currentUser.stream) return currentUser.stream;
    if (isParent && parentChildren[0]?.stream) return parentChildren[0].stream;
    if (currentUser.stream) return currentUser.stream;
    return 'Dove';
  });

  // Eligible students based on role
  const eligibleStudents = useMemo(() => {
    if (isStudent) {
      return [currentUser];
    }
    if (isParent) {
      return parentChildren;
    }
    // Teachers / Admins: filter by grade & stream
    return allStudents.filter(s => s.grade === selectedGrade && (!selectedStream || s.stream === selectedStream));
  }, [isStudent, isParent, currentUser, parentChildren, allStudents, selectedGrade, selectedStream]);

  // Selected Student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialStudentId) return initialStudentId;
    if (isStudent) return currentUser.id;
    if (isParent && parentChildren[0]) return parentChildren[0].id;
    return 'usr-stu-brian';
  });

  const activeStudent = eligibleStudents.find(s => s.id === selectedStudentId) || eligibleStudents[0] || allStudents[0];

  // Executive Moderation & Republishing Rights (Deputy, Dean, Curriculum Coordinator, Admin, Head Teacher)
  const canRepublishReports = ['deputy_head', 'dean_of_studies', 'curriculum_coordinator', 'head_teacher', 'admin'].includes(currentUser.role);
  const [isExecutiveEditMode, setIsExecutiveEditMode] = useState<boolean>(false);
  const [editedTeacherRemarks, setEditedTeacherRemarks] = useState<string>('');
  const [editedDeanRemarks, setEditedDeanRemarks] = useState<string>('');
  const [editedSubjectRemarks, setEditedSubjectRemarks] = useState<Record<string, string>>({});
  const [republishStamp, setRepublishStamp] = useState<{
    publisherName: string;
    publisherRole: string;
    date: string;
  } | null>(null);
  const [republishToast, setRepublishToast] = useState<string | null>(null);

  // Print Preview state
  const [printMode, setPrintMode] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleSaveAndRepublishDossier = () => {
    if (!aggregatedStudentData) return;

    // Check if report card exists in storage and update
    const reports = Storage.getReportCards(activeStudent.id);
    const existing = reports[0];
    const publisherRoleLabel = currentUser.role === 'deputy_head' ? 'Deputy Head Teacher' :
                               currentUser.role === 'dean_of_studies' ? 'Dean of Studies' :
                               currentUser.role === 'curriculum_coordinator' ? 'Curriculum Coordinator' :
                               currentUser.role === 'admin' ? 'System Administrator' : 'Head Teacher';

    const updatedSubjects = (existing?.subjects || []).map(s => {
      const editedRemark = editedSubjectRemarks[s.subject];
      return editedRemark ? { ...s, remarks: editedRemark } : s;
    });

    const reportId = existing ? existing.id : `rc-${activeStudent.id}-report`;
    Storage.republishReportCard(
      reportId,
      {
        studentId: activeStudent.id,
        studentName: activeStudent.name,
        admissionNumber: activeStudent.admissionNumber || `ADM/2026/0${activeStudent.grade || 4}01`,
        grade: activeStudent.grade || selectedGrade,
        stream: activeStudent.stream || 'Dove',
        classTeacherRemarks: editedTeacherRemarks || existing?.classTeacherRemarks || aggregatedStudentData.teacherRemarks,
        deanRemarks: currentUser.role === 'dean_of_studies' ? (editedDeanRemarks || existing?.deanRemarks) : existing?.deanRemarks,
        deputyRemarks: currentUser.role === 'deputy_head' ? (editedDeanRemarks || existing?.deputyRemarks) : existing?.deputyRemarks,
        curriculumCoordinatorRemarks: currentUser.role === 'curriculum_coordinator' ? (editedDeanRemarks || existing?.curriculumCoordinatorRemarks) : existing?.curriculumCoordinatorRemarks,
        subjects: updatedSubjects.length > 0 ? updatedSubjects : undefined
      },
      currentUser.name,
      publisherRoleLabel,
      `Dossier officially moderated, remarks verified and republished by ${currentUser.name} (${publisherRoleLabel}).`
    );

    setRepublishStamp({
      publisherName: currentUser.name,
      publisherRole: publisherRoleLabel,
      date: new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })
    });

    setRepublishToast(`Dossier write-ups and evaluation remarks successfully republished with ${publisherRoleLabel} official endorsement!`);
    setIsExecutiveEditMode(false);
    setTimeout(() => setRepublishToast(null), 5000);
  };

  // -------------------------------------------------------------
  // DATA AGGREGATION FOR SELECTED STUDENT
  // -------------------------------------------------------------
  const aggregatedStudentData = useMemo(() => {
    if (!activeStudent) return null;

    const studentId = activeStudent.id;
    const grade = activeStudent.grade || selectedGrade;

    // 1. Quizzes
    const attempts = Storage.getQuizAttempts(studentId);
    const avgQuizPct = attempts.length > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length) 
      : 80;

    // 2. Report Cards
    const reportCards = Storage.getReportCards(studentId);
    const primaryRc = reportCards[0];

    // 3. Attendance
    const attSummary = Storage.getStudentAttendanceSummary(studentId);

    // 4. Assignments
    const assignments = Storage.getAssignments(grade);

    // 5. Portfolio
    const portfolio = Storage.getPortfolioItems(studentId);

    // 6. Badges & XP
    const badges = Storage.getBadges();
    const xp = Storage.getTotalXP();

    // 7. Gate passes
    const passes = Storage.getGatePasses().filter(p => p.studentId === studentId);

    // 8. Preset Periodic Reports
    const periodicReports = Storage.getPeriodicReports(studentId, periodType);
    const matchedPeriodic = periodicReports[0];

    // Compute subject breakdown
    const subjects = getSubjectsForGrade(grade);
    const subjectBreakdown = subjects.map((subj, idx) => {
      // Find matching subject from report card or synthesize based on quiz performance
      const rcSubj = primaryRc?.subjects.find(s => s.subject === subj);
      const formativeScore = rcSubj?.openerScore ?? (74 + ((idx * 7) % 21));
      const summativeScore = rcSubj?.endTermScore ?? (76 + ((idx * 5) % 20));
      const meanScore = rcSubj?.total ?? Math.round((formativeScore + summativeScore) / 2);
      
      let rubric: 'Exceeding Expectations' | 'Meeting Expectations' | 'Approaching Expectations' | 'Below Expectations' = 'Meeting Expectations';
      if (meanScore >= 80) rubric = 'Exceeding Expectations';
      else if (meanScore >= 65) rubric = 'Meeting Expectations';
      else if (meanScore >= 50) rubric = 'Approaching Expectations';
      else rubric = 'Below Expectations';

      return {
        subject: subj,
        formativeScore,
        summativeScore,
        meanScore,
        rubric,
        remarks: rubric === 'Exceeding Expectations' ? 'Demonstrates mastery of key competencies.' :
                 rubric === 'Meeting Expectations' ? 'Satisfies strand learning outcomes effectively.' :
                 'Targeted practice required in upcoming study sessions.'
      };
    });

    const overallAcademicMean = Math.round(
      subjectBreakdown.reduce((sum, s) => sum + s.meanScore, 0) / subjectBreakdown.length
    );

    const periodLabel = periodType === 'Monthly' ? `Monthly Progress Digest · ${selectedMonth}` :
                        periodType === 'Termly' ? `Comprehensive CBC Assessment · ${selectedTerm}` :
                        `Annual Academic Dossier · ${selectedYear} Year in Review`;

    return {
      student: activeStudent,
      periodType,
      periodLabel,
      overallAcademicMean: matchedPeriodic?.academicMean || overallAcademicMean,
      attendanceRate: matchedPeriodic?.attendanceRate || attSummary.attendanceRate || 98.4,
      totalMarkedDays: attSummary.totalMarkedDays || 64,
      daysPresent: attSummary.daysPresent || 63,
      daysAbsent: attSummary.daysAbsent || 1,
      quizzesCompleted: attempts.length || 14,
      avgQuizPct,
      assignmentsTurnedIn: assignments.length || 6,
      portfolioProjects: portfolio.length || 3,
      badgesEarned: badges.filter(b => b.unlocked).length || 5,
      totalXP: xp || 560,
      gatePassesCount: passes.length,
      subjectBreakdown,
      coreCompetencies: matchedPeriodic?.coreCompetencies || [
        { name: 'Critical Thinking & Problem Solving', level: 'Exceeding', notes: 'Applies logical deduction across CBC numeracy and integrated science.' },
        { name: 'Communication & Collaboration', level: 'Meeting', notes: 'Listens respectfully, articulates ideas in English and Kiswahili clearly.' },
        { name: 'Creativity & Imagination', level: 'Exceeding', notes: 'Inventive modeling in Creative Arts and agricultural practical strands.' },
        { name: 'Citizenship & Respect', level: 'Exceeding', notes: 'Exemplary compound conduct, digital citizenship, and peer cooperation.' },
        { name: 'Digital Literacy', level: 'Meeting', notes: 'Confidently navigates topical quizzes and anti-download learning resources.' }
      ],
      keyStrengths: matchedPeriodic?.keyStrengths || [
        `High consistency in ${subjectBreakdown[0]?.subject || 'Mathematics'} & Sciences`,
        'Active contributor to e-portfolio projects and practical models',
        'Punctual attendance record with zero unexcused compound departures'
      ],
      supportRecommendations: matchedPeriodic?.supportRecommendations || [
        'Continue regular engagement with digital library supplementary fiction readers',
        'Reinforce revision using EduSmart AI Tutor on challenging topics'
      ],
      teacherRemarks: matchedPeriodic?.teacherRemarks || 
        `${activeStudent.name} exhibits diligent academic habits and commendable moral conduct throughout this evaluation cycle. Well positioned for ongoing curriculum progression.`,
      generatedAt: new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })
    };
  }, [activeStudent, selectedGrade, periodType, selectedMonth, selectedTerm, selectedYear]);

  // -------------------------------------------------------------
  // CLASS AGGREGATE SUMMARY DATA (FOR TEACHERS & DEANS)
  // -------------------------------------------------------------
  const classAggregateData = useMemo(() => {
    const classRoster = allStudents.filter(s => s.grade === selectedGrade && s.stream === selectedStream);
    const subjects = getSubjectsForGrade(selectedGrade);

    const classMean = 79.4;
    const attendanceMean = 97.8;

    const subjectAverages = subjects.map((subj, idx) => ({
      subject: subj,
      meanScore: 76 + ((idx * 4) % 15),
      distinctionCount: Math.max(3, Math.round(classRoster.length * 0.35)),
      remedialCount: Math.max(1, Math.round(classRoster.length * 0.1))
    }));

    return {
      grade: selectedGrade,
      stream: selectedStream,
      totalLearners: classRoster.length || 38,
      classMean,
      attendanceMean,
      periodLabel: periodType === 'Monthly' ? `${selectedMonth} Class Performance Digest` :
                   periodType === 'Termly' ? `${selectedTerm} Summative Class Digest` :
                   `${selectedYear} Annual Academic Review`,
      subjectAverages,
      topPerformers: classRoster.slice(0, 3).map((s, idx) => ({
        name: s.name,
        admission: s.admissionNumber || `ADM/2026/040${idx+1}`,
        mean: 88 - (idx * 2)
      })),
      learnersNeedingSupport: classRoster.slice(-2).map((s) => ({
        name: s.name,
        admission: s.admissionNumber || 'ADM/2026/0419',
        focusArea: 'Fractions & Reading Comprehension'
      }))
    };
  }, [allStudents, selectedGrade, selectedStream, periodType, selectedMonth, selectedTerm, selectedYear]);

  // Handle Export / Download
  const handleDownloadDigitalReport = () => {
    if (!aggregatedStudentData) return;

    const reportContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${aggregatedStudentData.student.name} - ${aggregatedStudentData.periodLabel}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
    .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 24px; }
    .school-title { font-size: 20px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 1px; }
    .report-title { font-size: 24px; font-weight: 900; margin: 6px 0; color: #0f172a; }
    .sub { font-size: 13px; color: #64748b; }
    .bio-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px; font-size: 12px; }
    .kpi-row { display: flex; gap: 12px; margin-bottom: 24px; }
    .kpi-box { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; background: #ffffff; }
    .kpi-val { font-size: 22px; font-weight: 800; color: #0f766e; font-family: monospace; }
    .kpi-lbl { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; }
    .rubric-ee { color: #065f46; font-weight: 700; }
    .rubric-me { color: #1e40af; font-weight: 700; }
    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 8px; letter-spacing: 0.5px; }
    .remarks-box { background: #f8fafc; border-left: 4px solid #047857; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 48px; padding-top: 24px; border-top: 1px dashed #cbd5e1; font-size: 12px; }
    .sig-line { width: 200px; border-top: 1px solid #334155; margin-top: 40px; text-align: center; padding-top: 4px; font-size: 11px; color: #475569; }
  </style>
</head>
<body>
  <div class="header">
    <div style="display: flex; justify-content: center; margin-bottom: 12px;">
      <img src="/edusmart-logo.svg" alt="Edu-Smart PORTAL by Gadsa Systems" style="width: 130px; height: auto;" />
    </div>
    <div class="school-title">Edu-Smart PORTAL · By Gadsa Systems</div>
    <div class="report-title">${aggregatedStudentData.periodLabel}</div>
    <div class="sub">Official Learner Progress Report & Academic Competency Dossier</div>
  </div>

  <div class="bio-grid">
    <div><strong>Learner:</strong> ${aggregatedStudentData.student.name}</div>
    <div><strong>Admission No:</strong> ${aggregatedStudentData.student.admissionNumber || 'ADM/2026/0412'}</div>
    <div><strong>Grade:</strong> Grade ${aggregatedStudentData.student.grade} (${aggregatedStudentData.student.stream} Stream)</div>
    <div><strong>Date Generated:</strong> ${aggregatedStudentData.generatedAt}</div>
  </div>

  <div class="kpi-row">
    <div class="kpi-box">
      <div class="kpi-val">${aggregatedStudentData.overallAcademicMean}%</div>
      <div class="kpi-lbl">Academic Mean</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val">${aggregatedStudentData.attendanceRate}%</div>
      <div class="kpi-lbl">Attendance Rate</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val">${aggregatedStudentData.quizzesCompleted}</div>
      <div class="kpi-lbl">Quizzes Taken</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val">${aggregatedStudentData.totalXP} BP</div>
      <div class="kpi-lbl">Badges & Bonus Points (BP)</div>
    </div>
  </div>

  <div class="section-title">1. Multi-Subject CBC Academic Competency Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Subject / Learning Area</th>
        <th>Formative Score</th>
        <th>Summative Score</th>
        <th>Overall %</th>
        <th>Competency Rubric</th>
        <th>Teacher Observation</th>
      </tr>
    </thead>
    <tbody>
      ${aggregatedStudentData.subjectBreakdown.map(s => `
        <tr>
          <td><strong>${s.subject}</strong></td>
          <td>${s.formativeScore}%</td>
          <td>${s.summativeScore}%</td>
          <td><strong>${s.meanScore}%</strong></td>
          <td><span class="${s.rubric.includes('Exceeding') ? 'rubric-ee' : 'rubric-me'}">${s.rubric}</span></td>
          <td>${s.remarks}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">2. CBC Core Competencies Evaluation</div>
  <table>
    <thead>
      <tr>
        <th>Competency Dimension</th>
        <th>Achievement Level</th>
        <th>Observable Evidence & Notes</th>
      </tr>
    </thead>
    <tbody>
      ${aggregatedStudentData.coreCompetencies.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td><strong>${c.level} Expectations</strong></td>
          <td>${c.notes}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">3. Class Teacher & Administration Remarks</div>
  <div class="remarks-box">
    <p><strong>Qualitative Evaluation:</strong> ${aggregatedStudentData.teacherRemarks}</p>
    <p><strong>Key Strengths:</strong> ${aggregatedStudentData.keyStrengths.join('; ')}</p>
    <p><strong>Support & Growth Recommendations:</strong> ${aggregatedStudentData.supportRecommendations.join('; ')}</p>
  </div>

  <div class="signatures">
    <div>
      <div>Class Teacher: <strong>Mr. David Kiprono</strong></div>
      <div class="sig-line">Signature & Date</div>
    </div>
    <div>
      <div>Dean of Studies / Head Teacher: <strong>Mr. Charles Omondi</strong></div>
      <div class="sig-line">Institutional Stamp & Signature</div>
    </div>
    <div>
      <div>Parent / Guardian Acknowledgement:</div>
      <div class="sig-line">Parent / Guardian Signature</div>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([reportContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EduSmart-Report-${aggregatedStudentData.student.name.replace(/\s+/g, '_')}-${periodType}-${selectedMonth || selectedTerm}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess('Digital Summary Report downloaded successfully!');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="space-y-6">
      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Main Hub Control Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <EduSmartGadsaLogo variant="horizontal" size="xs" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">· Centralized Reporting Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Academic Performance & Periodic Progress Dossiers
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Aggregate student data across quizzes, assignments, termly exams, and attendance. Generate downloadable PDF and digital summary reports on a monthly, termly, and annual basis for parents and teachers.
          </p>
        </div>

        {/* Global Hub Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const docTitle = aggregatedStudentData 
                ? `EduSmart_${aggregatedStudentData.student.name.replace(/\s+/g, '_')}_Progress_Dossier`
                : `EduSmart_Grade${selectedGrade}_Class_Performance_Report`;
              exportToPdf({
                title: docTitle,
                orientation: reportScope === 'individual' ? 'portrait' : 'landscape'
              });
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={handleDownloadDigitalReport}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            title="Download Standalone Digital Report"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Download Digital Summary</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Controls Bar: Period Granularity, Roster Selectors */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Period Granularity Selector (Monthly, Termly, Annually) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Interval:</span>
            </span>
            {(['Monthly', 'Termly', 'Annually'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setPeriodType(period)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  periodType === period
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {period === 'Monthly' && 'Monthly Progress'}
                {period === 'Termly' && 'Termly Assessment'}
                {period === 'Annually' && 'Annual Review'}
              </button>
            ))}
          </div>

          {/* Sub-Interval Pickers */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {periodType === 'Monthly' && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="September 2026">September 2026</option>
                  <option value="October 2026">October 2026</option>
                  <option value="November 2026">November 2026</option>
                </select>
              </div>
            )}

            {periodType === 'Termly' && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Academic Term:</span>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Term 1 (2026)">Term 1 (2026)</option>
                  <option value="Term 2 (2026)">Term 2 (2026)</option>
                  <option value="Term 3 (2026)">Term 3 (2026)</option>
                </select>
              </div>
            )}

            {periodType === 'Annually' && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">School Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="2026">2026 Academic Year</option>
                  <option value="2025">2025 Retrospective</option>
                </select>
              </div>
            )}

            {/* Scope toggle for teachers */}
            {isTeacher && (
              <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg ml-2">
                <button
                  onClick={() => setReportScope('individual')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                    reportScope === 'individual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Student Dossier
                </button>
                <button
                  onClick={() => setReportScope('class_aggregate')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                    reportScope === 'class_aggregate' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Class Aggregate
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Student Selector Row */}
        {reportScope === 'individual' && (
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {isTeacher && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">Grade:</span>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">Stream:</span>
                    <select
                      value={selectedStream}
                      onChange={(e) => setSelectedStream(e.target.value as StreamName)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                    >
                      {PRIMARY_STREAMS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">
                  {isParent ? 'Select Child:' : 'Select Learner:'}
                </span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {eligibleStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.admissionNumber || 'ADM/2026'}) · Gr {st.grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Status: Formative & Continuous Assessment Verified
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          RENDER: INDIVIDUAL LEARNER PROGRESS DOSSIER
          ======================================================== */}
      {reportScope === 'individual' && aggregatedStudentData && (
        <div className="space-y-4">
          {/* Executive Moderation & Republishing Bar (Deputy, Dean, Admin) */}
          {canRepublishReports && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-400/30">
                      {currentUser.role.replace('_', ' ').toUpperCase()} CLEARANCE
                    </span>
                    <span className="text-xs font-bold text-slate-300">Executive Moderation Rights Active</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    You have authoritative rights to edit teacher remarks, revise qualitative write-ups, and republish this official dossier.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setIsExecutiveEditMode(!isExecutiveEditMode);
                    if (!editedTeacherRemarks) {
                      setEditedTeacherRemarks(aggregatedStudentData.teacherRemarks);
                    }
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isExecutiveEditMode
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isExecutiveEditMode ? 'Exit Edit Mode' : 'Edit Remarks & Write-Ups'}</span>
                </button>

                <button
                  onClick={handleSaveAndRepublishDossier}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Authoritatively republish this official dossier to student and parent portals"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save & Republish Dossier</span>
                </button>
              </div>
            </div>
          )}

          {republishToast && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-bold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{republishToast}</span>
              </div>
              <button onClick={() => setRepublishToast(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Official Republished Seal Banner */}
          {republishStamp && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                    <span>OFFICIALLY REPUBLISHED & ENDORSED DOSSIER</span>
                    <span className="bg-emerald-200 text-emerald-950 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      Institutional Seal
                    </span>
                  </div>
                  <div className="text-xs text-emerald-800 mt-0.5 font-medium">
                    Moderated and republished by <strong>{republishStamp.publisherName}</strong> ({republishStamp.publisherRole}) on {republishStamp.date}.
                  </div>
                </div>
              </div>
              <div className="text-right font-mono text-[11px] text-emerald-800">
                Verified Official Release
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden printable-report">
          {/* Letterhead Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs shrink-0">
                <EduSmartGadsaLogo variant="horizontal" size="sm" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                  Competency-Based Curriculum (CBC) Progress Record
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {aggregatedStudentData.periodLabel}
                </h3>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Official Academic Competency Dossier · Generated on {aggregatedStudentData.generatedAt}
                </div>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400 font-bold uppercase">Overall Mean</div>
                <div className="text-2xl font-black font-mono text-emerald-700">
                  {aggregatedStudentData.overallAcademicMean}%
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-right">
                <div className="text-xs text-slate-400 font-bold uppercase">Attendance</div>
                <div className="text-2xl font-black font-mono text-blue-700">
                  {aggregatedStudentData.attendanceRate}%
                </div>
              </div>
            </div>
          </div>

          {/* Student Bio Ribbon */}
          <div className="bg-slate-100/70 px-6 py-3 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Learner Name</span>
              <span className="font-bold text-slate-900">{aggregatedStudentData.student.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Admission Number</span>
              <span className="font-mono font-bold text-slate-800">{aggregatedStudentData.student.admissionNumber || 'ADM/2026/0412'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Grade & Stream</span>
              <span className="font-bold text-emerald-800">
                Grade {aggregatedStudentData.student.grade} ({aggregatedStudentData.student.stream || 'Dove'})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Class Teacher</span>
              <span className="font-semibold text-slate-700">Mr. David Kiprono (TSC/23491)</span>
            </div>
          </div>

          {/* High-Level Continuous Assessment Metrics Cards */}
          <div className="p-6 border-b border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Continuous Quizzes</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {aggregatedStudentData.quizzesCompleted} Taken
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">{aggregatedStudentData.avgQuizPct}% Avg Accuracy</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Roll Call Record</div>
                <div className="text-xl font-bold font-mono text-blue-700 mt-1">
                  {aggregatedStudentData.daysPresent} / {aggregatedStudentData.totalMarkedDays} Days
                </div>
                <div className="text-[11px] text-slate-500">{aggregatedStudentData.daysAbsent} Days Absent</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Assignments</div>
                <div className="text-xl font-bold font-mono text-purple-700 mt-1">
                  {aggregatedStudentData.assignmentsTurnedIn} Submitted
                </div>
                <div className="text-[11px] text-purple-600 font-semibold">100% On-time</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Practical Projects</div>
                <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                  {aggregatedStudentData.portfolioProjects} E-Portfolio
                </div>
                <div className="text-[11px] text-indigo-600 font-semibold">Models & Artifacts</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                <div className="text-[10px] uppercase font-bold text-slate-500">Recognition & Badges</div>
                <div className="text-xl font-bold font-mono text-amber-600 mt-1">
                  {aggregatedStudentData.totalXP} BP
                </div>
                <div className="text-[11px] text-amber-700 font-semibold">{aggregatedStudentData.badgesEarned} Badges Unlocked</div>
              </div>
            </div>
          </div>

          {/* Section 1: Subject Performance Breakdown */}
          <div className="p-6 border-b border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                <span>1. Multi-Subject CBC Academic Competency Matrix</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Grading: EE (&gt;80%) · ME (65-79%) · AE (50-64%) · BE (&lt;50%)
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Subject / Learning Area</th>
                    <th className="py-2.5 px-3 text-center">Formative Assessment (40%)</th>
                    <th className="py-2.5 px-3 text-center">Summative Exam (60%)</th>
                    <th className="py-2.5 px-3 text-center">Overall Mean</th>
                    <th className="py-2.5 px-3 text-center">CBC Rubric Level</th>
                    <th className="py-2.5 px-3">Teacher Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {aggregatedStudentData.subjectBreakdown.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 font-sans">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.subject}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{s.formativeScore}%</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{s.summativeScore}%</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-800 text-sm">
                        {s.meanScore}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          s.rubric === 'Exceeding Expectations' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          s.rubric === 'Meeting Expectations' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {s.rubric === 'Exceeding Expectations' ? 'EE' :
                           s.rubric === 'Meeting Expectations' ? 'ME' : 'AE'} ({s.rubric.split(' ')[0]})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-xs italic">
                        {isExecutiveEditMode ? (
                          <input
                            type="text"
                            value={editedSubjectRemarks[s.subject] ?? s.remarks}
                            onChange={(e) => setEditedSubjectRemarks(prev => ({ ...prev, [s.subject]: e.target.value }))}
                            className="w-full px-2 py-1 text-xs border border-amber-300 rounded bg-amber-50/70 text-slate-900 font-normal focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="Edit teacher remarks..."
                          />
                        ) : (
                          editedSubjectRemarks[s.subject] ?? s.remarks
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Core Competencies Evaluation */}
          <div className="p-6 border-b border-slate-200 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>2. CBC Core Competencies Achievement</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aggregatedStudentData.coreCompetencies.map((comp, cIdx) => (
                <div key={cIdx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{comp.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-100 text-emerald-800">
                      {comp.level} Expectations
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{comp.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Qualitative Evaluation, Strengths & Growth Areas */}
          <div className="p-6 border-b border-slate-200 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>3. Qualitative Insights & Pedagogical Recommendations</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2 text-xs">
                <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Demonstrated Strengths & Milestones</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  {aggregatedStudentData.keyStrengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 text-xs">
                <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Support & Extension Recommendations</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  {aggregatedStudentData.supportRecommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

            {isExecutiveEditMode ? (
              <div className="p-4 bg-amber-50/80 rounded-xl border-2 border-amber-300 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase">
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Executive Write-Ups Moderation ({currentUser.role.replace('_', ' ').toUpperCase()})</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    Active Edit Session
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900">
                    Class Teacher Summative Verdict & General Conduct Write-Up:
                  </label>
                  <textarea
                    rows={3}
                    value={editedTeacherRemarks || aggregatedStudentData.teacherRemarks}
                    onChange={(e) => setEditedTeacherRemarks(e.target.value)}
                    className="w-full p-2.5 text-xs border border-amber-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-normal"
                    placeholder="Enter official teacher qualitative verdict..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {currentUser.role === 'deputy_head' ? 'Deputy Head Pastoral & Disciplinary Endorsement:' :
                       currentUser.role === 'dean_of_studies' ? 'Dean of Studies Academic Endorsement Write-Up:' :
                       'Executive Moderation Institutional Endorsement Write-Up:'}
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={editedDeanRemarks}
                    onChange={(e) => setEditedDeanRemarks(e.target.value)}
                    className="w-full p-2.5 text-xs border border-blue-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-normal"
                    placeholder={`Enter ${currentUser.role === 'deputy_head' ? 'pastoral review, decorum and conduct recommendation' : 'academic mastery, CBC competencies and progression verdict'}...`}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">Class Teacher Summative Verdict:</span>
                  <p className="text-slate-700 italic leading-relaxed">
                    "{editedTeacherRemarks || aggregatedStudentData.teacherRemarks}"
                  </p>
                </div>

                {(editedDeanRemarks || (Storage.getReportCards(activeStudent.id)[0]?.deanRemarks || Storage.getReportCards(activeStudent.id)[0]?.deputyRemarks)) && (
                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-1">
                    <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Executive Moderation Endorsement (Dean / Deputy):</span>
                    </span>
                    <p className="text-blue-950 italic leading-relaxed">
                      "{editedDeanRemarks || Storage.getReportCards(activeStudent.id)[0]?.deanRemarks || Storage.getReportCards(activeStudent.id)[0]?.deputyRemarks}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Formal Sign-off Section (Printable Signature Lines) */}
          <div className="p-6 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-slate-600">
            <div className="space-y-1">
              <div className="font-bold text-slate-900">Class Teacher: Mr. David Kiprono</div>
              <div className="text-[11px] text-slate-500">TSC Registration: TSC/23491/ED</div>
              <div className="pt-6 border-t border-slate-300 w-44 text-[10px] text-slate-400 uppercase font-mono">
                Teacher Signature & Stamp
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-900">Head Teacher: Mr. Charles Omondi</div>
              <div className="text-[11px] text-slate-500">Dean of Studies Oversight Approved</div>
              <div className="pt-6 border-t border-slate-300 w-44 text-[10px] text-slate-400 uppercase font-mono">
                Institutional Seal & Date
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-900">Parent / Guardian Acknowledgement</div>
              <div className="text-[11px] text-slate-500">Physical or Digital Signature</div>
              <div className="pt-6 border-t border-slate-300 w-44 text-[10px] text-slate-400 uppercase font-mono">
                Guardian Signature
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================
          RENDER: CLASS AGGREGATE SUMMARY (TEACHERS / DEANS)
          ======================================================== */}
      {reportScope === 'class_aggregate' && classAggregateData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden printable-report space-y-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs shrink-0">
                <EduSmartGadsaLogo variant="horizontal" size="sm" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                  Class Academic Digest · Grade {classAggregateData.grade} ({classAggregateData.stream} Stream)
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {classAggregateData.periodLabel}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Aggregated performance across {classAggregateData.totalLearners} enrolled learners
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400 font-bold uppercase">Class Mean</div>
                <div className="text-2xl font-black font-mono text-emerald-700">
                  {classAggregateData.classMean}%
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-right">
                <div className="text-xs text-slate-400 font-bold uppercase">Mean Attendance</div>
                <div className="text-2xl font-black font-mono text-blue-700">
                  {classAggregateData.attendanceMean}%
                </div>
              </div>
            </div>
          </div>

          {/* Subject Averages Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Learning Area Performance Distribution
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Class Mean</th>
                    <th className="py-2.5 px-3 text-center">Distinction (EE)</th>
                    <th className="py-2.5 px-3 text-center">Remedial Focus (AE/BE)</th>
                    <th className="py-2.5 px-3">Curriculum Progress Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {classAggregateData.subjectAverages.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 font-sans">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.subject}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">{s.meanScore}%</td>
                      <td className="py-2.5 px-3 text-center font-mono text-blue-700">{s.distinctionCount} Learners</td>
                      <td className="py-2.5 px-3 text-center font-mono text-amber-700">{s.remedialCount} Learners</td>
                      <td className="py-2.5 px-3 text-xs text-slate-600">
                        {s.meanScore >= 78 ? 'Satisfies KICD strand targets' : 'Reinforcement clinics ongoing'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Performers and Remedial Support Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-3">
              <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>Top Stream Performers Commendation</span>
              </span>
              <div className="space-y-2">
                {classAggregateData.topPerformers.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-100">
                    <div>
                      <div className="font-bold text-slate-900">{idx+1}. {p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.admission}</div>
                    </div>
                    <span className="font-mono font-extrabold text-emerald-700 text-sm">{p.mean}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-3">
              <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-700" />
                <span>Learners Flagged for Peer Support / Clinics</span>
              </span>
              <div className="space-y-2">
                {classAggregateData.learnersNeedingSupport.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-100">
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.admission}</div>
                    </div>
                    <span className="text-[11px] text-amber-800 font-medium">{p.focusArea}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
