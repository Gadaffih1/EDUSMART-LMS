import React, { useState, useEffect } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName,
  SubjectName, 
  PRIMARY_SUBJECTS, 
  JUNIOR_SUBJECTS, 
  AssessmentCycle,
  Announcement,
  CoordinatorSchemeOfWork,
  CoordinatorSyllabusTopic,
  CoordinatorCBAModeration
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { DocumentRequestsHub } from '../admin/DocumentRequestsHub';
import { CMSPostsSectionsHub } from '../admin/CMSPostsSectionsHub';
import { ComputerLabModule } from '../teacher/ComputerLabModule';
import { CBATaskMappingModule } from './CBATaskMappingModule';
import { StaffAppraisalModule } from '../supervision/StaffAppraisalModule';
import { CurriculumReportWriterModule } from './CurriculumReportWriterModule';
import { 
  Compass, 
  BookOpen, 
  CheckCircle2, 
  BarChart3, 
  Layers, 
  Laptop, 
  FileText, 
  AlertCircle, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Award, 
  Sparkles, 
  ChevronRight, 
  ExternalLink, 
  Printer, 
  Share2, 
  Send, 
  ShieldCheck, 
  Users, 
  Sliders, 
  RefreshCw, 
  FileSpreadsheet, 
  FlaskConical, 
  Bell, 
  Check, 
  X,
  Target,
  Edit3,
  Trash2,
  MessageSquare,
  Plus,
  CheckSquare
} from 'lucide-react';

interface CurriculumCoordinatorWorkspaceProps {
  currentUser: User;
  onLogout?: () => void;
}

