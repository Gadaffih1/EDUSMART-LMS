import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, UserRole, AppNotification } from '../../types';
import { Storage } from '../../utils/storage';
import { useNotificationLayout } from '../../context/NotificationLayoutContext';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  GraduationCap, 
  LogOut, 
  UserCheck, 
  Shield, 
  ChevronDown, 
  RefreshCw, 
  School,
  Users,
  BookOpen,
  Briefcase,
  HeartHandshake,
  BookMarked,
  Bell,
  Home,
  Megaphone,
  Calendar,
  Phone,
  LogIn,
  Settings,
  Sparkles,
  Layers,
  Smartphone,
  Maximize2,
  Minimize2,
  ArrowLeft,
  X,
  Accessibility
} from 'lucide-react';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { SettingsModal } from '../settings/SettingsModal';
import { useTenant } from '../../context/TenantContext';
import { useMobileLayout } from '../../context/MobileLayoutContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { AccessibilityModal } from '../common/AccessibilityModal';
import { GeminiChatbotModal } from '../ai/GeminiChatbotModal';
import { isSupabaseConfigured } from '../../lib/supabase';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  onNavigateHome: () => void;
  isPlatformAdminSession?: boolean;
  onReturnToSuperAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  onNavigateHome,
  isPlatformAdminSession = false,
  onReturnToSuperAdmin
}) => {
  const { currentTenant } = useTenant();
  const { isMobileOverlapProtectionEnabled, toggleMobileOverlapProtection } = useMobileLayout();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isSwitchModalFullscreen, setIsSwitchModalFullscreen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);

  const { isNotificationOpen, toggleNotifications, unreadCount } = useNotificationLayout();
  const { 
    highContrast, 
    fontSize, 
    screenReaderMode, 
    toggleHighContrast, 
    isCustomized 
  } = useAccessibility();

  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);

  useEffect(() => {
    const handleOpenSettings = () => setShowSettingsModal(true);
    const handleOpenA11y = () => setShowAccessibilityModal(true);
    window.addEventListener('open-storage-settings', handleOpenSettings);
    window.addEventListener('open-accessibility-menu', handleOpenA11y);

    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Alt + A: Open Accessibility Settings
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setShowAccessibilityModal(prev => !prev);
      }
      // Alt + C: Toggle High Contrast Mode
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        toggleHighContrast();
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);

    return () => {
      window.removeEventListener('open-storage-settings', handleOpenSettings);
      window.removeEventListener('open-accessibility-menu', handleOpenA11y);
      window.removeEventListener('keydown', handleGlobalShortcuts);
    };
  }, [toggleHighContrast]);

  // Keyboard shortcut & body scroll lock for Account Switcher Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSwitchModal(false);
    };
    if (showSwitchModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [showSwitchModal]);

  const allUsers = Storage.getUsers();

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'student': return 'Learner';
      case 'parent': return 'Parent';
      case 'teacher': return 'Subject Teacher';
      case 'class_teacher': return 'Class Teacher';
      case 'hod': return 'Head of Department (HOD)';
      case 'senior_teacher': return 'Senior Teacher';
      case 'deputy_head': return 'Deputy Head Teacher';
      case 'dean_of_studies': return 'Dean of Studies';
      case 'curriculum_coordinator': return 'Curriculum Coordinator (Executive Leadership)';
      case 'librarian': return 'Librarian';
      case 'head_teacher': return 'Head Teacher';
      case 'school_admin_staff': return 'School Admin Staff / Registrar';
      case 'transport_team': return 'School Transport Team';
      case 'cocurricular_team': return 'Co-Curricular & Sports Academy';
      case 'finance_officer': return 'Finance & Bursary Officer';
      case 'procurement_officer': return 'Procurement & Purchasing Lead';
      case 'storekeeper': return 'Central Stores & Inventory Keeper';
      case 'hr_manager': return 'Human Resources & Payroll Manager';
      case 'admin': return 'System Administrator';
      default: return role;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200" role="banner">
      {/* Skip to Main Content Link for Screen Readers and Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-slate-950 focus:font-extrabold focus:rounded-xl focus:shadow-2xl focus:ring-4 focus:ring-slate-950 focus:border-2 focus:border-white"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center justify-between gap-3">
        
        {/* Zone 1: Current School Branding (Multi-Tenancy) & Campus Selector */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left text-slate-900 hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
            title={`${currentTenant.name} — ${currentTenant.motto}`}
            aria-label={
              screenReaderMode 
                ? `${currentTenant.name} School Portal, institutional motto: ${currentTenant.motto}. Campus code: ${currentTenant.code}. Click to return to homepage.`
                : `${currentTenant.name} — ${currentTenant.motto}`
            }
          >
            {/* School Crest Logo with Active Multi-Tenancy School Branding */}
            {currentTenant.logoUrl ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-xs shrink-0 border border-slate-200 bg-white flex items-center justify-center p-0.5 hover:ring-2 hover:ring-emerald-500/30 transition-all">
                <img 
                  src={currentTenant.logoUrl} 
                  alt={`${currentTenant.name} Crest Logo`} 
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center p-1.5 shadow-xs shrink-0 border border-slate-700">
                {currentTenant.crestIcon === 'school' ? (
                  <School className="w-5 h-5 text-sky-400" />
                ) : currentTenant.crestIcon === 'book-open' ? (
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                ) : currentTenant.crestIcon === 'shield' ? (
                  <Shield className="w-5 h-5 text-amber-400" />
                ) : (
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                )}
              </div>
            )}

            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-950 font-serif truncate max-w-[150px] sm:max-w-[210px] md:max-w-xs">
                  {currentTenant.name}
                </span>
                <span className="hidden xl:inline-block text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {currentTenant.code}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium truncate max-w-[140px] sm:max-w-[220px]">
                {currentTenant.motto}
              </p>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Context */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          {currentUser ? (
            <div 
              className="flex items-center gap-2 text-slate-600"
              aria-label={
                screenReaderMode
                  ? `Active User Profile: ${currentUser.name}, Role: ${getRoleLabel(currentUser.role)}${currentUser.grade ? `, Grade ${currentUser.grade} ${currentUser.stream || ''}` : ''}`
                  : undefined
              }
            >
              <span className="font-medium text-slate-900">{currentUser.name}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-emerald-700 font-semibold">{getRoleLabel(currentUser.role)}</span>
              {currentUser.grade && (
                <>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>Grade {currentUser.grade} {currentUser.stream ? `(${currentUser.stream})` : ''}</span>
                </>
              )}
            </div>
          ) : (
            /* EXACT VISIBLE HEADER BUTTONS: 1. Home, 2. Announcements, 3. School Calendar, 4. Contact School */
            <nav className="flex items-center gap-1.5" aria-label="Main Navigation">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  window.dispatchEvent(new CustomEvent('landing-nav', { detail: 'home' }));
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                aria-label={
                  screenReaderMode
                    ? "EduSmart Homepage: Overview of school portal, curriculum pathways, and institutional news"
                    : "Home"
                }
              >
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                <span>Home</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('announcements-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  window.dispatchEvent(new CustomEvent('landing-nav', { detail: 'announcements' }));
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                aria-label={
                  screenReaderMode
                    ? "School Announcements: Ministry circulars, term dates, and administrative alerts"
                    : "Announcements"
                }
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                <span>Announcements</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('calendar-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  window.dispatchEvent(new CustomEvent('landing-nav', { detail: 'calendar' }));
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                aria-label={
                  screenReaderMode
                    ? "School Calendar: Academic timetable, exam schedules, and holiday dates"
                    : "School Calendar"
                }
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>School Calendar</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('contact-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  window.dispatchEvent(new CustomEvent('landing-nav', { detail: 'contact' }));
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                aria-label={
                  screenReaderMode
                    ? "Contact School: Direct campus telephone, email directory, and location map"
                    : "Contact School"
                }
              >
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Contact School</span>
              </button>
            </nav>
          )}
        </div>

        {/* Zone 3: Actions & Quick Switcher */}
        <div className="hidden xl:flex items-center gap-1 sm:gap-2">
          {/* Gemini AI Multi-Turn Chatbot Trigger */}
          <button
            onClick={() => setShowGeminiModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white hover:from-indigo-950 hover:to-slate-800 rounded-lg text-xs font-bold transition-all shadow-xs border border-indigo-400/30 cursor-pointer"
            title="EduSmart Gemini AI Multi-Turn Chatbot"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">Gemini AI</span>
          </button>

          {/* Mobile Screen Overlap Protection Toggle */}
          <button
            onClick={toggleMobileOverlapProtection}
            className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
              isMobileOverlapProtectionEnabled 
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-300' 
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={
              isMobileOverlapProtectionEnabled 
                ? "Mobile Screen Overlap Protection: Active (Screen collision prevention ON)" 
                : "Mobile Screen Overlap Protection: Inactive (Click to enable protection)"
            }
            aria-label="Mobile Screen Overlap Protection"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Offline Sync Status Indicator with Progress Bar & Status Dot */}
          <OfflineSyncIndicator onOpenStorageManagement={() => setShowSettingsModal(true)} />

          {/* Settings & Storage Management Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            title="Settings & CBC Storage Management"
            aria-label="Settings and Storage Management"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Integrated Operations & Architecture Quick Launcher */}
          {currentUser && ['admin', 'head_teacher', 'deputy_head', 'finance_officer', 'procurement_officer', 'storekeeper', 'hr_manager'].includes(currentUser.role) && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-operations-hub'))}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Open Integrated Operations Hub (Finance, Procurement, Stores & HR/Payroll)"
              aria-label="Integrated Operations Hub"
            >
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span className="hidden xl:inline">Operations</span>
            </button>
          )}

          {/* Accessibility Assistive Menu Trigger (High Contrast, Font Size, Screen Reader Labels) */}
          <button
            onClick={() => setShowAccessibilityModal(true)}
            className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer relative flex items-center justify-center ${
              isCustomized
                ? 'bg-indigo-100 text-indigo-900 ring-2 ring-indigo-500 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Accessibility Menu (Alt+A): High Contrast, Font Size Scaling & Screen Reader Directory"
            aria-label={
              screenReaderMode
                ? `Accessibility Options: High contrast is ${highContrast ? 'Active' : 'Standard'}, font size is ${fontSize} percent. Click or press Alt+A to open Assistive Menu.`
                : "Accessibility Menu (Alt+A)"
            }
          >
            <Accessibility className="w-4 h-4 text-indigo-700" />
            {isCustomized && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-600 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Centralized Notification Bell with Real-Time Unread Badge & Active Indicator */}
          {currentUser && (
            <button
              onClick={toggleNotifications}
              className={`relative p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isNotificationOpen 
                  ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 shadow-inner'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={
                isNotificationOpen
                  ? 'Notifications open · Click to maximize reading view'
                  : `Notifications (${unreadCount} unread) · Click to open side-by-side`
              }
              aria-label={`Notifications, ${unreadCount} unread alerts`}
              aria-pressed={isNotificationOpen}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Demo Switcher */}
          <button
            onClick={() => setShowSwitchModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Switch demo account"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Switch Role</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Return to Super Admin Button (Matching Panel 3): Visible ONLY to platform-owner accounts while inside a tenant */}
          {isPlatformAdminSession && onReturnToSuperAdmin && (
            <div className="relative group">
              <button
                onClick={onReturnToSuperAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow transition-all cursor-pointer"
                title="Return to Super Admin Console"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Super Admin</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl border border-slate-700 pointer-events-none leading-tight text-center">
                Return to Super Admin is visible only to platform-owner accounts, while inside a tenant.
              </div>
            </div>
          )}

          {currentUser ? (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            /* EXACT VISIBLE BUTTON 5: Sign In */
            <button
              onClick={() => {
                const el = document.getElementById('portal-login-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                window.dispatchEvent(new CustomEvent('landing-nav', { detail: 'signin' }));
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        <div className="relative xl:hidden">
          <button
            type="button"
            onClick={() => setIsMobileActionsOpen(prev => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-xs"
            aria-label="Open account and app actions"
            aria-expanded={isMobileActionsOpen}
            aria-haspopup="menu"
          >
            <Layers className="h-4 w-4 text-indigo-700" />
            <span>Menu</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${isMobileActionsOpen ? 'rotate-180' : ''}`} />
          </button>
          {isMobileActionsOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 max-h-[min(70vh,32rem)] w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
              role="menu"
              aria-label="Account and app actions"
            >
              {!currentUser && (
                <>
                  <button
                    type="button"
                    onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); window.dispatchEvent(new CustomEvent('landing-nav', { detail: 'home' })); setIsMobileActionsOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                  >
                    <Home className="h-4 w-4 text-emerald-600" /> Home
                  </button>
                  <button
                    type="button"
                    onClick={() => { document.getElementById('announcements-section')?.scrollIntoView({ behavior: 'smooth' }); window.dispatchEvent(new CustomEvent('landing-nav', { detail: 'announcements' })); setIsMobileActionsOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                  >
                    <Megaphone className="h-4 w-4 text-amber-600" /> Announcements
                  </button>
                  <button
                    type="button"
                    onClick={() => { document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' }); window.dispatchEvent(new CustomEvent('landing-nav', { detail: 'calendar' })); setIsMobileActionsOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                  >
                    <Calendar className="h-4 w-4 text-blue-600" /> School calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => { document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }); window.dispatchEvent(new CustomEvent('landing-nav', { detail: 'contact' })); setIsMobileActionsOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    role="menuitem"
                  >
                    <Phone className="h-4 w-4 text-indigo-600" /> Contact school
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => { setShowGeminiModal(true); setIsMobileActionsOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                role="menuitem"
              >
                <Sparkles className="h-4 w-4 text-indigo-600" /> Gemini AI
              </button>
              <button
                type="button"
                onClick={() => { toggleMobileOverlapProtection(); setIsMobileActionsOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                role="menuitem"
              >
                <Smartphone className="h-4 w-4 text-emerald-700" />
                Screen overlap protection: {isMobileOverlapProtectionEnabled ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => { setShowSettingsModal(true); setIsMobileActionsOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                role="menuitem"
              >
                <Settings className="h-4 w-4" /> Settings and storage
              </button>
              {currentUser && ['admin', 'head_teacher', 'deputy_head', 'finance_officer', 'procurement_officer', 'storekeeper', 'hr_manager'].includes(currentUser.role) && (
                <button
                  type="button"
                  onClick={() => { window.dispatchEvent(new CustomEvent('open-operations-hub')); setIsMobileActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  role="menuitem"
                >
                  <Briefcase className="h-4 w-4 text-emerald-700" /> Operations hub
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowAccessibilityModal(true); setIsMobileActionsOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                role="menuitem"
              >
                <Accessibility className="h-4 w-4 text-indigo-700" /> Accessibility
              </button>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => { toggleNotifications(); setIsMobileActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  role="menuitem"
                >
                  <Bell className="h-4 w-4" /> Notifications ({unreadCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowSwitchModal(true); setIsMobileActionsOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                role="menuitem"
              >
                <UserCheck className="h-4 w-4" /> Switch account
              </button>
              {isPlatformAdminSession && onReturnToSuperAdmin && (
                <button
                  type="button"
                  onClick={() => { onReturnToSuperAdmin(); setIsMobileActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-blue-700 hover:bg-blue-50"
                  role="menuitem"
                >
                  <ArrowLeft className="h-4 w-4" /> Return to Super Admin
                </button>
              )}
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => { onLogout(); setIsMobileActionsOpen(false); }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { document.getElementById('portal-login-section')?.scrollIntoView({ behavior: 'smooth' }); setIsMobileActionsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                  role="menuitem"
                >
                  <LogIn className="h-4 w-4" /> Sign in
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Switcher Modal */}
      {/* Account Switcher Dedicated Window via Portal */}
      {showSwitchModal && createPortal(
        <div 
          className={`fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-200 ${
            isSwitchModalFullscreen ? 'p-0 overflow-hidden' : 'p-2 sm:p-4 md:p-6 overflow-hidden'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSwitchModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="EduSmart Instant Demo Account Switcher"
        >
          <div 
            className={`w-full bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-200 border border-slate-700/60 ${
              isSwitchModalFullscreen ? 'h-screen w-screen rounded-none border-0' : 'max-w-3xl h-[88vh] max-h-[92vh] rounded-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* WINDOW TITLE BAR WITH TRAFFIC CONTROLS, FULL PAGE TOGGLE & CLOSE BUTTON */}
            <div className="bg-slate-900 text-white px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-800 select-none shrink-0 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Traffic Light Window Controls */}
                <div className="flex items-center gap-1.5 mr-1 shrink-0">
                  <button 
                    onClick={() => setShowSwitchModal(false)}
                    className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center text-[9px] text-white font-bold cursor-pointer"
                    title="Close Window (Esc)"
                    aria-label="Close Window"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                  <button 
                    onClick={() => setIsSwitchModalFullscreen(prev => !prev)}
                    className="w-3.5 h-3.5 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center cursor-pointer"
                    title="Toggle Window Size"
                    aria-label="Toggle Window Size"
                  />
                  <button 
                    onClick={() => setIsSwitchModalFullscreen(prev => !prev)}
                    className="w-3.5 h-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center text-[8px] text-emerald-950 cursor-pointer"
                    title={isSwitchModalFullscreen ? 'Restore Window Size' : 'Expand to Full Page'}
                    aria-label="Expand Window"
                  >
                    <Maximize2 className="w-2 h-2" />
                  </button>
                </div>

                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 shrink-0 hidden xs:flex">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate block">
                      Instant Demo Account Switcher
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                      Test permissions and workspaces across all school departments
                    </p>
                  </div>
                </div>
              </div>

              {/* Title Bar Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Full Page View Button */}
                <button
                  onClick={() => setIsSwitchModalFullscreen(prev => !prev)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700 shrink-0"
                  title={isSwitchModalFullscreen ? 'Restore standard view' : 'Expand to full page view'}
                  aria-label={isSwitchModalFullscreen ? 'Restore standard view' : 'Expand to full page view'}
                >
                  {isSwitchModalFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Exit Full Page</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Full Page View</span>
                    </>
                  )}
                </button>

                {/* UNMISSABLE CLOSE BUTTON */}
                <button
                  onClick={() => setShowSwitchModal(false)}
                  className="px-3 sm:px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer active:scale-95 shrink-0"
                  title="Close Window (Esc)"
                  aria-label="Close Window"
                >
                  <X className="w-4 h-4 text-white" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* SCROLLABLE BODY WITH MIN-H-0 */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0 bg-slate-50/60">
              
              {/* 1. Learners & Parents */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>1. Learners & Parents</span>
                  <span className="text-[10px] text-slate-400 font-normal">Student & Parent Portals</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allUsers
                    .filter(u => ['student', 'parent'].includes(u.role))
                    .map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setShowSwitchModal(false);
                        }}
                        className={`text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          currentUser?.id === user.id
                            ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{user.name}</div>
                          <div className="text-[11px] text-emerald-700 font-semibold">{getRoleLabel(user.role)}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Main Access: {user.role === 'student' ? 'Own academic & school info' : "Their children's information"}
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono shrink-0">
                          {user.role === 'student' ? `GR${user.grade}@2026` : 'parent2026'}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 2. Teachers & Class Teachers */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>2. Academic Department</span>
                  <span className="text-[10px] text-slate-400 font-normal">Work Entry & Registers</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allUsers
                    .filter(u => ['teacher', 'class_teacher'].includes(u.role))
                    .slice(0, 3)
                    .map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setShowSwitchModal(false);
                        }}
                        className={`text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          currentUser?.id === user.id
                            ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{user.name}</div>
                          <div className="text-[11px] text-emerald-700 font-semibold">{getRoleLabel(user.role)}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Main Access: {user.role === 'class_teacher' ? 'Assigned class + learners' : 'Assigned classes and subjects'}
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                          {user.grade ? `Gr ${user.grade} ${user.stream}` : 'Academic Dept'}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 3. Department, Supervision & Library */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>3. Academic Supervision, HOD & Library</span>
                  <span className="text-[10px] text-slate-400 font-normal">Department & Library</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allUsers
                    .filter(u => ['hod', 'senior_teacher', 'dean_of_studies', 'librarian'].includes(u.role))
                    .map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setShowSwitchModal(false);
                        }}
                        className={`text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          currentUser?.id === user.id
                            ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{user.name}</div>
                          <div className="text-[11px] text-indigo-700 font-semibold">{getRoleLabel(user.role)}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Main Access: {
                              user.role === 'hod' ? 'Department' :
                              user.role === 'senior_teacher' ? 'Academic/learner supervision' :
                              user.role === 'librarian' ? 'Library' : 'Academic/assessment'
                            }
                          </div>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded font-mono shrink-0">
                          {user.role === 'hod' ? 'HOD' : user.role === 'librarian' ? 'Library' : 'Audit'}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 4. Executive Leadership & Administration */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>4. Executive Leadership & Administration</span>
                  <span className="text-[10px] text-slate-400 font-normal">Governance, Curriculum & Operations</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {allUsers
                    .filter(u => ['curriculum_coordinator', 'deputy_head', 'head_teacher', 'admin'].includes(u.role) || (u.role === 'school_admin_staff' && u.email !== 'nurse@edusmart.ac.ke'))
                    .map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setShowSwitchModal(false);
                        }}
                        className={`text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          currentUser?.id === user.id
                            ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{user.name}</div>
                          <div className="text-[11px] text-slate-800 font-bold">{getRoleLabel(user.role)}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Main Access: {
                              user.role === 'curriculum_coordinator' ? 'CBC Curriculum, CBA Moderation & Pacing' :
                              user.role === 'deputy_head' ? 'Operations/discipline/staff' :
                              user.role === 'head_teacher' ? 'School-wide management' :
                              user.role === 'school_admin_staff' ? 'Work entry, gate exits, registers, calendar & printables' :
                              'Full system administration'
                            }
                          </div>
                        </div>
                        <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    ))}
                </div>
              </div>

              {/* 5. Sanatorium, Transport & Co-Curricular Teams */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>5. Sanatorium, Transport & Co-Curricular Teams</span>
                  <span className="text-[10px] text-slate-400 font-normal">Active Operations & Healthcare Care</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {allUsers
                    .filter(u => ['transport_team', 'cocurricular_team', 'nurse'].includes(u.role) || u.email === 'nurse@edusmart.ac.ke' || (u.designation && u.designation.toLowerCase().includes('nurse')))
                    .map(user => {
                      const isNurse = user.role === 'nurse' || user.email === 'nurse@edusmart.ac.ke' || (user.designation && user.designation.toLowerCase().includes('nurse'));
                      const isTransport = user.role === 'transport_team';
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            onSwitchUser(user);
                            setShowSwitchModal(false);
                          }}
                          className={`text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                            currentUser?.id === user.id
                              ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{user.name}</div>
                            <div className={`text-[11px] font-bold ${
                              isNurse ? 'text-rose-700' : isTransport ? 'text-amber-700' : 'text-emerald-700'
                            }`}>
                              {isNurse ? 'School Nursing Officer' : getRoleLabel(user.role)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Main Access: {
                                isNurse ? 'Sanatorium clinical admissions, triage & sick bay logs' :
                                isTransport ? 'Fleet operations, student boarding & daily route tracking' :
                                'Sports academy, clubs, fixtures & talent matrix'
                              }
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                            isNurse ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                            isTransport ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isNurse ? '🏥 Sanatorium' : isTransport ? '🚌 Transport' : '🎯 Sports'}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* 6. Integrated Finance, Procurement, Stores & HR/Payroll Operations */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>6. Integrated Finance, Procurement, Stores & HR/Payroll</span>
                  <span className="text-[10px] text-slate-400 font-normal">Campus Operations & Accounting</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {allUsers
                    .filter(u => ['finance_officer', 'procurement_officer', 'storekeeper', 'hr_manager'].includes(u.role))
                    .map(user => {
                      const isFin = user.role === 'finance_officer';
                      const isProc = user.role === 'procurement_officer';
                      const isStore = user.role === 'storekeeper';
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            onSwitchUser(user);
                            setShowSwitchModal(false);
                          }}
                          className={`text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                            currentUser?.id === user.id
                              ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{user.name}</div>
                            <div className={`text-[11px] font-bold ${
                              isFin ? 'text-emerald-700' :
                              isProc ? 'text-blue-700' :
                              isStore ? 'text-amber-700' :
                              'text-purple-700'
                            }`}>
                              {getRoleLabel(user.role)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Main Access: {
                                isFin ? 'Fee billing, M-Pesa receipts, General Ledger' :
                                isProc ? 'Requisitions, supplier quotations, LPO issuance' :
                                isStore ? 'Central stores, GRNs, stock issues & stocktake' :
                                'Staff records, PAYE/NSSF payroll & payslips'
                              }
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                            isFin ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            isProc ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            isStore ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}>
                            {isFin ? '💰 Finance' : isProc ? '🛒 Procurement' : isStore ? '📦 Stores' : '👥 HR'}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

            </div>

            {/* DEDICATED WINDOW FOOTER */}
            <div className="p-3 sm:px-5 border-t border-slate-200 bg-slate-100 flex items-center justify-between text-xs text-slate-600 shrink-0 gap-2">
              {!isSupabaseConfigured && (
                <button
                  onClick={() => {
                    Storage.resetAllData();
                    window.location.reload();
                  }}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors font-medium text-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Demo Data</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSwitchModalFullscreen(prev => !prev)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                  title={isSwitchModalFullscreen ? 'Restore standard view' : 'Expand to full page view'}
                  aria-label={isSwitchModalFullscreen ? 'Restore standard view' : 'Expand to full page view'}
                >
                  {isSwitchModalFullscreen ? <Minimize2 className="w-3 h-3 text-amber-600" /> : <Maximize2 className="w-3 h-3 text-emerald-600" />}
                  <span>{isSwitchModalFullscreen ? 'Exit Full Page' : 'Full Page'}</span>
                </button>

                <button
                  onClick={() => setShowSwitchModal(false)}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
 
      {/* Settings & Storage Management Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Gemini AI Multi-Turn Chatbot Modal */}
      <GeminiChatbotModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        currentUser={currentUser}
      />

      {/* Accessibility Assistive Settings Modal */}
      <AccessibilityModal
        isOpen={showAccessibilityModal}
        onClose={() => setShowAccessibilityModal(false)}
        onSwitchUser={onSwitchUser}
      />

    </header>
  );
};
