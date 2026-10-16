# EduSmart LMS: Integrated Finance & Operations Implementation Plan

## Phase 1: Shared Integration Layer & Multi-Tenant Access Control
- Establish tenant-scoped tables and indices.
- Extend `UserRole` and `RoleAccessRights` with `finance_officer`, `procurement_officer`, `storekeeper`, and `hr_manager`.
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
- Approval workflow audit trail verification.
