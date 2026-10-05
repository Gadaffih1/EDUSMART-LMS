import React, { useState } from 'react';
import { 
  User, 
  Topic, 
  LessonNote, 
  VideoLesson, 
  AudioLesson, 
  Quiz, 
  getSubjectsForGrade, 
  SubjectName,
  Announcement,
  QuizAttempt,
  VirtualClassRoom,
  ReportCard,
  TimetableSlot,
  Assignment,
  ChatMessage
} from '../../types';
import { Storage } from '../../utils/storage';
import { ResourceViewer } from '../resources/ResourceViewer';
import { QuizRunner } from '../quiz/QuizRunner';
import { PerformanceCharts } from './PerformanceCharts';
import { SafeSearchModal } from './SafeSearchModal';
import { EPortfolioModule } from './EPortfolioModule';
import { PeriodicReportsModule } from './PeriodicReportsModule';
import { GamificationBadgesModule } from './GamificationBadgesModule';
import { AchievementSystem } from './AchievementSystem';
import { ExternalToolsHub } from './ExternalToolsHub';
import { SafeBrowser } from './SafeBrowser';
import { ReportingHub } from '../reports/ReportingHub';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  BookOpen, 
  Bell, 
  BarChart3, 
  CheckSquare, 
  Video, 
  MessageSquare, 
  Calendar, 
  FileText,
  Clock, 
  ExternalLink, 
  Lock, 
  ShieldCheck, 
  Award, 
  ChevronRight,
  Send,
  Play,
  Volume2,
  FileCheck,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  TrendingUp,
  Search,
  FolderGit2,
  Trophy,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface StudentWorkspaceProps {
  currentUser: User;
}

type WorkspaceTab = 
  | 'resources' 
  | 'announcements' 
  | 'reports' 
  | 'quiz_results' 
  | 'virtual_class' 
  | 'grade_chats'
  | 'timetable'
  | 'assignments'
  | 'portfolio'
  | 'badges'
  | 'integrations'
  | 'browser';

