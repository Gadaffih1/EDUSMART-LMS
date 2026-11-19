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
  Accessibility,
  Library
} from 'lucide-react';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { SettingsModal } from '../settings/SettingsModal';
import { useTenant } from '../../context/TenantContext';
import { useMobileLayout } from '../../context/MobileLayoutContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { AccessibilityModal } from '../common/AccessibilityModal';
import { GeminiChatbotModal } from '../ai/GeminiChatbotModal';
import { PWAInstallButton } from '../pwa/PWAInstallExperience';
import {
  getAdministrativeRoleDisplayName,
  getAdministrativeRoleShortName,
  userHasRole,
} from '../../utils/subjectTeacherSwitch';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  onNavigateHome: () => void;
  isPlatformAdminSession?: boolean;
  onReturnToSuperAdmin?: () => void;
  canSwitchToSubjectTeacher?: boolean;
  isSubjectTeacherMode?: boolean;
  onToggleSubjectTeacherMode?: () => void;
  canSwitchToClassTeacher?: boolean;
  isClassTeacherMode?: boolean;
  onToggleClassTeacherMode?: () => void;
  switchedWorkspaceRole?: UserRole | null;
  switchableRoles?: UserRole[];
  onSwitchWorkspaceRole?: (role: UserRole | null) => void;
  canAccessLibrary?: boolean;
  isViewingLibrary?: boolean;
  onToggleSchoolLibrary?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  onNavigateHome,
  isPlatformAdminSession = false,
  onReturnToSuperAdmin,
  canSwitchToSubjectTeacher = false,
  isSubjectTeacherMode = false,
  onToggleSubjectTeacherMode,
  canSwitchToClassTeacher = false,
  isClassTeacherMode = false,
  onToggleClassTeacherMode,
  switchedWorkspaceRole = null,
  switchableRoles = [],
  onSwitchWorkspaceRole,
  canAccessLibrary = false,
  isViewingLibrary = false,
  onToggleSchoolLibrary
}) => {
  const { currentTenant, allTenants, switchTenant } = useTenant();
  const { isMobileOverlapProtectionEnabled, toggleMobileOverlapProtection } = useMobileLayout();

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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-14 sm:min-h-16 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Zone 1: Current School Branding (Multi-Tenancy) & Campus Selector */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <button 
            onClick={onNavigateHome}
            className="edusmart-brand-btn flex items-center gap-2.5 text-left text-slate-900 hover:opacity-90 transition-opacity focus:outline-none cursor-pointer min-w-0"
            title={`${currentTenant.name} — ${currentTenant.motto}`}
            aria-label={
              screenReaderMode 
                ? `${currentTenant.name} School Portal, institutional motto: ${currentTenant.motto}. Campus code: ${currentTenant.code}. Click to return to homepage.`
                : `${currentTenant.name} — ${currentTenant.motto}`
            }
          >
            {/* School Crest Logo with Active Multi-Tenancy School Branding (Generous Mobile Visibility) */}
            {(currentTenant.customLogoBase64 || currentTenant.logoUrl) ? (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-xs shrink-0 border border-slate-200 bg-white flex items-center justify-center p-0.5 hover:ring-2 hover:ring-emerald-500/30 transition-all">
                <img 
                  src={currentTenant.customLogoBase64 || currentTenant.logoUrl} 
                  alt={`${currentTenant.name} Crest Logo`} 
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center p-1.5 shadow-xs shrink-0 border border-slate-700">
                {currentTenant.crestIcon === 'school' ? (
                  <School className="w-6 h-6 text-sky-400" />
                ) : currentTenant.crestIcon === 'book-open' ? (
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                ) : currentTenant.crestIcon === 'shield' ? (
                  <Shield className="w-6 h-6 text-amber-400" />
                ) : (
                  <GraduationCap className="w-6 h-6 text-amber-400" />
                )}
              </div>
            )}

            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-950 font-serif truncate max-w-[140px] sm:max-w-[220px] md:max-w-xs">
                  {currentTenant.name}
                </span>
                <span className="hidden xl:inline-block text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {currentTenant.code}
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-500 font-medium truncate max-w-[140px] sm:max-w-[220px]">
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
              {switchedWorkspaceRole && (
                <>
                  <span aria-hidden="true" className="text-slate-300">&rarr;</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                    {getAdministrativeRoleShortName(switchedWorkspaceRole)} Workspace
                  </span>
                </>
              )}
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
          <PWAInstallButton variant="header" label="Install App" />

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

          {/* School Library Quick Access for ALL Subject Teachers & Teaching Faculty */}
          {currentUser && canAccessLibrary && onToggleSchoolLibrary && (
            <button
              type="button"
              onClick={onToggleSchoolLibrary}
              className={`px-2.5 py-1.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap ${
                isViewingLibrary
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-purple-700 text-white border-purple-800 hover:bg-purple-800 shadow-xs'
              }`}
              title="Open School Library Catalogue, Digital E-Books & Library Room Booking"
              aria-pressed={isViewingLibrary}
            >
              {isViewingLibrary ? (
                <>
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-700" />
                  <span>Exit Library</span>
                </>
              ) : (
                <>
                  <Library className="w-3.5 h-3.5 text-purple-200" />
                  <span>School Library</span>
                </>
              )}
            </button>
          )}

          {/* Switch to Class Teacher Workspace Button (All HODs & Multi-Role Class Teachers) */}
          {currentUser && canSwitchToClassTeacher && onToggleClassTeacherMode && (
            <button
              type="button"
              onClick={onToggleClassTeacherMode}
              className={`px-2.5 py-1.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap ${
                isClassTeacherMode
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-xs'
              }`}
              title={
                isClassTeacherMode
                  ? `Return to your primary ${getRoleLabel(currentUser.role)} workspace`
                  : 'Switch to Class Teacher workspace with full Class Teacher rights for your assigned class'
              }
              aria-pressed={isClassTeacherMode}
            >
              {isClassTeacherMode ? (
                <>
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-700" />
                  <span>Return to {getAdministrativeRoleShortName(currentUser.role)}</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Switch as Class Teacher</span>
                </>
              )}
            </button>
          )}

          {/* Switch to Subject Teacher Workspace Button (Authorized Admin/Leadership Roles) */}
          {currentUser && canSwitchToSubjectTeacher && onToggleSubjectTeacherMode && (
            <button
              type="button"
              onClick={onToggleSubjectTeacherMode}
              className={`px-2.5 py-1.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap ${
                isSubjectTeacherMode
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 shadow-xs'
              }`}
              title={
                isSubjectTeacherMode
                  ? `Return to your primary ${getRoleLabel(currentUser.role)} workspace`
                  : 'Switch to Subject Teacher workspace with full Subject Teacher rights'
              }
              aria-pressed={isSubjectTeacherMode}
            >
              {isSubjectTeacherMode ? (
                <>
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-700" />
                  <span>Return to {getAdministrativeRoleShortName(currentUser.role)}</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-indigo-100" />
                  <span>Switch as Subject Teacher</span>
                </>
              )}
            </button>
          )}

          {/* Multi-Role Workspace Switcher (when user holds >1 roles beyond primary + teacher/class_teacher shortcuts) */}
          {currentUser && onSwitchWorkspaceRole && switchableRoles.filter((r) => r !== 'teacher' && r !== 'class_teacher').length > 0 && (
            <select
              aria-label="Switch assigned workspace role"
              value={switchedWorkspaceRole || currentUser.role}
              onChange={(e) => {
                const chosen = e.target.value as UserRole;
                onSwitchWorkspaceRole(chosen === currentUser.role ? null : chosen);
              }}
              className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-bold cursor-pointer max-w-[165px]"
              title="Switch between your multiple assigned roles"
            >
              <option value={currentUser.role}>
                Primary: {getAdministrativeRoleShortName(currentUser.role)}
              </option>
              {switchableRoles
                .filter((r) => r !== currentUser.role)
                .map((r) => (
                  <option key={r} value={r}>
                    Switch: {getAdministrativeRoleDisplayName(r)}
                  </option>
                ))}
            </select>
          )}

          {/* Delegated Extra Role: Student Stream Allocations Quick Launcher (ONLY for non-admin/non-senior staff explicitly assigned the extra role) */}
          {currentUser &&
            Array.isArray(currentUser.extraRoles) &&
            currentUser.extraRoles.includes('student_stream_allocator') &&
            !userHasRole(currentUser, 'admin') &&
            !userHasRole(currentUser, 'senior_teacher') && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-stream-allocator'))}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap"
                title="Open Student Stream Assignment Hub (Delegated Extra Role)"
                aria-label="Student Stream Allocations"
              >
                <Users className="w-4 h-4 text-sky-600" />
                <span className="hidden xl:inline">Student Streams</span>
              </button>
            )}

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

        <div className="flex items-center gap-1.5 sm:gap-2 xl:hidden shrink-0">
          {currentUser && canAccessLibrary && onToggleSchoolLibrary && (
            <button
              type="button"
              onClick={onToggleSchoolLibrary}
              className={`min-h-[38px] inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap ${
                isViewingLibrary
                  ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border-purple-800 bg-purple-700 text-white hover:bg-purple-800'
              }`}
              title="Open School Library Contents & Room Booking"
              aria-pressed={isViewingLibrary}
            >
              {isViewingLibrary ? (
                <>
                  <ArrowLeft className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <span>Back</span>
                </>
              ) : (
                <>
                  <Library className="h-3.5 w-3.5 text-purple-200 shrink-0" />
                  <span>Library</span>
                </>
              )}
            </button>
          )}
          {currentUser && canSwitchToClassTeacher && onToggleClassTeacherMode && (
            <button
              type="button"
              onClick={onToggleClassTeacherMode}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap ${
                isClassTeacherMode
                  ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
              aria-pressed={isClassTeacherMode}
            >
              {isClassTeacherMode ? (
                <>
                  <ArrowLeft className="h-3.5 w-3.5 text-amber-700" />
                  <span>Return to {getAdministrativeRoleShortName(currentUser.role)}</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Switch as Class Teacher</span>
                </>
              )}
            </button>
          )}
          {currentUser && canSwitchToSubjectTeacher && onToggleSubjectTeacherMode && (
            <button
              type="button"
              onClick={onToggleSubjectTeacherMode}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap ${
                isSubjectTeacherMode
                  ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border-indigo-700 bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              aria-pressed={isSubjectTeacherMode}
            >
              {isSubjectTeacherMode ? (
                <>
                  <ArrowLeft className="h-3.5 w-3.5 text-amber-700" />
                  <span>Return to {getAdministrativeRoleShortName(currentUser.role)}</span>
                </>
              ) : (
                <>
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Switch as Subject Teacher</span>
                </>
              )}
            </button>
          )}
          <div className="relative">
          <button
            type="button"
            onClick={() => setIsMobileActionsOpen(prev => !prev)}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
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
              className="absolute right-0 top-full z-50 mt-2 max-h-[min(75dvh,32rem)] w-[min(17.5rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl space-y-1"
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
              <PWAInstallButton
                variant="menu-item"
                onAfterAction={() => setIsMobileActionsOpen(false)}
              />
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
              {currentUser && canAccessLibrary && onToggleSchoolLibrary && (
                <button
                  type="button"
                  onClick={() => { onToggleSchoolLibrary(); setIsMobileActionsOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                    isViewingLibrary
                      ? 'text-amber-900 bg-amber-50 hover:bg-amber-100'
                      : 'text-purple-800 bg-purple-50 hover:bg-purple-100'
                  }`}
                  role="menuitem"
                >
                  {isViewingLibrary ? (
                    <>
                      <ArrowLeft className="h-4 w-4 text-amber-700" /> Exit School Library
                    </>
                  ) : (
                    <>
                      <Library className="h-4 w-4 text-purple-700" /> School Library &amp; Room Booking
                    </>
                  )}
                </button>
              )}
              {currentUser && canSwitchToClassTeacher && onToggleClassTeacherMode && (
                <button
                  type="button"
                  onClick={() => { onToggleClassTeacherMode(); setIsMobileActionsOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                    isClassTeacherMode
                      ? 'text-amber-900 bg-amber-50 hover:bg-amber-100'
                      : 'text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100'
                  }`}
                  role="menuitem"
                >
                  {isClassTeacherMode ? (
                    <>
                      <ArrowLeft className="h-4 w-4 text-amber-700" /> Return to {getAdministrativeRoleShortName(currentUser.role)}
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 text-emerald-700" /> Switch as Class Teacher
                    </>
                  )}
                </button>
              )}
              {currentUser && canSwitchToSubjectTeacher && onToggleSubjectTeacherMode && (
                <button
                  type="button"
                  onClick={() => { onToggleSubjectTeacherMode(); setIsMobileActionsOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                    isSubjectTeacherMode
                      ? 'text-amber-900 bg-amber-50 hover:bg-amber-100'
                      : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100'
                  }`}
                  role="menuitem"
                >
                  {isSubjectTeacherMode ? (
                    <>
                      <ArrowLeft className="h-4 w-4 text-amber-700" /> Return to {getAdministrativeRoleShortName(currentUser.role)}
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 text-indigo-700" /> Switch as Subject Teacher
                    </>
                  )}
                </button>
              )}
              {currentUser && onSwitchWorkspaceRole && switchableRoles
                .filter((r) => r !== currentUser.role && r !== 'teacher' && r !== 'class_teacher')
                .map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onSwitchWorkspaceRole(switchedWorkspaceRole === r ? null : r);
                      setIsMobileActionsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                      switchedWorkspaceRole === r
                        ? 'text-amber-900 bg-amber-50 hover:bg-amber-100'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    role="menuitem"
                  >
                    <RefreshCw className="h-4 w-4 text-indigo-600" />
                    {switchedWorkspaceRole === r
                      ? `Return to ${getAdministrativeRoleShortName(currentUser.role)}`
                      : `Switch as ${getAdministrativeRoleShortName(r)}`}
                  </button>
                ))}
              {currentUser &&
                Array.isArray(currentUser.extraRoles) &&
                currentUser.extraRoles.includes('student_stream_allocator') &&
                !userHasRole(currentUser, 'admin') &&
                !userHasRole(currentUser, 'senior_teacher') && (
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-stream-allocator'));
                      setIsMobileActionsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100"
                    role="menuitem"
                  >
                    <Users className="h-4 w-4 text-sky-700" /> Student Stream Allocations
                  </button>
                )}
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
      </div>

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
      />

    </header>
  );
};
