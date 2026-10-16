import {
  FeeStructureItem,
  FeeInvoice,
  FeePaymentReceipt,
  StudentFeeAccount,
  GeneralLedgerAccount,
  BudgetAllocation,
  VendorSupplier,
  PurchaseRequisition,
  PurchaseOrderLPO,
  StoreInventoryItem,
  GoodsReceivedNoteGRN,
  StoreIssueVoucher,
  StocktakeAuditRecord,
  HREmployee,
  MonthlyPayrollRun,
  IndividualPayslip,
  OperationsAuditLog,
  calculateKenyanPayrollDeductions
} from '../types/financeOperations';
import {
  INITIAL_FEE_STRUCTURES,
  INITIAL_GL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_SUPPLIERS,
  INITIAL_REQUISITIONS,
  INITIAL_LPOS,
  INITIAL_INVENTORY,
  INITIAL_GRNS,
  INITIAL_SIVS,
  INITIAL_EMPLOYEES,
  INITIAL_PAYROLL_RUNS,
  INITIAL_AUDIT_LOGS
} from '../data/financeOperationsData';
import { Storage } from './storage';

const STORAGE_KEYS = {
  FEE_STRUCTURES: 'edusmart_ops_fee_structures_v1',
  FEE_INVOICES: 'edusmart_ops_fee_invoices_v1',
  FEE_PAYMENTS: 'edusmart_ops_fee_payments_v1',
  GL_ACCOUNTS: 'edusmart_ops_gl_accounts_v1',
  BUDGETS: 'edusmart_ops_budgets_v1',
  SUPPLIERS: 'edusmart_ops_suppliers_v1',
  REQUISITIONS: 'edusmart_ops_requisitions_v1',
  LPOS: 'edusmart_ops_lpos_v1',
  INVENTORY: 'edusmart_ops_inventory_v1',
  GRNS: 'edusmart_ops_grns_v1',
  SIVS: 'edusmart_ops_sivs_v1',
  STOCKTAKES: 'edusmart_ops_stocktakes_v1',
  EMPLOYEES: 'edusmart_ops_employees_v1',
  PAYROLL_RUNS: 'edusmart_ops_payroll_runs_v1',
  PAYSLIPS: 'edusmart_ops_payslips_v1',
  AUDIT_LOGS: 'edusmart_ops_audit_logs_v1'
};

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

// Generate sample student invoices based on actual registered students
function generateInitialInvoices(): FeeInvoice[] {
  const users = Storage.getUsers().filter(u => u.role === 'student');
  const invoices: FeeInvoice[] = [];

  users.forEach((stu, idx) => {
    const grade = stu.grade || 7;
    const isJunior = grade >= 7;
    const tuition = isJunior ? 48000 : 38000;
    const dining = 11000;
    const stemOrActivity = isJunior ? 6500 : 5000;
    const total = tuition + dining + stemOrActivity;
    
    // Partially paid or cleared sample states
    const paid = idx % 3 === 0 ? total : idx % 3 === 1 ? total - 15000 : 20000;
    const balance = total - paid;
    const status = balance === 0 ? 'Paid in Full' : paid > 0 ? 'Partially Paid' : 'Pending';

    invoices.push({
      id: `inv-${stu.id}`,
      invoiceNumber: `INV-2026-${1000 + idx}`,
      tenantId: 'tenant-riara',
      studentId: stu.id,
      studentName: stu.name,
      admissionNumber: stu.admissionNumber || `ADM-2026-${100 + idx}`,
      grade,
      stream: stu.stream || 'Athi',
      term: 'Term 1, 2026',
      academicYear: '2026',
      issueDate: '2026-01-06',
      dueDate: '2026-02-15',
      lineItems: [
        { description: `${isJunior ? 'Junior School' : 'Primary'} Academic Tuition`, amount: tuition },
        { description: 'Termly Nutritious Hot Lunch Program', amount: dining },
        { description: isJunior ? 'Science Laboratory & STEM Levy' : 'Activity & Sports Levy', amount: stemOrActivity }
      ],
      totalAmount: total,
      paidAmount: paid,
      balanceAmount: balance,
      status
    });
  });

  return invoices;
}

