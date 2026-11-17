import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  School, 
  ExternalLink, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Users,
  CreditCard,
  Plus,
  Settings,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Bell,
  Search,
  Filter,
  DollarSign,
  Edit3,
  X,
  Save,
  Maximize2,
  Menu,
  LogOut,
  FlaskConical,
  Database,
  Download,
  UserCheck
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Storage } from '../../utils/storage';
import { ClientDataStore } from '../../utils/clientDataStore';
import { listPlatformAdmins } from '../../utils/platformAdminAuth';
import { User, GradeLevel, StreamName, PRIMARY_STREAMS, getStreamsForGrade } from '../../types';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { SuperAdminDashboard, type SuperTab } from './SuperAdminDashboard';
import { SuperAdminActionMenu, type SuperAdminTab } from './SuperAdminActionMenu';
import { CampusSwitcherWindow } from '../layout/CampusSwitcherWindow';
import { PlatformStudioCustomizer } from './PlatformStudioCustomizer';
import { SuperAdminOperationsControl } from './SuperAdminOperationsControl';
import { DocumentRequestsHub } from './DocumentRequestsHub';
import { PlatformAdminSettings } from './PlatformAdminSettings';
import { VirtualLabApprovalsPanel } from './VirtualLabApprovalsPanel';
import { PWAAnalyticsPanel } from './PWAAnalyticsPanel';

interface SuperAdminPortalViewProps {
  onEnterSchool?: (schoolId: string) => void;
  onSwitchRoleAndEnter?: (user: User, schoolId: string) => Promise<void> | void;
  onBackToLanding?: () => void;
  onSignOut?: () => void;
}

