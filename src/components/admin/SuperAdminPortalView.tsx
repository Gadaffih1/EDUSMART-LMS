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
import { ClassTeacherWorkspace } from '../teacher/ClassTeacherWorkspace';
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
  const [classTeacherSearchQuery, setClassTeacherSearchQuery] = useState<string>('');
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Appoint / Reassign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [targetTeacherId, setTargetTeacherId] = useState<string>('');
  const [assignGrade, setAssignGrade] = useState<GradeLevel>(4);
  const [assignStream, setAssignStream] = useState<StreamName>('Dove');

  // Preview Class Teacher Workspace Modal
  const [previewingTeacher, setPreviewingTeacher] = useState<User | null>(null);

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

  const classTeachers = allUsersState.filter(u => u.role === 'class_teacher');
  const availableTeachers = allUsersState.filter(u => ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(u.role));

  const handleAssignClassTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeacherId) return;

    const teacher = allUsersState.find(u => u.id === targetTeacherId);
    if (!teacher) return;

    Storage.updateUser(targetTeacherId, {
      role: 'class_teacher',
      grade: assignGrade,
      stream: assignStream,
      assignedStreams: [{ grade: assignGrade, stream: assignStream }]
    });

    setIsAssignModalOpen(false);
    triggerToast(`Successfully assigned ${teacher.name} as Class Teacher for Grade ${assignGrade} (${assignStream})!`);
  };

  const handleDemoteToSubjectTeacher = (teacherId: string) => {
    const teacher = allUsersState.find(u => u.id === teacherId);
    if (!teacher) return;

    Storage.updateUser(teacherId, {
      role: 'teacher'
    });
    triggerToast(`${teacher.name} reassigned to Subject Faculty.`);
  };

  const activeSchoolsCount = allTenants.filter(t => t.status !== 'pending').length;
  const pendingSchoolsCount = allTenants.filter(t => t.status === 'pending').length;

  const filteredSchools = allTenants.filter(t => 
    t.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
    t.city.toLowerCase().includes(schoolSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* ========================================================
          1. TOP EXECUTIVE ROOT NAVBAR (MATCHING PANEL 4 IN USER DIAGRAM)
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Brand & Platform Admin Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl shadow-md border border-amber-400/80 flex items-center justify-center shrink-0">
              <EduSmartGadsaLogo variant="emblem" size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Platform Management Console</span>
                </span>
                <span className="bg-amber-400 text-slate-950 text-[9px] font-mono font-black px-1.5 py-0.2 rounded">
                  SUPER ADMIN PORTAL
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white font-serif tracking-tight">
                EduSmart Platform Admin
              </h1>
            </div>
          </div>

          {/* Actions & Platform Owner User Profile */}
          <div className="flex items-center gap-3">
            
            {/* Visual Customizer & CMS Studio Button */}
            <button
              onClick={() => setActiveConsoleTab('customizer')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                activeConsoleTab === 'customizer'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              }`}
              title="Full control to edit, add, remove, customize every part on landing page and portals"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Platform Studio & Customizer</span>
              <span className="sm:hidden">Customizer</span>
            </button>

            {/* Campus Switcher Button: ONLY found on Super admin portal! */}
            <button
              onClick={() => setShowCampusSwitcher(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-xl border border-amber-400/50 hover:border-amber-400 flex items-center gap-2 transition-all shadow-xs cursor-pointer group"
              title="Open Central Multi-Tenancy Campus Switcher (Super Admin Exclusive)"
              aria-label="Open Central Campus Switcher"
            >
              <School className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Campus Switcher</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-200 font-mono px-1.5 py-0.5 rounded border border-amber-400/30">
                {allTenants.length} Campuses
              </span>
            </button>

            {/* Notifications Bell */}
            <button 
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors relative"
              title="Platform Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
            </button>

            {/* Platform Owner Avatar Badge (Panel 4) */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                PO
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-white">Platform Owner</div>
                <div className="text-[10px] text-amber-400 font-semibold">Super Admin</div>
              </div>
            </div>

            {/* Back to Public Website Link */}
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition-all cursor-pointer"
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
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight">
                Platform Overview
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Manage all schools, subscriptions and platform settings.
              </p>
            </div>

            {/* Switch between Overview, Class Teacher Hub, Customizer Studio and Schools Hub */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveConsoleTab('overview')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeConsoleTab === 'overview'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Platform Overview
              </button>
              <button
                onClick={() => setActiveConsoleTab('operations')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeConsoleTab === 'operations'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Finance & Operations</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  Full Control
                </span>
              </button>
              <button
                onClick={() => setActiveConsoleTab('customizer')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeConsoleTab === 'customizer'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                    : 'text-amber-400/90 hover:text-amber-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Customizer Studio</span>
              </button>
              <button
                onClick={() => setActiveConsoleTab('settings_hub')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeConsoleTab === 'settings_hub'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Schools & Tenancy Hub
              </button>
            </div>
          </div>

          {/* 4 Metric Cards (Matching Panel 4 in User Diagram) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Total Schools */}
            <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Schools</div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">{allTenants.length}</div>
              </div>
            </div>

            {/* Metric 2: Active Schools */}
            <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Schools</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{activeSchoolsCount}</div>
              </div>
            </div>

            {/* Metric 3: Pending Schools */}
            <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Schools</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{pendingSchoolsCount}</div>
              </div>
            </div>

            {/* Metric 4: Total Revenue */}
            <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">KSh 1,248,000</div>
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
            <div className="lg:col-span-8 bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white font-serif">Registered Schools & Tenants</h3>
                  <p className="text-xs text-slate-400">Institutional subscriptions, active statuses and portal access</p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={schoolSearchQuery}
                    onChange={(e) => setSchoolSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-slate-800 text-white text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 w-48 sm:w-56"
                  />
                </div>
              </div>

              {/* Schools Table matching Panel 4 in User Diagram */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">School Name</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Plan</th>
                      <th className="py-3 px-3">Expiry Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredSchools.map((school) => {
                      const isSelected = school.id === currentTenant.id;
                      const isPending = school.status === 'pending';

                      return (
                        <tr key={school.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-lg shrink-0 border border-slate-700 flex items-center justify-center p-0.5"
                                style={{ backgroundColor: school.backgroundColor || '#ffffff' }}
                              >
                                {school.logoUrl ? (
                                  <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain" />
                                ) : (
                                  <School className="w-4 h-4 text-slate-700" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white text-xs sm:text-sm">{school.name}</div>
                                <div className="text-[10px] text-slate-400">{school.city} · {school.code}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 font-semibold">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                              school.plan === 'Pro' 
                                ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                : school.plan === 'Standard'
                                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {school.plan || 'Pro'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400">
                            {school.expiryDate || '12 Apr 2026'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                switchTenant(school.id);
                                onEnterSchool(school.id);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
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
              
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl text-left">
                <h3 className="text-base font-black text-white font-serif">Quick Actions</h3>
                
                <div className="space-y-2.5">
                  
                  {/* Action 0: Platform Customizer Studio */}
                  <button
                    onClick={() => setActiveConsoleTab('customizer')}
                    className="w-full p-3 bg-gradient-to-r from-amber-500/15 to-amber-600/15 hover:from-amber-500/25 hover:to-amber-600/25 border border-amber-400/50 hover:border-amber-400 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold">
                      <Sparkles className="w-5 h-5 text-slate-950" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-amber-300 group-hover:text-amber-200 transition-colors flex items-center gap-1.5">
                        <span>Platform Studio & Customizer</span>
                        <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">FULL CONTROL</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Edit, add & remove landing page, portals & workspaces</div>
                    </div>
                  </button>

                  {/* Action 0.5: Finance & Operations Hub */}
                  <button
                    onClick={() => setActiveConsoleTab('operations')}
                    className="w-full p-3 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/50 hover:border-emerald-400 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold">
                      <Building2 className="w-5 h-5 text-slate-950" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-emerald-300 group-hover:text-emerald-200 transition-colors flex items-center gap-1.5">
                        <span>Finance & Operations Governance</span>
                        <span className="text-[9px] bg-emerald-400 text-slate-950 px-1 rounded font-black">SUPER ADMIN</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Manage billing, procurement, stores, CBC payroll & SQL starter bundle</div>
                    </div>
                  </button>

                  {/* Action 1: Add New School */}
                  <button
                    onClick={() => setActiveConsoleTab('settings_hub')}
                    className="w-full p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">Add New School</div>
                      <div className="text-[10px] text-slate-400">Register and configure a new tenant</div>
                    </div>
                  </button>

                  {/* Action 2: Manage Subscriptions */}
                  <button
                    onClick={() => alert("Subscription Management: View institutional contracts, M-Pesa billing, and invoice dispatch.")}
                    className="w-full p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-400/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">Manage Subscriptions</div>
                      <div className="text-[10px] text-slate-400">View plans, tiers and term payments</div>
                    </div>
                  </button>

                  {/* Action 3: System Settings */}
                  <button
                    onClick={() => setActiveConsoleTab('settings_hub')}
                    className="w-full p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">System Settings</div>
                      <div className="text-[10px] text-slate-400">Configure crest logos & background colors</div>
                    </div>
                  </button>

                  {/* Action 4: View Reports */}
                  <button
                    onClick={() => alert("Platform Analytics Report: Monthly active learners: 4,840. Total assessments logged: 19,412. Server latency: 34ms.")}
                    className="w-full p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-400/10 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">View Reports</div>
                      <div className="text-[10px] text-slate-400">Platform usage, bandwidth and revenue</div>
                    </div>
                  </button>

                </div>
              </div>

              {/* Informational Guidance Box */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200/90 space-y-2 text-left">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Platform Isolation Guarantee</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
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
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>EduSmart Multi-Tenant Governance System · Super Administrator Root Terminal</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Select any campus above to enter that school's main learning and administration page.
          </div>
        </div>
      </footer>

    </div>
  );
};
