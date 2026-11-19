/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from './types';
import { Storage } from './utils/storage';
import { NotificationLayoutProvider, useNotificationLayout } from './context/NotificationLayoutContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { MobileLayoutProvider, useMobileLayout } from './context/MobileLayoutContext';
import { PlatformCustomizationProvider, usePlatformCustomization } from './context/PlatformCustomizationContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Navbar } from './components/layout/Navbar';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { PublicLandingPage } from './components/landing/PublicLandingPage';
import { UnifiedLoginPage } from './components/auth/UnifiedLoginPage';
import { LandingPage } from './components/landing/LandingPage';
import { StudentWorkspace } from './components/student/StudentWorkspace';
import { ParentWorkspace } from './components/parent/ParentWorkspace';
import { TeacherWorkspace } from './components/teacher/TeacherWorkspace';
import { ClassTeacherWorkspace } from './components/teacher/ClassTeacherWorkspace';
import { HODWorkspace } from './components/hod/HODWorkspace';
import { SeniorTeacherWorkspace } from './components/supervision/SeniorTeacherWorkspace';
import { LibrarianWorkspace } from './components/library/LibrarianWorkspace';
import { DeputyHeadWorkspace } from './components/operations/DeputyHeadWorkspace';
import { DeanOfStudiesWorkspace } from './components/academic/DeanOfStudiesWorkspace';
import { HeadTeacherWorkspace } from './components/leadership/HeadTeacherWorkspace';
import { CurriculumCoordinatorWorkspace } from './components/leadership/CurriculumCoordinatorWorkspace';
import { SchoolAdminStaffWorkspace } from './components/admin/SchoolAdminStaffWorkspace';
import { SanatoriumWorkspace } from './components/sanatorium/SanatoriumWorkspace';
import { TransportWorkspace } from './components/transport/TransportWorkspace';
import { CoCurricularWorkspace } from './components/cocurricular/CoCurricularWorkspace';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { IntegratedOperationsHub } from './components/operations/IntegratedOperationsHub';
import { SuperAdminPortalView } from './components/admin/SuperAdminPortalView';
import { QuickActionsFloatingMenu } from './components/layout/QuickActionsFloatingMenu';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { WorkspaceRoleGuard } from './components/common/WorkspaceRoleGuard';
import { Maximize2, CheckCheck, Megaphone, Sparkles } from 'lucide-react';
import { findSystemRole } from './utils/systemRoles';
import { ClientDataStore } from './utils/clientDataStore';
import { isPlatformSuperAdmin } from './utils/platformAdminAuth';
import { fromAppPath, toAppPath } from './utils/appPath';
import { PWAInstallInvitation, PWAUpdateAndOfflineBanner } from './components/pwa/PWAInstallExperience';
import { InactivityTimeoutModal } from './components/auth/InactivityTimeoutModal';
import {
  SUBJECT_TEACHER_ELIGIBLE_ROLES,
  canSwitchToClassTeacher,
  canSwitchToSubjectTeacher,
  createRoleProxyUser,
  getAdministrativeRoleDisplayName,
  getSwitchableWorkspaceRoles,
} from './utils/subjectTeacherSwitch';

type PortalView = 'public_landing' | 'unified_login' | 'super_admin' | 'school_lms';
const schoolRouteMap = new Map<string, string>();

function getPortalRoute(pathname: string): { view: PortalView; routeId?: string } {
  const normalizedPath = toAppPath(pathname);

  if (normalizedPath === '/login') {
    return { view: 'unified_login' };
  }
  if (normalizedPath === '/admin') {
    return { view: 'super_admin' };
  }

  const schoolRoute = normalizedPath.match(/^\/school(?:\/([^/]+))?$/);
  if (schoolRoute) {
    return { view: 'school_lms', routeId: schoolRoute[1] };
  }

  return { view: 'public_landing' };
}

function resolveSchoolRoute(routeId: string | undefined): string | undefined {
  if (!routeId) return undefined;
  return schoolRouteMap.get(routeId) || routeId;
}

