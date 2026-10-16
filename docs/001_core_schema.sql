-- =========================================================================
-- EduSmart LMS: Additive Core Schema for Integrated Portals
-- Version: 001_core_schema.sql
-- Modules: Finance, Procurement, Stores & Inventory, HR & Payroll
-- Multi-Tenancy: Scoped by tenant_id across all tables with Row-Level Security
-- =========================================================================

-- Enable UUID extension if needed
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    reference_number VARCHAR(128) NOT NULL, -- M-Pesa transaction ID or bank slip ref
    payer_name VARCHAR(255) NOT NULL,
    payer_phone VARCHAR(32) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_by VARCHAR(255) NOT NULL,
    term VARCHAR(32) NOT NULL,
    academic_year VARCHAR(16) NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS general_ledger_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(32) NOT NULL, -- 'Revenue', 'Expense', 'Asset', 'Liability'
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) DEFAULT 'KES',
    description TEXT,
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    department VARCHAR(128) NOT NULL,
    fiscal_year VARCHAR(16) NOT NULL,
    allocated_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    committed_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    spent_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    remaining_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    lead_officer VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 2. PROCUREMENT & PURCHASING SCHEMA
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vendor_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    kra_pin VARCHAR(32) NOT NULL,
    tax_compliance_valid BOOLEAN DEFAULT TRUE,
    category VARCHAR(128) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    bank_name VARCHAR(128),
    bank_account VARCHAR(64),
    rating INT DEFAULT 5,
    status VARCHAR(32) DEFAULT 'Approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    req_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    department VARCHAR(128) NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    requester_role VARCHAR(64) NOT NULL,
    request_date DATE NOT NULL,
    required_date DATE NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'Medium',
    justification TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    total_estimated_cost NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Draft',
    approval_chain JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders_lpo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lpo_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    requisition_id UUID REFERENCES purchase_requisitions(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendor_suppliers(id) ON DELETE SET NULL,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_phone VARCHAR(32),
    order_date DATE NOT NULL,
    delivery_due_date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_vat NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_terms VARCHAR(128) DEFAULT 'Net 30 Days upon GRN',
    delivery_location VARCHAR(255) DEFAULT 'Main Central Store',
    authorized_by VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Issued',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 3. STORES & INVENTORY SCHEMA
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS store_inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    store_location VARCHAR(128) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reorder_level NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    last_restocked_date DATE,
    supplier_name VARCHAR(255),
    UNIQUE(tenant_id, item_code)
);

CREATE TABLE IF NOT EXISTS goods_received_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    lpo_id UUID REFERENCES purchase_orders_lpo(id) ON DELETE SET NULL,
    lpo_number VARCHAR(64) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    delivery_note_number VARCHAR(64) NOT NULL,
    received_date DATE NOT NULL,
    received_by VARCHAR(255) NOT NULL,
    inspected_by VARCHAR(255) NOT NULL,
    inspection_passed BOOLEAN DEFAULT TRUE,
    items_received JSONB NOT NULL DEFAULT '[]',
    total_accepted_value NUMERIC(12, 2) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_issue_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siv_number VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    issue_date DATE NOT NULL,
    issued_to_name VARCHAR(255) NOT NULL,
    issued_to_role VARCHAR(64) NOT NULL,
    department VARCHAR(128) NOT NULL,
    purpose TEXT NOT NULL,
    issued_by VARCHAR(255) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    total_value NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'Dispatched & Signed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- 4. HR & PAYROLL SCHEMA
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hr_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    employee_number VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    national_id VARCHAR(32) NOT NULL,
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
CREATE INDEX idx_payroll_tenant ON monthly_payroll_runs(tenant_id, payroll_month);
