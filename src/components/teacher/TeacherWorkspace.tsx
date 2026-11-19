import React, { useState } from 'react';
import { 
  User, 
  UserRole,
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
import { ClientDataStore } from '../../utils/clientDataStore';
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
import { OwnStaffAppraisal } from '../admin/TeacherAppraisalPages';
import { TeacherAbsenceReportModal } from '../timetable/TeacherAbsenceReportModal';
import { StudentStreamManager } from './StudentStreamManager';
import { TeacherLessonFileManager } from './TeacherLessonFileManager';
import { TeacherSubjectChatInbox } from './TeacherSubjectChatInbox';
import { SubjectTeacherVirtualLessonsPanel } from '../virtual-classroom/SubjectTeacherVirtualLessonsPanel';
import { TeacherLibraryPortal } from '../library/TeacherLibraryPortal';
import { canDeleteEResource } from '../../utils/resourcePermissions';
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
  ShieldAlert,
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
  Laptop,
  Atom,
  MessageSquare,
  Upload,
  X,
  Loader2,
  Library,
  Lock
} from 'lucide-react';
import { ScienceViewerModal } from '../virtuallab/ScienceViewerModal';
import {
  canAccessStudentStreamAllocation,
  getAdministrativeRoleShortName,
} from '../../utils/subjectTeacherSwitch';
import {
  canAccessTeacherLabs,
  getAllowedGradesForTeacher,
  getAllowedStreamsForGrade,
  getAllowedSubjectsForGradeStream,
  getTeacherAssignedSubjects,
  isTeacherAssignedToTarget,
} from '../../utils/teacherAssignmentScope';

interface TeacherWorkspaceProps {
  currentUser: User;
  switchedFromRole?: UserRole;
  onReturnToAdminWorkspace?: () => void;
}

