# EduSmart LMS: Integrated Portals Acceptance Tests

## Test Suite 1: Tenant Isolation
- **Test 1.1**: Querying fees, receipts, and invoices under `tenant-riara` returns zero records belonging to `tenant-greenwood`.
- **Test 1.2**: Store inventory items in Riara Central Store cannot be issued or seen by Greenwood Storekeeper.
- **Test 1.3**: Employee salary records and payroll totals are strictly scoped to the active tenant session.

## Test Suite 2: Financial Integrity & 3-Way Matching
- **Test 2.1**: A fee payment must decrement student invoice balance by the exact amount paid and generate a receipt with unique reference number.
- **Test 2.2**: An LPO cannot be generated without an approved requisition.
- **Test 2.3**: A Goods Received Note (GRN) updates stock levels only for accepted quantities.
- **Test 2.4**: Departmental budget committed amount increases when an LPO is issued and updates spent amount upon invoice clearance.

## Test Suite 3: Statutory Payroll Compliance (Kenya)
- **Test 3.1**: Gross pay correctly calculates basic salary + house + commuter + responsibility allowances.
- **Test 3.2**: Housing levy computes at precisely 1.5% of Gross Pay.
- **Test 3.3**: NSSF deduction respects Tier I and Tier II statutory ceilings.
- **Test 3.4**: Net pay equals Gross Pay minus total statutory deductions.
- **Test 3.5**: Disbursing a monthly payroll creates a corresponding debit in Salary Expenses and credit in Bank Account in the General Ledger.

## Test Suite 4: Security & Audit Controls
- **Test 4.1**: Only users with `head_teacher` or `admin` can perform final approval on budgets and payroll.
- **Test 4.2**: Every state change (approvals, payments, stock issues) writes a timestamped record to `operations_audit_logs`.
