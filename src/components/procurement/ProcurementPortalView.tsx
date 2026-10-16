import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Building2, 
  Check, 
  X, 
  Printer, 
  AlertTriangle, 
  ShieldCheck, 
  Send,
  Eye,
  RefreshCw,
  Sliders,
  DollarSign,
  Tag
} from 'lucide-react';
import { OperationsStorage } from '../../utils/operationsStorage';
import { 
  PurchaseRequisition, 
  PurchaseOrderLPO, 
  VendorSupplier,
  RequisitionItem 
} from '../../types/financeOperations';
import { User } from '../../types';
import { useTenant } from '../../context/TenantContext';

interface ProcurementPortalViewProps {
  currentUser: User;
}

export const ProcurementPortalView: React.FC<ProcurementPortalViewProps> = ({
  currentUser
}) => {
  const { currentTenant } = useTenant();
  const [subTab, setSubTab] = useState<'requisitions' | 'lpos' | 'vendors' | 'three_way'>('requisitions');

  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [lpos, setLpos] = useState<PurchaseOrderLPO[]>([]);
  const [suppliers, setSuppliers] = useState<VendorSupplier[]>([]);

  // Modals
  const [showNewReqModal, setShowNewReqModal] = useState(false);
  const [showNewVendorModal, setShowNewVendorModal] = useState(false);
  const [selectedReqForLpo, setSelectedReqForLpo] = useState<PurchaseRequisition | null>(null);
  const [selectedLpoForPrint, setSelectedLpoForPrint] = useState<PurchaseOrderLPO | null>(null);

  // New Requisition Form State
  const [reqDepartment, setReqDepartment] = useState('Science Laboratory & STEM');
  const [reqPriority, setReqPriority] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('Medium');
  const [reqJustification, setReqJustification] = useState('');
  const [reqItems, setReqItems] = useState<{ description: string; specification: string; quantity: number; unit: string; estimatedUnitCost: number }[]>([
    { description: '', specification: '', quantity: 1, unit: 'Units', estimatedUnitCost: 0 }
  ]);

  // LPO Generation Form State
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [deliveryDueDate, setDeliveryDueDate] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('Main Central Store');
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net after Inspection & Goods Received Note');

  // Supplier Form State
  const [vendorName, setVendorName] = useState('');
  const [vendorKraPin, setVendorKraPin] = useState('');
  const [vendorCategory, setVendorCategory] = useState<any>('Textbooks & Stationery');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorBank, setVendorBank] = useState('KCB Bank Kenya');
  const [vendorAccount, setVendorAccount] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setRequisitions(OperationsStorage.getRequisitions(currentTenant.id));
    setLpos(OperationsStorage.getPurchaseOrders(currentTenant.id));
    setSuppliers(OperationsStorage.getSuppliers(currentTenant.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('procurement-updated', handleUpdate);
    return () => window.removeEventListener('procurement-updated', handleUpdate);
  }, [currentTenant.id]);

  const canApprove = ['head_teacher', 'admin', 'finance_officer', 'hod'].includes(currentUser.role);

  const handleApprovalAction = (reqId: string, status: 'Approved' | 'Rejected') => {
    let roleTitle = 'Head Teacher';
    if (currentUser.role === 'finance_officer') roleTitle = 'Finance / Bursar';
    else if (currentUser.role === 'hod') roleTitle = 'Head of Department';

    OperationsStorage.approveRequisitionStep(
      reqId,
      roleTitle,
      currentUser.name || 'Executive Officer',
      status,
      status === 'Approved' ? 'Verified against departmental curriculum requirements and budget.' : 'Returned for specification review.'
    );

    loadData();
    setToastMessage(`Requisition ${status.toLowerCase()} successfully by ${roleTitle}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddItemToReq = () => {
    setReqItems(prev => [...prev, { description: '', specification: '', quantity: 1, unit: 'Units', estimatedUnitCost: 0 }]);
  };

  const handleRemoveItemFromReq = (idx: number) => {
    if (reqItems.length <= 1) return;
    setReqItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqJustification.trim()) {
      alert('Please provide a justification for this requisition.');
      return;
    }

    const validItems: RequisitionItem[] = reqItems.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      description: item.description,
      specification: item.specification,
      quantity: Number(item.quantity) || 1,
      unit: item.unit,
      estimatedUnitCost: Number(item.estimatedUnitCost) || 0,
      estimatedTotal: (Number(item.quantity) || 1) * (Number(item.estimatedUnitCost) || 0)
    }));

    const totalEst = validItems.reduce((acc, curr) => acc + curr.estimatedTotal, 0);

    const created = OperationsStorage.addRequisition({
      tenantId: currentTenant.id,
      department: reqDepartment,
      requestedBy: currentUser.name || 'Faculty Member',
      requesterRole: currentUser.role,
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      priority: reqPriority,
      justification: reqJustification,
      items: validItems,
      totalEstimatedCost: totalEst,
      status: 'Draft',
      approvalChain: [
        { role: 'Head of Department', approverName: 'HOD Clearance', status: 'Pending' },
        { role: 'Finance / Bursar', approverName: 'Bursar Audit', status: 'Pending' },
        { role: 'Head Teacher', approverName: 'Principal Final Authorization', status: 'Pending' }
      ]
    });

    setShowNewReqModal(false);
    setReqJustification('');
    setReqItems([{ description: '', specification: '', quantity: 1, unit: 'Units', estimatedUnitCost: 0 }]);
    loadData();
    setToastMessage(`Requisition ${created.reqNumber} raised successfully!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateLPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForLpo) return;
    const vendor = suppliers.find(s => s.id === selectedVendorId) || suppliers[0];
    if (!vendor) {
      alert('Please select an approved vendor.');
      return;
    }

    const orderItems = selectedReqForLpo.items.map(it => ({
      description: `${it.description} (${it.specification})`,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.estimatedUnitCost,
      totalPrice: it.estimatedTotal
    }));

    const subtotal = orderItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const tax = Math.round(subtotal * 0.16); // 16% VAT standard
    const total = subtotal + tax;

    const lpo = OperationsStorage.createPurchaseOrder({
      tenantId: currentTenant.id,
      requisitionId: selectedReqForLpo.id,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorPhone: vendor.phone,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDueDate: deliveryDueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: orderItems,
      subtotal,
      taxVat: tax,
      totalAmount: total,
      paymentTerms,
      deliveryLocation,
      authorizedBy: currentUser.name || 'Head Teacher Patrick Kamau',
      status: 'Issued'
    });

    setSelectedReqForLpo(null);
    loadData();
    setToastMessage(`Local Purchase Order ${lpo.lpoNumber} issued to ${vendor.name}!`);
    setTimeout(() => setToastMessage(null), 4000);
    setSelectedLpoForPrint(lpo);
  };

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !vendorKraPin.trim()) {
      alert('Company name and KRA PIN are required for compliance.');
      return;
    }

    const newSup = OperationsStorage.addSupplier({
      tenantId: currentTenant.id,
      name: vendorName,
      kraPin: vendorKraPin.toUpperCase(),
      taxComplianceValid: true,
      category: vendorCategory,
      contactPerson: vendorContact || 'General Manager',
      phone: vendorPhone || '+254 700 000 000',
      email: vendorEmail || 'info@supplier.co.ke',
      address: 'Nairobi, Kenya',
      bankName: vendorBank,
      bankAccount: vendorAccount || '01129384910200',
      rating: 5,
      status: 'Approved'
    });

    setShowNewVendorModal(false);
    setVendorName('');
    setVendorKraPin('');
    loadData();
    setToastMessage(`Vendor ${newSup.name} onboarded with valid Tax Compliance!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-white">
              Procurement & Purchasing Portal
            </h2>
            <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
              3-Way Matching Active
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Departmental purchase requisitions, multi-level approvals, KRA-compliant vendor catalog, Local Purchase Orders (LPO), and 3-way matching before financial disbursement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewReqModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition-all shadow-lg shadow-blue-950/40 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Purchase Requisition</span>
          </button>
        </div>
      </div>

      {/* PROCUREMENT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Requisitions</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {requisitions.length}
          </div>
          <div className="text-[11px] text-slate-500">
            {requisitions.filter(r => r.status.includes('Approved')).length} approved for purchasing
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active LPOs</span>
            <ShoppingCart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {lpos.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Total commitments: KES {lpos.reduce((a, b) => a + b.totalAmount, 0).toLocaleString()}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Approved Vendors</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {suppliers.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            100% Tax Compliant (KRA PIN verified)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">3-Way Match Rate</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">
            100%
          </div>
          <div className="text-[11px] text-slate-500">
            Zero invoice payments without verified GRN
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setSubTab('requisitions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'requisitions'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Purchase Requisitions ({requisitions.length})</span>
        </button>

        <button
          onClick={() => setSubTab('lpos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'lpos'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-amber-600" />
          <span>Local Purchase Orders - LPOs ({lpos.length})</span>
        </button>

        <button
          onClick={() => setSubTab('vendors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'vendors'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Approved Vendors Directory ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setSubTab('three_way')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'three_way'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>3-Way Matching Verification Matrix</span>
        </button>
      </div>

      {/* TAB 1: REQUISITIONS */}
      {subTab === 'requisitions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Departmental Purchase Requisitions & Approval Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                Multi-stage sign-offs: Requester &rarr; HOD Review &rarr; Bursar Clearance &rarr; Head Teacher Approval.
              </p>
            </div>
            <button
              onClick={() => setShowNewReqModal(true)}
              className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-blue-200 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Raise Requisition</span>
            </button>
          </div>

          <div className="space-y-4">
            {requisitions.map((req) => (
              <div 
                key={req.id} 
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-300">
                        {req.reqNumber}
                      </span>
                      <span className="font-bold text-sm text-slate-950 font-serif">
                        {req.department}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.priority === 'Emergency' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        req.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {req.priority} Priority
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        req.status === 'Head Teacher Approved' || req.status === 'LPO Created'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : req.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      <strong>Requested by:</strong> {req.requestedBy} ({req.requesterRole}) on {req.requestDate} · Target delivery: {req.requiredDate}
                    </p>
                    <p className="text-xs text-slate-500 italic">
                      "{req.justification}"
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Cost</span>
                    <span className="font-mono text-lg font-black text-slate-900">
                      KES {req.totalEstimatedCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Items preview table */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-mono text-[10px] uppercase border-b border-slate-100">
                        <th className="pb-1.5">Item Description</th>
                        <th className="pb-1.5">Specification</th>
                        <th className="pb-1.5">Qty</th>
                        <th className="pb-1.5">Est. Unit (KES)</th>
                        <th className="pb-1.5 text-right">Est. Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {req.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-1.5 font-bold text-slate-900">{it.description}</td>
                          <td className="py-1.5 text-slate-500 text-[11px]">{it.specification}</td>
                          <td className="py-1.5 font-mono">{it.quantity} {it.unit}</td>
                          <td className="py-1.5 font-mono text-slate-600">KES {it.estimatedUnitCost.toLocaleString()}</td>
                          <td className="py-1.5 font-mono font-bold text-slate-900 text-right">KES {it.estimatedTotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Approval Chain & Actions */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-slate-400 font-medium">Pipeline:</span>
                    {req.approvalChain.map((step, idx) => (
                      <span 
                        key={idx} 
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          step.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          step.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.status === 'Approved' ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        <span>{step.role} ({step.status})</span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Approve / Reject buttons for authorized roles */}
                    {canApprove && req.status !== 'Head Teacher Approved' && req.status !== 'LPO Created' && req.status !== 'Rejected' && (
                      <>
                        <button
                          onClick={() => handleApprovalAction(req.id, 'Approved')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Requisition</span>
                        </button>
                        <button
                          onClick={() => handleApprovalAction(req.id, 'Rejected')}
                          className="px-3 py-1 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* Create LPO button if fully approved */}
                    {req.status === 'Head Teacher Approved' && (
                      <button
                        onClick={() => {
                          setSelectedReqForLpo(req);
                          setSelectedVendorId(suppliers[0]?.id || '');
                        }}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Generate LPO</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LOCAL PURCHASE ORDERS (LPO) */}
      {subTab === 'lpos' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Authorized Local Purchase Orders (LPO)
              </h3>
              <p className="text-xs text-slate-500">
                Official binding purchase agreements sent to contracted suppliers with statutory VAT.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">
              Active LPOs: {lpos.length}
            </span>
          </div>

          <div className="space-y-4">
            {lpos.map((lpo) => (
              <div key={lpo.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-white px-2 py-0.5 rounded bg-amber-600">
                        {lpo.lpoNumber}
                      </span>
                      <h4 className="font-bold text-sm text-slate-950 font-serif">
                        Vendor: {lpo.vendorName}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lpo.status === 'Fulfilled' ? 'bg-emerald-100 text-emerald-800' :
                        lpo.status === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {lpo.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Order Date: {lpo.orderDate} · Delivery Due: <strong>{lpo.deliveryDueDate}</strong> · Location: {lpo.deliveryLocation}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Terms: {lpo.paymentTerms} · Authorized By: {lpo.authorizedBy}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount (Inc VAT)</span>
                    <span className="font-mono text-lg font-black text-slate-900">
                      KES {lpo.totalAmount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => setSelectedLpoForPrint(lpo)}
                      className="mt-2 px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Print Official LPO</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: APPROVED VENDORS DIRECTORY */}
      {subTab === 'vendors' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Approved Institutional Suppliers & Vendors Directory
              </h3>
              <p className="text-xs text-slate-500">
                Prequalified business partners with verified KRA PINs and validated banking details.
              </p>
            </div>
            <button
              onClick={() => setShowNewVendorModal(true)}
              className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-200 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Supplier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((sup) => (
              <div key={sup.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                        {sup.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {sup.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-950 font-serif mt-1">{sup.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono block">KRA PIN</span>
                    <span className="font-mono text-xs font-bold text-slate-900">{sup.kraPin}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>Contact: <strong>{sup.contactPerson}</strong> ({sup.phone})</div>
                  <div>Email: {sup.email}</div>
                  <div>Bank: {sup.bankName} (A/C: {sup.bankAccount})</div>
                  <div>Address: {sup.address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 3-WAY MATCHING MATRIX */}
      {subTab === 'three_way' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Three-Way Matching Verification Gateway
            </h3>
            <p className="text-xs text-slate-500">
              Rigorous financial control preventing fraud: compares Requisition &harr; Local Purchase Order (LPO) &harr; Goods Received Note (GRN) before payment disbursement.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>1. Authorized Requisition</span>
              </div>
              <p className="text-xs text-blue-800">
                Departmental justification confirmed by HOD and checked against budget code.
              </p>
              <div className="text-[11px] font-mono text-blue-950 font-bold bg-white/70 p-2 rounded-lg">
                Status: Verified & Signed
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                <span>2. Local Purchase Order (LPO)</span>
              </div>
              <p className="text-xs text-amber-800">
                Authorized agreement with registered vendor specifying quantities, prices, and terms.
              </p>
              <div className="text-[11px] font-mono text-amber-950 font-bold bg-white/70 p-2 rounded-lg">
                Status: Issued with VAT Audit
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3. Goods Received Note (GRN)</span>
              </div>
              <p className="text-xs text-emerald-800">
                Physical warehouse inspection sign-off validating exact count and condition received.
              </p>
              <div className="text-[11px] font-mono text-emerald-950 font-bold bg-white/70 p-2 rounded-lg">
                Status: Stock Incremented & Ready for Voucher
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RAISE NEW REQUISITION */}
      {showNewReqModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base font-serif">Raise New Purchase Requisition</h3>
              </div>
              <button onClick={() => setShowNewReqModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Department *</label>
                  <select
                    value={reqDepartment}
                    onChange={(e) => setReqDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Academics & CBC Curriculum">Academics & CBC Curriculum</option>
                    <option value="Science Laboratory & STEM">Science Laboratory & STEM</option>
                    <option value="Sports, Clubs & Co-Curricular">Sports, Clubs & Co-Curricular</option>
                    <option value="School Fleet & Transport">School Fleet & Transport</option>
                    <option value="Facilities, Security & Hygiene">Facilities, Security & Hygiene</option>
                    <option value="Catering & Dining Kitchen">Catering & Dining Kitchen</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority Level *</label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low Priority (Routine restock)</option>
                    <option value="Medium">Medium Priority (Within term)</option>
                    <option value="High">High Priority (Upcoming CBA exam / fixture)</option>
                    <option value="Emergency">Emergency (Immediate disruption)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Justification & Pedagogical / Operational Need *</label>
                <textarea
                  value={reqJustification}
                  onChange={(e) => setReqJustification(e.target.value)}
                  placeholder="Explain why these items are required, target classes or facilities..."
                  rows={2}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 uppercase text-[11px]">Requested Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItemToReq}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {reqItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Item Name (e.g. Ruled Paper)"
                        value={item.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReqItems(prev => prev.map((it, i) => i === idx ? { ...it, description: val } : it));
                        }}
                        required
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Specification"
                        value={item.specification}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReqItems(prev => prev.map((it, i) => i === idx ? { ...it, specification: val } : it));
                        }}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setReqItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                        }}
                        required
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Unit Cost"
                        min={0}
                        value={item.estimatedUnitCost}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setReqItems(prev => prev.map((it, i) => i === idx ? { ...it, estimatedUnitCost: val } : it));
                        }}
                        required
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemFromReq(idx)}
                        disabled={reqItems.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewReqModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to HOD & Finance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE LPO */}
      {selectedReqForLpo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base font-serif">Generate Local Purchase Order (LPO)</h3>
              </div>
              <button onClick={() => setSelectedReqForLpo(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLPO} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">For Requisition</span>
                <div className="font-bold text-sm text-slate-900">{selectedReqForLpo.reqNumber} ({selectedReqForLpo.department})</div>
                <div className="font-mono text-emerald-700 font-bold mt-0.5">Estimated Subtotal: KES {selectedReqForLpo.totalEstimatedCost.toLocaleString()}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contracted Supplier *</label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (KRA PIN: {s.kraPin})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Due Date *</label>
                  <input
                    type="date"
                    value={deliveryDueDate}
                    onChange={(e) => setDeliveryDueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Location</label>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReqForLpo(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Issue Official LPO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ONBOARD NEW SUPPLIER */}
      {showNewVendorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base font-serif">Onboard Approved Supplier</h3>
              </div>
              <button onClick={() => setShowNewVendorModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="p-6 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Business Name *</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Oxford University Press EA Ltd"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">KRA PIN *</label>
                  <input
                    type="text"
                    value={vendorKraPin}
                    onChange={(e) => setVendorKraPin(e.target.value)}
                    placeholder="P05..."
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={vendorCategory}
                    onChange={(e) => setVendorCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Textbooks & Stationery">Textbooks & Stationery</option>
                    <option value="Laboratory Chemicals & Apparatus">Laboratory & Apparatus</option>
                    <option value="Sports Gear & Trophies">Sports Gear</option>
                    <option value="Food Supplies & Kitchen Provisions">Kitchen & Food</option>
                    <option value="IT & Hardware">IT & Hardware</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={vendorContact}
                    onChange={(e) => setVendorContact(e.target.value)}
                    placeholder="Sales Rep Name"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    placeholder="+254 7..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewVendorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Register Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT LPO */}
      {selectedLpoForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-sm text-slate-900 font-serif">Official Local Purchase Order (LPO)</h4>
              </div>
              <button onClick={() => setSelectedLpoForPrint(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="printable-report border border-slate-300 p-5 rounded-2xl bg-white space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
                <div className="font-black text-sm font-serif uppercase tracking-tight text-slate-950">{currentTenant.name}</div>
                <div className="text-[10px] text-slate-500">{currentTenant.address}, {currentTenant.city}</div>
                <div className="font-extrabold text-xs pt-1 text-amber-800">LOCAL PURCHASE ORDER (LPO)</div>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px] py-1">
                <div><span className="text-slate-400">LPO No:</span> <strong className="text-slate-900">{selectedLpoForPrint.lpoNumber}</strong></div>
                <div><span className="text-slate-400">Date:</span> <strong className="text-slate-900">{selectedLpoForPrint.orderDate}</strong></div>
                <div><span className="text-slate-400">Supplier:</span> <strong className="text-slate-900">{selectedLpoForPrint.vendorName}</strong></div>
                <div><span className="text-slate-400">Due Date:</span> <strong className="text-slate-900">{selectedLpoForPrint.deliveryDueDate}</strong></div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-300 my-2">
                <thead>
                  <tr className="bg-slate-100 text-[10px]">
                    <th className="p-1 border border-slate-300">Item</th>
                    <th className="p-1 border border-slate-300">Qty</th>
                    <th className="p-1 border border-slate-300">Rate</th>
                    <th className="p-1 border border-slate-300 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLpoForPrint.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-1 border border-slate-300">{it.description}</td>
                      <td className="p-1 border border-slate-300">{it.quantity} {it.unit}</td>
                      <td className="p-1 border border-slate-300">KES {it.unitPrice.toLocaleString()}</td>
                      <td className="p-1 border border-slate-300 text-right font-bold">KES {it.totalPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="p-1 border border-slate-300 text-right font-bold">Subtotal:</td>
                    <td className="p-1 border border-slate-300 text-right">KES {selectedLpoForPrint.subtotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="p-1 border border-slate-300 text-right font-bold">16% VAT:</td>
                    <td className="p-1 border border-slate-300 text-right">KES {selectedLpoForPrint.taxVat.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50 font-black">
                    <td colSpan={3} className="p-1 border border-slate-300 text-right">GRAND TOTAL:</td>
                    <td className="p-1 border border-slate-300 text-right text-emerald-800">KES {selectedLpoForPrint.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-[10px] text-slate-500 pt-1">
                Authorized By: <strong>{selectedLpoForPrint.authorizedBy}</strong> · Delivery to: {selectedLpoForPrint.deliveryLocation}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print LPO</span>
              </button>
              <button
                onClick={() => setSelectedLpoForPrint(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
