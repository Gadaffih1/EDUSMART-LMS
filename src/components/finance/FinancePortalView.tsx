import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Plus, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  TrendingUp, 
  Building2, 
  Smartphone, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Eye, 
  Users,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { OperationsStorage } from '../../utils/operationsStorage';
import { 
  FeeInvoice, 
  FeePaymentReceipt, 
  StudentFeeAccount, 
  GeneralLedgerAccount, 
  BudgetAllocation, 
  FeeStructureItem 
} from '../../types/financeOperations';
import { User } from '../../types';
import { useTenant } from '../../context/TenantContext';

interface FinancePortalViewProps {
  currentUser: User;
  onNavigateToTab?: (tab: string) => void;
}

export const FinancePortalView: React.FC<FinancePortalViewProps> = ({
  currentUser,
  onNavigateToTab
}) => {
  const { currentTenant } = useTenant();
  const [subTab, setSubTab] = useState<'invoices' | 'payments' | 'ledger' | 'budgets' | 'fee_structure'>('invoices');
  
  // Data states
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [payments, setPayments] = useState<FeePaymentReceipt[]>([]);
  const [feeAccounts, setFeeAccounts] = useState<StudentFeeAccount[]>([]);
  const [glAccounts, setGlAccounts] = useState<GeneralLedgerAccount[]>([]);
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([]);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<FeeInvoice | null>(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<FeePaymentReceipt | null>(null);

  // New Payment Form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'M-PESA' | 'Bank Transfer' | 'Cashier Slip' | 'Direct Cheque'>('M-PESA');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);

  const loadData = () => {
    setInvoices(OperationsStorage.getFeeInvoices(currentTenant.id));
    setPayments(OperationsStorage.getFeePayments(currentTenant.id));
    setFeeAccounts(OperationsStorage.getStudentFeeAccounts(currentTenant.id));
    setGlAccounts(OperationsStorage.getGeneralLedger(currentTenant.id));
    setBudgets(OperationsStorage.getBudgetAllocations(currentTenant.id));
    setFeeStructures(OperationsStorage.getFeeStructures(currentTenant.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('finance-updated', handleUpdate);
    return () => window.removeEventListener('finance-updated', handleUpdate);
  }, [currentTenant.id]);

  // Aggregate Metrics
  const totalBilled = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCollected = invoices.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalArrears = invoices.reduce((acc, curr) => acc + curr.balanceAmount, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
  const bankBalance = glAccounts.find(a => a.code === '1010')?.balance || 0;
  const mpesaBalance = glAccounts.find(a => a.code === '1020')?.balance || 0;

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGradeFilter === 'all' || inv.grade.toString() === selectedGradeFilter;
    const matchesStatus = selectedStatusFilter === 'all' || inv.status === selectedStatusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const handleOpenPaymentModal = (invoice: FeeInvoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentAmount(invoice.balanceAmount > 0 ? invoice.balanceAmount : 20000);
    setPayerName(`${invoice.studentName}'s Guardian`);
    setPayerPhone('+254 7');
    setReferenceNumber(`QHK${Math.floor(100000 + Math.random() * 900000)}L`);
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    if (paymentAmount <= 0) {
      alert('Please enter a valid payment amount greater than zero.');
      return;
    }

    setIsSubmittingPayment(true);
    setTimeout(() => {
      const receipt = OperationsStorage.addFeePayment({
        tenantId: currentTenant.id,
        invoiceId: selectedInvoiceForPayment.id,
        studentId: selectedInvoiceForPayment.studentId,
        studentName: selectedInvoiceForPayment.studentName,
        admissionNumber: selectedInvoiceForPayment.admissionNumber,
        amount: Number(paymentAmount),
        paymentMethod,
        referenceNumber: referenceNumber || `REF-${Date.now()}`,
        payerName: payerName || `${selectedInvoiceForPayment.studentName} Parent`,
        payerPhone: payerPhone || '+254 700 000 000',
        paymentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        receivedBy: currentUser.name || 'Bursar Desk',
        term: selectedInvoiceForPayment.term,
        academicYear: selectedInvoiceForPayment.academicYear,
        notes: paymentNotes
      });

      setIsSubmittingPayment(false);
      setShowPaymentModal(false);
      loadData();
      setPaymentSuccessToast(`Payment of KES ${Number(paymentAmount).toLocaleString()} recorded! Receipt #${receipt.receiptNumber} generated.`);
      setTimeout(() => setPaymentSuccessToast(null), 4000);
      setSelectedReceiptForPrint(receipt);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {paymentSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{paymentSuccessToast}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-white">
              Finance & Bursary Management Portal
            </h2>
            <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {currentTenant.shortName || currentTenant.name}
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Real-time student billing, M-Pesa automated Paybill reconciliations, general ledger charts, and departmental budget tracking with tenant isolation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow-xs"
            title="Refresh Financial Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (invoices.length > 0) handleOpenPaymentModal(invoices[0]);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Fee Payment</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Termly Billed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Term 1 Billed</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            KES {totalBilled.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Across {invoices.length} enrolled student accounts
          </div>
        </div>

        {/* Card 2: Total Collected */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Collected</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {collectionRate}% Cleared
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            KES {totalCollected.toLocaleString()}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, collectionRate)}%` }} />
          </div>
        </div>

        {/* Card 3: Outstanding Arrears */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Arrears</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            KES {totalArrears.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-600 font-medium">
            {invoices.filter(i => i.balanceAmount > 0).length} students with outstanding balances
          </div>
        </div>

        {/* Card 4: Liquid Operating Balances */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Liquid Funds</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            KES {(bankBalance + mpesaBalance).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
            <span>Bank: KES {(bankBalance / 1000000).toFixed(1)}M</span>
            <span>M-Pesa: KES {(mpesaBalance / 1000).toFixed(0)}K</span>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setSubTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'invoices'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Student Invoices & Ledgers ({invoices.length})</span>
        </button>

        <button
          onClick={() => setSubTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'payments'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Payments & M-PESA Log ({payments.length})</span>
        </button>

        <button
          onClick={() => setSubTab('budgets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'budgets'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span>Departmental Budgets ({budgets.length})</span>
        </button>

        <button
          onClick={() => setSubTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'ledger'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-600" />
          <span>General Ledger Accounts ({glAccounts.length})</span>
        </button>

        <button
          onClick={() => setSubTab('fee_structure')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'fee_structure'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Wallet className="w-4 h-4 text-indigo-600" />
          <span>CBC Fee Structure Rates</span>
        </button>
      </div>

      {/* TAB 1: STUDENT INVOICES & LEDGERS */}
      {subTab === 'invoices' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Term 1 Student Fee Invoices & Arrears Aging
              </h3>
              <p className="text-xs text-slate-500">
                Track individual student billing, outstanding debit balances, and direct payment receipts.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or ADM..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                />
              </div>

              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="all">All Grades</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                  <option key={g} value={g.toString()}>Grade {g}</option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="Paid in Full">Paid in Full</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* TABLE OF INVOICES */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono font-bold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Adm / Grade</th>
                  <th className="py-3 px-3">Total Billed</th>
                  <th className="py-3 px-3">Amount Paid</th>
                  <th className="py-3 px-3">Balance</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-950 font-serif">
                      {inv.studentName}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-mono text-[11px] font-semibold">{inv.admissionNumber}</span>
                      <span className="text-slate-400 mx-1">·</span>
                      <span>Grade {inv.grade} ({inv.stream})</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      KES {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      KES {inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <span className={inv.balanceAmount === 0 ? 'text-slate-400' : 'text-rose-700 font-extrabold'}>
                        KES {inv.balanceAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid in Full' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : inv.status === 'Partially Paid'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenPaymentModal(inv)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white rounded-lg text-xs font-bold transition-all border border-emerald-200 cursor-pointer"
                      >
                        {inv.balanceAmount === 0 ? 'Add Payment' : 'Pay Fees'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS & M-PESA COLLECTIONS */}
      {subTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Mobile Paybill & Bank Payment Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Verified digital receipts generated upon transaction reconciliation.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              Total Receipts: {payments.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono font-bold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Receipt #</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Reference / M-Pesa ID</th>
                  <th className="py-3 px-3">Payer Details</th>
                  <th className="py-3 px-3">Amount Paid</th>
                  <th className="py-3 px-3 text-right">Print Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {p.paymentDate}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-950 font-serif">
                      {p.studentName}
                      <span className="text-slate-400 font-mono text-[10px] block font-normal">{p.admissionNumber}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        p.paymentMethod === 'M-PESA'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : p.paymentMethod === 'Bank Transfer'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-purple-100 text-purple-800 border border-purple-300'
                      }`}>
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {p.referenceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="font-semibold text-slate-900">{p.payerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.payerPhone}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-700">
                      KES {p.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedReceiptForPrint(p)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Print Official School Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-[11px] font-bold">Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL LEDGER & CHART OF ACCOUNTS */}
      {subTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Chart of Accounts & General Ledger (GL)
              </h3>
              <p className="text-xs text-slate-500">
                Real-time double-entry balances across Assets, Liabilities, Revenues, and Operating Expenses.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl">
              Currency: KES (Kenyan Shillings)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {glAccounts.map((acc) => (
              <div 
                key={acc.code} 
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                      {acc.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      acc.category === 'Asset' ? 'bg-blue-100 text-blue-800' :
                      acc.category === 'Revenue' ? 'bg-emerald-100 text-emerald-800' :
                      acc.category === 'Expense' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {acc.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-950">
                    {acc.name}
                  </h4>
                  <p className="text-xs text-slate-500 leading-snug">
                    {acc.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance</span>
                  <span className="font-mono text-base font-black text-slate-900">
                    KES {acc.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENTAL BUDGETS */}
      {subTab === 'budgets' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Annual Departmental Operational Budgets (Fiscal Year 2026)
            </h3>
            <p className="text-xs text-slate-500">
              Department allocations, commitments (active LPOs), actual expenditure, and remaining uncommitted balances.
            </p>
          </div>

          <div className="space-y-4">
            {budgets.map((b) => {
              const pctSpent = Math.round((b.spentAmount / b.allocatedAmount) * 100);
              const pctCommitted = Math.round((b.committedAmount / b.allocatedAmount) * 100);
              return (
                <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 font-serif">{b.department}</h4>
                      <p className="text-xs text-slate-500">Department Lead: {b.leadOfficer}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Allocated</span>
                        <span className="font-bold text-slate-900">KES {b.allocatedAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-500 uppercase block">Committed (LPOs)</span>
                        <span className="font-bold text-amber-700">KES {b.committedAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-500 uppercase block">Actual Spent</span>
                        <span className="font-bold text-rose-700">KES {b.spentAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-500 uppercase block">Available</span>
                        <span className="font-bold text-emerald-700">KES {b.remainingAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-segment Progress Bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-rose-500 h-full transition-all" style={{ width: `${pctSpent}%` }} title={`Spent: ${pctSpent}%`} />
                    <div className="bg-amber-400 h-full transition-all" style={{ width: `${pctCommitted}%` }} title={`Committed: ${pctCommitted}%`} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Spent ({pctSpent}%)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Committed ({pctCommitted}%)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> Uncommitted</span>
                    </div>
                    <span className="font-bold text-slate-700">Fiscal Year {b.fiscalYear}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: CBC FEE STRUCTURE */}
      {subTab === 'fee_structure' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Approved Institutional CBC Fee Structure
              </h3>
              <p className="text-xs text-slate-500">
                Official Ministry of Education aligned fee guidelines for Primary and Junior School tiers.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              Active Term: Term 1, 2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeStructures.map((f) => (
              <div key={f.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                    {f.category}
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    {f.frequency}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-950 font-serif">{f.name}</h4>
                  <p className="text-xs text-slate-500">{f.gradeLevel} {f.isOptional ? '(Optional Add-on)' : '(Mandatory)'}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Per Student:</span>
                  <span className="font-mono text-base font-black text-emerald-800">
                    KES {f.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: RECORD FEE PAYMENT */}
      {showPaymentModal && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base font-serif">Record Fee Payment Receipt</h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4 text-xs">
              {/* Student Summary Header */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900 font-serif">{selectedInvoiceForPayment.studentName}</div>
                  <div className="text-slate-500 text-[11px]">
                    ADM: {selectedInvoiceForPayment.admissionNumber} · Grade {selectedInvoiceForPayment.grade} ({selectedInvoiceForPayment.stream})
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Balance</span>
                  <span className="font-mono font-black text-rose-700 text-sm">
                    KES {selectedInvoiceForPayment.balanceAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Amount (KES) *</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    min={100}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Channel *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="M-PESA">Safaricom M-PESA Paybill</option>
                    <option value="Bank Transfer">Direct Bank Transfer (EFT/RTGS)</option>
                    <option value="Cashier Slip">Cashier Slip / Physical Deposit</option>
                    <option value="Direct Cheque">Institutional Cheque</option>
                  </select>
                </div>
              </div>

              {/* Reference ID & Payer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transaction Ref Number *</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. QHK892102L"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payer Phone Number</label>
                  <input
                    type="text"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    placeholder="+254 7..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payer Name / Depositor</label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Guardian / Parent Name"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cashier Remarks (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Term 1 Tuition balance clearance"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPayment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reconciling...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Authorize & Issue Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT OFFICIAL RECEIPT */}
      {selectedReceiptForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900 font-serif">Official Fee Payment Receipt</h4>
              </div>
              <button 
                onClick={() => setSelectedReceiptForPrint(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="printable-report border border-slate-300 p-5 rounded-2xl bg-white space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
                <div className="font-black text-sm font-serif uppercase tracking-tight text-slate-950">{currentTenant.name}</div>
                <div className="text-[10px] text-slate-500">{currentTenant.address}, {currentTenant.city}</div>
                <div className="text-[10px] text-slate-500">Tel: {currentTenant.phone}</div>
                <div className="font-extrabold text-xs pt-1 text-emerald-800">OFFICIAL REVENUE RECEIPT</div>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px] py-1">
                <div><span className="text-slate-400">Receipt No:</span> <strong className="text-slate-900">{selectedReceiptForPrint.receiptNumber}</strong></div>
                <div><span className="text-slate-400">Date:</span> <strong className="text-slate-900">{selectedReceiptForPrint.paymentDate}</strong></div>
                <div><span className="text-slate-400">Student:</span> <strong className="text-slate-900">{selectedReceiptForPrint.studentName}</strong></div>
                <div><span className="text-slate-400">Adm No:</span> <strong className="text-slate-900">{selectedReceiptForPrint.admissionNumber}</strong></div>
                <div><span className="text-slate-400">Payment:</span> <strong className="text-emerald-700">{selectedReceiptForPrint.paymentMethod}</strong></div>
                <div><span className="text-slate-400">Ref ID:</span> <strong className="text-slate-900">{selectedReceiptForPrint.referenceNumber}</strong></div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-600">AMOUNT RECEIVED:</span>
                <span className="text-base font-black text-slate-950 font-mono">KES {selectedReceiptForPrint.amount.toLocaleString()}</span>
              </div>

              <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                <div>Payer: {selectedReceiptForPrint.payerName} ({selectedReceiptForPrint.payerPhone})</div>
                <div>Cashier: {selectedReceiptForPrint.receivedBy}</div>
                <div>Academic Period: {selectedReceiptForPrint.term} ({selectedReceiptForPrint.academicYear})</div>
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-400 border-t border-dashed border-slate-300">
                Generated securely by EduSmart LMS Financial Gateway. Valid without physical signature.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
              <button
                onClick={() => setSelectedReceiptForPrint(null)}
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