function createSchoolRouteId(schoolId: string): string {
  const routeId = crypto.randomUUID().replace(/-/g, '');
  schoolRouteMap.set(routeId, schoolId);
  return routeId;
}

function AppContent({
  currentUser,
  onLoginSuccess,
  onLogout,
  onSwitchUser,
  onNavigateHome,
  onLoginVisibilityChange
}: {
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  onNavigateHome: () => void;
  onLoginVisibilityChange: (isLoginVisible: boolean) => void;
}) {
  const { currentTenant, allTenants, switchTenant } = useTenant();
  const { isNotificationOpen, closeNotifications } = useNotificationLayout();
  const { isMobileOverlapProtectionEnabled } = useMobileLayout();
  const { customization, isWorkspaceEnabled } = usePlatformCustomization();
  
  // Navigation Flow State as per User Architectural Guide Diagram:
  // 1. 'public_landing': Screen 1 Public EduSmart Landing Page (No Super Admin button)
  // 2. 'unified_login': Screen 2 Unified Login Page (Select school, credentials)
  // 3. 'super_admin': Screen 4 Super Admin Console (Platform management, Campus Switcher)
  // 4. 'school_lms': Screen 3 Tenant School Workspace (e.g. Riara School, Return to Super Admin visible ONLY to platform owners)
  const [portalView, setPortalView] = useState<PortalView>(() => getPortalRoute(window.location.pathname).view);
  const [isPlatformAdminSession, setIsPlatformAdminSession] = useState<boolean>(false);
  const [viewingOperationsHub, setViewingOperationsHub] = useState<boolean>(false);
  const resolvePersistedSwitchedRole = React.useCallback((user: User | null): UserRole | null => {
    if (!user) return null;
    const saved = Storage.getActiveSwitchedRole(user.id);
    if (!saved || saved === user.role) return null;
    const allowed = getSwitchableWorkspaceRoles(user);
    return allowed.includes(saved) ? saved : null;
  }, []);

  const [switchedWorkspaceRole, setSwitchedWorkspaceRole] = useState<UserRole | null>(() =>
    resolvePersistedSwitchedRole(currentUser)
  );

  React.useEffect(() => {
    setSwitchedWorkspaceRole(resolvePersistedSwitchedRole(currentUser));
  }, [currentUser, resolvePersistedSwitchedRole]);

  const updateSwitchedWorkspaceRole = React.useCallback(
    (nextRole: UserRole | null) => {
      const normalized = currentUser && nextRole && nextRole !== currentUser.role ? nextRole : null;
      setSwitchedWorkspaceRole(normalized);
      if (currentUser?.id) {
        Storage.setActiveSwitchedRole(normalized, currentUser.id);
      }
    },
    [currentUser]
  );

  const canSwitchSubjectTeacher = Boolean(currentUser && canSwitchToSubjectTeacher(currentUser));
  const canSwitchClassTeacher = Boolean(currentUser && canSwitchToClassTeacher(currentUser));
  const switchableRoles = React.useMemo(
    () => (currentUser ? getSwitchableWorkspaceRoles(currentUser) : []),
    [currentUser]
  );

  const effectiveRole: UserRole = switchedWorkspaceRole || currentUser?.role || 'student';
  const isSubjectTeacherMode = effectiveRole === 'teacher' && currentUser?.role !== 'teacher';
  const isClassTeacherMode = effectiveRole === 'class_teacher' && currentUser?.role !== 'class_teacher';
  const effectiveUser = React.useMemo(() => {
    if (!currentUser) return null;
    return switchedWorkspaceRole ? createRoleProxyUser(currentUser, switchedWorkspaceRole) : currentUser;
  }, [currentUser, switchedWorkspaceRole]);

  const handleSwitchWorkspaceRole = React.useCallback(
    (targetRole: UserRole | null) => {
      setViewingOperationsHub(false);
      if (!currentUser || !targetRole || targetRole === currentUser.role) {
        updateSwitchedWorkspaceRole(null);
        return;
      }
      const next = switchedWorkspaceRole === targetRole ? null : targetRole;
      updateSwitchedWorkspaceRole(next);
    },
    [currentUser, switchedWorkspaceRole, updateSwitchedWorkspaceRole]
  );

  const handleToggleSubjectTeacherMode = React.useCallback(() => {
    setViewingOperationsHub(false);
    updateSwitchedWorkspaceRole(switchedWorkspaceRole === 'teacher' ? null : 'teacher');
  }, [switchedWorkspaceRole, updateSwitchedWorkspaceRole]);

  const handleToggleClassTeacherMode = React.useCallback(() => {
    setViewingOperationsHub(false);
    updateSwitchedWorkspaceRole(switchedWorkspaceRole === 'class_teacher' ? null : 'class_teacher');
  }, [switchedWorkspaceRole, updateSwitchedWorkspaceRole]);

  const navigateToPortal = (view: PortalView, schoolId = currentTenant.id, replace = false) => {
    const path = fromAppPath(view === 'public_landing'
      ? '/'
      : view === 'unified_login'
        ? '/login'
        : view === 'super_admin'
          ? '/admin'
          : `/school/${createSchoolRouteId(schoolId)}`);

    if (window.location.pathname !== path) {
      const updateHistory = replace ? window.history.replaceState : window.history.pushState;
      updateHistory.call(window.history, { view }, '', path);
    }
    setPortalView(view);
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setPortalView(getPortalRoute(window.location.pathname).view);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    const { view, routeId } = getPortalRoute(window.location.pathname);
    if (view === 'school_lms') {
      const schoolId = resolveSchoolRoute(routeId);
      const school = schoolId
        ? allTenants.find((tenant) => tenant.id === schoolId)
        : undefined;

      const isSuperAdminAccess = isPlatformSuperAdmin(currentUser);

      // STRICT MULTI-TENANT ISOLATION: A logged-in user can never cross over to another school
      if (currentUser && !isSuperAdminAccess && currentUser.schoolId) {
        if (currentTenant.id !== currentUser.schoolId) {
          switchTenant(currentUser.schoolId);
        }
        return;
      }

      if (school && school.id !== currentTenant.id) {
        switchTenant(school.id);
      } else if (!school) {
        navigateToPortal(currentUser ? 'school_lms' : 'unified_login', currentTenant.id, true);
      }
    }
  }, [allTenants, currentTenant.id, currentUser, switchTenant]);

  React.useEffect(() => {
    const path = toAppPath(window.location.pathname);
    const isMainPage = path === '/';
    if (isMainPage) {
      if (window.location.pathname.endsWith('/index.html')) {
        window.history.replaceState({ view: 'public_landing' }, '', fromAppPath('/'));
      }
      if (portalView !== 'public_landing') navigateToPortal('public_landing', currentTenant.id, true);
      return;
    }
    if (currentUser && isPlatformSuperAdmin(currentUser)) {
      if (portalView !== 'super_admin' && portalView !== 'public_landing' && portalView !== 'school_lms') {
        navigateToPortal('super_admin');
      }
      return;
    }
    if (currentUser && portalView !== 'super_admin' && portalView !== 'school_lms') {
      navigateToPortal('school_lms', currentTenant.id, true);
    }
  }, [currentUser, currentTenant.id, portalView]);

  React.useEffect(() => {
    const isShowingLogin =
      !currentUser &&
      (portalView === 'unified_login' || portalView === 'super_admin' || portalView === 'school_lms');
    onLoginVisibilityChange(isShowingLogin);
  }, [currentUser, portalView, onLoginVisibilityChange]);

  React.useEffect(() => {
    const handleOpenOps = () => {
      updateSwitchedWorkspaceRole(null);
      setViewingOperationsHub(true);
    };
    const handleCloseOps = () => setViewingOperationsHub(false);
    const handleToggleSubjectTeacher = () => handleToggleSubjectTeacherMode();
    const handleToggleClassTeacher = () => handleToggleClassTeacherMode();
    window.addEventListener('open-operations-hub', handleOpenOps);
    window.addEventListener('close-operations-hub', handleCloseOps);
    window.addEventListener('toggle-subject-teacher-mode', handleToggleSubjectTeacher);
    window.addEventListener('toggle-class-teacher-mode', handleToggleClassTeacher);
    return () => {
      window.removeEventListener('open-operations-hub', handleOpenOps);
      window.removeEventListener('close-operations-hub', handleCloseOps);
      window.removeEventListener('toggle-subject-teacher-mode', handleToggleSubjectTeacher);
      window.removeEventListener('toggle-class-teacher-mode', handleToggleClassTeacher);
    };
  }, [handleToggleSubjectTeacherMode, handleToggleClassTeacherMode, updateSwitchedWorkspaceRole]);

  // Public landing stays available, including while the platform admin is signed in.
  if (portalView === 'public_landing' && (!currentUser || isPlatformSuperAdmin(currentUser))) {
    return (
      <PublicLandingPage
        onNavigateToLogin={() => navigateToPortal('unified_login')}
        onNavigateToPlatformAdmin={() => navigateToPortal('super_admin')}
      />
    );
  }

  // Admin Console always requires a signed-in Supabase administrator.
  if (!currentUser && portalView === 'super_admin') {
    return (
      <UnifiedLoginPage
        adminOnly
        onLoginSuccess={(user) => {
          setIsPlatformAdminSession(true);
          onLoginSuccess(user);
          navigateToPortal('super_admin', currentTenant.id, true);
        }}
        onBackToLanding={() => navigateToPortal('public_landing')}
      />
    );
  }

  const platformAdminSession = Boolean(currentUser && isPlatformSuperAdmin(currentUser));

  if (currentUser && portalView === 'super_admin' && !platformAdminSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Platform Super Administrator sign-in required</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tenant school accounts are strictly confined to their own institution ({currentTenant.name}). Cross-campus access is prohibited under multi-tenant data protection.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigateToPortal('school_lms', currentUser.schoolId || currentTenant.id)}
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Return to My School Portal
            </button>
            <button
              onClick={() => void onLogout()}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (currentUser && platformAdminSession && portalView !== 'school_lms') {
    return (
      <SuperAdminPortalView
        onEnterSchool={async (schoolId: string) => {
          setIsPlatformAdminSession(true);
          await switchTenant(schoolId);
          navigateToPortal('school_lms', schoolId);
        }}
        onSwitchRoleAndEnter={async (targetUser: User, schoolId: string) => {
          setIsPlatformAdminSession(true);
          await switchTenant(schoolId);
          await onSwitchUser({ ...targetUser, schoolId });
          navigateToPortal('school_lms', schoolId);
        }}
        onBackToLanding={() => {
          navigateToPortal('public_landing');
        }}
        onSignOut={() => {
          navigateToPortal('public_landing');
          void onLogout();
        }}
      />
    );
  }

  const effectivePlatformAdminSession = isPlatformAdminSession || platformAdminSession;

  // 2. Unified Login Page (Screen 2 in diagram): Select school, enter username/password
  if (!currentUser && (portalView === 'unified_login' || portalView === 'school_lms')) {
    return (
      <UnifiedLoginPage
        onLoginSuccess={(user) => {
          setIsPlatformAdminSession(false);
          onLoginSuccess(user);
          navigateToPortal('school_lms', user.schoolId || currentTenant.id, true);
        }}
        onBackToLanding={() => navigateToPortal('public_landing')}
      />
    );
  }

  return (
    <div 
      className="min-h-screen text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300"
      style={{
        backgroundColor: currentTenant.backgroundColor || '#f8fafc'
      }}
    >
      <Navbar
        currentUser={currentUser}
        onLogout={() => {
          setIsPlatformAdminSession(false);
          setSwitchedWorkspaceRole(null);
          onLogout();
          navigateToPortal('public_landing');
        }}
        onSwitchUser={onSwitchUser}
        isPlatformAdminSession={effectivePlatformAdminSession}
        canSwitchToSubjectTeacher={canSwitchSubjectTeacher}
        isSubjectTeacherMode={isSubjectTeacherMode}
        onToggleSubjectTeacherMode={handleToggleSubjectTeacherMode}
        canSwitchToClassTeacher={canSwitchClassTeacher}
        isClassTeacherMode={isClassTeacherMode}
        onToggleClassTeacherMode={handleToggleClassTeacherMode}
        switchedWorkspaceRole={switchedWorkspaceRole}
        switchableRoles={switchableRoles}
        onSwitchWorkspaceRole={handleSwitchWorkspaceRole}
        onReturnToSuperAdmin={() => {
          setIsPlatformAdminSession(true);
          if (!platformAdminSession) {
            onLogout();
          }
          navigateToPortal('super_admin');
        }}
        onNavigateHome={() => {
          if (currentUser) {
            onNavigateHome();
          } else {
            navigateToPortal('public_landing');
          }
        }}
      />

      {/* Main Viewport Container: Dynamic Side-by-Side Flex Layout */}
      <div className="flex-1 flex w-full relative min-h-0">
        
        {/* Dynamic Reading View Container:
            Reflows and smoothly resizes so NOTHING blocks the reading view on ANY page */}
        <div className="flex-1 min-w-0 transition-all duration-300 ease-in-out flex flex-col">
          
          {/* Subtle Reading Notice Banner when side-by-side mode is active */}
          {isNotificationOpen && currentUser && (
            <div className="bg-emerald-50/95 border-b border-emerald-200/90 px-4 py-2 text-xs text-emerald-950 flex items-center justify-between sticky top-16 z-20 backdrop-blur-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="font-bold text-emerald-950">Side-by-Side Reading Mode:</span>
                <span className="text-emerald-800 hidden sm:inline">Viewing space adjusted — nothing blocks your reading view</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={closeNotifications}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-md transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                  title="Maximize reading view to full page width"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Maximize Reading View (Full Width)</span>
                </button>
              </div>
            </div>
          )}

          {/* Global Broadcast Announcement Banner (Transmitted by Super Admin Full Control) */}
          {customization.globalSettings.broadcastNotice.active && (customization.globalSettings.broadcastNotice.targetAudience === 'all' || customization.globalSettings.broadcastNotice.targetAudience === 'portals_only') && (
            <div className={`py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b ${
              customization.globalSettings.broadcastNotice.type === 'alert'
                ? 'bg-red-600 text-white border-red-700'
                : customization.globalSettings.broadcastNotice.type === 'warning'
                ? 'bg-amber-400 text-slate-950 border-amber-500'
                : customization.globalSettings.broadcastNotice.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-blue-600 text-white border-blue-700'
            }`}>
              <Megaphone className="w-3.5 h-3.5 shrink-0" />
              <span>{customization.globalSettings.broadcastNotice.message}</span>
            </div>
          )}

          {/* School-specific Custom Notice (Configured by Super Admin) */}
          {customization.schoolOverrides[currentTenant.id]?.customNotice && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-900 font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-mono px-1.5 py-0.5 rounded font-black uppercase">
                  {currentTenant.shortName || currentTenant.name} Campus Notice
                </span>
                <span>{customization.schoolOverrides[currentTenant.id]?.customNotice}</span>
              </div>
            </div>
          )}

          <main id="main-content" className={`w-full flex-1 ${isMobileOverlapProtectionEnabled ? 'pb-24 lg:pb-8' : 'pb-16 lg:pb-0'}`}>
            {!currentUser || !effectiveUser ? (
              <LandingPage 
                onLoginSuccess={onLoginSuccess} 
                onReturnToSuperAdmin={effectivePlatformAdminSession ? () => navigateToPortal('super_admin') : undefined}
              />
            ) : !isWorkspaceEnabled(effectiveRole === 'admin' ? 'admin' : effectiveRole, currentTenant.id) ? (
              /* Informative notice if Super Admin deactivated this workspace for this tenant */
              <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-xl font-black font-serif text-slate-900">Workspace Temporarily Deactivated</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  This workspace module has been selectively deactivated for <strong className="text-slate-900">{currentTenant.name}</strong> by the Super Administrator via the Platform Studio Customizer.
                </p>
                {effectivePlatformAdminSession && (
                  <button
                    onClick={() => navigateToPortal('super_admin')}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Open Platform Customizer to Re-Enable
                  </button>
                )}
              </div>
            ) : findSystemRole(effectiveRole)?.builtIn === false ? (
              <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-3">
                <h3 className="text-xl font-black font-serif text-slate-900">
                  {findSystemRole(effectiveRole)?.name || 'School account'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {currentUser.name} is signed in at {currentTenant.name}. This role was added by the platform administrator and is ready for assignment.
                </p>
              </div>
            ) : (
              <>
                {switchedWorkspaceRole && (
                  <div className="bg-slate-900 text-white border-b border-slate-700/80 px-3 sm:px-6 py-2">
                    <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold uppercase tracking-wider text-[10px] shrink-0">
                          {getAdministrativeRoleDisplayName(effectiveRole)}
                        </span>
                        <span className="text-slate-200 truncate hidden sm:inline">
                          Full {getAdministrativeRoleDisplayName(effectiveRole)} workspace active · Primary:{' '}
                          <strong className="text-white">{getAdministrativeRoleDisplayName(currentUser.role)}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateSwitchedWorkspaceRole(null)}
                        className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-lg bg-white text-slate-900 hover:bg-amber-100 font-bold text-xs transition-colors shadow-xs cursor-pointer shrink-0"
                      >
                        <span>&larr; Return to {getAdministrativeRoleDisplayName(currentUser.role)}</span>
                      </button>
                    </div>
                  </div>
                )}

                {effectiveRole === 'student' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['student']}
                    workspaceName="Learner Academic Portal"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <StudentWorkspace currentUser={effectiveUser} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'parent' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['parent']}
                    workspaceName="Parent & Guardian Portal"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <ParentWorkspace currentUser={effectiveUser} onLogout={onLogout} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'class_teacher' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['class_teacher', 'hod']}
                    workspaceName="Class Teacher Command Desk"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <ClassTeacherWorkspace
                      currentUser={effectiveUser}
                      switchedFromRole={isClassTeacherMode ? currentUser.role : undefined}
                      onReturnToPrimaryWorkspace={isClassTeacherMode ? () => updateSwitchedWorkspaceRole(null) : undefined}
                    />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'teacher' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={[...SUBJECT_TEACHER_ELIGIBLE_ROLES, 'teacher']}
                    workspaceName="Subject Teacher Portal"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <TeacherWorkspace
                      currentUser={effectiveUser}
                      switchedFromRole={isSubjectTeacherMode ? currentUser.role : undefined}
                      onReturnToAdminWorkspace={isSubjectTeacherMode ? () => updateSwitchedWorkspaceRole(null) : undefined}
                    />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'hod' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['hod']}
                    workspaceName="Head of Department (HOD) Portal"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <HODWorkspace
                      currentUser={effectiveUser}
                      onSwitchToClassTeacher={canSwitchClassTeacher ? () => handleSwitchWorkspaceRole('class_teacher') : undefined}
                      onSwitchToSubjectTeacher={canSwitchSubjectTeacher ? () => handleSwitchWorkspaceRole('teacher') : undefined}
                    />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'senior_teacher' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['senior_teacher']}
                    workspaceName="Senior Teacher Supervision Desk"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <SeniorTeacherWorkspace currentUser={effectiveUser} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'deputy_head' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['deputy_head']}
                    workspaceName="Deputy Head Operations Hub"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <DeputyHeadWorkspace currentUser={effectiveUser} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'dean_of_studies' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['dean_of_studies']}
                    workspaceName="Dean of Studies Academic Hub"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <DeanOfStudiesWorkspace currentUser={effectiveUser} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'curriculum_coordinator' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['curriculum_coordinator']}
                    workspaceName="Curriculum Coordinator Executive Suite"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <CurriculumCoordinatorWorkspace currentUser={effectiveUser} onLogout={onLogout} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'librarian' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['librarian']}
                    workspaceName="School Library Information System"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <LibrarianWorkspace currentUser={effectiveUser} onLogout={onLogout} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'head_teacher' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['head_teacher']}
                    workspaceName="Head Teacher & Principal Executive Office"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <HeadTeacherWorkspace currentUser={effectiveUser} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'nurse' || effectiveUser.email === 'nurse@edusmart.ac.ke' || (effectiveRole === 'school_admin_staff' && effectiveUser.designation?.toLowerCase().includes('nurse')) ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['nurse', 'school_admin_staff']}
                    workspaceName="School Sanatorium & Clinic Bay"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <SanatoriumWorkspace currentUser={effectiveUser} onLogout={onLogout} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'school_admin_staff' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['school_admin_staff']}
                    workspaceName="Academic Registrar & School Secretariat"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <SchoolAdminStaffWorkspace currentUser={effectiveUser} onLogout={onLogout} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'transport_team' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['transport_team']}
                    workspaceName="Campus Fleet & Student Transport Desk"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <TransportWorkspace currentUser={effectiveUser} onLogout={onLogout} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'cocurricular_team' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['cocurricular_team']}
                    workspaceName="Co-Curricular & Sports Academy Command"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <CoCurricularWorkspace currentUser={effectiveUser} onLogout={onLogout} />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'finance_officer' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['finance_officer', 'admin', 'head_teacher', 'deputy_head']}
                    workspaceName="Finance & Bursary Workspace"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <IntegratedOperationsHub currentUser={effectiveUser} initialPortal="finance" />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'procurement_officer' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['procurement_officer', 'admin', 'head_teacher', 'deputy_head']}
                    workspaceName="Procurement & Purchasing Workspace"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <IntegratedOperationsHub currentUser={effectiveUser} initialPortal="procurement" />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'storekeeper' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['storekeeper', 'admin', 'head_teacher', 'deputy_head']}
                    workspaceName="Central Stores & Inventory Hub"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <IntegratedOperationsHub currentUser={effectiveUser} initialPortal="stores" />
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'hr_manager' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['hr_manager', 'admin', 'head_teacher']}
                    workspaceName="HR & Kenyan CBC Payroll Engine"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <IntegratedOperationsHub currentUser={effectiveUser} initialPortal="hr_payroll" />
                  </WorkspaceRoleGuard>
                ) : viewingOperationsHub ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['admin', 'head_teacher', 'deputy_head']}
                    workspaceName="Integrated Operations Management Hub"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <div className="space-y-4">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex items-center justify-between">
                        <button
                          onClick={() => setViewingOperationsHub(false)}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <span>&larr; Return to System Administrator Console</span>
                        </button>
                        <span className="text-xs font-medium text-slate-500">
                          Integrated Operations &bull; {currentTenant.name}
                        </span>
                      </div>
                      <IntegratedOperationsHub currentUser={effectiveUser} initialPortal="finance" />
                    </div>
                  </WorkspaceRoleGuard>
                ) : effectiveRole === 'admin' ? (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={['admin']}
                    workspaceName="School Administrator Management Console"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <AdminDashboard currentUser={effectiveUser} />
                  </WorkspaceRoleGuard>
                ) : (
                  <WorkspaceRoleGuard
                    currentUser={effectiveUser}
                    allowedRoles={[]}
                    workspaceName="Protected Campus Workspace"
                    onLogout={onLogout}
                    onSwitchUser={onSwitchUser}
                  >
                    <div />
                  </WorkspaceRoleGuard>
                )}
              </>
            )}
          </main>
        </div>

        {/* Docked Notification Panel: Sits alongside reading view without overlay or obstruction */}
        {currentUser && (
          <NotificationDrawer currentUser={currentUser} />
        )}
      </div>

      {/* Role-Specific Quick Actions Floating Menu in Main Viewport */}
      {currentUser && (
        <QuickActionsFloatingMenu 
          currentUser={currentUser} 
          onSwitchUser={onSwitchUser}
          canSwitchToSubjectTeacher={canSwitchSubjectTeacher}
          isSubjectTeacherMode={isSubjectTeacherMode}
          onToggleSubjectTeacherMode={handleToggleSubjectTeacherMode}
          canSwitchToClassTeacher={canSwitchClassTeacher}
          isClassTeacherMode={isClassTeacherMode}
          onToggleClassTeacherMode={handleToggleClassTeacherMode}
          switchedWorkspaceRole={switchedWorkspaceRole}
          switchableRoles={switchableRoles}
          onSwitchWorkspaceRole={handleSwitchWorkspaceRole}
        />
      )}

      {/* Platform Owner Floating Quick Return to Super Admin Hub & Customizer */}
      {effectivePlatformAdminSession && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={() => navigateToPortal('super_admin')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-xl flex items-center gap-2 border-2 border-amber-300 transition-all transform hover:scale-105 cursor-pointer group"
            title="Return to Super Admin Hub & Customizer Studio"
          >
            <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
            <span>Return to Super Admin Hub</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function App({ initialUser = null }: { initialUser?: User | null }) {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [isLoginVisible, setIsLoginVisible] = useState<boolean>(false);

  React.useEffect(() => {
    const handlePlatformAdminSession = (event: Event) => {
      const user = (event as CustomEvent<User>).detail;
      if (!user) return;
      Storage.setCurrentUser(user);
      setCurrentUser(user);
    };
    window.addEventListener('platform-admin-session', handlePlatformAdminSession);
    return () => window.removeEventListener('platform-admin-session', handlePlatformAdminSession);
  }, []);

  React.useEffect(() => {
    const syncSession = () => {
      const nextUser = ClientDataStore.getSessionUser();
      if (nextUser && nextUser.id !== currentUser?.id) {
        setCurrentUser(nextUser);
      }
    };
    window.addEventListener('edusmart:data-changed', syncSession);
    return () => window.removeEventListener('edusmart:data-changed', syncSession);
  }, [currentUser?.id]);

  const handleLoginSuccess = (user: User) => {
    Storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: ClientDataStore.getAuthHeaders(),
      });
    } catch {
      // Ignore network errors during logout
    }
    ClientDataStore.clearSessionOnly();
    Storage.setCurrentUser(null);
    setCurrentUser(null);
    await ClientDataStore.hydrateFromBackend(true);
  };

  const handleSwitchUser = async (user: User) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        credentials: 'include',
        headers: ClientDataStore.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const switchBody = await res.json().catch(() => ({}));
        if (switchBody?.sessionToken) {
          ClientDataStore.setSessionToken(String(switchBody.sessionToken));
        }
        await ClientDataStore.hydrateFromBackend(true);
        const switched = ClientDataStore.getSessionUser() || switchBody?.user || user;
        ClientDataStore.setSessionUser(switched);
        Storage.setCurrentUser(switched);
        setCurrentUser(switched);
        return;
      }
    } catch {
      // fallback
    }
    Storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleNavigateHome = () => {
    void handleLogout();
  };

  return (
    <ErrorBoundary>
      <TenantProvider>
        <PlatformCustomizationProvider>
          <AccessibilityProvider>
            <MobileLayoutProvider>
              <NotificationLayoutProvider currentUser={currentUser}>
                <PWAUpdateAndOfflineBanner />
                <AppContent
                  currentUser={currentUser}
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  onSwitchUser={handleSwitchUser}
                  onNavigateHome={handleNavigateHome}
                  onLoginVisibilityChange={setIsLoginVisible}
                />
                <PWAInstallInvitation suppressAutoShow={isLoginVisible} />
                <InactivityTimeoutModal isActive={Boolean(currentUser)} onLogout={handleLogout} />
              </NotificationLayoutProvider>
            </MobileLayoutProvider>
          </AccessibilityProvider>
        </PlatformCustomizationProvider>
      </TenantProvider>
    </ErrorBoundary>
  );
}
