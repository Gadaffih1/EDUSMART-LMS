import React, { useState } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName, 
  SubjectName,
  WorkEntryLog, 
  GateExitPass, 
  Assignment, 
  LessonNote, 
  VideoLesson, 
  AudioLesson, 
  LessonImage,
  Quiz, 
  QuizQuestion,
  VirtualClassRoom,
  Announcement,
  TimetableSlot,
  getStreamsForGrade, 
  getSubjectsForGrade,
  PRIMARY_STREAMS
} from '../../types';
import { Storage } from '../../utils/storage';
import { ClassTeacherModule } from './ClassTeacherModule';
import { StudentGateExit } from './StudentGateExit';
import { TeacherWorkEntryForm } from './TeacherWorkEntryForm';
import { ReportingHub } from '../reports/ReportingHub';
import { TimetablePortal } from '../timetable/TimetablePortal';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { ELinksDirectory } from '../resources/ELinksDirectory';
import { ResultUploadManager } from '../academic/ResultUploadManager';
import { LearnerLunchRegister } from '../meals/LearnerLunchRegister';
import { WorkspaceSidebar, WorkspaceSidebarGroup } from '../layout/WorkspaceSidebar';
import { LibraryRoomBookingButton } from '../library/LibraryRoomBookingButton';
import { VirtualLabWorkspace } from '../virtuallab/VirtualLabWorkspace';
import { ComputerLabModule } from './ComputerLabModule';
import { StaffAppraisalModule } from '../supervision/StaffAppraisalModule';
import { 
  ClipboardCheck,
  FileCheck2, 
  LogOut, 
  FileText, 
  BookOpen, 
  CheckSquare, 
  Video, 
  Calendar, 
  Bell, 
  Plus, 
  Check, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  Award,
  Users,
  Search,
  ChevronRight,
  FileSpreadsheet,
  Printer,
  Volume2,
  Image as ImageIcon,
  Globe,
  Trash2,
  Play,
  Sparkles,
  Tag,
  Menu,
  Briefcase,
  UserCheck,
  FolderTree,
  Utensils,
  DoorOpen,
  FlaskConical,
  Laptop
} from 'lucide-react';

interface TeacherWorkspaceProps {
  currentUser: User;
}

