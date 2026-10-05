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
  Printer
} from 'lucide-react';

interface TeacherWorkspaceProps {
  currentUser: User;
}

type TeacherTab = 
  | 'work_entry' 
  | 'gate_exit' 
  | 'class_register'
  | 'assignments' 
  | 'resources' 
  | 'quizzes'
  | 'virtual_class'
  | 'timetable'
  | 'reminders'
  | 'reporting_hub';

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({ currentUser }) => {
  const isClassTeacher = currentUser.role === 'class_teacher';
  const defaultGrade = currentUser.grade || 4;
  const defaultStream = currentUser.stream || 'Dove';

  const [activeTab, setActiveTab] = useState<TeacherTab>(
    isClassTeacher ? 'class_register' : 'work_entry'
  );

  // Handle direct tab navigation from notification items
  React.useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (tab) {
        if (['work_entry', 'gate_exit', 'class_register', 'assignments', 'resources', 'quizzes', 'virtual_class', 'timetable', 'reminders', 'reporting_hub'].includes(tab)) {
          setActiveTab(tab as TeacherTab);
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

  // Lesson Note Creation Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteGrade, setNoteGrade] = useState<GradeLevel>(defaultGrade);
  const [noteSubject, setNoteSubject] = useState<SubjectName>(getSubjectsForGrade(defaultGrade)[0]);
  const [noteSummary, setNoteSummary] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteKeyTakeaway, setNoteKeyTakeaway] = useState('');
  const [noteSuccess, setNoteSuccess] = useState(false);

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
    setNoteSuccess(true);
    setNoteTitle('');
    setNoteSummary('');
    setNoteContent('');
    setTimeout(() => setNoteSuccess(false), 2500);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Teacher Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-2xs shrink-0 hidden sm:flex items-center justify-center">
            <EduSmartGadsaLogo variant="horizontal" size="sm" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-bold text-xl flex sm:hidden items-center justify-center shadow-xs shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>CBC Staff Console</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-700">{currentUser.tscNumber || 'TSC/44120/ED'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-bold">
                {isClassTeacher ? `Class Teacher (Grade ${currentUser.grade} ${currentUser.stream})` : 'Subject Teacher'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentUser.name}
            </h1>
            <div className="text-xs text-slate-600 mt-0.5">
              Assigned Subjects: <strong className="text-slate-900">{currentUser.assignedSubjects?.join(', ') || 'Mathematics, Science'}</strong> · Authorized across multiple streams
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('reporting_hub')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors ${
              activeTab === 'reporting_hub'
                ? 'bg-slate-900 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Reporting Hub</span>
          </button>
          <button
            onClick={() => setActiveTab('virtual_class')}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Video className="w-4 h-4" />
            <span>Launch Google Meet</span>
          </button>
        </div>
      </div>

      {/* Primary Teacher Action Buttons (Explicitly requested in prompt) */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${isClassTeacher ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3`}>
        {/* Button 1: Work entry sign in */}
        <button
          onClick={() => setActiveTab('work_entry')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'work_entry'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-slate-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-emerald-100 text-emerald-800">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">1. Work Entry</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'work_entry' ? 'text-slate-300' : 'text-slate-500'}`}>
              Daily lesson log register
            </div>
          </div>
        </button>

        {/* Button 2: Student Gate Exit sign out */}
        <button
          onClick={() => setActiveTab('gate_exit')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'gate_exit'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-slate-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-rose-100 text-rose-800">
            <LogOut className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">2. Student Gate Exit</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'gate_exit' ? 'text-slate-300' : 'text-slate-500'}`}>
              Sign learners out with pass
            </div>
          </div>
        </button>

        {/* Class Teacher Button: Class Attendance Register */}
        {isClassTeacher && (
          <button
            onClick={() => setActiveTab('class_register')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeTab === 'class_register'
                ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-emerald-400'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-emerald-600 text-white">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm">3. Class Register</div>
              <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'class_register' ? 'text-emerald-200' : 'text-slate-500'}`}>
                {currentUser.stream || 'Stream'} Roll Call
              </div>
            </div>
          </button>
        )}

        {/* Button 3: Assignments */}
        <button
          onClick={() => setActiveTab('assignments')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'assignments'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-slate-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-blue-100 text-blue-800">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">3. Assignments</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'assignments' ? 'text-slate-300' : 'text-slate-500'}`}>
              Assign & grade homework
            </div>
          </div>
        </button>

        {/* Button 4: Lesson Resources */}
        <button
          onClick={() => setActiveTab('resources')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'resources'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-slate-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-purple-100 text-purple-800">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">4. Lesson Resources</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'resources' ? 'text-slate-300' : 'text-slate-500'}`}>
              Prepare notes, audios, video
            </div>
          </div>
        </button>

        {/* Button 5: Quizzes */}
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'quizzes'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-slate-400'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-amber-100 text-amber-800">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">5. Quizzes</div>
            <div className={`text-[10px] sm:text-[11px] mt-0.5 ${activeTab === 'quizzes' ? 'text-slate-300' : 'text-slate-500'}`}>
              Topical test builder & marks
            </div>
          </div>
        </button>
      </div>

      {/* Auxiliary actions row: Reporting Hub, Virtual Class, Timetable, Lesson Reminders */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
          Classroom Operations:
        </span>
        <button
          onClick={() => setActiveTab('reporting_hub')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'reporting_hub' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Reporting Hub (Monthly, Termly, Annual PDF)</span>
        </button>
        {isClassTeacher && (
          <button
            onClick={() => setActiveTab('class_register')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'class_register' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Class Register ({currentUser.stream || 'Stream'})</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('virtual_class')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'virtual_class' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Virtual Class (Google Meet)</span>
        </button>
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'timetable' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Post Class Timetable</span>
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'reminders' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Set Lesson Reminders</span>
        </button>
      </div>

      {/* ========================================================
          CLASS TEACHER REGISTER & PERFORMANCE CONSOLE
          ======================================================== */}
      {isClassTeacher && activeTab === 'class_register' && (
        <ClassTeacherModule currentUser={currentUser} />
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
          TAB 4: LESSON RESOURCES (PREPARE NOTES, AUDIOS, VIDEOS)
          ======================================================== */}
      {activeTab === 'resources' && (
        <section className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Prepare & Publish Lesson Notes (Anti-Download Protected)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Notes uploaded here are automatically embedded in the student workspace with download prevention.
            </p>

            {noteSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
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
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Publish Lesson Note
              </button>
            </form>
          </div>
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
        <TimetablePortal
          currentUser={currentUser}
          initialGrade={defaultGrade}
          initialStream={defaultStream}
        />
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
    </div>
  );
};
