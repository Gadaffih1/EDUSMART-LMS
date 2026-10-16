import React, { useState } from 'react';
import { 
  Wallet, 
  ShoppingCart, 
  Package, 
  Users, 
  ShieldCheck, 
  Layers, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  Activity, 
  Lock, 
  ArrowRight,
  Database,
  Building2,
  Sliders
} from 'lucide-react';
import { FinancePortalView } from '../finance/FinancePortalView';
import { ProcurementPortalView } from '../procurement/ProcurementPortalView';
import { StoresPortalView } from '../stores/StoresPortalView';
import { HRPayrollPortalView } from '../hr/HRPayrollPortalView';
import { OperationsStorage } from '../../utils/operationsStorage';
import { User } from '../../types';
import { useTenant } from '../../context/TenantContext';

interface IntegratedOperationsHubProps {
  currentUser: User;
  initialPortal?: 'finance' | 'procurement' | 'stores' | 'hr_payroll' | 'architecture';
}

export const IntegratedOperationsHub: React.FC<IntegratedOperationsHubProps> = ({
  currentUser,
  initialPortal
}) => {
  const { currentTenant } = useTenant();

  // Determine initial portal based on role or prop
  const defaultPortal = initialPortal || (
    currentUser.role === 'finance_officer' ? 'finance' :
    currentUser.role === 'procurement_officer' ? 'procurement' :
    currentUser.role === 'storekeeper' ? 'stores' :
    currentUser.role === 'hr_manager' ? 'hr_payroll' : 'finance'
  );

  const [activePortal, setActivePortal] = useState<'finance' | 'procurement' | 'stores' | 'hr_payroll' | 'architecture'>(defaultPortal);
  const [selectedDocFile, setSelectedDocFile] = useState<'sql' | 'api' | 'plan' | 'tests' | 'readme'>('sql');
  const [copiedCode, setCopiedCode] = useState(false);

  const auditLogs = OperationsStorage.getOperationsAuditLogs(currentTenant.id);

  const SQL_SNIPPET = `-- EduSmart LMS Core Schema (001_core_schema.sql)
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grade_level VARCHAR(64) NOT NULL,
    category VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS fee_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    req_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    department VARCHAR(128) NOT NULL,
    total_estimated_cost NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Draft'
);

CREATE TABLE IF NOT EXISTS store_inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reorder_level NUMERIC(10, 2) NOT NULL DEFAULT 10.00
);

CREATE TABLE IF NOT EXISTS hr_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    tsc_number VARCHAR(64),
    kra_pin VARCHAR(32) NOT NULL,
    basic_salary NUMERIC(12, 2) NOT NULL,
    gross_pay NUMERIC(12, 2) NOT NULL
);`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SQL_SNIPPET);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadZip = () => {
    // Generate text blob for starter package
    const element = document.createElement("a");
    const file = new Blob([
      `=== EDUSMART INTEGRATED PORTALS STARTER PACKAGE ===\n\n` +
      `Campus: ${currentTenant.name} (${currentTenant.code})\n\n` +
      `FILES INCLUDED:\n` +
      `- 001_core_schema.sql (Included in /docs/)\n` +
      `- API_CONTRACT.md (Included in /docs/)\n` +
      `- IMPLEMENTATION_PLAN.md (Included in /docs/)\n` +
      `- ACCEPTANCE_TESTS.md (Included in /docs/)\n` +
      `- README.md (Included in /docs/)\n\n` +
      SQL_SNIPPET
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `edusmart_integrated_portals_starter_${currentTenant.code.toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* MAIN TOP NAVIGATION BAR */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-2 sm:p-3 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => setActivePortal('finance')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activePortal === 'finance'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>1. Finance Portal</span>
          </button>

          <button
            onClick={() => setActivePortal('procurement')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activePortal === 'procurement'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>2. Procurement Portal</span>
          </button>

          <button
            onClick={() => setActivePortal('stores')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activePortal === 'stores'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 ring-2 ring-amber-300'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>3. Stores & Inventory</span>
          </button>

          <button
            onClick={() => setActivePortal('hr_payroll')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activePortal === 'hr_payroll'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>4. HR & Payroll</span>
          </button>

          <button
            onClick={() => setActivePortal('architecture')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activePortal === 'architecture'
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-700'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Shared Architecture & Starter Package</span>
          </button>
        </div>

        {/* School isolation pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Campus: {currentTenant.name}</span>
          <span className="text-[10px] font-mono px-1 rounded bg-slate-200 text-slate-800 font-bold">Isolated</span>
        </div>
      </div>

      {/* PORTAL CONTENT RENDERING */}
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

      {/* TAB 5: SHARED ARCHITECTURE & STARTER PACKAGE (Strictly matching ChatGPT Chat) */}
      {activePortal === 'architecture' && (
        <div className="space-y-6">
          {/* Target Architecture Diagram Card */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black font-serif tracking-tight text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-400" />
                  <span>Target Integration Architecture</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Built inside the working EduSmart LMS, preserving existing students, parents, teachers, and multi-tenant campuses.
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Design Verified
              </span>
            </div>

            {/* Architecture Flow Box as per Chat Section 1 */}
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* Level 1: EduSmart LMS */}
              <div className="p-4 rounded-2xl bg-[#102B46] border border-teal-500/30 text-center space-y-1 shadow-lg">
                <div className="text-base font-bold text-white font-serif">EduSmart LMS</div>
                <div className="text-xs text-[#D8E7F0]">
                  Existing authentication • Existing tenant schools • Existing student and parent portals
                </div>
              </div>

              {/* Arrow */}
              <div className="text-center text-teal-400 font-black text-xl leading-none">
                ↓
              </div>

              {/* Level 2: Shared Integration & Access-Control Layer */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-center space-y-1">
                <div className="text-sm font-bold text-white">Shared Integration and Access-Control Layer</div>
                <div className="text-xs text-slate-400">
                  Tenant isolation • Role permissions • REST APIs • Multi-level approvals • Audit logs • Real-time notifications
                </div>
              </div>

              {/* Arrow */}
              <div className="text-center text-teal-400 font-black text-xl leading-none">
                ↓
              </div>

              {/* Level 3: The 4 Portals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#E6F4F1] text-slate-900 border border-teal-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[#087F70]">
                    <Wallet className="w-4 h-4 text-[#087F70]" />
                    <span>Finance</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Billing, payments, ledgers, budgets and financial reporting
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#E9EFFB] text-slate-900 border border-blue-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[#3159A8]">
                    <ShoppingCart className="w-4 h-4 text-[#3159A8]" />
                    <span>Procurement</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Requests, suppliers, quotations, LPOs and 3-way matching
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF1DB] text-slate-900 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[#9A5A08]">
                    <Package className="w-4 h-4 text-[#9A5A08]" />
                    <span>Stores</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Inventory, receipts (GRN), issues (SIV) and stocktakes
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F0E8FA] text-slate-900 border border-purple-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[#7040A0]">
                    <Users className="w-4 h-4 text-[#7040A0]" />
                    <span>HR & Payroll</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Employee records, statutory deductions, payroll approvals and journals
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div className="text-center text-teal-400 font-black text-xl leading-none">
                ↓
              </div>

              {/* Level 4: Connected Existing Records */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-center space-y-1">
                <div className="text-sm font-bold text-white">Connected Existing Records</div>
                <div className="text-xs text-slate-400">
                  Students • Parent-child links • Employee records • School terms • Class structures
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Implementation Starter Package */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    Implementation Starter Package & Documentation
                  </h3>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Starter Package Created
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  PostgreSQL additive schema, API contracts, implementation roadmap, and tenant isolation acceptance tests.
                </p>
              </div>

              <button
                onClick={handleDownloadZip}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer shrink-0 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Starter Package</span>
              </button>
            </div>

            {/* Document Selector Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'sql', label: '001_core_schema.sql', icon: Database },
                { id: 'api', label: 'API_CONTRACT.md', icon: FileText },
                { id: 'plan', label: 'IMPLEMENTATION_PLAN.md', icon: Activity },
                { id: 'tests', label: 'ACCEPTANCE_TESTS.md', icon: ShieldCheck },
                { id: 'readme', label: 'README.md', icon: FileText }
              ].map(doc => {
                const Icon = doc.icon;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocFile(doc.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedDocFile === doc.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{doc.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Code / Doc Viewer */}
            <div className="relative rounded-2xl bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-x-auto max-h-96 border border-slate-800">
              <button
                onClick={handleCopyCode}
                className="absolute right-4 top-4 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-300" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <pre className="text-[11px] leading-relaxed text-slate-300">
                {selectedDocFile === 'sql' ? SQL_SNIPPET :
                 selectedDocFile === 'api' ? `# EduSmart LMS: Integrated Portals API Contract\n\nAuthorization: Bearer <TOKEN>\nX-Tenant-ID: <TENANT_ID>\n\nGET /api/finance/fee-structure\nGET /api/finance/invoices\nPOST /api/finance/payments\nGET /api/procurement/requisitions\nPOST /api/procurement/purchase-orders\nGET /api/stores/inventory\nPOST /api/stores/grn\nGET /api/hr/employees\nPOST /api/hr/payroll/run` :
                 selectedDocFile === 'plan' ? `# Implementation Plan\n\nPhase 1: Shared Integration Layer & Multi-Tenant Access Control\nPhase 2: Finance & Student Billing Portal\nPhase 3: Procurement & Stores 3-Way Matching\nPhase 4: Kenyan CBC Statutory HR & Payroll Engine\nPhase 5: End-to-End Acceptance Tests` :
                 selectedDocFile === 'tests' ? `# Acceptance Tests\n\nSuite 1: Tenant Isolation Verification\nSuite 2: Financial Integrity & 3-Way Matching\nSuite 3: Kenyan Statutory Payroll (PAYE, NSSF, SHIF, Housing Levy)\nSuite 4: Role-Based Approval Permissions & Immutability` :
                 `# README.md\n\nEduSmart LMS: Integrated Portals Starter Package.\nAdditive database schema, API contracts, and tenant-scoped business logic.`}
              </pre>
            </div>
          </div>

          {/* Section 3: Live Operations Audit Trail */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Live Multi-Module Audit Trail ({auditLogs.length} Events)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                Campus: {currentTenant.name}
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                        log.module === 'Finance' ? 'bg-emerald-100 text-emerald-800' :
                        log.module === 'Procurement' ? 'bg-blue-100 text-blue-800' :
                        log.module === 'Stores' ? 'bg-amber-100 text-amber-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {log.module}
                      </span>
                      <strong className="text-slate-900">{log.actionType}</strong>
                    </div>
                    <p className="text-slate-600">{log.description}</p>
                  </div>

                  {log.amountImpacted && (
                    <div className="font-mono font-bold text-slate-900 shrink-0">
                      KES {log.amountImpacted.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
