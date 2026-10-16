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
import { Maximize2, CheckCheck, Megaphone, Sparkles } from 'lucide-react';

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
  const { currentTenant } = useTenant();
  const { isNotificationOpen, closeNotifications } = useNotificationLayout();
  const { isMobileOverlapProtectionEnabled } = useMobileLayout();
  const { customization, isWorkspaceEnabled } = usePlatformCustomization();
  
  // Navigation Flow State as per User Architectural Guide Diagram:
  // 1. 'public_landing': Screen 1 Public EduSmart Landing Page (No Super Admin button)
  // 2. 'unified_login': Screen 2 Unified Login Page (Select school, credentials)
  // 3. 'super_admin': Screen 4 Super Admin Console (Platform management, Campus Switcher)
  // 4. 'school_lms': Screen 3 Tenant School Workspace (e.g. Riara School, Return to Super Admin visible ONLY to platform owners)
  const [portalView, setPortalView] = useState<'public_landing' | 'unified_login' | 'super_admin' | 'school_lms'>('public_landing');
  const [isPlatformAdminSession, setIsPlatformAdminSession] = useState<boolean>(false);
  const [viewingOperationsHub, setViewingOperationsHub] = useState<boolean>(false);

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
        onNavigateToLogin={() => setPortalView('unified_login')}
        onNavigateToPlatformAdmin={() => setPortalView('super_admin')}
      />
    );
  }

  // 2. Unified Login Page (Screen 2 in diagram): Select school, enter username/password
  if (!currentUser && portalView === 'unified_login') {
    return (
      <UnifiedLoginPage
        onLoginSuccess={(user) => {
          setIsPlatformAdminSession(false);
          onLoginSuccess(user);
        }}
        onBackToLanding={() => setPortalView('public_landing')}
      />
    );
  }

  // 3. Super Admin Console (Screen 4 in diagram): Private platform management, Campus Switcher exclusive
  if (!currentUser && portalView === 'super_admin') {
    return (
      <SuperAdminPortalView
        onEnterSchool={(schoolId) => {
          setIsPlatformAdminSession(true);
          setPortalView('school_lms');
        }}
        onBackToLanding={() => setPortalView('public_landing')}
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
          setPortalView('public_landing');
        }}
        onSwitchUser={onSwitchUser}
        isPlatformAdminSession={isPlatformAdminSession || (currentUser?.role === 'admin' && isPlatformAdminSession)}
        onReturnToSuperAdmin={() => {
          setIsPlatformAdminSession(true);
          onLogout();
          setPortalView('super_admin');
        }}
        onNavigateHome={() => {
          if (currentUser) {
            onNavigateHome();
          } else {
            setPortalView('public_landing');
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
                onReturnToSuperAdmin={isPlatformAdminSession ? () => setPortalView('super_admin') : undefined}
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
                    onClick={() => setPortalView('super_admin')}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Open Platform Customizer to Re-Enable
                  </button>
                )}
              </div>
            ) : currentUser.role === 'student' ? (
              /* Learner: Own academic and school information */
              <StudentWorkspace currentUser={currentUser} />
            ) : currentUser.role === 'parent' ? (
              /* Parent: Their children's information */
              <ParentWorkspace currentUser={currentUser} onLogout={onLogout} />
            ) : currentUser.role === 'class_teacher' ? (
              /* Class Teacher: Dedicated Class Teacher Command Centre & Form Lead Desk */
              <ClassTeacherWorkspace currentUser={currentUser} />
            ) : currentUser.role === 'teacher' ? (
              /* Teacher: Assigned classes and subjects */
              <TeacherWorkspace currentUser={currentUser} />
            ) : currentUser.role === 'hod' ? (
              /* HOD: Department */
              <HODWorkspace currentUser={currentUser} />
            ) : currentUser.role === 'senior_teacher' ? (
              /* Senior Teacher: Academic/learner supervision */
              <SeniorTeacherWorkspace currentUser={currentUser} />
            ) : currentUser.role === 'deputy_head' ? (
              /* Deputy Head: Operations/discipline/staff */
              <DeputyHeadWorkspace currentUser={currentUser} />
            ) : currentUser.role === 'dean_of_studies' ? (
              /* Dean of Studies: Academic/assessment */
              <DeanOfStudiesWorkspace currentUser={currentUser} />
            ) : currentUser.role === 'curriculum_coordinator' ? (
              /* Curriculum Coordinator: Executive leadership - CBC curriculum, CBA & syllabi */
              <CurriculumCoordinatorWorkspace currentUser={currentUser} onLogout={onLogout} />
            ) : currentUser.role === 'librarian' ? (
              /* Librarian: Library */
              <LibrarianWorkspace currentUser={currentUser} onLogout={onLogout} />
            ) : currentUser.role === 'head_teacher' ? (
              /* Head Teacher: School-wide management */
              <HeadTeacherWorkspace currentUser={currentUser} />
            ) : currentUser.role === 'nurse' || currentUser.email === 'nurse@edusmart.ac.ke' || (currentUser.role === 'school_admin_staff' && currentUser.designation?.toLowerCase().includes('nurse')) ? (
              /* School Sanatorium Nurse In-Charge: Strictly only access to school sanatorium portal */
              <SanatoriumWorkspace currentUser={currentUser} onLogout={onLogout} />
            ) : currentUser.role === 'school_admin_staff' ? (
              /* School Admin Staff: Secretarial, registers, gate exits, work analysis, calendar */
              <SchoolAdminStaffWorkspace currentUser={currentUser} onLogout={onLogout} />
            ) : currentUser.role === 'transport_team' ? (
              /* Transport Team: Fleet, routes, drivers, chaperones, student tracking */
              <TransportWorkspace currentUser={currentUser} onLogout={onLogout} />
            ) : currentUser.role === 'cocurricular_team' ? (
              /* Co-Curricular Team: Sports, clubs, coaches, patrons, talent development */
              <CoCurricularWorkspace currentUser={currentUser} onLogout={onLogout} />
            ) : currentUser.role === 'finance_officer' ? (
              /* Finance & Bursary Officer: Billing, fees, ledgers, budgets & bank reconciliation */
              <IntegratedOperationsHub currentUser={currentUser} initialPortal="finance" />
            ) : currentUser.role === 'procurement_officer' ? (
              /* Procurement Lead: Requisitions, vendor management, RFQs & LPOs */
              <IntegratedOperationsHub currentUser={currentUser} initialPortal="procurement" />
            ) : currentUser.role === 'storekeeper' ? (
              /* Central Stores: Inventory catalog, GRNs, stock issues & stocktakes */
              <IntegratedOperationsHub currentUser={currentUser} initialPortal="stores" />
            ) : currentUser.role === 'hr_manager' ? (
              /* HR & Payroll: Employee dossiers, contracts, statutory PAYE/NSSF/NHIF & monthly payroll runs */
              <IntegratedOperationsHub currentUser={currentUser} initialPortal="hr_payroll" />
            ) : viewingOperationsHub ? (
              /* Full-page Operations & Architecture Hub view accessible to school administrators */
              <div className="space-y-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex items-center justify-between">
                  <button
                    onClick={() => setViewingOperationsHub(false)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <span>&larr; Return to {currentUser.role === 'admin' ? 'System Administrator Console' : 'Workspace'}</span>
                  </button>
                  <span className="text-xs font-medium text-slate-500">
                    Integrated Operations & Architecture Viewer &bull; {currentTenant.name}
                  </span>
                </div>
                <IntegratedOperationsHub currentUser={currentUser} initialPortal="architecture" />
              </div>
            ) : (
              /* School Administrator (e.g. Mr. Patrick Kamau): Manages their school campus */
              <AdminDashboard currentUser={currentUser} />
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
            onClick={() => setPortalView('super_admin')}
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return Storage.getCurrentUser();
  });

  const handleLoginSuccess = (user: User) => {
    Storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    Storage.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleSwitchUser = (user: User) => {
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
