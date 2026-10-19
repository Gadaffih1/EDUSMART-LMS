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
  BarChart3,
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
  Maximize2
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Storage } from '../../utils/storage';
import { INITIAL_USERS } from '../../data/initialData';
import { User, GradeLevel, StreamName, PRIMARY_STREAMS, getStreamsForGrade } from '../../types';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { CampusSwitcherWindow } from '../layout/CampusSwitcherWindow';
import { PlatformStudioCustomizer } from './PlatformStudioCustomizer';
import { SuperAdminOperationsControl } from './SuperAdminOperationsControl';

interface SuperAdminPortalViewProps {
  onEnterSchool: (schoolId: string) => void;
  onBackToLanding?: () => void;
}

export const SuperAdminPortalView: React.FC<SuperAdminPortalViewProps> = ({
  onEnterSchool,
  onBackToLanding
}) => {
  const { currentTenant, allTenants, switchTenant } = useTenant();
  const [showCampusSwitcher, setShowCampusSwitcher] = useState<boolean>(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'overview' | 'operations' | 'customizer' | 'settings_hub'>('overview');
  const [schoolSearchQuery, setSchoolSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [allUsersState, setAllUsersState] = useState<User[]>(() => Storage.getUsers());

  useEffect(() => {
    const handleUsersUpdated = () => {
      setAllUsersState(Storage.getUsers());
    };
    window.addEventListener('users-updated', handleUsersUpdated);
    return () => window.removeEventListener('users-updated', handleUsersUpdated);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const superAdminUser: User = allUsersState.find(u => u.role === 'admin') || INITIAL_USERS.find(u => u.role === 'admin') || {
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-950">
      
      {/* ========================================================
          1. TOP EXECUTIVE ROOT NAVBAR (MATCHING PANEL 4 IN USER DIAGRAM)
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-18 py-2 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand & Platform Admin Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-white p-1 sm:p-1.5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
              <EduSmartGadsaLogo variant="emblem" size="sm" />
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
            
            {/* Visual Customizer & CMS Studio Button */}
            <button
              onClick={() => setActiveConsoleTab('customizer')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                activeConsoleTab === 'customizer'
                  ? 'bg-blue-700 text-white border-blue-700 font-extrabold'
                  : 'bg-white hover:bg-blue-50 text-blue-800 border-slate-200'
              }`}
              title="Full control to edit, add, remove, customize every part on landing page and portals"
            >
              <Sparkles className={`w-4 h-4 ${activeConsoleTab === 'customizer' ? 'text-white' : 'text-blue-700'}`} />
              <span className="hidden sm:inline">Platform Studio & Customizer</span>
              <span className="sm:hidden">Customizer</span>
            </button>

            {/* Campus Switcher Button: ONLY found on Super admin portal! */}
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

            {/* Back to Public Website Link */}
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                title="View Public Landing Page"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Public Site</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* ========================================================
          2. PLATFORM OVERVIEW BANNER (MATCHING PANEL 4 IN USER DIAGRAM)
          ======================================================== */}
      <section className="bg-gradient-to-br from-white via-white to-blue-50/70 border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                Platform Overview
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Manage all schools, subscriptions and platform settings.
              </p>
            </div>

            {/* Switch between Overview, Finance & Operations, Customizer Studio and Schools Hub */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveConsoleTab('overview')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeConsoleTab === 'overview'
                    ? 'bg-blue-700 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-blue-800 hover:bg-white'
                }`}
              >
                Platform Overview
              </button>
              <button
                onClick={() => setActiveConsoleTab('operations')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeConsoleTab === 'operations'
                    ? 'bg-blue-700 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-blue-800 hover:bg-white'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${activeConsoleTab === 'operations' ? 'text-white' : 'text-blue-700'}`} />
                <span>Finance & Operations</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${activeConsoleTab === 'operations' ? 'bg-white/15 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  Full Control
                </span>
              </button>
              <button
                onClick={() => setActiveConsoleTab('customizer')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeConsoleTab === 'customizer'
                    ? 'bg-blue-700 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-blue-800 hover:bg-white'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${activeConsoleTab === 'customizer' ? 'text-white' : 'text-blue-700'}`} />
                <span>Customizer Studio</span>
              </button>
              <button
                onClick={() => setActiveConsoleTab('settings_hub')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeConsoleTab === 'settings_hub'
                    ? 'bg-blue-700 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-blue-800 hover:bg-white'
                }`}
              >
                Schools & Tenancy Hub
              </button>
            </div>
          </div>

          {/* 4 Metric Cards (Matching Panel 4 in User Diagram) */}
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
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
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
                              onClick={() => {
                                switchTenant(school.id);
                                onEnterSchool(school.id);
                              }}
                              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 ml-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              title={`Enter ${school.name} Workspace as Platform Owner`}
                            >
                              <span>Enter School</span>
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
                    onClick={() => setActiveConsoleTab('customizer')}
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
                    onClick={() => setActiveConsoleTab('operations')}
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

                  {/* Action 1: Add New School */}
                  <button
                    onClick={() => setActiveConsoleTab('settings_hub')}
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
                    onClick={() => alert("Subscription Management: View institutional contracts, M-Pesa billing, and invoice dispatch.")}
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
                    onClick={() => setActiveConsoleTab('settings_hub')}
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

                  {/* Action 4: View Reports */}
                  <button
                    onClick={() => alert("Platform Analytics Report: Monthly active learners: 4,840. Total assessments logged: 19,412. Server latency: 34ms.")}
                    className="w-full p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-800 transition-colors">View Reports</div>
                      <div className="text-[10px] text-slate-600">Platform usage, bandwidth and revenue</div>
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
            onEnterSchoolPortal={(schoolId) => onEnterSchool(schoolId)}
          />
        </main>
      ) : activeConsoleTab === 'customizer' ? (
        /* Visual Studio & Customizer View */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <PlatformStudioCustomizer onPreviewLanding={onBackToLanding} />
        </main>
      ) : (
        /* Detailed Deep Configuration Dashboard */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <SuperAdminDashboard
            currentUser={superAdminUser}
            onEnterSchoolPortal={(schoolId) => onEnterSchool(schoolId)}
          />
        </main>
      )}

      {/* ========================================================
          4. CENTRAL DESKTOP CAMPUS SWITCHER WINDOW
          Campus switcher button is only found on Super admin portal!
          ======================================================== */}
      <CampusSwitcherWindow
        isOpen={showCampusSwitcher}
        onClose={() => setShowCampusSwitcher(false)}
      />

      {/* ========================================================
          5. FOOTER
          ======================================================== */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 text-center text-xs text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>EduSmart Multi-Tenant Governance System · Platform Administration</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Select any campus above to enter that school's main learning and administration page.
          </div>
        </div>
      </footer>

    </div>
  );
};
