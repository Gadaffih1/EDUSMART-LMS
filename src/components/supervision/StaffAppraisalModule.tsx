import React, { useState, useEffect } from 'react';
import { 
  User, 
  StaffAppraisalRecord, 
  StaffAppraisalStatus, 
  TPADStandardRating, 
  LessonObservationRecord,
  GradeLevel,
  SubjectName,
  PRIMARY_SUBJECTS,
  JUNIOR_SUBJECTS
} from '../../types';
import { Storage } from '../../utils/storage';
import { INITIAL_TPAD_STANDARDS } from '../../data/staffAppraisalData';
import { 
  Award, 
  FileCheck2, 
  UserCheck, 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Sparkles, 
  Star, 
  TrendingUp, 
  BookOpen, 
  Eye, 
  Edit3, 
  X, 
  Check, 
  Calendar, 
  Building2, 
  Clock, 
  ChevronRight,
  ClipboardCheck,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

interface StaffAppraisalModuleProps {
  currentUser: User;
  allowedRoleModes?: ('appraiser' | 'executive' | 'self')[];
}

export const StaffAppraisalModule: React.FC<StaffAppraisalModuleProps> = ({ 
  currentUser 
}) => {
  const [appraisals, setAppraisals] = useState<StaffAppraisalRecord[]>(() => Storage.getStaffAppraisals());
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(2);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Appraisal for Detail View / Modal
  const [activeAppraisal, setActiveAppraisal] = useState<StaffAppraisalRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEvaluateModalOpen, setIsEvaluateModalOpen] = useState(false);
  const [isObserveModalOpen, setIsObserveModalOpen] = useState(false);
  const [isNewAppraisalModalOpen, setIsNewAppraisalModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Appraiser evaluation state
  const [evalScores, setEvalScores] = useState<Record<string, { appraiserScore: number; agreedScore: number; remarks: string }>>({});
  const [evalGeneralRemarks, setEvalGeneralRemarks] = useState('');
  const [evalTpdGap, setEvalTpdGap] = useState('');
  const [evalTargetInterventions, setEvalTargetInterventions] = useState('');

  // Observation form state
  const [obsDate, setObsDate] = useState(new Date().toISOString().split('T')[0]);
  const [obsSubject, setObsSubject] = useState<SubjectName>('Mathematics');
  const [obsGrade, setObsGrade] = useState<GradeLevel>(4);
  const [obsTopic, setObsTopic] = useState('');
  const [obsScore, setObsScore] = useState<number>(88);
  const [obsStrengths, setObsStrengths] = useState('');
  const [obsGrowth, setObsGrowth] = useState('');

  // New Appraisal form state
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newDepartment, setNewDepartment] = useState('Mathematics & Computational Sciences');
  const [newTscNumber, setNewTscNumber] = useState('');
  const [newDesignation, setNewDesignation] = useState('Senior Teacher');

  useEffect(() => {
    const handleUpdate = () => {
      setAppraisals(Storage.getStaffAppraisals());
    };
    window.addEventListener('staff-appraisals-updated', handleUpdate);
    return () => window.removeEventListener('staff-appraisals-updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter appraisals
  const filteredAppraisals = appraisals.filter(a => {
    const matchesTerm = a.term === selectedTerm;
    const matchesDept = selectedDepartment === 'all' || a.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || a.status === selectedStatus;
    const matchesSearch = !searchQuery.trim() || 
      a.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tscNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.appraiserName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTerm && matchesDept && matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalCount = appraisals.length;
  const completedCount = appraisals.filter(a => a.status === 'completed' || a.status === 'countersigned').length;
  const countersignedCount = appraisals.filter(a => a.status === 'countersigned').length;
  const pendingMeetingCount = appraisals.filter(a => a.status === 'appraisal_meeting_pending' || a.status === 'submitted_for_appraisal').length;
  const avgOverallPercentage = totalCount > 0 
    ? Math.round(appraisals.reduce((sum, a) => sum + (a.overallPercentage || 0), 0) / totalCount) 
    : 0;

  // Departments list
  const departments = Array.from(new Set(appraisals.map(a => a.department)));
  const allUsers = Storage.getUsers();
  const teachersList = allUsers.filter(u => ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(u.role));

  // Open Appraiser Evaluation Modal
  const handleOpenEvaluate = (appraisal: StaffAppraisalRecord) => {
    setActiveAppraisal(appraisal);
    const initialScores: Record<string, { appraiserScore: number; agreedScore: number; remarks: string }> = {};
    appraisal.standards.forEach(std => {
      initialScores[std.standardId] = {
        appraiserScore: std.appraiserScore || std.selfScore || 4,
        agreedScore: std.agreedScore || std.appraiserScore || std.selfScore || 4,
        remarks: std.appraiserRemarks || ''
      };
    });
    setEvalScores(initialScores);
    setEvalGeneralRemarks(appraisal.appraiserGeneralRemarks || '');
    setEvalTpdGap(appraisal.tpdGapIdentified || '');
    setEvalTargetInterventions(appraisal.targetInterventions || '');
    setIsEvaluateModalOpen(true);
  };

  // Submit Appraiser Evaluation
  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppraisal) return;

    let totalPoints = 0;
    const updatedStandards = activeAppraisal.standards.map(std => {
      const entry = evalScores[std.standardId];
      const agreed = entry ? entry.agreedScore : std.agreedScore;
      totalPoints += agreed;
      return {
        ...std,
        appraiserScore: entry ? entry.appraiserScore : std.appraiserScore,
        agreedScore: agreed,
        appraiserRemarks: entry ? entry.remarks : std.appraiserRemarks
      };
    });

    const maxPoints = updatedStandards.length * 5;
    const calculatedPercentage = Math.round((totalPoints / Math.max(1, maxPoints)) * 100);
    
    let grade: StaffAppraisalRecord['performanceGrade'] = 'Good (60-79%)';
    if (calculatedPercentage >= 90) grade = 'Exemplary (90-100%)';
    else if (calculatedPercentage >= 80) grade = 'Very Good (80-89%)';
    else if (calculatedPercentage >= 60) grade = 'Good (60-79%)';
    else if (calculatedPercentage >= 40) grade = 'Fair (40-59%)';
    else grade = 'Needs Improvement (0-39%)';

    Storage.updateStaffAppraisal(activeAppraisal.id, {
      standards: updatedStandards,
      overallPercentage: calculatedPercentage,
      performanceGrade: grade,
      appraiserName: `${currentUser.name} (${currentUser.designation || 'Appraiser'})`,
      appraiserRole: currentUser.role,
      appraiserGeneralRemarks: evalGeneralRemarks.trim(),
      tpdGapIdentified: evalTpdGap.trim(),
      targetInterventions: evalTargetInterventions.trim(),
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    setIsEvaluateModalOpen(false);
    showToast(`Appraisal evaluation saved for ${activeAppraisal.teacherName}! Score: ${calculatedPercentage}% (${grade})`);
  };

  // Countersign appraisal (Head Teacher or Deputy Head)
  const handleCountersign = (appraisal: StaffAppraisalRecord) => {
    Storage.countersignStaffAppraisal(
      appraisal.id, 
      `${currentUser.name} (Head Teacher / Executive Leadership)`,
      'Appraisal ratings certified and officially endorsed for Teachers Service Commission (TSC) records.'
    );
    showToast(`Appraisal for ${appraisal.teacherName} officially countersigned and ratified!`);
  };

  // Log Lesson Observation
  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppraisal) return;

    const newObs: LessonObservationRecord = {
      id: `obs-${Date.now()}`,
      date: obsDate,
      subject: obsSubject,
      grade: obsGrade,
      strandOrTopic: obsTopic.trim() || 'Classroom Teaching Session',
      observationScore: obsScore,
      strengths: obsStrengths.split('\n').map(s => s.trim()).filter(Boolean),
      areasForGrowth: obsGrowth.split('\n').map(s => s.trim()).filter(Boolean),
      observerName: `${currentUser.name} (${currentUser.designation || 'Observer'})`
    };

    const updatedObservations = [...activeAppraisal.lessonObservations, newObs];
    Storage.updateStaffAppraisal(activeAppraisal.id, {
      lessonObservations: updatedObservations
    });

    setIsObserveModalOpen(false);
    setObsTopic('');
    setObsStrengths('');
    setObsGrowth('');
    showToast(`Classroom lesson observation logged for ${activeAppraisal.teacherName} (${obsScore}%)`);
  };

  // Create New Appraisal
  const handleCreateAppraisal = (e: React.FormEvent) => {
    e.preventDefault();
    const teacherUser = allUsers.find(u => u.id === newTeacherId);
    if (!teacherUser) {
      showToast('Please select a valid teacher.');
      return;
    }

    const defaultStandards: TPADStandardRating[] = INITIAL_TPAD_STANDARDS.map(s => ({
      ...s,
      selfScore: 4,
      appraiserScore: 4,
      agreedScore: 4,
      evidenceDescription: 'Schemes of Work and classroom lesson plans submitted.',
      appraiserRemarks: 'Standard pedagogical compliance verified.'
    }));

    const newAppraisal: StaffAppraisalRecord = {
      id: `appraisal-${Date.now()}`,
      teacherId: teacherUser.id,
      teacherName: teacherUser.name,
      tscNumber: newTscNumber.trim() || `TSC/${Math.floor(Math.random()*800000 + 100000)}/KE`,
      designation: newDesignation.trim() || 'Teacher',
      department: newDepartment,
      subjectsTaught: (teacherUser.assignedSubjects && teacherUser.assignedSubjects.length > 0 ? teacherUser.assignedSubjects : ['Mathematics']) as SubjectName[],
      term: selectedTerm,
      academicYear: 2026,
      status: 'submitted_for_appraisal',
      standards: defaultStandards,
      lessonObservations: [],
      tpdGapIdentified: 'Formative assessment alignment with CBC guidelines.',
      targetInterventions: 'Participate in departmental peer lesson review.',
      appraiserName: `${currentUser.name}`,
      appraiserRole: currentUser.role,
      overallPercentage: 80,
      performanceGrade: 'Very Good (80-89%)',
      createdAt: new Date().toISOString()
    };

    Storage.addStaffAppraisal(newAppraisal);
    setIsNewAppraisalModalOpen(false);
    showToast(`New Term ${selectedTerm} appraisal record created for ${teacherUser.name}!`);
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
              TSC TPAD Framework · Kenyan National Standards
            </span>
            <span className="text-xs font-bold text-slate-500">
              Staff Performance Appraisal & Development (SPAD)
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            <span>Teacher & Staff Performance Appraisal Module</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Institutional appraisal desk for teaching standards, self-evaluations, lesson observations, and executive countersigning across all departments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsNewAppraisalModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Teacher Appraisal</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            title="Print Appraisal Dossiers"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Export Dossiers</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Appraisals Tracked</div>
          <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
            <span>{totalCount}</span>
            <span className="text-xs font-bold text-slate-500">Teachers</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Academic Year 2026</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Countersigned & Sealed</div>
          <div className="text-2xl font-black text-emerald-600 flex items-baseline gap-1.5">
            <span>{countersignedCount}</span>
            <span className="text-xs font-bold text-emerald-700 font-mono">({Math.round((countersignedCount/Math.max(1, totalCount))*100)}%)</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-mono">Ratified by Head Teacher</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Pending Review & Conference</div>
          <div className="text-2xl font-black text-amber-600 flex items-baseline gap-1.5">
            <span>{pendingMeetingCount}</span>
            <span className="text-xs font-bold text-amber-700">Awaiting</span>
          </div>
          <div className="text-[10px] text-amber-700 font-mono">Appraiser interview pending</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Institutional Mean Score</div>
          <div className="text-2xl font-black text-indigo-700 flex items-baseline gap-1.5">
            <span>{avgOverallPercentage}%</span>
            <span className="text-xs font-bold text-indigo-600 font-mono">Very Good</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Across 5 TSC Standards</div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search teacher, TSC number, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 w-56 sm:w-64 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Term:</span>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(Number(e.target.value) as any)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700"
            >
              <option value={1}>Term 1</option>
              <option value={2}>Term 2 (Active)</option>
              <option value={3}>Term 3</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Department:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700 max-w-[160px]"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="countersigned">Countersigned</option>
              <option value="completed">Completed by Appraiser</option>
              <option value="appraisal_meeting_pending">Meeting Pending</option>
              <option value="submitted_for_appraisal">Submitted by Teacher</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredAppraisals.length} of {appraisals.length} appraisals
        </div>
      </div>

      {/* 5 TSC STANDARDS INFO BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xs border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">The 5 Core TSC Appraisal Standards</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Scale: 1 (Inadequate) to 5 (Exemplary)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="font-bold text-indigo-300 text-[11px]">1. Professional Knowledge</div>
            <p className="text-[10px] text-slate-300 mt-1">Schemes of work, lesson plans, KICD curriculum delivery.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="font-bold text-blue-300 text-[11px]">2. Learning Environment</div>
            <p className="text-[10px] text-slate-300 mt-1">Classroom safety, talking walls, positive discipline & inclusion.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="font-bold text-amber-300 text-[11px]">3. Professional Growth (TPD)</div>
            <p className="text-[10px] text-slate-300 mt-1">TPD modules, seminars, peer mentorship & ICT integration.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="font-bold text-rose-300 text-[11px]">4. Learner Protection & Values</div>
            <p className="text-[10px] text-slate-300 mt-1">Child safeguarding, pastoral care & CBC value inculcation.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="font-bold text-emerald-300 text-[11px]">5. Conduct & Performance</div>
            <p className="text-[10px] text-slate-300 mt-1">Punctuality, duty roster compliance & TSC ethics.</p>
          </div>
        </div>
      </div>

      {/* APPRAISALS LIST */}
      <div className="space-y-3">
        {filteredAppraisals.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-slate-800">No Appraisal Records Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No staff appraisals match the selected filter. Change your filter or initiate a new appraisal.
            </p>
          </div>
        ) : (
          filteredAppraisals.map((a) => {
            const isCompleted = a.status === 'completed' || a.status === 'countersigned';
            const isCountersigned = a.status === 'countersigned';

            return (
              <div 
                key={a.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Teacher Info */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {a.tscNumber}
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {a.department}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        Term {a.term}, {a.academicYear}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{a.teacherName}</h3>
                      <span className="text-xs text-slate-400 font-medium">({a.designation})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <div>Subjects: <strong className="text-slate-700">{a.subjectsTaught.join(', ')}</strong></div>
                      <span>·</span>
                      <div>Appraiser: <strong className="text-slate-700">{a.appraiserName}</strong></div>
                      {a.countersigningOfficerName && (
                        <>
                          <span>·</span>
                          <div>Countersigned by: <strong className="text-emerald-700">{a.countersigningOfficerName}</strong></div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Score & Status Badge */}
                  <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                    <div className="text-right">
                      <div className="text-xl font-black text-indigo-700 flex items-center justify-end gap-1">
                        <span>{a.overallPercentage}%</span>
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">{a.performanceGrade}</div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isCountersigned ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      a.status === 'completed' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {isCountersigned ? '✅ Countersigned & Ratified' :
                       a.status === 'completed' ? '🟦 Appraiser Evaluated' :
                       a.status === 'appraisal_meeting_pending' ? '⏳ Meeting Scheduled' : '📝 Self-Appraisal Submitted'}
                    </span>
                  </div>

                </div>

                {/* 5 Standards Mini-Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 text-xs">
                  {a.standards.map((std, idx) => (
                    <div key={std.standardId} className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Std {idx + 1}</span>
                        <span className="font-mono text-indigo-700 font-black">{std.agreedScore}/5</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 truncate" title={std.standardTitle}>
                        {std.standardTitle}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate italic">
                        {std.evidenceDescription}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-400 font-mono">
                    {a.lessonObservations.length} Classroom Lesson Observation(s) recorded
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setActiveAppraisal(a); setIsDetailModalOpen(true); }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Dossier</span>
                    </button>

                    <button
                      onClick={() => { setActiveAppraisal(a); setIsObserveModalOpen(true); }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Log Observation</span>
                    </button>

                    <button
                      onClick={() => handleOpenEvaluate(a)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Evaluate Standards</span>
                    </button>

                    {!isCountersigned && (
                      <button
                        onClick={() => handleCountersign(a)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Official Ratification by Executive Leadership"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Countersign</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          MODAL: FULL APPRAISAL DOSSIER & TSC REPORT
          ======================================================== */}
      {isDetailModalOpen && activeAppraisal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Official TSC TPAD Dossier</div>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{activeAppraisal.teacherName} ({activeAppraisal.tscNumber})</h3>
                <p className="text-xs text-slate-500">{activeAppraisal.designation} · {activeAppraisal.department}</p>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto pr-1">
              
              {/* Overall Summary Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Appraisal Status</div>
                  <div className="font-bold text-slate-900 capitalize mt-0.5">{activeAppraisal.status.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Overall Rating</div>
                  <div className="font-black text-indigo-700 mt-0.5">{activeAppraisal.overallPercentage}%</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Performance Grade</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeAppraisal.performanceGrade}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Academic Cycle</div>
                  <div className="font-bold text-slate-900 mt-0.5">Term {activeAppraisal.term}, 2026</div>
                </div>
              </div>

              {/* 5 Standards Breakdown */}
              <div className="space-y-3">
                <div className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Standards Attainment & Evidence</span>
                </div>

                {activeAppraisal.standards.map((std, idx) => (
                  <div key={std.standardId} className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900">
                        Standard {idx + 1}: {std.standardTitle}
                      </div>
                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-slate-500">Self: <strong>{std.selfScore}/5</strong></span>
                        <span className="text-indigo-600">Appraiser: <strong>{std.appraiserScore}/5</strong></span>
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-black">Agreed: {std.agreedScore}/5</span>
                      </div>
                    </div>
                    <div className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed text-[11px]">
                      <strong>Evidence:</strong> {std.evidenceDescription}
                    </div>
                    {std.appraiserRemarks && (
                      <div className="text-indigo-900 bg-indigo-50/50 p-2 rounded-xl text-[11px] italic">
                        <strong>Appraiser Remarks:</strong> "{std.appraiserRemarks}"
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Lesson Observations History */}
              <div className="space-y-2">
                <div className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Classroom Lesson Observations</span>
                </div>

                {activeAppraisal.lessonObservations.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-400">
                    No lesson observations recorded for this cycle yet.
                  </div>
                ) : (
                  activeAppraisal.lessonObservations.map(obs => (
                    <div key={obs.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900">
                          {obs.subject} (Grade {obs.grade}) · "{obs.strandOrTopic}"
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                          {obs.observationScore}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Observed by {obs.observerName} on {obs.date}
                      </div>
                      {obs.strengths.length > 0 && (
                        <div className="text-[11px] text-emerald-900">
                          <strong>Strengths:</strong> {obs.strengths.join(' · ')}
                        </div>
                      )}
                      {obs.areasForGrowth.length > 0 && (
                        <div className="text-[11px] text-amber-900">
                          <strong>Growth Areas:</strong> {obs.areasForGrowth.join(' · ')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* TPD & Interventions */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                <div className="font-bold text-indigo-950">Teacher Professional Development (TPD) Gap & Targets:</div>
                <p className="text-indigo-900 text-xs">{activeAppraisal.tpdGapIdentified}</p>
                <div className="text-indigo-800 font-medium text-xs pt-1">
                  <strong>Intervention Plan:</strong> {activeAppraisal.targetInterventions}
                </div>
              </div>

              {/* Countersigning Statement */}
              {activeAppraisal.countersigningOfficerName && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Executive Countersigning Ratification</span>
                  </div>
                  <p className="text-xs leading-relaxed italic">"{activeAppraisal.countersigningRemarks}"</p>
                  <div className="text-[10px] text-emerald-700 font-mono mt-1">
                    Ratified by {activeAppraisal.countersigningOfficerName} on {new Date(activeAppraisal.countersignedAt || '').toLocaleDateString()}
                  </div>
                </div>
              )}

            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Dossier</span>
              </button>
              
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EVALUATE STANDARDS (APPRAISER INTERFACE)
          ======================================================== */}
      {isEvaluateModalOpen && activeAppraisal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Appraiser Rating Conference</h3>
                <p className="text-xs text-slate-500">Appraisee: {activeAppraisal.teacherName} ({activeAppraisal.department})</p>
              </div>
              <button 
                onClick={() => setIsEvaluateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
              
              <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                {activeAppraisal.standards.map((std, idx) => {
                  const entry = evalScores[std.standardId] || { appraiserScore: 4, agreedScore: 4, remarks: '' };

                  return (
                    <div key={std.standardId} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Standard {idx + 1}: {std.standardTitle}</span>
                        <span className="text-slate-400 text-[10px]">Self: {std.selfScore}/5</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Appraiser Score (1-5)</label>
                          <select
                            value={entry.appraiserScore}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEvalScores(prev => ({
                                ...prev,
                                [std.standardId]: { ...entry, appraiserScore: val, agreedScore: val }
                              }));
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold"
                          >
                            <option value={5}>5 - Exemplary</option>
                            <option value={4}>4 - Very Good</option>
                            <option value={3}>3 - Good</option>
                            <option value={2}>2 - Fair</option>
                            <option value={1}>1 - Inadequate</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Agreed Conference Score (1-5)</label>
                          <select
                            value={entry.agreedScore}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEvalScores(prev => ({
                                ...prev,
                                [std.standardId]: { ...entry, agreedScore: val }
                              }));
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-indigo-700"
                          >
                            <option value={5}>5 - Exemplary</option>
                            <option value={4}>4 - Very Good</option>
                            <option value={3}>3 - Good</option>
                            <option value={2}>2 - Fair</option>
                            <option value={1}>1 - Inadequate</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Appraiser feedback remarks on this standard..."
                          value={entry.remarks}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEvalScores(prev => ({
                              ...prev,
                              [std.standardId]: { ...entry, remarks: val }
                            }));
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="space-y-2 pt-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">TPD Gap Identified</label>
                    <input
                      type="text"
                      placeholder="e.g. ICT laboratory simulation software mastery"
                      value={evalTpdGap}
                      onChange={(e) => setEvalTpdGap(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Target Interventions & Remedial Plan</label>
                    <input
                      type="text"
                      placeholder="e.g. Attend CEMASTEA regional workshop in November"
                      value={evalTargetInterventions}
                      onChange={(e) => setEvalTargetInterventions(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">General Appraiser Recommendation</label>
                    <textarea
                      rows={2}
                      placeholder="Overall evaluation remarks on teacher competence and growth..."
                      value={evalGeneralRemarks}
                      onChange={(e) => setEvalGeneralRemarks(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEvaluateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save Agreed Appraisal Scores
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: LOG LESSON OBSERVATION
          ======================================================== */}
      {isObserveModalOpen && activeAppraisal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Record Lesson Observation</h3>
                <p className="text-xs text-slate-500">Teacher: {activeAppraisal.teacherName}</p>
              </div>
              <button 
                onClick={() => setIsObserveModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddObservation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Observation Date</label>
                  <input
                    type="date"
                    value={obsDate}
                    onChange={(e) => setObsDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade Observed</label>
                  <select
                    value={obsGrade}
                    onChange={(e) => setObsGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={obsSubject}
                    onChange={(e) => setObsSubject(e.target.value as SubjectName)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {[...PRIMARY_SUBJECTS, ...JUNIOR_SUBJECTS].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Score % (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={obsScore}
                    onChange={(e) => setObsScore(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Topic / Strand Observed</label>
                <input
                  type="text"
                  placeholder="e.g. Capillary Action in Plant Xylem"
                  value={obsTopic}
                  onChange={(e) => setObsTopic(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pedagogical Strengths (one per line)</label>
                <textarea
                  rows={2}
                  placeholder="Strong inquiry questioning&#10;Excellent realia apparatus integration"
                  value={obsStrengths}
                  onChange={(e) => setObsStrengths(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Areas for Pedagogical Growth (one per line)</label>
                <textarea
                  rows={2}
                  placeholder="Check hypothesis before experiment&#10;Provide challenge work for fast learners"
                  value={obsGrowth}
                  onChange={(e) => setObsGrowth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsObserveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save Observation
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: INITIATE NEW TEACHER APPRAISAL
          ======================================================== */}
      {isNewAppraisalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Initiate Staff Appraisal</h3>
                <p className="text-xs text-slate-500">Term {selectedTerm}, 2026 Appraisal Cycle</p>
              </div>
              <button 
                onClick={() => setIsNewAppraisalModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppraisal} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Teacher</label>
                <select
                  value={newTeacherId}
                  onChange={(e) => setNewTeacherId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="">-- Choose Instructor --</option>
                  {teachersList.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.role.replace(/_/g, ' ')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">TSC Number</label>
                <input
                  type="text"
                  placeholder="e.g. TSC/582910/KE"
                  value={newTscNumber}
                  onChange={(e) => setNewTscNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Mathematics & Computational Sciences">Mathematics & Computational Sciences</option>
                  <option value="Pure & Integrated Sciences">Pure & Integrated Sciences</option>
                  <option value="Technical & Applied Sciences">Technical & Applied Sciences</option>
                  <option value="Languages & Literature">Languages & Literature</option>
                  <option value="Pretechnical & Creative Arts">Pretechnical & Creative Arts</option>
                  <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Teacher / Instructor"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewAppraisalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Create Appraisal Dossier
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
