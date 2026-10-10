import React, { useState, useEffect } from 'react';
import { 
  User, 
  LibraryBook, 
  LibraryBorrowRecord, 
  LibraryReservation, 
  LibraryFine, 
  LibraryAcquisition, 
  LibraryShelfLocation, 
  DigitalLibraryItem, 
  ReadingProgrammeMember, 
  LibraryAttendanceLog, 
  LibraryTimetableSlot, 
  LibraryEvent, 
  LibraryPolicy, 
  LibraryAuditLog,
  GradeLevel
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { LibraryPortalSection } from './types';
import { LibrarySidebar } from './LibrarySidebar';
import { LibraryDashboardView } from './LibraryDashboardView';
import { CirculationViews } from './CirculationViews';
import { CollectionViews } from './CollectionViews';
import { ProgrammesViews } from './ProgrammesViews';
import { GovernanceViews } from './GovernanceViews';
import { LibraryRoomBookingButton } from './LibraryRoomBookingButton';
import { 
  LogOut, 
  Menu, 
  X, 
  ArrowLeftRight, 
  Plus, 
  BookOpen, 
  Sparkles,
  Search
} from 'lucide-react';

interface LibrarianWorkspaceProps {
  currentUser: User;
  onLogout?: () => void;
}

export const LibrarianWorkspace: React.FC<LibrarianWorkspaceProps> = ({
  currentUser,
  onLogout
}) => {
  const [currentSection, setCurrentSection] = useState<LibraryPortalSection>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Storage states
  const [books, setBooks] = useState<LibraryBook[]>(() => Storage.getLibraryBooks());
  const [borrowRecords, setBorrowRecords] = useState<LibraryBorrowRecord[]>(() => Storage.getBorrowRecords());
  const [reservations, setReservations] = useState<LibraryReservation[]>(() => Storage.getLibraryReservations());
  const [fines, setFines] = useState<LibraryFine[]>(() => Storage.getLibraryFines());
  const [acquisitions, setAcquisitions] = useState<LibraryAcquisition[]>(() => Storage.getLibraryAcquisitions());
  const [shelves, setShelves] = useState<LibraryShelfLocation[]>(() => Storage.getLibraryShelves());
  const [digitalItems, setDigitalItems] = useState<DigitalLibraryItem[]>(() => Storage.getDigitalLibraryItems());
  const [readingMembers, setReadingMembers] = useState<ReadingProgrammeMember[]>(() => Storage.getReadingProgrammeMembers());
  const [attendanceLogs, setAttendanceLogs] = useState<LibraryAttendanceLog[]>(() => Storage.getLibraryAttendance());
  const [timetableSlots, setTimetableSlots] = useState<LibraryTimetableSlot[]>(() => Storage.getLibraryTimetable());
  const [events, setEvents] = useState<LibraryEvent[]>(() => Storage.getLibraryEvents());
  const [policies, setPolicies] = useState<LibraryPolicy[]>(() => Storage.getLibraryPolicies());
  const [auditLogs, setAuditLogs] = useState<LibraryAuditLog[]>(() => Storage.getLibraryAuditLogs());

  // Quick Issue Modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueBookId, setIssueBookId] = useState(books[0]?.id || '');
  const [issueCopyId, setIssueCopyId] = useState('');
  const [issueBorrowerId, setIssueBorrowerId] = useState('');
  const [issueBorrowerRole, setIssueBorrowerRole] = useState<'student' | 'teacher'>('student');
  const [issueDueDate, setIssueDueDate] = useState('2026-10-18');
  const [issueRemarks, setIssueRemarks] = useState('');

  // Quick Add Book Modal state
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('978-9966-');
  const [newPublisher, setNewPublisher] = useState('Kenya Literature Bureau');
  const [newCategory, setNewCategory] = useState<'CBC Textbook' | 'CBC Teacher Guide' | 'Supplementary Reader' | 'Encyclopedia' | 'Fiction Storybook'>('CBC Textbook');
  const [newAcqType, setNewAcqType] = useState<'Stocked' | 'Donated'>('Stocked');
  const [newDonorName, setNewDonorName] = useState('School Capitation Grant');
  const [newPrefix, setNewPrefix] = useState('ACC-KLB');
  const [newCopies, setNewCopies] = useState(30);
  const [newShelf, setNewShelf] = useState('SEC-A-01');

  const allUsers = Storage.getUsers();

  // Storage event sync
  useEffect(() => {
    const handleBooks = () => setBooks(Storage.getLibraryBooks());
    const handleBorrow = () => setBorrowRecords(Storage.getBorrowRecords());
    const handleRes = () => setReservations(Storage.getLibraryReservations());
    const handleFines = () => setFines(Storage.getLibraryFines());
    const handleAcq = () => setAcquisitions(Storage.getLibraryAcquisitions());
    const handleShelves = () => setShelves(Storage.getLibraryShelves());
    const handleDig = () => setDigitalItems(Storage.getDigitalLibraryItems());
    const handleReading = () => setReadingMembers(Storage.getReadingProgrammeMembers());
    const handleAtt = () => setAttendanceLogs(Storage.getLibraryAttendance());
    const handleTime = () => setTimetableSlots(Storage.getLibraryTimetable());
    const handleEvt = () => setEvents(Storage.getLibraryEvents());
    const handlePol = () => setPolicies(Storage.getLibraryPolicies());
    const handleAud = () => setAuditLogs(Storage.getLibraryAuditLogs());

    window.addEventListener('library-books-updated', handleBooks);
    window.addEventListener('library-borrow-records-updated', handleBorrow);
    window.addEventListener('library-reservations-updated', handleRes);
    window.addEventListener('library-fines-updated', handleFines);
    window.addEventListener('library-acquisitions-updated', handleAcq);
    window.addEventListener('library-shelves-updated', handleShelves);
    window.addEventListener('digital-library-updated', handleDig);
    window.addEventListener('reading-programme-updated', handleReading);
    window.addEventListener('library-attendance-updated', handleAtt);
    window.addEventListener('library-timetable-updated', handleTime);
    window.addEventListener('library-events-updated', handleEvt);
    window.addEventListener('library-policies-updated', handlePol);
    window.addEventListener('library-audit-updated', handleAud);

    return () => {
      window.removeEventListener('library-books-updated', handleBooks);
      window.removeEventListener('library-borrow-records-updated', handleBorrow);
      window.removeEventListener('library-reservations-updated', handleRes);
      window.removeEventListener('library-fines-updated', handleFines);
      window.removeEventListener('library-acquisitions-updated', handleAcq);
      window.removeEventListener('library-shelves-updated', handleShelves);
      window.removeEventListener('digital-library-updated', handleDig);
      window.removeEventListener('reading-programme-updated', handleReading);
      window.removeEventListener('library-attendance-updated', handleAtt);
      window.removeEventListener('library-timetable-updated', handleTime);
      window.removeEventListener('library-events-updated', handleEvt);
      window.removeEventListener('library-policies-updated', handlePol);
      window.removeEventListener('library-audit-updated', handleAud);
    };
  }, []);

  // Actions
  const handleIssueBook = (record: LibraryBorrowRecord) => {
    Storage.borrowBook(record);
    Storage.addLibraryAuditLog({
      id: `aud-${Date.now()}`,
      action: 'Book Loan Issued',
      performedBy: currentUser.name,
      role: 'librarian',
      timestamp: new Date().toISOString(),
      details: `Issued "${record.bookTitle}" to ${record.borrowerName} (${record.borrowerRole})`
    });
    setBooks(Storage.getLibraryBooks());
    setBorrowRecords(Storage.getBorrowRecords());
    setAuditLogs(Storage.getLibraryAuditLogs());
  };

  const handleReturnBook = (recordId: string, remarks?: string) => {
    Storage.returnBook(recordId, remarks);
    Storage.addLibraryAuditLog({
      id: `aud-${Date.now()}`,
      action: 'Book Loan Returned',
      performedBy: currentUser.name,
      role: 'librarian',
      timestamp: new Date().toISOString(),
      details: `Returned loan record ${recordId}. Remarks: ${remarks || 'None'}`
    });
    setBooks(Storage.getLibraryBooks());
    setBorrowRecords(Storage.getBorrowRecords());
    setAuditLogs(Storage.getLibraryAuditLogs());
  };

  const handleAddBook = (book: LibraryBook) => {
    Storage.saveLibraryBook(book);
    Storage.addLibraryAuditLog({
      id: `aud-${Date.now()}`,
      action: 'New Title Catalogued',
      performedBy: currentUser.name,
      role: 'librarian',
      timestamp: new Date().toISOString(),
      details: `Catalogued "${book.title}" (${book.isbn}) - ${book.totalCopies} copies`
    });
    setBooks(Storage.getLibraryBooks());
    setAuditLogs(Storage.getLibraryAuditLogs());
  };

  const handleQuickIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bk = books.find(b => b.id === issueBookId);
    const user = allUsers.find(u => u.id === issueBorrowerId);
    if (!bk || !user) return;

    if (bk.copiesAvailable <= 0) {
      alert('No available copies of this title currently.');
      return;
    }

    const assignedCopyId = issueCopyId.trim() || `${bk.accessionPrefix || 'ACC'}-${String(bk.totalCopies - bk.copiesAvailable + 1).padStart(3, '0')}`;

    // Verify Unique ID is not currently loaned
    const activeLoans = borrowRecords.filter(r => r.status !== 'returned');
    const duplicate = activeLoans.some(r => r.bookCopyId && r.bookCopyId.trim().toUpperCase() === assignedCopyId.toUpperCase());
    if (duplicate) {
      alert(`The Unique ID "${assignedCopyId}" is already checked out to another borrower! Please select/enter an available unique copy ID.`);
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
      remarks: issueRemarks || 'Circulated at main desk'
    };

    handleIssueBook(newRec);
    setShowIssueModal(false);
    setIssueCopyId('');
    setIssueRemarks('');
  };

  // Section categorize
  const isCirculation = ['issue_return', 'reservations', 'borrowers', 'overdue', 'fines_charges'].includes(currentSection);
  const isCollection = ['catalogue', 'books_resources', 'acquisitions', 'inventory', 'shelves_locations', 'digital_library', 'virtual_lab'].includes(currentSection);
  const isProgrammes = ['reading_programme', 'attendance', 'timetable', 'room_booking', 'events_programmes'].includes(currentSection);
  const isGovernance = ['reports_analytics', 'notifications', 'policies', 'settings', 'audit_trail'].includes(currentSection);

  const overdueCount = borrowRecords.filter(r => r.status === 'overdue').length;
  const reservationsCount = reservations.filter(r => r.status === 'pending' || r.status === 'ready_for_pickup').length;
  const unpaidFinesCount = fines.filter(f => f.status === 'unpaid').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="bg-white p-1 rounded-xl shadow-2xs">
              <EduSmartGadsaLogo variant="horizontal" size="sm" />
            </div>

            <div className="hidden sm:block border-l border-slate-700 pl-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-purple-500 text-white uppercase tracking-wider">
                  📚 Library Portal
                </span>
                <span className="text-xs text-slate-300 font-bold">
                  Dewey & CBC Information Hub
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LibraryRoomBookingButton 
              currentUser={currentUser} 
              variant="header" 
              label="Book Library Room" 
            />

            <div className="text-right hidden sm:block">
              <div className="font-bold text-xs text-white">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-purple-300 font-medium">
                Head Librarian & Information Specialist
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout with Sidebar Tree */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <LibrarySidebar
          currentSection={currentSection}
          onSelectSection={setCurrentSection}
          overdueCount={overdueCount}
          reservationsCount={reservationsCount}
          unpaidFinesCount={unpaidFinesCount}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentSection === 'dashboard' && (
            <LibraryDashboardView
              currentUser={currentUser}
              books={books}
              borrowRecords={borrowRecords}
              reservations={reservations}
              fines={fines}
              readingMembers={readingMembers}
              onNavigate={setCurrentSection}
              onOpenIssueModal={() => setShowIssueModal(true)}
              onOpenAddBookModal={() => setShowAddBookModal(true)}
            />
          )}

          {isCirculation && (
            <CirculationViews
              section={currentSection}
              books={books}
              borrowRecords={borrowRecords}
              reservations={reservations}
              fines={fines}
              allUsers={allUsers}
              onIssueBook={handleIssueBook}
              onReturnBook={handleReturnBook}
              onUpdateReservation={(id, updates) => {
                Storage.updateLibraryReservation(id, updates);
                setReservations(Storage.getLibraryReservations());
              }}
              onAddReservation={(res) => {
                Storage.addLibraryReservation(res);
                setReservations(Storage.getLibraryReservations());
              }}
              onUpdateFine={(id, updates) => {
                Storage.updateLibraryFine(id, updates);
                setFines(Storage.getLibraryFines());
              }}
              onAddFine={(fine) => {
                Storage.addLibraryFine(fine);
                setFines(Storage.getLibraryFines());
              }}
            />
          )}

          {isCollection && (
            <CollectionViews
              currentUser={currentUser}
              section={currentSection}
              books={books}
              borrowRecords={borrowRecords}
              allUsers={allUsers}
              acquisitions={acquisitions}
              shelves={shelves}
              digitalItems={digitalItems}
              onAddBook={handleAddBook}
              onAddAcquisition={(acq) => {
                Storage.addLibraryAcquisition(acq);
                setAcquisitions(Storage.getLibraryAcquisitions());
              }}
              onAddDigitalItem={(item) => {
                Storage.addDigitalLibraryItem(item);
                setDigitalItems(Storage.getDigitalLibraryItems());
              }}
              onIssueBook={handleIssueBook}
              onReturnBook={handleReturnBook}
            />
          )}

          {isProgrammes && (
            <ProgrammesViews
              currentUser={currentUser}
              section={currentSection}
              readingMembers={readingMembers}
              attendanceLogs={attendanceLogs}
              timetableSlots={timetableSlots}
              events={events}
              onAddAttendanceLog={(log) => {
                Storage.addLibraryAttendanceLog(log);
                setAttendanceLogs(Storage.getLibraryAttendance());
              }}
              onAddTimetableSlot={(slot) => {
                Storage.addLibraryTimetableSlot(slot);
                setTimetableSlots(Storage.getLibraryTimetable());
              }}
              onAddEvent={(event) => {
                Storage.addLibraryEvent(event);
                setEvents(Storage.getLibraryEvents());
              }}
            />
          )}

          {isGovernance && (
            <GovernanceViews
              section={currentSection}
              policies={policies}
              auditLogs={auditLogs}
              books={books}
              borrowRecords={borrowRecords}
              onUpdatePolicy={(id, updates) => {
                Storage.updateLibraryPolicy(id, updates);
                setPolicies(Storage.getLibraryPolicies());
              }}
              onAddAuditLog={(log) => {
                Storage.addLibraryAuditLog(log);
                setAuditLogs(Storage.getLibraryAuditLogs());
              }}
            />
          )}
        </main>
      </div>

      {/* Quick Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-purple-300" />
                <span>Issue Book (Circulation Checkout)</span>
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-300 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleQuickIssueSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Book</label>
                <select
                  value={issueBookId}
                  onChange={(e) => {
                    setIssueBookId(e.target.value);
                    const bk = books.find(b => b.id === e.target.value);
                    if (bk) {
                      const activeLoans = borrowRecords.filter(r => r.status !== 'returned');
                      const firstAvail = bk.uniqueCopyIds?.find(cid => !activeLoans.some(r => r.bookCopyId === cid));
                      setIssueCopyId(firstAvail || `${bk.accessionPrefix || 'ACC'}-001`);
                    }
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title} — {b.publisher} ({b.copiesAvailable}/{b.totalCopies} Avail)</option>
                  ))}
                </select>
              </div>

              {(() => {
                const bk = books.find(b => b.id === issueBookId);
                if (!bk) return null;
                return (
                  <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-[11px] space-y-0.5">
                    <div>Publisher: <strong>{bk.publisher}</strong> · {bk.acquisitionType || 'Stocked'}</div>
                    <div className="text-slate-500">Shelf: {bk.locationShelf}</div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Book Unique ID given by Librarian *
                </label>
                <input
                  type="text"
                  required
                  value={issueCopyId}
                  onChange={(e) => setIssueCopyId(e.target.value)}
                  placeholder="e.g. ACC-KLB-M4-001"
                  className="w-full text-xs border border-purple-300 bg-purple-50/50 rounded-lg p-2 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500">
                  Multiple borrowers can receive this same title & publisher, but each gets a distinct Unique ID.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Borrower Type</label>
                  <select
                    value={issueBorrowerRole}
                    onChange={(e) => setIssueBorrowerRole(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={issueDueDate}
                    onChange={(e) => setIssueDueDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Member</label>
                <select
                  value={issueBorrowerId}
                  onChange={(e) => setIssueBorrowerId(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="">-- Choose Borrower --</option>
                  {allUsers
                    .filter(u => issueBorrowerRole === 'student' ? u.role === 'student' : ['teacher', 'class_teacher', 'hod', 'dean_of_studies'].includes(u.role))
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.grade ? `(Grade ${u.grade})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={issueRemarks}
                  onChange={(e) => setIssueRemarks(e.target.value)}
                  placeholder="e.g. Supplementary homework reading"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 text-white font-black text-xs rounded-lg shadow-xs"
                >
                  Complete Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm text-slate-900">Add Book Title</h4>
              <button onClick={() => setShowAddBookModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title of book..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Author</label>
                <input
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ISBN</label>
                <input
                  type="text"
                  required
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="CBC Textbook">CBC Textbook</option>
                  <option value="CBC Teacher Guide">CBC Teacher Guide</option>
                  <option value="Supplementary Reader">Supplementary Reader</option>
                  <option value="Encyclopedia">Encyclopedia</option>
                  <option value="Fiction Storybook">Fiction Storybook</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Copies</label>
                <input
                  type="number"
                  value={newCopies}
                  onChange={(e) => setNewCopies(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setShowAddBookModal(false)} className="px-3 py-1.5 text-xs text-slate-600 font-bold">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newTitle || !newAuthor) return;
                  handleAddBook({
                    id: `bk-${Date.now()}`,
                    title: newTitle,
                    author: newAuthor,
                    isbn: newIsbn,
                    publisher: newPublisher,
                    category: newCategory,
                    copiesAvailable: newCopies,
                    totalCopies: newCopies,
                    locationShelf: newShelf
                  });
                  setShowAddBookModal(false);
                  setNewTitle('');
                }}
                className="px-4 py-1.5 bg-purple-600 text-white font-black text-xs rounded-lg"
              >
                Save Title
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
