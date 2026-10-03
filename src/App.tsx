/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Storage } from './utils/storage';
import { Navbar } from './components/layout/Navbar';
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
import { SchoolAdminStaffWorkspace } from './components/admin/SchoolAdminStaffWorkspace';
import { AdminDashboard } from './components/admin/AdminDashboard';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        onNavigateHome={handleNavigateHome}
      />

      <main className="flex-1">
        {!currentUser ? (
          <LandingPage onLoginSuccess={handleLoginSuccess} />
        ) : currentUser.role === 'student' ? (
          /* Learner: Own academic and school information */
          <StudentWorkspace currentUser={currentUser} />
        ) : currentUser.role === 'parent' ? (
          /* Parent: Their children's information */
          <ParentWorkspace currentUser={currentUser} onLogout={handleLogout} />
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
        ) : currentUser.role === 'librarian' ? (
          /* Librarian: Library */
          <LibrarianWorkspace currentUser={currentUser} />
        ) : currentUser.role === 'head_teacher' ? (
          /* Head Teacher: School-wide management */
          <HeadTeacherWorkspace currentUser={currentUser} />
        ) : currentUser.role === 'school_admin_staff' ? (
          /* School Admin Staff: Secretarial, registers, gate exits, work analysis, calendar */
          <SchoolAdminStaffWorkspace currentUser={currentUser} onLogout={handleLogout} />
        ) : (
          /* System Administrator: Full system administration */
          <AdminDashboard currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}
