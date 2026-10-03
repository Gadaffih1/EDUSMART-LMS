import React, { useState } from 'react';
import { 
  User, 
  UserRole, 
  GradeLevel, 
  StreamName, 
  getStreamsForGrade, 
  getSubjectsForGrade,
  SubjectName,
  GradePassword
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
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
  RefreshCw
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
  const [activeTab, setActiveTab] = useState<'users' | 'create_user' | 'passwords' | 'virtual_rooms' | 'oversight'>(defaultTab);

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

  const allUsers = Storage.getUsers();
  const workLogs = Storage.getWorkEntryLogs();
  const gatePasses = Storage.getGatePasses();
  const virtualClasses = Storage.getVirtualClasses();

  // Filtered users
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
          onClick={() => setActiveTab('oversight')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'oversight' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Executive Oversight & Logs</span>
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
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
              >
                <option value="all">All Roles (11 Roles)</option>
                <option value="student">Learner / Student</option>
                <option value="parent">Parent</option>
                <option value="teacher">Subject Teacher</option>
                <option value="class_teacher">Class Teacher</option>
                <option value="hod">HOD (Department)</option>
                <option value="senior_teacher">Senior Teacher</option>
                <option value="deputy_head">Deputy Head</option>
                <option value="dean_of_studies">Dean of Studies</option>
                <option value="librarian">Librarian</option>
                <option value="head_teacher">Head Teacher</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          </div>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase bg-slate-100 text-slate-700">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {u.grade ? `Grade ${u.grade} ${u.stream ? `(${u.stream})` : ''}` : 'School-Wide'}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">
                      {u.admissionNumber || u.tscNumber || 'ADM/STAFF'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                      {u.password || '••••••••'}
                    </td>
                  </tr>
                ))}
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
    </div>
  );
};
