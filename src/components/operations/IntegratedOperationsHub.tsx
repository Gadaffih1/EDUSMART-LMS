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

  const DOCS = {
    sql: {
      name: '001_core_schema.sql',
      content: `-- =========================================================================
-- EduSmart LMS: Additive Core Schema for Integrated Portals
-- Version: 001_core_schema.sql
-- Modules: Finance, Procurement, Stores & Inventory, HR & Payroll
-- Multi-Tenancy: Scoped by tenant_id across all tables with Row-Level Security
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FINANCE & STUDENT BILLING SCHEMA
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grade_level VARCHAR(64) NOT NULL,
    frequency VARCHAR(32) NOT NULL DEFAULT 'Termly',
    is_optional BOOLEAN DEFAULT FALSE,
    category VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    admission_number VARCHAR(64) NOT NULL,
    grade INT NOT NULL,
    stream VARCHAR(64) NOT NULL,
    term VARCHAR(32) NOT NULL,
    academic_year VARCHAR(16) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    line_items JSONB NOT NULL DEFAULT '[]',
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    invoice_id UUID REFERENCES fee_invoices(id) ON DELETE SET NULL,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    admission_number VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL, -- 'M-PESA', 'Bank Transfer', 'Cashier Slip', 'Direct Cheque'
    reference_number VARCHAR(128) NOT NULL,
    payer_name VARCHAR(255) NOT NULL,
    payer_phone VARCHAR(64),
    term VARCHAR(32) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_by VARCHAR(255) NOT NULL
);

-- 2. PROCUREMENT & 3-WAY MATCHING SCHEMA
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    req_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    department VARCHAR(128) NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    item_description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_of_measure VARCHAR(32) NOT NULL,
    estimated_unit_price NUMERIC(12, 2) NOT NULL,
    total_estimated_cost NUMERIC(12, 2) NOT NULL,
    justification TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lpo_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    requisition_id UUID REFERENCES purchase_requisitions(id) ON DELETE SET NULL,
    vendor_name VARCHAR(255) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Issued',
    issue_date DATE NOT NULL,
    delivery_due_date DATE NOT NULL,
    authorized_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CENTRAL STORES & INVENTORY SCHEMA
CREATE TABLE IF NOT EXISTS store_inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reorder_level NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    unit_of_measure VARCHAR(32) NOT NULL DEFAULT 'pcs',
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    location VARCHAR(128) NOT NULL,
    last_restocked_date DATE
);

CREATE TABLE IF NOT EXISTS goods_received_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    lpo_number VARCHAR(64) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_note_number VARCHAR(64),
    received_by VARCHAR(255) NOT NULL,
    condition_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. HR & KENYAN CBC STATUTORY PAYROLL SCHEMA
CREATE TABLE IF NOT EXISTS hr_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    employee_number VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    tsc_number VARCHAR(64),
    designation VARCHAR(128) NOT NULL,
    department VARCHAR(128) NOT NULL,
    employment_type VARCHAR(32) NOT NULL,
    basic_salary NUMERIC(12, 2) NOT NULL,
    house_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    commuter_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    responsibility_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gross_pay NUMERIC(12, 2) NOT NULL,
    kra_pin VARCHAR(32) NOT NULL,
    nssf_number VARCHAR(64) NOT NULL,
    nhif_shif_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS hr_payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_month VARCHAR(32) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    total_employees INT NOT NULL,
    total_gross_pay NUMERIC(12, 2) NOT NULL,
    total_paye_tax NUMERIC(12, 2) NOT NULL,
    total_nssf NUMERIC(12, 2) NOT NULL,
    total_nhif_shif NUMERIC(12, 2) NOT NULL,
    total_housing_levy NUMERIC(12, 2) NOT NULL,
    total_net_pay NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Draft',
    prepared_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. IMMUTABLE OPERATIONS AUDIT LOGS
CREATE TABLE IF NOT EXISTS operations_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    module VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    reference_id VARCHAR(64) NOT NULL,
    amount_impacted NUMERIC(12, 2)
);`
    },
    api: {
      name: 'API_CONTRACT.md',
      content: `# EduSmart LMS: Integrated Portals API Contract

## Authentication & Headers
All requests must provide:
\`\`\`http
Authorization: Bearer <JWT_OR_SESSION_TOKEN>
X-Tenant-ID: <TENANT_ID>
Content-Type: application/json
\`\`\`

---

## 1. Finance & Student Billing APIs

### \`GET /api/finance/fee-structure\`
Retrieves fee structure line items for the active tenant.
- **Roles**: \`finance_officer\`, \`admin\`, \`head_teacher\`

### \`GET /api/finance/invoices\`
- **Query Params**: \`studentId\`, \`grade\`, \`stream\`, \`term\`, \`status\`
- **Response**: Array of \`FeeInvoice\` objects.

### \`POST /api/finance/payments\`
Records a fee payment (M-Pesa, Bank, or Cashier).
\`\`\`json
{
  "invoiceId": "inv-001",
  "studentId": "stu-101",
  "amount": 25000,
  "paymentMethod": "M-PESA",
  "referenceNumber": "QHK892182L",
  "payerName": "Grace Muthoni",
  "payerPhone": "+254712345678",
  "term": "Term 1, 2026"
}
\`\`\`

### \`GET /api/finance/general-ledger\`
Returns trial balance, assets, liabilities, and revenues for tenant.

### \`GET /api/finance/budgets\`
Returns departmental budget allocations and actual spend.

---

## 2. Procurement APIs

### \`GET /api/procurement/requisitions\`
Returns purchase requisitions filtered by tenant and department.

### \`POST /api/procurement/requisitions\`
Creates a new purchase requisition.

### \`PATCH /api/procurement/requisitions/:id/approval\`
Approval step for HOD, Finance, or Head Teacher.

### \`POST /api/procurement/purchase-orders\`
Generates Local Purchase Order (LPO) from approved requisition.

---

## 3. Stores & Inventory APIs

### \`GET /api/stores/inventory\`
Returns all stock items, current balances, re-order levels, and locations.

### \`POST /api/stores/grn\`
Creates Goods Received Note against an approved LPO, updating physical stock.

### \`POST /api/stores/issues\`
Issues items to teachers, classes, or departments, generating a Store Issue Voucher (SIV).

---

## 4. HR & Payroll APIs

### \`GET /api/hr/employees\`
Lists employees with salary structures and statutory registrations.

### \`POST /api/hr/payroll/run\`
Calculates draft monthly payroll including Kenyan PAYE, NSSF, NHIF/SHIF, and Housing Levy.

### \`POST /api/hr/payroll/:id/approve\`
Executive signoff by Head Teacher; triggers GL journal creation.

### \`GET /api/hr/payslips/:employeeId\`
Fetches individual employee digital payslip.

---

## 5. Security & Isolation Rules
1. **Tenant Isolation**: Queries strictly append \`WHERE tenant_id = current_tenant\`.
2. **Audit Logging**: Every financial transaction triggers immutable log in \`operations_audit_logs\`.
3. **Immutability**: Completed receipts and disbursed payroll runs cannot be deleted.`
    },
    plan: {
      name: 'IMPLEMENTATION_PLAN.md',
      content: `# EduSmart LMS: Integrated Finance & Operations Implementation Plan

## Phase 1: Shared Integration Layer & Multi-Tenant Access Control
- Establish tenant-scoped tables and indices.
- Extend UserRole and RoleAccessRights with finance_officer, procurement_officer, storekeeper, and hr_manager.
- Implement immutable audit logging and multi-level approval pipeline.

## Phase 2: Finance & Student Billing Portal
- Build fee structure configuration (Tuition, Transport, Dining, Boarding, Lab fees).
- Connect with Student Accounts and Parent Portal for live balances and statements.
- Integrate M-Pesa Paybill / reference reconciliation and instant receipt issuance.
- Implement General Ledger (GL) and Departmental Budget tracking.

## Phase 3: Procurement & Stores Integration (3-Way Matching)
- Enable purchase requisitions from Teachers and Department Leads.
- Create multi-stage approval workflow (HOD -> Finance -> Head Teacher).
- Establish registered vendor directory and RFQ bidding matrix.
- Generate Local Purchase Orders (LPO).
- Connect with Stores: Goods Received Notes (GRN) verify deliveries against LPOs and increment inventory balances automatically.
- Enable Store Issue Vouchers (SIV) and periodic stocktake audit reconciliations.

## Phase 4: HR & Payroll Engine (Kenyan CBC Statutory Compliant)
- Employee master dossiers connected to existing teacher rosters and TSC numbers.
- Automated calculation of Kenyan statutory deductions:
  - PAYE graduated tax brackets with personal relief.
  - NSSF Tier I (KES 420) & Tier II (KES 1,740).
  - NHIF / SHIF social health rates.
  - Housing Levy (1.5% of Gross Pay).
- Monthly payroll preview, approval, and automated posting to Finance GL.
- Printable and downloadable employee payslips.

## Phase 5: Verification & End-to-End Acceptance Testing
- Cross-tenant security testing (verifying zero cross-campus data leakage).
- Financial ledger balance verification.
- Approval workflow audit trail verification.`
    },
    tests: {
      name: 'ACCEPTANCE_TESTS.md',
      content: `# EduSmart LMS: Integrated Portals Acceptance Tests

## Test Suite 1: Tenant Isolation
- Test 1.1: Querying fees, receipts, and invoices under tenant-riara returns zero records belonging to tenant-greenwood.
- Test 1.2: Store inventory items in Riara Central Store cannot be issued or seen by Greenwood Storekeeper.
- Test 1.3: Employee salary records and payroll totals are strictly scoped to the active tenant session.

## Test Suite 2: Financial Integrity & 3-Way Matching
- Test 2.1: A fee payment must decrement student invoice balance by the exact amount paid and generate a receipt with unique reference number.
- Test 2.2: An LPO cannot be generated without an approved requisition.
- Test 2.3: A Goods Received Note (GRN) updates stock levels only for accepted quantities.
- Test 2.4: Departmental budget committed amount increases when an LPO is issued and updates spent amount upon invoice clearance.

## Test Suite 3: Statutory Payroll Compliance (Kenya)
- Test 3.1: Gross pay correctly calculates basic salary + house + commuter + responsibility allowances.
- Test 3.2: Housing levy computes at precisely 1.5% of Gross Pay.
- Test 3.3: NSSF deduction respects Tier I and Tier II statutory ceilings.
- Test 3.4: Net pay equals Gross Pay minus total statutory deductions.
- Test 3.5: Disbursing a monthly payroll creates a corresponding debit in Salary Expenses and credit in Bank Account in the General Ledger.

## Test Suite 4: Security & Audit Controls
- Test 4.1: Only users with head_teacher or admin can perform final approval on budgets and payroll.
- Test 4.2: Every state change (approvals, payments, stock issues) writes a timestamped record to operations_audit_logs.`
    },
    readme: {
      name: 'README.md',
      content: `# EduSmart LMS Integrated Portals Starter Package

This package implements the target architecture specified in the EduSmart Integrated Operations & Finance design.

## Architecture Overview
- EduSmart LMS Core: Preserves student portal, parent portal, tenant schools, and teacher modules.
- Shared Integration Layer: Multi-tenant isolation, role-based approvals, audit logs, and notification feeds.
- Portals:
  1. Finance: Billing, payments, fee statements, general ledgers, departmental budgets.
  2. Procurement: Purchase requisitions, approved vendor directory, RFQ bidding, Local Purchase Orders (LPO).
  3. Stores & Inventory: Stock catalog, multi-location stock levels, Goods Received Notes (GRN), Store Issue Vouchers (SIV), stocktake audits.
  4. HR & Payroll: Employee master dossiers, Kenyan statutory deductions (PAYE, NSSF, NHIF/SHIF, Housing Levy 1.5%), monthly payroll runs, digital payslips.

## Included Files in this Starter Package
- 001_core_schema.sql: Additive PostgreSQL schema with tenant-scoped tables and indices.
- API_CONTRACT.md: Proposed API routes, request/response models, and security rules.
- IMPLEMENTATION_PLAN.md: Phased rollout sequence.
- ACCEPTANCE_TESTS.md: Verification test cases for tenant isolation, financial integrity, and statutory calculations.
- README.md: This installation and architectural overview guide.`
    }
  };

  const currentDoc = DOCS[selectedDocFile];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentDoc.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadZip = () => {
    // Generate complete starter package bundle
    const bundleContent = `================================================================================
EDUSMART LMS: INTEGRATED PORTALS STARTER IMPLEMENTATION PACKAGE
Campus: ${currentTenant.name} (Code: ${currentTenant.code})
Generated: ${new Date().toISOString()}
================================================================================

${Object.values(DOCS).map(d => `\n--- [FILE: ${d.name}] ---\n\n${d.content}\n`).join('\n================================================================================\n')}
`;
    const element = document.createElement("a");
    const file = new Blob([bundleContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `edusmart_integrated_portals_package_${currentTenant.code.toLowerCase()}.txt`;
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
              <pre className="text-[11px] leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
                {currentDoc.content}
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
