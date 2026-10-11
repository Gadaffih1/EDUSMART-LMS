import React, { useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  RoleAccessRights, 
  ExtraAdminRoleType,
  GradeLevel 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  ShieldCheck, 
  FileText, 
  Edit3, 
  Tags, 
  Layers, 
  Zap, 
  Search, 
  Check, 
  X, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Info,
  ChevronDown,
  ChevronRight,
  Save,
  RotateCcw
} from 'lucide-react';

interface ExtraRolesManagerProps {
  currentUser: User;
  onNavigateToDocs?: () => void;
  onNavigateToCMS?: () => void;
}

export const ExtraRolesManager: React.FC<ExtraRolesManagerProps> = ({ 
  currentUser,
  onNavigateToDocs,
  onNavigateToCMS
}) => {
  const [users, setUsers] = useState<User[]>(() => Storage.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedExtraRoleFilter, setSelectedExtraRoleFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modal / Drawer state for configuring a specific user's extra roles
  const [configuringUser, setConfiguringUser] = useState<User | null>(null);
  const [configRoles, setConfigRoles] = useState<ExtraAdminRoleType[]>([]);
  const [configDocScopeUserIds, setConfigDocScopeUserIds] = useState<string[]>([]);
  const [configDocAllowAll, setConfigDocAllowAll] = useState<boolean>(true);
  const [configPostEditorAuthorIds, setConfigPostEditorAuthorIds] = useState<string[]>([]);
  const [configPostEditorAllowAll, setConfigPostEditorAllowAll] = useState<boolean>(false);
  const [configDoubleAccessEnabled, setConfigDoubleAccessEnabled] = useState<boolean>(false);
  const [configDoubleAccessSecondaryRole, setConfigDoubleAccessSecondaryRole] = useState<UserRole>('dean_of_studies');
  const [configDoubleAccessSecondaryTitle, setConfigDoubleAccessSecondaryTitle] = useState<string>('');
  const [configDoubleAccessExtraPerms, setConfigDoubleAccessExtraPerms] = useState<string[]>(['canAccessAcademicReports', 'canEditCommentWriteUps']);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const handleUpdate = () => setUsers(Storage.getUsers());
    window.addEventListener('users-updated', handleUpdate);
    return () => window.removeEventListener('users-updated', handleUpdate);
  }, []);

  const openConfigModal = (targetUser: User) => {
    setConfiguringUser(targetUser);
    setConfigRoles(targetUser.extraRoles ? [...targetUser.extraRoles] : []);
    
    // Doc Scope
    setConfigDocScopeUserIds(targetUser.documentRequestScope?.allowedUserIds || []);
    setConfigDocAllowAll(targetUser.documentRequestScope?.allowAll !== false);

    // Delegated Post Scope
    setConfigPostEditorAuthorIds(targetUser.delegatedPostEditorScope?.editableAuthorIds || []);
    setConfigPostEditorAllowAll(targetUser.delegatedPostEditorScope?.allowAll === true);

    // Double Access
    setConfigDoubleAccessEnabled(Boolean(targetUser.doubleAccessConfig?.enabled));
    setConfigDoubleAccessSecondaryRole(targetUser.doubleAccessConfig?.secondaryRole || 'dean_of_studies');
    setConfigDoubleAccessSecondaryTitle(targetUser.doubleAccessConfig?.secondaryDesignation || '');
    setConfigDoubleAccessExtraPerms(
      (targetUser.doubleAccessConfig?.extraGrantedPermissions as string[]) || ['canAccessAcademicReports', 'canEditCommentWriteUps']
    );
  };

  const handleToggleExtraRole = (roleKey: ExtraAdminRoleType) => {
    if (configRoles.includes(roleKey)) {
      setConfigRoles(configRoles.filter(r => r !== roleKey));
      if (roleKey === 'double_access_teacher') {
        setConfigDoubleAccessEnabled(false);
      }
    } else {
      setConfigRoles([...configRoles, roleKey]);
      if (roleKey === 'double_access_teacher') {
        setConfigDoubleAccessEnabled(true);
      }
    }
  };

  const handleSaveConfiguration = () => {
    if (!configuringUser) return;

    const updated = Storage.assignExtraRolesToUser(configuringUser.id, configRoles, {
      documentRequestScope: {
        allowedUserIds: configDocScopeUserIds,
        allowAll: configDocAllowAll,
        allowedRoles: ['student', 'parent', 'teacher']
      },
      delegatedPostEditorScope: {
        editableAuthorIds: configPostEditorAuthorIds,
        allowAll: configPostEditorAllowAll
      },
      doubleAccessConfig: {
        enabled: configDoubleAccessEnabled || configRoles.includes('double_access_teacher'),
        secondaryRole: configDoubleAccessSecondaryRole,
        secondaryDesignation: configDoubleAccessSecondaryTitle.trim() || undefined,
        extraGrantedPermissions: configDoubleAccessExtraPerms as (keyof RoleAccessRights)[]
      }
    });

    if (updated) {
      setUsers(Storage.getUsers());
      showToast(`Extra roles and custom delegation updated for ${updated.name}!`, 'success');
      setConfiguringUser(null);
    }
  };

  // Quick 1-click toggle for an extra role directly from the table
  const handleQuickToggleRole = (user: User, roleKey: ExtraAdminRoleType) => {
    const current = user.extraRoles || [];
    const hasRole = current.includes(roleKey);
    const updatedRoles = hasRole 
      ? current.filter(r => r !== roleKey) 
      : [...current, roleKey];

    const doubleConfig = roleKey === 'double_access_teacher'
      ? {
          enabled: !hasRole,
          secondaryRole: user.doubleAccessConfig?.secondaryRole || 'dean_of_studies',
          secondaryDesignation: user.doubleAccessConfig?.secondaryDesignation || 'Assistant Dean of Studies',
          extraGrantedPermissions: ['canAccessAcademicReports', 'canEditCommentWriteUps'] as (keyof RoleAccessRights)[]
        }
      : user.doubleAccessConfig;

    Storage.assignExtraRolesToUser(user.id, updatedRoles, {
      doubleAccessConfig: doubleConfig
    });

    setUsers(Storage.getUsers());
    showToast(
      hasRole 
        ? `Revoked [${getExtraRoleLabel(roleKey)}] from ${user.name}` 
        : `Granted [${getExtraRoleLabel(roleKey)}] to ${user.name}`,
      hasRole ? 'info' : 'success'
    );
  };

  const getExtraRoleLabel = (role: ExtraAdminRoleType) => {
    switch (role) {
      case 'document_requester': return '1. Document Submission Requester';
      case 'delegated_post_editor': return '2. Delegated Post Editor';
      case 'category_curator': return '3. Category & Taxonomy Curator';
      case 'double_access_teacher': return '4. Double Access Rights';
      case 'cms_content_master': return '5. CMS & Section Master';
      default: return role;
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.designation && u.designation.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesExtraRole = selectedExtraRoleFilter === 'all' || 
      (u.extraRoles && u.extraRoles.includes(selectedExtraRoleFilter as ExtraAdminRoleType)) ||
      (selectedExtraRoleFilter === 'any_assigned' && u.extraRoles && u.extraRoles.length > 0) ||
      (selectedExtraRoleFilter === 'none' && (!u.extraRoles || u.extraRoles.length === 0));
    return matchesSearch && matchesRole && matchesExtraRole;
  });

  // Summary counts
  const countDocRequesters = users.filter(u => u.extraRoles?.includes('document_requester')).length;
  const countDelegatedEditors = users.filter(u => u.extraRoles?.includes('delegated_post_editor')).length;
  const countCategoryCurators = users.filter(u => u.extraRoles?.includes('category_curator')).length;
  const countDoubleAccessTeachers = users.filter(u => u.extraRoles?.includes('double_access_teacher') || u.doubleAccessConfig?.enabled).length;
  const countCMSMasters = users.filter(u => u.extraRoles?.includes('cms_content_master')).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-700' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-700' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Authoritative Institutional Governance</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                5 Extra Admin Roles
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Separately Assigned Extra Roles</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              As System Administrator, assign these 5 dedicated extra administrative roles independently to specific users, teachers, and faculty members without altering their baseline school roles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {onNavigateToDocs && (
              <button
                onClick={onNavigateToDocs}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Document Requests Hub</span>
              </button>
            )}
            {onNavigateToCMS && (
              <button
                onClick={onNavigateToCMS}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Open CMS & Sections Hub</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5 EXTRA ROLES MATRIX METRICS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Role 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {countDocRequesters} Active
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-tight">1. Request Documents</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Collect certificates, medical slips from specific users</p>
          </div>
        </div>

        {/* Role 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <Edit3 className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {countDelegatedEditors} Active
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-tight">2. Edit Posts</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Delegated editing of posts by specific authors</p>
          </div>
        </div>

        {/* Role 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              <Tags className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {countCategoryCurators} Active
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-tight">3. Add Categories</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Organize post categories, labels & taxonomies</p>
          </div>
        </div>

        {/* Role 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Zap className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {countDoubleAccessTeachers} Teachers
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-tight">4. Double Access</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Dual workspace privileges for designated teachers</p>
          </div>
        </div>

        {/* Role 5 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              {countCMSMasters} Masters
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-tight">5. CMS & Sections</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Add/remove/edit all posts, categories & sections</p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name, email, designation or department..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
            >
              <option value="all">All Base Roles</option>
              <option value="teacher">Subject Teachers</option>
              <option value="class_teacher">Class Teachers</option>
              <option value="hod">HODs</option>
              <option value="senior_teacher">Senior Teachers</option>
              <option value="deputy_head">Deputy Head Teachers</option>
              <option value="dean_of_studies">Deans of Studies</option>
              <option value="head_teacher">Head Teachers</option>
              <option value="school_admin_staff">School Admin Staff</option>
              <option value="student">Students</option>
              <option value="parent">Parents</option>
            </select>

            <select
              value={selectedExtraRoleFilter}
              onChange={(e) => setSelectedExtraRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
            >
              <option value="all">All Extra Roles</option>
              <option value="any_assigned">Users with Any Extra Role</option>
              <option value="document_requester">1. Document Requesters</option>
              <option value="delegated_post_editor">2. Delegated Post Editors</option>
              <option value="category_curator">3. Category Curators</option>
              <option value="double_access_teacher">4. Double Access Teachers</option>
              <option value="cms_content_master">5. CMS & Section Masters</option>
              <option value="none">No Extra Roles Assigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* USER LIST & DIRECT EXTRA ROLE ASSIGNMENT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="font-black text-sm text-slate-900">
              Institutional User Directory & Extra Role Assignments ({filteredUsers.length} Users)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Click checkboxes to toggle roles or 'Configure Scopes' for specific user targeting
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3 px-4">User Profile</th>
                <th className="py-3 px-3">Base Role</th>
                <th className="py-3 px-2 text-center" title="1. Request for documents submission from specific users">
                  <div className="flex flex-col items-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] mt-0.5">1. Req Docs</span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center" title="2. Edit posts by specific users">
                  <div className="flex flex-col items-center">
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] mt-0.5">2. Edit Posts</span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center" title="3. Add categories under different posts">
                  <div className="flex flex-col items-center">
                    <Tags className="w-4 h-4 text-purple-600" />
                    <span className="text-[10px] mt-0.5">3. Add Cats</span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center" title="4. Double Access rights for specific teachers">
                  <div className="flex flex-col items-center">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] mt-0.5">4. Dual Access</span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center" title="5. Add, remove, edit posts, Categories, sections">
                  <div className="flex flex-col items-center">
                    <Layers className="w-4 h-4 text-rose-600" />
                    <span className="text-[10px] mt-0.5">5. CMS Master</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Scope Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const userExtraRoles = user.extraRoles || [];
                const hasDocRole = userExtraRoles.includes('document_requester') || user.role === 'admin';
                const hasEditPostRole = userExtraRoles.includes('delegated_post_editor') || user.role === 'admin';
                const hasCategoryRole = userExtraRoles.includes('category_curator') || user.role === 'admin';
                const hasDoubleAccess = userExtraRoles.includes('double_access_teacher') || Boolean(user.doubleAccessConfig?.enabled);
                const hasCMSRole = userExtraRoles.includes('cms_content_master') || user.role === 'admin';
                const isTeacher = ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(user.role);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {hasDoubleAccess && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md">
                                ⚡ Dual Role Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                          {user.designation && (
                            <div className="text-[10px] text-slate-500 italic">{user.designation}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Base Role */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>

                    {/* 1. Request Documents */}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={hasDocRole}
                        disabled={user.role === 'admin'}
                        onChange={() => handleQuickToggleRole(user, 'document_requester')}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                        title="Toggle: Request documents from specific users"
                      />
                    </td>

                    {/* 2. Edit Posts by specific users */}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={hasEditPostRole}
                        disabled={user.role === 'admin'}
                        onChange={() => handleQuickToggleRole(user, 'delegated_post_editor')}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer disabled:opacity-50"
                        title="Toggle: Delegated post editing"
                      />
                    </td>

                    {/* 3. Add categories under posts */}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={hasCategoryRole}
                        disabled={user.role === 'admin'}
                        onChange={() => handleQuickToggleRole(user, 'category_curator')}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                        title="Toggle: Add categories under different posts"
                      />
                    </td>

                    {/* 4. Double Access rights */}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={hasDoubleAccess}
                        disabled={!isTeacher && user.role !== 'admin'}
                        onChange={() => handleQuickToggleRole(user, 'double_access_teacher')}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-30"
                        title={isTeacher ? "Toggle: Double Access Rights for teacher" : "Available for teachers and academic staff"}
                      />
                    </td>

                    {/* 5. CMS Master */}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={hasCMSRole}
                        disabled={user.role === 'admin'}
                        onChange={() => handleQuickToggleRole(user, 'cms_content_master')}
                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:opacity-50"
                        title="Toggle: Full CMS Master rights (posts, categories, sections)"
                      />
                    </td>

                    {/* Scope Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openConfigModal(user)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-all shadow-2xs flex items-center gap-1 ml-auto cursor-pointer"
                        title="Configure specific target users, secondary teacher roles & scopes"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Configure Scope</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          CONFIG MODAL: CONFIGURE TARGET SCOPES FOR EXTRA ROLES
          ======================================================== */}
      {configuringUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Configure Extra Roles & Delegation Scopes
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    User: {configuringUser.name} ({configuringUser.email}) · Base Role: {configuringUser.role}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setConfiguringUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Extra Roles Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Assigned Extra Roles (Separately Granted)</span>
                  <span className="text-[10px] text-indigo-700 font-mono">Select any combination</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'document_requester' as ExtraAdminRoleType, label: '1. Request documents submission from specific users', icon: '📄', color: 'border-blue-300 bg-blue-50/50 text-blue-900' },
                    { key: 'delegated_post_editor' as ExtraAdminRoleType, label: '2. Edit posts by specific users', icon: '✏️', color: 'border-amber-300 bg-amber-50/50 text-amber-900' },
                    { key: 'category_curator' as ExtraAdminRoleType, label: '3. Add categories under different posts', icon: '🏷️', color: 'border-purple-300 bg-purple-50/50 text-purple-900' },
                    { key: 'double_access_teacher' as ExtraAdminRoleType, label: '4. Double Access rights for specific teachers', icon: '⚡', color: 'border-emerald-300 bg-emerald-50/50 text-emerald-900' },
                    { key: 'cms_content_master' as ExtraAdminRoleType, label: '5. Add, remove, edit posts, Categories, sections', icon: '👑', color: 'border-rose-300 bg-rose-50/50 text-rose-900' },
                  ].map(({ key, label, icon, color }) => {
                    const isSelected = configRoles.includes(key);
                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected ? color + ' font-bold shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleExtraRole(key)}
                          className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="text-xs">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{icon}</span>
                            <span>{label}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SECTION FOR ROLE 1: SPECIFIC USERS TARGETING FOR DOCUMENT SUBMISSIONS */}
              {configRoles.includes('document_requester') && (
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Role 1 Scope: Target Users for Document Submissions</span>
                    </h5>
                    <label className="flex items-center gap-1.5 text-xs text-blue-900 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configDocAllowAll}
                        onChange={(e) => setConfigDocAllowAll(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                      <span>Allow Requesting from All School Users</span>
                    </label>
                  </div>

                  {!configDocAllowAll && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-blue-800">
                        Select specific learners, teachers, or parents from whom this user is permitted to request documents:
                      </p>
                      <div className="max-h-36 overflow-y-auto bg-white rounded-xl border border-blue-200 p-2 divide-y divide-slate-100">
                        {users.filter(u => u.id !== configuringUser.id).map(u => (
                          <label key={u.id} className="py-1.5 px-2 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer">
                            <span className="font-medium text-slate-800">{u.name} ({u.role})</span>
                            <input
                              type="checkbox"
                              checked={configDocScopeUserIds.includes(u.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setConfigDocScopeUserIds([...configDocScopeUserIds, u.id]);
                                } else {
                                  setConfigDocScopeUserIds(configDocScopeUserIds.filter(id => id !== u.id));
                                }
                              }}
                              className="w-3.5 h-3.5 text-blue-600 rounded"
                            />
                          </label>
                        ))}
                      </div>
                      <div className="text-[11px] text-blue-700 font-mono">
                        {configDocScopeUserIds.length} specific users targeted
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION FOR ROLE 2: SPECIFIC USERS WHOSE POSTS CAN BE EDITED */}
              {configRoles.includes('delegated_post_editor') && (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Role 2 Scope: Specific Authors Whose Posts Can Be Edited</span>
                    </h5>
                    <label className="flex items-center gap-1.5 text-xs text-amber-900 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configPostEditorAllowAll}
                        onChange={(e) => setConfigPostEditorAllowAll(e.target.checked)}
                        className="w-3.5 h-3.5 text-amber-600 rounded"
                      />
                      <span>Can Edit Any Post (All Authors)</span>
                    </label>
                  </div>

                  {!configPostEditorAllowAll && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-amber-800">
                        Designate specific teachers/staff whose announcements and notices this user has authority to edit:
                      </p>
                      <div className="max-h-36 overflow-y-auto bg-white rounded-xl border border-amber-200 p-2 divide-y divide-slate-100">
                        {users.filter(u => ['teacher', 'class_teacher', 'hod', 'head_teacher', 'nurse', 'cocurricular_team'].includes(u.role)).map(u => (
                          <label key={u.id} className="py-1.5 px-2 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer">
                            <span className="font-medium text-slate-800">{u.name} ({u.role})</span>
                            <input
                              type="checkbox"
                              checked={configPostEditorAuthorIds.includes(u.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setConfigPostEditorAuthorIds([...configPostEditorAuthorIds, u.id]);
                                } else {
                                  setConfigPostEditorAuthorIds(configPostEditorAuthorIds.filter(id => id !== u.id));
                                }
                              }}
                              className="w-3.5 h-3.5 text-amber-600 rounded"
                            />
                          </label>
                        ))}
                      </div>
                      <div className="text-[11px] text-amber-700 font-mono">
                        {configPostEditorAuthorIds.length} designated author accounts
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION FOR ROLE 4: DOUBLE ACCESS RIGHTS CONFIGURATION FOR TEACHERS */}
              {configRoles.includes('double_access_teacher') && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Role 4 Configuration: Double Access Rights for Teacher</span>
                    </h5>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-2 py-0.5 rounded-full uppercase">
                      Dual Persona Active
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Grants this teacher seamless dual workspace capabilities. They will see a prominent <strong>"⚡ Dual Access Switcher"</strong> in the top navigation bar to toggle between their classroom workspace and elevated institutional management view.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Secondary Elevated Institutional Role
                      </label>
                      <select
                        value={configDoubleAccessSecondaryRole}
                        onChange={(e) => setConfigDoubleAccessSecondaryRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-xl bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="dean_of_studies">Dean of Studies (Academics & Reports Moderation)</option>
                        <option value="hod">Head of Department (Curriculum Allocation & Faculty)</option>
                        <option value="school_admin_staff">School Admin Staff / Academic Registrar</option>
                        <option value="senior_teacher">Senior Teacher (Learner Mentorship & Discipline)</option>
                        <option value="cocurricular_team">Co-Curricular Team Patron</option>
                        <option value="librarian">Associate Librarian</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Secondary Appointment Designation
                      </label>
                      <input
                        type="text"
                        value={configDoubleAccessSecondaryTitle}
                        onChange={(e) => setConfigDoubleAccessSecondaryTitle(e.target.value)}
                        placeholder="e.g. Dean of Academic Studies & Formative Moderation"
                        className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Granted Elevated Rights */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-emerald-950 uppercase">
                      Elevated Privileges Granted in Secondary Persona:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { key: 'canAccessAcademicReports', label: 'Moderate CBC Reports' },
                        { key: 'canEditCommentWriteUps', label: 'Edit Report Remarks' },
                        { key: 'canRepublishReports', label: 'Republish Results' },
                        { key: 'canAccessTimetable', label: 'Curriculum Timetable' },
                        { key: 'canAccessVirtualRooms', label: 'Virtual Classrooms' },
                        { key: 'canManageDiscipline', label: 'Pastoral Discipline' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-emerald-200 text-[11px] font-medium text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={configDoubleAccessExtraPerms.includes(key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConfigDoubleAccessExtraPerms([...configDoubleAccessExtraPerms, key]);
                              } else {
                                setConfigDoubleAccessExtraPerms(configDoubleAccessExtraPerms.filter(k => k !== key));
                              }
                            }}
                            className="w-3.5 h-3.5 text-emerald-600 rounded"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION FOR ROLE 5: CMS CONTENT & SECTIONS MASTER */}
              {configRoles.includes('cms_content_master') && (
                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-rose-600" />
                      <span>Role 5 Privilege: Full Content & Section Master</span>
                    </h5>
                    <span className="text-[10px] bg-rose-200 text-rose-900 font-black px-2 py-0.5 rounded-full uppercase">
                      CMS Administrator
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-900 leading-relaxed">
                    This user receives master authoring rights across the entire portal: creating announcements, removing old posts, editing any teacher's write-ups, adding/modifying categories, and configuring layout portal sections.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setConfiguringUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfiguration}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Extra Roles & Scopes</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
