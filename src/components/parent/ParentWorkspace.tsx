import React, { useState } from 'react';
import { 
  User, 
  QuizAttempt, 
  AttendanceRecord, 
  GateExitPass, 
  ReportCard, 
  Announcement, 
  ChatMessage,
  GradeLevel,
  StreamName
} from '../../types';
import { Storage } from '../../utils/storage';
import { PerformanceCharts } from '../student/PerformanceCharts';
import { PeriodicReportsModule } from '../student/PeriodicReportsModule';
import { EPortfolioModule } from '../student/EPortfolioModule';
import { ReportingHub } from '../reports/ReportingHub';
import { AchievementSystem } from '../student/AchievementSystem';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { SanatoriumSection } from '../sanatorium/SanatoriumSection';
import { 
  Home,
  Users, 
  GraduationCap, 
  TrendingUp, 
  ClipboardCheck, 
  FileText, 
  Calendar,
  CreditCard,
  MessageSquare,
  Bell,
  CalendarDays,
  Bus,
  DoorOpen,
  Trophy,
  FileSpreadsheet,
  BookOpen,
  Printer, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Send, 
  ShieldCheck, 
  Phone, 
  Award, 
  ChevronRight,
  UserCheck,
  FolderGit2,
  Sparkles,
  User as UserIcon,
  Settings,
  LogOut,
  Search,
  Plus,
  Check,
  AlertTriangle,
  Download,
  Receipt,
  MapPin,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  ShieldAlert,
  Info,
  HeartPulse
} from 'lucide-react';

interface ParentWorkspaceProps {
  currentUser: User;
  onLogout?: () => void;
}

// 20 Exact Visible Buttons Navigation Types
export type ParentNavigationTab = 
  | 'dashboard'             // 1. Dashboard
  | 'my_children'           // 2. My Children
  | 'performance'           // 3. Academic Performance
  | 'attendance'            // 4. Attendance
  | 'assignments'           // 5. Assignments
  | 'timetable'             // 6. Timetable
  | 'fees'                  // 7. Fees & Payments
  | 'messages'              // 8. Messages
  | 'announcements'         // 9. School Announcements
  | 'calendar'              // 10. School Calendar
  | 'transport'             // 11. Transport
  | 'gate_records'          // 12. Gate / Exit Records
  | 'sanatorium'            // 13. Sanatorium & Clinic Visits
  | 'achievements'          // 14. Achievements
  | 'discipline'            // 15. Behaviour & Discipline
  | 'resources'             // 16. Learning Resources
  | 'reports'               // 17. Reports
  | 'notifications'         // 18. Notifications
  | 'profile'               // 19. My Profile
  | 'settings'              // 20. Settings
  | 'sign_out';             // 21. Sign Out

interface AbsenceExplanation {
  id: string;
  childId: string;
  childName: string;
  date: string;
  reasonCategory: 'Medical' | 'Family Emergency' | 'Bereavement' | 'Travel' | 'Other';
  explanation: string;
  submittedAt: string;
  status: 'Pending' | 'Approved by Teacher';
}

interface GatePermissionRequest {
  id: string;
  childId: string;
  childName: string;
  expectedDepartureDate: string;
  expectedDepartureTime: string;
  reason: string;
  pickupPerson: string;
  pickupPhone: string;
  status: 'Pending Class Teacher Approval' | 'Approved & Sent to Gate';
  submittedAt: string;
}

interface FeeTransaction {
  id: string;
  childId: string;
  term: string;
  date: string;
  amount: number;
  reference: string;
  method: 'M-Pesa Express' | 'Direct Bank Deposit' | 'School Pay Slip';
  status: 'Completed' | 'Pending';
}

