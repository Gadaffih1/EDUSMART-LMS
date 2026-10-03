import React, { useState } from 'react';
import { 
  User, 
  LibraryBook, 
  LibraryBorrowRecord, 
  GradeLevel, 
  SubjectName 
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Check, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  UserCheck, 
  GraduationCap, 
  Bookmark, 
  FileText, 
  Layers, 
  Filter, 
  RotateCcw,
  BookMarked
} from 'lucide-react';

interface LibrarianWorkspaceProps {
  currentUser: User;
}

export const LibrarianWorkspace: React.FC<LibrarianWorkspaceProps> = ({ currentUser }) => {
  type LibraryTab = 'catalog' | 'circulation' | 'borrow_book' | 'add_book';
  const [activeTab, setActiveTab] = useState<LibraryTab>('catalog');

  const [books, setBooks] = useState<LibraryBook[]>(() => Storage.getLibraryBooks());
  const [borrowRecords, setBorrowRecords] = useState<LibraryBorrowRecord[]>(() => Storage.getBorrowRecords());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Issue Book Form State
  const [issueBookId, setIssueBookId] = useState<string>('');
  const [borrowerType, setBorrowerType] = useState<'student' | 'teacher'>('student');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>('');
  const [borrowDueDate, setBorrowDueDate] = useState<string>('2026-10-15');
  const [borrowRemarks, setBorrowRemarks] = useState<string>('');
  const [issueSuccess, setIssueSuccess] = useState(false);

  // Add Book Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPublisher, setNewPublisher] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newCategory, setNewCategory] = useState<'CBC Textbook' | 'CBC Teacher Guide' | 'Supplementary Reader' | 'Encyclopedia' | 'Fiction Storybook'>('CBC Textbook');
  const [newGrade, setNewGrade] = useState<GradeLevel>(4);
  const [newCopies, setNewCopies] = useState<number>(30);
  const [newShelf, setNewShelf] = useState('');
  const [addBookSuccess, setAddBookSuccess] = useState(false);

  const allUsers = Storage.getUsers();
  const studentsList = allUsers.filter(u => u.role === 'student');
  const teachersList = allUsers.filter(u => ['teacher', 'class_teacher', 'hod', 'dean_of_studies'].includes(u.role));

  // Filtered books
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.locationShelf.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || b.category === categoryFilter;
    const matchesGrade = gradeFilter === 'all' || (b.grade && b.grade.toString() === gradeFilter);
    return matchesSearch && matchesCat && matchesGrade;
  });

  // Issue Book Handler
  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueBookId || !selectedBorrowerId) return;

    const book = books.find(b => b.id === issueBookId);
    const borrower = allUsers.find(u => u.id === selectedBorrowerId);
    if (!book || !borrower) return;

    if (book.copiesAvailable <= 0) {
      alert('No copies currently available for this book.');
      return;
    }

    const newRecord: LibraryBorrowRecord = {
      id: `bor-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      borrowerId: borrower.id,
      borrowerName: borrower.name,
      borrowerRole: borrowerType,
      grade: borrower.grade,
      stream: borrower.stream,
      borrowedDate: new Date().toISOString().split('T')[0],
      dueDate: borrowDueDate,
      status: 'active',
      remarks: borrowRemarks || 'Regular loan issued'
    };

    Storage.borrowBook(newRecord);
    setBorrowRecords(Storage.getBorrowRecords());
    setBooks(Storage.getLibraryBooks());
    setIssueSuccess(true);
    setBorrowRemarks('');
    setTimeout(() => {
      setIssueSuccess(false);
      setActiveTab('circulation');
    }, 1500);
  };

  // Return Book Handler
  const handleReturnBook = (recordId: string) => {
    Storage.returnBook(recordId, 'Returned in good condition');
    setBorrowRecords(Storage.getBorrowRecords());
    setBooks(Storage.getLibraryBooks());
  };

  // Add Book Handler
  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;

    const newBook: LibraryBook = {
      id: `bk-${Date.now()}`,
      isbn: newIsbn || `978-9966-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`,
      title: newTitle.trim(),
      author: newAuthor.trim(),
      publisher: newPublisher.trim() || 'Kenya Educational Press',
      category: newCategory,
      grade: newGrade,
      copiesAvailable: Number(newCopies),
      totalCopies: Number(newCopies),
      locationShelf: newShelf.trim() || 'Shelf GEN-01'
    };

    Storage.saveLibraryBook(newBook);
    setBooks(Storage.getLibraryBooks());
    setAddBookSuccess(true);
    setNewTitle('');
    setNewAuthor('');
    setNewPublisher('');
    setNewIsbn('');
    setNewShelf('');
    setTimeout(() => {
      setAddBookSuccess(false);
      setActiveTab('catalog');
    }, 1500);
  };

  // Metrics
  const totalBooksCount = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const totalAvailableCount = books.reduce((acc, b) => acc + b.copiesAvailable, 0);
  const activeLoansCount = borrowRecords.filter(r => r.status === 'active' || r.status === 'overdue').length;
  const overdueCount = borrowRecords.filter(r => r.status === 'overdue').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-1.5 rounded-xl border border-white/20 shadow-xs hidden sm:block">
              <EduSmartGadsaLogo variant="horizontal" size="xs" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
              <span>School Learning Resource Center</span>
              <span aria-hidden="true">·</span>
              <span>Librarian Console</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            EduSmart Library & Learning Archive
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage physical and digital Competency-Based Curriculum textbooks, issue learning guides, track borrower circulation, and preserve educational media for {currentUser.name}.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/20 shrink-0 text-xs">
          <div className="text-[10px] uppercase font-bold text-amber-300 mb-1">Library Lead</div>
          <div className="font-extrabold text-base">{currentUser.name}</div>
          <div className="text-slate-300 font-mono text-[11px]">{currentUser.tscNumber || 'TSC/48102/ED'}</div>
          <div className="mt-2 pt-2 border-t border-white/20 flex gap-3 text-[11px]">
            <span>{totalBooksCount} Volumes</span>
            <span>·</span>
            <span className="text-emerald-300 font-bold">{totalAvailableCount} Available</span>
            <span>·</span>
            <span className="text-amber-300 font-bold">{activeLoansCount} on Loan</span>
          </div>
        </div>
      </div>

      {/* Primary Action Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'catalog'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-amber-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-amber-100 text-amber-800">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">1. Book Catalog</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'catalog' ? 'text-amber-200' : 'text-slate-500'}`}>
              Search {books.length} titles & shelves
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('circulation')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'circulation'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-amber-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-emerald-100 text-emerald-800">
            <BookMarked className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">2. Circulation Desk</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'circulation' ? 'text-emerald-200' : 'text-slate-500'}`}>
              Active loans & returns ({borrowRecords.length})
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('borrow_book')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'borrow_book'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-amber-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-blue-100 text-blue-800">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">3. Issue Book</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'borrow_book' ? 'text-blue-200' : 'text-slate-500'}`}>
              Lend to learner or teacher
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('add_book')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            activeTab === 'add_book'
              ? 'bg-slate-900 text-white border-slate-950 shadow-sm ring-2 ring-amber-500'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-purple-100 text-purple-800">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">4. Add New Title</div>
            <div className={`text-[10px] mt-0.5 ${activeTab === 'add_book' ? 'text-purple-200' : 'text-slate-500'}`}>
              Register new stock & shelf
            </div>
          </div>
        </button>
      </div>

      {/* ========================================================
          TAB 1: BOOK CATALOG
          ======================================================== */}
      {activeTab === 'catalog' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                School CBC Textbooks & Reader Catalog
              </h2>
              <p className="text-xs text-slate-500">
                Explore available titles, shelf locations, and copies in stock.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, author, ISBN, shelf..."
                  className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-56 sm:w-64"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold"
              >
                <option value="all">All Categories</option>
                <option value="CBC Textbook">CBC Textbook</option>
                <option value="CBC Teacher Guide">CBC Teacher Guide</option>
                <option value="Supplementary Reader">Supplementary Reader</option>
                <option value="Fiction Storybook">Fiction Storybook</option>
                <option value="Encyclopedia">Encyclopedia</option>
              </select>

              {/* Grade Filter */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold"
              >
                <option value="all">All Grades</option>
                {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                  <option key={g} value={g.toString()}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((bk) => (
              <div key={bk.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                      {bk.category}
                    </span>
                    <span className="font-mono text-slate-500 text-[10px]">{bk.locationShelf}</span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm mt-2">{bk.title}</h3>
                  <div className="text-slate-600 mt-0.5">Author: <strong className="text-slate-800">{bk.author}</strong></div>
                  <div className="text-slate-500 text-[11px]">Publisher: {bk.publisher}</div>
                  <div className="font-mono text-slate-400 text-[10px] mt-1">ISBN: {bk.isbn}</div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-900 font-mono">{bk.copiesAvailable}</span> of <span className="font-mono text-slate-600">{bk.totalCopies}</span> copies free
                  </div>
                  <button
                    onClick={() => {
                      setIssueBookId(bk.id);
                      setActiveTab('borrow_book');
                    }}
                    disabled={bk.copiesAvailable <= 0}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      bk.copiesAvailable > 0
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {bk.copiesAvailable > 0 ? 'Issue Book' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 2: CIRCULATION DESK (ACTIVE LOANS & RETURNS)
          ======================================================== */}
      {activeTab === 'circulation' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Active Book Loans & Circulation Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Track borrowed volumes, return dates, and overdue alerts.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                {borrowRecords.filter(r => r.status === 'active').length} Active
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200">
                {overdueCount} Overdue
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
                {borrowRecords.filter(r => r.status === 'returned').length} Returned
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Book Title</th>
                  <th className="py-2.5 px-3">Borrower Name</th>
                  <th className="py-2.5 px-3">Role / Class</th>
                  <th className="py-2.5 px-3">Date Borrowed</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-center">Loan Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {borrowRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 max-w-xs">{rec.bookTitle}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{rec.borrowerName}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="capitalize">{rec.borrowerRole}</span>
                      {rec.grade ? ` (Grade ${rec.grade} ${rec.stream || ''})` : ''}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{rec.borrowedDate}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{rec.dueDate}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        rec.status === 'returned'
                          ? 'bg-slate-100 text-slate-600'
                          : rec.status === 'overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {rec.status !== 'returned' ? (
                        <button
                          onClick={() => handleReturnBook(rec.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors"
                        >
                          Mark Returned
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================
          TAB 3: ISSUE BOOK FORM
          ======================================================== */}
      {activeTab === 'borrow_book' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Circulation Desk: Issue Book on Loan
            </h2>
            <p className="text-xs text-slate-500">
              Register a book loan to an enrolled student or faculty member.
            </p>
          </div>

          {issueSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Book issued successfully! Stock count updated.</span>
            </div>
          )}

          <form onSubmit={handleIssueBook} className="max-w-2xl space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Select Book to Issue *
              </label>
              <select
                required
                value={issueBookId}
                onChange={(e) => setIssueBookId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                <option value="">-- Choose a title from catalog --</option>
                {books.map(b => (
                  <option key={b.id} value={b.id} disabled={b.copiesAvailable <= 0}>
                    {b.title} (Available: {b.copiesAvailable}/{b.totalCopies} · Shelf: {b.locationShelf})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Borrower Type</label>
                <select
                  value={borrowerType}
                  onChange={(e) => {
                    const type = e.target.value as 'student' | 'teacher';
                    setBorrowerType(type);
                    setSelectedBorrowerId(type === 'student' ? studentsList[0]?.id || '' : teachersList[0]?.id || '');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="student">Student / Learner</option>
                  <option value="teacher">Teacher / Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Select Borrower *</label>
                <select
                  required
                  value={selectedBorrowerId}
                  onChange={(e) => setSelectedBorrowerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="">-- Choose Borrower --</option>
                  {(borrowerType === 'student' ? studentsList : teachersList).map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.grade ? `(Grade ${u.grade} ${u.stream || ''})` : ''} - {u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Due Return Date</label>
                <input
                  type="date"
                  required
                  value={borrowDueDate}
                  onChange={(e) => setBorrowDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Loan Remarks / Purpose</label>
                <input
                  type="text"
                  value={borrowRemarks}
                  onChange={(e) => setBorrowRemarks(e.target.value)}
                  placeholder="e.g. CBC Term 1 Science revision project"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Book Loan</span>
            </button>
          </form>
        </section>
      )}

      {/* ========================================================
          TAB 4: ADD NEW BOOK TITLE
          ======================================================== */}
      {activeTab === 'add_book' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Accession New Book into Library Database
            </h2>
            <p className="text-xs text-slate-500">
              Catalog new curriculum titles, supplementary readers, and shelf placements.
            </p>
          </div>

          {addBookSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>New volume added to library catalog!</span>
            </div>
          )}

          <form onSubmit={handleAddBook} className="max-w-2xl space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Book Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Spotlight Social Studies Learner's Book Grade 7"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Author / Editor *</label>
                <input
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="e.g. Kenya Literature Bureau"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Publisher</label>
                <input
                  type="text"
                  value={newPublisher}
                  onChange={(e) => setNewPublisher(e.target.value)}
                  placeholder="e.g. KLB Publishing"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="CBC Textbook">CBC Textbook</option>
                  <option value="CBC Teacher Guide">CBC Teacher Guide</option>
                  <option value="Supplementary Reader">Supplementary Reader</option>
                  <option value="Fiction Storybook">Fiction Storybook</option>
                  <option value="Encyclopedia">Encyclopedia</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Grade</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(Number(e.target.value) as GradeLevel)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Initial Copies</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={newCopies}
                  onChange={(e) => setNewCopies(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">ISBN Number</label>
                <input
                  type="text"
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  placeholder="e.g. 978-9966-25-104-1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Shelf Location</label>
                <input
                  type="text"
                  value={newShelf}
                  onChange={(e) => setNewShelf(e.target.value)}
                  placeholder="e.g. Shelf SS-07A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Save to Library Catalog</span>
            </button>
          </form>
        </section>
      )}

    </div>
  );
};
