import React, { useEffect, useMemo, useState } from 'react';
import {
  User,
  LibraryBook,
  DigitalLibraryItem,
  LibraryShelfLocation,
  LibraryBorrowRecord,
  LibraryReservation,
  GradeLevel,
} from '../../types';
import { Storage } from '../../utils/storage';
import { LibraryRoomBookingButton } from './LibraryRoomBookingButton';
import { ELinksDirectory } from '../resources/ELinksDirectory';
import { ScienceViewerModal } from '../virtuallab/ScienceViewerModal';
import { TenantSchoolLogo } from '../common/TenantSchoolLogo';
import {
  BookOpen,
  Compass,
  Eye,
  FileText,
  Globe,
  Laptop,
  Library,
  Search,
  ShieldCheck,
  Atom,
  X,
  Lock,
  BookmarkPlus,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface TeacherLibraryPortalProps {
  currentUser: User;
}

type LibrarySubTab = 'catalogue' | 'digital' | 'elinks' | 'shelves' | 'my_loans';

export const TeacherLibraryPortal: React.FC<TeacherLibraryPortalProps> = ({ currentUser }) => {
  const [subTab, setSubTab] = useState<LibrarySubTab>('catalogue');
  const [books, setBooks] = useState<LibraryBook[]>(() => Storage.getLibraryBooks());
  const [digitalItems, setDigitalItems] = useState<DigitalLibraryItem[]>(() =>
    Storage.getDigitalLibraryItems()
  );
  const [shelves, setShelves] = useState<LibraryShelfLocation[]>(() =>
    Storage.getLibraryShelves()
  );
  const [borrowRecords, setBorrowRecords] = useState<LibraryBorrowRecord[]>(() =>
    Storage.getBorrowRecords()
  );
  const [reservations, setReservations] = useState<LibraryReservation[]>(() =>
    Storage.getLibraryReservations()
  );
  const [reservationFeedback, setReservationFeedback] = useState<string | null>(null);

  // Filters
  const [bookSearch, setBookSearch] = useState('');
  const [bookCategory, setBookCategory] = useState<string>('all');
  const [bookGrade, setBookGrade] = useState<string>('all');
  const [digitalSearch, setDigitalSearch] = useState('');

  // In-app read-only viewers (Zero Download)
  const [readingBook, setReadingBook] = useState<LibraryBook | null>(null);
  const [readingDigital, setReadingDigital] = useState<DigitalLibraryItem | null>(null);
  const [showScienceModal, setShowScienceModal] = useState(false);

  useEffect(() => {
    const syncBooks = () => setBooks(Storage.getLibraryBooks());
    const syncDigital = () => setDigitalItems(Storage.getDigitalLibraryItems());
    const syncShelves = () => setShelves(Storage.getLibraryShelves());
    const syncLoans = () => {
      setBorrowRecords(Storage.getBorrowRecords());
      setReservations(Storage.getLibraryReservations());
    };

    window.addEventListener('library-books-updated', syncBooks);
    window.addEventListener('digital-library-updated', syncDigital);
    window.addEventListener('library-shelves-updated', syncShelves);
    window.addEventListener('library-borrow-updated', syncLoans);
    window.addEventListener('library-reservations-updated', syncLoans);
    window.addEventListener('edusmart:data-changed', syncBooks);
    window.addEventListener('edusmart:data-changed', syncDigital);
    window.addEventListener('edusmart:data-changed', syncLoans);

    return () => {
      window.removeEventListener('library-books-updated', syncBooks);
      window.removeEventListener('digital-library-updated', syncDigital);
      window.removeEventListener('library-shelves-updated', syncShelves);
      window.removeEventListener('library-borrow-updated', syncLoans);
      window.removeEventListener('library-reservations-updated', syncLoans);
      window.removeEventListener('edusmart:data-changed', syncBooks);
      window.removeEventListener('edusmart:data-changed', syncDigital);
      window.removeEventListener('edusmart:data-changed', syncLoans);
    };
  }, []);

  const myBorrowRecords = useMemo(() => {
    const uid = String(currentUser.id || '').toLowerCase();
    const uname = String(currentUser.name || '').toLowerCase();
    return borrowRecords.filter(
      (r) =>
        String(r.borrowerId || '').toLowerCase() === uid ||
        String(r.borrowerName || '').toLowerCase() === uname
    );
  }, [borrowRecords, currentUser.id, currentUser.name]);

  const myReservations = useMemo(() => {
    const uid = String(currentUser.id || '').toLowerCase();
    const uname = String(currentUser.name || '').toLowerCase();
    return reservations.filter(
      (r) =>
        String(r.borrowerId || '').toLowerCase() === uid ||
        String(r.borrowerName || '').toLowerCase() === uname
    );
  }, [reservations, currentUser.id, currentUser.name]);

  const handleReserveBook = (book: LibraryBook) => {
    const alreadyPending = myReservations.some(
      (r) => r.bookId === book.id && (r.status === 'pending' || r.status === 'ready_for_pickup')
    );
    if (alreadyPending) {
      setReservationFeedback(`You already have an active reservation for "${book.title}".`);
      setTimeout(() => setReservationFeedback(null), 4000);
      return;
    }

    const today = new Date();
    const expiry = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const newReservation: LibraryReservation = {
      id: `res-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      borrowerId: currentUser.id,
      borrowerName: currentUser.name,
      borrowerRole: 'teacher',
      grade: currentUser.grade,
      stream: currentUser.stream,
      reservationDate: today.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      status: 'pending',
      notes: 'Requested by Subject Teacher via School Library Portal',
    };
    Storage.addLibraryReservation(newReservation);
    setReservations(Storage.getLibraryReservations());
    setReservationFeedback(`Reserved "${book.title}" for pickup at the Library Desk.`);
    setTimeout(() => setReservationFeedback(null), 4000);
  };

  const bookCategories = useMemo(
    () => Array.from(new Set(books.map((b) => b.category).filter(Boolean))),
    [books]
  );

  const filteredBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    return books.filter((b) => {
      if (bookCategory !== 'all' && b.category !== bookCategory) return false;
      if (bookGrade !== 'all' && String(b.grade || '') !== bookGrade) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        (b.subject || '').toLowerCase().includes(q) ||
        b.locationShelf.toLowerCase().includes(q)
      );
    });
  }, [books, bookSearch, bookCategory, bookGrade]);

  const filteredDigital = useMemo(() => {
    const q = digitalSearch.trim().toLowerCase();
    return digitalItems.filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.fileType.toLowerCase().includes(q)
      );
    });
  }, [digitalItems, digitalSearch]);

  return (
    <section className="space-y-6">
      {/* Header Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <div className="shrink-0">
            <TenantSchoolLogo variant="emblem" size="sm" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[10px] font-bold uppercase tracking-wider">
              <Library className="w-3.5 h-3.5" />
              <span>Subject Teacher School Library Access</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight">
              School Library Contents & Digital Repository
            </h2>
            <p className="text-xs text-purple-100/80 max-w-2xl leading-relaxed">
              Full faculty access to all library course books, CBC teacher guides, digital e-books, curated E-Links, shelf locations, book reservations, and Library Room Booking. Downloads are strictly disabled — all digital content opens in the secure in-app viewer.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowScienceModal(true)}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Atom className="w-3.5 h-3.5 shrink-0" />
            <span>3D Science Explorer</span>
          </button>
          <LibraryRoomBookingButton
            currentUser={currentUser}
            variant="hero"
            label="Book Library Room"
          />
        </div>
      </div>

      {/* Anti-Download Notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Read-Only Digital Protection:</strong> Downloading library contents or shared E-resources is strictly restricted across EduSmart. Use the in-app reader for classroom instruction and reference.
        </span>
      </div>

      {reservationFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reservationFeedback}</span>
        </div>
      )}

      {/* Sub-Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setSubTab('catalogue')}
          className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            subTab === 'catalogue'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>Library Catalogue ({books.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('digital')}
          className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            subTab === 'digital'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Laptop className="w-3.5 h-3.5 shrink-0" />
          <span>Digital E-Books ({digitalItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('elinks')}
          className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            subTab === 'elinks'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span>Curated E-Links</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('shelves')}
          className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            subTab === 'shelves'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-3.5 h-3.5 shrink-0" />
          <span>Shelves & Stacks ({shelves.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('my_loans')}
          className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            subTab === 'my_loans'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>My Loans & Reservations ({myBorrowRecords.length + myReservations.length})</span>
        </button>
      </div>

      {/* TAB 1: MASTER CATALOGUE & CBC BOOKS */}
      {subTab === 'catalogue' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Search title, author, subject, ISBN..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={bookCategory}
              onChange={(e) => setBookCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-700"
            >
              <option value="all">All Book Categories</option>
              {bookCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={bookGrade}
              onChange={(e) => setBookGrade(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-700"
            >
              <option value="all">All Grades</option>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map((g) => (
                <option key={g} value={String(g)}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No library books matched your filter</p>
              <p className="text-xs text-slate-500">Try clearing the search query or grade filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        {book.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          book.copiesAvailable > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {book.copiesAvailable}/{book.totalCopies} Available
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{book.title}</h4>
                    <div className="text-xs text-slate-600">
                      By <strong>{book.author}</strong> · {book.publisher}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Shelf Location:</span>
                        <span className="font-mono font-bold text-slate-800">{book.locationShelf}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ISBN:</span>
                        <span className="font-mono text-slate-700">{book.isbn}</span>
                      </div>
                      {(book.grade || book.subject) && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Curriculum:</span>
                          <span className="font-bold text-purple-800">
                            {book.grade ? `Grade ${book.grade}` : 'All Grades'}
                            {book.subject ? ` · ${book.subject}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleReserveBook(book)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
                      <span>Reserve Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReadingBook(book)}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>Inspect Book</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIGITAL LIBRARY & E-BOOKS (ANTI-DOWNLOAD) */}
      {subTab === 'digital' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={digitalSearch}
                onChange={(e) => setDigitalSearch(e.target.value)}
                placeholder="Search digital e-books, compendiums, audiobooks..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Downloads Disabled · Secure Reader</span>
            </span>
          </div>

          {filteredDigital.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
              <Laptop className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No digital library items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDigital.map((dig) => (
                <div
                  key={dig.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between"
                >
                  <div className={`p-5 bg-gradient-to-br ${dig.coverColor || 'from-purple-700 to-indigo-900'} text-white`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/20 text-white">
                        {dig.fileType} · {dig.fileSize}
                      </span>
                      {dig.gradeLevel && (
                        <span className="text-[10px] font-bold bg-black/25 px-2 py-0.5 rounded">
                          Grade {dig.gradeLevel}
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-base mt-3 leading-snug line-clamp-2">{dig.title}</h4>
                    <div className="text-xs text-white/85 mt-1">By {dig.author}</div>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">{dig.category}</span>
                    <button
                      type="button"
                      onClick={() => setReadingDigital(dig)}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] sm:text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read In-App</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CURATED E-LINKS DIRECTORY */}
      {subTab === 'elinks' && (
        <ELinksDirectory
          currentUser={currentUser}
          canManage={true}
          title="Library & Curriculum E-Links Directory"
          subtitle="Browse verified educational websites, KICD portals, and STEM reference directories. Only the user who added an E-Link or the System Administrator can delete it."
        />
      )}

      {/* TAB 4: SHELVES & FLOOR GUIDE */}
      {subTab === 'shelves' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shelves.map((sh) => (
            <div key={sh.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {sh.code}
                  </span>
                  <h4 className="font-bold text-base text-slate-900 mt-1">{sh.sectionName}</h4>
                  <div className="text-xs text-slate-500">
                    {sh.floor} · {sh.aisle}
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                  {sh.deweyRange}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span>
                  Specialization: <strong>{sh.categorySpecialization}</strong>
                </span>
                <span className="font-mono font-bold text-purple-700">
                  {sh.currentCount} / {sh.capacity} Books
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: MY BORROWED BOOKS & RESERVATIONS */}
      {subTab === 'my_loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-700" />
              <span>My Borrowed Library Books ({myBorrowRecords.length})</span>
            </h3>
            {myBorrowRecords.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No physical library books are currently issued to your account. Reserve any title from the catalogue and collect it at the Library Desk.
              </p>
            ) : (
              <div className="space-y-2.5">
                {myBorrowRecords.map((rec) => (
                  <div key={rec.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{rec.bookTitle}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rec.status === 'returned'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'overdue'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Borrowed: {rec.borrowedDate} · Due: <strong className="text-slate-700">{rec.dueDate}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BookmarkPlus className="w-4 h-4 text-emerald-700" />
              <span>My Book Reservations ({myReservations.length})</span>
            </h3>
            {myReservations.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                You have not placed any book reservations yet. Click &ldquo;Reserve Copy&rdquo; on any book in the Library Catalogue.
              </p>
            ) : (
              <div className="space-y-2.5">
                {myReservations.map((res) => (
                  <div key={res.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{res.bookTitle}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200">
                        {res.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Reserved: {res.reservationDate} · Hold Until: <strong className="text-slate-700">{res.expiryDate}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* IN-APP BOOK DETAILS MODAL (READ-ONLY) */}
      {readingBook && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setReadingBook(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 select-none"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  {readingBook.category}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1.5">{readingBook.title}</h3>
                <p className="text-xs text-slate-500">
                  By {readingBook.author} · {readingBook.publisher}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReadingBook(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Shelf Location</span>
                <span className="font-mono font-bold text-slate-900">{readingBook.locationShelf}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">ISBN</span>
                <span className="font-mono font-bold text-slate-900">{readingBook.isbn}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Stock Status</span>
                <span className="font-bold text-emerald-700">
                  {readingBook.copiesAvailable} available of {readingBook.totalCopies}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Target Level</span>
                <span className="font-bold text-slate-900">
                  {readingBook.grade ? `Grade ${readingBook.grade}` : 'All Grades'}
                  {readingBook.subject ? ` · ${readingBook.subject}` : ''}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center justify-between gap-2">
              <span>Want to bring your class to study this title in the Library?</span>
              <LibraryRoomBookingButton
                currentUser={currentUser}
                variant="compact"
                label="Book Room"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setReadingBook(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP SECURE DIGITAL E-BOOK READER (ZERO DOWNLOADS) */}
      {readingDigital && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setReadingDigital(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 select-none"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-purple-300 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-black truncate">{readingDigital.title}</h3>
                  <div className="text-[11px] text-slate-300 truncate">
                    By {readingDigital.author} · {readingDigital.fileType} · View-Only Protected
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReadingDigital(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900 font-semibold flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Download Restricted · Secure In-App Library Reader</span>
              </span>
              <span className="font-mono text-[10px] text-amber-700 hidden sm:inline">
                NO EXPORT · CBC DIGITAL LIBRARY
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-slate-100">
              {readingDigital.readUrl &&
              (readingDigital.readUrl.startsWith('/api/files/') ||
                readingDigital.readUrl.startsWith('http://') ||
                readingDigital.readUrl.startsWith('https://')) ? (
                readingDigital.fileType === 'Video' ? (
                  <video
                    controls
                    playsInline
                    controlsList="nodownload"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    src={readingDigital.readUrl}
                    className="w-full max-h-[55vh] rounded-xl bg-black"
                  />
                ) : readingDigital.fileType === 'Audiobook' ? (
                  <div className="p-6 bg-slate-900 rounded-xl text-white space-y-4">
                    <div className="text-sm font-bold">{readingDigital.title}</div>
                    <audio
                      controls
                      controlsList="nodownload"
                      onContextMenu={(e) => e.preventDefault()}
                      src={readingDigital.readUrl}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <iframe
                    src={`${readingDigital.readUrl}${readingDigital.readUrl.includes('#') ? '' : '#toolbar=0&navpanes=0'}`}
                    title={readingDigital.title}
                    className="w-full h-[55vh] rounded-xl border border-slate-200 bg-white"
                  />
                )
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-700 uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>{readingDigital.category}</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900">{readingDigital.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Author / Publisher: <strong>{readingDigital.author}</strong>. Format: <strong>{readingDigital.fileType}</strong> ({readingDigital.fileSize}).
                    {readingDigital.gradeLevel ? ` Recommended for Grade ${readingDigital.gradeLevel}.` : ''}
                  </p>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    This digital library volume is unlocked for in-app faculty reading and classroom projection. Direct file downloading and local saving are disabled under school library copyright & E-resource protection policy.
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Protected by EduSmart Library DRM</span>
              <button
                type="button"
                onClick={() => setReadingDigital(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      <ScienceViewerModal isOpen={showScienceModal} onClose={() => setShowScienceModal(false)} />
    </section>
  );
};
