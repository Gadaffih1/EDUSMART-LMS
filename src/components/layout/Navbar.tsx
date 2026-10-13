import React, { useState, useEffect } from 'react';
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
  Atom,
  Layers,
  Smartphone,
  Check
} from 'lucide-react';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { SettingsModal } from '../settings/SettingsModal';
import { useTenant } from '../../context/TenantContext';
import { useMobileLayout } from '../../context/MobileLayoutContext';
import { GeminiChatbotModal } from '../ai/GeminiChatbotModal';
import { ScienceViewerModal } from '../virtuallab/ScienceViewerModal';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  onNavigateHome
}) => {
  const { currentTenant, allTenants, switchTenant } = useTenant();
  const { isMobileOverlapProtectionEnabled, toggleMobileOverlapProtection } = useMobileLayout();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [showScienceModal, setShowScienceModal] = useState(false);

  const { isNotificationOpen, toggleNotifications, unreadCount } = useNotificationLayout();

  useEffect(() => {
    const handleOpenSettings = () => setShowSettingsModal(true);
    window.addEventListener('open-storage-settings', handleOpenSettings);
    return () => window.removeEventListener('open-storage-settings', handleOpenSettings);
  }, []);

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
      case 'admin': return 'System Administrator';
      default: return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Zone 1: Current School Branding (Multi-Tenancy) & Campus Selector */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left text-slate-900 hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
            title={`${currentTenant.name} — ${currentTenant.motto}`}
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

          {/* Multi-Tenancy Campus Switcher Badge */}
          <button
            onClick={() => setShowTenantModal(true)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title="Switch School Tenant (Multi-Tenancy)"
          >
            <School className="w-3.5 h-3.5 text-emerald-600" />
            <span>Campus</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Zone 2: Navigation Context */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          {currentUser ? (
            <div className="flex items-center gap-2 text-slate-600">
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Contact School</span>
              </button>
            </nav>
          )}
        </div>

        {/* Zone 3: Actions & Quick Switcher */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Gemini AI Multi-Turn Chatbot Trigger */}
          <button
            onClick={() => setShowGeminiModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white hover:from-indigo-950 hover:to-slate-800 rounded-lg text-xs font-bold transition-all shadow-xs border border-indigo-400/30 cursor-pointer"
            title="EduSmart Gemini AI Multi-Turn Chatbot"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">Gemini AI</span>
          </button>

          {/* CBC Science Explorer & 3D Molecular Viewer */}
          <button
            onClick={() => setShowScienceModal(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
            title="CBC Science Explorer & 3D Molecular Simulation"
            aria-label="CBC Science Explorer"
          >
            <Atom className="w-4 h-4 text-cyan-600" />
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

          {/* Multi-Tenancy School Switcher Button (Mobile View) */}
          <button
            onClick={() => setShowTenantModal(true)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            title={`Switch Campus (Current: ${currentTenant.shortName})`}
            aria-label="Switch Campus"
          >
            <School className="w-4 h-4 text-emerald-600" />
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

          {currentUser ? (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 rounded-lg border border-rose-200 transition-colors"
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
      </div>

      {/* Account Switcher Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Instant Demo Account Switcher</h3>
                <p className="text-xs text-slate-500">Test different permissions and workspaces across the entire platform.</p>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 max-h-[70vh]">
              
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

            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => {
                  Storage.resetAllData();
                  window.location.reload();
                }}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Default Demo Data</span>
              </button>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded font-medium text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Settings & Storage Management Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Multi-Tenancy Campus Switcher Modal */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <School className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                    <span>Multi-Tenancy School Selector</span>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.2 rounded font-mono font-bold">
                      {allTenants.length} Campuses
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Switch between isolated school campuses without cross-school data interference
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTenantModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Close Campus Switcher"
              >
                ✕
              </button>
            </div>

            {/* Tenant Campus Cards */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 max-h-[65vh] bg-slate-50/50">
              {allTenants.map((tenant) => {
                const isActive = tenant.id === currentTenant.id;
                return (
                  <div
                    key={tenant.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white ${
                      isActive 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {tenant.logoUrl ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xs shrink-0 border border-slate-200 bg-white flex items-center justify-center p-1">
                          <img 
                            src={tenant.logoUrl} 
                            alt={`${tenant.name} Logo`} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center p-1.5 shrink-0 border border-slate-700">
                          {tenant.crestIcon === 'school' ? (
                            <School className="w-6 h-6 text-sky-400" />
                          ) : tenant.crestIcon === 'book-open' ? (
                            <BookOpen className="w-6 h-6 text-indigo-400" />
                          ) : tenant.crestIcon === 'shield' ? (
                            <Shield className="w-6 h-6 text-amber-400" />
                          ) : (
                            <GraduationCap className="w-6 h-6 text-amber-400" />
                          )}
                          <span className="text-[7px] font-mono tracking-widest uppercase mt-0.5 text-slate-300">EST. {tenant.establishedYear}</span>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-950 font-serif">
                            {tenant.name}
                          </h4>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {tenant.code}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Active Campus</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 italic mt-0.5">
                          "{tenant.motto}"
                        </p>

                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>📍 {tenant.address}, {tenant.city}</span>
                          <span>·</span>
                          <span>👨‍🏫 {tenant.principalName} ({tenant.principalTitle})</span>
                          <span>·</span>
                          <span className="font-mono">🎓 {tenant.totalStudents} Learners</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          switchTenant(tenant.id);
                          setShowTenantModal(false);
                        }}
                        disabled={isActive}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-100 text-slate-400 cursor-default'
                            : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs'
                        }`}
                      >
                        {isActive ? 'Current Session' : 'Switch to Campus'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="text-[11px]">
                Each school maintains completely isolated student rosters, CBC grading rubrics, and schedules.
              </span>
              <button
                onClick={() => setShowTenantModal(false)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Multi-Turn Chatbot Modal */}
      <GeminiChatbotModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        currentUser={currentUser}
      />

      {/* CBC Science Explorer & 3D Molecular Simulation Modal */}
      <ScienceViewerModal
        isOpen={showScienceModal}
        onClose={() => setShowScienceModal(false)}
      />

    </header>
  );
};
