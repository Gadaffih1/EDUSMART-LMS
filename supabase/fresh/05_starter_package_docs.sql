-- EduSmart fresh Supabase schema
-- Starter package documents
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/starterPackageDocs.ts :: STARTER_PACKAGE_DOCS (5 rows)
drop table if exists "edusmart"."starter_package_docs" cascade;
create table "edusmart"."starter_package_docs" (
  "id" text not null,
  "name" text not null,
  "title" text not null,
  "language" text not null,
  "badge" text not null,
  "description" text not null,
  "content" text not null,
  primary key ("id")
);
comment on table "edusmart"."starter_package_docs" is $es$Platform feature pack from src/data/starterPackageDocs.ts export STARTER_PACKAGE_DOCS. Creating a school starts from this pack. The school then customises its own rows.$es$;
insert into "edusmart"."starter_package_docs" ("id", "name", "title", "language", "badge", "description", "content") values
  ($es$schema$es$, $es$001_core_schema.sql$es$, $es$Core Additive Database Schema$es$, $es$sql$es$, $es$PostgreSQL 14+$es$, $es$Additive database schema with tenant isolation, 3-way matching foreign keys, and audit logging.$es$, $es$-- EduSmart LMS: Additive Core Schema for Integrated Portals
-- Version: 001_core_schema.sql
-- Modules: Finance, Procurement, Stores & Inventory, HR & Payroll
-- Multi-Tenancy: Scoped by tenant_id across all tables with Row-Level Security
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. FINANCE & STUDENT BILLING SCHEMA
-- -------------------------------------------------------------------------

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
    payment_method VARCHAR(32) NOT NULL,
    reference_number VARCHAR(128) NOT NULL,
    payer_name VARCHAR(255) NOT NULL,
    payer_phone VARCHAR(64),
    term VARCHAR(32) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_by VARCHAR(255) NOT NULL
);

-- -------------------------------------------------------------------------
-- 2. PROCUREMENT & 3-WAY MATCHING SCHEMA
-- -------------------------------------------------------------------------

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

-- -------------------------------------------------------------------------
-- 3. CENTRAL STORES & INVENTORY SCHEMA
-- -------------------------------------------------------------------------

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

-- -------------------------------------------------------------------------
-- 4. HR & KENYAN CBC STATUTORY PAYROLL SCHEMA
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hr_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    employee_number VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    tsc_number VARCHAR(64),
    kra_pin VARCHAR(32) NOT NULL,
    nssf_number VARCHAR(32) NOT NULL,
    nhif_shif_number VARCHAR(32) NOT NULL,
    department VARCHAR(128) NOT NULL,
    designation VARCHAR(128) NOT NULL,
    employment_type VARCHAR(64) NOT NULL,
    date_of_joining DATE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    bank_name VARCHAR(128) NOT NULL,
    bank_account VARCHAR(64) NOT NULL,
    bank_branch VARCHAR(128) NOT NULL,
    basic_salary NUMERIC(12, 2) NOT NULL,
    house_allowance NUMERIC(12, 2) DEFAULT 0.00,
    commuter_allowance NUMERIC(12, 2) DEFAULT 0.00,
    hardship_allowance NUMERIC(12, 2) DEFAULT 0.00,
    responsibility_allowance NUMERIC(12, 2) DEFAULT 0.00,
    gross_pay NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'Active',
    UNIQUE(tenant_id, employee_number)
);

CREATE TABLE IF NOT EXISTS monthly_payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    payroll_month VARCHAR(32) NOT NULL,
    academic_year VARCHAR(16) NOT NULL,
    term VARCHAR(32) NOT NULL,
    total_employees INT NOT NULL,
    total_gross_pay NUMERIC(14, 2) NOT NULL,
    total_paye_tax NUMERIC(14, 2) NOT NULL,
    total_nssf NUMERIC(14, 2) NOT NULL,
    total_nhif_shif NUMERIC(14, 2) NOT NULL,
    total_housing_levy NUMERIC(14, 2) NOT NULL,
    total_net_pay NUMERIC(14, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Draft',
    prepared_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255),
    approval_date TIMESTAMP WITH TIME ZONE,
    general_ledger_journal_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_run_id UUID REFERENCES monthly_payroll_runs(id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL,
    employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(64) NOT NULL,
    kra_pin VARCHAR(32) NOT NULL,
    month VARCHAR(32) NOT NULL,
    academic_year VARCHAR(16) NOT NULL,
    basic_salary NUMERIC(12, 2) NOT NULL,
    house_allowance NUMERIC(12, 2) DEFAULT 0.00,
    commuter_allowance NUMERIC(12, 2) DEFAULT 0.00,
    responsibility_allowance NUMERIC(12, 2) DEFAULT 0.00,
    gross_earnings NUMERIC(12, 2) NOT NULL,
    paye_tax NUMERIC(12, 2) NOT NULL,
    nssf_deduction NUMERIC(12, 2) NOT NULL,
    nhif_shif_deduction NUMERIC(12, 2) NOT NULL,
    housing_levy_deduction NUMERIC(12, 2) NOT NULL,
    other_deductions NUMERIC(12, 2) DEFAULT 0.00,
    total_deductions NUMERIC(12, 2) NOT NULL,
    net_payable NUMERIC(12, 2) NOT NULL,
    disbursement_status VARCHAR(32) DEFAULT 'Pending'
);

