import React from 'react';
import { 
  BookOpen, 
  ArrowLeftRight, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  Sparkles, 
  Laptop, 
  TrendingUp, 
  Plus, 
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  Bookmark,
  Globe
} from 'lucide-react';
import { 
  LibraryBook, 
  LibraryBorrowRecord, 
  LibraryReservation, 
  LibraryFine,
  ReadingProgrammeMember 
} from '../../types';
import { LibraryPortalSection } from './types';

interface LibraryDashboardViewProps {
  books: LibraryBook[];
  borrowRecords: LibraryBorrowRecord[];
  reservations: LibraryReservation[];
  fines: LibraryFine[];
  readingMembers: ReadingProgrammeMember[];
  onNavigate: (section: LibraryPortalSection) => void;
  onOpenIssueModal: () => void;
  onOpenAddBookModal: () => void;
}

export const LibraryDashboardView: React.FC<LibraryDashboardViewProps> = ({
  books,
  borrowRecords,
  reservations,
  fines,
  readingMembers,
  onNavigate,
  onOpenIssueModal,
  onOpenAddBookModal
}) => {
  const totalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableCopies = books.reduce((acc, b) => acc + b.copiesAvailable, 0);
  const activeLoans = borrowRecords.filter(r => r.status === 'active');
  const overdueLoans = borrowRecords.filter(r => r.status === 'overdue');
  const pendingReservations = reservations.filter(r => r.status === 'pending' || r.status === 'ready_for_pickup');
  const totalUnpaidFines = fines.filter(f => f.status === 'unpaid').reduce((acc, f) => acc + f.fineAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EduSmart Comprehensive Library Automation System</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Library Information & Circulation Hub
            </h2>
            <p className="text-purple-100/80 text-xs sm:text-sm mt-1 max-w-xl">
              Catalogue management, digital barcode circulation, reservation queues, CBC supplementary readers, and reading challenge analytics.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate('digital_library')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-blue-200" />
              <span>Digital E-Links & Library</span>
            </button>
            <button
              onClick={onOpenIssueModal}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Issue Book (Loan)</span>
            </button>
            <button
              onClick={onOpenAddBookModal}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-300" />
              <span>Add New Title</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => onNavigate('books_resources')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Holdings</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCopies}</div>
          <div className="text-[10px] text-slate-400 mt-1">{books.length} unique titles</div>
        </div>

        <div 
          onClick={() => onNavigate('issue_return')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Loans</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{activeLoans.length}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">In circulation</div>
        </div>

        <div 
          onClick={() => onNavigate('overdue')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-rose-300 transition-all cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overdue Items</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{overdueLoans.length}</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-1">Requires reminder</div>
        </div>

        <div 
          onClick={() => onNavigate('reservations')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reservations</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingReservations.length}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Pending pickup</div>
        </div>

        <div 
          onClick={() => onNavigate('fines_charges')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Unpaid Fines</div>
          <div className="text-2xl font-black text-purple-700 mt-1">KES {totalUnpaidFines}</div>
          <div className="text-[10px] text-purple-700 font-semibold mt-1">{fines.filter(f => f.status === 'unpaid').length} accounts</div>
        </div>

        <div 
          onClick={() => onNavigate('reading_programme')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all cursor-pointer"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reading League</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{readingMembers.length}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Active scholars</div>
        </div>
      </div>

      {/* Main Grid: Active Circulations & Recent Cataloguing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Live Circulation Desk */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                <span>Recent Borrowing & Circulation Activity</span>
              </h3>
              <button
                onClick={() => onNavigate('issue_return')}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
              >
                <span>Full Ledger ({borrowRecords.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {borrowRecords.slice(0, 5).map((rec) => (
                <div key={rec.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      rec.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      rec.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {rec.status === 'active' ? '📖' : rec.status === 'overdue' ? '⚠️' : '✓'}
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 line-clamp-1">{rec.bookTitle}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Borrower: <strong>{rec.borrowerName}</strong> ({rec.borrowerRole}) · Due: {rec.dueDate}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    rec.status === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    rec.status === 'overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Catalogue Spotlight */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Featured Titles in Circulation</span>
              </h3>
              <button
                onClick={() => onNavigate('catalogue')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Browse Catalogue →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {books.slice(0, 4).map((book) => (
                <div key={book.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {book.category}
                    </span>
                    <h5 className="font-bold text-xs text-slate-900 mt-1.5 line-clamp-1">{book.title}</h5>
                    <div className="text-[11px] text-slate-500">By {book.author}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-600 font-semibold">{book.locationShelf}</span>
                    <span className="font-bold text-emerald-700">{book.copiesAvailable}/{book.totalCopies} Available</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Overdue Action & Reservations */}
        <div className="space-y-4">
          
          {/* Overdue Alarms Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Overdue Books Priority</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono">
                {overdueLoans.length} Alerts
              </span>
            </div>

            {overdueLoans.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No titles currently overdue. Excellent circulation compliance!
              </div>
            ) : (
              <div className="space-y-2.5">
                {overdueLoans.map((ov) => (
                  <div key={ov.id} className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-xs">
                    <div className="font-bold text-slate-900 line-clamp-1">{ov.bookTitle}</div>
                    <div className="text-[11px] text-rose-900 font-medium mt-0.5">
                      Borrower: {ov.borrowerName} ({ov.borrowerRole})
                    </div>
                    <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-500">Due: {ov.dueDate}</span>
                      <button
                        onClick={() => onNavigate('overdue')}
                        className="text-rose-700 font-bold hover:underline"
                      >
                        Send Notice →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Reservations Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-amber-500" />
                <span>Reserved Holds Queue</span>
              </h3>
              <button
                onClick={() => onNavigate('reservations')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                View Holds →
              </button>
            </div>

            <div className="space-y-2">
              {reservations.slice(0, 3).map((res) => (
                <div key={res.id} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
                  <div className="font-bold text-slate-900 line-clamp-1">{res.bookTitle}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Reserved by <strong>{res.borrowerName}</strong>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-amber-900">
                    <span>Pickup Expiry: {res.expiryDate}</span>
                    <span className="font-bold uppercase">{res.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
