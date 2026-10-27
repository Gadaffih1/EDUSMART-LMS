import type { Express, Request, Response } from 'express';
import { calculateKenyanPayrollDeductions } from '../utils/kenyanPayroll';

interface DbHelpers {
  readServerDb: () => any;
  writeServerDb: (db: any) => void;
}

export function registerOperationsRoutes(app: Express, { readServerDb, writeServerDb }: DbHelpers) {
  // Helper to extract active tenant ID from request headers or query
  const getTenantId = (req: Request): string => {
    return (
      (req.headers['x-tenant-id'] as string) ||
      (req.headers['x-tenant'] as string) ||
      (req.query.tenantId as string) ||
      'tenant-riara'
    );
  };

  // Helper to record an immutable audit log entry
  const recordAuditLog = (
    db: any,
    entry: {
      tenantId: string;
      userEmail?: string;
      userName?: string;
      userRole?: string;
      module: 'Finance' | 'Procurement' | 'Stores' | 'HR & Payroll';
      actionType: string;
      description: string;
      referenceId: string;
      amountImpacted?: number;
    }
  ) => {
    const logs = Array.isArray(db.collections['edusmart_ops_audit_logs_v1'])
      ? db.collections['edusmart_ops_audit_logs_v1']
      : [];

    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: entry.tenantId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userEmail: entry.userEmail || 'system@edusmart.ac.ke',
      userName: entry.userName || 'System Auditor',
      userRole: entry.userRole || 'admin',
      module: entry.module,
      actionType: entry.actionType,
      description: entry.description,
      referenceId: entry.referenceId,
      amountImpacted: entry.amountImpacted || 0,
    };

    logs.unshift(newLog);
    if (logs.length > 300) logs.length = 300;
    db.collections['edusmart_ops_audit_logs_v1'] = logs;
    return newLog;
  };

  // =========================================================================
  // 1. FINANCE & STUDENT BILLING APIS
  // =========================================================================

  // GET /api/finance/fee-structure
  app.get('/api/finance/fee-structure', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const db = readServerDb();
      const structures = Array.isArray(db.collections['edusmart_ops_fee_structures_v1'])
        ? db.collections['edusmart_ops_fee_structures_v1']
        : [];
      const filtered = structures.filter((s: any) => !s.schoolId || s.schoolId === tenantId || s.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve fee structure', message: err?.message });
    }
  });

  // GET /api/finance/invoices
  app.get('/api/finance/invoices', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const db = readServerDb();
      const invoices = Array.isArray(db.collections['edusmart_ops_fee_invoices_v1'])
        ? db.collections['edusmart_ops_fee_invoices_v1']
        : [];

      let filtered = invoices.filter((i: any) => !tenantId || i.tenantId === tenantId);

      if (req.query.studentId) {
        filtered = filtered.filter((i: any) => i.studentId === req.query.studentId);
      }
      if (req.query.grade) {
        const g = parseInt(req.query.grade as string, 10);
        filtered = filtered.filter((i: any) => i.grade === g);
      }
      if (req.query.stream) {
        filtered = filtered.filter((i: any) => String(i.stream).toLowerCase() === String(req.query.stream).toLowerCase());
      }
      if (req.query.term) {
        filtered = filtered.filter((i: any) => String(i.term).toLowerCase().includes(String(req.query.term).toLowerCase()));
      }
      if (req.query.status) {
        filtered = filtered.filter((i: any) => String(i.status).toLowerCase() === String(req.query.status).toLowerCase());
      }

      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve invoices', message: err?.message });
    }
  });

  // POST /api/finance/payments
  app.post('/api/finance/payments', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const {
        invoiceId,
        studentId,
        studentName = 'Student',
        admissionNumber = '',
        amount,
        paymentMethod = 'M-PESA',
        referenceNumber,
        payerName = 'Parent / Guardian',
        payerPhone = '',
        term = 'Term 1, 2026',
        receivedBy = 'Finance Office'
      } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid payment amount is required' });
      }

      const db = readServerDb();
      const payments = Array.isArray(db.collections['edusmart_ops_fee_payments_v1'])
        ? db.collections['edusmart_ops_fee_payments_v1']
        : [];
      const invoices = Array.isArray(db.collections['edusmart_ops_fee_invoices_v1'])
        ? db.collections['edusmart_ops_fee_invoices_v1']
        : [];
      const glAccounts = Array.isArray(db.collections['edusmart_ops_gl_accounts_v1'])
        ? db.collections['edusmart_ops_gl_accounts_v1']
        : [];

      // Create new payment receipt
      const receiptNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPayment = {
        id: `rec-${Date.now()}`,
        receiptNumber,
        tenantId,
        invoiceId,
        studentId,
        studentName,
        admissionNumber,
        amount: Number(amount),
        paymentMethod,
        referenceNumber: referenceNumber || `REF-${Date.now()}`,
        payerName,
        payerPhone,
        paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        receivedBy,
        term,
        academicYear: '2026',
        notes: `Recorded via API (${paymentMethod})`
      };

      payments.unshift(newPayment);
      db.collections['edusmart_ops_fee_payments_v1'] = payments;

      // Update corresponding invoice if found
      const invIdx = invoices.findIndex((i: any) => i.id === invoiceId || i.studentId === studentId);
      if (invIdx !== -1) {
        const inv = invoices[invIdx];
        const newPaid = (inv.paidAmount || 0) + Number(amount);
        const newBalance = Math.max(0, (inv.totalAmount || 0) - newPaid);
        invoices[invIdx] = {
          ...inv,
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newBalance === 0 ? 'Paid in Full' : 'Partially Paid'
        };
        db.collections['edusmart_ops_fee_invoices_v1'] = invoices;
      }

      // Update General Ledger (Debit Bank / Mpesa, Credit Tuition Revenue)
      const targetGlCode = paymentMethod === 'M-PESA' ? '1020' : '1010';
      const bankAccount = glAccounts.find((a: any) => a.code === targetGlCode && (!a.tenantId || a.tenantId === tenantId));
      if (bankAccount) bankAccount.balance = (bankAccount.balance || 0) + Number(amount);

      const revenueAccount = glAccounts.find((a: any) => a.code === '3010' && (!a.tenantId || a.tenantId === tenantId));
      if (revenueAccount) revenueAccount.balance = (revenueAccount.balance || 0) + Number(amount);

      db.collections['edusmart_ops_gl_accounts_v1'] = glAccounts;

      // Audit Log
      recordAuditLog(db, {
        tenantId,
        userEmail: receivedBy,
        userName: receivedBy,
        userRole: 'finance_officer',
        module: 'Finance',
        actionType: 'PAYMENT_RECORDED',
        description: `Payment of KES ${Number(amount).toLocaleString()} recorded for ${studentName} (${paymentMethod} Ref: ${newPayment.referenceNumber}).`,
        referenceId: receiptNumber,
        amountImpacted: Number(amount)
      });

      writeServerDb(db);

      return res.status(201).json({
        success: true,
        message: 'Payment recorded and ledger reconciled successfully',
        receipt: newPayment,
        updatedInvoice: invIdx !== -1 ? invoices[invIdx] : null
      });
    } catch (err: any) {
      console.error('Error in POST /api/finance/payments:', err);
      return res.status(500).json({ error: 'Failed to record fee payment', message: err?.message });
    }
  });

  // GET /api/finance/general-ledger
  app.get('/api/finance/general-ledger', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const db = readServerDb();
      const accounts = Array.isArray(db.collections['edusmart_ops_gl_accounts_v1'])
        ? db.collections['edusmart_ops_gl_accounts_v1']
        : [];
      const filtered = accounts.filter((a: any) => !a.tenantId || a.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve general ledger', message: err?.message });
    }
  });

  // GET /api/finance/budgets
  app.get('/api/finance/budgets', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const db = readServerDb();
      const budgets = Array.isArray(db.collections['edusmart_ops_budgets_v1'])
        ? db.collections['edusmart_ops_budgets_v1']
        : [];
      const filtered = budgets.filter((b: any) => !b.tenantId || b.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve departmental budgets', message: err?.message });
    }
  });

  // =========================================================================
  // 2. PROCUREMENT & PURCHASING APIS
  // =========================================================================

  // GET /api/procurement/requisitions
  app.get('/api/procurement/requisitions', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const db = readServerDb();
      const requisitions = Array.isArray(db.collections['edusmart_ops_requisitions_v1'])
        ? db.collections['edusmart_ops_requisitions_v1']
        : [];
      let filtered = requisitions.filter((r: any) => !r.tenantId || r.tenantId === tenantId);

      if (req.query.department) {
        filtered = filtered.filter((r: any) => String(r.department).toLowerCase() === String(req.query.department).toLowerCase());
      }
      if (req.query.status) {
        filtered = filtered.filter((r: any) => String(r.status).toLowerCase() === String(req.query.status).toLowerCase());
      }

      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve requisitions', message: err?.message });
    }
  });

  // POST /api/procurement/requisitions
  app.post('/api/procurement/requisitions', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const {
        department,
        requestedBy,
        requesterRole = 'Teacher',
        requiredDate,
        priority = 'Medium',
        justification,
        items = [],
        totalEstimatedCost
      } = req.body;

      if (!department || !requestedBy || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required requisition fields (department, requestedBy, items)' });
      }

      const calculatedTotal = totalEstimatedCost || items.reduce((acc: number, item: any) => acc + (item.estimatedTotal || (item.quantity * item.estimatedUnitCost) || 0), 0);
      const db = readServerDb();
      const requisitions = Array.isArray(db.collections['edusmart_ops_requisitions_v1'])
        ? db.collections['edusmart_ops_requisitions_v1']
        : [];

      const reqNumber = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReq = {
        id: `req-${Date.now()}`,
        reqNumber,
        tenantId,
        department,
        requestedBy,
        requesterRole,
        requestDate: new Date().toISOString().substring(0, 10),
        requiredDate: requiredDate || new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10),
        priority,
        justification: justification || 'Academic & operational resources requested',
        items,
        totalEstimatedCost: calculatedTotal,
        status: 'Draft',
        approvalChain: [
          { role: 'Head of Department', approverName: '', status: 'Pending' },
          { role: 'Finance / Bursar', approverName: '', status: 'Pending' },
          { role: 'Head Teacher', approverName: '', status: 'Pending' }
        ]
      };

      requisitions.unshift(newReq);
      db.collections['edusmart_ops_requisitions_v1'] = requisitions;

      recordAuditLog(db, {
        tenantId,
        userEmail: requestedBy,
        userName: requestedBy,
        userRole: requesterRole,
        module: 'Procurement',
        actionType: 'REQUISITION_CREATED',
        description: `Raised Requisition ${reqNumber} for ${department} (Est. KES ${calculatedTotal.toLocaleString()}).`,
        referenceId: reqNumber,
        amountImpacted: calculatedTotal
      });

      writeServerDb(db);
      return res.status(201).json({ success: true, requisition: newReq });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create requisition', message: err?.message });
    }
  });

  // PATCH /api/procurement/requisitions/:id/approval
  app.patch('/api/procurement/requisitions/:id/approval', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;
      const { action = 'Approve', comments, approverRole = 'Head Teacher', approverName = 'Mr. Patrick Kamau' } = req.body;

      const db = readServerDb();
      const requisitions = Array.isArray(db.collections['edusmart_ops_requisitions_v1'])
        ? db.collections['edusmart_ops_requisitions_v1']
        : [];

      const reqIdx = requisitions.findIndex((r: any) => r.id === id || r.reqNumber === id);
      if (reqIdx === -1) {
        return res.status(404).json({ error: 'Requisition not found' });
      }

      const reqObj = requisitions[reqIdx];
      const isApproved = String(action).toLowerCase().includes('approve');
      const stepStatus = isApproved ? 'Approved' : 'Rejected';

      const chain = Array.isArray(reqObj.approvalChain) ? [...reqObj.approvalChain] : [];
      const matchStep = chain.find((c: any) => c.role.toLowerCase().includes(approverRole.toLowerCase()) || approverRole.toLowerCase().includes(c.role.toLowerCase()));

      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      if (matchStep) {
        matchStep.status = stepStatus;
        matchStep.approverName = approverName;
        matchStep.approvedAt = timestamp;
        matchStep.comments = comments || (isApproved ? 'Approved' : 'Rejected');
      } else {
        chain.push({
          role: approverRole,
          approverName,
          approvedAt: timestamp,
          status: stepStatus,
          comments
        });
      }

      let nextStatus = reqObj.status;
      if (!isApproved) {
        nextStatus = 'Rejected';
      } else if (approverRole.toLowerCase().includes('head') || approverRole.toLowerCase().includes('principal') || approverRole.toLowerCase().includes('admin')) {
        nextStatus = 'Head Teacher Approved';
      } else if (approverRole.toLowerCase().includes('finance') || approverRole.toLowerCase().includes('bursar')) {
        nextStatus = 'Finance Cleared';
      } else {
        nextStatus = 'Department Reviewed';
      }

      reqObj.approvalChain = chain;
      reqObj.status = nextStatus;
      requisitions[reqIdx] = reqObj;
      db.collections['edusmart_ops_requisitions_v1'] = requisitions;

      recordAuditLog(db, {
        tenantId: reqObj.tenantId || tenantId,
        userEmail: approverName,
        userName: approverName,
        userRole: approverRole,
        module: 'Procurement',
        actionType: isApproved ? 'REQUISITION_APPROVED' : 'REQUISITION_REJECTED',
        description: `${approverRole} ${approverName} ${stepStatus.toLowerCase()} ${reqObj.reqNumber}.`,
        referenceId: reqObj.reqNumber,
        amountImpacted: reqObj.totalEstimatedCost
      });

      writeServerDb(db);
      return res.json({ success: true, message: `Requisition ${stepStatus.toLowerCase()}`, requisition: reqObj });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to process requisition approval', message: err?.message });
    }
  });

  // POST /api/procurement/purchase-orders
  app.post('/api/procurement/purchase-orders', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const {
        requisitionId,
        vendorId = 'sup-1',
        vendorName = 'Text Book Centre Ltd',
        vendorPhone = '+254 722 203 400',
        orderDate = new Date().toISOString().substring(0, 10),
        deliveryDueDate = new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10),
        items = [],
        paymentTerms = '30 Days Net after Inspection & Goods Received Note',
        deliveryLocation = 'Main Central Stores',
        authorizedBy = 'Mr. Patrick Kamau (Principal)'
      } = req.body;

      const db = readServerDb();
      const lpos = Array.isArray(db.collections['edusmart_ops_lpos_v1'])
        ? db.collections['edusmart_ops_lpos_v1']
        : [];
      const requisitions = Array.isArray(db.collections['edusmart_ops_requisitions_v1'])
        ? db.collections['edusmart_ops_requisitions_v1']
        : [];
      const budgets = Array.isArray(db.collections['edusmart_ops_budgets_v1'])
        ? db.collections['edusmart_ops_budgets_v1']
        : [];

      // Calculate totals
      let subtotal = 0;
      const orderItems = items.map((item: any) => {
        const qty = item.quantity || 1;
        const unitPrice = item.unitPrice || item.estimatedUnitCost || 0;
        const total = qty * unitPrice;
        subtotal += total;
        return {
          description: item.description,
          quantity: qty,
          unit: item.unit || 'Units',
          unitPrice,
          totalPrice: total
        };
      });

      const taxVat = Math.round(subtotal * 0.16);
      const totalAmount = subtotal + taxVat;

      const lpoNumber = `LPO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newLpo = {
        id: `lpo-${Date.now()}`,
        lpoNumber,
        tenantId,
        requisitionId: requisitionId || '',
        vendorId,
        vendorName,
        vendorPhone,
        orderDate,
        deliveryDueDate,
        items: orderItems,
        subtotal,
        taxVat,
        totalAmount,
        paymentTerms,
        deliveryLocation,
        authorizedBy,
        status: 'Issued'
      };

      lpos.unshift(newLpo);
      db.collections['edusmart_ops_lpos_v1'] = lpos;

      // Update requisition status if provided
      if (requisitionId) {
        const req = requisitions.find((r: any) => r.id === requisitionId || r.reqNumber === requisitionId);
        if (req) {
          req.status = 'LPO Created';
          db.collections['edusmart_ops_requisitions_v1'] = requisitions;

          // Departmental budget commitment update
          const bgt = budgets.find((b: any) => b.department.toLowerCase() === req.department.toLowerCase() && (!b.tenantId || b.tenantId === tenantId));
          if (bgt) {
            bgt.committedAmount = (bgt.committedAmount || 0) + totalAmount;
            bgt.remainingAmount = Math.max(0, (bgt.allocatedAmount || 0) - (bgt.spentAmount || 0) - bgt.committedAmount);
            db.collections['edusmart_ops_budgets_v1'] = budgets;
          }
        }
      }

      recordAuditLog(db, {
        tenantId,
        userEmail: authorizedBy,
        userName: authorizedBy,
        userRole: 'finance_officer',
        module: 'Procurement',
        actionType: 'LPO_ISSUED',
        description: `Issued Local Purchase Order ${lpoNumber} to ${vendorName} (Amount: KES ${totalAmount.toLocaleString()}).`,
        referenceId: lpoNumber,
        amountImpacted: totalAmount
      });

      writeServerDb(db);
      return res.status(201).json({ success: true, purchaseOrder: newLpo });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create purchase order', message: err?.message });
    }
  });

  // =========================================================================
  // 3. STORES & INVENTORY APIS
  // =========================================================================

  // GET /api/stores/inventory
  app.get('/api/stores/inventory', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const db = readServerDb();
      const inventory = Array.isArray(db.collections['edusmart_ops_inventory_v1'])
        ? db.collections['edusmart_ops_inventory_v1']
        : [];
      const filtered = inventory.filter((i: any) => !i.tenantId || i.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve store inventory', message: err?.message });
    }
  });

  // POST /api/stores/grn
  app.post('/api/stores/grn', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const {
        lpoId = '',
        lpoNumber = '',
        vendorName = 'Supplier',
        deliveryNoteNumber = 'DN-001',
        receivedDate = new Date().toISOString().substring(0, 10),
        receivedBy = 'Mr. Joseph Otieno (Storekeeper)',
        inspectedBy = 'Mrs. Lydia Muthoni',
        inspectionPassed = true,
        itemsReceived = [],
        remarks = 'Delivered and verified in good order.'
      } = req.body;

      const db = readServerDb();
      const grns = Array.isArray(db.collections['edusmart_ops_grns_v1'])
        ? db.collections['edusmart_ops_grns_v1']
        : [];
      const inventory = Array.isArray(db.collections['edusmart_ops_inventory_v1'])
        ? db.collections['edusmart_ops_inventory_v1']
        : [];
      const lpos = Array.isArray(db.collections['edusmart_ops_lpos_v1'])
        ? db.collections['edusmart_ops_lpos_v1']
        : [];

      let totalAcceptedValue = 0;
      itemsReceived.forEach((item: any) => {
        const accepted = item.acceptedQty || item.receivedQty || 0;
        const cost = item.unitCost || 0;
        totalAcceptedValue += accepted * cost;

        // Increment inventory
        const stockItem = inventory.find((i: any) => (item.itemId && i.id === item.itemId) || (item.itemName && i.name.toLowerCase() === item.itemName.toLowerCase()));
        if (stockItem) {
          stockItem.currentStock = (stockItem.currentStock || 0) + accepted;
          stockItem.totalValue = stockItem.currentStock * stockItem.unitCost;
          stockItem.lastRestockedDate = receivedDate;
        }
      });

      db.collections['edusmart_ops_inventory_v1'] = inventory;

      const grnNumber = `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newGrn = {
        id: `grn-${Date.now()}`,
        grnNumber,
        tenantId,
        lpoId,
        lpoNumber,
        vendorName,
        deliveryNoteNumber,
        receivedDate,
        receivedBy,
        inspectedBy,
        inspectionPassed,
        itemsReceived,
        totalAcceptedValue,
        remarks
      };

      grns.unshift(newGrn);
      db.collections['edusmart_ops_grns_v1'] = grns;

      // Update matched LPO status to Fulfilled
      if (lpoId || lpoNumber) {
        const lpo = lpos.find((l: any) => l.id === lpoId || l.lpoNumber === lpoNumber);
        if (lpo) {
          lpo.status = 'Fulfilled';
          db.collections['edusmart_ops_lpos_v1'] = lpos;
        }
      }

      recordAuditLog(db, {
        tenantId,
        userEmail: receivedBy,
        userName: receivedBy,
        userRole: 'storekeeper',
        module: 'Stores',
        actionType: 'GRN_ACCEPTED',
        description: `Received ${grnNumber} against ${lpoNumber || 'LPO'} from ${vendorName}. Physical stock updated.`,
        referenceId: grnNumber,
        amountImpacted: totalAcceptedValue
      });

      writeServerDb(db);
      return res.status(201).json({ success: true, grn: newGrn });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create GRN', message: err?.message });
    }
  });

  // POST /api/stores/issues
  app.post('/api/stores/issues', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const {
        issuedToName,
        issuedToRole = 'Teacher',
        department = 'Academics',
        purpose = 'Instructional use',
        issuedBy = 'Mr. Joseph Otieno (Chief Storekeeper)',
        items = []
      } = req.body;

      if (!issuedToName || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required issue voucher fields (issuedToName, items)' });
      }

      const db = readServerDb();
      const sivs = Array.isArray(db.collections['edusmart_ops_sivs_v1'])
        ? db.collections['edusmart_ops_sivs_v1']
        : [];
      const inventory = Array.isArray(db.collections['edusmart_ops_inventory_v1'])
        ? db.collections['edusmart_ops_inventory_v1']
        : [];

      let totalValue = 0;
      const sivItems = items.map((item: any) => {
        const qty = item.quantity || 1;
        const stockItem = inventory.find((i: any) => (item.itemId && i.id === item.itemId) || (item.itemName && i.name.toLowerCase() === item.itemName.toLowerCase()));
        const unitCost = item.unitCost || stockItem?.unitCost || 0;
        const totalCost = qty * unitCost;
        totalValue += totalCost;

        if (stockItem) {
          stockItem.currentStock = Math.max(0, (stockItem.currentStock || 0) - qty);
          stockItem.totalValue = stockItem.currentStock * stockItem.unitCost;
        }

        return {
          itemId: item.itemId || stockItem?.id || `item-${Date.now()}`,
          itemName: item.itemName || stockItem?.name || 'Store Item',
          quantity: qty,
          unit: item.unit || stockItem?.unit || 'Pcs',
          unitCost,
          totalCost
        };
      });

      db.collections['edusmart_ops_inventory_v1'] = inventory;

      const sivNumber = `SIV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newSiv = {
        id: `siv-${Date.now()}`,
        sivNumber,
        tenantId,
        issueDate: new Date().toISOString().substring(0, 10),
        issuedToName,
        issuedToRole,
        department,
        purpose,
        issuedBy,
        items: sivItems,
        totalValue,
        status: 'Dispatched & Signed'
      };

      sivs.unshift(newSiv);
      db.collections['edusmart_ops_sivs_v1'] = sivs;

      recordAuditLog(db, {
        tenantId,
        userEmail: issuedBy,
        userName: issuedBy,
        userRole: 'storekeeper',
        module: 'Stores',
        actionType: 'STORE_ISSUED',
        description: `Issued SIV ${sivNumber} to ${issuedToName} (${department}).`,
        referenceId: sivNumber,
        amountImpacted: totalValue
      });

      writeServerDb(db);
      return res.status(201).json({ success: true, siv: newSiv });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to issue store items', message: err?.message });
    }
  });

  // =========================================================================
  // 4. HR & PAYROLL APIS (KENYAN STATUTORY CBC COMPLIANT)
  // =========================================================================

  // GET /api/hr/employees
  app.get('/api/hr/employees', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const db = readServerDb();
      const employees = Array.isArray(db.collections['edusmart_ops_employees_v1'])
        ? db.collections['edusmart_ops_employees_v1']
        : [];
      const filtered = employees.filter((e: any) => !e.tenantId || e.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve employees', message: err?.message });
    }
  });

  // POST /api/hr/payroll/run
  app.post('/api/hr/payroll/run', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const {
        month = 'March 2026',
        academicYear = '2026',
        preparedBy = 'Mr. David Mwangi (Bursar)'
      } = req.body;

      const db = readServerDb();
      const employees = Array.isArray(db.collections['edusmart_ops_employees_v1'])
        ? db.collections['edusmart_ops_employees_v1']
        : [];
      const activeStaff = employees.filter((e: any) => (!e.tenantId || e.tenantId === tenantId) && e.status === 'Active');

      if (activeStaff.length === 0) {
        return res.status(400).json({ error: 'No active employees found to generate payroll' });
      }

      let totalGross = 0;
      let totalPaye = 0;
      let totalNssf = 0;
      let totalNhif = 0;
      let totalHousing = 0;
      let totalNet = 0;

      const runId = `pay-${Date.now()}`;
      const payslips: any[] = [];

      activeStaff.forEach((emp: any) => {
        const gross = Number(emp.grossPay) || ((Number(emp.basicSalary) || 0) + (Number(emp.houseAllowance) || 0) + (Number(emp.commuterAllowance) || 0) + (Number(emp.responsibilityAllowance) || 0));
        const deductions = calculateKenyanPayrollDeductions(gross);

        totalGross += gross;
        totalPaye += deductions.paye;
        totalNssf += deductions.nssf;
        totalNhif += deductions.nhifShif;
        totalHousing += deductions.housingLevy;
        totalNet += deductions.netPay;

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
          basicSalary: Number(emp.basicSalary) || 0,
          houseAllowance: Number(emp.houseAllowance) || 0,
          commuterAllowance: Number(emp.commuterAllowance) || 0,
          responsibilityAllowance: Number(emp.responsibilityAllowance) || 0,
          grossEarnings: gross,
          payeTax: deductions.paye,
          nssfDeduction: deductions.nssf,
          nhifShifDeduction: deductions.nhifShif,
          housingLevyDeduction: deductions.housingLevy,
          otherDeductions: 0,
          totalDeductions: deductions.totalDeductions,
          netPayable: deductions.netPay,
          disbursementStatus: 'Pending'
        });
      });

      const runs = Array.isArray(db.collections['edusmart_ops_payroll_runs_v1'])
        ? db.collections['edusmart_ops_payroll_runs_v1']
        : [];
      const runNumber = `PAY-2026-${Math.floor(100 + Math.random() * 900)}`;

      const newRun = {
        id: runId,
        runNumber,
        tenantId,
        payrollMonth: month,
        academicYear,
        term: 'Term 1, 2026',
        totalEmployees: activeStaff.length,
        totalGrossPay: totalGross,
        totalPayeTax: totalPaye,
        totalNssf: totalNssf,
        totalNhifShif: totalNhif,
        totalHousingLevy: totalHousing,
        totalNetPay: totalNet,
        status: 'Finance Audited',
        preparedBy
      };

      runs.unshift(newRun);
      db.collections['edusmart_ops_payroll_runs_v1'] = runs;

      const existingPayslips = Array.isArray(db.collections['edusmart_ops_payslips_v1'])
        ? db.collections['edusmart_ops_payslips_v1']
        : [];
      existingPayslips.push(...payslips);
      db.collections['edusmart_ops_payslips_v1'] = existingPayslips;

      recordAuditLog(db, {
        tenantId,
        userEmail: preparedBy,
        userName: preparedBy,
        userRole: 'finance_officer',
        module: 'HR & Payroll',
        actionType: 'PAYROLL_GENERATED',
        description: `Drafted monthly payroll for ${month} covering ${activeStaff.length} staff. Net: KES ${totalNet.toLocaleString()}.`,
        referenceId: runNumber,
        amountImpacted: totalGross
      });

      writeServerDb(db);
      return res.status(201).json({ success: true, run: newRun, payslipsCount: payslips.length });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to run payroll', message: err?.message });
    }
  });

  // POST /api/hr/payroll/:id/approve
  app.post('/api/hr/payroll/:id/approve', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const { id } = req.params;
      const { approvedBy = 'Mr. Patrick Kamau (Head Teacher)' } = req.body;

      const db = readServerDb();
      const runs = Array.isArray(db.collections['edusmart_ops_payroll_runs_v1'])
        ? db.collections['edusmart_ops_payroll_runs_v1']
        : [];
      const payslips = Array.isArray(db.collections['edusmart_ops_payslips_v1'])
        ? db.collections['edusmart_ops_payslips_v1']
        : [];
      const glAccounts = Array.isArray(db.collections['edusmart_ops_gl_accounts_v1'])
        ? db.collections['edusmart_ops_gl_accounts_v1']
        : [];

      const runIdx = runs.findIndex((r: any) => r.id === id || r.runNumber === id);
      if (runIdx === -1) {
        return res.status(404).json({ error: 'Payroll run not found' });
      }

      const run = runs[runIdx];
      const approvalDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
      run.status = 'Disbursed';
      run.approvedBy = approvedBy;
      run.approvalDate = approvalDate;
      run.generalLedgerJournalId = `GL-PAY-${run.runNumber}`;
      runs[runIdx] = run;
      db.collections['edusmart_ops_payroll_runs_v1'] = runs;

      // Update payslips for this run
      payslips.forEach((p: any) => {
        if (p.payrollRunId === run.id) {
          p.disbursementStatus = 'Disbursed via Bank Batch';
          p.disbursementDate = approvalDate;
        }
      });
      db.collections['edusmart_ops_payslips_v1'] = payslips;

      // Update General Ledger (Debit Salary Expense Code 4010, Credit Main Bank Code 1010)
      const bankAccount = glAccounts.find((a: any) => a.code === '1010' && (!a.tenantId || a.tenantId === tenantId));
      if (bankAccount) bankAccount.balance = (bankAccount.balance || 0) - run.totalNetPay;

      const salaryExpense = glAccounts.find((a: any) => a.code === '4010' && (!a.tenantId || a.tenantId === tenantId));
      if (salaryExpense) salaryExpense.balance = (salaryExpense.balance || 0) + run.totalGrossPay;

      db.collections['edusmart_ops_gl_accounts_v1'] = glAccounts;

      recordAuditLog(db, {
        tenantId: run.tenantId || tenantId,
        userEmail: approvedBy,
        userName: approvedBy,
        userRole: 'head_teacher',
        module: 'HR & Payroll',
        actionType: 'PAYROLL_DISBURSED',
        description: `Executive sign-off on ${run.runNumber} for ${run.payrollMonth}. Bank batch disbursed KES ${run.totalNetPay.toLocaleString()}.`,
        referenceId: run.runNumber,
        amountImpacted: run.totalNetPay
      });

      writeServerDb(db);
      return res.json({ success: true, message: 'Payroll approved and disbursed', run });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to approve payroll run', message: err?.message });
    }
  });

  // GET /api/hr/payslips/:employeeId
  app.get('/api/hr/payslips/:employeeId', (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const db = readServerDb();
      const payslips = Array.isArray(db.collections['edusmart_ops_payslips_v1'])
        ? db.collections['edusmart_ops_payslips_v1']
        : [];
      const employeePayslips = payslips.filter((p: any) => p.employeeId === employeeId || p.employeeNumber === employeeId);
      return res.json({ success: true, employeeId, count: employeePayslips.length, data: employeePayslips });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve employee payslips', message: err?.message });
    }
  });

  // =========================================================================
  // 5. AUDIT LOGS API
  // =========================================================================
  app.get('/api/operations/audit-logs', (req: Request, res: Response) => {
    try {
      const tenantId = getTenantId(req);
      const db = readServerDb();
      const logs = Array.isArray(db.collections['edusmart_ops_audit_logs_v1'])
        ? db.collections['edusmart_ops_audit_logs_v1']
        : [];
      const filtered = logs.filter((l: any) => !l.tenantId || l.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve audit logs', message: err?.message });
    }
  });
}
