import React from 'react';
import { ShieldCheck, School, ExternalLink, ArrowRight, Sparkles, Building2, Users } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Storage } from '../../utils/storage';
import { INITIAL_USERS } from '../../data/initialData';
import { User } from '../../types';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { SuperAdminDashboard } from './SuperAdminDashboard';

interface SuperAdminPortalViewProps {
  onEnterSchool: (schoolId: string) => void;
}

export const SuperAdminPortalView: React.FC<SuperAdminPortalViewProps> = ({
  onEnterSchool
}) => {
  const { currentTenant, allTenants, switchTenant } = useTenant();

  const superAdminUser: User = Storage.getUsers().find(u => u.role === 'admin') || INITIAL_USERS.find(u => u.role === 'admin') || {
    id: 'usr-admin-root',
    name: 'Super Administrator',
    email: 'admin@edusmart.ac.ke',
    role: 'admin'
  };

  const allUsers = Storage.getUsers();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* ========================================================
          1. TOP EXECUTIVE ROOT NAVBAR
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Brand & Terminal Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl shadow-md border border-amber-400/80 flex items-center justify-center shrink-0">
              <EduSmartGadsaLogo variant="full" size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Central Multi-Tenant Governance</span>
                </span>
                <span className="bg-amber-400 text-slate-950 text-[9px] font-mono font-black px-1.5 py-0.2 rounded">
                  PORTAL 01 · STARTING POINT
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white font-serif tracking-tight">
                Super Administrator Portal
              </h1>
            </div>
          </div>

          {/* Quick Metrics & Launch School Main Page CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 text-xs border-r border-slate-800 pr-4 mr-1">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold text-white font-mono">{allTenants.length}</span>
                <span className="text-slate-400 text-[11px]">Schools</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-white font-mono">{allUsers.length}</span>
                <span className="text-slate-400 text-[11px]">Users</span>
              </div>
            </div>

            {/* Direct School Selector & Launch */}
            <div className="flex items-center gap-2">
              <select
                value={currentTenant.id}
                onChange={(e) => switchTenant(e.target.value)}
                className="hidden sm:block bg-slate-800 text-white text-xs font-bold px-2.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                title="Select tenant school context"
              >
                {allTenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <button
                onClick={() => onEnterSchool(currentTenant.id)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer transform hover:scale-[1.02]"
                title={`Launch ${currentTenant.name} School LMS Main Page`}
              >
                <School className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Launch</span>
                <span>{currentTenant.shortName || currentTenant.name} LMS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ========================================================
          2. STARTING POINT HERO ORIENTATION BANNER
          ======================================================== */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>Central Governance Starting Point</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Multi-Institution Tenant Management</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight">
                LMS Institutional Gateway & Super Administrator Console
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                This Super Admin portal is the starting point for EduSmart LMS. Manage registered school campuses, customize crest logos and background colors, configure user accounts, correct spellings, and launch individual school LMS portals below.
              </p>
            </div>

            {/* Quick School Switch Cards */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {allTenants.slice(0, 3).map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => {
                    switchTenant(tenant.id);
                    onEnterSchool(tenant.id);
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-left rounded-xl border border-slate-800 hover:border-amber-400/50 transition-all flex items-center gap-2.5 cursor-pointer shadow-sm group"
                >
                  <div 
                    className="w-3 h-3 rounded-full shrink-0 border border-slate-700"
                    style={{ backgroundColor: tenant.backgroundColor || '#f8fafc' }}
                  />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      {tenant.shortName || tenant.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {tenant.code} · Open →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. MAIN FULL-POWER SUPER ADMIN DASHBOARD
          ======================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <SuperAdminDashboard
          currentUser={superAdminUser}
          onEnterSchoolPortal={(schoolId) => onEnterSchool(schoolId)}
        />
      </main>

      {/* ========================================================
          4. FOOTER
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
