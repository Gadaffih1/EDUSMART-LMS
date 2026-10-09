import React, { useState } from 'react';
import { 
  User, 
  UserRole, 
  RoleAccessRights,
  GradeLevel, 
  StreamName, 
  getStreamsForGrade, 
  getSubjectsForGrade,
  SubjectName,
  GradePassword
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { WorkEntryAuditViewer } from '../common/WorkEntryAuditViewer';
import { SanatoriumSection } from '../sanatorium/SanatoriumSection';
import { TransportWorkspace } from '../transport/TransportWorkspace';
import { CoCurricularWorkspace } from '../cocurricular/CoCurricularWorkspace';
import { TimetablePortal } from '../timetable/TimetablePortal';
import { LearnerLunchRegister } from '../meals/LearnerLunchRegister';
import { ReportingHub } from '../reports/ReportingHub';
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  Video, 
  Check, 
  Lock, 
  FileText, 
  BarChart3, 
  Search,
  School,
  AlertCircle,
  RefreshCw,
  HeartPulse,
  Bus,
  Trophy,
  CalendarDays,
  Utensils,
  FileSpreadsheet,
  Edit2,
  Sliders,
  X,
  Save,
  ShieldAlert,
  CheckCircle2,
  Shield,
  SlidersHorizontal
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser.role === 'admin';
  const isHeadTeacher = currentUser.role === 'head_teacher';
  const isDeputyHead = currentUser.role === 'deputy_head';
  const isDean = currentUser.role === 'dean_of_studies';

  // Sub-tabs: Default to oversight for leadership, users for system admin
  const defaultTab = ['head_teacher', 'deputy_head', 'dean_of_studies'].includes(currentUser.role)
    ? 'oversight'
    : 'users';
  const [activeTab, setActiveTab] = useState<
    | 'users' 
    | 'create_user' 
    | 'permissions'
    | 'passwords' 
    | 'virtual_rooms' 
    | 'work_entry_audit' 
    | 'timetable' 
    | 'sanatorium' 
    | 'lunch_register' 
    | 'transport' 
    | 'cocurricular' 
    | 'oversight' 
    | 'reports'
  >(defaultTab);

  // User state synced with Storage
  const [allUsers, setAllUsers] = useState<User[]>(() => Storage.getUsers());
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RoleAccessRights>>(() => Storage.getRolePermissions());
  
  // Real-time synchronization
  React.useEffect(() => {
    const handleUsersUpdate = () => setAllUsers(Storage.getUsers());
    const handlePermsUpdate = () => setRolePermissions(Storage.getRolePermissions());
    window.addEventListener('users-updated', handleUsersUpdate);
    window.addEventListener('role-permissions-updated', handlePermsUpdate);
    return () => {
      window.removeEventListener('users-updated', handleUsersUpdate);
      window.removeEventListener('role-permissions-updated', handlePermsUpdate);
    };
  }, []);

  // Edit User & Assign Role Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('student');
  const [editGrade, setEditGrade] = useState<GradeLevel>(4);
  const [editStream, setEditStream] = useState<StreamName>('Dove');
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editCustomPermissions, setEditCustomPermissions] = useState<Partial<RoleAccessRights>>({});
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 4000);
  };

  // Create User Form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newGrade, setNewGrade] = useState<GradeLevel>(4);
  const [newStream, setNewStream] = useState<StreamName>('Dove');
  const [newIdNumber, setNewIdNumber] = useState('');
  const [newDepartment, setNewDepartment] = useState('Sciences & Mathematics');
  const [newSelectedChildId, setNewSelectedChildId] = useState('usr-stu-brian');
  const [createUserSuccess, setCreateUserSuccess] = useState(false);
  const [createUserError, setCreateUserError] = useState('');

  // Password management
  const [gradePasswords, setGradePasswords] = useState<GradePassword[]>(Storage.getGradePasswords());
  const [editingGrade, setEditingGrade] = useState<GradeLevel | null>(null);
  const [editPassValue, setEditPassValue] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const workLogs = Storage.getWorkEntryLogs();
  const gatePasses = Storage.getGatePasses();
  const virtualClasses = Storage.getVirtualClasses();

  // Filtered users
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.designation && u.designation.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Open Edit User & Assign Role Modal
  const handleOpenEditUserModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword(user.password || '');
    setEditRole(user.role);
    setEditGrade(user.grade || 4);
    setEditStream(user.stream || 'Dove');
    setEditIdNumber(user.admissionNumber || user.tscNumber || '');
    setEditDepartment(user.department || '');
    setEditDesignation(user.designation || '');
    // Load custom permissions or default from current role
    setEditCustomPermissions(user.customPermissions ? { ...user.customPermissions } : {});
  };

  // Save Edited User and Role
  const handleSaveUserRoleAndPermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editEmail.includes('@')) {
      showToast('Please provide a valid email address.', 'error');
      return;
    }

    const updates: Partial<User> = {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      password: editPassword.trim(),
      role: editRole,
      designation: editDesignation.trim(),
      grade: ['student', 'class_teacher'].includes(editRole) ? editGrade : undefined,
      stream: ['student', 'class_teacher'].includes(editRole) ? editStream : undefined,
      department: editRole === 'hod' ? editDepartment : undefined,
      admissionNumber: editRole === 'student' ? editIdNumber : undefined,
      tscNumber: ['teacher', 'class_teacher', 'hod', 'senior_teacher', 'dean_of_studies', 'deputy_head', 'librarian', 'head_teacher', 'nurse'].includes(editRole) ? editIdNumber : undefined,
      customPermissions: Object.keys(editCustomPermissions).length > 0 ? editCustomPermissions : undefined
    };

    const updated = Storage.updateUser(editingUser.id, updates);
    if (updated) {
      setAllUsers(Storage.getUsers());
      showToast(`User ${updated.name} successfully updated! Role assigned as ${editRole.replace('_', ' ').toUpperCase()}.`, 'success');
      setEditingUser(null);
    }
  };

  // Toggle user-level custom permission
  const handleToggleUserPermission = (permKey: keyof RoleAccessRights) => {
    if (!editingUser) return;
    const effective = Storage.getUserEffectivePermissions({
      ...editingUser,
      role: editRole,
      customPermissions: editCustomPermissions
    });
    setEditCustomPermissions(prev => ({
      ...prev,
      [permKey]: !effective[permKey]
    }));
  };

  // Reset user-level custom permission to baseline role defaults
  const handleResetUserPermissionsToRole = () => {
    setEditCustomPermissions({});
    showToast('Reset user permissions to default profile for role ' + editRole, 'info');
  };

  // Toggle global role permission policy
  const handleToggleGlobalRolePermission = (role: UserRole, permKey: keyof RoleAccessRights) => {
    // If nurse, restrict to Sanatorium only by system security policy
    if (role === 'nurse' && permKey !== 'canAccessSanatorium') {
      showToast('School Nursing Officer is strictly restricted to School Sanatorium Clinic portal by institutional health privacy policy.', 'error');
      return;
    }
    const currentVal = rolePermissions[role]?.[permKey] ?? false;
    Storage.updateRolePermissions(role, { [permKey]: !currentVal });
    setRolePermissions(Storage.getRolePermissions());
    showToast(`Updated access right [${permKey}] for role [${role.replace('_', ' ')}]`, 'success');
  };

  // Reset all role permissions to factory defaults
  const handleResetAllRolePermissions = () => {
    localStorage.removeItem('edusmart_role_permissions_v1');
    setRolePermissions(Storage.getRolePermissions());
    showToast('All role access permissions have been reset to factory defaults.', 'info');
  };

  // Handle Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess(false);

    if (!newEmail.includes('@')) {
      setCreateUserError('Please provide a valid email username.');
      return;
    }

    const existing = Storage.findUserByEmail(newEmail);
    if (existing) {
      setCreateUserError('An account with this email address already exists.');
      return;
    }

    const newUser: User = {
      id: `usr-${newRole}-${Date.now()}`,
      name: newName,
      email: newEmail.trim().toLowerCase(),
      password: newPassword || (newRole === 'student' ? `GR${newGrade}@2026` : 'pass2026'),
      role: newRole,
      grade: ['student', 'class_teacher'].includes(newRole) ? newGrade : undefined,
      stream: ['student', 'class_teacher'].includes(newRole) ? newStream : undefined,
      department: newRole === 'hod' ? newDepartment : undefined,
      childrenIds: newRole === 'parent' ? [newSelectedChildId] : undefined,
      admissionNumber: newRole === 'student' ? (newIdNumber || `ADM/2026/0${newGrade}${Math.floor(10 + Math.random() * 90)}`) : undefined,
      tscNumber: ['teacher', 'class_teacher', 'hod', 'senior_teacher', 'dean_of_studies', 'deputy_head', 'librarian', 'head_teacher'].includes(newRole) 
        ? (newIdNumber || `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`) 
        : undefined,
      assignedSubjects: newRole === 'teacher' ? ['Mathematics', 'Integrated Science'] : undefined
    };

    Storage.addUser(newUser);
    setCreateUserSuccess(true);
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewIdNumber('');
    setTimeout(() => setCreateUserSuccess(false), 3000);
  };

  // Update grade password
  const handleSaveGradePassword = (grade: GradeLevel) => {
    if (!editPassValue.trim()) return;
    Storage.updateGradePassword(grade, editPassValue.trim());
    setGradePasswords(Storage.getGradePasswords());
    setEditingGrade(null);
    setEditPassValue('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Leadership & Admin Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-2xs shrink-0 hidden sm:flex items-center justify-center">
            <EduSmartGadsaLogo variant="horizontal" size="sm" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-bold text-xl flex sm:hidden items-center justify-center shadow-xs shrink-0">
            <School className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>EduSmart Institutional Governance</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-bold uppercase tracking-wider">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentUser.name}
            </h1>
            <div className="text-xs text-slate-600 mt-0.5">
              Authoritative management of user accounts, grade passwords, gate exit security logs, and curriculum allocation.
            </div>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Total Accounts</div>
            <div className="text-base font-extrabold font-mono text-slate-900">{allUsers.length}</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-emerald-800 text-[10px] uppercase font-bold">Active Passes</div>
            <div className="text-base font-extrabold font-mono text-emerald-700">{gatePasses.filter(p => p.status === 'active').length}</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Directory ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('create_user')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'create_user' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create New User Account</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'permissions' ? 'bg-indigo-900 text-white shadow-xs' : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-indigo-500" />
          <span>Role Permissions & Access Matrix</span>
          <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.2 rounded font-bold">Admin Control</span>
        </button>

        <button
          onClick={() => setActiveTab('passwords')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'passwords' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Grade Passwords Management</span>
        </button>

        <button
          onClick={() => setActiveTab('virtual_rooms')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'virtual_rooms' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Google Meet Room Links</span>
        </button>

        <button
          onClick={() => setActiveTab('work_entry_audit')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'work_entry_audit' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Work Entry Sign-Ins ({workLogs.length})</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded font-mono font-bold">Locked</span>
        </button>

        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'timetable' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
          <span>Curriculum Timetable & Bell Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('sanatorium')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'sanatorium' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
          <span>Sanatorium Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('lunch_register')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'lunch_register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-amber-400" />
          <span>Learner Lunch Register</span>
        </button>

        <button
          onClick={() => setActiveTab('transport')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'transport' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Bus className="w-3.5 h-3.5 text-amber-400" />
          <span>School Transport</span>
        </button>

        <button
          onClick={() => setActiveTab('cocurricular')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'cocurricular' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-purple-400" />
          <span>Co-Curricular Programmes</span>
        </button>

        <button
          onClick={() => setActiveTab('oversight')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'oversight' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Executive Oversight & Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports' ? 'bg-slate-900 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Reports & Dossiers (Print / PDF)</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: USER DIRECTORY
          ======================================================== */}
      {activeTab === 'users' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Institutional User Directory
              </h2>
              <p className="text-xs text-slate-500">
                All registered students, teachers, class teachers, and executive leadership.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or email..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-64"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold bg-white"
              >
                <option value="all">All Roles (15 Roles)</option>
                <option value="admin">System Administrator</option>
                <option value="head_teacher">Head Teacher (Principal)</option>
                <option value="deputy_head">Deputy Head Teacher</option>
                <option value="dean_of_studies">Dean of Studies</option>
                <option value="senior_teacher">Senior Teacher</option>
                <option value="hod">HOD (Department)</option>
                <option value="class_teacher">Class Teacher</option>
                <option value="teacher">Subject Teacher</option>
                <option value="nurse">School Sanatorium Nurse</option>
                <option value="school_admin_staff">School Admin Staff</option>
                <option value="librarian">School Librarian</option>
                <option value="transport_team">Transport Team</option>
                <option value="cocurricular_team">Co-Curricular Team</option>
                <option value="parent">Parent / Guardian</option>
                <option value="student">Learner / Student</option>
              </select>
            </div>
          </div>

          {actionToast && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              actionToast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
              actionToast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' :
              'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <div className="flex items-center gap-2 font-medium">
                {actionToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
                <span>{actionToast.message}</span>
              </div>
              <button onClick={() => setActionToast(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Username (Email)</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Grade & Stream</th>
                  <th className="py-2.5 px-3">ID / TSC No.</th>
                  <th className="py-2.5 px-3 text-right">Password</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900">Access & Role Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((u) => {
                  const isNurseUser = u.role === 'nurse' || u.email === 'nurse@edusmart.ac.ke';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          {u.customPermissions && Object.keys(u.customPermissions).length > 0 && (
                            <span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold" title="Custom access rights applied">
                              Custom Rights
                            </span>
                          )}
                        </div>
                        {u.designation && (
                          <div className="text-[10px] text-slate-400 font-normal">{u.designation}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${
                          u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          u.role === 'nurse' || isNurseUser ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          u.role === 'deputy_head' || u.role === 'dean_of_studies' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          u.role === 'head_teacher' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {u.role === 'nurse' || isNurseUser ? '🏥 Nurse (Clinic)' : u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {u.grade ? `Grade ${u.grade} ${u.stream ? `(${u.stream})` : ''}` : 'School-Wide'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {u.admissionNumber || u.tscNumber || 'ADM/STAFF'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                        {u.password || '••••••••'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenEditUserModal(u)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg transition-all shadow-2xs cursor-pointer"
                          title="Assign roles and limit or expand access rights"
                        >
                          <Edit2 className="w-3 h-3 text-indigo-600" />
                          <span>Edit & Assign Role</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 2: CREATE USER ACCOUNT (ADMIN ONLY)
          ======================================================== */}
      {activeTab === 'create_user' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Create New School User Account
            </h2>
            <p className="text-xs text-slate-500">
              Admin provisioned accounts: username must be an email address, with assigned password and strict grade/stream allocation.
            </p>
          </div>

          {createUserSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>User account successfully created! The user can now log into their assigned workspace.</span>
            </div>
          )}

          {createUserError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{createUserError}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Ochieng"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username (Email Address)
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. john.ochieng@student.edusmart.ac.ke"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Password
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={newRole === 'student' ? `GR${newGrade}@2026` : 'teach2026'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                >
                  <option value="student">Learner / Student (Own academic & school info)</option>
                  <option value="parent">Parent (Their children's information)</option>
                  <option value="teacher">Subject Teacher (Assigned classes & subjects)</option>
                  <option value="class_teacher">Class Teacher (Assigned class + learners)</option>
                  <option value="hod">HOD (Department)</option>
                  <option value="senior_teacher">Senior Teacher (Academic/learner supervision)</option>
                  <option value="deputy_head">Deputy Head Teacher (Operations/discipline/staff)</option>
                  <option value="dean_of_studies">Dean of Studies (Academic/assessment)</option>
                  <option value="librarian">Librarian (Library)</option>
                  <option value="head_teacher">Head Teacher (School-wide management)</option>
                  <option value="admin">System Administrator (Full system administration)</option>
                </select>
              </div>
            </div>

            {/* If Student or Class Teacher: select exactly 1 grade and 1 stream */}
            {['student', 'class_teacher'].includes(newRole) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Grade (Strictly 1 Grade)
                  </label>
                  <select
                    value={newGrade}
                    onChange={(e) => {
                      const g = Number(e.target.value) as GradeLevel;
                      setNewGrade(g);
                      setNewStream(getStreamsForGrade(g)[0] as StreamName);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  >
                    {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Stream ({newGrade <= 6 ? '8 Primary Streams' : '7 Junior Streams'})
                  </label>
                  <select
                    value={newStream}
                    onChange={(e) => setNewStream(e.target.value as StreamName)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  >
                    {getStreamsForGrade(newGrade).map(s => (
                      <option key={s} value={s}>{s} Stream</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* If HOD: Department selection */}
            {newRole === 'hod' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Assigned
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Sciences & Mathematics">Sciences & Mathematics</option>
                  <option value="Languages & Linguistics">Languages (English & Kiswahili)</option>
                  <option value="Humanities & Social Studies">Humanities (Social Studies & CRE)</option>
                  <option value="Technical, Applied & Creative Arts">Technical, Applied & Creative Arts</option>
                </select>
              </div>
            )}

            {/* If Parent: Link to child student */}
            {newRole === 'parent' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link to Enrolled Child (Student)
                </label>
                <select
                  value={newSelectedChildId}
                  onChange={(e) => setNewSelectedChildId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                >
                  {allUsers.filter(u => u.role === 'student').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Grade {s.grade} {s.stream}) - {s.admissionNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {newRole === 'student' ? 'Admission Number' : 'TSC Number / Staff ID'} (Optional)
              </label>
              <input
                type="text"
                value={newIdNumber}
                onChange={(e) => setNewIdNumber(e.target.value)}
                placeholder={newRole === 'student' ? 'ADM/2026/0491' : 'TSC/99812/ED'}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Create Account & Provision Access
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ========================================================
          TAB 3: GRADE PASSWORDS MANAGEMENT
          ======================================================== */}
      {activeTab === 'passwords' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Grade-Based Access Passwords (Grades 1 to 9)
            </h2>
            <p className="text-xs text-slate-500">
              Admin can update or reset passwords for each grade portal.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-w-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Grade Level</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Current Password</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {gradePasswords.map((gp) => (
                  <tr key={gp.grade} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">Grade {gp.grade}</td>
                    <td className="py-3 px-4 font-sans text-slate-600">
                      {gp.grade <= 6 ? 'Primary (8 Streams)' : 'Junior School (7 Streams)'}
                    </td>
                    <td className="py-3 px-4">
                      {editingGrade === gp.grade ? (
                        <input
                          type="text"
                          value={editPassValue}
                          onChange={(e) => setEditPassValue(e.target.value)}
                          className="px-2 py-1 text-xs border border-emerald-500 rounded font-mono font-bold"
                        />
                      ) : (
                        <span className="font-bold text-emerald-700">{gp.password}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      {editingGrade === gp.grade ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveGradePassword(gp.grade)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingGrade(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingGrade(gp.grade);
                            setEditPassValue(gp.password);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                        >
                          Change
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 4: GOOGLE MEET VIRTUAL ROOM LINKS
          ======================================================== */}
      {activeTab === 'virtual_rooms' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Virtual Classroom Google Meet Links
            </h2>
            <p className="text-xs text-slate-500">
              Configure active Google Meet meeting codes and URLs for each grade and stream.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {virtualClasses.map((vc) => (
              <div key={vc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Grade {vc.grade} {vc.stream ? `(${vc.stream})` : ''} · {vc.subject}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Connected
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-mono break-all bg-white p-2.5 rounded border border-slate-200">
                  {vc.googleMeetLink}
                </div>
                <div className="text-[11px] text-slate-500">Host: {vc.teacherName}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB: WORK ENTRY SIGN-IN AUDIT (READ-ONLY)
          ======================================================== */}
      {activeTab === 'work_entry_audit' && (
        <WorkEntryAuditViewer 
          currentUser={currentUser} 
          title="System Administrator Work Entry Sign-In Register"
          subtitle="System-wide institutional audit ledger: Real-time clock-in logs, GPS stamps, staff credentials, and verified biometric photos. Strictly non-editable."
        />
      )}

      {/* ========================================================
          TAB: MASTER TIMETABLE & BELL SCHEDULE
          ======================================================== */}
      {activeTab === 'timetable' && (
        <TimetablePortal 
          currentUser={currentUser} 
        />
      )}

      {/* ========================================================
          TAB: SYSTEM SANATORIUM & CLINIC LOGS
          ======================================================== */}
      {activeTab === 'sanatorium' && (
        <SanatoriumSection
          currentUser={currentUser}
          canRecord={false}
          title="System Administration Sanatorium & Medical Audit"
          subtitle="System-wide clinic attendance records, nurse in-charge notes, vital signs, and institutional recommendations. Print/Export PDF dossiers. (Read-Only Audit Mode)"
        />
      )}

      {/* ========================================================
          TAB: SYSTEM LEARNER LUNCH REGISTER & DINING AUDIT
          ======================================================== */}
      {activeTab === 'lunch_register' && (
        <LearnerLunchRegister
          currentUser={currentUser}
          viewMode="executive"
          title="System Administration Learner Lunch Register & Dining Audit"
          subtitle="System-wide dining audit: Student attendance records, meal type statistics, and class teacher register verification across all 9 grades and streams."
        />
      )}

      {/* ========================================================
          TAB: SCHOOL TRANSPORT & FLEET TRACKING SYSTEM
          ======================================================== */}
      {activeTab === 'transport' && (
        <TransportWorkspace currentUser={currentUser} isEmbedded={true} readOnly={true} />
      )}

      {/* ========================================================
          TAB: CO-CURRICULAR & TALENT SURVEILLANCE
          ======================================================== */}
      {activeTab === 'cocurricular' && (
        <CoCurricularWorkspace currentUser={currentUser} isEmbedded={true} readOnly={true} />
      )}

      {/* ========================================================
          TAB 5: EXECUTIVE OVERSIGHT & LOGS
          ======================================================== */}
      {activeTab === 'oversight' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Work Entries Today</div>
              <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{workLogs.length}</div>
              <div className="text-xs text-slate-600 mt-0.5">Staff lesson logs submitted</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Security Gate Passes</div>
              <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{gatePasses.length}</div>
              <div className="text-xs text-slate-600 mt-0.5">Approved student pass outs</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-500">Curriculum Syllabus Coverage</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">91.4%</div>
              <div className="text-xs text-emerald-800 mt-0.5">Grade 1 to 9 combined</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Recent Teacher Work Entry Ledger (All Staff)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Teacher</th>
                    <th className="py-2.5 px-3">Grade & Stream</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Topic</th>
                    <th className="py-2.5 px-3 text-center">Learners</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {workLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-slate-500">{log.date}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{log.teacherName}</td>
                      <td className="py-2 px-3 text-slate-600">Grade {log.grade} ({log.stream})</td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold">{log.subject}</td>
                      <td className="py-2 px-3 text-slate-700">{log.topicTaught}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">{log.learnersPresent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Campus Security Gate Exit Passes (Audit Ledger)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Pass Code</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Grade & Stream</th>
                    <th className="py-2.5 px-3">Departure / Return</th>
                    <th className="py-2.5 px-3">Guardian</th>
                    <th className="py-2.5 px-3">Authorizing Teacher</th>
                    <th className="py-2.5 px-3 text-center">Status Tracking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {gatePasses.map((gp) => (
                    <tr key={gp.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{gp.gatePassCode}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{gp.studentName}</td>
                      <td className="py-2 px-3 text-slate-600">Grade {gp.grade} ({gp.stream})</td>
                      <td className="py-2 px-3 font-mono text-[11px]">
                        <div>Dep: {gp.departureTime}</div>
                        <div className="text-slate-500">Exp: {gp.expectedReturnTime || 'Released'}</div>
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        <div>{gp.guardianName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{gp.guardianPhone}</div>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{gp.teacherName}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                            gp.status === 'active'
                              ? 'bg-amber-100 text-amber-800'
                              : gp.status === 'departed'
                              ? 'bg-purple-100 text-purple-800'
                              : gp.status === 'returned'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {gp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB: ROLE PERMISSIONS MATRIX & ACCESS CONTROL (ADMIN ONLY)
          ======================================================== */}
      {activeTab === 'permissions' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Executive Security & Governance Policy</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Role Permissions Matrix & Access Control Center
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Main Administrator has authoritative control to assign roles, expand capabilities, or limit access rights. Changes apply immediately school-wide.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetAllRolePermissions}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Reset all role policies to institutional defaults"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Factory Defaults</span>
              </button>
            </div>
          </div>

          {/* Access Policy Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase">
                <span className="p-1 bg-indigo-200 rounded">👑</span>
                <span>Main Administrator Rights</span>
              </div>
              <p className="text-xs text-indigo-900 leading-relaxed">
                Full authority to create, edit, and assign roles across all 15 institutional tiers, and granularly limit or expand access rights per user or per role.
              </p>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-rose-950 font-bold text-xs uppercase">
                <span className="p-1 bg-rose-200 rounded">🏥</span>
                <span>Nurse Sanatorium Scoping</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">
                School Nursing Officer accounts are strictly restricted to the School Sanatorium Clinic portal for student healthcare, sick bay triage, and clinic attendance.
              </p>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-blue-950 font-bold text-xs uppercase">
                <span className="p-1 bg-blue-200 rounded">📢</span>
                <span>Deputy & Dean Rights</span>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                Deputy Head Teacher & Dean of Studies hold authoritative rights to edit teacher remarks, modify qualitative write-ups, and republish official student reports.
              </p>
            </div>
          </div>

          {/* Role Access Matrix Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-48">Institutional Role</th>
                  <th className="py-3 px-2 text-center" title="Access School Sanatorium Portal">🏥 Sanatorium</th>
                  <th className="py-3 px-2 text-center" title="View Academic Reports & Grading">📊 Reports</th>
                  <th className="py-3 px-2 text-center" title="Edit Narrative & Comment Write-Ups">✏️ Edit Comments</th>
                  <th className="py-3 px-2 text-center" title="Republish Official Student Reports">📢 Republish</th>
                  <th className="py-3 px-2 text-center" title="Manage Users & Assign Roles">👑 Role Admin</th>
                  <th className="py-3 px-2 text-center" title="Curriculum Timetable & Bell Schedule">📅 Timetable</th>
                  <th className="py-3 px-2 text-center" title="Gate Exit Security Passes">🚪 Gate Pass</th>
                  <th className="py-3 px-2 text-center" title="Library Management Portal">📚 Library</th>
                  <th className="py-3 px-2 text-center" title="School Transport Fleet">🚌 Transport</th>
                  <th className="py-3 px-2 text-center" title="Sports & Co-Curricular">🏆 Sports</th>
                  <th className="py-3 px-2 text-center" title="Learner Lunch Register">🍱 Meals</th>
                  <th className="py-3 px-2 text-center" title="Virtual Classroom Google Meet">🎥 Meet</th>
                  <th className="py-3 px-2 text-center" title="Student Discipline & Pastoral">⚖️ Discipline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(Object.keys(rolePermissions) as UserRole[]).map((role) => {
                  const perms = rolePermissions[role];
                  const isNurse = role === 'nurse';
                  const isLeadership = ['admin', 'head_teacher', 'deputy_head', 'dean_of_studies'].includes(role);

                  return (
                    <tr key={role} className={`hover:bg-slate-50 transition-colors ${
                      isNurse ? 'bg-rose-50/30' : isLeadership ? 'bg-blue-50/20' : ''
                    }`}>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 capitalize">
                          {role.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isNurse ? 'Healthcare Medical Bay' : 
                           role === 'deputy_head' ? 'Operations & Reports Moderation' :
                           role === 'dean_of_studies' ? 'Academics & Reports Moderation' :
                           role === 'admin' ? 'Master System Controller' : 'Standard Faculty'}
                        </div>
                      </td>

                      {/* Sanatorium */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={perms.canAccessSanatorium}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canAccessSanatorium')}
                          className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                        />
                      </td>

                      {/* Academic Reports */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canAccessAcademicReports}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canAccessAcademicReports')}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* Edit Comment Write-Ups */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canEditCommentWriteUps}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canEditCommentWriteUps')}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* Republish Reports */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canRepublishReports}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canRepublishReports')}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* Role Admin */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={role !== 'admin' && role !== 'head_teacher'}
                          checked={perms.canManageUsersAndRoles}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canManageUsersAndRoles')}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* Timetable */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canAccessTimetable}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canAccessTimetable')}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* Gate Passes */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canAccessGatePasses}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canAccessGatePasses')}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* Library */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canAccessLibrary}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canAccessLibrary')}
                          className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* Transport */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canAccessTransport}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canAccessTransport')}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* CoCurricular */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canAccessCoCurricular}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canAccessCoCurricular')}
                          className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* Lunch Register */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canAccessLunchRegister}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canAccessLunchRegister')}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* Virtual Rooms */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canAccessVirtualRooms}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canAccessVirtualRooms')}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      {/* Discipline */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          disabled={isNurse}
                          checked={perms.canManageDiscipline}
                          onChange={() => handleToggleGlobalRolePermission(role, 'canManageDiscipline')}
                          className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          MODAL: EDIT USER ACCOUNT & ASSIGN ROLE & ACCESS RIGHTS
          ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Edit User & Assign Institutional Role
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Account: {editingUser.email} (ID: {editingUser.id})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveUserRoleAndPermissions} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Basic Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>1. User Identity & Authentication</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Username</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Title</label>
                    <input
                      type="text"
                      value={editDesignation}
                      onChange={(e) => setEditDesignation(e.target.value)}
                      placeholder="e.g. Senior Nursing Officer In-Charge, Dean of Studies"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admission / TSC No.</label>
                    <input
                      type="text"
                      value={editIdNumber}
                      onChange={(e) => setEditIdNumber(e.target.value)}
                      placeholder="e.g. NCK/RN-58921, TSC/12345/ED"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  {editRole === 'hod' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                      <select
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-medium"
                      >
                        <option value="Sciences & Mathematics">Sciences & Mathematics</option>
                        <option value="Languages & Humanities">Languages & Humanities</option>
                        <option value="Creative Arts & Applied Technical">Creative Arts & Applied Technical</option>
                      </select>
                    </div>
                  )}

                  {['student', 'class_teacher'].includes(editRole) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Grade</label>
                        <select
                          value={editGrade}
                          onChange={(e) => setEditGrade(Number(e.target.value) as GradeLevel)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-medium"
                        >
                          {[1,2,3,4,5,6,7,8,9].map(g => (
                            <option key={g} value={g}>Grade {g}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Stream</label>
                        <select
                          value={editStream}
                          onChange={(e) => setEditStream(e.target.value as StreamName)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-medium"
                        >
                          {getStreamsForGrade(editGrade).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Role Assignment */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Assign Institutional Role (Authoritative Admin Control)</span>
                  <span className="text-[10px] text-indigo-700 font-mono">15 Standard School Roles</span>
                </h4>

                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs font-bold border border-indigo-300 rounded-lg bg-white text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="admin">System Administrator (Full Control over All Systems & Roles)</option>
                    <option value="head_teacher">Head Teacher / Principal (School-Wide Management)</option>
                    <option value="deputy_head">Deputy Head Teacher (Operations, Discipline & Full Report Moderation)</option>
                    <option value="dean_of_studies">Dean of Studies (Academics, Curriculum & Full Report Moderation)</option>
                    <option value="senior_teacher">Senior Teacher (Supervision & Mentorship)</option>
                    <option value="hod">Head of Department (Curriculum Moderation)</option>
                    <option value="class_teacher">Class Teacher (Stream & Learner Dossiers)</option>
                    <option value="teacher">Subject Teacher (Instruction & Grading)</option>
                    <option value="nurse">School Sanatorium Nurse (Strictly Sanatorium Portal Only)</option>
                    <option value="school_admin_staff">School Admin Staff (Front Office & Gate Passes)</option>
                    <option value="librarian">School Librarian (Library Collections & Circulation)</option>
                    <option value="transport_team">Transport Team (Fleet, Routes & Bus Chaperones)</option>
                    <option value="cocurricular_team">Co-Curricular Team (Sports, Games & Club Patrons)</option>
                    <option value="parent">Parent / Guardian (Children Records)</option>
                    <option value="student">Learner / Student (Academic Materials & Tests)</option>
                  </select>

                  {/* Context notice based on chosen role */}
                  {editRole === 'nurse' && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center gap-2">
                      <span className="text-sm">🏥</span>
                      <span>
                        <strong>Sanatorium Scoping Enforcement:</strong> When assigned the Nurse role, this user will ONLY have access to the School Sanatorium Clinic portal. All other modules are strictly locked.
                      </span>
                    </div>
                  )}

                  {(editRole === 'deputy_head' || editRole === 'dean_of_studies') && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
                      <span className="text-sm">⭐</span>
                      <span>
                        <strong>Executive Moderation Rights:</strong> As {editRole === 'deputy_head' ? 'Deputy Head' : 'Dean of Studies'}, this user has full authoritative rights to edit teacher remarks, revise qualitative write-ups, and republish official student reports.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Granular Access Rights Overrides (Limit or Expand) */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>3. Granular Access Rights (Limit or Expand for this User)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleResetUserPermissionsToRole}
                    className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer"
                  >
                    Reset to Role Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {([
                    { key: 'canAccessSanatorium', label: 'Sanatorium Clinic Portal', icon: '🏥' },
                    { key: 'canAccessAcademicReports', label: 'Academic Reports & Grading', icon: '📊' },
                    { key: 'canEditCommentWriteUps', label: 'Edit Comment-Based Write-Ups', icon: '✏️' },
                    { key: 'canRepublishReports', label: 'Republish Reports & Write-Ups', icon: '📢' },
                    { key: 'canManageUsersAndRoles', label: 'User & Role Administration', icon: '👑' },
                    { key: 'canAccessAdminSettings', label: 'System Admin Governance', icon: '⚙️' },
                    { key: 'canAccessFinancials', label: 'Financials & Event Ticketing', icon: '💳' },
                    { key: 'canAccessTimetable', label: 'Curriculum Timetable & Bell', icon: '📅' },
                    { key: 'canAccessGatePasses', label: 'Gate Exit Security Passes', icon: '🚪' },
                    { key: 'canAccessLibrary', label: 'Library Management System', icon: '📚' },
                    { key: 'canAccessTransport', label: 'School Transport & Fleet', icon: '🚌' },
                    { key: 'canAccessCoCurricular', label: 'Sports & Co-Curricular', icon: '🏆' },
                    { key: 'canAccessLunchRegister', label: 'Learner Lunch Register', icon: '🍱' },
                    { key: 'canAccessVirtualRooms', label: 'Virtual Classrooms (Meet)', icon: '🎥' },
                    { key: 'canManageDiscipline', label: 'Student Discipline & Pastoral', icon: '⚖️' },
                  ] as const).map(({ key, label, icon }) => {
                    const effective = Storage.getUserEffectivePermissions({
                      ...editingUser,
                      role: editRole,
                      customPermissions: editCustomPermissions
                    });
                    const isChecked = effective[key];

                    return (
                      <label
                        key={key}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 font-bold' 
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{icon}</span>
                          <span className="text-[11px]">{label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleUserPermission(key)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save User & Apply Permissions</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
