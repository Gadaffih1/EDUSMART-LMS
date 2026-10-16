# EduSmart LMS: Integrated Portals API Contract

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
- **Roles**: `finance_officer`, `admin`, `head_teacher`

### `GET /api/finance/invoices`
- **Query Params**: `studentId`, `grade`, `stream`, `term`, `status`
- **Response**: Array of `FeeInvoice` objects.

### `POST /api/finance/payments`
Records a fee payment (M-Pesa, Bank, or Cashier).
```json
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
```json
{
  "action": "Approve",
  "comments": "Approved within science laboratory budget allocation."
}
```

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
3. **Immutability**: Completed receipts and disbursed payroll runs cannot be deleted.
