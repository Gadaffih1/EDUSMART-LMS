/**
 * EduSmart LMS: Integrated Finance, Procurement, Stores & HR/Payroll Portal Types
 * Fully scoped for Multi-Tenancy isolation, granular role-based approvals, and audit trails.
 */

// =========================================================================
// 1. FINANCE & BURSARY TYPES
// =========================================================================

export type PaymentMethod = 'M-PESA' | 'Bank Transfer' | 'Cashier Slip' | 'Direct Cheque';
export type InvoiceStatus = 'Pending' | 'Partially Paid' | 'Paid in Full' | 'Overdue';
export type GLAccountCategory = 'Revenue' | 'Expense' | 'Asset' | 'Liability';

export interface FeeStructureItem {
  id: string;
  name: string;
  amount: number;
  gradeLevel: string; // e.g. "Grades 1-6" or "Grades 7-9"
  frequency: 'Termly' | 'Annual' | 'One-Time';
  isOptional: boolean;
  category: 'Tuition' | 'Boarding' | 'Activity & Sports' | 'Lunch & Dining' | 'Transport' | 'STEM & ICT' | 'Development';
}

export interface StudentFeeAccount {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  upiNumber: string;
  grade: number;
  stream: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  termBilled: number;
  termPaid: number;
  arrears: number;
  currentBalance: number;
  lastPaymentDate?: string;
  status: 'Cleared' | 'Partial' | 'Critical Arrears';
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  grade: number;
  stream: string;
  term: string;
  academicYear: string;
  issueDate: string;
  dueDate: string;
  lineItems: { description: string; amount: number }[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
}

export interface FeePaymentReceipt {
  id: string;
  receiptNumber: string;
  tenantId: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string; // M-PESA Code or Bank Slip Ref
  payerName: string;
  payerPhone: string;
  paymentDate: string;
  receivedBy: string;
  term: string;
  academicYear: string;
  notes?: string;
}

export interface GeneralLedgerAccount {
  code: string;
  name: string;
  category: GLAccountCategory;
  balance: number;
  currency: string;
  description: string;
}

export interface BudgetAllocation {
  id: string;
  tenantId: string;
  department: string;
  fiscalYear: string;
  allocatedAmount: number;
  committedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  leadOfficer: string;
}

// =========================================================================
// 2. PROCUREMENT & PURCHASING TYPES
// =========================================================================

export type RequisitionPriority = 'Low' | 'Medium' | 'High' | 'Emergency';
export type RequisitionStatus = 'Draft' | 'Department Reviewed' | 'Finance Cleared' | 'Head Teacher Approved' | 'LPO Created' | 'Rejected';
export type LPOStatus = 'Issued' | 'Partially Received' | 'Fulfilled' | 'Cancelled';

export interface VendorSupplier {
  id: string;
  tenantId: string;
  name: string;
  kraPin: string;
  taxComplianceValid: boolean;
  category: 'Textbooks & Stationery' | 'Laboratory Chemicals & Apparatus' | 'Sports Gear & Trophies' | 'Food Supplies & Kitchen Provisions' | 'IT & Hardware' | 'Facility Maintenance';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  bankAccount: string;
  rating: number; // 1 to 5
  status: 'Approved' | 'Pending Review' | 'Blacklisted';
}

export interface RequisitionItem {
  id: string;
  description: string;
  specification: string;
  quantity: number;
  unit: string;
  estimatedUnitCost: number;
  estimatedTotal: number;
}

export interface PurchaseRequisition {
  id: string;
  reqNumber: string;
  tenantId: string;
  department: string;
  requestedBy: string;
  requesterRole: string;
  requestDate: string;
  requiredDate: string;
  priority: RequisitionPriority;
  justification: string;
  items: RequisitionItem[];
  totalEstimatedCost: number;
  status: RequisitionStatus;
  approvalChain: {
    role: string;
    approverName: string;
    approvedAt?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    comments?: string;
  }[];
}

export interface PurchaseOrderLPO {
  id: string;
  lpoNumber: string;
  tenantId: string;
  requisitionId: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  orderDate: string;
  deliveryDueDate: string;
  items: {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  taxVat: number;
  totalAmount: number;
  paymentTerms: string;
  deliveryLocation: string;
  authorizedBy: string;
  status: LPOStatus;
}

// =========================================================================
// 3. STORES & INVENTORY TYPES
// =========================================================================

export type InventoryCategory = 
  | 'Classroom Stationery' 
  | 'Science Lab Reagents & Apparatus' 
  | 'Sports & Athletics Equipment' 
  | 'Uniforms & Apparel' 
  | 'Cleaning & Facilities Detergents' 
  | 'Kitchen Dry Provisions' 
  | 'Curriculum Textbooks';

export type StoreLocation = 
  | 'Main Central Store' 
  | 'Science Laboratory Store' 
  | 'Sports Equipment Shed' 
  | 'Kitchen Pantry Store' 
  | 'Library Catalog Room';

export interface StoreInventoryItem {
  id: string;
  itemCode: string;
  tenantId: string;
  name: string;
  category: InventoryCategory;
  storeLocation: StoreLocation;
  unit: string; // 'Pcs', 'Reams', 'Bottles (L)', 'Sets', 'Kg'
  currentStock: number;
  reorderLevel: number;
  unitCost: number;
  totalValue: number;
  lastRestockedDate: string;
  supplierName: string;
}

export interface GoodsReceivedNoteGRN {
  id: string;
  grnNumber: string;
  tenantId: string;
  lpoId: string;
  lpoNumber: string;
  vendorName: string;
  deliveryNoteNumber: string;
  receivedDate: string;
  receivedBy: string;
  inspectedBy: string;
  inspectionPassed: boolean;
  itemsReceived: {
    itemId: string;
    itemName: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    unitCost: number;
    notes?: string;
  }[];
  totalAcceptedValue: number;
  remarks: string;
}

export interface StoreIssueVoucher {
  id: string;
  sivNumber: string;
  tenantId: string;
  issueDate: string;
  issuedToName: string;
  issuedToRole: string;
  department: string;
  purpose: string;
  issuedBy: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }[];
  totalValue: number;
  status: 'Dispatched & Signed';
}

export interface StocktakeAuditRecord {
  id: string;
  auditNumber: string;
  tenantId: string;
  auditDate: string;
  conductedBy: string;
  storeLocation: StoreLocation;
  totalItemsChecked: number;
  variancesFound: {
    itemId: string;
    itemName: string;
    systemStock: number;
    physicalCount: number;
    variance: number;
    valueVariance: number;
    reason: string;
  }[];
  status: 'Reconciled & Posted';
}

// =========================================================================
// 4. HR & PAYROLL TYPES (KENYAN CBC STATUTORY COMPLIANT)
// =========================================================================

export type EmploymentType = 'Permanent & Pensionable' | 'TSC Seconded Faculty' | 'Contractual Staff' | 'Casual Support Staff';

export interface HREmployee {
  id: string;
  tenantId: string;
  employeeNumber: string;
  name: string;
  nationalId: string;
  tscNumber?: string;
  kraPin: string;
  nssfNumber: string;
  nhifShifNumber: string;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  dateOfJoining: string;
  email: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  bankBranch: string;
  // Salary Component
  basicSalary: number;
  houseAllowance: number;
  commuterAllowance: number;
  hardshipAllowance: number;
  responsibilityAllowance: number;
  grossPay: number;
  status: 'Active' | 'On Leave' | 'Terminated';
}

export interface IndividualPayslip {
  id: string;
  payrollRunId: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  kraPin: string;
  month: string;
  academicYear: string;
  basicSalary: number;
  houseAllowance: number;
  commuterAllowance: number;
  responsibilityAllowance: number;
  grossEarnings: number;
  // Statutory Deductions
  payeTax: number;
  nssfDeduction: number;
  nhifShifDeduction: number;
  housingLevyDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPayable: number;
  disbursementStatus: 'Disbursed via Bank Batch' | 'Pending';
  disbursementDate?: string;
}

export interface MonthlyPayrollRun {
  id: string;
  runNumber: string;
  tenantId: string;
  payrollMonth: string; // e.g. "March 2026"
  academicYear: string;
  term: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalPayeTax: number;
  totalNssf: number;
  totalNhifShif: number;
  totalHousingLevy: number;
  totalNetPay: number;
  status: 'Draft' | 'Finance Audited' | 'Head Teacher Approved' | 'Disbursed';
  preparedBy: string;
  approvedBy?: string;
  approvalDate?: string;
  generalLedgerJournalId?: string;
}

// =========================================================================
// 5. SHARED INTEGRATION, APPROVALS & AUDIT LOGS
// =========================================================================

export interface OperationsAuditLog {
  id: string;
  tenantId: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  userRole: string;
  module: 'Finance' | 'Procurement' | 'Stores' | 'HR & Payroll';
  actionType: string;
  description: string;
  referenceId: string;
  amountImpacted?: number;
}

export { calculateKenyanPayrollDeductions } from '../data/financeOperationsData';