export const ParentWorkspace: React.FC<ParentWorkspaceProps> = ({ currentUser, onLogout }) => {
  // Children belonging to this parent
  const myChildren = Storage.getParentChildren(currentUser);

  // Multi-Child Selector state: 'all' or specific student ID
  const [selectedChildId, setSelectedChildId] = useState<string>('all');

  // Currently active child (or undefined when 'all' is selected)
  const selectedChild = selectedChildId === 'all' 
    ? undefined 
    : myChildren.find(c => c.id === selectedChildId) || myChildren[0];

  // Active Main Navigation Tab (defaults to 1. Dashboard)
  const [activeTab, setActiveTab] = useState<ParentNavigationTab>('dashboard');

  // Handle direct tab navigation from notification items
  React.useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (tab) {
        if (['dashboard', 'my_children', 'performance', 'attendance', 'assignments', 'timetable', 'fees', 'messages', 'announcements', 'calendar', 'transport', 'gate_records', 'achievements', 'discipline', 'resources', 'reports', 'notifications'].includes(tab)) {
          setActiveTab(tab as ParentNavigationTab);
        } else if (tab === 'grades' || tab === 'results') {
          setActiveTab('performance');
        }
      }
    };
    window.addEventListener('workspace-nav-tab', handleNavEvent);
    return () => window.removeEventListener('workspace-nav-tab', handleNavEvent);
  }, []);

  // Interactive Fee Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payChildId, setPayChildId] = useState<string>(myChildren[0]?.id || '');
  const [payAmount, setPayAmount] = useState<string>('15000');
  const [payPhone, setPayPhone] = useState<string>(currentUser.phone || '+254 722 123 456');
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<FeeTransaction | null>(null);

  // Absence Explanation State
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceChildId, setAbsenceChildId] = useState<string>(myChildren[0]?.id || '');
  const [absenceDate, setAbsenceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [absenceCategory, setAbsenceCategory] = useState<'Medical' | 'Family Emergency' | 'Bereavement' | 'Travel' | 'Other'>('Medical');
  const [absenceNotes, setAbsenceNotes] = useState<string>('');
  const [submittedAbsences, setSubmittedAbsences] = useState<AbsenceExplanation[]>([
    {
      id: 'abs-01',
      childId: myChildren[0]?.id || 'usr-stu-brian',
      childName: myChildren[0]?.name || 'Brian Otieno',
      date: '2026-09-18',
      reasonCategory: 'Medical',
      explanation: 'Attended scheduled dental checkup at Nairobi Hospital. Doctor sick sheet provided.',
      submittedAt: '2026-09-18 08:15 AM',
      status: 'Approved by Teacher'
    }
  ]);
  const [absenceSuccessMessage, setAbsenceSuccessMessage] = useState<string | null>(null);

  // Gate Exit / Leave Permission Request State
  const [showGateReqModal, setShowGateReqModal] = useState(false);
  const [gateReqChildId, setGateReqChildId] = useState<string>(myChildren[0]?.id || '');
  const [gateReqDate, setGateReqDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [gateReqTime, setGateReqTime] = useState<string>('14:30');
  const [gateReqReason, setGateReqReason] = useState<string>('Specialist clinic consultation');
  const [gateReqPickup, setGateReqPickup] = useState<string>(currentUser.name);
  const [gateReqPhone, setGateReqPhone] = useState<string>(currentUser.phone || '+254 722 123 456');
  const [gatePermissionRequests, setGatePermissionRequests] = useState<GatePermissionRequest[]>([
    {
      id: 'req-01',
      childId: myChildren[0]?.id || 'usr-stu-brian',
      childName: myChildren[0]?.name || 'Brian Otieno',
      expectedDepartureDate: '2026-09-29',
      expectedDepartureTime: '13:00',
      reason: 'Urgent optical referral at Aga Khan University Hospital',
      pickupPerson: currentUser.name,
      pickupPhone: currentUser.phone || '+254 722 123 456',
      status: 'Approved & Sent to Gate',
      submittedAt: '2026-09-28 16:20'
    }
  ]);
  const [gateReqSuccessMessage, setGateReqSuccessMessage] = useState<string | null>(null);

  // Acknowledged Announcements State
  const [acknowledgedAnnouncements, setAcknowledgedAnnouncements] = useState<Record<string, string>>({
    'ann-term3-fee': '2026-09-20 09:12 AM',
    'ann-sports-day': '2026-09-24 14:05 PM'
  });

  // Chat with Class Teacher State
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const primaryGrade = selectedChild?.grade || myChildren[0]?.grade || 4;
    const primaryStream = selectedChild?.stream || myChildren[0]?.stream || 'Dove';
    return Storage.getChatMessages(primaryGrade, primaryStream);
  });

  // Fee Transactions Log
  const [feeTransactions, setFeeTransactions] = useState<FeeTransaction[]>([
    {
      id: 'txn-mp-9021',
      childId: myChildren[0]?.id || 'usr-stu-brian',
      term: 'Term 3 2026',
      date: '2026-09-02',
      amount: 45000,
      reference: 'QKB74921XZ',
      method: 'M-Pesa Express',
      status: 'Completed'
    },
    {
      id: 'txn-mp-8410',
      childId: myChildren[1]?.id || 'usr-stu-faith',
      term: 'Term 3 2026',
      date: '2026-09-03',
      amount: 52000,
      reference: 'QKB88102PA',
      method: 'Direct Bank Deposit',
      status: 'Completed'
    }
  ]);

  // Sign out confirmation modal
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<FeeTransaction | null>(null);
  const [passToPrint, setPassToPrint] = useState<GateExitPass | null>(null);

  // Settings State
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [gateAlertsEnabled, setGateAlertsEnabled] = useState(true);
  const [languagePreference, setLanguagePreference] = useState('English');

  // Filtered Data based on child selection
  const relevantChildren = selectedChild ? [selectedChild] : myChildren;

  // Gate Passes
  const allGatePasses = Storage.getGatePasses();
  const relevantGatePasses = allGatePasses.filter(p => {
    if (selectedChild) {
      return p.studentId === selectedChild.id || p.studentName.toLowerCase().includes(selectedChild.name.toLowerCase());
    }
    return myChildren.some(c => p.studentId === c.id || p.studentName.toLowerCase().includes(c.name.toLowerCase()));
  });

  // Announcements
  const allAnnouncements = Storage.getAnnouncements();
  const relevantAnnouncements = allAnnouncements.filter(a => {
    if (selectedChild) {
      return !a.targetGrade || a.targetGrade === selectedChild.grade;
    }
    return true;
  });

  // Notifications
  const [notifications, setNotifications] = useState(() => Storage.getNotifications(currentUser));

  // Handle Mark Notification Read
  const handleMarkNotificationRead = (notifId: string) => {
    Storage.markNotificationAsRead(notifId, currentUser.id);
    setNotifications(Storage.getNotifications(currentUser));
  };

  // Handle Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const childForMsg = selectedChild || myChildren[0];
    if (!childForMsg) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: `${currentUser.name} (Parent of ${childForMsg.name})`,
      senderRole: 'parent',
      grade: childForMsg.grade || 4,
      stream: childForMsg.stream || 'Dove',
      recipientName: 'Class Teacher',
      message: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isDirect: true
    };

    Storage.sendChatMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
    setMessageInput('');
  };

  // Handle Fee Payment Submission
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) return;

    const targetChild = myChildren.find(c => c.id === payChildId) || myChildren[0];
    const newTxn: FeeTransaction = {
      id: `txn-mp-${Date.now()}`,
      childId: targetChild.id,
      term: 'Term 3 2026',
      date: new Date().toISOString().split('T')[0],
      amount: amountNum,
      reference: `MPESA-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      method: 'M-Pesa Express',
      status: 'Completed'
    };

    setFeeTransactions(prev => [newTxn, ...prev]);
    setPaymentSuccessReceipt(newTxn);
    setShowPaymentModal(false);
  };

  // Handle Absence Explanation Submission
  const handleSubmitAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceNotes.trim()) return;

    const targetChild = myChildren.find(c => c.id === absenceChildId) || myChildren[0];
    const newRecord: AbsenceExplanation = {
      id: `abs-${Date.now()}`,
      childId: targetChild.id,
      childName: targetChild.name,
      date: absenceDate,
      reasonCategory: absenceCategory,
      explanation: absenceNotes.trim(),
      submittedAt: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      status: 'Pending'
    };

    setSubmittedAbsences(prev => [newRecord, ...prev]);
    setAbsenceSuccessMessage(`Absence explanation submitted to ${targetChild.name}'s class teacher.`);
    setShowAbsenceModal(false);
    setAbsenceNotes('');
    setTimeout(() => setAbsenceSuccessMessage(null), 5000);
  };

  // Handle Gate Leave Permission Request
  const handleSubmitGateReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateReqReason.trim()) return;

    const targetChild = myChildren.find(c => c.id === gateReqChildId) || myChildren[0];
    const newReq: GatePermissionRequest = {
      id: `req-${Date.now()}`,
      childId: targetChild.id,
      childName: targetChild.name,
      expectedDepartureDate: gateReqDate,
      expectedDepartureTime: gateReqTime,
      reason: gateReqReason.trim(),
      pickupPerson: gateReqPickup.trim(),
      pickupPhone: gateReqPhone.trim(),
      status: 'Pending Class Teacher Approval',
      submittedAt: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
    };

    setGatePermissionRequests(prev => [newReq, ...prev]);
    setGateReqSuccessMessage(`Gate pass clearance requested for ${targetChild.name}. School gate and Class Teacher notified.`);
    setShowGateReqModal(false);
    setGateReqReason('');
    setTimeout(() => setGateReqSuccessMessage(null), 5000);
  };

  // Handle Acknowledge Announcement
  const handleAcknowledgeNotice = (annId: string) => {
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    setAcknowledgedAnnouncements(prev => ({ ...prev, [annId]: timestamp }));
  };

  // Sign out handler
  const handlePerformSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      Storage.setCurrentUser(null);
      window.location.reload();
    }
  };

  // Exact 20 Navigation Buttons Definitions
  const navigationItems: { key: ParentNavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'dashboard', label: '1. Dashboard', icon: <Home className="w-4 h-4 text-emerald-400" /> },
    { key: 'my_children', label: '2. My Children', icon: <Users className="w-4 h-4 text-blue-400" />, badge: `${myChildren.length}` },
    { key: 'performance', label: '3. Academic Performance', icon: <TrendingUp className="w-4 h-4 text-indigo-400" /> },
    { key: 'attendance', label: '4. Attendance', icon: <ClipboardCheck className="w-4 h-4 text-teal-400" /> },
    { key: 'assignments', label: '5. Assignments', icon: <FileText className="w-4 h-4 text-amber-400" /> },
    { key: 'timetable', label: '6. Timetable', icon: <Calendar className="w-4 h-4 text-purple-400" /> },
    { key: 'fees', label: '7. Fees & Payments', icon: <CreditCard className="w-4 h-4 text-emerald-400" /> },
    { key: 'messages', label: '8. Messages', icon: <MessageSquare className="w-4 h-4 text-cyan-400" />, badge: `${messages.length}` },
    { key: 'announcements', label: '9. School Announcements', icon: <Bell className="w-4 h-4 text-rose-400" /> },
    { key: 'calendar', label: '10. School Calendar', icon: <CalendarDays className="w-4 h-4 text-orange-400" /> },
    { key: 'transport', label: '11. Transport', icon: <Bus className="w-4 h-4 text-yellow-400" /> },
    { key: 'gate_records', label: '12. Gate / Exit Records', icon: <DoorOpen className="w-4 h-4 text-rose-400" /> },
    { key: 'sanatorium', label: '13. Sanatorium Visits', icon: <HeartPulse className="w-4 h-4 text-rose-400" /> },
    { key: 'achievements', label: '14. Achievements', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    { key: 'discipline', label: '15. Behaviour & Discipline', icon: <ShieldAlert className="w-4 h-4 text-emerald-400" /> },
    { key: 'resources', label: '16. Learning Resources', icon: <BookOpen className="w-4 h-4 text-blue-400" /> },
    { key: 'reports', label: '17. Reports', icon: <FileSpreadsheet className="w-4 h-4 text-indigo-400" /> },
    { key: 'notifications', label: '18. Notifications', icon: <Bell className="w-4 h-4 text-red-400" />, badge: `${notifications.filter(n => !n.readByUserIds.includes(currentUser.id)).length || ''}` },
    { key: 'profile', label: '19. My Profile', icon: <UserIcon className="w-4 h-4 text-slate-400" /> },
    { key: 'settings', label: '20. Settings', icon: <Settings className="w-4 h-4 text-slate-400" /> },
    { key: 'sign_out', label: '21. Sign Out', icon: <LogOut className="w-4 h-4 text-rose-400" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* ========================================================
          TOP HEADER & MULTIPLE CHILDREN SELECTOR (ALL CHILDREN ▼)
          ======================================================== */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl border border-white/20 shadow-xs hidden sm:block">
              <EduSmartGadsaLogo variant="horizontal" size="xs" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-emerald-400">
              <Users className="w-4 h-4 text-emerald-300" />
              <span>Parent Portal · Family Academic Gateway</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Monitor learning performance across all your children, inspect attendance registers, track fee clearances, communicate with teachers, and review official CBC progress dossiers.
          </p>
          <div className="text-[11px] text-emerald-300 font-mono flex items-center gap-2 pt-1">
            <span>Primary Contact: {currentUser.phone || '+254 722 123 456'}</span>
            <span>·</span>
            <span>{myChildren.length} Enrolled Learners</span>
          </div>
        </div>

        {/* The Exact CHILD SELECTOR requested by user */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0 min-w-[280px] z-10 space-y-2">
          <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Viewing Child:</span>
            </span>
            <span className="text-[10px] text-slate-300 font-mono">{myChildren.length} Registered</span>
          </div>

          {/* Child Dropdown / Pill Switcher */}
          <div className="relative">
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 text-white border border-emerald-400/50 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="all">👨👩👧 Viewing: All Children ▼</option>
              {myChildren.map((child) => (
                <option key={child.id} value={child.id}>
                  👤 {child.name} — Grade {child.grade}{child.stream ? ` (${child.stream})` : ''} · {child.admissionNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Child Switcher Pills */}
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              onClick={() => setSelectedChildId('all')}
              className={`px-3 py-1.5 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between ${
                selectedChildId === 'all'
                  ? 'bg-emerald-500 text-white shadow-2xs'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <span>All Children Aggregate</span>
              {selectedChildId === 'all' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
            </button>

            {myChildren.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-3 py-1.5 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between ${
                  selectedChildId === child.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                }`}
              >
                <div>
                  <div className="font-extrabold">{child.name}</div>
                  <div className="text-[10px] opacity-80 font-normal">
                    Grade {child.grade} {child.stream} · {child.admissionNumber}
                  </div>
                </div>
                {selectedChildId === child.id && <CheckCircle className="w-3.5 h-3.5 text-white shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Child Active Context Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shadow-2xs">
            {selectedChild ? selectedChild.name.charAt(0) : '👨‍👩‍👧'}
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span>{selectedChild ? selectedChild.name : 'All Children (Family Aggregate)'}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">
                {selectedChild ? `Grade ${selectedChild.grade} ${selectedChild.stream}` : `${myChildren.length} Learners`}
              </span>
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              {selectedChild ? (
                <>Admission: <span className="font-mono font-semibold text-slate-800">{selectedChild.admissionNumber || 'ADM/2023/0412'}</span> · Class Teacher: <span className="text-slate-800 font-medium">Mr. David Kiprono</span></>
              ) : (
                <>Viewing aggregated performance, attendance roll-calls, fee statements, and schedules across your family.</>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPayChildId(selectedChild?.id || myChildren[0]?.id || '');
              setShowPaymentModal(true);
            }}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pay School Fees</span>
          </button>
          <button
            onClick={() => {
              setAbsenceChildId(selectedChild?.id || myChildren[0]?.id || '');
              setShowAbsenceModal(true);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Submit Absence Reason</span>
          </button>
        </div>
      </div>

      {/* Global Success Toasts */}
      {absenceSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{absenceSuccessMessage}</span>
        </div>
      )}

      {gateReqSuccessMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-300 rounded-xl text-xs font-bold text-blue-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{gateReqSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================
          THE 20 EXACT VISIBLE NAVIGATION BUTTONS
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Parent Portal Navigation Menu (20 Visible Modules)</span>
          </span>
          <span className="text-[11px] text-emerald-700 font-bold">
            Active: {navigationItems.find(i => i.key === activeTab)?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {navigationItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  if (item.key === 'sign_out') {
                    setShowSignOutConfirm(true);
                  } else {
                    setActiveTab(item.key);
                  }
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 text-xs font-bold ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-1 ring-emerald-400'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20' : 'bg-white shadow-2xs'}`}>
                    {item.icon}
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          1. 🏠 DASHBOARD (WITH ⭐ DASHBOARD QUICK ACTIONS)
          ======================================================== */}
      {activeTab === 'dashboard' && (
        <section className="space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Children Enrolled</div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">{myChildren.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Primary & Junior secondary</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Term 3 Fee Clearance</div>
              <div className="text-2xl font-black font-mono text-emerald-700 mt-1">100%</div>
              <div className="text-xs text-emerald-600 mt-0.5">Zero arrears on file</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Family Attendance Rate</div>
              <div className="text-2xl font-black font-mono text-blue-700 mt-1">98.4%</div>
              <div className="text-xs text-slate-500 mt-0.5">Daily roll call verified</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Unread Circulars</div>
              <div className="text-2xl font-black font-mono text-amber-600 mt-1">
                {relevantAnnouncements.length - Object.keys(acknowledgedAnnouncements).length}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Notices requiring review</div>
            </div>
          </div>

          {/* ⭐ EXACT DASHBOARD QUICK ACTIONS REQUESTED BY USER */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>⭐ Dashboard Quick Actions</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Direct shortcuts to frequently accessed student records, communications, and administrative services.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                12 Priority Shortcuts
              </span>
            </div>

            {/* The 12 Quick Action Cards Arranged Exactly as Specified */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              
              {/* Row 1 */}
              <button
                onClick={() => setActiveTab('my_children')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ My Children ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Profiles, classes, & admission details
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('attendance')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ Attendance ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Daily roll call logs & absence forms
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('performance')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ Academic Performance ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    CBC strand metrics & topical quizzes
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('assignments')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ Assignments ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Active homework tasks & deadlines
                  </div>
                </div>
              </button>

              {/* Row 2 */}
              <button
                onClick={() => setActiveTab('fees')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ Fees & Payments ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Invoices, statements & M-Pesa pay
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('timetable')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ Timetable ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Daily class schedule & period slots
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('gate_records')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ Gate / Exit Records ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Departure passes & security codes
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ Messages ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Direct teacher messaging channel
                  </div>
                </div>
              </button>

              {/* Row 3 */}
              <button
                onClick={() => setActiveTab('announcements')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ Announcements ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    School circulars & formal notices
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ School Calendar ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Term dates, exams & school events
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ Reports ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    CBC report cards & PDF downloads
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900">
                    [ Notifications ]
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    SMS and app alerts from school
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity Feeds: Gate Passes & Notices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gate Passes Status */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <DoorOpen className="w-4 h-4 text-rose-500" />
                  <span>Recent Gate Departures</span>
                </h3>
                <button
                  onClick={() => setActiveTab('gate_records')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {relevantGatePasses.length > 0 ? (
                <div className="space-y-2.5">
                  {relevantGatePasses.slice(0, 3).map((pass) => (
                    <div key={pass.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{pass.studentName}</div>
                        <div className="text-[11px] text-slate-500">Reason: {pass.reason}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Departed: {pass.departureTime} · Code: {pass.gatePassCode}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        pass.status === 'returned' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {pass.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">No gate departure slips recorded this week.</div>
              )}
            </div>

            {/* School Circulars Feeds */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-red-500" />
                  <span>Latest School Announcements</span>
                </h3>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {relevantAnnouncements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 leading-snug">{ann.title}</div>
                      <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{ann.content}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">{ann.createdAt} · {ann.author}</div>
                    </div>
                    {acknowledgedAnnouncements[ann.id] ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 shrink-0">
                        Acknowledged
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledgeNotice(ann.id)}
                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold shrink-0"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          2. 👤 MY CHILDREN (DETAILED PROFILES)
          ======================================================== */}
      {activeTab === 'my_children' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Enrolled Children & Learner Profiles</h2>
              <p className="text-xs text-slate-500">Official student registry and classroom assignment under your guardianship.</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold">
              {myChildren.length} Active Students
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {myChildren.map((child) => {
              const attempts = Storage.getQuizAttempts(child.id);
              const passRate = attempts.length > 0 
                ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100) 
                : 90;

              return (
                <div key={child.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-900 flex items-center justify-center font-extrabold text-xl shadow-2xs border border-emerald-200">
                        {child.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{child.name}</h3>
                        <div className="text-xs text-slate-500 font-mono">ADM: {child.admissionNumber || 'ADM/2026/0412'}</div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-1 inline-block">
                          Grade {child.grade} ({child.stream} Stream)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Class Teacher:</span>
                        <strong className="text-slate-800">Mr. David Kiprono</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Curriculum Strand:</span>
                        <span className="text-slate-700 font-semibold">{child.grade && child.grade > 6 ? 'Junior Secondary' : 'Primary CBC'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Term 3 Attendance:</span>
                        <strong className="text-emerald-700 font-mono">98% (Exemplary)</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Assessments Taken:</span>
                        <span className="font-mono font-bold text-slate-800">{attempts.length || 4} Quizzes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Mean Mastery:</span>
                        <span className="font-mono font-bold text-indigo-700">{passRate}% Pass Rate</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedChildId(child.id);
                        setActiveTab('performance');
                      }}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors text-center"
                    >
                      View Academics
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChildId(child.id);
                        setActiveTab('attendance');
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Attendance
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          3. 📊 ACADEMIC PERFORMANCE
          ======================================================== */}
      {activeTab === 'performance' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                CBC Assessment & Competency Analytics
              </h2>
              <p className="text-xs text-slate-500">
                {selectedChild ? `Continuous assessment records for ${selectedChild.name}` : 'Showing aggregated performance for all enrolled children.'}
              </p>
            </div>
            {selectedChild && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-mono font-bold">
                Grade {selectedChild.grade} · {selectedChild.stream} Stream
              </span>
            )}
          </div>

          {/* Charts Integration */}
          <PerformanceCharts 
            quizAttempts={selectedChild ? Storage.getQuizAttempts(selectedChild.id) : Storage.getQuizAttempts()} 
            studentGrade={selectedChild?.grade || 4} 
            studentName={selectedChild?.name || 'All Children'}
          />
        </section>
      )}

      {/* ========================================================
          4. 📋 ATTENDANCE (WITH SUBMIT ABSENCE EXPLANATION)
          ======================================================== */}
      {activeTab === 'attendance' && (
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Daily Attendance Registers & Roll Call</h2>
              <p className="text-xs text-slate-500">
                Track morning roll calls, late arrivals, excused sick leaves, and unexcused absences.
              </p>
            </div>
            <button
              onClick={() => setShowAbsenceModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Absence Explanation</span>
            </button>
          </div>

          {/* Absence Explanations Submitted */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-teal-600" />
              <span>Parent Absence Explanations & Medical Notes ({submittedAbsences.length})</span>
            </h3>

            <div className="space-y-2">
              {submittedAbsences.map((abs) => (
                <div key={abs.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{abs.childName} · Date of Absence: <span className="font-mono text-emerald-800">{abs.date}</span></div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{abs.explanation}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">Submitted: {abs.submittedAt} · Category: {abs.reasonCategory}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase shrink-0 ${
                    abs.status === 'Approved by Teacher' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {abs.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Roll Call Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
              Verified Daily Roll Call Ledger
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Learner</th>
                  <th className="py-2.5 px-4">Class</th>
                  <th className="py-2.5 px-4">Roll Call Status</th>
                  <th className="py-2.5 px-4">Class Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {relevantChildren.flatMap(c => {
                  const summary = Storage.getStudentAttendanceSummary(c.id);
                  return summary.history.slice(0, 5).map(h => ({
                    childName: c.name,
                    grade: c.grade,
                    stream: c.stream,
                    ...h
                  }));
                }).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-4 font-mono text-slate-500">{item.date}</td>
                    <td className="py-2 px-4 font-bold text-slate-900">{item.childName}</td>
                    <td className="py-2 px-4 text-slate-600">Grade {item.grade} ({item.stream})</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.status === 'present' ? 'bg-emerald-100 text-emerald-800' : item.status === 'excused' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-500">{item.remarks || 'Present on time for morning assembly'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          5. 📝 ASSIGNMENTS
          ======================================================== */}
      {activeTab === 'assignments' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Homework & Strand Assignments</h2>
              <p className="text-xs text-slate-500">Review homework deadlines and submission status for your children.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantChildren.flatMap(c => {
              const list = Storage.getAssignments(c.grade);
              return list.map(a => ({ ...a, childName: c.name }));
            }).map((assign) => (
              <div key={assign.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-emerald-700 uppercase tracking-wider">{assign.subject}</span>
                    <span className="text-slate-400 font-mono text-[10px]">Due: {assign.dueDate}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{assign.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{assign.instructions}</p>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Assigned to: <strong className="text-slate-800">{assign.childName}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Completed & Submitted</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Teacher Evaluation: 92/100</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          6. 📅 TIMETABLE
          ======================================================== */}
      {activeTab === 'timetable' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Weekly Class Timetable & Periods</h2>
              <p className="text-xs text-slate-500">
                Weekly lesson schedule for {selectedChild ? `Grade ${selectedChild.grade} (${selectedChild.stream})` : 'your children'}.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Period Time</th>
                  <th className="py-2.5 px-4">Monday</th>
                  <th className="py-2.5 px-4">Tuesday</th>
                  <th className="py-2.5 px-4">Wednesday</th>
                  <th className="py-2.5 px-4">Thursday</th>
                  <th className="py-2.5 px-4">Friday</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">08:00 - 08:40</td>
                  <td className="py-2.5 px-4 font-semibold text-blue-700">Mathematics</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-700">Integrated Science</td>
                  <td className="py-2.5 px-4 font-semibold text-purple-700">English</td>
                  <td className="py-2.5 px-4 font-semibold text-blue-700">Mathematics</td>
                  <td className="py-2.5 px-4 font-semibold text-teal-700">Kiswahili</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">08:40 - 09:20</td>
                  <td className="py-2.5 px-4 font-semibold text-purple-700">English</td>
                  <td className="py-2.5 px-4 font-semibold text-blue-700">Mathematics</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-700">Integrated Science</td>
                  <td className="py-2.5 px-4 font-semibold text-amber-700">Social Studies</td>
                  <td className="py-2.5 px-4 font-semibold text-indigo-700">Creative Arts</td>
                </tr>
                <tr className="bg-slate-50/80 font-bold text-slate-500">
                  <td className="py-1 px-4 font-mono text-[10px]">09:20 - 09:40</td>
                  <td colSpan={5} className="py-1 px-4 text-center text-[10px] tracking-wider uppercase">Morning Break & Snack</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">09:40 - 10:20</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-700">Integrated Science</td>
                  <td className="py-2.5 px-4 font-semibold text-teal-700">Kiswahili</td>
                  <td className="py-2.5 px-4 font-semibold text-blue-700">Mathematics</td>
                  <td className="py-2.5 px-4 font-semibold text-purple-700">English</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-700">Agriculture</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">10:20 - 11:00</td>
                  <td className="py-2.5 px-4 font-semibold text-amber-700">Social Studies</td>
                  <td className="py-2.5 px-4 font-semibold text-purple-700">Religious Ed.</td>
                  <td className="py-2.5 px-4 font-semibold text-teal-700">Kiswahili</td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-700">Integrated Science</td>
                  <td className="py-2.5 px-4 font-semibold text-blue-700">Mathematics</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          7. 💳 FEES & PAYMENTS (WITH M-PESA & RECEIPT)
          ======================================================== */}
      {activeTab === 'fees' && (
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Fee Statement & Digital Payments</h2>
              <p className="text-xs text-slate-500">
                Tuition invoices, CBC activity fees, transaction history, and instant M-Pesa clearance.
              </p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Make Fee Payment (M-Pesa / Bank)</span>
            </button>
          </div>

          {/* Fee Cards Per Child */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myChildren.map((c) => (
              <div key={c.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{c.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    Term 3 Cleared
                  </span>
                </div>
                <div className="text-xs text-slate-500">Grade {c.grade} · {c.admissionNumber}</div>
                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tuition & Operations:</span>
                    <span className="font-mono text-slate-900">KES 38,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CBC Activity & Lab:</span>
                    <span className="font-mono text-slate-900">KES 8,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lunch & Nutrition:</span>
                    <span className="font-mono text-slate-900">KES 12,000</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 font-bold">
                    <span>Balance Due:</span>
                    <span className="font-mono text-emerald-700">KES 0.00</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Receipts Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Verified Payment Receipts Ledger</span>
              <span className="text-slate-500 font-normal">Official digital receipts</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4">Term</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {feeTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{txn.date}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{txn.reference}</td>
                    <td className="py-2.5 px-4 text-slate-600">{txn.term}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-800">KES {txn.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-slate-600">{txn.method}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800">
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setReceiptToPrint(txn)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Printer className="w-3 h-3 text-slate-600" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          8. 💬 MESSAGES (DIRECT TEACHER CHAT)
          ======================================================== */}
      {activeTab === 'messages' && (
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col h-[560px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                👨🏫
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">
                  Direct Inquiries: Class Teacher (Mr. David Kiprono)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Messaging channel regarding {selectedChild?.name || 'your children'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold">
              Active Channel
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m) => {
              const isMe = m.senderId === currentUser.id;
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                    isMe ? 'bg-emerald-700 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-2xs'
                  }`}>
                    <div className="text-[10px] opacity-75 font-semibold">{m.senderName}</div>
                    <div className="leading-relaxed">{m.message}</div>
                    <div className="text-[9px] opacity-60 text-right font-mono">{m.timestamp}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Send message to Class Teacher regarding ${selectedChild?.name || 'learner'}...`}
              className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </section>
      )}

      {/* ========================================================
          9. 📢 SCHOOL ANNOUNCEMENTS (WITH ACKNOWLEDGE NOTICE)
          ======================================================== */}
      {activeTab === 'announcements' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">School Notices & Administrative Circulars</h2>
              <p className="text-xs text-slate-500">Official directives from the Principal and Academic Deans.</p>
            </div>
          </div>

          <div className="space-y-3">
            {relevantAnnouncements.map((ann) => {
              const isAcknowledged = !!acknowledgedAnnouncements[ann.id];
              return (
                <div key={ann.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className="font-mono text-slate-400 text-[10px]">{ann.createdAt}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {ann.targetGrade ? `Grade ${ann.targetGrade}` : 'All School'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{ann.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.content}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {isAcknowledged ? (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Acknowledged</span>
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {acknowledgedAnnouncements[ann.id]}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAcknowledgeNotice(ann.id)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                        >
                          Acknowledge Receipt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          10. 📆 SCHOOL CALENDAR
          ======================================================== */}
      {activeTab === 'calendar' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Term 3 2026 Academic Calendar</h2>
              <p className="text-xs text-slate-500">Ministry of Education term dates, exams, and parent consultation days.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold uppercase text-emerald-700">Term Commencement</div>
              <div className="font-extrabold text-slate-900 text-sm">Term 3 Opening Day</div>
              <div className="text-xs text-slate-500 font-mono">August 25, 2026</div>
              <p className="text-xs text-slate-600">All primary and junior secondary students resumed full classes.</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold uppercase text-blue-700">Academic Midterm</div>
              <div className="font-extrabold text-slate-900 text-sm">Midterm Break</div>
              <div className="text-xs text-slate-500 font-mono">Sept 21 - Sept 25, 2026</div>
              <p className="text-xs text-slate-600">Short breather for all learners before KPSEA rehearsals.</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold uppercase text-purple-700">Parent Engagement</div>
              <div className="font-extrabold text-slate-900 text-sm">Parent Consultation Day</div>
              <div className="text-xs text-slate-500 font-mono">October 14, 2026</div>
              <p className="text-xs text-slate-600">One-on-one academic conferencing with class teachers.</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold uppercase text-amber-700">National Summative</div>
              <div className="font-extrabold text-slate-900 text-sm">KPSEA & End-Term Exams</div>
              <div className="text-xs text-slate-500 font-mono">Oct 28 - Nov 05, 2026</div>
              <p className="text-xs text-slate-600">Grade 6 National assessments and school-wide finals.</p>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          11. 🚌 TRANSPORT
          ======================================================== */}
      {activeTab === 'transport' && (() => {
        const studentTransport = selectedChild ? Storage.getStudentTransportProfiles(selectedChild.id)[0] : undefined;
        const todayTrips = selectedChild ? Storage.getTransportTripRecords(undefined, undefined, undefined, selectedChild.id) : [];
        const latestTrip = todayTrips[0];
        const route = studentTransport ? Storage.getTransportRoutes().find(r => r.id === studentTransport.routeId) : undefined;
        const bus = studentTransport ? Storage.getSchoolBuses().find(b => b.registrationNumber === studentTransport.busPlate) : undefined;
        const routeAlerts = studentTransport ? Storage.getTransportAlerts().filter(a => a.routeId === studentTransport.routeId) : [];

        return (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">School Transport & Bus Commute</h2>
                <p className="text-xs text-slate-500">
                  Live boarding status, route schedule, GPS fleet tracking, and driver/chaperone contact details for {selectedChild?.name || 'your child'}.
                </p>
              </div>
              {studentTransport ? (
                <span className="px-3 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start">
                  <Bus className="w-3.5 h-3.5 text-amber-600" />
                  <span>{studentTransport.routeName}</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">
                  Self / Private Commuter
                </span>
              )}
            </div>

            {/* Live Boarding Status Banner */}
            {studentTransport && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-900 via-slate-900 to-slate-950 text-white shadow-md border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
                    🚌
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                        Today's Live Commute Status
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {latestTrip?.status || 'Active & Registered'}
                      </span>
                    </div>
                    <div className="text-sm font-bold mt-0.5 text-white">
                      {latestTrip 
                        ? `${selectedChild?.name} was marked ${latestTrip.status} at ${latestTrip.timestamp}`
                        : `${selectedChild?.name} is registered for daily commuter pickup on ${studentTransport.busNumber}`}
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Pickup: <strong>{studentTransport.pickupStop}</strong> ({studentTransport.morningPickupTime}) · Drop-off: <strong>{studentTransport.dropoffStop}</strong> ({studentTransport.afternoonDropoffTime})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-mono text-amber-200 border border-white/10">
                    Seat: <strong>{studentTransport.seatNumber}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Crew & Bus Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-slate-400">Assigned Bus</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      NTSA Certified
                    </span>
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-2">
                    {studentTransport?.busPlate || 'KDG 218M'}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {bus?.model || '33-Seater Isuzu School Coach'} · Speed Governor Verified
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current GPS Status:</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{bus?.gpsTrackingStatus || 'Active & Transmitting'}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-700 font-medium truncate max-w-[150px]">{bus?.currentLocation || 'Campus Bus Bay'}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-extrabold uppercase text-slate-400">Lead Driver In-Charge</div>
                  <div className="text-base font-extrabold text-slate-900 mt-2">
                    {route?.driverName || 'Mr. Josephat Kipkoech'}
                  </div>
                  <div className="text-xs text-slate-600">Licensed Professional School Bus Operator (12+ yrs experience)</div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between">
                  <span className="text-slate-500">Direct Phone:</span>
                  <a href={`tel:${route?.driverPhone || '+254712345678'}`} className="text-blue-700 font-mono font-bold hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{route?.driverPhone || '+254 712 345 678'}</span>
                  </a>
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-extrabold uppercase text-slate-400">Bus Chaperone</div>
                  <div className="text-base font-extrabold text-slate-900 mt-2">
                    {route?.assistantName || 'Ms. Mary Wambui'}
                  </div>
                  <div className="text-xs text-slate-600">Student Roll Call & Boarding Safety Supervisor</div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between">
                  <span className="text-slate-500">Chaperone Phone:</span>
                  <a href={`tel:${route?.assistantPhone || '+254723456789'}`} className="text-blue-700 font-mono font-bold hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{route?.assistantPhone || '+254 723 456 789'}</span>
                  </a>
                </div>
              </div>

            </div>

            {/* Special Instructions & Route Alerts */}
            {studentTransport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">Transport Protocols & Authorized Collectors</h4>
                  <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                    <div>Authorized for Collection: <strong>{studentTransport.authorizedCollector}</strong></div>
                    <div>Emergency Contact: <strong className="font-mono text-blue-700">{studentTransport.parentPhone}</strong></div>
                    {studentTransport.specialInstructions && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-medium">
                        ⚠️ <strong>Special Care Note:</strong> {studentTransport.specialInstructions}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">Recent Route Alerts & SMS Dispatches</h4>
                  <div className="space-y-2 pt-1 text-xs">
                    {routeAlerts.slice(0, 2).map(alt => (
                      <div key={alt.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="font-bold text-slate-900">{alt.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{alt.message}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">{alt.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </section>
        );
      })()}

      {/* ========================================================
          12. 🚪 GATE / EXIT RECORDS (WITH REQUEST PERMISSION)
          ======================================================== */}
      {activeTab === 'gate_records' && (
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Gate Departure Logs & Exit Passes</h2>
              <p className="text-xs text-slate-500">
                Official records of authorized gate departures, security verification codes, and return logs.
              </p>
            </div>
            <button
              onClick={() => setShowGateReqModal(true)}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Request Leave / Gate Pass</span>
            </button>
          </div>

          {/* Pending Permission Requests */}
          {gatePermissionRequests.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Parent Gate Permission Requests ({gatePermissionRequests.length})</span>
              </h3>

              <div className="space-y-2">
                {gatePermissionRequests.map((req) => (
                  <div key={req.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{req.childName} · Planned Departure: <span className="font-mono text-slate-700">{req.expectedDepartureDate} at {req.expectedDepartureTime}</span></div>
                      <div className="text-[11px] text-slate-600 mt-0.5">Reason: {req.reason}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">Pickup Person: {req.pickupPerson} ({req.pickupPhone}) · Submitted: {req.submittedAt}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-blue-100 text-blue-800 shrink-0">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gate Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
              Compound Exit Security Passes
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Learner</th>
                  <th className="py-2.5 px-4">Security Code</th>
                  <th className="py-2.5 px-4">Reason</th>
                  <th className="py-2.5 px-4">Departure</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-center">Pass Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {relevantGatePasses.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{p.departureTime.split(' ')[0] || '2026-09-29'}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{p.studentName}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-amber-700">{p.gatePassCode}</td>
                    <td className="py-2.5 px-4 text-slate-700">{p.reason}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{p.departureTime}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        p.status === 'returned' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setPassToPrint(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Printer className="w-3 h-3 text-slate-600" />
                        <span>Pass</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          13. 🏥 SANATORIUM & CLINIC VISITS (CONFIDENTIAL FOR CHILD)
          ======================================================== */}
      {activeTab === 'sanatorium' && (
        <section className="space-y-6">
          {/* Child-Specific Linking Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter Sanatorium Records by Child:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedChildId('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedChildId === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Registered Children ({myChildren.length})
                </button>
                {myChildren.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedChildId === child.id
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{child.name}</span>
                    <span className="text-[10px] opacity-80">(Gr {child.grade} {child.stream})</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedChild ? (
              <div className="text-xs text-slate-600">
                Child Link: <strong className="text-slate-900">{selectedChild.name}</strong> · Admission: <span className="font-mono font-bold text-rose-800">{selectedChild.admissionNumber}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Showing clinical history for <strong className="text-slate-800">all {myChildren.length} registered children</strong>
              </div>
            )}
          </div>

          <SanatoriumSection
            currentUser={currentUser}
            canRecord={false}
            filterStudentId={selectedChild ? selectedChild.id : undefined}
            allowedStudentIds={myChildren.map(c => c.id)}
            title={selectedChild ? `${selectedChild.name}'s Medical & Sanatorium Visits` : 'Children Sanatorium & Medical History'}
            subtitle={`Confidential clinical attendance records, vital signs checks, nurse in-charge notes, and recommendations strictly linked to ${selectedChild ? selectedChild.name : 'your registered child(ren)'}.`}
          />
        </section>
      )}

      {/* ========================================================
          14. 🏆 ACHIEVEMENTS (DIGITAL BADGES)
          ======================================================== */}
      {activeTab === 'achievements' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Student Honors & Digital Badges</h2>
              <p className="text-xs text-slate-500">
                Earned competency badges (Top Scorer, Perfect Attendance, Resource Explorer) for your children.
              </p>
            </div>
          </div>

          <AchievementSystem currentUser={selectedChild || myChildren[0]} />
        </section>
      )}

      {/* ========================================================
          14. 🗒️ BEHAVIOUR & DISCIPLINE
          ======================================================== */}
      {activeTab === 'discipline' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Student Conduct & Character Development</h2>
              <p className="text-xs text-slate-500">Commendations, moral etiquette evaluations, and pastoral notes.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold">
              Clean Conduct Record
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs font-extrabold text-emerald-700 uppercase flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Academic Diligence Commendation</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Consistently Positive Learning Demeanor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Teachers report attentive classroom participation, respectful peer collaboration, and diligent compliance with compound rules.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                Evaluated by: Deputy Head (Discipline & Pastoral Care)
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs font-extrabold text-blue-700 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Digital Citizenship & Safe Search</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Exemplary Online Etiquette</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero search filtration violations recorded. All curriculum searches adhere strictly to school child protection guardrails.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                Safety Audit Status: 100% Compliant
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          15. 📚 LEARNING RESOURCES
          ======================================================== */}
      {activeTab === 'resources' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Curriculum Digital Learning Materials</h2>
              <p className="text-xs text-slate-500">
                Inspect the structured reading notes, audio podcasts, and video demonstrations available to your child.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Storage.getNotes(selectedChild?.grade || 4).map((note) => (
              <div key={note.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-indigo-700 uppercase">
                    <span>{note.subject}</span>
                    <span className="font-mono text-slate-400">Grade {note.grade}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm mt-1">{note.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{note.summary}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Author: {note.author}</span>
                  <span className="text-emerald-700 font-bold">CBC Verified</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          16. 📄 REPORTS (REPORTING HUB)
          ======================================================== */}
      {activeTab === 'reports' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Official Termly Report Cards & Research Dossiers</h2>
              <p className="text-xs text-slate-500">
                Download printable PDF summary reports, competency radars, and research analysis.
              </p>
            </div>
          </div>

          <ReportingHub currentUser={currentUser} initialStudentId={selectedChild?.id} />
        </section>
      )}

      {/* ========================================================
          17. 🔔 NOTIFICATIONS
          ======================================================== */}
      {activeTab === 'notifications' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Notifications & Alert Center</h2>
              <p className="text-xs text-slate-500">SMS alerts, gate exit notifications, fee reminders, and quiz results.</p>
            </div>
            <button
              onClick={() => {
                notifications.forEach(n => Storage.markNotificationAsRead(n.id, currentUser.id));
                setNotifications(Storage.getNotifications(currentUser));
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              Mark All As Read
            </button>
          </div>

          <div className="space-y-2.5">
            {notifications.map((notif) => {
              const isRead = notif.readByUserIds.includes(currentUser.id);
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                    isRead ? 'bg-white border-slate-200' : 'bg-emerald-50/60 border-emerald-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${isRead ? 'bg-slate-100 text-slate-500' : 'bg-emerald-600 text-white'}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{notif.title}</div>
                      <div className="text-slate-600 mt-0.5 leading-relaxed">{notif.message}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">{notif.createdAt} · Priority: {notif.urgency}</div>
                    </div>
                  </div>

                  {!isRead && (
                    <button
                      onClick={() => handleMarkNotificationRead(notif.id)}
                      className="text-xs font-bold text-emerald-800 hover:underline shrink-0"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================
          18. 👤 MY PROFILE
          ======================================================== */}
      {activeTab === 'profile' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-extrabold text-slate-900">Parent / Guardian Profile</h2>
            <p className="text-xs text-slate-500">Official contact records registered with EduSmart Academy.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Guardian Name</span>
              <span className="font-bold text-slate-900 text-sm">{currentUser.name}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{currentUser.email}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Phone (SMS Alerts)</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{currentUser.phone || '+254 722 123 456'}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">National ID Number</span>
              <span className="font-bold text-slate-900 text-sm font-mono">24891028</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Residential Estate</span>
              <span className="font-bold text-slate-900 text-sm">South C Estate, Nairobi</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Dependents</span>
              <span className="font-bold text-emerald-800 text-sm">{myChildren.map(c => c.name).join(', ')}</span>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          19. ⚙️ SETTINGS
          ======================================================== */}
      {activeTab === 'settings' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-extrabold text-slate-900">Communication & Portal Settings</h2>
            <p className="text-xs text-slate-500">Configure alert channels and language preferences.</p>
          </div>

          <div className="space-y-4 max-w-xl text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Instant SMS Notifications</div>
                <div className="text-[11px] text-slate-500">Receive departure, fee and emergency alerts on phone</div>
              </div>
              <input
                type="checkbox"
                checked={smsAlertsEnabled}
                onChange={(e) => setSmsAlertsEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Email Circulars & Receipts</div>
                <div className="text-[11px] text-slate-500">Weekly progress summaries and fee payment slips</div>
              </div>
              <input
                type="checkbox"
                checked={emailAlertsEnabled}
                onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Gate Security Real-Time Alerts</div>
                <div className="text-[11px] text-slate-500">Immediate verification code dispatch upon compound exit</div>
              </div>
              <input
                type="checkbox"
                checked={gateAlertsEnabled}
                onChange={(e) => setGateAlertsEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-bold text-slate-900 block">Preferred Interface Language</label>
              <select
                value={languagePreference}
                onChange={(e) => setLanguagePreference(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="English">English</option>
                <option value="Kiswahili">Kiswahili</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          20. 🚪 SIGN OUT CONFIRMATION MODAL
          ======================================================== */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Sign Out of Parent Portal?</h3>
              <p className="text-xs text-slate-500 mt-1">You will be redirected back to the login welcome screen.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handlePerformSignOut}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Fee Payment Simulator */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Pay School Fees Online</h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Learner *</label>
                <select
                  value={payChildId}
                  onChange={(e) => setPayChildId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {myChildren.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — Grade {c.grade} ({c.stream})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount to Pay (KES) *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  placeholder="e.g. 15000"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">M-Pesa Phone Number *</label>
                <input
                  type="text"
                  required
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  placeholder="+254 7..."
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                Prompt will be sent to your Safaricom SIM. Once PIN is entered, fee receipt is generated instantly.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <span>Authorize M-Pesa KES {Number(payAmount || 0).toLocaleString()}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Submit Absence Reason */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Submit Absence Explanation</h3>
              </div>
              <button onClick={() => setShowAbsenceModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitAbsence} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Learner *</label>
                <select
                  value={absenceChildId}
                  onChange={(e) => setAbsenceChildId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {myChildren.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — Grade {c.grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Date of Absence *</label>
                <input
                  type="date"
                  required
                  value={absenceDate}
                  onChange={(e) => setAbsenceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason Category *</label>
                <select
                  value={absenceCategory}
                  onChange={(e) => setAbsenceCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="Medical">Medical / Doctor Appointment</option>
                  <option value="Family Emergency">Family Emergency</option>
                  <option value="Bereavement">Bereavement</option>
                  <option value="Travel">Travel / Relocation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Explanation & Doctor Note *</label>
                <textarea
                  rows={3}
                  required
                  value={absenceNotes}
                  onChange={(e) => setAbsenceNotes(e.target.value)}
                  placeholder="Provide clinical or parental details for the class teacher register..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAbsenceModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Submit to Class Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request Gate Exit Permission */}
      {showGateReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Request Compound Leave / Gate Pass</h3>
              </div>
              <button onClick={() => setShowGateReqModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitGateReq} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Learner *</label>
                <select
                  value={gateReqChildId}
                  onChange={(e) => setGateReqChildId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {myChildren.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — Grade {c.grade}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={gateReqDate}
                    onChange={(e) => setGateReqDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expected Time *</label>
                  <input
                    type="time"
                    required
                    value={gateReqTime}
                    onChange={(e) => setGateReqTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Gate Leave *</label>
                <input
                  type="text"
                  required
                  value={gateReqReason}
                  onChange={(e) => setGateReqReason(e.target.value)}
                  placeholder="e.g. Medical clinic, visa appointment, family emergency"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pickup Person *</label>
                  <input
                    type="text"
                    required
                    value={gateReqPickup}
                    onChange={(e) => setGateReqPickup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pickup Phone *</label>
                  <input
                    type="text"
                    required
                    value={gateReqPhone}
                    onChange={(e) => setGateReqPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGateReqModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Submit Gate Pass Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: OFFICIAL PRINTABLE FEE PAYMENT RECEIPT
          ======================================================== */}
      {receiptToPrint && (() => {
        const student = myChildren.find(c => c.id === receiptToPrint.childId) || myChildren[0];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-300 overflow-hidden print:m-0 print:border-none print:shadow-none">
              
              {/* Top Action Bar */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                    Official Bursar Payment Receipt
                  </span>
                </div>
                <button
                  onClick={() => setReceiptToPrint(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Printable Document Body */}
              <div className="p-6 sm:p-8 space-y-5 bg-white text-xs text-slate-700">
                {/* School Official Logo & Header */}
                <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                  <div className="flex justify-center mb-2">
                    <EduSmartGadsaLogo variant="full" size="md" />
                  </div>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                    Edu-Smart PORTAL · By Gadsa Systems
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase">
                    Official Fee Payment Receipt
                  </h3>
                  <div className="font-mono text-xs font-bold text-emerald-700">
                    Receipt Ref: {receiptToPrint.reference}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Transaction ID: {receiptToPrint.id} · Issued: {receiptToPrint.date}
                  </div>
                </div>

                {/* Pupil & Payer Information Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Student Name:</span>
                    <strong className="text-slate-900 text-sm block">{student.name}</strong>
                    <span className="font-mono text-slate-500 text-[11px]">{student.admissionNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Grade & Cohort:</span>
                    <strong className="text-slate-900 text-sm block">Grade {student.grade} ({student.stream})</strong>
                    <span className="text-slate-500 text-[11px]">{receiptToPrint.term}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Payer / Guardian:</span>
                    <strong className="text-slate-900 block">{currentUser.name}</strong>
                    <span className="text-slate-500 text-[11px] font-mono">{currentUser.phone || '+254 722 123 456'}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Payment Method:</span>
                    <strong className="text-slate-900 block">{receiptToPrint.method}</strong>
                    <span className="text-emerald-700 font-bold uppercase text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded font-mono">
                      {receiptToPrint.status}
                    </span>
                  </div>
                </div>

                {/* Amount Box */}
                <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-xl text-center space-y-1">
                  <div className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                    Total Amount Received
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-800">
                    KES {receiptToPrint.amount.toLocaleString()}.00
                  </div>
                  <div className="text-[11px] text-emerald-950 font-medium italic">
                    Account Status: Verified & Cleared in School ERP
                  </div>
                </div>

                {/* School Bursar Stamp & Signatures */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
                  <div>
                    <div>Authorized by Accounts Office:</div>
                    <strong className="text-slate-900 block mt-0.5">Mr. Philip Ndegwa</strong>
                    <div className="font-mono">Chief School Accountant</div>
                  </div>
                  <div className="text-right">
                    <div>Official Stamp:</div>
                    <div className="mt-3 border-2 border-dashed border-emerald-600 rounded-lg p-1.5 inline-block text-emerald-800 font-bold font-mono text-[9px] uppercase text-center">
                      <div>EDUSMART BURSAR</div>
                      <div>OFFICIAL DIGITAL RECEIPT</div>
                      <div>VERIFIED & STAMPED</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setReceiptToPrint(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official Receipt</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================
          MODAL: OFFICIAL PRINTABLE STUDENT GATE PASS SLIP
          ======================================================== */}
      {passToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-300 overflow-hidden print:m-0 print:border-none print:shadow-none">
            
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EduSmartGadsaLogo variant="horizontal" size="xs" />
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800 ml-2">
                  Gate Security Exit Pass
                </span>
              </div>
              <button
                onClick={() => setPassToPrint(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Printable Pass Body */}
            <div className="p-6 space-y-4 bg-white text-xs">
              <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                <div className="flex justify-center mb-2">
                  <EduSmartGadsaLogo variant="full" size="sm" />
                </div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                  Edu-Smart PORTAL · By Gadsa Systems
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase">
                  Official Student Gate Exit Pass
                </h3>
                <div className="font-mono text-xs font-bold text-rose-700">
                  Security Code: {passToPrint.gatePassCode}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Verified at Main Gate · Compound Security Desk
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700">Pass Clearance:</span>
                <span className="font-mono font-bold uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                  {passToPrint.status}
                </span>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Student Name</span>
                  <strong className="text-sm text-slate-900 block">{passToPrint.studentName}</strong>
                  <span className="text-slate-500 font-mono text-[11px]">ADM: {passToPrint.admissionNumber || 'ADM/2026/0412'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Grade & Stream</span>
                  <strong className="text-sm text-slate-900 block">Grade {passToPrint.grade} ({passToPrint.stream})</strong>
                  <span className="text-slate-500 text-[11px]">Teacher: {passToPrint.teacherName}</span>
                </div>
              </div>

              {/* Timings */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-semibold block">Departure Time</span>
                  <strong className="text-slate-900">{passToPrint.departureTime}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-semibold block">Expected Return</span>
                  <strong className="text-rose-800">{passToPrint.expectedReturnTime || 'End of Day'}</strong>
                </div>
              </div>

              {/* Reason */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Reason for Exit</span>
                <p className="text-slate-900 font-medium">{passToPrint.reason}</p>
              </div>

              {/* Guardian Verification */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Collecting Guardian</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{passToPrint.guardianName} ({passToPrint.guardianRelationship || 'Guardian'})</span>
                  <span className="font-mono text-slate-700">{passToPrint.guardianPhone}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
                <div>
                  <div>Authorizing Faculty:</div>
                  <strong className="text-slate-900 block mt-0.5">{passToPrint.teacherName}</strong>
                </div>
                <div className="text-right">
                  <div>Gate Security Stamp:</div>
                  <div className="mt-4 border-b border-slate-400 w-28 ml-auto" />
                  <div className="mt-0.5">Verified & Signed</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPassToPrint(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Gate Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
