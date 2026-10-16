# EduSmart LMS Integrated Portals Starter Package

This package implements the target architecture specified in the EduSmart Integrated Operations & Finance design.

## Architecture Overview
- **EduSmart LMS Core**: Preserves student portal, parent portal, tenant schools, and teacher modules.
- **Shared Integration Layer**: Multi-tenant isolation, role-based approvals, audit logs, and notification feeds.
- **Portals**:
  1. **Finance**: Billing, payments, fee statements, general ledgers, departmental budgets.
  2. **Procurement**: Purchase requisitions, approved vendor directory, RFQ bidding, Local Purchase Orders (LPO).
  3. **Stores & Inventory**: Stock catalog, multi-location stock levels, Goods Received Notes (GRN), Store Issue Vouchers (SIV), stocktake audits.
  4. **HR & Payroll**: Employee master dossiers, Kenyan statutory deductions (PAYE, NSSF, NHIF/SHIF, Housing Levy 1.5%), monthly payroll runs, digital payslips.

## Included Files in this Starter Package
- `001_core_schema.sql`: Additive PostgreSQL schema with tenant-scoped tables and indices.
- `API_CONTRACT.md`: Proposed API routes, request/response models, and security rules.
- `IMPLEMENTATION_PLAN.md`: Phased rollout sequence.
- `ACCEPTANCE_TESTS.md`: Verification test cases for tenant isolation, financial integrity, and statutory calculations.
- `README.md`: This installation and architectural overview guide.
