import React, { useState } from 'react';
import { 
  User, 
  Topic, 
  LessonNote, 
  VideoLesson, 
  AudioLesson, 
  LessonImage,
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
import { TimetablePortal } from '../timetable/TimetablePortal';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { ELinksDirectory } from '../resources/ELinksDirectory';
import { VirtualLabWorkspace } from '../virtuallab/VirtualLabWorkspace';
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
  FileSpreadsheet,
  Globe,
  Image as ImageIcon,
  Menu,
  X,
  ChevronLeft,
  FlaskConical,
  Laptop
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  const [resourceViewMode, setResourceViewMode] = useState<'topics' | 'elinks'>('topics');

  // Viewer and Quiz Runner modals
  const [activeNote, setActiveNote] = useState<LessonNote | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);
  const [activeAudio, setActiveAudio] = useState<AudioLesson | null>(null);
  const [activeImage, setActiveImage] = useState<LessonImage | null>(null);
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

  const handleOpenImage = (img: LessonImage) => {
    Storage.recordResourceView(currentUser.id, img.id);
    Storage.evaluateBadgesForStudent(currentUser);
    setActiveImage(img);
  };

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatType, setChatType] = useState<'stream' | 'teacher'>('stream');

  // Assignment submission modal
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentSubmittedSuccess, setAssignmentSubmittedSuccess] = useState(false);
  const [activeAssignedLab, setActiveAssignedLab] = useState<Assignment | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'labs'>('all');

  // Fetch strictly grade-filtered data (NO cross-grade data allowed)
  const gradeTopics = Storage.getTopics(studentGrade).filter(t => t.subject === selectedSubject);
  const gradeNotes = Storage.getNotes(studentGrade);
  const gradeVideos = Storage.getVideos(studentGrade);
  const gradeAudios = Storage.getAudios(studentGrade);
  const gradeImages = Storage.getLessonImages(studentGrade);
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

  // Clear Operational and Academic Groupings for Library-Style Collapsible Sidebar
  const sidebarGroups = [
    {
      title: 'ACADEMIC & CURRICULUM',
      items: [
        { id: 'resources' as WorkspaceTab, label: '1. E-Resources & CBC Notes', icon: BookOpen, badge: `${gradeTopics.length} Topics` },
        { id: 'assignments' as WorkspaceTab, label: '2. Homework Assignments', icon: FileText, badge: gradeAssignments.length > 0 ? `${gradeAssignments.length}` : undefined, badgeColor: 'bg-emerald-600' },
        { id: 'quiz_results' as WorkspaceTab, label: '3. CBC Topical Quizzes', icon: CheckSquare, badge: studentAttempts.length > 0 ? `${studentAttempts.length}` : undefined },
        { id: 'reports' as WorkspaceTab, label: '4. Academic Reports & Cards', icon: BarChart3 },
        { id: 'portfolio' as WorkspaceTab, label: '5. E-Portfolio & Projects', icon: FolderGit2 },
        { id: 'timetable' as WorkspaceTab, label: '6. Class Timetable', icon: Calendar }
      ]
    },
    {
      title: 'OPERATIONAL & COLLABORATION',
      items: [
        { id: 'announcements' as WorkspaceTab, label: '7. Announcements & Notices', icon: Bell, badge: gradeAnnouncements.length > 0 ? `${gradeAnnouncements.length}` : undefined, badgeColor: 'bg-rose-600' },
        { id: 'virtual_class' as WorkspaceTab, label: '8. Virtual Class (Meet Live)', icon: Video },
        { id: 'grade_chats' as WorkspaceTab, label: '9. Stream & Teacher Chats', icon: MessageSquare },
        { id: 'badges' as WorkspaceTab, label: '10. Badges & XP Matrix', icon: Trophy, badge: `${learnerTotalXP} XP`, badgeColor: 'bg-amber-600' },
        { id: 'browser' as WorkspaceTab, label: '11. Safe Browser (AI Guarded)', icon: Globe },
        { id: 'integrations' as WorkspaceTab, label: '12. External Learning Hubs', icon: Layers }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors lg:hidden cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors hidden lg:flex items-center justify-center cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="bg-white p-1 rounded-lg border border-slate-700 hidden sm:block">
            <EduSmartGadsaLogo variant="horizontal" size="xs" />
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
              <span>CBC Learner Portal</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Grade {studentGrade} {studentStream}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block font-mono">
              ADM: {currentUser.admissionNumber || 'ADM/2026/0412'} · Single-Grade Curriculum Locked
            </p>
          </div>
        </div>

        {/* Quick Top Tools */}
        <div className="flex items-center gap-2">
          {/* Safe Browser Button */}
          <button
            onClick={() => setActiveTab('browser')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'browser'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300'
            }`}
            title="Safe Browser with AI content filtration"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Safe Browser</span>
          </button>

          {/* Safe Search Button */}
          <button
            onClick={() => setShowSafeSearch(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Safe Search with content filtration"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Safe Search</span>
          </button>

          {/* XP & Badges Capsule */}
          <button
            onClick={() => setActiveTab('badges')}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="View Badges & Certification XP"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{learnerTotalXP} XP</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout with Library-Style Collapsible Sidebar */}
      <div className="flex-1 flex w-full">
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Collapsible Left Sidebar */}
        <aside className={`
          fixed lg:static top-0 bottom-0 left-0 z-40
          ${isSidebarCollapsed ? 'w-20 min-w-20 max-w-20' : 'w-64 min-w-64 max-w-64'}
          bg-slate-900 border-r border-slate-800 text-slate-300
          flex flex-col shrink-0 transition-all duration-200 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
            <div className={`flex items-center gap-2.5 truncate ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <span className="text-xl shrink-0">🎒</span>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <div className="text-xs font-black text-white uppercase tracking-wider truncate">
                    STUDENT PORTAL
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    Grade {studentGrade} {studentStream}
                  </div>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                Active
              </span>
            )}
          </div>

          {/* Scrollable Groups */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
            {sidebarGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!isSidebarCollapsed ? (
                  <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.title}
                  </div>
                ) : (
                  <div className="border-t border-slate-800/80 my-2" />
                )}

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        title={isSidebarCollapsed ? item.label : undefined}
                        className={`
                          w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'}
                          rounded-xl font-bold transition-all text-left cursor-pointer
                          ${isActive 
                            ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-xs' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }
                        `}
                      >
                        <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? 'justify-center' : 'truncate'}`}>
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          {!isSidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>

                        {!isSidebarCollapsed && item.badge !== undefined && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black text-white shrink-0 ${item.badgeColor || 'bg-slate-700'}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Stamp */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
            {!isSidebarCollapsed ? (
              <>
                <span className="truncate font-mono">{currentUser.admissionNumber || 'ADM/2026'}</span>
                <span className="text-emerald-400 font-bold shrink-0">● Enrolled</span>
              </>
            ) : (
              <span className="text-emerald-400 font-bold mx-auto">●</span>
            )}
          </div>
        </aside>

        {/* Content View Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">

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
          TAB 1: RESOURCES (Notes, Videos, Audios, Diagrams & E-Links)
          ======================================================== */}
      {activeTab === 'resources' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Grade {studentGrade} E-Resources & Curated E-Links</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive study notes, video tutorials, audio podcasts, pedagogical diagrams, topical quizzes, and curated digital links.
              </p>
            </div>

            {/* Sub-view Switcher */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setResourceViewMode('topics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    resourceViewMode === 'topics'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Topic Syllabus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResourceViewMode('elinks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    resourceViewMode === 'elinks'
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Curated E-Links</span>
                </button>
              </div>
            </div>
          </div>

          {resourceViewMode === 'elinks' ? (
            <ELinksDirectory
              currentUser={currentUser}
              canManage={false}
              title="Learner Curated E-Links & Digital Web Directory"
              subtitle="Direct access to verified national curriculum repositories, interactive STEM labs (PhET), KICD broadcasting, and digital libraries curated by your teachers and librarian."
              defaultFilterGrade={studentGrade}
              defaultFilterSubject={selectedSubject}
            />
          ) : (
            <>
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
                    const topicImages = gradeImages.filter(img => img.topicId === topic.id || (img.subject === selectedSubject && img.grade === studentGrade));
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
                            {topicNotes.length} Notes · {topicVideos.length} Video · {topicAudios.length} Audio · {topicImages.length} Diagram · {topicQuizzes.length} Quiz
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {topic.description}
                        </p>

                        {/* The 5 Multimodal Channels: Notes, Video, Audio, Diagrams & Quiz */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                          
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

                          {/* 4. DIAGRAMS & IMAGES BUTTON */}
                          {topicImages.length > 0 ? (
                            topicImages.map(img => (
                              <button
                                key={img.id}
                                onClick={() => handleOpenImage(img)}
                                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-300 transition-all text-left flex items-start gap-3 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-blue-900">
                                    Visual Diagram
                                  </div>
                                  <div className="text-[11px] text-slate-500 line-clamp-1">
                                    {img.title}
                                  </div>
                                  <div className="text-[10px] text-blue-700 font-medium mt-1">
                                    {img.category || 'Diagram'} · High-Res
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 text-xs flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              <span>Diagram coming soon</span>
                            </div>
                          )}

                          {/* 5. TOPIC QUIZ BUTTON */}
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
            </>
          )}
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
          ADDITIONAL TAB: CLASS TIMETABLE & BELL CADENCE
          ======================================================== */}
      {activeTab === 'timetable' && (
        <TimetablePortal 
          currentUser={currentUser} 
          initialGrade={studentGrade} 
          initialStream={studentStream} 
          readOnly={true} 
        />
      )}

      {/* ========================================================
          ADDITIONAL TAB: ASSIGNMENTS
          ======================================================== */}
      {activeTab === 'assignments' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Grade {studentGrade} Course Assignments
              </h2>
              <p className="text-xs text-slate-500">
                Submit your homework, practical journals, and interactive virtual lab & Scratch coding tasks assigned by your subject teachers.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setAssignmentFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  assignmentFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Assignments ({gradeAssignments.length})
              </button>
              <button
                onClick={() => setAssignmentFilter('labs')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  assignmentFilter === 'labs' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Assigned Practicals ({gradeAssignments.filter(a => a.isVirtualLab || a.virtualLabType || a.title.toLowerCase().includes('virtual lab') || a.title.toLowerCase().includes('scratch')).length})</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {gradeAssignments
              .filter(asg => {
                if (assignmentFilter === 'labs') {
                  return asg.isVirtualLab || asg.virtualLabType || asg.title.toLowerCase().includes('virtual lab') || asg.title.toLowerCase().includes('scratch');
                }
                return true;
              })
              .map((asg) => {
                const isLab = asg.isVirtualLab || asg.virtualLabType || asg.title.toLowerCase().includes('virtual lab') || asg.title.toLowerCase().includes('scratch');
                const isScratch = asg.virtualLabType === 'scratch' || asg.title.toLowerCase().includes('scratch') || asg.subject === 'Computer Studies';

                return (
                  <div
                    key={asg.id}
                    className={`rounded-2xl p-5 shadow-xs space-y-3 border-2 transition-all ${
                      isLab
                        ? isScratch
                          ? 'bg-indigo-50/40 border-indigo-300 hover:border-indigo-400'
                          : 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-400'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase bg-slate-100 text-slate-700">
                          {asg.subject}
                        </span>
                        {isLab && (
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs ${
                            isScratch ? 'bg-indigo-600 text-white' : 'bg-emerald-700 text-white'
                          }`}>
                            {isScratch ? <Laptop className="w-3 h-3" /> : <FlaskConical className="w-3 h-3" />}
                            <span>{isScratch ? '💻 Teacher Assigned Scratch Project' : '🔬 Teacher Assigned Virtual Lab'}</span>
                          </span>
                        )}
                        <h3 className="font-extrabold text-sm text-slate-900">{asg.title}</h3>
                      </div>
                      <div className="text-xs text-rose-600 font-mono font-medium">
                        Due: {asg.dueDate} (Max Score: {asg.maxScore})
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-200/80">
                      {asg.instructions}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-[11px] text-slate-500">
                        Instructor: <strong>{asg.teacherName}</strong>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isLab && (
                          <button
                            onClick={() => setActiveAssignedLab(asg)}
                            className={`px-4 py-1.5 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                              isScratch 
                                ? 'bg-indigo-600 hover:bg-indigo-700' 
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            {isScratch ? <Laptop className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
                            <span>{isScratch ? 'Launch Assigned Scratch Studio' : 'Launch Assigned Virtual Lab'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSubmittingAssignment(asg)}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                        >
                          Submit Assignment Work
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
      {(activeNote || activeVideo || activeAudio || activeImage) && (
        <ResourceViewer
          note={activeNote}
          video={activeVideo}
          audio={activeAudio}
          image={activeImage}
          onClose={() => {
            setActiveNote(null);
            setActiveVideo(null);
            setActiveAudio(null);
            setActiveImage(null);
          }}
          onLaunchQuiz={() => {
            const topicId = activeNote?.topicId || activeVideo?.topicId || activeAudio?.topicId || activeImage?.topicId;
            const quiz = gradeQuizzes.find(q => q.topicId === topicId);
            if (quiz) {
              setActiveNote(null);
              setActiveVideo(null);
              setActiveAudio(null);
              setActiveImage(null);
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

      {/* MODAL: Launch Assigned Practical Virtual Lab / Scratch Studio */}
      {activeAssignedLab && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl flex-1 flex flex-col overflow-hidden max-w-7xl w-full mx-auto border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                  activeAssignedLab.virtualLabType === 'scratch' ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}>
                  {activeAssignedLab.virtualLabType === 'scratch' ? <Laptop className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                      Teacher Practical Assignment
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Assigned by {activeAssignedLab.teacherName} · Due {activeAssignedLab.dueDate}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-white mt-0.5">
                    {activeAssignedLab.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setActiveAssignedLab(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700"
              >
                Close & Return to Homework
              </button>
            </div>

            {/* In-LMS Workbench Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              <VirtualLabWorkspace
                currentUser={currentUser}
                assignedExperimentId={activeAssignedLab.labExperimentId}
                assignedLabType={activeAssignedLab.virtualLabType}
                isEmbedded={true}
                onClose={() => setActiveAssignedLab(null)}
                onAssignmentComplete={(rep) => {
                  const submissionText = `[Digital CBC Practical Report]\nExperiment: ${activeAssignedLab.labTitle || activeAssignedLab.title}\nObservations recorded: ${rep?.observations || 'Completed practical inquiry in Virtual Lab'}\nHypothesis: ${rep?.hypothesis || 'Verified'}\nFindings & Conclusion: ${rep?.conclusion || 'Completed according to standard lab procedures.'}`;
                  const existingSubs = JSON.parse(localStorage.getItem('edusmart_assignment_submissions') || '[]');
                  existingSubs.push({
                    id: `sub-${Date.now()}`,
                    assignmentId: activeAssignedLab.id,
                    studentId: currentUser.id,
                    studentName: currentUser.name,
                    grade: currentUser.grade || 4,
                    stream: (currentUser.stream as any) || 'Dove',
                    submissionText,
                    submittedAt: new Date().toISOString().split('T')[0],
                    status: 'submitted'
                  });
                  localStorage.setItem('edusmart_assignment_submissions', JSON.stringify(existingSubs));
                  setActiveAssignedLab(null);
                  alert('Assigned Practical Completed & Submitted to Teacher Successfully!');
                }}
              />
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
};
