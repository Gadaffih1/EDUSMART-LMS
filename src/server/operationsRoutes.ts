import type { Express, Request, Response } from 'express';
import { calculateKenyanPayrollDeductions } from '../utils/kenyanPayroll';
import { getDb } from './db';
import { ingestCollectionData, resolveRecordId } from './migrate';
import { requireAuth, resolveAuthorizedTenantId } from './authRoutes';
import { broadcastChange } from './realtimeBus';
import { readCollectionForTenant } from './dataRoutes';

export function registerOperationsRoutes(app: Express) {
  const readOpsCollection = (collectionKey: string, tenantId: string): any[] => {
    const rows = readCollectionForTenant(collectionKey, tenantId, false);
    return Array.isArray(rows) ? rows : [];
  };

  const saveOpsCollection = (collectionKey: string, tenantId: string, records: any[]) => {
    const db = getDb();
    ingestCollectionData(db, collectionKey, records, false);
    broadcastChange({
      type: 'collection:updated',
      collection: collectionKey,
      tenantId,
      timestamp: new Date().toISOString(),
    });
  };

  const recordAuditLog = (entry: {
    tenantId: string;
    userEmail?: string;
    userName?: string;
    userRole?: string;
    module: 'Finance' | 'Procurement' | 'Stores' | 'HR & Payroll';
    actionType: string;
    description: string;
    referenceId: string;
    amountImpacted?: number;
  }) => {
    const db = getDb();
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

    ingestCollectionData(db, 'edusmart_ops_audit_logs_v1', [newLog], false);
    return newLog;
  };

  // =========================================================================
  // 1. FINANCE & STUDENT BILLING APIS
  // =========================================================================

  app.get('/api/finance/fee-structure', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const structures = readOpsCollection('edusmart_ops_fee_structures_v1', tenantId);
      const filtered = structures.filter((s: any) => !s.schoolId || s.schoolId === tenantId || s.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve fee structure', message: err?.message });
    }
  });

  app.get('/api/finance/invoices', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const invoices = readOpsCollection('edusmart_ops_fee_invoices_v1', tenantId);
      let filtered = invoices.filter((i: any) => !i.tenantId || i.tenantId === tenantId);

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

  app.post('/api/finance/payments', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;

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
        receivedBy = 'Finance Office',
      } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid payment amount is required' });
      }

      const db = getDb();
      const invoices = readOpsCollection('edusmart_ops_fee_invoices_v1', tenantId);
      const glAccounts = readOpsCollection('edusmart_ops_gl_accounts_v1', tenantId);

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
        notes: `Recorded via API (${paymentMethod})`,
      };

      let updatedInvoice: any = null;
      db.exec('BEGIN IMMEDIATE');
      try {
        ingestCollectionData(db, 'edusmart_ops_fee_payments_v1', [newPayment], false);

        const invIdx = invoices.findIndex((i: any) => i.id === invoiceId || i.studentId === studentId);
        if (invIdx !== -1) {
          const inv = invoices[invIdx];
          const newPaid = (inv.paidAmount || 0) + Number(amount);
          const newBalance = Math.max(0, (inv.totalAmount || 0) - newPaid);
          updatedInvoice = {
            ...inv,
            tenantId: inv.tenantId || tenantId,
            paidAmount: newPaid,
            balanceAmount: newBalance,
            status: newBalance === 0 ? 'Paid in Full' : 'Partially Paid',
          };
          ingestCollectionData(db, 'edusmart_ops_fee_invoices_v1', [updatedInvoice], false);
        }

        const targetGlCode = paymentMethod === 'M-PESA' ? '1020' : '1010';
        const updatedGl: any[] = [];
        const bankAccount = glAccounts.find((a: any) => a.code === targetGlCode && (!a.tenantId || a.tenantId === tenantId));
        if (bankAccount) {
          bankAccount.balance = (bankAccount.balance || 0) + Number(amount);
          updatedGl.push(bankAccount);
        }
        const revenueAccount = glAccounts.find((a: any) => a.code === '3010' && (!a.tenantId || a.tenantId === tenantId));
        if (revenueAccount) {
          revenueAccount.balance = (revenueAccount.balance || 0) + Number(amount);
          updatedGl.push(revenueAccount);
        }
        if (updatedGl.length) {
          ingestCollectionData(db, 'edusmart_ops_gl_accounts_v1', updatedGl, false);
        }

        recordAuditLog({
          tenantId,
          userEmail: receivedBy,
          userName: receivedBy,
          userRole: 'finance_officer',
          module: 'Finance',
          actionType: 'PAYMENT_RECORDED',
          description: `Payment of KES ${Number(amount).toLocaleString()} recorded for ${studentName} (${paymentMethod} Ref: ${newPayment.referenceNumber}).`,
          referenceId: receiptNumber,
          amountImpacted: Number(amount),
        });

        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      const now = new Date().toISOString();
      broadcastChange({ type: 'collection:updated', collection: 'edusmart_ops_fee_payments_v1', tenantId, timestamp: now });
      if (updatedInvoice) {
        broadcastChange({ type: 'collection:updated', collection: 'edusmart_ops_fee_invoices_v1', tenantId, timestamp: now });
      }

      return res.status(201).json({
        success: true,
        message: 'Payment recorded and ledger reconciled successfully',
        receipt: newPayment,
        updatedInvoice,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to record fee payment', message: err?.message });
    }
  });

  app.get('/api/finance/general-ledger', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const accounts = readOpsCollection('edusmart_ops_gl_accounts_v1', tenantId);
      const filtered = accounts.filter((a: any) => !a.tenantId || a.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve general ledger', message: err?.message });
    }
  });

  app.get('/api/finance/budgets', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const budgets = readOpsCollection('edusmart_ops_budgets_v1', tenantId);
      const filtered = budgets.filter((b: any) => !b.tenantId || b.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve departmental budgets', message: err?.message });
    }
  });

  // =========================================================================
  // 2. PROCUREMENT & PURCHASING APIS
  // =========================================================================

  app.get('/api/procurement/requisitions', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const requisitions = readOpsCollection('edusmart_ops_requisitions_v1', tenantId);
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

  app.post('/api/procurement/requisitions', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const {
        department,
        requestedBy,
        requesterRole = 'Teacher',
        requiredDate,
        priority = 'Medium',
        justification,
        items = [],
        totalEstimatedCost,
      } = req.body;

      if (!department || !requestedBy || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required requisition fields (department, requestedBy, items)' });
      }

      const calculatedTotal =
        totalEstimatedCost ||
        items.reduce((acc: number, item: any) => acc + (item.estimatedTotal || item.quantity * item.estimatedUnitCost || 0), 0);

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
          { role: 'Head Teacher', approverName: '', status: 'Pending' },
        ],
      };

      const db = getDb();
      db.exec('BEGIN IMMEDIATE');
      try {
        ingestCollectionData(db, 'edusmart_ops_requisitions_v1', [newReq], false);
        recordAuditLog({
          tenantId,
          userEmail: requestedBy,
          userName: requestedBy,
          userRole: requesterRole,
          module: 'Procurement',
          actionType: 'REQUISITION_CREATED',
          description: `Raised Requisition ${reqNumber} for ${department} (Est. KES ${calculatedTotal.toLocaleString()}).`,
          referenceId: reqNumber,
          amountImpacted: calculatedTotal,
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      broadcastChange({ type: 'collection:updated', collection: 'edusmart_ops_requisitions_v1', tenantId, timestamp: new Date().toISOString() });
      return res.status(201).json({ success: true, requisition: newReq });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create requisition', message: err?.message });
    }
  });

  app.patch('/api/procurement/requisitions/:id/approval', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const { id } = req.params;
      const { action = 'Approve', comments, approverRole = 'Head Teacher', approverName = 'Principal' } = req.body;

      const requisitions = readOpsCollection('edusmart_ops_requisitions_v1', tenantId);
      const reqObj = requisitions.find((r: any) => r.id === id || r.reqNumber === id);
      if (!reqObj) return res.status(404).json({ error: 'Requisition not found' });

      const isApproved = String(action).toLowerCase().includes('approve');
      const stepStatus = isApproved ? 'Approved' : 'Rejected';
      const chain = Array.isArray(reqObj.approvalChain) ? [...reqObj.approvalChain] : [];
      const matchStep = chain.find(
        (c: any) => c.role.toLowerCase().includes(approverRole.toLowerCase()) || approverRole.toLowerCase().includes(c.role.toLowerCase())
      );
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      if (matchStep) {
        matchStep.status = stepStatus;
        matchStep.approverName = approverName;
        matchStep.approvedAt = timestamp;
        matchStep.comments = comments || (isApproved ? 'Approved' : 'Rejected');
      } else {
        chain.push({ role: approverRole, approverName, approvedAt: timestamp, status: stepStatus, comments });
      }

      let nextStatus = reqObj.status;
      if (!isApproved) nextStatus = 'Rejected';
      else if (approverRole.toLowerCase().includes('head') || approverRole.toLowerCase().includes('principal') || approverRole.toLowerCase().includes('admin')) {
        nextStatus = 'Head Teacher Approved';
      } else if (approverRole.toLowerCase().includes('finance') || approverRole.toLowerCase().includes('bursar')) {
        nextStatus = 'Finance Cleared';
      } else {
        nextStatus = 'Department Reviewed';
      }

      const updatedReq = { ...reqObj, approvalChain: chain, status: nextStatus, tenantId: reqObj.tenantId || tenantId };
      saveOpsCollection('edusmart_ops_requisitions_v1', tenantId, [updatedReq]);
      recordAuditLog({
        tenantId,
        userEmail: approverName,
        userName: approverName,
        userRole: approverRole,
        module: 'Procurement',
        actionType: isApproved ? 'REQUISITION_APPROVED' : 'REQUISITION_REJECTED',
        description: `${approverRole} ${approverName} ${stepStatus.toLowerCase()} ${reqObj.reqNumber}.`,
        referenceId: reqObj.reqNumber,
        amountImpacted: reqObj.totalEstimatedCost,
      });

      return res.json({ success: true, message: `Requisition ${stepStatus.toLowerCase()}`, requisition: updatedReq });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to process requisition approval', message: err?.message });
    }
  });

  app.post('/api/procurement/purchase-orders', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
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
        authorizedBy = 'Principal',
      } = req.body;

      const requisitions = readOpsCollection('edusmart_ops_requisitions_v1', tenantId);
      const budgets = readOpsCollection('edusmart_ops_budgets_v1', tenantId);

      let subtotal = 0;
      const orderItems = items.map((item: any) => {
        const qty = item.quantity || 1;
        const unitPrice = item.unitPrice || item.estimatedUnitCost || 0;
        const total = qty * unitPrice;
        subtotal += total;
        return { description: item.description, quantity: qty, unit: item.unit || 'Units', unitPrice, totalPrice: total };
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
        status: 'Issued',
      };

      const db = getDb();
      db.exec('BEGIN IMMEDIATE');
      try {
        ingestCollectionData(db, 'edusmart_ops_lpos_v1', [newLpo], false);
        if (requisitionId) {
          const matchedReq = requisitions.find((r: any) => r.id === requisitionId || r.reqNumber === requisitionId);
          if (matchedReq) {
            matchedReq.status = 'LPO Created';
            ingestCollectionData(db, 'edusmart_ops_requisitions_v1', [matchedReq], false);
            const bgt = budgets.find((b: any) => b.department.toLowerCase() === matchedReq.department.toLowerCase());
            if (bgt) {
              bgt.committedAmount = (bgt.committedAmount || 0) + totalAmount;
              bgt.remainingAmount = Math.max(0, (bgt.allocatedAmount || 0) - (bgt.spentAmount || 0) - bgt.committedAmount);
              ingestCollectionData(db, 'edusmart_ops_budgets_v1', [bgt], false);
            }
          }
        }
        recordAuditLog({
          tenantId,
          userEmail: authorizedBy,
          userName: authorizedBy,
          userRole: 'finance_officer',
          module: 'Procurement',
          actionType: 'LPO_ISSUED',
          description: `Issued Local Purchase Order ${lpoNumber} to ${vendorName} (Amount: KES ${totalAmount.toLocaleString()}).`,
          referenceId: lpoNumber,
          amountImpacted: totalAmount,
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      broadcastChange({ type: 'collection:updated', collection: 'edusmart_ops_lpos_v1', tenantId, timestamp: new Date().toISOString() });
      return res.status(201).json({ success: true, purchaseOrder: newLpo });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create purchase order', message: err?.message });
    }
  });

  // =========================================================================
  // 3. STORES & INVENTORY APIS
  // =========================================================================

  app.get('/api/stores/inventory', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const inventory = readOpsCollection('edusmart_ops_inventory_v1', tenantId);
      const filtered = inventory.filter((i: any) => !i.tenantId || i.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve store inventory', message: err?.message });
    }
  });

  app.post('/api/stores/grn', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const {
        lpoId = '',
        lpoNumber = '',
        vendorName = 'Supplier',
        deliveryNoteNumber = 'DN-001',
        receivedDate = new Date().toISOString().substring(0, 10),
        receivedBy = 'Storekeeper',
        inspectedBy = 'Inspector',
        inspectionPassed = true,
        itemsReceived = [],
        remarks = 'Delivered and verified in good order.',
      } = req.body;

      const inventory = readOpsCollection('edusmart_ops_inventory_v1', tenantId);
      const lpos = readOpsCollection('edusmart_ops_lpos_v1', tenantId);

      let totalAcceptedValue = 0;
      const updatedStock: any[] = [];
      itemsReceived.forEach((item: any) => {
        const accepted = item.acceptedQty || item.receivedQty || 0;
        const cost = item.unitCost || 0;
        totalAcceptedValue += accepted * cost;
        const stockItem = inventory.find(
          (i: any) => (item.itemId && i.id === item.itemId) || (item.itemName && i.name.toLowerCase() === item.itemName.toLowerCase())
        );
        if (stockItem) {
          stockItem.currentStock = (stockItem.currentStock || 0) + accepted;
          stockItem.totalValue = stockItem.currentStock * stockItem.unitCost;
          stockItem.lastRestockedDate = receivedDate;
          updatedStock.push(stockItem);
        }
      });

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
        remarks,
      };

      const db = getDb();
      db.exec('BEGIN IMMEDIATE');
      try {
        ingestCollectionData(db, 'edusmart_ops_grns_v1', [newGrn], false);
        if (updatedStock.length) ingestCollectionData(db, 'edusmart_ops_inventory_v1', updatedStock, false);
        if (lpoId || lpoNumber) {
          const lpo = lpos.find((l: any) => l.id === lpoId || l.lpoNumber === lpoNumber);
          if (lpo) {
            lpo.status = 'Fulfilled';
            ingestCollectionData(db, 'edusmart_ops_lpos_v1', [lpo], false);
          }
        }
        recordAuditLog({
          tenantId,
          userEmail: receivedBy,
          userName: receivedBy,
          userRole: 'storekeeper',
          module: 'Stores',
          actionType: 'GRN_ACCEPTED',
          description: `Received ${grnNumber} against ${lpoNumber || 'LPO'} from ${vendorName}. Physical stock updated.`,
          referenceId: grnNumber,
          amountImpacted: totalAcceptedValue,
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      broadcastChange({ type: 'collection:updated', collection: 'edusmart_ops_inventory_v1', tenantId, timestamp: new Date().toISOString() });
      return res.status(201).json({ success: true, grn: newGrn });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create GRN', message: err?.message });
    }
  });

  app.post('/api/stores/issues', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const { issuedToName, issuedToRole = 'Teacher', department = 'Academics', purpose = 'Instructional use', issuedBy = 'Storekeeper', items = [] } = req.body;
      if (!issuedToName || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required issue voucher fields (issuedToName, items)' });
      }

      const inventory = readOpsCollection('edusmart_ops_inventory_v1', tenantId);
      let totalValue = 0;
      const updatedStock: any[] = [];
      const sivItems = items.map((item: any) => {
        const qty = item.quantity || 1;
        const stockItem = inventory.find(
          (i: any) => (item.itemId && i.id === item.itemId) || (item.itemName && i.name.toLowerCase() === item.itemName.toLowerCase())
        );
        const unitCost = item.unitCost || stockItem?.unitCost || 0;
        const totalCost = qty * unitCost;
        totalValue += totalCost;
        if (stockItem) {
          stockItem.currentStock = Math.max(0, (stockItem.currentStock || 0) - qty);
          stockItem.totalValue = stockItem.currentStock * stockItem.unitCost;
          updatedStock.push(stockItem);
        }
        return {
          itemId: item.itemId || stockItem?.id || `item-${Date.now()}`,
          itemName: item.itemName || stockItem?.name || 'Store Item',
          quantity: qty,
          unit: item.unit || stockItem?.unit || 'Pcs',
          unitCost,
          totalCost,
        };
      });

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
        status: 'Dispatched & Signed',
      };

      const db = getDb();
      db.exec('BEGIN IMMEDIATE');
      try {
        ingestCollectionData(db, 'edusmart_ops_sivs_v1', [newSiv], false);
        if (updatedStock.length) ingestCollectionData(db, 'edusmart_ops_inventory_v1', updatedStock, false);
        recordAuditLog({
          tenantId,
          userEmail: issuedBy,
          userName: issuedBy,
          userRole: 'storekeeper',
          module: 'Stores',
          actionType: 'STORE_ISSUED',
          description: `Issued SIV ${sivNumber} to ${issuedToName} (${department}).`,
          referenceId: sivNumber,
          amountImpacted: totalValue,
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      broadcastChange({ type: 'collection:updated', collection: 'edusmart_ops_sivs_v1', tenantId, timestamp: new Date().toISOString() });
      return res.status(201).json({ success: true, siv: newSiv });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to issue store items', message: err?.message });
    }
  });

  // =========================================================================
  // 4. HR & PAYROLL APIS
  // =========================================================================

  app.get('/api/hr/employees', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const employees = readOpsCollection('edusmart_ops_employees_v1', tenantId);
      const filtered = employees.filter((e: any) => !e.tenantId || e.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve employees', message: err?.message });
    }
  });

  app.post('/api/hr/payroll/run', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const { month = 'March 2026', academicYear = '2026', preparedBy = 'Bursar' } = req.body;

      const employees = readOpsCollection('edusmart_ops_employees_v1', tenantId);
      const activeStaff = employees.filter((e: any) => (!e.tenantId || e.tenantId === tenantId) && e.status === 'Active');
      if (activeStaff.length === 0) {
        return res.status(400).json({ error: 'No active employees found to generate payroll' });
      }

      let totalGross = 0, totalPaye = 0, totalNssf = 0, totalNhif = 0, totalHousing = 0, totalNet = 0;
      const runId = `pay-${Date.now()}`;
      const payslips: any[] = [];

      activeStaff.forEach((emp: any) => {
        const gross =
          Number(emp.grossPay) ||
          (Number(emp.basicSalary) || 0) +
            (Number(emp.houseAllowance) || 0) +
            (Number(emp.commuterAllowance) || 0) +
            (Number(emp.responsibilityAllowance) || 0);
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
          disbursementStatus: 'Pending',
        });
      });

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
        preparedBy,
      };

      const db = getDb();
      db.exec('BEGIN IMMEDIATE');
      try {
        ingestCollectionData(db, 'edusmart_ops_payroll_runs_v1', [newRun], false);
        ingestCollectionData(db, 'edusmart_ops_payslips_v1', payslips, false);
        recordAuditLog({
          tenantId,
          userEmail: preparedBy,
          userName: preparedBy,
          userRole: 'finance_officer',
          module: 'HR & Payroll',
          actionType: 'PAYROLL_GENERATED',
          description: `Drafted monthly payroll for ${month} covering ${activeStaff.length} staff. Net: KES ${totalNet.toLocaleString()}.`,
          referenceId: runNumber,
          amountImpacted: totalGross,
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      broadcastChange({ type: 'collection:updated', collection: 'edusmart_ops_payroll_runs_v1', tenantId, timestamp: new Date().toISOString() });
      return res.status(201).json({ success: true, run: newRun, payslipsCount: payslips.length });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to run payroll', message: err?.message });
    }
  });

  app.post('/api/hr/payroll/:id/approve', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const { id } = req.params;
      const { approvedBy = 'Head Teacher' } = req.body;

      const runs = readOpsCollection('edusmart_ops_payroll_runs_v1', tenantId);
      const payslips = readOpsCollection('edusmart_ops_payslips_v1', tenantId);
      const glAccounts = readOpsCollection('edusmart_ops_gl_accounts_v1', tenantId);

      const run = runs.find((r: any) => r.id === id || r.runNumber === id);
      if (!run) return res.status(404).json({ error: 'Payroll run not found' });

      const approvalDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const updatedRun = {
        ...run,
        status: 'Disbursed',
        approvedBy,
        approvalDate,
        generalLedgerJournalId: `GL-PAY-${run.runNumber}`,
        tenantId: run.tenantId || tenantId,
      };

      const updatedSlips = payslips
        .filter((p: any) => p.payrollRunId === run.id)
        .map((p: any) => ({ ...p, disbursementStatus: 'Disbursed via Bank Batch', disbursementDate: approvalDate }));

      const updatedGl: any[] = [];
      const bankAccount = glAccounts.find((a: any) => a.code === '1010' && (!a.tenantId || a.tenantId === tenantId));
      if (bankAccount) {
        bankAccount.balance = (bankAccount.balance || 0) - run.totalNetPay;
        updatedGl.push(bankAccount);
      }
      const salaryExpense = glAccounts.find((a: any) => a.code === '4010' && (!a.tenantId || a.tenantId === tenantId));
      if (salaryExpense) {
        salaryExpense.balance = (salaryExpense.balance || 0) + run.totalGrossPay;
        updatedGl.push(salaryExpense);
      }

      const db = getDb();
      db.exec('BEGIN IMMEDIATE');
      try {
        ingestCollectionData(db, 'edusmart_ops_payroll_runs_v1', [updatedRun], false);
        if (updatedSlips.length) ingestCollectionData(db, 'edusmart_ops_payslips_v1', updatedSlips, false);
        if (updatedGl.length) ingestCollectionData(db, 'edusmart_ops_gl_accounts_v1', updatedGl, false);
        recordAuditLog({
          tenantId,
          userEmail: approvedBy,
          userName: approvedBy,
          userRole: 'head_teacher',
          module: 'HR & Payroll',
          actionType: 'PAYROLL_DISBURSED',
          description: `Executive sign-off on ${run.runNumber} for ${run.payrollMonth}. Bank batch disbursed KES ${run.totalNetPay.toLocaleString()}.`,
          referenceId: run.runNumber,
          amountImpacted: run.totalNetPay,
        });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      broadcastChange({ type: 'collection:updated', collection: 'edusmart_ops_payroll_runs_v1', tenantId, timestamp: new Date().toISOString() });
      return res.json({ success: true, message: 'Payroll approved and disbursed', run: updatedRun });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to approve payroll run', message: err?.message });
    }
  });

  app.get('/api/hr/payslips/:employeeId', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const { employeeId } = req.params;
      const payslips = readOpsCollection('edusmart_ops_payslips_v1', tenantId);
      const employeePayslips = payslips.filter((p: any) => p.employeeId === employeeId || p.employeeNumber === employeeId);
      return res.json({ success: true, employeeId, count: employeePayslips.length, data: employeePayslips });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve employee payslips', message: err?.message });
    }
  });

  app.get('/api/operations/audit-logs', requireAuth, (req: Request, res: Response) => {
    try {
      const tenantId = resolveAuthorizedTenantId(req, res);
      if (!tenantId) return;
      const logs = readOpsCollection('edusmart_ops_audit_logs_v1', tenantId);
      const filtered = logs.filter((l: any) => !l.tenantId || l.tenantId === tenantId);
      return res.json({ success: true, tenantId, count: filtered.length, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve audit logs', message: err?.message });
    }
  });
}
