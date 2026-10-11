import React, { useState, useEffect } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName,
  SubjectName, 
  ReportCard,
  CurriculumWrittenReport,
  CurriculumReportComment,
  PRIMARY_SUBJECTS,
  JUNIOR_SUBJECTS
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  FileText, 
  Edit3, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Send, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Check, 
  Clock, 
  Calendar, 
  FileSpreadsheet,
  Building2,
  ChevronRight,
  Eye,
  Sliders,
  RotateCcw
} from 'lucide-react';

interface CurriculumReportWriterModuleProps {
  currentUser: User;
}

export const CurriculumReportWriterModule: React.FC<CurriculumReportWriterModuleProps> = ({ currentUser }) => {
  const [subTab, setSubTab] = useState<'write_reports' | 'report_cards_moderation'>('write_reports');
  const [writtenReports, setWrittenReports] = useState<CurriculumWrittenReport[]>(() => Storage.getCurriculumWrittenReports());
  const [reportCards, setReportCards] = useState<ReportCard[]>(() => Storage.getReportCards());
  const [allUsers, setAllUsers] = useState<User[]>(() => Storage.getUsers());

  // Filter state for written reports
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<number>(2);
  const [searchReportQuery, setSearchReportQuery] = useState('');

  // Modals for Written Reports
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<CurriculumWrittenReport | null>(null);
  const [activeReportDetail, setActiveReportDetail] = useState<CurriculumWrittenReport | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Form State for Writing New / Editing Report
  const [formTitle, setFormTitle] = useState('');
  const [formReportType, setFormReportType] = useState<CurriculumWrittenReport['reportType']>('Curriculum Implementation');
  const [formGrade, setFormGrade] = useState<GradeLevel | 'All Grades'>('All Grades');
  const [formTerm, setFormTerm] = useState<1 | 2 | 3>(2);
  const [formSummary, setFormSummary] = useState('');
  const [formFindings, setFormFindings] = useState<string[]>(['']);
  const [formRecommendations, setFormRecommendations] = useState<string[]>(['']);
  const [formStatus, setFormStatus] = useState<'draft' | 'published' | 'submitted_to_bom'>('published');

  // Filter state for Report Cards Moderation
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(4);
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  // Modal for Moderating Individual Report Card Comments
  const [moderatingReport, setModeratingReport] = useState<ReportCard | null>(null);
  const [modClassRemarks, setModClassRemarks] = useState('');
  const [modCoordinatorRemarks, setModCoordinatorRemarks] = useState('');
  const [modSubjectRemarks, setModSubjectRemarks] = useState<{ subject: SubjectName; remarks: string }[]>([]);

  // Batch Comment Modal
  const [isBatchCommentModalOpen, setIsBatchCommentModalOpen] = useState(false);
  const [batchCommentText, setBatchCommentText] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleReportsUpdate = () => setWrittenReports(Storage.getCurriculumWrittenReports());
    const handleCardsUpdate = () => setReportCards(Storage.getReportCards());
    const handleUsersUpdate = () => setAllUsers(Storage.getUsers());

    window.addEventListener('curriculum-written-reports-updated', handleReportsUpdate);
    window.addEventListener('report-cards-updated', handleCardsUpdate);
    window.addEventListener('users-updated', handleUsersUpdate);

    return () => {
      window.removeEventListener('curriculum-written-reports-updated', handleReportsUpdate);
      window.removeEventListener('report-cards-updated', handleCardsUpdate);
      window.removeEventListener('users-updated', handleUsersUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // -------------------------------------------------------------
  // WRITTEN REPORTS LOGIC
  // -------------------------------------------------------------
  const filteredWrittenReports = writtenReports.filter(r => {
    const matchesType = filterType === 'all' || r.reportType === filterType;
    const matchesTerm = r.term === filterTerm;
    const matchesSearch = !searchReportQuery.trim() || 
      r.title.toLowerCase().includes(searchReportQuery.toLowerCase()) ||
      r.executiveSummary.toLowerCase().includes(searchReportQuery.toLowerCase()) ||
      r.authorName.toLowerCase().includes(searchReportQuery.toLowerCase());
    return matchesType && matchesTerm && matchesSearch;
  });

  const handleOpenWriteModal = (report?: CurriculumWrittenReport) => {
    if (report) {
      setEditingReport(report);
      setFormTitle(report.title);
      setFormReportType(report.reportType);
      setFormGrade(report.targetGrade || 'All Grades');
      setFormTerm(report.term);
      setFormSummary(report.executiveSummary);
      setFormFindings(report.keyFindings.length > 0 ? report.keyFindings : ['']);
      setFormRecommendations(report.recommendations.length > 0 ? report.recommendations : ['']);
      setFormStatus(report.status);
    } else {
      setEditingReport(null);
      setFormTitle('');
      setFormReportType('Curriculum Implementation');
      setFormGrade('All Grades');
      setFormTerm(2);
      setFormSummary('');
      setFormFindings(['Syllabus pacing across primary streams shows high alignment.', 'Junior secondary science lab practicals running on schedule.']);
      setFormRecommendations(['Organize catch-up blocks for lagging sub-strands.', 'Standardize formative rubric benchmarks.']);
      setFormStatus('published');
    }
    setIsWriteModalOpen(true);
  };

  const handleSaveWrittenReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSummary.trim()) {
      showToast('Please provide a report title and executive summary.');
      return;
    }

    const cleanFindings = formFindings.map(f => f.trim()).filter(Boolean);
    const cleanRecs = formRecommendations.map(r => r.trim()).filter(Boolean);

    if (editingReport) {
      Storage.updateCurriculumWrittenReport(editingReport.id, {
        title: formTitle.trim(),
        reportType: formReportType,
        targetGrade: formGrade,
        term: formTerm,
        executiveSummary: formSummary.trim(),
        keyFindings: cleanFindings,
        recommendations: cleanRecs,
        status: formStatus,
        publishedAt: formStatus === 'published' ? new Date().toISOString() : editingReport.publishedAt
      });
      showToast(`Curriculum report "${formTitle}" successfully updated!`);
    } else {
      const newReport: CurriculumWrittenReport = {
        id: `c-rep-${Date.now()}`,
        title: formTitle.trim(),
        reportType: formReportType,
        targetGrade: formGrade,
        term: formTerm,
        academicYear: 2026,
        authorName: currentUser.name,
        authorRole: 'Curriculum Coordinator',
        executiveSummary: formSummary.trim(),
        keyFindings: cleanFindings,
        recommendations: cleanRecs,
        qualitativeComments: [
          {
            id: `comm-init-${Date.now()}`,
            author: currentUser.name,
            authorRole: 'Curriculum Coordinator',
            comment: 'Report officially authored and certified by Curriculum Directorate.',
            createdAt: new Date().toISOString()
          }
        ],
        status: formStatus,
        createdAt: new Date().toISOString(),
        publishedAt: formStatus === 'published' ? new Date().toISOString() : undefined
      };
      Storage.addCurriculumWrittenReport(newReport);
      showToast(`New curriculum report "${formTitle}" authored and published!`);
    }

    setIsWriteModalOpen(false);
  };

  const handleDeleteReport = (id: string, title: string) => {
    if (confirm(`Are you sure you want to remove the report "${title}"?`)) {
      Storage.deleteCurriculumWrittenReport(id);
      if (activeReportDetail?.id === id) setActiveReportDetail(null);
      showToast(`Report "${title}" removed.`);
    }
  };

  // Comments on Written Reports: Add, Edit, Remove
  const handleAddCommentToReport = (reportId: string) => {
    if (!newCommentText.trim()) return;
    Storage.addCommentToCurriculumReport(reportId, {
      author: currentUser.name,
      authorRole: 'Curriculum Coordinator',
      comment: newCommentText.trim()
    });
    setNewCommentText('');
    // refresh active report detail
    const updatedList = Storage.getCurriculumWrittenReports();
    const updated = updatedList.find(r => r.id === reportId);
    if (updated) setActiveReportDetail(updated);
    showToast('Comment added to curriculum report!');
  };

  const handleRemoveCommentFromReport = (reportId: string, commentId: string) => {
    if (confirm('Remove this comment from the report?')) {
      Storage.removeCommentFromCurriculumReport(reportId, commentId);
      const updatedList = Storage.getCurriculumWrittenReports();
      const updated = updatedList.find(r => r.id === reportId);
      if (updated) setActiveReportDetail(updated);
      showToast('Comment removed.');
    }
  };

  const handleSaveEditComment = (reportId: string, commentId: string) => {
    if (!editingCommentText.trim()) return;
    Storage.editCommentInCurriculumReport(reportId, commentId, editingCommentText.trim());
    setEditingCommentId(null);
    setEditingCommentText('');
    const updatedList = Storage.getCurriculumWrittenReports();
    const updated = updatedList.find(r => r.id === reportId);
    if (updated) setActiveReportDetail(updated);
    showToast('Comment updated!');
  };

  // -------------------------------------------------------------
  // REPORT CARDS MODERATION & COMMENTS LOGIC
  // -------------------------------------------------------------
  const studentsInGrade = allUsers.filter(u => u.role === 'student' && u.grade === selectedGrade);
  const filteredStudents = studentsInGrade.filter(s => {
    const matchesStream = selectedStream === 'all' || s.stream === selectedStream;
    const matchesSearch = !searchStudentQuery.trim() || 
      s.name.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
      (s.admissionNumber || '').toLowerCase().includes(searchStudentQuery.toLowerCase());
    return matchesStream && matchesSearch;
  });

  const handleOpenModerateCard = (student: User) => {
    const existing = reportCards.find(r => r.studentId === student.id) || {
      id: `rc-${student.id}-gen`,
      studentId: student.id,
      studentName: student.name,
      admissionNumber: student.admissionNumber || `ADM/2026/0${student.grade || 4}01`,
      grade: student.grade || 4,
      stream: student.stream || 'Dove',
      term: 'Term 2' as any,
      academicYear: 2026,
      subjects: [
        { subject: 'Mathematics' as SubjectName, openerScore: 78, midTermScore: 82, endTermScore: 84, total: 82, gradeLetter: 'B' as const, rubricLevel: 'Meeting Expectations' as const, remarks: 'Good analytical reasoning and consistent effort.', teacherName: 'Ms. Sarah Mwangi' },
        { subject: 'Integrated Science' as SubjectName, openerScore: 80, midTermScore: 85, endTermScore: 88, total: 85, gradeLetter: 'A' as const, rubricLevel: 'Exceeding Expectations' as const, remarks: 'Strong laboratory inquiry and practical curiosity.', teacherName: 'Mr. David Omondi' },
        { subject: 'Computer Studies' as SubjectName, openerScore: 88, midTermScore: 92, endTermScore: 94, total: 92, gradeLetter: 'A' as const, rubricLevel: 'Exceeding Expectations' as const, remarks: 'Demonstrates exemplary Scratch algorithm mastery.', teacherName: 'Mr. John Kamau' }
      ],
      overallAverage: 86,
      overallRubric: 'Exceeding Expectations' as const,
      streamPosition: 3,
      totalStudentsInStream: 42,
      attendanceDays: 49,
      totalSchoolDays: 50,
      nextTermBegins: '2027-01-05',
      classTeacherRemarks: 'Well-mannered, diligent learner showing steady mastery of core CBC concepts.',
      headTeacherRemarks: 'Commended for outstanding performance and conduct.',
      curriculumCoordinatorRemarks: 'Curriculum Directorate Endorsement: Learner displays strong acquisition of CBC core competencies and practical skills.'
    };

    setModeratingReport(existing);
    setModClassRemarks(existing.classTeacherRemarks || '');
    setModCoordinatorRemarks(existing.curriculumCoordinatorRemarks || 'Curriculum Directorate Endorsement: Learner displays strong acquisition of CBC core competencies and practical skills.');
    setModSubjectRemarks((existing.subjects || []).map(s => ({
      subject: s.subject,
      remarks: s.remarks || ''
    })));
  };

  const handleSaveModerateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingReport) return;

    const updatedSubjects = (moderatingReport.subjects || []).map(s => {
      const match = modSubjectRemarks.find(m => m.subject === s.subject);
      return match ? { ...s, remarks: match.remarks } : s;
    });

    Storage.republishReportCard(
      moderatingReport.id,
      {
        studentId: moderatingReport.studentId,
        studentName: moderatingReport.studentName,
        admissionNumber: moderatingReport.admissionNumber,
        grade: moderatingReport.grade,
        stream: moderatingReport.stream,
        classTeacherRemarks: modClassRemarks.trim(),
        curriculumCoordinatorRemarks: modCoordinatorRemarks.trim(),
        subjects: updatedSubjects,
        publicationStatus: 'Republished',
        republishedRole: 'Curriculum Coordinator'
      },
      currentUser.name,
      'Curriculum Coordinator (Executive Leadership)',
      `Report qualitative write-ups and teacher comments moderated, verified, and republished by ${currentUser.name}.`
    );

    setReportCards(Storage.getReportCards());
    setModeratingReport(null);
    showToast(`Report Card comments moderated and republished for ${moderatingReport.studentName}!`);
  };

  // Quick Preset Comments
  const quickCommentPresets = [
    'Demonstrates commendable mastery of CBC core competencies and active collaborative participation.',
    'Shows consistent application in inquiry-based practical tasks; encouraged to practice problem-solving speed.',
    'Exemplary analytical reasoning, high creativity, and self-directed project execution.',
    'Requires targeted remedial scaffolding in quantitative calculations and fraction models.',
    'Displays exceptional digital literacy, algorithmic curiosity, and peer mentorship in computer lab sessions.'
  ];

  // Batch Comment Apply
  const handleApplyBatchComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchCommentText.trim()) return;

    filteredStudents.forEach(stu => {
      const existing = reportCards.find(r => r.studentId === stu.id);
      const reportId = existing ? existing.id : `rc-${stu.id}-batch`;
      Storage.republishReportCard(
        reportId,
        {
          studentId: stu.id,
          studentName: stu.name,
          admissionNumber: stu.admissionNumber || `ADM/2026/0${stu.grade || 4}01`,
          grade: stu.grade || selectedGrade,
          stream: stu.stream || 'Dove',
          curriculumCoordinatorRemarks: batchCommentText.trim(),
          publicationStatus: 'Republished',
          republishedRole: 'Curriculum Coordinator'
        },
        currentUser.name,
        'Curriculum Coordinator',
        `Curriculum Coordinator standardized endorsement applied to Grade ${selectedGrade}.`
      );
    });

    setReportCards(Storage.getReportCards());
    setIsBatchCommentModalOpen(false);
    setBatchCommentText('');
    showToast(`Batch comment applied to ${filteredStudents.length} student report cards in Grade ${selectedGrade}!`);
  };

  return (
    <div className="space-y-5">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold bg-slate-900 text-white border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Executive Curriculum Directorate
            </span>
            <span className="text-xs font-bold text-slate-500">
              Report Authoring & Qualitative Comment Moderation Studio
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-600" />
            <span>Curriculum Report Authoring & Comment Moderation Desk</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Empowers the Curriculum Coordinator to author official institutional reports, edit/add/remove qualitative comments on student report cards, and add discussion remarks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => handleOpenWriteModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Curriculum Report</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print / Export</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB TOGGLE: WRITE REPORTS vs REPORT CARDS MODERATION */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setSubTab('write_reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'write_reports' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>1. Authored Curriculum Reports ({writtenReports.length})</span>
        </button>

        <button
          onClick={() => setSubTab('report_cards_moderation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            subTab === 'report_cards_moderation' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>2. Moderate Student Report Comments & Write-Ups</span>
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: WRITE REPORTS & QUALITATIVE REPORT COMMENTS
          ======================================================== */}
      {subTab === 'write_reports' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search authored reports, topics..."
                  value={searchReportQuery}
                  onChange={(e) => setSearchReportQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 w-56 sm:w-64 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Term:</span>
                <select
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(Number(e.target.value) as any)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700"
                >
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700"
                >
                  <option value="all">All Report Types</option>
                  <option value="Curriculum Implementation">Curriculum Implementation</option>
                  <option value="Syllabus Pacing & Audit">Syllabus Pacing & Audit</option>
                  <option value="CBA Moderation & Attainment">CBA Moderation & Attainment</option>
                  <option value="Departmental Faculty Review">Departmental Faculty Review</option>
                  <option value="BoM Executive Briefing">BoM Executive Briefing</option>
                  <option value="Remedial & Special Intervention">Remedial & Special Intervention</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing {filteredWrittenReports.length} authored reports
            </div>
          </div>

          {/* Written Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWrittenReports.map((report) => {
              const commentsCount = report.qualitativeComments?.length || 0;

              return (
                <div 
                  key={report.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {report.reportType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        report.status === 'published' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        report.status === 'submitted_to_bom' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {report.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-snug">{report.title}</h3>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Term {report.term}, 2026 · Target: {report.targetGrade === 'All Grades' ? 'All Grades (1-9)' : `Grade ${report.targetGrade}`}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {report.executiveSummary}
                    </p>

                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>Author: <strong className="text-slate-700">{report.authorName}</strong></span>
                      <span className="flex items-center gap-1 text-indigo-600 font-bold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{commentsCount} comments</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setActiveReportDetail(report)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View & Comments</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenWriteModal(report)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Report Content"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id, report.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: MODERATE STUDENT REPORT COMMENTS & WRITE-UPS
          ======================================================== */}
      {subTab === 'report_cards_moderation' && (
        <div className="space-y-4">
          
          {/* Grade & Stream Selector Ribbon */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Select Grade:</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Stream:</span>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="all">All Streams</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="Dove">Dove</option>
                  <option value="Eagle">Eagle</option>
                  <option value="Falcon">Falcon</option>
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter student name or ADM..."
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium w-48 sm:w-56"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBatchCommentModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Batch Apply Coordinator Remark</span>
              </button>
            </div>
          </div>

          {/* Student Report Cards List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Grade {selectedGrade} Learner Dossiers & Qualitative Feedback Comments
                </h3>
                <p className="text-xs text-slate-500">
                  Click 'Edit Comments' on any learner to edit, add, or clear class teacher write-ups, subject remarks, and Curriculum Coordinator endorsements.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                {filteredStudents.length} Learners Found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Learner Info</th>
                    <th className="py-3 px-3">Stream & Rank</th>
                    <th className="py-3 px-3">Class Teacher Remarks (Write-Up)</th>
                    <th className="py-3 px-3">Curriculum Coordinator Endorsement</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((stu) => {
                    const rc = reportCards.find(r => r.studentId === stu.id);
                    const classRemarks = rc?.classTeacherRemarks || 'Diligent and attentive learner.';
                    const coordRemarks = rc?.curriculumCoordinatorRemarks;
                    const isRepublished = rc?.publicationStatus === 'Republished';

                    return (
                      <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{stu.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{stu.admissionNumber || `ADM/2026/0${stu.grade || 4}01`}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{stu.stream || 'Dove'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {rc?.streamPosition ? `Rank ${rc.streamPosition} of ${rc.totalStudentsInStream}` : 'Rank 1'}
                          </div>
                        </td>

                        <td className="py-3 px-3 max-w-xs truncate text-slate-700 italic" title={classRemarks}>
                          "{classRemarks}"
                        </td>

                        <td className="py-3 px-3 max-w-xs truncate">
                          {coordRemarks ? (
                            <span className="text-indigo-800 font-medium italic" title={coordRemarks}>
                              "{coordRemarks}"
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No coordinator comment added yet.</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isRepublished ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            {isRepublished ? 'Republished' : 'Active'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenModerateCard(stu)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Comments</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          MODAL: WRITE / EDIT CURRICULUM REPORT
          ======================================================== */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>{editingReport ? 'Edit Curriculum Report' : 'Author New Curriculum Report'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Compose comprehensive curriculum pacing, CBA attainment, or BoM briefing reports.
                </p>
              </div>
              <button 
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWrittenReport} className="space-y-4 text-xs">
              
              <div>
                <label className="font-bold text-slate-700 block mb-1">Report Title</label>
                <input
                  type="text"
                  placeholder="e.g. Term 2 CBC Curriculum Pacing & Syllabi Synchronization Audit"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Report Category</label>
                  <select
                    value={formReportType}
                    onChange={(e) => setFormReportType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Curriculum Implementation">Curriculum Implementation</option>
                    <option value="Syllabus Pacing & Audit">Syllabus Pacing & Audit</option>
                    <option value="CBA Moderation & Attainment">CBA Moderation & Attainment</option>
                    <option value="Departmental Faculty Review">Departmental Faculty Review</option>
                    <option value="BoM Executive Briefing">BoM Executive Briefing</option>
                    <option value="Remedial & Special Intervention">Remedial & Special Intervention</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Grade</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value === 'All Grades' ? 'All Grades' : Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="All Grades">All Grades (1-9)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="published">Published</option>
                    <option value="submitted_to_bom">Submitted to BoM</option>
                    <option value="draft">Draft (Private)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Executive Summary</label>
                <textarea
                  rows={3}
                  placeholder="Provide an executive summary of curriculum coverage, findings, and pedagogical state..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium leading-relaxed"
                />
              </div>

              {/* Key Findings List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Key Findings & Audit Points</label>
                  <button
                    type="button"
                    onClick={() => setFormFindings([...formFindings, ''])}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Finding</span>
                  </button>
                </div>
                {formFindings.map((finding, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Finding ${idx + 1}...`}
                      value={finding}
                      onChange={(e) => {
                        const updated = [...formFindings];
                        updated[idx] = e.target.value;
                        setFormFindings(updated);
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                    {formFindings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFormFindings(formFindings.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Recommendations List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Action Points & Recommendations</label>
                  <button
                    type="button"
                    onClick={() => setFormRecommendations([...formRecommendations, ''])}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Recommendation</span>
                  </button>
                </div>
                {formRecommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Recommendation ${idx + 1}...`}
                      value={rec}
                      onChange={(e) => {
                        const updated = [...formRecommendations];
                        updated[idx] = e.target.value;
                        setFormRecommendations(updated);
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                    {formRecommendations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFormRecommendations(formRecommendations.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {editingReport ? 'Save Changes' : 'Publish Report'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REPORT DETAIL WITH COMMENTS ADD/EDIT/REMOVE
          ======================================================== */}
      {activeReportDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                  {activeReportDetail.reportType} · Term {activeReportDetail.term}, 2026
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{activeReportDetail.title}</h3>
                <div className="text-xs text-slate-500">
                  Authored by {activeReportDetail.authorName} ({activeReportDetail.authorRole})
                </div>
              </div>
              <button 
                onClick={() => setActiveReportDetail(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto pr-1">
              
              {/* Executive Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Executive Summary</div>
                <p className="leading-relaxed text-slate-800">{activeReportDetail.executiveSummary}</p>
              </div>

              {/* Key Findings */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Key Findings</div>
                <ul className="space-y-1.5 list-disc pl-5 text-slate-700">
                  {activeReportDetail.keyFindings.map((f, i) => (
                    <li key={i} className="leading-relaxed">{f}</li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Recommendations & Directives</div>
                <ul className="space-y-1.5 list-disc pl-5 text-slate-700">
                  {activeReportDetail.recommendations.map((r, i) => (
                    <li key={i} className="leading-relaxed">{r}</li>
                  ))}
                </ul>
              </div>

              {/* QUALITATIVE COMMENTS SECTION (ADD, EDIT, REMOVE) */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>Qualitative Comments & Discussion Remarks ({activeReportDetail.qualitativeComments.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Curriculum Coordinator Editorial Control</span>
                </div>

                {/* Existing Comments List */}
                <div className="space-y-2">
                  {activeReportDetail.qualitativeComments.map((c) => {
                    const isEditing = editingCommentId === c.id;

                    return (
                      <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="font-bold text-slate-800">
                            {c.author} <span className="text-slate-400 font-normal">({c.authorRole})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.comment); }}
                              className="text-slate-400 hover:text-indigo-600 p-0.5"
                              title="Edit Comment"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveCommentFromReport(activeReportDetail.id, c.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Remove Comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="flex-1 px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                            />
                            <button
                              onClick={() => handleSaveEditComment(activeReportDetail.id, c.id)}
                              className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-700 leading-relaxed text-xs italic">
                            "{c.comment}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add New Comment Field */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add an executive remark or commentary to this report..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCommentToReport(activeReportDetail.id);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleAddCommentToReport(activeReportDetail.id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Add Comment</span>
                  </button>
                </div>

              </div>

            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Report</span>
              </button>
              
              <button
                onClick={() => setActiveReportDetail(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT / REMOVE / ADD COMMENTS ON STUDENT REPORT CARD
          ======================================================== */}
      {moderatingReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                  Report Card Comment Moderation Desk
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {moderatingReport.studentName} ({moderatingReport.admissionNumber})
                </h3>
                <p className="text-xs text-slate-500">
                  Grade {moderatingReport.grade} · Stream {moderatingReport.stream} · Term {moderatingReport.term}
                </p>
              </div>
              <button 
                onClick={() => setModeratingReport(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModerateCard} className="space-y-4 text-xs">
              
              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-600 text-[11px]">Quick Pre-Set Curriculum Endorsement Comments:</div>
                <div className="flex flex-wrap gap-1.5">
                  {quickCommentPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setModCoordinatorRemarks(preset)}
                      className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 transition-colors text-left"
                    >
                      Preset {idx + 1}: {preset.slice(0, 36)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Teacher Remarks */}
              <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900">Class Teacher Qualitative Write-Up</label>
                  <button
                    type="button"
                    onClick={() => setModClassRemarks('')}
                    className="text-[10px] text-rose-600 font-bold hover:underline flex items-center gap-1"
                    title="Remove / Clear comment"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear / Remove Comment</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={modClassRemarks}
                  onChange={(e) => setModClassRemarks(e.target.value)}
                  placeholder="Enter or revise class teacher remarks..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Curriculum Coordinator Endorsement Remark */}
              <div className="space-y-1 bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Curriculum Coordinator Official Endorsement Remark</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setModCoordinatorRemarks('')}
                    className="text-[10px] text-rose-600 font-bold hover:underline flex items-center gap-1"
                    title="Remove / Clear comment"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear / Remove Comment</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={modCoordinatorRemarks}
                  onChange={(e) => setModCoordinatorRemarks(e.target.value)}
                  placeholder="Add Curriculum Directorate remarks and qualitative assessment feedback..."
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl font-medium text-indigo-950"
                />
              </div>

              {/* Subject Comments Moderation */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Subject Teacher Qualitative Feedback Remarks ({modSubjectRemarks.length})</span>
                  <span className="text-[10px] text-slate-400">Edit or Clear by Subject</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {modSubjectRemarks.map((item, idx) => (
                    <div key={item.subject} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px]">{item.subject}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...modSubjectRemarks];
                            updated[idx] = { ...item, remarks: '' };
                            setModSubjectRemarks(updated);
                          }}
                          className="text-[10px] text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear Remark</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => {
                          const updated = [...modSubjectRemarks];
                          updated[idx] = { ...item, remarks: e.target.value };
                          setModSubjectRemarks(updated);
                        }}
                        placeholder={`Subject remarks for ${item.subject}...`}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModeratingReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Republish Moderated Report Card</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: BATCH APPLY COORDINATOR REMARKS TO STREAM
          ======================================================== */}
      {isBatchCommentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Batch Apply Coordinator Remarks</h3>
                <p className="text-xs text-slate-500">Apply a unified curriculum remark to all Grade {selectedGrade} learners</p>
              </div>
              <button 
                onClick={() => setIsBatchCommentModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBatchComment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Standardized Curriculum Endorsement Remark</label>
                <textarea
                  rows={4}
                  value={batchCommentText}
                  onChange={(e) => setBatchCommentText(e.target.value)}
                  placeholder="e.g. Curriculum Directorate Endorsement: Learner has successfully met all core CBC Term 2 competency benchmarks..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchCommentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Apply & Republish Batch ({filteredStudents.length} Students)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
