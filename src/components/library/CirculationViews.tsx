import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  Check, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  Bookmark, 
  Printer, 
  Plus, 
  CheckCircle2, 
  X,
  Mail,
  ShieldCheck,
  RotateCcw,
  Building2,
  Gift,
  Barcode,
  Info,
  Sparkles
} from 'lucide-react';
import { 
  LibraryBook, 
  LibraryBorrowRecord, 
  LibraryReservation, 
  LibraryFine, 
  User 
} from '../../types';
import { LibraryPortalSection } from './types';

interface CirculationViewsProps {
  section: LibraryPortalSection;
  books: LibraryBook[];
  borrowRecords: LibraryBorrowRecord[];
  reservations: LibraryReservation[];
  fines: LibraryFine[];
  allUsers: User[];
  onIssueBook: (record: LibraryBorrowRecord) => void;
  onReturnBook: (recordId: string, remarks?: string) => void;
  onUpdateReservation: (id: string, updates: Partial<LibraryReservation>) => void;
  onAddReservation: (res: LibraryReservation) => void;
  onUpdateFine: (id: string, updates: Partial<LibraryFine>) => void;
  onAddFine: (fine: LibraryFine) => void;
}

export const CirculationViews: React.FC<CirculationViewsProps> = ({
  section,
  books,
  borrowRecords,
  reservations,
  fines,
  allUsers,
  onIssueBook,
  onReturnBook,
  onUpdateReservation,
  onAddReservation,
  onUpdateFine,
  onAddFine
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher'>('all');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [selectedRecordForReturn, setSelectedRecordForReturn] = useState<LibraryBorrowRecord | null>(null);

  // Quick Return by Unique ID State
  const [quickReturnInput, setQuickReturnInput] = useState('');
  const [quickReturnSuccess, setQuickReturnSuccess] = useState<string | null>(null);

  // Issue Book Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueBookId, setIssueBookId] = useState(books[0]?.id || '');
  const [issueBorrowerId, setIssueBorrowerId] = useState('');
  const [issueBorrowerRole, setIssueBorrowerRole] = useState<'student' | 'teacher'>('student');
  const [issueCopyId, setIssueCopyId] = useState('');
  const [issueDueDate, setIssueDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [issueRemarks, setIssueRemarks] = useState('Circulation Desk Checkout');

  // New Reservation Form
  const [showResModal, setShowResModal] = useState(false);
  const [resBookId, setResBookId] = useState(books[0]?.id || '');
  const [resBorrowerId, setResBorrowerId] = useState(allUsers[0]?.id || '');

  // Active Loans for Quick Lookup
  const activeLoans = borrowRecords.filter(r => r.status !== 'returned');

  // Quick Return match by Book Unique ID
  const matchedLoanByCopyId = quickReturnInput.trim()
    ? activeLoans.find(r => 
        (r.bookCopyId && r.bookCopyId.trim().toUpperCase() === quickReturnInput.trim().toUpperCase()) ||
        (r.id.toUpperCase() === quickReturnInput.trim().toUpperCase())
      )
    : undefined;

  const handleQuickReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedLoanByCopyId) return;

    onReturnBook(matchedLoanByCopyId.id, returnRemarks.trim() || 'Returned via Quick Unique ID Desk');
    setQuickReturnSuccess(`Book copy "${matchedLoanByCopyId.bookCopyId || matchedLoanByCopyId.bookTitle}" successfully returned by ${matchedLoanByCopyId.borrowerName}!`);
    setQuickReturnInput('');
    setReturnRemarks('');
    setTimeout(() => setQuickReturnSuccess(null), 5000);
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bk = books.find(b => b.id === issueBookId);
    const user = allUsers.find(u => u.id === issueBorrowerId);
    if (!bk || !user) {
      alert('Please select both a valid Book and a Borrower.');
      return;
    }

    if (bk.copiesAvailable <= 0) {
      alert('No available copies of this title currently.');
      return;
    }

    const assignedCopyId = issueCopyId.trim() || `${bk.accessionPrefix || 'ACC'}-${String(bk.totalCopies - bk.copiesAvailable + 1).padStart(3, '0')}`;

    // Verify Unique ID is not currently on active loan
    const duplicateActive = activeLoans.some(r => 
      r.bookCopyId && r.bookCopyId.trim().toUpperCase() === assignedCopyId.toUpperCase()
    );

    if (duplicateActive) {
      alert(`The Unique ID "${assignedCopyId}" is already held by another borrower! Please select/enter an available unique copy ID.`);
      return;
    }

    const newRec: LibraryBorrowRecord = {
      id: `bor-${Date.now()}`,
      bookId: bk.id,
      bookTitle: bk.title,
      bookCopyId: assignedCopyId,
      publisher: bk.publisher,
      acquisitionType: bk.acquisitionType || 'Stocked',
      borrowerId: user.id,
      borrowerName: user.name,
      borrowerRole: issueBorrowerRole,
      grade: user.grade,
      stream: user.stream,
      borrowedDate: new Date().toISOString().split('T')[0],
      dueDate: issueDueDate,
      status: 'active',
      remarks: issueRemarks.trim()
    };

    onIssueBook(newRec);
    setShowIssueModal(false);
    setIssueCopyId('');
    setIssueRemarks('Circulation Desk Checkout');
  };

  // Issue Return Desk
  if (section === 'issue_return') {
    const filteredRecords = borrowRecords.filter(r => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        r.bookTitle.toLowerCase().includes(q) ||
        r.borrowerName.toLowerCase().includes(q) ||
        (r.publisher && r.publisher.toLowerCase().includes(q)) ||
        (r.bookCopyId && r.bookCopyId.toLowerCase().includes(q));
      
      const matchesRole = filterRole === 'all' || r.borrowerRole === filterRole;
      return matchesSearch && matchesRole;
    });

    return (
      <div className="space-y-6">
        {/* Header & Quick Action */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-600 text-white uppercase tracking-wider">
                Circulation Desk
              </span>
              <span className="text-xs text-slate-500 font-mono">Unique ID Tracking</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              <span>Circulation Desk: Issue & Return by Unique ID</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Each volume is identified by its Unique ID given by the librarian. Multiple borrowers can have identical titles & publishers while tracked with separate copy IDs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowIssueModal(true);
                const firstBk = books[0];
                if (firstBk) {
                  setIssueBookId(firstBk.id);
                  const firstAvailCid = firstBk.uniqueCopyIds?.find(cid => !activeLoans.some(r => r.bookCopyId === cid));
                  setIssueCopyId(firstAvailCid || `${firstBk.accessionPrefix || 'ACC'}-001`);
                }
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Issue Book to Borrower</span>
            </button>
          </div>
        </div>

        {/* QUICK RETURN DESK BY UNIQUE ID BAR */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-purple-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Barcode className="w-4 h-4 text-purple-300" />
                <span className="font-black text-sm text-white">Quick Return Desk by Book Unique ID</span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Scan or type the Unique ID given by librarian (e.g. <strong className="text-white">ACC-KLB-M4-001</strong>) to instantly identify the book and borrower.
              </p>
            </div>

            {quickReturnSuccess && (
              <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>{quickReturnSuccess}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1">
            <div className="md:col-span-5 relative">
              <input
                type="text"
                value={quickReturnInput}
                onChange={(e) => setQuickReturnInput(e.target.value)}
                placeholder="Scan or enter Book Unique ID (e.g. ACC-KLB-M4-001)..."
                className="w-full bg-white/10 hover:bg-white/15 focus:bg-white focus:text-slate-900 text-white placeholder:text-purple-300/70 border border-purple-400/40 rounded-xl px-3.5 py-2 text-xs font-mono font-bold focus:outline-none transition-all"
              />
              {activeLoans.length > 0 && !quickReturnInput && (
                <div className="text-[10px] text-purple-300/80 mt-1 flex flex-wrap items-center gap-1">
                  <span>Active Unique IDs in circulation:</span>
                  {activeLoans.slice(0, 4).map(al => (
                    <button
                      key={al.id}
                      type="button"
                      onClick={() => setQuickReturnInput(al.bookCopyId || al.id)}
                      className="underline hover:text-white font-mono cursor-pointer"
                    >
                      {al.bookCopyId || al.id}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {matchedLoanByCopyId ? (
              <div className="md:col-span-7 bg-white/10 border border-purple-400/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
                <div>
                  <div className="font-black text-white text-sm">{matchedLoanByCopyId.bookTitle}</div>
                  <div className="text-[11px] text-purple-200 mt-0.5 flex items-center gap-2">
                    <span>Publisher: <strong>{matchedLoanByCopyId.publisher || 'Official'}</strong></span>
                    <span>·</span>
                    <span>Borrower: <strong className="text-white">{matchedLoanByCopyId.borrowerName}</strong></span>
                    <span>·</span>
                    <span className="font-mono text-purple-300">Due: {matchedLoanByCopyId.dueDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    placeholder="Condition note..."
                    className="bg-white/20 text-white placeholder:text-purple-200/60 border border-purple-400/30 rounded-lg px-2.5 py-1 text-xs w-36"
                  />
                  <button
                    onClick={handleQuickReturnSubmit}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Return</span>
                  </button>
                </div>
              </div>
            ) : quickReturnInput.trim() ? (
              <div className="md:col-span-7 text-xs text-amber-300 bg-amber-500/10 border border-amber-400/30 p-2.5 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>No active loan found matching Unique ID "{quickReturnInput}". Check spelling or inventory.</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Ledger Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Title, Publisher, Borrower, or Unique Copy ID..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 font-medium"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Total Loans: <strong className="text-slate-900 font-bold">{borrowRecords.length}</strong> · Active: <strong className="text-purple-700 font-bold">{activeLoans.length}</strong>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Title & Publisher</th>
                  <th className="py-3 px-4">Book Unique ID (Librarian Tag)</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4">Role / Class</th>
                  <th className="py-3 px-4 font-mono">Issued Date</th>
                  <th className="py-3 px-4 font-mono">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No loan records matched your search query.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Title & Publisher */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{r.bookTitle}</div>
                        {r.publisher && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>Publisher: <strong className="text-slate-700">{r.publisher}</strong></span>
                          </div>
                        )}
                        {r.remarks && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">"{r.remarks}"</div>
                        )}
                      </td>

                      {/* Book Unique ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-md bg-purple-50 text-purple-900 border border-purple-200 inline-block shadow-2xs">
                          {r.bookCopyId || 'ACC-' + r.id.slice(-4)}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Librarian Accession ID</div>
                      </td>

                      {/* Source: Stocked / Donated */}
                      <td className="py-3.5 px-4">
                        {r.acquisitionType === 'Donated' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            <Gift className="w-3 h-3 text-purple-600" /> Donated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            <Building2 className="w-3 h-3 text-blue-600" /> Stocked
                          </span>
                        )}
                      </td>

                      {/* Borrower */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {r.borrowerName}
                      </td>

                      {/* Role & Grade */}
                      <td className="py-3.5 px-4 text-slate-500">
                        <span className="capitalize">{r.borrowerRole}</span>
                        {r.grade && <span> · Gr {r.grade} {r.stream}</span>}
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">{r.borrowedDate}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{r.dueDate}</td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          r.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          r.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {r.status !== 'returned' ? (
                          <button
                            onClick={() => setSelectedRecordForReturn(r)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title={`Return copy ${r.bookCopyId || r.bookTitle}`}
                          >
                            Return Copy
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Archived Return</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: RETURN CONFIRMATION WITH UNIQUE ID */}
        {selectedRecordForReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in">
              <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Confirm Book Return by Unique ID</span>
                  </h4>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Reconcile physical copy back into library inventory.
                  </p>
                </div>
                <button onClick={() => setSelectedRecordForReturn(null)} className="text-white/70 hover:text-white cursor-pointer">✕</button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="font-black text-slate-900 text-sm">{selectedRecordForReturn.bookTitle}</div>
                  <div className="text-[11px] text-slate-600">
                    Publisher: <strong>{selectedRecordForReturn.publisher || 'KLB / Authorized'}</strong>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/80">
                    <span className="font-semibold text-slate-500">Book Unique ID:</span>
                    <span className="font-mono font-black text-xs text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded border border-purple-300">
                      {selectedRecordForReturn.bookCopyId || 'ACC-' + selectedRecordForReturn.id.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Borrower:</span>
                    <span className="font-bold text-slate-800">
                      {selectedRecordForReturn.borrowerName} ({selectedRecordForReturn.borrowerRole})
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-semibold text-slate-500">Due Date:</span>
                    <span className="text-purple-700 font-bold">{selectedRecordForReturn.dueDate}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Return Condition Remarks</label>
                  <select
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-xs mb-2"
                  >
                    <option value="Returned in excellent condition">Returned in excellent condition</option>
                    <option value="Returned with normal spine wear">Returned with normal spine wear</option>
                    <option value="Cover torn - marked for library rebinding">Cover torn - marked for library rebinding</option>
                    <option value="Pages dog-eared - acceptable">Pages dog-eared - acceptable</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForReturn(null)}
                    className="px-3.5 py-2 text-slate-600 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onReturnBook(selectedRecordForReturn.id, returnRemarks || 'Returned in excellent condition');
                      setSelectedRecordForReturn(null);
                      setReturnRemarks('');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs cursor-pointer"
                  >
                    Confirm Return
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ISSUE BOOK CHECKOUT WITH UNIQUE ID */}
        {showIssueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in">
              <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-purple-300" />
                    <span>Issue Book (Circulation Checkout)</span>
                  </h4>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Assign individual Unique ID to the borrower.
                  </p>
                </div>
                <button onClick={() => setShowIssueModal(false)} className="text-white/70 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleIssueSubmit} className="p-5 space-y-3.5 text-xs">
                {/* Book Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Book Title *</label>
                  <select
                    value={issueBookId}
                    onChange={(e) => {
                      setIssueBookId(e.target.value);
                      const bk = books.find(b => b.id === e.target.value);
                      if (bk) {
                        const firstAvailCid = bk.uniqueCopyIds?.find(cid => !activeLoans.some(r => r.bookCopyId === cid));
                        setIssueCopyId(firstAvailCid || `${bk.accessionPrefix || 'ACC'}-001`);
                      }
                    }}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-xs"
                  >
                    {books.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} — {b.publisher} ({b.copiesAvailable}/{b.totalCopies} Available)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Book Details Readout */}
                {(() => {
                  const currentBk = books.find(b => b.id === issueBookId);
                  if (!currentBk) return null;
                  return (
                    <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200 text-[11px] space-y-1">
                      <div>Publisher: <strong className="text-purple-950">{currentBk.publisher}</strong></div>
                      <div>Acquisition Source: <strong className="text-purple-950">{currentBk.acquisitionType || 'Stocked'}</strong> {currentBk.donorName ? `(${currentBk.donorName})` : ''}</div>
                      <div>Location Shelf: <strong className="text-purple-950">{currentBk.locationShelf}</strong></div>
                    </div>
                  );
                })()}

                {/* Unique ID Field */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Book Unique ID given by Librarian *
                  </label>
                  <input
                    type="text"
                    required
                    value={issueCopyId}
                    onChange={(e) => setIssueCopyId(e.target.value)}
                    placeholder="e.g. ACC-KLB-M4-001"
                    className="w-full border border-purple-300 bg-purple-50/50 rounded-xl p-2.5 font-mono font-bold text-xs focus:outline-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Each physical volume has a unique identifier given by the librarian.
                  </p>
                </div>

                {/* Borrower Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Borrower Role</label>
                    <select
                      value={issueBorrowerRole}
                      onChange={(e) => setIssueBorrowerRole(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={issueDueDate}
                      onChange={(e) => setIssueDueDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Member Borrower *</label>
                  <select
                    value={issueBorrowerId}
                    onChange={(e) => setIssueBorrowerId(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs"
                  >
                    <option value="">-- Choose Member --</option>
                    {allUsers
                      .filter(u => issueBorrowerRole === 'student' ? u.role === 'student' : ['teacher', 'class_teacher', 'hod', 'dean_of_studies'].includes(u.role))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.grade ? `(Grade ${u.grade} ${u.stream || ''})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Checkout Remarks</label>
                  <input
                    type="text"
                    value={issueRemarks}
                    onChange={(e) => setIssueRemarks(e.target.value)}
                    placeholder="e.g. Standard 2-week curriculum study loan"
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowIssueModal(false)}
                    className="px-3.5 py-2 text-slate-600 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-xs cursor-pointer"
                  >
                    Complete Checkout
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Reservations View
  if (section === 'reservations') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500" />
              <span>Book Reservations & Hold Queue</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hold requests placed by learners and teachers waiting for high-demand titles.
            </p>
          </div>

          <button
            onClick={() => setShowResModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Place Hold / Reserve</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reservations.map((res) => (
            <div key={res.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{res.bookTitle}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    res.status === 'ready_for_pickup' ? 'bg-emerald-100 text-emerald-800' :
                    res.status === 'pending' ? 'bg-amber-100 text-amber-900' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {res.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  Reserved for: <strong>{res.borrowerName}</strong> ({res.borrowerRole})
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Reservation Date: {res.reservationDate} · Hold Expires: {res.expiryDate}
                </div>
                {res.notes && (
                  <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-2 rounded-lg">
                    "{res.notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {res.status === 'pending' && (
                  <button
                    onClick={() => onUpdateReservation(res.id, { status: 'ready_for_pickup' })}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    Notify: Ready for Pickup →
                  </button>
                )}
                {res.status === 'ready_for_pickup' && (
                  <button
                    onClick={() => onUpdateReservation(res.id, { status: 'fulfilled' })}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800"
                  >
                    Mark Fulfilled & Issued →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Place Hold */}
        {showResModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-900">Place Book Hold / Reservation</h4>
                <button onClick={() => setShowResModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Book</label>
                <select
                  value={resBookId}
                  onChange={(e) => setResBookId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Borrower</label>
                <select
                  value={resBorrowerId}
                  onChange={(e) => setResBorrowerId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                >
                  {allUsers.filter(u => ['student', 'teacher'].includes(u.role)).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowResModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const b = books.find(x => x.id === resBookId);
                    const u = allUsers.find(x => x.id === resBorrowerId);
                    if (b && u) {
                      onAddReservation({
                        id: `res-${Date.now()}`,
                        bookId: b.id,
                        bookTitle: b.title,
                        borrowerId: u.id,
                        borrowerName: u.name,
                        borrowerRole: u.role as any,
                        grade: u.grade,
                        reservationDate: new Date().toISOString().split('T')[0],
                        expiryDate: '2026-10-15',
                        status: 'pending',
                        notes: 'Placed at Circulation Desk'
                      });
                      setShowResModal(false);
                    }
                  }}
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-lg"
                >
                  Confirm Hold
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Borrowers View
  if (section === 'borrowers') {
    const borrowerUsers = allUsers.filter(u => ['student', 'teacher', 'class_teacher'].includes(u.role));

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Borrower Directory & Lending Quotas</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Registered students and faculty holding library borrowing cards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {borrowerUsers.slice(0, 12).map((user) => {
            const userLoans = borrowRecords.filter(r => r.borrowerId === user.id && r.status === 'active');
            const userFines = fines.filter(f => f.borrowerId === user.id && f.status === 'unpaid');

            return (
              <div key={user.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{user.name}</h4>
                    <span className="text-[11px] text-slate-500 capitalize">{user.role}</span>
                    {user.grade && <span className="text-[11px] text-slate-500"> · Grade {user.grade}</span>}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                    ID: {user.id.slice(-6)}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span>Active Loans: <strong>{userLoans.length}</strong></span>
                  {userFines.length > 0 ? (
                    <span className="text-rose-600 font-bold">Unpaid Fine</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">Good Standing</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Overdue View
  if (section === 'overdue') {
    const overdueList = borrowRecords.filter(r => r.status === 'overdue');

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-rose-900 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Overdue Materials & Recall Notices</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Items exceeding borrowing period. System calculates daily fine of KES 10/day.
            </p>
          </div>

          <button
            onClick={() => alert('Batch overdue SMS and email alerts dispatched to registered parents.')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Dispatch Automated Reminders</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Title & Publisher</th>
                  <th className="py-3 px-4">Book Unique ID</th>
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4 font-mono">Due Date</th>
                  <th className="py-3 px-4 text-center">Days Overdue</th>
                  <th className="py-3 px-4">Accrued Fine</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{r.bookTitle}</div>
                      {r.publisher && (
                        <div className="text-[10px] text-slate-500 font-normal">Publisher: {r.publisher}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
                        {r.bookCopyId || 'ACC-' + r.id.slice(-4)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">{r.borrowerName} ({r.borrowerRole})</td>
                    <td className="py-3.5 px-4 font-mono text-rose-700 font-bold">{r.dueDate}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600">5 Days</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">KES 50</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onReturnBook(r.id, 'Returned overdue - fine assessed')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Accept Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Fines & Charges View
  if (section === 'fines_charges') {
    const totalCollected = fines.filter(f => f.status === 'paid').reduce((acc, f) => acc + f.amountPaid, 0);

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Fines, Charges & Damage Penalties</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Collected penalties fund book maintenance, rebinding, and new acquisitions.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Total Revenue Collected</span>
            <div className="text-xl font-black text-emerald-700 font-mono">KES {totalCollected}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Borrower</th>
                  <th className="py-3 px-4">Title / Reason</th>
                  <th className="py-3 px-4 font-mono">Fine Amount</th>
                  <th className="py-3 px-4 font-mono">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{f.borrowerName}</td>
                    <td className="py-3.5 px-4 text-slate-700">{f.bookTitle} ({f.daysOverdue} days late)</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">KES {f.fineAmount}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">KES {f.amountPaid}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        f.status === 'waived' ? 'bg-slate-100 text-slate-600' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {f.status === 'unpaid' && (
                        <button
                          onClick={() => onUpdateFine(f.id, { status: 'paid', amountPaid: f.fineAmount })}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
