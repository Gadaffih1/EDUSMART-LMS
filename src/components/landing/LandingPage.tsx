import React, { useState, useEffect } from 'react';
import { GradeLevel, User, PRIMARY_STREAMS, JUNIOR_STREAMS, SchoolCalendarEvent } from '../../types';
import { Storage } from '../../utils/storage';
import { INITIAL_USERS } from '../../data/initialData';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { EventTicketModal } from '../events/EventTicketModal';
import { SchoolEventsManager } from '../events/SchoolEventsManager';
import { VirtualLabSubscriptionModal } from '../virtuallab/VirtualLabSubscriptionModal';
import { PortalAccessAppModal, PORTAL_APPS_CONFIG } from './PortalAccessAppModal';
import { 
  GraduationCap, 
  Lock, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  Users, 
  Sparkles, 
  School, 
  KeyRound, 
  LogIn,
  FileSpreadsheet,
  Megaphone,
  Calendar,
  Phone,
  BookMarked,
  Info,
  Newspaper,
  Shield,
  Layers,
  ChevronRight,
  Clock,
  MapPin,
  Mail,
  Send,
  Check,
  X,
  ExternalLink,
  Library,
  ShieldCheck,
  FileText,
  CalendarDays,
  Menu,
  Utensils,
  Bus,
  HeartPulse,
  Trophy,
  ClipboardCheck,
  Ticket,
  CreditCard,
  Smartphone,
  Database,
  Share2,
  RefreshCw,
  Zap,
  Laptop,
  Copy
} from 'lucide-react';

