/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from './types';
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
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { SyncEngine } from './utils/syncEngine';

type PortalView = 'public_landing' | 'unified_login' | 'super_admin' | 'school_lms';
const SCHOOL_ROUTE_STORAGE_PREFIX = 'edusmart:school-route:';

function getPortalRoute(pathname: string): { view: PortalView; routeId?: string } {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

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
  return routeId ? sessionStorage.getItem(`${SCHOOL_ROUTE_STORAGE_PREFIX}${routeId}`) || undefined : undefined;
}

function createSchoolRouteId(schoolId: string): string {
  const routeId = crypto.randomUUID().replace(/-/g, '');
  sessionStorage.setItem(`${SCHOOL_ROUTE_STORAGE_PREFIX}${routeId}`, schoolId);
  return routeId;
}

function AppContent({
  currentUser,
  onLoginSuccess,
  onLogout,
  onSwitchUser,
  onNavigateHome
}: {
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  onNavigateHome: () => void;
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

  const navigateToPortal = (view: PortalView, schoolId = currentTenant.id, replace = false) => {
    const path = view === 'public_landing'
      ? '/'
      : view === 'unified_login'
        ? '/login'
        : view === 'super_admin'
          ? '/admin'
          : `/school/${createSchoolRouteId(schoolId)}`;

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
      if (school && school.id !== currentTenant.id) {
        switchTenant(school.id);
      } else if (!school) {
        navigateToPortal(currentUser ? 'school_lms' : 'unified_login', currentTenant.id, true);
      }
    }
  }, [allTenants, currentTenant.id, currentUser, switchTenant]);

  React.useEffect(() => {
    if (currentUser && portalView !== 'super_admin' && portalView !== 'school_lms') {
      navigateToPortal('school_lms', currentTenant.id, true);
    }
  }, [currentUser, currentTenant.id, portalView]);

  React.useEffect(() => {
    const handleOpenOps = () => setViewingOperationsHub(true);
    const handleCloseOps = () => setViewingOperationsHub(false);
    window.addEventListener('open-operations-hub', handleOpenOps);
    window.addEventListener('close-operations-hub', handleCloseOps);
    return () => {
      window.removeEventListener('open-operations-hub', handleOpenOps);
      window.removeEventListener('close-operations-hub', handleCloseOps);
    };
  }, []);

  // 1. Public Landing Page (Screen 1 in diagram): Always accessible, no Super Admin button
  if (!currentUser && portalView === 'public_landing') {
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

  if (currentUser && portalView === 'super_admin' && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-xl">
          <h1 className="text-xl font-bold text-slate-900">Administrator sign-in required</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This account cannot access the Admin Console. Sign out and use an administrator email and password.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => void onLogout()}
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Sign out and continue
            </button>
            <button
              onClick={() => navigateToPortal('public_landing')}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to website
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (currentUser && portalView === 'super_admin' && currentUser.role === 'admin') {
    return (
      <SuperAdminPortalView
        onEnterSchool={(schoolId) => {
          setIsPlatformAdminSession(true);
          navigateToPortal('school_lms', schoolId);
        }}
        onBackToLanding={async () => {
          await onLogout();
          setIsPlatformAdminSession(false);
          navigateToPortal('public_landing');
        }}
      />
    );
  }

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
          onLogout();
          navigateToPortal('public_landing');
        }}
        onSwitchUser={onSwitchUser}
        isPlatformAdminSession={isPlatformAdminSession || (currentUser?.role === 'admin' && isPlatformAdminSession)}
        onReturnToSuperAdmin={() => {
          setIsPlatformAdminSession(true);
          onLogout();
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

          <main id="main-content" className={`w-full flex-1 ${isMobileOverlapProtectionEnabled ? 'pb-24 sm:pb-8' : ''}`}>
            {!currentUser ? (
              <LandingPage 
                onLoginSuccess={onLoginSuccess} 
                onReturnToSuperAdmin={isPlatformAdminSession ? () => navigateToPortal('super_admin') : undefined}
              />
            ) : !isWorkspaceEnabled(currentUser.role === 'admin' ? 'admin' : currentUser.role, currentTenant.id) ? (
              /* Informative notice if Super Admin deactivated this workspace for this tenant */
              <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-xl font-black font-serif text-slate-900">Workspace Temporarily Deactivated</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  This workspace module has been selectively deactivated for <strong className="text-slate-900">{currentTenant.name}</strong> by the Super Administrator via the Platform Studio Customizer.
                </p>
                {isPlatformAdminSession && (
                  <button
                    onClick={() => navigateToPortal('super_admin')}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Open Platform Customizer to Re-Enable
                  </button>
                )}
              </div>
            ) : currentUser.role === 'student' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['student']}
                workspaceName="Learner Academic Portal"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <StudentWorkspace currentUser={currentUser} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'parent' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['parent']}
                workspaceName="Parent & Guardian Portal"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <ParentWorkspace currentUser={currentUser} onLogout={onLogout} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'class_teacher' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['class_teacher']}
                workspaceName="Class Teacher Command Desk"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <ClassTeacherWorkspace currentUser={currentUser} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'teacher' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['teacher']}
                workspaceName="Subject Teacher Portal"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <TeacherWorkspace currentUser={currentUser} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'hod' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['hod']}
                workspaceName="Head of Department (HOD) Portal"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <HODWorkspace currentUser={currentUser} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'senior_teacher' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['senior_teacher']}
                workspaceName="Senior Teacher Supervision Desk"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <SeniorTeacherWorkspace currentUser={currentUser} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'deputy_head' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['deputy_head']}
                workspaceName="Deputy Head Operations Hub"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <DeputyHeadWorkspace currentUser={currentUser} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'dean_of_studies' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['dean_of_studies']}
                workspaceName="Dean of Studies Academic Hub"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <DeanOfStudiesWorkspace currentUser={currentUser} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'curriculum_coordinator' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['curriculum_coordinator']}
                workspaceName="Curriculum Coordinator Executive Suite"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <CurriculumCoordinatorWorkspace currentUser={currentUser} onLogout={onLogout} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'librarian' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['librarian']}
                workspaceName="School Library Information System"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <LibrarianWorkspace currentUser={currentUser} onLogout={onLogout} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'head_teacher' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['head_teacher']}
                workspaceName="Head Teacher & Principal Executive Office"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <HeadTeacherWorkspace currentUser={currentUser} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'nurse' || currentUser.email === 'nurse@edusmart.ac.ke' || (currentUser.role === 'school_admin_staff' && currentUser.designation?.toLowerCase().includes('nurse')) ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['nurse', 'school_admin_staff']}
                workspaceName="School Sanatorium & Clinic Bay"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <SanatoriumWorkspace currentUser={currentUser} onLogout={onLogout} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'school_admin_staff' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['school_admin_staff']}
                workspaceName="Academic Registrar & School Secretariat"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <SchoolAdminStaffWorkspace currentUser={currentUser} onLogout={onLogout} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'transport_team' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['transport_team']}
                workspaceName="Campus Fleet & Student Transport Desk"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <TransportWorkspace currentUser={currentUser} onLogout={onLogout} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'cocurricular_team' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['cocurricular_team']}
                workspaceName="Co-Curricular & Sports Academy Command"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <CoCurricularWorkspace currentUser={currentUser} onLogout={onLogout} />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'finance_officer' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['finance_officer', 'admin', 'head_teacher', 'deputy_head']}
                workspaceName="Finance & Bursary Workspace"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <IntegratedOperationsHub currentUser={currentUser} initialPortal="finance" />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'procurement_officer' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['procurement_officer', 'admin', 'head_teacher', 'deputy_head']}
                workspaceName="Procurement & Purchasing Workspace"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <IntegratedOperationsHub currentUser={currentUser} initialPortal="procurement" />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'storekeeper' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['storekeeper', 'admin', 'head_teacher', 'deputy_head']}
                workspaceName="Central Stores & Inventory Hub"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <IntegratedOperationsHub currentUser={currentUser} initialPortal="stores" />
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'hr_manager' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['hr_manager', 'admin', 'head_teacher']}
                workspaceName="HR & Kenyan CBC Payroll Engine"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <IntegratedOperationsHub currentUser={currentUser} initialPortal="hr_payroll" />
              </WorkspaceRoleGuard>
            ) : viewingOperationsHub ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
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
                  <IntegratedOperationsHub currentUser={currentUser} initialPortal="finance" />
                </div>
              </WorkspaceRoleGuard>
            ) : currentUser.role === 'admin' ? (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={['admin']}
                workspaceName="School Administrator Management Console"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <AdminDashboard currentUser={currentUser} />
              </WorkspaceRoleGuard>
            ) : (
              <WorkspaceRoleGuard
                currentUser={currentUser}
                allowedRoles={[]}
                workspaceName="Protected Campus Workspace"
                onLogout={onLogout}
                onSwitchUser={onSwitchUser}
              >
                <div />
              </WorkspaceRoleGuard>
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
        />
      )}

      {/* Platform Owner Floating Quick Return to Super Admin Hub & Customizer */}
      {isPlatformAdminSession && (
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

  React.useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        SyncEngine.activateIdentity(null);
        Storage.setCurrentUser(null);
        setCurrentUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (user: User) => {
    Storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[auth] Sign-out failed', error);
        return;
      }
      SyncEngine.activateIdentity(null);
    }
    Storage.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleSwitchUser = (user: User) => {
    if (isSupabaseConfigured) {
      SyncEngine.activateIdentity(user.id, user.schoolId);
    }
    Storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleNavigateHome = () => {
    handleLogout();
  };

  return (
    <ErrorBoundary>
      <TenantProvider>
        <PlatformCustomizationProvider>
          <AccessibilityProvider>
            <MobileLayoutProvider>
              <NotificationLayoutProvider currentUser={currentUser}>
                <AppContent
                  currentUser={currentUser}
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  onSwitchUser={handleSwitchUser}
                  onNavigateHome={handleNavigateHome}
                />
              </NotificationLayoutProvider>
            </MobileLayoutProvider>
          </AccessibilityProvider>
        </PlatformCustomizationProvider>
      </TenantProvider>
    </ErrorBoundary>
  );
}
