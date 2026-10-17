import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  StudentAssessmentRecord, 
  TeacherResultUploadAssignment, 
  AssessmentCycle, 
  CBCAttainmentLevel, 
  SubjectResultEntry, 
  GradeLevel, 
  StreamName, 
  SubjectName,
  getCbcAttainmentFromScore
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  Upload, 
  FileSpreadsheet, 
  Plus, 
  CheckCircle2, 
  Award, 
  AlertCircle, 
  Calendar, 
  Users, 
  Lock, 
  Unlock, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Sparkles, 
  BookOpen, 
  Edit3, 
  Trash2, 
  Eye, 
  UserCheck, 
  ChevronRight, 
  GraduationCap,
  Save,
  Check,
  X,
  FileText,
  Clock,
  ShieldCheck,
  Send,
  RefreshCw
} from 'lucide-react';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { useTenant } from '../../context/TenantContext';

// CBC Subjects for Primary (Grades 1-6) and Junior School (Grades 7-9)
const PRIMARY_CBC_SUBJECTS: SubjectName[] = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Integrated Science',
  'Social Studies',
  'Agriculture and Nutrition',
  'Creative Arts',
  'Religious Education'
];

const JUNIOR_CBC_SUBJECTS: SubjectName[] = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Integrated Science',
  'Social Studies',
  'Agriculture',
  'Pre-Technical Studies',
  'Business Studies',
  'Creative Arts',
  'Religious Education'
];

export function getSubjectsForGrade(grade: GradeLevel): SubjectName[] {
  return grade <= 6 ? PRIMARY_CBC_SUBJECTS : JUNIOR_CBC_SUBJECTS;
}

interface ResultUploadManagerProps {
  currentUser: User;
  viewMode?: 'dean' | 'deputy' | 'teacher' | 'parent' | 'student';
  defaultGrade?: GradeLevel;
}