interface LandingPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  // Modal states
  const [activeModal, setActiveModal] = useState<
    | 'student' 
    | 'teacher' 
    | 'parent' 
    | 'librarian' 
    | 'school_admin_staff'
    | 'sanatorium'
    | 'transport'
    | 'cocurricular'
    | 'administration' 
    | 'grade_pass'
    | 'learning_resources'
    | 'school_news'
    | 'events'
    | 'library'
    | 'contact_us'
    | 'about_school'
    | 'privacy'
    | 'terms'
    | 'help'
    | null
  >(null);

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(4);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gradePasscode, setGradePasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '', role: 'Parent' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTicketEvent, setSelectedTicketEvent] = useState<SchoolCalendarEvent | null>(null);
  const [landingEvents, setLandingEvents] = useState<SchoolCalendarEvent[]>(() => Storage.getCalendarEvents());
  const [isVirtualLabSubscriptionOpen, setIsVirtualLabSubscriptionOpen] = useState(false);
  const [selectedPortalAppKey, setSelectedPortalAppKey] = useState<string | null>(null);
  const [isPortalAppModalOpen, setIsPortalAppModalOpen] = useState(false);
  const [processingPortalAppKey, setProcessingPortalAppKey] = useState<string | null>(null);
  const [portalProcessingStep, setPortalProcessingStep] = useState<string>('');
  const [portalProcessingProgress, setPortalProcessingProgress] = useState<number>(0);
  const [copiedPortalKey, setCopiedPortalKey] = useState<string | null>(null);
  const [isAppDirectoryOpen, setIsAppDirectoryOpen] = useState(false);

  // Auto-detect portal access app from URL query parameters (e.g. ?portal=student or ?app=teacher)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const requestedPortal = urlParams.get('portal') || urlParams.get('app');
      if (requestedPortal && PORTAL_APPS_CONFIG[requestedPortal]) {
        const app = PORTAL_APPS_CONFIG[requestedPortal];
        setEmail(app.defaultEmail);
        setPassword(app.defaultPassword);
        setSelectedPortalAppKey(requestedPortal);
        setIsPortalAppModalOpen(true);
      }
    } catch (e) {
      // Ignore query param parsing errors
    }
  }, []);

  const handleOpenPortalApp = (appKey: string) => {
    setErrorMsg('');
    const app = PORTAL_APPS_CONFIG[appKey];
    if (app) {
      setEmail(app.defaultEmail);
      setPassword(app.defaultPassword);
    }
    setSelectedPortalAppKey(appKey);
    setIsPortalAppModalOpen(true);
  };

  const handleProcessLmsAccess = (appKey: string) => {
    const app = PORTAL_APPS_CONFIG[appKey];
    if (!app) return;
    setProcessingPortalAppKey(appKey);
    setPortalProcessingProgress(25);
    setPortalProcessingStep(`Verifying ${app.appCode} gateway credentials & encryption handshake...`);

    setTimeout(() => {
      setPortalProcessingProgress(55);
      setPortalProcessingStep('Establishing authenticated handshake with Central LMS Cloud Core...');
    }, 280);

    setTimeout(() => {
      setPortalProcessingProgress(85);
      setPortalProcessingStep(`Authorizing ${app.name} workspace permissions...`);
    }, 600);

    setTimeout(() => {
      setPortalProcessingProgress(100);
      setPortalProcessingStep('Portal handshake verified. Launching LMS workspace...');
      setTimeout(() => {
        setProcessingPortalAppKey(null);
        handleQuickDemoLogin(app.defaultEmail);
      }, 250);
    }, 900);
  };

  const handleCopyPortalLink = (appKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/?portal=${appKey}`;
    navigator.clipboard.writeText(url);
    setCopiedPortalKey(appKey);
    setTimeout(() => setCopiedPortalKey(null), 2500);
  };

  useEffect(() => {
    const handleEventsUpdate = () => {
      setLandingEvents(Storage.getCalendarEvents());
    };
    window.addEventListener('calendar-events-updated', handleEventsUpdate);
    return () => window.removeEventListener('calendar-events-updated', handleEventsUpdate);
  }, []);

  // Listen to navigation events from Navbar
  useEffect(() => {
    const handleNavEvent = (e: any) => {
      const target = e.detail;
      if (target === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (target === 'announcements') {
        const el = document.getElementById('announcements-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (target === 'calendar') {
        const el = document.getElementById('calendar-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (target === 'contact') {
        setActiveModal('contact_us');
      } else if (target === 'signin') {
        const el = document.getElementById('portal-login-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('landing-nav', handleNavEvent);
    return () => window.removeEventListener('landing-nav', handleNavEvent);
  }, []);

  // Handle credential login
  const handleCredentialLogin = (
    e: React.FormEvent, 
    expectedRoleCategory: 'student' | 'parent' | 'teacher' | 'librarian' | 'school_admin_staff' | 'sanatorium' | 'transport' | 'cocurricular' | 'administration'
  ) => {
    e.preventDefault();
    setErrorMsg('');

    let user = Storage.findUserByEmail(email);
    if (!user) {
      user = INITIAL_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (user) {
        Storage.addUser(user);
      }
    }
    if (!user) {
      setErrorMsg('Account not found with this email. Please check your credentials or contact the School Administration.');
      return;
    }

    if (user.password && user.password !== password) {
      setErrorMsg('Incorrect password. Please verify and try again.');
      return;
    }

    const isNurseUser = user.role === 'nurse' || user.email === 'nurse@edusmart.ac.ke' || (user.designation && user.designation.toLowerCase().includes('nurse'));
    if (isNurseUser && expectedRoleCategory !== 'sanatorium') {
      setErrorMsg('School Nursing Officer is strictly authorized to access the School Sanatorium Clinic portal only.');
      return;
    }

    if (expectedRoleCategory === 'student' && user.role !== 'student') {
      setErrorMsg('This account is not a student account. Please use your designated portal.');
      return;
    }

    if (expectedRoleCategory === 'parent' && user.role !== 'parent') {
      setErrorMsg('This account is not registered as a Parent. Please use the appropriate login.');
      return;
    }

    if (expectedRoleCategory === 'teacher' && !['teacher', 'class_teacher'].includes(user.role)) {
      setErrorMsg('This portal is reserved for Subject and Class Teachers.');
      return;
    }

    if (expectedRoleCategory === 'librarian' && user.role !== 'librarian') {
      setErrorMsg('This portal is reserved for the School Librarian.');
      return;
    }

    if (expectedRoleCategory === 'school_admin_staff' && user.role !== 'school_admin_staff') {
      setErrorMsg('This portal is reserved for School Admin Staff (Registrar & Secretariat).');
      return;
    }

    if (expectedRoleCategory === 'sanatorium' && !['nurse', 'school_admin_staff', 'admin'].includes(user.role)) {
      setErrorMsg('This portal is reserved for School Sanatorium Medical Officers & Staff.');
      return;
    }

    if (expectedRoleCategory === 'transport' && !['transport_team', 'school_admin_staff', 'admin'].includes(user.role)) {
      setErrorMsg('This portal is reserved for School Transport Drivers, Chaperones, and Fleet Managers.');
      return;
    }

    if (expectedRoleCategory === 'cocurricular' && !['cocurricular_team', 'teacher', 'class_teacher', 'senior_teacher', 'deputy_head', 'head_teacher', 'admin'].includes(user.role)) {
      setErrorMsg('This portal is reserved for Sports Coaches, Club Patrons, and Co-Curricular Team.');
      return;
    }

    if (expectedRoleCategory === 'administration') {
      if (user.email === 'nurse@edusmart.ac.ke' || (user.designation && user.designation.toLowerCase().includes('nurse'))) {
        setErrorMsg('Sanatorium healthcare staff must authenticate through the dedicated School Sanatorium Healthcare portal.');
        return;
      }
      if (!['head_teacher', 'deputy_head', 'senior_teacher', 'dean_of_studies', 'hod', 'school_admin_staff', 'admin'].includes(user.role)) {
        setErrorMsg('This portal is strictly restricted to School Administrative Leadership.');
        return;
      }
    }

    // Success
    Storage.setCurrentUser(user);
    onLoginSuccess(user);
  };

  // Handle direct Grade Passcode access (e.g. GR4@2026)
  const handleGradePasscodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const isValid = Storage.validateGradePassword(selectedGrade, gradePasscode);
    if (!isValid) {
      setErrorMsg(`Invalid passcode for Grade ${selectedGrade}. Default format is GR${selectedGrade}@2026`);
      return;
    }

    // Find first student in this grade or create a session student
    const allUsers = Storage.getUsers();
    let student = allUsers.find(u => u.role === 'student' && u.grade === selectedGrade);
    
    if (!student) {
      student = {
        id: `stu-gr${selectedGrade}-demo`,
        name: `Grade ${selectedGrade} Learner`,
        email: `learner.gr${selectedGrade}@student.edusmart.ac.ke`,
        role: 'student',
        grade: selectedGrade,
        stream: selectedGrade <= 6 ? 'Dove' : 'Mara',
        admissionNumber: `ADM/2026/0${selectedGrade}01`
      };
      Storage.addUser(student);
    }

    Storage.setCurrentUser(student);
    onLoginSuccess(student);
  };

  // Quick 1-click test login
  const handleQuickDemoLogin = (emailToUse: string) => {
    let user = Storage.findUserByEmail(emailToUse);
    if (!user) {
      user = INITIAL_USERS.find(u => u.email.toLowerCase() === emailToUse.trim().toLowerCase());
      if (user) {
        Storage.addUser(user);
      }
    }
    if (user) {
      Storage.setCurrentUser(user);
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white w-full max-w-full overflow-x-hidden">
      
      {/* ========================================================
          RESPONSIVE IN-PAGE HEADER BAR & MOBILE HAMBURGER NAVIGATION
          Desktop: Full Horizontal Bar · Mobile & Tablet: Hamburger Menu + Vertical Drawer
          ======================================================== */}
      <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-xs">
          
          {/* DESKTOP FULL NAVIGATION (≥1024px) */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            {/* 1. 🏠 Home */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 text-white font-bold hover:bg-emerald-500 transition-colors cursor-pointer"
            >
              <span>🏠</span>
              <span>Home</span>
            </button>

            {/* 2. 📢 Announcements */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('announcements-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
            >
              <span>📢</span>
              <span>Announcements</span>
            </button>

            {/* 3. 📅 School Calendar */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('calendar-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
            >
              <span>📅</span>
              <span>School Calendar</span>
            </button>

            {/* 4. 🚌 Transport */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('transport-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
            >
              <span>🚌</span>
              <span>Transport</span>
            </button>

            {/* 7. 🎯 Co-Curriculum */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('cocurricular-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
            >
              <span>🎯</span>
              <span>Co-Curriculum</span>
            </button>

            {/* 8. 📞 Contact School */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveModal('contact_us');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
            >
              <span>📞</span>
              <span>Contact School</span>
            </button>

            {/* 9. 🚀 Distinctive Portal Apps Directory */}
            <button
              onClick={() => setIsAppDirectoryOpen(!isAppDirectoryOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30 font-bold transition-all cursor-pointer shadow-xs ml-1"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Portal Apps (10)</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${isAppDirectoryOpen ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* MOBILE & TABLET HAMBURGER BAR (<1024px) */}
          <div className="flex lg:hidden items-center justify-between w-full">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors font-bold text-xs cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-emerald-400" />
              ) : (
                <Menu className="w-4 h-4 text-emerald-400" />
              )}
              <span>{mobileMenuOpen ? 'Close Menu' : '☰ Menu'}</span>
            </button>

            <span className="font-extrabold text-xs text-slate-200 tracking-wider">
              Edu-Smart LMS
            </span>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('portal-login-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer"
            >
              <span>🔐</span>
              <span>Sign In</span>
            </button>
          </div>

          {/* DESKTOP SIGN IN BUTTON */}
          <div className="hidden lg:block">
            <button
              onClick={() => {
                const el = document.getElementById('portal-login-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-extrabold hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer"
            >
              <span>🔐</span>
              <span>Sign In to Portal</span>
            </button>
          </div>

        </div>

        {/* MOBILE VERTICAL DROPDOWN DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 px-4 py-3 space-y-1 shadow-2xl animate-in fade-in slide-in-from-top-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              EduSmart LMS Navigation:
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 text-left text-xs font-semibold"
            >
              <span className="text-sm">🏠</span>
              <span>Home & Portal Overview</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('announcements-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 text-left text-xs font-semibold"
            >
              <span className="text-sm">📢</span>
              <span>Institutional Announcements</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('calendar-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 text-left text-xs font-semibold"
            >
              <span className="text-sm">📅</span>
              <span>Academic School Calendar</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('transport-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 text-left text-xs font-semibold"
            >
              <span className="text-sm">🚌</span>
              <span>School Transport & Fleet Commuter GPS</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('cocurricular-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 text-left text-xs font-semibold"
            >
              <span className="text-sm">🎯</span>
              <span>Co-Curricular & Sports Academies</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveModal('contact_us');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 text-left text-xs font-semibold"
            >
              <span className="text-sm">📞</span>
              <span>Contact Administration</span>
            </button>

            <div className="pt-2 border-t border-slate-800 mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  const el = document.getElementById('portal-login-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>🔐</span>
                <span>Access Student, Staff & Parent Portals</span>
              </button>
            </div>
          </div>
        )}

        {/* EXPANDABLE DISTINCTIVE PORTAL APPS DIRECTORY */}
        {isAppDirectoryOpen && (
          <div className="border-t border-slate-800 bg-slate-950/98 px-4 sm:px-6 lg:px-8 py-5 text-white shadow-2xl animate-in fade-in slide-in-from-top-2">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    EduSmart Distinctive Portal Apps Directory
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    10 Apps Linked to LMS Cloud
                  </span>
                </div>
                <button
                  onClick={() => setIsAppDirectoryOpen(false)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close Directory</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.values(PORTAL_APPS_CONFIG).map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-xl">{app.icon}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          {app.appCode}
                        </span>
                      </div>
                      <div className="font-extrabold text-xs text-white group-hover:text-emerald-300 transition-colors">
                        {app.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                        {app.tagline}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setIsAppDirectoryOpen(false);
                          handleProcessLmsAccess(app.id);
                        }}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                        <span>Process LMS</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsAppDirectoryOpen(false);
                          handleOpenPortalApp(app.id);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] transition-colors cursor-pointer"
                        title="Dedicated App Gateway & Link"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================
          RECOMMENDED LANDING PAGE STRUCTURE: CENTRAL HERO SECTION
          SCHOOL LOGO + SCHOOL NAME
          Learner Management System
          > Welcome to the School Portal
          > A secure digital platform connecting learners, teachers, parents and school leadership.
          ======================================================== */}
      <section id="portal-login-section" className="relative bg-slate-900 text-white overflow-hidden py-16 lg:py-24">
        {/* Background Image Scrim */}
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src="/src/assets/images/edusmart_campus_banner_1790859700873.jpg"
            alt="EduSmart Campus"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/95 to-slate-900" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          
          {/* OFFICIAL SCHOOL LOGO + SCHOOL NAME: Edu-Smart PORTAL By Gadsa Systems */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-xl border border-amber-400/80 mb-3 max-w-[140px] w-full mx-auto flex flex-col items-center hover:scale-[1.02] transition-transform">
            <EduSmartGadsaLogo variant="full" size="sm" />
          </div>

          <div className="text-center">
            <p className="text-emerald-400 font-extrabold text-xs sm:text-sm tracking-widest uppercase">
              Competency-Based Curriculum (CBC) · Grades 1 to 9
            </p>
          </div>

          {/* Subtitle & Responsive Hero Heading */}
          <div className="max-w-3xl mt-2 mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight uppercase leading-tight">
              Welcome to the School Portal
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm md:text-base mt-2 max-w-2xl mx-auto font-medium italic">
              "A secure digital platform connecting learners, teachers, parents and school leadership."
            </p>
          </div>

          {/* ========================================================
              MAIN PORTAL ACCESS (RESPONSIVE 4-COLUMN / 2-COLUMN / 1-COLUMN GRID)
              Desktop ≥1024px: 4 Columns · Tablet 768–1023px: 2–3 Columns · Phone ≤767px: 1–2 Columns
              ======================================================== */}
          <div id="portal-cards-grid" className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 text-left">
            
            {/* 1. STUDENT ACCESS APP */}
            <div 
              onClick={() => handleOpenPortalApp('student')}
              className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border-2 border-emerald-400/40 ring-1 ring-emerald-400/20 group relative overflow-hidden cursor-pointer"
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-md border border-white/30 group-hover:scale-105 transition-transform shrink-0">
                    👨‍🎓
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-200 border border-emerald-400/30 shadow-2xs">
                      Grades 1-9
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LMS Cloud Linked</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center justify-between">
                    <span>Learner App · EDU-APP-STU</span>
                    <span className="opacity-70 font-mono">v2.6</span>
                  </div>
                  <h3 className="font-black text-base tracking-wide text-white mt-0.5">
                    STUDENT PORTAL APP
                  </h3>
                  <p className="text-xs text-emerald-100/90 mt-1 font-medium leading-relaxed">
                    Curriculum notes, quizzes, Safe Browser, virtual classes & e-portfolio.
                  </p>
                </div>

                {/* Core Module Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">CBC Notes</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Topical Quizzes</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Safe Browser</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Virtual Labs</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/15 flex flex-col gap-2 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProcessLmsAccess('student');
                  }}
                  className="w-full py-2.5 px-3 bg-white text-slate-950 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:shadow-lg active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Process LMS Access</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-emerald-700" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPortalApp('student');
                    }}
                    className="flex-1 py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    title="Open Standalone App Gateway"
                  >
                    <Smartphone className="w-3 h-3 text-emerald-300" />
                    <span>App Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPortalLink('student', e)}
                    className="py-1.5 px-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    title="Copy direct standalone app URL"
                  >
                    {copiedPortalKey === 'student' ? (
                      <Check className="w-3 h-3 text-emerald-300" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/80" />
                    )}
                    <span className="text-[10px]">{copiedPortalKey === 'student' ? 'Copied' : 'Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. TEACHER ACCESS APP */}
            <div 
              onClick={() => handleOpenPortalApp('teacher')}
              className="p-5 rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border-2 border-blue-400/40 ring-1 ring-blue-400/20 group relative overflow-hidden cursor-pointer"
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-md border border-white/30 group-hover:scale-105 transition-transform shrink-0">
                    👩‍🏫
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-200 border border-blue-400/30 shadow-2xs">
                      Academic Dept
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LMS Cloud Linked</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-blue-300 flex items-center justify-between">
                    <span>Faculty App · EDU-APP-TEA</span>
                    <span className="opacity-70 font-mono">v2.6</span>
                  </div>
                  <h3 className="font-black text-base tracking-wide text-white mt-0.5">
                    TEACHER PRO APP
                  </h3>
                  <p className="text-xs text-blue-100/90 mt-1 font-medium leading-relaxed">
                    Class attendance roll, work entries, lunch register, syllabus & quiz grading.
                  </p>
                </div>

                {/* Core Module Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Roll Call</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Work Entry</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">CBC Marks</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Virtual Lab</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/15 flex flex-col gap-2 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProcessLmsAccess('teacher');
                  }}
                  className="w-full py-2.5 px-3 bg-white text-slate-950 hover:bg-blue-50 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:shadow-lg active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Process LMS Access</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-blue-700" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPortalApp('teacher');
                    }}
                    className="flex-1 py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    title="Open Standalone App Gateway"
                  >
                    <Smartphone className="w-3 h-3 text-blue-300" />
                    <span>App Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPortalLink('teacher', e)}
                    className="py-1.5 px-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    title="Copy direct standalone app URL"
                  >
                    {copiedPortalKey === 'teacher' ? (
                      <Check className="w-3 h-3 text-emerald-300" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/80" />
                    )}
                    <span className="text-[10px]">{copiedPortalKey === 'teacher' ? 'Copied' : 'Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. PARENT ACCESS APP */}
            <div 
              onClick={() => handleOpenPortalApp('parent')}
              className="p-5 rounded-3xl bg-gradient-to-br from-amber-600 via-rose-700 to-slate-900 text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border-2 border-amber-400/40 ring-1 ring-amber-400/20 group relative overflow-hidden cursor-pointer"
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-md border border-white/30 group-hover:scale-105 transition-transform shrink-0">
                    👨‍👩‍👧
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-950/80 text-amber-200 border border-amber-400/30 shadow-2xs">
                      Guardians
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LMS Cloud Linked</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center justify-between">
                    <span>Family App · EDU-APP-PAR</span>
                    <span className="opacity-70 font-mono">v2.6</span>
                  </div>
                  <h3 className="font-black text-base tracking-wide text-white mt-0.5">
                    PARENT CONNECT APP
                  </h3>
                  <p className="text-xs text-amber-100/90 mt-1 font-medium leading-relaxed">
                    Child selector, academic reports, attendance, lunch logs, fees & teacher messaging.
                  </p>
                </div>

                {/* Core Module Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Child Switcher</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Report Cards</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Fee Balances</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Teacher Chat</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/15 flex flex-col gap-2 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProcessLmsAccess('parent');
                  }}
                  className="w-full py-2.5 px-3 bg-white text-slate-950 hover:bg-amber-50 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:shadow-lg active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Process LMS Access</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-rose-700" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPortalApp('parent');
                    }}
                    className="flex-1 py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    title="Open Standalone App Gateway"
                  >
                    <Smartphone className="w-3 h-3 text-amber-300" />
                    <span>App Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPortalLink('parent', e)}
                    className="py-1.5 px-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    title="Copy direct standalone app URL"
                  >
                    {copiedPortalKey === 'parent' ? (
                      <Check className="w-3 h-3 text-emerald-300" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/80" />
                    )}
                    <span className="text-[10px]">{copiedPortalKey === 'parent' ? 'Copied' : 'Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. LIBRARIAN ACCESS APP */}
            <div 
              onClick={() => handleOpenPortalApp('librarian')}
              className="p-5 rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-900 to-slate-900 text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border-2 border-purple-400/40 ring-1 ring-purple-400/20 group relative overflow-hidden cursor-pointer"
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-md border border-white/30 group-hover:scale-105 transition-transform shrink-0">
                    📖
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-200 border border-purple-400/30 shadow-2xs">
                      Curators
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LMS Cloud Linked</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center justify-between">
                    <span>Library Suite · EDU-APP-LIB</span>
                    <span className="opacity-70 font-mono">v2.6</span>
                  </div>
                  <h3 className="font-black text-base tracking-wide text-white mt-0.5">
                    DIGITAL LIBRARY APP
                  </h3>
                  <p className="text-xs text-purple-100/90 mt-1 font-medium leading-relaxed">
                    Digital cataloging, book issuance, circulation desk & reading logs.
                  </p>
                </div>

                {/* Core Module Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Circulation Desk</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">OPAC Catalog</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Fines Ledger</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Room Booking</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/15 flex flex-col gap-2 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProcessLmsAccess('librarian');
                  }}
                  className="w-full py-2.5 px-3 bg-white text-slate-950 hover:bg-purple-50 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:shadow-lg active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Process LMS Access</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-purple-700" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPortalApp('librarian');
                    }}
                    className="flex-1 py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    title="Open Standalone App Gateway"
                  >
                    <Smartphone className="w-3 h-3 text-purple-300" />
                    <span>App Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPortalLink('librarian', e)}
                    className="py-1.5 px-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    title="Copy direct standalone app URL"
                  >
                    {copiedPortalKey === 'librarian' ? (
                      <Check className="w-3 h-3 text-emerald-300" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/80" />
                    )}
                    <span className="text-[10px]">{copiedPortalKey === 'librarian' ? 'Copied' : 'Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 5. SCHOOL ADMIN STAFF ACCESS APP */}
            <div 
              onClick={() => handleOpenPortalApp('school_admin_staff')}
              className="p-5 rounded-3xl bg-gradient-to-br from-teal-800 via-cyan-900 to-slate-900 text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border-2 border-teal-400/40 ring-1 ring-teal-400/20 group relative overflow-hidden cursor-pointer"
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-md border border-white/30 group-hover:scale-105 transition-transform shrink-0">
                    🏛️
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-200 border border-teal-400/30 shadow-2xs">
                      Secretariat
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-teal-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LMS Cloud Linked</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-teal-300 flex items-center justify-between">
                    <span>Registry App · EDU-APP-ADM</span>
                    <span className="opacity-70 font-mono">v2.6</span>
                  </div>
                  <h3 className="font-black text-base tracking-wide text-white mt-0.5">
                    REGISTRAR & SECRETARIAT
                  </h3>
                  <p className="text-xs text-teal-100/90 mt-1 font-medium leading-relaxed">
                    Work entry analysis, gate exits, lunch register audits, calendar & printables.
                  </p>
                </div>

                {/* Core Module Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Work Audits</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Gate Passes</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Lunch Audits</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Printables</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/15 flex flex-col gap-2 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProcessLmsAccess('school_admin_staff');
                  }}
                  className="w-full py-2.5 px-3 bg-white text-slate-950 hover:bg-teal-50 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:shadow-lg active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Process LMS Access</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-teal-700" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPortalApp('school_admin_staff');
                    }}
                    className="flex-1 py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    title="Open Standalone App Gateway"
                  >
                    <Smartphone className="w-3 h-3 text-teal-300" />
                    <span>App Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPortalLink('school_admin_staff', e)}
                    className="py-1.5 px-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    title="Copy direct standalone app URL"
                  >
                    {copiedPortalKey === 'school_admin_staff' ? (
                      <Check className="w-3 h-3 text-emerald-300" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/80" />
                    )}
                    <span className="text-[10px]">{copiedPortalKey === 'school_admin_staff' ? 'Copied' : 'Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 6. EXECUTIVE LEADERSHIP ACCESS APP */}
            <div 
              onClick={() => handleOpenPortalApp('administration')}
              className="p-5 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border-2 border-slate-600/50 ring-1 ring-slate-500/20 group relative overflow-hidden cursor-pointer"
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl shadow-md border border-white/20 group-hover:scale-105 transition-transform shrink-0">
                    🏫
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-600 shadow-2xs">
                      Leadership
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LMS Cloud Linked</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Executive App · EDU-APP-EXE</span>
                    <span className="opacity-70 font-mono">v2.6</span>
                  </div>
                  <h3 className="font-black text-base tracking-wide text-white mt-0.5">
                    EXECUTIVE LEADERSHIP
                  </h3>
                  <p className="text-xs text-slate-300/90 mt-1 font-medium leading-relaxed">
                    Head Teacher, Deputy Head, Senior Teacher, Dean of Studies, HOD & System Admin.
                  </p>
                </div>

                {/* Core Module Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Head Teacher</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Deputy Head</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Dean of Studies</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">HOD Dept</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/15 flex flex-col gap-2 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProcessLmsAccess('administration');
                  }}
                  className="w-full py-2.5 px-3 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:shadow-lg active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Process LMS Access</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-slate-900" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPortalApp('administration');
                    }}
                    className="flex-1 py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    title="Open Standalone App Gateway"
                  >
                    <Smartphone className="w-3 h-3 text-slate-300" />
                    <span>App Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPortalLink('administration', e)}
                    className="py-1.5 px-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    title="Copy direct standalone app URL"
                  >
                    {copiedPortalKey === 'administration' ? (
                      <Check className="w-3 h-3 text-emerald-300" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/80" />
                    )}
                    <span className="text-[10px]">{copiedPortalKey === 'administration' ? 'Copied' : 'Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 7. SCHOOL SANATORIUM ACCESS APP */}
            <div 
              onClick={() => handleOpenPortalApp('sanatorium')}
              className="p-5 rounded-3xl bg-gradient-to-br from-rose-800 via-rose-950 to-slate-950 text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border-2 border-rose-400/50 ring-1 ring-rose-400/20 group relative overflow-hidden cursor-pointer"
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-md border border-white/30 group-hover:scale-105 transition-transform shrink-0">
                    🏥
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-200 border border-rose-400/30 shadow-2xs">
                      Clinic & Health
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LMS Cloud Linked</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center justify-between">
                    <span>Health App · EDU-APP-MED</span>
                    <span className="opacity-70 font-mono">v2.6</span>
                  </div>
                  <h3 className="font-black text-base tracking-wide text-white mt-0.5">
                    SCHOOL SANATORIUM
                  </h3>
                  <p className="text-xs text-rose-100/90 mt-1 font-medium leading-relaxed">
                    Student clinic visits, nurse notes, vital signs check, observation bay & medical records.
                  </p>
                </div>

                {/* Core Module Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Clinic Intake</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Vitals Monitor</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Observation Bay</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Nurse Notes</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/15 flex flex-col gap-2 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProcessLmsAccess('sanatorium');
                  }}
                  className="w-full py-2.5 px-3 bg-white text-slate-950 hover:bg-rose-50 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:shadow-lg active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Process LMS Access</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-rose-700" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPortalApp('sanatorium');
                    }}
                    className="flex-1 py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    title="Open Standalone App Gateway"
                  >
                    <Smartphone className="w-3 h-3 text-rose-300" />
                    <span>App Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPortalLink('sanatorium', e)}
                    className="py-1.5 px-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    title="Copy direct standalone app URL"
                  >
                    {copiedPortalKey === 'sanatorium' ? (
                      <Check className="w-3 h-3 text-emerald-300" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/80" />
                    )}
                    <span className="text-[10px]">{copiedPortalKey === 'sanatorium' ? 'Copied' : 'Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 8. SCHOOL TRANSPORT ACCESS APP */}
            <div 
              onClick={() => handleOpenPortalApp('transport')}
              className="p-5 rounded-3xl bg-gradient-to-br from-amber-700 via-amber-900 to-slate-950 text-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border-2 border-amber-400/50 ring-1 ring-amber-400/20 group relative overflow-hidden cursor-pointer"
            >
              <div className="space-y-3 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-md border border-white/30 group-hover:scale-105 transition-transform shrink-0">
                    🚌
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-200 border border-amber-400/30 shadow-2xs">
                      Fleet Logistics
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LMS Cloud Linked</span>
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center justify-between">
                    <span>Fleet App · EDU-APP-TRN</span>
                    <span className="opacity-70 font-mono">v2.6</span>
                  </div>
                  <h3 className="font-black text-base tracking-wide text-white mt-0.5">
                    TRANSPORT FLEET APP
                  </h3>
                  <p className="text-xs text-amber-100/90 mt-1 font-medium leading-relaxed">
                    Boarding roll call, live commuter GPS tracking, 8 routes, safety alerts & fleet logs.
                  </p>
                </div>

                {/* Core Module Pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">8 Bus Routes</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Live GPS Fleet</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Boarding Rolls</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">Safety Alerts</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/15 flex flex-col gap-2 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProcessLmsAccess('transport');
                  }}
                  className="w-full py-2.5 px-3 bg-white text-slate-950 hover:bg-amber-50 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:shadow-lg active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Process LMS Access</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-amber-700" />
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPortalApp('transport');
                    }}
                    className="flex-1 py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    title="Open Standalone App Gateway"
                  >
                    <Smartphone className="w-3 h-3 text-amber-300" />
                    <span>App Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPortalLink('transport', e)}
                    className="py-1.5 px-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    title="Copy direct standalone app URL"
                  >
                    {copiedPortalKey === 'transport' ? (
                      <Check className="w-3 h-3 text-emerald-300" />
                    ) : (
                      <Copy className="w-3 h-3 text-white/80" />
                    )}
                    <span className="text-[10px]">{copiedPortalKey === 'transport' ? 'Copied' : 'Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 9. CO-CURRICULUM ACCESS APP (WIDE CARD) */}
            <div 
              onClick={() => handleOpenPortalApp('cocurricular')}
              className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-950 to-slate-950 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-2 border-emerald-400/50 ring-1 ring-emerald-400/20 sm:col-span-2 md:col-span-3 lg:col-span-3 xl:col-span-4 group relative overflow-hidden cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10 xl:flex-1">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-md border border-white/30 group-hover:scale-105 transition-transform shrink-0">
                  🎯
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 shadow-2xs">
                      Sports & Societies App · EDU-APP-COC
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-white/10 px-2 py-0.5 rounded font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LMS Cloud Linked · v2.6</span>
                    </span>
                  </div>
                  <h3 className="font-black text-lg tracking-wide text-white mt-1">
                    CO-CURRICULUM SPORTS & SOCIETIES HUB
                  </h3>
                  <p className="text-xs text-emerald-100/90 mt-1 max-w-3xl leading-relaxed">
                    Sports academy coaching, clubs & societies, talent development matrix, inter-school tournaments & official school tours.
                  </p>

                  {/* Core Module Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-white/15 text-white/90">12 Sports Academies</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-white/15 text-white/90">Clubs & Societies</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-white/15 text-white/90">Talent Matrix</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-white/15 text-white/90">Inter-School Tournaments</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-white/15 text-white/90">Gala Passes</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 relative z-10 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProcessLmsAccess('cocurricular');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white text-slate-950 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:shadow-lg active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Process LMS Access</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-emerald-700" />
                </button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPortalApp('cocurricular');
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    title="Dedicated App Gateway"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-300" />
                    <span>App Gateway</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPortalLink('cocurricular', e)}
                    className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                    title="Copy direct standalone app URL"
                  >
                    {copiedPortalKey === 'cocurricular' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 10. CBC VIRTUAL SCIENCE & SCRATCH COMPUTER LAB (PUBLIC / NON-MEMBER ACCESS PASS) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-2 border-emerald-500/40 sm:col-span-2 md:col-span-3 lg:col-span-3 xl:col-span-4 ring-2 ring-emerald-500/20 group relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-xl">
                    🔬
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                      Public Portal · Non-Member Access
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-white/15 text-emerald-300 px-2 py-0.5 rounded-full">
                      EDU-APP-VLAB · v2.6 Linked App
                    </span>
                    <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                      Passes from KES 150
                    </span>
                  </div>
                  <h3 className="font-black text-base sm:text-lg text-white mt-1">
                    Virtual Science Lab & Scratch Computer Coding Studio
                  </h3>
                  <p className="text-xs text-emerald-100/80 mt-1 max-w-3xl leading-relaxed">
                    Visiting learners, parents, and non-members can access CBC chemistry titrations, physics circuits, biology microscopy, and Scratch block coding simulations. Subscribe for an instant digital pass or launch demonstration.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
                <button
                  type="button"
                  onClick={() => handleProcessLmsAccess('virtuallab')}
                  className="px-4 py-2.5 bg-white text-slate-950 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Process Demo Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenPortalApp('virtuallab')}
                  className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Open Dedicated Lab App Info"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
                  <span>App Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVirtualLabSubscriptionOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-[1.02]"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Subscribe via Ticketing Portal →</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCopyPortalLink('virtuallab', e)}
                  className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                  title="Copy direct standalone app URL"
                >
                  {copiedPortalKey === 'virtuallab' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

          </div>

          {/* Quick Demo Credentials Bar -> Distinctive Rapid Portal Switchboard */}
          <div className="mt-8 pt-6 border-t border-slate-800 w-full flex flex-col items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px]">
                  Rapid Portal Switchboard · Instant 1-Click LMS Processing:
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">
                ● 10 Authenticated Gateways Active
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-2 w-full">
              {/* Learner */}
              <button
                onClick={() => handleProcessLmsAccess('student')}
                className="p-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 transition-all text-left flex items-center justify-between group cursor-pointer hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👨‍🎓</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Learner (Gr 4)</div>
                    <div className="text-[9px] text-emerald-400 font-mono">EDU-APP-STU</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Teacher */}
              <button
                onClick={() => handleProcessLmsAccess('teacher')}
                className="p-2.5 rounded-xl bg-blue-950/70 hover:bg-blue-900 border border-blue-500/40 text-blue-200 transition-all text-left flex items-center justify-between group cursor-pointer hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👩‍🏫</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Teacher Pro</div>
                    <div className="text-[9px] text-blue-400 font-mono">EDU-APP-TEA</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-blue-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Parent */}
              <button
                onClick={() => handleProcessLmsAccess('parent')}
                className="p-2.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 transition-all text-left flex items-center justify-between group cursor-pointer hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👨‍👩‍👧</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Parent Connect</div>
                    <div className="text-[9px] text-amber-400 font-mono">EDU-APP-PAR</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Librarian */}
              <button
                onClick={() => handleProcessLmsAccess('librarian')}
                className="p-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-200 transition-all text-left flex items-center justify-between group cursor-pointer hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📖</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Digital Library</div>
                    <div className="text-[9px] text-purple-400 font-mono">EDU-APP-LIB</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Admin Staff */}
              <button
                onClick={() => handleProcessLmsAccess('school_admin_staff')}
                className="p-2.5 rounded-xl bg-teal-950/70 hover:bg-teal-900 border border-teal-500/40 text-teal-200 transition-all text-left flex items-center justify-between group cursor-pointer hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏛️</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Secretariat</div>
                    <div className="text-[9px] text-teal-400 font-mono">EDU-APP-ADM</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Executive Leadership */}
              <button
                onClick={() => handleProcessLmsAccess('administration')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-600/60 text-slate-200 transition-all text-left flex items-center justify-between group cursor-pointer hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏫</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Head Teacher</div>
                    <div className="text-[9px] text-slate-400 font-mono">EDU-APP-EXE</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Sanatorium */}
              <button
                onClick={() => handleProcessLmsAccess('sanatorium')}
                className="p-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 transition-all text-left flex items-center justify-between group cursor-pointer hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏥</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Sanatorium Bay</div>
                    <div className="text-[9px] text-rose-400 font-mono">EDU-APP-MED</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-rose-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Transport */}
              <button
                onClick={() => handleProcessLmsAccess('transport')}
                className="p-2.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-600/40 text-amber-200 transition-all text-left flex items-center justify-between group cursor-pointer hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🚌</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Transport Fleet</div>
                    <div className="text-[9px] text-amber-400 font-mono">EDU-APP-TRN</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Co-Curricular */}
              <button
                onClick={() => handleProcessLmsAccess('cocurricular')}
                className="p-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 transition-all text-left flex items-center justify-between group cursor-pointer hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🎯</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Sports & Clubs</div>
                    <div className="text-[9px] text-emerald-400 font-mono">EDU-APP-COC</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Virtual Lab */}
              <button
                onClick={() => handleProcessLmsAccess('virtuallab')}
                className="p-2.5 rounded-xl bg-teal-950/70 hover:bg-teal-900 border border-teal-500/40 text-teal-200 transition-all text-left flex items-center justify-between group cursor-pointer hover:scale-[1.02] shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🔬</span>
                  <div>
                    <div className="font-bold text-white text-[11px]">Virtual Science Lab</div>
                    <div className="text-[9px] text-teal-400 font-mono">EDU-APP-VLAB</div>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          PUBLIC INFORMATION BUTTONS (EXACTLY 6 BELOW THE LOGIN AREA)
          6. 📚 Learning Resources
          7. 📰 School News
          8. 🗓️ Events
          9. 📖 Library
          10. 📞 Contact Us
          11. ℹ️ About the School
          ======================================================== */}
      <section className="bg-white py-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Community & Visitor Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Public School Information
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Explore public curriculum strands, term schedules, digital library previews, and school communications.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            
            {/* 6. 📚 Learning Resources */}
            <button
              onClick={() => setActiveModal('learning_resources')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform">
                📚
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-800">
                  Learning Resources
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  CBC syllabus & sample notes
                </div>
              </div>
            </button>

            {/* 7. 📰 School News */}
            <button
              onClick={() => setActiveModal('school_news')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 text-left transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform">
                📰
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-800">
                  School News
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Press & academic milestones
                </div>
              </div>
            </button>

            {/* 8. 🗓️ Events */}
            <button
              onClick={() => {
                const el = document.getElementById('events-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setActiveModal('events');
              }}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-amber-50 hover:border-amber-300 text-left transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform">
                🗓️
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-amber-800">
                  Events
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Sports, science & term dates
                </div>
              </div>
            </button>

            {/* 9. 📖 Library */}
            <button
              onClick={() => setActiveModal('library')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50 hover:border-purple-300 text-left transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform">
                📖
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-purple-800">
                  Library
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Catalog & approved readers
                </div>
              </div>
            </button>

            {/* 10. 📞 Contact Us */}
            <button
              onClick={() => setActiveModal('contact_us')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-rose-50 hover:border-rose-300 text-left transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform">
                📞
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-rose-800">
                  Contact Us
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Phone, email & admissions
                </div>
              </div>
            </button>

            {/* 11. ℹ️ About the School */}
            <button
              onClick={() => setActiveModal('about_school')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-left transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform">
                ℹ️
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-teal-800">
                  About the School
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Philosophy, vision & leadership
                </div>
              </div>
            </button>

          </div>

        </div>
      </section>

      {/* ========================================================
          INTERACTIVE CONTENT SECTION 1: ANNOUNCEMENTS
          ======================================================== */}
      <section id="announcements-section" className="py-12 bg-slate-50 border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wide">
                <span>📢 School Broadcast</span>
                <span>·</span>
                <span>Term 1 2026</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Official School Announcements
              </h3>
            </div>
            <span className="text-xs text-slate-500 mt-2 sm:mt-0 font-medium">
              Updated daily by Administration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Academic
                  </span>
                  <span>March 28, 2026</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  Mid-Term Assessment & Progress Report Distribution
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Summative assessment dossiers for Grades 1 through 9 are finalized in the Reporting Hub. Parents can review competency analytics in the Parent Portal.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Dean of Studies</span>
                <span className="text-emerald-700 font-bold">Read details →</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                    Safety
                  </span>
                  <span>March 25, 2026</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  Child Online Protection & Safe Browser Launch
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The EduSmart AI Safe Browser is now active across all student workspaces. All web research is automatically filtered for age-appropriate CBC educational content.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Deputy Head Teacher</span>
                <span className="text-blue-700 font-bold">Policy note →</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                    Library
                  </span>
                  <span>March 20, 2026</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  KICD Approved Readers & CBC Storybook Drive
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Over 1,200 new digital and physical readers have been logged into the School Library circulation catalog. Learners can borrow titles weekly.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>School Librarian</span>
                <span className="text-purple-700 font-bold">Library portal →</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          INTERACTIVE CONTENT SECTION 2: UPCOMING EVENTS & TICKETING
          ======================================================== */}
      <section id="events-section" className="py-12 bg-white border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wide">
                <span>🗓️ Campus Happenings & Ticketing</span>
                <span>·</span>
                <span>JotForm Integration</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Upcoming School Events & Ticket Passes
              </h3>
            </div>
            <button
              onClick={() => setActiveModal('events')}
              className="text-xs text-indigo-700 font-bold hover:underline mt-2 sm:mt-0 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Events Directory & Tickets →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {landingEvents.slice(0, 6).map((evt) => {
              const isCoCurricular = evt.category === 'co_curricular';
              const isPaid = isCoCurricular && evt.ticketType === 'paid' && (evt.ticketPrice || 0) > 0;
              const dateObj = new Date(evt.startDate);
              const monthStr = isNaN(dateObj.getTime()) ? '2026' : dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
              const dayStr = isNaN(dateObj.getTime()) ? '15' : dateObj.getDate().toString().padStart(2, '0');

              return (
                <div 
                  key={evt.id} 
                  className="bg-slate-50 hover:bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`w-14 h-14 rounded-2xl text-white flex flex-col items-center justify-center shrink-0 shadow-xs ${
                        isCoCurricular 
                          ? isPaid ? 'bg-amber-600' : 'bg-emerald-600'
                          : 'bg-indigo-700'
                      }`}>
                        <span className="text-[10px] uppercase font-bold tracking-wider">{monthStr}</span>
                        <span className="text-xl font-black leading-none">{dayStr}</span>
                      </div>

                      <div className="text-right">
                        {isCoCurricular ? (
                          isPaid ? (
                            <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xs inline-flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              <span>KES {(evt.ticketPrice || 0).toLocaleString()}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-xs inline-flex items-center gap-1">
                              <Ticket className="w-3 h-3" />
                              <span>FREE PASS</span>
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 inline-flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-slate-500" />
                            <span>Academic Schedule</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                          {evt.category.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Term {evt.term}</span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm mt-1 leading-snug group-hover:text-indigo-600 transition-colors">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    {evt.venue && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-200/80 flex items-center justify-between">
                    {isCoCurricular ? (
                      <>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {isPaid ? 'Verified Gate Pass' : 'Free Entry Pass'}
                        </span>

                        <button
                          onClick={() => setSelectedTicketEvent(evt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            isPaid 
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black' 
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>{isPaid ? `Get Pass (KES ${(evt.ticketPrice || 0).toLocaleString()})` : 'Get Free Pass'}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Open Academic Date
                        </span>

                        <span className="text-xs text-slate-500 font-medium italic">
                          No Ticket Required
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================
          INTERACTIVE CONTENT SECTION 3: SCHOOL CALENDAR
          ======================================================== */}
      <section id="calendar-section" className="py-12 bg-slate-50 border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                <span>📅 Academic Year 2026</span>
                <span>·</span>
                <span>Ministry of Education Term Dates</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Official School Academic Calendar
              </h3>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-2 sm:mt-0">
              Kenyan CBC Term Schedules
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Term 1 */}
            <div className="bg-white rounded-xl border border-emerald-300 shadow-xs overflow-hidden">
              <div className="bg-emerald-700 text-white p-4">
                <div className="text-[11px] uppercase font-bold tracking-wider text-emerald-200">Current Term</div>
                <h4 className="text-lg font-black mt-0.5">Term 1 (13 Weeks)</h4>
                <div className="text-xs text-emerald-100 font-mono">Jan 06, 2026 – Apr 03, 2026</div>
              </div>
              <div className="p-4 space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold">Term Opening:</span>
                  <span className="font-mono text-slate-600">Jan 06, 2026</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold">Mid-Term Break:</span>
                  <span className="font-mono text-slate-600">Feb 18 – Feb 22</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold">Assessment Week:</span>
                  <span className="font-mono text-slate-600">Mar 23 – Mar 27</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Term Closing:</span>
                  <span className="font-mono text-slate-600">Apr 03, 2026</span>
                </div>
              </div>
            </div>

            {/* Term 2 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white p-4">
                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Upcoming</div>
                <h4 className="text-lg font-black mt-0.5">Term 2 (14 Weeks)</h4>
                <div className="text-xs text-slate-300 font-mono">May 04, 2026 – Aug 07, 2026</div>
              </div>
              <div className="p-4 space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold">Term Opening:</span>
                  <span className="font-mono text-slate-600">May 04, 2026</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold">Mid-Term Break:</span>
                  <span className="font-mono text-slate-600">Jun 17 – Jun 21</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold">National Drama/Music:</span>
                  <span className="font-mono text-slate-600">Jul 10 – Jul 18</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Term Closing:</span>
                  <span className="font-mono text-slate-600">Aug 07, 2026</span>
                </div>
              </div>
            </div>

            {/* Term 3 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white p-4">
                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Final Term</div>
                <h4 className="text-lg font-black mt-0.5">Term 3 (9 Weeks)</h4>
                <div className="text-xs text-slate-300 font-mono">Aug 31, 2026 – Oct 30, 2026</div>
              </div>
              <div className="p-4 space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold">Term Opening:</span>
                  <span className="font-mono text-slate-600">Aug 31, 2026</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold">KPSEA Assessments:</span>
                  <span className="font-mono text-slate-600">Oct 19 – Oct 23</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold">Graduation Ceremony:</span>
                  <span className="font-mono text-slate-600">Oct 28, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Term Closing:</span>
                  <span className="font-mono text-slate-600">Oct 30, 2026</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          SECTION: SCHOOL TRANSPORT & FLEET OPERATIONS BAY
          Safe Commute, Real-Time Boarding & Route Network
          ======================================================== */}
      <section id="transport-section" className="py-16 bg-gradient-to-b from-slate-50 via-amber-50/20 to-white border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 rounded-full text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
                <span>🚌</span>
                <span>Safe Campus Commute & Fleet Operations</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                School Transport & Student Tracking System
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-medium">
                Comprehensive school transport network: licensed PSV coaches, speed governor verified, student boarding/alighting roll call, GPS vehicle tracking, and automated parent SMS notifications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setErrorMsg('');
                  setEmail('transport@edusmart.ac.ke');
                  setPassword('transport2026');
                  setActiveModal('transport');
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <span>🚌</span>
                <span>Transport Team Login</span>
              </button>
            </div>
          </div>

          {/* Transport Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3 text-xl">
                  🚌
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Certified School Fleet</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  33-seater and 29-seater school coaches equipped with calibrated 80 km/h speed governors, safety lap belts, and verified NTSA compliance stickers.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-amber-800 font-semibold">
                NTSA & Speed Governor Verified
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 text-xl">
                  📡
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Real-Time GPS Tracking</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Continuous satellite telemetry transmitting current bus positions, traffic flow status, and accurate stop arrival estimates directly to parents.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-emerald-700 font-semibold">
                Active Telemetry & Route Geofencing
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3 text-xl">
                  📋
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Live Boarding Roll Call</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Dedicated bus chaperones register each learner upon boarding at pickup stops and verify handovers to authorized guardians during evening drop-offs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-blue-700 font-semibold">
                Chaperone Supervised Commute
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3 text-xl">
                  📱
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Automated Parent Alerts</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Immediate SMS notifications when the bus starts its trip, when your child boards, and when the coach safely arrives on the school campus.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-purple-700 font-semibold">
                Instant Departure & Arrival SMS
              </div>
            </div>

          </div>

          {/* Active Route Circuits Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 font-mono">
                Fleet Network & Route Coverage
              </span>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Serving Kiambu Road, Ngong Road, South C, Muthaiga, and Thika Highway
              </h4>
              <p className="text-xs text-slate-500 max-w-3xl">
                Our 3 specialized routes cover over 11 primary residential hubs with coordinated morning pickup from 06:15 AM and evening departures from 03:45 PM.
              </p>
            </div>

            <button
              onClick={() => {
                setErrorMsg('');
                setEmail('transport@edusmart.ac.ke');
                setPassword('transport2026');
                setActiveModal('transport');
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Access Transport Bay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================
          SECTION: CO-CURRICULAR ACTIVITIES & TALENT DEVELOPMENT
          Sports Academies, Clubs & Societies, Tournaments & Portfolios
          ======================================================== */}
      <section id="cocurricular-section" className="py-16 bg-gradient-to-b from-white via-emerald-50/25 to-slate-50 border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-full text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
                <span>🎯</span>
                <span>CBC Holistic Talent & Co-Curricular Excellence</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Sports Academies, Clubs & Talent Portfolios
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-medium">
                Developing champions in athletics, soccer, swimming, robotics, debating, and performing arts with certified coaching, inter-school tournaments, and longitudinal learner portfolios.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setErrorMsg('');
                  setEmail('cocurricular@edusmart.ac.ke');
                  setPassword('cocurricular2026');
                  setActiveModal('cocurricular');
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <span>🎯</span>
                <span>Co-Curricular Team Login</span>
              </button>
            </div>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3 text-xl">
                  ⚽
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Competitive Sports Academies</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Simba Soccer (U-11/U-13), Warriors Basketball, heated semi-Olympic swimming squad, and track & field athletics training under licensed coaches.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-blue-800 font-semibold">
                Weekly Leagues & Inter-County Cups
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3 text-xl">
                  🎙️
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Championship Clubs & Societies</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  National Model UN debaters, NACOSTI science award-winning robotics & AI coders, symphony brass band, drama troupe, and scouts movement.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-purple-700 font-semibold">
                National Trophy Winners 2026
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 text-xl">
                  ✨
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Learner Talent Portfolios</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Longitudinal transcript following each learner across years—capturing club leadership, tournament honors, attendance rate, and talent development badges.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-emerald-700 font-semibold">
                Official Printable CBC Transcript
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3 text-xl">
                  🚌
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Tours & Digital Parent Consent</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Integrated with EduSmart School Transport for safe excursions, Kasarani championships, theatre galas, digital parent consent, and verified supervision.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-amber-800 font-semibold">
                Direct Transport Fleet Integration
              </div>
            </div>

          </div>

          {/* Quick Stats Highlight */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                Holistic CBC Co-Curricular Enrollment
              </span>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                12 Active Sports Academies & Clubs · 350+ Learners Enrolled · 24 Regional Championship Trophies
              </h4>
              <p className="text-xs text-slate-500">
                Staffed by qualified coaches, patrons, and sports directors with official Kenya national federation affiliations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setErrorMsg('');
                  setEmail('cocurricular@edusmart.ac.ke');
                  setPassword('cocurricular2026');
                  setActiveModal('cocurricular');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-colors shadow-xs"
              >
                Access Activities Portal →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          RECOMMENDED LANDING PAGE FOOTER:
          Contact School • Help & Support • Privacy • Terms
          ======================================================== */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl border border-slate-800 shadow-sm">
                <EduSmartGadsaLogo variant="horizontal" size="sm" />
              </div>
            </div>

            {/* Exactly: Privacy Policy | Terms of Use | Help & Support | Contact School */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
              <button 
                onClick={() => setActiveModal('privacy')}
                className="hover:text-emerald-400 transition-colors"
              >
                Privacy Policy
              </button>
              <span className="text-slate-700">|</span>
              <button 
                onClick={() => setActiveModal('terms')}
                className="hover:text-emerald-400 transition-colors"
              >
                Terms of Use
              </button>
              <span className="text-slate-700">|</span>
              <button 
                onClick={() => setActiveModal('help')}
                className="hover:text-emerald-400 transition-colors"
              >
                Help & Support
              </button>
              <span className="text-slate-700">|</span>
              <button 
                onClick={() => setActiveModal('contact_us')}
                className="hover:text-emerald-400 transition-colors"
              >
                Contact School
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <div>
              © 2026 EduSmart Academy. Authorized by the Ministry of Education & KICD. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Single-Grade Compartmentalization & Data Protection Enforced</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================
          LOGIN MODALS & PUBLIC INFO DIALOGS
          ======================================================== */}

      {/* MODAL 1: Student Login */}
      {activeModal === 'student' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-emerald-50/70 flex items-center justify-between">
              <div className="space-y-1">
                <div className="bg-white p-1 rounded-xl shadow-2xs inline-block mb-1">
                  <EduSmartGadsaLogo variant="horizontal" size="xs" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>👨‍🎓</span>
                  <span>Student Portal Login</span>
                </h3>
                <p className="text-xs text-slate-600">Access Grade 1-9 resources, quizzes, Safe Browser and notes.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 self-start">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleCredentialLogin(e, 'student')} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Email / Admission No.
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="brian.otieno@student.edusmart.ac.ke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grade Passcode / Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="GR4@2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
              >
                Access Student Workspace
              </button>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                <div className="font-bold text-slate-800 mb-1">Quick Demo Student:</div>
                <div>Grade 4 Dove: <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">brian.otieno@student.edusmart.ac.ke</code> (Pass: <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">GR4@2026</code>)</div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Teacher Login */}
      {activeModal === 'teacher' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-blue-50/70 flex items-center justify-between">
              <div className="space-y-1">
                <div className="bg-white p-1 rounded-xl shadow-2xs inline-block mb-1">
                  <EduSmartGadsaLogo variant="horizontal" size="xs" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>👩‍🏫</span>
                  <span>Teacher Portal Login</span>
                </h3>
                <p className="text-xs text-slate-600">For Class Teachers and Subject Teachers.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 self-start">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleCredentialLogin(e, 'teacher')} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teacher Email / TSC Account
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mr.kiprono@edusmart.ac.ke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="teach2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
              >
                Access Teacher Workspace
              </button>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                <div className="font-bold text-slate-800 mb-1">Quick Demo Teacher:</div>
                <div>Class Teacher (Grade 4): <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">mr.kiprono@edusmart.ac.ke</code> (Pass: <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">teach2026</code>)</div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DISTINCTIVE PARENT PORTAL LOGIN */}
      {activeModal === 'parent' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-amber-300 overflow-hidden">
            <div className="p-5 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-rose-50 flex items-center justify-between">
              <div>
                <div className="bg-white p-1 rounded-xl shadow-2xs inline-block mb-1.5">
                  <EduSmartGadsaLogo variant="horizontal" size="xs" />
                </div>
                <div className="inline-block ml-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded uppercase tracking-wider mb-1">
                  Distinctive Parent Access
                </div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>👨‍👩‍👧</span>
                  <span>Parent Portal Login</span>
                </h3>
                <p className="text-xs text-slate-600">Track all your enrolled children from one unified family dashboard.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 self-start">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleCredentialLogin(e, 'parent')} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Registered Email / Phone
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent.otieno@edusmart.ac.ke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="parent2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-lg transition-colors shadow-sm"
              >
                Open Parent Dashboard
              </button>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950">
                <div className="font-extrabold text-amber-900 mb-1">Demo Parent Account (3 Children Linked):</div>
                <div>Email: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono">parent.otieno@edusmart.ac.ke</code></div>
                <div>Pass: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono">parent2026</code></div>
                <div className="text-[10px] text-amber-800 mt-1">Children: Brian (Gr 4), Faith (Gr 8), Peter (Gr 1).</div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DISTINCTIVE LIBRARIAN PORTAL LOGIN */}
      {activeModal === 'librarian' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-purple-300 overflow-hidden">
            <div className="p-5 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
              <div>
                <div className="bg-white p-1 rounded-xl shadow-2xs inline-block mb-1.5">
                  <EduSmartGadsaLogo variant="horizontal" size="xs" />
                </div>
                <div className="inline-block ml-2 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded uppercase tracking-wider mb-1">
                  Distinctive Library Access
                </div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>📖</span>
                  <span>Librarian Portal Login</span>
                </h3>
                <p className="text-xs text-slate-600">Circulation desk, catalog management, book checkout & return register.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 self-start">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleCredentialLogin(e, 'librarian')} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Librarian Account Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="librarian@edusmart.ac.ke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="lib2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs rounded-lg transition-colors shadow-sm"
              >
                Access Library Circulation Desk
              </button>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-950">
                <div className="font-extrabold text-purple-900 mb-1">Demo Librarian Account:</div>
                <div>Email: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono">librarian@edusmart.ac.ke</code></div>
                <div>Pass: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono">lib2026</code></div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHOOL ADMIN STAFF ACCESS PORTAL (Registrar & Secretariat) */}
      {activeModal === 'school_admin_staff' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-teal-400/80 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-teal-200 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="bg-white p-1 rounded-xl shadow-2xs inline-block mb-1.5">
                  <EduSmartGadsaLogo variant="horizontal" size="xs" />
                </div>
                <div className="inline-block ml-2 px-2 py-0.5 bg-teal-400 text-slate-950 text-[10px] font-black rounded uppercase tracking-wider mb-1">
                  Secretariat & Registrar
                </div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>🏛️</span>
                  <span>School Admin Staff Portal Login</span>
                </h3>
                <p className="text-xs text-teal-100">
                  Work entry analysis, gate exits, marked registers, parent communications, school calendar & printables.
                </p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white self-start">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleCredentialLogin(e, 'school_admin_staff')} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Administrative Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adminstaff@edusmart.ac.ke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="staff2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-700 to-slate-900 hover:from-teal-800 hover:to-slate-950 text-white font-extrabold text-xs rounded-lg transition-colors shadow-sm"
              >
                Access School Admin Secretariat
              </button>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-950">
                <div className="font-extrabold text-teal-900 mb-1">Demo Admin Staff Account:</div>
                <div className="text-slate-700">Official: <strong>Mrs. Sarah Cherono (Registrar)</strong></div>
                <div>Email: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-teal-900">adminstaff@edusmart.ac.ke</code></div>
                <div>Pass: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-teal-900">staff2026</code></div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHOOL SANATORIUM & CLINIC ACCESS PORTAL */}
      {activeModal === 'sanatorium' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-rose-400/80 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-rose-200 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="bg-white p-1 rounded-xl shadow-2xs inline-block mb-1.5">
                  <EduSmartGadsaLogo variant="horizontal" size="xs" />
                </div>
                <div className="inline-block ml-2 px-2 py-0.5 bg-rose-400 text-slate-950 text-[10px] font-black rounded uppercase tracking-wider mb-1">
                  Sanatorium Bay
                </div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>🏥</span>
                  <span>School Sanatorium Staff Login</span>
                </h3>
                <p className="text-xs text-rose-100">
                  Record student clinic visits, vital signs, nursing treatments & medical recommendations.
                </p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white self-start">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleCredentialLogin(e, 'sanatorium')} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medical Staff / Nursing Officer Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nurse@edusmart.ac.ke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="nurse2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-700 to-slate-900 hover:from-rose-800 hover:to-slate-950 text-white font-extrabold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>🏥</span>
                <span>Access Sanatorium Healthcare Register</span>
              </button>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-950">
                <div className="font-extrabold text-rose-900 mb-1">Demo Nursing Staff Account:</div>
                <div className="text-slate-700">In-Charge: <strong>Sister Grace Wambui, RN (NCK/RN-58921)</strong></div>
                <div>Email: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-rose-900">nurse@edusmart.ac.ke</code></div>
                <div>Pass: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-rose-900">nurse2026</code></div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCHOOL TRANSPORT & FLEET TEAM ACCESS */}
      {activeModal === 'transport' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-amber-400/80 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-amber-200 bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="bg-white p-1 rounded-xl shadow-2xs inline-block mb-1.5">
                  <EduSmartGadsaLogo variant="horizontal" size="xs" />
                </div>
                <div className="inline-block ml-2 px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded uppercase tracking-wider mb-1">
                  Fleet & Safety
                </div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>🚌</span>
                  <span>School Transport Team Login</span>
                </h3>
                <p className="text-xs text-amber-100">
                  Student boarding & alighting roll call, GPS vehicle tracking, route manifests & safety alerts.
                </p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white self-start">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleCredentialLogin(e, 'transport')} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver / Chaperone / Fleet Manager Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="transport@edusmart.ac.ke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="transport2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 hover:from-amber-700 hover:to-slate-950 text-white font-extrabold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🚌</span>
                <span>Access School Transport Bay</span>
              </button>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 space-y-1.5">
                <div className="font-extrabold text-amber-900">Demo Transport Team Accounts:</div>
                <div className="text-slate-700">
                  Lead Driver: <strong>Mr. Josephat Kipkoech</strong> (Bus 01)
                  <br />Email: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-amber-900">transport@edusmart.ac.ke</code> · Pass: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-amber-900">transport2026</code>
                </div>
                <div className="text-slate-700 pt-1 border-t border-amber-200/60">
                  Bus Chaperone: <strong>Ms. Mary Wambui</strong> (Student Roll Officer)
                  <br />Email: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-amber-900">chaperone@edusmart.ac.ke</code> · Pass: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-amber-900">transport2026</code>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CO-CURRICULUM TEAM ACCESS */}
      {activeModal === 'cocurricular' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-emerald-400/80 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-emerald-200 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="bg-white p-1 rounded-xl shadow-2xs inline-block mb-1.5">
                  <EduSmartGadsaLogo variant="horizontal" size="xs" />
                </div>
                <div className="inline-block ml-2 px-2 py-0.5 bg-emerald-400 text-slate-950 text-[10px] font-black rounded uppercase tracking-wider mb-1">
                  Sports & Clubs Hub
                </div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>Co-Curricular Team Login</span>
                </h3>
                <p className="text-xs text-emerald-100">
                  Sports academy coaching, clubs & societies, talent development matrix, and fixtures.
                </p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white self-start">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleCredentialLogin(e, 'cocurricular')} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coach / Patron / Activities Director Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cocurricular@edusmart.ac.ke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="cocurricular2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 hover:from-emerald-700 hover:to-slate-950 text-white font-extrabold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🎯</span>
                <span>Enter Co-Curriculum Hub</span>
              </button>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 space-y-1.5">
                <div className="font-extrabold text-emerald-900">Demo Co-Curricular Accounts:</div>
                <div className="text-slate-700">
                  Director of Sports: <strong>Coach Benjamin Omwenga</strong>
                  <br />Email: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-emerald-900">cocurricular@edusmart.ac.ke</code> · Pass: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-emerald-900">cocurricular2026</code>
                </div>
                <div className="text-slate-700 pt-1 border-t border-emerald-200/60">
                  Senior Club Patron: <strong>Madame Grace Achieng</strong> (Debate & Drama)
                  <br />Email: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-emerald-900">patron@edusmart.ac.ke</code> · Pass: <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono text-emerald-900">cocurricular2026</code>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADMINISTRATION ACCESS PORTAL (Role-Based Selection) */}
      {activeModal === 'administration' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="bg-white p-1 rounded-xl shadow-2xs inline-block mb-1.5">
                  <EduSmartGadsaLogo variant="horizontal" size="xs" />
                </div>
                <div className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Restricted Leadership Access
                  </span>
                </div>
                <h3 className="text-base font-black text-white flex items-center gap-2 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Administration Login Portal</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Authenticate your administrative role for executive governance and school oversight.
                </p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white self-start">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <form onSubmit={(e) => handleCredentialLogin(e, 'administration')} className="space-y-3">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Administrative Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. headteacher@edusmart.ac.ke"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security key"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  Verify Administrative Access
                </button>
              </form>

              {/* Explicit Role-Based Access Buttons */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Role to Authenticate:
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleQuickDemoLogin('headteacher@edusmart.ac.ke')}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl border border-slate-200 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 group-hover:text-emerald-800">Head Teacher</div>
                      <div className="text-[10px] text-slate-500">School-wide management</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </button>

                  <button
                    onClick={() => handleQuickDemoLogin('deputy@edusmart.ac.ke')}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl border border-slate-200 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 group-hover:text-emerald-800">Deputy Head</div>
                      <div className="text-[10px] text-slate-500">Operations & discipline</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </button>

                  <button
                    onClick={() => handleQuickDemoLogin('senior.teacher@edusmart.ac.ke')}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl border border-slate-200 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 group-hover:text-emerald-800">Senior Teacher</div>
                      <div className="text-[10px] text-slate-500">Supervision & mentorship</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </button>

                  <button
                    onClick={() => handleQuickDemoLogin('dean@edusmart.ac.ke')}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl border border-slate-200 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 group-hover:text-emerald-800">Dean of Studies</div>
                      <div className="text-[10px] text-slate-500">Academic & assessments</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </button>

                  <button
                    onClick={() => handleQuickDemoLogin('hod.sciences@edusmart.ac.ke')}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl border border-slate-200 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 group-hover:text-emerald-800">Head of Dept (HOD)</div>
                      <div className="text-[10px] text-slate-500">Department curriculum</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </button>

                  <button
                    onClick={() => handleQuickDemoLogin('adminstaff@edusmart.ac.ke')}
                    className="p-2.5 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 rounded-xl border border-slate-200 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 group-hover:text-teal-800">School Admin Staff</div>
                      <div className="text-[10px] text-slate-500">Secretariat & registers</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
                  </button>

                  <button
                    onClick={() => handleQuickDemoLogin('transport@edusmart.ac.ke')}
                    className="p-2.5 bg-amber-50/80 hover:bg-amber-100 hover:border-amber-300 rounded-xl border border-amber-200 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-extrabold text-amber-950">🚌 Transport Team</div>
                      <div className="text-[10px] text-amber-700">Lead Driver & Fleet Supervisor</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                  </button>

                  <button
                    onClick={() => handleQuickDemoLogin('cocurricular@edusmart.ac.ke')}
                    className="p-2.5 bg-emerald-50/80 hover:bg-emerald-100 hover:border-emerald-300 rounded-xl border border-emerald-200 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-extrabold text-emerald-950">🎯 Co-Curricular Lead</div>
                      <div className="text-[10px] text-emerald-700">Coach Benjamin Omwenga</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  </button>

                  <button
                    onClick={() => handleQuickDemoLogin('admin@edusmart.ac.ke')}
                    className="p-2.5 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl border border-indigo-200 text-left transition-colors flex items-center justify-between group col-span-2"
                  >
                    <div>
                      <div className="font-extrabold text-indigo-900">System Administrator</div>
                      <div className="text-[10px] text-indigo-700">Full system configuration & user governance</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Public Learning Resources Explorer */}
      {activeModal === 'learning_resources' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-emerald-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📚</span>
                  <span>Public Learning Resources Directory</span>
                </h3>
                <p className="text-xs text-slate-600">Kenyan CBC curriculum designs, syllabus strands, and sample notes.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Primary School (Grades 1 to 6)</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Mathematics, English, Kiswahili, Integrated Science, Agriculture, Social Studies, Christian Religious Education (CRE), and Creative Arts.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Junior School (Grades 7 to 9)</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Pre-Technical Studies, Integrated Science, Agriculture, Mathematics, English, Kiswahili, Social Studies, Creative Arts & Sports, and Health Education.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                <span className="font-bold">Content Security Notice:</span> Full interactive curriculum notes and topical auto-marking quizzes are compartmentalized inside authenticated student workspaces to protect institutional IP and prevent unauthorized downloading.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Public School News */}
      {activeModal === 'school_news' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-blue-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📰</span>
                  <span>School News & Press Releases</span>
                </h3>
                <p className="text-xs text-slate-600">Latest updates on student achievements, teacher development, and community impact.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Press Release · March 2026</span>
                <h4 className="font-bold text-slate-900 text-sm">EduSmart Academy Named Top Regional CBC Innovation Center</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  The Ministry of Education highlighted our automated formative assessment model, single-grade security compartmentalization, and student e-portfolios as benchmark practices.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Achievement · February 2026</span>
                <h4 className="font-bold text-slate-900 text-sm">Junior School Robotics Team Qualifies for National Finals</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Grade 8 learners from the Chania stream demonstrated solar irrigation automation prototypes under Pre-Technical Studies, taking first place in the county exhibition.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Close News
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: Public Library Explorer */}
      {activeModal === 'library' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-purple-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📖</span>
                  <span>EduSmart Digital & Physical Library Catalog</span>
                </h3>
                <p className="text-xs text-slate-600">Curated KICD approved textbooks, African storybooks, and reference readers.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-purple-700 uppercase">CBC Grade 4 Reader</div>
                  <h4 className="font-bold text-slate-900 mt-1">Living and Working in our County</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">Author: KICD Editorial Board · 48 Available Copies</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-purple-700 uppercase">Junior School Grade 7</div>
                  <h4 className="font-bold text-slate-900 mt-1">Pre-Technical Studies Workshop Guide</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">Author: National Science Press · 32 Available Copies</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-purple-700 uppercase">African Literature</div>
                  <h4 className="font-bold text-slate-900 mt-1">The Cunning Hare & Other Folk Tales</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">Author: Grace Ogot · 26 Available Copies</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-purple-700 uppercase">Science Discovery</div>
                  <h4 className="font-bold text-slate-900 mt-1">Wonders of Kenyan Wildlife Ecosystems</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">Author: KWS Educational Bureau · 19 Available Copies</div>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px]">
                Enrolled students can borrow books directly using their admission barcode at the physical library desk, or read digital excerpts online.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Close Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: Contact Us & Inquiries */}
      {activeModal === 'contact_us' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-rose-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📞</span>
                  <span>Contact School Administration</span>
                </h3>
                <p className="text-xs text-slate-600">Admissions desk, parent inquiries, and school helpline.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Telephone Lines</div>
                    <div className="text-slate-600 text-[11px] font-mono mt-0.5">+254 722 000 111</div>
                    <div className="text-slate-600 text-[11px] font-mono">+254 733 000 222</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Official Email</div>
                    <div className="text-slate-600 text-[11px] font-mono mt-0.5">info@edusmart.ac.ke</div>
                    <div className="text-slate-600 text-[11px] font-mono">admissions@edusmart.ac.ke</div>
                  </div>
                </div>
              </div>

              {contactSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                  <div className="font-bold text-sm">Message Sent Successfully!</div>
                  <p className="text-xs mt-1 text-emerald-800">
                    The admissions secretary will get in touch with you shortly.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSubmitted(true);
                  }}
                  className="space-y-3 pt-2"
                >
                  <div className="font-bold text-slate-900">Send an Inquiry or Message:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <textarea
                    required
                    rows={3}
                    placeholder="Enter your inquiry regarding admission, fee structure, or learner welfare..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit School Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: About the School */}
      {activeModal === 'about_school' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-teal-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>About EduSmart Academy</span>
                </h3>
                <p className="text-xs text-slate-600">Empowering Kenyan learners through values, competencies, and excellence.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Our Institutional Vision</h4>
                <p>
                  To be the benchmark primary and junior school in East Africa, delivering holistic, ethical, and technology-empowered education under the Competency-Based Curriculum (CBC).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Core Values</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Integrity:</strong> Honest inquiry and responsible digital citizenship.</li>
                  <li><strong>Excellence:</strong> Rigorous academic mastery and practical skills demonstration.</li>
                  <li><strong>Inclusivity:</strong> Supportive environments for learners across all grades and streams.</li>
                  <li><strong>Innovation:</strong> Safe, AI-guided educational research and hands-on robotics.</li>
                </ul>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-900">
                <strong>Accreditation:</strong> Fully registered with the Ministry of Education (MOE/PRI/2026/041) and accredited by the Kenya Institute of Curriculum Development (KICD).
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 11: Privacy Policy */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Privacy Policy & Child Data Protection</span>
                </h3>
                <p className="text-xs text-slate-500">Compliance with the Kenya Data Protection Act and Child Protection Guidelines.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto text-xs text-slate-700 leading-relaxed">
              <p>
                EduSmart Academy is committed to safeguarding student, teacher, and guardian personal information. Single-grade compartmentalization ensures learners only access resources appropriate for their enrollment tier.
              </p>
              <h4 className="font-bold text-slate-900">Key Protection Principles:</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>No student assessment dossiers or personal data are exposed publicly or indexed by external web crawlers.</li>
                <li>Safe Browser searches are monitored solely to ensure student physical and digital safety under school care.</li>
                <li>Parents possess statutory rights to inspect and verify their children's records at any time via the Parent Portal.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 12: Terms of Use */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Terms of Use & Acceptable Digital Etiquette</span>
                </h3>
                <p className="text-xs text-slate-500">Student, parent, and educator code of digital conduct.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto text-xs text-slate-700 leading-relaxed">
              <p>
                By signing into EduSmart LMS, users agree to uphold ethical digital etiquette. School accounts must not be shared with unverified external parties.
              </p>
              <h4 className="font-bold text-slate-900">Content Integrity Policy:</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Curriculum lesson notes, multimedia lessons, and exam banks are protected institutional assets.</li>
                <li>Attempts to circumvent AI content filters or post inappropriate content will trigger immediate school leadership notification.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Close Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 13: Help & Support Directory */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                  <span>Help & Support Directory</span>
                </h3>
                <p className="text-xs text-slate-500">Grade passcodes, stream names, and login reference manual.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">
                  Grade Passwords Directory (Grades 1 to 9)
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Grade Level</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 font-mono">Password</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {Storage.getGradePasswords().map((gp) => (
                        <tr key={gp.grade} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-sans font-semibold text-slate-900">
                            Grade {gp.grade}
                          </td>
                          <td className="py-1.5 px-3 font-sans text-slate-600">
                            {gp.grade <= 6 ? 'Primary (8 Streams)' : 'Junior School (7 Streams)'}
                          </td>
                          <td className="py-1.5 px-3 text-emerald-700 font-bold">
                            {gp.password}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Primary Streams (Grades 1-6)</div>
                  <div className="text-[11px] text-slate-600">
                    Dove, Eagle, Falcon, Flamingo, Heron, Pelican, Sparrow, Swan.
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Junior Streams (Grades 7-9)</div>
                  <div className="text-[11px] text-slate-600">
                    Athi, Chania, Kerio, Mara, Sabaki, Tana, Turkwel.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Full Events Directory & Co-Curricular Ticketing */}
      {activeModal === 'events' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>🗓️</span>
                  <span>EduSmart School Events & Co-Curricular Pass Directory</span>
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Browse official events, academic schedules, and reserve admission tickets for co-curricular galas.
                </p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-indigo-200 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
              <SchoolEventsManager readOnly={true} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Events Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET PURCHASE MODAL (When clicking Buy Ticket directly) */}
      {selectedTicketEvent && (
        <EventTicketModal
          event={selectedTicketEvent}
          onClose={() => setSelectedTicketEvent(null)}
        />
      )}

      {/* NON-MEMBER VIRTUAL LAB & SCRATCH CODING SUBSCRIPTION MODAL */}
      {isVirtualLabSubscriptionOpen && (
        <VirtualLabSubscriptionModal
          isOpen={isVirtualLabSubscriptionOpen}
          onClose={() => setIsVirtualLabSubscriptionOpen(false)}
        />
      )}

      {/* DEDICATED PORTAL ACCESS APP MODAL */}
      {isPortalAppModalOpen && selectedPortalAppKey && (
        <PortalAccessAppModal
          appKey={selectedPortalAppKey}
          isOpen={isPortalAppModalOpen}
          onClose={() => {
            setIsPortalAppModalOpen(false);
            setSelectedPortalAppKey(null);
          }}
          onLogin={(emailToUse, passwordToUse) => {
            setIsPortalAppModalOpen(false);
            setSelectedPortalAppKey(null);
            handleQuickDemoLogin(emailToUse);
          }}
          errorMsg={errorMsg}
        />
      )}

      {/* PROCESSING LMS HANDSHAKE OVERLAY */}
      {processingPortalAppKey && PORTAL_APPS_CONFIG[processingPortalAppKey] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-xl mb-4 animate-bounce">
              {PORTAL_APPS_CONFIG[processingPortalAppKey].icon}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              <span>Processing Portal App · {PORTAL_APPS_CONFIG[processingPortalAppKey].appCode}</span>
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">
              {PORTAL_APPS_CONFIG[processingPortalAppKey].name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {PORTAL_APPS_CONFIG[processingPortalAppKey].tagline}
            </p>

            {/* Progress Bar */}
            <div className="w-full mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to Central LMS</span>
                </span>
                <span className="text-slate-300 font-bold">{portalProcessingProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${portalProcessingProgress}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-emerald-300/90 text-center pt-1 min-h-[1.25rem]">
                {portalProcessingStep}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 w-full flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 1.3 Encryption · EduSmart Central LMS Linked</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