export const SuperAdminPortalView: React.FC<SuperAdminPortalViewProps> = ({
  onEnterSchool,
  onSwitchRoleAndEnter,
  onBackToLanding,
  onSignOut
}) => {
  const { currentTenant, allTenants, switchTenant, updateTenant } = useTenant();
  const [showCampusSwitcher, setShowCampusSwitcher] = useState<boolean>(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState<boolean>(false);
  const [roleSwitchSchoolId, setRoleSwitchSchoolId] = useState<string>(currentTenant.id);
  const [roleSwitchQuery, setRoleSwitchQuery] = useState<string>('');
  const [switchingRole, setSwitchingRole] = useState<boolean>(false);
  const [enteringSchoolId, setEnteringSchoolId] = useState<string | null>(null);
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<SuperAdminTab>(() => {
    const stored = ClientDataStore.getPreference<string>('edusmart_super_admin_tab', 'overview');
    const allowed: SuperAdminTab[] = ['overview', 'operations', 'customizer', 'schools', 'branding', 'users', 'spelling', 'categories', 'notify', 'doc_requests', 'vlab_approvals', 'pwa_analytics', 'settings'];
    return allowed.includes(stored as SuperAdminTab) ? stored as SuperAdminTab : 'overview';
  });
  const openConsoleTab = (tab: SuperAdminTab) => {
    ClientDataStore.setPreference('edusmart_super_admin_tab', tab);
    setActiveConsoleTab(tab);
  };
  const [schoolSearchQuery, setSchoolSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [allUsersState, setAllUsersState] = useState<User[]>(() => Storage.getUsers());
  const [pendingVlabCount, setPendingVlabCount] = useState<number>(() => {
    const passes = ClientDataStore.getCollection<any[]>('edusmart_vlab_ticket_passes', []);
    return Array.isArray(passes) ? passes.filter((p) => p?.status === 'pending_approval').length : 0;
  });

  useEffect(() => {
    const handleUsersUpdated = () => {
      setAllUsersState(Storage.getUsers());
    };
    const handlePassesUpdated = (evt: Event) => {
      const key = (evt as CustomEvent)?.detail?.key;
      if (key === '*' || key === 'edusmart_vlab_ticket_passes') {
        const passes = ClientDataStore.getCollection<any[]>('edusmart_vlab_ticket_passes', []);
        setPendingVlabCount(
          Array.isArray(passes) ? passes.filter((p) => p?.status === 'pending_approval').length : 0
        );
      }
    };
    window.addEventListener('users-updated', handleUsersUpdated);
    window.addEventListener('edusmart:data-changed', handlePassesUpdated);
    return () => {
      window.removeEventListener('users-updated', handleUsersUpdated);
      window.removeEventListener('edusmart:data-changed', handlePassesUpdated);
    };
  }, []);

  const [exportingMysql, setExportingMysql] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleExportMySqlDump = async () => {
    if (exportingMysql) return;
    setExportingMysql(true);
    try {
      const result = await ClientDataStore.downloadMySqlDump();
      triggerToast(`Downloaded ${result.filename} (${result.tableCount} tables, ${result.totalRows.toLocaleString()} rows)`);
    } catch (err: any) {
      triggerToast(err?.message || 'Failed to export MySQL database dump.');
    } finally {
      setExportingMysql(false);
    }
  };

  const platformAdmin = listPlatformAdmins().find((admin) => admin.isActive && admin.accessScope === 'super_admin_only');
  const superAdminUser: User = platformAdmin
    ? {
        id: platformAdmin.id,
        name: platformAdmin.name,
        email: platformAdmin.email,
        role: 'admin',
        isActive: true,
        accessScope: 'super_admin_only',
        rights: platformAdmin.rights,
      }
    : allUsersState.find(u => u.role === 'admin') || {
        id: 'usr-admin-root',
        name: 'Super Administrator',
        email: 'admin@edusmart.ac.ke',
        role: 'admin'
      };

  const activeSchoolsCount = allTenants.filter(t => t.status !== 'pending').length;
  const pendingSchoolsCount = allTenants.filter(t => t.status === 'pending').length;

  const filteredSchools = allTenants.filter(t => 
    t.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
    t.city.toLowerCase().includes(schoolSearchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-950">
      
      {/* ========================================================
          1. TOP EXECUTIVE ROOT NAVBAR (MATCHING PANEL 4 IN USER DIAGRAM)
          ======================================================== */}
      <header className="z-40 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-18 py-2 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand & Platform Admin Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-white p-1 sm:p-1.5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
              <EduSmartGadsaLogo forceSystemLogo variant="emblem" size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Platform Management Console</span>
                </span>
                <span className="hidden sm:inline-flex bg-blue-50 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100">
                  SUPER ADMIN PORTAL
                </span>
              </div>
              <h1 className="text-xs sm:text-base font-extrabold text-slate-950 tracking-tight">
                EduSmart Platform Admin
              </h1>
            </div>
          </div>

          {/* Actions & Platform Owner User Profile */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            
            {/* Export Complete MySQL Dump (.sql) to PC */}
            <button
              type="button"
              onClick={handleExportMySqlDump}
              disabled={exportingMysql}
              className="px-2 sm:px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl border border-emerald-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Download full central database as a MySQL 8.0+ / MariaDB (.sql) dump file"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">{exportingMysql ? 'Exporting SQL…' : 'Export MySQL (.sql)'}</span>
              <span className="md:hidden">.SQL</span>
            </button>

            {/* Super Admin Exclusive Switch Role Button */}
            <button
              type="button"
              onClick={() => {
                setRoleSwitchSchoolId(currentTenant.id);
                setRoleSwitchQuery('');
                setShowRoleSwitcher(true);
              }}
              className="px-2 sm:px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Switch to any school role (Super Admin Exclusive)"
              aria-label="Switch Role"
            >
              <UserCheck className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Switch Role</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Visual Customizer & CMS Studio Button */}
            <button
              onClick={() => setShowCampusSwitcher(true)}
              className="px-2 sm:px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl border border-blue-100 hover:border-blue-200 flex items-center gap-2 transition-all shadow-xs cursor-pointer group"
              title="Open Central Multi-Tenancy Campus Switcher (Super Admin Exclusive)"
              aria-label="Open Central Campus Switcher"
            >
              <School className="w-4 h-4 text-blue-700 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Campus Switcher</span>
              <span className="hidden sm:inline text-[10px] bg-white text-blue-800 font-bold px-1.5 py-0.5 rounded border border-blue-100">
                {allTenants.length} Campuses
              </span>
            </button>

            {/* Notifications Bell */}
            <button 
              className="p-1.5 sm:p-2 text-slate-500 hover:text-blue-700 rounded-xl hover:bg-blue-50 transition-colors relative"
              title="Platform Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            {/* Platform Owner Avatar Badge (Panel 4) */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                PO
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-slate-900">Platform Owner</div>
                <div className="text-[10px] text-blue-700 font-semibold">Super Admin</div>
              </div>
            </div>

            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-800 hover:bg-blue-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                title="Open the public site"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Public Site</span>
              </button>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer"
                title="Sign out of the platform admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}

          </div>

        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <SuperAdminActionMenu
          activeTab={activeConsoleTab}
          onSelect={openConsoleTab}
          collapsed={menuCollapsed}
          onToggleCollapsed={() => setMenuCollapsed((open) => !open)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          schoolCount={allTenants.length}
          userCount={allUsersState.length}
          pendingVlabCount={pendingVlabCount}
        />
        <div className="min-w-0 flex-1 overflow-y-auto">

      {/* ========================================================
          2. PLATFORM OVERVIEW BANNER (MATCHING PANEL 4 IN USER DIAGRAM)
          ======================================================== */}
      <section className="bg-gradient-to-br from-white via-white to-blue-50/70 border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
                aria-label="Open platform menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                  {activeConsoleTab === 'overview' && 'Platform Overview'}
                  {activeConsoleTab === 'operations' && 'Finance & Operations'}
                  {activeConsoleTab === 'customizer' && 'Platform Studio'}
                  {activeConsoleTab === 'schools' && 'Schools & Tenancy'}
                  {activeConsoleTab === 'branding' && 'Logo & Background'}
                  {activeConsoleTab === 'users' && 'Users & Staff'}
                  {activeConsoleTab === 'spelling' && 'Spelling Corrector'}
                  {activeConsoleTab === 'categories' && 'Categories'}
                  {activeConsoleTab === 'notify' && 'Broadcast Alerts'}
                  {activeConsoleTab === 'doc_requests' && 'Document Requests'}
                  {activeConsoleTab === 'vlab_approvals' && 'Virtual Lab Approvals'}
                  {activeConsoleTab === 'pwa_analytics' && 'PWA App & Installs'}
                  {activeConsoleTab === 'settings' && 'Account Settings'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Manage all schools, subscriptions and platform settings.
                </p>
              </div>
            </div>
            {toastMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-900 shadow-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{toastMessage}</span>
              </div>
            )}
          </div>

          {/* 4 Metric Cards (Matching Panel 4 in User Diagram) */}
          {activeConsoleTab === 'overview' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Total Schools */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Schools</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950">{allTenants.length}</div>
              </div>
            </div>

            {/* Metric 2: Active Schools */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Schools</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{activeSchoolsCount}</div>
              </div>
            </div>

            {/* Metric 3: Pending Schools */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Schools</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">{pendingSchoolsCount}</div>
              </div>
            </div>

            {/* Metric 4: Total Revenue */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 border border-violet-100">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-950">KSh 1,248,000</div>
              </div>
            </div>

          </div>
          )}

        </div>
      </section>

      {/* ========================================================
          3. MAIN CONTENT: SCHOOLS TABLE & QUICK ACTIONS (PANEL 4)
          ======================================================== */}
      {activeConsoleTab === 'overview' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 8 Cols: Schools Table */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Registered Schools & Tenants</h3>
                  <p className="text-xs text-slate-500">Institutional subscriptions, active statuses and portal access</p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={schoolSearchQuery}
                    onChange={(e) => setSchoolSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white text-slate-900 placeholder:text-slate-400 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 sm:w-56"
                  />
                </div>
              </div>

              {/* Schools Table matching Panel 4 in User Diagram */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">School Name</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Plan</th>
                      <th className="py-3 px-3">Expiry Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSchools.map((school) => {
                      const isSelected = school.id === currentTenant.id;
                      const isPending = school.status === 'pending';

                      return (
                        <tr key={school.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-lg shrink-0 border border-slate-200 flex items-center justify-center p-0.5"
                                style={{ backgroundColor: school.backgroundColor || '#ffffff' }}
                              >
                                {school.logoUrl ? (
                                  <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain" />
                                ) : (
                                  <School className="w-4 h-4 text-slate-700" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs sm:text-sm">{school.name}</div>
                                <div className="text-[10px] text-slate-500">{school.city} · {school.code}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => {
                                  updateTenant(school.id, { status: 'active', expiryDate: '31 Dec 2026' });
                                  triggerToast(`${school.name} approved and activated.`);
                                }}
                                title="Click to approve and activate this school"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 hover:bg-emerald-50 text-amber-800 hover:text-emerald-800 border border-amber-200 hover:border-emerald-300 transition-colors cursor-pointer"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Pending · Approve</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 font-semibold">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                              school.plan === 'Pro' 
                                ? 'bg-blue-50 text-blue-800 border border-blue-100'
                                : school.plan === 'Standard'
                                ? 'bg-violet-50 text-violet-800 border border-violet-100'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {school.plan || 'Pro'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                            {school.expiryDate || '12 Apr 2026'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              disabled={enteringSchoolId === school.id}
                              onClick={async () => {
                                setEnteringSchoolId(school.id);
                                try {
                                  await switchTenant(school.id);
                                  onEnterSchool?.(school.id);
                                } finally {
                                  setEnteringSchoolId(null);
                                }
                              }}
                              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 ml-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              title={`Enter ${school.name} Workspace as Platform Owner`}
                            >
                              <span>{enteringSchoolId === school.id ? 'Entering...' : 'Enter School'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Right 4 Cols: Quick Actions (Panel 4) */}
            <div className="lg:col-span-4 space-y-4">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm text-left">
                <h3 className="text-base font-extrabold text-slate-950">Quick Actions</h3>
                
                <div className="space-y-2.5">
                  
                  {/* Action 0: Platform Customizer Studio */}
                  <button
                    onClick={() => openConsoleTab('customizer')}
                    className="w-full p-3 bg-blue-50/70 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-bold">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-blue-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                        <span>Platform Studio & Customizer</span>
                        <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-extrabold">FULL CONTROL</span>
                      </div>
                      <div className="text-[10px] text-slate-600">Edit, add & remove landing page, portals & workspaces</div>
                    </div>
                  </button>

                  {/* Action 0.5: Finance & Operations Hub */}
                  <button
                    onClick={() => openConsoleTab('operations')}
                    className="w-full p-3 bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-bold">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-emerald-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                        <span>Finance & Operations Governance</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold">SUPER ADMIN</span>
                      </div>
                      <div className="text-[10px] text-slate-600">Manage billing, procurement, stores, CBC payroll & SQL starter bundle</div>
                    </div>
                  </button>

                  {/* Action 0.6: Virtual Lab Approvals */}
                  <button
                    onClick={() => openConsoleTab('vlab_approvals')}
                    className="w-full p-3 bg-amber-50/70 hover:bg-amber-50 border border-amber-200 hover:border-amber-300 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-bold">
                      <FlaskConical className="w-5 h-5 text-slate-950" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xs text-slate-900 group-hover:text-amber-900 transition-colors flex items-center justify-between gap-1.5">
                        <span>Virtual Lab Payment Approvals</span>
                        {pendingVlabCount > 0 && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full font-black">
                            {pendingVlabCount} pending
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-600">Paybill 400200 · Account 1164798 verification</div>
                    </div>
                  </button>

                  {/* Action 1: Add New School */}
                  <button
                    onClick={() => openConsoleTab('schools')}
                    className="w-full p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-800 transition-colors">Add New School</div>
                      <div className="text-[10px] text-slate-600">Register and configure a new tenant</div>
                    </div>
                  </button>

                  {/* Action 2: Manage Subscriptions */}
                  <button
                    onClick={() => openConsoleTab('operations')}
                    className="w-full p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-800 transition-colors">Manage Subscriptions</div>
                      <div className="text-[10px] text-slate-600">View plans, tiers and term payments</div>
                    </div>
                  </button>

                  {/* Action 3: System Settings */}
                  <button
                    onClick={() => openConsoleTab('branding')}
                    className="w-full p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-800 transition-colors">System Settings</div>
                      <div className="text-[10px] text-slate-600">Configure crest logos & background colors</div>
                    </div>
                  </button>

                  {/* Action 4: Download MySQL Dump to PC */}
                  <button
                    type="button"
                    onClick={handleExportMySqlDump}
                    disabled={exportingMysql}
                    className="w-full p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group disabled:opacity-60"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-emerald-950">
                        {exportingMysql ? 'Generating MySQL Dump…' : 'Export MySQL Dump (.sql)'}
                      </div>
                      <div className="text-[10px] text-emerald-800">Download full database backup to this PC</div>
                    </div>
                  </button>

                </div>
              </div>

              {/* Informational Guidance Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-2 text-left">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Platform Isolation Guarantee</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Tenant school admins, teachers, and learners NEVER see Super Admin controls or campus switchers. Only platform owners can switch tenants or return to this console.
                </p>
              </div>

            </div>

          </div>

        </main>
      ) : activeConsoleTab === 'operations' ? (
        /* Super Admin Operations & Finance Hub View */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <SuperAdminOperationsControl
            currentUser={superAdminUser}
            onEnterSchoolPortal={onEnterSchool}
          />
        </main>
      ) : activeConsoleTab === 'customizer' ? (
        /* Visual Studio & Customizer View */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <PlatformStudioCustomizer onPreviewLanding={onBackToLanding} />
        </main>
      ) : activeConsoleTab === 'doc_requests' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <DocumentRequestsHub currentUser={superAdminUser} />
        </main>
      ) : activeConsoleTab === 'vlab_approvals' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <VirtualLabApprovalsPanel />
        </main>
      ) : activeConsoleTab === 'pwa_analytics' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <PWAAnalyticsPanel />
        </main>
      ) : activeConsoleTab === 'settings' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {platformAdmin ? (
            <PlatformAdminSettings key={platformAdmin.email} admin={platformAdmin} />
          ) : (
            <p className="text-sm text-slate-600">The platform admin account is not loaded yet.</p>
          )}
        </main>
      ) : (
        /* Detailed Deep Configuration Dashboard */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <SuperAdminDashboard
            currentUser={superAdminUser}
            onEnterSchoolPortal={onEnterSchool}
            section={activeConsoleTab as SuperTab}
            onSectionChange={openConsoleTab}
          />
        </main>
      )}

      <footer className="bg-slate-950 border-t border-slate-800 py-6 text-center text-xs text-slate-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>EduSmart Multi-Tenant Governance System · Platform Administration</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Choose a section in the side menu. Campus Switcher stays in the header.
          </div>
        </div>
      </footer>
        </div>
      </div>

      <CampusSwitcherWindow
        isOpen={showCampusSwitcher}
        onClose={() => setShowCampusSwitcher(false)}
        onEnterCampus={(schoolId) => {
          setShowCampusSwitcher(false);
          onEnterSchool?.(schoolId);
        }}
      />

      {showRoleSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  <span>Super Admin Role &amp; Portal Switcher</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preview and enter any tenant school portal using an authorized role profile. Only visible to Super Admins.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleSwitcher(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70"
                aria-label="Close Role Switcher"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Target School Campus
                  </label>
                  <select
                    value={roleSwitchSchoolId}
                    onChange={(e) => setRoleSwitchSchoolId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                  >
                    {allTenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Filter User or Role
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={roleSwitchQuery}
                      onChange={(e) => setRoleSwitchQuery(e.target.value)}
                      placeholder="Search name, email, or role..."
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {allUsersState
                .filter((u) => {
                  const matchesSchool = !u.schoolId || u.schoolId === roleSwitchSchoolId || roleSwitchSchoolId === 'school-edusmart-main';
                  if (!matchesSchool) return false;
                  if (!roleSwitchQuery.trim()) return true;
                  const q = roleSwitchQuery.trim().toLowerCase();
                  return (
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.role.toLowerCase().includes(q)
                  );
                })
                .slice(0, 60)
                .map((targetUser) => (
                  <div key={`${roleSwitchSchoolId}-${targetUser.id}`} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{targetUser.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 truncate">
                        <span className="font-mono">{targetUser.email}</span>
                        <span aria-hidden="true">·</span>
                        <span className="uppercase font-semibold text-blue-700">{targetUser.role.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={switchingRole}
                      onClick={async () => {
                        setSwitchingRole(true);
                        try {
                          if (onSwitchRoleAndEnter) {
                            await onSwitchRoleAndEnter(targetUser, roleSwitchSchoolId);
                          } else {
                            await switchTenant(roleSwitchSchoolId);
                            onEnterSchool?.(roleSwitchSchoolId);
                          }
                          setShowRoleSwitcher(false);
                        } finally {
                          setSwitchingRole(false);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      Enter Portal
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
