import React, { useState, useMemo } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName,
  WorkEntryLog,
  GateExitPass,
  AttendanceRecord,
  ReportCard,
  SchoolCalendarEvent,
  ParentCommunication,
  ExamTimetableEntry,
  TimetableSlot,
  PRIMARY_STREAMS,
  JUNIOR_STREAMS
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Printer, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Send, 
  MessageSquare, 
  Lock, 
  ShieldCheck, 
  Eye, 
  Check, 
  X, 
  ArrowRight,
  TrendingUp,
  BarChart3,
  LogOut,
  MapPin,
  Phone,
  UserCheck,
  CalendarDays,
  FileCheck,
  DoorOpen,
  Award,
  Layers,
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface SchoolAdminStaffWorkspaceProps {
  currentUser: User;
  onLogout?: () => void;
}

type AdminTab = 
  | 'work_entries'
  | 'gate_exits'
  | 'registers'
  | 'communications'
  | 'calendar'
  | 'performance'
  | 'printables';

export const SchoolAdminStaffWorkspace: React.FC<SchoolAdminStaffWorkspaceProps> = ({ 
  currentUser,
  onLogout
}) => {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<AdminTab>('work_entries');

  // Core Data States from Storage
  const [workEntries] = useState<WorkEntryLog[]>(() => Storage.getWorkEntryLogs());
  const [gatePasses, setGatePasses] = useState<GateExitPass[]>(() => Storage.getGatePasses());
  const [attendanceRecords] = useState<AttendanceRecord[]>(() => Storage.getAttendanceRecords());
  const [reportCards] = useState<ReportCard[]>(() => Storage.getReportCards());
  const [calendarEvents, setCalendarEvents] = useState<SchoolCalendarEvent[]>(() => Storage.getCalendarEvents());
  const [communications, setCommunications] = useState<ParentCommunication[]>(() => Storage.getParentCommunications());
  const [examTimetables, setExamTimetables] = useState<ExamTimetableEntry[]>(() => Storage.getExamTimetables());
  const [timetableSlots] = useState<TimetableSlot[]>(() => Storage.getAllTimetableSlots());

  // Search & Filter states
  const [workSearch, setWorkSearch] = useState('');
  const [workGradeFilter, setWorkGradeFilter] = useState<string>('all');
  const [gateSearch, setGateSearch] = useState('');
  const [gateStatusFilter, setGateStatusFilter] = useState<string>('all');
  const [attendanceGrade, setAttendanceGrade] = useState<GradeLevel>(4);
  const [attendanceStream, setAttendanceStream] = useState<string>('Dove');
  const [calendarTermFilter, setCalendarTermFilter] = useState<string>('all');
  const [calendarCategoryFilter, setCalendarCategoryFilter] = useState<string>('all');
  const [perfSearch, setPerfSearch] = useState('');
  const [perfGradeFilter, setPerfGradeFilter] = useState<string>('all');

  // Modals
  const [selectedWorkEntry, setSelectedWorkEntry] = useState<WorkEntryLog | null>(null);
  const [selectedStudentReport, setSelectedStudentReport] = useState<ReportCard | null>(null);
  const [showNewCalendarModal, setShowNewCalendarModal] = useState(false);
  const [editingCalendarEvent, setEditingCalendarEvent] = useState<SchoolCalendarEvent | null>(null);
  const [showNewCommModal, setShowNewCommModal] = useState(false);
  const [printModalType, setPrintModalType] = useState<'timetable' | 'exam' | 'report' | 'calendar' | 'gate' | 'work_ledger' | 'register' | null>(null);
  const [printableGrade, setPrintableGrade] = useState<GradeLevel>(4);
  const [printableStream, setPrintableStream] = useState<StreamName>('Dove');

  // Form state for Calendar Event
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'academic' as SchoolCalendarEvent['category'],
    term: 1 as 1 | 2 | 3,
    academicYear: 2026,
    startDate: '',
    endDate: '',
    targetAudience: 'All School' as SchoolCalendarEvent['targetAudience'],
    venue: '',
    isImportant: false,
    status: 'upcoming' as SchoolCalendarEvent['status']
  });

  // Form state for Parent Communication
  const [commForm, setCommForm] = useState({
    title: '',
    message: '',
    channel: 'Portal Circular' as ParentCommunication['channel'],
    targetAudience: 'All Parents' as ParentCommunication['targetAudience'],
    targetGrade: 4 as GradeLevel,
    category: 'General Notice' as ParentCommunication['category']
  });

  // Feedback notifications
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // --- CALENDAR HANDLERS (Admin staff is in charge of updating) ---
  const handleOpenAddEvent = () => {
    setEditingCalendarEvent(null);
    setEventForm({
      title: '',
      description: '',
      category: 'academic',
      term: 1,
      academicYear: 2026,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      targetAudience: 'All School',
      venue: 'School Grounds / Main Hall',
      isImportant: false,
      status: 'upcoming'
    });
    setShowNewCalendarModal(true);
  };

  const handleOpenEditEvent = (evt: SchoolCalendarEvent) => {
    setEditingCalendarEvent(evt);
    setEventForm({
      title: evt.title,
      description: evt.description,
      category: evt.category,
      term: evt.term,
      academicYear: evt.academicYear,
      startDate: evt.startDate,
      endDate: evt.endDate,
      targetAudience: evt.targetAudience,
      venue: evt.venue || '',
      isImportant: evt.isImportant,
      status: evt.status
    });
    setShowNewCalendarModal(true);
  };

  const handleSaveCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.startDate) return;

    if (editingCalendarEvent) {
      const updated = Storage.updateCalendarEvent(editingCalendarEvent.id, {
        ...eventForm,
        updatedBy: `${currentUser.name} (Admin Staff)`,
      });
      if (updated) {
        setCalendarEvents(Storage.getCalendarEvents());
        showSuccess(`Calendar event "${eventForm.title}" updated successfully.`);
      }
    } else {
      Storage.addCalendarEvent({
        ...eventForm,
        updatedBy: `${currentUser.name} (Admin Staff)`,
        updatedAt: new Date().toISOString().split('T')[0]
      });
      setCalendarEvents(Storage.getCalendarEvents());
      showSuccess(`New event "${eventForm.title}" published to school calendar.`);
    }

    setShowNewCalendarModal(false);
  };

  const handleDeleteCalendarEvent = (id: string, title: string) => {
    Storage.deleteCalendarEvent(id);
    setCalendarEvents(Storage.getCalendarEvents());
    showSuccess(`"${title}" removed from school calendar.`);
  };

  // --- PARENT COMMUNICATION HANDLERS ---
  const handleSendCommunication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commForm.title.trim() || !commForm.message.trim()) return;

    const newComm = Storage.addParentCommunication({
      ...commForm,
      sentBy: currentUser.name,
      senderRole: 'School Administration Staff & Registrar',
      dateSent: new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
      recipientCount: commForm.targetAudience === 'All Parents' ? 680 : commForm.targetAudience === 'Primary Parents' ? 440 : 240,
      deliveryStatus: 'Delivered'
    });

    setCommunications(Storage.getParentCommunications());
    setShowNewCommModal(false);
    showSuccess(`Parent communication "${newComm.title}" successfully dispatched via ${newComm.channel}.`);
  };

  // --- GATE PASS STATUS UPDATE ---
  const handleMarkReturned = (id: string) => {
    const updated = gatePasses.map(gp => {
      if (gp.id === id) {
        return {
          ...gp,
          status: 'returned' as const,
          actualReturnTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return gp;
    });
    setGatePasses(updated);
    Storage.updateGatePassStatus(id, 'returned', {
      actualReturnTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });
    showSuccess('Student return logged and confirmed by School Administration.');
  };

  // --- FILTERED COMPUTATIONS ---
  const filteredWorkEntries = useMemo(() => {
    return workEntries.filter(entry => {
      const matchSearch = 
        entry.teacherName.toLowerCase().includes(workSearch.toLowerCase()) ||
        (entry.subject && entry.subject.toLowerCase().includes(workSearch.toLowerCase())) ||
        (entry.topicTaught && entry.topicTaught.toLowerCase().includes(workSearch.toLowerCase())) ||
        (entry.staffNo && entry.staffNo.toLowerCase().includes(workSearch.toLowerCase()));
      const matchGrade = workGradeFilter === 'all' || entry.grade?.toString() === workGradeFilter;
      return matchSearch && matchGrade;
    });
  }, [workEntries, workSearch, workGradeFilter]);

  const filteredGatePasses = useMemo(() => {
    return gatePasses.filter(gp => {
      const matchSearch = 
        gp.studentName.toLowerCase().includes(gateSearch.toLowerCase()) ||
        gp.gatePassCode.toLowerCase().includes(gateSearch.toLowerCase()) ||
        gp.guardianName.toLowerCase().includes(gateSearch.toLowerCase()) ||
        gp.reason.toLowerCase().includes(gateSearch.toLowerCase());
      const matchStatus = gateStatusFilter === 'all' || gp.status === gateStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [gatePasses, gateSearch, gateStatusFilter]);

  const filteredCalendarEvents = useMemo(() => {
    return calendarEvents.filter(evt => {
      const matchTerm = calendarTermFilter === 'all' || evt.term.toString() === calendarTermFilter;
      const matchCategory = calendarCategoryFilter === 'all' || evt.category === calendarCategoryFilter;
      return matchTerm && matchCategory;
    });
  }, [calendarEvents, calendarTermFilter, calendarCategoryFilter]);

  const filteredReportCards = useMemo(() => {
    return reportCards.filter(rc => {
      const matchSearch = 
        rc.studentName.toLowerCase().includes(perfSearch.toLowerCase()) ||
        rc.admissionNumber.toLowerCase().includes(perfSearch.toLowerCase());
      const matchGrade = perfGradeFilter === 'all' || rc.grade.toString() === perfGradeFilter;
      return matchSearch && matchGrade;
    });
  }, [reportCards, perfSearch, perfGradeFilter]);

  // Timetable for selected printable grade & stream
  const activeTimetableSlots = useMemo(() => {
    return timetableSlots.filter(s => s.grade === printableGrade && s.stream === printableStream);
  }, [timetableSlots, printableGrade, printableStream]);

  // Exam schedule for selected printable grade
  const activeExamSchedule = useMemo(() => {
    return examTimetables.filter(e => e.grade === printableGrade);
  }, [examTimetables, printableGrade]);

  // Selected grade attendance records
  const selectedClassAttendance = useMemo(() => {
    return attendanceRecords.find(a => a.grade === attendanceGrade && a.stream === attendanceStream);
  }, [attendanceRecords, attendanceGrade, attendanceStream]);

  // Performance metrics (Read-only aggregate)
  const perfMetrics = useMemo(() => {
    if (!reportCards.length) return { average: 0, highest: 0, passingCount: 0 };
    const scores = reportCards.map(r => r.overallAverage);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / scores.length);
    const highest = Math.max(...scores);
    const passingCount = reportCards.filter(r => r.overallAverage >= 50).length;
    return { average: avg, highest, passingCount };
  }, [reportCards]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Toast notification banner */}
      {actionSuccessMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-600 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================
          PORTAL EXECUTIVE HEADER & IDENTITY BANNER
          ======================================================== */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Branding + Staff Role */}
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl border border-amber-400 shadow-xs">
                <EduSmartGadsaLogo variant="horizontal" size="sm" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                  <span>School Administration Secretariat</span>
                  <span>·</span>
                  <span>Registrar's Office</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>School Admin Staff Portal</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Session
                  </span>
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Logged in as <strong className="text-white">{currentUser.name}</strong> · Senior Administrative Officer & Registrar
                </p>
              </div>
            </div>

            {/* Quick Action Badges & Clock */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono">Term 1 2026 · Week 11</span>
              </div>
              
              <button 
                onClick={() => {
                  setPrintModalType('timetable');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Timetables</span>
              </button>

              <button 
                onClick={handleOpenAddEvent}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Update Calendar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu (Clean typography, zero-pill aesthetic) */}
        <div className="border-t border-slate-800 bg-slate-950/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none py-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('work_entries')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'work_entries'
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>1. Teachers Work Entries</span>
                <span className="ml-1 text-[10px] text-slate-400 font-mono">({workEntries.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('gate_exits')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'gate_exits'
                    ? 'border-amber-400 text-amber-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <DoorOpen className="w-4 h-4" />
                <span>2. Students Gate Exits</span>
                <span className="ml-1 text-[10px] text-slate-400 font-mono">({gatePasses.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('registers')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'registers'
                    ? 'border-blue-400 text-blue-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>3. Marked Registers</span>
              </button>

              <button
                onClick={() => setActiveTab('communications')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'communications'
                    ? 'border-purple-400 text-purple-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>4. Parents Communications</span>
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'border-rose-400 text-rose-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>5. School Calendar</span>
                <span className="ml-1 text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono">In-Charge</span>
              </button>

              <button
                onClick={() => setActiveTab('performance')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'performance'
                    ? 'border-teal-400 text-teal-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>6. Student Performance</span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">(Read-Only)</span>
              </button>

              <button
                onClick={() => setActiveTab('printables')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'printables'
                    ? 'border-indigo-400 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>7. Printables Hub</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* ========================================================
          MAIN WORKSPACE CONTENT CONTAINER
          ======================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        {/* ========================================================
            TAB 1: TEACHERS WORK ENTRY ANALYSIS WINDOW
            ======================================================== */}
        {activeTab === 'work_entries' && (
          <div className="space-y-6">
            
            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Total Logged Entries</span>
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                  {workEntries.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Verified across Grades 1 to 9
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Active Teaching Staff</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                  {new Set(workEntries.map(w => w.teacherId)).size}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Reporting daily pedagogical progress
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Average Class Attendance</span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                  {Math.round(workEntries.reduce((acc, curr) => acc + (curr.learnersPresent || 35), 0) / (workEntries.length || 1))}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Learners present per lesson period
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Campus Geo-Stamping</span>
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2 font-mono text-emerald-600">
                  100%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  All work entries verified on school grounds
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex-1 relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by teacher name, staff number, subject, or strand topic..."
                  value={workSearch}
                  onChange={(e) => setWorkSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={workGradeFilter}
                  onChange={(e) => setWorkGradeFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Grades (1-9)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>

                <button
                  onClick={() => setPrintModalType('work_ledger')}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ledger</span>
                </button>
              </div>
            </div>

            {/* Work Entries Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Teachers Work Entry & CBC Delivery Ledger
                  </h3>
                  <p className="text-xs text-slate-500">
                    Showing {filteredWorkEntries.length} verified teacher log entries
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Sign-In Stamp</th>
                      <th className="py-3 px-4">Teacher Name & Staff ID</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Subject & Topic</th>
                      <th className="py-3 px-4">Learners Present</th>
                      <th className="py-3 px-4">Objectives Covered</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWorkEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900">{entry.date}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{entry.time}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{entry.teacherName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {entry.staffNo || 'TSC/VERIFIED'}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium">
                          Grade {entry.grade || '-'} · {entry.stream || 'Stream A'}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-emerald-800">{entry.subject}</div>
                          <div className="text-[11px] text-slate-600 line-clamp-1">{entry.topicTaught}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {entry.learnersPresent || 38} students
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px] line-clamp-2">
                          {entry.objectivesCovered || entry.teacherRemarks || 'Lesson delivered as per strand guide.'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedWorkEntry(entry)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
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
            TAB 2: STUDENTS GATE EXIT ANALYSIS WINDOW
            ======================================================== */}
        {activeTab === 'gate_exits' && (
          <div className="space-y-6">
            
            {/* Gate Exit Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Total Gate Passes</span>
                  <DoorOpen className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                  {gatePasses.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Authorized exit records</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Currently Departed</span>
                  <LogOut className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2 font-mono text-rose-600">
                  {gatePasses.filter(g => g.status === 'departed' || g.status === 'active').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Learners off school premises</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Safely Returned</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2 font-mono text-emerald-600">
                  {gatePasses.filter(g => g.status === 'returned').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Confirmed back on campus</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Security Status</span>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2 font-mono text-blue-700">
                  Active
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Gate officer verification synced</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex-1 relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name, gate pass code (e.g. GP-4D-8921), guardian name..."
                  value={gateSearch}
                  onChange={(e) => setGateSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={gateStatusFilter}
                  onChange={(e) => setGateStatusFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Gate Statuses</option>
                  <option value="active">Active / Approved</option>
                  <option value="departed">Departed</option>
                  <option value="returned">Returned</option>
                  <option value="overdue">Overdue</option>
                </select>

                <button
                  onClick={() => setPrintModalType('gate')}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Gate Log</span>
                </button>
              </div>
            </div>

            {/* Gate Pass Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Official Student Gate Departure & Exit Ledger
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live security roll of all students granted permission to exit the gate
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Pass Code</th>
                      <th className="py-3 px-4">Student & Class</th>
                      <th className="py-3 px-4">Time Out & Return</th>
                      <th className="py-3 px-4">Authorized Guardian</th>
                      <th className="py-3 px-4">Exit Reason</th>
                      <th className="py-3 px-4">Authorized By</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGatePasses.map(pass => (
                      <tr key={pass.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            {pass.gatePassCode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{pass.studentName}</div>
                          <div className="text-[11px] text-slate-500">
                            Grade {pass.grade} · {pass.stream}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">Out: {pass.departureTime}</div>
                          <div className="text-[11px] text-slate-500">
                            Expected: {pass.expectedReturnTime || 'End of Day'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{pass.guardianName}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{pass.guardianPhone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">
                          {pass.reason}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {pass.teacherName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            pass.status === 'returned'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : pass.status === 'departed'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {pass.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {pass.status !== 'returned' && (
                            <button
                              onClick={() => handleMarkReturned(pass.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              <span>Confirm Return</span>
                            </button>
                          )}
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
            TAB 3: MARKED REGISTERS ANALYSIS WINDOW
            ======================================================== */}
        {activeTab === 'registers' && (
          <div className="space-y-6">
            
            {/* Top Selector & Overview */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  School-Wide Daily Roll Call & Marked Class Registers
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analyze attendance registers recorded by Class Teachers across all grades.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-bold">Grade:</span>
                  <select
                    value={attendanceGrade}
                    onChange={(e) => setAttendanceGrade(Number(e.target.value) as GradeLevel)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-bold">Stream:</span>
                  <select
                    value={attendanceStream}
                    onChange={(e) => setAttendanceStream(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium"
                  >
                    {attendanceGrade <= 6
                      ? PRIMARY_STREAMS.map(s => <option key={s} value={s}>{s}</option>)
                      : JUNIOR_STREAMS.map(s => <option key={s} value={s}>{s}</option>)
                    }
                  </select>
                </div>

                <button
                  onClick={() => setPrintModalType('register')}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Register</span>
                </button>
              </div>
            </div>

            {/* Attendance Status Summary for Selected Class */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-800 font-mono">
                  {selectedClassAttendance?.summary?.present || 38}
                </div>
                <div className="text-xs text-emerald-700 font-bold uppercase mt-1">Present</div>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center">
                <div className="text-2xl font-black text-rose-800 font-mono">
                  {selectedClassAttendance?.summary?.absent || 1}
                </div>
                <div className="text-xs text-rose-700 font-bold uppercase mt-1">Absent (Unexcused)</div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                <div className="text-2xl font-black text-amber-800 font-mono">
                  {selectedClassAttendance?.summary?.late || 1}
                </div>
                <div className="text-xs text-amber-700 font-bold uppercase mt-1">Late Arrival</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                <div className="text-2xl font-black text-blue-800 font-mono">
                  {selectedClassAttendance?.summary?.excused || 1}
                </div>
                <div className="text-xs text-blue-700 font-bold uppercase mt-1">Excused Medical</div>
              </div>
            </div>

            {/* Student Roll Call Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Roll Call Register: Grade {attendanceGrade} {attendanceStream}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Marked by {selectedClassAttendance?.teacherName || 'David Kiprono (Class Teacher)'} · Session Date: {selectedClassAttendance?.date || 'Today'}
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded">
                  Rate: {selectedClassAttendance?.summary?.attendanceRate || 95}%
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 w-12">#</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Roll Status</th>
                      <th className="py-2.5 px-4">Teacher Remark</th>
                      <th className="py-2.5 px-4">Follow-Up Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedClassAttendance?.records || [
                      { studentId: 's1', studentName: 'Brian Otieno', status: 'present' as const, remarks: 'Arrived 7:35 AM' },
                      { studentId: 's2', studentName: 'Faith Wanjiku', status: 'present' as const, remarks: 'Arrived 7:40 AM' },
                      { studentId: 's3', studentName: 'Kelvin Kiprop', status: 'excused' as const, remarks: 'Authorized medical pass issued' },
                      { studentId: 's4', studentName: 'Mercy Achieng', status: 'present' as const, remarks: 'Arrived 7:30 AM' },
                      { studentId: 's5', studentName: 'Samuel Kamau', status: 'late' as const, remarks: 'Arrived 8:15 AM (Traffic delay)' },
                      { studentId: 's6', studentName: 'Grace Muthoni', status: 'absent' as const, remarks: 'Parent called for notification' }
                    ]).map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{rec.studentName}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : rec.status === 'excused'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                          {rec.remarks || 'Standard attendance'}
                        </td>
                        <td className="py-2.5 px-4 text-[11px]">
                          {rec.status === 'absent' ? (
                            <span className="text-rose-700 font-semibold">SMS Alert Sent to Guardian</span>
                          ) : (
                            <span className="text-slate-400">Normal verified</span>
                          )}
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
            TAB 4: PARENTS COMMUNICATIONS WINDOW
            ======================================================== */}
        {activeTab === 'communications' && (
          <div className="space-y-6">
            
            {/* Header + Dispatch Button */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  School-to-Parent Official Communications Hub
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Broadcast notices, fee advisories, academic clinic circulars, and emergency alerts.
                </p>
              </div>

              <button
                onClick={() => setShowNewCommModal(true)}
                className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Dispatch New Parent Circular / SMS</span>
              </button>
            </div>

            {/* Communication Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">Total Dispatched This Term</div>
                <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                  {communications.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Official circulars & notices</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">Total Parent Reach</div>
                <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
                  680 Guardians
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Primary & Junior School guardians</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">Broadcast Delivery Rate</div>
                <div className="text-2xl font-black text-blue-700 mt-2 font-mono">
                  99.8%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Direct SMS & Parent Portal Sync</div>
              </div>
            </div>

            {/* Communication Log Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h4 className="font-extrabold text-sm text-slate-900">
                  Recent Dispatches & Communication Log
                </h4>
              </div>

              <div className="divide-y divide-slate-100">
                {communications.map(comm => (
                  <div key={comm.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          comm.channel === 'SMS' 
                            ? 'bg-blue-100 text-blue-800'
                            : comm.channel === 'Email'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {comm.channel}
                        </span>
                        <h5 className="font-extrabold text-sm text-slate-900">{comm.title}</h5>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{comm.dateSent}</div>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                      {comm.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                      <div>Target: <strong className="text-slate-700">{comm.targetAudience}</strong></div>
                      <div>Recipients: <strong className="text-slate-700">{comm.recipientCount}</strong></div>
                      <div>Dispatched by: <strong className="text-slate-700">{comm.sentBy}</strong></div>
                      <div className="ml-auto text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{comm.deliveryStatus}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: SCHOOL CALENDAR & TERM PLANNER WINDOW
            (Admin staff is in charge of updating the calendar)
            ======================================================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            
            {/* Header with Authority Notice */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase tracking-wide">
                    Administrative Custody
                  </span>
                  <span className="text-xs text-slate-500">Official Term Dates, Exams & School Events</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  School Academic Calendar & Term Scheduler
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  As School Admin Staff, you are authorized to add, reschedule, update, and publish events to the school community.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintModalType('calendar')}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Calendar</span>
                </button>

                <button
                  onClick={handleOpenAddEvent}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Calendar Event</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-500 font-bold">Filter By:</span>
              <select
                value={calendarTermFilter}
                onChange={(e) => setCalendarTermFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
              >
                <option value="all">All Terms (Term 1, 2, 3)</option>
                <option value="1">Term 1 2026</option>
                <option value="2">Term 2 2026</option>
                <option value="3">Term 3 2026</option>
              </select>

              <select
                value={calendarCategoryFilter}
                onChange={(e) => setCalendarCategoryFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
              >
                <option value="all">All Categories</option>
                <option value="term_dates">Term Dates & Opening/Closing</option>
                <option value="exams">Exams & National Assessments</option>
                <option value="academic">Continuous Assessment (CATs)</option>
                <option value="parents">Parents Consultation</option>
                <option value="co_curricular">Sports & Gala</option>
                <option value="holiday">Midterm Break / Holiday</option>
              </select>

              <div className="ml-auto text-slate-500 font-mono text-[11px]">
                Showing {filteredCalendarEvents.length} scheduled events
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCalendarEvents.map(event => (
                <div 
                  key={event.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                    event.isImportant ? 'border-amber-300 ring-1 ring-amber-300/40' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        event.category === 'term_dates'
                          ? 'bg-emerald-100 text-emerald-800'
                          : event.category === 'exams'
                          ? 'bg-rose-100 text-rose-800'
                          : event.category === 'parents'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.category.replace('_', ' ')}
                      </span>

                      <span className="font-mono text-[11px] text-slate-500">
                        Term {event.term} {event.academicYear}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 leading-snug">
                      {event.title}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{event.startDate} {event.endDate !== event.startDate ? `— ${event.endDate}` : ''}</span>
                    </div>

                    {event.venue && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{event.venue}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400">
                      Audience: <strong className="text-slate-600">{event.targetAudience}</strong>
                    </div>

                    {/* Edit & Delete Controls (Only admin staff can update) */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditEvent(event)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Event"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCalendarEvent(event.id, event.title)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: STUDENT PERFORMANCE DIRECTORY (READ-ONLY AUDIT)
            (User explicitly specified: view all students performance, but CANT edit performance)
            ======================================================== */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            
            {/* Explicit Read-Only Governance Banner */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-xs">
              <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                  Institutional Academic Ledger — Read-Only Mode Enforced
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  In accordance with school policy and national curriculum integrity, marks and competency rubrics are strictly entered by subject teachers and ratified by the Dean of Studies. 
                  School Admin Staff may view, search, analyze, and print official performance reports, but <strong>cannot modify or tamper with student marks</strong>.
                </p>
              </div>
            </div>

            {/* Performance KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">School Mean Score</div>
                <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                  {perfMetrics.average}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Across all evaluated classes</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">Highest Learner Average</div>
                <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
                  {perfMetrics.highest}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Exceeding Expectations level</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">Total Active Progress Dossiers</div>
                <div className="text-2xl font-black text-blue-700 mt-2 font-mono">
                  {reportCards.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Official CBC summative records</div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex-1 relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student by name or admission number (e.g. ADM-2024-001)..."
                  value={perfSearch}
                  onChange={(e) => setPerfSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={perfGradeFilter}
                  onChange={(e) => setPerfGradeFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="all">All Grades</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>

                <button
                  onClick={() => setPrintModalType('report')}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report Cards</span>
                </button>
              </div>
            </div>

            {/* Performance Directory Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    School-Wide Learner Performance Ledger
                  </h4>
                  <p className="text-xs text-slate-500">
                    Read-only repository for administrative transcripts and certification verification
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Adm No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Grade & Stream</th>
                      <th className="py-3 px-4">Term</th>
                      <th className="py-3 px-4">Overall Score</th>
                      <th className="py-3 px-4">CBC Rubric Level</th>
                      <th className="py-3 px-4">Stream Rank</th>
                      <th className="py-3 px-4 text-right">View Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReportCards.map(rc => (
                      <tr key={rc.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {rc.admissionNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {rc.studentName}
                        </td>
                        <td className="py-3 px-4">
                          Grade {rc.grade} · {rc.stream}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {rc.term} {rc.academicYear}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-base text-slate-900">
                          {rc.overallAverage}%
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            rc.overallRubric === 'Exceeding Expectations'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rc.overallRubric === 'Meeting Expectations'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rc.overallRubric}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          #{rc.streamPosition} of {rc.totalStudentsInStream}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedStudentReport(rc)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Transcript</span>
                          </button>
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
            TAB 7: OFFICIAL PRINTABLES HUB
            (Class Timetables, Exam Timetables, Student Reports)
            ======================================================== */}
        {activeTab === 'printables' && (
          <div className="space-y-6">
            
            {/* Top Selector Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Official School Printables & Certification Dispatch
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate authorized, high-resolution printable timetables, exam rosters, and progress cards.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={printableGrade}
                  onChange={(e) => setPrintableGrade(Number(e.target.value) as GradeLevel)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>

                <select
                  value={printableStream}
                  onChange={(e) => setPrintableStream(e.target.value as StreamName)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium"
                >
                  {printableGrade <= 6
                    ? PRIMARY_STREAMS.map(s => <option key={s} value={s}>{s}</option>)
                    : JUNIOR_STREAMS.map(s => <option key={s} value={s}>{s}</option>)
                  }
                </select>
              </div>
            </div>

            {/* Three Main Printable Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 1. Class Routine Timetable */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900">Weekly Class Timetable</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Official 8-period teaching schedule for Grade {printableGrade} {printableStream} with break allocations.
                  </p>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-500">
                    <div>Periods: <strong>8 Daily Sessions</strong></div>
                    <div>Curriculum: <strong>Kenyan CBC Model</strong></div>
                    <div>Allocated Slots: <strong>{activeTimetableSlots.length} Subject Periods</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => setPrintModalType('timetable')}
                  className="mt-5 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Class Timetable</span>
                </button>
              </div>

              {/* 2. Exam Timetable */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900">Term Assessment Timetable</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Mid-Term CATs and End-Term summative exam schedule with room numbers and invigilating tutors.
                  </p>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-500">
                    <div>Target: <strong>Grade {printableGrade} Examination</strong></div>
                    <div>Papers Scheduled: <strong>{activeExamSchedule.length || 4} Examinations</strong></div>
                    <div>Invigilators: <strong>Assigned Faculty Staff</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => setPrintModalType('exam')}
                  className="mt-5 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Exam Timetable</span>
                </button>
              </div>

              {/* 3. Students Reports */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold mb-3">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900">Student Progress Dossiers</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Formal CBC formative and summative transcripts with teacher remarks, conduct evaluation, and crest.
                  </p>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-500">
                    <div>Format: <strong>Ministry CBC Dossier</strong></div>
                    <div>Available: <strong>{filteredReportCards.length} Learner Dossiers</strong></div>
                    <div>Authenticity: <strong>Signed with Official Seal</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => setPrintModalType('report')}
                  className="mt-5 w-full bg-purple-700 hover:bg-purple-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Student Report Cards</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          MODAL: ADD / EDIT CALENDAR EVENT
          ======================================================== */}
      {showNewCalendarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-base">
                  {editingCalendarEvent ? 'Edit Calendar Event' : 'Add New School Calendar Event'}
                </h3>
              </div>
              <button 
                onClick={() => setShowNewCalendarModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCalendarEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Term 1 Mid-Term Continuous Assessment Tests"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Term</label>
                  <select
                    value={eventForm.term}
                    onChange={(e) => setEventForm({ ...eventForm, term: Number(e.target.value) as 1 | 2 | 3 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value as SchoolCalendarEvent['category'] })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="term_dates">Term Dates (Opening/Closing)</option>
                    <option value="academic">Continuous Assessment (CATs)</option>
                    <option value="exams">National / Summative Exams</option>
                    <option value="parents">Parents Consultation / AGM</option>
                    <option value="co_curricular">Sports & Gala Day</option>
                    <option value="holiday">Holiday / Recess Break</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Audience</label>
                  <select
                    value={eventForm.targetAudience}
                    onChange={(e) => setEventForm({ ...eventForm, targetAudience: e.target.value as SchoolCalendarEvent['targetAudience'] })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="All School">All School</option>
                    <option value="Primary (Grades 1-6)">Primary (Grades 1-6)</option>
                    <option value="Junior School (Grades 7-9)">Junior School (Grades 7-9)</option>
                    <option value="Parents">Parents & Guardians</option>
                    <option value="Teachers & Staff">Teachers & Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Venue / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Hall / Campus Grounds"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Details</label>
                <textarea
                  rows={3}
                  placeholder="Provide schedule briefing, assembly protocols, or participant guidelines..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isImportantCheck"
                  checked={eventForm.isImportant}
                  onChange={(e) => setEventForm({ ...eventForm, isImportant: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="isImportantCheck" className="text-slate-700 font-semibold cursor-pointer">
                  Mark as High Priority / Crucial Milestone
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCalendarModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-lg font-bold shadow-xs"
                >
                  {editingCalendarEvent ? 'Save Changes' : 'Publish to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: NEW PARENT COMMUNICATION
          ======================================================== */}
      {showNewCommModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-700" />
                <h3 className="font-black text-slate-900 text-base">
                  Dispatch Parent Notice or SMS Circular
                </h3>
              </div>
              <button 
                onClick={() => setShowNewCommModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendCommunication} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Notice Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 4 Parent Academic Consultation Clinic Notice"
                  value={commForm.title}
                  onChange={(e) => setCommForm({ ...commForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Dispatch Channel</label>
                  <select
                    value={commForm.channel}
                    onChange={(e) => setCommForm({ ...commForm, channel: e.target.value as ParentCommunication['channel'] })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="Portal Circular">Portal Official Circular</option>
                    <option value="SMS">Direct Mobile SMS</option>
                    <option value="Email">Parent Email Statement</option>
                    <option value="Urgent Broadcast">Urgent Alert Broadcast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={commForm.category}
                    onChange={(e) => setCommForm({ ...commForm, category: e.target.value as ParentCommunication['category'] })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="General Notice">General School Notice</option>
                    <option value="Academic Clinic">Academic Progress Clinic</option>
                    <option value="Fee Advisory">Fee Clearance Advisory</option>
                    <option value="School Event">School Event / Gala</option>
                    <option value="Health & Safety">Health & Safety Advisory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Audience</label>
                <select
                  value={commForm.targetAudience}
                  onChange={(e) => setCommForm({ ...commForm, targetAudience: e.target.value as ParentCommunication['targetAudience'] })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="All Parents">All School Parents (Grades 1-9)</option>
                  <option value="Primary Parents">Primary School Parents (Grades 1-6)</option>
                  <option value="Junior School Parents">Junior School Parents (Grades 7-9)</option>
                  <option value="Specific Grade">Specific Grade Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Message Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type official communication text to be dispatched to parents..."
                  value={commForm.message}
                  onChange={(e) => setCommForm({ ...commForm, message: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCommModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-700 hover:bg-purple-600 text-white px-5 py-2 rounded-lg font-bold shadow-xs"
                >
                  Dispatch to Parents
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: VIEW WORK ENTRY DETAILS
          ======================================================== */}
      {selectedWorkEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Verified Pedagogical Entry
                </span>
                <h3 className="font-black text-slate-900 text-base mt-0.5">
                  Teacher Work Log Dossier
                </h3>
              </div>
              <button 
                onClick={() => setSelectedWorkEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 font-semibold">Teacher:</span>
                  <div className="font-bold text-slate-900">{selectedWorkEntry.teacherName}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Staff / TSC ID:</span>
                  <div className="font-mono text-slate-700">{selectedWorkEntry.staffNo || 'TSC/VERIFIED'}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Sign-In Time:</span>
                  <div className="font-mono text-slate-700">{selectedWorkEntry.date} at {selectedWorkEntry.time}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Campus Verification:</span>
                  <div className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Geo-Stamped</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Class & Learning Area:</span>
                <div className="font-bold text-sm text-slate-900">
                  Grade {selectedWorkEntry.grade} {selectedWorkEntry.stream} · {selectedWorkEntry.subject}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Topic / Strand Taught:</span>
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-800">
                  {selectedWorkEntry.topicTaught}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Curriculum Objectives Covered:</span>
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700">
                  {selectedWorkEntry.objectivesCovered || 'Strand competencies fully achieved as per curriculum pacing.'}
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Teacher Remarks:</span>
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 italic">
                  "{selectedWorkEntry.teacherRemarks || 'Active learner participation.'}"
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedWorkEntry(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: VIEW STUDENT TRANSCRIPT (READ-ONLY)
          ======================================================== */}
      {selectedStudentReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <EduSmartGadsaLogo variant="horizontal" size="sm" />
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Official CBC Learner Progress Transcript
                  </h3>
                  <p className="text-xs text-slate-500">
                    Read-Only Academic Record · School Registrar Archive
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div>
                <span className="text-slate-400 font-semibold">Student Name:</span>
                <div className="font-bold text-slate-900">{selectedStudentReport.studentName}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Admission No:</span>
                <div className="font-mono text-slate-700">{selectedStudentReport.admissionNumber}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Grade & Stream:</span>
                <div className="font-semibold text-slate-800">Grade {selectedStudentReport.grade} {selectedStudentReport.stream}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Overall Rubric:</span>
                <div className="font-bold text-emerald-700">{selectedStudentReport.overallRubric}</div>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Opener</th>
                    <th className="py-2.5 px-3">Mid-Term</th>
                    <th className="py-2.5 px-3">End-Term</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Rubric Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedStudentReport.subjects.map((sub, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900">{sub.subject}</td>
                      <td className="py-2 px-3 font-mono">{sub.openerScore}</td>
                      <td className="py-2 px-3 font-mono">{sub.midTermScore}</td>
                      <td className="py-2 px-3 font-mono">{sub.endTermScore}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{sub.total}%</td>
                      <td className="py-2 px-3 text-[11px] text-slate-700">{sub.rubricLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div>Class Teacher Remarks: <strong className="text-slate-800 font-normal italic">"{selectedStudentReport.classTeacherRemarks}"</strong></div>
              <div>Principal Remarks: <strong className="text-slate-800 font-normal italic">"{selectedStudentReport.headTeacherRemarks}"</strong></div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Scores cannot be edited by administrative staff</span>
              </div>

              <button
                onClick={() => {
                  setSelectedStudentReport(null);
                  setPrintModalType('report');
                }}
                className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PRINT MODAL DISPATCHER (Timetable / Exam / Report / Calendar)
          ======================================================== */}
      {printModalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <EduSmartGadsaLogo variant="horizontal" size="sm" />
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {printModalType === 'timetable' && `Official Class Routine Timetable (Grade ${printableGrade} ${printableStream})`}
                    {printModalType === 'exam' && `CBC Assessment & Examination Timetable (Grade ${printableGrade})`}
                    {printModalType === 'report' && `CBC Summative & Formative Progress Dossiers (Grade ${printableGrade})`}
                    {printModalType === 'calendar' && `Official Academic Term Calendar 2026`}
                    {printModalType === 'work_ledger' && `Teachers Work Entry & Syllabus Delivery Ledger`}
                    {printModalType === 'gate' && `Official Student Gate Exit Security Register`}
                    {printModalType === 'register' && `Marked Class Attendance Roll (Grade ${attendanceGrade} ${attendanceStream})`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Edu-Smart PORTAL by Gadsa Systems · Authorized School Seal
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPrintModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4" id="printable-area">
              
              {/* TIMETABLE PRINTABLE PREVIEW */}
              {printModalType === 'timetable' && (
                <div className="space-y-4">
                  <div className="text-center pb-3 border-b border-slate-300">
                    <h2 className="text-base font-black text-slate-900 uppercase">
                      Class Weekly Routine Schedule · Academic Year 2026
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Class: Grade {printableGrade} {printableStream} · Kenyan Competency-Based Curriculum
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-300">
                      <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-2 border border-slate-300">Day</th>
                          <th className="p-2 border border-slate-300">Period 1<br/>08:00 - 08:45</th>
                          <th className="p-2 border border-slate-300">Period 2<br/>08:45 - 09:30</th>
                          <th className="p-2 border border-slate-300 bg-amber-100/60">Break<br/>09:30 - 09:50</th>
                          <th className="p-2 border border-slate-300">Period 3<br/>09:50 - 10:35</th>
                          <th className="p-2 border border-slate-300">Period 4<br/>10:35 - 11:20</th>
                          <th className="p-2 border border-slate-300 bg-amber-100/60">Lunch<br/>12:40 - 01:40</th>
                          <th className="p-2 border border-slate-300">Period 5<br/>01:40 - 02:25</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                          <tr key={day} className="hover:bg-slate-100/50">
                            <td className="p-2 font-bold border border-slate-300 bg-slate-100">{day}</td>
                            <td className="p-2 border border-slate-300 font-semibold text-emerald-900">Mathematics</td>
                            <td className="p-2 border border-slate-300 font-semibold text-blue-900">English</td>
                            <td className="p-2 border border-slate-300 text-center font-bold text-slate-500 bg-amber-50">Tea Break</td>
                            <td className="p-2 border border-slate-300 font-semibold text-purple-900">Integrated Science</td>
                            <td className="p-2 border border-slate-300 font-semibold text-amber-900">Kiswahili</td>
                            <td className="p-2 border border-slate-300 text-center font-bold text-slate-500 bg-amber-50">Lunch Recess</td>
                            <td className="p-2 border border-slate-300 font-semibold text-rose-900">Creative Arts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs">
                    <div>
                      <div className="font-bold text-slate-800">Approved by:</div>
                      <div className="text-slate-600 mt-1">Mrs. Sarah Cherono · Academic Registrar</div>
                      <div className="text-[10px] text-slate-400 font-mono">Edu-Smart Security Hash: TIMETABLE-G{printableGrade}-2026</div>
                    </div>
                    <div className="text-right">
                      <div className="h-10 border-b border-slate-400 w-40 mb-1"></div>
                      <div className="text-slate-500 text-[11px]">Official School Stamp</div>
                    </div>
                  </div>
                </div>
              )}

              {/* EXAM TIMETABLE PREVIEW */}
              {printModalType === 'exam' && (
                <div className="space-y-4">
                  <div className="text-center pb-3 border-b border-slate-300">
                    <h2 className="text-base font-black text-slate-900 uppercase">
                      Official Assessment & Examination Schedule · Term 1 2026
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Kenyan CBC Summative Evaluation · Grade {printableGrade}
                    </p>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2 border border-slate-300">Date</th>
                        <th className="p-2 border border-slate-300">Time</th>
                        <th className="p-2 border border-slate-300">Subject / Paper</th>
                        <th className="p-2 border border-slate-300">Room / Hall</th>
                        <th className="p-2 border border-slate-300">Invigilator</th>
                        <th className="p-2 border border-slate-300">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeExamSchedule.map(exam => (
                        <tr key={exam.id} className="hover:bg-slate-100/50">
                          <td className="p-2 font-mono font-bold border border-slate-300">{exam.examDate}</td>
                          <td className="p-2 font-mono border border-slate-300">{exam.startTime} - {exam.endTime}</td>
                          <td className="p-2 font-bold text-slate-900 border border-slate-300">{exam.subject}</td>
                          <td className="p-2 border border-slate-300">{exam.room}</td>
                          <td className="p-2 border border-slate-300">{exam.invigilatorName}</td>
                          <td className="p-2 text-[11px] text-slate-600 border border-slate-300">{exam.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="text-[11px] text-slate-500 italic">
                    Note: All candidates must be seated 15 minutes before reading time. Mathematical sets required for Science and Math.
                  </div>
                </div>
              )}

              {/* REPORT CARD BATCH PREVIEW */}
              {printModalType === 'report' && (
                <div className="space-y-4">
                  <div className="text-center pb-3 border-b border-slate-300">
                    <h2 className="text-base font-black text-slate-900 uppercase">
                      Batch Student CBC Progress Dossiers
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Ready for printing {filteredReportCards.length} certified student transcripts
                    </p>
                  </div>

                  <div className="space-y-3">
                    {filteredReportCards.slice(0, 3).map(rc => (
                      <div key={rc.id} className="bg-white p-3 rounded-lg border border-slate-300 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{rc.studentName}</span>
                          <span className="text-slate-500 ml-2 font-mono">({rc.admissionNumber})</span>
                          <div className="text-[11px] text-slate-500">Grade {rc.grade} {rc.stream} · {rc.term} {rc.academicYear}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-black text-slate-900">{rc.overallAverage}%</div>
                          <div className="text-[10px] font-bold text-emerald-700">{rc.overallRubric}</div>
                        </div>
                      </div>
                    ))}
                    {filteredReportCards.length > 3 && (
                      <div className="text-center text-xs text-slate-500 italic">
                        + {filteredReportCards.length - 3} more student report cards in batch
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CALENDAR PRINTABLE PREVIEW */}
              {printModalType === 'calendar' && (
                <div className="space-y-4">
                  <div className="text-center pb-3 border-b border-slate-300">
                    <h2 className="text-base font-black text-slate-900 uppercase">
                      Official Academic Calendar · 2026 Term Sessions
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Ministry of Education & School Board of Management Term Dates
                    </p>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2 border border-slate-300">Term</th>
                        <th className="p-2 border border-slate-300">Dates</th>
                        <th className="p-2 border border-slate-300">Event Title</th>
                        <th className="p-2 border border-slate-300">Audience</th>
                        <th className="p-2 border border-slate-300">Venue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {calendarEvents.map(evt => (
                        <tr key={evt.id} className="hover:bg-slate-100/50">
                          <td className="p-2 font-bold border border-slate-300">Term {evt.term}</td>
                          <td className="p-2 font-mono border border-slate-300">{evt.startDate}</td>
                          <td className="p-2 font-bold text-slate-900 border border-slate-300">{evt.title}</td>
                          <td className="p-2 border border-slate-300">{evt.targetAudience}</td>
                          <td className="p-2 border border-slate-300">{evt.venue || 'Campus'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* WORK ENTRY LEDGER PRINTABLE PREVIEW */}
              {printModalType === 'work_ledger' && (
                <div className="space-y-4">
                  <div className="text-center pb-3 border-b border-slate-300">
                    <h2 className="text-base font-black text-slate-900 uppercase">
                      Teachers Work Entry & Curriculum Delivery Audit
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Verified CBC Lesson Entries · School Registrar Log
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-300">
                      <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-2 border border-slate-300">Date & Time</th>
                          <th className="p-2 border border-slate-300">Teacher</th>
                          <th className="p-2 border border-slate-300">Class</th>
                          <th className="p-2 border border-slate-300">Subject</th>
                          <th className="p-2 border border-slate-300">Topic Taught</th>
                          <th className="p-2 border border-slate-300">Learners</th>
                          <th className="p-2 border border-slate-300">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredWorkEntries.map(e => (
                          <tr key={e.id} className="hover:bg-slate-100/50">
                            <td className="p-2 font-mono border border-slate-300 whitespace-nowrap">{e.date} {e.time}</td>
                            <td className="p-2 font-bold border border-slate-300">{e.teacherName}</td>
                            <td className="p-2 border border-slate-300 whitespace-nowrap">Grade {e.grade} {e.stream}</td>
                            <td className="p-2 border border-slate-300">{e.subject}</td>
                            <td className="p-2 border border-slate-300">{e.topicTaught}</td>
                            <td className="p-2 font-mono text-center border border-slate-300">{e.learnersPresent || 0}</td>
                            <td className="p-2 text-[11px] text-slate-600 border border-slate-300">{e.teacherRemarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* GATE LOG PRINTABLE PREVIEW */}
              {printModalType === 'gate' && (
                <div className="space-y-4">
                  <div className="text-center pb-3 border-b border-slate-300">
                    <h2 className="text-base font-black text-slate-900 uppercase">
                      Official Students Gate Exit Security Register
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Verified Campus Departures & Authorized Guardian Pickups
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-300">
                      <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-2 border border-slate-300">Code</th>
                          <th className="p-2 border border-slate-300">Student Name</th>
                          <th className="p-2 border border-slate-300">Class</th>
                          <th className="p-2 border border-slate-300">Time Out</th>
                          <th className="p-2 border border-slate-300">Expected Return</th>
                          <th className="p-2 border border-slate-300">Guardian Contact</th>
                          <th className="p-2 border border-slate-300">Reason</th>
                          <th className="p-2 border border-slate-300">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredGatePasses.map(g => (
                          <tr key={g.id} className="hover:bg-slate-100/50">
                            <td className="p-2 font-mono font-bold border border-slate-300">{g.gatePassCode}</td>
                            <td className="p-2 font-bold border border-slate-300">{g.studentName}</td>
                            <td className="p-2 border border-slate-300 whitespace-nowrap">Grade {g.grade} {g.stream}</td>
                            <td className="p-2 font-mono border border-slate-300">{g.departureTime}</td>
                            <td className="p-2 font-mono border border-slate-300">{g.expectedReturnTime || 'End of Day'}</td>
                            <td className="p-2 border border-slate-300">{g.guardianName} ({g.guardianPhone})</td>
                            <td className="p-2 text-[11px] border border-slate-300">{g.reason}</td>
                            <td className="p-2 font-bold uppercase text-[10px] border border-slate-300">{g.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MARKED REGISTER PRINTABLE PREVIEW */}
              {printModalType === 'register' && (
                <div className="space-y-4">
                  <div className="text-center pb-3 border-b border-slate-300">
                    <h2 className="text-base font-black text-slate-900 uppercase">
                      Marked Class Attendance Register · Grade {attendanceGrade} {attendanceStream}
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Session Date: {selectedClassAttendance?.date || 'Today'} · Class Teacher: {selectedClassAttendance?.teacherName || 'Assigned Tutor'}
                    </p>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2 border border-slate-300 w-12">#</th>
                        <th className="p-2 border border-slate-300">Student Name</th>
                        <th className="p-2 border border-slate-300">Roll Status</th>
                        <th className="p-2 border border-slate-300">Teacher Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(selectedClassAttendance?.records || [
                        { studentName: 'Brian Otieno', status: 'present', remarks: 'Arrived on time' },
                        { studentName: 'Faith Wanjiku', status: 'present', remarks: 'Arrived on time' },
                        { studentName: 'Kelvin Kiprop', status: 'excused', remarks: 'Hospital dental visit' },
                        { studentName: 'Mercy Achieng', status: 'present', remarks: 'Arrived on time' }
                      ]).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-100/50">
                          <td className="p-2 font-mono text-center border border-slate-300">{i + 1}</td>
                          <td className="p-2 font-bold text-slate-900 border border-slate-300">{r.studentName}</td>
                          <td className="p-2 font-bold uppercase text-[10px] border border-slate-300">{r.status}</td>
                          <td className="p-2 text-[11px] text-slate-600 border border-slate-300">{r.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Print Action Buttons */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="text-xs text-slate-500 font-mono">
                Printer-ready formatting with official vector crest.
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintModalType(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                    showSuccess('Document sent to print spooler.');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Send to Printer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
