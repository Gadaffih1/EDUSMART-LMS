/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from './types';
import { Storage } from './utils/storage';
import { NotificationLayoutProvider, useNotificationLayout } from './context/NotificationLayoutContext';
import { TenantProvider } from './context/TenantContext';
import { MobileLayoutProvider, useMobileLayout } from './context/MobileLayoutContext';
import { Navbar } from './components/layout/Navbar';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { LandingPage } from './components/landing/LandingPage';
import { StudentWorkspace } from './components/student/StudentWorkspace';
import { ParentWorkspace } from './components/parent/ParentWorkspace';
import { TeacherWorkspace } from './components/teacher/TeacherWorkspace';
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
import { QuickActionsFloatingMenu } from './components/layout/QuickActionsFloatingMenu';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Maximize2, CheckCheck } from 'lucide-react';

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
  const { isNotificationOpen, closeNotifications } = useNotificationLayout();
  const { isMobileOverlapProtectionEnabled } = useMobileLayout();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar
        currentUser={currentUser}
        onLogout={onLogout}
        onSwitchUser={onSwitchUser}
        onNavigateHome={onNavigateHome}
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

          <main className={`w-full flex-1 ${isMobileOverlapProtectionEnabled ? 'pb-24 sm:pb-8' : ''}`}>
            {!currentUser ? (
              <LandingPage onLoginSuccess={onLoginSuccess} />
            ) : currentUser.role === 'student' ? (
              /* Learner: Own academic and school information */
              <StudentWorkspace currentUser={currentUser} />
            ) : currentUser.role === 'parent' ? (
              /* Parent: Their children's information */
              <ParentWorkspace currentUser={currentUser} onLogout={onLogout} />
            ) : ['teacher', 'class_teacher'].includes(currentUser.role) ? (
              /* Teacher: Assigned classes and subjects / Class Teacher: Assigned class + learners */
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
            ) : (
              /* System Administrator: Full system administration */
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
      </TenantProvider>
    </ErrorBoundary>
  );
}
