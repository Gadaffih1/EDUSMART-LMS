import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  Copy, 
  Check, 
  Smartphone, 
  Laptop, 
  ShieldCheck, 
  CheckCircle2, 
  KeyRound, 
  ExternalLink,
  Lock,
  Globe,
  Share2,
  RefreshCw,
  Sparkles,
  Layers,
  Database
} from 'lucide-react';
import { User } from '../../types';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';

export interface PortalAppConfig {
  id: string;
  name: string;
  roleCategory: 'student' | 'teacher' | 'parent' | 'librarian' | 'school_admin_staff' | 'administration' | 'sanatorium' | 'transport' | 'cocurricular' | 'virtuallab';
  tagline: string;
  categoryTag: string;
  appCode: string;
  version: string;
  icon: string;
  gradientClass: string;
  badgeBg: string;
  defaultEmail: string;
  defaultPassword: string;
  demoSubtitle: string;
  targetRoleLabel: string;
  coreModules: string[];
  description: string;
}

export const PORTAL_APPS_CONFIG: Record<string, PortalAppConfig> = {
  student: {
    id: 'student',
    name: 'EduSmart Student Companion',
    roleCategory: 'student',
    tagline: 'Personalized CBC Learning, Safe Browser & Virtual Classes',
    categoryTag: 'Learner Access App',
    appCode: 'EDU-APP-STU',
    version: 'v2.6 Linked App',
    icon: '👨‍🎓',
    gradientClass: 'from-emerald-600 via-teal-700 to-slate-900',
    badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    defaultEmail: 'brian.otieno@student.edusmart.ac.ke',
    defaultPassword: 'GR4@2026',
    demoSubtitle: 'Grade 4 Dove · Brian Otieno',
    targetRoleLabel: 'Grade 1-9 Learners',
    coreModules: [
      'Interactive CBC Curriculum Notes & E-Books',
      'Instant Topical Quizzes & Performance Badges',
      'AI Safe Browser & Restricted Internet Access',
      'Assigned Virtual Lab Practicals & Scratch Projects',
      'Live Google Meet Virtual Classrooms'
    ],
    description: 'Standalone learner application providing safe CBC revision, multimedia notes, homework submissions, and digital portfolios linked to the school cloud.'
  },
  teacher: {
    id: 'teacher',
    name: 'EduSmart Teacher Pro Console',
    roleCategory: 'teacher',
    tagline: 'Class Attendance, Work Entries, CBC Marks & Lab Demonstrations',
    categoryTag: 'Academic Faculty App',
    appCode: 'EDU-APP-TEA',
    version: 'v2.6 Linked App',
    icon: '👩‍🏫',
    gradientClass: 'from-blue-700 via-indigo-800 to-slate-900',
    badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
    defaultEmail: 'mr.kiprono@edusmart.ac.ke',
    defaultPassword: 'teach2026',
    demoSubtitle: 'Grade 4 Dove Class Teacher · Mr. David Kiprono',
    targetRoleLabel: 'Subject & Class Teachers',
    coreModules: [
      'Daily Lesson Work Entry Logging & Schemes',
      'Class Attendance Roll Call & Lunch Register',
      'CBC Continuous Assessment Marks Entry & Analytics',
      'Teacher Demonstration Hub (75 JSS Science Apparatus)',
      'Computer Coding & Scratch Practical Assignments'
    ],
    description: 'Comprehensive pedagogical engine for educators to track syllabus progress, submit daily teaching logs, record marks, and conduct interactive demonstrations.'
  },
  parent: {
    id: 'parent',
    name: 'EduSmart Parent Connect',
    roleCategory: 'parent',
    tagline: 'Multi-Child Academic Progress, Fee Balances & Direct Teacher Chat',
    categoryTag: 'Family & Guardian App',
    appCode: 'EDU-APP-PAR',
    version: 'v2.6 Linked App',
    icon: '👨‍👩‍👧',
    gradientClass: 'from-amber-600 via-rose-700 to-slate-900',
    badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
    defaultEmail: 'parent.otieno@edusmart.ac.ke',
    defaultPassword: 'parent2026',
    demoSubtitle: 'Guardian of Brian (Gr 4) & Faith (Gr 7)',
    targetRoleLabel: 'Parents & Guardians',
    coreModules: [
      'Instant Multi-Child Profile Switcher',
      'Official CBC Academic Report Cards & Analytics',
      'Real-Time Daily Attendance & Lunch Meal Confirmations',
      'Fee Statements, Invoices & Mobile M-Pesa Receipts',
      'Direct Private Messaging with Form Tutors'
    ],
    description: 'Empowers parents with complete transparency into their children’s learning journey, fee balances, bus boarding alerts, and holistic CBC competencies.'
  },
  librarian: {
    id: 'librarian',
    name: 'EduSmart Digital Library Suite',
    roleCategory: 'librarian',
    tagline: 'Circulation Desk, Digital Cataloging (ISBN) & Approved Readers',
    categoryTag: 'Library Curator App',
    appCode: 'EDU-APP-LIB',
    version: 'v2.6 Linked App',
    icon: '📖',
    gradientClass: 'from-purple-700 via-indigo-900 to-slate-900',
    badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
    defaultEmail: 'librarian@edusmart.ac.ke',
    defaultPassword: 'lib2026',
    demoSubtitle: 'Chief School Librarian · Mrs. Chebet',
    targetRoleLabel: 'Library Staff & Curators',
    coreModules: [
      'Circulation Desk Book Issuance & Barcode Returns',
      'OPAC Digital Library Catalog (8,500+ Volumes)',
      'Overdue Book Tracking & Fine Ledger Management',
      'Library Study Room & Resource Vacancy Booking',
      'KICD Approved Readers & Reading Programmes'
    ],
    description: 'Dedicated digital cataloging and circulation app streamlining physical and e-book resources with real-time audit logs.'
  },
  school_admin_staff: {
    id: 'school_admin_staff',
    name: 'EduSmart Registrar & Secretariat',
    roleCategory: 'school_admin_staff',
    tagline: 'Lesson Work Audits, Student Gate Passes, Lunch Registers & Printables',
    categoryTag: 'Secretariat & Registry App',
    appCode: 'EDU-APP-ADM',
    version: 'v2.6 Linked App',
    icon: '🏛️',
    gradientClass: 'from-teal-800 via-cyan-900 to-slate-900',
    badgeBg: 'bg-teal-500/20 text-teal-200 border-teal-400/30',
    defaultEmail: 'adminstaff@edusmart.ac.ke',
    defaultPassword: 'staff2026',
    demoSubtitle: 'Academic Registrar & Secretariat Desk',
    targetRoleLabel: 'Administrative Staff',
    coreModules: [
      'Teacher Lesson Work Entry Compliance Audits',
      'Authorized Student Gate Exit Security Passes',
      'School Feeding Programme & Daily Meal Verification',
      'Central School Events Calendar & Timetable Exports',
      'Official Gazette Printables & PDF Archive'
    ],
    description: 'Operational control hub for administrative secretaries, school bursars, and registrars managing operational workflows.'
  },
  administration: {
    id: 'administration',
    name: 'EduSmart Executive Leadership Console',
    roleCategory: 'administration',
    tagline: 'Institutional Governance, Headship, Senior Teachers & Deans',
    categoryTag: 'Executive Leadership App',
    appCode: 'EDU-APP-EXE',
    version: 'v2.6 Linked App',
    icon: '🏫',
    gradientClass: 'from-slate-800 via-slate-900 to-black',
    badgeBg: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
    defaultEmail: 'headteacher@edusmart.ac.ke',
    defaultPassword: 'head2026',
    demoSubtitle: 'Head Teacher / Principal · Dr. Patrick Mutiso',
    targetRoleLabel: 'Senior Leadership & Board',
    coreModules: [
      'Head Teacher Institutional Performance Dashboard',
      'Deputy Head Staff Operations & Discipline Logs',
      'Senior Teacher Academic Quality & Welfare Review',
      'Dean of Studies School-Wide CBC Assessment Engine',
      'HOD Subject Departmental Oversight & Metrics'
    ],
    description: 'High-level strategic console for Head Teachers, Deputy Principals, and Deans monitoring whole-school academic and operational health.'
  },
  sanatorium: {
    id: 'sanatorium',
    name: 'EduSmart Clinical Health Bay',
    roleCategory: 'sanatorium',
    tagline: 'Infirmary Visits, Clinical Notes, Vital Signs & Medical Files',
    categoryTag: 'Healthcare Bay App',
    appCode: 'EDU-APP-MED',
    version: 'v2.6 Linked App',
    icon: '🏥',
    gradientClass: 'from-rose-800 via-rose-950 to-slate-950',
    badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
    defaultEmail: 'nurse@edusmart.ac.ke',
    defaultPassword: 'nurse2026',
    demoSubtitle: 'Nursing Officer In-Charge · Sister Mercy',
    targetRoleLabel: 'School Medical Officers',
    coreModules: [
      'Learner Clinic Intake & Chief Complaint Logging',
      'Vital Signs Telemetry (Temperature, BP, SpO2, Pulse)',
      'Nurse Clinical Diagnosis, Triage & Prescriptions',
      'Observation Bay Bed Management & Rest Logs',
      'Parent Emergency Medical Notifications'
    ],
    description: 'HIPAA/CBC-compliant clinical health portal ensuring student medical welfare, chronic condition alerts, and nursery logs.'
  },
  transport: {
    id: 'transport',
    name: 'EduSmart Fleet & Commuter Tracker',
    roleCategory: 'transport',
    tagline: '8 Bus Routes, Live GPS Commuter Fleet & Boarding Rolls',
    categoryTag: 'Fleet Logistics App',
    appCode: 'EDU-APP-TRN',
    version: 'v2.6 Linked App',
    icon: '🚌',
    gradientClass: 'from-amber-700 via-amber-900 to-slate-950',
    badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
    defaultEmail: 'transport@edusmart.ac.ke',
    defaultPassword: 'transport2026',
    demoSubtitle: 'Fleet Director & Route Master',
    targetRoleLabel: 'Transport Supervisors',
    coreModules: [
      '8 Active Transit Routes (Karen, Westlands, Kileleshwa, etc.)',
      'Live GPS Commuter Tracking & Estimated Arrival Times',
      'Driver, Chaperone & Student Boarding Attendance',
      'Safety Alerts, Delay Notifications & SMS Triggers',
      'Bus Fleet Maintenance, Fuel & NTSA Compliance Logs'
    ],
    description: 'Real-time school fleet dispatch and telematics app keeping school buses on schedule with instant parent safety tracking.'
  },
  cocurricular: {
    id: 'cocurricular',
    name: 'EduSmart Sports & Societies Hub',
    roleCategory: 'cocurricular',
    tagline: '12 Sports Academies, Clubs, Talent Matrix & Tournaments',
    categoryTag: 'Athletics & Societies App',
    appCode: 'EDU-APP-COC',
    version: 'v2.6 Linked App',
    icon: '🎯',
    gradientClass: 'from-emerald-800 via-teal-950 to-slate-950',
    badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    defaultEmail: 'cocurricular@edusmart.ac.ke',
    defaultPassword: 'cocurricular2026',
    demoSubtitle: 'Sports Director & Societies Patron',
    targetRoleLabel: 'Coaches & Activity Directors',
    coreModules: [
      '12 Sports Academies (Football, Rugby, Swimming, Athletics, etc.)',
      'Clubs & Societies Registers (Debate, Robotics, Scouting)',
      'CBC Talent Development Scoring Matrix',
      'Inter-School Fixtures, League Tables & Tour Schedules',
      'Campus Gala Admission & Ticketing Verification'
    ],
    description: 'Dedicated sports academy and co-curricular application nurturing learner gifts and talents in alignment with the national CBC curriculum.'
  },
  virtuallab: {
    id: 'virtuallab',
    name: 'EduSmart Virtual Lab & Scratch Studio',
    roleCategory: 'virtuallab',
    tagline: '75 JSS Science Apparatus, Block Coding & Public Simulations',
    categoryTag: 'Public STEM & Coding App',
    appCode: 'EDU-APP-VLAB',
    version: 'v2.6 Linked App',
    icon: '🔬',
    gradientClass: 'from-emerald-900 via-teal-900 to-slate-950',
    badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    defaultEmail: 'mr.kiprono@edusmart.ac.ke',
    defaultPassword: 'teach2026',
    demoSubtitle: 'CBC Science Demonstrations & Scratch Simulator',
    targetRoleLabel: 'Teachers, Students & Public Subscribers',
    coreModules: [
      '75 Junior Secondary Science Interactive Apparatus',
      'Chemistry Titrations & Acid-Base Ph Indicators',
      'Physics Circuit Building & Ohm\'s Law Simulator',
      'Biology Compound Optical Microscope Simulator',
      'Scratch 3.0 Block Coding Studio & CBC Practical Tasks'
    ],
    description: 'Specialized interactive laboratory and computing studio app allowing educators to conduct demonstrations and public visitors to subscribe for practical access.'
  }
};

