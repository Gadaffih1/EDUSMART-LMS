import React, { useState } from 'react';
import { 
  Building2, 
  Wallet, 
  ShoppingCart, 
  Package, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  Sliders, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowRight, 
  Lock, 
  Unlock, 
  Eye, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  DollarSign, 
  Search, 
  X,
  Layers,
  ChevronRight,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { usePlatformCustomization } from '../../context/PlatformCustomizationContext';
import { useTenant } from '../../context/TenantContext';
import { STARTER_PACKAGE_DOCS } from '../../data/starterPackageDocs';
import { IntegratedOperationsHub } from '../operations/IntegratedOperationsHub';
import { User } from '../../types';

interface SuperAdminOperationsControlProps {
  onEnterSchoolPortal: (schoolId: string) => void;
  currentUser: User;
}

export const SuperAdminOperationsControl: React.FC<SuperAdminOperationsControlProps> = ({
  onEnterSchoolPortal,
  currentUser
}) => {
  const { 
    customization, 
    updateOperationsPolicy, 
    toggleWorkspace, 
    updateWorkspace,
    updateSchoolOverride 
  } = usePlatformCustomization();
  const { allTenants, currentTenant, switchTenant } = useTenant();

  const [activeSection, setActiveSection] = useState<'matrix' | 'policy' | 'starter_package'>('matrix');
  const [selectedDocId, setSelectedDocId] = useState<string>('schema');
  const [copiedDoc, setCopiedDoc] = useState<boolean>(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Super Admin Live Inspection Modal State
  const [inspectingTenantId, setInspectingTenantId] = useState<string | null>(null);
  const [inspectingPortalTab, setInspectingPortalTab] = useState<'finance' | 'procurement' | 'stores' | 'hr_payroll'>('finance');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const operationsWorkspaces = [
    {
      id: 'finance_officer',
      title: 'Finance & Student Billing',
      shortName: 'Finance',
      icon: Wallet,
      color: '#059669',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      description: 'Tuition and boarding fees, automated M-Pesa reconciliation, general ledger, and vote head budgets.'
    },
    {
      id: 'procurement_officer',
      title: 'Procurement & Purchasing',
      shortName: 'Procurement',
      icon: ShoppingCart,
      color: '#2563eb',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      description: 'Departmental purchase requisitions, registered suppliers, 3-way matching and Local Purchase Orders (LPO).'
    },
    {
      id: 'storekeeper',
      title: 'Central Stores & Inventory',
      shortName: 'Stores',
      icon: Package,
      color: '#d97706',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      description: 'Multi-location campus inventory, Goods Received Notes (GRN), Store Issue Vouchers, and minimum re-order triggers.'
    },
    {
      id: 'hr_manager',
      title: 'HR & Kenyan CBC Payroll Engine',
      shortName: 'HR & Payroll',
      icon: Users,
      color: '#9333ea',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      description: 'Teacher rosters, statutory deductions (PAYE, NSSF Tier I & II, NHIF/SHIF, Housing Levy 1.5%), and monthly payroll runs.'
    }
  ];

  const currentPolicy = customization.operationsPolicy || {
    enableMpesaAutoReconciliation: true,
    procurementApprovalThreshold: 50000,
    strictBudgetEnforcement: true,
    requireThreeWayMatchingForPayment: true,
    lockDisbursedPayrollRuns: true,
    autoReorderAlertsEnabled: true,
    allowDepartmentalRequisitions: true
  };

  const handleCopyDoc = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedDoc(true);
    triggerToast('Copied file contents to clipboard');
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  const handleDownloadDoc = (docName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded ${docName}`);
  };

  const handleEnableAllOperationsGlobally = () => {
    operationsWorkspaces.forEach(op => {
      const ws = customization.workspaces.find(w => w.id === op.id);
      if (ws && !ws.enabled) {
        toggleWorkspace(op.id);
      }
    });

    // Also clear any school overrides that disabled operations
    allTenants.forEach(tenant => {
      const override = customization.schoolOverrides[tenant.id] || {};
      const disabledWs = override.disabledWorkspaceIds || [];
      const opIds = ['finance_officer', 'procurement_officer', 'storekeeper', 'hr_manager'];
      const filteredDisabled = disabledWs.filter(id => !opIds.includes(id));
      if (filteredDisabled.length !== disabledWs.length) {
        updateSchoolOverride(tenant.id, { disabledWorkspaceIds: filteredDisabled });
      }
    });

    triggerToast('All 4 Operations Workspaces enabled across all campuses');
  };

  const handleToggleSchoolWorkspace = (schoolId: string, workspaceId: string) => {
    const override = customization.schoolOverrides[schoolId] || {};
    const disabledWs = override.disabledWorkspaceIds || [];
    const isCurrentlyDisabled = disabledWs.includes(workspaceId);

    const newDisabled = isCurrentlyDisabled
      ? disabledWs.filter(id => id !== workspaceId)
      : [...disabledWs, workspaceId];

    updateSchoolOverride(schoolId, { disabledWorkspaceIds: newDisabled });
    triggerToast(`${workspaceId.replace('_', ' ')} ${isCurrentlyDisabled ? 'enabled' : 'restricted'} for campus`);
  };

  const filteredTenants = allTenants.filter(t => 
    t.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(schoolSearchQuery.toLowerCase())
  );

  const inspectingTenant = allTenants.find(t => t.id === inspectingTenantId) || currentTenant;

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-amber-300 border border-amber-400 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Context & Architectural Alignment Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/60 rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Super Admin Full Governance Control</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">EduSmart Target Architecture</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight">
              Integrated Finance, Procurement, Stores & HR/Payroll Portals
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Safely extended inside the working EduSmart LMS. Preserves existing student & parent portals, 
              tenant-school isolation, and employee dossiers with centralized multi-campus oversight.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleEnableAllOperationsGlobally}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enable All in All Schools</span>
            </button>
            <button
              onClick={() => {
                setInspectingTenantId(currentTenant.id);
                setInspectingPortalTab('finance');
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Inspect Live Hub</span>
            </button>
          </div>
        </div>

        {/* 4 Architectural Core Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Finance & Billing</div>
              <div className="text-sm sm:text-base font-black text-white">Full Active</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">3-Way Procurement</div>
              <div className="text-sm sm:text-base font-black text-white">Enforced</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Stores & Stock</div>
              <div className="text-sm sm:text-base font-black text-white">Multi-Location</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Kenyan CBC Payroll</div>
              <div className="text-sm sm:text-base font-black text-white">PAYE / NSSF / SHIF</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSection('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'matrix'
              ? 'bg-amber-400 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenant School Deployment Matrix</span>
          <span className="text-[10px] bg-slate-950/40 px-1.5 py-0.5 rounded font-mono">
            {allTenants.length} Campuses
          </span>
        </button>

        <button
          onClick={() => setActiveSection('policy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'policy'
              ? 'bg-amber-400 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Platform Governance & Policy Controls</span>
        </button>

        <button
          onClick={() => setActiveSection('starter_package')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'starter_package'
              ? 'bg-amber-400 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Starter Package & Schema Asset Viewer</span>
          <span className="text-[10px] bg-slate-950/40 px-1.5 py-0.5 rounded font-mono">
            5 Files Ready
          </span>
        </button>
      </div>

      {/* SECTION 1: TENANT DEPLOYMENT MATRIX */}
      {activeSection === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white font-serif">Campus-by-Campus Module Allocation</h3>
                <p className="text-xs text-slate-400">
                  Toggle individual operations portals per school, or click "Inspect" to view real ledgers, stock, and payroll under Super Admin authority.
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search campuses..."
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-950 text-white text-xs rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 w-60"
                />
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider bg-slate-950/50">
                    <th className="py-3 px-4">Campus / Tenant</th>
                    <th className="py-3 px-4 text-center">Finance Portal</th>
                    <th className="py-3 px-4 text-center">Procurement Portal</th>
                    <th className="py-3 px-4 text-center">Stores & Inventory</th>
                    <th className="py-3 px-4 text-center">HR & CBC Payroll</th>
                    <th className="py-3 px-4 text-right">Super Admin Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTenants.map((tenant) => {
                    const override = customization.schoolOverrides[tenant.id] || {};
                    const disabledWs = override.disabledWorkspaceIds || [];

                    const isFinActive = !disabledWs.includes('finance_officer');
                    const isProcActive = !disabledWs.includes('procurement_officer');
                    const isStoreActive = !disabledWs.includes('storekeeper');
                    const isHrActive = !disabledWs.includes('hr_manager');

                    const allOpsActive = isFinActive && isProcActive && isStoreActive && isHrActive;

                    return (
                      <tr key={tenant.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-amber-400 border border-slate-700">
                              {tenant.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{tenant.name}</span>
                                {allOpsActive && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                                    Full Suite
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ID: {tenant.id} &bull; Code: {tenant.code} &bull; Principal: {tenant.principalName || 'Principal Desk'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Finance Toggle Chip */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleSchoolWorkspace(tenant.id, 'finance_officer')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              isFinActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                            }`}
                          >
                            {isFinActive ? 'Active' : 'Restricted'}
                          </button>
                        </td>

                        {/* Procurement Toggle Chip */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleSchoolWorkspace(tenant.id, 'procurement_officer')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              isProcActive
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                            }`}
                          >
                            {isProcActive ? 'Active' : 'Restricted'}
                          </button>
                        </td>

                        {/* Stores Toggle Chip */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleSchoolWorkspace(tenant.id, 'storekeeper')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              isStoreActive
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                            }`}
                          >
                            {isStoreActive ? 'Active' : 'Restricted'}
                          </button>
                        </td>

                        {/* HR/Payroll Toggle Chip */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleSchoolWorkspace(tenant.id, 'hr_manager')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              isHrActive
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                            }`}
                          >
                            {isHrActive ? 'Active' : 'Restricted'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setInspectingTenantId(tenant.id);
                                setInspectingPortalTab('finance');
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Inspect this campus's operations hub directly as Super Admin"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => {
                                switchTenant(tenant.id);
                                onEnterSchoolPortal(tenant.id);
                              }}
                              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Switch into this school campus LMS"
                            >
                              <span>Enter</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PLATFORM OPERATIONS GOVERNANCE POLICIES */}
      {activeSection === 'policy' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white font-serif flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Executive Operations Governance Directives</span>
              </h3>
              <p className="text-xs text-slate-400">
                Super Admin rules enforced across all tenant schools to prevent financial discrepancies, fraud, and unapproved spending.
              </p>
            </div>

            <button
              onClick={() => {
                updateOperationsPolicy({
                  enableMpesaAutoReconciliation: true,
                  procurementApprovalThreshold: 50000,
                  strictBudgetEnforcement: true,
                  requireThreeWayMatchingForPayment: true,
                  lockDisbursedPayrollRuns: true,
                  autoReorderAlertsEnabled: true,
                  allowDepartmentalRequisitions: true
                });
                triggerToast('Reset operations governance to recommended defaults');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Standard Directives</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Policy 1: Automated M-Pesa Reconciliation */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>M-Pesa Auto-Reconciliation</span>
                </div>
                <button
                  onClick={() => {
                    updateOperationsPolicy({ enableMpesaAutoReconciliation: !currentPolicy.enableMpesaAutoReconciliation });
                    triggerToast(`M-Pesa Auto Reconciliation ${!currentPolicy.enableMpesaAutoReconciliation ? 'Enforced' : 'Disabled'}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPolicy.enableMpesaAutoReconciliation
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentPolicy.enableMpesaAutoReconciliation ? 'Active' : 'Disabled'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automatically matches IPN callbacks against student admission numbers and generates digital receipts instantly.
              </p>
            </div>

            {/* Policy 2: Head Teacher Procurement Clearance Threshold */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>Head Teacher Threshold</span>
                </div>
                <span className="font-mono text-xs text-amber-300 font-bold">
                  KES {currentPolicy.procurementApprovalThreshold.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Requisitions exceeding this value require mandatory Head Teacher signature before Local Purchase Order issuance.
              </p>
              <div className="flex items-center gap-2 pt-1">
                {[25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      updateOperationsPolicy({ procurementApprovalThreshold: amt });
                      triggerToast(`Threshold set to KES ${amt.toLocaleString()}`);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      currentPolicy.procurementApprovalThreshold === amt
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    KES {amt / 1000}k
                  </button>
                ))}
              </div>
            </div>

            {/* Policy 3: Strict Budget Ceiling Enforcement */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-red-400" />
                  <span>Strict Budget Ceiling</span>
                </div>
                <button
                  onClick={() => {
                    updateOperationsPolicy({ strictBudgetEnforcement: !currentPolicy.strictBudgetEnforcement });
                    triggerToast(`Budget ceiling enforcement ${!currentPolicy.strictBudgetEnforcement ? 'Active' : 'Bypassed'}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPolicy.strictBudgetEnforcement
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentPolicy.strictBudgetEnforcement ? 'Enforced' : 'Relaxed'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Prevents school departments from approving requisitions if the corresponding vote head has depleted funds.
              </p>
            </div>

            {/* Policy 4: 3-Way Matching for Disbursements */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>3-Way Matching Gate</span>
                </div>
                <button
                  onClick={() => {
                    updateOperationsPolicy({ requireThreeWayMatchingForPayment: !currentPolicy.requireThreeWayMatchingForPayment });
                    triggerToast(`3-Way Matching ${!currentPolicy.requireThreeWayMatchingForPayment ? 'Mandated' : 'Optional'}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPolicy.requireThreeWayMatchingForPayment
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentPolicy.requireThreeWayMatchingForPayment ? 'Mandatory' : 'Optional'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Requires automatic cross-check between Requisition, Local Purchase Order (LPO), and Goods Received Note (GRN).
              </p>
            </div>

            {/* Policy 5: Disbursed Payroll Audit Freeze */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Payroll Audit Freeze</span>
                </div>
                <button
                  onClick={() => {
                    updateOperationsPolicy({ lockDisbursedPayrollRuns: !currentPolicy.lockDisbursedPayrollRuns });
                    triggerToast(`Historical Payroll Freeze ${!currentPolicy.lockDisbursedPayrollRuns ? 'Active' : 'Editable'}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPolicy.lockDisbursedPayrollRuns
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentPolicy.lockDisbursedPayrollRuns ? 'Locked' : 'Open'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Freezes approved monthly payroll runs to ensure immutable records for KRA, NSSF, and statutory inspections.
              </p>
            </div>

            {/* Policy 6: Central Stores Auto-Reorder Alerts */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Stores Re-Order Alerts</span>
                </div>
                <button
                  onClick={() => {
                    updateOperationsPolicy({ autoReorderAlertsEnabled: !currentPolicy.autoReorderAlertsEnabled });
                    triggerToast(`Auto Reorder Alerts ${!currentPolicy.autoReorderAlertsEnabled ? 'Active' : 'Muted'}`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPolicy.autoReorderAlertsEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentPolicy.autoReorderAlertsEnabled ? 'Active' : 'Muted'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sends automated notifications to Bursars and Storekeepers whenever an inventory bin drops below safety minimums.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: STARTER IMPLEMENTATION PACKAGE & ARCHITECTURE ASSETS */}
      {activeSection === 'starter_package' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/30">
                  Starter Package Architecture Assets
                </span>
                <span className="text-xs text-slate-400">PostgreSQL Schema & API Design</span>
              </div>
              <h3 className="text-base font-black text-white font-serif mt-1">
                EduSmart Integrated Portals Implementation Bundle
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyDoc(STARTER_PACKAGE_DOCS[selectedDocId].content)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDoc ? 'Copied' : 'Copy File'}</span>
              </button>
              <button
                onClick={() => handleDownloadDoc(STARTER_PACKAGE_DOCS[selectedDocId].name, STARTER_PACKAGE_DOCS[selectedDocId].content)}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {STARTER_PACKAGE_DOCS[selectedDocId].name}</span>
              </button>
            </div>
          </div>

          {/* Doc Tabs */}
          <div className="flex flex-wrap gap-2">
            {Object.values(STARTER_PACKAGE_DOCS).map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  selectedDocId === doc.id
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{doc.name}</span>
                <span className="text-[10px] font-mono opacity-80 bg-slate-900/50 px-1 rounded">
                  {doc.badge}
                </span>
              </button>
            ))}
          </div>

          {/* File Meta Info Banner */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-white text-sm">{STARTER_PACKAGE_DOCS[selectedDocId].title}</div>
              <div className="text-slate-400 text-xs">{STARTER_PACKAGE_DOCS[selectedDocId].description}</div>
            </div>
            <div className="text-amber-300 font-mono text-[11px] shrink-0">
              Format: {STARTER_PACKAGE_DOCS[selectedDocId].language.toUpperCase()} &bull; Read-Only Starter Contract
            </div>
          </div>

          {/* Code Viewer Container */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-x-auto max-h-[500px] shadow-inner font-mono text-xs leading-relaxed text-slate-200">
            <pre>
              <code>{STARTER_PACKAGE_DOCS[selectedDocId].content}</code>
            </pre>
          </div>
        </div>
      )}

      {/* SUPER ADMIN LIVE INSPECTION MODAL */}
      {inspectingTenantId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl border border-slate-700 w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold border border-amber-400/30">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                      SUPER ADMIN INSPECTION MODE
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Tenant ID: {inspectingTenant.id}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white font-serif">
                    Live Operations Hub &bull; {inspectingTenant.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    switchTenant(inspectingTenant.id);
                    onEnterSchoolPortal(inspectingTenant.id);
                  }}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Switch Full Tenant Session</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setInspectingTenantId(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded IntegratedOperationsHub */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
              <IntegratedOperationsHub 
                currentUser={currentUser}
                initialPortal={inspectingPortalTab}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
