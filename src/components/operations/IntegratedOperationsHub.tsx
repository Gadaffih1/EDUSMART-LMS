import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ShoppingCart, 
  Package, 
  Users, 
  ShieldCheck, 
  Lock, 
  Building2, 
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { User } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { FinancePortalView } from '../finance/FinancePortalView';
import { ProcurementPortalView } from '../procurement/ProcurementPortalView';
import { StoresPortalView } from '../stores/StoresPortalView';
import { HRPayrollPortalView } from '../hr/HRPayrollPortalView';

export type OperationsPortalType = 'finance' | 'procurement' | 'stores' | 'hr_payroll';

interface IntegratedOperationsHubProps {
  currentUser: User;
  initialPortal?: OperationsPortalType;
}

export const IntegratedOperationsHub: React.FC<IntegratedOperationsHubProps> = ({
  currentUser,
  initialPortal
}) => {
  const { currentTenant } = useTenant();

  // Role Scoping Matrix:
  // - finance_officer is strictly scoped to 'finance'
  // - procurement_officer is strictly scoped to 'procurement'
  // - storekeeper is strictly scoped to 'stores'
  // - hr_manager is strictly scoped to 'hr_payroll'
  // - admin & head_teacher have executive oversight across all 4 operational portals
  const isExecutiveRole = ['admin', 'head_teacher', 'deputy_head'].includes(currentUser.role);

  const getRoleScopedPortal = (role: string): OperationsPortalType | null => {
    switch (role) {
      case 'finance_officer':
        return 'finance';
      case 'procurement_officer':
        return 'procurement';
      case 'storekeeper':
        return 'stores';
      case 'hr_manager':
        return 'hr_payroll';
      default:
        return null;
    }
  };

  const roleScopedPortal = getRoleScopedPortal(currentUser.role);

  // If role is strictly scoped, lock to that portal; otherwise allow executive switching
  const defaultPortal: OperationsPortalType = roleScopedPortal || initialPortal || 'finance';
  const [activePortal, setActivePortal] = useState<OperationsPortalType>(defaultPortal);

  useEffect(() => {
    if (roleScopedPortal) {
      setActivePortal(roleScopedPortal);
    } else if (initialPortal) {
      setActivePortal(initialPortal);
    }
  }, [currentUser.role, roleScopedPortal, initialPortal]);

  // Deny access if user is neither an executive nor assigned to an operational role
  if (!isExecutiveRole && !roleScopedPortal) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-7 h-7 text-rose-600" />
        </div>
        <h3 className="text-xl font-black font-serif text-slate-900">Restricted Operational Workspace</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Your role (<strong className="text-slate-900 capitalize">{currentUser.role.replace('_', ' ')}</strong>) 
          does not have clearance to access financial, procurement, stores, or payroll records for 
          <strong className="text-slate-900"> {currentTenant.name}</strong>.
        </p>
        <p className="text-[11px] text-slate-500">
          Operational workspaces are strictly role-scoped to authorized officers (Finance Officer, Procurement Lead, Central Storekeeper, HR Manager) and School Executive Leadership.
        </p>
      </div>
    );
  }

  // Configuration details for each role-scoped workspace
  const WORKSPACE_META = {
    finance: {
      name: 'Finance & Bursary Workspace',
      shortName: 'Finance',
      icon: Wallet,
      officerTitle: 'Finance & Bursary Officer',
      color: 'emerald',
      bgHeader: 'bg-emerald-500/10',
      borderHeader: 'border-emerald-500/20',
      textAccent: 'text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      subtitle: 'Tuition and boarding fee billing, automated M-Pesa Paybill reconciliation, general ledger & departmental budgets.'
    },
    procurement: {
      name: 'Procurement & Purchasing Workspace',
      shortName: 'Procurement',
      icon: ShoppingCart,
      officerTitle: 'Procurement & Purchasing Lead',
      color: 'blue',
      bgHeader: 'bg-blue-500/10',
      borderHeader: 'border-blue-500/20',
      textAccent: 'text-blue-700',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
      subtitle: 'Departmental purchase requisitions, registered suppliers, 3-way matching and Local Purchase Orders (LPO).'
    },
    stores: {
      name: 'Central Stores & Inventory Hub',
      shortName: 'Central Stores',
      icon: Package,
      officerTitle: 'Central Storekeeper & Inventory Lead',
      color: 'amber',
      bgHeader: 'bg-amber-500/10',
      borderHeader: 'border-amber-500/20',
      textAccent: 'text-amber-800',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      subtitle: 'Campus warehouse inventory catalog, Goods Received Notes (GRN), Store Issue Vouchers (SIV) and audit stocktakes.'
    },
    hr_payroll: {
      name: 'HR & Kenyan CBC Payroll Engine',
      shortName: 'HR & Payroll',
      icon: Users,
      officerTitle: 'Human Resources & Payroll Manager',
      color: 'purple',
      bgHeader: 'bg-purple-500/10',
      borderHeader: 'border-purple-500/20',
      textAccent: 'text-purple-700',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
      subtitle: 'Staff master dossiers, statutory deductions (PAYE, NSSF Tier I & II, NHIF/SHIF, Housing Levy 1.5%) and payroll runs.'
    }
  };

  const currentMeta = WORKSPACE_META[activePortal];
  const IconComponent = currentMeta.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 
        ROLE-SCOPED WORKSPACE HEADER / EXECUTIVE SWITCHER
        - If dedicated officer (finance, procurement, stores, hr): Shows strictly their role-scoped workspace header with zero other tabs.
        - If executive (admin, head_teacher): Shows the 4 operational tabs (Finance, Procurement, Stores, HR & Payroll).
          The "Shared Architecture & Starter Package" tab has been completely removed.
      */}
      {isExecutiveRole ? (
        /* Executive Navigation Bar: 4 Operational Portals Only */
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs p-2.5 sm:p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setActivePortal('finance')}
              className={`min-h-[42px] flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activePortal === 'finance'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <span className="truncate">Finance</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePortal('procurement')}
              className={`min-h-[42px] flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activePortal === 'procurement'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="truncate">Procurement</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePortal('stores')}
              className={`min-h-[42px] flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activePortal === 'stores'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm ring-1 ring-amber-300'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span className="truncate">Stores & Inventory</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePortal('hr_payroll')}
              className={`min-h-[42px] flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activePortal === 'hr_payroll'
                  ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">HR & Payroll</span>
            </button>
          </div>

          {/* School Isolation & Executive Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shrink-0">
            <span className="font-semibold text-slate-700 truncate max-w-[180px]">Campus: {currentTenant.name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold uppercase">
              Executive Oversight
            </span>
          </div>
        </div>
      ) : (
        /* Dedicated Officer Role-Scoped Header (Strictly Scoped: No access to other officers' workspaces) */
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${currentMeta.bgHeader} ${currentMeta.textAccent} flex items-center justify-center shrink-0 border ${currentMeta.borderHeader} shadow-inner`}>
              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${currentMeta.badgeBg} inline-flex items-center gap-1`}>
                  <Lock className="w-3 h-3" />
                  <span>Role-Scoped Access</span>
                </span>
                <span className="text-xs text-slate-500 font-mono truncate">
                  {currentMeta.officerTitle}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-serif tracking-tight mt-0.5">
                {currentMeta.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700">{currentTenant.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold uppercase">
                Tenant Isolated
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 
        ROLE-SCOPED PORTAL VIEWS:
        Only the authorized view is displayed based on role-scoping.
      */}
      {activePortal === 'finance' && (
        <FinancePortalView currentUser={currentUser} />
      )}

      {activePortal === 'procurement' && (
        <ProcurementPortalView currentUser={currentUser} />
      )}

      {activePortal === 'stores' && (
        <StoresPortalView currentUser={currentUser} />
      )}

      {activePortal === 'hr_payroll' && (
        <HRPayrollPortalView currentUser={currentUser} />
      )}
    </div>
  );
};