-- -------------------------------------------------------------------------
-- 5. AUDIT LOGS & CROSS-MODULE INTEGRATION
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS operations_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    module VARCHAR(32) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    reference_id VARCHAR(128) NOT NULL,
    amount_impacted NUMERIC(14, 2)
);

-- Multi-Tenant Indices
CREATE INDEX idx_fee_invoices_tenant ON fee_invoices(tenant_id, student_id);
CREATE INDEX idx_fee_payments_tenant ON fee_payments(tenant_id, invoice_id);
CREATE INDEX idx_requisitions_tenant ON purchase_requisitions(tenant_id, status);
CREATE INDEX idx_inventory_tenant ON store_inventory_items(tenant_id, category);
CREATE INDEX idx_employees_tenant ON hr_employees(tenant_id, status);
CREATE INDEX idx_payroll_tenant ON monthly_payroll_runs(tenant_id, payroll_month);$es$),
  ($es$api$es$, $es$API_CONTRACT.md$es$, $es$REST API & Security Contracts$es$, $es$markdown$es$, $es$OpenAPI Spec$es$, $es$Proposed API routes, required HTTP headers, and tenant access control rules.$es$, $es$# EduSmart LMS: Integrated Portals API Contract

## Authentication & Headers
All requests must provide:
```http
Authorization: Bearer <JWT_OR_SESSION_TOKEN>
X-Tenant-ID: <TENANT_ID>
Content-Type: application/json
```

---

## 1. Finance & Student Billing APIs

### `GET /api/finance/fee-structure`
Retrieves fee structure line items for the active tenant.

### `POST /api/finance/invoices/generate`
Generates termly invoices for students according to their grade and optional fee selections.

### `POST /api/finance/payments`
Records a student fee payment (M-Pesa IPN callback or manual bursar entry).
```json
{
  "studentId": "std-1234",
  "admissionNumber": "ADM-2024-089",
  "amount": 45000,
  "paymentMethod": "M-PESA",
  "referenceNumber": "QK89LXP42M",
  "payerName": "Faith Mutua",
  "term": "Term 1 2026"
}
```

### `GET /api/finance/general-ledger`
Returns trial balance, assets, liabilities, and revenues for tenant.

### `GET /api/finance/budgets`
Returns departmental budget allocations and actual spend.

---

## 2. Procurement APIs

### `GET /api/procurement/requisitions`
Returns purchase requisitions filtered by tenant and department.

### `POST /api/procurement/requisitions`
Creates a new purchase requisition.

### `PATCH /api/procurement/requisitions/:id/approval`
Approval step for HOD, Finance, or Head Teacher.

### `POST /api/procurement/purchase-orders`
Generates Local Purchase Order (LPO) from approved requisition.

---

## 3. Stores & Inventory APIs

### `GET /api/stores/inventory`
Returns all stock items, current balances, re-order levels, and locations.

### `POST /api/stores/grn`
Creates Goods Received Note against an approved LPO, updating physical stock.

### `POST /api/stores/issues`
Issues items to teachers, classes, or departments, generating a Store Issue Voucher (SIV).

---

## 4. HR & Payroll APIs

### `GET /api/hr/employees`
Lists employees with salary structures and statutory registrations.

### `POST /api/hr/payroll/run`
Calculates draft monthly payroll including Kenyan PAYE, NSSF, NHIF/SHIF, and Housing Levy.

### `POST /api/hr/payroll/:id/approve`
Executive signoff by Head Teacher; triggers GL journal creation.

### `GET /api/hr/payslips/:employeeId`
Fetches individual employee digital payslip.

---

## 5. Security & Isolation Rules
1. **Tenant Isolation**: Queries strictly append `WHERE tenant_id = current_tenant`.
2. **Audit Logging**: Every financial transaction triggers immutable log in `operations_audit_logs`.
3. **Immutability**: Completed receipts and disbursed payroll runs cannot be deleted.$es$),
  ($es$plan$es$, $es$IMPLEMENTATION_PLAN.md$es$, $es$Phased Implementation Sequence$es$, $es$markdown$es$, $es$Phases 1 - 5$es$, $es$Roadmap for safe extension without disruption to existing LMS features.$es$, $es$# EduSmart LMS: Integrated Finance & Operations Implementation Plan

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
- Approval workflow audit trail verification.$es$),
  ($es$tests$es$, $es$ACCEPTANCE_TESTS.md$es$, $es$Tenant Isolation & Financial Acceptance Tests$es$, $es$markdown$es$, $es$Acceptance Criteria$es$, $es$Verification test cases for cross-tenant boundaries, 3-way matching, and statutory math.$es$, $es$# EduSmart LMS: Integrated Portals Acceptance Tests

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
- Test 4.2: Every state change (approvals, payments, stock issues) writes a timestamped record to operations_audit_logs.$es$),
  ($es$readme$es$, $es$README.md$es$, $es$Integration README & Architecture Overview$es$, $es$markdown$es$, $es$Integration Guide$es$, $es$Operational overview, deployment instructions, and security considerations.$es$, $es$# EduSmart LMS Integrated Portals Starter Package

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
- README.md: This installation and architectural overview guide.$es$);
alter table "edusmart"."starter_package_docs" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
