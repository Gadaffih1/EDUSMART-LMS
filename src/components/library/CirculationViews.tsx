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
  RotateCcw
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
  const [selectedRecordForReturn, setSelectedRecordForReturn] = useState<string | null>(null);

  // New Reservation Form
  const [showResModal, setShowResModal] = useState(false);
  const [resBookId, setResBookId] = useState(books[0]?.id || '');
  const [resBorrowerId, setResBorrowerId] = useState(allUsers[0]?.id || '');

  // Issue Return Desk
  if (section === 'issue_return') {
    const filteredRecords = borrowRecords.filter(r => {
      const matchesSearch = r.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.borrowerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || r.borrowerRole === filterRole;
      return matchesSearch && matchesRole;
    });

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              <span>Circulation Desk: Issue & Return</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Active physical volume loans, return acknowledgments, and loan extensions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title or borrower..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl w-60"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Borrower</th>
                  <th className="py-3 px-4">Role / Grade</th>
                  <th className="py-3 px-4 font-mono">Issued Date</th>
                  <th className="py-3 px-4 font-mono">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {r.bookTitle}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {r.borrowerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="capitalize">{r.borrowerRole}</span>
                      {r.grade && <span> · Gr {r.grade} {r.stream}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{r.borrowedDate}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{r.dueDate}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        r.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        r.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status !== 'returned' ? (
                        <button
                          onClick={() => {
                            onReturnBook(r.id, 'Returned in good condition');
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          Mark Returned
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Archived</span>
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
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Days Overdue</th>
                  <th className="py-3 px-4">Accrued Fine</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.bookTitle}</td>
                    <td className="py-3.5 px-4 text-slate-800">{r.borrowerName} ({r.borrowerRole})</td>
                    <td className="py-3.5 px-4 font-mono text-rose-700 font-bold">{r.dueDate}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600">5 Days</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">KES 50</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onReturnBook(r.id, 'Returned late')}
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
