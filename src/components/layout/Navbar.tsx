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
  LogIn
} from 'lucide-react';

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
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const { isNotificationOpen, toggleNotifications, unreadCount } = useNotificationLayout();

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
      case 'librarian': return 'Librarian';
      case 'head_teacher': return 'Head Teacher';
      case 'school_admin_staff': return 'School Admin Staff / Registrar';
      case 'admin': return 'System Administrator';
      default: return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Edu-Smart PORTAL logo by Gadsa Systems */}
        <button 
          onClick={onNavigateHome}
          className="flex items-center text-left text-slate-900 hover:opacity-90 transition-opacity focus:outline-none"
          title="Edu-Smart PORTAL — By Gadsa Systems"
        >
          <EduSmartGadsaLogo variant="horizontal" size="sm" />
        </button>

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
        <div className="flex items-center gap-2 sm:gap-2.5">
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
                  <span>2. Teaching Faculty</span>
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
                          {user.grade ? `Gr ${user.grade} ${user.stream}` : 'Faculty'}
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
                  <span>4. Executive Management & Administration</span>
                  <span className="text-[10px] text-slate-400 font-normal">School Operations & Admin</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {allUsers
                    .filter(u => ['deputy_head', 'head_teacher', 'school_admin_staff', 'admin'].includes(u.role))
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


    </header>
  );
};