type TeacherTab = 
  | 'cbc_results'
  | 'staff_appraisal'
  | 'work_entry' 
  | 'gate_exit' 
  | 'class_register'
  | 'lunch_register'
  | 'assignments' 
  | 'computer_lab'
  | 'virtual_lab'
  | 'resources' 
  | 'quizzes'
  | 'virtual_class'
  | 'timetable'
  | 'library_booking'
  | 'reminders'
  | 'reporting_hub';

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({ currentUser }) => {
  const isClassTeacher = currentUser.role === 'class_teacher';
  const defaultGrade = currentUser.grade || 4;
  const defaultStream = currentUser.stream || 'Dove';

  const [activeTab, setActiveTab] = useState<TeacherTab>(
    isClassTeacher ? 'class_register' : 'work_entry'
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Handle direct tab navigation from notification items
  React.useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (tab) {
        if (['cbc_results', 'work_entry', 'gate_exit', 'class_register', 'assignments', 'computer_lab', 'virtual_lab', 'resources', 'quizzes', 'virtual_class', 'timetable', 'reminders', 'reporting_hub'].includes(tab)) {
          setActiveTab(tab as TeacherTab);
        } else if (tab === 'computer_lab' || tab === 'scratch' || tab === 'cs_lab' || tab === 'coding') {
          setActiveTab('computer_lab');
        } else if (tab === 'virtual_lab' || tab === 'vlab' || tab === 'virtuallab' || tab === 'science_lab') {
          setActiveTab('virtual_lab');
        } else if (tab === 'results' || tab === 'assessments') {
          setActiveTab('cbc_results');
        } else if (tab === 'attendance' || tab === 'register') {
          setActiveTab('class_register');
        } else if (tab === 'notes' || tab === 'videos' || tab === 'audio') {
          setActiveTab('resources');
        }
      }
    };
    window.addEventListener('workspace-nav-tab', handleNavEvent);
    return () => window.removeEventListener('workspace-nav-tab', handleNavEvent);
  }, []);

  // Assignment Creation Form State
  const [asgTitle, setAsgTitle] = useState('');
  const [asgGrade, setAsgGrade] = useState<GradeLevel>(defaultGrade);
  const [asgStream, setAsgStream] = useState<StreamName>(defaultStream);
  const [asgSubject, setAsgSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [asgInstructions, setAsgInstructions] = useState('');
  const [asgDueDate, setAsgDueDate] = useState('2026-10-10');
  const [asgMaxScore, setAsgMaxScore] = useState<number>(20);
  const [asgSuccess, setAsgSuccess] = useState(false);

  // Resource Sub-Tab (Notes, Audios, Videos, Images, E-Links)
  const [resourceSubTab, setResourceSubTab] = useState<'notes' | 'audios' | 'videos' | 'images' | 'elinks'>('notes');

  // Lesson Note Creation Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteGrade, setNoteGrade] = useState<GradeLevel>(defaultGrade);
  const [noteSubject, setNoteSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [noteSummary, setNoteSummary] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteKeyTakeaway, setNoteKeyTakeaway] = useState('');
  const [noteSuccess, setNoteSuccess] = useState(false);

  // Audio Lesson Form State
  const [audioTitle, setAudioTitle] = useState('');
  const [audioGrade, setAudioGrade] = useState<GradeLevel>(defaultGrade);
  const [audioSubject, setAudioSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [audioDuration, setAudioDuration] = useState<number>(10);
  const [audioUrl, setAudioUrl] = useState('https://actions.google.com/sounds/v1/science/digital_computer_sounds.ogg');
  const [audioTranscript, setAudioTranscript] = useState('');
  const [audioKeyPoint, setAudioKeyPoint] = useState('');
  const [audioSuccess, setAudioSuccess] = useState(false);

  // Video Lesson Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoGrade, setVideoGrade] = useState<GradeLevel>(defaultGrade);
  const [videoSubject, setVideoSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [videoDuration, setVideoDuration] = useState<number>(15);
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [videoThumbnail, setVideoThumbnail] = useState('https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80');
  const [videoKeyPoint, setVideoKeyPoint] = useState('');
  const [videoSuccess, setVideoSuccess] = useState(false);

  // Lesson Image / Pedagogical Diagram Form State
  const [imgTitle, setImgTitle] = useState('');
  const [imgGrade, setImgGrade] = useState<GradeLevel>(defaultGrade);
  const [imgSubject, setImgSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [imgUrl, setImgUrl] = useState('https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1000&q=80');
  const [imgCaption, setImgCaption] = useState('');
  const [imgCategory, setImgCategory] = useState<'diagram' | 'chart' | 'infographic' | 'illustration'>('diagram');
  const [imgTags, setImgTags] = useState('CBC, Revision, Curriculum');
  const [imgSuccess, setImgSuccess] = useState(false);

  // Existing Resources Lists for Teacher Management
  const [existingNotes, setExistingNotes] = useState<LessonNote[]>(() => Storage.getNotes());
  const [existingAudios, setExistingAudios] = useState<AudioLesson[]>(() => Storage.getAudios());
  const [existingVideos, setExistingVideos] = useState<VideoLesson[]>(() => Storage.getVideos());
  const [existingImages, setExistingImages] = useState<LessonImage[]>(() => Storage.getLessonImages());

  React.useEffect(() => {
    const refreshResources = () => {
      setExistingNotes(Storage.getNotes());
      setExistingAudios(Storage.getAudios());
      setExistingVideos(Storage.getVideos());
      setExistingImages(Storage.getLessonImages());
    };
    window.addEventListener('lesson-resources-updated', refreshResources);
    return () => window.removeEventListener('lesson-resources-updated', refreshResources);
  }, []);

  // Quiz Builder State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizGrade, setQuizGrade] = useState<GradeLevel>(defaultGrade);
  const [quizSubject, setQuizSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [quizPassPct, setQuizPassPct] = useState<number>(70);
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(10);
  const [questionsList, setQuestionsList] = useState<QuizQuestion[]>([
    {
      id: 'q-new-1',
      questionText: 'What is the sum of 1/4 and 2/4?',
      options: ['3/4', '1/2', '2/4', '3/8'],
      correctOptionIndex: 0,
      explanation: 'With identical denominators, add numerators: 1/4 + 2/4 = 3/4.'
    }
  ]);
  const [newQText, setNewQText] = useState('');
  const [newOpt0, setNewOpt0] = useState('');
  const [newOpt1, setNewOpt1] = useState('');
  const [newOpt2, setNewOpt2] = useState('');
  const [newOpt3, setNewOpt3] = useState('');
  const [newCorrectIdx, setNewCorrectIdx] = useState<number>(0);
  const [newExplanation, setNewExplanation] = useState('');
  const [quizSuccess, setQuizSuccess] = useState(false);

  // Lesson Reminder State
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderContent, setReminderContent] = useState('');
  const [reminderMeetLink, setReminderMeetLink] = useState('https://meet.google.com/edu-gr4-dove');
  const [reminderTime, setReminderTime] = useState('Today at 10:00 AM');
  const [reminderSuccess, setReminderSuccess] = useState(false);

  // Virtual class start
  const [meetLinkInput, setMeetLinkInput] = useState('https://meet.google.com/edu-live-session');
  const [meetTopicInput, setMeetTopicInput] = useState('Fractions Live Interactive Workshop');
  const [meetLiveActive, setMeetLiveActive] = useState(false);

  // Load existing records
  const [workLogs, setWorkLogs] = useState<WorkEntryLog[]>(() => Storage.getWorkEntryLogs(currentUser.id));
  const gatePasses = Storage.getGatePasses();
  const assignments = Storage.getAssignments();
  const quizzes = Storage.getQuizzes();
  const quizAttempts = Storage.getQuizAttempts();

  // Handlers
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle || !asgInstructions) return;

    const newAsg: Assignment = {
      id: `asg-${Date.now()}`,
      grade: asgGrade,
      stream: asgStream,
      subject: asgSubject,
      title: asgTitle,
      instructions: asgInstructions,
      dueDate: asgDueDate,
      maxScore: Number(asgMaxScore),
      teacherName: currentUser.name,
      teacherId: currentUser.id,
      submissionsCount: 0
    };

    Storage.addAssignment(newAsg);
    setAsgSuccess(true);
    setAsgTitle('');
    setAsgInstructions('');
    setTimeout(() => setAsgSuccess(false), 2500);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteContent) return;

    const newNote: LessonNote = {
      id: `note-${Date.now()}`,
      topicId: `top-custom-${Date.now()}`,
      grade: noteGrade,
      subject: noteSubject,
      title: noteTitle,
      summary: noteSummary || 'Comprehensive classroom study note.',
      content: noteContent,
      keyTakeaways: noteKeyTakeaway ? [noteKeyTakeaway] : ['Review all concepts thoroughly before topical quiz.'],
      author: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0]
    };

    Storage.addNote(newNote);
    setExistingNotes(Storage.getNotes());
    setNoteSuccess(true);
    setNoteTitle('');
    setNoteSummary('');
    setNoteContent('');
    setTimeout(() => setNoteSuccess(false), 2500);
  };

  const handleDeleteNote = (id: string) => {
    Storage.deleteNote(id);
    setExistingNotes(Storage.getNotes());
  };

  const handleCreateAudio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioTitle) return;

    const newAudio: AudioLesson = {
      id: `aud-${Date.now()}`,
      topicId: `top-custom-${Date.now()}`,
      grade: audioGrade,
      subject: audioSubject,
      title: audioTitle,
      durationMinutes: Number(audioDuration) || 10,
      audioUrl: audioUrl || 'https://actions.google.com/sounds/v1/science/digital_computer_sounds.ogg',
      transcript: audioTranscript || 'Comprehensive CBC audio lesson for student mental revision.',
      keyPoints: audioKeyPoint ? [audioKeyPoint] : ['Listen attentively and note down key curriculum concepts.'],
      teacherName: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0]
    };

    Storage.addAudio(newAudio);
    setExistingAudios(Storage.getAudios());
    setAudioSuccess(true);
    setAudioTitle('');
    setAudioTranscript('');
    setAudioKeyPoint('');
    setTimeout(() => setAudioSuccess(false), 2500);
  };

  const handleDeleteAudio = (id: string) => {
    Storage.deleteAudio(id);
    setExistingAudios(Storage.getAudios());
  };

  const handleCreateVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle) return;

    const newVideo: VideoLesson = {
      id: `vid-${Date.now()}`,
      topicId: `top-custom-${Date.now()}`,
      grade: videoGrade,
      subject: videoSubject,
      title: videoTitle,
      durationMinutes: Number(videoDuration) || 15,
      videoUrl: videoUrl,
      videoThumbnail: videoThumbnail,
      keyPoints: videoKeyPoint ? [videoKeyPoint] : ['Observe the demonstrated steps and apply in your homework exercise.'],
      teacherName: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0]
    };

    Storage.addVideo(newVideo);
    setExistingVideos(Storage.getVideos());
    setVideoSuccess(true);
    setVideoTitle('');
    setVideoKeyPoint('');
    setTimeout(() => setVideoSuccess(false), 2500);
  };

  const handleDeleteVideo = (id: string) => {
    Storage.deleteVideo(id);
    setExistingVideos(Storage.getVideos());
  };

  const handleCreateImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgTitle || !imgUrl) return;

    const tagsArray = imgTags.split(',').map(t => t.trim()).filter(Boolean);
    const newImg: LessonImage = {
      id: `img-${Date.now()}`,
      topicId: `top-custom-${Date.now()}`,
      grade: imgGrade,
      subject: imgSubject,
      title: imgTitle,
      imageUrl: imgUrl,
      caption: imgCaption || 'Visual pedagogical demonstration diagram for CBC curriculum learners.',
      category: imgCategory,
      tags: tagsArray.length > 0 ? tagsArray : ['Diagram', 'Visuals'],
      teacherName: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0]
    };

    Storage.addLessonImage(newImg);
    setExistingImages(Storage.getLessonImages());
    setImgSuccess(true);
    setImgTitle('');
    setImgCaption('');
    setTimeout(() => setImgSuccess(false), 2500);
  };

  const handleDeleteImage = (id: string) => {
    Storage.deleteLessonImage(id);
    setExistingImages(Storage.getLessonImages());
  };

  const handleAddQuestionToQuiz = () => {
    if (!newQText || !newOpt0 || !newOpt1 || !newOpt2 || !newOpt3) return;

    const q: QuizQuestion = {
      id: `q-${Date.now()}`,
      questionText: newQText,
      options: [newOpt0, newOpt1, newOpt2, newOpt3],
      correctOptionIndex: newCorrectIdx,
      explanation: newExplanation || 'Correct mathematical step.'
    };

    setQuestionsList(prev => [...prev, q]);
    setNewQText('');
    setNewOpt0('');
    setNewOpt1('');
    setNewOpt2('');
    setNewOpt3('');
    setNewExplanation('');
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle || questionsList.length === 0) return;

    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      topicId: `top-custom-${Date.now()}`,
      grade: quizGrade,
      subject: quizSubject,
      title: quizTitle,
      passPercentage: Number(quizPassPct),
      timeLimitMinutes: Number(quizTimeLimit),
      teacherName: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      questions: questionsList
    };

    Storage.addQuiz(newQuiz);
    setQuizSuccess(true);
    setQuizTitle('');
    setTimeout(() => setQuizSuccess(false), 2500);
  };

  const handleBroadcastReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle || !reminderContent) return;

    const announcement: Announcement = {
      id: `ann-${Date.now()}`,
      title: reminderTitle,
      content: reminderContent,
      type: 'lesson_reminder',
      targetGrade: defaultGrade,
      targetStream: defaultStream,
      author: currentUser.name,
      authorRole: isClassTeacher ? 'Class Teacher' : 'Subject Teacher',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      meetLink: reminderMeetLink,
      scheduledTime: reminderTime
    };

    Storage.addAnnouncement(announcement);
    setReminderSuccess(true);
    setReminderTitle('');
    setReminderContent('');
    setTimeout(() => setReminderSuccess(false), 2500);
  };

  const sidebarGroups: WorkspaceSidebarGroup<TeacherTab>[] = [
    {
      title: 'CLASSROOM & INSTRUCTION',
      items: [
        { id: 'work_entry', label: '1. Lesson Work Entry', icon: Briefcase },
        { id: 'class_register', label: '2. Class Roll Call Register', icon: UserCheck, badge: isClassTeacher ? `${currentUser.stream || 'Stream'}` : undefined },
        ...(isClassTeacher ? [{ id: 'lunch_register' as TeacherTab, label: '3. Learner Lunch Register', icon: Utensils, badge: 'Class Teacher' }] : []),
        { id: 'cbc_results', label: isClassTeacher ? '4. CBC Assessment Results' : '3. CBC Assessment Results', icon: Award, badge: 'Marks / Entry', badgeColor: 'bg-emerald-600' }
      ]
    },
    {
      title: 'LEARNING & TASKS',
      items: [
        { id: 'assignments', label: '4. Homework Assignments', icon: BookOpen },
        { id: 'computer_lab', label: '4b. CS Computer Lab & Scratch', icon: Laptop, badge: 'Projector & Challenges', badgeColor: 'bg-indigo-600' },
        { id: 'virtual_lab', label: '4c. Science Virtual Lab', icon: FlaskConical, badge: 'Demonstrations', badgeColor: 'bg-emerald-600' },
        { id: 'quizzes', label: '5. CBC Topical Quizzes', icon: CheckSquare },
        { id: 'resources', label: '6. Curriculum Resources & Links', icon: FolderTree },
        { id: 'virtual_class', label: '7. Virtual Class (Meet)', icon: Video }
      ]
    },
    {
      title: 'TIMETABLE & GOVERNANCE',
      items: [
        { id: 'staff_appraisal', label: '8. My Appraisal (TSC TPAD)', icon: Award, badge: 'TPAD' },
        { id: 'timetable', label: '9. Teaching Timetable', icon: Calendar },
        { id: 'library_booking', label: '9b. Library Room Booking', icon: DoorOpen, badge: 'Vacant Spots', badgeColor: 'bg-purple-600' },
        { id: 'gate_exit', label: '10. Student Gate Exit Passes', icon: LogOut },
        { id: 'reporting_hub', label: '11. Academic Reporting Hub', icon: FileSpreadsheet },
        { id: 'reminders', label: '12. Lesson Reminders', icon: Bell }
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
          
          <div className="bg-white p-1 rounded-lg border border-slate-700 hidden sm:block">
            <EduSmartGadsaLogo variant="horizontal" size="xs" />
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
              <span>Academic Department Teacher Console</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {isClassTeacher ? `Grade ${currentUser.grade} ${currentUser.stream} Class Teacher` : 'Subject Teacher'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Assigned: {currentUser.assignedSubjects?.join(', ') || 'CBC Curriculum'} · Lesson logs, registers & CBC marks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Result Upload / View Button */}
          <button
            onClick={() => setActiveTab('cbc_results')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CBC Assessment Results</span>
            <span className="sm:hidden">CBC Marks</span>
          </button>

          {/* Library Room Booking Button */}
          <LibraryRoomBookingButton 
            currentUser={currentUser} 
            variant="header" 
            label="Book Library Room" 
          />

          <button
            onClick={() => setActiveTab('virtual_class')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Google Meet</span>
          </button>

          <div className="text-right text-xs hidden md:block pl-2 border-l border-slate-700">
            <div className="font-bold text-white">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{currentUser.tscNumber || 'TSC/44120/ED'}</div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout with Sidebar Tree */}
      <div className="flex-1 flex w-full">
        <WorkspaceSidebar<TeacherTab>
          portalTitle="TEACHER PORTAL"
          portalSubtitle="Academic Department"
          portalIcon="👨‍🏫"
          portalBadge={isClassTeacher ? 'Form Lead' : 'Academic Dept'}
          groups={sidebarGroups}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          themeColor="blue"
          footerNote={`Grade ${defaultGrade} ${defaultStream}`}
          statusText="● Verified"
        />

        {/* Content View Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">

        {/* ========================================================
            TAB: CBC ASSESSMENT RESULTS (VIEW ASSIGNED & WHOLE GRADE)
            ======================================================== */}
        {activeTab === 'cbc_results' && (
          <ResultUploadManager 
            currentUser={currentUser} 
            viewMode="teacher"
            defaultGrade={defaultGrade}
          />
        )}

        {/* ========================================================
            TAB: MY STAFF PERFORMANCE APPRAISAL (TSC TPAD)
            ======================================================== */}
        {activeTab === 'staff_appraisal' && (
          <StaffAppraisalModule currentUser={currentUser} />
        )}

      {/* ========================================================
          CLASS TEACHER REGISTER & PERFORMANCE CONSOLE
          ======================================================== */}
      {isClassTeacher && activeTab === 'class_register' && (
        <ClassTeacherModule currentUser={currentUser} />
      )}

      {/* ========================================================
          LEARNER LUNCH REGISTER (RESPECTIVE CLASS TEACHER ONLY)
          ======================================================== */}
      {activeTab === 'lunch_register' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <LearnerLunchRegister
            currentUser={currentUser}
            initialGrade={defaultGrade}
            initialStream={defaultStream}
            viewMode="class_teacher"
            title={`Grade ${defaultGrade} (${defaultStream}) Class Teacher Lunch Register`}
            subtitle="Official daily midday lunch & dining attendance log. Marked strictly by the respective class teacher."
          />
        </div>
      )}

      {/* ========================================================
          TAB 1: WORK ENTRY SIGN IN (OFFICIAL INSTITUTIONAL PROTOCOL)
          ======================================================== */}
      {activeTab === 'work_entry' && (
        <section className="space-y-6">
          <TeacherWorkEntryForm 
            currentUser={currentUser} 
            onSuccess={(newLog) => {
              setWorkLogs(prev => [newLog, ...prev]);
            }}
          />

          {/* Historical Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Your Work Entry Sign-In History ({workLogs.length} Entries)
                </h3>
                <p className="text-xs text-slate-500">
                  Logged entries verified with staff number, digital photo stamp, and geo-location coordinates.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Audited by Deputy Head & HOD
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Staff No</th>
                      <th className="py-2.5 px-3">Teacher / Staff Name</th>
                      <th className="py-2.5 px-3">Strictly Work Email</th>
                      <th className="py-2.5 px-3">Sign-In Location</th>
                      <th className="py-2.5 px-3 text-center">Photo ID Status</th>
                      <th className="py-2.5 px-3 text-center">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {workLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          <div className="font-semibold text-slate-800">{log.date}</div>
                          <div className="text-[10px] text-slate-400">{log.time}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {log.staffNo || 'TSC-48192-ED'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {log.teacherName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                          {log.email || currentUser.email || 'teacher@edusmart.ac.ke'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <div className="font-medium text-slate-800">{log.signInLocation || 'Campus Staffroom'}</div>
                          <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>GPS Stamp Verified</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {log.photoUrl ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              <span>📷</span> Captured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[10px]">
                              <span>Digital ID</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[10px] uppercase">
                            Clocked In
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 2: STUDENT GATE EXIT SIGN OUT & STATUS TRACKING
          ======================================================== */}
      {activeTab === 'gate_exit' && (
        <StudentGateExit currentUser={currentUser} />
      )}

      {/* ========================================================
          TAB 3: ASSIGNMENTS (CREATE & GRADE)
          ======================================================== */}
      {activeTab === 'assignments' && (
        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Create New Student Assignment
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Assign homework or practical projects to specific grades or streams with rubric scoring.
            </p>

            {asgSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Assignment published! Students in Grade {asgGrade} ({asgStream}) can now submit solutions.</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Grade</label>
                  <select
                    value={asgGrade}
                    onChange={(e) => {
                      const g = Number(e.target.value) as GradeLevel;
                      setAsgGrade(g);
                      setAsgStream(getStreamsForGrade(g)[0] as StreamName);
                      setAsgSubject(getSubjectsForGrade(g)[0]);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  >
                    {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Stream</label>
                  <select
                    value={asgStream}
                    onChange={(e) => setAsgStream(e.target.value as StreamName)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  >
                    {getStreamsForGrade(asgGrade).map(s => (
                      <option key={s} value={s}>{s} Stream</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={asgSubject}
                    onChange={(e) => setAsgSubject(e.target.value as SubjectName)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  >
                    {getSubjectsForGrade(asgGrade).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={asgTitle}
                  onChange={(e) => setAsgTitle(e.target.value)}
                  placeholder="e.g. Fractions Word Problems Practice Set"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Instructions</label>
                <textarea
                  rows={3}
                  required
                  value={asgInstructions}
                  onChange={(e) => setAsgInstructions(e.target.value)}
                  placeholder="Describe step-by-step questions or practical requirements..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={asgDueDate}
                    onChange={(e) => setAsgDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    value={asgMaxScore}
                    onChange={(e) => setAsgMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Publish Assignment to Grade {asgGrade}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 3B: COMPUTER LAB MODULE (FOR CS TEACHERS & SCRATCH)
          Dedicated live Scratch projector, Challenge Library & class push
          ======================================================== */}
      {activeTab === 'computer_lab' && (
        <section className="space-y-6">
          <ComputerLabModule
            currentUser={currentUser}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
          />
        </section>
      )}

      {/* ========================================================
          TAB 3C: SUBJECT TEACHER VIRTUAL LAB & SCIENCE EXPERIMENTS
          ======================================================== */}
      {activeTab === 'virtual_lab' && (
        <section className="space-y-6">
          <VirtualLabWorkspace
            currentUser={currentUser}
            initialTab="demonstrations"
            isEmbedded={true}
          />
        </section>
      )}

      {/* ========================================================
          TAB 4: E-RESOURCES & E-LINKS (NOTES, AUDIOS, VIDEOS, IMAGES, E-LINKS)
          ======================================================== */}
      {activeTab === 'resources' && (
        <section className="space-y-6">
          {/* Header & Sub-Tab Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span>Subject Teacher E-Resources & Curated E-Links</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Publish and manage multimodal curriculum content (Lesson Notes, Audio Podcasts, Video Lessons, Pedagogical Diagrams & Images, and Curated E-Links) immediately accessible to CBC learners.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold font-mono">
                  Grade {defaultGrade} Teacher Rights
                </span>
              </div>
            </div>

            {/* 5-Channel Sub-tab Ribbon */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResourceSubTab('notes')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  resourceSubTab === 'notes'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>1. Lesson Notes ({existingNotes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceSubTab('audios')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  resourceSubTab === 'audios'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>2. Audio Lessons ({existingAudios.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceSubTab('videos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  resourceSubTab === 'videos'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>3. Video Lessons ({existingVideos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceSubTab('images')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  resourceSubTab === 'images'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>4. Diagrams & Images ({existingImages.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceSubTab('elinks')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  resourceSubTab === 'elinks'
                    ? 'bg-blue-700 text-white shadow-2xs ring-1 ring-blue-400'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>5. Curated E-Links</span>
              </button>
            </div>
          </div>

          {/* CHANNEL 1: LESSON NOTES */}
          {resourceSubTab === 'notes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Prepare & Publish Lesson Notes (Anti-Download Protected)</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Notes are securely stored in the learner workspace with copy/download prevention.
                </p>

                {noteSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Lesson note saved and immediately available to Grade {noteGrade} learners!</span>
                  </div>
                )}

                <form onSubmit={handleCreateNote} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Level</label>
                      <select
                        value={noteGrade}
                        onChange={(e) => {
                          const g = Number(e.target.value) as GradeLevel;
                          setNoteGrade(g);
                          setNoteSubject(getSubjectsForGrade(g)[0]);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      >
                        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                      <select
                        value={noteSubject}
                        onChange={(e) => setNoteSubject(e.target.value as SubjectName)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      >
                        {getSubjectsForGrade(noteGrade).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Note Title</label>
                    <input
                      type="text"
                      required
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="e.g. Decimals: Conversion from Tenths and Hundredths"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Executive Summary</label>
                    <input
                      type="text"
                      value={noteSummary}
                      onChange={(e) => setNoteSummary(e.target.value)}
                      placeholder="Brief 1-sentence overview of the concept"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Lesson Content (Markdown formatted, headings with ###)
                    </label>
                    <textarea
                      rows={6}
                      required
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="### 1. Introduction to Decimals&#10;A decimal number has a whole number part and a fractional part separated by a decimal point..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Key Revision Takeaway</label>
                    <input
                      type="text"
                      value={noteKeyTakeaway}
                      onChange={(e) => setNoteKeyTakeaway(e.target.value)}
                      placeholder="e.g. 1/10 is written as 0.1 and represents 1 part out of 10 equal parts."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Publish Lesson Note
                  </button>
                </form>
              </div>

              {/* Published Notes Roster */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Published Lesson Notes ({existingNotes.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {existingNotes.map((n) => (
                    <div key={n.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            Grade {n.grade} · {n.subject}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{n.createdAt}</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 mt-2 line-clamp-1">{n.title}</h5>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{n.summary}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">By {n.author}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(n.id)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHANNEL 2: AUDIO LESSONS */}
          {resourceSubTab === 'audios' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span>Publish Audio Lesson & Mental Math Podcast</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Streamable audio podcasts with accompanying transcripts and key revision checkpoints.
                </p>

                {audioSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Audio lesson saved and published for Grade {audioGrade} learners!</span>
                  </div>
                )}

                <form onSubmit={handleCreateAudio} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Level</label>
                      <select
                        value={audioGrade}
                        onChange={(e) => {
                          const g = Number(e.target.value) as GradeLevel;
                          setAudioGrade(g);
                          setAudioSubject(getSubjectsForGrade(g)[0]);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      >
                        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                      <select
                        value={audioSubject}
                        onChange={(e) => setAudioSubject(e.target.value as SubjectName)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      >
                        {getSubjectsForGrade(audioGrade).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={audioDuration}
                        onChange={(e) => setAudioDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Audio Lesson Title</label>
                    <input
                      type="text"
                      required
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      placeholder="e.g. Oral Pronunciation & Word Stress in Kiswahili Mashairi"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Audio Stream / MP3 URL</label>
                    <input
                      type="url"
                      required
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Key Listening Checkpoint</label>
                    <input
                      type="text"
                      value={audioKeyPoint}
                      onChange={(e) => setAudioKeyPoint(e.target.value)}
                      placeholder="e.g. Pay special attention to the syllable cadence at minute 03:15."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Audio Script / Transcript</label>
                    <textarea
                      rows={4}
                      value={audioTranscript}
                      onChange={(e) => setAudioTranscript(e.target.value)}
                      placeholder="Enter script text so learners can follow along as they listen..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Publish Audio Lesson
                  </button>
                </form>
              </div>

              {/* Published Audios Roster */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Published Audio Lessons ({existingAudios.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {existingAudios.map((a) => (
                    <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                            Grade {a.grade} · {a.subject}
                          </span>
                          <span className="text-[10px] text-teal-700 font-mono font-bold">{a.durationMinutes} mins</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 mt-2 line-clamp-1">{a.title}</h5>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 italic">"{a.transcript}"</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">By {a.teacherName}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAudio(a.id)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHANNEL 3: VIDEO LESSONS */}
          {resourceSubTab === 'videos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span>Publish Video Lesson & Whiteboard Stream</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Curate video demonstrations, KICD EduTV recordings, and animated concept explanations.
                </p>

                {videoSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Video lesson published for Grade {videoGrade} learners!</span>
                  </div>
                )}

                <form onSubmit={handleCreateVideo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Level</label>
                      <select
                        value={videoGrade}
                        onChange={(e) => {
                          const g = Number(e.target.value) as GradeLevel;
                          setVideoGrade(g);
                          setVideoSubject(getSubjectsForGrade(g)[0]);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      >
                        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                      <select
                        value={videoSubject}
                        onChange={(e) => setVideoSubject(e.target.value as SubjectName)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      >
                        {getSubjectsForGrade(videoGrade).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Video Lesson Title</label>
                    <input
                      type="text"
                      required
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="e.g. Science Experiment: Separation of Insoluble Solids by Filtration"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Video Stream / Embed URL</label>
                      <input
                        type="url"
                        required
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Thumbnail Cover Image URL</label>
                      <input
                        type="url"
                        value={videoThumbnail}
                        onChange={(e) => setVideoThumbnail(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Key Focus Point</label>
                    <input
                      type="text"
                      value={videoKeyPoint}
                      onChange={(e) => setVideoKeyPoint(e.target.value)}
                      placeholder="e.g. Note the cone angle and filter paper folding steps."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Publish Video Lesson
                  </button>
                </form>
              </div>

              {/* Published Videos Roster */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Published Video Lessons ({existingVideos.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {existingVideos.map((v) => (
                    <div key={v.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between">
                      {v.videoThumbnail && (
                        <div className="h-32 w-full bg-slate-900 relative overflow-hidden">
                          <img src={v.videoThumbnail} alt={v.title} className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono font-bold">
                            {v.durationMinutes}m
                          </span>
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Grade {v.grade} · {v.subject}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{v.createdAt}</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{v.title}</h5>
                        {v.keyPoints && v.keyPoints[0] && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">Focus: {v.keyPoints[0]}</p>
                        )}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">By {v.teacherName}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(v.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHANNEL 4: DIAGRAMS & IMAGES */}
          {resourceSubTab === 'images' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span>Publish Pedagogical Diagram, Chart or Infographic</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Visual learning materials, anatomical diagrams, maps, and flowchart infographics for CBC learners.
                </p>

                {imgSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Diagram asset published and available to Grade {imgGrade} learners!</span>
                  </div>
                )}

                <form onSubmit={handleCreateImage} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Level</label>
                      <select
                        value={imgGrade}
                        onChange={(e) => {
                          const g = Number(e.target.value) as GradeLevel;
                          setImgGrade(g);
                          setImgSubject(getSubjectsForGrade(g)[0]);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      >
                        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                      <select
                        value={imgSubject}
                        onChange={(e) => setImgSubject(e.target.value as SubjectName)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      >
                        {getSubjectsForGrade(imgGrade).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                      <select
                        value={imgCategory}
                        onChange={(e) => setImgCategory(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                      >
                        <option value="diagram">Anatomical / Technical Diagram</option>
                        <option value="chart">Data Chart / Graph</option>
                        <option value="infographic">Infographic Flowchart</option>
                        <option value="illustration">Curriculum Illustration</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Image / Diagram Title</label>
                    <input
                      type="text"
                      required
                      value={imgTitle}
                      onChange={(e) => setImgTitle(e.target.value)}
                      placeholder="e.g. Photosynthesis Light and Dark Phase Cycle Diagram"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Image Asset URL (Direct HTTPS)</label>
                    <input
                      type="url"
                      required
                      value={imgUrl}
                      onChange={(e) => setImgUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Caption & Concept Explanation</label>
                    <textarea
                      rows={3}
                      value={imgCaption}
                      onChange={(e) => setImgCaption(e.target.value)}
                      placeholder="Explain the diagram components and instructions for the learner..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      value={imgTags}
                      onChange={(e) => setImgTags(e.target.value)}
                      placeholder="Biology, Chloroplast, Sunlight, CBC"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  {imgUrl && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Asset Live Preview</div>
                      <div className="h-40 max-w-sm rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
                        <img src={imgUrl} alt="Preview" className="h-full w-auto object-contain" />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Publish Pedagogical Diagram
                  </button>
                </form>
              </div>

              {/* Published Images Roster */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Published Diagrams & Visual Assets ({existingImages.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingImages.map((img) => (
                    <div key={img.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between">
                      <div className="h-44 bg-slate-950 flex items-center justify-center p-2">
                        <img src={img.imageUrl} alt={img.title} className="max-h-full max-w-full object-contain rounded" />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                            {img.category || 'diagram'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Grade {img.grade}</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{img.title}</h5>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{img.caption}</p>
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">By {img.teacherName}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHANNEL 5: CURATED E-LINKS DIRECTORY (TEACHER RIGHTS: ADD, EDIT, REMOVE) */}
          {resourceSubTab === 'elinks' && (
            <div className="space-y-4">
              <ELinksDirectory
                currentUser={currentUser}
                canManage={true}
                title="Subject Teacher Curated E-Links Directory"
                subtitle="Teacher administrative rights: Add, edit, or remove verified online repositories, PhET simulations, KICD portals, and reference URLs directly accessible to learners."
                defaultFilterGrade={currentUser.grade}
              />
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          TAB 5: QUIZZES (AUTO-MARKING BUILDER & RESULTS)
          ======================================================== */}
      {activeTab === 'quizzes' && (
        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Topical Quiz Builder (Automatic Marking Engine)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Create multiple choice quizzes. When pupils submit, the system automatically marks answers, calculates scores and percentages, and determines pass/fail status.
            </p>

            {quizSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Quiz published with automatic marking enabled!</span>
              </div>
            )}

            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
                  <select
                    value={quizGrade}
                    onChange={(e) => {
                      const g = Number(e.target.value) as GradeLevel;
                      setQuizGrade(g);
                      setQuizSubject(getSubjectsForGrade(g)[0]);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  >
                    {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={quizSubject}
                    onChange={(e) => setQuizSubject(e.target.value as SubjectName)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  >
                    {getSubjectsForGrade(quizGrade).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pass Mark %</label>
                  <input
                    type="number"
                    value={quizPassPct}
                    onChange={(e) => setQuizPassPct(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Limit (Mins)</label>
                  <input
                    type="number"
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Mathematics: Decimals & Percentages Quiz"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
              </div>

              {/* Questions List preview */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Questions in this Quiz ({questionsList.length})</span>
                  <span className="text-emerald-700">Auto-Marked on Submission</span>
                </div>

                {questionsList.map((q, qIdx) => (
                  <div key={q.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-900">
                      {qIdx + 1}. {q.questionText}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Options: {q.options.join(' · ')} | Correct Answer: <strong>{q.options[q.correctOptionIndex]}</strong>
                    </div>
                  </div>
                ))}

                {/* Add new question card */}
                <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 space-y-3 mt-4">
                  <div className="text-xs font-bold text-slate-700">Add Question to Quiz:</div>
                  <input
                    type="text"
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="Enter question text (e.g. What is 3/4 of 20?)"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      value={newOpt0}
                      onChange={(e) => setNewOpt0(e.target.value)}
                      placeholder="Option A (e.g. 12)"
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={newOpt1}
                      onChange={(e) => setNewOpt1(e.target.value)}
                      placeholder="Option B (e.g. 15)"
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={newOpt2}
                      onChange={(e) => setNewOpt2(e.target.value)}
                      placeholder="Option C (e.g. 16)"
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={newOpt3}
                      onChange={(e) => setNewOpt3(e.target.value)}
                      placeholder="Option D (e.g. 18)"
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-700">Correct Option:</span>
                    {[0, 1, 2, 3].map((optNum) => (
                      <label key={optNum} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={newCorrectIdx === optNum}
                          onChange={() => setNewCorrectIdx(optNum)}
                        />
                        <span>Option {['A', 'B', 'C', 'D'][optNum]}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newExplanation}
                    onChange={(e) => setNewExplanation(e.target.value)}
                    placeholder="Explanation for automatic marking review..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuestionToQuiz}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200"
                  >
                    + Add Question to List
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Save & Publish Quiz
              </button>
            </form>
          </div>

          {/* Student attempts overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Student Quiz Performance Log ({quizAttempts.length} Total Submissions)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Grade & Stream</th>
                    <th className="py-2.5 px-3">Quiz Title</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-center">Percentage</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quizAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{att.studentName}</td>
                      <td className="py-2 px-3 text-slate-600">Grade {att.grade} ({att.stream})</td>
                      <td className="py-2 px-3 text-slate-700">{att.quizTitle}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                        {att.score} / {att.totalQuestions}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">
                        {att.percentage}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                            att.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {att.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{att.completedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          AUX TAB: VIRTUAL CLASS GOOGLE MEET
          ======================================================== */}
      {activeTab === 'virtual_class' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Start Virtual Class (Google Meet Room)
              </h2>
              <p className="text-xs text-slate-500">
                Launch your real-time video classroom, invite learners, and teach virtually.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-800">Google Meet Integrated</span>
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Virtual Lesson Topic
              </label>
              <input
                type="text"
                value={meetTopicInput}
                onChange={(e) => setMeetTopicInput(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Meet Room URL
              </label>
              <input
                type="text"
                value={meetLinkInput}
                onChange={(e) => setMeetLinkInput(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-blue-700"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={meetLinkInput}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMeetLiveActive(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Start Google Meet Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  setReminderTitle(`Live Class Alert: ${meetTopicInput}`);
                  setReminderContent(`All learners are requested to join the active Google Meet session.`);
                  setReminderMeetLink(meetLinkInput);
                  setActiveTab('reminders');
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                Broadcast Join Alert
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          AUX TAB: POST & MANAGE CLASS TIMETABLE
          ======================================================== */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          {/* Library Room Booking Callout */}
          <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-purple-950 text-sm">Need a Special Learning Venue? Book a Library Space</span>
                <p className="text-[11px] text-purple-800 mt-0.5">
                  Reserve the Main Reading Hall, AV Suite, or CBC Seminar Rooms for your class. Available exclusively on spots without scheduled library lessons.
                </p>
              </div>
            </div>
            <LibraryRoomBookingButton 
              currentUser={currentUser} 
              variant="hero" 
              label="Book Library Room Spot" 
            />
          </div>

          <TimetablePortal
            currentUser={currentUser}
            initialGrade={defaultGrade}
            initialStream={defaultStream}
          />
        </div>
      )}

      {/* ========================================================
          AUX TAB: LIBRARY ROOM BOOKING
          ======================================================== */}
      {activeTab === 'library_booking' && (
        <section className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-semibold mb-2">
                <DoorOpen className="w-3.5 h-3.5" />
                <span>CBC Faculty Facility Reservation</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Subject Teacher Library Room Booking
              </h2>
              <p className="text-purple-200/80 text-xs mt-1 max-w-xl">
                Reserve the Library Reading Hall, Digital Research & AV Suite, or Discussion Rooms for your class lessons, revision groups, or digital practicals. Bookings are permitted exclusively on spots without scheduled class library lessons.
              </p>
            </div>

            <LibraryRoomBookingButton 
              currentUser={currentUser} 
              variant="hero" 
              label="Book Library Room Now" 
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Interactive Room Booking Console & Timetable Spot Checker
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant collision detection checks both curriculum library lessons and confirmed reservations.
                </p>
              </div>

              <LibraryRoomBookingButton 
                currentUser={currentUser} 
                variant="outline" 
                label="Launch Full Booking Matrix" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
                <div className="font-bold text-xs text-purple-900 uppercase tracking-wider">1. Select Venue & Period</div>
                <p className="text-xs text-purple-800 mt-1">
                  Choose from 5 library venues including the Digital AV Lab and Collaborative Seminar Rooms across Periods 1 to 9.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="font-bold text-xs text-emerald-900 uppercase tracking-wider">2. Automated Spot Verification</div>
                <p className="text-xs text-emerald-800 mt-1">
                  System strictly locks spots with scheduled curriculum library reading lessons. Only vacant spots can be reserved.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
                <div className="font-bold text-xs text-indigo-900 uppercase tracking-wider">3. Instant Entry Pass</div>
                <p className="text-xs text-indigo-800 mt-1">
                  Get a confirmed booking reference (e.g. LRB-2026-X) logged directly in the school library audit ledger.
                </p>
              </div>
            </div>

            <div className="pt-4 text-center">
              <LibraryRoomBookingButton 
                currentUser={currentUser} 
                variant="hero" 
                label="Open Booking Modal & View Spots" 
              />
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          AUX TAB: LESSON REMINDERS
          ======================================================== */}
      {activeTab === 'reminders' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Set Lesson Reminders to Learners
            </h2>
            <p className="text-xs text-slate-500">
              Broadcast high-priority lesson reminders directly into the learner workspace announcements panel.
            </p>
          </div>

          {reminderSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Reminder published! Learners will see this under Announcements.</span>
            </div>
          )}

          <form onSubmit={handleBroadcastReminder} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reminder Headline
              </label>
              <input
                type="text"
                required
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="e.g. Mathematics Live Google Meet Lesson at 10:00 AM"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Message
              </label>
              <textarea
                rows={3}
                required
                value={reminderContent}
                onChange={(e) => setReminderContent(e.target.value)}
                placeholder="Remind students what books, geometry sets, or homework to prepare..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Time</label>
                <input
                  type="text"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  placeholder="Today at 10:00 AM"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Google Meet Link (Optional)</label>
                <input
                  type="text"
                  value={reminderMeetLink}
                  onChange={(e) => setReminderMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/edu-gr4-dove"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-blue-700"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Broadcast Lesson Reminder</span>
            </button>
          </form>
        </section>
      )}

      {/* ========================================================
          REPORTING HUB: MONTHLY, TERMLY & ANNUAL SUMMARIES
          ======================================================== */}
      {activeTab === 'reporting_hub' && (
        <ReportingHub currentUser={currentUser} />
      )}
        </main>
      </div>
    </div>
  );
};