export const StudentWorkspace: React.FC<StudentWorkspaceProps> = ({ currentUser }) => {
  const studentGrade = currentUser.grade || 4;
  const studentStream = currentUser.stream || 'Dove';

  // Active top button
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('resources');
  const [showSafeSearch, setShowSafeSearch] = useState(false);
  const [reportViewType, setReportViewType] = useState<'hub' | 'periodic' | 'termly'>('hub');

  // Handle direct tab navigation from notification items
  React.useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (tab) {
        if (['resources', 'browser', 'timetable', 'assignments', 'results', 'eportfolio', 'reports', 'badges', 'chat'].includes(tab)) {
          setActiveTab(tab as WorkspaceTab);
        } else if (['notes', 'videos', 'audio', 'quizzes', 'portal'].includes(tab)) {
          setActiveTab('resources');
        }
      }
    };
    window.addEventListener('workspace-nav-tab', handleNavEvent);
    return () => window.removeEventListener('workspace-nav-tab', handleNavEvent);
  }, []);

  // Gamification XP
  const learnerTotalXP = Storage.getTotalXP();
  const learnerBadges = Storage.getBadges();
  const unlockedBadgesCount = learnerBadges.filter(b => b.unlocked).length;

  // Resources state
  const availableSubjects = getSubjectsForGrade(studentGrade);
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>(availableSubjects[0]);

  // Viewer and Quiz Runner modals
  const [activeNote, setActiveNote] = useState<LessonNote | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);
  const [activeAudio, setActiveAudio] = useState<AudioLesson | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  const handleOpenNote = (n: LessonNote) => {
    Storage.recordResourceView(currentUser.id, n.id);
    Storage.evaluateBadgesForStudent(currentUser);
    setActiveNote(n);
  };

  const handleOpenVideo = (v: VideoLesson) => {
    Storage.recordResourceView(currentUser.id, v.id);
    Storage.evaluateBadgesForStudent(currentUser);
    setActiveVideo(v);
  };

  const handleOpenAudio = (a: AudioLesson) => {
    Storage.recordResourceView(currentUser.id, a.id);
    Storage.evaluateBadgesForStudent(currentUser);
    setActiveAudio(a);
  };

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatType, setChatType] = useState<'stream' | 'teacher'>('stream');

  // Assignment submission modal
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentSubmittedSuccess, setAssignmentSubmittedSuccess] = useState(false);

  // Fetch strictly grade-filtered data (NO cross-grade data allowed)
  const gradeTopics = Storage.getTopics(studentGrade).filter(t => t.subject === selectedSubject);
  const gradeNotes = Storage.getNotes(studentGrade);
  const gradeVideos = Storage.getVideos(studentGrade);
  const gradeAudios = Storage.getAudios(studentGrade);
  const gradeQuizzes = Storage.getQuizzes(studentGrade);
  const gradeAnnouncements = Storage.getAnnouncements(studentGrade);
  const studentAttempts = Storage.getQuizAttempts(currentUser.id);
  const gradeVirtualClasses = Storage.getVirtualClasses(studentGrade);
  const studentReportCards = Storage.getReportCards(currentUser.id);
  const streamTimetable = Storage.getTimetable(studentGrade, studentStream);
  const gradeAssignments = Storage.getAssignments(studentGrade);
  const chatMessages = Storage.getChatMessages(studentGrade, studentStream);

  // Send a chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: 'student',
      grade: studentGrade,
      stream: studentStream,
      recipientName: chatType === 'teacher' ? 'Class Teacher' : undefined,
      message: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isDirect: chatType === 'teacher'
    };

    Storage.sendChatMessage(newMsg);
    setChatInput('');
  };

  // Submit assignment
  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment || !assignmentText.trim()) return;

    // Simulate submission
    setAssignmentSubmittedSuccess(true);
    setTimeout(() => {
      setAssignmentSubmittedSuccess(false);
      setSubmittingAssignment(null);
      setAssignmentText('');
    }, 1800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Student Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-2xs shrink-0 hidden sm:flex items-center justify-center">
            <EduSmartGadsaLogo variant="horizontal" size="sm" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-bold text-xl flex sm:hidden items-center justify-center shadow-xs shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>CBC Learner Portal</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-600">{currentUser.admissionNumber || 'ADM/2026/0412'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Single-Grade Enrolled</span>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentUser.name}
            </h1>
            <div className="text-xs text-slate-600 mt-0.5">
              Grade <strong className="text-slate-900">{studentGrade}</strong> · Stream: <strong className="text-emerald-700 font-bold">{studentStream}</strong> · 2026 Academic Session
            </div>
          </div>
        </div>

        {/* Header Tools: Safe Browser, Safe Search & XP Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Safe Browser Button */}
          <button
            onClick={() => setActiveTab('browser')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all"
            title="Safe Browser with AI-powered content filtration for Grades 1-9"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Safe Browser (AI Filtered)</span>
          </button>

          {/* Safe Search Button */}
          <button
            onClick={() => setShowSafeSearch(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all"
            title="Safe Search with content filtration & curriculum guidance"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safe Curriculum Search</span>
          </button>

          {/* XP & Badges Capsule */}
          <button
            onClick={() => setActiveTab('badges')}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 text-xs text-amber-900 transition-colors"
            title="View Badges & Certification XP"
          >
            <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="text-left leading-tight">
              <div className="font-extrabold font-mono text-amber-800">{learnerTotalXP} XP</div>
              <div className="text-[10px] text-amber-700">{unlockedBadgesCount} Badges Unlocked</div>
            </div>
          </button>

          {/* Security badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <div className="font-bold">Grade {studentGrade} Locked</div>
              <div className="text-[10px] text-emerald-700">Strictly single-grade access</div>
            </div>
          </div>
        </div>
      </div>

      {/* The 6 Main Workspace Buttons requested in prompt (+ Timetable & Assignments shortcuts) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Resources */}
        <button
          onClick={() => setActiveTab('resources')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'resources'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-emerald-100 text-emerald-800">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">1. Resources</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'resources' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Notes, Videos & Audios
            </div>
          </div>
        </button>

        {/* 2. Announcements */}
        <button
          onClick={() => setActiveTab('announcements')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'announcements'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-blue-100 text-blue-800">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">2. Announcements</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'announcements' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Reminders & Notices
            </div>
          </div>
        </button>

        {/* 3. Reports */}
        <button
          onClick={() => setActiveTab('reports')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'reports'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-purple-100 text-purple-800">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">3. Reports</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'reports' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Subject & Termly Cards
            </div>
          </div>
        </button>

        {/* 4. Quiz Results */}
        <button
          onClick={() => setActiveTab('quiz_results')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'quiz_results'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-amber-100 text-amber-800">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">4. Quiz Results</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'quiz_results' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Scores & Auto-Marking
            </div>
          </div>
        </button>

        {/* 5. Virtual Class */}
        <button
          onClick={() => setActiveTab('virtual_class')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'virtual_class'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-rose-100 text-rose-800">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">5. Virtual Class</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'virtual_class' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Google Meet Live
            </div>
          </div>
        </button>

        {/* 6. Grade Chats */}
        <button
          onClick={() => setActiveTab('grade_chats')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'grade_chats'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-teal-100 text-teal-800">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">6. Grade Chats</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'grade_chats' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Stream & Teacher Chat
            </div>
          </div>
        </button>
      </div>

      {/* Secondary quick tabs: Timetable, Assignments, E-Portfolio, Badges, Integrations */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
          Additional Tools:
        </span>
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'timetable'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Class Timetable ({studentStream})</span>
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'assignments'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Assignments ({gradeAssignments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'portfolio'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>E-Portfolio & Projects</span>
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'badges'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Badges & Certification XP</span>
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'integrations'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>External Integrations Hub</span>
        </button>
        <button
          onClick={() => setActiveTab('browser')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'browser'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-emerald-100/70 text-emerald-900 hover:bg-emerald-200/80 border border-emerald-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>🛡️ Safe Browser (AI Guarded)</span>
        </button>
      </div>

      {/* ========================================================
          ACHIEVEMENT SYSTEM: DIGITAL BADGES SHELF WIDGET
          Displays awarded badges (Top Scorer, Perfect Attendance, Resource Explorer, etc.)
          ======================================================== */}
      {activeTab !== 'badges' && (
        <div className="bg-gradient-to-r from-amber-50 via-emerald-50 to-indigo-50 border border-amber-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500 text-white rounded-lg shadow-2xs">
                <Trophy className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Student Achievement Shelf: Earned Badges</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">
                    {unlockedBadgesCount} Awarded
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Top Scorer, Perfect Attendance, Resource Explorer & competency honors based on your learning activity.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('badges')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
            >
              <span>Open Achievement System Hub</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Badges Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {learnerBadges.slice(0, 6).map((badge) => (
              <button
                key={badge.id}
                onClick={() => setActiveTab('badges')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-1.5 ${
                  badge.unlocked
                    ? 'bg-white border-amber-200 shadow-2xs hover:border-amber-400 hover:shadow-xs'
                    : 'bg-white/50 border-dashed border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">
                    {badge.id === 'bdg-top-scorer' ? '🏆' : badge.id === 'bdg-perfect-attendance' ? '⏰' : badge.id === 'bdg-resource-explorer' ? '📖' : badge.id === 'bdg-portfolio-artisan' ? '✨' : badge.id === 'bdg-digital-citizen' ? '🛡️' : '⚡'}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    badge.unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {badge.unlocked ? 'Awarded' : 'Locked'}
                  </span>
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900 truncate">{badge.title}</div>
                  <div className="text-[10px] text-slate-500 truncate">+{badge.xpPoints} XP</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 1: RESOURCES (Notes, Videos, Audios, Topical Quizzes)
          ======================================================== */}
      {activeTab === 'resources' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Grade {studentGrade} Learning Resources
              </h2>
              <p className="text-xs text-slate-500">
                Select a CBC subject below to access comprehensive notes, video lessons, audio guides, and topical quizzes.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Grade {studentGrade} Curriculum · Anti-Download Protected
            </div>
          </div>

          {/* Subject Pills / Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            {availableSubjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                  selectedSubject === subj
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Topics and Resources Breakdown for Selected Subject */}
          <div className="space-y-6">
            {gradeTopics.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">Curriculum Syllabus in Progress</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Topics for {selectedSubject} in Grade {studentGrade} are currently being published by your subject teacher.
                </p>
              </div>
            ) : (
              gradeTopics.map((topic) => {
                // Find resources linked to this topic
                const topicNotes = gradeNotes.filter(n => n.topicId === topic.id);
                const topicVideos = gradeVideos.filter(v => v.topicId === topic.id);
                const topicAudios = gradeAudios.filter(a => a.topicId === topic.id);
                const topicQuizzes = gradeQuizzes.filter(q => q.topicId === topic.id);

                return (
                  <div
                    key={topic.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span>Term {topic.term}</span>
                          <span aria-hidden="true">·</span>
                          <span>Week {topic.week}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-emerald-700">{selectedSubject}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">
                          {topic.title}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {topicNotes.length} Notes · {topicVideos.length} Video · {topicAudios.length} Audio · {topicQuizzes.length} Quiz
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {topic.description}
                    </p>

                    {/* The 4 Core Media Channels: Notes, Video, Audio, Quiz */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                      
                      {/* 1. NOTES BUTTON */}
                      {topicNotes.length > 0 ? (
                        topicNotes.map(n => (
                          <button
                            key={n.id}
                            onClick={() => handleOpenNote(n)}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all text-left flex items-start gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-emerald-900">
                                View Notes
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">
                                {n.title}
                              </div>
                              <div className="text-[10px] text-emerald-700 font-medium mt-1">
                                In-App Reader (Secure)
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 text-xs flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span>Notes uploading soon</span>
                        </div>
                      )}

                      {/* 2. VIDEO LESSON BUTTON */}
                      {topicVideos.length > 0 ? (
                        topicVideos.map(v => (
                          <button
                            key={v.id}
                            onClick={() => handleOpenVideo(v)}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50/60 hover:border-rose-300 transition-all text-left flex items-start gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-rose-900">
                                Video Lesson
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">
                                {v.title}
                              </div>
                              <div className="text-[10px] text-rose-700 font-medium mt-1">
                                {v.durationMinutes} mins · Whiteboard stream
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 text-xs flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          <span>Video uploading soon</span>
                        </div>
                      )}

                      {/* 3. AUDIO LESSON BUTTON */}
                      {topicAudios.length > 0 ? (
                        topicAudios.map(a => (
                          <button
                            key={a.id}
                            onClick={() => handleOpenAudio(a)}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50/60 hover:border-teal-300 transition-all text-left flex items-start gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                              <Volume2 className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-teal-900">
                                Audio Lesson
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">
                                {a.title}
                              </div>
                              <div className="text-[10px] text-teal-700 font-medium mt-1">
                                {a.durationMinutes} mins · Mental podcast
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 text-xs flex items-center gap-2">
                          <Volume2 className="w-4 h-4" />
                          <span>Audio uploading soon</span>
                        </div>
                      )}

                      {/* 4. TOPIC QUIZ BUTTON */}
                      {topicQuizzes.length > 0 ? (
                        topicQuizzes.map(q => {
                          const existingAttempt = studentAttempts.find(a => a.quizId === q.id);
                          return (
                            <button
                              key={q.id}
                              onClick={() => setActiveQuiz(q)}
                              className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-400 transition-all text-left flex items-start gap-3 group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Award className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden">
                                <div className="font-bold text-xs text-emerald-950 line-clamp-1">
                                  Topical Quiz
                                </div>
                                <div className="text-[11px] text-emerald-800 line-clamp-1">
                                  {q.title}
                                </div>
                                <div className="text-[10px] font-bold text-emerald-700 mt-1">
                                  {existingAttempt ? `Attempted: ${existingAttempt.percentage}% (${existingAttempt.passed ? 'Pass' : 'Retake'})` : `Auto-Marked · ${q.questions.length} Qs`}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 text-xs flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          <span>Quiz coming soon</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 2: ANNOUNCEMENTS & LESSON REMINDERS
          ======================================================== */}
      {activeTab === 'announcements' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Grade {studentGrade} Announcements & Lesson Reminders
            </h2>
            <p className="text-xs text-slate-500">
              Official school notices and live lesson alerts broadcasted by your teachers.
            </p>
          </div>

          <div className="space-y-4">
            {gradeAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className={`p-5 rounded-xl border bg-white shadow-xs space-y-3 ${
                  ann.type === 'lesson_reminder'
                    ? 'border-emerald-300 ring-1 ring-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                        ann.type === 'lesson_reminder'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ann.type === 'lesson_reminder' ? 'Lesson Reminder' : 'General Notice'}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{ann.title}</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{ann.createdAt}</span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {ann.content}
                </p>

                {ann.meetLink && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs text-emerald-900">
                      <strong>Scheduled Live Meet:</strong> {ann.scheduledTime || 'Join active session'}
                    </div>
                    <a
                      href={ann.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Open Google Meet Class</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Posted by: <strong>{ann.author}</strong> ({ann.authorRole})</span>
                  <span>Target: Grade {ann.targetGrade || 'All'} {ann.targetStream ? `(${ann.targetStream})` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 3: REPORTS (CBC Subject & Termly Report Card)
          ======================================================== */}
      {activeTab === 'reports' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Learner Evaluation & Periodic Progress Reports
              </h2>
              <p className="text-xs text-slate-500">
                Summarized reports for easy interpretation by learners and parents. Track weekly milestones, monthly digests, termly summative evaluations, and annual progression dossiers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('quiz_results')}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>View Performance Charts</span>
              </button>
              <button
                onClick={() => window.print()}
                className="self-start sm:self-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Print Current View
              </button>
            </div>
          </div>

          {/* Sub-view toggle: Reporting Hub vs Periodic Dossiers vs Termly Report Card */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setReportViewType('hub')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                reportViewType === 'hub'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reporting Hub (Monthly, Termly, Annual PDF)</span>
            </button>
            <button
              onClick={() => setReportViewType('periodic')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                reportViewType === 'periodic'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Periodic Progress Reports (Weekly, Monthly, Termly, Annually)</span>
            </button>
            <button
              onClick={() => setReportViewType('termly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                reportViewType === 'termly'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Termly Summative Report Card & Class Register</span>
            </button>
          </div>

          {reportViewType === 'hub' ? (
            <ReportingHub currentUser={currentUser} />
          ) : reportViewType === 'periodic' ? (
            <PeriodicReportsModule currentUser={currentUser} />
          ) : (
            <div className="space-y-6">

          {studentReportCards.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Report Card Being Processed</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your class teacher is currently entering formative and summative marks for this term.
              </p>
            </div>
          ) : (
            studentReportCards.map((rc) => (
              <div key={rc.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                {/* Official School Header */}
                <div className="text-center pb-4 border-b border-slate-200 space-y-1">
                  <div className="flex justify-center mb-2">
                    <EduSmartGadsaLogo variant="full" size="sm" />
                  </div>
                  <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                    Edu-Smart PORTAL · By Gadsa Systems
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Official Learner Progress Report Card
                  </h3>
                  <div className="text-xs text-slate-600 font-medium">
                    {rc.term} · Academic Year {rc.academicYear} · Grade {rc.grade} (Stream: {rc.stream})
                  </div>
                </div>

                {/* Pupil Information Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Learner Name</div>
                    <div className="font-bold text-slate-900">{rc.studentName}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Admission No.</div>
                    <div className="font-mono font-bold text-slate-900">{rc.admissionNumber}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Stream Position</div>
                    <div className="font-bold text-emerald-700">{rc.streamPosition} of {rc.totalStudentsInStream} Pupils</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">Overall Average</div>
                    <div className="font-mono font-bold text-slate-900">{rc.overallAverage}% ({rc.overallRubric})</div>
                  </div>
                </div>

                {/* Multi-subject Scores Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Subject / Learning Area</th>
                        <th className="py-2.5 px-3 text-center">Opener (30)</th>
                        <th className="py-2.5 px-3 text-center">Mid-Term (30)</th>
                        <th className="py-2.5 px-3 text-center">End-Term (40)</th>
                        <th className="py-2.5 px-3 text-center">Total (100)</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3">CBC Competency Level</th>
                        <th className="py-2.5 px-3">Teacher Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {rc.subjects.map((sub, sIdx) => (
                        <tr key={sIdx} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-semibold text-slate-900">{sub.subject}</td>
                          <td className="py-2 px-3 text-center font-mono">{sub.openerScore}</td>
                          <td className="py-2 px-3 text-center font-mono">{sub.midTermScore}</td>
                          <td className="py-2 px-3 text-center font-mono">{sub.endTermScore}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">{sub.total}</td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-700">{sub.gradeLetter}</td>
                          <td className="py-2 px-3">
                            <span className="text-[11px] font-medium text-slate-700">
                              {sub.rubricLevel}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] italic">
                            "{sub.remarks}"
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Teacher Remarks & Sign-Off */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Class Teacher Remarks:
                    </div>
                    <p className="text-xs text-slate-800 italic">"{rc.classTeacherRemarks}"</p>
                    <div className="text-[10px] text-slate-500 pt-2 font-mono">
                      Signed: Class Teacher · Attendance: {rc.attendanceDays} / {rc.totalSchoolDays} Days
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Head Teacher Remarks:
                    </div>
                    <p className="text-xs text-slate-800 italic">"{rc.headTeacherRemarks}"</p>
                    <div className="text-[10px] text-slate-500 pt-2 font-mono">
                      Next Term Begins: {rc.nextTermBegins} · Official School Stamp
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Student's Verified Class Register Attendance Breakdown */}
          {(() => {
            const attSummary = Storage.getStudentAttendanceSummary(currentUser.id);
            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-emerald-700" />
                      <span>Class Register Attendance Records (Grade {studentGrade} · {studentStream})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Official roll call marked daily by your class teacher for specific term dates.
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                    Attendance Rate: {attSummary.attendanceRate}%
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-sans text-slate-500 uppercase">Roll Call Days</div>
                    <div className="text-xl font-bold text-slate-900">{attSummary.totalMarkedDays} Days</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-[10px] font-sans text-emerald-700 uppercase">Days Present</div>
                    <div className="text-xl font-bold text-emerald-800">{attSummary.daysPresent}</div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <div className="text-[10px] font-sans text-rose-700 uppercase">Days Absent</div>
                    <div className="text-xl font-bold text-rose-800">{attSummary.daysAbsent}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-[10px] font-sans text-blue-700 uppercase">Excused / Late</div>
                    <div className="text-xl font-bold text-blue-800">{attSummary.daysLate + attSummary.daysExcused}</div>
                  </div>
                </div>

                {attSummary.history.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3 text-center">Status</th>
                          <th className="py-2 px-3">Class Teacher Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {attSummary.history.map((h, hIdx) => (
                          <tr key={hIdx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-800">{h.date}</td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  h.status === 'present'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : h.status === 'absent'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {h.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-sans text-slate-600 italic">
                              {h.remarks ? `"${h.remarks}"` : 'Regular attendance recorded'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          TAB 4: QUIZ RESULTS & PERFORMANCE CHARTS
          ======================================================== */}
      {activeTab === 'quiz_results' && (
        <section className="space-y-6">
          {/* Visual Performance Charts powered by Recharts */}
          <PerformanceCharts 
            quizAttempts={studentAttempts}
            studentGrade={studentGrade}
            studentName={currentUser.name}
          />

          <div className="pt-2">
            <h2 className="text-lg font-bold text-slate-900">
              Topical Quiz Submission History
            </h2>
            <p className="text-xs text-slate-500">
              Detailed chronological record of completed quizzes, question accuracy, percentage marks, and retake options.
            </p>
          </div>

          {studentAttempts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <CheckSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Quizzes Attempted Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Go to the Resources tab to take your first topical quiz with instant automatic marking.
              </p>
              <button
                onClick={() => setActiveTab('resources')}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
              >
                Go to Resources
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Quiz Title</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Percentage</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Completed On</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{att.quizTitle}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{att.subject}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {att.score} / {att.totalQuestions}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                        {att.percentage}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded font-mono uppercase ${
                            att.passed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {att.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{att.completedAt}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            const quiz = gradeQuizzes.find(q => q.id === att.quizId);
                            if (quiz) setActiveQuiz(quiz);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs transition-colors"
                        >
                          Review / Retake
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          TAB 5: VIRTUAL CLASS (Google Meet Integration)
          ======================================================== */}
      {activeTab === 'virtual_class' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Grade {studentGrade} Google Meet Virtual Class
              </h2>
              <p className="text-xs text-slate-500">
                Access your official Google Meet virtual classroom for live lectures, demonstrations, and teacher Q&A.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google Meet Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gradeVirtualClasses.map((vc) => (
              <div
                key={vc.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase flex items-center gap-1.5 ${
                        vc.isLive
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${vc.isLive ? 'bg-rose-600' : 'bg-slate-400'}`} />
                      {vc.isLive ? 'LIVE NOW' : 'SCHEDULED'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Grade {vc.grade} {vc.stream ? `· ${vc.stream}` : ''}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {vc.subject}: {vc.topic}
                  </h3>
                  <div className="text-xs text-slate-600">
                    Host: <strong>{vc.teacherName}</strong>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">
                    Time: {vc.scheduledTime} ({vc.durationMinutes} mins)
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] text-slate-500 font-mono break-all">
                    Link: {vc.googleMeetLink}
                  </div>
                  <a
                    href={vc.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Google Meet Session</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">Virtual Classroom Guidelines:</div>
            <div>1. Ensure your microphone is muted upon entry; use the "Raise Hand" icon to speak.</div>
            <div>2. Have your notebook and CBC curriculum textbook open for note taking.</div>
            <div>3. Direct technical issues to your class teacher via the Grade Chats tab.</div>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 6: GRADE CHATS & DIRECT TEACHER CHAT
          ======================================================== */}
      {activeTab === 'grade_chats' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Grade {studentGrade} {studentStream} Discussion & Teacher Chat
              </h2>
              <p className="text-xs text-slate-500">
                Ask questions to your subject teacher or collaborate with fellow stream classmates.
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setChatType('stream')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  chatType === 'stream'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stream Discussion
              </button>
              <button
                onClick={() => setChatType('teacher')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  chatType === 'teacher'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ask Subject Teacher
              </button>
            </div>
          </div>

          {/* Chat Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[520px]">
            {/* Chat header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>
                  {chatType === 'stream'
                    ? `Grade ${studentGrade} · Stream ${studentStream} General Room`
                    : `Direct Consultation with Subject Teacher`}
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">Active Academic Session</span>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {chatMessages.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">
                  No messages yet. Send a greeting or ask a question!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  const isTeacher = msg.senderRole === 'teacher' || msg.senderRole === 'class_teacher';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-800">{msg.senderName}</span>
                        {isTeacher && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                            Teacher
                          </span>
                        )}
                        <span className="text-slate-400 text-[10px]">{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-md p-3 rounded-xl text-xs ${
                          isMine
                            ? 'bg-emerald-700 text-white rounded-tr-none'
                            : isTeacher
                            ? 'bg-white border border-emerald-300 text-slate-900 rounded-tl-none shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  chatType === 'stream'
                    ? `Message Grade ${studentGrade} ${studentStream}...`
                    : 'Type a question for your subject teacher...'
                }
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ========================================================
          ADDITIONAL TAB: CLASS TIMETABLE
          ======================================================== */}
      {activeTab === 'timetable' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Weekly Class Timetable (Grade {studentGrade} · Stream: {studentStream})
              </h2>
              <p className="text-xs text-slate-500">
                Official period timetable published by your class teacher.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">8:00 AM – 4:00 PM Active</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4 text-center">Period</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Location / Meet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {streamTimetable.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No timetable slots configured yet for Grade {studentGrade} {studentStream}.
                    </td>
                  </tr>
                ) : (
                  streamTimetable.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{slot.dayOfWeek}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-semibold">Period {slot.period}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{slot.startTime} - {slot.endTime}</td>
                      <td className="py-2.5 px-4 font-bold text-emerald-800">{slot.subject}</td>
                      <td className="py-2.5 px-4 text-slate-700">{slot.teacherName}</td>
                      <td className="py-2.5 px-4">
                        {slot.roomOrMeetLink ? (
                          <a
                            href={slot.roomOrMeetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:underline font-mono"
                          >
                            <span>Google Meet Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Main Class {studentStream}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          ADDITIONAL TAB: ASSIGNMENTS
          ======================================================== */}
      {activeTab === 'assignments' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Grade {studentGrade} Course Assignments
            </h2>
            <p className="text-xs text-slate-500">
              Submit your homework, practical journals, and exercises assigned by your teachers.
            </p>
          </div>

          <div className="space-y-4">
            {gradeAssignments.map((asg) => (
              <div
                key={asg.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase bg-slate-100 text-slate-700">
                      {asg.subject}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{asg.title}</h3>
                  </div>
                  <div className="text-xs text-rose-600 font-mono font-medium">
                    Due: {asg.dueDate} (Max Score: {asg.maxScore})
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {asg.instructions}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500">
                    Instructor: <strong>{asg.teacherName}</strong>
                  </div>
                  <button
                    onClick={() => setSubmittingAssignment(asg)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    Submit Assignment Work
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          ADDITIONAL TAB: E-PORTFOLIO
          ======================================================== */}
      {activeTab === 'portfolio' && (
        <EPortfolioModule currentUser={currentUser} />
      )}

      {/* ========================================================
          ADDITIONAL TAB: ACHIEVEMENT SYSTEM & DIGITAL BADGES
          ======================================================== */}
      {activeTab === 'badges' && (
        <AchievementSystem 
          currentUser={currentUser} 
          onNavigateToTab={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* ========================================================
          ADDITIONAL TAB: EXTERNAL INTEGRATIONS HUB
          ======================================================== */}
      {activeTab === 'integrations' && (
        <ExternalToolsHub currentUser={currentUser} />
      )}

      {/* ========================================================
          ADDITIONAL TAB: SAFE BROWSER (AI-POWERED FILTRATION)
          ======================================================== */}
      {activeTab === 'browser' && (
        <SafeBrowser 
          currentUser={currentUser} 
          onClose={() => setActiveTab('resources')}
        />
      )}

      {/* MODAL: Safe Curriculum Search & Content Filtration */}
      <SafeSearchModal
        currentUser={currentUser}
        isOpen={showSafeSearch}
        onClose={() => setShowSafeSearch(false)}
        onSelectNote={(note) => {
          setActiveNote(note);
          setShowSafeSearch(false);
        }}
        onSelectQuiz={(quiz) => {
          setActiveQuiz(quiz);
          setShowSafeSearch(false);
        }}
      />

      {/* MODAL: Resource Viewer (Anti-Download Protected Viewer) */}
      {(activeNote || activeVideo || activeAudio) && (
        <ResourceViewer
          note={activeNote}
          video={activeVideo}
          audio={activeAudio}
          onClose={() => {
            setActiveNote(null);
            setActiveVideo(null);
            setActiveAudio(null);
          }}
          onLaunchQuiz={() => {
            const topicId = activeNote?.topicId || activeVideo?.topicId || activeAudio?.topicId;
            const quiz = gradeQuizzes.find(q => q.topicId === topicId);
            if (quiz) {
              setActiveNote(null);
              setActiveVideo(null);
              setActiveAudio(null);
              setActiveQuiz(quiz);
            }
          }}
        />
      )}

      {/* MODAL: Quiz Runner with Auto-Marking */}
      {activeQuiz && (
        <QuizRunner
          quiz={activeQuiz}
          currentUser={currentUser}
          onClose={() => setActiveQuiz(null)}
          onQuizCompleted={() => {
            Storage.evaluateBadgesForStudent(currentUser);
          }}
        />
      )}

      {/* MODAL: Submit Assignment */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Submit Work: {submittingAssignment.title}
                </h3>
                <p className="text-xs text-slate-500">{submittingAssignment.subject} · Due: {submittingAssignment.dueDate}</p>
              </div>
              <button
                onClick={() => setSubmittingAssignment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="p-5 space-y-4">
              {assignmentSubmittedSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-bold space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <div>Assignment Submitted Successfully!</div>
                  <div className="text-[11px] font-normal">Your teacher has been notified for grading.</div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Learner Solution / Observation Notes:
                    </label>
                    <textarea
                      rows={6}
                      required
                      value={assignmentText}
                      onChange={(e) => setAssignmentText(e.target.value)}
                      placeholder="Type your worked solutions, fractions equations, or journal observations here..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSubmittingAssignment(null)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Send Submission
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