export const OperationsStorage = {
  // =========================================================================
  // 1. FINANCE & BILLING
  // =========================================================================
  getFeeStructures(tenantId: string = 'tenant-riara'): FeeStructureItem[] {
    return getStorage<FeeStructureItem[]>(STORAGE_KEYS.FEE_STRUCTURES, INITIAL_FEE_STRUCTURES);
  },

  getFeeInvoices(tenantId: string = 'tenant-riara'): FeeInvoice[] {
    const invoices = getStorage<FeeInvoice[]>(STORAGE_KEYS.FEE_INVOICES, []);
    if (invoices.length === 0) {
      const generated = generateInitialInvoices();
      setStorage(STORAGE_KEYS.FEE_INVOICES, generated);
      return generated.filter(i => !tenantId || i.tenantId === tenantId);
    }
    return invoices.filter(i => !tenantId || i.tenantId === tenantId);
  },

  getStudentFeeAccounts(tenantId: string = 'tenant-riara'): StudentFeeAccount[] {
    const invoices = this.getFeeInvoices(tenantId);
    const users = Storage.getUsers().filter(u => u.role === 'student');
    
    return users.map(u => {
      const stuInvoice = invoices.find(i => i.studentId === u.id) || {
        totalAmount: 65500,
        paidAmount: 65500,
        balanceAmount: 0,
        status: 'Paid in Full' as const
      };
      
      const balance = stuInvoice.balanceAmount;
      return {
        studentId: u.id,
        studentName: u.name,
        admissionNumber: u.admissionNumber || 'ADM-2026-092',
        upiNumber: u.upiNumber || 'UPI-992-K',
        grade: u.grade || 7,
        stream: u.stream || 'Athi',
        parentName: u.parentName || 'Parent / Guardian',
        parentPhone: u.parentPhone || '+254 712 345 678',
        parentEmail: u.parentEmail || 'parent@edusmart.ac.ke',
        termBilled: stuInvoice.totalAmount,
        termPaid: stuInvoice.paidAmount,
        arrears: 0,
        currentBalance: balance,
        lastPaymentDate: stuInvoice.paidAmount > 0 ? '2026-02-14' : undefined,
        status: balance === 0 ? 'Cleared' : balance > 25000 ? 'Critical Arrears' : 'Partial'
      };
    });
  },

  getFeePayments(tenantId: string = 'tenant-riara'): FeePaymentReceipt[] {
    const defaultPayments: FeePaymentReceipt[] = [
      {
        id: 'rec-001',
        receiptNumber: 'REC-2026-8921',
        tenantId: 'tenant-riara',
        invoiceId: 'inv-usr-stu-01',
        studentId: 'usr-stu-01',
        studentName: 'Liam Kiprono',
        admissionNumber: 'ADM-2026-101',
        amount: 40000,
        paymentMethod: 'M-PESA',
        referenceNumber: 'QHK892198L',
        payerName: 'Grace Muthoni Kiprono',
        payerPhone: '+254 722 910 200',
        paymentDate: '2026-02-10 11:42',
        receivedBy: 'Safaricom M-PESA Auto-Reconcile',
        term: 'Term 1, 2026',
        academicYear: '2026',
        notes: 'Paybill 522123 Account ADM-2026-101'
      },
      {
        id: 'rec-002',
        receiptNumber: 'REC-2026-8922',
        tenantId: 'tenant-riara',
        invoiceId: 'inv-usr-stu-02',
        studentId: 'usr-stu-02',
        studentName: 'Zawadi Muthoni',
        admissionNumber: 'ADM-2026-102',
        amount: 65500,
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'KCB-FT-992019',
        payerName: 'Dr. John Muthoni',
        payerPhone: '+254 733 445 566',
        paymentDate: '2026-02-12 14:15',
        receivedBy: 'Mr. David Mwangi (Bursar)',
        term: 'Term 1, 2026',
        academicYear: '2026',
        notes: 'Full fees clearance for Term 1'
      }
    ];
    return getStorage<FeePaymentReceipt[]>(STORAGE_KEYS.FEE_PAYMENTS, defaultPayments).filter(p => !tenantId || p.tenantId === tenantId);
  },

  addFeePayment(paymentData: Omit<FeePaymentReceipt, 'id' | 'receiptNumber'> & { receiptNumber?: string }): FeePaymentReceipt {
    const payments = this.getFeePayments(paymentData.tenantId);
    const receipt: FeePaymentReceipt = {
      ...paymentData,
      id: `rec-${Date.now()}`,
      receiptNumber: paymentData.receiptNumber || `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`
    };
    payments.unshift(receipt);
    setStorage(STORAGE_KEYS.FEE_PAYMENTS, payments);

    // Update corresponding invoice
    const invoices = this.getFeeInvoices(paymentData.tenantId);
    const invIdx = invoices.findIndex(i => i.id === paymentData.invoiceId || i.studentId === paymentData.studentId);
    if (invIdx !== -1) {
      const inv = invoices[invIdx];
      const newPaid = inv.paidAmount + paymentData.amount;
      const newBalance = Math.max(0, inv.totalAmount - newPaid);
      invoices[invIdx] = {
        ...inv,
        paidAmount: newPaid,
        balanceAmount: newBalance,
        status: newBalance === 0 ? 'Paid in Full' : 'Partially Paid'
      };
      setStorage(STORAGE_KEYS.FEE_INVOICES, invoices);
    }

    // Update General Ledger (Debit Bank/Mpesa, Credit Tuition Revenue)
    const glAccounts = this.getGeneralLedger(paymentData.tenantId);
    const bankAccount = glAccounts.find(a => paymentData.paymentMethod === 'M-PESA' ? a.code === '1020' : a.code === '1010');
    if (bankAccount) bankAccount.balance += paymentData.amount;
    const revenueAccount = glAccounts.find(a => a.code === '3010');
    if (revenueAccount) revenueAccount.balance += paymentData.amount;
    setStorage(STORAGE_KEYS.GL_ACCOUNTS, glAccounts);

    // Audit log
    this.logOperation({
      tenantId: paymentData.tenantId,
      userEmail: paymentData.receivedBy,
      userName: paymentData.receivedBy,
      userRole: 'finance_officer',
      module: 'Finance',
      actionType: 'PAYMENT_RECORDED',
      description: `Payment of KES ${paymentData.amount.toLocaleString()} recorded for ${paymentData.studentName} (${paymentData.paymentMethod} Ref: ${paymentData.referenceNumber}).`,
      referenceId: receipt.receiptNumber,
      amountImpacted: paymentData.amount
    });

    window.dispatchEvent(new CustomEvent('finance-updated'));
    return receipt;
  },

  getGeneralLedger(tenantId: string = 'tenant-riara'): GeneralLedgerAccount[] {
    return getStorage<GeneralLedgerAccount[]>(STORAGE_KEYS.GL_ACCOUNTS, INITIAL_GL_ACCOUNTS);
  },

  getBudgetAllocations(tenantId: string = 'tenant-riara'): BudgetAllocation[] {
    return getStorage<BudgetAllocation[]>(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS).filter(b => !tenantId || b.tenantId === tenantId);
  },

  // =========================================================================
  // 2. PROCUREMENT & PURCHASING
  // =========================================================================
  getSuppliers(tenantId: string = 'tenant-riara'): VendorSupplier[] {
    return getStorage<VendorSupplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS).filter(s => !tenantId || s.tenantId === tenantId);
  },

  addSupplier(supplierData: Omit<VendorSupplier, 'id'>): VendorSupplier {
    const suppliers = this.getSuppliers(supplierData.tenantId);
    const newSup: VendorSupplier = {
      ...supplierData,
      id: `sup-${Date.now()}`
    };
    suppliers.unshift(newSup);
    setStorage(STORAGE_KEYS.SUPPLIERS, suppliers);

    this.logOperation({
      tenantId: supplierData.tenantId,
      userEmail: 'procurement@edusmart.ac.ke',
      userName: 'Procurement Officer',
      userRole: 'procurement_officer',
      module: 'Procurement',
      actionType: 'VENDOR_ONBOARDED',
      description: `Registered new vendor ${newSup.name} (KRA PIN: ${newSup.kraPin}).`,
      referenceId: newSup.id
    });

    return newSup;
  },

  getRequisitions(tenantId: string = 'tenant-riara'): PurchaseRequisition[] {
    return getStorage<PurchaseRequisition[]>(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS).filter(r => !tenantId || r.tenantId === tenantId);
  },

  addRequisition(reqData: Omit<PurchaseRequisition, 'id' | 'reqNumber'>): PurchaseRequisition {
    const requisitions = this.getRequisitions(reqData.tenantId);
    const newReq: PurchaseRequisition = {
      ...reqData,
      id: `req-${Date.now()}`,
      reqNumber: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`
    };
    requisitions.unshift(newReq);
    setStorage(STORAGE_KEYS.REQUISITIONS, requisitions);

    this.logOperation({
      tenantId: reqData.tenantId,
      userEmail: reqData.requestedBy,
      userName: reqData.requestedBy,
      userRole: reqData.requesterRole,
      module: 'Procurement',
      actionType: 'REQUISITION_CREATED',
      description: `Raised Requisition ${newReq.reqNumber} for ${reqData.department} (Est. KES ${reqData.totalEstimatedCost.toLocaleString()}).`,
      referenceId: newReq.reqNumber,
      amountImpacted: reqData.totalEstimatedCost
    });

    window.dispatchEvent(new CustomEvent('procurement-updated'));
    return newReq;
  },

  approveRequisitionStep(
    reqId: string, 
    approverRole: string, 
    approverName: string, 
    status: 'Approved' | 'Rejected', 
    comments?: string
  ): PurchaseRequisition | null {
    const requisitions = this.getRequisitions();
    const idx = requisitions.findIndex(r => r.id === reqId);
    if (idx === -1) return null;

    const req = requisitions[idx];
    const chain = [...req.approvalChain];
    const existingStep = chain.find(c => c.role.toLowerCase().includes(approverRole.toLowerCase()) || approverRole.toLowerCase().includes(c.role.toLowerCase()));
    
    if (existingStep) {
      existingStep.status = status;
      existingStep.approverName = approverName;
      existingStep.approvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      existingStep.comments = comments;
    } else {
      chain.push({
        role: approverRole,
        approverName,
        approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status,
        comments
      });
    }

    let nextStatus = req.status;
    if (status === 'Rejected') {
      nextStatus = 'Rejected';
    } else if (approverRole === 'Head Teacher' || approverRole === 'head_teacher' || approverRole === 'admin') {
      nextStatus = 'Head Teacher Approved';
    } else if (approverRole.includes('Finance') || approverRole === 'finance_officer') {
      nextStatus = 'Finance Cleared';
    } else {
      nextStatus = 'Department Reviewed';
    }

    const updated: PurchaseRequisition = {
      ...req,
      approvalChain: chain,
      status: nextStatus
    };
    requisitions[idx] = updated;
    setStorage(STORAGE_KEYS.REQUISITIONS, requisitions);

    this.logOperation({
      tenantId: req.tenantId,
      userEmail: approverName,
      userName: approverName,
      userRole: approverRole,
      module: 'Procurement',
      actionType: status === 'Approved' ? 'REQUISITION_APPROVED' : 'REQUISITION_REJECTED',
      description: `${approverRole} ${approverName} ${status.toLowerCase()} ${req.reqNumber}.`,
      referenceId: req.reqNumber,
      amountImpacted: req.totalEstimatedCost
    });

    window.dispatchEvent(new CustomEvent('procurement-updated'));
    return updated;
  },

  getPurchaseOrders(tenantId: string = 'tenant-riara'): PurchaseOrderLPO[] {
    return getStorage<PurchaseOrderLPO[]>(STORAGE_KEYS.LPOS, INITIAL_LPOS).filter(l => !tenantId || l.tenantId === tenantId);
  },

  createPurchaseOrder(orderData: Omit<PurchaseOrderLPO, 'id' | 'lpoNumber'>): PurchaseOrderLPO {
    const lpos = this.getPurchaseOrders(orderData.tenantId);
    const newLpo: PurchaseOrderLPO = {
      ...orderData,
      id: `lpo-${Date.now()}`,
      lpoNumber: `LPO-2026-${Math.floor(1000 + Math.random() * 9000)}`
    };
    lpos.unshift(newLpo);
    setStorage(STORAGE_KEYS.LPOS, lpos);

    // Update requisition status to 'LPO Created'
    const requisitions = this.getRequisitions(orderData.tenantId);
    const req = requisitions.find(r => r.id === orderData.requisitionId);
    if (req) {
      req.status = 'LPO Created';
      setStorage(STORAGE_KEYS.REQUISITIONS, requisitions);
    }

    this.logOperation({
      tenantId: orderData.tenantId,
      userEmail: orderData.authorizedBy,
      userName: orderData.authorizedBy,
      userRole: 'finance_officer',
      module: 'Procurement',
      actionType: 'LPO_ISSUED',
      description: `Issued Local Purchase Order ${newLpo.lpoNumber} to ${newLpo.vendorName} (Amount: KES ${newLpo.totalAmount.toLocaleString()}).`,
      referenceId: newLpo.lpoNumber,
      amountImpacted: newLpo.totalAmount
    });

    window.dispatchEvent(new CustomEvent('procurement-updated'));
    return newLpo;
  },

  // =========================================================================
  // 3. STORES & INVENTORY
  // =========================================================================
  getStoreInventory(tenantId: string = 'tenant-riara'): StoreInventoryItem[] {
    return getStorage<StoreInventoryItem[]>(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY).filter(i => !tenantId || i.tenantId === tenantId);
  },

  addStoreItem(itemData: Omit<StoreInventoryItem, 'id'>): StoreInventoryItem {
    const items = this.getStoreInventory(itemData.tenantId);
    const newItem: StoreInventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`
    };
    items.unshift(newItem);
    setStorage(STORAGE_KEYS.INVENTORY, items);
    return newItem;
  },

  getGRNs(tenantId: string = 'tenant-riara'): GoodsReceivedNoteGRN[] {
    return getStorage<GoodsReceivedNoteGRN[]>(STORAGE_KEYS.GRNS, INITIAL_GRNS).filter(g => !tenantId || g.tenantId === tenantId);
  },

  createGRN(grnData: Omit<GoodsReceivedNoteGRN, 'id' | 'grnNumber'>): GoodsReceivedNoteGRN {
    const grns = this.getGRNs(grnData.tenantId);
    const newGrn: GoodsReceivedNoteGRN = {
      ...grnData,
      id: `grn-${Date.now()}`,
      grnNumber: `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`
    };
    grns.unshift(newGrn);
    setStorage(STORAGE_KEYS.GRNS, grns);

    // Auto update physical stock in Inventory
    const inventory = this.getStoreInventory(grnData.tenantId);
    grnData.itemsReceived.forEach(item => {
      const stockItem = inventory.find(i => i.id === item.itemId || i.name.toLowerCase() === item.itemName.toLowerCase());
      if (stockItem) {
        stockItem.currentStock += item.acceptedQty;
        stockItem.totalValue = stockItem.currentStock * stockItem.unitCost;
        stockItem.lastRestockedDate = grnData.receivedDate;
      }
    });
    setStorage(STORAGE_KEYS.INVENTORY, inventory);

    // Update LPO status to Fulfilled
    const lpos = this.getPurchaseOrders(grnData.tenantId);
    const matchedLpo = lpos.find(l => l.id === grnData.lpoId || l.lpoNumber === grnData.lpoNumber);
    if (matchedLpo) {
      matchedLpo.status = 'Fulfilled';
      setStorage(STORAGE_KEYS.LPOS, lpos);
    }

    this.logOperation({
      tenantId: grnData.tenantId,
      userEmail: grnData.receivedBy,
      userName: grnData.receivedBy,
      userRole: 'storekeeper',
      module: 'Stores',
      actionType: 'GRN_ACCEPTED',
      description: `Received ${newGrn.grnNumber} against ${newGrn.lpoNumber} from ${newGrn.vendorName}. Inventory updated.`,
      referenceId: newGrn.grnNumber,
      amountImpacted: newGrn.totalAcceptedValue
    });

    window.dispatchEvent(new CustomEvent('stores-updated'));
    return newGrn;
  },

  getSIVs(tenantId: string = 'tenant-riara'): StoreIssueVoucher[] {
    return getStorage<StoreIssueVoucher[]>(STORAGE_KEYS.SIVS, INITIAL_SIVS).filter(s => !tenantId || s.tenantId === tenantId);
  },

  createSIV(sivData: Omit<StoreIssueVoucher, 'id' | 'sivNumber'>): StoreIssueVoucher {
    const sivs = this.getSIVs(sivData.tenantId);
    const newSiv: StoreIssueVoucher = {
      ...sivData,
      id: `siv-${Date.now()}`,
      sivNumber: `SIV-2026-${Math.floor(1000 + Math.random() * 9000)}`
    };
    sivs.unshift(newSiv);
    setStorage(STORAGE_KEYS.SIVS, sivs);

    // Auto deduct physical stock
    const inventory = this.getStoreInventory(sivData.tenantId);
    sivData.items.forEach(item => {
      const stockItem = inventory.find(i => i.id === item.itemId || i.name.toLowerCase() === item.itemName.toLowerCase());
      if (stockItem) {
        stockItem.currentStock = Math.max(0, stockItem.currentStock - item.quantity);
        stockItem.totalValue = stockItem.currentStock * stockItem.unitCost;
      }
    });
    setStorage(STORAGE_KEYS.INVENTORY, inventory);

    this.logOperation({
      tenantId: sivData.tenantId,
      userEmail: sivData.issuedBy,
      userName: sivData.issuedBy,
      userRole: 'storekeeper',
      module: 'Stores',
      actionType: 'STORE_ISSUED',
      description: `Issued SIV ${newSiv.sivNumber} to ${sivData.issuedToName} (${sivData.department}).`,
      referenceId: newSiv.sivNumber,
      amountImpacted: newSiv.totalValue
    });

    window.dispatchEvent(new CustomEvent('stores-updated'));
    return newSiv;
  },

  // =========================================================================
  // 4. HR & PAYROLL
  // =========================================================================
  getEmployees(tenantId: string = 'tenant-riara'): HREmployee[] {
    return getStorage<HREmployee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES).filter(e => !tenantId || e.tenantId === tenantId);
  },

  addEmployee(empData: Omit<HREmployee, 'id'>): HREmployee {
    const employees = this.getEmployees(empData.tenantId);
    const newEmp: HREmployee = {
      ...empData,
      id: `emp-${Date.now()}`
    };
    employees.push(newEmp);
    setStorage(STORAGE_KEYS.EMPLOYEES, employees);

    this.logOperation({
      tenantId: empData.tenantId,
      userEmail: 'hr@edusmart.ac.ke',
      userName: 'HR Manager',
      userRole: 'hr_manager',
      module: 'HR & Payroll',
      actionType: 'EMPLOYEE_ENROLLED',
      description: `Enrolled employee ${newEmp.name} (${newEmp.designation}, ${newEmp.department}).`,
      referenceId: newEmp.employeeNumber
    });

    return newEmp;
  },

  getPayrollRuns(tenantId: string = 'tenant-riara'): MonthlyPayrollRun[] {
    return getStorage<MonthlyPayrollRun[]>(STORAGE_KEYS.PAYROLL_RUNS, INITIAL_PAYROLL_RUNS).filter(p => !tenantId || p.tenantId === tenantId);
  },

  createMonthlyPayrollRun(
    month: string, 
    academicYear: string, 
    preparedBy: string, 
    tenantId: string = 'tenant-riara'
  ): { run: MonthlyPayrollRun; payslips: IndividualPayslip[] } {
    const employees = this.getEmployees(tenantId).filter(e => e.status === 'Active');
    let totalGross = 0;
    let totalPaye = 0;
    let totalNssf = 0;
    let totalNhif = 0;
    let totalHousing = 0;
    let totalNet = 0;

    const runId = `pay-${Date.now()}`;
    const payslips: IndividualPayslip[] = [];

    employees.forEach(emp => {
      const calc = calculateKenyanPayrollDeductions(emp.grossPay);
      totalGross += emp.grossPay;
      totalPaye += calc.paye;
      totalNssf += calc.nssf;
      totalNhif += calc.nhifShif;
      totalHousing += calc.housingLevy;
      totalNet += calc.netPay;

      payslips.push({
        id: `slip-${emp.id}-${Date.now()}`,
        payrollRunId: runId,
        tenantId,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeNumber: emp.employeeNumber,
        kraPin: emp.kraPin,
        month,
        academicYear,
        basicSalary: emp.basicSalary,
        houseAllowance: emp.houseAllowance,
        commuterAllowance: emp.commuterAllowance,
        responsibilityAllowance: emp.responsibilityAllowance,
        grossEarnings: emp.grossPay,
        payeTax: calc.paye,
        nssfDeduction: calc.nssf,
        nhifShifDeduction: calc.nhifShif,
        housingLevyDeduction: calc.housingLevy,
        otherDeductions: 0,
        totalDeductions: calc.totalDeductions,
        netPayable: calc.netPay,
        disbursementStatus: 'Pending'
      });
    });

    const run: MonthlyPayrollRun = {
      id: runId,
      runNumber: `PAY-2026-${Math.floor(100 + Math.random() * 900)}`,
      tenantId,
      payrollMonth: month,
      academicYear,
      term: 'Term 1, 2026',
      totalEmployees: employees.length,
      totalGrossPay: totalGross,
      totalPayeTax: totalPaye,
      totalNssf: totalNssf,
      totalNhifShif: totalNhif,
      totalHousingLevy: totalHousing,
      totalNetPay: totalNet,
      status: 'Finance Audited',
      preparedBy
    };

    const runs = this.getPayrollRuns(tenantId);
    runs.unshift(run);
    setStorage(STORAGE_KEYS.PAYROLL_RUNS, runs);

    const allPayslips = getStorage<IndividualPayslip[]>(STORAGE_KEYS.PAYSLIPS, []);
    allPayslips.push(...payslips);
    setStorage(STORAGE_KEYS.PAYSLIPS, allPayslips);

    this.logOperation({
      tenantId,
      userEmail: preparedBy,
      userName: preparedBy,
      userRole: 'finance_officer',
      module: 'HR & Payroll',
      actionType: 'PAYROLL_GENERATED',
      description: `Drafted monthly payroll for ${month} covering ${employees.length} staff. Net: KES ${totalNet.toLocaleString()}.`,
      referenceId: run.runNumber,
      amountImpacted: totalGross
    });

    window.dispatchEvent(new CustomEvent('hr-updated'));
    return { run, payslips };
  },

  approvePayrollRun(runId: string, approvedBy: string): MonthlyPayrollRun | null {
    const runs = this.getPayrollRuns();
    const idx = runs.findIndex(r => r.id === runId);
    if (idx === -1) return null;

    const run = runs[idx];
    const updated: MonthlyPayrollRun = {
      ...run,
      status: 'Disbursed',
      approvedBy,
      approvalDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      generalLedgerJournalId: `GL-PAY-${run.runNumber}`
    };
    runs[idx] = updated;
    setStorage(STORAGE_KEYS.PAYROLL_RUNS, runs);

    // Update payslips to Disbursed
    const payslips = getStorage<IndividualPayslip[]>(STORAGE_KEYS.PAYSLIPS, []);
    payslips.forEach(p => {
      if (p.payrollRunId === runId) {
        p.disbursementStatus = 'Disbursed via Bank Batch';
        p.disbursementDate = updated.approvalDate;
      }
    });
    setStorage(STORAGE_KEYS.PAYSLIPS, payslips);

    // General Ledger Journal Entry (Debit Salary Expense, Credit Bank)
    const glAccounts = this.getGeneralLedger(run.tenantId);
    const bankAccount = glAccounts.find(a => a.code === '1010');
    if (bankAccount) bankAccount.balance -= run.totalNetPay;
    const salaryExpense = glAccounts.find(a => a.code === '4010');
    if (salaryExpense) salaryExpense.balance += run.totalGrossPay;
    setStorage(STORAGE_KEYS.GL_ACCOUNTS, glAccounts);

    this.logOperation({
      tenantId: run.tenantId,
      userEmail: approvedBy,
      userName: approvedBy,
      userRole: 'head_teacher',
      module: 'HR & Payroll',
      actionType: 'PAYROLL_DISBURSED',
      description: `Executive sign-off on ${run.runNumber} for ${run.payrollMonth}. Bank batch disbursed KES ${run.totalNetPay.toLocaleString()}.`,
      referenceId: run.runNumber,
      amountImpacted: run.totalNetPay
    });

    window.dispatchEvent(new CustomEvent('hr-updated'));
    window.dispatchEvent(new CustomEvent('finance-updated'));
    return updated;
  },

  getPayslipsForEmployee(employeeId: string): IndividualPayslip[] {
    const payslips = getStorage<IndividualPayslip[]>(STORAGE_KEYS.PAYSLIPS, []);
    return payslips.filter(p => p.employeeId === employeeId);
  },

  // =========================================================================
  // 5. AUDIT LOGS
  // =========================================================================
  getOperationsAuditLogs(tenantId: string = 'tenant-riara'): OperationsAuditLog[] {
    return getStorage<OperationsAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS).filter(l => !tenantId || l.tenantId === tenantId);
  },

  logOperation(logData: Omit<OperationsAuditLog, 'id' | 'timestamp'>): OperationsAuditLog {
    const logs = this.getOperationsAuditLogs(logData.tenantId);
    const newLog: OperationsAuditLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    logs.unshift(newLog);
    // Keep last 200 logs
    if (logs.length > 200) logs.length = 200;
    setStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  }
};