export const ResultUploadManager: React.FC<ResultUploadManagerProps> = ({
  currentUser,
  viewMode: initialViewMode,
  defaultGrade = 4
}) => {
  const { currentTenant } = useTenant();
  // Determine effective view mode
  const effectiveMode = initialViewMode || (
    currentUser.role === 'dean_of_studies' ? 'dean' :
    currentUser.role === 'deputy_head' ? 'deputy' :
    currentUser.role === 'parent' ? 'parent' :
    currentUser.role === 'student' ? 'student' : 'teacher'
  );

  const canManageAll = effectiveMode === 'dean' || effectiveMode === 'deputy' || currentUser.role === 'dean_of_studies' || currentUser.role === 'deputy_head' || currentUser.role === 'head_teacher' || currentUser.role === 'admin';
  const isDean = currentUser.role === 'dean_of_studies' || effectiveMode === 'dean';

  // Navigation tabs within manager
  const [activeTab, setActiveTab] = useState<'grade_results' | 'upload_hub' | 'teacher_assignments' | 'student_slip'>(
    effectiveMode === 'parent' || effectiveMode === 'student' ? 'grade_results' : 'grade_results'
  );

  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(defaultGrade);
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(1);
  const [selectedCycle, setSelectedCycle] = useState<AssessmentCycle>('Mid-Term Evaluation');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Storage state
  const [records, setRecords] = useState<StudentAssessmentRecord[]>(() => Storage.getAssessmentRecords());
  const [assignments, setAssignments] = useState<TeacherResultUploadAssignment[]>(() => Storage.getTeacherUploadAssignments());
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Selected student for detailed report slip modal
  const [selectedSlipRecord, setSelectedSlipRecord] = useState<StudentAssessmentRecord | null>(null);

  // Whole Grade Matrix Upload Modal / View state
  const [isUploadMatrixOpen, setIsUploadMatrixOpen] = useState(false);
  const [matrixGrade, setMatrixGrade] = useState<GradeLevel>(selectedGrade);
  const [matrixTerm, setMatrixTerm] = useState<1 | 2 | 3>(selectedTerm);
  const [matrixCycle, setMatrixCycle] = useState<AssessmentCycle>(selectedCycle);
  const [matrixScores, setMatrixScores] = useState<Record<string, Record<string, number>>>({});
  const [matrixRemarks, setMatrixRemarks] = useState<Record<string, string>>({});
  const [isPublishingDirectly, setIsPublishingDirectly] = useState(true);

  // Assign Teacher Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignGrade, setAssignGrade] = useState<GradeLevel>(selectedGrade);
  const [assignStream, setAssignStream] = useState<StreamName | 'all'>('all');
  const [assignSubject, setAssignSubject] = useState<SubjectName | 'all'>('all');
  const [assignCycle, setAssignCycle] = useState<AssessmentCycle>(selectedCycle);
  const [assignTerm, setAssignTerm] = useState<1 | 2 | 3>(selectedTerm);
  const [assignDueDate, setAssignDueDate] = useState('2026-04-15');
  const [assignInstructions, setAssignInstructions] = useState('');

  // Sync with window events
  useEffect(() => {
    const handleRecordsUpdate = () => {
      setRecords(Storage.getAssessmentRecords());
    };
    const handleAssignmentsUpdate = () => {
      setAssignments(Storage.getTeacherUploadAssignments());
    };

    window.addEventListener('assessment-records-updated', handleRecordsUpdate);
    window.addEventListener('teacher-assignments-updated', handleAssignmentsUpdate);

    return () => {
      window.removeEventListener('assessment-records-updated', handleRecordsUpdate);
      window.removeEventListener('teacher-assignments-updated', handleAssignmentsUpdate);
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Get all registered students from storage
  const allUsers = useMemo(() => Storage.getUsers(), []);
  const allTeachers = useMemo(() => {
    return allUsers.filter(u => u.role === 'teacher' || u.role === 'class_teacher' || u.role === 'hod' || u.role === 'senior_teacher');
  }, [allUsers]);

  // Learners enrolled in selected grade
  const gradeStudents = useMemo(() => {
    return allUsers.filter(u => u.role === 'student' && u.grade === selectedGrade);
  }, [allUsers, selectedGrade]);

  // Learners for matrix upload
  const matrixStudents = useMemo(() => {
    return allUsers.filter(u => u.role === 'student' && u.grade === matrixGrade);
  }, [allUsers, matrixGrade]);

  const activeSubjects = useMemo(() => {
    return getSubjectsForGrade(selectedGrade);
  }, [selectedGrade]);

  const matrixSubjects = useMemo(() => {
    return getSubjectsForGrade(matrixGrade);
  }, [matrixGrade]);

  // FILTERED RECORDS ACCORDING TO USER ROLE & STRICT PERMISSIONS
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. GRADE FILTER (for staff/dean)
      if (canManageAll) {
        if (r.grade !== selectedGrade) return false;
        if (r.term !== selectedTerm) return false;
        if (r.assessmentCycle !== selectedCycle) return false;
        if (selectedStream !== 'all' && r.stream !== selectedStream) return false;
      }

      // 2. PARENT FILTER: ONLY OWN REGISTERED CHILDREN
      if (effectiveMode === 'parent') {
        const parentChildIds = currentUser.childrenIds || [];
        // Must belong to this parent's child
        if (!parentChildIds.includes(r.studentId)) return false;
        // Parents can only view records formally published by Dean
        if (!r.deanPublished) return false;
      }

      // 3. STUDENT FILTER: ONLY OWN RECORD
      if (effectiveMode === 'student') {
        if (r.studentId !== currentUser.id) return false;
        // Students can only view records formally published by Dean
        if (!r.deanPublished) return false;
      }

      // 4. TEACHER FILTER (if not dean/deputy)
      if (effectiveMode === 'teacher' && !canManageAll) {
        if (currentUser.grade && r.grade !== currentUser.grade) return false;
        if (currentUser.stream && r.stream !== currentUser.stream) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.studentName.toLowerCase().includes(q);
        const matchesAdm = r.admissionNumber.toLowerCase().includes(q);
        const matchesStream = r.stream.toLowerCase().includes(q);
        if (!matchesName && !matchesAdm && !matchesStream) return false;
      }

      return true;
    });
  }, [records, selectedGrade, selectedTerm, selectedCycle, selectedStream, searchQuery, effectiveMode, canManageAll, currentUser]);

  // Dean/Deputy whole grade publishing status
  const gradePublishStatus = useMemo(() => {
    const currentBatch = records.filter(
      r => r.grade === selectedGrade && r.term === selectedTerm && r.assessmentCycle === selectedCycle
    );
    if (currentBatch.length === 0) return 'none';
    const publishedCount = currentBatch.filter(r => r.deanPublished).length;
    if (publishedCount === currentBatch.length) return 'all_published';
    if (publishedCount > 0) return 'partially_published';
    return 'unpublished';
  }, [records, selectedGrade, selectedTerm, selectedCycle]);

  // Open Whole Grade Matrix Upload
  const handleOpenMatrixUpload = (grade: GradeLevel = selectedGrade) => {
    setMatrixGrade(grade);
    setMatrixTerm(selectedTerm);
    setMatrixCycle(selectedCycle);

    const studentsInGrade = allUsers.filter(u => u.role === 'student' && u.grade === grade);
    const existingGradeRecords = records.filter(
      r => r.grade === grade && r.term === selectedTerm && r.assessmentCycle === selectedCycle
    );

    const initialScores: Record<string, Record<string, number>> = {};
    const initialRemarks: Record<string, string> = {};
    const subjects = getSubjectsForGrade(grade);

    studentsInGrade.forEach(student => {
      const existing = existingGradeRecords.find(r => r.studentId === student.id);
      initialScores[student.id] = {};
      
      subjects.forEach(sub => {
        if (existing) {
          const subRes = existing.subjectResults.find(s => s.subject === sub);
          initialScores[student.id][sub] = subRes ? subRes.score : 75;
        } else {
          // Benchmark default: 75
          initialScores[student.id][sub] = 75;
        }
      });

      initialRemarks[student.id] = existing?.classTeacherRemarks || 'Exhibits steady CBC competency progression.';
    });

    setMatrixScores(initialScores);
    setMatrixRemarks(initialRemarks);
    setIsUploadMatrixOpen(true);
  };

  // Pre-fill benchmark marks across whole grade matrix
  const handlePreFillBenchmark = (level: 'high' | 'balanced' | 'emerging') => {
    const subjects = matrixSubjects;
    const newScores: Record<string, Record<string, number>> = {};

    matrixStudents.forEach((student, sIdx) => {
      newScores[student.id] = {};
      subjects.forEach((sub, subIdx) => {
        let baseScore = 75;
        if (level === 'high') {
          baseScore = 82 + ((sIdx * 3 + subIdx * 5) % 16);
        } else if (level === 'emerging') {
          baseScore = 55 + ((sIdx * 4 + subIdx * 3) % 25);
        } else {
          baseScore = 65 + ((sIdx * 5 + subIdx * 7) % 28);
        }
        if (baseScore > 98) baseScore = 98;
        newScores[student.id][sub] = baseScore;
      });
    });

    setMatrixScores(newScores);
    showToast(`Pre-filled ${level} benchmark marks for Grade ${matrixGrade} (${matrixStudents.length} learners).`, 'info');
  };

  // Save Whole Grade Results
  const handleSaveWholeGradeMatrix = () => {
    if (matrixStudents.length === 0) {
      showToast('No students enrolled in this grade cohort.', 'error');
      return;
    }

    const subjects = matrixSubjects;
    const newRecords: StudentAssessmentRecord[] = [];

    matrixStudents.forEach(student => {
      const studentSubScores = matrixScores[student.id] || {};
      const subjectResults: SubjectResultEntry[] = [];
      let totalScore = 0;
      let totalCbcPoints = 0;

      subjects.forEach(sub => {
        const rawScore = studentSubScores[sub] !== undefined ? studentSubScores[sub] : 70;
        const clampedScore = Math.max(0, Math.min(100, Math.round(rawScore)));
        const cbc = getCbcAttainmentFromScore(clampedScore);

        subjectResults.push({
          subject: sub,
          score: clampedScore,
          attainmentLevel: cbc.level,
          cbcPoints: cbc.points,
          remarks: `${cbc.level} in ${sub}.`,
          teacherName: currentUser.name
        });

        totalScore += clampedScore;
        totalCbcPoints += cbc.points;
      });

      const avgScore = Number((totalScore / subjects.length).toFixed(1));
      const avgPoints = Number((totalCbcPoints / subjects.length).toFixed(1));
      const overallCbc = getCbcAttainmentFromScore(avgScore);

      const existingRecord = records.find(
        r => r.studentId === student.id && r.grade === matrixGrade && r.term === matrixTerm && r.assessmentCycle === matrixCycle
      );

      const rec: StudentAssessmentRecord = {
        id: existingRecord?.id || `asmt-${student.id}-${matrixCycle.toLowerCase().replace(/[^a-z0-9]/g, '')}-t${matrixTerm}`,
        studentId: student.id,
        studentName: student.name,
        admissionNumber: student.admissionNumber || `ADM/2023/${student.id.slice(-4)}`,
        grade: matrixGrade,
        stream: student.stream || 'Dove',
        term: matrixTerm,
        academicYear: 2026,
        assessmentCycle: matrixCycle,
        subjectResults,
        totalScore,
        averageScore: avgScore,
        totalCbcPoints,
        averageCbcPoints: avgPoints,
        overallAttainmentLevel: overallCbc.level,
        deanPublished: isPublishingDirectly,
        publishedAt: isPublishingDirectly ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined,
        publishedBy: isPublishingDirectly ? `${currentUser.name} (${currentUser.role === 'dean_of_studies' ? 'Dean of Studies' : 'Deputy Head'})` : undefined,
        classTeacherRemarks: matrixRemarks[student.id] || 'Demonstrates steady CBC competency development.',
        deanRemarks: `Whole grade ${matrixCycle} results validated by Directorate of Academic Affairs.`
      };

      newRecords.push(rec);
    });

    // Calculate ranking in stream
    newRecords.sort((a, b) => b.totalScore - a.totalScore);
    newRecords.forEach((r, idx) => {
      r.rankInStream = idx + 1;
      r.totalInStream = newRecords.length;
    });

    Storage.saveGradeAssessmentRecords(newRecords);
    setRecords(Storage.getAssessmentRecords());
    setIsUploadMatrixOpen(false);

    showToast(
      `Successfully uploaded and ${isPublishingDirectly ? 'published' : 'saved draft'} results for Grade ${matrixGrade} (${newRecords.length} learners).`,
      'success'
    );
  };

  // Toggle Publish for Whole Grade
  const handleToggleGradePublish = (publish: boolean) => {
    Storage.publishGradeAssessments(
      selectedGrade,
      selectedCycle,
      selectedTerm,
      publish,
      `${currentUser.name} (${currentUser.role === 'dean_of_studies' ? 'Dean of Studies' : 'Deputy Head'})`
    );
    setRecords(Storage.getAssessmentRecords());
    showToast(
      publish 
        ? `Grade ${selectedGrade} ${selectedCycle} results are now PUBLISHED. Visible to learners and parents.` 
        : `Grade ${selectedGrade} ${selectedCycle} results are now UNPUBLISHED (Draft mode).`,
      publish ? 'success' : 'info'
    );
  };

  // Create Teacher Assignment
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTeacherId) {
      showToast('Please select an Academic Department teacher.', 'error');
      return;
    }

    const teacher = allTeachers.find(t => t.id === assignTeacherId);
    if (!teacher) return;

    const newAssignment: TeacherResultUploadAssignment = {
      id: `asgn-${Date.now()}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      grade: assignGrade,
      stream: assignStream,
      subject: assignSubject,
      assessmentCycle: assignCycle,
      term: assignTerm,
      academicYear: 2026,
      assignedBy: currentUser.name,
      assignedByRole: currentUser.role === 'dean_of_studies' ? 'dean_of_studies' : 'deputy_head',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: assignDueDate,
      status: 'assigned',
      instructions: assignInstructions.trim() || `Upload ${assignCycle} marks for Grade ${assignGrade} (${assignSubject === 'all' ? 'All Subjects' : assignSubject}).`
    };

    Storage.saveTeacherUploadAssignment(newAssignment);
    setAssignments(Storage.getTeacherUploadAssignments());
    setShowAssignModal(false);
    setAssignInstructions('');

    showToast(`Assigned result upload task to ${teacher.name} for Grade ${assignGrade}.`, 'success');
  };

  // Delete Assignment
  const handleDeleteAssignment = (id: string) => {
    if (confirm('Are you sure you want to remove this upload assignment?')) {
      Storage.deleteTeacherUploadAssignment(id);
      setAssignments(Storage.getTeacherUploadAssignments());
      showToast('Assignment removed.', 'info');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold shadow-md animate-in slide-in-from-top-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-950 border-emerald-300' 
            : notification.type === 'error'
            ? 'bg-rose-50 text-rose-950 border-rose-300'
            : 'bg-indigo-50 text-indigo-950 border-indigo-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-indigo-600" />}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER & ACTION BUTTONS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>CBC CURRICULUM ASSESSMENT & EXAMINATIONS</span>
            </span>

            {canManageAll && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {isDean ? 'Dean Full Rights Authority' : 'Deputy Head Supervisory Authority'}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {effectiveMode === 'parent' ? 'My Children\'s Assessment Results (CBC)' :
             effectiveMode === 'student' ? 'My Continuous Assessment Results (CBC)' :
             'Grade-Wide Assessment Results & Upload Hub'}
          </h2>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {effectiveMode === 'parent' 
              ? 'Official continuous assessment dossiers (CATs, Mid-Term, End-Term) with CBC attainment levels (EE, ME, AE, BE) and points for your registered learners.' 
              : effectiveMode === 'student'
              ? 'Your verified assessment scores, subject attainment levels, and performance rubrics certified by the Dean of Studies.'
              : 'Upload and organize comprehensive assessment results for entire grade cohorts. Dean and Deputy Head can assign Academic Department teachers, audit entries, and publish results.'}
          </p>
        </div>

        {/* PRIMARY ACTION BUTTONS (DEAN & DEPUTY WORKSPACE) */}
        {canManageAll && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* 1. RESULT UPLOADING BUTTON */}
            <button
              onClick={() => handleOpenMatrixUpload(selectedGrade)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Grade {selectedGrade} Results</span>
            </button>

            {/* 2. ASSIGN TEACHER TO UPLOAD BUTTON */}
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Teacher to Upload</span>
            </button>
          </div>
        )}
      </div>

      {/* FILTER & CYCLE CONTROLLER */}
      {canManageAll && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            
            {/* Grade Selector */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-xs font-bold text-slate-500 shrink-0">Grade Cohort:</span>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    selectedGrade === g
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Grade {g}
                </button>
              ))}
            </div>

            {/* Whole Grade Publish Toggle Button */}
            <div className="flex items-center gap-2 shrink-0">
              {gradePublishStatus === 'all_published' ? (
                <button
                  onClick={() => handleToggleGradePublish(false)}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Retract publication so parents and learners cannot view until further edits"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Unpublish Grade {selectedGrade} (Retract to Draft)</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleGradePublish(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Publish Grade results so parents and learners can view their assessment slips"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Publish Results for Grade {selectedGrade}</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub Filters: Assessment Cycle, Term, Stream, Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Cycle */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">Assessment Cycle</label>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value as AssessmentCycle)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold text-slate-800"
              >
                <option value="Continuous Assessment (CATs)">Continuous Assessment (CATs)</option>
                <option value="CAT 1">CAT 1</option>
                <option value="CAT 2">CAT 2</option>
                <option value="Mid-Term Evaluation">Mid-Term Evaluation</option>
                <option value="End-Term Summative">End-Term Summative</option>
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold text-slate-800"
              >
                <option value={1}>Term 1 2026</option>
                <option value={2}>Term 2 2026</option>
                <option value={3}>Term 3 2026</option>
              </select>
            </div>

            {/* Stream */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">Stream Filter</label>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold text-slate-800"
              >
                <option value="all">All Streams (Grade-Wide)</option>
                <option value="Dove">Dove</option>
                <option value="Eagle">Eagle</option>
                <option value="Hawk">Hawk</option>
                <option value="Mara">Mara</option>
                <option value="Athi">Athi</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">Search Learner</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Learner name, ADM..."
                  className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 bg-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER ASSIGNMENTS SUMMARY BAR (FOR DEAN/DEPUTY) */}
      {canManageAll && assignments.length > 0 && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-700" />
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                Active Teacher Result Upload Tasks ({assignments.length})
              </h3>
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign New Task</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {assignments.slice(0, 6).map(asgn => (
              <div key={asgn.id} className="bg-white rounded-xl border border-indigo-100 p-3 shadow-2xs flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-extrabold text-slate-900">{asgn.teacherName}</div>
                  <div className="text-[11px] text-slate-600">
                    Grade {asgn.grade} {asgn.stream !== 'all' ? asgn.stream : 'Whole Grade'} · <strong>{asgn.subject}</strong>
                  </div>
                  <div className="text-[10px] text-indigo-700 font-mono">
                    {asgn.assessmentCycle} · Due: {asgn.dueDate}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    asgn.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                    asgn.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    asgn.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {asgn.status}
                  </span>
                  <button
                    onClick={() => handleDeleteAssignment(asgn.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="Remove assignment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULTS LIST & MATRIX TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Table Header Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-slate-900">
              {effectiveMode === 'parent' ? 'My Children\'s Certified Records' :
               effectiveMode === 'student' ? 'My Assessment Records' :
               `Grade ${selectedGrade} · ${selectedCycle} Score Sheet`}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredRecords.length} Learner Dossiers)
            </span>

            {/* Publishing Indicator */}
            {canManageAll && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                gradePublishStatus === 'all_published' ? 'bg-emerald-100 text-emerald-800' :
                gradePublishStatus === 'partially_published' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-200 text-slate-700'
              }`}>
                {gradePublishStatus === 'all_published' ? '● Published to Parents & Learners' :
                 gradePublishStatus === 'partially_published' ? '● Partial Batch Published' :
                 '○ Unpublished Draft'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Score Sheet</span>
            </button>
          </div>
        </div>

        {/* Records Content */}
        {filteredRecords.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="text-sm font-extrabold text-slate-800">No Assessment Records Found</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {effectiveMode === 'parent' 
                ? 'No published assessment results for your registered learners in this term yet. Check back once approved by the Dean.'
                : effectiveMode === 'student'
                ? 'No published continuous assessment scores available for this cycle yet.'
                : `No results have been uploaded yet for Grade ${selectedGrade} ${selectedCycle}. Click "Upload Grade ${selectedGrade} Results" above to enter scores.`}
            </p>
            {canManageAll && (
              <button
                onClick={() => handleOpenMatrixUpload(selectedGrade)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Results Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                  <th className="py-3 px-3.5">Learner & ADM</th>
                  <th className="py-3 px-2">Grade/Stream</th>
                  <th className="py-3 px-2 text-center">Cycle & Term</th>
                  <th className="py-3 px-2 text-center">Average Score</th>
                  <th className="py-3 px-2 text-center">CBC Points</th>
                  <th className="py-3 px-2 text-center">Overall Attainment</th>
                  <th className="py-3 px-2 text-center">Rank</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredRecords.map(rec => {
                  const cbc = getCbcAttainmentFromScore(rec.averageScore);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-slate-900">{rec.studentName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{rec.admissionNumber}</div>
                      </td>

                      <td className="py-3 px-2 font-medium text-slate-700">
                        Grade {rec.grade} <span className="text-slate-400">·</span> {rec.stream}
                      </td>

                      <td className="py-3 px-2 text-center font-medium text-slate-700">
                        <div>{rec.assessmentCycle}</div>
                        <div className="text-[10px] text-slate-400">Term {rec.term} · {rec.academicYear}</div>
                      </td>

                      <td className="py-3 px-2 text-center font-mono font-extrabold text-slate-900 text-sm">
                        {rec.averageScore}%
                      </td>

                      <td className="py-3 px-2 text-center font-mono font-black text-indigo-700">
                        {rec.totalCbcPoints} Pts <span className="text-[10px] text-slate-400">({rec.averageCbcPoints} avg)</span>
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          cbc.code === 'EE' ? 'bg-emerald-100 text-emerald-800' :
                          cbc.code === 'ME' ? 'bg-blue-100 text-blue-800' :
                          cbc.code === 'AE' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          <Award className="w-3 h-3" />
                          <span>{rec.overallAttainmentLevel}</span>
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center font-bold font-mono text-slate-700">
                        {rec.rankInStream ? `${rec.rankInStream} / ${rec.totalInStream || 40}` : '-'}
                      </td>

                      <td className="py-3 px-2 text-center">
                        {rec.deanPublished ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Draft Moderation
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detailed CBC Report Slip */}
                          <button
                            onClick={() => setSelectedSlipRecord(rec)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="View Full CBC Assessment Report Slip"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Report Slip</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: WHOLE GRADE RESULTS UPLOAD MATRIX (DEAN & DEPUTY)
          ======================================================== */}
      {isUploadMatrixOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between relative shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>WHOLE GRADE ASSESSMENT MATRIX UPLOAD</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">
                    Grade {matrixGrade} · {matrixCycle} · Term {matrixTerm}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Enter Whole Grade Results with Subject Attainment Levels & CBC Points
                </h3>
                <p className="text-xs text-slate-300">
                  Enter scores (0-100) per subject. Attainment Levels (EE, ME, AE, BE) and CBC Points (4, 3, 2, 1) calculate automatically.
                </p>
              </div>

              <button
                onClick={() => setIsUploadMatrixOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Batch Tools Bar */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Quick Pre-fill:</span>
                <button
                  type="button"
                  onClick={() => handlePreFillBenchmark('high')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700 text-[11px] cursor-pointer"
                >
                  ⚡ High Benchmark (EE)
                </button>
                <button
                  type="button"
                  onClick={() => handlePreFillBenchmark('balanced')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-700 text-[11px] cursor-pointer"
                >
                  ⚖️ Balanced Cohort
                </button>
                <button
                  type="button"
                  onClick={() => handlePreFillBenchmark('emerging')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg font-bold text-amber-700 text-[11px] cursor-pointer"
                >
                  🌱 Emerging Progression
                </button>
              </div>

              {/* Publication Direct Toggle */}
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={isPublishingDirectly}
                  onChange={(e) => setIsPublishingDirectly(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Publish Immediately to Learners & Parents</span>
              </label>
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50">
              <table className="w-full text-left border-collapse text-xs bg-white rounded-xl shadow-xs overflow-hidden">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <th className="p-3 border-r border-slate-800 min-w-[160px]">Learner Name</th>
                    {matrixSubjects.map(sub => (
                      <th key={sub} className="p-2 border-r border-slate-800 text-center min-w-[85px]">
                        <div className="truncate text-[10px]">{sub}</div>
                        <div className="text-[9px] text-slate-400 font-mono">0-100</div>
                      </th>
                    ))}
                    <th className="p-2 border-r border-slate-800 text-center min-w-[70px]">Average</th>
                    <th className="p-2 border-r border-slate-800 text-center min-w-[70px]">CBC Pts</th>
                    <th className="p-3 min-w-[180px]">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {matrixStudents.map((student) => {
                    const studentScores = matrixScores[student.id] || {};
                    let total = 0;
                    let totalPts = 0;

                    matrixSubjects.forEach(sub => {
                      const val = studentScores[sub] !== undefined ? studentScores[sub] : 70;
                      total += val;
                      totalPts += getCbcAttainmentFromScore(val).points;
                    });

                    const avg = Number((total / matrixSubjects.length).toFixed(1));
                    const cbc = getCbcAttainmentFromScore(avg);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="p-2.5 border-r border-slate-200 font-bold text-slate-900">
                          <div>{student.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{student.admissionNumber || student.id}</div>
                        </td>

                        {matrixSubjects.map(sub => {
                          const val = studentScores[sub] !== undefined ? studentScores[sub] : 70;
                          const subCbc = getCbcAttainmentFromScore(val);
                          return (
                            <td key={sub} className="p-1 border-r border-slate-200 text-center">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={val}
                                onChange={(e) => {
                                  const num = Number(e.target.value);
                                  setMatrixScores(prev => ({
                                    ...prev,
                                    [student.id]: {
                                      ...(prev[student.id] || {}),
                                      [sub]: num
                                    }
                                  }));
                                }}
                                className="w-14 text-center border border-slate-300 rounded px-1 py-1 font-mono font-bold text-xs"
                              />
                              <div className={`text-[9px] font-black uppercase mt-0.5 ${
                                subCbc.code === 'EE' ? 'text-emerald-700' :
                                subCbc.code === 'ME' ? 'text-blue-700' :
                                subCbc.code === 'AE' ? 'text-amber-700' :
                                'text-rose-700'
                              }`}>
                                {subCbc.code} · {subCbc.points}pt
                              </div>
                            </td>
                          );
                        })}

                        <td className="p-2 border-r border-slate-200 text-center font-mono font-black text-slate-900">
                          {avg}%
                        </td>

                        <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-indigo-700">
                          {totalPts} Pts
                        </td>

                        <td className="p-2">
                          <input
                            type="text"
                            value={matrixRemarks[student.id] || ''}
                            onChange={(e) => {
                              const txt = e.target.value;
                              setMatrixRemarks(prev => ({
                                ...prev,
                                [student.id]: txt
                              }));
                            }}
                            placeholder="Class remarks..."
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                Cohort Total: <strong>{matrixStudents.length} Students</strong> · {matrixSubjects.length} CBC Learning Areas
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadMatrixOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveWholeGradeMatrix}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Apply Grade {matrixGrade} Results</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: ASSIGN TEACHER TO UPLOAD RESULTS
          ======================================================== */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 inline-flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>TEACHER RESULT UPLOAD DELEGATION</span>
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Assign Academic Department Teacher to Upload Results
                </h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Academic Department Teacher *</label>
                <select
                  required
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold"
                >
                  <option value="">-- Choose Teacher --</option>
                  {allTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.tscNumber || 'TSC Staff'}) - {t.role.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Grade *</label>
                  <select
                    value={assignGrade}
                    onChange={(e) => setAssignGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Stream</label>
                  <select
                    value={assignStream}
                    onChange={(e) => setAssignStream(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold"
                  >
                    <option value="all">Whole Grade (All Streams)</option>
                    <option value="Dove">Dove</option>
                    <option value="Eagle">Eagle</option>
                    <option value="Hawk">Hawk</option>
                    <option value="Mara">Mara</option>
                    <option value="Athi">Athi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subject Scope *</label>
                  <select
                    value={assignSubject}
                    onChange={(e) => setAssignSubject(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold"
                  >
                    <option value="all">All Learning Areas in Grade</option>
                    {getSubjectsForGrade(assignGrade).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assessment Cycle *</label>
                  <select
                    value={assignCycle}
                    onChange={(e) => setAssignCycle(e.target.value as AssessmentCycle)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold"
                  >
                    <option value="Continuous Assessment (CATs)">Continuous Assessment (CATs)</option>
                    <option value="CAT 1">CAT 1</option>
                    <option value="CAT 2">CAT 2</option>
                    <option value="Mid-Term Evaluation">Mid-Term Evaluation</option>
                    <option value="End-Term Summative">End-Term Summative</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Term *</label>
                  <select
                    value={assignTerm}
                    onChange={(e) => setAssignTerm(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-bold"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Submission Due Date *</label>
                  <input
                    type="date"
                    required
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Dean / Deputy Instructions</label>
                <textarea
                  rows={2}
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder="Specify rubrics, moderation guidelines, and verification notes..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Assign Result Upload Task</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: OFFICIAL PRINTABLE CBC ASSESSMENT REPORT SLIP
          ======================================================== */}
      {selectedSlipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm">Official CBC Continuous Assessment Dossier</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedSlipRecord(null)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Slip Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 bg-white print:p-0">
              
              {/* Institutional Header */}
              <div 
                className="flex items-center justify-between border-b-2 pb-4"
                style={{ borderColor: currentTenant.primaryColorHex || '#1e3a8a' }}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {currentTenant.customLogoBase64 ? (
                      <img src={currentTenant.customLogoBase64} alt={currentTenant.name} className="w-12 h-12 object-contain rounded-xl p-1 bg-white border border-slate-200 shadow-2xs" />
                    ) : currentTenant.logoUrl ? (
                      <img src={currentTenant.logoUrl} alt={currentTenant.name} className="w-12 h-12 object-contain rounded-xl p-1 bg-white border border-slate-200 shadow-2xs" />
                    ) : (
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <EduSmartGadsaLogo variant="horizontal" size="sm" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight uppercase font-serif">
                      {currentTenant.name}
                    </h2>
                    <p className="text-[11px] text-slate-600 font-mono">
                      "{currentTenant.motto}" {currentTenant.taglineNotes ? `· ${currentTenant.taglineNotes}` : ''} · {currentTenant.registrationNumber}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">DOSSIER CYCLE</span>
                  <span className="font-black text-sm text-indigo-950 uppercase">{selectedSlipRecord.assessmentCycle}</span>
                  <div className="text-[11px] text-slate-500 font-mono">Term {selectedSlipRecord.term} · {selectedSlipRecord.academicYear}</div>
                </div>
              </div>

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Learner Name</span>
                  <span className="font-extrabold text-slate-900">{selectedSlipRecord.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Admission Number</span>
                  <span className="font-mono font-bold text-slate-800">{selectedSlipRecord.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Grade & Stream</span>
                  <span className="font-bold text-slate-800">Grade {selectedSlipRecord.grade} · {selectedSlipRecord.stream}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Stream Position</span>
                  <span className="font-bold font-mono text-indigo-700">Rank {selectedSlipRecord.rankInStream || 1} of {selectedSlipRecord.totalInStream || 40}</span>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-700">
                      <th className="py-2.5 px-3">Learning Area / Subject</th>
                      <th className="py-2.5 px-2 text-center">Score (100%)</th>
                      <th className="py-2.5 px-2 text-center">Attainment Level</th>
                      <th className="py-2.5 px-2 text-center">CBC Points</th>
                      <th className="py-2.5 px-3">Subject Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSlipRecord.subjectResults.map(s => {
                      const cbc = getCbcAttainmentFromScore(s.score);
                      return (
                        <tr key={s.subject} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-bold text-slate-900">{s.subject}</td>
                          <td className="py-2 px-2 text-center font-mono font-extrabold text-slate-800">{s.score}%</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              cbc.code === 'EE' ? 'bg-emerald-100 text-emerald-800' :
                              cbc.code === 'ME' ? 'bg-blue-100 text-blue-800' :
                              cbc.code === 'AE' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {s.attainmentLevel}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-indigo-700">
                            {s.cbcPoints} Pts
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] italic">
                            {s.remarks || 'Commendable performance.'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/80 border-t-2 border-slate-200 font-bold text-xs">
                      <td className="py-2.5 px-3 uppercase font-black text-slate-800">Aggregate Performance</td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-indigo-900">{selectedSlipRecord.averageScore}% avg</td>
                      <td className="py-2.5 px-2 text-center font-black text-emerald-800 uppercase">{selectedSlipRecord.overallAttainmentLevel}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-indigo-900">{selectedSlipRecord.totalCbcPoints} Total Pts</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono">Average 4.0 Point Scale: {selectedSlipRecord.averageCbcPoints}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* CBC Rubrics Scale Explanatory Footer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>EE (4 Pts):</strong> 80–100% Exceeding</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span><strong>ME (3 Pts):</strong> 65–79% Meeting</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span><strong>AE (2 Pts):</strong> 50–64% Approaching</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span><strong>BE (1 Pt):</strong> 0–49% Below</span>
                </div>
              </div>

              {/* Endorsements & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Class Teacher Remarks:</span>
                  <p className="text-slate-800 italic">{selectedSlipRecord.classTeacherRemarks || 'Consistently disciplined, focused, and demonstrates solid competency growth.'}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Dean of Studies Certification:</span>
                  <p className="text-slate-800 italic">{selectedSlipRecord.deanRemarks || 'Certified and authenticated by Academic Affairs Directorate.'}</p>
                  <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                    <span>Published: {selectedSlipRecord.publishedAt || 'Active Session'}</span>
                    <span className="text-emerald-700 font-bold">✓ Official CBC Seal</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