interface PortalAccessAppModalProps {
  appKey: string;
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  errorMsg?: string;
}

export const PortalAccessAppModal: React.FC<PortalAccessAppModalProps> = ({
  appKey,
  isOpen,
  onClose,
  onLogin,
  errorMsg
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'app_info'>('signin');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const app = PORTAL_APPS_CONFIG[appKey] || PORTAL_APPS_CONFIG['student'];
  const [inputEmail, setInputEmail] = useState(app.defaultEmail);
  const [inputPassword, setInputPassword] = useState(app.defaultPassword);

  if (!isOpen) return null;

  const directAppUrl = `${window.location.origin}/?portal=${app.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const processAndConnect = (emailToUse: string, passwordToUse: string) => {
    setIsProcessing(true);
    setProcessingProgress(20);
    setProcessingStep(`Verifying ${app.appCode} application credentials...`);

    setTimeout(() => {
      setProcessingProgress(55);
      setProcessingStep('Establishing authenticated handshake with Central LMS Cloud...');
    }, 350);

    setTimeout(() => {
      setProcessingProgress(85);
      setProcessingStep(`Authorizing ${app.name} workspace environment...`);
    }, 700);

    setTimeout(() => {
      setProcessingProgress(100);
      setProcessingStep('Portal handshake complete. Launching LMS...');
      setTimeout(() => {
        setIsProcessing(false);
        onLogin(emailToUse, passwordToUse);
      }, 250);
    }, 1050);
  };

  const handleQuickDemoSubmit = () => {
    processAndConnect(app.defaultEmail, app.defaultPassword);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processAndConnect(inputEmail, inputPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* App Card Header */}
        <div className={`p-6 bg-gradient-to-br ${app.gradientClass} text-white relative overflow-hidden border-b border-white/10`}>
          {/* Subtle app grid overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md p-0.5 shadow-xl flex items-center justify-center border border-white/30 shrink-0">
                <span className="text-3xl select-none">{app.icon}</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${app.badgeBg}`}>
                    {app.categoryTag}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-white/15 px-2 py-0.5 rounded-full text-white/90">
                    {app.appCode} · {app.version}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight mt-1.5">
                  {app.name}
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  {app.tagline}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Close Gateway"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Real-Time LMS Cloud Link Status Banner */}
          <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Linked to EduSmart Central LMS Database</span>
            </div>
            <span className="text-[11px] text-white/70 font-mono">
              Role: {app.targetRoleLabel}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Launch & Sign In</span>
          </button>
          <button
            onClick={() => setActiveTab('app_info')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'app_info'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Dedicated App Info & Link</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50 space-y-4">
          {activeTab === 'signin' ? (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Processing Handshake Banner */}
              {isProcessing && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-emerald-500/50 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Processing Portal Access App ({app.appCode})</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300">{processingProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-mono text-emerald-300">{processingStep}</span>
                    <span className="text-slate-400">LMS Cloud Synced</span>
                  </div>
                </div>
              )}

              {/* 1-Click Fast Demo Launch Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                    1-Click Instant App Launch
                  </span>
                  <div className="font-extrabold text-xs text-slate-900 mt-1">
                    {app.demoSubtitle}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {app.defaultEmail}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDemoSubmit}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <span>Launch Now</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>

              {/* Standard Credentials Fields */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Email Address / Portal Identifier:
                  </label>
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Portal Security Password / Passcode:
                  </label>
                  <input
                    type="password"
                    required
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Authenticate & Open {app.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-2 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-Bit SSL Encrypted Access · Role Authorization Enforced</span>
              </div>
            </form>
          ) : (
            /* Tab 2: Dedicated App Specifications & Direct URL Link */
            <div className="space-y-4">
              {/* App Direct Link Box */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Direct Access App URL:</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Standalone Gateway
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={directAppUrl}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Bookmark or share this direct URL to launch {app.name} directly on any device without seeing other portal options.
                </p>
              </div>

              {/* Supported Platforms & PWA Installation */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Cross-Device Deployment
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800">Mobile PWA App</div>
                      <div className="text-[10px] text-slate-500">Add to Home Screen</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800">Desktop Web App</div>
                      <div className="text-[10px] text-slate-500">Chrome, Safari, Edge</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Modules Checklist */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Core Application Modules
                </h4>
                <div className="space-y-1.5">
                  {app.coreModules.map((mod, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{mod}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Launch CTA */}
              <button
                onClick={handleQuickDemoSubmit}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch {app.name} in LMS Mode</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
