import React from 'react';
import { User, UserRole } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { 
  ShieldAlert, 
  Lock, 
  Building2, 
  ArrowRight, 
  LogOut, 
  UserCheck, 
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  School
} from 'lucide-react';

interface WorkspaceRoleGuardProps {
  currentUser: User | null;
  allowedRoles: UserRole[];
  workspaceName: string;
  departmentName?: string;
  children: React.ReactNode;
  onLogout?: () => void;
  onSwitchUser?: (user: User) => void;
  onSwitchToHomeSchool?: (schoolId: string) => void;
}

export const WorkspaceRoleGuard: React.FC<WorkspaceRoleGuardProps> = ({
  currentUser,
  allowedRoles,
  workspaceName,
  departmentName,
  children,
  onLogout,
  onSwitchUser,
  onSwitchToHomeSchool
}) => {
  const { currentTenant, allTenants, switchTenant } = useTenant();

  // Helper to format role names nicely
  const formatRoleLabel = (role: string): string => {
    switch (role) {
      case 'student': return 'Learner / Student';
      case 'parent': return 'Parent / Guardian';
      case 'teacher': return 'Subject Teacher';
      case 'class_teacher': return 'Class Teacher';
      case 'hod': return 'Head of Department (HOD)';
      case 'senior_teacher': return 'Senior Teacher';
      case 'deputy_head': return 'Deputy Head Teacher';
      case 'dean_of_studies': return 'Dean of Studies';
      case 'curriculum_coordinator': return 'Curriculum Coordinator';
      case 'librarian': return 'School Librarian';
      case 'head_teacher': return 'Head Teacher / Principal';
      case 'nurse': return 'School Sanatorium Nurse';
      case 'school_admin_staff': return 'Academic Registrar / Admin Staff';
      case 'transport_team': return 'School Transport Team';
      case 'cocurricular_team': return 'Co-Curricular Lead';
      case 'finance_officer': return 'Finance & Bursary Officer';
      case 'procurement_officer': return 'Procurement Lead';
      case 'storekeeper': return 'Central Storekeeper';
      case 'hr_manager': return 'Human Resources & Payroll Manager';
      case 'admin': return 'School Administrator';
      default: return role.replace(/_/g, ' ');
    }
  };

  // 1. Check: Is user logged in?
  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-black font-serif text-slate-900">
            Authentication Required
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Please log in with an authorized account for <strong className="text-slate-900">{currentTenant.name}</strong> to access the {workspaceName}.
          </p>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Go to School Login Gateway
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Check: Tenant School Isolation Check
  // User must belong to the current active tenant (or be in platform super admin mode)
  const isSuperAdminUser = currentUser.role === 'admin' && (currentUser.email === 'superadmin@edusmart.ac.ke' || currentUser.email === 'admin@edusmart.ac.ke');
  const userSchoolId = currentUser.schoolId || 'tenant-riara';
  const isSchoolMismatch = !isSuperAdminUser && userSchoolId && userSchoolId !== currentTenant.id;

  if (isSchoolMismatch) {
    const userHomeSchool = allTenants.find(t => t.id === userSchoolId) || {
      id: userSchoolId,
      name: 'Registered Home School'
    };

    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl border-2 border-rose-300 shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-inner border border-rose-200">
            <ShieldAlert className="w-9 h-9 text-rose-600 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-black uppercase tracking-wider">
              <span>Strict Multi-Tenant Isolation Active</span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900">
              Cross-Campus Data Access Blocked
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Your account (<strong className="text-slate-900">{currentUser.name}</strong>) is registered under 
              <span className="inline-block mx-1 font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {userHomeSchool.name}
              </span>
              and cannot access the isolated database or workspaces of 
              <span className="inline-block mx-1 font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {currentTenant.name}
              </span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Data Protection & Privacy Policy Guarantee:</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Each educational institution operates within an encrypted, strictly partitioned silo. Student admissions, attendance rolls, CBC assessment portfolios, teacher appraisal ratings, and bursary finances from one tenant school can never be viewed or manipulated by another school.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                switchTenant(userSchoolId);
                if (onSwitchToHomeSchool) {
                  onSwitchToHomeSchool(userSchoolId);
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <School className="w-4 h-4" />
              <span>Switch to My School ({userHomeSchool.name})</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-600" />
                <span>Log Out of Current Session</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Check: Role-Based Access Control (RBAC)
  const isAuthorizedRole = allowedRoles.includes(currentUser.role) || (currentUser.role === 'admin' && allowedRoles.includes('admin'));

  if (!isAuthorizedRole) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-amber-300 shadow-xl p-6 sm:p-8 space-y-6 text-center">
          
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner border border-amber-300">
            <Lock className="w-8 h-8 text-amber-700" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
              <span>Role-Based Access Control (RBAC) Enforcement</span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900">
              Access Denied: Insufficient Role Clearance
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Your account is signed in with the role of 
              <strong className="text-slate-900 capitalize mx-1 font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {formatRoleLabel(currentUser.role)}
              </strong>. 
              This role does not possess clearance to access the <strong className="text-slate-900">{workspaceName}</strong>.
            </p>
          </div>

          {/* Permitted Roles Information Matrix */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-700">Protected Workspace:</span>
              <span className="font-semibold text-slate-900">{workspaceName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-700">Your Current Role:</span>
              <span className="font-bold text-amber-700 capitalize">{formatRoleLabel(currentUser.role)}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1.5">Authorized Roles for This Workspace:</span>
              <div className="flex flex-wrap gap-1.5">
                {allowedRoles.map(r => (
                  <span 
                    key={r} 
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300"
                  >
                    {formatRoleLabel(r)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Security Policy Reminder */}
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Institutional governance mandates that workspaces are strictly role-isolated. For example, student marksheets and CBC portfolios are restricted to authorized academic faculty, while student health records are restricted to the school nursing officer.
          </p>

          {/* Navigation and Action Options */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                // Open user switch modal or return to default home
                const switchBtn = document.querySelector('button[title*="Switch User"], button[title*="Quick Switch"]') as HTMLButtonElement | null;
                if (switchBtn) {
                  switchBtn.click();
                } else {
                  window.dispatchEvent(new CustomEvent('open-user-switch-modal'));
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Switch to Authorized Account</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Access Granted: Render Workspace Content
  return <>{children}</>;
};