export const CurriculumCoordinatorWorkspace: React.FC<CurriculumCoordinatorWorkspaceProps> = ({ 
  currentUser,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<
    'pacing' | 'schemes' | 'cba_mapping' | 'cba_moderation' | 'appraisal' | 'computer_lab' | 'doc_requests' | 'directives' | 'reports_suite'
  >('pacing');

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(2);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Storage Data State
  const [syllabusTracking, setSyllabusTracking] = useState<CoordinatorSyllabusTopic[]>(() => Storage.getCoordinatorSyllabusTracking());
  const [schemesOfWork, setSchemesOfWork] = useState<CoordinatorSchemeOfWork[]>(() => Storage.getCoordinatorSchemesOfWork());
  const [cbaModerations, setCbaModerations] = useState<CoordinatorCBAModeration[]>(() => Storage.getCoordinatorCBAModerations());

  // Advisory Memo Modal State
  const [advisoryModalTopic, setAdvisoryModalTopic] = useState<CoordinatorSyllabusTopic | null>(null);
  const [advisoryMemoText, setAdvisoryMemoText] = useState('');

  // -----------------------------------------------------------------
  // TOPIC (SYLLABUS PACING) MODAL STATE
  // -----------------------------------------------------------------
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CoordinatorSyllabusTopic | null>(null);
  const [topicFormGrade, setTopicFormGrade] = useState<GradeLevel>(4);
  const [topicFormSubject, setTopicFormSubject] = useState<SubjectName>('Mathematics');
  const [topicFormStrand, setTopicFormStrand] = useState('');
  const [topicFormSubStrand, setTopicFormSubStrand] = useState('');
  const [topicFormExpectedWeek, setTopicFormExpectedWeek] = useState<number>(7);
  const [topicFormCompletedWeek, setTopicFormCompletedWeek] = useState<number>(7);
  const [topicFormStatus, setTopicFormStatus] = useState<'on_schedule' | 'ahead' | 'lagging'>('on_schedule');
  const [topicFormTeacher, setTopicFormTeacher] = useState('');
  const [topicFormCompetency, setTopicFormCompetency] = useState('');
  const [topicFormRemarks, setTopicFormRemarks] = useState('');

  // -----------------------------------------------------------------
  // SCHEMES OF WORK MODAL STATE
  // -----------------------------------------------------------------
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<CoordinatorSchemeOfWork | null>(null);
  const [schemeFormTeacher, setSchemeFormTeacher] = useState('');
  const [schemeFormGrade, setSchemeFormGrade] = useState<GradeLevel>(4);
  const [schemeFormSubject, setSchemeFormSubject] = useState<SubjectName>('Mathematics');
  const [schemeFormTerm, setSchemeFormTerm] = useState<1 | 2 | 3>(2);
  const [schemeFormStatus, setSchemeFormStatus] = useState<CoordinatorSchemeOfWork['status']>('approved');
  const [schemeFormFeedback, setSchemeFormFeedback] = useState('');

  // -----------------------------------------------------------------
  // CBA MODERATION MODAL STATE
  // -----------------------------------------------------------------
  const [isModModalOpen, setIsModModalOpen] = useState(false);
  const [editingMod, setEditingMod] = useState<CoordinatorCBAModeration | null>(null);
  const [modFormGrade, setModFormGrade] = useState<GradeLevel>(4);
  const [modFormStream, setModFormStream] = useState<StreamName | 'all'>('all');
  const [modFormSubject, setModFormSubject] = useState<SubjectName>('Mathematics');
  const [modFormAssessmentTitle, setModFormAssessmentTitle] = useState('');
  const [modFormConsensusLevel, setModFormConsensusLevel] = useState<'EE' | 'ME' | 'AE' | 'BE'>('ME');
  const [modFormSampleSize, setModFormSampleSize] = useState<number>(40);
  const [modFormEE, setModFormEE] = useState<number>(12);
  const [modFormME, setModFormME] = useState<number>(20);
  const [modFormAE, setModFormAE] = useState<number>(6);
  const [modFormBE, setModFormBE] = useState<number>(2);
  const [modFormVarianceNotes, setModFormVarianceNotes] = useState('');
  const [modFormConsensusStatus, setModFormConsensusStatus] = useState<CoordinatorCBAModeration['consensusStatus']>('verified');

  // -----------------------------------------------------------------
  // GENERIC COMMENT MODAL STATE (For Topic, Scheme, or Moderation)
  // -----------------------------------------------------------------
  const [commentTarget, setCommentTarget] = useState<{
    type: 'topic' | 'scheme' | 'moderation';
    id: string;
    title: string;
  } | null>(null);
  const [genericCommentText, setGenericCommentText] = useState('');

  // Sync with Storage custom events
  useEffect(() => {
    const handleSyllabus = () => setSyllabusTracking(Storage.getCoordinatorSyllabusTracking());
    const handleSchemes = () => setSchemesOfWork(Storage.getCoordinatorSchemesOfWork());
    const handleMods = () => setCbaModerations(Storage.getCoordinatorCBAModerations());

    window.addEventListener('coordinator-syllabus-updated', handleSyllabus);
    window.addEventListener('coordinator-schemes-updated', handleSchemes);
    window.addEventListener('coordinator-moderations-updated', handleMods);

    return () => {
      window.removeEventListener('coordinator-syllabus-updated', handleSyllabus);
      window.removeEventListener('coordinator-schemes-updated', handleSchemes);
      window.removeEventListener('coordinator-moderations-updated', handleMods);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const allSubjects = Array.from(new Set([...PRIMARY_SUBJECTS, ...JUNIOR_SUBJECTS]));

  // =================================================================
  // SYLLABUS TOPIC HANDLERS (ADD, EDIT, REMOVE, COMMENT)
  // =================================================================
  const handleOpenAddTopic = () => {
    setEditingTopic(null);
    setTopicFormGrade(4);
    setTopicFormSubject('Mathematics');
    setTopicFormStrand('');
    setTopicFormSubStrand('');
    setTopicFormExpectedWeek(7);
    setTopicFormCompletedWeek(7);
    setTopicFormStatus('on_schedule');
    setTopicFormTeacher(currentUser.name);
    setTopicFormCompetency('');
    setTopicFormRemarks('');
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (t: CoordinatorSyllabusTopic) => {
    setEditingTopic(t);
    setTopicFormGrade(t.grade);
    setTopicFormSubject(t.subject as SubjectName);
    setTopicFormStrand(t.strand);
    setTopicFormSubStrand(t.subStrand);
    setTopicFormExpectedWeek(t.expectedWeek);
    setTopicFormCompletedWeek(t.completedWeek);
    setTopicFormStatus(t.status);
    setTopicFormTeacher(t.leadTeacher);
    setTopicFormCompetency(t.competencyTarget);
    setTopicFormRemarks(t.coordinatorRemarks || '');
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicFormStrand.trim()) {
      showToast('Please enter a syllabus strand name.', 'error');
      return;
    }

    if (editingTopic) {
      Storage.updateCoordinatorSyllabusTopic(editingTopic.id, {
        grade: topicFormGrade,
        subject: topicFormSubject,
        strand: topicFormStrand.trim(),
        subStrand: topicFormSubStrand.trim() || topicFormStrand.trim(),
        expectedWeek: topicFormExpectedWeek,
        completedWeek: topicFormCompletedWeek,
        status: topicFormStatus,
        leadTeacher: topicFormTeacher.trim() || editingTopic.leadTeacher,
        competencyTarget: topicFormCompetency.trim() || editingTopic.competencyTarget,
        coordinatorRemarks: topicFormRemarks.trim() || editingTopic.coordinatorRemarks
      });
      showToast(`Syllabus strand "${topicFormStrand}" successfully updated!`, 'success');
    } else {
      const newTopic: CoordinatorSyllabusTopic = {
        id: `syl-${Date.now()}`,
        grade: topicFormGrade,
        subject: topicFormSubject,
        strand: topicFormStrand.trim(),
        subStrand: topicFormSubStrand.trim() || topicFormStrand.trim(),
        expectedWeek: topicFormExpectedWeek,
        completedWeek: topicFormCompletedWeek,
        status: topicFormStatus,
        leadTeacher: topicFormTeacher.trim() || currentUser.name,
        competencyTarget: topicFormCompetency.trim() || 'Core competency mastery as per KICD designs',
        coordinatorRemarks: topicFormRemarks.trim() || 'Monitored by Curriculum Directorate.',
        comments: []
      };
      Storage.addCoordinatorSyllabusTopic(newTopic);
      showToast(`New syllabus strand "${topicFormStrand}" registered!`, 'success');
    }

    setIsTopicModalOpen(false);
    setEditingTopic(null);
  };

  const handleDeleteTopic = (id: string, strand: string) => {
    if (window.confirm(`Are you sure you want to remove the syllabus topic "${strand}"?`)) {
      Storage.deleteCoordinatorSyllabusTopic(id);
      showToast(`Syllabus topic "${strand}" removed.`, 'info');
    }
  };

  const handleRemoveTopicComment = (topicId: string, commentId: string) => {
    if (window.confirm('Remove this comment from the syllabus topic?')) {
      Storage.removeCommentFromCoordinatorSyllabusTopic(topicId, commentId);
      showToast('Comment removed from topic.', 'info');
    }
  };

  // =================================================================
  // SCHEMES OF WORK HANDLERS (ADD, EDIT, REMOVE, STATUS TOGGLE)
  // =================================================================
  const handleOpenAddScheme = () => {
    setEditingScheme(null);
    setSchemeFormTeacher('');
    setSchemeFormGrade(4);
    setSchemeFormSubject('Mathematics');
    setSchemeFormTerm(2);
    setSchemeFormStatus('approved');
    setSchemeFormFeedback('Meets CBC inquiry questions and continuous learner rubric benchmarks.');
    setIsSchemeModalOpen(true);
  };

  const handleOpenEditScheme = (sch: CoordinatorSchemeOfWork) => {
    setEditingScheme(sch);
    setSchemeFormTeacher(sch.teacher);
    setSchemeFormGrade(sch.grade);
    setSchemeFormSubject(sch.subject as SubjectName);
    setSchemeFormTerm(sch.term);
    setSchemeFormStatus(sch.status);
    setSchemeFormFeedback(sch.feedback);
    setIsSchemeModalOpen(true);
  };

  const handleSaveScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeFormTeacher.trim()) {
      showToast('Please specify the instructor name.', 'error');
      return;
    }

    if (editingScheme) {
      Storage.updateCoordinatorSchemeOfWork(editingScheme.id, {
        teacher: schemeFormTeacher.trim(),
        grade: schemeFormGrade,
        subject: schemeFormSubject,
        term: schemeFormTerm,
        status: schemeFormStatus,
        feedback: schemeFormFeedback.trim(),
        reviewedBy: `${currentUser.name} (Curriculum Coordinator)`
      });
      showToast(`Scheme of work for ${schemeFormTeacher} updated!`, 'success');
    } else {
      const newSch: CoordinatorSchemeOfWork = {
        id: `sch-${Date.now()}`,
        teacher: schemeFormTeacher.trim(),
        grade: schemeFormGrade,
        subject: schemeFormSubject,
        term: schemeFormTerm,
        academicYear: 2026,
        submittedDate: new Date().toISOString().split('T')[0],
        status: schemeFormStatus,
        feedback: schemeFormFeedback.trim() || 'Verified and aligned with CBC syllabus.',
        reviewedBy: `${currentUser.name} (Curriculum Coordinator)`,
        comments: [],
        createdAt: new Date().toISOString()
      };
      Storage.addCoordinatorSchemeOfWork(newSch);
      showToast(`New Scheme of Work for ${schemeFormTeacher} recorded!`, 'success');
    }

    setIsSchemeModalOpen(false);
    setEditingScheme(null);
  };

  const handleDeleteScheme = (id: string, teacher: string, subject: string) => {
    if (window.confirm(`Are you sure you want to remove the scheme of work for ${teacher} (${subject})?`)) {
      Storage.deleteCoordinatorSchemeOfWork(id);
      showToast(`Scheme of work for ${teacher} removed.`, 'info');
    }
  };

  const handleToggleSchemeStatus = (sch: CoordinatorSchemeOfWork) => {
    const nextStatus: CoordinatorSchemeOfWork['status'] = sch.status === 'approved' ? 'pending_revision' : 'approved';
    Storage.updateCoordinatorSchemeOfWork(sch.id, {
      status: nextStatus,
      reviewedBy: `${currentUser.name} (Curriculum Coordinator)`
    });
    showToast(`Scheme status updated to ${nextStatus === 'approved' ? 'Verified & Approved' : 'Revision Required'}.`, 'success');
  };

  const handleRemoveSchemeComment = (schemeId: string, commentId: string) => {
    if (window.confirm('Remove this review comment?')) {
      Storage.removeCommentFromCoordinatorScheme(schemeId, commentId);
      showToast('Review comment removed.', 'info');
    }
  };

  // =================================================================
  // CBA MODERATION HANDLERS (ADD, EDIT, REMOVE)
  // =================================================================
  const handleOpenAddModeration = () => {
    setEditingMod(null);
    setModFormGrade(4);
    setModFormStream('all');
    setModFormSubject('Mathematics');
    setModFormAssessmentTitle('');
    setModFormConsensusLevel('ME');
    setModFormSampleSize(40);
    setModFormEE(12);
    setModFormME(20);
    setModFormAE(6);
    setModFormBE(2);
    setModFormVarianceNotes('Inter-stream scoring variance within acceptable 5% tolerance margin.');
    setModFormConsensusStatus('verified');
    setIsModModalOpen(true);
  };

  const handleOpenEditModeration = (mod: CoordinatorCBAModeration) => {
    setEditingMod(mod);
    setModFormGrade(mod.grade);
    setModFormStream(mod.stream as any);
    setModFormSubject(mod.subject as SubjectName);
    setModFormAssessmentTitle(mod.assessmentTitle);
    setModFormConsensusLevel(mod.consensusLevel);
    setModFormSampleSize(mod.sampleSize);
    setModFormEE(mod.eeCount);
    setModFormME(mod.meCount);
    setModFormAE(mod.aeCount);
    setModFormBE(mod.beCount);
    setModFormVarianceNotes(mod.varianceNotes);
    setModFormConsensusStatus(mod.consensusStatus);
    setIsModModalOpen(true);
  };

  const handleSaveModeration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modFormAssessmentTitle.trim()) {
      showToast('Please enter assessment title.', 'error');
      return;
    }

    if (editingMod) {
      Storage.updateCoordinatorCBAModeration(editingMod.id, {
        grade: modFormGrade,
        stream: modFormStream,
        subject: modFormSubject,
        assessmentTitle: modFormAssessmentTitle.trim(),
        consensusLevel: modFormConsensusLevel,
        sampleSize: modFormSampleSize,
        eeCount: modFormEE,
        meCount: modFormME,
        aeCount: modFormAE,
        beCount: modFormBE,
        varianceNotes: modFormVarianceNotes.trim(),
        consensusStatus: modFormConsensusStatus
      });
      showToast(`CBA Moderation for "${modFormAssessmentTitle}" updated!`, 'success');
    } else {
      const newMod: CoordinatorCBAModeration = {
        id: `mod-${Date.now()}`,
        grade: modFormGrade,
        stream: modFormStream,
        subject: modFormSubject,
        assessmentTitle: modFormAssessmentTitle.trim(),
        moderator: `${currentUser.name} (Curriculum Coordinator)`,
        moderatedDate: new Date().toISOString().split('T')[0],
        consensusLevel: modFormConsensusLevel,
        sampleSize: modFormSampleSize,
        eeCount: modFormEE,
        meCount: modFormME,
        aeCount: modFormAE,
        beCount: modFormBE,
        varianceNotes: modFormVarianceNotes.trim() || 'Rubric standards verified across streams.',
        consensusStatus: modFormConsensusStatus,
        comments: [],
        createdAt: new Date().toISOString()
      };
      Storage.addCoordinatorCBAModeration(newMod);
      showToast(`CBA Moderation for "${modFormAssessmentTitle}" registered!`, 'success');
    }

    setIsModModalOpen(false);
    setEditingMod(null);
  };

  const handleDeleteModeration = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove the moderation record "${title}"?`)) {
      Storage.deleteCoordinatorCBAModeration(id);
      showToast(`Moderation record "${title}" removed.`, 'info');
    }
  };

  const handleRemoveModComment = (modId: string, commentId: string) => {
    if (window.confirm('Remove this moderation remark?')) {
      Storage.removeCommentFromCoordinatorCBAModeration(modId, commentId);
      showToast('Remark removed.', 'info');
    }
  };

  // =================================================================
  // GENERIC COMMENT POSTING (TOPIC, SCHEME, MODERATION)
  // =================================================================
  const handlePostGenericComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentTarget || !genericCommentText.trim()) return;

    if (commentTarget.type === 'topic') {
      Storage.addCommentToCoordinatorSyllabusTopic(commentTarget.id, {
        author: currentUser.name,
        authorRole: 'Curriculum Coordinator',
        comment: genericCommentText.trim()
      });
      showToast('Comment added to syllabus topic!', 'success');
    } else if (commentTarget.type === 'scheme') {
      Storage.addCommentToCoordinatorScheme(commentTarget.id, {
        author: currentUser.name,
        authorRole: 'Curriculum Coordinator',
        comment: genericCommentText.trim()
      });
      showToast('Review comment added to scheme of work!', 'success');
    } else if (commentTarget.type === 'moderation') {
      Storage.addCommentToCoordinatorCBAModeration(commentTarget.id, {
        author: currentUser.name,
        authorRole: 'Curriculum Coordinator',
        comment: genericCommentText.trim()
      });
      showToast('Moderator comment recorded!', 'success');
    }

    setCommentTarget(null);
    setGenericCommentText('');
  };

  // =================================================================
  // SEND PACING ADVISORY DIRECTIVE
  // =================================================================
  const handleSendPacingAdvisory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisoryModalTopic || !advisoryMemoText.trim()) return;

    const newDirective: Announcement = {
      id: `ann-coord-${Date.now()}`,
      title: `Curriculum Coordination Advisory: ${advisoryModalTopic.subject} Grade ${advisoryModalTopic.grade}`,
      content: `ATTN: ${advisoryModalTopic.leadTeacher}\n\n${advisoryMemoText.trim()}\n\nStrand Focus: ${advisoryModalTopic.strand} -> ${advisoryModalTopic.subStrand}. Pacing adjustment expected by Friday.`,
      type: 'urgent',
      targetGrade: advisoryModalTopic.grade,
      author: currentUser.name,
      authorRole: 'Curriculum Coordinator',
      createdAt: new Date().toISOString(),
      categories: ['academic-directives']
    };

    Storage.addAnnouncement(newDirective);
    showToast(`Pacing Advisory dispatched to ${advisoryModalTopic.leadTeacher}! Broadcast notice created.`, 'success');
    setAdvisoryModalTopic(null);
    setAdvisoryMemoText('');
  };

  // Filter syllabus tracking
  const filteredSyllabus = syllabusTracking.filter(item => {
    const matchesGrade = selectedGrade === 'all' || item.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'all' || item.subject === selectedSubject;
    return matchesGrade && matchesSubject;
  });

  // Filter schemes of work
  const filteredSchemes = schemesOfWork.filter(item => {
    const matchesGrade = selectedGrade === 'all' || item.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'all' || item.subject === selectedSubject;
    return matchesGrade && matchesSubject;
  });

  // Calculate metrics
  const totalTopics = syllabusTracking.length;
  const onScheduleCount = syllabusTracking.filter(t => t.status === 'on_schedule' || t.status === 'ahead').length;
  const laggingCount = syllabusTracking.filter(t => t.status === 'lagging').length;
  const approvedSchemes = schemesOfWork.filter(s => s.status === 'approved').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-700' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-700' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP EXECUTIVE LEADERSHIP HEADER & MODULE TABS (UNIFIED TO PREVENT OVERLAPPING) */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
          
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Compass className="w-6 h-6 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.2 rounded-md">
                  Executive Leadership · CBC Directorate
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Term {selectedTerm} (Academic Year 2026)
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Curriculum Coordinator Workspace
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
            {/* Quick Summary Pill */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{approvedSchemes} Verified Schemes</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700">{onScheduleCount} Strands On-Track</span>
              {laggingCount > 0 && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-amber-700">{laggingCount} Lagging</span>
                </>
              )}
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>

        </div>

        {/* HORIZONTAL WORKSPACE MODULE TABS */}
        <div className="overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 py-2">
          
          <button
            onClick={() => setActiveTab('pacing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pacing' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>1. Syllabus Pacing Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'schemes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Schemes of Work Verification Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('cba_mapping')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cba_mapping' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>3. CBA Task Mapping & Objectives</span>
          </button>

          <button
            onClick={() => setActiveTab('cba_moderation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cba_moderation' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>4. CBA Rubrics & Formative Moderation</span>
          </button>

          <button
            onClick={() => setActiveTab('appraisal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'appraisal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>5. Teacher Appraisal (TSC TPAD)</span>
          </button>

          <button
            onClick={() => setActiveTab('computer_lab')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'computer_lab' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>6. Computer Lab & Scratch Coding</span>
          </button>

          <button
            onClick={() => setActiveTab('doc_requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'doc_requests' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>7. Request Teacher/Student Documents</span>
          </button>

          <button
            onClick={() => setActiveTab('directives')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'directives' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>8. Curriculum Directives & Post CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('reports_suite')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reports_suite' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>9. Write & Manage Reports (BOM, Quality Audits & Cards)</span>
          </button>
          </div>
        </div>
      </div>

      {/* MAIN TAB CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* ========================================================
            TAB 1: SYLLABUS PACING RADAR
            ======================================================== */}
        {activeTab === 'pacing' && (
          <div className="space-y-5">
            
            {/* Header & Filter Bar */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>KICD Syllabus Pacing & Topical Progression Radar</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitor instructional pacing across grades, edit syllabus tracking parameters, remove strands, or attach coordinator pedagogical comments.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleOpenAddTopic}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Monitored Strand</span>
                </button>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 uppercase text-[10px] ml-1">Grade:</span>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : Number(e.target.value) as GradeLevel)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                  >
                    <option value="all">All Grades</option>
                    {[1,2,3,4,5,6,7,8,9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>

                  <span className="font-bold text-slate-500 uppercase text-[10px] ml-1">Subject:</span>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                  >
                    <option value="all">All Subjects</option>
                    {allSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pacing Radar Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSyllabus.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3.5 flex flex-col justify-between hover:border-indigo-300 transition-all">
                  
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                        Grade {item.grade} · {item.subject}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        item.status === 'on_schedule' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        item.status === 'ahead' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {item.status === 'on_schedule' ? '✓ On Schedule' : item.status === 'ahead' ? '⚡ Ahead of Target' : '⚠️ Lagging Pacing'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-slate-900">{item.strand}</h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">{item.subStrand}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-bold text-slate-700 flex items-center justify-between">
                        <span>Lead Instructor:</span>
                        <span className="text-slate-900 font-semibold">{item.leadTeacher}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 italic">
                        Competency: "{item.competencyTarget}"
                      </div>
                      {item.coordinatorRemarks && (
                        <div className="text-[11px] text-indigo-800 bg-indigo-50/60 p-1.5 rounded-lg border border-indigo-100 font-medium mt-1">
                          <strong>Note:</strong> {item.coordinatorRemarks}
                        </div>
                      )}
                    </div>

                    {/* Comments Thread Display */}
                    {item.comments && item.comments.length > 0 && (
                      <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5 text-[11px]">
                        <div className="font-bold text-blue-900 flex items-center justify-between">
                          <span>Pedagogical Comments ({item.comments.length}):</span>
                        </div>
                        {item.comments.map(c => (
                          <div key={c.id} className="bg-white p-1.5 rounded-lg border border-blue-100 flex items-start justify-between gap-1 text-[11px]">
                            <div>
                              <span className="font-bold text-slate-800">{c.author}:</span>{' '}
                              <span className="text-slate-600">{c.comment}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveTopicComment(item.id, c.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Remove comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Progress Strip & Action Toolbar */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">Week {item.completedWeek} of {item.expectedWeek} Target</span>
                      <span className="font-bold text-slate-800">
                        {Math.round((item.completedWeek / Math.max(1, item.expectedWeek)) * 100)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.status === 'lagging' ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, (item.completedWeek / Math.max(1, item.expectedWeek)) * 100)}%` }}
                      />
                    </div>

                    {/* Action Buttons: Edit, Comment, Remove, Advisory */}
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditTopic(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Edit Topic Parameters"
                        >
                          <Edit3 className="w-3 h-3 text-indigo-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setCommentTarget({ type: 'topic', id: item.id, title: `${item.subject} - ${item.strand}` })}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Add Review Comment"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Comment</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.status === 'lagging' && (
                          <button
                            onClick={() => {
                              setAdvisoryModalTopic(item);
                              setAdvisoryMemoText(`Please schedule a catch-up remedial lesson for ${item.subStrand}. Strand is currently 1 week behind the approved KICD syllabus pacing.`);
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Dispatch Advisory Memo"
                          >
                            <Send className="w-3 h-3 text-amber-700" />
                            <span>Memo</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteTopic(item.id, item.strand)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Monitored Strand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: SCHEMES OF WORK VERIFICATION DESK
            ======================================================== */}
        {activeTab === 'schemes' && (
          <div className="space-y-4">
            
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Teacher Schemes of Work & Lesson Plan Verification Desk</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify, edit, approve, remove schemes of work, or append coordinator review remarks across all primary and junior secondary streams.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleOpenAddScheme}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Scheme</span>
                </button>

                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  {approvedSchemes} of {schemesOfWork.length} Verified
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-3 px-4">Subject Faculty</th>
                      <th className="py-3 px-3">Grade & Subject</th>
                      <th className="py-3 px-3">Term & Date</th>
                      <th className="py-3 px-3">Coordinator Review Remarks & Comments</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSchemes.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{sch.teacher}</div>
                          <div className="text-[10px] text-slate-400 font-mono">TSC Verified Faculty</div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800">Grade {sch.grade}</span>
                          <span className="text-slate-500 ml-1">· {sch.subject}</span>
                        </td>

                        <td className="py-3 px-3 text-slate-600 font-mono">
                          <div>Term {sch.term}</div>
                          <div className="text-[10px] text-slate-400">{sch.submittedDate}</div>
                        </td>

                        <td className="py-3 px-3 max-w-sm">
                          <div className="text-slate-700 italic">"{sch.feedback}"</div>
                          {sch.comments && sch.comments.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {sch.comments.map(c => (
                                <div key={c.id} className="text-[11px] bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-100 flex items-center justify-between">
                                  <span><strong>{c.author}:</strong> {c.comment}</span>
                                  <button
                                    onClick={() => handleRemoveSchemeComment(sch.id, c.id)}
                                    className="text-slate-400 hover:text-rose-600 ml-1"
                                    title="Remove comment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleSchemeStatus(sch)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border cursor-pointer transition-all ${
                              sch.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 
                              sch.status === 'remediation_planned' ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100' :
                              'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            }`}
                            title="Click to toggle approval status"
                          >
                            {sch.status === 'approved' ? '✅ Approved' : sch.status === 'remediation_planned' ? '🛠 Remediation' : '🔄 Revision Required'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditScheme(sch)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors"
                              title="Edit Scheme Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setCommentTarget({ type: 'scheme', id: sch.id, title: `Scheme for ${sch.teacher} (${sch.subject})` })}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
                              title="Add Review Comment"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteScheme(sch.id, sch.teacher, sch.subject)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove Scheme"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 3: CBA TASK MAPPING (CBC OBJECTIVES TO CLASS ASSESSMENTS)
            ======================================================== */}
        {activeTab === 'cba_mapping' && (
          <CBATaskMappingModule currentUser={currentUser} />
        )}

        {/* ========================================================
            TAB 4: CBA ASSESSMENT MODERATION
            ======================================================== */}
        {activeTab === 'cba_moderation' && (
          <div className="space-y-5">
            
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Competency-Based Assessment (CBA) Rubrics & Formative Moderation</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Institutional moderation of attainment tiers (EE, ME, AE, BE) to harmonize grading across all primary streams and junior school streams. Edit consensus scores, remove entries, or attach coordinator moderation feedback.
                </p>
              </div>

              <button
                onClick={handleOpenAddModeration}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Record Moderation Sample</span>
              </button>
            </div>

            {/* Attainment Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 text-emerald-950 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">EE: Exceeding Expectations</div>
                <div className="text-2xl font-black">28.4%</div>
                <div className="text-[10px] text-emerald-800">Learners showing mastery & self-direction</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 text-blue-950 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">ME: Meeting Expectations</div>
                <div className="text-2xl font-black">56.2%</div>
                <div className="text-[10px] text-blue-800">Core cohort meeting KICD attainment criteria</div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 text-amber-950 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">AE: Approaching Expectations</div>
                <div className="text-2xl font-black">12.1%</div>
                <div className="text-[10px] text-amber-800">Requires targeted scaffolding & practice</div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 text-rose-950 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">BE: Below Expectations</div>
                <div className="text-2xl font-black">3.3%</div>
                <div className="text-[10px] text-rose-800">Remedial learning plans initiated</div>
              </div>
            </div>

            {/* Moderated Assessment Records Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Moderated Assessment Streams & Attainment Samples ({cbaModerations.length})
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-3 px-4">Assessment Task</th>
                      <th className="py-3 px-3">Grade & Stream</th>
                      <th className="py-3 px-3">Subject</th>
                      <th className="py-3 px-3 text-center">Consensus Level</th>
                      <th className="py-3 px-3">Distribution (EE/ME/AE/BE)</th>
                      <th className="py-3 px-3">Variance Audit Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cbaModerations.map((mod) => (
                      <tr key={mod.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{mod.assessmentTitle}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Moderated by {mod.moderator}</div>
                        </td>

                        <td className="py-3 px-3 font-medium text-slate-800">
                          Grade {mod.grade} {mod.stream !== 'all' && `(${mod.stream})`}
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {mod.subject}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                            mod.consensusLevel === 'EE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            mod.consensusLevel === 'ME' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            mod.consensusLevel === 'AE' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {mod.consensusLevel}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span className="text-emerald-700 font-bold">{mod.eeCount} EE</span> ·{' '}
                          <span className="text-blue-700 font-bold">{mod.meCount} ME</span> ·{' '}
                          <span className="text-amber-700 font-bold">{mod.aeCount} AE</span> ·{' '}
                          <span className="text-rose-700 font-bold">{mod.beCount} BE</span>{' '}
                          <span className="text-slate-400">({mod.sampleSize} total)</span>
                        </td>

                        <td className="py-3 px-3 max-w-xs">
                          <div className="text-slate-600 text-[11px] italic">"{mod.varianceNotes}"</div>
                          {mod.comments && mod.comments.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {mod.comments.map(c => (
                                <div key={c.id} className="text-[10px] bg-slate-100 p-1 rounded border border-slate-200 flex items-center justify-between">
                                  <span>{c.comment}</span>
                                  <button onClick={() => handleRemoveModComment(mod.id, c.id)} className="text-slate-400 hover:text-rose-600 ml-1">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModeration(mod)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors"
                              title="Edit Moderation Sample"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setCommentTarget({ type: 'moderation', id: mod.id, title: `Moderation for ${mod.assessmentTitle}` })}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
                              title="Add Coordinator Note"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteModeration(mod.id, mod.assessmentTitle)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove Moderation Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 5: TEACHER PERFORMANCE APPRAISAL (TSC TPAD)
            ======================================================== */}
        {activeTab === 'appraisal' && (
          <StaffAppraisalModule currentUser={currentUser} />
        )}

        {/* ========================================================
            TAB 6: COMPUTER LAB MODULE INTEGRATION
            ======================================================== */}
        {activeTab === 'computer_lab' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  <span>Executive Oversight: Computer Lab & Scratch Coding Studio</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review classroom Scratch demonstrations, challenge library distribution, and STEM integration.
                </p>
              </div>
            </div>

            <ComputerLabModule currentUser={currentUser} />
          </div>
        )}

        {/* ========================================================
            TAB 7: REQUEST TEACHER/STUDENT DOCUMENTS
            ======================================================== */}
        {activeTab === 'doc_requests' && (
          <div className="space-y-4">
            <DocumentRequestsHub currentUser={currentUser} />
          </div>
        )}

        {/* ========================================================
            TAB 8: CURRICULUM DIRECTIVES & POST CMS
            ======================================================== */}
        {activeTab === 'directives' && (
          <div className="space-y-4">
            <CMSPostsSectionsHub currentUser={currentUser} />
          </div>
        )}

        {/* ========================================================
            TAB 9: WRITE CURRICULUM REPORTS & REPORT CARDS MODERATION
            ======================================================== */}
        {activeTab === 'reports_suite' && (
          <div className="space-y-4">
            <CurriculumReportWriterModule currentUser={currentUser} />
          </div>
        )}

      </main>

      {/* ========================================================
          MODAL: PACING ADVISORY MEMO DISPATCH
          ======================================================== */}
      {advisoryModalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-sm text-slate-900">Dispatch Curriculum Pacing Advisory</h3>
              </div>
              <button onClick={() => setAdvisoryModalTopic(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950">
              <div><strong>Recipient:</strong> {advisoryModalTopic.leadTeacher}</div>
              <div><strong>Subject & Grade:</strong> {advisoryModalTopic.subject} (Grade {advisoryModalTopic.grade})</div>
              <div><strong>Strand:</strong> {advisoryModalTopic.strand} &gt; {advisoryModalTopic.subStrand}</div>
            </div>

            <form onSubmit={handleSendPacingAdvisory} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pacing Memo Directive *</label>
                <textarea
                  rows={4}
                  required
                  value={advisoryMemoText}
                  onChange={(e) => setAdvisoryMemoText(e.target.value)}
                  placeholder="Detail expected catch-up schedule or remedial timetable adjustments..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdvisoryModalTopic(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Advisory Memo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT SYLLABUS PACING TOPIC
          ======================================================== */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>{editingTopic ? 'Edit Syllabus Pacing Strand' : 'Add New Monitored Strand'}</span>
              </h3>
              <button onClick={() => setIsTopicModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade Level</label>
                  <select
                    value={topicFormGrade}
                    onChange={(e) => setTopicFormGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={topicFormSubject}
                    onChange={(e) => setTopicFormSubject(e.target.value as SubjectName)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {allSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Strand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Numbers & Operations"
                    value={topicFormStrand}
                    onChange={(e) => setTopicFormStrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sub-Strand</label>
                  <input
                    type="text"
                    placeholder="e.g. Fractions & Decimals"
                    value={topicFormSubStrand}
                    onChange={(e) => setTopicFormSubStrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Week</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={topicFormExpectedWeek}
                    onChange={(e) => setTopicFormExpectedWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Completed Week</label>
                  <input
                    type="number"
                    min={0}
                    max={14}
                    value={topicFormCompletedWeek}
                    onChange={(e) => setTopicFormCompletedWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={topicFormStatus}
                    onChange={(e) => setTopicFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="on_schedule">On Schedule</option>
                    <option value="ahead">Ahead of Target</option>
                    <option value="lagging">Lagging</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lead Instructor</label>
                <input
                  type="text"
                  placeholder="e.g. Ms. Sarah Mwangi"
                  value={topicFormTeacher}
                  onChange={(e) => setTopicFormTeacher(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Competency</label>
                <input
                  type="text"
                  placeholder="e.g. Critical thinking in splitting concrete objects"
                  value={topicFormCompetency}
                  onChange={(e) => setTopicFormCompetency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Coordinator Remarks / Remedial Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add instructional notes or timetable catch-up plan..."
                  value={topicFormRemarks}
                  onChange={(e) => setTopicFormRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {editingTopic ? 'Save Changes' : 'Add Strand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT SCHEME OF WORK
          ======================================================== */}
      {isSchemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>{editingScheme ? 'Edit Scheme of Work' : 'Register New Scheme of Work'}</span>
              </h3>
              <button onClick={() => setIsSchemeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject Faculty / Teacher Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. John Kamau"
                  value={schemeFormTeacher}
                  onChange={(e) => setSchemeFormTeacher(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade</label>
                  <select
                    value={schemeFormGrade}
                    onChange={(e) => setSchemeFormGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={schemeFormSubject}
                    onChange={(e) => setSchemeFormSubject(e.target.value as SubjectName)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {allSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Term</label>
                  <select
                    value={schemeFormTerm}
                    onChange={(e) => setSchemeFormTerm(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Verification Status</label>
                <select
                  value={schemeFormStatus}
                  onChange={(e) => setSchemeFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="approved">Verified & Approved</option>
                  <option value="pending_revision">Revision Required</option>
                  <option value="under_review">Under Review</option>
                  <option value="remediation_planned">Remediation Planned</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Coordinator Feedback & Directives</label>
                <textarea
                  rows={3}
                  placeholder="Specify alignment with learner rubrics, virtual science labs, or catch-up steps..."
                  value={schemeFormFeedback}
                  onChange={(e) => setSchemeFormFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchemeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {editingScheme ? 'Save Changes' : 'Save Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT CBA MODERATION SAMPLE
          ======================================================== */}
      {isModModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>{editingMod ? 'Edit CBA Moderation Sample' : 'Record CBA Moderation Sample'}</span>
              </h3>
              <button onClick={() => setIsModModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModeration} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assessment Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fraction Strip Construction & Equivalence Investigation"
                  value={modFormAssessmentTitle}
                  onChange={(e) => setModFormAssessmentTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade</label>
                  <select
                    value={modFormGrade}
                    onChange={(e) => setModFormGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stream</label>
                  <select
                    value={modFormStream}
                    onChange={(e) => setModFormStream(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
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
                    value={modFormSubject}
                    onChange={(e) => setModFormSubject(e.target.value as SubjectName)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {allSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Consensus Attainment</label>
                  <select
                    value={modFormConsensusLevel}
                    onChange={(e) => setModFormConsensusLevel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-700"
                  >
                    <option value="EE">EE (Exceeding)</option>
                    <option value="ME">ME (Meeting)</option>
                    <option value="AE">AE (Approaching)</option>
                    <option value="BE">BE (Below)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sample Size (Learners)</label>
                  <input
                    type="number"
                    min={1}
                    value={modFormSampleSize}
                    onChange={(e) => setModFormSampleSize(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-700">Learner Attainment Counts</div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-emerald-800 font-bold block">EE Count</label>
                    <input
                      type="number"
                      min={0}
                      value={modFormEE}
                      onChange={(e) => setModFormEE(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-blue-800 font-bold block">ME Count</label>
                    <input
                      type="number"
                      min={0}
                      value={modFormME}
                      onChange={(e) => setModFormME(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-800 font-bold block">AE Count</label>
                    <input
                      type="number"
                      min={0}
                      value={modFormAE}
                      onChange={(e) => setModFormAE(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-rose-800 font-bold block">BE Count</label>
                    <input
                      type="number"
                      min={0}
                      value={modFormBE}
                      onChange={(e) => setModFormBE(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Variance Notes & Moderation Findings</label>
                <textarea
                  rows={2}
                  placeholder="Note stream consistency, rubric reliability, or evidence alignment..."
                  value={modFormVarianceNotes}
                  onChange={(e) => setModFormVarianceNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {editingMod ? 'Save Changes' : 'Record Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD COMMENT (FOR TOPIC, SCHEME, OR MODERATION)
          ======================================================== */}
      {commentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Add Coordinator Comment</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{commentTarget.title}</p>
              </div>
              <button onClick={() => setCommentTarget(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostGenericComment} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pedagogical Comment / Directive *</label>
                <textarea
                  rows={4}
                  required
                  value={genericCommentText}
                  onChange={(e) => setGenericCommentText(e.target.value)}
                  placeholder="Enter detailed review remark, remedial advice, or commendation..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCommentTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
