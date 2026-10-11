import React, { useState, useEffect } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName,
  SubjectName, 
  CBATaskMapping,
  CBACoreCompetency,
  CBABloomDomain,
  CBAAssessmentType,
  CBARubricCriterion,
  AssessmentCycle,
  PRIMARY_SUBJECTS,
  JUNIOR_SUBJECTS
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  Target, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  Award, 
  BookOpen, 
  BarChart3, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Printer, 
  RefreshCw, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Check,
  X,
  Clock,
  Eye,
  Sliders,
  TrendingUp,
  Edit3,
  Trash2,
  Send
} from 'lucide-react';

interface CBATaskMappingModuleProps {
  currentUser: User;
}

export const CBATaskMappingModule: React.FC<CBATaskMappingModuleProps> = ({ currentUser }) => {
  const [mappings, setMappings] = useState<CBATaskMapping[]>(() => Storage.getCBATaskMappings());
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCompetency, setSelectedCompetency] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMapping, setSelectedMapping] = useState<CBATaskMapping | null>(null);

  // Modal State for New Task Mapping
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formGrade, setFormGrade] = useState<GradeLevel>(4);
  const [formStream, setFormStream] = useState<StreamName | 'all'>('all');
  const [formSubject, setFormSubject] = useState<SubjectName>('Mathematics');
  const [formStrand, setFormStrand] = useState('');
  const [formSubStrand, setFormSubStrand] = useState('');
  const [formObjectiveCode, setFormObjectiveCode] = useState('');
  const [formObjectiveText, setFormObjectiveText] = useState('');
  const [formCoreCompetency, setFormCoreCompetency] = useState<CBACoreCompetency>('Critical Thinking & Problem Solving');
  const [formBloomDomain, setFormBloomDomain] = useState<CBABloomDomain>('Applying & Calculating');
  const [formTaskTitle, setFormTaskTitle] = useState('');
  const [formTaskDesc, setFormTaskDesc] = useState('');
  const [formAssessmentType, setFormAssessmentType] = useState<CBAAssessmentType>('Authentic Performance Task');
  const [formAssessmentCycle, setFormAssessmentCycle] = useState<AssessmentCycle | 'Weekly Formative'>('Continuous Assessment (CATs)');
  const [formTeacherName, setFormTeacherName] = useState(currentUser.name);
  const [formWeightage, setFormWeightage] = useState<number>(20);
  
  // Quick Rubric Criteria for new modal
  const [formRubricCrit1Title, setFormRubricCrit1Title] = useState('Core Skill Mastery');
  const [formRubricCrit1EE, setFormRubricCrit1EE] = useState('Exceeds required steps with self-directed creativity.');
  const [formRubricCrit1ME, setFormRubricCrit1ME] = useState('Satisfactorily meets standard operational guidelines.');
  const [formRubricCrit1AE, setFormRubricCrit1AE] = useState('Partially completes task with scaffolded guidance.');
  const [formRubricCrit1BE, setFormRubricCrit1BE] = useState('Needs continuous individual intervention.');

  // Verification & Advisory state
  const [advisoryNote, setAdvisoryNote] = useState('');
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);

  // Edit Mapping & Comment Modal State
  const [editingMapping, setEditingMapping] = useState<CBATaskMapping | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [mappingCommentText, setMappingCommentText] = useState('');
  const [activeCommentMapping, setActiveCommentMapping] = useState<CBATaskMapping | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setMappings(Storage.getCBATaskMappings());
    };
    window.addEventListener('cba-task-mappings-updated', handleUpdate);
    return () => window.removeEventListener('cba-task-mappings-updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Mappings
  const filteredMappings = mappings.filter(m => {
    const matchesGrade = selectedGrade === 'all' || m.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'all' || m.subject === selectedSubject;
    const matchesCompetency = selectedCompetency === 'all' || m.coreCompetency === selectedCompetency;
    const matchesStatus = selectedStatus === 'all' || m.alignmentStatus === selectedStatus;
    const matchesSearch = !searchQuery.trim() || 
      m.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.curriculumObjective.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.strand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.leadTeacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.objectiveCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesSubject && matchesCompetency && matchesStatus && matchesSearch;
  });

  // Analytics Metrics
  const totalCount = mappings.length;
  const verifiedCount = mappings.filter(m => m.alignmentStatus === 'verified').length;
  const pendingCount = mappings.filter(m => m.alignmentStatus === 'pending_verification').length;
  const remediationCount = mappings.filter(m => m.alignmentStatus === 'needs_remediation').length;
  const avgAlignment = totalCount > 0 
    ? Math.round(mappings.reduce((acc, m) => acc + (m.alignmentScore || 0), 0) / totalCount)
    : 0;

  // Handle Verify Mapping
  const handleVerify = (id: string) => {
    Storage.verifyCBATaskMapping(id, `${currentUser.name} (${currentUser.designation || 'Curriculum Coordinator'})`, 'Verified alignment with KICD CBA Guidelines.', 95);
    setMappings(Storage.getCBATaskMappings());
    if (selectedMapping?.id === id) {
      setSelectedMapping(prev => prev ? { ...prev, alignmentStatus: 'verified', alignmentScore: 95 } : null);
    }
    showToast('CBA Task successfully verified and certified for KICD compliance!');
  };

  // Handle Send Advisory
  const handleSendAdvisory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMapping || !advisoryNote.trim()) return;

    Storage.updateCBATaskMapping(selectedMapping.id, {
      coordinatorNotes: advisoryNote.trim(),
      alignmentStatus: 'needs_remediation'
    });

    Storage.addAnnouncement({
      id: `cba-adv-${Date.now()}`,
      title: `CBA Alignment Advisory: ${selectedMapping.subject} Grade ${selectedMapping.grade}`,
      content: `ATTN: ${selectedMapping.leadTeacherName}\n\n${advisoryNote.trim()}\n\nTask: ${selectedMapping.taskTitle}\nObjective Code: ${selectedMapping.objectiveCode}`,
      type: 'urgent',
      targetGrade: selectedMapping.grade,
      author: currentUser.name,
      authorRole: 'Curriculum Coordinator',
      createdAt: new Date().toISOString()
    });

    setMappings(Storage.getCBATaskMappings());
    setIsAdvisoryModalOpen(false);
    setAdvisoryNote('');
    showToast(`Advisory memo dispatched to ${selectedMapping.leadTeacherName}!`);
  };

  // Handle Create New Mapping
  const handleCreateMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTaskTitle.trim() || !formObjectiveText.trim() || !formStrand.trim()) {
      showToast('Please fill in the strand, objective, and task title.');
      return;
    }

    const newMapping: CBATaskMapping = {
      id: `cba-map-${Date.now()}`,
      grade: formGrade,
      stream: formStream,
      subject: formSubject,
      term: 2,
      academicYear: 2026,
      strand: formStrand.trim(),
      subStrand: formSubStrand.trim() || formStrand.trim(),
      objectiveCode: formObjectiveCode.trim() || `CBC-${formSubject.slice(0,3).toUpperCase()}-G${formGrade}-${Math.floor(Math.random()*900 + 100)}`,
      curriculumObjective: formObjectiveText.trim(),
      coreCompetency: formCoreCompetency,
      bloomDomain: formBloomDomain,
      taskTitle: formTaskTitle.trim(),
      taskDescription: formTaskDesc.trim() || formTaskTitle.trim(),
      assessmentType: formAssessmentType,
      assessmentCycle: formAssessmentCycle,
      leadTeacherName: formTeacherName.trim() || currentUser.name,
      weightagePercent: formWeightage,
      rubricCriteria: [
        {
          id: `crit-${Date.now()}-1`,
          criterionTitle: formRubricCrit1Title.trim() || 'Performance Standard',
          eeDescriptor: formRubricCrit1EE.trim(),
          meDescriptor: formRubricCrit1ME.trim(),
          aeDescriptor: formRubricCrit1AE.trim(),
          beDescriptor: formRubricCrit1BE.trim()
        }
      ],
      alignmentStatus: 'verified',
      alignmentScore: 92,
      attainmentDistribution: {
        eeCount: 12,
        meCount: 20,
        aeCount: 6,
        beCount: 2,
        totalLearners: 40
      },
      coordinatorNotes: 'Mapped and validated by Curriculum Directorate.',
      lastVerifiedBy: `${currentUser.name} (Curriculum Coordinator)`,
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    Storage.addCBATaskMapping(newMapping);
    setMappings(Storage.getCBATaskMappings());
    setIsAddModalOpen(false);
    showToast('New CBA Task Mapping registered and aligned successfully!');
    
    // Reset Form
    setFormStrand('');
    setFormSubStrand('');
    setFormObjectiveCode('');
    setFormObjectiveText('');
    setFormTaskTitle('');
    setFormTaskDesc('');
  };

  const handleOpenEditModal = (m: CBATaskMapping) => {
    setEditingMapping(m);
    setFormGrade(m.grade);
    setFormStream(m.stream as any);
    setFormSubject(m.subject);
    setFormStrand(m.strand);
    setFormSubStrand(m.subStrand);
    setFormObjectiveCode(m.objectiveCode);
    setFormObjectiveText(m.curriculumObjective);
    setFormCoreCompetency(m.coreCompetency);
    setFormBloomDomain(m.bloomDomain);
    setFormTaskTitle(m.taskTitle);
    setFormTaskDesc(m.taskDescription);
    setFormAssessmentType(m.assessmentType);
    setFormAssessmentCycle(m.assessmentCycle);
    setFormTeacherName(m.leadTeacherName);
    setFormWeightage(m.weightagePercent);
    if (m.rubricCriteria && m.rubricCriteria.length > 0) {
      setFormRubricCrit1Title(m.rubricCriteria[0].criterionTitle);
      setFormRubricCrit1EE(m.rubricCriteria[0].eeDescriptor);
      setFormRubricCrit1ME(m.rubricCriteria[0].meDescriptor);
      setFormRubricCrit1AE(m.rubricCriteria[0].aeDescriptor);
      setFormRubricCrit1BE(m.rubricCriteria[0].beDescriptor);
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEditedMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapping) return;

    Storage.updateCBATaskMapping(editingMapping.id, {
      grade: formGrade,
      stream: formStream,
      subject: formSubject,
      strand: formStrand.trim() || editingMapping.strand,
      subStrand: formSubStrand.trim() || editingMapping.subStrand,
      objectiveCode: formObjectiveCode.trim() || editingMapping.objectiveCode,
      curriculumObjective: formObjectiveText.trim() || editingMapping.curriculumObjective,
      coreCompetency: formCoreCompetency,
      bloomDomain: formBloomDomain,
      taskTitle: formTaskTitle.trim() || editingMapping.taskTitle,
      taskDescription: formTaskDesc.trim() || editingMapping.taskDescription,
      assessmentType: formAssessmentType,
      assessmentCycle: formAssessmentCycle,
      leadTeacherName: formTeacherName.trim() || editingMapping.leadTeacherName,
      weightagePercent: formWeightage,
      rubricCriteria: [
        {
          id: editingMapping.rubricCriteria?.[0]?.id || `crit-${Date.now()}`,
          criterionTitle: formRubricCrit1Title.trim() || 'Performance Standard',
          eeDescriptor: formRubricCrit1EE.trim(),
          meDescriptor: formRubricCrit1ME.trim(),
          aeDescriptor: formRubricCrit1AE.trim(),
          beDescriptor: formRubricCrit1BE.trim()
        }
      ],
      lastVerifiedBy: `${currentUser.name} (Curriculum Coordinator)`,
      lastVerifiedAt: new Date().toISOString()
    });

    setMappings(Storage.getCBATaskMappings());
    if (selectedMapping?.id === editingMapping.id) {
      const updated = Storage.getCBATaskMappings().find(m => m.id === editingMapping.id);
      if (updated) setSelectedMapping(updated);
    }
    setIsEditModalOpen(false);
    setEditingMapping(null);
    showToast('CBA Task Mapping edited and updated successfully!');
  };

  const handleDeleteMapping = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove the CBA Task Mapping "${title}"?`)) {
      Storage.deleteCBATaskMapping(id);
      setMappings(Storage.getCBATaskMappings());
      if (selectedMapping?.id === id) setSelectedMapping(null);
      showToast(`CBA Task Mapping "${title}" removed.`);
    }
  };

  const handleAddCommentToMapping = (mappingId: string, commentText: string) => {
    if (!commentText.trim()) return;
    Storage.addCommentToCBATaskMapping(mappingId, {
      author: currentUser.name,
      authorRole: 'Curriculum Coordinator',
      comment: commentText.trim()
    });
    setMappings(Storage.getCBATaskMappings());
    if (selectedMapping?.id === mappingId) {
      const updated = Storage.getCBATaskMappings().find(m => m.id === mappingId);
      if (updated) setSelectedMapping(updated);
    }
    setMappingCommentText('');
    setIsCommentModalOpen(false);
    setActiveCommentMapping(null);
    showToast('Coordinator comment added to CBA task mapping!');
  };

  const handleRemoveCommentFromMapping = (mappingId: string, commentId: string) => {
    if (window.confirm('Remove this comment from the task mapping?')) {
      Storage.removeCommentFromCBATaskMapping(mappingId, commentId);
      setMappings(Storage.getCBATaskMappings());
      if (selectedMapping?.id === mappingId) {
        const updated = Storage.getCBATaskMappings().find(m => m.id === mappingId);
        if (updated) setSelectedMapping(updated);
      }
      showToast('Comment removed.');
    }
  };

  const allSubjects = Array.from(new Set([...PRIMARY_SUBJECTS, ...JUNIOR_SUBJECTS]));

  return (
    <div className="space-y-5">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold bg-slate-900 text-white border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR & BANNER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              KICD CBC Competency Architecture
            </span>
            <span className="text-xs font-bold text-slate-500">
              Formative & Summative Alignment Studio
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span>CBA Task Mapping & Curriculum Objective Visualizer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Audit and map institutional alignment between national KICD syllabus objectives and class-level learning assessments, observation checklists, and performance rubrics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Link New CBA Task</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            title="Print Alignment Matrix"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Export Matrix</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Mapped Tasks</div>
          <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
            <span>{totalCount}</span>
            <span className="text-xs font-bold text-slate-500">Active</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Grades 1 through 9</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase">KICD Verified Alignment</div>
          <div className="text-2xl font-black text-emerald-600 flex items-baseline gap-1.5">
            <span>{verifiedCount}</span>
            <span className="text-xs font-bold text-emerald-700 font-mono">({Math.round((verifiedCount/Math.max(1, totalCount))*100)}%)</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-mono">Certified Objective Alignment</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Under Coordinator Review</div>
          <div className="text-2xl font-black text-amber-600 flex items-baseline gap-1.5">
            <span>{pendingCount}</span>
            <span className="text-xs font-bold text-amber-700">Pending</span>
          </div>
          <div className="text-[10px] text-amber-700 font-mono">Formative submissions</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Mean Alignment Index</div>
          <div className="text-2xl font-black text-indigo-700 flex items-baseline gap-1.5">
            <span>{avgAlignment}%</span>
            <span className="text-xs font-bold text-indigo-600 font-mono">Score</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Rubric & Competency Match</div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search objective, task, teacher, strand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 w-56 sm:w-64 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Grade:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : Number(e.target.value) as GradeLevel)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700"
            >
              <option value="all">All Grades</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700 max-w-[150px]"
            >
              <option value="all">All Subjects</option>
              {allSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
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
              <option value="verified">Verified (Aligned)</option>
              <option value="pending_verification">Pending Review</option>
              <option value="needs_remediation">Needs Remediation</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredMappings.length} of {totalCount} task linkages
        </div>
      </div>

      {/* VISUAL ALIGNMENT FLOW PIPELINE: STRAND ➔ OBJECTIVE ➔ TASK ➔ CLASS RUBRIC */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Interactive CBA Alignment Architecture</h3>
              <p className="text-[11px] text-slate-400">Step-through tracing from National Learning Outcomes down to classroom rubric evidence</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>KICD Standard 2026</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-indigo-300">Phase 1</span>
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="font-bold text-white text-xs">Curriculum Objective (SLO)</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              KICD Competency target formulated with measurable cognitive or psychomotor action verbs.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-blue-300">Phase 2</span>
              <Award className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="font-bold text-white text-xs">Authentic CBA Task</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Class practical lab, Scratch coding script, project model, or observational inquiry challenge.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-300">Phase 3</span>
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="font-bold text-white text-xs">4-Tier Attainment Rubric</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Criteria descriptors for EE (Exceeding), ME (Meeting), AE (Approaching), and BE (Below).
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-300">Phase 4</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-bold text-white text-xs">Coordinator Moderation</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Attainment distributions audit to eliminate grade inflation and address student learning gaps.
            </p>
          </div>
        </div>
      </div>

      {/* MAPPING TABLE / CARDS GRID */}
      <div className="space-y-3">
        {filteredMappings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-slate-800">No CBA Task Mappings Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No curriculum objectives match the current search filter. Adjust your filter or link a new task.
            </p>
            <button
              onClick={() => { setSelectedGrade('all'); setSelectedSubject('all'); setSelectedStatus('all'); setSearchQuery(''); }}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredMappings.map((m) => {
            const isSelected = selectedMapping?.id === m.id;
            const attainment = m.attainmentDistribution;
            const totalStudents = attainment?.totalLearners || 1;
            const eePercent = Math.round(((attainment?.eeCount || 0) / totalStudents) * 100);
            const mePercent = Math.round(((attainment?.meCount || 0) / totalStudents) * 100);
            const aePercent = Math.round(((attainment?.aeCount || 0) / totalStudents) * 100);
            const bePercent = Math.round(((attainment?.beCount || 0) / totalStudents) * 100);

            return (
              <div 
                key={m.id}
                className={`bg-white rounded-3xl p-5 border transition-all shadow-xs ${
                  isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  
                  {/* Left Column: Objective, Strand & Task Title */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {m.objectiveCode}
                      </span>
                      <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        Grade {m.grade} {m.stream !== 'all' ? `(${m.stream})` : '(All Streams)'} · {m.subject}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {m.coreCompetency}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                        {m.bloomDomain}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>{m.taskTitle}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          m.alignmentStatus === 'verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          m.alignmentStatus === 'needs_remediation' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {m.alignmentStatus === 'verified' ? '✅ Verified Aligned' :
                           m.alignmentStatus === 'needs_remediation' ? '⚠️ Needs Remediation' : '⏳ Pending Audit'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        <strong className="text-slate-800">SLO Objective:</strong> "{m.curriculumObjective}"
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 italic">
                        Strand: {m.strand} → {m.subStrand}
                      </p>
                    </div>

                    {/* Teacher & Assessment meta */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <div>
                        Lead Teacher: <strong className="text-slate-700">{m.leadTeacherName}</strong>
                      </div>
                      <div>
                        Assessment Type: <strong className="text-slate-700">{m.assessmentType}</strong>
                      </div>
                      <div>
                        Weightage: <strong className="text-slate-700">{m.weightagePercent}%</strong>
                      </div>
                      <div>
                        Cycle: <strong className="text-slate-700">{m.assessmentCycle}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Attainment Mini-Bar */}
                  <div className="w-full lg:w-64 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 shrink-0">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>Attainment Cohort ({attainment?.totalLearners || 0} Learners)</span>
                      <span className="text-indigo-600 font-mono">{m.alignmentScore}% Match</span>
                    </div>

                    {/* Stacked bar */}
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div style={{ width: `${eePercent}%` }} className="bg-emerald-500 h-full" title={`EE: ${eePercent}%`} />
                      <div style={{ width: `${mePercent}%` }} className="bg-blue-500 h-full" title={`ME: ${mePercent}%`} />
                      <div style={{ width: `${aePercent}%` }} className="bg-amber-500 h-full" title={`AE: ${aePercent}%`} />
                      <div style={{ width: `${bePercent}%` }} className="bg-rose-500 h-full" title={`BE: ${bePercent}%`} />
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                      <div className="text-emerald-700">EE {eePercent}%</div>
                      <div className="text-blue-700">ME {mePercent}%</div>
                      <div className="text-amber-700">AE {aePercent}%</div>
                      <div className="text-rose-700">BE {bePercent}%</div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center gap-1.5 self-start shrink-0">
                    <button
                      onClick={() => setSelectedMapping(isSelected ? null : m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Close' : 'Rubric'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(m)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Edit this CBA Task Mapping"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => { setActiveCommentMapping(m); setIsCommentModalOpen(true); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer relative"
                      title="Add or View Coordinator Comments"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Comment</span>
                      {m.comments && m.comments.length > 0 && (
                        <span className="w-4 h-4 bg-blue-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                          {m.comments.length}
                        </span>
                      )}
                    </button>

                    {m.alignmentStatus !== 'verified' && (
                      <button
                        onClick={() => handleVerify(m.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Verify KICD Alignment"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify</span>
                      </button>
                    )}

                    <button
                      onClick={() => { setSelectedMapping(m); setIsAdvisoryModalOpen(true); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Send Advisory to Teacher"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Advisory</span>
                    </button>

                    <button
                      onClick={() => handleDeleteMapping(m.id, m.taskTitle)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                      title="Remove this CBA Task Mapping"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                </div>

                {/* EXPANDED RUBRIC & AUDIT DETAILS */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
                    
                    {/* Task Description */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700">
                      <div className="font-bold text-slate-900 mb-0.5">Task Practical Instructions & Methodology:</div>
                      <p className="leading-relaxed">{m.taskDescription}</p>
                    </div>

                    {/* Rubric Criteria Grid */}
                    <div className="space-y-2">
                      <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-indigo-600" />
                        <span>KICD 4-Tier Assessment Rubric Descriptors</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                          <thead className="bg-slate-100 font-bold text-slate-700">
                            <tr>
                              <th className="py-2.5 px-3 border-r border-slate-200 w-1/4">Criterion</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 bg-emerald-50 text-emerald-900">EE (4 Points)</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 bg-blue-50 text-blue-900">ME (3 Points)</th>
                              <th className="py-2.5 px-3 border-r border-slate-200 bg-amber-50 text-amber-900">AE (2 Points)</th>
                              <th className="py-2.5 px-3 bg-rose-50 text-rose-900">BE (1 Point)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {m.rubricCriteria.map((c) => (
                              <tr key={c.id}>
                                <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-100">
                                  {c.criterionTitle}
                                </td>
                                <td className="py-2.5 px-3 text-emerald-950 bg-emerald-50/40 border-r border-slate-100 leading-relaxed text-[11px]">
                                  {c.eeDescriptor}
                                </td>
                                <td className="py-2.5 px-3 text-blue-950 bg-blue-50/40 border-r border-slate-100 leading-relaxed text-[11px]">
                                  {c.meDescriptor}
                                </td>
                                <td className="py-2.5 px-3 text-amber-950 bg-amber-50/40 border-r border-slate-100 leading-relaxed text-[11px]">
                                  {c.aeDescriptor}
                                </td>
                                <td className="py-2.5 px-3 text-rose-950 bg-rose-50/40 leading-relaxed text-[11px]">
                                  {c.beDescriptor}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Coordinator Audit Log & Comments Thread */}
                    <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-indigo-700" />
                          <span className="font-black text-indigo-950 uppercase tracking-wide">Coordinator Remarks & Alignment Notes</span>
                        </div>
                        {m.lastVerifiedBy && (
                          <div className="text-[10px] text-indigo-600 font-mono">
                            Verified by {m.lastVerifiedBy} on {new Date(m.lastVerifiedAt || '').toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="font-bold text-slate-700">Official Directive:</span>{' '}
                        <span className="text-slate-800 italic font-medium">"{m.coordinatorNotes || 'No notes specified.'}"</span>
                      </div>

                      {/* Comments Thread */}
                      {m.comments && m.comments.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-indigo-100">
                          <div className="text-[11px] font-bold text-indigo-900 uppercase">Qualitative Pedagogical Comments ({m.comments.length})</div>
                          <div className="space-y-1.5">
                            {m.comments.map(c => (
                              <div key={c.id} className="bg-white p-2.5 rounded-xl border border-indigo-100 flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-800 text-[11px]">{c.author}</span>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">{c.authorRole}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-slate-700 text-xs font-medium">{c.comment}</p>
                                </div>
                                <button
                                  onClick={() => handleRemoveCommentFromMapping(m.id, c.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                                  title="Remove comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Add Comment Box */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => { setActiveCommentMapping(m); setIsCommentModalOpen(true); }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Coordinator Comment</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          MODAL: LINK NEW CBA TASK MAPPING
          ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <span>Map New CBA Assessment Task</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Link a specific class-level assessment task to KICD CBC syllabus objectives.
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMapping} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade Level</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stream Allocation</label>
                  <select
                    value={formStream}
                    onChange={(e) => setFormStream(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="all">All Streams</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value as SubjectName)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {allSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Strand</label>
                  <input
                    type="text"
                    placeholder="e.g. Numbers & Operations / Living Things"
                    value={formStrand}
                    onChange={(e) => setFormStrand(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sub-Strand</label>
                  <input
                    type="text"
                    placeholder="e.g. Fractions / Plant Nutrition"
                    value={formSubStrand}
                    onChange={(e) => setFormSubStrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Specific Learning Outcome (Curriculum Objective)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Learner can divide concrete continuous quantities into fractional parts and explain equivalent values..."
                  value={formObjectiveText}
                  onChange={(e) => setFormObjectiveText(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Core Competency Focus</label>
                  <select
                    value={formCoreCompetency}
                    onChange={(e) => setFormCoreCompetency(e.target.value as CBACoreCompetency)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Critical Thinking & Problem Solving">Critical Thinking & Problem Solving</option>
                    <option value="Digital Literacy">Digital Literacy</option>
                    <option value="Imagination & Creativity">Imagination & Creativity</option>
                    <option value="Communication & Collaboration">Communication & Collaboration</option>
                    <option value="Self-Efficacy">Self-Efficacy</option>
                    <option value="Learning to Learn">Learning to Learn</option>
                    <option value="Citizenship">Citizenship</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bloom / CBC Domain</label>
                  <select
                    value={formBloomDomain}
                    onChange={(e) => setFormBloomDomain(e.target.value as CBABloomDomain)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Remembering & Recalling">Remembering & Recalling</option>
                    <option value="Understanding & Explaining">Understanding & Explaining</option>
                    <option value="Applying & Calculating">Applying & Calculating</option>
                    <option value="Analyzing & Deconstructing">Analyzing & Deconstructing</option>
                    <option value="Evaluating & Justifying">Evaluating & Justifying</option>
                    <option value="Creating & Designing">Creating & Designing</option>
                    <option value="Psychomotor & Practical Execution">Psychomotor & Practical Execution</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Class Assessment Task Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Fraction Strip Construction & Equivalence Investigation"
                    value={formTaskTitle}
                    onChange={(e) => setFormTaskTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assessment Type</label>
                  <select
                    value={formAssessmentType}
                    onChange={(e) => setFormAssessmentType(e.target.value as CBAAssessmentType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Authentic Performance Task">Authentic Performance Task</option>
                    <option value="Practical Lab Experiment">Practical Lab Experiment</option>
                    <option value="Formative Classwork & Checklist">Formative Classwork & Checklist</option>
                    <option value="Digital Coding Project">Digital Coding Project</option>
                    <option value="Topical Diagnostic Quiz">Topical Diagnostic Quiz</option>
                    <option value="Oral Presentation & Rubric">Oral Presentation & Rubric</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Task Instructions / Practical Method</label>
                <textarea
                  rows={2}
                  placeholder="Outline learner activities, materials needed, and classroom execution steps..."
                  value={formTaskDesc}
                  onChange={(e) => setFormTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Rubric Criteria 1 */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Primary Rubric Criterion & Levels</div>
                <input
                  type="text"
                  placeholder="Criterion title (e.g. Geometric Accuracy)"
                  value={formRubricCrit1Title}
                  onChange={(e) => setFormRubricCrit1Title(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold"
                />
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <input
                    type="text"
                    placeholder="EE (Exceeding): Mastery descriptor"
                    value={formRubricCrit1EE}
                    onChange={(e) => setFormRubricCrit1EE(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-emerald-800"
                  />
                  <input
                    type="text"
                    placeholder="ME (Meeting): Standard attainment"
                    value={formRubricCrit1ME}
                    onChange={(e) => setFormRubricCrit1ME(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-blue-800"
                  />
                  <input
                    type="text"
                    placeholder="AE (Approaching): Partial guidance needed"
                    value={formRubricCrit1AE}
                    onChange={(e) => setFormRubricCrit1AE(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-amber-800"
                  />
                  <input
                    type="text"
                    placeholder="BE (Below): Remediated"
                    value={formRubricCrit1BE}
                    onChange={(e) => setFormRubricCrit1BE(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-rose-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save & Validate Alignment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SEND CURRICULUM ADVISORY TO TEACHER
          ======================================================== */}
      {isAdvisoryModalOpen && selectedMapping && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Send CBA Alignment Advisory Memo</h3>
                <p className="text-xs text-slate-500">ATTN: {selectedMapping.leadTeacherName} ({selectedMapping.subject})</p>
              </div>
              <button 
                onClick={() => setIsAdvisoryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendAdvisory} className="space-y-3 text-xs">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold text-[11px] uppercase tracking-wider">Target Objective & Task</div>
                <div>{selectedMapping.taskTitle} (Grade {selectedMapping.grade})</div>
                <div className="text-[11px] text-amber-800 italic">"{selectedMapping.curriculumObjective}"</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Advisory Directives / Remediation Notes</label>
                <textarea
                  rows={4}
                  placeholder="Specify changes required in assessment rubric, evidence collection, or pacing catch-up..."
                  value={advisoryNote}
                  onChange={(e) => setAdvisoryNote(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdvisoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Dispatch Advisory Memo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT EXISTING CBA TASK MAPPING
          ======================================================== */}
      {isEditModalOpen && editingMapping && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" />
                  <span>Edit CBA Assessment Task Mapping</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Update alignment details, rubrics, and competencies for this assessment task.
                </p>
              </div>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingMapping(null); }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedMapping} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade Level</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stream Allocation</label>
                  <select
                    value={formStream}
                    onChange={(e) => setFormStream(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="all">All Streams</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value as SubjectName)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {allSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Strand</label>
                  <input
                    type="text"
                    value={formStrand}
                    onChange={(e) => setFormStrand(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sub-Strand</label>
                  <input
                    type="text"
                    value={formSubStrand}
                    onChange={(e) => setFormSubStrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Specific Learning Outcome (Curriculum Objective)</label>
                <textarea
                  rows={2}
                  value={formObjectiveText}
                  onChange={(e) => setFormObjectiveText(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Core Competency Focus</label>
                  <select
                    value={formCoreCompetency}
                    onChange={(e) => setFormCoreCompetency(e.target.value as CBACoreCompetency)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Critical Thinking & Problem Solving">Critical Thinking & Problem Solving</option>
                    <option value="Digital Literacy">Digital Literacy</option>
                    <option value="Imagination & Creativity">Imagination & Creativity</option>
                    <option value="Communication & Collaboration">Communication & Collaboration</option>
                    <option value="Self-Efficacy">Self-Efficacy</option>
                    <option value="Learning to Learn">Learning to Learn</option>
                    <option value="Citizenship">Citizenship</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bloom / CBC Domain</label>
                  <select
                    value={formBloomDomain}
                    onChange={(e) => setFormBloomDomain(e.target.value as CBABloomDomain)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Remembering & Recalling">Remembering & Recalling</option>
                    <option value="Understanding & Explaining">Understanding & Explaining</option>
                    <option value="Applying & Calculating">Applying & Calculating</option>
                    <option value="Analyzing & Deconstructing">Analyzing & Deconstructing</option>
                    <option value="Evaluating & Justifying">Evaluating & Justifying</option>
                    <option value="Creating & Designing">Creating & Designing</option>
                    <option value="Psychomotor & Practical Execution">Psychomotor & Practical Execution</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Class Assessment Task Title</label>
                  <input
                    type="text"
                    value={formTaskTitle}
                    onChange={(e) => setFormTaskTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assessment Type</label>
                  <select
                    value={formAssessmentType}
                    onChange={(e) => setFormAssessmentType(e.target.value as CBAAssessmentType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Authentic Performance Task">Authentic Performance Task</option>
                    <option value="Practical Lab Experiment">Practical Lab Experiment</option>
                    <option value="Formative Classwork & Checklist">Formative Classwork & Checklist</option>
                    <option value="Digital Coding Project">Digital Coding Project</option>
                    <option value="Topical Diagnostic Quiz">Topical Diagnostic Quiz</option>
                    <option value="Oral Presentation & Rubric">Oral Presentation & Rubric</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Task Instructions / Practical Method</label>
                <textarea
                  rows={2}
                  value={formTaskDesc}
                  onChange={(e) => setFormTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Rubric Criteria 1 */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Primary Rubric Criterion & Levels</div>
                <input
                  type="text"
                  placeholder="Criterion title"
                  value={formRubricCrit1Title}
                  onChange={(e) => setFormRubricCrit1Title(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold"
                />
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <input
                    type="text"
                    placeholder="EE (Exceeding): Mastery descriptor"
                    value={formRubricCrit1EE}
                    onChange={(e) => setFormRubricCrit1EE(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-emerald-800"
                  />
                  <input
                    type="text"
                    placeholder="ME (Meeting): Standard attainment"
                    value={formRubricCrit1ME}
                    onChange={(e) => setFormRubricCrit1ME(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-blue-800"
                  />
                  <input
                    type="text"
                    placeholder="AE (Approaching): Partial guidance needed"
                    value={formRubricCrit1AE}
                    onChange={(e) => setFormRubricCrit1AE(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-amber-800"
                  />
                  <input
                    type="text"
                    placeholder="BE (Below): Remediated"
                    value={formRubricCrit1BE}
                    onChange={(e) => setFormRubricCrit1BE(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-rose-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingMapping(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD COORDINATOR COMMENT TO CBA TASK MAPPING
          ======================================================== */}
      {isCommentModalOpen && activeCommentMapping && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <span>Add Coordinator Comment</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {activeCommentMapping.taskTitle} (Grade {activeCommentMapping.grade} · {activeCommentMapping.subject})
                </p>
              </div>
              <button 
                onClick={() => { setIsCommentModalOpen(false); setActiveCommentMapping(null); setMappingCommentText(''); }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-700">Specific Learning Outcome:</div>
                <div className="text-slate-600 italic">"{activeCommentMapping.curriculumObjective}"</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pedagogical Review Comment / Guidance *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed feedback on task alignment, evidence collection, or formative rubric calibration..."
                  value={mappingCommentText}
                  onChange={(e) => setMappingCommentText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsCommentModalOpen(false); setActiveCommentMapping(null); setMappingCommentText(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAddCommentToMapping(activeCommentMapping.id, mappingCommentText)}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