type TeacherTab = 
  | 'cbc_results'
  | 'staff_appraisal'
  | 'work_entry' 
  | 'gate_exit' 
  | 'class_register'
  | 'stream_management'
  | 'lunch_register'
  | 'assignments' 
  | 'computer_lab'
  | 'virtual_lab'
  | 'resources' 
  | 'lesson_files'
  | 'subject_chats'
  | 'quizzes'
  | 'virtual_class'
  | 'timetable'
  | 'library_contents'
  | 'library_booking'
  | 'reminders'
  | 'reporting_hub';

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({
  currentUser,
  switchedFromRole,
  onReturnToAdminWorkspace,
}) => {
  const isClassTeacher = currentUser.role === 'class_teacher';
  const defaultGrade = currentUser.grade || 4;
  const defaultStream = currentUser.stream || 'Dove';

  const [activeTab, setActiveTab] = useState<TeacherTab>(
    isClassTeacher ? 'class_register' : 'work_entry'
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [allocationRevision, setAllocationRevision] = useState(0);

  React.useEffect(() => {
    const bumpRevision = () => setAllocationRevision((v) => v + 1);
    window.addEventListener('users-updated', bumpRevision);
    window.addEventListener('edusmart:data-changed', bumpRevision);
    return () => {
      window.removeEventListener('users-updated', bumpRevision);
      window.removeEventListener('edusmart:data-changed', bumpRevision);
    };
  }, []);

  const hasLabAccess = React.useMemo(
    () => canAccessTeacherLabs(currentUser),
    [currentUser, allocationRevision]
  );
  const canAllocateStreams = React.useMemo(
    () => canAccessStudentStreamAllocation(currentUser),
    [currentUser, allocationRevision]
  );
  const teacherAssignedSubjects = React.useMemo(
    () => getTeacherAssignedSubjects(currentUser),
    [currentUser, allocationRevision]
  );
  const allowedAsgGrades = React.useMemo(
    () => getAllowedGradesForTeacher(currentUser),
    [currentUser, allocationRevision]
  );

  // If lab access or stream allocation access is revoked or unavailable, never remain on restricted tabs
  React.useEffect(() => {
    if (!hasLabAccess && (activeTab === 'computer_lab' || activeTab === 'virtual_lab')) {
      setActiveTab(isClassTeacher ? 'class_register' : 'work_entry');
    }
    if (!canAllocateStreams && activeTab === 'stream_management') {
      setActiveTab(isClassTeacher ? 'class_register' : 'work_entry');
    }
  }, [hasLabAccess, canAllocateStreams, activeTab, isClassTeacher]);

  // Handle direct tab navigation from notification items
  React.useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (tab) {
        if (['cbc_results', 'work_entry', 'gate_exit', 'class_register', 'assignments', 'resources', 'quizzes', 'virtual_class', 'timetable', 'library_contents', 'library_booking', 'reminders', 'reporting_hub', 'lunch_register'].includes(tab)) {
          setActiveTab(tab as TeacherTab);
        } else if (tab === 'library') {
          setActiveTab('library_contents');
        } else if (tab === 'computer_lab' || tab === 'scratch' || tab === 'cs_lab' || tab === 'coding') {
          if (canAccessTeacherLabs(currentUser)) {
            setActiveTab('computer_lab');
          }
        } else if (tab === 'virtual_lab' || tab === 'vlab' || tab === 'virtuallab' || tab === 'science_lab') {
          if (canAccessTeacherLabs(currentUser)) {
            setActiveTab('virtual_lab');
          }
        } else if (tab === 'results' || tab === 'assessments' || tab === 'gradebook' || tab === 'marks') {
          setActiveTab('cbc_results');
        } else if (tab === 'attendance' || tab === 'register' || tab === 'roll_call') {
          setActiveTab('class_register');
        } else if (tab === 'work_entries' || tab === 'work_entry') {
          setActiveTab('work_entry');
        } else if (tab === 'report' || tab === 'reports' || tab === 'reporting') {
          setActiveTab('reporting_hub');
        } else if (tab === 'stream_management' || tab === 'student_stream_allocation') {
          if (canAccessStudentStreamAllocation(currentUser)) {
            setActiveTab('stream_management');
          }
        } else if (tab === 'notes' || tab === 'videos' || tab === 'audio') {
          setActiveTab('resources');
        }
      }
    };
    window.addEventListener('workspace-nav-tab', handleNavEvent);
    return () => window.removeEventListener('workspace-nav-tab', handleNavEvent);
  }, [currentUser]);

  // CBC Science Explorer Modal State
  const [showScienceModal, setShowScienceModal] = useState(false);

  // Assignment Creation Form State (strictly bounded to assigned grades/streams/subjects)
  const initialAsgGrade = (allowedAsgGrades[0] || defaultGrade) as GradeLevel;
  const initialAsgStreams = getAllowedStreamsForGrade(currentUser, initialAsgGrade);
  const initialAsgStream = (initialAsgStreams[0] || defaultStream) as StreamName;
  const initialAsgSubjects = getAllowedSubjectsForGradeStream(currentUser, initialAsgGrade, initialAsgStream);
  const initialAsgSubject = (initialAsgSubjects[0] || teacherAssignedSubjects[0] || getSubjectsForGrade(initialAsgGrade)[0]) as SubjectName;

  const [asgTitle, setAsgTitle] = useState('');
  const [asgGrade, setAsgGrade] = useState<GradeLevel>(initialAsgGrade);
  const [asgStream, setAsgStream] = useState<StreamName>(initialAsgStream);
  const [asgSubject, setAsgSubject] = useState<SubjectName>(initialAsgSubject);
  const [asgInstructions, setAsgInstructions] = useState('');
  const [asgDueDate, setAsgDueDate] = useState('2026-10-10');
  const [asgMaxScore, setAsgMaxScore] = useState<number>(20);
  const [asgSuccess, setAsgSuccess] = useState(false);
  const [asgError, setAsgError] = useState<string | null>(null);

  const allowedAsgStreams = React.useMemo(
    () => getAllowedStreamsForGrade(currentUser, asgGrade),
    [currentUser, asgGrade, allocationRevision]
  );
  const allowedAsgSubjects = React.useMemo(
    () => getAllowedSubjectsForGradeStream(currentUser, asgGrade, asgStream),
    [currentUser, asgGrade, asgStream, allocationRevision]
  );

  // Keep selected Grade / Stream / Subject locked inside teacher's assigned scope
  React.useEffect(() => {
    if (allowedAsgGrades.length === 0) return;
    const nextGrade = allowedAsgGrades.includes(asgGrade) ? asgGrade : allowedAsgGrades[0];
    if (nextGrade !== asgGrade) {
      setAsgGrade(nextGrade);
      return;
    }
    const streamsForGrade = getAllowedStreamsForGrade(currentUser, nextGrade);
    if (streamsForGrade.length === 0) return;
    const nextStream = streamsForGrade.includes(asgStream) ? asgStream : streamsForGrade[0];
    if (nextStream !== asgStream) {
      setAsgStream(nextStream);
      return;
    }
    const subjectsForPair = getAllowedSubjectsForGradeStream(currentUser, nextGrade, nextStream);
    if (subjectsForPair.length > 0 && !subjectsForPair.includes(asgSubject)) {
      setAsgSubject(subjectsForPair[0]);
    }
  }, [currentUser, allocationRevision, allowedAsgGrades, asgGrade, asgStream, asgSubject]);

  // Resource Sub-Tab (Notes, Audios, Videos, Images, E-Links)
  const [resourceSubTab, setResourceSubTab] = useState<'notes' | 'audios' | 'videos' | 'images' | 'elinks'>('notes');

  // Lesson Note Creation Form State (with optional PDF Document device upload)
  const [noteTitle, setNoteTitle] = useState('');
  const [noteGrade, setNoteGrade] = useState<GradeLevel>(defaultGrade);
  const [noteSubject, setNoteSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [noteSummary, setNoteSummary] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteKeyTakeaway, setNoteKeyTakeaway] = useState('');
  const [notePdfUrl, setNotePdfUrl] = useState('');
  const [notePdfName, setNotePdfName] = useState('');
  const [notePdfMime, setNotePdfMime] = useState('');
  const [notePdfSize, setNotePdfSize] = useState('');
  const [noteSuccess, setNoteSuccess] = useState(false);

  // Audio Lesson Form State (supports direct audio upload from device)
  const [audioTitle, setAudioTitle] = useState('');
  const [audioGrade, setAudioGrade] = useState<GradeLevel>(defaultGrade);
  const [audioSubject, setAudioSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [audioDuration, setAudioDuration] = useState<number>(10);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFileName, setAudioFileName] = useState('');
  const [audioMimeType, setAudioMimeType] = useState('');
  const [audioFileSize, setAudioFileSize] = useState('');
  const [audioTranscript, setAudioTranscript] = useState('');
  const [audioKeyPoint, setAudioKeyPoint] = useState('');
  const [audioSuccess, setAudioSuccess] = useState(false);

  // Video Lesson Form State (supports direct video + thumbnail picture upload from device)
  const [videoTitle, setVideoTitle] = useState('');
  const [videoGrade, setVideoGrade] = useState<GradeLevel>(defaultGrade);
  const [videoSubject, setVideoSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [videoDuration, setVideoDuration] = useState<number>(15);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [videoMimeType, setVideoMimeType] = useState('');
  const [videoFileSize, setVideoFileSize] = useState('');
  const [videoKeyPoint, setVideoKeyPoint] = useState('');
  const [videoSuccess, setVideoSuccess] = useState(false);

  // Lesson Image / Pedagogical Diagram / Picture Form State (supports direct image/picture upload from device)
  const [imgTitle, setImgTitle] = useState('');
  const [imgGrade, setImgGrade] = useState<GradeLevel>(defaultGrade);
  const [imgSubject, setImgSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [imgUrl, setImgUrl] = useState('');
  const [imgFileName, setImgFileName] = useState('');
  const [imgMimeType, setImgMimeType] = useState('');
  const [imgFileSize, setImgFileSize] = useState('');
  const [imgCaption, setImgCaption] = useState('');
  const [imgCategory, setImgCategory] = useState<'diagram' | 'chart' | 'infographic' | 'illustration'>('diagram');
  const [imgTags, setImgTags] = useState('CBC, Revision, Curriculum');
  const [imgSuccess, setImgSuccess] = useState(false);

  // Device Upload Progress & Error State across E-Resource Channels
  const [uploadingResource, setUploadingResource] = useState<
    'note_pdf' | 'audio' | 'video' | 'video_thumb' | 'image' | null
  >(null);
  const [resourceUploadError, setResourceUploadError] = useState<string | null>(null);

  const formatFileSizeLabel = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const titleFromFileName = (name: string): string => {
    const clean = name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : '';
  };

  const detectMediaMinutes = (file: File, kind: 'audio' | 'video'): Promise<number | null> =>
    new Promise((resolve) => {
      try {
        const objUrl = URL.createObjectURL(file);
        const media = document.createElement(kind);
        media.preload = 'metadata';
        media.onloadedmetadata = () => {
          const mins = Number.isFinite(media.duration) && media.duration > 0
            ? Math.max(1, Math.round(media.duration / 60))
            : null;
          URL.revokeObjectURL(objUrl);
          resolve(mins);
        };
        media.onerror = () => {
          URL.revokeObjectURL(objUrl);
          resolve(null);
        };
        media.src = objUrl;
      } catch {
        resolve(null);
      }
    });

  const handleUploadNotePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setResourceUploadError(null);
    setUploadingResource('note_pdf');
    try {
      const uploaded = await ClientDataStore.uploadFile(file, 'e-resource-pdf');
      setNotePdfUrl(uploaded.url);
      setNotePdfName(file.name);
      setNotePdfMime(uploaded.mimeType || file.type || 'application/pdf');
      setNotePdfSize(formatFileSizeLabel(file.size));
      if (!noteTitle.trim()) {
        setNoteTitle(titleFromFileName(file.name));
      }
    } catch (err: any) {
      setResourceUploadError(err?.message || 'Failed to upload PDF document from device.');
    } finally {
      setUploadingResource(null);
    }
  };

  const handleUploadAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setResourceUploadError(null);
    setUploadingResource('audio');
    try {
      const detectedMins = await detectMediaMinutes(file, 'audio');
      const uploaded = await ClientDataStore.uploadFile(file, 'e-resource-audio');
      setAudioUrl(uploaded.url);
      setAudioFileName(file.name);
      setAudioMimeType(uploaded.mimeType || file.type || 'audio/mpeg');
      setAudioFileSize(formatFileSizeLabel(file.size));
      if (detectedMins) setAudioDuration(detectedMins);
      if (!audioTitle.trim()) {
        setAudioTitle(titleFromFileName(file.name));
      }
    } catch (err: any) {
      setResourceUploadError(err?.message || 'Failed to upload audio file from device.');
    } finally {
      setUploadingResource(null);
    }
  };

  const handleUploadVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setResourceUploadError(null);
    setUploadingResource('video');
    try {
      const detectedMins = await detectMediaMinutes(file, 'video');
      const uploaded = await ClientDataStore.uploadFile(file, 'e-resource-video');
      setVideoUrl(uploaded.url);
      setVideoFileName(file.name);
      setVideoMimeType(uploaded.mimeType || file.type || 'video/mp4');
      setVideoFileSize(formatFileSizeLabel(file.size));
      if (detectedMins) setVideoDuration(detectedMins);
      if (!videoTitle.trim()) {
        setVideoTitle(titleFromFileName(file.name));
      }
    } catch (err: any) {
      setResourceUploadError(err?.message || 'Failed to upload video file from device.');
    } finally {
      setUploadingResource(null);
    }
  };

  const handleUploadVideoThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setResourceUploadError(null);
    setUploadingResource('video_thumb');
    try {
      const uploaded = await ClientDataStore.uploadFile(file, 'e-resource-thumbnail');
      setVideoThumbnail(uploaded.url);
    } catch (err: any) {
      setResourceUploadError(err?.message || 'Failed to upload thumbnail image from device.');
    } finally {
      setUploadingResource(null);
    }
  };

  const handleUploadLessonImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setResourceUploadError(null);
    setUploadingResource('image');
    try {
      const uploaded = await ClientDataStore.uploadFile(file, 'e-resource-image');
      setImgUrl(uploaded.url);
      setImgFileName(file.name);
      setImgMimeType(uploaded.mimeType || file.type || 'image/jpeg');
      setImgFileSize(formatFileSizeLabel(file.size));
      if (!imgTitle.trim()) {
        setImgTitle(titleFromFileName(file.name));
      }
    } catch (err: any) {
      setResourceUploadError(err?.message || 'Failed to upload image/picture from device.');
    } finally {
      setUploadingResource(null);
    }
  };

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

  // Quiz Builder State (strictly bounded to assigned grades/streams/subjects)
  const [quizTitle, setQuizTitle] = useState('');
  const [quizGrade, setQuizGrade] = useState<GradeLevel>(initialAsgGrade);
  const [quizStream, setQuizStream] = useState<StreamName>(initialAsgStream);
  const [quizSubject, setQuizSubject] = useState<SubjectName>(initialAsgSubject);
  const [quizPassPct, setQuizPassPct] = useState<number>(70);
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(10);
  const [quizError, setQuizError] = useState<string | null>(null);
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

  const allowedQuizStreams = React.useMemo(
    () => getAllowedStreamsForGrade(currentUser, quizGrade),
    [currentUser, quizGrade, allocationRevision]
  );
  const allowedQuizSubjects = React.useMemo(
    () => getAllowedSubjectsForGradeStream(currentUser, quizGrade, quizStream),
    [currentUser, quizGrade, quizStream, allocationRevision]
  );

  // Keep Topical Quiz Grade / Stream / Subject locked strictly inside teacher's assigned scope
  React.useEffect(() => {
    if (allowedAsgGrades.length === 0) return;
    const nextGrade = allowedAsgGrades.includes(quizGrade) ? quizGrade : allowedAsgGrades[0];
    if (nextGrade !== quizGrade) {
      setQuizGrade(nextGrade);
      return;
    }
    const streamsForGrade = getAllowedStreamsForGrade(currentUser, nextGrade);
    if (streamsForGrade.length === 0) return;
    const nextStream = streamsForGrade.includes(quizStream) ? quizStream : streamsForGrade[0];
    if (nextStream !== quizStream) {
      setQuizStream(nextStream);
      return;
    }
    const subjectsForPair = getAllowedSubjectsForGradeStream(currentUser, nextGrade, nextStream);
    if (subjectsForPair.length > 0 && !subjectsForPair.includes(quizSubject)) {
      setQuizSubject(subjectsForPair[0]);
    }
  }, [currentUser, allocationRevision, allowedAsgGrades, quizGrade, quizStream, quizSubject]);

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

  // Load existing records (strictly scoped to this teacher's assigned classes & subjects)
  const [workLogs, setWorkLogs] = useState<WorkEntryLog[]>(() => Storage.getWorkEntryLogs(currentUser.id));
  const gatePasses = Storage.getGatePasses();
  const assignments = Storage.getAssignments().filter((a) =>
    isTeacherAssignedToTarget(currentUser, a.grade, a.stream, a.subject)
  );
  const quizzes = Storage.getQuizzes().filter((q) =>
    isTeacherAssignedToTarget(currentUser, q.grade, q.stream, q.subject)
  );
  const quizAttempts = Storage.getQuizAttempts().filter((att) =>
    isTeacherAssignedToTarget(currentUser, att.grade, att.stream, att.subject)
  );

  // Handlers
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setAsgError(null);
    if (!asgTitle || !asgInstructions) return;

    if (!isTeacherAssignedToTarget(currentUser, asgGrade, asgStream, asgSubject)) {
      setAsgError(
        `Access Restricted: You can only assign homework or assignments to classes and subjects assigned to your profile (attempted Grade ${asgGrade} ${asgStream} — ${asgSubject}).`
      );
      return;
    }

    const newAsg: Assignment = {
      id: `asg-${Date.now()}`,
      grade: asgGrade,
      stream: asgStream,
      subject: asgSubject,
      title: asgTitle,
      instructions: asgInstructions,
      dueDate: asgDueDate,
      maxScore: Number(maxScoreSafe(asgMaxScore)),
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

  function maxScoreSafe(val: number): number {
    const n = Number(val);
    return Number.isFinite(n) && n > 0 ? n : 20;
  }

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    setResourceUploadError(null);
    if (!noteTitle.trim()) return;
    if (!noteContent.trim() && !notePdfUrl) {
      setResourceUploadError('Please enter written lesson notes or upload a PDF document from your device.');
      return;
    }

    const newNote: LessonNote = {
      id: `note-${Date.now()}`,
      topicId: `top-custom-${Date.now()}`,
      grade: noteGrade,
      subject: noteSubject,
      title: noteTitle.trim(),
      summary: noteSummary.trim() || (notePdfName ? `PDF Document: ${notePdfName}` : 'Comprehensive classroom study note.'),
      content: noteContent.trim() || (notePdfName ? `Study the attached PDF document (${notePdfName}) carefully.` : ''),
      keyTakeaways: noteKeyTakeaway.trim() ? [noteKeyTakeaway.trim()] : ['Review all concepts thoroughly before topical quiz.'],
      documentUrl: notePdfUrl || undefined,
      documentName: notePdfName || undefined,
      documentMimeType: notePdfMime || undefined,
      documentSize: notePdfSize || undefined,
      author: currentUser.name,
      uploadedById: currentUser.id,
      createdAt: new Date().toISOString().split('T')[0]
    };

    Storage.addNote(newNote);
    setExistingNotes(Storage.getNotes());
    setNoteSuccess(true);
    setNoteTitle('');
    setNoteSummary('');
    setNoteContent('');
    setNoteKeyTakeaway('');
    setNotePdfUrl('');
    setNotePdfName('');
    setNotePdfMime('');
    setNotePdfSize('');
    setTimeout(() => setNoteSuccess(false), 3000);
  };

  const handleDeleteNote = (id: string) => {
    const target = existingNotes.find((n) => n.id === id);
    if (!target || !canDeleteEResource(currentUser, target)) {
      setResourceUploadError('Only the user who uploaded this E-resource or the System Administrator may delete it.');
      return;
    }
    Storage.deleteNote(id);
    setExistingNotes(Storage.getNotes());
  };

  const handleCreateAudio = (e: React.FormEvent) => {
    e.preventDefault();
    setResourceUploadError(null);
    if (!audioTitle.trim()) return;
    if (!audioUrl.trim()) {
      setResourceUploadError('Please upload an audio file from your device or paste an audio URL.');
      return;
    }

    const newAudio: AudioLesson = {
      id: `aud-${Date.now()}`,
      topicId: `top-custom-${Date.now()}`,
      grade: audioGrade,
      subject: audioSubject,
      title: audioTitle.trim(),
      durationMinutes: Number(audioDuration) || 10,
      audioUrl: audioUrl.trim(),
      fileName: audioFileName || undefined,
      mimeType: audioMimeType || undefined,
      fileSize: audioFileSize || undefined,
      transcript: audioTranscript.trim() || 'Comprehensive CBC audio lesson for student revision.',
      keyPoints: audioKeyPoint.trim() ? [audioKeyPoint.trim()] : ['Listen attentively and note down key curriculum concepts.'],
      teacherName: currentUser.name,
      uploadedById: currentUser.id,
      createdAt: new Date().toISOString().split('T')[0]
    };

    Storage.addAudio(newAudio);
    setExistingAudios(Storage.getAudios());
    setAudioSuccess(true);
    setAudioTitle('');
    setAudioUrl('');
    setAudioFileName('');
    setAudioMimeType('');
    setAudioFileSize('');
    setAudioTranscript('');
    setAudioKeyPoint('');
    setTimeout(() => setAudioSuccess(false), 3000);
  };

  const handleDeleteAudio = (id: string) => {
    const target = existingAudios.find((a) => a.id === id);
    if (!target || !canDeleteEResource(currentUser, target)) {
      setResourceUploadError('Only the user who uploaded this E-resource or the System Administrator may delete it.');
      return;
    }
    Storage.deleteAudio(id);
    setExistingAudios(Storage.getAudios());
  };

  const handleCreateVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setResourceUploadError(null);
    if (!videoTitle.trim()) return;
    if (!videoUrl.trim()) {
      setResourceUploadError('Please upload a video file from your device or enter a video URL.');
      return;
    }

    const newVideo: VideoLesson = {
      id: `vid-${Date.now()}`,
      topicId: `top-custom-${Date.now()}`,
      grade: videoGrade,
      subject: videoSubject,
      title: videoTitle.trim(),
      durationMinutes: Number(videoDuration) || 15,
      videoUrl: videoUrl.trim(),
      videoThumbnail: videoThumbnail.trim() || undefined,
      fileName: videoFileName || undefined,
      mimeType: videoMimeType || undefined,
      fileSize: videoFileSize || undefined,
      keyPoints: videoKeyPoint.trim() ? [videoKeyPoint.trim()] : ['Observe the demonstrated steps and apply in your homework exercise.'],
      teacherName: currentUser.name,
      uploadedById: currentUser.id,
      createdAt: new Date().toISOString().split('T')[0]
    };

    Storage.addVideo(newVideo);
    setExistingVideos(Storage.getVideos());
    setVideoSuccess(true);
    setVideoTitle('');
    setVideoUrl('');
    setVideoThumbnail('');
    setVideoFileName('');
    setVideoMimeType('');
    setVideoFileSize('');
    setVideoKeyPoint('');
    setTimeout(() => setVideoSuccess(false), 3000);
  };

  const handleDeleteVideo = (id: string) => {
    const target = existingVideos.find((v) => v.id === id);
    if (!target || !canDeleteEResource(currentUser, target)) {
      setResourceUploadError('Only the user who uploaded this E-resource or the System Administrator may delete it.');
      return;
    }
    Storage.deleteVideo(id);
    setExistingVideos(Storage.getVideos());
  };

  const handleCreateImage = (e: React.FormEvent) => {
    e.preventDefault();
    setResourceUploadError(null);
    if (!imgTitle.trim()) return;
    if (!imgUrl.trim()) {
      setResourceUploadError('Please upload an image/picture from your device or enter an image URL.');
      return;
    }

    const tagsArray = imgTags.split(',').map(t => t.trim()).filter(Boolean);
    const newImg: LessonImage = {
      id: `img-${Date.now()}`,
      topicId: `top-custom-${Date.now()}`,
      grade: imgGrade,
      subject: imgSubject,
      title: imgTitle.trim(),
      imageUrl: imgUrl.trim(),
      fileName: imgFileName || undefined,
      mimeType: imgMimeType || undefined,
      fileSize: imgFileSize || undefined,
      caption: imgCaption.trim() || 'Visual pedagogical demonstration image/picture for CBC curriculum learners.',
      category: imgCategory,
      tags: tagsArray.length > 0 ? tagsArray : ['Diagram', 'Picture', 'Visuals'],
      teacherName: currentUser.name,
      uploadedById: currentUser.id,
      createdAt: new Date().toISOString().split('T')[0]
    };

    Storage.addLessonImage(newImg);
    setExistingImages(Storage.getLessonImages());
    setImgSuccess(true);
    setImgTitle('');
    setImgUrl('');
    setImgFileName('');
    setImgMimeType('');
    setImgFileSize('');
    setImgCaption('');
    setTimeout(() => setImgSuccess(false), 3000);
  };

  const handleDeleteImage = (id: string) => {
    const target = existingImages.find((img) => img.id === id);
    if (!target || !canDeleteEResource(currentUser, target)) {
      setResourceUploadError('Only the user who uploaded this E-resource or the System Administrator may delete it.');
      return;
    }
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
    setQuizError(null);
    if (!quizTitle || questionsList.length === 0) return;

    if (!isTeacherAssignedToTarget(currentUser, quizGrade, quizStream, quizSubject)) {
      setQuizError(
        `Access Restricted: You can only assign topical quizzes to classes, streams, and subjects assigned to your profile (attempted Grade ${quizGrade} ${quizStream} — ${quizSubject}).`
      );
      return;
    }

    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      topicId: `top-custom-${Date.now()}`,
      grade: quizGrade,
      stream: quizStream,
      subject: quizSubject,
      title: quizTitle,
      passPercentage: Number(quizPassPct),
      timeLimitMinutes: Number(quizTimeLimit),
      teacherName: currentUser.name,
      teacherId: currentUser.id,
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
        ...(canAllocateStreams
          ? [{ id: 'stream_management' as TeacherTab, label: '3. Student Stream Allocations', icon: Users, badge: 'CBC Streams', badgeColor: 'bg-blue-600' }]
          : []),
        ...(isClassTeacher ? [{ id: 'lunch_register' as TeacherTab, label: '4. Learner Lunch Register', icon: Utensils, badge: 'Class Teacher' }] : []),
        { id: 'cbc_results', label: '5. CBC Assessment Results', icon: Award, badge: 'Marks / Entry', badgeColor: 'bg-emerald-600' }
      ]
    },
    {
      title: 'LEARNING & TASKS',
      items: [
        { id: 'assignments', label: '6. Homework Assignments', icon: BookOpen },
        { id: 'lesson_files' as TeacherTab, label: '6b. CBC Lesson File Manager', icon: FolderTree, badge: 'PDFs & Images', badgeColor: 'bg-teal-600' },
        { id: 'subject_chats' as TeacherTab, label: '6c. Student Subject Inquiries', icon: MessageSquare, badge: 'Live Q&A', badgeColor: 'bg-indigo-600' },
        ...(hasLabAccess
          ? [
              { id: 'computer_lab' as TeacherTab, label: '7. Computer Laboratory', icon: Laptop, badge: 'CS & Scratch', badgeColor: 'bg-indigo-600' },
              { id: 'virtual_lab' as TeacherTab, label: '7b. Virtual Laboratory', icon: FlaskConical, badge: 'Integrated Science', badgeColor: 'bg-emerald-600' },
            ]
          : []),
        { id: 'quizzes', label: '8. CBC Topical Quizzes', icon: CheckSquare },
        { id: 'resources', label: '9. Curriculum Resources & Links', icon: FolderTree },
        { id: 'library_contents', label: '9b. School Library Contents', icon: Library, badge: 'Books & Digital', badgeColor: 'bg-purple-600' },
        { id: 'virtual_class', label: '10. Virtual Classrooms (LiveKit)', icon: Video }
      ]
    },
    {
      title: 'TIMETABLE & GOVERNANCE',
      items: [
        { id: 'staff_appraisal', label: '11. My Appraisal (TSC TPAD)', icon: Award, badge: 'TPAD' },
        { id: 'timetable', label: '12. Teaching Timetable', icon: Calendar },
        { id: 'library_booking', label: '12b. Library Room Booking', icon: DoorOpen, badge: 'Vacant Spots', badgeColor: 'bg-purple-600' },
        { id: 'gate_exit', label: '13. Student Gate Exit Passes', icon: LogOut },
        { id: 'reporting_hub', label: '14. Academic Reporting Hub', icon: FileSpreadsheet },
        { id: 'reminders', label: '15. Lesson Reminders', icon: Bell }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar Header */}
      <header className="relative lg:sticky lg:top-16 z-20 bg-slate-900 border-b border-slate-800 text-white px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors lg:hidden cursor-pointer shrink-0"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="bg-white p-1 rounded-xl border border-slate-700 shrink-0">
            <EduSmartGadsaLogo variant="horizontal" size="xs" compactMobile />
          </div>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="truncate">Academic Department Teacher Console</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {isClassTeacher ? `Grade ${currentUser.grade} ${currentUser.stream} Class Teacher` : 'Subject Teacher'}
              </span>
              {switchedFromRole && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  From {getAdministrativeRoleShortName(switchedFromRole)}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Assigned: {teacherAssignedSubjects.join(', ') || 'No Subjects Assigned'} · Lesson logs, registers & CBC marks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {switchedFromRole && onReturnToAdminWorkspace && (
            <button
              type="button"
              onClick={onReturnToAdminWorkspace}
              className="px-2.5 sm:px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>&larr; Return to {getAdministrativeRoleShortName(switchedFromRole)}</span>
            </button>
          )}

          {/* Quick School Library Access */}
          <button
            type="button"
            onClick={() => setActiveTab('library_contents')}
            className="px-2.5 sm:px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Access School Library Books, Digital E-Books & E-Links"
          >
            <Library className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">School Library</span>
            <span className="sm:hidden">Library</span>
          </button>

          {/* Quick Library Room Booking */}
          <LibraryRoomBookingButton
            currentUser={currentUser}
            variant="header"
            label="Book Library Room"
          />

          {/* Quick Result Upload / View Button */}
          <button
            onClick={() => setActiveTab('cbc_results')}
            className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CBC Assessment Results</span>
            <span className="sm:hidden">CBC Marks</span>
          </button>

          {/* Report Absence to Leadership */}
          <button
            onClick={() => setShowAbsenceModal(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Report your absence directly to Head Teacher, Deputy Head, Dean of Studies, and Senior Teacher"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report Absence</span>
          </button>

          <button
            onClick={() => setActiveTab('virtual_class')}
            className="px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Virtual Classrooms</span>
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
          <OwnStaffAppraisal currentUser={currentUser} />
        )}

      {/* ========================================================
          CLASS TEACHER REGISTER & PERFORMANCE CONSOLE
          ======================================================== */}
      {isClassTeacher && activeTab === 'class_register' && (
        <ClassTeacherModule currentUser={currentUser} />
      )}

      {/* ========================================================
          STUDENT STREAM MANAGEMENT (DOVE..SWAN / ATHI..TURKWEL)
          ======================================================== */}
      {activeTab === 'stream_management' && canAllocateStreams && (
        <StudentStreamManager currentUser={currentUser} />
      )}

      {/* ========================================================
          CBC LESSON FILE MANAGEMENT & CURRICULUM TAGGING
          ======================================================== */}
      {activeTab === 'lesson_files' && (
        <TeacherLessonFileManager currentUser={currentUser} />
      )}

      {/* ========================================================
          STUDENT SUBJECT CHATS & INQUIRIES INBOX
          ======================================================== */}
      {activeTab === 'subject_chats' && (
        <TeacherSubjectChatInbox currentUser={currentUser} />
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
            <p className="text-xs text-slate-500 mb-4">
              Assign homework or practical projects strictly to students in the classes and subjects assigned to you.
            </p>

            {allowedAsgGrades.length === 0 ? (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1.5">
                <div className="font-black flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>No Class & Subject Allocations Assigned</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  You do not currently have any Grade, Stream, and Subject lesson allocations assigned to your account. Ask your school administrator or Dean of Studies to assign your classes and subjects before publishing homework assignments.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">Your Assigned Scope:</span>
                  <span>
                    Grades {allowedAsgGrades.map((g) => `Grade ${g}`).join(', ')} · Subjects: {teacherAssignedSubjects.join(', ')}
                  </span>
                </div>

                {asgError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{asgError}</span>
                  </div>
                )}

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
                          const nextStreams = getAllowedStreamsForGrade(currentUser, g);
                          const nextStream = (nextStreams[0] || '') as StreamName;
                          const nextSubs = getAllowedSubjectsForGradeStream(currentUser, g, nextStream);
                          setAsgGrade(g);
                          setAsgStream(nextStream);
                          if (nextSubs[0]) setAsgSubject(nextSubs[0]);
                          setAsgError(null);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold bg-white"
                      >
                        {allowedAsgGrades.map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Target Stream</label>
                      <select
                        value={asgStream}
                        onChange={(e) => {
                          const st = e.target.value as StreamName;
                          const nextSubs = getAllowedSubjectsForGradeStream(currentUser, asgGrade, st);
                          setAsgStream(st);
                          if (nextSubs[0]) setAsgSubject(nextSubs[0]);
                          setAsgError(null);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold bg-white"
                      >
                        {allowedAsgStreams.map(s => (
                          <option key={s} value={s}>{s} Stream</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                      <select
                        value={asgSubject}
                        onChange={(e) => {
                          setAsgSubject(e.target.value as SubjectName);
                          setAsgError(null);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold bg-white"
                      >
                        {allowedAsgSubjects.map(sub => (
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
                    disabled={allowedAsgStreams.length === 0 || allowedAsgSubjects.length === 0}
                    className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Publish Assignment to Grade {asgGrade} ({asgStream})
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 3B: COMPUTER LAB MODULE (ONLY INTEGRATED SCIENCE OR COMPUTER STUDIES TEACHERS)
          Dedicated live Scratch projector, Challenge Library & class push
          ======================================================== */}
      {activeTab === 'computer_lab' && (
        <section className="space-y-6">
          {hasLabAccess ? (
            <ComputerLabModule
              currentUser={currentUser}
              onNavigateToTab={(tab) => setActiveTab(tab as any)}
            />
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-xs text-center space-y-3 max-w-xl mx-auto">
              <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">Computer Laboratory Access Restricted</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only subject teachers assigned <strong>Integrated Science</strong> or <strong>Computer Studies</strong> may access the Computer Laboratory.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          TAB 3C: SUBJECT TEACHER VIRTUAL LAB (ONLY INTEGRATED SCIENCE OR COMPUTER STUDIES TEACHERS)
          ======================================================== */}
      {activeTab === 'virtual_lab' && (
        <section className="space-y-6">
          {hasLabAccess ? (
            <VirtualLabWorkspace
              currentUser={currentUser}
              initialTab="demonstrations"
              isEmbedded={true}
            />
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-xs text-center space-y-3 max-w-xl mx-auto">
              <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">Virtual Laboratory Access Restricted</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only subject teachers assigned <strong>Integrated Science</strong> or <strong>Computer Studies</strong> may access the Virtual Laboratory.
              </p>
            </div>
          )}
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

              <button
                type="button"
                onClick={() => setShowScienceModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-teal-700 to-cyan-800 hover:from-teal-800 hover:to-cyan-900 text-white shadow-2xs"
                title="Launch CBC Science Explorer: 3D Molecular Simulation, formulas & CBC inquiry competencies"
              >
                <Atom className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                <span>6. Science Explorer (3D)</span>
              </button>
            </div>
          </div>

          {/* CHANNEL 1: LESSON NOTES & PDF DOCUMENTS */}
          {resourceSubTab === 'notes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Prepare & Publish Lesson Notes or PDF Document</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Upload a PDF document directly from your device or author structured Markdown lesson notes for learners.
                </p>

                {resourceUploadError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center justify-between gap-2">
                    <span>{resourceUploadError}</span>
                    <button type="button" onClick={() => setResourceUploadError(null)} className="text-rose-500 hover:text-rose-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {noteSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Lesson note / PDF saved and immediately available to Grade {noteGrade} learners!</span>
                  </div>
                )}

                <form onSubmit={handleCreateNote} className="space-y-4">
                  {/* Device PDF Upload Zone */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/40 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                          {uploadingResource === 'note_pdf' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Upload PDF Document from Device
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Select a PDF handout, textbook excerpt, or worksheet (up to 60 MB).
                          </div>
                        </div>
                      </div>
                      <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs shrink-0 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingResource === 'note_pdf' ? 'Uploading PDF...' : notePdfUrl ? 'Replace PDF' : 'Choose PDF File'}</span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={handleUploadNotePdf}
                          disabled={uploadingResource !== null}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {notePdfUrl && (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="font-bold text-slate-800 truncate">{notePdfName || 'Uploaded PDF Document'}</span>
                          {notePdfSize && <span className="text-[10px] font-mono text-slate-500 shrink-0">({notePdfSize})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNotePdfUrl('');
                            setNotePdfName('');
                            setNotePdfMime('');
                            setNotePdfSize('');
                          }}
                          className="text-rose-600 hover:text-rose-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Remove PDF</span>
                        </button>
                      </div>
                    )}
                  </div>

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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Note / Document Title</label>
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
                      Written Lesson Content {notePdfUrl ? '(Optional when PDF is uploaded)' : '(Markdown formatted, headings with ###)'}
                    </label>
                    <textarea
                      rows={5}
                      required={!notePdfUrl}
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
                    disabled={uploadingResource === 'note_pdf'}
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {uploadingResource === 'note_pdf' ? 'Uploading PDF...' : 'Publish Lesson Note / PDF'}
                  </button>
                </form>
              </div>

              {/* Published Notes Roster */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Published Lesson Notes & PDFs ({existingNotes.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {existingNotes.map((n) => (
                    <div key={n.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                              Grade {n.grade} · {n.subject}
                            </span>
                            {n.documentUrl && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span>PDF</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{n.createdAt}</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 mt-2 line-clamp-1">{n.title}</h5>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{n.summary}</p>
                        {n.documentUrl && (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg mt-2">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{n.documentName || 'PDF Attached'}</span>
                            <span className="text-[10px] text-amber-700 font-semibold">· View-Only</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">By {n.author}</span>
                        {canDeleteEResource(currentUser, n) ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(n.id)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 inline-flex items-center gap-1" title="Only the uploader or System Administrator can delete this E-resource">
                            <Lock className="w-3 h-3" />
                            <span>Protected</span>
                          </span>
                        )}
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
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span>Upload & Publish Audio Lesson</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Upload voice recordings or audio lessons directly from your phone, tablet, or computer (MP3, WAV, M4A, OGG, AAC) or link an external audio stream.
                </p>

                {resourceUploadError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center justify-between gap-2">
                    <span>{resourceUploadError}</span>
                    <button type="button" onClick={() => setResourceUploadError(null)} className="text-rose-500 hover:text-rose-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {audioSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Audio lesson saved and published for Grade {audioGrade} learners!</span>
                  </div>
                )}

                <form onSubmit={handleCreateAudio} className="space-y-4">
                  {/* Device Audio Upload Zone */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                          {uploadingResource === 'audio' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Upload Audio File from Device
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Supports MP3, WAV, M4A, OGG, AAC, FLAC voice notes & podcasts (up to 60 MB).
                          </div>
                        </div>
                      </div>
                      <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs shrink-0 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingResource === 'audio' ? 'Uploading Audio...' : audioFileName ? 'Replace Audio' : 'Choose Audio File'}</span>
                        <input
                          type="file"
                          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.weba,.amr"
                          onChange={handleUploadAudioFile}
                          disabled={uploadingResource !== null}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {audioUrl && (
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-teal-200">
                        {audioFileName && (
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-teal-900 truncate">
                              {audioFileName} {audioFileSize ? `(${audioFileSize})` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAudioUrl('');
                                setAudioFileName('');
                                setAudioMimeType('');
                                setAudioFileSize('');
                              }}
                              className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Clear</span>
                            </button>
                          </div>
                        )}
                        <audio controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} preload="metadata" src={audioUrl} className="w-full h-9" />
                      </div>
                    )}
                  </div>

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
                        max="180"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Uploaded Audio Path or External Stream URL
                    </label>
                    <input
                      type="text"
                      required
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="Upload an audio file above or paste https://..."
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
                      rows={3}
                      value={audioTranscript}
                      onChange={(e) => setAudioTranscript(e.target.value)}
                      placeholder="Enter script text so learners can follow along as they listen..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingResource === 'audio'}
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {uploadingResource === 'audio' ? 'Uploading Audio...' : 'Publish Audio Lesson'}
                  </button>
                </form>
              </div>

              {/* Published Audios Roster */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Published Audio Lessons ({existingAudios.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {existingAudios.map((a) => (
                    <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                            Grade {a.grade} · {a.subject}
                          </span>
                          <span className="text-[10px] text-teal-700 font-mono font-bold">{a.durationMinutes} mins</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{a.title}</h5>
                        <audio controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} preload="metadata" src={a.audioUrl} className="w-full h-8" />
                        <p className="text-[11px] text-slate-500 line-clamp-2 italic">"{a.transcript}"</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">By {a.teacherName}</span>
                        {canDeleteEResource(currentUser, a) ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteAudio(a.id)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 inline-flex items-center gap-1" title="Only the uploader or System Administrator can delete this E-resource">
                            <Lock className="w-3 h-3" />
                            <span>Protected</span>
                          </span>
                        )}
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
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span>Upload & Publish Video Lesson</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Upload classroom demonstration videos directly from your device (MP4, WebM, MOV, 3GP, MKV) or link a YouTube / Vimeo educational stream.
                </p>

                {resourceUploadError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center justify-between gap-2">
                    <span>{resourceUploadError}</span>
                    <button type="button" onClick={() => setResourceUploadError(null)} className="text-rose-500 hover:text-rose-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {videoSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Video lesson published for Grade {videoGrade} learners!</span>
                  </div>
                )}

                <form onSubmit={handleCreateVideo} className="space-y-4">
                  {/* Device Video Upload Zone */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                          {uploadingResource === 'video' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Video className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Upload Video from Device
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Supports MP4, WebM, MOV, M4V, 3GP recorded lessons (up to 60 MB).
                          </div>
                        </div>
                      </div>
                      <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs shrink-0 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingResource === 'video' ? 'Uploading Video...' : videoFileName ? 'Replace Video' : 'Choose Video File'}</span>
                        <input
                          type="file"
                          accept="video/*,.mp4,.webm,.mov,.ogv,.m4v,.3gp,.mkv"
                          onChange={handleUploadVideoFile}
                          disabled={uploadingResource !== null}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {videoUrl && !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be') && !videoUrl.includes('vimeo.com') && (
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-rose-200">
                        {videoFileName && (
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-rose-900 truncate">
                              {videoFileName} {videoFileSize ? `(${videoFileSize})` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setVideoUrl('');
                                setVideoFileName('');
                                setVideoMimeType('');
                                setVideoFileSize('');
                              }}
                              className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Clear</span>
                            </button>
                          </div>
                        )}
                        <video
                          controls
                          controlsList="nodownload"
                          disablePictureInPicture
                          onContextMenu={(e) => e.preventDefault()}
                          playsInline
                          preload="metadata"
                          poster={videoThumbnail || undefined}
                          src={videoUrl}
                          className="w-full max-h-56 rounded-lg bg-black"
                        />
                      </div>
                    )}
                  </div>

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
                        max="180"
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
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Uploaded Video Path or Stream/YouTube URL
                      </label>
                      <input
                        type="text"
                        required
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="Upload a video above or paste https://..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Thumbnail Picture (Optional)
                        </label>
                        <label className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>{uploadingResource === 'video_thumb' ? 'Uploading...' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadVideoThumbnail}
                            disabled={uploadingResource !== null}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={videoThumbnail}
                        onChange={(e) => setVideoThumbnail(e.target.value)}
                        placeholder="Upload a cover image or paste https://..."
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
                    disabled={uploadingResource === 'video' || uploadingResource === 'video_thumb'}
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {uploadingResource === 'video' ? 'Uploading Video...' : 'Publish Video Lesson'}
                  </button>
                </form>
              </div>

              {/* Published Videos Roster */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Published Video Lessons ({existingVideos.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {existingVideos.map((v) => (
                    <div key={v.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between">
                      {v.videoThumbnail ? (
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
                      ) : !v.videoUrl.includes('youtube.com') && !v.videoUrl.includes('youtu.be') && !v.videoUrl.includes('vimeo.com') ? (
                        <div className="bg-slate-950">
                          <video controls controlsList="nodownload" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} playsInline preload="metadata" src={v.videoUrl} className="w-full h-36 object-contain" />
                        </div>
                      ) : null}
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
                          {canDeleteEResource(currentUser, v) ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteVideo(v.id)}
                              className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 inline-flex items-center gap-1" title="Only the uploader or System Administrator can delete this E-resource">
                              <Lock className="w-3 h-3" />
                              <span>Protected</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHANNEL 4: DIAGRAMS, IMAGES & PICTURES */}
          {resourceSubTab === 'images' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span>Upload & Publish Diagram, Image or Picture</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Upload photos, whiteboard snapshots, anatomical diagrams, maps, or infographics directly from your device gallery or camera.
                </p>

                {resourceUploadError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center justify-between gap-2">
                    <span>{resourceUploadError}</span>
                    <button type="button" onClick={() => setResourceUploadError(null)} className="text-rose-500 hover:text-rose-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {imgSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Image / picture published and available to Grade {imgGrade} learners!</span>
                  </div>
                )}

                <form onSubmit={handleCreateImage} className="space-y-4">
                  {/* Device Image / Picture Upload Zone */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          {uploadingResource === 'image' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Upload Image / Picture from Device
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Supports JPG, PNG, WebP, GIF, SVG, HEIC photos & diagrams from gallery or camera.
                          </div>
                        </div>
                      </div>
                      <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs shrink-0 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingResource === 'image' ? 'Uploading Image...' : imgFileName ? 'Replace Picture' : 'Choose Image / Picture'}</span>
                        <input
                          type="file"
                          accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.bmp,.avif,.heic,.heif"
                          onChange={handleUploadLessonImage}
                          disabled={uploadingResource !== null}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {imgFileName && (
                      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs">
                        <span className="font-bold text-blue-900 truncate">
                          {imgFileName} {imgFileSize ? `(${imgFileSize})` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setImgUrl('');
                            setImgFileName('');
                            setImgMimeType('');
                            setImgFileSize('');
                          }}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      </div>
                    )}
                  </div>

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
                        <option value="illustration">Curriculum Illustration / Picture</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Image / Picture Title</label>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Uploaded Image Path or External Image URL
                    </label>
                    <input
                      type="text"
                      required
                      value={imgUrl}
                      onChange={(e) => setImgUrl(e.target.value)}
                      placeholder="Upload an image/picture above or paste https://..."
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
                      <div className="h-44 max-w-sm rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
                        <img src={imgUrl} alt="Preview" className="h-full w-auto object-contain" />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploadingResource === 'image'}
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {uploadingResource === 'image' ? 'Uploading Image...' : 'Publish Image / Picture'}
                  </button>
                </form>
              </div>

              {/* Published Images Roster */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Published Diagrams, Images & Pictures ({existingImages.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingImages.map((img) => (
                    <div key={img.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between">
                      <div className="h-44 bg-slate-950 flex items-center justify-center p-2 select-none" onContextMenu={(e) => e.preventDefault()}>
                        <img src={img.imageUrl} alt={img.title} draggable={false} className="max-h-full max-w-full object-contain rounded pointer-events-none" />
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
                          {canDeleteEResource(currentUser, img) ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 inline-flex items-center gap-1" title="Only the uploader or System Administrator can delete this E-resource">
                              <Lock className="w-3 h-3" />
                              <span>Protected</span>
                            </span>
                          )}
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
                <span>Quiz published strictly to Grade {quizGrade} ({quizStream}) — {quizSubject} with automatic marking enabled!</span>
              </div>
            )}

            {quizError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800">
                {quizError}
              </div>
            )}

            {allowedAsgGrades.length === 0 ? (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 font-semibold">
                No classes or subjects are currently allocated to your teaching profile. Please contact the Dean of Studies or School Administrator to assign your classes and learning areas before publishing topical quizzes.
              </div>
            ) : (
            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Grade</label>
                  <select
                    value={quizGrade}
                    onChange={(e) => {
                      const g = Number(e.target.value) as GradeLevel;
                      setQuizGrade(g);
                      const streams = getAllowedStreamsForGrade(currentUser, g);
                      const nextStream = (streams[0] || quizStream) as StreamName;
                      setQuizStream(nextStream);
                      const subs = getAllowedSubjectsForGradeStream(currentUser, g, nextStream);
                      if (subs[0]) setQuizSubject(subs[0]);
                    }}
                    className="w-full min-h-[42px] px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold bg-white"
                  >
                    {allowedAsgGrades.map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Stream</label>
                  <select
                    value={quizStream}
                    onChange={(e) => {
                      const st = e.target.value as StreamName;
                      setQuizStream(st);
                      const subs = getAllowedSubjectsForGradeStream(currentUser, quizGrade, st);
                      if (subs[0]) setQuizSubject(subs[0]);
                    }}
                    className="w-full min-h-[42px] px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold bg-white"
                  >
                    {allowedQuizStreams.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Subject</label>
                  <select
                    value={quizSubject}
                    onChange={(e) => setQuizSubject(e.target.value as SubjectName)}
                    className="w-full min-h-[42px] px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold bg-white"
                  >
                    {allowedQuizSubjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pass Mark %</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={quizPassPct}
                    onChange={(e) => setQuizPassPct(Number(e.target.value))}
                    className="w-full min-h-[42px] px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Limit (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                    className="w-full min-h-[42px] px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
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
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save & Publish Quiz
              </button>
            </form>
            )}
          </div>

          {/* Student attempts overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Student Quiz Performance Log ({quizAttempts.length} Scoped Submissions)
            </h3>

            {/* Mobile Stacked Cards */}
            <div className="md:hidden space-y-2.5">
              {quizAttempts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-slate-200 rounded-xl">
                  No quiz submissions recorded for your assigned classes yet.
                </div>
              ) : (
                quizAttempts.map((att) => (
                  <div key={att.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{att.studentName}</div>
                        <div className="text-[11px] text-slate-500">Grade {att.grade} ({att.stream})</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase shrink-0 ${
                          att.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {att.passed ? 'PASS' : 'FAIL'} · {att.percentage}%
                      </span>
                    </div>
                    <div className="text-slate-700 font-medium">{att.quizTitle}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/70">
                      <span className="font-mono font-bold text-slate-800">Score: {att.score} / {att.totalQuestions}</span>
                      <span className="font-mono">{att.completedAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
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
          AUX TAB: LIVEKIT VIRTUAL CLASSROOMS
          ======================================================== */}
      {activeTab === 'virtual_class' && <SubjectTeacherVirtualLessonsPanel />}

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

          {/* Staff Absence Reporting to Leadership Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/25 text-white">
                    Official Staff Absence Protocol
                  </span>
                  <span className="text-xs text-amber-100 font-bold">
                    TSC & School Governance
                  </span>
                </div>
                <h4 className="text-base font-black tracking-tight mt-0.5">
                  Report Absence Status to School Leadership
                </h4>
                <p className="text-xs text-amber-100/90 max-w-xl">
                  Notify Head Teacher, Deputy Head, Dean of Studies, and Senior Teacher immediately for medical, emergency, or official duties so relief coverage can be booked for your classes.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAbsenceModal(true)}
              className="px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-900 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Report Absence to Leadership</span>
            </button>
          </div>

          <TimetablePortal
            currentUser={currentUser}
            initialGrade={defaultGrade}
            initialStream={defaultStream}
            initialPerspective="teacher"
          />
        </div>
      )}

      {/* ========================================================
          AUX TAB: SCHOOL LIBRARY CONTENTS (BOOKS, DIGITAL & E-LINKS)
          ======================================================== */}
      {activeTab === 'library_contents' && (
        <TeacherLibraryPortal currentUser={currentUser} />
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

      {/* Teacher Absence Reporting Modal */}
      <TeacherAbsenceReportModal
        currentUser={currentUser}
        isOpen={showAbsenceModal}
        onClose={() => setShowAbsenceModal(false)}
      />

      {/* CBC Science Explorer & 3D Molecular Simulation Modal */}
      <ScienceViewerModal
        isOpen={showScienceModal}
        onClose={() => setShowScienceModal(false)}
      />

    </div>
  );
};
